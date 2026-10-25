import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const LOUPE_MARKERS = [
  'cx="60"',
  'cy="40"',
  'r="12.5"',
  '#1e3a8a',
  'stroke-width="4.5"',
  'M69.2 49.2 L86.5 64.5',
  'rgba(255,255,255,0.72)',
];

describe('Beagle mascot magnifying glass', () => {
  it('uses a thick high-contrast loupe in the shared BeagleIcon', () => {
    const src = read('components/BeagleIcon.tsx');
    expect(src).toContain("export const BRAND_BEAGLE_GLASSES = '#1e3a8a'");
    expect(src).toContain('r="12.5"');
    expect(src).toContain('strokeWidth="4.5"');
    expect(src).toContain('strokeWidth="7"');
    expect(src).toContain('BeagleLoupe');
    expect(src).not.toMatch(/<circle cx="58" cy="40" r="8" stroke=\{glassesColor\} strokeWidth="1\.5"/);
  });

  it('re-exports BeagleIcon from AnalysisDashboard without a faint inline loupe', () => {
    const src = read('components/AnalysisDashboard.tsx');
    expect(src).toMatch(/export\s*\{\s*BeagleIcon/);
    expect(src).not.toMatch(/<circle cx="58" cy="40" r="8" stroke=\{glassesColor\} strokeWidth="1\.5"/);
  });

  it('keeps favicon and extension SVG loupes in sync with the component', () => {
    const favicon = read('app/icon.svg');
    const extension = read('browser-extension/icon.svg');
    for (const marker of LOUPE_MARKERS) {
      expect(favicon).toContain(marker);
      expect(extension).toContain(marker);
    }
  });
});
