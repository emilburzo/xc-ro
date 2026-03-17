import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCachedPilotsList, getCachedPilotsYearlyGrowth } from "@/lib/queries/pilots";
import PilotsTable from "@/components/PilotsTable";
import PilotsGrowthWrapper from "@/components/PilotsGrowthWrapper";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pilots");
  const ts = await getTranslations("seo");
  return {
    title: t("title"),
    description: ts("pilotsDescription"),
    alternates: { canonical: "/pilots" },
  };
}

export default async function PilotsPage() {
  const t = await getTranslations("pilots");
  const [pilots, growthData] = await Promise.all([
    getCachedPilotsList(),
    getCachedPilotsYearlyGrowth(),
  ]);

  const tableData = (pilots as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    username: p.username,
    flight_count: p.flight_count,
    total_km: Number(p.total_km),
    total_score: Number(p.total_score),
    avg_distance: Number(p.avg_distance),
    max_distance: Number(p.max_distance),
    active_years: p.active_years,
    last_flight: p.last_flight,
    total_hours: Number(p.total_hours) || 0,
    fav_takeoff_id: p.fav_takeoff_id,
    fav_takeoff_name: p.fav_takeoff_name,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{t("communityGrowth")}</h3>
        <p className="text-xs text-gray-500 mb-3">{t("communityGrowthDesc")}</p>
        <PilotsGrowthWrapper
          data={growthData as any}
          activePilotsLabel={t("activePilots")}
          newPilotsLabel={t("newPilots")}
          cumulativePilotsLabel={t("cumulativePilots")}
        />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <PilotsTable pilots={tableData} />
      </div>
    </div>
  );
}
