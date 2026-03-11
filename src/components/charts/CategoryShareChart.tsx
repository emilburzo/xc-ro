"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CAT_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
  Z: "#8b5cf6",
  T: "#ec4899",
};

const CATEGORIES = ["A", "B", "C", "D", "Z", "T"];

interface RawRow {
  year: number;
  category: string;
  flight_count: number;
}

interface Props {
  data: RawRow[];
}

export default function CategoryShareChart({ data }: Props) {
  // Pivot to { year, A: pct, B: pct, ... } and keep counts for tooltip
  const byYear = new Map<number, Record<string, number>>();
  for (const row of data) {
    if (!byYear.has(row.year)) byYear.set(row.year, {});
    byYear.get(row.year)![row.category] = row.flight_count;
  }

  const chartData = Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, counts]) => {
      const total = Object.values(counts).reduce((s, v) => s + v, 0);
      const entry: Record<string, number> = { year };
      for (const cat of CATEGORIES) {
        const count = counts[cat] || 0;
        entry[cat] = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
        entry[`${cat}_count`] = count;
      }
      return entry;
    });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <XAxis dataKey="year" />
        <YAxis tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
        <Tooltip
          formatter={(val: any, name: any, props: any) => {
            const count = props.payload[`${name}_count`] || 0;
            return [`${val}% (${count})`, name];
          }}
          labelFormatter={(label: any) => `${label}`}
        />
        <Legend />
        {CATEGORIES.map((cat) => (
          <Area
            key={cat}
            type="monotone"
            dataKey={cat}
            stackId="1"
            fill={CAT_COLORS[cat] || "#6b7280"}
            stroke={CAT_COLORS[cat] || "#6b7280"}
            name={cat}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
