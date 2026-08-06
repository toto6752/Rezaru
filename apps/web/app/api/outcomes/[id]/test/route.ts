import { withApi } from "@/lib/api";
import { createExecution } from "@/lib/executions";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const schema = z.object({ sampleData: z.record(z.unknown()).default({}), demo: z.boolean().default(true) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "createOutcome");
    const { id } = await params;
    const { sampleData, demo } = schema.parse(await request.json());
    return createExecution({ workspaceId: context.workspaceId, outcomeId: id, triggerInput: sampleData, mode: demo ? "demo" : "test" });
  });
}
