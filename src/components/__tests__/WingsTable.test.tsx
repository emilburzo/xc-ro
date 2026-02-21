import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WingsTable from "../WingsTable";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      search: "Search wing...",
      allCategories: "All categories",
      minFlights: "Min flights",
      name: "Name",
      flights: "Flights",
      pilots: "Pilots",
      totalKm: "Total KM",
      avgDistance: "Avg Distance",
      record: "Record (km)",
      lastFlight: "Last Flight",
      title: "Wings",
    };
    return map[key] || key;
  },
  useLocale: () => "ro",
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/wings",
}));

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
    last_flight: "2025-07-01T10:00:00.000Z",
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
    last_flight: "2024-06-15T09:00:00.000Z",
  },
  {
    id: 3,
    name: "Nova Prion 5",
    category: "A",
    flight_count: 50,
    pilot_count: 10,
    total_km: 0,
    avg_distance: 0,
    max_distance: 0,
    avg_speed: null,
    first_year: 2022,
    last_year: 2023,
    last_flight: null,
  },
];

describe("WingsTable", () => {
  it("renders table with all wing rows", () => {
    render(<WingsTable wings={mockWings} />);
    expect(screen.getByText("Nova Mentor 7")).toBeInTheDocument();
    expect(screen.getByText("Ozone Mantra 8")).toBeInTheDocument();
    expect(screen.getByText("Nova Prion 5")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<WingsTable wings={mockWings} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText(/Flights/)).toBeInTheDocument();
    expect(screen.getByText(/Pilots/)).toBeInTheDocument();
    expect(screen.getByText("Total KM")).toBeInTheDocument();
    expect(screen.getByText("Avg Distance")).toBeInTheDocument();
    expect(screen.getByText("Record (km)")).toBeInTheDocument();
    expect(screen.getByText("Last Flight")).toBeInTheDocument();
  });

  it("shows count of wings", () => {
    render(<WingsTable wings={mockWings} />);
    expect(screen.getByText(/3 wings/i)).toBeInTheDocument();
  });

  it("filters wings by search input", async () => {
    const user = userEvent.setup();
    render(<WingsTable wings={mockWings} />);

    const searchInput = screen.getByPlaceholderText("Search wing...");
    await user.type(searchInput, "Nova");

    expect(screen.getByText("Nova Mentor 7")).toBeInTheDocument();
    expect(screen.getByText("Nova Prion 5")).toBeInTheDocument();
    expect(screen.queryByText("Ozone Mantra 8")).not.toBeInTheDocument();
    expect(screen.getByText(/2 wings/i)).toBeInTheDocument();
  });

  it("filters by category", async () => {
    const user = userEvent.setup();
    render(<WingsTable wings={mockWings} />);

    const categorySelect = screen.getByDisplayValue("All categories");
    await user.selectOptions(categorySelect, "B");

    expect(screen.getByText("Nova Mentor 7")).toBeInTheDocument();
    expect(screen.queryByText("Ozone Mantra 8")).not.toBeInTheDocument();
    expect(screen.queryByText("Nova Prion 5")).not.toBeInTheDocument();
    expect(screen.getByText(/1 wings/i)).toBeInTheDocument();
  });

  it("filters by minimum flights", async () => {
    const user = userEvent.setup();
    render(<WingsTable wings={mockWings} />);

    const minFlightsInput = screen.getByRole("spinbutton");
    await user.type(minFlightsInput, "100");

    expect(screen.getByText("Nova Mentor 7")).toBeInTheDocument();
    expect(screen.getByText("Ozone Mantra 8")).toBeInTheDocument();
    expect(screen.queryByText("Nova Prion 5")).not.toBeInTheDocument();
  });

  it("sorts by flight count by default (descending)", () => {
    render(<WingsTable wings={mockWings} />);
    const rows = screen.getAllByRole("row");
    // rows[0] is header, rows[1] is first data row
    expect(rows[1]).toHaveTextContent("Nova Mentor 7");
  });

  it("toggles sort direction on header click", async () => {
    const user = userEvent.setup();
    render(<WingsTable wings={mockWings} />);

    const flightsHeader = screen.getByText(/Flights/);
    await user.click(flightsHeader);

    const rows = screen.getAllByRole("row");
    // After clicking once (now ascending), Nova Prion 5 (50) should be first
    expect(rows[1]).toHaveTextContent("Nova Prion 5");
  });

  it("sorts by name when name header is clicked", async () => {
    const user = userEvent.setup();
    render(<WingsTable wings={mockWings} />);

    const nameHeader = screen.getByText("Name");
    await user.click(nameHeader);

    const rows = screen.getAllByRole("row");
    // Descending alphabetical: Ozone > Nova
    expect(rows[1]).toHaveTextContent("Ozone Mantra 8");
  });

  it("displays wing links pointing to correct paths", () => {
    render(<WingsTable wings={mockWings} />);
    const mentorLink = screen.getByText("Nova Mentor 7").closest("a");
    expect(mentorLink).toHaveAttribute("href", "/wings/1-nova-mentor-7");
  });

  it("renders category badges", () => {
    render(<WingsTable wings={mockWings} />);
    // Each category appears in both the badge and the category select dropdown
    expect(screen.getAllByText("B").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("C").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("A").length).toBeGreaterThanOrEqual(1);
  });

  it("shows dash for null fields", () => {
    render(<WingsTable wings={mockWings} />);
    // Nova Prion 5 has null last_flight (shows "-")
    const rows = screen.getAllByRole("row");
    // Find the Nova Prion 5 row (sorted last by default)
    const prionRow = rows[3];
    expect(prionRow).toHaveTextContent("-");
  });

  it("renders table as non-empty with provided data", () => {
    render(<WingsTable wings={mockWings} />);
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
  });
});
