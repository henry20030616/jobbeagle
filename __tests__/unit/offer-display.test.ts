import { describe, expect, it } from 'vitest';
import { formatOfferRange, hasOfferRange } from '@/lib/offer-display';

describe('formatOfferRange', () => {
  it('prefers posted range', () => {
    expect(
      formatOfferRange({
        posted_range: '$150K – $180K',
        p25: '$140K',
        p50: '$160K',
        p75: '$190K',
        currency: 'USD',
        region: 'US',
        target_gap: '',
        evidence_tier: 'A',
        sources: [],
      }),
    ).toBe('$150K – $180K');
  });

  it('builds low–high from percentiles without P labels', () => {
    expect(
      formatOfferRange({
        posted_range: null,
        p25: '$130K',
        p50: '$165K',
        p75: '$210K',
        currency: 'USD',
        region: 'US',
        target_gap: '',
        evidence_tier: 'C',
        sources: [],
      }),
    ).toBe('$130K – $210K');
    expect(hasOfferRange({
      posted_range: null,
      p25: null,
      p50: null,
      p75: null,
      currency: 'USD',
      region: 'US',
      target_gap: '',
      evidence_tier: 'D',
      sources: [],
    })).toBe(false);
  });
});
