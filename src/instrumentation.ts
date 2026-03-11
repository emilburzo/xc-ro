export async function register() {
  // Only run on the Node.js server runtime, not on Edge
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { db } = await import("@/lib/db");
    const { sql } = await import("drizzle-orm");
    try {
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY pilot_dna_mv`);
    } catch (e) {
      console.error("Failed to refresh pilot_dna_mv:", e);
    }
  }
}
