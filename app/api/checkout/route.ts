import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  CHECKOUT_PLANS,
  isCheckoutPlanType,
  normalizeCheckoutPlanType,
  ACTIVE_CHECKOUT_PLAN_TYPES,
  type CheckoutPlanType,
} from '@/constants/checkout-plans';
import {
  createStripeCheckoutSession,
  getStripeClient,
  getStripeConfig,
  getMissingStripePriceIds,
  resolveStripePriceId,
} from '@/lib/stripe';
import { ensureProfile } from '@/lib/profiles';

export async function POST(request: NextRequest) {
  const stripeConfig = getStripeConfig();
  const stripe = getStripeClient();
  if (!stripeConfig || !stripe) {
    return NextResponse.json(
      {
        error: 'Stripe is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.',
        errorCode: 'STRIPE_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Server configuration error', errorCode: 'SERVER_CONFIG' },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Please log in before checkout', errorCode: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  let body: { planType?: string; reportId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const planTypeRaw = body.planType;
  const planType = planTypeRaw ? normalizeCheckoutPlanType(planTypeRaw) : null;
  if (!planType || !isCheckoutPlanType(planType)) {
    return NextResponse.json(
      { error: 'Invalid planType', errorCode: 'INVALID_PLAN' },
      { status: 400 },
    );
  }

  const priceId = resolveStripePriceId(planType);
  if (!priceId) {
    const missing = getMissingStripePriceIds();
    return NextResponse.json(
      {
        error: `Stripe price not configured for plan "${planType}". Set: ${missing.join(', ')}`,
        errorCode: 'STRIPE_PRICE_MISSING',
        missing,
      },
      { status: 503 },
    );
  }

  const plan = CHECKOUT_PLANS[planType as CheckoutPlanType];
  const reportId: string | null = body.reportId ?? null;
  const amount = plan.amountCents / 100;

  const profile = await ensureProfile(admin, user.id);
  if (profile.deactivated_at) {
    return NextResponse.json(
      {
        error: 'Account is deactivated. Reactivate from Account management.',
        errorCode: 'ACCOUNT_DEACTIVATED',
      },
      { status: 403 },
    );
  }

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      report_id: reportId,
      plan_type: planType,
      amount,
      currency: 'usd',
      status: 'pending',
      payment_provider: 'stripe',
      metadata: { plan_label: plan.labelEn },
    })
    .select('id')
    .single();

  if (orderErr || !order) {
    console.error('[checkout] order insert failed:', orderErr?.message);
    return NextResponse.json(
      { error: 'Could not create order', errorCode: 'ORDER_CREATE_FAILED' },
      { status: 500 },
    );
  }

  const origin = request.nextUrl.origin;
  const successUrl = `${origin}/?checkout=success`;
  const cancelUrl = `${origin}/?checkout=cancel`;

  const metadata: Record<string, string> = {
    order_id: order.id,
    user_id: user.id,
    plan_type: planType,
  };
  if (reportId) metadata.report_id = reportId;

  try {
    const checkoutUrl = await createStripeCheckoutSession(stripe, {
      planType: planType as CheckoutPlanType,
      priceId,
      email: user.email ?? undefined,
      successUrl,
      cancelUrl,
      metadata,
    });

    return NextResponse.json({ url: checkoutUrl, orderId: order.id, provider: 'stripe' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    console.error('[checkout] Stripe create failed:', message);
    await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
    return NextResponse.json(
      { error: message, errorCode: 'STRIPE_ERROR' },
      { status: 500 },
    );
  }
}

export async function GET() {
  const stripeConfig = getStripeConfig();
  const missing = getMissingStripePriceIds();
  return NextResponse.json({
    provider: 'stripe',
    configured: !!stripeConfig,
    missingPrices: missing,
    plans: ACTIVE_CHECKOUT_PLAN_TYPES.map((t) => ({
      ...CHECKOUT_PLANS[t],
      priceConfigured: !!resolveStripePriceId(t),
    })),
  });
}
