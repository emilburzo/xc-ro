import { getFlightsList, type FlightFilters } from "../flights";

const mockExecute = jest.fn();

jest.mock("../../db", () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
}));

const sampleFlight = {
  id: 1,
  start_time: "2022-07-08",
  distance_km: 120,
  score: 100,
  airtime: 180,
  type: "free flight",
  url: "https://example.com/1",
  pilot_name: "John",
  pilot_username: "john",
  takeoff_name: "Bunloc",
  takeoff_id: 42,
  glider_name: "Enzo 3",
  glider_category: "D",
};

describe("flights queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFlightsList", () => {
    it("returns flights with pagination metadata (no filters)", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 100 }]) // count query
        .mockResolvedValueOnce([sampleFlight]); // data query

      const result = await getFlightsList({});
      expect(result).toEqual({
        flights: [sampleFlight],
        total: 100,
        page: 1,
        pageSize: 50,
      });
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it("defaults to page 1 and pageSize 50", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      const result = await getFlightsList({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(50);
    });

    it("uses custom page and pageSize", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 200 }])
        .mockResolvedValueOnce([]);

      const result = await getFlightsList({ page: 3, pageSize: 25 });
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(25);
    });

    it("handles pilotSearch filter", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 5 }])
        .mockResolvedValueOnce([sampleFlight]);

      const result = await getFlightsList({ pilotSearch: "John" });
      expect(result.total).toBe(5);
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it("handles takeoffSearch filter", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce([]);

      await getFlightsList({ takeoffSearch: "Bunloc" });
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it("handles date range filters", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 20 }])
        .mockResolvedValueOnce([]);

      await getFlightsList({ dateFrom: "2022-01-01", dateTo: "2022-12-31" });
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it("handles distance range filters", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 15 }])
        .mockResolvedValueOnce([]);

      await getFlightsList({ distMin: 50, distMax: 200 });
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it("handles flight type filter", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 8 }])
        .mockResolvedValueOnce([]);

      await getFlightsList({ flightType: "FAI triangle" });
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it("handles glider category filter", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 30 }])
        .mockResolvedValueOnce([]);

      await getFlightsList({ gliderCategory: "D" });
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it("handles ascending sort direction", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 50 }])
        .mockResolvedValueOnce([]);

      await getFlightsList({ sortBy: "distance", sortDir: "asc" });
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it("handles descending sort direction (default)", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 50 }])
        .mockResolvedValueOnce([]);

      await getFlightsList({ sortBy: "score", sortDir: "desc" });
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it("handles all filters combined", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total: 3 }])
        .mockResolvedValueOnce([sampleFlight]);

      const filters: FlightFilters = {
        pilotSearch: "John",
        takeoffSearch: "Bunloc",
        dateFrom: "2022-01-01",
        dateTo: "2022-12-31",
        distMin: 50,
        distMax: 200,
        flightType: "free flight",
        gliderCategory: "D",
        sortBy: "distance",
        sortDir: "desc",
        page: 1,
        pageSize: 25,
      };

      const result = await getFlightsList(filters);
      expect(result.total).toBe(3);
      expect(result.flights).toEqual([sampleFlight]);
    });

    it("returns total of 0 when count result is empty", async () => {
      mockExecute
        .mockResolvedValueOnce([]) // empty count result
        .mockResolvedValueOnce([]);

      const result = await getFlightsList({});
      expect(result.total).toBe(0);
    });
  });
});
