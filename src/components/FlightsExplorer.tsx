"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { pilotPath, takeoffPath, formatDuration, formatDistance } from "@/lib/utils";

interface Flight {
  id: number;
  start_time: string;
  distance_km: number;
  score: number;
  airtime: number;
  type: string;
  url: string;
  pilot_name: string;
  pilot_username: string;
  takeoff_name: string | null;
  takeoff_id: number | null;
  glider_name: string;
  glider_category: string;
}

interface Props {
  flights: Flight[];
  total: number;
  page: number;
  pageSize: number;
  currentFilters: Record<string, string | undefined>;
}

const PRESETS = [
  { key: "today", preset: "today" },
  { key: "bestMonth", preset: "bestMonth" },
  { key: "top100", preset: "top100" },
  { key: "club100k", preset: "club100k" },
] as const;

export default function FlightsExplorer({ flights, total, page, pageSize, currentFilters }: Props) {
  const t = useTranslations("flights");
  const router = useRouter();
  const [pilotSearch, setPilotSearch] = useState(currentFilters.pilot || "");
  const [takeoffSearch, setTakeoffSearch] = useState(currentFilters.takeoff || "");
  const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom || "");
  const [dateTo, setDateTo] = useState(currentFilters.dateTo || "");
  const [distMin, setDistMin] = useState(currentFilters.distMin || "");
  const [distMax, setDistMax] = useState(currentFilters.distMax || "");
  const [category, setCategory] = useState(currentFilters.category || "");

  const totalPages = Math.ceil(total / pageSize);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (pilotSearch) params.set("pilot", pilotSearch);
    if (takeoffSearch) params.set("takeoff", takeoffSearch);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (distMin) params.set("distMin", distMin);
    if (distMax) params.set("distMax", distMax);
    if (category) params.set("category", category);
    if (currentFilters.sort) params.set("sort", currentFilters.sort);
    if (currentFilters.dir) params.set("dir", currentFilters.dir);
    router.push(`/flights?${params.toString()}`);
  };

  const setPreset = (preset: string) => {
    router.push(`/flights?preset=${preset}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(currentFilters as Record<string, string>);
    params.set("page", String(p));
    router.push(`/flights?${params.toString()}`);
  };

  const toggleSort = (col: string) => {
    const params = new URLSearchParams(currentFilters as Record<string, string>);
    if (currentFilters.sort === col) {
      params.set("dir", currentFilters.dir === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", col);
      params.set("dir", "desc");
    }
    params.delete("page");
    router.push(`/flights?${params.toString()}`);
  };

  const SortHeader = ({ col, label }: { col: string; label: string }) => (
    <th
      className="px-2 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-900 whitespace-nowrap"
      onClick={() => toggleSort(col)}
    >
      {label} {currentFilters.sort === col ? (currentFilters.dir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  const presetKeys: Record<string, string> = {
    today: "presetToday",
    bestMonth: "presetBestMonth",
    top100: "presetTop100",
    club100k: "presetClub100k",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.preset)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              currentFilters.preset === p.preset
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t(presetKeys[p.key] as any)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t("pilot")}</label>
          <input
            type="text"
            value={pilotSearch}
            onChange={(e) => setPilotSearch(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded w-32"
            placeholder="..."
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t("takeoff")}</label>
          <input
            type="text"
            value={takeoffSearch}
            onChange={(e) => setTakeoffSearch(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded w-32"
            placeholder="..."
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t("dateRange")}</label>
          <div className="flex gap-1">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-2 py-1.5 text-sm border border-gray-300 rounded" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-2 py-1.5 text-sm border border-gray-300 rounded" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t("distanceRange")}</label>
          <div className="flex gap-1 items-center">
            <input type="number" value={distMin} onChange={(e) => setDistMin(e.target.value)} className="px-2 py-1.5 text-sm border border-gray-300 rounded w-20" placeholder="Min" />
            <span className="text-gray-400">-</span>
            <input type="number" value={distMax} onChange={(e) => setDistMax(e.target.value)} className="px-2 py-1.5 text-sm border border-gray-300 rounded w-20" placeholder="Max" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t("gliderCategory")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded"
          >
            <option value="">All</option>
            {["A", "B", "C", "D", "Z", "HG", "T"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button
          onClick={applyFilters}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t("filters")}
        </button>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {total} {t("title").toLowerCase()} &middot; page {page}/{totalPages || 1}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <SortHeader col="date" label={t("date")} />
              <SortHeader col="pilot" label={t("pilot")} />
              <SortHeader col="takeoff" label={t("takeoff")} />
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("glider")}</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("type")}</th>
              <SortHeader col="distance" label={t("distance")} />
              <SortHeader col="score" label={t("score")} />
              <SortHeader col="airtime" label={t("duration")} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {flights.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-8 text-center text-gray-400">{t("noFlights")}</td>
              </tr>
            )}
            {flights.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-2 py-2 text-gray-700 whitespace-nowrap">
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {new Date(f.start_time).toLocaleDateString()}
                  </a>
                </td>
                <td className="px-2 py-2">
                  <Link href={pilotPath(f.pilot_username)} className="text-blue-600 hover:underline">
                    {f.pilot_name}
                  </Link>
                </td>
                <td className="px-2 py-2">
                  {f.takeoff_id ? (
                    <Link href={takeoffPath(f.takeoff_id, f.takeoff_name || "")} className="text-blue-600 hover:underline">
                      {f.takeoff_name}
                    </Link>
                  ) : "-"}
                </td>
                <td className="px-2 py-2 text-gray-700">
                  {f.glider_name}
                  <span className="ml-1 px-1 py-0.5 bg-gray-100 rounded text-[10px]">{f.glider_category}</span>
                </td>
                <td className="px-2 py-2 text-gray-500 text-xs">{f.type}</td>
                <td className="px-2 py-2 font-medium">{formatDistance(f.distance_km)} km</td>
                <td className="px-2 py-2 text-gray-700">{Number(f.score).toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500">{formatDuration(f.airtime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-50"
          >
            &laquo;
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const p = page <= 5 ? i + 1 : page - 4 + i;
            if (p > totalPages || p < 1) return null;
            return (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`px-3 py-1.5 text-sm border rounded ${
                  p === page ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-300"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-50"
          >
            &raquo;
          </button>
        </div>
      )}
    </div>
  );
}
