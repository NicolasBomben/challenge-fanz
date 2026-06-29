import type { Buyer } from "@/lib/types";
import type { StoreState } from "../state";

export function getAllBuyers(state: StoreState): Buyer[] {
  return state.buyers;
}

export function getBuyerById(state: StoreState, id: string): Buyer | undefined {
  return state.buyers.find((b) => b.id === id);
}

export function getBuyerByEmail(state: StoreState, email: string): Buyer | undefined {
  return state.buyers.find((b) => b.email === email);
}
