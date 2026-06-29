export interface ParsedCommand {
  resource: string;
  action: string;
  positionals: string[];
  flags: Record<string, string | boolean>;
}
