"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const CategoryTrendsChart = dynamic(() => import("./charts/CategoryTrendsChart"), { ssr: false });

interface Props {
  data: Array<{ year: number; category: string; flight_count: number }>;
}

export default function WingsCategoryTrends({ data }: Props) {
  const t = useTranslations("wings");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("categoryTrends")}</h2>
      <p className="text-sm text-gray-500 mb-3">{t("categoryTrendsDesc")}</p>
      <CategoryTrendsChart data={data} />
    </div>
  );
}
