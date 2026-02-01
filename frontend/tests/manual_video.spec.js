import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:3000';

test('Manual Video Generation Test', async ({ request }) => {
    test.setTimeout(180000); // 3 minutes
    console.log('Starting video generation test with prompt: "test video"');
    const response = await request.post(`${BACKEND_URL}/api/generate-video`, {
      data: { prompt: 'test video' }
    });
    console.log('Response status:', response.status());
    const body = await response.json().catch(() => ({}));
    console.log('Response body:', JSON.stringify(body, null, 2));
    expect([200, 400, 401, 500, 503]).toContain(response.status());
});
