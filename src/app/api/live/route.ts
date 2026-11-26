// Liveness: answers without the database, which /api/health checks for readiness.
export const dynamic = "force-dynamic";

export function GET() {
    return Response.json({status: "ok"});
}
