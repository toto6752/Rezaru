import { prisma } from "@rezaru/database";
import { ArrowRight, CheckCircle2, Clock3, Sparkles, TriangleAlert, Zap } from "lucide-react";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { StatusDot } from "@/components/ui";
import { LocalDate, T } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

export default async function DashboardPage() {
  const context = await requireWorkspace();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [outcomes, executions, todayCount, successCount, attention, suggestions] = await Promise.all([
    prisma.outcome.findMany({ where: { workspaceId: context.workspaceId, deletedAt: null }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.execution.findMany({ where: { workspaceId: context.workspaceId }, include: { outcome: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 7 }),
    prisma.execution.count({ where: { workspaceId: context.workspaceId, createdAt: { gte: today } } }),
    prisma.execution.count({ where: { workspaceId: context.workspaceId, createdAt: { gte: today }, status: "SUCCEEDED" } }),
    prisma.outcome.findMany({ where: { workspaceId: context.workspaceId, status: "NEEDS_ATTENTION", deletedAt: null }, take: 3 }),
    prisma.improvementSuggestion.findMany({ where: { workspaceId: context.workspaceId, status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 3 })
  ]);
  const active = outcomes.filter((outcome) => outcome.status === "ACTIVE").length;
  const timeSaved = outcomes.reduce((sum, outcome) => sum + outcome.estimatedMinutesSaved, 0);
  const successRate = todayCount ? Math.round((successCount / todayCount) * 100) : 100;
  const hour = new Date().getHours();
  const greeting: UiCopyKey = hour < 12 ? "dash.morning" : hour < 18 ? "dash.afternoon" : "dash.evening";

  const metrics: Array<{ label: UiCopyKey; value: React.ReactNode; detail: React.ReactNode; icon: typeof Zap; tone: string }> = [
    { label: "dash.mActive", value: active, detail: <>{outcomes.length} <T k="dash.mActiveDetail" /></>, icon: Zap, tone: "accent" },
    { label: "dash.mToday", value: todayCount, detail: <>{successCount} <T k="dash.mTodayDetail" /></>, icon: CheckCircle2, tone: "success" },
    { label: "dash.mRate", value: `${successRate}%`, detail: <T k={todayCount ? "dash.mRateDetail" : "dash.mRateNone"} />, icon: Sparkles, tone: "info" },
    { label: "dash.mSaved", value: <>{Math.round(timeSaved / 60)} <T k="dash.hours" /></>, detail: <T k="dash.mSavedDetail" />, icon: Clock3, tone: "warning" }
  ];

  return (
    <div className="dashboard">
      <header className="page-header dashboard-header">
        <div><span className="page-eyebrow"><T k="dash.eyebrow" /></span><h1><T k={greeting} /></h1><p>{context.workspaceName} <T k="dash.leadTail" /></p></div>
        <Link className="button button-primary" href="/app/outcomes/new"><Zap size={15} /> <T k="dash.create" /></Link>
      </header>

      <section className="metric-grid">
        {metrics.map((metric) => {
          const MetricIcon = metric.icon;
          return <article key={metric.label}><div><span><T k={metric.label} /></span><b>{metric.value}</b><small>{metric.detail}</small></div><i className={`metric-icon ${metric.tone}`}><MetricIcon size={18} /></i></article>;
        })}
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel recent-panel">
          <div className="panel-heading"><div><h2><T k="dash.recent" /></h2><p><T k="dash.recentSub" /></p></div><Link href="/app/executions"><T k="common.viewAll" /> <ArrowRight size={14} /></Link></div>
          {executions.length ? <div className="execution-list">
            {executions.map((execution) => <Link href={`/app/executions/${execution.id}`} key={execution.id}>
              <span className={`execution-icon ${execution.status === "SUCCEEDED" ? "success" : execution.status === "FAILED" ? "danger" : "info"}`}>{execution.status === "SUCCEEDED" ? <CheckCircle2 size={16} /> : execution.status === "FAILED" ? <TriangleAlert size={16} /> : <Clock3 size={16} />}</span>
              <div><b>{execution.outcome.name}</b><small>{execution.mode === "demo" ? <T k="dash.simulated" /> : null}<LocalDate value={execution.createdAt} withTime /></small></div>
              <StatusDot status={execution.status} />
              <span className="execution-duration">{execution.durationMs ? `${(execution.durationMs / 1000).toFixed(1)}s` : "—"}</span>
            </Link>)}
          </div> : <div className="dashboard-empty"><ActivityIcon /><div><b><T k="dash.noRuns" /></b><span><T k="dash.noRunsSub" /></span></div><Link href="/app/outcomes/new"><T k="dash.buildFirst" /></Link></div>}
        </div>
        <div className="dashboard-panel attention-panel">
          <div className="panel-heading"><div><h2><T k="dash.attention" /></h2><p><T k="dash.attentionSub" /></p></div></div>
          {attention.length ? attention.map((outcome) => <Link href={`/app/outcomes/${outcome.id}`} key={outcome.id}><TriangleAlert size={16} /><span><b>{outcome.name}</b><small><T k="dash.reviewFails" /></small></span><ArrowRight size={14} /></Link>) :
            <div className="all-clear"><CheckCircle2 size={22} /><b><T k="dash.healthy" /></b><p><T k="dash.healthySub" /></p></div>}
        </div>
      </section>

      <section className="dashboard-grid lower-grid">
        <div className="dashboard-panel">
          <div className="panel-heading"><div><h2><T k="dash.activeOutcomes" /></h2><p><T k="dash.activeOutcomesSub" /></p></div><Link href="/app/outcomes"><T k="common.manage" /> <ArrowRight size={14} /></Link></div>
          <div className="mini-outcomes">
            {outcomes.length ? outcomes.slice(0, 4).map((outcome) => <Link href={`/app/outcomes/${outcome.id}`} key={outcome.id}><span><Zap size={15} /></span><div><b>{outcome.name}</b><small>{outcome.description}</small></div><StatusDot status={outcome.status} /></Link>) :
            <div className="all-clear"><Zap size={22} /><b><T k="dash.firstOutcome" /></b><p><T k="dash.firstOutcomeSub" /></p></div>}
          </div>
        </div>
        <div className="dashboard-panel suggestion-panel">
          <div className="panel-heading"><div><h2><T k="dash.improvements" /></h2><p><T k="dash.improvementsSub" /></p></div></div>
          {suggestions.length ? suggestions.map((suggestion) => <div key={suggestion.id}><Sparkles size={16} /><span><b>{suggestion.title}</b><small>{suggestion.description}</small></span></div>) :
            <div className="all-clear"><Sparkles size={22} /><b><T k="dash.learning" /></b><p><T k="dash.learningSub" /></p></div>}
        </div>
      </section>
    </div>
  );
}

function ActivityIcon() {
  return <span className="execution-icon neutral"><Clock3 size={16} /></span>;
}
