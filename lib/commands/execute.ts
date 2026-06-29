import type { CLIResponse } from "@/lib/types";
import { parse } from "@/lib/parser";
import { authorize, getTokenInfo } from "@/lib/auth";
import { getState, addAuditEntry } from "@/lib/store";
import { findHandler, getAvailableResources, getAvailableActions } from "./registry";

/**
 * Orquestador principal del CLI.
 *
 * Recibe el string crudo del comando y devuelve un CLIResponse estable.
 * Es el único punto de entrada: el route handler /api/cli solo llama a esto.
 *
 * Flujo completo (cada paso puede cortar con un error accionable):
 *
 *   string crudo
 *      │
 *      ▼
 *   1. parse()        → { resource, action, positionals, flags }
 *      │
 *   2. ¿login?        → caso especial: valida y devuelve el token sin pasar por authorize
 *      │
 *   3. resolver token → flags.token gana, si no usa el de sesión
 *      │
 *   4. authorize()    → valida token + permisos (lectura/escritura)
 *      │
 *   5. findHandler()  → busca el comando; si no existe, error con sugerencias
 *      │
 *   6. handler()      → ejecuta la lógica del comando sobre el store
 *      │
 *   7. addAuditEntry()→ registra el comando ejecutado (guardrail)
 *      │
 *      ▼
 *   CLIResponse  (ok, command, data, message, error, dryRun)
 *
 * @param input        comando crudo, ej: 'fanz events list --json'
 * @param sessionToken token guardado por la web terminal tras `fanz login`
 */
export function execute(input: string, sessionToken?: string): CLIResponse {
  const parsed = parse(input);
  const { resource, action, positionals, flags } = parsed;

  // ── 1. Comando vacío ──
  if (!resource) {
    return {
      ok: false,
      command: "",
      error:
        'Empty command. Try "fanz events list" or "fanz login --token mock_admin". Run "fanz help" for the full list.',
    };
  }

  // ── 2. Caso especial: help ──
  // help es informativo (no opera sobre el dominio ni requiere token). Se
  // construye desde el registry, así siempre refleja los comandos reales.
  if (resource === "help") {
    return handleHelp();
  }

  // ── 3. Caso especial: login ──
  // login no opera sobre el dominio, solo valida un token y lo devuelve para
  // que la web terminal lo guarde en sesión. No pasa por authorize().
  if (resource === "login") {
    return handleLogin(flags);
  }

  // El nombre canónico del comando, para el response y el audit log.
  const command = action ? `${resource} ${action}` : resource;

  // ── 3. Resolver el token ──
  // El flag --token tiene prioridad sobre el token de sesión. Esto permite
  // tanto `fanz login` (sesión) como pasar --token en cada comando (agentes).
  const flagToken = typeof flags.token === "string" ? flags.token : undefined;
  const token = flagToken ?? sessionToken;

  // ── 4. Autorización (token válido + permisos) ──
  const auth = authorize(token, resource, action);
  if (!auth.authorized) {
    return { ok: false, command, error: auth.error };
  }

  // ── 5. Buscar el handler ──
  const handler = findHandler(resource, action);
  if (!handler) {
    return { ok: false, command, error: buildNotFoundError(resource, action) };
  }

  // ── 6. Ejecutar el comando ──
  const state = getState();
  const result = handler({ parsed, tokenInfo: auth.tokenInfo, state });

  // ── 7. Audit log: registrar el comando ejecutado ──
  // Solo se auditan comandos que pasaron auth y corrieron un handler (lo que el
  // brief llama "comandos ejecutados"). Los rechazos de auth/comandos inexistentes
  // no llegan acá. Registra éxito o fallo de negocio (ej: validación fallida).
  addAuditEntry(state, {
    token: auth.tokenInfo.token,
    role: auth.tokenInfo.role,
    command,
    args: positionals,
    flags,
    success: result.ok,
    error: result.error,
  });

  // ── 8. Envolver en el CLIResponse final ──
  return {
    ok: result.ok,
    command,
    data: result.data,
    message: result.message,
    error: result.error,
    dryRun: result.dryRun,
  };
}

/**
 * Maneja `fanz login --token <token>`.
 * Valida el token y, si es válido, lo devuelve para guardarlo en sesión.
 */
function handleLogin(flags: Record<string, string | boolean>): CLIResponse {
  const command = "login";
  const token = typeof flags.token === "string" ? flags.token : undefined;

  if (!token) {
    return {
      ok: false,
      command,
      error:
        'login requires a token. Usage: fanz login --token <token>. Available: mock_admin (read+write), mock_readonly (read only).',
    };
  }

  const tokenInfo = getTokenInfo(token);
  if (!tokenInfo) {
    return {
      ok: false,
      command,
      error: `Invalid token "${token}". Available tokens: mock_admin (read+write), mock_readonly (read only).`,
    };
  }

  return {
    ok: true,
    command,
    data: { token: tokenInfo.token, role: tokenInfo.role, accountId: tokenInfo.accountId },
    message: `Logged in as ${tokenInfo.role} (account ${tokenInfo.accountId}). Token saved for this session.`,
  };
}

/**
 * Construye un error accionable cuando no se encuentra el comando.
 * Distingue entre "el recurso no existe" y "el recurso existe pero la acción no".
 */
function buildNotFoundError(resource: string, action: string): string {
  const resources = getAvailableResources();

  // ¿El recurso ni siquiera existe?
  if (!resources.includes(resource)) {
    return `Unknown resource "${resource}". Available resources: ${resources.join(", ")}.`;
  }

  // El recurso existe pero la acción no
  const actions = getAvailableActions(resource);
  if (!action) {
    return `Missing action for "${resource}". Available actions: ${actions.join(", ")}.`;
  }

  return `Unknown action "${action}" for "${resource}". Available actions: ${actions.join(", ")}.`;
}

/**
 * Construye la ayuda del CLI a partir del registry, así nunca queda
 * desactualizada respecto de los comandos que existen de verdad.
 */
function handleHelp(): CLIResponse {
  const commands: Record<string, string[]> = {};
  for (const resource of getAvailableResources()) {
    commands[resource] = getAvailableActions(resource);
  }

  return {
    ok: true,
    command: "help",
    data: {
      commands,
      special: ["login --token <token>", "help"],
      tokens: {
        mock_admin: "read + write",
        mock_readonly: "read only",
      },
      flags: {
        "--json": "stable JSON output (for agents)",
        "--dry-run": "preview a write action without applying it",
        "--yes": "confirm a destructive delete",
      },
      examples: [
        "fanz login --token mock_admin",
        'fanz events create --name "Fiesta Demo" --status published',
        "fanz dates create --event EVT_1 --datetime 2026-07-20T20:00:00Z --venue \"Luna Park\"",
        "fanz tickets create --date DATE_1 --name General --price 15000 --stock 500",
        "fanz discounts create --event EVT_1 --code DEMO20 --percent 20",
        "fanz sales stats --event EVT_1",
        "fanz actions pause --event EVT_1",
        "fanz audit list --limit 5",
      ],
    },
    message: "Fanz CLI — available commands, tokens and examples.",
  };
}
