import { withApi } from "@/lib/api";
import { getWorkspaceUsage } from "@/lib/limits";
import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";

export async function GET() {
  return withApi(async () => {
    const context = await requireWorkspace();
    const [summary, breakdown] = await Promise.all([
      getWorkspaceUsage(context.workspaceId),
      prisma.usageRecord.groupBy({ by: ["type"], where: { workspaceId: context.workspaceId }, _sum: { quantity: true } })
    ]);
    return { ...summary, breakdown: Object.fromEntries(breakdown.map((item) => [item.type, Number(item._sum.quantity ?? 0)])) };
  });
}
