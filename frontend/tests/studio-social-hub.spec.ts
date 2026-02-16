import { test, expect } from '@playwright/test';

/**
 * Studio Social Hub / Activity Tab Tests
 * These require auth for full interaction, so they test navigation & fallback behavior.
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

test.describe('Studio Social Hub (unauthenticated)', () => {

  test('navigating to #/studio/activity redirects or shows auth prompt', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto(`${FRONTEND_URL}/#/studio/activity`);
    await page.waitForTimeout(3000);

    // Either redirected to landing, or studio shows login prompt, or tab loads
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check no critical JS errors
    const critical = jsErrors.filter(e =>
      !e.includes('ResizeObserver') && !e.includes('Non-Error') && !e.includes('network')
    );
    expect(critical).toEqual([]);
  });

  test('landing page Social Media Hub quicknav button exists', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    const jumpSection = page.locator('text=Jump Into the Studio').first();
    await jumpSection.scrollIntoViewIfNeeded();
    await expect(jumpSection).toBeVisible({ timeout: 10000 });

    const socialBtn = page.locator('button:has-text("Social Media Hub")').first();
    await expect(socialBtn).toBeVisible();
  });

  test('clicking Social Media Hub quicknav does not crash', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto(FRONTEND_URL);
    const jumpSection = page.locator('text=Jump Into the Studio').first();
    await jumpSection.scrollIntoViewIfNeeded();

    const socialBtn = page.locator('button:has-text("Social Media Hub")').first();
    await socialBtn.click();
    await page.waitForTimeout(3000);

    // May redirect to auth or load studio
    await expect(page.locator('body')).toBeVisible();
    const critical = jsErrors.filter(e =>
      !e.includes('ResizeObserver') && !e.includes('Non-Error') && !e.includes('network')
    );
    expect(critical).toEqual([]);
  });
});
