import {
  slugify,
  takeoffPath,
  pilotPath,
  formatDuration,
  formatDistance,
  formatNumber,
  relativeTime,
} from "../utils";

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
    expect(result).toMatch(/12[.\s]?345/);
  });

  it("formats small numbers without separators", () => {
    expect(formatNumber(42)).toBe("42");
  });
});

describe("relativeTime", () => {
  it("returns 'today' for today in English", () => {
    expect(relativeTime(new Date(), "en")).toBe("today");
  });

  it("returns 'azi' for today in Romanian", () => {
    expect(relativeTime(new Date(), "ro")).toBe("azi");
  });

  it("returns 'yesterday' for 1 day ago in English", () => {
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    expect(relativeTime(yesterday, "en")).toBe("yesterday");
  });

  it("returns 'ieri' for 1 day ago in Romanian", () => {
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    expect(relativeTime(yesterday, "ro")).toBe("ieri");
  });

  it("returns days ago for less than 30 days", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    expect(relativeTime(tenDaysAgo, "en")).toBe("10 days ago");
  });

  it("returns months ago for less than 365 days", () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    expect(relativeTime(ninetyDaysAgo, "en")).toBe("3 months ago");
  });

  it("returns years ago for 365+ days", () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
    expect(relativeTime(twoYearsAgo, "en")).toBe("2 years ago");
  });

  it("returns Romanian months", () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    expect(relativeTime(ninetyDaysAgo, "ro")).toBe("acum 3 luni");
  });

  it("returns Romanian years", () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
    expect(relativeTime(twoYearsAgo, "ro")).toBe("acum 2 ani");
  });
});
