import { describe, expect, it } from 'vitest';
import {
  normalizeCompetencyMap,
  normalizeInsiderSignals,
  normalizeLeverageAnalysis,
  normalizeMarketPositioning,
  normalizeRiskAssessment,
} from '@/lib/normalize-executive-layer';
import { normalizeFullReport, normalizeLiteReport } from '@/lib/normalize-lite-report';
import { getSampleStrategyGuideReport } from '@/lib/sample-reports';

describe('normalizeCompetencyMap', () => {
  it('returns undefined for non-arrays and empty results', () => {
    expect(normalizeCompetencyMap(undefined)).toBeUndefined();
    expect(normalizeCompetencyMap([{ competency: '' }])).toBeUndefined();
  });

  it('downgrades "demonstrated" without evidence and nulls evidence for "absent"', () => {
    const out = normalizeCompetencyMap([
      { competency: 'SQL', weight: 'core', proficiency: 'demonstrated', resume_evidence: '' },
      { competency: 'ACH', weight: 'core', proficiency: 'absent', resume_evidence: 'made up' },
      {
        competency: 'Stakeholder mgmt',
        weight: 'supporting',
        proficiency: 'demonstrated',
        resume_evidence: 'Led weekly reviews with 4 VPs',
      },
    ]);
    expect(out?.[0].proficiency).toBe('adjacent');
    expect(out?.[0].resume_evidence).toBeNull();
    expect(out?.[1].resume_evidence).toBeNull();
    expect(out?.[2].proficiency).toBe('demonstrated');
  });

  it('caps at 6 items and coerces unknown enums', () => {
    const raw = Array.from({ length: 9 }, (_, i) => ({
      competency: `C${i}`,
      weight: 'bogus',
      proficiency: 'bogus',
    }));
    const out = normalizeCompetencyMap(raw);
    expect(out).toHaveLength(6);
    expect(out?.[0].weight).toBe('supporting');
    expect(out?.[0].proficiency).toBe('absent');
  });
});

describe('normalizeMarketPositioning', () => {
  it('requires rationale and coerces alignment', () => {
    expect(normalizeMarketPositioning({ seniority_alignment: 'at_level' })).toBeNull();
    const out = normalizeMarketPositioning({
      seniority_alignment: 'nonsense',
      rationale: '5 YOE vs 8+ asked.',
      differentiator: '  ',
    });
    expect(out).toEqual({
      seniority_alignment: 'unclear',
      rationale: '5 YOE vs 8+ asked.',
      differentiator: null,
    });
  });
});

describe('normalizeRiskAssessment', () => {
  it('drops invalid categories, coerces basis, sorts high first, scrubs URLs', () => {
    const out = normalizeRiskAssessment([
      { category: 'competency', severity: 'low', statement: 'Minor', basis: 'resume' },
      {
        category: 'role_stability',
        severity: 'high',
        statement: 'Layoffs reported',
        basis: 'weird',
        source_url: 'javascript:alert(1)',
      },
      { category: 'nonsense', severity: 'high', statement: 'x', basis: 'jd' },
    ]);
    expect(out).toHaveLength(2);
    expect(out?.[0].severity).toBe('high');
    expect(out?.[0].basis).toBe('inferred');
    expect(out?.[0].source_url).toBeNull();
  });
});

describe('normalizeLeverageAnalysis', () => {
  it('returns null when nothing usable', () => {
    expect(normalizeLeverageAnalysis({})).toBeNull();
    expect(normalizeLeverageAnalysis(null)).toBeNull();
  });

  it('validates factor URLs and coerces enums', () => {
    const out = normalizeLeverageAnalysis({
      candidate_leverage: 'strong',
      bargaining_posture: 'Anchor high.',
      factors: [
        {
          factor: 'Scarce skill',
          direction: 'for_candidate',
          evidence: 'ACH ownership',
          source_url: 'https://example.com/a',
        },
        { factor: 'Bad link', direction: 'zzz', evidence: 'e', source_url: 'nope' },
      ],
    });
    expect(out?.candidate_leverage).toBe('strong');
    expect(out?.factors[0].source_url).toBe('https://example.com/a');
    expect(out?.factors[1].direction).toBe('neutral');
    expect(out?.factors[1].source_url).toBeNull();
  });
});

describe('normalizeInsiderSignals', () => {
  it('infers source from host and caps tier at 3 when no URL', () => {
    const out = normalizeInsiderSignals([
      {
        source: 'other',
        finding: 'H-1B base wage $150K for Data Analyst',
        url: 'https://h1bdata.info/index.php?em=acme',
        date: '2026-03-01',
        evidence_tier: 1,
      },
      { source: 'blind', finding: 'Heavy on-call', url: '', date: '2026', evidence_tier: 1 },
      { source: 'blind', finding: '', url: 'https://teamblind.com/x' },
    ]);
    expect(out).toHaveLength(2);
    expect(out?.[0].source).toBe('h1bdata');
    expect(out?.[0].evidence_tier).toBe(1);
    expect(out?.[1].evidence_tier).toBe(3);
    expect(out?.[1].url).toBe('');
  });
});

describe('report wiring', () => {
  it('passes the Snapshot executive layer through normalizeLiteReport', () => {
    const base = getSampleStrategyGuideReport();
    const lite = normalizeLiteReport({
      ...base,
      competency_map: [
        { competency: 'SQL', weight: 'core', proficiency: 'demonstrated', resume_evidence: 'x' },
      ],
      market_positioning: { seniority_alignment: 'at_level', rationale: 'ok', differentiator: null },
      risk_assessment: [{ category: 'competency', severity: 'medium', statement: 's', basis: 'jd' }],
    });
    expect(lite.competency_map).toHaveLength(1);
    expect(lite.market_positioning?.seniority_alignment).toBe('at_level');
    expect(lite.risk_assessment).toHaveLength(1);
  });

  it('passes the Guide executive layer through normalizeFullReport', () => {
    const base = getSampleStrategyGuideReport();
    const full = normalizeFullReport({
      ...base,
      leverage_analysis: {
        candidate_leverage: 'moderate',
        bargaining_posture: 'Balanced.',
        factors: [{ factor: 'f', direction: 'neutral', evidence: 'e', source_url: null }],
      },
      insider_signals: [
        { source: 'sec_filing', finding: '10-K cites headcount cuts', url: 'https://www.sec.gov/x', date: '2026-02', evidence_tier: 1 },
      ],
    });
    expect(full.leverage_analysis?.candidate_leverage).toBe('moderate');
    expect(full.insider_signals?.[0].source).toBe('sec_filing');
  });

  it('leaves legacy reports untouched (fields stay undefined)', () => {
    const full = normalizeFullReport(getSampleStrategyGuideReport());
    expect(full.competency_map).toBeUndefined();
    expect(full.leverage_analysis).toBeUndefined();
    expect(full.insider_signals).toBeUndefined();
  });
});
