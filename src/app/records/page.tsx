import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import {
  getAllTimeRecords,
  getCategoryRecords,
  getSiteRecords,
  getAnnualRecords,
  getFunStats,
} from "@/lib/queries";
import { pilotPath, takeoffPath, formatDuration, formatDistance, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("records");
  return { title: t("title") };
}

function RecordCard({ title, record, locale }: { title: string; record: any; locale: string }) {
  if (!record) return null;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
      <div className="text-2xl font-bold text-blue-600">
        {formatDistance(record.distance_km)} km
      </div>
      <div className="text-sm text-gray-700 mt-1">
        <Link href={pilotPath(record.pilot_username)} className="text-blue-600 hover:underline">
          {record.pilot_name}
        </Link>
      </div>
      <div className="text-xs text-gray-500">
        {record.takeoff_name && (
          <Link href={takeoffPath(record.takeoff_id, record.takeoff_name)} className="hover:underline">
            {record.takeoff_name}
          </Link>
        )}
        {" "}&middot; {formatDate(record.start_time, locale)}
      </div>
      <div className="text-xs text-gray-500">
        {record.glider_name} &middot; {formatDuration(record.airtime)} &middot;{" "}
        <a href={record.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          view
        </a>
      </div>
    </div>
  );
}

export default async function RecordsPage() {
  const locale = await getLocale();
  const t = await getTranslations("records");

  const [allTime, categoryRecords, siteRecords, annualRecords, funStats] = await Promise.all([
    getAllTimeRecords(),
    getCategoryRecords(),
    getSiteRecords(),
    getAnnualRecords(),
    getFunStats(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

      {/* All-Time Records */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("allTime")}</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <RecordCard title={t("longestFlight")} record={allTime.longest} locale={locale} />
          <RecordCard
            title={t("longestAirtime")}
            record={allTime.longestAirtime ? {
              ...allTime.longestAirtime,
              // override display to show airtime prominently
            } : null}
            locale={locale}
          />
          <RecordCard title={t("highestScore")} record={allTime.highestScore} locale={locale} />
        </div>
      </section>

      {/* Category Records */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("perCategory")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(categoryRecords as any[]).map((r) => (
            <div key={r.category} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="text-xs font-medium text-gray-500 mb-1">{r.category}</div>
              <div className="text-lg font-bold text-blue-600">{formatDistance(r.distance_km)} km</div>
              <Link href={pilotPath(r.pilot_username)} className="text-sm text-blue-600 hover:underline">
                {r.pilot_name}
              </Link>
              <div className="text-xs text-gray-500">
                {r.takeoff_name && (
                  <Link href={takeoffPath(r.takeoff_id, r.takeoff_name)} className="hover:underline">
                    {r.takeoff_name}
                  </Link>
                )}
                {" "}&middot; {formatDate(r.start_time, locale)}
              </div>
              <div className="text-xs text-gray-500">
                {r.glider_name} &middot; {formatDuration(r.airtime)} &middot;{" "}
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  view
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Annual Records */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("perYear")}</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200">Year</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200">Distance</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200">Pilot</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200">Takeoff</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200">Glider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(annualRecords as any[]).map((r) => (
                <tr key={r.year} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{r.year}</td>
                  <td className="px-3 py-2 font-bold text-blue-600 text-right">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {formatDistance(r.distance_km)} km
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={pilotPath(r.pilot_username)} className="text-blue-600 hover:underline">
                      {r.pilot_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {r.takeoff_name ? (
                      <Link href={takeoffPath(r.takeoff_id, r.takeoff_name)} className="hover:underline">
                        {r.takeoff_name}
                      </Link>
                    ) : "-"}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{r.glider_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Site Records (top 30 by distance) */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("perSite")}</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200">Takeoff</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200">Record</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200">Pilot</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(siteRecords as any[])
                .sort((a, b) => b.distance_km - a.distance_km)
                .slice(0, 30)
                .map((r) => (
                <tr key={r.takeoff_id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link href={takeoffPath(r.takeoff_id, r.takeoff_name)} className="text-blue-600 hover:underline">
                      {r.takeoff_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-bold text-right">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {formatDistance(r.distance_km)} km
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={pilotPath(r.pilot_username)} className="text-blue-600 hover:underline">
                      {r.pilot_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{formatDate(r.start_time, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Fun Stats */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("funStats")}</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {funStats.epicDay && (
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
              <h4 className="font-semibold text-yellow-800">{t("epicDay")}</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {t("epicDayDesc", { date: formatDate((funStats.epicDay as any).day, locale), count: (funStats.epicDay as any).pilots_300k })}
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                {t("epicDayDetail", { flightCount: (funStats.epicDay as any).flight_count, pilotCount: (funStats.epicDay as any).pilot_count })}
              </p>
            </div>
          )}
          {funStats.mostFlightsDay && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-700">{t("mostFlightsDay")}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate((funStats.mostFlightsDay as any).day, locale)} &mdash;{" "}
                {t("mostFlightsDayDesc", { flightCount: (funStats.mostFlightsDay as any).flight_count, pilotCount: (funStats.mostFlightsDay as any).pilot_count })}
              </p>
            </div>
          )}
          {funStats.mostSitesPilot && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-700">{t("mostSitesPilot")}</h4>
              <p className="text-sm text-gray-600 mt-1">
                <Link href={pilotPath((funStats.mostSitesPilot as any).username)} className="text-blue-600 hover:underline">
                  {(funStats.mostSitesPilot as any).name}
                </Link>{" "}
                &mdash; {t("mostSitesPilotDesc", { count: (funStats.mostSitesPilot as any).site_count })}
              </p>
            </div>
          )}
          {funStats.mostConsistent && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-700">{t("mostConsistent")}</h4>
              <p className="text-sm text-gray-600 mt-1">
                <Link href={pilotPath((funStats.mostConsistent as any).username)} className="text-blue-600 hover:underline">
                  {(funStats.mostConsistent as any).name}
                </Link>{" "}
                &mdash; {t("mostConsistentDesc", { count: (funStats.mostConsistent as any).years_active })}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
