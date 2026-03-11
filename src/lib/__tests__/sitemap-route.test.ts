jest.mock("@/lib/queries/sitemap", () => ({
  getSitemapTakeoffs: jest.fn(),
  getSitemapPilots: jest.fn(),
  getSitemapWings: jest.fn(),
}));

jest.mock("@/lib/seo", () => ({
  getBaseUrl: () => "https://xc-ro.emilburzo.com",
}));

import sitemap from "../../app/sitemap";
import {
  getSitemapTakeoffs,
  getSitemapPilots,
  getSitemapWings,
} from "@/lib/queries/sitemap";

describe("sitemap route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns static pages plus dynamic entries on success", async () => {
    (getSitemapTakeoffs as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: "Bunloc" },
    ]);
    (getSitemapPilots as jest.Mock).mockResolvedValueOnce([
      { username: "john_doe" },
    ]);
    (getSitemapWings as jest.Mock).mockResolvedValueOnce([
      { id: 10, name: "Advance Sigma 11" },
    ]);

    const result = await sitemap();

    // 6 static pages + 1 takeoff + 1 pilot + 1 wing = 9
    expect(result).toHaveLength(9);

    const urls = result.map((entry) => entry.url);

    // Static pages
    expect(urls).toContain("https://xc-ro.emilburzo.com");
    expect(urls).toContain("https://xc-ro.emilburzo.com/takeoffs");
    expect(urls).toContain("https://xc-ro.emilburzo.com/pilots");
    expect(urls).toContain("https://xc-ro.emilburzo.com/wings");
    expect(urls).toContain("https://xc-ro.emilburzo.com/flights");
    expect(urls).toContain("https://xc-ro.emilburzo.com/records");

    // Dynamic entries
    expect(urls).toContain("https://xc-ro.emilburzo.com/takeoffs/1-bunloc");
    expect(urls).toContain("https://xc-ro.emilburzo.com/pilots/john_doe");
    expect(urls).toContain(
      "https://xc-ro.emilburzo.com/wings/10-advance-sigma-11",
    );
  });

  it("returns only static pages when database fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (getSitemapTakeoffs as jest.Mock).mockRejectedValueOnce(
      new Error("connection refused"),
    );

    const result = await sitemap();

    // Only the 6 static pages
    expect(result).toHaveLength(6);

    const urls = result.map((entry) => entry.url);
    expect(urls).toContain("https://xc-ro.emilburzo.com");
    expect(urls).toContain("https://xc-ro.emilburzo.com/takeoffs");
    expect(urls).not.toEqual(
      expect.arrayContaining([expect.stringContaining("/takeoffs/")]),
    );

    // Verify the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to build dynamic sitemap entries:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("assigns correct priorities to sitemap entries", async () => {
    (getSitemapTakeoffs as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: "Bunloc" },
    ]);
    (getSitemapPilots as jest.Mock).mockResolvedValueOnce([
      { username: "john_doe" },
    ]);
    (getSitemapWings as jest.Mock).mockResolvedValueOnce([
      { id: 10, name: "Nova Ion 6" },
    ]);

    const result = await sitemap();

    const home = result.find(
      (e) => e.url === "https://xc-ro.emilburzo.com",
    );
    expect(home?.priority).toBe(1.0);

    const takeoff = result.find((e) =>
      e.url.includes("/takeoffs/1-"),
    );
    expect(takeoff?.priority).toBe(0.7);

    const pilot = result.find((e) =>
      e.url.includes("/pilots/john_doe"),
    );
    expect(pilot?.priority).toBe(0.6);

    const wing = result.find((e) =>
      e.url.includes("/wings/10-"),
    );
    expect(wing?.priority).toBe(0.5);
  });
});
