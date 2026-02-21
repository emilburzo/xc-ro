"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { wingPath } from "@/lib/utils";

interface Wing {
  id: number;
  name: string;
  category: string;
  flight_count: number;
  pilot_count: number;
  total_km: number;
  avg_distance: number | null;
  max_distance: number | null;
  avg_speed: number | null;
  first_year: number | null;
  last_year: number | null;
  last_flight: string | null;
}

type SortKey = "name" | "flight_count" | "pilot_count" | "total_km" | "avg_distance" | "max_distance" | "last_flight";

const CAT_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-red-100 text-red-800",
  Z: "bg-purple-100 text-purple-800",
  T: "bg-pink-100 text-pink-800",
  HG: "bg-orange-100 text-orange-800",
  RW2: "bg-gray-100 text-gray-800",
  RW5: "bg-gray-100 text-gray-800",
};

export default function WingsTable({ wings }: { wings: Wing[] }) {
  const t = useTranslations("wings");
  const [sortKey, setSortKey] = useState<SortKey>("flight_count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [minFlights, setMinFlights] = useState(0);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(wings.map((w) => w.category))).sort();
    return cats;
  }, [wings]);

  const filtered = useMemo(() => {
    let list = wings;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((w) => w.name.toLowerCase().includes(s));
    }
    if (category !== "all") {
      list = list.filter((w) => w.category === category);
    }
    if (minFlights > 0) {
      list = list.filter((w) => w.flight_count >= minFlights);
    }
    return list;
  }, [wings, search, category, minFlights]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      if (sortKey === "name" || sortKey === "last_flight") {
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      }
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortHeader = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className="px-2 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-900 whitespace-nowrap"
      onClick={() => toggleSort(k)}
    >
      {label} {sortKey === k ? (sortDir === "asc" ? "\u2191" : "\u2193") : ""}
    </th>
  );

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
        >
          <option value="all">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <SortHeader k="name" label={t("name")} />
              <SortHeader k="flight_count" label={t("flights")} />
              <SortHeader k="pilot_count" label={t("pilots")} />
              <SortHeader k="total_km" label={t("totalKm")} />
              <SortHeader k="avg_distance" label={t("avgDistance")} />
              <SortHeader k="max_distance" label={t("record")} />
              <SortHeader k="last_flight" label={t("lastFlight")} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.slice(0, 200).map((w) => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-2 py-2">
                  <Link href={wingPath(w.id, w.name)} className="text-blue-600 hover:underline font-medium">
                    {w.name}
                  </Link>
                  <span className={`ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${CAT_COLORS[w.category] || "bg-gray-100 text-gray-800"}`}>
                    {w.category}
                  </span>
                </td>
                <td className="px-2 py-2 text-gray-700">{w.flight_count}</td>
                <td className="px-2 py-2 text-gray-700">{w.pilot_count}</td>
                <td className="px-2 py-2 text-gray-700">{w.total_km ? w.total_km.toLocaleString("ro-RO") : "-"}</td>
                <td className="px-2 py-2 text-gray-700">{w.avg_distance ? `${w.avg_distance} km` : "-"}</td>
                <td className="px-2 py-2 text-gray-700">{w.max_distance ? Number(w.max_distance).toFixed(1) : "-"}</td>
                <td className="px-2 py-2 text-gray-500 text-xs">
                  {w.last_flight ? new Date(w.last_flight).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
