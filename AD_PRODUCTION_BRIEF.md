# STUDIO AGENTS — Cinematic Ad Production Brief

**Format:** 30-60 second hero video for studioagents.ai  
**Tone:** Premium, cinematic, aspirational — Apple/Nike caliber  
**Target:** Independent artists, producers, content creators  
**Deliverable:** Hero video for landing page + social cuts (15s, 30s, 60s)

---

## Creative Concept: "FROM NOTHING"

**Logline:** One prompt. Four AI agents. A full release package in seconds.  
**Theme:** The democratization of music production — from blank screen to finished release.

---

## Shot List & Studio Agents Prompts

Use these prompts in the Studio Agents Orchestrator to generate the actual assets for the ad.

### ACT 1: THE BLANK CANVAS (0:00–0:08)

**Visual:** Dark screen. A single cursor blinks. Text types itself:

> *"Make a trap anthem about rising from nothing in Brooklyn"*

**Audio:** Silence → low sub-bass rumble building

**Generate with Studio Agents:**
- **Ghostwriter prompt:** `Write a 16-bar trap anthem about rising from nothing in Brooklyn. Dark, cinematic tone. 808 bass, haunting melody. Include [Verse 1] and [Chorus] tags.`

---

### ACT 2: THE AGENTS ACTIVATE (0:08–0:20)

**Visual:** Split-screen showing 4 agents working simultaneously. Each quadrant lights up:

| Quadrant | Agent | What's Shown |
|----------|-------|-------------|
| Top-left | Ghostwriter | Lyrics appearing line by line |
| Top-right | Music GPT | Waveform building, BPM counter |
| Bottom-left | Album Artist | Cover art rendering from noise |
| Bottom-right | Video Agent | Video frames assembling |

**Audio:** Beat drops — the actual generated beat plays

**Generate with Studio Agents:**
- **Music GPT prompt:** `Dark trap instrumental, 140 BPM, 808 sub-bass, haunting piano melody, Brooklyn gritty vibes, cinematic strings, 30 seconds`
- **Album Artist prompt:** `Album cover art for a trap record called "Rising From Nothing" - dark cinematic Brooklyn skyline silhouette, purple and cyan neon glow, urban gritty aesthetic, professional album art quality, dramatic lighting`
- **Video Agent prompt:** `Cinematic music video, dark urban Brooklyn streets at night, neon reflections on wet pavement, silhouette figure walking through city, dramatic lighting, 4K cinematic look`

---

### ACT 3: THE REVEAL (0:20–0:35)

**Visual:** The 4 outputs merge into a single polished release package:
1. Lyrics overlay on the video
2. Beat plays with waveform visualization
3. Cover art spins and lands center-frame
4. Video plays behind with depth-of-field blur

**Text overlay (cinematic typography):**
> **4 AI AGENTS. 12 SECONDS. ONE COMPLETE RELEASE.**

**Audio:** Full beat playing, lyrics could be vocalized via speech synthesis

**Generate with Studio Agents:**
- **Vocal Lab prompt:** `Male rap vocal, Brooklyn accent, confident delivery, four bars: "Started from the concrete, dreams in my pocket / Brooklyn nights, city lights, nobody could stop it"`

---

### ACT 4: THE CTA (0:35–0:45)

**Visual:** Clean dark background. Studio Agents logo. Pricing flash:

> **$0 to start. $4.99/mo to go pro.**  
> **studioagents.ai**

**Text animation sequence:**
1. "Your label." (fade in)
2. "Your pocket." (fade in)
3. Studio Agents logo (scale in)
4. "Try free — no sign up required" (button pulse)

**Audio:** Beat fades, clean synth pad resolves

---

## Additional Assets to Generate

### Social Media Cuts

**15-second Instagram/TikTok cut:**
- Prompt → agents activate → output reveal → CTA
- Vertical (9:16) format
- **Music GPT prompt:** `Energetic trap beat, 15 seconds, hook-focused, punchy 808s, perfect for social media`

**30-second YouTube pre-roll:**
- Full Act 1-3 compressed
- Horizontal (16:9)

**Static thumbnails (generate via Album Artist):**
- `Professional tech product showcase, Studio Agents AI music platform, dark premium interface with purple and cyan accents, floating music notes and waveforms, 4K quality`
- `Before and after comparison: messy notebook with handwritten lyrics on left, polished professional album package on right, dramatic lighting, premium product photography`

---

## Production Workflow

### Step 1: Generate Raw Assets (Use Studio Agents)
1. Open Orchestrator at studioagents.ai
2. Enter the Brooklyn trap prompt from Act 1
3. Let all 4 agents generate (lyrics, beat, art, video)
4. Download all outputs

### Step 2: Screen Record the Process
1. Use OBS Studio or Loom
2. Record the Orchestrator in action (the animated demo IS the ad)
3. Capture: prompt typing → agents activating → outputs appearing
4. Record at highest resolution possible (1440p+ for 4K upscale)

### Step 3: Post-Production
1. **CapCut / DaVinci Resolve / Premiere Pro**
2. Add cinematic color grade (teal + orange, high contrast)
3. Add text overlays with premium typography (SF Pro, Inter, or Montserrat)
4. Add sound design (whooshes on transitions, bass hits on reveals)
5. Export: 4K 60fps MP4, H.265

### Step 4: Deploy
1. Upload to YouTube (unlisted for embed)
2. Add as hero video on landing page
3. Create social cuts (15s, 30s)
4. Use as Stripe checkout background video

---

## Alternative: Use the Built-In Animated Demo

The `HeroProductDemo.jsx` component already acts as a cinematic showcase:
- Auto-plays on landing page load
- Shows the full orchestration pipeline
- No video file to load (instant)
- Always matches current product UI
- Interactive "Try It Free" CTA at completion

This serves as the **primary product visual** until a professional video is produced.

---

## Brand Guidelines for Video

### Colors
- Primary: `#a855f7` (purple) → `#06b6d4` (cyan) gradient
- Accent: `#22c55e` (green for success), `#ec4899` (pink for video)
- Background: `#0a0a1a` (near-black)
- Text: `#ffffff` (white), `rgba(255,255,255,0.6)` (secondary)

### Typography
- Headlines: Inter/SF Pro, 900 weight, tight letter-spacing
- Body: System font stack, 400-600 weight
- Code/monospace: JetBrains Mono or SF Mono

### Logo
- Sparkles icon (from Lucide) + "Studio Agents" text
- Gradient treatment on icon, white text

### Taglines (pick one per asset)
- "Your Label. Your Pocket."
- "16 AI Agents. One Prompt. Full Release."
- "Stop Waiting for Permission."
- "From Nothing to Release in Seconds."
- "The World's First AI Record Label."

---

## Measurement

Track ad performance via:
- Landing page video play rate (how many visitors watch >50%)
- Time on page (before vs after video addition)
- CTA click-through rate from video section
- Social engagement on video cuts

---

*Brief prepared March 2026 — Studio Agents*
