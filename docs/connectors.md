# Connector development guide

Each connector defines:

- Metadata, category, icon name, and documentation URL.
- Authentication type and environment requirements.
- Trigger and action operations.
- Zod input and output schemas.
- A server-only execution function.
- A safe connection test.

Add a connector to `packages/connectors/src/index.ts`, register it in `connectorRegistry`, and add unit tests for validation, demo behavior, and remote error classification.

Connector rules:

1. Never return credentials or include them in output.
2. Accept an `AbortSignal` and honor the step timeout.
3. Throw stable safe error codes such as `RATE_LIMIT`, `TIMEOUT`, or `TEMPORARY`.
4. Make external writes idempotent where the remote API permits it.
5. Use parameterized database queries. The bundled PostgreSQL connector only permits one read-only `SELECT`/`WITH` statement.
6. Provide realistic demo output only when the execution is explicitly marked `demo`.
7. Keep OAuth client secrets in server environment variables.

Initial connectors: Webhook, Schedule, HTTP Request, Slack, Gmail, Google Sheets, PostgreSQL, OpenAI-compatible AI, Notion, Stripe, HubSpot, Delay, Condition, Data transformation, and Human approval.
