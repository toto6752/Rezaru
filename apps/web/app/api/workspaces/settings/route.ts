import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@rezaru/database";
import { z } from "zod";

const schema = z.object({ name: z.string().min(2).max(80), department: z.string().max(50).optional(), companySize: z.string().max(30).optional() });

export async function PATCH(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "manageTeam");
    const input = schema.parse(await request.json());
    const workspace = await prisma.workspace.update({ where: { id: context.workspaceId }, data: input });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "workspace.modified", entityType: "Workspace", entityId: context.workspaceId, metadata: { fields: Object.keys(input) } });
    return workspace;
  });
}
