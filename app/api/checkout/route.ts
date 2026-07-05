import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  CHECKOUT_PLANS,
  isCheckoutPlanType,
  ACTIVE_CHECKOUT_PLAN_TYPES,
  type CheckoutPlanType,
} from '@/constants/checkout-plans';
import { createStripeCheckoutSession, getStripe } from '@/lib/stripe';
import { createLemonSqueezyCheckout, getLemonSqueezyConfig } from '@/lib/lemonsqueezy';
import { ensureProfile } from '@/lib/profiles';

export async function POST(request: NextRequest) {
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

  const planType = body.planType;
  if (!planType || !isCheckoutPlanType(planType)) {
    return NextResponse.json(
      { error: 'Invalid planType', errorCode: 'INVALID_PLAN' },
      { status: 400 },
    );
  }

  const plan = CHECKOUT_PLANS[planType as CheckoutPlanType];
  const reportId: string | null = body.reportId ?? null;
  const amount = plan.amountCents / 100;

  const profile = await ensureProfile(admin, user.id);

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      report_id: reportId,
      plan_type: planType,
      amount,
      currency: 'usd',
      status: 'pending',
      payment_provider: getStripe() ? 'stripe' : 'lemonsqueezy',
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
  const successUrl = `${origin}/pre-flight?checkout=success`;
  const cancelUrl = `${origin}/pre-flight?checkout=cancel`;

  // Prefer Stripe (Unified Master Spec)
  const stripe = getStripe();
  if (stripe) {
    try {
      const { url, sessionId } = await createStripeCheckoutSession({
        planType: planType as CheckoutPlanType,
        userId: user.id,
        userEmail: user.email ?? '',
        orderId: order.id,
        reportId,
        successUrl,
        cancelUrl,
        customerId: profile.stripe_customer_id,
      });

      await admin
        .from('orders')
        .update({ stripe_session_id: sessionId })
        .eq('id', order.id);

      return NextResponse.json({ url, orderId: order.id, provider: 'stripe' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Stripe error';
      console.error('[checkout] Stripe failed:', message);
      await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
      return NextResponse.json(
        { error: message, errorCode: 'STRIPE_ERROR' },
        { status: 500 },
      );
    }
  }

  // Fallback: Lemon Squeezy (legacy plans only)
  const ls = getLemonSqueezyConfig();
  const legacyPlans = ['basic_overage', 'premium_report', 'monthly_subscription'];
  if (!legacyPlans.includes(planType)) {
    return NextResponse.json(
      { error: 'Stripe required for this plan. Set STRIPE_SECRET_KEY.', errorCode: 'STRIPE_REQUIRED' },
      { status: 503 },
    );
  }
  if (!ls) {
    return NextResponse.json(
      {
        error: 'Payment not configured. Set STRIPE_SECRET_KEY or Lemon Squeezy env vars.',
        errorCode: 'PAYMENT_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  const testMode =
    process.env.LEMONSQUEEZY_TEST_MODE === 'true' ||
    process.env.NODE_ENV !== 'production';

  const custom: Record<string, string> = {
    order_id: order.id,
    user_id: user.id,
    plan_type: planType,
  };
  if (reportId) custom.report_id = reportId;

  try {
    const variantId = ls.variantIds[planType as CheckoutPlanType];
    if (!variantId) {
      return NextResponse.json({ error: 'Variant not configured' }, { status: 503 });
    }
    const checkoutUrl = await createLemonSqueezyCheckout(ls.apiKey, {
      planType: planType as CheckoutPlanType,
      variantId,
      storeId: ls.storeId,
      email: user.email ?? undefined,
      redirectUrl: successUrl,
      custom,
      testMode,
    });

    return NextResponse.json({ url: checkoutUrl, orderId: order.id, provider: 'lemonsqueezy' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout error';
    await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
    return NextResponse.json({ error: message, errorCode: 'CHECKOUT_ERROR' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    plans: ACTIVE_CHECKOUT_PLAN_TYPES.map((t) => CHECKOUT_PLANS[t]),
  });
}
