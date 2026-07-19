import type { SupabaseClient } from '@supabase/supabase-js';
import type { CheckoutPlanType } from '@/constants/checkout-plans';
import {
  CHECKOUT_PLANS,
  SUBSCRIPTION_ALLOWANCES,
  normalizeCheckoutPlanType,
} from '@/constants/checkout-plans';

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
    const patchNew = {
      membership_tier: plan.membershipTier,
      available_job_fit_snapshot_credits: allowance.job_fit_snapshot,
      available_interview_strategy_guide_credits: allowance.interview_strategy_guide,
      updated_at: new Date().toISOString(),
    };
    let { error } = await admin.from('profiles').update(patchNew).eq('id', userId);
    if (error) {
      const retry = await admin
        .from('profiles')
        .update({
          membership_tier: plan.membershipTier,
          available_lite_credits: allowance.job_fit_snapshot,
          available_full_credits: allowance.interview_strategy_guide,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (retry.error) throw new Error(retry.error.message);
    }
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
