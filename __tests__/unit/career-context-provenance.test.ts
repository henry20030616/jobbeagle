import { describe, expect, it } from 'vitest';
import {
  enrichTargetGapWithCareerContext,
  formatCareerContextForPrompt,
  normalizeCareerContext,
} from '@/lib/career-context';
import {
  buildProvenanceRecord,
  isValidHttpUrl,
  scrubInsightUrls,
} from '@/lib/provenance';
import { normalizeFullReport } from '@/lib/normalize-lite-report';
import { getSampleStrategyGuideReport } from '@/lib/sample-reports';

describe('career context', () => {
  it('formats prompt only when signals exist', () => {
    expect(formatCareerContextForPrompt(normalizeCareerContext({}))).toBe('');
    const block = formatCareerContextForPrompt(
      normalizeCareerContext({ target_tc: '$180K', walk_away_tc: '$155K' }),
    );
    expect(block).toContain('Target total compensation: $180K');
    expect(block).toContain('Walk-away floor: $155K');
  });

  it('enriches target_gap with personal floors', () => {
    const gap = enrichTargetGapWithCareerContext('Market mid-band.', {
      target_level: '',
      location_or_remote: '',
      work_auth: '',
      target_tc: '$180K',
      walk_away_tc: '$155K',
      non_negotiables: '',
      signature_strengths: '',
    });
    expect(gap).toContain('Your target TC: $180K');
    expect(gap).toContain('Your walk-away: $155K');
  });
});

describe('provenance', () => {
  it('validates http(s) URLs', () => {
    expect(isValidHttpUrl('https://www.reuters.com/a')).toBe(true);
    expect(isValidHttpUrl('not-a-url')).toBe(false);
    expect(isValidHttpUrl('ftp://x.com')).toBe(false);
  });

  it('scrubs invalid insight URLs', () => {
    const out = scrubInsightUrls([
      { claim: 'ok', source_url: 'https://example.com/x', date: '2026-06' },
      { claim: 'bad', source_url: 'javascript:alert(1)', date: '2026' },
    ]);
    expect(out[0].source_url).toContain('https://');
    expect(out[1].source_url).toBe('');
  });

  it('builds provenance record with invalid count', () => {
    const rec = buildProvenanceRecord({
      reportVersion: 'v3',
      insights: [
        { claim: 'A', source_url: 'https://a.com', date: '2026-01' },
        { claim: 'B', source_url: 'notaurl', date: '2026' },
      ],
    });
    expect(rec.invalid_url_count).toBe(1);
    expect(rec.entries).toHaveLength(2);
  });
});

describe('sample guide extras', () => {
  it('normalizes candidate_case, tc_breakdown, provenance', () => {
    const report = getSampleStrategyGuideReport();
    expect(report.candidate_case?.top_facts.length).toBeGreaterThanOrEqual(3);
    expect(report.offer_strategy.tc_breakdown?.base).toBeTruthy();
    expect(report.provenance?.report_version).toBeTruthy();
    expect(report.apply_decision.label).toBeTruthy();
    expect(report.fit_score.breakdown.length).toBe(5);

    const withCareer = normalizeFullReport(report, {
      careerContext: normalizeCareerContext({ target_tc: '$200K' }),
    });
    expect(withCareer.expected_offer.target_gap).toContain('Your target TC');
  });
});
