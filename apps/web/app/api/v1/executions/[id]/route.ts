import { withApi } from "@/lib/api";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { prisma } from "@outcomeos/database";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const auth = await authenticateApiKey(request, "executions:read");
    const { id } = await params;
    const execution = await prisma.execution.findFirst({ where: { id, workspaceId: auth.workspaceId }, include: { steps: true } });
    if (!execution) throw Object.assign(new Error("Execution not found"), { status: 404, code: "NOT_FOUND" });
    return execution;
  });
}
