import React from "react";
import { render } from "@testing-library/react";
import TakeoffMap from "../TakeoffMap";

// Mock leaflet CSS import
jest.mock("leaflet/dist/leaflet.css", () => ({}));

// Mock react-leaflet
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children, center, zoom, className }: any) => (
    <div data-testid="map-container" data-center={JSON.stringify(center)} data-zoom={zoom} className={className}>
      {children}
    </div>
  ),
  TileLayer: ({ url, maxZoom }: any) => (
    <div data-testid="tile-layer" data-url={url} data-max-zoom={maxZoom} />
  ),
  CircleMarker: ({ children, center, radius, pathOptions }: any) => (
    <div data-testid="circle-marker" data-center={JSON.stringify(center)} data-radius={radius} data-path-options={JSON.stringify(pathOptions)}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
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
  it("renders the map container with correct classes", () => {
    const { container } = render(<TakeoffMap takeoffs={mockTakeoffs} />);
    const mapDiv = container.querySelector('[data-testid="map-container"]');
    expect(mapDiv).toBeInTheDocument();
    expect(mapDiv).toHaveClass("!h-[350px]");
  });

  it("sets correct map center (Romania) and zoom", () => {
    const { container } = render(<TakeoffMap takeoffs={mockTakeoffs} />);
    const mapDiv = container.querySelector('[data-testid="map-container"]');
    expect(mapDiv).toHaveAttribute("data-center", JSON.stringify([46.0, 25.0]));
    expect(mapDiv).toHaveAttribute("data-zoom", "7");
  });

  it("creates circle markers for each takeoff with valid coordinates", () => {
    const { container } = render(<TakeoffMap takeoffs={mockTakeoffs} />);
    const markers = container.querySelectorAll('[data-testid="circle-marker"]');
    expect(markers).toHaveLength(3);
  });

  it("renders popups with takeoff names", () => {
    const { getByText } = render(<TakeoffMap takeoffs={mockTakeoffs} />);
    expect(getByText("Bunloc")).toBeInTheDocument();
    expect(getByText("Sticlaria")).toBeInTheDocument();
    expect(getByText("Old Site")).toBeInTheDocument();
  });

  it("skips markers for takeoffs without coordinates", () => {
    const takeoffsWithMissing = [
      ...mockTakeoffs,
      { id: 4, name: "No coords", lat: 0, lng: 0, flight_count: 1, last_activity: null },
    ];
    const { container } = render(<TakeoffMap takeoffs={takeoffsWithMissing} />);
    const markers = container.querySelectorAll('[data-testid="circle-marker"]');
    // lat=0, lng=0 is filtered out since 0 is falsy
    expect(markers).toHaveLength(3);
  });

  it("renders with empty takeoffs array", () => {
    const { container } = render(<TakeoffMap takeoffs={[]} />);
    const mapDiv = container.querySelector('[data-testid="map-container"]');
    expect(mapDiv).toBeInTheDocument();
    const markers = container.querySelectorAll('[data-testid="circle-marker"]');
    expect(markers).toHaveLength(0);
  });

  it("adds tile layer from OpenStreetMap", () => {
    const { container } = render(<TakeoffMap takeoffs={mockTakeoffs} />);
    const tileLayer = container.querySelector('[data-testid="tile-layer"]');
    expect(tileLayer).toHaveAttribute("data-url", "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(tileLayer).toHaveAttribute("data-max-zoom", "18");
  });
});
