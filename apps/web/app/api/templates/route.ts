import { withApi } from "@/lib/api";
import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@rezaru/database";
import { z } from "zod";

const querySchema = z.object({ department: z.string().optional(), search: z.string().optional() });

export async function GET(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    const input = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return prisma.outcomeTemplate.findMany({
      where: {
        published: true,
        OR: [{ workspaceId: null }, { workspaceId: context.workspaceId }],
        department: input.department,
        ...(input.search ? { OR: [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } }
        ] } : {})
      },
      orderBy: [{ department: "asc" }, { title: "asc" }]
    });
  });
}
