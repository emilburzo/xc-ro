import { getTranslations } from "next-intl/server";
import { getWingsList, getWingCategoryTrends } from "@/lib/queries";
import WingsTable from "@/components/WingsTable";
import WingsCategoryTrends from "@/components/WingsCategoryTrends";

export const revalidate = 0;

export default async function WingsPage() {
  const t = await getTranslations("wings");
  const [wings, categoryTrends] = await Promise.all([
    getWingsList(),
    getWingCategoryTrends(),
  ]);

  const tableData = (wings as any[]).map((w) => ({
    id: w.id,
    name: w.name,
    category: w.category,
    flight_count: w.flight_count,
    pilot_count: w.pilot_count,
    total_km: w.total_km != null ? Number(w.total_km) : 0,
    avg_distance: w.avg_distance != null ? Number(w.avg_distance) : 0,
    max_distance: w.max_distance != null ? Number(w.max_distance) : 0,
    avg_speed: w.avg_speed != null ? Number(w.avg_speed) : null,
    first_year: w.first_year,
    last_year: w.last_year,
    last_flight: w.last_flight,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

      <WingsCategoryTrends data={categoryTrends as any[]} />

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <WingsTable wings={tableData} />
      </div>
    </div>
  );
}
