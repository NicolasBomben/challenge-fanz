import type { Event } from "@/lib/types";

export const seedEvents: Event[] = [
  {
    id: "EVT_1",
    accountId: "ACC_1",
    name: "Rock en el Estadio",
    description: "Festival de rock con bandas nacionales e internacionales",
    location: "Estadio Obras, Buenos Aires",
    status: "published",
    saleStatus: "active",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-15T14:30:00Z",
  },
  {
    id: "EVT_2",
    accountId: "ACC_1",
    name: "Festival Electrónico BA",
    description: "Noche de música electrónica con DJs internacionales",
    location: "Costa Salguero, Buenos Aires",
    status: "published",
    saleStatus: "active",
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-05-20T11:00:00Z",
  },
  {
    id: "EVT_3",
    accountId: "ACC_1",
    name: "Stand Up Comedy Night",
    description: "Noche de comedia con los mejores standuperos del país",
    location: "Teatro Gran Rex, Buenos Aires",
    status: "draft",
    saleStatus: "closed",
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-01T08:00:00Z",
  },
];
