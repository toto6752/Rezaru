import { describe, expect, it } from "vitest";
import { analyzeN8nWorkflow } from "./n8n";

describe("n8n importer", () => {
  it("maps supported nodes and flags code nodes", () => {
    const report = analyzeN8nWorkflow({
      name: "Lead routing",
      nodes: [
        { name: "Webhook", type: "n8n-nodes-base.webhook", parameters: {} },
        { name: "Transform", type: "n8n-nodes-base.code", parameters: { jsCode: "return items" } },
        { name: "Notify", type: "n8n-nodes-base.slack", parameters: { channel: "#sales", text: "New lead" } }
      ],
      connections: {
        Webhook: { main: [[{ node: "Transform" }]] },
        Transform: { main: [[{ node: "Notify" }]] }
      }
    });
    expect(report.supportedNodes).toBe(2);
    expect(report.unsupportedNodes).toBe(1);
    expect(report.convertedWorkflow?.steps.find((step) => step.name.startsWith("Manual review"))?.type).toBe("error_handler");
  });
});
