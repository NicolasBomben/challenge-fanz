import type { CommandResult } from "../types";

//Helpers de guardrails
export function wantsDryRun(flags: Record<string, string | boolean>): boolean {
  return flags["dry-run"] === true;
}

export function isConfirmed(flags: Record<string, string | boolean>): boolean {
  return flags["yes"] === true;
}

export function dryRunResult(action: string, preview: unknown): CommandResult {
  return {
    ok: true,
    dryRun: true,
    data: preview,
    message: `[dry-run] Would ${action}. Nothing was changed. Re-run without --dry-run to apply.`,
  };
}

export function requireConfirmation(
  flags: Record<string, string | boolean>,
  target: string,
): CommandResult | null {
  if (isConfirmed(flags) || wantsDryRun(flags)) {
    return null;
  }

  return {
    ok: false,
    error: `This will permanently delete ${target}. Add --yes to confirm, or --dry-run to preview what would be deleted.`,
  };
}
