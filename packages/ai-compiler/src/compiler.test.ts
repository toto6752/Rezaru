import { describe, expect, it } from "vitest";
import { compileOutcome } from "./index";

describe("AI compiler", () => {
  it("asks only critical clarification questions", async () => {
    const result = await compileOutcome({
      instruction: "Send every new website lead to Slack and our CRM."
    });
    expect(result.workflow).toBeUndefined();
    expect(result.clarificationQuestions.map((question) => question.id)).toEqual(["crm", "slackChannel"]);
  });

  it("returns a validated workflow after answers", async () => {
    const result = await compileOutcome({
      instruction: "Send every new website lead to Slack and HubSpot.",
      answers: { crm: "hubspot", slackChannel: "#sales" }
    });
    expect(result.workflow?.steps.map((step) => step.id)).toContain("notify_slack");
    expect(result.requiredConnections.map((connection) => connection.connectorKey)).toContain("hubspot");
  });

  it("grounds AI and Notion instructions in approved operations", async () => {
    const firstPass = await compileOutcome({
      instruction: "Classify a support request with AI, add it to Notion, and notify Slack."
    });
    expect(firstPass.clarificationQuestions.map((question) => question.id)).toEqual([
      "slackChannel",
      "notionDatabaseId"
    ]);

    const result = await compileOutcome({
      instruction: "Classify a support request with AI, add it to Notion, and notify Slack.",
      answers: { slackChannel: "#support-ops", notionDatabaseId: "db_support" }
    });
    expect(result.workflow?.steps.map((step) => `${step.connectorKey}.${step.operationKey}`)).toEqual(
      expect.arrayContaining(["openai.generate", "notion.create_page", "slack.send_message"])
    );
  });
});
