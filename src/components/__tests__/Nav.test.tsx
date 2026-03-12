import React from "react";
import { render, screen } from "@testing-library/react";
import Nav from "../Nav";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      home: "Home",
      takeoffs: "Takeoffs",
      pilots: "Pilots",
      wings: "Wings",
      flights: "Flights",
      records: "Records",
    };
    return map[key] || key;
  },
}));

// Mock next/navigation
const mockPathname = jest.fn().mockReturnValue("/");
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

// Mock LanguageToggle
jest.mock("../LanguageToggle", () => {
  return function MockLanguageToggle() {
    return <button data-testid="lang-toggle">EN</button>;
  };
});

describe("Nav", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
  });

  it("renders the XC-RO brand link", () => {
    render(<Nav />);
    const brand = screen.getByText("XC-RO");
    expect(brand).toBeInTheDocument();
    expect(brand.closest("a")).toHaveAttribute("href", "/");
  });

  it("renders all desktop navigation links", () => {
    render(<Nav />);
    expect(screen.getAllByText("Home").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Takeoffs").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pilots").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Wings").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Flights").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Records").length).toBeGreaterThanOrEqual(1);
  });

  it("renders correct href for each link", () => {
    render(<Nav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/takeoffs");
    expect(hrefs).toContain("/pilots");
    expect(hrefs).toContain("/wings");
    expect(hrefs).toContain("/flights");
    expect(hrefs).toContain("/records");
  });

  it("highlights the active link based on pathname", () => {
    mockPathname.mockReturnValue("/pilots");
    render(<Nav />);
    // The desktop Pilots link should have active styling
    const pilotsLinks = screen.getAllByText("Pilots");
    const desktopLink = pilotsLinks[0];
    expect(desktopLink).toHaveClass("bg-blue-50", "text-blue-700");
  });

  it("renders a mobile bottom navigation bar", () => {
    render(<Nav />);
    const bottomNav = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });
    expect(bottomNav).toBeInTheDocument();
    // Bottom nav should have all 6 links
    const links = bottomNav.querySelectorAll("a");
    expect(links).toHaveLength(6);
  });

  it("highlights active link in the bottom bar", () => {
    mockPathname.mockReturnValue("/flights");
    render(<Nav />);
    const bottomNav = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });
    const flightsLink = bottomNav.querySelector('a[href="/flights"]');
    expect(flightsLink).toHaveClass("text-blue-600");
  });

  it("renders the language toggle", () => {
    render(<Nav />);
    expect(screen.getAllByTestId("lang-toggle").length).toBeGreaterThanOrEqual(1);
  });
});
