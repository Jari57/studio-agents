const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
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

// �️ RATE LIMITING - CRITICAL FOR PRODUCTION
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to API routes only
app.use('/api/', apiLimiter);

// Stricter limit for AI generation (most expensive operation)
const generationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI generations per minute
  message: 'AI generation rate limit exceeded. Please wait before trying again.',
  skipSuccessfulRequests: false
});

// �🟢 DEBUG: CHECK IF KEY LOADED (Safe Print)
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
})().catch(err => {
  console.error('🔴 Fatal error during initialization:', err);
  // Don't exit the process - server should stay running even if models check fails
});

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

    if (typeof genAI.listMgenerationLimiter, async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    
    // 🛡️ INPUT VALIDATION
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }
    if (prompt.length > 10000) { // Prevent abuse with extremely long prompts
      return res.status(400).json({ error: 'Prompt too long (max 10,000 characters)' });
    }
    
    console.log(`[${new Date().toISOString()}] Generation request from ${req.ip}`
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
    const statusCode = error?.response?.status || error?.status || (msg.includes('429') ? 429 : 500);
    console.error('Generation Error:', msg);

    // Handle quota / rate limit explicitly so the frontend can show a clear message
    if (statusCode === 429) {
      return res.status(429).json({
        error: 'Rate limited or quota exceeded',
        details: 'Gemini returned 429. Check billing/quotas for the GEMINI_API_KEY or switch to a lower-cost model (e.g., gemini-1.5-flash).'
      });
    }

    const suggestion = msg.toLowerCase().includes('not found') || msg.includes('404')
      ? 'Model not found for this API/version. Restart the server to see `listModels()` output, or set a supported model in backend/server.js or via env var `GENERATIVE_MODEL`.'
      : null;
    const details = suggestion ? `${msg} | SUGGESTION: ${suggestion}` : msg;
    res.status(500).json({ error: 'AI Generation Failed', details });
  }
});

const HOST = '0.0.0.0'; // Bind to all interfaces for Railway
const server = app.listen(PORT, HOST, () => {
  console.log(`> Server running on http://${HOST}:${PORT}`);
  console.log('> Uplink Ready.');
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🔴 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔴 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🔴 Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running even on unhandled rejections
});