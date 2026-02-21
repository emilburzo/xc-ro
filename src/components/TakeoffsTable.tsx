"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { takeoffPath, formatDate } from "@/lib/utils";

import dynamic from "next/dynamic";

const TakeoffMap = dynamic(() => import("@/components/TakeoffMap"), { ssr: false });

interface TakeoffMapData {
  id: number;
  name: string;
  lat: number;
  lng: number;
  flight_count: number;
  last_activity: string | null;
}

interface Takeoff {
  id: number;
  name: string;
  flight_count: number;
  pilot_count: number;
  xc_potential: number | null;
  record_km: number | null;
  last_activity: string | null;
  weekend_pct: number | null;
  flights_100k: number | null;
  avg_distance: number | null;
  ab_pct: number | null;
  monthly_data: { month: number; count: number }[] | null;
}

type SortKey = "name" | "flight_count" | "pilot_count" | "xc_potential" | "record_km" | "last_activity" | "weekend_pct";

function MiniSparkline({ data }: { data: { month: number; count: number }[] | null }) {
  if (!data || data.length === 0) return <span className="text-gray-300">-</span>;
  const maxCount = Math.max(...data.map((d) => d.count));
  const lookup = new Map(data.map((d) => [d.month, d.count]));
  return (
    <div className="flex items-end gap-[1px] h-4">
      {Array.from({ length: 12 }, (_, i) => {
        const count = lookup.get(i + 1) || 0;
        const height = maxCount > 0 ? Math.max((count / maxCount) * 16, 1) : 1;
        return (
          <div
            key={i}
            className="w-1.5 bg-blue-400 rounded-t-sm"
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>
      {label}
    </span>
  );
}

export default function TakeoffsTable({ takeoffs, mapData }: { takeoffs: Takeoff[]; mapData?: TakeoffMapData[] }) {
  const t = useTranslations("takeoffs");
  const locale = useLocale();
  const [sortKey, setSortKey] = useState<SortKey>("flight_count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [flyableNow, setFlyableNow] = useState(false);
  const [minFlights, setMinFlights] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "dormant">("active");

  const currentMonth = new Date().getMonth() + 1;

  const filtered = useMemo(() => {
    let list = takeoffs;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((tk) => tk.name.toLowerCase().includes(s));
    }
    if (minFlights > 0) {
      list = list.filter((tk) => tk.flight_count >= minFlights);
    }
    if (flyableNow) {
      list = list.filter((tk) =>
        tk.monthly_data?.some((d) => d.month === currentMonth && d.count > 0)
      );
    }
    if (activeFilter === "active") {
      list = list.filter((tk) => {
        if (!tk.last_activity) return false;
        return Date.now() - new Date(tk.last_activity).getTime() < 365 * 24 * 60 * 60 * 1000;
      });
    } else if (activeFilter === "dormant") {
      list = list.filter((tk) => {
        if (!tk.last_activity) return true;
        return Date.now() - new Date(tk.last_activity).getTime() >= 365 * 24 * 60 * 60 * 1000;
      });
    }
    return list;
  }, [takeoffs, search, minFlights, flyableNow, activeFilter, currentMonth]);

  const filteredMapData = useMemo(() => {
    if (!mapData) return [];
    const ids = new Set(filtered.map((tk) => tk.id));
    return mapData.filter((tk) => ids.has(tk.id));
  }, [mapData, filtered]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      if (sortKey === "name" || sortKey === "last_activity") {
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
      className="px-2 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-900 whitespace-nowrap sticky top-0 bg-white z-10 border-b border-gray-200"
      onClick={() => toggleSort(k)}
    >
      {label} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  function getTags(tk: Takeoff) {
    const tags: { label: string; color: string }[] = [];
    if ((tk.flights_100k || 0) >= 5) tags.push({ label: t("club100k"), color: "bg-yellow-100 text-yellow-800" });
    if ((tk.ab_pct || 0) > 50 && (tk.avg_distance || 0) < 10) tags.push({ label: t("beginnerFriendly"), color: "bg-green-100 text-green-800" });
    if ((tk.xc_potential || 0) > 80) tags.push({ label: t("xcEngine"), color: "bg-purple-100 text-purple-800" });
    if ((tk.weekend_pct || 0) > 75) tags.push({ label: t("weekendSite"), color: "bg-blue-100 text-blue-800" });
    if (tk.last_activity) {
      const days = (Date.now() - new Date(tk.last_activity).getTime()) / (1000 * 60 * 60 * 24);
      if (days > 365) tags.push({ label: t("inactive"), color: "bg-gray-100 text-gray-600" });
    }
    return tags;
  }

  return (
    <div>
      {mapData && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
          <TakeoffMap takeoffs={filteredMapData} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input type="checkbox" checked={flyableNow} onChange={(e) => setFlyableNow(e.target.checked)} />
          {t("flyableNow")}
        </label>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as "all" | "active" | "dormant")}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
        >
          <option value="all">All</option>
          <option value="active">{t("activeOnly")}</option>
          <option value="dormant">{t("dormantOnly")}</option>
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

      <div className="text-sm text-gray-500 mb-2">{sorted.length} takeoffs</div>

      {/* Table */}
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <SortHeader k="name" label={t("name")} />
              <SortHeader k="flight_count" label={t("flights")} />
              <SortHeader k="pilot_count" label={t("pilots")} />
              <SortHeader k="xc_potential" label={t("xcPotential")} />
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200">{t("season")}</th>
              <SortHeader k="record_km" label={t("record")} />
              <SortHeader k="last_activity" label={t("lastActivity")} />
              <SortHeader k="weekend_pct" label={t("weekendPct")} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.slice(0, 100).map((tk) => {
              const tags = getTags(tk);
              return (
                <tr key={tk.id} className="hover:bg-gray-50">
                  <td className="px-2 py-2">
                    <Link href={takeoffPath(tk.id, tk.name)} className="text-blue-600 hover:underline font-medium">
                      {tk.name}
                    </Link>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {tags.map((tag) => (
                          <Badge key={tag.label} label={tag.label} color={tag.color} />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 text-gray-700">{tk.flight_count}</td>
                  <td className="px-2 py-2 text-gray-700">{tk.pilot_count}</td>
                  <td className="px-2 py-2 text-gray-700">{tk.xc_potential ? `${tk.xc_potential} km` : "-"}</td>
                  <td className="px-2 py-2"><MiniSparkline data={tk.monthly_data} /></td>
                  <td className="px-2 py-2 text-gray-700">{tk.record_km ? `${Number(tk.record_km).toFixed(1)}` : "-"}</td>
                  <td className="px-2 py-2 text-gray-500 text-xs">
                    {tk.last_activity ? formatDate(tk.last_activity, locale) : "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-700">{tk.weekend_pct != null ? `${tk.weekend_pct}%` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
