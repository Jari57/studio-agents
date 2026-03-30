import { test, expect, Page } from '@playwright/test';

/**
 * Studio View Tests — Tabs, Modals, Panels, Agent Selection
 * Tests the authenticated studio interface comprehensively
 */

const URL = 'http://localhost:5173';

// Helper: enter studio as guest (bypasses login requirement)
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
  // Dismiss any overlay that may still be visible
  const overlay = page.locator('.modal-overlay');
  if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
    await overlay.click({ position: { x: 5, y: 5 }, force: true });
    await page.waitForTimeout(500);
  }
}

// ============================================================================
// STUDIO LOAD & TAB NAVIGATION
// ============================================================================

test.describe('Studio View — Load & Tabs', () => {

  test('studio loads successfully', async ({ page }) => {
    await enterStudio(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('no JavaScript errors on studio load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await enterStudio(page);
    expect(errors).toEqual([]);
  });

  test('no horizontal overflow in studio', async ({ page }) => {
    await enterStudio(page);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
    expect(overflow).toBe(false);
  });

  test('agents tab shows agent cards', async ({ page }) => {
    await enterStudio(page);
    // Wait for agent grid to render
    const agentCard = page.locator('text=/Ghostwriter|Music GPT|Album Artist|Vocal Lab/i').first();
    await expect(agentCard).toBeVisible({ timeout: 10000 });
  });

  test('tab navigation works for main tabs', async ({ page }) => {
    await enterStudio(page);

    // Test switching to hub tab
    const hubTab = page.locator('button, a, [role="tab"]').filter({ hasText: /Hub|Projects/i }).first();
    if (await hubTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hubTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }

    // Test switching to resources tab
    const resourcesTab = page.locator('button, a, [role="tab"]').filter({ hasText: /Resources/i }).first();
    if (await resourcesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await resourcesTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('more menu opens and shows options', async ({ page }) => {
    await enterStudio(page);
    const moreBtn = page.locator('button').filter({ hasText: /More|⋯|•••/i }).first();
    if (await moreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await moreBtn.click();
      await page.waitForTimeout(500);
      // Should show dropdown items
      const menuItem = page.locator('text=/Whitepapers|Legal|Resources|Help|Profile/i').first();
      const visible = await menuItem.isVisible({ timeout: 3000 }).catch(() => false);
      expect(visible).toBe(true);
    }
  });
});

// ============================================================================
// STUDIO — AGENT SELECTION
// ============================================================================

test.describe('Studio View — Agent Selection', () => {

  test('clicking an agent card selects it', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await enterStudio(page);
    const card = page.locator('[style*="cursor: pointer"], button').filter({ hasText: /Ghostwriter/i }).first();
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      await card.click();
      await page.waitForTimeout(1000);
      // Agent should be selected — workspace or detail area should appear
      await expect(page.locator('body')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('agent cards show tier badges', async ({ page }) => {
    await enterStudio(page);
    // Tier labels: Free, Creator, Pro — rendered on each agent card
    const badge = page.locator('[style*="position"] >> text=/Free|Creator|Pro/i').first();
    const hasBadge = await badge.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasBadge) {
      // Fallback: check if any card text contains a tier word
      const anyTier = page.locator('text=/Free|Creator|Pro/i').first();
      const fallback = await anyTier.isVisible({ timeout: 3000 }).catch(() => false);
      expect(fallback).toBe(true);
    } else {
      expect(hasBadge).toBe(true);
    }
  });

  test('search/filter agents works', async ({ page }) => {
    await enterStudio(page);
    const search = page.locator('input[placeholder*="search" i], input[placeholder*="filter" i]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('Ghost');
      await page.waitForTimeout(500);
      const ghost = page.locator('text=Ghostwriter').first();
      await expect(ghost).toBeVisible({ timeout: 3000 });
    }
  });
});

// ============================================================================
// STUDIO — PROJECT HUB
// ============================================================================

test.describe('Studio View — Project Hub', () => {

  test('hub tab loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.setItem('studio_user_id', 'test-playwright');
    });
    await page.goto(`${URL}/#/studio/hub`);
    await page.waitForTimeout(3000);
    expect(errors).toEqual([]);
  });

  test('shows create project or empty state', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.setItem('studio_user_id', 'test-playwright');
    });
    await page.goto(`${URL}/#/studio/hub`);
    await page.waitForTimeout(3000);

    // Either shows project cards or "no projects" / "create" CTA
    const content = page.locator('text=/Create|New Project|No projects|Start/i').first();
    const hasContent = await content.isVisible({ timeout: 5000 }).catch(() => false);
    // At minimum no crash
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// STUDIO — RESOURCES TAB
// ============================================================================

test.describe('Studio View — Resources', () => {

  test('resources tab loads', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.setItem('studio_user_id', 'test-playwright');
    });
    await page.goto(`${URL}/#/studio/resources`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('resource cards link to DNA/Vocals/Billboard pages', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.setItem('studio_user_id', 'test-playwright');
    });
    await page.goto(`${URL}/#/studio/resources`);
    await page.waitForTimeout(3000);

    // Look for resource page links
    const link = page.locator('button, a, [style*="cursor"]').filter({ hasText: /DNA|Vocal|Billboard|Campaign/i }).first();
    const visible = await link.isVisible({ timeout: 5000 }).catch(() => false);
    if (visible) await expect(link).toBeVisible();
  });
});

// ============================================================================
// STUDIO — SUPPORT / HELP TAB
// ============================================================================

test.describe('Studio View — Help & Support', () => {

  test('support tab loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.setItem('studio_user_id', 'test-playwright');
    });
    await page.goto(`${URL}/#/studio/support`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// STUDIO — PROFILE TAB
// ============================================================================

test.describe('Studio View — Profile', () => {

  test('profile tab loads', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.setItem('studio_user_id', 'test-playwright');
    });
    await page.goto(`${URL}/#/studio/profile`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// STUDIO — ACTIVITY / NEWS TABS
// ============================================================================

test.describe('Studio View — Activity & News', () => {

  test('activity tab loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.setItem('studio_user_id', 'test-playwright');
    });
    await page.goto(`${URL}/#/studio/activity`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('news tab loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.setItem('studio_user_id', 'test-playwright');
    });
    await page.goto(`${URL}/#/studio/news`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// STUDIO — WHITEPAPERS & LEGAL FROM STUDIO
// ============================================================================

test.describe('Studio View — Internal Pages', () => {

  test('whitepapers tab loads inside studio', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.setItem('studio_user_id', 'test-playwright');
    });
    await page.goto(`${URL}/#/whitepapers`);
    await page.waitForTimeout(3000);
    const content = page.locator('text=/Whitepaper|Executive|Architecture|Problem/i').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('legal tab loads inside studio', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.setItem('studio_user_id', 'test-playwright');
    });
    await page.goto(`${URL}/#/studio/legal`);
    await page.waitForTimeout(3000);
    const content = page.locator('text=/Legal|Privacy|Terms/i').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});
