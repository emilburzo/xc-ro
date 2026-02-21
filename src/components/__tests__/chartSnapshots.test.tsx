import React from "react";
import { render } from "@testing-library/react";
import MonthlyBarChart from "../charts/MonthlyBarChart";
import YearlyTrendChart from "../charts/YearlyTrendChart";
import HourlyChart from "../charts/HourlyChart";
import DowChart from "../charts/DowChart";
import DistanceHistogram from "../charts/DistanceHistogram";
import WingDonut from "../charts/WingDonut";
import PilotYearlyChart from "../charts/PilotYearlyChart";
import AdoptionChart from "../charts/AdoptionChart";

// Mock recharts with deterministic output
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
    LineChart: ({ data, children }: { data: any[]; children: React.ReactNode }) => (
      <div data-testid="line-chart" data-length={data.length}>{children}</div>
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

const monthlyData = [
  { month: 1, flight_count: 10, avg_distance: 5.2 },
  { month: 6, flight_count: 80, avg_distance: 15.3 },
  { month: 7, flight_count: 120, avg_distance: 22.1 },
];

const yearlyData = [
  { year: 2020, flight_count: 500, total_km: 12000 },
  { year: 2021, flight_count: 600, total_km: 15000 },
];

const hourlyData = [
  { hour: 8, flight_count: 20 },
  { hour: 12, flight_count: 80 },
];

const dowData = [
  { dow: 0, flight_count: 50 },
  { dow: 6, flight_count: 70 },
];

const distData = [
  { bucket: "0-1", cnt: 100 },
  { bucket: "1-5", cnt: 300 },
  { bucket: "5-20", cnt: 250 },
  { bucket: "20-50", cnt: 80 },
  { bucket: "50-100", cnt: 30 },
  { bucket: "100+", cnt: 10 },
];

const wingData = [
  { category: "A", cnt: 100 },
  { category: "B", cnt: 300 },
  { category: "C", cnt: 200 },
];

const pilotYearlyData = [
  { year: 2020, flight_count: 50, avg_distance: 12.5, max_distance: 85.3 },
  { year: 2021, flight_count: 80, avg_distance: 18.2, max_distance: 120.5 },
];

describe("Chart snapshots", () => {
  it("MonthlyBarChart matches snapshot", () => {
    const { container } = render(<MonthlyBarChart data={monthlyData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("YearlyTrendChart matches snapshot", () => {
    const { container } = render(<YearlyTrendChart data={yearlyData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("HourlyChart matches snapshot", () => {
    const { container } = render(<HourlyChart data={hourlyData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("DowChart matches snapshot", () => {
    const { container } = render(<DowChart data={dowData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("DistanceHistogram matches snapshot", () => {
    const { container } = render(<DistanceHistogram data={distData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("WingDonut matches snapshot", () => {
    const { container } = render(<WingDonut data={wingData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("PilotYearlyChart matches snapshot", () => {
    const { container } = render(<PilotYearlyChart data={pilotYearlyData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("MonthlyBarChart matches snapshot with empty data", () => {
    const { container } = render(<MonthlyBarChart data={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("WingDonut matches snapshot with empty data", () => {
    const { container } = render(<WingDonut data={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("AdoptionChart matches snapshot", () => {
    const adoptionData = [
      { year: 2019, pilot_count: 5 },
      { year: 2020, pilot_count: 12 },
      { year: 2021, pilot_count: 20 },
      { year: 2022, pilot_count: 18 },
    ];
    const { container } = render(<AdoptionChart data={adoptionData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("AdoptionChart matches snapshot with empty data", () => {
    const { container } = render(<AdoptionChart data={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
