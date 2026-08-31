import { chromium, devices } from '@playwright/test';

const target = (process.argv[2] || 'https://studioagentsai.com').replace(/\/$/, '');
const destinations = [
  ['About Us', /#\/studio\/marketing$/],
  ['AI Agents', /#\/studio\/agents$/],
  ['My Studio', /#\/studio\/mystudio$/],
  ['Social Media Hub', /#\/studio\/activity$/],
  ['Industry Pulse', /#\/studio\/news$/],
  ['Whitepapers', /#\/whitepapers$/],
  ['AI Production Pipeline', /#\/studio\/mystudio$/],
  ['Studio Workflow', /#\/studio\/mystudio$/],
  ['Legal Center', /#\/legal$/],
  ['Help & Support', /#\/studio\/support$/],
  ['Project Hub', /#\/studio\/hub$/],
  ['My Profile', /#\/studio\/profile$/],
  ['Media Library', /#\/studio\/media_library$/],
  ['DNA System', /#\/dna$/],
  ['Vocal Lab', /#\/vocals$/],
  ['Billboard Blueprint', /#\/billboard$/],
  ['Content Engine', /#\/campaign$/],
];

const profiles = [
  ['desktop-chrome', devices['Desktop Chrome']],
  ['mobile-chrome', devices['Pixel 5']],
];

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const [profileName, profile] of profiles) {
    const context = await browser.newContext(profile);
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(target, { waitUntil: 'domcontentloaded' });
    await page.evaluate((profileId) => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.setItem('studio_user_id', `production-navigation-${profileId}`);
      localStorage.setItem('studio_onboarding_v4', 'true');
      localStorage.setItem('studio_tour_shown', '1');
    }, profileName);

    // Reproduce the reported failure: open an agent, then leave it through
    // the visible desktop or mobile navigation rather than changing the hash.
    await page.goto(`${target}/#/studio/beat`, { waitUntil: 'domcontentloaded' });
    await page.locator('.agent-active-view').getByRole('heading', { name: 'Music GPT', exact: true }).waitFor();
    if (profileName === 'mobile-chrome') {
      await page.locator('.bottom-nav [data-tour="nav-more"]').click();
      await page.locator('.more-menu-view [role="button"]').filter({ hasText: /^Resources/ }).click();
    } else {
      await page.getByRole('button', { name: 'Resources', exact: true }).click();
    }
    await page.waitForURL(/#\/studio\/resources$/);
    await page.getByRole('heading', { name: 'Creator Resources' }).waitFor();
    if (await page.locator('.agent-active-view').isVisible()) {
      throw new Error(`${profileName}: stale agent workspace remained visible after Resources navigation`);
    }

    const checked = [];
    for (const [label, expectedHash] of destinations) {
      await page.goto(`${target}/#/studio/resources`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: 'Creator Resources' }).waitFor();
      const card = page.locator('.studio-resource-card').filter({ hasText: label });
      await card.waitFor();
      await card.click();
      await page.waitForURL(expectedHash);
      checked.push(label);
    }

    if (pageErrors.length) {
      throw new Error(`${profileName}: page errors: ${pageErrors.join(' | ')}`);
    }

    results.push({ profile: profileName, staleAgentRegression: 'pass', destinations: checked.length });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ target, status: 'pass', results }, null, 2));
