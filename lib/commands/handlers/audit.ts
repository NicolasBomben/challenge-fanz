import type { AuditLogEntry } from "@/lib/types";
import { getAuditLog } from "@/lib/store";
import type { CommandContext, CommandResult, CommandHandler } from "../types";
import { readString, readNumber, wantsDryRun } from "../helpers";

const DEFAULT_LIMIT = 20;

/**
 * fanz audit list [--actor <token>] [--command <resource>] [--failed] [--limit N]
 *
 * Muestra el log de comandos ejecutados, del más reciente al más antiguo.
 * Solo lectura. Filtros opcionales:
 *   --actor   <token>     solo comandos ejecutados por ese token
 *   --command <resource>  solo comandos de ese recurso (ej: events, tickets)
 *   --failed              solo comandos que fallaron
 *   --limit   N           cuántas entradas mostrar (default 20)
 *
 * Nota: el filtro es --actor y NO --token, porque --token está reservado para la
 * autenticación (lo consume el orquestador). Reusarlo acá colisionaría.
 *
 * Por qué un límite por defecto: el log crece sin tope en memoria; devolverlo
 * entero sería ruidoso para un agente. El default acota a lo más reciente.
 */
function listAudit(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  // Más reciente primero (el log se llena en orden de ejecución)
  let entries: AuditLogEntry[] = [...getAuditLog(ctx.state)].reverse();

  const actor = readString(flags, "actor");
  if (actor !== undefined) {
    entries = entries.filter((e) => e.token === actor);
  }

  const command = readString(flags, "command");
  if (command !== undefined) {
    entries = entries.filter((e) => e.command.startsWith(command));
  }

  if (flags["failed"] === true) {
    entries = entries.filter((e) => !e.success);
  }

  const totalMatching = entries.length;

  const limitFlag = readNumber(flags, "limit");
  if (limitFlag.error) return { ok: false, error: limitFlag.error };
  const limit = limitFlag.value ?? DEFAULT_LIMIT;
  if (limit < 0) return { ok: false, error: `--limit must be >= 0, got ${limit}.` };

  const limited = entries.slice(0, limit);

  const note =
    totalMatching > limited.length
      ? ` (showing ${limited.length} of ${totalMatching}; use --limit to see more)`
      : "";

  return {
    ok: true,
    data: limited,
    message: `${totalMatching} audit entr${totalMatching === 1 ? "y" : "ies"} matched${note}.`,
  };
}

/**
 * Mapa de acciones del recurso "audit", consumido por el registry central.
 * Solo lectura (audit list). El flag --dry-run no aplica a un comando de lectura,
 * pero lo dejamos explícito para no confundir.
 */
function auditListGuarded(ctx: CommandContext): CommandResult {
  if (wantsDryRun(ctx.parsed.flags)) {
    return { ok: false, error: "audit list is read-only; --dry-run does not apply." };
  }
  return listAudit(ctx);
}

export const auditCommands: Record<string, CommandHandler> = {
  list: auditListGuarded,
};
