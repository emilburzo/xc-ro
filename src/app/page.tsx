import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import {
  getHomeStats,
  getRecentNotableFlights,
  getSeasonHeatmap,
  getTopTakeoffs,
  getTopPilots,
} from "@/lib/queries/home";
import {takeoffPath, pilotPath, formatDuration, formatDistance, formatNumber, formatDate} from "@/lib/utils";
import SeasonHeatmap from "@/components/SeasonHeatmap";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  const [stats, recentFlights, heatmapData, topTakeoffs, topPilots] = await Promise.all([
    getHomeStats(),
    getRecentNotableFlights(),
    getSeasonHeatmap(),
    getTopTakeoffs(10),
    getTopPilots(10),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 text-sm">{t("subtitle")}</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t("totalFlights"), value: Number(stats.total_flights).toLocaleString(), href: "/flights" },
          { label: t("totalPilots"), value: Number(stats.total_pilots).toLocaleString(), href: "/pilots" },
          { label: t("activeTakeoffs"), value: Number(stats.active_takeoffs).toLocaleString(), href: "/takeoffs" },
          { label: t("totalDistance"), value: `${Number(stats.total_distance).toLocaleString()} km`, href: null },
        ].map((s) => {
          const content = (
            <>
              <div className="text-2xl font-bold text-blue-600">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
              {content}
            </Link>
          ) : (
            <div key={s.label} className="bg-white rounded-lg p-4 border border-gray-200">
              {content}
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{t("recentActivity")}</h3>
        <p className="text-xs text-gray-500 mb-3">{t("recentDesc")}</p>
        {recentFlights.length === 0 ? (
          <p className="text-gray-400 text-sm">{t("noRecentFlights")}</p>
        ) : (
          <div className="space-y-2">
            {recentFlights.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={pilotPath(f.pilot_username)} className="font-medium text-blue-600 hover:underline text-sm">
                      {f.pilot_name}
                    </Link>
                    <span className="text-gray-400 text-xs">
                      {f.takeoff_name && (
                        <Link href={takeoffPath(f.takeoff_id, f.takeoff_name)} className="hover:underline">
                          {f.takeoff_name}
                        </Link>
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(f.start_time, locale)} &middot; {f.glider_name}
                    <span className="ml-1 px-1 py-0.5 bg-gray-100 rounded text-[10px]">{f.glider_category}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-bold text-sm">{formatDistance(f.distance_km)} km</div>
                  <div className="text-xs text-gray-400">{formatDuration(f.airtime)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Season Heatmap */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SeasonHeatmap data={heatmapData as any} />
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{t("topTakeoffs")}</h3>
            <Link href="/takeoffs" className="text-sm text-blue-600 hover:underline">{t("viewAll")}</Link>
          </div>
          <div className="space-y-2">
            {topTakeoffs.map((tk: any, i: number) => (
              <div key={tk.id} className="flex items-center justify-between">
                <Link href={takeoffPath(tk.id, tk.name)} className="text-sm text-blue-600 hover:underline truncate">
                  {i + 1}. {tk.name}
                </Link>
                <span className="text-sm text-gray-500 shrink-0 ml-2">{formatNumber(tk.flight_count)} {tc("flights")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{t("topPilots")}</h3>
            <Link href="/pilots" className="text-sm text-blue-600 hover:underline">{t("viewAll")}</Link>
          </div>
          <div className="space-y-2">
            {topPilots.map((p: any, i: number) => (
              <div key={p.id} className="flex items-center justify-between">
                <Link href={pilotPath(p.username)} className="text-sm text-blue-600 hover:underline truncate">
                  {i + 1}. {p.name}
                </Link>
                <span className="text-sm text-gray-500 shrink-0 ml-2">{Number(p.total_km).toLocaleString()} km</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
