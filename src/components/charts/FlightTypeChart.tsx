"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const TYPE_COLORS: Record<string, string> = {
  "free flight": "#3b82f6",
  "FAI triangle": "#f59e0b",
  "flat triangle": "#22c55e",
};

interface FlightTypeData {
  flight_type: string;
  cnt: number;
}

export default function FlightTypeChart({ data }: { data: FlightTypeData[] }) {
  const total = data.reduce((s, d) => s + d.cnt, 0);
  const chartData = data.map((d) => ({
    name: d.flight_type,
    value: d.cnt,
    pct: total > 0 ? Math.round((d.cnt / total) * 100) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((d, i) => (
            <Cell key={i} fill={TYPE_COLORS[d.name] || "#6b7280"} />
          ))}
        </Pie>
        <Tooltip formatter={(val: any, name: any, props: any) => [`${val} (${props.payload.pct}%)`, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
