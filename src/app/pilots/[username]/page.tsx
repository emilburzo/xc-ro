import { cache } from "react";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPilotByUsername,
  getCachedPilotStats,
  getCachedPilotFavoriteTakeoff,
  getCachedPilotYearlyStats,
  getCachedPilotSiteMap,
  getCachedPilotEquipmentTimeline,
  getCachedPilotActivityHeatmap,
  getCachedPilotTopFlights,
  getCachedPilotLatestFlights,
  getCachedPilotDistanceHistogram,
  getCachedPilotDna,
} from "@/lib/queries/pilots";
import { takeoffPath, formatDuration } from "@/lib/utils";
import PilotDetailCharts from "@/components/PilotDetailCharts";
import PilotFlightsTable from "@/components/PilotFlightsTable";
import { JsonLd } from "@/components/JsonLd";
import { getBaseUrl } from "@/lib/seo";

const getCachedPilot = cache((username: string) => getPilotByUsername(username));

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const pilot = await getCachedPilot(username);
  if (!pilot) return {};
  const t = await getTranslations("pilotDetail");
  const ts = await getTranslations("seo");
  const name = (pilot as any).name;
  return {
    title: `${name} | ${t("pageType")}`,
    description: ts("pilotDetailDescription", { name }),
    alternates: { canonical: `/pilots/${username}` },
  };
}

export default async function PilotDetailPage({ params }: { params: Promise<{ username: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("pilotDetail");
  const { username } = await params;
  const pilot = await getCachedPilot(username);
  if (!pilot) notFound();

  const pilotId = (pilot as any).id;

  const [stats, favTakeoff, yearly, sites, equipment, heatmap, topFlights, latestFlights, distHist, dna] =
    await Promise.all([
      getCachedPilotStats(pilotId),
      getCachedPilotFavoriteTakeoff(pilotId),
      getCachedPilotYearlyStats(pilotId),
      getCachedPilotSiteMap(pilotId),
      getCachedPilotEquipmentTimeline(pilotId),
      getCachedPilotActivityHeatmap(pilotId),
      getCachedPilotTopFlights(pilotId),
      getCachedPilotLatestFlights(pilotId),
      getCachedPilotDistanceHistogram(pilotId),
      getCachedPilotDna(pilotId),
    ]);

  const s = stats as any;
  const fav = favTakeoff as any;

  return (
    <div className="space-y-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: (pilot as any).name,
          url: `${getBaseUrl()}/pilots/${(pilot as any).username}`,
        }}
      />
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
          { label: t("totalAirtime"), value: formatDuration(s.total_airtime) },
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
        dna={dna as any}
        yearly={yearly as any}
        sites={sites as any}
        equipment={equipment as any}
        heatmap={heatmap as any}
        distHist={distHist as any}
      />

      {/* Top Flights Table */}
      <PilotFlightsTable
        title={t("topFlights")}
        flights={topFlights as any[]}
        locale={locale}
        pilotName={(pilot as any).name}
        labels={{
          date: t("date"),
          takeoff: t("takeoff"),
          glider: t("glider"),
          distance: t("distance"),
          score: t("score"),
          airtime: t("airtime"),
        }}
      />

      {/* Latest Flights Table */}
      <PilotFlightsTable
        title={t("latestFlights")}
        flights={latestFlights as any[]}
        locale={locale}
        pilotName={(pilot as any).name}
        labels={{
          date: t("date"),
          takeoff: t("takeoff"),
          glider: t("glider"),
          distance: t("distance"),
          score: t("score"),
          airtime: t("airtime"),
        }}
      />
    </div>
  );
}
