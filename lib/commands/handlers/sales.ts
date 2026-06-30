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
import {
  readString,
  validateEnum,
  requireEntity,
  requireRef,
} from "../helpers";

//Devuelve las órdenes y los tipos de ticket de ese scope, ya validado (si se
//pasa un --event/--date inexistente, devuelve el error accionable). Lo usan
//tanto `sales list` como `sales stats`
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

//Lista órdenes con filtros opcionales. Solo lectura.
function listSales(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const scope = resolveScope(ctx);
  if (!scope.ok) return scope.error;

  let orders = scope.orders;

  const status = validateEnum(
    readString(flags, "status"),
    ORDER_STATUSES,
    "status",
  );
  if (status.error) return { ok: false, error: status.error };
  if (status.value !== undefined) {
    orders = orders.filter((o) => o.status === status.value);
  }

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

//Devuelve el detalle completo de una orden (estado de la orden), enriquecido.
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
      date: date
        ? { id: date.id, datetime: date.datetime, venue: date.venue }
        : null,
    },
    message: `Order ${order.id} is ${order.status}. Total: ${order.total}.`,
  };
}

//Agregaciones del scope: revenue, desglose de órdenes por estado, inventario
//(stock/vendidos/restante) y top compradores. Solo lectura.

function salesStats(ctx: CommandContext): CommandResult {
  const scope = resolveScope(ctx);
  if (!scope.ok) return scope.error;

  const { orders, tickets, label } = scope;

  const completed = orders.filter((o) => o.status === "completed");
  const revenue = completed.reduce((sum, o) => sum + o.total, 0);

  const ordersByStatus = {
    total: orders.length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    refunded: orders.filter((o) => o.status === "refunded").length,
  };

  const stock = tickets.reduce((sum, t) => sum + t.stock, 0);
  const sold = tickets.reduce((sum, t) => sum + t.sold, 0);
  const inventory = {
    stock,
    sold,
    remaining: stock - sold,
  };

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
    data: {
      scope: label,
      revenue,
      orders: ordersByStatus,
      inventory,
      topBuyers,
    },
    message: `Stats for ${label}: revenue ${revenue}, ${ordersByStatus.completed} completed order(s), ${inventory.sold}/${inventory.stock} tickets sold.`,
  };
}

export const salesCommands: Record<string, CommandHandler> = {
  list: listSales,
  get: getSale,
  stats: salesStats,
};
