import type { CLIResponse } from "@/lib/types";
import { parse } from "@/lib/parser";
import { authorize, getTokenInfo } from "@/lib/auth";
import { getState, addAuditEntry } from "@/lib/store";
import {
  findHandler,
  getAvailableResources,
  getAvailableActions,
} from "./registry";

//Orquestador principal del CLI.
//Recibe el string crudo del comando y devuelve un CLIResponse estable.
//Es el único punto de entrada: el route handler /api/cli solo llama a esto.
export function execute(input: string, sessionToken?: string): CLIResponse {
  const parsed = parse(input);
  const { resource, action, positionals, flags } = parsed;

  if (!resource) {
    return {
      ok: false,
      command: "",
      error:
        'Empty command. Try "fanz events list" or "fanz login --token mock_admin". Run "fanz help" for the full list.',
    };
  }

  if (resource === "help") {
    return handleHelp();
  }

  if (resource === "login") {
    return handleLogin(flags);
  }

  const command = action ? `${resource} ${action}` : resource;

  const flagToken = typeof flags.token === "string" ? flags.token : undefined;
  const token = flagToken ?? sessionToken;

  const auth = authorize(token, resource, action);
  if (!auth.authorized) {
    return { ok: false, command, error: auth.error };
  }

  const handler = findHandler(resource, action);
  if (!handler) {
    return { ok: false, command, error: buildNotFoundError(resource, action) };
  }

  const state = getState();
  const result = handler({ parsed, tokenInfo: auth.tokenInfo, state });

  addAuditEntry(state, {
    token: auth.tokenInfo.token,
    role: auth.tokenInfo.role,
    command,
    args: positionals,
    flags,
    success: result.ok,
    error: result.error,
  });

  return {
    ok: result.ok,
    command,
    data: result.data,
    message: result.message,
    error: result.error,
    dryRun: result.dryRun,
  };
}

//Maneja `fanz login --token <token>`.
//Valida el token y, si es válido, lo devuelve para guardarlo en sesión.
function handleLogin(flags: Record<string, string | boolean>): CLIResponse {
  const command = "login";
  const token = typeof flags.token === "string" ? flags.token : undefined;

  if (!token) {
    return {
      ok: false,
      command,
      error:
        "login requires a token. Usage: fanz login --token <token>. Available: mock_admin (read+write), mock_readonly (read only).",
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
    data: {
      token: tokenInfo.token,
      role: tokenInfo.role,
      accountId: tokenInfo.accountId,
    },
    message: `Logged in as ${tokenInfo.role} (account ${tokenInfo.accountId}). Token saved for this session.`,
  };
}

function buildNotFoundError(resource: string, action: string): string {
  const resources = getAvailableResources();

  if (!resources.includes(resource)) {
    return `Unknown resource "${resource}". Available resources: ${resources.join(", ")}.`;
  }

  const actions = getAvailableActions(resource);
  if (!action) {
    return `Missing action for "${resource}". Available actions: ${actions.join(", ")}.`;
  }

  return `Unknown action "${action}" for "${resource}". Available actions: ${actions.join(", ")}.`;
}

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
        'fanz dates create --event EVT_1 --datetime 2026-07-20T20:00:00Z --venue "Luna Park"',
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
