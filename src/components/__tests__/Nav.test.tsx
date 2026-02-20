import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Nav from "../Nav";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      home: "Home",
      takeoffs: "Takeoffs",
      pilots: "Pilots",
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
    // Mobile menu is hidden by default, only desktop links show
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Takeoffs")).toBeInTheDocument();
    expect(screen.getByText("Pilots")).toBeInTheDocument();
    expect(screen.getByText("Flights")).toBeInTheDocument();
    expect(screen.getByText("Records")).toBeInTheDocument();
  });

  it("renders correct href for each link", () => {
    render(<Nav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/takeoffs");
    expect(hrefs).toContain("/pilots");
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

  it("toggles mobile menu on hamburger click", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    const hamburger = screen.getByRole("button", { name: "Menu" });
    expect(hamburger).toBeInTheDocument();

    // Mobile menu initially hidden (links only in desktop nav, 5 each)
    const linksBefore = screen.getAllByRole("link");
    // Count links: brand (1) + desktop nav (5) = 6 (mobile menu hidden)
    const desktopLinksCount = linksBefore.length;

    await user.click(hamburger);

    // After click, mobile menu should show additional links
    const linksAfter = screen.getAllByRole("link");
    expect(linksAfter.length).toBeGreaterThan(desktopLinksCount);
  });

  it("renders the language toggle", () => {
    render(<Nav />);
    expect(screen.getAllByTestId("lang-toggle").length).toBeGreaterThanOrEqual(1);
  });
});
