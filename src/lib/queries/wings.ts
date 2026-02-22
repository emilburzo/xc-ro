import { db } from "../db";
import { sql } from "drizzle-orm";

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
