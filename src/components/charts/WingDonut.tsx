"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CAT_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
  Z: "#8b5cf6",
  HG: "#06b6d4",
  T: "#ec4899",
  RW5: "#6b7280",
  RW2: "#9ca3af",
};

interface WingData {
  category: string;
  cnt: number;
}

export default function WingDonut({ data }: { data: WingData[] }) {
  const total = data.reduce((s, d) => s + d.cnt, 0);
  const chartData = data.map((d) => ({
    name: d.category,
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
            <Cell key={i} fill={CAT_COLORS[d.name] || "#6b7280"} />
          ))}
        </Pie>
        <Tooltip formatter={(val: any, name: any, props: any) => [`${val} (${props.payload.pct}%)`, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
