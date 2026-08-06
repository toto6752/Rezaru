import { withApi } from "@/lib/api";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";
import { z } from "zod";

const schema = z.object({
  question: z.enum(["why_failed", "fix", "add_fallback", "reduce_risk", "plain_language"])
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "viewExecutions");
    const { id } = await params;
    const { question } = schema.parse(await request.json());
    const execution = await prisma.execution.findFirst({
      where: { id, workspaceId: context.workspaceId },
      include: {
        outcome: true,
        steps: { where: { status: "FAILED" }, include: { logs: { orderBy: { createdAt: "desc" }, take: 10 } }, take: 1 }
      }
    });
    if (!execution) throw Object.assign(new Error("Execution not found"), { status: 404, code: "NOT_FOUND" });
    const failed = execution.steps[0];
    if (!failed) {
      return { verifiedEvidence: [], explanation: "This execution does not contain a failed step, so there is no failure to explain.", suggestionCreated: false };
    }
    const error = failed.error as { code?: string; message?: string } | null;
    const evidence = [
      `Step: ${failed.name}`,
      `Attempt: ${failed.attempt}`,
      error?.code ? `Error code: ${error.code}` : undefined,
      error?.message ? `Recorded error: ${error.message}` : undefined,
      ...failed.logs.filter((log) => log.level === "error").map((log) => `Log: ${log.message}`)
    ].filter((item): item is string => Boolean(item));
    const explanation = question === "plain_language"
      ? `${failed.name} did not complete after ${failed.attempt} attempt${failed.attempt === 1 ? "" : "s"}. ${error?.message ?? "The recorded logs do not include a more specific safe explanation."}`
      : `The verified failure occurred in “${failed.name}”. ${error?.message ?? "No detailed remote error was recorded."} OutcomeOS is not inferring a root cause beyond this evidence.`;
    let suggestionCreated = false;
    if (["fix", "add_fallback", "reduce_risk"].includes(question)) {
      await prisma.improvementSuggestion.create({
        data: {
          workspaceId: context.workspaceId,
          outcomeId: execution.outcomeId,
          type: question,
          title: question === "add_fallback" ? `Add a fallback after ${failed.name}` : `Reduce failures in ${failed.name}`,
          description: error?.code === "RATE_LIMIT"
            ? "Add exponential backoff and one additional retry for rate-limit responses."
            : "Review the failed step configuration and add a bounded retry or fallback after testing.",
          impact: { evidence, estimated: false },
          proposedPatch: { stepId: failed.stepId, requiresApproval: true }
        }
      });
      suggestionCreated = true;
    }
    return { verifiedEvidence: evidence, explanation, suggestionCreated };
  });
}
