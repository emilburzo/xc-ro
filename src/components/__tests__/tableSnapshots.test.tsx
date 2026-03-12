import React from "react";
import { render } from "@testing-library/react";
import TakeoffsTable from "../TakeoffsTable";
import PilotsTable from "../PilotsTable";
import FlightsExplorer from "../FlightsExplorer";
import WingsTable from "../WingsTable";
import PilotFlightsTable from "../PilotFlightsTable";
import TakeoffFlightsTable from "../TakeoffFlightsTable";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const maps: Record<string, Record<string, string>> = {
      takeoffs: {
        search: "Search...",
        activeOnly: "Flown in last year",
        dormantOnly: "No flights in over a year",
        minFlights: "Min flights",
        title: "Takeoffs",
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
        triangleFactory: "Triangle Factory",
        morningSite: "Morning Site",
        afternoonThermal: "Afternoon Thermal",
        marathonSite: "Marathon Site",
      },
      pilots: {
        search: "Search...",
        minFlights: "Min flights",
        title: "Pilots",
        name: "Name",
        flights: "Flights",
        totalKm: "Total KM",
        totalHours: "Total Hours",
        totalScore: "Total Score",
        avgDistance: "Avg Distance",
        personalRecord: "Personal Record",
        activeYears: "Active Years",
        favoriteSite: "Favorite Site",
        lastFlight: "Last Flight",
      },
      flights: {
        title: "Flights Explorer",
        date: "Date",
        pilot: "Pilot",
        takeoff: "Takeoff",
        glider: "Glider",
        type: "Type",
        distance: "Distance",
        score: "Score",
        duration: "Duration",
        filters: "Filters",
        today: "Today",
        bestMonth: "Best Month",
        top100: "Top 100",
        club100kPreset: "Club 100k",
        showing: "Showing",
        noResults: "No results",
        page: "page",
        resetFilters: "Reset filters",
        presetToday: "Today's flights",
        presetBestMonth: "Best this month",
        presetTop100: "Top 100 all-time",
        presetClub100k: "100km+ Club",
        noFlights: "No flights found",
        dateRange: "Date range",
        distanceRange: "Distance range",
        gliderCategory: "Glider category",
        min: "Min",
        max: "Max",
        all: "All",
        flightType: "Flight type",
        freeFlightLabel: "free flight",
        faiTriangleLabel: "FAI triangle",
        flatTriangleLabel: "flat triangle",
        viewTable: "Table",
        viewMap: "Map",
      },
      wings: {
        search: "Search...",
        minFlights: "Min flights",
        title: "Wings",
        name: "Name",
        flights: "Flights",
        pilots: "Pilots",
        totalKm: "Total KM",
        avgDistance: "Avg Distance",
        record: "Record (km)",
        lastFlight: "Last Flight",
        allCategories: "All categories",
      },
      common: {
        all: "All",
        flights: "flights",
        pilots: "pilots",
        avgScore: "avg score",
      },
    };
    const map = maps[namespace] || {};
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
    triangle_pct: 25,
    peak_hour: 13,
    avg_airtime: 90,
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
    triangle_pct: 30,
    peak_hour: 15,
    avg_airtime: 150,
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
    total_hours: 850,
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
    total_hours: 220,
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
    start_lat: 45.5,
    start_lng: 25.3,
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
    start_lat: 45.6,
    start_lng: 25.5,
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

const mockPilotFlights = [
  {
    id: 1001,
    start_time: "2025-07-08T10:00:00Z",
    takeoff_id: 2,
    takeoff_name: "Sticlaria",
    glider_name: "Advance Omega X-Alps 4",
    glider_category: "D",
    distance_km: 312.5,
    score: 420.5,
    airtime: 480,
  },
  {
    id: 1002,
    start_time: "2025-07-08T09:30:00Z",
    takeoff_id: null,
    takeoff_name: null,
    glider_name: "Nova Mentor 7",
    glider_category: "B",
    distance_km: 45.3,
    score: 52.1,
    airtime: 180,
  },
];

describe("Snapshot: PilotFlightsTable", () => {
  it("matches snapshot", () => {
    const { container } = render(
      <PilotFlightsTable
        title="Top Flights"
        flights={mockPilotFlights}
        locale="ro"
        pilotName="Ion Popescu"
        labels={{
          date: "Date",
          takeoff: "Takeoff",
          glider: "Glider",
          distance: "Distance",
          score: "Score",
          airtime: "Airtime",
        }}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

const mockTakeoffFlights = [
  {
    id: 1001,
    start_time: "2025-07-08T10:00:00Z",
    distance_km: 312.5,
    score: 420.5,
    airtime: 480,
    pilot_name: "Ion Popescu",
    pilot_username: "ion.popescu",
    glider_name: "Advance Omega X-Alps 4",
    glider_category: "D",
  },
  {
    id: 1002,
    start_time: "2025-07-08T09:30:00Z",
    distance_km: 45.3,
    score: 52.1,
    airtime: 180,
    pilot_name: "Maria Ionescu",
    pilot_username: "maria.ionescu",
    glider_name: "Nova Mentor 7",
    glider_category: "B",
  },
];

describe("Snapshot: TakeoffFlightsTable", () => {
  it("matches snapshot", () => {
    const { container } = render(
      <TakeoffFlightsTable
        title="Top 10 Flights"
        flights={mockTakeoffFlights}
        locale="ro"
        takeoffName="Bunloc"
        labels={{
          date: "Date",
          pilot: "Pilot",
          glider: "Glider",
          distance: "Distance",
          score: "Score",
          airtime: "Airtime",
        }}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
