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
import RecordProgressionChart from "../charts/RecordProgressionChart";
import PilotDnaChart from "../charts/PilotDnaChart";
import DistanceTrendChart from "../charts/DistanceTrendChart";
import YoYGrowthChart from "../charts/YoYGrowthChart";
import CategoryShareChart from "../charts/CategoryShareChart";
import CommunityGrowthChart from "../charts/CommunityGrowthChart";
import FlyabilityChart from "../charts/FlyabilityChart";

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
    AreaChart: ({ data, children }: { data: any[]; children: React.ReactNode }) => (
      <div data-testid="area-chart" data-length={data.length}>{children}</div>
    ),
    Area: ({ dataKey, type, fill, stroke }: { dataKey: string; type?: string; fill?: string; stroke?: string }) => (
      <div data-testid="area" data-datakey={dataKey} data-type={type} data-fill={fill} data-stroke={stroke} />
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
    RadarChart: ({ data, children }: { data: any[]; children: React.ReactNode }) => (
      <div data-testid="radar-chart" data-length={data.length}>{children}</div>
    ),
    Radar: ({ dataKey, fill, fillOpacity }: { dataKey: string; fill?: string; fillOpacity?: number }) => (
      <div data-testid="radar" data-datakey={dataKey} data-fill={fill} data-fillopacity={fillOpacity} />
    ),
    PolarGrid: () => <div data-testid="polar-grid" />,
    PolarAngleAxis: ({ dataKey }: { dataKey: string }) => (
      <div data-testid="polar-angle-axis" data-datakey={dataKey} />
    ),
    PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  };
});

const monthlyData = [
  { month: 1, flight_count: 10, avg_distance: 5.2 },
  { month: 6, flight_count: 80, avg_distance: 15.3 },
  { month: 7, flight_count: 120, avg_distance: 22.1 },
];

const yearlyData = [
  { year: 2020, flight_count: 500, total_km: 12000, avg_distance: 24.0 },
  { year: 2021, flight_count: 600, total_km: 15000, avg_distance: 25.0 },
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
  { year: 2020, flight_count: 50, avg_distance: 12.5, max_distance: 85.3, total_airtime: 3000 },
  { year: 2021, flight_count: 80, avg_distance: 18.2, max_distance: 120.5, total_airtime: 5400 },
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

  it("RecordProgressionChart matches snapshot", () => {
    const recordData = [
      { year: 2010, distance_km: 80, pilot_name: "Pilot A" },
      { year: 2011, distance_km: 60, pilot_name: "Pilot B" },
      { year: 2012, distance_km: 120, pilot_name: "Pilot C" },
      { year: 2013, distance_km: 100, pilot_name: "Pilot D" },
    ];
    const { container } = render(<RecordProgressionChart data={recordData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("RecordProgressionChart matches snapshot with empty data", () => {
    const { container } = render(<RecordProgressionChart data={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("CategoryShareChart matches snapshot", () => {
    const shareData = [
      { year: 2020, category: "A", flight_count: 10 },
      { year: 2020, category: "B", flight_count: 50 },
      { year: 2020, category: "C", flight_count: 30 },
      { year: 2021, category: "A", flight_count: 8 },
      { year: 2021, category: "B", flight_count: 60 },
      { year: 2021, category: "C", flight_count: 40 },
      { year: 2021, category: "D", flight_count: 15 },
    ];
    const { container } = render(
      <CategoryShareChart data={shareData} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("CategoryShareChart matches snapshot with empty data", () => {
    const { container } = render(
      <CategoryShareChart data={[]} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("PilotDnaChart matches snapshot", () => {
    const dnaData = {
      max_distance: 120,
      active_years: 2,
      flight_count: 5,
      unique_sites: 2,
      triangle_pct: 20,
      pct_distance: 0.667,
      pct_consistency: 0.5,
      pct_volume: 0.667,
      pct_diversity: 0.5,
      pct_triangle: 0.667,
    };
    const dnaLabels = {
      distance: "XC Distance",
      consistency: "Consistency",
      volume: "Volume",
      diversity: "Diversity",
      triangle: "Triangle %",
      unitKm: " km",
      unitYrs: " yrs",
      unitFlights: " flights",
      unitSites: " sites",
    };
    const { container } = render(<PilotDnaChart data={dnaData} labels={dnaLabels} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("FlyabilityChart matches snapshot", () => {
    const flyabilityData = [
      { month: 1, avg_flyable_days: 2.5 },
      { month: 6, avg_flyable_days: 15.3 },
      { month: 7, avg_flyable_days: 18.1 },
    ];
    const { container } = render(<FlyabilityChart data={flyabilityData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("FlyabilityChart matches snapshot with empty data", () => {
    const { container } = render(<FlyabilityChart data={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("DistanceTrendChart matches snapshot", () => {
    const distanceTrendData = [
      { year: 2020, flight_count: 500, total_km: 12000, avg_distance: 12.5 },
      { year: 2021, flight_count: 600, total_km: 15000, avg_distance: 18.3 },
      { year: 2022, flight_count: 700, total_km: 18000, avg_distance: 22.7 },
    ];
    const { container } = render(<DistanceTrendChart data={distanceTrendData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("DistanceTrendChart matches snapshot with empty data", () => {
    const { container } = render(<DistanceTrendChart data={[]} />);
  it("YoYGrowthChart matches snapshot", () => {
    const growthData = [
      { year: 2020, flights: 500, pilots: 120, total_km: 12000 },
      { year: 2021, flights: 600, pilots: 150, total_km: 15000 },
      { year: 2022, flights: 750, pilots: 180, total_km: 20000 },
    ];
    const labels = { flights: "Flights", pilots: "Pilots", totalKm: "Total km" };
    const { container } = render(<YoYGrowthChart data={growthData} labels={labels} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("YoYGrowthChart matches snapshot with empty data", () => {
    const labels = { flights: "Flights", pilots: "Pilots", totalKm: "Total km" };
    const { container } = render(<YoYGrowthChart data={[]} labels={labels} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("CommunityGrowthChart matches snapshot", () => {
    const growthData = [
      { year: 2018, new_pilots: 30, cumulative_pilots: 200, flight_count: 3000 },
      { year: 2019, new_pilots: 45, cumulative_pilots: 245, flight_count: 4000 },
      { year: 2020, new_pilots: 25, cumulative_pilots: 270, flight_count: 3500 },
      { year: 2021, new_pilots: 50, cumulative_pilots: 320, flight_count: 5000 },
    ];
    const { container } = render(<CommunityGrowthChart data={growthData} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("CommunityGrowthChart matches snapshot with empty data", () => {
    const { container } = render(<CommunityGrowthChart data={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
