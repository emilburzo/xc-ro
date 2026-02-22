import {
  getAllTimeRecords,
  getCategoryRecords,
  getSiteRecords,
  getAnnualRecords,
  getFunStats,
} from "../records";

const mockExecute = jest.fn();

jest.mock("../../db", () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
}));

const sampleFlightRecord = {
  distance_km: 350,
  score: 300,
  airtime: 540,
  start_time: "2022-07-08",
  url: "https://example.com/1",
  pilot_name: "John",
  pilot_username: "john",
  takeoff_name: "Sticlaria",
  takeoff_id: 10,
  glider_id: 1,
  glider_name: "Enzo 3",
  glider_category: "D",
};

describe("records queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllTimeRecords", () => {
    it("returns longest, longestAirtime, and highestScore records", async () => {
      const longest = { ...sampleFlightRecord, distance_km: 350 };
      const longestAirtime = { ...sampleFlightRecord, airtime: 600 };
      const highestScore = { ...sampleFlightRecord, score: 400 };

      mockExecute
        .mockResolvedValueOnce([longest])
        .mockResolvedValueOnce([longestAirtime])
        .mockResolvedValueOnce([highestScore]);

      const result = await getAllTimeRecords();
      expect(result).toEqual({
        longest,
        longestAirtime,
        highestScore,
      });
      expect(mockExecute).toHaveBeenCalledTimes(3);
    });
  });

  describe("getCategoryRecords", () => {
    it("returns one record per glider category", async () => {
      const rows = [
        { ...sampleFlightRecord, category: "A", distance_km: 100 },
        { ...sampleFlightRecord, category: "B", distance_km: 200 },
        { ...sampleFlightRecord, category: "C", distance_km: 280 },
        { ...sampleFlightRecord, category: "D", distance_km: 350 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getCategoryRecords();
      expect(result).toEqual(rows);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSiteRecords", () => {
    it("returns one record per takeoff site", async () => {
      const rows = [
        { takeoff_id: 42, takeoff_name: "Bunloc", distance_km: 150, start_time: "2020-08-01", url: "https://example.com/2", pilot_name: "Alice", pilot_username: "alice", glider_name: "Mentor 7" },
        { takeoff_id: 10, takeoff_name: "Sticlaria", distance_km: 350, start_time: "2022-07-08", url: "https://example.com/1", pilot_name: "John", pilot_username: "john", glider_name: "Enzo 3" },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getSiteRecords();
      expect(result).toEqual(rows);
    });
  });

  describe("getAnnualRecords", () => {
    it("returns one record per year", async () => {
      const rows = [
        { year: 2020, ...sampleFlightRecord, distance_km: 250 },
        { year: 2021, ...sampleFlightRecord, distance_km: 300 },
        { year: 2022, ...sampleFlightRecord, distance_km: 350 },
      ];
      mockExecute.mockResolvedValueOnce(rows);

      const result = await getAnnualRecords();
      expect(result).toEqual(rows);
    });
  });

  describe("getFunStats", () => {
    it("returns epic day, most flights day, most sites pilot, and most consistent", async () => {
      const epicDay = { day: "2022-07-08", flight_count: 50, pilot_count: 30, pilots_300k: 5 };
      const mostFlightsDay = { day: "2023-06-15", flight_count: 80, pilot_count: 40 };
      const mostSitesPilot = { name: "Explorer", username: "explorer", site_count: 50 };
      const mostConsistent = { name: "Veteran", username: "veteran", years_active: 15 };

      mockExecute
        .mockResolvedValueOnce([epicDay])
        .mockResolvedValueOnce([mostFlightsDay])
        .mockResolvedValueOnce([mostSitesPilot])
        .mockResolvedValueOnce([mostConsistent]);

      const result = await getFunStats();
      expect(result).toEqual({
        epicDay,
        mostFlightsDay,
        mostSitesPilot,
        mostConsistent,
      });
      expect(mockExecute).toHaveBeenCalledTimes(4);
    });
  });
});
