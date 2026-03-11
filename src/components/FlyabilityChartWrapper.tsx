"use client";

import dynamic from "next/dynamic";

const FlyabilityChart = dynamic(() => import("./charts/FlyabilityChart"), { ssr: false });

interface FlyabilityData {
  month: number;
  avg_flyable_days: number;
}

interface FlyabilityChartWrapperProps {
  data: FlyabilityData[];
  daysLabel?: string;
}

export default function FlyabilityChartWrapper({ data, daysLabel }: FlyabilityChartWrapperProps) {
  return <FlyabilityChart data={data} daysLabel={daysLabel} />;
}
