import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import {
  CHECKOUT_PLANS,
  isCheckoutPlanType,
} from '@/constants/checkout-plans';
import { verifyLemonSqueezySignature } from '@/lib/lemonsqueezy';

describe('checkout plans', () => {
  it('defines three plan types with expected prices', () => {
    expect(CHECKOUT_PLANS.basic_overage.amountCents).toBe(300);
    expect(CHECKOUT_PLANS.premium_report.amountCents).toBe(499);
    expect(CHECKOUT_PLANS.monthly_subscription.amountCents).toBe(899);
  });

  it('validates plan type strings', () => {
    expect(isCheckoutPlanType('basic_overage')).toBe(true);
    expect(isCheckoutPlanType('premium_report')).toBe(true);
    expect(isCheckoutPlanType('monthly_subscription')).toBe(true);
    expect(isCheckoutPlanType('invalid')).toBe(false);
  });
});

describe('Lemon Squeezy webhook signature', () => {
  it('verifies valid HMAC signature', () => {
    const secret = 'test_secret';
    const body = '{"meta":{"event_name":"order_created"}}';
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyLemonSqueezySignature(body, sig, secret)).toBe(true);
  });

  it('rejects invalid signature', () => {
    const body = '{}';
    expect(verifyLemonSqueezySignature(body, 'bad', 'secret')).toBe(false);
  });
});
