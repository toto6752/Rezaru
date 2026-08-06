import { withApi } from "@/lib/api";
import { requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";
import { z } from "zod";

const schema = z.object({
  department: z.string().min(1).max(50),
  tools: z.array(z.string().max(50)).max(30),
  companySize: z.string().min(1).max(30),
  outcome: z.string().max(2000).optional()
});

export async function POST(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    const input = schema.parse(await request.json());
    return prisma.workspace.update({
      where: { id: context.workspaceId },
      data: { department: input.department, tools: input.tools, companySize: input.companySize, onboardingCompletedAt: new Date() }
    });
  });
}
