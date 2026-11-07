import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  CHECKOUT_PLANS,
  isCheckoutPlanType,
  normalizeCheckoutPlanType,
  ACTIVE_CHECKOUT_PLAN_TYPES,
  parseSponsorAmountCents,
  SPONSOR_ORDERS_PLAN_TYPE_FALLBACK,
  type CheckoutPlanType,
} from '@/constants/checkout-plans';
import {
  createPayPalCheckout,
  getMissingPayPalPlanIds,
  getPayPalConfig,
  resolvePayPalPlanId,
} from '@/lib/paypal';
import { applyCheckoutCoupon } from '@/lib/checkout-coupon';
import { ensureProfile } from '@/lib/profiles';
import { notifyFailure } from '@/lib/transactional-email';

export async function POST(request: NextRequest) {
  const paypalConfig = getPayPalConfig();
  if (!paypalConfig) {
    return NextResponse.json(
      {
        error: 'PayPal is not configured. Set PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and PAYPAL_ENVIRONMENT.',
        errorCode: 'PAYPAL_NOT_CONFIGURED',
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

  let body: {
    planType?: string;
    reportId?: string;
    amountUsd?: unknown;
    couponCode?: unknown;
  };
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

  const plan = CHECKOUT_PLANS[planType as CheckoutPlanType];
  if (plan.isSubscription && !resolvePayPalPlanId(planType as CheckoutPlanType)) {
    const missing = getMissingPayPalPlanIds();
    return NextResponse.json(
      {
        error: `PayPal plan not configured for "${planType}". Set: ${missing.join(', ')}`,
        errorCode: 'PAYPAL_PLAN_MISSING',
        missing,
      },
      { status: 503 },
    );
  }

  let amountCents = plan.amountCents;
  let listAmountCents = plan.amountCents;
  let couponMeta: Record<string, unknown> | null = null;

  if (planType === 'author_sponsor') {
    const parsed = parseSponsorAmountCents(body.amountUsd);
    if (parsed == null) {
      return NextResponse.json(
        {
          error: 'Sponsor amount must be between $0.50 and $1,000.00 USD.',
          errorCode: 'INVALID_SPONSOR_AMOUNT',
        },
        { status: 400 },
      );
    }
    amountCents = parsed;
    listAmountCents = parsed;
  } else {
    const priced = applyCheckoutCoupon({
      planType: planType as CheckoutPlanType,
      couponCode: body.couponCode,
    });
    if (!priced.ok) {
      return NextResponse.json(
        { error: priced.error, errorCode: priced.errorCode },
        { status: 400 },
      );
    }
    amountCents = priced.amountCents;
    listAmountCents = priced.listAmountCents;
    if (priced.coupon) {
      couponMeta = {
        coupon_code: priced.coupon.code,
        coupon_percent_off: priced.coupon.percentOff,
        list_amount_cents: priced.coupon.listAmountCents,
        discount_cents: priced.coupon.discountCents,
        paid_amount_cents: priced.coupon.amountCents,
      };
    }
  }

  const reportId: string | null = body.reportId ?? null;
  const amount = amountCents / 100;

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

  const baseMetadata: Record<string, unknown> = {
    plan_label: plan.labelEn,
    list_amount_cents: listAmountCents,
    paid_amount_cents: amountCents,
    ...(planType === 'author_sponsor'
      ? { amount_cents: amountCents, fulfillment_plan_type: 'author_sponsor' }
      : {}),
    ...(couponMeta ?? {}),
  };

  let { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      report_id: reportId,
      plan_type: planType,
      amount,
      currency: 'usd',
      status: 'pending',
      payment_provider: 'paypal',
      metadata: baseMetadata,
    })
    .select('id')
    .single();

  // Live DB may still reject author_sponsor until migration 014 is applied.
  if (
    planType === 'author_sponsor' &&
    orderErr &&
    /orders_plan_type_check|23514/.test(orderErr.message ?? '')
  ) {
    const retry = await admin
      .from('orders')
      .insert({
        user_id: user.id,
        report_id: reportId,
        plan_type: SPONSOR_ORDERS_PLAN_TYPE_FALLBACK,
        amount,
        currency: 'usd',
        status: 'pending',
        payment_provider: 'paypal',
        metadata: {
          ...baseMetadata,
          fulfillment_plan_type: 'author_sponsor',
          db_plan_type_fallback: SPONSOR_ORDERS_PLAN_TYPE_FALLBACK,
        },
      })
      .select('id')
      .single();
    order = retry.data;
    orderErr = retry.error;
  }

  if (orderErr || !order) {
    console.error('[checkout] order insert failed:', orderErr?.message);
    await notifyFailure({
      scenario: 'checkout_create_failed',
      userEmail: user.email,
      userId: user.id,
      planLabel: plan.labelEn,
      technicalDetail: orderErr?.message ?? 'order insert failed',
    });
    return NextResponse.json(
      { error: 'Could not create order', errorCode: 'ORDER_CREATE_FAILED' },
      { status: 500 },
    );
  }

  const origin = request.nextUrl.origin;
  const cancelUrl = `${origin}/?checkout=cancel`;
  const paypalReturnUrl = `${origin}/api/payment/paypal-return`;

  try {
    const checkoutUrl = await createPayPalCheckout({
      planType: planType as CheckoutPlanType,
      orderId: order.id,
      email: user.email ?? undefined,
      returnUrl: paypalReturnUrl,
      cancelUrl,
      // One-time SKUs (incl. coupon / sponsor): charge this cents amount. Subs use PayPal plan id.
      ...(!plan.isSubscription ? { amountCents } : {}),
    });
    return NextResponse.json({
      url: checkoutUrl,
      orderId: order.id,
      provider: 'paypal',
      amountCents,
      listAmountCents,
      ...(couponMeta ? { coupon: couponMeta } : {}),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PayPal checkout error';
    console.error('[checkout] create failed:', message);
    await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
    await notifyFailure({
      scenario: 'checkout_create_failed',
      userEmail: user.email,
      userId: user.id,
      planLabel: plan.labelEn,
      orderId: order.id,
      technicalDetail: message,
    });
    return NextResponse.json(
      { error: message, errorCode: 'PAYPAL_ERROR' },
      { status: 500 },
    );
  }
}

export async function GET() {
  const paypal = getPayPalConfig();
  if (!paypal) {
    return NextResponse.json({
      provider: 'paypal',
      configured: false,
      error: 'PayPal not configured',
    });
  }

  const missing = getMissingPayPalPlanIds();
  return NextResponse.json({
    provider: 'paypal',
    configured: true,
    environment: paypal.environment,
    missingPrices: missing,
    plans: ACTIVE_CHECKOUT_PLAN_TYPES.map((t) => ({
      ...CHECKOUT_PLANS[t],
      priceConfigured: CHECKOUT_PLANS[t].isSubscription ? !!resolvePayPalPlanId(t) : true,
    })),
  });
}
