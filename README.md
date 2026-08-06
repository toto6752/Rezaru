# OutcomeOS

OutcomeOS is an AI-native business automation platform built around one idea:

> Describe the outcome. AI handles the workflow.

The repository is a production-oriented pnpm/Turborepo monorepo with a Next.js application, Better Auth, PostgreSQL/Prisma, a BullMQ worker, a validated workflow intermediate representation, an AI compiler, encrypted connections, execution history, n8n migration, templates, team permissions, usage metering, and Stripe billing foundations.

## Quick start

Requirements: Node.js 20.11+, pnpm 11+, and Docker Desktop.

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The web application runs on port 3000 and the worker health endpoint runs on port 3001.

To explore the seeded workspace without signing in, set `DEMO_AUTH_BYPASS=true` in `.env`. This bypass selects the seeded demo membership by email; it never hardcodes a user or workspace ID. Keep it disabled outside local development.

## Development commands

```bash
pnpm dev             # Web application and durable worker
pnpm typecheck       # Strict TypeScript across all workspaces
pnpm lint            # ESLint
pnpm test            # Unit and service-level tests
pnpm test:e2e        # Playwright browser journeys (requires seeded infrastructure)
pnpm build           # Production build
pnpm db:generate     # Regenerate Prisma Client
pnpm db:migrate:dev  # Create a development migration
pnpm db:migrate      # Apply checked-in migrations
pnpm db:seed         # Seed demo workspace, outcomes, executions, and 20 templates
```

## Repository map

```text
apps/
  web/                  Next.js App Router product and API
  worker/               BullMQ durable execution worker
packages/
  ai-compiler/          Provider-independent, schema-validated compiler
  config/               Environment, limits, encryption helpers
  connectors/           Connector SDK and approved connector registry
  database/             Prisma Client singleton
  execution-engine/     Graph execution, retries, pauses, artifacts, sandbox boundary
  observability/        Structured logging and provider adapters
  ui/                   Shared UI primitives
  workflow-schema/      Zod workflow IR, n8n report schema, template catalog
prisma/                 Schema, migrations, and seed
docker/                 Service Dockerfiles
docs/                   Architecture, API, security, deployment, and guides
tests/e2e/              Browser journeys
```

## Demo behavior

`DEMO_MODE=true` permits explicitly simulated connector executions. Demo runs are stored with `mode=demo`, labeled throughout the UI, and never mixed with production runs. Enter `demo` as a connection token in local development to create a simulated connection.

The seeded data demonstrates:

- Webhook lead routing through validation, HubSpot, Slack, and result storage.
- Scheduled weekly sales reporting through PostgreSQL, AI, and Gmail.
- High-value invoice conditions, AI analysis, human approval, and notification.
- Failed-payment recovery with email, CRM, durable delay, and escalation.

## Optional external credentials

The platform works locally without third-party credentials. Real integrations require:

- `AI_API_KEY`, plus `AI_PROVIDER`, `AI_BASE_URL`, and `AI_MODEL`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` for Google sign-in and hosted Google OAuth.
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` for GitHub sign-in.
- `SMTP_URL` and `EMAIL_FROM` for verification, reset, magic-link, and invitation delivery.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and Stripe price IDs for checkout and the customer portal.
- Connector-specific OAuth access tokens, API keys, or database connection strings entered through the encrypted Connections page.
- S3-compatible endpoint and bucket variables for an injected production artifact transport.

See [Environment variables](docs/environment.md) and [Billing configuration](docs/billing.md).

## Security posture

Connection secrets use AES-256-GCM authenticated encryption and a required production encryption key. API keys and invitation tokens are hashed. Workspace queries are authorization-scoped, workflow JSON and LLM output are Zod-validated, arbitrary code execution is disabled, connector secrets never return to the browser, logs mask common secret fields, and webhook/Stripe signatures are verified server-side.

See [Security overview](docs/security.md).

## Known limitations

- The included rule-based compiler provides a useful no-credential development fallback; the best natural-language coverage requires an OpenAI-compatible or Anthropic key.
- Hosted connector OAuth callback flows are not bundled for every vendor. The marketplace supports encrypted access-token/API-key setup and clearly lists required OAuth application variables.
- The n8n translator intentionally supports a documented subset. Code nodes become manual-review placeholders and never execute.
- Custom code steps remain disabled until a hardened out-of-process sandbox implementation is supplied.
- `S3CompatibleArtifactStore` defines and enforces the storage boundary but expects a production S3 transport to be injected.
- Email delivery uses a provider-neutral HTTP SMTP adapter configured by `SMTP_URL`.
- Full SSO, on-premise packaging, private-cloud provisioning, and an SLA are Business-plan extension points.

## Documentation

- [Setup guide](docs/setup.md)
- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Workflow schema](docs/workflow-schema.md)
- [Connector development](docs/connectors.md)
- [Deployment](docs/deployment.md)
- [Railway deployment](docs/railway.md)
- [Security](docs/security.md)
- [n8n limitations](docs/n8n-importer.md)
- [Billing](docs/billing.md)
# toirkssadgasdgasdgadsgasdgasdgdsgasdgasdg
