import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PilotsTable from "../PilotsTable";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      search: "Search pilot...",
      minFlights: "Min flights",
      name: "Name",
      flights: "Flights",
      totalKm: "Total KM",
      totalScore: "Total Score",
      avgDistance: "Avg Distance",
      personalRecord: "Personal Record",
      activeYears: "Active Years",
      favoriteSite: "Favorite Site",
      lastFlight: "Last Flight",
    };
    return map[key] || key;
  },
  useLocale: () => "ro",
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/pilots",
}));

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
  {
    id: 3,
    name: "Alex Novice",
    username: "alex.novice",
    flight_count: 8,
    total_km: 30.0,
    total_score: 45.0,
    avg_distance: 3.8,
    max_distance: 8.2,
    active_years: 1,
    last_flight: "2025-06-01",
    fav_takeoff_id: null,
    fav_takeoff_name: null,
  },
];

describe("PilotsTable", () => {
  it("renders the table with all pilots", () => {
    render(<PilotsTable pilots={mockPilots} />);
    expect(screen.getByText("Ion Popescu")).toBeInTheDocument();
    expect(screen.getByText("Maria Ionescu")).toBeInTheDocument();
    expect(screen.getByText("Alex Novice")).toBeInTheDocument();
  });

  it("renders all table headers", () => {
    render(<PilotsTable pilots={mockPilots} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText(/Flights/)).toBeInTheDocument();
    expect(screen.getByText(/Total KM/)).toBeInTheDocument();
    expect(screen.getByText(/Total Score/)).toBeInTheDocument();
    expect(screen.getByText(/Avg Distance/)).toBeInTheDocument();
    expect(screen.getByText(/Personal Record/)).toBeInTheDocument();
    expect(screen.getByText(/Active Years/)).toBeInTheDocument();
    expect(screen.getByText("Favorite Site")).toBeInTheDocument();
    expect(screen.getByText(/Last Flight/)).toBeInTheDocument();
  });

  it("shows the count of displayed pilots", () => {
    render(<PilotsTable pilots={mockPilots} />);
    expect(screen.getByText("3 pilots")).toBeInTheDocument();
  });

  it("filters pilots by name search", async () => {
    const user = userEvent.setup();
    render(<PilotsTable pilots={mockPilots} />);

    const searchInput = screen.getByPlaceholderText("Search pilot...");
    await user.type(searchInput, "Ion");

    expect(screen.getByText("Ion Popescu")).toBeInTheDocument();
    expect(screen.getByText("Maria Ionescu")).toBeInTheDocument();
    expect(screen.queryByText("Alex Novice")).not.toBeInTheDocument();
  });

  it("filters pilots by username search", async () => {
    const user = userEvent.setup();
    render(<PilotsTable pilots={mockPilots} />);

    const searchInput = screen.getByPlaceholderText("Search pilot...");
    await user.type(searchInput, "maria.ionescu");

    expect(screen.getByText("Maria Ionescu")).toBeInTheDocument();
    expect(screen.queryByText("Ion Popescu")).not.toBeInTheDocument();
  });

  it("filters by minimum flights", async () => {
    const user = userEvent.setup();
    render(<PilotsTable pilots={mockPilots} />);

    const minFlightsInput = screen.getByRole("spinbutton");
    await user.type(minFlightsInput, "100");

    expect(screen.getByText("Ion Popescu")).toBeInTheDocument();
    expect(screen.getByText("Maria Ionescu")).toBeInTheDocument();
    expect(screen.queryByText("Alex Novice")).not.toBeInTheDocument();
    expect(screen.getByText("2 pilots")).toBeInTheDocument();
  });

  it("sorts by total_km by default (descending)", () => {
    render(<PilotsTable pilots={mockPilots} />);
    const rows = screen.getAllByRole("row");
    // First data row should be Ion Popescu (12500.5 km)
    expect(rows[1]).toHaveTextContent("Ion Popescu");
  });

  it("toggles sort direction on header click", async () => {
    const user = userEvent.setup();
    render(<PilotsTable pilots={mockPilots} />);

    // Click "Total KM" to toggle to ascending
    const header = screen.getByText(/Total KM/);
    await user.click(header);

    const rows = screen.getAllByRole("row");
    // Ascending: Alex Novice (30) first
    expect(rows[1]).toHaveTextContent("Alex Novice");
  });

  it("sorts by different columns", async () => {
    const user = userEvent.setup();
    render(<PilotsTable pilots={mockPilots} />);

    // Click "Flights" to sort by flight_count descending
    const header = screen.getByText(/Flights/);
    await user.click(header);

    const rows = screen.getAllByRole("row");
    // Ion Popescu has most flights (450)
    expect(rows[1]).toHaveTextContent("Ion Popescu");
  });

  it("renders pilot links with correct href", () => {
    render(<PilotsTable pilots={mockPilots} />);
    const ionLink = screen.getByText("Ion Popescu").closest("a");
    expect(ionLink).toHaveAttribute("href", "/pilots/ion.popescu");
  });

  it("renders favorite takeoff links", () => {
    render(<PilotsTable pilots={mockPilots} />);
    const bunlocLink = screen.getByText("Bunloc").closest("a");
    expect(bunlocLink).toHaveAttribute("href", "/takeoffs/1-bunloc");
  });

  it("shows dash for pilot without favorite takeoff", () => {
    render(<PilotsTable pilots={mockPilots} />);
    // Alex Novice has no favorite takeoff
    const alexRow = screen.getByText("Alex Novice").closest("tr");
    expect(alexRow).toHaveTextContent("-");
  });

  it("shows personal record with km unit", () => {
    render(<PilotsTable pilots={mockPilots} />);
    expect(screen.getByText("312.5 km")).toBeInTheDocument();
  });

  it("table is not empty when pilots are provided", () => {
    render(<PilotsTable pilots={mockPilots} />);
    const rows = screen.getAllByRole("row");
    // header + 3 data rows
    expect(rows.length).toBe(4);
  });
});
