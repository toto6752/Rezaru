import { test, expect } from "@playwright/test";

test.describe("Rezaru core journey", () => {
  test("landing page explains the outcome-first product and interactive plan", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Describe the outcome/i })).toBeVisible();
    await page.getByRole("button", { name: "Review invoices" }).click();
    await expect(page.getByText("Check the $5,000 threshold")).toBeVisible();
    await expect(page.getByRole("link", { name: /Start free/i }).first()).toHaveAttribute("href", "/register");
  });

  test("authentication screens expose registration, login, reset, and magic link", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create your workspace" })).toBeVisible();
    await expect(page.getByLabel("Workspace name")).toBeVisible();
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /Email link/i })).toBeVisible();
    await page.goto("/forgot-password");
    await expect(page.getByRole("button", { name: /Send reset link/i })).toBeVisible();
  });

  test("demo workspace opens the dashboard and outcome composer", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
    await page.getByRole("link", { name: /Create outcome/i }).first().click();
    await expect(page.getByRole("heading", { name: "Build an outcome" })).toBeVisible();
    await page.getByPlaceholder("Describe what you want your business to do…").fill("Send every new website lead to Slack and HubSpot.");
    await page.getByLabel("Send message").click();
    await expect(page.getByText("Which Slack channel should receive the notification?")).toBeVisible();
  });

  test("n8n import produces an honest compatibility report", async ({ page }) => {
    await page.goto("/app/import/n8n");
    const workflow = {
      name: "Imported lead route",
      nodes: [
        { name: "Webhook", type: "n8n-nodes-base.webhook", parameters: {} },
        { name: "Code", type: "n8n-nodes-base.code", parameters: { jsCode: "return items" } }
      ],
      connections: { Webhook: { main: [[{ node: "Code" }]] } }
    };
    await page.locator(".import-source textarea").fill(JSON.stringify(workflow));
    await page.getByRole("button", { name: /Analyze compatibility/i }).click();
    await expect(page.getByText("Manual review", { exact: true })).toBeVisible();
    await expect(page.getByText(/does not claim 100% n8n compatibility/i)).toBeVisible();
  });

  test("template can be installed as a draft outcome", async ({ page }) => {
    await page.goto("/app/templates");
    const card = page.locator(".library-grid article").first();
    await expect(card).toBeVisible();
    await card.getByRole("button").click();
    await page.getByRole("button", { name: /Install as draft/i }).click();
    await expect(page).toHaveURL(/\/app\/outcomes\//);
    await expect(page.getByText("Outcome plan")).toBeVisible();
  });
});
