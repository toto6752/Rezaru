import { randomBytes } from "node:crypto";
import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { hashSecret } from "@/lib/encryption";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "BUILDER", "OPERATOR", "VIEWER"])
});

export async function POST(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "manageTeam");
    const input = schema.parse(await request.json());
    const token = randomBytes(32).toString("base64url");
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId: context.workspaceId,
        email: input.email.toLowerCase(),
        role: input.role,
        tokenHash: hashSecret(token),
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
        invitedById: context.userId
      }
    });
    await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "team.invited", entityType: "WorkspaceInvitation", entityId: invitation.id, metadata: { email: input.email, role: input.role } });
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/invite/${token}`;
    if (process.env.NODE_ENV === "development") console.info(`[development invitation] ${input.email}: ${url}`);
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      ...(process.env.NODE_ENV === "development" ? { developmentInviteUrl: url } : {})
    };
  });
}
