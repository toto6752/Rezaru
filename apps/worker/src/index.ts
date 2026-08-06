import { createServer } from "node:http";
import { decryptSecretRecord } from "@outcomeos/config";
import { prisma, type ExecutionStatus, type ExecutionStepStatus, Prisma } from "@outcomeos/database";
import { runWorkflow, type PersistenceAdapter, type StepUpdate } from "@outcomeos/execution-engine";
import { logger } from "@outcomeos/observability";
import { validateWorkflow } from "@outcomeos/workflow-schema";
import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

type ExecutionJob = {
  executionId?: string;
  resumeAfterStepId?: string;
  startAtStepId?: string;
  outcomeId?: string;
  workspaceId?: string;
};

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const queue = new Queue<ExecutionJob>("outcome-executions", { connection });

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function processExecution(job: Job<ExecutionJob>) {
  if (!job.data.executionId && job.data.outcomeId && job.data.workspaceId) {
    const outcome = await prisma.outcome.findFirst({
      where: { id: job.data.outcomeId, workspaceId: job.data.workspaceId, status: "ACTIVE", deletedAt: null },
      include: { activeWorkflowVersion: true }
    });
    if (!outcome?.activeWorkflowVersion) return;
    const workflow = validateWorkflow(outcome.activeWorkflowVersion.definition);
    const scheduledExecution = await prisma.execution.create({
      data: {
        workspaceId: job.data.workspaceId,
        outcomeId: outcome.id,
        workflowVersionId: outcome.activeWorkflowVersion.id,
        status: "QUEUED",
        mode: "production",
        triggerInput: { scheduledAt: new Date().toISOString(), schedulerId: job.id },
        steps: { create: workflow.steps.map((step) => ({ stepId: step.id, name: step.name })) }
      }
    });
    await prisma.usageRecord.create({ data: { workspaceId: job.data.workspaceId, type: "EXECUTION", quantity: 1 } });
    job.data.executionId = scheduledExecution.id;
  }
  if (!job.data.executionId) return;
  const record = await prisma.execution.findUnique({
    where: { id: job.data.executionId },
    include: { workflowVersion: true, steps: true }
  });
  if (!record) {
    logger.warn("Execution record not found", { executionId: job.data.executionId });
    return;
  }
  if (["SUCCEEDED", "CANCELLED", "TIMED_OUT"].includes(record.status)) return;
  const workflow = validateWorkflow(record.workflowVersion.definition);

  const adapter: PersistenceAdapter = {
    onExecutionStatus: async (status, data) => {
      const terminal = ["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"].includes(status);
      await prisma.execution.update({
        where: { id: record.id },
        data: {
          status: status as ExecutionStatus,
          startedAt: status === "RUNNING" ? record.startedAt ?? new Date() : undefined,
          completedAt: terminal ? new Date() : undefined,
          cancelledAt: status === "CANCELLED" ? new Date() : undefined,
          durationMs: terminal ? Date.now() - (record.startedAt?.getTime() ?? record.createdAt.getTime()) : undefined,
          output: data?.output ? jsonValue(data.output) : undefined,
          error: status === "FAILED" && data ? jsonValue(data) : undefined
        }
      });
      if (status === "SUCCEEDED" || status === "FAILED") {
        await prisma.usageRecord.create({
          data: {
            workspaceId: record.workspaceId,
            type: status === "SUCCEEDED" ? "SUCCESSFUL_EXECUTION" : "FAILED_EXECUTION",
            quantity: 1
          }
        });
      }
      logger.info(`Execution ${status.toLowerCase()}`, { executionId: record.id, workspaceId: record.workspaceId });
    },
    onStepUpdate: async (update: StepUpdate) => {
      await prisma.executionStep.update({
        where: { executionId_stepId: { executionId: record.id, stepId: update.stepId } },
        data: {
          status: update.status as ExecutionStepStatus,
          attempt: update.attempt,
          input: update.input ? jsonValue(update.input) : undefined,
          output: update.output ? jsonValue(update.output) : undefined,
          error: update.error ? jsonValue(update.error) : undefined,
          startedAt: update.status === "RUNNING" ? new Date() : undefined,
          completedAt: ["SUCCEEDED", "FAILED", "SKIPPED"].includes(update.status) ? new Date() : undefined,
          durationMs: update.durationMs
        }
      });
    },
    onLog: async (level, message, data, stepId) => {
      const step = stepId ? await prisma.executionStep.findUnique({
        where: { executionId_stepId: { executionId: record.id, stepId } },
        select: { id: true }
      }) : undefined;
      await prisma.executionLog.create({
        data: {
          executionId: record.id,
          executionStepId: step?.id,
          level,
          message,
          data: data ? jsonValue(data) : undefined
        }
      });
    },
    getCredentials: async (connectorKey) => {
      if (record.mode === "demo" || ["webhook", "schedule", "transform", "condition", "delay", "approval"].includes(connectorKey)) return {};
      const connectionRecord = await prisma.connection.findFirst({
        where: {
          workspaceId: record.workspaceId,
          connectorKey,
          status: "CONNECTED",
          deletedAt: null
        },
        include: { credential: true }
      });
      if (!connectionRecord?.credential) {
        throw Object.assign(new Error(`The ${connectorKey} connection is missing or needs attention`), { code: "MISSING_CONNECTION" });
      }
      return decryptSecretRecord(connectionRecord.credential.encryptedData);
    },
    createApproval: async (stepId, approval) => {
      const step = await prisma.executionStep.findUniqueOrThrow({
        where: { executionId_stepId: { executionId: record.id, stepId } }
      });
      await prisma.approvalRequest.create({
        data: {
          executionId: record.id,
          executionStepId: step.id,
          title: approval.title,
          description: approval.description,
          context: jsonValue(approval.context)
        }
      });
    },
    scheduleResume: async (stepId, waitUntil) => {
      await queue.add("resume", { executionId: record.id, resumeAfterStepId: stepId }, {
        delay: Math.max(0, waitUntil.getTime() - Date.now()),
        jobId: `${record.id}:resume:${stepId}:${waitUntil.getTime()}`
      });
    },
    isCancelled: async () => (await prisma.execution.findUnique({ where: { id: record.id }, select: { status: true } }))?.status === "CANCELLED"
  };

  return runWorkflow(
    workflow,
    record.triggerInput as Record<string, unknown>,
    adapter,
    {
      executionId: record.id,
      demo: record.mode === "demo",
      resumeAfterStepId: job.data.resumeAfterStepId,
      startAtStepId: job.data.startAtStepId,
      initialOutputs: Object.fromEntries(
        record.steps
          .filter((step) => step.output && step.status === "SUCCEEDED")
          .map((step) => [step.stepId, step.output as Record<string, unknown>])
      )
    }
  );
}

const worker = new Worker<ExecutionJob>("outcome-executions", processExecution, {
  connection,
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 10),
  lockDuration: 120_000,
  stalledInterval: 30_000,
  maxStalledCount: 2
});

worker.on("completed", (job) => logger.info("Queue job completed", { executionId: job.data.executionId, jobId: job.id }));
worker.on("failed", (job, error) => logger.error("Queue job failed", { executionId: job?.data.executionId, jobId: job?.id, error: error.message }));
worker.on("error", (error) => logger.error("Worker error", { error: error.message }));

const healthPort = Number(process.env.WORKER_HEALTH_PORT ?? 3001);
const healthServer = createServer(async (_request, response) => {
  try {
    await Promise.all([prisma.$queryRaw`SELECT 1`, connection.ping()]);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok", worker: worker.isRunning() ? "running" : "paused", timestamp: new Date().toISOString() }));
  } catch {
    response.writeHead(503, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "unhealthy" }));
  }
});
healthServer.listen(healthPort, () => logger.info("Worker health server ready", { port: healthPort }));

async function shutdown(signal: string) {
  logger.info("Worker shutting down", { signal });
  healthServer.close();
  await worker.close();
  await queue.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
