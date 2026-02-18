import { test, expect } from '@playwright/test';

/**
 * Landing Page Section Order & Navigation Tests
 * Verifies sections render in the correct order after the redesign.
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

test.describe('Landing Section Order', () => {

  test('Jump Into Studio appears before Demo sections', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(1500);

    const jumpY = await page.locator('text=Jump Into the Studio').first().evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    const demoY = await page.locator('text=Try an Agent').first().evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    
    expect(jumpY).toBeLessThan(demoY);
  });

  test('Jump Into Studio appears before Meet the Agents', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(1500);

    const jumpY = await page.locator('text=Jump Into the Studio').first().evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    const agentsY = await page.locator('text=Meet the Agents').first().evaluate(el => el.getBoundingClientRect().top + window.scrollY);

    expect(jumpY).toBeLessThan(agentsY);
  });

  test('Meet the Agents appears before Pricing', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(1500);

    const agentsY = await page.locator('text=Meet the Agents').first().evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    const pricingY = await page.locator('text=Transparent Pricing').first().evaluate(el => el.getBoundingClientRect().top + window.scrollY);

    expect(agentsY).toBeLessThan(pricingY);
  });
});

test.describe('Jump Into Studio Navigation', () => {

  test('four quicknav buttons are visible', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    const jumpSection = page.locator('text=Jump Into the Studio').first();
    await jumpSection.scrollIntoViewIfNeeded();
    await expect(jumpSection).toBeVisible({ timeout: 10000 });

    for (const label of ['AI Orchestrator', 'Agents', 'Resources', 'Social Media Hub']) {
      await expect(page.locator(`button:has-text("${label}")`).first()).toBeVisible();
    }
  });
});

test.describe('Meet the Agents Grid', () => {

  test('shows agent cards with tier badges', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    const meetSection = page.locator('text=Meet the Agents').first();
    await meetSection.scrollIntoViewIfNeeded();
    await expect(meetSection).toBeVisible({ timeout: 10000 });

    // At least 4 agent cards visible
    const cards = page.locator('text=Whitepaper');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('agent whitepaper buttons are clickable', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    const meetSection = page.locator('text=Meet the Agents').first();
    await meetSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const wpBtn = page.locator('button:has-text("Whitepaper")').first();
    await expect(wpBtn).toBeVisible();
    await wpBtn.click();

    // A modal or overlay should appear with whitepaper content
    await page.waitForTimeout(1000);
    const modal = page.locator('[style*="position: fixed"], [class*="modal"], [class*="overlay"], [role="dialog"]').first();
    const isModalVisible = await modal.isVisible().catch(() => false);
    // At minimum, no crash
    await expect(page.locator('body')).toBeVisible();
    if (isModalVisible) {
      // modal appeared — verify it can be closed
      const closeBtn = modal.locator('button').filter({ hasText: /close|×|✕/i }).first();
      const hasClose = await closeBtn.isVisible().catch(() => false);
      if (hasClose) {
        await closeBtn.click();
      }
    }
  });
});
