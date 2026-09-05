import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { fulfillOrder } from '@/lib/fulfill-order';
import {
  getPayPalConfig,
  isPayPalWebhookRequest,
  parsePayPalWebhookEvent,
  readPayPalWebhookHeaders,
  verifyPayPalWebhook,
} from '@/lib/paypal';
import { isCheckoutPlanType, normalizeCheckoutPlanType } from '@/constants/checkout-plans';
import { clientIpFromRequest, rateLimit } from '@/lib/rate-limit';
import { lookupUserEmail, notifyFailure } from '@/lib/transactional-email';

export const runtime = 'nodejs';

async function notifyFulfillFailure(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  userId: string,
  orderId: string,
  technicalDetail: string,
  planLabel?: string,
): Promise<void> {
  const userEmail = await lookupUserEmail(admin, userId);
  await notifyFailure({
    scenario: 'payment_fulfill_failed',
    userEmail,
    userId,
    orderId,
    planLabel,
    technicalDetail,
  });
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
  const eventType = event.eventType;
  console.log('[webhook] PayPal event:', eventType, event.resourceId);

  if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'PAYMENT.SALE.COMPLETED') {
    const customId = event.customId;
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

    const externalId = event.resourceId ?? orderRow.external_checkout_id;

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
      await notifyFulfillFailure(admin, orderRow.user_id, orderRow.id, message, planType);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ received: true, provider: 'paypal' });
  }

  if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
    const customId = event.customId;
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

    const subscriptionId = event.resourceId ?? event.billingAgreementId;
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
      await notifyFulfillFailure(admin, orderRow.user_id, orderRow.id, message, planType);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ received: true, provider: 'paypal', subscription: true });
  }

  if (eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
    const customId = event.customId;
    let orderId = customId;
    let userId: string | null = null;
    if (customId) {
      const { data } = await admin
        .from('orders')
        .select('id, user_id, plan_type')
        .eq('id', customId)
        .maybeSingle();
      userId = typeof data?.user_id === 'string' ? data.user_id : null;
    }
    if (!userId && event.resourceId) {
      const { data } = await admin
        .from('orders')
        .select('id, user_id, plan_type')
        .eq('external_checkout_id', event.resourceId)
        .maybeSingle();
      userId = typeof data?.user_id === 'string' ? data.user_id : null;
      if (typeof data?.id === 'string') orderId = data.id;
    }
    const userEmail = userId ? await lookupUserEmail(admin, userId) : null;
    await notifyFailure({
      scenario: 'subscription_payment_failed',
      userEmail,
      userId,
      orderId,
      technicalDetail: eventType,
    });
    return NextResponse.json({ received: true, notified: true });
  }

  if (
    eventType === 'BILLING.SUBSCRIPTION.CANCELLED'
    || eventType === 'BILLING.SUBSCRIPTION.EXPIRED'
    || eventType === 'BILLING.SUBSCRIPTION.SUSPENDED'
  ) {
    console.log('[webhook] subscription lifecycle event:', eventType);
    return NextResponse.json({ received: true, lifecycle: eventType });
  }

  return NextResponse.json({ received: true, skipped: eventType });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const headerMap: Record<string, string | null> = {
    'paypal-transmission-id': request.headers.get('paypal-transmission-id'),
    'paypal-transmission-sig': request.headers.get('paypal-transmission-sig'),
    'paypal-auth-algo': request.headers.get('paypal-auth-algo'),
    'paypal-cert-url': request.headers.get('paypal-cert-url'),
    'paypal-transmission-time': request.headers.get('paypal-transmission-time'),
  };

  if (isPayPalWebhookRequest(headerMap)) {
    return handlePayPalWebhook(request, rawBody);
  }

  return NextResponse.json({ error: 'Unknown webhook provider' }, { status: 400 });
}
