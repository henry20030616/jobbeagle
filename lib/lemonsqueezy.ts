import { createHmac, timingSafeEqual } from 'crypto';
import type { CheckoutPlanType } from '@/constants/checkout-plans';

export interface LemonSqueezyConfig {
  apiKey: string;
  storeId: string;
  webhookSecret: string;
  variantIds: Partial<Record<CheckoutPlanType, string>> & {
    basic_overage: string;
    premium_report: string;
    monthly_subscription: string;
  };
}

export function getLemonSqueezyConfig(): LemonSqueezyConfig | null {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const basic = process.env.LEMONSQUEEZY_VARIANT_BASIC_OVERAGE;
  const premium = process.env.LEMONSQUEEZY_VARIANT_PREMIUM_REPORT;
  const monthly = process.env.LEMONSQUEEZY_VARIANT_MONTHLY;

  if (!apiKey || !storeId || !basic || !premium || !monthly) {
    return null;
  }

  return {
    apiKey,
    storeId,
    webhookSecret: webhookSecret ?? '',
    variantIds: {
      basic_overage: basic,
      premium_report: premium,
      monthly_subscription: monthly,
    },
  };
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
