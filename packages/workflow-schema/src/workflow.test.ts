import { describe, expect, it } from "vitest";
import { maskSecrets, resolveVariables, WorkflowDefinitionSchema } from "./index";

const validWorkflow = {
  id: "wf_test",
  name: "Lead routing",
  description: "Routes leads",
  version: 1,
  trigger: { type: "webhook", connectorKey: "webhook", operationKey: "receive", configuration: {} },
  steps: [
    {
      id: "notify",
      type: "action",
      name: "Notify sales",
      description: "Sends a notification",
      connectorKey: "slack",
      operationKey: "send_message",
      inputMapping: { text: "{{trigger.email}}" },
      next: [] as string[]
    }
  ],
  settings: {},
  requiredConnections: []
};

describe("workflow schema", () => {
  it("accepts a valid definition and applies defaults", () => {
    const parsed = WorkflowDefinitionSchema.parse(validWorkflow);
    expect(parsed.settings.concurrency).toBe(5);
  });

  it("rejects dangling step references", () => {
    const invalid = structuredClone(validWorkflow);
    invalid.steps[0]!.next = ["missing"];
    expect(() => WorkflowDefinitionSchema.parse(invalid)).toThrow(/missing step/);
  });

  it("resolves nested variables and masks secrets", () => {
    expect(resolveVariables("Lead: {{ trigger.email }}", { trigger: { email: "a@b.com" } })).toBe("Lead: a@b.com");
    expect(maskSecrets({ apiToken: "secret", nested: { value: 2 } })).toEqual({
      apiToken: "••••••••",
      nested: { value: 2 }
    });
  });
});
