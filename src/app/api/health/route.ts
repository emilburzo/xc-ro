import {db} from "@/lib/db";
import {sql} from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await db.execute(sql`SELECT 1`);
        return Response.json({status: "ok"});
    } catch (e) {
        console.error("Healthcheck failed:", e);
        return Response.json({status: "error"}, {status: 503});
    }
}
