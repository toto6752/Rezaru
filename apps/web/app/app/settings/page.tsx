import { prisma } from "@rezaru/database";
import { SettingsForm } from "@/components/settings-form";
import { requireWorkspace } from "@/lib/workspace";
import { T } from "@/components/i18n";
import { SettingsNav } from "@/components/settings-nav";

export default async function SettingsPage() {
  const context = await requireWorkspace();
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: context.workspaceId }, select: { name: true, slug: true, department: true, companySize: true } });
  return <div className="settings-page"><header className="page-header"><div><span className="page-eyebrow"><T k="set.eyebrow" /></span><h1><T k="set.title" /></h1><p><T k="set.lead" /></p></div></header><div className="settings-layout"><SettingsForm workspace={workspace} /><SettingsNav /></div></div>;
}
