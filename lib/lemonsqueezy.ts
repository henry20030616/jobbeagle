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
    };
  };
};

export function getWebhookCustomData(payload: LemonWebhookPayload): Record<string, string> {
  return payload.meta?.custom_data ?? {};
}

export type LemonSubscriptionSummary = {
  id: string;
  status: string;
  variantId: string;
  userEmail: string | null;
  renewsAt: string | null;
  planType: CheckoutPlanType | null;
  membershipTier: 'standard_sub' | 'advanced_sub' | null;
};

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
  const res = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions?${params.toString()}`,
    {
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );
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
      variant_id?: number | string;
      user_email?: string;
      renews_at?: string | null;
    };
  }) => {
    const variantId = String(row.attributes?.variant_id ?? '');
    const planType = planTypeFromLemonVariantId(variantId);
    return {
      id: String(row.id ?? ''),
      status: String(row.attributes?.status ?? ''),
      variantId,
      userEmail: row.attributes?.user_email ?? null,
      renewsAt: row.attributes?.renews_at ?? null,
      planType,
      membershipTier: membershipTierForPlan(planType),
    };
  });
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
