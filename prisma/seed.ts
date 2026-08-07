import { createHash } from "node:crypto";
import { encryptSecretRecord } from "@rezaru/config";
import { prisma } from "@rezaru/database";
import { seedTemplates, type WorkflowDefinition } from "@rezaru/workflow-schema";

const compilerVersion = "seed-v1";

function checksum(workflow: WorkflowDefinition) {
  return createHash("sha256").update(JSON.stringify(workflow)).digest("hex");
}

function baseWorkflow(
  id: string,
  name: string,
  description: string,
  trigger: WorkflowDefinition["trigger"],
  steps: WorkflowDefinition["steps"],
  requiredConnections: string[]
): WorkflowDefinition {
  return {
    id,
    name,
    description,
    version: 1,
    trigger,
    steps,
    settings: {
      concurrency: 5,
      defaultTimeoutMs: 30_000,
      timezone: "America/New_York",
      enabledDays: [0, 1, 2, 3, 4, 5, 6],
      retentionDays: 30,
      redactFields: ["password", "token", "secret", "authorization", "apiKey"]
    },
    requiredConnections: requiredConnections.map((connectorKey) => ({
      connectorKey,
      label: connectorKey.replaceAll("_", " "),
      reason: `Required by ${name}`,
      required: true
    }))
  };
}

const sampleWorkflows: WorkflowDefinition[] = [
  baseWorkflow(
    "seed_lead_routing",
    "Qualify and route inbound leads",
    "Validate incoming website leads, create a HubSpot contact, and notify sales in Slack.",
    { type: "webhook", connectorKey: "webhook", operationKey: "receive", configuration: {} },
    [
      { id: "validate", type: "transform", name: "Validate lead", description: "Validate and normalize the incoming lead.", connectorKey: "transform", operationKey: "map", inputMapping: { email: "{{trigger.body.email}}", company: "{{trigger.body.company}}" }, timeoutMs: 5000, next: ["hubspot"] },
      { id: "hubspot", type: "action", name: "Create HubSpot contact", description: "Create or update the lead in HubSpot.", connectorKey: "hubspot", operationKey: "upsert_contact", inputMapping: { properties: { email: "{{steps.validate.email}}", company: "{{steps.validate.company}}" } }, retryPolicy: { maxAttempts: 3, initialDelayMs: 1000, backoffMultiplier: 2, maxDelayMs: 15000, retryableErrors: ["TIMEOUT", "RATE_LIMIT"] }, timeoutMs: 30000, next: ["slack"] },
      { id: "slack", type: "action", name: "Notify sales", description: "Notify #sales about the qualified lead.", connectorKey: "slack", operationKey: "send_message", inputMapping: { channel: "#sales", text: "New qualified lead: {{steps.validate.email}}" }, retryPolicy: { maxAttempts: 3, initialDelayMs: 1000, backoffMultiplier: 2, maxDelayMs: 15000, retryableErrors: ["TIMEOUT", "RATE_LIMIT"] }, timeoutMs: 15000, next: ["record"] },
      { id: "record", type: "transform", name: "Record result", description: "Persist the routing result.", connectorKey: "transform", operationKey: "map", inputMapping: { completed: true }, timeoutMs: 5000, next: [] }
    ],
    ["hubspot", "slack"]
  ),
  baseWorkflow(
    "seed_sales_report",
    "Weekly sales performance brief",
    "Every Monday, query sales metrics, create an AI summary, and email the report.",
    { type: "schedule", connectorKey: "schedule", operationKey: "cron", configuration: { cron: "0 9 * * 1" } },
    [
      { id: "query", type: "action", name: "Query sales metrics", description: "Run the approved sales metrics query.", connectorKey: "postgresql", operationKey: "query", inputMapping: { query: "SELECT 128400 AS revenue, 31 AS deals", params: [] }, timeoutMs: 30000, next: ["summary"] },
      { id: "summary", type: "ai_task", name: "Write executive summary", description: "Summarize verified sales metrics.", connectorKey: "openai", operationKey: "generate", inputMapping: { prompt: "Summarize these sales metrics: {{steps.query.rows}}" }, timeoutMs: 30000, next: ["email"] },
      { id: "email", type: "action", name: "Email the CEO", description: "Send the weekly sales brief.", connectorKey: "gmail", operationKey: "send_email", inputMapping: { to: "ceo@example.com", subject: "Weekly sales brief", body: "{{steps.summary.text}}" }, timeoutMs: 15000, next: [] }
    ],
    ["postgresql", "openai", "gmail"]
  ),
  baseWorkflow(
    "seed_invoice_review",
    "Review high-value invoices",
    "Review invoices over $5,000, explain anomalies, request approval, and notify finance.",
    { type: "webhook", connectorKey: "webhook", operationKey: "receive", configuration: {} },
    [
      { id: "threshold", type: "condition", name: "Check invoice value", description: "Continue when the invoice exceeds $5,000.", connectorKey: "condition", operationKey: "evaluate", inputMapping: { left: "{{trigger.body.amount}}", operator: "greater_than", right: 5000 }, condition: { expression: "matched", trueNext: ["analyze"], falseNext: ["record"] }, timeoutMs: 5000, next: [] },
      { id: "analyze", type: "ai_task", name: "Explain anomalies", description: "Produce an evidence-bound anomaly explanation.", connectorKey: "openai", operationKey: "generate", inputMapping: { prompt: "Review this invoice for anomalies: {{trigger.body}}" }, timeoutMs: 30000, next: ["approval"] },
      { id: "approval", type: "approval", name: "Request finance approval", description: "Pause until an operator approves payment.", connectorKey: "approval", operationKey: "request", inputMapping: { title: "High-value invoice review", description: "Approve this invoice for payment.", context: "{{trigger.body}}" }, timeoutMs: 86400000, next: ["notify"] },
      { id: "notify", type: "action", name: "Notify finance", description: "Notify the finance channel after approval.", connectorKey: "slack", operationKey: "send_message", inputMapping: { channel: "#finance", text: "High-value invoice approved." }, timeoutMs: 15000, next: ["record"] },
      { id: "record", type: "transform", name: "Record decision", description: "Persist the review result.", connectorKey: "transform", operationKey: "map", inputMapping: { completed: true }, timeoutMs: 5000, next: [] }
    ],
    ["openai", "slack"]
  ),
  baseWorkflow(
    "seed_failed_payment",
    "Recover failed payments",
    "Send a recovery email, create a CRM task, wait, and escalate unresolved payments.",
    { type: "connector", connectorKey: "stripe", operationKey: "create_payment_link", configuration: { event: "payment_intent.payment_failed" } },
    [
      { id: "email", type: "action", name: "Send recovery email", description: "Send the customer a secure recovery message.", connectorKey: "gmail", operationKey: "send_email", inputMapping: { to: "{{trigger.customer.email}}", subject: "Payment needs attention", body: "Update your payment method." }, timeoutMs: 15000, next: ["crm"] },
      { id: "crm", type: "action", name: "Create CRM task", description: "Create a follow-up task in HubSpot.", connectorKey: "hubspot", operationKey: "upsert_contact", inputMapping: { properties: { email: "{{trigger.customer.email}}", payment_status: "failed" } }, timeoutMs: 30000, next: ["wait"] },
      { id: "wait", type: "delay", name: "Wait 24 hours", description: "Pause durably before checking payment status.", connectorKey: "delay", operationKey: "wait", inputMapping: { milliseconds: 86400000 }, timeoutMs: 86400000, next: ["notify"] },
      { id: "notify", type: "action", name: "Notify finance", description: "Escalate unresolved recovery to finance.", connectorKey: "slack", operationKey: "send_message", inputMapping: { channel: "#finance", text: "Payment remains unresolved for {{trigger.customer.email}}" }, timeoutMs: 15000, next: [] }
    ],
    ["stripe", "gmail", "hubspot", "slack"]
  )
];

async function seed() {
  for (const template of seedTemplates) {
    const existing = await prisma.outcomeTemplate.findFirst({ where: { workspaceId: null, slug: template.slug } });
    const data = {
      title: template.title,
      description: template.description,
      department: template.department,
      useCase: template.useCase,
      requiredIntegrations: template.requiredIntegrations,
      setupMinutes: template.setupMinutes,
      monthlyMinutesSaved: template.monthlyMinutesSaved,
      definitionTemplate: template.definitionTemplate as never,
      configurableVariables: template.configurableVariables as never,
      published: true
    };
    if (existing) await prisma.outcomeTemplate.update({ where: { id: existing.id }, data });
    else await prisma.outcomeTemplate.create({ data: { slug: template.slug, ...data } });
  }

  const user = await prisma.user.upsert({
    where: { email: "demo@rezaru.local" },
    update: { name: "Alex Morgan", emailVerified: true },
    create: { email: "demo@rezaru.local", name: "Alex Morgan", emailVerified: true }
  });
  const workspace = await prisma.workspace.upsert({
    where: { slug: "northstar-operations" },
    update: { name: "Northstar Operations", onboardingCompletedAt: new Date(), department: "Operations", companySize: "51–200", tools: ["Slack", "HubSpot", "Gmail", "PostgreSQL"] },
    create: { name: "Northstar Operations", slug: "northstar-operations", onboardingCompletedAt: new Date(), department: "Operations", companySize: "51–200", tools: ["Slack", "HubSpot", "Gmail", "PostgreSQL"] }
  });
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    update: { role: "OWNER" },
    create: { workspaceId: workspace.id, userId: user.id, role: "OWNER" }
  });
  await prisma.subscription.upsert({
    where: { workspaceId: workspace.id },
    update: { plan: "PRO", status: "development" },
    create: { workspaceId: workspace.id, plan: "PRO", status: "development" }
  });

  for (const connectorKey of ["slack", "hubspot", "gmail", "postgresql", "openai", "stripe"]) {
    const name = `Demo ${connectorKey.replaceAll("_", " ")}`;
    const existing = await prisma.connection.findFirst({ where: { workspaceId: workspace.id, name } });
    if (!existing) {
      await prisma.connection.create({
        data: {
          workspaceId: workspace.id,
          name,
          connectorKey,
          status: "CONNECTED",
          metadata: { simulated: true },
          lastTestedAt: new Date(),
          credential: { create: { encryptedData: encryptSecretRecord({ token: "demo", apiKey: "demo", accessToken: "demo", connectionString: "demo" }) } }
        }
      });
    }
  }

  for (const [index, workflow] of sampleWorkflows.entries()) {
    const existing = await prisma.outcome.findFirst({ where: { workspaceId: workspace.id, name: workflow.name, deletedAt: null } });
    if (existing) continue;
    const outcome = await prisma.outcome.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        name: workflow.name,
        description: workflow.description,
        status: index < 2 ? "ACTIVE" : index === 2 ? "NEEDS_ATTENTION" : "DRAFT",
        tags: ["seed", "demo"],
        estimatedMinutesSaved: [960, 360, 720, 600][index]!,
        workflowVersions: {
          create: {
            version: 1,
            status: index < 2 ? "ACTIVE" : "DRAFT",
            activatedAt: index < 2 ? new Date() : undefined,
            definition: workflow as never,
            explanation: {
              outcomeSummary: workflow.name,
              assumptions: ["Seeded demo outcome; all external operations are simulated."],
              clarificationQuestions: [],
              humanReadablePlan: workflow.steps.map((step) => ({ id: step.id, title: step.name, description: step.description, connectorKey: step.connectorKey, risk: step.type === "approval" ? "medium" : "low" })),
              workflow,
              requiredConnections: workflow.requiredConnections,
              warnings: []
            } as never,
            compilerVersion,
            checksum: checksum(workflow),
            steps: { create: workflow.steps.map((step, position) => ({ stepId: step.id, position, definition: step as never })) }
          }
        }
      },
      include: { workflowVersions: true }
    });
    if (index < 2) {
      const version = outcome.workflowVersions[0]!;
      await prisma.outcome.update({ where: { id: outcome.id }, data: { activeWorkflowVersionId: version.id } });
      for (let run = 0; run < 4; run += 1) {
        const failed = index === 0 && run === 3;
        await prisma.execution.create({
          data: {
            workspaceId: workspace.id,
            outcomeId: outcome.id,
            workflowVersionId: version.id,
            status: failed ? "FAILED" : "SUCCEEDED",
            mode: "demo",
            triggerInput: { email: `lead${run + 1}@example.com`, company: "Northstar Labs", simulated: true },
            startedAt: new Date(Date.now() - (run + 1) * 3_600_000),
            completedAt: new Date(Date.now() - (run + 1) * 3_600_000 + 1850),
            durationMs: 1850 + run * 110,
            error: failed ? { code: "RATE_LIMIT", message: "HubSpot returned a temporary rate-limit response." } : undefined,
            steps: {
              create: workflow.steps.map((step, stepIndex) => ({
                stepId: step.id,
                name: step.name,
                status: failed && stepIndex === 1 ? "FAILED" : failed && stepIndex > 1 ? "PENDING" : "SUCCEEDED",
                attempt: failed && stepIndex === 1 ? 3 : 1,
                input: { simulated: true },
                output: failed && stepIndex === 1 ? undefined : { ok: true, simulated: true },
                error: failed && stepIndex === 1 ? { code: "RATE_LIMIT", message: "HubSpot returned a temporary rate-limit response." } : undefined,
                startedAt: new Date(Date.now() - (run + 1) * 3_600_000 + stepIndex * 300),
                completedAt: failed && stepIndex > 1 ? undefined : new Date(Date.now() - (run + 1) * 3_600_000 + stepIndex * 300 + 250),
                durationMs: failed && stepIndex > 1 ? undefined : 250
              }))
            }
          }
        });
      }
    }
  }

  const attentionOutcome = await prisma.outcome.findFirst({ where: { workspaceId: workspace.id, status: "NEEDS_ATTENTION" } });
  if (attentionOutcome && !(await prisma.improvementSuggestion.findFirst({ where: { outcomeId: attentionOutcome.id } }))) {
    await prisma.improvementSuggestion.create({
      data: {
        workspaceId: workspace.id,
        outcomeId: attentionOutcome.id,
        type: "retry_policy",
        title: "Add bounded retries to the AI analysis",
        description: "Two recent temporary provider failures would have recovered with exponential backoff.",
        impact: { estimatedSuccessRateIncrease: 4, evidenceExecutions: 2 },
        proposedPatch: { stepId: "analyze", retryPolicy: { maxAttempts: 3 }, requiresApproval: true }
      }
    });
  }
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
