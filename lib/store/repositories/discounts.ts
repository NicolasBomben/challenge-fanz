import type { Discount, DiscountType, DiscountScope } from "@/lib/types";
import type { StoreState } from "../state";
import { generateId } from "../helpers/id";

export function getAllDiscounts(state: StoreState): Discount[] {
  return state.discounts;
}

export function getDiscountsByEvent(state: StoreState, eventId: string): Discount[] {
  return state.discounts.filter((d) => d.eventId === eventId || d.scope === "global");
}

export function getDiscountById(state: StoreState, id: string): Discount | undefined {
  return state.discounts.find((d) => d.id === id);
}

export function getDiscountByCode(state: StoreState, code: string): Discount | undefined {
  return state.discounts.find((d) => d.code === code.toUpperCase());
}

export function createDiscount(
  state: StoreState,
  data: {
    eventId: string | null;
    code: string;
    type: DiscountType;
    value: number;
    scope: DiscountScope;
    usageLimit: number;
  }
): { discount?: Discount; error?: string } {
  const existing = state.discounts.find((d) => d.code === data.code.toUpperCase());
  if (existing) {
    return { error: `Discount code "${data.code.toUpperCase()}" already exists (${existing.id}).` };
  }

  const now = new Date().toISOString();
  const discount: Discount = {
    id: generateId("DSC"),
    eventId: data.eventId,
    code: data.code.toUpperCase(),
    type: data.type,
    value: data.value,
    scope: data.scope,
    usageLimit: data.usageLimit,
    usageCount: 0,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  state.discounts.push(discount);
  return { discount };
}

export function updateDiscount(
  state: StoreState,
  id: string,
  data: Partial<Pick<Discount, "code" | "type" | "value" | "usageLimit" | "active">>
): { discount?: Discount; error?: string } {
  const discount = state.discounts.find((d) => d.id === id);
  if (!discount) return { error: `Discount ${id} not found` };

  if (data.code) {
    const existing = state.discounts.find(
      (d) => d.code === data.code!.toUpperCase() && d.id !== id
    );
    if (existing) {
      return { error: `Discount code "${data.code.toUpperCase()}" already exists (${existing.id}).` };
    }
    data.code = data.code.toUpperCase();
  }

  Object.assign(discount, data, { updatedAt: new Date().toISOString() });
  return { discount };
}

export function deleteDiscount(state: StoreState, id: string): boolean {
  const index = state.discounts.findIndex((d) => d.id === id);
  if (index === -1) return false;

  state.discounts.splice(index, 1);
  return true;
}
