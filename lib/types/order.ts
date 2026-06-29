import type { OrderStatus } from "./enums";

export interface OrderItem {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  discountCode: string | null;
  discountAmount: number;
  subtotal: number;
}

export interface Order {
  id: string;
  eventId: string;
  eventDateId: string;
  buyerId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}
