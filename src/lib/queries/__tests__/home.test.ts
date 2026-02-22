import {
  getHomeStats,
  getRecentNotableFlights,
  getSeasonHeatmap,
  getTopTakeoffs,
  getTopPilots,
} from "../home";

const mockExecute = jest.fn();

jest.mock("../../db", () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
}));

describe("home queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getHomeStats", () => {
    it("returns the first row of aggregated stats", async () => {
      const row = {
        total_flights: 73000,
        total_pilots: 1100,
        active_takeoffs: 200,
        total_distance: 500000,
      };
      mockExecute.mockResolvedValueOnce([row]);

      const result = await getHomeStats();
      expect(result).toEqual(row);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe("getRecentNotableFlights", () => {
    it("returns flight rows", async () => {
      const rows = [
        {
          id: 1,
          start_time: "2025-06-01",
          distance_km: 120,
          pilot_name: "John",
          pilot_username: "john",
          takeoff_name: "Bunloc",
          takeoff_id: 42,
          glider_name: "Enzo 3",
          glider_category: "D",
        },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getRecentNotableFlights();
      expect(result).toEqual(rows);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it("accepts a custom limit parameter", async () => {
      mockExecute.mockResolvedValueOnce([]);
      await getRecentNotableFlights(5);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSeasonHeatmap", () => {
    it("returns year/month grouped data", async () => {
      const rows = [
        { year: 2022, month: 7, flight_count: 500, avg_score: 45.2 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getSeasonHeatmap();
      expect(result).toEqual(rows);
    });
  });

  describe("getTopTakeoffs", () => {
    it("returns takeoff rankings", async () => {
      const rows = [{ id: 42, name: "Bunloc", flight_count: 14000 }];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTopTakeoffs();
      expect(result).toEqual(rows);
    });

    it("accepts a custom limit parameter", async () => {
      mockExecute.mockResolvedValueOnce([]);
      await getTopTakeoffs(3);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe("getTopPilots", () => {
    it("returns pilot rankings by total_km", async () => {
      const rows = [
        {
          id: 1,
          name: "Top Pilot",
          username: "top.pilot",
          flight_count: 500,
          total_km: 25000,
        },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTopPilots();
      expect(result).toEqual(rows);
    });

    it("accepts a custom limit parameter", async () => {
      mockExecute.mockResolvedValueOnce([]);
      await getTopPilots(10);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });
});
