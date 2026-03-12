"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface GrowthData {
  year: number;
  flights: number;
  pilots: number;
  total_km: number;
}

interface GrowthLabels {
  flights: string;
  pilots: string;
  totalKm: string;
}

export default function YoYGrowthChart({ data, labels }: { data: GrowthData[]; labels: GrowthLabels }) {
  const chartData = data.map((d) => ({
    year: d.year,
    flights: d.flights,
    pilots: d.pilots,
    totalKm: Number(d.total_km),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData}>
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="flights" fill="#3b82f6" radius={[2, 2, 0, 0]} name={labels.flights} />
        <Bar yAxisId="left" dataKey="pilots" fill="#10b981" radius={[2, 2, 0, 0]} name={labels.pilots} />
        <Line yAxisId="right" type="monotone" dataKey="totalKm" stroke="#f59e0b" strokeWidth={2} dot={false} name={labels.totalKm} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
