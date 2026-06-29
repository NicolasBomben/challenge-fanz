import type { TicketStatus } from "./enums";

export interface TicketType {
  id: string;
  eventDateId: string;
  eventId: string;
  name: string;
  price: number;
  stock: number;
  sold: number;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}
