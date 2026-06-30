import type { TicketType } from "@/lib/types";
import { TICKET_STATUSES } from "@/lib/types";
import {
  getEventDateById,
  getTicketTypesByEvent,
  getTicketTypesByEventDate,
  getTicketTypeById,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  getEventById,
} from "@/lib/store";
import type { CommandContext, CommandResult, CommandHandler } from "../types";
import {
  readString,
  readNumber,
  validateEnum,
  requireEntity,
  requireRef,
  wantsDryRun,
  requireConfirmation,
  dryRunResult,
} from "../helpers";

//Lista tipos de ticket. Por fecha (--date) o por evento entero (--event).
//Solo lectura.

function listTickets(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  if (readString(flags, "date") !== undefined) {
    const ref = requireRef(ctx, "date", getEventDateById, "date");
    if (!ref.ok) return ref.error;
    const tickets = getTicketTypesByEventDate(ctx.state, ref.id);
    return {
      ok: true,
      data: tickets,
      message: `Found ${tickets.length} ticket type(s) for date ${ref.id}.`,
    };
  }

  if (readString(flags, "event") !== undefined) {
    const ref = requireRef(ctx, "event", getEventById, "event");
    if (!ref.ok) return ref.error;
    const tickets = getTicketTypesByEvent(ctx.state, ref.id);
    return {
      ok: true,
      data: tickets,
      message: `Found ${tickets.length} ticket type(s) for event ${ref.id}.`,
    };
  }

  return {
    ok: false,
    error: "tickets list requires --date <DATE_id> or --event <EVT_id>.",
  };
}

//Devuelve un tipo de ticket por ID. Solo lectura.
function getTicket(ctx: CommandContext): CommandResult {
  const found = requireEntity(ctx, getTicketTypeById, "ticket");
  if (!found.ok) return found.error;

  return { ok: true, data: found.entity };
}

//Crea un tipo de ticket para una fecha. Escritura. Soporta --dry-run.
function createTicketCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const ref = requireRef(ctx, "date", getEventDateById, "date");
  if (!ref.ok) return ref.error;

  const name = readString(flags, "name");
  if (!name) {
    return {
      ok: false,
      error:
        'tickets create requires --name. Usage: fanz tickets create --date DATE_1 --name "General" --price 15000 --stock 500.',
    };
  }

  const price = readNumber(flags, "price");
  if (price.error) return { ok: false, error: price.error };
  if (price.value === undefined)
    return {
      ok: false,
      error: "tickets create requires --price (e.g. --price 15000).",
    };
  if (price.value < 0)
    return { ok: false, error: `price must be >= 0, got ${price.value}.` };

  const stock = readNumber(flags, "stock");
  if (stock.error) return { ok: false, error: stock.error };
  if (stock.value === undefined)
    return {
      ok: false,
      error: "tickets create requires --stock (e.g. --stock 500).",
    };
  if (stock.value < 0)
    return { ok: false, error: `stock must be >= 0, got ${stock.value}.` };

  const status = validateEnum(
    readString(flags, "status"),
    TICKET_STATUSES,
    "status",
  );
  if (status.error) return { ok: false, error: status.error };

  const data = {
    eventId: ref.entity.eventId,
    eventDateId: ref.id,
    name,
    price: price.value,
    stock: stock.value,
    status: status.value,
  };

  if (wantsDryRun(flags)) {
    return dryRunResult(`create ticket "${name}" for date ${ref.id}`, data);
  }

  const ticket = createTicketType(ctx.state, data);
  return {
    ok: true,
    data: ticket,
    message: `Ticket ${ticket.id} ("${ticket.name}") created for date ${ref.id}.`,
  };
}

//Actualiza un tipo de ticket. Escritura. Soporta --dry-run.
function updateTicketCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const found = requireEntity(ctx, getTicketTypeById, "ticket");
  if (!found.ok) return found.error;
  const { id, entity: ticket } = found;

  const changes: Partial<
    Pick<TicketType, "name" | "price" | "stock" | "status">
  > = {};

  const name = readString(flags, "name");
  if (name !== undefined) changes.name = name;

  const price = readNumber(flags, "price");
  if (price.error) return { ok: false, error: price.error };
  if (price.value !== undefined) {
    if (price.value < 0)
      return { ok: false, error: `price must be >= 0, got ${price.value}.` };
    changes.price = price.value;
  }

  const stock = readNumber(flags, "stock");
  if (stock.error) return { ok: false, error: stock.error };
  if (stock.value !== undefined) {
    if (stock.value < 0)
      return { ok: false, error: `stock must be >= 0, got ${stock.value}.` };
    changes.stock = stock.value;
  }

  const status = validateEnum(
    readString(flags, "status"),
    TICKET_STATUSES,
    "status",
  );
  if (status.error) return { ok: false, error: status.error };
  if (status.value !== undefined) changes.status = status.value;

  if (Object.keys(changes).length === 0) {
    return {
      ok: false,
      error:
        "tickets update requires at least one field to change: --name, --price, --stock, --status.",
    };
  }

  if (wantsDryRun(flags)) {
    if (changes.stock !== undefined && changes.stock < ticket.sold) {
      return {
        ok: false,
        error: `Cannot set stock to ${changes.stock}: already sold ${ticket.sold} tickets. Minimum stock is ${ticket.sold}.`,
      };
    }
    return dryRunResult(`update ticket ${id}`, { id, changes });
  }

  const result = updateTicketType(ctx.state, id, changes);
  if (result.error) return { ok: false, error: result.error };

  return {
    ok: true,
    data: result.ticketType,
    message: `Ticket ${id} updated.`,
  };
}

//Borra un tipo de ticket. Destructivo. Si tiene ventas, lo informa en  guardrail.
function deleteTicketCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const found = requireEntity(ctx, getTicketTypeById, "ticket");
  if (!found.ok) return found.error;
  const { id, entity: ticket } = found;

  const soldNote =
    ticket.sold > 0
      ? ` It has ${ticket.sold} sold ticket(s); historical orders are kept`
      : "";

  if (wantsDryRun(flags)) {
    return dryRunResult(`delete ticket ${id} ("${ticket.name}")`, { ticket });
  }

  const blocked = requireConfirmation(
    flags,
    `ticket ${id} ("${ticket.name}").${soldNote}`,
  );
  if (blocked) return blocked;

  deleteTicketType(ctx.state, id);
  return {
    ok: true,
    data: { id, deleted: true },
    message: `Ticket ${id} deleted.`,
  };
}

export const ticketCommands: Record<string, CommandHandler> = {
  list: listTickets,
  get: getTicket,
  create: createTicketCmd,
  update: updateTicketCmd,
  delete: deleteTicketCmd,
};
