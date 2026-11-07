import type { CheckoutPlanType } from '@/constants/checkout-plans';
import { CHECKOUT_PLANS } from '@/constants/checkout-plans';

/** PayPal one-time orders: keep a floor near the sponsor minimum. */
export const CHECKOUT_COUPON_MIN_PAY_CENTS = 50;

export type AppliedCheckoutCoupon = {
  code: string;
  listAmountCents: number;
  amountCents: number;
  discountCents: number;
  percentOff: number;
};

export type CouponApplyResult =
  | { ok: true; coupon: null; amountCents: number; listAmountCents: number }
  | { ok: true; coupon: AppliedCheckoutCoupon; amountCents: number; listAmountCents: number }
  | { ok: false; errorCode: 'INVALID_COUPON' | 'COUPON_NOT_ELIGIBLE'; error: string };

function configuredCoupon(): { code: string; percentOff: number } | null {
  const code = process.env.CHECKOUT_COUPON_CODE?.trim() ?? '';
  if (!code) return null;
  const raw = Number(process.env.CHECKOUT_COUPON_PERCENT_OFF ?? '');
  if (!Number.isFinite(raw) || raw <= 0 || raw >= 100) return null;
  return { code, percentOff: Math.floor(raw) };
}

export function normalizeCouponInput(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Coupons only change the PayPal charge. Credits still follow `planType`.
 * Applies to one-time Snapshot / Guide only — not subscriptions or sponsor.
 */
export function applyCheckoutCoupon(params: {
  planType: CheckoutPlanType;
  couponCode?: unknown;
}): CouponApplyResult {
  const plan = CHECKOUT_PLANS[params.planType];
  const listAmountCents = plan.amountCents;
  const input = normalizeCouponInput(params.couponCode);

  if (!input) {
    return { ok: true, coupon: null, amountCents: listAmountCents, listAmountCents };
  }

  if (plan.isSubscription || params.planType === 'author_sponsor') {
    return {
      ok: false,
      errorCode: 'COUPON_NOT_ELIGIBLE',
      error: 'Coupons apply to Fit Snapshot and Interview Guide one-time purchases only.',
    };
  }

  const configured = configuredCoupon();
  if (!configured || input.toUpperCase() !== configured.code.toUpperCase()) {
    return {
      ok: false,
      errorCode: 'INVALID_COUPON',
      error: 'Invalid coupon code.',
    };
  }

  const remainingPercent = 100 - configured.percentOff;
  const discounted = Math.round((listAmountCents * remainingPercent) / 100);
  const amountCents = Math.max(CHECKOUT_COUPON_MIN_PAY_CENTS, discounted);
  const discountCents = listAmountCents - amountCents;

  return {
    ok: true,
    amountCents,
    listAmountCents,
    coupon: {
      code: configured.code,
      listAmountCents,
      amountCents,
      discountCents,
      percentOff: configured.percentOff,
    },
  };
}
