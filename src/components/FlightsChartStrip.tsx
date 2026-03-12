"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import type { DistHistogramRow, TimelineRow, CategoryRow } from "@/lib/queries/flights";

const DistanceHistogram = dynamic(() => import("./charts/DistanceHistogram"), { ssr: false });
const TimelineBarChart = dynamic(() => import("./charts/TimelineBarChart"), { ssr: false });
const WingDonut = dynamic(() => import("./charts/WingDonut"), { ssr: false });

interface Props {
  distHistogram: DistHistogramRow[];
  timeline: TimelineRow[];
  categoryBreakdown: CategoryRow[];
}

function getMonthLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
  return Array.from({ length: 12 }, (_, i) =>
    formatter.format(new Date(2024, i, 1))
  );
}

export default function FlightsChartStrip({ distHistogram, timeline, categoryBreakdown }: Props) {
  const t = useTranslations("flights");
  const locale = useLocale();
  const [open, setOpen] = useState(true);

  const monthLabels = useMemo(() => getMonthLabels(locale), [locale]);

  const timelineData = useMemo(() => {
    if (timeline.length === 0) return [];
    const years = new Set(timeline.map((r) => r.year));
    if (years.size <= 2) {
      return timeline.map((r) => ({
        label: `${monthLabels[r.month - 1]} ${r.year}`,
        cnt: r.cnt,
      }));
    }
    const byYear = new Map<number, number>();
    for (const r of timeline) {
      byYear.set(r.year, (byYear.get(r.year) || 0) + r.cnt);
    }
    return Array.from(byYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, cnt]) => ({ label: String(year), cnt }));
  }, [timeline, monthLabels]);

  const hasData = distHistogram.length > 0 || timeline.length > 0 || categoryBreakdown.length > 0;
  if (!hasData) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="flights-chart-panel"
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>&#9654;</span>
        {open ? t("hideCharts") : t("showCharts")}
      </button>

      {open && (
        <div id="flights-chart-panel" className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-2">{t("distanceDistribution")}</h4>
            <DistanceHistogram data={distHistogram} />
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-2">{t("timeline")}</h4>
            <TimelineBarChart data={timelineData} barLabel={t("title")} />
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-2">{t("categoryBreakdown")}</h4>
            <WingDonut data={categoryBreakdown} />
          </div>
        </div>
      )}
    </div>
  );
}
