import { redirect } from "next/navigation";

export default async function OutcomeExecutionsPage({ params }: { params: Promise<{ outcomeId: string }> }) {
  const { outcomeId } = await params;
  redirect(`/app/executions?outcomeId=${encodeURIComponent(outcomeId)}`);
}
