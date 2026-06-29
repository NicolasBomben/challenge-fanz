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

/**
 * Acción de negocio: pausar / reanudar ventas.
 *
 * No es un simple update de un campo: encapsula una operación que se propaga en
 * cascada (evento → fechas → tipos de ticket) de forma coherente.
 *
 * Regla inteligente: solo invierte el estado relevante.
 *   - pause:  active → paused   (deja intactos sold_out / closed)
 *   - resume: paused → active
 * Así pausar y reanudar no pisan información de entidades agotadas o cerradas, y
 * la operación es idempotente (correrla dos veces no rompe nada).
 *
 * Scope:
 *   --date <DATE_id>  → esa función + sus tickets
 *   --event <EVT_id>  → el evento + todas sus fechas + todos sus tickets
 */
function setSalesState(ctx: CommandContext, mode: "pause" | "resume"): CommandResult {
  const { flags } = ctx.parsed;

  const from = mode === "pause" ? "active" : "paused";
  const to = mode === "pause" ? "paused" : "active";

  // ── Resolver el scope ──
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

  // ── Calcular qué cambiaría (solo lo que está en el estado "from") ──
  const eventsToChange = events.filter((e) => e.saleStatus === from);
  const datesToChange = dates.filter((d) => d.status === from);
  const ticketsToChange = tickets.filter((t) => t.status === from);

  const summary = {
    mode,
    transition: `${from} → ${to}`,
    scope: scopeLabel,
    events: { changed: eventsToChange.map((e) => e.id), unaffected: events.length - eventsToChange.length },
    dates: { changed: datesToChange.map((d) => d.id), unaffected: dates.length - datesToChange.length },
    tickets: { changed: ticketsToChange.map((t) => t.id), unaffected: tickets.length - ticketsToChange.length },
  };

  const totalChanges = eventsToChange.length + datesToChange.length + ticketsToChange.length;

  // ── Nada que cambiar: idempotente ──
  if (totalChanges === 0) {
    return {
      ok: true,
      data: summary,
      message: `Nothing to ${mode} for ${scopeLabel}: sales are already ${to === "paused" ? "paused" : "active"} (or sold out/closed).`,
    };
  }

  // ── Guardrail: preview sin ejecutar ──
  if (wantsDryRun(flags)) {
    return dryRunResult(`${mode} sales for ${scopeLabel} (${totalChanges} entit${totalChanges === 1 ? "y" : "ies"})`, summary);
  }

  // ── Aplicar en cascada ──
  for (const e of eventsToChange) updateEvent(ctx.state, e.id, { saleStatus: to });
  for (const d of datesToChange) updateEventDate(ctx.state, d.id, { status: to });
  for (const t of ticketsToChange) updateTicketType(ctx.state, t.id, { status: to });

  return {
    ok: true,
    data: summary,
    message: `Sales ${mode === "pause" ? "paused" : "resumed"} for ${scopeLabel}: ${eventsToChange.length} event, ${datesToChange.length} date(s), ${ticketsToChange.length} ticket type(s) updated.`,
  };
}

/** fanz actions pause (--event <EVT_id> | --date <DATE_id>) [--dry-run] */
function pauseSales(ctx: CommandContext): CommandResult {
  return setSalesState(ctx, "pause");
}

/** fanz actions resume (--event <EVT_id> | --date <DATE_id>) [--dry-run] */
function resumeSales(ctx: CommandContext): CommandResult {
  return setSalesState(ctx, "resume");
}

/**
 * Mapa de acciones del recurso "actions", consumido por el registry central.
 * Son operaciones de escritura (requieren admin).
 */
export const actionCommands: Record<string, CommandHandler> = {
  pause: pauseSales,
  resume: resumeSales,
};
