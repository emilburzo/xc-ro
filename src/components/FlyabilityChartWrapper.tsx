"use client";

import dynamic from "next/dynamic";

const FlyabilityChart = dynamic(() => import("./charts/FlyabilityChart"), { ssr: false });

interface FlyabilityData {
  month: number;
  avg_flyable_days: number;
}

export default function FlyabilityChartWrapper({ data }: { data: FlyabilityData[] }) {
  return <FlyabilityChart data={data} />;
}
