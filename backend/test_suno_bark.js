/**
 * Test script for Suno/Bark vocal generation endpoint
 * Usage: node test_suno_bark.js
 * 
 * Make sure the server is running on localhost:3000 before running this test.
 */

const http = require('http');

const testPayload = {
  prompt: "Yeah making moves in the city tonight, grinding hard chasing dreams until the morning light",
  voice: "rapper-male-1",
  style: "rapper",
  rapStyle: "trap",
  genre: "hip-hop"
};

const data = JSON.stringify(testPayload);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate-speech',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  },
  timeout: 300000  // 5 minutes timeout for Suno generation
};

console.log('🎤 Testing Suno/Bark Vocal Generation...');
console.log('📝 Prompt:', testPayload.prompt);
console.log('🎵 Style:', testPayload.rapStyle, testPayload.genre);
console.log('⏳ This may take 30-90 seconds...\n');

const req = http.request(options, (res) => {
  let responseData = '';
  
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseData);
      console.log('\n✅ Response received!');
      console.log('Status:', res.statusCode);
      
      // Check for audio URL
      if (parsed.audioUrl) {
        console.log('\n🎵 Audio URL:', parsed.audioUrl.substring(0, 100) + '...');
        console.log('📍 Audio URL length:', parsed.audioUrl.length, 'characters');
      }
      
      // Check for audio data
      if (parsed.audio) {
        console.log('\n🔊 Audio Data: (base64 encoded)');
        console.log('📍 Audio data length:', parsed.audio.length, 'characters');
      }
      
      // Check for source
      if (parsed.source) {
        console.log('🎤 Source:', parsed.source);
      }
      
      // Check for provider
      if (parsed.provider) {
        console.log('🔌 Provider:', parsed.provider);
      }
      
      // Check for message
      if (parsed.message) {
        console.log('💬 Message:', parsed.message);
      }
      
      // Check for duration
      if (parsed.duration) {
        console.log('⏱️ Duration:', parsed.duration);
      }
      
      // Check for error
      if (parsed.error) {
        console.log('❌ Error:', parsed.error);
        if (parsed.details) {
          console.log('📋 Details:', parsed.details);
        }
      }
      
      // Show all keys in response
      console.log('\n📦 Response keys:', Object.keys(parsed));
      
    } catch (e) {
      console.log('\n⚠️ Could not parse JSON, raw response length:', responseData.length);
      console.log('First 500 chars:', responseData.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
  if (e.code === 'ECONNREFUSED') {
    console.log('💡 Make sure the server is running: node server.js');
  }
});

req.on('timeout', () => {
  console.error('⏰ Request timed out');
  req.destroy();
});

req.write(data);
req.end();
