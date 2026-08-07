import { prisma } from "@rezaru/database";
import { Users } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { hashSecret } from "@/lib/encryption";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.workspaceInvitation.findUnique({
    where: { tokenHash: hashSecret(token) },
    include: { workspace: { select: { name: true } } }
  });
  const valid = invite && !invite.acceptedAt && invite.expiresAt > new Date();
  return <main className="simple-auth"><Logo /><Users size={30} /><h1>{valid ? `Join ${invite.workspace.name}` : "Invitation unavailable"}</h1><p>{valid ? `You have been invited as ${invite.role.toLowerCase()}. Sign in or create an account with ${invite.email} to continue.` : "This invitation is invalid, expired, or has already been used."}</p><Link className="button button-primary" href={valid ? `/register?invite=${encodeURIComponent(token)}` : "/"}>{valid ? "Accept invitation" : "Return home"}</Link></main>;
}
