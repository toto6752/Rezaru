import { prisma } from "@outcomeos/database";
import { TeamManager } from "@/components/team-manager";
import { requireWorkspace } from "@/lib/workspace";

export default async function TeamPage() {
  const context = await requireWorkspace();
  const [members, invitations] = await Promise.all([
    prisma.workspaceMember.findMany({ where: { workspaceId: context.workspaceId }, include: { user: { select: { id: true, name: true, email: true, image: true } } }, orderBy: { joinedAt: "asc" } }),
    prisma.workspaceInvitation.findMany({ where: { workspaceId: context.workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } })
  ]);
  return <TeamManager initialMembers={members} initialInvitations={invitations} />;
}
