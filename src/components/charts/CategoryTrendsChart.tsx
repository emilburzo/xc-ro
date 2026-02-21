"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CAT_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
};

interface TrendRow {
  year: number;
  category: string;
  flight_count: number;
}

export default function CategoryTrendsChart({ data }: { data: TrendRow[] }) {
  const years = Array.from(new Set(data.map((d) => d.year))).sort();
  const chartData = years.map((year) => {
    const row: Record<string, number> = { year };
    for (const cat of ["A", "B", "C", "D"]) {
      const match = data.find((d) => d.year === year && d.category === cat);
      row[cat] = match?.flight_count || 0;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData}>
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="D" stackId="1" stroke={CAT_COLORS.D} fill={CAT_COLORS.D} fillOpacity={0.7} name="D" />
        <Area type="monotone" dataKey="C" stackId="1" stroke={CAT_COLORS.C} fill={CAT_COLORS.C} fillOpacity={0.7} name="C" />
        <Area type="monotone" dataKey="B" stackId="1" stroke={CAT_COLORS.B} fill={CAT_COLORS.B} fillOpacity={0.7} name="B" />
        <Area type="monotone" dataKey="A" stackId="1" stroke={CAT_COLORS.A} fill={CAT_COLORS.A} fillOpacity={0.7} name="A" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
