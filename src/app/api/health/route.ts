import {healthcheck} from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await healthcheck();
        return Response.json({status: "ok"});
    } catch (e) {
        console.error("Healthcheck failed:", e);
        return Response.json({status: "error"}, {status: 503});
    }
}
