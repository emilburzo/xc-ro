import { db } from "../db";
import { sql } from "drizzle-orm";

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
