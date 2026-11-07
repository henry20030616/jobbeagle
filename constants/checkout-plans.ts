/**
 * Checkout plans — PayPal
 * Canonical plan codes use Fit Snapshot / Interview Guide terminology.
 *
 * US pricing (2026-11): Snapshot $9.99 · Guide $14.99 ·
 * Standard $19.99/mo (50+5) · Advanced $39.99/mo (100+15).
 * Subscription dollar amounts on PayPal Billing Plans must match these figures
 * in the PayPal dashboard (`PAYPAL_PLAN_STANDARD_SUB` / `PAYPAL_PLAN_ADVANCED_SUB`).
 */

export type CheckoutPlanType =
  | 'single_job_fit_snapshot'
  | 'single_interview_strategy_guide'
  | 'standard_subscription'
  | 'advanced_subscription'
  | 'author_sponsor'
  /** @deprecated aliases — normalize via normalizeCheckoutPlanType() */
  | 'single_lite'
  | 'single_full'
  | 'basic_overage';

export interface CheckoutPlan {
  type: CheckoutPlanType;
  amountCents: number;
  labelEn: string;
  labelZhTW: string;
  jobFitSnapshotCredits?: number;
  interviewStrategyGuideCredits?: number;
  /** @deprecated aliases */
  liteCredits?: number;
  fullCredits?: number;
  membershipTier?: 'standard_sub' | 'advanced_sub';
  isSubscription: boolean;
}

function withCreditAliases<T extends CheckoutPlan>(plan: T): T {
  return {
    ...plan,
    liteCredits: plan.jobFitSnapshotCredits ?? plan.liteCredits,
    fullCredits: plan.interviewStrategyGuideCredits ?? plan.fullCredits,
  };
}

export const CHECKOUT_PLANS: Record<CheckoutPlanType, CheckoutPlan> = {
  single_job_fit_snapshot: withCreditAliases({
    type: 'single_job_fit_snapshot',
    amountCents: 999,
    labelEn: 'Fit Snapshot — $9.99',
    labelZhTW: '適配快照 — $9.99',
    jobFitSnapshotCredits: 1,
    isSubscription: false,
  }),
  single_interview_strategy_guide: withCreditAliases({
    type: 'single_interview_strategy_guide',
    amountCents: 1499,
    labelEn: 'Interview Guide — $14.99',
    labelZhTW: '面試指南 — $14.99',
    interviewStrategyGuideCredits: 1,
    isSubscription: false,
  }),
  /** @deprecated alias → single_job_fit_snapshot */
  single_lite: withCreditAliases({
    type: 'single_lite',
    amountCents: 999,
    labelEn: 'Fit Snapshot — $9.99',
    labelZhTW: '適配快照 — $9.99',
    jobFitSnapshotCredits: 1,
    isSubscription: false,
  }),
  /** @deprecated alias → single_interview_strategy_guide */
  single_full: withCreditAliases({
    type: 'single_full',
    amountCents: 1499,
    labelEn: 'Interview Guide — $14.99',
    labelZhTW: '面試指南 — $14.99',
    interviewStrategyGuideCredits: 1,
    isSubscription: false,
  }),
  standard_subscription: withCreditAliases({
    type: 'standard_subscription',
    amountCents: 1999,
    labelEn: 'Standard — $19.99/mo (50 Fit Snapshot + 5 Interview Guide)',
    labelZhTW: '標準版 — $19.99/月（50 次適配快照 + 5 次面試指南）',
    jobFitSnapshotCredits: 50,
    interviewStrategyGuideCredits: 5,
    membershipTier: 'standard_sub',
    isSubscription: true,
  }),
  advanced_subscription: withCreditAliases({
    type: 'advanced_subscription',
    amountCents: 3999,
    labelEn: 'Advanced — $39.99/mo (100 Fit Snapshot + 15 Interview Guide)',
    labelZhTW: '高級版 — $39.99/月（100 次適配快照 + 15 次面試指南）',
    jobFitSnapshotCredits: 100,
    interviewStrategyGuideCredits: 15,
    membershipTier: 'advanced_sub',
    isSubscription: true,
  }),
  basic_overage: withCreditAliases({
    type: 'basic_overage',
    amountCents: 999,
    labelEn: 'Extra Fit Snapshot — $9.99',
    labelZhTW: '加購適配快照 — $9.99',
    jobFitSnapshotCredits: 1,
    isSubscription: false,
  }),
  author_sponsor: withCreditAliases({
    type: 'author_sponsor',
    amountCents: 50,
    labelEn: 'Sponsor JobBeagle',
    labelZhTW: '贊助 JobBeagle',
    isSubscription: false,
  }),
};

export const ACTIVE_CHECKOUT_PLAN_TYPES: CheckoutPlanType[] = [
  'single_job_fit_snapshot',
  'single_interview_strategy_guide',
  'standard_subscription',
  'advanced_subscription',
];

export const CHECKOUT_PLAN_TYPES = Object.keys(CHECKOUT_PLANS) as CheckoutPlanType[];

export function normalizeCheckoutPlanType(value: string): CheckoutPlanType | null {
  const v = value.trim();
  if (v === 'single_lite' || v === 'basic_overage') return 'single_job_fit_snapshot';
  if (v === 'single_full') return 'single_interview_strategy_guide';
  if (v === 'premium_report' || v === 'monthly_subscription') return null;
  if (isCheckoutPlanType(v)) return v;
  return null;
}

/**
 * Legacy `orders.plan_type` CHECK allowed this value before `author_sponsor`
 * existed. Used only as a DB column stand-in when the live constraint still
 * rejects `author_sponsor`; real SKU is always in metadata.fulfillment_plan_type.
 */
export const SPONSOR_ORDERS_PLAN_TYPE_FALLBACK = 'premium_report';

export function resolveOrderCheckoutPlanType(
  planType: unknown,
  metadata: unknown,
): CheckoutPlanType | null {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const fulfillment = (metadata as Record<string, unknown>).fulfillment_plan_type;
    if (typeof fulfillment === 'string' && isCheckoutPlanType(fulfillment)) {
      return normalizeCheckoutPlanType(fulfillment) ?? fulfillment;
    }
  }
  if (typeof planType !== 'string') return null;
  return normalizeCheckoutPlanType(planType);
}

export function isCheckoutPlanType(value: string): value is CheckoutPlanType {
  return CHECKOUT_PLAN_TYPES.includes(value as CheckoutPlanType);
}

export const SUBSCRIPTION_ALLOWANCES = {
  standard_sub: { job_fit_snapshot: 50, interview_strategy_guide: 5 },
  advanced_sub: { job_fit_snapshot: 100, interview_strategy_guide: 15 },
} as const;

/** PayPal USD one-time orders: $0.50 avoids many card-minimum failures. */
export const SPONSOR_AMOUNT_MIN_CENTS = 50;
export const SPONSOR_AMOUNT_MAX_CENTS = 100_000;

/** Parse a buyer-entered USD amount for `author_sponsor`. */
export function parseSponsorAmountCents(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const cents = Math.round(raw * 100);
    if (cents < SPONSOR_AMOUNT_MIN_CENTS || cents > SPONSOR_AMOUNT_MAX_CENTS) return null;
    return cents;
  }
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  if (!Number.isFinite(cents)) return null;
  if (cents < SPONSOR_AMOUNT_MIN_CENTS || cents > SPONSOR_AMOUNT_MAX_CENTS) return null;
  return cents;
}
