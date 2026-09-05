import { CHECKOUT_PLANS, type CheckoutPlanType } from '@/constants/checkout-plans';
import type { SupabaseClient } from '@supabase/supabase-js';

export type PayPalEnvironment = 'sandbox' | 'live';

export type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  environment: PayPalEnvironment;
  webhookId: string;
  planIds: {
    standard_subscription: string;
    advanced_subscription: string;
  };
};

const PAYPAL_CERT_HOSTS = new Set([
  'api.paypal.com',
  'api.sandbox.paypal.com',
  'api-m.paypal.com',
  'api-m.sandbox.paypal.com',
]);

type TokenCache = { value: string; expiresAtMs: number };
let tokenCache: TokenCache | null = null;

export function usdAmountFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function paypalApiBase(environment: PayPalEnvironment): string {
  return environment === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export function getPayPalConfig(): PayPalConfig | null {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim() ?? '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim() ?? '';
  if (!clientId || !clientSecret) return null;
  const environment: PayPalEnvironment =
    process.env.PAYPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox';
  return {
    clientId,
    clientSecret,
    environment,
    webhookId: process.env.PAYPAL_WEBHOOK_ID?.trim() ?? '',
    planIds: {
      standard_subscription: process.env.PAYPAL_PLAN_STANDARD_SUB?.trim() ?? '',
      advanced_subscription: process.env.PAYPAL_PLAN_ADVANCED_SUB?.trim() ?? '',
    },
  };
}

export function getMissingPayPalPlanIds(): string[] {
  const missing: string[] = [];
  if (!process.env.PAYPAL_PLAN_STANDARD_SUB?.trim()) missing.push('PAYPAL_PLAN_STANDARD_SUB');
  if (!process.env.PAYPAL_PLAN_ADVANCED_SUB?.trim()) missing.push('PAYPAL_PLAN_ADVANCED_SUB');
  return missing;
}

export function resolvePayPalPlanId(planType: CheckoutPlanType): string | null {
  const config = getPayPalConfig();
  if (!config) return null;
  if (planType === 'standard_subscription') {
    return config.planIds.standard_subscription || null;
  }
  if (planType === 'advanced_subscription') {
    return config.planIds.advanced_subscription || null;
  }
  return null;
}

export function isAllowedPayPalCertUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && PAYPAL_CERT_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

export function isPayPalWebhookRequest(headers: Record<string, string | null | undefined>): boolean {
  return Boolean(
    headers['paypal-transmission-id']
    && headers['paypal-transmission-sig']
    && headers['paypal-auth-algo']
    && headers['paypal-cert-url']
    && headers['paypal-transmission-time'],
  );
}

type PayPalLink = { href?: unknown; rel?: unknown };

function approveUrlFromLinks(links: unknown): string | null {
  if (!Array.isArray(links)) return null;
  for (const entry of links) {
    if (!entry || typeof entry !== 'object') continue;
    const link = entry as PayPalLink;
    const rel = typeof link.rel === 'string' ? link.rel : '';
    const href = typeof link.href === 'string' ? link.href : '';
    if ((rel === 'approve' || rel === 'payer-action') && href.startsWith('https://')) {
      return href;
    }
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

async function paypalAccessToken(config: PayPalConfig): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAtMs > now + 30_000) {
    return tokenCache.value;
  }
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const res = await fetch(`${paypalApiBase(config.environment)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const json: unknown = await res.json().catch(() => ({}));
  const data = asRecord(json);
  const token = typeof data.access_token === 'string' ? data.access_token : '';
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 300;
  if (!res.ok || !token) {
    throw new Error('PayPal OAuth failed');
  }
  tokenCache = { value: token, expiresAtMs: now + expiresIn * 1000 };
  return token;
}

async function paypalFetch(
  config: PayPalConfig,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<Record<string, unknown>> {
  const token = await paypalAccessToken(config);
  const res = await fetch(`${paypalApiBase(config.environment)}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  let json: unknown = {};
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = {};
    }
  }
  const data = asRecord(json);
  if (!res.ok) {
    const message =
      typeof data.message === 'string'
        ? data.message
        : typeof data.error_description === 'string'
          ? data.error_description
          : `PayPal ${path} failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export async function createPayPalCheckout(params: {
  planType: CheckoutPlanType;
  orderId: string;
  email?: string;
  returnUrl: string;
  cancelUrl: string;
  amountCents?: number;
}): Promise<string> {
  const config = getPayPalConfig();
  if (!config) throw new Error('PayPal is not configured');

  const plan = CHECKOUT_PLANS[params.planType];
  if (!plan) throw new Error(`Unknown plan type: ${params.planType}`);

  if (plan.isSubscription) {
    const planId = resolvePayPalPlanId(params.planType);
    if (!planId) {
      throw new Error(
        `PayPal plan not configured for "${params.planType}". Set PAYPAL_PLAN_STANDARD_SUB / PAYPAL_PLAN_ADVANCED_SUB.`,
      );
    }
    const created = await paypalFetch(config, '/v1/billing/subscriptions', {
      method: 'POST',
      body: {
        plan_id: planId,
        custom_id: params.orderId,
        ...(params.email ? { subscriber: { email_address: params.email } } : {}),
        application_context: {
          brand_name: 'JobBeagle',
          user_action: 'SUBSCRIBE_NOW',
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
        },
      },
    });
    const url = approveUrlFromLinks(created.links);
    if (!url) throw new Error('PayPal subscription missing approval URL');
    return url;
  }

  const created = await paypalFetch(config, '/v2/checkout/orders', {
    method: 'POST',
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: params.orderId,
          invoice_id: params.orderId,
          description: plan.labelEn.slice(0, 127),
          amount: {
            currency_code: 'USD',
            value: usdAmountFromCents(params.amountCents ?? plan.amountCents),
          },
        },
      ],
      application_context: {
        brand_name: 'JobBeagle',
        user_action: 'PAY_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    },
  });
  const url = approveUrlFromLinks(created.links);
  if (!url) throw new Error('PayPal order missing approval URL');
  return url;
}

export async function capturePayPalOrder(orderId: string): Promise<{
  captureId: string | null;
  customId: string | null;
  status: string;
}> {
  const config = getPayPalConfig();
  if (!config) throw new Error('PayPal is not configured');
  const captured = await paypalFetch(config, `/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    body: {},
  });
  return parseCapturedOrder(captured);
}

export async function captureOrLoadPayPalOrder(paypalOrderId: string): Promise<{
  captureId: string | null;
  customId: string | null;
  status: string;
}> {
  try {
    return await capturePayPalOrder(paypalOrderId);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (/ALREADY_CAPTURED|ORDER_ALREADY_CAPTURED|COMPLETED/i.test(message)) {
      return getPayPalOrder(paypalOrderId);
    }
    throw err;
  }
}

export async function getPayPalOrder(orderId: string): Promise<{
  captureId: string | null;
  customId: string | null;
  status: string;
}> {
  const config = getPayPalConfig();
  if (!config) throw new Error('PayPal is not configured');
  const order = await paypalFetch(config, `/v2/checkout/orders/${orderId}`);
  return parseCapturedOrder(order);
}

function parseCapturedOrder(order: Record<string, unknown>): {
  captureId: string | null;
  customId: string | null;
  status: string;
} {
  const status = typeof order.status === 'string' ? order.status : '';
  const purchaseUnits = Array.isArray(order.purchase_units) ? order.purchase_units : [];
  const unit = asRecord(purchaseUnits[0]);
  const customId = typeof unit.custom_id === 'string' ? unit.custom_id : null;
  const payments = asRecord(unit.payments);
  const captures = Array.isArray(payments.captures) ? payments.captures : [];
  const capture = asRecord(captures[0]);
  const captureId = typeof capture.id === 'string' ? capture.id : null;
  const captureCustom =
    typeof capture.custom_id === 'string' ? capture.custom_id : customId;
  return { captureId, customId: captureCustom, status };
}

export async function getPayPalSubscription(subscriptionId: string): Promise<{
  id: string;
  status: string;
  customId: string | null;
  nextBillingTime: string | null;
}> {
  const config = getPayPalConfig();
  if (!config) throw new Error('PayPal is not configured');
  const sub = await paypalFetch(config, `/v1/billing/subscriptions/${subscriptionId}`);
  const billingInfo = asRecord(sub.billing_info);
  const nextBillingTime = typeof billingInfo.next_billing_time === 'string'
    ? billingInfo.next_billing_time
    : null;
  return {
    id: typeof sub.id === 'string' ? sub.id : subscriptionId,
    status: typeof sub.status === 'string' ? sub.status : '',
    customId: typeof sub.custom_id === 'string' ? sub.custom_id : null,
    nextBillingTime,
  };
}

export async function cancelPayPalSubscription(subscriptionId: string): Promise<void> {
  const config = getPayPalConfig();
  if (!config) throw new Error('PayPal is not configured');
  await paypalFetch(config, `/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: { reason: 'Customer cancelled from JobBeagle account' },
  });
}

export function paypalBillingPortalUrl(environment: PayPalEnvironment): string {
  return environment === 'live'
    ? 'https://www.paypal.com/myaccount/autopay/'
    : 'https://www.sandbox.paypal.com/myaccount/autopay/';
}

export async function listUserPayPalSubscriptionIds(
  admin: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data } = await admin
    .from('orders')
    .select('external_checkout_id')
    .eq('user_id', userId)
    .eq('payment_provider', 'paypal')
    .order('created_at', { ascending: false })
    .limit(20);
  const ids: string[] = [];
  for (const row of data ?? []) {
    const id = row.external_checkout_id;
    if (typeof id === 'string' && id.startsWith('I-')) ids.push(id);
  }
  return ids;
}

export async function findLivePayPalSubscription(
  admin: SupabaseClient,
  userId: string,
): Promise<{ id: string; status: string; customId: string | null; nextBillingTime: string | null } | null> {
  const ids = await listUserPayPalSubscriptionIds(admin, userId);
  for (const id of ids) {
    const sub = await getPayPalSubscription(id);
    if (sub.status === 'ACTIVE' || sub.status === 'SUSPENDED') return sub;
  }
  return null;
}

export type PayPalWebhookHeaders = {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
};

export function readPayPalWebhookHeaders(
  headers: Record<string, string | null | undefined>,
): PayPalWebhookHeaders | null {
  const authAlgo = headers['paypal-auth-algo']?.trim() ?? '';
  const certUrl = headers['paypal-cert-url']?.trim() ?? '';
  const transmissionId = headers['paypal-transmission-id']?.trim() ?? '';
  const transmissionSig = headers['paypal-transmission-sig']?.trim() ?? '';
  const transmissionTime = headers['paypal-transmission-time']?.trim() ?? '';
  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return null;
  }
  if (!isAllowedPayPalCertUrl(certUrl)) return null;
  return { authAlgo, certUrl, transmissionId, transmissionSig, transmissionTime };
}

export async function verifyPayPalWebhook(params: {
  headers: PayPalWebhookHeaders;
  rawBody: string;
}): Promise<boolean> {
  const config = getPayPalConfig();
  if (!config?.webhookId) return false;
  let event: unknown;
  try {
    event = JSON.parse(params.rawBody);
  } catch {
    return false;
  }
  try {
    const result = await paypalFetch(config, '/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      body: {
        auth_algo: params.headers.authAlgo,
        cert_url: params.headers.certUrl,
        transmission_id: params.headers.transmissionId,
        transmission_sig: params.headers.transmissionSig,
        transmission_time: params.headers.transmissionTime,
        webhook_id: config.webhookId,
        webhook_event: event,
      },
    });
    return result.verification_status === 'SUCCESS';
  } catch {
    return false;
  }
}

export type PayPalWebhookEvent = {
  eventType: string;
  resourceId: string | null;
  customId: string | null;
  status: string;
  billingAgreementId: string | null;
};

export function parsePayPalWebhookEvent(raw: unknown): PayPalWebhookEvent {
  const event = asRecord(raw);
  const resource = asRecord(event.resource);
  const supplementary = asRecord(resource.supplementary_data);
  const related = asRecord(supplementary.related_ids);
  const units = Array.isArray(resource.purchase_units) ? resource.purchase_units : [];
  const unitCustom = asRecord(units[0]);
  const customId =
    (typeof resource.custom_id === 'string' && resource.custom_id)
    || (typeof resource.custom === 'string' && resource.custom)
    || (typeof unitCustom.custom_id === 'string' && unitCustom.custom_id)
    || (typeof related.order_id === 'string' && related.order_id)
    || null;
  return {
    eventType: typeof event.event_type === 'string' ? event.event_type : '',
    resourceId: typeof resource.id === 'string' ? resource.id : null,
    customId,
    status: typeof resource.status === 'string' ? resource.status : '',
    billingAgreementId:
      typeof resource.billing_agreement_id === 'string'
        ? resource.billing_agreement_id
        : null,
  };
}
