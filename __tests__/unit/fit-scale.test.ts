import { describe, it, expect } from 'vitest';
import { computeFitScale, computeSheetZoom } from '@/lib/fit-scale';
import {
  DOC_DESIGN_WIDTH,
  SHORTS_DESIGN_WIDTH,
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

describe('computeFitScale — Shorts fill (full-bleed)', () => {
  it('fills the viewport on desktop (not a centered phone pillar)', () => {
    const r = computeFitScale({
      availW: 1440,
      availH: 900,
      designWidth: SHORTS_DESIGN_WIDTH,
      minScale: 1,
      maxScale: 2.6,
      mode: 'fill',
    });
    expect(r.fluid).toBe(true);
    expect(r.scale).toBe(1);
    expect(r.sheetZoom).toBeGreaterThan(1);
    expect(SHORTS_DESIGN_WIDTH * r.sheetZoom / 1440).toBeGreaterThanOrEqual(0.35);
  });

  it('stays fluid on phone', () => {
    const r = computeFitScale({
      availW: 390,
      availH: 844,
      designWidth: SHORTS_DESIGN_WIDTH,
      minScale: 1,
      maxScale: 2.6,
      mode: 'fill',
    });
    expect(r.fluid).toBe(true);
    expect(r.scale).toBe(1);
    expect(r.sheetZoom).toBe(1);
  });

  it('publishes readable sheet zoom on ultrawide', () => {
    const r = computeFitScale({
      availW: 3360,
      availH: 1890,
      designWidth: SHORTS_DESIGN_WIDTH,
      minScale: 1,
      maxScale: 2.6,
      mode: 'fill',
    });
    expect(r.scale).toBe(1);
    expect(r.sheetZoom).toBe(computeSheetZoom(3360, SHORTS_DESIGN_WIDTH, 2.6));
    expect(SHORTS_DESIGN_WIDTH * r.sheetZoom).toBeGreaterThan(700);
  });
});
