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

  it('groups shared → guide-only → meta without star ratings', () => {
    expect(REPORT_COMPARE_TRIGGER.en).toMatch(/Compare/i);

    const sections = REPORT_COMPARE_ROWS.map((r) => r.section);
    expect(sections.filter((s) => s === 'shared').length).toBeGreaterThanOrEqual(3);
    expect(sections.filter((s) => s === 'guide_only').length).toBeGreaterThanOrEqual(3);
    expect(sections.filter((s) => s === 'meta').length).toBeGreaterThanOrEqual(2);

    // Shared comes before guide-only; guide-only before meta
    const firstGuide = sections.indexOf('guide_only');
    const firstMeta = sections.indexOf('meta');
    const lastShared = sections.lastIndexOf('shared');
    expect(lastShared).toBeLessThan(firstGuide);
    expect(firstGuide).toBeLessThan(firstMeta);

    for (const row of REPORT_COMPARE_ROWS) {
      expect(row.feature.en.length).toBeGreaterThan(0);
      expect(row.snapshot.text.en.length).toBeGreaterThan(0);
      expect(row.guide.text.en.length).toBeGreaterThan(0);
      expect(row).not.toHaveProperty('stars');
    }
  });
});
