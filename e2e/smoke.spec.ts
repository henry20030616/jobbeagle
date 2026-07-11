import { test, expect } from '@playwright/test';

test.describe('Smoke — core pages load', () => {
  test('home page has title and main content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Jobbeagle/i);
    await expect(page.locator('body')).toBeVisible();
    await expect(
      page.getByRole('button').or(page.locator('textarea')).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('shorts is frozen by default (redirect home)', async ({ page }) => {
    await page.goto('/shorts');
    await expect(page).toHaveURL(/\/$/);
  });

  test('privacy page renders', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).toContainText(/Chrome|extension|外掛/i);
  });

  test('terms page renders', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('employer routes frozen by default', async ({ page }) => {
    await page.goto('/employer/login');
    await expect(page).toHaveURL(/\/$/);
  });
});
