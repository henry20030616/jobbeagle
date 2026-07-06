import { describe, it, expect } from 'vitest';
import { canAffordReport, canAffordUserProfile } from '@/lib/profiles';
import type { ProfileRow } from '@/lib/profiles';

const freeProfile = (lite: number, full = 0): ProfileRow => ({
  id: 'u1',
  full_name: null,
  avatar_url: null,
  membership_tier: 'free',
  available_lite_credits: lite,
  available_full_credits: full,
  referral_code: null,
  device_fingerprint: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
});

describe('canAffordReport', () => {
  it('free tier allows lite only when credits > 0', () => {
    expect(canAffordReport(freeProfile(3), 'lite')).toBe(true);
    expect(canAffordReport(freeProfile(1), 'lite')).toBe(true);
    expect(canAffordReport(freeProfile(0), 'lite')).toBe(false);
  });

  it('free tier blocks full when full credits are 0', () => {
    expect(canAffordReport(freeProfile(3, 0), 'full')).toBe(false);
    expect(canAffordReport(freeProfile(0, 1), 'full')).toBe(true);
  });

  it('canAffordUserProfile mirrors server check', () => {
    expect(
      canAffordUserProfile(
        { membership_tier: 'free', available_lite_credits: 0, available_full_credits: 0 },
        'lite',
      ),
    ).toBe(false);
  });
});
