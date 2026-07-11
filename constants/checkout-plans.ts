/**
 * Checkout plans — Decoy Pricing matrix (Unified Master Spec 2026)
 * Lemon Squeezy Checkout / Subscriptions
 */

export type CheckoutPlanType =
  | 'single_lite'
  | 'single_full'
  | 'standard_subscription'
  | 'advanced_subscription'
  /** @deprecated legacy Lemon Squeezy */
  | 'basic_overage'
  | 'premium_report'
  | 'monthly_subscription';

export interface CheckoutPlan {
  type: CheckoutPlanType;
  amountCents: number;
  labelEn: string;
  labelZhTW: string;
  /** Credits granted on purchase */
  liteCredits?: number;
  fullCredits?: number;
  membershipTier?: 'standard_sub' | 'advanced_sub';
  isSubscription: boolean;
}

export const CHECKOUT_PLANS: Record<
  CheckoutPlanType,
  CheckoutPlan
> = {
  single_lite: {
    type: 'single_lite',
    amountCents: 300,
    labelEn: 'Single Lite snapshot — $3',
    labelZhTW: '單次精簡快照 — $3',
    liteCredits: 1,
    isSubscription: false,
  },
  single_full: {
    type: 'single_full',
    amountCents: 999,
    labelEn: 'Single Full intel — $9.99',
    labelZhTW: '單次完整情報 — $9.99',
    fullCredits: 1,
    isSubscription: false,
  },
  standard_subscription: {
    type: 'standard_subscription',
    amountCents: 1999,
    labelEn: 'Standard — $19.99/mo (100 Lite + 10 Full)',
    labelZhTW: '標準版 — $19.99/月（100 Lite + 10 Full）',
    liteCredits: 100,
    fullCredits: 10,
    membershipTier: 'standard_sub',
    isSubscription: true,
  },
  advanced_subscription: {
    type: 'advanced_subscription',
    amountCents: 3999,
    labelEn: 'Advanced — $39.99/mo (300 Lite + 30 Full)',
    labelZhTW: '高級版 — $39.99/月（300 Lite + 30 Full）',
    liteCredits: 300,
    fullCredits: 30,
    membershipTier: 'advanced_sub',
    isSubscription: true,
  },
  // Legacy plans (backward compat)
  basic_overage: {
    type: 'basic_overage',
    amountCents: 300,
    labelEn: 'Extra analysis — $3',
    labelZhTW: '超額分析次數 — $3',
    liteCredits: 1,
    isSubscription: false,
  },
  premium_report: {
    type: 'premium_report',
    amountCents: 499,
    labelEn: 'Unlock premium report — $4.99',
    labelZhTW: '解鎖進階報告 — $4.99',
    isSubscription: false,
  },
  monthly_subscription: {
    type: 'monthly_subscription',
    amountCents: 899,
    labelEn: 'Monthly Pro — $8.99/mo',
    labelZhTW: '月費專業版 — $8.99/月',
    liteCredits: 30,
    isSubscription: true,
  },
};

export const ACTIVE_CHECKOUT_PLAN_TYPES: CheckoutPlanType[] = [
  'single_lite',
  'single_full',
  'standard_subscription',
  'advanced_subscription',
];

export const CHECKOUT_PLAN_TYPES = Object.keys(CHECKOUT_PLANS) as CheckoutPlanType[];

export function isCheckoutPlanType(value: string): value is CheckoutPlanType {
  return CHECKOUT_PLAN_TYPES.includes(value as CheckoutPlanType);
}

/** Monthly subscription allowances (reset on invoice.paid) */
export const SUBSCRIPTION_ALLOWANCES = {
  standard_sub: { lite: 100, full: 10 },
  advanced_sub: { lite: 300, full: 30 },
} as const;
