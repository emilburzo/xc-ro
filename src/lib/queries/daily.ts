import { db } from "../db";
import { sql } from "drizzle-orm";
import type { DailyFlightRow } from "../types";

// Not cached: the scraper adds flights every few minutes, and unstable_cache
// keeps serving an expired entry until a request revalidates it in the
// background, so on a quiet site "today" could be hours old. Both queries are
// cheap lookups on the start_time index.

/** Paragliding flights started on `day` (`YYYY-MM-DD`, Romanian time), best score first. */
export async function getDailyFlights(day: string): Promise<DailyFlightRow[]> {
  const rows = await db.execute(sql`
    SELECT f.id, f.start_time, f.distance_km, f.score, f.airtime, f.type, f.url,
           p.name as pilot_name, p.username as pilot_username,
           t.id as takeoff_id, t.name as takeoff_name,
           g.name as glider_name, g.category as glider_category
    FROM flights_pg f
    JOIN pilots p ON f.pilot_id = p.id
    LEFT JOIN takeoffs t ON f.takeoff_id = t.id
    JOIN gliders g ON f.glider_id = g.id
    WHERE f.start_time >= ${day}::date
      AND f.start_time < ${day}::date + 1
    ORDER BY f.score DESC, f.distance_km DESC, f.start_time, f.id
  `);
  return (rows as unknown as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    start_time: String(r.start_time),
    distance_km: Number(r.distance_km),
    score: Number(r.score),
    airtime: Number(r.airtime),
    type: String(r.type),
    url: String(r.url),
    pilot_name: String(r.pilot_name),
    pilot_username: String(r.pilot_username),
    takeoff_id: r.takeoff_id == null ? null : Number(r.takeoff_id),
    takeoff_name: r.takeoff_name == null ? null : String(r.takeoff_name),
    glider_name: String(r.glider_name),
    glider_category: String(r.glider_category),
  }));
}

/** The nearest days before and after `day` that have flights, as `YYYY-MM-DD`. */
export async function getAdjacentFlightDays(day: string): Promise<{ prev: string | null; next: string | null }> {
  const rows = await db.execute(sql`
    SELECT
      (SELECT max(start_time)::date::text FROM flights_pg WHERE start_time < ${day}::date) as prev,
      (SELECT min(start_time)::date::text FROM flights_pg WHERE start_time >= ${day}::date + 1) as next
  `);
  const row = rows[0] as { prev: string | null; next: string | null } | undefined;
  return { prev: row?.prev ?? null, next: row?.next ?? null };
}
