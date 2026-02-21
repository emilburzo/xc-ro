import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPilotByUsername,
  getPilotStats,
  getPilotFavoriteTakeoff,
  getPilotYearlyStats,
  getPilotSiteMap,
  getPilotEquipmentTimeline,
  getPilotActivityHeatmap,
  getPilotTopFlights,
  getPilotDistanceHistogram,
} from "@/lib/queries";
import { takeoffPath, formatDuration, formatDistance, formatDate } from "@/lib/utils";
import PilotDetailCharts from "@/components/PilotDetailCharts";

export const dynamic = "force-dynamic";

export default async function PilotDetailPage({ params }: { params: Promise<{ username: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("pilotDetail");
  const { username } = await params;
  const pilot = await getPilotByUsername(username);
  if (!pilot) notFound();

  const pilotId = (pilot as any).id;

  const [stats, favTakeoff, yearly, sites, equipment, heatmap, topFlights, distHist] =
    await Promise.all([
      getPilotStats(pilotId),
      getPilotFavoriteTakeoff(pilotId),
      getPilotYearlyStats(pilotId),
      getPilotSiteMap(pilotId),
      getPilotEquipmentTimeline(pilotId),
      getPilotActivityHeatmap(pilotId),
      getPilotTopFlights(pilotId),
      getPilotDistanceHistogram(pilotId),
    ]);

  const s = stats as any;
  const fav = favTakeoff as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/pilots" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          &larr; {t("backToPilots")}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{(pilot as any).name}</h1>
        <p className="text-sm text-gray-500">@{(pilot as any).username}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t("totalFlights"), value: s.total_flights },
          { label: t("totalKm"), value: `${Number(s.total_km).toLocaleString()} km` },
          { label: t("totalScore"), value: Number(s.total_score).toLocaleString() },
          { label: t("maxDistance"), value: `${Number(s.max_distance).toFixed(1)} km` },
          { label: t("avgDistance"), value: `${Number(s.avg_distance).toFixed(1)} km` },
          { label: t("activeSince"), value: s.active_since },
          {
            label: t("favoriteTakeoff"),
            value: fav ? fav.name : "-",
            link: fav ? takeoffPath(fav.id, fav.name) : undefined,
            sub: fav ? `${fav.cnt} ${t("flightsFromSite")}` : undefined,
          },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-lg font-bold text-blue-600">
              {c.link ? (
                <Link href={c.link} className="hover:underline">{c.value}</Link>
              ) : c.value}
            </div>
            <div className="text-xs text-gray-500">{c.label}</div>
            {c.sub && <div className="text-[10px] text-gray-400">{c.sub}</div>}
          </div>
        ))}
      </div>

      <PilotDetailCharts
        yearly={yearly as any}
        sites={sites as any}
        equipment={equipment as any}
        heatmap={heatmap as any}
        distHist={distHist as any}
      />

      {/* Top Flights Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">{t("topFlights")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("date")}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("takeoff")}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("glider")}</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{t("distance")}</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{t("score")}</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{t("airtime")}</th>
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
                    {f.takeoff_id ? (
                      <Link href={takeoffPath(f.takeoff_id, f.takeoff_name)} className="text-blue-600 hover:underline">
                        {f.takeoff_name}
                      </Link>
                    ) : "-"}
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
    </div>
  );
}
