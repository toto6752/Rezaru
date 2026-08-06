import { getStripe } from "@/lib/stripe";
import { prisma } from "@outcomeos/database";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return Response.json({ error: { code: "BILLING_NOT_CONFIGURED", message: "Stripe webhook verification is not configured" } }, { status: 503 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return Response.json({ error: { code: "INVALID_SIGNATURE", message: "Stripe signature verification failed" } }, { status: 400 });
  }
  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const subscription = event.data.object as Stripe.Subscription;
    const workspaceId = subscription.metadata.workspaceId;
    if (workspaceId) {
      const priceId = subscription.items.data[0]?.price.id;
      const plan = subscription.metadata.plan === "TEAM" ? "TEAM" : "PRO";
      await prisma.subscription.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          plan: event.type === "customer.subscription.deleted" ? "FREE" : plan,
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end ? subscription.items.data[0].current_period_end * 1000 : Date.now()),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        },
        update: {
          plan: event.type === "customer.subscription.deleted" ? "FREE" : plan,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end ? subscription.items.data[0].current_period_end * 1000 : Date.now()),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      });
      await prisma.auditLog.create({ data: { workspaceId, action: `billing.${event.type}`, entityType: "Subscription", entityId: subscription.id } });
    }
  }
  return Response.json({ received: true });
}
