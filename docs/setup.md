# Setup guide

## Prerequisites

- Node.js 20.11 or newer
- pnpm 11
- Docker Desktop with Compose v2

## Install

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`docker compose up -d` starts PostgreSQL 16, Redis 7, and MinIO. The `minio-init` service creates the `outcomeos` bucket. `pnpm dev` runs both the Next.js application and BullMQ worker through Turborepo.

## Demo workspace

Set `DEMO_AUTH_BYPASS=true` only in local development, then open `/app`. The bypass resolves the seeded `demo@outcomeos.local` membership dynamically. Set it back to `false` to verify registration and session behavior.

## Health checks

- Web: `GET http://localhost:3000/api/health`
- Worker: `GET http://localhost:3001`
- MinIO console: `http://localhost:9001`

The web health response separately reports database and queue health.

## Troubleshooting

- If migrations cannot connect, wait for `docker compose ps` to show PostgreSQL healthy.
- If executions stay queued, confirm the worker is running and Redis is healthy.
- If sign-up fails, confirm the Prisma migration exists and `BETTER_AUTH_URL` matches the browser origin.
- If encrypted connections cannot be read, keep `APP_ENCRYPTION_KEY` stable. Rotating it requires a credential re-encryption migration.
