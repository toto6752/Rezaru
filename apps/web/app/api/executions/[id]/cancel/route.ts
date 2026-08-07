import { withApi } from "@/lib/api";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@rezaru/database";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "activateOutcome");
    const { id } = await params;
    const result = await prisma.execution.updateMany({
      where: { id, workspaceId: context.workspaceId, status: { in: ["QUEUED", "RUNNING", "WAITING", "WAITING_FOR_APPROVAL"] } },
      data: { status: "CANCELLED", cancelledAt: new Date(), completedAt: new Date() }
    });
    if (!result.count) throw Object.assign(new Error("Execution is already complete or was not found"), { status: 409, code: "NOT_CANCELLABLE" });
    return { id, status: "CANCELLED" };
  });
}
