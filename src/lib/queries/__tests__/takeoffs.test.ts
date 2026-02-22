import {
  getTakeoffsList,
  getTakeoffById,
  getTakeoffCalendarHeatmap,
  getTakeoffMonthlyStats,
  getTakeoffHourlyDistribution,
  getTakeoffDayOfWeek,
  getTakeoffDistanceHistogram,
  getTakeoffTop10,
  getTakeoffWingClasses,
  getTakeoffTopGliders,
  getTakeoffYearlyTrend,
  getTakeoffBusiestDays,
} from "../takeoffs";

const mockExecute = jest.fn();

jest.mock("../../db", () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
}));

describe("takeoff queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTakeoffsList", () => {
    it("returns takeoffs with stats, coordinates, and monthly data", async () => {
      const rows = [
        {
          id: 42,
          name: "Bunloc",
          lat: 45.6,
          lng: 25.5,
          flight_count: 14000,
          pilot_count: 400,
          xc_potential: 85.2,
          record_km: 320,
          last_activity: "2025-06-01",
          weekend_pct: 65,
          flights_100k: 50,
          avg_distance: 15.3,
          ab_pct: 40,
          monthly_data: [{ month: 7, count: 500 }],
        },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTakeoffsList();
      expect(result).toEqual(rows);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe("getTakeoffById", () => {
    it("returns takeoff with coordinates when found", async () => {
      const takeoff = { id: 42, name: "Bunloc", lat: 45.6, lng: 25.5 };
      mockExecute.mockResolvedValueOnce([takeoff]);

      const result = await getTakeoffById(42);
      expect(result).toEqual(takeoff);
    });

    it("returns null when takeoff not found", async () => {
      mockExecute.mockResolvedValueOnce([]);

      const result = await getTakeoffById(99999);
      expect(result).toBeNull();
    });
  });

  describe("getTakeoffCalendarHeatmap", () => {
    it("returns year/month grouped data with scores", async () => {
      const rows = [
        { year: 2022, month: 7, flight_count: 200, avg_score: 35.5 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTakeoffCalendarHeatmap(42);
      expect(result).toEqual(rows);
    });
  });

  describe("getTakeoffMonthlyStats", () => {
    it("returns monthly flight counts and average distances", async () => {
      const rows = [
        { month: 3, flight_count: 100, avg_distance: 12.5 },
        { month: 7, flight_count: 500, avg_distance: 20.3 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTakeoffMonthlyStats(42);
      expect(result).toEqual(rows);
    });
  });

  describe("getTakeoffHourlyDistribution", () => {
    it("returns hourly flight counts for XC flights", async () => {
      const rows = [
        { hour: 10, flight_count: 30 },
        { hour: 11, flight_count: 80 },
        { hour: 12, flight_count: 120 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTakeoffHourlyDistribution(42);
      expect(result).toEqual(rows);
    });
  });

  describe("getTakeoffDayOfWeek", () => {
    it("returns day-of-week distribution", async () => {
      const rows = [
        { dow: 0, flight_count: 500 },
        { dow: 6, flight_count: 600 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTakeoffDayOfWeek(42);
      expect(result).toEqual(rows);
    });
  });

  describe("getTakeoffDistanceHistogram", () => {
    it("returns distance distribution buckets", async () => {
      const rows = [
        { bucket: "0-1", cnt: 500 },
        { bucket: "1-5", cnt: 3000 },
        { bucket: "5-20", cnt: 5000 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTakeoffDistanceHistogram(42);
      expect(result).toEqual(rows);
    });
  });

  describe("getTakeoffTop10", () => {
    it("returns top 10 flights by distance", async () => {
      const rows = [
        {
          start_time: "2022-07-08",
          distance_km: 320,
          score: 280,
          airtime: 540,
          url: "https://example.com/1",
          type: "FAI triangle",
          pilot_name: "John",
          pilot_username: "john",
          glider_name: "Enzo 3",
          glider_category: "D",
        },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTakeoffTop10(42);
      expect(result).toEqual(rows);
    });
  });

  describe("getTakeoffWingClasses", () => {
    it("returns wing category distribution", async () => {
      const rows = [
        { category: "B", cnt: 5000 },
        { category: "C", cnt: 4000 },
        { category: "D", cnt: 2000 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTakeoffWingClasses(42);
      expect(result).toEqual(rows);
    });
  });

  describe("getTakeoffTopGliders", () => {
    it("returns top 5 glider models at takeoff", async () => {
      const rows = [
        { name: "Advance Sigma 11", category: "B", cnt: 300 },
        { name: "Gin Atlas 2", category: "B", cnt: 250 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTakeoffTopGliders(42);
      expect(result).toEqual(rows);
    });
  });

  describe("getTakeoffYearlyTrend", () => {
    it("returns yearly flight counts and total km", async () => {
      const rows = [
        { year: 2020, flight_count: 800, total_km: 12000 },
        { year: 2021, flight_count: 900, total_km: 15000 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTakeoffYearlyTrend(42);
      expect(result).toEqual(rows);
    });
  });

  describe("getTakeoffBusiestDays", () => {
    it("returns busiest days by pilot count", async () => {
      const rows = [
        {
          day: "2022-07-08",
          flight_count: 50,
          pilot_count: 30,
          max_distance: 320.5,
        },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getTakeoffBusiestDays(42);
      expect(result).toEqual(rows);
    });
  });
});
