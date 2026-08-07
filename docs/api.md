# API reference

All application routes return either `{data, requestId}` or `{error: {code, message, details?, requestId}}`. Inputs are Zod-validated.

## Application API

- `POST /api/outcomes/compile`
- `GET|POST /api/outcomes`
- `GET|PATCH|DELETE /api/outcomes/:id`
- `POST /api/outcomes/:id/test|activate|pause|duplicate`
- `GET /api/executions`
- `GET /api/executions/:id`
- `POST /api/executions/:id/retry|cancel|explain`
- `GET /api/executions/:id/stream`
- `GET|POST /api/connections`
- `POST /api/connections/:id/test`
- `DELETE /api/connections/:id`
- `POST /api/import/n8n/analyze|convert`
- `GET /api/templates`
- `POST /api/templates/:id/install`
- `POST /api/approvals/:id/approve|reject`
- `GET /api/usage`
- `POST /api/stripe/checkout|portal|webhook`

## Developer API

Create a key at `/app/settings/api-keys`, send it as `Authorization: Bearer oos_…`, and grant only the needed scopes.

- `GET /api/v1/outcomes` — `outcomes:read`
- `POST /api/v1/outcomes/:id/trigger` — `outcomes:trigger`
- `GET /api/v1/executions` — `executions:read`
- `GET /api/v1/executions/:id` — `executions:read`

Trigger bodies accept `input` and an optional `idempotencyKey`.

## Webhooks

Workspace users create test or production endpoints at `/app/settings/webhooks`. JSON, form data, query parameters, selected headers, GET, and POST are captured. An optional secret is supplied through `x-rezaru-secret`. Test endpoints capture a sample and create a labeled demo execution.
