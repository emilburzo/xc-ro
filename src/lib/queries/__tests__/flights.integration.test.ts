/**
 * @jest-environment node
 *
 * Integration tests for flights search queries.
 * Runs against xcontest_test with seeded data.
 *
 * Tests verify that filters correctly include/exclude rows from the result set.
 */
import { canRunIntegrationTests, seedStandardData, truncateAll, closeConnection } from "../test-utils";

jest.mock("../../db", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const helpers = require("../test-utils");
  return { db: helpers.testDb };
});

import { getFlightsList } from "../flights";

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

describeIf("flights queries (integration)", () => {
  describe("getFlightsList", () => {
    it("returns all PG flights when no filters applied", async () => {
      const result = await getFlightsList({});
      // 9 PG flights total (excludes HG flight 302)
      expect(result.total).toBe(9);
      expect(result.flights.length).toBe(9);
    });

    it("excludes HG flights from results", async () => {
      const result = await getFlightsList({});
      const ids = result.flights.map((f: Record<string, unknown>) => Number(f.id));
      expect(ids).not.toContain(302); // HG flight
    });

    it("filters by pilot name search", async () => {
      const result = await getFlightsList({ pilotSearch: "Alice" });
      expect(result.total).toBe(5); // Alice has 5 PG flights
      const names = result.flights.map((f: Record<string, unknown>) => f.pilot_name);
      for (const name of names) {
        expect(name).toBe("Alice Ionescu");
      }
    });

    it("filters by pilot username search", async () => {
      const result = await getFlightsList({ pilotSearch: "bob.popescu" });
      expect(result.total).toBe(3); // Bob has 3 PG flights
    });

    it("filters by takeoff name search", async () => {
      const result = await getFlightsList({ takeoffSearch: "Bunloc" });
      // Bunloc flights: 101, 102, 201, 203, 104 = 5 PG flights
      expect(result.total).toBe(5);
    });

    it("filters by takeoff search with diacritics (Sticlăria)", async () => {
      const result = await getFlightsList({ takeoffSearch: "Sticlaria" });
      // Sticlăria flights: 103, 202 = 2
      expect(result.total).toBe(2);
    });

    it("filters by date range", async () => {
      const result = await getFlightsList({
        dateFrom: "2023-07-01",
        dateTo: "2023-07-31",
      });
      // July 2023: flights 101, 102 = 2
      expect(result.total).toBe(2);
    });

    it("filters by minimum distance", async () => {
      const result = await getFlightsList({ distMin: 100 });
      // Flights >=100km: 101(120), 201(250), 203(310) = 3
      expect(result.total).toBe(3);
    });

    it("filters by maximum distance", async () => {
      const result = await getFlightsList({ distMax: 50 });
      // Flights <=50km: 103(3.2), 202(45), 301(15), 105(10) = 4
      expect(result.total).toBe(4);
    });

    it("filters by distance range", async () => {
      const result = await getFlightsList({ distMin: 50, distMax: 150 });
      // 50-150km: 101(120), 102(80.5), 104(65) = 3
      expect(result.total).toBe(3);
    });

    it("filters by flight type", async () => {
      const result = await getFlightsList({ flightType: "FAI triangle" });
      // Only flight 102 is FAI triangle
      expect(result.total).toBe(1);
      expect((result.flights[0] as Record<string, unknown>).type).toBe("FAI triangle");
    });

    it("filters by glider category", async () => {
      const result = await getFlightsList({ gliderCategory: "D" });
      // D flights: 101, 201, 203, 104 = 4 (all Enzo 3)
      expect(result.total).toBe(4);
    });

    it("combines multiple filters correctly", async () => {
      const result = await getFlightsList({
        pilotSearch: "Bob",
        distMin: 200,
        gliderCategory: "D",
      });
      // Bob + D + >=200km: 201(250), 203(310) = 2
      expect(result.total).toBe(2);
    });

    it("sorts by distance ascending", async () => {
      const result = await getFlightsList({ sortBy: "distance", sortDir: "asc", pageSize: 3 });
      const distances = result.flights.map((f: Record<string, unknown>) => Number(f.distance_km));
      expect(distances[0]).toBe(3.2);
      expect(distances[1]).toBeLessThanOrEqual(distances[2]);
    });

    it("sorts by distance descending", async () => {
      const result = await getFlightsList({ sortBy: "distance", sortDir: "desc", pageSize: 3 });
      const distances = result.flights.map((f: Record<string, unknown>) => Number(f.distance_km));
      expect(distances[0]).toBe(310);
      expect(distances[1]).toBe(250);
    });

    it("paginates correctly", async () => {
      const page1 = await getFlightsList({ pageSize: 3, page: 1, sortBy: "distance", sortDir: "desc" });
      const page2 = await getFlightsList({ pageSize: 3, page: 2, sortBy: "distance", sortDir: "desc" });
      expect(page1.flights.length).toBe(3);
      expect(page2.flights.length).toBe(3);
      // No overlap between pages
      const ids1 = page1.flights.map((f: Record<string, unknown>) => f.id);
      const ids2 = page2.flights.map((f: Record<string, unknown>) => f.id);
      for (const id of ids1) {
        expect(ids2).not.toContain(id);
      }
    });

    it("returns zero results for filters that match nothing", async () => {
      const result = await getFlightsList({ pilotSearch: "nonexistent" });
      expect(result.total).toBe(0);
      expect(result.flights.length).toBe(0);
    });
  });
});
