import { describe, it, expect } from 'vitest';
import type { LiteReport } from '@/types';

describe('LiteReport schema', () => {
  it('validates required fields from spec', () => {
    const report: LiteReport = {
      match_score: 68,
      dog_breed_archetype: 'German Shepherd',
      one_sentence_sharp_critique: 'You lack the required Kubernetes depth for this Staff SRE role.',
      flsa_status: 'Exempt (Professional Exemption)',
      radford_2026_compensation_matrix: {
        tier_25th_low: '$145K',
        tier_50th_mid: '$175K',
        tier_75th_high: '$210K',
      },
    };
    expect(report.match_score).toBeGreaterThanOrEqual(0);
    expect(report.radford_2026_compensation_matrix.tier_50th_mid).toBeTruthy();
  });
});
