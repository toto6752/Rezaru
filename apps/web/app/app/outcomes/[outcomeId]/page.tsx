import type { WorkflowDefinition } from "@rezaru/workflow-schema";
import { prisma } from "@rezaru/database";
import { ArrowRight, Clock3, Plug, Settings2, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { StatusDot } from "@/components/ui";
import { OutcomeActions } from "@/components/outcome-actions";
import { TechnicalWorkflowView } from "@/components/technical-workflow-view";
import { LocalDate, T } from "@/components/i18n";

export default async function OutcomeDetailPage({ params }: { params: Promise<{ outcomeId: string }> }) {
  const context = await requireWorkspace();
  const { outcomeId } = await params;
  const outcome = await prisma.outcome.findFirst({
    where: { id: outcomeId, workspaceId: context.workspaceId, deletedAt: null },
    include: {
      activeWorkflowVersion: true,
      workflowVersions: { orderBy: { version: "desc" }, take: 1 },
      executions: { orderBy: { createdAt: "desc" }, take: 6 },
      suggestions: { where: { status: "PENDING" }, take: 3 }
    }
  });
  if (!outcome) notFound();
  const version = outcome.activeWorkflowVersion ?? outcome.workflowVersions[0];
  const workflow = version?.definition as unknown as WorkflowDefinition | undefined;
  const explanation = version?.explanation as { humanReadablePlan?: Array<{ id: string; title: string; description: string }> } | null;
  return <div className="detail-page">
    <header className="page-header detail-header"><div><div className="detail-status"><StatusDot status={outcome.status} /><span><T k="out.detailVersion" /> {version?.version ?? 1}</span></div><h1>{outcome.name}</h1><p>{outcome.description}</p></div><OutcomeActions id={outcome.id} status={outcome.status} /></header>
    <nav className="detail-nav"><a className="active" href="#overview"><T k="out.tabOverview" /></a><Link href={`/app/outcomes/${outcome.id}/executions`}><T k="out.tabExecutions" /></Link><Link href={`/app/outcomes/${outcome.id}/edit`}><T k="out.tabEdit" /></Link></nav>
    <div className="detail-grid" id="overview">
      <section className="detail-main">
        <div className="dashboard-panel outcome-plan-card">
          <div className="panel-heading"><div><h2><T k="out.plan" /></h2><p><T k="out.planSub" /></p></div><Link href={`/app/outcomes/${outcome.id}/edit`}><T k="out.editWithAi" /> <Sparkles size={14} /></Link></div>
          <ol>{(explanation?.humanReadablePlan ?? workflow?.steps.map((step) => ({ id: step.id, title: step.name, description: step.description })) ?? []).map((step, index, list) => <li key={step.id}><span>{index + 1}</span><div><b>{step.title}</b><p>{step.description}</p></div>{index < list.length - 1 && <i />}</li>)}</ol>
        </div>
        {workflow && <div className="dashboard-panel workflow-card"><div className="panel-heading"><div><h2><T k="out.technical" /></h2><p><T k="out.technicalSub" /></p></div><span><Settings2 size={14} /> <T k="out.advanced" /></span></div><TechnicalWorkflowView workflow={workflow} /></div>}
      </section>
      <aside className="detail-aside">
        <div className="dashboard-panel"><div className="panel-heading"><div><h2><T k="out.requiredConn" /></h2></div><Link href="/app/connections"><T k="common.manage" /></Link></div>
          <div className="connection-requirements">{workflow?.requiredConnections.length ? workflow.requiredConnections.map((connection) => <div key={connection.connectorKey}><span><Plug size={14} /></span><div><b>{connection.label}</b><small>{connection.reason}</small></div><i><T k="common.required" /></i></div>) : <p className="aside-empty"><T k="out.noConn" /></p>}</div>
        </div>
        <div className="dashboard-panel"><div className="panel-heading"><div><h2><T k="out.recent" /></h2></div><Link href={`/app/outcomes/${outcome.id}/executions`}><T k="common.viewAll" /></Link></div>
          <div className="side-executions">{outcome.executions.length ? outcome.executions.map((execution) => <Link href={`/app/executions/${execution.id}`} key={execution.id}><StatusDot status={execution.status} /><LocalDate value={execution.createdAt} /><Clock3 size={13} /></Link>) : <p className="aside-empty"><T k="out.noRuns" /></p>}</div>
        </div>
        {outcome.suggestions.length > 0 && <div className="dashboard-panel suggestion-mini"><div className="panel-heading"><div><h2><T k="out.improvements" /></h2></div></div>{outcome.suggestions.map((suggestion) => <div key={suggestion.id}><Sparkles size={15} /><span><b>{suggestion.title}</b><small>{suggestion.description}</small></span><ArrowRight size={14} /></div>)}</div>}
      </aside>
    </div>
  </div>;
}
