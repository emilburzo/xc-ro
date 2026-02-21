"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const FlightTypeChart = dynamic(() => import("./charts/FlightTypeChart"), { ssr: false });
const CommunityGrowthChart = dynamic(() => import("./charts/CommunityGrowthChart"), { ssr: false });

interface Props {
  flightTypes: any[];
  communityGrowth: any[];
}

export default function RecordsCharts({ flightTypes, communityGrowth }: Props) {
  const t = useTranslations("records");

  return (
    <div className="space-y-6">
      {/* Community Growth */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("growth")}</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <CommunityGrowthChart data={communityGrowth} />
        </div>
      </section>

      {/* Flight Type Distribution */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("flightTypes")}</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <FlightTypeChart data={flightTypes} />
        </div>
      </section>
    </div>
  );
}
