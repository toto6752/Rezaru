import { OutcomeComposer } from "@/components/outcome-composer";

export default async function NewOutcomePage({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  const { prompt } = await searchParams;
  return <OutcomeComposer initialPrompt={prompt ?? ""} />;
}
