import { getTranslations } from "next-intl/server";
import { getFlightsList, FlightFilters } from "@/lib/queries";
import FlightsExplorer from "@/components/FlightsExplorer";

export const dynamic = "force-dynamic";

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const t = await getTranslations("flights");

  const filters: FlightFilters = {
    pilotSearch: searchParams.pilot,
    takeoffSearch: searchParams.takeoff,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    distMin: searchParams.distMin ? Number(searchParams.distMin) : undefined,
    distMax: searchParams.distMax ? Number(searchParams.distMax) : undefined,
    flightType: searchParams.type,
    gliderCategory: searchParams.category,
    sortBy: searchParams.sort || "date",
    sortDir: (searchParams.dir as "asc" | "desc") || "desc",
    page: searchParams.page ? Number(searchParams.page) : 1,
    pageSize: 50,
  };

  // Handle presets
  if (searchParams.preset === "today") {
    const today = new Date().toISOString().split("T")[0];
    filters.dateFrom = today;
    filters.dateTo = today;
  } else if (searchParams.preset === "bestMonth") {
    const now = new Date();
    filters.dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    filters.sortBy = "distance";
  } else if (searchParams.preset === "top100") {
    filters.sortBy = "distance";
    filters.pageSize = 100;
  } else if (searchParams.preset === "club100k") {
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
        currentFilters={searchParams}
      />
    </div>
  );
}
