import { cache } from "react";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFlightById, getSimilarFlights } from "@/lib/queries/flights";
import { pilotPath, takeoffPath, wingPath, flightPath, similarFlightsPath, formatDuration, formatDistance, formatDate, formatTime, CAT_COLORS } from "@/lib/utils";
import FlightDetailMapWrapper from "@/components/FlightDetailMapWrapper";
import TakeoffFlightsTable from "@/components/TakeoffFlightsTable";

const getCachedFlight = cache((id: number) => getFlightById(id));

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseInt(rawId.split("-")[0]);
  if (isNaN(id)) return {};
  const flight = await getCachedFlight(id);
  if (!flight) return {};
  const t = await getTranslations("flightDetail");
  const ts = await getTranslations("seo");
  const f = flight as any;
  const locale = await getLocale();
  return {
    title: `${f.pilot_name}${f.takeoff_name ? ` · ${f.takeoff_name}` : ""} · ${formatDistance(f.distance_km)} km · ${formatDuration(f.airtime)} | ${t("pageType")}`,
    description: ts("flightDetailDescription", {
      date: formatDate(f.start_time, locale),
      pilot: f.pilot_name,
      distance: formatDistance(f.distance_km),
      duration: formatDuration(f.airtime),
    }),
    alternates: { canonical: flightPath(id, f.pilot_name, f.takeoff_name) },
  };
}

export default async function FlightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("flightDetail");
  const { id: rawId } = await params;
  const id = parseInt(rawId.split("-")[0]);
  if (isNaN(id)) notFound();

  const flight = await getCachedFlight(id);
  if (!flight) notFound();

  const f = flight as any;
  const hasCoords = f.start_lat != null && f.start_lng != null;

  const similarFlights = f.takeoff_id != null
    ? await getSimilarFlights(id, f.takeoff_id, Number(f.distance_km))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/flights" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          &larr; {t("backToFlights")}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {f.pilot_name}
          {f.takeoff_name ? ` · ${f.takeoff_name}` : ""}
          {" · "}{formatDistance(f.distance_km)} km
          {" · "}{formatDuration(f.airtime)}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {formatDate(f.start_time, locale)} {formatTime(f.start_time, locale)} · {f.type}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-blue-600">{formatDistance(f.distance_km)} km</div>
          <div className="text-xs text-gray-500">{t("distance")}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-blue-600">{Number(f.score).toFixed(1)}</div>
          <div className="text-xs text-gray-500">{t("score")}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-blue-600">{formatDuration(f.airtime)}</div>
          <div className="text-xs text-gray-500">{t("airtime")}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-blue-600">{formatDate(f.start_time, locale)}</div>
          <div className="text-xs text-gray-500">{t("date")}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-blue-600">{formatTime(f.start_time, locale)}</div>
          <div className="text-xs text-gray-500">{t("time")}</div>
        </div>
      </div>

      {/* Flight Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="text-gray-500">{t("pilot")}:</span>{" "}
            <Link href={pilotPath(f.pilot_username)} className="text-blue-600 hover:underline font-medium">
              {f.pilot_name}
            </Link>
          </div>
          <div>
            <span className="text-gray-500">{t("takeoff")}:</span>{" "}
            {f.takeoff_id ? (
              <Link href={takeoffPath(f.takeoff_id, f.takeoff_name)} className="text-blue-600 hover:underline font-medium">
                {f.takeoff_name}
              </Link>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
          <div>
            <span className="text-gray-500">{t("glider")}:</span>{" "}
            <Link href={wingPath(f.glider_id, f.glider_name)} className="text-blue-600 hover:underline font-medium">
              {f.glider_name}
            </Link>
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${CAT_COLORS[f.glider_category] || "bg-gray-100 text-gray-800"}`}>
              {f.glider_category}
            </span>
          </div>
          <div>
            <span className="text-gray-500">{t("type")}:</span>{" "}
            <span className="font-medium">{f.type}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            {t("viewOnXContest")} &rarr;
          </a>
        </div>
      </div>

      {/* Map */}
      {hasCoords && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">{t("startLocation")}</h3>
          <FlightDetailMapWrapper
            lat={Number(f.start_lat)}
            lng={Number(f.start_lng)}
            label={f.takeoff_name || undefined}
          />
        </div>
      )}
      {/* Similar Flights */}
      {similarFlights.length > 0 && (
        <div>
          <TakeoffFlightsTable
            title={t("similarFlightsTitle")}
            flights={similarFlights}
            locale={locale}
            takeoffName={f.takeoff_name || ""}
            labels={{
              date: t("date"),
              pilot: t("pilot"),
              glider: t("glider"),
              distance: t("distance"),
              score: t("score"),
              airtime: t("airtime"),
            }}
          />
          {f.takeoff_name && (
            <div className="mt-2 text-right">
              <Link
                href={similarFlightsPath(f.takeoff_name, Number(f.distance_km))}
                className="text-sm text-blue-600 hover:underline"
              >
                {t("viewMoreSimilar")} &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
