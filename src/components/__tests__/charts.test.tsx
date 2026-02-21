import React from "react";
import { render } from "@testing-library/react";
import MonthlyBarChart from "../charts/MonthlyBarChart";
import YearlyTrendChart from "../charts/YearlyTrendChart";
import HourlyChart from "../charts/HourlyChart";
import DowChart from "../charts/DowChart";
import DistanceHistogram from "../charts/DistanceHistogram";
import WingDonut from "../charts/WingDonut";
import PilotYearlyChart from "../charts/PilotYearlyChart";

// Mock recharts to render testable HTML with chart structure info
jest.mock("recharts", () => {
  const OriginalModule = jest.requireActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    ComposedChart: ({ data, children }: { data: any[]; children: React.ReactNode }) => (
      <div data-testid="composed-chart" data-length={data.length}>{children}</div>
    ),
    BarChart: ({ data, children }: { data: any[]; children: React.ReactNode }) => (
      <div data-testid="bar-chart" data-length={data.length}>{children}</div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: ({ data, dataKey }: { data: any[]; dataKey: string }) => (
      <div data-testid="pie" data-length={data.length} data-datakey={dataKey} />
    ),
    Bar: ({ dataKey, fill, name, children }: { dataKey: string; fill?: string; name?: string; children?: React.ReactNode }) => (
      <div data-testid="bar" data-datakey={dataKey} data-fill={fill} data-name={name}>{children}</div>
    ),
    Line: ({ dataKey, stroke, name }: { dataKey: string; stroke?: string; name?: string }) => (
      <div data-testid="line" data-datakey={dataKey} data-stroke={stroke} data-name={name} />
    ),
    XAxis: ({ dataKey }: { dataKey: string }) => (
      <div data-testid="xaxis" data-datakey={dataKey} />
    ),
    YAxis: ({ yAxisId, orientation }: { yAxisId?: string; orientation?: string }) => (
      <div data-testid="yaxis" data-yaxisid={yAxisId} data-orientation={orientation} />
    ),
    Cell: ({ fill }: { fill: string }) => <div data-testid="cell" data-fill={fill} />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

describe("MonthlyBarChart", () => {
  const data = [
    { month: 1, flight_count: 10, avg_distance: 5.2 },
    { month: 6, flight_count: 80, avg_distance: 15.3 },
    { month: 7, flight_count: 120, avg_distance: 22.1 },
  ];

  it("renders a ComposedChart with 12 months of data", () => {
    const { getByTestId } = render(<MonthlyBarChart data={data} />);
    expect(getByTestId("responsive-container")).toBeInTheDocument();
    const chart = getByTestId("composed-chart");
    expect(chart).toHaveAttribute("data-length", "12");
  });

  it("renders Bar for flights and Line for avg distance", () => {
    const { getAllByTestId } = render(<MonthlyBarChart data={data} />);
    const bars = getAllByTestId("bar");
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAttribute("data-datakey", "flights");
    const lines = getAllByTestId("line");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveAttribute("data-datakey", "avgDist");
  });

  it("uses month names on XAxis", () => {
    const { getByTestId } = render(<MonthlyBarChart data={data} />);
    expect(getByTestId("xaxis")).toHaveAttribute("data-datakey", "name");
  });

  it("renders with empty data producing 12 zero entries", () => {
    const { getByTestId } = render(<MonthlyBarChart data={[]} />);
    expect(getByTestId("composed-chart")).toHaveAttribute("data-length", "12");
  });
});

describe("YearlyTrendChart", () => {
  const data = [
    { year: 2020, flight_count: 500, total_km: 12000 },
    { year: 2021, flight_count: 600, total_km: 15000 },
    { year: 2022, flight_count: 700, total_km: 18000 },
  ];

  it("renders a ComposedChart with correct data count", () => {
    const { getByTestId } = render(<YearlyTrendChart data={data} />);
    expect(getByTestId("composed-chart")).toHaveAttribute("data-length", "3");
  });

  it("renders Bar for flights and Line for total km", () => {
    const { getAllByTestId } = render(<YearlyTrendChart data={data} />);
    const bars = getAllByTestId("bar");
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAttribute("data-datakey", "flights");
    expect(bars[0]).toHaveAttribute("data-name", "Flights");
    const lines = getAllByTestId("line");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveAttribute("data-datakey", "totalKm");
    expect(lines[0]).toHaveAttribute("data-name", "Total km");
  });

  it("uses year on XAxis", () => {
    const { getByTestId } = render(<YearlyTrendChart data={data} />);
    expect(getByTestId("xaxis")).toHaveAttribute("data-datakey", "year");
  });

  it("renders with empty data", () => {
    const { getByTestId } = render(<YearlyTrendChart data={[]} />);
    expect(getByTestId("composed-chart")).toHaveAttribute("data-length", "0");
  });
});

describe("HourlyChart", () => {
  const data = [
    { hour: 8, flight_count: 20 },
    { hour: 12, flight_count: 80 },
    { hour: 15, flight_count: 60 },
  ];

  it("renders a BarChart with 15 hourly slots (6:00-20:00)", () => {
    const { getByTestId } = render(<HourlyChart data={data} />);
    expect(getByTestId("bar-chart")).toHaveAttribute("data-length", "15");
  });

  it("renders a Bar with flights dataKey", () => {
    const { getByTestId } = render(<HourlyChart data={data} />);
    expect(getByTestId("bar")).toHaveAttribute("data-datakey", "flights");
    expect(getByTestId("bar")).toHaveAttribute("data-fill", "#8b5cf6");
  });

  it("uses hour on XAxis", () => {
    const { getByTestId } = render(<HourlyChart data={data} />);
    expect(getByTestId("xaxis")).toHaveAttribute("data-datakey", "hour");
  });

  it("renders with empty data producing 15 zero entries", () => {
    const { getByTestId } = render(<HourlyChart data={[]} />);
    expect(getByTestId("bar-chart")).toHaveAttribute("data-length", "15");
  });
});

describe("DowChart", () => {
  const data = [
    { dow: 0, flight_count: 50 },
    { dow: 1, flight_count: 20 },
    { dow: 5, flight_count: 30 },
    { dow: 6, flight_count: 70 },
  ];

  it("renders a BarChart with 7 day-of-week slots", () => {
    const { getByTestId } = render(<DowChart data={data} />);
    expect(getByTestId("bar-chart")).toHaveAttribute("data-length", "7");
  });

  it("renders a Bar with flights dataKey and cyan color", () => {
    const { getByTestId } = render(<DowChart data={data} />);
    expect(getByTestId("bar")).toHaveAttribute("data-datakey", "flights");
    expect(getByTestId("bar")).toHaveAttribute("data-fill", "#06b6d4");
  });

  it("uses day names on XAxis", () => {
    const { getByTestId } = render(<DowChart data={data} />);
    expect(getByTestId("xaxis")).toHaveAttribute("data-datakey", "day");
  });

  it("renders with empty data producing 7 zero entries", () => {
    const { getByTestId } = render(<DowChart data={[]} />);
    expect(getByTestId("bar-chart")).toHaveAttribute("data-length", "7");
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

  it("renders a BarChart with correct bucket count", () => {
    const { getByTestId } = render(<DistanceHistogram data={data} />);
    expect(getByTestId("bar-chart")).toHaveAttribute("data-length", "6");
  });

  it("renders a Bar with count dataKey", () => {
    const { getByTestId } = render(<DistanceHistogram data={data} />);
    expect(getByTestId("bar")).toHaveAttribute("data-datakey", "count");
  });

  it("renders colored cells for each bucket", () => {
    const { getAllByTestId } = render(<DistanceHistogram data={data} />);
    const cells = getAllByTestId("cell");
    expect(cells).toHaveLength(6);
    // Verify bucket colors are applied
    expect(cells[0]).toHaveAttribute("data-fill", "#d1d5db"); // 0-1
    expect(cells[1]).toHaveAttribute("data-fill", "#93c5fd"); // 1-5
    expect(cells[5]).toHaveAttribute("data-fill", "#1d4ed8"); // 100+
  });

  it("uses bucket labels on XAxis", () => {
    const { getByTestId } = render(<DistanceHistogram data={data} />);
    expect(getByTestId("xaxis")).toHaveAttribute("data-datakey", "bucket");
  });

  it("renders with empty data", () => {
    const { getByTestId } = render(<DistanceHistogram data={[]} />);
    expect(getByTestId("bar-chart")).toHaveAttribute("data-length", "0");
  });
});

describe("WingDonut", () => {
  const data = [
    { category: "A", cnt: 100 },
    { category: "B", cnt: 300 },
    { category: "C", cnt: 200 },
    { category: "D", cnt: 50 },
  ];

  it("renders a PieChart with Pie using value dataKey", () => {
    const { getByTestId } = render(<WingDonut data={data} />);
    expect(getByTestId("pie-chart")).toBeInTheDocument();
    const pie = getByTestId("pie");
    expect(pie).toHaveAttribute("data-datakey", "value");
    expect(pie).toHaveAttribute("data-length", "4");
  });

  it("renders a Legend", () => {
    const { getByTestId } = render(<WingDonut data={data} />);
    expect(getByTestId("legend")).toBeInTheDocument();
  });

  it("renders with empty data", () => {
    const { getByTestId } = render(<WingDonut data={[]} />);
    expect(getByTestId("pie")).toHaveAttribute("data-length", "0");
  });

  it("renders with single category", () => {
    const { getByTestId } = render(
      <WingDonut data={[{ category: "B", cnt: 100 }]} />
    );
    expect(getByTestId("pie")).toHaveAttribute("data-length", "1");
  });
});

describe("PilotYearlyChart", () => {
  const data = [
    { year: 2020, flight_count: 50, avg_distance: 12.5, max_distance: 85.3 },
    { year: 2021, flight_count: 80, avg_distance: 18.2, max_distance: 120.5 },
    { year: 2022, flight_count: 100, avg_distance: 22.0, max_distance: 312.5 },
  ];

  it("renders a ComposedChart with correct data count", () => {
    const { getByTestId } = render(<PilotYearlyChart data={data} />);
    expect(getByTestId("composed-chart")).toHaveAttribute("data-length", "3");
  });

  it("renders Bar for flights and Lines for avg/max distance", () => {
    const { getAllByTestId } = render(<PilotYearlyChart data={data} />);
    const bars = getAllByTestId("bar");
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAttribute("data-datakey", "flights");
    expect(bars[0]).toHaveAttribute("data-name", "Flights");
    const lines = getAllByTestId("line");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveAttribute("data-datakey", "avgDist");
    expect(lines[0]).toHaveAttribute("data-name", "Avg km");
    expect(lines[1]).toHaveAttribute("data-datakey", "maxDist");
    expect(lines[1]).toHaveAttribute("data-name", "Max km");
  });

  it("uses year on XAxis with dual Y axes", () => {
    const { getByTestId, getAllByTestId } = render(<PilotYearlyChart data={data} />);
    expect(getByTestId("xaxis")).toHaveAttribute("data-datakey", "year");
    const yAxes = getAllByTestId("yaxis");
    expect(yAxes).toHaveLength(2);
    expect(yAxes[0]).toHaveAttribute("data-yaxisid", "left");
    expect(yAxes[1]).toHaveAttribute("data-yaxisid", "right");
  });

  it("renders with empty data", () => {
    const { getByTestId } = render(<PilotYearlyChart data={[]} />);
    expect(getByTestId("composed-chart")).toHaveAttribute("data-length", "0");
  });
});
