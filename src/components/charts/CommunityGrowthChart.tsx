"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface GrowthData {
  year: number;
  new_pilots: number;
  cumulative_pilots: number;
  flight_count: number;
}

interface Props {
  data: GrowthData[];
  newPilotsLabel?: string;
  cumulativePilotsLabel?: string;
  flightsLabel?: string;
}

export default function CommunityGrowthChart({
  data,
  newPilotsLabel = "New Pilots",
  cumulativePilotsLabel = "Total Pilots",
  flightsLabel = "Flights",
}: Props) {
  const chartData = data.map((d) => ({
    year: d.year,
    newPilots: Number(d.new_pilots),
    cumulativePilots: Number(d.cumulative_pilots),
    flights: Number(d.flight_count),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData}>
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="newPilots" fill="#22c55e" radius={[2, 2, 0, 0]} name={newPilotsLabel} />
        <Line yAxisId="left" type="monotone" dataKey="cumulativePilots" stroke="#f59e0b" strokeWidth={2} dot={false} name={cumulativePilotsLabel} />
        <Line yAxisId="right" type="monotone" dataKey="flights" stroke="#3b82f6" strokeWidth={2} dot={false} name={flightsLabel} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
