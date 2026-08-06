import { withApi } from "@/lib/api";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";
import { z } from "zod";

const querySchema = z.object({
  outcomeId: z.string().uuid().optional(),
  status: z.enum(["QUEUED", "RUNNING", "WAITING", "WAITING_FOR_APPROVAL", "SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export async function GET(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "viewExecutions");
    const url = new URL(request.url);
    const input = querySchema.parse(Object.fromEntries(url.searchParams));
    return prisma.execution.findMany({
      where: { workspaceId: context.workspaceId, outcomeId: input.outcomeId, status: input.status },
      include: { outcome: { select: { id: true, name: true } }, _count: { select: { steps: true, logs: true } } },
      orderBy: { createdAt: "desc" },
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {})
    });
  });
}
