import type { Event, EventDate, TicketType } from "@/lib/types";
import {
  getEventById,
  getEventDateById,
  getEventDatesByEvent,
  getTicketTypesByEvent,
  getTicketTypesByEventDate,
  updateEvent,
  updateEventDate,
  updateTicketType,
} from "@/lib/store";
import type { CommandContext, CommandResult, CommandHandler } from "../types";
import { readString, requireRef, wantsDryRun, dryRunResult } from "../helpers";

//Acción de negocio: pausar / reanudar ventas.

function setSalesState(
  ctx: CommandContext,
  mode: "pause" | "resume",
): CommandResult {
  const { flags } = ctx.parsed;

  const from = mode === "pause" ? "active" : "paused";
  const to = mode === "pause" ? "paused" : "active";

  let events: Event[] = [];
  let dates: EventDate[] = [];
  let tickets: TicketType[] = [];
  let scopeLabel: string;

  if (readString(flags, "date") !== undefined) {
    const ref = requireRef(ctx, "date", getEventDateById, "date");
    if (!ref.ok) return ref.error;
    dates = [ref.entity];
    tickets = getTicketTypesByEventDate(ctx.state, ref.id);
    scopeLabel = `date ${ref.id}`;
  } else if (readString(flags, "event") !== undefined) {
    const ref = requireRef(ctx, "event", getEventById, "event");
    if (!ref.ok) return ref.error;
    events = [ref.entity];
    dates = getEventDatesByEvent(ctx.state, ref.id);
    tickets = getTicketTypesByEvent(ctx.state, ref.id);
    scopeLabel = `event ${ref.id}`;
  } else {
    return {
      ok: false,
      error: `actions ${mode} requires --event <EVT_id> or --date <DATE_id>.`,
    };
  }

  const eventsToChange = events.filter((e) => e.saleStatus === from);
  const datesToChange = dates.filter((d) => d.status === from);
  const ticketsToChange = tickets.filter((t) => t.status === from);

  const summary = {
    mode,
    transition: `${from} → ${to}`,
    scope: scopeLabel,
    events: {
      changed: eventsToChange.map((e) => e.id),
      unaffected: events.length - eventsToChange.length,
    },
    dates: {
      changed: datesToChange.map((d) => d.id),
      unaffected: dates.length - datesToChange.length,
    },
    tickets: {
      changed: ticketsToChange.map((t) => t.id),
      unaffected: tickets.length - ticketsToChange.length,
    },
  };

  const totalChanges =
    eventsToChange.length + datesToChange.length + ticketsToChange.length;

  if (totalChanges === 0) {
    return {
      ok: true,
      data: summary,
      message: `Nothing to ${mode} for ${scopeLabel}: sales are already ${to === "paused" ? "paused" : "active"} (or sold out/closed).`,
    };
  }

  if (wantsDryRun(flags)) {
    return dryRunResult(
      `${mode} sales for ${scopeLabel} (${totalChanges} entit${totalChanges === 1 ? "y" : "ies"})`,
      summary,
    );
  }

  for (const e of eventsToChange)
    updateEvent(ctx.state, e.id, { saleStatus: to });
  for (const d of datesToChange)
    updateEventDate(ctx.state, d.id, { status: to });
  for (const t of ticketsToChange)
    updateTicketType(ctx.state, t.id, { status: to });

  return {
    ok: true,
    data: summary,
    message: `Sales ${mode === "pause" ? "paused" : "resumed"} for ${scopeLabel}: ${eventsToChange.length} event, ${datesToChange.length} date(s), ${ticketsToChange.length} ticket type(s) updated.`,
  };
}

function pauseSales(ctx: CommandContext): CommandResult {
  return setSalesState(ctx, "pause");
}

function resumeSales(ctx: CommandContext): CommandResult {
  return setSalesState(ctx, "resume");
}

export const actionCommands: Record<string, CommandHandler> = {
  pause: pauseSales,
  resume: resumeSales,
};
