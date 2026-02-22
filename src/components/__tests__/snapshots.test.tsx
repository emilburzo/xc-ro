import React from "react";
import { render } from "@testing-library/react";
import Nav from "../Nav";
import SeasonHeatmap from "../SeasonHeatmap";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const maps: Record<string, Record<string, string>> = {
      nav: {
        home: "Home",
        takeoffs: "Takeoffs",
        pilots: "Pilots",
        flights: "Flights",
        wings: "Wings",
        records: "Records",
      },
      home: {
        seasonOverview: "Season",
        flightCount: "Flight Count",
        avgScore: "Avg Score",
      },
      common: {
        flights: "flights",
        avgScore: "avg score",
      },
    };
    const map = maps[namespace] || {};
    return map[key] || key;
  },
  useLocale: () => "ro",
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

// Mock LanguageToggle in Nav
jest.mock("../LanguageToggle", () => {
  return function MockLanguageToggle() {
    return <button data-testid="lang-toggle">EN</button>;
  };
});

// Mock server action
jest.mock("@/app/actions", () => ({
  setLocale: jest.fn().mockResolvedValue(undefined),
}));

describe("Snapshot: Nav", () => {
  it("matches snapshot on home page", () => {
    const { container } = render(<Nav />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("Snapshot: SeasonHeatmap", () => {
  const data = [
    { year: 2023, month: 1, flight_count: 10, avg_score: 25.5 },
    { year: 2023, month: 6, flight_count: 80, avg_score: 45.2 },
    { year: 2023, month: 7, flight_count: 120, avg_score: 55.0 },
    { year: 2024, month: 3, flight_count: 30, avg_score: 30.0 },
    { year: 2024, month: 7, flight_count: 100, avg_score: 50.5 },
  ];

  it("matches snapshot with data", () => {
    const { container } = render(<SeasonHeatmap data={data} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot with empty data", () => {
    const { container } = render(<SeasonHeatmap data={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
