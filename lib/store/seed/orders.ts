import type { Order } from "@/lib/types";

export const seedOrders: Order[] = [
  // María compró 2 General + 1 VIP para Rock fecha 1
  {
    id: "ORD_1",
    eventId: "EVT_1",
    eventDateId: "DATE_1",
    buyerId: "BUY_1",
    items: [
      {
        ticketTypeId: "TCK_1",
        ticketTypeName: "General",
        quantity: 2,
        unitPrice: 15000,
        discountCode: "ROCK20",
        discountAmount: 6000,
        subtotal: 24000,
      },
      {
        ticketTypeId: "TCK_2",
        ticketTypeName: "VIP",
        quantity: 1,
        unitPrice: 35000,
        discountCode: "ROCK20",
        discountAmount: 7000,
        subtotal: 28000,
      },
    ],
    total: 52000,
    status: "completed",
    createdAt: "2026-05-20T15:30:00Z",
  },
  // María también compró para el Festival Electrónico
  {
    id: "ORD_2",
    eventId: "EVT_2",
    eventDateId: "DATE_3",
    buyerId: "BUY_1",
    items: [
      {
        ticketTypeId: "TCK_5",
        ticketTypeName: "Early Bird",
        quantity: 2,
        unitPrice: 12000,
        discountCode: null,
        discountAmount: 0,
        subtotal: 24000,
      },
    ],
    total: 24000,
    status: "completed",
    createdAt: "2026-05-12T10:00:00Z",
  },
  // Juan compró General para Rock fecha 1
  {
    id: "ORD_3",
    eventId: "EVT_1",
    eventDateId: "DATE_1",
    buyerId: "BUY_2",
    items: [
      {
        ticketTypeId: "TCK_1",
        ticketTypeName: "General",
        quantity: 4,
        unitPrice: 15000,
        discountCode: "FANZ10",
        discountAmount: 6000,
        subtotal: 54000,
      },
    ],
    total: 54000,
    status: "completed",
    createdAt: "2026-05-22T09:15:00Z",
  },
  // Lucía — 3 órdenes en distintos eventos
  {
    id: "ORD_4",
    eventId: "EVT_1",
    eventDateId: "DATE_2",
    buyerId: "BUY_3",
    items: [
      {
        ticketTypeId: "TCK_4",
        ticketTypeName: "VIP",
        quantity: 2,
        unitPrice: 35000,
        discountCode: null,
        discountAmount: 0,
        subtotal: 70000,
      },
    ],
    total: 70000,
    status: "completed",
    createdAt: "2026-05-25T18:00:00Z",
  },
  {
    id: "ORD_5",
    eventId: "EVT_2",
    eventDateId: "DATE_3",
    buyerId: "BUY_3",
    items: [
      {
        ticketTypeId: "TCK_7",
        ticketTypeName: "VIP Backstage",
        quantity: 2,
        unitPrice: 55000,
        discountCode: "ELECTRO5K",
        discountAmount: 10000,
        subtotal: 100000,
      },
    ],
    total: 100000,
    status: "completed",
    createdAt: "2026-05-15T20:00:00Z",
  },
  {
    id: "ORD_6",
    eventId: "EVT_2",
    eventDateId: "DATE_3",
    buyerId: "BUY_3",
    items: [
      {
        ticketTypeId: "TCK_6",
        ticketTypeName: "General",
        quantity: 3,
        unitPrice: 20000,
        discountCode: "FANZ10",
        discountAmount: 6000,
        subtotal: 54000,
      },
    ],
    total: 54000,
    status: "cancelled",
    createdAt: "2026-06-01T11:00:00Z",
  },
  // Carlos compró para Rock fecha 2
  {
    id: "ORD_7",
    eventId: "EVT_1",
    eventDateId: "DATE_2",
    buyerId: "BUY_4",
    items: [
      {
        ticketTypeId: "TCK_3",
        ticketTypeName: "General",
        quantity: 2,
        unitPrice: 15000,
        discountCode: null,
        discountAmount: 0,
        subtotal: 30000,
      },
    ],
    total: 30000,
    status: "completed",
    createdAt: "2026-06-05T14:00:00Z",
  },
  // Ana compró Early Bird para Festival Electrónico
  {
    id: "ORD_8",
    eventId: "EVT_2",
    eventDateId: "DATE_3",
    buyerId: "BUY_5",
    items: [
      {
        ticketTypeId: "TCK_5",
        ticketTypeName: "Early Bird",
        quantity: 1,
        unitPrice: 12000,
        discountCode: "FANZ10",
        discountAmount: 1200,
        subtotal: 10800,
      },
    ],
    total: 10800,
    status: "completed",
    createdAt: "2026-05-11T16:30:00Z",
  },
];
