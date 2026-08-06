# Security overview

- Connection credentials use AES-256-GCM with a random 96-bit IV and authentication tag.
- Credential records are separate from public connection metadata.
- API keys, invitation tokens, and webhook path tokens are one-way hashed.
- Better Auth uses secure cookies in production, encrypted OAuth tokens, hashed verification identifiers, email verification, password reset, and magic links.
- All workspace resources require session and workspace membership checks.
- Role checks protect creation, activation, connections, billing, team, approvals, and API keys.
- Zod validates API, compiler, workflow, connector, and importer inputs.
- Security headers include CSP, frame denial, MIME sniff prevention, referrer policy, and permissions policy.
- Logs mask common password, token, secret, authorization, and API-key fields.
- Stripe uses the official raw-body signature verifier.
- Webhook endpoints support a separate secret verifier and rate limiting.
- PostgreSQL operations are parameterized and read-only.
- No raw user JavaScript executes. The sandbox abstraction is disabled by default.
- Audit records cover outcome, connection, team, permission, billing, API key, approval, and migration actions.

Production operations should place Redis and PostgreSQL on private networks, rotate application encryption keys through a re-encryption migration, use a managed secret store, terminate TLS at the edge, and ship structured logs to a restricted observability backend.
