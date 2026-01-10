import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { 
  Sparkles, Zap, Music, PlayCircle, Target, Users as UsersIcon, Rocket, Shield, Globe, Folder, FolderPlus, Book, Cloud, Search, Download, Share2, CircleHelp, MessageSquare, Play, Pause, Volume2, Maximize2, Home, ArrowLeft, Mic, Save, Lock, CheckCircle, Check, Settings, Languages, CreditCard, HardDrive, Database, Twitter, Instagram, RefreshCw, Sun, Moon, Trash2, Eye, EyeOff, Plus, Landmark, ArrowRight, ChevronLeft, ChevronRight, ChevronUp, X, Bell, Menu, LogOut, User, Crown, LayoutGrid, TrendingUp, Disc, Video, FileAudio as FileMusic, Activity, Film, FileText, Tv, PenTool, PenTool as Tool, Map as MapIcon, ExternalLink, Layout, Feather, Hash, Image as ImageIcon, Undo, Redo, Mail, Clock, Cpu, FileAudio, Piano, Camera, Edit3, Upload, List, Calendar
} from 'lucide-react';

// Alias for clarity and to avoid potential minification issues
const Users = UsersIcon;
const Image = ImageIcon;

// Lazy load heavy sub-components
const VideoPitchDemo = lazy(() => import('./VideoPitchDemo'));
const MultiAgentDemo = lazy(() => import('./MultiAgentDemo'));
const StudioOrchestrator = lazy(() => import('./StudioOrchestratorV2'));
const QuickWorkflow = lazy(() => import('./QuickWorkflow'));
const ProjectHub = lazy(() => import('./ProjectHub'));
const NewsHub = lazy(() => import('./NewsHub'));

// Simple inline fallback for lazy components
const LazyFallback = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: '40px',
    color: 'var(--text-secondary)'
  }}>
    <div style={{
      width: '24px',
      height: '24px',
      border: '2px solid rgba(168,85,247,0.2)',
      borderTopColor: '#a855f7',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginRight: '12px'
    }} />
    Loading...
  </div>
);

import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import toast, { Toaster } from 'react-hot-toast';
import { 
  auth, 
  db, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  doc,
  getDoc,
  setDoc
  // Note: collection, getDocs, query, orderBy, deleteDoc moved to backend API
} from '../firebase';
import { AGENTS, BACKEND_URL } from '../constants';
import { getDemoModeState, getMockResponse, toggleDemoMode, checkDemoCode, DEMO_BANNER_STYLES } from '../utils/demoMode';
import { Analytics, trackPageView } from '../utils/analytics';

// --- CONSTANTS FOR ONBOARDING & SUPPORT ---

// Admin accounts - full access to all features
const ADMIN_EMAILS = [
  'jari57@gmail.com',
  'info@studioagentsai.com'
];

// Check if email is admin
const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// Simplified 4-step onboarding flow
const onboardingSteps = [
  {
    id: 'welcome',
    title: "Welcome to The Studio",
    content: "Your creative control room—16 AI agents that give independent creators the tools that used to require a label deal.",
    detail: "Take 60 seconds to set up your workspace, and you'll get 10x more value out of every session."
  },
  {
    id: 'setup',
    title: "Quick Setup",
    content: "Tell us who you are and what you're working on.",
    detail: "This helps us tailor the studio to your sound and pre-select the right agents for your goal."
  },
  {
    id: 'agents',
    title: "Your AI Team",
    content: "Based on your goal, we've selected these agents.",
    detail: "You can always add or remove agents later. These are just your starting lineup."
  },
  {
    id: 'ready',
    title: "You're All Set!",
    content: "Your studio is ready. Start creating.",
    detail: "Explore the agents tab, or jump straight into your first project."
  }
];

const goalOptions = [
  { id: 'write', label: "Write songs", description: "Collaborate with AI to finish your lyrics", icon: Feather, agents: ['ghost', 'beat'] },
  { id: 'produce', label: "Make beats", description: "Create production with intelligent sampling", icon: Disc, agents: ['beat', 'sample'] },
  { id: 'grow', label: "Grow my audience", description: "Leverage trends and create content", icon: Hash, agents: ['video-creator', 'trend', 'social'] },
  { id: 'brand', label: "Build my brand", description: "Develop visual and sonic identity", icon: ImageIcon, agents: ['album', 'video-creator'] },
  { id: 'explore', label: "Just exploring", description: "Discover what's possible", icon: Sparkles, agents: [] }
];

const agentDetails = {
  ghost: {
    title: "GHOSTWRITER",
    subtitle: "AI Lyric Engine",
    tagline: "Finish what you started.",
    description: "In the early 2000s, countless verses were lost to crashed hard drives, stolen notebooks, and fading memories. The Ghostwriter was built to resurrect that energy—to help creators who have melodies without words, hooks without verses, ideas without execution. Speak your concept, hum your flow, or type your fragments. The AI completes your thought while preserving your voice. This isn't about replacing creativity—it's about unlocking what's already inside you. Perfect for creators who know what they want to say but can't find the words, or those who need a writing partner at 3 AM when no one else is awake.",
    whoFor: "Creators with unfinished ideas, vocalists who think in melodies, writers fighting creative blocks.",
    howTo: "Speak or type your concept. The AI analyzes your style and generates completions that match your voice."
  },
  beat: {
    title: "BEAT LAB",
    subtitle: "Production Suite",
    tagline: "Find the sounds they haven't found yet.",
    description: "Every classic hip-hop beat started with a discovery—a forgotten soul record, an obscure jazz session, a B-side that became a foundation. Beat Lab brings that experience digital. Tell it what you're looking for—a mood, an era, a genre, a feeling—and it surfaces samples and patterns you've never heard. Get BPM, key information, and historical context. Understand the story behind the sound before you flip it. This tool doesn't replace the hunt; it expands your crates beyond what any physical collection could offer.",
    whoFor: "Producers seeking sample inspiration, beatmakers exploring new genres, DJs building setlists.",
    howTo: "Describe the vibe you're chasing. Receive curated sample suggestions and MIDI patterns."
  },
  release: {
    title: "RELEASE STRATEGIST",
    subtitle: "Creator Development",
    tagline: "See your music through their eyes.",
    description: "A&R executives decide careers. They listen to hundreds of songs daily, looking for that undefinable 'it factor' that separates a demo from a deal. The Release Strategist gives you access to that perspective before you submit. Upload your track and receive analysis on commercial viability, production quality, market positioning, and competitive landscape. Understand how your music stacks up against current releases. Identify your unique selling points and potential weaknesses. This isn't about changing your art to fit the market—it's about understanding the market so you can navigate it strategically.",
    whoFor: "Creators preparing for label meetings, independent releases seeking market fit, managers evaluating talent.",
    howTo: "Describe your track or upload details. Receive a comprehensive analysis with actionable insights."
  },
  album: {
    title: "ALBUM ARTIST",
    subtitle: "Visual Generator",
    tagline: "See what your sound looks like.",
    description: "The cover is the first impression. Before anyone presses play, they see your visual identity—and they make assumptions. Does the art match the music? Does it communicate who you are? In the era of thumbnail scrolling, your album art works overtime. The Album Artist generator transforms your concepts into visual directions. Describe your project's mood, themes, and aesthetic references. Receive AI-generated concepts that capture your vision. Use them as inspiration for final artwork, or as communication tools when briefing designers. Your music has a look—this tool helps you find it before you finalize it.",
    whoFor: "Creators developing visual identity, designers seeking inspiration, anyone releasing music.",
    howTo: "Describe your project's themes, mood, and visual references. Generate concepts to guide your final artwork."
  },
  'video-creator': {
    title: "VIDEO CREATOR",
    subtitle: "Content Generator",
    tagline: "Motion for the feed.",
    description: "Music lives on video platforms now. If you don't have visuals, you don't have a release. Video Creator is your instant content team. Generate visualizers, lyric videos, and promotional clips that match your track's energy. Describe the scene, the movement, the style. Create loops for Spotify Canvas, teasers for TikTok, or full visualizers for YouTube. You don't need a film crew or a budget to have professional visuals. You just need a vision.",
    whoFor: "Creators needing social content, producers showcasing beats, anyone releasing music online.",
    howTo: "Describe the scene and style. Generate video loops and clips to accompany your music."
  },
  trend: {
    title: "TREND HUNTER",
    subtitle: "Market Intelligence",
    tagline: "Ride the wave before it breaks.",
    description: "The music industry moves fast. Trends explode and vanish in days. Trend Hunter gives you the data to move with speed. Analyze what's working right now on TikTok, Spotify, and YouTube. Identify rising sub-genres, viral sounds, and content formats. This isn't about copying—it's about awareness. Know the conversation so you can add your voice to it. Spot the wave early enough to ride it, or understand it well enough to counter it.",
    whoFor: "Creators planning releases, managers looking for opportunities, content creators seeking growth.",
    howTo: "Ask about current trends in your genre. Get data-backed insights on what's working now."
  }
};

// Helper: Get relative time since date
const getTimeSince = (date) => {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
};

function StudioView({ onBack, startWizard, startTour: _startTour, initialPlan }) {
  // Helper to get tab from hash
  const getTabFromHash = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/studio/')) {
      return hash.split('/')[2];
    }
    return 'agents';
  };

  const [activeTab, _setActiveTab] = useState(getTabFromHash());

  // Sync state with hash (Browser Back/Forward)
  useEffect(() => {
    const handleHashChange = () => {
      const newTab = getTabFromHash();
      if (newTab !== activeTab) {
        _setActiveTab(newTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  // Custom setter that updates URL
  const setActiveTab = (tab) => {
    if (tab !== activeTab) {
      _setActiveTab(tab);
      window.location.hash = `#/studio/${tab}`;
      // Track page view for tab change
      trackPageView(`/studio/${tab}`, `Studio - ${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    }
  };
  
  // Swipe Navigation Hook
  const swipeHandlers = useSwipeNavigation(
    ['agents', 'mystudio', 'activity', 'news', 'resources', 'marketing'],
    activeTab,
    setActiveTab
  );
  const [theme, setTheme] = useState(() => localStorage.getItem('studio_theme') || 'dark');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [backingTrack, setBackingTrack] = useState(null); // For vocal sync
  const [user, setUser] = useState(null); // Moved up - needed before cloud sync useEffect
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Admin access flag
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newsSearch, setNewsSearch] = useState('');
  // Reserved for future use: const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_agents_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Sort by updatedAt/createdAt descending (newest first)
        return parsed.sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        });
      }
      return [];
    } catch (_e) {
      return [];
    }
  });
  
  // Cloud sync state
  const [_projectsSyncing, setProjectsSyncing] = useState(false);
  const [_lastSyncTime, setLastSyncTime] = useState(null);
  const syncTimeoutRef = useRef(null);

  // Save a single project to Firestore via backend API
  const saveProjectToCloud = async (uid, project) => {
    const traceId = `SAVE-${Date.now()}`;
    console.log(`[TRACE:${traceId}] saveProjectToCloud START`, {
      hasUid: !!uid,
      projectId: project?.id,
      projectName: project?.name,
      assetCount: project?.assets?.length,
      assetTypes: project?.assets?.map(a => ({ id: a.id, type: a.type, hasImage: !!a.imageUrl, hasAudio: !!a.audioUrl, hasVideo: !!a.videoUrl }))
    });
    
    if (!uid || !project || !project.id) {
      console.warn(`[TRACE:${traceId}] saveProjectToCloud ABORT - Missing required data`, { hasUid: !!uid, hasProject: !!project });
      return false;
    }
    
    try {
      // Sanitize project data - remove undefined values, functions, and circular refs
      const sanitizedProject = {};
      for (const [key, value] of Object.entries(project)) {
        if (value !== undefined && typeof value !== 'function') {
          // Deep clone to avoid circular reference issues
          try {
            sanitizedProject[key] = JSON.parse(JSON.stringify(value));
          } catch (_e) {
            // Skip values that can't be serialized
            console.warn(`[TRACE:${traceId}] Skipping non-serializable field: ${key}`);
          }
        }
      }
      
      console.log(`[TRACE:${traceId}] Sanitized project assets:`, sanitizedProject.assets?.length, sanitizedProject.assets?.map(a => a.id));
      
      // Get auth token for backend API
      let authToken = null;
      if (auth?.currentUser) {
        try {
          authToken = await auth.currentUser.getIdToken(true);
        } catch (tokenErr) {
          console.warn(`[TRACE:${traceId}] Failed to get auth token:`, tokenErr.message);
        }
      }
      
      // Use backend API to save (uses Admin SDK, bypasses security rules)
      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          userId: uid,
          project: {
            ...sanitizedProject,
            id: String(project.id),
            updatedAt: new Date().toISOString(),
            syncedAt: new Date().toISOString()
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`[TRACE:${traceId}] Project saved via API:`, project.id, result);
      return true;
    } catch (err) {
      console.error(`[TRACE:${traceId}] Failed to save project to cloud:`, err.message || err);
      toast.error(`Save failed: ${err.message || 'Network error'}`);
      return false;
    }
  };
  
  // Sync all projects to cloud via backend API (individual saves)
  const syncProjectsToCloud = async (uid, projectsToSync) => {
    if (!uid || !Array.isArray(projectsToSync) || projectsToSync.length === 0) return;
    setProjectsSyncing(true);
    
    try {
      // Save projects individually via backend API
      let successCount = 0;
      for (const project of projectsToSync) {
        if (!project || !project.id) continue;
        
        try {
          const success = await saveProjectToCloud(uid, project);
          if (success) successCount++;
        } catch (individualErr) {
          console.error(`Failed to save project ${project?.id}:`, individualErr);
        }
      }
      
      if (successCount > 0) {
        setLastSyncTime(new Date());
        console.log(`Synced ${successCount}/${projectsToSync.length} projects to cloud via API`);
      } else if (projectsToSync.length > 0) {
        toast.error('Failed to sync projects - check your connection');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      toast.error('Failed to sync projects');
    } finally {
      setProjectsSyncing(false);
    }
  };

  // Note: localStorage save is handled by the useEffect with quota handling below
  
  // Debounced cloud sync when projects change (only if logged in)
  useEffect(() => {
    if (!user?.uid || projects.length === 0) return;
    
    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Debounce sync by 3 seconds to avoid excessive writes
    syncTimeoutRef.current = setTimeout(() => {
      syncProjectsToCloud(user.uid, projects);
    }, 3000);
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [projects, user?.uid]);
  
  // Load projects from cloud via backend API
  const loadProjectsFromCloud = async (uid) => {
    const traceId = `LOAD-${Date.now()}`;
    console.log(`[TRACE:${traceId}] loadProjectsFromCloud START`, { hasUid: !!uid });
    
    if (!uid) return [];
    try {
      // Get auth token
      let authToken = null;
      if (auth?.currentUser) {
        try {
          authToken = await auth.currentUser.getIdToken(true);
        } catch (tokenErr) {
          console.warn(`[TRACE:${traceId}] Failed to get auth token:`, tokenErr.message);
        }
      }
      
      // Use backend API to load projects
      const response = await fetch(`${BACKEND_URL}/api/projects?userId=${encodeURIComponent(uid)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const cloudProjects = (data.projects || []).map(p => ({
        ...p,
        id: p.id || String(Date.now()),
        // Normalize timestamps
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString()
      }));
      
      console.log(`[TRACE:${traceId}] loadProjectsFromCloud COMPLETE`, {
        count: cloudProjects.length,
        projects: cloudProjects.map(p => ({
          id: p.id,
          name: p.name,
          assetCount: p.assets?.length || 0,
          assetTypes: p.assets?.map(a => a.type)
        }))
      });
      
      return cloudProjects;
    } catch (err) {
      console.error(`[TRACE:${traceId}] loadProjectsFromCloud ERROR:`, err);
      return [];
    }
  };
  
  // Merge local and cloud projects (cloud takes priority for conflicts)
  const mergeProjects = (localProjects, cloudProjects) => {
    const merged = new Map();
    const local = Array.isArray(localProjects) ? localProjects : [];
    const cloud = Array.isArray(cloudProjects) ? cloudProjects : [];
    
    // Add all cloud projects first (they take priority)
    for (const project of cloud) {
      if (project && project.id) {
        merged.set(project.id, project);
      }
    }
    
    // Add local projects that aren't in cloud
    for (const project of local) {
      if (!project || !project.id) continue;
      if (!merged.has(project.id)) {
        merged.set(project.id, project);
      } else {
        // Compare timestamps, keep newer
        const cloudProject = merged.get(project.id);
        const localTime = new Date(project.updatedAt || project.createdAt || 0).getTime();
        const cloudTime = new Date(cloudProject.updatedAt || cloudProject.createdAt || 0).getTime();
        if (localTime > cloudTime) {
          merged.set(project.id, project);
        }
      }
    }
    
    // Sort by updated time
    return Array.from(merged.values()).sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  };
  
  // Studio Orchestrator State (New Clean Interface)
  const [showOrchestrator, setShowOrchestrator] = useState(false);
  
  // Studio Session State (Global Mechanism)
  const [showStudioSession, setShowStudioSession] = useState(false);
  const [sessionTracks, setSessionTracks] = useState({ 
    audio: null, 
    vocal: null, 
    visual: null,
    audioVolume: 0.8,
    vocalVolume: 1.0,
    // Professional sync settings
    bpm: 120,
    timeSignature: '4/4',
    key: 'C Major',
    frameRate: 30,
    aspectRatio: '16:9',
    sampleRate: 48000,
    bitDepth: 24,
    syncLocked: true,
    // Real assets toggle
    generateRealAssets: false,
    // Render tracking
    renderCount: 0,
    maxRenders: 3,
    lastRenderTime: null,
    renderHistory: []
  });
  const [sessionHistory, setSessionHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sessionPlaying, setSessionPlaying] = useState(false);

  // History Helpers
  const updateSessionWithHistory = (newTracksOrUpdater) => {
    let newTracks;
    if (typeof newTracksOrUpdater === 'function') {
      newTracks = newTracksOrUpdater(sessionTracks);
    } else {
      newTracks = newTracksOrUpdater;
    }

    const newHistory = sessionHistory.slice(0, historyIndex + 1);
    newHistory.push(newTracks);
    setSessionHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSessionTracks(newTracks);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSessionTracks(sessionHistory[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < sessionHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSessionTracks(sessionHistory[newIndex]);
    }
  };
  
  const [expandedNews, setExpandedNews] = useState(new Set());
  const [allNewsExpanded, setAllNewsExpanded] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState(null);
  const [helpSearch, setHelpSearch] = useState('');
  const [showNudge, setShowNudge] = useState(true);
  // Reserved for future use: const [hubFilter, setHubFilter] = useState('All');
  const [playingItem, setPlayingItem] = useState(null);
  
  // Preview Modal State (for reviewing AI generations before saving)
  // Reserved for future use: const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewPrompt, setPreviewPrompt] = useState('');
  const [previewView, setPreviewView] = useState('lyrics'); // 'lyrics' or 'prompt' toggle
  const [isSaving, setIsSaving] = useState(false); // Saving/syncing state with animated loader
  const [agentPreviews, setAgentPreviews] = useState({}); // Cache last generation per agent
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  const [showVoiceCommandPalette, setShowVoiceCommandPalette] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [lastVoiceCommand, setLastVoiceCommand] = useState(null);
  const [voiceSettings, setVoiceSettings] = useState({
    gender: 'male',
    region: 'US',
    language: 'English',
    style: 'rapper',           // rapper, rapper-female, singer, narrator, spoken
    rapStyle: 'aggressive',    // aggressive, chill, melodic, fast, trap, oldschool, storytelling, hype
    voiceName: 'rapper-male-1'
  });
  
  // Voice Command Definitions for Whisperer-style UI
  const VOICE_COMMANDS = [
    { command: 'open [agent]', description: 'Launch an agent', example: '"Open Ghostwriter"', category: 'Navigation' },
    { command: 'go to [section]', description: 'Navigate to dashboard, hub, news, agents', example: '"Go to hub"', category: 'Navigation' },
    { command: 'generate', description: 'Start generation with current prompt', example: '"Generate"', category: 'Actions' },
    { command: 'clear', description: 'Clear the prompt', example: '"Clear prompt"', category: 'Actions' },
    { command: 'read back', description: 'Read the prompt aloud', example: '"Read back"', category: 'Actions' },
    { command: 'switch theme', description: 'Toggle dark/light mode', example: '"Switch theme"', category: 'Settings' },
    { command: 'stop', description: 'Stop listening', example: '"Stop listening"', category: 'Voice' }
  ];
  const [showExternalSaveModal, setShowExternalSaveModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  // user state moved to top of component (before cloud sync useEffect)
  const [userPlan, setUserPlan] = useState(() => localStorage.getItem('studio_user_plan') || 'Free');
  
  // Free generation tracking (3 free before requiring login/payment)
  const [freeGenerationsUsed, setFreeGenerationsUsed] = useState(() => {
    const stored = localStorage.getItem('studio_free_generations');
    return stored ? parseInt(stored, 10) : 0;
  });
  const FREE_GENERATION_LIMIT = 3;
  
  // Persist free generations
  useEffect(() => {
    localStorage.setItem('studio_free_generations', freeGenerationsUsed.toString());
  }, [freeGenerationsUsed]);
  
  // Get agents available for current tier
  const getAvailableAgents = () => {
    const plan = userPlan.toLowerCase();
    if (plan === 'pro' || plan === 'lifetime access') return AGENTS; // All 16 agents
    if (plan === 'monthly') return AGENTS.filter(a => a.tier === 'free' || a.tier === 'monthly'); // 8 agents
    return AGENTS.filter(a => a.tier === 'free'); // 4 agents for free tier
  };
  
  // Get locked agents for teaser section
  const getLockedAgents = () => {
    if (isAdmin) return []; // Admins have all agents
    const plan = userPlan.toLowerCase();
    if (plan === 'pro' || plan === 'lifetime access') return []; // No locked agents
    if (plan === 'monthly') return AGENTS.filter(a => a.tier === 'pro'); // Only pro locked
    return AGENTS.filter(a => a.tier !== 'free'); // Monthly + Pro locked
  };
  
  // Check if user can generate (has free uses left or is subscribed)
  const canGenerate = () => {
    if (isAdmin) return true; // Admins always have access
    const plan = userPlan.toLowerCase();
    if (plan === 'monthly' || plan === 'pro' || plan === 'lifetime access') return true;
    if (isLoggedIn && userCredits > 0) return true;
    return freeGenerationsUsed < FREE_GENERATION_LIMIT;
  };
  
  // Get remaining free generations
  const getRemainingFreeGenerations = () => {
    if (isAdmin) return 999999; // Unlimited for admins
    return Math.max(0, FREE_GENERATION_LIMIT - freeGenerationsUsed);
  };

  useEffect(() => {
    localStorage.setItem('studio_user_plan', userPlan);
  }, [userPlan]);
  const [showAgentHelpModal, setShowAgentHelpModal] = useState(null); // Stores the agent object for the help modal
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [quickWorkflowAgent, setQuickWorkflowAgent] = useState(null); // Streamlined agent workflow modal
  // Reserved for future use: const [expandedWelcomeFeature, setExpandedWelcomeFeature] = useState(null);
  const [autoStartVoice, setAutoStartVoice] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [pendingProjectNav, setPendingProjectNav] = useState(false); // Flag to safely navigate after project selection

  // Effect to safely navigate to project_canvas after selectedProject is set
  // This prevents race conditions where tab changes before state update completes
  useEffect(() => {
    if (pendingProjectNav && selectedProject) {
      console.log('[StudioView] Safe navigation: project ready, switching to project_canvas');
      setActiveTab('project_canvas');
      setPendingProjectNav(false);
    }
  }, [pendingProjectNav, selectedProject]);

  // Onboarding & Help State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProjectChoiceModal, setShowProjectChoiceModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedPath, setSelectedPath] = useState(null);
  // Reserved for future use: const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showAgentWhitePaper, setShowAgentWhitePaper] = useState(null);
  const [showResourceContent, setShowResourceContent] = useState(null); // For Legal & Business docs
  const [maintenanceDismissed, setMaintenanceDismissed] = useState(false);
  
  // Track generated creations per agent for preview in agent details
  const [agentCreations, setAgentCreations] = useState({
    // Format: { agentId: { video: url, image: url, audio: url } }
  });
  
  // Asset preview state - enhanced with navigation
  const [showPreview, setShowPreview] = useState(null); // { type: 'audio'|'video'|'image', url, title, asset, assets, currentIndex }
  const [canvasPreviewAsset, setCanvasPreviewAsset] = useState(null); // For Project Canvas embedded player
  
  // Audio refs to prevent re-render interruption
  const previewAudioRef = useRef(null);
  const canvasAudioRef = useRef(null);
  
  // Transition guard ref (doesn't cause re-render)
  const isModalTransitioning = useRef(false);

  // Audio Export/Mastering State
  const [showExportModal, setShowExportModal] = useState(null); // Stores audio item to export
  const [exportPreset, setExportPreset] = useState('streaming');
  const [isExporting, setIsExporting] = useState(false);

  // Add Asset to Project Modal State
  const [addToProjectAsset, setAddToProjectAsset] = useState(null); // Asset waiting to be added to project
  const [newProjectNameFromAsset, setNewProjectNameFromAsset] = useState('');

  // Model Picker State - Available AI Models
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const AI_MODELS = [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', description: 'Fastest responses, great for quick tasks', tier: 'free', speed: '⚡⚡⚡', quality: '★★★☆' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', provider: 'Google', description: 'Ultra-fast, cost-effective', tier: 'free', speed: '⚡⚡⚡⚡', quality: '★★☆☆' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', description: 'Best quality for complex prompts', tier: 'pro', speed: '⚡⚡', quality: '★★★★' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', description: 'Balanced speed and quality', tier: 'free', speed: '⚡⚡⚡', quality: '★★★☆' },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B', provider: 'Google', description: 'Lightweight, efficient', tier: 'free', speed: '⚡⚡⚡⚡', quality: '★★☆☆' },
    { id: 'gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro (Preview)', provider: 'Google', description: 'Latest capabilities, experimental', tier: 'pro', speed: '⚡⚡', quality: '★★★★★' },
    { id: 'gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash (Preview)', provider: 'Google', description: 'Next-gen speed + quality', tier: 'pro', speed: '⚡⚡⚡', quality: '★★★★' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Excellent for creative writing', tier: 'pro', speed: '⚡⚡', quality: '★★★★★' },
    { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', description: 'Fast and capable', tier: 'pro', speed: '⚡⚡⚡', quality: '★★★★' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Multimodal powerhouse', tier: 'pro', speed: '⚡⚡', quality: '★★★★★' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Affordable GPT-4 class', tier: 'pro', speed: '⚡⚡⚡', quality: '★★★★' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'High capability, larger context', tier: 'pro', speed: '⚡⚡', quality: '★★★★★' },
    { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Meta', description: 'Open-source powerhouse', tier: 'pro', speed: '⚡⚡', quality: '★★★★' },
    { id: 'llama-3.2-90b-vision', name: 'Llama 3.2 90B Vision', provider: 'Meta', description: 'Multimodal open model', tier: 'pro', speed: '⚡', quality: '★★★★' },
    { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', description: 'European excellence', tier: 'pro', speed: '⚡⚡', quality: '★★★★' },
    { id: 'codestral', name: 'Codestral', provider: 'Mistral', description: 'Optimized for code generation', tier: 'pro', speed: '⚡⚡⚡', quality: '★★★★' },
    { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', description: 'Cost-effective reasoning', tier: 'free', speed: '⚡⚡⚡', quality: '★★★★' },
    { id: 'qwen-2.5-72b', name: 'Qwen 2.5 72B', provider: 'Alibaba', description: 'Multilingual excellence', tier: 'pro', speed: '⚡⚡', quality: '★★★★' }
  ];

  // Get recommendation based on selected path
  const getRecommendedAgents = () => {
    if (!selectedPath) return [];
    const goal = goalOptions.find(g => g.id === selectedPath);
    return goal?.agents || [];
  };

  // Get primary recommendation (first agent for selected path)
  const getRecommendation = () => {
    if (!selectedPath) return null;
    const goal = goalOptions.find(g => g.id === selectedPath);
    if (!goal || !goal.agents || goal.agents.length === 0) return null;
    return goal.agents[0]; // Primary recommendation
  };

  // Check for first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('studio_onboarding_v3');
    if (!hasSeenOnboarding && !startWizard) {
      setShowOnboarding(true);
    }
  }, [startWizard]);

  const completeOnboarding = (launchRecommended = false) => {
    localStorage.setItem('studio_onboarding_v3', 'true');
    setShowOnboarding(false);
    
    // Create project directly from onboarding data
    const recommendedAgents = getRecommendedAgents();
    const agentObjects = recommendedAgents.map(id => AGENTS.find(a => a.id === id)).filter(Boolean);
    
    const newProject = {
      id: String(Date.now()),
      name: userProfile.stageName ? `${userProfile.stageName}'s Project` : `Project ${projects.length + 1}`,
      category: selectedPath === 'write' ? 'pro' : selectedPath === 'produce' ? 'vybing' : selectedPath === 'grow' ? 'social' : 'mixtapes',
      description: `Created from ${selectedPath || 'explore'} goal`,
      agents: agentObjects,
      workflow: 'custom',
      date: new Date().toLocaleDateString(),
      status: 'Active',
      progress: 0,
      assets: [],
      context: {}
    };

    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject);
    
    // Prompt login if not logged in
    if (!isLoggedIn) {
      setShowLoginModal(true);
    }
    
    // Take user to agents tab (agent-first experience)
    setActiveTab('agents');
    
    // If launching recommended agent, open it directly
    if (launchRecommended && agentObjects.length > 0) {
      setSelectedAgent(agentObjects[0]);
      handleTextToVoice(`Welcome! Launching ${agentObjects[0].name} to get you started.`);
    } else {
      handleTextToVoice('Welcome to your studio. Pick an agent to start creating.');
    }
  };

  const handleSkipOnboarding = () => {
    localStorage.setItem('studio_onboarding_v3', 'true');
    setShowOnboarding(false);
    // Just let them explore
  };

  // Project Wizard State
  // Note: If startWizard is true (from landing page), we show the choice modal instead
  // so users always get the choice between wizard and manual creation
  const [showProjectWizard, setShowProjectWizard] = useState(false);
  const [projectWizardStep, setProjectWizardStep] = useState(1);
  
  // If startWizard prop is true, open the project choice modal on mount
  useEffect(() => {
    if (startWizard) {
      setShowProjectChoiceModal(true);
    }
  }, [startWizard]);
  const [systemStatus, setSystemStatus] = useState({ status: 'healthy', message: 'All Systems Operational' });
  
  // System Health Check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`);
        if (!res.ok) throw new Error('Backend unreachable');
        const data = await res.json();
        setSystemStatus({ 
          status: 'healthy', 
          message: 'All Systems Operational',
          details: data 
        });
      } catch (err) {
        console.error("Health check failed:", err);
        setSystemStatus({ 
          status: 'maintenance', 
          message: 'System Under Maintenance',
          details: err.message
        });
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Handle initial plan from landing page
  useEffect(() => {
    if (initialPlan) {
      handleSubscribe(initialPlan);
    }
  }, [initialPlan]);

  const [newProjectData, setNewProjectData] = useState({
    name: '',
    category: '',
    description: '',
    language: 'English',
    style: 'Modern Hip-Hop',
    model: 'Gemini 2.0 Flash',
    selectedAgents: [],
    socialHandle: '',
    socialBio: '',
    socialPlatform: 'instagram'
  });

  const PROJECT_CATEGORIES = [
    { id: 'pro', label: 'Pro Studio', icon: Crown, desc: 'Full production suite', color: 'var(--color-purple)' },
    { id: 'vybing', label: 'Vybing', icon: Music, desc: 'Quick beat ideas', color: 'var(--color-cyan)' },
    { id: 'mixtapes', label: 'Mixtapes', icon: Disc, desc: 'Curated playlists', color: 'var(--color-orange)' },
    { id: 'video', label: 'Video', icon: Video, desc: 'Visual content', color: 'var(--color-pink)' },
    { id: 'scores', label: 'Scores', icon: FileMusic, desc: 'Cinematic composition', color: 'var(--color-emerald)' },
    { id: 'moves', label: 'Moves', icon: Activity, desc: 'Dance & Choreo', color: 'var(--color-yellow)' },
    { id: 'music_videos', label: 'Music Videos', icon: Film, desc: 'Full production clips', color: 'var(--color-red)' },
    { id: 'social', label: 'Social Brand', icon: Share2, desc: 'Grow your audience', color: 'var(--color-blue)' }
  ];

  const PROJECT_CREDIT_COST = 2;

  const handleCreateProject = () => {
    console.log('[CreateProject] Starting with data:', newProjectData);
    console.log('[CreateProject] Current credits:', userCredits, 'Required:', PROJECT_CREDIT_COST);
    console.log('[CreateProject] User:', user?.email, 'DB initialized:', !!db);
    
    if (!newProjectData.name || !newProjectData.category) {
      console.error('[CreateProject] Missing required fields:', { name: newProjectData.name, category: newProjectData.category });
      toast.error('Please fill in project name and category');
      return;
    }

    // Check if user has enough credits
    const currentCredits = typeof userCredits === 'number' ? userCredits : 0;
    console.log('[CreateProject] Credit check - Current:', currentCredits, 'Cost:', PROJECT_CREDIT_COST);
    
    if (currentCredits < PROJECT_CREDIT_COST) {
      console.error('[CreateProject] Insufficient credits');
      toast.error(`Not enough credits. You need ${PROJECT_CREDIT_COST} credits to create a project.`);
      setShowCreditsModal(true);
      return;
    }
    
    const newProject = {
      id: String(Date.now()),
      name: newProjectData.name,
      category: newProjectData.category,
      description: newProjectData.description || '',
      language: newProjectData.language || 'English',
      style: newProjectData.style || 'Modern Hip-Hop',
      model: newProjectData.model || 'Gemini 2.0 Flash',
      agents: newProjectData.selectedAgents || [],
      workflow: newProjectData.workflow || 'custom',
      socialHandle: newProjectData.socialHandle || '',
      socialBio: newProjectData.socialBio || '',
      socialPlatform: newProjectData.socialPlatform || 'instagram',
      date: new Date().toLocaleDateString(),
      status: 'Active',
      progress: 0,
      assets: [], // Store generated content here
      context: {} // Shared context for MAS
    };
    
    console.log('[CreateProject] New project object created:', newProject);

    // Deduct credits
    console.log('[CreateProject] Deducting credits...');
    setUserCredits(prev => {
      const newCredits = prev - PROJECT_CREDIT_COST;
      console.log('[CreateProject] Credits updated:', prev, '->', newCredits);
      return newCredits;
    });
    
    console.log('[CreateProject] Adding project to state...');
    setProjects(prev => {
      const newProjects = [newProject, ...prev];
      console.log('[CreateProject] Projects updated. Total:', newProjects.length);
      return newProjects;
    });
    
    setSelectedProject(newProject); // Auto-select the new project
    console.log('[CreateProject] Selected project set:', newProject.id);
    
    // Save to cloud if logged in (uses backend API now)
    console.log('[CreateProject] Auth check - isLoggedIn:', isLoggedIn, 'user:', !!user);
    if (isLoggedIn && user) {
      console.log('[CreateProject] Saving to cloud for user:', user.uid, user.email);
      saveProjectToCloud(user.uid, newProject).then(success => {
        console.log('[CreateProject] Cloud save result:', success);
      }).catch(err => {
        console.error('[CreateProject] Cloud save error:', err);
      });
    } else {
      console.warn('[CreateProject] NOT saving to cloud. isLoggedIn:', isLoggedIn, 'user:', !!user);
      if (isLoggedIn && !user) {
        console.error('[CreateProject] RACE CONDITION: isLoggedIn is true but user is null!');
      }
    }
    
    toast.success(`Project created! -${PROJECT_CREDIT_COST} credits`, { icon: '✨' });

    setShowProjectWizard(false);
    setProjectWizardStep(1);
    
    // Track project creation
    Analytics.projectCreated(newProject.category);
    
    // Project created successfully - go straight to dashboard
    // (User already completed onboarding before reaching wizard)

    setNewProjectData({ 
      name: '', 
      category: '', 
      description: '', 
      selectedAgents: [], 
      workflow: '',
      socialHandle: '',
      socialBio: '',
      socialPlatform: 'instagram'
    });
    
    // Switch to dashboard to show the new project checklist
    handleTextToVoice(`Project ${newProject.name} created. Loading your production checklist.`);
    setActiveTab('mystudio');
  };

  const handleSkipWizard = (targetTab) => {
    // Check if user has enough credits
    const currentCredits = typeof userCredits === 'number' ? userCredits : 0;
    if (currentCredits < PROJECT_CREDIT_COST) {
      toast.error(`Not enough credits. You need ${PROJECT_CREDIT_COST} credits to create a project.`);
      setShowCreditsModal(true);
      return;
    }

    const newProject = {
      id: String(Date.now()),
      name: `Untitled Project ${projects.length + 1}`,
      category: "music",
      description: "Quick start project",
      agents: [],
      workflow: "custom",
      date: new Date().toLocaleDateString(),
      status: 'Active',
      progress: 0,
      assets: [],
      context: {}
    };

    // Deduct credits
    setUserCredits(prev => prev - PROJECT_CREDIT_COST);
    toast.success(`Quick project created! -${PROJECT_CREDIT_COST} credits`, { icon: '✨' });

    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject);
    
    // Save to cloud if logged in
    if (user && db) {
      saveProjectToCloud(user.uid, newProject).catch(err => {
        console.error('Failed to save quick project to cloud:', err);
      });
    }

    setShowProjectWizard(false);
    setProjectWizardStep(1);
    
    // Default to 'mystudio' if targetTab is not a string (e.g. event object)
    const tabToSet = (typeof targetTab === 'string') ? targetTab : 'mystudio';
    setActiveTab(tabToSet);
    
    handleTextToVoice(`Quick project created.`);
  };

  const handleManualCreate = () => {
    handleSkipWizard();
    // Go straight to studio - user already saw onboarding if they were a new user
  };

  // Open agent whitepaper modal for any agent
  const openAgentWhitepaper = (agent) => {
    setShowAgentWhitePaper({
      key: agent.id,
      icon: agent.icon,
      title: agent.name,
      subtitle: agent.category,
      description: agent.explanation || agent.description,
      whoFor: agent.helpTips || `Artists and creators looking to leverage AI for ${agent.category.toLowerCase()}.`,
      howTo: agent.howToUse || agent.howTo || `Enter your prompt and let ${agent.name} generate results instantly.`
    });
  };

  // QuickWorkflow handlers - centralized project save flow
  const handleSaveAssetToProject = (projectId, asset) => {
    setProjects(prev => {
      const newProjects = prev.map(p => {
        if (p.id === projectId) {
          const existingAssets = p.assets || [];
          
          // Check for duplicate asset by ID or by content hash
          const isDuplicate = existingAssets.some(existing => 
            existing.id === asset.id || 
            (existing.content === asset.content && existing.type === asset.type && existing.agent === asset.agent)
          );
          
          if (isDuplicate) {
            console.log('[SaveAsset] Skipping duplicate asset:', asset.id);
            return p; // Return unchanged project
          }
          
          console.log('[SaveAsset] Adding new asset to project:', projectId, asset.id);
          return {
            ...p,
            assets: [...existingAssets, asset],
            progress: Math.min(100, (p.progress || 0) + 10),
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });

      // Save to cloud if logged in
      const updatedProject = newProjects.find(p => p.id === projectId);
      if (updatedProject && user && db) {
        saveProjectToCloud(user.uid, updatedProject).catch(err => {
          console.error('Failed to save updated project to cloud:', err);
        });
      }

      return newProjects;
    });
    
    toast.success('Asset saved to project');
  };

  const handleCreateProjectWithAsset = (projectName, asset) => {
    // Check if user has enough credits
    const currentCredits = typeof userCredits === 'number' ? userCredits : 0;
    if (currentCredits < PROJECT_CREDIT_COST) {
      toast.error(`Not enough credits. You need ${PROJECT_CREDIT_COST} credits to create a project.`);
      setShowCreditsModal(true);
      return;
    }

    const newProject = {
      id: String(Date.now()),
      name: projectName,
      category: 'pro',
      description: `Created from ${asset.agentName || asset.agent || 'AI Agent'}`,
      agents: [asset.agent], // Store ID string
      workflow: 'custom',
      date: new Date().toLocaleDateString(),
      status: 'Active',
      progress: 10,
      assets: [asset],
      context: {}
    };
    
    // Deduct credits
    setUserCredits(prev => prev - PROJECT_CREDIT_COST);
    toast.success(`Project created! -${PROJECT_CREDIT_COST} credits`, { icon: '✨' });

    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject);

    // Save to cloud if logged in
    if (user && db) {
      saveProjectToCloud(user.uid, newProject).catch(err => {
        console.error('Failed to save new project with asset to cloud:', err);
      });
    }
  };

  const handleAddAgent = (agent) => {
    if (!selectedProject || !agent) return;
    
    const currentAgents = Array.isArray(selectedProject.agents) ? selectedProject.agents : [];

    // Enforce Plan Limits (admins have no limit)
    let limit = isAdmin ? 999 : 3; // Free default
    if (!isAdmin) {
      if (userPlan === 'Creator') limit = 5;
      if (userPlan === 'Studio Pro' || userPlan === 'Lifetime Access') limit = 16;
    }

    if (currentAgents.length >= limit) {
      toast.error(`Agent limit reached for ${userPlan} plan. Please upgrade.`);
      return;
    }

    // Check if agent already exists in project
    if (currentAgents.some(a => a.id === agent.id)) {
      handleTextToVoice(`${agent.name} is already in this project.`);
      return;
    }

    const updatedProject = {
      ...selectedProject,
      agents: [...currentAgents, agent]
    };

    // Update local state
    setSelectedProject(updatedProject);
    
    // Update projects list
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    
    setShowAddAgentModal(false);
    handleTextToVoice(`${agent.name} added to project.`);
  };

  // --- FIREBASE AUTH LISTENER ---
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          // CRITICAL: Set user BEFORE setting isLoggedIn to avoid race condition
          // where isLoggedIn=true but user=null
          setUser(currentUser);
          localStorage.setItem('studio_user_id', currentUser.uid);
          setIsLoggedIn(true); // Set this LAST after user is set
          
          // Get and store token
          try {
            const token = await currentUser.getIdToken();
            setUserToken(token);
          } catch (tokenErr) {
            console.error("Error getting user token:", tokenErr);
          }
          
          // Check if admin account
          const adminStatus = isAdminEmail(currentUser.email);
          setIsAdmin(adminStatus);
          if (adminStatus) {
            console.log('🔐 Admin access granted:', currentUser.email);
            setUserPlan('Lifetime Access');
            setUserCredits(999999); // Unlimited credits for admin
            toast.success('Welcome, Administrator!', { icon: '🔐' });
          }
          
          // Fetch credits from Firestore (non-admins)
          if (db && !adminStatus) {
            try {
              const userRef = doc(db, 'users', currentUser.uid);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                const credits = userDoc.data().credits || 0;
                setUserCredits(credits);
                setUserProfile(prev => ({ ...prev, credits }));
              }
              
              // Load and merge projects from cloud
              const cloudProjects = await loadProjectsFromCloud(currentUser.uid);
              if (cloudProjects.length > 0) {
                setProjects(prev => {
                  const merged = mergeProjects(prev, cloudProjects);
                  console.log(`Merged ${prev.length} local + ${cloudProjects.length} cloud = ${merged.length} projects`);
                  return merged;
                });
                toast.success(`Synced ${cloudProjects.length} projects from cloud`);
              } else if (projects.length > 0) {
                // No cloud projects but have local - sync them up
                syncProjectsToCloud(currentUser.uid, projects);
              }
            } catch (err) {
              console.error('Failed to fetch user data:', err);
            }
          }
        } else {
          // CRITICAL: Clear user state BEFORE setting isLoggedIn to false
          setUser(null);
          setUserToken(null);
          setUserCredits(3); // Reset to trial
          localStorage.removeItem('studio_user_id');
          setIsLoggedIn(false); // Set this LAST after user is cleared
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Listen for auth modal open events from child components
  useEffect(() => {
    const handleOpenAuthModal = () => {
      setShowLoginModal(true);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, []);

  // --- AUTH STATE ---
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [userCredits, setUserCredits] = useState(3); // Default trial credits

  // Fetch user credits from Firestore
  const fetchUserCredits = async (uid) => {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setUserCredits(userDoc.data().credits || 0);
        setUserProfile(prev => ({ ...prev, credits: userDoc.data().credits || 0 }));
      } else {
        // Initialize new user with 3 trial credits
        await setDoc(userRef, { credits: 3, tier: 'free', createdAt: new Date() });
        setUserCredits(3);
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  };

  // --- LOGIN HANDLER (Google) ---
  const handleGoogleLogin = async () => {
    if (!auth) {
      toast.error('Authentication service unavailable');
      return;
    }
    setAuthLoading(true);
    const loadingToast = toast.loading('Signing in with Google...');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Close modal immediately for faster UX
      setShowLoginModal(false);
      toast.success('Welcome back!', { id: loadingToast });
      
      // Track login
      Analytics.login('google');
      
      // Fetch credits in background (don't wait)
      fetchUserCredits(result.user.uid).catch(err => 
        console.warn('Background credits fetch failed:', err)
      );
      
      if (selectedPlan) {
        handleCheckoutRedirect(selectedPlan);
      }
    } catch (error) {
      console.error('Login failed', error);
      toast.dismiss(loadingToast);
      if (error.code === 'auth/popup-closed-by-user') {
        toast('Sign-in cancelled', { icon: '👋' });
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error(`Domain not authorized. Add ${window.location.hostname} in Firebase Console.`);
      } else {
        toast.error(error.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // --- EMAIL/PASSWORD LOGIN ---
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!auth) {
      toast.error('Authentication service unavailable');
      return;
    }
    if (!authEmail || !authPassword) {
      toast.error('Please enter email and password');
      return;
    }
    setAuthLoading(true);
    try {
      let result;
      if (authMode === 'signup') {
        result = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        toast.success('Account created successfully!');
        Analytics.signUp('email');
      } else {
        result = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        toast.success('Welcome back!');
        Analytics.login('email');
      }
      await fetchUserCredits(result.user.uid);
      setShowLoginModal(false);
      setAuthEmail('');
      setAuthPassword('');
      if (selectedPlan) {
        handleCheckoutRedirect(selectedPlan);
      }
    } catch (error) {
      console.error('Auth failed', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use. Try logging in.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (error.code === 'auth/user-not-found') {
        toast.error('No account found. Try signing up.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password should be at least 6 characters');
      } else {
        toast.error(error.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // --- PASSWORD RESET ---
  const handlePasswordReset = async () => {
    if (!authEmail) {
      toast.error('Please enter your email first');
      return;
    }
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, authEmail);
      toast.success('Password reset email sent!');
      setAuthMode('login');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Reserved for future use: Legacy handler for compatibility
  // const handleLogin = handleGoogleLogin;

  // --- LOGOUT HANDLER ---
  // Reserved for future use:
  const _handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    // CRITICAL: Clear user state BEFORE setting isLoggedIn to false
    setUser(null);
    setUserToken(null);
    setUserCredits(3);
    localStorage.removeItem('studio_user_id');
    setIsLoggedIn(false); // Set this LAST
    setActiveTab('landing'); 
    onBack?.(); 
  };

  // Dashboard State
  const [dashboardTab, setDashboardTab] = useState('overview');
  const [managedAgents, setManagedAgents] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_managed_agents');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Re-attach icons from AGENTS source of truth
        return parsed.map(p => {
          const original = AGENTS.find(a => a.name === p.name);
          return { ...p, icon: original ? original.icon : Sparkles };
        });
      }
      return (typeof AGENTS !== 'undefined' ? AGENTS.map(a => ({ ...a, visible: true })) : []);
    } catch (e) {
      console.error("Failed to parse managed agents", e);
      return (typeof AGENTS !== 'undefined' ? AGENTS.map(a => ({ ...a, visible: true })) : []);
    }
  });
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_app_settings');
      const defaults = {
        showNews: true,
        publicActivity: true,
        autoSave: true,
        highQualityPreviews: false,
        streamerMode: false
      };
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (e) {
      console.error("Failed to parse app settings", e);
      return {
        showNews: true,
        publicActivity: true,
        autoSave: true,
        highQualityPreviews: false,
        streamerMode: false
      };
    }
  });

  // Persist Dashboard State
  useEffect(() => {
    localStorage.setItem('studio_managed_agents', JSON.stringify(managedAgents));
  }, [managedAgents]);

  useEffect(() => {
    localStorage.setItem('studio_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  const toggleAgentVisibility = (agentName) => {
    setManagedAgents(prev => prev.map(a => 
      a.name === agentName ? { ...a, visible: !a.visible } : a
    ));
  };

  const toggleAppSetting = (key) => {
    setAppSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  // Activity Wall Pagination State
  const [activityPage, setActivityPage] = useState(1);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [hasMoreActivity, setHasMoreActivity] = useState(true);
  const [activityFeed, setActivityFeed] = useState([]);
  const [activitySection, setActivitySection] = useState(() => localStorage.getItem('musicHubSection') || 'all');

  // News Pagination State
  const [newsPage, setNewsPage] = useState(1);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [newsArticles, setNewsArticles] = useState([]);

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_user_profile');
      return saved ? JSON.parse(saved) : {
        stageName: '',
        genre: 'Hip Hop / Rap',
        targetDemographic: 'Gen Z',
        language: 'English',
        bio: '',
        credits: 500,
        memberSince: new Date().getFullYear(),
        plan: 'Free',
        location: 'Los Angeles, CA',
        website: ''
      };
    } catch (_e) {
      return {
        stageName: '',
        genre: 'Hip Hop / Rap',
        bio: '',
        credits: 500,
        memberSince: new Date().getFullYear(),
        plan: 'Free',
        location: 'Los Angeles, CA',
        website: ''
      };
    }
  });

  // Simulated Performance Data (for Board Demo)
  const [performanceStats] = useState({
    listeners: 12450,
    streams: 45200,
    followers: 890,
    growth: '+12%'
  });

  useEffect(() => {
    localStorage.setItem('studio_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  const [socialConnections, setSocialConnections] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_agents_socials');
      return saved ? JSON.parse(saved) : {
        instagram: false,
        tiktok: false,
        twitter: false,
        spotify: false
      };
    } catch (_e) {
      return {
        instagram: false,
        tiktok: false,
        twitter: false,
        spotify: false
      };
    }
  });
  const [twitterUsername, setTwitterUsername] = useState(() => localStorage.getItem('studio_agents_twitter_user'));
  const [metaName, setMetaName] = useState(() => localStorage.getItem('studio_agents_meta_name'));
  const [storageConnections, setStorageConnections] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_agents_storage');
      return saved ? JSON.parse(saved) : {
        googleDrive: false,
        dropbox: false,
        oneDrive: false,
        localDevice: true
      };
    } catch (_e) {
      return {
        googleDrive: false,
        dropbox: false,
        oneDrive: false,
        localDevice: true
      };
    }
  });

  const [paymentMethods, setPaymentMethods] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_agents_payments');
      return saved ? JSON.parse(saved) : [
        { id: 'pm_1', type: 'Visa', last4: '4242', expiry: '12/26', isDefault: true },
        { id: 'pm_2', type: 'Mastercard', last4: '8888', expiry: '09/25', isDefault: false }
      ];
    } catch (_e) {
      return [
        { id: 'pm_1', type: 'Visa', last4: '4242', expiry: '12/26', isDefault: true },
        { id: 'pm_2', type: 'Mastercard', last4: '8888', expiry: '09/25', isDefault: false }
      ];
    }
  });

  const [bankAccounts, setBankAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_agents_banks');
      return saved ? JSON.parse(saved) : [
        { id: 'ba_1', bankName: 'Chase Bank', last4: '1234', type: 'Checking' }
      ];
    } catch (_e) {
      return [
        { id: 'ba_1', bankName: 'Chase Bank', last4: '1234', type: 'Checking' }
      ];
    }
  });

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null); // { item, type }
  const [paymentType, setPaymentType] = useState('card'); // 'card' or 'bank'
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to Studio Agents', message: 'Start creating your first track!', time: 'Just now', read: false },
    { id: 2, title: 'Pro Tip', message: 'Try the Ghostwriter agent for lyrics.', time: '2m ago', read: false }
  ]);

  // Reserved for future use:
  const _addNotification = (title, message) => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Persist payment state
  useEffect(() => {
    localStorage.setItem('studio_agents_payments', JSON.stringify(paymentMethods));
    localStorage.setItem('studio_agents_banks', JSON.stringify(bankAccounts));
  }, [paymentMethods, bankAccounts]);

  // Persist social state
  useEffect(() => {
    localStorage.setItem('studio_agents_socials', JSON.stringify(socialConnections));
    localStorage.setItem('studio_agents_storage', JSON.stringify(storageConnections));
    if (twitterUsername) localStorage.setItem('studio_agents_twitter_user', twitterUsername);
    if (metaName) localStorage.setItem('studio_agents_meta_name', metaName);
  }, [socialConnections, twitterUsername, metaName, storageConnections]);

  // Handle Social OAuth Callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Twitter Callback
    if (params.get('twitter_connected') === 'true') {
      const username = params.get('twitter_username');
      setSocialConnections(prev => ({ ...prev, twitter: true }));
      setTwitterUsername(username);
      
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      toast.success(`Connected to X/Twitter as @${username}!`);
    }

    // Meta Callback (Insta/FB)
    if (params.get('meta_connected') === 'true') {
      const name = params.get('meta_name');
      setSocialConnections(prev => ({ ...prev, instagram: true, facebook: true }));
      setMetaName(name);
      
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      toast.success(`Connected to Meta as ${name}!`);
    }
  }, []);

  // --- STRIPE CHECKOUT ---
  const handleCheckoutRedirect = async (plan) => {
    if (!isLoggedIn || !user) {
      toast.error('Please log in first');
      setShowLoginModal(true);
      return;
    }

    const tierMap = {
      'Creator': 'creator',
      'Studio Pro': 'studio',
      'Lifetime Access': 'lifetime'
    };
    const tier = tierMap[plan.name] || 'creator';

    try {
      toast.loading('Redirecting to checkout...');
      const response = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          userId: user.uid,
          userEmail: user.email,
          successUrl: window.location.origin + '?payment=success',
          cancelUrl: window.location.origin + '?payment=cancelled'
        })
      });

      const data = await response.json();
      toast.dismiss();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        toast.error(data.error);
      } else {
        toast.error('Could not create checkout session');
      }
    } catch (err) {
      toast.dismiss();
      console.error('Checkout error:', err);
      toast.error('Payment system unavailable. Please try again later.');
    }
  };

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    if (isLoggedIn) {
      handleCheckoutRedirect(plan);
    } else {
      setShowLoginModal(true);
    }
  };

  // --- PROFESSIONAL VOICE & TRANSLATION LOGIC (Whisperer-style) ---
  
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Pending prompt to apply when agent view renders (for re-run functionality)
  const [pendingPrompt, setPendingPrompt] = useState(null);
  
  // Apply pending prompt when agent view becomes active
  useEffect(() => {
    if (pendingPrompt && selectedAgent && activeTab === 'agents') {
      // Wait for textarea to render, then set value
      setTimeout(() => {
        const textarea = textareaRef.current || document.querySelector('.studio-textarea');
        if (textarea) {
          textarea.value = pendingPrompt;
          textarea.focus();
        }
        setPendingPrompt(null);
      }, 100);
    }
  }, [pendingPrompt, selectedAgent, activeTab]);

  const handleVoiceToText = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setVoiceTranscript('');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported. Try Chrome or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceSettings.language === 'English' ? 'en-US' : 
                      voiceSettings.language === 'Spanish' ? 'es-ES' :
                      voiceSettings.language === 'French' ? 'fr-FR' :
                      voiceSettings.language === 'German' ? 'de-DE' :
                      voiceSettings.language === 'Japanese' ? 'ja-JP' : 'en-US';
    
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('🎤 Listening... Say a command or dictate your prompt', { duration: 2000 });
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setVoiceTranscript('');
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setVoiceTranscript('');
      if (event.error !== 'aborted') {
        toast.error(`Voice error: ${event.error}`);
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript = transcript;
        }
      }
      
      // Show real-time interim results (Whisperer-style feedback)
      if (interimTranscript) {
        setVoiceTranscript(interimTranscript);
      }
      
      if (!finalTranscript) return;
      
      const transcript = finalTranscript.toLowerCase().trim();
      setVoiceTranscript('');
      setLastVoiceCommand({ text: finalTranscript, time: new Date().toLocaleTimeString() });
      
      // --- VOICE COMMAND PROCESSING ---
      
      // Stop listening command
      if (transcript.includes('stop listening') || transcript.includes('stop voice') || transcript === 'stop' || transcript === 'cancel') {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
        handleTextToVoice("Voice control stopped.");
        return;
      }
      
      // Open/Launch agent commands
      if (transcript.includes('open') || transcript.includes('launch')) {
        const agentName = transcript.replace('open', '').replace('launch', '').trim();
        const foundAgent = AGENTS.find(a => a.name.toLowerCase().includes(agentName));
        if (foundAgent) {
          setSelectedAgent(foundAgent);
          setActiveTab('agents');
          toast.success(`🚀 Launching ${foundAgent.name}`);
          handleTextToVoice(`Launching ${foundAgent.name}.`);
          return;
        }
      }

      // Navigation commands
      if (transcript.includes('go to') || transcript.includes('show me') || transcript.includes('navigate')) {
        let navigated = false;
        if (transcript.includes('dashboard') || transcript.includes('studio') || transcript.includes('home')) {
          setActiveTab('mystudio');
          toast.success('📊 Dashboard');
          handleTextToVoice("Navigating to your dashboard.");
          navigated = true;
        } else if (transcript.includes('hub') || transcript.includes('projects')) {
          setActiveTab('hub');
          toast.success('📁 Project Hub');
          handleTextToVoice("Opening the Project Hub.");
          navigated = true;
        } else if (transcript.includes('news')) {
          setActiveTab('news');
          toast.success('📰 Industry Pulse');
          handleTextToVoice("Checking the latest industry pulse.");
          navigated = true;
        } else if (transcript.includes('help') || transcript.includes('support')) {
          setActiveTab('support');
          toast.success('💡 Help Center');
          handleTextToVoice("How can I help you today?");
          navigated = true;
        } else if (transcript.includes('agents') || transcript.includes('tools')) {
          setActiveTab('agents');
          toast.success('🤖 Agents');
          handleTextToVoice("Viewing all available agents.");
          navigated = true;
        }
        if (navigated) return;
      }

      // Theme toggle
      if (transcript.includes('switch theme') || transcript.includes('toggle theme') || transcript.includes('light mode') || transcript.includes('dark mode')) {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('studio_theme', newTheme);
        toast.success(`🎨 ${newTheme === 'dark' ? 'Dark' : 'Light'} mode`);
        handleTextToVoice(`Switching to ${newTheme} mode.`);
        return;
      }

      // Generate command
      if (transcript === 'generate' || transcript.includes('start generation') || transcript.includes('create now') || transcript.includes('make it')) {
        const textarea = textareaRef.current || document.querySelector('.studio-textarea');
        if (textarea && textarea.value.trim()) {
          handleGenerate();
          toast.success('⚡ Generating...');
          handleTextToVoice("Starting generation.");
        } else {
          toast.error('Please enter a prompt first');
          handleTextToVoice("Please enter a prompt first.");
        }
        return;
      }
      
      // Clear prompt command
      if (transcript.includes('clear prompt') || transcript.includes('clear text') || transcript.includes('start over') || transcript === 'clear') {
        const textarea = textareaRef.current || document.querySelector('.studio-textarea');
        if (textarea) {
          textarea.value = '';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          toast.success('🗑️ Prompt cleared');
          handleTextToVoice("Prompt cleared.");
        }
        return;
      }
      
      // Read back command
      if (transcript.includes('read back') || transcript.includes('read prompt') || transcript.includes('what did i write') || transcript.includes('read it')) {
        const textarea = textareaRef.current || document.querySelector('.studio-textarea');
        if (textarea && textarea.value.trim()) {
          handleTextToVoice(textarea.value);
        } else {
          handleTextToVoice("The prompt is empty.");
        }
        return;
      }
      
      // Show voice commands
      if (transcript.includes('show commands') || transcript.includes('voice commands') || transcript.includes('what can i say') || transcript.includes('help commands')) {
        setShowVoiceCommandPalette(true);
        handleTextToVoice("Here are the available voice commands.");
        return;
      }

      // Payment commands
      if (transcript.includes('add payment') || transcript.includes('billing') || transcript.includes('manage card')) {
        setActiveTab('mystudio');
        setShowAddPaymentModal(true);
        handleTextToVoice("Opening payment management.");
        return;
      }

      // Default: Append to textarea as dictation
      const textarea = textareaRef.current || document.querySelector('.studio-textarea');
      if (textarea) {
        const newText = (textarea.value + ' ' + finalTranscript).trim();
        textarea.value = newText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        // Brief visual feedback
        toast.success(`✏️ Added: "${finalTranscript.substring(0, 30)}${finalTranscript.length > 30 ? '...' : ''}"`, { duration: 1500 });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Effect to handle auto-start of voice when opening agent from grid
  useEffect(() => {
    if (selectedAgent && autoStartVoice) {
      // Wait for view transition
      const timer = setTimeout(() => {
        handleVoiceToText();
        setAutoStartVoice(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedAgent, autoStartVoice]);

  const handleTextToVoice = (textInput) => {
    if (isSpeaking && (!textInput || typeof textInput !== 'string')) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // If textInput is an event or not a string, use the textarea value
    const textToSpeak = (typeof textInput === 'string') ? textInput : (textareaRef.current?.value || document.querySelector('.studio-textarea')?.value);
    if (!textToSpeak) return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const speak = (voices) => {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      let selectedVoice = null;

      // Filter by language and gender/region
      const langCode = voiceSettings.language === 'English' ? 'en' : 
                      voiceSettings.language === 'Spanish' ? 'es' :
                      voiceSettings.language === 'French' ? 'fr' :
                      voiceSettings.language === 'German' ? 'de' :
                      voiceSettings.language === 'Japanese' ? 'ja' : 'en';

      const filteredVoices = voices.filter(v => v.lang.startsWith(langCode));
      
      // Try to find a match for gender/region
      if (voiceSettings.region === 'UK') {
        selectedVoice = filteredVoices.find(v => v.name.includes('UK') || v.name.includes('British'));
      } else if (voiceSettings.region === 'AU') {
        selectedVoice = filteredVoices.find(v => v.name.includes('Australia'));
      } else if (voiceSettings.region === 'IN') {
        selectedVoice = filteredVoices.find(v => v.name.includes('India'));
      }

      // If no region match, try gender
      if (!selectedVoice) {
        if (voiceSettings.gender === 'female') {
          selectedVoice = filteredVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('victoria'));
        } else {
          selectedVoice = filteredVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('daniel'));
        }
      }

      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.lang = langCode;
      utterance.rate = 0.9; // Slightly slower for "Studio" feel
      utterance.pitch = voiceSettings.gender === 'female' ? 1.1 : 0.9;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speak(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        speak(voices);
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  };

  // State for AI vocal generation
  const [isCreatingVocal, setIsCreatingVocal] = useState(false);

  // Create AI Vocal from text using Uberduck TTS API (NOT browser TTS)
  const handleCreateAIVocal = async (textContent, sourceAgent = 'Ghostwriter') => {
    if (!textContent || textContent.trim().length === 0) {
      toast.error('No text content to vocalize');
      return;
    }

    setIsCreatingVocal(true);
    const toastId = toast.loading('Creating AI vocal...');

    try {
      // Build headers with auth token if logged in
      const headers = { 'Content-Type': 'application/json' };
      if (isLoggedIn && auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } catch (err) {
          console.warn('Could not get auth token:', err);
        }
      }

      // Trim text to reasonable length for vocals (1500 chars for Suno, 2000 for fallback)
      const textToSpeak = textContent.substring(0, 1500);

      console.log('[handleCreateAIVocal] Generating REAL AI vocal via Suno/Bark for:', textToSpeak.substring(0, 50) + '...');

      const response = await fetch(`${BACKEND_URL}/api/generate-speech`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: textToSpeak,
          voice: voiceSettings.voiceName || 'rapper-male-1',
          style: voiceSettings.style || 'rapper',  // rapper, rapper-female, singer, singer-female
          rapStyle: voiceSettings.rapStyle || 'aggressive',  // aggressive, melodic, trap, drill, boom-bap, fast, chill, hype
          genre: voiceSettings.genre || 'hip-hop'  // hip-hop, r&b, pop, soul, trap, drill
        })
      });

      const data = await response.json();

      if (data.audioUrl) {
        // Instead of creating a NEW item, ADD the audio to the EXISTING preview item
        // This consolidates lyrics + vocal into ONE card
        if (previewItem) {
          const consolidatedItem = {
            ...previewItem,
            audioUrl: data.audioUrl,
            mimeType: data.mimeType || 'audio/wav',
            type: 'vocal', // Upgrade type to vocal (has both text + audio)
            vocalSnippet: `🎤 AI Vocal created from lyrics`,
            updatedAt: new Date().toISOString()
          };

          // Update the preview with consolidated item
          setPreviewItem(consolidatedItem);
          
          // Also update agent previews cache
          if (selectedAgent?.id) {
            setAgentPreviews(prev => ({ ...prev, [selectedAgent.id]: consolidatedItem }));
          }
          
          toast.success('AI vocal added to your creation!', { id: toastId });
          return consolidatedItem;
        } else {
          // Fallback: Create standalone vocal item if no preview exists
          const vocalItem = {
            id: String(Date.now()),
            title: `AI Vocal - ${sourceAgent}`,
            agent: sourceAgent,
            type: 'vocal',
            audioUrl: data.audioUrl,
            mimeType: data.mimeType || 'audio/wav',
            snippet: `🎤 AI Vocal: "${textToSpeak.substring(0, 50)}..."`,
            createdAt: new Date().toISOString()
          };

          setPreviewItem(vocalItem);
          toast.success('AI vocal created!', { id: toastId });
          return vocalItem;
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('No audio URL returned');
      }
    } catch (error) {
      console.error('[handleCreateAIVocal] Error:', error);
      toast.error(error.message || 'Failed to create AI vocal', { id: toastId });
      return null;
    } finally {
      setIsCreatingVocal(false);
    }
  };

  const handleDeletePayment = (id, type) => {
    if (window.confirm('Are you sure you want to remove this payment method?')) {
      if (type === 'card') {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
      } else {
        setBankAccounts(prev => prev.filter(ba => ba.id !== id));
      }
      handleTextToVoice('Payment method removed.');
    }
  };

  // Reserved for future use:
  const _handleEditPayment = (item, type) => {
    setEditingPayment({ item, type });
    setPaymentType(type);
    setShowAddPaymentModal(true);
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (paymentType === 'card') {
      const cardNumber = formData.get('cardNumber');
      const expiry = formData.get('expiry');
      
      // Basic validation
      if (cardNumber.length < 12) {
        toast.error('Please enter a valid card number');
        return;
      }

      const newPM = {
        id: editingPayment ? editingPayment.item.id : `pm_${Date.now()}`,
        type: 'Visa', // In a real app, detect type from number
        last4: cardNumber.slice(-4),
        expiry: expiry,
        isDefault: editingPayment ? editingPayment.item.isDefault : false
      };

      if (editingPayment) {
        setPaymentMethods(prev => prev.map(pm => pm.id === newPM.id ? newPM : pm));
        handleTextToVoice('Card updated successfully.');
      } else {
        setPaymentMethods(prev => [...prev, newPM]);
        handleTextToVoice(`Successfully added your card ending in ${newPM.last4}.`);
      }
    } else {
      const bankName = formData.get('bankName');
      const accountNumber = formData.get('accountNumber');

      const newBA = {
        id: editingPayment ? editingPayment.item.id : `ba_${Date.now()}`,
        bankName: bankName,
        last4: accountNumber.slice(-4),
        type: 'Checking'
      };

      if (editingPayment) {
        setBankAccounts(prev => prev.map(ba => ba.id === newBA.id ? newBA : ba));
        handleTextToVoice('Bank account updated successfully.');
      } else {
        setBankAccounts(prev => [...prev, newBA]);
        handleTextToVoice(`Successfully linked your ${newBA.bankName} account.`);
      }
    }
    
    setShowAddPaymentModal(false);
    setEditingPayment(null);
  };

  // Reserved for future use:
  const _handleProviderClick = (provider) => {
    const confirm = window.confirm(`Connect your ${provider} account?`);
    if (confirm) {
      handleTextToVoice(`Connecting to ${provider}...`);
      setTimeout(() => {
        handleTextToVoice(`Successfully connected ${provider}.`);
        const newPM = {
            id: `pm_${Date.now()}`,
            type: provider,
            last4: 'Linked',
            expiry: 'N/A',
            isDefault: false
        };
        setPaymentMethods(prev => [...prev, newPM]);
      }, 1500);
    }
  };

  const handleTranslatePrompt = async () => {
    const textarea = textareaRef.current || document.querySelector('.studio-textarea');
    if (!textarea || !textarea.value || voiceSettings.language === 'English') return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textarea.value,
          targetLanguage: 'English',
          sourceLanguage: voiceSettings.language
        })
      });

      const data = await response.json();
      if (data.translatedText) {
        textarea.value = data.translatedText;
        toast.success('Prompt translated to English!');
      }
    } catch (error) {
      console.error("Translation failed", error);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    // Guard: Ensure agent is selected
    if (!selectedAgent) {
      toast.error("Please select an agent first.");
      return;
    }
    
    const textarea = textareaRef.current || document.querySelector('.studio-textarea');
    if (!textarea || !textarea.value) {
      toast.error("Please enter a prompt first.");
      return;
    }

    // Check if user typed the demo code ("pitch")
    if (checkDemoCode(textarea.value)) {
      setShowDemoBanner(true);
      textarea.value = '';
      toast.success('🎭 Demo mode activated! Type "pitch" again to generate a demo response.', {
        duration: 5000,
        icon: '🎬'
      });
      return;
    }

    // Demo mode - return mock response without hitting API
    if (getDemoModeState()) {
      setIsGenerating(true);
      const toastId = toast.loading(`${selectedAgent.name} is working... (Demo Mode)`);
      try {
        const mockOutput = await getMockResponse(selectedAgent.id, textarea.value);
        // Store demo result in agent previews cache
        setAgentPreviews(prev => ({
          ...prev,
          [selectedAgent.id]: {
            output: mockOutput,
            timestamp: Date.now(),
            isDemo: true
          }
        }));
        setActiveTab('result');
        toast.success('Demo response generated!', { id: toastId });
      } catch (err) {
        toast.error('Demo error: ' + err.message, { id: toastId });
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Check if user can generate (free limit or credits)
    if (!canGenerate()) {
      if (!isLoggedIn) {
        toast.error(`You've used your ${FREE_GENERATION_LIMIT} free generations! Sign in to continue.`);
        setShowLoginModal(true);
      } else {
        toast.error("Out of credits! Please upgrade your plan.");
        setDashboardTab('subscription');
        setActiveTab('mystudio');
      }
      return;
    }

    // Check credits for logged-in users with paid plans
    if (isLoggedIn && userCredits <= 0 && userPlan.toLowerCase() === 'free') {
      toast.error("Out of credits! Please upgrade your plan.");
      setDashboardTab('subscription');
      setActiveTab('mystudio');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading(`${selectedAgent.name} is working...`);
    
    try {
      let prompt = textarea.value;

      // Auto-translate if not English
      if (voiceSettings.language !== 'English') {
        const response = await fetch(`${BACKEND_URL}/api/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: prompt,
            targetLanguage: 'English',
            sourceLanguage: voiceSettings.language
          })
        });
        const data = await response.json();
        if (data.translatedText) {
          prompt = data.translatedText;
          console.log("Auto-translated prompt for AI:", prompt);
        }
      }

      let endpoint = '/api/generate';
      let body = {
        prompt: prompt,
        systemInstruction: `You are ${selectedAgent?.name || 'AI Assistant'}, a professional AI agent in a high-end music studio. 
          Category: ${selectedAgent?.category || 'General'}. 
          Capabilities: ${(selectedAgent?.capabilities || []).join(', ')}.
          ${selectedAgent?.explanation || ''}`,
        model: selectedModel // Pass selected model to backend
      };

      // Route to specific endpoints for Image/Video/Audio agents
      const agentId = selectedAgent?.id || '';
      const isImageAgent = agentId === 'album';
      const isVideoAgent = agentId === 'video-creator';
      const isAudioAgent = agentId === 'beat' || agentId === 'sample';
      const isSpeechAgent = agentId === 'podcast' || agentId === 'voiceover' || agentId === 'vocal-arch';
      
      if (isImageAgent) {
        endpoint = '/api/generate-image';
        body = { prompt, model: selectedModel };
      } else if (isVideoAgent) {
        endpoint = '/api/generate-video';
        body = { prompt, model: selectedModel };
        
        // Attach audio for music video generation
        if (backingTrack) {
           // Note: In a real app, we'd upload the file first. 
           // Here we pass the URL if it's remote, or just metadata if local blob
           if (!backingTrack.isUpload) {
             body.audioUrl = backingTrack.audioUrl;
           }
           console.log('Attaching audio to video generation:', backingTrack.title);
        }
      } else if (isAudioAgent) {
        endpoint = '/api/generate-audio';
        body = { 
          prompt, 
          bpm: 90, // Could add UI controls for this
          genre: agentId === 'beat' ? 'hip-hop' : 'sample',
          mood: 'creative',
          durationSeconds: 15
        };
      } else if (isSpeechAgent) {
        endpoint = '/api/generate-speech';
        body = { 
          prompt, 
          voice: voiceSettings.voiceName || 'Kore', 
          style: 'natural' 
        };
        
        // Add backing track info if available (for sync)
        if (backingTrack) {
           body.backingTrackUrl = backingTrack.audioUrl;
           body.bpm = backingTrack.bpm;
           console.log('Attaching backing track to speech generation:', backingTrack.title);
        }
      }

      // Build headers with auth token if logged in
      const headers = { 'Content-Type': 'application/json' };
      if (isLoggedIn && auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } catch (err) {
          console.warn('Could not get auth token:', err);
        }
      }

      // Call Backend with auth headers
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      let data = await response.json();
      
      // Debug logging
      console.log('API Response:', { 
        ok: response.ok, 
        status: response.status,
        isAudioAgent,
        isSpeechAgent,
        dataKeys: Object.keys(data),
        hasAudioUrl: !!data.audioUrl,
        hasError: !!data.error
      });
      
      // Handle Imagen/Veo/Audio API errors gracefully - fall back to text description
      if ((isImageAgent || isVideoAgent) && (data.error || !response.ok)) {
        console.warn(`${isImageAgent ? 'Image' : 'Video'} generation not available, falling back to text description`);
        
        // Call text API instead with a description prompt
        const fallbackBody = {
          prompt: isImageAgent 
            ? `Describe in vivid detail what album artwork would look like for: "${prompt}". Include colors, imagery, composition, mood, and style.`
            : `Describe in vivid detail what a music video would look like for: "${prompt}". Include scenes, camera movements, visual effects, and mood.`,
          systemInstruction: `You are a creative director providing detailed visual descriptions for ${isImageAgent ? 'album artwork' : 'music videos'}.`
        };
        
        const fallbackResponse = await fetch(`${BACKEND_URL}/api/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify(fallbackBody)
        });
        data = await fallbackResponse.json();
        
        // Mark this as a fallback text response
        data._isFallback = true;
        data._fallbackType = isImageAgent ? 'image' : 'video';
      }
      
      // Handle Audio API errors - fall back to text description
      if ((isAudioAgent || isSpeechAgent) && (data.error || !response.ok) && !data.audioUrl && !data.description && !data.output) {
        console.warn('Audio generation failed, falling back to text description', data.error);
        
        const fallbackBody = {
          prompt: `Describe in vivid detail what a ${agentId === 'beat' ? 'beat/instrumental' : 'audio sample'} would sound like for: "${prompt}". Include instruments, rhythm, tempo, mood, and production style.`,
          systemInstruction: `You are a music producer providing detailed audio descriptions.`
        };
        
        const fallbackResponse = await fetch(`${BACKEND_URL}/api/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify(fallbackBody)
        });
        data = await fallbackResponse.json();
        data._isFallback = true;
        data._fallbackType = 'audio';
      }
      
      // Handle different response types
      let newItem = {
        id: String(Date.now()),
        title: `${selectedAgent?.name || 'AI'} Result`,
        type: selectedAgent?.category || 'text',
        agent: selectedAgent?.name || 'Unknown Agent',
        date: 'Just now',
        color: selectedAgent?.colorClass || '',
        snippet: prompt // Default snippet is the prompt
      };

      if (data._isFallback && data.output) {
        // Fallback text description for image/video
        newItem.snippet = data.output;
        newItem.isFallback = true;
        newItem.fallbackNote = data._fallbackType === 'image' 
          ? '🎨 Visual concept (image generation coming soon)'
          : '🎬 Video concept (video generation coming soon)';
      } else if (agentId === 'album' && (data.predictions || data.images || data.output)) {
        // Handle Image Response (Flux / Imagen / Nano Banana)
        console.log('Image response received:', { hasOutput: !!data.output, hasPredictions: !!data.predictions, hasImages: !!data.images });
        
        if (data.output && typeof data.output === 'string' && data.output.startsWith('http')) {
           // Handle URL output (Flux/Replicate)
           newItem.imageUrl = data.output;
           newItem.snippet = `🎨 Generated artwork for: "${prompt}"`;
           newItem.type = 'image';
        } else {
           // Handle Base64 output (Gemini/Imagen)
           const base64Image = data.predictions?.[0]?.bytesBase64Encoded || data.images?.[0];
           const mimeType = data.mimeType || 'image/png';
           
           if (base64Image) {
               newItem.imageUrl = base64Image.startsWith('data:') ? base64Image : `data:${mimeType};base64,${base64Image}`;
               newItem.snippet = `🎨 Generated artwork for: "${prompt}"`;
               newItem.type = 'image';
           }
        }
      } else if (agentId === 'video-creator' && (data.predictions || data.video || (data.output && (data.type === 'video' || data.type === 'image')))) {
        // Handle Video Response (Veo) - multiple response formats
        console.log('Video response received:', { hasOutput: !!data.output, type: data.type, hasPredictions: !!data.predictions });
        
        // Handle Nano Banana Fallback (Image instead of Video)
        if (data.type === 'image' && data.output) {
           const base64Image = data.output;
           const mimeType = data.mimeType || 'image/png';
           newItem.imageUrl = base64Image.startsWith('data:') ? base64Image : `data:${mimeType};base64,${base64Image}`;
           newItem.snippet = `🎨 Generated visual concept for: "${prompt}" (Video unavailable)`;
           newItem.type = 'image';
        }
        // Check for direct output URL first (most common from backend)
        else if (data.output && typeof data.output === 'string') {
          if (data.output.startsWith('data:')) {
            newItem.videoUrl = data.output;
          } else if (data.output.startsWith('http')) {
            newItem.videoUrl = data.output;
          } else {
            // Assume base64
            newItem.videoUrl = `data:video/mp4;base64,${data.output}`;
          }
          newItem.type = 'video';
          newItem.snippet = `🎬 Generated video for: "${prompt}"`;
        } else {
          // Fallback: Handle legacy format (predictions array)
          const videoData = data.predictions?.[0] || data.video;
          if (videoData) {
            if (videoData.bytesBase64Encoded) {
              newItem.videoUrl = `data:video/mp4;base64,${videoData.bytesBase64Encoded}`;
              newItem.type = 'video';
            } else if (videoData.videoUri) {
              newItem.videoUrl = videoData.videoUri;
              newItem.type = 'video';
            }
            newItem.snippet = `🎬 Generated video for: "${prompt}"`;
          }
        }
        
        // Attach audio if this was a music video generation
        if (backingTrack) {
           newItem.audioUrl = backingTrack.audioUrl; // Attach audio to video item
           newItem.audioTitle = backingTrack.title;
           newItem.snippet = `🎬 Music Video for: "${backingTrack.title}"`;
           
           // Clear backing track state
           setBackingTrack(null);
        }
      } else if ((isAudioAgent || isSpeechAgent) && (data.audioUrl || data.audio || data.type === 'synthesis' || data.description || data.message)) {
        // Handle Audio Response (Lyria/TTS/MusicGen)
        console.log('Audio response received:', { 
          hasAudioUrl: !!data.audioUrl, 
          audioUrlPrefix: data.audioUrl?.substring(0, 50),
          hasAudio: !!data.audio, 
          mimeType: data.mimeType,
          source: data.source,
          isRealGeneration: data.isRealGeneration,
          isSample: data.isSample
        });
        
        if (data.audioUrl) {
          // Check if it's a full URL or base64
          if (data.audioUrl.startsWith('http')) {
             newItem.audioUrl = data.audioUrl;
          } else if (data.audioUrl.startsWith('data:')) {
             newItem.audioUrl = data.audioUrl;
          } else {
             // Assume base64 if not http/data
             newItem.audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioUrl}`;
          }
          
          newItem.mimeType = data.mimeType || 'audio/wav';
          
          // Show appropriate message based on whether it's real AI generation or sample
          if (data.isRealGeneration) {
            newItem.snippet = `🎵 AI Generated Beat: "${prompt}"`;
            toast.success('Beat generated with MusicGen AI!');
          } else if (data.isSample) {
            newItem.snippet = `🎵 Sample Beat (Preview)`;
            newItem.billingMessage = data.message;
            toast.info(data.message || 'Using sample - configure Replicate for custom beats', { 
              duration: 5000,
              icon: '⚠️'
            });
          } else {
            newItem.snippet = `🎵 Generated audio for: "${prompt}"`;
          }
          
          newItem.type = 'audio';
          newItem.isRealGeneration = data.isRealGeneration;
          newItem.isSample = data.isSample;
          
          // Extract metadata if available
          newItem.bpm = data.bpm;
          newItem.genre = data.genre;
          
          console.log('Audio item created:', { 
            audioUrl: newItem.audioUrl.substring(0, 80), 
            type: newItem.type,
            isReal: data.isRealGeneration,
            isSample: data.isSample
          });

          // SUNO-LIKE FEATURE: Auto-generate cover art for the beat
          if (agentId === 'beat') {
             try {
               console.log('Generating cover art for beat...');
               const coverRes = await fetch(`${BACKEND_URL}/api/generate-image`, {
                 method: 'POST',
                 headers,
                 body: JSON.stringify({ 
                   prompt: `Album cover art for a ${data.genre || 'hip-hop'} beat. ${prompt}. High quality, abstract, vibrant.`,
                   aspectRatio: '1:1'
                 })
               });
               const coverData = await coverRes.json();
               if (coverData.imageUrl || coverData.images?.[0]) {
                 newItem.imageUrl = coverData.imageUrl || coverData.images[0];
                 console.log('Cover art generated for beat');
               }
             } catch (coverErr) {
               console.warn('Failed to generate beat cover art:', coverErr);
             }
          }
        } else if (data.audio) {
          // Handle raw audio data (from TTS endpoint)
          const mimeType = data.mimeType || 'audio/wav';
          newItem.audioUrl = `data:${mimeType};base64,${data.audio}`;
          newItem.mimeType = mimeType;
          newItem.snippet = `🎵 Generated audio for: "${prompt}"`;
          newItem.type = 'audio';
          console.log('Audio (from data.audio) created:', { type: newItem.type });
        } else if (data.type === 'synthesis' && data.params) {
          // Synthesis parameters for client-side generation
          newItem.synthesisParams = data.params;
          newItem.snippet = data.description || `Beat synthesis parameters for: "${prompt}"`;
          newItem.bpm = data.bpm;
          newItem.genre = data.genre;
          newItem.type = 'synthesis';
        } else {
          // Fallback description - capture any text output
          newItem.snippet = data.description || data.message || data.output || `Audio concept for: "${prompt}"`;
          newItem.type = 'text';
        }

        // Attach backing track if this was a sync generation
        if (isSpeechAgent && backingTrack) {
           newItem.backingTrackUrl = backingTrack.audioUrl;
           newItem.backingTrackTitle = backingTrack.title;
           newItem.snippet = `🎤 Vocals synced to: "${backingTrack.title}"`;
           newItem.type = 'vocal'; // Mark as vocal/song
           
           // Clear backing track state
           setBackingTrack(null);
        }
      } else if (data.output) {
        // Handle Text Response
        let finalOutput = data.output;
        if (voiceSettings.language !== 'English') {
          const transResponse = await fetch(`${BACKEND_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: finalOutput,
              targetLanguage: voiceSettings.language,
              sourceLanguage: 'English'
            })
          });
          const transData = await transResponse.json();
          if (transData.translatedText) finalOutput = transData.translatedText;
        }
        newItem.snippet = finalOutput;
      } else if (data.description || data.message) {
        // Handle any response with description or message fields
        newItem.snippet = data.description || data.message;
        newItem.type = 'text';
      } else {
        // Fallback or Error
        if (data.error) throw new Error(data.error);
        
        // Last resort: if we have ANY data, try to stringify it
        if (Object.keys(data).length > 0) {
           console.warn('Using generic fallback for unknown format:', data);
           newItem.snippet = JSON.stringify(data, null, 2);
           newItem.type = 'text';
        } else {
           // Log what we actually got for debugging
           console.warn('Unexpected AI response format:', JSON.stringify(data).substring(0, 200));
           throw new Error(`Unknown response format from AI. Keys: ${Object.keys(data).join(', ')}`);
        }
      }

      // Show preview modal instead of auto-saving
      setPreviewItem(newItem);
      setPreviewPrompt(prompt);
      setPreviewView('lyrics'); // Reset to lyrics view for new generations
      setAgentPreviews(prev => ({ ...prev, [selectedAgent.id]: newItem }));
      toast.success(`Generation complete! Review your result.`, { id: toastId });
      
      // Track successful generation
      Analytics.contentGenerated(selectedAgent.id, newItem.type || 'text');

    } catch (error) {
      console.error("Generation error", error);
      toast.error(error.message || 'Generation failed', { id: toastId });
      Analytics.errorOccurred('generation_failed', error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the previewed item to projects with timeout and loading feedback
  const handleSavePreview = async (destination = 'hub') => {
    if (!previewItem) return;
    if (isSaving) return; // Prevent double-save
    
    setIsSaving(true);
    const toastId = toast.loading('Syncing to cloud...', { icon: '☁️' });
    
    // 3-minute timeout
    const SAVE_TIMEOUT = 180000; // 3 minutes in ms
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Save timed out after 3 minutes')), SAVE_TIMEOUT)
    );
    
    try {
      // Ensure agent field is set
      const itemToSave = {
        ...previewItem,
        agent: previewItem.agent || selectedAgent?.name || 'Unknown Agent',
        savedAt: new Date().toISOString()
      };
      
      // Update local state immediately
      setProjects(prev => Array.isArray(prev) ? [itemToSave, ...prev] : [itemToSave]);

      // If we are working inside a project context, add this artifact to the project assets
      if (selectedProject) {
        const safeAssets = Array.isArray(selectedProject.assets) ? selectedProject.assets : [];
        const updatedProject = {
          ...selectedProject,
          assets: [itemToSave, ...safeAssets]
        };
        setSelectedProject(updatedProject);
        setProjects(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          return [itemToSave, ...safePrev.map(p => p?.id === updatedProject.id ? updatedProject : p)];
        });
      } else {
        // No project selected - show "Add to Project" modal
        setAddToProjectAsset(itemToSave);
      }

      // Save to Backend if logged in
      if (isLoggedIn) {
        const uid = localStorage.getItem('studio_user_id');
        if (uid) {
          const saveHeaders = { 'Content-Type': 'application/json' };
          if (auth?.currentUser) {
            try {
              const token = await auth.currentUser.getIdToken();
              saveHeaders['Authorization'] = `Bearer ${token}`;
            } catch (tokenErr) {
              console.warn('Could not get auth token for save:', tokenErr);
            }
          }
          
          // Create save promises with proper error handling
          const savePromises = [];
          
          // Save to projects collection
          savePromises.push(
            fetch(`${BACKEND_URL}/api/projects`, {
              method: 'POST',
              headers: saveHeaders,
              body: JSON.stringify({ userId: uid, project: itemToSave })
            }).then(res => {
              if (!res.ok) throw new Error(`Project save failed: ${res.status}`);
              return res.json();
            })
          );
          
          // Also log to generations history
          savePromises.push(
            fetch(`${BACKEND_URL}/api/user/generations`, {
              method: 'POST',
              headers: saveHeaders,
              body: JSON.stringify({
                type: itemToSave.type || 'text',
                agent: itemToSave.agent,
                prompt: previewPrompt || itemToSave.snippet,
                output: itemToSave.content || itemToSave.snippet,
                metadata: {
                  projectId: itemToSave.id,
                  imageUrl: itemToSave.imageUrl,
                  audioUrl: itemToSave.audioUrl,
                  videoUrl: itemToSave.videoUrl
                }
              })
            }).then(res => {
              if (!res.ok) console.warn('Generation log returned non-OK status:', res.status);
              return res.json().catch(() => ({}));
            })
          );
          
          // Race against timeout
          await Promise.race([
            Promise.all(savePromises),
            timeoutPromise
          ]);
          
          setUserCredits(prev => Math.max(0, prev - 1));
          toast.success('✅ Saved & synced to cloud!', { id: toastId });
        } else {
          toast.success('Saved locally!', { id: toastId });
        }
      } else {
        setFreeGenerationsUsed(prev => prev + 1);
        toast.success('Saved to your Hub!', { id: toastId });
      }

      // Clear preview and navigate
      setPreviewItem(null);
      setPreviewPrompt('');
      setPreviewView('lyrics');
      setActiveTab(destination);
      if (destination === 'hub') {
        setSelectedAgent(null);
      }
    } catch (error) {
      console.error('Save error:', error);
      if (error.message.includes('timed out')) {
        toast.error('Save timed out. Your work is saved locally.', { id: toastId });
      } else {
        toast.error(`Save failed: ${error.message}`, { id: toastId });
      }
      // Still close the modal - local save succeeded
      setPreviewItem(null);
      setPreviewPrompt('');
    } finally {
      setIsSaving(false);
    }
  };

  // Discard the preview and go back to agent
  const handleDiscardPreview = () => {
    setPreviewItem(null);
    setPreviewPrompt('');
    toast('Discarded. Try again!', { icon: '🔄' });
  };

  // Regenerate with the same prompt
  const handleRegeneratePreview = () => {
    if (!previewPrompt) {
      toast.error('No prompt to regenerate');
      return;
    }
    setPreviewItem(null);
    
    // Set the textarea value to the saved prompt before triggering generation
    const textarea = textareaRef.current || document.querySelector('.studio-textarea');
    if (textarea) {
      textarea.value = previewPrompt;
    }
    
    // Re-trigger generation (handleGenerate reads from textarea)
    handleGenerate();
  };

  const fetchActivity = async (page = 1, section = null) => {
    if (isLoadingActivity || (!hasMoreActivity && page !== 1)) return;
    
    const currentSection = section || activitySection || 'all';
    if (section) {
      setActivitySection(section);
      localStorage.setItem('musicHubSection', section);
    }
    
    setIsLoadingActivity(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/music-hub?section=${currentSection}&page=${page}&per_page=20`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        setActivityFeed(prev => page === 1 ? data.items : [...prev, ...data.items]);
        setActivityPage(page);
        // Cap at 200 items
        if (data.items.length < 20 || (page * 20) >= 200) {
          setHasMoreActivity(false);
        } else {
          setHasMoreActivity(true);
        }
      } else {
        if (page === 1) setActivityFeed([]);
        setHasMoreActivity(false);
      }
    } catch (err) {
      console.error('Failed to fetch Music Hub data', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const fetchNews = async (page = 1, searchQuery = '') => {
    if (isLoadingNews || (!hasMoreNews && page !== 1)) return { success: false };
    
    setIsLoadingNews(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        per_page: '20'
      });
      
      if (searchQuery) {
        queryParams.set('q', searchQuery);
      }
      
      const response = await fetch(`${BACKEND_URL}/api/news?${queryParams}`);
      const data = await response.json();
      
      if (data.articles && data.articles.length > 0) {
        setNewsArticles(prev => page === 1 ? data.articles : [...prev, ...data.articles]);
        setNewsPage(page);
        if (data.articles.length < 20) {
          setHasMoreNews(false);
        } else {
          setHasMoreNews(true);
        }
        return { success: true, count: data.articles.length };
      } else {
        if (page === 1) setNewsArticles([]);
        setHasMoreNews(false);
        return { success: true, count: 0 };
      }
    } catch (err) {
      console.error('Failed to fetch news', err);
      return { success: false, error: err };
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Debounced news search
  const [newsSearchDebounce, setNewsSearchDebounce] = useState(null);
  
  useEffect(() => {
    if (newsSearchDebounce) clearTimeout(newsSearchDebounce);
    
    const timeout = setTimeout(async () => {
      if (activeTab === 'news' && newsSearch.trim()) {
        // Show searching toast
        const toastId = toast.loading(`Searching: "${newsSearch.trim()}"...`);
        setHasMoreNews(true);
        const result = await fetchNews(1, newsSearch.trim());
        if (result?.success) {
          if (result.count > 0) {
            toast.success(`Found ${result.count} results`, { id: toastId });
          } else {
            toast(`No results for "${newsSearch.trim()}"`, { id: toastId, icon: '🔍' });
          }
        } else {
          toast.error('Search failed', { id: toastId });
        }
      } else if (activeTab === 'news' && !newsSearch.trim() && newsArticles.length === 0) {
        fetchNews(1);
      }
    }, 500);
    
    setNewsSearchDebounce(timeout);
    
    return () => clearTimeout(timeout);
  }, [newsSearch]);

  useEffect(() => {
    if (activeTab === 'activity' && activityFeed.length === 0) {
      fetchActivity(1);
    }
    if (activeTab === 'news' && newsArticles.length === 0) {
      fetchNews(1);
    }
  }, [activeTab]);

  // Reset nudge when agent changes
  useEffect(() => {
    if (selectedAgent) setShowNudge(true);
  }, [selectedAgent]);

  // Helper to safely save to localStorage with quota handling
  const safeLocalStorageSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn(`[Storage] Quota exceeded for ${key}, cleaning up old data...`);
        // Try to free up space by removing old/large items
        try {
          // Remove oldest projects if saving projects
          if (key === 'studio_agents_projects') {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.length > 20) {
              // Keep only the 20 most recent projects
              const trimmed = parsed.slice(0, 20);
              localStorage.setItem(key, JSON.stringify(trimmed));
              console.log('[Storage] Trimmed projects to 20 most recent');
              return true;
            }
          }
          // Clear some non-essential cached data
          localStorage.removeItem('studio_theme');
          localStorage.removeItem('studio_onboarding_v3');
          // Try again
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error('[Storage] Still failed after cleanup:', retryError);
          return false;
        }
      }
      console.error(`[Storage] Failed to save ${key}:`, e);
      return false;
    }
  };

  // Load projects from localStorage on mount
  useEffect(() => {
    const uid = localStorage.getItem('studio_user_id');
    const savedProjects = localStorage.getItem('studio_agents_projects');
    let localProjects = [];
    
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed)) {
          localProjects = parsed;
        }
      } catch (e) {
        console.error("Failed to parse projects", e);
      }
    }

    if (isLoggedIn && uid) {
      // Fetch from backend if logged in (with auth token)
      const fetchProjects = async () => {
        try {
          const headers = { 'Content-Type': 'application/json' };
          
          // Add auth token if available
          if (auth?.currentUser) {
            try {
              const token = await auth.currentUser.getIdToken();
              headers['Authorization'] = `Bearer ${token}`;
            } catch (tokenErr) {
              console.warn('Could not get auth token for projects fetch:', tokenErr);
            }
          }
          
          const res = await fetch(`${BACKEND_URL}/api/projects?userId=${uid}`, { headers });
          
          if (!res.ok) {
            console.warn('Failed to fetch projects from server:', res.status);
            setProjects(localProjects);
            return;
          }
          
          const data = await res.json();
          
          if (data.projects) {
            // Merge local and remote
            const allProjects = [...data.projects, ...localProjects];
            const uniqueProjects = Array.from(new Map(allProjects.map(item => [item.id, item])).values());
            // Sort by updatedAt/createdAt descending (newest first)
            uniqueProjects.sort((a, b) => {
              const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
              const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
              return bTime - aTime;
            });
            setProjects(uniqueProjects);
          } else {
            setProjects(localProjects);
          }
        } catch (err) {
          console.error("Failed to fetch remote projects", err);
          setProjects(localProjects);
        }
      };
      
      fetchProjects();
    } else {
      setProjects(localProjects);
    }
  }, [isLoggedIn]);

  // Save projects to localStorage whenever they change (with quota handling)
  useEffect(() => {
    if (projects && projects.length > 0) {
      // Limit to 50 projects max to prevent quota issues
      const projectsToSave = projects.slice(0, 50);
      safeLocalStorageSet('studio_agents_projects', JSON.stringify(projectsToSave));
    }
  }, [projects]);

  const handleDeadLink = (e, featureName) => {
    if (e) e.preventDefault();
    toast(`${featureName} coming soon!`, { icon: '🚧' });
  };

  const handleDownload = (item) => {
    if (!item) return;
    
    // Determine the best URL to download
    const downloadUrl = item.videoUrl || item.audioUrl || item.imageUrl;
    
    if (!downloadUrl) {
      handleDeadLink(null, "Download");
      return;
    }
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `${item.title.replace(/\s+/g, '_')}_studio_agents`);
    link.setAttribute('target', '_blank');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // On mobile, this triggers the browser's download manager
    // which allows users to "Save to Photos" or "Save to Files"
  };

  const handleShareToFeed = (item) => {
    if (!item) return;
    
    const newActivity = {
      ...item,
      id: String(Date.now()),
      user: isLoggedIn ? 'Pro Creator' : 'Guest Creator',
      time: 'Just now',
      likes: 0,
      remixes: 0,
      snippet: item.snippet || `Just created this amazing ${item.type || item.agent} output in the Studio!`
    };
    
    setActivityFeed([newActivity, ...activityFeed]);
    toast.success('Shared to Activity Wall!');
    setActiveTab('activity');
    setPlayingItem(null);
  };

  // Share to Twitter/X
  // Reserved for future use:
  const _handleShareToTwitter = (item) => {
    if (!item) return;
    
    // Create tweet text with snippet preview
    const snippet = item.snippet ? item.snippet.substring(0, 180) : '';
    const agentName = item.agent || 'Studio Agents';
    const hashtags = ['StudioAgents', 'AIMusic', 'MusicCreator'].join(',');
    
    // Build tweet content
    let tweetText = `🎵 Just created with ${agentName}:\n\n"${snippet}"\n\n`;
    tweetText += `Try it yourself at studioagentsai.com`;
    
    // Twitter Web Intent URL (works without OAuth)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&hashtags=${hashtags}`;
    
    // Open in new window
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    toast.success('Opening Twitter to share!');
  };

  const handleConnectSocial = async (platform) => {
    const returnUrl = encodeURIComponent(window.location.href);

    if (platform === 'twitter') {
      try {
        // Check if backend is ready
        const res = await fetch(`${BACKEND_URL}/api/twitter/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.configured) {
            window.location.href = `${BACKEND_URL}/api/twitter/auth?returnUrl=${returnUrl}`;
          } else {
            toast.error('Twitter not configured on server');
          }
        } else {
           window.location.href = `${BACKEND_URL}/api/twitter/auth?returnUrl=${returnUrl}`;
        }
      } catch (_e) {
        toast.error('Could not connect to backend server');
      }
      return;
    }

    if (platform === 'instagram' || platform === 'facebook') {
      window.location.href = `${BACKEND_URL}/api/meta/auth?returnUrl=${returnUrl}`;
      return;
    }

    // Placeholder for other platforms
    toast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} coming soon!`, { icon: '🚧' });
  };

  const handleDeleteProject = async (projectId, e) => {
    e?.stopPropagation(); // Prevent triggering the card click
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    // Find the project name before deleting for notification
    const projectToDelete = (projects || []).find(p => p.id === projectId);
    const projectName = projectToDelete?.name || 'Unknown';

    // Optimistic UI update - remove from local state
    // The useEffect for projects will automatically update localStorage (studio_agents_projects)
    setProjects((projects || []).filter(p => p.id !== projectId));

    // Delete from cloud via backend API (uses Admin SDK, bypasses security rules)
    if (isLoggedIn && user) {
      try {
        let authToken = null;
        if (auth?.currentUser) {
          try {
            authToken = await auth.currentUser.getIdToken(true);
          } catch (tokenErr) {
            console.warn('Failed to get auth token for delete:', tokenErr.message);
          }
        }
        
        const response = await fetch(`${BACKEND_URL}/api/projects/${encodeURIComponent(String(projectId))}?userId=${encodeURIComponent(user.uid)}&projectName=${encodeURIComponent(projectName)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          }
        });
        
        if (response.ok) {
          console.log(`Deleted project ${projectId} from cloud via API`);
          toast.success('Project deleted');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
      } catch (err) {
        console.error("Failed to delete from cloud:", err);
        toast.error('Cloud delete failed, removed locally');
      }
    } else {
      toast.success('Project deleted');
    }
  };

  const filteredNews = useMemo(() => {
    if (activeTab !== 'news') return [];
    return newsArticles.filter(item => 
      item.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
      item.source.toLowerCase().includes(newsSearch.toLowerCase()) ||
      item.content.toLowerCase().includes(newsSearch.toLowerCase())
    );
  }, [activeTab, newsArticles, newsSearch]);

  const handleRefreshNews = () => {
    fetchNews(1);
  };

  // Reserved for future use:
  const _toggleNewsExpansion = (id) => {
    const newExpanded = new Set(expandedNews);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNews(newExpanded);
  };

  // Reserved for future use:
  const _toggleAllNews = () => {
    if (allNewsExpanded) {
      setExpandedNews(new Set());
    } else {
      setExpandedNews(new Set(filteredNews.map(n => n.id)));
    }
    setAllNewsExpanded(!allNewsExpanded);
  };

  const renderContent = () => {
    if (activeTab === 'project_canvas' && !selectedAgent) {
      if (!selectedProject) {
        // Show loading state - project might still be setting from async state update
        return (
          <div className="p-8 text-center animate-fadeIn">
            <div style={{ opacity: 0.6 }}>Loading project...</div>
          </div>
        );
      }
      
      // Ensure assets is always an array (defensive)
      const safeAssets = Array.isArray(selectedProject.assets) ? selectedProject.assets : [];
      
      // Auto-select first asset if none selected
      if (!canvasPreviewAsset && safeAssets.length > 0) {
        // Use timeout to avoid render loop
        setTimeout(() => setCanvasPreviewAsset(safeAssets[0]), 0);
      }

      return (
        <div className="project-canvas-view animate-fadeIn">
          <div className="canvas-header">
            <button onClick={() => setActiveTab('hub')} className="btn-icon-circle back-btn">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="project-title">{selectedProject.name}</h1>
              <div className="project-meta">
                <span className="badge">{selectedProject.category}</span>
                <span className="date">Created {selectedProject.date}</span>
              </div>
            </div>
            <div className="header-actions">
              <button className="btn-pill primary" onClick={() => setActiveTab('agents')}>
                <Zap size={16} /> Open Studio
              </button>
            </div>
          </div>

          {/* Studio Monitor (Embedded Preview) */}
          <div className="studio-monitor-panel" style={{ 
            background: 'rgba(20, 20, 25, 0.6)', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '24px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--color-cyan)' }}>
                <Activity size={18} /> Studio Monitor
              </h3>
              {canvasPreviewAsset ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {canvasPreviewAsset.title}
                  </span>
                  <span className={`badge ${canvasPreviewAsset.type === 'Audio' ? 'bg-purple' : canvasPreviewAsset.type === 'Video' ? 'bg-cyan' : 'bg-pink'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                    {canvasPreviewAsset.type}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No asset selected</span>
              )}
            </div>
            
            <div style={{ minHeight: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', position: 'relative' }}>
               {canvasPreviewAsset ? (
                 <>
                   {canvasPreviewAsset.type === 'Video' && canvasPreviewAsset.videoUrl && (
                     <video 
                       src={canvasPreviewAsset.videoUrl} 
                       controls 
                       style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
                       onError={(e) => {
                         console.warn('[AssetViewer] Video failed to load:', canvasPreviewAsset.videoUrl);
                         e.target.style.display = 'none';
                         e.target.parentElement?.querySelector('.media-error-fallback')?.style?.setProperty('display', 'flex');
                       }}
                     />
                   )}
                   {canvasPreviewAsset.type === 'Image' && canvasPreviewAsset.imageUrl && (
                     <img 
                       src={canvasPreviewAsset.imageUrl} 
                       alt={canvasPreviewAsset.title || 'Asset'}
                       style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
                       onError={(e) => {
                         console.warn('[AssetViewer] Image failed to load:', canvasPreviewAsset.imageUrl);
                         e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%231a1a2e" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-family="sans-serif"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                       }}
                     />
                   )}
                   {canvasPreviewAsset.type === 'Audio' && canvasPreviewAsset.audioUrl && (
                     <div style={{ width: '100%', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                       <div style={{ 
                         width: '120px', 
                         height: '120px', 
                         borderRadius: '50%', 
                         background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'center',
                         boxShadow: '0 0 40px rgba(168, 85, 247, 0.3)'
                       }}>
                         <Music size={48} color="white" />
                       </div>
                       <audio 
                         ref={canvasAudioRef}
                         key={canvasPreviewAsset.id || canvasPreviewAsset.audioUrl}
                         src={canvasPreviewAsset.audioUrl} 
                         controls 
                         style={{ width: '100%', maxWidth: '600px' }}
                         onError={(e) => {
                           console.warn('[AssetViewer] Audio failed to load:', canvasPreviewAsset.audioUrl);
                           toast.error('Audio file could not be loaded');
                         }}
                         onPlay={() => console.log('[AssetViewer] Audio started playing')}
                         onPause={(e) => console.log('[AssetViewer] Audio paused at', e.target.currentTime, 'ended:', e.target.ended)}
                         onEnded={() => console.log('[AssetViewer] Audio ended')}
                         onLoadedData={() => console.log('[AssetViewer] Audio loaded, duration:', canvasAudioRef.current?.duration)}
                       />
                     </div>
                   )}
                   
                   {/* Text Content Viewer - for lyrics, scripts, text generations */}
                   {(canvasPreviewAsset.type === 'Text' || canvasPreviewAsset.type === 'Lyrics' || canvasPreviewAsset.type === 'Script' || 
                     (!canvasPreviewAsset.videoUrl && !canvasPreviewAsset.audioUrl && !canvasPreviewAsset.imageUrl && canvasPreviewAsset.content)) && (
                     <div style={{ 
                       width: '100%', 
                       height: '100%',
                       minHeight: '360px',
                       padding: '32px', 
                       display: 'flex', 
                       flexDirection: 'column',
                       background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)'
                     }}>
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '12px', 
                         marginBottom: '20px',
                         paddingBottom: '16px',
                         borderBottom: '1px solid rgba(255,255,255,0.1)'
                       }}>
                         <div style={{ 
                           width: '48px', 
                           height: '48px', 
                           borderRadius: '12px', 
                           background: 'linear-gradient(135deg, var(--color-cyan), var(--color-purple))',
                           display: 'flex', 
                           alignItems: 'center', 
                           justifyContent: 'center',
                           boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
                         }}>
                           <FileText size={24} color="white" />
                         </div>
                         <div>
                           <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>{canvasPreviewAsset.title}</h4>
                           <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                             {canvasPreviewAsset.agent} • {canvasPreviewAsset.date}
                           </span>
                         </div>
                         <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                           <button
                             onClick={() => {
                               navigator.clipboard.writeText(canvasPreviewAsset.content || '');
                               // Could add a toast notification here
                             }}
                             className="btn-icon-circle glass"
                             title="Copy to clipboard"
                             style={{ background: 'rgba(255,255,255,0.1)' }}
                           >
                             <Copy size={16} />
                           </button>
                         </div>
                       </div>
                       <div style={{ 
                         flex: 1,
                         overflowY: 'auto',
                         padding: '20px',
                         background: 'rgba(0,0,0,0.3)',
                         borderRadius: '12px',
                         border: '1px solid rgba(255,255,255,0.05)'
                       }}>
                         <pre style={{ 
                           margin: 0,
                           fontFamily: "'SF Mono', 'Fira Code', monospace",
                           fontSize: '0.95rem',
                           lineHeight: '1.8',
                           color: 'rgba(255,255,255,0.9)',
                           whiteSpace: 'pre-wrap',
                           wordWrap: 'break-word'
                         }}>
                           {canvasPreviewAsset.content || canvasPreviewAsset.snippet || 'No text content available'}
                         </pre>
                       </div>
                     </div>
                   )}
                   
                   {/* Quick Actions Overlay */}
                   <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                     <button 
                       onClick={() => {
                         try {
                           const mediaUrl = canvasPreviewAsset.audioUrl || canvasPreviewAsset.videoUrl || canvasPreviewAsset.imageUrl;
                           if (!mediaUrl) {
                             // For text content, download as text file
                             if (canvasPreviewAsset.content || canvasPreviewAsset.snippet) {
                               const blob = new Blob([canvasPreviewAsset.content || canvasPreviewAsset.snippet], { type: 'text/plain' });
                               const url = URL.createObjectURL(blob);
                               const link = document.createElement('a');
                               link.href = url;
                               link.download = `${canvasPreviewAsset.title || 'asset'}.txt`;
                               document.body.appendChild(link);
                               link.click();
                               document.body.removeChild(link);
                               URL.revokeObjectURL(url);
                               toast.success('Text file downloaded');
                             } else {
                               toast.error('No downloadable content available');
                             }
                             return;
                           }
                           const link = document.createElement('a');
                           link.href = mediaUrl;
                           link.download = canvasPreviewAsset.title || 'download';
                           document.body.appendChild(link);
                           link.click();
                           document.body.removeChild(link);
                           toast.success('Download started');
                         } catch (err) {
                           console.error('[AssetDownload] Error:', err);
                           toast.error('Download failed');
                         }
                       }}
                       className="btn-icon-circle glass"
                       title="Download"
                     >
                       <Download size={18} />
                     </button>
                     <button 
                       onClick={() => {
                         try {
                           const assetsList = selectedProject?.assets || [];
                           setShowPreview({
                             type: (canvasPreviewAsset.type || 'text').toLowerCase(),
                             url: canvasPreviewAsset.audioUrl || canvasPreviewAsset.videoUrl || canvasPreviewAsset.imageUrl || null,
                             title: canvasPreviewAsset.title || 'Untitled',
                             asset: canvasPreviewAsset,
                             assets: assetsList,
                             currentIndex: Math.max(0, assetsList.findIndex(a => a.id === canvasPreviewAsset.id))
                           });
                         } catch (err) {
                           console.error('[AssetPreview] Error opening fullscreen:', err);
                           toast.error('Could not open preview');
                         }
                       }}
                       className="btn-icon-circle glass"
                       title="Fullscreen"
                     >
                       <Maximize2 size={18} />
                     </button>
                   </div>
                 </>
               ) : (
                 <div style={{ textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>
                   <Activity size={48} style={{ marginBottom: '16px' }} />
                   <p>Select an asset to preview</p>
                 </div>
               )}
            </div>
          </div>

          <div className="canvas-grid">
            <div className="canvas-column">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><UsersIcon size={18} className="text-purple" /> The Team</h3>
              <div className="team-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedProject.agents && selectedProject.agents.length > 0 ? (
                  selectedProject.agents.map((agentId, idx) => {
                    const agent = AGENTS.find(a => a.id === agentId || a.name === agentId) || AGENTS[0];
                    return (
                      <div 
                        key={idx} 
                        className="agent-card-mini haptic-press" 
                        onClick={() => setSelectedAgent(agent)}
                        style={{ 
                          padding: '12px', 
                          background: 'rgba(255,255,255,0.05)', 
                          borderRadius: '12px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          cursor: 'pointer',
                          border: '1px solid transparent',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-purple)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                      >
                        <div className="agent-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: agent.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {agent.icon ? <agent.icon size={20} color="white" /> : <User size={20} color="white" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{agent.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{agent.role}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-muted text-sm">No agents selected</div>
                )}
                <button 
                  className="btn-dashed" 
                  style={{ width: '100%', padding: '12px', border: '1px dashed var(--text-secondary)', borderRadius: '12px', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer' }}
                  onClick={() => setShowAddAgentModal(true)}
                >
                  + Add Agent
                </button>
              </div>

              {/* MAS Orchestration Section */}
              <div className="orchestration-panel" style={{ marginTop: '24px', padding: '16px', background: 'rgba(168, 85, 247, 0.05)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '1rem', color: 'var(--color-purple)' }}>
                  <Zap size={16} /> Studio Orchestrator
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Generate lyrics, beats, visuals & more with one click.
                </p>
                
                <button 
                  className="btn-pill primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setShowOrchestrator(true);
                    handleTextToVoice("Opening Studio Orchestrator.");
                  }}
                >
                  <Sparkles size={16} /> Open Orchestrator
                </button>
              </div>
            </div>

            <div className="canvas-column">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Book size={18} className="text-cyan" /> Narrative & Vision</h3>
              <div className="narrative-editor">
                <textarea 
                  value={selectedProject?.description || ''}
                  onChange={(e) => {
                    if (!selectedProject) return;
                    const updated = { ...selectedProject, description: e.target.value };
                    setSelectedProject(updated);
                    setProjects(prev => Array.isArray(prev) ? prev.map(p => p?.id === updated.id ? updated : p) : []);
                  }}
                  className="narrative-textarea"
                  placeholder="Describe your project vision here..."
                />
              </div>
            </div>

            <div className="canvas-column">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Share2 size={18} className="text-pink" /> Marketing</h3>
              
              {selectedProject.socialHandle && (
                <div className="marketing-card" style={{ background: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Active Campaign</span>
                    <span style={{ fontSize: '0.7rem', background: 'var(--color-cyan)', color: 'black', padding: '2px 6px', borderRadius: '4px' }}>LIVE</span>
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-cyan)' }}>
                      <Share2 size={20} className="text-cyan" />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{selectedProject.socialHandle}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{selectedProject.socialPlatform} • {selectedProject.category}</div>
                    </div>
                  </div>
                  {selectedProject.socialBio && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      "{selectedProject.socialBio}"
                    </div>
                  )}
                </div>
              )}

              <div className="marketing-card" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Social Status</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div className={`social-pill ${socialConnections.twitter ? 'active' : ''}`} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', background: socialConnections.twitter ? 'rgba(29, 161, 242, 0.2)' : 'rgba(255,255,255,0.1)', color: socialConnections.twitter ? '#1DA1F2' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Twitter size={14} /> {socialConnections.twitter ? 'Connected' : 'Link X'}
                  </div>
                  <div className={`social-pill ${socialConnections.instagram ? 'active' : ''}`} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', background: socialConnections.instagram ? 'rgba(225, 48, 108, 0.2)' : 'rgba(255,255,255,0.1)', color: socialConnections.instagram ? '#E1306C' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Instagram size={14} /> {socialConnections.instagram ? 'Connected' : 'Link IG'}
                  </div>
                </div>
              </div>
              <div className="marketing-card" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px' }}>
                 <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Quick Actions</h4>
                 <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button 
                      className="btn-text" 
                      style={{ fontSize: '0.8rem', color: 'var(--color-purple)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => {
                        setShowOrchestrator(true);
                      }}
                    >
                      + Generate Assets
                    </button>
                    <label className="btn-text" style={{ fontSize: '0.8rem', color: 'var(--color-cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input 
                        type="file" 
                        accept="audio/*,image/*,video/*" 
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            const type = file.type.startsWith('audio') ? 'Audio' : file.type.startsWith('video') ? 'Video' : 'Image';
                            const newAsset = {
                              id: String(Date.now()),
                              title: file.name,
                              type: type,
                              agent: 'User Upload',
                              date: 'Just now',
                              color: 'agent-cyan',
                              snippet: `Uploaded ${type} file`,
                              audioUrl: file.type.startsWith('audio') ? url : null,
                              videoUrl: file.type.startsWith('video') ? url : null,
                              imageUrl: file.type.startsWith('image') ? url : null
                            };
                            const updated = { ...selectedProject, assets: [newAsset, ...(selectedProject.assets || [])] };
                            setSelectedProject(updated);
                            setProjects(projects.map(p => p.id === updated.id ? updated : p));
                          }
                        }}
                      />
                      + Upload File
                    </label>
                 </div>
              </div>
            </div>
          </div>
          
          {/* Project Generations Section */}
          <div className="project-generations-section" style={{ marginTop: '32px', paddingBottom: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
               <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <Layers size={20} className="text-purple" /> 
                 Project Generations
                 <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                   {selectedProject.assets?.length || 0}
                 </span>
               </h3>
               
               <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn-pill" 
                    style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                    onClick={() => setShowOrchestrator(true)}
                  >
                    <Sparkles size={14} /> Generate New
                  </button>
               </div>
             </div>
             
             {selectedProject.assets && selectedProject.assets.length > 0 ? (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                 {selectedProject.assets.map((asset, idx) => (
                   <div 
                     key={idx} 
                     className="asset-card-canvas"
                     style={{
                       background: 'rgba(255,255,255,0.03)',
                       borderRadius: '16px',
                       padding: '16px',
                       border: '1px solid rgba(255,255,255,0.08)',
                       transition: 'all 0.2s ease',
                       display: 'flex',
                       flexDirection: 'column',
                       gap: '12px',
                       position: 'relative',
                       height: '100%'
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.borderColor = 'var(--color-purple)';
                       e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                       e.currentTarget.style.transform = 'translateY(-2px)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                       e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                       e.currentTarget.style.transform = 'translateY(0)';
                     }}
                   >
                     {/* Media Preview */}
                     <div 
                       onClick={() => {
                         // Guard: prevent rapid clicks
                         if (isModalTransitioning.current) return;
                         
                         // For text-only assets, just select for preview in Studio Monitor
                         if (!asset.audioUrl && !asset.imageUrl && !asset.videoUrl) {
                           setCanvasPreviewAsset(asset);
                           return;
                         }
                         
                         isModalTransitioning.current = true;
                         
                         // Open fullscreen preview (auto-plays audio/video)
                         const safeAssetsList = Array.isArray(selectedProject?.assets) ? selectedProject.assets : [];
                         const previewableAssets = safeAssetsList.filter(a => a?.audioUrl || a?.imageUrl || a?.videoUrl);
                         const currentIndex = previewableAssets.findIndex(a => a?.id === asset?.id);
                         setShowPreview({
                           type: asset.audioUrl ? 'audio' : asset.videoUrl ? 'video' : 'image',
                           url: asset.audioUrl || asset.videoUrl || asset.imageUrl,
                           title: asset.title || 'Untitled',
                           asset: asset,
                           assets: previewableAssets,
                           currentIndex: currentIndex >= 0 ? currentIndex : 0
                         });
                         
                         // Reset guard after modal opens
                         setTimeout(() => { isModalTransitioning.current = false; }, 300);
                       }}
                       style={{ 
                         width: '100%',
                         aspectRatio: '16/9',
                         background: 'rgba(0,0,0,0.3)', 
                         borderRadius: '12px', 
                         overflow: 'hidden', 
                         cursor: 'pointer',
                         position: 'relative',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         border: canvasPreviewAsset?.id === asset.id ? '2px solid var(--color-cyan)' : 'none'
                       }}
                     >
                       {asset.imageUrl ? (
                         <img 
                           src={asset.imageUrl}
                           alt={asset.title || 'Asset image'}
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                           onError={(e) => {
                             console.warn('[AssetCard] Image failed to load:', asset.imageUrl?.substring(0, 50));
                             e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect fill="%231a1a2e" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="12" font-family="sans-serif"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                           }}
                         />
                       ) : asset.videoUrl ? (
                         <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                           <video 
                             src={asset.videoUrl}
                             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                             muted
                             preload="metadata"
                             onLoadedData={(e) => {
                               // Seek to 1 second for thumbnail frame
                               if (e.target.currentTime === 0) e.target.currentTime = 1;
                             }}
                             onError={(e) => {
                               console.warn('[AssetCard] Video failed to load:', asset.videoUrl?.substring(0, 50));
                               e.target.style.display = 'none';
                             }}
                           />
                           {/* Play icon overlay */}
                           <div style={{
                             position: 'absolute',
                             top: '50%',
                             left: '50%',
                             transform: 'translate(-50%, -50%)',
                             width: '44px',
                             height: '44px',
                             borderRadius: '50%',
                             background: 'rgba(0,0,0,0.7)',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             backdropFilter: 'blur(4px)'
                           }}>
                             <Play size={22} style={{ color: 'white', marginLeft: '3px' }} />
                           </div>
                         </div>
                       ) : asset.audioUrl ? (
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                           <Music size={32} style={{ color: 'var(--color-purple)' }} />
                           <div style={{ width: '60%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                              <div style={{ width: '40%', height: '100%', background: 'var(--color-purple)', borderRadius: '2px' }}></div>
                           </div>
                           <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Click to play</span>
                         </div>
                       ) : (
                         <div style={{ 
                           display: 'flex', 
                           flexDirection: 'column', 
                           alignItems: 'center', 
                           justifyContent: 'center', 
                           gap: '8px',
                           width: '100%',
                           height: '100%',
                           padding: '12px'
                         }}>
                           <FileText size={28} style={{ color: 'var(--color-cyan)', flexShrink: 0 }} />
                           {(asset.content || asset.snippet) && (
                             <div style={{ 
                               fontSize: '0.7rem', 
                               color: 'var(--text-secondary)', 
                               textAlign: 'center',
                               overflow: 'hidden',
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical',
                               lineHeight: '1.4',
                               maxWidth: '90%'
                             }}>
                               {(asset.content || asset.snippet).substring(0, 80)}...
                             </div>
                           )}
                           <span style={{ fontSize: '0.65rem', color: 'var(--color-cyan)', marginTop: '4px' }}>Click to view</span>
                         </div>
                       )}
                       
                       {/* Type Badge */}
                       <div style={{
                         position: 'absolute',
                         top: '8px',
                         left: '8px',
                         background: 'rgba(0,0,0,0.6)',
                         backdropFilter: 'blur(4px)',
                         padding: '4px 8px',
                         borderRadius: '6px',
                         fontSize: '0.65rem',
                         color: 'white',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '4px'
                       }}>
                         {asset.type === 'Video' && <Video size={10} />}
                         {asset.type === 'Audio' && <Music size={10} />}
                         {asset.type === 'Image' && <Image size={10} />}
                         {(asset.type === 'Text' || asset.type === 'Lyrics' || asset.type === 'Script') && <FileText size={10} />}
                         {asset.type}
                       </div>
                     </div>
                     
                     {/* Info */}
                     <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'white', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                         {asset.title}
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           <User size={10} /> {asset.agent}
                         </div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                           {asset.date}
                         </div>
                       </div>
                     </div>

                     {/* Actions */}
                     <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                       {/* Quick Play for Audio/Video */}
                       {(asset.audioUrl || asset.videoUrl) && (
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             const safeAssetsList = Array.isArray(selectedProject?.assets) ? selectedProject.assets : [];
                             const previewableAssets = safeAssetsList.filter(a => a?.audioUrl || a?.imageUrl || a?.videoUrl);
                             const currentIndex = previewableAssets.findIndex(a => a?.id === asset?.id);
                             setShowPreview({
                               type: asset.audioUrl ? 'audio' : 'video',
                               url: asset.audioUrl || asset.videoUrl,
                               title: asset.title || 'Untitled',
                               asset: asset,
                               assets: previewableAssets,
                               currentIndex: currentIndex >= 0 ? currentIndex : 0
                             });
                           }}
                           className="btn-icon-sm"
                           title={asset.audioUrl ? "Play Audio" : "Play Video"}
                           style={{ 
                             flex: 1, 
                             background: asset.audioUrl 
                               ? 'rgba(168, 85, 247, 0.15)' 
                               : 'rgba(34, 211, 238, 0.15)',
                             color: asset.audioUrl ? 'var(--color-purple)' : 'var(--color-cyan)'
                           }}
                         >
                           {asset.audioUrl ? <Volume2 size={14} /> : <Play size={14} />}
                         </button>
                       )}
                       
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setCanvasPreviewAsset(asset);
                         }}
                         className="btn-icon-sm"
                         title="View in Monitor"
                         style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}
                       >
                         <Activity size={14} />
                       </button>
                       
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           const safeAssetsList = Array.isArray(selectedProject?.assets) ? selectedProject.assets : [];
                           const previewableAssets = safeAssetsList.filter(a => a?.audioUrl || a?.imageUrl || a?.videoUrl);
                           const currentIndex = previewableAssets.findIndex(a => a?.id === asset?.id);
                           setShowPreview({
                             type: asset.audioUrl ? 'audio' : asset.videoUrl ? 'video' : 'image',
                             url: asset.audioUrl || asset.videoUrl || asset.imageUrl,
                             title: asset.title || 'Untitled',
                             asset: asset,
                             assets: previewableAssets,
                             currentIndex: currentIndex >= 0 ? currentIndex : 0
                           });
                         }}
                         className="btn-icon-sm"
                         title="Fullscreen"
                         style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}
                       >
                         <Maximize2 size={14} />
                       </button>
                       
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           try {
                             if (confirm(`Delete "${asset.title || 'this asset'}"?`)) {
                               const currentAssets = Array.isArray(selectedProject?.assets) ? selectedProject.assets : [];
                               const updatedAssets = currentAssets.filter((_, i) => i !== idx);
                               const updated = { ...selectedProject, assets: updatedAssets, updatedAt: new Date().toISOString() };
                               setSelectedProject(updated);
                               setProjects(projects.map(p => p.id === updated.id ? updated : p));
                               // Clear preview if we deleted the currently previewed asset
                               if (canvasPreviewAsset?.id === asset.id) {
                                 setCanvasPreviewAsset(updatedAssets[0] || null);
                               }
                               toast.success('Asset deleted');
                             }
                           } catch (err) {
                             console.error('[AssetDelete] Error:', err);
                             toast.error('Could not delete asset');
                           }
                         }}
                         className="btn-icon-sm"
                         title="Delete"
                         style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-red)' }}
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div style={{ 
                 padding: '60px', 
                 textAlign: 'center', 
                 background: 'rgba(255,255,255,0.02)', 
                 borderRadius: '16px', 
                 border: '2px dashed rgba(255,255,255,0.05)' 
               }}>
                 <Layers size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                 <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>No generations yet</h3>
                 <p style={{ color: 'var(--text-secondary)', opacity: 0.7, maxWidth: '400px', margin: '0 auto 24px auto' }}>
                   Start by opening the Studio Orchestrator or uploading your own files.
                 </p>
                 <button className="btn-pill primary" onClick={() => setShowOrchestrator(true)}>
                   <Sparkles size={16} /> Start Creating
                 </button>
               </div>
             )}
          </div>
        </div>
      );
    }

    if (activeTab === 'mystudio') {
      return (
        <div className="studio-dashboard animate-fadeInUp">
          <div className="dashboard-sidebar-layout">
            {/* Dashboard Sidebar */}
            <div className="dashboard-sidebar">
              <div className="sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2>Studio</h2>
                    <span className="pro-badge">PRO</span>
                  </div>
                  <div 
                    className="status-indicator" 
                    title={systemStatus.message}
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: systemStatus.status === 'healthy' ? 'var(--color-emerald)' : 'var(--color-red)',
                      boxShadow: systemStatus.status === 'healthy' ? '0 0 8px var(--color-emerald)' : '0 0 8px var(--color-red)'
                    }}
                  />
                </div>
              </div>
              <nav className="sidebar-nav">
                <button 
                  className={`sidebar-link ${dashboardTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setDashboardTab('overview')}
                >
                  <LayoutGrid size={18} /> Overview
                </button>
                <button 
                  className={`sidebar-link ${dashboardTab === 'agents' ? 'active' : ''}`}
                  onClick={() => setDashboardTab('agents')}
                >
                  <UsersIcon size={18} /> Manage Agents
                </button>
                <button 
                  className={`sidebar-link ${dashboardTab === 'billing' ? 'active' : ''}`}
                  onClick={() => setDashboardTab('billing')}
                >
                  <CreditCard size={18} /> Billing & Wallet
                </button>
                <button 
                  className={`sidebar-link ${dashboardTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setDashboardTab('settings')}
                >
                  <Settings size={18} /> App Settings
                </button>
              </nav>
            </div>

            {/* Dashboard Content Area */}
            <div className="dashboard-main-content">
              {dashboardTab === 'overview' && (
                <div className="dashboard-view-overview animate-fadeIn">
                  {/* Artist Profile Header */}
                  <div className="artist-profile-header" style={{ 
                    background: 'linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div className="profile-avatar" style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        background: 'var(--color-purple)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        color: 'white',
                        boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)'
                      }}>
                        {user?.photoURL ? <img src={user.photoURL} alt="Profile" loading="lazy" style={{width: '100%', height: '100%', borderRadius: '50%'}} /> : <User size={40} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                          <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: '700' }}>{user?.displayName || 'Guest Creator'}</h1>
                          {isLoggedIn && <span className="pro-badge">PRO</span>}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {user?.email || 'Sign in to save your work'}
                        </p>
                        {selectedProject && (
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--color-cyan)' }}>
                            <Disc size={14} />
                            <span>Current Session: <strong>{selectedProject.name}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="profile-stats" style={{ display: 'flex', gap: '24px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{projects.length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Projects</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-cyan)' }}>{userProfile.credits}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Credits</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-purple)' }}>{managedAgents.filter(a => a.visible).length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Agents</div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Completion Nudge */}
                  {!userProfile.stageName && (
                    <div className="profile-nudge-card animate-fadeInUp" style={{ 
                      background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.05) 100%)',
                      border: '1px solid var(--color-purple)',
                      borderRadius: '12px',
                      padding: '16px 24px',
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'var(--color-purple)', padding: '10px', borderRadius: '50%', color: 'white' }}>
                          <User size={24} />
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Complete Your Creator Profile</h3>
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Set your stage name and genre to get personalized AI results.</p>
                        </div>
                      </div>
                      <button 
                        className="cta-button-premium"
                        onClick={() => setActiveTab('profile')}
                      >
                        Setup Profile
                      </button>
                    </div>
                  )}

                  {/* Audience Overview (Simulated) */}
                  <div className="audience-overview">
                    {[
                      { label: 'Monthly Listeners', value: performanceStats.listeners.toLocaleString(), icon: UsersIcon, color: 'var(--color-blue)' },
                      { label: 'Total Streams', value: performanceStats.streams.toLocaleString(), icon: PlayCircle, color: 'var(--color-emerald)' },
                      { label: 'Followers', value: performanceStats.followers.toLocaleString(), icon: Crown, color: 'var(--color-purple)' },
                      { label: 'Growth', value: performanceStats.growth, icon: TrendingUp, color: 'var(--color-cyan)' }
                    ].map((stat, i) => (
                      <div key={i} className="audience-stat-card">
                        <div className="audience-stat-icon" style={{ 
                          background: `${stat.color}20`, 
                          color: stat.color
                        }}>
                          <stat.icon size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stat.value}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI Production Pipeline Card - NEW PRIMARY ACTION */}
                  <div className="dashboard-card orchestrator-promo-card animate-fadeInUp" style={{ 
                    marginBottom: '24px', 
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '24px',
                    padding: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                      <Zap size={120} color="var(--color-purple)" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', padding: '10px', borderRadius: '12px', color: 'white' }}>
                            <Zap size={24} />
                          </div>
                          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>AI Production Pipeline</h2>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                          Transform a single idea into a complete release package. Our multi-agent orchestrator handles lyrics, beats, visuals, and marketing in one automated flow.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button 
                            className="cta-button-premium"
                            onClick={() => setShowOrchestrator(true)}
                            style={{ padding: '12px 24px' }}
                          >
                            Start AI Production
                          </button>
                          <button 
                            className="btn-pill glass"
                            onClick={() => setActiveTab('resources')}
                          >
                            Watch Demo
                          </button>
                        </div>
                      </div>
                      <div className="orchestrator-stats" style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-purple)' }}>4</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Agents</div>
                        </div>
                        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-cyan)' }}>1-Click</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Workflow</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Onboarding Card */}
                  <div className="dashboard-card workflow-card" style={{ marginBottom: '24px', background: 'var(--color-bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div className="card-header">
                      <h3><Sparkles size={18} className="text-cyan" /> Studio Workflow</h3>
                    </div>
                    <div className="workflow-steps-mini" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                      {[
                        { 
                          step: 1, 
                          title: "Define Your Vision", 
                          desc: "Use the Project Wizard to name your masterpiece and select your studio vibe.", 
                          icon: Sparkles, 
                          color: "var(--color-cyan)" 
                        },
                        { 
                          step: 2, 
                          title: "Assemble Your Team", 
                          desc: "Choose from 16 specialized AI agents for lyrics, beats, and production.", 
                          icon: UsersIcon, 
                          color: "var(--color-purple)" 
                        },
                        { 
                          step: 3, 
                          title: "Launch & Amplify", 
                          desc: "Use Marketing agents to build your rollout plan and sync socials.", 
                          icon: Rocket, 
                          color: "var(--color-pink)" 
                        }
                      ].map((item, i) => (
                        <div key={i} className="workflow-step-item" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                          <div className="step-number" style={{ 
                            minWidth: '24px', height: '24px', borderRadius: '50%', 
                            background: item.color, color: 'black', fontWeight: 'bold', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' 
                          }}>
                            {item.step}
                          </div>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>{item.title}</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="workflow-actions" style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                      <button className="btn-pill primary" onClick={() => setShowProjectChoiceModal(true)}>
                        <Plus size={14} /> New Project
                      </button>
                      <button className="btn-pill glass" onClick={() => setActiveTab('hub')}>
                        <Folder size={14} /> Open Existing
                      </button>
                    </div>
                  </div>

                  {/* Recent Projects Section */}
                  <section className="dashboard-card recent-projects-card" style={{ marginBottom: '24px' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Folder size={18} className="text-cyan" /> Your Projects
                      </h3>
                      <button 
                        className="btn-pill glass" 
                        onClick={() => setActiveTab('hub')}
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      >
                        View All <ChevronRight size={14} />
                      </button>
                    </div>
                    
                    {projects.length === 0 ? (
                      <div className="empty-projects-state" style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        marginTop: '16px'
                      }}>
                        <Folder size={40} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Projects Yet</h4>
                        <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          Start your first project and track your creative journey.
                        </p>
                        <button className="btn-pill primary" onClick={() => setShowProjectChoiceModal(true)}>
                          <Plus size={14} /> Create First Project
                        </button>
                      </div>
                    ) : (
                      <div className="projects-list-view" style={{ marginTop: '16px' }}>
                        {(projects || []).slice(0, 5).map((project, idx) => {
                          const createdDate = project.createdAt ? new Date(project.createdAt) : (project.date ? new Date(project.date) : new Date());
                          const formattedDate = createdDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: createdDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          });
                          const _timeSince = getTimeSince(createdDate);
                          
                          return (
                            <div 
                              key={project.id || idx}
                              className="project-list-item touch-feedback"
                              onClick={() => {
                                setSelectedProject(project);
                                setActiveTab('hub');
                              }}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '48px 1fr auto',
                                gap: '16px',
                                alignItems: 'center',
                                padding: '16px',
                                background: selectedProject?.id === project.id ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.02)',
                                borderRadius: '12px',
                                marginBottom: '8px',
                                border: selectedProject?.id === project.id ? '1px solid var(--color-purple)' : '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-purple)'}
                              onMouseLeave={(e) => { if (selectedProject?.id !== project.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                            >
                              {/* Project Thumbnail/Icon */}
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '10px',
                                background: project.category === 'music' ? 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-pink) 100%)' :
                                            project.category === 'visual' ? 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-blue) 100%)' :
                                            project.category === 'marketing' ? 'linear-gradient(135deg, var(--color-orange) 0%, var(--color-red) 100%)' :
                                            'linear-gradient(135deg, var(--color-emerald) 0%, var(--color-cyan) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '1.2rem',
                                fontWeight: '700',
                                flexShrink: 0
                              }}>
                                {project.category === 'music' ? <Disc size={22} /> :
                                 project.category === 'visual' ? <ImageIcon size={22} /> :
                                 project.category === 'marketing' ? <Share2 size={22} /> :
                                 <Folder size={22} />}
                              </div>
                              
                              {/* Project Details */}
                              <div style={{ minWidth: 0 }}>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px',
                                  marginBottom: '4px'
                                }}>
                                  <h4 style={{ 
                                    margin: 0, 
                                    fontSize: '1rem', 
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {project.name}
                                  </h4>
                                  <span style={{
                                    padding: '2px 8px',
                                    background: project.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' :
                                               project.status === 'archived' ? 'rgba(100, 116, 139, 0.2)' :
                                               'rgba(168, 85, 247, 0.2)',
                                    color: project.status === 'completed' ? 'var(--color-emerald)' :
                                           project.status === 'archived' ? 'var(--text-secondary)' :
                                           'var(--color-purple)',
                                    borderRadius: '20px',
                                    fontSize: '0.65rem',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    flexShrink: 0
                                  }}>
                                    {project.status || 'Active'}
                                  </span>
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '12px',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.8rem'
                                }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <User size={12} />
                                    {user?.displayName || 'You'}
                                  </span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} />
                                    {formattedDate}
                                  </span>
                                  {project.agents?.length > 0 && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <UsersIcon size={12} />
                                      {project.agents.length} agent{project.agents.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                {project.description && (
                                  <p style={{ 
                                    margin: '6px 0 0 0', 
                                    fontSize: '0.8rem', 
                                    color: 'var(--text-secondary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {project.description}
                                  </p>
                                )}
                              </div>
                              
                              {/* Quick Actions */}
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button 
                                  className="btn-icon-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProject(project);
                                    if (project.agents?.[0]) {
                                      setSelectedAgent(project.agents[0]);
                                      setActiveTab('agents');
                                    }
                                  }}
                                  title="Open Project"
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'var(--color-purple)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Play size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        
                        {projects.length > 5 && (
                          <button 
                            className="btn-pill glass" 
                            onClick={() => setActiveTab('hub')}
                            style={{ width: '100%', marginTop: '8px' }}
                          >
                            View All {projects.length} Projects <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Brand Strategy Section */}
                  <section className="dashboard-card brand-strategy-card" style={{ marginBottom: '24px' }}>
                    <div className="card-header">
                      <h3><Target size={18} /> Build Your Legacy</h3>
                      <Zap size={18} className="text-yellow-400" />
                    </div>
                    <div className="strategy-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                      <div className="strategy-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--color-purple)' }}>Output</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Don't just make music, build a brand.</p>
                      </div>
                      <div className="strategy-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--color-cyan)' }}>Hit Ready</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Production quality that stands out.</p>
                      </div>
                      <div className="strategy-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--color-pink)' }}>Viral Videos</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Visuals designed for social impact.</p>
                      </div>
                      <div className="strategy-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--color-orange)' }}>Marketing</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Content strategy that converts.</p>
                      </div>
                    </div>
                  </section>

                  <div className="dashboard-grid">
                    {/* Dynamic Project Checklist */}
                    <div className="dashboard-card onboarding-card" style={{ border: '1px solid rgba(168, 85, 247, 0.3)', background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
                      <div className="card-header">
                        <h3>
                          <Rocket size={18} className="text-purple" /> 
                          {selectedProject ? `Project Roadmap: ${selectedProject.name}` : 'Studio Setup Checklist'}
                        </h3>
                        <span className="status-badge" style={{ background: 'var(--color-purple)', color: 'white' }}>
                          {selectedProject ? 'In Progress' : `${(paymentMethods.length > 0) ? 1 : 0} / 1 Complete`}
                        </span>
                      </div>
                      
                      <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                        
                        {selectedProject && activeProjectSteps ? (
                          activeProjectSteps.map((step, i) => (
                            <div key={i} className="checklist-item" style={{ 
                              padding: '16px', 
                              background: 'rgba(255,255,255,0.03)', 
                              borderRadius: '12px', 
                              border: '1px solid rgba(255,255,255,0.05)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => {
                              const agent = AGENTS.find(a => a.id === step.agentId);
                              if (agent) {
                                  if (agent.isPro && !isLoggedIn) {
                                      setShowLoginModal(true);
                                      handleTextToVoice(`Unlock ${agent.name} with a Pro account.`);
                                  } else {
                                      setSelectedAgent(agent);
                                      setActiveTab('agents');
                                      handleTextToVoice(`Opening ${agent.name} for project ${selectedProject.name}.`);
                                  }
                              }
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-purple)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{i+1}. {step.label}</span>
                                <step.icon size={16} className="text-purple" />
                              </div>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{step.desc}</p>
                              <button className="btn-pill glass" style={{ fontSize: '0.75rem', padding: '4px 12px', marginTop: 'auto' }}>Launch</button>
                            </div>
                          ))
                        ) : (
                          /* Default Wallet Setup Step */
                          <div className={`checklist-item ${paymentMethods.length > 0 ? 'completed' : ''}`} style={{ 
                            padding: '16px', 
                            background: paymentMethods.length > 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.03)', 
                            borderRadius: '12px', 
                            border: paymentMethods.length > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: '600', color: paymentMethods.length > 0 ? 'var(--color-emerald)' : 'var(--text-primary)' }}>Setup Wallet</span>
                              {paymentMethods.length > 0 ? <CheckCircle size={16} className="text-emerald" /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--text-secondary)' }}></div>}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Add payment method.</p>
                            {!paymentMethods.length && <button className="btn-pill glass" style={{ fontSize: '0.75rem', padding: '4px 12px', marginTop: 'auto' }} onClick={() => setDashboardTab('billing')}>Add Card</button>}
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Social Connections */}
                    <section className="dashboard-card">
                      <div className="card-header">
                        <h3><Share2 size={18} /> Social Ecosystem</h3>
                        <span className="status-badge online">Live</span>
                      </div>
                      <div className="connection-list">
                        <div className="connection-item">
                          <div className="connection-info">
                            <div className="icon-box twitter-bg">
                              <Twitter size={20} />
                            </div>
                            <div>
                              <p className="connection-name">X (Twitter)</p>
                              <p className="connection-status">{socialConnections.twitter ? `@${twitterUsername || 'Connected'}` : 'Not Connected'}</p>
                            </div>
                          </div>
                          <button 
                            className={`btn-connect ${socialConnections.twitter ? 'connected' : ''}`}
                            onClick={() => handleConnectSocial('twitter')}
                          >
                            {socialConnections.twitter ? 'Manage' : 'Connect'}
                          </button>
                        </div>
                        <div className="connection-item">
                          <div className="connection-info">
                            <div className="icon-box instagram-bg">
                              <Instagram size={20} />
                            </div>
                            <div>
                              <p className="connection-name">Instagram</p>
                              <p className="connection-status">{socialConnections.instagram ? (metaName || 'Connected') : 'Not Connected'}</p>
                            </div>
                          </div>
                          <button 
                            className={`btn-connect ${socialConnections.instagram ? 'connected' : ''}`}
                            onClick={() => handleConnectSocial('instagram')}
                          >
                            {socialConnections.instagram ? 'Manage' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* Storage Connections */}
                    <section className="dashboard-card">
                      <div className="card-header">
                        <h3><Database size={18} /> Cloud Storage</h3>
                        <span className="storage-usage">72% Full</span>
                      </div>
                      <div className="connection-list">
                        <div className="connection-item">
                          <div className="connection-info">
                            <div className="icon-box storage-bg">
                              <HardDrive size={20} />
                            </div>
                            <div>
                              <p className="connection-name">Google Drive</p>
                              <p className="connection-status">{storageConnections.googleDrive ? 'Connected' : 'Disconnected'}</p>
                            </div>
                          </div>
                          <button 
                            className={`btn-connect ${storageConnections.googleDrive ? 'connected' : ''}`}
                            onClick={() => setStorageConnections(prev => ({ ...prev, googleDrive: !prev.googleDrive }))}
                          >
                            {storageConnections.googleDrive ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {dashboardTab === 'agents' && (
                <div className="dashboard-view-agents animate-fadeIn">
                  <div className="section-header-simple">
                    <h2>Agent Management</h2>
                    <p>Show or hide agents from your main grid. Hidden agents are still accessible via search.</p>
                  </div>
                  <div className="agent-management-list">
                    {managedAgents.map((agent, idx) => (
                      <div key={idx} className={`agent-manage-row ${!agent.visible ? 'hidden-agent' : ''}`}>
                        <div className="agent-manage-info">
                          <div className={`agent-mini-icon ${agent.colorClass}`}>
                            <agent.icon size={18} />
                          </div>
                          <span>{agent.name}</span>
                        </div>
                        <div className="agent-manage-actions">
                          <button 
                            className={`toggle-btn ${agent.visible ? 'active' : ''}`}
                            onClick={() => toggleAgentVisibility(agent.name)}
                          >
                            {agent.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                            {agent.visible ? 'Visible' : 'Hidden'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashboardTab === 'billing' && (
                <div className="dashboard-view-billing animate-fadeIn">
                  <div className="section-header-simple">
                    <h2>Billing & Wallet</h2>
                    <p>Manage your payment methods and subscription plan.</p>
                  </div>

                  {/* Wallet Balance Card */}
                  <div className="wallet-balance-card">
                    <div className="balance-info">
                      <div className="balance-label">Current Balance</div>
                      <div className="balance-amount">500 <span className="currency">Credits</span></div>
                    </div>
                    <button className="btn-pill primary" onClick={() => setShowCreditsModal(true)}>
                      <Plus size={16} /> Top Up Wallet
                    </button>
                  </div>
                  
                  <div className="payment-methods-container">
                    <div className="payment-header">
                      <h3>Saved Payment Methods</h3>
                      <button className="add-payment-btn" onClick={() => setShowAddPaymentModal(true)}>
                        <Plus size={16} /> Add New
                      </button>
                    </div>
                    
                    {paymentMethods.length === 0 && bankAccounts.length === 0 ? (
                      <div className="empty-payments">
                        <CreditCard size={32} />
                        <p>No payment methods saved yet.</p>
                      </div>
                    ) : (
                      <div className="payment-list">
                        {paymentMethods.map(method => (
                          <div key={method.id} className="payment-method-card">
                            <div className="pm-icon">
                              <CreditCard size={20} />
                            </div>
                            <div className="pm-details">
                              <p className="pm-name">{method.type} ending in {method.last4}</p>
                              <p className="pm-sub">Expires {method.expiry}</p>
                            </div>
                            <div className="pm-actions">
                              <button onClick={() => { setEditingPayment(method); setPaymentType('card'); setShowAddPaymentModal(true); }}>Edit</button>
                              <button className="delete" onClick={() => handleDeletePayment(method.id, 'card')}>Remove</button>
                            </div>
                          </div>
                        ))}
                        {bankAccounts.map(bank => (
                          <div key={bank.id} className="payment-method-card">
                            <div className="pm-icon">
                              <Landmark size={20} />
                            </div>
                            <div className="pm-details">
                              <p className="pm-name">{bank.bankName}</p>
                              <p className="pm-sub">****{bank.last4}</p>
                            </div>
                            <div className="pm-actions">
                              <button onClick={() => { setEditingPayment(bank); setPaymentType('bank'); setShowAddPaymentModal(true); }}>Edit</button>
                              <button className="delete" onClick={() => handleDeletePayment(bank.id, 'bank')}>Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subscription Plans Section */}
                  <div className="plans-section" style={{ marginTop: '2rem' }}>
                    <div className="payment-header">
                      <h3>Available Plans</h3>
                    </div>
                    
                    <div className="plans-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(4, 1fr)', 
                      gap: '1rem',
                      marginTop: '1rem'
                    }}>
                      {/* Free Plan */}
                      <div className="pricing-card-native">
                        <div className="plan-header-native">
                          <h3 className="plan-name-native">Free</h3>
                          <div className="plan-price-box-native">
                            <span className="plan-price-native">$0</span>
                          </div>
                        </div>
                        <ul className="plan-features-native">
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>Up to 3 agents</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>3 uses per agent</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>10s audio output</span></li>
                        </ul>
                        <button 
                          className="plan-button-native secondary"
                          disabled={true}
                          style={{ opacity: 0.5, cursor: 'default' }}
                        >
                          Current Plan
                        </button>
                      </div>

                      {/* Creator Plan */}
                      <div className="pricing-card-native popular">
                        <div className="popular-badge-native">Most Popular</div>
                        <div className="plan-header-native">
                          <h3 className="plan-name-native">Creator</h3>
                          <div className="plan-price-box-native">
                            <span className="plan-price-native">$4.99</span>
                            <span className="plan-period-native">/mo</span>
                          </div>
                        </div>
                        <ul className="plan-features-native">
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>Up to 5 agents</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>100 uses/month</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>30s audio output</span></li>
                        </ul>
                        <button 
                          className="plan-button-native primary"
                          onClick={() => handleSubscribe({ name: 'Creator', price: '$4.99', period: '/month' })}
                        >
                          Subscribe
                        </button>
                      </div>

                      {/* Studio Pro Plan */}
                      <div className="pricing-card-native">
                        <div className="plan-header-native">
                          <h3 className="plan-name-native">Studio Pro</h3>
                          <div className="plan-price-box-native">
                            <span className="plan-price-native">$14.99</span>
                            <span className="plan-period-native">/mo</span>
                          </div>
                        </div>
                        <ul className="plan-features-native">
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>All 16 agents</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>Unlimited uses</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>60s audio output</span></li>
                        </ul>
                        <button 
                          className="plan-button-native primary"
                          onClick={() => handleSubscribe({ name: 'Studio Pro', price: '$14.99', period: '/month' })}
                        >
                          Subscribe
                        </button>
                      </div>

                      {/* LTD Plan */}
                      <div className="pricing-card-native ltd-card">
                        <div className="ltd-badge-native">Limited Time Offer</div>
                        <div className="plan-header-native">
                          <h3 className="plan-name-native">Lifetime</h3>
                          <div className="plan-price-box-native">
                            <span className="plan-price-native">$99</span>
                            <span className="plan-period-native">one-time</span>
                          </div>
                        </div>
                        <ul className="plan-features-native">
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>500 Credits / Month</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>All 16 Agents</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>Commercial License</span></li>
                        </ul>
                        <button 
                          className="plan-button-native primary"
                          onClick={() => handleSubscribe({ name: 'Lifetime Access', price: '$99', period: 'one-time' })}
                        >
                          Get Lifetime
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {dashboardTab === 'settings' && (
                <div className="dashboard-view-settings animate-fadeIn">
                  <div className="section-header-simple">
                    <h2>Application Settings</h2>
                    <p>Customize your Studio Agents experience.</p>
                  </div>
                  
                  <div className="settings-list">
                    <div className="setting-row">
                      <div className="setting-info">
                        <h4>Show Industry Pulse</h4>
                        <p>Display the latest music industry news in your dashboard.</p>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={appSettings.showNews} 
                          onChange={() => toggleAppSetting('showNews')} 
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>

                    <div className="setting-row">
                      <div className="setting-info">
                        <h4>Public Activity Wall</h4>
                        <p>Allow your shared creations to be seen by the community.</p>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={appSettings.publicActivity} 
                          onChange={() => toggleAppSetting('publicActivity')} 
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>

                    <div className="setting-row">
                      <div className="setting-info">
                        <h4>Auto-Save Projects</h4>
                        <p>Automatically save your work to local storage every 5 minutes.</p>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={appSettings.autoSave} 
                          onChange={() => toggleAppSetting('autoSave')} 
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>

                    <div className="setting-row">
                      <div className="setting-info">
                        <h4>High Quality Previews</h4>
                        <p>Generate higher fidelity audio previews (may take longer).</p>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={appSettings.highQualityPreviews} 
                          onChange={() => toggleAppSetting('highQualityPreviews')} 
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>

                    <div className="setting-row">
                      <div className="setting-info">
                        <h4>Streamer Mode</h4>
                        <p>Hide sensitive personal information like email and billing details.</p>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={appSettings.streamerMode} 
                          onChange={() => toggleAppSetting('streamerMode')} 
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>

                    <div className="setting-row">
                      <div className="setting-info">
                        <h4>Reset Onboarding</h4>
                        <p>View the "Welcome to The Studio" introduction again.</p>
                      </div>
                      <button 
                        className="secondary-button"
                        onClick={() => {
                          localStorage.removeItem('studio_onboarding_v2');
                          setOnboardingStep(0);
                          setShowOnboarding(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <RefreshCw size={16} />
                        Reset Tour
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Show agent workspace for non-agents tabs (e.g., coming from project_canvas)
    // The agents tab now has its own split layout handling
    if (selectedAgent && activeTab !== 'agents') {
      const Icon = selectedAgent.icon;
      return (
        <div className="agent-active-view animate-fadeInUp" style={{ position: 'relative', paddingBottom: '80px' }}>
          {/* Onboarding Nudge */}
          {showNudge && selectedAgent.onboarding && (
            <div className="agent-nudge-overlay animate-fadeInDown">
              <div className="nudge-header">
                <h4><Sparkles size={16} /> Quick Start Guide</h4>
                <button className="nudge-close" onClick={() => setShowNudge(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="nudge-steps">
                {selectedAgent.onboarding.map((step, idx) => (
                  <div key={idx} className="nudge-step">
                    <span className="step-num">{idx + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
              <div className="nudge-footer">
                <button className="nudge-cta" onClick={() => setShowNudge(false)}>
                  Got it, let's go!
                </button>
              </div>
            </div>
          )}

          <button 
            className="back-to-grid" 
            onClick={() => setSelectedAgent(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', marginBottom: '2rem' }}
          >
            <ArrowLeft size={20} />
            <span>{activeTab === 'project_canvas' ? 'Back to Project' : 'Back to Agents'}</span>
          </button>

          <div className="agent-detail-layout">
            <div className="agent-main-panel">
              <div className="agent-hero-card">
                <div className={`agent-icon-large ${selectedAgent.colorClass}`}>
                  <Icon size={40} />
                </div>
                <div className="agent-hero-info">
                  <span className="agent-badge">{selectedAgent.category}</span>
                  <h2>{selectedAgent.name}</h2>
                  <p>{selectedAgent.description || selectedAgent.desc}</p>
                </div>
              </div>

              <div className="agent-utility-box">
                <div className="utility-controls">
                  <div className="control-group">
                    <label>Genre / Style</label>
                    <select className="studio-select">
                      <option>Hip Hop / Rap</option>
                      <option>Pop / Modern</option>
                      <option>R&B / Soul</option>
                      <option>Electronic / Dance</option>
                      <option>Rock / Alternative</option>
                      <option>Lo-Fi / Chill</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Intensity / Mood</label>
                    <input type="range" className="studio-slider" min="1" max="10" defaultValue="5" />
                  </div>
                </div>

                <div className="prompt-area">
                  <div className="prompt-header">
                    <label>Creative Prompt</label>
                    <div className="voice-controls">
                      {voiceSettings.language !== 'English' && (
                        <button 
                          className="btn-pill glass translate-btn"
                          onClick={handleTranslatePrompt}
                          title="Translate to English"
                        >
                          <Languages size={16} />
                        </button>
                      )}
                      <button 
                        className={`btn-pill ${isListening ? 'primary' : 'glass'}`} 
                        onClick={handleVoiceToText}
                        title="Voice to Text"
                      >
                        <Mic size={16} />
                      </button>
                      <button 
                        className={`btn-pill ${isSpeaking ? 'primary' : 'glass'}`} 
                        onClick={handleTextToVoice}
                        title="Text to Voice"
                      >
                        <Volume2 size={16} />
                      </button>
                      
                      <div className="voice-settings-container">
                        <button 
                          className={`btn-pill ${showVoiceHelp ? 'primary' : 'glass'}`}
                          onClick={() => {
                            setShowVoiceHelp(!showVoiceHelp);
                            setShowVoiceSettings(false);
                          }}
                          title="How to use Voice Controls"
                        >
                          <CircleHelp size={16} />
                        </button>
                        
                        {showVoiceHelp && (
                          <div className="voice-settings-dropdown animate-fadeInUp" style={{ width: '280px', right: '40px' }}>
                            <div className="settings-group">
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mic size={14} className="text-purple" /> Voice to Text
                              </label>
                              <p className="help-text small" style={{ marginTop: '4px' }}>
                                Click the microphone to dictate your prompt. Speak clearly. Click again to stop.
                              </p>
                            </div>
                            <div className="settings-group">
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Volume2 size={14} className="text-cyan" /> Text to Voice
                              </label>
                              <p className="help-text small" style={{ marginTop: '4px' }}>
                                Click the speaker to hear the AI read the current text. Useful for reviewing lyrics.
                              </p>
                            </div>
                            <div className="settings-group">
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={14} /> Settings
                              </label>
                              <p className="help-text small" style={{ marginTop: '4px' }}>
                                Customize the AI voice gender, accent (US/UK/AU), and language.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="voice-settings-container">
                        <button 
                          className={`btn-pill ${showVoiceSettings ? 'primary' : 'glass'}`}
                          onClick={() => {
                            setShowVoiceSettings(!showVoiceSettings);
                            setShowVoiceHelp(false);
                          }}
                          title="Voice Settings"
                        >
                          <Settings size={16} />
                        </button>
                        
                        {showVoiceSettings && (
                          <div className="voice-settings-dropdown animate-fadeInUp">
                            <div className="settings-group">
                              <label>🎤 AI Voice Type (Real Vocals, Not TTS)</label>
                              <select 
                                value={voiceSettings.style || 'rapper'}
                                onChange={(e) => setVoiceSettings({...voiceSettings, style: e.target.value})}
                                className="settings-select"
                              >
                                <optgroup label="🔥 AI Rappers (Suno/Bark)">
                                  <option value="rapper">🎤 Male Rapper</option>
                                  <option value="rapper-female">💜 Female Rapper</option>
                                </optgroup>
                                <optgroup label="🎵 AI Singers">
                                  <option value="singer">🎤 Male Singer (R&B/Soul)</option>
                                  <option value="singer-female">💫 Female Singer (Pop/R&B)</option>
                                </optgroup>
                                <optgroup label="🗣️ Speech/Narration">
                                  <option value="narrator">📢 Narrator (Deep Voice)</option>
                                  <option value="spoken">💬 Spoken Word</option>
                                </optgroup>
                              </select>
                            </div>
                            
                            {/* Rap Style - only show for rapper voices */}
                            {(voiceSettings.style === 'rapper' || voiceSettings.style === 'rapper-female') && (
                              <div className="settings-group">
                                <label>🎯 Rap Flow & Delivery</label>
                                <select 
                                  value={voiceSettings.rapStyle || 'aggressive'}
                                  onChange={(e) => setVoiceSettings({...voiceSettings, rapStyle: e.target.value})}
                                  className="settings-select"
                                >
                                  <option value="aggressive">💥 Aggressive (Hard-hitting)</option>
                                  <option value="melodic">🎵 Melodic (Singing flow)</option>
                                  <option value="trap">🔥 Trap (Triplets + Ad-libs)</option>
                                  <option value="drill">🇬🇧 Drill (UK style)</option>
                                  <option value="boom-bap">📻 Boom-Bap (Classic hip-hop)</option>
                                  <option value="fast">⚡ Fast Flow (Technical)</option>
                                  <option value="chill">😎 Chill (Laid-back)</option>
                                  <option value="hype">🔊 Hype (High energy)</option>
                                </select>
                              </div>
                            )}
                            
                            {/* Genre - for singers */}
                            {(voiceSettings.style === 'singer' || voiceSettings.style === 'singer-female') && (
                              <div className="settings-group">
                                <label>🎶 Music Genre</label>
                                <select 
                                  value={voiceSettings.genre || 'r&b'}
                                  onChange={(e) => setVoiceSettings({...voiceSettings, genre: e.target.value})}
                                  className="settings-select"
                                >
                                  <option value="r&b">💜 R&B / Soul</option>
                                  <option value="pop">🌟 Pop</option>
                                  <option value="hip-hop">🔥 Hip-Hop</option>
                                  <option value="soul">🎷 Soul / Gospel</option>
                                </select>
                              </div>
                            )}
                            
                            <p className="settings-info" style={{ marginTop: '8px', opacity: 0.8 }}>
                              🚀 <strong>Real AI Vocals</strong> powered by Suno AI & Bark. 
                              {(voiceSettings.style === 'rapper' || voiceSettings.style === 'rapper-female') && ` Flow: ${voiceSettings.rapStyle || 'aggressive'}`}
                              {(voiceSettings.style === 'singer' || voiceSettings.style === 'singer-female') && ` Genre: ${voiceSettings.genre || 'r&b'}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Model Picker - Clean Card Design */}
                  <div className="model-picker-card" style={{
                    marginBottom: '12px',
                    padding: '12px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Cpu size={18} style={{ color: 'var(--color-purple)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>AI Model</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>
                            {AI_MODELS.find(m => m.id === selectedModel)?.name || 'Gemini Flash'}
                          </div>
                        </div>
                      </div>
                      
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        style={{
                          padding: '8px 32px 8px 12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 8px center',
                          backgroundSize: '14px'
                        }}
                      >
                        {AI_MODELS.filter(m => m.provider === 'Google').map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                        {AI_MODELS.filter(m => m.provider === 'Anthropic').map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                        {AI_MODELS.filter(m => m.provider === 'OpenAI').map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Reference / Attachment Input for specific agents */}
                  {(selectedAgent?.id === 'beat' || selectedAgent?.id === 'video-creator' || selectedAgent?.id === 'video-scorer') && (
                    <div className="reference-upload-card" style={{
                      marginBottom: '12px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(6, 182, 212, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {selectedAgent?.id === 'video-creator' ? <Music size={16} color="var(--color-cyan)" /> : <Upload size={16} color="var(--color-cyan)" />}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {selectedAgent?.id === 'video-creator' ? 'Attach Song (for Sync)' : 'Reference Track'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>
                            {backingTrack ? backingTrack.title : 'Upload Audio...'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {backingTrack && (
                          <button 
                            onClick={() => setBackingTrack(null)}
                            style={{ padding: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          >
                            <X size={16} />
                          </button>
                        )}
                        <label 
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'white'
                          }}
                        >
                          <input 
                            type="file" 
                            accept="audio/*" 
                            style={{ display: 'none' }} 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                // Create a mock backing track object from the file
                                const url = URL.createObjectURL(file);
                                setBackingTrack({
                                  title: file.name,
                                  audioUrl: url,
                                  type: 'audio',
                                  isUpload: true
                                });
                                toast.success(`Attached "${file.name}"`);
                              }
                            }}
                          />
                          Select File
                        </label>
                      </div>
                    </div>
                  )}

                  <textarea 
                    ref={textareaRef}
                    placeholder={`Describe what you want ${selectedAgent.name} to create...`}
                    className="studio-textarea"
                  ></textarea>
                  
                  <div className="generation-actions">
                    <button 
                      className="cta-button-secondary"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      title="Generate a preview"
                    >
                      <Play size={16} />
                      Preview
                    </button>
                    <button 
                      className={`cta-button-premium ${isGenerating ? 'loading' : ''}`} 
                      style={{ flex: 1 }}
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="spinner-mini"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={18} />
                          <span>Generate {selectedAgent.name}</span>
                        </>
                      )}
                    </button>
                    <button 
                      className="cta-button-secondary"
                      onClick={() => setShowExternalSaveModal(true)}
                      title="Save to Cloud Storage"
                    >
                      <Cloud size={18} />
                      <span>Save to Cloud</span>
                    </button>
                  </div>

                  {/* Inline Preview of Last Generation */}
                  {(() => {
                    const currentPreview = selectedAgent?.id ? agentPreviews[selectedAgent.id] : null;
                    if (!currentPreview) return null;
                    
                    return (
                    <div className="agent-preview-mini animate-fadeIn" style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Last Generated</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setPreviewItem(currentPreview)} style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Maximize2 size={12} /> View Full
                          </button>
                        </div>
                      </div>
                      
                      {currentPreview.type === 'image' && currentPreview.imageUrl ? (
                        <img src={currentPreview.imageUrl} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setPreviewItem(currentPreview)} />
                      ) : currentPreview.type === 'video' && currentPreview.videoUrl ? (
                        <div style={{ position: 'relative' }}>
                          <video src={currentPreview.videoUrl} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setPreviewItem(currentPreview)} />
                          {currentPreview.audioUrl && (
                            <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Music size={10} /> Synced
                            </div>
                          )}
                        </div>
                      ) : (currentPreview.type === 'audio' || currentPreview.type === 'vocal') && currentPreview.audioUrl ? (
                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                           {currentPreview.imageUrl && (
                             <div style={{
                               width: '48px',
                               height: '48px',
                               borderRadius: '6px',
                               background: `url(${currentPreview.imageUrl}) center/cover`,
                               flexShrink: 0
                             }} />
                           )}
                           <div style={{ flex: 1, minWidth: 0 }}>
                             {currentPreview.backingTrackUrl ? (
                               <>
                                 <div style={{ fontSize: '0.65rem', color: 'var(--color-pink)', marginBottom: '2px', fontWeight: 'bold' }}>Synced Vocals</div>
                                 <audio 
                                   controls 
                                   src={currentPreview.audioUrl} 
                                   style={{ width: '100%', height: '32px', marginBottom: '4px' }}
                                   onPlay={(e) => {
                                      const container = e.target.parentElement;
                                      const backingAudio = container.querySelector('.preview-backing-audio');
                                      if (backingAudio) {
                                        backingAudio.currentTime = e.target.currentTime;
                                        backingAudio.play();
                                      }
                                   }}
                                   onPause={(e) => {
                                      const container = e.target.parentElement;
                                      const backingAudio = container.querySelector('.preview-backing-audio');
                                      if (backingAudio) backingAudio.pause();
                                   }}
                                   onTimeUpdate={(e) => {
                                      const container = e.target.parentElement;
                                      const backingAudio = container.querySelector('.preview-backing-audio');
                                      if (backingAudio && Math.abs(backingAudio.currentTime - e.target.currentTime) > 0.5) {
                                        backingAudio.currentTime = e.target.currentTime;
                                      }
                                   }}
                                 />
                                 <audio className="preview-backing-audio" src={currentPreview.backingTrackUrl} style={{ display: 'none' }} />
                               </>
                             ) : (
                               <audio controls src={currentPreview.audioUrl} style={{ width: '100%', height: '32px', marginBottom: '4px' }} />
                             )}
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                               {currentPreview.snippet}
                             </div>
                           </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', maxHeight: '80px', overflow: 'hidden' }}>
                          {currentPreview.snippet}
                        </div>
                      )}
                      
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-pill primary" 
                          style={{ flex: 1, fontSize: '0.75rem', justifyContent: 'center' }}
                          onClick={() => {
                            if (selectedProject) {
                              handleSaveAssetToProject(selectedProject.id, currentPreview);
                              toast.success(`Saved to ${selectedProject.name}`);
                            } else {
                              handleCreateProjectWithAsset(`New ${selectedAgent?.name || 'AI'} Project`, currentPreview);
                            }
                          }}
                        >
                          <FolderPlus size={14} /> Save to Project
                        </button>
                        {/* TTS Preview - Read text aloud (not for vocal creation) */}
                        {currentPreview.snippet && !currentPreview.audioUrl && (
                          <button 
                            className="btn-pill secondary" 
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => {
                              const text = currentPreview.snippet || currentPreview.content || '';
                              if (window.speechSynthesis.speaking) {
                                window.speechSynthesis.cancel();
                              } else {
                                const utterance = new SpeechSynthesisUtterance(text);
                                window.speechSynthesis.speak(utterance);
                              }
                            }}
                            title="Read text aloud using browser TTS"
                          >
                            <Volume2 size={14} /> Read Aloud
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })()}
                  
                  <p className="studio-disclaimer">
                    <Shield size={12} />
                    AI-generated content may require manual review for platform compliance.
                  </p>
                </div>
              </div>

              <div className="agent-history-section" style={{ marginTop: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '16px'
                }}>
                  <h3 style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    margin: 0,
                    fontSize: '1.1rem',
                    color: 'white'
                  }}>
                    <Folder size={18} style={{ color: 'var(--color-purple)' }} />
                    {selectedAgent.name} Inventory
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '3px 8px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '10px',
                      color: 'var(--color-purple)',
                      fontWeight: '600'
                    }}>
                      {(projects || []).filter(p => p.agent === selectedAgent.name).length} items
                    </span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('mystudio')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    View All
                    <ArrowRight size={14} />
                  </button>
                </div>
                
                {/* Inventory List (Agent History) */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                  {(() => {
                    // Find all assets created by this agent across all projects
                    const agentAssets = projects.flatMap(p => p.assets || [])
                      .filter(a => a.agent === selectedAgent.name || a.agentId === selectedAgent.id)
                      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                      
                    if (agentAssets.length > 0) {
                      return agentAssets.map((item, idx) => (
                        <div 
                          key={idx} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '14px 16px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '14px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onClick={() => setPreviewItem(item)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          }}
                        >
                          {/* Preview Thumbnail */}
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '10px',
                            background: item.imageUrl 
                              ? `url(${item.imageUrl}) center/cover` 
                              : item.audioUrl
                              ? 'linear-gradient(135deg, var(--color-cyan), var(--color-green))'
                              : 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            {!item.imageUrl && !item.audioUrl && <FileText size={20} style={{ color: 'white' }} />}
                            {item.audioUrl && !item.imageUrl && <Volume2 size={20} style={{ color: 'white' }} />}
                            {item.imageUrl && item.audioUrl && (
                              <div style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                background: 'rgba(0,0,0,0.6)',
                                padding: '2px',
                                borderTopLeftRadius: '6px'
                              }}>
                                <Music size={12} color="white" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: '0.9rem', 
                              fontWeight: '600', 
                              color: 'white',
                              marginBottom: '4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.title || item.snippet?.substring(0, 30) || 'Untitled Creation'}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.snippet?.substring(0, 60) || 'No prompt saved'}...
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              marginTop: '6px'
                            }}>
                              <span style={{ 
                                fontSize: '0.65rem', 
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Clock size={10} />
                                {item.date || 'Recent'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '6px',
                            flexShrink: 0
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewItem(item);
                              }}
                              title="View"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white'
                              }}
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </div>
                      ));
                    } else {
                      return (
                        <div style={{ 
                          padding: '32px', 
                          textAlign: 'center', 
                          color: 'var(--text-secondary)',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '12px'
                        }}>
                          <Sparkles size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                          <p>No creations yet. Start generating!</p>
                        </div>
                      );
                    }
                  })()}
                </div>

                
                {/* Prompt History Quick Access */}
                {selectedAgent && (projects || []).filter(p => p.agent === selectedAgent.name).length > 0 && (
                  <div style={{ 
                    marginTop: '16px',
                    padding: '14px 16px',
                    background: 'rgba(139, 92, 246, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(139, 92, 246, 0.15)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '10px'
                    }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: '600', 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Clock size={14} style={{ color: 'var(--color-purple)' }} />
                        Recent Prompts
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(projects || [])
                        .filter(p => p.agent === selectedAgent?.name && p.snippet)
                        .slice(0, 5)
                        .map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const textarea = textareaRef.current || document.querySelector('.studio-textarea');
                              if (textarea) {
                                textarea.value = item.snippet;
                                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                                toast.success('Prompt loaded!');
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              color: 'var(--text-secondary)',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              maxWidth: '150px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                            title={item.snippet}
                          >
                            {item.snippet?.substring(0, 25)}...
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="agent-side-panel">
              {selectedAgent.hasSocials && (
                <div className="side-info-card social-connect-card">
                  <h3>Connect Socials</h3>
                  <div className="social-connect-grid">
                    <button 
                      className={`social-connect-btn ${socialConnections.instagram ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('instagram')}
                    >
                      <Globe size={16} />
                      <span>{socialConnections.instagram ? (metaName ? `Insta: ${metaName}` : 'Instagram Linked') : 'Link Instagram'}</span>
                    </button>
                    <button 
                      className={`social-connect-btn ${socialConnections.facebook ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('facebook')}
                    >
                      <Zap size={16} />
                      <span>{socialConnections.facebook ? (metaName ? `FB: ${metaName}` : 'Facebook Linked') : 'Link Facebook'}</span>
                    </button>
                    <button 
                      className={`social-connect-btn ${socialConnections.tiktok ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('tiktok')}
                    >
                      <Zap size={16} />
                      <span>{socialConnections.tiktok ? 'TikTok Linked' : 'Link TikTok'}</span>
                    </button>
                    <button 
                      className={`social-connect-btn ${socialConnections.twitter ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('twitter')}
                    >
                      <MessageSquare size={16} />
                      <span>{socialConnections.twitter ? (twitterUsername ? `@${twitterUsername}` : 'X/Twitter Linked') : 'Link X/Twitter'}</span>
                    </button>
                    {(selectedAgent?.id === 'collab' || selectedAgent?.id === 'release') && (
                      <button 
                        className={`social-connect-btn ${socialConnections.spotify ? 'connected' : ''}`}
                        onClick={() => handleConnectSocial('spotify')}
                      >
                        <Music size={16} />
                        <span>{socialConnections.spotify ? 'Spotify Linked' : 'Link Spotify'}</span>
                      </button>
                    )}
                  </div>
                  <p className="help-text mini">One-click secure OAuth connection.</p>
                </div>
              )}

              <div className="side-info-card">
                <h3>Capabilities</h3>
                <ul className="capability-list">
                  {(selectedAgent?.capabilities || []).map((cap, i) => (
                    <li key={i}><Sparkles size={14} /> {cap}</li>
                  ))}
                </ul>
              </div>

              <div className="side-info-card">
                <h3>How to Use</h3>
                <p className="help-text">{selectedAgent?.howToUse || 'Enter your prompt and generate content.'}</p>
              </div>

              <div className="side-info-card agent-intelligence-card">
                <div className="card-header-with-icon">
                  <CircleHelp size={18} className="text-purple" />
                  <h3>Agent Intelligence</h3>
                </div>
                <div className="intelligence-content">
                  <div className="intel-section">
                    <h4>The "How"</h4>
                    <p className="help-text small">{selectedAgent?.explanation || ''}</p>
                  </div>
                  <div className="intel-section">
                    <h4>Pro Tips</h4>
                    <p className="help-text small">{selectedAgent?.helpTips || ''}</p>
                  </div>
                </div>
              </div>

              <div className="side-info-card">
                <h3>Examples</h3>
                <div className="example-chips">
                  {(selectedAgent?.examples || []).map((ex, i) => (
                    <div 
                      key={i} 
                      className="example-chip" 
                      onClick={() => {
                        const textarea = textareaRef.current || document.querySelector('.studio-textarea');
                        if (textarea) {
                          textarea.value = ex;
                          textarea.dispatchEvent(new Event('input', { bubbles: true }));
                          // Trigger a visual flash or focus to show it worked
                          textarea.focus();
                          textarea.style.borderColor = 'var(--color-purple)';
                          setTimeout(() => textarea.style.borderColor = '', 300);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      "{ex}"
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {

      case 'agents': {
        const availableAgents = getAvailableAgents();
        const lockedAgents = getLockedAgents();
        const allAgents = [...availableAgents, ...lockedAgents];
        
        // Render the agent workspace content (used in main panel when agent is selected)
        const renderAgentWorkspace = () => {
          if (!selectedAgent) return null;
          const Icon = selectedAgent.icon;
          
          return (
            <div className="agent-workspace-content">
              {/* Onboarding Nudge */}
              {showNudge && selectedAgent.onboarding && (
                <div className="agent-nudge-overlay animate-fadeInDown" style={{ marginBottom: '24px' }}>
                  <div className="nudge-header">
                    <h4><Sparkles size={16} /> Quick Start Guide</h4>
                    <button className="nudge-close" onClick={() => setShowNudge(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="nudge-steps">
                    {selectedAgent.onboarding.map((step, idx) => (
                      <div key={idx} className="nudge-step">
                        <span className="step-num">{idx + 1}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="nudge-footer">
                    <button className="nudge-cta" onClick={() => setShowNudge(false)}>
                      Got it, let's go!
                    </button>
                  </div>
                </div>
              )}

              <div className="agent-detail-layout" style={{ gridTemplateColumns: '1fr 300px' }}>
                <div className="agent-main-panel">
                  <div className="agent-hero-card">
                    <div className={`agent-icon-large ${selectedAgent.colorClass}`}>
                      <Icon size={40} />
                    </div>
                    <div className="agent-hero-info">
                      <span className="agent-badge">{selectedAgent.category}</span>
                      <h2>{selectedAgent.name}</h2>
                      <p>{selectedAgent.description || selectedAgent.desc}</p>
                    </div>
                  </div>

                  <div className="agent-utility-box">
                    <div className="utility-controls">
                      <div className="control-group">
                        <label>Genre / Style</label>
                        <select className="studio-select">
                          <option>Hip Hop / Rap</option>
                          <option>Pop / Modern</option>
                          <option>R&B / Soul</option>
                          <option>Electronic / Dance</option>
                          <option>Rock / Alternative</option>
                          <option>Lo-Fi / Chill</option>
                        </select>
                      </div>
                      <div className="control-group">
                        <label>Intensity / Mood</label>
                        <input type="range" className="studio-slider" min="1" max="10" defaultValue="5" />
                      </div>
                    </div>

                    <div className="prompt-area">
                      <div className="prompt-header">
                        <label>Creative Prompt</label>
                        <div className="voice-controls">
                          <button 
                            className={`btn-pill ${isListening ? 'primary' : 'glass'}`} 
                            onClick={handleVoiceToText}
                            title="Voice to Text"
                          >
                            <Mic size={16} />
                          </button>
                          <button 
                            className={`btn-pill ${isSpeaking ? 'primary' : 'glass'}`} 
                            onClick={handleTextToVoice}
                            title="Text to Voice"
                          >
                            <Volume2 size={16} />
                          </button>
                          <button 
                            className={`btn-pill ${showVoiceSettings ? 'primary' : 'glass'}`}
                            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                            title="Voice Settings"
                          >
                            <Settings size={16} />
                          </button>
                        </div>
                      </div>
                      <textarea 
                        ref={textareaRef}
                        placeholder={`Describe what you want ${selectedAgent.name} to create...`}
                        className="studio-textarea"
                      ></textarea>
                      
                      <div className="generation-actions" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button 
                          className="btn-pill glass"
                          onClick={() => setQuickWorkflowAgent(selectedAgent)}
                        >
                          <Zap size={16} />
                          Quick Generate
                        </button>
                        <button 
                          className={`btn-pill primary ${isGenerating ? 'loading' : ''}`} 
                          style={{ flex: 1 }}
                          onClick={handleGenerate}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <div className="spinner-mini"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <Zap size={18} />
                              <span>Generate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Recent Creations */}
                  <div className="side-info-card" style={{ marginTop: '16px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} className="text-purple" />
                      Recent Creations
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      {(() => {
                        const agentProjects = (projects || []).filter(p => p.agent === selectedAgent.name).slice(0, 3);
                        if (agentProjects.length > 0) {
                          return agentProjects.map((item, i) => (
                            <div
                              key={item.id || i}
                              onClick={() => setPreviewItem(item)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 12px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: item.imageUrl ? `url(${item.imageUrl}) center/cover` : 'rgba(139, 92, 246, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {!item.imageUrl && <FileText size={14} style={{ opacity: 0.5 }} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.title || item.snippet?.substring(0, 30) || 'Untitled'}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                  {item.date || 'Recent'}
                                </div>
                              </div>
                              <Eye size={14} style={{ opacity: 0.5 }} />
                            </div>
                          ));
                        }
                        return (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            No creations yet. Start generating!
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Right info panel */}
                <div className="agent-side-panel">
                  <div className="side-info-card">
                    <h3>Capabilities</h3>
                    <ul className="capability-list">
                      {(selectedAgent?.capabilities || []).map((cap, i) => (
                        <li key={i}><Sparkles size={14} /> {cap}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="side-info-card">
                    <h3>How to Use</h3>
                    <p className="help-text">{selectedAgent?.howToUse || 'Enter your prompt and generate content.'}</p>
                  </div>

                  <div className="side-info-card">
                    <h3>Examples</h3>
                    <div className="example-chips">
                      {(selectedAgent?.examples || []).slice(0, 3).map((ex, i) => (
                        <div 
                          key={i} 
                          className="example-chip" 
                          onClick={() => {
                            const textarea = textareaRef.current;
                            if (textarea) {
                              textarea.value = ex;
                              textarea.focus();
                            }
                          }}
                        >
                          "{ex.length > 50 ? ex.substring(0, 50) + '...' : ex}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        };
        
        return (
          <div className="agents-split-layout">
            {/* Left Sidebar - Agent List */}
            <div className="agents-sidebar">
              <div className="agents-sidebar-header">
                <h3><Sparkles size={18} className="text-purple" /> Agents</h3>
                <p>{availableAgents.length} available</p>
              </div>
              
              <div className="agents-sidebar-list">
                {/* Available Agents */}
                {availableAgents.map((agent) => {
                  const Icon = agent.icon;
                  const isActive = selectedAgent?.id === agent.id;
                  return (
                    <button
                      key={agent.id}
                      className={`agent-sidebar-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedAgent(agent);
                        Analytics.agentUsed(agent.id);
                      }}
                    >
                      <div className={`agent-sidebar-icon ${agent.colorClass}`}>
                        <Icon size={18} />
                      </div>
                      <div className="agent-sidebar-info">
                        <h4>{agent.name}</h4>
                        <span>{agent.category}</span>
                      </div>
                      {agent.isBeta && (
                        <span className="agent-sidebar-badge beta">BETA</span>
                      )}
                    </button>
                  );
                })}
                
                {/* Locked Agents Section */}
                {lockedAgents.length > 0 && (
                  <>
                    <div className="agents-sidebar-section">
                      <h5><Lock size={10} /> Premium</h5>
                    </div>
                    {lockedAgents.map((agent) => {
                      const Icon = agent.icon;
                      return (
                        <button
                          key={agent.id}
                          className="agent-sidebar-item locked"
                          onClick={() => {
                            if (!isLoggedIn) {
                              setShowLoginModal(true);
                            } else {
                              setDashboardTab('subscription');
                              setActiveTab('mystudio');
                            }
                          }}
                        >
                          <div className="agent-sidebar-icon" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Icon size={18} style={{ opacity: 0.5 }} />
                          </div>
                          <div className="agent-sidebar-info">
                            <h4>{agent.name}</h4>
                            <span>{agent.tier === 'monthly' ? 'Monthly' : 'Pro'}</span>
                          </div>
                          <Lock size={12} style={{ opacity: 0.5 }} />
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
            
            {/* Main Panel - Welcome or Agent Workspace */}
            <div className="agents-main-panel">
              {selectedAgent ? (
                renderAgentWorkspace()
              ) : (
                /* Welcome State */
                <div className="agents-welcome-state">
                  <div className="agents-welcome-icon">
                    <Sparkles size={36} className="text-purple" />
                  </div>
                  <h2>Select an Agent</h2>
                  <p>Choose an AI agent from the sidebar to start creating. Each agent specializes in different creative tasks.</p>
                  
                  {/* Free generation banner */}
                  {!isLoggedIn && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      maxWidth: '400px'
                    }}>
                      <Zap size={20} className="text-purple" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                          {getRemainingFreeGenerations()} free generations left
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Sign in to unlock more
                        </div>
                      </div>
                      <button 
                        className="btn-pill primary"
                        onClick={() => setShowLoginModal(true)}
                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      >
                        Sign In
                      </button>
                    </div>
                  )}
                  
                  {/* Quick picks */}
                  <div className="agents-welcome-grid">
                    {availableAgents.slice(0, 4).map((agent) => {
                      const Icon = agent.icon;
                      return (
                        <div
                          key={agent.id}
                          className="agents-welcome-card"
                          onClick={() => {
                            setSelectedAgent(agent);
                            Analytics.agentUsed(agent.id);
                          }}
                        >
                          <h4>
                            <Icon size={16} className="text-purple" />
                            {agent.name}
                          </h4>
                          <p>{agent.category}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'hub':
        return (
          <Suspense fallback={<LazyFallback />}>
            <ProjectHub
              projects={projects}
              setProjects={setProjects}
              onSelectProject={(project) => {
                console.log('[StudioView] Selecting project:', project?.id, project?.name, 'assets:', project?.assets?.length);
                // Reset canvas preview asset to avoid stale references
                setCanvasPreviewAsset(null);
                setSelectedProject(project);
                // Use pendingProjectNav flag for safe navigation (prevents race condition)
                setPendingProjectNav(true);
              }}
              onCreateProject={(project) => {
                console.log('[StudioView] Orchestrator project save:', project.id, project.name);
                
                // Check credits
                const currentCredits = typeof userCredits === 'number' ? userCredits : 0;
                if (currentCredits < PROJECT_CREDIT_COST) {
                  console.error('[StudioView] Insufficient credits for orchestrator save');
                  toast.error(`Not enough credits. You need ${PROJECT_CREDIT_COST} credits to save.`);
                  setShowCreditsModal(true);
                  return;
                }
                
                // Deduct credits
                setUserCredits(prev => {
                  const newCredits = prev - PROJECT_CREDIT_COST;
                  console.log('[StudioView] Orchestrator: Credits deducted', prev, '->', newCredits);
                  return newCredits;
                });
                
                // Add to projects
                setProjects(prev => {
                  const newProjects = [project, ...prev];
                  console.log('[StudioView] Orchestrator: Project added. Total:', newProjects.length);
                  return newProjects;
                });
                
                // Save to cloud if logged in (uses backend API now)
                if (isLoggedIn && user) {
                  console.log('[StudioView] Orchestrator: Saving to cloud for user:', user.uid);
                  saveProjectToCloud(user.uid, project).then(success => {
                    console.log('[StudioView] Orchestrator: Cloud save result:', success);
                  }).catch(err => {
                    console.error('[StudioView] Orchestrator: Cloud save error:', err);
                  });
                }
                
                // Select it and navigate to project canvas
                setCanvasPreviewAsset(null); // Reset canvas preview to avoid stale references
                setSelectedProject(project);
                // Use pendingProjectNav flag for safe navigation (prevents race condition)
                setPendingProjectNav(true);
                toast.success(`Saved "${project.name}" with ${project.assets?.length || 0} assets!`);
              }}
              onDeleteProject={handleDeleteProject}
              setActiveTab={setActiveTab}
              setSelectedAgent={setSelectedAgent}
              setQuickWorkflowAgent={setQuickWorkflowAgent}
            />
          </Suspense>
        );
      case 'project_canvas':
        if (!selectedProject) {
          // Show loading state briefly - project might still be setting
          return (
            <div className="p-8 text-center animate-fadeIn">
              <div style={{ opacity: 0.6 }}>Loading project...</div>
            </div>
          );
        }
        
        return (
          <div className="project-canvas animate-fadeIn" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div className="canvas-header" style={{ marginBottom: '32px' }}>
              <button 
                onClick={() => setActiveTab('hub')} 
                className="back-btn"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  background: 'none', border: 'none', color: 'var(--text-secondary)', 
                  cursor: 'pointer', marginBottom: '16px', fontSize: '0.9rem'
                }}
              >
                <ArrowLeft size={18} /> Back to Hub
              </button>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>{selectedProject.name}</h1>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', 
                      background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-purple)',
                      fontSize: '0.75rem', fontWeight: '600', border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}>
                      {selectedProject.category?.toUpperCase() || 'PROJECT'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: 0 }}>
                    {selectedProject.description || 'No description provided.'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowAddAgentModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Users size={18} /> Add Agents
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      // Launch first agent or show picker
                      if (selectedProject.agents && selectedProject.agents.length > 0) {
                        setSelectedAgent(selectedProject.agents[0]);
                      } else {
                        setShowAddAgentModal(true);
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Zap size={18} /> Open Studio
                  </button>
                </div>
              </div>
              
              {/* Stats Bar */}
              <div style={{ 
                display: 'flex', gap: '24px', marginTop: '24px', 
                padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} className="text-cyan" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Created: <span style={{ color: 'white' }}>{selectedProject.date}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LayoutGrid size={16} className="text-purple" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Assets: <span style={{ color: 'white' }}>{selectedProject.assets?.length || 0}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} className="text-green" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Team: <span style={{ color: 'white' }}>{selectedProject.agents?.length || 0} Agents</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="canvas-content">
              
              {/* 1. Active Agents */}
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} className="text-purple" /> Active Agents
                </h3>
                
                {selectedProject.agents && selectedProject.agents.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                    {selectedProject.agents.map(agent => {
                      const AgentIcon = agent.icon || Sparkles;
                      return (
                        <div 
                          key={agent.id}
                          onClick={() => setSelectedAgent(agent)}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-purple)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <AgentIcon size={20} className="text-purple" />
                          </div>
                          <div>
                            <div style={{ fontWeight: '600' }}>{agent.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{agent.category}</div>
                          </div>
                          <ArrowRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                        </div>
                      );
                    })}
                    
                    {/* Add Agent Button */}
                    <button
                      onClick={() => setShowAddAgentModal(true)}
                      style={{
                        background: 'transparent',
                        border: '1px dashed var(--border-color)',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-cyan)';
                        e.currentTarget.style.color = 'var(--color-cyan)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <Plus size={20} />
                      <span>Add Agent</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '32px', textAlign: 'center', background: 'var(--bg-secondary)', 
                    borderRadius: '12px', border: '1px dashed var(--border-color)'
                  }}>
                    <Users size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No agents assigned to this project yet.</p>
                    <button className="btn-secondary" onClick={() => setShowAddAgentModal(true)}>
                      Assign Agents
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Project Generations (Assets) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LayoutGrid size={20} className="text-cyan" /> Project Generations
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-icon-sm" title="Grid View"><LayoutGrid size={16} /></button>
                    <button className="btn-icon-sm" title="List View"><List size={16} /></button>
                  </div>
                </div>

                {selectedProject.assets && selectedProject.assets.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {selectedProject.assets.map((asset, idx) => (
                      <div 
                        key={idx}
                        className="asset-card"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Preview Area */}
                        <div 
                          style={{ 
                            height: '160px', 
                            background: asset.imageUrl 
                              ? `url(${asset.imageUrl}) center/cover` 
                              : 'linear-gradient(135deg, #1e1e2e, #2d2d44)',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => setPreviewItem(asset)}
                        >
                          {!asset.imageUrl && (
                            asset.type === 'audio' ? <Music size={48} style={{ opacity: 0.2 }} /> :
                            asset.type === 'video' ? <Video size={48} style={{ opacity: 0.2 }} /> :
                            <FileText size={48} style={{ opacity: 0.2 }} />
                          )}
                          
                          {/* Type Badge */}
                          <div style={{ 
                            position: 'absolute', top: '10px', right: '10px',
                            padding: '4px 8px', borderRadius: '6px',
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                            fontSize: '0.7rem', fontWeight: '600', color: 'white',
                            textTransform: 'uppercase'
                          }}>
                            {asset.type || 'Text'}
                          </div>
                          
                          {/* Play Button Overlay */}
                          {(asset.type === 'audio' || asset.type === 'video') && (
                            <div className="play-overlay" style={{
                              width: '48px', height: '48px', borderRadius: '50%',
                              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer'
                            }}>
                              <Play size={24} fill="white" color="white" />
                            </div>
                          )}
                        </div>

                        {/* Info Area */}
                        <div style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-purple)', fontWeight: '600' }}>
                              {asset.agent || 'AI Generated'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {asset.date || 'Just now'}
                            </span>
                          </div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {asset.title || asset.snippet?.substring(0, 30) || 'Untitled Asset'}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {asset.snippet || asset.description || 'No description available.'}
                          </p>
                          
                          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button 
                              className="btn-secondary-sm" 
                              style={{ flex: 1 }}
                              onClick={() => setPreviewItem(asset)}
                            >
                              <Eye size={14} /> View
                            </button>
                            <button 
                              className="btn-secondary-sm" 
                              style={{ flex: 1 }}
                              onClick={() => {
                                // Load into editor/context
                                if (asset.snippet) {
                                  navigator.clipboard.writeText(asset.snippet);
                                  toast.success('Copied to clipboard');
                                }
                              }}
                            >
                              <Copy size={14} /> Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    padding: '48px', textAlign: 'center', background: 'var(--bg-secondary)', 
                    borderRadius: '12px', border: '1px dashed var(--border-color)'
                  }}>
                    <LayoutGrid size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                    <h3 style={{ marginBottom: '8px' }}>No generations yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                      Launch an agent to start creating content for this project.
                    </p>
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        if (selectedProject.agents && selectedProject.agents.length > 0) {
                          setSelectedAgent(selectedProject.agents[0]);
                        } else {
                          setShowAddAgentModal(true);
                        }
                      }}
                    >
                      Start Creating
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'resources': {
        const LEGAL_RESOURCES = [
          { 
            title: 'Music Copyright 101', 
            desc: 'Understanding your rights as a creator - ownership, registration, and protection.', 
            icon: Shield, 
            type: 'Guide',
            status: 'available',
            content: `
# Music Copyright 101

## What You Own
When you create an original song, you automatically own the copyright. No registration required (though it helps in court).

### Two Types of Copyright:
1. **Composition Copyright** - The song itself (lyrics + melody)
2. **Sound Recording Copyright** - The specific recording (master)

## Key Rights You Control:
- Reproduction (copies)
- Distribution (selling/streaming)
- Public Performance (radio, venues)
- Derivative Works (remixes, samples)
- Sync (TV, film, ads)

## Best Practices:
- Register with the Copyright Office ($65)
- Keep dated drafts and session files
- Use split sheets before sessions
- Consider publishing admin

## AI-Generated Content:
Currently, AI-generated content without human authorship may not be copyrightable. Always add meaningful human creative input.
            `
          },
          { 
            title: 'Split Sheet Template', 
            desc: 'Standard agreement for co-writing sessions. Define ownership before you create.', 
            icon: FileText, 
            type: 'Template',
            status: 'available',
            content: `
# Split Sheet Template

## SONG INFORMATION
**Song Title:** _______________
**Date Written:** _______________
**Session Location:** _______________

---

## CONTRIBUTOR SPLITS

| Name | Role | Ownership % | PRO | IPI/CAE |
|------|------|-------------|-----|---------|
| | | % | | |
| | | % | | |
| | | % | | |
| | | % | | |

**Total Must Equal 100%**

---

## AGREEMENT TERMS

1. Each contributor agrees to the percentage split listed above
2. Any sample clearances are the responsibility of: _______________
3. Lead artist for release: _______________
4. Publishing admin: _______________

---

## SIGNATURES

Contributor 1: _______________ Date: _______________
Contributor 2: _______________ Date: _______________
Contributor 3: _______________ Date: _______________
Contributor 4: _______________ Date: _______________

---

*Keep copies for all contributors. This is a binding agreement.*
            `
          },
          { 
            title: 'Sync Licensing Guide', 
            desc: 'Step-by-step guide to getting your music placed in TV, Film & Ads.', 
            icon: Tv, 
            type: 'Guide',
            status: 'available',
            content: `
# Sync Licensing Guide

## What is Sync?
Synchronization licensing = permission to use music with visual media (TV, film, ads, games, YouTube).

## The Two Licenses You Need:
1. **Sync License** - From the publisher/songwriter (composition)
2. **Master License** - From the label/artist (recording)

If you own both, you can grant both!

## How to Get Placements:

### 1. Music Libraries
- Musicbed, Artlist, Epidemic Sound
- Non-exclusive = keep your rights
- Lower fees but steady income

### 2. Sync Agents
- Pitch to music supervisors for you
- Take 15-50% commission
- Best for quality catalog

### 3. Direct Outreach
- Build relationships with music supervisors
- Attend sync conferences
- Use LinkedIn and industry events

## Pricing Guidelines:
- Student Film: Free - $500
- Indie Film: $1,000 - $10,000
- TV Show: $5,000 - $50,000
- Major Ad Campaign: $50,000 - $500,000+

## Pro Tips:
- Instrumental versions are essential
- Clean versions (no explicit)
- Stems available on request
- Quick turnaround = more placements
            `
          },
          { 
            title: 'AI & IP Rights', 
            desc: 'Navigating the legal landscape of AI-assisted music creation.', 
            icon: Lock, 
            type: 'Whitepaper',
            status: 'available',
            content: `
# AI & Intellectual Property Rights

## Current Legal Landscape (2026)

### Copyright Office Position:
- Works must have human authorship
- Pure AI output = no copyright
- Human + AI collaboration = copyrightable (human elements)

### Best Practices for AI-Assisted Creation:

1. **Document Your Process**
   - Save prompts and iterations
   - Note your creative decisions
   - Keep before/after versions

2. **Add Meaningful Human Input**
   - Edit AI outputs substantially
   - Use AI as starting point, not final product
   - Combine multiple generations with human curation

3. **Disclosure Considerations**
   - No legal requirement (yet) to disclose AI use
   - Some platforms have policies
   - Industry norms are evolving

## Studio Agents & Your Rights

When you use Studio Agents:
- You own the outputs you create
- We don't claim rights to your work
- You're responsible for ensuring originality
- We recommend human review of all outputs

## Training Data Concerns:
- Some AI models trained on copyrighted works
- Legal challenges ongoing
- Studio Agents uses licensed/permitted training data

## Stay Updated:
AI law is evolving rapidly. This document will be updated as regulations develop.
            `
          },
          { 
            title: 'Label Deal Breakdown', 
            desc: 'Understanding record deals, advances, recoupment, and points.', 
            icon: FileText, 
            type: 'Guide',
            status: 'available',
            content: `
# Label Deal Breakdown

## Types of Deals

### 1. Traditional Record Deal
- Label owns masters
- Artist gets 12-20% royalty
- Advance recouped from royalties
- Label funds recording, marketing, distribution

### 2. Distribution Deal
- You own masters
- Keep 80-100% of revenue
- Pay distributor fee (15-30%)
- You fund everything

### 3. Licensing Deal
- You own masters
- License to label for set term (3-7 years)
- Higher royalty (50-70%)
- Masters revert to you after term

### 4. Joint Venture (JV)
- Shared ownership (50/50)
- Shared costs and profits
- Best of both worlds
- Requires leverage to negotiate

## Key Terms to Know:

**Advance:** Loan against future royalties (not free money!)
**Recoupment:** Label recoups costs before you see royalties
**Cross-collateralization:** Losses on one album offset gains on another
**Options:** Label's right to your next albums
**360 Deal:** Label takes cut of touring, merch, publishing

## Red Flags:
- Perpetual ownership of masters
- Cross-collateralization across revenue streams
- Excessive option periods
- Vague "commercially reasonable" language

## Negotiation Tips:
- Always have an entertainment lawyer
- Sunset clauses on recoupment
- Audit rights
- Reversion clauses
- Cap on recoupable expenses
            `
          },
          { 
            title: 'Publishing 101', 
            desc: 'PROs, mechanical royalties, sync fees, and how to collect what you are owed.', 
            icon: CreditCard, 
            type: 'Guide',
            status: 'available',
            content: `
# Publishing 101

## What is Music Publishing?
Publishing = the business of your SONGS (not recordings)

When you write a song, you create intellectual property that generates money every time it's:
- Streamed or downloaded (Mechanical)
- Played on radio or in public (Performance)
- Used in TV/Film/Ads (Sync)
- Printed as sheet music (Print)

## The Money Flow

### Performance Royalties
- Collected by PROs (ASCAP, BMI, SESAC, GMR)
- Radio, TV, streaming, live venues, bars, stores
- Split: 50% writer / 50% publisher

### Mechanical Royalties
- Paid for reproductions of your song
- Streaming, downloads, CDs
- In US: collected by MLC (Mechanical Licensing Collective)
- Rate: ~$0.0008 per stream

### Sync Fees
- One-time licensing fees
- Negotiated per placement
- You keep 100% (minus admin fees)

## Who Collects What?

| Source | Who Collects |
|--------|--------------|
| US Performance | Your PRO (ASCAP/BMI/SESAC) |
| US Mechanicals | The MLC |
| International | Sub-publishers or admin |
| Sync | Publisher or you directly |

## Getting Started:
1. Join a PRO (free)
2. Register with The MLC
3. Consider a publishing admin (Songtrust, CD Baby Pro)
4. Register every song you write

## Publisher vs Publishing Admin:
- **Publisher:** Takes ownership, active pitching, 50% of publishing
- **Admin:** No ownership, just collection, 10-20% fee
            `
          }
        ];

        const AGENT_WHITEPAPERS = [
          { title: 'Ghostwriter', desc: 'LLM-powered lyric generation with flow mapping, rhyme scheme analysis, and style mimicry across 50+ genres.', version: 'v2.4', icon: Sparkles, tier: 'Free' },
          { title: 'Beat Lab', desc: 'Algorithmic drum pattern generation, chord progression logic, and BPM-matched sample sourcing.', version: 'v3.1', icon: Zap, tier: 'Free' },
          { title: 'Album Artist', desc: 'Imagen 3-powered cover art generation with typography, brand palettes, and social media kit export.', version: 'v3.0', icon: Music, tier: 'Free' },
          { title: 'Video Creator', desc: 'Veo 3.0 cinematic video generation with scene detection, style transfer, and music video creation.', version: 'v1.0', icon: PlayCircle, tier: 'Free' },
          { title: 'Vocal Architect', desc: 'Neural vocoder synthesis with harmony generation, ad-lib creation, and expressive tuning.', version: 'v2.0', icon: UsersIcon, tier: 'Pro' },
          { title: 'Instrumentalist', desc: 'AI session players with physical modeling, style mimicry, and multi-instrumental performance.', version: 'v1.5', icon: Music, tier: 'Pro' },
          { title: 'Beat Architect', desc: 'Advanced rhythm production with drum synthesis, groove templates, and dynamic arrangement.', version: 'v2.2', icon: Target, tier: 'Monthly' },
          { title: 'Sample Wizard', desc: 'Intelligent sample discovery, clearance checking, and stem isolation technology.', version: 'v1.8', icon: Folder, tier: 'Monthly' },
          { title: 'Drop Engineer', desc: 'EDM-focused production with build-up generation, impact design, and festival-ready drops.', version: 'v1.3', icon: Rocket, tier: 'Pro' },
          { title: 'Film Composer', desc: 'Orchestral scoring with emotional mapping, sync-point logic, and multi-genre soundtrack creation.', version: 'v2.1', icon: Film, tier: 'Pro' },
          { title: 'Master Engineer', desc: 'AI-assisted mastering with loudness optimization, stereo imaging, and format-specific exports.', version: 'v3.0', icon: Shield, tier: 'Monthly' },
          { title: 'Sound Designer', desc: 'Foley generation, texture synthesis, and cinematic sound design for any project.', version: 'v1.6', icon: Volume2, tier: 'Pro' },
          { title: 'Trend Analyst', desc: 'Real-time music industry trend tracking, viral prediction, and audience insights.', version: 'v2.5', icon: TrendingUp, tier: 'Monthly' },
          { title: 'Social Strategist', desc: 'Platform-specific content optimization, hashtag research, and posting schedule generation.', version: 'v1.9', icon: Globe, tier: 'Pro' },
          { title: 'Collab Finder', desc: 'AI-powered artist matching, style compatibility analysis, and networking recommendations.', version: 'v1.4', icon: UsersIcon, tier: 'Pro' },
          { title: 'Release Planner', desc: 'Strategic rollout planning with timeline generation, budget allocation, and milestone tracking.', version: 'v2.0', icon: Rocket, tier: 'Pro' }
        ];

        const PRODUCTION_TOOLS = [
          { name: 'Canva', desc: 'Design', url: 'https://canva.com', icon: Layout },
          { name: 'Figma', desc: 'Prototyping', url: 'https://figma.com', icon: PenTool },
          { name: 'Splice', desc: 'Samples', url: 'https://splice.com', icon: Music },
          { name: 'DistroKid', desc: 'Distribution', url: 'https://distrokid.com', icon: Globe }
        ];


        return (
          <div className="resources-view animate-fadeInUp">
            <div className="resources-header">
              <h1>Creator Resources</h1>
              <p>Essential tools, guides, and technical documentation for professional growth.</p>
            </div>

            {/* Multi-Agent & Video Pitch Demos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="resources-demo-section" style={{ padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.5rem', fontWeight: '800' }}>
                    <Zap size={24} className="text-purple" /> 
                    Multi-Agent Brainstorm
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Watch 4 AI agents work in parallel to create your release package.</p>
                </div>
                <Suspense fallback={<LazyFallback />}>
                  <MultiAgentDemo onCreateProject={(p) => {
                    setProjects(prev => [p, ...prev]);
                    setSelectedProject(p);
                    setActiveTab('mystudio');
                    toast.success("Project created from brainstorm!");
                  }} />
                </Suspense>
              </div>

              <div className="resources-demo-section" style={{ padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.5rem', fontWeight: '800' }}>
                    <Video size={24} className="text-blue" /> 
                    Viral Pitch Lab
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create a 7-second viral hook and convert it to a full project.</p>
                </div>
                <Suspense fallback={<LazyFallback />}>
                  <VideoPitchDemo onCreateProject={(p) => {
                    setProjects(prev => [p, ...prev]);
                    setSelectedProject(p);
                    setActiveTab('mystudio');
                    toast.success("Project created from pitch!");
                  }} />
                </Suspense>
              </div>
            </div>

            <div className="resources-grid">
              <section className="resources-section">
                <div className="section-header">
                  <Shield size={20} className="text-purple" />
                  <h2>Legal & Business</h2>
                  <span style={{ 
                    marginLeft: 'auto',
                    padding: '4px 12px',
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#22c55e',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    Available Now
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                  Protect your art. Understand your rights. Comprehensive guides for independent creators.
                </p>
                <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {LEGAL_RESOURCES.map((item, i) => (
                    <div key={i} className="resource-card legal" style={{ 
                      opacity: 1,
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '3px 8px',
                        background: item.type === 'Whitepaper' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                        color: item.type === 'Whitepaper' ? 'var(--color-purple)' : 'var(--color-cyan)',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {item.type}
                      </div>
                      <div className="card-icon"><item.icon size={24} /></div>
                      <div className="card-content">
                        <h3>{item.title}</h3>
                        <p>{item.desc}</p>
                      </div>
                      <button 
                        className="card-action" 
                        onClick={() => setShowResourceContent(item)}
                      >
                        Read {item.type}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="resources-section">
                <div className="section-header">
                  <FileText size={20} className="text-cyan" />
                  <h2>Agent Whitepapers</h2>
                  <span style={{ 
                    marginLeft: 'auto',
                    padding: '4px 12px',
                    background: 'rgba(6, 182, 212, 0.2)',
                    color: 'var(--color-cyan)',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    16 Agents
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                  Technical documentation for each AI agent. Architecture, capabilities, and best practices.
                </p>
                <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                  {AGENT_WHITEPAPERS.map((item, i) => (
                    <div key={i} className="resource-card whitepaper" style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '3px 8px',
                        background: item.tier === 'Free' ? 'rgba(34, 197, 94, 0.2)' : item.tier === 'Monthly' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                        color: item.tier === 'Free' ? '#22c55e' : item.tier === 'Monthly' ? '#fbbf24' : 'var(--color-purple)',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {item.tier}
                      </div>
                      <div className="card-icon"><item.icon size={24} /></div>
                      <div className="card-content">
                        <div className="wp-header">
                          <h3>{item.title}</h3>
                          <span className="version-badge">{item.version}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem' }}>{item.desc}</p>
                      </div>
                      <button 
                        className="card-action secondary" 
                        onClick={() => {
                          const agent = AGENTS.find(a => a.name === item.title || a.name.includes(item.title.split(' ')[0]));
                          if (agent) openAgentWhitepaper(agent);
                          else toast(`📄 ${item.title} - ${item.desc}`, { icon: '🔬', duration: 4000 });
                        }}
                      >
                        View Spec
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="resources-section">
                <div className="section-header">
                  <Tool size={20} className="text-orange" />
                  <h2>Production Tools</h2>
                </div>
                <div className="tools-grid">
                  {PRODUCTION_TOOLS.map((tool, i) => (
                    <a key={i} href={tool.url} target="_blank" rel="noopener noreferrer" className="tool-card">
                      <div className="tool-icon"><tool.icon size={24} /></div>
                      <div className="tool-info">
                        <h3>{tool.name}</h3>
                        <span>{tool.desc}</span>
                      </div>
                      <ExternalLink size={16} className="external-icon" />
                    </a>
                  ))}
                </div>
              </section>

              <section className="resources-section">
                <div className="section-header">
                  <MapIcon size={20} className="text-emerald" />
                  <h2>Studio Site Map</h2>
                </div>
                <div className="sitemap-container">
                  <div className="sitemap-column">
                    <h4>Studio</h4>
                    <ul>
                      <li onClick={() => setActiveTab('mystudio')}>Dashboard</li>
                      <li onClick={() => setActiveTab('agents')}>Agent Studio</li>
                      <li onClick={() => setActiveTab('hub')}>Project Hub</li>
                    </ul>
                  </div>
                  <div className="sitemap-column">
                    <h4>Community</h4>
                    <ul>
                      <li onClick={() => setActiveTab('activity')}>Music Hub</li>
                      <li onClick={() => setActiveTab('news')}>Industry Pulse</li>
                    </ul>
                  </div>
                  <div className="sitemap-column">
                    <h4>Support</h4>
                    <ul>
                      <li onClick={() => setActiveTab('support')}>Help Center</li>
                      <li onClick={() => setActiveTab('resources')}>Resources</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>
        );
      }
      case 'marketing':
        return (
          <div className="marketing-view animate-fadeInUp" style={{ paddingBottom: '80px' }}>
            {/* Hero Section */}
            <div className="marketing-hero" style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.1) 0%, rgba(0,0,0,0) 100%)',
              marginBottom: '40px'
            }}>
              <div className="hero-badge" style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '6px 12px', 
                background: 'rgba(124, 58, 237, 0.2)', 
                borderRadius: '20px', 
                color: '#a78bfa', 
                fontSize: '0.85rem', 
                marginBottom: '20px',
                border: '1px solid rgba(124, 58, 237, 0.3)'
              }}>
                <Sparkles size={14} />
                <span>The Future of Music Creation</span>
              </div>
              <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '16px', lineHeight: '1.1' }}>
                The Studio <span className="text-gradient-purple">Agents</span>
              </h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                An AI-powered record label in your pocket. 16 specialized agents working 24/7 to build your career.
              </p>
            </div>

            {/* The Story */}
            <section className="marketing-section" style={{ padding: '0 20px 60px' }}>
              <div className="section-header" style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>The Story</h2>
                <div style={{ width: '60px', height: '4px', background: 'var(--color-purple)', borderRadius: '2px' }}></div>
              </div>
              <div className="story-card" style={{ 
                background: 'var(--color-bg-secondary)', 
                padding: '30px', 
                borderRadius: '24px', 
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    For decades, the music industry has been a walled garden. Only the top 1% of artists had access to world-class producers, marketing teams, and A&R strategy.
                  </p>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                    <strong>The Studio changes that.</strong> We've distilled the expertise of industry veterans into 16 specialized AI agents. Whether you need a lyricist at 3 AM, a marketing strategy for your release, or a visual identity for your brand, The Studio is always open.
                  </p>
                </div>
                <div style={{ 
                  position: 'absolute', 
                  top: '-50px', 
                  right: '-50px', 
                  width: '200px', 
                  height: '200px', 
                  background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(0,0,0,0) 70%)', 
                  borderRadius: '50%' 
                }}></div>
              </div>
            </section>

            {/* The Vision */}
            <section className="marketing-section" style={{ padding: '0 20px 60px' }}>
              <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="vision-card" style={{ 
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)', 
                  padding: '30px', 
                  borderRadius: '24px', 
                  border: '1px solid var(--border-color)' 
                }}>
                  <div className="icon-box" style={{ 
                    width: '50px', 
                    height: '50px', 
                    background: 'rgba(59, 130, 246, 0.2)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: '20px' 
                  }}>
                    <Target size={24} className="text-cyan" />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Our Vision</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    To democratize the entire music supply chain. We believe every artist deserves a team that cares as much about their music as they do.
                  </p>
                </div>
                <div className="vision-card" style={{ 
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)', 
                  padding: '30px', 
                  borderRadius: '24px', 
                  border: '1px solid var(--border-color)' 
                }}>
                  <div className="icon-box" style={{ 
                    width: '50px', 
                    height: '50px', 
                    background: 'rgba(236, 72, 153, 0.2)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: '20px' 
                  }}>
                    <UsersIcon size={24} className="text-pink" />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>For Creators</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    Built for the bedroom producers, the songwriters, and the independent artists who are ready to take their career to the next level.
                  </p>
                </div>
              </div>
            </section>

            {/* Stats Grid */}
            <section className="marketing-section" style={{ padding: '0 20px 60px' }}>
              <div className="stats-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '15px' 
              }}>
                <div className="stat-card" style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-purple)', marginBottom: '5px' }}>16</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Specialized Agents</div>
                </div>
                <div className="stat-card" style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-cyan)', marginBottom: '5px' }}>24/7</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Availability</div>
                </div>
                <div className="stat-card" style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-green)', marginBottom: '5px' }}>∞</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Creative Potential</div>
                </div>
                <div className="stat-card" style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-orange)', marginBottom: '5px' }}>100%</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Royalty Free</div>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="marketing-cta" style={{ padding: '0 20px 40px', textAlign: 'center' }}>
              <button 
                className="cta-button-primary haptic-press" 
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                onClick={() => setShowProjectChoiceModal(true)}
              >
                Create New Project <ArrowRight size={20} style={{ marginLeft: '8px' }} />
              </button>
            </div>
          </div>
        );
      case 'activity':
        return (
          <div className="music-hub-view animate-fadeInUp" style={{ paddingBottom: '100px' }}>
            {/* Music Hub Header - Studio Orchestrator Style */}
            <div className="orchestrator-header" style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(236, 72, 153, 0.15) 100%)',
              borderRadius: '24px',
              padding: '32px',
              marginBottom: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4)'
                  }}>
                    <Music size={28} color="white" />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(90deg, white, rgba(255,255,255,0.8))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Music Hub
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      Reddit • YouTube • New Releases — All things music in one place
                    </p>
                  </div>
                </div>
                
                {/* Section Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'All', icon: Zap },
                    { id: 'reddit', label: 'Reddit', icon: MessageSquare },
                    { id: 'youtube', label: 'YouTube', icon: PlayCircle },
                    { id: 'releases', label: 'New Releases', icon: Calendar }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActivitySection?.(tab.id) || localStorage.setItem('musicHubSection', tab.id);
                        fetchActivity(1, tab.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        background: (activitySection || localStorage.getItem('musicHubSection') || 'all') === tab.id 
                          ? 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))'
                          : 'rgba(255,255,255,0.08)',
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Music Hub Content Grid */}
            <div className="music-hub-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px'
            }}>
              {activityFeed.map((item, idx) => (
                <div 
                  key={`${item.id}-${idx}`} 
                  className="music-hub-card"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(item.url, '_blank')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'var(--color-purple)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(168, 85, 247, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Card Media */}
                  {item.imageUrl && (
                    <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                      {item.isVideo && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(4px)'
                        }}>
                          <PlayCircle size={28} color="white" />
                        </div>
                      )}
                      {/* Type Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: item.type === 'youtube' ? 'rgba(255, 0, 0, 0.9)' : 
                                   item.type === 'reddit' ? 'rgba(255, 69, 0, 0.9)' : 
                                   'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {item.type === 'youtube' && <PlayCircle size={12} />}
                        {item.type === 'reddit' && <MessageSquare size={12} />}
                        {item.type === 'release' && <Calendar size={12} />}
                        {item.source}
                      </div>
                    </div>
                  )}
                  
                  {/* Card Content */}
                  <div style={{ padding: '16px' }}>
                    {/* Category Tag */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: `var(--${item.color?.replace('agent-', 'color-') || 'color-purple'})`,
                      opacity: 0.8,
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      marginBottom: '10px',
                      textTransform: 'uppercase'
                    }}>
                      {item.category}
                    </div>
                    
                    {/* Title */}
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'white',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.title}
                    </h3>
                    
                    {/* Snippet/Author */}
                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.snippet || item.author}
                    </p>
                    
                    {/* Footer Meta */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.likes !== undefined && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <Zap size={14} style={{ color: 'var(--color-purple)' }} />
                            {item.likes > 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
                          </span>
                        )}
                        {item.comments !== undefined && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <MessageSquare size={14} />
                            {item.comments}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {item.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Image Cards (for releases without images) */}
            {activityFeed.filter(item => !item.imageUrl).length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Upcoming & Recent Releases
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activityFeed.filter(item => !item.imageUrl && item.type === 'release').slice(0, 10).map((item, idx) => (
                    <div
                      key={`release-${item.id}-${idx}`}
                      onClick={() => window.open(item.url, '_blank')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: item.daysUntil === 0 ? 'linear-gradient(135deg, var(--color-emerald), var(--color-cyan))' :
                                   item.daysUntil > 0 ? 'linear-gradient(135deg, var(--color-purple), var(--color-pink))' :
                                   'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Calendar size={22} color="white" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: 'white', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {item.snippet}
                        </div>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: item.daysUntil === 0 ? 'var(--color-emerald)' :
                                   item.daysUntil > 0 ? 'rgba(168, 85, 247, 0.2)' :
                                   'rgba(255,255,255,0.1)',
                        color: item.daysUntil === 0 ? 'black' : 'white',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoadingActivity && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px', color: 'var(--text-secondary)' }}>
                <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <span>Loading music content...</span>
              </div>
            )}

            {/* Empty state when no content and not loading */}
            {!isLoadingActivity && activityFeed.length === 0 && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '60px 24px', 
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <Music size={48} style={{ color: 'var(--color-purple)', marginBottom: '16px', opacity: 0.6 }} />
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>No Music Content Available</h3>
                <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                  Unable to load music content from Reddit, YouTube, or new releases. Make sure the backend server is running.
                </p>
                <button 
                  onClick={() => fetchActivity(1)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <RefreshCw size={16} /> Try Again
                </button>
              </div>
            )}

            {!isLoadingActivity && hasMoreActivity && activityFeed.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '32px' }}>
                <button 
                  onClick={() => fetchActivity(activityPage + 1)}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '12px',
                    border: '1px solid var(--color-purple)',
                    background: 'transparent',
                    color: 'var(--color-purple)',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-purple)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-purple)';
                  }}
                >
                  Load More
                </button>
              </div>
            )}

            {!hasMoreActivity && activityFeed.length > 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <p>🎵 You've explored all the latest music content. Check back soon!</p>
              </div>
            )}
          </div>
        );
      case 'news':
        return (
          <Suspense fallback={<LazyFallback />}>
            <NewsHub
              newsItems={filteredNews}
              newsSearch={newsSearch}
              setNewsSearch={setNewsSearch}
              isLoadingNews={isLoadingNews}
              onRefresh={handleRefreshNews}
              hasMoreNews={hasMoreNews}
              onLoadMore={() => fetchNews(newsPage + 1)}
            />
          </Suspense>
        );
      case 'profile':
        return (
          <div className="studio-profile-view animate-fadeInUp" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
              <div className="profile-avatar-large" style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-purple)', position: 'relative' }}>
                {user?.photoURL ? <img src={user.photoURL} alt="User" style={{ width: '100%', height: '100%' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--color-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{user?.displayName?.charAt(0) || 'U'}</div>}
                <button style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', fontSize: '0.7rem', padding: '4px', cursor: 'pointer' }}>Edit</button>
              </div>
              <div>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{userProfile.stageName || user?.displayName || 'Guest Creator'}</h1>
                <p style={{ color: 'var(--text-secondary)' }}>{user?.email || 'No email linked'}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <span className="badge" style={{ background: 'var(--color-purple)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>{userProfile.plan} Plan</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>Member since {userProfile.memberSince}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--color-cyan)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>{userProfile.credits} Credits</span>
                </div>
              </div>
            </div>

            <div className="profile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div className="stat-card" style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <h4 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-purple)', marginBottom: '4px' }}>{(projects || []).length}</h4>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Projects</span>
              </div>
              <div className="stat-card" style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <h4 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-cyan)', marginBottom: '4px' }}>{new Set((projects || []).map(p => p.agent)).size}</h4>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Agents Used</span>
              </div>
              <div 
                className="stat-card haptic-press" 
                onClick={() => setShowCreditsModal(true)}
                style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', cursor: 'pointer' }}
              >
                <h4 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-orange)', marginBottom: '4px' }}>{userProfile.credits}</h4>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Credits Left</span>
              </div>
            </div>

            <div className="profile-section" style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Creator Profile</h3>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Stage Name</label>
                  <input 
                    type="text" 
                    value={userProfile.stageName} 
                    onChange={(e) => setUserProfile({...userProfile, stageName: e.target.value})}
                    placeholder={user?.displayName || "Enter stage name"}
                    className="form-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px' }} 
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Primary Genre</label>
                  <select 
                    value={userProfile.genre}
                    onChange={(e) => setUserProfile({...userProfile, genre: e.target.value})}
                    className="form-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                  >
                    <option>Hip Hop / Rap</option>
                    <option>R&B</option>
                    <option>Pop</option>
                    <option>Electronic</option>
                    <option>Rock</option>
                    <option>Afrobeats</option>
                    <option>Latin</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Creator Bio</label>
                  <textarea 
                    rows="4" 
                    value={userProfile.bio}
                    onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                    placeholder="Tell your story..." 
                    className="form-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', resize: 'vertical' }}
                  ></textarea>
                </div>
                 <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Location</label>
                  <input 
                    type="text" 
                    value={userProfile.location} 
                    onChange={(e) => setUserProfile({...userProfile, location: e.target.value})}
                    placeholder="City, Country"
                    className="form-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px' }} 
                  />
                </div>
                 <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Website</label>
                  <input 
                    type="text" 
                    value={userProfile.website} 
                    onChange={(e) => setUserProfile({...userProfile, website: e.target.value})}
                    placeholder="https://"
                    className="form-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px' }} 
                  />
                </div>
              </div>
            </div>

            <div className="profile-section" style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Share2 size={20} /> Social Connections</h3>
              <div className="social-connect-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
                  { id: 'twitter', label: 'X / Twitter', icon: Twitter, color: '#1DA1F2' },
                  { id: 'spotify', label: 'Spotify for Artists', icon: Music, color: '#1DB954' },
                  { id: 'tiktok', label: 'TikTok', icon: Video, color: '#00f2ea' }
                ].map(social => (
                  <div key={social.id} className="social-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <social.icon size={20} color={social.color} />
                      <span>{social.label}</span>
                    </div>
                    <button 
                      className="btn-sm" 
                      onClick={() => setSocialConnections(prev => {
                        const newState = { ...prev, [social.id]: !prev[social.id] };
                        localStorage.setItem('studio_agents_socials', JSON.stringify(newState));
                        return newState;
                      })}
                      style={{ 
                        background: socialConnections[social.id] ? 'rgba(16, 185, 129, 0.2)' : 'transparent', 
                        border: `1px solid ${socialConnections[social.id] ? '#10b981' : 'var(--border-color)'}`, 
                        color: socialConnections[social.id] ? '#10b981' : 'white', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        minWidth: '100px'
                      }}
                    >
                      {socialConnections[social.id] ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="profile-section" style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Settings size={20} /> Preferences</h3>
              <div className="preferences-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="preference-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    <div>
                      <div style={{ fontWeight: '600' }}>Appearance</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                    </div>
                  </div>
                  <button 
                    className="btn-sm" 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-primary)', 
                      padding: '6px 12px', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      minWidth: '100px'
                    }}
                  >
                    Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="cta-button-secondary" onClick={() => setActiveTab('mystudio')}>Cancel</button>
              <button className="cta-button-premium" onClick={() => { 
                localStorage.setItem('studio_user_profile', JSON.stringify(userProfile));
                toast.success('Profile saved!'); 
                setActiveTab('mystudio'); 
              }}>Save Changes</button>
            </div>
          </div>
        );

      case 'support': {
        const HELP_ITEMS = [
          { 
            icon: Book, 
            title: 'Getting Started', 
            desc: 'Learn the basics of the Studio Agents workflow.',
            details: 'To get started, select an agent from the "Agents" tab. Each agent specializes in a different part of the music creation process. For example, Ghostwriter can help you write lyrics, while Beat Lab can generate drum patterns. Once you\'ve selected an agent, enter a prompt describing what you want to create. You can then save your creation as a new project, which will appear in your Project Hub for later recall.'
          },
          { 
            icon: Zap, 
            title: 'Agent Mastery', 
            desc: 'Deep dives into each agent\'s unique capabilities.',
            details: 'Mastering our agents requires understanding their specific strengths. Ghostwriter responds best to emotional cues and genre-specific keywords. Album Artist can interpret complex visual metaphors. Trend Hunter scans real-time social data to give you a competitive edge. Experiment with different "Intensity" settings to see how the AI\'s creativity shifts from subtle to experimental.'
          },
          { 
            icon: PlayCircle, 
            title: 'Video Tutorials', 
            desc: 'Watch step-by-step guides on making hits.',
            details: 'Our video library includes tutorials on: "Writing Your First Hit with Ghostwriter", "Advanced Beat Making with Beat Lab", and "Strategic Rollouts with Release Manager". Each video is under 5 minutes and designed to get you creating immediately. Pro members get access to exclusive masterclasses from industry-leading producers who use Studio Agents in their daily workflow.'
          },
          { 
            icon: MessageSquare, 
            title: 'Community Tips', 
            desc: 'See how other creators are using the studio.',
            details: 'Join our Discord community and check out the "Activity Wall" to share prompts, collaborate with other creators, and get feedback on your AI-assisted tracks. Many users have found success by combining outputs from multiple agents—for example, using Ghostwriter for lyrics and then feeding those lyrics into a vocal synth. The possibilities are endless when you collaborate with the community.'
          }
        ];

        const TROUBLESHOOTING_GUIDE = [
          {
            keywords: ['download', 'save', 'export', 'phone', 'photos'],
            issue: 'Cannot download or save to device',
            solution: 'Ensure you have granted storage permissions to your browser. On mobile, long-press the image or use the "Save to Files" option in the share menu. If using cloud storage, verify your Google Drive or OneDrive connection is active.'
          },
          {
            keywords: ['audio', 'sound', 'hear', 'play', 'silent'],
            issue: 'No sound during playback',
            solution: 'Check if your device is on silent mode. Ensure the volume slider in the Media Player is turned up. Some browsers block auto-play audio; try clicking the play button manually.'
          },
          {
            keywords: ['slow', 'stuck', 'loading', 'generate', 'wait'],
            issue: 'Generation is taking too long',
            solution: 'High-quality models like Imagen 3 and Veo can take up to 30 seconds. Check your internet connection. If the progress bar is stuck, try refreshing the page; your project will be saved in the Project Hub.'
          },
          {
            keywords: ['login', 'account', 'pro', 'subscription', 'access'],
            issue: 'Cannot access Pro agents',
            solution: 'Pro agents require an active Studio Pro subscription. Ensure you are logged in with the correct account. If you just subscribed, try logging out and back in to refresh your status.'
          },
          {
            keywords: ['voice', 'mic', 'microphone', 'speak', 'listen', 'gender', 'male', 'female', 'accent', 'translate', 'language'],
            issue: 'Voice controls and translation settings',
            solution: 'Use the Mic icon for Voice-to-Text and the Speaker icon for Text-to-Voice. Click the Settings (gear) icon to change voice gender (Male/Female), region (US/UK/AU/IN), or to enable automatic translation to your preferred language.'
          },
          {
            keywords: ['privacy', 'data', 'security', 'safe', 'private'],
            issue: 'Is my data and music private?',
            solution: 'Yes. We use end-to-end encryption for your prompts and creations. We do not share your personal studio data with third parties or use it to train public models without your permission.'
          },
          {
            keywords: ['copyright', 'rights', 'own', 'legal', 'truth'],
            issue: 'Do I own the AI-generated music?',
            solution: 'You own the rights to the output you generate. However, for full copyright protection, we recommend adding human elements (vocals, live instruments) to make the work uniquely yours.'
          },
          {
            keywords: ['quality', 'professional', 'pro', 'industry', 'standard'],
            issue: 'How to get professional quality results?',
            solution: 'Use high-quality reference tracks, layer AI stems with live recordings, and always perform a final manual mix. Our Mastering Lab agent can help with the final industry-standard polish.'
          },
          {
            keywords: ['multi', 'agent', 'chain', 'workflow', 'project', 'pro'],
            issue: 'How to use multiple agents in one project?',
            solution: 'Pro users can "chain" agents by taking the output of one (e.g., Ghostwriter lyrics) and feeding it into another (e.g., Vocal Architect). Check "The Come Up" section for detailed Multi-Agent Workflow guides.'
          }
        ];

        const NAVIGATION_ITEMS = [
          { keywords: ['billing', 'payment', 'card', 'subscription', 'plan', 'wallet', 'money', 'cost', 'price'], label: 'Billing & Wallet', action: () => { setActiveTab('mystudio'); setDashboardTab('billing'); } },
          { keywords: ['settings', 'config', 'preferences', 'dark mode', 'theme', 'language', 'voice'], label: 'App Settings', action: () => { setActiveTab('mystudio'); setDashboardTab('settings'); } },
          { keywords: ['profile', 'account', 'user', 'avatar', 'login', 'logout', 'email'], label: 'User Profile', action: () => { setActiveTab('mystudio'); setDashboardTab('overview'); } },
          { keywords: ['news', 'feed', 'updates', 'industry', 'trends', 'pulse'], label: 'Industry Pulse', action: () => setActiveTab('news') },
          { keywords: ['hub', 'projects', 'files', 'saved', 'library', 'creations'], label: 'Project Hub', action: () => setActiveTab('hub') },
          { keywords: ['activity', 'wall', 'community', 'social', 'share', 'feed', 'music', 'hub', 'reddit', 'youtube', 'releases'], label: 'Music Hub', action: () => setActiveTab('activity') },
          { keywords: ['agents', 'tools', 'create', 'make', 'generate'], label: 'Agent Studio', action: () => setActiveTab('agents') }
        ];

        const suggestions = helpSearch.length > 1 
          ? [
              // Navigation Matches
              ...NAVIGATION_ITEMS.filter(nav => 
                nav.keywords.some(k => k.includes(helpSearch.toLowerCase())) || 
                nav.label.toLowerCase().includes(helpSearch.toLowerCase())
              ).map(item => ({
                type: 'Action',
                title: `Go to ${item.label}`,
                description: 'Navigate to this section',
                icon: ArrowRight,
                action: item.action
              })),

              // Troubleshooting Matches
              ...TROUBLESHOOTING_GUIDE.filter(guide => 
                guide.keywords.some(k => helpSearch.toLowerCase().includes(k)) ||
                guide.issue.toLowerCase().includes(helpSearch.toLowerCase())
              ).map(item => ({ 
                type: 'Troubleshooting',
                title: item.issue,
                description: item.solution,
                icon: Shield
              })),

              // Guide Matches
              ...HELP_ITEMS.filter(item => 
                item.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
                item.desc.toLowerCase().includes(helpSearch.toLowerCase()) ||
                item.details.toLowerCase().includes(helpSearch.toLowerCase())
              ).map(item => ({ 
                type: 'Guide',
                title: item.title,
                description: item.desc,
                icon: Book
              })),

              // Agent Matches
              ...AGENTS.filter(agent => 
                agent.name.toLowerCase().includes(helpSearch.toLowerCase()) ||
                agent.description.toLowerCase().includes(helpSearch.toLowerCase()) ||
                agent.category.toLowerCase().includes(helpSearch.toLowerCase())
              ).map(item => ({ 
                type: 'Agent',
                title: item.name,
                description: item.description,
                icon: Zap,
                action: () => { setActiveTab('agents'); setSelectedAgent(item); }
              })),

              // FAQ Matches
              ...[
                  { q: 'How do I export my creations?', a: 'You can export any creation from the Project Hub using the download icon.' },
                  { q: 'Can I use the lyrics commercially?', a: 'Yes, all content generated by Studio Agents is royalty-free for Pro users.' },
                  { q: 'How do I change the agent\'s genre?', a: 'Use the Genre dropdown in the agent\'s detail view to shift styles.' }
                ].filter(faq => 
                  faq.q.toLowerCase().includes(helpSearch.toLowerCase()) ||
                  faq.a.toLowerCase().includes(helpSearch.toLowerCase())
                ).map(item => ({ 
                  type: 'FAQ',
                  title: item.q,
                  description: item.a,
                  icon: CircleHelp
                }))
            ]
          : [];

        return (
          <div className="help-center-view animate-fadeInUp">
            <div className="help-hero">
              <h1>Support Center</h1>
              <p className="text-muted" style={{ marginTop: '8px' }}>Guides, troubleshooting, and expert assistance.</p>
              <div className="search-box large" style={{ marginTop: '24px' }}>
                <Search size={20} />
                <input 
                  type="text" 
                  placeholder="Search for agents, guides, or troubleshooting..." 
                  value={helpSearch}
                  onChange={(e) => setHelpSearch(e.target.value)}
                />
              </div>
            </div>

            {suggestions.length > 0 ? (
              <div className="smart-suggestions animate-fadeIn">
                <div className="suggestions-header">
                  <Sparkles size={18} className="text-purple" />
                  <h3>Search Results</h3>
                </div>
                <div className="suggestions-list">
                  {suggestions.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div 
                        key={i} 
                        className="suggestion-item"
                        onClick={item.action ? item.action : undefined}
                        style={{ cursor: item.action ? 'pointer' : 'default' }}
                      >
                        <div className="suggestion-icon">
                          <Icon size={20} />
                        </div>
                        <div className="suggestion-content">
                          <div className="suggestion-type">{item.type}</div>
                          <h4>{item.title}</h4>
                          <p>{item.description}</p>
                        </div>
                        {item.action && <ArrowRight size={16} className="suggestion-arrow" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : helpSearch.length > 1 ? (
              <div className="empty-search-state animate-fadeIn" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <h3>No results found</h3>
                <p>Try searching for "Billing", "Ghostwriter", or "Export".</p>
              </div>
            ) : null}

            <div className="help-grid-main">
              {HELP_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const isExpanded = expandedHelp === i;
                return (
                  <div key={i} className={`help-card-item ${isExpanded ? 'expanded' : ''}`}>
                    <div className="help-card-icon">
                      <Icon size={24} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                    {isExpanded && (
                      <div className="help-card-details animate-fadeIn">
                        <p>{item.details}</p>
                      </div>
                    )}
                    <button 
                      className="help-card-link"
                      onClick={() => setExpandedHelp(isExpanded ? null : i)}
                    >
                      {isExpanded ? 'Show Less' : 'Read More'} 
                      {isExpanded ? <ChevronUp size={16} /> : <ArrowRight size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {[
                  { q: 'How do I export my creations?', a: 'You can export any creation from the Project Hub using the download icon.' },
                  { q: 'Can I use the lyrics commercially?', a: 'Yes, all content generated by Studio Agents is royalty-free for Pro users.' },
                  { q: 'How do I change the agent\'s genre?', a: 'Use the Genre dropdown in the agent\'s detail view to shift styles.' }
                ].map((faq, i) => (
                  <div key={i} className="faq-item">
                    <h4>{faq.q}</h4>
                    <p>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="contact-support-section" style={{ marginTop: '40px', padding: '32px', background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div className="icon-box" style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--color-purple)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={32} />
              </div>
              <h2>Still need help?</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '12px auto 24px' }}>
                Our support team is available 24/7 to assist with technical issues, billing inquiries, or creative blocks.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="cta-button-premium"
                  onClick={() => window.open('mailto:support@studioagents.com?subject=Support Request', '_blank')}
                >
                  Email Support
                </button>
                <button 
                  className="cta-button-secondary"
                  onClick={() => window.open('https://discord.gg/studioagents', '_blank')}
                >
                  Join Discord Community
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'more': {
        // Mobile "More" menu with all navigation options
        const moreMenuItems = [
          { id: 'activity', icon: Music, label: 'Music Hub', desc: 'Reddit, YouTube & Releases', color: 'var(--color-purple)' },
          { id: 'news', icon: Globe, label: 'Industry Pulse', desc: 'Latest music & tech news', color: 'var(--color-cyan)' },
          { id: 'resources', icon: Book, label: 'Resources', desc: 'Guides & tutorials', color: 'var(--color-orange)' },
          { id: 'support', icon: CircleHelp, label: 'Help & Support', desc: 'FAQ & contact us', color: 'var(--color-pink)' },
          { id: 'marketing', icon: TrendingUp, label: 'About Us', desc: 'Our mission & vision', color: 'var(--color-emerald)' },
          { id: 'profile', icon: User, label: 'My Profile', desc: 'Account settings', color: 'var(--color-yellow)' },
        ];

        return (
          <div className="more-menu-view animate-fadeInUp" style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>More Options</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '16px',
              marginBottom: '32px'
            }}>
              {moreMenuItems.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    role="button"
                    tabIndex={0}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveTab(item.id)}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `${item.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color
                    }}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{item.label}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div style={{ 
              background: 'var(--card-bg)', 
              borderRadius: '16px', 
              padding: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => setShowProjectChoiceModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '12px',
                    color: 'var(--color-purple)',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}
                >
                  <Plus size={20} />
                  Create New Project
                </button>
                
                {!isLoggedIn ? (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '12px',
                      color: 'var(--color-cyan)',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}
                  >
                    <User size={20} />
                    Sign In / Create Account
                  </button>
                ) : (
                  <button
                    onClick={() => { auth && signOut(auth); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      color: 'var(--color-red)',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}
                  >
                    <LogOut size={20} />
                    Sign Out
                  </button>
                )}
              </div>
            </div>

            {/* Theme Toggle */}
            <div style={{ 
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                <span>Dark Mode</span>
              </span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  background: theme === 'dark' ? 'var(--color-purple)' : 'var(--border-color)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: theme === 'dark' ? '25px' : '3px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Persist theme
  useEffect(() => {
    localStorage.setItem('studio_theme', theme);
  }, [theme]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 150;
    
    if (isNearBottom) {
      if (activeTab === 'activity' && !isLoadingActivity && hasMoreActivity) {
        fetchActivity(activityPage + 1);
      } else if (activeTab === 'news' && !isLoadingNews && hasMoreNews) {
        fetchNews(newsPage + 1);
      }
    }
  };

  // --- DYNAMIC CHECKLIST LOGIC ---
  const getProjectSteps = () => {
    if (!selectedProject) return null;
    
    // If project has specific agents selected, use them as steps
    if (selectedProject.agents && selectedProject.agents.length > 0) {
      return selectedProject.agents.map((agentId, index) => {
        const agent = AGENTS.find(a => a.id === agentId);
        return {
          id: `step-${index}`,
          label: agent ? `Consult ${agent.name}` : 'Agent Task',
          desc: agent ? (agent.description || agent.category) : 'Execute task',
          agentId: agentId,
          icon: agent ? agent.icon : Zap,
          completed: false
        };
      });
    }

    // If custom workflow but no agents selected, show generic step
    if (selectedProject.workflow === 'custom') {
      return [
        { id: 'add-agent', label: 'Add Your First Agent', agentId: null, icon: Plus, desc: 'Select an agent to start working' }
      ];
    }

    // Fallback based on category
    switch(selectedProject.category) {
      case 'pro': return [
        { id: 'lyrics', label: 'Draft Lyrics', agentId: 'ghost', icon: Mic, desc: 'Generate verses & hooks' },
        { id: 'beat', label: 'Compose Beat', agentId: 'beat', icon: Music, desc: 'Create instrumental backing' },
        { id: 'art', label: 'Cover Art', agentId: 'album', icon: Zap, desc: 'Design album artwork' }
      ];
      case 'vybing': return [
        { id: 'beat', label: 'Generate Vibe', agentId: 'beat', icon: Music, desc: 'Quick beat generation' },
        { id: 'lyrics', label: 'Freestyle Lyrics', agentId: 'ghost', icon: Mic, desc: 'Write over the beat' }
      ];
      default: return [
        { id: 'plan', label: 'Create Plan', agentId: 'release', icon: Target, desc: 'Outline your project goals' }
      ];
    }
  };

  const activeProjectSteps = getProjectSteps();

  // Demo mode state for banner visibility
  const [showDemoBanner, setShowDemoBanner] = useState(getDemoModeState());

  return (
    <div className={`studio-container ${theme}-theme`} {...swipeHandlers}>
      {/* Demo Mode Banner */}
      {showDemoBanner && (
        <div 
          onClick={() => {
            toggleDemoMode();
            setShowDemoBanner(false);
            toast.success('Demo mode disabled - using real API');
          }}
          style={DEMO_BANNER_STYLES.container}
          title="Click to disable demo mode"
        >
          <span>{DEMO_BANNER_STYLES.icon}</span>
          <span>{DEMO_BANNER_STYLES.text}</span>
        </div>
      )}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'light' ? '#ffffff' : '#1a1a2e',
            color: theme === 'light' ? '#0f172a' : '#fff',
            border: theme === 'light' ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: theme === 'light' ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: theme === 'light' ? '#fff' : '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: theme === 'light' ? '#fff' : '#fff' },
          },
        }}
      />
      <aside className="studio-nav">
        <div className="studio-nav-logo" onClick={() => onBack?.()}>
          <div className="logo-box studio-logo">
            <Sparkles size={20} color="white" />
          </div>
          <div className="logo-text">
            <span className="studio-name">STUDIO AGENTS</span>
            <span className="studio-sub">AI ECOSYSTEM</span>
            <span className="studio-domain">studioagentsai.com</span>
          </div>
        </div>

        <nav className="studio-nav-links">
          <button 
            className={`nav-link ${activeTab === 'mystudio' ? 'active' : ''}`}
            onClick={() => { setActiveTab('mystudio'); setSelectedAgent(null); }}
          >
            <Home size={20} />
            <span>My Studio</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => { setActiveTab('agents'); setSelectedAgent(null); }}
          >
            <LayoutGrid size={20} />
            <span>Agents Team</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'hub' ? 'active' : ''}`}
            onClick={() => { setActiveTab('hub'); setSelectedAgent(null); }}
          >
            <Folder size={20} />
            <span>Project Hub</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => { setActiveTab('activity'); setSelectedAgent(null); }}
          >
            <MessageSquare size={20} />
            <span>Music Hub</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => { setActiveTab('resources'); setSelectedAgent(null); }}
          >
            <Book size={20} />
            <span>Resources</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => { setActiveTab('news'); setSelectedAgent(null); }}
          >
            <Globe size={20} />
            <span>Industry Pulse</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => { setActiveTab('support'); setSelectedAgent(null); }}
          >
            <CircleHelp size={20} />
            <span>Support</span>
          </button>
        </nav>

        <div className="studio-nav-footer">
          <div 
            className="user-profile-mini haptic-press" 
            onClick={() => { setActiveTab('profile'); setSelectedAgent(null); }}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar">
              {user?.photoURL ? <img src={user.photoURL} alt="User" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--color-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{user?.displayName?.charAt(0) || 'U'}</div>}
            </div>
            <div className="user-info">
              <p className="user-name">{isLoggedIn ? (user?.displayName || 'Pro Creator') : 'Guest Creator'}</p>
              <p className="user-status">{isLoggedIn ? 'Pro Plan' : 'Free Account'}</p>
              {isLoggedIn ? (
                <button 
                  className="sign-out-link" 
                  style={{ fontSize: '0.7rem', color: 'var(--color-red)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: '4px', textAlign: 'left' }}
                  onClick={(e) => { e.stopPropagation(); auth && signOut(auth); }}
                >
                  Sign Out
                </button>
              ) : (
                <button 
                  className="sign-in-link" 
                  style={{ fontSize: '0.7rem', color: 'var(--color-purple)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: '4px', textAlign: 'left' }}
                  onClick={(e) => { e.stopPropagation(); setShowLoginModal(true); }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="studio-main" onScroll={handleScroll}>
        <header className="studio-header">
          <h2 className="studio-title">
            {selectedAgent ? selectedAgent.name : (activeTab === 'mystudio' ? 'Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
          </h2>
          <div className="studio-header-actions">
            <button 
              className="action-button secondary haptic-press"
              onClick={() => onBack?.()}
              title="Back to Landing Page"
            >
              <Home size={18} />
            </button>
            <button 
              className="action-button secondary haptic-press"
              onClick={() => setActiveTab('profile')}
              title="User Profile"
            >
              <User size={18} />
              <span className="desktop-only">Profile</span>
            </button>
            <button 
              className="action-button secondary haptic-press"
              onClick={() => { setOnboardingStep(0); setShowOnboarding(true); }}
              title="Welcome Tour"
            >
              <Sparkles size={18} />
              <span className="desktop-only">Tour</span>
            </button>
            <button 
              className="action-button secondary haptic-press"
              onClick={() => { setActiveTab('support'); setSelectedAgent(null); }}
              title="Help Center"
            >
              <CircleHelp size={18} />
              <span className="desktop-only">Help</span>
            </button>
            <button 
              className="action-button secondary haptic-press" 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              {notifications.some(n => !n.read) && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  background: 'var(--color-red)',
                  borderRadius: '50%',
                  border: '1px solid var(--card-bg)'
                }}></span>
              )}
            </button>

            {!isLoggedIn ? (
              <button 
                className="cta-button-sm haptic-press"
                onClick={() => setShowLoginModal(true)}
                style={{ marginLeft: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Sign In
              </button>
            ) : (
              <div className="user-avatar-header" style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', marginLeft: '0.5rem', border: '1px solid var(--border-color)' }}>
                 {user?.photoURL ? <img src={user.photoURL} alt="User" style={{ width: '100%', height: '100%' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--color-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{user?.displayName?.charAt(0) || 'U'}</div>}
              </div>
            )}
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="notification-dropdown animate-fadeInUp">
                <div className="notif-header">
                  <h3>Notifications</h3>
                  <button 
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
                        <div className="notif-item-header">
                          <span className="notif-title">{n.title}</span>
                          <span className="notif-time">{n.time}</span>
                        </div>
                        <p className="notif-message">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {isLoggedIn ? (
              <div className="user-projects-dropdown">
                <button 
                  className="action-button primary haptic-press"
                  onClick={() => setShowProjectChoiceModal(true)}
                >
                  New Project ({projects?.length || 0})
                </button>
              </div>
            ) : (
              <button 
                className="action-button primary haptic-press"
                onClick={() => setShowLoginModal(true)}
              >
                New Project
              </button>
            )}
          </div>
        </header>

        <div className="studio-content">
          {renderContent()}
        </div>

        {/* Media Player Modal */}
        {playingItem && (
          <div 
            className="media-player-overlay animate-fadeIn"
            onClick={() => setPlayingItem(null)}
            onTouchEnd={() => setPlayingItem(null)}
          >
            <div 
              className="media-player-container animate-fadeInUp"
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <button className="player-close" onClick={() => setPlayingItem(null)} onTouchEnd={(e) => { e.preventDefault(); setPlayingItem(null); }}>
                <X size={24} />
              </button>
              
              <div className="player-content">
                <div className="player-header">
                  <div className={`player-icon-box ${playingItem.color || 'agent-purple'}`}>
                    {playingItem.videoUrl ? <PlayCircle size={32} /> : playingItem.imageUrl ? <Music size={32} /> : <Music size={32} />}
                  </div>
                  <div className="player-info">
                    <h2>{playingItem.title}</h2>
                    <p>{playingItem.agent} • {playingItem.user || 'Your Creation'}</p>
                  </div>
                </div>

                <div className="player-visualizer" style={{ position: 'relative' }}>
                  {playingItem.videoUrl && (playingItem.videoUrl.includes('youtube.com') || playingItem.videoUrl.includes('youtu.be')) ? (
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={playingItem.videoUrl.replace('watch?v=', 'embed/')} 
                      title={playingItem.title}
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      className="player-video"
                      style={{ border: 'none' }}
                    ></iframe>
                  ) : (
                    <>
                      {/* Visual Layer */}
                      {playingItem.videoUrl ? (
                        <video 
                          src={playingItem.videoUrl} 
                          controls={!playingItem.audioUrl} 
                          autoPlay 
                          muted={!!playingItem.audioUrl} // Mute video if we have separate audio track (Mastering case)
                          className="player-video"
                        />
                      ) : playingItem.imageUrl ? (
                        <img 
                          src={playingItem.imageUrl} 
                          alt={playingItem.title} 
                          className="player-video" 
                          loading="lazy"
                          style={{ objectFit: 'contain', background: '#000' }}
                        />
                      ) : (
                        <div className="audio-visualizer-placeholder">
                          <div className="visualizer-bars">
                            {[...Array(20)].map((_, i) => (
                              <div key={i} className="v-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Audio Layer - Overlay if visual exists or just audio */}
                      {playingItem.audioUrl && (
                        <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', padding: '0 20px', zIndex: 10 }}>
                           <audio 
                            src={playingItem.audioUrl} 
                            controls 
                            autoPlay 
                            className="player-audio"
                            style={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', borderRadius: '30px' }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="player-footer">
                  <div className="player-actions">
                    <button 
                      className="player-btn primary"
                      onClick={() => handleDownload(playingItem)}
                    >
                      <Download size={18} />
                      <span>Download to Device</span>
                    </button>
                    <button 
                      className="player-btn secondary"
                      onClick={() => handleShareToFeed(playingItem)}
                    >
                      <Share2 size={18} />
                      <span>Share to Feed</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Studio Session Overlay (Global Mechanism) */}
        {showStudioSession && (
          <div className="studio-session-overlay animate-fadeIn" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LayoutGrid size={24} color="white" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Studio Session</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Multi-Agent Orchestration</p>
                </div>
                <button 
                  onClick={() => toast("1. Select Beat (Track 1)\n2. Select Vocals (Track 2)\n3. Add a Visual\n4. Press Play to preview\n5. Click Render Master to save", { duration: 6000, icon: '🎛️' })}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: '8px' }}
                >
                  <CircleHelp size={14} color="var(--text-secondary)" />
                </button>
              </div>
              <button onClick={() => { setShowStudioSession(false); setSessionPlaying(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {/* Main Stage */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '20px', overflowY: 'auto' }}>
              
              {/* Visual Preview */}
              <div style={{ flex: 2, background: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                {sessionTracks.visual ? (
                  sessionTracks.visual.videoUrl ? (
                    <video 
                      src={sessionTracks.visual.videoUrl} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                      muted 
                      loop 
                      ref={el => {
                        if (el) {
                          if (sessionPlaying) el.play().catch(e => console.log(e));
                          else el.pause();
                        }
                      }}
                    />
                  ) : (
                    <img src={sessionTracks.visual.imageUrl} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )
                ) : (
                  <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <ImageIcon size={48} />
                    <span>No Visual Selected</span>
                  </div>
                )}
                
                {/* Audio Elements (Hidden) */}
                {sessionTracks.audio && (
                  <audio 
                    src={sessionTracks.audio.audioUrl} 
                    ref={el => {
                      if (el) {
                        el.volume = sessionTracks.audioVolume || 0.8;
                        if (sessionPlaying) el.play().catch(e => console.log(e));
                        else el.pause();
                      }
                    }}
                    loop
                  />
                )}
                {sessionTracks.vocal && (
                  <audio 
                    src={sessionTracks.vocal.audioUrl} 
                    ref={el => {
                      if (el) {
                        el.volume = sessionTracks.vocalVolume || 1.0;
                        if (sessionPlaying) el.play().catch(e => console.log(e));
                        else el.pause();
                      }
                    }}
                    loop
                  />
                )}
              </div>

              {/* Mixer / Timeline */}
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Simple Pro Settings Bar - Captions.ai Style */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Real Assets Toggle */}
                    <div 
                      onClick={() => updateSessionWithHistory(prev => ({ ...prev, generateRealAssets: !prev.generateRealAssets }))}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        cursor: 'pointer',
                        background: sessionTracks.generateRealAssets ? 'linear-gradient(135deg, var(--color-purple), var(--color-pink))' : 'rgba(255,255,255,0.1)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ 
                        width: '32px', 
                        height: '18px', 
                        borderRadius: '9px', 
                        background: sessionTracks.generateRealAssets ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: 'white',
                          position: 'absolute',
                          top: '2px',
                          left: sessionTracks.generateRealAssets ? '16px' : '2px',
                          transition: 'left 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {sessionTracks.generateRealAssets ? '⚡ Real Assets' : '📝 Text Mode'}
                      </span>
                    </div>
                    
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>BPM</span>
                      <input 
                        type="number" 
                        value={sessionTracks.bpm || 120}
                        onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, bpm: parseInt(e.target.value) || 120 }))}
                        style={{ width: '50px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: 'var(--color-cyan)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}
                      />
                    </div>
                    <select 
                      value={sessionTracks.frameRate || 30}
                      onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, frameRate: parseInt(e.target.value) }))}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      <option value="24">24fps</option>
                      <option value="30">30fps</option>
                      <option value="60">60fps</option>
                    </select>
                    <select 
                      value={sessionTracks.aspectRatio || '16:9'}
                      onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, aspectRatio: e.target.value }))}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      <option value="16:9">16:9</option>
                      <option value="9:16">9:16</option>
                      <option value="1:1">1:1</option>
                    </select>
                  </div>
                  
                  {/* Render Counter - Simple */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3].map(n => (
                        <div 
                          key={n}
                          style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%',
                            background: n <= (sessionTracks.renderCount || 0) ? 'var(--color-purple)' : 'rgba(255,255,255,0.2)'
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {3 - (sessionTracks.renderCount || 0)} renders left
                    </span>
                  </div>
                </div>
                
                {/* Real Assets Info Banner */}
                {sessionTracks.generateRealAssets && (
                  <div style={{ 
                    padding: '10px 16px', 
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))', 
                    borderRadius: '8px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong>⚡ Real Asset Mode</strong> — AI will generate actual audio, images & video
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Uses Imagen 4.0 • Veo 3.0 • MusicGen
                    </div>
                  </div>
                )}

                {/* Agent Insight / Tip */}
                <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--color-purple)', fontSize: '0.9rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
                   <Sparkles size={18} className="text-purple" />
                   <div>
                     <strong>Agent Insight:</strong> 
                     {sessionTracks.audio?.agent === 'Beat Architect' ? " This beat has a strong transient profile. Keep vocals dry to cut through." : 
                      sessionTracks.vocal?.agent === 'Ghostwriter' ? " These lyrics are dense. Ensure the beat leaves room for the flow." :
                      " Combine assets from different agents to create a unique sound."}
                   </div>
                </div>

                {/* Track 1: Beat / Audio A */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', border: sessionTracks.audio ? '1px solid var(--color-cyan)' : '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: sessionTracks.audio ? '12px' : 0 }}>
                    <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}><Disc size={24} className="text-cyan" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Track 1</label>
                        <select 
                          style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--color-cyan)', fontSize: '0.75rem', cursor: 'pointer' }}
                          value={sessionTracks.audioOutputType || 'waveform'}
                          onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, audioOutputType: e.target.value }))}
                        >
                          <option value="waveform">🎵 Waveform</option>
                          <option value="file">📁 File</option>
                          <option value="stems">🎛️ Stems</option>
                          <option value="midi">🎹 MIDI</option>
                        </select>
                      </div>
                      <select 
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        value={sessionTracks.audio?.id || ''}
                        onChange={(e) => {
                          const assets = Array.isArray(selectedProject?.assets) ? selectedProject.assets : [];
                          const asset = assets.find(a => a?.id?.toString() === e.target.value);
                          updateSessionWithHistory(prev => ({ ...prev, audio: asset || null }));
                        }}
                      >
                        <option value="">Select Audio Asset...</option>
                        {(selectedProject?.assets || []).filter(a => a?.audioUrl || a?.type === 'audio' || a?.agent?.includes('Beat') || a?.agent?.includes('Sound')).map(a => (
                          <option key={a.id} value={a.id}>🎵 {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                        {(selectedProject?.assets || []).filter(a => !a?.audioUrl && a?.type !== 'audio').map(a => (
                          <option key={a.id} value={a.id}>📄 {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ width: '80px', textAlign: 'center' }}>
                       <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vol</label>
                       <input 
                         type="range" 
                         min="0" 
                         max="1" 
                         step="0.1" 
                         value={sessionTracks.audioVolume || 0.8}
                         onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, audioVolume: parseFloat(e.target.value) }))}
                         style={{ width: '100%' }} 
                       />
                       <div style={{ fontSize: '0.7rem', color: 'var(--color-cyan)' }}>{Math.round((sessionTracks.audioVolume || 0.8) * 100)}%</div>
                    </div>
                  </div>
                  {/* Waveform Visualization for Track 1 */}
                  {sessionTracks.audio && (
                    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px', overflow: 'hidden' }}>
                      {sessionTracks.audioOutputType === 'waveform' || !sessionTracks.audioOutputType ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}>
                          {/* Animated Waveform Bars */}
                          {[...Array(48)].map((_, i) => (
                            <div 
                              key={i}
                              style={{
                                flex: 1,
                                background: `linear-gradient(to top, var(--color-cyan), rgba(6, 182, 212, 0.3))`,
                                borderRadius: '2px',
                                height: sessionPlaying ? `${20 + Math.sin(i * 0.5 + Date.now() / 200) * 20}px` : `${10 + Math.sin(i * 0.3) * 15}px`,
                                transition: 'height 0.1s ease',
                                animation: sessionPlaying ? `waveform${i % 4} 0.5s ease-in-out infinite` : 'none'
                              }}
                            />
                          ))}
                        </div>
                      ) : sessionTracks.audioOutputType === 'file' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-cyan)', fontSize: '0.85rem' }}>
                          <FileAudio size={24} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{sessionTracks.audio.title || 'Audio File'}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{sessionTracks.audio.agent} • WAV/MP3</div>
                          </div>
                          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.5 }}>~3:24</div>
                        </div>
                      ) : sessionTracks.audioOutputType === 'stems' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {['Drums', 'Bass', 'Melody', 'FX'].map((stem, i) => (
                            <div key={stem} style={{ flex: 1, background: `rgba(6, 182, 212, ${0.2 + i * 0.1})`, borderRadius: '6px', padding: '6px', textAlign: 'center', fontSize: '0.7rem' }}>
                              <div style={{ color: 'var(--color-cyan)' }}>{stem}</div>
                              <div style={{ width: '100%', height: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${60 + i * 10}%`, height: '100%', background: 'var(--color-cyan)', borderRadius: '4px' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-cyan)', fontSize: '0.8rem' }}>
                          <Piano size={20} />
                          <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
                            {/* MIDI Note representation */}
                            {[...Array(16)].map((_, i) => (
                              <div key={i} style={{ 
                                width: '8px', 
                                height: `${8 + (i % 3) * 6}px`, 
                                background: i % 2 === 0 ? 'var(--color-cyan)' : 'transparent',
                                border: '1px solid var(--color-cyan)',
                                borderRadius: '2px' 
                              }} />
                            ))}
                          </div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>128 BPM • C Major</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Track 2: Vocals / Audio B */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', border: sessionTracks.vocal ? '1px solid var(--color-purple)' : '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: sessionTracks.vocal ? '12px' : 0 }}>
                    <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}><Mic size={24} className="text-purple" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Track 2</label>
                        <select 
                          style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--color-purple)', fontSize: '0.75rem', cursor: 'pointer' }}
                          value={sessionTracks.vocalOutputType || 'waveform'}
                          onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, vocalOutputType: e.target.value }))}
                        >
                          <option value="waveform">🎵 Waveform</option>
                          <option value="file">📁 File</option>
                          <option value="lyrics">📝 Lyrics</option>
                          <option value="adlibs">🎤 Adlibs</option>
                        </select>
                      </div>
                      <select 
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        value={sessionTracks.vocal?.id || ''}
                        onChange={(e) => {
                          const assets = Array.isArray(selectedProject?.assets) ? selectedProject.assets : [];
                          const asset = assets.find(a => a?.id?.toString() === e.target.value);
                          updateSessionWithHistory(prev => ({ ...prev, vocal: asset || null }));
                        }}
                      >
                        <option value="">Select Vocal/Lyrics Asset...</option>
                        {(selectedProject?.assets || []).filter(a => a?.agent?.includes('Ghost') || a?.agent?.includes('Vocal') || a?.type === 'lyrics').map(a => (
                          <option key={a.id} value={a.id}>🎤 {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                        {(selectedProject?.assets || []).filter(a => !a?.agent?.includes('Ghost') && !a?.agent?.includes('Vocal') && a?.type !== 'lyrics').map(a => (
                          <option key={a.id} value={a.id}>📄 {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ width: '80px', textAlign: 'center' }}>
                       <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vol</label>
                       <input 
                         type="range" 
                         min="0" 
                         max="1" 
                         step="0.1" 
                         value={sessionTracks.vocalVolume || 1.0}
                         onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, vocalVolume: parseFloat(e.target.value) }))}
                         style={{ width: '100%' }} 
                       />
                       <div style={{ fontSize: '0.7rem', color: 'var(--color-purple)' }}>{Math.round((sessionTracks.vocalVolume || 1.0) * 100)}%</div>
                    </div>
                  </div>
                  {/* Waveform/Lyrics Visualization for Track 2 */}
                  {sessionTracks.vocal && (
                    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px', overflow: 'hidden' }}>
                      {sessionTracks.vocalOutputType === 'waveform' || !sessionTracks.vocalOutputType ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}>
                          {[...Array(48)].map((_, i) => (
                            <div 
                              key={i}
                              style={{
                                flex: 1,
                                background: `linear-gradient(to top, var(--color-purple), rgba(168, 85, 247, 0.3))`,
                                borderRadius: '2px',
                                height: sessionPlaying ? `${15 + Math.cos(i * 0.4 + Date.now() / 180) * 25}px` : `${8 + Math.cos(i * 0.3) * 12}px`,
                                transition: 'height 0.1s ease'
                              }}
                            />
                          ))}
                        </div>
                      ) : sessionTracks.vocalOutputType === 'file' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-purple)', fontSize: '0.85rem' }}>
                          <FileAudio size={24} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{sessionTracks.vocal.title || 'Vocal File'}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{sessionTracks.vocal.agent} • WAV</div>
                          </div>
                          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.5 }}>~2:48</div>
                        </div>
                      ) : sessionTracks.vocalOutputType === 'lyrics' ? (
                        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', lineHeight: 1.6, maxHeight: '80px', overflow: 'auto' }}>
                          <div style={{ color: 'var(--color-purple)', marginBottom: '4px', fontSize: '0.7rem' }}>📝 Lyrics Preview</div>
                          {sessionTracks.vocal.content?.substring(0, 200) || sessionTracks.vocal.snippet?.substring(0, 200) || 'No lyrics content...'}
                          {(sessionTracks.vocal.content?.length > 200 || sessionTracks.vocal.snippet?.length > 200) && '...'}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {['Yeah!', 'Uh', 'Let\'s go', 'Woo!', 'Ayy'].map((adlib) => (
                            <div key={adlib} style={{ 
                              background: 'rgba(168, 85, 247, 0.2)', 
                              border: '1px solid var(--color-purple)',
                              borderRadius: '16px', 
                              padding: '4px 12px', 
                              fontSize: '0.75rem',
                              color: 'var(--color-purple)'
                            }}>
                              {adlib}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Track 3: Visual */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', border: sessionTracks.visual ? '1px solid var(--color-pink)' : '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: sessionTracks.visual ? '12px' : 0 }}>
                    <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}><Video size={24} className="text-pink" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Track 3</label>
                        <select 
                          style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--color-pink)', fontSize: '0.75rem', cursor: 'pointer' }}
                          value={sessionTracks.visualOutputType || 'video'}
                          onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, visualOutputType: e.target.value }))}
                        >
                          <option value="video">🎬 Video</option>
                          <option value="image">🖼️ Image</option>
                          <option value="animation">✨ Animation</option>
                          <option value="thumbnail">📷 Thumbnail</option>
                        </select>
                      </div>
                      <select 
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        value={sessionTracks.visual?.id || ''}
                        onChange={(e) => {
                          const assets = Array.isArray(selectedProject?.assets) ? selectedProject.assets : [];
                          const asset = assets.find(a => a?.id?.toString() === e.target.value);
                          updateSessionWithHistory(prev => ({ ...prev, visual: asset || null }));
                        }}
                      >
                        <option value="">Select Visual Asset...</option>
                        {(selectedProject?.assets || []).filter(a => a?.imageUrl || a?.videoUrl || a?.type === 'image' || a?.type === 'video').map(a => (
                          <option key={a.id} value={a.id}>{a.videoUrl ? '🎬' : '🖼️'} {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                        {(selectedProject?.assets || []).filter(a => !a?.imageUrl && !a?.videoUrl && a?.type !== 'image' && a?.type !== 'video').map(a => (
                          <option key={a.id} value={a.id}>📄 {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Visual Preview for Track 3 */}
                  {sessionTracks.visual && (
                    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px', overflow: 'hidden' }}>
                      {sessionTracks.visualOutputType === 'video' || !sessionTracks.visualOutputType ? (
                        sessionTracks.visual.videoUrl ? (
                          <video src={sessionTracks.visual.videoUrl} style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px' }} muted />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-pink)', fontSize: '0.85rem' }}>
                            <Video size={24} />
                            <div>
                              <div style={{ fontWeight: 600 }}>{sessionTracks.visual.title || 'Video Asset'}</div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Video will be generated on render</div>
                            </div>
                          </div>
                        )
                      ) : sessionTracks.visualOutputType === 'image' ? (
                        sessionTracks.visual.imageUrl ? (
                          <img src={sessionTracks.visual.imageUrl} alt="Visual" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-pink)', fontSize: '0.85rem' }}>
                            <ImageIcon size={24} />
                            <div>Image will be generated</div>
                          </div>
                        )
                      ) : sessionTracks.visualOutputType === 'animation' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-pink)' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[...Array(6)].map((_, i) => (
                              <div key={i} style={{
                                width: '32px',
                                height: '32px',
                                background: `linear-gradient(135deg, var(--color-pink), var(--color-purple))`,
                                borderRadius: '4px',
                                opacity: 0.3 + (i * 0.14),
                                transform: `rotate(${i * 15}deg)`
                              }} />
                            ))}
                          </div>
                          <div style={{ fontSize: '0.8rem', marginLeft: '12px' }}>
                            <div style={{ fontWeight: 600 }}>Animation Sequence</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>6 keyframes • 30fps</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '80px', 
                            height: '45px', 
                            background: 'linear-gradient(135deg, var(--color-pink), var(--color-purple))',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Camera size={20} color="white" />
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-pink)' }}>
                            <div style={{ fontWeight: 600 }}>Cover Thumbnail</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>1280x720 • YouTube Ready</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* <button className="btn-dashed" style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}>+ Add Track</button> */}

              </div>
            </div>

            {/* Footer Controls */}
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                 {/* Undo / Redo */}
                 <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
                    <button 
                      onClick={handleUndo} 
                      disabled={historyIndex <= 0}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: historyIndex > 0 ? 'pointer' : 'not-allowed', opacity: historyIndex > 0 ? 1 : 0.3 }}
                      title="Undo"
                    >
                      <Undo size={20} color="white" />
                    </button>
                    <button 
                      onClick={handleRedo} 
                      disabled={historyIndex >= sessionHistory.length - 1}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: historyIndex < sessionHistory.length - 1 ? 'pointer' : 'not-allowed', opacity: historyIndex < sessionHistory.length - 1 ? 1 : 0.3 }}
                      title="Redo"
                    >
                      <Redo size={20} color="white" />
                    </button>
                 </div>

                 <button 
                   className="btn-circle" 
                   aria-label={sessionPlaying ? "Pause Session" : "Play Session"}
                   style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-purple)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                   onClick={() => setSessionPlaying(!sessionPlaying)}
                 >
                   {sessionPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                 </button>
               </div>
               
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button 
                   className="btn-pill secondary"
                   onClick={() => {
                     // Save Project Logic (Save Session State)
                     const updatedProject = {
                       ...selectedProject,
                       sessionState: sessionTracks,
                       lastModified: Date.now()
                     };
                     setSelectedProject(updatedProject);
                     setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                     handleTextToVoice("Project session saved.");
                     toast.success('Session saved!');
                   }}
                 >
                   <Save size={18} /> Save Project
                 </button>

                 <button 
                   className="btn-pill primary"
                   disabled={(sessionTracks.renderCount || 0) >= 3}
                   style={{ opacity: (sessionTracks.renderCount || 0) >= 3 ? 0.5 : 1 }}
                   onClick={async () => {
                     // Check render limit
                     if ((sessionTracks.renderCount || 0) >= 3) {
                       toast.error('Maximum 3 renders reached. Pro users can reset.');
                       return;
                     }
                     
                     // Collect selected assets for orchestration
                     const agentOutputs = [
                       sessionTracks.audio,
                       sessionTracks.vocal,
                       sessionTracks.visual
                     ].filter(Boolean);
                     
                     if (agentOutputs.length === 0) {
                       toast.error('Select at least one asset to render');
                       return;
                     }
                     
                     const renderNumber = (sessionTracks.renderCount || 0) + 1;
                     handleTextToVoice(`Render pass ${renderNumber} of 3. Orchestrating your agents.`);
                     toast.loading(`AMO Render ${renderNumber}/3...`, { id: 'amo-render' });
                     
                     try {
                       // Get auth token
                       const headers = { 'Content-Type': 'application/json' };
                       if (auth?.currentUser) {
                         const token = await auth.currentUser.getIdToken();
                         headers['Authorization'] = `Bearer ${token}`;
                       }
                       
                       // Call the AMO orchestrator endpoint with sync settings
                       const response = await fetch(`${BACKEND_URL}/api/orchestrate`, {
                         method: 'POST',
                         headers,
                         body: JSON.stringify({
                           agentOutputs: agentOutputs.map(a => ({
                             id: a.id,
                             agent: a.agent || a.type,
                             type: a.type,
                             content: a.snippet || a.content || a.text,
                             audioUrl: a.audioUrl,
                             imageUrl: a.imageUrl,
                             videoUrl: a.videoUrl
                           })),
                           projectName: selectedProject.name,
                           projectDescription: selectedProject.description,
                           // Professional sync settings for TV-ready output
                           syncSettings: {
                             bpm: sessionTracks.bpm || 120,
                             timeSignature: sessionTracks.timeSignature || '4/4',
                             key: sessionTracks.key || 'C Major',
                             frameRate: sessionTracks.frameRate || 30,
                             sampleRate: sessionTracks.sampleRate || 48000,
                             bitDepth: sessionTracks.bitDepth || 24,
                             aspectRatio: sessionTracks.aspectRatio || '16:9'
                           },
                           renderPass: renderNumber,
                           generateRealAssets: sessionTracks.generateRealAssets || false
                         })
                       });
                       
                       const data = await response.json();
                       
                       if (!response.ok) {
                         throw new Error(data.error || 'Orchestration failed');
                       }
                       
                       // If generateRealAssets is enabled, also call media generation APIs
                       let generatedAudioUrl = sessionTracks.audio?.audioUrl;
                       let generatedImageUrl = sessionTracks.visual?.imageUrl;
                       let generatedVideoUrl = sessionTracks.visual?.videoUrl;
                       
                       if (sessionTracks.generateRealAssets) {
                         toast.loading('Generating real assets...', { id: 'amo-assets' });
                         
                         // Generate image if we have visual content but no URL
                         if (sessionTracks.visual && !sessionTracks.visual.imageUrl) {
                           try {
                             const imagePrompt = sessionTracks.visual.snippet || sessionTracks.visual.content || `Album artwork for ${selectedProject.name}`;
                             const imgRes = await fetch(`${BACKEND_URL}/api/generate-image`, {
                               method: 'POST',
                               headers,
                               body: JSON.stringify({ prompt: imagePrompt.substring(0, 500), aspectRatio: sessionTracks.aspectRatio || '16:9' })
                             });
                             const imgData = await imgRes.json();
                             if (imgData.imageUrl) generatedImageUrl = imgData.imageUrl;
                           } catch (e) { console.log('Image generation skipped:', e.message); }
                         }
                         
                         // Generate audio if we have audio content but no URL
                         if (sessionTracks.audio && !sessionTracks.audio.audioUrl) {
                           try {
                             const audioPrompt = sessionTracks.audio.snippet || sessionTracks.audio.content || `${sessionTracks.bpm || 120} BPM beat`;
                             const audRes = await fetch(`${BACKEND_URL}/api/generate-audio`, {
                               method: 'POST',
                               headers,
                               body: JSON.stringify({ prompt: audioPrompt.substring(0, 200) })
                             });
                             const audData = await audRes.json();
                             if (audData.audioUrl) generatedAudioUrl = audData.audioUrl;
                           } catch (e) { console.log('Audio generation skipped:', e.message); }
                         }
                         
                         toast.dismiss('amo-assets');
                       }
                       
                       // Increment render count
                       updateSessionWithHistory(prev => ({
                         ...prev,
                         renderCount: renderNumber,
                         lastRenderTime: new Date().toISOString(),
                         renderHistory: [...(prev.renderHistory || []), { pass: renderNumber, timestamp: Date.now() }]
                       }));
                       
                       // Use the master asset from the API response
                       const masterAsset = data.masterAsset || {
                         id: `master-${Date.now()}`,
                         title: `Studio Master ${renderNumber}/3 - ${selectedProject.name}`,
                         type: "Master",
                         agent: "AMO Orchestrator",
                         date: "Just now",
                         color: "agent-purple",
                         snippet: data.output?.slice(0, 200) || "Orchestrated Master Composition.",
                         content: data.output,
                         audioUrl: generatedAudioUrl,
                         stems: {
                           audio: generatedAudioUrl,
                           vocal: sessionTracks.vocal?.audioUrl
                         },
                         imageUrl: generatedImageUrl,
                         videoUrl: generatedVideoUrl,
                         metadata: {
                           audioVolume: sessionTracks.audioVolume,
                           vocalVolume: sessionTracks.vocalVolume,
                           agentsProcessed: agentOutputs.length,
                           renderedAt: new Date().toISOString(),
                           renderPass: renderNumber,
                           bpm: sessionTracks.bpm || 120,
                           frameRate: sessionTracks.frameRate || 30,
                           aspectRatio: sessionTracks.aspectRatio || '16:9',
                           realAssets: sessionTracks.generateRealAssets || false
                         }
                       };
                       
                       // Update project with master asset
                       const updated = { ...selectedProject, assets: [masterAsset, ...selectedProject.assets] };
                       setSelectedProject(updated);
                       setProjects(projects.map(p => p.id === updated.id ? updated : p));
                       
                       // Also save to cloud
                       if (isLoggedIn) {
                         const uid = localStorage.getItem('studio_user_id');
                         if (uid) {
                           fetch(`${BACKEND_URL}/api/projects`, {
                             method: 'POST',
                             headers,
                             body: JSON.stringify({ userId: uid, project: updated })
                           }).catch(err => console.error("Failed to sync to cloud", err));
                         }
                       }
                       
                       toast.dismiss('amo-render');
                       setShowStudioSession(false);
                       setSessionPlaying(false);
                       handleTextToVoice("Master render complete. Your orchestrated production is ready.");
                       toast.success('Master rendered and saved to your Hub!');
                       
                     } catch (err) {
                       console.error('AMO Orchestration error:', err);
                       toast.dismiss('amo-render');
                       toast.error(err.message || 'Orchestration failed. Please try again.');
                       handleTextToVoice("Orchestration failed. Please try again.");
                     }
                   }}
                 >
                   <Zap size={18} /> Render Master
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* External Save Modal */}
        {showExternalSaveModal && (
          <div className="modal-overlay" onClick={() => setShowExternalSaveModal(false)} onTouchEnd={() => setShowExternalSaveModal(false)}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowExternalSaveModal(false)} onTouchEnd={(e) => { e.preventDefault(); setShowExternalSaveModal(false); }}><X size={20} /></button>
              <div className="modal-header">
                <div className="logo-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
                  <Cloud size={24} color="white" />
                </div>
                <h2>Save to Personal Storage</h2>
                <p>Connect your cloud storage to save your creations permanently.</p>
              </div>
              <div className="modal-body">
                <div className="external-storage-grid">
                  <button className="storage-btn" onClick={() => { 
                    // Simulate connection
                    setStorageConnections(prev => ({ ...prev, googleDrive: true }));
                    setShowExternalSaveModal(false); 
                  }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" width="24" loading="lazy" />
                    <span>Google Drive</span>
                  </button>
                  <button className="storage-btn" onClick={() => { 
                    // Simulate connection
                    toast('OneDrive coming soon!', { icon: '🚧' }); 
                    setShowExternalSaveModal(false); 
                  }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg" alt="OneDrive" width="24" loading="lazy" />
                    <span>OneDrive</span>
                  </button>
                  <button className="storage-btn" onClick={() => { 
                    // Simulate connection
                    toast('Dropbox coming soon!', { icon: '🚧' }); 
                    setShowExternalSaveModal(false); 
                  }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" alt="Dropbox" width="24" loading="lazy" />
                    <span>Dropbox</span>
                  </button>
                  <button className="storage-btn" onClick={() => { 
                    // Simulate connection
                    toast('iCloud coming soon!', { icon: '🚧' }); 
                    setShowExternalSaveModal(false); 
                  }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/1c/ICloud_logo.svg" alt="iCloud" width="24" loading="lazy" />
                    <span>iCloud</span>
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <p>Your files will be synced automatically after generation.</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Asset to Project Modal */}
        {addToProjectAsset && (
          <div className="modal-overlay" onClick={() => { setAddToProjectAsset(null); setNewProjectNameFromAsset(''); }}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <button className="modal-close" onClick={() => { setAddToProjectAsset(null); setNewProjectNameFromAsset(''); }}><X size={20} /></button>
              
              <div className="modal-header">
                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '16px', 
                  background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <FolderPlus size={28} color="white" />
                </div>
                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Save to Project</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Add <strong>"{addToProjectAsset.title || addToProjectAsset.snippet?.substring(0, 30) + '...'}"</strong> to a project
                </p>
              </div>

              <div className="modal-body" style={{ padding: '20px' }}>
                {/* Create New Project */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                    <FolderPlus size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Create new project
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={newProjectNameFromAsset}
                      onChange={(e) => setNewProjectNameFromAsset(e.target.value)}
                      placeholder="Project name..."
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '0.95rem'
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!newProjectNameFromAsset.trim()) return;
                        handleCreateProjectWithAsset(newProjectNameFromAsset, addToProjectAsset);
                        setAddToProjectAsset(null);
                        setNewProjectNameFromAsset('');
                        toast.success('Project created with asset!');
                      }}
                      disabled={!newProjectNameFromAsset.trim()}
                      className="cta-button-premium"
                      style={{ padding: '12px 20px', opacity: newProjectNameFromAsset.trim() ? 1 : 0.5 }}
                    >
                      Create
                    </button>
                  </div>
                </div>

                {/* Or add to existing */}
                {projects.length > 0 && (
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>
                      Or add to existing project
                    </label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {projects.slice(0, 10).map(project => (
                        <button
                          key={project.id}
                          onClick={() => {
                            handleSaveAssetToProject(project.id, addToProjectAsset);
                            setAddToProjectAsset(null);
                            toast.success(`Added to "${project.name}"!`);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            background: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            color: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-purple)'}
                          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Folder size={18} style={{ color: 'var(--color-purple)' }} />
                            <span style={{ fontWeight: '500' }}>{project.name}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {project.assets?.length || 0} assets
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {projects.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
                    Create your first project above to organize your work!
                  </p>
                )}
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => { setAddToProjectAsset(null); setNewProjectNameFromAsset(''); }}
                  className="cta-button-secondary"
                  style={{ width: '100%' }}
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal - Review AI Generation Before Saving */}
        {previewItem && (
          <div className="modal-overlay" onClick={handleDiscardPreview}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <button 
                className="modal-close" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDiscardPreview();
                }}
                style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 9999 }}
              >
                <X size={20} />
              </button>
              <div className="modal-header" style={{ flexShrink: 0, paddingBottom: '0.5rem' }}>
                <div className="logo-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <Eye size={24} color="white" />
                </div>
                <h2>Preview Your Creation</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Review your AI-generated content before saving to your Hub.
                </p>
              </div>
              <div className="modal-body" style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                {/* Metadata Bar - More info displayed */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  {/* Type Badge */}
                  <span style={{ 
                    background: previewItem.type === 'image' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 
                                previewItem.type === 'audio' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                previewItem.type === 'video' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                                'linear-gradient(135deg, #3b82f6, #2563eb)',
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: 'white',
                    textTransform: 'uppercase'
                  }}>
                    {previewItem.type || 'Text'}
                  </span>
                  
                  {/* Agent Name */}
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(139, 92, 246, 0.15)',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    color: 'var(--color-purple)'
                  }}>
                    <Sparkles size={12} />
                    {previewItem.agent || 'AI Generated'}
                  </span>
                  
                  {/* Model Used */}
                  {(previewItem.model || selectedModel) && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(6, 182, 212, 0.15)',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      color: 'var(--color-cyan)'
                    }}>
                      <Cpu size={12} />
                      {previewItem.model || selectedModel}
                    </span>
                  )}
                  
                  {/* Creation Time */}
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <Clock size={12} />
                    {previewItem.createdAt 
                      ? new Date(previewItem.createdAt).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : 'Just now'
                    }
                  </span>
                  
                  {/* Text Stats (for text content) */}
                  {previewItem.snippet && (
                    <>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        color: 'var(--color-emerald)'
                      }}>
                        <FileText size={12} />
                        {previewItem.snippet.split(/\s+/).filter(w => w).length} words
                      </span>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(249, 115, 22, 0.15)',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        color: 'var(--color-orange)'
                      }}>
                        {previewItem.snippet.length} chars
                      </span>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(236, 72, 153, 0.15)',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        color: 'var(--color-pink)'
                      }}>
                        {previewItem.snippet.split('\n').filter(l => l.trim()).length} lines
                      </span>
                    </>
                  )}
                </div>

                {/* Title if available */}
                {previewItem.title && (
                  <div style={{ 
                    marginBottom: '1rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    borderLeft: '3px solid var(--color-purple)'
                  }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</span>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {previewItem.title}
                    </div>
                  </div>
                )}

                {/* Preview Content */}
                <div style={{ 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '12px', 
                  padding: '1.5rem',
                  border: '1px solid var(--border-color)',
                  maxHeight: '65vh',
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start'
                }}>
                  {previewItem.type === 'image' && previewItem.imageUrl ? (
                    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <img 
                        src={previewItem.imageUrl} 
                        alt="Generated" 
                        onClick={(e) => {
                          // Toggle full size on click
                          if (e.target.style.maxHeight === '90vh') {
                            e.target.style.maxHeight = '60vh';
                            e.target.style.cursor = 'zoom-in';
                          } else {
                            e.target.style.maxHeight = '90vh';
                            e.target.style.cursor = 'zoom-out';
                          }
                        }}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '60vh', // Default constrained height
                          width: 'auto', 
                          height: 'auto',
                          borderRadius: '8px',
                          objectFit: 'contain',
                          cursor: 'zoom-in',
                          transition: 'max-height 0.3s ease'
                        }}
                        title="Click to expand"
                        onError={(e) => {
                          console.error('Image failed to load:', previewItem.imageUrl?.substring(0, 100));
                          e.target.style.display = 'none';
                        }}
                      />
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', pointerEvents: 'none' }}>
                        Click to zoom
                      </div>
                    </div>
                  ) : previewItem.type === 'audio' && previewItem.audioUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <audio 
                        controls 
                        src={previewItem.audioUrl} 
                        style={{ width: '100%' }}
                        onError={(e) => console.error('Audio failed to load:', e.target.error?.message, previewItem.audioUrl?.substring(0, 100))}
                        onCanPlay={() => console.log('Audio ready to play')}
                      />
                      {previewItem.audioUrl?.startsWith('http') && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          🔗 External audio URL
                        </p>
                      )}
                    </div>
                  ) : previewItem.type === 'video' && previewItem.videoUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {previewItem.audioUrl ? (
                        <>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', marginBottom: '4px', fontWeight: 'bold' }}>
                            🎵 Music Video Mode (Synced to: {previewItem.audioTitle || 'Audio'})
                          </div>
                          <video 
                            controls 
                            src={previewItem.videoUrl} 
                            style={{ width: '100%', borderRadius: '8px' }}
                            onPlay={(e) => {
                              const container = e.target.parentElement;
                              const audio = container.querySelector('.sync-audio');
                              if (audio) {
                                audio.currentTime = e.target.currentTime;
                                audio.play();
                              }
                            }}
                            onPause={(e) => {
                              const container = e.target.parentElement;
                              const audio = container.querySelector('.sync-audio');
                              if (audio) audio.pause();
                            }}
                            onTimeUpdate={(e) => {
                              const container = e.target.parentElement;
                              const audio = container.querySelector('.sync-audio');
                              if (audio && Math.abs(audio.currentTime - e.target.currentTime) > 0.5) {
                                audio.currentTime = e.target.currentTime;
                              }
                            }}
                          />
                          <audio className="sync-audio" src={previewItem.audioUrl} style={{ display: 'none' }} />
                        </>
                      ) : (
                        <video 
                          controls 
                          src={previewItem.videoUrl} 
                          style={{ width: '100%', borderRadius: '8px' }}
                          onError={(e) => console.error('Video failed to load:', e.target.error?.message, previewItem.videoUrl?.substring(0, 100))}
                        />
                      )}
                      {previewItem.videoUrl?.startsWith('http') && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          🔗 External video URL
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Show audio player if vocal has been created (consolidated view) */}
                      {previewItem.audioUrl && (
                        <div style={{ 
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))', 
                          borderRadius: '12px', 
                          padding: '12px',
                          border: '1px solid rgba(139, 92, 246, 0.2)'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-pink)', marginBottom: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mic size={14} /> AI Vocal Created
                          </div>
                          <audio 
                            controls 
                            src={previewItem.audioUrl} 
                            style={{ width: '100%', height: '40px' }}
                          />
                        </div>
                      )}
                      
                      {/* Toggle between Lyrics and Prompt */}
                      {previewPrompt && (
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px' }}>
                          <button
                            onClick={() => setPreviewView('lyrics')}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              background: previewView === 'lyrics' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'transparent',
                              color: previewView === 'lyrics' ? 'white' : 'var(--text-secondary)',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <FileText size={14} /> Lyrics
                          </button>
                          <button
                            onClick={() => setPreviewView('prompt')}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              background: previewView === 'prompt' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                              color: previewView === 'prompt' ? 'white' : 'var(--text-secondary)',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Edit3 size={14} /> Prompt
                          </button>
                        </div>
                      )}
                      
                      {/* Content based on toggle */}
                      <div style={{ 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: '1.8', 
                        color: 'var(--text-primary)',
                        background: previewView === 'lyrics' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        border: previewView === 'lyrics' ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        maxHeight: '50vh',
                        minHeight: '200px',
                        overflow: 'auto',
                        transition: 'all 0.2s',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}>
                        {previewView === 'lyrics' 
                          ? (previewItem.snippet || previewItem.title || 'No content generated')
                          : (previewPrompt || 'No prompt recorded')
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                flexShrink: 0,
                flexWrap: 'wrap'
              }}>
                {/* TTS Read Aloud for text content (not for audio/image/video) */}
                {!previewItem.audioUrl && !previewItem.imageUrl && !previewItem.videoUrl && (previewItem.snippet || previewItem.content) && (
                  <button 
                    onClick={() => {
                      const text = previewView === 'lyrics' 
                        ? (previewItem.snippet || previewItem.content || '')
                        : (previewPrompt || '');
                      if (window.speechSynthesis.speaking) {
                        window.speechSynthesis.cancel();
                      } else {
                        const utterance = new SpeechSynthesisUtterance(text);
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                    title="Read text aloud using browser TTS"
                    style={{ 
                      flex: 1, 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(34, 211, 238, 0.3)',
                      background: 'rgba(34, 211, 238, 0.1)',
                      color: 'var(--color-cyan)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Volume2 size={16} /> Read Aloud
                  </button>
                )}
                
                {/* Create AI Vocal - Uses Uberduck/Replicate rapper voices (not browser TTS) */}
                {!previewItem.audioUrl && !previewItem.imageUrl && !previewItem.videoUrl && (previewItem.snippet || previewItem.content) && (
                  <button 
                    onClick={() => {
                      const text = previewItem.snippet || previewItem.content || '';
                      handleCreateAIVocal(text, selectedAgent?.name || 'Ghostwriter');
                    }}
                    disabled={isCreatingVocal}
                    title="Create AI vocal using rapper voices (Uberduck/Replicate)"
                    style={{ 
                      flex: 1, 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(236, 72, 153, 0.3)',
                      background: isCreatingVocal ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.1)',
                      color: 'var(--color-pink)',
                      cursor: isCreatingVocal ? 'not-allowed' : 'pointer',
                      opacity: isCreatingVocal ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Mic size={16} className={isCreatingVocal ? 'animate-pulse' : ''} /> 
                    {isCreatingVocal ? 'Creating...' : 'Create Vocal'}
                  </button>
                )}
                
                <button 
                  onClick={handleDiscardPreview}
                  disabled={isSaving}
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Trash2 size={16} /> Discard
                </button>
                <button 
                  onClick={handleRegeneratePreview}
                  disabled={isGenerating || isSaving}
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: (isGenerating || isSaving) ? 'not-allowed' : 'pointer',
                    opacity: (isGenerating || isSaving) ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} /> 
                  {isGenerating ? 'Generating...' : 'Regenerate'}
                </button>
                <button 
                  onClick={() => handleSavePreview('project_canvas')}
                  disabled={isSaving}
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)',
                    background: isSaving ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                    color: 'var(--color-purple)',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Syncing...
                    </>
                  ) : (
                    <>
                      <Edit3 size={16} /> Edit
                    </>
                  )}
                </button>
                <button 
                  onClick={() => handleSavePreview('hub')}
                  disabled={isSaving}
                  className="cta-button-premium"
                  style={{ 
                    flex: 1.5, 
                    padding: '0.75rem', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: isSaving ? 0.8 : 1,
                    cursor: isSaving ? 'wait' : 'pointer'
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> 
                      <span>Syncing to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} /> {selectedProject ? 'Save to Project' : 'Save to Hub'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Studio Orchestrator (New Clean Interface) */}
        <Suspense fallback={<LazyFallback />}>
          <StudioOrchestrator
            isOpen={showOrchestrator}
            onClose={() => setShowOrchestrator(false)}
            authToken={userToken}
            existingProject={selectedProject}
            onCreateProject={(project) => {
              const traceId = `CREATE-${Date.now()}`;
              console.log(`[TRACE:${traceId}] onCreateProject RECEIVED`, {
                projectId: project.id,
                projectName: project.name,
                assetCount: project.assets?.length,
                assets: project.assets?.map(a => ({
                  id: a.id,
                  type: a.type,
                  hasContent: !!a.content,
                  hasImage: !!a.imageUrl,
                  hasAudio: !!a.audioUrl,
                  hasVideo: !!a.videoUrl
                })),
                coverImage: project.coverImage ? 'present' : 'missing'
              });
              
              // Find if project already exists
              const existingIndex = projects.findIndex(p => p.id === project.id);
              console.log(`[TRACE:${traceId}] Existing project index:`, existingIndex, 'current projects count:', projects.length);
              
              let finalProject;
              
              if (existingIndex >= 0) {
                // Update existing project - merge assets without duplicates
                console.log(`[TRACE:${traceId}] Updating existing project:`, project.id);
                const existingProject = projects[existingIndex];
                console.log(`[TRACE:${traceId}] Existing project assets:`, existingProject.assets?.length);
                
                const existingAssetIds = new Set((existingProject.assets || []).map(a => a.id));
                const newAssets = (project.assets || []).filter(a => !existingAssetIds.has(a.id));
                console.log(`[TRACE:${traceId}] New assets to add:`, newAssets.length);
                
                finalProject = {
                  ...existingProject,
                  ...project,
                  assets: [...(existingProject.assets || []), ...newAssets],
                  updatedAt: new Date().toISOString()
                };
                
                console.log(`[TRACE:${traceId}] Final merged asset count:`, finalProject.assets?.length);
                
                const newProjects = [...projects];
                newProjects[existingIndex] = finalProject;
                setProjects(newProjects);
              } else {
                // Create new project
                console.log(`[TRACE:${traceId}] Creating new project:`, project.id);
                finalProject = {
                  ...project,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                console.log(`[TRACE:${traceId}] New project asset count:`, finalProject.assets?.length);
                setProjects(prev => {
                  console.log(`[TRACE:${traceId}] setProjects - previous count:`, prev.length);
                  return [finalProject, ...prev];
                });
              }
              
              // Set selected project
              setSelectedProject(finalProject);
              console.log(`[TRACE:${traceId}] Selected project set:`, finalProject.id, 'assets:', finalProject.assets?.length);
              
              // Save to cloud if user is logged in (uses backend API now)
              if (isLoggedIn && user) {
                console.log(`[TRACE:${traceId}] Initiating cloud save for:`, finalProject.id);
                saveProjectToCloud(user.uid, finalProject).then(success => {
                  console.log(`[TRACE:${traceId}] Cloud save result:`, success);
                }).catch(err => {
                  console.error(`[TRACE:${traceId}] Cloud save error:`, err);
                });
              } else {
                console.warn(`[TRACE:${traceId}] NOT saving to cloud - isLoggedIn:`, isLoggedIn, 'hasUser:', !!user);
              }
              
              // Use pendingProjectNav flag for safe navigation (prevents race condition)
              setPendingProjectNav(true);
              toast.success(`Project "${finalProject.name}" saved with ${finalProject.assets?.length || 0} assets!`);
            }}
            onUpdateCreations={(agentId, creations) => {
              setAgentCreations(prev => ({
                ...prev,
                [agentId]: creations
              }));
            }}
          />
        </Suspense>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="modal-overlay" onClick={() => { setShowLoginModal(false); setSelectedPlan(null); setAuthMode('login'); setAuthEmail(''); setAuthPassword(''); }} onTouchEnd={() => { setShowLoginModal(false); setSelectedPlan(null); }}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <button className="modal-close" onClick={() => { setShowLoginModal(false); setSelectedPlan(null); setAuthMode('login'); }} onTouchEnd={(e) => { e.preventDefault(); setShowLoginModal(false); setSelectedPlan(null); }}><X size={20} /></button>
              <div className="modal-header">
                <div className="logo-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
                  <Sparkles size={24} color="white" />
                </div>
                <h2>{authMode === 'reset' ? 'Reset Password' : authMode === 'signup' ? 'Create Account' : selectedPlan ? 'Complete Your Subscription' : 'Welcome Back'}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {authMode === 'reset' 
                    ? 'Enter your email to receive a reset link.'
                    : selectedPlan 
                      ? `Sign in to activate ${selectedPlan.name} (${selectedPlan.price}${selectedPlan.period || ''}).` 
                      : authMode === 'signup' ? 'Create an account to save your work.' : 'Sign in to access your studio.'}
                </p>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Google Sign In Button */}
                {authMode !== 'reset' && (
                  <button 
                    className="cta-button-premium" 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={handleGoogleLogin}
                    disabled={authLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    {authLoading ? 'Signing in...' : 'Continue with Google'}
                  </button>
                )}

                {authMode !== 'reset' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                  </div>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input 
                    type="email" 
                    placeholder="Email address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 1rem', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-color)', 
                      background: 'var(--bg-card)', 
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                  {authMode !== 'reset' && (
                    <input 
                      type="password" 
                      placeholder="Password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)', 
                        background: 'var(--bg-card)', 
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem'
                      }}
                      required
                      minLength={6}
                    />
                  )}
                  
                  {authMode === 'reset' ? (
                    <button 
                      type="button"
                      className="cta-button-secondary" 
                      style={{ width: '100%' }}
                      onClick={handlePasswordReset}
                      disabled={authLoading}
                    >
                      {authLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  ) : (
                    <button 
                      type="submit"
                      className="cta-button-secondary" 
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      disabled={authLoading}
                    >
                      <Mail size={16} />
                      {authLoading ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Sign In with Email'}
                    </button>
                  )}
                </form>

                {/* Toggle between modes */}
                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  {authMode === 'login' && (
                    <>
                      <button 
                        onClick={() => setAuthMode('reset')} 
                        style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Forgot password?
                      </button>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        Don't have an account?{' '}
                        <button 
                          onClick={() => setAuthMode('signup')} 
                          style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Sign up
                        </button>
                      </p>
                    </>
                  )}
                  {authMode === 'signup' && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      Already have an account?{' '}
                      <button 
                        onClick={() => setAuthMode('login')} 
                        style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                  {authMode === 'reset' && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <button 
                        onClick={() => setAuthMode('login')} 
                        style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', fontWeight: '600' }}
                      >
                        ← Back to sign in
                      </button>
                    </p>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>By continuing, you agree to our Terms of Service.</p>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Payment Method Modal */}
        {showAddPaymentModal && (
          <div className="modal-overlay" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }} onClick={() => { setShowAddPaymentModal(false); setEditingPayment(null); }} onTouchEnd={() => { setShowAddPaymentModal(false); setEditingPayment(null); }}>
            <div 
              className="modal-content animate-fadeInUp" 
              onClick={(e) => e.stopPropagation()} 
              onTouchEnd={(e) => e.stopPropagation()}
              style={{ 
                maxWidth: 'min(92vw, 700px)', 
                width: '100%',
                margin: '1rem auto',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="modal-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexShrink: 0 }}>
                <div className="modal-title-group">
                  <div className="agent-mini-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                    <CreditCard size={20} />
                  </div>
                  <h2 style={{ margin: 0 }}>{editingPayment ? 'Edit Payment Method' : 'Payment Methods'}</h2>
                </div>
                <button className="modal-close" onClick={() => { setShowAddPaymentModal(false); setEditingPayment(null); }} onTouchEnd={(e) => { e.preventDefault(); setShowAddPaymentModal(false); setEditingPayment(null); }}><X size={20} /></button>
              </div>

              <div className="modal-body" style={{ padding: '1.5rem', overflow: 'visible', flex: 1 }}>
                {/* Existing Cards Section */}
                {!editingPayment && paymentMethods.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saved Cards</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {paymentMethods.map((card, idx) => (
                        <div 
                          key={card.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem 1.25rem',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                              width: '48px', 
                              height: '32px', 
                              background: card.brand === 'visa' ? 'linear-gradient(135deg, #1a1f71, #00579f)' : 
                                         card.brand === 'mastercard' ? 'linear-gradient(135deg, #eb001b, #f79e1b)' : 
                                         'linear-gradient(135deg, #333, #555)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.6rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              {card.brand || 'Card'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>•••• •••• •••• {card.last4}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expires {card.expiry}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => { setEditingPayment({ item: card, type: 'card' }); setPaymentType('card'); }}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'transparent',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button 
                              onClick={() => {
                                setPaymentMethods(prev => prev.filter(c => c.id !== card.id));
                                toast.success('Card removed');
                              }}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Bank Accounts Section */}
                {!editingPayment && bankAccounts.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bank Accounts</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {bankAccounts.map((bank, idx) => (
                        <div 
                          key={bank.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem 1.25rem',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                              width: '48px', 
                              height: '32px', 
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              <Landmark size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{bank.bankName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{bank.type} •••• {bank.last4}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => { setEditingPayment({ item: bank, type: 'bank' }); setPaymentType('bank'); }}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'transparent',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button 
                              onClick={() => {
                                setBankAccounts(prev => prev.filter(b => b.id !== bank.id));
                                toast.success('Bank account removed');
                              }}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New / Edit Form */}
                <div>
                  {!editingPayment && (
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Add New Payment Method
                    </h4>
                  )}
                  
                  <div className="modal-tabs" style={{ marginBottom: '1rem' }}>
                    <button 
                      className={`modal-tab ${paymentType === 'card' ? 'active' : ''}`}
                      onClick={() => setPaymentType('card')}
                      disabled={!!editingPayment}
                      style={{ flex: 1 }}
                    >
                      <CreditCard size={16} style={{ marginRight: '6px' }} /> Card
                    </button>
                    <button 
                      className={`modal-tab ${paymentType === 'bank' ? 'active' : ''}`}
                      onClick={() => setPaymentType('bank')}
                      disabled={!!editingPayment}
                      style={{ flex: 1 }}
                    >
                      <Landmark size={16} style={{ marginRight: '6px' }} /> Bank
                    </button>
                  </div>

                  {paymentType === 'card' ? (
                    <form className="payment-form" onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Cardholder Name</label>
                        <input 
                          type="text" 
                          name="cardName" 
                          placeholder="Name on card" 
                          required 
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Card Number</label>
                        <div style={{ position: 'relative' }}>
                          <CreditCard size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                          <input 
                            type="text" 
                            name="cardNumber" 
                            placeholder="0000 0000 0000 0000" 
                            defaultValue={editingPayment ? `**** **** **** ${editingPayment.item.last4}` : ''}
                            required 
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Expiry</label>
                          <input 
                            type="text" 
                            name="expiry" 
                            placeholder="MM/YY" 
                            defaultValue={editingPayment ? editingPayment.item.expiry : ''}
                            required 
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>CVC</label>
                          <input type="text" name="cvc" placeholder="123" required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Zip</label>
                          <input type="text" name="zip" placeholder="10001" required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {editingPayment && (
                          <button 
                            type="button" 
                            className="cta-button-secondary" 
                            style={{ flex: 1 }}
                            onClick={() => setEditingPayment(null)}
                          >
                            Cancel
                          </button>
                        )}
                        <button type="submit" className="cta-button-premium" style={{ flex: 1 }}>
                          {editingPayment ? 'Update Card' : 'Add Card'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form className="payment-form" onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Account Holder Name</label>
                        <input 
                          type="text" 
                          name="accountName" 
                          placeholder="Full Name" 
                          required 
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Bank Name</label>
                        <div style={{ position: 'relative' }}>
                          <Landmark size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                          <input 
                            type="text" 
                            name="bankName" 
                            placeholder="e.g. Chase, Wells Fargo" 
                            defaultValue={editingPayment ? editingPayment.item.bankName : ''}
                            required 
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Routing Number</label>
                          <input type="text" name="routingNumber" placeholder="9 digits" required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Account Number</label>
                          <input 
                            type="text" 
                            name="accountNumber" 
                            placeholder="Account Number" 
                            defaultValue={editingPayment ? `****${editingPayment.item.last4}` : ''}
                            required 
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {editingPayment && (
                          <button 
                            type="button" 
                            className="cta-button-secondary" 
                            style={{ flex: 1 }}
                            onClick={() => setEditingPayment(null)}
                          >
                            Cancel
                          </button>
                        )}
                        <button type="submit" className="cta-button-premium" style={{ flex: 1 }}>
                          {editingPayment ? 'Update Account' : 'Link Account'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <Lock size={14} />
                  <span>256-bit encryption • Secured by Stripe</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="bottom-nav">
          <div 
            className={`bottom-nav-item ${activeTab === 'agents' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('agents'); setSelectedAgent(null); }}
            role="button"
            tabIndex={0}
          >
            <LayoutGrid size={22} />
            <span>Team</span>
          </div>
          
          <div 
            className={`bottom-nav-item ${activeTab === 'hub' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('hub'); setSelectedAgent(null); }}
            role="button"
            tabIndex={0}
          >
            <Folder size={22} />
            <span>Projects</span>
          </div>
          
          {/* Global Create Button */}
          <div 
            className="bottom-nav-item create-btn" 
            onClick={() => setShowProjectChoiceModal(true)}
            role="button"
            tabIndex={0}
          >
            <div style={{
              background: 'var(--color-purple)',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.5)',
              marginTop: '-20px',
              border: '3px solid var(--color-bg-primary)'
            }}>
              <Plus size={26} color="white" />
            </div>
          </div>

          <div 
            className={`bottom-nav-item ${activeTab === 'mystudio' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('mystudio'); setSelectedAgent(null); }}
            role="button"
            tabIndex={0}
          >
            <Home size={22} />
            <span>Studio</span>
          </div>
          
          <div 
            className={`bottom-nav-item ${activeTab === 'more' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('more'); setSelectedAgent(null); }}
            role="button"
            tabIndex={0}
          >
            <Menu size={22} />
            <span>More</span>
          </div>
        </nav>
      </main>

      {/* Maintenance Mode Overlay */}
      {systemStatus.status === 'maintenance' && !maintenanceDismissed && (
        <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content animate-fadeInUp" style={{ textAlign: 'center', border: '1px solid var(--color-red)', position: 'relative' }}>
            <button 
              onClick={() => setMaintenanceDismissed(true)}
              style={{ 
                position: 'absolute', 
                top: '1rem', 
                right: '1rem', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '4px'
              }}
              aria-label="Dismiss maintenance message"
            >
              <X size={20} />
            </button>
            <div className="logo-box" style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', background: 'rgba(239, 68, 68, 0.1)' }}>
              <Activity size={32} color="var(--color-red)" />
            </div>
            <h2 style={{ color: 'var(--color-red)', marginBottom: '1rem' }}>System Maintenance</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              The Studio is currently undergoing critical updates or experiencing connectivity issues. 
              <br/>Please check back in a few minutes.
            </p>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
              Status: {systemStatus.details || 'Backend Unreachable'}
            </div>
            <button 
              className="cta-button-secondary" 
              style={{ marginTop: '2rem', width: '100%' }}
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} style={{ marginRight: '8px' }} /> Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Credits Info Modal */}
      {showCreditsModal && (
        <div className="modal-overlay animate-fadeIn" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }} onClick={() => setShowCreditsModal(false)}>
          <div 
            className="modal-content credits-modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: 'min(92vw, 560px)', 
              width: '100%',
              margin: '1rem auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexShrink: 0 }}>
              <div className="modal-title-group">
                <div className="agent-mini-icon" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#000' }}>
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>Studio Credits</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Balance: <strong style={{ color: '#facc15' }}>{userCredits} credits</strong></p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowCreditsModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '1.25rem', flex: 1 }}>
              {/* Quick Add Credits */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Add Credits</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {[
                    { amount: 5, price: '$0.99' },
                    { amount: 25, price: '$3.99' },
                    { amount: 50, price: '$6.99' },
                    { amount: 100, price: '$9.99' }
                  ].map(({ amount, price }) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setUserCredits(prev => prev + amount);
                        toast.success(`+${amount} credits added!`);
                      }}
                      style={{
                        padding: '0.75rem 0.5rem',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.2s ease',
                        color: 'var(--text-primary)'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#facc15'; e.currentTarget.style.background = 'rgba(250, 204, 21, 0.1)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--glass-bg)'; }}
                    >
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#facc15' }}>+{amount}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit Costs */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Credit Costs</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { action: 'Create Project', cost: 2, icon: Folder },
                    { action: 'Text Generation', cost: 5, icon: FileText },
                    { action: 'Image Generation', cost: 15, icon: Image },
                    { action: 'Audio Processing', cost: 25, icon: Music }
                  ].map(({ action, cost, icon: ActionIcon }) => (
                    <div 
                      key={action}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <ActionIcon size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '0.9rem' }}>{action}</span>
                      </div>
                      <span style={{ fontWeight: '600', color: '#facc15', fontSize: '0.9rem' }}>{cost} credits</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip */}
              <div style={{ 
                padding: '0.75rem 1rem', 
                background: 'rgba(250, 204, 21, 0.08)', 
                border: '1px solid rgba(250, 204, 21, 0.2)', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <Sparkles size={18} style={{ color: '#facc15', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Pro Tip:</strong> Credits are used when you create projects or generate content with any agent.
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 1.25rem', flexShrink: 0, display: 'flex', gap: '0.75rem' }}>
              <button 
                className="cta-button-secondary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  setShowCreditsModal(false);
                  setDashboardTab('billing');
                  setActiveTab('mystudio');
                }}
              >
                <Plus size={18} style={{ marginRight: '6px' }} /> Add Credits
              </button>
              <button 
                className="cta-button-premium" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  setShowCreditsModal(false);
                  setShowProjectChoiceModal(true);
                }}
              >
                <Rocket size={18} style={{ marginRight: '6px' }} /> Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Choice Modal */}
      {showProjectChoiceModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowProjectChoiceModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%', textAlign: 'center', margin: '0 12px', boxSizing: 'border-box', maxHeight: 'none', overflow: 'visible' }}>
            <div className="modal-header" style={{ justifyContent: 'center', flexDirection: 'column', gap: '12px', borderBottom: 'none', paddingBottom: 0 }}>
              <div className="agent-mini-icon bg-purple" style={{ width: '60px', height: '60px', margin: '0 auto' }}>
                <Rocket size={32} />
              </div>
              <h2 style={{ fontSize: '1.8rem' }}>How would you like to start?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Choose the best way to launch your new project.</p>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '32px 0' }}>
              <button 
                className="cta-button-premium" 
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  padding: '24px', 
                  height: 'auto',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
                  border: 'none'
                }}
                onClick={() => {
                  setShowProjectChoiceModal(false);
                  setShowOrchestrator(true);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%' }}>
                    <Zap size={28} color="white" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'white', letterSpacing: '0.5px' }}>AI STUDIO ORCHESTRATOR</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: '500', color: 'white' }}>One idea → Full production pipeline</div>
                  </div>
                </div>
              </button>

              <button 
                className="cta-button-secondary" 
                style={{ width: '100%', justifyContent: 'center', padding: '20px', height: 'auto', background: 'var(--color-bg-tertiary)', border: '1px solid var(--border-color)' }}
                onClick={() => {
                  setShowProjectChoiceModal(false);
                  setShowProjectWizard(true);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%' }}>
                    <Sparkles size={24} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Guided Project Wizard</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7, fontWeight: 'normal' }}>Step-by-step manual setup</div>
                  </div>
                </div>
              </button>

              <button 
                className="cta-button-secondary" 
                style={{ width: '100%', justifyContent: 'center', padding: '20px', height: 'auto', background: 'transparent', border: '1px solid var(--border-color)' }}
                onClick={() => {
                  setShowProjectChoiceModal(false);
                  handleManualCreate();
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '50%' }}>
                    <PenTool size={24} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Quick Manual Start</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.6, fontWeight: 'normal' }}>Skip setup and go straight to studio</div>
                  </div>
                </div>
              </button>
            </div>

            <button className="modal-close" onClick={() => setShowProjectChoiceModal(false)} style={{ top: '20px', right: '20px' }}>
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Project Wizard Modal */}
      {showProjectWizard && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowProjectWizard(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content project-wizard-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%', margin: '0 12px', boxSizing: 'border-box', maxHeight: 'none', overflow: 'visible' }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="agent-mini-icon bg-purple">
                  <Rocket size={20} />
                </div>
                <h2>Create New Project</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  className="btn-text" 
                  onClick={() => handleSkipWizard('agents')}
                  style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--text-secondary)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Skip Wizard
                </button>
                <button className="modal-close" onClick={() => setShowProjectWizard(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              {/* Progress Bar */}
              <div className="wizard-progress" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {[1, 2, 3].map(step => (
                  <div key={step} style={{ 
                    flex: 1, 
                    height: '4px', 
                    background: step <= projectWizardStep ? 'var(--color-purple)' : 'var(--color-bg-tertiary)',
                    borderRadius: '2px',
                    transition: 'all 0.3s ease'
                  }}></div>
                ))}
              </div>

              {/* Step 1: Vision & Vibe */}
              {projectWizardStep === 1 && (
                <div className="wizard-step animate-slideIn">
                  <h3 style={{ marginBottom: '16px' }}>Define Your Vision</h3>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Project Name</label>
                    <input 
                      type="text" 
                      className="search-input" 
                      placeholder="e.g. Summer Vibes 2025"
                      value={newProjectData.name}
                      onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                      autoFocus
                      style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Language</label>
                      <select 
                        value={newProjectData.language}
                        onChange={(e) => setNewProjectData({...newProjectData, language: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      >
                        {['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Portuguese', 'Italian', 'Chinese'].map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Style / Genre</label>
                      <select 
                        value={newProjectData.style}
                        onChange={(e) => setNewProjectData({...newProjectData, style: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      >
                        {['Modern Hip-Hop', '90s Boom Bap', 'Trap', 'R&B / Soul', 'Pop', 'Rock', 'Electronic', 'Cinematic', 'Jazz', 'Lo-Fi'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>AI Model</label>
                      <select 
                        value={newProjectData.model}
                        onChange={(e) => setNewProjectData({...newProjectData, model: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      >
                        {['Gemini 2.0 Flash', 'Gemini 2.0 Pro (Exp)', 'Gemini 1.5 Flash', 'Gemini 1.5 Pro'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Project Category</label>
                    <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      {PROJECT_CATEGORIES.map(cat => (
                        <div 
                          key={cat.id}
                          className={`category-card haptic-press ${newProjectData.category === cat.id ? 'selected' : ''}`}
                          onClick={() => setNewProjectData({...newProjectData, category: cat.id})}
                          style={{
                            padding: '12px',
                            background: newProjectData.category === cat.id ? 'rgba(168, 85, 247, 0.1)' : 'var(--color-bg-tertiary)',
                            border: newProjectData.category === cat.id ? '1px solid var(--color-purple)' : '1px solid transparent',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <cat.icon size={20} style={{ color: cat.color }} />
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{cat.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {newProjectData.category === 'social' && (
                    <div className="social-inputs animate-fadeIn" style={{ marginBottom: '24px', padding: '16px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                      <h4 style={{ marginBottom: '12px', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Share2 size={16} /> Social Profile Setup
                      </h4>
                      
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Platform Focus</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {['instagram', 'tiktok', 'youtube', 'twitter'].map(platform => (
                            <button
                              key={platform}
                              className={`platform-btn ${newProjectData.socialPlatform === platform ? 'active' : ''}`}
                              onClick={() => setNewProjectData({...newProjectData, socialPlatform: platform})}
                              style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '8px',
                                border: newProjectData.socialPlatform === platform ? '1px solid var(--color-cyan)' : '1px solid var(--border-color)',
                                background: newProjectData.socialPlatform === platform ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                                color: newProjectData.socialPlatform === platform ? 'var(--color-cyan)' : 'var(--text-secondary)',
                                textTransform: 'capitalize',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              {platform}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Handle / Username</label>
                        <input 
                          type="text" 
                          className="search-input" 
                          placeholder="@yourname"
                          value={newProjectData.socialHandle}
                          onChange={(e) => setNewProjectData({...newProjectData, socialHandle: e.target.value})}
                          style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bio / Vibe</label>
                        <textarea 
                          className="search-input" 
                          placeholder="Describe your brand voice..."
                          value={newProjectData.socialBio}
                          onChange={(e) => setNewProjectData({...newProjectData, socialBio: e.target.value})}
                          style={{ width: '100%', padding: '10px', fontSize: '0.9rem', minHeight: '60px', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Workflow & Team */}
              {projectWizardStep === 2 && (
                <div className="wizard-step animate-slideIn">
                  <h3 style={{ marginBottom: '16px' }}>Choose Your Workflow</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                    How do you want to work? Select a preset workflow or build your own team.
                  </p>

                  {/* Workflow Presets */}
                  <div className="workflow-presets" style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                    <div 
                      className={`workflow-card haptic-press ${newProjectData.workflow === 'full_song' ? 'selected' : ''}`}
                      onClick={() => setNewProjectData({
                        ...newProjectData, 
                        workflow: 'full_song',
                        selectedAgents: ['ghost', 'beat', 'album']
                      })}
                      style={{
                        padding: '16px',
                        background: newProjectData.workflow === 'full_song' ? 'rgba(168, 85, 247, 0.15)' : 'var(--color-bg-tertiary)',
                        border: newProjectData.workflow === 'full_song' ? '1px solid var(--color-purple)' : '1px solid transparent',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{ background: 'var(--color-purple)', padding: '10px', borderRadius: '50%', color: 'white' }}>
                        <Music size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Full Song Creation</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lyrics → Beat → Cover Art</div>
                      </div>
                      {newProjectData.workflow === 'full_song' && <CheckCircle size={20} className="text-purple" />}
                    </div>

                    <div 
                      className={`workflow-card haptic-press ${newProjectData.workflow === 'social_promo' ? 'selected' : ''}`}
                      onClick={() => setNewProjectData({
                        ...newProjectData, 
                        workflow: 'social_promo',
                        selectedAgents: ['video-creator', 'trend', 'collab', 'social']
                      })}
                      style={{
                        padding: '16px',
                        background: newProjectData.workflow === 'social_promo' ? 'rgba(6, 182, 212, 0.15)' : 'var(--color-bg-tertiary)',
                        border: newProjectData.workflow === 'social_promo' ? '1px solid var(--color-cyan)' : '1px solid transparent',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{ background: 'var(--color-cyan)', padding: '10px', borderRadius: '50%', color: 'white' }}>
                        <Share2 size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Social Promotion</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Video → Trends → Social Pilot</div>
                      </div>
                      {newProjectData.workflow === 'social_promo' && <CheckCircle size={20} className="text-cyan" />}
                    </div>
                    
                    <div 
                      className={`workflow-card haptic-press ${newProjectData.workflow === 'custom' ? 'selected' : ''}`}
                      onClick={() => setNewProjectData({
                        ...newProjectData, 
                        workflow: 'custom',
                        selectedAgents: []
                      })}
                      style={{
                        padding: '16px',
                        background: newProjectData.workflow === 'custom' ? 'rgba(255, 255, 255, 0.1)' : 'var(--color-bg-tertiary)',
                        border: newProjectData.workflow === 'custom' ? '1px solid var(--text-secondary)' : '1px solid transparent',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{ background: 'var(--text-secondary)', padding: '10px', borderRadius: '50%', color: 'var(--color-bg-primary)' }}>
                        <Settings size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Custom Team</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manually select your agents</div>
                      </div>
                      {newProjectData.workflow === 'custom' && <CheckCircle size={20} className="text-white" />}
                    </div>
                  </div>

                  {/* Custom Agent Selection (Only if Custom is selected) */}
                  {newProjectData.workflow === 'custom' && (
                    <div className="agents-grid-selection animate-fadeIn" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {AGENTS.map(agent => {
                      const isSelected = newProjectData.selectedAgents?.includes(agent.id);
                      return (
                        <div 
                          key={agent.id}
                          className={`agent-select-card haptic-press ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            const current = newProjectData.selectedAgents || [];
                            const updated = current.includes(agent.id)
                              ? current.filter(n => n !== agent.id)
                              : [...current, agent.id];
                            setNewProjectData({...newProjectData, selectedAgents: updated});
                          }}
                          style={{
                            padding: '12px',
                            background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'var(--color-bg-tertiary)',
                            border: isSelected ? '1px solid var(--color-purple)' : '1px solid transparent',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                          }}
                        >
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: isSelected ? 'var(--color-purple)' : 'var(--color-bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSelected ? 'white' : 'var(--text-secondary)'
                          }}>
                            <agent.icon size={16} />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{agent.name}</span>
                          {isSelected && <CheckCircle size={14} className="text-purple" style={{ position: 'absolute', top: '8px', right: '8px' }} />}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}

              {/* Step 3: Review */}
              {projectWizardStep === 3 && (
                <div className="wizard-step animate-slideIn">
                  <h3 style={{ marginBottom: '16px' }}>Ready to Launch?</h3>
                  <div className="review-card" style={{ 
                    padding: '24px', 
                    background: 'var(--color-bg-tertiary)', 
                    borderRadius: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      width: '64px', 
                      height: '64px', 
                      background: 'var(--color-bg-secondary)', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <Rocket size={32} className="text-purple" />
                    </div>
                    <h2 style={{ marginBottom: '8px' }}>{newProjectData.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      {PROJECT_CATEGORIES.find(c => c.id === newProjectData.category)?.label} • {new Date().toLocaleDateString()}
                    </p>
                    
                    <div className="selected-team-preview" style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                      {(newProjectData.selectedAgents || []).map(agentIdOrName => {
                        const agent = AGENTS.find(a => a.id === agentIdOrName || a.name === agentIdOrName);
                        return agent ? (
                          <div key={agentIdOrName} title={agent.name} style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg-primary)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)'
                          }}>
                            <agent.icon size={16} />
                          </div>
                        ) : null;
                      })}
                      {(newProjectData.selectedAgents || []).length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No specific agents selected</span>}
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Your studio environment is being prepared.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              {projectWizardStep > 1 ? (
                <button className="btn-ghost" onClick={() => setProjectWizardStep(prev => prev - 1)}>
                  Back
                </button>
              ) : (
                <div></div> 
              )}
              
              {projectWizardStep < 3 ? (
                <button 
                  className="cta-button-premium" 
                  disabled={
                    (projectWizardStep === 1 && (!newProjectData.name || !newProjectData.category)) ||
                    (projectWizardStep === 2 && !newProjectData.workflow)
                  }
                  onClick={() => setProjectWizardStep(prev => prev + 1)}
                >
                  Next Step
                </button>
              ) : (
                <button className="cta-button-premium" onClick={handleCreateProject}>
                  Create Project
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 2000, overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }}>
          <div className="modal-content onboarding-modal" style={{ maxWidth: 'min(92vw, 750px)', width: '100%', padding: 0, margin: '1rem auto' }}>
            {/* Progress Bar */}
            <div style={{ height: '4px', background: 'var(--color-bg-tertiary)', width: '100%' }}>
              <div style={{ 
                height: '100%', 
                background: 'var(--color-purple)', 
                width: `${((onboardingStep + 1) / onboardingSteps.length) * 100}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>

            <div style={{ padding: '32px', position: 'relative' }}>
              {/* Skip and Close buttons - properly spaced */}
              <button 
                onClick={handleSkipOnboarding}
                style={{ 
                  position: 'absolute',
                  top: '20px', 
                  right: '70px',
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.9rem', 
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  zIndex: 10
                }}
              >
                Skip
              </button>
              <button 
                onClick={() => setShowOnboarding(false)}
                style={{ 
                  position: 'absolute',
                  top: '16px', 
                  right: '20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  zIndex: 10,
                  padding: 0
                }}
              >
                <X size={20} />
              </button>

              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-purple)' }}>
                  Step {onboardingStep + 1} of {onboardingSteps.length}
                </span>
                <h2 style={{ fontSize: '2rem', marginTop: '8px', marginBottom: '16px' }}>
                  {onboardingSteps[onboardingStep].title}
                </h2>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.6' }}>
                  {onboardingSteps[onboardingStep].content}
                </p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {onboardingSteps[onboardingStep].detail}
                </p>
              </div>

              {/* Step 1: Profile Setup */}
              {onboardingStep === 1 && (
                <div className="profile-setup-step animate-fadeInUp" style={{ marginTop: '24px' }}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      Stage Name <span style={{ color: 'var(--color-purple)' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      className="search-input" 
                      placeholder="e.g. The Weeknd, J. Cole"
                      value={userProfile.stageName}
                      onChange={(e) => setUserProfile({...userProfile, stageName: e.target.value})}
                      autoFocus
                      style={{ 
                        width: '100%', 
                        padding: '12px', 
                        fontSize: '1.1rem', 
                        background: 'rgba(255,255,255,0.05)', 
                        border: userProfile.stageName ? '1px solid var(--color-purple)' : '1px solid var(--border-color)', 
                        borderRadius: '8px', 
                        color: 'white' 
                      }}
                    />
                    {!userProfile.stageName && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Required to personalize your experience
                      </p>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Primary Genre</label>
                    <div className="genre-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {['Hip Hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Afrobeats'].map(genre => (
                        <button
                          key={genre}
                          onClick={() => setUserProfile({...userProfile, genre})}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: userProfile.genre === genre ? '1px solid var(--color-purple)' : '1px solid var(--border-color)',
                            background: userProfile.genre === genre ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)',
                            color: userProfile.genre === genre ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Target Demographic</label>
                      <select 
                        className="studio-select"
                        value={userProfile.targetDemographic || 'Gen Z'}
                        onChange={(e) => setUserProfile({...userProfile, targetDemographic: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                      >
                        <option>Gen Z</option>
                        <option>Millennials</option>
                        <option>Gen X</option>
                        <option>Global</option>
                        <option>Niche / Underground</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Language</label>
                      <select 
                        className="studio-select"
                        value={userProfile.language || 'English'}
                        onChange={(e) => setUserProfile({...userProfile, language: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                      >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                        <option>Portuguese</option>
                        <option>Japanese</option>
                        <option>Korean</option>
                        <option>Mandarin</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Path Selection */}
              {onboardingStep === 2 && (
                <div className="path-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '24px' }}>
                  {(goalOptions || []).map(path => (
                    <div 
                      key={path.id}
                      onClick={() => setSelectedPath(path.id)}
                      className={`path-card ${selectedPath === path.id ? 'selected' : ''}`}
                      style={{
                        padding: '16px',
                        background: selectedPath === path.id ? 'rgba(168, 85, 247, 0.15)' : 'var(--color-bg-tertiary)',
                        border: selectedPath === path.id ? '1px solid var(--color-purple)' : '1px solid transparent',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <path.icon size={24} style={{ color: selectedPath === path.id ? 'var(--color-purple)' : 'var(--text-secondary)', marginBottom: '12px' }} />
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>{path.label}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{path.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3: Recommendation */}
              {onboardingStep === 3 && selectedPath && (
                <div className="recommendation-box animate-fadeInUp" style={{ marginTop: '24px', padding: '20px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  {(() => {
                    const recId = getRecommendation();
                    if (!recId) return <p>Explore the studio freely!</p>;
                    const agent = AGENTS.find(a => a.id === recId);
                    const details = agentDetails[recId];
                    return (
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'var(--color-purple)', padding: '12px', borderRadius: '12px', color: 'white' }}>
                          {agent ? <agent.icon size={24} /> : <Sparkles size={24} />}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Recommended: {details?.title || agent?.name}</h4>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{details?.tagline}</p>
                          <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{details?.description?.substring(0, 150)}...</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  className="btn-ghost" 
                  onClick={() => setOnboardingStep(prev => Math.max(0, prev - 1))}
                  disabled={onboardingStep === 0}
                  style={{ opacity: onboardingStep === 0 ? 0 : 1 }}
                >
                  Back
                </button>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Hint for required fields */}
                  {onboardingStep === 1 && !userProfile.stageName && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '8px' }}>
                      Enter stage name to continue
                    </span>
                  )}
                  {onboardingStep === 2 && !selectedPath && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '8px' }}>
                      Select a path to continue
                    </span>
                  )}
                  
                  {onboardingStep < onboardingSteps.length - 1 ? (
                    <button 
                      className="cta-button-premium"
                      onClick={() => setOnboardingStep(prev => prev + 1)}
                      disabled={(onboardingStep === 2 && !selectedPath) || (onboardingStep === 1 && !userProfile.stageName)}
                      style={{ 
                        opacity: ((onboardingStep === 2 && !selectedPath) || (onboardingStep === 1 && !userProfile.stageName)) ? 0.5 : 1,
                        cursor: ((onboardingStep === 2 && !selectedPath) || (onboardingStep === 1 && !userProfile.stageName)) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Next Step
                    </button>
                  ) : (
                    <button 
                      className="cta-button-premium"
                      onClick={completeOnboarding}
                    >
                      Enter Studio
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent White Paper Modal */}
      {showAgentWhitePaper && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowAgentWhitePaper(null)} style={{ zIndex: 2000 }}>
          <div 
            className="modal-content whitepaper-modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '800px', 
              width: '95%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ 
                  width: '44px', height: '44px', borderRadius: '12px', 
                  background: 'var(--color-bg-secondary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-primary)'
                }}>
                  <showAgentWhitePaper.icon size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{showAgentWhitePaper.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{showAgentWhitePaper.subtitle}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowAgentWhitePaper(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem', flex: 1, overflow: 'auto' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--color-purple)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} /> The Vision
                </h3>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0 }}>
                  {showAgentWhitePaper.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <UsersIcon size={16} className="text-cyan" /> Who It's For
                  </h4>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 }}>
                    {showAgentWhitePaper.whoFor}
                  </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <Zap size={18} className="text-orange" /> How It Works
                  </h4>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 }}>
                    {showAgentWhitePaper.howTo}
                  </p>
                </div>
              </div>

              {/* Display Generated Creations */}
              {agentCreations[showAgentWhitePaper.key] && (Object.values(agentCreations[showAgentWhitePaper.key]).some(v => v)) && (
                <div style={{ marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--color-purple)' }}>
                    <Eye size={16} /> Generated Creations
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {/* Video Preview */}
                    {agentCreations[showAgentWhitePaper.key].video && (
                      <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(236, 72, 153, 1)', marginBottom: '8px', fontWeight: '600' }}>🎬 Video</p>
                        <video 
                          src={agentCreations[showAgentWhitePaper.key].video}
                          controls
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', background: '#000' }}
                          controlsList="nodownload"
                        />
                        <button 
                          className="btn-pill primary" 
                          style={{ width: '100%', marginTop: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
                          onClick={() => {
                            const asset = {
                              id: String(Date.now()),
                              title: `${showAgentWhitePaper.title} Video`,
                              type: 'Video',
                              agent: showAgentWhitePaper.title,
                              date: 'Just now',
                              color: 'agent-pink',
                              snippet: 'Generated Video',
                              videoUrl: agentCreations[showAgentWhitePaper.key].video
                            };
                            if (selectedProject) {
                              handleSaveAssetToProject(selectedProject.id, asset);
                              toast.success(`Saved to ${selectedProject.name}`);
                            } else {
                              handleCreateProjectWithAsset(`New ${showAgentWhitePaper.title} Project`, asset);
                            }
                          }}
                        >
                          <FolderPlus size={14} /> Save
                        </button>
                      </div>
                    )}

                    {/* Image Preview */}
                    {agentCreations[showAgentWhitePaper.key].image && (
                      <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(168, 85, 247, 1)', marginBottom: '8px', fontWeight: '600' }}>🎨 Image</p>
                        <img 
                          src={agentCreations[showAgentWhitePaper.key].image.startsWith('data:') ? agentCreations[showAgentWhitePaper.key].image : `data:image/png;base64,${agentCreations[showAgentWhitePaper.key].image}`}
                          alt="Generated"
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <button 
                          className="btn-pill primary" 
                          style={{ width: '100%', marginTop: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
                          onClick={() => {
                            const imgUrl = agentCreations[showAgentWhitePaper.key].image.startsWith('data:') ? agentCreations[showAgentWhitePaper.key].image : `data:image/png;base64,${agentCreations[showAgentWhitePaper.key].image}`;
                            const asset = {
                              id: String(Date.now()),
                              title: `${showAgentWhitePaper.title} Image`,
                              type: 'Image',
                              agent: showAgentWhitePaper.title,
                              date: 'Just now',
                              color: 'agent-purple',
                              snippet: 'Generated Image',
                              imageUrl: imgUrl
                            };
                            if (selectedProject) {
                              handleSaveAssetToProject(selectedProject.id, asset);
                              toast.success(`Saved to ${selectedProject.name}`);
                            } else {
                              handleCreateProjectWithAsset(`New ${showAgentWhitePaper.title} Project`, asset);
                            }
                          }}
                        >
                          <FolderPlus size={14} /> Save
                        </button>
                      </div>
                    )}

                    {/* Audio Preview */}
                    {agentCreations[showAgentWhitePaper.key].audio && (
                      <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.3)', gridColumn: 'span 1' }}>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(6, 182, 212, 1)', marginBottom: '8px', fontWeight: '600' }}>🎵 Audio</p>
                        <audio 
                          src={agentCreations[showAgentWhitePaper.key].audio}
                          controls
                          style={{ width: '100%', height: '32px' }}
                          controlsList="nodownload"
                        />
                        <button 
                          className="btn-pill primary" 
                          style={{ width: '100%', marginTop: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
                          onClick={() => {
                            const asset = {
                              id: String(Date.now()),
                              title: `${showAgentWhitePaper.title} Audio`,
                              type: 'Audio',
                              agent: showAgentWhitePaper.title,
                              date: 'Just now',
                              color: 'agent-cyan',
                              snippet: 'Generated Audio',
                              audioUrl: agentCreations[showAgentWhitePaper.key].audio
                            };
                            if (selectedProject) {
                              handleSaveAssetToProject(selectedProject.id, asset);
                              toast.success(`Saved to ${selectedProject.name}`);
                            } else {
                              handleCreateProjectWithAsset(`New ${showAgentWhitePaper.title} Project`, asset);
                            }
                          }}
                        >
                          <FolderPlus size={14} /> Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button 
                className="cta-button-premium"
                onClick={() => {
                  const agent = AGENTS.find(a => a.id === showAgentWhitePaper.key);
                  if (agent) {
                    setSelectedAgent(agent);
                    setShowAgentWhitePaper(null);
                    setActiveTab('agents'); // Or wherever the agent view is
                  }
                }}
              >
                Launch Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal & Business Resource Content Modal */}
      {showResourceContent && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowResourceContent(null)} style={{ zIndex: 2000 }}>
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '800px', 
              width: '95%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ 
                  width: '44px', height: '44px', borderRadius: '12px', 
                  background: 'var(--color-bg-secondary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-purple)'
                }}>
                  <showResourceContent.icon size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{showResourceContent.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{showResourceContent.type}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowResourceContent(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              <div 
                style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  lineHeight: '1.7',
                  color: 'var(--text-primary)'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: showResourceContent.content
                    .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.5rem; margin: 1.5rem 0 1rem; color: var(--text-primary);">$1</h1>')
                    .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.2rem; margin: 1.25rem 0 0.75rem; color: var(--color-cyan);">$1</h2>')
                    .replace(/^### (.*$)/gm, '<h3 style="font-size: 1rem; margin: 1rem 0 0.5rem; color: var(--color-purple);">$1</h3>')
                    .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
                    .replace(/^- (.*$)/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.25rem;">$1</li>')
                    .replace(/^\d+\. (.*$)/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.25rem;">$1</li>')
                    .replace(/\n\n/g, '<br/><br/>')
                }}
              />
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
              <button 
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(showResourceContent.content);
                  toast.success('Copied to clipboard!');
                }}
              >
                Copy Text
              </button>
              <button 
                className="cta-button-premium"
                onClick={() => setShowResourceContent(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Preview Modal - Enhanced with Navigation */}
      {showPreview && (
        <div 
          className="modal-overlay animate-fadeIn" 
          onClick={() => setShowPreview(null)} 
          style={{ 
            zIndex: 2000,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {/* Navigation Arrows */}
          {showPreview.assets && showPreview.assets.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = showPreview.currentIndex > 0 
                    ? showPreview.currentIndex - 1 
                    : showPreview.assets.length - 1;
                  const newAsset = showPreview.assets[newIndex];
                  if (!newAsset) return; // Safety check
                  setShowPreview({
                    type: newAsset.audioUrl ? 'audio' : newAsset.videoUrl ? 'video' : 'image',
                    url: newAsset.audioUrl || newAsset.videoUrl || newAsset.imageUrl,
                    title: newAsset.title || 'Untitled',
                    asset: newAsset,
                    assets: showPreview.assets,
                    currentIndex: newIndex
                  });
                }}
                style={{
                  position: 'fixed',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  backdropFilter: 'blur(8px)',
                  zIndex: 2001,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <ChevronLeft size={24} />
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = showPreview.currentIndex < showPreview.assets.length - 1 
                    ? showPreview.currentIndex + 1 
                    : 0;
                  const newAsset = showPreview.assets[newIndex];
                  if (!newAsset) return; // Safety check
                  setShowPreview({
                    type: newAsset.audioUrl ? 'audio' : newAsset.videoUrl ? 'video' : 'image',
                    url: newAsset.audioUrl || newAsset.videoUrl || newAsset.imageUrl,
                    title: newAsset.title || 'Untitled',
                    asset: newAsset,
                    assets: showPreview.assets,
                    currentIndex: newIndex
                  });
                }}
                style={{
                  position: 'fixed',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  backdropFilter: 'blur(8px)',
                  zIndex: 2001,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: showPreview.type === 'image' ? '90vw' : '85vw', 
              maxHeight: '85vh',
              width: showPreview.type === 'image' ? 'auto' : '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(10,10,15,0.99)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header */}
            <div className="modal-header" style={{ 
              borderBottom: '1px solid rgba(255,255,255,0.1)', 
              padding: '1rem 1.5rem', 
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: showPreview.type === 'image' ? 'rgba(236, 72, 153, 0.2)' 
                    : showPreview.type === 'video' ? 'rgba(6, 182, 212, 0.2)' 
                    : 'rgba(168, 85, 247, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {showPreview.type === 'image' && <Image size={18} style={{ color: 'var(--color-pink)' }} />}
                  {showPreview.type === 'video' && <Video size={18} style={{ color: 'var(--color-cyan)' }} />}
                  {showPreview.type === 'audio' && <Music size={18} style={{ color: 'var(--color-purple)' }} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: '600' }}>{showPreview.title}</h2>
                  {showPreview.assets && showPreview.assets.length > 1 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                      {showPreview.currentIndex + 1} of {showPreview.assets.length} assets
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Use in Orchestrator Button */}
                {showPreview.asset && (
                  <button
                    onClick={() => {
                      // Add asset to orchestrator session
                      const asset = showPreview.asset;
                      const slotType = asset.audioUrl ? 'audio' : asset.videoUrl ? 'visual' : asset.imageUrl ? 'visual' : null;
                      if (slotType && selectedProject) {
                        const newSession = {
                          ...(selectedProject.sessionState || {}),
                          [slotType]: asset
                        };
                        setSelectedProject({
                          ...selectedProject,
                          sessionState: newSession
                        });
                        setProjects(prev => prev.map(p => p.id === selectedProject.id ? {...p, sessionState: newSession} : p));
                        setShowPreview(null);
                        setShowOrchestrator(true);
                        toast.success(`✨ Added "${asset.title}" to Studio Orchestrator`);
                      }
                    }}
                    className="btn-pill primary"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontSize: '0.85rem',
                      padding: '8px 16px'
                    }}
                  >
                    <Zap size={16} />
                    Use in Orchestrator
                  </button>
                )}
                <button className="modal-close" onClick={() => setShowPreview(null)} style={{ 
                  color: '#fff',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer'
                }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="modal-body" style={{ 
              padding: '1.5rem', 
              flex: 1, 
              overflow: 'auto', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: showPreview.type === 'image' ? 'transparent' : 'rgba(0,0,0,0.3)'
            }}>
              {showPreview.type === 'audio' && (
                <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)'
                  }}>
                    <Music size={48} style={{ color: 'white' }} />
                  </div>
                  <audio 
                    ref={previewAudioRef}
                    key={showPreview.asset?.id || showPreview.url}
                    src={showPreview.url}
                    controls
                    style={{ width: '100%' }}
                    autoPlay
                    controlsList="nodownload"
                    onError={(e) => console.error('[AudioPreview] Error:', e.target.error?.message || 'Unknown error', 'URL:', showPreview.url?.substring(0, 50))}
                    onCanPlay={() => console.log('[AudioPreview] Audio can play')}
                    onLoadedData={() => console.log('[AudioPreview] Audio loaded, duration:', previewAudioRef.current?.duration)}
                    onPlay={() => console.log('[AudioPreview] Audio started playing')}
                    onPause={(e) => console.log('[AudioPreview] Audio paused at', e.target.currentTime, 'seconds, ended:', e.target.ended)}
                    onEnded={() => console.log('[AudioPreview] Audio ended naturally')}
                    onStalled={() => console.log('[AudioPreview] Audio stalled - network issue')}
                    onWaiting={() => console.log('[AudioPreview] Audio waiting for data')}
                  />
                  {/* Show URL type for debugging */}
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '12px', opacity: 0.6 }}>
                    {showPreview.url?.startsWith('data:') ? 'Base64 Audio' : showPreview.url?.startsWith('http') ? 'Remote Audio' : 'Unknown Format'}
                  </p>
                </div>
              )}
              {showPreview.type === 'image' && (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Loading state */}
                  <div 
                    className="image-loading-placeholder" 
                    style={{ 
                      position: 'absolute',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <div className="spinner" style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(255,255,255,0.1)',
                      borderTopColor: 'var(--color-purple)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: '0.85rem' }}>Loading image...</span>
                  </div>
                  <img 
                    src={showPreview.url}
                    alt={showPreview.title}
                    onLoad={(e) => {
                      // Hide loading placeholder when loaded
                      const placeholder = e.target.previousElementSibling;
                      if (placeholder) placeholder.style.display = 'none';
                      e.target.style.opacity = 1;
                    }}
                    onError={(e) => {
                      console.error('[ImagePreview] Failed to load:', showPreview.url?.substring(0, 50));
                      const placeholder = e.target.previousElementSibling;
                      if (placeholder) {
                        placeholder.innerHTML = '<div style="text-align:center;color:var(--color-red)"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><p style="margin-top:8px">Failed to load image</p></div>';
                      }
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '80vh', 
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease'
                    }}
                  />
                </div>
              )}
              {showPreview.type === 'video' && (
                <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
                  {/* Loading state for video */}
                  <div 
                    className="video-loading-placeholder" 
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      color: 'var(--text-secondary)',
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '8px',
                      zIndex: 1
                    }}
                  >
                    <div className="spinner" style={{
                      width: '50px',
                      height: '50px',
                      border: '3px solid rgba(255,255,255,0.1)',
                      borderTopColor: 'var(--color-cyan)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: '0.85rem' }}>Loading video...</span>
                  </div>
                  <video 
                    src={showPreview.url}
                    controls
                    autoPlay
                    playsInline
                    loop
                    onCanPlay={(e) => {
                      // Hide loading placeholder when video can play
                      const placeholder = e.target.previousElementSibling;
                      if (placeholder) placeholder.style.display = 'none';
                    }}
                    onError={(e) => {
                      console.error('[VideoPreview] Failed to load:', showPreview.url?.substring(0, 50));
                      const placeholder = e.target.previousElementSibling;
                      if (placeholder) {
                        placeholder.innerHTML = '<div style="text-align:center;color:var(--color-red)"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><p style="margin-top:12px;font-size:0.9rem">Failed to load video</p><p style="font-size:0.75rem;opacity:0.7;margin-top:4px">Try downloading instead</p></div>';
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      maxWidth: '100%', 
                      maxHeight: '80vh', 
                      objectFit: 'contain',
                      borderRadius: '8px',
                      background: 'black'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Thumbnail Strip - for navigation between assets */}
            {showPreview.assets && showPreview.assets.length > 1 && (
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                padding: '12px 16px',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)'
              }}>
                {showPreview.assets.map((asset, idx) => {
                  if (!asset) return null; // Safety check
                  return (
                  <button
                    key={asset?.id || idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPreview({
                        type: asset.audioUrl ? 'audio' : asset.videoUrl ? 'video' : 'image',
                        url: asset.audioUrl || asset.videoUrl || asset.imageUrl,
                        title: asset.title || 'Untitled',
                        asset: asset,
                        assets: showPreview.assets,
                        currentIndex: idx
                      });
                    }}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      border: idx === showPreview.currentIndex 
                        ? '2px solid var(--color-purple)' 
                        : '2px solid transparent',
                      background: asset.imageUrl 
                        ? `url(${asset.imageUrl}) center/cover`
                        : 'rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: idx === showPreview.currentIndex ? 1 : 0.6,
                      transition: 'all 0.2s ease',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {/* Video thumbnail with frame */}
                    {asset.videoUrl && !asset.imageUrl && (
                      <video 
                        src={asset.videoUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                        preload="metadata"
                        onLoadedData={(e) => {
                          if (e.target.currentTime === 0) e.target.currentTime = 1;
                        }}
                      />
                    )}
                    {/* Audio icon */}
                    {asset.audioUrl && !asset.imageUrl && (
                      <Music size={20} style={{ color: 'var(--color-purple)' }} />
                    )}
                    {/* Text file icon */}
                    {!asset.imageUrl && !asset.videoUrl && !asset.audioUrl && (
                      <FileText size={20} style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </button>
                  );
                })}
              </div>
            )}

            {/* Action Buttons Footer */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              padding: '12px 16px',
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              background: 'rgba(0,0,0,0.4)'
            }}>
              {/* Re-run Agent Button */}
              {showPreview.asset?.agent && showPreview.asset.agent !== 'User Upload' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const agent = AGENTS.find(a => a.name === showPreview.asset.agent);
                    if (agent) {
                      setSelectedAgent(agent);
                      setPendingPrompt(showPreview.asset.snippet || showPreview.title || '');
                      setActiveTab('agents');
                      setShowPreview(null);
                      toast.success(`Opened ${agent.name} - edit prompt and regenerate!`);
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--color-cyan), var(--color-purple))',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}
                >
                  <RefreshCw size={16} /> Re-run with {showPreview.asset?.agent}
                </button>
              )}

              {/* Use in Orchestrator Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Pass asset to orchestrator via sessionState
                  if (selectedProject) {
                    const asset = showPreview.asset;
                    const updated = {
                      ...selectedProject,
                      sessionState: {
                        ...selectedProject.sessionState,
                        ...(asset?.audioUrl && { audio: { audioUrl: asset.audioUrl, title: asset.title } }),
                        ...(asset?.imageUrl && { visual: { ...selectedProject.sessionState?.visual, imageUrl: asset.imageUrl, title: asset.title } }),
                        ...(asset?.videoUrl && { visual: { ...selectedProject.sessionState?.visual, videoUrl: asset.videoUrl, title: asset.title } })
                      }
                    };
                    setSelectedProject(updated);
                    setProjects(projects.map(p => p.id === updated.id ? updated : p));
                  }
                  setShowPreview(null);
                  setShowOrchestrator(true);
                  toast.success('Asset loaded into Orchestrator!');
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(168, 85, 247, 0.5)',
                  background: 'rgba(168, 85, 247, 0.2)',
                  color: 'var(--color-purple)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <Sparkles size={16} /> Use in Orchestrator
              </button>

              {/* Download Button (for media) */}
              {showPreview.url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement('a');
                    link.href = showPreview.url;
                    link.download = showPreview.title || 'download';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('Download started!');
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.85rem'
                  }}
                >
                  <Download size={16} /> Download
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Agent Help / Get Started Modal */}
      {showAgentHelpModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowAgentHelpModal(null)}>
          <div className="modal-content agent-help-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className={`agent-mini-icon ${showAgentHelpModal.colorClass}`}>
                  <showAgentHelpModal.icon size={20} />
                </div>
                <h2>{showAgentHelpModal.name} Guide</h2>
              </div>
              <button className="modal-close" onClick={() => setShowAgentHelpModal(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body help-modal-body">
              <div className="help-section">
                <h3><Zap size={16} className="text-cyan" /> How to Use</h3>
                <p>{showAgentHelpModal.howToUse}</p>
              </div>

              {showAgentHelpModal.onboarding && (
                <div className="help-section">
                  <h3><Rocket size={16} className="text-purple" /> Quick Start Steps</h3>
                  <div className="onboarding-steps-list">
                    {showAgentHelpModal.onboarding.map((step, idx) => (
                      <div key={idx} className="onboarding-step-item">
                        <span className="step-number">{idx + 1}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showAgentHelpModal.examples && (
                <div className="help-section">
                  <h3><Sparkles size={16} className="text-orange" /> Example Prompts</h3>
                  <div className="example-chips">
                    {showAgentHelpModal.examples.map((ex, idx) => (
                      <button key={idx} className="example-chip" onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(ex);
                        handleTextToVoice("Copied to clipboard");
                      }}>
                        "{ex}"
                      </button>
                    ))}
                  </div>
                  <p className="tiny-hint">Click an example to copy</p>
                </div>
              )}

              {showAgentHelpModal.helpTips && (
                <div className="help-section pro-tip-box">
                  <h3><Crown size={16} className="text-yellow" /> Pro Tip</h3>
                  <p>{showAgentHelpModal.helpTips}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cta-button-premium" onClick={() => {
                setSelectedAgent(showAgentHelpModal);
                setShowAgentHelpModal(null);
              }}>
                Launch {showAgentHelpModal.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Workflow Modal - Streamlined agent interaction */}
      {quickWorkflowAgent && (
        <Suspense fallback={<LazyFallback />}>
          <QuickWorkflow
            agent={quickWorkflowAgent}
            onClose={() => setQuickWorkflowAgent(null)}
            projects={projects}
            onSaveToProject={handleSaveAssetToProject}
            onCreateProject={handleCreateProjectWithAsset}
            user={user}
          />
        </Suspense>
      )}

      {/* Add Agent Modal - Uses same styling as Agents page */}
      {showAddAgentModal && (
        <div className="modal-overlay animate-fadeIn" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }} onClick={() => setShowAddAgentModal(false)}>
          <div className="modal-content" style={{ maxWidth: 'min(92vw, 700px)', width: '100%', margin: '1rem auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UsersIcon size={20} className="text-purple" />
                Add Agent to Project
              </h2>
              <button className="modal-close" onClick={() => setShowAddAgentModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              {/* Available Agents */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                  Your Agents ({getAvailableAgents().length})
                </h3>
                <div className="agents-studio-grid" style={{ maxWidth: '100%', margin: 0 }}>
                  {getAvailableAgents().map((agent, i) => {
                    const Icon = agent.icon;
                    const isAlreadyAdded = selectedProject?.agents?.some(a => a.id === agent.id);
                    return (
                      <div 
                        key={agent.id} 
                        className={`agent-studio-card ${agent.colorClass} ${isAlreadyAdded ? 'opacity-50' : ''}`}
                        style={{ 
                          animationDelay: `${i * 0.05}s`, 
                          position: 'relative',
                          cursor: isAlreadyAdded ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => !isAlreadyAdded && handleAddAgent(agent)}
                      >
                        {isAlreadyAdded && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'var(--color-purple)',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Check size={12} color="white" />
                          </div>
                        )}
                        <div className="agent-studio-icon">
                          <Icon size={24} />
                        </div>
                        <div className="agent-studio-info">
                          <h3>{agent.name}</h3>
                          <p>{agent.category}</p>
                        </div>
                        <button 
                          className="agent-launch-btn"
                          disabled={isAlreadyAdded}
                          style={{ 
                            opacity: isAlreadyAdded ? 0.5 : 1,
                            pointerEvents: isAlreadyAdded ? 'none' : 'auto'
                          }}
                        >
                          {isAlreadyAdded ? 'Added' : 'Add to Project'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Locked Agents */}
              {getLockedAgents().length > 0 && (
                <div>
                  <h3 style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    marginBottom: '12px', 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Lock size={14} />
                    Upgrade to Unlock ({getLockedAgents().length})
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px'
                  }}>
                    {getLockedAgents().map((agent) => {
                      const Icon = agent.icon;
                      const tierLabel = agent.tier === 'monthly' ? 'Monthly' : 'Pro';
                      const tierColor = agent.tier === 'monthly' ? 'var(--color-cyan)' : 'var(--color-purple)';
                      
                      return (
                        <div 
                          key={agent.id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            opacity: 0.6,
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setShowAddAgentModal(false);
                            if (!isLoggedIn) {
                              setShowLoginModal(true);
                            } else {
                              setDashboardTab('subscription');
                              setActiveTab('mystudio');
                            }
                          }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Icon size={16} style={{ opacity: 0.5 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              fontSize: '0.85rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {agent.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.65rem', 
                              color: tierColor,
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              {tierLabel}
                            </div>
                          </div>
                          <Lock size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Command Palette Modal (Whisperer-style) */}
      {showVoiceCommandPalette && (
        <div className="modal-overlay animate-fadeIn" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }} onClick={() => setShowVoiceCommandPalette(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 'min(92vw, 520px)', width: '100%', margin: '1rem auto' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mic size={20} className="text-purple" />
                Voice Commands
              </h2>
              <button className="modal-close" onClick={() => setShowVoiceCommandPalette(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'left', padding: '16px 24px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Click the mic button and say any of these commands:
              </p>
              
              {['Navigation', 'Actions', 'Settings', 'Voice'].map(category => (
                <div key={category} style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-purple)', marginBottom: '8px' }}>
                    {category}
                  </h4>
                  {VOICE_COMMANDS.filter(c => c.category === category).map((cmd, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      marginBottom: '6px',
                      fontSize: '0.85rem'
                    }}>
                      <div>
                        <span style={{ fontWeight: '600', color: 'white' }}>{cmd.command}</span>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '0.75rem' }}>{cmd.description}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-cyan)', fontStyle: 'italic' }}>{cmd.example}</span>
                    </div>
                  ))}
                </div>
              ))}
              
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  💡 <strong style={{ color: 'white' }}>Pro Tip:</strong> Say anything else and it will be added to your prompt as dictation.
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '16px 24px' }}>
              <button 
                className={`cta-button-premium ${isListening ? 'listening' : ''}`}
                onClick={() => {
                  setShowVoiceCommandPalette(false);
                  handleVoiceToText();
                }}
                style={{ width: '100%' }}
              >
                <Mic size={18} />
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Voice Indicator (Whisperer-style) */}
      {isListening && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {/* Real-time transcript */}
          {voiceTranscript && (
            <div style={{
              background: 'rgba(0,0,0,0.9)',
              padding: '12px 20px',
              borderRadius: '12px',
              color: 'white',
              fontSize: '0.9rem',
              maxWidth: '300px',
              textAlign: 'center',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              <span style={{ color: 'var(--color-cyan)' }}>"{voiceTranscript}"</span>
            </div>
          )}
          
          {/* Listening indicator */}
          <div style={{
            background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
            padding: '16px 24px',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            cursor: 'pointer'
          }} onClick={handleVoiceToText}>
            {/* Animated pulse rings */}
            <div style={{ position: 'relative', width: '24px', height: '24px' }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'white',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <Mic size={24} style={{ position: 'relative', zIndex: 1, color: 'var(--color-purple)' }} />
            </div>
            <span style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
              Listening...
            </span>
            <button 
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleVoiceToText(); // Stop listening
              }}
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Last command feedback */}
          {lastVoiceCommand && (
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              marginTop: '4px'
            }}>
              Last: "{lastVoiceCommand.text.substring(0, 25)}{lastVoiceCommand.text.length > 25 ? '...' : ''}"
            </div>
          )}
        </div>
      )}

      {/* Audio Export/Mastering Modal */}
      {showExportModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowExportModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ 
            maxWidth: 'min(95vw, 500px)', 
            width: '100%',
            margin: '2rem auto'
          }}>
            <button className="modal-close" onClick={() => setShowExportModal(null)}><X size={20} /></button>
            
            <div style={{ padding: '24px' }}>
              <h2 style={{ 
                fontSize: '1.4rem', 
                fontWeight: '700', 
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'white'
              }}>
                <Volume2 className="text-cyan" size={24} />
                Export for Distribution
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                Prepare your audio for streaming platforms and digital distribution.
              </p>

              {/* Preset Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  EXPORT PRESET
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'streaming', label: 'Streaming', desc: 'Spotify, Apple Music', specs: '44.1kHz / 16-bit / -14 LUFS' },
                    { id: 'youtube', label: 'YouTube', desc: 'Video platforms', specs: '48kHz / 16-bit / -14 LUFS' },
                    { id: 'cd', label: 'CD Quality', desc: 'Physical release', specs: '44.1kHz / 16-bit / -9 LUFS' },
                    { id: 'hires', label: 'Hi-Res', desc: 'Audiophile', specs: '96kHz / 24-bit / -14 LUFS' },
                    { id: 'podcast', label: 'Podcast', desc: 'Spoken word', specs: '44.1kHz / 16-bit / -16 LUFS' }
                  ].map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => setExportPreset(preset.id)}
                      style={{
                        padding: '12px',
                        background: exportPreset === preset.id 
                          ? 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))' 
                          : 'rgba(255,255,255,0.05)',
                        border: exportPreset === preset.id 
                          ? '1px solid var(--color-purple)' 
                          : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem' }}>{preset.label}</div>
                      <div style={{ fontSize: '0.7rem', color: exportPreset === preset.id ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>{preset.desc}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-cyan)', marginTop: '4px' }}>{preset.specs}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Compatibility */}
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '10px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  PLATFORM COMPATIBILITY
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Apple Music', 'Spotify', 'YouTube Music', 'Amazon Music', 'Tidal', 'Deezer'].map(platform => (
                    <span key={platform} style={{
                      padding: '4px 10px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Check size={12} /> {platform}
                    </span>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={async () => {
                  if (!showExportModal?.audioUrl) {
                    toast.error('No audio to export');
                    return;
                  }
                  
                  setIsExporting(true);
                  const exportToast = toast.loading('Mastering audio...');
                  
                  try {
                    // Extract base64 from data URL
                    const base64 = showExportModal.audioUrl.split(',')[1];
                    
                    const response = await fetch(`${BACKEND_URL}/api/master-audio`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        audioBase64: base64,
                        preset: exportPreset
                      })
                    });
                    
                    const data = await response.json();
                    
                    if (data.audioUrl) {
                      // Download the mastered file
                      const link = document.createElement('a');
                      link.href = data.audioUrl;
                      link.download = `${showExportModal.title || 'audio'}-mastered-${exportPreset}.wav`;
                      link.click();
                      
                      toast.success(`Exported for ${exportPreset}!`, { id: exportToast });
                      setShowExportModal(null);
                    } else {
                      throw new Error(data.error || 'Export failed');
                    }
                  } catch (err) {
                    console.error('Export error:', err);
                    toast.error('Export failed: ' + err.message, { id: exportToast });
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: isExporting 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isExporting ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Mastering...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export & Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudioView;
