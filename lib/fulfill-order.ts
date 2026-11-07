import type { SupabaseClient } from '@supabase/supabase-js';
import type { CheckoutPlanType } from '@/constants/checkout-plans';
import {
  CHECKOUT_PLANS,
  SUBSCRIPTION_ALLOWANCES,
  isCheckoutPlanType,
  normalizeCheckoutPlanType,
  resolveOrderCheckoutPlanType,
} from '@/constants/checkout-plans';

export type FulfillClaimResult = 'fulfilled' | 'idempotent' | 'missing';

function entitlementAmounts(plan: (typeof CHECKOUT_PLANS)[CheckoutPlanType]): {
  snapshot: number;
  strategy: number;
  membershipTier: 'standard_sub' | 'advanced_sub' | null;
} {
  if (plan.membershipTier) {
    const allowance = SUBSCRIPTION_ALLOWANCES[plan.membershipTier];
    return {
      snapshot: allowance.job_fit_snapshot,
      strategy: allowance.interview_strategy_guide,
      membershipTier: plan.membershipTier,
    };
  }
  return {
    snapshot: plan.jobFitSnapshotCredits ?? plan.liteCredits ?? 0,
    strategy: plan.interviewStrategyGuideCredits ?? plan.fullCredits ?? 0,
    membershipTier: null,
  };
}

/**
 * Idempotent post-payment fulfillment.
 * Credits + order status flip run in one DB transaction (FOR UPDATE claim)
 * so paypal-return and webhook cannot both increment.
 */
export async function fulfillOrder(
  admin: SupabaseClient,
  orderId: string,
  userId: string,
  planType: CheckoutPlanType,
  reportId: string | null,
  externalPaymentId: string | null,
): Promise<void> {
  const canonical = normalizeCheckoutPlanType(planType) ?? planType;
  const plan = CHECKOUT_PLANS[canonical] ?? CHECKOUT_PLANS[planType];
  if (!plan) {
    throw new Error(`Unknown plan type: ${planType}`);
  }

  const { snapshot, strategy, membershipTier } = entitlementAmounts(plan);

  const { data: claimResult, error: claimErr } = await admin.rpc(
    'claim_and_fulfill_order_entitlements',
    {
      p_order_id: orderId,
      p_user_id: userId,
      p_job_fit_snapshot: snapshot,
      p_interview_strategy_guide: strategy,
      p_membership_tier: membershipTier,
      p_external_payment_id: externalPaymentId,
    },
  );

  if (claimErr) {
    if (isClaimRpcMissing(claimErr.message)) {
      console.warn(
        '[fulfill] claim_and_fulfill_order_entitlements missing — using claim-first legacy path. Apply migration 015.',
      );
      await fulfillOrderLegacyClaimFirst(
        admin,
        orderId,
        userId,
        planType,
        canonical,
        reportId,
        externalPaymentId,
        snapshot,
        strategy,
        membershipTier,
      );
      return;
    }
    throw new Error(claimErr.message);
  }

  const result = (typeof claimResult === 'string' ? claimResult : '') as FulfillClaimResult;
  if (result === 'missing') {
    throw new Error(`Order not found: ${orderId}`);
  }
  if (result === 'idempotent') {
    return;
  }
  if (result !== 'fulfilled') {
    throw new Error(`Unexpected fulfill claim result: ${String(claimResult)}`);
  }

  await applyFulfillSideEffects(admin, {
    canonical,
    planType,
    userId,
    reportId,
  });
}

function isClaimRpcMissing(message: string): boolean {
  return /claim_and_fulfill_order_entitlements|Could not find the function|PGRST202|42883/i.test(
    message,
  );
}

/**
 * Fallback when migration 015 is not applied yet.
 * Claims the order (pending → succeeded) before granting credits so concurrent
 * return+webhook cannot both increment. Prefer the SQL RPC in production.
 */
async function fulfillOrderLegacyClaimFirst(
  admin: SupabaseClient,
  orderId: string,
  userId: string,
  planType: CheckoutPlanType,
  canonical: CheckoutPlanType,
  reportId: string | null,
  externalPaymentId: string | null,
  snapshot: number,
  strategy: number,
  membershipTier: 'standard_sub' | 'advanced_sub' | null,
): Promise<void> {
  const { data: existing } = await admin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .maybeSingle();

  if (!existing) {
    throw new Error(`Order not found: ${orderId}`);
  }
  if (existing.status === 'succeeded') {
    return;
  }

  const { data: claimed, error: claimErr } = await admin
    .from('orders')
    .update({
      status: 'succeeded',
      stripe_payment_intent_id: externalPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (claimErr) throw new Error(claimErr.message);
  if (!claimed) {
    // Lost the race to another fulfiller (or status was not pending).
    return;
  }

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

  if (membershipTier) {
    const { error: tierErr } = await admin
      .from('profiles')
      .update({
        membership_tier: membershipTier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (tierErr) throw new Error(tierErr.message);
  }

  await applyFulfillSideEffects(admin, {
    canonical,
    planType,
    userId,
    reportId,
  });
}

async function applyFulfillSideEffects(
  admin: SupabaseClient,
  params: {
    canonical: CheckoutPlanType;
    planType: CheckoutPlanType;
    userId: string;
    reportId: string | null;
  },
): Promise<void> {
  if (params.canonical === 'single_interview_strategy_guide' && params.reportId) {
    await admin
      .from('analysis_reports')
      .update({ is_premium: true })
      .eq('id', params.reportId)
      .eq('user_id', params.userId);
  }

  if (params.planType === 'basic_overage') {
    try {
      await admin.rpc('increment_bonus_credits', { p_user_id: params.userId, p_amount: 1 });
    } catch {
      /* legacy RPC may be absent */
    }
  }
}

export async function fulfillPaidOrderById(
  admin: SupabaseClient,
  orderId: string,
  externalPaymentId: string,
  provider: 'paypal' | 'paddle',
): Promise<'fulfilled' | 'idempotent' | 'missing'> {
  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, plan_type, report_id, status, metadata')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return 'missing';
  if (order.status === 'succeeded') return 'idempotent';

  const planType = resolveOrderCheckoutPlanType(order.plan_type, order.metadata);
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

/** Marker stored on subscription orders after BILLING.SUBSCRIPTION.ACTIVATED. */
export const SUBSCRIPTION_ACTIVATED_MARKER = '__activated__';

function readProcessedSaleIds(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return [];
  const raw = (metadata as Record<string, unknown>).processed_sale_ids;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/**
 * After ACTIVATED fulfillment: stamp the order so the paired first SALE
 * does not reset monthly credits again.
 */
export async function markSubscriptionActivated(
  admin: SupabaseClient,
  orderId: string,
  existingMetadata: unknown,
): Promise<void> {
  const processed = readProcessedSaleIds(existingMetadata);
  if (processed.includes(SUBSCRIPTION_ACTIVATED_MARKER)) return;
  const base =
    existingMetadata && typeof existingMetadata === 'object' && !Array.isArray(existingMetadata)
      ? { ...(existingMetadata as Record<string, unknown>) }
      : {};
  const { error } = await admin
    .from('orders')
    .update({
      metadata: {
        ...base,
        processed_sale_ids: [...processed, SUBSCRIPTION_ACTIVATED_MARKER],
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
  if (error) throw new Error(error.message);
}

export type SubscriptionSaleResult =
  | 'idempotent'
  | 'initial_sale_recorded'
  | 'renewed'
  | 'not_subscription';

/**
 * Handle PAYMENT.SALE/CAPTURE on an already-succeeded subscription order.
 * - First sale after ACTIVATED → record only (credits already granted).
 * - Later sales (new sale id) → reset monthly allowance via fulfillSubscriptionRenewal.
 */
export async function recordSubscriptionSaleAndMaybeRenew(
  admin: SupabaseClient,
  order: {
    id: string;
    user_id: string;
    plan_type: string;
    metadata?: unknown;
  },
  saleId: string,
): Promise<SubscriptionSaleResult> {
  const planType = resolveOrderCheckoutPlanType(order.plan_type, order.metadata);
  if (!planType || !isCheckoutPlanType(planType)) return 'not_subscription';
  const plan = CHECKOUT_PLANS[planType];
  if (!plan.isSubscription || !plan.membershipTier) return 'not_subscription';

  const processed = readProcessedSaleIds(order.metadata);
  if (processed.includes(saleId)) return 'idempotent';

  const priorSales = processed.filter((id) => id !== SUBSCRIPTION_ACTIVATED_MARKER);
  const nextProcessed = [...processed, saleId];
  const base =
    order.metadata && typeof order.metadata === 'object' && !Array.isArray(order.metadata)
      ? { ...(order.metadata as Record<string, unknown>) }
      : {};

  const { error: metaErr } = await admin
    .from('orders')
    .update({
      metadata: { ...base, processed_sale_ids: nextProcessed },
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);
  if (metaErr) throw new Error(metaErr.message);

  // Credits already granted on ACTIVATED (or on first pending→succeeded SALE).
  if (priorSales.length === 0) {
    return 'initial_sale_recorded';
  }

  await fulfillSubscriptionRenewal(admin, order.user_id, plan.membershipTier);
  return 'renewed';
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
