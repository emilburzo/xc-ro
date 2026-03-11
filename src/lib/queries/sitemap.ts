import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function getSitemapTakeoffs(): Promise<
  { id: number; name: string }[]
> {
  return db.execute(
    sql`SELECT id, name FROM takeoffs ORDER BY id`,
  ) as any;
}

export async function getSitemapPilots(): Promise<
  { username: string }[]
> {
  return db.execute(
    sql`SELECT username FROM pilots ORDER BY id`,
  ) as any;
}

export async function getSitemapWings(): Promise<
  { id: number; name: string }[]
> {
  return db.execute(
    sql`SELECT id, name FROM gliders ORDER BY id`,
  ) as any;
}
