import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@rezaru/database";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().min(10).max(5000).optional(),
  tags: z.array(z.string().max(40)).max(20).optional()
}).refine((value) => Object.keys(value).length > 0);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    const { id } = await params;
    const outcome = await prisma.outcome.findFirst({
      where: { id, workspaceId: context.workspaceId, deletedAt: null },
      include: {
        workflowVersions: { orderBy: { version: "desc" } },
        connections: { include: { connection: { select: { id: true, name: true, connectorKey: true, status: true } } } },
        executions: { orderBy: { createdAt: "desc" }, take: 20 },
        suggestions: { where: { status: "PENDING" } },
        webhooks: true
      }
    });
    if (!outcome) throw Object.assign(new Error("Outcome not found"), { status: 404, code: "NOT_FOUND" });
    return outcome;
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "createOutcome");
    const { id } = await params;
    const input = patchSchema.parse(await request.json());
    const updated = await prisma.outcome.updateMany({
      where: { id, workspaceId: context.workspaceId, deletedAt: null },
      data: input
    });
    if (!updated.count) throw Object.assign(new Error("Outcome not found"), { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "outcome.modified", entityType: "Outcome", entityId: id, metadata: { fields: Object.keys(input) } });
    return prisma.outcome.findUnique({ where: { id } });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "createOutcome");
    const { id } = await params;
    const updated = await prisma.outcome.updateMany({
      where: { id, workspaceId: context.workspaceId, deletedAt: null },
      data: { deletedAt: new Date(), status: "ARCHIVED" }
    });
    if (!updated.count) throw Object.assign(new Error("Outcome not found"), { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "outcome.archived", entityType: "Outcome", entityId: id });
    return { archived: true };
  });
}
