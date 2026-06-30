import type { CommandContext, CommandResult, CommandHandler } from "../types";
import type { Event } from "@/lib/types";
import { EVENT_STATUSES, SALE_STATUSES } from "@/lib/types";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventDatesByEvent,
  getTicketTypesByEvent,
} from "@/lib/store";
import {
  readString,
  validateEnum,
  requireEntity,
  wantsDryRun,
  requireConfirmation,
  dryRunResult,
} from "../helpers";

//Lista todos los eventos de la cuenta. Solo lectura.
function listEvents(ctx: CommandContext): CommandResult {
  const events = getAllEvents(ctx.state);
  return {
    ok: true,
    data: events,
    message:
      events.length === 0
        ? "No events found."
        : `Found ${events.length} event(s).`,
  };
}

//Devuelve un evento por ID. Solo lectura.
function getEvent(ctx: CommandContext): CommandResult {
  const found = requireEntity(ctx, getEventById, "event");
  if (!found.ok) return found.error;

  return { ok: true, data: found.entity };
}

//Crea un evento. Escritura. Soporta --dry-run.

function createEventCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const name = readString(flags, "name");
  if (!name) {
    return {
      ok: false,
      error:
        'events create requires --name. Usage: fanz events create --name "Mi Evento".',
    };
  }

  const description = readString(flags, "description") ?? "";
  const location = readString(flags, "location") ?? "";

  const status = validateEnum(
    readString(flags, "status"),
    EVENT_STATUSES,
    "status",
  );
  if (status.error) return { ok: false, error: status.error };

  const saleStatus = validateEnum(
    readString(flags, "saleStatus"),
    SALE_STATUSES,
    "saleStatus",
  );
  if (saleStatus.error) return { ok: false, error: saleStatus.error };

  const data = {
    name,
    description,
    location,
    status: status.value,
    saleStatus: saleStatus.value,
  };

  if (wantsDryRun(flags)) {
    return dryRunResult(`create event "${name}"`, data);
  }

  const event = createEvent(ctx.state, data);
  return {
    ok: true,
    data: event,
    message: `Event ${event.id} ("${event.name}") created.`,
  };
}

//Actualiza campos de un evento. Escritura. Soporta --dry-run.

function updateEventCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const found = requireEntity(ctx, getEventById, "event");
  if (!found.ok) return found.error;
  const { id } = found;

  const changes: Partial<
    Pick<Event, "name" | "description" | "location" | "status" | "saleStatus">
  > = {};

  const name = readString(flags, "name");
  if (name !== undefined) changes.name = name;

  const description = readString(flags, "description");
  if (description !== undefined) changes.description = description;

  const location = readString(flags, "location");
  if (location !== undefined) changes.location = location;

  const status = validateEnum(
    readString(flags, "status"),
    EVENT_STATUSES,
    "status",
  );
  if (status.error) return { ok: false, error: status.error };
  if (status.value !== undefined) changes.status = status.value;

  const saleStatus = validateEnum(
    readString(flags, "saleStatus"),
    SALE_STATUSES,
    "saleStatus",
  );
  if (saleStatus.error) return { ok: false, error: saleStatus.error };
  if (saleStatus.value !== undefined) changes.saleStatus = saleStatus.value;

  if (Object.keys(changes).length === 0) {
    return {
      ok: false,
      error:
        "events update requires at least one field to change: --name, --description, --location, --status, --saleStatus.",
    };
  }

  // Guardrail: preview sin ejecutar
  if (wantsDryRun(flags)) {
    return dryRunResult(`update event ${id}`, { id, changes });
  }

  const updated = updateEvent(ctx.state, id, changes);
  return { ok: true, data: updated, message: `Event ${id} updated.` };
}

//Borra un evento y, en cascada, sus fechas y tickets. Destructivo.

function deleteEventCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const found = requireEntity(ctx, getEventById, "event");
  if (!found.ok) return found.error;
  const { id, entity: event } = found;

  const dateCount = getEventDatesByEvent(ctx.state, id).length;
  const ticketCount = getTicketTypesByEvent(ctx.state, id).length;
  const discountCount = ctx.state.discounts.filter(
    (d) => d.eventId === id,
  ).length;
  const cascade = {
    dates: dateCount,
    ticketTypes: ticketCount,
    discounts: discountCount,
  };

  if (wantsDryRun(flags)) {
    return dryRunResult(`delete event ${id} ("${event.name}")`, {
      event,
      willAlsoDelete: cascade,
    });
  }

  const blocked = requireConfirmation(
    flags,
    `event ${id} ("${event.name}") and its ${dateCount} date(s), ${ticketCount} ticket type(s), ${discountCount} discount(s)`,
  );
  if (blocked) return blocked;

  deleteEvent(ctx.state, id);
  return {
    ok: true,
    data: { id, deleted: true, cascade },
    message: `Event ${id} deleted, along with ${dateCount} date(s), ${ticketCount} ticket type(s) and ${discountCount} discount(s).`,
  };
}

export const eventCommands: Record<string, CommandHandler> = {
  list: listEvents,
  get: getEvent,
  create: createEventCmd,
  update: updateEventCmd,
  delete: deleteEventCmd,
};
