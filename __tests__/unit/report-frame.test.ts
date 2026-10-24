import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  HOMEPAGE_STEP_PILL,
  REPORT_ACTION_TEXT,
  REPORT_TYPE_CARD_ACTIVE,
  REPORT_TYPE_CARD_FILL,
  REPORT_TYPE_CARD_IDLE,
  REPORT_TYPE_LAUNCH_BOX,
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
      REPORT_TYPE_LAUNCH_BOX,
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

  it('step-4 launch inner box reuses selected Snapshot fill and white 2px border', () => {
    expect(REPORT_TYPE_LAUNCH_BOX).toContain(REPORT_TYPE_CARD_FILL);
    expect(REPORT_TYPE_LAUNCH_BOX).toContain(REPORT_TYPE_CARD_ACTIVE);
    expect(REPORT_TYPE_LAUNCH_BOX).toMatch(/border-2/);
    expect(REPORT_TYPE_LAUNCH_BOX).toMatch(/border-white/);
    expect(REPORT_TYPE_LAUNCH_BOX).toMatch(/text-zinc-100/);
    expect(REPORT_TYPE_LAUNCH_BOX).not.toMatch(/indigo|bg-blue-800|#3d3c7c/);
  });

  it('sizes the desktop sample leftover box to 60% of the third-row slot, top-aligned', () => {
    const desktop = readFileSync(join(process.cwd(), 'components/InputForm.tsx'), 'utf8');
    expect(desktop).toContain('STEP_BODY_CARDS');
    expect(desktop).toContain('grid-rows-3');
    expect(desktop).toMatch(
      /flex h-full min-h-0 w-full flex-col justify-start[\s\S]{0,200}href="\/samples"[\s\S]{0,400}h-\[60%\]/,
    );
    expect(desktop).not.toMatch(
      /href="\/samples"[\s\S]{0,500}flex h-full w-full min-h-0 items-center justify-center gap-3 rounded-xl border-2 border-dashed/,
    );
  });

  it('homepage launch buttons use the Snapshot-matched inner box, not a translucent overlay', () => {
    const desktop = readFileSync(join(process.cwd(), 'components/InputForm.tsx'), 'utf8');
    const mobile = readFileSync(join(process.cwd(), 'components/InputFormMobile.tsx'), 'utf8');
    for (const source of [desktop, mobile]) {
      expect(source).toContain('REPORT_TYPE_LAUNCH_BOX');
      expect(source).not.toMatch(/bg-blue-900\/3[05]/);
      expect(source).not.toMatch(/ring-2 ring-blue-300/);
      expect(source).not.toMatch(/shadow-\[0_0_\d+px_rgba\(30,/);
    }
    expect(desktop).toContain('STEP_PILL_ROW_EMPTY');
    expect(desktop).toContain('text-zinc-100');
  });
});
