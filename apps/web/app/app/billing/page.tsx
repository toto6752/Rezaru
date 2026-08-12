import { prisma } from "@rezaru/database";
import { BillingPlans } from "@/components/billing-plans";
import { requireWorkspace } from "@/lib/workspace";
import { T } from "@/components/i18n";
import { BackLink } from "@/components/back-link";

export default async function BillingPage() {
  const context = await requireWorkspace();
  const subscription = await prisma.subscription.findUnique({ where: { workspaceId: context.workspaceId } });
  return <div className="billing-page"><BackLink href="/app/settings" labelKey="set.back" /><header className="page-header"><div><span className="page-eyebrow"><T k="bill.eyebrow" /></span><h1><T k="bill.title" /></h1><p><T k="bill.lead" /></p></div></header><BillingPlans currentPlan={subscription?.plan ?? "FREE"} developmentMode={!process.env.STRIPE_SECRET_KEY} /></div>;
}
