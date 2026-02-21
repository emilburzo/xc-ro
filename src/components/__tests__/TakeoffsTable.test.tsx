import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TakeoffsTable from "../TakeoffsTable";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      search: "Search by name...",
      flyableNow: "Flyable now",
      activeOnly: "Active only",
      dormantOnly: "Dormant only",
      minFlights: "Min flights",
      title: "Takeoffs",
      all: "All",
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
    };
    return map[key] || key;
  },
  useLocale: () => "ro",
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/takeoffs",
}));

// Mock next/dynamic to bypass lazy loading in tests
jest.mock("next/dynamic", () => {
  return (_importFn: () => Promise<unknown>) => {
    // Return the mocked TakeoffMap component directly
    return function MockTakeoffMap({ takeoffs }: { takeoffs: { id: number; name: string }[] }) {
      return (
        <div data-testid="takeoff-map">
          {takeoffs.map((tk) => (
            <div key={tk.id} data-testid="map-marker">
              {tk.name}
            </div>
          ))}
        </div>
      );
    };
  };
});

const now = new Date();
const recentDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
const oldDate = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString();

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
      { month: new Date().getMonth() + 1, count: 25 },
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
  {
    id: 3,
    name: "Dormant Site",
    flight_count: 5,
    pilot_count: 2,
    xc_potential: null,
    record_km: null,
    last_activity: oldDate,
    weekend_pct: null,
    flights_100k: 0,
    avg_distance: 3.1,
    ab_pct: 80,
    monthly_data: null,
  },
  {
    id: 4,
    name: "Székely",
    flight_count: 100,
    pilot_count: 15,
    xc_potential: 70,
    record_km: 120.0,
    last_activity: recentDate,
    weekend_pct: 50,
    flights_100k: 2,
    avg_distance: 12.0,
    ab_pct: 40,
    monthly_data: [
      { month: new Date().getMonth() + 1, count: 10 },
    ],
  },
];

const mockMapData = [
  { id: 1, name: "Bunloc", lat: 45.6, lng: 25.5, flight_count: 500, last_activity: recentDate },
  { id: 2, name: "Sticlaria", lat: 46.2, lng: 24.8, flight_count: 200, last_activity: recentDate },
  { id: 3, name: "Dormant Site", lat: 45.0, lng: 24.0, flight_count: 5, last_activity: oldDate },
  { id: 4, name: "Székely", lat: 46.5, lng: 25.0, flight_count: 100, last_activity: recentDate },
];

describe("TakeoffsTable", () => {
  it("renders the table with all takeoff rows (active filter default)", () => {
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);
    // Default filter is "active" which filters to takeoffs active in last year
    expect(screen.getByText("Bunloc")).toBeInTheDocument();
    expect(screen.getByText("Sticlaria")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText(/Flights/)).toBeInTheDocument();
    expect(screen.getByText("Pilots")).toBeInTheDocument();
    expect(screen.getByText("XC Potential")).toBeInTheDocument();
    expect(screen.getByText("Record (km)")).toBeInTheDocument();
    expect(screen.getByText("Last Activity")).toBeInTheDocument();
    expect(screen.getByText("Weekend %")).toBeInTheDocument();
  });

  it("shows the count of displayed takeoffs", () => {
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);
    // With default "active" filter, active takeoffs are Bunloc, Sticlaria, and Székely
    expect(screen.getByText("3 takeoffs")).toBeInTheDocument();
  });

  it("filters takeoffs by search input", async () => {
    const user = userEvent.setup();
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);

    const searchInput = screen.getByPlaceholderText("Search by name...");
    await user.type(searchInput, "Bunloc");

    expect(screen.getByText("Bunloc")).toBeInTheDocument();
    expect(screen.queryByText("Sticlaria")).not.toBeInTheDocument();
    expect(screen.getByText("1 takeoffs")).toBeInTheDocument();
  });

  it("filters takeoffs by search input ignoring diacritics", async () => {
    const user = userEvent.setup();
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);

    // Switch to "all" filter to show Székely
    const select = screen.getByDisplayValue("Active only");
    await user.selectOptions(select, "all");

    const searchInput = screen.getByPlaceholderText("Search by name...");
    await user.type(searchInput, "Szekely");

    expect(screen.getByText("Székely")).toBeInTheDocument();
    expect(screen.queryByText("Bunloc")).not.toBeInTheDocument();
    expect(screen.getByText("1 takeoffs")).toBeInTheDocument();
  });

  it("filters by minimum flights", async () => {
    const user = userEvent.setup();
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);

    // Switch to "all" filter first
    const select = screen.getByDisplayValue("Active only");
    await user.selectOptions(select, "all");

    const minFlightsInput = screen.getByRole("spinbutton");
    await user.type(minFlightsInput, "100");

    // Only Bunloc (500), Sticlaria (200), and Székely (100) have >= 100 flights
    expect(screen.getByText("Bunloc")).toBeInTheDocument();
    expect(screen.getByText("Sticlaria")).toBeInTheDocument();
    expect(screen.queryByText("Dormant Site")).not.toBeInTheDocument();
  });

  it("shows dormant takeoffs with dormant filter", async () => {
    const user = userEvent.setup();
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);

    const select = screen.getByDisplayValue("Active only");
    await user.selectOptions(select, "dormant");

    expect(screen.getByText("Dormant Site")).toBeInTheDocument();
    expect(screen.queryByText("Bunloc")).not.toBeInTheDocument();
  });

  it("shows all takeoffs with 'all' filter", async () => {
    const user = userEvent.setup();
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);

    const select = screen.getByDisplayValue("Active only");
    await user.selectOptions(select, "all");

    expect(screen.getByText("4 takeoffs")).toBeInTheDocument();
  });

  it("renders tags for qualifying takeoffs", () => {
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);
    // Both Bunloc and Sticlaria have flights_100k >= 5 and xc_potential > 80
    expect(screen.getAllByText("100k Club").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("XC Engine").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the map when mapData is provided", () => {
    render(<TakeoffsTable takeoffs={mockTakeoffs} mapData={mockMapData} />);
    expect(screen.getByTestId("takeoff-map")).toBeInTheDocument();
  });

  it("map receives filtered data matching table filters", async () => {
    const user = userEvent.setup();
    render(<TakeoffsTable takeoffs={mockTakeoffs} mapData={mockMapData} />);

    const searchInput = screen.getByPlaceholderText("Search by name...");
    await user.type(searchInput, "Bunloc");

    const mapMarkers = screen.getAllByTestId("map-marker");
    expect(mapMarkers).toHaveLength(1);
    expect(mapMarkers[0]).toHaveTextContent("Bunloc");
  });

  it("sorts by flight count by default (descending)", () => {
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);
    const rows = screen.getAllByRole("row");
    // First data row should be Bunloc (500 flights)
    // rows[0] is header, rows[1] is first data row
    const firstDataRow = rows[1];
    expect(firstDataRow).toHaveTextContent("Bunloc");
  });

  it("toggles sort direction on header click", async () => {
    const user = userEvent.setup();
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);

    // Click flights header to toggle sort direction to ascending
    const flightsHeader = screen.getByText(/Flights/);
    await user.click(flightsHeader);

    const rows = screen.getAllByRole("row");
    // After toggling to ascending, Székely (100) should come first
    const firstDataRow = rows[1];
    expect(firstDataRow).toHaveTextContent("Székely");
  });

  it("sorts by name when name header is clicked", async () => {
    const user = userEvent.setup();
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);

    const nameHeader = screen.getByText("Name");
    await user.click(nameHeader);

    const rows = screen.getAllByRole("row");
    // Default desc alphabetical: Székely before Sticlaria before Bunloc
    const firstDataRow = rows[1];
    expect(firstDataRow).toHaveTextContent("Székely");
  });

  it("displays takeoff links pointing to correct paths", () => {
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);
    const bunlocLink = screen.getByText("Bunloc").closest("a");
    expect(bunlocLink).toHaveAttribute("href", "/takeoffs/1-bunloc");
  });

  it("does not render map when mapData is not provided", () => {
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);
    expect(screen.queryByTestId("takeoff-map")).not.toBeInTheDocument();
  });

  it("renders table as non-empty with provided data", () => {
    render(<TakeoffsTable takeoffs={mockTakeoffs} />);
    const tbody = screen.getAllByRole("row");
    // Should have at least header row + data rows
    expect(tbody.length).toBeGreaterThan(1);
  });
});
