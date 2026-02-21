"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AdoptionData {
  year: number;
  pilot_count: number;
}

export default function AdoptionChart({ data }: { data: AdoptionData[] }) {
  const chartData = data.map((d) => ({
    year: d.year,
    pilots: d.pilot_count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="pilots" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Pilots" />
      </LineChart>
    </ResponsiveContainer>
  );
}
