import type { CompilationResult } from "@outcomeos/workflow-schema";
import { prisma } from "@outcomeos/database";
import { notFound } from "next/navigation";
import { OutcomeComposer } from "@/components/outcome-composer";
import { requireWorkspace } from "@/lib/workspace";

export default async function EditOutcomePage({ params }: { params: Promise<{ outcomeId: string }> }) {
  const context = await requireWorkspace();
  const { outcomeId } = await params;
  const outcome = await prisma.outcome.findFirst({
    where: { id: outcomeId, workspaceId: context.workspaceId, deletedAt: null },
    include: { workflowVersions: { orderBy: { version: "desc" }, take: 1 } }
  });
  if (!outcome || !outcome.workflowVersions[0]) notFound();
  return <OutcomeComposer initialPrompt={outcome.description} initialCompilation={outcome.workflowVersions[0].explanation as unknown as CompilationResult} />;
}
