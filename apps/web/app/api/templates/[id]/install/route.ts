import { createHash } from "node:crypto";
import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma, Prisma } from "@outcomeos/database";
import { validateWorkflow } from "@outcomeos/workflow-schema";
import { z } from "zod";

const schema = z.object({ variables: z.record(z.union([z.string(), z.number()])).default({}) });

function applyVariables<T>(value: T, variables: Record<string, string | number>): T {
  if (typeof value === "string") {
    return value.replace(/\{\{variables\.([^}]+)\}\}/g, (_match, key: string) => String(variables[key] ?? "")) as T;
  }
  if (Array.isArray(value)) return value.map((item) => applyVariables(item, variables)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, applyVariables(item, variables)])) as T;
  return value;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "createOutcome");
    const { id } = await params;
    const { variables } = schema.parse(await request.json().catch(() => ({})));
    const template = await prisma.outcomeTemplate.findFirst({
      where: { id, published: true, OR: [{ workspaceId: null }, { workspaceId: context.workspaceId }] }
    });
    if (!template) throw Object.assign(new Error("Template not found"), { status: 404, code: "NOT_FOUND" });
    const workflow = validateWorkflow(applyVariables(template.definitionTemplate, variables));
    const outcome = await prisma.outcome.create({
      data: {
        workspaceId: context.workspaceId,
        createdById: context.userId,
        name: template.title,
        description: template.description,
        tags: ["template", template.department.toLowerCase()],
        estimatedMinutesSaved: template.monthlyMinutesSaved,
        workflowVersions: {
          create: {
            version: 1,
            definition: workflow as unknown as Prisma.InputJsonValue,
            explanation: {
              outcomeSummary: template.title,
              assumptions: ["Template variables were supplied by the installer."],
              clarificationQuestions: [],
              humanReadablePlan: workflow.steps.map((step) => ({ id: step.id, title: step.name, description: step.description, connectorKey: step.connectorKey, risk: step.type === "approval" ? "medium" : "low" })),
              workflow,
              requiredConnections: workflow.requiredConnections,
              warnings: []
            } as unknown as Prisma.InputJsonValue,
            compilerVersion: "template-installer-v1",
            checksum: createHash("sha256").update(JSON.stringify(workflow)).digest("hex"),
            steps: { create: workflow.steps.map((step, position) => ({ stepId: step.id, position, definition: step as unknown as Prisma.InputJsonValue })) }
          }
        }
      }
    });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "template.installed", entityType: "OutcomeTemplate", entityId: template.id, metadata: { outcomeId: outcome.id } });
    return { outcomeId: outcome.id };
  });
}
