import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { enqueueExecution } from "@/lib/queue";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@rezaru/database";
import { z } from "zod";

const schema = z.object({ comment: z.string().max(1000).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "approve");
    const { id } = await params;
    const { comment } = schema.parse(await request.json().catch(() => ({})));
    const approval = await prisma.approvalRequest.findFirst({
      where: { id, status: "PENDING", execution: { workspaceId: context.workspaceId } },
      include: { executionStep: true }
    });
    if (!approval) throw Object.assign(new Error("Pending approval not found"), { status: 404, code: "NOT_FOUND" });
    await prisma.$transaction([
      prisma.approvalRequest.update({ where: { id }, data: { status: "APPROVED", comment, resolvedById: context.userId, resolvedAt: new Date() } }),
      prisma.executionStep.update({ where: { id: approval.executionStepId }, data: { status: "SUCCEEDED", completedAt: new Date(), output: { approved: true, comment: comment ?? null } } }),
      prisma.execution.update({ where: { id: approval.executionId }, data: { status: "QUEUED" } })
    ]);
    await enqueueExecution(approval.executionId, { resumeAfterStepId: approval.executionStep.stepId });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "approval.approved", entityType: "ApprovalRequest", entityId: id });
    return { status: "APPROVED", executionId: approval.executionId };
  });
}
