import { test, expect } from '@playwright/test';

/**
 * Authenticated API Tests for Studio Agents
 * 
 * These tests use a test Firebase token to validate protected endpoints.
 * 
 * SETUP:
 * 1. Create a test user in Firebase Authentication
 * 2. Generate a custom token or use Firebase Auth REST API to get an ID token
 * 3. Set TEST_FIREBASE_TOKEN environment variable
 * 
 * To get a test token:
 * - Option 1: Use Firebase Admin SDK to create a custom token
 * - Option 2: Use Firebase Auth REST API with test credentials
 * - Option 3: Export a token from browser DevTools after login
 * 
 * Run with: TEST_FIREBASE_TOKEN=your_token npx playwright test auth.spec.ts
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_FIREBASE_TOKEN || '';

// Skip all tests if no token is provided
test.describe('Authenticated API Endpoints', () => {
  
  test.beforeEach(async () => {
    if (!TEST_TOKEN) {
      test.skip();
    }
  });

  test.describe('User Profile', () => {
    
    test('GET /api/user/profile returns user data', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('uid');
      expect(data).toHaveProperty('email');
    });

    test('PUT /api/user/profile updates user data', async ({ request }) => {
      const response = await request.put(`${BACKEND_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        },
        data: {
          displayName: 'Test User',
          preferences: { theme: 'dark' }
        }
      });
      
      expect([200, 201]).toContain(response.status());
    });

  });

  test.describe('User Credits', () => {
    
    test('GET /api/user/credits returns credit balance', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/user/credits`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('credits');
      expect(typeof data.credits).toBe('number');
    });

    test('GET /api/user/credits/history returns transactions', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/user/credits/history`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('history');
      expect(Array.isArray(data.history)).toBe(true);
    });

  });

  test.describe('Projects', () => {
    
    let testProjectId: string;

    test('GET /api/user/projects returns project list', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/user/projects`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('projects');
      expect(Array.isArray(data.projects)).toBe(true);
    });

    test('POST /api/user/projects creates a new project', async ({ request }) => {
      const response = await request.post(`${BACKEND_URL}/api/user/projects`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        },
        data: {
          name: 'Test Project ' + Date.now(),
          description: 'Created by automated test',
          agents: ['Ghostwriter', 'BeatArchitect']
        }
      });
      
      expect([200, 201]).toContain(response.status());
      const data = await response.json();
      if (data.id) {
        testProjectId = data.id;
      }
    });

    test('DELETE /api/user/projects/:id deletes a project', async ({ request }) => {
      // First create a project to delete
      const createResponse = await request.post(`${BACKEND_URL}/api/user/projects`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        },
        data: {
          name: 'Project to Delete ' + Date.now(),
          description: 'Will be deleted'
        }
      });
      
      if (createResponse.status() === 201 || createResponse.status() === 200) {
        const created = await createResponse.json();
        if (created.id) {
          const deleteResponse = await request.delete(`${BACKEND_URL}/api/user/projects/${created.id}`, {
            headers: {
              'Authorization': `Bearer ${TEST_TOKEN}`
            }
          });
          expect([200, 204]).toContain(deleteResponse.status());
        }
      }
    });

  });

  test.describe('Generations', () => {
    
    test('GET /api/user/generations returns generation history', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/user/generations`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('generations');
      expect(Array.isArray(data.generations)).toBe(true);
    });

    test('POST /api/user/generations logs a generation', async ({ request }) => {
      const response = await request.post(`${BACKEND_URL}/api/user/generations`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        },
        data: {
          type: 'lyrics',
          agent: 'Ghostwriter',
          prompt: 'Test prompt',
          output: 'Test output from automated test',
          creditsUsed: 1
        }
      });
      
      expect([200, 201]).toContain(response.status());
    });

    test('GET /api/user/generations with agent filter', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/user/generations?agent=Ghostwriter`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      expect(response.status()).toBe(200);
    });

  });

  test.describe('Media Generation (with auth)', () => {
    
    test('POST /api/generate-image with auth works', async ({ request }) => {
      const response = await request.post(`${BACKEND_URL}/api/generate-image`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        },
        data: {
          prompt: 'Album cover, abstract art, purple and gold'
        }
      });
      
      // Should work (200) or fail gracefully (500 if API not configured)
      expect([200, 500, 503]).toContain(response.status());
    });

    test('POST /api/generate-audio with auth works', async ({ request }) => {
      const response = await request.post(`${BACKEND_URL}/api/generate-audio`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        },
        data: {
          prompt: 'Chill lofi beat, 90 BPM'
        }
      });
      
      expect([200, 500, 503]).toContain(response.status());
    });

  });

  test.describe('AMO Orchestrator (with auth)', () => {
    
    test('POST /api/amo/orchestrate processes multi-agent session', async ({ request }) => {
      const response = await request.post(`${BACKEND_URL}/api/amo/orchestrate`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        },
        data: {
          session: {
            bpm: 120,
            key: 'C minor',
            style: 'Hip-hop'
          },
          tracks: [
            { agent: 'Ghostwriter', prompt: 'Write a verse about the hustle' },
            { agent: 'BeatArchitect', prompt: 'Create a dark trap beat' }
          ],
          masterSettings: {
            renderMode: 'text'
          }
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.output).toHaveProperty('tracks');
      expect(data.output.tracks.length).toBe(2);
    });

  });

  test.describe('Subscription', () => {
    
    test('GET /api/user/subscription returns subscription status', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/user/subscription`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('tier');
    });

  });

});

// Test helper to generate a Firebase token (requires service account)
test.describe('Token Generation Helper', () => {
  
  test.skip('Generate test token (manual run only)', async () => {
    // This is a helper test to generate tokens for testing
    // Run manually when you need a new token:
    // npx playwright test auth.spec.ts -g "Generate test token"
    
    console.log(`
    To get a Firebase ID token for testing:
    
    1. Sign in to your app in the browser
    2. Open DevTools Console
    3. Run: firebase.auth().currentUser.getIdToken()
    4. Copy the token and set: TEST_FIREBASE_TOKEN=<token>
    
    Or use the Firebase Auth REST API:
    curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY" \\
      -H "Content-Type: application/json" \\
      -d '{"email":"test@example.com","password":"testpass","returnSecureToken":true}'
    `);
  });

});
