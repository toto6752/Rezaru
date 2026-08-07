import { prisma } from "@rezaru/database";
import { ArrowLeft, CircleDollarSign, Clock3, Cpu, Database } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { StatusDot } from "@/components/ui";
import { ExecutionLive } from "@/components/execution-live";

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
    <Link className="back-link" href="/app/executions"><ArrowLeft size={14} /> Execution history</Link>
    <header className="page-header detail-header"><div><div className="detail-status"><StatusDot status={execution.status} /><span>{execution.mode === "demo" ? "Simulated execution" : `Workflow v${execution.workflowVersion.version}`}</span></div><h1>{execution.outcome.name}</h1><p>Execution <code>{execution.id}</code></p></div></header>
    <section className="execution-metrics">
      <div><Clock3 size={16} /><span><small>Duration</small><b>{execution.durationMs ? `${(execution.durationMs / 1000).toFixed(2)}s` : "In progress"}</b></span></div>
      <div><CircleDollarSign size={16} /><span><small>Estimated cost</small><b>${(execution.costCents / 100).toFixed(2)}</b></span></div>
      <div><Cpu size={16} /><span><small>AI tokens</small><b>{execution.aiInputTokens + execution.aiOutputTokens}</b></span></div>
      <div><Database size={16} /><span><small>Started</small><b>{execution.createdAt.toLocaleString()}</b></span></div>
    </section>
    <div className="execution-layout">
      <main><ExecutionLive executionId={execution.id} initialStatus={execution.status} initialSteps={execution.steps.map((step) => ({ ...step, logs: step.logs }))} /></main>
      <aside>
        <div className="dashboard-panel trigger-panel"><h2>Trigger input</h2><p>Secrets and configured redact fields are masked before display.</p><pre>{JSON.stringify(execution.triggerInput, null, 2)}</pre></div>
        <div className="dashboard-panel execution-meta"><h2>Execution metadata</h2><div><span>Outcome</span><Link href={`/app/outcomes/${execution.outcome.id}`}>{execution.outcome.name}</Link></div><div><span>Version</span><b>v{execution.workflowVersion.version}</b></div><div><span>Mode</span><b>{execution.mode}</b></div><div><span>Steps</span><b>{execution.steps.length}</b></div></div>
      </aside>
    </div>
  </div>;
}
