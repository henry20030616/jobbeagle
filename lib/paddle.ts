import { Paddle } from '@paddle/paddle-node-sdk';
import crypto from 'crypto';
import {
  ACTIVE_CHECKOUT_PLAN_TYPES,
  normalizeCheckoutPlanType,
  type CheckoutPlanType,
} from '@/constants/checkout-plans';

export interface PaddleConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  webhookSecret: string;
  priceIds: Partial<Record<CheckoutPlanType, string>>;
}

/** Resolve Paddle price ID; accepts canonical + legacy plan codes. */
export function resolvePaddlePriceId(planType: CheckoutPlanType): string | null {
  const canonical = normalizeCheckoutPlanType(planType) ?? planType;
  const map: Partial<Record<string, string | undefined>> = {
    single_job_fit_snapshot:
      process.env.PADDLE_PRICE_SINGLE_JOB_FIT_SNAPSHOT
      || process.env.PADDLE_PRICE_SINGLE_LITE,
    single_interview_strategy_guide:
      process.env.PADDLE_PRICE_SINGLE_INTERVIEW_STRATEGY_GUIDE
      || process.env.PADDLE_PRICE_SINGLE_FULL,
    single_lite: process.env.PADDLE_PRICE_SINGLE_LITE,
    single_full: process.env.PADDLE_PRICE_SINGLE_FULL,
    standard_subscription: process.env.PADDLE_PRICE_STANDARD_SUB,
    advanced_subscription: process.env.PADDLE_PRICE_ADVANCED_SUB,
  };
  const id = map[canonical] || map[planType];
  return id?.trim() ? id.trim() : null;
}

export function getPaddleConfig(): PaddleConfig | null {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) return null;

  const environment = process.env.PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

  const priceIds: Partial<Record<CheckoutPlanType, string>> = {};
  for (const planType of ACTIVE_CHECKOUT_PLAN_TYPES) {
    const id = resolvePaddlePriceId(planType);
    if (id) priceIds[planType] = id;
  }

  return {
    apiKey,
    environment,
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? '',
    priceIds,
  };
}

export function getMissingPaddlePriceIds(): string[] {
  const required: Array<{ plan: CheckoutPlanType; env: string }> = [
    { plan: 'single_job_fit_snapshot', env: 'PADDLE_PRICE_SINGLE_JOB_FIT_SNAPSHOT' },
    { plan: 'single_interview_strategy_guide', env: 'PADDLE_PRICE_SINGLE_INTERVIEW_STRATEGY_GUIDE' },
    { plan: 'standard_subscription', env: 'PADDLE_PRICE_STANDARD_SUB' },
    { plan: 'advanced_subscription', env: 'PADDLE_PRICE_ADVANCED_SUB' },
  ];

  const missing: string[] = [];
  for (const { plan, env } of required) {
    if (!resolvePaddlePriceId(plan)) {
      missing.push(env);
    }
  }
  return missing;
}

/** Get or create Paddle client */
export function getPaddleClient(): Paddle | null {
  const config = getPaddleConfig();
  if (!config) return null;
  // Type assertion to work around SDK type limitations
  return new Paddle(config.apiKey, {
    environment: config.environment as any,
  });
}

/** Verify Paddle webhook signature */
export function verifyPaddleSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  try {
    // Paddle signature format: ts=<timestamp>;h1=<signature>
    const parts = signature.split(';');
    const tsMatch = parts[0]?.match(/^ts=(\d+)$/);
    const h1Match = parts[1]?.match(/^h1=(.+)$/);

    if (!tsMatch || !h1Match) return false;

    const timestamp = tsMatch[1];
    const receivedSignature = h1Match[1];

    // Create payload string: ts:body
    const payload = `${timestamp}:${rawBody}`;

    // Compute HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature),
    );
  } catch {
    return false;
  }
}

interface CreateCheckoutParams {
  planType: CheckoutPlanType;
  priceId: string;
  email?: string;
  successUrl: string;
  metadata: Record<string, string>;
}

/** Create Paddle Checkout (transaction) */
export async function createPaddleCheckout(
  paddle: Paddle,
  params: CreateCheckoutParams,
): Promise<string> {
  // Paddle SDK requires specific structure
  const transactionRequest: any = {
    items: [
      {
        priceId: params.priceId,
        quantity: 1,
      },
    ],
    customData: params.metadata,
    checkoutSettings: {
      successUrl: params.successUrl,
    },
  };

  // Only add customerEmail if provided
  if (params.email) {
    transactionRequest.customerEmail = params.email;
  }

  const response: any = await paddle.transactions.create(transactionRequest);

  if (!response?.checkoutUrl) {
    throw new Error('Paddle checkout missing URL');
  }

  return response.checkoutUrl;
}

export type PaddleSubscriptionSummary = {
  id: string;
  status: string;
  priceId: string | null;
  customerEmail: string | null;
  currentBillingPeriodEndsAt: string | null;
  scheduledChange: {
    action: string;
    effectiveAt: string;
  } | null;
  planType: CheckoutPlanType | null;
  membershipTier: 'standard_sub' | 'advanced_sub' | null;
};

export type PaddleSubscriptionBillingView = {
  id: string;
  status: string;
  planType: CheckoutPlanType | null;
  membershipTier: 'standard_sub' | 'advanced_sub' | null;
  currentBillingPeriodEndsAt: string | null;
  scheduledForCancellation: boolean;
  canCancel: boolean;
  canManage: boolean;
};

const LIVE_PADDLE_STATUSES = new Set([
  'active',
  'trialing',
  'past_due',
]);

/** Map a Paddle price id back to our checkout plan */
export function planTypeFromPaddlePriceId(priceId: string): CheckoutPlanType | null {
  const p = String(priceId).trim();
  if (!p) return null;
  for (const plan of ACTIVE_CHECKOUT_PLAN_TYPES) {
    const id = resolvePaddlePriceId(plan);
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

export function parsePaddleSubscription(sub: any): PaddleSubscriptionSummary {
  const priceId = sub.items?.[0]?.price?.id ?? null;
  const planType = priceId ? planTypeFromPaddlePriceId(priceId) : null;

  return {
    id: sub.id,
    status: sub.status,
    priceId,
    customerEmail: sub.customerId ? null : sub.customerEmail ?? null,
    currentBillingPeriodEndsAt: sub.currentBillingPeriod?.endsAt ?? null,
    scheduledChange: sub.scheduledChange ?? null,
    planType,
    membershipTier: membershipTierForPlan(planType),
  };
}

export function isLivePaddleSubscription(sub: PaddleSubscriptionSummary): boolean {
  return LIVE_PADDLE_STATUSES.has(sub.status) && Boolean(sub.membershipTier);
}

export function isInCancelGrace(
  sub: PaddleSubscriptionSummary,
  nowIso = new Date().toISOString(),
): boolean {
  if (!sub.membershipTier) return false;
  if (!sub.scheduledChange || sub.scheduledChange.action !== 'cancel') return false;
  if (!sub.currentBillingPeriodEndsAt) return false;
  return sub.currentBillingPeriodEndsAt > nowIso;
}

export function pickPreferredMonthlySubscription(
  subscriptions: PaddleSubscriptionSummary[],
  predicate: (sub: PaddleSubscriptionSummary) => boolean,
): PaddleSubscriptionSummary | null {
  const matches = subscriptions.filter(
    (s) =>
      (s.membershipTier === 'standard_sub' || s.membershipTier === 'advanced_sub')
      && predicate(s),
  );
  return matches.find((s) => s.membershipTier === 'advanced_sub') ?? matches[0] ?? null;
}

/** Active / trialing / past_due Standard or Advanced — safe to cancel via API. */
export function pickCancellablePaddleSubscription(
  subscriptions: PaddleSubscriptionSummary[],
): PaddleSubscriptionSummary | null {
  return pickPreferredMonthlySubscription(subscriptions, isLivePaddleSubscription);
}

/** Cancellable, or cancelled-but-still-in-period (billing portal still useful). */
export function pickManageablePaddleSubscription(
  subscriptions: PaddleSubscriptionSummary[],
  nowIso = new Date().toISOString(),
): PaddleSubscriptionSummary | null {
  return (
    pickCancellablePaddleSubscription(subscriptions)
    ?? pickPreferredMonthlySubscription(
      subscriptions,
      (s) => isInCancelGrace(s, nowIso) || s.status === 'canceled',
    )
  );
}

export function desiredMembershipFromPaddleSubscriptions(
  subscriptions: PaddleSubscriptionSummary[],
  nowIso = new Date().toISOString(),
): 'standard_sub' | 'advanced_sub' | 'free' {
  const live = pickCancellablePaddleSubscription(subscriptions);
  if (live?.membershipTier) return live.membershipTier;
  const grace = pickPreferredMonthlySubscription(subscriptions, (s) =>
    isInCancelGrace(s, nowIso),
  );
  if (grace?.membershipTier) return grace.membershipTier;
  return 'free';
}

export function toPaddleSubscriptionBillingView(
  sub: PaddleSubscriptionSummary | null,
): PaddleSubscriptionBillingView | null {
  if (!sub?.id) return null;
  return {
    id: sub.id,
    status: sub.status,
    planType: sub.planType,
    membershipTier: sub.membershipTier,
    currentBillingPeriodEndsAt: sub.currentBillingPeriodEndsAt,
    scheduledForCancellation: Boolean(
      sub.scheduledChange?.action === 'cancel',
    ),
    canCancel: isLivePaddleSubscription(sub),
    canManage: sub.status !== 'canceled',
  };
}

/** List subscriptions for an email */
export async function listPaddleSubscriptionsForEmail(
  paddle: Paddle,
  email: string,
): Promise<PaddleSubscriptionSummary[]> {
  try {
    // Search for customer by email
    const customersResponse: any = await paddle.customers.list({
      email: [email] as any, // Paddle expects string[] for email filter
    });

    const customers = customersResponse?.data ?? [];
    if (customers.length === 0) {
      return [];
    }

    // Get subscriptions for all customers with this email
    const allSubs: PaddleSubscriptionSummary[] = [];

    for (const customer of customers) {
      const subsResponse: any = await paddle.subscriptions.list({
        customerId: customer.id as any,
      });

      const subs = subsResponse?.data ?? [];
      allSubs.push(...subs.map(parsePaddleSubscription));
    }

    return allSubs;
  } catch (error) {
    console.error('Error listing Paddle subscriptions:', error);
    return [];
  }
}

/** Retrieve a single subscription */
export async function retrievePaddleSubscription(
  paddle: Paddle,
  subscriptionId: string,
): Promise<PaddleSubscriptionSummary> {
  const id = subscriptionId.trim();
  if (!id) throw new Error('Missing Paddle subscription id');

  const response: any = await paddle.subscriptions.get(id);
  return parsePaddleSubscription(response);
}

/** Cancel at period end. Access continues until current_billing_period_ends_at. */
export async function cancelPaddleSubscription(
  paddle: Paddle,
  subscriptionId: string,
): Promise<PaddleSubscriptionSummary> {
  const id = subscriptionId.trim();
  if (!id) throw new Error('Missing Paddle subscription id');

  const response: any = await paddle.subscriptions.cancel(id, {
    effectiveFrom: 'next_billing_period' as any,
  });

  return parsePaddleSubscription(response);
}

/** Get Paddle customer portal URL */
export function getPaddleCustomerPortalUrl(
  environment: 'sandbox' | 'production',
): string {
  const baseUrl =
    environment === 'production'
      ? 'https://customer-portal.paddle.com'
      : 'https://sandbox-customer-portal.paddle.com';
  
  return baseUrl;
}
