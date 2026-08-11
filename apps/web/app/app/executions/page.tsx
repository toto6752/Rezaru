import { prisma } from "@rezaru/database";
import { Activity, Clock3, Search } from "lucide-react";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { EmptyState, StatusDot } from "@/components/ui";
import { LocalDate, T } from "@/components/i18n";
import { ListFilters } from "@/components/list-filters";

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
    <header className="page-header"><div><span className="page-eyebrow"><T k="exec.eyebrow" /></span><h1><T k="exec.title" /></h1><p><T k="exec.lead" /></p></div></header>
    <ListFilters
      searchKey="exec.search"
      labelKey="exec.filterStatus"
      icon={<Search size={15} />}
      optionKeys={["common.allStatuses", "exec.fSucceeded", "exec.fFailed", "exec.fRunning"]}
      withFilterButton
    />
    <div className="dashboard-panel executions-table">
      {executions.length ? <>
        <div className="table-head"><span><T k="exec.colOutcome" /></span><span><T k="exec.colStatus" /></span><span><T k="exec.colStarted" /></span><span><T k="exec.colDuration" /></span><span><T k="exec.colSteps" /></span><span /></div>
        {executions.map((execution) => <Link href={`/app/executions/${execution.id}`} key={execution.id}>
          <div><span className="execution-icon neutral"><Activity size={15} /></span><span><b>{execution.outcome.name}</b><small>{execution.mode === "demo" ? <T k="exec.simulated" /> : execution.id.slice(0, 12)}</small></span></div>
          <StatusDot status={execution.status} />
          <LocalDate value={execution.createdAt} withTime />
          <span><Clock3 size={13} />{execution.durationMs ? `${(execution.durationMs / 1000).toFixed(2)}s` : "—"}</span>
          <span>{execution._count.steps}</span>
          <b>›</b>
        </Link>)}
      </> : <EmptyState icon={<Activity size={21} />} title={<T k="exec.emptyTitle" />} description={<T k="exec.emptyCopy" />} />}
    </div>
  </div>;
}
