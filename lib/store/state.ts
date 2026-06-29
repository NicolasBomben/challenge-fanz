import type {
  Account,
  Event,
  EventDate,
  TicketType,
  Discount,
  Order,
  Buyer,
  AuditLogEntry,
} from "@/lib/types";

export interface StoreState {
  account: Account;
  events: Event[];
  eventDates: EventDate[];
  ticketTypes: TicketType[];
  discounts: Discount[];
  orders: Order[];
  buyers: Buyer[];
  auditLog: AuditLogEntry[];
}
