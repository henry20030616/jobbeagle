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
    expect(z).toBeLessThanOrEqual(2.6);
    const visualW = DOG_LOADING_CARD_WIDTH * z;
    expect(visualW).toBeGreaterThan(700);
  });
});

describe('DogLoading typography', () => {
  it('uses a larger beagle and stage copy on the analyze progress overlay', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const { join } = require('node:path') as typeof import('node:path');
    const src = readFileSync(join(process.cwd(), 'components/DogLoading.tsx'), 'utf8');
    expect(src).toContain('h-48 w-48');
    expect(src).toContain('sm:h-56 sm:w-56');
    expect(src).toContain('text-2xl font-semibold');
    expect(src).toContain('sm:text-3xl');
    expect(src).not.toContain('h-32 w-32');
    expect(src).not.toContain('text-lg font-semibold leading-snug text-slate-300');
  });
});
