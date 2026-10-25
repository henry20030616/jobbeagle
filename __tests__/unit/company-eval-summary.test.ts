import { describe, expect, it } from 'vitest';
import {
  resolveCompanyEvalSummaries,
  splitLegacyCompanySummary,
} from '@/lib/company-eval-summary';
import { SAMPLE_GUIDE_NARRATIVE } from '@/lib/sample-guide-locale';

describe('company eval summary split', () => {
  it('splits a labeled 6-bullet blob into employer vs seat columns', () => {
    const split = splitLegacyCompanySummary(SAMPLE_GUIDE_NARRATIVE['zh-TW'].company_summary);
    expect(split.summary_company).toMatch(/^文化：/);
    expect(split.summary_company).toMatch(/營運風險：/);
    expect(split.summary_company).toMatch(/簽證與遠端：/);
    expect(split.summary_company).toMatch(/待確認：/);
    expect(split.summary_role).toMatch(/職位對照：/);
    expect(split.summary_role).toMatch(/交付節奏：/);
    expect(split.summary_company).not.toMatch(/職位對照：/);
    expect(split.summary_role).not.toMatch(/^文化：/m);
  });

  it('keeps writing-module columns when they already exist', () => {
    const resolved = resolveCompanyEvalSummaries({
      summary: 'Culture: leftover blob that must not win.',
      summary_company: 'Culture: written ops.',
      summary_role: 'Seat vs posting: day one is returns.',
    });
    expect(resolved.summary_company).toBe('Culture: written ops.');
    expect(resolved.summary_role).toBe('Seat vs posting: day one is returns.');
    expect(resolved.summary).toContain('Culture: written ops.');
    expect(resolved.summary).toContain('Seat vs posting: day one is returns.');
  });

  it('halves an unlabeled legacy blob', () => {
    const split = splitLegacyCompanySummary('Employer pace is tight.\nSeat on-call is weekly.\nDay-one scope is returns.');
    expect(split.summary_company.split('\n').length).toBeGreaterThanOrEqual(1);
    expect(split.summary_role.split('\n').length).toBeGreaterThanOrEqual(1);
  });
});
