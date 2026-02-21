import React from "react";
import { render } from "@testing-library/react";
import TakeoffsTable from "../TakeoffsTable";
import PilotsTable from "../PilotsTable";
import FlightsExplorer from "../FlightsExplorer";
import WingsTable from "../WingsTable";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      search: "Search...",
      flyableNow: "Flyable now",
      activeOnly: "Active only",
      dormantOnly: "Dormant only",
      minFlights: "Min flights",
      name: "Name",
      flights: "Flights",
      pilots: "Pilots",
      xcPotential: "XC Potential",
      season: "Season",
      record: "Record (km)",
      lastActivity: "Last Activity",
      weekendPct: "Weekend %",
      club100k: "100k Club",
      beginnerFriendly: "Beginner Friendly",
      xcEngine: "XC Engine",
      weekendSite: "Weekend Site",
      inactive: "Inactive",
      totalKm: "Total KM",
      totalScore: "Total Score",
      avgDistance: "Avg Distance",
      personalRecord: "Personal Record",
      activeYears: "Active Years",
      favoriteSite: "Favorite Site",
      lastFlight: "Last Flight",
      date: "Date",
      pilot: "Pilot",
      takeoff: "Takeoff",
      glider: "Glider",
      type: "Type",
      distance: "Distance",
      score: "Score",
      duration: "Duration",
      today: "Today",
      bestMonth: "Best Month",
      top100: "Top 100",
      club100kPreset: "Club 100k",
      showing: "Showing",
      noResults: "No results",
      page: "Page",
      resetFilters: "Reset filters",
      allCategories: "All categories",
      title: "Wings",
    };
    return map[key] || key;
  },
  useLocale: () => "ro",
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
  usePathname: () => "/takeoffs",
}));

// Mock next/dynamic for TakeoffMap
jest.mock("next/dynamic", () => {
  return (_importFn: () => Promise<unknown>) => {
    return function MockDynamic({ takeoffs }: { takeoffs: { id: number; name: string }[] }) {
      return (
        <div data-testid="mock-map">
          {takeoffs.map((t) => (
            <span key={t.id}>{t.name}</span>
          ))}
        </div>
      );
    };
  };
});

// Pin system time so the "active" filter (365-day window) is deterministic
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2025-06-01T12:00:00Z"));
});
afterAll(() => {
  jest.useRealTimers();
});

const recentDate = "2025-01-15T00:00:00.000Z";

const mockTakeoffs = [
  {
    id: 1,
    name: "Bunloc",
    flight_count: 500,
    pilot_count: 80,
    xc_potential: 90,
    record_km: 312.5,
    last_activity: recentDate,
    weekend_pct: 60,
    flights_100k: 10,
    avg_distance: 15.3,
    ab_pct: 30,
    monthly_data: [
      { month: 1, count: 10 },
      { month: 6, count: 50 },
    ],
  },
  {
    id: 2,
    name: "Sticlaria",
    flight_count: 200,
    pilot_count: 40,
    xc_potential: 85,
    record_km: 350.2,
    last_activity: recentDate,
    weekend_pct: 80,
    flights_100k: 6,
    avg_distance: 25.7,
    ab_pct: 20,
    monthly_data: [
      { month: 5, count: 30 },
      { month: 7, count: 40 },
    ],
  },
];

const mockPilots = [
  {
    id: 1,
    name: "Ion Popescu",
    username: "ion.popescu",
    flight_count: 450,
    total_km: 12500.5,
    total_score: 18000.2,
    avg_distance: 27.8,
    max_distance: 312.5,
    active_years: 10,
    last_flight: "2025-12-01",
    fav_takeoff_id: 1,
    fav_takeoff_name: "Bunloc",
  },
  {
    id: 2,
    name: "Maria Ionescu",
    username: "maria.ionescu",
    flight_count: 120,
    total_km: 3200.0,
    total_score: 5600.0,
    avg_distance: 26.7,
    max_distance: 185.3,
    active_years: 5,
    last_flight: "2025-11-15",
    fav_takeoff_id: 2,
    fav_takeoff_name: "Sticlaria",
  },
];

const mockFlights = [
  {
    id: 1001,
    start_time: "2025-07-08T10:00:00Z",
    pilot_name: "Ion Popescu",
    pilot_username: "ion.popescu",
    takeoff_name: "Sticlaria",
    takeoff_id: 2,
    glider_name: "Advance Omega X-Alps 4",
    glider_category: "D",
    type: "FAI triangle",
    distance_km: 312.5,
    score: 420.5,
    airtime: 480,
    url: "https://xcontest.org/flight/1001",
  },
  {
    id: 1002,
    start_time: "2025-07-08T09:30:00Z",
    pilot_name: "Maria Ionescu",
    pilot_username: "maria.ionescu",
    takeoff_name: "Bunloc",
    takeoff_id: 1,
    glider_name: "Nova Mentor 7",
    glider_category: "B",
    type: "free flight",
    distance_km: 45.3,
    score: 52.1,
    airtime: 180,
    url: "https://xcontest.org/flight/1002",
  },
];

describe("Snapshot: TakeoffsTable", () => {
  it("matches snapshot", () => {
    const { container } = render(<TakeoffsTable takeoffs={mockTakeoffs} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("Snapshot: PilotsTable", () => {
  it("matches snapshot", () => {
    const { container } = render(<PilotsTable pilots={mockPilots} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("Snapshot: FlightsExplorer", () => {
  it("matches snapshot", () => {
    const { container } = render(
      <FlightsExplorer
        flights={mockFlights}
        total={2}
        page={1}
        pageSize={50}
        currentFilters={{}}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

const mockWings = [
  {
    id: 1,
    name: "Nova Mentor 7",
    category: "B",
    flight_count: 500,
    pilot_count: 80,
    total_km: 12500,
    avg_distance: 25.0,
    max_distance: 312.5,
    avg_speed: null,
    first_year: 2018,
    last_year: 2025,
    last_flight: "2025-01-15T00:00:00.000Z",
  },
  {
    id: 2,
    name: "Ozone Mantra 8",
    category: "C",
    flight_count: 200,
    pilot_count: 30,
    total_km: 8000,
    avg_distance: 40.0,
    max_distance: 250.5,
    avg_speed: null,
    first_year: 2020,
    last_year: 2024,
    last_flight: "2024-01-15T00:00:00.000Z",
  },
];

describe("Snapshot: WingsTable", () => {
  it("matches snapshot", () => {
    const { container } = render(<WingsTable wings={mockWings} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
