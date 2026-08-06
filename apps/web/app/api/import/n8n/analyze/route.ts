import { withApi } from "@/lib/api";
import { analyzeN8nWorkflow } from "@/lib/n8n";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const schema = z.object({ workflow: z.unknown() });

export async function POST(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "createOutcome");
    const { workflow } = schema.parse(await request.json());
    return analyzeN8nWorkflow(workflow);
  });
}
