import { prisma } from "@rezaru/database";
import { SettingsForm } from "@/components/settings-form";
import { requireWorkspace } from "@/lib/workspace";
import { T } from "@/components/i18n";

export default async function SettingsPage() {
  const context = await requireWorkspace();
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: context.workspaceId }, select: { name: true, slug: true, department: true, companySize: true } });
  return <div className="settings-page"><header className="page-header"><div><span className="page-eyebrow"><T k="set.eyebrow" /></span><h1><T k="set.title" /></h1><p><T k="set.lead" /></p></div></header><div className="settings-layout"><SettingsForm workspace={workspace} /><aside className="settings-nav dashboard-panel"><a className="active" href="/app/settings"><T k="set.general" /></a><a href="/app/settings/security"><T k="set.security" /></a><a href="/app/settings/api-keys"><T k="set.apiKeys" /></a><a href="/app/settings/webhooks"><T k="set.webhooks" /></a></aside></div></div>;
}
