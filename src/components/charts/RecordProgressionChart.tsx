"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AnnualRecord {
  year: number;
  distance_km: number;
  pilot_name: string;
}

interface ChartPoint {
  year: number;
  record: number;
  isNewRecord: boolean;
  pilot_name: string;
}

function computeRunningMax(data: AnnualRecord[]): ChartPoint[] {
  const sorted = [...data].sort((a, b) => a.year - b.year);
  let max = 0;
  return sorted.map((d) => {
    const isNewRecord = d.distance_km > max;
    if (isNewRecord) max = d.distance_km;
    return {
      year: d.year,
      record: max,
      isNewRecord,
      pilot_name: d.pilot_name,
    };
  });
}

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (!payload.isNewRecord) return null;
  return <circle cx={cx} cy={cy} r={4} fill="#2563eb" stroke="#fff" strokeWidth={2} />;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as ChartPoint;
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 shadow text-sm">
      <div className="font-semibold">{d.year}</div>
      <div className="text-blue-600">{d.record.toFixed(1)} km</div>
      {d.isNewRecord && <div className="text-gray-500">{d.pilot_name}</div>}
    </div>
  );
}

export default function RecordProgressionChart({ data }: { data: AnnualRecord[] }) {
  const chartData = useMemo(() => computeRunningMax(data), [data]);

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData}>
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" km" />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="stepAfter"
          dataKey="record"
          stroke="#2563eb"
          fill="#dbeafe"
          strokeWidth={2}
          dot={<CustomDot />}
          activeDot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
