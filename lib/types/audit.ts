import type { TokenRole } from "./enums";

export interface AuditLogEntry {
  id: string;
  token: string;
  role: TokenRole;
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  timestamp: string;
  success: boolean;
  error?: string;
}
