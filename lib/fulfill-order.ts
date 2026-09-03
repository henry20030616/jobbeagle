import type { SupabaseClient } from '@supabase/supabase-js';
import type { CheckoutPlanType } from '@/constants/checkout-plans';
import {
  CHECKOUT_PLANS,
  SUBSCRIPTION_ALLOWANCES,
  isCheckoutPlanType,
  normalizeCheckoutPlanType,
} from '@/constants/checkout-plans';
import {
  desiredMembershipFromLemonSubscriptions,
  type LemonSubscriptionSummary,
} from '@/lib/lemonsqueezy';
import {
  desiredMembershipFromStripeSubscriptions,
  type StripeSubscriptionSummary,
} from '@/lib/stripe';
import {
  desiredMembershipFromPaddleSubscriptions,
  type PaddleSubscriptionSummary,
} from '@/lib/paddle';

/** Idempotent post-payment fulfillment (Lemon Squeezy). */
export async function fulfillOrder(
  admin: SupabaseClient,
  orderId: string,
  userId: string,
  planType: CheckoutPlanType,
  reportId: string | null,
  externalPaymentId: string | null,
): Promise<void> {
  const canonical = normalizeCheckoutPlanType(planType) ?? planType;

  const { data: existing } = await admin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .maybeSingle();

  if (existing?.status === 'succeeded') {
    return;
  }

  const plan = CHECKOUT_PLANS[canonical] ?? CHECKOUT_PLANS[planType];
  if (!plan) {
    throw new Error(`Unknown plan type: ${planType}`);
  }

  // Grant entitlements BEFORE marking succeeded so webhook retries can recover.
  if (plan.membershipTier) {
    const allowance = SUBSCRIPTION_ALLOWANCES[plan.membershipTier];
    let { error } = await admin.rpc('increment_profile_credits', {
      p_user_id: userId,
      p_job_fit_snapshot: allowance.job_fit_snapshot,
      p_interview_strategy_guide: allowance.interview_strategy_guide,
    });
    if (error) {
      const retry = await admin.rpc('increment_profile_credits', {
        p_user_id: userId,
        p_lite: allowance.job_fit_snapshot,
        p_full: allowance.interview_strategy_guide,
      });
      error = retry.error;
    }
    if (error) throw new Error(error.message);

    const { error: tierErr } = await admin
      .from('profiles')
      .update({
        membership_tier: plan.membershipTier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (tierErr) throw new Error(tierErr.message);
  } else {
    const snapshot = plan.jobFitSnapshotCredits ?? plan.liteCredits ?? 0;
    const strategy = plan.interviewStrategyGuideCredits ?? plan.fullCredits ?? 0;
    if (snapshot || strategy) {
      let { error } = await admin.rpc('increment_profile_credits', {
        p_user_id: userId,
        p_job_fit_snapshot: snapshot,
        p_interview_strategy_guide: strategy,
      });
      if (error) {
        const retry = await admin.rpc('increment_profile_credits', {
          p_user_id: userId,
          p_lite: snapshot,
          p_full: strategy,
        });
        error = retry.error;
      }
      if (error) throw new Error(error.message);
    }
  }

  if (
    (canonical === 'single_interview_strategy_guide' || planType === 'premium_report')
    && reportId
  ) {
    await admin
      .from('analysis_reports')
      .update({ is_premium: true })
      .eq('id', reportId)
      .eq('user_id', userId);
  }

  if (planType === 'basic_overage') {
    try {
      await admin.rpc('increment_bonus_credits', { p_user_id: userId, p_amount: 1 });
    } catch {
      /* legacy RPC may be absent */
    }
  }
  if (planType === 'monthly_subscription') {
    try {
      await admin.rpc('increment_bonus_credits', { p_user_id: userId, p_amount: 30 });
    } catch {
      /* legacy RPC may be absent */
    }
  }

  const { error: orderErr } = await admin
    .from('orders')
    .update({
      status: 'succeeded',
      stripe_payment_intent_id: externalPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (orderErr) throw new Error(orderErr.message);
}

export async function fulfillPaidOrderById(
  admin: SupabaseClient,
  orderId: string,
  externalPaymentId: string,
  provider: 'paypal' | 'paddle',
): Promise<'fulfilled' | 'idempotent' | 'missing'> {
  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, plan_type, report_id, status')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return 'missing';
  if (order.status === 'succeeded') return 'idempotent';

  const planRaw = typeof order.plan_type === 'string' ? order.plan_type : '';
  const planType = normalizeCheckoutPlanType(planRaw);
  if (!planType || !isCheckoutPlanType(planType)) {
    throw new Error('Invalid plan_type on order');
  }

  const userId = typeof order.user_id === 'string' ? order.user_id : '';
  if (!userId) throw new Error('Order missing user_id');

  await admin
    .from('orders')
    .update({
      external_checkout_id: externalPaymentId,
      payment_provider: provider,
    })
    .eq('id', orderId);

  const reportId = typeof order.report_id === 'string' ? order.report_id : null;
  await fulfillOrder(admin, order.id, userId, planType, reportId, externalPaymentId);
  return 'fulfilled';
}

export async function fulfillSubscriptionRenewal(
  admin: SupabaseClient,
  userId: string,
  tier: 'standard_sub' | 'advanced_sub',
): Promise<void> {
  const allowance = SUBSCRIPTION_ALLOWANCES[tier];
  const { error } = await admin
    .from('profiles')
    .update({
      membership_tier: tier,
      available_job_fit_snapshot_credits: allowance.job_fit_snapshot,
      available_interview_strategy_guide_credits: allowance.interview_strategy_guide,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    const retry = await admin
      .from('profiles')
      .update({
        membership_tier: tier,
        available_lite_credits: allowance.job_fit_snapshot,
        available_full_credits: allowance.interview_strategy_guide,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (retry.error) throw new Error(retry.error.message);
  }
}

/** Period ended: drop paid tier, keep leftover credits. */
export async function downgradeExpiredSubscription(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await admin
    .from('profiles')
    .update({
      membership_tier: 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

function isPaidMembershipTier(
  tier: string | null | undefined,
): tier is 'standard_sub' | 'advanced_sub' {
  return tier === 'standard_sub' || tier === 'advanced_sub';
}

/**
 * Align `membership_tier` with Lemon Squeezy (no credit reset).
 * Empty `subscriptions` is left unchanged unless `emptyMeans` is `free`
 * (expire webhook when we know this user had a sub that just ended).
 */
export async function applyMembershipFromLemonSubscriptions(
  admin: SupabaseClient,
  userId: string,
  subscriptions: LemonSubscriptionSummary[],
  opts?: { emptyMeans?: 'unchanged' | 'free'; mode?: 'align' | 'downgrade-only' },
): Promise<'standard_sub' | 'advanced_sub' | 'free' | 'unchanged'> {
  const monthly = subscriptions.filter(
    (s) => s.membershipTier === 'standard_sub' || s.membershipTier === 'advanced_sub',
  );
  if (monthly.length === 0 && opts?.emptyMeans !== 'free') {
    return 'unchanged';
  }

  const desired = desiredMembershipFromLemonSubscriptions(monthly);
  const { data: profile } = await admin
    .from('profiles')
    .select('membership_tier')
    .eq('id', userId)
    .maybeSingle();
  const current = typeof profile?.membership_tier === 'string' ? profile.membership_tier : null;
  if (current === desired) return 'unchanged';

  if (desired === 'free') {
    if (!isPaidMembershipTier(current)) return 'unchanged';
    await downgradeExpiredSubscription(admin, userId);
    return 'free';
  }

  if (opts?.mode === 'downgrade-only') return 'unchanged';

  const { error } = await admin
    .from('profiles')
    .update({
      membership_tier: desired,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  return desired;
}

/**
 * Align `membership_tier` with Stripe (no credit reset).
 * Empty `subscriptions` is left unchanged unless `emptyMeans` is `free`
 * (expire webhook when we know this user had a sub that just ended).
 */
export async function applyMembershipFromStripeSubscriptions(
  admin: SupabaseClient,
  userId: string,
  subscriptions: StripeSubscriptionSummary[],
  opts?: { emptyMeans?: 'unchanged' | 'free'; mode?: 'align' | 'downgrade-only' },
): Promise<'standard_sub' | 'advanced_sub' | 'free' | 'unchanged'> {
  const monthly = subscriptions.filter(
    (s) => s.membershipTier === 'standard_sub' || s.membershipTier === 'advanced_sub',
  );
  if (monthly.length === 0 && opts?.emptyMeans !== 'free') {
    return 'unchanged';
  }

  const desired = desiredMembershipFromStripeSubscriptions(monthly);
  const { data: profile } = await admin
    .from('profiles')
    .select('membership_tier')
    .eq('id', userId)
    .maybeSingle();
  const current = typeof profile?.membership_tier === 'string' ? profile.membership_tier : null;
  if (current === desired) return 'unchanged';

  if (desired === 'free') {
    if (!isPaidMembershipTier(current)) return 'unchanged';
    await downgradeExpiredSubscription(admin, userId);
    return 'free';
  }

  if (opts?.mode === 'downgrade-only') return 'unchanged';

  const { error } = await admin
    .from('profiles')
    .update({
      membership_tier: desired,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  return desired;
}

/**
 * Align `membership_tier` with Paddle (no credit reset).
 * Empty `subscriptions` is left unchanged unless `emptyMeans` is `free`
 * (expire webhook when we know this user had a sub that just ended).
 */
export async function applyMembershipFromPaddleSubscriptions(
  admin: SupabaseClient,
  userId: string,
  subscriptions: PaddleSubscriptionSummary[],
  opts?: { emptyMeans?: 'unchanged' | 'free'; mode?: 'align' | 'downgrade-only' },
): Promise<'standard_sub' | 'advanced_sub' | 'free' | 'unchanged'> {
  const monthly = subscriptions.filter(
    (s) => s.membershipTier === 'standard_sub' || s.membershipTier === 'advanced_sub',
  );
  if (monthly.length === 0 && opts?.emptyMeans !== 'free') {
    return 'unchanged';
  }

  const desired = desiredMembershipFromPaddleSubscriptions(monthly);
  const { data: profile } = await admin
    .from('profiles')
    .select('membership_tier')
    .eq('id', userId)
    .maybeSingle();
  const current = typeof profile?.membership_tier === 'string' ? profile.membership_tier : null;
  if (current === desired) return 'unchanged';

  if (desired === 'free') {
    if (!isPaidMembershipTier(current)) return 'unchanged';
    await downgradeExpiredSubscription(admin, userId);
    return 'free';
  }

  if (opts?.mode === 'downgrade-only') return 'unchanged';

  const { error } = await admin
    .from('profiles')
    .update({
      membership_tier: desired,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  return desired;
}
