import { test, expect } from '@playwright/test';

test.describe('Studio Agents UI Regression', () => {
  
  test('Landing page loads and displays title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Studio Agents AI/);
    await expect(page.locator('.hero-section')).toBeVisible();
  });

  test('Navigation to Dashboard works', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.getByText('Create New Project').click();
    await expect(page.locator('.studio-container')).toBeVisible();
    
    // Sidebar is hidden on mobile
    if (!isMobile) {
      await expect(page.locator('.studio-nav')).toBeVisible();
    }
    
    await expect(page.locator('.studio-header')).toBeVisible();
  });

});
