"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";

interface DowData {
  dow: number;
  flight_count: number;
}

export default function DowChart({ data }: { data: DowData[] }) {
  const t = useTranslations("charts");
  const DOW_NAMES = [t("dowSun"), t("dowMon"), t("dowTue"), t("dowWed"), t("dowThu"), t("dowFri"), t("dowSat")];
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = data.find((x) => x.dow === i);
    return { day: DOW_NAMES[i], flights: d?.flight_count || 0 };
  });

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={chartData}>
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="flights" fill="#06b6d4" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
