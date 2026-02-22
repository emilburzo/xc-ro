/**
 * @jest-environment node
 *
 * Integration tests for wing queries.
 * Runs against xcontest_test with seeded data.
 *
 * Seed data (PG flights per glider):
 *   Sigma 11(B,id=1): 102(Alice,80.5km,2023-07), 301(Charlie,15km,2023-09), 105(Alice,10km,2023-06)
 *   Enzo 3(D,id=2):   101(Alice,120km), 201(Bob,250km), 203(Bob,310km), 104(Alice,65km)
 *   Atlas 2(B,id=3):  103(Alice,3.2km)
 *   Moyes(HG,id=4):   302(Charlie,30km) — excluded by flights_pg
 *   Mentor 7(C,id=5): 202(Bob,45km)
 */
import { canRunIntegrationTests, seedStandardData, truncateAll, closeConnection } from "../test-utils";

jest.mock("../../db", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const helpers = require("../test-utils");
  return { db: helpers.testDb };
});

import {
  getWingById,
  getWingTopFlights,
  getWingDistanceHistogram,
  getWingAdoptionCurve,
  getWingYearlyStats,
  getWingFavoriteTakeoffs,
  getWingCalendarHeatmap,
} from "../wings";

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

describeIf("wing queries (integration)", () => {
  describe("getWingById", () => {
    it("returns the correct wing", async () => {
      const wing = await getWingById(2);
      expect(wing).not.toBeNull();
      expect(wing!.name).toBe("Ozone Enzo 3");
      expect(wing!.category).toBe("D");
    });

    it("returns null for non-existent wing", async () => {
      const wing = await getWingById(99999);
      expect(wing).toBeNull();
    });
  });

  describe("getWingTopFlights", () => {
    it("returns Enzo 3 flights ordered by distance DESC", async () => {
      const rows = await getWingTopFlights(2);
      expect(rows.length).toBe(4); // 101, 201, 203, 104
      expect(Number(rows[0].distance_km)).toBe(310);
      expect(Number(rows[1].distance_km)).toBe(250);
      expect(Number(rows[2].distance_km)).toBe(120);
      expect(Number(rows[3].distance_km)).toBe(65);
    });
  });

  describe("getWingDistanceHistogram", () => {
    it("buckets Sigma 11 flights correctly", async () => {
      const rows = await getWingDistanceHistogram(1);
      const bucketMap = Object.fromEntries(
        rows.map((r: Record<string, unknown>) => [r.bucket, Number(r.cnt)])
      );
      // Sigma 11: 80.5→'50-100', 15→'5-20', 10→'5-20'
      expect(bucketMap["5-20"]).toBe(2);     // 10, 15
      expect(bucketMap["50-100"]).toBe(1);   // 80.5
    });
  });

  describe("getWingAdoptionCurve", () => {
    it("returns distinct pilot count per year for Enzo 3", async () => {
      const rows = await getWingAdoptionCurve(2);
      // Enzo 3 flights: 201(Bob,2022), 203(Bob,2022), 101(Alice,2023), 104(Alice,recent)
      const y2022 = rows.find((r: Record<string, unknown>) => Number(r.year) === 2022);
      expect(y2022).toBeDefined();
      expect(Number(y2022!.pilot_count)).toBe(1); // Only Bob in 2022

      const y2023 = rows.find((r: Record<string, unknown>) => Number(r.year) === 2023);
      expect(y2023).toBeDefined();
      expect(Number(y2023!.pilot_count)).toBe(1); // Only Alice in 2023
    });
  });

  describe("getWingYearlyStats", () => {
    it("returns yearly flight counts and total km for Enzo 3", async () => {
      const rows = await getWingYearlyStats(2);
      const y2022 = rows.find((r: Record<string, unknown>) => Number(r.year) === 2022);
      expect(y2022).toBeDefined();
      // 2022: 201(250) + 203(310) = 2 flights, 560km
      expect(Number(y2022!.flight_count)).toBe(2);
      expect(Number(y2022!.total_km)).toBe(560);
    });
  });

  describe("getWingFavoriteTakeoffs", () => {
    it("returns Bunloc as the top takeoff for Enzo 3", async () => {
      const rows = await getWingFavoriteTakeoffs(2);
      // Enzo 3 at Bunloc: 101, 201, 203, 104 = 4 flights
      expect(rows[0].name).toBe("Bunloc Launch");
      expect(Number(rows[0].flight_count)).toBe(4);
    });
  });

  describe("getWingCalendarHeatmap", () => {
    it("groups Sigma 11 flights by year/month", async () => {
      const rows = await getWingCalendarHeatmap(1);
      // Sigma 11: 2023-06(105), 2023-07(102), 2023-09(301)
      const jul2023 = rows.find(
        (r: Record<string, unknown>) => Number(r.year) === 2023 && Number(r.month) === 7
      );
      expect(jul2023).toBeDefined();
      expect(Number(jul2023!.flight_count)).toBe(1); // just flight 102
    });
  });
});
