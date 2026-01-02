/**
 * Demo Mode Utility
 * 
 * Provides mock responses for demo/judge mode when:
 * - User enters the demo code (e.g., "pitch")
 * - API is unavailable
 * 
 * This allows shipathon judges to experience the full UI without burning API credits.
 * 
 * To activate: Type "pitch" in any text input, or add ?demo=pitch to URL
 */

// Demo mode state
let isDemoMode = false;

// Secret code to activate demo mode
const DEMO_CODE = 'pitch';

// Check if demo mode is enabled via URL param or localStorage
export function checkDemoMode() {
  // Check URL param: ?demo=pitch
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === DEMO_CODE) {
    isDemoMode = true;
    localStorage.setItem('demoMode', 'true');
  }
  
  // Check localStorage
  if (localStorage.getItem('demoMode') === 'true') {
    isDemoMode = true;
  }
  
  return isDemoMode;
}

/**
 * Check if input contains the demo code and activate if so
 * @param {string} input - User input to check
 * @returns {boolean} Whether demo mode was just activated
 */
export function checkDemoCode(input) {
  if (input && input.toLowerCase().trim() === DEMO_CODE) {
    enableDemoMode();
    return true;
  }
  return false;
}

export function enableDemoMode() {
  isDemoMode = true;
  localStorage.setItem('demoMode', 'true');
  console.log('🎭 Demo mode enabled - using mock responses');
}

export function disableDemoMode() {
  isDemoMode = false;
  localStorage.removeItem('demoMode');
  console.log('🎭 Demo mode disabled - using real API');
}

export function toggleDemoMode() {
  if (isDemoMode) {
    disableDemoMode();
  } else {
    enableDemoMode();
  }
  return isDemoMode;
}

export function getDemoModeState() {
  return isDemoMode;
}

export function getDemoCode() {
  return DEMO_CODE;
}

// Initialize on load
checkDemoMode();

/**
 * Mock responses for different agent types
 */
const MOCK_RESPONSES = {
  ghostwriter: `**Verse 1:**
I came up from the basement, now I'm touching ceilings
Every scar on my heart, turned into healing
They said I wouldn't make it, look at me now
Stack my paper to the sky, take a bow

**Hook:**
Started from the bottom, now we at the top
Dreams in my pocket, never gonna stop
Every door they closed, I kicked it down
King of my city, wear that crown

**Verse 2:**
Midnight sessions, pouring out my soul
Every word I write is making me whole
They tried to dim my light, but I shine brighter
Every struggle made me a fighter

---
*Generated in Demo Mode - Connect API for personalized lyrics*`,

  'release-strategist': `## Release Strategy Analysis

**Commercial Viability: 8.5/10**
Your track has strong commercial potential with its melodic hook and contemporary production.

**Key Strengths:**
- Catchy melodic structure that supports playlist placement
- Production quality meets industry standards
- Target demographic alignment: 18-34 urban/suburban

**Recommended Release Strategy:**
1. **Pre-save Campaign** (2 weeks before) - Build anticipation with teaser content
2. **Playlist Pitching** - Target RapCaviar, Most Necessary, and genre-specific playlists
3. **Content Rollout** - 3 TikTok clips, 2 Instagram Reels, 1 YouTube Short

**Optimal Release Day:** Friday (maximizes first-week streaming)

---
*Generated in Demo Mode - Connect API for real analysis*`,

  'sample-hunter': `## Sample Recommendations

Based on your vibe, here are hidden gems from the crates:

**1. "Distant Dreams" - The Soul Searchers (1974)**
- BPM: 92 | Key: Am
- Flip potential: That string section at 1:45 is untouched
- Clearance: Medium difficulty (independent label)

**2. "Morning Light" - Sunrise Orchestra (1978)**
- BPM: 88 | Key: Dm  
- Flip potential: Piano loop at intro, drum break at 2:30
- Clearance: Easy (public domain in most territories)

**3. "Urban Poetry" - City Jazz Ensemble (1982)**
- BPM: 95 | Key: Gm
- Flip potential: Bass line throughout, horn stabs at chorus
- Clearance: Contact rights holder directly

---
*Generated in Demo Mode - Connect API for real sample discovery*`,

  'visual-director': `## Music Video Treatment

**Concept: "Rise & Reign"**

**Visual Theme:** Contrast between struggle and success, using split-screen storytelling

**Key Scenes:**
1. **Opening (0:00-0:15):** Artist in dimly lit room, writing lyrics by candlelight
2. **Verse 1 (0:15-0:45):** Flashback montage - humble beginnings, rejection letters burning
3. **Hook (0:45-1:15):** Transition to sold-out venue, crowd going crazy
4. **Verse 2 (1:15-1:45):** Behind-the-scenes studio footage, team celebration
5. **Outro (1:45-2:00):** Artist on rooftop at sunrise, city below

**Color Palette:** Deep blues and blacks for past, gold and white for present

**Estimated Budget:** $15,000 - $25,000

---
*Generated in Demo Mode - Connect API for full creative treatment*`,

  'brand-architect': `## Brand Identity Blueprint

**Artist Archetype:** The Visionary Pioneer

**Core Brand Pillars:**
1. **Authenticity** - Raw, unfiltered storytelling
2. **Innovation** - Pushing sonic boundaries
3. **Community** - Elevating the culture

**Visual Identity:**
- Primary Colors: Deep purple (#6B21A8), Gold (#F59E0B)
- Typography: Bold sans-serif for headlines, clean serif for body
- Logo Concept: Abstract crown merging with sound wave

**Voice & Tone:**
- Confident but not arrogant
- Inspirational without being preachy
- Street-smart with intellectual depth

**Content Themes:**
- Studio sessions & process
- Community spotlights
- Personal growth journey

---
*Generated in Demo Mode - Connect API for full brand strategy*`,

  'tour-architect': `## Tour Routing Proposal

**Tour Name:** "The Ascension Tour"

**Phase 1: Regional Circuit (8 dates)**
- Week 1: Atlanta → Charlotte → Raleigh
- Week 2: DC → Philly → NYC
- Week 3: Boston → Brooklyn

**Venue Recommendations:**
- 500-800 cap rooms for intimate energy
- Focus on venues with strong local press relationships
- Priority: Rooms with quality sound systems

**Budget Estimate:**
- Venue costs: $2,500/night avg
- Travel: $1,200/week
- Crew (2 people): $3,000/week
- Merch investment: $5,000 upfront

**Projected Revenue:**
- Ticket sales (70% capacity): $28,000
- Merch: $8,000
- Net profit potential: $12,000-$15,000

---
*Generated in Demo Mode - Connect API for real tour planning*`,

  default: `## AI Response

Thank you for your input! Here's a thoughtful response based on your request:

**Key Insights:**
- Your concept shows strong creative potential
- There are several strategic angles to explore
- The market conditions favor this type of content

**Recommendations:**
1. Focus on authenticity and unique voice
2. Build consistent content around your core message  
3. Engage your community early and often
4. Measure results and iterate quickly

**Next Steps:**
- Refine your core concept
- Test with a small audience
- Scale what works

---
*Generated in Demo Mode - Connect API for personalized AI assistance*`
};

/**
 * Get a mock response for demo mode
 * @param {string} agentId - The agent identifier
 * @param {string} prompt - The user's prompt (for context)
 * @returns {Promise<string>} Mock response with realistic typing delay
 */
export async function getMockResponse(agentId = 'default', prompt = '') {
  // Add realistic delay (500ms - 2000ms)
  const delay = 500 + Math.random() * 1500;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Normalize agent ID
  const normalizedId = agentId.toLowerCase().replace(/\s+/g, '-');
  
  // Get response or default
  const response = MOCK_RESPONSES[normalizedId] || MOCK_RESPONSES.default;
  
  // Add prompt echo for context
  const contextNote = prompt ? `\n\n> Your input: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"` : '';
  
  return response + contextNote;
}

/**
 * Demo mode banner component (for React)
 */
export const DEMO_BANNER_STYLES = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#000',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 9999,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
  },
  icon: '🎭',
  text: 'Demo Mode Active',
  subtext: 'Click to use real API',
};

export default {
  checkDemoMode,
  enableDemoMode,
  disableDemoMode,
  toggleDemoMode,
  getDemoModeState,
  getMockResponse,
  DEMO_BANNER_STYLES,
};
