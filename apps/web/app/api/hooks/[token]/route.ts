import { createExecution } from "@/lib/executions";
import { hashSecret, verifySecret } from "@/lib/encryption";
import { assertRateLimit } from "@/lib/rate-limit";
import { prisma, Prisma } from "@rezaru/database";

async function handle(request: Request, token: string) {
  assertRateLimit(`webhook:${token.slice(0, 12)}`, 120, 60_000);
  const endpoint = await prisma.webhookEndpoint.findUnique({
    where: { pathTokenHash: hashSecret(token) },
    include: { outcome: { select: { status: true } } }
  });
  if (!endpoint || !endpoint.enabled) return Response.json({ error: { code: "NOT_FOUND", message: "Webhook endpoint not found" } }, { status: 404 });
  if (endpoint.mode === "production" && endpoint.outcome.status !== "ACTIVE") return Response.json({ error: { code: "OUTCOME_INACTIVE", message: "This outcome is not active" } }, { status: 409 });
  if (endpoint.secretHash) {
    const secret = request.headers.get("x-rezaru-secret") ?? "";
    if (!verifySecret(secret, endpoint.secretHash)) return Response.json({ error: { code: "INVALID_SIGNATURE", message: "Webhook secret verification failed" } }, { status: 401 });
  }
  const url = new URL(request.url);
  let body: Record<string, unknown> = {};
  if (!["GET", "HEAD"].includes(request.method)) {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) body = await request.json() as Record<string, unknown>;
    else if (contentType.includes("form")) body = Object.fromEntries(await request.formData());
    else body = { raw: await request.text() };
  }
  const payload = {
    method: request.method,
    query: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries([...request.headers.entries()].filter(([key]) => !["authorization", "cookie", "x-rezaru-secret"].includes(key.toLowerCase()))),
    body
  };
  if (endpoint.mode === "test") await prisma.webhookEndpoint.update({ where: { id: endpoint.id }, data: { samplePayload: payload as Prisma.InputJsonValue } });
  const execution = await createExecution({
    workspaceId: endpoint.workspaceId,
    outcomeId: endpoint.outcomeId,
    triggerInput: payload,
    mode: endpoint.mode === "test" ? "demo" : "production",
    idempotencyKey: request.headers.get("idempotency-key") ?? undefined
  });
  return Response.json({ data: { executionId: execution.id, status: execution.status, simulated: endpoint.mode === "test" } }, { status: 202 });
}

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  return handle(request, (await params).token);
}
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  return handle(request, (await params).token);
}
