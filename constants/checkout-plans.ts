export type CheckoutPlanType =
  | 'basic_overage'
  | 'premium_report'
  | 'monthly_subscription';

export interface CheckoutPlan {
  type: CheckoutPlanType;
  amountCents: number;
  labelEn: string;
  labelZhTW: string;
}

export const CHECKOUT_PLANS: Record<CheckoutPlanType, CheckoutPlan> = {
  basic_overage: {
    type: 'basic_overage',
    amountCents: 300,
    labelEn: 'Extra analysis — $3',
    labelZhTW: '超額分析次數 — $3',
  },
  premium_report: {
    type: 'premium_report',
    amountCents: 499,
    labelEn: 'Unlock premium report — $4.99',
    labelZhTW: '解鎖進階報告 — $4.99',
  },
  monthly_subscription: {
    type: 'monthly_subscription',
    amountCents: 899,
    labelEn: 'Monthly Pro — $8.99/mo',
    labelZhTW: '月費專業版 — $8.99/月',
  },
};

export const CHECKOUT_PLAN_TYPES = Object.keys(CHECKOUT_PLANS) as CheckoutPlanType[];

export function isCheckoutPlanType(value: string): value is CheckoutPlanType {
  return CHECKOUT_PLAN_TYPES.includes(value as CheckoutPlanType);
}
