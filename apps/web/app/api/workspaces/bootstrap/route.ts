import { withApi } from "@/lib/api";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@rezaru/database";
import { headers } from "next/headers";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(80),
  // Which wording of the policy the checkbox was shown next to. Optional so
  // an older client cannot fail to create a workspace, but the registration
  // form always sends it.
  privacyPolicyVersion: z.string().max(40).optional()
});

export async function POST(request: Request) {
  return withApi(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw Object.assign(new Error("Authentication required"), { status: 401, code: "UNAUTHORIZED" });
    const { name, privacyPolicyVersion } = schema.parse(await request.json());

    // Written before the workspace: this call is the first authenticated
    // request after sign-up, so it is the earliest moment the consent given
    // on the registration form can be attached to a real user row.
    if (privacyPolicyVersion) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { privacyAcceptedAt: new Date(), privacyPolicyVersion }
      });
    }

    const existing = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id }, include: { workspace: true } });
    if (existing) return existing.workspace;
    const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
    let slug = base;
    let suffix = 1;
    while (await prisma.workspace.findUnique({ where: { slug }, select: { id: true } })) slug = `${base}-${suffix++}`;
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        members: { create: { userId: session.user.id, role: "OWNER" } },
        subscription: { create: { plan: "FREE", status: process.env.STRIPE_SECRET_KEY ? "incomplete" : "development" } }
      }
    });
    await writeAuditLog({ workspaceId: workspace.id, actorId: session.user.id, action: "workspace.created", entityType: "Workspace", entityId: workspace.id });
    return workspace;
  });
}
