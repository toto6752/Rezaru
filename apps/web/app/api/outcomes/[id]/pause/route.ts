import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";
import { unscheduleOutcome } from "@/lib/queue";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "activateOutcome");
    const { id } = await params;
    const updated = await prisma.outcome.updateMany({ where: { id, workspaceId: context.workspaceId, deletedAt: null }, data: { status: "PAUSED" } });
    if (!updated.count) throw Object.assign(new Error("Outcome not found"), { status: 404, code: "NOT_FOUND" });
    await unscheduleOutcome(id).catch(() => undefined);
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "outcome.paused", entityType: "Outcome", entityId: id });
    return { status: "PAUSED" };
  });
}
