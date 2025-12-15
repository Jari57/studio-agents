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
  defaultMeta: { service: 'whip-montez-backend', env: NODE_ENV },
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

const app = express();
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
      'https://whipmontez.com',
      'https://www.whipmontez.com'
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
  max: 100, // Limit each fingerprint to 100 requests per windowMs
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
  max: 10, // Limit each fingerprint to 10 AI generations per minute
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
  res.send('Whip Montez Backend System Online. Uplink Established.');
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

// GENERATION ROUTE
app.post('/api/generate', generationLimiter, async (req, res) => {
  try {
    let { prompt, systemInstruction, model: requestedModel } = req.body;
    
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
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-pro',
      'gemini-pro-vision'
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
    const desiredModel = sanitizedModel || process.env.GENERATIVE_MODEL || "gemini-2.0-flash-exp";
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
// TWITTER/X OAuth 2.0 PKCE FLOW - Direct Posting Integration
// ═══════════════════════════════════════════════════════════════════

// In-memory session store (use Redis in production)
const twitterSessions = new Map();

// Twitter OAuth 2.0 configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_CALLBACK_URL = process.env.TWITTER_CALLBACK_URL || 
  (isDevelopment ? 'http://localhost:3001/api/twitter/callback' : 'https://whipmontez.com/api/twitter/callback');

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
    
    const response = await fetch(apiUrl);
    
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
    res.status(500).json({ 
      error: 'Failed to fetch concerts', 
      details: err.message,
      // Fallback data
      concerts: [],
      total: 0 
    });
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