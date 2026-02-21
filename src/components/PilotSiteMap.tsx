"use client";

import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { takeoffPath } from "@/lib/utils";

interface SiteData {
  id: number;
  name: string;
  lat: number;
  lng: number;
  flight_count: number;
}

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  useMemo(() => {
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, bounds]);
  return null;
}

export default function PilotSiteMap({ sites }: { sites: SiteData[] }) {
  const validSites = sites.filter((s) => s.lat && s.lng);

  if (validSites.length === 0) {
    return <div className="w-full !h-[300px] rounded-lg" />;
  }

  const maxFlights = Math.max(...validSites.map((s) => s.flight_count));
  const bounds = validSites.map((s) => [Number(s.lat), Number(s.lng)] as [number, number]);

  return (
    <MapContainer
      center={bounds[0]}
      zoom={10}
      className="w-full !h-[300px] rounded-lg"
    >
      <FitBounds bounds={bounds} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
        maxZoom={18}
      />
      {validSites.map((s) => {
        const radius = Math.max(5, (s.flight_count / maxFlights) * 20);
        return (
          <CircleMarker
            key={s.id}
            center={[Number(s.lat), Number(s.lng)]}
            radius={radius}
            pathOptions={{
              fillColor: "#3b82f6",
              color: "#fff",
              weight: 1.5,
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <strong>
                <a href={takeoffPath(s.id, s.name)}>{s.name}</a>
              </strong>
              <br />
              {s.flight_count} flights
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
