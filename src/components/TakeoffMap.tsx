"use client";

import { useEffect, useRef } from "react";
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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      // Fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        zoomControl: true,
      }).setView([46.0, 25.0], 7);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      takeoffs.forEach((tk) => {
        if (!tk.lat || !tk.lng) return;
        const color = getMarkerColor(tk.last_activity);
        const marker = L.circleMarker([tk.lat, tk.lng], {
          radius: Math.min(4 + Math.log2(tk.flight_count + 1) * 2, 14),
          fillColor: color,
          color: "#fff",
          weight: 1.5,
          fillOpacity: 0.85,
        }).addTo(map);

        marker.bindPopup(
          `<div style="min-width:120px">
            <strong><a href="${takeoffPath(tk.id, tk.name)}">${tk.name}</a></strong><br/>
            <small>${tk.flight_count} flights</small>
          </div>`
        );
      });

      mapInstanceRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [takeoffs]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapRef} className="w-full h-[350px] md:h-[450px] rounded-lg" />
    </>
  );
}
