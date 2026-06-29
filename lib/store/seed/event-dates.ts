import type { EventDate } from "@/lib/types";

export const seedEventDates: EventDate[] = [
  // Rock en el Estadio — 2 funciones
  {
    id: "DATE_1",
    eventId: "EVT_1",
    datetime: "2026-07-20T20:00:00Z",
    venue: "Estadio Obras - Escenario Principal",
    status: "active",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "DATE_2",
    eventId: "EVT_1",
    datetime: "2026-07-21T20:00:00Z",
    venue: "Estadio Obras - Escenario Principal",
    status: "active",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
  // Festival Electrónico — 1 función
  {
    id: "DATE_3",
    eventId: "EVT_2",
    datetime: "2026-08-15T22:00:00Z",
    venue: "Costa Salguero - Pabellón A",
    status: "active",
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-05-10T09:00:00Z",
  },
  // Stand Up Comedy — 3 funciones
  {
    id: "DATE_4",
    eventId: "EVT_3",
    datetime: "2026-09-05T21:00:00Z",
    venue: "Teatro Gran Rex - Sala Principal",
    status: "closed",
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-01T08:00:00Z",
  },
  {
    id: "DATE_5",
    eventId: "EVT_3",
    datetime: "2026-09-06T21:00:00Z",
    venue: "Teatro Gran Rex - Sala Principal",
    status: "closed",
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-01T08:00:00Z",
  },
  {
    id: "DATE_6",
    eventId: "EVT_3",
    datetime: "2026-09-07T18:00:00Z",
    venue: "Teatro Gran Rex - Sala Principal",
    status: "closed",
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-01T08:00:00Z",
  },
];
