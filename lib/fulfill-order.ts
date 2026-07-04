import type { SupabaseClient } from '@supabase/supabase-js';
import type { CheckoutPlanType } from '@/constants/checkout-plans';

/** Idempotent post-payment fulfillment (Lemon Squeezy / legacy Stripe). */
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

  if (planType === 'premium_report' && reportId) {
    await admin
      .from('analysis_reports')
      .update({ is_premium: true })
      .eq('id', reportId)
      .eq('user_id', userId);
    return;
  }

  if (planType === 'basic_overage') {
    await admin.rpc('increment_bonus_credits', { p_user_id: userId, p_amount: 1 });
    return;
  }

  if (planType === 'monthly_subscription') {
    await admin.rpc('increment_bonus_credits', { p_user_id: userId, p_amount: 30 });
  }
}
