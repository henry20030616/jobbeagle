import { describe, it, expect } from 'vitest';
import { computeFitScale } from '@/lib/fit-scale';
import {
  DOC_DESIGN_WIDTH,
  SHORTS_DESIGN_WIDTH,
  SHORTS_DESIGN_HEIGHT,
} from '@/constants/fit-stage';

describe('computeFitScale — docs (enlarge-only)', () => {
  it('stays fluid below design width', () => {
    const r = computeFitScale({
      availW: 1280,
      availH: 800,
      designWidth: DOC_DESIGN_WIDTH,
      minScale: 1,
      maxScale: 2.6,
    });
    expect(r.fluid).toBe(true);
    expect(r.scale).toBe(1);
  });

  it('enlarges on ultrawide', () => {
    const r = computeFitScale({
      availW: 3360,
      availH: 1890,
      designWidth: DOC_DESIGN_WIDTH,
      minScale: 1,
      maxScale: 2.6,
    });
    expect(r.fluid).toBe(false);
    expect(r.scale).toBeCloseTo(3360 / 1440, 3);
  });

  it('caps at maxScale', () => {
    const r = computeFitScale({
      availW: 5000,
      availH: 2800,
      designWidth: DOC_DESIGN_WIDTH,
      minScale: 1,
      maxScale: 2.6,
    });
    expect(r.scale).toBe(2.6);
  });
});

describe('computeFitScale — Shorts (9:16 phone canvas)', () => {
  it('fills viewport height on typical desktop (not height-shrunk skinny column)', () => {
    const r = computeFitScale({
      availW: 1440,
      availH: 900,
      designWidth: SHORTS_DESIGN_WIDTH,
      designHeight: SHORTS_DESIGN_HEIGHT,
      minScale: 0.35,
      maxScale: 3.5,
    });
    // min(1440/430, 900/764) = min(3.35, 1.178) ≈ 1.178 — enlarges to fill height
    expect(r.scale).toBeCloseTo(900 / SHORTS_DESIGN_HEIGHT, 3);
    const visualW = SHORTS_DESIGN_WIDTH * r.scale;
    // ≈ availH × 9/16 = 506 → ~35% of 1440
    expect(visualW).toBeCloseTo(900 * (9 / 16), 0);
    expect(visualW / 1440).toBeGreaterThanOrEqual(0.3);
    expect(visualW / 1440).toBeLessThanOrEqual(0.55);
  });

  it('fills phone width on narrow viewports', () => {
    const r = computeFitScale({
      availW: 390,
      availH: 844,
      designWidth: SHORTS_DESIGN_WIDTH,
      designHeight: SHORTS_DESIGN_HEIGHT,
      minScale: 0.35,
      maxScale: 2.6,
    });
    expect(r.scale).toBeCloseTo(
      Math.min(390 / SHORTS_DESIGN_WIDTH, 844 / SHORTS_DESIGN_HEIGHT),
      3,
    );
  });

  it('uses full 9:16 of viewport height on ultrawide (adaptive, not postage stamp)', () => {
    const r = computeFitScale({
      availW: 3360,
      availH: 1890,
      designWidth: SHORTS_DESIGN_WIDTH,
      designHeight: SHORTS_DESIGN_HEIGHT,
      minScale: 0.35,
      maxScale: 3.5,
    });
    const visualW = SHORTS_DESIGN_WIDTH * r.scale;
    // Rounded scale ≈ availH/designH; allow 1px drift from exact 9/16 of height
    expect(visualW).toBeCloseTo(SHORTS_DESIGN_WIDTH * (1890 / SHORTS_DESIGN_HEIGHT), 0);
    expect(visualW / 3360).toBeGreaterThanOrEqual(0.3);
    expect(visualW).toBeGreaterThan(900);
  });
});
