import { Client as PostgresClient } from "pg";
import { z } from "zod";

export type ConnectorAuthType = "none" | "api_key" | "oauth2" | "basic" | "connection_string";

export type OperationResult = {
  data: Record<string, unknown>;
  waiting?: boolean;
  waitUntil?: Date;
  approval?: { title: string; description: string; context: Record<string, unknown> };
};

export type ConnectorExecutionContext = {
  input: Record<string, unknown>;
  credentials: Record<string, string>;
  demo: boolean;
  signal: AbortSignal;
};

export type ConnectorOperation = {
  key: string;
  name: string;
  description: string;
  inputSchema: z.ZodType<Record<string, unknown>>;
  outputSchema: z.ZodType<Record<string, unknown>>;
  execute: (context: ConnectorExecutionContext) => Promise<OperationResult>;
};

export type ConnectorDefinition = {
  key: string;
  name: string;
  description: string;
  category: "Communication" | "CRM" | "Marketing" | "Finance" | "Databases" | "AI" | "Developer tools" | "Productivity";
  authType: ConnectorAuthType;
  icon: string;
  documentationUrl: string;
  environmentRequirements?: string[];
  triggers: ConnectorOperation[];
  actions: ConnectorOperation[];
  testConnection: (credentials: Record<string, string>) => Promise<{ ok: boolean; message: string }>;
};

const objectSchema = z.record(z.unknown());
const successSchema = z.object({ ok: z.boolean() }).passthrough();

function simulated(name: string, input: Record<string, unknown>): OperationResult {
  return { data: { ok: true, simulated: true, connector: name, received: input, id: `demo_${crypto.randomUUID()}` } };
}

async function jsonRequest(url: string, init: RequestInit, signal: AbortSignal): Promise<Record<string, unknown>> {
  const response = await fetch(url, { ...init, signal });
  const text = await response.text();
  const body = text ? JSON.parse(text) as Record<string, unknown> : {};
  if (!response.ok) {
    const error = new Error(`Connector request failed with status ${response.status}`);
    Object.assign(error, { code: response.status === 429 ? "RATE_LIMIT" : "REMOTE_ERROR", safeDetails: body });
    throw error;
  }
  return body;
}

const noAuthTest = async () => ({ ok: true, message: "Ready" });
const tokenTest = (label: string) => async (credentials: Record<string, string>) =>
  credentials.token || credentials.apiKey || credentials.accessToken
    ? { ok: true, message: `${label} credentials are configured` }
    : { ok: false, message: `${label} credentials are missing` };

const webhook: ConnectorDefinition = {
  key: "webhook",
  name: "Webhook",
  description: "Receive signed HTTP requests and capture sample payloads.",
  category: "Developer tools",
  authType: "none",
  icon: "Webhook",
  documentationUrl: "/docs/connectors/webhook",
  triggers: [{
    key: "receive",
    name: "Receive webhook",
    description: "Starts an execution from a webhook request.",
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    execute: async ({ input }) => ({ data: input })
  }],
  actions: [],
  testConnection: noAuthTest
};

const schedule: ConnectorDefinition = {
  key: "schedule",
  name: "Schedule",
  description: "Start outcomes on a cron schedule.",
  category: "Productivity",
  authType: "none",
  icon: "CalendarClock",
  documentationUrl: "/docs/connectors/schedule",
  triggers: [{
    key: "cron",
    name: "Cron schedule",
    description: "Starts an execution at a scheduled time.",
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    execute: async ({ input }) => ({ data: input })
  }],
  actions: [],
  testConnection: noAuthTest
};

const http: ConnectorDefinition = {
  key: "http",
  name: "HTTP Request",
  description: "Call an HTTP API with controlled methods and timeouts.",
  category: "Developer tools",
  authType: "none",
  icon: "Globe",
  documentationUrl: "/docs/connectors/http",
  triggers: [],
  actions: [{
    key: "request",
    name: "Send request",
    description: "Sends an HTTP request.",
    inputSchema: z.object({
      url: z.string().url(),
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
      headers: z.record(z.string()).default({}),
      body: z.unknown().optional()
    }).passthrough(),
    outputSchema: objectSchema,
    execute: async ({ input, demo, signal }) => {
      if (demo) return simulated("http", input);
      const method = String(input.method ?? "GET");
      return {
        data: await jsonRequest(String(input.url), {
          method,
          headers: { "content-type": "application/json", ...(input.headers as Record<string, string> ?? {}) },
          body: ["GET", "DELETE"].includes(method) ? undefined : JSON.stringify(input.body ?? {})
        }, signal)
      };
    }
  }],
  testConnection: noAuthTest
};

const slack: ConnectorDefinition = {
  key: "slack",
  name: "Slack",
  description: "Send channel and direct messages.",
  category: "Communication",
  authType: "oauth2",
  icon: "MessageSquare",
  documentationUrl: "https://api.slack.com/authentication/oauth-v2",
  environmentRequirements: ["SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET"],
  triggers: [],
  actions: [{
    key: "send_message",
    name: "Send message",
    description: "Posts a message to a Slack channel.",
    inputSchema: z.object({ channel: z.string(), text: z.string() }).passthrough(),
    outputSchema: successSchema,
    execute: async ({ input, credentials, demo, signal }) => demo
      ? simulated("slack", input)
      : { data: await jsonRequest("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: { authorization: `Bearer ${credentials.accessToken}`, "content-type": "application/json" },
          body: JSON.stringify(input)
        }, signal) }
  }],
  testConnection: tokenTest("Slack")
};

const gmail: ConnectorDefinition = {
  key: "gmail",
  name: "Gmail",
  description: "Send operational email from Google Workspace.",
  category: "Communication",
  authType: "oauth2",
  icon: "Mail",
  documentationUrl: "https://developers.google.com/gmail/api",
  environmentRequirements: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  triggers: [],
  actions: [{
    key: "send_email",
    name: "Send email",
    description: "Sends an email through Gmail.",
    inputSchema: z.object({ to: z.string().email(), subject: z.string(), body: z.string() }).passthrough(),
    outputSchema: objectSchema,
    execute: async ({ input, credentials, demo, signal }) => {
      if (demo) return simulated("gmail", input);
      const raw = Buffer.from(`To: ${input.to}\r\nSubject: ${input.subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${input.body}`).toString("base64url");
      return { data: await jsonRequest("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { authorization: `Bearer ${credentials.accessToken}`, "content-type": "application/json" },
        body: JSON.stringify({ raw })
      }, signal) };
    }
  }],
  testConnection: tokenTest("Gmail")
};

const googleSheets: ConnectorDefinition = {
  key: "google_sheets",
  name: "Google Sheets",
  description: "Read and append spreadsheet data.",
  category: "Productivity",
  authType: "oauth2",
  icon: "Sheet",
  documentationUrl: "https://developers.google.com/sheets/api",
  environmentRequirements: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  triggers: [],
  actions: [{
    key: "append_rows",
    name: "Append rows",
    description: "Appends rows to a sheet.",
    inputSchema: z.object({ spreadsheetId: z.string(), range: z.string(), values: z.array(z.array(z.unknown())) }).passthrough(),
    outputSchema: objectSchema,
    execute: async ({ input, credentials, demo, signal }) => demo
      ? simulated("google_sheets", input)
      : { data: await jsonRequest(
          `https://sheets.googleapis.com/v4/spreadsheets/${input.spreadsheetId}/values/${encodeURIComponent(String(input.range))}:append?valueInputOption=USER_ENTERED`,
          {
            method: "POST",
            headers: { authorization: `Bearer ${credentials.accessToken}`, "content-type": "application/json" },
            body: JSON.stringify({ values: input.values })
          },
          signal
        ) }
  }],
  testConnection: tokenTest("Google Sheets")
};

const postgres: ConnectorDefinition = {
  key: "postgresql",
  name: "PostgreSQL",
  description: "Run parameterized, read-only business queries.",
  category: "Databases",
  authType: "connection_string",
  icon: "Database",
  documentationUrl: "https://www.postgresql.org/docs/current/libpq-connect.html",
  triggers: [],
  actions: [{
    key: "query",
    name: "Run query",
    description: "Runs a parameterized query. Multiple statements are blocked.",
    inputSchema: z.object({ query: z.string(), params: z.array(z.unknown()).default([]) }).passthrough(),
    outputSchema: objectSchema,
    execute: async ({ input, credentials, demo }) => {
      if (demo) return { data: { rows: [{ revenue: 128400, deals: 31 }], rowCount: 1, simulated: true } };
      const query = String(input.query).trim();
      if (query.includes(";") || !/^(select|with)\b/i.test(query)) throw new Error("Only one read-only SELECT query is allowed");
      const client = new PostgresClient({ connectionString: credentials.connectionString, statement_timeout: 30_000 });
      await client.connect();
      try {
        const result = await client.query(query, input.params as unknown[]);
        return { data: { rows: result.rows, rowCount: result.rowCount } };
      } finally {
        await client.end();
      }
    }
  }],
  testConnection: async (credentials) => {
    if (!credentials.connectionString) return { ok: false, message: "Connection string is missing" };
    const client = new PostgresClient({ connectionString: credentials.connectionString, connectionTimeoutMillis: 5_000 });
    try {
      await client.connect();
      await client.query("select 1");
      return { ok: true, message: "Database connection succeeded" };
    } catch {
      return { ok: false, message: "Could not connect to the database" };
    } finally {
      await client.end().catch(() => undefined);
    }
  }
};

const llm: ConnectorDefinition = {
  key: "openai",
  name: "OpenAI-compatible AI",
  description: "Generate constrained summaries and classifications.",
  category: "AI",
  authType: "api_key",
  icon: "Sparkles",
  documentationUrl: "https://platform.openai.com/docs/api-reference",
  triggers: [],
  actions: [{
    key: "generate",
    name: "Generate text",
    description: "Runs an AI prompt through a configured compatible endpoint.",
    inputSchema: z.object({ prompt: z.string(), model: z.string().optional(), system: z.string().optional() }).passthrough(),
    outputSchema: objectSchema,
    execute: async ({ input, credentials, demo, signal }) => {
      if (demo) return { data: { text: "Revenue increased 12% week over week, led by enterprise renewals.", simulated: true, inputTokens: 42, outputTokens: 19 } };
      const data = await jsonRequest(`${credentials.baseUrl ?? "https://api.openai.com/v1"}/chat/completions`, {
        method: "POST",
        headers: { authorization: `Bearer ${credentials.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: input.model ?? credentials.model ?? "gpt-5-mini",
          messages: [{ role: "system", content: input.system ?? "Be concise and accurate." }, { role: "user", content: input.prompt }]
        })
      }, signal);
      const choices = data.choices as Array<{ message?: { content?: string } }> | undefined;
      return { data: { text: choices?.[0]?.message?.content ?? "", usage: data.usage } };
    }
  }],
  testConnection: tokenTest("AI")
};

function restfulConnector(
  key: string,
  name: string,
  category: ConnectorDefinition["category"],
  baseUrl: string,
  operationKey: string,
  path: string,
  method: "POST" | "PATCH" = "POST"
): ConnectorDefinition {
  return {
    key,
    name,
    description: `Use ${name} in outcomes.`,
    category,
    authType: "oauth2",
    icon: name,
    documentationUrl: baseUrl,
    triggers: [],
    actions: [{
      key: operationKey,
      name: operationKey.split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" "),
      description: `${name} operation`,
      inputSchema: objectSchema,
      outputSchema: objectSchema,
      execute: async ({ input, credentials, demo, signal }) => demo
        ? simulated(key, input)
        : { data: await jsonRequest(`${baseUrl}${path}`, {
            method,
            headers: { authorization: `Bearer ${credentials.accessToken ?? credentials.apiKey}`, "content-type": "application/json" },
            body: JSON.stringify(input)
          }, signal) }
    }],
    testConnection: tokenTest(name)
  };
}

const delay: ConnectorDefinition = {
  key: "delay",
  name: "Delay",
  description: "Pause an execution durably.",
  category: "Productivity",
  authType: "none",
  icon: "Timer",
  documentationUrl: "/docs/connectors/delay",
  triggers: [],
  actions: [{
    key: "wait",
    name: "Wait",
    description: "Pauses until a specified time.",
    inputSchema: z.object({ milliseconds: z.number().min(0).max(31_536_000_000) }).passthrough(),
    outputSchema: objectSchema,
    execute: async ({ input }) => ({
      data: { resumeAt: new Date(Date.now() + Number(input.milliseconds)).toISOString() },
      waiting: true,
      waitUntil: new Date(Date.now() + Number(input.milliseconds))
    })
  }],
  testConnection: noAuthTest
};

const condition: ConnectorDefinition = {
  key: "condition",
  name: "Condition",
  description: "Route data using controlled comparisons.",
  category: "Productivity",
  authType: "none",
  icon: "GitBranch",
  documentationUrl: "/docs/connectors/condition",
  triggers: [],
  actions: [{
    key: "evaluate",
    name: "Evaluate condition",
    description: "Compares two values without executing code.",
    inputSchema: z.object({
      left: z.unknown(),
      operator: z.enum(["equals", "not_equals", "greater_than", "less_than", "contains", "exists"]),
      right: z.unknown().optional()
    }).passthrough(),
    outputSchema: objectSchema,
    execute: async ({ input }) => {
      const { left, right, operator } = input;
      const matched =
        operator === "equals" ? left === right :
        operator === "not_equals" ? left !== right :
        operator === "greater_than" ? Number(left) > Number(right) :
        operator === "less_than" ? Number(left) < Number(right) :
        operator === "contains" ? String(left).includes(String(right)) :
        left !== undefined && left !== null;
      return { data: { matched } };
    }
  }],
  testConnection: noAuthTest
};

const transform: ConnectorDefinition = {
  key: "transform",
  name: "Data transformation",
  description: "Map, pick, merge, and format data safely.",
  category: "Developer tools",
  authType: "none",
  icon: "Braces",
  documentationUrl: "/docs/connectors/transform",
  triggers: [],
  actions: [{
    key: "map",
    name: "Map fields",
    description: "Returns the validated mapped input.",
    inputSchema: objectSchema,
    outputSchema: objectSchema,
    execute: async ({ input }) => ({ data: input })
  }],
  testConnection: noAuthTest
};

const approval: ConnectorDefinition = {
  key: "approval",
  name: "Human approval",
  description: "Pause before a sensitive action.",
  category: "Productivity",
  authType: "none",
  icon: "BadgeCheck",
  documentationUrl: "/docs/connectors/approval",
  triggers: [],
  actions: [{
    key: "request",
    name: "Request approval",
    description: "Pauses an execution for a workspace decision.",
    inputSchema: z.object({ title: z.string(), description: z.string(), context: objectSchema.default({}) }).passthrough(),
    outputSchema: objectSchema,
    execute: async ({ input }) => ({
      data: { requested: true },
      waiting: true,
      approval: {
        title: String(input.title),
        description: String(input.description),
        context: input.context as Record<string, unknown>
      }
    })
  }],
  testConnection: noAuthTest
};

const stripe = restfulConnector("stripe", "Stripe", "Finance", "https://api.stripe.com", "create_payment_link", "/v1/payment_links");
stripe.authType = "api_key";
const hubspot = restfulConnector("hubspot", "HubSpot", "CRM", "https://api.hubapi.com", "upsert_contact", "/crm/v3/objects/contacts");
const notion = restfulConnector("notion", "Notion", "Productivity", "https://api.notion.com", "create_page", "/v1/pages");

export const connectorRegistry = new Map<string, ConnectorDefinition>(
  [webhook, schedule, http, slack, gmail, googleSheets, postgres, llm, notion, stripe, hubspot, delay, condition, transform, approval]
    .map((connector) => [connector.key, connector])
);

export function listConnectors(): ConnectorDefinition[] {
  return [...connectorRegistry.values()];
}

export function getConnector(key: string): ConnectorDefinition {
  const connector = connectorRegistry.get(key);
  if (!connector) throw Object.assign(new Error(`Connector ${key} is not approved`), { code: "UNKNOWN_CONNECTOR" });
  return connector;
}

export function getOperation(connectorKey: string, operationKey: string): ConnectorOperation {
  const connector = getConnector(connectorKey);
  const operation = [...connector.triggers, ...connector.actions].find((item) => item.key === operationKey);
  if (!operation) throw Object.assign(new Error(`Operation ${connectorKey}.${operationKey} is not approved`), { code: "UNKNOWN_OPERATION" });
  return operation;
}
