import { auth } from "@/lib/auth";
import { prisma, WorkspaceRole } from "@rezaru/database";
import { headers } from "next/headers";

export type WorkspaceContext = {
  userId: string;
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
  plan: string;
};

export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  let userId: string | undefined;
  const session = await auth.api.getSession({ headers: await headers() });
  userId = session?.user.id;

  if (!userId && process.env.DEMO_AUTH_BYPASS === "true") {
    userId = (await prisma.user.findUnique({ where: { email: "demo@rezaru.local" }, select: { id: true } }))?.id;
  }
  if (!userId) return null;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspace: { deletedAt: null } },
    orderBy: { joinedAt: "asc" },
    include: { workspace: { select: { id: true, name: true, subscription: { select: { plan: true } } } } }
  });
  if (!membership) return null;
  return {
    userId,
    workspaceId: membership.workspace.id,
    workspaceName: membership.workspace.name,
    role: membership.role,
    plan: membership.workspace.subscription?.plan ?? "FREE"
  };
}

export async function requireWorkspace(): Promise<WorkspaceContext> {
  const context = await getWorkspaceContext();
  if (!context) throw Object.assign(new Error("Authentication required"), { status: 401, code: "UNAUTHORIZED" });
  return context;
}

const permissions = {
  createOutcome: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.BUILDER],
  activateOutcome: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.BUILDER, WorkspaceRole.OPERATOR],
  manageConnections: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.BUILDER],
  manageBilling: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN],
  manageTeam: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN],
  viewExecutions: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.BUILDER, WorkspaceRole.OPERATOR, WorkspaceRole.VIEWER],
  approve: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.OPERATOR],
  manageApiKeys: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]
} as const;

export type Permission = keyof typeof permissions;

export function assertPermission(context: WorkspaceContext, permission: Permission): void {
  if (!(permissions[permission] as readonly WorkspaceRole[]).includes(context.role)) {
    throw Object.assign(new Error("You do not have permission to perform this action"), { status: 403, code: "FORBIDDEN" });
  }
}
