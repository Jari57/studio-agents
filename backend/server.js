const express = require('express');
const cors = require('cors');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const helmet = require('helmet');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const morgan = require('morgan');
const winston = require('winston');
const fs = require('fs');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');

// Environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';
const isProduction = NODE_ENV === 'production';

//  WINSTON LOGGER SETUP
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'studio-agents-backend', env: NODE_ENV },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Console output for development
if (isDevelopment) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
} else {
  // Simplified console for production (Railway logs)
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

logger.info(` Starting server in ${NODE_ENV} mode`);

//  FORCE LOAD .ENV FROM CURRENT DIRECTORY (local dev only)
// In production (Railway), environment variables come from the platform
const envPath = path.resolve(__dirname, '.env');
try {
  const result = require('dotenv').config({ path: envPath });
  if (result.error && result.error.code !== 'ENOENT') {
    logger.warn('.env file not found - using platform environment variables');
  } else if (!result.error) {
    logger.info('.env file loaded successfully');
  }
} catch (e) {
  logger.warn('Could not load .env file - using platform environment variables', { error: e.message });
}

// =============================================================================
// FIREBASE ADMIN INITIALIZATION
// =============================================================================

let firebaseInitialized = false;

try {
  // Check for service account credentials (JSON string or file path)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (serviceAccountJson) {
    // Parse JSON from environment variable (Railway/production)
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    logger.info('🔥 Firebase Admin initialized from environment variable');
  } else if (projectId && clientEmail && privateKey) {
    // Initialize from individual environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      })
    });
    firebaseInitialized = true;
    logger.info('🔥 Firebase Admin initialized from individual environment variables');
  } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    // Load from file path (local development)
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    logger.info('🔥 Firebase Admin initialized from file');
  } else {
    logger.warn('⚠️ Firebase Admin not configured - auth features disabled');
    logger.warn('   Set FIREBASE_SERVICE_ACCOUNT (JSON) or FIREBASE_SERVICE_ACCOUNT_PATH');
  }
} catch (error) {
  logger.error('❌ Firebase Admin initialization failed:', error.message);
}

// Firebase Auth Middleware - Verifies JWT tokens
const verifyFirebaseToken = async (req, res, next) => {
  if (!firebaseInitialized) {
    // Firebase not configured - allow request but mark as unauthenticated
    req.user = null;
    return next();
  }
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isPremium: true, // All authenticated users are premium
    };
    logger.debug('🔐 Authenticated user:', { uid: decodedToken.uid });
  } catch (error) {
    logger.warn('🔐 Invalid token:', error.message);
    req.user = null;
  }
  next();
};

// Require auth middleware - blocks unauthenticated requests
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

const app = express();
// Trust the first proxy (Railway load balancer)
app.set('trust proxy', 1); 
const PORT = process.env.PORT || 3001;

//  SECURITY: Helmet.js - Set security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

logger.info('✅ Security headers enabled (helmet.js)');

// 🛡️ SANITIZATION FUNCTIONS - Prevent prompt injection attacks
const sanitizeInput = (input, maxLength = 5000) => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[\r\n]{2,}/g, '\n'); // Normalize line breaks
};

const validatePromptSafety = (prompt) => {
  const injectionPatterns = [
    /ignore\s+previous\s+instructions?/i,
    /forget\s+everything/i,
    /disregard\s+(all\s+)?previous/i,
    /new\s+instructions?:/i,
    /you\s+are\s+now/i,
    /from\s+now\s+on/i,
    /switch\s+to|act\s+as|pretend\s+to\s+be/i,
    /execute\s+code|run\s+this|eval|exec/i,
    /system\s+prompt|secret\s+instructions?|hidden\s+rules/i,
    /leak|dump|exfiltrate|extract.*secret/i
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(prompt)) {
      return { safe: false, reason: 'Detected potential prompt injection pattern' };
    }
  }
  return { safe: true };
};

// Enhanced CORS with origin whitelist
const allowedOrigins = isDevelopment 
  ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3001']
  : [
      process.env.FRONTEND_URL,
      'https://studioagentsai.com',
      'https://www.studioagentsai.com',
      'https://studio-agents.vercel.app'
    ].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('🚫 CORS blocked', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser()); // Parse cookies for Twitter OAuth

// Serve static frontend build copied into backend/public (Railway release)
const staticDir = path.join(__dirname, 'public');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get('/', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}
//  REQUEST LOGGING
if (isDevelopment) {
  app.use(morgan('dev')); // Colorful logs for development
} else {
  // Production: Log to file and include more details
  const accessLogStream = fs.createWriteStream(
    path.join(logDir, 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
  app.use(morgan('tiny')); // Brief console output
}

// Fingerprint-based user tracking for rate limiting (IPv6-safe)
const createFingerprint = (req) => {
  const ipHash = ipKeyGenerator(req); // IPv6-safe IP normalization
  const userId = req.body?.userId || 'anon';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const components = `${ipHash}-${userId}-${userAgent}`;
  return crypto.createHash('md5').update(components).digest('hex');
};

// RATE LIMITING - Enhanced with fingerprinting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each fingerprint to 1000 requests per windowMs
  keyGenerator: createFingerprint,
  handler: (req, res) => {
    logger.warn('⚠️ Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      fingerprint: createFingerprint(req)
    });
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: '15 minutes'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes only
app.use('/api/', apiLimiter);

// Stricter limit for AI generation (most expensive operation)
const generationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each fingerprint to 60 AI generations per minute
  keyGenerator: createFingerprint,
  handler: (req, res) => {
    logger.warn('⚠️ AI generation rate limit exceeded', {
      ip: req.ip,
      fingerprint: createFingerprint(req)
    });
    res.status(429).json({
      error: 'AI generation rate limit exceeded',
      message: 'Please wait before trying again.'
    });
  },
  skipSuccessfulRequests: false
});

//  API KEY VALIDATION
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    logger.error('CRITICAL: GEMINI_API_KEY is missing!', { 
      env: NODE_ENV,
      envVars: Object.keys(process.env).filter(k => k.includes('GEMINI'))
    });
} else {
    logger.info(`API Key loaded successfully`, { 
      keyPrefix: apiKey.substring(0, 8),
      keyLength: apiKey.length 
    });
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(apiKey);

// Attempt to list available models at startup to help with debugging model selection.
(async () => {
  try {
    if (typeof genAI.listModels === 'function') {
      const models = await genAI.listModels();
      const sample = Array.isArray(models) ? models.slice(0, 20).map(m => m.name || m.model || JSON.stringify(m)) : JSON.stringify(models);
      logger.info('Available Gemini models fetched', { modelCount: sample.length, sample: sample.slice(0, 5) });
    } else {
      logger.info('listModels() not available on this SDK version');
    }
  } catch (err) {
    logger.warn('Could not list models at startup', { error: err?.message });
  }
})().catch(err => {
  logger.error('Fatal error during initialization', { error: err });
  // Don't exit the process - server should stay running even if models check fails
});

// ROOT ROUTE (Health Check)
app.get('/', (req, res) => {
  res.send('Studio Agents Backend System Online. Uplink Established.');
});

//  MONITORING DASHBOARD
app.get('/dashboard', (req, res) => {
  logger.info('Dashboard accessed', { ip: req.ip });
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// DETAILED HEALTH CHECK
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    apiKey: apiKey ? 'configured' : 'missing',
    rateLimiting: 'active',
    nodeVersion: process.version,
    platform: process.platform
  };
  
  logger.debug('Health check requested', { ip: req.ip });
  res.json(healthStatus);
});

// MODELS ROUTE - returns available models that support generateContent
app.get('/api/models', async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing API Key. Check backend/.env' });
    }

    if (typeof genAI.listModels !== 'function') {
      return res.status(501).json({
        error: 'Model listing not supported',
        details: 'This SDK version does not support listModels(). Update @google/generative-ai or manually set GENERATIVE_MODEL in .env'
      });
    }

    const models = await genAI.listModels();
    // Filter models that support generateContent
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

// GENERATION ROUTE (with optional Firebase auth)
app.post('/api/generate', verifyFirebaseToken, generationLimiter, async (req, res) => {
  try {
    let { prompt, systemInstruction, model: requestedModel } = req.body;
    
    // Log auth status
    if (req.user) {
      logger.info('🔐 Authenticated generation request', { uid: req.user.uid });
    }
    
    // 🛡️ INPUT VALIDATION & SANITIZATION
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }
    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'Prompt too long (max 10,000 characters)' });
    }
    
    // 🛡️ Sanitize inputs
    const sanitizedPrompt = sanitizeInput(prompt, 5000);
    const sanitizedSystemInstruction = sanitizeInput(systemInstruction || '', 1000);
    
    // 🛡️ Validate model name (only allow known Gemini models)
    const allowedModels = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-pro',
      'gemini-pro-vision',
      'nano-banana-pro-preview'
    ];
    const sanitizedModel = (typeof requestedModel === 'string' && allowedModels.includes(requestedModel)) 
      ? requestedModel 
      : null;
    
    // 🛡️ Check for prompt injection attempts
    const promptSafety = validatePromptSafety(sanitizedPrompt);
    if (!promptSafety.safe) {
      logger.warn('🚫 Prompt injection attempt blocked', { 
        ip: req.ip, 
        reason: promptSafety.reason,
        promptPrefix: sanitizedPrompt.slice(0, 50)
      });
      return res.status(400).json({ error: 'Invalid prompt: contains restricted content' });
    }
    
    if (sanitizedSystemInstruction) {
      const systemSafety = validatePromptSafety(sanitizedSystemInstruction);
      if (!systemSafety.safe) {
        logger.warn('🚫 System instruction injection attempt blocked', { 
          ip: req.ip, 
          reason: systemSafety.reason
        });
        return res.status(400).json({ error: 'Invalid system instruction: contains restricted content' });
      }
    }
    
    logger.info('🤖 AI generation request', { 
      ip: req.ip, 
      promptLength: sanitizedPrompt.length,
      hasSystemInstruction: !!sanitizedSystemInstruction 
    });

    if (!apiKey) {
        throw new Error("Server missing API Key. Check backend/.env");
    }

    // Use requested model if valid, otherwise fall back to env var or default
    // Defaulting to gemini-2.0-flash for better stability and availability
    const desiredModel = sanitizedModel || process.env.GENERATIVE_MODEL || "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ 
      model: desiredModel,
      systemInstruction: sanitizedSystemInstruction || undefined
    });

    const startTime = Date.now();
    const result = await model.generateContent(sanitizedPrompt);
    const response = await result.response;
    const text = response.text();
    const duration = Date.now() - startTime;

    logger.info('Generation successful', { 
      ip: req.ip,
      duration: `${duration}ms`,
      outputLength: text.length,
      model: desiredModel,
      requestedModel: requestedModel || 'default'
    });
    res.json({ output: text, model: desiredModel });

  } catch (error) {
    const msg = error && error.message ? error.message : String(error);
    const statusCode = error?.response?.status || error?.status || (msg.includes('429') ? 429 : 500);
    
    logger.error('Generation error', { 
      error: msg,
      statusCode,
      ip: req.ip,
      stack: error?.stack
    });

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

// ═══════════════════════════════════════════════════════════════════
// IMAGE GENERATION ROUTE (Imagen 4.0)
// ═══════════════════════════════════════════════════════════════════
app.post('/api/generate-image', verifyFirebaseToken, generationLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

    // Using REST API for Imagen 4.0
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1 }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Imagen API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    logger.error('Image generation error', { error: error.message });
    res.status(500).json({ error: 'Image generation failed', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// VIDEO GENERATION ROUTE (Veo 3.0)
// ═══════════════════════════════════════════════════════════════════
app.post('/api/generate-video', verifyFirebaseToken, generationLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

    // Using REST API for Veo 3.0
    const url = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predict?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Veo API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    logger.error('Video generation error', { error: error.message });
    res.status(500).json({ error: 'Video generation failed', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// TRANSLATION API - Professional Grade Translation via Gemini
// ═══════════════════════════════════════════════════════════════════

app.post('/api/translate', verifyFirebaseToken, apiLimiter, async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'auto' } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and targetLanguage are required' });
    }

    logger.info('🌐 Translation request', { 
      targetLanguage, 
      textLength: text.length,
      ip: req.ip 
    });
// Use the configured model for translation as well
    const modelName = process.env.GENERATIVE_MODEL || "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: `Return ONLY the translated text, no explanations.`
    });

    const prompt = `Translate this text from ${sourceLanguage} to ${targetLanguage}: "${text}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    res.json({ 
      translatedText,
      sourceLanguage,
      targetLanguage
    });

  } catch (error) {
    logger.error('Translation error', { error: error.message });
    res.status(500).json({ error: 'Translation failed', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// TWITTER/X OAuth 2.0 PKCE FLOW - Direct Posting Integration
// ═══════════════════════════════════════════════════════════════════

// In-memory session store (use Redis in production)
const twitterSessions = new Map();

// Twitter OAuth 2.0 configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_CALLBACK_URL = process.env.TWITTER_CALLBACK_URL || 
  (isDevelopment ? 'http://localhost:3001/api/twitter/callback' : 'https://studio-agents-production.up.railway.app/api/twitter/callback');

// ==================== CONCERTS API ====================
// Fetches real hip-hop and mainstream concerts from SeatGeek API

const SEATGEEK_CLIENT_ID = process.env.SEATGEEK_CLIENT_ID || 'MzU5NzAxNTZ8MTczNDE0NTA2My44OTU5NzA2';

// Cache concerts for 30 minutes to reduce API calls
let concertsCache = { data: null, timestamp: 0, location: null };
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

app.get('/api/concerts', async (req, res) => {
  try {
    const { lat, lon, range = 50 } = req.query;
    
    // Check cache - use cached data if same location and not expired
    const cacheKey = `${lat}-${lon}`;
    const now = Date.now();
    if (concertsCache.data && 
        concertsCache.location === cacheKey && 
        (now - concertsCache.timestamp) < CACHE_DURATION) {
      logger.info('Returning cached concerts');
      return res.json(concertsCache.data);
    }
    
    // Build SeatGeek API URL
    let apiUrl = `https://api.seatgeek.com/2/events?client_id=${SEATGEEK_CLIENT_ID}&per_page=25&type=concert&sort=datetime_local.asc`;
    
    // Add genre filter for hip-hop/rap/r&b
    apiUrl += '&genres.slug=hip-hop,rap,r-and-b,pop';
    
    // Add location if provided
    if (lat && lon) {
      apiUrl += `&lat=${lat}&lon=${lon}&range=${range}mi`;
    } else {
      // Default to major US cities rotation for variety
      const cities = [
        { lat: 40.7128, lon: -74.0060 },  // NYC
        { lat: 34.0522, lon: -118.2437 }, // LA
        { lat: 41.8781, lon: -87.6298 },  // Chicago
        { lat: 29.7604, lon: -95.3698 },  // Houston
        { lat: 33.4484, lon: -112.0740 }  // Phoenix
      ];
      const city = cities[Math.floor(Math.random() * cities.length)];
      apiUrl += `&lat=${city.lat}&lon=${city.lon}&range=100mi`;
    }
    
    logger.info('Fetching concerts from SeatGeek', { hasLocation: !!(lat && lon) });
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`SeatGeek API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to our format
    const concerts = (data.events || []).map(event => ({
      id: event.id,
      title: event.title || event.short_title,
      performers: (event.performers || []).map(p => ({
        name: p.name,
        image: p.image,
        genres: p.genres?.map(g => g.name) || []
      })),
      venue: {
        name: event.venue?.name,
        city: event.venue?.city,
        state: event.venue?.state,
        address: event.venue?.address,
        location: {
          lat: event.venue?.location?.lat,
          lon: event.venue?.location?.lon
        }
      },
      datetime: event.datetime_local,
      date: event.datetime_local ? new Date(event.datetime_local).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }) : null,
      time: event.datetime_local ? new Date(event.datetime_local).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      }) : null,
      priceRange: event.stats?.lowest_price && event.stats?.highest_price 
        ? { low: event.stats.lowest_price, high: event.stats.highest_price }
        : null,
      ticketUrl: event.url,
      image: event.performers?.[0]?.image || null,
      popularity: event.score || 0
    }));
    
    const result = { 
      concerts, 
      total: data.meta?.total || concerts.length,
      location: lat && lon ? 'custom' : 'default'
    };
    
    // Update cache
    concertsCache = { data: result, timestamp: now, location: cacheKey };
    
    logger.info(`Returning ${concerts.length} concerts`);
    res.json(result);
    
  } catch (err) {
    logger.error('Concerts API error', { error: err.message });
    
    // Return fallback data with popular upcoming tours
    const fallbackConcerts = [
      {
        id: 1,
        title: 'Kendrick Lamar - Grand National Tour',
        performers: [{ name: 'Kendrick Lamar', image: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&w=200', genres: ['Hip-Hop'] }],
        venue: { name: 'Various Venues', city: 'Multiple Cities', state: 'US' },
        datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        date: 'Coming Soon',
        time: 'TBA',
        priceRange: { low: 75, high: 350 },
        ticketUrl: 'https://www.ticketmaster.com/kendrick-lamar-tickets/artist/1546192',
        image: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&w=400',
        popularity: 95
      },
      {
        id: 2,
        title: 'Drake - Anita Max Wynn Tour',
        performers: [{ name: 'Drake', image: 'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg?auto=compress&w=200', genres: ['Hip-Hop', 'R&B'] }],
        venue: { name: 'Arena Tours', city: 'Nationwide', state: 'US' },
        datetime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        date: '2025',
        time: 'TBA',
        priceRange: { low: 100, high: 500 },
        ticketUrl: 'https://www.ticketmaster.com/drake-tickets/artist/1230030',
        image: 'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg?auto=compress&w=400',
        popularity: 98
      },
      {
        id: 3,
        title: 'J. Cole - The Fall Off Tour',
        performers: [{ name: 'J. Cole', image: 'https://images.pexels.com/photos/2479312/pexels-photo-2479312.jpeg?auto=compress&w=200', genres: ['Hip-Hop'] }],
        venue: { name: 'Stadium Tour', city: 'Various', state: 'US' },
        datetime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        date: '2025',
        time: 'TBA',
        priceRange: { low: 65, high: 275 },
        ticketUrl: 'https://www.ticketmaster.com/j-cole-tickets/artist/1586339',
        image: 'https://images.pexels.com/photos/2479312/pexels-photo-2479312.jpeg?auto=compress&w=400',
        popularity: 92
      },
      {
        id: 4,
        title: 'Tyler, The Creator - Chromakopia Tour',
        performers: [{ name: 'Tyler, The Creator', image: 'https://images.pexels.com/photos/3756766/pexels-photo-3756766.jpeg?auto=compress&w=200', genres: ['Hip-Hop', 'Alternative'] }],
        venue: { name: 'Arena Shows', city: 'US & International', state: '' },
        datetime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        date: '2025',
        time: 'Various',
        priceRange: { low: 80, high: 300 },
        ticketUrl: 'https://www.ticketmaster.com/tyler-the-creator-tickets/artist/1617057',
        image: 'https://images.pexels.com/photos/3756766/pexels-photo-3756766.jpeg?auto=compress&w=400',
        popularity: 88
      }
    ];
    
    res.json({ 
      concerts: fallbackConcerts,
      total: fallbackConcerts.length,
      source: 'fallback',
      message: 'Showing featured tours. Check Ticketmaster for live listings.'
    });
  }
});

// ==================== HIP-HOP NEWS API ====================
// Fetches real-time music news from multiple RSS sources

let newsCache = { data: [], timestamp: 0 };
const NEWS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

app.get('/api/news', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;
    const now = Date.now();
    
    // Return cached data if fresh
    if (newsCache.data.length > 0 && (now - newsCache.timestamp) < NEWS_CACHE_DURATION) {
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const paginated = newsCache.data.slice(start, end);
      
      return res.json({
        articles: paginated,
        total: newsCache.data.length,
        page,
        per_page: perPage,
        cached: true
      });
    }
    
    logger.info('Fetching fresh news from multiple sources...');
    
    const sources = [
      { name: 'PITCHFORK', url: 'https://pitchfork.com/feed/feed-news/rss', color: 'agent-purple' },
      { name: 'BILLBOARD', url: 'https://www.billboard.com/feed/', color: 'agent-cyan' },
      { name: 'ROLLING STONE', url: 'https://www.rollingstone.com/music/feed/', color: 'agent-red' },
      { name: 'NME', url: 'https://www.nme.com/feed', color: 'agent-orange' }
    ];

    const fetchSource = async (source) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(source.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) return [];
        
        const xmlText = await response.text();
        const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
        
        return items.map(item => {
          const getTag = (tag) => {
            const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
            return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
          };
          
          const title = getTag('title');
          const link = getTag('link');
          const description = getTag('description') || getTag('content:encoded');
          const pubDate = getTag('pubDate');
          const creator = getTag('dc:creator') || getTag('creator') || 'Staff';
          const category = getTag('category');
          
          // Extract image if available (media:content or enclosure)
          let imageUrl = null;
          const mediaMatch = item.match(/<media:content[^>]*url="([^"]*)"/) || item.match(/<enclosure[^>]*url="([^"]*)"/);
          if (mediaMatch) imageUrl = mediaMatch[1];

          const dateObj = pubDate ? new Date(pubDate) : new Date();
          const hoursAgo = Math.floor((Date.now() - dateObj) / (1000 * 60 * 60));
          const minsAgo = Math.floor((Date.now() - dateObj) / (1000 * 60));
          
          let timeAgo = '';
          if (minsAgo < 60) {
            timeAgo = `${minsAgo}m ago`;
          } else if (hoursAgo < 24) {
            timeAgo = `${hoursAgo}h ago`;
          } else if (hoursAgo < 48) {
            timeAgo = 'Yesterday';
          } else {
            timeAgo = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
          
          return {
            id: crypto.createHash('md5').update(link).digest('hex'),
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
            timestamp: dateObj.getTime(),
            time: timeAgo,
            source: source.name,
            color: source.color,
            author: creator,
            title: title?.replace(/&#8217;/g, "'").replace(/&#038;/g, "&").slice(0, 150) || 'UNTITLED',
            content: description?.replace(/<[^>]*>/g, '').slice(0, 200) + '...' || '',
            url: link,
            imageUrl: imageUrl,
            tags: category ? [category.toUpperCase()] : ['MUSIC']
          };
        });
      } catch (e) {
        logger.warn(`Failed to fetch ${source.name}`, { error: e.message });
        return [];
      }
    };

    // Fetch all sources in parallel
    const results = await Promise.all(sources.map(fetchSource));
    let allArticles = results.flat();
    
    // Sort by date (newest first)
    allArticles.sort((a, b) => b.timestamp - a.timestamp);
    
    // Update cache
    if (allArticles.length > 0) {
      newsCache = {
        data: allArticles,
        timestamp: now
      };
    } else if (newsCache.data.length > 0) {
      // Keep old cache if fetch failed completely
      logger.warn('Fetch failed, using stale cache');
    } else {
      // Fallback if everything fails and no cache
      allArticles = [{ 
        id: 'error', 
        date: new Date().toLocaleDateString(), 
        time: 'Now', 
        source: 'SYSTEM', 
        title: 'NEWS FEED UNAVAILABLE', 
        content: 'Unable to fetch latest news. Please try again later.', 
        tags: ['ERROR']
      }];
    }

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginated = newsCache.data.length > 0 ? newsCache.data.slice(start, end) : allArticles;

    res.json({ 
      articles: paginated, 
      total: newsCache.data.length || allArticles.length, 
      page,
      per_page: perPage,
      cached: false, 
      fetchedAt: new Date().toISOString() 
    });

  } catch (err) {
    logger.error('News API Error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// ==================== TRENDING AI PROJECTS API ====================
// Fetches real AI projects from GitHub Search API for inspiration

app.get('/api/trending-ai', async (req, res) => {
  try {
    const { page = 1, per_page = 20 } = req.query;
    
    // Search for AI-related repositories with high stars
    const keywords = ['artificial-intelligence', 'machine-learning', 'generative-ai', 'llm', 'stable-diffusion', 'music-ai'];
    const q = keywords.join(' OR ');
    const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&page=${page}&per_page=${per_page}`;
    
    logger.info('Fetching trending AI projects from GitHub', { page, per_page });
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Studio-Agents-AI-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logger.error('GitHub API error', { status: response.status, error: errorData });
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform GitHub repos into our "Activity Wall" format
    const projects = (data.items || []).map(repo => {
      const agents = ['Ghostwriter', 'Beat Lab', 'Album Artist', 'Trend Hunter', 'Collab Connect', 'Social Pilot', 'Instrumentalist', 'Beat Architect'];
      const colors = ['agent-purple', 'agent-cyan', 'agent-orange', 'agent-emerald', 'agent-indigo', 'agent-pink', 'agent-blue', 'agent-green'];
      const randomIndex = Math.floor(Math.random() * agents.length);
      
      return {
        id: repo.id,
        user: repo.owner.login,
        agent: agents[randomIndex],
        title: repo.name,
        snippet: repo.description || 'No description available.',
        time: new Date(repo.updated_at).toLocaleDateString(),
        likes: repo.stargazers_count,
        remixes: repo.forks_count,
        color: colors[randomIndex],
        url: repo.html_url,
        type: repo.id % 3 === 0 ? 'video' : (repo.id % 2 === 0 ? 'image' : 'text'),
        imageUrl: repo.id % 2 === 0 ? `https://opengraph.githubassets.com/1/${repo.full_name}` : null,
        videoUrl: repo.id % 3 === 0 ? 'https://www.w3schools.com/html/mov_bbb.mp4' : null
      };
    });
    
    res.json({
      items: projects,
      total_count: data.total_count,
      page: parseInt(page),
      per_page: parseInt(per_page)
    });
  } catch (err) {
    logger.error('❌ Failed to fetch trending AI projects', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch trending AI projects' });
  }
});

// Generate PKCE code verifier and challenge
const generatePKCE = () => {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
};

// Check if Twitter is configured
const isTwitterConfigured = () => {
  return !!(TWITTER_CLIENT_ID && TWITTER_CLIENT_SECRET);
};

// GET /api/twitter/status - Check if Twitter OAuth is available
app.get('/api/twitter/status', (req, res) => {
  res.json({
    configured: isTwitterConfigured(),
    message: isTwitterConfigured() 
      ? 'Twitter OAuth ready' 
      : 'Twitter OAuth not configured - add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET to .env'
  });
});

// GET /api/twitter/auth - Start OAuth flow
app.get('/api/twitter/auth', (req, res) => {
  if (!isTwitterConfigured()) {
    return res.status(503).json({ error: 'Twitter OAuth not configured' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const { verifier, challenge } = generatePKCE();
  
  // Store session data
  twitterSessions.set(state, {
    verifier,
    createdAt: Date.now(),
    returnUrl: req.query.returnUrl || '/'
  });

  // Clean up old sessions (older than 10 minutes)
  for (const [key, session] of twitterSessions) {
    if (Date.now() - session.createdAt > 10 * 60 * 1000) {
      twitterSessions.delete(key);
    }
  }

  const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];
  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', TWITTER_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', TWITTER_CALLBACK_URL);
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  logger.info('🐦 Twitter OAuth flow started', { state });
  res.redirect(authUrl.toString());
});

// GET /api/twitter/callback - Handle OAuth callback
app.get('/api/twitter/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    logger.warn('🐦 Twitter OAuth denied', { error });
    return res.redirect('/?twitter_error=' + encodeURIComponent(error));
  }

  const session = twitterSessions.get(state);
  if (!session) {
    logger.warn('🐦 Invalid state in Twitter callback');
    return res.redirect('/?twitter_error=invalid_state');
  }

  twitterSessions.delete(state);

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: TWITTER_CALLBACK_URL,
        code_verifier: session.verifier
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      logger.error('🐦 Twitter token exchange failed', { status: tokenResponse.status, error: errorData });
      return res.redirect('/?twitter_error=token_exchange_failed');
    }

    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });
    
    const userData = userResponse.ok ? await userResponse.json() : null;
    const username = userData?.data?.username || 'user';

    logger.info('🐦 Twitter OAuth successful', { username });

    // Return tokens to frontend via redirect with fragment (safer than query params)
    const returnUrl = new URL(session.returnUrl || '/', req.protocol + '://' + req.get('host'));
    returnUrl.searchParams.set('twitter_connected', 'true');
    returnUrl.searchParams.set('twitter_username', username);
    
    // Store encrypted token in cookie (httpOnly for security)
    res.cookie('twitter_token', tokens.access_token, {
      httpOnly: true,
      secure: !isDevelopment,
      sameSite: 'lax',
      maxAge: tokens.expires_in * 1000
    });

    if (tokens.refresh_token) {
      res.cookie('twitter_refresh', tokens.refresh_token, {
        httpOnly: true,
        secure: !isDevelopment,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    res.redirect(returnUrl.toString());
  } catch (err) {
    logger.error('🐦 Twitter OAuth error', { error: err.message });
    res.redirect('/?twitter_error=server_error');
  }
});

// ═══════════════════════════════════════════════════════════════════
// META (INSTAGRAM & FACEBOOK) OAuth 2.0 FLOW
// ═══════════════════════════════════════════════════════════════════

const META_CLIENT_ID = process.env.META_CLIENT_ID;
const META_CLIENT_SECRET = process.env.META_CLIENT_SECRET;
const META_CALLBACK_URL = process.env.META_CALLBACK_URL || 
  (isDevelopment ? 'http://localhost:3001/api/meta/callback' : 'https://studio-agents-production.up.railway.app/api/meta/callback');

const metaSessions = new Map();

app.get('/api/meta/auth', (req, res) => {
  if (!META_CLIENT_ID || !META_CLIENT_SECRET) {
    return res.status(503).json({ error: 'Meta OAuth not configured' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  metaSessions.set(state, {
    createdAt: Date.now(),
    returnUrl: req.query.returnUrl || '/'
  });

  const scopes = ['email', 'public_profile', 'instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];
  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', META_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', META_CALLBACK_URL);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', scopes.join(','));

  logger.info('♾️ Meta OAuth flow started', { state });
  res.redirect(authUrl.toString());
});

app.get('/api/meta/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    logger.warn('♾️ Meta OAuth denied', { error });
    return res.redirect('/?meta_error=' + encodeURIComponent(error));
  }

  const session = metaSessions.get(state);
  if (!session) {
    logger.warn('♾️ Invalid state in Meta callback');
    return res.redirect('/?meta_error=invalid_state');
  }

  metaSessions.delete(state);

  try {
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      params: new URLSearchParams({
        client_id: META_CLIENT_ID,
        client_secret: META_CLIENT_SECRET,
        redirect_uri: META_CALLBACK_URL,
        code
      })
    });

    // Note: fetch doesn't take 'params' in the options object like axios, 
    // we need to append them to the URL.
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', META_CLIENT_ID);
    tokenUrl.searchParams.set('client_secret', META_CLIENT_SECRET);
    tokenUrl.searchParams.set('redirect_uri', META_CALLBACK_URL);
    tokenUrl.searchParams.set('code', code);

    const actualResponse = await fetch(tokenUrl.toString());
    if (!actualResponse.ok) {
      const errorData = await actualResponse.text();
      logger.error('♾️ Meta token exchange failed', { status: actualResponse.status, error: errorData });
      return res.redirect('/?meta_error=token_exchange_failed');
    }

    const tokens = await actualResponse.json();
    
    // Get user info
    const userResponse = await fetch(`https://graph.facebook.com/me?access_token=${tokens.access_token}&fields=id,name`);
    const userData = userResponse.ok ? await userResponse.json() : null;
    const name = userData?.name || 'Meta User';

    logger.info('♾️ Meta OAuth successful', { name });

    const returnUrl = new URL(session.returnUrl || '/', req.protocol + '://' + req.get('host'));
    returnUrl.searchParams.set('meta_connected', 'true');
    returnUrl.searchParams.set('meta_name', name);
    
    res.cookie('meta_token', tokens.access_token, {
      httpOnly: true,
      secure: !isDevelopment,
      sameSite: 'lax',
      maxAge: tokens.expires_in * 1000
    });

    res.redirect(returnUrl.toString());
  } catch (err) {
    logger.error('♾️ Meta OAuth error', { error: err.message });
    res.redirect('/?meta_error=server_error');
  }
});

// POST /api/twitter/tweet - Post a tweet
app.post('/api/twitter/tweet', async (req, res) => {
  const token = req.cookies?.twitter_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated with Twitter', needsAuth: true });
  }

  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Tweet text is required' });
  }

  // Twitter limit is 280 characters
  const tweetText = text.slice(0, 280);

  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: tweetText })
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('🐦 Tweet failed', { status: response.status, error: errorData });
      
      if (response.status === 401) {
        // Token expired, clear cookies
        res.clearCookie('twitter_token');
        res.clearCookie('twitter_refresh');
        return res.status(401).json({ error: 'Twitter session expired', needsAuth: true });
      }
      
      return res.status(response.status).json({ error: 'Failed to post tweet', details: errorData });
    }

    const result = await response.json();
    logger.info('🐦 Tweet posted successfully', { tweetId: result.data?.id });
    
    res.json({
      success: true,
      tweetId: result.data?.id,
      tweetUrl: `https://twitter.com/i/status/${result.data?.id}`
    });
  } catch (err) {
    logger.error('🐦 Tweet error', { error: err.message });
    res.status(500).json({ error: 'Failed to post tweet' });
  }
});

// GET /api/twitter/disconnect - Clear Twitter session
app.get('/api/twitter/disconnect', (req, res) => {
  res.clearCookie('twitter_token');
  res.clearCookie('twitter_refresh');
  res.json({ success: true, message: 'Disconnected from Twitter' });
});

// =============================================================================
// 💳 STRIPE PAYMENT INTEGRATION
// =============================================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
let stripe = null;

if (STRIPE_SECRET_KEY) {
  const Stripe = require('stripe');
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
  logger.info('💳 Stripe initialized successfully');
} else {
  logger.warn('⚠️ STRIPE_SECRET_KEY not set - payment features disabled');
}

// Stripe Price IDs - You'll create these in the Stripe Dashboard
// https://dashboard.stripe.com/products
const STRIPE_PRICES = {
  creator: process.env.STRIPE_PRICE_CREATOR || 'price_creator_monthly',  // $9.99/mo
  studio: process.env.STRIPE_PRICE_STUDIO || 'price_studio_monthly'      // $24.99/mo
};

// Initialize Firebase Admin for server-side subscription management
let firebaseAdmin = null;
let adminDb = null;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

if (FIREBASE_SERVICE_ACCOUNT) {
  try {
    const admin = require('firebase-admin');
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
    
    if (!admin.apps.length) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      adminDb = admin.firestore();
      logger.info('🔥 Firebase Admin initialized successfully');
    }
  } catch (err) {
    logger.error('❌ Firebase Admin init failed', { error: err.message });
  }
} else {
  logger.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not set - subscription sync disabled');
}

// POST /api/stripe/create-checkout-session - Create a Stripe Checkout session
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  const { tier, userId, userEmail, successUrl, cancelUrl } = req.body;

  if (!tier || !['creator', 'studio'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid subscription tier' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User must be logged in to subscribe' });
  }

  const priceId = STRIPE_PRICES[tier];
  
  try {
    // Check if user already has a Stripe customer ID
    let customerId = null;
    if (adminDb) {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        customerId = userDoc.data()?.stripeCustomerId;
      }
    }

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}?payment=cancelled`,
      client_reference_id: userId,
      metadata: {
        userId,
        tier,
        userEmail: userEmail || ''
      }
    };

    if (customerId) {
      sessionParams.customer = customerId;
    } else if (userEmail) {
      sessionParams.customer_email = userEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logger.info('💳 Checkout session created', { sessionId: session.id, tier, userId: userId.slice(0, 8) + '...' });

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (err) {
    logger.error('❌ Stripe checkout error', { error: err.message });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/stripe/webhook - Handle Stripe webhook events
// IMPORTANT: This must use raw body, not JSON parsed
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      // For testing without webhook signature verification
      event = JSON.parse(req.body.toString());
      logger.warn('⚠️ Webhook signature verification skipped (no secret configured)');
    }
  } catch (err) {
    logger.error('❌ Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info('💳 Webhook received', { type: event.type });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleSuccessfulCheckout(session);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionCancelled(subscription);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        logger.info('💳 Unhandled webhook event', { type: event.type });
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('❌ Webhook handler error', { error: err.message, type: event.type });
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handle successful checkout - activate subscription
async function handleSuccessfulCheckout(session) {
  const userId = session.client_reference_id || session.metadata?.userId;
  const tier = session.metadata?.tier || 'creator';
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!userId) {
    logger.error('❌ No userId in checkout session');
    return;
  }

  logger.info('💳 Processing successful checkout', { userId: userId.slice(0, 8) + '...', tier });

  if (adminDb) {
    try {
      // Get subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      await adminDb.collection('users').doc(userId).set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        subscriptionStart: new Date(subscription.current_period_start * 1000),
        subscriptionEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      }, { merge: true });

      logger.info('✅ Subscription saved to Firebase', { userId: userId.slice(0, 8) + '...', tier });
    } catch (err) {
      logger.error('❌ Failed to save subscription', { error: err.message });
    }
  }
}

// Handle subscription updates (upgrade/downgrade)
async function handleSubscriptionUpdate(subscription) {
  if (!adminDb) return;

  const customerId = subscription.customer;
  
  try {
    // Find user by Stripe customer ID
    const usersSnapshot = await adminDb.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      logger.warn('⚠️ No user found for customer', { customerId: customerId.slice(0, 8) + '...' });
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const priceId = subscription.items.data[0]?.price?.id;
    
    // Determine tier from price ID
    let tier = 'creator';
    if (priceId === STRIPE_PRICES.studio) tier = 'studio';

    await userDoc.ref.update({
      subscriptionTier: tier,
      subscriptionStatus: subscription.status,
      subscriptionEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date()
    });

    logger.info('✅ Subscription updated', { userId: userDoc.id.slice(0, 8) + '...', tier, status: subscription.status });
  } catch (err) {
    logger.error('❌ Failed to update subscription', { error: err.message });
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(subscription) {
  if (!adminDb) return;

  const customerId = subscription.customer;
  
  try {
    const usersSnapshot = await adminDb.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.update({
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled',
        updatedAt: new Date()
      });
      
      logger.info('✅ Subscription cancelled', { userId: userDoc.id.slice(0, 8) + '...' });
    }
  } catch (err) {
    logger.error('❌ Failed to process cancellation', { error: err.message });
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  if (!adminDb) return;

  const customerId = invoice.customer;
  
  try {
    const usersSnapshot = await adminDb.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.update({
        subscriptionStatus: 'past_due',
        paymentFailedAt: new Date(),
        updatedAt: new Date()
      });
      
      logger.info('⚠️ Payment failed - subscription past due', { userId: userDoc.id.slice(0, 8) + '...' });
    }
  } catch (err) {
    logger.error('❌ Failed to process payment failure', { error: err.message });
  }
}

// GET /api/stripe/subscription-status - Check user's subscription status
app.get('/api/stripe/subscription-status', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  if (!adminDb) {
    // Return free tier if Firebase not configured
    return res.json({ tier: 'free', status: 'none' });
  }

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.json({ tier: 'free', status: 'none' });
    }

    const data = userDoc.data();
    const now = new Date();
    const subscriptionEnd = data.subscriptionEnd?.toDate?.() || data.subscriptionEnd;

    // Check if subscription is still valid
    if (data.subscriptionStatus === 'active' && subscriptionEnd && subscriptionEnd > now) {
      return res.json({
        tier: data.subscriptionTier || 'creator',
        status: 'active',
        expiresAt: subscriptionEnd.toISOString(),
        customerId: data.stripeCustomerId
      });
    }

    return res.json({ 
      tier: 'free', 
      status: data.subscriptionStatus || 'none',
      expiredAt: subscriptionEnd?.toISOString?.()
    });
  } catch (err) {
    logger.error('❌ Failed to check subscription', { error: err.message });
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

// POST /api/stripe/create-portal-session - Customer portal for managing subscription
app.post('/api/stripe/create-portal-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  const { userId, returnUrl } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    // Get customer ID from Firebase
    let customerId = null;
    if (adminDb) {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        customerId = userDoc.data()?.stripeCustomerId;
      }
    }

    if (!customerId) {
      return res.status(404).json({ error: 'No subscription found for this user' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}?from=portal`
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error('❌ Portal session error', { error: err.message });
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// =============================================================================
// PROJECT PERSISTENCE (My Studio)
// =============================================================================

// POST /api/projects - Save a project
app.post('/api/projects', verifyFirebaseToken, async (req, res) => {
  const { userId, project } = req.body;
  
  // Allow saving if we have a userId (even if not fully auth'd via token for now, to support the "Mock" login)
  // In a real app, we'd strictly enforce req.user.uid === userId
  const targetUserId = req.user ? req.user.uid : userId;

  if (!targetUserId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  if (!project) {
    return res.status(400).json({ error: 'Project data required' });
  }

  try {
    if (adminDb) {
      await adminDb.collection('users').doc(targetUserId).collection('projects').doc(String(project.id)).set({
        ...project,
        savedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      logger.info('💾 Project saved', { userId: targetUserId, projectId: project.id });
      res.json({ success: true });
    } else {
      // Fallback if Firebase not init (local dev without creds)
      logger.warn('💾 Firebase not init, skipping save');
      res.json({ success: true, warning: 'Cloud storage not available' });
    }
  } catch (err) {
    logger.error('❌ Save project error', { error: err.message });
    res.status(500).json({ error: 'Failed to save project' });
  }
});

// GET /api/projects - Get user projects
app.get('/api/projects', verifyFirebaseToken, async (req, res) => {
  const userId = req.query.userId;
  const targetUserId = req.user ? req.user.uid : userId;

  if (!targetUserId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  try {
    if (adminDb) {
      const snapshot = await adminDb.collection('users').doc(targetUserId).collection('projects')
        .orderBy('savedAt', 'desc')
        .limit(50)
        .get();
      
      const projects = [];
      snapshot.forEach(doc => projects.push(doc.data()));
      
      res.json({ projects });
    } else {
      res.json({ projects: [] });
    }
  } catch (err) {
    logger.error('❌ Fetch projects error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// DELETE /api/projects/:id - Delete a project
app.delete('/api/projects/:id', verifyFirebaseToken, async (req, res) => {
  const projectId = req.params.id;
  const userId = req.query.userId;
  const targetUserId = req.user ? req.user.uid : userId;

  if (!targetUserId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  try {
    if (adminDb) {
      await adminDb.collection('users').doc(targetUserId).collection('projects').doc(projectId).delete();
      logger.info('🗑️ Project deleted', { userId: targetUserId, projectId });
      res.json({ success: true });
    } else {
      logger.warn('🗑️ Firebase not init, skipping delete');
      res.json({ success: true, warning: 'Cloud storage not available' });
    }
  } catch (err) {
    logger.error('❌ Delete project error', { error: err.message });
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// =============================================================================
// END STRIPE INTEGRATION
// =============================================================================

const HOST = '0.0.0.0'; // Bind to all interfaces for Railway
const server = app.listen(PORT, HOST, () => {
  logger.info('✅ Server started successfully', {
    host: HOST,
    port: PORT,
    environment: NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform
  });
  logger.info(`🚀 Uplink Ready at http://${HOST}:${PORT}`);
});

// Global error handler middleware
app.use((err, req, res, next) => {
  logger.error('❌ Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Don't leak error details in production
  if (isDevelopment) {
    res.status(err.statusCode || 500).json({
      error: err.message,
      stack: err.stack
    });
  } else {
    res.status(err.statusCode || 500).json({
      error: 'Internal server error'
    });
  }
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('⚠️ SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('⚠️ SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('✅ Server closed successfully');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('❌ Uncaught Exception - Server will restart', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Promise Rejection', { reason, promise });
  // Don't exit - keep server running even on unhandled rejections
});