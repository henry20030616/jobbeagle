import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  CHECKOUT_PLANS,
  isCheckoutPlanType,
  type CheckoutPlanType,
} from '@/constants/checkout-plans';
import { createLemonSqueezyCheckout, getLemonSqueezyConfig } from '@/lib/lemonsqueezy';

export async function POST(request: NextRequest) {
  const ls = getLemonSqueezyConfig();
  if (!ls) {
    return NextResponse.json(
      {
        error: 'Lemon Squeezy is not configured. Set LEMONSQUEEZY_API_KEY, STORE_ID, and variant IDs.',
        errorCode: 'LEMONSQUEEZY_NOT_CONFIGURED',
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
  const { data: { user } } = await supabase.auth.getUser();
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
  let reportId: string | null = body.reportId ?? null;

  if (planType === 'premium_report') {
    if (!reportId) {
      return NextResponse.json(
        { error: 'reportId is required for premium_report', errorCode: 'MISSING_REPORT' },
        { status: 400 },
      );
    }
    const { data: reportRow, error: reportErr } = await admin
      .from('analysis_reports')
      .select('id, user_id, is_premium')
      .eq('id', reportId)
      .maybeSingle();

    if (reportErr || !reportRow || reportRow.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Report not found', errorCode: 'REPORT_NOT_FOUND' },
        { status: 404 },
      );
    }
    if (reportRow.is_premium) {
      return NextResponse.json(
        { error: 'Report is already premium', errorCode: 'ALREADY_PREMIUM' },
        { status: 409 },
      );
    }
  } else {
    reportId = null;
  }

  const amount = plan.amountCents / 100;

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      report_id: reportId,
      plan_type: planType,
      amount,
      currency: 'usd',
      status: 'pending',
      payment_provider: 'lemonsqueezy',
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
  const testMode =
    process.env.LEMONSQUEEZY_TEST_MODE === 'true'
    || process.env.NODE_ENV !== 'production';

  const custom: Record<string, string> = {
    order_id: order.id,
    user_id: user.id,
    plan_type: planType,
  };
  if (reportId) custom.report_id = reportId;

  try {
    const checkoutUrl = await createLemonSqueezyCheckout(ls.apiKey, {
      planType: planType as CheckoutPlanType,
      variantId: ls.variantIds[planType as CheckoutPlanType],
      storeId: ls.storeId,
      email: user.email ?? undefined,
      redirectUrl: `${origin}/?checkout=success`,
      custom,
      testMode,
    });

    return NextResponse.json({ url: checkoutUrl, orderId: order.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lemon Squeezy error';
    console.error('[checkout] Lemon Squeezy create failed:', message);
    await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
    return NextResponse.json(
      { error: message, errorCode: 'LEMONSQUEEZY_ERROR' },
      { status: 500 },
    );
  }
}
