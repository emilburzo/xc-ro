import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { getDailyFlights, getAdjacentFlightDays } from "@/lib/queries/daily";
import { dailyPath, formatDay, parseDay, todayInRomania } from "@/lib/utils";
import DailyFlightsList from "@/components/DailyFlightsList";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

const FULL_DATE: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
const LONG_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
const SHORT_DATE: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
const WEEKDAY: Intl.DateTimeFormatOptions = { weekday: "long" };

const DAY_LINK = "px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap";

/** The requested day, or today when it is missing, malformed or in the future. */
async function resolveDay(searchParams: SearchParams) {
  const today = todayInRomania();
  const requested = parseDay((await searchParams).date);
  const day = requested && requested < today ? requested : today;
  return { day, today, isToday: day === today };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { day, isToday } = await resolveDay(searchParams);
  const locale = await getLocale();
  const t = await getTranslations("daily");
  const ts = await getTranslations("seo");
  return {
    title: isToday ? t("titleToday") : t("title", { date: formatDay(day, locale, LONG_DATE) }),
    description: ts("dailyDescription"),
    alternates: { canonical: dailyPath(isToday ? undefined : day) },
  };
}

export default async function DailyPage({ searchParams }: { searchParams: SearchParams }) {
  const { day, today, isToday } = await resolveDay(searchParams);
  const locale = await getLocale();
  const t = await getTranslations("daily");

  const [flights, adjacent] = await Promise.all([getDailyFlights(day), getAdjacentFlightDays(day)]);

  // Days without flights are skipped, but every past day leads back to today
  const prev = adjacent.prev;
  const next = isToday ? null : adjacent.next && adjacent.next < today ? adjacent.next : today;
  const pilotCount = new Set(flights.map((f) => f.pilot_username)).size;

  const summary = [
    capitalize(formatDay(day, locale, isToday ? FULL_DATE : WEEKDAY)),
    flights.length > 0 && t("flightCount", { count: flights.length }),
    pilotCount > 0 && t("pilotCount", { count: pilotCount }),
  ].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isToday ? t("titleToday") : t("title", { date: formatDay(day, locale, LONG_DATE) })}
        </h1>
        <p className="text-gray-500 text-sm">{summary}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {prev && (
          <Link href={dailyPath(prev)} className={DAY_LINK}>
            &larr; {formatDay(prev, locale, SHORT_DATE)}
          </Link>
        )}
        <div className="ml-auto flex gap-2">
          {next && next !== today && (
            <Link href={dailyPath()} className={DAY_LINK}>
              {t("today")}
            </Link>
          )}
          {next && (
            <Link href={dailyPath(next === today ? undefined : next)} className={DAY_LINK}>
              {next === today ? t("today") : formatDay(next, locale, SHORT_DATE)} &rarr;
            </Link>
          )}
        </div>
      </div>

      <DailyFlightsList
        flights={flights}
        emptyText={isToday ? t("noFlightsToday") : t("noFlights")}
        labels={{
          pilot: t("pilot"),
          takeoff: t("takeoff"),
          glider: t("glider"),
          type: t("type"),
          distance: t("distance"),
          score: t("score"),
          duration: t("duration"),
          points: t("points"),
          xcontest: t("xcontest"),
          viewOnXContest: t("viewOnXContest"),
          types: {
            free: t("freeFlight"),
            fai: t("faiTriangle"),
            flat: t("flatTriangle"),
          },
        }}
      />

      <p className="text-xs text-gray-500">{t("sourcesNote")}</p>
    </div>
  );
}
