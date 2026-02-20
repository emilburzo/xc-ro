"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import SeasonHeatmap from "./SeasonHeatmap";

const MonthlyBarChart = dynamic(() => import("./charts/MonthlyBarChart"), { ssr: false });
const HourlyChart = dynamic(() => import("./charts/HourlyChart"), { ssr: false });
const DowChart = dynamic(() => import("./charts/DowChart"), { ssr: false });
const DistanceHistogram = dynamic(() => import("./charts/DistanceHistogram"), { ssr: false });
const WingDonut = dynamic(() => import("./charts/WingDonut"), { ssr: false });
const YearlyTrendChart = dynamic(() => import("./charts/YearlyTrendChart"), { ssr: false });

interface Props {
  calendar: any[];
  monthly: any[];
  hourly: any[];
  dow: any[];
  distHist: any[];
  wingClasses: any[];
  topGliders: any[];
  yearly: any[];
  xcPotential: number;
}

export default function TakeoffDetailCharts({
  calendar, monthly, hourly, dow, distHist, wingClasses, topGliders, yearly, xcPotential,
}: Props) {
  const t = useTranslations("takeoffDetail");

  return (
    <div className="space-y-4">
      {/* Section A: Seasonality */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("seasonality")}</h2>
        <p className="text-sm text-gray-500 mb-4">{t("whenToFly")}</p>

        <SeasonHeatmap data={calendar} />

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t("flightsPerMonth")}</h4>
            <MonthlyBarChart data={monthly} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t("hourlyDist")}</h4>
            <HourlyChart data={hourly} />
          </div>
        </div>

        <div className="mt-4 max-w-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{t("dayOfWeek")}</h4>
          <DowChart data={dow} />
        </div>
      </div>

      {/* Section B: Potential */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("potential")}</h2>
        <p className="text-sm text-gray-500 mb-4">{t("howGood")}</p>

        <div className="flex items-center gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{xcPotential.toFixed(1)}</div>
            <div className="text-sm text-blue-500">{t("xcScore")} (km)</div>
          </div>
        </div>

        <h4 className="text-sm font-medium text-gray-700 mb-2">{t("distHistogram")}</h4>
        <DistanceHistogram data={distHist} />
      </div>

      {/* Section C: Difficulty */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("difficulty")}</h2>
        <p className="text-sm text-gray-500 mb-4">{t("forMe")}</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t("wingClasses")}</h4>
            <WingDonut data={wingClasses} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t("topGliders")}</h4>
            <div className="space-y-2">
              {topGliders.map((g: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {g.name}
                    <span className="ml-1 px-1 py-0.5 bg-gray-100 rounded text-[10px]">{g.category}</span>
                  </span>
                  <span className="text-gray-500">{g.cnt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section D: Activity Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("activityTrend")}</h2>
        <p className="text-sm text-gray-500 mb-4">{t("isActive")}</p>
        <YearlyTrendChart data={yearly} />
      </div>
    </div>
  );
}
