"use client";

import { useEffect, useRef } from "react";
import { pilotPath, takeoffPath, formatDistance, formatDate } from "@/lib/utils";
import { useLocale } from "next-intl";

interface FlightMarker {
  id: number;
  start_time: string;
  distance_km: number;
  pilot_name: string;
  pilot_username: string;
  takeoff_name: string | null;
  takeoff_id: number | null;
  glider_name: string;
  glider_category: string;
  start_lat: number | null;
  start_lng: number | null;
}

function getDistanceColor(distance: number): string {
  if (distance >= 100) return "#ef4444"; // red - epic XC
  if (distance >= 50) return "#f97316";  // orange - strong XC
  if (distance >= 20) return "#eab308";  // yellow - decent XC
  return "#3b82f6";                      // blue - local/short
}

export default function FlightsMap({ flights }: { flights: FlightMarker[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const locale = useLocale();

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

      const validFlights = flights.filter(
        (f) => f.start_lat != null && f.start_lng != null &&
               Number.isFinite(f.start_lat) && Number.isFinite(f.start_lng)
      );

      let map: any;
      if (validFlights.length > 0) {
        const bounds = L.latLngBounds(
          validFlights.map((f) => [Number(f.start_lat), Number(f.start_lng)])
        );
        map = L.map(mapRef.current!).fitBounds(bounds, { padding: [30, 30] });
      } else {
        // Default to Romania center if no valid coordinates
        map = L.map(mapRef.current!, { zoomControl: true }).setView([46.0, 25.0], 7);
      }

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      validFlights.forEach((f) => {
        const color = getDistanceColor(f.distance_km);
        const radius = Math.min(4 + Math.log2(f.distance_km + 1) * 1.5, 12);

        const marker = L.circleMarker([Number(f.start_lat), Number(f.start_lng)], {
          radius,
          fillColor: color,
          color: "#fff",
          weight: 1.5,
          fillOpacity: 0.85,
        }).addTo(map);

        const popupContent = document.createElement("div");
        popupContent.style.minWidth = "150px";

        const pilotStrong = document.createElement("strong");
        const pilotLink = document.createElement("a");
        pilotLink.href = pilotPath(f.pilot_username);
        pilotLink.textContent = f.pilot_name;
        pilotStrong.appendChild(pilotLink);
        popupContent.appendChild(pilotStrong);
        popupContent.appendChild(document.createElement("br"));

        const infoSmall = document.createElement("small");
        infoSmall.textContent = `${formatDate(f.start_time, locale)} · ${formatDistance(f.distance_km)} km`;
        popupContent.appendChild(infoSmall);
        popupContent.appendChild(document.createElement("br"));

        const detailsSmall = document.createElement("small");
        if (f.takeoff_id) {
          const takeoffLink = document.createElement("a");
          takeoffLink.href = takeoffPath(f.takeoff_id, f.takeoff_name || "");
          takeoffLink.textContent = f.takeoff_name || "";
          detailsSmall.appendChild(takeoffLink);
        } else {
          detailsSmall.textContent = "-";
        }
        detailsSmall.appendChild(document.createTextNode(` · ${f.glider_name}`));
        popupContent.appendChild(detailsSmall);

        marker.bindPopup(popupContent);
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
  }, [flights, locale]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapRef} className="w-full !h-[350px] md:!h-[500px] rounded-lg" />
    </>
  );
}
