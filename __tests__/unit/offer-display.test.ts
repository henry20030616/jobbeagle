import { describe, expect, it } from 'vitest';
import {
  evidenceTierLabel,
  formatOfferRange,
  formatPredictedOffer,
  hasOfferRange,
  marketBandDisclaimer,
  offerEvaluationSummary,
  payEstimateScope,
  payEstimateSentence,
  parseMoneyAmount,
  predictedLandGaugeValue,
} from '@/lib/offer-display';

describe('evidenceTierLabel', () => {
  it('maps tiers to plain English', () => {
    expect(evidenceTierLabel('A')).toMatch(/job posting/i);
    expect(evidenceTierLabel('B')).toMatch(/comparable/i);
    expect(evidenceTierLabel('C')).toMatch(/Market salary level/i);
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

describe('predictedLandGaugeValue', () => {
  it('maps land inside the band to 0–100', () => {
    expect(parseMoneyAmount('$155K')).toBe(155000);
    expect(
      predictedLandGaugeValue({
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
    ).toBe(22); // (155-145)/(190-145) ≈ 22%
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

describe('payEstimateScope', () => {
  it('names place, title, and years instead of a vague level', () => {
    const scope = payEstimateScope(
      {
        job_title: 'Senior Business Analyst',
        expected_offer: {
          posted_range: null,
          p25: '$145K',
          p50: '$165K',
          p75: '$190K',
          currency: 'USD',
          region: '美國 · 友善遠端',
          target_gap: '',
          evidence_tier: 'C',
          sources: [],
        },
        hard_filter: {
          items: [
            {
              requirement: '5+ 年 BA／產品營運經驗',
              evidence: '履歷列出金融科技營運相關約 6 年經驗',
            },
          ],
        },
      },
      'zh-TW',
    );
    expect(scope.where).toBe('美國 · 友善遠端');
    expect(scope.role).toBe('Senior Business Analyst');
    expect(scope.level).toContain('5+ 年');
    expect(scope.level).toContain('6 年');
    const sentence = payEstimateSentence(scope, '$145K – $190K', 'USD', 'zh-TW');
    expect(sentence).toContain('地點：美國 · 友善遠端');
    expect(sentence).toContain('職位：Senior Business Analyst');
    expect(sentence).toContain('5+ 年');
    expect(sentence).not.toMatch(/此職級/);
    const disclaimer = marketBandDisclaimer(
      {
        posted_range: null,
        p25: '$145K',
        p50: '$165K',
        p75: '$190K',
        currency: 'USD',
        region: '美國 · 友善遠端',
        target_gap: '',
        evidence_tier: 'C',
        sources: ['Market benchmark for Senior BA / fintech ops (US)'],
      },
      scope,
      'zh-TW',
    );
    expect(disclaimer.nature).toBe('');
    expect(disclaimer.method).toBe(
      '職缺未公布薪資；此區間依職稱、地點與年資對照市場水準，非該公司數據。',
    );
    expect(disclaimer.method).not.toContain('Senior Business Analyst');
    expect(disclaimer.method).not.toContain('美國 · 友善遠端');
    expect(disclaimer.method).not.toMatch(/6 年/);
    expect(disclaimer.method).not.toMatch(/對照依據|擁有權/);
  });
});

describe('marketBandDisclaimer', () => {
  const offer = {
    posted_range: null,
    p25: '$145K',
    p50: '$165K',
    p75: '$190K',
    currency: 'USD',
    region: 'United States · Remote-friendly',
    target_gap: '',
    evidence_tier: 'C' as const,
    sources: ['Market benchmark for Senior BA / fintech ops (US)'],
  };

  it.each(['en', 'zh-TW', 'zh-CN', 'es', 'hi', 'ar'] as const)(
    'keeps %s copy short and does not repeat labeled fields or sources',
    (lang) => {
      const scope = payEstimateScope(
        {
          job_title: 'Senior Business Analyst',
          expected_offer: offer,
          hard_filter: {
            items: [{ requirement: '5+ years BA', evidence: '6 years listed' }],
          },
        },
        lang,
      );
      const disclaimer = marketBandDisclaimer(offer, scope, lang);
      expect(disclaimer.nature).toBe('');
      expect(disclaimer.method.length).toBeGreaterThan(20);
      expect(disclaimer.method.length).toBeLessThan(220);
      expect(disclaimer.method).not.toContain(scope.role);
      expect(disclaimer.method).not.toContain(scope.where);
      expect(disclaimer.method).not.toContain('6 years');
      expect(disclaimer.method).not.toMatch(/對照依據|Benchmark basis|对照依据|example\.com|擁有權|所有权/);
    },
  );

  it('uses posted-field copy for tier A and thin-signal copy for tier D', () => {
    const scope = payEstimateScope({ job_title: 'Senior Business Analyst', expected_offer: offer }, 'en');
    expect(marketBandDisclaimer({ ...offer, evidence_tier: 'A' }, scope, 'en').method).toMatch(
      /posting.s salary field/i,
    );
    expect(marketBandDisclaimer({ ...offer, evidence_tier: 'D' }, scope, 'en').method).toMatch(/too thin/i);
  });
});
