import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { encryptCredentials } from "@/lib/encryption";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { getConnector } from "@outcomeos/connectors";
import { prisma } from "@outcomeos/database";
import { z } from "zod";

const createSchema = z.object({
  connectorKey: z.string().min(1).max(80),
  name: z.string().min(2).max(100),
  credentials: z.record(z.string()).default({})
});

export async function GET() {
  return withApi(async () => {
    const context = await requireWorkspace();
    return prisma.connection.findMany({
      where: { workspaceId: context.workspaceId, deletedAt: null },
      select: {
        id: true,
        name: true,
        connectorKey: true,
        status: true,
        metadata: true,
        lastTestedAt: true,
        lastError: true,
        createdAt: true,
        _count: { select: { outcomes: true } }
      },
      orderBy: { name: "asc" }
    });
  });
}

export async function POST(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "manageConnections");
    const input = createSchema.parse(await request.json());
    const connector = getConnector(input.connectorKey);
    if (connector.authType !== "none" && Object.keys(input.credentials).length === 0) {
      throw Object.assign(new Error("Credentials are required for this connector"), { status: 400, code: "MISSING_CREDENTIALS" });
    }
    const test = process.env.DEMO_MODE === "true" && Object.values(input.credentials).every((value) => value === "demo")
      ? { ok: true, message: "Demo connection is ready" }
      : await connector.testConnection(input.credentials);
    const connection = await prisma.connection.create({
      data: {
        workspaceId: context.workspaceId,
        name: input.name,
        connectorKey: input.connectorKey,
        status: test.ok ? "CONNECTED" : "NEEDS_ATTENTION",
        metadata: { authType: connector.authType, credentialFields: Object.keys(input.credentials), simulated: Object.values(input.credentials).every((value) => value === "demo") },
        lastTestedAt: new Date(),
        lastError: test.ok ? null : test.message,
        credential: Object.keys(input.credentials).length ? { create: { encryptedData: encryptCredentials(input.credentials) } } : undefined
      },
      select: { id: true, name: true, connectorKey: true, status: true, metadata: true, lastTestedAt: true, lastError: true }
    });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "connection.created", entityType: "Connection", entityId: connection.id, metadata: { connectorKey: connector.key, testPassed: test.ok } });
    return { ...connection, testMessage: test.message };
  });
}
