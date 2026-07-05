import type { SupabaseClient } from '@supabase/supabase-js';
import type { CheckoutPlanType } from '@/constants/checkout-plans';
import { CHECKOUT_PLANS, SUBSCRIPTION_ALLOWANCES } from '@/constants/checkout-plans';

/** Idempotent post-payment fulfillment (Stripe). */
export async function fulfillOrder(
  admin: SupabaseClient,
  orderId: string,
  userId: string,
  planType: CheckoutPlanType,
  reportId: string | null,
  externalPaymentId: string | null,
): Promise<void> {
  const { data: existing } = await admin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .maybeSingle();

  if (existing?.status === 'succeeded') {
    return;
  }

  await admin
    .from('orders')
    .update({
      status: 'succeeded',
      stripe_payment_intent_id: externalPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  const plan = CHECKOUT_PLANS[planType];
  if (!plan) return;

  // New spec plans
  if (plan.liteCredits || plan.fullCredits) {
    await admin.rpc('increment_profile_credits', {
      p_user_id: userId,
      p_lite: plan.liteCredits ?? 0,
      p_full: plan.fullCredits ?? 0,
    });
  }

  if (plan.membershipTier) {
    const allowance = SUBSCRIPTION_ALLOWANCES[plan.membershipTier];
    await admin
      .from('profiles')
      .update({
        membership_tier: plan.membershipTier,
        available_lite_credits: allowance.lite,
        available_full_credits: allowance.full,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  // Legacy: premium report unlock
  if (planType === 'premium_report' && reportId) {
    await admin
      .from('analysis_reports')
      .update({ is_premium: true })
      .eq('id', reportId)
      .eq('user_id', userId);
  }

  // Legacy: bonus credits via user_rewards
  if (planType === 'basic_overage') {
    await admin.rpc('increment_bonus_credits', { p_user_id: userId, p_amount: 1 });
  }
  if (planType === 'monthly_subscription') {
    await admin.rpc('increment_bonus_credits', { p_user_id: userId, p_amount: 30 });
  }
}

/** Reset subscription credits on invoice.paid */
export async function fulfillSubscriptionRenewal(
  admin: SupabaseClient,
  userId: string,
  tier: 'standard_sub' | 'advanced_sub',
): Promise<void> {
  const allowance = SUBSCRIPTION_ALLOWANCES[tier];
  await admin
    .from('profiles')
    .update({
      membership_tier: tier,
      available_lite_credits: allowance.lite,
      available_full_credits: allowance.full,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}
