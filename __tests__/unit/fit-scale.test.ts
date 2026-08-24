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

describe('computeFitScale — Shorts (phone canvas)', () => {
  it('is height-constrained on typical desktop', () => {
    const r = computeFitScale({
      availW: 1440,
      availH: 900,
      designWidth: SHORTS_DESIGN_WIDTH,
      designHeight: SHORTS_DESIGN_HEIGHT,
      minScale: 0.35,
      maxScale: 2.6,
    });
    // min(1440/430, 900/932) = min(3.35, 0.966) ≈ 0.966
    expect(r.scale).toBeCloseTo(900 / 932, 3);
    const visualW = SHORTS_DESIGN_WIDTH * r.scale;
    expect(visualW / 1440).toBeGreaterThanOrEqual(0.25);
    expect(visualW / 1440).toBeLessThanOrEqual(0.6);
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
    // min(390/430, 844/932) = min(0.907, 0.906) ≈ 0.906
    expect(r.scale).toBeCloseTo(Math.min(390 / 430, 844 / 932), 3);
  });

  it('never collapses to a sliver on ultrawide', () => {
    const r = computeFitScale({
      availW: 3360,
      availH: 1890,
      designWidth: SHORTS_DESIGN_WIDTH,
      designHeight: SHORTS_DESIGN_HEIGHT,
      minScale: 0.35,
      maxScale: 2.6,
    });
    const visualW = SHORTS_DESIGN_WIDTH * r.scale;
    expect(visualW).toBeGreaterThan(300);
    expect(visualW / 3360).toBeGreaterThanOrEqual(0.25);
  });
});
