import {
  getPilotsList,
  getPilotByUsername,
  getPilotStats,
  getPilotFavoriteTakeoff,
  getPilotYearlyStats,
  getPilotSiteMap,
  getPilotEquipmentTimeline,
  getPilotActivityHeatmap,
  getPilotTopFlights,
  getPilotDistanceHistogram,
} from "../pilots";

const mockExecute = jest.fn();

jest.mock("../../db", () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
}));

describe("pilot queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPilotsList", () => {
    it("returns pilot list with stats and favorite site", async () => {
      const rows = [
        {
          id: 1,
          name: "John Doe",
          username: "john.doe",
          flight_count: 200,
          total_km: 5000,
          total_score: 3000,
          avg_distance: 25,
          max_distance: 300,
          active_years: 5,
          last_flight: "2025-06-01",
          fav_takeoff_id: 42,
          fav_takeoff_name: "Bunloc",
        },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getPilotsList();
      expect(result).toEqual(rows);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe("getPilotByUsername", () => {
    it("returns the pilot when found", async () => {
      const pilot = { id: 1, name: "John Doe", username: "john.doe" };
      mockExecute.mockResolvedValueOnce([pilot]);

      const result = await getPilotByUsername("john.doe");
      expect(result).toEqual(pilot);
    });

    it("returns null when pilot not found", async () => {
      mockExecute.mockResolvedValueOnce([]);

      const result = await getPilotByUsername("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("getPilotStats", () => {
    it("returns aggregated stats for a pilot", async () => {
      const stats = {
        total_flights: 200,
        total_km: 5000,
        total_score: 3000,
        max_distance: 300,
        avg_distance: 25,
        active_since: 2018,
        last_flight: "2025-06-01",
      };
      mockExecute.mockResolvedValueOnce([stats]);

      const result = await getPilotStats(1);
      expect(result).toEqual(stats);
    });
  });

  describe("getPilotFavoriteTakeoff", () => {
    it("returns the most-used takeoff", async () => {
      const takeoff = { id: 42, name: "Bunloc", cnt: 150 };
      mockExecute.mockResolvedValueOnce([takeoff]);

      const result = await getPilotFavoriteTakeoff(1);
      expect(result).toEqual(takeoff);
    });

    it("returns null when pilot has no flights with takeoffs", async () => {
      mockExecute.mockResolvedValueOnce([]);

      const result = await getPilotFavoriteTakeoff(999);
      expect(result).toBeNull();
    });
  });

  describe("getPilotYearlyStats", () => {
    it("returns yearly breakdown", async () => {
      const rows = [
        { year: 2022, flight_count: 50, avg_distance: 20, max_distance: 200 },
        { year: 2023, flight_count: 80, avg_distance: 25, max_distance: 250 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getPilotYearlyStats(1);
      expect(result).toEqual(rows);
    });
  });

  describe("getPilotSiteMap", () => {
    it("returns takeoffs with coordinates and flight counts", async () => {
      const rows = [
        { id: 42, name: "Bunloc", lat: 45.6, lng: 25.5, flight_count: 100 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getPilotSiteMap(1);
      expect(result).toEqual(rows);
    });
  });

  describe("getPilotEquipmentTimeline", () => {
    it("returns glider usage timeline", async () => {
      const rows = [
        {
          name: "Enzo 3",
          category: "D",
          flight_count: 50,
          first_used: "2020-03-01",
          last_used: "2023-09-15",
        },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getPilotEquipmentTimeline(1);
      expect(result).toEqual(rows);
    });
  });

  describe("getPilotActivityHeatmap", () => {
    it("returns year/month flight counts", async () => {
      const rows = [
        { year: 2022, month: 7, flight_count: 15 },
        { year: 2022, month: 8, flight_count: 10 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getPilotActivityHeatmap(1);
      expect(result).toEqual(rows);
    });
  });

  describe("getPilotTopFlights", () => {
    it("returns top 10 flights by distance", async () => {
      const rows = [
        {
          start_time: "2022-07-08",
          distance_km: 300,
          score: 250,
          airtime: 480,
          url: "https://example.com/1",
          type: "free flight",
          takeoff_name: "Sticlaria",
          takeoff_id: 10,
          glider_name: "Enzo 3",
          glider_category: "D",
        },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getPilotTopFlights(1);
      expect(result).toEqual(rows);
    });
  });

  describe("getPilotDistanceHistogram", () => {
    it("returns distance distribution buckets", async () => {
      const rows = [
        { bucket: "0-1", cnt: 10 },
        { bucket: "1-5", cnt: 30 },
        { bucket: "5-20", cnt: 80 },
        { bucket: "20-50", cnt: 50 },
        { bucket: "50-100", cnt: 20 },
        { bucket: "100+", cnt: 5 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getPilotDistanceHistogram(1);
      expect(result).toEqual(rows);
    });
  });
});
