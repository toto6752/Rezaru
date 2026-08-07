import { withApi } from "@/lib/api";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@rezaru/database";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "viewExecutions");
    const { id } = await params;
    const execution = await prisma.execution.findFirst({
      where: { id, workspaceId: context.workspaceId },
      include: {
        outcome: { select: { id: true, name: true, description: true } },
        workflowVersion: { select: { version: true } },
        steps: { orderBy: { startedAt: "asc" }, include: { logs: { orderBy: { createdAt: "asc" } } } },
        approvals: { orderBy: { createdAt: "desc" } },
        logs: { orderBy: { createdAt: "asc" } }
      }
    });
    if (!execution) throw Object.assign(new Error("Execution not found"), { status: 404, code: "NOT_FOUND" });
    return execution;
  });
}
