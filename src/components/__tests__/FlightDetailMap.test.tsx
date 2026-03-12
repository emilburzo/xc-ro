import React from "react";
import { render, waitFor } from "@testing-library/react";
import FlightDetailMap from "../FlightDetailMap";
import * as L from "leaflet";

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
  marker: jest.fn(() => mockMarker),
  Icon: {
    Default: {
      prototype: { _getIconUrl: "" },
      mergeOptions: jest.fn(),
    },
  },
}));

describe("FlightDetailMap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the map container with !important height", () => {
    const { container } = render(
      <FlightDetailMap lat={45.589} lng={25.664} />
    );
    const mapDiv = container.querySelector(".w-full");
    expect(mapDiv).toBeInTheDocument();
    expect(mapDiv).toHaveClass("!h-[300px]");
  });

  it("loads leaflet CSS stylesheet", () => {
    const { container } = render(
      <FlightDetailMap lat={45.589} lng={25.664} />
    );
    const link = container.querySelector('link[rel="stylesheet"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    );
  });

  it("initializes the leaflet map on mount", async () => {
    render(<FlightDetailMap lat={45.589} lng={25.664} />);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });
  });

  it("sets map view to given coordinates", async () => {
    render(<FlightDetailMap lat={45.589} lng={25.664} />);

    await waitFor(() => {
      expect(mockMap.setView).toHaveBeenCalledWith([45.589, 25.664], 13);
    });
  });

  it("creates a marker at the given coordinates", async () => {
    render(<FlightDetailMap lat={45.589} lng={25.664} />);

    await waitFor(() => {
      expect(L.marker).toHaveBeenCalledWith([45.589, 25.664]);
      expect(mockMarker.addTo).toHaveBeenCalled();
    });
  });

  it("binds popup with label when provided", async () => {
    render(
      <FlightDetailMap lat={45.589} lng={25.664} label="Bunloc" />
    );

    await waitFor(() => {
      expect(mockMarker.bindPopup).toHaveBeenCalledWith(
        "<strong>Bunloc</strong>"
      );
    });
  });

  it("does not bind popup when label is not provided", async () => {
    render(<FlightDetailMap lat={45.589} lng={25.664} />);

    await waitFor(() => {
      expect(L.marker).toHaveBeenCalled();
    });

    expect(mockMarker.bindPopup).not.toHaveBeenCalled();
  });
});
