"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  takeoffPath,
  flightPath,
  flightTypeKey,
  formatDuration,
  formatDistance,
  type FlightTypeKey,
} from "@/lib/utils";
import type { DailyFlightRow } from "@/lib/types";
import FlightTypeIcon from "@/components/FlightTypeIcon";
import SortHeader from "@/components/SortHeader";

interface DailyFlightsListProps {
  flights: DailyFlightRow[];
  emptyText: string;
  labels: {
    pilot: string;
    takeoff: string;
    glider: string;
    type: string;
    distance: string;
    score: string;
    duration: string;
    points: string;
    xcontest: string;
    viewOnXContest: string;
    types: Record<FlightTypeKey, string>;
  };
}

const TH = "px-2 py-2 text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200";
const LEGEND: FlightTypeKey[] = ["free", "flat", "fai"];

type SortKey = "pilot" | "takeoff" | "glider" | "type" | "distance" | "score" | "duration";

// Text columns start A to Z, number columns with the highest
const TEXT_KEYS: SortKey[] = ["pilot", "takeoff", "glider"];
const TYPE_ORDER: Record<FlightTypeKey, number> = { free: 0, flat: 1, fai: 2 };

function sortValue(f: DailyFlightRow, key: SortKey): string | number | null {
  switch (key) {
    case "pilot":
      return f.pilot_name;
    case "takeoff":
      return f.takeoff_name;
    case "glider":
      return f.glider_name;
    case "type": {
      const typeKey = flightTypeKey(f.type);
      return typeKey ? TYPE_ORDER[typeKey] : -1;
    }
    case "distance":
      return f.distance_km;
    case "score":
      return f.score;
    case "duration":
      return f.airtime;
  }
}

function CategoryBadge({ category }: { category: string }) {
  return <span className="ml-1 px-1 py-0.5 bg-gray-100 rounded-sm text-[10px]">{category}</span>;
}

/** The type's icon, or its raw name if it is not one we know. */
function FlightType({ type, labels, className }: { type: string; labels: Record<FlightTypeKey, string>; className: string }) {
  const key = flightTypeKey(type);
  return key ? <FlightTypeIcon type={key} label={labels[key]} className={className} /> : <>{type}</>;
}

function XContestLink({ url, label, className }: { url: string; label: string; className: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`inline-flex rounded text-gray-500 hover:text-blue-600 hover:bg-gray-100 ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
    </a>
  );
}

/** The day's flights, best score first: a compact list on phones, a sortable table from `sm` up. */
export default function DailyFlightsList({ flights, emptyText, labels }: DailyFlightsListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Stable, so ties keep the score order the flights arrive in; missing values go last either way
  const sorted = useMemo(() => {
    const factor = sortDir === "asc" ? 1 : -1;
    return [...flights].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av === null || bv === null) return av === bv ? 0 : av === null ? 1 : -1;
      const cmp = typeof av === "string" ? av.localeCompare(String(bv), "ro") : av - Number(bv);
      return cmp * factor;
    });
  }, [flights, sortKey, sortDir]);

  const toggleSort = (col: string) => {
    const key = col as SortKey;
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(TEXT_KEYS.includes(key) ? "asc" : "desc");
    }
  };

  if (flights.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
        {emptyText}
      </div>
    );
  }

  const rows = sorted.map((f, i) => ({
    ...f,
    rank: i + 1,
    href: flightPath(f.id, f.pilot_name, f.takeoff_name),
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <ol className="sm:hidden divide-y divide-gray-100">
        {rows.map((f) => (
          <li key={f.id} className="flex gap-2 py-2">
            <span className="w-6 shrink-0 text-sm text-gray-500">{f.rank}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <Link href={f.href} className="font-medium text-sm text-blue-600 hover:underline">
                  {f.pilot_name}
                </Link>
                {f.takeoff_name && <span className="text-xs text-gray-500">{f.takeoff_name}</span>}
              </div>
              <div className="text-xs text-gray-500">
                {f.glider_name}
                <CategoryBadge category={f.glider_category} />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-bold text-sm">
                <FlightType type={f.type} labels={labels.types} className="w-3.5 h-3.5 text-gray-500" />{" "}
                {formatDistance(f.distance_km)} km
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {f.score.toFixed(1)} {labels.points} &middot; {formatDuration(f.airtime)}
              </div>
            </div>
            <XContestLink url={f.url} label={labels.viewOnXContest} className="shrink-0 self-center p-2 -mr-2" />
          </li>
        ))}
      </ol>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={`${TH} text-left`}>#</th>
              <SortHeader col="pilot" label={labels.pilot} activeSort={sortKey} activeDir={sortDir} onSort={toggleSort} />
              <SortHeader col="takeoff" label={labels.takeoff} activeSort={sortKey} activeDir={sortDir} onSort={toggleSort} />
              <SortHeader col="glider" label={labels.glider} activeSort={sortKey} activeDir={sortDir} onSort={toggleSort} />
              <SortHeader col="type" label={labels.type} align="center" activeSort={sortKey} activeDir={sortDir} onSort={toggleSort} />
              <SortHeader col="distance" label={labels.distance} align="right" activeSort={sortKey} activeDir={sortDir} onSort={toggleSort} />
              <SortHeader col="score" label={labels.score} align="right" activeSort={sortKey} activeDir={sortDir} onSort={toggleSort} />
              <SortHeader col="duration" label={labels.duration} align="right" activeSort={sortKey} activeDir={sortDir} onSort={toggleSort} />
              <th className={`${TH} text-center`}>{labels.xcontest}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-2 py-2 text-gray-500">{f.rank}</td>
                <td className="px-2 py-2">
                  <Link href={f.href} className="text-blue-600 hover:underline">
                    {f.pilot_name}
                  </Link>
                </td>
                <td className="px-2 py-2">
                  {f.takeoff_id ? (
                    <Link href={takeoffPath(f.takeoff_id, f.takeoff_name ?? "")} className="text-blue-600 hover:underline">
                      {f.takeoff_name}
                    </Link>
                  ) : "-"}
                </td>
                <td className="px-2 py-2 text-gray-700">
                  {f.glider_name}
                  <CategoryBadge category={f.glider_category} />
                </td>
                <td className="px-2 py-2 text-gray-500 text-center">
                  <FlightType type={f.type} labels={labels.types} className="w-4 h-4" />
                </td>
                <td className="px-2 py-2 font-medium text-right whitespace-nowrap">{formatDistance(f.distance_km)} km</td>
                <td className="px-2 py-2 text-gray-700 text-right">{f.score.toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500 text-right whitespace-nowrap">{formatDuration(f.airtime)}</td>
                <td className="px-2 py-1 text-center">
                  <XContestLink url={f.url} label={labels.viewOnXContest} className="p-1 align-middle" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {LEGEND.map((key) => (
          <span key={key} className="inline-flex items-center gap-1">
            <FlightTypeIcon type={key} className="w-3.5 h-3.5" />
            {labels.types[key]}
          </span>
        ))}
      </div>
    </div>
  );
}
