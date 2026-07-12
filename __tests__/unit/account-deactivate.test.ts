import { describe, expect, it } from 'vitest';
import { coerceProfileRow } from '@/lib/profiles';

describe('account deactivate profile fields', () => {
  it('coerceProfileRow reads deactivated_at', () => {
    const row = coerceProfileRow({
      id: 'u1',
      membership_tier: 'free',
      available_job_fit_snapshot_credits: 3,
      available_interview_strategy_guide_credits: 0,
      deactivated_at: '2026-07-13T00:00:00.000Z',
    });
    expect(row.deactivated_at).toBe('2026-07-13T00:00:00.000Z');
  });

  it('coerceProfileRow defaults deactivated_at to null', () => {
    const row = coerceProfileRow({
      id: 'u2',
      membership_tier: 'free',
      available_job_fit_snapshot_credits: 3,
      available_interview_strategy_guide_credits: 0,
    });
    expect(row.deactivated_at).toBeNull();
  });
});
