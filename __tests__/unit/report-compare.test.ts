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
    expect(sections.filter((s) => s === 'shared').length).toBeGreaterThanOrEqual(3);
    expect(sections.filter((s) => s === 'guide_only').length).toBeGreaterThanOrEqual(3);
    expect(sections.filter((s) => s === 'meta').length).toBeGreaterThanOrEqual(1);

    const firstGuide = sections.indexOf('guide_only');
    const firstMeta = sections.indexOf('meta');
    const lastShared = sections.lastIndexOf('shared');
    expect(lastShared).toBeLessThan(firstGuide);
    expect(firstGuide).toBeLessThan(firstMeta);

    for (const row of REPORT_COMPARE_ROWS) {
      expect(row.feature.en.length).toBeGreaterThan(0);
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
