import { withApi } from "@/lib/api";
import { enqueueExecution } from "@/lib/queue";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma, Prisma } from "@rezaru/database";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "activateOutcome");
    const { id } = await params;
    const execution = await prisma.execution.findFirst({
      where: { id, workspaceId: context.workspaceId },
      include: { steps: { where: { status: "FAILED" }, orderBy: { startedAt: "asc" }, take: 1 } }
    });
    if (!execution) throw Object.assign(new Error("Execution not found"), { status: 404, code: "NOT_FOUND" });
    const failed = execution.steps[0];
    if (!failed) throw Object.assign(new Error("This execution has no failed step to retry"), { status: 409, code: "NO_FAILED_STEP" });
    await prisma.$transaction([
      prisma.execution.update({ where: { id }, data: { status: "QUEUED", error: Prisma.JsonNull, completedAt: null } }),
      prisma.executionStep.update({ where: { id: failed.id }, data: { status: "PENDING", error: Prisma.JsonNull, completedAt: null } })
    ]);
    await enqueueExecution(id, { startAtStepId: failed.stepId });
    return { id, status: "QUEUED", retryFromStepId: failed.stepId };
  });
}
