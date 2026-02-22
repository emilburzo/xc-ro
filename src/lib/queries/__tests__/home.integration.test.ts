/**
 * @jest-environment node
 *
 * Integration tests for home queries.
 * Runs against xcontest_test with seeded data.
 *
 * Seed data summary (PG flights only, HG excluded):
 *   Alice:   101(120km), 102(80.5km), 103(3.2km), 104(65km), 105(10km null takeoff)
 *   Bob:     201(250km), 202(45km), 203(310km)
 *   Charlie: 301(15km)
 *   Total PG flights = 9,  Total pilots = 3
 */
import { canRunIntegrationTests, seedStandardData, truncateAll, closeConnection } from "../test-utils";

// Override the db module to use the test database
jest.mock("../../db", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const helpers = require("../test-utils");
  return { db: helpers.testDb };
});

import {
  getHomeStats,
  getSeasonHeatmap,
  getTopTakeoffs,
  getTopPilots,
} from "../home";

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

describeIf("home queries (integration)", () => {
  describe("getHomeStats", () => {
    it("counts only PG flights (excludes HG flight 302)", async () => {
      const stats = await getHomeStats();
      // 9 PG flights total (flight 302 is HG, excluded)
      expect(Number(stats.total_flights)).toBe(9);
    });

    it("counts all pilots (based on pilots table rows)", async () => {
      const stats = await getHomeStats();
      expect(Number(stats.total_pilots)).toBe(3);
    });

    it("sums distance correctly across PG flights", async () => {
      const stats = await getHomeStats();
      // 120 + 80.5 + 3.2 + 250 + 45 + 310 + 15 + 65 + 10 = 898.7 → rounds to 899
      expect(Number(stats.total_distance)).toBe(899);
    });
  });

  describe("getSeasonHeatmap", () => {
    it("groups flights by year and month", async () => {
      const rows = await getSeasonHeatmap();
      // We have flights in: 2022-06, 2022-07, 2023-06, 2023-07, 2023-08, 2023-09, 2024-03, 2024-05
      expect(rows.length).toBe(8);
    });

    it("returns correct count for July 2023 (2 flights: 101, 102)", async () => {
      const rows = await getSeasonHeatmap();
      const jul2023 = rows.find(
        (r: Record<string, unknown>) => Number(r.year) === 2023 && Number(r.month) === 7
      );
      expect(jul2023).toBeDefined();
      expect(Number(jul2023!.flight_count)).toBe(2);
    });
  });

  describe("getTopTakeoffs", () => {
    it("ranks Bunloc first (most flights)", async () => {
      const rows = await getTopTakeoffs(5);
      expect(rows.length).toBeGreaterThanOrEqual(2);
      // Bunloc has flights 101, 102, 201, 203, 104 = 5 PG flights (302 is HG, excluded)
      expect(rows[0].name).toBe("Bunloc Launch");
      expect(Number(rows[0].flight_count)).toBe(5);
    });

    it("respects the limit parameter", async () => {
      const rows = await getTopTakeoffs(1);
      expect(rows.length).toBe(1);
    });
  });

  describe("getTopPilots", () => {
    it("ranks pilots by total_km descending", async () => {
      const rows = await getTopPilots(5);
      // Bob total: 250 + 45 + 310 = 605
      // Alice total: 120 + 80.5 + 3.2 + 65 + 10 = 278.7
      // Charlie total: 15
      expect(rows[0].username).toBe("bob.popescu");
      expect(Number(rows[0].total_km)).toBe(605);
      expect(rows[1].username).toBe("alice.ionescu");
      expect(Number(rows[1].total_km)).toBe(279); // rounds to 279
    });
  });
});
