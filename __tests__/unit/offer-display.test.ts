import { describe, expect, it } from 'vitest';
import {
  evidenceTierLabel,
  formatOfferRange,
  formatPredictedOffer,
  hasOfferRange,
  offerEvaluationSummary,
} from '@/lib/offer-display';

describe('evidenceTierLabel', () => {
  it('maps tiers to plain English', () => {
    expect(evidenceTierLabel('A')).toMatch(/job posting/i);
    expect(evidenceTierLabel('B')).toMatch(/comparable/i);
    expect(evidenceTierLabel('C')).toMatch(/Market estimate/i);
    expect(evidenceTierLabel('D')).toMatch(/too thin/i);
  });
});

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

describe('formatPredictedOffer', () => {
  it('returns the candidate land point', () => {
    expect(
      formatPredictedOffer({
        posted_range: null,
        p25: '$145K',
        p50: '$165K',
        p75: '$190K',
        currency: 'USD',
        region: 'US',
        target_gap: '',
        evidence_tier: 'C',
        sources: [],
        candidate_predicted_offer: '$155K',
      }),
    ).toBe('$155K');
  });

  it('returns null when missing', () => {
    expect(
      formatPredictedOffer({
        posted_range: null,
        p25: null,
        p50: null,
        p75: null,
        currency: 'USD',
        region: 'US',
        target_gap: '',
        evidence_tier: 'D',
        sources: [],
        candidate_predicted_offer: null,
      }),
    ).toBeNull();
  });
});

describe('offerEvaluationSummary', () => {
  it('explains market value of the role, not tier glossary', () => {
    const summary = offerEvaluationSummary({
      posted_range: null,
      p25: '$85K',
      p50: '$100K',
      p75: '$125K',
      currency: 'USD',
      region: 'APAC',
      target_gap: 'JD does not provide a range.',
      evidence_tier: 'C',
      sources: ['BLS-style market band'],
    });
    expect(summary.headline).toMatch(/Market value/i);
    expect(summary.headline).toContain('$85K – $125K');
    expect(summary.body).toMatch(/comparable roles/i);
    expect(summary.body).not.toMatch(/Tier C —/i);
    expect(summary.note).toContain('JD does not provide');
  });

  it('uses posted range as the clearest market signal', () => {
    const summary = offerEvaluationSummary({
      posted_range: '$160K – $190K',
      p25: null,
      p50: null,
      p75: null,
      currency: 'USD',
      region: 'United States',
      target_gap: '',
      evidence_tier: 'A',
      sources: [],
      candidate_position_label: 'Mid-band is realistic.',
    });
    expect(summary.headline).toContain('$160K – $190K');
    expect(summary.body).toMatch(/employer disclosed/i);
    expect(summary.note).toContain('Mid-band');
  });
});
