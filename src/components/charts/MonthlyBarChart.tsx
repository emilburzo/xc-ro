"use client";

import { XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, Bar } from "recharts";

const MONTH_NAMES = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthlyData {
  month: number;
  flight_count: number;
  avg_distance: number;
}

export default function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const d = data.find((x) => x.month === i + 1);
    return {
      name: MONTH_NAMES[i],
      flights: d?.flight_count || 0,
      avgDist: d ? Number(d.avg_distance) : 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar yAxisId="left" dataKey="flights" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Flights" />
        <Line yAxisId="right" type="monotone" dataKey="avgDist" stroke="#f59e0b" strokeWidth={2} dot={false} name="Avg km" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
