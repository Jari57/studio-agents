import { test, expect, type Locator } from '@playwright/test';

/** Action-first homepage, opt-in demos and the complete agent directory.
 * These acceptance checks never submit a paid or free generation. */
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function documentTop(locator: Locator) {
  await expect(locator).toBeVisible();
  return locator.evaluate(element => element.getBoundingClientRect().top + window.scrollY);
}

test.beforeEach(async ({ page }) => {
  await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Your sound. Your vision. Your studio.' })).toBeVisible();
  const cookieConsent = page.getByRole('button', { name: 'Accept', exact: true });
  if (await cookieConsent.isVisible()) await cookieConsent.click();
});

test.describe('Landing Section Order', () => {
  test('starting paths precede the agent directory, optional demos and pricing', async ({ page }) => {
    const start = page.getByRole('heading', { name: 'Where do you want to start?', exact: true });
    const agents = page.getByRole('heading', { name: 'Meet the Agents', exact: true });
    const demos = page.locator('summary').filter({ hasText: 'Explore the workflow & agent demos' });
    const pricing = page.getByRole('heading', { name: /Transparent Pricing/ });
    expect(await documentTop(start)).toBeLessThan(await documentTop(agents));
    expect(await documentTop(agents)).toBeLessThan(await documentTop(demos));
    expect(await documentTop(demos)).toBeLessThan(await documentTop(pricing));
    await expect(page.getByRole('button', { name: 'Try an Agent', exact: true })).toHaveCount(0);
  });
});

test.describe('Jump Into Studio Navigation', () => {
  test('three starting paths and four secondary destinations remain visible', async ({ page }) => {
    const start = page.getByRole('region', { name: 'Where do you want to start?' });
    for (const label of [/Open AI Orchestrator/, /Open project canvas/, /Browse agents/]) {
      await expect(start.getByRole('button', { name: label })).toBeVisible();
    }
    const more = page.getByRole('navigation', { name: 'More studio destinations' });
    for (const label of ['Your projects', 'Resources', 'News & Entertainment', 'Pricing']) {
      await expect(more.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
  });

  test('pricing shortcut scrolls to pricing without leaving the homepage', async ({ page }) => {
    await page.getByRole('navigation', { name: 'More studio destinations' })
      .getByRole('button', { name: 'Pricing', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Transparent Pricing/ })).toBeInViewport();
    await expect(page.getByRole('heading', { level: 1, name: 'Your sound. Your vision. Your studio.' })).toBeAttached();
  });
});

test.describe('Opt-in Demo Disclosure', () => {
  test('demos mount on open, switch one at a time and unmount on close', async ({ page }) => {
    const disclosure = page.locator('details').filter({
      has: page.locator('summary').filter({ hasText: 'Explore the workflow & agent demos' }),
    });
    const summary = disclosure.locator('summary');
    await expect(disclosure).not.toHaveAttribute('open');
    await expect(page.locator('.studio-home-preview')).toHaveCount(0);
    await expect(page.getByPlaceholder('Describe your song idea...', { exact: true })).toHaveCount(0);

    await summary.click();
    await expect(disclosure).toHaveAttribute('open', '');
    await expect(disclosure.getByText(/Illustrative demos, not a live generation/)).toBeVisible();
    await expect(disclosure.getByRole('button', { name: 'Workflow walkthrough', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await disclosure.getByRole('button', { name: 'Try an Agent', exact: true }).click();
    await expect(disclosure.getByRole('heading', { name: 'Try One Agent', exact: true })).toBeVisible();
    await expect(disclosure.getByRole('button', { name: 'Try an Agent', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(disclosure.getByPlaceholder('Describe your song idea...', { exact: true })).toHaveCount(1);

    await disclosure.getByRole('button', { name: 'Multi-agent demo', exact: true }).click();
    await expect(disclosure.getByRole('heading', { name: 'One Idea → Four Agents', exact: true })).toBeVisible();
    await expect(disclosure.getByRole('heading', { name: 'Try One Agent', exact: true })).toHaveCount(0);
    await expect(disclosure.getByPlaceholder('Describe your song idea...', { exact: true })).toHaveCount(1);

    await summary.click();
    await expect(disclosure).not.toHaveAttribute('open');
    await expect(page.locator('.studio-home-preview')).toHaveCount(0);
    await expect(page.getByPlaceholder('Describe your song idea...', { exact: true })).toHaveCount(0);
  });
});

test.describe('Meet the Agents Grid', () => {
  test('four core agents are visible and twelve specialists expand and collapse', async ({ page }) => {
    const directory = page.getByRole('region', { name: 'Meet the Agents' });
    const specialists = directory.locator('details');
    await expect(directory.locator('article')).toHaveCount(16);
    await expect(directory.locator('article:visible')).toHaveCount(4);
    await expect(directory.getByRole('button', { name: 'Read Ghostwriter whitepaper', exact: true })).toBeVisible();
    await specialists.locator('summary').click();
    await expect(directory.locator('article:visible')).toHaveCount(16);
    await expect(directory.getByRole('button', { name: 'Open Vocal Lab', exact: true })).toBeVisible();
    await expect(directory.getByRole('button', { name: 'Open Video Scorer', exact: true })).toBeVisible();
    await specialists.locator('summary').click();
    await expect(directory.locator('article:visible')).toHaveCount(4);
    await expect(directory.getByRole('button', { name: 'Open Vocal Lab', exact: true })).not.toBeVisible();
  });

  test('whitepaper opens with real content and closes back to the directory', async ({ page }) => {
    await page.getByRole('button', { name: 'Read Ghostwriter whitepaper', exact: true }).click();
    const whitepaper = page.locator('.legal-modal').filter({
      has: page.getByRole('heading', { name: 'Ghostwriter AI', exact: true }),
    });
    await expect(whitepaper).toBeVisible();
    await expect(whitepaper.getByRole('heading', { name: 'Ghostwriter AI', exact: true })).toBeVisible();
    await whitepaper.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(whitepaper).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Meet the Agents', exact: true })).toBeVisible();
  });
});
