import { test, expect, type Page } from '@playwright/test';

/**
 * FitStage ratio acceptance — proportions must stay consistent across viewports.
 * Shorts requires NEXT_PUBLIC_SHORTS_ENABLED=true (dev server / built with flag).
 */

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 1920, height: 1080 },
  { width: 3360, height: 1890 },
] as const;

async function dismissShortsOverlay(page: Page): Promise<void> {
  const tap = page.getByText(/Tap to Start|點一下開始/i);
  if (await tap.count()) {
    await tap.first().click({ timeout: 3000 }).catch(() => undefined);
  } else {
    await page.mouse.click(page.viewportSize()!.width / 2, page.viewportSize()!.height / 2);
  }
  await page.waitForTimeout(400);
}

test.describe('FitStage ratios', () => {
  test('extension content is not a phone sliver on desktop/ultrawide', async ({ page }) => {
    const ratios: number[] = [];

    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      await page.goto('/extension', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-fit-ref="extension"]', { timeout: 15_000 });
      const box = await page.locator('[data-fit-ref="extension"]').boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(vp.width * 0.2);
      // Must not be the ~50–80px sliver bug
      expect(box!.width).toBeGreaterThan(280);
      ratios.push(box!.width / vp.width);
    }

    // On viewports ≥ 1440 (enlarge mode), ratios should stay close
    const large = ratios.slice(1);
    const mean = large.reduce((a, b) => a + b, 0) / large.length;
    for (const r of large) {
      expect(Math.abs(r - mean)).toBeLessThan(0.08);
    }
  });

  test('career-context content is not a phone sliver on desktop/ultrawide', async ({ page }) => {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      await page.goto('/career-context', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-fit-ref="career-context"]', { timeout: 15_000 });
      const box = await page.locator('[data-fit-ref="career-context"]').boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(280);
      expect(box!.width / vp.width).toBeGreaterThan(0.2);
    }
  });

  test('privacy legal column stays readable', async ({ page }) => {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      await page.goto('/privacy', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-fit-ref="legal"]', { timeout: 15_000 });
      const box = await page.locator('[data-fit-ref="legal"]').boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(280);
      expect(box!.width / vp.width).toBeGreaterThan(0.2);
    }
  });

  test('Shorts phone canvas ≥ 25% viewport width (when enabled)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[0]);
    await page.goto('/shorts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Frozen → redirected home; skip suite
    if (!page.url().includes('/shorts')) {
      test.skip(true, 'Shorts frozen (NEXT_PUBLIC_SHORTS_ENABLED≠true)');
      return;
    }

    const ratios: number[] = [];
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      await page.goto('/shorts', { waitUntil: 'domcontentloaded' });
      await dismissShortsOverlay(page);
      await page.waitForSelector('[data-fit-canvas]', { timeout: 15_000 });
      const box = await page.locator('[data-fit-canvas]').first().boundingBox();
      expect(box).toBeTruthy();
      const ratio = box!.width / vp.width;
      // Portrait 9:16 of viewport height ≈ 30–45% on landscape desktops; full width on phone
      expect(ratio).toBeGreaterThanOrEqual(0.28);
      expect(ratio).toBeLessThanOrEqual(0.7);
      expect(box!.width).toBeGreaterThan(350);
      ratios.push(ratio);
    }

    const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    for (const r of ratios) {
      expect(Math.abs(r - mean)).toBeLessThan(0.08);
    }
  });
});
