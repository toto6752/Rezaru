import { compileOutcome } from "@outcomeos/ai-compiler";
import { withApi } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const schema = z.object({
  instruction: z.string().min(10).max(5000),
  answers: z.record(z.string()).optional(),
  timezone: z.string().max(100).optional(),
  mode: z.enum(["new", "modify", "optimize", "failure", "n8n"]).optional()
});

export async function POST(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "createOutcome");
    assertRateLimit(`compile:${context.workspaceId}`, 20, 60_000);
    const input = schema.parse(await request.json());
    return compileOutcome(input);
  });
}
