/**
 * Shared test helper for integration tests that run against a real PostgreSQL database.
 *
 * These tests use the `xcontest_test` database (configured via TEST_DATABASE_URL).
 * If TEST_DATABASE_URL is not set, the helpers are no-ops and the tests should be
 * skipped (see `canRunIntegrationTests`).
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../schema";

const connectionString = process.env.TEST_DATABASE_URL;

/**
 * True when a test database URL is configured.
 * Integration test files should wrap their `describe` block with:
 *   const describeIf = canRunIntegrationTests ? describe : describe.skip;
 */
export const canRunIntegrationTests = !!connectionString;

const client = connectionString
  ? postgres(connectionString, { max: 3, idle_timeout: 1, connect_timeout: 5 })
  : (undefined as unknown as ReturnType<typeof postgres>);

export const testDb = connectionString
  ? drizzle(client, { schema })
  : (undefined as unknown as ReturnType<typeof drizzle>);

/** Truncate all application tables (respecting FK order). */
export async function truncateAll() {
  if (!connectionString) return;
  await testDb.execute(sql`TRUNCATE flights, takeoffs, pilots, gliders RESTART IDENTITY CASCADE`);
}

/** Close the connection pool — call in afterAll. */
export async function closeConnection() {
  if (!client) return;
  await client.end();
}

/* ------------------------------------------------------------------ */
/*  Seed data used by multiple test suites                            */
/* ------------------------------------------------------------------ */

export async function seedStandardData() {
  await truncateAll();

  // --- Pilots ---
  await testDb.execute(sql`
    INSERT INTO pilots (id, name, username) VALUES
      (1, 'Alice Ionescu',   'alice.ionescu'),
      (2, 'Bob Popescu',     'bob.popescu'),
      (3, 'Charlie Marinescu', 'charlie.m')
  `);

  // --- Takeoffs ---
  await testDb.execute(sql`
    INSERT INTO takeoffs (id, name, centroid) VALUES
      (1, 'Bunloc Launch',  ST_SetSRID(ST_MakePoint(25.5, 45.6), 4326)::geography),
      (2, 'Sticlăria Peak', ST_SetSRID(ST_MakePoint(24.8, 46.1), 4326)::geography),
      (3, 'Brașov Nord',    ST_SetSRID(ST_MakePoint(25.6, 45.7), 4326)::geography)
  `);

  // --- Gliders ---
  await testDb.execute(sql`
    INSERT INTO gliders (id, name, category) VALUES
      (1, 'Advance Sigma 11', 'B'),
      (2, 'Ozone Enzo 3',     'D'),
      (3, 'Gin Atlas 2',      'B'),
      (4, 'Moyes Litespeed',  'HG'),
      (5, 'Nova Mentor 7',    'C')
  `);

  // --- Flights ---
  // Mix of PG and HG flights. The flights_pg view excludes HG (glider_id=4).
  await testDb.execute(sql`
    INSERT INTO flights (id, pilot_id, takeoff_id, start_time, type, distance_km, score, airtime, glider_id, url) VALUES
      -- Alice: 3 PG flights from Bunloc, different distances
      (101, 1, 1, '2023-07-15 10:00:00', 'free flight',    120.0,  100.0, 300, 2, 'https://xcontest.org/101'),
      (102, 1, 1, '2023-07-16 11:00:00', 'FAI triangle',    80.5,   70.0, 240, 1, 'https://xcontest.org/102'),
      (103, 1, 2, '2023-08-01 09:30:00', 'free flight',      3.2,    2.0,  30, 3, 'https://xcontest.org/103'),

      -- Bob: 2 PG flights, 1 from Bunloc, 1 from Sticlaria
      (201, 2, 1, '2022-06-10 14:00:00', 'free flight',    250.0,  200.0, 480, 2, 'https://xcontest.org/201'),
      (202, 2, 2, '2024-03-20 12:00:00', 'flat triangle',    45.0,   35.0, 120, 5, 'https://xcontest.org/202'),

      -- Charlie: 1 PG flight + 1 HG flight (HG should be excluded from flights_pg)
      (301, 3, 3, '2023-09-05 08:00:00', 'free flight',     15.0,   10.0,  60, 1, 'https://xcontest.org/301'),
      (302, 3, 1, '2023-09-06 08:00:00', 'free flight',     30.0,   20.0,  90, 4, 'https://xcontest.org/302'),

      -- Alice: a recent flight for testing "recent" queries
      (104, 1, 1, now() - interval '5 days', 'free flight',  65.0, 55.0, 200, 2, 'https://xcontest.org/104'),

      -- Bob: another Bunloc flight for favorite-takeoff tests
      (203, 2, 1, '2022-07-08 10:00:00', 'free flight',    310.0,  280.0, 540, 2, 'https://xcontest.org/203'),

      -- Alice: a flight with no takeoff (takeoff_id = NULL)
      (105, 1, NULL, '2023-06-01 13:00:00', 'free flight',  10.0, 8.0, 45, 1, 'https://xcontest.org/105')
  `);

  // Reset sequences so future inserts don't collide
  await testDb.execute(sql`SELECT setval('pilots_id_seq', 100)`);
  await testDb.execute(sql`SELECT setval('takeoffs_id_seq', 100)`);
  await testDb.execute(sql`SELECT setval('gliders_id_seq', 100)`);
}
