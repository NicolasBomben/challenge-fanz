import type { ParsedCommand, TokenInfo } from "@/lib/types";
import type { StoreState } from "@/lib/store";

export interface CommandContext {
  parsed: ParsedCommand;
  tokenInfo: TokenInfo;
  state: StoreState;
}

export interface CommandResult {
  ok: boolean;
  data?: unknown;
  message?: string;
  error?: string;
  dryRun?: boolean;
}

export type CommandHandler = (ctx: CommandContext) => CommandResult;
