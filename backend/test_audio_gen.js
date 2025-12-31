
// const fetch = require('node-fetch'); // Using global fetch

async function testAudioGen() {
  console.log('🎵 Testing /api/generate-audio endpoint...');
  
  try {
    const response = await fetch('http://localhost:3001/api/generate-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'test beat',
        bpm: 100,
        genre: 'hip-hop',
        mood: 'chill'
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log('Response Body Preview:', text.substring(0, 500));

    try {
      const json = JSON.parse(text);
      console.log('✅ Parsed JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e.message);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testAudioGen();
