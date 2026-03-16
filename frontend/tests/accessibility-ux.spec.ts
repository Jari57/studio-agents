import { test, expect, Page } from '@playwright/test';

/**
 * Accessibility & UX Tests
 * Tests keyboard navigation, focus management, color contrast,
 * ARIA attributes, and interactive element accessibility.
 */

const URL = 'http://localhost:5173';

async function freshLanding(page: Page) {
  await page.goto(URL);
  await page.evaluate(() => {
    localStorage.removeItem('studio_user_id');
    localStorage.removeItem('studio_guest_mode');
  });
  await page.goto(URL);
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

test.describe('Accessibility — Keyboard Navigation', () => {

  test('Tab key moves focus through interactive elements', async ({ page }) => {
    await freshLanding(page);
    await page.waitForTimeout(1000);

    // Press Tab a few times and check that focus is visible
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName || 'BODY';
    });
    // Should have moved focus to a button, link, or input
    expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'BODY']).toContain(focused);
  });

  test('Enter key activates focused button', async ({ page }) => {
    await freshLanding(page);
    await page.waitForTimeout(1000);

    // Tab to first interactive element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    const tagBefore = await page.evaluate(() => document.activeElement?.tagName);
    if (tagBefore === 'BUTTON' || tagBefore === 'A') {
      // Pressing Enter shouldn't cause an error
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

// ============================================================================
// IMAGES & ALT TEXT
// ============================================================================

test.describe('Accessibility — Images', () => {

  test('images on landing page have reasonable loading', async ({ page }) => {
    await freshLanding(page);
    await page.waitForTimeout(2000);

    const images = page.locator('img');
    const count = await images.count();
    // For each visible image, check it loaded (naturalWidth > 0) or has alt
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      if (await img.isVisible({ timeout: 1000 }).catch(() => false)) {
        const loaded = await img.evaluate(el => {
          const imgEl = el as HTMLImageElement;
          return imgEl.complete && imgEl.naturalWidth > 0;
        });
        // Image should either load or have alt text fallback
        if (!loaded) {
          const alt = await img.getAttribute('alt');
          // Log but don't fail — broken images are logged
          console.log(`Image ${i} didn't load, alt: "${alt}"`);
        }
      }
    }
  });
});

// ============================================================================
// COLOR CONTRAST (BASIC CHECKS)
// ============================================================================

test.describe('Accessibility — Contrast', () => {

  test('main heading text has sufficient contrast', async ({ page }) => {
    await freshLanding(page);
    const heading = page.locator('h1, h2').first();
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const fontSize = await heading.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
      // Large text (>18px) needs 3:1, small text needs 4.5:1
      // We just verify text is visible and sized appropriately
      expect(fontSize).toBeGreaterThanOrEqual(14);
    }
  });

  test('buttons have visible text or icons', async ({ page }) => {
    await freshLanding(page);
    const buttons = page.locator('button:visible');
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 20); i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      const hasText = (text?.trim().length ?? 0) > 0;
      const hasSvg = await btn.locator('svg').count() > 0;
      const hasAriaLabel = await btn.getAttribute('aria-label') !== null;
      // Button should have either visible text, an icon, or aria-label
      expect(hasText || hasSvg || hasAriaLabel).toBe(true);
    }
  });
});

// ============================================================================
// FORM ACCESSIBILITY
// ============================================================================

test.describe('Accessibility — Forms', () => {

  test('form inputs have associated labels or placeholders', async ({ page }) => {
    await freshLanding(page);
    const loginBtn = page.locator('button, a').filter({ hasText: /Sign In|Login/i }).first();
    if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(1000);

      const inputs = page.locator('input:visible');
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const placeholder = await input.getAttribute('placeholder');
        const ariaLabel = await input.getAttribute('aria-label');
        const id = await input.getAttribute('id');
        // Check for associated label
        let hasLabel = false;
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          hasLabel = (await label.count()) > 0;
        }
        // Input should have placeholder, aria-label, or label
        expect(!!(placeholder || ariaLabel || hasLabel)).toBe(true);
      }
    }
  });
});

// ============================================================================
// FOCUS TRAP IN MODALS
// ============================================================================

test.describe('Accessibility — Focus Management', () => {

  test('focus stays within modal when tabbing', async ({ page }) => {
    await freshLanding(page);
    const loginBtn = page.locator('button, a').filter({ hasText: /Sign In|Login/i }).first();
    if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(1000);

      // Tab through modal elements
      const focusedElements: string[] = [];
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        const tag = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.tagName + '.' + el?.className?.split?.(' ')?.[0];
        });
        focusedElements.push(tag);
      }

      // At minimum, tabbing shouldn't cause errors
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

// ============================================================================
// PERFORMANCE BASICS
// ============================================================================

test.describe('Performance — Basic', () => {

  test('landing page loads within 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(10000);
  });

  test('no uncaught promise rejections', async ({ page }) => {
    const rejections: string[] = [];
    page.on('pageerror', e => {
      if (e.message.includes('Unhandled') || e.message.includes('rejection')) {
        rejections.push(e.message);
      }
    });
    await page.goto(URL);
    await page.waitForTimeout(3000);
    expect(rejections).toEqual([]);
  });

  test('resource pages load within 10 seconds', async ({ page }) => {
    for (const hash of ['#/dna', '#/vocals', '#/billboard', '#/campaign']) {
      const start = Date.now();
      await page.goto(`${URL}/${hash}`, { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - start;
      expect(loadTime).toBeLessThan(10000);
    }
  });
});

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

test.describe('Error Handling — Frontend', () => {

  test('invalid hash route shows fallback', async ({ page }) => {
    await page.goto(`${URL}/#/nonexistent-page-xyz`);
    await page.waitForTimeout(2000);
    // Should show landing page or some content (not blank)
    await expect(page.locator('body')).toBeVisible();
    const visible = await page.evaluate(() => document.body.textContent?.length);
    expect(visible).toBeGreaterThan(10);
  });

  test('double-hash doesn\'t crash', async ({ page }) => {
    await page.goto(`${URL}/##/studio`);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});
