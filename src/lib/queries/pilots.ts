import { db } from "../db";
import { sql } from "drizzle-orm";

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
