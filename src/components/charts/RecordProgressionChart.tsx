"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AnnualRecord {
  year: number;
  distance_km: number;
}

export default function RecordProgressionChart({ data }: { data: AnnualRecord[] }) {
  const chartData = data.map((d) => ({
    year: d.year,
    distance: Number(d.distance_km),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(val: any) => [`${Number(val).toFixed(1)} km`, "Record"]} />
        <Bar dataKey="distance" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Record km" />
      </BarChart>
    </ResponsiveContainer>
  );
}
