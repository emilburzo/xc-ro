import { db } from "../db";
import { sql } from "drizzle-orm";

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
