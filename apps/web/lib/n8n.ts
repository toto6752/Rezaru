import { N8nImportReportSchema, type N8nImportReport, type WorkflowDefinition, type WorkflowStep } from "@outcomeos/workflow-schema";

type N8nNode = {
  id?: string;
  name: string;
  type: string;
  typeVersion?: number;
  parameters?: Record<string, unknown>;
  credentials?: Record<string, { id?: string; name?: string }>;
};

type N8nWorkflow = {
  name?: string;
  nodes: N8nNode[];
  connections?: Record<string, Record<string, Array<Array<{ node: string; type?: string; index?: number }>>>>;
  settings?: Record<string, unknown>;
};

type Mapping = {
  connectorKey: string;
  operationKey: string;
  stepType: WorkflowStep["type"];
  compatibility: "supported" | "partial" | "unsupported";
  note?: string;
};

function mapType(type: string): Mapping {
  const normalized = type.toLowerCase();
  if (normalized.includes("webhook")) return { connectorKey: "webhook", operationKey: "receive", stepType: "trigger", compatibility: "supported" };
  if (normalized.includes("schedule") || normalized.includes("cron")) return { connectorKey: "schedule", operationKey: "cron", stepType: "trigger", compatibility: "supported" };
  if (normalized.includes("httprequest")) return { connectorKey: "http", operationKey: "request", stepType: "action", compatibility: "supported" };
  if (normalized.endsWith(".if") || normalized.includes("switch")) return { connectorKey: "condition", operationKey: "evaluate", stepType: "condition", compatibility: "partial", note: "Review expression semantics after conversion." };
  if (normalized.endsWith(".set") || normalized.includes("editfields")) return { connectorKey: "transform", operationKey: "map", stepType: "transform", compatibility: "supported" };
  if (normalized.includes("code") || normalized.includes("function")) return { connectorKey: "transform", operationKey: "map", stepType: "transform", compatibility: "unsupported", note: "Arbitrary code is disabled. This node becomes a manual-review placeholder." };
  if (normalized.includes("slack")) return { connectorKey: "slack", operationKey: "send_message", stepType: "action", compatibility: "supported" };
  if (normalized.includes("gmail")) return { connectorKey: "gmail", operationKey: "send_email", stepType: "action", compatibility: "supported" };
  if (normalized.includes("googlesheets")) return { connectorKey: "google_sheets", operationKey: "append_rows", stepType: "action", compatibility: "partial", note: "Confirm spreadsheet and range IDs." };
  if (normalized.includes("postgres")) return { connectorKey: "postgresql", operationKey: "query", stepType: "action", compatibility: "partial", note: "Only read-only parameterized queries are enabled." };
  if (normalized.includes("openai") || normalized.includes("langchain")) return { connectorKey: "openai", operationKey: "generate", stepType: "ai_task", compatibility: "partial", note: "Prompt and model settings require review." };
  if (normalized.includes("notion")) return { connectorKey: "notion", operationKey: "create_page", stepType: "action", compatibility: "supported" };
  if (normalized.includes("stripe")) return { connectorKey: "stripe", operationKey: "create_payment_link", stepType: "action", compatibility: "partial", note: "Trigger event and API version require review." };
  if (normalized.includes("hubspot")) return { connectorKey: "hubspot", operationKey: "upsert_contact", stepType: "action", compatibility: "supported" };
  if (normalized.includes("wait")) return { connectorKey: "delay", operationKey: "wait", stepType: "delay", compatibility: "supported" };
  if (normalized.includes("merge")) return { connectorKey: "transform", operationKey: "map", stepType: "parallel", compatibility: "partial", note: "Review merge mode and branch completion semantics." };
  return { connectorKey: "transform", operationKey: "map", stepType: "transform", compatibility: "unsupported", note: "No approved OutcomeOS operation maps to this node." };
}

const stepId = (name: string, index: number) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 45) || "step"}_${index + 1}`;

export function analyzeN8nWorkflow(value: unknown): N8nImportReport {
  if (!value || typeof value !== "object" || !Array.isArray((value as N8nWorkflow).nodes)) {
    throw new Error("This is not a valid n8n workflow export: the nodes array is missing.");
  }
  const source = value as N8nWorkflow;
  if (source.nodes.length === 0) throw new Error("The n8n workflow does not contain any nodes.");
  if (source.nodes.length > 500) throw new Error("Workflows with more than 500 nodes require a manual migration review.");
  const mapped = source.nodes.map((node, index) => ({ node, index, mapping: mapType(node.type), id: stepId(node.name, index) }));
  const triggerNode = mapped.find((item) => item.mapping.stepType === "trigger");
  const nameToId = new Map(mapped.map((item) => [item.node.name, item.id]));
  const steps: WorkflowStep[] = mapped.filter((item) => item !== triggerNode).map(({ node, mapping, id }) => {
    const targets = Object.values(source.connections?.[node.name] ?? {}).flat(3).map((target) => nameToId.get(target.node)).filter((target): target is string => Boolean(target) && target !== triggerNode?.id);
    const manual = mapping.compatibility === "unsupported";
    const inputMapping = manual
      ? { manualReviewRequired: true, originalNodeName: node.name, originalNodeType: node.type, originalParameters: node.parameters ?? {} }
      : normalizeParameters(mapping, node.parameters ?? {});
    return {
      id,
      type: manual ? "error_handler" : mapping.stepType,
      name: manual ? `Manual review: ${node.name}` : node.name,
      description: manual ? mapping.note ?? "This node requires manual review." : `Converted from n8n ${node.type}. ${mapping.note ?? ""}`.trim(),
      connectorKey: mapping.connectorKey,
      operationKey: mapping.operationKey,
      inputMapping,
      timeoutMs: mapping.connectorKey === "delay" ? 86_400_000 : 30_000,
      retryPolicy: ["http", "slack", "gmail", "hubspot", "notion", "stripe"].includes(mapping.connectorKey)
        ? { maxAttempts: 3, initialDelayMs: 1_000, backoffMultiplier: 2, maxDelayMs: 30_000, retryableErrors: ["TIMEOUT", "RATE_LIMIT", "TEMPORARY"] }
        : undefined,
      next: [...new Set(targets)]
    };
  });
  if (steps.length === 0) {
    steps.push({
      id: "record_trigger_1",
      type: "transform",
      name: "Record trigger",
      description: "Record the incoming trigger data.",
      connectorKey: "transform",
      operationKey: "map",
      inputMapping: { payload: "{{trigger}}" },
      timeoutMs: 5_000,
      next: []
    });
  }
  const connectorKeys = [...new Set(mapped.map((item) => item.mapping.connectorKey).filter((key) => !["webhook", "schedule", "condition", "transform", "delay"].includes(key)))];
  const workflow: WorkflowDefinition = {
    id: `n8n_${crypto.randomUUID()}`,
    name: source.name ?? "Imported n8n workflow",
    description: "Converted from an n8n JSON export. Review partial and unsupported nodes before testing.",
    version: 1,
    trigger: triggerNode
      ? {
          type: triggerNode.mapping.connectorKey === "schedule" ? "schedule" : "webhook",
          connectorKey: triggerNode.mapping.connectorKey,
          operationKey: triggerNode.mapping.operationKey,
          configuration: triggerNode.node.parameters ?? {}
        }
      : { type: "manual", connectorKey: "webhook", operationKey: "receive", configuration: {} },
    steps,
    settings: {
      concurrency: 5,
      defaultTimeoutMs: 30_000,
      timezone: String(source.settings?.timezone ?? "UTC"),
      enabledDays: [0, 1, 2, 3, 4, 5, 6],
      retentionDays: 30,
      redactFields: ["password", "token", "secret", "authorization", "apiKey"]
    },
    requiredConnections: connectorKeys.map((connectorKey) => ({ connectorKey, label: connectorKey.replace("_", " "), reason: "Referenced by the imported n8n workflow", required: true }))
  };
  const compatibilityCounts = mapped.reduce((counts, item) => ({ ...counts, [item.mapping.compatibility]: counts[item.mapping.compatibility] + 1 }), { supported: 0, partial: 0, unsupported: 0 });
  return N8nImportReportSchema.parse({
    workflowName: source.name ?? "Untitled n8n workflow",
    totalNodes: source.nodes.length,
    supportedNodes: compatibilityCounts.supported,
    partiallySupportedNodes: compatibilityCounts.partial,
    unsupportedNodes: compatibilityCounts.unsupported,
    nodes: mapped.map(({ node, mapping }) => ({
      name: node.name,
      sourceType: node.type,
      outcomeOperation: mapping.compatibility === "unsupported" ? undefined : `${mapping.connectorKey}.${mapping.operationKey}`,
      compatibility: mapping.compatibility,
      note: mapping.note
    })),
    credentialMappings: mapped.flatMap(({ node, mapping }) => Object.values(node.credentials ?? {}).map((credential) => ({
      sourceName: credential.name ?? node.name,
      sourceType: node.type,
      connectorKey: mapping.connectorKey,
      required: !["webhook", "schedule", "condition", "transform", "delay"].includes(mapping.connectorKey)
    }))),
    warnings: [
      "OutcomeOS does not claim 100% n8n compatibility.",
      ...(compatibilityCounts.unsupported ? [`${compatibilityCounts.unsupported} unsupported node${compatibilityCounts.unsupported === 1 ? "" : "s"} ${compatibilityCounts.unsupported === 1 ? "requires" : "require"} manual review and cannot run as originally configured.`] : []),
      ...(compatibilityCounts.partial ? [`${compatibilityCounts.partial} partially supported node${compatibilityCounts.partial === 1 ? "" : "s"} ${compatibilityCounts.partial === 1 ? "requires" : "require"} configuration review.`] : [])
    ],
    convertedWorkflow: workflow
  });
}

function normalizeParameters(mapping: Mapping, parameters: Record<string, unknown>): Record<string, unknown> {
  if (mapping.connectorKey === "http") return {
    url: parameters.url ?? "",
    method: parameters.method ?? "GET",
    headers: parameters.headerParameters ?? {},
    body: parameters.body ?? parameters.jsonBody ?? {}
  };
  if (mapping.connectorKey === "slack") return { channel: parameters.channel ?? "", text: parameters.text ?? parameters.message ?? "{{trigger}}" };
  if (mapping.connectorKey === "gmail") return { to: parameters.sendTo ?? "", subject: parameters.subject ?? "OutcomeOS result", body: parameters.message ?? "{{trigger}}" };
  if (mapping.connectorKey === "delay") return { milliseconds: Number(parameters.amount ?? 1) * 1000 };
  if (mapping.connectorKey === "condition") return { left: parameters.leftValue ?? "{{trigger.value}}", operator: "equals", right: parameters.rightValue ?? true };
  if (mapping.connectorKey === "postgresql") return { query: parameters.query ?? "SELECT 1", params: [] };
  if (mapping.connectorKey === "openai") return { prompt: parameters.prompt ?? "{{trigger}}" };
  return parameters;
}
