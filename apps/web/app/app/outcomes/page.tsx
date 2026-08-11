import { prisma } from "@rezaru/database";
import { ArrowRight, Plus, Search, Zap } from "lucide-react";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { EmptyState, StatusDot } from "@/components/ui";
import { T } from "@/components/i18n";
import { ListFilters } from "@/components/list-filters";

export default async function OutcomesPage() {
  const context = await requireWorkspace();
  const outcomes = await prisma.outcome.findMany({
    where: { workspaceId: context.workspaceId, deletedAt: null },
    include: { _count: { select: { executions: true } }, activeWorkflowVersion: { select: { version: true } } },
    orderBy: { updatedAt: "desc" }
  });
  return <div className="list-page">
    <header className="page-header"><div><span className="page-eyebrow"><T k="out.eyebrow" /></span><h1><T k="out.title" /></h1><p><T k="out.lead" /></p></div><Link className="button button-primary" href="/app/outcomes/new"><Plus size={15} /> <T k="dash.create" /></Link></header>
    <ListFilters
      searchKey="out.search"
      labelKey="out.filter"
      icon={<Search size={15} />}
      optionKeys={["common.allStatuses", "out.fActive", "out.fDraft", "out.fAttention"]}
    />
    {outcomes.length ? <div className="outcome-grid">{outcomes.map((outcome) => <Link className="outcome-card" href={`/app/outcomes/${outcome.id}`} key={outcome.id}>
      <div className="outcome-card-top"><span className="outcome-symbol"><Zap size={17} /></span><StatusDot status={outcome.status} /></div>
      <h2>{outcome.name}</h2><p>{outcome.description}</p>
      <div className="outcome-meta"><span><b>{outcome._count.executions}</b> <T k="out.runs" /></span><span><b>v{outcome.activeWorkflowVersion?.version ?? 1}</b> <T k="out.version" /></span><ArrowRight size={15} /></div>
    </Link>)}</div> : <div className="dashboard-panel"><EmptyState icon={<Zap size={21} />} title={<T k="out.emptyTitle" />} description={<T k="out.emptyCopy" />} action={<Link className="button button-primary" href="/app/outcomes/new"><Plus size={15} /> <T k="dash.create" /></Link>} /></div>}
  </div>;
}
