import { withApi } from "@/lib/api";
import { decryptCredentials } from "@/lib/encryption";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { getConnector } from "@outcomeos/connectors";
import { prisma } from "@outcomeos/database";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "manageConnections");
    const { id } = await params;
    const connection = await prisma.connection.findFirst({
      where: { id, workspaceId: context.workspaceId, deletedAt: null },
      include: { credential: true }
    });
    if (!connection) throw Object.assign(new Error("Connection not found"), { status: 404, code: "NOT_FOUND" });
    const credentials = connection.credential ? decryptCredentials(connection.credential.encryptedData) : {};
    const simulated = Object.values(credentials).every((value) => value === "demo");
    const test = simulated ? { ok: true, message: "Demo connection is ready" } : await getConnector(connection.connectorKey).testConnection(credentials);
    await prisma.connection.update({
      where: { id },
      data: { status: test.ok ? "CONNECTED" : "NEEDS_ATTENTION", lastTestedAt: new Date(), lastError: test.ok ? null : test.message }
    });
    return test;
  });
}
