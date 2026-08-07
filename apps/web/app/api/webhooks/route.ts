import { randomBytes } from "node:crypto";
import { withApi } from "@/lib/api";
import { hashSecret } from "@/lib/encryption";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@rezaru/database";
import { z } from "zod";

const schema = z.object({
  outcomeId: z.string().uuid(),
  mode: z.enum(["test", "production"]),
  secret: z.string().min(16).max(200).optional()
});

export async function GET() {
  return withApi(async () => {
    const context = await requireWorkspace();
    return prisma.webhookEndpoint.findMany({
      where: { workspaceId: context.workspaceId },
      select: { id: true, outcomeId: true, pathPrefix: true, mode: true, enabled: true, samplePayload: true, createdAt: true, outcome: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    });
  });
}

export async function POST(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "createOutcome");
    const input = schema.parse(await request.json());
    const outcome = await prisma.outcome.findFirst({ where: { id: input.outcomeId, workspaceId: context.workspaceId, deletedAt: null } });
    if (!outcome) throw Object.assign(new Error("Outcome not found"), { status: 404, code: "NOT_FOUND" });
    const token = randomBytes(30).toString("base64url");
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        workspaceId: context.workspaceId,
        outcomeId: outcome.id,
        mode: input.mode,
        pathTokenHash: hashSecret(token),
        pathPrefix: token.slice(0, 8),
        secretHash: input.secret ? hashSecret(input.secret) : null
      }
    });
    return {
      id: endpoint.id,
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/hooks/${token}`,
      mode: endpoint.mode,
      secretConfigured: Boolean(input.secret),
      notice: "This webhook URL is shown once. Store it securely."
    };
  });
}
