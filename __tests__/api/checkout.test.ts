import { describe, it, expect } from 'vitest';
import {
  CHECKOUT_PLANS,
  isCheckoutPlanType,
  normalizeCheckoutPlanType,
  ACTIVE_CHECKOUT_PLAN_TYPES,
  parseSponsorAmountCents,
} from '@/constants/checkout-plans';

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

  it('author_sponsor is a checkout plan but not a product paywall SKU', () => {
    expect(isCheckoutPlanType('author_sponsor')).toBe(true);
    expect(ACTIVE_CHECKOUT_PLAN_TYPES).not.toContain('author_sponsor');
    expect(CHECKOUT_PLANS.author_sponsor.isSubscription).toBe(false);
    expect(CHECKOUT_PLANS.author_sponsor.jobFitSnapshotCredits).toBeUndefined();
  });

  it('parses sponsor USD amounts', () => {
    expect(parseSponsorAmountCents('0.50')).toBe(50);
    expect(parseSponsorAmountCents(1)).toBe(100);
    expect(parseSponsorAmountCents('0.49')).toBeNull();
    expect(parseSponsorAmountCents('1000.01')).toBeNull();
    expect(parseSponsorAmountCents('abc')).toBeNull();
  });

  it('subscription plans grant snapshot and strategy credits', () => {
    expect(CHECKOUT_PLANS.standard_subscription.jobFitSnapshotCredits).toBe(100);
    expect(CHECKOUT_PLANS.standard_subscription.interviewStrategyGuideCredits).toBe(5);
    expect(CHECKOUT_PLANS.advanced_subscription.jobFitSnapshotCredits).toBe(300);
    expect(CHECKOUT_PLANS.advanced_subscription.interviewStrategyGuideCredits).toBe(15);
  });
});
