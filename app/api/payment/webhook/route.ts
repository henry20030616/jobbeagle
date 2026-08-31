import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  applyMembershipFromPaddleSubscriptions,
  fulfillOrder,
  fulfillSubscriptionRenewal,
} from '@/lib/fulfill-order';
import { findAuthUserIdByEmail } from '@/lib/auth-admin-lookup';
import {
  getPaddleClient,
  getPaddleConfig,
  verifyPaddleSignature,
  listPaddleSubscriptionsForEmail,
  parsePaddleSubscription,
  type PaddleSubscriptionSummary,
} from '@/lib/paddle';
import {
  isCheckoutPlanType,
  normalizeCheckoutPlanType,
} from '@/constants/checkout-plans';

export const runtime = 'nodejs';

const FULFILL_EVENTS = new Set([
  'transaction.completed',
]);

const LIFECYCLE_EVENTS = new Set([
  'subscription.canceled',
]);

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

  const rawBody = await request.text();
  const signature = request.headers.get('paddle-signature');

  const isValid = verifyPaddleSignature(rawBody, signature, paddleConfig.webhookSecret);
  if (!isValid) {
    console.error('[webhook] Paddle signature invalid');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = event.event_type;

  // Handle subscription lifecycle events
  if (LIFECYCLE_EVENTS.has(eventType)) {
    if (eventType === 'subscription.canceled') {
      const subscriptionData = event.data;
      const customerEmail = subscriptionData.customer_email ?? null;

      const customData = subscriptionData.custom_data ?? {};
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
    const transaction = event.data;
    
    if (transaction.status !== 'completed') {
      return NextResponse.json({ received: true, skipped: `status_${transaction.status}` });
    }

    const externalId = transaction.id;
    const { data: existingByExternal } = await admin
      .from('orders')
      .select('id, status')
      .eq('external_checkout_id', externalId)
      .maybeSingle();

    if (existingByExternal?.status === 'succeeded') {
      return NextResponse.json({ received: true, idempotent: true });
    }

    const customData = transaction.custom_data ?? {};
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

  // Handle subscription.updated (for renewals)
  if (eventType === 'subscription.updated') {
    const subscription = event.data;
    
    // Check if this is a renewal (billing cycle change)
    if (!subscription.billing_cycle) {
      return NextResponse.json({ received: true, skipped: 'not_renewal' });
    }

    const customerEmail = subscription.customer_email ?? null;
    const customData = subscription.custom_data ?? {};
    const userId = await resolveWebhookUserId(admin, customerEmail, customData);
    
    if (!userId) {
      console.error('[webhook] renewal missing user', { eventType });
      return NextResponse.json({ received: true, skipped: 'no_user' });
    }

    const subSummary = parsePaddleSubscription(subscription);
    if (!subSummary.membershipTier) {
      return NextResponse.json({ received: true, skipped: 'not_monthly_plan' });
    }

    await fulfillSubscriptionRenewal(admin, userId, subSummary.membershipTier);
    return NextResponse.json({ received: true, renewal: true });
  }

  return NextResponse.json({ received: true, provider: 'paddle' });
}
