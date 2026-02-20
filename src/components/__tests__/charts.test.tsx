import React from "react";
import { render } from "@testing-library/react";
import MonthlyBarChart from "../charts/MonthlyBarChart";
import YearlyTrendChart from "../charts/YearlyTrendChart";
import HourlyChart from "../charts/HourlyChart";
import DowChart from "../charts/DowChart";
import DistanceHistogram from "../charts/DistanceHistogram";
import WingDonut from "../charts/WingDonut";
import PilotYearlyChart from "../charts/PilotYearlyChart";

// Mock recharts to render testable HTML instead of SVG canvas
jest.mock("recharts", () => {
  const OriginalModule = jest.requireActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

describe("MonthlyBarChart", () => {
  const data = [
    { month: 1, flight_count: 10, avg_distance: 5.2 },
    { month: 6, flight_count: 80, avg_distance: 15.3 },
    { month: 7, flight_count: 120, avg_distance: 22.1 },
  ];

  it("renders without crashing", () => {
    const { getByTestId } = render(<MonthlyBarChart data={data} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with empty data", () => {
    const { getByTestId } = render(<MonthlyBarChart data={[]} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with all months populated", () => {
    const fullData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      flight_count: (i + 1) * 10,
      avg_distance: (i + 1) * 2.5,
    }));
    const { getByTestId } = render(<MonthlyBarChart data={fullData} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });
});

describe("YearlyTrendChart", () => {
  const data = [
    { year: 2020, flight_count: 500, total_km: 12000 },
    { year: 2021, flight_count: 600, total_km: 15000 },
    { year: 2022, flight_count: 700, total_km: 18000 },
  ];

  it("renders without crashing", () => {
    const { getByTestId } = render(<YearlyTrendChart data={data} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with single year", () => {
    const { getByTestId } = render(
      <YearlyTrendChart data={[{ year: 2023, flight_count: 100, total_km: 5000 }]} />
    );
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with empty data", () => {
    const { getByTestId } = render(<YearlyTrendChart data={[]} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });
});

describe("HourlyChart", () => {
  const data = [
    { hour: 8, flight_count: 20 },
    { hour: 12, flight_count: 80 },
    { hour: 15, flight_count: 60 },
  ];

  it("renders without crashing", () => {
    const { getByTestId } = render(<HourlyChart data={data} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with empty data", () => {
    const { getByTestId } = render(<HourlyChart data={[]} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });
});

describe("DowChart", () => {
  const data = [
    { dow: 0, flight_count: 50 },
    { dow: 1, flight_count: 20 },
    { dow: 5, flight_count: 30 },
    { dow: 6, flight_count: 70 },
  ];

  it("renders without crashing", () => {
    const { getByTestId } = render(<DowChart data={data} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with empty data", () => {
    const { getByTestId } = render(<DowChart data={[]} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });
});

describe("DistanceHistogram", () => {
  const data = [
    { bucket: "0-1", cnt: 100 },
    { bucket: "1-5", cnt: 300 },
    { bucket: "5-20", cnt: 250 },
    { bucket: "20-50", cnt: 80 },
    { bucket: "50-100", cnt: 30 },
    { bucket: "100+", cnt: 10 },
  ];

  it("renders without crashing", () => {
    const { getByTestId } = render(<DistanceHistogram data={data} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with empty data", () => {
    const { getByTestId } = render(<DistanceHistogram data={[]} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with single bucket", () => {
    const { getByTestId } = render(
      <DistanceHistogram data={[{ bucket: "0-1", cnt: 50 }]} />
    );
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });
});

describe("WingDonut", () => {
  const data = [
    { category: "A", cnt: 100 },
    { category: "B", cnt: 300 },
    { category: "C", cnt: 200 },
    { category: "D", cnt: 50 },
  ];

  it("renders without crashing", () => {
    const { getByTestId } = render(<WingDonut data={data} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with empty data", () => {
    const { getByTestId } = render(<WingDonut data={[]} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with single category", () => {
    const { getByTestId } = render(
      <WingDonut data={[{ category: "B", cnt: 100 }]} />
    );
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });
});

describe("PilotYearlyChart", () => {
  const data = [
    { year: 2020, flight_count: 50, avg_distance: 12.5, max_distance: 85.3 },
    { year: 2021, flight_count: 80, avg_distance: 18.2, max_distance: 120.5 },
    { year: 2022, flight_count: 100, avg_distance: 22.0, max_distance: 312.5 },
  ];

  it("renders without crashing", () => {
    const { getByTestId } = render(<PilotYearlyChart data={data} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with empty data", () => {
    const { getByTestId } = render(<PilotYearlyChart data={[]} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders with single year", () => {
    const { getByTestId } = render(
      <PilotYearlyChart data={[{ year: 2023, flight_count: 20, avg_distance: 10.0, max_distance: 50.0 }]} />
    );
    expect(getByTestId("responsive-container")).toBeInTheDocument();
  });
});
