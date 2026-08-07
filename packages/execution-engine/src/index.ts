import { getOperation } from "@rezaru/connectors";
import {
  maskSecrets,
  resolveVariables,
  type RetryPolicy,
  type WorkflowDefinition,
  type WorkflowStep
} from "@rezaru/workflow-schema";

export * from "./artifacts";

export type ExecutionContext = {
  executionId: string;
  trigger: Record<string, unknown>;
  demo: boolean;
  outputs: Record<string, Record<string, unknown>>;
};

export type StepUpdate = {
  stepId: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED" | "WAITING";
  attempt?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: { code: string; message: string };
  durationMs?: number;
};

export type PersistenceAdapter = {
  onExecutionStatus: (status: string, data?: Record<string, unknown>) => Promise<void>;
  onStepUpdate: (update: StepUpdate) => Promise<void>;
  onLog: (level: "info" | "warn" | "error", message: string, data?: Record<string, unknown>, stepId?: string) => Promise<void>;
  getCredentials: (connectorKey: string) => Promise<Record<string, string>>;
  createApproval: (stepId: string, approval: { title: string; description: string; context: Record<string, unknown> }) => Promise<void>;
  scheduleResume: (stepId: string, waitUntil: Date) => Promise<void>;
  isCancelled: () => Promise<boolean>;
};

export type EngineResult = {
  status: "SUCCEEDED" | "FAILED" | "WAITING" | "WAITING_FOR_APPROVAL" | "CANCELLED";
  outputs: Record<string, Record<string, unknown>>;
  failedStepId?: string;
};

const defaultRetry: RetryPolicy = {
  maxAttempts: 1,
  initialDelayMs: 1_000,
  backoffMultiplier: 2,
  maxDelayMs: 60_000,
  retryableErrors: ["TIMEOUT", "RATE_LIMIT", "TEMPORARY"]
};

export class ExecutionError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
    readonly safeDetails?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ExecutionError";
  }
}

function safeError(error: unknown): ExecutionError {
  if (error instanceof ExecutionError) return error;
  if (error instanceof Error) {
    const value = error as Error & { code?: string; safeDetails?: Record<string, unknown> };
    const code = value.code ?? (error.name === "AbortError" ? "TIMEOUT" : "STEP_ERROR");
    return new ExecutionError(error.message, code, ["TIMEOUT", "RATE_LIMIT", "TEMPORARY"].includes(code), value.safeDetails);
  }
  return new ExecutionError("The step failed for an unknown reason", "STEP_ERROR", false);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function selectNextSteps(step: WorkflowStep, output: Record<string, unknown>): string[] {
  if (step.type === "condition" && step.condition) {
    return output.matched ? step.condition.trueNext : step.condition.falseNext;
  }
  return step.next;
}

async function executeStep(
  step: WorkflowStep,
  context: ExecutionContext,
  adapter: PersistenceAdapter
): Promise<{ output?: Record<string, unknown>; waiting?: "delay" | "approval" }> {
  const retry = step.retryPolicy ?? defaultRetry;
  const operation = getOperation(step.connectorKey ?? step.type, step.operationKey);
  const rawInput = resolveVariables(step.inputMapping, {
    trigger: context.trigger,
    steps: context.outputs,
    execution: { id: context.executionId }
  });
  const input = operation.inputSchema.parse(rawInput);
  const credentials = await adapter.getCredentials(step.connectorKey ?? step.type);

  for (let attempt = 1; attempt <= retry.maxAttempts; attempt += 1) {
    const startedAt = Date.now();
    await adapter.onStepUpdate({ stepId: step.id, status: "RUNNING", attempt, input: maskSecrets(input) as Record<string, unknown> });
    await adapter.onLog("info", `${step.name} started`, { attempt }, step.id);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), step.timeoutMs);
    try {
      const result = await operation.execute({ input, credentials, demo: context.demo, signal: controller.signal });
      clearTimeout(timeout);
      const output = operation.outputSchema.parse(result.data);
      if (result.approval) {
        await adapter.createApproval(step.id, result.approval);
        await adapter.onStepUpdate({ stepId: step.id, status: "WAITING", attempt, input: maskSecrets(input) as Record<string, unknown>, output: maskSecrets(output) as Record<string, unknown> });
        return { output, waiting: "approval" };
      }
      if (result.waiting && result.waitUntil) {
        await adapter.scheduleResume(step.id, result.waitUntil);
        await adapter.onStepUpdate({ stepId: step.id, status: "WAITING", attempt, output, durationMs: Date.now() - startedAt });
        return { output, waiting: "delay" };
      }
      await adapter.onStepUpdate({ stepId: step.id, status: "SUCCEEDED", attempt, output: maskSecrets(output) as Record<string, unknown>, durationMs: Date.now() - startedAt });
      await adapter.onLog("info", `${step.name} completed`, { durationMs: Date.now() - startedAt }, step.id);
      return { output };
    } catch (unknownError) {
      clearTimeout(timeout);
      const error = safeError(unknownError);
      const retryable = error.retryable || retry.retryableErrors.includes(error.code);
      await adapter.onLog(attempt < retry.maxAttempts && retryable ? "warn" : "error", error.message, { code: error.code, attempt }, step.id);
      if (attempt >= retry.maxAttempts || !retryable) {
        await adapter.onStepUpdate({
          stepId: step.id,
          status: "FAILED",
          attempt,
          error: { code: error.code, message: error.message },
          durationMs: Date.now() - startedAt
        });
        throw error;
      }
      const delay = Math.min(retry.initialDelayMs * retry.backoffMultiplier ** (attempt - 1), retry.maxDelayMs);
      await sleep(delay);
    }
  }
  throw new ExecutionError("Retry policy exhausted", "RETRIES_EXHAUSTED", false);
}

export async function runWorkflow(
  workflow: WorkflowDefinition,
  trigger: Record<string, unknown>,
  adapter: PersistenceAdapter,
  options: {
    executionId: string;
    demo?: boolean;
    resumeAfterStepId?: string;
    startAtStepId?: string;
    initialOutputs?: Record<string, Record<string, unknown>>;
  }
): Promise<EngineResult> {
  const context: ExecutionContext = {
    executionId: options.executionId,
    trigger,
    demo: options.demo ?? false,
    outputs: options.initialOutputs ?? {}
  };
  const stepsById = new Map(workflow.steps.map((step) => [step.id, step]));
  const incoming = new Map<string, number>();
  for (const step of workflow.steps) incoming.set(step.id, 0);
  for (const step of workflow.steps) {
    for (const next of [...step.next, ...(step.condition?.trueNext ?? []), ...(step.condition?.falseNext ?? [])]) {
      incoming.set(next, (incoming.get(next) ?? 0) + 1);
    }
  }
  let queue = workflow.steps.filter((step) => (incoming.get(step.id) ?? 0) === 0).map((step) => step.id);
  const visited = new Set<string>();
  if (options.startAtStepId) {
    if (!stepsById.has(options.startAtStepId)) throw new ExecutionError("Retry step no longer exists in the immutable workflow version", "INVALID_RETRY_STEP", false);
    queue = [options.startAtStepId];
  } else if (options.resumeAfterStepId) {
    const resumedStep = stepsById.get(options.resumeAfterStepId);
    if (!resumedStep) throw new ExecutionError("Resume step no longer exists in the immutable workflow version", "INVALID_RESUME_STEP", false);
    queue = selectNextSteps(resumedStep, context.outputs[resumedStep.id] ?? {});
    visited.add(resumedStep.id);
  }
  await adapter.onExecutionStatus("RUNNING");

  while (queue.length) {
    if (await adapter.isCancelled()) {
      await adapter.onExecutionStatus("CANCELLED");
      return { status: "CANCELLED", outputs: context.outputs };
    }
    const stepId = queue.shift()!;
    if (visited.has(stepId)) continue;
    const step = stepsById.get(stepId);
    if (!step) continue;
    visited.add(stepId);
    try {
      const result = await executeStep(step, context, adapter);
      if (result.output) context.outputs[step.id] = result.output;
      if (result.waiting === "approval") {
        await adapter.onExecutionStatus("WAITING_FOR_APPROVAL");
        return { status: "WAITING_FOR_APPROVAL", outputs: context.outputs };
      }
      if (result.waiting === "delay") {
        await adapter.onExecutionStatus("WAITING");
        return { status: "WAITING", outputs: context.outputs };
      }
      queue = [...queue, ...selectNextSteps(step, result.output ?? {})];
    } catch (error) {
      const normalized = safeError(error);
      if (step.onError?.strategy === "continue") continue;
      if (step.onError?.strategy === "fallback" && step.onError.fallbackStepId) {
        queue.unshift(step.onError.fallbackStepId);
        continue;
      }
      await adapter.onExecutionStatus("FAILED", { failedStepId: step.id, code: normalized.code, message: normalized.message });
      return { status: "FAILED", outputs: context.outputs, failedStepId: step.id };
    }
  }
  await adapter.onExecutionStatus("SUCCEEDED", { output: context.outputs });
  return { status: "SUCCEEDED", outputs: context.outputs };
}
