import type { Order } from "@/lib/types";
import type { StoreState } from "../state";

export function getAllOrders(state: StoreState): Order[] {
  return state.orders;
}

export function getOrderById(state: StoreState, id: string): Order | undefined {
  return state.orders.find((o) => o.id === id);
}

export function getOrdersByEvent(state: StoreState, eventId: string): Order[] {
  return state.orders.filter((o) => o.eventId === eventId);
}

export function getOrdersByBuyer(state: StoreState, buyerId: string): Order[] {
  return state.orders.filter((o) => o.buyerId === buyerId);
}

export function getOrdersByEventDate(state: StoreState, eventDateId: string): Order[] {
  return state.orders.filter((o) => o.eventDateId === eventDateId);
}
