import type { DiscountType, DiscountScope } from "./enums";

export interface Discount {
  id: string;
  eventId: string | null;
  code: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  usageLimit: number;
  usageCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
