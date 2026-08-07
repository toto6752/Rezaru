import { prisma } from "@rezaru/database";
import { SettingsForm } from "@/components/settings-form";
import { requireWorkspace } from "@/lib/workspace";

export default async function SettingsPage() {
  const context = await requireWorkspace();
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: context.workspaceId }, select: { name: true, slug: true, department: true, companySize: true } });
  return <div className="settings-page"><header className="page-header"><div><span className="page-eyebrow">WORKSPACE CONFIGURATION</span><h1>Settings</h1><p>Manage workspace identity and default operational preferences.</p></div></header><div className="settings-layout"><SettingsForm workspace={workspace} /><aside className="settings-nav dashboard-panel"><a className="active" href="/app/settings">General</a><a href="/app/settings/security">Security & audit</a><a href="/app/settings/api-keys">API keys</a><a href="/app/settings/webhooks">Webhooks</a></aside></div></div>;
}
