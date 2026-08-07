import { getEnvironment } from "@rezaru/config";
import { listConnectors } from "@rezaru/connectors";
import {
  CompilationResultSchema,
  type CompilationResult,
  type WorkflowDefinition
} from "@rezaru/workflow-schema";

export type CompileRequest = {
  instruction: string;
  answers?: Record<string, string>;
  timezone?: string;
  existingWorkflow?: WorkflowDefinition;
  mode?: "new" | "modify" | "optimize" | "failure" | "n8n";
};

export interface AiProvider {
  generateStructured(prompt: string): Promise<unknown>;
}

const approvedOperations = () => listConnectors().flatMap((connector) =>
  [...connector.triggers, ...connector.actions].map((operation) => ({
    connectorKey: connector.key,
    operationKey: operation.key,
    description: operation.description
  }))
);

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  return JSON.parse(fenced.trim());
}

class OpenAiCompatibleProvider implements AiProvider {
  constructor(private readonly baseUrl: string, private readonly apiKey: string, private readonly model: string) {}
  async generateStructured(prompt: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return only JSON matching the supplied schema. Never emit executable code." },
          { role: "user", content: prompt }
        ]
      })
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return extractJson(body.choices?.[0]?.message?.content ?? "");
  }
}

class AnthropicProvider implements AiProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}
  async generateStructured(prompt: string): Promise<unknown> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 5000,
        system: "Return only valid JSON matching the supplied schema. Never emit executable code.",
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const body = await response.json() as { content?: Array<{ type: string; text?: string }> };
    return extractJson(body.content?.find((item) => item.type === "text")?.text ?? "");
  }
}

function selectProvider(): AiProvider | undefined {
  const environment = getEnvironment();
  if (environment.AI_PROVIDER === "rule-based" || !environment.AI_API_KEY) return undefined;
  if (environment.AI_PROVIDER === "anthropic") return new AnthropicProvider(environment.AI_API_KEY, environment.AI_MODEL);
  return new OpenAiCompatibleProvider(environment.AI_BASE_URL, environment.AI_API_KEY, environment.AI_MODEL);
}

const friendlyName = (instruction: string) => {
  const compact = instruction.replace(/\s+/g, " ").trim();
  return compact.length <= 60 ? compact : `${compact.slice(0, 57)}…`;
};

function makeWorkflow(request: CompileRequest): CompilationResult {
  const text = request.instruction.toLowerCase();
  const answers = request.answers ?? {};
  const wantsSlack = text.includes("slack");
  const wantsTeams = text.includes("teams");
  const wantsCrm = text.includes("crm") || text.includes("hubspot");
  const wantsNotion = text.includes("notion");
  const crm = text.includes("hubspot") ? "hubspot" : answers.crm;
  const slackChannel = answers.slackChannel;
  const notionDatabaseId = answers.notionDatabaseId;
  const scheduleRequested = /(every |monday|daily|weekly|monthly)/.test(text);
  const webhookRequested = /(when |website|webhook|submits|invoice|cancels|payment)/.test(text) && !scheduleRequested;
  const highValue = text.includes("invoice") || text.includes("$5,000") || text.includes("5000");
  const requiresApproval = text.includes("approval") || text.includes("approve") || highValue;
  const needsAi = /(summarize|enrich|anomal|personalized|\bai\b|classif)/.test(text);
  const clarifications: CompilationResult["clarificationQuestions"] = [];

  if (wantsCrm && !crm) {
    clarifications.push({
      id: "crm",
      question: "Which CRM should receive the record?",
      reason: "The destination must be known before Rezaru can create a valid contact action.",
      required: true,
      type: "select",
      options: [{ label: "HubSpot", value: "hubspot" }, { label: "Other / HTTP API", value: "http" }]
    });
  }
  if (wantsSlack && !slackChannel) {
    clarifications.push({
      id: "slackChannel",
      question: "Which Slack channel should receive the notification?",
      reason: "Rezaru will not invent a recipient for an external message.",
      required: true,
      type: "text"
    });
  }
  if (wantsTeams) {
    clarifications.push({
      id: "teamsWebhook",
      question: "Which Microsoft Teams webhook should receive the notification?",
      reason: "A destination is required and Teams is currently connected through its incoming webhook.",
      required: true,
      type: "text"
    });
  }
  if (wantsNotion && !notionDatabaseId) {
    clarifications.push({
      id: "notionDatabaseId",
      question: "Which Notion database should receive the item?",
      reason: "A Notion page must have an explicit parent database; Rezaru will not guess one.",
      required: true,
      type: "text"
    });
  }

  const trigger = scheduleRequested
    ? { type: "schedule" as const, connectorKey: "schedule", operationKey: "cron", configuration: { cron: answers.schedule ?? "0 9 * * 1" } }
    : { type: webhookRequested ? "webhook" as const : "manual" as const, connectorKey: "webhook", operationKey: "receive", configuration: {} };
  const steps: WorkflowDefinition["steps"] = [];
  const plan: CompilationResult["humanReadablePlan"] = [];
  const add = (step: WorkflowDefinition["steps"][number], planTitle: string) => {
    const prior = steps.at(-1);
    if (prior && prior.next.length === 0 && prior.type !== "condition") prior.next = [step.id];
    steps.push(step);
    plan.push({ id: step.id, title: planTitle, description: step.description, connectorKey: step.connectorKey, risk: step.type === "approval" ? "medium" : "low" });
  };

  add({
    id: "validate_input",
    type: "transform",
    name: "Validate incoming data",
    description: "Validate and normalize the incoming business data.",
    connectorKey: "transform",
    operationKey: "map",
    inputMapping: { payload: "{{trigger}}" },
    timeoutMs: 5_000,
    next: []
  }, "Receive and validate the input");

  if (highValue) {
    add({
      id: "check_amount",
      type: "condition",
      name: "Check invoice value",
      description: "Continue only when the invoice value exceeds the review threshold.",
      connectorKey: "condition",
      operationKey: "evaluate",
      inputMapping: { left: "{{trigger.amount}}", operator: "greater_than", right: 5000 },
      condition: { expression: "matched", trueNext: needsAi ? ["analyze_with_ai"] : requiresApproval ? ["request_approval"] : [], falseNext: [] },
      timeoutMs: 5_000,
      next: []
    }, "Check whether the invoice needs review");
  }

  if (needsAi) {
    add({
      id: "analyze_with_ai",
      type: "ai_task",
      name: text.includes("enrich") ? "Enrich the record" : "Analyze with AI",
      description: "Use the configured AI provider to produce a concise, constrained business result.",
      connectorKey: "openai",
      operationKey: "generate",
      inputMapping: { prompt: `Complete this outcome safely: ${request.instruction}\nInput: {{trigger}}` },
      retryPolicy: { maxAttempts: 2, initialDelayMs: 1_000, backoffMultiplier: 2, maxDelayMs: 10_000, retryableErrors: ["TIMEOUT", "RATE_LIMIT"] },
      timeoutMs: 30_000,
      next: []
    }, text.includes("enrich") ? "Enrich the company information" : "Analyze the information");
  }

  if (wantsCrm && crm) {
    add({
      id: "update_crm",
      type: "action",
      name: "Create or update CRM record",
      description: `Create or update the record in ${crm === "hubspot" ? "HubSpot" : "the selected CRM"}.`,
      connectorKey: crm,
      operationKey: crm === "hubspot" ? "upsert_contact" : "request",
      inputMapping: crm === "hubspot"
        ? { properties: { email: "{{trigger.email}}", firstname: "{{trigger.firstName}}", company: "{{trigger.company}}" } }
        : { url: answers.crmUrl ?? "", method: "POST", body: "{{trigger}}" },
      retryPolicy: { maxAttempts: 3, initialDelayMs: 1_000, backoffMultiplier: 2, maxDelayMs: 15_000, retryableErrors: ["TIMEOUT", "RATE_LIMIT", "TEMPORARY"] },
      timeoutMs: 30_000,
      next: []
    }, "Create or update the CRM record");
  }

  if (wantsNotion && notionDatabaseId) {
    add({
      id: "create_notion_page",
      type: "action",
      name: "Create Notion item",
      description: "Create a page in the selected Notion database with the classified request.",
      connectorKey: "notion",
      operationKey: "create_page",
      inputMapping: {
        parent: { database_id: notionDatabaseId },
        properties: {
          Name: {
            title: [{ text: { content: "{{trigger.subject}}" } }]
          }
        },
        children: [{
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: "{{steps.analyze_with_ai.text}}" } }]
          }
        }]
      },
      retryPolicy: { maxAttempts: 3, initialDelayMs: 1_000, backoffMultiplier: 2, maxDelayMs: 15_000, retryableErrors: ["TIMEOUT", "RATE_LIMIT"] },
      timeoutMs: 20_000,
      next: []
    }, "Add the classified request to Notion");
  }

  if (requiresApproval) {
    add({
      id: "request_approval",
      type: "approval",
      name: "Request human approval",
      description: "Pause the execution until an authorized workspace member approves the action.",
      connectorKey: "approval",
      operationKey: "request",
      inputMapping: { title: "Review required", description: request.instruction, context: "{{trigger}}" },
      timeoutMs: 86_400_000,
      next: []
    }, "Request approval before continuing");
  }

  if (wantsSlack && slackChannel) {
    add({
      id: "notify_slack",
      type: "action",
      name: "Notify Slack",
      description: `Send a concise result to ${slackChannel}.`,
      connectorKey: "slack",
      operationKey: "send_message",
      inputMapping: { channel: slackChannel, text: `Outcome completed: ${friendlyName(request.instruction)}\n{{trigger}}` },
      retryPolicy: { maxAttempts: 3, initialDelayMs: 1_000, backoffMultiplier: 2, maxDelayMs: 15_000, retryableErrors: ["TIMEOUT", "RATE_LIMIT"] },
      timeoutMs: 15_000,
      next: []
    }, "Notify the sales team in Slack");
  }

  if (text.includes("email") && !text.includes("enrich")) {
    const recipient = answers.emailRecipient;
    if (!recipient) {
      clarifications.push({
        id: "emailRecipient",
        question: "Who should receive the email?",
        reason: "Rezaru will not invent an email recipient.",
        required: true,
        type: "text"
      });
    } else {
      add({
        id: "send_email",
        type: "action",
        name: "Send email",
        description: `Send the result to ${recipient}.`,
        connectorKey: "gmail",
        operationKey: "send_email",
        inputMapping: { to: recipient, subject: friendlyName(request.instruction), body: "{{steps.analyze_with_ai.text}}" },
        retryPolicy: { maxAttempts: 3, initialDelayMs: 1_000, backoffMultiplier: 2, maxDelayMs: 15_000, retryableErrors: ["TIMEOUT", "RATE_LIMIT"] },
        timeoutMs: 15_000,
        next: []
      }, "Email the completed result");
    }
  }

  add({
    id: "record_result",
    type: "transform",
    name: "Record result",
    description: "Store the result and execution metadata for monitoring.",
    connectorKey: "transform",
    operationKey: "map",
    inputMapping: { completed: true, executionId: "{{execution.id}}" },
    timeoutMs: 5_000,
    next: []
  }, "Record the result");

  const connectionKeys = [...new Set(steps.map((step) => step.connectorKey).filter((key): key is string =>
    Boolean(key) && !["transform", "condition", "delay", "approval"].includes(key!)
  ))];
  const requiredConnections = connectionKeys.map((connectorKey) => ({
    connectorKey,
    label: listConnectors().find((connector) => connector.key === connectorKey)?.name ?? connectorKey,
    reason: `Required by the generated ${steps.find((step) => step.connectorKey === connectorKey)?.name ?? "step"}`,
    required: true
  }));
  const result: CompilationResult = {
    outcomeSummary: friendlyName(request.instruction),
    assumptions: [
      `Times use ${request.timezone ?? "the workspace timezone"}.`,
      "External writes are retried only when the connector supports idempotency.",
      ...(scheduleRequested && !answers.schedule ? ["A Monday 9:00 AM schedule is assumed."] : [])
    ],
    clarificationQuestions: clarifications,
    humanReadablePlan: plan,
    requiredConnections,
    warnings: contextWarnings(text),
    estimatedExecutionsPerMonth: scheduleRequested ? 4 : 250
  };
  if (!clarifications.some((question) => question.required)) {
    result.workflow = {
      id: `wf_${crypto.randomUUID()}`,
      name: friendlyName(request.instruction),
      description: request.instruction,
      version: 1,
      trigger,
      steps,
      settings: {
        concurrency: 5,
        defaultTimeoutMs: 30_000,
        timezone: request.timezone ?? "UTC",
        enabledDays: text.includes("do not run on weekends") ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6],
        retentionDays: 30,
        redactFields: ["password", "token", "secret", "authorization", "apiKey"]
      },
      requiredConnections
    };
  }
  return result;
}

function contextWarnings(text: string): string[] {
  const warnings: string[] = [];
  if (text.includes("delete")) warnings.push("This outcome may perform destructive actions and requires explicit approval.");
  if (text.includes("code")) warnings.push("Arbitrary code nodes are disabled; use approved transformation operations.");
  return warnings;
}

function buildPrompt(request: CompileRequest): string {
  return [
    "You are the Rezaru workflow compiler v1.",
    "Convert a business outcome into the exact CompilationResult JSON shape.",
    "Use only the approved connector operations below.",
    "Do not invent recipients, credentials, record IDs, channels, or irreversible decisions.",
    "When critical information is missing, return clarificationQuestions and omit workflow.",
    `Approved operations: ${JSON.stringify(approvedOperations())}`,
    `Request: ${JSON.stringify(request)}`,
    "Every step must use a listed connectorKey and operationKey. Do not emit code."
  ].join("\n\n");
}

export async function compileOutcome(request: CompileRequest): Promise<CompilationResult> {
  if (request.instruction.trim().length < 10) {
    throw new Error("Describe the business outcome in at least 10 characters.");
  }
  const provider = selectProvider();
  const value = provider
    ? await provider.generateStructured(buildPrompt(request))
    : makeWorkflow(request);
  const validated = CompilationResultSchema.parse(value);
  if (validated.workflow) {
    const approved = new Set(approvedOperations().map((operation) => `${operation.connectorKey}.${operation.operationKey}`));
    for (const step of validated.workflow.steps) {
      if (!approved.has(`${step.connectorKey ?? step.type}.${step.operationKey}`)) {
        throw new Error(`Compiler returned unapproved operation ${step.connectorKey}.${step.operationKey}`);
      }
    }
  }
  return validated;
}
