/**
 * @jest-environment node
 *
 * Integration tests for the daily flights queries.
 * Runs against xcontest_test with seeded data.
 */
import { sql } from "drizzle-orm";
import { canRunIntegrationTests, seedStandardData, truncateAll, closeConnection, testDb } from "../test-utils";

jest.mock("../../db", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const helpers = require("../test-utils");
  return { db: helpers.testDb };
});

import { getDailyFlights, getAdjacentFlightDays } from "../daily";

const describeIf = canRunIntegrationTests ? describe : describe.skip;

beforeAll(async () => {
  if (!canRunIntegrationTests) return;
  await seedStandardData();

  // Standard data has flight 101 (score 100, 120 km) as the only one on 2023-07-15,
  // and 102 alone on 2023-07-16. Crowd the 15th and its edges.
  await testDb.execute(sql`
    INSERT INTO flights (id, pilot_id, takeoff_id, start_time, type, distance_km, score, airtime, glider_id, url) VALUES
      (401, 2, 2, '2023-07-15 00:00:00', 'zbor liber',    50.0,  50.0, 150, 3, 'https://xcontest.org/401'),
      (402, 3, 1, '2023-07-15 23:59:00', 'triunghi FAI', 100.0, 150.0, 200, 5, 'https://xcontest.org/402'),
      (403, 2, 1, '2023-07-15 12:00:00', 'free flight',  130.0, 100.0, 320, 2, 'https://xcontest.org/403'),
      (404, 3, 1, '2023-07-15 13:00:00', 'free flight',   90.0,  95.0, 300, 4, 'https://xcontest.org/404'),
      (405, 2, 1, '2023-07-14 23:59:59', 'free flight',   20.0,  20.0,  60, 3, 'https://xcontest.org/405'),
      (406, 3, 3, '2023-07-16 00:00:00', 'free flight',   10.0,  10.0,  40, 1, 'https://xcontest.org/406')
  `);
});

afterAll(async () => {
  if (!canRunIntegrationTests) return;
  await truncateAll();
  await closeConnection();
});

describeIf("daily queries (integration)", () => {
  describe("getDailyFlights", () => {
    it("returns the day's paragliding flights by score, then distance", async () => {
      const flights = await getDailyFlights("2023-07-15");
      // 404 is a hang glider flight; 405 and 406 fall on the neighbouring days
      // 403 and 101 tie on score, 403 flew further
      expect(flights.map((f) => f.id)).toEqual([402, 403, 101, 401]);
    });

    it("includes flights at both ends of the day", async () => {
      const startTimes = (await getDailyFlights("2023-07-15")).map((f) => f.start_time);
      expect(startTimes).toContain("2023-07-15 00:00:00");
      expect(startTimes).toContain("2023-07-15 23:59:00");
    });

    it("returns typed rows with pilot, takeoff and glider", async () => {
      const [best] = await getDailyFlights("2023-07-15");
      expect(best).toEqual({
        id: 402,
        start_time: "2023-07-15 23:59:00",
        distance_km: 100,
        score: 150,
        airtime: 200,
        type: "triunghi FAI",
        url: "https://xcontest.org/402",
        pilot_name: "Charlie Marinescu",
        pilot_username: "charlie.m",
        takeoff_id: 1,
        takeoff_name: "Bunloc Launch",
        glider_name: "Nova Mentor 7",
        glider_category: "C",
      });
    });

    it("keeps flights without a takeoff", async () => {
      const flights = await getDailyFlights("2023-06-01");
      expect(flights).toHaveLength(1);
      expect(flights[0]).toMatchObject({ id: 105, takeoff_id: null, takeoff_name: null });
    });

    it("returns nothing for a day without paragliding flights", async () => {
      expect(await getDailyFlights("2023-09-06")).toEqual([]); // hang glider flight 302 only
      expect(await getDailyFlights("2020-01-01")).toEqual([]);
    });
  });

  describe("getAdjacentFlightDays", () => {
    it("returns the nearest days with flights on either side", async () => {
      expect(await getAdjacentFlightDays("2023-07-15")).toEqual({ prev: "2023-07-14", next: "2023-07-16" });
    });

    it("works for days without flights", async () => {
      expect(await getAdjacentFlightDays("2023-07-01")).toEqual({ prev: "2023-06-01", next: "2023-07-14" });
    });

    it("skips days that only have hang glider flights", async () => {
      // 2023-09-06 only has hang glider flight 302
      expect(await getAdjacentFlightDays("2023-09-05")).toEqual({ prev: "2023-08-01", next: "2024-03-20" });
      expect(await getAdjacentFlightDays("2024-03-20")).toEqual({ prev: "2023-09-05", next: "2024-05-10" });
    });

    it("returns null past the first and last flights", async () => {
      expect(await getAdjacentFlightDays("2022-06-10")).toEqual({ prev: null, next: "2022-07-08" });
      expect(await getAdjacentFlightDays("2024-05-10")).toEqual({ prev: "2024-03-20", next: null });
    });
  });
});
