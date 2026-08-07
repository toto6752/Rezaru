import { prisma } from "@rezaru/database";
import { WebhookManager } from "@/components/webhook-manager";
import { requireWorkspace } from "@/lib/workspace";

export default async function WebhooksPage() {
  const context = await requireWorkspace();
  const [outcomes, endpoints] = await Promise.all([
    prisma.outcome.findMany({ where: { workspaceId: context.workspaceId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.webhookEndpoint.findMany({ where: { workspaceId: context.workspaceId }, select: { id: true, outcomeId: true, pathPrefix: true, mode: true, enabled: true, samplePayload: true, createdAt: true, outcome: { select: { name: true } } }, orderBy: { createdAt: "desc" } })
  ]);
  return <div className="settings-page"><header className="page-header"><div><span className="page-eyebrow">INBOUND EVENTS</span><h1>Webhooks</h1><p>Create test and production endpoints with optional secret verification.</p></div></header><WebhookManager outcomes={outcomes} initialEndpoints={endpoints} /></div>;
}
