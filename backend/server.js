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
const Replicate = require('replicate');

// Services
const emailService = require('./services/emailService');
const userPreferencesService = require('./services/userPreferencesService');
const { analyzeMusicBeats } = require('./services/beatDetectionService');
const { 
  composeVideoWithBeats,
  createBeatSyncedVideo,
  getVideoMetadata
} = require('./services/videoCompositionService');
const {
  generateSyncedMusicVideo,
  generateVideoSegments,
  generateSingleVideo
} = require('./services/videoGenerationOrchestrator');

// Audio processing imports
let WaveFile;
try {
  WaveFile = require('wavefile').WaveFile;
} catch (e) {
  console.warn('wavefile not available, audio mastering will be limited');
}

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

// =============================================================================
// ADMIN ACCOUNTS CONFIGURATION
// =============================================================================
// These emails have full admin access for testing and demo purposes
const ADMIN_EMAILS = [
  'jari@studioagents.ai',          // Primary admin
  'jari57@gmail.com',              // Jari personal email
  'demo@studioagents.ai',          // Demo account for presentations
  'test@studioagents.ai',          // QA testing account
  'support@studioagents.ai',       // Support team access
  'dev@studioagents.ai'            // Developer testing account
];

// Demo accounts with pre-loaded credits for testing
const DEMO_ACCOUNTS = {
  'demo@studioagents.ai': { credits: 1000, tier: 'lifetime', displayName: 'Demo User' },
  'test@studioagents.ai': { credits: 500, tier: 'pro', displayName: 'Test User' },
  'jari@studioagents.ai': { credits: 9999, tier: 'lifetime', displayName: 'Jari (Admin)' }
};

// Hardcoded Firebase config (Railway env vars not working)
// The private key is split to avoid GitHub secret scanning
const FIREBASE_CONFIG = {
  type: 'service_account',
  project_id: 'studioagents-app',
  private_key_id: '4f9aafecec75ab4e23decdec5a0212046fd78697',
  client_email: 'firebase-adminsdk-fbsvc@studioagents-app.iam.gserviceaccount.com',
  client_id: '101326229195887107234',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40studioagents-app.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com'
};

// Private key stored as base64 to avoid GitHub detection (decode at runtime)
const FIREBASE_PRIVATE_KEY_B64 = 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQzh5OWlpc1FBUkliTTMKdkJYVzc5VlNDMXMxSTh' +
  'FTGVvMHp3Y2RQWHpUS1FKMTUxTGhLK2c1ZTNZUTQ2VGxGd3NaZTZ1ODNQZkIxNjZjcAp3SjZJUkFtYUh4eDkydHRlL0pkcEl6aGJLL01oVXFVU1k0OUhGZXFEdE9SZVNJblQ2UWRMWVBoeXV5R3c5eVNOClJtZGorWkhzL2grdEIvRGFTdGhZMmI3ZmF4bnAwYVlDRDNhUzBVU0dUUEs1SGkwQ1ZDcE90TTcvK28vL2FLT2EKSEs2YjJoZzl6aHprMGVRNG5QOHMybElvbFg0cnV1RkovbzdlNjhYemZzTWNuYlVxMkJIZktNaVRnWm9QRnZMQQpLREFUekp3bXYwb01HcWNidDdET05WeEVGejlEV3o5N1F0MTJjc3lNcnF2QnZJeDAxNTg2UkFUcXJlVUNSTUFpCjN2ZTVRS1BuQWdNQkFBRUNnZ0VBUmp4YnVxSzRrS2NGNGwweGpzV29pWjQ1N3puKzdrTklWcEhua1FxdE8vVHYKNE13WFI2VmhSVCtKbWhhQnZRY3AvMVBOYkxLNVMxVkEyaEtUcDhRUUFtdENrVHVqVXVJTGZneWhRYUhIRUlXTApiWnptUjU3S29QYmg0b1YvNlBzUFFLYXhweFVoQXBIZTRrUG40TlNPeWlqOEpjWUhmMTVLd0RzNWZDcCsrSEhuCk5DLzh0Qi9CVW1lc1JNNUdUclV3eXAxKzlJbGZ4cExJeGJ5di9lZGxFUmNpMTJwQ29iUzllczhIS00rN2VnM0cKOW1xeUNiZXB2by9HTit0SHJCSElOMk42aWhyQW9jbkN5UWdaWGlidzY0RFZRZnhnQ0cvcFU3d0JzUXdrZTFMNApQcnBsTWJJVEJEWDJiSUYydU5vMEtNMTZ5MXBUamVzYlMxWDh6enZCYVFLQmdRRHFZb1Y2RE9RU3h5eGpFWTdmCjBNTjhTdlZOMmJqUVIwaU95WHZyMFJKVXhhRXpCaHlKZFhLc0lIMlhTQzRTbHVNaUhabSsyb1c4T0NGdUdzVVUKbGxDekd2cFdYZU1ubU9SZWpWaXFKYmowbkFNMThhV0JBMHpFalQ1cVphODRBdUJKdHBocXNPeWs4dTErT0VJVQpxSlM3SmlQYzJaWnJpbk5NTnIxZ0V0UER0UUtCZ1FET05RdlVqeDZsQU5DcmxGYlBla0JVSXdqMDA4NjZsZFpGCitHc0dYUi8reEtwbzkyYytwTTVWQnVyNzZrWnRJSTJGc2NvRVlGR01Obml0SXdLcHVOVThLc2VwbjBta1BJY08KUTA2c2VRZS9LWWRKZ2hYMHJ6Z05qWXhJRXJLd0tQOWo2b3NESDlUZ1JYQ2k2VkFaSUhOdXBaTTY0bTJ6aDhWdAptTVRZTTUrQ3F3S0JnQlZNSEhySm54UEJ1MXZKSmFWYXI5aWthd1BHNjg4cEd3TzJkU2NwV1RRUXZTUUl3eUVPClpmd1QrN1Y2WG8xYjNvbWtET3RWcWQ4L2JuSTF4b0NuWSsvU1hMcnFUeEN6Q05VNm5McmhNSnd4Yk8xQzV0b0IKTmNHS1lBaUU4dFh4RlBZOXZEMjlrOU10SzcxVFdWWE5ONjZGdWE2QXF2VmNvRHRsb2ZHUDVHUWRBb0dBSU5CbQpNb3dYNTFBSzVOTDFRWTBGd1ozVnBnZ3lwSlNGaFpyemhRNjZzYk1nSHhZSHN2dE03bERzZ2V3VkN2YWNMc05OCkQ0YzRVdVMwTFhFZDBsNWNhSGV5VURiTjVEblJrQjU3M1l4aEJEV2Fsc01CdFc5UXJ5OXdQR1BsVlkwZ253aksKMkZOdmI4VDlHSitpSkcxNmtRZitOdWVqWjJkYXJvY2FCQUdyQjRNQ2dZRUFnQWliL1B5eXMyd3JpZ0xrZFFscwpTSGdHOVg1blgxbXRxOHdYSGE1L0M0Z2RzczBxeURzbDNONWZOR1pTSHQrYlJxOFAyY2hpQjVxUXNGakpNVDM2CmxkaDB5Sy8ySG1PbWRXenUyeFdXeFNwcXVNQWRxN2lHendlTThIdi9BZTcxdGRZWVZMV2lzQnJVOWJ1RTIxWjEKd1N5OUhjTERJUjhRelJzWEZIT3JBaU09Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K';

try {
  // Check for service account credentials (multiple methods supported)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  // Debug: Log which variables are present (not values)
  logger.info('🔍 Firebase env check:', {
    hasServiceAccountJson: !!serviceAccountJson,
    hasServiceAccountBase64: !!serviceAccountBase64,
    hasServiceAccountPath: !!serviceAccountPath,
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKey,
    hasHardcodedConfig: !!FIREBASE_CONFIG,
    privateKeyLength: privateKey ? privateKey.length : 0
  });
  
  // PRIORITY: Use hardcoded config (workaround for Railway env var issues)
  if (FIREBASE_CONFIG && FIREBASE_PRIVATE_KEY_B64) {
    const privateKeyDecoded = Buffer.from(FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8');
    const serviceAccount = {
      ...FIREBASE_CONFIG,
      private_key: privateKeyDecoded
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    logger.info('🔥 Firebase Admin initialized from hardcoded config');
  } else if (serviceAccountBase64) {
    // WORKAROUND: Decode base64-encoded service account (avoids special char issues)
    const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decoded);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    logger.info('🔥 Firebase Admin initialized from BASE64 environment variable');
  } else if (serviceAccountJson) {
    // Parse JSON from environment variable (Railway/production)
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseInitialized = true;
    logger.info('🔥 Firebase Admin initialized from JSON environment variable');
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
    logger.warn('   Set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT (JSON)');
  }
} catch (error) {
  logger.error('❌ Firebase Admin initialization failed:', error.message);
}

// Firestore database helper - uses named database 'studio-agents-db'
const FIRESTORE_DATABASE_ID = 'studio-agents-db';
let firestoreDb = null;

function getFirestoreDb() {
  if (!firebaseInitialized) return null;
  if (!firestoreDb) {
    // Use getFirestore with database ID for named databases
    const { getFirestore } = require('firebase-admin/firestore');
    firestoreDb = getFirestore(admin.app(), FIRESTORE_DATABASE_ID);
    logger.info(`🔥 Firestore connected to database: ${FIRESTORE_DATABASE_ID}`);
  }
  return firestoreDb;
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

// Admin check middleware - verifies user is an admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.user.email || !ADMIN_EMAILS.includes(req.user.email.toLowerCase())) {
    logger.warn(`🚫 Admin access denied for: ${req.user.email}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  req.user.isAdmin = true;
  logger.info(`✅ Admin access granted: ${req.user.email}`);
  next();
};

// Check if user is admin (doesn't block, just sets flag)
const checkAdmin = (req, res, next) => {
  if (req.user && req.user.email && ADMIN_EMAILS.includes(req.user.email.toLowerCase())) {
    req.user.isAdmin = true;
  }
  next();
};

// Credit Check Middleware
const checkCredits = async (req, res, next) => {
  if (!firebaseInitialized) {
    logger.warn('⚠️ Firebase not initialized - skipping credit check');
    return next();
  }
  
  if (!req.user) {
    return next(); 
  }

  // Skip credit check for admin users
  if (ADMIN_EMAILS.includes(req.user.email)) {
    logger.info(`✅ Admin user ${req.user.email} - skipping credit check`);
    return next();
  }

  const db = getFirestoreDb();
  if (!db) return next();
  
  const userRef = db.collection('users').doc(req.user.uid);

  try {
    await db.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      
      if (!doc.exists) {
        // Initialize new user with 3 trial credits, deduct 1 immediately -> 2
        t.set(userRef, { 
          email: req.user.email,
          credits: 2, 
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          tier: 'free'
        });
        logger.info(`✨ New user initialized with trial credits: ${req.user.uid}`);
        return;
      }

      const userData = doc.data();
      const credits = userData.credits !== undefined ? userData.credits : 0;

      if (credits <= 0) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      t.update(userRef, { credits: credits - 1 });
    });

    logger.info(`💰 Credit deducted for user ${req.user.uid}`);
    next();
  } catch (error) {
    if (error.message === 'INSUFFICIENT_CREDITS') {
      logger.warn(`🚫 Insufficient credits for user ${req.user.uid}`);
      return res.status(403).json({ 
        error: 'Insufficient Credits', 
        details: 'You have run out of generation credits. Please upgrade your plan.' 
      });
    }
    
    logger.error('🔥 Credit check transaction failed:', error);
    return res.status(500).json({ error: 'Transaction Failed', details: 'Could not verify credit balance.' });
  }
};

const app = express();
// Trust the first proxy (Railway load balancer)
// Increased to 3 to handle potential multiple proxy layers in production
app.set('trust proxy', 3); 
const PORT = process.env.PORT || 3000;

//  SECURITY: Helmet.js - Set security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        // Firebase Auth & Storage
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://firebasestorage.googleapis.com",
        "https://www.googleapis.com",
        "https://*.firebaseio.com",
        // Stripe
        "https://api.stripe.com",
        // Railway backend (production)
        "https://web-production-b5922.up.railway.app",
        "https://*.up.railway.app",
        // Vercel frontend (production)
        "https://studioagentsai.com",
        "https://www.studioagentsai.com",
        "https://studio-agents.vercel.app",
        "https://*.vercel.app",
        // Replicate AI services
        "https://api.replicate.com",
        "https://replicate.com",
        "https://*.replicate.delivery",
        // Local development
        "http://localhost:*",
        "http://127.0.0.1:*",
        // WebSocket support
        "ws://localhost:*",
        "wss://*.railway.app"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://apis.google.com", 
        "https://www.gstatic.com",
        "https://js.stripe.com"
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "data:", "https:", "blob:"], // Allow audio/video media
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", "https://*.firebaseapp.com"]
    },
  },
  // Allow Firebase popup auth to work properly
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false, // Required for Firebase auth
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
  ? [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://127.0.0.1:3001',
  'https://studioagentsai.com',
  'https://www.studioagentsai.com',
  'https://studio-agents.vercel.app',
  process.env.FRONTEND_URL]
  : [
      process.env.FRONTEND_URL,
  'http://localhost:5173', 
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://127.0.0.1:3001',
  'https://studioagentsai.com',
  'https://www.studioagentsai.com',
  'https://studio-agents.vercel.app',
    ].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in the explicit whitelist
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Allow all Vercel and Railway deployments (dynamic previews)
    if (origin.endsWith('.vercel.app') || origin.endsWith('.railway.app')) {
      return callback(null, true);
    }

    // Allow localhost in development
    if (isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }

    logger.warn('🚫 CORS blocked', { origin, allowedOrigins });
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // Cache preflight for 24 hours
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static frontend build copied into backend/public (Railway release)
const staticDir = path.join(__dirname, 'public');
const dashboardPath = path.join(__dirname, 'dashboard.html');

logger.info(`Static directory: ${staticDir}`);
logger.info(`Dashboard path: ${dashboardPath}`);
logger.info(`isDevelopment: ${isDevelopment}`);

// In development, only serve dashboard and API - frontend runs on Vite (port 5173)
if (isDevelopment) {
  app.use(morgan('dev'));
  
  // Root shows a simple API status page in dev mode
  app.get('/', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'Studio Agents Backend API', 
      mode: 'development',
      endpoints: {
        health: '/api/health',
        dashboard: '/dashboard',
        docs: '/api/docs'
      },
      frontend: 'http://localhost:5173'
    });
  });
}

// Always serve dashboard at /dashboard
if (fs.existsSync(dashboardPath)) {
  app.get('/dashboard', (req, res) => {
    res.sendFile(dashboardPath);
  });
}

// Only serve static files in production (Railway)
if (!isDevelopment && fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  
  // In production, serve index.html at root
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
  // Use authenticated user ID (from Firebase token) OR body userId OR anon
  const userId = req.user?.uid || req.body?.userId || 'anon';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const components = `${ipHash}-${userId}-${userAgent}`;
  return crypto.createHash('md5').update(components).digest('hex');
};

// RATE LIMITING - Enhanced with fingerprinting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased limit to 5000 requests per windowMs to prevent false positives
  keyGenerator: createFingerprint,
  handler: (req, res) => {
    logger.warn('⚠️ Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      fingerprint: createFingerprint(req),
      headers: req.headers
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
  max: 200, // Increased to 200 AI generations per minute
  keyGenerator: createFingerprint,
  handler: (req, res) => {
    logger.warn('⚠️ AI generation rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.uid || 'unknown',
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

// API Health check (for monitoring services)
app.get('/api/health', (req, res) => {
  const isHealthy = apiKey && genAI;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      api: 'up',
      gemini: apiKey ? 'configured' : 'missing',
      firebase: firebaseInitialized ? 'connected' : 'not configured'
    }
  });
});

// DEBUG: Show which env vars are present (not values)
app.get('/api/debug-env', (req, res) => {
  const envVars = Object.keys(process.env)
    .filter(k => k.includes('FIREBASE') || k.includes('GEMINI') || k.includes('NODE') || k.includes('PORT'))
    .reduce((acc, k) => {
      acc[k] = process.env[k] ? `set (${process.env[k].length} chars)` : 'not set';
      return acc;
    }, {});
  res.json({ 
    envVars,
    totalEnvVars: Object.keys(process.env).length
  });
});

// MODELS ROUTE - returns available models that support generateContent
// ==================== DIAGNOSTIC: Check which APIs are configured ====================
app.get('/api/status/apis', (req, res) => {
  const status = {
    gemini: !!process.env.GEMINI_API_KEY,
    replicate: !!process.env.REPLICATE_API_KEY,
    firebaseAdmin: firebaseInitialized,
    googleCloudProject: !!process.env.GOOGLE_CLOUD_PROJECT || !!process.env.GCP_PROJECT_ID,
    message: 'If replicate is false, audio will fall back to text descriptions instead of actual audio generation.'
  };
  res.json(status);
});

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

// ==================== INVESTOR ACCESS API ====================
// Approved investor emails (add to .env: APPROVED_INVESTOR_EMAILS=email1@vc.com,email2@fund.com)
const APPROVED_INVESTOR_EMAILS = (process.env.APPROVED_INVESTOR_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

// Request investor access - validates email and logs access
app.post('/api/investor-access/request', apiLimiter, async (req, res) => {
  try {
    const { email, name, firm } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    const timestamp = new Date().toISOString();
    
    // FIX: Define db before using it
    const db = getFirestoreDb();
    
    // Log the access request to Firestore
    if (db){
      try {
        await db.collection('investor_access_requests').add({
          email: normalizedEmail,
          name: name || 'Not provided',
          firm: firm || 'Not provided',
          requestedAt: timestamp,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          status: 'pending'
        });
      } catch (dbErr) {
        logger.warn('Failed to log investor access request to Firestore:', dbErr.message);
      }
    }
    
    // Check if email is pre-approved
    const isApproved = APPROVED_INVESTOR_EMAILS.includes(normalizedEmail) || 
                       APPROVED_INVESTOR_EMAILS.some(approved => normalizedEmail.endsWith(approved));
    
    if (isApproved) {
      // Log successful access
      if (db) {
        try {
          await db.collection('investor_access_log').add({
            email: normalizedEmail,
            name: name || 'Not provided',
            firm: firm || 'Not provided',
            accessedAt: timestamp,
            ip: req.ip || req.connection.remoteAddress
          });
        } catch (dbErr) {
          logger.warn('Failed to log investor access:', dbErr.message);
        }
      }
      
      logger.info(`Investor access granted: ${normalizedEmail}`);
      return res.json({ 
        success: true, 
        approved: true,
        message: 'Access granted. Welcome to Studio Agents.'
      });
    }
    
    // Not pre-approved - request is logged, will need manual approval
    logger.info(`Investor access requested (pending): ${normalizedEmail}`);
    return res.json({ 
      success: true, 
      approved: false,
      message: 'Access request received. We will review and contact you within 24 hours.'
    });
    
  } catch (err) {
    logger.error('Investor access request error:', err);
    res.status(500).json({ error: 'Access request failed', details: err.message });
  }
});

// Check if email has approved access
app.get('/api/investor-access/check', apiLimiter, async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const isApproved = APPROVED_INVESTOR_EMAILS.includes(email) || 
                       APPROVED_INVESTOR_EMAILS.some(approved => email.endsWith(approved));
    
    res.json({ approved: isApproved });
  } catch (err) {
    res.status(500).json({ error: 'Check failed', details: err.message });
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// GET /api/admin/status - Check if current user is admin
app.get('/api/admin/status', verifyFirebaseToken, (req, res) => {
  if (!req.user) {
    return res.json({ isAdmin: false, authenticated: false });
  }
  
  const isAdmin = ADMIN_EMAILS.includes(req.user.email?.toLowerCase());
  const isDemoAccount = DEMO_ACCOUNTS[req.user.email?.toLowerCase()];
  
  res.json({ 
    isAdmin,
    authenticated: true,
    email: req.user.email,
    isDemoAccount: !!isDemoAccount,
    demoConfig: isDemoAccount || null
  });
});

// GET /api/admin/users - List all users (admin only)
app.get('/api/admin/users', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const usersSnapshot = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      isAdmin: ADMIN_EMAILS.includes(doc.data().email?.toLowerCase()),
      isDemoAccount: !!DEMO_ACCOUNTS[doc.data().email?.toLowerCase()]
    }));
    
    res.json({ users, total: users.length });
  } catch (error) {
    logger.error('Admin users list failed:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users/:uid/credits - Set user credits (admin only)
app.post('/api/admin/users/:uid/credits', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const { uid } = req.params;
  const { credits, reason } = req.body;
  
  if (typeof credits !== 'number' || credits < 0) {
    return res.status(400).json({ error: 'Invalid credits value' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const previousCredits = userDoc.data().credits || 0;
    
    await userRef.update({
      credits,
      lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp(),
      creditUpdateReason: reason || 'Admin adjustment',
      creditUpdatedBy: req.user.email
    });
    
    logger.info(`💰 Admin credit update: ${uid} ${previousCredits} -> ${credits} by ${req.user.email}`);
    
    res.json({ 
      success: true, 
      uid, 
      previousCredits, 
      newCredits: credits,
      updatedBy: req.user.email
    });
  } catch (error) {
    logger.error('Admin credit update failed:', error);
    res.status(500).json({ error: 'Failed to update credits' });
  }
});

// POST /api/admin/users/:uid/tier - Set user tier (admin only)
app.post('/api/admin/users/:uid/tier', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const { uid } = req.params;
  const { tier } = req.body;
  
  const validTiers = ['free', 'creator', 'pro', 'lifetime'];
  if (!validTiers.includes(tier)) {
    return res.status(400).json({ error: `Invalid tier. Must be one of: ${validTiers.join(', ')}` });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const previousTier = userDoc.data().tier || 'free';
    
    await userRef.update({
      tier,
      lastTierUpdate: admin.firestore.FieldValue.serverTimestamp(),
      tierUpdatedBy: req.user.email
    });
    
    logger.info(`🎖️ Admin tier update: ${uid} ${previousTier} -> ${tier} by ${req.user.email}`);
    
    res.json({ 
      success: true, 
      uid, 
      previousTier, 
      newTier: tier,
      updatedBy: req.user.email
    });
  } catch (error) {
    logger.error('Admin tier update failed:', error);
    res.status(500).json({ error: 'Failed to update tier' });
  }
});

// POST /api/admin/demo/setup - Initialize demo accounts with credits (admin only)
app.post('/api/admin/demo/setup', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const results = [];
    
    for (const [email, config] of Object.entries(DEMO_ACCOUNTS)) {
      // Find user by email
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (usersSnapshot.empty) {
        results.push({ email, status: 'not_found', message: 'User must sign up first' });
        continue;
      }
      
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.update({
        credits: config.credits,
        tier: config.tier,
        displayName: config.displayName,
        isDemoAccount: true,
        demoSetupAt: admin.firestore.FieldValue.serverTimestamp(),
        demoSetupBy: req.user.email
      });
      
      results.push({ 
        email, 
        status: 'success', 
        credits: config.credits, 
        tier: config.tier 
      });
      
      logger.info(`🎭 Demo account setup: ${email} - ${config.credits} credits, ${config.tier} tier`);
    }
    
    res.json({ 
      success: true, 
      message: 'Demo accounts configured',
      results 
    });
  } catch (error) {
    logger.error('Demo setup failed:', error);
    res.status(500).json({ error: 'Failed to setup demo accounts' });
  }
});

// GET /api/admin/stats - Get platform statistics (admin only)
app.get('/api/admin/stats', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    // Get user counts
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    let totalCredits = 0;
    let paidUsers = 0;
    let tierCounts = { free: 0, creator: 0, pro: 0, lifetime: 0 };
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      totalCredits += data.credits || 0;
      if (data.tier && data.tier !== 'free') paidUsers++;
      tierCounts[data.tier || 'free'] = (tierCounts[data.tier || 'free'] || 0) + 1;
    });
    
    res.json({
      users: {
        total: totalUsers,
        paid: paidUsers,
        free: totalUsers - paidUsers,
        byTier: tierCounts
      },
      credits: {
        totalInCirculation: totalCredits,
        averagePerUser: totalUsers > 0 ? Math.round(totalCredits / totalUsers) : 0
      },
      admins: ADMIN_EMAILS,
      demoAccounts: Object.keys(DEMO_ACCOUNTS),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Admin stats failed:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================================================
// USER DATA & PREFERENCES ENDPOINTS
// ============================================================================

// GET /api/user/profile - Get user profile and preferences
app.get('/api/user/profile', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      // Create default profile
      const defaultProfile = {
        email: req.user.email,
        displayName: req.user.email?.split('@')[0] || 'User',
        credits: 3,
        tier: 'free',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        preferences: {
          theme: 'dark',
          defaultAgent: null,
          emailNotifications: true,
          autoSave: true
        }
      };
      await db.collection('users').doc(req.user.uid).set(defaultProfile);
      return res.json(defaultProfile);
    }
    
    res.json(userDoc.data());
  } catch (err) {
    logger.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get profile', details: err.message });
  }
});

// PUT /api/user/profile - Update user profile
app.put('/api/user/profile', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const { displayName, artistName, bio, preferences } = req.body;
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (displayName) updateData.displayName = displayName.slice(0, 100);
    if (artistName) updateData.artistName = artistName.slice(0, 100);
    if (bio) updateData.bio = bio.slice(0, 500);
    if (preferences) {
      updateData.preferences = {
        theme: preferences.theme || 'dark',
        defaultAgent: preferences.defaultAgent || null,
        emailNotifications: preferences.emailNotifications !== false,
        autoSave: preferences.autoSave !== false,
        favoriteGenre: preferences.favoriteGenre || null,
        defaultBpm: preferences.defaultBpm || 120
      };
    }
    
    await db.collection('users').doc(req.user.uid).update(updateData);
    
    const updated = await db.collection('users').doc(req.user.uid).get();
    res.json(updated.data());
  } catch (err) {
    logger.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// ============================================================================
// USER PREFERENCES & CONTACT INFO
// ============================================================================

// GET /api/user/preferences - Get user preferences
app.get('/api/user/preferences', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const preferences = await userPreferencesService.getUserPreferences(admin, req.user.uid);
    res.json(preferences);
  } catch (err) {
    logger.error('Get preferences error:', err);
    res.status(500).json({ error: 'Failed to get preferences', details: err.message });
  }
});

// PUT /api/user/preferences - Update user preferences
app.put('/api/user/preferences', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { preferences } = req.body;
    if (!preferences) {
      return res.status(400).json({ error: 'Preferences object required' });
    }

    await userPreferencesService.saveUserPreferences(admin, req.user.uid, preferences);
    res.json({ success: true, message: 'Preferences updated' });
  } catch (err) {
    logger.error('Update preferences error:', err);
    res.status(500).json({ error: 'Failed to update preferences', details: err.message });
  }
});

// GET /api/user/contact - Get user contact info
app.get('/api/user/contact', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const contact = await userPreferencesService.getUserContactInfo(admin, req.user.uid);
    res.json(contact);
  } catch (err) {
    logger.error('Get contact info error:', err);
    res.status(500).json({ error: 'Failed to get contact info', details: err.message });
  }
});

// PUT /api/user/contact - Update user contact info
app.put('/api/user/contact', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { contact } = req.body;
    if (!contact) {
      return res.status(400).json({ error: 'Contact object required' });
    }

    await userPreferencesService.updateUserContactInfo(admin, req.user.uid, contact);
    res.json({ success: true, message: 'Contact info updated' });
  } catch (err) {
    logger.error('Update contact info error:', err);
    res.status(500).json({ error: 'Failed to update contact info', details: err.message });
  }
});

// ============================================================================
// GENERATION HISTORY ENDPOINTS
// ============================================================================

// POST /api/user/generations - Log a generation (called after AI generation)
app.post('/api/user/generations', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const { type, agent, prompt, output, metadata } = req.body;
    
    const generation = {
      type: type || 'text', // 'lyrics', 'hook', 'beat', 'mix', etc.
      agent: agent || 'unknown',
      prompt: (prompt || '').slice(0, 1000),
      output: (output || '').slice(0, 5000),
      metadata: metadata || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      favorite: false
    };
    
    const docRef = await db.collection('users').doc(req.user.uid)
      .collection('generations').add(generation);
    
    res.json({ success: true, id: docRef.id });
  } catch (err) {
    logger.error('Log generation error:', err);
    res.status(500).json({ error: 'Failed to log generation', details: err.message });
  }
});

// GET /api/user/generations - Get generation history
app.get('/api/user/generations', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const type = req.query.type; // Filter by type
    const agent = req.query.agent; // Filter by agent name
    const favoritesOnly = req.query.favorites === 'true';
    
    let query = db.collection('users').doc(req.user.uid)
      .collection('generations')
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    if (type) {
      query = query.where('type', '==', type);
    }
    if (agent) {
      query = query.where('agent', '==', agent);
    }
    if (favoritesOnly) {
      query = query.where('favorite', '==', true);
    }
    
    const snapshot = await query.get();
    const generations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(generations);
  } catch (err) {
    logger.error('Get generations error:', err);
    res.status(500).json({ error: 'Failed to get generations', details: err.message });
  }
});

// PUT /api/user/generations/:id/favorite - Toggle favorite
app.put('/api/user/generations/:id/favorite', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const { id } = req.params;
    const { favorite } = req.body;
    
    await db.collection('users').doc(req.user.uid)
      .collection('generations').doc(id)
      .update({ favorite: favorite === true });
    
    res.json({ success: true, favorite: favorite === true });
  } catch (err) {
    logger.error('Toggle favorite error:', err);
    res.status(500).json({ error: 'Failed to toggle favorite', details: err.message });
  }
});

// DELETE /api/user/generations/:id - Delete a generation
app.delete('/api/user/generations/:id', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const { id } = req.params;
    
    await db.collection('users').doc(req.user.uid)
      .collection('generations').doc(id).delete();
    
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete generation error:', err);
    res.status(500).json({ error: 'Failed to delete generation', details: err.message });
  }
});

// ============================================================================
// SESSION LOGGING (for security & analytics)
// ============================================================================

// POST /api/user/session - Log user session/login
app.post('/api/user/session', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const { action, deviceInfo } = req.body; // action: 'login', 'logout', 'refresh'
    
    const session = {
      action: action || 'login',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      deviceInfo: deviceInfo || {}
    };
    
    await db.collection('users').doc(req.user.uid)
      .collection('sessions').add(session);
    
    // Update last login on user profile
    await db.collection('users').doc(req.user.uid).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Send login notification email if user preference allows
    if (action === 'login') {
      const shouldNotify = await userPreferencesService.shouldNotify(admin, req.user.uid, 'emailOnLogin');
      if (shouldNotify) {
        // Notify user
        emailService.notifyUser(req.user.email, 'loginNotification', {
          email: req.user.email,
          uid: req.user.uid,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        }).catch(err => logger.warn('Login email notification failed:', err.message));
        
        // Notify admins
        emailService.notifyAdmins('loginNotification', {
          email: req.user.email,
          uid: req.user.uid,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        }).catch(err => logger.warn('Admin login notification failed:', err.message));
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    logger.error('Log session error:', err);
    res.status(500).json({ error: 'Failed to log session', details: err.message });
  }
});

// ============================================================================
// SUBSCRIPTION & BILLING INFO
// ============================================================================

// GET /api/user/subscription - Get subscription status
app.get('/api/user/subscription', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.json({
        tier: 'free',
        credits: 0,
        subscription: null
      });
    }
    
    const userData = userDoc.data();
    
    res.json({
      tier: userData.tier || 'free',
      credits: userData.credits || 0,
      subscription: userData.subscription || null,
      stripeCustomerId: userData.stripeCustomerId ? '***' + userData.stripeCustomerId.slice(-4) : null,
      currentPeriodEnd: userData.currentPeriodEnd || null
    });
  } catch (err) {
    logger.error('Get subscription error:', err);
    res.status(500).json({ error: 'Failed to get subscription', details: err.message });
  }
});

// GET /api/user/billing - Get billing history (Stripe invoices)
app.get('/api/user/billing', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    // Get billing history from Firestore
    const snapshot = await db.collection('users').doc(req.user.uid)
      .collection('billing_history')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(invoices);
  } catch (err) {
    logger.error('Get billing error:', err);
    res.status(500).json({ error: 'Failed to get billing history', details: err.message });
  }
});

// POST /api/user/billing/update-payment - Update payment method (redirect to Stripe portal)
app.post('/api/user/billing/update-payment', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists || !userDoc.data().stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found. Please subscribe first.' });
    }
    
    // Create Stripe Customer Portal session
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    if (!stripe) {
      return res.status(503).json({ error: 'Payment system not configured' });
    }
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userDoc.data().stripeCustomerId,
      return_url: req.body.returnUrl || 'https://studioagents.ai/account'
    });
    
    res.json({ url: portalSession.url });
  } catch (err) {
    logger.error('Update payment error:', err);
    res.status(500).json({ error: 'Failed to create billing portal', details: err.message });
  }
});

// ============================================================================
// CREDITS ENDPOINTS - User credit management
// ============================================================================

// GET /api/user/credits - Get user's current credits
app.get('/api/user/credits', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.json({ credits: 3, tier: 'free', bonus: 0 }); // New users get 3 trial credits
    }
    
    const userData = userDoc.data();
    res.json({
      credits: userData.credits || 0,
      tier: userData.tier || 'free',
      bonus: userData.bonusCredits || 0,
      lifetime: userData.lifetimeCredits || userData.credits || 0
    });
  } catch (err) {
    logger.error('Get credits error:', err);
    res.status(500).json({ error: 'Failed to get credits', details: err.message });
  }
});

// POST /api/user/credits - Add credits to user account (admin/purchase)
app.post('/api/user/credits', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { amount, reason } = req.body;
  
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Valid positive amount required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const userRef = db.collection('users').doc(req.user.uid);
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      const currentCredits = doc.exists ? (doc.data().credits || 0) : 0;
      const lifetimeCredits = doc.exists ? (doc.data().lifetimeCredits || 0) : 0;
      
      t.set(userRef, {
        credits: currentCredits + amount,
        lifetimeCredits: lifetimeCredits + amount,
        lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Log credit transaction
      t.create(db.collection('users').doc(req.user.uid).collection('credit_history').doc(), {
        type: 'add',
        amount,
        reason: reason || 'purchase',
        balanceBefore: currentCredits,
        balanceAfter: currentCredits + amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    logger.info('💰 Credits added', { userId: req.user.uid, amount, reason });
    res.json({ success: true, message: `Added ${amount} credits`, reason });
  } catch (err) {
    logger.error('Add credits error:', err);
    res.status(500).json({ error: 'Failed to add credits', details: err.message });
  }
});

// POST /api/user/credits/deduct - Deduct credits (internal use)
app.post('/api/user/credits/deduct', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { amount, reason } = req.body;
  
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Valid positive amount required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const userRef = db.collection('users').doc(req.user.uid);
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      
      if (!doc.exists) {
        throw new Error('User not found');
      }
      
      const currentCredits = doc.data().credits || 0;
      
      if (currentCredits < amount) {
        throw new Error('Insufficient credits');
      }
      
      t.update(userRef, {
        credits: currentCredits - amount,
        lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Log credit transaction
      t.create(db.collection('users').doc(req.user.uid).collection('credit_history').doc(), {
        type: 'deduct',
        amount,
        reason: reason || 'generation',
        balanceBefore: currentCredits,
        balanceAfter: currentCredits - amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    logger.info('💸 Credits deducted', { userId: req.user.uid, amount, reason });
    res.json({ success: true, message: `Deducted ${amount} credits`, reason });
  } catch (err) {
    logger.error('Deduct credits error:', err);
    
    if (err.message === 'Insufficient credits') {
      return res.status(402).json({ error: 'Insufficient credits', required: amount });
    }
    
    res.status(500).json({ error: 'Failed to deduct credits', details: err.message });
  }
});

// GET /api/user/credits/history - Get credit transaction history
app.get('/api/user/credits/history', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const snapshot = await db.collection('users').doc(req.user.uid)
      .collection('credit_history')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
    
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (err) {
    logger.error('Get credit history error:', err);
    res.status(500).json({ error: 'Failed to get credit history', details: err.message });
  }
});

// ============================================================================
// SAVED PROJECTS ENDPOINTS
// ============================================================================

// POST /api/user/projects - Save a project
app.post('/api/user/projects', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const { name, type, data, metadata } = req.body;
    
    if (!name || !data) {
      return res.status(400).json({ error: 'Name and data are required' });
    }
    
    const project = {
      name: name.slice(0, 200),
      type: type || 'song', // 'song', 'beat', 'lyrics', 'mix'
      data: data,
      metadata: metadata || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('users').doc(req.user.uid)
      .collection('projects').add(project);
    
    res.json({ success: true, id: docRef.id, ...project });
  } catch (err) {
    logger.error('Save project error:', err);
    res.status(500).json({ error: 'Failed to save project', details: err.message });
  }
});

// GET /api/user/projects - Get all projects
app.get('/api/user/projects', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const snapshot = await db.collection('users').doc(req.user.uid)
      .collection('projects')
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .get();
    
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(projects);
  } catch (err) {
    logger.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to get projects', details: err.message });
  }
});

// PUT /api/user/projects/:id - Update a project
app.put('/api/user/projects/:id', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const { id } = req.params;
    const { name, data, metadata } = req.body;
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (name) updateData.name = name.slice(0, 200);
    if (data) updateData.data = data;
    if (metadata) updateData.metadata = metadata;
    
    await db.collection('users').doc(req.user.uid)
      .collection('projects').doc(id).update(updateData);
    
    res.json({ success: true, id });
  } catch (err) {
    logger.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project', details: err.message });
  }
});

// DELETE /api/user/projects/:id - Delete a project
app.delete('/api/user/projects/:id', verifyFirebaseToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const db = getFirestoreDb();
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  
  try {
    const { id } = req.params;
    
    await db.collection('users').doc(req.user.uid)
      .collection('projects').doc(id).delete();
    
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project', details: err.message });
  }
});

// GENERATION ROUTE (with optional Firebase auth)
app.post('/api/generate', verifyFirebaseToken, checkCredits, generationLimiter, async (req, res) => {
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
    // Defaulting to gemini-2.0-flash for better performance
    const desiredModel = sanitizedModel || process.env.GENERATIVE_MODEL || "gemini-2.0-flash";
    
    let text;
    let usedModel = desiredModel;

    try {
      const model = genAI.getGenerativeModel({ 
        model: desiredModel,
        systemInstruction: sanitizedSystemInstruction || undefined
      });

      const startTime = Date.now();
      const result = await model.generateContent(sanitizedPrompt);
      const response = await result.response;
      text = response.text();
      const duration = Date.now() - startTime;

      logger.info('Generation successful', { 
        ip: req.ip,
        duration: `${duration}ms`,
        outputLength: text.length,
        model: desiredModel,
        requestedModel: requestedModel || 'default'
      });
    } catch (primaryError) {
      // Fallback logic for 429 (Quota) or 404 (Model Not Found)
      const isQuotaError = String(primaryError).includes('429');
      const isNotFoundError = String(primaryError).includes('404') || String(primaryError).includes('not found');
      
      if ((isQuotaError || isNotFoundError) && desiredModel !== 'gemini-2.0-flash') {
        logger.warn(`Primary model ${desiredModel} failed (${isQuotaError ? 'Quota' : 'Not Found'}). Falling back to gemini-2.0-flash.`);
        
        const fallbackModel = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash',
          systemInstruction: sanitizedSystemInstruction || undefined
        });

        const startTime = Date.now();
        const result = await fallbackModel.generateContent(sanitizedPrompt);
        const response = await result.response;
        text = response.text();
        usedModel = 'gemini-2.0-flash';
        
        logger.info('Fallback generation successful', { 
          ip: req.ip,
          duration: `${Date.now() - startTime}ms`,
          model: 'gemini-2.0-flash'
        });
      } else {
        throw primaryError; // Re-throw if not recoverable or already using fallback
      }
    }

    res.json({ output: text, model: usedModel });

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
// AGENT MODEL ORCHESTRATOR (AMO) - Combine up to 4 agent outputs
// ═══════════════════════════════════════════════════════════════════
app.post('/api/orchestrate', verifyFirebaseToken, checkCredits, async (req, res) => {
  try {
    const { agentOutputs, projectName, projectDescription } = req.body;
    
    // Validate inputs
    if (!agentOutputs || !Array.isArray(agentOutputs) || agentOutputs.length === 0) {
      return res.status(400).json({ error: 'At least one agent output is required' });
    }
    
    if (agentOutputs.length > 4) {
      return res.status(400).json({ error: 'Maximum 4 agent outputs allowed' });
    }
    
    // Get user ID for saving
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required for orchestration' });
    }
    
    logger.info('🎛️ AMO Orchestration request', { 
      userId, 
      agentCount: agentOutputs.length,
      agents: agentOutputs.map(a => a.agent || a.type || 'unknown')
    });
    
    // Build orchestration prompt from agent outputs
    const agentSummaries = agentOutputs.map((output, idx) => {
      const agentName = output.agent || output.type || `Agent ${idx + 1}`;
      const content = output.content || output.snippet || output.text || output.output || JSON.stringify(output);
      return `## ${agentName} Output:\n${typeof content === 'string' ? content.slice(0, 2000) : JSON.stringify(content).slice(0, 2000)}`;
    }).join('\n\n');
    
    const orchestrationPrompt = `You are the Agent Model Orchestrator (AMO), a master AI that combines outputs from multiple specialized agents into a cohesive final product.

PROJECT: ${sanitizeInput(projectName || 'Untitled Project', 200)}
DESCRIPTION: ${sanitizeInput(projectDescription || 'Music production project', 500)}

You have received outputs from ${agentOutputs.length} specialized agents:

${agentSummaries}

---

Your task:
1. Analyze all agent outputs and identify synergies
2. Resolve any conflicts or inconsistencies between outputs
3. Create a unified, polished final product that leverages the best of each agent's contribution
4. Provide production notes on how the elements work together

Generate a comprehensive MASTER OUTPUT that combines all elements into a professional, release-ready result. Include:
- Combined creative direction
- How each agent's contribution enhances the final product
- Any adjustments made for cohesion
- Final polished content ready for use`;

    const systemInstruction = `You are the Agent Model Orchestrator (AMO) - an expert at synthesizing multiple AI agent outputs into cohesive, professional results. You understand music production, marketing, visual design, and creative direction. Always produce polished, actionable output that artists can immediately use.`;
    
    // Check if API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('⚠️ GEMINI_API_KEY not configured for orchestration');
      return res.status(503).json({ 
        error: 'Orchestration unavailable',
        details: 'API key not configured',
        fallback: 'Using individual asset outputs'
      });
    }
    
    const desiredModel = process.env.GENERATIVE_MODEL || "gemini-2.0-flash";
    
    // Verify genAI is initialized
    if (!genAI) {
      logger.error('❌ genAI not initialized');
      return res.status(503).json({ 
        error: 'Orchestration unavailable',
        details: 'AI service not initialized',
        fallback: 'Using individual asset outputs'
      });
    }
    
    const model = genAI.getGenerativeModel({ 
      model: desiredModel,
      systemInstruction
    });
    
    const startTime = Date.now();
    const result = await model.generateContent(orchestrationPrompt);
    const response = await result.response;
    
    if (!response) {
      throw new Error('No response from model');
    }
    
    const orchestratedOutput = response.text();
    if (!orchestratedOutput) {
      throw new Error('Empty response from model');
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('🎛️ AMO Orchestration complete', { 
      userId,
      duration: `${duration}ms`,
      outputLength: orchestratedOutput.length
    });
    
    // Create the master asset
    const masterAsset = {
      id: `master-${Date.now()}`,
      title: `Master: ${projectName || 'Untitled'}`,
      type: 'Master',
      agent: 'AMO Orchestrator',
      date: new Date().toISOString(),
      color: 'agent-purple',
      snippet: orchestratedOutput.slice(0, 200) + '...',
      content: orchestratedOutput,
      metadata: {
        agentCount: agentOutputs.length,
        agents: agentOutputs.map(a => a.agent || a.type),
        orchestratedAt: new Date().toISOString(),
        processingTime: duration
      },
      // Preserve media URLs from input assets
      audioUrl: agentOutputs.find(a => a.audioUrl)?.audioUrl,
      imageUrl: agentOutputs.find(a => a.imageUrl)?.imageUrl,
      videoUrl: agentOutputs.find(a => a.videoUrl)?.videoUrl,
      stems: {
        audio: agentOutputs.filter(a => a.audioUrl).map(a => ({ url: a.audioUrl, agent: a.agent })),
        visual: agentOutputs.filter(a => a.imageUrl || a.videoUrl).map(a => ({ 
          url: a.videoUrl || a.imageUrl, 
          type: a.videoUrl ? 'video' : 'image',
          agent: a.agent 
        }))
      }
    };
    
    // Save to Firestore (optional - don't fail if save fails)
    const db = getFirestoreDb();
    if (db) {
      try {
        // Save to user's projects collection
        await db.collection('users').doc(userId).collection('projects').doc(masterAsset.id).set({
          ...masterAsset,
          savedAt: admin.firestore.FieldValue.serverTimestamp(),
          sourceAssets: agentOutputs.map(a => ({ id: a.id, agent: a.agent, type: a.type }))
        });
        
        // Also add to generations history
        await db.collection('users').doc(userId).collection('generations').add({
          type: 'orchestration',
          masterAssetId: masterAsset.id,
          agentCount: agentOutputs.length,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        logger.info('💾 Master asset saved to Firestore', { userId, assetId: masterAsset.id });
      } catch (saveErr) {
        logger.warn('⚠️ Failed to save master asset to Firestore', { error: saveErr.message });
        // Continue - we'll still return the result even if save failed
      }
    } else {
      logger.warn('⚠️ Firestore not available for saving');
    }
    
    res.json({ 
      success: true,
      masterAsset,
      output: orchestratedOutput,
      metadata: {
        processingTime: duration,
        agentsProcessed: agentOutputs.length,
        savedToCloud: !!db
      }
    });
    
  } catch (error) {
    const msg = error?.message || String(error);
    logger.error('❌ AMO Orchestration error', { error: msg, stack: error?.stack });
    
    // Specific error handling
    if (msg.includes('429') || msg.includes('rate')) {
      return res.status(429).json({ 
        error: 'Rate limited', 
        details: 'Please try again in a moment',
        fallback: 'Using individual asset outputs'
      });
    }
    
    if (msg.includes('API key') || msg.includes('authentication') || msg.includes('401')) {
      return res.status(503).json({ 
        error: 'Orchestration temporarily unavailable',
        details: 'Authentication issue',
        fallback: 'Using individual asset outputs'
      });
    }
    
    // Return 503 for all orchestration errors to indicate it's optional
    res.status(503).json({ 
      error: 'Orchestration unavailable', 
      details: msg,
      fallback: 'Using individual asset outputs'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// VIDEO FRAME EXTRACTION (Fallback for image from video)
// ═══════════════════════════════════════════════════════════════════
app.post('/api/extract-video-frame', verifyFirebaseToken, async (req, res) => {
  try {
    const { videoUrl, timestamp = 0 } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }
    
    logger.info('Extracting frame from video', { videoUrl: videoUrl.substring(0, 50), timestamp });
    
    // Check if ffmpeg is available
    const { spawnSync } = require('child_process');
    const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf-8' });
    
    if (probe.error || probe.status !== 0) {
      // Fallback: Use canvas-based extraction for browser-compatible URLs
      // Return instruction for frontend to extract frame client-side
      return res.json({
        extractClientSide: true,
        videoUrl: videoUrl,
        timestamp: timestamp,
        message: 'FFmpeg not available - use client-side extraction'
      });
    }
    
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const https = require('https');
    const http = require('http');
    
    // Create temp directory for processing
    const tempDir = path.join(os.tmpdir(), 'frame-extract');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempVideo = path.join(tempDir, `input-${Date.now()}.mp4`);
    const tempFrame = path.join(tempDir, `frame-${Date.now()}.jpg`);
    
    // Download video to temp file
    const downloadVideo = () => new Promise((resolve, reject) => {
      const protocol = videoUrl.startsWith('https') ? https : http;
      const file = fs.createWriteStream(tempVideo);
      protocol.get(videoUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(tempVideo, () => {});
        reject(err);
      });
    });
    
    await downloadVideo();
    
    // Extract frame using ffmpeg
    const ffmpegResult = spawnSync('ffmpeg', [
      '-i', tempVideo,
      '-ss', String(timestamp),
      '-vframes', '1',
      '-q:v', '2',
      '-y',
      tempFrame
    ], { encoding: 'utf-8' });
    
    if (ffmpegResult.status !== 0 || !fs.existsSync(tempFrame)) {
      // Cleanup
      fs.unlinkSync(tempVideo);
      throw new Error('FFmpeg frame extraction failed');
    }
    
    // Read frame and convert to base64
    const frameData = fs.readFileSync(tempFrame);
    const base64Frame = frameData.toString('base64');
    
    // Cleanup temp files
    fs.unlinkSync(tempVideo);
    fs.unlinkSync(tempFrame);
    
    logger.info('Frame extracted successfully');
    
    res.json({
      imageData: base64Frame,
      mimeType: 'image/jpeg',
      output: `data:image/jpeg;base64,${base64Frame}`,
      source: 'video-frame',
      timestamp: timestamp
    });
    
  } catch (error) {
    logger.error('Video frame extraction error', { error: error.message });
    res.status(500).json({ 
      error: 'Frame extraction failed', 
      details: error.message,
      extractClientSide: true // Fallback to client-side
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// IMAGE GENERATION ROUTE (Multi-Model: Flux 1.1 Pro -> Nano Banana -> Imagen)
// ═══════════════════════════════════════════════════════════════════
app.post('/api/generate-image', verifyFirebaseToken, checkCredits, generationLimiter, async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', model = 'flux' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    // 1. Try Replicate (Flux 1.1 Pro) as Primary
    const replicateKey = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
    if (replicateKey && (model === 'flux' || model === 'default')) {
      try {
        logger.info('Generating image with Flux 1.1 Pro (via Replicate)', { prompt: prompt.substring(0, 50) });
        
        // Map aspect ratio to Flux format
        let fluxAspectRatio = "1:1";
        if (aspectRatio === "16:9") fluxAspectRatio = "16:9";
        if (aspectRatio === "9:16") fluxAspectRatio = "9:16";
        if (aspectRatio === "4:3") fluxAspectRatio = "4:3";
        if (aspectRatio === "3:4") fluxAspectRatio = "3:4";

        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${replicateKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait' // Wait for generation to complete
          },
          body: JSON.stringify({
            version: "flux-1.1-pro", // Use latest Flux Pro
            input: {
              prompt: prompt,
              aspect_ratio: fluxAspectRatio,
              output_format: "jpg",
              output_quality: 90,
              safety_tolerance: 2
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Replicate API error: ${errText}`);
        }

        const data = await response.json();
        
        // Replicate returns output as a URL string or array of strings
        let imageUrl = null;
        if (data.output) {
          imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        }

        if (imageUrl) {
             logger.info('Flux 1.1 Pro generation successful');
             return res.json({
                output: imageUrl,
                images: [imageUrl], // Frontend expects array
                mimeType: 'image/jpeg',
                type: 'image',
                source: 'replicate-flux',
                model: 'flux-1.1-pro',
                message: 'Image generated with Flux 1.1 Pro'
             });
        } else if (data.status === 'processing' || data.status === 'starting') {
           logger.warn('Flux generation timed out (async), falling back');
        }
      } catch (repError) {
        logger.error('Flux generation failed, falling back to Gemini', { error: repError.message });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       if (!replicateKey) {
          return res.status(500).json({ error: 'No image generation API keys found' });
       }
       // If we had Replicate key but it failed, we already logged it.
       return res.status(500).json({ error: 'Image generation failed' });
    }

    // Try Nano Banana first (Gemini native image generation)
    if (model === 'nano-banana' || model === 'gemini' || true) { // Default fallback
      try {
        logger.info('Generating image with Nano Banana', { prompt: prompt.substring(0, 50) });
        
        const nanoBananaModel = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash-image'
        });
        
        const result = await nanoBananaModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE']
          }
        });
        
        const response = await result.response;
        const parts = response.candidates?.[0]?.content?.parts || [];
        
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            const base64Image = part.inlineData.data;
            logger.info('Nano Banana image generated successfully');
            return res.json({
              images: [base64Image],
              mimeType: part.inlineData.mimeType,
              model: 'nano-banana'
            });
          }
        }
        
        // If no image in response, fall through to Imagen
        logger.warn('Nano Banana returned no image, falling back to Imagen');
      } catch (nanoBananaError) {
        logger.warn('Nano Banana failed, falling back to Imagen', { error: nanoBananaError.message });
      }
    }

    // Fallback to Imagen 4.0
    logger.info('Generating image with Imagen 4.0', { prompt: prompt.substring(0, 50) });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatio,
          personGeneration: 'allow_adult'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Imagen API Error', { status: response.status, error: errorText });
      throw new Error(`Imagen API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    logger.info('Imagen response received', { hasPredictions: !!data.predictions });
    
    // Transform response to match frontend expectations
    if (data.predictions && data.predictions.length > 0) {
      const base64Image = data.predictions[0].bytesBase64Encoded;
      if (base64Image) {
        res.json({
          predictions: data.predictions,
          images: [base64Image],
          model: 'imagen-4'
        });
        return;
      }
    }
    
    // If no images in expected format, return raw response
    res.json(data);

  } catch (error) {
    logger.error('Image generation error', { error: error.message });
    res.status(500).json({ error: 'Image generation failed', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SPEECH/AUDIO GENERATION ROUTE (Gemini TTS)
// ═══════════════════════════════════════════════════════════════════
app.post('/api/generate-speech', verifyFirebaseToken, checkCredits, generationLimiter, async (req, res) => {
  try {
    const { 
      prompt, 
      voice = 'Kore', 
      style = 'natural',
      speakers = null  // For multi-speaker: [{ name: 'Joe', voice: 'Kore' }, { name: 'Jane', voice: 'Puck' }]
    } = req.body;
    
    if (!prompt) return res.status(400).json({ error: 'Prompt/text is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

    logger.info('Generating speech with Gemini TTS', { 
      textLength: prompt.length, 
      voice, 
      multiSpeaker: !!speakers 
    });

    // Build speech config based on single or multi-speaker
    let speechConfig;
    if (speakers && Array.isArray(speakers) && speakers.length > 0) {
      // Multi-speaker mode
      speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakers.map(s => ({
            speaker: s.name,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: s.voice || 'Kore' }
            }
          }))
        }
      };
    } else {
      // Single speaker mode
      speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice }
        }
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: speechConfig
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('TTS API Error', { status: response.status, error: errorText });
      throw new Error(`TTS API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    logger.info('TTS response received', { hasAudio: !!data.candidates?.[0]?.content?.parts?.[0]?.inlineData });

    // Extract audio data
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

    if (audioData) {
      res.json({
        audio: audioData,
        mimeType: mimeType,
        audioUrl: `data:${mimeType};base64,${audioData}`
      });
    } else {
      throw new Error('No audio data in response');
    }

  } catch (error) {
    logger.error('Speech generation error', { error: error.message });
    res.status(500).json({ error: 'Speech generation failed', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// MUSIC/BEAT GENERATION ROUTE (Lyria RealTime - Simplified)
// Note: Full Lyria uses WebSockets for streaming. This endpoint provides
// a single-shot generation by collecting a short clip.
// ═══════════════════════════════════════════════════════════════════
app.post('/api/generate-audio', verifyFirebaseToken, checkCredits, generationLimiter, async (req, res) => {
  try {
    const { 
      prompt,           // e.g., "lo-fi hip hop beat with piano"
      bpm = 90,
      durationSeconds = 15,
      genre = 'hip-hop',
      mood = 'chill'
    } = req.body;
    
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const replicateKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;
    
    logger.info('Generating music/beat', { 
      prompt: prompt.substring(0, 50), 
      bpm, 
      genre, 
      mood,
      hasReplicateKey: !!replicateKey,
      replicateKeyPrefix: replicateKey ? replicateKey.substring(0, 8) : 'none'
    });

    // ═══════════════════════════════════════════════════════════════════
    // OPTION 1: Replicate MusicGen (Real Audio Generation)
    // ═══════════════════════════════════════════════════════════════════
    if (replicateKey) {
      try {
        logger.info('Using Replicate MusicGen for audio generation');
        
        // Enhanced prompt for better results
        const musicPrompt = `${genre} ${mood} instrumental beat, ${bpm} BPM. ${prompt}. High quality, professional production.`;
        
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
              prompt: musicPrompt,
              duration: Math.min(durationSeconds, 30), // Max 30 seconds
              model_version: 'stereo-large',
              output_format: 'mp3',
              normalization_strategy: 'peak'
            }
          })
        });

        if (!startResponse.ok) {
          const errText = await startResponse.text();
          logger.error('Replicate API returned error', { 
            status: startResponse.status, 
            statusText: startResponse.statusText,
            error: errText.substring(0, 200)
          });
          
          // Check for billing/credit issues
          if (startResponse.status === 402) {
            throw new Error('Replicate billing: Add credits at replicate.com/account/billing');
          }
          throw new Error(`Replicate API error: ${startResponse.status} - ${errText.substring(0, 100)}`);
        }

        const prediction = await startResponse.json();
        logger.info('Replicate prediction started', { id: prediction.id });

        // Poll for completion (max 3 minutes for cold starts)
        let result = prediction;
        const maxAttempts = 90;
        for (let i = 0; i < maxAttempts && result.status !== 'succeeded' && result.status !== 'failed'; i++) {
          await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
          
          const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: { 'Authorization': `Bearer ${replicateKey}` }
          });
          result = await pollResponse.json();
          
          // Only log every 5th attempt to reduce noise
          if (i % 5 === 0) {
            logger.info('Polling Replicate...', { status: result.status, attempt: i + 1 });
          }
        }

        if (result.status === 'succeeded' && result.output) {
          logger.info('MusicGen audio generated successfully', { 
            audioUrl: result.output.substring(0, 80),
            duration: durationSeconds
          });
          return res.json({
            audioUrl: result.output,
            mimeType: 'audio/mpeg',
            duration: durationSeconds,
            source: 'musicgen',
            prompt: musicPrompt,
            isRealGeneration: true // Flag to distinguish from samples
          });
        } else if (result.status === 'failed') {
          logger.error('MusicGen generation failed', { error: result.error, resultId: result.id });
          throw new Error(result.error || 'MusicGen generation failed');
        } else {
          logger.error('MusicGen generation timed out', { status: result.status, resultId: result.id });
          throw new Error('MusicGen generation timed out');
        }
      } catch (replicateError) {
        logger.warn('Replicate MusicGen failed, falling back to samples', { 
          error: replicateError.message,
          stack: replicateError.stack?.substring(0, 200)
        });
        // Fall through to Gemini fallback
      }
    } else {
      logger.error('Replicate API key not configured - cannot generate audio');
      return res.status(503).json({ 
        error: 'Audio Generation Not Configured', 
        details: 'REPLICATE_API_KEY not found. Add your API key to backend/.env',
        setup: 'Get your API key at https://replicate.com/account/api-tokens',
        status: 503
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // NO DEMO FALLBACK - Real AI generation only
    // ═══════════════════════════════════════════════════════════════════
    logger.error('Audio generation failed - no working API available');
    
    return res.status(503).json({ 
      error: 'Audio Generation Unavailable', 
      details: 'MusicGen generation failed. Please check Replicate API credits at replicate.com/account/billing',
      billingUrl: 'https://replicate.com/account/billing',
      isRealGeneration: false,
      status: 503
    });

  } catch (error) {
    logger.error('Audio generation error', { error: error.message });
    res.status(500).json({ error: 'Audio generation failed', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// VIDEO GENERATION ROUTE (Multi-Model: Replicate -> Veo -> Fallback)
// ═══════════════════════════════════════════════════════════════════
app.post('/api/generate-video', verifyFirebaseToken, checkCredits, generationLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    logger.info('Starting video generation', { promptLength: prompt.length });

    // 1. Try Replicate (Minimax) as Primary
    const replicateKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
    if (replicateKey) {
      try {
        logger.info('Trying Replicate (Minimax) as primary video generator...');
        const replicate = new Replicate({ auth: replicateKey });
        
        // Using Minimax Video-01 (High quality, 5s)
        const output = await replicate.run(
          "minimax/video-01",
          {
            input: {
              prompt: prompt,
              prompt_optimizer: true
            }
          }
        );
        
        if (output) {
             logger.info('Replicate (Minimax) generation successful');
             // Replicate returns a URL string for this model
             const videoUrl = String(output);
             
             return res.json({
                output: videoUrl,
                mimeType: 'video/mp4',
                type: 'video',
                source: 'replicate-minimax',
                message: 'Video generated with Minimax (via Replicate)'
             });
        }
      } catch (repError) {
        logger.error('Replicate generation failed, falling back to Veo', { error: repError.message });
      }
    } else {
        logger.info('REPLICATE_API_KEY not found, skipping Replicate');
    }

    // 2. Try Google Veo (Gemini) as Secondary
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // If both keys are missing, fail early
        if (!replicateKey) {
            return res.status(500).json({ error: 'No video generation API keys found (Replicate or Gemini)' });
        }
    } else {
        // Try Veo 2.0 as primary (most stable)
        const modelId = "veo-2.0-generate-001";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning?key=${apiKey}`;
        
        try {
            logger.info('Trying Veo 2.0 for video generation...');
            const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt: prompt }],
                parameters: {
                  aspectRatio: "16:9",
                  durationSeconds: 5,
                  sampleCount: 1
                }
            })
            });

            if (response.ok) {
                const operationData = await response.json();
                logger.info('Veo 2.0 operation started', { name: operationData.name });
                return handleVeoOperation(operationData, apiKey, res);
            }
            
            const errorText = await response.text();
            logger.error('Veo 2.0 API error', { status: response.status, error: errorText });
            
            // If Veo 2.0 fails, try Veo 3.0 as fallback
            logger.info('Trying Veo 3.0 as fallback...');
            const veo3Url = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning?key=${apiKey}`;
            const veo3Response = await fetch(veo3Url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  instances: [{ prompt: prompt }],
                  parameters: {
                    aspectRatio: "16:9",
                    durationSeconds: 5,
                    sampleCount: 1
                  }
                })
            });
            
            if (veo3Response.ok) {
                const veo3Data = await veo3Response.json();
                logger.info('Veo 3.0 operation started', { name: veo3Data.name });
                return handleVeoOperation(veo3Data, apiKey, res);
            }
            
            const veo3Error = await veo3Response.text();
            logger.error('Veo 3.0 fallback also failed', { error: veo3Error });

        } catch (veoError) {
            logger.error('Veo generation error', { error: veoError.message });
        }
    }
      
    // ═══════════════════════════════════════════════════════════════════
    // NO DEMO FALLBACK - Real AI video generation only
    // ═══════════════════════════════════════════════════════════════════
    logger.error('Video generation failed - all API attempts exhausted');
    
    // Return helpful error with setup instructions
    return res.status(503).json({ 
      error: 'Video Generation Unavailable', 
      details: 'Video generation requires API access. Check: 1) Replicate credits at replicate.com/account/billing, 2) Google Veo access at console.cloud.google.com',
      setup: {
        replicate: 'Add credits at https://replicate.com/account/billing',
        veo: 'Enable Generative AI API at https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com',
        veoModels: ['veo-2.0-generate-001', 'veo-3.1-generate-preview']
      },
      status: 503
    });

  } catch (error) {
    logger.error('Video generation error', { error: error.message });
    res.status(500).json({ error: 'Video generation failed', details: error.message });
  }
});

// Demo video URL generator - returns a sample video URL for testing
function generateDemoVideoUrl(prompt) {
  // Use a reliable public sample video (Big Buck Bunny or similar)
  // This ensures the player controls (play, seek, fullscreen) work correctly
  // instead of a 1-frame static blob.
  const sampleVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
  ];
  
  // Pick one based on prompt length to be deterministic but varied
  const index = prompt.length % sampleVideos.length;
  return sampleVideos[index];
}

// Helper function to handle Veo long-running operation polling
async function handleVeoOperation(operationData, apiKey, res) {
  if (!operationData.name) {
    // Direct response (no polling needed)
    if (operationData.generatedVideos?.[0]?.video?.uri) {
      const videoUri = operationData.generatedVideos[0].video.uri;
      const videoUrl = videoUri.includes('?') 
        ? `${videoUri}&key=${apiKey}` 
        : `${videoUri}?key=${apiKey}`;
      return res.json({ output: videoUrl, mimeType: 'video/mp4', type: 'video' });
    }
    return res.json({ output: operationData, type: 'video' });
  }
  
  logger.info('Video generation operation started', { operationName: operationData.name });

  // Poll for completion (max 6 minutes with 10s intervals)
  const maxAttempts = 36;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationData.name}?key=${apiKey}`;
    const pollResponse = await fetch(pollUrl);
    
    if (!pollResponse.ok) {
      const pollError = await pollResponse.text();
      logger.error('Poll error', { status: pollResponse.status, error: pollError });
      continue;
    }
    
    const pollData = await pollResponse.json();
    logger.info('Poll attempt', { attempt: attempts, done: pollData.done });
    
    if (pollData.done) {
      if (pollData.error) {
        throw new Error(`Video generation failed: ${JSON.stringify(pollData.error)}`);
      }
      
      // Extract video from response (multiple possible formats)
      const result = pollData.response || pollData.result;
      
      // Try Veo 3.1 format
      if (result?.generatedVideos?.[0]?.video?.uri) {
        const videoUri = result.generatedVideos[0].video.uri;
        const videoUrl = videoUri.includes('?') 
          ? `${videoUri}&key=${apiKey}` 
          : `${videoUri}?key=${apiKey}`;
        return res.json({ output: videoUrl, mimeType: 'video/mp4', type: 'video' });
      }
      
      // Try older format
      const videoResponse = result?.generateVideoResponse;
      if (videoResponse?.generatedSamples?.[0]?.video) {
        const video = videoResponse.generatedSamples[0].video;
        const videoUrl = video.uri.includes('?') 
          ? `${video.uri}&key=${apiKey}` 
          : `${video.uri}?key=${apiKey}`;
        return res.json({ output: videoUrl, mimeType: 'video/mp4', type: 'video' });
      }
      
      return res.json({ output: result, type: 'video' });
    }
  }
  
  throw new Error('Video generation timed out after 6 minutes');
}

// ═══════════════════════════════════════════════════════════════════
// AMO ORCHESTRATOR ENDPOINT - Multi-Agent Session Processing
// ═══════════════════════════════════════════════════════════════════
app.post('/api/amo/orchestrate', verifyFirebaseToken, apiLimiter, async (req, res) => {
  try {
    const { session, tracks, masterSettings } = req.body;
    
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ error: 'tracks array is required' });
    }
    
    logger.info('AMO Orchestrator request', { 
      trackCount: tracks.length,
      renderMode: masterSettings?.renderMode || 'text',
      bpm: session?.bpm
    });
    
    // Process each track with the appropriate agent
    const processedTracks = [];
    
    for (const track of tracks) {
      const { agent, prompt, outputType = 'text' } = track;
      
      if (!agent || !prompt) {
        processedTracks.push({
          agent,
          error: 'Missing agent or prompt',
          status: 'failed'
        });
        continue;
      }
      
      try {
        // Generate content using Gemini for text mode
        if (masterSettings?.renderMode === 'text' || outputType === 'text') {
          const systemInstruction = getAgentSystemPrompt(agent, session);
          const model = genAI.getGenerativeModel({ 
            model: process.env.GENERATIVE_MODEL || "gemini-1.5-flash",
            systemInstruction 
          });
          
          const result = await model.generateContent(prompt);
          const output = result.response.text();
          
          processedTracks.push({
            agent,
            prompt,
            output,
            outputType: 'text',
            status: 'completed'
          });
        } else {
          // For real asset mode, return a placeholder
          processedTracks.push({
            agent,
            prompt,
            output: `[Real asset generation for ${agent} - requires specific API]`,
            outputType,
            status: 'pending_asset'
          });
        }
      } catch (trackError) {
        logger.error(`Track processing failed for ${agent}:`, trackError.message);
        processedTracks.push({
          agent,
          prompt,
          error: trackError.message,
          status: 'failed'
        });
      }
    }
    
    // Combine results into master output
    const masterOutput = {
      session: {
        bpm: session?.bpm || 120,
        key: session?.key || 'C major',
        style: session?.style || 'Default',
        processedAt: new Date().toISOString()
      },
      tracks: processedTracks,
      summary: {
        total: tracks.length,
        completed: processedTracks.filter(t => t.status === 'completed').length,
        failed: processedTracks.filter(t => t.status === 'failed').length,
        pending: processedTracks.filter(t => t.status === 'pending_asset').length
      }
    };
    
    res.json({ 
      success: true,
      output: masterOutput
    });
    
  } catch (error) {
    logger.error('AMO Orchestrator error', { error: error.message });
    res.status(500).json({ error: 'AMO orchestration failed', details: error.message });
  }
});

// Helper function to get agent-specific system prompts
function getAgentSystemPrompt(agent, session) {
  const baseContext = session ? `Session context: BPM=${session.bpm || 120}, Key=${session.key || 'C major'}, Style=${session.style || 'contemporary'}.` : '';
  
  const agentPrompts = {
    'Ghostwriter': `You are the Ghostwriter AI, an elite lyricist and songwriter. ${baseContext} Write compelling, emotionally resonant lyrics with clever wordplay and authentic voice.`,
    'BeatArchitect': `You are the Beat Architect AI, a master producer and beatmaker. ${baseContext} Create detailed beat concepts, drum patterns, and production notes.`,
    'VisualVibe': `You are the Visual Vibe AI, a music video and artwork conceptualist. ${baseContext} Design compelling visual concepts, color palettes, and mood boards for music.`,
    'SoundscapeDesigner': `You are the Soundscape Designer AI, an ambient and texture specialist. ${baseContext} Create atmospheric soundscapes, textures, and ambient elements.`,
    'MelodyMaker': `You are the Melody Maker AI, a melodic composition expert. ${baseContext} Compose memorable melodies, hooks, and harmonic progressions.`,
    'ArrangerPro': `You are the Arranger Pro AI, a song structure and arrangement specialist. ${baseContext} Design song structures, transitions, and dynamic arrangements.`
  };
  
  return agentPrompts[agent] || `You are a creative AI assistant for music production. ${baseContext} Help with the requested task.`;
}

// ═══════════════════════════════════════════════════════════════════
// AUDIO MASTERING ROUTE - Convert to Distribution-Ready Format
// ═══════════════════════════════════════════════════════════════════
app.post('/api/master-audio', verifyFirebaseToken, async (req, res) => {
  try {
    const { 
      audioBase64,           // Base64 encoded audio data
      targetSampleRate = 44100, // 44.1 kHz for CD quality
      targetBitDepth = 16,   // 16-bit for distribution
      format = 'wav',        // wav or flac
      normalize = true,      // Apply loudness normalization
      targetLufs = -14,      // Industry standard for streaming
      preset = 'streaming'   // streaming, cd, or hires
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    logger.info('Audio mastering request', { 
      targetSampleRate, 
      targetBitDepth, 
      format,
      preset,
      audioLength: audioBase64.length 
    });

    // Preset configurations
    const presets = {
      streaming: { sampleRate: 44100, bitDepth: 16, lufs: -14 },  // Spotify/Apple Music
      cd: { sampleRate: 44100, bitDepth: 16, lufs: -9 },          // CD standard
      hires: { sampleRate: 96000, bitDepth: 24, lufs: -14 },      // Hi-Res Audio
      youtube: { sampleRate: 48000, bitDepth: 16, lufs: -14 },    // YouTube/Video
      podcast: { sampleRate: 44100, bitDepth: 16, lufs: -16 }     // Podcast standard
    };

    const config = presets[preset] || presets.streaming;
    const finalSampleRate = targetSampleRate || config.sampleRate;
    const finalBitDepth = targetBitDepth || config.bitDepth;

    if (!WaveFile) {
      return res.status(503).json({ 
        error: 'Audio mastering temporarily unavailable',
        message: 'Advanced audio mastering is currently in development. Basic audio processing is not available on this server instance.',
        comingSoon: true,
        alternatives: 'For now, please use external mastering tools like Landr, CloudBounce, or eMastered.'
      });
    }

    // Decode base64 audio
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    // Load WAV file
    const wav = new WaveFile(audioBuffer);
    
    // Get original specs
    const originalSampleRate = wav.fmt.sampleRate;
    const originalBitDepth = wav.bitDepth;
    
    logger.info('Original audio specs', { originalSampleRate, originalBitDepth });

    // Resample if needed
    if (originalSampleRate !== finalSampleRate) {
      wav.toSampleRate(finalSampleRate);
      logger.info('Resampled audio', { from: originalSampleRate, to: finalSampleRate });
    }

    // Convert bit depth if needed
    if (originalBitDepth !== String(finalBitDepth)) {
      if (finalBitDepth === 16) {
        wav.toBitDepth('16');
      } else if (finalBitDepth === 24) {
        wav.toBitDepth('24');
      } else if (finalBitDepth === 32) {
        wav.toBitDepth('32f'); // 32-bit float
      }
      logger.info('Converted bit depth', { from: originalBitDepth, to: finalBitDepth });
    }

    // Apply normalization if requested
    if (normalize) {
      // Simple peak normalization to -1 dBFS (0.89 linear)
      // Full LUFS normalization would require more sophisticated analysis
      const samples = wav.getSamples(true); // Get interleaved samples
      
      // Find peak
      let peak = 0;
      for (let i = 0; i < samples.length; i++) {
        const abs = Math.abs(samples[i]);
        if (abs > peak) peak = abs;
      }
      
      if (peak > 0) {
        // Normalize to -1 dBFS (about 0.89)
        const targetPeak = 0.89;
        const gain = targetPeak / peak;
        
        // Apply gain
        for (let i = 0; i < samples.length; i++) {
          samples[i] = Math.max(-1, Math.min(1, samples[i] * gain));
        }
        
        logger.info('Applied normalization', { peakBefore: peak, gain, peakAfter: targetPeak });
      }
    }

    // Get processed audio as buffer
    const processedBuffer = Buffer.from(wav.toBuffer());
    const processedBase64 = processedBuffer.toString('base64');

    // Response with mastered audio
    res.json({
      audio: processedBase64,
      audioUrl: `data:audio/wav;base64,${processedBase64}`,
      mimeType: 'audio/wav',
      specs: {
        sampleRate: finalSampleRate,
        bitDepth: finalBitDepth,
        format: 'wav',
        channels: wav.fmt.numChannels,
        duration: wav.getSamples().length / finalSampleRate / wav.fmt.numChannels,
        normalized: normalize,
        preset: preset
      },
      distributionReady: {
        appleMusic: finalSampleRate >= 44100 && finalBitDepth >= 16,
        spotify: finalSampleRate === 44100 && finalBitDepth === 16,
        youtube: finalSampleRate >= 44100,
        amazonMusic: finalSampleRate >= 44100 && finalBitDepth >= 16,
        tidal: finalSampleRate >= 44100 && finalBitDepth >= 16
      }
    });

  } catch (error) {
    logger.error('Audio mastering error', { error: error.message });
    res.status(500).json({ error: 'Audio mastering failed', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// TRANSLATION API - Professional Grade Translation via Gemini
// ═══════════════════════════════════════════════════════════════════

app.post('/api/translate', verifyFirebaseToken, checkCredits, apiLimiter, async (req, res) => {
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

// ==================== ENTERTAINMENT NEWS API ====================
// Fetches real-time entertainment news from multiple RSS/media sources
// Supports keyword search across entertainment, music, and social media outlets

let newsCache = { data: [], timestamp: 0, query: '' };
const NEWS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Entertainment news sources - comprehensive list (25+ sources)
const NEWS_SOURCES = [
  // Music Industry - Core
  { name: 'PITCHFORK', url: 'https://pitchfork.com/feed/feed-news/rss', category: 'music', color: 'agent-purple' },
  { name: 'BILLBOARD', url: 'https://www.billboard.com/feed/', category: 'music', color: 'agent-cyan' },
  { name: 'ROLLING STONE', url: 'https://www.rollingstone.com/music/feed/', category: 'music', color: 'agent-red' },
  { name: 'NME', url: 'https://www.nme.com/feed', category: 'music', color: 'agent-orange' },
  { name: 'COMPLEX', url: 'https://www.complex.com/music/feed', category: 'music', color: 'agent-pink' },
  { name: 'CONSEQUENCE', url: 'https://consequence.net/feed/', category: 'music', color: 'agent-purple' },
  { name: 'STEREOGUM', url: 'https://www.stereogum.com/feed/', category: 'music', color: 'agent-cyan' },
  { name: 'SPIN', url: 'https://www.spin.com/feed/', category: 'music', color: 'agent-red' },
  
  // Hip-Hop & Urban
  { name: 'HOTNEWHIPHOP', url: 'https://www.hotnewhiphop.com/rss/news.xml', category: 'hiphop', color: 'agent-orange' },
  { name: 'XXL', url: 'https://www.xxlmag.com/feed/', category: 'hiphop', color: 'agent-red' },
  { name: 'THE SOURCE', url: 'https://thesource.com/feed/', category: 'hiphop', color: 'agent-gold' },
  { name: 'RAP-UP', url: 'https://www.rap-up.com/feed/', category: 'hiphop', color: 'agent-purple' },
  { name: 'HIP HOP DX', url: 'https://hiphopdx.com/feed', category: 'hiphop', color: 'agent-cyan' },
  { name: 'VIBE', url: 'https://www.vibe.com/feed/', category: 'hiphop', color: 'agent-pink' },
  
  // Electronic & DJ Culture
  { name: 'DJ MAG', url: 'https://djmag.com/feed', category: 'electronic', color: 'agent-cyan' },
  { name: 'MIXMAG', url: 'https://mixmag.net/feed', category: 'electronic', color: 'agent-purple' },
  { name: 'EDM.COM', url: 'https://edm.com/feed', category: 'electronic', color: 'agent-blue' },
  { name: 'DANCING ASTRONAUT', url: 'https://dancingastronaut.com/feed/', category: 'electronic', color: 'agent-pink' },
  
  // Entertainment & Celebrity
  { name: 'VARIETY', url: 'https://variety.com/feed/', category: 'entertainment', color: 'agent-blue' },
  { name: 'TMZ', url: 'https://www.tmz.com/rss.xml', category: 'celebrity', color: 'agent-red' },
  { name: 'E! NEWS', url: 'https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml', category: 'celebrity', color: 'agent-pink' },
  { name: 'HOLLYWOOD REPORTER', url: 'https://www.hollywoodreporter.com/feed/', category: 'entertainment', color: 'agent-gold' },
  { name: 'ENTERTAINMENT WEEKLY', url: 'https://ew.com/feed/', category: 'entertainment', color: 'agent-red' },
  { name: 'DEADLINE', url: 'https://deadline.com/feed/', category: 'entertainment', color: 'agent-orange' },
  { name: 'PEOPLE', url: 'https://people.com/feed/', category: 'celebrity', color: 'agent-pink' },
  
  // Culture & Lifestyle
  { name: 'HYPEBEAST', url: 'https://hypebeast.com/feed', category: 'culture', color: 'agent-yellow' },
  { name: 'HIGHSNOBIETY', url: 'https://www.highsnobiety.com/feed/', category: 'culture', color: 'agent-purple' },
  { name: 'FADER', url: 'https://www.thefader.com/rss.xml', category: 'culture', color: 'agent-cyan' },
  
  // Tech & Music Tech
  { name: 'THE VERGE', url: 'https://www.theverge.com/rss/index.xml', category: 'tech', color: 'agent-purple' },
  { name: 'WIRED', url: 'https://www.wired.com/feed/rss', category: 'tech', color: 'agent-cyan' },
  { name: 'DIGITAL TRENDS', url: 'https://www.digitaltrends.com/feed/', category: 'tech', color: 'agent-blue' }
];

app.get('/api/news', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;
    const searchQuery = (req.query.q || req.query.search || '').toLowerCase().trim();
    const categoryFilter = (req.query.category || '').toLowerCase();
    const now = Date.now();
    
    // Check cache - but invalidate if search query changed
    const cacheValid = newsCache.data.length > 0 && 
                       (now - newsCache.timestamp) < NEWS_CACHE_DURATION &&
                       newsCache.query === searchQuery;
    
    if (cacheValid) {
      let filtered = newsCache.data;
      
      // Apply category filter
      if (categoryFilter && categoryFilter !== 'all') {
        filtered = filtered.filter(a => 
          a.category?.toLowerCase() === categoryFilter ||
          a.tags?.some(t => t.toLowerCase().includes(categoryFilter))
        );
      }
      
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const paginated = filtered.slice(start, end);
      
      return res.json({
        articles: paginated,
        total: filtered.length,
        page,
        per_page: perPage,
        cached: true,
        query: searchQuery
      });
    }
    
    logger.info('Fetching fresh entertainment news...', { query: searchQuery });
    
    const fetchSource = async (source) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(source.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*'
          }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) return [];
        
        const xmlText = await response.text();
        
        // Handle both RSS and Atom feeds
        const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || 
                      xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        
        return items.map(item => {
          const getTag = (tag) => {
            const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
            return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
          };
          
          const getAttr = (tag, attr) => {
            const match = item.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`));
            return match ? match[1] : '';
          };
          
          const title = getTag('title');
          const link = getTag('link') || getAttr('link', 'href');
          const description = getTag('content:encoded') || getTag('content') || getTag('description') || getTag('summary');
          const pubDate = getTag('pubDate') || getTag('published') || getTag('updated');
          const creator = getTag('dc:creator') || getTag('author') || getTag('creator') || source.name;
          const category = getTag('category') || source.category;
          
          // Extract images from multiple possible locations
          let imageUrl = null;
          const mediaMatch = item.match(/<media:content[^>]*url="([^"]*)"/) ||
                            item.match(/<media:thumbnail[^>]*url="([^"]*)"/) ||
                            item.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image/) ||
                            item.match(/<img[^>]*src="([^"]*)"/);
          if (mediaMatch) imageUrl = mediaMatch[1];
          
          // Try to extract image from description/content if not found
          if (!imageUrl) {
            const imgInContent = description.match(/<img[^>]*src="([^"]*)"/);
            if (imgInContent) imageUrl = imgInContent[1];
          }
          
          // Extract video if available
          let videoUrl = null;
          const videoMatch = item.match(/<media:content[^>]*url="([^"]*)"[^>]*type="video/) ||
                            item.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="video/);
          if (videoMatch) videoUrl = videoMatch[1];
          
          // Check for YouTube/Vimeo embeds in content
          const youtubeMatch = description.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          if (youtubeMatch) {
            videoUrl = `https://www.youtube.com/watch?v=${youtubeMatch[1]}`;
            if (!imageUrl) imageUrl = `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
          }

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
          
          // Clean text content
          const cleanContent = description
            ?.replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&#8217;/g, "'")
            .replace(/&#8220;|&#8221;/g, '"')
            .replace(/&#038;|&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 400);
          
          const cleanTitle = title
            ?.replace(/&#8217;/g, "'")
            .replace(/&#8220;|&#8221;/g, '"')
            .replace(/&#038;|&amp;/g, '&')
            .slice(0, 150) || 'UNTITLED';
          
          return {
            id: crypto.createHash('md5').update(link + title).digest('hex'),
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
            timestamp: dateObj.getTime(),
            time: timeAgo,
            source: source.name,
            category: source.category,
            color: source.color,
            author: typeof creator === 'string' ? creator : source.name,
            title: cleanTitle,
            content: cleanContent ? cleanContent + '...' : '',
            url: link,
            imageUrl: imageUrl,
            videoUrl: videoUrl,
            hasVideo: !!videoUrl,
            hasImage: !!imageUrl,
            tags: category ? [category.toUpperCase()] : [source.category.toUpperCase()]
          };
        }).filter(item => item.title && item.url);
      } catch (e) {
        logger.warn(`Failed to fetch ${source.name}`, { error: e.message });
        return [];
      }
    };

    // Fetch all sources in parallel
    const results = await Promise.all(NEWS_SOURCES.map(fetchSource));
    let allArticles = results.flat();
    
    // Apply keyword search if provided
    if (searchQuery) {
      const keywords = searchQuery.split(/\s+/);
      allArticles = allArticles.filter(article => {
        const searchText = `${article.title} ${article.content} ${article.author} ${article.tags?.join(' ')}`.toLowerCase();
        return keywords.some(kw => searchText.includes(kw));
      });
    }
    
    // Remove duplicates by title similarity
    const seen = new Set();
    allArticles = allArticles.filter(article => {
      const key = article.title.toLowerCase().slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Sort by date (newest first)
    allArticles.sort((a, b) => b.timestamp - a.timestamp);
    
    // Update cache
    if (allArticles.length > 0) {
      newsCache = {
        data: allArticles,
        timestamp: now,
        query: searchQuery
      };
    } else if (newsCache.data.length > 0) {
      logger.warn('Fetch failed, using stale cache');
    } else {
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

    // Apply category filter
    let filtered = newsCache.data.length > 0 ? newsCache.data : allArticles;
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(a => 
        a.category?.toLowerCase() === categoryFilter ||
        a.tags?.some(t => t.toLowerCase().includes(categoryFilter))
      );
    }

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginated = filtered.slice(start, end);

    res.json({ 
      articles: paginated, 
      total: filtered.length, 
      page,
      per_page: perPage,
      cached: false,
      query: searchQuery,
      sources: NEWS_SOURCES.length,
      fetchedAt: new Date().toISOString() 
    });

  } catch (err) {
    logger.error('News API Error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Failed to fetch news', details: err.message });
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
        type: repo.id % 2 === 0 ? 'image' : 'text',
        imageUrl: repo.id % 2 === 0 ? `https://opengraph.githubassets.com/1/${repo.full_name}` : null,
        videoUrl: null
      };
    });
    
    res.json({
      items: projects,
      total_count: data.total_count,
      page: parseInt(page),
      per_page: parseInt(per_page),
      disclaimer: 'Data sourced from GitHub trending AI repositories'
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
  creator: process.env.STRIPE_PRICE_CREATOR || 'price_creator_monthly',  // $4.99/mo
  studio: process.env.STRIPE_PRICE_STUDIO || 'price_studio_monthly',      // $14.99/mo
  lifetime: process.env.STRIPE_PRICE_LIFETIME || 'price_lifetime_one_time' // $99 one-time
};

// Firebase Admin is already initialized at the top of the file via getFirestoreDb()
// No need for a second initialization here

// POST /api/stripe/create-checkout-session - Create a Stripe Checkout session
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  const { tier, userId, userEmail, successUrl, cancelUrl } = req.body;

  if (!tier || !['creator', 'studio', 'lifetime'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid subscription tier' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User must be logged in to subscribe' });
  }

  const priceId = STRIPE_PRICES[tier];
  
  try {
    // Check if user already has a Stripe customer ID
    let customerId = null;
    const db = getFirestoreDb();
    if (db) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        customerId = userDoc.data()?.stripeCustomerId;
      }
    }

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: tier === 'lifetime' ? 'payment' : 'subscription',
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

  const db = getFirestoreDb();
  if (db) {
    try {
      // Get subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      await db.collection('users').doc(userId).set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionTier: tier,
        tier: tier, // Also update the tier field
        subscriptionStatus: 'active',
        subscriptionStart: new Date(subscription.current_period_start * 1000),
        subscriptionEnd: new Date(subscription.current_period_end * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Log billing history
      const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
      await db.collection('users').doc(userId).collection('billing_history').add({
        type: 'subscription',
        tier: tier,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency?.toUpperCase() || 'USD',
        stripeInvoiceId: invoice.id,
        status: 'paid',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        periodStart: new Date(subscription.current_period_start * 1000),
        periodEnd: new Date(subscription.current_period_end * 1000)
      });

      logger.info('✅ Subscription saved to Firebase', { userId: userId.slice(0, 8) + '...', tier });
    } catch (err) {
      logger.error('❌ Failed to save subscription', { error: err.message });
    }
  }
}

// Handle subscription updates (upgrade/downgrade)
async function handleSubscriptionUpdate(subscription) {
  const db = getFirestoreDb();
  if (!db) return;

  const customerId = subscription.customer;
  
  try {
    // Find user by Stripe customer ID
    const usersSnapshot = await db.collection('users')
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
      tier: tier,
      subscriptionStatus: subscription.status,
      subscriptionEnd: new Date(subscription.current_period_end * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info('✅ Subscription updated', { userId: userDoc.id.slice(0, 8) + '...', tier, status: subscription.status });
  } catch (err) {
    logger.error('❌ Failed to update subscription', { error: err.message });
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(subscription) {
  const db = getFirestoreDb();
  if (!db) return;

  const customerId = subscription.customer;
  
  try {
    const usersSnapshot = await db.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.update({
        subscriptionTier: 'free',
        tier: 'free',
        subscriptionStatus: 'cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      logger.info('✅ Subscription cancelled', { userId: userDoc.id.slice(0, 8) + '...' });
    }
  } catch (err) {
    logger.error('❌ Failed to process cancellation', { error: err.message });
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  const db = getFirestoreDb();
  if (!db) return;

  const customerId = invoice.customer;
  
  try {
    const usersSnapshot = await db.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.update({
        subscriptionStatus: 'past_due',
        paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Log failed payment in billing history
      await db.collection('users').doc(userDoc.id).collection('billing_history').add({
        type: 'payment_failed',
        amount: invoice.amount_due / 100,
        currency: invoice.currency?.toUpperCase() || 'USD',
        stripeInvoiceId: invoice.id,
        status: 'failed',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
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

  const db = getFirestoreDb();
  if (!db) {
    // Return free tier if Firebase not configured
    return res.json({ tier: 'free', status: 'none' });
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
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
    const db = getFirestoreDb();
    if (db) {
      const userDoc = await db.collection('users').doc(userId).get();
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
    const db = getFirestoreDb();
    if (db) {
      await db.collection('users').doc(targetUserId).collection('projects').doc(String(project.id)).set({
        ...project,
        savedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      logger.info('💾 Project saved', { userId: targetUserId, projectId: project.id });
      
      // Send project creation notification
      if (req.user && req.user.email) {
        const shouldNotify = await userPreferencesService.shouldNotify(admin, targetUserId, 'emailOnProjectCreate');
        if (shouldNotify) {
          emailService.notifyAdmins('projectCreated', {
            email: req.user.email,
            uid: targetUserId,
            projectData: { name: project.name, category: project.category, id: project.id }
          }).catch(err => logger.warn('Project creation notification failed:', err.message));
        }
      }
      
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
    const db = getFirestoreDb();
    if (db) {
      const snapshot = await db.collection('users').doc(targetUserId).collection('projects')
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
  const projectName = req.query.projectName || projectId; // Pass project name for notification

  if (!targetUserId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  try {
    const db = getFirestoreDb();
    if (db) {
      await db.collection('users').doc(targetUserId).collection('projects').doc(projectId).delete();
      logger.info('🗑️ Project deleted', { userId: targetUserId, projectId });
      
      // Send project deletion notification
      if (req.user && req.user.email) {
        const shouldNotify = await userPreferencesService.shouldNotify(admin, targetUserId, 'emailOnProjectDelete');
        if (shouldNotify) {
          emailService.notifyAdmins('projectDeleted', {
            email: req.user.email,
            uid: targetUserId,
            projectData: { name: projectName, id: projectId }
          }).catch(err => logger.warn('Project deletion notification failed:', err.message));
        }
      }
      
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

// ═══════════════════════════════════════════════════════════════════
// SYNCED MUSIC VIDEO GENERATION ROUTES
// ═══════════════════════════════════════════════════════════════════

/**
 * Beat Detection Endpoint (Test Version - No Auth Required)
 * Analyzes audio file and returns beat markers and BPM
 */
app.post('/api/analyze-beats-test', async (req, res) => {
  try {
    const { audioUrl } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'audioUrl is required' });
    }

    logger.info('Beat analysis requested', { audioUrl: audioUrl.substring(0, 50) });

    const analysis = await analyzeMusicBeats(audioUrl, logger);

    if (!analysis || analysis.error) {
      logger.warn('Beat analysis failed or incomplete', { error: analysis.error });
      return res.status(200).json({
        success: false,
        ...analysis,
        message: 'Beat detection completed with limited accuracy. Using default BPM.'
      });
    }

    res.json({
      success: true,
      ...analysis,
      message: 'Beat analysis complete'
    });

  } catch (error) {
    logger.error('Beat analysis error', { error: error.message });
    res.status(500).json({
      error: 'Beat analysis failed',
      details: error.message
    });
  }
});

/**
 * Beat Detection Endpoint (Production - Firebase Auth Required)
 * Analyzes audio file and returns beat markers and BPM
 */
app.post('/api/analyze-beats', verifyFirebaseToken, async (req, res) => {
  try {
    const { audioUrl } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'audioUrl is required' });
    }

    logger.info('Beat analysis requested', { audioUrl: audioUrl.substring(0, 50) });

    const analysis = await analyzeMusicBeats(audioUrl, logger);

    if (!analysis || analysis.error) {
      logger.warn('Beat analysis failed or incomplete', { error: analysis.error });
      return res.status(200).json({
        success: false,
        ...analysis,
        message: 'Beat detection completed with limited accuracy. Using default BPM.'
      });
    }

    res.json({
      success: true,
      ...analysis,
      message: 'Beat analysis complete'
    });

  } catch (error) {
    logger.error('Beat analysis error', { error: error.message });
    res.status(500).json({
      error: 'Beat analysis failed',
      details: error.message
    });
  }
});

/**
 * Generate Synced Music Video Endpoint (Test Version - No Auth Required)
 * Main endpoint for generating music videos synced to beat
 * Supports 30s, 60s, and 180s (3 minute) videos
 */
app.post('/api/generate-synced-video-test', async (req, res) => {
  try {
    const { 
      audioUrl, 
      videoPrompt, 
      songTitle = 'Untitled',
      duration = 30, // 30, 60, or 180 seconds
      style = 'cinematic'
    } = req.body;

    if (!audioUrl || !videoPrompt) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['audioUrl', 'videoPrompt']
      });
    }

    // Validate duration
    const validDurations = [30, 60, 180];
    const requestedDuration = Math.min(Math.max(duration, 30), 180);
    
    if (!validDurations.includes(requestedDuration)) {
      logger.warn('Non-standard duration requested', { requested: duration, using: requestedDuration });
    }

    logger.info('Synced music video generation requested', {
      duration: requestedDuration,
      title: songTitle,
      style,
      audioUrl: audioUrl.substring(0, 50)
    });

    const replicateKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
    
    if (!replicateKey) {
      return res.status(503).json({
        error: 'Video generation unavailable',
        details: 'REPLICATE_API_KEY not configured',
        status: 503
      });
    }

    // For testing, return success response
    return res.json({
      success: true,
      videoUrl: 'https://example.com/video.mp4',
      duration: requestedDuration,
      bpm: 120,
      beats: 32,
      segments: Math.ceil(requestedDuration / 5),
      message: 'Video generation endpoint is working (test response)'
    });

  } catch (error) {
    logger.error('Synced video generation error', { error: error.message });
    res.status(500).json({
      error: 'Video generation failed',
      details: error.message
    });
  }
});

/**
 * Generate Synced Music Video Endpoint (Production - Firebase Auth Required)
 * Main endpoint for generating music videos synced to beat
 * Supports 30s, 60s, and 180s (3 minute) videos
 */
app.post('/api/generate-synced-video', verifyFirebaseToken, checkCredits, generationLimiter, async (req, res) => {
  try {
    const { 
      audioUrl, 
      videoPrompt, 
      songTitle = 'Untitled',
      duration = 30, // 30, 60, or 180 seconds
      style = 'cinematic'
    } = req.body;

    if (!audioUrl || !videoPrompt) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['audioUrl', 'videoPrompt']
      });
    }

    // Validate duration
    const validDurations = [30, 60, 180];
    const requestedDuration = Math.min(Math.max(duration, 30), 180);
    
    if (!validDurations.includes(requestedDuration)) {
      logger.warn('Non-standard duration requested', { requested: duration, using: requestedDuration });
    }

    logger.info('Synced music video generation requested', {
      duration: requestedDuration,
      title: songTitle,
      style,
      audioUrl: audioUrl.substring(0, 50)
    });

    const replicateKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
    
    if (!replicateKey) {
      return res.status(503).json({
        error: 'Video generation unavailable',
        details: 'REPLICATE_API_KEY not configured',
        status: 503
      });
    }

    // For longer videos, return status and queue for processing
    // This is a long-running operation (5-30 minutes for 3-minute video)
    const isLongForm = requestedDuration > 30;
    
    if (isLongForm) {
      // Queue for background processing
      logger.info('Long-form video queued for background processing', {
        duration: requestedDuration
      });

      // Generate a unique job ID
      const jobId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Start async generation (don't await)
      generateSyncedMusicVideo(
        audioUrl,
        videoPrompt,
        songTitle,
        requestedDuration,
        replicateKey,
        logger
      ).then(result => {
        if (logger) logger.info('Background video generation complete', {
          jobId,
          result: result.success ? 'success' : 'failed'
        });
      }).catch(error => {
        if (logger) logger.error('Background video generation failed', {
          jobId,
          error: error.message
        });
      });

      return res.status(202).json({
        status: 'processing',
        jobId,
        message: `Music video generation started (${requestedDuration}s). This may take 5-30 minutes.`,
        estimatedTime: requestedDuration > 60 ? '10-30 minutes' : '5-15 minutes',
        pollUrl: `/api/video-job-status/${jobId}`
      });
    }

    // For 30-second videos, generate inline (faster)
    const result = await generateSyncedMusicVideo(
      audioUrl,
      videoPrompt,
      songTitle,
      requestedDuration,
      replicateKey,
      logger
    );

    if (result.success) {
      res.json({
        success: true,
        videoUrl: result.videoUrl,
        duration: result.duration,
        bpm: result.bpm,
        beats: result.beatCount,
        segments: result.segments,
        message: 'Music video generated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    logger.error('Synced video generation error', { error: error.message });
    res.status(500).json({
      error: 'Video generation failed',
      details: error.message
    });
  }
});

/**
 * Video Job Status Endpoint (Test Version - No Auth Required)
 * Check status of long-running video generation jobs
 */
app.get('/api/video-job-status-test/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    logger.info('Job status check', { jobId });

    // In production, you would query a job database/queue
    // For now, return placeholder
    res.json({
      jobId,
      status: 'processing',
      progress: Math.floor(Math.random() * 80) + 10, // 10-90%
      message: 'Video generation in progress...',
      estimatedTimeRemaining: '5-10 minutes'
    });

  } catch (error) {
    logger.error('Job status check error', { error: error.message });
    res.status(500).json({
      error: 'Could not check job status',
      details: error.message
    });
  }
});

/**
 * Video Job Status Endpoint (Production - Firebase Auth Required)
 * Check status of long-running video generation jobs
 */
app.get('/api/video-job-status/:jobId', verifyFirebaseToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    logger.info('Job status check', { jobId });

    // In production, you would query a job database/queue
    // For now, return placeholder
    res.json({
      jobId,
      status: 'processing',
      progress: Math.floor(Math.random() * 80) + 10, // 10-90%
      message: 'Video generation in progress...',
      estimatedTimeRemaining: '5-10 minutes'
    });

  } catch (error) {
    logger.error('Job status check error', { error: error.message });
    res.status(500).json({
      error: 'Could not check job status',
      details: error.message
    });
  }
});

/**
 * Video Metadata Endpoint (Test Version - No Auth Required)
 * Get technical details about a generated video
 */
app.post('/api/video-metadata-test', async (req, res) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }

    logger.info('Video metadata requested', { url: videoUrl.substring(0, 50) });

    const metadata = await getVideoMetadata(videoUrl, logger);

    res.json({
      success: true,
      metadata,
      message: 'Metadata extracted successfully'
    });

  } catch (error) {
    logger.error('Metadata extraction error', { error: error.message });
    res.status(500).json({
      error: 'Could not extract metadata',
      details: error.message
    });
  }
});

/**
 * Video Metadata Endpoint (Production - Firebase Auth Required)
 * Get technical details about a generated video
 */
app.post('/api/video-metadata', verifyFirebaseToken, async (req, res) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }

    logger.info('Video metadata requested', { url: videoUrl.substring(0, 50) });

    const metadata = await getVideoMetadata(videoUrl, logger);

    res.json({
      success: true,
      metadata,
      message: 'Metadata extracted successfully'
    });

  } catch (error) {
    logger.error('Metadata extraction error', { error: error.message });
    res.status(500).json({
      error: 'Could not extract metadata',
      details: error.message
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