import { withApi } from "@/lib/api";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { prisma } from "@rezaru/database";

export async function GET(request: Request) {
  return withApi(async () => {
    const auth = await authenticateApiKey(request, "executions:read");
    return prisma.execution.findMany({ where: { workspaceId: auth.workspaceId }, select: { id: true, outcomeId: true, status: true, mode: true, startedAt: true, completedAt: true, durationMs: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 });
  });
}
