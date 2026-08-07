import { randomBytes } from "node:crypto";
import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { hashSecret } from "@/lib/encryption";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@rezaru/database";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(80),
  scopes: z.array(z.enum(["outcomes:read", "outcomes:trigger", "executions:read"])).min(1)
});

export async function GET() {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "manageApiKeys");
    return prisma.apiKey.findMany({
      where: { workspaceId: context.workspaceId, revokedAt: null },
      select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
  });
}

export async function POST(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "manageApiKeys");
    const input = schema.parse(await request.json());
    const raw = `oos_${randomBytes(32).toString("base64url")}`;
    const key = await prisma.apiKey.create({
      data: {
        workspaceId: context.workspaceId,
        createdById: context.userId,
        name: input.name,
        prefix: raw.slice(0, 12),
        keyHash: hashSecret(raw),
        scopes: input.scopes
      },
      select: { id: true, name: true, prefix: true, scopes: true, createdAt: true }
    });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "api_key.created", entityType: "ApiKey", entityId: key.id, metadata: { scopes: input.scopes } });
    return { ...key, key: raw, notice: "This key is shown once. Store it securely." };
  });
}
