import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';
import { fulfillSubscriptionRenewal } from '@/lib/fulfill-order';
import {
  CHECKOUT_PLANS,
  normalizeCheckoutPlanType,
} from '@/constants/checkout-plans';
import {
  getPaddleClient,
  getPaddleConfig,
  listPaddleSubscriptionsForEmail,
  isLivePaddleSubscription,
} from '@/lib/paddle';
import {
  findLivePayPalSubscription,
  getPayPalConfig,
} from '@/lib/paypal';

export const runtime = 'nodejs';

/**
 * Pull active Paddle subscription for the signed-in user and
 * reset monthly Snapshot/Guide balances to the plan allowance.
 */
export async function POST() {
  const paypal = getPayPalConfig();
  const paddleConfig = getPaddleConfig();
  const paddle = getPaddleClient();
  const admin = getSupabaseAdmin();
  if ((!paypal && (!paddleConfig || !paddle)) || !admin) {
    return NextResponse.json(
      { error: 'Billing sync is not configured', errorCode: 'SERVER_CONFIG' },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json(
      { error: 'Please log in', errorCode: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  await ensureProfile(admin, user.id, {
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url,
  });

  if (paypal) {
    let live;
    try {
      live = await findLivePayPalSubscription(admin, user.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PayPal error';
      console.error('[sync-subscription]', message);
      return NextResponse.json(
        { error: message, errorCode: 'PAYPAL_ERROR' },
        { status: 502 },
      );
    }
    if (!live) {
      return NextResponse.json({
        synced: false,
        reason: 'no_active_subscription',
        message: 'No active Standard/Advanced subscription found for this PayPal account.',
      });
    }
    const { data: order } = await admin
      .from('orders')
      .select('plan_type')
      .eq('external_checkout_id', live.id)
      .maybeSingle();
    const planType =
      typeof order?.plan_type === 'string' ? normalizeCheckoutPlanType(order.plan_type) : null;
    const tier = planType ? CHECKOUT_PLANS[planType]?.membershipTier : undefined;
    if (tier !== 'standard_sub' && tier !== 'advanced_sub') {
      return NextResponse.json({
        synced: false,
        reason: 'unknown_plan',
        message: 'PayPal subscription is active but the plan type is missing on the order.',
      });
    }
    await fulfillSubscriptionRenewal(admin, user.id, tier);
    const { data: profile } = await admin
      .from('profiles')
      .select(
        'membership_tier, available_job_fit_snapshot_credits, available_interview_strategy_guide_credits, available_lite_credits, available_full_credits',
      )
      .eq('id', user.id)
      .maybeSingle();
    return NextResponse.json({
      synced: true,
      membership_tier: tier,
      plan_type: planType,
      paypal_subscription_id: live.id,
      credits: {
        job_fit_snapshot:
          profile?.available_job_fit_snapshot_credits
          ?? profile?.available_lite_credits
          ?? null,
        interview_strategy_guide:
          profile?.available_interview_strategy_guide_credits
          ?? profile?.available_full_credits
          ?? null,
      },
    });
  }

  if (!paddle) {
    return NextResponse.json(
      { error: 'Billing is not configured', errorCode: 'SERVER_CONFIG' },
      { status: 503 },
    );
  }

  let subscriptions;
  try {
    subscriptions = await listPaddleSubscriptionsForEmail(paddle, user.email);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Paddle error';
    console.error('[sync-subscription]', message);
    return NextResponse.json(
      { error: message, errorCode: 'PADDLE_ERROR' },
      { status: 502 },
    );
  }

  const active = subscriptions.filter(
    (s) =>
      isLivePaddleSubscription(s)
      && (s.membershipTier === 'standard_sub' || s.membershipTier === 'advanced_sub'),
  );

  if (active.length === 0) {
    return NextResponse.json({
      synced: false,
      reason: 'no_active_subscription',
      message:
        'No active Standard/Advanced subscription found for this email on Paddle.',
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        status: s.status,
        planType: s.planType,
        currentBillingPeriodEndsAt: s.currentBillingPeriodEndsAt,
      })),
    });
  }

  // Prefer Advanced if both somehow present
  const chosen =
    active.find((s) => s.membershipTier === 'advanced_sub') ?? active[0]!;

  await fulfillSubscriptionRenewal(admin, user.id, chosen.membershipTier!);

  const { data: profile } = await admin
    .from('profiles')
    .select(
      'membership_tier, available_job_fit_snapshot_credits, available_interview_strategy_guide_credits, available_lite_credits, available_full_credits',
    )
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    synced: true,
    membership_tier: chosen.membershipTier,
    plan_type: chosen.planType,
    paddle_subscription_id: chosen.id,
    current_billing_period_ends_at: chosen.currentBillingPeriodEndsAt,
    credits: {
      job_fit_snapshot:
        profile?.available_job_fit_snapshot_credits
        ?? profile?.available_lite_credits
        ?? null,
      interview_strategy_guide:
        profile?.available_interview_strategy_guide_credits
        ?? profile?.available_full_credits
        ?? null,
    },
  });
}
