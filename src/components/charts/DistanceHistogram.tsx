"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTranslations } from "next-intl";

const BUCKET_COLORS: Record<string, string> = {
  "0-1": "#d1d5db",
  "1-5": "#93c5fd",
  "5-20": "#60a5fa",
  "20-50": "#3b82f6",
  "50-100": "#2563eb",
  "100+": "#1d4ed8",
};

interface HistogramData {
  bucket: string;
  cnt: number;
}

export default function DistanceHistogram({ data }: { data: HistogramData[] }) {
  const t = useTranslations("charts");
  const total = data.reduce((s, d) => s + d.cnt, 0);
  const chartData = data.map((d) => ({
    bucket: d.bucket + " km",
    count: d.cnt,
    pct: total > 0 ? Math.round((d.cnt / total) * 100) : 0,
    rawBucket: d.bucket,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData}>
        <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(val: any, _name: any, props: any) => [`${val} (${props.payload.pct}%)`, t("flights")]} />
        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={BUCKET_COLORS[d.rawBucket] || "#3b82f6"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
