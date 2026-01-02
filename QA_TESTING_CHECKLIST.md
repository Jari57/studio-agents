# Studio Agents - QA Testing Checklist

## Pre-Release Quality Assurance Guide

---

## 🔴 CRITICAL PATH TESTS (Must Pass Before Deploy)

### Authentication Flow
- [ ] **Sign Up** — New user can create account with email/password
- [ ] **Sign In** — Existing user can log in
- [ ] **Sign Out** — User can log out, clears session
- [ ] **Google OAuth** — Sign in with Google works
- [ ] **Persistent Session** — Refresh page, still logged in
- [ ] **Auth Guards** — Protected routes redirect to login

### Core Generation (Text Mode)
- [ ] **Ghostwriter** — Generate lyrics, get text response
- [ ] **Beat Architect** — Get beat description/MIDI concepts
- [ ] **Visual Vibe** — Get image prompt/concept
- [ ] **All 16 Agents** — Each agent returns valid response

### Real Asset Generation
- [ ] **Image Generation** — Toggle Real Assets, get actual image
- [ ] **Audio Generation** — Generate actual audio file
- [ ] **Video Generation** — Generate actual video (may timeout, that's OK)
- [ ] **Asset Download** — Can download generated assets

### Credits System
- [ ] **View Credits** — User sees credit balance
- [ ] **Deduct Credits** — Generation reduces credits
- [ ] **Insufficient Credits** — Proper error when credits = 0
- [ ] **Credit History** — View past transactions

### Project Management
- [ ] **Create Project** — Save work to a project
- [ ] **Load Project** — Open saved project
- [ ] **Update Project** — Edit and re-save
- [ ] **Delete Project** — Remove project
- [ ] **Generation History** — View past generations

---

## 🟡 IMPORTANT FEATURES (Should Work)

### AMO Studio Session
- [ ] **Open AMO Session** — Modal/view opens correctly
- [ ] **Add Tracks** — Can add audio/vocal/visual tracks
- [ ] **Track Output Types** — Waveform/File/Stems options work
- [ ] **BPM Sync Settings** — Can set BPM, frame rate, aspect ratio
- [ ] **Real Assets Toggle** — Switch between text and real mode
- [ ] **Render Master** — Combine tracks into output
- [ ] **Render Limit** — Max 3 renders enforced
- [ ] **Export Session** — Download session data

### Landing Page
- [ ] **Hero Section** — Renders correctly, animations work
- [ ] **Stats Counter** — Animated numbers display
- [ ] **Agent Carousel** — Can scroll through agents
- [ ] **Pricing Cards** — All 3 tiers display
- [ ] **CTA Buttons** — "Get Started" navigates correctly
- [ ] **Footer Links** — Privacy, Terms, etc. open modals
- [ ] **Cookie Consent** — Banner appears, can dismiss

### Modals
- [ ] **Close Button (X)** — Visible and clickable on ALL modals
- [ ] **Click Outside** — Closes modal (where appropriate)
- [ ] **Escape Key** — Closes modal
- [ ] **Scroll Lock** — Background doesn't scroll when modal open
- [ ] **Mobile Friendly** — Modals work on small screens

### Navigation
- [ ] **View Switching** — Landing → Studio → Account flows
- [ ] **Back Button** — Browser back works correctly
- [ ] **Deep Links** — Direct URL to views works

---

## 🟢 NICE TO HAVE (Should Test When Time Permits)

### Subscription & Billing
- [ ] **View Plans** — Pricing modal shows all tiers
- [ ] **Stripe Checkout** — Redirect to Stripe works
- [ ] **Subscription Status** — Shows current plan
- [ ] **Cancel Subscription** — Can cancel (if implemented)

### Investor Access
- [ ] **Request Form** — Can submit investor request
- [ ] **Email Validation** — Invalid emails rejected
- [ ] **Pending State** — Shows "request pending" after submit
- [ ] **Access Check** — Approved investors can access

### Performance
- [ ] **Initial Load** — Page loads < 3 seconds
- [ ] **Generation Speed** — Text response < 5 seconds
- [ ] **No Memory Leaks** — Extended use doesn't slow down
- [ ] **Image Optimization** — Assets load progressively

### Accessibility
- [ ] **Keyboard Navigation** — Can tab through UI
- [ ] **Focus Indicators** — Visible focus states
- [ ] **Screen Reader** — Basic compatibility
- [ ] **Color Contrast** — Text readable

---

## 📱 MOBILE TESTING

### Responsive Design
- [ ] **iPhone SE (375px)** — UI fits, no horizontal scroll
- [ ] **iPhone 14 (390px)** — All features accessible
- [ ] **iPad (768px)** — Tablet layout works
- [ ] **Android Chrome** — Cross-browser works

### Touch Interactions
- [ ] **Tap Targets** — Buttons large enough (44px min)
- [ ] **Swipe Gestures** — Carousels respond to swipe
- [ ] **Pull to Refresh** — Doesn't break app
- [ ] **Keyboard Popup** — Inputs don't get hidden

---

## 🧪 AUTOMATED TESTS

### Playwright API Tests (120 tests)
```bash
cd frontend
npx playwright test api.spec.js --reporter=list
```

Expected: 120 passed

### Test Suites:
- Backend API Health (2 tests)
- Public API Endpoints (3 tests)
- Protected API Endpoints (9 tests)
- Generation Endpoint (2 tests)
- Stripe Endpoints (2 tests)
- AMO Orchestrator (3 tests)
- Media Generation (3 tests)
- Agent Features (4 tests)
- Firebase Integration (5 tests)
- Project Management (3 tests)
- Sanity Checks (4 tests)

---

## 🔧 MANUAL API TESTING

### Quick Health Check
```bash
curl http://localhost:3001/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### Test Generation
```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"write a 4-line hook about success","systemInstruction":"be lyrical"}'
```

### Test Image Generation
```bash
curl -X POST http://localhost:3001/api/generate-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt":"album cover, dark aesthetic, purple neon"}'
```

---

## 🚨 KNOWN ISSUES & LIMITATIONS

| Issue | Severity | Status |
|-------|----------|--------|
| Video generation can timeout (30s+) | Medium | Expected behavior |
| Stripe not configured in dev | Low | Use test keys |
| Audio gen requires Replicate API key | Medium | Check .env |
| StudioView.jsx exceeds 500KB | Low | Babel warning only |

---

## 📋 RELEASE CHECKLIST

### Before Push to Main
- [ ] All critical path tests pass
- [ ] Playwright tests: 120/120 passing
- [ ] No console errors in browser
- [ ] Build succeeds: `npm run build`
- [ ] Git status clean

### After Deploy
- [ ] Verify production URL loads: studioagents.ai
- [ ] Test login on production
- [ ] Generate one asset to verify APIs
- [ ] Check Railway logs for errors
- [ ] Check Vercel deployment status

---

## 🔄 REGRESSION TESTING

After any major change, re-test:
1. Authentication flow
2. Basic text generation
3. Modal close buttons
4. Mobile responsiveness
5. Credit deduction

---

*Last Updated: January 1, 2026*
