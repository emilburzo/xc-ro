import { db } from "../db";
import { sql } from "drizzle-orm";

export interface FlightFilters {
  pilotSearch?: string;
  takeoffSearch?: string;
  dateFrom?: string;
  dateTo?: string;
  distMin?: number;
  distMax?: number;
  flightType?: string;
  gliderCategory?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function getFlightsList(filters: FlightFilters) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const offset = (page - 1) * pageSize;

  // Build WHERE conditions using sql tagged templates
  const conditions: ReturnType<typeof sql>[] = [];

  if (filters.pilotSearch) {
    const pattern = `%${filters.pilotSearch}%`;
    conditions.push(sql`(unaccent(p.name) ILIKE unaccent(${pattern}) OR unaccent(p.username) ILIKE unaccent(${pattern}))`);
  }
  if (filters.takeoffSearch) {
    conditions.push(sql`unaccent(t.name) ILIKE unaccent(${`%${filters.takeoffSearch}%`})`);
  }
  if (filters.dateFrom) {
    conditions.push(sql`f.start_time >= ${filters.dateFrom}::timestamp`);
  }
  if (filters.dateTo) {
    conditions.push(sql`f.start_time <= ${filters.dateTo + " 23:59:59"}::timestamp`);
  }
  if (filters.distMin !== undefined) {
    conditions.push(sql`f.distance_km >= ${filters.distMin}`);
  }
  if (filters.distMax !== undefined) {
    conditions.push(sql`f.distance_km <= ${filters.distMax}`);
  }
  if (filters.flightType) {
    conditions.push(sql`f.type ILIKE ${`%${filters.flightType}%`}`);
  }
  if (filters.gliderCategory) {
    conditions.push(sql`g.category = ${filters.gliderCategory}`);
  }

  const whereClause = conditions.length > 0
    ? sql.join(conditions, sql` AND `)
    : sql`1=1`;

  // Sort column (whitelist to prevent SQL injection)
  const sortMapping: Record<string, ReturnType<typeof sql>> = {
    date: sql`f.start_time`,
    distance: sql`f.distance_km`,
    score: sql`f.score`,
    airtime: sql`f.airtime`,
    pilot: sql`p.name`,
    takeoff: sql`t.name`,
  };
  const sortCol = sortMapping[filters.sortBy || "date"] || sql`f.start_time`;

  const countResult = await db.execute(sql`
    SELECT count(*)::int as total
    FROM flights_pg f
    JOIN pilots p ON f.pilot_id = p.id
    LEFT JOIN takeoffs t ON f.takeoff_id = t.id
    JOIN gliders g ON f.glider_id = g.id
    WHERE ${whereClause}
  `);

  const rows = filters.sortDir === "asc"
    ? await db.execute(sql`
        SELECT f.id, f.start_time, f.distance_km, f.score, f.airtime, f.type, f.url,
               p.name as pilot_name, p.username as pilot_username,
               t.name as takeoff_name, t.id as takeoff_id,
               g.name as glider_name, g.category as glider_category
        FROM flights_pg f
        JOIN pilots p ON f.pilot_id = p.id
        LEFT JOIN takeoffs t ON f.takeoff_id = t.id
        JOIN gliders g ON f.glider_id = g.id
        WHERE ${whereClause}
        ORDER BY ${sortCol} ASC
        LIMIT ${pageSize} OFFSET ${offset}
      `)
    : await db.execute(sql`
        SELECT f.id, f.start_time, f.distance_km, f.score, f.airtime, f.type, f.url,
               p.name as pilot_name, p.username as pilot_username,
               t.name as takeoff_name, t.id as takeoff_id,
               g.name as glider_name, g.category as glider_category
        FROM flights_pg f
        JOIN pilots p ON f.pilot_id = p.id
        LEFT JOIN takeoffs t ON f.takeoff_id = t.id
        JOIN gliders g ON f.glider_id = g.id
        WHERE ${whereClause}
        ORDER BY ${sortCol} DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `);

  return {
    flights: rows,
    total: Number(countResult[0]?.total || 0),
    page,
    pageSize,
  };
}
