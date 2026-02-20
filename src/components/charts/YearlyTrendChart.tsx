"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface YearlyData {
  year: number;
  flight_count: number;
  total_km: number;
}

export default function YearlyTrendChart({ data }: { data: YearlyData[] }) {
  const chartData = data.map((d) => ({
    year: d.year,
    flights: d.flight_count,
    totalKm: Number(d.total_km),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData}>
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar yAxisId="left" dataKey="flights" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Flights" />
        <Line yAxisId="right" type="monotone" dataKey="totalKm" stroke="#f59e0b" strokeWidth={2} dot={false} name="Total km" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
