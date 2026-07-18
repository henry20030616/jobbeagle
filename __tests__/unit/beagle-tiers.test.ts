import { describe, expect, it } from 'vitest';
import { beagleTierIndex, getBeagleTierCopy, getBeagleTierVisual } from '@/lib/beagle-tiers';

describe('beagle tiers', () => {
  it('maps score bands', () => {
    expect(beagleTierIndex(95)).toBe(0);
    expect(beagleTierIndex(80)).toBe(1);
    expect(beagleTierIndex(65)).toBe(2);
    expect(beagleTierIndex(40)).toBe(3);
  });

  it('uses redesigned English names', () => {
    expect(getBeagleTierCopy(92, 'en')[0]).toBe('Diamond Beagle');
    expect(getBeagleTierCopy(78, 'en')[0]).toBe('Sapphire Beagle');
    expect(getBeagleTierCopy(62, 'en')[0]).toBe('Emerald Beagle');
    expect(getBeagleTierCopy(35, 'en')[0]).toBe('Copper Beagle');
  });

  it('returns brand-aligned colors', () => {
    expect(getBeagleTierVisual(95).fill).toBe('#a5b4fc');
    expect(getBeagleTierVisual(35).fill).toBe('#d6a07c');
  });
});
