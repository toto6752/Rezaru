import { prisma } from "@rezaru/database";
import { TemplateLibrary } from "@/components/template-library";
import { requireWorkspace } from "@/lib/workspace";

export default async function TemplatesPage() {
  const context = await requireWorkspace();
  const templates = await prisma.outcomeTemplate.findMany({
    where: { published: true, OR: [{ workspaceId: null }, { workspaceId: context.workspaceId }] },
    orderBy: [{ department: "asc" }, { title: "asc" }]
  });
  return <TemplateLibrary templates={templates as never} />;
}
