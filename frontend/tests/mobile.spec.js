import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  
  // Only run these tests on mobile projects
  test.skip(({ isMobile }) => !isMobile, 'Mobile only tests');

  test('Mobile layout loads without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    
    // Check for horizontal scrollbar (common mobile bug)
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Allow a tiny buffer for sub-pixel rendering, but generally scrollWidth should <= viewportWidth
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('Critical CTA buttons are visible on mobile', async ({ page }) => {
    await page.goto('/');
    
    // The "Create New Project" or main CTA should be clickable and not covered
    const cta = page.getByText('Create New Project').first();
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  });

  test('Studio View adapts to mobile viewport', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Create New Project').first().click();
    
    // Wait for studio to load
    await expect(page.locator('.studio-container')).toBeVisible();
    
    // Check that the nav bar is present (or adapted)
    // In many mobile apps, sidebars become bottom bars or drawers
    // We just verify it exists in the DOM for now
    await expect(page.locator('.studio-nav')).toBeAttached();
    
    // Ensure the main dashboard area is visible
    await expect(page.locator('.studio-dashboard')).toBeVisible();
  });

  test('Profile button is visible in header on mobile', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Create New Project').first().click();
    
    // Wait for studio to load
    await expect(page.locator('.studio-header')).toBeVisible();
    
    // Check for profile button in header
    const profileBtn = page.locator('.studio-header .action-button[title="User Profile"]');
    await expect(profileBtn).toBeVisible();
  });
});
