"use client";

import dynamic from "next/dynamic";

const RecordProgressionChart = dynamic(() => import("./charts/RecordProgressionChart"), { ssr: false });

export default function RecordProgressionWrapper({ data }: { data: { year: number; distance_km: number; pilot_name: string }[] }) {
  return <RecordProgressionChart data={data} />;
}
