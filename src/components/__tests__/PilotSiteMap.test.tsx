import React from "react";
import { render, waitFor } from "@testing-library/react";
import PilotSiteMap from "../PilotSiteMap";
import * as L from "leaflet";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      flights: "flights",
    };
    return map[key] || key;
  },
}));

// Mock leaflet
const mockMarker = {
  addTo: jest.fn().mockReturnThis(),
  bindPopup: jest.fn().mockReturnThis(),
};

const mockMap = {
  fitBounds: jest.fn().mockReturnThis(),
  remove: jest.fn(),
};

const mockTileLayer = {
  addTo: jest.fn().mockReturnThis(),
};

const mockLatLngBounds = {};

jest.mock("leaflet", () => ({
  map: jest.fn(() => mockMap),
  tileLayer: jest.fn(() => mockTileLayer),
  circleMarker: jest.fn(() => mockMarker),
  latLngBounds: jest.fn(() => mockLatLngBounds),
  Icon: {
    Default: {
      prototype: { _getIconUrl: "" },
      mergeOptions: jest.fn(),
    },
  },
}));

const mockSites = [
  { id: 13, name: "Bunloc", lat: 45.589, lng: 25.664, flight_count: 500 },
  { id: 49, name: "Postavaru", lat: 45.568, lng: 25.566, flight_count: 130 },
  { id: 20, name: "Lempeş", lat: 45.715, lng: 25.653, flight_count: 76 },
];

describe("PilotSiteMap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the map container with !important height to override leaflet CSS", () => {
    const { container } = render(<PilotSiteMap sites={mockSites} />);
    const mapDiv = container.querySelector(".w-full");
    expect(mapDiv).toBeInTheDocument();
    // Leaflet CSS sets .leaflet-container { height: 100% } which overrides
    // regular Tailwind height classes. The !important modifier is required
    // to prevent the map from collapsing to 0px height.
    expect(mapDiv).toHaveClass("!h-[300px]");
  });

  it("loads leaflet CSS stylesheet", () => {
    const { container } = render(<PilotSiteMap sites={mockSites} />);
    const link = container.querySelector('link[rel="stylesheet"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    );
  });

  it("initializes the leaflet map on mount", async () => {
    render(<PilotSiteMap sites={mockSites} />);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });
  });

  it("fits bounds to site locations", async () => {
    render(<PilotSiteMap sites={mockSites} />);

    await waitFor(() => {
      expect(L.latLngBounds).toHaveBeenCalled();
      expect(mockMap.fitBounds).toHaveBeenCalledWith(
        mockLatLngBounds,
        expect.objectContaining({ padding: [30, 30] })
      );
    });
  });

  it("creates circle markers for each site", async () => {
    render(<PilotSiteMap sites={mockSites} />);

    await waitFor(() => {
      expect(L.circleMarker).toHaveBeenCalledTimes(3);
    });
  });

  it("binds popups with site names and flight counts", async () => {
    render(<PilotSiteMap sites={mockSites} />);

    await waitFor(() => {
      expect(mockMarker.bindPopup).toHaveBeenCalledTimes(3);
    });

    const calls = mockMarker.bindPopup.mock.calls;
    expect(calls.some((c: any[]) => c[0].includes("Bunloc"))).toBe(true);
    expect(calls.some((c: any[]) => c[0].includes("500 flights"))).toBe(true);
  });

  it("does not initialize map when sites array is empty", async () => {
    render(<PilotSiteMap sites={[]} />);

    // Give it time to potentially fire
    await new Promise((r) => setTimeout(r, 50));
    expect(L.map).not.toHaveBeenCalled();
  });

  it("renders container even with empty sites", () => {
    const { container } = render(<PilotSiteMap sites={[]} />);
    const mapDiv = container.querySelector(".w-full");
    expect(mapDiv).toBeInTheDocument();
  });
});
