import { getTranslations } from "next-intl/server";
import { getPilotsList } from "@/lib/queries";
import PilotsTable from "@/components/PilotsTable";

export const dynamic = "force-dynamic";

export default async function PilotsPage() {
  const t = await getTranslations("pilots");
  const pilots = await getPilotsList();

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
    fav_takeoff_id: p.fav_takeoff_id,
    fav_takeoff_name: p.fav_takeoff_name,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <PilotsTable pilots={tableData} />
      </div>
    </div>
  );
}
