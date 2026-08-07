import { PLAN_LIMITS, type PlanKey } from "@rezaru/config";
import { prisma } from "@rezaru/database";

export async function getWorkspaceUsage(workspaceId: string) {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [subscription, activeOutcomes, executions, members, usage] = await Promise.all([
    prisma.subscription.findUnique({ where: { workspaceId } }),
    prisma.outcome.count({ where: { workspaceId, status: "ACTIVE", deletedAt: null } }),
    prisma.execution.count({ where: { workspaceId, createdAt: { gte: startOfMonth } } }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.usageRecord.groupBy({
      by: ["type"],
      where: { workspaceId, recordedAt: { gte: startOfMonth } },
      _sum: { quantity: true }
    })
  ]);
  const plan = (subscription?.plan ?? "FREE") as PlanKey;
  return {
    plan,
    limits: PLAN_LIMITS[plan],
    used: {
      activeOutcomes,
      executions,
      members,
      aiCredits: Number(usage.find((item) => item.type === "AI_CREDIT")?._sum.quantity ?? 0)
    }
  };
}

export async function assertExecutionLimit(workspaceId: string) {
  const usage = await getWorkspaceUsage(workspaceId);
  if (usage.used.executions >= usage.limits.executions) {
    throw Object.assign(new Error("Monthly execution limit reached. Excess executions are paused until the plan is upgraded or the next billing period begins."), {
      status: 402,
      code: "PLAN_LIMIT_REACHED"
    });
  }
  return usage;
}
