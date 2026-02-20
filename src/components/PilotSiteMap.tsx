"use client";

import { useEffect, useRef } from "react";
import { takeoffPath } from "@/lib/utils";

interface SiteData {
  id: number;
  name: string;
  lat: number;
  lng: number;
  flight_count: number;
}

export default function PilotSiteMap({ sites }: { sites: SiteData[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || sites.length === 0) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const validSites = sites.filter((s) => s.lat && s.lng);
      const bounds = L.latLngBounds(validSites.map((s) => [Number(s.lat), Number(s.lng)]));
      const map = L.map(mapRef.current!).fitBounds(bounds, { padding: [30, 30] });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      const maxFlights = Math.max(...validSites.map((s) => s.flight_count));

      validSites.forEach((s) => {
        const radius = Math.max(5, (s.flight_count / maxFlights) * 20);
        L.circleMarker([Number(s.lat), Number(s.lng)], {
          radius,
          fillColor: "#3b82f6",
          color: "#fff",
          weight: 1.5,
          fillOpacity: 0.7,
        })
          .addTo(map)
          .bindPopup(
            `<strong><a href="${takeoffPath(s.id, s.name)}">${s.name}</a></strong><br/>${s.flight_count} flights`
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
  }, [sites]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-[300px] rounded-lg" />
    </>
  );
}
