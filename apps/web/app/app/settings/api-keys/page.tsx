import { prisma } from "@outcomeos/database";
import { ApiKeyManager } from "@/components/api-key-manager";
import { requireWorkspace } from "@/lib/workspace";

export default async function ApiKeysPage() {
  const context = await requireWorkspace();
  const keys = await prisma.apiKey.findMany({ where: { workspaceId: context.workspaceId, revokedAt: null }, select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  return <div className="settings-page"><header className="page-header"><div><span className="page-eyebrow">DEVELOPER ACCESS</span><h1>API keys</h1><p>Trigger outcomes and inspect executions from your own product.</p></div></header><ApiKeyManager initialKeys={keys} /></div>;
}
