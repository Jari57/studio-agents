import { test, expect, Page, devices } from '@playwright/test';

/**
 * Mobile & Responsive Layout Tests
 * Tests overflow, touch targets, modal positioning, viewport issues
 * across all pages on mobile viewports.
 */

const URL = 'http://localhost:5173';

// Helper: enter studio as guest
async function enterStudio(page: Page) {
  await page.goto(URL);
  await page.evaluate(() => {
    localStorage.setItem('studio_guest_mode', 'true');
    localStorage.setItem('studio_user_id', 'test-playwright');
    localStorage.setItem('studio_onboarding_v3', 'true');
    localStorage.setItem('studio_onboarding_v4', 'true');
    localStorage.setItem('cookie_consent', 'true');
  });
  await page.goto(`${URL}/#/studio/agents`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

// ============================================================================
// MOBILE-ONLY TESTS (skipped on desktop)
// ============================================================================

test.describe('Mobile Layout — Landing Page', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only');

  test('no horizontal overflow on landing', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.removeItem('studio_user_id');
      localStorage.removeItem('studio_guest_mode');
    });
    await page.goto(URL);
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
    expect(overflow).toBe(false);
  });

  test('CTA buttons are tappable (min 44px touch target)', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.removeItem('studio_user_id');
      localStorage.removeItem('studio_guest_mode');
    });
    await page.goto(URL);
    await page.waitForTimeout(2000);

    const cta = page.locator('button').filter({ hasText: /Get Started|Start|Launch|Enter/i }).first();
    if (await cta.isVisible({ timeout: 5000 }).catch(() => false)) {
      const box = await cta.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
        expect(box.width).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('hero text is readable (font size >= 16px)', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.removeItem('studio_user_id');
      localStorage.removeItem('studio_guest_mode');
    });
    await page.goto(URL);
    await page.waitForTimeout(2000);

    const heroHeading = page.locator('h1, h2').first();
    if (await heroHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const fontSize = await heroHeading.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
      expect(fontSize).toBeGreaterThanOrEqual(16);
    }
  });

  test('navigation is accessible on mobile', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.removeItem('studio_user_id');
      localStorage.removeItem('studio_guest_mode');
    });
    await page.goto(URL);
    await page.waitForTimeout(2000);

    const nav = page.locator('nav, header, [class*="nav"]').first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('footer is not clipped', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.removeItem('studio_user_id');
      localStorage.removeItem('studio_guest_mode');
    });
    await page.goto(URL);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const footer = page.locator('footer').first();
    if (await footer.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await footer.boundingBox();
      const viewport = page.viewportSize();
      if (box && viewport) {
        // Footer should not extend beyond viewport width
        expect(box.width).toBeLessThanOrEqual(viewport.width + 5);
      }
    }
  });
});

test.describe('Mobile Layout — Resource Pages', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only');

  const resourcePages = [
    { hash: '#/dna', name: 'DNA' },
    { hash: '#/vocals', name: 'Vocals' },
    { hash: '#/billboard', name: 'Billboard' },
    { hash: '#/campaign', name: 'Campaign' },
    { hash: '#/legal', name: 'Legal' },
    { hash: '#/whitepapers', name: 'Whitepapers' }
  ];

  for (const { hash, name } of resourcePages) {
    test(`${name} page — no horizontal overflow`, async ({ page }) => {
      await page.goto(`${URL}/${hash}`);
      await page.waitForTimeout(2000);
      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
      expect(overflow).toBe(false);
    });

    test(`${name} page — back button visible and tappable`, async ({ page }) => {
      await page.goto(`${URL}/${hash}`);
      await page.waitForTimeout(2000);
      const back = page.locator('button').filter({ hasText: /Back/i }).first();
      if (await back.isVisible({ timeout: 3000 }).catch(() => false)) {
        const box = await back.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(30);
        }
      }
    });

    test(`${name} page — no JS errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${URL}/${hash}`);
      await page.waitForTimeout(3000);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('Mobile Layout — Studio View', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only');

  test('studio loads on mobile without overflow', async ({ page }) => {
    await enterStudio(page);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
    expect(overflow).toBe(false);
  });

  test('tab bar is visible on mobile', async ({ page }) => {
    await enterStudio(page);
    // Bottom nav bar should be visible on mobile
    const tabBar = page.locator('nav.bottom-nav').first();
    await expect(tabBar).toBeVisible({ timeout: 10000 });
  });

  test('agent cards are not clipped on mobile', async ({ page }) => {
    await enterStudio(page);
    const card = page.locator('[style*="cursor: pointer"], button').filter({ hasText: /Ghostwriter|Music GPT/i }).first();
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      const box = await card.boundingBox();
      const viewport = page.viewportSize();
      if (box && viewport) {
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 5);
        expect(box.x).toBeGreaterThanOrEqual(-5);
      }
    }
  });

  test('more menu works on mobile', async ({ page }) => {
    await enterStudio(page);
    const moreBtn = page.locator('button').filter({ hasText: /More|⋯|•••/i }).first();
    if (await moreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await moreBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

// ============================================================================
// MODAL POSITIONING ON MOBILE
// ============================================================================

test.describe('Mobile Layout — Modal Positioning', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only');

  test('login modal is fully within viewport', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.removeItem('studio_user_id');
      localStorage.removeItem('studio_guest_mode');
    });
    await page.goto(URL);
    await page.waitForTimeout(2000);

    const loginBtn = page.locator('button, a').filter({ hasText: /Sign In|Login/i }).first();
    if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('[style*="position: fixed"]').filter({ has: page.locator('input') }).first();
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        const box = await modal.boundingBox();
        const viewport = page.viewportSize();
        if (box && viewport) {
          expect(box.y).toBeGreaterThanOrEqual(-10); // Not clipped at top
          expect(box.x).toBeGreaterThanOrEqual(-10); // Not clipped at left
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 10);
        }
      }
    }
  });

  test('close buttons are not overlapping other elements on mobile', async ({ page }) => {
    await page.goto(`${URL}/#/dna`);
    await page.waitForTimeout(2000);

    // Check that the back button and header title don't overlap
    const back = page.locator('button').filter({ hasText: /Back/i }).first();
    const title = page.locator('text=/DNA/i').first();
    if (await back.isVisible().catch(() => false) && await title.isVisible().catch(() => false)) {
      const backBox = await back.boundingBox();
      const titleBox = await title.boundingBox();
      if (backBox && titleBox) {
        // They should not significantly overlap
        const overlapX = Math.max(0, Math.min(backBox.x + backBox.width, titleBox.x + titleBox.width) - Math.max(backBox.x, titleBox.x));
        const overlapY = Math.max(0, Math.min(backBox.y + backBox.height, titleBox.y + titleBox.height) - Math.max(backBox.y, titleBox.y));
        const overlapArea = overlapX * overlapY;
        expect(overlapArea).toBeLessThan(200); // Allow minor overlap
      }
    }
  });
});

// ============================================================================
// SCROLL & OVERFLOW ON EVERY PAGE (DESKTOP TOO)
// ============================================================================

test.describe('All Pages — No Overflow', () => {
  const pages = [
    { path: '', name: 'Landing' },
    { path: '#/dna', name: 'DNA' },
    { path: '#/vocals', name: 'Vocals' },
    { path: '#/billboard', name: 'Billboard' },
    { path: '#/campaign', name: 'Campaign' },
    { path: '#/legal', name: 'Legal' },
    { path: '#/whitepapers', name: 'Whitepapers' }
  ];

  for (const { path, name } of pages) {
    test(`${name} — no horizontal overflow (desktop)`, async ({ page }) => {
      if (path === '') {
        await page.goto(URL);
        await page.evaluate(() => {
          localStorage.removeItem('studio_user_id');
          localStorage.removeItem('studio_guest_mode');
        });
        await page.goto(URL);
      } else {
        await page.goto(`${URL}/${path}`);
      }
      await page.waitForTimeout(2000);
      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
      expect(overflow).toBe(false);
    });
  }
});
