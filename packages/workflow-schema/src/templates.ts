import type { WorkflowDefinition } from "./index";

export type SeedTemplate = {
  slug: string;
  title: string;
  description: string;
  department: string;
  useCase: string;
  requiredIntegrations: string[];
  setupMinutes: number;
  monthlyMinutesSaved: number;
  configurableVariables: Record<string, { label: string; type: "text" | "number"; default: string | number }>;
  definitionTemplate: WorkflowDefinition;
};

const catalog = [
  ["qualify-route-leads", "Qualify and route inbound leads", "Sales", "Lead management", ["hubspot", "slack"], 8, 960],
  ["weekly-sales-report", "Generate a weekly sales report", "Sales", "Reporting", ["postgresql", "openai", "gmail"], 12, 360],
  ["high-value-invoices", "Process high-value invoices", "Finance", "Invoice review", ["openai", "slack"], 10, 720],
  ["support-triage", "Triage customer support requests", "Customer Support", "Ticket triage", ["gmail", "openai", "notion"], 9, 1200],
  ["failed-payment-recovery", "Recover failed payments", "Finance", "Revenue recovery", ["stripe", "gmail", "hubspot"], 15, 600],
  ["employee-onboarding", "Onboard a new employee", "HR", "Onboarding", ["google_sheets", "gmail", "notion"], 14, 300],
  ["company-mentions", "Monitor important company mentions", "Marketing", "Brand monitoring", ["http", "openai", "slack"], 10, 240],
  ["sync-customer-data", "Synchronize customer data", "Operations", "Data operations", ["postgresql", "hubspot"], 12, 540],
  ["renewal-risk", "Flag accounts at renewal risk", "Customer Support", "Retention", ["postgresql", "openai", "slack"], 15, 480],
  ["campaign-brief", "Turn campaign data into a brief", "Marketing", "Campaign reporting", ["google_sheets", "openai", "gmail"], 10, 420],
  ["expense-policy", "Review expenses against policy", "Finance", "Compliance", ["openai", "slack"], 12, 660],
  ["vendor-onboarding", "Coordinate vendor onboarding", "Operations", "Procurement", ["notion", "gmail"], 9, 360],
  ["incident-summary", "Publish an incident summary", "Engineering", "Incident management", ["http", "openai", "slack"], 11, 180],
  ["database-health", "Monitor critical database checks", "Engineering", "Reliability", ["postgresql", "slack"], 8, 240],
  ["lead-follow-up", "Personalize lead follow-up", "Sales", "Outbound", ["hubspot", "openai", "gmail"], 12, 900],
  ["customer-cancellation", "Coordinate cancellation retention", "Customer Support", "Retention", ["hubspot", "gmail", "slack"], 12, 480],
  ["daily-cash-brief", "Send a daily cash position brief", "Finance", "Treasury", ["postgresql", "openai", "gmail"], 15, 420],
  ["compliance-evidence", "Collect compliance evidence", "Compliance", "Audit readiness", ["http", "google_sheets", "notion"], 18, 780],
  ["access-review", "Run a quarterly access review", "Compliance", "Access governance", ["http", "gmail"], 16, 240],
  ["product-feedback", "Summarize product feedback", "Operations", "Voice of customer", ["notion", "openai", "slack"], 10, 480]
] as const;

function operationFor(connectorKey: string): { operationKey: string; type: WorkflowDefinition["steps"][number]["type"]; input: Record<string, unknown> } {
  if (connectorKey === "slack") return { operationKey: "send_message", type: "action", input: { channel: "{{variables.channel}}", text: "Outcome result: {{trigger}}" } };
  if (connectorKey === "gmail") return { operationKey: "send_email", type: "action", input: { to: "{{variables.recipient}}", subject: "Rezaru report", body: "{{trigger}}" } };
  if (connectorKey === "postgresql") return { operationKey: "query", type: "action", input: { query: "SELECT 1 AS ready", params: [] } };
  if (connectorKey === "openai") return { operationKey: "generate", type: "ai_task", input: { prompt: "Complete this business outcome using the supplied input: {{trigger}}" } };
  if (connectorKey === "hubspot") return { operationKey: "upsert_contact", type: "action", input: { properties: { email: "{{trigger.email}}" } } };
  if (connectorKey === "google_sheets") return { operationKey: "append_rows", type: "action", input: { spreadsheetId: "{{variables.spreadsheetId}}", range: "Sheet1!A:Z", values: [["{{trigger}}"]] } };
  if (connectorKey === "notion") return { operationKey: "create_page", type: "action", input: { parent: { database_id: "{{variables.notionDatabaseId}}" }, properties: {} } };
  if (connectorKey === "stripe") return { operationKey: "create_payment_link", type: "action", input: { line_items: [] } };
  return { operationKey: "request", type: "action", input: { url: "{{variables.endpointUrl}}", method: "GET" } };
}

export const seedTemplates: SeedTemplate[] = catalog.map(([slug, title, department, useCase, requiredIntegrations, setupMinutes, monthlyMinutesSaved]) => {
  const integrations: readonly string[] = requiredIntegrations;
  const steps: WorkflowDefinition["steps"] = [
    {
      id: "validate_input",
      type: "transform",
      name: "Validate incoming data",
      description: "Normalize and validate the business input.",
      connectorKey: "transform",
      operationKey: "map",
      inputMapping: { payload: "{{trigger}}" },
      timeoutMs: 5_000,
      next: integrations.length ? ["integration_1"] : ["record_result"]
    },
    ...integrations.map((connectorKey, index) => {
      const operation = operationFor(connectorKey);
      return {
        id: `integration_${index + 1}`,
        type: operation.type,
        name: `${operation.operationKey.replaceAll("_", " ")} with ${connectorKey.replaceAll("_", " ")}`,
        description: `Perform the approved ${connectorKey} operation for this outcome.`,
        connectorKey,
        operationKey: operation.operationKey,
        inputMapping: operation.input,
        retryPolicy: { maxAttempts: 3, initialDelayMs: 1_000, backoffMultiplier: 2, maxDelayMs: 30_000, retryableErrors: ["TIMEOUT", "RATE_LIMIT", "TEMPORARY"] },
        timeoutMs: 30_000,
        next: [index === integrations.length - 1 ? "record_result" : `integration_${index + 2}`]
      } satisfies WorkflowDefinition["steps"][number];
    }),
    {
      id: "record_result",
      type: "transform",
      name: "Record the result",
      description: "Persist the result for monitoring and improvement analysis.",
      connectorKey: "transform",
      operationKey: "map",
      inputMapping: { completed: true, executionId: "{{execution.id}}" },
      timeoutMs: 5_000,
      next: []
    }
  ];
  return {
    slug,
    title,
    description: `${title} with a reviewable plan, secure connections, retries, and execution history.`,
    department,
    useCase,
    requiredIntegrations: [...integrations],
    setupMinutes,
    monthlyMinutesSaved,
    configurableVariables: {
      ...(integrations.includes("slack") ? { channel: { label: "Slack channel", type: "text" as const, default: "#operations" } } : {}),
      ...(integrations.includes("gmail") ? { recipient: { label: "Email recipient", type: "text" as const, default: "owner@example.com" } } : {}),
      ...(integrations.includes("google_sheets") ? { spreadsheetId: { label: "Spreadsheet ID", type: "text" as const, default: "" } } : {}),
      ...(integrations.includes("notion") ? { notionDatabaseId: { label: "Notion database ID", type: "text" as const, default: "" } } : {}),
      ...(integrations.includes("http") ? { endpointUrl: { label: "API endpoint URL", type: "text" as const, default: "https://example.com/api/status" } } : {})
    },
    definitionTemplate: {
      id: `template_${slug}`,
      name: title,
      description: `${title} outcome template.`,
      version: 1,
      trigger: slug.includes("weekly") || slug.includes("daily") || slug.includes("quarterly") || slug.includes("monitor")
        ? { type: "schedule", connectorKey: "schedule", operationKey: "cron", configuration: { cron: slug.includes("weekly") ? "0 9 * * 1" : "0 9 * * *" } }
        : { type: "webhook", connectorKey: "webhook", operationKey: "receive", configuration: {} },
      steps,
      settings: { concurrency: 5, defaultTimeoutMs: 30_000, timezone: "UTC", enabledDays: [0,1,2,3,4,5,6], retentionDays: 30, redactFields: ["password", "token", "secret", "authorization", "apiKey"] },
      requiredConnections: integrations.map((connectorKey) => ({ connectorKey, label: connectorKey.replaceAll("_", " "), reason: `Required by ${title}`, required: true }))
    }
  };
});
