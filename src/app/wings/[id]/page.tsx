import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getWingById,
  getWingTopFlights,
  getWingDistanceHistogram,
  getWingAdoptionCurve,
  getWingYearlyStats,
  getWingFavoriteTakeoffs,
  getWingCalendarHeatmap,
} from "@/lib/queries";
import { pilotPath, takeoffPath, formatDuration, formatDistance, formatNumber, formatDate } from "@/lib/utils";
import WingDetailCharts from "@/components/WingDetailCharts";

export const dynamic = "force-dynamic";

const CAT_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-red-100 text-red-800",
  Z: "bg-purple-100 text-purple-800",
  T: "bg-pink-100 text-pink-800",
  HG: "bg-orange-100 text-orange-800",
  RW2: "bg-gray-100 text-gray-800",
  RW5: "bg-gray-100 text-gray-800",
};

export default async function WingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("wingDetail");
  const { id: rawId } = await params;
  const id = parseInt(rawId.split("-")[0]);
  if (isNaN(id)) notFound();

  const wing = await getWingById(id);
  if (!wing) notFound();

  const [topFlights, distHist, adoption, yearly, favoriteTakeoffs, calendar] =
    await Promise.all([
      getWingTopFlights(id),
      getWingDistanceHistogram(id),
      getWingAdoptionCurve(id),
      getWingYearlyStats(id),
      getWingFavoriteTakeoffs(id),
      getWingCalendarHeatmap(id),
    ]);

  const totalFlights = (yearly as any[]).reduce((s: number, y: any) => s + y.flight_count, 0);
  const totalKm = (yearly as any[]).reduce((s: number, y: any) => s + Number(y.total_km || 0), 0);
  const pilotCount = (adoption as any[]).reduce((max: number, y: any) => Math.max(max, y.pilot_count), 0);
  const xcPotential = topFlights.length > 0
    ? (topFlights as any[]).reduce((s: number, f: any) => s + Number(f.distance_km), 0) / topFlights.length
    : 0;
  const maxDistance = topFlights.length > 0 ? Number((topFlights as any[])[0].distance_km) : 0;
  const firstYear = (adoption as any[]).length > 0 ? (adoption as any[])[0].year : null;
  const lastYear = (adoption as any[]).length > 0 ? (adoption as any[])[(adoption as any[]).length - 1].year : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/wings" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          &larr; {t("backToWings")}
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{(wing as any).name}</h1>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${CAT_COLORS[(wing as any).category] || "bg-gray-100 text-gray-800"}`}>
            {(wing as any).category}
          </span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatNumber(totalFlights)}</div>
          <div className="text-xs text-gray-500">{t("totalFlights")}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{pilotCount}</div>
          <div className="text-xs text-gray-500">{t("pilotsCount")}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatNumber(Math.round(totalKm))}</div>
          <div className="text-xs text-gray-500">{t("totalKm")}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatDistance(xcPotential)}</div>
          <div className="text-xs text-gray-500">{t("xcPotential")} (km)</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatDistance(maxDistance)}</div>
          <div className="text-xs text-gray-500">{t("maxDistance")} (km)</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{firstYear || "-"}</div>
          <div className="text-xs text-gray-500">{t("activeSince")}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{lastYear || "-"}</div>
          <div className="text-xs text-gray-500">{t("lastFlight")}</div>
        </div>
      </div>

      <WingDetailCharts
        calendar={calendar as any}
        adoption={adoption as any}
        yearly={yearly as any}
        distHist={distHist as any}
        favoriteTakeoffs={favoriteTakeoffs as any}
      />

      {/* Top 10 Flights */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">{t("topFlights")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("date")}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("pilot")}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("takeoff")}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("distance")}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("score")}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("airtime")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(topFlights as any[]).map((f, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-2 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-2 py-2 text-gray-700 whitespace-nowrap">
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {formatDate(f.start_time, locale)}
                    </a>
                  </td>
                  <td className="px-2 py-2">
                    <Link href={pilotPath(f.pilot_username)} className="text-blue-600 hover:underline">
                      {f.pilot_name}
                    </Link>
                  </td>
                  <td className="px-2 py-2">
                    {f.takeoff_id ? (
                      <Link href={takeoffPath(f.takeoff_id, f.takeoff_name)} className="text-blue-600 hover:underline">
                        {f.takeoff_name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2 font-medium">{formatDistance(f.distance_km)} km</td>
                  <td className="px-2 py-2 text-gray-700">{Number(f.score).toFixed(1)}</td>
                  <td className="px-2 py-2 text-gray-500">{formatDuration(f.airtime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
