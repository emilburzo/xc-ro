import { db } from "../db";
import { sql } from "drizzle-orm";

export async function healthcheck() {
  await db.execute(sql`SELECT 1`);
}
