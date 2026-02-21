"use client";

import { XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, Bar } from "recharts";
import { useTranslations } from "next-intl";

interface MonthlyData {
  month: number;
  flight_count: number;
  avg_distance: number;
}

export default function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  const t = useTranslations("charts");
  const MONTH_NAMES = [t("monthJan"), t("monthFeb"), t("monthMar"), t("monthApr"), t("monthMay"), t("monthJun"), t("monthJul"), t("monthAug"), t("monthSep"), t("monthOct"), t("monthNov"), t("monthDec")];
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
        <Bar yAxisId="left" dataKey="flights" fill="#3b82f6" radius={[2, 2, 0, 0]} name={t("flights")} />
        <Line yAxisId="right" type="monotone" dataKey="avgDist" stroke="#f59e0b" strokeWidth={2} dot={false} name={t("avgKm")} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
