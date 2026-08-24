import { describe, expect, it } from 'vitest';
import {
  computeDogLoadingZoom,
  DOG_LOADING_CARD_WIDTH,
} from '@/lib/dog-loading-zoom';

describe('computeDogLoadingZoom', () => {
  it('stays at 1 on phone-sized viewports', () => {
    expect(computeDogLoadingZoom(390)).toBe(1);
    expect(computeDogLoadingZoom(DOG_LOADING_CARD_WIDTH)).toBe(1);
  });

  it('enlarges on typical desktop so the card is not a postage stamp', () => {
    const z = computeDogLoadingZoom(1440);
    expect(z).toBeGreaterThan(1);
    const visualW = DOG_LOADING_CARD_WIDTH * z;
    expect(visualW / 1440).toBeGreaterThanOrEqual(0.3);
    expect(visualW / 1440).toBeLessThanOrEqual(0.5);
  });

  it('enlarges further on ultrawide but stays capped', () => {
    const z = computeDogLoadingZoom(3360);
    expect(z).toBeGreaterThan(1.5);
    expect(z).toBeLessThanOrEqual(2.4);
    const visualW = DOG_LOADING_CARD_WIDTH * z;
    expect(visualW).toBeGreaterThan(700);
  });
});
