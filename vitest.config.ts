import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: { reporter: ["text", "json-summary"] }
  },
  resolve: {
    alias: {
      "@rezaru/database": path.resolve("packages/database/src/index.ts"),
      "@rezaru/workflow-schema": path.resolve("packages/workflow-schema/src/index.ts"),
      "@rezaru/execution-engine": path.resolve("packages/execution-engine/src/index.ts"),
      "@rezaru/ai-compiler": path.resolve("packages/ai-compiler/src/index.ts"),
      "@rezaru/connectors": path.resolve("packages/connectors/src/index.ts"),
      "@rezaru/config": path.resolve("packages/config/src/index.ts")
    }
  }
});
