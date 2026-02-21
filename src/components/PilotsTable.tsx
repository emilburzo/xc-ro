"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { pilotPath, takeoffPath, formatDate, removeDiacritics } from "@/lib/utils";

interface Pilot {
  id: number;
  name: string;
  username: string;
  flight_count: number;
  total_km: number;
  total_score: number;
  avg_distance: number;
  max_distance: number;
  active_years: number;
  last_flight: string;
  fav_takeoff_id: number | null;
  fav_takeoff_name: string | null;
}

type SortKey = "name" | "flight_count" | "total_km" | "total_score" | "avg_distance" | "max_distance" | "active_years" | "last_flight";

export default function PilotsTable({ pilots }: { pilots: Pilot[] }) {
  const t = useTranslations("pilots");
  const locale = useLocale();
  const [sortKey, setSortKey] = useState<SortKey>("total_km");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [minFlights, setMinFlights] = useState(0);

  const filtered = useMemo(() => {
    let list = pilots;
    if (search) {
      const s = removeDiacritics(search).toLowerCase();
      list = list.filter((p) => removeDiacritics(p.name).toLowerCase().includes(s) || removeDiacritics(p.username).toLowerCase().includes(s));
    }
    if (minFlights > 0) list = list.filter((p) => p.flight_count >= minFlights);
    return list;
  }, [pilots, search, minFlights]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (sortKey === "name" || sortKey === "last_flight") {
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      }
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortHeader = ({ k, label, align }: { k: SortKey; label: string; align?: "right" }) => (
    <th
      className={`px-2 py-2 ${align === "right" ? "text-right" : "text-left"} text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-900 whitespace-nowrap sticky top-0 bg-white z-10 border-b border-gray-200`}
      onClick={() => toggleSort(k)}
    >
      {label} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
        />
        <label className="flex items-center gap-1 text-sm text-gray-600">
          {t("minFlights")}:
          <input
            type="number"
            min={0}
            value={minFlights || ""}
            onChange={(e) => setMinFlights(Number(e.target.value) || 0)}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </label>
      </div>

      <div className="text-sm text-gray-500 mb-2">{sorted.length} {t("title").toLowerCase()}</div>

      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <SortHeader k="name" label={t("name")} />
              <SortHeader k="flight_count" label={t("flights")} align="right" />
              <SortHeader k="total_km" label={t("totalKm")} align="right" />
              <SortHeader k="total_score" label={t("totalScore")} align="right" />
              <SortHeader k="avg_distance" label={t("avgDistance")} align="right" />
              <SortHeader k="max_distance" label={t("personalRecord")} align="right" />
              <SortHeader k="active_years" label={t("activeYears")} align="right" />
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200">{t("favoriteSite")}</th>
              <SortHeader k="last_flight" label={t("lastFlight")} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.slice(0, 100).map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-2 py-2">
                  <Link href={pilotPath(p.username)} className="text-blue-600 hover:underline font-medium">
                    {p.name}
                  </Link>
                </td>
                <td className="px-2 py-2 text-gray-700 text-right">{p.flight_count}</td>
                <td className="px-2 py-2 text-gray-700 text-right">{p.total_km.toLocaleString()}</td>
                <td className="px-2 py-2 text-gray-700 text-right">{p.total_score.toLocaleString()}</td>
                <td className="px-2 py-2 text-gray-700 text-right">{p.avg_distance.toFixed(1)}</td>
                <td className="px-2 py-2 font-medium text-right">{p.max_distance.toFixed(1)} km</td>
                <td className="px-2 py-2 text-gray-700 text-right">{p.active_years}</td>
                <td className="px-2 py-2 text-sm">
                  {p.fav_takeoff_id && p.fav_takeoff_name ? (
                    <Link href={takeoffPath(p.fav_takeoff_id, p.fav_takeoff_name)} className="text-blue-600 hover:underline">
                      {p.fav_takeoff_name}
                    </Link>
                  ) : "-"}
                </td>
                <td className="px-2 py-2 text-gray-500 text-xs whitespace-nowrap">
                  {p.last_flight ? formatDate(p.last_flight, locale) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
