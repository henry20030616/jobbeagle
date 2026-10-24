import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  enrichOfferStrategyWithCareerContext,
  enrichTargetGapWithCareerContext,
  formatCareerContextForPrompt,
  normalizeCareerContext,
} from '@/lib/career-context';
import { buildUserParts } from '@/lib/gemini-analyze';
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

  it('enriches offer_strategy with personal floors when the model omitted them', () => {
    const enriched = enrichOfferStrategyWithCareerContext(
      { target: '$170K market mid', acceptable: '$160K', walk_away: '' },
      normalizeCareerContext({ target_tc: '$180K', walk_away_tc: '$155K' }),
    );
    expect(enriched.target).toContain('Your target TC: $180K');
    expect(enriched.walk_away).toContain('Your walk-away: $155K');
  });

  it('includes career_context in the analyze user prompt when present', () => {
    const ctx = normalizeCareerContext({
      target_level: 'Senior BA',
      target_tc: '$180K',
      walk_away_tc: '$155K',
      work_auth: 'US citizen',
    });
    const parts = buildUserParts(
      'We need a Senior BA in NYC.',
      'SQL analyst, 6 YOE.',
      undefined,
      ctx,
      'https://www.linkedin.com/jobs/view/123',
    );
    const text = parts.map((part) => ('text' in part ? part.text : '')).join('\n');
    expect(text).toContain('kind="career_context"');
    expect(text).toContain('Senior BA');
    expect(text).toContain('$180K');
    expect(text).toContain('$155K');
    expect(text).toContain('US citizen');
    expect(text).toContain('kind="job_description"');
    expect(text).toContain('kind="resume"');
    expect(text.indexOf('kind="career_context"')).toBeLessThan(
      text.indexOf('kind="job_description"'),
    );
    expect(text).toContain('expected_offer.target_gap MUST compare');
    expect(text).toContain('offer_strategy target / acceptable / walk_away MUST reference');
  });

  it('omits the career_context fence when the account has no floors', () => {
    const parts = buildUserParts(
      'JD text',
      'Resume text',
      undefined,
      normalizeCareerContext({}),
      null,
    );
    const text = parts.map((part) => ('text' in part ? part.text : '')).join('\n');
    expect(text).not.toContain('kind="career_context"');
    expect(text).toContain('kind="job_description"');
  });

  it('passes careerContext into Snapshot and Guide analyze paths', () => {
    const src = readFileSync(join(process.cwd(), 'lib/gemini-analyze.ts'), 'utf8');
    expect(src).toContain('careerContextBlock: careerBlock || undefined');
    expect(src).toMatch(/executeLiteAnalysis[\s\S]*buildUserParts\([\s\S]*careerContext/);
    expect(src).toMatch(/runPaidGuideModules\(\{[\s\S]*buildUserParts\([\s\S]*careerContext/);
    expect(src).not.toMatch(/systemInstruction:[\s\S]{0,80}careerBlock/);
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
      careerContext: normalizeCareerContext({ target_tc: '$200K', walk_away_tc: '$155K' }),
    });
    expect(withCareer.expected_offer.target_gap).toContain('Your target TC');
    expect(withCareer.offer_strategy.target).toContain('Your target TC');
    expect(withCareer.offer_strategy.walk_away).toContain('Your walk-away: $155K');
  });
});
