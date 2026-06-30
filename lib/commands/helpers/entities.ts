import type { CommandContext, CommandResult } from "../types";
import type { StoreState } from "@/lib/store";
import { resolveId, readString } from "./flags";

export type RequireEntityResult<T> =
  | { ok: true; id: string; entity: T }
  | { ok: false; error: CommandResult };

export function requireEntity<T>(
  ctx: CommandContext,
  getById: (state: StoreState, id: string) => T | undefined,
  label: string,
  position?: number,
): RequireEntityResult<T> {
  const { resource, action } = ctx.parsed;

  const id = resolveId(ctx.parsed, position);
  if (!id) {
    return {
      ok: false,
      error: {
        ok: false,
        error: `Missing ${label} id for "${resource} ${action}". Usage: fanz ${resource} ${action} <id>.`,
      },
    };
  }

  const entity = getById(ctx.state, id);
  if (!entity) {
    const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
    return {
      ok: false,
      error: {
        ok: false,
        error: `${capitalized} "${id}" not found. Run "fanz ${resource} list" to see available ${label}s.`,
      },
    };
  }

  return { ok: true, id, entity };
}

export function requireRef<T>(
  ctx: CommandContext,
  flagName: string,
  getById: (state: StoreState, id: string) => T | undefined,
  label: string,
): RequireEntityResult<T> {
  const id = readString(ctx.parsed.flags, flagName);
  if (!id) {
    return {
      ok: false,
      error: {
        ok: false,
        error: `Missing --${flagName}. Provide the parent ${label} via --${flagName} <id>.`,
      },
    };
  }

  const entity = getById(ctx.state, id);
  if (!entity) {
    const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
    return {
      ok: false,
      error: {
        ok: false,
        error: `${capitalized} "${id}" not found (from --${flagName}).`,
      },
    };
  }

  return { ok: true, id, entity };
}
