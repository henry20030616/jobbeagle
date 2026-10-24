import { describe, expect, it } from 'vitest';
import {
  HOMEPAGE_STEP_PILL,
  REPORT_ACTION_TEXT,
  REPORT_TYPE_CARD_ACTIVE,
  REPORT_TYPE_CARD_FILL,
  REPORT_TYPE_CARD_IDLE,
  SAMPLE_RAIL_TEXT,
  SAMPLE_REPORT_TAB_ACTIVE,
  SAMPLE_REPORT_TAB_IDLE,
} from '@/constants/report-frame';

describe('report chrome type scale', () => {
  it('keeps sample-rail and action buttons at display size (not compact chips)', () => {
    expect(SAMPLE_RAIL_TEXT).toMatch(/text-6xl/);
    expect(REPORT_ACTION_TEXT).toMatch(/text-6xl/);
  });
});

describe('homepage step 3 / sample tab fill', () => {
  it('uses dark blue, not indigo or the old purple hex', () => {
    expect(REPORT_TYPE_CARD_FILL).toBe('bg-blue-900');
    const tokens = [
      HOMEPAGE_STEP_PILL,
      REPORT_TYPE_CARD_IDLE,
      REPORT_TYPE_CARD_ACTIVE,
      SAMPLE_REPORT_TAB_IDLE,
      SAMPLE_REPORT_TAB_ACTIVE,
    ];
    for (const token of tokens) {
      expect(token).toMatch(/bg-blue-900/);
      expect(token).toContain(REPORT_TYPE_CARD_FILL);
      expect(token).not.toMatch(/indigo|#3d3c7c|#5a598f|#4a498e/);
    }
    expect(REPORT_TYPE_CARD_ACTIVE).toMatch(/ring-4 ring-white/);
    expect(SAMPLE_REPORT_TAB_ACTIVE).toMatch(/ring-4 ring-white/);
  });
});
