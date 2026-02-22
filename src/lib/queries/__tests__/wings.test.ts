import {
  getWingsList,
  getWingById,
  getWingTopFlights,
  getWingDistanceHistogram,
  getWingAdoptionCurve,
  getWingYearlyStats,
  getWingFavoriteTakeoffs,
  getWingCalendarHeatmap,
} from "../wings";

const mockExecute = jest.fn();

jest.mock("../../db", () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
}));

describe("wing queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getWingsList", () => {
    it("returns wings with flight stats", async () => {
      const rows = [
        {
          id: 1,
          name: "Enzo 3",
          category: "D",
          flight_count: 500,
          pilot_count: 20,
          total_km: 50000,
          avg_distance: 100,
          max_distance: 350,
          avg_speed: 38.5,
          first_year: 2019,
          last_year: 2025,
          last_flight: "2025-06-01",
        },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getWingsList();
      expect(result).toEqual(rows);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe("getWingById", () => {
    it("returns wing when found", async () => {
      const wing = { id: 1, name: "Enzo 3", category: "D" };
      mockExecute.mockResolvedValueOnce([wing]);

      const result = await getWingById(1);
      expect(result).toEqual(wing);
    });

    it("returns null when wing not found", async () => {
      mockExecute.mockResolvedValueOnce([]);

      const result = await getWingById(99999);
      expect(result).toBeNull();
    });
  });

  describe("getWingTopFlights", () => {
    it("returns top 10 flights for a wing", async () => {
      const rows = [
        {
          start_time: "2022-07-08",
          distance_km: 350,
          score: 300,
          airtime: 540,
          url: "https://example.com/1",
          type: "free flight",
          pilot_name: "John",
          pilot_username: "john",
          takeoff_name: "Sticlaria",
          takeoff_id: 10,
          glider_name: "Enzo 3",
          glider_category: "D",
        },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getWingTopFlights(1);
      expect(result).toEqual(rows);
    });
  });

  describe("getWingDistanceHistogram", () => {
    it("returns distance distribution buckets", async () => {
      const rows = [
        { bucket: "0-1", cnt: 5 },
        { bucket: "1-5", cnt: 20 },
        { bucket: "50-100", cnt: 100 },
        { bucket: "100+", cnt: 50 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getWingDistanceHistogram(1);
      expect(result).toEqual(rows);
    });
  });

  describe("getWingAdoptionCurve", () => {
    it("returns yearly pilot adoption counts", async () => {
      const rows = [
        { year: 2019, pilot_count: 2 },
        { year: 2020, pilot_count: 5 },
        { year: 2021, pilot_count: 12 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getWingAdoptionCurve(1);
      expect(result).toEqual(rows);
    });
  });

  describe("getWingYearlyStats", () => {
    it("returns yearly flight counts and total km", async () => {
      const rows = [
        { year: 2020, flight_count: 50, total_km: 5000 },
        { year: 2021, flight_count: 80, total_km: 9000 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getWingYearlyStats(1);
      expect(result).toEqual(rows);
    });
  });

  describe("getWingFavoriteTakeoffs", () => {
    it("returns top 5 takeoffs for a wing", async () => {
      const rows = [
        { id: 42, name: "Bunloc", flight_count: 200 },
        { id: 10, name: "Sticlaria", flight_count: 50 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getWingFavoriteTakeoffs(1);
      expect(result).toEqual(rows);
    });
  });

  describe("getWingCalendarHeatmap", () => {
    it("returns year/month flight counts with avg scores", async () => {
      const rows = [
        { year: 2022, month: 7, flight_count: 30, avg_score: 55.2 },
        { year: 2022, month: 8, flight_count: 20, avg_score: 48.1 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getWingCalendarHeatmap(1);
      expect(result).toEqual(rows);
    });
  });
});
