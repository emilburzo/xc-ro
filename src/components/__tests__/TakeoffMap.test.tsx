import React from "react";
import { render, waitFor } from "@testing-library/react";
import TakeoffMap from "../TakeoffMap";
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
  setView: jest.fn().mockReturnThis(),
  remove: jest.fn(),
};

const mockTileLayer = {
  addTo: jest.fn().mockReturnThis(),
};

jest.mock("leaflet", () => ({
  map: jest.fn(() => mockMap),
  tileLayer: jest.fn(() => mockTileLayer),
  circleMarker: jest.fn(() => mockMarker),
  Icon: {
    Default: {
      prototype: { _getIconUrl: "" },
      mergeOptions: jest.fn(),
    },
  },
}));

const mockTakeoffs = [
  {
    id: 1,
    name: "Bunloc",
    lat: 45.6,
    lng: 25.5,
    flight_count: 500,
    last_activity: "2025-12-01",
  },
  {
    id: 2,
    name: "Sticlaria",
    lat: 46.2,
    lng: 24.8,
    flight_count: 200,
    last_activity: "2025-06-15",
  },
  {
    id: 3,
    name: "Old Site",
    lat: 45.0,
    lng: 24.0,
    flight_count: 5,
    last_activity: null,
  },
];

describe("TakeoffMap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the map container element", () => {
    const { container } = render(<TakeoffMap takeoffs={mockTakeoffs} />);
    const mapDiv = container.querySelector(".w-full");
    expect(mapDiv).toBeInTheDocument();
    expect(mapDiv).toHaveClass("!h-[350px]");
  });

  it("loads leaflet CSS stylesheet", () => {
    const { container } = render(<TakeoffMap takeoffs={mockTakeoffs} />);
    const link = container.querySelector('link[rel="stylesheet"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  });

  it("initializes the leaflet map on mount", async () => {
    render(<TakeoffMap takeoffs={mockTakeoffs} />);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });
  });

  it("creates circle markers for each takeoff with valid coordinates", async () => {
    render(<TakeoffMap takeoffs={mockTakeoffs} />);

    await waitFor(() => {
      // 3 takeoffs with valid lat/lng
      expect(L.circleMarker).toHaveBeenCalledTimes(3);
    });
  });

  it("sets correct map center (Romania)", async () => {
    render(<TakeoffMap takeoffs={mockTakeoffs} />);

    await waitFor(() => {
      expect(mockMap.setView).toHaveBeenCalledWith([46.0, 25.0], 7);
    });
  });

  it("binds popups to markers with takeoff names", async () => {
    render(<TakeoffMap takeoffs={mockTakeoffs} />);

    await waitFor(() => {
      expect(mockMarker.bindPopup).toHaveBeenCalledTimes(3);
    });

    // Check that popup HTML includes takeoff names
    const calls = mockMarker.bindPopup.mock.calls;
    expect(calls.some((c: any[]) => c[0].includes("Bunloc"))).toBe(true);
    expect(calls.some((c: any[]) => c[0].includes("Sticlaria"))).toBe(true);
  });

  it("skips markers for takeoffs without coordinates", async () => {
    const takeoffsWithMissing = [
      ...mockTakeoffs,
      { id: 4, name: "No coords", lat: 0, lng: 0, flight_count: 1, last_activity: null },
    ];
    render(<TakeoffMap takeoffs={takeoffsWithMissing} />);

    await waitFor(() => {
      // The TakeoffMap component checks `if (!tk.lat || !tk.lng) return;`
      // so lat=0, lng=0 will be skipped since 0 is falsy in JavaScript
      expect(L.circleMarker).toHaveBeenCalledTimes(3);
    });
  });

  it("renders with empty takeoffs array", () => {
    const { container } = render(<TakeoffMap takeoffs={[]} />);
    const mapDiv = container.querySelector(".w-full");
    expect(mapDiv).toBeInTheDocument();
  });

  it("adds tile layer from OpenStreetMap", async () => {
    render(<TakeoffMap takeoffs={mockTakeoffs} />);

    await waitFor(() => {
      expect(L.tileLayer).toHaveBeenCalledWith(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        expect.objectContaining({ maxZoom: 18 })
      );
    });
  });
});
