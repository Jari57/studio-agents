import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL!;
const BACKEND_URL = process.env.BACKEND_URL!;

test.describe('release smoke checks', () => {
  test('the isolated frontend loads an application shell', async ({ page }) => {
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('the backend exposes a healthy public status', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'healthy' });
  });

  test('public validation and protected data boundaries respond safely', async ({ request }) => {
    const missingEmail = await request.get(`${BACKEND_URL}/api/investor-access/check`);
    expect(missingEmail.status()).toBe(400);

    const privateProfile = await request.get(`${BACKEND_URL}/api/user/profile`);
    expect(privateProfile.status()).toBe(401);
  });

  test('an intentionally public share link renders a player instead of the landing page', async ({ page }) => {
    await page.route('**/api/distribute/share-link/12345678-abc', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ track: {
          title: 'Release Smoke Track',
          artist: 'Studio QA',
          audioUrl: 'https://example.com/release-smoke.mp3',
          coverArtUrl: null,
        } }),
      });
    });
    await page.goto(`${FRONTEND_URL}/#/share/12345678-abc`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Release Smoke Track' })).toBeVisible();
    await expect(page.locator('audio')).toHaveAttribute('src', 'https://example.com/release-smoke.mp3');
  });
});
