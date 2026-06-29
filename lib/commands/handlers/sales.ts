import type { Order, TicketType } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";
import {
  getAllOrders,
  getOrderById,
  getOrdersByEvent,
  getOrdersByEventDate,
  getEventById,
  getEventDateById,
  getBuyerById,
  getTicketTypesByEvent,
  getTicketTypesByEventDate,
} from "@/lib/store";
import type { CommandContext, CommandResult, CommandHandler } from "../types";
import { readString, validateEnum, requireEntity, requireRef } from "../helpers";

/**
 * Resuelve el "scope" de una consulta de ventas a partir de los flags:
 *   --date <DATE_id>  → solo esa función
 *   --event <EVT_id>  → todo el evento
 *   (sin filtro)      → toda la cuenta
 *
 * Devuelve las órdenes y los tipos de ticket de ese scope, ya validado (si se
 * pasa un --event/--date inexistente, devuelve el error accionable). Lo usan
 * tanto `sales list` como `sales stats`, así la lógica de scope vive en un lugar.
 */
type Scope =
  | { ok: true; orders: Order[]; tickets: TicketType[]; label: string }
  | { ok: false; error: CommandResult };

function resolveScope(ctx: CommandContext): Scope {
  const { flags } = ctx.parsed;

  if (readString(flags, "date") !== undefined) {
    const ref = requireRef(ctx, "date", getEventDateById, "date");
    if (!ref.ok) return { ok: false, error: ref.error };
    return {
      ok: true,
      orders: getOrdersByEventDate(ctx.state, ref.id),
      tickets: getTicketTypesByEventDate(ctx.state, ref.id),
      label: `date ${ref.id}`,
    };
  }

  if (readString(flags, "event") !== undefined) {
    const ref = requireRef(ctx, "event", getEventById, "event");
    if (!ref.ok) return { ok: false, error: ref.error };
    return {
      ok: true,
      orders: getOrdersByEvent(ctx.state, ref.id),
      tickets: getTicketTypesByEvent(ctx.state, ref.id),
      label: `event ${ref.id}`,
    };
  }

  return {
    ok: true,
    orders: getAllOrders(ctx.state),
    tickets: ctx.state.ticketTypes,
    label: "account",
  };
}

/**
 * fanz sales list [--event <EVT_id>] [--date <DATE_id>] [--status <status>] [--buyer <BUY_id>]
 *
 * Lista órdenes con filtros opcionales. Solo lectura. Devuelve las órdenes y un
 * resumen (cantidad + revenue del set filtrado) en el mensaje.
 */
function listSales(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const scope = resolveScope(ctx);
  if (!scope.ok) return scope.error;

  let orders = scope.orders;

  // Filtro por estado de orden
  const status = validateEnum(readString(flags, "status"), ORDER_STATUSES, "status");
  if (status.error) return { ok: false, error: status.error };
  if (status.value !== undefined) {
    orders = orders.filter((o) => o.status === status.value);
  }

  // Filtro por comprador
  const buyer = readString(flags, "buyer");
  if (buyer !== undefined) {
    orders = orders.filter((o) => o.buyerId === buyer);
  }

  const revenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.total, 0);

  return {
    ok: true,
    data: orders,
    message: `Found ${orders.length} order(s) for ${scope.label}. Completed revenue: ${revenue}.`,
  };
}

/**
 * fanz sales get <ORD_id>
 *
 * Devuelve el detalle completo de una orden (estado de la orden), enriquecido
 * con el comprador y el evento/fecha. Solo lectura.
 */
function getSale(ctx: CommandContext): CommandResult {
  const found = requireEntity(ctx, getOrderById, "order");
  if (!found.ok) return found.error;
  const order = found.entity;

  const buyer = getBuyerById(ctx.state, order.buyerId);
  const event = getEventById(ctx.state, order.eventId);
  const date = getEventDateById(ctx.state, order.eventDateId);

  return {
    ok: true,
    data: {
      order,
      buyer: buyer ?? null,
      event: event ? { id: event.id, name: event.name } : null,
      date: date ? { id: date.id, datetime: date.datetime, venue: date.venue } : null,
    },
    message: `Order ${order.id} is ${order.status}. Total: ${order.total}.`,
  };
}

/**
 * fanz sales stats [--event <EVT_id>] [--date <DATE_id>]
 *
 * Agregaciones del scope: revenue, desglose de órdenes por estado, inventario
 * (stock/vendidos/restante) y top compradores. Solo lectura.
 */
function salesStats(ctx: CommandContext): CommandResult {
  const scope = resolveScope(ctx);
  if (!scope.ok) return scope.error;

  const { orders, tickets, label } = scope;

  // Revenue: solo órdenes completadas
  const completed = orders.filter((o) => o.status === "completed");
  const revenue = completed.reduce((sum, o) => sum + o.total, 0);

  // Desglose de órdenes por estado
  const ordersByStatus = {
    total: orders.length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    refunded: orders.filter((o) => o.status === "refunded").length,
  };

  // Inventario: stock total, vendidos (tickets emitidos) y restante
  const stock = tickets.reduce((sum, t) => sum + t.stock, 0);
  const sold = tickets.reduce((sum, t) => sum + t.sold, 0);
  const inventory = {
    stock,
    sold, // tickets emitidos
    remaining: stock - sold,
  };

  // Top compradores: agregamos las órdenes completadas por comprador
  const byBuyer = new Map<string, { orders: number; spent: number }>();
  for (const order of completed) {
    const entry = byBuyer.get(order.buyerId) ?? { orders: 0, spent: 0 };
    entry.orders += 1;
    entry.spent += order.total;
    byBuyer.set(order.buyerId, entry);
  }

  const topBuyers = [...byBuyer.entries()]
    .map(([buyerId, agg]) => {
      const buyer = getBuyerById(ctx.state, buyerId);
      return {
        buyerId,
        name: buyer?.name ?? null,
        email: buyer?.email ?? null,
        orders: agg.orders,
        spent: agg.spent,
      };
    })
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  return {
    ok: true,
    data: { scope: label, revenue, orders: ordersByStatus, inventory, topBuyers },
    message: `Stats for ${label}: revenue ${revenue}, ${ordersByStatus.completed} completed order(s), ${inventory.sold}/${inventory.stock} tickets sold.`,
  };
}

/**
 * Mapa de acciones del recurso "sales", consumido por el registry central.
 * Todo es solo lectura: accesible también con mock_readonly.
 */
export const salesCommands: Record<string, CommandHandler> = {
  list: listSales,
  get: getSale,
  stats: salesStats,
};
