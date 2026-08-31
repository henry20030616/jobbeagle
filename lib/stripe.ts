import Stripe from 'stripe';
import {
  ACTIVE_CHECKOUT_PLAN_TYPES,
  normalizeCheckoutPlanType,
  type CheckoutPlanType,
} from '@/constants/checkout-plans';

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  priceIds: Partial<Record<CheckoutPlanType, string>>;
}

/** Resolve Stripe price ID; accepts canonical + legacy plan codes. */
export function resolveStripePriceId(planType: CheckoutPlanType): string | null {
  const canonical = normalizeCheckoutPlanType(planType) ?? planType;
  const map: Partial<Record<string, string | undefined>> = {
    single_job_fit_snapshot:
      process.env.STRIPE_PRICE_SINGLE_JOB_FIT_SNAPSHOT
      || process.env.STRIPE_PRICE_SINGLE_LITE,
    single_interview_strategy_guide:
      process.env.STRIPE_PRICE_SINGLE_INTERVIEW_STRATEGY_GUIDE
      || process.env.STRIPE_PRICE_SINGLE_FULL,
    single_lite: process.env.STRIPE_PRICE_SINGLE_LITE,
    single_full: process.env.STRIPE_PRICE_SINGLE_FULL,
    standard_subscription: process.env.STRIPE_PRICE_STANDARD_SUB,
    advanced_subscription: process.env.STRIPE_PRICE_ADVANCED_SUB,
  };
  const id = map[canonical] || map[planType];
  return id?.trim() ? id.trim() : null;
}

export function getStripeConfig(): StripeConfig | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) return null;

  const priceIds: Partial<Record<CheckoutPlanType, string>> = {};
  for (const planType of ACTIVE_CHECKOUT_PLAN_TYPES) {
    const id = resolveStripePriceId(planType);
    if (id) priceIds[planType] = id;
  }

  return {
    secretKey,
    publishableKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    priceIds,
  };
}

export function getMissingStripePriceIds(): string[] {
  const required: Array<{ plan: CheckoutPlanType; env: string }> = [
    { plan: 'single_job_fit_snapshot', env: 'STRIPE_PRICE_SINGLE_JOB_FIT_SNAPSHOT' },
    { plan: 'single_interview_strategy_guide', env: 'STRIPE_PRICE_SINGLE_INTERVIEW_STRATEGY_GUIDE' },
    { plan: 'standard_subscription', env: 'STRIPE_PRICE_STANDARD_SUB' },
    { plan: 'advanced_subscription', env: 'STRIPE_PRICE_ADVANCED_SUB' },
  ];

  const missing: string[] = [];
  for (const { plan, env } of required) {
    if (!resolveStripePriceId(plan)) {
      missing.push(env);
    }
  }
  return missing;
}

/** Get or create Stripe client */
export function getStripeClient(): Stripe | null {
  const config = getStripeConfig();
  if (!config) return null;
  return new Stripe(config.secretKey, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });
}

/** Verify Stripe webhook signature */
export function verifyStripeSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): Stripe.Event | null {
  if (!signature || !secret) return null;
  const stripe = getStripeClient();
  if (!stripe) return null;

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return null;
  }
}

interface CreateCheckoutParams {
  planType: CheckoutPlanType;
  priceId: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

/** Create Stripe Checkout Session */
export async function createStripeCheckoutSession(
  stripe: Stripe,
  params: CreateCheckoutParams,
): Promise<string> {
  const isSubscription = params.planType.includes('subscription');

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.email,
    metadata: params.metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });

  if (!session.url) {
    throw new Error('Stripe checkout session missing URL');
  }

  return session.url;
}

export type StripeSubscriptionSummary = {
  id: string;
  status: string;
  priceId: string | null;
  customerEmail: string | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  planType: CheckoutPlanType | null;
  membershipTier: 'standard_sub' | 'advanced_sub' | null;
};

export type StripeSubscriptionBillingView = {
  id: string;
  status: string;
  planType: CheckoutPlanType | null;
  membershipTier: 'standard_sub' | 'advanced_sub' | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  canCancel: boolean;
  canManage: boolean;
};

const LIVE_STRIPE_STATUSES = new Set([
  'active',
  'trialing',
  'past_due',
]);

/** Map a Stripe price id back to our checkout plan */
export function planTypeFromStripePriceId(priceId: string): CheckoutPlanType | null {
  const p = String(priceId).trim();
  if (!p) return null;
  for (const plan of ACTIVE_CHECKOUT_PLAN_TYPES) {
    const id = resolveStripePriceId(plan);
    if (id && id === p) return plan;
  }
  return null;
}

function membershipTierForPlan(
  plan: CheckoutPlanType | null,
): 'standard_sub' | 'advanced_sub' | null {
  if (plan === 'standard_subscription') return 'standard_sub';
  if (plan === 'advanced_subscription') return 'advanced_sub';
  return null;
}

export function parseStripeSubscription(sub: Stripe.Subscription): StripeSubscriptionSummary {
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const planType = priceId ? planTypeFromStripePriceId(priceId) : null;
  
  return {
    id: sub.id,
    status: sub.status,
    priceId,
    customerEmail: typeof sub.customer === 'string' ? null : sub.customer?.email ?? null,
    currentPeriodEnd: sub.current_period_end,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    planType,
    membershipTier: membershipTierForPlan(planType),
  };
}

export function isLiveStripeSubscription(sub: StripeSubscriptionSummary): boolean {
  return LIVE_STRIPE_STATUSES.has(sub.status) && Boolean(sub.membershipTier);
}

export function isInCancelGrace(
  sub: StripeSubscriptionSummary,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!sub.membershipTier) return false;
  if (!sub.cancelAtPeriodEnd) return false;
  if (!sub.currentPeriodEnd) return false;
  return sub.currentPeriodEnd > nowSeconds;
}

export function pickPreferredMonthlySubscription(
  subscriptions: StripeSubscriptionSummary[],
  predicate: (sub: StripeSubscriptionSummary) => boolean,
): StripeSubscriptionSummary | null {
  const matches = subscriptions.filter(
    (s) =>
      (s.membershipTier === 'standard_sub' || s.membershipTier === 'advanced_sub')
      && predicate(s),
  );
  return matches.find((s) => s.membershipTier === 'advanced_sub') ?? matches[0] ?? null;
}

/** Active / trialing / past_due Standard or Advanced — safe to cancel via API. */
export function pickCancellableStripeSubscription(
  subscriptions: StripeSubscriptionSummary[],
): StripeSubscriptionSummary | null {
  return pickPreferredMonthlySubscription(subscriptions, isLiveStripeSubscription);
}

/** Cancellable, or cancelled-but-still-in-period (billing portal still useful). */
export function pickManageableStripeSubscription(
  subscriptions: StripeSubscriptionSummary[],
  nowSeconds = Math.floor(Date.now() / 1000),
): StripeSubscriptionSummary | null {
  return (
    pickCancellableStripeSubscription(subscriptions)
    ?? pickPreferredMonthlySubscription(
      subscriptions,
      (s) => isInCancelGrace(s, nowSeconds) || s.status === 'canceled',
    )
  );
}

export function desiredMembershipFromStripeSubscriptions(
  subscriptions: StripeSubscriptionSummary[],
  nowSeconds = Math.floor(Date.now() / 1000),
): 'standard_sub' | 'advanced_sub' | 'free' {
  const live = pickCancellableStripeSubscription(subscriptions);
  if (live?.membershipTier) return live.membershipTier;
  const grace = pickPreferredMonthlySubscription(subscriptions, (s) =>
    isInCancelGrace(s, nowSeconds),
  );
  if (grace?.membershipTier) return grace.membershipTier;
  return 'free';
}

export function toStripeSubscriptionBillingView(
  sub: StripeSubscriptionSummary | null,
): StripeSubscriptionBillingView | null {
  if (!sub?.id) return null;
  return {
    id: sub.id,
    status: sub.status,
    planType: sub.planType,
    membershipTier: sub.membershipTier,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    canCancel: isLiveStripeSubscription(sub),
    canManage: sub.status !== 'canceled',
  };
}

/** List subscriptions for an email */
export async function listStripeSubscriptionsForEmail(
  stripe: Stripe,
  email: string,
): Promise<StripeSubscriptionSummary[]> {
  // First find customer by email
  const customers = await stripe.customers.list({
    email,
    limit: 10,
  });

  if (customers.data.length === 0) {
    return [];
  }

  // Get subscriptions for all customers with this email
  const allSubs: StripeSubscriptionSummary[] = [];
  
  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 25,
    });
    
    allSubs.push(...subs.data.map(parseStripeSubscription));
  }

  return allSubs;
}

/** Retrieve a single subscription */
export async function retrieveStripeSubscription(
  stripe: Stripe,
  subscriptionId: string,
): Promise<StripeSubscriptionSummary> {
  const id = subscriptionId.trim();
  if (!id) throw new Error('Missing Stripe subscription id');
  
  const sub = await stripe.subscriptions.retrieve(id);
  return parseStripeSubscription(sub);
}

/** Cancel at period end. Access continues until current_period_end. */
export async function cancelStripeSubscription(
  stripe: Stripe,
  subscriptionId: string,
): Promise<StripeSubscriptionSummary> {
  const id = subscriptionId.trim();
  if (!id) throw new Error('Missing Stripe subscription id');
  
  const sub = await stripe.subscriptions.update(id, {
    cancel_at_period_end: true,
  });
  
  return parseStripeSubscription(sub);
}

/** Create Stripe billing portal session */
export async function createStripeBillingPortalSession(
  stripe: Stripe,
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}
