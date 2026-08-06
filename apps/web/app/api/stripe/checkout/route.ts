import { withApi } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { getStripe, stripePrice } from "@/lib/stripe";
import { assertPermission, requireWorkspace } from "@/lib/workspace";
import { prisma } from "@outcomeos/database";
import { z } from "zod";

const schema = z.object({ plan: z.enum(["PRO", "TEAM"]), interval: z.enum(["monthly", "annual"]) });

export async function POST(request: Request) {
  return withApi(async () => {
    const context = await requireWorkspace();
    assertPermission(context, "manageBilling");
    const input = schema.parse(await request.json());
    const stripe = getStripe();
    if (!stripe) {
      await prisma.subscription.upsert({
        where: { workspaceId: context.workspaceId },
        create: { workspaceId: context.workspaceId, plan: input.plan, status: "development" },
        update: { plan: input.plan, status: "development" }
      });
      await writeAuditLog({ workspaceId: context.workspaceId, actorId: context.userId, action: "billing.development_plan_changed", entityType: "Subscription", metadata: input });
      return { developmentMode: true, plan: input.plan, message: "Development billing mode updated the local plan. No charge was created." };
    }
    const priceId = stripePrice(input.plan, input.interval);
    if (!priceId) throw Object.assign(new Error(`Stripe price for ${input.plan} ${input.interval} is not configured`), { status: 503, code: "BILLING_NOT_CONFIGURED" });
    let subscription = await prisma.subscription.findUnique({ where: { workspaceId: context.workspaceId } });
    let customerId = subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ name: context.workspaceName, metadata: { workspaceId: context.workspaceId } });
      customerId = customer.id;
      subscription = await prisma.subscription.upsert({
        where: { workspaceId: context.workspaceId },
        create: { workspaceId: context.workspaceId, plan: "FREE", stripeCustomerId: customerId, status: "incomplete" },
        update: { stripeCustomerId: customerId }
      });
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/app/billing?checkout=success`,
      cancel_url: `${baseUrl}/app/billing?checkout=cancelled`,
      subscription_data: { metadata: { workspaceId: context.workspaceId, plan: input.plan } },
      metadata: { workspaceId: context.workspaceId, plan: input.plan }
    });
    return { developmentMode: false, url: session.url };
  });
}
