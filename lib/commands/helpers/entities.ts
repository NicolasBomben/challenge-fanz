import type { CommandContext, CommandResult } from "../types";
import type { StoreState } from "@/lib/store";
import { resolveId, readString } from "./flags";

/**
 * Resultado de requireEntity: o encontramos la entidad, o tenemos un error listo
 * para devolver. Es una "discriminated union": el campo `ok` decide qué forma tiene.
 */
export type RequireEntityResult<T> =
  | { ok: true; id: string; entity: T }
  | { ok: false; error: CommandResult };

/**
 * Guard reutilizable para comandos que operan sobre una entidad existente
 * (get, update, delete de cualquier recurso).
 *
 * Reemplaza este bloque repetido en cada handler:
 *
 *   const id = resolveId(ctx.parsed);
 *   if (!id) return { ok: false, error: "... requires an id ..." };
 *   const entity = getById(ctx.state, id);
 *   if (!entity) return { ok: false, error: `... "${id}" not found ...` };
 *
 * Por este:
 *
 *   const found = requireEntity(ctx, getEventById, "event");
 *   if (!found.ok) return found.error;
 *   const event = found.entity;
 *
 * Los mensajes de error se derivan del contexto (resource + action), así siguen
 * siendo accionables sin tener que repetirlos en cada handler.
 *
 * @param getById  función del repository que busca por id (state, id) => T | undefined
 * @param label    nombre singular legible de la entidad, ej: "event"
 * @param position fuerza un índice de posicional; por defecto usa el último (ver resolveId)
 */
export function requireEntity<T>(
  ctx: CommandContext,
  getById: (state: StoreState, id: string) => T | undefined,
  label: string,
  position?: number
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

/**
 * Guard para resolver una entidad PADRE referenciada por un flag, no por el
 * posicional. Lo usan los recursos anidados: `dates create --event EVT_1`,
 * `tickets create --date DATE_1`, etc.
 *
 * Diferencia con requireEntity: aquel resuelve la entidad sobre la que se opera
 * (id posicional); este resuelve una referencia a otra entidad vía --flag.
 *
 *   const ref = requireRef(ctx, "event", getEventById, "event");
 *   if (!ref.ok) return ref.error;
 *   // ref.id, ref.entity → el evento padre
 *
 * @param flagName nombre del flag que lleva el id, ej: "event"
 * @param getById  función del repository que busca por id
 * @param label    nombre singular legible de la entidad referenciada
 */
export function requireRef<T>(
  ctx: CommandContext,
  flagName: string,
  getById: (state: StoreState, id: string) => T | undefined,
  label: string
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
