import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { getDailyFlights, getAdjacentFlightDays } from "../daily";

const mockExecute = jest.fn();

jest.mock("../../db", () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
}));

/** The SQL text and bound parameters of the n-th db.execute call. */
function executedQuery(call = 0) {
  return new PgDialect().sqlToQuery(mockExecute.mock.calls[call][0] as SQL);
}

// What the postgres.js driver returns: bigint ids and timestamps as strings
const dbRow = {
  id: "7013822",
  start_time: "2026-10-24 17:35:00",
  distance_km: 16.07,
  score: 16.07,
  airtime: 27,
  type: "zbor liber",
  url: "https://www.xcontest.org/romania/zboruri/detalii:Toni007/24.10.2026/14:35",
  pilot_name: "Anton Mihai",
  pilot_username: "Toni007",
  takeoff_id: "1423",
  takeoff_name: "Vf. Scara",
  glider_name: "ADVANCE Iota DLS",
  glider_category: "B",
};

describe("daily queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDailyFlights", () => {
    it("maps rows to typed flights", async () => {
      mockExecute.mockResolvedValueOnce([dbRow]);

      const result = await getDailyFlights("2026-10-24");
      expect(result).toEqual([
        {
          id: 7013822,
          start_time: "2026-10-24 17:35:00",
          distance_km: 16.07,
          score: 16.07,
          airtime: 27,
          type: "zbor liber",
          url: "https://www.xcontest.org/romania/zboruri/detalii:Toni007/24.10.2026/14:35",
          pilot_name: "Anton Mihai",
          pilot_username: "Toni007",
          takeoff_id: 1423,
          takeoff_name: "Vf. Scara",
          glider_name: "ADVANCE Iota DLS",
          glider_category: "B",
        },
      ]);
    });

    it("keeps a missing takeoff as null", async () => {
      mockExecute.mockResolvedValueOnce([{ ...dbRow, takeoff_id: null, takeoff_name: null }]);

      const [flight] = await getDailyFlights("2026-10-24");
      expect(flight.takeoff_id).toBeNull();
      expect(flight.takeoff_name).toBeNull();
    });

    it("returns an empty array for a day without flights", async () => {
      mockExecute.mockResolvedValueOnce([]);

      expect(await getDailyFlights("2026-10-25")).toEqual([]);
    });

    it("passes the day as a bound parameter and reads paragliding flights only", async () => {
      mockExecute.mockResolvedValueOnce([]);

      await getDailyFlights("2026-10-24");
      const query = executedQuery();
      expect(query.params).toEqual(["2026-10-24", "2026-10-24"]);
      expect(query.sql).toContain("FROM flights_pg f");
      expect(query.sql).not.toContain("2026-10-24");
    });
  });

  describe("getAdjacentFlightDays", () => {
    it("returns the previous and next days with flights", async () => {
      mockExecute.mockResolvedValueOnce([{ prev: "2026-10-23", next: "2026-10-26" }]);

      expect(await getAdjacentFlightDays("2026-10-24")).toEqual({ prev: "2026-10-23", next: "2026-10-26" });
      expect(executedQuery().params).toEqual(["2026-10-24", "2026-10-24"]);
    });

    it("returns nulls at the ends of the data", async () => {
      mockExecute.mockResolvedValueOnce([{ prev: null, next: null }]);

      expect(await getAdjacentFlightDays("2026-10-24")).toEqual({ prev: null, next: null });
    });

    it("tolerates an empty result", async () => {
      mockExecute.mockResolvedValueOnce([]);

      expect(await getAdjacentFlightDays("2026-10-24")).toEqual({ prev: null, next: null });
    });
  });
});
