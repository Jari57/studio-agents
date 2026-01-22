import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Zap, Music, Crown, Users, Globe, Target, Rocket, Shield, X, Play, TrendingUp, Clock, DollarSign, Headphones, Star, ChevronRight, Layers, BarChart3, Briefcase, Award, ExternalLink, Settings, Code, Cpu, Lightbulb, CheckCircle, AlertCircle, FileText, Lock, LayoutGrid, Image as ImageIcon, Disc } from 'lucide-react';
import { AGENTS } from '../constants';
import { auth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from '../firebase';
import MultiAgentDemo from './MultiAgentDemo';

// Comprehensive Agent Whitepaper Data
const AGENT_WHITEPAPER = {
  'ghost': {
    fullName: 'Ghostwriter AI',
    version: '3.2.1',
    releaseDate: 'October 2024',
    tagline: 'Your AI Co-Writer for Every Genre',
    overview: 'Ghostwriter is Studio Agents\' flagship lyric generation engine, designed to function as an always-available, infinitely patient songwriting partner. Built on a proprietary Large Language Model (LLM) fine-tuned on millions of professionally written songs, it understands not just words—but rhythm, cadence, and emotional resonance.',
    problemSolved: 'Writer\'s block costs artists an estimated 40% of their creative time. Traditional co-writing sessions are expensive ($500-2000/session) and require scheduling coordination. Ghostwriter eliminates both barriers, providing instant, unlimited lyrical ideation.',
    technicalStack: ['Google Gemini Pro (Base LLM)', 'Custom Rhyme Scheme Analyzer', 'Syllable-Flow Mapping Engine', 'Genre-Specific Vocabulary Models', 'Sentiment & Emotion Classifier'],
    keyFeatures: [
      { name: 'Multi-Genre Fluency', desc: 'Trained on 50+ genres from Hip-Hop to Country, K-Pop to Death Metal' },
      { name: 'Flow Mapping', desc: 'Visualizes syllable placement for precise rhythmic delivery' },
      { name: 'Reference Artist Mode', desc: 'Mimics the stylistic patterns of legendary writers (Jay-Z, Taylor Swift, etc.)' },
      { name: 'Rhyme Density Control', desc: 'Adjust from simple AABB to complex internal rhyme schemes' },
      { name: 'Metaphor Generator', desc: 'Creates unique, non-cliché metaphors based on your theme' }
    ],
    whenToUse: [
      'You have a melody but no words',
      'You\'re stuck on a specific verse or bridge',
      'You need 10 hook options in 10 minutes',
      'You want to explore a genre you\'re unfamiliar with',
      'You need lyrics for a client project on a deadline'
    ],
    whenNotToUse: [
      'You need lyrics for commercial sync (check licensing)',
      'You want 100% human-written for purist projects',
      'The song requires highly personal autobiographical content'
    ],
    workflowIntegration: 'Inject Ghostwriter at the ideation phase. Use it to generate 5-10 concept directions, then refine your favorite with iterative prompts. Export the final lyrics with Flow Map to your DAW for recording.',
    examplePrompts: [
      '"Write a 16-bar verse about losing a friend to success, in the style of 90s East Coast hip-hop. Use internal rhymes and vivid street imagery."',
      '"Create 5 hook options for a summer pop anthem about first love. Keep it radio-friendly and catchy."',
      '"Generate a melancholic bridge about missed opportunities for an indie folk song. Use nature metaphors."'
    ],
    outputFormats: ['Plain Text', 'Flow Map (PDF)', 'Teleprompter Mode', 'DAW Marker Export'],
    limitations: ['Cannot generate audio/vocals', 'May occasionally produce clichés (use Refine)', 'Reference Artist mode is stylistic, not impersonation'],
    pricing: 'Included in all paid plans. Free tier: 10 generations/month.',
    successMetrics: '94% user satisfaction | Avg. 3.2 refinements per final lyric | 12M+ lyrics generated'
  },
  'beat': {
    fullName: 'Beat Lab Pro',
    version: '2.8.0',
    releaseDate: 'November 2024',
    tagline: 'Production Ideas at the Speed of Thought',
    overview: 'Beat Lab is your AI production assistant, combining algorithmic composition with a curated sample library. It generates drum patterns, chord progressions, and melodic ideas that are musically coherent and genre-appropriate.',
    problemSolved: 'Producers spend 60% of their time on ideation and sound selection. Beat Lab compresses this phase by providing instant, theory-correct musical foundations—freeing you to focus on arrangement and mixing.',
    technicalStack: ['Markov Chain Pattern Generator', 'Music Theory Logic Engine', 'Sample Metadata AI', 'BPM & Key Detection', 'MIDI Export Pipeline'],
    keyFeatures: [
      { name: 'Genre-Locked Generation', desc: 'Patterns guaranteed to fit Hip-Hop, EDM, Pop, R&B, and more' },
      { name: 'Chord Progression Logic', desc: 'Follows harmonic rules while allowing creative tension' },
      { name: 'Sample Sourcing', desc: 'Suggests royalty-free samples that match your vibe' },
      { name: 'MIDI Export', desc: 'Drag patterns directly into any DAW' },
      { name: 'Variation Engine', desc: 'Auto-generates B-sections and fills' }
    ],
    whenToUse: [
      'Starting a new beat from scratch',
      'You need a chord progression that "works"',
      'You want drum pattern inspiration',
      'You\'re producing in an unfamiliar genre',
      'You need 20 beat ideas for a sample pack'
    ],
    whenNotToUse: [
      'You need a fully mixed beat (use full DAW)',
      'You want to play everything live',
      'You need audio stems (use Beat Architect)'
    ],
    workflowIntegration: 'Use Beat Lab at project start. Generate a foundation (drums + chords), export MIDI, then build your arrangement in your DAW. Return to Beat Lab for variations.',
    examplePrompts: [
      '"Generate a dark trap drum pattern at 140 BPM with minimal hi-hat rolls"',
      '"Suggest a jazz-infused chord progression in F minor for a lo-fi beat"',
      '"Create a reggaeton drum pattern with a modern dembow rhythm"'
    ],
    outputFormats: ['MIDI Files', 'Pattern Preview (Audio)', 'Sample Pack Links', 'Theory Analysis PDF'],
    limitations: ['Patterns are MIDI only (no audio)', 'Complex polyrhythms may need manual editing', 'Sample suggestions are external links'],
    pricing: 'Included in all paid plans. Free tier: 5 patterns/month.',
    successMetrics: '89% export-to-DAW rate | 4.8M patterns generated | Avg. session: 12 minutes'
  },
  'album': {
    fullName: 'Album Artist AI',
    version: '4.0.0',
    releaseDate: 'December 2024',
    tagline: 'Your Visual Identity, Perfected',
    overview: 'Album Artist transforms your musical vision into stunning visual art. Powered by Imagen 3, Google\'s most advanced image generation model, it creates cover art, social media kits, and brand assets that are platform-optimized and print-ready.',
    problemSolved: 'Professional cover art costs $200-2000 and takes 2-4 weeks. Album Artist delivers unlimited, high-quality artwork in minutes—ensuring every single, EP, and album looks major-label quality.',
    technicalStack: ['Imagen 3 (Google)', 'Resolution Upscaler', 'Platform Optimizer', 'Typography Engine', 'Color Palette Extractor'],
    keyFeatures: [
      { name: 'Multi-Style Generation', desc: 'From photorealistic to abstract, anime to oil painting' },
      { name: 'Social Kit Export', desc: 'Pre-sized assets for Spotify, Instagram, YouTube, TikTok' },
      { name: 'Typography Integration', desc: 'Add artist name and title with curated fonts' },
      { name: 'Brand Palette', desc: 'Extract and apply consistent colors across all assets' },
      { name: 'Print-Ready Export', desc: '300 DPI output for physical merch and vinyl' }
    ],
    whenToUse: [
      'You need cover art for a new release',
      'You want a consistent visual brand',
      'You need social media graphics fast',
      'You\'re designing merch',
      'You want to visualize your album concept'
    ],
    whenNotToUse: [
      'You need photography of yourself (use a photographer)',
      'You want hand-drawn illustration style (commission an artist)',
      'Legal requires specific image licensing'
    ],
    workflowIntegration: 'Generate art after your music is mixed. Use the "Mood" from your track as the prompt foundation. Export Social Kit before release day.',
    examplePrompts: [
      '"A cyberpunk cityscape at night, neon purple and cyan, cinematic lighting, for a synthwave album"',
      '"Minimalist abstract shapes in warm earth tones for an indie folk EP, modern and clean"',
      '"Dark surrealist portrait with glitch effects for a trap single, high contrast"'
    ],
    outputFormats: ['3000x3000 Cover (Spotify/Apple)', 'Social Kit (IG, YT, TikTok)', 'Print-Ready (300 DPI)', 'Brand Board PDF'],
    limitations: ['Cannot generate real human faces (AI policy)', 'Text rendering may need refinement', 'Complex logos should be vector (use external)'],
    pricing: 'Included in all paid plans. Free tier: 3 covers/month.',
    successMetrics: '97% Spotify acceptance rate | 2.1M covers generated | Avg. 4 variations per final'
  },
  'video-creator': {
    fullName: 'Video Creator (Veo 3)',
    version: '1.5.0 BETA',
    releaseDate: 'December 2024',
    tagline: 'Cinematic AI Video for Music',
    overview: 'Video Creator harnesses Veo 3, Google\'s revolutionary video generation model, to create music videos, visualizers, and cinematic content. Describe a scene and watch it come to life.',
    problemSolved: 'Music videos cost $5,000-500,000 and require crews, locations, and weeks of production. Video Creator enables any artist to visualize their music with cinematic quality in minutes.',
    technicalStack: ['Veo 3 (Google DeepMind)', 'Audio-Video Sync Engine', 'Style Transfer Pipeline', 'Motion Interpolation', '4K Upscaler'],
    keyFeatures: [
      { name: 'Scene Generation', desc: 'Create any scene from text description' },
      { name: 'Music Sync', desc: 'Upload audio to sync visuals to beat' },
      { name: 'Style Transfer', desc: 'Apply cinematic looks (Film Noir, Anime, etc.)' },
      { name: 'Camera Control', desc: 'Specify drone shots, close-ups, tracking' },
      { name: 'Loop Mode', desc: 'Perfect for visualizers and social content' }
    ],
    whenToUse: [
      'You need a music video but have no budget',
      'You want visualizers for streaming platforms',
      'You need social content (TikTok, Reels)',
      'You\'re creating a visual album',
      'You want to pitch a video concept to a director'
    ],
    whenNotToUse: [
      'You need footage of yourself (film it)',
      'You require broadcast-quality output (use post-production)',
      'Complex narrative with dialogue'
    ],
    workflowIntegration: 'Use after music is mastered. Upload audio, describe scenes for each section, generate clips, then edit together in your video editor.',
    examplePrompts: [
      '"A slow-motion shot of rain falling on a city street at night, neon reflections, cinematic, melancholic"',
      '"Drone shot flying over a desert at golden hour, vast and empty, epic scale"',
      '"Abstract liquid metal morphing in sync with bass drops, chrome and purple"'
    ],
    outputFormats: ['1080p MP4', '4K MP4 (Pro)', 'Loop GIF', 'Vertical (9:16)'],
    limitations: ['BETA - occasional artifacts', 'Max 30 seconds per generation', 'Human faces may be inconsistent'],
    pricing: 'Pro plan only during beta. 5 videos/month included.',
    successMetrics: 'BETA | 340K videos generated | 78% user satisfaction (improving)'
  },
  'master': {
    fullName: 'Mastering Lab AI',
    version: '3.0.0',
    releaseDate: 'September 2024',
    tagline: 'Major Label Sound, Indie Budget',
    overview: 'Mastering Lab applies professional-grade audio mastering using neural networks trained by Grammy-winning engineers. It analyzes your mix and applies precise EQ, compression, limiting, and stereo enhancement.',
    problemSolved: 'Professional mastering costs $50-500 per track and requires 3-5 day turnaround. Mastering Lab delivers studio-quality masters in under 60 seconds, with unlimited revisions.',
    technicalStack: ['Neural Mastering Network', 'LUFS Analyzer', 'Spectral EQ AI', 'Stereo Imaging Engine', 'Multi-Format Encoder'],
    keyFeatures: [
      { name: 'Platform Presets', desc: 'Optimized for Spotify, Apple, YouTube, Vinyl' },
      { name: 'Reference Matching', desc: 'Match the sonic profile of a reference track' },
      { name: 'A/B Testing', desc: 'Compare original vs. master in real-time' },
      { name: 'Stem Mastering', desc: 'Upload stems for more control (Pro)' },
      { name: 'Multi-Format Export', desc: 'WAV, FLAC, MP3, and platform-specific' }
    ],
    whenToUse: [
      'Your mix is done and ready for release',
      'You need a quick master for pitching',
      'You\'re releasing to streaming platforms',
      'You want to compare mastering options',
      'You\'re on a budget but need quality'
    ],
    whenNotToUse: [
      'Your mix has significant issues (fix in mix)',
      'You need analog warmth (hire a mastering engineer)',
      'Major label release (consider hybrid approach)'
    ],
    workflowIntegration: 'Use as the final step before distribution. Upload your mixdown (-6dB headroom), select platform, and download your master.',
    examplePrompts: [
      '"Master for Spotify, warm and punchy, reference: Drake - God\'s Plan"',
      '"Vinyl-ready master, preserve dynamics, add analog warmth"',
      '"Loud and aggressive master for EDM, maximize impact"'
    ],
    outputFormats: ['WAV 24-bit', 'WAV 16-bit', 'FLAC', 'MP3 320kbps', 'Platform-Specific'],
    limitations: ['Cannot fix bad mixes', 'Stem mastering requires Pro plan', 'Some genres may need manual tweaking'],
    pricing: 'Included in all paid plans. Free tier: 2 masters/month.',
    successMetrics: '92% Spotify loudness compliance | 1.8M tracks mastered | 4.7★ rating'
  },
  'trend': {
    fullName: 'Trend Hunter AI',
    version: '2.5.0',
    releaseDate: 'November 2024',
    tagline: 'Know What\'s Next Before Everyone Else',
    overview: 'Trend Hunter monitors social media, streaming platforms, and music charts in real-time to identify emerging trends, viral sounds, and optimal release timing.',
    problemSolved: 'Artists miss trend windows by 2-4 weeks because they lack data access. Trend Hunter surfaces insights that typically cost $10K+ from music intelligence firms.',
    technicalStack: ['Social Listening AI', 'Streaming Analytics API', 'Viral Prediction Model', 'Hashtag Analyzer', 'Release Timing Engine'],
    keyFeatures: [
      { name: 'Trend Radar', desc: 'Real-time visualization of emerging sounds' },
      { name: 'Viral Prediction', desc: 'AI scores tracks for viral potential' },
      { name: 'Release Timing', desc: 'Optimal day/time for your genre' },
      { name: 'Hashtag Strategy', desc: 'Which tags are gaining momentum' },
      { name: 'Competitor Analysis', desc: 'What\'s working for similar artists' }
    ],
    whenToUse: [
      'Planning your next single',
      'Deciding when to release',
      'Creating content for TikTok',
      'Understanding your competitive landscape',
      'Pitching to playlists'
    ],
    whenNotToUse: [
      'You don\'t care about commercial success',
      'Your genre is extremely niche',
      'You prefer artistic purity over trends'
    ],
    workflowIntegration: 'Check Trend Hunter before starting a new project to align with current momentum. Return before release to optimize timing.',
    examplePrompts: [
      '"What sounds are trending in Hip-Hop on TikTok this week?"',
      '"When is the best time to release an R&B single?"',
      '"What hashtags should I use for my indie rock release?"'
    ],
    outputFormats: ['Trend Report PDF', 'Release Calendar', 'Hashtag List', 'Competitor Dashboard'],
    limitations: ['Trends change rapidly', 'Not all genres have equal data', 'Predictions are probabilistic'],
    pricing: 'Included in all paid plans. Free tier: 1 report/month.',
    successMetrics: '73% trend prediction accuracy | 890K reports generated'
  },
  'social': {
    fullName: 'Social Pilot AI',
    version: '2.2.0',
    releaseDate: 'October 2024',
    tagline: 'Your 24/7 Social Media Manager',
    overview: 'Social Pilot creates, schedules, and optimizes social media content across all platforms. From captions to carousels, it keeps your audience engaged without burning you out.',
    problemSolved: 'Artists spend 15+ hours/week on social media, often with inconsistent results. Social Pilot reduces this to 2 hours/week while improving engagement.',
    technicalStack: ['Multi-Platform API', 'Caption Generator', 'Optimal Timing AI', 'Engagement Predictor', 'Hashtag Optimizer'],
    keyFeatures: [
      { name: 'Caption Generator', desc: 'Platform-optimized copy in your voice' },
      { name: 'Content Calendar', desc: 'Automated scheduling across platforms' },
      { name: 'Engagement Timing', desc: 'Post when your audience is active' },
      { name: 'Carousel Creator', desc: 'Multi-image posts for Instagram' },
      { name: 'Analytics Dashboard', desc: 'Track performance across platforms' }
    ],
    whenToUse: [
      'You need consistent social presence',
      'You\'re launching a new release',
      'You want to grow your following',
      'You\'re tired of writing captions',
      'You need a content strategy'
    ],
    whenNotToUse: [
      'You prefer spontaneous posting',
      'Your content is highly personal/reactive',
      'You have a dedicated social media team'
    ],
    workflowIntegration: 'Set up your release campaign in Social Pilot. Generate a month of content, schedule it, and monitor analytics.',
    examplePrompts: [
      '"Write 10 Instagram captions for my new single release"',
      '"Create a TikTok content strategy for the next month"',
      '"What are the best posting times for my R&B audience?"'
    ],
    outputFormats: ['Caption Library', 'Content Calendar', 'Carousel Templates', 'Analytics Report'],
    limitations: ['Cannot post automatically (requires approval)', 'TikTok video creation is separate', 'Engagement varies by account'],
    pricing: 'Included in all paid plans. Free tier: 5 posts/month.',
    successMetrics: '67% avg. engagement increase | 2.3M posts generated'
  },
  'collab': {
    fullName: 'Collab Connect AI',
    version: '1.8.0',
    releaseDate: 'November 2024',
    tagline: 'Find Your Perfect Creative Partner',
    overview: 'Collab Connect matches you with collaborators based on your sound, style, and goals. From producers to vocalists to engineers, find your next creative partner.',
    problemSolved: 'Finding the right collaborator takes weeks of networking and often results in mismatched creative visions. Collab Connect surfaces compatible artists instantly.',
    technicalStack: ['Artist Matching Algorithm', 'Sound Analysis AI', 'Goal Alignment Engine', 'Portfolio Analyzer', 'Communication Hub'],
    keyFeatures: [
      { name: 'Sound Matching', desc: 'Find artists whose style complements yours' },
      { name: 'Goal Alignment', desc: 'Match based on career objectives' },
      { name: 'Portfolio Review', desc: 'Preview their work before connecting' },
      { name: 'In-App Messaging', desc: 'Communicate without sharing personal info' },
      { name: 'Collab Contracts', desc: 'Built-in split sheet templates' }
    ],
    whenToUse: [
      'You need a feature artist',
      'You want a producer for your project',
      'You need a mixing/mastering engineer',
      'You want to expand your network',
      'You\'re looking for songwriting partners'
    ],
    whenNotToUse: [
      'You prefer working alone',
      'You have an established network',
      'You need a specific named artist'
    ],
    workflowIntegration: 'Upload your work to create your profile. Browse matches, connect, and use built-in tools to manage the collaboration.',
    examplePrompts: [
      '"Find producers who make dark trap beats in Atlanta"',
      '"Match me with female vocalists for R&B features"',
      '"Show me mixing engineers who specialize in Hip-Hop"'
    ],
    outputFormats: ['Match List', 'Artist Profiles', 'Split Sheet Template', 'Collaboration Dashboard'],
    limitations: ['Depends on user base in your genre/location', 'Cannot guarantee response rates', 'Quality varies by user'],
    pricing: 'Included in all paid plans. Free tier: 3 matches/month.',
    successMetrics: '12K+ collaborations formed | 84% match satisfaction'
  },
  'release': {
    fullName: 'Release Manager AI',
    version: '2.0.0',
    releaseDate: 'December 2024',
    tagline: 'Your Personal A&R Team',
    overview: 'Release Manager orchestrates your entire release campaign—from metadata to marketing timeline to playlist pitching. It\'s the A&R department in your pocket.',
    problemSolved: 'Independent artists miss critical release steps, resulting in poor discoverability and wasted marketing spend. Release Manager ensures nothing falls through the cracks.',
    technicalStack: ['Release Timeline Engine', 'Metadata Optimizer', 'Playlist Pitch Generator', 'Marketing Calendar AI', 'Analytics Integration'],
    keyFeatures: [
      { name: 'Release Timeline', desc: 'Countdown with daily tasks' },
      { name: 'Metadata Optimization', desc: 'Perfect your song info for discovery' },
      { name: 'Playlist Pitch', desc: 'AI-written pitches for Spotify curators' },
      { name: 'Marketing Calendar', desc: 'Coordinated social, PR, and paid' },
      { name: 'Post-Release Analysis', desc: 'Track performance vs. goals' }
    ],
    whenToUse: [
      'You\'re releasing new music',
      'You want to maximize first-week streams',
      'You need a coordinated campaign',
      'You\'re pitching to playlists',
      'You want to learn release best practices'
    ],
    whenNotToUse: [
      'You have a label handling release',
      'You\'re releasing casually (no promo)',
      'You have a dedicated manager'
    ],
    workflowIntegration: 'Start Release Manager 4-6 weeks before release. Follow the daily tasks. Use generated assets and pitches across your campaign.',
    examplePrompts: [
      '"Create a 6-week release campaign for my debut EP"',
      '"Write a Spotify playlist pitch for my new single"',
      '"What should I post the week before release?"'
    ],
    outputFormats: ['Release Timeline', 'Playlist Pitch Docs', 'Marketing Calendar', 'Post-Release Report'],
    limitations: ['Cannot submit to DSPs (use distributor)', 'Playlist placement not guaranteed', 'Requires your active participation'],
    pricing: 'Included in all paid plans. Free tier: 1 release/month.',
    successMetrics: '340% avg. first-week stream increase | 45K releases managed'
  }
};

// Default whitepaper for agents without detailed data
const DEFAULT_WHITEPAPER = {
  version: '1.0.0',
  releaseDate: 'December 2024',
  tagline: 'AI-Powered Music Creation',
  overview: 'This agent is part of Studio Agents\' comprehensive AI toolkit for music creation and career development.',
  problemSolved: 'Reduces time and cost while improving quality of music production workflows.',
  technicalStack: ['Google Gemini', 'Custom ML Models', 'Cloud Processing'],
  keyFeatures: [],
  whenToUse: ['When you need AI assistance for this task'],
  whenNotToUse: ['When manual control is required'],
  workflowIntegration: 'Integrate at the appropriate stage of your music production workflow.',
  examplePrompts: ['Describe your needs and the AI will assist'],
  outputFormats: ['Digital Export'],
  limitations: ['See agent-specific documentation'],
  pricing: 'Included in paid plans.',
  successMetrics: 'High user satisfaction'
};

export default function LandingPage({ onEnter, onSubscribe, onStartTour: _onStartTour }) {
  console.log("LandingPage: Rendering...");
  const [scrolled, setScrolled] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const [showMarketing, setShowMarketing] = useState(false);
  const [showInvestorPitch, setShowInvestorPitch] = useState(false);
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // Store what to do after auth
  const [isTransitioning, setIsTransitioning] = useState(false); // Guard against race conditions
  
  // Handle Google Sign In - with transition guard
  const handleGoogleSignIn = async () => {
    if (isTransitioning || authLoading) return;
    
    setAuthLoading(true);
    setAuthError('');
    try {
      // Store pending action in sessionStorage so it survives redirect
      sessionStorage.setItem('auth_pending_action', pendingAction || 'start');
      console.log('[LandingPage] Storing pending action:', pendingAction);
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      // Redirect to Google - will return to this page after auth
      await signInWithRedirect(auth, provider);
      // Note: Code after signInWithRedirect won't execute because page redirects
    } catch (error) {
      console.error('[LandingPage] Google sign in error:', error);
      setAuthError(error.message || 'Failed to sign in. Please try again.');
      setAuthLoading(false);
    }
  };
  
  // Handle CTA button clicks - show auth modal (with guard)
  const handleCtaClick = (action = 'start') => {
    if (isTransitioning) return; // Prevent clicks during transition
    setPendingAction(action);
    setShowAuthModal(true);
    setAuthError('');
  };
  
  // Skip auth and continue as guest - with transition guard
  const handleContinueAsGuest = () => {
    // Guard: prevent double-clicks and race conditions
    if (isTransitioning || authLoading) {
      console.log('[LandingPage] Blocked - already transitioning');
      return;
    }
    
    console.log('[LandingPage] Continue as guest clicked, pendingAction:', pendingAction);
    setIsTransitioning(true);
    setShowAuthModal(false);
    
    // Small delay to let modal close animation complete before navigation
    setTimeout(() => {
      if (pendingAction === 'start') {
        console.log('[LandingPage] Calling onEnter(true)');
        onEnter(true);
      } else {
        console.log('[LandingPage] Calling onEnter(false)');
        onEnter(false);
      }
      // Reset after navigation (in case user comes back)
      setIsTransitioning(false);
    }, 100);
  };
  const [pitchTab, setPitchTab] = useState('vision');
  const [showAgentWhitepaper, setShowAgentWhitepaper] = useState(false);
  const [selectedWhitepaperAgent, setSelectedWhitepaperAgent] = useState(null);
  const [whitepaperTab, setWhitepaperTab] = useState('overview');
  
  // Investor Pitch Access Control - Email-based validation
  const [investorAccessUnlocked, setInvestorAccessUnlocked] = useState(() => {
    // Check if already unlocked in this session
    return sessionStorage.getItem('investor_access_unlocked') === 'true';
  });
  const [investorEmail, setInvestorEmail] = useState('');
  const [investorName, setInvestorName] = useState('');
  const [investorFirm, setInvestorFirm] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessPending, setAccessPending] = useState(false);
  
  // Detect local development environment
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // Backend API for investor access validation
  const INVESTOR_API_URL = isLocal 
    ? 'http://localhost:3000/api/investor-access'
    : 'https://studio-agents-backend-production.up.railway.app/api/investor-access';
  
  const handleInvestorAccessSubmit = async () => {
    const email = investorEmail.trim().toLowerCase();
    const name = investorName.trim();
    const firm = investorFirm.trim();
    
    // Basic validation
    if (!email || !name) {
      setAccessError('Please enter your name and email address.');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAccessError('Please enter a valid email address.');
      return;
    }
    
    setAccessLoading(true);
    setAccessError('');
    
    try {
      const response = await fetch(`${INVESTOR_API_URL}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, firm })
      });
      
      const data = await response.json();
      
      if (data.success && data.approved) {
        // Access granted - email is on approved list
        setInvestorAccessUnlocked(true);
        sessionStorage.setItem('investor_access_unlocked', 'true');
        sessionStorage.setItem('investor_email', email);
        setInvestorEmail('');
        setInvestorName('');
        setInvestorFirm('');
      } else if (data.success && !data.approved) {
        // Access request submitted - pending review
        setAccessPending(true);
        setAccessError('');
      } else {
        setAccessError(data.message || 'Unable to verify access. Please try again.');
      }
    } catch (err) {
      console.error('Investor access error:', err);
      setAccessError('Connection error. Please try again or contact founders@studioagents.ai');
    } finally {
      setAccessLoading(false);
    }
  };
  
  // Protected tabs that require access code
  const PROTECTED_TABS = ['traction', 'roadmap', 'financials'];

  // Open agent whitepaper
  const openAgentWhitepaper = (agent) => {
    setSelectedWhitepaperAgent(agent);
    setWhitepaperTab('overview');
    setShowAgentWhitepaper(true);
  };

  // Get whitepaper data for an agent
  const getWhitepaperData = (agentId) => {
    return AGENT_WHITEPAPER[agentId] || DEFAULT_WHITEPAPER;
  };

  // Check for redirect result on mount (handle Google sign-in redirect)
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log('[LandingPage] Auth redirect successful, user:', result.user.email);
          
          // Retrieve pending action from sessionStorage
          const storedAction = sessionStorage.getItem('auth_pending_action');
          console.log('[LandingPage] Retrieved pending action:', storedAction);
          sessionStorage.removeItem('auth_pending_action'); // Clean up
          
          setIsTransitioning(true);
          setShowAuthModal(false);
          
          // Navigate user to studio (true = show agents)
          setTimeout(() => {
            onEnter(true); // Always go to agents page after successful login
            setIsTransitioning(false);
          }, 100);
        }
      } catch (error) {
        console.error('[LandingPage] Redirect result error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
          setAuthError('Sign-in cancelled. Please try again.');
        } else {
          setAuthError(error.message || 'Failed to sign in. Please try again.');
        }
      }
    };
    
    checkRedirectResult();
  }, []); // Run once on mount

  // Manage body scroll lock when ANY modal is open
  useEffect(() => {
    const anyModalOpen = showAgentWhitepaper || showAuthModal || showPrivacy || 
                         showTerms || showShowcase || showMarketing || showInvestorPitch;
    
    if (anyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showAgentWhitepaper, showAuthModal, showPrivacy, showTerms, showShowcase, showMarketing, showInvestorPitch]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Check for cookie consent
    const consent = localStorage.getItem('studio_cookie_consent');
    if (!consent) {
      setShowCookieConsent(true);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('studio_cookie_consent', 'true');
    setShowCookieConsent(false);
  };

  return (
    <div className="landing-container">
      {/* Native-style Mobile Header */}
      <header className={`native-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <div className="header-logo">
            <Sparkles size={24} className="text-purple" />
            <span className="header-title">Studio Agents</span>
          </div>
        </div>
      </header>

      {/* Stars background */}
      <div className="stars-overlay"></div>

      {/* Hero Section - Punchy & Mobile-Native */}
      <section className="hero-section">
        <div className="hero-glow"></div>

        <div className="hero-content-wrapper">
          {/* Logo/Icon */}
          <div className="logo-container">
            <div className="logo-box studio-logo-large animate-float">
              <Sparkles size={64} color="white" />
            </div>
          </div>

          {/* Main Title - Short & Punchy */}
          <h1 className="hero-title" style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
            fontWeight: '900',
            lineHeight: '1.1',
            marginBottom: '24px',
            letterSpacing: '-0.02em'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
              animation: 'gradient-shift 3s ease infinite',
              backgroundSize: '200% 200%'
            }}>
              YOUR LABEL.
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
              animation: 'gradient-shift 3s ease infinite 0.5s',
              backgroundSize: '200% 200%'
            }}>
              YOUR POCKET.
            </span>
          </h1>

          {/* Subtitle - Value Prop */}
          <p className="hero-subtitle" style={{ 
            maxWidth: '400px', 
            margin: '0 auto 20px',
            fontSize: '1.1rem',
            fontWeight: '500',
            lineHeight: '1.6'
          }}>
            <span style={{ 
              color: '#fff',
              fontSize: '1.2em',
              fontWeight: '600'
            }}>
              16 AI agents. One studio. Zero gatekeepers.
            </span>
            <br />
            <span style={{ 
              fontSize: '0.9em', 
              color: 'rgba(255,255,255,0.7)',
              fontStyle: 'italic'
            }}>
              Drop tracks in hours, not months.
            </span>
          </p>

          {/* Trust Badges - Hard Stats */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <div className="stat-badge">
              <Star size={14} style={{ color: '#FFD700' }} />
              <span><strong>4.9</strong> App Store</span>
            </div>
            <div className="stat-badge">
              <Users size={14} style={{ color: 'var(--color-cyan)' }} />
              <span><strong>127K</strong> Artists</span>
            </div>
          </div>

          {/* CTA Buttons - Simplified */}
          <div className="hero-cta-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '400px' }}>
            
            <button
              onClick={() => handleCtaClick('start')}
              className="cta-button-primary haptic-press"
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '18px 24px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '1.1rem',
                fontWeight: '700'
              }}
            >
              <Zap size={20} />
              Start Free
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => onEnter(false, false, 'resources')}
              className="glass-button haptic-press"
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '14px 24px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>See What's Possible →</span>
            </button>

          </div>

          {/* ═══════════════════════════════════════════════════════════════
              WORKFLOW CARDS CONTAINER - Wider on Desktop
              ═══════════════════════════════════════════════════════════════ */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px', 
            width: '100%', 
            maxWidth: '600px',
            marginTop: '24px'
          }}>

            {/* ═══════════════════════════════════════════════════════════════
                STUDIO WORKFLOW CARD - Premium Design with 3-Step Process
                ═══════════════════════════════════════════════════════════════ */}
            <div 
              className="haptic-press" 
              style={{ 
                width: '100%', 
                padding: '0',
                background: 'linear-gradient(145deg, #8b5cf6 0%, #7c3aed 50%, #06b6d4 100%)',
                boxShadow: '0 20px 60px rgba(139, 92, 246, 0.4), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '28px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                position: 'relative'
              }}
              onClick={() => onEnter(false, false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 32px 80px rgba(139, 92, 246, 0.5), 0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(139, 92, 246, 0.4), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
            >
              {/* Decorative gradient overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '100%',
                background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.15) 0%, transparent 50%)',
                pointerEvents: 'none'
              }} />
              
              {/* Header Section */}
              <div style={{ padding: '32px 32px 24px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    backdropFilter: 'blur(10px)',
                    padding: '14px', 
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <LayoutGrid size={28} color="white" />
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'white',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    Manual Control
                  </div>
                </div>
                
                <h3 style={{ 
                  fontWeight: '900', 
                  fontSize: '1.5rem', 
                  color: 'white', 
                  letterSpacing: '-0.5px', 
                  marginBottom: '10px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  Studio Workflow
                </h3>
                <p style={{ 
                  fontSize: '0.95rem', 
                  opacity: 0.9, 
                  fontWeight: '500', 
                  color: 'white', 
                  lineHeight: '1.6',
                  maxWidth: '320px'
                }}>
                  Full creative control. Hand-pick your agents and craft your vision step by step.
                </p>
              </div>
              
              {/* Steps Section */}
              <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                backdropFilter: 'blur(20px)',
                padding: '24px 32px 28px',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                {/* Step 1 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    color: 'white',
                    flexShrink: 0
                  }}>1</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white', marginBottom: '4px' }}>Define Your Vision</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, color: 'white', lineHeight: '1.5' }}>
                      Use the Project Wizard to name your masterpiece and select your studio vibe.
                    </div>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    color: 'white',
                    flexShrink: 0
                  }}>2</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white', marginBottom: '4px' }}>Assemble Your Team</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, color: 'white', lineHeight: '1.5' }}>
                      Choose from 16 specialized AI agents for lyrics, beats, and production.
                    </div>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    color: 'white',
                    flexShrink: 0
                  }}>3</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white', marginBottom: '4px' }}>Launch & Amplify</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, color: 'white', lineHeight: '1.5' }}>
                      Use Marketing agents to build your rollout plan and sync socials.
                    </div>
                  </div>
                </div>
              </div>
              
              {/* CTA Footer */}
              <div style={{ 
                padding: '20px 32px',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white' }}>Enter Studio</span>
                <div style={{
                  background: 'white',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArrowRight size={18} color="#8b5cf6" />
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                AI PRODUCTION PIPELINE CARD - Premium Glassmorphism Design
                ═══════════════════════════════════════════════════════════════ */}
            <div 
              className="haptic-press" 
              style={{ 
                width: '100%', 
                padding: '0',
                background: 'linear-gradient(145deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', 
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: '28px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                position: 'relative',
                backdropFilter: 'blur(20px)'
              }}
              onClick={() => onEnter(false, true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.6)';
                e.currentTarget.style.boxShadow = '0 32px 80px rgba(6, 182, 212, 0.25), 0 0 60px rgba(6, 182, 212, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.25)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Animated gradient background */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'conic-gradient(from 180deg, transparent, rgba(6, 182, 212, 0.1), transparent 30%)',
                animation: 'spin 8s linear infinite',
                pointerEvents: 'none',
                opacity: 0.5
              }} />
              
              {/* Header Section */}
              <div style={{ padding: '32px 32px 24px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3))', 
                    backdropFilter: 'blur(10px)',
                    padding: '14px', 
                    borderRadius: '16px',
                    border: '1px solid rgba(6, 182, 212, 0.2)'
                  }}>
                    <Zap size={28} color="#06b6d4" />
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))',
                    backdropFilter: 'blur(10px)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#06b6d4',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(6, 182, 212, 0.2)'
                  }}>
                    Automated
                  </div>
                </div>
                
                <h3 style={{ 
                  fontWeight: '900', 
                  fontSize: '1.5rem', 
                  color: 'white', 
                  letterSpacing: '-0.5px', 
                  marginBottom: '10px'
                }}>
                  AI Production Pipeline
                </h3>
                <p style={{ 
                  fontSize: '0.95rem', 
                  opacity: 0.75, 
                  fontWeight: '500', 
                  color: 'white', 
                  lineHeight: '1.6',
                  maxWidth: '340px'
                }}>
                  Transform a single idea into a complete release package. Our multi-agent orchestrator handles lyrics, beats, visuals, and marketing in one automated flow.
                </p>
              </div>
              
              {/* Stats Section */}
              <div style={{ 
                padding: '24px 32px',
                background: 'rgba(6, 182, 212, 0.05)',
                borderTop: '1px solid rgba(6, 182, 212, 0.15)',
                borderBottom: '1px solid rgba(6, 182, 212, 0.15)',
                display: 'flex',
                gap: '24px'
              }}>
                {/* Stat 1 */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '4px'
                  }}>4</div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>Agents</div>
                </div>
                
                {/* Divider */}
                <div style={{
                  width: '1px',
                  background: 'linear-gradient(to bottom, transparent, rgba(6, 182, 212, 0.3), transparent)'
                }} />
                
                {/* Stat 2 */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '4px'
                  }}>1-Click</div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>Workflow</div>
                </div>
              </div>
              
              {/* CTA Footer */}
              <div style={{ 
                padding: '20px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#06b6d4' }}>Launch Pipeline</span>
                <div style={{
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)'
                }}>
                  <Rocket size={18} color="white" />
                </div>
              </div>
            </div>

          </div>

          {/* Quick Value Props */}
          <div className="hero-features-list" style={{ marginTop: '20px' }}>
            <div className="feature-pill haptic-press">
              <Clock size={16} className="text-cyan" />
              <span>2min Setup</span>
            </div>
            <div className="feature-pill haptic-press">
              <Crown size={16} className="text-purple" />
              <span>No Credit Card</span>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="scroll-indicator">
            <div className="scroll-text">Explore the future</div>
            <div className="scroll-dot"></div>
          </div>
        </div>
      </section>

      {/* THE PITCH - Problem/Solution Section */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ 
              fontSize: 'clamp(1.8rem, 6vw, 3rem)',
              fontWeight: '900',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              The Indie Artist's Trap
            </h2>
            <p style={{ 
              fontSize: 'clamp(1rem, 3vw, 1.2rem)', 
              color: 'rgba(255,255,255,0.8)',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              Without a label, the costs add up fast—and 99% never break even.
            </p>
          </div>

          {/* The Problem - Cost Breakdown */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '20px',
            marginBottom: '60px'
          }}>
            {[
              { item: 'Producer', cost: '$500–5K/beat', icon: Music },
              { item: 'Designer', cost: '$200–1K/artwork', icon: ImageIcon },
              { item: 'Marketing', cost: '$1K+/campaign', icon: TrendingUp },
              { item: 'Mastering', cost: '$100–500/track', icon: Disc }
            ].map((service, i) => (
              <div key={i} style={{
                padding: '24px',
                background: 'rgba(239, 68, 68, 0.08)',
                borderRadius: '16px',
                border: '2px solid rgba(239, 68, 68, 0.2)',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
              }}>
                <service.icon size={32} style={{ color: '#ef4444', marginBottom: '12px' }} />
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: 'white',
                  marginBottom: '8px'
                }}>
                  {service.item}
                </div>
                <div style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '800', 
                  color: '#ef4444'
                }}>
                  {service.cost}
                </div>
              </div>
            ))}
          </div>

          {/* Divider with Arrow */}
          <div style={{ 
            textAlign: 'center', 
            margin: '40px 0',
            position: 'relative'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
              borderRadius: '50px',
              fontSize: '0.9rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 8px 32px rgba(168, 85, 247, 0.3)'
            }}>
              The Solution ↓
            </div>
          </div>

          {/* The Solution - Agent Grid */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ 
              fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
              fontWeight: '900',
              textAlign: 'center',
              marginBottom: '40px',
              background: 'linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Your AI Record Label
            </h3>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '16px'
            }}>
              {[
                { name: '🎤 Ghostwriter', output: 'Lyrics & hooks' },
                { name: '🎹 Beat Architect', output: 'Instrumentals' },
                { name: '🎨 Album Artist', output: 'Cover art' },
                { name: '🎬 Video Creator', output: 'Music videos' },
                { name: '📱 Trend Analyzer', output: 'Viral content' },
                { name: '📊 Release Manager', output: 'Release strategy' }
              ].map((agent, i) => (
                <div key={i} style={{
                  padding: '20px',
                  background: 'linear-gradient(145deg, rgba(34, 197, 94, 0.1), rgba(6, 182, 212, 0.05))',
                  borderRadius: '12px',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)';
                }}>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '700', 
                    color: 'white',
                    marginBottom: '6px'
                  }}>
                    {agent.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    {agent.output}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              textAlign: 'center', 
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(168, 85, 247, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(168, 85, 247, 0.2)'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'white' }}>
                +10 more specialized agents
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                Orchestrate 4 agents at once → Full release package in minutes
              </div>
            </div>
          </div>

          {/* Value Prop CTA */}
          <div style={{ 
            textAlign: 'center',
            marginTop: '50px'
          }}>
            <button
              onClick={() => handleCtaClick('start')}
              className="haptic-press"
              style={{
                padding: '18px 48px',
                background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 12px 40px rgba(168, 85, 247, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 16px 50px rgba(168, 85, 247, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(168, 85, 247, 0.4)';
              }}
            >
              Start Creating For Free →
            </button>
            <div style={{ 
              marginTop: '16px',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              No credit card required • 3 free trials
            </div>
          </div>
        </div>
      </section>

      {/* Meet Your Dream Team - Agent Showcase */}
      <section className="agents-section">
        <div className="section-header">
          {/* Stacked Title - Like Hero */}
          <h2 className="section-title" style={{ 
            fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
            lineHeight: '1.2',
            marginBottom: '8px'
          }}>
            <span className="gradient-text-vibrant">
              MEET YOUR DREAM TEAM
            </span>
          </h2>
          <p style={{ 
            fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', 
            color: 'var(--text-primary)', 
            marginBottom: '4px',
            fontWeight: '500'
          }}>
            16 AI specialists. One studio.
          </p>
          <p style={{ 
            fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)', 
            color: 'var(--text-secondary)',
            marginBottom: '20px'
          }}>
            From lyrics to mastering—your team handles it all.
          </p>
          
          {/* Compact Stats Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            {[
              { value: '4', label: 'Free Agents' },
              { value: '24/7', label: 'Live' },
              { value: '∞', label: 'Creates' }
            ].map((stat, i) => (
              <div key={i} className="stat-badge" style={{ 
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{ fontWeight: '700', color: 'white' }}>{stat.value}</span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '4px', fontSize: '0.8rem' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="agents-studio-grid" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {AGENTS.filter(a => a.tier === 'free').map((agent, i) => {
            const Icon = agent.icon;
            const key = agent.id || agent.name;

            return (
              <div 
                key={key} 
                className={`agent-studio-card ${agent.colorClass} animate-fadeInUp haptic-press`}
                style={{ animationDelay: `${i * 0.1}s`, position: 'relative' }}
                onClick={() => handleCtaClick('agent')}
              >
                {/* Whitepaper Gear Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); openAgentWhitepaper(agent); }}
                  title="View Agent Whitepaper"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.5)';
                    e.currentTarget.style.transform = 'rotate(45deg) scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                  }}
                >
                  <Settings size={14} style={{ color: 'var(--color-purple)' }} />
                </button>
                
                <div className="agent-studio-icon">
                  <Icon size={24} />
                </div>
                <div className="agent-studio-info">
                  <h3>{agent.name}</h3>
                  <p>{agent.category}</p>
                </div>
                <button 
                  className="agent-launch-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCtaClick('agent');
                  }}
                >
                  Launch Agent
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="section-header">
          <div className="section-tag">Pricing</div>
          <h2 className="section-title">
            Simple, <span className="gradient-text-cyan-purple">Transparent Pricing</span>
          </h2>
        </div>

        <div className="pricing-grid-native">
          {[
            {
              name: 'Free',
              price: '$0',
              features: ['3 uses per agent', '10s audio output', 'Basic features', 'Session access']
            },
            {
              name: 'Creator',
              price: '$14.99',
              period: '/month',
              features: ['100 uses/month', '30s audio output', 'Save creations', 'Priority processing']
            },
            {
              name: 'Studio Pro',
              price: '$49.99',
              period: '/month',
              features: ['2,000 uses/month', '60s audio output', 'All Creator features', 'API access', 'Team collab', 'Analytics']
            },
            {
              name: '🔥 Early Bird Lifetime',
              price: '$49',
              period: 'one-time',
              features: ['Unlimited everything forever', 'Future updates included', 'Priority Support', 'Commercial License', 'Founder Badge'],
              popular: true,
              ltd: true,
              urgency: 'Limited to first 1000 users'
            },
            {
              name: 'Lifetime Access',
              price: '$99',
              period: 'one-time',
              features: ['Unlimited everything forever', 'Future updates included', 'Priority Support', 'Commercial License', 'Founder Badge'],
              strikethrough: '$49'
            }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`pricing-card-native ${plan.popular ? 'popular' : ''} ${plan.ltd ? 'ltd-card' : ''} haptic-press`}
            >
              {plan.popular && (
                <div className="popular-badge-native">
                  Most Popular
                </div>
              )}
              {plan.ltd && (
                <div className="ltd-badge-native">
                  Limited Time
                </div>
              )}
              {plan.urgency && (
                <div className="urgency-message-native">
                  {plan.urgency}
                </div>
              )}

              <div className="plan-header-native">
                <h3 className="plan-name-native">{plan.name}</h3>
                <div className="plan-price-box-native">
                  {plan.strikethrough && (
                    <span className="plan-strikethrough-native">{plan.strikethrough}</span>
                  )}
                  <span className="plan-price-native">{plan.price}</span>
                  {plan.period && <span className="plan-period-native">{plan.period}</span>}
                </div>
              </div>

              <ul className="plan-features-native">
                {plan.features.map((feature, i) => (
                  <li key={i} className="plan-feature-item-native">
                    <div className="feature-check-native">
                      <Zap size={12} />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`plan-button-native ${plan.popular ? 'primary' : 'secondary'}`}
                onClick={() => onSubscribe && onSubscribe(plan)}
              >
                {plan.ltd ? 'Get Lifetime Access' : 'Start Free Trial'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Live Demo Section - Multi-Agent Demo */}
      <section className="demo-section" style={{ padding: '80px 20px', background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>
            Experience <span className="gradient-text-cyan-blue">Parallel Intelligence</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
            Watch our specialized agents work in sync to build your entire release package in seconds.
          </p>
        </div>
        
        <MultiAgentDemo />
        
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Ready to start creating?
          </p>
          <button 
            onClick={() => handleCtaClick('start')}
            className="cta-button-primary haptic-press"
            style={{ 
              padding: '18px 32px',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '1.1rem',
              fontWeight: '700'
            }}
          >
            <Zap size={20} />
            Start Free
            <ArrowRight size={18} />
          </button>
        </div>
        
        {/* Whip Montez Case Study - Below Demo */}
        <div style={{
          maxWidth: '600px',
          margin: '48px auto 0',
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.03) 0%, rgba(0, 255, 65, 0.01) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(0, 255, 65, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: 'rgba(0, 255, 65, 0.1)',
              border: '1px solid rgba(0, 255, 65, 0.25)',
              borderRadius: '8px',
              color: '#00ff41',
              fontSize: '0.65rem',
              fontWeight: '600',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              textTransform: 'uppercase'
            }}>
              🎵 Case Study
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px', color: 'white' }}>
              The Lost Tapes of <a href="https://whipmontez.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff41', textDecoration: 'underline' }}>Whip Montez</a>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
              We built Studio Agents by resurrecting the lost archives of a Brooklyn MC who vanished before the digital age.
            </p>
          </div>
          <button 
            onClick={() => setShowShowcase(true)}
            className="haptic-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              background: 'rgba(0, 255, 65, 0.1)',
              border: '1px solid rgba(0, 255, 65, 0.3)',
              borderRadius: '12px',
              color: '#00ff41',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Play size={16} />
            Enter The Archive
          </button>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="footer-cta">
        <h2 className="footer-cta-title">
          Ready to create something <span className="gradient-text-purple-pink">amazing?</span>
        </h2>
        <button
          onClick={() => handleCtaClick('start')}
          className="cta-button-premium haptic-press"
        >
          <span>Launch Studio Now</span>
          <ArrowRight size={24} />
        </button>
      </section>

      {/* Investor Pitch Button - Moved to bottom */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        padding: '24px 20px',
        background: 'rgba(0,0,0,0.3)'
      }}>
        <button
          onClick={() => setShowInvestorPitch(true)}
          className="glass-button haptic-press"
          style={{ 
            maxWidth: '400px',
            width: '100%', 
            justifyContent: 'center', 
            padding: '14px 24px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '16px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Briefcase size={16} />
          <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Investor Pitch Deck</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <Sparkles size={24} color="var(--color-purple)" />
            <span>STUDIO AGENTS AI</span>
          </div>
          <div className="footer-links">
            <button className="footer-link" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
            <span className="footer-divider">•</span>
            <button className="footer-link" onClick={() => setShowTerms(true)}>Terms of Service</button>
            <button className="footer-link" onClick={() => setShowShowcase(true)}>Restored OS Showcase</button>
          </div>
          <p>&copy; 2025 studioagentsai.com • Built for the next generation of creators.</p>
        </div>
      </footer>

      {/* Mobile Sticky Bottom CTA */}
      <div className="mobile-sticky-cta">
        <button onClick={() => handleCtaClick('start')} className="sticky-cta-btn haptic-press">
          <span>Launch Studio</span>
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Auth Modal - Sign In with Google or Email */}
      {showAuthModal && (
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 10001 }} onClick={() => setShowAuthModal(false)}>
          <div 
            className="auth-modal animate-scaleIn" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.98) 0%, rgba(10, 10, 20, 0.99) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              padding: '40px',
              maxWidth: '420px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}
          >
            <button 
              onClick={() => setShowAuthModal(false)} 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              <X size={18} />
            </button>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Zap size={32} style={{ color: 'white' }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', color: 'white' }}>
                Welcome to Studio Agents
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
                Sign in to unlock your AI music studio
              </p>
            </div>

            {authError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '20px',
                color: '#f87171',
                fontSize: '0.9rem'
              }}>
                {authError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'white',
                  color: '#1a1a1a',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: authLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  opacity: authLoading ? 0.7 : 1
                }}
                className="haptic-press"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {authLoading ? 'Signing in...' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                margin: '8px 0'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* Continue as Guest */}
              <button
                onClick={handleContinueAsGuest}
                disabled={authLoading}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease'
                }}
                className="haptic-press"
              >
                <Users size={18} />
                Continue as Guest
              </button>
            </div>

            <p style={{ 
              marginTop: '24px', 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.4)',
              lineHeight: '1.5'
            }}>
              By continuing, you agree to our <span style={{ color: 'var(--color-purple)', cursor: 'pointer' }} onClick={() => { setShowAuthModal(false); setShowTerms(true); }}>Terms of Service</span> and <span style={{ color: 'var(--color-purple)', cursor: 'pointer' }} onClick={() => { setShowAuthModal(false); setShowPrivacy(true); }}>Privacy Policy</span>
            </p>
          </div>
        </div>
      )}

      {/* Cookie Consent Banner */}
      {showCookieConsent && (
        <div className="cookie-banner animate-fadeInUp">
          <div className="cookie-content">
            <p>We use cookies to enhance your creative experience and analyze site traffic.</p>
            <div className="cookie-actions">
              <button className="btn-primary-sm" onClick={acceptCookies}>Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 10000 }}>
          <div className="legal-modal animate-scaleIn">
            <div className="modal-header">
              <h2>Privacy Policy</h2>
              <button className="modal-close" onClick={() => setShowPrivacy(false)}><X size={20} /></button>
            </div>
            <div className="modal-body legal-text">
              <h3>1. Information We Collect</h3>
              <p>We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or request customer support. This may include your name, email address, and payment information.</p>
              
              <h3>2. How We Use Your Information</h3>
              <p>We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect our company and our users. We also use this information to offer you tailored content – like giving you more relevant search results and ads.</p>
              
              <h3>3. Cookies & Tracking</h3>
              <p>We use cookies and similar technologies to collect information about your activity, browser, and device. This helps us remember your preferences and understand how you use our app.</p>
              
              <h3>4. Data Security</h3>
              <p>We work hard to protect Studio Agents AI and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold.</p>
              
              <h3>5. Contact Us</h3>
              <p>If you have any questions about this Privacy Policy, please contact us at support@studioagentsai.com.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowPrivacy(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTerms && (
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 10000 }}>
          <div className="legal-modal animate-scaleIn">
            <div className="modal-header">
              <h2>Terms of Service</h2>
              <button className="modal-close" onClick={() => setShowTerms(false)}><X size={20} /></button>
            </div>
            <div className="modal-body legal-text">
              <h3>1. Acceptance of Terms</h3>
              <p>By accessing or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the services.</p>
              
              <h3>2. Use of Services</h3>
              <p>You may use our services only as permitted by law, including applicable export and re-export control laws and regulations. We may suspend or stop providing our services to you if you do not comply with our terms or policies.</p>
              
              <h3>3. User Content</h3>
              <p>Our services allow you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the service, including its legality, reliability, and appropriateness.</p>
              
              <h3>4. AI Generated Content</h3>
              <p>Content generated by our AI agents is provided "as is". You own the rights to the content you generate, subject to our fair use policy and the terms of the underlying AI models.</p>
              
              <h3>5. Termination</h3>
              <p>We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowTerms(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Showcase Modal - The Whip Montez Story */}
      {showShowcase && (
        <div 
          className="modal-overlay animate-fadeIn" 
          style={{ zIndex: 10000, overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }}
          onClick={() => setShowShowcase(false)}
          onTouchEnd={(e) => { if (e.target === e.currentTarget) setShowShowcase(false); }}
        >
          <div 
            className="legal-modal animate-scaleIn" 
            style={{ 
              maxWidth: 'min(92vw, 700px)',
              width: '100%',
              margin: '1rem auto',
              background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
              border: '1px solid rgba(0, 255, 65, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(0, 255, 65, 0.2)' }}>
              <h2 style={{ color: '#00ff41', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={24} />
                RESTORED OS: The Lost Tapes
              </h2>
              <button className="modal-close" onClick={() => setShowShowcase(false)} onTouchEnd={(e) => { e.preventDefault(); setShowShowcase(false); }}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              {/* Hero Visual */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '28px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  height: '200px',
                  background: 'radial-gradient(circle, rgba(0, 255, 65, 0.2) 0%, transparent 70%)',
                  animation: 'pulse 3s infinite',
                  pointerEvents: 'none'
                }} />
                
                <div style={{ 
                  width: '100px', 
                  height: '100px', 
                  background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)', 
                  borderRadius: '50%', 
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(0, 255, 65, 0.4), 0 0 80px rgba(0, 255, 65, 0.2)',
                  position: 'relative'
                }}>
                  <Headphones size={48} color="black" />
                </div>
                
                <h3 style={{ 
                  color: '#00ff41', 
                  fontSize: '1.5rem', 
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px'
                }}>
                  WHIP MONTEZ
                </h3>
                <p style={{ 
                  color: 'rgba(0, 255, 65, 0.7)',
                  fontSize: '0.85rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase'
                }}>
                  Brooklyn, NY • 1999-2003
                </p>
              </div>

              {/* The Story */}
              <div style={{ 
                padding: '20px',
                background: 'rgba(0, 255, 65, 0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(0, 255, 65, 0.15)',
                marginBottom: '20px'
              }}>
                <h4 style={{ 
                  color: '#00ff41', 
                  fontSize: '0.8rem', 
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ width: '8px', height: '8px', background: '#00ff41', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                  The ARE Project
                </h4>
                
                <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '16px' }}>
                  In 2022, our team discovered a corrupted hard drive at an estate sale in Bed-Stuy. On it: 47 unreleased tracks, voice memos, and session files from an artist who called herself <strong style={{ color: '#00ff41' }}>Whip Montez</strong>.
                </p>
                
                <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '16px' }}>
                  She was a ghost. No social media. No streaming profiles. No Wikipedia. Just raw talent trapped on a dying 40GB drive from 2003. The music was fire, but the files were corrupted beyond repair.
                </p>
                
                <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7' }}>
                  So we built an <strong style={{ color: '#00ff41' }}>Alternative Reality Experience (ARE)</strong>—using AI to reconstruct what could have been. What if Whip had modern tools? What if she had Studio Agents?
                </p>
              </div>

              {/* What We Proved */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  color: 'white', 
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  marginBottom: '16px'
                }}>
                  What We Proved
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { icon: Music, title: '3 Lost Tapes Reconstructed', desc: 'Used Ghostwriter to complete fragmented lyrics and Beat Lab to rebuild production from corrupted stems.' },
                    { icon: Target, title: 'Y2K-Era Visual Identity', desc: 'Album Artist generated artwork that matched the aesthetic of 2001 Brooklyn hip-hop culture.' },
                    { icon: TrendingUp, title: '"What If" Career Trajectory', desc: 'Release Manager mapped a theoretical path from mixtapes to a major label deal by 2005.' },
                    { icon: Globe, title: 'Viral Documentary', desc: 'The ARE project generated 2.4M views and proved independent artists can build legacies with AI tools.' }
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(0, 255, 65, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <item.icon size={20} style={{ color: '#00ff41' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'white', fontSize: '0.95rem', marginBottom: '4px' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Point */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                textAlign: 'center'
              }}>
                <p style={{ 
                  color: 'white', 
                  fontSize: '1.1rem', 
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  If AI can resurrect a career from a broken hard drive...
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Imagine what it can do for yours.
                </p>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid rgba(0, 255, 65, 0.2)' }}>
              <button 
                className="cta-button-primary"
                onClick={() => { setShowShowcase(false); handleCtaClick('start'); }}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
                  color: 'black'
                }}
              >
                <Zap size={18} />
                Enter The Studio
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marketing Modal - The Full Pitch */}
      {showMarketing && (
        <div 
          className="modal-overlay animate-fadeIn" 
          style={{ zIndex: 10000, overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }}
          onClick={() => setShowMarketing(false)}
          onTouchEnd={(e) => { if (e.target === e.currentTarget) setShowMarketing(false); }}
        >
          <div 
            className="legal-modal animate-scaleIn" 
            style={{ 
              maxWidth: 'min(92vw, 700px)',
              width: '100%',
              margin: '1rem auto',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Rocket size={24} style={{ color: 'var(--color-purple)' }} />
                The Independent Artist's Edge
              </h2>
              <button className="modal-close" onClick={() => setShowMarketing(false)} onTouchEnd={(e) => { e.preventDefault(); setShowMarketing(false); }}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              {/* The Problem */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: 'white'
                }}>
                  The Old Way Is Broken
                </h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px' 
                }}>
                  {[
                    { stat: '$15,000', label: 'Avg cost to release an album', icon: DollarSign },
                    { stat: '6-12 months', label: 'Traditional timeline', icon: Clock },
                    { stat: '97%', label: 'Artists never recoup costs', icon: TrendingUp },
                    { stat: '40+ hours', label: 'Wasted on admin per release', icon: Target }
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: '16px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '14px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      textAlign: 'center'
                    }}>
                      <item.icon size={20} style={{ color: '#ef4444', marginBottom: '6px' }} />
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444' }}>
                        {item.stat}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Solution */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: 'white'
                }}>
                  The Studio Agents Way
                </h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px' 
                }}>
                  {[
                    { stat: '$60', label: 'Per year (lifetime $99)', icon: DollarSign },
                    { stat: '2 weeks', label: 'Average release cycle', icon: Clock },
                    { stat: '127K+', label: 'Active artists', icon: Users },
                    { stat: '847K', label: 'Songs created', icon: Music }
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: '16px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      borderRadius: '14px',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      textAlign: 'center'
                    }}>
                      <item.icon size={20} style={{ color: '#22c55e', marginBottom: '6px' }} />
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#22c55e' }}>
                        {item.stat}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What You Get */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: 'white'
                }}>
                  {AGENTS.length} Specialists. One Subscription.
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {AGENTS.filter(a => a.tier === 'free').map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <div key={agent.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '8px',
                          background: 'rgba(139, 92, 246, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon size={16} style={{ color: 'var(--color-purple)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: '600', color: 'white', marginRight: '8px' }}>{agent.name}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{agent.description}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '10px', 
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem' 
                  }}>
                    + {AGENTS.filter(a => a.tier !== 'free').length} more agents with subscription
                  </div>
                </div>
              </div>

              {/* The Math */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                marginBottom: '20px'
              }}>
                <h4 style={{ 
                  color: 'white', 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  The Math Doesn't Lie
                </h4>
                
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Traditional</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ef4444', textDecoration: 'line-through' }}>$15K+</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowRight size={24} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Studio Agents</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#22c55e' }}>$99</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>lifetime</div>
                  </div>
                </div>
              </div>

              {/* Trust */}
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={16} style={{ fill: '#FFD700', color: '#FFD700' }} />)}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Rated 4.9/5 by 127,000+ artists
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cta-button-primary"
                onClick={() => { setShowMarketing(false); handleCtaClick('start'); }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Zap size={18} />
                Start Creating Free
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Investor Pitch Deck Modal - VC-Ready Full Presentation */}
      {showInvestorPitch && (
        <div 
          className="modal-overlay animate-fadeIn" 
          style={{ zIndex: 10001, overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }}
          onClick={() => setShowInvestorPitch(false)}
          onTouchEnd={(e) => { if (e.target === e.currentTarget) setShowInvestorPitch(false); }}
        >
          <div 
            className="legal-modal animate-scaleIn" 
            style={{ 
              maxWidth: 'min(95vw, 950px)',
              width: '100%',
              margin: '1rem auto',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.98) 0%, rgba(10, 10, 18, 0.99) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header" style={{ 
              borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
              padding: '20px 24px'
            }}>
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <Briefcase size={24} style={{ color: 'var(--color-purple)' }} />
                  Studio Agents — Investor Pitch
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  The AI-Native Label Disrupting a $30B Industry
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowInvestorPitch(false)} onTouchEnd={(e) => { e.preventDefault(); setShowInvestorPitch(false); }}><X size={20} /></button>
            </div>
            
            {/* Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: '4px', 
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              overflowX: 'auto',
              flexShrink: 0
            }}>
              {[
                { id: 'vision', label: 'Vision', icon: Rocket },
                { id: 'market', label: 'Market', icon: Globe },
                { id: 'product', label: 'Product', icon: Layers },
                { id: 'traction', label: 'Traction', icon: TrendingUp, protected: true },
                { id: 'roadmap', label: 'Roadmap', icon: Target, protected: true },
                { id: 'financials', label: 'Financials', icon: BarChart3, protected: true }
              ].map(tab => {
                const isLocked = tab.protected && !investorAccessUnlocked;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPitchTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: pitchTab === tab.id 
                        ? 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-cyan) 100%)' 
                        : isLocked ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                      color: pitchTab === tab.id ? 'white' : isLocked ? 'rgba(255,255,255,0.3)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: pitchTab === tab.id ? '600' : '400',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      opacity: isLocked ? 0.7 : 1
                    }}
                  >
                    {isLocked ? <Lock size={12} /> : <tab.icon size={14} />}
                    {tab.label}
                    {isLocked && <span style={{ fontSize: '0.6rem', marginLeft: '2px' }}>🔒</span>}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="modal-body" style={{ padding: '24px', overflow: 'visible', flex: 1 }}>
              
              {/* EMAIL-BASED ACCESS GATE for protected tabs */}
              {PROTECTED_TABS.includes(pitchTab) && !investorAccessUnlocked && (
                <div className="animate-fadeIn" style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px'
                  }}>
                    <Lock size={36} style={{ color: 'var(--color-purple)' }} />
                  </div>
                  
                  {accessPending ? (
                    /* Access Request Submitted - Pending Approval */
                    <>
                      <h3 style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '700', 
                        color: 'white',
                        marginBottom: '12px'
                      }}>
                        ✅ Request Submitted
                      </h3>
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.95rem',
                        maxWidth: '400px',
                        marginBottom: '24px',
                        lineHeight: '1.6'
                      }}>
                        Thank you for your interest! Our team will review your request and grant access within 24 hours. You'll receive an email confirmation.
                      </p>
                      <button
                        onClick={() => setAccessPending(false)}
                        style={{
                          padding: '12px 24px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Try Different Email
                      </button>
                    </>
                  ) : (
                    /* Email Access Form */
                    <>
                      <h3 style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '700', 
                        color: 'white',
                        marginBottom: '12px'
                      }}>
                        Investor Access Required
                      </h3>
                      
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.95rem',
                        maxWidth: '400px',
                        marginBottom: '32px',
                        lineHeight: '1.6'
                      }}>
                        This section contains sensitive company data. Verify your identity to view {pitchTab.charAt(0).toUpperCase() + pitchTab.slice(1)} information.
                      </p>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: '320px'
                      }}>
                        <input
                          type="text"
                          value={investorName}
                          onChange={(e) => {
                            setInvestorName(e.target.value);
                            setAccessError('');
                          }}
                          placeholder="Your Name *"
                          style={{
                            width: '100%',
                            padding: '14px 18px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: accessError && !investorName.trim() ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '1rem'
                          }}
                        />
                        
                        <input
                          type="email"
                          value={investorEmail}
                          onChange={(e) => {
                            setInvestorEmail(e.target.value);
                            setAccessError('');
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleInvestorAccessSubmit()}
                          placeholder="Email Address *"
                          style={{
                            width: '100%',
                            padding: '14px 18px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: accessError && !investorEmail.trim() ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '1rem'
                          }}
                        />
                        
                        <input
                          type="text"
                          value={investorFirm}
                          onChange={(e) => setInvestorFirm(e.target.value)}
                          placeholder="Firm / Company (optional)"
                          style={{
                            width: '100%',
                            padding: '14px 18px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '1rem'
                          }}
                        />
                        
                        {accessError && (
                          <div style={{ 
                            color: '#ef4444', 
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <AlertCircle size={14} />
                            {accessError}
                          </div>
                        )}
                        
                        <button
                          onClick={handleInvestorAccessSubmit}
                          disabled={accessLoading}
                          style={{
                            width: '100%',
                            padding: '14px 24px',
                            borderRadius: '12px',
                            background: accessLoading 
                              ? 'rgba(139, 92, 246, 0.5)' 
                              : 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-cyan) 100%)',
                            border: 'none',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            cursor: accessLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: accessLoading ? 0.7 : 1
                          }}
                        >
                          {accessLoading ? (
                            <>
                              <div style={{
                                width: '18px',
                                height: '18px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: 'white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }} />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Shield size={18} />
                              Request Access
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div style={{ 
                        marginTop: '32px',
                        padding: '16px 24px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <p style={{ 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.85rem',
                          margin: 0
                        }}>
                          Pre-approved investors get instant access. New requests reviewed within 24 hours.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* VISION TAB */}
              {pitchTab === 'vision' && (
                <div className="animate-fadeIn">
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-purple)', 
                      fontWeight: '600',
                      letterSpacing: '2px',
                      marginBottom: '12px'
                    }}>
                      THE MISSION
                    </div>
                    <h3 style={{ 
                      fontSize: '1.75rem', 
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #fff 0%, #a78bfa 50%, #22d3ee 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: '1.3',
                      marginBottom: '16px'
                    }}>
                      Replace Record Labels with AI Agents
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                      We're building the world's first <strong style={{ color: 'white' }}>AI-native record label</strong> — 
                      a platform where 16 specialized AI agents handle everything from songwriting to distribution, 
                      giving independent artists the firepower of a major label at 1/100th the cost.
                    </p>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '16px',
                    marginBottom: '28px'
                  }}>
                    {[
                      { title: 'The Problem', desc: 'Labels take 80-90% of revenue, control artists for 7+ years, and 97% of signed artists never recoup', color: '#ef4444' },
                      { title: 'Our Solution', desc: '16 AI agents replace the entire label infrastructure — A&R, production, marketing, distribution — at $60/year', color: '#22c55e' },
                      { title: 'The Vision', desc: 'Become the default platform for independent music creation, making labels obsolete within 10 years', color: '#8b5cf6' }
                    ].map((item, i) => (
                      <div key={i} style={{
                        padding: '20px',
                        background: `rgba(${item.color === '#ef4444' ? '239, 68, 68' : item.color === '#22c55e' ? '34, 197, 94' : '139, 92, 246'}, 0.1)`,
                        borderRadius: '16px',
                        border: `1px solid ${item.color}30`
                      }}>
                        <h4 style={{ color: item.color, fontSize: '0.9rem', fontWeight: '700', marginBottom: '10px' }}>
                          {item.title}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                    borderRadius: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '1px' }}>
                      ELEVATOR PITCH
                    </div>
                    <p style={{ 
                      fontSize: '1.1rem', 
                      color: 'white', 
                      fontWeight: '500',
                      lineHeight: '1.6',
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      "We're building the <span style={{ color: 'var(--color-cyan)' }}>Shopify for music creation</span> — 
                      a platform where AI agents replace the entire record label stack. Artists keep 100% ownership, 
                      pay $60/year instead of $15K+ upfront, and ship music 10x faster."
                    </p>
                  </div>
                </div>
              )}

              {/* MARKET TAB */}
              {pitchTab === 'market' && (
                <div className="animate-fadeIn">
                  <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-cyan)', 
                      fontWeight: '600',
                      letterSpacing: '2px',
                      marginBottom: '12px'
                    }}>
                      MARKET OPPORTUNITY
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                      A $30 Billion Industry Ripe for Disruption
                    </h3>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '16px',
                    marginBottom: '28px'
                  }}>
                    {[
                      { value: '$30.6B', label: 'Global Recorded Music Revenue (2023)', sub: 'Growing 10% YoY' },
                      { value: '100M+', label: 'Active Independent Artists', sub: 'Up from 20M in 2015' },
                      { value: '$8.2B', label: 'Music Creation Tools TAM', sub: 'AI segment growing 42% CAGR' }
                    ].map((item, i) => (
                      <div key={i} style={{
                        padding: '20px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        textAlign: 'center'
                      }}>
                        <div style={{ 
                          fontSize: '1.75rem', 
                          fontWeight: '800', 
                          background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          marginBottom: '8px'
                        }}>
                          {item.value}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '600', marginBottom: '4px' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-cyan)' }}>
                          {item.sub}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>
                      Why Now?
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { title: 'AI Inflection Point', desc: 'GPT-4, Gemini, and specialized music AI models have reached production quality' },
                        { title: 'Creator Economy Explosion', desc: '165M creators worldwide, with music being the fastest-growing segment' },
                        { title: 'Distribution Democratized', desc: 'Spotify, Apple Music, TikTok have eliminated the need for label distribution deals' },
                        { title: 'Labels Losing Leverage', desc: 'Independent artists now capture 43% of streaming revenue, up from 18% in 2015' }
                      ].map((item, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '14px 16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                          <ChevronRight size={18} style={{ color: 'var(--color-purple)', flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <span style={{ fontWeight: '600', color: 'white' }}>{item.title}: </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <h4 style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px' }}>
                      The Label Tax (What Artists Pay Today)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      {[
                        { label: 'Label revenue share', value: '80-90%' },
                        { label: 'Contract duration', value: '7+ years' },
                        { label: 'Artists who never recoup', value: '97%' },
                        { label: 'Avg. advance recoup threshold', value: '$500K+' }
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.label}</span>
                          <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '0.85rem' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PRODUCT TAB */}
              {pitchTab === 'product' && (
                <div className="animate-fadeIn">
                  <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-purple)', 
                      fontWeight: '600',
                      letterSpacing: '2px',
                      marginBottom: '12px'
                    }}>
                      THE PLATFORM
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                      {AGENTS.length} AI Agents = One Complete Label
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                      Each agent is a specialized AI trained on industry best practices
                    </p>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '12px',
                    marginBottom: '28px'
                  }}>
                    {/* Dynamically group agents by category */}
                    {[
                      { category: 'Music Creation', label: 'Creation' },
                      { category: 'Audio Engineering', label: 'Production' },
                      { category: 'Visual Identity', label: 'Visual' },
                      { category: 'Career Growth', label: 'Business' }
                    ].map((group, i) => {
                      const categoryAgents = AGENTS.filter(a => a.category === group.category);
                      return (
                        <div key={i} style={{
                          padding: '16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '14px',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                          <div style={{ 
                            fontSize: '0.7rem', 
                            color: 'var(--color-cyan)', 
                            fontWeight: '600',
                            letterSpacing: '1px',
                            marginBottom: '10px'
                          }}>
                            {group.label.toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {categoryAgents.map((agent) => (
                              <div key={agent.id} style={{ 
                                fontSize: '0.85rem', 
                                color: agent.tier === 'free' ? 'white' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <div style={{ 
                                  width: '4px', 
                                  height: '4px', 
                                  borderRadius: '50%', 
                                  background: agent.tier === 'free' ? 'var(--color-cyan)' : 'var(--color-purple)' 
                                }} />
                                {agent.name}
                                {agent.tier !== 'free' && <Lock size={10} style={{ opacity: 0.5 }} />}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                    borderRadius: '16px',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>
                      Competitive Moat
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      {[
                        { title: 'Multi-Agent Architecture', desc: 'Proprietary orchestration of specialized AI models' },
                        { title: 'Music-Native Training', desc: 'Fine-tuned on millions of songs, lyrics, and industry data' },
                        { title: 'Unified Workflow', desc: 'Single platform vs. 10+ fragmented tools' },
                        { title: 'Network Effects', desc: 'More artists = more data = better AI = more artists' }
                      ].map((item, i) => (
                        <div key={i}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#22c55e', marginBottom: '4px' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {item.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TRACTION TAB */}
              {pitchTab === 'traction' && (
                <div className="animate-fadeIn">
                  <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-cyan)', 
                      fontWeight: '600',
                      letterSpacing: '2px',
                      marginBottom: '12px'
                    }}>
                      TRACTION & METRICS
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
                      Growing Fast, Retaining Users
                    </h3>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '12px',
                    marginBottom: '28px'
                  }}>
                    {[
                      { value: '127K+', label: 'Active Artists', growth: '+340% YoY' },
                      { value: '847K', label: 'Songs Created', growth: '+520% YoY' },
                      { value: '92%', label: 'Day-30 Retention', growth: 'Top 5% for SaaS' },
                      { value: '4.9★', label: 'App Rating', growth: '12K+ reviews' }
                    ].map((item, i) => (
                      <div key={i} style={{
                        padding: '18px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                          {item.value}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          {item.label}
                        </div>
                        <div style={{ 
                          fontSize: '0.65rem', 
                          color: '#22c55e', 
                          fontWeight: '600',
                          padding: '3px 8px',
                          background: 'rgba(34, 197, 94, 0.15)',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {item.growth}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>
                      Key Milestones
                    </h4>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px',
                      position: 'relative',
                      paddingLeft: '24px'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: '8px',
                        top: '8px',
                        bottom: '8px',
                        width: '2px',
                        background: 'linear-gradient(180deg, var(--color-purple), var(--color-cyan))'
                      }} />
                      {[
                        { date: 'Q1 2024', milestone: 'Public Beta Launch — 5K signups in first week' },
                        { date: 'Q2 2024', milestone: 'Hit 50K users, launched all 16 agents' },
                        { date: 'Q3 2024', milestone: '100K users, partnerships with 3 major distributors' },
                        { date: 'Q4 2024', milestone: 'Mobile app launch, 127K users, $2.1M ARR run rate' }
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                            flexShrink: 0,
                            marginLeft: '-20px',
                            marginTop: '4px'
                          }} />
                          <div>
                            <span style={{ color: 'var(--color-cyan)', fontWeight: '600', fontSize: '0.85rem' }}>{item.date}: </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.milestone}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  }}>
                    <h4 style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px' }}>
                      User Love ❤️
                    </h4>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '12px' 
                    }}>
                      {[
                        '"This replaced my entire creative team. I released an EP in 2 weeks." — @IndieRapper',
                        '"The Ghostwriter agent writes hooks better than most writers I\'ve paid." — Producer, ATL'
                      ].map((quote, i) => (
                        <div key={i} style={{
                          padding: '14px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                          lineHeight: '1.5'
                        }}>
                          {quote}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ROADMAP TAB */}
              {pitchTab === 'roadmap' && (
                <div className="animate-fadeIn">
                  <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-purple)', 
                      fontWeight: '600',
                      letterSpacing: '2px',
                      marginBottom: '12px'
                    }}>
                      FUTURE VISION
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
                      From Tool to Ecosystem
                    </h3>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '16px' 
                    }}>
                      {[
                        { 
                          phase: 'Phase 1', 
                          title: 'Creation Suite', 
                          status: 'NOW',
                          items: ['16 AI Agents', 'Song Creation', 'Visual Content', 'Social Tools'],
                          color: '#22c55e'
                        },
                        { 
                          phase: 'Phase 2', 
                          title: 'Distribution Layer', 
                          status: '2025',
                          items: ['Spotify Direct Upload', 'Apple Music Integration', 'TikTok Auto-Post', 'YouTube Music'],
                          color: '#8b5cf6'
                        },
                        { 
                          phase: 'Phase 3', 
                          title: 'Full Label Stack', 
                          status: '2026',
                          items: ['Sync Licensing AI', 'Royalty Collection', 'Tour Booking Agent', 'Merch Automation'],
                          color: '#06b6d4'
                        }
                      ].map((phase, i) => (
                        <div key={i} style={{
                          padding: '20px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '16px',
                          border: `1px solid ${phase.color}40`
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}>
                            <span style={{ fontSize: '0.7rem', color: phase.color, fontWeight: '600' }}>
                              {phase.phase}
                            </span>
                            <span style={{ 
                              fontSize: '0.65rem', 
                              padding: '3px 8px', 
                              borderRadius: '6px',
                              background: `${phase.color}20`,
                              color: phase.color,
                              fontWeight: '600'
                            }}>
                              {phase.status}
                            </span>
                          </div>
                          <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>
                            {phase.title}
                          </h4>
                          <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            {phase.items.map((item, j) => (
                              <li key={j} style={{ 
                                fontSize: '0.8rem', 
                                color: 'var(--text-secondary)',
                                marginBottom: '6px'
                              }}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                    borderRadius: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>
                      Platform Integration Roadmap
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                      {[
                        { name: 'Spotify', status: 'In Progress' },
                        { name: 'Apple Music', status: 'Q2 2025' },
                        { name: 'TikTok', status: 'Q2 2025' },
                        { name: 'YouTube Music', status: 'Q3 2025' },
                        { name: 'SoundCloud', status: 'Q3 2025' },
                        { name: 'Bandcamp', status: 'Q4 2025' },
                        { name: 'Instagram Reels', status: 'Q1 2026' },
                        { name: 'Sync Licensing', status: 'Q2 2026' }
                      ].map((platform, i) => (
                        <div key={i} style={{
                          padding: '10px 16px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <ExternalLink size={12} style={{ color: 'var(--color-cyan)' }} />
                          <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>{platform.name}</span>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            color: 'var(--text-secondary)',
                            padding: '2px 6px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px'
                          }}>
                            {platform.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ color: '#ef4444', fontSize: '1rem', fontWeight: '700', marginBottom: '8px' }}>
                      The Endgame
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                      By 2030, we aim to be the <strong style={{ color: 'white' }}>default infrastructure</strong> for 
                      independent music — replacing the need for labels, distributors, and traditional production companies entirely.
                    </p>
                  </div>
                </div>
              )}

              {/* FINANCIALS TAB */}
              {pitchTab === 'financials' && (
                <div className="animate-fadeIn">
                  <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-cyan)', 
                      fontWeight: '600',
                      letterSpacing: '2px',
                      marginBottom: '12px'
                    }}>
                      BUSINESS MODEL & VALUATION
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
                      Scalable SaaS with Network Effects
                    </h3>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '16px',
                    marginBottom: '28px'
                  }}>
                    <div style={{
                      padding: '20px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <h4 style={{ color: 'var(--color-purple)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px' }}>
                        Pricing Tiers
                      </h4>
                      {[
                        { tier: 'Free', price: '$0', features: 'Limited generations, 3 agents' },
                        { tier: 'Annual', price: '$60/yr', features: 'Full access, all 16 agents' },
                        { tier: 'Lifetime', price: '$99 once', features: 'Unlimited forever, priority' },
                        { tier: 'Pro (Coming)', price: '$199/yr', features: 'API access, team seats, priority' }
                      ].map((tier, i) => (
                        <div key={i} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          <div>
                            <span style={{ color: 'white', fontWeight: '600', fontSize: '0.85rem' }}>{tier.tier}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: '8px' }}>{tier.features}</span>
                          </div>
                          <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.9rem' }}>{tier.price}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      padding: '20px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <h4 style={{ color: 'var(--color-cyan)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px' }}>
                        Unit Economics
                      </h4>
                      {[
                        { metric: 'LTV', value: '$180', note: 'Blended across tiers' },
                        { metric: 'CAC', value: '$12', note: 'Organic + paid blend' },
                        { metric: 'LTV:CAC', value: '15:1', note: 'Exceptional for SaaS' },
                        { metric: 'Gross Margin', value: '82%', note: 'API costs declining' }
                      ].map((item, i) => (
                        <div key={i} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          <div>
                            <span style={{ color: 'white', fontWeight: '600', fontSize: '0.85rem' }}>{item.metric}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginLeft: '8px' }}>{item.note}</span>
                          </div>
                          <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.9rem' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                    borderRadius: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    marginBottom: '24px'
                  }}>
                    <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>
                      Financial Projections
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
                      {[
                        { year: '2024', arr: '$2.1M', users: '127K' },
                        { year: '2025', arr: '$8.5M', users: '400K' },
                        { year: '2026', arr: '$25M', users: '1M' },
                        { year: '2027', arr: '$75M', users: '2.5M' }
                      ].map((item, i) => (
                        <div key={i}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            {item.year}
                          </div>
                          <div style={{ 
                            fontSize: '1.25rem', 
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '4px'
                          }}>
                            {item.arr}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {item.users} users
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    padding: '24px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '16px',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '1px' }}>
                      TARGET VALUATION — SERIES A
                    </div>
                    <div style={{ 
                      fontSize: '2.5rem', 
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #22c55e, #06b6d4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: '8px'
                    }}>
                      $50M — $75M
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Based on 25-35x ARR multiples for high-growth AI SaaS
                    </p>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Comparable: </span>
                        <span style={{ fontSize: '0.8rem', color: 'white', fontWeight: '600' }}>Amper (acq. $100M+)</span>
                      </div>
                      <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Comparable: </span>
                        <span style={{ fontSize: '0.8rem', color: 'white', fontWeight: '600' }}>Splice ($500M val)</span>
                      </div>
                    </div>
                  </div>

                  {/* Investor CTA */}
                  <div style={{
                    marginTop: '24px',
                    padding: '28px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                    borderRadius: '20px',
                    border: '2px solid rgba(139, 92, 246, 0.4)',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      background: 'rgba(139, 92, 246, 0.3)',
                      borderRadius: '20px',
                      marginBottom: '16px'
                    }}>
                      <Award size={14} style={{ color: 'var(--color-purple)' }} />
                      <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--color-purple)', letterSpacing: '1px' }}>
                        NOW RAISING
                      </span>
                    </div>
                    
                    <h4 style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: '700', 
                      color: 'white',
                      marginBottom: '12px'
                    }}>
                      Interested in Investing?
                    </h4>
                    
                    <p style={{ 
                      fontSize: '0.9rem', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '20px',
                      maxWidth: '450px',
                      margin: '0 auto 20px auto',
                      lineHeight: '1.5'
                    }}>
                      We're actively seeking strategic investors who share our vision of democratizing music creation. 
                      Join us in building the future of independent music.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <a 
                        href="mailto:investors@studioagents.ai?subject=Investment%20Inquiry%20-%20Studio%20Agents"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '14px 24px',
                          background: 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-cyan) 100%)',
                          borderRadius: '12px',
                          color: 'white',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Briefcase size={18} />
                        Contact Our Team
                      </a>
                      
                      <a 
                        href="https://calendly.com/studioagents/investor-call"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '14px 24px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: 'white',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                      >
                        <Clock size={18} />
                        Schedule a Call
                      </a>
                    </div>
                    
                    <div style={{ 
                      marginTop: '20px', 
                      display: 'flex', 
                      gap: '20px', 
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}>
                      {[
                        { label: 'Raising', value: '$5M Seed' },
                        { label: 'Use of Funds', value: 'Growth + Eng' },
                        { label: 'Min Check', value: '$100K' }
                      ].map((item, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: '600' }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ 
              borderTop: '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex',
              gap: '12px',
              padding: '20px 24px'
            }}>
              <button 
                className="glass-button"
                onClick={() => setShowInvestorPitch(false)}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Close
              </button>
              <button 
                className="cta-button-primary"
                onClick={() => { setShowInvestorPitch(false); handleCtaClick('start'); }}
                style={{ flex: 2, justifyContent: 'center' }}
              >
                <Zap size={18} />
                Try the Platform
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Whitepaper Modal - Technical Documentation */}
      {showAgentWhitepaper && selectedWhitepaperAgent && (() => {
        const agent = selectedWhitepaperAgent;
        const wp = getWhitepaperData(agent.id);
        const Icon = agent.icon;
        
        return (
          <div 
            className="modal-overlay animate-fadeIn" 
            style={{ zIndex: 10002, overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }}
            onClick={() => { setShowAgentWhitepaper(false); setSelectedWhitepaperAgent(null); }}
            onTouchEnd={(e) => { if (e.target === e.currentTarget) { setShowAgentWhitepaper(false); setSelectedWhitepaperAgent(null); } }}
          >
            <div 
              className="legal-modal animate-scaleIn" 
              style={{ 
                maxWidth: 'min(95vw, 1000px)',
                width: '100%',
                margin: '1rem auto',
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.99) 0%, rgba(8, 8, 14, 1) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="modal-header" style={{ 
                borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
                padding: '20px 24px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-cyan) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={24} style={{ color: 'white' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                      <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{wp.fullName || agent.name}</h2>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '3px 8px', 
                        background: 'rgba(139, 92, 246, 0.3)',
                        borderRadius: '6px',
                        color: 'var(--color-purple)',
                        fontWeight: '600'
                      }}>
                        v{wp.version}
                      </span>
                      {agent.isBeta && (
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '3px 8px', 
                          background: 'rgba(239, 68, 68, 0.2)',
                          borderRadius: '6px',
                          color: '#ef4444',
                          fontWeight: '600'
                        }}>
                          BETA
                        </span>
                      )}
                    </div>
                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--text-secondary)', 
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      {wp.tagline}
                    </p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => { setShowAgentWhitepaper(false); setSelectedWhitepaperAgent(null); }} onTouchEnd={(e) => { e.preventDefault(); setShowAgentWhitepaper(false); setSelectedWhitepaperAgent(null); }}><X size={20} /></button>
              </div>
              
              {/* Navigation Tabs */}
              <div style={{ 
                display: 'flex', 
                gap: '4px', 
                padding: '12px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                overflowX: 'auto',
                flexShrink: 0
              }}>
                {[
                  { id: 'overview', label: 'Overview', icon: FileText },
                  { id: 'technical', label: 'Tech Stack', icon: Cpu },
                  { id: 'features', label: 'Features', icon: Layers },
                  { id: 'usage', label: 'When to Use', icon: Lightbulb },
                  { id: 'examples', label: 'Examples', icon: Code },
                  { id: 'specs', label: 'Specs', icon: Settings }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setWhitepaperTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: whitepaperTab === tab.id 
                        ? 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-cyan) 100%)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      color: whitepaperTab === tab.id ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: whitepaperTab === tab.id ? '600' : '400',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="modal-body" style={{ padding: '24px', overflow: 'visible', flex: 1 }}>
                
                {/* OVERVIEW TAB */}
                {whitepaperTab === 'overview' && (
                  <div className="animate-fadeIn">
                    {/* Product Overview */}
                    <div style={{ marginBottom: '28px' }}>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--color-purple)', 
                        fontWeight: '600',
                        letterSpacing: '2px',
                        marginBottom: '12px'
                      }}>
                        PRODUCT OVERVIEW
                      </div>
                      <p style={{ 
                        fontSize: '1rem', 
                        color: 'var(--text-secondary)', 
                        lineHeight: '1.7',
                        margin: 0
                      }}>
                        {wp.overview}
                      </p>
                    </div>

                    {/* Problem & Solution */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                      gap: '16px',
                      marginBottom: '28px'
                    }}>
                      <div style={{
                        padding: '20px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        borderRadius: '16px',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <AlertCircle size={18} style={{ color: '#ef4444' }} />
                          <h4 style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>
                            The Problem
                          </h4>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                          {wp.problemSolved}
                        </p>
                      </div>

                      <div style={{
                        padding: '20px',
                        background: 'rgba(34, 197, 94, 0.08)',
                        borderRadius: '16px',
                        border: '1px solid rgba(34, 197, 94, 0.2)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <CheckCircle size={18} style={{ color: '#22c55e' }} />
                          <h4 style={{ color: '#22c55e', fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>
                            The Solution
                          </h4>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                          {agent.name} automates this workflow with AI, delivering professional results in minutes instead of days.
                        </p>
                      </div>
                    </div>

                    {/* Success Metrics */}
                    <div style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                      borderRadius: '16px',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '1px' }}>
                        PERFORMANCE METRICS
                      </div>
                      <p style={{ 
                        fontSize: '1rem', 
                        color: 'white', 
                        fontWeight: '500',
                        margin: 0
                      }}>
                        {wp.successMetrics}
                      </p>
                    </div>
                  </div>
                )}

                {/* TECHNICAL TAB */}
                {whitepaperTab === 'technical' && (
                  <div className="animate-fadeIn">
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: 'var(--color-cyan)', 
                      fontWeight: '600',
                      letterSpacing: '2px',
                      marginBottom: '20px'
                    }}>
                      TECHNICAL ARCHITECTURE
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                      gap: '12px',
                      marginBottom: '28px'
                    }}>
                      {wp.technicalStack.map((tech, i) => (
                        <div key={i} style={{
                          padding: '16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Cpu size={16} style={{ color: 'white' }} />
                          </div>
                          <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>{tech}</span>
                        </div>
                      ))}
                    </div>

                    {/* Integration */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(139, 92, 246, 0.08)',
                      borderRadius: '16px',
                      border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}>
                      <h4 style={{ color: 'var(--color-purple)', fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px' }}>
                        Workflow Integration
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                        {wp.workflowIntegration}
                      </p>
                    </div>
                  </div>
                )}

                {/* FEATURES TAB */}
                {whitepaperTab === 'features' && (
                  <div className="animate-fadeIn">
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: 'var(--color-purple)', 
                      fontWeight: '600',
                      letterSpacing: '2px',
                      marginBottom: '20px'
                    }}>
                      KEY FEATURES & CAPABILITIES
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(wp.keyFeatures && wp.keyFeatures.length > 0 ? wp.keyFeatures : (agent.capabilities || []).map(c => ({ name: c, desc: '' }))).map((feature, i) => (
                        <div key={i} style={{
                          padding: '18px 20px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '14px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '14px'
                        }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: 'rgba(139, 92, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}>
                            <CheckCircle size={14} style={{ color: 'var(--color-purple)' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: '600', marginBottom: '4px' }}>
                              {feature.name}
                            </div>
                            {feature.desc && (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                                {feature.desc}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* USAGE TAB */}
                {whitepaperTab === 'usage' && (
                  <div className="animate-fadeIn">
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                      gap: '20px'
                    }}>
                      {/* When to Use */}
                      <div>
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '16px'
                        }}>
                          <CheckCircle size={18} style={{ color: '#22c55e' }} />
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#22c55e', 
                            fontWeight: '600',
                            letterSpacing: '1px'
                          }}>
                            WHEN TO USE
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {wp.whenToUse.map((item, i) => (
                            <div key={i} style={{
                              padding: '12px 16px',
                              background: 'rgba(34, 197, 94, 0.08)',
                              borderRadius: '10px',
                              border: '1px solid rgba(34, 197, 94, 0.15)',
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* When NOT to Use */}
                      <div>
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '16px'
                        }}>
                          <AlertCircle size={18} style={{ color: '#ef4444' }} />
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#ef4444', 
                            fontWeight: '600',
                            letterSpacing: '1px'
                          }}>
                            WHEN NOT TO USE
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {wp.whenNotToUse.map((item, i) => (
                            <div key={i} style={{
                              padding: '12px 16px',
                              background: 'rgba(239, 68, 68, 0.08)',
                              borderRadius: '10px',
                              border: '1px solid rgba(239, 68, 68, 0.15)',
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* EXAMPLES TAB */}
                {whitepaperTab === 'examples' && (
                  <div className="animate-fadeIn">
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: 'var(--color-cyan)', 
                      fontWeight: '600',
                      letterSpacing: '2px',
                      marginBottom: '20px'
                    }}>
                      EXAMPLE PROMPTS & USE CASES
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                      {wp.examplePrompts.map((prompt, i) => (
                        <div key={i} style={{
                          padding: '18px 20px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '14px',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          position: 'relative'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '16px',
                            background: 'var(--color-bg)',
                            padding: '2px 8px',
                            fontSize: '0.65rem',
                            color: 'var(--color-purple)',
                            fontWeight: '600',
                            borderRadius: '4px'
                          }}>
                            EXAMPLE {i + 1}
                          </div>
                          <p style={{ 
                            fontSize: '0.9rem', 
                            color: 'white', 
                            lineHeight: '1.6',
                            margin: 0,
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {prompt}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Output Formats */}
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: 'var(--color-purple)', 
                      fontWeight: '600',
                      letterSpacing: '2px',
                      marginBottom: '16px'
                    }}>
                      OUTPUT FORMATS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {wp.outputFormats.map((format, i) => (
                        <div key={i} style={{
                          padding: '8px 16px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          borderRadius: '8px',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          fontSize: '0.8rem',
                          color: 'white',
                          fontWeight: '500'
                        }}>
                          {format}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SPECS TAB */}
                {whitepaperTab === 'specs' && (
                  <div className="animate-fadeIn">
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: 'var(--color-purple)', 
                      fontWeight: '600',
                      letterSpacing: '2px',
                      marginBottom: '20px'
                    }}>
                      SPECIFICATIONS & LIMITATIONS
                    </div>

                    {/* Specs Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                      gap: '12px',
                      marginBottom: '28px'
                    }}>
                      {[
                        { label: 'Version', value: wp.version },
                        { label: 'Release Date', value: wp.releaseDate },
                        { label: 'Pricing', value: wp.pricing },
                        { label: 'Category', value: agent.category }
                      ].map((spec, i) => (
                        <div key={i} style={{
                          padding: '16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            {spec.label}
                          </div>
                          <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: '600' }}>
                            {spec.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Limitations */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(239, 68, 68, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(239, 68, 68, 0.15)'
                    }}>
                      <h4 style={{ 
                        color: '#ef4444', 
                        fontSize: '0.85rem', 
                        fontWeight: '700', 
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <AlertCircle size={16} />
                        Known Limitations
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {(wp.limitations || []).map((item, i) => (
                          <li key={i} style={{ 
                            fontSize: '0.85rem', 
                            color: 'var(--text-secondary)',
                            marginBottom: '8px',
                            lineHeight: '1.5'
                          }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer" style={{ 
                borderTop: '1px solid rgba(139, 92, 246, 0.2)',
                display: 'flex',
                gap: '12px',
                padding: '16px 24px'
              }}>
                <button 
                  className="glass-button"
                  onClick={() => setShowAgentWhitepaper(false)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Close
                </button>
                <button 
                  className="cta-button-primary"
                  onClick={() => { setShowAgentWhitepaper(false); handleCtaClick('agent'); }}
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  <Zap size={18} />
                  Try {agent.name}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
