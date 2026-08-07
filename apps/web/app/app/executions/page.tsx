import { prisma } from "@rezaru/database";
import { Activity, Clock3, Filter, Search } from "lucide-react";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { EmptyState, StatusDot } from "@/components/ui";

export default async function ExecutionsPage({ searchParams }: { searchParams: Promise<{ outcomeId?: string }> }) {
  const context = await requireWorkspace();
  const { outcomeId } = await searchParams;
  const executions = await prisma.execution.findMany({
    where: { workspaceId: context.workspaceId, outcomeId },
    include: { outcome: { select: { name: true } }, _count: { select: { steps: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return <div className="list-page">
    <header className="page-header"><div><span className="page-eyebrow">RELIABLE EXECUTION</span><h1>Execution history</h1><p>Inspect every run, step, retry, wait, cost, and output.</p></div></header>
    <div className="list-toolbar"><div><Search size={15} /><input placeholder="Search executions…" aria-label="Search executions" /></div><select aria-label="Filter by status"><option>All statuses</option><option>Succeeded</option><option>Failed</option><option>Running</option></select><button className="button button-secondary"><Filter size={14} /> Filters</button></div>
    <div className="dashboard-panel executions-table">
      {executions.length ? <>
        <div className="table-head"><span>Outcome</span><span>Status</span><span>Started</span><span>Duration</span><span>Steps</span><span /></div>
        {executions.map((execution) => <Link href={`/app/executions/${execution.id}`} key={execution.id}>
          <div><span className="execution-icon neutral"><Activity size={15} /></span><span><b>{execution.outcome.name}</b><small>{execution.mode === "demo" ? "Simulated execution" : execution.id.slice(0, 12)}</small></span></div>
          <StatusDot status={execution.status} />
          <span>{execution.createdAt.toLocaleString()}</span>
          <span><Clock3 size={13} />{execution.durationMs ? `${(execution.durationMs / 1000).toFixed(2)}s` : "—"}</span>
          <span>{execution._count.steps}</span>
          <b>›</b>
        </Link>)}
      </> : <EmptyState icon={<Activity size={21} />} title="No executions yet" description="Test an outcome with simulated data or activate it to begin collecting execution history." />}
    </div>
  </div>;
}
