import { prisma } from "@rezaru/database";
import { ArrowLeft, CircleDollarSign, Clock3, Cpu, Database } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { StatusDot } from "@/components/ui";
import { ExecutionLive } from "@/components/execution-live";
import { LocalDate, T } from "@/components/i18n";

export default async function ExecutionDetailPage({ params }: { params: Promise<{ executionId: string }> }) {
  const context = await requireWorkspace();
  const { executionId } = await params;
  const execution = await prisma.execution.findFirst({
    where: { id: executionId, workspaceId: context.workspaceId },
    include: {
      outcome: { select: { id: true, name: true } },
      workflowVersion: { select: { version: true } },
      steps: { orderBy: { startedAt: "asc" }, include: { logs: { orderBy: { createdAt: "asc" } } } }
    }
  });
  if (!execution) notFound();
  return <div className="detail-page execution-detail">
    <Link className="back-link" href="/app/executions"><ArrowLeft size={14} /> <T k="exec.back" /></Link>
    <header className="page-header detail-header"><div><div className="detail-status"><StatusDot status={execution.status} /><span>{execution.mode === "demo" ? <T k="exec.simulated" /> : <><T k="exec.workflowVersion" />{execution.workflowVersion.version}</>}</span></div><h1>{execution.outcome.name}</h1><p><T k="exec.execution" /> <code>{execution.id}</code></p></div></header>
    <section className="execution-metrics">
      <div><Clock3 size={16} /><span><small><T k="exec.duration" /></small><b>{execution.durationMs ? `${(execution.durationMs / 1000).toFixed(2)}s` : <T k="exec.inProgress" />}</b></span></div>
      <div><CircleDollarSign size={16} /><span><small><T k="exec.cost" /></small><b>${(execution.costCents / 100).toFixed(2)}</b></span></div>
      <div><Cpu size={16} /><span><small><T k="exec.tokens" /></small><b>{execution.aiInputTokens + execution.aiOutputTokens}</b></span></div>
      <div><Database size={16} /><span><small><T k="exec.started" /></small><b><LocalDate value={execution.createdAt} withTime /></b></span></div>
    </section>
    <div className="execution-layout">
      <main><ExecutionLive executionId={execution.id} initialStatus={execution.status} initialSteps={execution.steps.map((step) => ({ ...step, logs: step.logs }))} /></main>
      <aside>
        <div className="dashboard-panel trigger-panel"><h2><T k="exec.triggerInput" /></h2><p><T k="exec.triggerInputSub" /></p><pre>{JSON.stringify(execution.triggerInput, null, 2)}</pre></div>
        <div className="dashboard-panel execution-meta"><h2><T k="exec.metadata" /></h2><div><span><T k="exec.metaOutcome" /></span><Link href={`/app/outcomes/${execution.outcome.id}`}>{execution.outcome.name}</Link></div><div><span><T k="exec.metaVersion" /></span><b>v{execution.workflowVersion.version}</b></div><div><span><T k="exec.metaMode" /></span><b>{execution.mode}</b></div><div><span><T k="exec.metaSteps" /></span><b>{execution.steps.length}</b></div></div>
      </aside>
    </div>
  </div>;
}
