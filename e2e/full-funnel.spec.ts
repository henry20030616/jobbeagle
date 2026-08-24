import { test, expect } from '@playwright/test';

/**
 * Public conversion funnel — JobBeagle homepage → samples → account/docs.
 * No login, no paid analyze, no Gemini. Catches the “tiny UI / scare banner”
 * regressions we keep hitting on the operator surface.
 */
test.describe('Full funnel — public surfaces', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('homepage 4-step operator is usable', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Jobbeagle/i);

    const steps = page.locator('.homepage-steps');
    await expect(steps).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole('link', { name: /Grab JD with Chrome extension/i })).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();

    await expect(page.getByRole('button', { name: /Saved Resumes/i })).toBeVisible();
    await expect(page.getByText(/Click to upload PDF or text file/i)).toBeVisible();

    await expect(page.getByRole('button', { name: /Job Fit Snapshot/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Interview Strategy Guide/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /View sample/i })).toHaveCount(2);

    const launch = page.getByRole('button', { name: /Launch AI Strategy Analysis/i });
    await expect(launch).toBeVisible();
    await expect(launch).toBeDisabled();
  });

  test('Saved Resumes dropdown opens', async ({ page }) => {
    await page.goto('/');
    const library = page.getByRole('button', { name: /Saved Resumes/i });
    await expect(library).toBeVisible({ timeout: 15_000 });
    await library.click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await expect(listbox.getByText(/Recently uploaded resumes/i)).toBeVisible();
    await expect(
      listbox.getByText(/No resumes saved yet/i).or(listbox.getByRole('option').first()),
    ).toBeVisible();
  });

  test('LinkedIn URL in the JD box shows the board warning, not a crash', async ({ page }) => {
    await page.goto('/');
    const jd = page.locator('textarea').first();
    await expect(jd).toBeVisible({ timeout: 15_000 });
    await jd.fill('https://www.linkedin.com/jobs/view/123456');
    await expect(page.getByRole('alert').filter({ hasText: /We detected a LinkedIn URL/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Get the JobBeagle extension/i })).toBeVisible();
  });

  test('/?error=no_job_page does not scare the paste-JD homepage', async ({ page }) => {
    await page.goto('/?error=no_job_page');
    await expect(page.locator('.homepage-steps')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/This page is not supported/i)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Analysis Failed/i })).toHaveCount(0);
    await expect(page).not.toHaveURL(/error=no_job_page/);
  });

  test('View sample opens the Snapshot sample report', async ({ page }) => {
    await page.goto('/');
    const sample = page.getByRole('link', { name: /View sample/i }).first();
    await expect(sample).toBeVisible({ timeout: 15_000 });

    const popupPromise = page.waitForEvent('popup');
    await sample.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await expect(popup).toHaveURL(/\/samples/);
    await expect(popup.getByText('SAMPLE').first()).toBeVisible({ timeout: 15_000 });
    await expect(popup.getByText(/Job Fit Snapshot/i).first()).toBeVisible();
  });

  test('Strategy Guide sample page renders', async ({ page }) => {
    await page.goto('/samples?type=interview_strategy_guide');
    await expect(page.getByText('SAMPLE').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Interview Strategy Guide/i).first()).toBeVisible();
  });

  test('extension install page renders', async ({ page }) => {
    await page.goto('/extension');
    await expect(page.locator('[data-fit-ref="extension"]')).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('link', { name: /Add to Chrome|Download for Chrome|加到 Chrome|下載 Chrome 外掛/i }),
    ).toBeVisible();
  });

  test('account page asks unsigned visitors to sign in', async ({ page }) => {
    await page.goto('/account');
    await expect(page.locator('[data-fit-ref="account"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Account management/i })).toBeVisible();
    await expect(page.getByText(/Sign in to manage your account/i)).toBeVisible({ timeout: 15_000 });
  });

  test('career-context intro is readable', async ({ page }) => {
    await page.goto('/career-context');
    await expect(page.locator('[data-fit-ref="career-context"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/Career Context|floors/i);
  });

  test('legal + checkout + extension-capture APIs respond', async ({ page, request }) => {
    await page.goto('/privacy');
    await expect(page.locator('body')).toContainText(/Chrome|extension|外掛/i);

    await page.goto('/terms');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });

    const checkout = await request.get('/api/checkout');
    expect(checkout.ok()).toBeTruthy();

    const captureOptions = await request.fetch('/api/extension-capture', { method: 'OPTIONS' });
    expect(captureOptions.status()).toBeLessThan(500);

    const captureGet = await request.get('/api/extension-capture');
    expect(captureGet.status()).toBe(400);
  });
});
