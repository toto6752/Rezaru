import { prisma } from "@rezaru/database";
import { Users } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { hashSecret } from "@/lib/encryption";
import { RoleLabel, T } from "@/components/i18n";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.workspaceInvitation.findUnique({
    where: { tokenHash: hashSecret(token) },
    include: { workspace: { select: { name: true } } }
  });
  const valid = invite && !invite.acceptedAt && invite.expiresAt > new Date();
  return <main className="simple-auth"><Logo /><Users size={30} />
    <h1>{valid ? <><T k="auth.inviteJoin" /> {invite.workspace.name}</> : <T k="auth.inviteBad" />}</h1>
    <p>{valid ? <><T k="auth.inviteRole" /> «<RoleLabel role={invite.role} />» — {invite.email}. <T k="auth.inviteTail" /></> : <T k="auth.inviteBadCopy" />}</p>
    <Link className="button button-primary" href={valid ? `/register?invite=${encodeURIComponent(token)}` : "/"}>{valid ? <T k="auth.inviteAccept" /> : <T k="auth.inviteHome" />}</Link>
  </main>;
}
