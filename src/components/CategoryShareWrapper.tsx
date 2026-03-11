"use client";

import dynamic from "next/dynamic";

const CategoryShareChart = dynamic(
  () => import("./charts/CategoryShareChart"),
  { ssr: false }
);

interface RawRow {
  year: number;
  category: string;
  flight_count: number;
}

export default function CategoryShareWrapper({ data }: { data: RawRow[] }) {
  return <CategoryShareChart data={data} />;
}
