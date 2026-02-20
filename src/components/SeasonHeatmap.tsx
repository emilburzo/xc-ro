"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

interface HeatmapData {
  year: number;
  month: number;
  flight_count: number;
  avg_score: number;
}

const MONTH_LABELS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function getColor(value: number, max: number): string {
  if (value === 0) return "#f3f4f6";
  const intensity = Math.min(value / max, 1);
  if (intensity < 0.25) return "#dbeafe";
  if (intensity < 0.5) return "#93c5fd";
  if (intensity < 0.75) return "#3b82f6";
  return "#1d4ed8";
}

export default function SeasonHeatmap({ data }: { data: HeatmapData[] }) {
  const t = useTranslations("home");
  const [mode, setMode] = useState<"flights" | "score">("flights");

  const years = Array.from(new Set(data.map((d) => d.year))).sort();
  const maxVal = Math.max(
    ...data.map((d) => (mode === "flights" ? d.flight_count : Number(d.avg_score) || 0))
  );

  const lookup = new Map<string, HeatmapData>();
  data.forEach((d) => lookup.set(`${d.year}-${d.month}`, d));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{t("seasonOverview")}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setMode("flights")}
            className={`px-2 py-1 text-xs rounded ${mode === "flights" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
          >
            {t("flightCount")}
          </button>
          <button
            onClick={() => setMode("score")}
            className={`px-2 py-1 text-xs rounded ${mode === "score" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
          >
            {t("avgScore")}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-0.5 mb-1 ml-12">
            {MONTH_LABELS.map((m) => (
              <div key={m} className="w-8 text-center text-xs text-gray-500">{m}</div>
            ))}
          </div>
          {years.map((year) => (
            <div key={year} className="flex gap-0.5 items-center">
              <div className="w-12 text-xs text-gray-500 text-right pr-2">{year}</div>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const cell = lookup.get(`${year}-${month}`);
                const value = cell
                  ? mode === "flights" ? cell.flight_count : Number(cell.avg_score) || 0
                  : 0;
                return (
                  <div
                    key={month}
                    className="w-8 h-6 rounded-sm cursor-default"
                    style={{ backgroundColor: getColor(value, maxVal) }}
                    title={`${year}/${String(month).padStart(2, "0")}: ${value} ${mode === "flights" ? "flights" : "avg score"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
