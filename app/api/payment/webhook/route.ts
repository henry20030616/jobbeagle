import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  applyMembershipFromStripeSubscriptions,
  fulfillOrder,
  fulfillSubscriptionRenewal,
} from '@/lib/fulfill-order';
import { findAuthUserIdByEmail } from '@/lib/auth-admin-lookup';
import {
  getStripeClient,
  getStripeConfig,
  verifyStripeSignature,
  listStripeSubscriptionsForEmail,
  parseStripeSubscription,
  type StripeSubscriptionSummary,
} from '@/lib/stripe';
import {
  isCheckoutPlanType,
  normalizeCheckoutPlanType,
} from '@/constants/checkout-plans';

export const runtime = 'nodejs';

const FULFILL_EVENTS = new Set([
  'checkout.session.completed',
  'invoice.payment_succeeded',
]);

const LIFECYCLE_EVENTS = new Set([
  'customer.subscription.deleted',
]);

async function resolveWebhookUserId(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  email: string | null,
  metadata: Record<string, string>,
): Promise<string | null> {
  if (metadata.user_id) return metadata.user_id;
  if (!email) return null;
  return findAuthUserIdByEmail(admin, email);
}

export async function POST(request: NextRequest) {
  const stripeConfig = getStripeConfig();
  const stripe = getStripeClient();
  const admin = getSupabaseAdmin();

  if (!stripeConfig || !stripe || !admin) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  if (!stripeConfig.webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not set' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  const event = verifyStripeSignature(rawBody, signature, stripeConfig.webhookSecret);
  if (!event) {
    console.error('[webhook] Stripe signature invalid');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const eventType = event.type;

  // Handle subscription lifecycle events
  if (LIFECYCLE_EVENTS.has(eventType)) {
    if (eventType === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerEmail = typeof subscription.customer === 'string' 
        ? null 
        : subscription.customer?.email ?? null;

      const userId = await resolveWebhookUserId(admin, customerEmail, subscription.metadata);
      if (!userId) {
        console.error('[webhook] lifecycle missing user', { eventType });
        return NextResponse.json({ received: true, skipped: 'no_user' });
      }

      let subscriptions: StripeSubscriptionSummary[] = [];
      if (customerEmail) {
        try {
          subscriptions = await listStripeSubscriptionsForEmail(stripe, customerEmail);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'list failed';
          console.error('[webhook] lifecycle list', message);
        }
      }

      try {
        await applyMembershipFromStripeSubscriptions(admin, userId, subscriptions, {
          emptyMeans: 'free',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'downgrade failed';
        console.error('[webhook] subscription deleted downgrade', message);
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true, lifecycle: eventType });
  }

  if (!FULFILL_EVENTS.has(eventType)) {
    return NextResponse.json({ received: true, skipped: eventType });
  }

  // Handle checkout.session.completed
  if (eventType === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, skipped: `payment_status_${session.payment_status}` });
    }

    const externalId = session.id;
    const { data: existingByExternal } = await admin
      .from('orders')
      .select('id, status')
      .eq('external_checkout_id', externalId)
      .maybeSingle();

    if (existingByExternal?.status === 'succeeded') {
      return NextResponse.json({ received: true, idempotent: true });
    }

    const metadata = session.metadata ?? {};
    const orderId = metadata.order_id;
    const userId = metadata.user_id;
    const planTypeRaw = metadata.plan_type;
    const reportId = metadata.report_id ?? null;

    const planType = planTypeRaw ? normalizeCheckoutPlanType(planTypeRaw) : null;
    if (!userId || !planType || !isCheckoutPlanType(planType)) {
      console.error('[webhook] missing metadata', { eventType, metadata });
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order_id in metadata' }, { status: 400 });
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
        payment_provider: 'stripe',
      })
      .eq('id', orderId);

    try {
      await fulfillOrder(admin, orderId, userId, planType, reportId, externalId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fulfillment failed';
      console.error('[webhook] fulfill error:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ received: true, provider: 'stripe' });
  }

  // Handle invoice.payment_succeeded (subscription renewals)
  if (eventType === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    
    // Skip if not a subscription invoice
    if (!invoice.subscription) {
      return NextResponse.json({ received: true, skipped: 'not_subscription' });
    }

    // Skip first invoice (already handled by checkout.session.completed)
    if (invoice.billing_reason === 'subscription_create') {
      return NextResponse.json({ received: true, skipped: 'first_invoice' });
    }

    const subscription = typeof invoice.subscription === 'string'
      ? await stripe.subscriptions.retrieve(invoice.subscription)
      : invoice.subscription;

    const customerEmail = typeof invoice.customer === 'string'
      ? null
      : invoice.customer?.email ?? null;

    const userId = await resolveWebhookUserId(admin, customerEmail, subscription.metadata);
    if (!userId) {
      console.error('[webhook] renewal missing user', { eventType });
      return NextResponse.json({ received: true, skipped: 'no_user' });
    }

    const subSummary = parseStripeSubscription(subscription);
    if (!subSummary.membershipTier) {
      return NextResponse.json({ received: true, skipped: 'not_monthly_plan' });
    }

    await fulfillSubscriptionRenewal(admin, userId, subSummary.membershipTier);
    return NextResponse.json({ received: true, renewal: true });
  }

  return NextResponse.json({ received: true, provider: 'stripe' });
}
