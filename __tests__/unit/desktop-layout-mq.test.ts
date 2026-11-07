import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DESKTOP_LAYOUT_MAX_SHORT_HEIGHT,
  DESKTOP_LAYOUT_MEDIA,
  DESKTOP_LAYOUT_MIN_HEIGHT,
  DESKTOP_LAYOUT_MIN_WIDTH,
  isDesktopLayoutViewport,
} from '@/constants/desktop-layout';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('desktop layout media — phone landscape stays mobile', () => {
  it('keeps a phone landscape viewport on the mobile form (width ≥ lg, short height)', () => {
    // iPhone 15 Pro Max CSS landscape ≈ 932 × 430
    expect(isDesktopLayoutViewport(932, 430)).toBe(false);
    // Pixel-class landscape ≈ 915 × 412
    expect(isDesktopLayoutViewport(915, 412)).toBe(false);
    // Still below lg width → mobile
    expect(isDesktopLayoutViewport(390, 844)).toBe(false);
  });

  it('treats a real laptop / tall tablet as desktop', () => {
    expect(isDesktopLayoutViewport(1280, 800)).toBe(true);
    expect(isDesktopLayoutViewport(1024, DESKTOP_LAYOUT_MIN_HEIGHT)).toBe(true);
    expect(isDesktopLayoutViewport(1194, 834)).toBe(true);
  });

  it('exposes the shared media string used by CSS + wrapper', () => {
    expect(DESKTOP_LAYOUT_MIN_WIDTH).toBe(1024);
    expect(DESKTOP_LAYOUT_MIN_HEIGHT).toBe(700);
    expect(DESKTOP_LAYOUT_MAX_SHORT_HEIGHT).toBe(DESKTOP_LAYOUT_MIN_HEIGHT - 1);
    expect(DESKTOP_LAYOUT_MEDIA).toBe(
      `(min-width: ${DESKTOP_LAYOUT_MIN_WIDTH}px) and (min-height: ${DESKTOP_LAYOUT_MIN_HEIGHT}px)`,
    );
  });

  it('wires InputFormWrapper + homepage/account type scale to the tall-desktop media', () => {
    const wrapper = read('components/InputFormWrapper.tsx');
    const css = read('app/globals.css');
    const fit = read('components/FitStage.tsx');

    expect(wrapper).toContain('jb-desktop-only');
    expect(wrapper).toContain('jb-mobile-only');
    expect(wrapper).not.toMatch(/className="hidden min-h-0 lg:flex/);
    expect(wrapper).not.toMatch(/className="block lg:hidden"/);

    expect(css).toContain(DESKTOP_LAYOUT_MEDIA);
    expect(css).toMatch(
      new RegExp(
        `@media\\s*\\(min-width:\\s*${DESKTOP_LAYOUT_MIN_WIDTH}px\\)\\s*and\\s*\\(min-height:\\s*${DESKTOP_LAYOUT_MIN_HEIGHT}px\\)\\s*\\{[\\s\\S]*?\\.homepage-font-large`,
      ),
    );
    expect(css).toMatch(
      new RegExp(
        `@media\\s*\\(min-width:\\s*${DESKTOP_LAYOUT_MIN_WIDTH}px\\)\\s*and\\s*\\(min-height:\\s*${DESKTOP_LAYOUT_MIN_HEIGHT}px\\)\\s*\\{[\\s\\S]*?\\.account-font-large`,
      ),
    );
    expect(css).toContain('.jb-desktop-only');
    expect(css).toContain('.jb-mobile-only');

    // Orientation must remeasure — iOS often fires orientationchange before size settles.
    expect(fit).toMatch(/orientationchange/);
    expect(fit).toMatch(/visualViewport/);
  });
});
