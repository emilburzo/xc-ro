"use client";

import dynamic from "next/dynamic";

const YoYGrowthChart = dynamic(() => import("./charts/YoYGrowthChart"), { ssr: false });

interface Props {
  data: { year: number; flights: number; pilots: number; total_km: number }[];
  labels: { flights: string; pilots: string; totalKm: string };
}

export default function YoYGrowthWrapper({ data, labels }: Props) {
  return <YoYGrowthChart data={data} labels={labels} />;
}
