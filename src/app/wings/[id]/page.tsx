import { cache } from "react";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getWingById,
  getWingTopFlights,
  getWingRecentFlights,
  getWingDistanceHistogram,
  getWingAdoptionCurve,
  getWingYearlyStats,
  getWingFavoriteTakeoffs,
  getWingCalendarHeatmap,
} from "@/lib/queries/wings";
import { slugify, formatDuration, formatDistance, formatNumber, CAT_COLORS } from "@/lib/utils";
import WingDetailCharts from "@/components/WingDetailCharts";
import WingFlightsTable from "@/components/WingFlightsTable";
import { JsonLd } from "@/components/JsonLd";
import { getBaseUrl } from "@/lib/seo";

const getCachedWing = cache((id: number) => getWingById(id));

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseInt(rawId.split("-")[0]);
  if (isNaN(id)) return {};
  const wing = await getCachedWing(id);
  if (!wing) return {};
  const t = await getTranslations("wingDetail");
  const ts = await getTranslations("seo");
  const name = (wing as any).name;
  const category = (wing as any).category;
  return {
    title: `${name} | ${t("pageType")}`,
    description: ts("wingDetailDescription", { name, category }),
    alternates: { canonical: `/wings/${id}-${slugify(name)}` },
  };
}

export default async function WingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("wingDetail");
  const { id: rawId } = await params;
  const id = parseInt(rawId.split("-")[0]);
  if (isNaN(id)) notFound();

  const wing = await getCachedWing(id);
  if (!wing) notFound();

  const [topFlights, recentFlights, distHist, adoption, yearly, favoriteTakeoffs, calendar] =
    await Promise.all([
      getWingTopFlights(id),
      getWingRecentFlights(id),
      getWingDistanceHistogram(id),
      getWingAdoptionCurve(id),
      getWingYearlyStats(id),
      getWingFavoriteTakeoffs(id),
      getWingCalendarHeatmap(id),
    ]);

  const totalFlights = (yearly as any[]).reduce((s: number, y: any) => s + y.flight_count, 0);
  const totalKm = (yearly as any[]).reduce((s: number, y: any) => s + Number(y.total_km || 0), 0);
  const totalAirtime = (yearly as any[]).reduce((s: number, y: any) => s + Number(y.total_airtime || 0), 0);
  const pilotCount = (adoption as any[]).reduce((max: number, y: any) => Math.max(max, y.pilot_count), 0);
  const xcPotential = topFlights.length > 0
    ? (topFlights as any[]).reduce((s: number, f: any) => s + Number(f.distance_km), 0) / topFlights.length
    : 0;
  const maxDistance = topFlights.length > 0 ? Number((topFlights as any[])[0].distance_km) : 0;
  const firstYear = (adoption as any[]).length > 0 ? (adoption as any[])[0].year : null;
  const lastYear = (adoption as any[]).length > 0 ? (adoption as any[])[(adoption as any[]).length - 1].year : null;

  return (
    <div className="space-y-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: (wing as any).name,
          category: (wing as any).category,
          url: `${getBaseUrl()}/wings/${id}-${slugify((wing as any).name)}`,
        }}
      />
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
          <div className="text-2xl font-bold text-gray-900">{formatDuration(totalAirtime)}</div>
          <div className="text-xs text-gray-500">{t("totalAirtime")}</div>
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
      <WingFlightsTable
        title={t("topFlights")}
        flights={topFlights as any}
        locale={locale}
        labels={{
          date: t("date"),
          pilot: t("pilot"),
          takeoff: t("takeoff"),
          distance: t("distance"),
          score: t("score"),
          airtime: t("airtime"),
        }}
      />

      {/* Recent 10 Flights */}
      <WingFlightsTable
        title={t("recentFlights")}
        flights={recentFlights as any}
        locale={locale}
        labels={{
          date: t("date"),
          pilot: t("pilot"),
          takeoff: t("takeoff"),
          distance: t("distance"),
          score: t("score"),
          airtime: t("airtime"),
        }}
      />
    </div>
  );
}
