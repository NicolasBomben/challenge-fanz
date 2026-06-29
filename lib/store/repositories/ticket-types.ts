import type { TicketType, TicketStatus } from "@/lib/types";
import type { StoreState } from "../state";
import { generateId } from "../helpers/id";

export function getTicketTypesByEventDate(state: StoreState, eventDateId: string): TicketType[] {
  return state.ticketTypes.filter((t) => t.eventDateId === eventDateId);
}

export function getTicketTypesByEvent(state: StoreState, eventId: string): TicketType[] {
  return state.ticketTypes.filter((t) => t.eventId === eventId);
}

export function getTicketTypeById(state: StoreState, id: string): TicketType | undefined {
  return state.ticketTypes.find((t) => t.id === id);
}

export function createTicketType(
  state: StoreState,
  data: {
    eventId: string;
    eventDateId: string;
    name: string;
    price: number;
    stock: number;
    status?: TicketStatus;
  }
): TicketType {
  const now = new Date().toISOString();
  const ticketType: TicketType = {
    id: generateId("TCK"),
    eventId: data.eventId,
    eventDateId: data.eventDateId,
    name: data.name,
    price: data.price,
    stock: data.stock,
    sold: 0,
    status: data.status ?? "active",
    createdAt: now,
    updatedAt: now,
  };
  state.ticketTypes.push(ticketType);
  return ticketType;
}

export function updateTicketType(
  state: StoreState,
  id: string,
  data: Partial<Pick<TicketType, "name" | "price" | "stock" | "status">>
): { ticketType?: TicketType; error?: string } {
  const ticketType = state.ticketTypes.find((t) => t.id === id);
  if (!ticketType) return { error: `Ticket type ${id} not found` };

  if (data.stock !== undefined && data.stock < ticketType.sold) {
    return {
      error: `Cannot set stock to ${data.stock}: already sold ${ticketType.sold} tickets. Minimum stock is ${ticketType.sold}.`,
    };
  }

  Object.assign(ticketType, data, { updatedAt: new Date().toISOString() });
  return { ticketType };
}

export function deleteTicketType(state: StoreState, id: string): boolean {
  const index = state.ticketTypes.findIndex((t) => t.id === id);
  if (index === -1) return false;

  state.ticketTypes.splice(index, 1);
  return true;
}
