# Architecture

OutcomeOS separates the user-facing outcome from its executable implementation.

```text
User
  → Workspace
      → Connection (public metadata)
          → ConnectionCredential (encrypted secret)
      → Outcome (business objective)
          → WorkflowVersion (immutable after activation)
              → WorkflowStepDefinition
              → Execution
                  → ExecutionStep
                  → ExecutionLog
                  → ApprovalRequest
```

## Compile path

1. The user describes an outcome.
2. The compiler extracts intent and detects missing business destinations.
3. Required clarification questions block workflow generation.
4. The selected provider returns structured JSON.
5. Zod validates the result and graph references.
6. A security pass rejects unapproved connector operations.
7. The UI presents the plain-language plan first and the read-only graph second.
8. Saving creates a draft workflow version.

The compiler never emits code and the execution engine never uses `eval`.

## Execution path

1. An API, webhook, schedule, or test creates a persisted `QUEUED` execution and step records.
2. BullMQ delivers the execution ID to the worker.
3. The worker loads the immutable workflow version.
4. Step input variables resolve from trigger data and prior step outputs.
5. Connector input and output schemas validate both sides of the operation.
6. Credentials resolve server-side from the workspace-scoped encrypted record.
7. Retries use bounded exponential backoff and classified errors.
8. Delays schedule a durable resume job; approvals create a request and pause.
9. Every transition and safe log is persisted.
10. Server-Sent Events publish step status changes to the debugger.

## Versioning

Active versions are immutable. Modification compiles a new draft. Activation supersedes the previous active version atomically and schedule registration follows the active definition.

## Isolation

- Every application resource query includes `workspaceId`.
- Public webhooks resolve a one-way token hash to a workspace and outcome.
- API keys resolve a one-way hash and enforce explicit scopes.
- Worker jobs load their workspace from the persisted execution, not browser input.
- Custom code is represented by a disabled sandbox boundary.
