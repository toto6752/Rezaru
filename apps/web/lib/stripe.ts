import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe | undefined {
  if (!process.env.STRIPE_SECRET_KEY) return undefined;
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY, { appInfo: { name: "Rezaru", version: "0.1.0" } });
  return stripeClient;
}

export function stripePrice(plan: "PRO" | "TEAM", interval: "monthly" | "annual"): string | undefined {
  return process.env[`STRIPE_PRICE_${plan}_${interval.toUpperCase()}`];
}
