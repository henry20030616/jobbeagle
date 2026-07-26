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
    expect(geminiLanguageDirective('en')).toMatch(/English/);
    expect(geminiLanguageDirective('es')).toMatch(/Spanish/);
  });

  it('keeps Snapshot and Guide chrome in one language (no zh/en mix for en)', () => {
    const snap = getSnapshotUiCopy('en');
    const guide = getGuideUiCopy('en');
    expect(snap.atsWarningTitle).toMatch(/ATS/i);
    expect(snap.atsWarningTitle).not.toMatch(/淘汰/);
    expect(guide.page2Title).toMatch(/Role|team/i);
    expect(guide.page2Title).not.toMatch(/職位/);
    expect(guide.nav.hiring.label).not.toMatch(/職位/);
  });

  it('localizes zh-TW chrome including ATS and Guide nav', () => {
    const snap = getSnapshotUiCopy('zh-TW');
    const guide = getGuideUiCopy('zh-TW');
    expect(snap.atsWarningTitle).toMatch(/ATS/);
    expect(snap.hardSkill).toBe('硬技能');
    expect(guide.nav.hiring.label).toBe('職位與團隊');
    expect(guide.teamSampleInsufficient).toMatch(/樣本不足/);
  });
});
