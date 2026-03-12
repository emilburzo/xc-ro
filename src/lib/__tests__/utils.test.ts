import {
  removeDiacritics,
  slugify,
  takeoffPath,
  pilotPath,
  flightPath,
  similarFlightsUrl,
  formatDuration,
  formatDistance,
  formatNumber,
  formatDate,
  formatTime,
  relativeTime,
} from "../utils";

describe("removeDiacritics", () => {
  it("removes Romanian diacritics", () => {
    expect(removeDiacritics("Brașov")).toBe("Brasov");
  });

  it("removes Hungarian accents", () => {
    expect(removeDiacritics("Székely")).toBe("Szekely");
  });

  it("removes multiple diacritics", () => {
    expect(removeDiacritics("Sânpetru Județul Brașov")).toBe("Sanpetru Judetul Brasov");
  });

  it("preserves plain ASCII text", () => {
    expect(removeDiacritics("Bunloc Launch")).toBe("Bunloc Launch");
  });

  it("handles empty string", () => {
    expect(removeDiacritics("")).toBe("");
  });

  it("preserves case", () => {
    expect(removeDiacritics("BRAȘOV")).toBe("BRASOV");
  });
});

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Bunloc Launch")).toBe("bunloc-launch");
  });

  it("strips diacritics", () => {
    expect(slugify("Brașov Nord")).toBe("brasov-nord");
  });

  it("replaces multiple special chars with single hyphen", () => {
    expect(slugify("Site A / Site B")).toBe("site-a-site-b");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles all-special-char string", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("handles Romanian characters", () => {
    expect(slugify("Sânpetru Județul Brașov")).toBe("sanpetru-judetul-brasov");
  });
});

describe("takeoffPath", () => {
  it("generates correct path with id and slugified name", () => {
    expect(takeoffPath(42, "Bunloc Launch")).toBe("/takeoffs/42-bunloc-launch");
  });

  it("handles names with diacritics", () => {
    expect(takeoffPath(1, "Brașov")).toBe("/takeoffs/1-brasov");
  });
});

describe("pilotPath", () => {
  it("generates correct path", () => {
    expect(pilotPath("john.doe")).toBe("/pilots/john.doe");
  });
});

describe("flightPath", () => {
  it("generates correct path with numeric id", () => {
    expect(flightPath(12345)).toBe("/flights/12345");
  });

  it("generates correct path with large flight id", () => {
    expect(flightPath(9876543)).toBe("/flights/9876543");
  });
});

describe("similarFlightsUrl", () => {
  it("generates URL with takeoff name and ±20% distance range", () => {
    const url = similarFlightsUrl("Bunloc", 100);
    expect(url).toBe("/flights?takeoff=Bunloc&distMin=80.0&distMax=120.0&sort=distance");
  });

  it("rounds distance values to one decimal place", () => {
    const url = similarFlightsUrl("Bunloc", 33.3);
    expect(url).toBe("/flights?takeoff=Bunloc&distMin=26.6&distMax=40.0&sort=distance");
  });

  it("encodes takeoff names with special characters", () => {
    const url = similarFlightsUrl("Brașov Nord", 50);
    expect(url).toContain("takeoff=Bra%C8%99ov+Nord");
    expect(url).toContain("distMin=40.0");
    expect(url).toContain("distMax=60.0");
  });

  it("handles small distances", () => {
    const url = similarFlightsUrl("Test", 2.5);
    expect(url).toBe("/flights?takeoff=Test&distMin=2.0&distMax=3.0&sort=distance");
  });

  it("always sorts by distance", () => {
    const url = similarFlightsUrl("Site", 10);
    expect(url).toContain("sort=distance");
  });
});

describe("formatDuration", () => {
  it("formats minutes-only duration", () => {
    expect(formatDuration(45)).toBe("45m");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(130)).toBe("2h 10m");
  });

  it("formats exact hours", () => {
    expect(formatDuration(120)).toBe("2h 0m");
  });

  it("formats zero minutes", () => {
    expect(formatDuration(0)).toBe("0m");
  });
});

describe("formatDistance", () => {
  it("formats to one decimal place", () => {
    expect(formatDistance(4.789)).toBe("4.8");
  });

  it("formats integer distances", () => {
    expect(formatDistance(100)).toBe("100.0");
  });

  it("formats zero", () => {
    expect(formatDistance(0)).toBe("0.0");
  });
});

describe("formatNumber", () => {
  it("formats with Romanian locale separators", () => {
    const result = formatNumber(12345);
    // Romanian locale uses period as thousands separator
    expect(result).toBe("12.345");
  });

  it("formats small numbers without separators", () => {
    expect(formatNumber(42)).toBe("42");
  });
});

describe("formatDate", () => {
  it("formats a date string with Romanian locale", () => {
    const result = formatDate("2022-07-08", "ro");
    expect(result).toBe(new Date("2022-07-08").toLocaleDateString("ro-RO"));
  });

  it("formats a date string with English locale", () => {
    const result = formatDate("2022-07-08", "en");
    expect(result).toBe(new Date("2022-07-08").toLocaleDateString("en-US"));
  });

  it("formats a Date object with Romanian locale", () => {
    const d = new Date("2025-01-15T10:30:00Z");
    const result = formatDate(d, "ro");
    expect(result).toBe(d.toLocaleDateString("ro-RO"));
  });

  it("formats a Date object with English locale", () => {
    const d = new Date("2025-01-15T10:30:00Z");
    const result = formatDate(d, "en");
    expect(result).toBe(d.toLocaleDateString("en-US"));
  });

  it("defaults to en-US for unknown locales", () => {
    const result = formatDate("2022-07-08", "fr");
    expect(result).toBe(new Date("2022-07-08").toLocaleDateString("en-US"));
  });
});

describe("formatTime", () => {
  it("formats a date string to time with Romanian locale", () => {
    const d = new Date("2025-01-15T10:30:00Z");
    const result = formatTime(d, "ro");
    expect(result).toBe(d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }));
  });

  it("formats a date string to time with English locale", () => {
    const d = new Date("2025-01-15T10:30:00Z");
    const result = formatTime(d, "en");
    expect(result).toBe(d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  });

  it("formats a string date to time", () => {
    const result = formatTime("2025-01-15T14:45:00Z", "ro");
    const expected = new Date("2025-01-15T14:45:00Z").toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
    expect(result).toBe(expected);
  });
});

describe("relativeTime", () => {
  // Use a fixed date to avoid flakiness from midnight/boundary crossings
  const FIXED_NOW = new Date("2025-06-15T12:00:00Z").getTime();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns 'today' for today in English", () => {
    expect(relativeTime(new Date(FIXED_NOW), "en")).toBe("today");
  });

  it("returns 'azi' for today in Romanian", () => {
    expect(relativeTime(new Date(FIXED_NOW), "ro")).toBe("azi");
  });

  it("returns 'yesterday' for 1 day ago in English", () => {
    const yesterday = new Date(FIXED_NOW - 1 * 24 * 60 * 60 * 1000);
    expect(relativeTime(yesterday, "en")).toBe("yesterday");
  });

  it("returns 'ieri' for 1 day ago in Romanian", () => {
    const yesterday = new Date(FIXED_NOW - 1 * 24 * 60 * 60 * 1000);
    expect(relativeTime(yesterday, "ro")).toBe("ieri");
  });

  it("returns days ago for less than 30 days", () => {
    const tenDaysAgo = new Date(FIXED_NOW - 10 * 24 * 60 * 60 * 1000);
    expect(relativeTime(tenDaysAgo, "en")).toBe("10 days ago");
  });

  it("returns months ago for less than 365 days", () => {
    const ninetyDaysAgo = new Date(FIXED_NOW - 90 * 24 * 60 * 60 * 1000);
    expect(relativeTime(ninetyDaysAgo, "en")).toBe("3 months ago");
  });

  it("returns years ago for 365+ days", () => {
    const twoYearsAgo = new Date(FIXED_NOW - 730 * 24 * 60 * 60 * 1000);
    expect(relativeTime(twoYearsAgo, "en")).toBe("2 years ago");
  });

  it("returns Romanian months", () => {
    const ninetyDaysAgo = new Date(FIXED_NOW - 90 * 24 * 60 * 60 * 1000);
    expect(relativeTime(ninetyDaysAgo, "ro")).toBe("acum 3 luni");
  });

  it("returns Romanian years", () => {
    const twoYearsAgo = new Date(FIXED_NOW - 730 * 24 * 60 * 60 * 1000);
    expect(relativeTime(twoYearsAgo, "ro")).toBe("acum 2 ani");
  });
});
