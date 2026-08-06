import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { getWorkspaceUsage } from "@/lib/limits";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";
import { validateWorkflow } from "@outcomeos/workflow-schema";
import { scheduleOutcome } from "@/lib/queue";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "activateOutcome");
    const { id } = await params;
    const outcome = await prisma.outcome.findFirst({
      where: { id, workspaceId: context.workspaceId, deletedAt: null },
      include: { workflowVersions: { where: { status: "DRAFT" }, orderBy: { version: "desc" }, take: 1 } }
    });
    if (!outcome) throw Object.assign(new Error("Outcome not found"), { status: 404, code: "NOT_FOUND" });
    const version = outcome.workflowVersions[0];
    if (!version) throw Object.assign(new Error("No draft workflow is ready to activate"), { status: 409, code: "NO_DRAFT" });
    const workflow = validateWorkflow(version.definition);
    const unresolvedManualSteps = workflow.steps.filter((step) => step.inputMapping.manualReviewRequired === true);
    if (unresolvedManualSteps.length > 0) {
      throw Object.assign(
        new Error(`Resolve ${unresolvedManualSteps.length} manual-review step${unresolvedManualSteps.length === 1 ? "" : "s"} before activation.`),
        { status: 409, code: "MANUAL_REVIEW_REQUIRED" }
      );
    }
    const requiredConnectorKeys = [...new Set(workflow.requiredConnections.filter((item) => item.required).map((item) => item.connectorKey))];
    if (requiredConnectorKeys.length > 0) {
      const connected = await prisma.connection.findMany({
        where: {
          workspaceId: context.workspaceId,
          connectorKey: { in: requiredConnectorKeys },
          status: "CONNECTED",
          deletedAt: null
        },
        select: { connectorKey: true }
      });
      const connectedKeys = new Set(connected.map((item) => item.connectorKey));
      const missing = requiredConnectorKeys.filter((key) => !connectedKeys.has(key));
      if (missing.length > 0) {
        throw Object.assign(
          new Error(`Connect ${missing.join(", ")} before activation. You can still run a simulated test.`),
          { status: 409, code: "CONNECTIONS_REQUIRED" }
        );
      }
    }
    const usage = await getWorkspaceUsage(context.workspaceId);
    if (outcome.status !== "ACTIVE" && usage.used.activeOutcomes >= usage.limits.activeOutcomes) {
      throw Object.assign(new Error("Active outcome limit reached. Pause an outcome or upgrade the workspace plan."), { status: 402, code: "PLAN_LIMIT_REACHED" });
    }
    await prisma.$transaction([
      prisma.workflowVersion.updateMany({ where: { outcomeId: id, status: "ACTIVE" }, data: { status: "SUPERSEDED" } }),
      prisma.workflowVersion.update({ where: { id: version.id }, data: { status: "ACTIVE", activatedAt: new Date() } }),
      prisma.outcome.update({ where: { id }, data: { status: "ACTIVE", activeWorkflowVersionId: version.id } })
    ]);
    if (workflow.trigger.type === "schedule") {
      await scheduleOutcome({
        outcomeId: id,
        workspaceId: context.workspaceId,
        cron: String(workflow.trigger.configuration.cron ?? "0 9 * * 1"),
        timezone: workflow.settings.timezone
      });
    }
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "outcome.activated", entityType: "Outcome", entityId: id, metadata: { version: version.version } });
    return { status: "ACTIVE", version: version.version };
  });
}
