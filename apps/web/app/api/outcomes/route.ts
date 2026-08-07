import { createHash } from "node:crypto";
import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { getWorkspaceUsage } from "@/lib/limits";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma, Prisma } from "@rezaru/database";
import { CompilationResultSchema } from "@rezaru/workflow-schema";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(5000),
  compilation: CompilationResultSchema
});

export async function GET() {
  return withApi(async () => {
    const context = await requireWorkspace();
    return prisma.outcome.findMany({
      where: { workspaceId: context.workspaceId, deletedAt: null },
      include: {
        activeWorkflowVersion: { select: { version: true } },
        _count: { select: { executions: true } }
      },
      orderBy: { updatedAt: "desc" }
    });
  });
}

export async function POST(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "createOutcome");
    const input = createSchema.parse(await request.json());
    if (!input.compilation.workflow) throw Object.assign(new Error("Resolve required clarification questions before saving the outcome."), { status: 400, code: "WORKFLOW_INCOMPLETE" });
    const usage = await getWorkspaceUsage(context.workspaceId);
    const workflow = input.compilation.workflow;
    const outcome = await prisma.outcome.create({
      data: {
        workspaceId: context.workspaceId,
        createdById: context.userId,
        name: input.name,
        description: input.description,
        tags: [],
        workflowVersions: {
          create: {
            version: 1,
            definition: workflow as unknown as Prisma.InputJsonValue,
            explanation: input.compilation as unknown as Prisma.InputJsonValue,
            compilerVersion: "outcome-compiler-v1",
            checksum: createHash("sha256").update(JSON.stringify(workflow)).digest("hex"),
            steps: {
              create: workflow.steps.map((step, position) => ({ stepId: step.id, position, definition: step as unknown as Prisma.InputJsonValue }))
            }
          }
        }
      },
      include: { workflowVersions: true }
    });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "outcome.created", entityType: "Outcome", entityId: outcome.id });
    return { ...outcome, planUsage: { used: usage.used.activeOutcomes, limit: usage.limits.activeOutcomes } };
  });
}
