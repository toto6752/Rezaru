import { getWorkspaceContext } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getWorkspaceContext();
  if (!context) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const exists = await prisma.execution.findFirst({ where: { id, workspaceId: context.workspaceId }, select: { id: true } });
  if (!exists) return new Response("Not found", { status: 404 });
  const encoder = new TextEncoder();
  let lastUpdated = "";
  let timer: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    start(controller) {
      const push = async () => {
        try {
          const execution = await prisma.execution.findUnique({
            where: { id },
            select: {
              status: true,
              updatedAt: true,
              steps: { select: { stepId: true, name: true, status: true, attempt: true, durationMs: true, error: true }, orderBy: { startedAt: "asc" } }
            }
          });
          if (!execution) return;
          const updated = execution.updatedAt.toISOString() + execution.steps.map((step) => `${step.stepId}:${step.status}:${step.attempt}`).join("|");
          if (updated !== lastUpdated) {
            lastUpdated = updated;
            controller.enqueue(encoder.encode(`event: execution\ndata: ${JSON.stringify(execution)}\n\n`));
          } else {
            controller.enqueue(encoder.encode(": keep-alive\n\n"));
          }
          if (["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"].includes(execution.status)) {
            if (timer) clearInterval(timer);
            controller.close();
          }
        } catch {
          if (timer) clearInterval(timer);
          controller.close();
        }
      };
      void push();
      timer = setInterval(() => void push(), 1_000);
    },
    cancel() {
      if (timer) clearInterval(timer);
    }
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no"
    }
  });
}
