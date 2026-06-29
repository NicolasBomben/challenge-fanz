export interface CLIResponse {
  ok: boolean;
  command: string;
  data?: unknown;
  message?: string;
  error?: string;
  dryRun?: boolean;
}
