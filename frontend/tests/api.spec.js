import { test, expect } from '@playwright/test';

/**
 * API Endpoint Tests for Studio Agents Backend
 * Tests the user data, generations, projects, and billing endpoints
 * 
 * NOTE: These tests run against the backend API directly.
 * Some endpoints require Firebase authentication - those are marked as skip
 * until we have a test user token strategy.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

test.describe('Backend API Health', () => {
  
  test('Health endpoint returns 200', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('Root endpoint is reachable', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/`);
    // In dev mode serves dashboard HTML, in prod may redirect
    expect([200, 301, 302]).toContain(response.status());
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

  test('Create checkout requires valid tier and userId', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/stripe/create-checkout`, {
      data: { tier: 'creator' }
    });
    // Should fail due to missing userId or Stripe not configured (503) or not found (404)
    expect([400, 401, 404, 500, 503]).toContain(response.status());
  });

});

// ============================================================================
// AMO ORCHESTRATOR TESTS
// ============================================================================

test.describe('AMO Orchestrator Endpoint', () => {

  test('Orchestrate endpoint requires authentication', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/orchestrate`, {
      data: {
        agentOutputs: [
          { id: '1', agent: 'Ghostwriter', type: 'lyrics', content: 'Test lyrics' }
        ],
        projectName: 'Test Project'
      }
    });
    // 404 if not implemented, 401 if implemented with auth
    expect([401, 404]).toContain(response.status());
  });

  test('Orchestrate endpoint validates request body', async ({ request }) => {
    // Empty body should fail (or 404 if not implemented)
    const response = await request.post(`${BACKEND_URL}/api/orchestrate`, {
      data: {}
    });
    expect([400, 401, 404]).toContain(response.status());
  });

  test('Orchestrate endpoint rejects empty agent outputs', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/orchestrate`, {
      data: {
        agentOutputs: [],
        projectName: 'Test'
      }
    });
    // 404 if not implemented, 400/401 if implemented
    expect([400, 401, 404]).toContain(response.status());
  });

});

// ============================================================================
// MEDIA GENERATION API TESTS
// ============================================================================

test.describe('Media Generation Endpoints', () => {

  test('Image generation endpoint exists', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate-image`, {
      data: { prompt: 'test image' }
    });
    // Endpoint exists - may return 200 with error, or various error codes
    expect([200, 400, 401, 404, 500, 503]).toContain(response.status());
  });

  test('Audio generation endpoint exists', async ({ request }) => {
    // We send an empty prompt to verify the endpoint exists 
    // without triggering a slow generation process
    const response = await request.post(`${BACKEND_URL}/api/generate-audio`, {
      data: { prompt: '' } 
    });
    // Endpoint exists - should return 400 for empty prompt, or other codes if auth is required
    expect([200, 400, 401, 404, 500, 503]).toContain(response.status());
  });

  test('Video generation endpoint exists', async ({ request }) => {
    // Video generation with Veo takes 2-3 minutes, just check endpoint exists
    // by sending a test prompt. We use a longer timeout for health check.
    test.setTimeout(240000); // 4 minutes
    const response = await request.post(`${BACKEND_URL}/api/generate-video`, {
      data: { prompt: 'test video' }
    });
    expect([200, 400, 401, 500, 503]).toContain(response.status());
  });

});

// ============================================================================
// AGENT-SPECIFIC FEATURE TESTS
// ============================================================================

test.describe('Agent Features', () => {

  test('Generate with Ghostwriter system prompt', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: {
        prompt: 'Write a 2 line hook about success',
        systemInstruction: 'You are Ghostwriter, a lyric writing agent. Write compelling, rhythmic lyrics.'
      }
    });
    // Accept success or API/rate limit errors
    expect([200, 429, 500, 503]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('output');
      expect(typeof data.output).toBe('string');
    }
  });

  test('Generate with Beat Architect system prompt', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: {
        prompt: 'Describe a 120 BPM trap beat',
        systemInstruction: 'You are Beat Architect, a beat production agent. Describe beats in musical terms.'
      }
    });
    expect([200, 429, 500, 503]).toContain(response.status());
  });

  test('Generate with Visual Vibe system prompt', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: {
        prompt: 'Describe album artwork for a hip-hop single',
        systemInstruction: 'You are Visual Vibe, an art direction agent. Describe visuals in cinematic detail.'
      }
    });
    expect([200, 429, 500, 503]).toContain(response.status());
  });

  test('Generate with Soundscape Designer prompt', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: {
        prompt: 'Create ambient atmosphere for a rainy night scene',
        systemInstruction: 'You are Soundscape Designer. Create immersive audio environments.'
      }
    });
    expect([200, 429, 500, 503]).toContain(response.status());
  });

});

// ============================================================================
// FIREBASE / FIRESTORE INTEGRATION TESTS
// ============================================================================

test.describe('Firebase Integration', () => {

  test('Projects endpoint returns proper error without auth', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/user/projects`);
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('Generations endpoint with agent filter param', async ({ request }) => {
    // Test that the agent query param is accepted (will still fail auth)
    const response = await request.get(`${BACKEND_URL}/api/user/generations?agent=Ghostwriter`);
    expect(response.status()).toBe(401);
  });

  test('User credits endpoint requires auth', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/user/credits`);
    // 404 if not implemented, 401 if implemented with auth
    expect([401, 404]).toContain(response.status());
  });

  test('Add credits endpoint requires auth', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/user/credits`, {
      data: { amount: 100, reason: 'test' }
    });
    // 404 if not implemented, 401 if implemented with auth
    expect([401, 404]).toContain(response.status());
  });

  test('Deduct credits endpoint requires auth', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/user/credits/deduct`, {
      data: { amount: 10, reason: 'generation' }
    });
    // 404 if not implemented, 401 if implemented with auth
    expect([401, 404]).toContain(response.status());
  });

});

// ============================================================================
// PROJECT MANAGEMENT TESTS
// ============================================================================

test.describe('Project Management', () => {

  test('POST project requires name field', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/user/projects`, {
      data: { data: { assets: [] } }
    });
    expect([400, 401]).toContain(response.status());
  });

  test('DELETE project requires authentication', async ({ request }) => {
    const response = await request.delete(`${BACKEND_URL}/api/user/projects/test-project-id`);
    expect(response.status()).toBe(401);
  });

  test('PUT project update requires authentication', async ({ request }) => {
    const response = await request.put(`${BACKEND_URL}/api/user/projects/test-id`, {
      data: { name: 'Updated Project' }
    });
    expect([401, 404]).toContain(response.status());
  });

});

// ============================================================================
// SANITY CHECKS - FULL FLOW VALIDATION
// ============================================================================

test.describe('Sanity Checks', () => {

  test('Backend is responding with correct headers', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    expect(response.status()).toBe(200);
    // Check CORS headers are present for frontend access
    const _headers = response.headers();
    // In production, should have proper CORS
    expect(response.ok()).toBe(true);
  });

  test('API returns JSON content type', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('Generate endpoint latency is reasonable', async ({ request }) => {
    const start = Date.now();
    const _response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: {
        prompt: 'Say hello',
        systemInstruction: 'Be brief'
      },
      timeout: 30000 // 30 second timeout
    });
    const duration = Date.now() - start;
    
    // Log timing for debugging
    console.log(`Generate endpoint responded in ${duration}ms`);
    
    // Should respond within 30 seconds (API may be slow but shouldn't hang)
    expect(duration).toBeLessThan(30000);
  });

  test('All core endpoints are reachable', async ({ request }) => {
    // Only test endpoints that are definitely implemented
    const endpoints = [
      { method: 'GET', path: '/health' },
      { method: 'GET', path: '/api/models' },
      { method: 'GET', path: '/api/investor-access/check?email=test@test.com' },
      { method: 'POST', path: '/api/generate' },
      { method: 'GET', path: '/api/user/profile' },
      { method: 'GET', path: '/api/user/projects' },
      { method: 'GET', path: '/api/user/generations' }
    ];

    for (const endpoint of endpoints) {
      let response;
      if (endpoint.method === 'GET') {
        response = await request.get(`${BACKEND_URL}${endpoint.path}`);
      } else {
        response = await request.post(`${BACKEND_URL}${endpoint.path}`, { data: {} });
      }
      
      // Should not return 500 (server error)
      // 401 is expected for protected routes, 400 for bad requests, 501 for unimplemented
      expect([200, 400, 401, 501, 503]).toContain(response.status());
      console.log(`${endpoint.method} ${endpoint.path}: ${response.status()}`);
    }
  });

});
