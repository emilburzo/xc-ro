import {
  pgTable,
  bigint,
  varchar,
  doublePrecision,
  integer,
  timestamp,
  bigserial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const pilots = pgTable("pilots", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
});

export const takeoffs = pgTable("takeoffs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  // centroid is geography(Point,4326) — we'll read it with ST_X/ST_Y in SQL
});

export const gliders = pgTable("gliders", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 20 }).notNull(),
});

export const flights = pgTable("flights", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  pilotId: bigint("pilot_id", { mode: "number" }).notNull(),
  takeoffId: bigint("takeoff_id", { mode: "number" }),
  startTime: timestamp("start_time").notNull(),
  // start_point is geography(Point,4326) — read with ST_X/ST_Y
  type: varchar("type", { length: 512 }).notNull(),
  distanceKm: doublePrecision("distance_km").notNull(),
  score: doublePrecision("score").notNull(),
  airtime: integer("airtime").notNull(),
  gliderId: bigint("glider_id", { mode: "number" }).notNull(),
  url: varchar("url", { length: 512 }).notNull(),
});

export const pilotsRelations = relations(pilots, ({ many }) => ({
  flights: many(flights),
}));

export const takeoffsRelations = relations(takeoffs, ({ many }) => ({
  flights: many(flights),
}));

export const glidersRelations = relations(gliders, ({ many }) => ({
  flights: many(flights),
}));

export const flightsRelations = relations(flights, ({ one }) => ({
  pilot: one(pilots, { fields: [flights.pilotId], references: [pilots.id] }),
  takeoff: one(takeoffs, { fields: [flights.takeoffId], references: [takeoffs.id] }),
  glider: one(gliders, { fields: [flights.gliderId], references: [gliders.id] }),
}));
