import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageToggle from "../LanguageToggle";

// Mock next-intl
const mockLocale = jest.fn().mockReturnValue("ro");
jest.mock("next-intl", () => ({
  useLocale: () => mockLocale(),
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      switchToEnglish: "Switch to English",
      switchToRomanian: "Switch to Romanian",
    };
    return map[key] || key;
  },
}));

// Mock next/navigation
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: mockRefresh }),
}));

// Mock server action
const mockSetLocale = jest.fn().mockResolvedValue(undefined);
jest.mock("@/app/actions", () => ({
  setLocale: (...args: any[]) => mockSetLocale(...args),
}));

describe("LanguageToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocale.mockReturnValue("ro");
  });

  it("renders button with 'EN' when locale is Romanian", () => {
    render(<LanguageToggle />);
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it("renders button with 'RO' when locale is English", () => {
    mockLocale.mockReturnValue("en");
    render(<LanguageToggle />);
    expect(screen.getByText("RO")).toBeInTheDocument();
  });

  it("has correct title for Romanian locale", () => {
    render(<LanguageToggle />);
    expect(screen.getByTitle("Switch to English")).toBeInTheDocument();
  });

  it("has correct title for English locale", () => {
    mockLocale.mockReturnValue("en");
    render(<LanguageToggle />);
    expect(screen.getByTitle("Switch to Romanian")).toBeInTheDocument();
  });

  it("calls setLocale with 'en' when switching from Romanian", async () => {
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await user.click(screen.getByText("EN"));
    expect(mockSetLocale).toHaveBeenCalledWith("en");
  });

  it("calls setLocale with 'ro' when switching from English", async () => {
    mockLocale.mockReturnValue("en");
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await user.click(screen.getByText("RO"));
    expect(mockSetLocale).toHaveBeenCalledWith("ro");
  });

  it("refreshes the router after toggling locale", async () => {
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await user.click(screen.getByText("EN"));
    expect(mockRefresh).toHaveBeenCalled();
  });
});
