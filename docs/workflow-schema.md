# Workflow schema

The intermediate representation lives in `packages/workflow-schema` and is validated by Zod.

Core fields:

- `trigger`: webhook, schedule, manual, or connector.
- `steps`: approved, named operations with mappings and graph edges.
- `settings`: concurrency, timeouts, timezone, enabled days, retention, and redaction.
- `requiredConnections`: connector keys and business reasons.

Step types include trigger, action, condition, transform, delay, loop, parallel, approval, AI task, sub-workflow, and error handler.

Graph validation rejects duplicate IDs and references to missing steps. Conditions declare separate `trueNext` and `falseNext` edges. Retry policies bound attempts, delay, backoff, and retryable error classes.

Mappings use `{{trigger.field}}`, `{{steps.step_id.field}}`, and `{{execution.id}}`. Resolution traverses records without evaluating JavaScript.

Workflow JSON is stored on the immutable `WorkflowVersion`; individual step definitions are also persisted for indexing and inspection.
