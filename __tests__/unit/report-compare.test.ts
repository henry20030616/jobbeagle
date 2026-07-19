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

  it('has bilingual rows and star depth on shared features', () => {
    expect(REPORT_COMPARE_ROWS.length).toBeGreaterThanOrEqual(8);
    expect(REPORT_COMPARE_TRIGGER.en).toMatch(/Compare/i);

    const starred = REPORT_COMPARE_ROWS.filter(
      (row) => row.snapshot.stars != null && row.guide.stars != null,
    );
    expect(starred.length).toBeGreaterThanOrEqual(3);

    for (const row of REPORT_COMPARE_ROWS) {
      expect(row.feature.en.length).toBeGreaterThan(0);
      expect(row.snapshot.text.en.length).toBeGreaterThan(0);
      expect(row.guide.text.en.length).toBeGreaterThan(0);
    }

    for (const row of starred) {
      expect(row.guide.stars!).toBeGreaterThan(row.snapshot.stars!);
    }
  });
});
