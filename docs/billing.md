# Billing configuration

OutcomeOS uses Stripe Checkout, the customer portal, subscription webhooks, server-side plan enforcement, and usage records.

Create monthly and annual recurring prices for Pro and Team, then configure:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_ANNUAL`
- `STRIPE_PRICE_TEAM_MONTHLY`
- `STRIPE_PRICE_TEAM_ANNUAL`

Send `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted` to `/api/stripe/webhook`.

Without a Stripe key, the billing page is clearly labeled Development billing mode. Plan selection updates local limits without creating a customer or charge.

Limits are enforced before creating executions or activating additional outcomes. At 70%, 90%, and 100%, the UI changes usage state. Reaching a limit pauses excess work; it never deletes outcomes.
