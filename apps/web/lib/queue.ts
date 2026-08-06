import { Queue } from "bullmq";
import IORedis from "ioredis";

let queue: Queue | undefined;

export function executionQueue(): Queue {
  if (!queue) {
    const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true
    });
    queue = new Queue("outcome-executions", {
      connection,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { age: 86_400, count: 5_000 },
        removeOnFail: { age: 604_800, count: 10_000 }
      }
    });
  }
  return queue;
}

export async function enqueueExecution(executionId: string, options?: { delay?: number; resumeAfterStepId?: string; startAtStepId?: string }) {
  return executionQueue().add(
    "execute",
    { executionId, resumeAfterStepId: options?.resumeAfterStepId, startAtStepId: options?.startAtStepId },
    { jobId: `${executionId}:${options?.startAtStepId ?? options?.resumeAfterStepId ?? "start"}:${Date.now()}`, delay: options?.delay }
  );
}

export async function scheduleOutcome(input: { outcomeId: string; workspaceId: string; cron: string; timezone: string }) {
  return executionQueue().upsertJobScheduler(
    `outcome:${input.outcomeId}`,
    { pattern: input.cron, tz: input.timezone },
    { name: "scheduled-execution", data: { outcomeId: input.outcomeId, workspaceId: input.workspaceId } }
  );
}

export async function unscheduleOutcome(outcomeId: string) {
  return executionQueue().removeJobScheduler(`outcome:${outcomeId}`);
}
