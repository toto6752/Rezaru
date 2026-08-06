import { prisma } from "@outcomeos/database";
import { BillingPlans } from "@/components/billing-plans";
import { requireWorkspace } from "@/lib/workspace";

export default async function BillingPage() {
  const context = await requireWorkspace();
  const subscription = await prisma.subscription.findUnique({ where: { workspaceId: context.workspaceId } });
  return <div className="billing-page"><header className="page-header"><div><span className="page-eyebrow">PLAN & BILLING</span><h1>Billing</h1><p>Choose the operating capacity your workspace needs.</p></div></header><BillingPlans currentPlan={subscription?.plan ?? "FREE"} developmentMode={!process.env.STRIPE_SECRET_KEY} /></div>;
}
