import type { ParsedCommand } from "@/lib/types";

//Helpers para leer flags y argumentos de forma segura y consistente.

export function readString(
  flags: Record<string, string | boolean>,
  name: string,
): string | undefined {
  const value = flags[name];
  return typeof value === "string" ? value : undefined;
}

export function readNumber(
  flags: Record<string, string | boolean>,
  name: string,
): { value?: number; error?: string } {
  const raw = flags[name];

  if (raw === undefined) return { value: undefined };
  if (typeof raw === "boolean") {
    return {
      error: `Flag --${name} requires a numeric value (e.g. --${name} 100).`,
    };
  }

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    return { error: `Flag --${name} must be a number, got "${raw}".` };
  }

  return { value: parsed };
}

export function readBoolean(
  flags: Record<string, string | boolean>,
  name: string,
): { value?: boolean; error?: string } {
  const raw = flags[name];

  if (raw === undefined) return { value: undefined };
  if (raw === true) return { value: true };

  const normalized = String(raw).toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return { value: true };
  if (["false", "0", "no"].includes(normalized)) return { value: false };

  return { error: `Flag --${name} must be true or false, got "${raw}".` };
}

export function resolveId(
  parsed: ParsedCommand,
  position?: number,
): string | undefined {
  const { positionals } = parsed;
  const fromPositional =
    position !== undefined
      ? positionals[position]
      : positionals[positionals.length - 1];
  return fromPositional ?? readString(parsed.flags, "id");
}

export function validateEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fieldName: string,
): { value?: T; error?: string } {
  if (value === undefined) return { value: undefined };

  if (!allowed.includes(value as T)) {
    return {
      error: `Invalid ${fieldName} "${value}". Allowed values: ${allowed.join(", ")}.`,
    };
  }

  return { value: value as T };
}

export function validateDateTime(
  value: string | undefined,
  fieldName: string,
  opts: { mustBeFuture?: boolean } = {},
): { value?: string; error?: string } {
  if (value === undefined) return { value: undefined };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      error: `Invalid ${fieldName} "${value}". Use ISO 8601, e.g. 2026-07-20 or 2026-07-20T20:00:00Z.`,
    };
  }

  if (opts.mustBeFuture && date.getTime() <= Date.now()) {
    return { error: `${fieldName} must be in the future, got "${value}".` };
  }

  return { value: date.toISOString() };
}
