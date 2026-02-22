import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getFlightsList, FlightFilters } from "@/lib/queries/flights";
import FlightsExplorer from "@/components/FlightsExplorer";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("flights");
  return { title: t("title") };
}

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const t = await getTranslations("flights");
  const sp = await searchParams;

  const filters: FlightFilters = {
    pilotSearch: sp.pilot,
    takeoffSearch: sp.takeoff,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    distMin: sp.distMin ? Number(sp.distMin) : undefined,
    distMax: sp.distMax ? Number(sp.distMax) : undefined,
    flightType: sp.type,
    gliderCategory: sp.category,
    sortBy: sp.sort || "date",
    sortDir: (sp.dir as "asc" | "desc") || "desc",
    page: sp.page ? Number(sp.page) : 1,
    pageSize: 50,
  };

  // Handle presets
  if (sp.preset === "today") {
    const today = new Date().toISOString().split("T")[0];
    filters.dateFrom = today;
    filters.dateTo = today;
  } else if (sp.preset === "bestMonth") {
    const now = new Date();
    filters.dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    filters.sortBy = "distance";
  } else if (sp.preset === "top100") {
    filters.sortBy = "distance";
    filters.pageSize = 100;
  } else if (sp.preset === "club100k") {
    filters.distMin = 100;
    filters.sortBy = "distance";
  }

  const result = await getFlightsList(filters);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      <FlightsExplorer
        flights={result.flights as any}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        currentFilters={sp}
      />
    </div>
  );
}
