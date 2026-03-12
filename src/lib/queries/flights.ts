import { db } from "../db";
import { sql } from "drizzle-orm";

const FLIGHT_TYPE_MAPPING: Record<string, string[]> = {
  free: ["free flight", "zbor liber"],
  fai: ["FAI triangle", "triunghi FAI"],
  flat: ["flat triangle", "triunghi plat"],
};

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

export async function getFlightById(id: number) {
  const rows = await db.execute(sql`
    SELECT f.id, f.start_time, f.distance_km, f.score, f.airtime, f.type, f.url,
           p.name as pilot_name, p.username as pilot_username,
           t.name as takeoff_name, t.id as takeoff_id,
           g.id as glider_id, g.name as glider_name, g.category as glider_category,
           ST_Y(f.start_point::geometry) as start_lat,
           ST_X(f.start_point::geometry) as start_lng
    FROM flights_pg f
    JOIN pilots p ON f.pilot_id = p.id
    LEFT JOIN takeoffs t ON f.takeoff_id = t.id
    JOIN gliders g ON f.glider_id = g.id
    WHERE f.id = ${id}
  `);
  return rows[0] || null;
}

function buildFlightWhereClause(filters: FlightFilters) {
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
    const variants = FLIGHT_TYPE_MAPPING[filters.flightType];
    if (variants) {
      conditions.push(sql`(f.type = ${variants[0]} OR f.type = ${variants[1]})`);
    } else {
      conditions.push(sql`f.type ILIKE ${`%${filters.flightType}%`}`);
    }
  }
  if (filters.gliderCategory) {
    conditions.push(sql`g.category = ${filters.gliderCategory}`);
  }

  return conditions.length > 0
    ? sql.join(conditions, sql` AND `)
    : sql`1=1`;
}

export interface DistHistogramRow {
  bucket: string;
  cnt: number;
}

export interface TimelineRow {
  year: number;
  month: number;
  cnt: number;
}

export interface CategoryRow {
  category: string;
  cnt: number;
}

export interface FlightsChartData {
  distHistogram: DistHistogramRow[];
  timeline: TimelineRow[];
  categoryBreakdown: CategoryRow[];
}

export async function getFlightsChartData(filters: FlightFilters): Promise<FlightsChartData> {
  const whereClause = buildFlightWhereClause(filters);

  const rows = await db.execute(sql`
    WITH filtered AS (
      SELECT f.distance_km, f.start_time, g.category
      FROM flights_pg f
      JOIN pilots p ON f.pilot_id = p.id
      LEFT JOIN takeoffs t ON f.takeoff_id = t.id
      JOIN gliders g ON f.glider_id = g.id
      WHERE ${whereClause}
    ),
    dist AS (
      SELECT
        CASE
          WHEN distance_km < 1 THEN '0-1'
          WHEN distance_km < 5 THEN '1-5'
          WHEN distance_km < 20 THEN '5-20'
          WHEN distance_km < 50 THEN '20-50'
          WHEN distance_km < 100 THEN '50-100'
          ELSE '100+'
        END as bucket,
        count(*)::int as cnt
      FROM filtered
      GROUP BY bucket
      ORDER BY min(distance_km)
    ),
    timeline AS (
      SELECT
        EXTRACT(YEAR FROM start_time)::int as year,
        EXTRACT(MONTH FROM start_time)::int as month,
        count(*)::int as cnt
      FROM filtered
      GROUP BY year, month
      ORDER BY year, month
    ),
    cat AS (
      SELECT category, count(*)::int as cnt
      FROM filtered
      GROUP BY category
      ORDER BY cnt DESC
    )
    SELECT 'dist' as _type, bucket, cnt, null::int as year, null::int as month, null as category FROM dist
    UNION ALL
    SELECT 'timeline', null, cnt, year, month, null FROM timeline
    UNION ALL
    SELECT 'cat', null, cnt, null, null, category FROM cat
  `);

  const distHistogram: DistHistogramRow[] = [];
  const timeline: TimelineRow[] = [];
  const categoryBreakdown: CategoryRow[] = [];

  for (const row of rows as unknown as { _type: string; bucket: string; cnt: number; year: number; month: number; category: string }[]) {
    if (row._type === "dist") {
      distHistogram.push({ bucket: row.bucket, cnt: row.cnt });
    } else if (row._type === "timeline") {
      timeline.push({ year: row.year, month: row.month, cnt: row.cnt });
    } else {
      categoryBreakdown.push({ category: row.category, cnt: row.cnt });
    }
  }

  return { distHistogram, timeline, categoryBreakdown };
}

export async function getSimilarFlights(flightId: number, takeoffId: number, distanceKm: number) {
  const distMin = distanceKm * 0.8;
  const distMax = distanceKm * 1.2;
  return db.execute(sql`
    SELECT f.id, f.start_time, f.distance_km, f.score, f.airtime,
           p.name as pilot_name, p.username as pilot_username,
           g.name as glider_name, g.category as glider_category
    FROM flights_pg f
    JOIN pilots p ON f.pilot_id = p.id
    JOIN gliders g ON f.glider_id = g.id
    WHERE f.takeoff_id = ${takeoffId}
      AND f.distance_km >= ${distMin}
      AND f.distance_km <= ${distMax}
      AND f.id != ${flightId}
    ORDER BY f.start_time DESC
    LIMIT 10
  `);
}

export async function getFlightsList(filters: FlightFilters) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const offset = (page - 1) * pageSize;

  const whereClause = buildFlightWhereClause(filters);

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
               g.name as glider_name, g.category as glider_category,
               ST_Y(f.start_point::geometry) as start_lat,
               ST_X(f.start_point::geometry) as start_lng
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
               g.name as glider_name, g.category as glider_category,
               ST_Y(f.start_point::geometry) as start_lat,
               ST_X(f.start_point::geometry) as start_lng
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
