import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@rezaru/database";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "manageApiKeys");
    const { id } = await params;
    const result = await prisma.apiKey.updateMany({ where: { id, workspaceId: context.workspaceId, revokedAt: null }, data: { revokedAt: new Date() } });
    if (!result.count) throw Object.assign(new Error("API key not found"), { status: 404, code: "NOT_FOUND" });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "api_key.revoked", entityType: "ApiKey", entityId: id });
    return { revoked: true };
  });
}
