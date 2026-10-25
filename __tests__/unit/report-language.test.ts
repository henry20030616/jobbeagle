import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  geminiLanguageDirective,
  normalizeReportLanguage,
} from '@/lib/report-language';
import { getGuideUiCopy, getSnapshotUiCopy } from '@/lib/report-ui-copy';

describe('report language', () => {
  it('normalizes legacy zh and unknown codes', () => {
    expect(normalizeReportLanguage('zh')).toBe('zh-TW');
    expect(normalizeReportLanguage('zh-TW')).toBe('zh-TW');
    expect(normalizeReportLanguage('nope')).toBe('en');
    expect(normalizeReportLanguage(undefined)).toBe('en');
  });

  it('builds a Gemini directive that names the target language', () => {
    expect(geminiLanguageDirective('zh-TW')).toMatch(/Traditional Chinese/);
    expect(geminiLanguageDirective('zh-TW')).toMatch(/職位 \/ 這職位/);
    expect(geminiLanguageDirective('zh-TW')).toMatch(/never 席位/);
    expect(geminiLanguageDirective('zh-CN')).toMatch(/职位 \/ 这职位/);
    expect(geminiLanguageDirective('en')).toMatch(/English/);
    expect(geminiLanguageDirective('en')).not.toMatch(/席位/);
    expect(geminiLanguageDirective('es')).toMatch(/Spanish/);
  });

  it('keeps Snapshot and Guide chrome in one language (no zh/en mix for en)', () => {
    const snap = getSnapshotUiCopy('en');
    const guide = getGuideUiCopy('en');
    expect(snap.atsWarningTitle).toMatch(/ATS/i);
    expect(snap.atsWarningTitle).not.toMatch(/淘汰/);
    expect(snap.applyDecision).toBe('Apply advice');
    expect(snap.applyLabels['Apply after fixes']).toBe('Apply advice');
    expect(guide.page2Title).toMatch(/Role|team/i);
    expect(guide.page2Title).not.toMatch(/職位/);
    expect(guide.nav.hiring.label).not.toMatch(/職位/);
  });

  it('localizes zh-TW chrome including ATS and Guide nav', () => {
    const snap = getSnapshotUiCopy('zh-TW');
    const guide = getGuideUiCopy('zh-TW');
    expect(snap.atsWarningTitle).toMatch(/ATS/);
    expect(snap.hardSkill).toBe('硬技能');
    expect(snap.applyDecision).toBe('應徵建議');
    expect(snap.applyLabels['Apply after fixes']).toBe('應徵建議');
    expect(snap.applyLabels['Apply after fixes']).not.toMatch(/履歷調整後再應徵/);
    expect(guide.nav.hiring.label).toBe('職位與團隊');
    expect(guide.teamSampleInsufficient).toMatch(/樣本不足/);
  });

  it('does not call a job opening 席位 in user-facing copy', () => {
    const files = [
      'lib/sample-guide-locale.ts',
      'lib/report-ui-copy.ts',
      'lib/executive-ui-copy.ts',
      'lib/sample-reports.ts',
      'lib/sample-report-locales.ts',
      'constants/homepage-form-copy.ts',
      'constants/report-compare.ts',
      'constants/account-nav.ts',
      'constants/features.ts',
    ];
    const banned = /席位|這席|該席|此席|一席|本席|这席|该席/;
    for (const file of files) {
      const text = readFileSync(join(process.cwd(), file), 'utf8');
      expect(text, file).not.toMatch(banned);
    }
  });
});
