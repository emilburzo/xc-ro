"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import SeasonHeatmap from "./SeasonHeatmap";
import CategoryTimeline from "./charts/CategoryTimeline";

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
        <CategoryTimeline data={equipment} flightsLabel={tc("flights")} />
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
