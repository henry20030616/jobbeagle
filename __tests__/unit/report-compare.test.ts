import { describe, expect, it } from 'vitest';
import {
  REPORT_COMPARE_ROWS,
  REPORT_COMPARE_TRIGGER,
  REPORT_COMPARE_WHY_PRO,
  resolveCompareLang,
} from '@/constants/report-compare';

describe('report-compare', () => {
  it('resolves language for the compare modal', () => {
    expect(resolveCompareLang('en')).toBe('en');
    expect(resolveCompareLang('zh-TW')).toBe('zh-TW');
    expect(resolveCompareLang('es')).toBe('en');
  });

  it('explains why Pro / deep report matters', () => {
    expect(REPORT_COMPARE_WHY_PRO.bullets.length).toBeGreaterThanOrEqual(3);
    expect(REPORT_COMPARE_WHY_PRO.title.en).toMatch(/professional/i);
  });

  it('puts Best for first, then shared (stars) → guide-only → price', () => {
    expect(REPORT_COMPARE_TRIGGER.en).toMatch(/Compare/i);

    const sections = REPORT_COMPARE_ROWS.map((r) => r.section);
    expect(REPORT_COMPARE_ROWS[0]?.feature.en).toBe('Best for');
    expect(sections[0]).toBe('best_for');
    const shared = REPORT_COMPARE_ROWS.filter((r) => r.section === 'shared');
    expect(shared.map((r) => r.feature['zh-TW'])).toEqual([
      '職位核心解析',
      '匹配分數、履歷分析',
      '市場薪資水準',
    ]);
    const guideOnly = REPORT_COMPARE_ROWS.filter((r) => r.section === 'guide_only');
    expect(guideOnly.map((r) => r.feature['zh-TW'])).toEqual([
      '個人化薪資落點',
      '公司與職位評價',
      '面試真題準備',
      '面試談判建議',
    ]);
    expect(REPORT_COMPARE_ROWS.some((r) => r.feature.en === 'Live web search')).toBe(false);
    expect(shared[0]?.snapshot.text.en).not.toMatch(/no web/i);
    expect(sections.filter((s) => s === 'shared').length).toBe(3);
    expect(sections.filter((s) => s === 'guide_only').length).toBe(4);
    expect(sections.filter((s) => s === 'meta').length).toBeGreaterThanOrEqual(1);

    const firstGuide = sections.indexOf('guide_only');
    const firstMeta = sections.indexOf('meta');
    const lastShared = sections.lastIndexOf('shared');
    expect(lastShared).toBeLessThan(firstGuide);
    expect(firstGuide).toBeLessThan(firstMeta);

    for (const row of REPORT_COMPARE_ROWS) {
      expect(row.feature.en.length).toBeGreaterThan(0);
      expect(row.help.en.length).toBeGreaterThan(20);
      expect(row.help['zh-TW'].length).toBeGreaterThan(10);
      expect(`${row.help.en} ${row.help['zh-TW']} ${row.help['zh-CN']}`).not.toMatch(
        /50\s*[–-]\s*100|0\s*[–-]\s*100/,
      );
      expect(row.snapshot.text.en.length).toBeGreaterThan(0);
      expect(row.guide.text.en.length).toBeGreaterThan(0);
      if (row.section === 'shared') {
        expect(row.snapshot.stars).toBeGreaterThanOrEqual(1);
        expect(row.guide.stars).toBeGreaterThanOrEqual(row.snapshot.stars!);
        expect(row.guide.stars).toBeLessThanOrEqual(5);
      } else {
        expect(row.snapshot.stars).toBeUndefined();
        expect(row.guide.stars).toBeUndefined();
      }
    }
  });
});
