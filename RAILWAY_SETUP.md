# Railway Deployment Setup

## Quick Deploy

Railway automatically deploys from the `main` branch using the Dockerfile.

## Required Environment Variables

Set these in Railway dashboard (Settings → Variables):

### Essential (REQUIRED)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=production
```

### Optional (Add if using these features)

**Replicate (for video generation):**
```bash
REPLICATE_API_TOKEN=your_token
```

**Stripe (for payments):**
```bash
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Firebase Admin SDK:**
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

**Email (Nodemailer):**
```bash
EMAIL_USER=your@email.com
EMAIL_PASS=your_app_password
```

## Troubleshooting Build Failures

### If build fails:

1. **Check Railway logs** for specific error
2. **Verify environment variables** are set in Railway dashboard
3. **Check GEMINI_API_KEY** is present (most common issue)

### Common Issues:

**"API key not configured"**
- Solution: Add `GEMINI_API_KEY` to Railway environment variables

**"Firebase initialization failed"**
- Solution: This is a warning, not an error. Service continues without Firebase.
- To fix: Add Firebase environment variables listed above

**"Dockerfile build failed"**
- Check if frontend build succeeded (Railway shows build logs)
- Ensure package.json dependencies are valid

## Manual Deploy

If you need to force a redeploy:
```bash
git commit --allow-empty -m "Trigger Railway redeploy"
git push origin main
```

## Health Check

After deployment, verify backend is running:
```bash
curl https://studio-agents-backend-production.up.railway.app/health
```

Should return:
```json
{"status":"ok","service":"studio-agents-backend","timestamp":"..."}
```
