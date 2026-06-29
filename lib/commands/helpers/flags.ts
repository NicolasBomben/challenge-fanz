import type { ParsedCommand } from "@/lib/types";

/**
 * Helpers para leer flags y argumentos de forma segura y consistente.
 *
 * ¿Por qué centralizar esto?
 *   - Los flags vienen como Record<string, string | boolean> (del parser).
 *   - Cada comando necesita leerlos con el tipo correcto (string, number) y
 *     validar errores de forma uniforme.
 *   - Sin esto, cada handler repetiría el mismo casteo y validación → bugs y
 *     mensajes de error inconsistentes.
 *
 * Estos helpers se usan en TODOS los CRUD (events, dates, tickets, discounts).
 */

/**
 * Lee un flag como string. Devuelve undefined si no está presente o si es
 * booleano (ej: el usuario escribió "--name" sin valor).
 */
export function readString(
  flags: Record<string, string | boolean>,
  name: string
): string | undefined {
  const value = flags[name];
  return typeof value === "string" ? value : undefined;
}

/**
 * Lee un flag como número.
 *   - No presente            → { value: undefined }
 *   - Presente pero inválido → { error: "..." }  (ej: --price abc)
 *   - Presente y válido      → { value: 12000 }
 *
 * Devolvemos un objeto (no lanzamos) para que el handler decida el mensaje
 * de error accionable según el contexto.
 */
export function readNumber(
  flags: Record<string, string | boolean>,
  name: string
): { value?: number; error?: string } {
  const raw = flags[name];

  if (raw === undefined) return { value: undefined };
  if (typeof raw === "boolean") {
    return { error: `Flag --${name} requires a numeric value (e.g. --${name} 100).` };
  }

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    return { error: `Flag --${name} must be a number, got "${raw}".` };
  }

  return { value: parsed };
}

/**
 * Lee un flag como booleano. Acepta tanto la forma "bandera" como con valor:
 *   --active            → true   (bandera sola)
 *   --active true/1/yes → true
 *   --active false/0/no → false
 *   (no presente)       → { value: undefined }
 *   --active maybe       → { error: "..." }
 */
export function readBoolean(
  flags: Record<string, string | boolean>,
  name: string
): { value?: boolean; error?: string } {
  const raw = flags[name];

  if (raw === undefined) return { value: undefined };
  if (raw === true) return { value: true };

  const normalized = String(raw).toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return { value: true };
  if (["false", "0", "no"].includes(normalized)) return { value: false };

  return { error: `Flag --${name} must be true or false, got "${raw}".` };
}

/**
 * Resuelve el ID de la entidad sobre la que se opera. Prioriza el posicional,
 * con fallback al flag --id.
 *
 * Por defecto toma el ÚLTIMO posicional. ¿Por qué el último y no el primero?
 * Porque permite soportar dos formas del mismo comando sin ambigüedad:
 *   fanz tickets update TCK_1            → "TCK_1" (forma corta)
 *   fanz tickets update EVT_123 TCK_1    → "TCK_1" (forma del PDF, con el evento adelante)
 * En ambos casos el id de la entidad es el último posicional. Para recursos con
 * un solo posicional (events, dates) el último coincide con el primero.
 *
 * @param position si se especifica, fuerza ese índice en vez del último
 */
export function resolveId(parsed: ParsedCommand, position?: number): string | undefined {
  const { positionals } = parsed;
  const fromPositional =
    position !== undefined ? positionals[position] : positionals[positionals.length - 1];
  return fromPositional ?? readString(parsed.flags, "id");
}

/**
 * Valida que un valor pertenezca a un set de opciones permitidas (enum).
 *   - No presente   → { value: undefined } (el handler decide si es requerido)
 *   - Inválido      → { error: "..." } con las opciones válidas
 *   - Válido        → { value }
 */
export function validateEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fieldName: string
): { value?: T; error?: string } {
  if (value === undefined) return { value: undefined };

  if (!allowed.includes(value as T)) {
    return {
      error: `Invalid ${fieldName} "${value}". Allowed values: ${allowed.join(", ")}.`,
    };
  }

  return { value: value as T };
}

/**
 * Valida una fecha/hora en formato ISO 8601 y la normaliza a ISO string.
 *   - No presente       → { value: undefined }
 *   - Formato inválido  → { error: "..." }
 *   - Pasada (si future)→ { error: "..." }  (regla de negocio: no vender funciones pasadas)
 *   - Válida            → { value: "2026-07-20T20:00:00.000Z" }
 *
 * @param opts.mustBeFuture si true, exige que la fecha sea posterior a ahora
 */
export function validateDateTime(
  value: string | undefined,
  fieldName: string,
  opts: { mustBeFuture?: boolean } = {}
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
