import { prisma } from "@rezaru/database";
import { KeyRound, LockKeyhole, ScrollText, ShieldCheck } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { LocalDate, T } from "@/components/i18n";
import { SettingsNav } from "@/components/settings-nav";
import type { UiCopyKey } from "@/components/ui-copy";

const cards: ReadonlyArray<{ icon: typeof ShieldCheck; title: UiCopyKey; copy: UiCopyKey }> = [
  { icon: LockKeyhole, title: "sec.encTitle", copy: "sec.encCopy" },
  { icon: ShieldCheck, title: "sec.isoTitle", copy: "sec.isoCopy" },
  { icon: KeyRound, title: "sec.keyTitle", copy: "sec.keyCopy" }
];

export default async function SecurityPage() {
  const context = await requireWorkspace();
  const audits = await prisma.auditLog.findMany({ where: { workspaceId: context.workspaceId }, include: { actor: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
  return <div className="settings-page">
    <header className="page-header"><div><span className="page-eyebrow"><T k="sec.eyebrow" /></span><h1><T k="sec.title" /></h1><p><T k="sec.lead" /></p></div></header>
    <div className="settings-layout">
      <div>
        <div className="security-grid">{cards.map((card) => { const Icon = card.icon; return <article key={card.title}><Icon size={20} /><h2><T k={card.title} /></h2><p><T k={card.copy} /></p></article>; })}</div>
        <section className="dashboard-panel audit-section"><div className="panel-heading"><div><h2><T k="sec.audit" /></h2><p><T k="sec.auditSub" /></p></div><ScrollText size={17} /></div>
          <div className="audit-table">{audits.map((audit) => <div key={audit.id}><span>{audit.action.replaceAll(".", " ")}</span><b>{audit.entityType}</b><small>{audit.actor?.name ?? audit.actor?.email ?? <T k="sec.system" />}</small><time><LocalDate value={audit.createdAt} withTime /></time></div>)}</div>
        </section>
      </div>
      <SettingsNav />
    </div>
  </div>;
}
