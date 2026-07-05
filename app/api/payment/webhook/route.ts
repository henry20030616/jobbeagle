import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { fulfillOrder, fulfillSubscriptionRenewal } from '@/lib/fulfill-order';
import {
  getLemonSqueezyConfig,
  getWebhookCustomData,
  verifyLemonSqueezySignature,
  type LemonWebhookPayload,
} from '@/lib/lemonsqueezy';
import { verifyStripeWebhook } from '@/lib/stripe';
import { isCheckoutPlanType, type CheckoutPlanType } from '@/constants/checkout-plans';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

const LEMON_FULFILL_EVENTS = new Set([
  'order_created',
  'subscription_created',
  'subscription_payment_success',
]);

async function handleStripeEvent(event: Stripe.Event, admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};
    const orderId = meta.order_id;
    const userId = meta.user_id;
    const planTypeRaw = meta.plan_type;
    const reportId = meta.report_id || null;

    if (!orderId || !userId || !planTypeRaw || !isCheckoutPlanType(planTypeRaw)) {
      console.error('[stripe webhook] missing metadata', meta);
      return;
    }

    const paymentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.id;

    if (session.customer && typeof session.customer === 'string') {
      await admin
        .from('profiles')
        .update({
          stripe_customer_id: session.customer,
          stripe_subscription_id:
            typeof session.subscription === 'string' ? session.subscription : null,
        })
        .eq('id', userId);
    }

    await fulfillOrder(
      admin,
      orderId,
      userId,
      planTypeRaw as CheckoutPlanType,
      reportId,
      paymentId,
    );
    return;
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;
    const subRef = (invoice as Stripe.Invoice & { subscription?: string | null }).subscription;
    const subId = typeof subRef === 'string' ? subRef : null;
    if (!subId) return;

    const { data: profile } = await admin
      .from('profiles')
      .select('id, membership_tier')
      .eq('stripe_subscription_id', subId)
      .maybeSingle();

    if (!profile) return;

    const tier = profile.membership_tier;
    if (tier === 'standard_sub' || tier === 'advanced_sub') {
      await fulfillSubscriptionRenewal(admin, profile.id, tier);
    }
  }
}

export async function POST(request: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const stripeSig = request.headers.get('stripe-signature');
  const lemonSig = request.headers.get('x-signature');

  // Stripe webhook
  if (stripeSig) {
    try {
      const event = verifyStripeWebhook(rawBody, stripeSig);
      await handleStripeEvent(event, admin);
      return NextResponse.json({ received: true, provider: 'stripe' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Stripe webhook error';
      console.error('[webhook] Stripe:', message);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  // Lemon Squeezy webhook (legacy)
  const ls = getLemonSqueezyConfig();
  if (!ls?.webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  if (!verifyLemonSqueezySignature(rawBody, lemonSig, ls.webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? '';
  if (!LEMON_FULFILL_EVENTS.has(eventName)) {
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

  const custom = getWebhookCustomData(payload);
  const orderId = custom.order_id;
  const userId = custom.user_id;
  const planTypeRaw = custom.plan_type;
  const reportId = custom.report_id ?? null;

  if (!orderId || !userId || !planTypeRaw || !isCheckoutPlanType(planTypeRaw)) {
    return NextResponse.json({ error: 'Missing custom_data' }, { status: 400 });
  }

  await admin
    .from('orders')
    .update({ external_checkout_id: externalId, payment_provider: 'lemonsqueezy' })
    .eq('id', orderId);

  await fulfillOrder(admin, orderId, userId, planTypeRaw as CheckoutPlanType, reportId, externalId);
  return NextResponse.json({ received: true, provider: 'lemonsqueezy' });
}
