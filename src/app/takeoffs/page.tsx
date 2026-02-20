import { getTranslations } from "next-intl/server";
import { getTakeoffsList } from "@/lib/queries";
import TakeoffsTable from "@/components/TakeoffsTable";

export const revalidate = 0;

export default async function TakeoffsPage() {
  const t = await getTranslations("takeoffs");
  const takeoffs = await getTakeoffsList();

  const mapData = (takeoffs as any[]).map((tk) => ({
    id: tk.id,
    name: tk.name,
    lat: Number(tk.lat),
    lng: Number(tk.lng),
    flight_count: tk.flight_count,
    last_activity: tk.last_activity,
  }));

  const tableData = (takeoffs as any[]).map((tk) => ({
    id: tk.id,
    name: tk.name,
    flight_count: tk.flight_count,
    pilot_count: tk.pilot_count,
    xc_potential: tk.xc_potential ? Number(tk.xc_potential) : null,
    record_km: tk.record_km ? Number(tk.record_km) : null,
    last_activity: tk.last_activity,
    weekend_pct: tk.weekend_pct != null ? Number(tk.weekend_pct) : null,
    flights_100k: tk.flights_100k ? Number(tk.flights_100k) : null,
    avg_distance: tk.avg_distance ? Number(tk.avg_distance) : null,
    ab_pct: tk.ab_pct != null ? Number(tk.ab_pct) : null,
    monthly_data: tk.monthly_data,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <TakeoffsTable takeoffs={tableData} mapData={mapData} />
      </div>
    </div>
  );
}
