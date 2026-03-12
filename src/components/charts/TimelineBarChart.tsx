"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface TimelineData {
  label: string;
  cnt: number;
}

export default function TimelineBarChart({ data }: { data: TimelineData[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="cnt" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Flights" />
      </BarChart>
    </ResponsiveContainer>
  );
}
