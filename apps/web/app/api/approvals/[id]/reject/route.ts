import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";
import { z } from "zod";

const schema = z.object({ comment: z.string().max(1000).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "approve");
    const { id } = await params;
    const { comment } = schema.parse(await request.json().catch(() => ({})));
    const approval = await prisma.approvalRequest.findFirst({
      where: { id, status: "PENDING", execution: { workspaceId: context.workspaceId } }
    });
    if (!approval) throw Object.assign(new Error("Pending approval not found"), { status: 404, code: "NOT_FOUND" });
    await prisma.$transaction([
      prisma.approvalRequest.update({ where: { id }, data: { status: "REJECTED", comment, resolvedById: context.userId, resolvedAt: new Date() } }),
      prisma.executionStep.update({ where: { id: approval.executionStepId }, data: { status: "FAILED", completedAt: new Date(), error: { code: "APPROVAL_REJECTED", message: "The requested action was rejected." } } }),
      prisma.execution.update({ where: { id: approval.executionId }, data: { status: "FAILED", completedAt: new Date(), error: { code: "APPROVAL_REJECTED", message: "The requested action was rejected." } } })
    ]);
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "approval.rejected", entityType: "ApprovalRequest", entityId: id });
    return { status: "REJECTED", executionId: approval.executionId };
  });
}
