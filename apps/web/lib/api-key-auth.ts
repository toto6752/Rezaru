import { hashSecret } from "@/lib/encryption";
import { assertRateLimit } from "@/lib/rate-limit";
import { prisma } from "@outcomeos/database";

export async function authenticateApiKey(request: Request, requiredScope: string) {
  const raw = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!raw?.startsWith("oos_")) throw Object.assign(new Error("A valid OutcomeOS API key is required"), { status: 401, code: "INVALID_API_KEY" });
  assertRateLimit(`api:${raw.slice(0, 12)}`, 120, 60_000);
  const key = await prisma.apiKey.findUnique({ where: { keyHash: hashSecret(raw) } });
  if (!key || key.revokedAt || (key.expiresAt && key.expiresAt < new Date())) throw Object.assign(new Error("API key is invalid or expired"), { status: 401, code: "INVALID_API_KEY" });
  if (!key.scopes.includes(requiredScope)) throw Object.assign(new Error(`API key lacks the ${requiredScope} scope`), { status: 403, code: "INSUFFICIENT_SCOPE" });
  await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
  return { workspaceId: key.workspaceId, apiKeyId: key.id };
}
