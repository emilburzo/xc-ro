import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getTakeoffById,
  getTakeoffCalendarHeatmap,
  getTakeoffMonthlyStats,
  getTakeoffHourlyDistribution,
  getTakeoffDayOfWeek,
  getTakeoffDistanceHistogram,
  getTakeoffTop10,
  getTakeoffWingClasses,
  getTakeoffTopGliders,
  getTakeoffYearlyTrend,
  getTakeoffBusiestDays,
} from "@/lib/queries";
import { pilotPath, formatDuration, formatDistance, formatDate } from "@/lib/utils";
import TakeoffDetailCharts from "@/components/TakeoffDetailCharts";

export const dynamic = "force-dynamic";

export default async function TakeoffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("takeoffDetail");
  const { id: rawId } = await params;
  const id = parseInt(rawId.split("-")[0]);
  if (isNaN(id)) notFound();

  const takeoff = await getTakeoffById(id);
  if (!takeoff) notFound();

  const [calendar, monthly, hourly, dow, distHist, top10, wingClasses, topGliders, yearly, busiest] =
    await Promise.all([
      getTakeoffCalendarHeatmap(id),
      getTakeoffMonthlyStats(id),
      getTakeoffHourlyDistribution(id),
      getTakeoffDayOfWeek(id),
      getTakeoffDistanceHistogram(id),
      getTakeoffTop10(id),
      getTakeoffWingClasses(id),
      getTakeoffTopGliders(id),
      getTakeoffYearlyTrend(id),
      getTakeoffBusiestDays(id),
    ]);

  const totalFlights = (yearly as any[]).reduce((s: number, y: any) => s + y.flight_count, 0);
  const xcPotential = top10.length > 0
    ? (top10 as any[]).reduce((s: number, f: any) => s + Number(f.distance_km), 0) / top10.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/takeoffs" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          &larr; {t("viewOnXContest")}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{(takeoff as any).name}</h1>
        <div className="flex gap-3 text-sm text-gray-500 mt-1">
          <span>{Number((takeoff as any).lat).toFixed(4)}, {Number((takeoff as any).lng).toFixed(4)}</span>
          <a
            href={`https://www.google.com/maps?q=${(takeoff as any).lat},${(takeoff as any).lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {t("openInMaps")}
          </a>
        </div>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="font-medium">{totalFlights} {t("pilotsCount")}</span>
        </div>
      </div>

      <TakeoffDetailCharts
        calendar={calendar as any}
        monthly={monthly as any}
        hourly={hourly as any}
        dow={dow as any}
        distHist={distHist as any}
        wingClasses={wingClasses as any}
        topGliders={topGliders as any}
        yearly={yearly as any}
        xcPotential={xcPotential}
      />

      {/* Top 10 Leaderboard */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">{t("top10")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("date")}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("pilot")}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("glider")}</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{t("distance")}</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{t("score")}</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{t("airtime")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(top10 as any[]).map((f, i) => (
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
                  <td className="px-2 py-2 text-gray-700">
                    {f.glider_name}
                    <span className="ml-1 px-1 py-0.5 bg-gray-100 rounded text-[10px]">{f.glider_category}</span>
                  </td>
                  <td className="px-2 py-2 font-medium text-right">{formatDistance(f.distance_km)} km</td>
                  <td className="px-2 py-2 text-gray-700 text-right">{Number(f.score).toFixed(1)}</td>
                  <td className="px-2 py-2 text-gray-500 text-right">{formatDuration(f.airtime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Busiest Days */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">{t("busiestDays")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("date")}</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{t("pilotsCount")}</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">Flights</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">Max km</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(busiest as any[]).map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-2 py-2 text-gray-700">{formatDate(d.day, locale)}</td>
                  <td className="px-2 py-2 text-gray-700 text-right">{d.pilot_count}</td>
                  <td className="px-2 py-2 text-gray-700 text-right">{d.flight_count}</td>
                  <td className="px-2 py-2 font-medium text-right">{Number(d.max_distance).toFixed(1)} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
