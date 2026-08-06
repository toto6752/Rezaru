import { describe, expect, it, vi } from "vitest";
import type { WorkflowDefinition } from "@outcomeos/workflow-schema";
import { runWorkflow, selectNextSteps } from "./index";

describe("execution engine", () => {
  it("chooses the correct condition branch", () => {
    const step = {
      id: "check",
      type: "condition" as const,
      name: "Check",
      description: "Check amount",
      connectorKey: "condition",
      operationKey: "evaluate",
      inputMapping: {},
      timeoutMs: 1000,
      next: [],
      condition: { expression: "matched", trueNext: ["high"], falseNext: ["low"] }
    };
    expect(selectNextSteps(step, { matched: true })).toEqual(["high"]);
    expect(selectNextSteps(step, { matched: false })).toEqual(["low"]);
  });

  it("runs a demo workflow and persists updates", async () => {
    const workflow: WorkflowDefinition = {
      id: "wf",
      name: "Demo",
      description: "Demo workflow",
      version: 1,
      trigger: { type: "manual", connectorKey: "webhook", operationKey: "receive", configuration: {} },
      settings: { concurrency: 5, defaultTimeoutMs: 30000, timezone: "UTC", enabledDays: [0,1,2,3,4,5,6], retentionDays: 30, redactFields: [] },
      requiredConnections: [],
      steps: [{
        id: "map",
        type: "transform",
        name: "Map",
        description: "Map data",
        connectorKey: "transform",
        operationKey: "map",
        inputMapping: { email: "{{trigger.email}}" },
        timeoutMs: 1000,
        next: []
      }]
    };
    const statuses: string[] = [];
    const result = await runWorkflow(workflow, { email: "lead@example.com" }, {
      onExecutionStatus: async (status) => { statuses.push(status); },
      onStepUpdate: vi.fn(),
      onLog: vi.fn(),
      getCredentials: async () => ({}),
      createApproval: vi.fn(),
      scheduleResume: vi.fn(),
      isCancelled: async () => false
    }, { executionId: "exec", demo: true });
    expect(result.status).toBe("SUCCEEDED");
    expect(result.outputs.map).toEqual({ email: "lead@example.com" });
    expect(statuses).toEqual(["RUNNING", "SUCCEEDED"]);
  });
});
