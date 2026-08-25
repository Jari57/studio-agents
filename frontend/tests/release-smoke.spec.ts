import { test, expect, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FRONTEND_URL = process.env.FRONTEND_URL!;
const BACKEND_URL = process.env.BACKEND_URL!;

test.describe('release smoke checks', () => {
  async function enterStudio(page: Page) {
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('studio_guest_mode', 'true');
      localStorage.removeItem('studio_user_id');
      localStorage.setItem('studio_onboarding_v3', 'true');
      localStorage.setItem('studio_onboarding_v4', 'true');
      localStorage.setItem('studio_tour_shown', '1');
      localStorage.setItem('cookie_consent', 'true');
      localStorage.removeItem('studio_cloned_elevenlabs_id');
      localStorage.removeItem('studio_cloned_voice_url');
    });
    await page.goto(`${FRONTEND_URL}/#/studio/agents`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.studio-shell')).toBeVisible();
  }

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

    const privateProjects = await request.get(`${BACKEND_URL}/api/projects?userId=another-user`);
    expect(privateProjects.status()).toBe(401);

    const unauthorizedSync = await request.post(`${BACKEND_URL}/api/projects/sync`, {
      data: { userId: 'another-user', projects: [{ id: 'private-project' }] },
    });
    expect(unauthorizedSync.status()).toBe(401);

    const unauthorizedSave = await request.post(`${BACKEND_URL}/api/projects`, {
      data: { userId: 'another-user', project: { id: 'private-project' } },
    });
    expect(unauthorizedSave.status()).toBe(401);

    const unauthorizedUpdate = await request.put(`${BACKEND_URL}/api/projects/private-project`, {
      data: { userId: 'another-user', project: { id: 'private-project' } },
    });
    expect(unauthorizedUpdate.status()).toBe(401);

    const unauthorizedDelete = await request.delete(`${BACKEND_URL}/api/projects/private-project`);
    expect(unauthorizedDelete.status()).toBe(401);

    const unauthorizedVideoStatus = await request.get(`${BACKEND_URL}/api/video-status/another-users-operation`);
    expect(unauthorizedVideoStatus.status()).toBe(401);

    const unauthorizedVideoProxy = await request.get(`${BACKEND_URL}/api/video-proxy/private-video`);
    expect(unauthorizedVideoProxy.status()).toBe(401);
  });

  test('a public share URL routes to the share surface rather than the landing page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/#/share/12345678-abc`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Share unavailable' })).toBeVisible();
  });

  test('the laptop studio shell uses a compact accessible navigation rail', async ({ page }) => {
    await page.setViewportSize({ width: 1008, height: 900 });
    await enterStudio(page);

    const sidebar = page.locator('.studio-sidebar');
    const box = await sidebar.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(90);
    await expect(page.getByRole('button', { name: 'My Studio', exact: true })).toHaveAttribute('title', 'My Studio');
    await expect(page.getByRole('button', { name: 'Project Hub', exact: true })).toHaveAttribute('title', 'Project Hub');
  });

  test('a provider failure remains visible and offers a safe retry', async ({ page }) => {
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ output: 'Professional 90 BPM boom-bap production brief.' }),
      });
    });
    await page.route('**/api/generate-audio', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'System Maintenance: Out of Credits',
          details: 'The audio provider is unavailable. Your credits were not charged.',
          isSystemCreditIssue: true,
        }),
      });
    });

    await enterStudio(page);
    await page.getByRole('button', { name: 'Music GPT', exact: true }).first().click({ force: true });
    const guideButton = page.getByRole('button', { name: /Got it, let's go!/i });
    await guideButton.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    if (await guideButton.isVisible().catch(() => false)) await guideButton.click({ force: true });
    await page.getByRole('textbox', { name: /Describe what you want Music GPT/i }).fill('Release smoke beat');
    await page.getByRole('button', { name: 'Generate', exact: true }).click({ force: true });

    const failure = page.getByRole('alert');
    await expect(failure).toContainText('Your credits were not charged');
    await expect(failure.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('personal voice requests stay explicit and consent-gated', async () => {
    const studioSource = readFileSync(resolve(process.cwd(), 'src/components/StudioView.jsx'), 'utf8');

    expect(studioSource).toContain("style: storedSpeakerUrl || storedCloneId ? 'cloned' : 'rapper'");
    expect(studioSource).toContain('isPersonalVoice: personalVoiceSelected');
    expect(studioSource).toContain("? ((voiceSampleUrl || voiceSettings.speakerUrl) ? 'minimax-music' : 'elevenlabs-clone')");
    expect(studioSource).toContain('sourceAssetIds: [uploadResult.assetId]');
    expect(studioSource).toContain("mode: 'strict'");
  });
});
