import { test, expect } from '@playwright/test';

test.describe('Studio Agents UI Regression', () => {
  
  test('Landing page loads and displays title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Studio Agents AI/);
    await expect(page.locator('.hero-section')).toBeVisible();
    await expect(page.locator('button.header-cta')).toBeVisible();
  });

  test('Navigation to Dashboard works', async ({ page }) => {
    await page.goto('/');
    await page.click('button.header-cta');
    await expect(page.locator('.studio-container')).toBeVisible();
    await expect(page.locator('.studio-nav')).toBeVisible();
    await expect(page.locator('.studio-header')).toBeVisible();
  });

});
