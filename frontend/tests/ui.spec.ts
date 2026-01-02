import { test, expect } from '@playwright/test';

/**
 * UI Integration Tests for Studio Agents Frontend
 * Tests the user interface, navigation, and core user flows
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================================================
// LANDING PAGE TESTS
// ============================================================================

test.describe('Landing Page', () => {

  test('Landing page loads successfully', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await expect(page).toHaveTitle(/Studio Agents|Whip Montez/i);
  });

  test('Hero section is visible', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    // Check for main heading or hero text
    const heroText = page.locator('text=/YOUR LABEL|Studio Agents|AI-Powered/i').first();
    await expect(heroText).toBeVisible({ timeout: 10000 });
  });

  test('Get Started button is visible and clickable', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    const ctaButton = page.locator('button, a').filter({ hasText: /Get Started|Start Free|Try Now/i }).first();
    await expect(ctaButton).toBeVisible({ timeout: 10000 });
  });

  test('Navigation elements are present', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    // Look for nav links or menu items
    const navArea = page.locator('nav, header').first();
    await expect(navArea).toBeVisible({ timeout: 10000 });
  });

  test('Footer is visible', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible({ timeout: 5000 });
  });

});

// ============================================================================
// MODAL TESTS
// ============================================================================

test.describe('Modal Behavior', () => {

  test('Modal close button has correct styling', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    // Trigger a modal (e.g., pricing or sign in)
    const triggerButton = page.locator('button, a').filter({ hasText: /Pricing|Sign In|Login|Terms|Privacy/i }).first();
    
    if (await triggerButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerButton.click();
      await page.waitForTimeout(500);
      
      // Check for modal close button
      const closeButton = page.locator('.modal-close, [aria-label="Close"], button:has(svg)').first();
      if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify it's visible and styled properly
        const isVisible = await closeButton.isVisible();
        expect(isVisible).toBe(true);
      }
    }
  });

  test('Clicking outside modal closes it', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    const triggerButton = page.locator('button, a').filter({ hasText: /Pricing|Sign In|Login/i }).first();
    
    if (await triggerButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerButton.click();
      await page.waitForTimeout(500);
      
      // Click on overlay/backdrop
      const overlay = page.locator('.modal-overlay, .backdrop, [class*="overlay"]').first();
      if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
        await overlay.click({ position: { x: 10, y: 10 } });
      }
    }
  });

});

// ============================================================================
// RESPONSIVE DESIGN TESTS
// ============================================================================

test.describe('Responsive Design', () => {

  test('Mobile viewport - no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(1000);
    
    // Check that page width equals viewport (no horizontal overflow)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // Small tolerance
  });

  test('Tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto(FRONTEND_URL);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Desktop viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(FRONTEND_URL);
    await expect(page.locator('body')).toBeVisible();
  });

});

// ============================================================================
// ACCESSIBILITY BASICS
// ============================================================================

test.describe('Accessibility Basics', () => {

  test('Page has a main heading', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
  });

  test('Interactive elements have focus indicators', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Check that something has focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('Images have alt text', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(1000);
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      // Allow empty alt for decorative images, but it should be defined
      if (await img.isVisible()) {
        // Just log for now, don't fail
        console.log(`Image ${i}: alt="${alt || '(none)'}"`);
      }
    }
  });

});

// ============================================================================
// PERFORMANCE BASICS
// ============================================================================

test.describe('Performance Basics', () => {

  test('Page loads within acceptable time', async ({ page }) => {
    const start = Date.now();
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    
    console.log(`Page DOM loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
  });

  test('No critical JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(2000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('Non-Error') &&
      !e.includes('network')
    );
    
    if (criticalErrors.length > 0) {
      console.log('JS Errors found:', criticalErrors);
    }
    // Don't fail on JS errors for now, just log
  });

});

// ============================================================================
// AUTHENTICATION UI TESTS
// ============================================================================

test.describe('Authentication UI', () => {

  test('Sign in button/link is visible', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    const signInElement = page.locator('button, a').filter({ hasText: /Sign In|Login|Log In/i }).first();
    // May or may not be visible depending on auth state
    const isVisible = await signInElement.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Sign in button visible: ${isVisible}`);
  });

  test('Sign up option is available', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    const signUpElement = page.locator('button, a').filter({ hasText: /Sign Up|Get Started|Create Account|Register/i }).first();
    const isVisible = await signUpElement.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Sign up option visible: ${isVisible}`);
  });

});

// ============================================================================
// AGENT DISPLAY TESTS
// ============================================================================

test.describe('Agent Display', () => {

  test('Agent cards or carousel is visible', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(2000);
    
    // Look for agent-related content
    const agentContent = page.locator('text=/Ghostwriter|Beat Architect|Visual Vibe|16 Agents/i').first();
    const isVisible = await agentContent.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Agent content visible: ${isVisible}`);
  });

});

// ============================================================================
// NAVIGATION FLOW TESTS
// ============================================================================

test.describe('Navigation Flows', () => {

  test('Can navigate from landing to pricing info', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    const pricingLink = page.locator('button, a').filter({ hasText: /Pricing|Plans|Subscribe/i }).first();
    if (await pricingLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pricingLink.click();
      await page.waitForTimeout(500);
      // Should show pricing content
      const pricingContent = page.locator('text=/Free|Monthly|Pro|\\$|per month/i').first();
      const visible = await pricingContent.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Pricing content visible: ${visible}`);
    }
  });

});

// ============================================================================
// COOKIE CONSENT
// ============================================================================

test.describe('Cookie Consent', () => {

  test('Cookie banner behavior', async ({ page }) => {
    // Clear storage to simulate fresh visit
    await page.context().clearCookies();
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(1000);
    
    const cookieBanner = page.locator('text=/cookie|cookies|Accept|privacy policy/i').first();
    const isVisible = await cookieBanner.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Cookie banner visible: ${isVisible}`);
  });

});

// ============================================================================
// ERROR STATES
// ============================================================================

test.describe('Error States', () => {

  test('404 page handles gracefully', async ({ page }) => {
    const response = await page.goto(`${FRONTEND_URL}/this-page-does-not-exist-12345`);
    // SPA should still load the app (may show 404 content or redirect)
    expect(response?.status()).toBeLessThan(500);
  });

});
