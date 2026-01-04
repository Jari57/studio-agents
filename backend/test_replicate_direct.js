// Direct test of Replicate API for MusicGen
require('dotenv').config();

async function testReplicate() {
  const replicateKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
  
  console.log('=== Replicate API Test ===');
  console.log('API Key:', replicateKey ? `${replicateKey.substring(0, 8)}...${replicateKey.slice(-4)}` : 'NOT SET');
  
  if (!replicateKey) {
    console.error('❌ No Replicate API key found in .env');
    return;
  }

  const prompt = 'lo-fi hip hop beat with piano and soft drums, chill vibes';
  console.log('\n📝 Prompt:', prompt);
  console.log('🚀 Starting prediction...\n');

  try {
    // Start the prediction
    const startResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38', // MusicGen Large
        input: {
          prompt: prompt,
          duration: 10,
          model_version: 'stereo-large',
          output_format: 'mp3',
          normalization_strategy: 'peak'
        }
      })
    });

    console.log('Start Response Status:', startResponse.status, startResponse.statusText);
    
    if (!startResponse.ok) {
      const errText = await startResponse.text();
      console.error('❌ Replicate API Error:', errText);
      return;
    }

    const prediction = await startResponse.json();
    console.log('✅ Prediction started:', prediction.id);
    console.log('   Status:', prediction.status);

    // Poll for completion
    let result = prediction;
    const maxAttempts = 90; // Extended to 3 minutes for cold starts
    
    for (let i = 0; i < maxAttempts && result.status !== 'succeeded' && result.status !== 'failed'; i++) {
      await new Promise(r => setTimeout(r, 2000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${replicateKey}` }
      });
      result = await pollResponse.json();
      console.log(`   Polling [${i + 1}/${maxAttempts}]: ${result.status}`);
    }

    if (result.status === 'succeeded') {
      console.log('\n🎵 SUCCESS! Audio URL:', result.output);
      console.log('\n✅ MusicGen is working! Your Replicate API key is valid.');
    } else if (result.status === 'failed') {
      console.error('\n❌ Generation FAILED:', result.error);
    } else {
      console.error('\n⏱️ Generation TIMED OUT. Status:', result.status);
    }

  } catch (error) {
    console.error('❌ Request Error:', error.message);
    console.error(error.stack);
  }
}

testReplicate();
