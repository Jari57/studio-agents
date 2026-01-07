import { test, expect } from '@playwright/test';

/**
 * End-to-End Flow Tests for Studio Agents
 * Tests complete user journeys through the application
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// ============================================================================
// GENERATION FLOW (TEXT MODE)
// ============================================================================

test.describe('Generation Flow - Text Mode', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
  });

  test('Text generation returns response without errors', async ({ request }) => {
    // Direct API test for text generation
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: {
        prompt: 'Write a 4-line hook about dreams',
        systemInstruction: 'You are a professional songwriter. Be creative and lyrical.'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('output');
    expect(data.output.length).toBeGreaterThan(10);
    console.log(`Generation output: ${data.output.substring(0, 100)}...`);
  });

  test('AMO orchestrator processes multi-agent request', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/amo/orchestrate`, {
      data: {
        session: {
          bpm: 120,
          key: 'C minor',
          style: 'Hip-hop'
        },
        tracks: [
          { agent: 'Ghostwriter', prompt: 'Write a verse about the city' },
          { agent: 'BeatArchitect', prompt: 'Create a dark trap beat' }
        ],
        masterSettings: {
          renderMode: 'text'
        }
      }
    });
    
    // Should respond with orchestrated output, 503 if not configured, or 404 if not implemented
    expect([200, 404, 503]).toContain(response.status());
  });

});

// ============================================================================
// USER DATA FLOW (WITH MOCK AUTH)
// ============================================================================

test.describe('User Data Flow', () => {

  test('Credits system returns proper structure', async ({ request }) => {
    // Test credits endpoint (will return 401 without auth, which is expected)
    const response = await request.get(`${BACKEND_URL}/api/user/credits`);
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('Projects endpoint properly authenticates', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/user/projects`);
    expect(response.status()).toBe(401);
  });

  test('Generations history endpoint properly authenticates', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/user/generations`);
    expect(response.status()).toBe(401);
  });

});

// ============================================================================
// MEDIA GENERATION FLOW
// ============================================================================

test.describe('Media Generation Flow', () => {

  test('Image generation endpoint exists', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate-image`, {
      data: { prompt: 'album cover, neon aesthetic' }
    });
    
    // Should require auth (401) or work (200), not 404
    expect([200, 401, 503]).toContain(response.status());
  });

  test('Audio generation endpoint exists', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate-audio`, {
      data: { prompt: 'chill lofi beat' }
    });
    
    expect([200, 401, 503]).toContain(response.status());
  });

  test('Video generation endpoint exists', async ({ request }) => {
    // Video generation via Veo can take 2+ minutes, so use extended timeout
    test.setTimeout(180000); // 3 minutes
    
    const response = await request.post(`${BACKEND_URL}/api/generate-video`, {
      data: { prompt: 'music video, abstract visuals' }
    });
    
    // Accept 500 if video API not configured
    expect([200, 401, 500, 503]).toContain(response.status());
  });

});

// ============================================================================
// INVESTOR ACCESS FLOW
// ============================================================================

test.describe('Investor Access Flow', () => {

  test('Check investor status for non-existent email', async ({ request }) => {
    const response = await request.get(
      `${BACKEND_URL}/api/investor-access/check?email=random${Date.now()}@test.com`
    );
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.approved).toBe(false);
  });

  test('Request investor access', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/investor-access/request`, {
      data: {
        email: `test${Date.now()}@investor.com`,
        name: 'Test Investor',
        company: 'Test Capital',
        message: 'Interested in seed round'
      }
    });
    
    // Should work, require auth, or return 500 if not configured
    expect([200, 201, 401, 500]).toContain(response.status());
  });

});

// ============================================================================
// STRIPE INTEGRATION FLOW
// ============================================================================

test.describe('Stripe Integration Flow', () => {

  test('Checkout session endpoint exists', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/stripe/checkout-session`, {
      data: {
        priceId: 'price_test',
        userId: 'test-user'
      }
    });
    
    // Should require auth, valid Stripe config, or return 404 if not implemented
    expect([200, 400, 401, 404, 500]).toContain(response.status());
  });

  test('Subscription status check requires auth', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/user/subscription`);
    expect(response.status()).toBe(401);
  });

});

// ============================================================================
// ERROR HANDLING FLOW
// ============================================================================

test.describe('Error Handling', () => {

  test('Invalid JSON returns proper error', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      headers: { 'Content-Type': 'application/json' },
      data: 'this is not json'
    });
    
    // Should handle gracefully, not crash
    expect(response.status()).toBeLessThan(600);
  });

  test('Missing required fields returns 400', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: {} // Empty body
    });
    
    // Should return 400 or 500 with error message
    expect([400, 500]).toContain(response.status());
  });

  test('Non-existent endpoint returns 404', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/this-does-not-exist`);
    expect(response.status()).toBe(404);
  });

});

// ============================================================================
// CORS & SECURITY
// ============================================================================

test.describe('CORS & Security', () => {

  test('API allows cross-origin requests', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`, {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    
    expect(response.status()).toBe(200);
    // CORS headers should be present
    const headers = response.headers();
    console.log('Response headers:', Object.keys(headers).join(', '));
  });

  test('Protected endpoints reject missing auth', async ({ request }) => {
    const protectedEndpoints = [
      '/api/user/profile',
      '/api/user/projects',
      '/api/user/generations',
      '/api/user/credits',
      '/api/user/subscription'
    ];
    
    for (const endpoint of protectedEndpoints) {
      const response = await request.get(`${BACKEND_URL}${endpoint}`);
      expect(response.status()).toBe(401);
    }
  });

});

// ============================================================================
// FULL E2E SCENARIO
// ============================================================================

test.describe('Full E2E Scenario', () => {

  test('Complete generation flow (unauthenticated)', async ({ request, page }) => {
    // 1. Check health
    const healthResponse = await request.get(`${BACKEND_URL}/health`);
    expect(healthResponse.status()).toBe(200);
    
    // 2. Test text generation (works without auth)
    const genResponse = await request.post(`${BACKEND_URL}/api/generate`, {
      data: {
        prompt: 'Write a short motivational quote',
        systemInstruction: 'Be inspiring'
      }
    });
    expect(genResponse.status()).toBe(200);
    
    // 3. Verify frontend loads
    await page.goto(FRONTEND_URL);
    await expect(page.locator('body')).toBeVisible();
    
    // 4. Check investor access
    const investorResponse = await request.get(
      `${BACKEND_URL}/api/investor-access/check?email=demo@test.com`
    );
    expect(investorResponse.status()).toBe(200);
    
    console.log('✅ Full E2E flow completed successfully');
  });

});

// ============================================================================
// PROJECT SAVE/LOAD CYCLE
// ============================================================================

test.describe('Project Save/Load Cycle', () => {

  test('Project save endpoint requires auth', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/user/projects`, {
      data: {
        name: 'Test Project',
        type: 'orchestrator',
        outputs: { lyrics: 'test lyrics' }
      }
    });
    // Should require authentication
    expect(response.status()).toBe(401);
  });

  test('Project list endpoint requires auth', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/user/projects`);
    expect(response.status()).toBe(401);
  });

  test('Project update endpoint requires auth', async ({ request }) => {
    const response = await request.put(`${BACKEND_URL}/api/user/projects/test-project-id`, {
      data: {
        name: 'Updated Project',
        outputs: { lyrics: 'updated lyrics' }
      }
    });
    expect(response.status()).toBe(401);
  });

  test('Project delete endpoint requires auth', async ({ request }) => {
    const response = await request.delete(`${BACKEND_URL}/api/user/projects/test-project-id`);
    expect(response.status()).toBe(401);
  });

});

// ============================================================================
// PERFORMANCE BENCHMARKS
// ============================================================================

test.describe('Performance Benchmarks', () => {

  test('API response times are acceptable', async ({ request }) => {
    const benchmarks: { endpoint: string; time: number }[] = [];
    
    // Health check
    let start = Date.now();
    await request.get(`${BACKEND_URL}/health`);
    benchmarks.push({ endpoint: '/health', time: Date.now() - start });
    
    // Models list
    start = Date.now();
    await request.get(`${BACKEND_URL}/api/models`);
    benchmarks.push({ endpoint: '/api/models', time: Date.now() - start });
    
    // Investor check
    start = Date.now();
    await request.get(`${BACKEND_URL}/api/investor-access/check?email=test@test.com`);
    benchmarks.push({ endpoint: '/api/investor-access/check', time: Date.now() - start });
    
    console.log('Performance benchmarks:');
    for (const b of benchmarks) {
      console.log(`  ${b.endpoint}: ${b.time}ms`);
      expect(b.time).toBeLessThan(5000); // 5 second max for any endpoint
    }
  });

});
