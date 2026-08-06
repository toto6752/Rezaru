import { z } from "zod";

export const RetryPolicySchema = z.object({
  maxAttempts: z.number().int().min(1).max(10).default(1),
  initialDelayMs: z.number().int().min(0).max(3_600_000).default(1_000),
  backoffMultiplier: z.number().min(1).max(10).default(2),
  maxDelayMs: z.number().int().min(0).max(86_400_000).default(60_000),
  retryableErrors: z.array(z.string()).default(["TIMEOUT", "RATE_LIMIT", "TEMPORARY"])
});

export type RetryPolicy = z.infer<typeof RetryPolicySchema>;

export const ErrorStrategySchema = z.object({
  strategy: z.enum(["fail", "continue", "fallback"]),
  fallbackStepId: z.string().optional()
}).refine((value) => value.strategy !== "fallback" || Boolean(value.fallbackStepId), {
  message: "A fallback strategy requires fallbackStepId"
});

export const WorkflowStepTypeSchema = z.enum([
  "trigger",
  "action",
  "condition",
  "transform",
  "delay",
  "loop",
  "parallel",
  "approval",
  "ai_task",
  "sub_workflow",
  "error_handler"
]);

export const WorkflowStepSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_-]*$/),
  type: WorkflowStepTypeSchema,
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  connectorKey: z.string().regex(/^[a-z][a-z0-9_-]*$/).optional(),
  operationKey: z.string().regex(/^[a-z][a-z0-9_-]*$/),
  inputMapping: z.record(z.unknown()).default({}),
  outputSchema: z.record(z.unknown()).optional(),
  retryPolicy: RetryPolicySchema.optional(),
  timeoutMs: z.number().int().min(100).max(86_400_000).default(30_000),
  onError: ErrorStrategySchema.optional(),
  next: z.array(z.string()).default([]),
  condition: z.object({
    expression: z.string(),
    trueNext: z.array(z.string()).default([]),
    falseNext: z.array(z.string()).default([])
  }).optional()
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

export const TriggerDefinitionSchema = z.object({
  type: z.enum(["webhook", "schedule", "manual", "connector"]),
  connectorKey: z.string(),
  operationKey: z.string(),
  configuration: z.record(z.unknown()).default({})
});

export const WorkflowSettingsSchema = z.object({
  concurrency: z.number().int().min(1).max(100).default(5),
  defaultTimeoutMs: z.number().int().min(1_000).max(86_400_000).default(30_000),
  timezone: z.string().default("UTC"),
  enabledDays: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  retentionDays: z.number().int().min(1).max(3650).default(30),
  redactFields: z.array(z.string()).default(["password", "token", "secret", "authorization", "apiKey"])
});

export const RequiredConnectionSchema = z.object({
  connectorKey: z.string(),
  label: z.string(),
  reason: z.string(),
  required: z.boolean().default(true)
});

export type RequiredConnection = z.infer<typeof RequiredConnectionSchema>;

export const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.number().int().positive(),
  trigger: TriggerDefinitionSchema,
  steps: z.array(WorkflowStepSchema).min(1).max(200),
  settings: WorkflowSettingsSchema,
  requiredConnections: z.array(RequiredConnectionSchema).default([])
}).superRefine((workflow, context) => {
  const ids = new Set<string>();
  for (const step of workflow.steps) {
    if (ids.has(step.id)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate step id: ${step.id}` });
    }
    ids.add(step.id);
  }
  for (const step of workflow.steps) {
    const references = [
      ...step.next,
      ...(step.condition?.trueNext ?? []),
      ...(step.condition?.falseNext ?? []),
      ...(step.onError?.fallbackStepId ? [step.onError.fallbackStepId] : [])
    ];
    for (const reference of references) {
      if (!ids.has(reference)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Step ${step.id} references missing step ${reference}`
        });
      }
    }
  }
});

export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

export const ClarificationQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  reason: z.string(),
  required: z.boolean(),
  type: z.enum(["text", "select", "connection", "boolean"]),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional()
});

export const PlanStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  connectorKey: z.string().optional(),
  risk: z.enum(["low", "medium", "high"]).default("low")
});

export const CompilationResultSchema = z.object({
  outcomeSummary: z.string(),
  assumptions: z.array(z.string()),
  clarificationQuestions: z.array(ClarificationQuestionSchema),
  humanReadablePlan: z.array(PlanStepSchema),
  workflow: WorkflowDefinitionSchema.optional(),
  requiredConnections: z.array(RequiredConnectionSchema),
  warnings: z.array(z.string()),
  estimatedExecutionsPerMonth: z.number().int().positive().optional()
}).refine(
  (result) => result.clarificationQuestions.filter((question) => question.required).length === 0 || !result.workflow,
  { message: "A workflow cannot be finalized while required clarifications remain" }
);

export type CompilationResult = z.infer<typeof CompilationResultSchema>;

export const N8nImportReportSchema = z.object({
  workflowName: z.string(),
  totalNodes: z.number().int().nonnegative(),
  supportedNodes: z.number().int().nonnegative(),
  partiallySupportedNodes: z.number().int().nonnegative(),
  unsupportedNodes: z.number().int().nonnegative(),
  nodes: z.array(z.object({
    name: z.string(),
    sourceType: z.string(),
    outcomeOperation: z.string().optional(),
    compatibility: z.enum(["supported", "partial", "unsupported"]),
    note: z.string().optional()
  })),
  credentialMappings: z.array(z.object({
    sourceName: z.string(),
    sourceType: z.string(),
    connectorKey: z.string(),
    required: z.boolean()
  })),
  warnings: z.array(z.string()),
  convertedWorkflow: WorkflowDefinitionSchema.optional()
});

export type N8nImportReport = z.infer<typeof N8nImportReportSchema>;

export const ExecutionStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "WAITING",
  "WAITING_FOR_APPROVAL",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "TIMED_OUT"
]);

export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export function validateWorkflow(value: unknown): WorkflowDefinition {
  return WorkflowDefinitionSchema.parse(value);
}

export function maskSecrets(value: unknown, fields: string[] = ["password", "token", "secret", "authorization", "apiKey"]): unknown {
  if (Array.isArray(value)) return value.map((item) => maskSecrets(item, fields));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      fields.some((field) => key.toLowerCase().includes(field.toLowerCase()))
        ? "••••••••"
        : maskSecrets(item, fields)
    ])
  );
}

export function resolveVariables<T>(value: T, context: Record<string, unknown>): T {
  if (typeof value === "string") {
    return value.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, path: string) => {
      const resolved = path.trim().split(".").reduce<unknown>((current, segment) => {
        if (current && typeof current === "object") return (current as Record<string, unknown>)[segment];
        return undefined;
      }, context);
      return resolved === undefined ? "" : typeof resolved === "string" ? resolved : JSON.stringify(resolved);
    }) as T;
  }
  if (Array.isArray(value)) return value.map((item) => resolveVariables(item, context)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveVariables(item, context)])
    ) as T;
  }
  return value;
}

export { seedTemplates } from "./templates";
export type { SeedTemplate } from "./templates";
