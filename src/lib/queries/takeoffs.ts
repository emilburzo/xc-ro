import { db } from "../db";
import { sql } from "drizzle-orm";

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
