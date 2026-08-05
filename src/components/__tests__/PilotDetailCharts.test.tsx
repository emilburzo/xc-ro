import React from "react";
import { render, screen } from "@testing-library/react";
import PilotDetailCharts from "../PilotDetailCharts";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const maps: Record<string, Record<string, string>> = {
      pilotDetail: {
        evolution: "Evolution",
        careerTimeline: "Career Timeline",
        siteMap: "Site Map",
        equipmentProgression: "Equipment Progression",
        activityHeatmap: "Activity Heatmap",
        distDistribution: "Distance Distribution",
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

// Mock next/dynamic — charts and the Leaflet map are loaded client-side only
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div data-testid="dynamic-chart" />;
  };
});

const equipment = [
  {
    name: "Advance Sigma 11",
    category: "B",
    flight_count: 42,
    total_airtime: 2530,
    first_used: "2019-05-01T10:00:00.000Z",
    last_used: "2021-09-12T10:00:00.000Z",
  },
  {
    name: "Ozone Enzo 3",
    category: "D",
    flight_count: 7,
    total_airtime: 45,
    first_used: "2022-06-01T10:00:00.000Z",
    last_used: "2022-08-20T10:00:00.000Z",
  },
];

const props = {
  dna: null,
  yearly: [],
  sites: [],
  equipment,
  heatmap: [],
  distHist: [],
};

describe("PilotDetailCharts — equipment progression", () => {
  it("shows flight count, airtime and year range for each wing", () => {
    render(<PilotDetailCharts {...props} />);

    expect(screen.getByText("Advance Sigma 11")).toBeInTheDocument();
    expect(screen.getByText("42 flights")).toBeInTheDocument();
    // 2530 min = 42h 10m
    expect(screen.getByText("42h 10m")).toBeInTheDocument();
    expect(screen.getByText("2019-2021")).toBeInTheDocument();

    expect(screen.getByText("Ozone Enzo 3")).toBeInTheDocument();
    expect(screen.getByText("7 flights")).toBeInTheDocument();
    // Under an hour → minutes only
    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("collapses the year range when a wing was only flown in one year", () => {
    render(<PilotDetailCharts {...props} />);
    expect(screen.getByText("2022")).toBeInTheDocument();
    expect(screen.queryByText("2022-2022")).not.toBeInTheDocument();
  });

  it("renders 0m when a wing has no recorded airtime", () => {
    render(
      <PilotDetailCharts
        {...props}
        equipment={[{ ...equipment[0], total_airtime: 0 }]}
      />
    );
    expect(screen.getByText("0m")).toBeInTheDocument();
  });

  it("matches snapshot", () => {
    const { container } = render(<PilotDetailCharts {...props} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
