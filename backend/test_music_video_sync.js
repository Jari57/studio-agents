/**
 * Test Suite for Music Video Sync Endpoints
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:3000';

// Test audio URL (example - would need real audio)
const TEST_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null, token = 'test-token') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test 1: Check if backend is running
 */
async function testBackendStatus() {
  console.log('\n=== TEST 1: Backend Status ===');
  try {
    const res = await makeRequest('GET', '/api/models');
    console.log(`✓ Backend is running (Status: ${res.status})`);
    return true;
  } catch (error) {
    console.log(`✗ Backend not reachable: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Beat Analysis Endpoint
 */
async function testBeatAnalysis() {
  console.log('\n=== TEST 2: Beat Analysis Endpoint ===');
  try {
    const res = await makeRequest('POST', '/api/analyze-beats-test', {
      audioUrl: TEST_AUDIO_URL
    });

    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(res.body, null, 2));

    if (res.status === 200 && res.body.bpm) {
      console.log(`✓ Beat analysis working - Detected BPM: ${res.body.bpm}`);
      return true;
    } else {
      console.log('✗ Beat analysis returned unexpected format');
      return false;
    }
  } catch (error) {
    console.log(`✗ Beat analysis error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Video Sync Generation Endpoint (30s)
 */
async function testVideoSync30s() {
  console.log('\n=== TEST 3: Video Sync Generation (30s) ===');
  try {
    const res = await makeRequest('POST', '/api/generate-synced-video-test', {
      audioUrl: TEST_AUDIO_URL,
      videoPrompt: 'Cinematic music video with abstract visual effects, colorful neon lights, smooth camera movements',
      songTitle: 'Test Song',
      duration: 30,
      style: 'cinematic'
    });

    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(res.body, null, 2));

    if (res.status === 200 && res.body.videoUrl) {
      console.log(`✓ Video sync generated - URL: ${res.body.videoUrl}`);
      return true;
    } else if (res.status === 202) {
      console.log(`✓ Video processing started (async job) - Job ID: ${res.body.jobId}`);
      return true;
    } else {
      console.log('✗ Unexpected response');
      return false;
    }
  } catch (error) {
    console.log(`✗ Video sync error: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Video Metadata Endpoint
 */
async function testVideoMetadata() {
  console.log('\n=== TEST 4: Video Metadata Endpoint ===');
  try {
    // Use a public video URL for testing
    const testVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';

    const res = await makeRequest('POST', '/api/video-metadata-test', {
      videoUrl: testVideoUrl
    });

    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(res.body, null, 2));

    if (res.status === 200 && res.body.metadata) {
      console.log(`✓ Video metadata extracted`);
      return true;
    } else {
      console.log('✗ Metadata extraction failed');
      return false;
    }
  } catch (error) {
    console.log(`✗ Metadata error: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Job Status Endpoint
 */
async function testJobStatus() {
  console.log('\n=== TEST 5: Job Status Endpoint ===');
  try {
    const testJobId = 'video_1234567890_abc123def456';

    const res = await makeRequest('GET', `/api/video-job-status-test/${testJobId}`);

    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(res.body, null, 2));

    if (res.status === 200 && res.body.status) {
      console.log(`✓ Job status endpoint working`);
      return true;
    } else {
      console.log('✗ Job status endpoint failed');
      return false;
    }
  } catch (error) {
    console.log(`✗ Job status error: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║       Music Video Sync API Test Suite              ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const results = {};

  // Test 1: Backend status
  results.backendStatus = await testBackendStatus();

  if (!results.backendStatus) {
    console.log('\n❌ Backend not running. Start server with: npm start');
    process.exit(1);
  }

  // Run other tests
  results.beatAnalysis = await testBeatAnalysis();
  results.videoSync30s = await testVideoSync30s();
  results.videoMetadata = await testVideoMetadata();
  results.jobStatus = await testJobStatus();

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                  TEST SUMMARY                        ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  console.log(`\nTests Passed: ${passed}/${total}`);

  Object.entries(results).forEach(([name, passed]) => {
    const status = passed ? '✓' : '✗';
    console.log(`${status} ${name}`);
  });

  if (passed === total) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
