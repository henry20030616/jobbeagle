import { createHmac, timingSafeEqual } from 'crypto';
import {
  ACTIVE_CHECKOUT_PLAN_TYPES,
  type CheckoutPlanType,
} from '@/constants/checkout-plans';

export interface LemonSqueezyConfig {
  apiKey: string;
  storeId: string;
  webhookSecret: string;
  variantIds: Partial<Record<CheckoutPlanType, string>>;
}

/** Resolve variant ID for a plan; single_lite falls back to BASIC_OVERAGE ($3). */
export function resolveLemonSqueezyVariant(planType: CheckoutPlanType): string | null {
  const map: Partial<Record<CheckoutPlanType, string | undefined>> = {
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
  const id = map[planType];
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

/** Returns missing env keys for active checkout plans (for error messages). */
export function getMissingLemonSqueezyVariants(): string[] {
  const required: Array<{ plan: CheckoutPlanType; env: string; fallback?: string }> = [
    { plan: 'single_lite', env: 'LEMONSQUEEZY_VARIANT_SINGLE_LITE', fallback: 'LEMONSQUEEZY_VARIANT_BASIC_OVERAGE' },
    { plan: 'single_full', env: 'LEMONSQUEEZY_VARIANT_SINGLE_FULL' },
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
