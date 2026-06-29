import type { AuditLogEntry, TokenRole } from "@/lib/types";
import type { StoreState } from "../state";
import { generateId } from "../helpers/id";

export function getAuditLog(state: StoreState): AuditLogEntry[] {
  return state.auditLog;
}

export function addAuditEntry(
  state: StoreState,
  data: {
    token: string;
    role: TokenRole;
    command: string;
    args: string[];
    flags: Record<string, string | boolean>;
    success: boolean;
    error?: string;
  }
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: generateId("AUD"),
    token: data.token,
    role: data.role,
    command: data.command,
    args: data.args,
    flags: data.flags,
    timestamp: new Date().toISOString(),
    success: data.success,
    error: data.error,
  };
  state.auditLog.push(entry);
  return entry;
}
