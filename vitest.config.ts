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
      "@outcomeos/database": path.resolve("packages/database/src/index.ts"),
      "@outcomeos/workflow-schema": path.resolve("packages/workflow-schema/src/index.ts"),
      "@outcomeos/execution-engine": path.resolve("packages/execution-engine/src/index.ts"),
      "@outcomeos/ai-compiler": path.resolve("packages/ai-compiler/src/index.ts"),
      "@outcomeos/connectors": path.resolve("packages/connectors/src/index.ts"),
      "@outcomeos/config": path.resolve("packages/config/src/index.ts")
    }
  }
});
