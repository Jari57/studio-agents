// Test all create/generate endpoints
const BASE_URL = 'http://localhost:3001';

async function testEndpoint(name, url, body) {
  console.log(`\n${name}:`);
  try {
    const start = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const elapsed = Date.now() - start;
    const data = await res.json();
    
    if (res.ok) {
      // Check for expected output based on endpoint
      if (data.output) {
        console.log(`  ✅ PASS (${elapsed}ms) - Text output: ${data.output.substring(0, 50)}...`);
        return true;
      } else if (data.images && data.images.length > 0) {
        console.log(`  ✅ PASS (${elapsed}ms) - Image size: ${data.images[0].length} chars`);
        return true;
      } else if (data.audioUrl) {
        console.log(`  ✅ PASS (${elapsed}ms) - Audio URL: ${data.audioUrl.substring(0, 50)}...`);
        return true;
      } else if (data.audio) {
        console.log(`  ✅ PASS (${elapsed}ms) - Audio data returned`);
        return true;
      } else if (data.type === 'synthesis') {
        console.log(`  ⚠️ PARTIAL (${elapsed}ms) - Synthesis fallback (Replicate needs credits)`);
        return 'partial';
      } else if (data.video || data.videoUrl) {
        console.log(`  ✅ PASS (${elapsed}ms) - Video returned`);
        return true;
      } else {
        console.log(`  ⚠️ UNKNOWN - Keys: ${Object.keys(data).join(', ')}`);
        return 'unknown';
      }
    } else {
      console.log(`  ❌ FAIL (${res.status}) - ${data.error || JSON.stringify(data).substring(0, 100)}`);
      return false;
    }
  } catch (err) {
    console.log(`  ❌ ERROR - ${err.message}`);
    return false;
  }
}

async function runTests() {
  console.log('=== TESTING ALL CREATE/GENERATE FEATURES ===\n');
  
  const results = [];
  
  // 1. Text generation
  results.push(await testEndpoint(
    '1. Text Generation (Ghostwriter)',
    `${BASE_URL}/api/generate`,
    { prompt: 'write a catchy 2-line song hook', systemInstruction: 'be a hit songwriter' }
  ));
  
  // 2. Image generation
  results.push(await testEndpoint(
    '2. Image Generation (Cover Art)',
    `${BASE_URL}/api/generate-image`,
    { prompt: 'colorful abstract album cover with sunset vibes' }
  ));
  
  // 3. Speech/TTS generation
  results.push(await testEndpoint(
    '3. Speech Generation (Voiceover)',
    `${BASE_URL}/api/generate-speech`,
    { prompt: 'Hello world, this is a test of the text to speech system', voice: 'Kore' }
  ));
  
  // 4. Audio/Beat generation
  results.push(await testEndpoint(
    '4. Audio Generation (Beat Lab)',
    `${BASE_URL}/api/generate-audio`,
    { prompt: 'chill lofi hip hop beat', bpm: 90, genre: 'lofi', mood: 'chill' }
  ));
  
  // 5. Video generation (if available)
  results.push(await testEndpoint(
    '5. Video Generation (Video Creator)',
    `${BASE_URL}/api/generate-video`,
    { prompt: 'music video with dancing' }
  ));
  
  // Summary
  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r === true).length;
  const partial = results.filter(r => r === 'partial').length;
  const failed = results.filter(r => r === false).length;
  console.log(`Passed: ${passed}, Partial: ${partial}, Failed: ${failed}`);
}

runTests();
