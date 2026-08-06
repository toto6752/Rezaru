import { createHash } from "node:crypto";
import { withApi } from "@/lib/api";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma, Prisma } from "@outcomeos/database";
import type { WorkflowDefinition } from "@outcomeos/workflow-schema";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "createOutcome");
    const { id } = await params;
    const source = await prisma.outcome.findFirst({
      where: { id, workspaceId: context.workspaceId, deletedAt: null },
      include: { workflowVersions: { orderBy: { version: "desc" }, take: 1 } }
    });
    if (!source || !source.workflowVersions[0]) throw Object.assign(new Error("Outcome not found"), { status: 404, code: "NOT_FOUND" });
    const definition = source.workflowVersions[0].definition as unknown as WorkflowDefinition;
    return prisma.outcome.create({
      data: {
        workspaceId: context.workspaceId,
        createdById: context.userId,
        name: `${source.name} copy`,
        description: source.description,
        tags: source.tags,
        workflowVersions: {
          create: {
            version: 1,
            definition: definition as unknown as Prisma.InputJsonValue,
            explanation: source.workflowVersions[0].explanation as unknown as Prisma.InputJsonValue,
            compilerVersion: source.workflowVersions[0].compilerVersion,
            checksum: createHash("sha256").update(JSON.stringify(definition)).digest("hex"),
            steps: { create: definition.steps.map((step, position) => ({ stepId: step.id, position, definition: step as unknown as Prisma.InputJsonValue })) }
          }
        }
      }
    });
  });
}
