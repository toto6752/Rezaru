# Environment variables

## Required in production

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | BullMQ Redis connection |
| `BETTER_AUTH_SECRET` | Session and authentication signing secret |
| `BETTER_AUTH_URL` | Canonical authentication origin |
| `NEXT_PUBLIC_APP_URL` | Canonical product origin |
| `APP_ENCRYPTION_KEY` | Base64-encoded 32-byte AES key |

## AI

`AI_PROVIDER` supports `rule-based`, `openai`, `compatible`, and `anthropic`. Set `AI_API_KEY`, `AI_MODEL`, and `AI_BASE_URL` where applicable. Every response is parsed as JSON, validated by `CompilationResultSchema`, and checked against the approved connector operation registry.

## Authentication

Google and GitHub providers use their matching client ID and secret. `SMTP_URL` is a provider-neutral HTTP endpoint that accepts `{to, from, subject, text}` JSON.

## Billing

Stripe is optional in development. When `STRIPE_SECRET_KEY` is missing, plan changes remain local and display a development-mode banner. Production also needs the webhook secret and monthly/annual Pro and Team price IDs.

## Storage and observability

S3-compatible variables describe endpoint, region, bucket, and credentials. Sentry, OpenTelemetry, and PostHog variables are optional; the adapters report whether each provider is configured.

Never prefix server secrets with `NEXT_PUBLIC_`.
