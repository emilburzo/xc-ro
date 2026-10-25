import React from "react";
import { render, screen, within } from "@testing-library/react";
import DailyFlightsList from "../DailyFlightsList";
import type { DailyFlightRow } from "@/lib/types";

const labels = {
  pilot: "Pilot",
  takeoff: "Takeoff",
  glider: "Glider",
  type: "Type",
  distance: "Distance",
  score: "Score",
  duration: "Duration",
  points: "pts",
  xcontest: "XContest",
  viewOnXContest: "View flight on XContest",
  types: { free: "free flight", fai: "FAI triangle", flat: "flat triangle" },
};

const flights: DailyFlightRow[] = [
  {
    id: 7013523,
    start_time: "2026-10-24 12:53:00",
    distance_km: 11.04,
    score: 15.4,
    airtime: 89,
    type: "triunghi plat",
    url: "https://www.xcontest.org/romania/zboruri/detalii:emilburzo/24.10.2026/09:53",
    pilot_name: "Emil Burzo",
    pilot_username: "emilburzo",
    takeoff_id: 77,
    takeoff_name: "Ignis",
    glider_name: "Ozone Swift 6",
    glider_category: "Z",
  },
  {
    id: 7013766,
    start_time: "2026-10-24 17:08:00",
    distance_km: 16.2,
    score: 13.6,
    airtime: 32,
    type: "free flight",
    url: "https://www.xcontest.org/world/en/flights/detail:drajar/24.10.2026/14:08",
    pilot_name: "Dragos Jarca",
    pilot_username: "drajar",
    takeoff_id: null,
    takeoff_name: null,
    glider_name: "ADVANCE Sigma 10",
    glider_category: "C",
  },
];

function renderList(rows: DailyFlightRow[] = flights) {
  return render(<DailyFlightsList flights={rows} emptyText="No flights yet" labels={labels} />);
}

describe("DailyFlightsList", () => {
  it("shows the empty text when there are no flights", () => {
    renderList([]);
    expect(screen.getByText("No flights yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("FAI triangle")).not.toBeInTheDocument();
  });

  it("leaves out the start time", () => {
    renderList();
    expect(screen.queryByText(/12:53|17:08/)).not.toBeInTheDocument();
  });

  it("explains the flight type icons in a legend", () => {
    renderList();
    for (const name of ["free flight", "flat triangle", "FAI triangle"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    // The legend's icons are decorative, their names are written next to them
    expect(screen.queryAllByRole("img", { name: "FAI triangle" })).toHaveLength(0);
  });

  describe("table (sm and up)", () => {
    function rows() {
      return within(screen.getByRole("table")).getAllByRole("row").slice(1);
    }

    it("ranks the flights in the given order", () => {
      renderList();
      const [first, second] = rows();
      expect(within(first).getAllByRole("cell")[0]).toHaveTextContent("1");
      expect(first).toHaveTextContent("Emil Burzo");
      expect(within(second).getAllByRole("cell")[0]).toHaveTextContent("2");
      expect(second).toHaveTextContent("Dragos Jarca");
    });

    it("links the pilot name to the flight and the takeoff to its page", () => {
      renderList();
      const row = within(rows()[0]);
      expect(row.getByRole("link", { name: "Emil Burzo" })).toHaveAttribute("href", "/flights/7013523-emil-burzo-ignis");
      expect(row.getByRole("link", { name: "Ignis" })).toHaveAttribute("href", "/takeoffs/77-ignis");
    });

    it("links each flight to XContest in a new tab", () => {
      renderList();
      const [first, second] = rows();
      const link = within(first).getByRole("link", { name: "View flight on XContest" });
      expect(link).toHaveAttribute("href", "https://www.xcontest.org/romania/zboruri/detalii:emilburzo/24.10.2026/09:53");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(within(second).getByRole("link", { name: "View flight on XContest" })).toHaveAttribute(
        "href",
        "https://www.xcontest.org/world/en/flights/detail:drajar/24.10.2026/14:08",
      );
    });

    it("shows a dash for flights without a takeoff", () => {
      renderList();
      const cells = within(rows()[1]).getAllByRole("cell");
      expect(cells[2]).toHaveTextContent(/^-$/);
    });

    it("shows the flight type as an icon named in the UI language, whichever league named it", () => {
      renderList();
      const [first, second] = rows();
      const icon = within(first).getByRole("img", { name: "flat triangle" });
      expect(icon).toHaveAttribute("title", "flat triangle");
      expect(first).not.toHaveTextContent("triunghi plat");
      expect(within(second).getByRole("img", { name: "free flight" })).toBeInTheDocument();
    });

    it("shows unknown flight types as they are", () => {
      renderList([{ ...flights[0], type: "out and return" }]);
      expect(rows()[0]).toHaveTextContent("out and return");
    });

    it("formats distance, score and duration", () => {
      renderList();
      const row = rows()[0];
      expect(row).toHaveTextContent("11.0 km");
      expect(row).toHaveTextContent("15.4");
      expect(row).toHaveTextContent("1h 29m");
      expect(row).toHaveTextContent("Ozone Swift 6Z");
    });
  });

  describe("compact list (phones)", () => {
    function items() {
      return within(screen.getByRole("list")).getAllByRole("listitem");
    }

    it("has one entry per flight, in rank order", () => {
      renderList();
      const [first, second] = items();
      expect(first).toHaveTextContent(/^1Emil Burzo/);
      expect(second).toHaveTextContent(/^2Dragos Jarca/);
    });

    it("links the pilot name to the flight", () => {
      renderList();
      expect(within(items()[0]).getByRole("link", { name: "Emil Burzo" })).toHaveAttribute(
        "href",
        "/flights/7013523-emil-burzo-ignis",
      );
    });

    it("links each entry to XContest in a new tab, apart from the internal link", () => {
      renderList();
      const entry = within(items()[0]);
      const link = entry.getByRole("link", { name: "View flight on XContest" });
      expect(link).toHaveAttribute("href", "https://www.xcontest.org/romania/zboruri/detalii:emilburzo/24.10.2026/09:53");
      expect(link).toHaveAttribute("target", "_blank");
      expect(entry.getAllByRole("link")).toHaveLength(2);
    });

    it("puts the takeoff next to the pilot, type and wing on the line below", () => {
      renderList();
      const first = items()[0];
      const [pilotLine, detailLine] = first.querySelectorAll(".flex-1 > div");
      expect(pilotLine).toHaveTextContent(/^Emil BurzoIgnis$/);
      expect(detailLine).toHaveTextContent(/^· Ozone Swift 6Z$/);
      expect(within(detailLine as HTMLElement).getByRole("img", { name: "flat triangle" })).toBeInTheDocument();
      expect(first).toHaveTextContent("11.0 km");
      expect(first).toHaveTextContent("15.4 pts · 1h 29m");
    });

    it("shows just the pilot when there is no takeoff", () => {
      renderList();
      const pilotLine = items()[1].querySelector(".flex-1 > div");
      expect(pilotLine).toHaveTextContent(/^Dragos Jarca$/);
    });
  });
});
