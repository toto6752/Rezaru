import { withApi } from "@/lib/api";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { createExecution } from "@/lib/executions";
import { z } from "zod";

const schema = z.object({ input: z.record(z.unknown()).default({}), idempotencyKey: z.string().max(200).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const auth = await authenticateApiKey(request, "outcomes:trigger");
    const { id } = await params;
    const input = schema.parse(await request.json().catch(() => ({})));
    const execution = await createExecution({ workspaceId: auth.workspaceId, outcomeId: id, triggerInput: input.input, idempotencyKey: input.idempotencyKey, mode: "production" });
    return { executionId: execution.id, status: execution.status };
  });
}
