import { usageLevel } from "@rezaru/config";
import { Activity, Bot, Database, Gauge, Plug, Users, Zap } from "lucide-react";
import Link from "next/link";
import { getWorkspaceUsage } from "@/lib/limits";
import { requireWorkspace } from "@/lib/workspace";
import { T } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

function UsageMeter({ labelKey, used, limit, icon: Icon }: { labelKey: UiCopyKey; used: number; limit: number; icon: typeof Zap }) {
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const level = usageLevel(used, limit);
  const levelKey: UiCopyKey = level === "warning" ? "usage.levelWarning" : level === "critical" ? "usage.levelCritical" : level === "blocked" ? "usage.levelBlocked" : "usage.levelOk";
  return <article className="usage-meter"><div><span><Icon size={16} /><T k={labelKey} /></span><b>{used.toLocaleString()} <small>/ {limit === Number.MAX_SAFE_INTEGER ? <T k="usage.custom" /> : limit.toLocaleString()}</small></b></div><div className={`usage-track ${level}`}><span style={{ width: `${percent}%` }} /></div><footer><span>{percent}% <T k="usage.used" /></span><span><T k={levelKey} /></span></footer></article>;
}

export default async function UsagePage() {
  const context = await requireWorkspace();
  const usage = await getWorkspaceUsage(context.workspaceId);
  return <div className="usage-page">
    <header className="page-header"><div><span className="page-eyebrow"><T k="usage.eyebrow" /></span><h1><T k="usage.title" /></h1><p><T k="usage.lead" /></p></div><Link className="button button-secondary" href="/app/billing"><T k="usage.managePlan" /></Link></header>
    <div className="usage-summary"><div><Gauge size={20} /><span><small><T k="usage.currentPlan" /></small><b>{usage.plan}</b></span></div><div><Activity size={20} /><span><small><T k="usage.period" /></small><b><T k="usage.periodValue" /></b></span></div><div><Database size={20} /><span><small><T k="usage.behavior" /></small><b><T k="usage.behaviorValue" /></b></span></div></div>
    <div className="usage-grid">
      <UsageMeter labelKey="usage.mOutcomes" used={usage.used.activeOutcomes} limit={usage.limits.activeOutcomes} icon={Zap} />
      <UsageMeter labelKey="usage.mExecutions" used={usage.used.executions} limit={usage.limits.executions} icon={Activity} />
      <UsageMeter labelKey="usage.mCredits" used={usage.used.aiCredits} limit={usage.limits.aiCredits} icon={Bot} />
      <UsageMeter labelKey="usage.mMembers" used={usage.used.members} limit={usage.limits.members} icon={Users} />
    </div>
    <div className="usage-notice"><Plug size={17} /><div><b><T k="usage.noticeTitle" /></b><p><T k="usage.noticeCopy" /></p></div></div>
  </div>;
}
