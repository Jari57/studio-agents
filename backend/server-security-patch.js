// SECURITY ENHANCEMENTS TO ADD TO server.js

// 1. Add to imports (line 6):
const helmet = require('helmet');
const crypto = require('crypto');

// 2. Replace app.use(cors()) with enhanced CORS (around line 103):
const allowedOrigins = isDevelopment 
  ? ['http://localhost:5173', 'http://localhost:3000']
  : ['https://restored-os-whip-montez-production.up.railway.app', process.env.FRONTEND_URL].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 3. Replace apiLimiter with fingerprint-based rate limiting (around line 120):
const createFingerprint = (req) => {
  const userId = req.body?.userId || 'anon';
  return crypto.createHash('md5').update(`${req.ip}-${userId}-${req.headers['user-agent']}`).digest('hex');
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: createFingerprint,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path, fingerprint: createFingerprint(req) });
    res.status(429).json({ error: 'Too many requests', retryAfter: '15 minutes' });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 4. Add error tracking middleware (before app.listen):
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  res.status(500).json({ error: 'Internal server error' });
});
