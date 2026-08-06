import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";
import { z } from "zod";

const schema = z.object({ role: z.enum(["ADMIN", "BUILDER", "OPERATOR", "VIEWER"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "manageTeam");
    const { id } = await params;
    const { role } = schema.parse(await request.json());
    const member = await prisma.workspaceMember.findFirst({ where: { id, workspaceId: context.workspaceId } });
    if (!member) throw Object.assign(new Error("Member not found"), { status: 404, code: "NOT_FOUND" });
    if (member.role === "OWNER") throw Object.assign(new Error("Transfer ownership before changing the owner’s role."), { status: 409, code: "OWNER_ROLE_LOCKED" });
    const updated = await prisma.workspaceMember.update({ where: { id }, data: { role } });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "permission.changed", entityType: "WorkspaceMember", entityId: id, metadata: { from: member.role, to: role } });
    return updated;
  });
}
