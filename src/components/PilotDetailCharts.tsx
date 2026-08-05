"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import SeasonHeatmap from "./SeasonHeatmap";
import { formatDuration } from "@/lib/utils";

const PilotDnaChart = dynamic(() => import("./charts/PilotDnaChart"), { ssr: false });
const DistanceHistogram = dynamic(() => import("./charts/DistanceHistogram"), { ssr: false });
const PilotYearlyChart = dynamic(() => import("./charts/PilotYearlyChart"), { ssr: false });
const PilotSiteMapDynamic = dynamic(() => import("./PilotSiteMap"), { ssr: false });

interface Props {
  dna: any;
  yearly: any[];
  sites: any[];
  equipment: any[];
  heatmap: any[];
  distHist: any[];
}

const CAT_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-red-100 text-red-800",
  Z: "bg-purple-100 text-purple-800",
  T: "bg-pink-100 text-pink-800",
};

/** "2019-2023", or just "2019" when the wing was only flown in a single year. */
function yearRange(firstUsed: string | Date, lastUsed: string | Date): string {
  const from = new Date(firstUsed).getFullYear();
  const to = new Date(lastUsed).getFullYear();
  return from === to ? `${from}` : `${from}-${to}`;
}

export default function PilotDetailCharts({ dna, yearly, sites, equipment, heatmap, distHist }: Props) {
  const t = useTranslations("pilotDetail");
  const tc = useTranslations("common");

  return (
    <div className="space-y-4">
      {/* Evolution */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("evolution")}</h2>
        <p className="text-sm text-gray-500 mb-4">{t("careerTimeline")}</p>
        <PilotYearlyChart data={yearly} />
      </div>

      {/* Pilot DNA */}
      {dna && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("pilotDna")}</h2>
          <p className="text-sm text-gray-500 mb-4">{t("pilotDnaDesc")}</p>
          <PilotDnaChart data={dna} labels={{
            distance: t("dnaDistance"),
            consistency: t("dnaConsistency"),
            volume: t("dnaVolume"),
            diversity: t("dnaDiversity"),
            triangle: t("dnaTriangle"),
            unitKm: t("dnaUnitKm"),
            unitYrs: t("dnaUnitYrs"),
            unitFlights: t("dnaUnitFlights"),
            unitSites: t("dnaUnitSites"),
          }} />
        </div>
      )}

      {/* Site Map */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("siteMap")}</h2>
        <PilotSiteMapDynamic sites={sites} />
      </div>

      {/* Equipment Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("equipmentProgression")}</h2>
        <div className="space-y-3 sm:space-y-2">
          {equipment.map((g: any, i: number) => (
            <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm sm:flex-nowrap sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${CAT_COLORS[g.category] || "bg-gray-100 text-gray-600"}`}>
                  {g.category}
                </span>
                {/* Wraps on phones (long wing names stay readable), truncates on
                    wider screens where the row must stay on a single line */}
                <span className="text-gray-700 sm:truncate" title={g.name}>{g.name}</span>
              </div>
              <div className="flex w-full shrink-0 items-center gap-x-1.5 text-xs text-gray-500 tabular-nums sm:w-auto">
                <span>{g.flight_count} {tc("flights")}</span>
                <span className="text-gray-300">&middot;</span>
                <span>{formatDuration(Number(g.total_airtime) || 0)}</span>
                <span className="text-gray-300">&middot;</span>
                <span>{yearRange(g.first_used, g.last_used)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("activityHeatmap")}</h2>
        <SeasonHeatmap data={heatmap} />
      </div>

      {/* Distance Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("distDistribution")}</h2>
        <DistanceHistogram data={distHist} />
      </div>
    </div>
  );
}
