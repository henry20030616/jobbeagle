import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { fulfillOrder, fulfillSubscriptionRenewal } from '@/lib/fulfill-order';
import {
  getLemonSqueezyConfig,
  getWebhookCustomData,
  verifyLemonSqueezySignature,
  type LemonWebhookPayload,
} from '@/lib/lemonsqueezy';
import {
  isCheckoutPlanType,
  normalizeCheckoutPlanType,
  type CheckoutPlanType,
} from '@/constants/checkout-plans';

export const runtime = 'nodejs';

const FULFILL_EVENTS = new Set([
  'order_created',
  'subscription_created',
  'subscription_payment_success',
]);

export async function POST(request: NextRequest) {
  const ls = getLemonSqueezyConfig();
  const admin = getSupabaseAdmin();

  if (!ls || !admin) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  if (!ls.webhookSecret) {
    return NextResponse.json({ error: 'LEMONSQUEEZY_WEBHOOK_SECRET not set' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-signature');

  if (!verifyLemonSqueezySignature(rawBody, signature, ls.webhookSecret)) {
    console.error('[webhook] Lemon Squeezy signature invalid');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? '';
  if (!FULFILL_EVENTS.has(eventName)) {
    return NextResponse.json({ received: true, skipped: eventName });
  }

  const status = payload.data?.attributes?.status;
  if (status && status !== 'paid') {
    return NextResponse.json({ received: true, skipped: `status_${status}` });
  }

  const externalId = payload.data?.id ? String(payload.data.id) : null;
  if (!externalId) {
    return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
  }

  const { data: existingByExternal } = await admin
    .from('orders')
    .select('id, status')
    .eq('external_checkout_id', externalId)
    .maybeSingle();

  if (existingByExternal?.status === 'succeeded') {
    return NextResponse.json({ received: true, idempotent: true });
  }

  const custom = getWebhookCustomData(payload);
  const orderId = custom.order_id;
  const userId = custom.user_id;
  const planTypeRaw = custom.plan_type;
  const reportId = custom.report_id ?? null;

  const planType = planTypeRaw ? normalizeCheckoutPlanType(planTypeRaw) : null;
  if (!userId || !planType || !isCheckoutPlanType(planType)) {
    console.error('[webhook] missing custom_data', { eventName, custom });
    return NextResponse.json({ error: 'Missing custom_data' }, { status: 400 });
  }

  // Subscription renewal: reset monthly credits without a new order row
  if (
    eventName === 'subscription_payment_success'
    && !orderId
    && (planType === 'standard_subscription' || planType === 'advanced_subscription')
  ) {
    const tier = planType === 'standard_subscription' ? 'standard_sub' : 'advanced_sub';
    await fulfillSubscriptionRenewal(admin, userId, tier);
    return NextResponse.json({ received: true, renewal: true });
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
      payment_provider: 'lemonsqueezy',
    })
    .eq('id', orderId);

  try {
    await fulfillOrder(admin, orderId, userId, planType, reportId, externalId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fulfillment failed';
    console.error('[webhook] fulfill error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true, provider: 'lemonsqueezy' });
}
