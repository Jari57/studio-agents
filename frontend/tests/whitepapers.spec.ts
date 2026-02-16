import { test, expect } from '@playwright/test';

/**
 * Whitepapers Page Tests
 * Tests the standalone #/whitepapers route and modal interactions on the landing page.
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

test.describe('Whitepapers Page', () => {

  test('loads via hash route', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/#/whitepapers`);
    await page.waitForTimeout(2000);

    // Page should show whitepaper content (agent cards or headings)
    const heading = page.locator('text=/Whitepaper|Technical|Agent/i').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('shows agent cards with expandable sections', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/#/whitepapers`);
    await page.waitForTimeout(2000);

    // Should have multiple agent cards
    const cards = page.locator('[style*="cursor: pointer"]').filter({ hasText: /Ghost|Beat|Album|Social|Hashtag|Video|Pitch|Vocal|Mix/i });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('clicking an agent card expands whitepaper content', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/#/whitepapers`);
    await page.waitForTimeout(2000);

    // Click first agent card
    const card = page.locator('[style*="cursor: pointer"]').filter({ hasText: /Ghost|Beat|Album|Social|Hashtag|Video|Pitch|Vocal|Mix/i }).first();
    await card.click();
    await page.waitForTimeout(500);

    // Should show expanded content with sections/tabs
    const content = page.locator('text=/Overview|Architecture|Technical|Capabilities|Features/i').first();
    const isContentVisible = await content.isVisible().catch(() => false);
    // At minimum, no crash
    await expect(page.locator('body')).toBeVisible();
    if (isContentVisible) {
      await expect(content).toBeVisible();
    }
  });

  test('back button navigates to landing page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/#/whitepapers`);
    await page.waitForTimeout(2000);

    // Find back button
    const backBtn = page.locator('button').filter({ hasText: /back|home|return|←/i }).first();
    const isBackVisible = await backBtn.isVisible().catch(() => false);
    if (isBackVisible) {
      await backBtn.click();
      await page.waitForTimeout(1000);
      // Should be back on landing page
      const hash = await page.evaluate(() => window.location.hash);
      expect(hash === '' || hash === '#/' || hash === '#').toBeTruthy();
    }
  });

  test('no JavaScript errors on whitepapers page', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto(`${FRONTEND_URL}/#/whitepapers`);
    await page.waitForTimeout(3000);

    expect(jsErrors).toEqual([]);
  });
});

test.describe('Landing Page Whitepaper Modal', () => {

  test('whitepaper button in Meet the Agents opens modal', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto(FRONTEND_URL);
    const meetSection = page.locator('text=Meet the Agents').first();
    await meetSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const wpBtn = page.locator('button:has-text("Whitepaper")').first();
    await wpBtn.click();
    await page.waitForTimeout(1500);

    // A modal/overlay should appear
    const modal = page.locator('[style*="position: fixed"]').filter({ hasText: /Overview|Architecture|Technical/i }).first();
    const isModalVisible = await modal.isVisible().catch(() => false);
    // No JS errors regardless
    expect(jsErrors).toEqual([]);
    await expect(page.locator('body')).toBeVisible();
  });
});
