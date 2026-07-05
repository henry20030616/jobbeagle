import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import {
  CHECKOUT_PLANS,
  isCheckoutPlanType,
  ACTIVE_CHECKOUT_PLAN_TYPES,
} from '@/constants/checkout-plans';
import { verifyLemonSqueezySignature } from '@/lib/lemonsqueezy';

describe('checkout plans (Unified Master Spec 2026)', () => {
  it('defines new decoy pricing plans', () => {
    expect(CHECKOUT_PLANS.single_lite.amountCents).toBe(300);
    expect(CHECKOUT_PLANS.single_full.amountCents).toBe(999);
    expect(CHECKOUT_PLANS.standard_subscription.amountCents).toBe(1999);
    expect(CHECKOUT_PLANS.advanced_subscription.amountCents).toBe(3999);
  });

  it('active plans include four tiers', () => {
    expect(ACTIVE_CHECKOUT_PLAN_TYPES).toHaveLength(4);
    expect(isCheckoutPlanType('single_lite')).toBe(true);
    expect(isCheckoutPlanType('single_full')).toBe(true);
    expect(isCheckoutPlanType('standard_subscription')).toBe(true);
    expect(isCheckoutPlanType('advanced_subscription')).toBe(true);
    expect(isCheckoutPlanType('invalid')).toBe(false);
  });

  it('subscription plans grant lite and full credits', () => {
    expect(CHECKOUT_PLANS.standard_subscription.liteCredits).toBe(100);
    expect(CHECKOUT_PLANS.standard_subscription.fullCredits).toBe(10);
    expect(CHECKOUT_PLANS.advanced_subscription.liteCredits).toBe(300);
    expect(CHECKOUT_PLANS.advanced_subscription.fullCredits).toBe(30);
  });
});

describe('Lemon Squeezy webhook signature (legacy)', () => {
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
