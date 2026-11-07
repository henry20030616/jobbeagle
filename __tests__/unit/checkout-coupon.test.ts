import { afterEach, describe, expect, it } from 'vitest';
import {
  CHECKOUT_COUPON_MIN_PAY_CENTS,
  applyCheckoutCoupon,
  normalizeCouponInput,
} from '@/lib/checkout-coupon';

const ENV_KEYS = ['CHECKOUT_COUPON_CODE', 'CHECKOUT_COUPON_PERCENT_OFF'] as const;

function setCouponEnv(code: string | undefined, percentOff: string | undefined) {
  if (code === undefined) delete process.env.CHECKOUT_COUPON_CODE;
  else process.env.CHECKOUT_COUPON_CODE = code;
  if (percentOff === undefined) delete process.env.CHECKOUT_COUPON_PERCENT_OFF;
  else process.env.CHECKOUT_COUPON_PERCENT_OFF = percentOff;
}

describe('checkout coupon', () => {
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it('normalizes blank coupon input to null', () => {
    expect(normalizeCouponInput('')).toBeNull();
    expect(normalizeCouponInput('  ')).toBeNull();
    expect(normalizeCouponInput(' jbtest ')).toBe('jbtest');
  });

  it('leaves list price unchanged when no coupon is sent', () => {
    setCouponEnv('JBTEST', '95');
    const result = applyCheckoutCoupon({ planType: 'single_job_fit_snapshot' });
    expect(result).toEqual({
      ok: true,
      coupon: null,
      amountCents: 999,
      listAmountCents: 999,
    });
  });

  it('rejects unknown codes', () => {
    setCouponEnv('JBTEST', '95');
    const result = applyCheckoutCoupon({
      planType: 'single_job_fit_snapshot',
      couponCode: 'WRONG',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe('INVALID_COUPON');
  });

  it('applies percent-off to Snapshot and Guide with a $0.50 floor', () => {
    setCouponEnv('JBTEST', '95');
    const snap = applyCheckoutCoupon({
      planType: 'single_job_fit_snapshot',
      couponCode: 'jbtest',
    });
    expect(snap.ok).toBe(true);
    if (!snap.ok || !snap.coupon) throw new Error('expected coupon');
    expect(snap.amountCents).toBe(CHECKOUT_COUPON_MIN_PAY_CENTS);
    expect(snap.listAmountCents).toBe(999);
    expect(snap.coupon.discountCents).toBe(999 - CHECKOUT_COUPON_MIN_PAY_CENTS);
    expect(snap.coupon.percentOff).toBe(95);

    const guide = applyCheckoutCoupon({
      planType: 'single_interview_strategy_guide',
      couponCode: 'JBTEST',
    });
    expect(guide.ok).toBe(true);
    if (!guide.ok) return;
    // 1499 * 5% = 74.95 → 75
    expect(guide.amountCents).toBe(75);
    expect(guide.listAmountCents).toBe(1499);
  });

  it('does not change subscription or sponsor pricing', () => {
    setCouponEnv('JBTEST', '95');
    const sub = applyCheckoutCoupon({
      planType: 'standard_subscription',
      couponCode: 'JBTEST',
    });
    expect(sub.ok).toBe(false);
    if (sub.ok) return;
    expect(sub.errorCode).toBe('COUPON_NOT_ELIGIBLE');

    const sponsor = applyCheckoutCoupon({
      planType: 'author_sponsor',
      couponCode: 'JBTEST',
    });
    expect(sponsor.ok).toBe(false);
    if (sponsor.ok) return;
    expect(sponsor.errorCode).toBe('COUPON_NOT_ELIGIBLE');
  });
});
