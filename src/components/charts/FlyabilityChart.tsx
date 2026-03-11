"use client";

import { XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, BarChart } from "recharts";

const MONTH_NAMES = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface FlyabilityData {
  month: number;
  avg_flyable_days: number;
}

export default function FlyabilityChart({ data }: { data: FlyabilityData[] }) {
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const d = data.find((x) => Number(x.month) === i + 1);
    return {
      name: MONTH_NAMES[i],
      avg: d ? Number(d.avg_flyable_days) : 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(val: any) => [`${val} days`]}
        />
        <Bar dataKey="avg" fill="#3b82f6" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
