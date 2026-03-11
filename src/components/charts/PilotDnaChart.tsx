"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DnaData {
  max_distance: number;
  active_years: number;
  flight_count: number;
  unique_sites: number;
  triangle_pct: number;
  pct_distance: number;
  pct_consistency: number;
  pct_volume: number;
  pct_diversity: number;
  pct_triangle: number;
}

const AXES = [
  { key: "pct_distance", label: "XC Distance", rawKey: "max_distance", unit: " km" },
  { key: "pct_consistency", label: "Consistency", rawKey: "active_years", unit: " yrs" },
  { key: "pct_volume", label: "Volume", rawKey: "flight_count", unit: " flights" },
  { key: "pct_diversity", label: "Diversity", rawKey: "unique_sites", unit: " sites" },
  { key: "pct_triangle", label: "Triangle %", rawKey: "triangle_pct", unit: "%" },
] as const;

export default function PilotDnaChart({ data }: { data: DnaData }) {
  const chartData = AXES.map((a) => ({
    axis: a.label,
    value: Number(data[a.key]),
    raw: Number(data[a.rawKey]),
    unit: a.unit,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
        <Radar
          dataKey="value"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.25}
        />
        <Tooltip
          formatter={(val: any, _name: any, props: any) => {
            const pct = Math.round(Number(val) * 100);
            const raw = props.payload.raw;
            const unit = props.payload.unit;
            return [`${pct}th pct (${raw}${unit})`, props.payload.axis];
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
