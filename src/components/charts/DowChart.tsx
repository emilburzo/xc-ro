"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const DOW_NAMES = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];

interface DowData {
  dow: number;
  flight_count: number;
}

// Monday-first order matching Romanian/European locale
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function DowChart({ data }: { data: DowData[] }) {
  const chartData = DOW_ORDER.map((i) => {
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
