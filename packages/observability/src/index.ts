export type LogContext = {
  requestId?: string;
  executionId?: string;
  workspaceId?: string;
  [key: string]: unknown;
};

function write(level: "info" | "warn" | "error", message: string, context: LogContext = {}): void {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  });
  if (level === "error") console.error(record);
  else if (level === "warn") console.warn(record);
  else console.info(record);
}

export const logger = {
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context)
};

export function newRequestId(): string {
  return `req_${crypto.randomUUID()}`;
}

export const observabilityAdapters = {
  sentryEnabled: Boolean(process.env.SENTRY_DSN),
  openTelemetryEnabled: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
  postHogEnabled: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
};
