import { createHmac, timingSafeEqual } from 'crypto';
import {
  ACTIVE_CHECKOUT_PLAN_TYPES,
  normalizeCheckoutPlanType,
  type CheckoutPlanType,
} from '@/constants/checkout-plans';

export interface LemonSqueezyConfig {
  apiKey: string;
  storeId: string;
  webhookSecret: string;
  variantIds: Partial<Record<CheckoutPlanType, string>>;
}

/** Resolve variant ID; accepts canonical + legacy plan codes. */
export function resolveLemonSqueezyVariant(planType: CheckoutPlanType): string | null {
  const canonical = normalizeCheckoutPlanType(planType) ?? planType;
  const map: Partial<Record<string, string | undefined>> = {
    single_job_fit_snapshot:
      process.env.LEMONSQUEEZY_VARIANT_SINGLE_JOB_FIT_SNAPSHOT
      || process.env.LEMONSQUEEZY_VARIANT_SINGLE_LITE
      || process.env.LEMONSQUEEZY_VARIANT_BASIC_OVERAGE,
    single_interview_strategy_guide:
      process.env.LEMONSQUEEZY_VARIANT_SINGLE_INTERVIEW_STRATEGY_GUIDE
      || process.env.LEMONSQUEEZY_VARIANT_SINGLE_FULL,
    single_lite:
      process.env.LEMONSQUEEZY_VARIANT_SINGLE_LITE
      || process.env.LEMONSQUEEZY_VARIANT_BASIC_OVERAGE,
    single_full: process.env.LEMONSQUEEZY_VARIANT_SINGLE_FULL,
    standard_subscription: process.env.LEMONSQUEEZY_VARIANT_STANDARD_SUB,
    advanced_subscription: process.env.LEMONSQUEEZY_VARIANT_ADVANCED_SUB,
    basic_overage: process.env.LEMONSQUEEZY_VARIANT_BASIC_OVERAGE,
    premium_report: process.env.LEMONSQUEEZY_VARIANT_PREMIUM_REPORT,
    monthly_subscription: process.env.LEMONSQUEEZY_VARIANT_MONTHLY,
  };
  const id = map[canonical] || map[planType];
  return id?.trim() ? id.trim() : null;
}

export function getLemonSqueezyConfig(): LemonSqueezyConfig | null {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!apiKey || !storeId) return null;

  const variantIds: Partial<Record<CheckoutPlanType, string>> = {};
  for (const planType of ACTIVE_CHECKOUT_PLAN_TYPES) {
    const id = resolveLemonSqueezyVariant(planType);
    if (id) variantIds[planType] = id;
  }

  return {
    apiKey,
    storeId,
    webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? '',
    variantIds,
  };
}

export function getMissingLemonSqueezyVariants(): string[] {
  const required: Array<{ plan: CheckoutPlanType; env: string; fallback?: string }> = [
    {
      plan: 'single_job_fit_snapshot',
      env: 'LEMONSQUEEZY_VARIANT_SINGLE_JOB_FIT_SNAPSHOT',
      fallback: 'LEMONSQUEEZY_VARIANT_SINGLE_LITE or LEMONSQUEEZY_VARIANT_BASIC_OVERAGE',
    },
    {
      plan: 'single_interview_strategy_guide',
      env: 'LEMONSQUEEZY_VARIANT_SINGLE_INTERVIEW_STRATEGY_GUIDE',
      fallback: 'LEMONSQUEEZY_VARIANT_SINGLE_FULL',
    },
    { plan: 'standard_subscription', env: 'LEMONSQUEEZY_VARIANT_STANDARD_SUB' },
    { plan: 'advanced_subscription', env: 'LEMONSQUEEZY_VARIANT_ADVANCED_SUB' },
  ];

  const missing: string[] = [];
  for (const { plan, env, fallback } of required) {
    if (!resolveLemonSqueezyVariant(plan)) {
      missing.push(fallback ? `${env} (or ${fallback})` : env);
    }
  }
  return missing;
}

export function verifyLemonSqueezySignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

interface CreateCheckoutParams {
  planType: CheckoutPlanType;
  variantId: string;
  storeId: string;
  email?: string;
  redirectUrl: string;
  custom: Record<string, string>;
  testMode: boolean;
}

export async function createLemonSqueezyCheckout(
  apiKey: string,
  params: CreateCheckoutParams,
): Promise<string> {
  const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          test_mode: params.testMode,
          checkout_data: {
            email: params.email,
            custom: params.custom,
          },
          product_options: {
            redirect_url: params.redirectUrl,
          },
          checkout_options: {
            embed: false,
            logo: true,
            desc: true,
            discount: true,
            dark: true,
          },
        },
        relationships: {
          store: {
            data: { type: 'stores', id: String(params.storeId) },
          },
          variant: {
            data: { type: 'variants', id: String(params.variantId) },
          },
        },
      },
    }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail =
      json?.errors?.[0]?.detail
      ?? json?.errors?.[0]?.title
      ?? `Lemon Squeezy API ${res.status}`;
    throw new Error(detail);
  }

  const url = json?.data?.attributes?.url as string | undefined;
  if (!url) {
    throw new Error('Lemon Squeezy checkout missing URL');
  }
  return url;
}

export type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string>;
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      first_order_item?: { order_id?: number };
      user_email?: string;
      variant_id?: number | string;
      ends_at?: string | null;
      cancelled?: boolean;
    };
  };
};

export function getWebhookCustomData(payload: LemonWebhookPayload): Record<string, string> {
  return payload.meta?.custom_data ?? {};
}

export type LemonSubscriptionApiRow = {
  id?: string;
  attributes?: {
    status?: string;
    variant_id?: number | string;
    user_email?: string;
    renews_at?: string | null;
    ends_at?: string | null;
    cancelled?: boolean;
    urls?: {
      customer_portal?: string | null;
      update_payment_method?: string | null;
    };
  };
};

export type LemonSubscriptionSummary = {
  id: string;
  status: string;
  variantId: string;
  userEmail: string | null;
  renewsAt: string | null;
  endsAt: string | null;
  cancelled: boolean;
  customerPortalUrl: string | null;
  planType: CheckoutPlanType | null;
  membershipTier: 'standard_sub' | 'advanced_sub' | null;
};

export type LemonSubscriptionBillingView = {
  id: string;
  status: string;
  planType: CheckoutPlanType | null;
  membershipTier: 'standard_sub' | 'advanced_sub' | null;
  renewsAt: string | null;
  endsAt: string | null;
  cancelled: boolean;
  canCancel: boolean;
  canManage: boolean;
};

const LIVE_LEMON_STATUSES = new Set([
  'active',
  'on_trial',
  'paused',
  'past_due',
  'unpaid',
]);

function lemonErrorDetail(json: unknown, status: number): string {
  if (json && typeof json === 'object' && 'errors' in json) {
    const errors = (json as { errors?: Array<{ detail?: string; title?: string }> }).errors;
    const first = errors?.[0];
    return first?.detail ?? first?.title ?? `Lemon Squeezy API ${status}`;
  }
  return `Lemon Squeezy API ${status}`;
}

async function lemonFetchJson(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  const method = init?.method ?? 'GET';
  const res = await fetch(`https://api.lemonsqueezy.com/v1${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
      ...(method !== 'GET' ? { 'Content-Type': 'application/vnd.api+json' } : {}),
      ...init?.headers,
    },
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(lemonErrorDetail(json, res.status));
  }
  return json;
}

/** Map a Lemon variant id back to our checkout plan (subs only for sync). */
export function planTypeFromLemonVariantId(variantId: string): CheckoutPlanType | null {
  const v = String(variantId).trim();
  if (!v) return null;
  for (const plan of ACTIVE_CHECKOUT_PLAN_TYPES) {
    const id = resolveLemonSqueezyVariant(plan);
    if (id && id === v) return plan;
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

export function parseLemonSubscriptionRow(row: LemonSubscriptionApiRow): LemonSubscriptionSummary {
  const variantId = String(row.attributes?.variant_id ?? '');
  const planType = planTypeFromLemonVariantId(variantId);
  const status = String(row.attributes?.status ?? '');
  const cancelled = Boolean(row.attributes?.cancelled) || status === 'cancelled';
  const portal = row.attributes?.urls?.customer_portal;
  return {
    id: String(row.id ?? ''),
    status,
    variantId,
    userEmail: row.attributes?.user_email ?? null,
    renewsAt: row.attributes?.renews_at ?? null,
    endsAt: row.attributes?.ends_at ?? null,
    cancelled,
    customerPortalUrl: typeof portal === 'string' && portal.trim() ? portal : null,
    planType,
    membershipTier: membershipTierForPlan(planType),
  };
}

export function isLiveLemonSubscription(sub: LemonSubscriptionSummary): boolean {
  return LIVE_LEMON_STATUSES.has(sub.status) && Boolean(sub.membershipTier);
}

export function isInCancelGrace(
  sub: LemonSubscriptionSummary,
  nowMs = Date.now(),
): boolean {
  if (!sub.membershipTier) return false;
  if (!sub.cancelled && sub.status !== 'cancelled') return false;
  if (!sub.endsAt) return false;
  const ends = Date.parse(sub.endsAt);
  return Number.isFinite(ends) && ends > nowMs;
}

export function pickPreferredMonthlySubscription(
  subscriptions: LemonSubscriptionSummary[],
  predicate: (sub: LemonSubscriptionSummary) => boolean,
): LemonSubscriptionSummary | null {
  const matches = subscriptions.filter(
    (s) =>
      (s.membershipTier === 'standard_sub' || s.membershipTier === 'advanced_sub')
      && predicate(s),
  );
  return matches.find((s) => s.membershipTier === 'advanced_sub') ?? matches[0] ?? null;
}

/** Active / trial / paused Standard or Advanced — safe to cancel via API. */
export function pickCancellableLemonSubscription(
  subscriptions: LemonSubscriptionSummary[],
): LemonSubscriptionSummary | null {
  return pickPreferredMonthlySubscription(subscriptions, isLiveLemonSubscription);
}

/** Cancellable, or cancelled-but-still-in-period (customer portal still useful). */
export function pickManageableLemonSubscription(
  subscriptions: LemonSubscriptionSummary[],
  nowMs = Date.now(),
): LemonSubscriptionSummary | null {
  return (
    pickCancellableLemonSubscription(subscriptions)
    ?? pickPreferredMonthlySubscription(
      subscriptions,
      (s) => isInCancelGrace(s, nowMs) || s.status === 'cancelled',
    )
  );
}

export function desiredMembershipFromLemonSubscriptions(
  subscriptions: LemonSubscriptionSummary[],
  nowMs = Date.now(),
): 'standard_sub' | 'advanced_sub' | 'free' {
  const live = pickCancellableLemonSubscription(subscriptions);
  if (live?.membershipTier) return live.membershipTier;
  const grace = pickPreferredMonthlySubscription(subscriptions, (s) =>
    isInCancelGrace(s, nowMs),
  );
  if (grace?.membershipTier) return grace.membershipTier;
  return 'free';
}

export function toLemonSubscriptionBillingView(
  sub: LemonSubscriptionSummary | null,
): LemonSubscriptionBillingView | null {
  if (!sub?.id) return null;
  return {
    id: sub.id,
    status: sub.status,
    planType: sub.planType,
    membershipTier: sub.membershipTier,
    renewsAt: sub.renewsAt,
    endsAt: sub.endsAt,
    cancelled: sub.cancelled,
    canCancel: isLiveLemonSubscription(sub),
    canManage: sub.status !== 'expired',
  };
}

/** List subscriptions for an email in our store (newest first). */
export async function listLemonSubscriptionsForEmail(
  apiKey: string,
  storeId: string,
  email: string,
): Promise<LemonSubscriptionSummary[]> {
  const params = new URLSearchParams({
    'filter[store_id]': String(storeId),
    'filter[user_email]': email,
    'page[size]': '25',
  });
  const json = await lemonFetchJson(apiKey, `/subscriptions?${params.toString()}`);
  const rows =
    json && typeof json === 'object' && 'data' in json && Array.isArray((json as { data: unknown }).data)
      ? ((json as { data: LemonSubscriptionApiRow[] }).data)
      : [];
  return rows.map(parseLemonSubscriptionRow);
}

export async function retrieveLemonSubscription(
  apiKey: string,
  subscriptionId: string,
): Promise<LemonSubscriptionSummary> {
  const id = subscriptionId.trim();
  if (!id) throw new Error('Missing Lemon Squeezy subscription id');
  const json = await lemonFetchJson(apiKey, `/subscriptions/${encodeURIComponent(id)}`);
  const row =
    json && typeof json === 'object' && 'data' in json
      ? ((json as { data: LemonSubscriptionApiRow }).data)
      : undefined;
  if (!row) throw new Error('Lemon Squeezy subscription missing data');
  return parseLemonSubscriptionRow(row);
}

/** Cancel at period end. Access continues until `endsAt`. */
export async function cancelLemonSubscription(
  apiKey: string,
  subscriptionId: string,
): Promise<LemonSubscriptionSummary> {
  const id = subscriptionId.trim();
  if (!id) throw new Error('Missing Lemon Squeezy subscription id');
  const json = await lemonFetchJson(apiKey, `/subscriptions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const row =
    json && typeof json === 'object' && 'data' in json
      ? ((json as { data: LemonSubscriptionApiRow }).data)
      : undefined;
  if (!row) throw new Error('Lemon Squeezy cancel missing data');
  return parseLemonSubscriptionRow(row);
}

/** Recent paid orders for reconcile (store-wide). */
export async function listRecentLemonOrders(
  apiKey: string,
  storeId: string,
  pageSize = 50,
): Promise<Array<{ id: string; status: string; userEmail: string | null; total: number | null; createdAt: string | null }>> {
  const params = new URLSearchParams({
    'filter[store_id]': String(storeId),
    'page[size]': String(pageSize),
  });
  const res = await fetch(`https://api.lemonsqueezy.com/v1/orders?${params.toString()}`, {
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      json?.errors?.[0]?.detail
      ?? json?.errors?.[0]?.title
      ?? `Lemon Squeezy API ${res.status}`;
    throw new Error(detail);
  }
  const rows = Array.isArray(json?.data) ? json.data : [];
  return rows.map((row: {
    id?: string;
    attributes?: {
      status?: string;
      user_email?: string;
      total?: number;
      created_at?: string;
    };
  }) => ({
    id: String(row.id ?? ''),
    status: String(row.attributes?.status ?? ''),
    userEmail: row.attributes?.user_email ?? null,
    total: typeof row.attributes?.total === 'number' ? row.attributes.total : null,
    createdAt: row.attributes?.created_at ?? null,
  }));
}
