import { prisma } from "@outcomeos/database";
import { KeyRound, LockKeyhole, ScrollText, ShieldCheck } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";

export default async function SecurityPage() {
  const context = await requireWorkspace();
  const audits = await prisma.auditLog.findMany({ where: { workspaceId: context.workspaceId }, include: { actor: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
  return <div className="settings-page"><header className="page-header"><div><span className="page-eyebrow">SECURITY & TRUST</span><h1>Security</h1><p>Credential protection, authorization controls, and workspace audit evidence.</p></div></header><div className="security-grid">{[[LockKeyhole, "Encrypted credentials", "AES-256-GCM authenticated encryption with separate secret records."], [ShieldCheck, "Workspace isolation", "Every resource query is scoped to the authenticated workspace."], [KeyRound, "Hashed API keys", "Full developer keys are shown once and never stored in recoverable form."]].map(([Icon, title, copy]) => { const SecurityIcon = Icon as typeof ShieldCheck; return <article key={String(title)}><SecurityIcon size={20} /><h2>{String(title)}</h2><p>{String(copy)}</p></article>; })}</div><section className="dashboard-panel audit-section"><div className="panel-heading"><div><h2>Audit log</h2><p>Security-sensitive workspace activity.</p></div><ScrollText size={17} /></div><div className="audit-table">{audits.map((audit) => <div key={audit.id}><span>{audit.action.replaceAll(".", " ")}</span><b>{audit.entityType}</b><small>{audit.actor?.name ?? audit.actor?.email ?? "System"}</small><time>{audit.createdAt.toLocaleString()}</time></div>)}</div></section></div>;
}
