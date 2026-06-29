import type { Event, EventStatus, SaleStatus } from "@/lib/types";
import type { StoreState } from "../state";
import { generateId } from "../helpers/id";

export function getAllEvents(state: StoreState): Event[] {
  return state.events;
}

export function getEventById(state: StoreState, id: string): Event | undefined {
  return state.events.find((e) => e.id === id);
}

export function createEvent(
  state: StoreState,
  data: {
    name: string;
    description: string;
    location: string;
    status?: EventStatus;
    saleStatus?: SaleStatus;
  }
): Event {
  const now = new Date().toISOString();
  const event: Event = {
    id: generateId("EVT"),
    accountId: state.account.id,
    name: data.name,
    description: data.description,
    location: data.location,
    status: data.status ?? "draft",
    saleStatus: data.saleStatus ?? "closed",
    createdAt: now,
    updatedAt: now,
  };
  state.events.push(event);
  return event;
}

export function updateEvent(
  state: StoreState,
  id: string,
  data: Partial<Pick<Event, "name" | "description" | "location" | "status" | "saleStatus">>
): Event | undefined {
  const event = state.events.find((e) => e.id === id);
  if (!event) return undefined;

  Object.assign(event, data, { updatedAt: new Date().toISOString() });
  return event;
}

export function deleteEvent(state: StoreState, id: string): boolean {
  const index = state.events.findIndex((e) => e.id === id);
  if (index === -1) return false;

  state.events.splice(index, 1);
  state.eventDates = state.eventDates.filter((d) => d.eventId !== id);
  state.ticketTypes = state.ticketTypes.filter((t) => t.eventId !== id);
  state.discounts = state.discounts.filter((d) => d.eventId !== id);
  return true;
}
