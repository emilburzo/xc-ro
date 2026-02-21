import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SeasonHeatmap from "../SeasonHeatmap";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const maps: Record<string, Record<string, string>> = {
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
}));

const mockData = [
  { year: 2023, month: 1, flight_count: 10, avg_score: 25.5 },
  { year: 2023, month: 6, flight_count: 80, avg_score: 45.2 },
  { year: 2023, month: 7, flight_count: 120, avg_score: 55.0 },
  { year: 2023, month: 12, flight_count: 5, avg_score: 15.0 },
  { year: 2024, month: 3, flight_count: 30, avg_score: 30.0 },
  { year: 2024, month: 7, flight_count: 100, avg_score: 50.5 },
];

describe("SeasonHeatmap", () => {
  it("renders the title", () => {
    render(<SeasonHeatmap data={mockData} />);
    expect(screen.getByText("Season")).toBeInTheDocument();
  });

  it("renders mode toggle buttons", () => {
    render(<SeasonHeatmap data={mockData} />);
    expect(screen.getByText("Flight Count")).toBeInTheDocument();
    expect(screen.getByText("Avg Score")).toBeInTheDocument();
  });

  it("renders year labels", () => {
    render(<SeasonHeatmap data={mockData} />);
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("renders month labels", () => {
    render(<SeasonHeatmap data={mockData} />);
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.getByText("VI")).toBeInTheDocument();
    expect(screen.getByText("XII")).toBeInTheDocument();
  });

  it("renders 12 heatmap cells per year row", () => {
    const { container } = render(<SeasonHeatmap data={mockData} />);
    // Each year row has a year label + 12 month cells
    // 2 years = 24 cells
    const cells = container.querySelectorAll('[title]');
    expect(cells.length).toBe(24);
  });

  it("heatmap cells have title tooltips with flight data", () => {
    const { container } = render(<SeasonHeatmap data={mockData} />);
    const cell = container.querySelector('[title="2023/07: 120 flights"]');
    expect(cell).toBeInTheDocument();
  });

  it("empty cells show 0 flights", () => {
    const { container } = render(<SeasonHeatmap data={mockData} />);
    // 2023/02 has no data, should show 0
    const cell = container.querySelector('[title="2023/02: 0 flights"]');
    expect(cell).toBeInTheDocument();
  });

  it("switches to score mode on button click", async () => {
    const user = userEvent.setup();
    const { container } = render(<SeasonHeatmap data={mockData} />);

    await user.click(screen.getByText("Avg Score"));

    // Now cells should show avg score instead of flights
    const cell = container.querySelector('[title="2023/07: 55 avg score"]');
    expect(cell).toBeInTheDocument();
  });

  it("flight count mode is active by default", () => {
    render(<SeasonHeatmap data={mockData} />);
    const flightCountBtn = screen.getByText("Flight Count");
    expect(flightCountBtn).toHaveClass("bg-blue-100", "text-blue-700");
  });

  it("highlights score button when in score mode", async () => {
    const user = userEvent.setup();
    render(<SeasonHeatmap data={mockData} />);

    await user.click(screen.getByText("Avg Score"));

    const scoreBtn = screen.getByText("Avg Score");
    expect(scoreBtn).toHaveClass("bg-blue-100", "text-blue-700");

    const flightBtn = screen.getByText("Flight Count");
    expect(flightBtn).toHaveClass("bg-gray-100", "text-gray-600");
  });

  it("renders with empty data without crashing", () => {
    render(<SeasonHeatmap data={[]} />);
    expect(screen.getByText("Season")).toBeInTheDocument();
  });
});
