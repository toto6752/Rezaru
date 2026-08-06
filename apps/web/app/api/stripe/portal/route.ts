import { withApi } from "@/lib/api";
import { getStripe } from "@/lib/stripe";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";

export async function POST() {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "manageBilling");
    const stripe = getStripe();
    const subscription = await prisma.subscription.findUnique({ where: { workspaceId: context.workspaceId } });
    if (!stripe || !subscription?.stripeCustomerId) {
      return { developmentMode: true, message: "The Stripe customer portal is unavailable in development billing mode." };
    }
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/app/billing`
    });
    return { developmentMode: false, url: portal.url };
  });
}
