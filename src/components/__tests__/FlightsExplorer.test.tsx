import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlightsExplorer from "../FlightsExplorer";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
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
      dateRange: "Date range",
      distanceRange: "Distance range",
      gliderCategory: "Glider category",
      presetToday: "Today's flights",
      presetBestMonth: "Best this month",
      presetTop100: "Top 100 all-time",
      presetClub100k: "100km+ Club",
      noFlights: "No flights found",
      min: "Min",
      max: "Max",
      all: "All",
      page: "page",
      flightType: "Flight type",
      freeFlightLabel: "free flight",
      faiTriangleLabel: "FAI triangle",
      flatTriangleLabel: "flat triangle",
      viewTable: "Table",
      viewMap: "Map",
    };
    return map[key] || key;
  },
  useLocale: () => "ro",
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
  usePathname: () => "/flights",
}));

// Mock next/dynamic for FlightsMap
jest.mock("next/dynamic", () => {
  return (_importFn: () => Promise<unknown>) => {
    return function MockFlightsMap({ flights }: { flights: { id: number }[] }) {
      return (
        <div data-testid="mock-flights-map">
          {flights.length} flights on map
        </div>
      );
    };
  };
});

const mockFlights = [
  {
    id: 100001,
    start_time: "2025-07-08T10:30:00Z",
    distance_km: 312.5,
    score: 450.2,
    airtime: 480,
    type: "FAI triangle",
    url: "https://xcontest.org/flight/100001",
    pilot_name: "Ion Popescu",
    pilot_username: "ion.popescu",
    takeoff_name: "Sticlaria",
    takeoff_id: 5,
    glider_name: "Enzo 3",
    glider_category: "D",
    start_lat: 45.5,
    start_lng: 25.3,
  },
  {
    id: 100002,
    start_time: "2025-07-08T09:15:00Z",
    distance_km: 45.3,
    score: 52.1,
    airtime: 180,
    type: "free flight",
    url: "https://xcontest.org/flight/100002",
    pilot_name: "Maria Ionescu",
    pilot_username: "maria.ionescu",
    takeoff_name: "Bunloc",
    takeoff_id: 1,
    glider_name: "Rush 6",
    glider_category: "B",
    start_lat: 45.6,
    start_lng: 25.5,
  },
  {
    id: 100003,
    start_time: "2025-06-15T12:00:00Z",
    distance_km: 8.2,
    score: 9.5,
    airtime: 45,
    type: "free flight",
    url: "https://xcontest.org/flight/100003",
    pilot_name: "Alex Novice",
    pilot_username: "alex.novice",
    takeoff_name: null,
    takeoff_id: null,
    glider_name: "Epsilon 10",
    glider_category: "A",
    start_lat: null,
    start_lng: null,
  },
];

const defaultProps = {
  flights: mockFlights,
  total: 3,
  page: 1,
  pageSize: 50,
  currentFilters: {},
};

describe("FlightsExplorer", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders all flight rows in the table", () => {
    render(<FlightsExplorer {...defaultProps} />);
    expect(screen.getByText("Ion Popescu")).toBeInTheDocument();
    expect(screen.getByText("Maria Ionescu")).toBeInTheDocument();
    expect(screen.getByText("Alex Novice")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<FlightsExplorer {...defaultProps} />);
    expect(screen.getByText("Date")).toBeInTheDocument();
    // "Pilot" and "Takeoff" appear in both headers and filter labels - check within thead
    const thead = screen.getAllByRole("columnheader");
    const headerTexts = thead.map((th) => th.textContent);
    expect(headerTexts).toEqual(
      expect.arrayContaining(["Date ", "Pilot ", "Takeoff ", "Distance ", "Score ", "Duration "])
    );
    expect(screen.getByText("Glider")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
  });

  it("displays total count and pagination info", () => {
    render(<FlightsExplorer {...defaultProps} />);
    expect(screen.getByText(/3 flights explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/page 1\/1/)).toBeInTheDocument();
  });

  it("renders preset buttons", () => {
    render(<FlightsExplorer {...defaultProps} />);
    expect(screen.getByText("Today's flights")).toBeInTheDocument();
    expect(screen.getByText("Best this month")).toBeInTheDocument();
    expect(screen.getByText("Top 100 all-time")).toBeInTheDocument();
    expect(screen.getByText("100km+ Club")).toBeInTheDocument();
  });

  it("navigates to preset URL on preset click", async () => {
    const user = userEvent.setup();
    render(<FlightsExplorer {...defaultProps} />);

    await user.click(screen.getByText("Today's flights"));
    expect(mockPush).toHaveBeenCalledWith("/flights?preset=today");
  });

  it("navigates to club100k preset", async () => {
    const user = userEvent.setup();
    render(<FlightsExplorer {...defaultProps} />);

    await user.click(screen.getByText("100km+ Club"));
    expect(mockPush).toHaveBeenCalledWith("/flights?preset=club100k");
  });

  it("renders filter inputs", () => {
    render(<FlightsExplorer {...defaultProps} />);
    // Filter labels
    const labels = screen.getAllByText("Pilot");
    expect(labels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Date range")).toBeInTheDocument();
    expect(screen.getByText("Distance range")).toBeInTheDocument();
    expect(screen.getByText("Glider category")).toBeInTheDocument();
    expect(screen.getByText("Flight type")).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeInTheDocument();
  });

  it("applies filters on button click", async () => {
    const user = userEvent.setup();
    render(<FlightsExplorer {...defaultProps} />);

    // Type pilot name
    const inputs = screen.getAllByPlaceholderText("...");
    await user.type(inputs[0], "Ion");

    // Click apply filters
    await user.click(screen.getByText("Filters"));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("pilot=Ion"));
  });

  it("shows 'No flights found' when flights array is empty", () => {
    render(<FlightsExplorer {...defaultProps} flights={[]} total={0} />);
    expect(screen.getByText("No flights found")).toBeInTheDocument();
  });

  it("renders pilot links with correct paths", () => {
    render(<FlightsExplorer {...defaultProps} />);
    const ionLink = screen.getByText("Ion Popescu").closest("a");
    expect(ionLink).toHaveAttribute("href", "/pilots/ion.popescu");
  });

  it("renders takeoff links with correct paths", () => {
    render(<FlightsExplorer {...defaultProps} />);
    const sticlariaLink = screen.getByText("Sticlaria").closest("a");
    expect(sticlariaLink).toHaveAttribute("href", "/takeoffs/5-sticlaria");
  });

  it("shows dash for flight without takeoff", () => {
    render(<FlightsExplorer {...defaultProps} />);
    const alexRow = screen.getByText("Alex Novice").closest("tr");
    // The takeoff cell should show "-"
    const cells = alexRow!.querySelectorAll("td");
    expect(cells[2].textContent).toBe("-");
  });

  it("formats distances with one decimal place", () => {
    render(<FlightsExplorer {...defaultProps} />);
    expect(screen.getByText("312.5 km")).toBeInTheDocument();
    expect(screen.getByText("45.3 km")).toBeInTheDocument();
  });

  it("formats airtime as hours and minutes", () => {
    render(<FlightsExplorer {...defaultProps} />);
    expect(screen.getByText("8h 0m")).toBeInTheDocument(); // 480 minutes
    expect(screen.getByText("3h 0m")).toBeInTheDocument(); // 180 minutes
    expect(screen.getByText("45m")).toBeInTheDocument(); // 45 minutes
  });

  it("renders glider category badges", () => {
    render(<FlightsExplorer {...defaultProps} />);
    // Categories appear in both the dropdown and as badges in rows
    // Just check there are multiple "D" elements (option + badge)
    expect(screen.getAllByText("D").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("B").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("A").length).toBeGreaterThanOrEqual(2);
  });

  it("renders pagination when there are multiple pages", () => {
    render(<FlightsExplorer {...defaultProps} total={120} pageSize={50} />);
    expect(screen.getByText("«")).toBeInTheDocument();
    expect(screen.getByText("»")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("navigates to next page on pagination click", async () => {
    const user = userEvent.setup();
    render(<FlightsExplorer {...defaultProps} total={120} pageSize={50} />);

    await user.click(screen.getByText("2"));
    expect(mockPush).toHaveBeenCalledWith("/flights?page=2");
  });

  it("disables previous button on first page", () => {
    render(<FlightsExplorer {...defaultProps} total={120} pageSize={50} />);
    const prevButton = screen.getByText("«");
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(<FlightsExplorer {...defaultProps} total={120} pageSize={50} page={3} />);
    const nextButton = screen.getByText("»");
    expect(nextButton).toBeDisabled();
  });

  it("does not render pagination for single page", () => {
    render(<FlightsExplorer {...defaultProps} total={3} pageSize={50} />);
    expect(screen.queryByText("«")).not.toBeInTheDocument();
  });

  it("highlights active preset", () => {
    render(
      <FlightsExplorer
        {...defaultProps}
        currentFilters={{ preset: "today" }}
      />
    );
    const todayButton = screen.getByText("Today's flights");
    expect(todayButton).toHaveClass("bg-blue-50", "border-blue-300", "text-blue-700");
  });

  it("navigates with sort params on header click", async () => {
    const user = userEvent.setup();
    render(<FlightsExplorer {...defaultProps} />);

    await user.click(screen.getByText("Distance"));
    expect(mockPush).toHaveBeenCalledWith("/flights?sort=distance&dir=desc");
  });

  it("table is not empty when flights are provided", () => {
    render(<FlightsExplorer {...defaultProps} />);
    const rows = screen.getAllByRole("row");
    // header row + 3 data rows
    expect(rows.length).toBe(4);
  });

  it("renders glider category dropdown with options", () => {
    render(<FlightsExplorer {...defaultProps} />);
    const categorySelect = screen.getByRole("combobox", { name: /glider category/i });
    expect(categorySelect).toBeInTheDocument();
    const options = categorySelect.querySelectorAll("option");
    expect(options.length).toBe(7); // All + A, B, C, D, Z, T
  });

  it("renders flight type dropdown with options", () => {
    render(<FlightsExplorer {...defaultProps} />);
    const flightTypeSelect = screen.getByRole("combobox", { name: /flight type/i });
    expect(flightTypeSelect).toBeInTheDocument();
    const options = flightTypeSelect.querySelectorAll("option");
    expect(options.length).toBe(4); // All + free flight, FAI triangle, flat triangle
  });

  it("applies flight type filter on button click", async () => {
    const user = userEvent.setup();
    render(<FlightsExplorer {...defaultProps} />);

    const flightTypeSelect = screen.getByRole("combobox", { name: /flight type/i });
    await user.selectOptions(flightTypeSelect, "fai");
    await user.click(screen.getByText("Filters"));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("type=fai"));
  });

  it("renders view toggle buttons", () => {
    render(<FlightsExplorer {...defaultProps} />);
    expect(screen.getByText("Table")).toBeInTheDocument();
    expect(screen.getByText("Map")).toBeInTheDocument();
  });

  it("shows table view by default", () => {
    render(<FlightsExplorer {...defaultProps} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-flights-map")).not.toBeInTheDocument();
  });

  it("switches to map view when Map button is clicked", async () => {
    const user = userEvent.setup();
    render(<FlightsExplorer {...defaultProps} />);

    await user.click(screen.getByText("Map"));
    expect(screen.getByTestId("mock-flights-map")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("switches back to table view when Table button is clicked", async () => {
    const user = userEvent.setup();
    render(<FlightsExplorer {...defaultProps} />);

    await user.click(screen.getByText("Map"));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await user.click(screen.getByText("Table"));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-flights-map")).not.toBeInTheDocument();
  });

  it("highlights active view toggle button", async () => {
    const user = userEvent.setup();
    render(<FlightsExplorer {...defaultProps} />);

    // Table is active by default
    const tableBtn = screen.getByText("Table");
    const mapBtn = screen.getByText("Map");
    expect(tableBtn).toHaveClass("bg-blue-50", "text-blue-700");
    expect(mapBtn).not.toHaveClass("bg-blue-50");

    // Switch to map
    await user.click(mapBtn);
    expect(mapBtn).toHaveClass("bg-blue-50", "text-blue-700");
    expect(tableBtn).not.toHaveClass("bg-blue-50");
  });

  it("shows pagination in map view", async () => {
    const user = userEvent.setup();
    render(<FlightsExplorer {...defaultProps} total={120} pageSize={50} />);

    // Pagination visible in table view
    expect(screen.getByText("«")).toBeInTheDocument();

    // Switch to map — pagination still visible
    await user.click(screen.getByText("Map"));
    expect(screen.getByText("«")).toBeInTheDocument();
  });
});
