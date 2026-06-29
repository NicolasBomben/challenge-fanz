import type { EventDate, SaleStatus } from "@/lib/types";
import type { StoreState } from "../state";
import { generateId } from "../helpers/id";

export function getEventDatesByEvent(state: StoreState, eventId: string): EventDate[] {
  return state.eventDates.filter((d) => d.eventId === eventId);
}

export function getEventDateById(state: StoreState, id: string): EventDate | undefined {
  return state.eventDates.find((d) => d.id === id);
}

export function createEventDate(
  state: StoreState,
  data: {
    eventId: string;
    datetime: string;
    venue: string;
    status?: SaleStatus;
  }
): EventDate {
  const now = new Date().toISOString();
  const eventDate: EventDate = {
    id: generateId("DATE"),
    eventId: data.eventId,
    datetime: data.datetime,
    venue: data.venue,
    status: data.status ?? "active",
    createdAt: now,
    updatedAt: now,
  };
  state.eventDates.push(eventDate);
  return eventDate;
}

export function updateEventDate(
  state: StoreState,
  id: string,
  data: Partial<Pick<EventDate, "datetime" | "venue" | "status">>
): EventDate | undefined {
  const eventDate = state.eventDates.find((d) => d.id === id);
  if (!eventDate) return undefined;

  Object.assign(eventDate, data, { updatedAt: new Date().toISOString() });
  return eventDate;
}

export function deleteEventDate(state: StoreState, id: string): boolean {
  const index = state.eventDates.findIndex((d) => d.id === id);
  if (index === -1) return false;

  state.eventDates.splice(index, 1);
  state.ticketTypes = state.ticketTypes.filter((t) => t.eventDateId !== id);
  return true;
}
