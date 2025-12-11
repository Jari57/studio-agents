const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

// 🟢 FORCE LOAD .ENV FROM CURRENT DIRECTORY (local dev only)
// In production (Railway), environment variables come from the platform
const envPath = path.resolve(__dirname, '.env');
try {
  const result = require('dotenv').config({ path: envPath });
  if (result.error && result.error.code !== 'ENOENT') {
    // Only log errors that aren't "file not found" (expected in production)
    console.warn("⚠️  .env file not found - using platform environment variables");
  }
} catch (e) {
  console.warn("⚠️  Could not load .env file - using platform environment variables");
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// 🟢 DEBUG: CHECK IF KEY LOADED (Safe Print)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("🔴 CRITICAL: GEMINI_API_KEY is missing from .env file!");
} else {
    console.log(`🟢 API Key Loaded: ${apiKey.substring(0, 8)}...`);
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(apiKey);

// Attempt to list available models at startup to help with debugging model selection.
(async () => {
  try {
    if (typeof genAI.listModels === 'function') {
      const models = await genAI.listModels();
      const sample = Array.isArray(models) ? models.slice(0, 20).map(m => m.name || m.model || JSON.stringify(m)) : JSON.stringify(models);
      console.log('🟢 Available models (sample):', sample);
    } else {
      console.log('ℹ️ listModels() not available on this SDK version.');
    }
  } catch (err) {
    console.warn('⚠️ Could not list models at startup:', err && err.message ? err.message : err);
  }
})();

// ROOT ROUTE (Health Check)
app.get('/', (req, res) => {
  res.send('Whip Montez Backend System Online. Uplink Established.');
});

// MODELS ROUTE - returns available models that support generateContent
app.get('/api/models', async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing API Key. Check backend/.env' });
    }

    if (typeof genAI.listModels !== 'function') {
      return res.status(501).json({ error: 'listModels() is not available in this SDK version.' });
    }

    const models = await genAI.listModels();
    // `models` may be an array of model objects. Filter those that advertise generateContent support.
    const supported = (Array.isArray(models) ? models : []).filter(m => {
      try {
        const methods = m.supportedGenerationMethods || m.supportedMethods || [];
        return Array.isArray(methods) && methods.includes('generateContent');
      } catch (e) { return false; }
    }).map(m => (m.name || m.model || '').toString().replace(/^models\//, ''));

    res.json({ models: supported });
  } catch (err) {
    res.status(500).json({ error: 'Model listing failed', details: err && err.message ? err.message : String(err) });
  }
});

// GENERATION ROUTE
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    console.log("Received generation request...");

    if (!apiKey) {
        throw new Error("Server missing API Key. Check backend/.env");
    }

    const desiredModel = process.env.GENERATIVE_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ 
      model: desiredModel,
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Generation successful.");
    res.json({ output: text });

  } catch (error) {
    const msg = error && error.message ? error.message : String(error);
    console.error('Generation Error:', msg);
    const suggestion = msg.toLowerCase().includes('not found') || msg.includes('404')
      ? 'Model not found for this API/version. Restart the server to see `listModels()` output, or set a supported model in backend/server.js or via env var `GENERATIVE_MODEL`.'
      : null;
    const details = suggestion ? `${msg} | SUGGESTION: ${suggestion}` : msg;
    res.status(500).json({ error: 'AI Generation Failed', details });
  }
});

app.listen(PORT, () => {
  console.log(`> Server running on http://localhost:${PORT}`);
  console.log('> Uplink Ready.');
});