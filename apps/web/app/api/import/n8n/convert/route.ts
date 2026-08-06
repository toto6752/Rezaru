import { createHash } from "node:crypto";
import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { analyzeN8nWorkflow } from "@/lib/n8n";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma, Prisma } from "@outcomeos/database";
import { z } from "zod";

const schema = z.object({ workflow: z.unknown() });

export async function POST(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "createOutcome");
    const { workflow: source } = schema.parse(await request.json());
    const report = analyzeN8nWorkflow(source);
    const converted = report.convertedWorkflow!;
    const outcome = await prisma.outcome.create({
      data: {
        workspaceId: context.workspaceId,
        createdById: context.userId,
        name: report.workflowName,
        description: converted.description,
        tags: ["n8n-import"],
        workflowVersions: {
          create: {
            version: 1,
            definition: converted as unknown as Prisma.InputJsonValue,
            explanation: {
              outcomeSummary: report.workflowName,
              assumptions: [],
              clarificationQuestions: [],
              humanReadablePlan: converted.steps.map((step) => ({ id: step.id, title: step.name, description: step.description })),
              requiredConnections: converted.requiredConnections,
              warnings: report.warnings,
              workflow: converted
            } as unknown as Prisma.InputJsonValue,
            compilerVersion: "n8n-translator-v1",
            checksum: createHash("sha256").update(JSON.stringify(converted)).digest("hex"),
            steps: { create: converted.steps.map((step, position) => ({ stepId: step.id, position, definition: step as unknown as Prisma.InputJsonValue })) }
          }
        }
      }
    });
    await prisma.n8nImport.create({
      data: { workspaceId: context.workspaceId, name: report.workflowName, originalJson: source as never, report: report as never, outcomeId: outcome.id }
    });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "n8n.converted", entityType: "N8nImport", entityId: outcome.id, metadata: { totalNodes: report.totalNodes, unsupportedNodes: report.unsupportedNodes } });
    return { outcomeId: outcome.id, report };
  });
}
