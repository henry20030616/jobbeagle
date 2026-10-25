import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const SUBTLE_LOUPE = [
  'cx="58"',
  'cy="40"',
  'r="8"',
  'M64 46 L82 50',
];

const HEAVY_LOUPE = [
  'r="12.5"',
  'strokeWidth="4.5"',
  'stroke-width="4.5"',
  'M69.2 49.2 L86.5 64.5',
  'BeagleLoupe',
];

describe('Beagle mascot original loupe', () => {
  it('keeps the shared BeagleIcon on the original subtle monocle', () => {
    const src = read('components/BeagleIcon.tsx');
    expect(src).toContain("export const BRAND_BEAGLE_GLASSES = '#3B82F6'");
    expect(src).toContain('cx="58"');
    expect(src).toContain('r="8"');
    expect(src).toContain('strokeWidth="1.5"');
    expect(src).toContain('d="M64 46 L82 50"');
    expect(src).toContain('strokeWidth="2.5"');
    for (const marker of HEAVY_LOUPE) {
      expect(src).not.toContain(marker);
    }
  });

  it('re-exports BeagleIcon from AnalysisDashboard', () => {
    const src = read('components/AnalysisDashboard.tsx');
    expect(src).toMatch(/export\s*\{\s*BeagleIcon/);
    expect(src).not.toContain('M69.2 49.2 L86.5 64.5');
  });

  it('keeps favicon on the original subtle loupe and extension SVG free of the heavy rim', () => {
    const favicon = read('app/icon.svg');
    const extension = read('browser-extension/icon.svg');
    for (const marker of SUBTLE_LOUPE) {
      expect(favicon).toContain(marker);
    }
    expect(favicon).not.toContain('r="12.5"');
    expect(favicon).not.toContain('M69.2 49.2 L86.5 64.5');
    expect(extension).not.toContain('r="12.5"');
    expect(extension).not.toContain('M69.2 49.2 L86.5 64.5');
    expect(extension).not.toContain('#1e3a8a');
  });
});
