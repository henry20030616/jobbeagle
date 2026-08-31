import { Environment, Paddle, type Subscription } from '@paddle/paddle-node-sdk';
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
  return new Paddle(config.apiKey, {
    environment:
      config.environment === 'production' ? Environment.production : Environment.sandbox,
  });
}

/** Reject webhook replays older than 5 minutes (Paddle SDK default of 5s is too tight for serverless). */
export const PADDLE_WEBHOOK_MAX_AGE_SEC = 300;

function parsePaddleSignatureHeader(
  signature: string,
): { ts: number; hashes: string[] } | null {
  let ts: number | null = null;
  const hashes: string[] = [];
  for (const part of signature.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!value) continue;
    if (key === 'ts') {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed)) ts = parsed;
    } else if (key === 'h1') {
      hashes.push(value);
    }
  }
  if (ts === null || hashes.length === 0) return null;
  return { ts, hashes };
}

/** Verify Paddle webhook signature and reject stale timestamps. */
export function verifyPaddleSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
): boolean {
  if (!signature || !secret) return false;

  try {
    const parsed = parsePaddleSignatureHeader(signature);
    if (!parsed) return false;
    if (Math.abs(nowSec - parsed.ts) > PADDLE_WEBHOOK_MAX_AGE_SEC) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${parsed.ts}:${rawBody}`)
      .digest('hex');
    const expected = Buffer.from(expectedSignature);

    return parsed.hashes.some((receivedSignature) => {
      const received = Buffer.from(receivedSignature);
      return received.length === expected.length && crypto.timingSafeEqual(expected, received);
    });
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
  const transaction = await paddle.transactions.create({
    items: [{ priceId: params.priceId, quantity: 1 }],
    customData: {
      ...params.metadata,
      ...(params.email ? { customer_email: params.email } : {}),
      success_url: params.successUrl,
    },
  });

  const checkoutUrl = transaction.checkout?.url;
  if (!checkoutUrl) {
    throw new Error('Paddle checkout missing URL');
  }

  return checkoutUrl;
}

export type PaddleSubscriptionSummary = {
  id: string;
  status: string;
  priceId: string | null;
  customerId: string | null;
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

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function parsePaddleSubscription(
  sub: Subscription | Record<string, unknown>,
): PaddleSubscriptionSummary {
  const record = asRecord(sub);
  const items = Array.isArray(record.items) ? record.items : [];
  const firstItem = asRecord(items[0]);
  const price = asRecord(firstItem.price);
  const priceId = readString(price.id);
  const period = asRecord(record.currentBillingPeriod ?? record.current_billing_period);
  const change = asRecord(record.scheduledChange ?? record.scheduled_change);
  const action = readString(change.action);
  const effectiveAt = readString(change.effectiveAt ?? change.effective_at);
  const planType = priceId ? planTypeFromPaddlePriceId(priceId) : null;

  return {
    id: readString(record.id) ?? '',
    status: readString(record.status) ?? '',
    priceId,
    customerId: readString(record.customerId ?? record.customer_id),
    customerEmail: readString(record.customerEmail ?? record.customer_email),
    currentBillingPeriodEndsAt: readString(period.endsAt ?? period.ends_at),
    scheduledChange: action && effectiveAt ? { action, effectiveAt } : null,
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
    const customers = await paddle.customers.list({
      email: [email],
      perPage: 25,
    }).next();

    const allSubs: PaddleSubscriptionSummary[] = [];
    for (const customer of customers) {
      const subs = await paddle.subscriptions.list({
        customerId: [customer.id],
        perPage: 25,
      }).next();
      allSubs.push(...subs.map((row) => parsePaddleSubscription(row)));
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
  return parsePaddleSubscription(await paddle.subscriptions.get(id));
}

/** Cancel at period end. Access continues until current_billing_period_ends_at. */
export async function cancelPaddleSubscription(
  paddle: Paddle,
  subscriptionId: string,
): Promise<PaddleSubscriptionSummary> {
  const id = subscriptionId.trim();
  if (!id) throw new Error('Missing Paddle subscription id');
  return parsePaddleSubscription(
    await paddle.subscriptions.cancel(id, { effectiveFrom: 'next_billing_period' }),
  );
}

/** Authenticated Paddle customer portal session for one subscription. */
export async function createPaddleCustomerPortalUrl(
  paddle: Paddle,
  customerId: string,
  subscriptionId: string,
): Promise<string> {
  const session = await paddle.customerPortalSessions.create(customerId, [subscriptionId]);
  const url = session.urls.general.overview;
  if (!url) throw new Error('Paddle customer portal missing URL');
  return url;
}

/** Fallback generic portal host (not signed-in). Prefer createPaddleCustomerPortalUrl. */
export function getPaddleCustomerPortalUrl(
  environment: 'sandbox' | 'production',
): string {
  return environment === 'production'
    ? 'https://customer-portal.paddle.com'
    : 'https://sandbox-customer-portal.paddle.com';
}
