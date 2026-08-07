import { usageLevel } from "@rezaru/config";
import { Activity, Bot, Database, Gauge, Plug, Users, Zap } from "lucide-react";
import Link from "next/link";
import { getWorkspaceUsage } from "@/lib/limits";
import { requireWorkspace } from "@/lib/workspace";

function UsageMeter({ label, used, limit, icon: Icon }: { label: string; used: number; limit: number; icon: typeof Zap }) {
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const level = usageLevel(used, limit);
  return <article className="usage-meter"><div><span><Icon size={16} />{label}</span><b>{used.toLocaleString()} <small>/ {limit === Number.MAX_SAFE_INTEGER ? "Custom" : limit.toLocaleString()}</small></b></div><div className={`usage-track ${level}`}><span style={{ width: `${percent}%` }} /></div><footer><span>{percent}% used</span><span>{level === "warning" ? "Approaching plan allowance" : level === "critical" ? "Upgrade recommended" : level === "blocked" ? "Limit reached" : "Within allowance"}</span></footer></article>;
}

export default async function UsagePage() {
  const context = await requireWorkspace();
  const usage = await getWorkspaceUsage(context.workspaceId);
  return <div className="usage-page">
    <header className="page-header"><div><span className="page-eyebrow">METERING & LIMITS</span><h1>Usage</h1><p>Transparent workspace consumption for the current billing period.</p></div><Link className="button button-secondary" href="/app/billing">Manage plan</Link></header>
    <div className="usage-summary"><div><Gauge size={20} /><span><small>Current plan</small><b>{usage.plan}</b></span></div><div><Activity size={20} /><span><small>Billing period</small><b>This calendar month</b></span></div><div><Database size={20} /><span><small>Limit behavior</small><b>Excess runs pause safely</b></span></div></div>
    <div className="usage-grid">
      <UsageMeter label="Active outcomes" used={usage.used.activeOutcomes} limit={usage.limits.activeOutcomes} icon={Zap} />
      <UsageMeter label="Executions" used={usage.used.executions} limit={usage.limits.executions} icon={Activity} />
      <UsageMeter label="AI credits" used={usage.used.aiCredits} limit={usage.limits.aiCredits} icon={Bot} />
      <UsageMeter label="Team members" used={usage.used.members} limit={usage.limits.members} icon={Users} />
    </div>
    <div className="usage-notice"><Plug size={17} /><div><b>Plan limits are enforced on the server</b><p>Rezaru never deletes outcomes when a limit is reached. New excess executions pause and surface an upgrade request.</p></div></div>
  </div>;
}
