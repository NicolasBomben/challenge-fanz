import type { SaleStatus } from "./enums";

export interface EventDate {
  id: string;
  eventId: string;
  datetime: string;
  venue: string;
  status: SaleStatus;
  createdAt: string;
  updatedAt: string;
}
