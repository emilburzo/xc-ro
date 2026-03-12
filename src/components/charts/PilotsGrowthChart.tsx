"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface GrowthData {
  year: number;
  active_pilots: number;
  new_pilots: number;
  cumulative_pilots: number;
}

interface Props {
  data: GrowthData[];
  activePilotsLabel?: string;
  newPilotsLabel?: string;
  cumulativePilotsLabel?: string;
}

export default function PilotsGrowthChart({
  data,
  activePilotsLabel = "Active Pilots",
  newPilotsLabel = "New Pilots",
  cumulativePilotsLabel = "Total Pilots",
}: Props) {
  const chartData = data.map((d) => ({
    year: d.year,
    activePilots: Number(d.active_pilots),
    newPilots: Number(d.new_pilots),
    cumulativePilots: Number(d.cumulative_pilots),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData}>
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="activePilots" fill="#3b82f6" radius={[2, 2, 0, 0]} name={activePilotsLabel} isAnimationActive={false} />
        <Bar yAxisId="left" dataKey="newPilots" fill="#22c55e" radius={[2, 2, 0, 0]} name={newPilotsLabel} isAnimationActive={false} />
        <Line yAxisId="right" type="monotone" dataKey="cumulativePilots" stroke="#f59e0b" strokeWidth={2} dot={false} name={cumulativePilotsLabel} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
