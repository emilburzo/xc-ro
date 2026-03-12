"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DistanceTrendData {
  year: number;
  avg_distance: number;
}

export default function DistanceTrendChart({ data }: { data: DistanceTrendData[] }) {
  const chartData = data.map((d) => ({
    year: d.year,
    avgKm: Number(d.avg_distance),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" km" />
        <Tooltip formatter={(val: any, _name: any, _props: any) => [`${val} km`, "Avg distance"]} />
        <Line type="monotone" dataKey="avgKm" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Avg km" isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
