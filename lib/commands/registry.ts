import type { CommandHandler } from "./types";
import { eventCommands } from "./handlers/events";
import { dateCommands } from "./handlers/dates";
import { ticketCommands } from "./handlers/tickets";
import { discountCommands } from "./handlers/discounts";
import { salesCommands } from "./handlers/sales";
import { buyerCommands } from "./handlers/buyers";
import { actionCommands } from "./handlers/actions";
import { auditCommands } from "./handlers/audit";

/**
 * Registry central de comandos.
 *
 * Estructura: resource → action → handler
 *   registry["events"]["list"] → listEvents
 *
 * ¿Por qué un registry y no un switch gigante?
 *   - Agregar un comando nuevo es agregar una entrada, no tocar lógica de dispatch
 *   - Permite descubrir qué recursos/acciones existen (para errores accionables:
 *     "action 'lst' not found, did you mean: list, get, create?")
 *   - Cada recurso vive en su propio archivo, el registry solo los compone
 *
 * En los Pasos 7-12 se van sumando: dates, tickets, discounts, sales, actions.
 */
export const registry: Record<string, Record<string, CommandHandler>> = {
  events: eventCommands,
  dates: dateCommands,
  tickets: ticketCommands,
  discounts: discountCommands,
  sales: salesCommands,
  buyers: buyerCommands,
  actions: actionCommands,
  audit: auditCommands,
};

/** Lista los recursos disponibles (para mensajes de error). */
export function getAvailableResources(): string[] {
  return Object.keys(registry);
}

/** Lista las acciones disponibles para un recurso (para mensajes de error). */
export function getAvailableActions(resource: string): string[] {
  const resourceCommands = registry[resource];
  return resourceCommands ? Object.keys(resourceCommands) : [];
}

/** Busca un handler. Devuelve undefined si el recurso o la acción no existen. */
export function findHandler(resource: string, action: string): CommandHandler | undefined {
  return registry[resource]?.[action];
}
