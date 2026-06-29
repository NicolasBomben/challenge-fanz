import type { ParsedCommand, TokenInfo } from "@/lib/types";
import type { StoreState } from "@/lib/store";

/**
 * Contexto que recibe cada handler de comando.
 *
 * En vez de que cada comando acceda al store global o parsee el token por su
 * cuenta, el orquestador (execute.ts) arma este contexto y se lo inyecta. Así
 * cada handler es una función pura y predecible: mismas entradas → misma salida.
 *
 *   - parsed: el comando ya parseado (resource, action, positionals, flags)
 *   - tokenInfo: quién ejecuta (rol + cuenta) — ya validado por auth
 *   - state: el estado mock sobre el que opera
 */
export interface CommandContext {
  parsed: ParsedCommand;
  tokenInfo: TokenInfo;
  state: StoreState;
}

/**
 * Lo que devuelve un handler. El orquestador lo envuelve en un CLIResponse
 * final (agregando el nombre canónico del comando).
 *
 *   - ok: ¿la operación tuvo éxito?
 *   - data: el payload (un evento, una lista, stats, etc.) — parseable por agentes
 *   - message: texto legible para humanos (resumen de lo que pasó)
 *   - error: mensaje accionable cuando ok === false
 *   - dryRun: true si la operación se simuló sin ejecutarse
 */
export interface CommandResult {
  ok: boolean;
  data?: unknown;
  message?: string;
  error?: string;
  dryRun?: boolean;
}

/**
 * La firma de todo handler de comando: recibe contexto, devuelve resultado.
 */
export type CommandHandler = (ctx: CommandContext) => CommandResult;
