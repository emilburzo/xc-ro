"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import SeasonHeatmap from "./SeasonHeatmap";

const DistanceHistogram = dynamic(() => import("./charts/DistanceHistogram"), { ssr: false });
const PilotYearlyChart = dynamic(() => import("./charts/PilotYearlyChart"), { ssr: false });
const PilotSiteMapDynamic = dynamic(() => import("./PilotSiteMap"), { ssr: false });

interface Props {
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

export default function PilotDetailCharts({ yearly, sites, equipment, heatmap, distHist }: Props) {
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

      {/* Site Map */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("siteMap")}</h2>
        <PilotSiteMapDynamic sites={sites} />
      </div>

      {/* Equipment Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("equipmentProgression")}</h2>
        <div className="space-y-2">
          {equipment.map((g: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CAT_COLORS[g.category] || "bg-gray-100 text-gray-600"}`}>
                  {g.category}
                </span>
                <span className="text-gray-700">{g.name}</span>
              </div>
              <div className="text-xs text-gray-500">
                {g.flight_count} {tc("flights")} &middot;{" "}
                {new Date(g.first_used).getFullYear()}-{new Date(g.last_used).getFullYear()}
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
