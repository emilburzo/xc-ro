import React from "react";
import { render, screen } from "@testing-library/react";
import CategoryTimeline from "../charts/CategoryTimeline";

const multiData = [
  { name: "ADVANCE Alpha 7", category: "A", flight_count: 12, first_used: "2018-03-15", last_used: "2019-06-20" },
  { name: "NOVA Mentor 6", category: "C", flight_count: 45, first_used: "2019-07-01", last_used: "2022-09-30" },
  { name: "OZONE Enzo 3", category: "D", flight_count: 80, first_used: "2022-10-01", last_used: "2024-05-10" },
];

describe("CategoryTimeline", () => {
  it("renders all glider names and category badges", () => {
    render(<CategoryTimeline data={multiData} />);
    expect(screen.getByText("ADVANCE Alpha 7")).toBeInTheDocument();
    expect(screen.getByText("NOVA Mentor 6")).toBeInTheDocument();
    expect(screen.getByText("OZONE Enzo 3")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("renders correct number of bars", () => {
    const { container } = render(<CategoryTimeline data={multiData} />);
    const bars = container.querySelectorAll("[title]");
    expect(bars).toHaveLength(3);
  });

  it("shows fallback text for empty data", () => {
    render(<CategoryTimeline data={[]} />);
    expect(screen.getByText("No equipment data")).toBeInTheDocument();
  });

  it("bars have title attributes with details", () => {
    const { container } = render(<CategoryTimeline data={multiData} flightsLabel="flights" />);
    const bars = container.querySelectorAll("[title]");
    expect(bars[0].getAttribute("title")).toContain("ADVANCE Alpha 7");
    expect(bars[0].getAttribute("title")).toContain("12 flights");
  });

  it("renders year axis labels", () => {
    render(<CategoryTimeline data={multiData} />);
    expect(screen.getByText("2018")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("shows flight count inside bars", () => {
    render(<CategoryTimeline data={multiData} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
  });
});
