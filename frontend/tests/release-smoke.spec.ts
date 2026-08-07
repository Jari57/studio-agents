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
  });

  test('a public share URL routes to the share surface rather than the landing page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/#/share/12345678-abc`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Share unavailable' })).toBeVisible();
  });
});
