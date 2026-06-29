import type { EventStatus, SaleStatus } from "./enums";

export interface Event {
  id: string;
  accountId: string;
  name: string;
  description: string;
  location: string;
  status: EventStatus;
  saleStatus: SaleStatus;
  createdAt: string;
  updatedAt: string;
}
