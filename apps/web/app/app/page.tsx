import { prisma } from "@outcomeos/database";
import { ArrowRight, CheckCircle2, Clock3, Sparkles, TriangleAlert, Zap } from "lucide-react";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { StatusDot } from "@/components/ui";

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

  return (
    <div className="dashboard">
      <header className="page-header dashboard-header">
        <div><span className="page-eyebrow">OPERATIONS OVERVIEW</span><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}.</h1><p>{context.workspaceName} is operating normally. Here’s what OutcomeOS handled.</p></div>
        <Link className="button button-primary" href="/app/outcomes/new"><Zap size={15} /> Create outcome</Link>
      </header>

      <section className="metric-grid">
        {[
          ["Active outcomes", active, `${outcomes.length} total`, Zap, "accent"],
          ["Executions today", todayCount, `${successCount} successful`, CheckCircle2, "success"],
          ["Success rate", `${successRate}%`, todayCount ? "Across today's runs" : "No failures today", Sparkles, "info"],
          ["Estimated time saved", `${Math.round(timeSaved / 60)}h`, "This month", Clock3, "warning"]
        ].map(([label, value, detail, Icon, tone]) => {
          const MetricIcon = Icon as typeof Zap;
          return <article key={String(label)}><div><span>{String(label)}</span><b>{String(value)}</b><small>{String(detail)}</small></div><i className={`metric-icon ${tone}`}><MetricIcon size={18} /></i></article>;
        })}
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel recent-panel">
          <div className="panel-heading"><div><h2>Recent executions</h2><p>Live activity across active outcomes.</p></div><Link href="/app/executions">View all <ArrowRight size={14} /></Link></div>
          {executions.length ? <div className="execution-list">
            {executions.map((execution) => <Link href={`/app/executions/${execution.id}`} key={execution.id}>
              <span className={`execution-icon ${execution.status === "SUCCEEDED" ? "success" : execution.status === "FAILED" ? "danger" : "info"}`}>{execution.status === "SUCCEEDED" ? <CheckCircle2 size={16} /> : execution.status === "FAILED" ? <TriangleAlert size={16} /> : <Clock3 size={16} />}</span>
              <div><b>{execution.outcome.name}</b><small>{execution.mode === "demo" ? "Simulated · " : ""}{execution.createdAt.toLocaleString()}</small></div>
              <StatusDot status={execution.status} />
              <span className="execution-duration">{execution.durationMs ? `${(execution.durationMs / 1000).toFixed(1)}s` : "—"}</span>
            </Link>)}
          </div> : <div className="dashboard-empty"><ActivityIcon /><div><b>No executions yet</b><span>Test or activate an outcome to see live activity here.</span></div><Link href="/app/outcomes/new">Build an outcome</Link></div>}
        </div>
        <div className="dashboard-panel attention-panel">
          <div className="panel-heading"><div><h2>Needs attention</h2><p>Items waiting for your decision.</p></div></div>
          {attention.length ? attention.map((outcome) => <Link href={`/app/outcomes/${outcome.id}`} key={outcome.id}><TriangleAlert size={16} /><span><b>{outcome.name}</b><small>Review recent failures</small></span><ArrowRight size={14} /></Link>) :
            <div className="all-clear"><CheckCircle2 size={22} /><b>Everything looks healthy</b><p>No outcomes need attention right now.</p></div>}
        </div>
      </section>

      <section className="dashboard-grid lower-grid">
        <div className="dashboard-panel">
          <div className="panel-heading"><div><h2>Active outcomes</h2><p>Business operations running on your behalf.</p></div><Link href="/app/outcomes">Manage <ArrowRight size={14} /></Link></div>
          <div className="mini-outcomes">
            {outcomes.length ? outcomes.slice(0, 4).map((outcome) => <Link href={`/app/outcomes/${outcome.id}`} key={outcome.id}><span><Zap size={15} /></span><div><b>{outcome.name}</b><small>{outcome.description}</small></div><StatusDot status={outcome.status} /></Link>) :
            <div className="all-clear"><Zap size={22} /><b>Your first outcome starts with a sentence</b><p>Describe repetitive work and review the generated plan.</p></div>}
          </div>
        </div>
        <div className="dashboard-panel suggestion-panel">
          <div className="panel-heading"><div><h2>AI improvements</h2><p>Evidence-backed suggestions for your approval.</p></div></div>
          {suggestions.length ? suggestions.map((suggestion) => <div key={suggestion.id}><Sparkles size={16} /><span><b>{suggestion.title}</b><small>{suggestion.description}</small></span></div>) :
            <div className="all-clear"><Sparkles size={22} /><b>Learning from execution history</b><p>Suggestions appear when OutcomeOS has enough evidence to recommend a change.</p></div>}
        </div>
      </section>
    </div>
  );
}

function ActivityIcon() {
  return <span className="execution-icon neutral"><Clock3 size={16} /></span>;
}
