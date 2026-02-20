"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface HourlyData {
  hour: number;
  flight_count: number;
}

export default function HourlyChart({ data }: { data: HourlyData[] }) {
  const chartData = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 6;
    const d = data.find((x) => x.hour === hour);
    return { hour: `${hour}:00`, flights: d?.flight_count || 0 };
  });

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData}>
        <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="flights" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
