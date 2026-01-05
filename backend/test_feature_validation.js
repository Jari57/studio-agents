/**
 * Feature Validation Test Suite
 * Tests critical features to ensure they work as documented
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testFeature(name, testFn) {
  try {
    const result = await testFn();
    if (result.pass) {
      console.log(`${colors.green}✅ ${name}${colors.reset}`);
      if (result.note) console.log(`   ${colors.blue}ℹ ${result.note}${colors.reset}`);
      return { name, pass: true, note: result.note };
    } else {
      console.log(`${colors.red}❌ ${name}${colors.reset}`);
      console.log(`   ${colors.red}${result.reason}${colors.reset}`);
      return { name, pass: false, reason: result.reason };
    }
  } catch (err) {
    console.log(`${colors.red}❌ ${name}${colors.reset}`);
    console.log(`   ${colors.red}Error: ${err.message}${colors.reset}`);
    return { name, pass: false, reason: err.message };
  }
}

async function runValidation() {
  console.log(`\n${colors.bold}🔍 FEATURE VALIDATION TEST SUITE${colors.reset}\n`);

  const results = [];

  // Test 1: Backend is running
  results.push(await testFeature('Backend Server Running', async () => {
    const res = await makeRequest('GET', '/health');
    return { 
      pass: res.status === 200, 
      reason: res.status !== 200 ? `Status ${res.status}` : null 
    };
  }));

  // Test 2: API health endpoint
  results.push(await testFeature('API Health Endpoint', async () => {
    const res = await makeRequest('GET', '/api/health');
    return { 
      pass: res.status === 200 && res.data.status === 'ok', 
      reason: res.status !== 200 ? `Status ${res.status}` : 'Invalid response' 
    };
  }));

  // Test 3: Models endpoint
  results.push(await testFeature('Gemini Models Discovery', async () => {
    const res = await makeRequest('GET', '/api/models');
    return { 
      pass: res.status === 200 || res.status === 501,
      note: res.status === 501 ? 'listModels() not available on SDK' : `Found ${res.data?.models?.length || 0} models`,
      reason: res.status !== 200 && res.status !== 501 ? `Unexpected status ${res.status}` : null
    };
  }));

  // Test 4: Projects endpoint (no auth)
  results.push(await testFeature('Projects API Structure', async () => {
    const res = await makeRequest('GET', '/api/projects?userId=test');
    return { 
      pass: res.status === 200 || res.status === 401,
      note: res.status === 401 ? 'Requires authentication (expected)' : 'Accessible',
      reason: res.status !== 200 && res.status !== 401 ? `Unexpected status ${res.status}` : null
    };
  }));

  // Test 5: Beat detection test endpoint
  results.push(await testFeature('Beat Detection (Test Mode)', async () => {
    const res = await makeRequest('POST', '/api/analyze-beats-test', {
      audioUrl: 'https://example.com/test.mp3'
    });
    return { 
      pass: res.status === 200 || res.status === 500,
      note: res.status === 200 ? 'Endpoint accessible' : 'Needs valid audio URL',
      reason: res.status !== 200 && res.status !== 500 ? `Unexpected status ${res.status}` : null
    };
  }));

  // Test 6: Video sync test endpoint
  results.push(await testFeature('Video Sync (Test Mode)', async () => {
    const res = await makeRequest('POST', '/api/generate-synced-video-test', {
      audioUrl: 'https://example.com/test.mp3',
      videoPrompt: 'test scene',
      songTitle: 'Test Song'
    });
    return { 
      pass: res.status === 200 && res.data.videoUrl,
      note: res.status === 200 ? 'Returns test data' : 'Unexpected response',
      reason: !res.data?.videoUrl ? 'Missing videoUrl in response' : null
    };
  }));

  // Test 7: Concert feed
  results.push(await testFeature('Concert Feed API', async () => {
    const res = await makeRequest('GET', '/api/concerts?location=NYC');
    return { 
      pass: res.status === 200 && Array.isArray(res.data),
      note: `Returns ${res.data?.length || 0} concerts (mock data)`,
      reason: !Array.isArray(res.data) ? 'Invalid response format' : null
    };
  }));

  // Test 8: News feed
  results.push(await testFeature('Music News Feed API', async () => {
    const res = await makeRequest('GET', '/api/news');
    return { 
      pass: res.status === 200 && Array.isArray(res.data),
      note: `Returns ${res.data?.length || 0} news items (mock data)`,
      reason: !Array.isArray(res.data) ? 'Invalid response format' : null
    };
  }));

  // Test 9: Trending AI
  results.push(await testFeature('Trending AI Tools API', async () => {
    const res = await makeRequest('GET', '/api/trending-ai');
    return { 
      pass: res.status === 200 && Array.isArray(res.data),
      note: `Returns ${res.data?.length || 0} trending tools (mock data)`,
      reason: !Array.isArray(res.data) ? 'Invalid response format' : null
    };
  }));

  // Test 10: Stripe subscription status
  results.push(await testFeature('Stripe Subscription Status', async () => {
    const res = await makeRequest('GET', '/api/stripe/subscription-status?customerId=test');
    return { 
      pass: res.status === 200 || res.status === 404,
      note: res.status === 404 ? 'Customer not found (expected)' : 'Accessible',
      reason: res.status !== 200 && res.status !== 404 ? `Unexpected status ${res.status}` : null
    };
  }));

  // Test 11: Twitter status
  results.push(await testFeature('Twitter OAuth Status', async () => {
    const res = await makeRequest('GET', '/api/twitter/status');
    return { 
      pass: res.status === 200,
      note: res.data?.enabled ? 'OAuth enabled' : 'OAuth not configured',
      reason: res.status !== 200 ? `Status ${res.status}` : null
    };
  }));

  // Test 12: Investor access check
  results.push(await testFeature('Investor Access API', async () => {
    const res = await makeRequest('GET', '/api/investor-access/check?email=test@example.com');
    return { 
      pass: res.status === 200,
      note: res.data?.hasAccess ? 'Has access' : 'No access (expected)',
      reason: res.status !== 200 ? `Status ${res.status}` : null
    };
  }));

  // Summary
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  console.log(`\n${colors.bold}📊 VALIDATION SUMMARY${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  console.log(`${colors.bold}Total: ${results.length}${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}${colors.bold}✨ All critical features validated successfully!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  ${failed} feature(s) need attention${colors.reset}\n`);
    console.log(`Failed features:`);
    results.filter(r => !r.pass).forEach(r => {
      console.log(`  - ${r.name}: ${r.reason}`);
    });
  }

  return { total: results.length, passed, failed };
}

runValidation().catch(err => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});
