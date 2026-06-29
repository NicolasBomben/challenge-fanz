import type { StoreState } from "../state";
import { seedAccount } from "./accounts";
import { seedEvents } from "./events";
import { seedEventDates } from "./event-dates";
import { seedTicketTypes } from "./ticket-types";
import { seedDiscounts } from "./discounts";
import { seedBuyers } from "./buyers";
import { seedOrders } from "./orders";

export function createInitialState(): StoreState {
  return {
    account: { ...seedAccount },
    events: seedEvents.map((e) => ({ ...e })),
    eventDates: seedEventDates.map((d) => ({ ...d })),
    ticketTypes: seedTicketTypes.map((t) => ({ ...t })),
    discounts: seedDiscounts.map((d) => ({ ...d })),
    orders: seedOrders.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) })),
    buyers: seedBuyers.map((b) => ({ ...b })),
    auditLog: [],
  };
}
