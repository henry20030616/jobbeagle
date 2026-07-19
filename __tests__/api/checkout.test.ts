import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import {
  CHECKOUT_PLANS,
  isCheckoutPlanType,
  normalizeCheckoutPlanType,
  ACTIVE_CHECKOUT_PLAN_TYPES,
} from '@/constants/checkout-plans';
import { verifyLemonSqueezySignature } from '@/lib/lemonsqueezy';

describe('checkout plans (Unified Master Spec 2026)', () => {
  it('defines canonical pricing plans', () => {
    expect(CHECKOUT_PLANS.single_job_fit_snapshot.amountCents).toBe(300);
    expect(CHECKOUT_PLANS.single_interview_strategy_guide.amountCents).toBe(999);
    expect(CHECKOUT_PLANS.standard_subscription.amountCents).toBe(1999);
    expect(CHECKOUT_PLANS.advanced_subscription.amountCents).toBe(3999);
  });

  it('active plans include four tiers', () => {
    expect(ACTIVE_CHECKOUT_PLAN_TYPES).toHaveLength(4);
    expect(isCheckoutPlanType('single_job_fit_snapshot')).toBe(true);
    expect(isCheckoutPlanType('single_interview_strategy_guide')).toBe(true);
    expect(isCheckoutPlanType('standard_subscription')).toBe(true);
    expect(isCheckoutPlanType('advanced_subscription')).toBe(true);
    expect(isCheckoutPlanType('invalid')).toBe(false);
  });

  it('normalizes legacy plan codes', () => {
    expect(normalizeCheckoutPlanType('single_lite')).toBe('single_job_fit_snapshot');
    expect(normalizeCheckoutPlanType('single_full')).toBe('single_interview_strategy_guide');
  });

  it('subscription plans grant snapshot and strategy credits', () => {
    expect(CHECKOUT_PLANS.standard_subscription.jobFitSnapshotCredits).toBe(100);
    expect(CHECKOUT_PLANS.standard_subscription.interviewStrategyGuideCredits).toBe(5);
    expect(CHECKOUT_PLANS.advanced_subscription.jobFitSnapshotCredits).toBe(300);
    expect(CHECKOUT_PLANS.advanced_subscription.interviewStrategyGuideCredits).toBe(15);
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
