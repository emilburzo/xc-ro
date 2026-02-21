"use client";

import dynamic from "next/dynamic";

const RecordProgressionChart = dynamic(() => import("./charts/RecordProgressionChart"), { ssr: false });

interface Props {
  data: { year: number; distance_km: number }[];
}

export default function RecordProgressionWrapper({ data }: Props) {
  return <RecordProgressionChart data={data} />;
}
