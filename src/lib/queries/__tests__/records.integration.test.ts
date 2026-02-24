/**
 * @jest-environment node
 *
 * Integration tests for records queries.
 * Runs against xcontest_test with seeded data.
 *
 * Tests verify that record-picking queries select the correct "best" flight
 * from multiple candidates.
 *
 * Seed data (PG flights):
 *   101: Alice, 120km, score=100, airtime=300
 *   102: Alice, 80.5km, score=70, airtime=240
 *   103: Alice, 3.2km, score=2, airtime=30
 *   104: Alice, 65km, score=55, airtime=200
 *   105: Alice, 10km, score=8, airtime=45 (no takeoff)
 *   201: Bob, 250km, score=200, airtime=480
 *   202: Bob, 45km, score=35, airtime=120
 *   203: Bob, 310km, score=280, airtime=540
 *   301: Charlie, 15km, score=10, airtime=60
 */
import { canRunIntegrationTests, seedStandardData, truncateAll, closeConnection } from "../test-utils";

jest.mock("../../db", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const helpers = require("../test-utils");
  return { db: helpers.testDb };
});

import {
  getAllTimeRecords,
  getCategoryRecords,
  getAnnualRecords,
} from "../records";

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

describeIf("records queries (integration)", () => {
  describe("getAllTimeRecords", () => {
    it("picks flight 203 (310km) as the longest distance", async () => {
      const records = await getAllTimeRecords();
      expect(Number(records.longest.distance_km)).toBe(310);
      expect(records.longest.pilot_name).toBe("Bob Popescu");
    });

    it("picks flight 203 (540min) as the longest airtime (<=600min cap)", async () => {
      const records = await getAllTimeRecords();
      expect(Number(records.longestAirtime.airtime)).toBe(540);
    });

    it("picks flight 203 (score=280) as the highest score", async () => {
      const records = await getAllTimeRecords();
      expect(Number(records.highestScore.score)).toBe(280);
      expect(records.highestScore.pilot_name).toBe("Bob Popescu");
    });

    it("excludes HG flights from records", async () => {
      const records = await getAllTimeRecords();
      // Flight 302 (HG, 30km) should never appear
      expect(records.longest.glider_category).not.toBe("HG");
    });
  });

  describe("getCategoryRecords", () => {
    it("returns one record per glider category", async () => {
      const rows = await getCategoryRecords();
      const categories = rows.map((r: Record<string, unknown>) => r.category);
      // Should have B, C, D — not HG
      expect(categories).toContain("B");
      expect(categories).toContain("C");
      expect(categories).toContain("D");
      expect(categories).not.toContain("HG");
    });

    it("picks the longest flight for each category", async () => {
      const rows = await getCategoryRecords();
      const catMap = Object.fromEntries(
        rows.map((r: Record<string, unknown>) => [r.category, Number(r.distance_km)])
      );
      // B: max is 102(80.5km) — Sigma 11 or Atlas 2
      expect(catMap["B"]).toBe(80.5);
      // C: only 202(45km) — Mentor 7
      expect(catMap["C"]).toBe(45);
      // D: max is 203(310km) — Enzo 3
      expect(catMap["D"]).toBe(310);
    });
  });

  describe("getAnnualRecords", () => {
    it("returns one record per year", async () => {
      const rows = await getAnnualRecords();
      const years = rows.map((r: Record<string, unknown>) => Number(r.year));
      expect(years).toContain(2022);
      expect(years).toContain(2023);
    });

    it("picks the longest flight for each year", async () => {
      const rows = await getAnnualRecords();
      const yearMap = Object.fromEntries(
        rows.map((r: Record<string, unknown>) => [Number(r.year), Number(r.distance_km)])
      );
      // 2022: max = 310 (flight 203)
      expect(yearMap[2022]).toBe(310);
      // 2023: max = 120 (flight 101)
      expect(yearMap[2023]).toBe(120);
    });
  });
});
