/**
 * @jest-environment node
 *
 * Integration tests for takeoff queries.
 * Runs against xcontest_test with seeded data.
 *
 * Seed data (PG flights at each takeoff):
 *   Bunloc(1):    101(Alice,120km,Enzo3), 102(Alice,80.5km,Sigma11),
 *                 201(Bob,250km,Enzo3), 203(Bob,310km,Enzo3), 104(Alice,65km,Enzo3)
 *   Sticlăria(2): 103(Alice,3.2km,Atlas2), 202(Bob,45km,Mentor7)
 *   Brașov(3):    301(Charlie,15km,Sigma11)
 *   HG excluded:  302(Charlie,30km,Moyes@Bunloc)
 */
import { canRunIntegrationTests, seedStandardData, truncateAll, closeConnection } from "../test-utils";

jest.mock("../../db", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const helpers = require("../test-utils");
  return { db: helpers.testDb };
});

import {
  getTakeoffById,
  getTakeoffCalendarHeatmap,
  getTakeoffMonthlyStats,
  getTakeoffHourlyDistribution,
  getTakeoffDistanceHistogram,
  getTakeoffTop10,
  getTakeoffWingClasses,
  getTakeoffYearlyTrend,
  getTakeoffBusiestDays,
} from "../takeoffs";

const describeIf = canRunIntegrationTests ? describe : describe.skip;

beforeAll(async () => {
  if (!canRunIntegrationTests) return;
  await seedStandardData();
});

afterAll(async () => {
  if (!canRunIntegrationTests) return;
  await truncateAll();
  await closeConnection();
});

describeIf("takeoff queries (integration)", () => {
  describe("getTakeoffById", () => {
    it("returns takeoff with coordinates", async () => {
      const t = await getTakeoffById(1);
      expect(t).not.toBeNull();
      expect(t!.name).toBe("Bunloc Launch");
      expect(Number(t!.lat)).toBeCloseTo(45.6, 1);
      expect(Number(t!.lng)).toBeCloseTo(25.5, 1);
    });

    it("returns null for non-existent takeoff", async () => {
      const t = await getTakeoffById(99999);
      expect(t).toBeNull();
    });
  });

  describe("getTakeoffCalendarHeatmap", () => {
    it("groups Bunloc flights by year/month", async () => {
      const rows = await getTakeoffCalendarHeatmap(1);
      // Bunloc flights: 2022-06(201), 2022-07(203), 2023-07(101,102), 2024-05(104)
      const jul2023 = rows.find(
        (r: Record<string, unknown>) => Number(r.year) === 2023 && Number(r.month) === 7
      );
      expect(jul2023).toBeDefined();
      expect(Number(jul2023!.flight_count)).toBe(2);
    });
  });

  describe("getTakeoffMonthlyStats", () => {
    it("aggregates Bunloc flights by month across years", async () => {
      const rows = await getTakeoffMonthlyStats(1);
      // Bunloc July flights: 203(310km) + 101(120km) + 102(80.5km) = 3 flights
      const july = rows.find((r: Record<string, unknown>) => Number(r.month) === 7);
      expect(july).toBeDefined();
      expect(Number(july!.flight_count)).toBe(3);
    });
  });

  describe("getTakeoffHourlyDistribution", () => {
    it("only counts flights with distance > 20km", async () => {
      const rows = await getTakeoffHourlyDistribution(2);
      // Sticlaria flights: 103(3.2km, excluded), 202(45km, hour=12)
      expect(rows.length).toBe(1);
      expect(Number(rows[0].hour)).toBe(12);
      expect(Number(rows[0].flight_count)).toBe(1);
    });
  });

  describe("getTakeoffDistanceHistogram", () => {
    it("buckets Bunloc flights into correct ranges", async () => {
      const rows = await getTakeoffDistanceHistogram(1);
      const bucketMap = Object.fromEntries(
        rows.map((r: Record<string, unknown>) => [r.bucket, Number(r.cnt)])
      );
      // Bunloc PG: 65→'50-100', 80.5→'50-100', 120→'100+', 250→'100+', 310→'100+'
      expect(bucketMap["50-100"]).toBe(2);   // 65, 80.5
      expect(bucketMap["100+"]).toBe(3);     // 120, 250, 310
    });
  });

  describe("getTakeoffTop10", () => {
    it("returns Bunloc flights ordered by distance DESC", async () => {
      const rows = await getTakeoffTop10(1);
      expect(rows.length).toBe(5); // 5 PG flights at Bunloc
      expect(Number(rows[0].distance_km)).toBe(310);
      expect(rows[0].pilot_name).toBe("Bob Popescu");
      expect(Number(rows[1].distance_km)).toBe(250);
    });

    it("excludes HG flights from results", async () => {
      // Flight 302 (HG, Charlie, Bunloc) should not appear
      const rows = await getTakeoffTop10(1);
      const usernames = rows.map((r: Record<string, unknown>) => r.pilot_username);
      expect(usernames).not.toContain("charlie.m");
    });
  });

  describe("getTakeoffWingClasses", () => {
    it("counts wing categories at Bunloc correctly", async () => {
      const rows = await getTakeoffWingClasses(1);
      const catMap = Object.fromEntries(
        rows.map((r: Record<string, unknown>) => [r.category, Number(r.cnt)])
      );
      // Bunloc PG: Enzo3(D)×4 (101,201,203,104), Sigma11(B)×1 (102) → D:4, B:1
      expect(catMap["D"]).toBe(4);
      expect(catMap["B"]).toBe(1);
      // HG category should NOT be present
      expect(catMap["HG"]).toBeUndefined();
    });
  });

  describe("getTakeoffYearlyTrend", () => {
    it("returns yearly flight counts for Bunloc", async () => {
      const rows = await getTakeoffYearlyTrend(1);
      const y2022 = rows.find((r: Record<string, unknown>) => Number(r.year) === 2022);
      expect(y2022).toBeDefined();
      // 2022 flights at Bunloc: 201(250km) + 203(310km) = 2 flights, 560km
      expect(Number(y2022!.flight_count)).toBe(2);
      expect(Number(y2022!.total_km)).toBe(560);
    });
  });

  describe("getTakeoffBusiestDays", () => {
    it("identifies the busiest day at Bunloc by pilot count", async () => {
      const rows = await getTakeoffBusiestDays(1);
      expect(rows.length).toBeGreaterThanOrEqual(1);
      // 2023-07-15: flight 101 (Alice) — 1 pilot
      // 2023-07-16: flight 102 (Alice) — 1 pilot
      // Each day has 1 flight from 1 pilot at Bunloc
      // The order is by pilot_count DESC then undefined, so just verify structure
      expect(Number(rows[0].pilot_count)).toBeGreaterThanOrEqual(1);
      expect(Number(rows[0].flight_count)).toBeGreaterThanOrEqual(1);
    });
  });
});
