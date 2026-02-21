import { db } from "./db";
import { sql } from "drizzle-orm";

// ============ HOME PAGE ============

export async function getHomeStats() {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM flights_pg) as total_flights,
      (SELECT count(*) FROM pilots) as total_pilots,
      (SELECT count(DISTINCT takeoff_id) FROM flights_pg WHERE start_time > now() - interval '1 year') as active_takeoffs,
      (SELECT round(sum(distance_km)::numeric) FROM flights_pg) as total_distance
  `);
  return result[0];
}

export async function getRecentNotableFlights(limit = 20) {
  return db.execute(sql`
    SELECT f.id, f.start_time, f.distance_km, f.score, f.airtime, f.type, f.url,
           p.name as pilot_name, p.username as pilot_username,
           t.name as takeoff_name, t.id as takeoff_id,
           g.name as glider_name, g.category as glider_category
    FROM flights_pg f
    JOIN pilots p ON f.pilot_id = p.id
    LEFT JOIN takeoffs t ON f.takeoff_id = t.id
    JOIN gliders g ON f.glider_id = g.id
    WHERE f.distance_km > 50
      AND f.start_time > now() - interval '30 days'
    ORDER BY f.distance_km DESC
    LIMIT ${limit}
  `);
}

export async function getSeasonHeatmap() {
  return db.execute(sql`
    SELECT
      EXTRACT(YEAR FROM start_time)::int as year,
      EXTRACT(MONTH FROM start_time)::int as month,
      count(*)::int as flight_count,
      round(avg(score)::numeric, 1) as avg_score
    FROM flights_pg
    GROUP BY year, month
    ORDER BY year, month
  `);
}

export async function getTopTakeoffs(limit = 5) {
  return db.execute(sql`
    SELECT t.id, t.name, count(*)::int as flight_count
    FROM flights_pg f
    JOIN takeoffs t ON f.takeoff_id = t.id
    GROUP BY t.id, t.name
    ORDER BY flight_count DESC
    LIMIT ${limit}
  `);
}

export async function getTopPilots(limit = 5) {
  return db.execute(sql`
    SELECT p.id, p.name, p.username, count(*)::int as flight_count,
           round(sum(f.distance_km)::numeric) as total_km
    FROM flights_pg f
    JOIN pilots p ON f.pilot_id = p.id
    GROUP BY p.id, p.name, p.username
    ORDER BY total_km DESC
    LIMIT ${limit}
  `);
}

// ============ TAKEOFFS LIST ============

export async function getTakeoffsList() {
  return db.execute(sql`
    WITH takeoff_stats AS (
      SELECT
        f.takeoff_id,
        count(*)::int as flight_count,
        count(DISTINCT f.pilot_id)::int as pilot_count,
        max(f.distance_km) as record_km,
        max(f.start_time) as last_activity,
        round(avg(CASE WHEN rn <= 10 THEN distance_km END)::numeric, 1) as xc_potential,
        round(100.0 * count(*) FILTER (WHERE EXTRACT(DOW FROM f.start_time) IN (0, 6)) / NULLIF(count(*), 0))::int as weekend_pct,
        count(*) FILTER (WHERE f.distance_km >= 100)::int as flights_100k,
        round(avg(f.distance_km)::numeric, 1) as avg_distance
      FROM (
        SELECT *, row_number() OVER (PARTITION BY takeoff_id ORDER BY distance_km DESC) as rn
        FROM flights_pg
        WHERE takeoff_id IS NOT NULL
      ) f
      GROUP BY f.takeoff_id
    ),
    monthly AS (
      SELECT takeoff_id,
        json_agg(json_build_object('month', month, 'count', cnt) ORDER BY month) as monthly_data
      FROM (
        SELECT takeoff_id,
          EXTRACT(MONTH FROM start_time)::int as month,
          count(*)::int as cnt
        FROM flights_pg
        WHERE takeoff_id IS NOT NULL
        GROUP BY takeoff_id, month
      ) sub
      GROUP BY takeoff_id
    ),
    wing_stats AS (
      SELECT f.takeoff_id,
        round(100.0 * count(*) FILTER (WHERE g.category IN ('A', 'B')) / NULLIF(count(*), 0))::int as ab_pct
      FROM flights_pg f
      JOIN gliders g ON f.glider_id = g.id
      WHERE f.takeoff_id IS NOT NULL
      GROUP BY f.takeoff_id
    )
    SELECT
      t.id, t.name,
      ST_Y(t.centroid::geometry) as lat,
      ST_X(t.centroid::geometry) as lng,
      COALESCE(ts.flight_count, 0) as flight_count,
      COALESCE(ts.pilot_count, 0) as pilot_count,
      ts.xc_potential,
      ts.record_km,
      ts.last_activity,
      ts.weekend_pct,
      ts.flights_100k,
      ts.avg_distance,
      ws.ab_pct,
      m.monthly_data
    FROM takeoffs t
    LEFT JOIN takeoff_stats ts ON t.id = ts.takeoff_id
    LEFT JOIN wing_stats ws ON t.id = ws.takeoff_id
    LEFT JOIN monthly m ON t.id = m.takeoff_id
    ORDER BY ts.flight_count DESC NULLS LAST
  `);
}

// ============ TAKEOFF DETAIL ============

export async function getTakeoffById(id: number) {
  const rows = await db.execute(sql`
    SELECT t.id, t.name,
           ST_Y(t.centroid::geometry) as lat,
           ST_X(t.centroid::geometry) as lng
    FROM takeoffs t WHERE t.id = ${id}
  `);
  return rows[0] || null;
}

export async function getTakeoffCalendarHeatmap(takeoffId: number) {
  return db.execute(sql`
    SELECT
      EXTRACT(YEAR FROM start_time)::int as year,
      EXTRACT(MONTH FROM start_time)::int as month,
      count(*)::int as flight_count,
      round(avg(score)::numeric, 1) as avg_score
    FROM flights_pg
    WHERE takeoff_id = ${takeoffId}
    GROUP BY year, month
    ORDER BY year, month
  `);
}

export async function getTakeoffMonthlyStats(takeoffId: number) {
  return db.execute(sql`
    SELECT
      EXTRACT(MONTH FROM start_time)::int as month,
      count(*)::int as flight_count,
      round(avg(distance_km)::numeric, 1) as avg_distance
    FROM flights_pg
    WHERE takeoff_id = ${takeoffId}
    GROUP BY month
    ORDER BY month
  `);
}

export async function getTakeoffHourlyDistribution(takeoffId: number) {
  return db.execute(sql`
    SELECT
      EXTRACT(HOUR FROM start_time)::int as hour,
      count(*)::int as flight_count
    FROM flights_pg
    WHERE takeoff_id = ${takeoffId} AND distance_km > 20
    GROUP BY hour
    ORDER BY hour
  `);
}

export async function getTakeoffDayOfWeek(takeoffId: number) {
  return db.execute(sql`
    SELECT
      EXTRACT(DOW FROM start_time)::int as dow,
      count(*)::int as flight_count
    FROM flights_pg
    WHERE takeoff_id = ${takeoffId}
    GROUP BY dow
    ORDER BY dow
  `);
}

export async function getTakeoffDistanceHistogram(takeoffId: number) {
  return db.execute(sql`
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
    FROM flights_pg
    WHERE takeoff_id = ${takeoffId}
    GROUP BY bucket
    ORDER BY min(distance_km)
  `);
}

export async function getTakeoffTop10(takeoffId: number) {
  return db.execute(sql`
    SELECT f.start_time, f.distance_km, f.score, f.airtime, f.url, f.type,
           p.name as pilot_name, p.username as pilot_username,
           g.name as glider_name, g.category as glider_category
    FROM flights_pg f
    JOIN pilots p ON f.pilot_id = p.id
    JOIN gliders g ON f.glider_id = g.id
    WHERE f.takeoff_id = ${takeoffId}
    ORDER BY f.distance_km DESC
    LIMIT 10
  `);
}

export async function getTakeoffWingClasses(takeoffId: number) {
  return db.execute(sql`
    SELECT g.category, count(*)::int as cnt
    FROM flights_pg f
    JOIN gliders g ON f.glider_id = g.id
    WHERE f.takeoff_id = ${takeoffId}
    GROUP BY g.category
    ORDER BY cnt DESC
  `);
}

export async function getTakeoffTopGliders(takeoffId: number) {
  return db.execute(sql`
    SELECT g.name, g.category, count(*)::int as cnt
    FROM flights_pg f
    JOIN gliders g ON f.glider_id = g.id
    WHERE f.takeoff_id = ${takeoffId}
    GROUP BY g.name, g.category
    ORDER BY cnt DESC
    LIMIT 5
  `);
}

export async function getTakeoffYearlyTrend(takeoffId: number) {
  return db.execute(sql`
    SELECT
      EXTRACT(YEAR FROM start_time)::int as year,
      count(*)::int as flight_count,
      round(sum(distance_km)::numeric) as total_km
    FROM flights_pg
    WHERE takeoff_id = ${takeoffId}
    GROUP BY year
    ORDER BY year
  `);
}

export async function getTakeoffBusiestDays(takeoffId: number) {
  return db.execute(sql`
    SELECT
      start_time::date as day,
      count(*)::int as flight_count,
      count(DISTINCT pilot_id)::int as pilot_count,
      round(max(distance_km)::numeric, 1) as max_distance
    FROM flights_pg
    WHERE takeoff_id = ${takeoffId}
    GROUP BY day
    ORDER BY pilot_count DESC
    LIMIT 5
  `);
}

// ============ PILOTS LIST ============

export async function getPilotsList() {
  return db.execute(sql`
    WITH pilot_stats AS (
      SELECT
        f.pilot_id,
        count(*)::int as flight_count,
        round(sum(f.distance_km)::numeric) as total_km,
        round(sum(f.score)::numeric) as total_score,
        round(avg(f.distance_km)::numeric, 1) as avg_distance,
        max(f.distance_km) as max_distance,
        count(DISTINCT EXTRACT(YEAR FROM f.start_time))::int as active_years,
        max(f.start_time) as last_flight
      FROM flights_pg f
      GROUP BY f.pilot_id
    ),
    fav_site AS (
      SELECT DISTINCT ON (f.pilot_id)
        f.pilot_id, t.id as takeoff_id, t.name as takeoff_name, count(*)::int as cnt
      FROM flights_pg f
      JOIN takeoffs t ON f.takeoff_id = t.id
      GROUP BY f.pilot_id, t.id, t.name
      ORDER BY f.pilot_id, cnt DESC
    )
    SELECT
      p.id, p.name, p.username,
      ps.flight_count, ps.total_km, ps.total_score,
      ps.avg_distance, ps.max_distance,
      ps.active_years, ps.last_flight,
      fs.takeoff_id as fav_takeoff_id,
      fs.takeoff_name as fav_takeoff_name
    FROM pilots p
    JOIN pilot_stats ps ON p.id = ps.pilot_id
    LEFT JOIN fav_site fs ON p.id = fs.pilot_id
    ORDER BY ps.total_km DESC
  `);
}

// ============ PILOT DETAIL ============

export async function getPilotByUsername(username: string) {
  const rows = await db.execute(sql`
    SELECT p.id, p.name, p.username
    FROM pilots p WHERE p.username = ${username}
  `);
  return rows[0] || null;
}

export async function getPilotStats(pilotId: number) {
  const rows = await db.execute(sql`
    SELECT
      count(*)::int as total_flights,
      round(sum(distance_km)::numeric) as total_km,
      round(sum(score)::numeric) as total_score,
      max(distance_km) as max_distance,
      round(avg(distance_km)::numeric, 1) as avg_distance,
      min(EXTRACT(YEAR FROM start_time))::int as active_since,
      max(start_time) as last_flight
    FROM flights_pg WHERE pilot_id = ${pilotId}
  `);
  return rows[0];
}

export async function getPilotFavoriteTakeoff(pilotId: number) {
  const rows = await db.execute(sql`
    SELECT t.id, t.name, count(*)::int as cnt
    FROM flights_pg f
    JOIN takeoffs t ON f.takeoff_id = t.id
    WHERE f.pilot_id = ${pilotId}
    GROUP BY t.id, t.name
    ORDER BY cnt DESC
    LIMIT 1
  `);
  return rows[0] || null;
}

export async function getPilotYearlyStats(pilotId: number) {
  return db.execute(sql`
    SELECT
      EXTRACT(YEAR FROM start_time)::int as year,
      count(*)::int as flight_count,
      round(avg(distance_km)::numeric, 1) as avg_distance,
      max(distance_km) as max_distance
    FROM flights_pg
    WHERE pilot_id = ${pilotId}
    GROUP BY year
    ORDER BY year
  `);
}

export async function getPilotSiteMap(pilotId: number) {
  return db.execute(sql`
    SELECT t.id, t.name,
           ST_Y(t.centroid::geometry) as lat,
           ST_X(t.centroid::geometry) as lng,
           count(*)::int as flight_count
    FROM flights_pg f
    JOIN takeoffs t ON f.takeoff_id = t.id
    WHERE f.pilot_id = ${pilotId}
    GROUP BY t.id, t.name, t.centroid
    ORDER BY flight_count DESC
  `);
}

export async function getPilotEquipmentTimeline(pilotId: number) {
  return db.execute(sql`
    SELECT
      g.name, g.category,
      count(*)::int as flight_count,
      min(f.start_time) as first_used,
      max(f.start_time) as last_used
    FROM flights_pg f
    JOIN gliders g ON f.glider_id = g.id
    WHERE f.pilot_id = ${pilotId}
    GROUP BY g.name, g.category
    ORDER BY first_used
  `);
}

export async function getPilotActivityHeatmap(pilotId: number) {
  return db.execute(sql`
    SELECT
      EXTRACT(YEAR FROM start_time)::int as year,
      EXTRACT(MONTH FROM start_time)::int as month,
      count(*)::int as flight_count
    FROM flights_pg
    WHERE pilot_id = ${pilotId}
    GROUP BY year, month
    ORDER BY year, month
  `);
}

export async function getPilotTopFlights(pilotId: number) {
  return db.execute(sql`
    SELECT f.start_time, f.distance_km, f.score, f.airtime, f.url, f.type,
           t.name as takeoff_name, t.id as takeoff_id,
           g.name as glider_name, g.category as glider_category
    FROM flights_pg f
    LEFT JOIN takeoffs t ON f.takeoff_id = t.id
    JOIN gliders g ON f.glider_id = g.id
    WHERE f.pilot_id = ${pilotId}
    ORDER BY f.distance_km DESC
    LIMIT 10
  `);
}

export async function getPilotDistanceHistogram(pilotId: number) {
  return db.execute(sql`
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
    FROM flights_pg
    WHERE pilot_id = ${pilotId}
    GROUP BY bucket
    ORDER BY min(distance_km)
  `);
}

// ============ WINGS LIST ============

export async function getWingsList() {
  return db.execute(sql`
    WITH wing_stats AS (
      SELECT
        f.glider_id,
        count(*)::int as flight_count,
        count(DISTINCT f.pilot_id)::int as pilot_count,
        round(sum(f.distance_km)::numeric) as total_km,
        round(avg(f.distance_km)::numeric, 1) as avg_distance,
        max(f.distance_km) as max_distance,
        round(avg(CASE WHEN f.airtime > 0 THEN f.distance_km / (f.airtime / 60.0) END)::numeric, 1) as avg_speed,
        min(EXTRACT(YEAR FROM f.start_time))::int as first_year,
        max(EXTRACT(YEAR FROM f.start_time))::int as last_year,
        max(f.start_time) as last_flight
      FROM flights_pg f
      GROUP BY f.glider_id
    )
    SELECT
      g.id, g.name, g.category,
      ws.flight_count, ws.pilot_count, ws.total_km,
      ws.avg_distance, ws.max_distance, ws.avg_speed,
      ws.first_year, ws.last_year, ws.last_flight
    FROM gliders g
    JOIN wing_stats ws ON g.id = ws.glider_id
    ORDER BY ws.flight_count DESC
  `);
}

// ============ WING DETAIL ============

export async function getWingById(id: number) {
  const rows = await db.execute(sql`
    SELECT g.id, g.name, g.category
    FROM gliders g WHERE g.id = ${id}
  `);
  return rows[0] || null;
}

export async function getWingTopFlights(wingId: number) {
  return db.execute(sql`
    SELECT f.start_time, f.distance_km, f.score, f.airtime, f.url, f.type,
           p.name as pilot_name, p.username as pilot_username,
           t.name as takeoff_name, t.id as takeoff_id,
           g.name as glider_name, g.category as glider_category
    FROM flights_pg f
    JOIN pilots p ON f.pilot_id = p.id
    LEFT JOIN takeoffs t ON f.takeoff_id = t.id
    JOIN gliders g ON f.glider_id = g.id
    WHERE f.glider_id = ${wingId}
    ORDER BY f.distance_km DESC
    LIMIT 10
  `);
}

export async function getWingDistanceHistogram(wingId: number) {
  return db.execute(sql`
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
    FROM flights_pg
    WHERE glider_id = ${wingId}
    GROUP BY bucket
    ORDER BY min(distance_km)
  `);
}

export async function getWingAdoptionCurve(wingId: number) {
  return db.execute(sql`
    SELECT
      EXTRACT(YEAR FROM start_time)::int as year,
      count(DISTINCT pilot_id)::int as pilot_count
    FROM flights_pg
    WHERE glider_id = ${wingId}
    GROUP BY year
    ORDER BY year
  `);
}

export async function getWingYearlyStats(wingId: number) {
  return db.execute(sql`
    SELECT
      EXTRACT(YEAR FROM start_time)::int as year,
      count(*)::int as flight_count,
      round(sum(distance_km)::numeric) as total_km
    FROM flights_pg
    WHERE glider_id = ${wingId}
    GROUP BY year
    ORDER BY year
  `);
}

export async function getWingFavoriteTakeoffs(wingId: number) {
  return db.execute(sql`
    SELECT t.id, t.name, count(*)::int as flight_count
    FROM flights_pg f
    JOIN takeoffs t ON f.takeoff_id = t.id
    WHERE f.glider_id = ${wingId}
    GROUP BY t.id, t.name
    ORDER BY flight_count DESC
    LIMIT 5
  `);
}

export async function getWingCalendarHeatmap(wingId: number) {
  return db.execute(sql`
    SELECT
      EXTRACT(YEAR FROM start_time)::int as year,
      EXTRACT(MONTH FROM start_time)::int as month,
      count(*)::int as flight_count,
      round(avg(score)::numeric, 1) as avg_score
    FROM flights_pg
    WHERE glider_id = ${wingId}
    GROUP BY year, month
    ORDER BY year, month
  `);
}

// ============ FLIGHTS EXPLORER ============

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

// ============ RECORDS ============

export async function getAllTimeRecords() {
  const [longest, longestAirtime, highestScore] = await Promise.all([
    db.execute(sql`
      SELECT f.distance_km, f.score, f.airtime, f.start_time, f.url,
             p.name as pilot_name, p.username as pilot_username,
             t.name as takeoff_name, t.id as takeoff_id,
             g.id as glider_id, g.name as glider_name, g.category as glider_category
      FROM flights_pg f
      JOIN pilots p ON f.pilot_id = p.id
      LEFT JOIN takeoffs t ON f.takeoff_id = t.id
      JOIN gliders g ON f.glider_id = g.id
      ORDER BY f.distance_km DESC LIMIT 1
    `),
    db.execute(sql`
      SELECT f.distance_km, f.score, f.airtime, f.start_time, f.url,
             p.name as pilot_name, p.username as pilot_username,
             t.name as takeoff_name, t.id as takeoff_id,
             g.id as glider_id, g.name as glider_name, g.category as glider_category
      FROM flights_pg f
      JOIN pilots p ON f.pilot_id = p.id
      LEFT JOIN takeoffs t ON f.takeoff_id = t.id
      JOIN gliders g ON f.glider_id = g.id
      WHERE f.airtime <= 600
      ORDER BY f.airtime DESC LIMIT 1
    `),
    db.execute(sql`
      SELECT f.distance_km, f.score, f.airtime, f.start_time, f.url,
             p.name as pilot_name, p.username as pilot_username,
             t.name as takeoff_name, t.id as takeoff_id,
             g.id as glider_id, g.name as glider_name, g.category as glider_category
      FROM flights_pg f
      JOIN pilots p ON f.pilot_id = p.id
      LEFT JOIN takeoffs t ON f.takeoff_id = t.id
      JOIN gliders g ON f.glider_id = g.id
      ORDER BY f.score DESC LIMIT 1
    `),
  ]);

  return {
    longest: longest[0],
    longestAirtime: longestAirtime[0],
    highestScore: highestScore[0],
  };
}

export async function getCategoryRecords() {
  return db.execute(sql`
    SELECT DISTINCT ON (g.category)
      g.category, f.distance_km, f.score, f.start_time, f.airtime, f.url,
      p.name as pilot_name, p.username as pilot_username,
      t.name as takeoff_name, t.id as takeoff_id,
      g.id as glider_id, g.name as glider_name
    FROM flights_pg f
    JOIN pilots p ON f.pilot_id = p.id
    LEFT JOIN takeoffs t ON f.takeoff_id = t.id
    JOIN gliders g ON f.glider_id = g.id
    ORDER BY g.category, f.distance_km DESC
  `);
}

export async function getSiteRecords() {
  return db.execute(sql`
    SELECT DISTINCT ON (t.id)
      t.id as takeoff_id, t.name as takeoff_name,
      f.distance_km, f.start_time, f.url,
      p.name as pilot_name, p.username as pilot_username,
      g.name as glider_name
    FROM flights_pg f
    JOIN pilots p ON f.pilot_id = p.id
    JOIN takeoffs t ON f.takeoff_id = t.id
    JOIN gliders g ON f.glider_id = g.id
    ORDER BY t.id, f.distance_km DESC
  `);
}

export async function getAnnualRecords() {
  return db.execute(sql`
    SELECT DISTINCT ON (year)
      EXTRACT(YEAR FROM f.start_time)::int as year,
      f.distance_km, f.score, f.airtime, f.start_time, f.url,
      p.name as pilot_name, p.username as pilot_username,
      t.name as takeoff_name, t.id as takeoff_id,
      g.id as glider_id, g.name as glider_name
    FROM flights_pg f
    JOIN pilots p ON f.pilot_id = p.id
    LEFT JOIN takeoffs t ON f.takeoff_id = t.id
    JOIN gliders g ON f.glider_id = g.id
    ORDER BY year, f.distance_km DESC
  `);
}

export async function getFunStats() {
  const [epicDay, mostFlightsDay, mostSitesPilot, mostConsistent] = await Promise.all([
    db.execute(sql`
      SELECT start_time::date as day, count(*)::int as flight_count,
             count(DISTINCT pilot_id)::int as pilot_count,
             count(DISTINCT pilot_id) FILTER (WHERE distance_km >= 300)::int as pilots_300k
      FROM flights_pg
      GROUP BY day
      HAVING count(DISTINCT pilot_id) FILTER (WHERE distance_km >= 300) > 0
      ORDER BY pilots_300k DESC, flight_count DESC
      LIMIT 1
    `),
    db.execute(sql`
      SELECT start_time::date as day, count(*)::int as flight_count,
             count(DISTINCT pilot_id)::int as pilot_count
      FROM flights_pg
      GROUP BY day
      ORDER BY flight_count DESC
      LIMIT 1
    `),
    db.execute(sql`
      SELECT p.name, p.username, count(DISTINCT f.takeoff_id)::int as site_count
      FROM flights_pg f
      JOIN pilots p ON f.pilot_id = p.id
      GROUP BY p.id, p.name, p.username
      ORDER BY site_count DESC
      LIMIT 1
    `),
    db.execute(sql`
      SELECT p.name, p.username,
             count(DISTINCT EXTRACT(YEAR FROM f.start_time))::int as years_active
      FROM flights_pg f
      JOIN pilots p ON f.pilot_id = p.id
      GROUP BY p.id, p.name, p.username
      ORDER BY years_active DESC
      LIMIT 1
    `),
  ]);

  return {
    epicDay: epicDay[0],
    mostFlightsDay: mostFlightsDay[0],
    mostSitesPilot: mostSitesPilot[0],
    mostConsistent: mostConsistent[0],
  };
}

// ============ HEALTHCHECK ============

export async function healthcheck() {
  await db.execute(sql`SELECT 1`);
}
