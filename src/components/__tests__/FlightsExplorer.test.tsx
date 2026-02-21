import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlightsExplorer from "../FlightsExplorer";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: (ns?: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
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
        allCategories: "All",
        page: "page",
      },
      common: {
        flights: "flights",
      },
    };
    return translations[ns || ""]?.[key] || key;
  },
  useLocale: () => "ro",
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
  usePathname: () => "/flights",
}));

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
    expect(screen.getByText(/3 flights/i)).toBeInTheDocument();
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
    const select = screen.getByDisplayValue("All");
    expect(select).toBeInTheDocument();
    // Check category options exist
    const options = select.querySelectorAll("option");
    expect(options.length).toBe(7); // All + A, B, C, D, Z, T
  });
});
