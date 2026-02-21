"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Link from "next/link";
import SeasonHeatmap from "./SeasonHeatmap";
import { takeoffPath, pilotPath, formatDistance, formatNumber } from "@/lib/utils";

const AdoptionChart = dynamic(() => import("./charts/AdoptionChart"), { ssr: false });
const YearlyTrendChart = dynamic(() => import("./charts/YearlyTrendChart"), { ssr: false });
const DistanceHistogram = dynamic(() => import("./charts/DistanceHistogram"), { ssr: false });
const HourlyChart = dynamic(() => import("./charts/HourlyChart"), { ssr: false });

interface Props {
  calendar: any[];
  adoption: any[];
  yearly: any[];
  distHist: any[];
  favoriteTakeoffs: any[];
  topPilots: any[];
  hourly: any[];
}

export default function WingDetailCharts({
  calendar, adoption, yearly, distHist, favoriteTakeoffs, topPilots, hourly,
}: Props) {
  const t = useTranslations("wingDetail");

  return (
    <div className="space-y-4">
      {/* Section 1: Popularity */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("popularity")}</h2>
        <p className="text-sm text-gray-500 mb-4">{t("adoption")}</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t("pilotsCount")}</h4>
            <AdoptionChart data={adoption} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t("flightsPerYear")}</h4>
            <YearlyTrendChart data={yearly} />
          </div>
        </div>
      </div>

      {/* Section 2: XC Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("performance")}</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t("distHistogram")}</h4>
            <DistanceHistogram data={distHist} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t("hourlyDistribution")}</h4>
            <HourlyChart data={hourly} />
          </div>
        </div>
      </div>

      {/* Section 3: Top Pilots */}
      {topPilots.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("topPilotsTitle")}</h2>
          <p className="text-sm text-gray-500 mb-3">{t("topPilotsDesc")}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">#</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{t("pilot")}</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{t("totalFlights")}</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{t("totalKm")}</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{t("maxDistance")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topPilots.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-2 py-2">
                      <Link href={pilotPath(p.username)} className="text-blue-600 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-2 py-2 font-medium text-right">{p.flight_count}</td>
                    <td className="px-2 py-2 text-gray-700 text-right">{formatNumber(Number(p.total_km))} km</td>
                    <td className="px-2 py-2 text-gray-700 text-right">{formatDistance(Number(p.max_distance))} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 4: Where it's flown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("whereFlown")}</h2>
        <p className="text-sm text-gray-500 mb-3">{t("topTakeoffs")}</p>
        <div className="space-y-2">
          {favoriteTakeoffs.map((tk: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <Link href={takeoffPath(tk.id, tk.name)} className="text-blue-600 hover:underline">
                {tk.name}
              </Link>
              <span className="text-gray-500">{tk.flight_count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonality */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("seasonality")}</h2>
        <SeasonHeatmap data={calendar} />
      </div>
    </div>
  );
}
