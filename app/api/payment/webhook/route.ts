import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  applyMembershipFromPaddleSubscriptions,
  fulfillOrder,
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

export async function POST(request: NextRequest) {
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

  const rawBody = await request.text();
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
