/**
 * Enums del dominio.
 *
 * Patrón: definimos el array de valores `as const` (fuente de verdad, usable en
 * runtime para validar) y derivamos el tipo union con `(typeof X)[number]`. Así
 * el array y el tipo NUNCA se desincronizan: agregar un valor al array lo agrega
 * al tipo automáticamente.
 *
 * Los handlers importan los arrays (EVENT_STATUSES, ...) para validar flags;
 * el resto del código importa los tipos (EventStatus, ...) para tipar.
 */

export const EVENT_STATUSES = ["draft", "published", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const SALE_STATUSES = ["active", "paused", "sold_out", "closed"] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const TICKET_STATUSES = ["active", "paused", "sold_out"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const ORDER_STATUSES = ["completed", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DISCOUNT_TYPES = ["percent", "fixed"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_SCOPES = ["event", "global"] as const;
export type DiscountScope = (typeof DISCOUNT_SCOPES)[number];

export const TOKEN_ROLES = ["admin", "readonly"] as const;
export type TokenRole = (typeof TOKEN_ROLES)[number];
