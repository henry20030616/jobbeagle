import Stripe from 'stripe';
import type { CheckoutPlanType } from '@/constants/checkout-plans';
import { CHECKOUT_PLANS } from '@/constants/checkout-plans';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: Stripe.API_VERSION });
  }
  return stripeClient;
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

function priceIdForPlan(planType: CheckoutPlanType): string | null {
  const map: Partial<Record<CheckoutPlanType, string | undefined>> = {
    single_lite: process.env.STRIPE_PRICE_SINGLE_LITE,
    single_full: process.env.STRIPE_PRICE_SINGLE_FULL,
    standard_subscription: process.env.STRIPE_PRICE_STANDARD_SUB,
    advanced_subscription: process.env.STRIPE_PRICE_ADVANCED_SUB,
  };
  return map[planType] ?? null;
}

export interface CreateCheckoutParams {
  planType: CheckoutPlanType;
  userId: string;
  userEmail: string;
  orderId: string;
  reportId?: string | null;
  successUrl: string;
  cancelUrl: string;
  customerId?: string | null;
}

export async function createStripeCheckoutSession(
  params: CreateCheckoutParams,
): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  const plan = CHECKOUT_PLANS[params.planType];
  const priceId = priceIdForPlan(params.planType);

  const metadata = {
    order_id: params.orderId,
    user_id: params.userId,
    plan_type: params.planType,
    report_id: params.reportId ?? '',
  };

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: plan.isSubscription ? 'subscription' : 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.userId,
    metadata,
    customer_email: params.customerId ? undefined : params.userEmail,
    customer: params.customerId ?? undefined,
  };

  if (priceId) {
    sessionParams.line_items = [{ price: priceId, quantity: 1 }];
  } else {
    sessionParams.line_items = [
      {
        price_data: {
          currency: 'usd',
          unit_amount: plan.amountCents,
          product_data: {
            name: plan.labelEn,
          },
          ...(plan.isSubscription
            ? { recurring: { interval: 'month' } }
            : {}),
        },
        quantity: 1,
      },
    ];
  }

  if (plan.isSubscription) {
    sessionParams.subscription_data = { metadata };
  } else {
    sessionParams.payment_intent_data = { metadata };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  if (!session.url) throw new Error('Stripe session missing URL');

  return { url: session.url, sessionId: session.id };
}

export function verifyStripeWebhook(
  payload: string,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  const secret = getStripeWebhookSecret();
  if (!stripe || !secret) throw new Error('Stripe webhook not configured');
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
