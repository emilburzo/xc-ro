import React from "react";
import { render } from "@testing-library/react";
import PilotSiteMap from "../PilotSiteMap";

// Mock leaflet CSS import
jest.mock("leaflet/dist/leaflet.css", () => ({}));

const mockFitBounds = jest.fn();

// Mock react-leaflet
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children, className }: any) => (
    <div data-testid="map-container" className={className}>
      {children}
    </div>
  ),
  TileLayer: ({ url }: any) => <div data-testid="tile-layer" data-url={url} />,
  CircleMarker: ({ children, center, radius }: any) => (
    <div data-testid="circle-marker" data-center={JSON.stringify(center)} data-radius={radius}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ fitBounds: mockFitBounds }),
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
    const mapDiv = container.querySelector('[data-testid="map-container"]');
    expect(mapDiv).toBeInTheDocument();
    expect(mapDiv).toHaveClass("!h-[300px]");
  });

  it("fits bounds to site locations", () => {
    render(<PilotSiteMap sites={mockSites} />);
    expect(mockFitBounds).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ padding: [30, 30] })
    );
  });

  it("creates circle markers for each site", () => {
    const { container } = render(<PilotSiteMap sites={mockSites} />);
    const markers = container.querySelectorAll('[data-testid="circle-marker"]');
    expect(markers).toHaveLength(3);
  });

  it("renders popups with site names and flight counts", () => {
    const { getByText } = render(<PilotSiteMap sites={mockSites} />);
    expect(getByText("Bunloc")).toBeInTheDocument();
    expect(getByText("500 flights")).toBeInTheDocument();
  });

  it("does not render map when sites array is empty", () => {
    const { container } = render(<PilotSiteMap sites={[]} />);
    const mapDiv = container.querySelector('[data-testid="map-container"]');
    expect(mapDiv).not.toBeInTheDocument();
  });

  it("renders container even with empty sites", () => {
    const { container } = render(<PilotSiteMap sites={[]} />);
    const div = container.querySelector(".w-full");
    expect(div).toBeInTheDocument();
  });
});
