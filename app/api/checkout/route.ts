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
  createLemonSqueezyCheckout,
  getLemonSqueezyConfig,
  getMissingLemonSqueezyVariants,
  resolveLemonSqueezyVariant,
} from '@/lib/lemonsqueezy';
import { ensureProfile } from '@/lib/profiles';

export async function POST(request: NextRequest) {
  const ls = getLemonSqueezyConfig();
  if (!ls) {
    return NextResponse.json(
      {
        error: 'Lemon Squeezy is not configured. Set LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID.',
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

  const variantId = resolveLemonSqueezyVariant(planType);
  if (!variantId) {
    const missing = getMissingLemonSqueezyVariants();
    return NextResponse.json(
      {
        error: `Lemon Squeezy variant not configured for plan "${planType}". Set: ${missing.join(', ')}`,
        errorCode: 'LEMONSQUEEZY_VARIANT_MISSING',
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
  const successUrl = `${origin}/?checkout=success`;

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
      variantId,
      storeId: ls.storeId,
      email: user.email ?? undefined,
      redirectUrl: successUrl,
      custom,
      testMode,
    });

    return NextResponse.json({ url: checkoutUrl, orderId: order.id, provider: 'lemonsqueezy' });
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

export async function GET() {
  const ls = getLemonSqueezyConfig();
  const missing = getMissingLemonSqueezyVariants();
  return NextResponse.json({
    provider: 'lemonsqueezy',
    configured: !!ls,
    missingVariants: missing,
    plans: ACTIVE_CHECKOUT_PLAN_TYPES.map((t) => ({
      ...CHECKOUT_PLANS[t],
      variantConfigured: !!resolveLemonSqueezyVariant(t),
    })),
  });
}
