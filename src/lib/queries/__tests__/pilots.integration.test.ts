/**
 * @jest-environment node
 *
 * Integration tests for pilot queries.
 * Runs against xcontest_test with seeded data.
 *
 * Seed data (PG only):
 *   Alice(1):   flights 101(120km,Bunloc,Enzo3), 102(80.5km,Bunloc,Sigma11),
 *               103(3.2km,Sticlaria,Atlas2), 104(65km,Bunloc,Enzo3),
 *               105(10km,null takeoff,Sigma11)
 *   Bob(2):     flights 201(250km,Bunloc,Enzo3), 202(45km,Sticlaria,Mentor7),
 *               203(310km,Bunloc,Enzo3)
 *   Charlie(3): flight 301(15km,Brasov,Sigma11)  [302 is HG, excluded]
 */
import { canRunIntegrationTests, seedStandardData, truncateAll, closeConnection } from "../test-utils";

jest.mock("../../db", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const helpers = require("../test-utils");
  return { db: helpers.testDb };
});

import {
  getPilotByUsername,
  getPilotStats,
  getPilotFavoriteTakeoff,
  getPilotYearlyStats,
  getPilotEquipmentTimeline,
  getPilotActivityHeatmap,
  getPilotTopFlights,
  getPilotDistanceHistogram,
} from "../pilots";

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

describeIf("pilot queries (integration)", () => {
  describe("getPilotByUsername", () => {
    it("returns the correct pilot for a known username", async () => {
      const pilot = await getPilotByUsername("alice.ionescu");
      expect(pilot).not.toBeNull();
      expect(pilot!.name).toBe("Alice Ionescu");
      expect(Number(pilot!.id)).toBe(1);
    });

    it("returns null for a non-existent username", async () => {
      const pilot = await getPilotByUsername("nonexistent.user");
      expect(pilot).toBeNull();
    });
  });

  describe("getPilotStats", () => {
    it("computes correct stats for Alice (5 PG flights)", async () => {
      const stats = await getPilotStats(1);
      expect(Number(stats.total_flights)).toBe(5);
      // 120 + 80.5 + 3.2 + 65 + 10 = 278.7 → rounds to 279
      expect(Number(stats.total_km)).toBe(279);
      expect(Number(stats.max_distance)).toBe(120);
    });

    it("excludes HG flights from Charlie's stats", async () => {
      const stats = await getPilotStats(3);
      // Charlie has flight 301(15km PG) + 302(30km HG) — only 301 counts
      expect(Number(stats.total_flights)).toBe(1);
      expect(Number(stats.max_distance)).toBe(15);
    });
  });

  describe("getPilotFavoriteTakeoff", () => {
    it("returns Bunloc for Alice (3 flights there vs 1 at Sticlaria)", async () => {
      const fav = await getPilotFavoriteTakeoff(1);
      expect(fav).not.toBeNull();
      expect(fav!.name).toBe("Bunloc Launch");
      // Alice at Bunloc: flights 101, 102, 104 = 3
      expect(Number(fav!.cnt)).toBe(3);
    });

    it("returns Bunloc for Bob (2 flights there vs 1 elsewhere)", async () => {
      const fav = await getPilotFavoriteTakeoff(2);
      expect(fav).not.toBeNull();
      expect(fav!.name).toBe("Bunloc Launch");
      // Bob at Bunloc: flights 201, 203 = 2
      expect(Number(fav!.cnt)).toBe(2);
    });
  });

  describe("getPilotYearlyStats", () => {
    it("groups Bob's flights into correct years", async () => {
      const rows = await getPilotYearlyStats(2);
      // Bob: 2022 (flights 201, 203), 2024 (flight 202)
      expect(rows.length).toBe(2);

      const y2022 = rows.find((r: Record<string, unknown>) => Number(r.year) === 2022);
      expect(y2022).toBeDefined();
      expect(Number(y2022!.flight_count)).toBe(2);
      expect(Number(y2022!.max_distance)).toBe(310);
    });
  });

  describe("getPilotEquipmentTimeline", () => {
    it("lists all gliders used by Alice, ordered by first use", async () => {
      const rows = await getPilotEquipmentTimeline(1);
      // Alice used: Sigma 11(B), Enzo 3(D), Atlas 2(B)
      expect(rows.length).toBe(3);
      const names = rows.map((r: Record<string, unknown>) => r.name);
      expect(names).toContain("Advance Sigma 11");
      expect(names).toContain("Ozone Enzo 3");
      expect(names).toContain("Gin Atlas 2");
    });
  });

  describe("getPilotActivityHeatmap", () => {
    it("returns flight counts grouped by year/month for Alice", async () => {
      const rows = await getPilotActivityHeatmap(1);
      // Alice has flights in: 2023-06(105), 2023-07(101,102), 2023-08(103), 2024-05(104)
      const jul2023 = rows.find(
        (r: Record<string, unknown>) => Number(r.year) === 2023 && Number(r.month) === 7
      );
      expect(jul2023).toBeDefined();
      expect(Number(jul2023!.flight_count)).toBe(2);
    });
  });

  describe("getPilotTopFlights", () => {
    it("returns Bob's flights ordered by distance DESC", async () => {
      const rows = await getPilotTopFlights(2);
      expect(rows.length).toBe(3);
      // 310, 250, 45
      expect(Number(rows[0].distance_km)).toBe(310);
      expect(Number(rows[1].distance_km)).toBe(250);
      expect(Number(rows[2].distance_km)).toBe(45);
    });
  });

  describe("getPilotDistanceHistogram", () => {
    it("buckets Alice's flights correctly", async () => {
      const rows = await getPilotDistanceHistogram(1);
      // Alice: 3.2→'1-5', 10→'5-20', 65→'50-100', 80.5→'50-100', 120→'100+'
      const bucketMap = Object.fromEntries(
        rows.map((r: Record<string, unknown>) => [r.bucket, Number(r.cnt)])
      );
      expect(bucketMap["1-5"]).toBe(1);    // 3.2
      expect(bucketMap["5-20"]).toBe(1);    // 10
      expect(bucketMap["50-100"]).toBe(2);  // 65, 80.5
      expect(bucketMap["100+"]).toBe(1);    // 120
    });
  });
});
