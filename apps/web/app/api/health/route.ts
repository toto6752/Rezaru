import { executionQueue } from "@/lib/queue";
import { prisma } from "@rezaru/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const checks: Record<string, { status: "ok" | "error"; latencyMs?: number }> = {};
  try {
    const databaseStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latencyMs: Date.now() - databaseStart };
  } catch {
    checks.database = { status: "error" };
  }
  try {
    const queueStart = Date.now();
    await executionQueue().getJobCounts("waiting", "active", "failed", "delayed");
    checks.queue = { status: "ok", latencyMs: Date.now() - queueStart };
  } catch {
    checks.queue = { status: "error" };
  }
  const healthy = Object.values(checks).every((check) => check.status === "ok");
  return Response.json({
    status: healthy ? "ok" : "degraded",
    service: "rezaru-web",
    checks,
    durationMs: Date.now() - started,
    timestamp: new Date().toISOString()
  }, { status: healthy ? 200 : 503 });
}
