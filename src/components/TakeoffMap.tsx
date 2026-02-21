"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { takeoffPath } from "@/lib/utils";

interface TakeoffMarker {
  id: number;
  name: string;
  lat: number;
  lng: number;
  flight_count: number;
  last_activity: string | null;
}

function getMarkerColor(lastActivity: string | null): string {
  if (!lastActivity) return "#9ca3af";
  const diff = Date.now() - new Date(lastActivity).getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days <= 30) return "#22c55e";
  if (days <= 365) return "#eab308";
  return "#9ca3af";
}

export default function TakeoffMap({ takeoffs }: { takeoffs: TakeoffMarker[] }) {
  return (
    <MapContainer
      center={[46.0, 25.0]}
      zoom={7}
      zoomControl={true}
      className="w-full !h-[350px] md:!h-[450px] rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={18}
      />
      {takeoffs
        .filter((tk) => tk.lat && tk.lng)
        .map((tk) => {
          const color = getMarkerColor(tk.last_activity);
          return (
            <CircleMarker
              key={tk.id}
              center={[tk.lat, tk.lng]}
              radius={Math.min(4 + Math.log2(tk.flight_count + 1) * 2, 14)}
              pathOptions={{
                fillColor: color,
                color: "#fff",
                weight: 1.5,
                fillOpacity: 0.85,
              }}
            >
              <Popup>
                <div style={{ minWidth: 120 }}>
                  <strong>
                    <a href={takeoffPath(tk.id, tk.name)}>{tk.name}</a>
                  </strong>
                  <br />
                  <small>{tk.flight_count} flights</small>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
    </MapContainer>
  );
}
