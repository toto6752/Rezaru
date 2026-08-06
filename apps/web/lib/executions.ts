import { assertExecutionLimit } from "@/lib/limits";
import { enqueueExecution } from "@/lib/queue";
import { prisma, Prisma } from "@outcomeos/database";
import type { WorkflowDefinition } from "@outcomeos/workflow-schema";

export async function createExecution(input: {
  workspaceId: string;
  outcomeId: string;
  triggerInput: Record<string, unknown>;
  mode: "test" | "production" | "demo";
  idempotencyKey?: string;
}) {
  await assertExecutionLimit(input.workspaceId);
  const outcome = await prisma.outcome.findFirst({
    where: { id: input.outcomeId, workspaceId: input.workspaceId, deletedAt: null },
    include: {
      activeWorkflowVersion: true,
      workflowVersions: { where: { status: "DRAFT" }, orderBy: { version: "desc" }, take: 1 }
    }
  });
  if (!outcome) throw Object.assign(new Error("Outcome not found"), { status: 404, code: "NOT_FOUND" });
  const version = input.mode === "production" ? outcome.activeWorkflowVersion : outcome.activeWorkflowVersion ?? outcome.workflowVersions[0];
  if (!version) throw Object.assign(new Error("This outcome has no executable workflow version"), { status: 409, code: "NO_WORKFLOW" });
  const workflow = version.definition as unknown as WorkflowDefinition;
  const execution = await prisma.execution.create({
    data: {
      workspaceId: input.workspaceId,
      outcomeId: outcome.id,
      workflowVersionId: version.id,
      status: "QUEUED",
      mode: input.mode,
      triggerInput: input.triggerInput as Prisma.InputJsonValue,
      idempotencyKey: input.idempotencyKey,
      steps: {
        create: workflow.steps.map((step) => ({ stepId: step.id, name: step.name }))
      }
    }
  });
  await prisma.usageRecord.create({ data: { workspaceId: input.workspaceId, type: "EXECUTION", quantity: 1 } });
  try {
    await enqueueExecution(execution.id);
  } catch (error) {
    await prisma.execution.update({
      where: { id: execution.id },
      data: { status: "FAILED", error: { code: "QUEUE_UNAVAILABLE", message: "The execution queue is unavailable. The worker health check can identify the infrastructure issue." } }
    });
    if (process.env.DEMO_MODE !== "true") throw error;
  }
  return execution;
}
