import { listConnectors } from "@rezaru/connectors";
import { prisma } from "@rezaru/database";
import { ConnectionMarketplace } from "@/components/connection-marketplace";
import { requireWorkspace } from "@/lib/workspace";

export default async function ConnectionsPage() {
  const context = await requireWorkspace();
  const connections = await prisma.connection.findMany({
    where: { workspaceId: context.workspaceId, deletedAt: null },
    select: { id: true, name: true, connectorKey: true, status: true, lastTestedAt: true, lastError: true, _count: { select: { outcomes: true } } },
    orderBy: { name: "asc" }
  });
  const connectors = listConnectors().map(({ key, name, description, category, authType, documentationUrl, environmentRequirements, credentialFields }) => ({ key, name, description, category, authType, documentationUrl, environmentRequirements, credentialFields }));
  return <ConnectionMarketplace connectors={connectors} initialConnections={connections} />;
}
