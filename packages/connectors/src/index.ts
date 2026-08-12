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

/**
 * One value the owner has to paste in to connect a channel.
 *
 * A single `authType` was enough while every connector needed exactly one
 * secret. The messaging channels do not: WhatsApp needs a token *and* the
 * phone number it belongs to, Instagram a token *and* the page id. Without
 * this the second value had nowhere to go.
 *
 * `hint` is shown under the field and should say where to find the value,
 * because the person reading it has never opened a developer console.
 */
export type CredentialField = {
  key: string;
  label: string;
  hint: string;
  /** Secrets render as password inputs; ids and numbers stay readable. */
  secret: boolean;
};

export type ConnectorDefinition = {
  key: string;
  name: string;
  description: string;
  category: "Channels" | "Communication" | "CRM" | "Marketing" | "Finance" | "Databases" | "AI" | "Developer tools" | "Productivity";
  authType: ConnectorAuthType;
  icon: string;
  documentationUrl: string;
  environmentRequirements?: string[];
  /** Omitted means the one field implied by `authType`. */
  credentialFields?: CredentialField[];
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

/**
 * The three places customers actually write from.
 *
 * Each one is a trigger and an action: a message arrives, the agent answers
 * in the same thread. The trigger bodies normalise whatever shape the
 * platform sends into the same {chatId, from, text} so a workflow written
 * for Telegram keeps working when the owner adds WhatsApp.
 *
 * `testConnection` calls the real API rather than checking that the field is
 * non-empty. A typo in a token has to fail here, on the connect screen —
 * not silently at two in the morning when a customer is waiting.
 */
const messageSchema = z.object({ chatId: z.string(), text: z.string() }).passthrough();
const incomingSchema = z.object({
  chatId: z.string(),
  from: z.string(),
  text: z.string(),
  channel: z.string()
}).passthrough();

const telegram: ConnectorDefinition = {
  key: "telegram",
  name: "Telegram",
  description: "Отвечает в Telegram от имени вашего бота.",
  category: "Channels",
  authType: "api_key",
  icon: "Send",
  documentationUrl: "https://core.telegram.org/bots#how-do-i-create-a-bot",
  credentialFields: [
    { key: "botToken", label: "Токен бота", hint: "Напишите @BotFather в Telegram, команда /newbot — он пришлёт длинную строку с двоеточием.", secret: true }
  ],
  triggers: [{
    key: "receive_message",
    name: "Сообщение от клиента",
    description: "Запускается, когда клиент пишет боту.",
    inputSchema: objectSchema,
    outputSchema: incomingSchema,
    execute: async ({ input }) => {
      // Telegram posts an "update" envelope; the message can sit under
      // message or edited_message depending on what the customer did.
      const update = input as { message?: Record<string, unknown>; edited_message?: Record<string, unknown> };
      const message = (update.message ?? update.edited_message ?? {}) as {
        chat?: { id?: number | string };
        from?: { first_name?: string; username?: string };
        text?: string;
      };
      return { data: {
        chatId: String(message.chat?.id ?? ""),
        from: message.from?.first_name ?? message.from?.username ?? "",
        text: message.text ?? "",
        channel: "telegram",
        raw: input
      } };
    }
  }],
  actions: [{
    key: "send_message",
    name: "Ответить клиенту",
    description: "Отправляет сообщение в тот же диалог.",
    inputSchema: messageSchema,
    outputSchema: objectSchema,
    execute: async ({ input, credentials, demo, signal }) => demo
      ? simulated("telegram", input)
      : { data: await jsonRequest(`https://api.telegram.org/bot${credentials.botToken}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: input.chatId, text: input.text })
        }, signal) }
  }],
  testConnection: async (credentials) => {
    if (!credentials.botToken) return { ok: false, message: "Введите токен бота" };
    try {
      const response = await fetch(`https://api.telegram.org/bot${credentials.botToken}/getMe`, { signal: AbortSignal.timeout(8_000) });
      const body = await response.json() as { ok?: boolean; result?: { username?: string } };
      if (!response.ok || !body.ok) return { ok: false, message: "Telegram не принял этот токен. Проверьте, что скопировали его целиком." };
      return { ok: true, message: `Бот @${body.result?.username ?? "?"} на связи` };
    } catch {
      return { ok: false, message: "Не удалось связаться с Telegram" };
    }
  }
};

const META_GRAPH = "https://graph.facebook.com/v21.0";

const whatsapp: ConnectorDefinition = {
  key: "whatsapp",
  name: "WhatsApp",
  description: "Отвечает в WhatsApp с вашего рабочего номера.",
  category: "Channels",
  authType: "api_key",
  icon: "MessageCircle",
  documentationUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
  credentialFields: [
    { key: "accessToken", label: "Токен доступа", hint: "Meta for Developers → ваше приложение → WhatsApp → API Setup, поле Access token.", secret: true },
    { key: "phoneNumberId", label: "Номер отправителя (ID)", hint: "Там же, Phone number ID — длинное число под вашим номером.", secret: false }
  ],
  triggers: [{
    key: "receive_message",
    name: "Сообщение от клиента",
    description: "Запускается, когда клиент пишет на ваш номер.",
    inputSchema: objectSchema,
    outputSchema: incomingSchema,
    execute: async ({ input }) => {
      // Meta wraps everything in entry[].changes[].value; a delivery receipt
      // has no messages array at all, so every hop is optional.
      const entry = (input as { entry?: Array<{ changes?: Array<{ value?: Record<string, unknown> }> }> }).entry?.[0];
      const value = entry?.changes?.[0]?.value as {
        messages?: Array<{ from?: string; text?: { body?: string } }>;
        contacts?: Array<{ profile?: { name?: string } }>;
      } | undefined;
      const message = value?.messages?.[0];
      return { data: {
        chatId: message?.from ?? "",
        from: value?.contacts?.[0]?.profile?.name ?? message?.from ?? "",
        text: message?.text?.body ?? "",
        channel: "whatsapp",
        raw: input
      } };
    }
  }],
  actions: [{
    key: "send_message",
    name: "Ответить клиенту",
    description: "Отправляет сообщение в тот же диалог.",
    inputSchema: messageSchema,
    outputSchema: objectSchema,
    execute: async ({ input, credentials, demo, signal }) => demo
      ? simulated("whatsapp", input)
      : { data: await jsonRequest(`${META_GRAPH}/${credentials.phoneNumberId}/messages`, {
          method: "POST",
          headers: { authorization: `Bearer ${credentials.accessToken}`, "content-type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", to: input.chatId, type: "text", text: { body: input.text } })
        }, signal) }
  }],
  testConnection: async (credentials) => {
    if (!credentials.accessToken || !credentials.phoneNumberId) return { ok: false, message: "Заполните оба поля" };
    try {
      const response = await fetch(`${META_GRAPH}/${credentials.phoneNumberId}?fields=display_phone_number`, {
        headers: { authorization: `Bearer ${credentials.accessToken}` },
        signal: AbortSignal.timeout(8_000)
      });
      const body = await response.json() as { display_phone_number?: string };
      if (!response.ok) return { ok: false, message: "Meta не приняла эти данные. Проверьте токен и ID номера." };
      return { ok: true, message: `Номер ${body.display_phone_number ?? "подключён"} на связи` };
    } catch {
      return { ok: false, message: "Не удалось связаться с Meta" };
    }
  }
};

const instagram: ConnectorDefinition = {
  key: "instagram",
  name: "Instagram Direct",
  description: "Отвечает в Direct вашего аккаунта.",
  category: "Channels",
  authType: "api_key",
  icon: "Instagram",
  documentationUrl: "https://developers.facebook.com/docs/messenger-platform/instagram",
  credentialFields: [
    { key: "accessToken", label: "Токен страницы", hint: "Meta for Developers → ваше приложение → Messenger → Instagram, поле Page access token.", secret: true },
    { key: "pageId", label: "ID страницы", hint: "Там же, рядом с названием страницы Facebook, привязанной к аккаунту Instagram.", secret: false }
  ],
  triggers: [{
    key: "receive_message",
    name: "Сообщение в Direct",
    description: "Запускается, когда клиент пишет в Direct.",
    inputSchema: objectSchema,
    outputSchema: incomingSchema,
    execute: async ({ input }) => {
      const entry = (input as { entry?: Array<{ messaging?: Array<Record<string, unknown>> }> }).entry?.[0];
      const event = entry?.messaging?.[0] as {
        sender?: { id?: string };
        message?: { text?: string };
      } | undefined;
      return { data: {
        chatId: event?.sender?.id ?? "",
        from: event?.sender?.id ?? "",
        text: event?.message?.text ?? "",
        channel: "instagram",
        raw: input
      } };
    }
  }],
  actions: [{
    key: "send_message",
    name: "Ответить клиенту",
    description: "Отправляет сообщение в тот же диалог.",
    inputSchema: messageSchema,
    outputSchema: objectSchema,
    execute: async ({ input, credentials, demo, signal }) => demo
      ? simulated("instagram", input)
      : { data: await jsonRequest(`${META_GRAPH}/${credentials.pageId}/messages`, {
          method: "POST",
          headers: { authorization: `Bearer ${credentials.accessToken}`, "content-type": "application/json" },
          body: JSON.stringify({ recipient: { id: input.chatId }, message: { text: input.text }, messaging_type: "RESPONSE" })
        }, signal) }
  }],
  testConnection: async (credentials) => {
    if (!credentials.accessToken || !credentials.pageId) return { ok: false, message: "Заполните оба поля" };
    try {
      const response = await fetch(`${META_GRAPH}/${credentials.pageId}?fields=name`, {
        headers: { authorization: `Bearer ${credentials.accessToken}` },
        signal: AbortSignal.timeout(8_000)
      });
      const body = await response.json() as { name?: string };
      if (!response.ok) return { ok: false, message: "Meta не приняла эти данные. Проверьте токен и ID страницы." };
      return { ok: true, message: `Страница «${body.name ?? "?"}» на связи` };
    } catch {
      return { ok: false, message: "Не удалось связаться с Meta" };
    }
  }
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

// Channels first: this order is the order of the catalogue, and the three
// the landing page promises should be the three an owner sees first.
export const connectorRegistry = new Map<string, ConnectorDefinition>(
  [telegram, whatsapp, instagram, googleSheets, webhook, schedule, http, slack, gmail, postgres, llm, notion, stripe, hubspot, delay, condition, transform, approval]
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
