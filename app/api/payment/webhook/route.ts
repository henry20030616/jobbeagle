import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  applyMembershipFromPaddleSubscriptions,
  downgradeExpiredSubscription,
  fulfillOrder,
  fulfillPaidOrderById,
  fulfillSubscriptionRenewal,
} from '@/lib/fulfill-order';
import { findAuthUserIdByEmail } from '@/lib/auth-admin-lookup';
import {
  getPaddleClient,
  getPaddleConfig,
  verifyPaddleSignature,
  listPaddleSubscriptionsForEmail,
  type PaddleSubscriptionSummary,
} from '@/lib/paddle';
import {
  getPayPalConfig,
  isPayPalWebhookRequest,
  parsePayPalWebhookEvent,
  readPayPalWebhookHeaders,
  verifyPayPalWebhook,
  captureOrLoadPayPalOrder,
} from '@/lib/paypal';
import {
  CHECKOUT_PLANS,
  isCheckoutPlanType,
  normalizeCheckoutPlanType,
} from '@/constants/checkout-plans';
import { clientIpFromRequest, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const FULFILL_EVENTS = new Set([
  'transaction.completed',
]);

const LIFECYCLE_EVENTS = new Set([
  'subscription.canceled',
]);

type PaddleWebhookPayload = {
  event_type?: unknown;
  data?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function stringMap(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(asRecord(value))) {
    if (typeof entry === 'string') out[key] = entry;
  }
  return out;
}

async function resolveWebhookUserId(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  email: string | null,
  customData: Record<string, string>,
): Promise<string | null> {
  if (customData.user_id) return customData.user_id;
  if (!email) return null;
  return findAuthUserIdByEmail(admin, email);
}

async function handlePayPalWebhook(request: NextRequest, rawBody: string) {
  const admin = getSupabaseAdmin();
  const paypal = getPayPalConfig();
  if (!admin || !paypal) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }
  if (!paypal.webhookId) {
    return NextResponse.json({ error: 'PAYPAL_WEBHOOK_ID not set' }, { status: 503 });
  }

  const { allowed } = await rateLimit('paypal-webhook', clientIpFromRequest(request), 120, 60);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const headerMap: Record<string, string | null> = {
    'paypal-auth-algo': request.headers.get('paypal-auth-algo'),
    'paypal-cert-url': request.headers.get('paypal-cert-url'),
    'paypal-transmission-id': request.headers.get('paypal-transmission-id'),
    'paypal-transmission-sig': request.headers.get('paypal-transmission-sig'),
    'paypal-transmission-time': request.headers.get('paypal-transmission-time'),
  };
  const paypalHeaders = readPayPalWebhookHeaders(headerMap);
  if (!paypalHeaders) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const isValid = await verifyPayPalWebhook({ headers: paypalHeaders, rawBody });
  if (!isValid) {
    console.error('[webhook] PayPal signature invalid');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = parsePayPalWebhookEvent(parsed);

  if (event.eventType === 'BILLING.SUBSCRIPTION.CANCELLED' || event.eventType === 'BILLING.SUBSCRIPTION.EXPIRED') {
    const orderId = event.customId;
    if (!orderId) {
      return NextResponse.json({ received: true, skipped: 'no_custom_id' });
    }
    const { data: order } = await admin
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .maybeSingle();
    const userId = typeof order?.user_id === 'string' ? order.user_id : null;
    if (!userId) {
      return NextResponse.json({ received: true, skipped: 'no_user' });
    }
    try {
      await downgradeExpiredSubscription(admin, userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'downgrade failed';
      console.error('[webhook] paypal cancel downgrade', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ received: true, provider: 'paypal', lifecycle: event.eventType });
  }

  if (event.eventType === 'PAYMENT.SALE.COMPLETED' && event.billingAgreementId) {
    const { data: order } = await admin
      .from('orders')
      .select('user_id, plan_type')
      .eq('external_checkout_id', event.billingAgreementId)
      .maybeSingle();
    const userId = typeof order?.user_id === 'string' ? order.user_id : null;
    const planType = typeof order?.plan_type === 'string' ? normalizeCheckoutPlanType(order.plan_type) : null;
    const tier = planType ? CHECKOUT_PLANS[planType]?.membershipTier : undefined;
    if (userId && (tier === 'standard_sub' || tier === 'advanced_sub')) {
      try {
        await fulfillSubscriptionRenewal(admin, userId, tier);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'renewal failed';
        console.error('[webhook] paypal renewal', message);
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
    return NextResponse.json({ received: true, provider: 'paypal', renewal: true });
  }

  const fulfillTypes = new Set([
    'PAYMENT.CAPTURE.COMPLETED',
    'BILLING.SUBSCRIPTION.ACTIVATED',
  ]);
  if (event.eventType === 'CHECKOUT.ORDER.APPROVED' && event.resourceId) {
    try {
      const captured = await captureOrLoadPayPalOrder(event.resourceId);
      const orderId = captured.customId ?? event.customId;
      const externalId = captured.captureId ?? event.resourceId;
      if (!orderId) {
        return NextResponse.json({ received: true, skipped: 'missing_ids' });
      }
      const result = await fulfillPaidOrderById(admin, orderId, externalId, 'paypal');
      if (result === 'missing') {
        return NextResponse.json({ error: 'Unknown order' }, { status: 400 });
      }
      return NextResponse.json({
        received: true,
        provider: 'paypal',
        idempotent: result === 'idempotent',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Capture failed';
      console.error('[webhook] paypal capture-on-approve', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
  if (!fulfillTypes.has(event.eventType)) {
    return NextResponse.json({ received: true, skipped: event.eventType, provider: 'paypal' });
  }

  const orderId = event.customId;
  const externalId = event.resourceId ?? event.customId;
  if (!orderId || !externalId) {
    return NextResponse.json({ received: true, skipped: 'missing_ids' });
  }

  try {
    const result = await fulfillPaidOrderById(admin, orderId, externalId, 'paypal');
    if (result === 'missing') {
      return NextResponse.json({ error: 'Unknown order' }, { status: 400 });
    }
    return NextResponse.json({
      received: true,
      provider: 'paypal',
      idempotent: result === 'idempotent',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fulfillment failed';
    console.error('[webhook] paypal fulfill error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const paypalHeaderMap: Record<string, string | null> = {
    'paypal-transmission-id': request.headers.get('paypal-transmission-id'),
    'paypal-transmission-sig': request.headers.get('paypal-transmission-sig'),
    'paypal-auth-algo': request.headers.get('paypal-auth-algo'),
    'paypal-cert-url': request.headers.get('paypal-cert-url'),
    'paypal-transmission-time': request.headers.get('paypal-transmission-time'),
  };
  if (isPayPalWebhookRequest(paypalHeaderMap)) {
    return handlePayPalWebhook(request, rawBody);
  }

  const paddleConfig = getPaddleConfig();
  const paddle = getPaddleClient();
  const admin = getSupabaseAdmin();

  if (!paddleConfig || !paddle || !admin) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  if (!paddleConfig.webhookSecret) {
    return NextResponse.json({ error: 'PADDLE_WEBHOOK_SECRET not set' }, { status: 503 });
  }

  const { allowed } = await rateLimit('paddle-webhook', clientIpFromRequest(request), 120, 60);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const signature = request.headers.get('paddle-signature');

  const isValid = verifyPaddleSignature(rawBody, signature, paddleConfig.webhookSecret);
  if (!isValid) {
    console.error('[webhook] Paddle signature invalid');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: PaddleWebhookPayload;
  try {
    event = JSON.parse(rawBody) as PaddleWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = typeof event.event_type === 'string' ? event.event_type : '';
  const eventData = asRecord(event.data);

  // Handle subscription lifecycle events
  if (LIFECYCLE_EVENTS.has(eventType)) {
    if (eventType === 'subscription.canceled') {
      const customerEmail =
        typeof eventData.customer_email === 'string' ? eventData.customer_email : null;

      const customData = stringMap(eventData.custom_data);
      const userId = await resolveWebhookUserId(admin, customerEmail, customData);
      if (!userId) {
        console.error('[webhook] lifecycle missing user', { eventType });
        return NextResponse.json({ received: true, skipped: 'no_user' });
      }

      let subscriptions: PaddleSubscriptionSummary[] = [];
      if (customerEmail) {
        try {
          subscriptions = await listPaddleSubscriptionsForEmail(paddle, customerEmail);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'list failed';
          console.error('[webhook] lifecycle list', message);
        }
      }

      try {
        await applyMembershipFromPaddleSubscriptions(admin, userId, subscriptions, {
          emptyMeans: 'free',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'downgrade failed';
        console.error('[webhook] subscription canceled downgrade', message);
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true, lifecycle: eventType });
  }

  if (!FULFILL_EVENTS.has(eventType)) {
    return NextResponse.json({ received: true, skipped: eventType });
  }

  // Handle transaction.completed
  if (eventType === 'transaction.completed') {
    const transaction = eventData;
    const status = typeof transaction.status === 'string' ? transaction.status : '';
    
    if (status !== 'completed') {
      return NextResponse.json({ received: true, skipped: `status_${status || 'unknown'}` });
    }

    const externalId = typeof transaction.id === 'string' ? transaction.id : '';
    if (!externalId) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
    }
    const { data: existingByExternal } = await admin
      .from('orders')
      .select('id, status')
      .eq('external_checkout_id', externalId)
      .maybeSingle();

    if (existingByExternal?.status === 'succeeded') {
      return NextResponse.json({ received: true, idempotent: true });
    }

    const customData = stringMap(transaction.custom_data);
    const orderId = customData.order_id;
    const userId = customData.user_id;
    const planTypeRaw = customData.plan_type;
    const reportId = customData.report_id ?? null;

    const planType = planTypeRaw ? normalizeCheckoutPlanType(planTypeRaw) : null;
    if (!userId || !planType || !isCheckoutPlanType(planType)) {
      console.error('[webhook] missing custom_data', { eventType, customData });
      return NextResponse.json({ error: 'Missing custom_data' }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order_id in custom_data' }, { status: 400 });
    }

    const { data: orderRow } = await admin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .maybeSingle();

    if (orderRow?.status === 'succeeded') {
      return NextResponse.json({ received: true, idempotent: true });
    }

    await admin
      .from('orders')
      .update({
        external_checkout_id: externalId,
        payment_provider: 'paddle',
      })
      .eq('id', orderId);

    try {
      await fulfillOrder(admin, orderId, userId, planType, reportId, externalId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fulfillment failed';
      console.error('[webhook] fulfill error:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ received: true, provider: 'paddle' });
  }

  return NextResponse.json({ received: true, provider: 'paddle' });
}
