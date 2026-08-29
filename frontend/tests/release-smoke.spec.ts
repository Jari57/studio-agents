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
    await page.setViewportSize({ width: 1280, height: 900 });
    await enterStudio(page);

    const sidebar = page.locator('.studio-sidebar');
    const box = await sidebar.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(90);
    await expect(page.getByRole('button', { name: 'My Studio', exact: true })).toHaveAttribute('title', 'My Studio');
    await expect(page.getByRole('button', { name: 'Project Hub', exact: true })).toHaveAttribute('title', 'Project Hub');
  });

  test('agent prompt drafts remain isolated when the user switches agents', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await enterStudio(page);

    await page.getByRole('button', { name: 'Music GPT', exact: true }).first().click({ force: true });
    const guideButton = page.getByRole('button', { name: /Got it, let's go!/i });
    await guideButton.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    if (await guideButton.isVisible().catch(() => false)) await guideButton.click({ force: true });

    const musicPrompt = page.getByRole('textbox', { name: 'Prompt for Music GPT' });
    await musicPrompt.fill('Music-only draft that must not leak');

    await page.getByRole('button', { name: 'Album Artist 2.0', exact: true }).first().click({ force: true });
    await guideButton.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    if (await guideButton.isVisible().catch(() => false)) await guideButton.click({ force: true });

    const artworkPrompt = page.getByRole('textbox', { name: 'Prompt for Album Artist 2.0' });
    await expect(artworkPrompt).toHaveValue('');
    await artworkPrompt.fill('Artwork-only draft that must stay separate');

    await page.getByRole('button', { name: 'Music GPT', exact: true }).first().click({ force: true });
    await expect(page.getByRole('textbox', { name: 'Prompt for Music GPT' })).toHaveValue('Music-only draft that must not leak');
  });

  test('Vocal Lab exposes usable personal voice settings in the main agents workspace', async ({ page }) => {
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes('/api/health')) {
          return Promise.resolve(new Response(JSON.stringify({ status: 'healthy' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }));
        }
        return originalFetch(input, init);
      };
    });
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('studio_user_plan', 'pro'));
    await page.setViewportSize({ width: 1280, height: 900 });
    await enterStudio(page);

    await page.locator('button.agent-sidebar-item[data-name="Vocal Lab"]').click({ force: true });
    const guideButton = page.getByRole('button', { name: /Got it, let's go!/i });
    await guideButton.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    if (await guideButton.isVisible().catch(() => false)) await guideButton.click({ force: true });

    const settingsButton = page.getByRole('button', { name: 'Voice Settings', exact: true });
    await settingsButton.click({ force: true });
    await expect(settingsButton).toHaveAttribute('aria-expanded', 'true');

    const settings = page.getByRole('dialog', { name: 'Personal voice and vocal settings' });
    await expect(settings).toBeVisible();
    await expect(settings).toContainText('Upload a clean 15-30s clip');
    await expect(settings).toContainText('own the voice or have explicit permission');
    await expect(settings.getByLabel('AI Voice Type')).toBeVisible();
    await expect(settings.getByLabel('Language')).toBeVisible();
    await expect(settings.getByLabel('Duration')).toBeVisible();
  });

  test('a provider failure remains visible and offers a safe retry', async ({ page }) => {
    // The local test backend intentionally has no provider credentials. Keep
    // the shell available so this test exercises the mocked generation failure
    // instead of being trapped behind the unrelated maintenance overlay.
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes('/api/health')) {
          return Promise.resolve(new Response(JSON.stringify({ status: 'healthy' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }));
        }
        return originalFetch(input, init);
      };
    });
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
    await page.getByRole('textbox', { name: 'Prompt for Music GPT' }).fill('Release smoke beat');
    await page.getByRole('button', { name: 'Generate', exact: true }).click({ force: true });

    const failure = page.getByRole('alert');
    await expect(failure).toContainText('Your credits were not charged');
    await expect(failure.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('personal voice requests stay explicit and consent-gated', async () => {
    const studioSource = readFileSync(resolve(process.cwd(), 'src/components/StudioView.jsx'), 'utf8');
    const orchestratorSource = readFileSync(resolve(process.cwd(), 'src/components/StudioOrchestratorV2.jsx'), 'utf8');
    const backendSource = readFileSync(resolve(process.cwd(), '../backend/server.js'), 'utf8');

    expect(studioSource).toContain("style: storedSpeakerUrl || storedCloneId ? 'cloned' : 'rapper'");
    expect(studioSource).toContain('isPersonalVoice: personalVoiceSelected');
    expect(studioSource.match(/preferredProvider: personalVoiceSelected \? 'elevenlabs-clone' : null/g)).toHaveLength(2);
    expect(studioSource).not.toContain("preferredProvider: personalVoiceSelected\n            ? ((voiceSampleUrl || voiceSettings.speakerUrl) ? 'minimax-music'");
    expect(studioSource).toContain('sourceAssetIds: [uploadResult.assetId]');
    expect(studioSource).toContain("mode: 'strict'");
    expect(studioSource).toContain('disabled={!elevenLabsVoiceId}');
    expect(orchestratorSource).toContain("setVoiceSource('personal');");
    expect(orchestratorSource).toContain('disabled={!clonedVoiceId}');
    expect(orchestratorSource).toContain('Voice sample saved. Choose Create My Voice to activate it before generation.');
    expect(orchestratorSource).not.toContain('Model set to "Cloned Voice"');
    expect(backendSource).toContain("const wantProvider = isPersonalVoice");
    expect(backendSource).toContain("? (strictMusicalQuality ? 'minimax-music' : 'elevenlabs-clone')");
    expect(backendSource).toContain("if (!ownedVoice || ownedVoice.consent?.confirmed !== true)");
  });

  test('public product copy does not present invented beta economics or usage totals', async () => {
    const landingSource = readFileSync(resolve(process.cwd(), 'src/components/LandingPage.jsx'), 'utf8');
    const whitepaperSource = readFileSync(resolve(process.cwd(), 'src/data/agentWhitepapers.js'), 'utf8');
    const vocalResourceSource = readFileSync(resolve(process.cwd(), 'src/components/VocalsResourcePage.jsx'), 'utf8');
    const constantsSource = readFileSync(resolve(process.cwd(), 'src/constants.js'), 'utf8');
    const multiAgentDemoSource = readFileSync(resolve(process.cwd(), 'src/components/MultiAgentDemo.jsx'), 'utf8');
    const studioSource = readFileSync(resolve(process.cwd(), 'src/components/StudioView.jsx'), 'utf8');
    const dashboardSource = readFileSync(resolve(process.cwd(), 'src/components/studio/DashboardView.jsx'), 'utf8');
    const backendSource = readFileSync(resolve(process.cwd(), '../backend/server.js'), 'utf8');

    expect(landingSource).toContain("{ metric: 'Gross margin', value: 'Not measured'");
    expect(landingSource).not.toContain("{ value: '94%', label: 'Gross Margin' }");
    expect(whitepaperSource).not.toMatch(/12M\+ lyrics|4\.8M patterns|2\.1M covers|340K videos|1\.8M tracks|890K reports|2\.3M posts|12K\+ collaborations|45K releases/);
    expect(vocalResourceSource).not.toMatch(/use forever|voice cloning in 60 seconds|broadcast-quality/i);
    expect(constantsSource).not.toMatch(/world\\?'s most powerful|Udio-style structure|Riffusion-style|deterministic generation|mathematical dna|global creator database|professional vocals/i);
    expect(multiAgentDemoSource).not.toContain('Live Demo');
    expect(landingSource).not.toMatch(/fine-tuned on millions|more artists = more data = better ai/i);
    expect(landingSource).toContain('Paid checkout is not active');
    expect(dashboardSource).toContain('Web billing is not active');
    expect(dashboardSource).toContain('shouldUseNativeIAP() ?');
    expect(dashboardSource).not.toContain("typeof window !== 'undefined' && window.Capacitor ?");
    expect(studioSource).toContain("'Authorization': `Bearer ${token}`");
    expect(studioSource).toContain('agentPromptDrafts[targetAgentSnapshot.id]');
    expect(studioSource).not.toContain("querySelectorAll('.studio-textarea')");
    expect(dashboardSource).toContain("const creditDisplay = isAdmin ? 'Unlimited' : userCredits;");
    expect(backendSource).toContain('unlimited: true');
    expect(backendSource).not.toMatch(/const avgCostPerGen = 0\.042|const cac = 2\.50|grossMargin: parseFloat/);
    expect(backendSource).toContain("measurementStatus: 'not_measured'");
  });

  test('specialized agents keep their promised output type and mastering accepts playable audio', async () => {
    const studioSource = readFileSync(resolve(process.cwd(), 'src/components/StudioView.jsx'), 'utf8');

    expect(studioSource).toContain('TEXT_AGENT_OUTPUT_CONTRACTS');
    expect(studioSource).toContain('Collaboration Goal, Roles Needed, Candidate Criteria');
    expect(studioSource).toContain('Release Goal, Timeline, Asset Checklist');
    expect(studioSource).not.toContain("'trends', 'social', 'collab', 'release'");
    expect(studioSource).toContain('(isAudioAgent || isSpeechAgent || isMasterAgent)');
    expect(studioSource).toContain('metadata: { projectId: targetProjectSnapshot?.id || null, featureType, agentId }');
    expect(studioSource).toContain('finalBody = { ...finalBody, agentId }');
    expect(studioSource).toContain('requestedDuration > 30');
  });
});
