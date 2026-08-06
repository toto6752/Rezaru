# Deployment guide

## Container deployment

Build the web and worker images from `docker/web.Dockerfile` and `docker/worker.Dockerfile`. Production needs:

- PostgreSQL with automated backups and TLS.
- Redis configured for BullMQ durability.
- An S3-compatible bucket and injected transport.
- Separate web and worker scaling policies.
- TLS termination and a stable canonical `BETTER_AUTH_URL`.

Run migrations once per release:

```bash
pnpm db:migrate
```

Do not run seed data in production.

## Health and shutdown

The web service exposes `/api/health`; the worker exposes port 3001. The worker handles SIGTERM/SIGINT, closes BullMQ, Redis, and Prisma, and allows in-flight locks to settle.

## Scaling

Web instances are stateless apart from cookies and shared services. Worker concurrency defaults to 10 and can be changed with `WORKER_CONCURRENCY`. Workflow-level concurrency remains part of the definition. Redis job IDs provide queue deduplication while API/webhook idempotency keys provide business-request deduplication.

## Release checklist

1. Apply migrations.
2. Deploy the worker.
3. Deploy the web service.
4. Verify database, queue, and worker health.
5. Run a demo execution.
6. Verify Stripe and OAuth callback URLs.
7. Confirm the encryption key matches the credential store.
