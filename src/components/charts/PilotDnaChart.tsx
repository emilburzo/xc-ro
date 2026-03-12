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

export interface DnaLabels {
  distance: string;
  consistency: string;
  volume: string;
  diversity: string;
  triangle: string;
  unitKm: string;
  unitYrs: string;
  unitFlights: string;
  unitSites: string;
}

const AXES = [
  { key: "pct_distance", labelKey: "distance" as const, rawKey: "max_distance", unitKey: "unitKm" as const },
  { key: "pct_consistency", labelKey: "consistency" as const, rawKey: "active_years", unitKey: "unitYrs" as const },
  { key: "pct_volume", labelKey: "volume" as const, rawKey: "flight_count", unitKey: "unitFlights" as const },
  { key: "pct_diversity", labelKey: "diversity" as const, rawKey: "unique_sites", unitKey: "unitSites" as const },
  { key: "pct_triangle", labelKey: "triangle" as const, rawKey: "triangle_pct", unitKey: null },
] as const;

export default function PilotDnaChart({ data, labels }: { data: DnaData; labels: DnaLabels }) {
  const chartData = AXES.map((a) => ({
    axis: labels[a.labelKey],
    value: Number(data[a.key]),
    raw: Number(data[a.rawKey]),
    unit: a.unitKey ? labels[a.unitKey] : "%",
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
          isAnimationActive={false}
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
