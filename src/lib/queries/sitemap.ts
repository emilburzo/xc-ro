import { db } from "../db";
import { sql } from "drizzle-orm";

export async function getSitemapTakeoffs() {
  return db.execute(
    sql`SELECT id, name FROM takeoffs ORDER BY id`,
  );
}

export async function getSitemapPilots() {
  return db.execute(
    sql`SELECT username FROM pilots ORDER BY id`,
  );
}

export async function getSitemapWings() {
  return db.execute(
    sql`SELECT id, name FROM gliders ORDER BY id`,
  );
}
