import {
  removeDiacritics,
  slugify,
  takeoffPath,
  pilotPath,
  flightPath,
  dailyPath,
  similarFlightsPath,
  formatDuration,
  formatDistance,
  formatNumber,
  formatDate,
  formatTime,
  relativeTime,
  todayInRomania,
  parseDay,
  formatDay,
  flightTypeKey,
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
  it("generates correct path with id and pilot name", () => {
    expect(flightPath(12345, "Ion Popescu")).toBe("/flights/12345-ion-popescu");
  });

  it("generates correct path with pilot and takeoff name", () => {
    expect(flightPath(12345, "Ion Popescu", "Bunloc")).toBe("/flights/12345-ion-popescu-bunloc");
  });

  it("handles null takeoff name", () => {
    expect(flightPath(12345, "Ion Popescu", null)).toBe("/flights/12345-ion-popescu");
  });

  it("handles diacritics in names", () => {
    expect(flightPath(42, "Mărișescu Ionuț", "Brașov Nord")).toBe("/flights/42-marisescu-ionut-brasov-nord");
  });

  it("generates correct path with large flight id", () => {
    expect(flightPath(9876543, "Maria Ionescu", "Sticlaria")).toBe("/flights/9876543-maria-ionescu-sticlaria");
  });

  it("falls back to id-only when pilot name slugifies to empty", () => {
    expect(flightPath(123, "!!!")).toBe("/flights/123");
  });

  it("avoids leading hyphen when pilot name is empty but takeoff is valid", () => {
    expect(flightPath(123, "!!!", "Bunloc")).toBe("/flights/123-bunloc");
  });
});

describe("dailyPath", () => {
  it("links to today without a date", () => {
    expect(dailyPath()).toBe("/daily");
  });

  it("links to a specific day", () => {
    expect(dailyPath("2022-07-08")).toBe("/daily?date=2022-07-08");
  });
});

describe("similarFlightsPath", () => {
  function parseParams(path: string) {
    const url = new URL(path, "http://x");
    return Object.fromEntries(url.searchParams.entries());
  }

  it("generates path with takeoff name and ±20% distance range", () => {
    const params = parseParams(similarFlightsPath("Bunloc", 100));
    expect(params.takeoff).toBe("Bunloc");
    expect(Number(params.distMin)).toBe(80);
    expect(Number(params.distMax)).toBe(120);
    expect(params.sort).toBe("distance");
  });

  it("preserves full precision in distance values", () => {
    const params = parseParams(similarFlightsPath("Bunloc", 33.3));
    expect(Number(params.distMin)).toBeCloseTo(26.64, 5);
    expect(Number(params.distMax)).toBeCloseTo(39.96, 5);
  });

  it("encodes takeoff names with special characters", () => {
    const params = parseParams(similarFlightsPath("Brașov Nord", 50));
    expect(params.takeoff).toBe("Brașov Nord");
    expect(Number(params.distMin)).toBe(40);
    expect(Number(params.distMax)).toBe(60);
  });

  it("handles small distances", () => {
    const params = parseParams(similarFlightsPath("Test", 2.5));
    expect(params.takeoff).toBe("Test");
    expect(Number(params.distMin)).toBe(2);
    expect(Number(params.distMax)).toBe(3);
  });

  it("always sorts by distance", () => {
    const params = parseParams(similarFlightsPath("Site", 10));
    expect(params.sort).toBe("distance");
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

describe("todayInRomania", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("is already the next day in Romania late in the UTC evening (summer, UTC+3)", () => {
    expect(todayInRomania(new Date("2026-10-24T20:59:59Z"))).toBe("2026-10-24");
    expect(todayInRomania(new Date("2026-10-24T21:00:00Z"))).toBe("2026-10-25");
  });

  it("uses UTC+2 in winter", () => {
    expect(todayInRomania(new Date("2026-01-15T21:59:59Z"))).toBe("2026-01-15");
    expect(todayInRomania(new Date("2026-01-15T22:00:00Z"))).toBe("2026-01-16");
  });

  it("zero-pads month and day", () => {
    expect(todayInRomania(new Date("2026-03-05T12:00:00Z"))).toBe("2026-03-05");
  });

  it("defaults to the current time", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-07-10T22:30:00Z"));
    expect(todayInRomania()).toBe("2025-07-11");
  });
});

describe("parseDay", () => {
  it("accepts a valid YYYY-MM-DD date", () => {
    expect(parseDay("2022-07-08")).toBe("2022-07-08");
  });

  it("accepts Feb 29 in a leap year", () => {
    expect(parseDay("2024-02-29")).toBe("2024-02-29");
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["unpadded", "2022-7-8"],
    ["with a time", "2022-07-08T10:00"],
    ["not a date", "yesterday"],
    ["impossible day", "2022-02-30"],
    ["Feb 29 outside a leap year", "2023-02-29"],
    ["month 13", "2022-13-01"],
    ["day 0", "2022-07-00"],
  ])("rejects %s", (_label, value) => {
    expect(parseDay(value)).toBeNull();
  });
});

describe("formatDay", () => {
  const FULL: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" };

  it("formats a day in Romanian", () => {
    expect(formatDay("2022-07-08", "ro", FULL)).toBe("vineri, 8 iulie 2022");
  });

  it("formats a day in English", () => {
    expect(formatDay("2022-07-08", "en", FULL)).toBe("Friday, July 8, 2022");
  });

  it("supports short formats", () => {
    const short: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
    expect(formatDay("2026-10-24", "ro", short)).toBe("sâm., 24 oct.");
    expect(formatDay("2026-10-24", "en", short)).toBe("Sat, Oct 24");
  });

  it("keeps the first and last day of the year intact", () => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    expect(formatDay("2026-01-01", "en", opts)).toBe("January 1, 2026");
    expect(formatDay("2025-12-31", "en", opts)).toBe("December 31, 2025");
  });
});

describe("flightTypeKey", () => {
  it.each([
    ["zbor liber", "free"],
    ["free flight", "free"],
    ["triunghi FAI", "fai"],
    ["FAI triangle", "fai"],
    ["triunghi plat", "flat"],
    ["flat triangle", "flat"],
  ])("maps %s to %s", (type, key) => {
    expect(flightTypeKey(type)).toBe(key);
  });

  it("returns null for unknown types", () => {
    expect(flightTypeKey("out and return")).toBeNull();
  });
});
