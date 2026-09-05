import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  fulfillOrder,
  fulfillPaidOrderById,
  fulfillSubscriptionRenewal,
} from '@/lib/fulfill-order';
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
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

  const event = parsePayPalWebhookEvent(rawBody);
  if (!event) {
    return NextResponse.json({ error: 'Invalid PayPal webhook body' }, { status: 400 });
  }

  const eventType = event.event_type;
  console.log('[webhook] PayPal event:', eventType, event.id);

  if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'PAYMENT.SALE.COMPLETED') {
    const resource = asRecord(event.resource);
    const customId = typeof resource.custom_id === 'string' ? resource.custom_id : null;
    if (!customId) {
      return NextResponse.json({ error: 'Missing custom_id in resource' }, { status: 400 });
    }

    const { data: orderRow } = await admin
      .from('orders')
      .select('id, user_id, plan_type, report_id, status, external_checkout_id')
      .eq('id', customId)
      .maybeSingle();

    if (!orderRow) {
      console.error('[webhook] order not found:', customId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (orderRow.status === 'succeeded') {
      return NextResponse.json({ received: true, idempotent: true });
    }

    const planType = normalizeCheckoutPlanType(orderRow.plan_type);
    if (!planType || !isCheckoutPlanType(planType)) {
      return NextResponse.json({ error: 'Invalid plan_type' }, { status: 400 });
    }

    const externalId =
      typeof resource.id === 'string' ? resource.id : orderRow.external_checkout_id;

    await admin
      .from('orders')
      .update({
        external_checkout_id: externalId,
        payment_provider: 'paypal',
      })
      .eq('id', customId);

    try {
      await fulfillOrder(
        admin,
        orderRow.id,
        orderRow.user_id,
        planType,
        orderRow.report_id,
        externalId,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fulfillment failed';
      console.error('[webhook] fulfill error:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ received: true, provider: 'paypal' });
  }

  if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
    const resource = asRecord(event.resource);
    const customId = typeof resource.custom_id === 'string' ? resource.custom_id : null;
    if (!customId) {
      return NextResponse.json({ error: 'Missing custom_id in resource' }, { status: 400 });
    }

    const { data: orderRow } = await admin
      .from('orders')
      .select('id, user_id, plan_type, report_id, status')
      .eq('id', customId)
      .maybeSingle();

    if (!orderRow) {
      console.error('[webhook] subscription order not found:', customId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (orderRow.status === 'succeeded') {
      return NextResponse.json({ received: true, idempotent: true });
    }

    const planType = normalizeCheckoutPlanType(orderRow.plan_type);
    if (!planType || !isCheckoutPlanType(planType)) {
      return NextResponse.json({ error: 'Invalid plan_type' }, { status: 400 });
    }

    const subscriptionId = typeof resource.id === 'string' ? resource.id : null;
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscription id' }, { status: 400 });
    }

    await admin
      .from('orders')
      .update({
        external_checkout_id: subscriptionId,
        payment_provider: 'paypal',
      })
      .eq('id', customId);

    try {
      await fulfillOrder(
        admin,
        orderRow.id,
        orderRow.user_id,
        planType,
        orderRow.report_id,
        subscriptionId,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fulfillment failed';
      console.error('[webhook] fulfill subscription error:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ received: true, provider: 'paypal', subscription: true });
  }

  if (
    eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
    eventType === 'BILLING.SUBSCRIPTION.EXPIRED' ||
    eventType === 'BILLING.SUBSCRIPTION.SUSPENDED'
  ) {
    console.log('[webhook] subscription lifecycle event:', eventType);
    return NextResponse.json({ received: true, lifecycle: eventType });
  }

  return NextResponse.json({ received: true, skipped: eventType });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (isPayPalWebhookRequest(request)) {
    return handlePayPalWebhook(request, rawBody);
  }

  return NextResponse.json({ error: 'Unknown webhook provider' }, { status: 400 });
}
