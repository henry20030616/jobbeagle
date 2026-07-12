import { describe, it, expect } from 'vitest';
import { canAffordReport, canAffordUserProfile } from '@/lib/profiles';
import type { ProfileRow } from '@/lib/profiles';
import { REPORT_CODES } from '@/constants/report-products';

const freeProfile = (snapshot: number, strategy = 0): ProfileRow => ({
  id: 'u1',
  full_name: null,
  avatar_url: null,
  membership_tier: 'free',
  available_job_fit_snapshot_credits: snapshot,
  available_interview_strategy_guide_credits: strategy,
  referral_code: null,
  device_fingerprint: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
});

describe('canAffordReport', () => {
  it('free tier allows Job Fit Snapshot only when credits > 0', () => {
    expect(canAffordReport(freeProfile(3), REPORT_CODES.JOB_FIT_SNAPSHOT)).toBe(true);
    expect(canAffordReport(freeProfile(1), 'lite')).toBe(true);
    expect(canAffordReport(freeProfile(0), REPORT_CODES.JOB_FIT_SNAPSHOT)).toBe(false);
  });

  it('free tier blocks Interview Strategy Guide when strategy credits are 0', () => {
    expect(canAffordReport(freeProfile(3, 0), REPORT_CODES.INTERVIEW_STRATEGY_GUIDE)).toBe(false);
    expect(canAffordReport(freeProfile(0, 1), 'full')).toBe(true);
  });

  it('canAffordUserProfile mirrors server check and accepts legacy fields', () => {
    expect(
      canAffordUserProfile(
        { membership_tier: 'free', available_lite_credits: 0, available_full_credits: 0 },
        REPORT_CODES.JOB_FIT_SNAPSHOT,
      ),
    ).toBe(false);
    expect(
      canAffordUserProfile(
        {
          membership_tier: 'free',
          available_job_fit_snapshot_credits: 2,
          available_interview_strategy_guide_credits: 0,
        },
        REPORT_CODES.JOB_FIT_SNAPSHOT,
      ),
    ).toBe(true);
  });
});
