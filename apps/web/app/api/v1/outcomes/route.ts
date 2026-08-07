import { withApi } from "@/lib/api";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { prisma } from "@rezaru/database";

export async function GET(request: Request) {
  return withApi(async () => {
    const auth = await authenticateApiKey(request, "outcomes:read");
    return prisma.outcome.findMany({ where: { workspaceId: auth.workspaceId, deletedAt: null }, select: { id: true, name: true, description: true, status: true, createdAt: true, updatedAt: true }, orderBy: { updatedAt: "desc" } });
  });
}
