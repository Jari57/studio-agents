// Test MiniMax HD with full song lyrics
require('dotenv').config();

const lyrics = `Verse 1:
Brooklyn nights, city lights, we rise up from the concrete.
Every block, every stop, feel the rhythm of the heartbeat.
From Bed-Stuy to the Bay, we pave our own way.
Dreams in my pocket, hustle every single day.

Chorus:
Brooklyn in the building, yeah we never fall.
Brooklyn in the building, standing ten feet tall.
From the borough to the world, we answer every call.
Brooklyn in the building, we gon take it all.

Verse 2:
Grew up on these corners, learned the game real young.
Every scar tells a story, every battle that I've won.
My city raised me right, taught me how to fight.
Now I'm shining in the spotlight, living in the light.

Chorus:
Brooklyn in the building, yeah we never fall.
Brooklyn in the building, standing ten feet tall.
From the borough to the world, we answer every call.
Brooklyn in the building, we gon take it all.

Bridge:
From nothing to something, that's the Brooklyn way.
We grind through the night just to see another day.
Stack it up, build it up, never lose the faith.
Brooklyn state of mind, yeah we run this place.

Outro:
Brooklyn, Brooklyn, we the heart of the city.
Brooklyn, Brooklyn, ain't nobody do it with me.`;

async function testLongVocal() {
  console.log('Testing MiniMax HD with', lyrics.length, 'characters of lyrics...');
  console.log('Expected audio: ~1-2 minutes\n');
  
  const startTime = Date.now();
  
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: 'fdd081f807e655246ef42adbcb3ee9334e7fdc710428684771f90d69992cabb3',
      input: {
        text: lyrics,
        voice_id: 'English_ManWithDeepVoice',
        emotion: 'auto',
        speed: 1.0,
        audio_format: 'mp3',
        sample_rate: 44100,
        bitrate: 256000
      }
    })
  });
  
  console.log('Create status:', response.status);
  const prediction = await response.json();
  console.log('Prediction ID:', prediction.id);
  
  if (!response.ok) {
    console.log('Error:', prediction);
    return;
  }
  
  // Poll for completion
  let attempts = 0;
  while (attempts < 90) { // 3 minute timeout
    await new Promise(r => setTimeout(r, 2000));
    attempts++;
    
    const statusResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      { headers: { 'Authorization': `Token ${process.env.REPLICATE_API_KEY}` } }
    );
    
    const status = await statusResponse.json();
    
    if (attempts % 5 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Poll ${attempts}: ${status.status} (${elapsed}s elapsed)`);
    }
    
    if (status.status === 'succeeded') {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n✅ SUCCESS in ${elapsed} seconds!`);
      console.log('Audio URL:', status.output?.substring(0, 80) + '...');
      
      // Get audio file size
      const audioResponse = await fetch(status.output);
      const audioBuffer = await audioResponse.arrayBuffer();
      const sizeMB = (audioBuffer.byteLength / 1024 / 1024).toFixed(2);
      console.log(`Audio size: ${sizeMB} MB (${audioBuffer.byteLength} bytes)`);
      
      // Estimate duration (192kbps = 24KB/sec)
      const estimatedDuration = (audioBuffer.byteLength / 24000).toFixed(1);
      console.log(`Estimated duration: ~${estimatedDuration} seconds`);
      
      break;
    }
    
    if (status.status === 'failed') {
      console.log('\n❌ FAILED:', status.error);
      break;
    }
  }
}

testLongVocal().catch(console.error);
