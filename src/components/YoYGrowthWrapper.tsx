"use client";

import dynamic from "next/dynamic";

const YoYGrowthChart = dynamic(() => import("./charts/YoYGrowthChart"), { ssr: false });

export default function YoYGrowthWrapper({ data }: { data: { year: number; flights: number; pilots: number; total_km: number }[] }) {
  return <YoYGrowthChart data={data} />;
}
