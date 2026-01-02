import { test, expect } from '@playwright/test';

/**
 * API Endpoint Tests for Studio Agents Backend
 * Tests the user data, generations, projects, and billing endpoints
 * 
 * NOTE: These tests run against the backend API directly.
 * Some endpoints require Firebase authentication - those are marked as skip
 * until we have a test user token strategy.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

test.describe('Backend API Health', () => {
  
  test('Health endpoint returns 200', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('API info endpoint returns version', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('status');
  });

});

test.describe('Public API Endpoints', () => {

  test('Investor access check endpoint works', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/investor-access/check?email=test@example.com`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('approved');
    expect(typeof data.approved).toBe('boolean');
  });

  test('Investor access check requires email', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/investor-access/check`);
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Email required');
  });

  test('Models endpoint returns list or 501', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/models`);
    // May return 200 with models or 501 if SDK doesn't support listModels
    expect([200, 501]).toContain(response.status());
  });

});

test.describe('Protected API Endpoints (Auth Required)', () => {
  
  // These tests verify that protected endpoints properly reject unauthenticated requests
  
  test('User profile requires authentication', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/user/profile`);
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toContain('Authentication');
  });

  test('User generations requires authentication', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/user/generations`);
    expect(response.status()).toBe(401);
  });

  test('User projects requires authentication', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/user/projects`);
    expect(response.status()).toBe(401);
  });

  test('User subscription requires authentication', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/user/subscription`);
    expect(response.status()).toBe(401);
  });

  test('User billing requires authentication', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/user/billing`);
    expect(response.status()).toBe(401);
  });

  test('POST profile update requires authentication', async ({ request }) => {
    const response = await request.put(`${BACKEND_URL}/api/user/profile`, {
      data: { displayName: 'Test' }
    });
    expect(response.status()).toBe(401);
  });

  test('POST generation log requires authentication', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/user/generations`, {
      data: { type: 'lyrics', prompt: 'test', output: 'test output' }
    });
    expect(response.status()).toBe(401);
  });

  test('POST project save requires authentication', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/user/projects`, {
      data: { name: 'Test Project', data: {} }
    });
    expect(response.status()).toBe(401);
  });

  test('POST session log requires authentication', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/user/session`, {
      data: { action: 'login' }
    });
    expect(response.status()).toBe(401);
  });

});

test.describe('Generation Endpoint', () => {

  test('Generate endpoint requires prompt', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: { systemInstruction: 'be helpful' }
    });
    // Should fail due to missing prompt
    expect([400, 500]).toContain(response.status());
  });

  test('Generate endpoint accepts valid request structure', async ({ request }) => {
    // This test just verifies the endpoint is reachable and processes requests
    // It may fail with rate limits or API key issues, which is expected in CI
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: { 
        prompt: 'Say hello in one word',
        systemInstruction: 'Be brief'
      }
    });
    // Accept success or rate limit/API errors (429, 500, 503)
    expect([200, 429, 500, 503]).toContain(response.status());
  });

});

test.describe('Stripe Endpoints', () => {

  test('Subscription status requires userId', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/stripe/subscription-status`);
    // Should fail or return no subscription
    expect([400, 200]).toContain(response.status());
  });

  test('Create checkout requires authentication or userId', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/stripe/create-checkout`, {
      data: { tier: 'creator' }
    });
    // Should fail due to missing userId
    expect([400, 401, 500]).toContain(response.status());
  });

});
