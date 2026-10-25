import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  geminiLanguageDirective,
  normalizeReportLanguage,
} from '@/lib/report-language';
import { LITE_SYSTEM_PROMPT, SNAPSHOT_CALIBRATION_RULES } from '@/lib/prompts/lite';
import { applyCallLabel, getGuideUiCopy, getSnapshotUiCopy } from '@/lib/report-ui-copy';

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
    expect(geminiLanguageDirective('zh-TW')).toMatch(/核心適配/);
    expect(geminiLanguageDirective('zh-TW')).toMatch(/never "Core fit:/);
    expect(geminiLanguageDirective('zh-TW')).toMatch(/年資／技能／系統／領域/);
    expect(geminiLanguageDirective('en')).toMatch(/"Core fit:" \/ "Level\/tenure:" \/ "Main gap:"/);
    expect(geminiLanguageDirective('en')).not.toMatch(/never "Core fit:/);
  });

  it('keeps Snapshot and Guide chrome in one language (no zh/en mix for en)', () => {
    const snap = getSnapshotUiCopy('en');
    const guide = getGuideUiCopy('en');
    expect(snap.atsWarningTitle).toMatch(/ATS/i);
    expect(snap.atsWarningTitle).not.toMatch(/淘汰/);
    expect(snap.applyDecision).toBe('Apply advice');
    expect(snap.applyLabels['Apply now']).toBe('Apply now');
    expect(snap.applyLabels['Apply after fixes']).toBe('Apply with caution');
    expect(snap.applyLabels.Skip).toBe("Don't apply");
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
    expect(snap.applyLabels['Apply now']).toBe('應徵');
    expect(snap.applyLabels['Apply after fixes']).toBe('謹慎應徵');
    expect(snap.applyLabels['Apply after fixes']).not.toMatch(/履歷調整後再應徵/);
    expect(snap.applyLabels['Clarify first']).toBe('先釐清再投');
    expect(snap.applyLabels.Skip).toBe('不建議應徵');
    expect(guide.nav.hiring.label).toBe('職位與團隊');
    expect(guide.teamSampleInsufficient).toMatch(/樣本不足/);
    expect(applyCallLabel('Apply now', 'zh-TW')).toBe('應徵');
    expect(applyCallLabel('Apply after fixes', 'zh-TW')).toBe('謹慎應徵');
    expect(applyCallLabel('Clarify first', 'zh-TW')).toBe('先釐清再投');
    expect(applyCallLabel('Skip', 'zh-TW')).toBe('不建議應徵');
    expect(applyCallLabel('Apply after fixes', 'en')).toBe('Apply with caution');
    expect(applyCallLabel('Skip', 'en')).toBe("Don't apply");
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

  it('instructs Flash-Lite that apply_decision is a whether-to-apply call', () => {
    expect(SNAPSHOT_CALIBRATION_RULES).toMatch(/whether-to-apply/);
    expect(SNAPSHOT_CALIBRATION_RULES).not.toContain(
      'Ask the recruiter whether hands-on ACH returns ownership is required or preferred',
    );
    expect(LITE_SYSTEM_PROMPT).toMatch(/label IS the Snapshot apply-advice call/);
    expect(LITE_SYSTEM_PROMPT).toMatch(/Apply now = apply/);
  });

  it('instructs Flash-Lite to emit Chinese labeled prefixes when OUTPUT LANGUAGE is zh-TW', () => {
    expect(LITE_SYSTEM_PROMPT).toMatch(/核心適配：/);
    expect(LITE_SYSTEM_PROMPT).toMatch(/職級／年資：/);
    expect(LITE_SYSTEM_PROMPT).toMatch(/年資／技能／系統／領域/);
    expect(LITE_SYSTEM_PROMPT).toMatch(/Never emit English Kind keys when OUTPUT LANGUAGE is Chinese/);
  });
});
