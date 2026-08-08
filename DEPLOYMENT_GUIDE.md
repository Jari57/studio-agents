# Studio Agents - Deployment Guide

Complete guide for deploying to development and production environments with monitoring.

---

## 📋 Quick Deploy Commands

### Development (Local)
```powershell
# Backend
cd backend
npm install
npm run dev  # Runs with NODE_ENV=development

# Frontend (new terminal)
cd frontend
npm install
npm run dev  # Opens at http://localhost:5173
```

### Production (Railway)
```powershell
# Build frontend
cd frontend
npm run build

# Commit and push (auto-deploys to Railway)
cd ..
git add -A
git commit -m "deploy: production update"
git push origin main

# Railway auto-deploys backend when detecting changes
```

---

## 🖥️ Studio Agents Monitoring Dashboard

### Access Dashboard
- **Local Dev**: http://localhost:3001/dashboard
- **Production**: https://your-app.railway.app/dashboard

### Dashboard Features
✅ Real-time backend health metrics  
✅ Memory usage tracking  
✅ Request/response analytics  
✅ AI generation statistics  
✅ Error log monitoring  
✅ Request timeline visualization  
✅ Auto-refresh (5-second intervals)  
✅ Export logs as JSON  

---

## 🔧 Environment Configuration

### Backend (.env)
Create `backend/.env` file:
```env
# Required
GEMINI_API_KEY=your_api_key_here

# Optional
GENERATIVE_MODEL=gemini-2.5-flash
NODE_ENV=development  # or production
PORT=3001
```

### Railway Environment Variables
Set in Railway dashboard (backend service):
- `GEMINI_API_KEY` - Your Google AI API key
- `NODE_ENV` - Set to `production`
- `GENERATIVE_MODEL` - (Optional) Model to use

### Frontend Firebase Config
Already configured in `frontend/src/App.jsx` - no changes needed.

---

## 📊 Logging System

### Log Files (Backend)
All logs stored in `backend/logs/`:
- `combined.log` - All activity (info, warn, error)
- `error.log` - Errors only
- `access.log` - HTTP requests (production)

### Log Levels
- **DEBUG**: Detailed diagnostic info (dev only)
- **INFO**: General operational messages
- **WARN**: Warning messages
- **ERROR**: Error messages with stack traces

### View Logs
```powershell
# Development (console output)
npm run dev

# Production (Railway)
# View logs in Railway dashboard or CLI
railway logs --follow

# View local log files
Get-Content backend\logs\combined.log -Tail 50
Get-Content backend\logs\error.log -Tail 20
```

---

## 🚦 Deployment Checklist

### Pre-Deploy
- [ ] Run `npm run build` in frontend
- [ ] Test locally with production environment
- [ ] Check for console errors/warnings
- [ ] Verify API key is set in Railway
- [ ] Review recent git changes

### Deploy
- [ ] Commit all changes with descriptive message
- [ ] Push to `main` branch
- [ ] Monitor Railway deployment logs
- [ ] Wait for "Build successful" message

### Post-Deploy
- [ ] Access production dashboard
- [ ] Verify health endpoint: `/health`
- [ ] Test AI generation endpoints
- [ ] Check error logs for issues
- [ ] Monitor memory usage
- [ ] Verify rate limiting is active

---

## 🔍 Health Check Endpoints

### Basic Health Check
```bash
GET https://your-app.railway.app/
# Response: "Studio Agents V3.5 Backend Online. High-Fidelity Uplink Established."
```

### Detailed Health Status
```bash
GET https://your-app.railway.app/health
# Response (JSON):
{
  "status": "healthy",
  "timestamp": "2025-12-12T...",
  "uptime": 3600.5,
  "environment": "production",
  "memory": {
    "used": "85 MB",
    "total": "120 MB"
  },
  "apiKey": "configured",
  "rateLimiting": "active",
  "nodeVersion": "v20.19.0",
  "platform": "linux"
}
```

---

## 🔥 Troubleshooting

### Backend Won't Start
```powershell
# Check API key
cd backend
node check_env.js

# Install dependencies
npm ci

# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### Frontend Build Fails
```powershell
cd frontend
npm ci
npm run build

# If ESLint errors, temporarily disable
# Edit vite.config.js: Comment out ESLint plugin
```

### Railway Deployment Fails
1. Check Railway logs for errors
2. Verify `GEMINI_API_KEY` is set
3. Ensure `package.json` has correct start script
4. Check Node.js version compatibility (>=20.19.0)

### Rate Limiting Issues
- Check dashboard for rate limit hits
- Adjust limits in `backend/server.js`:
  - `apiLimiter`: General API (default 100 req/15min)
  - `generationLimiter`: AI generation (default 10 req/min)

### High Memory Usage
1. Check dashboard memory metrics
2. Restart server if >90% usage
3. Review logs for memory leaks
4. Consider upgrading Railway plan

---

## 📈 Scaling Production

### Current Capacity
- **Concurrent users**: 500-1,000
- **Requests/hour**: 6,000 (rate limited)
- **AI generations/hour**: 600
- **Estimated cost**: $17-22/day (10k visitors)

### Scale Up (When Needed)

**Increase Rate Limits** (Edit `backend/server.js`)
```javascript
// From 100 to 200 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200  // Increased from 100
});

// From 10 to 20 AI generations per minute
const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20  // Increased from 10
});
```

**Upgrade Railway Plan**
- Free: Limited resources
- Hobby ($5-10/mo): Better for production
- Pro ($20+/mo): High traffic support

**Enable Firebase Blaze Plan**
- Current: Free tier (50k reads/day, 20k writes/day)
- Blaze: Pay-as-you-go (unlimited, ~$0.06 per 100k reads)

---

## 🛡️ Security Best Practices

### API Keys
✅ Never commit `.env` files  
✅ Use Railway environment variables for production  
✅ Rotate API keys every 90 days  
✅ Monitor Gemini API usage in console  

### Rate Limiting
✅ Keep rate limits enabled in production  
✅ Monitor dashboard for abuse patterns  
✅ Block IPs making excessive requests  
✅ Set up billing alerts in Google AI Studio  

### Logging
✅ Review error logs daily  
✅ Set up alerts for critical errors  
✅ Export logs weekly for analysis  
✅ Rotate logs to prevent disk overflow  

---

## 📞 Support & Resources

### Dashboard Access
- **Local**: http://localhost:3001/dashboard
- **Production**: https://your-railway-url.railway.app/dashboard

### Log Locations
- **Backend logs**: `backend/logs/`
- **Railway logs**: Railway dashboard > Deployments > View Logs
- **Browser console**: F12 (developer tools)

### Key Files
- Backend server: `backend/server.js`
- Frontend app: `frontend/src/App.jsx`
- Dashboard: `backend/dashboard.html`
- Environment: `backend/.env` (local only)

### Useful Commands
```powershell
# Check backend health
curl http://localhost:3001/health

# Follow backend logs (dev)
cd backend; npm run dev

# Build frontend for production
cd frontend; npm run build

# Deploy to production
git add -A; git commit -m "deploy update"; git push origin main

# View Railway logs
railway logs --follow

# Export dashboard data
# Visit /dashboard > Click "Export Data" button
```

---

## ✅ Quick Reference

### Development Workflow
1. Start backend: `cd backend; npm run dev`
2. Start frontend: `cd frontend; npm run dev`
3. Access dashboard: http://localhost:3001/dashboard
4. Make changes → Test locally
5. Commit & push when ready

### Production Deployment
1. Build frontend: `cd frontend; npm run build`
2. Test build: `npm run preview`
3. Commit: `git add -A; git commit -m "deploy: description"`
4. Push: `git push origin main`
5. Monitor: Check Railway logs and dashboard
6. Verify: Visit production URL and test features

### Emergency Rollback
```powershell
# View recent commits
git log --oneline -10

# Rollback to previous commit
git reset --hard <commit-hash>
git push --force origin main
```

---

**Studio Agents monitoring online**: Use the command center for real-time system health and generation monitoring. 🚀
