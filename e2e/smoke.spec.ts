import { test, expect } from '@playwright/test';

test.describe('Smoke — core pages load', () => {
  test('home page has title and main content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Jobbeagle/i);
    await expect(page.locator('body')).toBeVisible();
    // Input form or analyze UI should be present
    await expect(
      page.getByRole('button').or(page.locator('textarea')).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('shorts feed loads', async ({ page }) => {
    await page.goto('/shorts');
    await expect(page).toHaveURL(/\/shorts/);
    // Bottom nav proves feed shell mounted; player may be video or iframe
    await expect(page.getByRole('button', { name: /Home|首頁/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('video, iframe').first()).toBeVisible({ timeout: 20_000 });
  });

  test('privacy page renders', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('terms page renders', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('employer login page loads', async ({ page }) => {
    await page.goto('/employer/login');
    await expect(page.locator('body')).toContainText(/Google|登入|Sign in/i);
  });

  test('shorts upload page shows auth or wizard', async ({ page }) => {
    await page.goto('/shorts/upload');
    await expect(page.locator('body')).toContainText(/登入|Sign in|上傳|Upload|Post/i);
  });
});
