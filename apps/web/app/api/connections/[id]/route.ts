import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "manageConnections");
    const { id } = await params;
    const usage = await prisma.outcomeConnection.count({ where: { connectionId: id, outcome: { status: "ACTIVE" } } });
    if (usage) throw Object.assign(new Error("Pause outcomes using this connection before deleting it."), { status: 409, code: "CONNECTION_IN_USE" });
    const result = await prisma.connection.updateMany({
      where: { id, workspaceId: context.workspaceId, deletedAt: null },
      data: { deletedAt: new Date(), status: "DISCONNECTED" }
    });
    if (!result.count) throw Object.assign(new Error("Connection not found"), { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "connection.deleted", entityType: "Connection", entityId: id });
    return { deleted: true };
  });
}
