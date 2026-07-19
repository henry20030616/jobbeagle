import { describe, expect, it } from 'vitest';
import {
  REPORT_COMPARE_ROWS,
  REPORT_COMPARE_TRIGGER,
  resolveCompareLang,
} from '@/constants/report-compare';

describe('report-compare', () => {
  it('resolves language for the compare modal', () => {
    expect(resolveCompareLang('en')).toBe('en');
    expect(resolveCompareLang('zh-TW')).toBe('zh-TW');
    expect(resolveCompareLang('es')).toBe('en');
  });

  it('has bilingual rows for Snapshot vs Guide', () => {
    expect(REPORT_COMPARE_ROWS.length).toBeGreaterThanOrEqual(8);
    expect(REPORT_COMPARE_TRIGGER.en).toMatch(/Compare/i);
    for (const row of REPORT_COMPARE_ROWS) {
      expect(row.feature.en.length).toBeGreaterThan(0);
      expect(row.snapshot.en.length).toBeGreaterThan(0);
      expect(row.guide.en.length).toBeGreaterThan(0);
    }
  });
});
