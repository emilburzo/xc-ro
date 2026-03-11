import {
  getSitemapTakeoffs,
  getSitemapPilots,
  getSitemapWings,
} from "../sitemap";

jest.mock("../../db", () => ({
  db: {
    execute: jest.fn(),
  },
}));

import { db } from "../../db";

describe("sitemap queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getSitemapTakeoffs queries takeoffs table", async () => {
    const mockData = [
      { id: 1, name: "Bunloc" },
      { id: 2, name: "Brașov" },
    ];
    (db.execute as jest.Mock).mockResolvedValueOnce(mockData);

    const result = await getSitemapTakeoffs();
    expect(result).toEqual(mockData);
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it("getSitemapPilots queries pilots table", async () => {
    const mockData = [
      { username: "john_doe" },
      { username: "jane_doe" },
    ];
    (db.execute as jest.Mock).mockResolvedValueOnce(mockData);

    const result = await getSitemapPilots();
    expect(result).toEqual(mockData);
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it("getSitemapWings queries gliders table", async () => {
    const mockData = [
      { id: 1, name: "Advance Sigma 11" },
      { id: 2, name: "Nova Ion 6" },
    ];
    (db.execute as jest.Mock).mockResolvedValueOnce(mockData);

    const result = await getSitemapWings();
    expect(result).toEqual(mockData);
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it("propagates database errors", async () => {
    (db.execute as jest.Mock).mockRejectedValueOnce(
      new Error("connection refused"),
    );
    await expect(getSitemapTakeoffs()).rejects.toThrow("connection refused");
  });
});
