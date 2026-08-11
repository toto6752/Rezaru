import { prisma } from "@rezaru/database";
import { ApiKeyManager } from "@/components/api-key-manager";
import { requireWorkspace } from "@/lib/workspace";
import { T } from "@/components/i18n";

export default async function ApiKeysPage() {
  const context = await requireWorkspace();
  const keys = await prisma.apiKey.findMany({ where: { workspaceId: context.workspaceId, revokedAt: null }, select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  return <div className="settings-page"><header className="page-header"><div><span className="page-eyebrow"><T k="key.eyebrow" /></span><h1><T k="key.title" /></h1><p><T k="key.lead" /></p></div></header><ApiKeyManager initialKeys={keys} /></div>;
}
