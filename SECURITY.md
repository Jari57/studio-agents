# Security Guide

## Overview

This document outlines the security measures implemented in the Whip Montez platform and best practices for maintaining a secure deployment.

## Implemented Security Measures

### 1. Backend Security Headers (helmet.js)

The backend uses helmet.js to set secure HTTP headers:

```javascript
// Content Security Policy
- defaultSrc: ["'self'"] - Only load resources from same origin
- styleSrc: ["'self'", "'unsafe-inline'"] - Allow inline styles for React
- scriptSrc: ["'self'", "'unsafe-inline'"] - Allow inline scripts
- imgSrc: ["'self'", "data:", "https:"] - Allow images from HTTPS sources

// HTTP Strict Transport Security
- maxAge: 31536000 (1 year)
- includeSubDomains: true
- preload: true
```

**Protection Against:**
- Cross-Site Scripting (XSS)
- Clickjacking
- MIME type sniffing
- Protocol downgrade attacks

### 2. CORS Configuration

**Current State:** Basic CORS enabled for all origins (development mode)

**Production Recommendation:**
```javascript
const allowedOrigins = [
  'https://restored-os-whip-montez-production.up.railway.app',
  process.env.FRONTEND_URL
].filter(Boolean);

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
```

### 3. Rate Limiting

**Current Implementation:**
- 100 requests per 15 minutes per IP address
- Applied to `/api/generate` endpoint

**Enhanced Recommendation (in server-security-patch.js):**
```javascript
// Fingerprint-based tracking prevents IP spoofing
const createFingerprint = (req) => {
  const userId = req.body?.userId || 'anon';
  return crypto.createHash('md5')
    .update(`${req.ip}-${userId}-${req.headers['user-agent']}`)
    .digest('hex');
};
```

**Protection Against:**
- API abuse
- DDoS attacks
- Credential stuffing
- Resource exhaustion

### 4. Environment Variable Security

**Never commit to repository:**
- `.env` files
- API keys (GEMINI_API_KEY)
- Firebase service account keys
- Database credentials

**Secure storage:**
- Railway environment variables (production)
- Local `.env` files (development, gitignored)
- Secret management services (recommended for team environments)

**Verification:**
```bash
# Check if secrets are in git history
git log --all --full-history --source -- **/.env

# Should return nothing
```

### 5. Firebase Security

**Current State:** Firebase client SDK with anonymous authentication

**Required Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts collection
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Analytics (read-only)
    match /analytics/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

### 6. Dependency Security

**Automated Auditing:**
- GitHub Actions runs `npm audit` on every push
- Checks for moderate+ severity vulnerabilities
- Alerts via CI/CD pipeline

**Manual Checks:**
```bash
# Backend
cd backend && npm audit

# Frontend
cd frontend && npm audit

# Fix automatically if possible
npm audit fix

# For breaking changes
npm audit fix --force
```

### 7. Logging & Monitoring

**Current Implementation:**
- Winston logger with file rotation
- Structured JSON logging
- Separate error/combined logs

**Log Levels:**
- `error`: System failures, unhandled exceptions
- `warn`: Rate limit hits, CORS blocks, suspicious activity
- `info`: Normal operations, API calls, startup events
- `debug`: Development-only verbose logging

**Production Best Practice:**
```javascript
// In backend/server.js
logger.error('Unhandled error', {
  error: err.message,
  stack: err.stack,
  path: req.path,
  method: req.method,
  ip: req.ip,
  timestamp: new Date().toISOString()
});
```

## Security Checklist

### Before Deployment

- [ ] All `.env` files in `.gitignore`
- [ ] No API keys in source code
- [ ] CORS restricted to allowed origins only
- [ ] Rate limiting enabled on all API endpoints
- [ ] helmet.js configured and active
- [ ] Firebase security rules deployed
- [ ] `npm audit` shows 0 high/critical vulnerabilities
- [ ] HTTPS enforced (HSTS preload)
- [ ] Error messages don't leak sensitive info

### Post-Deployment

- [ ] Test rate limiting (should return 429 after 100 requests)
- [ ] Verify CORS blocks unauthorized origins
- [ ] Check logs for suspicious activity
- [ ] Monitor error rates (should be <1%)
- [ ] Verify CSP headers in browser DevTools
- [ ] Test authentication flows
- [ ] Confirm Firebase rules active

## Incident Response

### If API Key Compromised

1. **Immediate:** Revoke compromised key in Google AI Studio
2. Generate new GEMINI_API_KEY
3. Update Railway environment variable
4. Redeploy backend (`git push` triggers auto-deploy)
5. Check logs for unauthorized usage
6. Consider adding IP whitelist temporarily

### If Unusual Activity Detected

1. Check `backend/logs/error.log` for patterns
2. Identify source IP addresses
3. Temporarily reduce rate limit if needed
4. Add firewall rules if attack is ongoing
5. Review Winston logs for full context

### If Database Breach

1. Check Firebase Authentication logs
2. Review Firestore security rules
3. Audit user access patterns
4. Reset compromised user accounts
5. Force re-authentication for all users

## Recommended Enhancements

### 1. Add Sentry Error Tracking

```bash
npm install @sentry/node @sentry/react
```

**Benefits:**
- Real-time error alerts
- Stack trace aggregation
- Performance monitoring
- User impact tracking

### 2. Implement Request Validation

```bash
npm install express-validator
```

**Example:**
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/generate', [
  body('prompt').isString().isLength({ min: 1, max: 5000 }),
  body('systemInstruction').optional().isString().isLength({ max: 2000 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request
});
```

### 3. Add API Authentication

**JWT-based authentication:**
```javascript
const jwt = require('jsonwebtoken');

const authenticateAPI = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.userId = decoded.userId;
    next();
  });
};

app.post('/api/generate', authenticateAPI, generateHandler);
```

### 4. Setup WAF (Web Application Firewall)

**Cloudflare (Recommended):**
- DDoS protection
- Bot mitigation
- Rate limiting at edge
- SSL/TLS termination

### 5. Implement Secrets Rotation

**Monthly rotation schedule:**
- GEMINI_API_KEY
- Firebase service account key
- JWT signing secrets
- Database credentials

## Contact

For security concerns or vulnerability reports, contact the development team via GitHub issues (mark as security).

**Last Updated:** 2025-01-XX  
**Security Version:** 1.0
