import { OnboardingForm } from "@/components/onboarding-form";
import { requireWorkspace } from "@/lib/workspace";

export default async function OnboardingPage() {
  const context = await requireWorkspace();
  return <OnboardingForm workspaceName={context.workspaceName} />;
}
