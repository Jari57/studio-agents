const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function testGeminiCurl() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY is not set.');
    return;
  }

  console.log(`🔑 Testing with API Key: ${apiKey.substring(0, 8)}...`);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    console.log('🌐 Fetching models via REST API...');
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response body:', text);
      return;
    }

    const data = await response.json();
    console.log('✅ Success! Found models:');
    if (data.models) {
        data.models.forEach(m => {
             console.log(` - ${m.name.replace('models/', '')}`);
        });
    } else {
        console.log('No models found in response:', data);
    }

  } catch (error) {
    console.error('❌ Fetch Error:', error.message);
  }
}

testGeminiCurl();
