import { prisma } from "@outcomeos/database";
import { ArrowRight, Plus, Search, Zap } from "lucide-react";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { EmptyState, StatusDot } from "@/components/ui";

export default async function OutcomesPage() {
  const context = await requireWorkspace();
  const outcomes = await prisma.outcome.findMany({
    where: { workspaceId: context.workspaceId, deletedAt: null },
    include: { _count: { select: { executions: true } }, activeWorkflowVersion: { select: { version: true } } },
    orderBy: { updatedAt: "desc" }
  });
  return <div className="list-page">
    <header className="page-header"><div><span className="page-eyebrow">AUTOMATED OPERATIONS</span><h1>Outcomes</h1><p>Business results that OutcomeOS creates, runs, and improves.</p></div><Link className="button button-primary" href="/app/outcomes/new"><Plus size={15} /> Create outcome</Link></header>
    <div className="list-toolbar"><div><Search size={15} /><input placeholder="Search outcomes…" aria-label="Search outcomes" /></div><select aria-label="Filter outcomes"><option>All statuses</option><option>Active</option><option>Draft</option><option>Needs attention</option></select></div>
    {outcomes.length ? <div className="outcome-grid">{outcomes.map((outcome) => <Link className="outcome-card" href={`/app/outcomes/${outcome.id}`} key={outcome.id}>
      <div className="outcome-card-top"><span className="outcome-symbol"><Zap size={17} /></span><StatusDot status={outcome.status} /></div>
      <h2>{outcome.name}</h2><p>{outcome.description}</p>
      <div className="outcome-meta"><span><b>{outcome._count.executions}</b> executions</span><span><b>v{outcome.activeWorkflowVersion?.version ?? 1}</b> version</span><ArrowRight size={15} /></div>
    </Link>)}</div> : <div className="dashboard-panel"><EmptyState icon={<Zap size={21} />} title="Define your first outcome" description="Describe repetitive business work. OutcomeOS will ask for only the details it needs and create a plan you can test." action={<Link className="button button-primary" href="/app/outcomes/new"><Plus size={15} /> Create outcome</Link>} /></div>}
  </div>;
}
