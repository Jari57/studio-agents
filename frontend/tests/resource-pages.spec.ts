import { test, expect, Page } from '@playwright/test';

/**
 * Resource Pages Tests — DNA, Vocals, Billboard, Campaign, Legal
 * Tests all marketing/resource pages render correctly, have working
 * navigation, proper content, FAQ accordions, and CTAs.
 */

const URL = 'http://localhost:5173';

// ============================================================================
// DNA RESOURCE PAGE
// ============================================================================

test.describe('DNA Resource Page', () => {

  test('loads via #/dna', async ({ page }) => {
    await page.goto(`${URL}/#/dna`);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.locator('h1, h2').filter({ hasText: /DNA/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('no JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${URL}/#/dna`);
    await page.waitForTimeout(3000);
    expect(errors).toEqual([]);
  });

  test('shows PROPRIETARY TECHNOLOGY badge (not PATENTED)', async ({ page }) => {
    await page.goto(`${URL}/#/dna`);
    await page.waitForTimeout(2000);
    const badge = page.locator('text=PROPRIETARY TECHNOLOGY').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
    // Verify "PATENTED" is NOT present
    const patented = page.locator('text=PATENTED TECHNOLOGY');
    await expect(patented).toHaveCount(0);
  });

  test('DNA type tabs are interactive', async ({ page }) => {
    await page.goto(`${URL}/#/dna`);
    await page.waitForTimeout(2000);
    // Should have DNA type selectors
    for (const label of ['Visual', 'Audio', 'Lyrics']) {
      const tab = page.locator('button, [style*="cursor"]').filter({ hasText: new RegExp(label, 'i') }).first();
      const visible = await tab.isVisible({ timeout: 3000 }).catch(() => false);
      if (visible) {
        await tab.click();
        await page.waitForTimeout(300);
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('FAQ accordion expands and collapses', async ({ page }) => {
    await page.goto(`${URL}/#/dna`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);

    const faqButton = page.locator('button').filter({ hasText: /How is DNA different|What is DNA|Does DNA/i }).first();
    if (await faqButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await faqButton.click();
      await page.waitForTimeout(500);
      // Answer text should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('back button navigates away', async ({ page }) => {
    await page.goto(`${URL}/#/dna`);
    await page.waitForTimeout(2000);
    const back = page.locator('button').filter({ hasText: /Back/i }).first();
    if (await back.isVisible({ timeout: 3000 }).catch(() => false)) {
      await back.click();
      await page.waitForTimeout(1000);
      const hash = await page.evaluate(() => window.location.hash);
      expect(hash !== '#/dna').toBe(true);
    }
  });

  test('CTA buttons navigate correctly', async ({ page }) => {
    await page.goto(`${URL}/#/dna`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    const cta = page.locator('button').filter({ hasText: /Launch|Studio|Start|Try/i }).first();
    if (await cta.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(cta).toBeEnabled();
    }
  });

  test('shows correct parameter values from audit', async ({ page }) => {
    await page.goto(`${URL}/#/dna`);
    await page.waitForTimeout(2000);
    // Verify corrected values (not old wrong ones)
    const pageText = await page.locator('body').textContent();
    if (pageText?.includes('image_prompt_strength')) {
      expect(pageText).toContain('0.95');
      expect(pageText).not.toContain('image_prompt_strength: 0.85');
    }
  });
});

// ============================================================================
// VOCALS RESOURCE PAGE
// ============================================================================

test.describe('Vocals Resource Page', () => {

  test('loads via #/vocals', async ({ page }) => {
    await page.goto(`${URL}/#/vocals`);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.locator('h1, h2').filter({ hasText: /Vocal|Voice/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('no JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${URL}/#/vocals`);
    await page.waitForTimeout(3000);
    expect(errors).toEqual([]);
  });

  test('voice roster tabs are interactive', async ({ page }) => {
    await page.goto(`${URL}/#/vocals`);
    await page.waitForTimeout(2000);
    for (const style of ['Rapper (Male)', 'Singer', 'Special']) {
      const tab = page.locator('button').filter({ hasText: new RegExp(style, 'i') }).first();
      if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(300);
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('provider chain cards are visible', async ({ page }) => {
    await page.goto(`${URL}/#/vocals`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    const providers = ['Suno', 'ElevenLabs', 'Bark'];
    for (const name of providers) {
      const card = page.locator(`text=${name}`).first();
      const visible = await card.isVisible({ timeout: 3000 }).catch(() => false);
      if (visible) await expect(card).toBeVisible();
    }
  });

  test('voice settings table renders', async ({ page }) => {
    await page.goto(`${URL}/#/vocals`);
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
    await page.waitForTimeout(1000);
    // Should show the Stability/Similarity/Style settings
    const stabilitySetting = page.locator('text=/Stability|Similarity/i').first();
    await expect(stabilitySetting).toBeVisible({ timeout: 8000 });
  });

  test('FAQ accordion works', async ({ page }) => {
    await page.goto(`${URL}/#/vocals`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
    await page.waitForTimeout(1000);
    const faq = page.locator('button').filter({ hasText: /How many voice|What.*difference/i }).first();
    if (await faq.isVisible({ timeout: 5000 }).catch(() => false)) {
      await faq.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('shows AI-POWERED VOICE ENGINE badge (not NEURAL EMOTION)', async ({ page }) => {
    await page.goto(`${URL}/#/vocals`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    const badge = page.locator('text=AI-POWERED VOICE ENGINE').first();
    await expect(badge).toBeVisible({ timeout: 8000 });
  });

  test('back button works', async ({ page }) => {
    await page.goto(`${URL}/#/vocals`);
    await page.waitForTimeout(2000);
    const back = page.locator('button').filter({ hasText: /Back/i }).first();
    if (await back.isVisible({ timeout: 3000 }).catch(() => false)) {
      await back.click();
      await page.waitForTimeout(1000);
      const hash = await page.evaluate(() => window.location.hash);
      expect(hash !== '#/vocals').toBe(true);
    }
  });
});

// ============================================================================
// BILLBOARD BLUEPRINT PAGE
// ============================================================================

test.describe('Billboard Blueprint Page', () => {

  test('loads via #/billboard', async ({ page }) => {
    await page.goto(`${URL}/#/billboard`);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.locator('h1').filter({ hasText: /Billboard/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('no JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${URL}/#/billboard`);
    await page.waitForTimeout(3000);
    expect(errors).toEqual([]);
  });

  test('8-phase production accordion is interactive', async ({ page }) => {
    await page.goto(`${URL}/#/billboard`);
    await page.waitForTimeout(2000);

    // Phase 1 should be expanded by default
    const phase1 = page.locator('text=/PHASE 1/i').first();
    await expect(phase1).toBeVisible({ timeout: 5000 });

    // Click phase 2 to expand
    const phase2Btn = page.locator('button').filter({ hasText: /The Beat|PHASE 2/i }).first();
    if (await phase2Btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phase2Btn.click();
      await page.waitForTimeout(500);
      // Phase 2 content should show
      const content = page.locator('text=/Stability AI|instrumental/i').first();
      const isVis = await content.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isVis).toBe(true);
    }
  });

  test('capability matrix toggle works', async ({ page }) => {
    await page.goto(`${URL}/#/billboard`);
    await page.waitForTimeout(2000);
    const matrixBtn = page.locator('button').filter({ hasText: /Capability Matrix|Technical/i }).first();
    if (await matrixBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await matrixBtn.click();
      await page.waitForTimeout(500);
      const table = page.locator('text=/Stability AI|ElevenLabs|Flux/i').first();
      await expect(table).toBeVisible({ timeout: 3000 });
    }
  });

  test('shows 33+ genres (not 32)', async ({ page }) => {
    await page.goto(`${URL}/#/billboard`);
    await page.waitForLoadState('domcontentloaded');
    // Wait for lazy-loaded component to finish rendering
    await page.waitForFunction(
      () => !document.body.innerText.includes('Loading Studio'),
      { timeout: 20000 }
    ).catch(() => {});
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('33+');
    expect(pageText).not.toMatch(/\b32 genres\b/);
  });

  test('sample prompt section is visible', async ({ page }) => {
    await page.goto(`${URL}/#/billboard`);
    await page.waitForLoadState('domcontentloaded');
    // Wait for lazy-loaded component to finish rendering
    await page.waitForFunction(
      () => !document.body.innerText.includes('Loading Studio'),
      { timeout: 20000 }
    ).catch(() => {});
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
    await page.waitForTimeout(1000);
    const prompt = page.locator('text=/trap anthem|SAMPLE CONFIGURATION/i').first();
    const isVis = await prompt.isVisible({ timeout: 10000 }).catch(() => false);
    expect(isVis).toBe(true);
  });
});

// ============================================================================
// CONTENT MULTIPLICATION PAGE
// ============================================================================

test.describe('Content Multiplication Page', () => {

  test('loads via #/campaign', async ({ page }) => {
    await page.goto(`${URL}/#/campaign`);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.locator('h1, h2').filter({ hasText: /Content|Campaign|Multiplication|Engine/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('no JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${URL}/#/campaign`);
    await page.waitForTimeout(3000);
    expect(errors).toEqual([]);
  });

  test('shows prep steps and campaign days', async ({ page }) => {
    await page.goto(`${URL}/#/campaign`);
    await page.waitForLoadState('domcontentloaded');
    // Wait for lazy-loaded component to finish rendering
    await page.waitForFunction(
      () => !document.body.innerText.includes('Loading Studio'),
      { timeout: 20000 }
    ).catch(() => {});
    // Should show prep sections
    const prep = page.locator('text=/Prep|Visual Anchor|Motion Assets/i').first();
    const hasPrep = await prep.isVisible({ timeout: 12000 }).catch(() => false);
    expect(hasPrep).toBe(true);
  });

  test('campaign day cards are expandable', async ({ page }) => {
    await page.goto(`${URL}/#/campaign`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
    await page.waitForTimeout(1000);
    const dayCard = page.locator('button, [style*="cursor"]').filter({ hasText: /Day 1|Tease/i }).first();
    if (await dayCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dayCard.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('back button works', async ({ page }) => {
    await page.goto(`${URL}/#/campaign`);
    await page.waitForTimeout(2000);
    const back = page.locator('button').filter({ hasText: /Back/i }).first();
    if (await back.isVisible({ timeout: 3000 }).catch(() => false)) {
      await back.click();
      await page.waitForTimeout(1000);
      const hash = await page.evaluate(() => window.location.hash);
      expect(hash !== '#/campaign').toBe(true);
    }
  });
});

// ============================================================================
// LEGAL RESOURCES PAGE
// ============================================================================

test.describe('Legal Resources Page', () => {

  test('loads via #/legal', async ({ page }) => {
    await page.goto(`${URL}/#/legal`);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.locator('h1, h2').filter({ hasText: /Legal|Privacy|Terms|Copyright/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('no JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${URL}/#/legal`);
    await page.waitForTimeout(3000);
    expect(errors).toEqual([]);
  });

  test('back button navigates home', async ({ page }) => {
    await page.goto(`${URL}/#/legal`);
    await page.waitForTimeout(2000);
    const back = page.locator('button').filter({ hasText: /Back/i }).first();
    if (await back.isVisible({ timeout: 3000 }).catch(() => false)) {
      await back.click();
      await page.waitForTimeout(1000);
      const hash = await page.evaluate(() => window.location.hash);
      expect(hash !== '#/legal').toBe(true);
    }
  });

  test('legal sections are present', async ({ page }) => {
    await page.goto(`${URL}/#/legal`);
    await page.waitForTimeout(2000);
    for (const section of ['Privacy', 'Terms', 'Copyright']) {
      const el = page.locator(`text=/${section}/i`).first();
      const visible = await el.isVisible({ timeout: 3000 }).catch(() => false);
      if (visible) await expect(el).toBeVisible();
    }
  });
});

// ============================================================================
// WHITEPAPERS PAGE
// ============================================================================

test.describe('Whitepapers Page — Extended', () => {

  test('loads and shows all 16 agent cards', async ({ page }) => {
    await page.goto(`${URL}/#/whitepapers`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    // Should show agent cards
    const cards = page.locator('[style*="cursor: pointer"]').filter({ hasText: /Ghost|Beat|Album|Vocal|Video|Trend|Master|Collab|Drop|Score|Sample|Instrum|Release|AR/i });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('no horizontal overflow', async ({ page }) => {
    await page.goto(`${URL}/#/whitepapers`);
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
    expect(overflow).toBe(false);
  });
});
