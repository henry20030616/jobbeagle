/**
 * Checkout plans — Lemon Squeezy
 * Canonical plan codes use Job Fit Snapshot / Interview Strategy Guide terminology.
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
  | 'basic_overage'
  | 'premium_report'
  | 'monthly_subscription';

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
    amountCents: 300,
    labelEn: 'Job Fit Snapshot — $3',
    labelZhTW: 'Job Fit Snapshot — $3',
    jobFitSnapshotCredits: 1,
    isSubscription: false,
  }),
  single_interview_strategy_guide: withCreditAliases({
    type: 'single_interview_strategy_guide',
    amountCents: 999,
    labelEn: 'Interview Strategy Guide — $9.99',
    labelZhTW: 'Interview Strategy Guide — $9.99',
    interviewStrategyGuideCredits: 1,
    isSubscription: false,
  }),
  /** @deprecated alias → single_job_fit_snapshot */
  single_lite: withCreditAliases({
    type: 'single_lite',
    amountCents: 300,
    labelEn: 'Job Fit Snapshot — $3',
    labelZhTW: 'Job Fit Snapshot — $3',
    jobFitSnapshotCredits: 1,
    isSubscription: false,
  }),
  /** @deprecated alias → single_interview_strategy_guide */
  single_full: withCreditAliases({
    type: 'single_full',
    amountCents: 999,
    labelEn: 'Interview Strategy Guide — $9.99',
    labelZhTW: 'Interview Strategy Guide — $9.99',
    interviewStrategyGuideCredits: 1,
    isSubscription: false,
  }),
  standard_subscription: withCreditAliases({
    type: 'standard_subscription',
    amountCents: 1999,
    labelEn: 'Standard — $19.99/mo (100 Job Fit Snapshot + 5 Interview Strategy Guide)',
    labelZhTW: '標準版 — $19.99/月（100 Job Fit Snapshot + 5 Interview Strategy Guide）',
    jobFitSnapshotCredits: 100,
    interviewStrategyGuideCredits: 5,
    membershipTier: 'standard_sub',
    isSubscription: true,
  }),
  advanced_subscription: withCreditAliases({
    type: 'advanced_subscription',
    amountCents: 3999,
    labelEn: 'Advanced — $39.99/mo (300 Job Fit Snapshot + 15 Interview Strategy Guide)',
    labelZhTW: '高級版 — $39.99/月（300 Job Fit Snapshot + 15 Interview Strategy Guide）',
    jobFitSnapshotCredits: 300,
    interviewStrategyGuideCredits: 15,
    membershipTier: 'advanced_sub',
    isSubscription: true,
  }),
  basic_overage: withCreditAliases({
    type: 'basic_overage',
    amountCents: 300,
    labelEn: 'Extra Job Fit Snapshot — $3',
    labelZhTW: '加購 Job Fit Snapshot — $3',
    jobFitSnapshotCredits: 1,
    isSubscription: false,
  }),
  premium_report: {
    type: 'premium_report',
    amountCents: 499,
    labelEn: 'Unlock Interview Strategy Guide — $4.99',
    labelZhTW: '解鎖 Interview Strategy Guide — $4.99',
    isSubscription: false,
  },
  monthly_subscription: withCreditAliases({
    type: 'monthly_subscription',
    amountCents: 899,
    labelEn: 'Monthly Pro — $8.99/mo',
    labelZhTW: '月費專業版 — $8.99/月',
    jobFitSnapshotCredits: 30,
    isSubscription: true,
  }),
  author_sponsor: withCreditAliases({
    type: 'author_sponsor',
    amountCents: 50,
    labelEn: 'Sponsor the author',
    labelZhTW: '贊助作者',
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
  if (v === 'single_full' || v === 'premium_report') return 'single_interview_strategy_guide';
  if (isCheckoutPlanType(v)) return v;
  return null;
}

export function isCheckoutPlanType(value: string): value is CheckoutPlanType {
  return CHECKOUT_PLAN_TYPES.includes(value as CheckoutPlanType);
}

export const SUBSCRIPTION_ALLOWANCES = {
  standard_sub: { job_fit_snapshot: 100, interview_strategy_guide: 5 },
  advanced_sub: { job_fit_snapshot: 300, interview_strategy_guide: 15 },
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
