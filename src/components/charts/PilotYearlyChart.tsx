"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";

interface YearlyData {
  year: number;
  flight_count: number;
  avg_distance: number;
  max_distance: number;
}

export default function PilotYearlyChart({ data }: { data: YearlyData[] }) {
  const t = useTranslations("charts");
  const chartData = data.map((d) => ({
    year: d.year,
    flights: d.flight_count,
    avgDist: Number(d.avg_distance),
    maxDist: Number(d.max_distance),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData}>
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar yAxisId="left" dataKey="flights" fill="#3b82f6" radius={[2, 2, 0, 0]} name={t("flights")} />
        <Line yAxisId="right" type="monotone" dataKey="avgDist" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} name={t("avgKm")} />
        <Line yAxisId="right" type="monotone" dataKey="maxDist" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name={t("maxKm")} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
