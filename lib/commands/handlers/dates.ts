import type { EventDate } from "@/lib/types";
import { SALE_STATUSES } from "@/lib/types";
import {
  getEventById,
  getEventDatesByEvent,
  getEventDateById,
  createEventDate,
  updateEventDate,
  deleteEventDate,
  getTicketTypesByEventDate,
} from "@/lib/store";
import type { CommandContext, CommandResult, CommandHandler } from "../types";
import {
  readString,
  validateEnum,
  validateDateTime,
  requireEntity,
  requireRef,
  wantsDryRun,
  requireConfirmation,
  dryRunResult,
} from "../helpers";

//Lista las fechas/funciones de un evento. Solo lectura.
function listDates(ctx: CommandContext): CommandResult {
  const ref = requireRef(ctx, "event", getEventById, "event");
  if (!ref.ok) return ref.error;

  const dates = getEventDatesByEvent(ctx.state, ref.id);
  return {
    ok: true,
    data: dates,
    message:
      dates.length === 0
        ? `No dates found for event ${ref.id}.`
        : `Found ${dates.length} date(s) for event ${ref.id}.`,
  };
}

//Devuelve una fecha por ID. Solo lectura.
function getDate(ctx: CommandContext): CommandResult {
  const found = requireEntity(ctx, getEventDateById, "date");
  if (!found.ok) return found.error;

  return { ok: true, data: found.entity };
}

// Crea una fecha/función para un evento. Escritura. Soporta --dry-run.
function createDateCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const ref = requireRef(ctx, "event", getEventById, "event");
  if (!ref.ok) return ref.error;

  const rawDatetime = readString(flags, "datetime");
  if (!rawDatetime) {
    return {
      ok: false,
      error:
        'dates create requires --datetime. Usage: fanz dates create --event EVT_1 --datetime 2026-07-20T20:00:00Z --venue "...".',
    };
  }

  const datetime = validateDateTime(rawDatetime, "datetime", {
    mustBeFuture: true,
  });
  if (datetime.error) return { ok: false, error: datetime.error };

  const venue = readString(flags, "venue");
  if (!venue) {
    return {
      ok: false,
      error:
        'dates create requires --venue. Usage: ... --venue "Estadio Obras".',
    };
  }

  const status = validateEnum(
    readString(flags, "status"),
    SALE_STATUSES,
    "status",
  );
  if (status.error) return { ok: false, error: status.error };

  const data = {
    eventId: ref.id,
    datetime: datetime.value!,
    venue,
    status: status.value,
  };

  if (wantsDryRun(flags)) {
    return dryRunResult(`create date for event ${ref.id}`, data);
  }

  const eventDate = createEventDate(ctx.state, data);
  return {
    ok: true,
    data: eventDate,
    message: `Date ${eventDate.id} created for event ${ref.id}.`,
  };
}

//Actualiza campos de una fecha. Escritura. Soporta --dry-run.
//Validación: la fecha debe existir; al menos un campo; datetime futuro; enum válido.
function updateDateCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const found = requireEntity(ctx, getEventDateById, "date");
  if (!found.ok) return found.error;
  const { id } = found;

  const changes: Partial<Pick<EventDate, "datetime" | "venue" | "status">> = {};

  const rawDatetime = readString(flags, "datetime");
  if (rawDatetime !== undefined) {
    const datetime = validateDateTime(rawDatetime, "datetime", {
      mustBeFuture: true,
    });
    if (datetime.error) return { ok: false, error: datetime.error };
    changes.datetime = datetime.value;
  }

  const venue = readString(flags, "venue");
  if (venue !== undefined) changes.venue = venue;

  const status = validateEnum(
    readString(flags, "status"),
    SALE_STATUSES,
    "status",
  );
  if (status.error) return { ok: false, error: status.error };
  if (status.value !== undefined) changes.status = status.value;

  if (Object.keys(changes).length === 0) {
    return {
      ok: false,
      error:
        "dates update requires at least one field to change: --datetime, --venue, --status.",
    };
  }

  if (wantsDryRun(flags)) {
    return dryRunResult(`update date ${id}`, { id, changes });
  }

  const updated = updateEventDate(ctx.state, id, changes);
  return { ok: true, data: updated, message: `Date ${id} updated.` };
}

//Borra una fecha y, en cascada, sus tipos de ticket. Destructivo.
//Guardrails: --dry-run (preview con cascada) y --yes (confirmación obligatoria).
function deleteDateCmd(ctx: CommandContext): CommandResult {
  const { flags } = ctx.parsed;

  const found = requireEntity(ctx, getEventDateById, "date");
  if (!found.ok) return found.error;
  const { id } = found;

  const ticketCount = getTicketTypesByEventDate(ctx.state, id).length;
  const cascade = { ticketTypes: ticketCount };

  if (wantsDryRun(flags)) {
    return dryRunResult(`delete date ${id}`, {
      date: found.entity,
      willAlsoDelete: cascade,
    });
  }

  const blocked = requireConfirmation(
    flags,
    `date ${id} and its ${ticketCount} ticket type(s)`,
  );
  if (blocked) return blocked;

  deleteEventDate(ctx.state, id);
  return {
    ok: true,
    data: { id, deleted: true, cascade },
    message: `Date ${id} deleted, along with ${ticketCount} ticket type(s).`,
  };
}

export const dateCommands: Record<string, CommandHandler> = {
  list: listDates,
  get: getDate,
  create: createDateCmd,
  update: updateDateCmd,
  delete: deleteDateCmd,
};
