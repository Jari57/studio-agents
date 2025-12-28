import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, Zap, Music, PlayCircle, Target, Users, Rocket, Shield, Globe, Folder, Book, Cloud, Search, Filter, Download, Share2, CircleHelp, MessageSquare, Play, Pause, Volume2, Maximize, Home, ArrowLeft, Mic, Save, Lock, CheckCircle, Award, Settings, Languages, CreditCard, HardDrive, Database, BarChart3, PieChart, Twitter, Instagram, Facebook, RefreshCw, Sun, Moon, Trash2, Eye, EyeOff, Plus, Landmark, ArrowRight, ChevronRight, ChevronDown, ChevronUp, X, Bell, Menu, LogOut, User, Crown, LayoutGrid, TrendingUp, Disc, Video, FileAudio as FileMusic, Activity, Film, FileText, Tv, Image, PenTool, PenTool as Tool, Map, ExternalLink, Layout, Feather, Hash, Flame, Image as ImageIcon, Info
} from 'lucide-react';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { auth, db, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from '../firebase';
import { AGENTS, BACKEND_URL } from '../constants';

// --- CONSTANTS FOR ONBOARDING & SUPPORT ---

const onboardingSteps = [
  {
    id: 'welcome',
    title: "Welcome to The Studio",
    content: "This is your creative control room—eight AI agents built to give independent artists the tools that used to require a label deal.",
    detail: "Every agent in The Studio was designed to solve a real problem artists face: finishing lyrics at 3 AM with no co-writer, understanding how A&Rs evaluate demos, finding samples no one else has heard. Take 2 minutes to learn how this works, and you'll get 10x more value out of every session."
  },
  {
    id: 'philosophy',
    title: "How This Works",
    content: "These aren't magic buttons. They're creative partners.",
    detail: "The best artists use AI as a starting point, not an ending point. Generate ideas, get unstuck, explore directions you wouldn't have considered—then make it yours. The goal isn't to create WITH the AI. It's to create FASTER and DEEPER because of it. Your voice stays your voice. The tools just remove the friction."
  },
  {
    id: 'paths',
    title: "What Brings You Here?",
    content: "Choose your path to get personalized recommendations.",
    detail: "Different goals require different tools. Tell us what you're trying to accomplish today, and we'll show you exactly where to start."
  },
  {
    id: 'recommendation',
    title: "Your Recommended Starting Point",
    content: "Based on your goal, here's where to begin.",
    detail: "This recommendation is based on how other artists with similar goals have found success. But remember—all eight agents are available to you. Explore freely."
  },
  {
    id: 'tips',
    title: "Pro Tips for Better Results",
    content: "The more context you give, the better the output.",
    detail: "Be specific about style, mood, and references. If you want something that sounds like early 2000s boom bap, say that. If you want a hook about resilience that doesn't sound cliché, say that. The AI responds to detail. Vague prompts get generic results."
  }
];

const pathOptions = [
  { id: 'write', label: "I need to write", icon: Feather, description: "Lyrics, hooks, verses, songs", recommended: ['ghost'] },
  { id: 'produce', label: "I need production help", icon: Disc, description: "Beats, samples, sounds", recommended: ['beat'] },
  { id: 'grow', label: "I need to grow my audience", icon: Hash, description: "Content, trends, virality", recommended: ['video-creator', 'trend', 'social'] },
  { id: 'compete', label: "I need to sharpen my skills", icon: Flame, description: "Battle, freestyle, punchlines", recommended: ['ghost'] },
  { id: 'brand', label: "I need visual identity", icon: ImageIcon, description: "Album art, aesthetics", recommended: ['album'] },
  { id: 'explore', label: "I just want to explore", icon: Sparkles, description: "Show me everything", recommended: null }
];

const agentDetails = {
  ghost: {
    title: "GHOSTWRITER",
    subtitle: "AI Lyric Engine",
    tagline: "Finish what you started.",
    description: "In the early 2000s, countless verses were lost to crashed hard drives, stolen notebooks, and fading memories. The Ghostwriter was built to resurrect that energy—to help artists who have melodies without words, hooks without verses, ideas without execution. Speak your concept, hum your flow, or type your fragments. The AI completes your thought while preserving your voice. This isn't about replacing creativity—it's about unlocking what's already inside you. Perfect for artists who know what they want to say but can't find the words, or those who need a writing partner at 3 AM when no one else is awake.",
    whoFor: "Artists with unfinished ideas, vocalists who think in melodies, writers fighting creative blocks.",
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
    subtitle: "Artist Development",
    tagline: "See your music through their eyes.",
    description: "A&R executives decide careers. They listen to hundreds of songs daily, looking for that undefinable 'it factor' that separates a demo from a deal. The Release Strategist gives you access to that perspective before you submit. Upload your track and receive analysis on commercial viability, production quality, market positioning, and competitive landscape. Understand how your music stacks up against current releases. Identify your unique selling points and potential weaknesses. This isn't about changing your art to fit the market—it's about understanding the market so you can navigate it strategically.",
    whoFor: "Artists preparing for label meetings, independent releases seeking market fit, managers evaluating talent.",
    howTo: "Describe your track or upload details. Receive a comprehensive analysis with actionable insights."
  },
  album: {
    title: "ALBUM ARTIST",
    subtitle: "Visual Generator",
    tagline: "See what your sound looks like.",
    description: "The cover is the first impression. Before anyone presses play, they see your visual identity—and they make assumptions. Does the art match the music? Does it communicate who you are? In the era of thumbnail scrolling, your album art works overtime. The Album Artist generator transforms your concepts into visual directions. Describe your project's mood, themes, and aesthetic references. Receive AI-generated concepts that capture your vision. Use them as inspiration for final artwork, or as communication tools when briefing designers. Your music has a look—this tool helps you find it before you finalize it.",
    whoFor: "Artists developing visual identity, designers seeking inspiration, anyone releasing music.",
    howTo: "Describe your project's themes, mood, and visual references. Generate concepts to guide your final artwork."
  },
  'video-creator': {
    title: "VIDEO CREATOR",
    subtitle: "Content Generator",
    tagline: "Motion for the feed.",
    description: "Music lives on video platforms now. If you don't have visuals, you don't have a release. Video Creator is your instant content team. Generate visualizers, lyric videos, and promotional clips that match your track's energy. Describe the scene, the movement, the style. Create loops for Spotify Canvas, teasers for TikTok, or full visualizers for YouTube. You don't need a film crew or a budget to have professional visuals. You just need a vision.",
    whoFor: "Artists needing social content, producers showcasing beats, anyone releasing music online.",
    howTo: "Describe the scene and style. Generate video loops and clips to accompany your music."
  },
  trend: {
    title: "TREND HUNTER",
    subtitle: "Market Intelligence",
    tagline: "Ride the wave before it breaks.",
    description: "The music industry moves fast. Trends explode and vanish in days. Trend Hunter gives you the data to move with speed. Analyze what's working right now on TikTok, Spotify, and YouTube. Identify rising sub-genres, viral sounds, and content formats. This isn't about copying—it's about awareness. Know the conversation so you can add your voice to it. Spot the wave early enough to ride it, or understand it well enough to counter it.",
    whoFor: "Artists planning releases, managers looking for opportunities, content creators seeking growth.",
    howTo: "Ask about current trends in your genre. Get data-backed insights on what's working now."
  }
};

function StudioView({ onBack, startWizard, startTour }) {
  // Helper to get tab from hash
  const getTabFromHash = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/studio/')) {
      return hash.split('/')[2];
    }
    return 'mystudio';
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
    }
  };
  
  // Swipe Navigation Hook
  const swipeHandlers = useSwipeNavigation(
    ['agents', 'mystudio', 'activity', 'news', 'resources'],
    activeTab,
    setActiveTab
  );
  const [theme, setTheme] = useState(() => localStorage.getItem('studio_theme') || 'dark');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newsSearch, setNewsSearch] = useState('');
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_projects');
      if (saved) return JSON.parse(saved);
      
      // Default Demo Project for new users (Seamless Onboarding)
      return [{
        id: 'demo-1',
        name: 'Neon Nights (Demo)',
        category: 'Music Video',
        description: 'A synthwave track with futuristic visuals. Use this project to test the Orchestration features.',
        agents: ['beat', 'video-creator'],
        status: 'Active',
        date: new Date().toLocaleDateString(),
        assets: [
          {
            id: 'demo-beat',
            title: 'Synthwave Beat',
            type: 'Audio',
            agent: 'Beat Architect',
            date: 'Just now',
            color: 'agent-cyan',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
            snippet: '120 BPM, Key of Am'
          },
          {
            id: 'demo-visual',
            title: 'Neon City Loop',
            type: 'Video',
            agent: 'Veo Video',
            date: 'Just now',
            color: 'agent-pink',
            videoUrl: 'https://cdn.pixabay.com/video/2023/10/26/186639-878455663_large.mp4',
            snippet: 'Cyberpunk city flyover'
          }
        ]
      }];
    } catch (e) {
      return [];
    }
  });

  // Persist projects
  useEffect(() => {
    localStorage.setItem('studio_projects', JSON.stringify(projects));
  }, [projects]);
  
  // Studio Session State (Global Mechanism)
  const [showStudioSession, setShowStudioSession] = useState(false);
  const [sessionTracks, setSessionTracks] = useState({ audio: null, vocal: null, visual: null });
  const [sessionPlaying, setSessionPlaying] = useState(false);
  
  const [expandedNews, setExpandedNews] = useState(new Set());
  const [allNewsExpanded, setAllNewsExpanded] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState(null);
  const [helpSearch, setHelpSearch] = useState('');
  const [showNudge, setShowNudge] = useState(true);
  const [hubFilter, setHubFilter] = useState('All');
  const [playingItem, setPlayingItem] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    gender: 'female',
    region: 'US',
    language: 'English'
  });
  const [showExternalSaveModal, setShowExternalSaveModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [user, setUser] = useState(null);
  const [showAgentHelpModal, setShowAgentHelpModal] = useState(null); // Stores the agent object for the help modal
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => startTour || (!startWizard && !localStorage.getItem('studio_welcome_seen')));
  const [expandedWelcomeFeature, setExpandedWelcomeFeature] = useState(null);
  const [autoStartVoice, setAutoStartVoice] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Onboarding & Help State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedPath, setSelectedPath] = useState(null);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showAgentWhitePaper, setShowAgentWhitePaper] = useState(null);

  // Get recommendation based on selected path
  const getRecommendation = () => {
    if (!selectedPath) return null;
    const path = pathOptions.find(p => p.id === selectedPath);
    if (!path || !path.recommended) return null;
    return path.recommended[0]; // Primary recommendation
  };

  // Check for first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('studio_onboarding_v2');
    if (!hasSeenOnboarding && !startWizard) {
      setShowOnboarding(true);
    }
  }, [startWizard]);

  const completeOnboarding = () => {
    localStorage.setItem('studio_onboarding_v2', 'true');
    setShowOnboarding(false);
    // If they selected a path, maybe guide them there?
    if (selectedPath) {
      const rec = getRecommendation();
      if (rec) {
        // Find the agent object
        const agent = AGENTS.find(a => a.id === rec);
        if (agent) {
          setSelectedAgent(agent);
        }
      }
    }
  };

  // Project Wizard State
  const [showProjectWizard, setShowProjectWizard] = useState(startWizard || false);
  const [projectWizardStep, setProjectWizardStep] = useState(1);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    category: '',
    description: '',
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

  const handleCreateProject = () => {
    if (!newProjectData.name || !newProjectData.category) return;
    
    const newProject = {
      id: Date.now(),
      name: newProjectData.name,
      category: newProjectData.category,
      description: newProjectData.description,
      agents: newProjectData.selectedAgents,
      workflow: newProjectData.workflow || 'custom',
      socialHandle: newProjectData.socialHandle,
      socialBio: newProjectData.socialBio,
      socialPlatform: newProjectData.socialPlatform,
      date: new Date().toLocaleDateString(),
      status: 'Active',
      progress: 0,
      assets: [], // Store generated content here
      context: {} // Shared context for MAS
    };

    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject); // Auto-select the new project
    setShowProjectWizard(false);
    setProjectWizardStep(1);
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

  // --- FIREBASE AUTH LISTENER ---
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setIsLoggedIn(true);
          setUser(currentUser);
          localStorage.setItem('studio_user_id', currentUser.uid);
        } else {
          setIsLoggedIn(false);
          setUser(null);
          localStorage.removeItem('studio_user_id');
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // --- LOGIN HANDLER ---
  const handleLogin = async () => {
    if (!auth) {
      // Fallback for demo/dev mode without Firebase
      setIsLoggedIn(true);
      setShowLoginModal(false);
      let uid = localStorage.getItem('studio_user_id');
      if (!uid) {
        uid = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('studio_user_id', uid);
      }
      if (selectedPlan) {
        handleTextToVoice(`Welcome to the ${selectedPlan.name}. Your subscription is active.`);
        alert(`Subscription Confirmed: ${selectedPlan.name}\nPrice: ${selectedPlan.price}\n\nWelcome to the Pro Team!`);
        setSelectedPlan(null);
        setActiveTab('mystudio');
      }
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowLoginModal(false);
      if (selectedPlan) {
        handleTextToVoice(`Welcome to the ${selectedPlan.name}. Your subscription is active.`);
        alert(`Subscription Confirmed: ${selectedPlan.name}\nPrice: ${selectedPlan.price}\n\nWelcome to the Pro Team!`);
        setSelectedPlan(null);
        setActiveTab('mystudio');
      }
    } catch (error) {
      console.error("Login failed", error);
      alert(`Login failed: ${error.message}`);
    }
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setIsLoggedIn(false);
    localStorage.removeItem('studio_user_id');
    setActiveTab('landing'); 
    onBack(); 
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

  // News Pagination State
  const [newsPage, setNewsPage] = useState(1);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [newsArticles, setNewsArticles] = useState([]);

  const [socialConnections, setSocialConnections] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_agents_socials');
      return saved ? JSON.parse(saved) : {
        instagram: false,
        tiktok: false,
        twitter: false,
        spotify: false
      };
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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

  const addNotification = (title, message) => {
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
      alert(`Successfully connected to X/Twitter as @${username}!`);
    }

    // Meta Callback (Insta/FB)
    if (params.get('meta_connected') === 'true') {
      const name = params.get('meta_name');
      setSocialConnections(prev => ({ ...prev, instagram: true, facebook: true }));
      setMetaName(name);
      
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      alert(`Successfully connected to Meta (Instagram & Facebook) as ${name}!`);
    }
  }, []);

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    setShowLoginModal(true);
  };

  // --- PROFESSIONAL VOICE & TRANSLATION LOGIC ---
  
  const recognitionRef = useRef(null);

  const handleVoiceToText = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceSettings.language === 'English' ? 'en-US' : 
                      voiceSettings.language === 'Spanish' ? 'es-ES' :
                      voiceSettings.language === 'French' ? 'fr-FR' :
                      voiceSettings.language === 'German' ? 'de-DE' :
                      voiceSettings.language === 'Japanese' ? 'ja-JP' : 'en-US';
    
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      
      // --- GLOBAL VOICE COMMANDS ---
      if (transcript.includes('open') || transcript.includes('launch')) {
        const agentName = transcript.replace('open', '').replace('launch', '').trim();
        const foundAgent = AGENTS.find(a => a.name.toLowerCase().includes(agentName));
        if (foundAgent) {
          setSelectedAgent(foundAgent);
          setActiveTab('agents');
          handleTextToVoice(`Launching ${foundAgent.name} for you.`);
          return;
        }
      }

      if (transcript.includes('go to') || transcript.includes('show me')) {
        if (transcript.includes('dashboard') || transcript.includes('studio')) {
          setActiveTab('mystudio');
          handleTextToVoice("Navigating to your dashboard.");
        }
        if (transcript.includes('hub')) {
          setActiveTab('hub');
          handleTextToVoice("Opening the Project Hub.");
        }
        if (transcript.includes('news')) {
          setActiveTab('news');
          handleTextToVoice("Checking the latest industry news.");
        }
        if (transcript.includes('help')) {
          setActiveTab('support');
          handleTextToVoice("How can I help you today?");
        }
        if (transcript.includes('agents')) {
          setActiveTab('agents');
          handleTextToVoice("Viewing all available agents.");
        }
        return;
      }

      if (transcript.includes('switch theme') || transcript.includes('toggle theme') || transcript.includes('light mode') || transcript.includes('dark mode')) {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('studio_theme', newTheme);
        handleTextToVoice(`Switching to ${newTheme} mode.`);
        return;
      }

      if (transcript.includes('add payment') || transcript.includes('billing') || transcript.includes('manage card')) {
        setActiveTab('mystudio');
        setShowAddPaymentModal(true);
        handleTextToVoice("Opening the payment management portal.");
        return;
      }

      // Default: Append to textarea
      const textarea = document.querySelector('.studio-textarea');
      if (textarea) {
        textarea.value = (textarea.value + ' ' + transcript).trim();
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
    const textToSpeak = (typeof textInput === 'string') ? textInput : document.querySelector('.studio-textarea')?.value;
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

  const handleEditPayment = (item, type) => {
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
        alert('Please enter a valid card number');
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

  const handleProviderClick = (provider) => {
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
    const textarea = document.querySelector('.studio-textarea');
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
        alert(`Prompt translated to English for better AI results!`);
      }
    } catch (error) {
      console.error("Translation failed", error);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    const textarea = document.querySelector('.studio-textarea');
    if (!textarea || !textarea.value) {
      alert("Please enter a prompt first.");
      return;
    }

    setIsGenerating(true);
    
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
        systemInstruction: `You are ${selectedAgent.name}, a professional AI agent in a high-end music studio. 
          Category: ${selectedAgent.category}. 
          Capabilities: ${selectedAgent.capabilities.join(', ')}.
          ${selectedAgent.explanation}`
      };

      // Route to specific endpoints for Image/Video agents
      if (selectedAgent.id === 'album') {
        endpoint = '/api/generate-image';
        body = { prompt };
      } else if (selectedAgent.id === 'video-creator') {
        endpoint = '/api/generate-video';
        body = { prompt };
      }

      // Call Backend
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      // Handle different response types
      let newItem = {
        id: Date.now(),
        title: `${selectedAgent.name} Result`,
        type: selectedAgent.category,
        agent: selectedAgent.name,
        date: 'Just now',
        color: selectedAgent.colorClass,
        snippet: prompt // Default snippet is the prompt
      };

      if (selectedAgent.id === 'album' && (data.predictions || data.images)) {
        // Handle Image Response (Imagen)
        // API might return predictions[0].bytesBase64Encoded OR images[0]
        const base64Image = data.predictions?.[0]?.bytesBase64Encoded || data.images?.[0];
        if (base64Image) {
            newItem.imageUrl = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
            newItem.snippet = `Generated artwork for: "${prompt}"`;
        }
      } else if (selectedAgent.id === 'video-creator' && (data.predictions || data.video)) {
        // Handle Video Response (Veo)
        const videoData = data.predictions?.[0] || data.video;
        if (videoData) {
            if (videoData.bytesBase64Encoded) {
                 newItem.videoUrl = `data:video/mp4;base64,${videoData.bytesBase64Encoded}`;
            } else if (videoData.videoUri) {
                 newItem.videoUrl = videoData.videoUri;
            }
            newItem.snippet = `Generated video for: "${prompt}"`;
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
      } else {
        // Fallback or Error
        if (data.error) throw new Error(data.error);
        // If we got here but no specific data, maybe it's a raw text response?
        // But we expect JSON.
        throw new Error("Unknown response format from AI");
      }

      setProjects([newItem, ...projects]);

      // If we are working inside a project context, add this artifact to the project assets
      if (selectedProject) {
        const updatedProject = {
          ...selectedProject,
          assets: [newItem, ...(selectedProject.assets || [])]
        };
        setSelectedProject(updatedProject);
        // Update the project in the global list as well
        setProjects(prev => [newItem, ...prev.map(p => p.id === updatedProject.id ? updatedProject : p)]);
      }

      // Save to Backend if logged in
      if (isLoggedIn) {
        const uid = localStorage.getItem('studio_user_id');
        if (uid) {
           fetch(`${BACKEND_URL}/api/projects`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ userId: uid, project: newItem })
           }).catch(err => console.error("Failed to save to cloud", err));
        }
      }

      alert(`${selectedAgent.name} generation complete! Check your Hub.`);
      setActiveTab('hub');
      setSelectedAgent(null);

    } catch (error) {
      console.error("Generation error", error);
      alert(`Error: ${error.message}. Please check your connection or API key.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchActivity = async (page = 1) => {
    if (isLoadingActivity || (!hasMoreActivity && page !== 1)) return;
    
    setIsLoadingActivity(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/trending-ai?page=${page}&per_page=20`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        setActivityFeed(prev => page === 1 ? data.items : [...prev, ...data.items]);
        setActivityPage(page);
        // Cap at 202 items as requested
        if (data.items.length < 20 || (page * 20) >= 202) {
          setHasMoreActivity(false);
        }
      } else {
        setHasMoreActivity(false);
      }
    } catch (err) {
      console.error('Failed to fetch activity', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const fetchNews = async (page = 1) => {
    if (isLoadingNews || (!hasMoreNews && page !== 1)) return;
    
    setIsLoadingNews(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/news?page=${page}&per_page=20`);
      const data = await response.json();
      
      if (data.articles && data.articles.length > 0) {
        setNewsArticles(prev => page === 1 ? data.articles : [...prev, ...data.articles]);
        setNewsPage(page);
        if (data.articles.length < 20) {
          setHasMoreNews(false);
        }
      } else {
        setHasMoreNews(false);
      }
    } catch (err) {
      console.error('Failed to fetch news', err);
    } finally {
      setIsLoadingNews(false);
    }
  };

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
      // Fetch from backend if logged in
      fetch(`${BACKEND_URL}/api/projects?userId=${uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.projects) {
            // Merge local and remote
            const allProjects = [...data.projects, ...localProjects];
            const uniqueProjects = Array.from(new Map(allProjects.map(item => [item.id, item])).values());
            uniqueProjects.sort((a, b) => b.id - a.id);
            setProjects(uniqueProjects);
          } else {
            setProjects(localProjects);
          }
        })
        .catch(err => {
          console.error("Failed to fetch remote projects", err);
          setProjects(localProjects);
        });
    } else {
      setProjects(localProjects);
    }
  }, [isLoggedIn]);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('studio_agents_projects', JSON.stringify(projects));
  }, [projects]);

  const handleDeadLink = (e, featureName) => {
    if (e) e.preventDefault();
    alert(`${featureName} is coming soon! We are currently finalizing the integration.`);
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
      id: Date.now(),
      user: isLoggedIn ? 'Pro Creator' : 'Guest Artist',
      time: 'Just now',
      likes: 0,
      remixes: 0,
      snippet: item.snippet || `Just created this amazing ${item.type || item.agent} output in the Studio!`
    };
    
    setActivityFeed([newActivity, ...activityFeed]);
    alert('Shared to Activity Wall!');
    setActiveTab('activity');
    setPlayingItem(null);
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
            alert("Twitter integration is not configured on the server. Please check backend .env settings.");
          }
        } else {
           window.location.href = `${BACKEND_URL}/api/twitter/auth?returnUrl=${returnUrl}`;
        }
      } catch (e) {
        alert("Could not connect to backend server. Please ensure it is running.");
      }
      return;
    }

    if (platform === 'instagram' || platform === 'facebook') {
      window.location.href = `${BACKEND_URL}/api/meta/auth?returnUrl=${returnUrl}`;
      return;
    }

    // Mock one-click connection for others
    setSocialConnections(prev => ({ ...prev, [platform]: true }));
    alert(`Successfully connected to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    // Optimistic UI update
    setProjects(projects.filter(p => p.id !== projectId));

    if (isLoggedIn) {
      const uid = localStorage.getItem('studio_user_id');
      if (uid) {
        try {
          await fetch(`${BACKEND_URL}/api/projects/${projectId}?userId=${uid}`, {
            method: 'DELETE'
          });
        } catch (err) {
          console.error("Failed to delete from cloud", err);
          alert("Failed to delete from cloud storage, but removed locally.");
        }
      }
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

  const toggleNewsExpansion = (id) => {
    const newExpanded = new Set(expandedNews);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNews(newExpanded);
  };

  const toggleAllNews = () => {
    if (allNewsExpanded) {
      setExpandedNews(new Set());
    } else {
      setExpandedNews(new Set(filteredNews.map(n => n.id)));
    }
    setAllNewsExpanded(!allNewsExpanded);
  };

  const renderContent = () => {
    if (activeTab === 'project_canvas' && !selectedAgent) {
      if (!selectedProject) return <div className="p-8 text-center">No project selected</div>;
      return (
        <div className="project-canvas-view animate-fadeIn" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="canvas-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <button onClick={() => setActiveTab('hub')} className="btn-icon-circle" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{selectedProject.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span className="badge" style={{ background: 'var(--color-purple)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{selectedProject.category}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Created {selectedProject.date}</span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
              <button className="btn-pill primary" onClick={() => setActiveTab('agents')}>
                <Zap size={16} /> Open Studio
              </button>
            </div>
          </div>

          <div className="canvas-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '24px' }}>
            <div className="canvas-column">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Users size={18} className="text-purple" /> The Team</h3>
              <div className="team-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedProject.agents && selectedProject.agents.length > 0 ? (
                  selectedProject.agents.map((agentId, idx) => {
                    const agent = AGENTS.find(a => a.id === agentId) || AGENTS[0];
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
                <button className="btn-dashed" style={{ width: '100%', padding: '12px', border: '1px dashed var(--text-secondary)', borderRadius: '12px', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer' }}>+ Add Agent</button>
              </div>

              {/* MAS Orchestration Section */}
              <div className="orchestration-panel" style={{ marginTop: '24px', padding: '16px', background: 'rgba(168, 85, 247, 0.05)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '1rem', color: 'var(--color-purple)' }}>
                  <Zap size={16} /> Master & Release
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Combine your assets into a final production.
                </p>
                
                <button 
                  className="btn-pill primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    if (!selectedProject.assets || selectedProject.assets.length === 0) {
                      alert("You need to generate some assets first!");
                      return;
                    }
                    
                    // Auto-select best assets for the session
                    const audioAsset = selectedProject.assets.find(a => a.type === 'Audio' || a.type === 'Music Creation');
                    const vocalAsset = selectedProject.assets.find(a => (a.type === 'Audio' || a.type === 'Lyrics') && a.id !== audioAsset?.id);
                    const visualAsset = selectedProject.assets.find(a => a.type === 'Video' || a.type === 'Image' || a.type === 'Visual Identity');
                    
                    setSessionTracks({
                      audio: audioAsset || null,
                      vocal: vocalAsset || null,
                      visual: visualAsset || null
                    });
                    
                    setShowStudioSession(true);
                    handleTextToVoice("Opening Studio Session. Orchestrate your agents.");
                  }}
                >
                  Orchestrate Project
                </button>
              </div>
            </div>

            <div className="canvas-column">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Book size={18} className="text-cyan" /> Narrative & Vision</h3>
              <div className="narrative-editor" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '20px', height: '100%', minHeight: '400px' }}>
                <textarea 
                  value={selectedProject.description}
                  onChange={(e) => {
                    const updated = { ...selectedProject, description: e.target.value };
                    setSelectedProject(updated);
                    setProjects(projects.map(p => p.id === updated.id ? updated : p));
                  }}
                  style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', resize: 'none', fontSize: '1rem', lineHeight: '1.6', outline: 'none' }}
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
                 <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Campaign Assets</h4>
                 <div className="asset-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedProject.assets && selectedProject.assets.length > 0 ? (
                      selectedProject.assets.map((asset, idx) => (
                        <div key={idx} className="asset-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-purple)' }}></div>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                            {asset.title || (asset.snippet ? asset.snippet.substring(0, 20) + '...' : 'New Asset')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted text-sm">No assets generated yet</div>
                    )}
                 </div>
                 <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button className="btn-text" style={{ fontSize: '0.8rem', color: 'var(--color-purple)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Generate Assets</button>
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
                              id: Date.now(),
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
                <h2>Workspace</h2>
                <span className="pro-badge">PRO</span>
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
                  <Users size={18} /> Manage Agents
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
                  <div className="dashboard-welcome-banner">
                    <div className="banner-content">
                      <div className="banner-text">
                        <h1>Welcome back, {isLoggedIn ? 'Pro Creator' : 'Artist'}</h1>
                        <p>
                          {selectedProject 
                            ? <span>Working on: <strong style={{color: 'var(--color-purple)'}}>{selectedProject.name}</strong></span> 
                            : 'Your AI studio is synchronized and ready for your next hit.'}
                        </p>
                      </div>
                      <div className="banner-actions">
                        <button 
                          className={`voice-command-btn haptic-press ${isListening ? 'active' : ''}`}
                          onClick={handleVoiceToText}
                        >
                          <Mic size={20} />
                          <span>{isListening ? 'Listening...' : 'Voice Command'}</span>
                        </button>
                        <button 
                          className="btn-refresh-glow haptic-press"
                          onClick={() => {
                            handleTextToVoice("Synchronizing your AI ecosystem...");
                            alert("Ecosystem synchronized successfully!");
                          }}
                        >
                          <RefreshCw size={18} /> 
                          <span>Sync Ecosystem</span>
                        </button>
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
                          icon: Users, 
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
                      <button className="btn-pill primary" onClick={() => setShowProjectWizard(true)}>
                        <Plus size={14} /> New Project
                      </button>
                      <button className="btn-pill glass" onClick={() => setActiveTab('hub')}>
                        <Folder size={14} /> Open Existing
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Project Checklist */}
                  <div className="dashboard-card onboarding-card" style={{ marginBottom: '24px', border: '1px solid rgba(168, 85, 247, 0.3)', background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
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

                  <div className="dashboard-grid">
                    {/* Stats Section */}
                    <section className="dashboard-card stats-card">
                      <div className="card-header">
                        <h3><BarChart3 size={18} /> Performance Overview</h3>
                        <PieChart size={18} className="text-muted" />
                      </div>
                      <div className="stats-grid">
                        <div className="stat-item">
                          <span className="stat-value">{managedAgents.filter(a => a.visible).length}</span>
                          <span className="stat-label">Active Agents</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{projects.length}</span>
                          <span className="stat-label">Creations</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">42</span>
                          <span className="stat-label">Social Posts</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">8.2k</span>
                          <span className="stat-label">Total Reach</span>
                        </div>
                      </div>
                    </section>

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
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>3 uses per agent</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>10s audio output</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>Basic features</span></li>
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
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>100 uses/month</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>30s audio output</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>Save creations</span></li>
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
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>Unlimited uses</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>60s audio output</span></li>
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>API access</span></li>
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
                        <h4>Show News Feed</h4>
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
                        <h4>Reset Welcome Tour</h4>
                        <p>View the "10x Faster Workflow" introduction again.</p>
                      </div>
                      <button 
                        className="secondary-button"
                        onClick={() => {
                          localStorage.removeItem('studio_welcome_seen');
                          setShowWelcomeModal(true);
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

    if (selectedAgent) {
      const Icon = selectedAgent.icon;
      return (
        <div className="agent-active-view animate-fadeInUp" style={{ position: 'relative' }}>
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
                          className="voice-btn translate-btn"
                          onClick={handleTranslatePrompt}
                          title="Translate to English"
                        >
                          <Languages size={16} />
                        </button>
                      )}
                      <button 
                        className={`voice-btn ${isListening ? 'active' : ''}`} 
                        onClick={handleVoiceToText}
                        title="Voice to Text"
                      >
                        <Mic size={16} />
                      </button>
                      <button 
                        className={`voice-btn ${isSpeaking ? 'active' : ''}`} 
                        onClick={handleTextToVoice}
                        title="Text to Voice"
                      >
                        <Volume2 size={16} />
                      </button>
                      
                      <div className="voice-settings-container">
                        <button 
                          className={`voice-btn ${showVoiceHelp ? 'active' : ''}`}
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
                          className={`voice-btn ${showVoiceSettings ? 'active' : ''}`}
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
                              <label>Voice Gender</label>
                              <div className="settings-toggle">
                                <button 
                                  className={voiceSettings.gender === 'male' ? 'active' : ''}
                                  onClick={() => setVoiceSettings({...voiceSettings, gender: 'male'})}
                                >
                                  Male
                                </button>
                                <button 
                                  className={voiceSettings.gender === 'female' ? 'active' : ''}
                                  onClick={() => setVoiceSettings({...voiceSettings, gender: 'female'})}
                                >
                                  Female
                                </button>
                              </div>
                            </div>
                            <div className="settings-group">
                              <label>Region / Accent</label>
                              <select 
                                value={voiceSettings.region}
                                onChange={(e) => setVoiceSettings({...voiceSettings, region: e.target.value})}
                                className="settings-select"
                              >
                                <option value="US">United States</option>
                                <option value="UK">United Kingdom</option>
                                <option value="AU">Australia</option>
                                <option value="IN">India</option>
                              </select>
                            </div>
                            <div className="settings-group">
                              <label>Preferred Language</label>
                              <div className="language-search">
                                <Languages size={14} />
                                <select 
                                  value={voiceSettings.language}
                                  onChange={(e) => setVoiceSettings({...voiceSettings, language: e.target.value})}
                                  className="settings-select"
                                >
                                  <option value="English">English</option>
                                  <option value="Spanish">Spanish</option>
                                  <option value="French">French</option>
                                  <option value="German">German</option>
                                  <option value="Japanese">Japanese</option>
                                  <option value="Chinese">Chinese</option>
                                </select>
                              </div>
                            </div>
                            <p className="settings-info">AI will automatically translate prompts to {voiceSettings.language}.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <textarea 
                    placeholder={`Describe what you want ${selectedAgent.name} to create...`}
                    className="studio-textarea"
                  ></textarea>
                  
                  <div className="generation-actions">
                    <button 
                      className="cta-button-secondary"
                      onClick={() => {
                        // Simulate preview generation
                        const textarea = document.querySelector('.studio-textarea');
                        if (textarea && textarea.value) {
                          // Just a visual feedback for now
                          textarea.style.borderColor = 'var(--color-cyan)';
                          setTimeout(() => textarea.style.borderColor = '', 500);
                        } else {
                          // Focus if empty
                          if (textarea) textarea.focus();
                        }
                      }}
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
                  
                  <p className="studio-disclaimer">
                    <Shield size={12} />
                    AI-generated content may require manual review for platform compliance.
                  </p>
                </div>
              </div>

              <div className="agent-history-section">
                <h3>Recent Creations</h3>
                <div className="history-grid">
                  {projects.filter(p => p.agent === selectedAgent.name).length > 0 ? (
                    projects.filter(p => p.agent === selectedAgent.name).slice(0, 2).map((item) => (
                      <div 
                        key={item.id} 
                        className="history-item"
                        onClick={() => {
                          if (item.imageUrl || item.videoUrl) {
                            setActiveTab('hub');
                          } else {
                            const textarea = document.querySelector('.studio-textarea');
                            if (textarea) textarea.value = item.snippet;
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                        title={item.imageUrl || item.videoUrl ? "View in Hub" : "Load text to editor"}
                      >
                        <div className="history-preview" style={{ 
                          backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                          backgroundColor: item.imageUrl ? 'transparent' : 'var(--card-bg)'
                        }}>
                          {!item.imageUrl && <div style={{ padding: '5px', fontSize: '8px', overflow: 'hidden' }}>{item.snippet?.substring(0, 50)}</div>}
                        </div>
                        <div className="history-meta">
                          <p className="history-title">{item.title}</p>
                          <p className="history-date">{new Date(item.id).toLocaleDateString()}</p>
                        </div>
                        <button 
                          className="history-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('hub');
                          }}
                          title="Go to Hub"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="history-item empty">
                      <div className="history-meta">
                        <p className="history-title">No recent history</p>
                        <p className="history-date">Create something new!</p>
                      </div>
                    </div>
                  )}
                </div>
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
                    {(selectedAgent.id === 'collab' || selectedAgent.id === 'release') && (
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
                  {selectedAgent.capabilities.map((cap, i) => (
                    <li key={i}><Sparkles size={14} /> {cap}</li>
                  ))}
                </ul>
              </div>

              <div className="side-info-card">
                <h3>How to Use</h3>
                <p className="help-text">{selectedAgent.howToUse}</p>
              </div>

              <div className="side-info-card agent-intelligence-card">
                <div className="card-header-with-icon">
                  <CircleHelp size={18} className="text-purple" />
                  <h3>Agent Intelligence</h3>
                </div>
                <div className="intelligence-content">
                  <div className="intel-section">
                    <h4>The "How"</h4>
                    <p className="help-text small">{selectedAgent.explanation}</p>
                  </div>
                  <div className="intel-section">
                    <h4>Pro Tips</h4>
                    <p className="help-text small">{selectedAgent.helpTips}</p>
                  </div>
                </div>
              </div>

              <div className="side-info-card">
                <h3>Examples</h3>
                <div className="example-chips">
                  {selectedAgent.examples.map((ex, i) => (
                    <div 
                      key={i} 
                      className="example-chip" 
                      onClick={() => {
                        const textarea = document.querySelector('.studio-textarea');
                        if (textarea) {
                          textarea.value = ex;
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

      case 'agents':
        return (
          <div className="agents-studio-grid">
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <div 
                  key={agent.id} 
                  className={`agent-studio-card ${agent.colorClass} ${agent.isPro ? 'pro-card' : ''} animate-fadeInUp`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {agent.isPro && (
                    <div className="pro-badge-mini">
                      <Crown size={12} />
                      <span>PRO</span>
                    </div>
                  )}
                  {agent.isBeta && (
                    <div className="beta-badge-mini" style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      right: agent.isPro ? '60px' : '12px', 
                      background: 'rgba(255, 165, 0, 0.2)', 
                      color: 'orange', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontSize: '10px', 
                      fontWeight: 'bold',
                      border: '1px solid rgba(255, 165, 0, 0.4)'
                    }}>
                      BETA
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
                    className={`agent-launch-btn ${agent.isPro ? 'pro-btn' : ''}`}
                    onClick={() => {
                      if (agent.isPro && !isLoggedIn) {
                        setShowLoginModal(true);
                      } else {
                        setSelectedAgent(agent);
                      }
                    }}
                  >
                    {agent.isPro && !isLoggedIn ? 'Unlock with Pro' : 'Launch Agent'}
                  </button>
                  
                  {/* Quick Actions for Grid */}
                  <div className="agent-grid-quick-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                    <button 
                      className="quick-action-icon-btn"
                      title="Voice Command"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (agent.isPro && !isLoggedIn) {
                          setShowLoginModal(true);
                        } else {
                          setSelectedAgent(agent);
                          setAutoStartVoice(true);
                        }
                      }}
                    >
                      <Mic size={14} />
                      <span>Voice</span>
                    </button>
                    <button 
                      className="quick-action-icon-btn"
                      title="Audio Preview"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTextToVoice(`This is ${agent.name}. ${agent.description}`);
                      }}
                    >
                      <Volume2 size={14} />
                      <span>Preview</span>
                    </button>
                    <button 
                      className="quick-action-icon-btn"
                      title="Get Started Guide"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAgentHelpModal(agent);
                      }}
                    >
                      <CircleHelp size={14} />
                      <span>Guide</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'hub':
        // Use the dynamic 'projects' state instead of static HUB_ITEMS
        const filteredHubItems = projects.filter(item => {
          if (hubFilter === 'All') return true;
          if (hubFilter === 'Music Creation') return item.type === 'Music Creation' || ['Lyrics', 'MIDI', 'Production', 'Vocals', 'Sampling', 'Scoring'].includes(item.type);
          if (hubFilter === 'Visual Identity') return item.type === 'Visual Identity' || ['Image', 'Visual', 'Video'].includes(item.type);
          if (hubFilter === 'Career Growth') return item.type === 'Career Growth' || ['Strategy', 'Plan', 'Network', 'Research', 'Marketing', 'Mastering', 'Sound Design', 'Mixing'].includes(item.type);
          return item.type === hubFilter;
        });

        return (
          <div className="studio-hub-view animate-fadeInUp">
            <div className="hub-header-actions">
              <div className="search-box">
                <Search size={18} />
                <input type="text" placeholder="Search your creations..." />
              </div>
              <div className="filter-group" style={{ display: 'flex', gap: '8px' }}>
                {['All', 'Music Creation', 'Visual Identity', 'Career Growth'].map(filter => (
                  <button 
                    key={filter}
                    className={`btn-pill ${hubFilter === filter ? 'primary' : 'glass'}`}
                    onClick={() => setHubFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredHubItems.length === 0 ? (
              <div className="empty-hub-state">
                <Folder size={48} className="text-muted" />
                <h3>No projects yet</h3>
                <p>Launch the wizard to start creating your first masterpiece.</p>
                <button className="cta-button-secondary" onClick={() => setShowProjectWizard(true)}>
                  Create Project
                </button>
              </div>
            ) : (
              <div className="hub-grid">
                {filteredHubItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="hub-card"
                    onClick={() => {
                      setSelectedProject(item);
                      setActiveTab('project_canvas');
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Open Project Canvas"
                  >
                    <div className={`hub-card-preview ${item.color}`}>
                      {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="hub-preview-image" />}
                      {item.videoUrl && <video src={item.videoUrl} className="hub-preview-video" muted />}
                      {!item.imageUrl && !item.videoUrl && (
                        <div className="hub-text-preview">
                          {item.snippet ? item.snippet.substring(0, 100) + '...' : 'Text Content'}
                        </div>
                      )}
                      <div className="preview-overlay">
                        {(item.audioUrl || item.videoUrl) && (
                          <button 
                            className="preview-btn play"
                            onClick={(e) => { e.stopPropagation(); setPlayingItem(item); }}
                          >
                            <Play size={24} fill="currentColor" />
                          </button>
                        )}
                        <button 
                          className="preview-btn"
                          onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                          title="Download to device"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          className="preview-btn" 
                          onClick={(e) => { e.stopPropagation(); handleShareToFeed(item); }}
                          title="Share to Activity Wall"
                        >
                          <Share2 size={18} />
                        </button>
                        <button 
                          className="preview-btn delete-btn" 
                          onClick={(e) => handleDeleteProject(item.id, e)}
                          title="Delete Project"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="hub-card-info">
                      <div className="hub-card-meta">
                        <span className="hub-type-tag">{item.type}</span>
                        <span className="hub-date">{item.date}</span>
                      </div>
                      <h3 className="hub-card-title">{item.title}</h3>
                      <p className="hub-card-agent">via {item.agent}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'resources':
        const LEGAL_RESOURCES = [
          { title: 'Music Copyright 101', desc: 'Understanding your rights as a creator.', icon: Shield, type: 'Guide' },
          { title: 'Split Sheet Template', desc: 'Standard agreement for co-writing sessions.', icon: FileText, type: 'Template' },
          { title: 'Sync Licensing Guide', desc: 'How to get your music in TV & Film.', icon: Tv, type: 'Guide' },
          { title: 'AI & IP Rights', desc: 'Navigating the legal landscape of AI music.', icon: Lock, type: 'Whitepaper' }
        ];

        const AGENT_WHITEPAPERS = [
          { title: 'Ghostwriter v2.4', desc: 'LLM Architecture & Lyric Generation', version: 'v2.4', icon: FileText },
          { title: 'Beat Architect v3.1', desc: 'Rhythmic Pattern Analysis Engine', version: 'v3.1', icon: Zap },
          { title: 'Imagen 3 Integration', desc: 'High-Fidelity Visual Synthesis', version: 'v3.0', icon: Image },
          { title: 'Veo Video Model', desc: 'Cinematic Video Generation Specs', version: 'v1.0', icon: Video }
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

            <div className="resources-grid">
              <section className="resources-section">
                <div className="section-header">
                  <Shield size={20} className="text-purple" />
                  <h2>Legal & Business</h2>
                </div>
                <div className="cards-grid">
                  {LEGAL_RESOURCES.map((item, i) => (
                    <div key={i} className="resource-card legal">
                      <div className="card-icon"><item.icon size={24} /></div>
                      <div className="card-content">
                        <h3>{item.title}</h3>
                        <p>{item.desc}</p>
                        <span className="card-tag">{item.type}</span>
                      </div>
                      <button className="card-action" onClick={() => handleDeadLink(null, item.title)}>
                        Read Guide
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="resources-section">
                <div className="section-header">
                  <FileText size={20} className="text-cyan" />
                  <h2>Agent Whitepapers</h2>
                </div>
                <div className="cards-grid">
                  {AGENT_WHITEPAPERS.map((item, i) => (
                    <div key={i} className="resource-card whitepaper">
                      <div className="card-icon"><item.icon size={24} /></div>
                      <div className="card-content">
                        <div className="wp-header">
                          <h3>{item.title}</h3>
                          <span className="version-badge">{item.version}</span>
                        </div>
                        <p>{item.desc}</p>
                      </div>
                      <button className="card-action secondary" onClick={() => handleDeadLink(null, item.title)}>
                        Technical Spec
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
                  <Map size={20} className="text-emerald" />
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
                      <li onClick={() => setActiveTab('activity')}>Activity Wall</li>
                      <li onClick={() => setActiveTab('news')}>News Feed</li>
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
      case 'activity':
        return (
          <div className="activity-wall-view animate-fadeInUp">
            <div className="activity-header">
              <div className="header-left">
                <h1>Activity Wall</h1>
                <p>Trending AI projects and community creations for inspiration.</p>
              </div>
              <div className="header-right-actions">
                <button className="cta-button-premium haptic-press" onClick={() => fetchActivity(1)}>
                  <Zap size={18} />
                  Refresh Feed
                </button>
              </div>
            </div>

            <div className="activity-feed">
              {activityFeed.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="activity-card">
                  <div className="activity-card-header">
                    <div className="user-meta">
                      <div className="user-avatar-small"></div>
                      <div className="user-details">
                        <span className="user-handle">@{item.user}</span>
                        <span className="activity-time">{item.time}</span>
                      </div>
                    </div>
                    <div className={`agent-tag ${item.color}`}>
                      {item.agent}
                    </div>
                  </div>
                  
                  <div className="activity-card-body">
                    <h3>{item.title}</h3>
                    <p className="activity-snippet">"{item.snippet}"</p>
                    
                    {item.type === 'video' && item.videoUrl && (
                      <div className="activity-media-preview video">
                        <video src={item.videoUrl} muted loop onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} />
                        <div className="media-overlay"><PlayCircle size={32} /></div>
                      </div>
                    )}

                    {item.type === 'image' && item.imageUrl && (
                      <div className="activity-media-preview image">
                        <img src={item.imageUrl} alt={item.title} />
                      </div>
                    )}

                    {(item.audioUrl || item.videoUrl) && (
                      <button 
                        className="play-preview-btn"
                        onClick={() => setPlayingItem(item)}
                      >
                        <PlayCircle size={20} />
                        <span>Play Preview</span>
                      </button>
                    )}
                  </div>

                  <div className="activity-card-footer">
                    <div className="activity-actions">
                      <button className="activity-btn">
                        <Zap size={16} />
                        <span>{item.likes}</span>
                      </button>
                      <button className="activity-btn">
                        <Rocket size={16} />
                        <span>{item.remixes}</span>
                      </button>
                      <button className="activity-btn" onClick={() => window.open(item.url, '_blank')}>
                        <Share2 size={16} />
                      </button>
                    </div>
                    <button className="remix-cta" onClick={() => window.open(item.url, '_blank')}>
                      View Project
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {isLoadingActivity && (
              <div className="loading-trigger">
                <div className="spinner"></div>
                <span>Loading more inspiration...</span>
              </div>
            )}

            {!isLoadingActivity && hasMoreActivity && (
              <div className="load-more-trigger">
                <button className="cta-button-secondary haptic-press" onClick={() => fetchActivity(activityPage + 1)}>
                  Load More Projects
                </button>
              </div>
            )}

            {!hasMoreActivity && activityFeed.length > 0 && (
              <div className="end-of-feed">
                <p>You've reached the end of the inspiration wall. Check back later!</p>
              </div>
            )}
          </div>
        );
      case 'news':
        return (
          <div className="news-view animate-fadeInUp">
            <div className="news-header-controls">
              <div className="search-box">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Search live news, tabloids, or sources..." 
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                />
              </div>
              <div className="news-actions">
                <button 
                  className="action-button secondary haptic-press"
                  onClick={toggleAllNews}
                >
                  {allNewsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  {allNewsExpanded ? 'Collapse All' : 'Expand All'}
                </button>
                <button 
                  className={`refresh-btn haptic-press ${isLoadingNews ? 'spinning' : ''}`}
                  onClick={handleRefreshNews}
                >
                  <Zap size={18} />
                  Refresh Feed
                </button>
              </div>
            </div>

            <div className="news-grid-v2">
              {filteredNews.map((item) => {
                const isExpanded = expandedNews.has(item.id);
                return (
                  <div key={item.id} className={`news-card-v2 ${isExpanded ? 'expanded' : ''} source-${item.source.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className={`news-card-accent ${item.color || 'agent-purple'}`}></div>
                    <div className="news-card-content">
                      <div className="news-card-meta">
                        <div className="meta-left">
                          <span className="news-source-badge">{item.source}</span>
                          {item.tags && item.tags.map(tag => (
                            <span key={tag} className="news-category-tag">{tag}</span>
                          ))}
                          {item.time === 'Just now' && <span className="live-indicator-pulse">LIVE</span>}
                        </div>
                        <span className="news-date">{item.time}</span>
                      </div>
                      
                      {item.type === 'video' && (
                        <div className="news-media-preview video">
                          <video src={item.videoUrl} muted loop onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} />
                          <div className="media-overlay"><PlayCircle size={24} /></div>
                        </div>
                      )}

                      {item.type === 'image' && (
                        <div className="news-media-preview image">
                          <img src={item.imageUrl} alt={item.title} />
                        </div>
                      )}

                      <h3 className="news-card-title">{item.title}</h3>
                      <p className={`news-card-text ${isExpanded ? 'full' : 'preview'}`}>
                        {item.content}
                      </p>
                      <div className="news-card-footer">
                        <button 
                          className="news-read-btn"
                          onClick={() => toggleNewsExpansion(item.id)}
                        >
                          {isExpanded ? 'Show Less' : 'Read Article'} 
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {isExpanded && (
                          <div className="news-social-actions">
                            <button 
                              className="social-btn" 
                              onClick={() => window.open(item.url, '_blank')}
                              title="Open Article"
                              style={{ width: 'auto', padding: '0 12px', gap: '6px' }}
                            >
                              <Share2 size={14} />
                              <span>Open</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isLoadingNews && (
              <div className="loading-trigger">
                <div className="spinner"></div>
                <span>Loading more news...</span>
              </div>
            )}

            {!isLoadingNews && hasMoreNews && (
              <div className="load-more-trigger">
                <button className="cta-button-secondary" onClick={() => fetchNews(newsPage + 1)}>
                  Load More News
                </button>
              </div>
            )}
          </div>
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
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{user?.displayName || 'Guest Artist'}</h1>
                <p style={{ color: 'var(--text-secondary)' }}>{user?.email || 'No email linked'}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <span className="badge" style={{ background: 'var(--color-purple)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>Pro Plan</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>Member since 2024</span>
                </div>
              </div>
            </div>

            <div className="profile-section" style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Artist Profile</h3>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Stage Name</label>
                  <input type="text" defaultValue={user?.displayName} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Primary Genre</label>
                  <select style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }}>
                    <option>Hip Hop / Rap</option>
                    <option>R&B</option>
                    <option>Pop</option>
                    <option>Electronic</option>
                    <option>Rock</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Artist Bio</label>
                  <textarea rows="4" placeholder="Tell your story..." style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}></textarea>
                </div>
              </div>
            </div>

            <div className="profile-section" style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Share2 size={20} /> Social Connections</h3>
              <div className="social-connect-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="social-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Instagram size={20} color="#E1306C" />
                    <span>Instagram</span>
                  </div>
                  <button className="btn-sm" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Connect</button>
                </div>
                <div className="social-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Twitter size={20} color="#1DA1F2" />
                    <span>X / Twitter</span>
                  </div>
                  <button className="btn-sm" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Connect</button>
                </div>
                <div className="social-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Music size={20} color="#1DB954" />
                    <span>Spotify for Artists</span>
                  </div>
                  <button className="btn-sm" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Connect</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="cta-button-secondary" onClick={() => setActiveTab('mystudio')}>Cancel</button>
              <button className="cta-button-premium" onClick={() => { alert('Profile saved!'); setActiveTab('mystudio'); }}>Save Changes</button>
            </div>
          </div>
        );

      case 'support':
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
            desc: 'See how other artists are using the studio.',
            details: 'Join our Discord community and check out the "Activity Wall" to share prompts, collaborate with other artists, and get feedback on your AI-assisted tracks. Many users have found success by combining outputs from multiple agents—for example, using Ghostwriter for lyrics and then feeding those lyrics into a vocal synth. The possibilities are endless when you collaborate with the community.'
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
          { keywords: ['news', 'feed', 'updates', 'industry', 'trends'], label: 'Industry News', action: () => setActiveTab('news') },
          { keywords: ['hub', 'projects', 'files', 'saved', 'library', 'creations'], label: 'Project Hub', action: () => setActiveTab('hub') },
          { keywords: ['activity', 'wall', 'community', 'social', 'share', 'feed'], label: 'Activity Wall', action: () => setActiveTab('activity') },
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
          desc: agent ? agent.role : 'Execute task',
          agentId: agentId,
          icon: agent ? agent.icon : Zap,
          completed: false
        };
      });
    }

    // Fallback based on category
    switch(selectedProject.category) {
      case 'pro': return [
        { id: 'lyrics', label: 'Draft Lyrics', agentId: 'ghostwriter', icon: Mic, desc: 'Generate verses & hooks' },
        { id: 'beat', label: 'Compose Beat', agentId: 'beat_lab', icon: Music, desc: 'Create instrumental backing' },
        { id: 'art', label: 'Cover Art', agentId: 'visualist', icon: Zap, desc: 'Design album artwork' }
      ];
      case 'vybing': return [
        { id: 'beat', label: 'Generate Vibe', agentId: 'beat_lab', icon: Music, desc: 'Quick beat generation' },
        { id: 'lyrics', label: 'Freestyle Lyrics', agentId: 'ghostwriter', icon: Mic, desc: 'Write over the beat' }
      ];
      default: return [
        { id: 'plan', label: 'Create Plan', agentId: 'manager', icon: Target, desc: 'Outline your project goals' }
      ];
    }
  };

  const activeProjectSteps = getProjectSteps();

  return (
    <div className={`studio-container ${theme}-theme`} {...swipeHandlers}>
      <aside className="studio-nav">
        <div className="studio-nav-logo" onClick={onBack}>
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
            <span>Agents</span>
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
            <span>Activity Wall</span>
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
            <span>News</span>
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
              <p className="user-name">{isLoggedIn ? (user?.displayName || 'Pro Creator') : 'Guest Artist'}</p>
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
              className="credit-counter haptic-press" 
              onClick={() => setShowCreditsModal(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'rgba(255,255,255,0.1)', 
                padding: '6px 12px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: '600',
                marginRight: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <Zap size={14} className="text-yellow-400" fill="currentColor" />
              <span>500 Credits</span>
            </button>
            <button 
              className="action-button secondary theme-toggle haptic-press"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              className="action-button secondary haptic-press"
              onClick={onBack}
              title="Back to Landing Page"
            >
              <Home size={18} />
            </button>
            <button 
              className="action-button secondary haptic-press"
              onClick={() => setShowWelcomeModal(true)}
              title="Welcome Tour"
            >
              <Sparkles size={18} />
            </button>
            <button 
              className="action-button secondary haptic-press"
              onClick={() => { setActiveTab('support'); setSelectedAgent(null); }}
              title="Help Center"
            >
              <CircleHelp size={18} />
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
                  onClick={() => setShowProjectWizard(true)}
                >
                  New Project ({projects.length})
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
                  onClick={() => alert("Studio Session Guide:\n1. Select a Beat (Track 1)\n2. Select Vocals (Track 2)\n3. Select a Visual\n4. Press Play to preview the mix\n5. Click 'Render Master' to save the combined asset.")}
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
                    <img src={sessionTracks.visual.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )
                ) : (
                  <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Image size={48} />
                    <span>No Visual Selected</span>
                  </div>
                )}
                
                {/* Audio Elements (Hidden) */}
                {sessionTracks.audio && (
                  <audio 
                    src={sessionTracks.audio.audioUrl} 
                    ref={el => {
                      if (el) {
                        el.volume = 0.8; // Default mix
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
                        el.volume = 1.0; // Vocals usually louder
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}><Disc size={24} className="text-cyan" /></div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Track 1 (Audio)</label>
                    <select 
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      value={sessionTracks.audio?.id || ''}
                      onChange={(e) => {
                        const asset = selectedProject.assets.find(a => a.id.toString() === e.target.value);
                        setSessionTracks(prev => ({ ...prev, audio: asset || null }));
                      }}
                    >
                      <option value="">Select Audio Asset...</option>
                      {selectedProject?.assets.filter(a => a.audioUrl).map(a => (
                        <option key={a.id} value={a.id}>{a.title} ({a.agent})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '100px' }}>
                     <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Volume</label>
                     <input type="range" min="0" max="1" step="0.1" defaultValue="0.8" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Track 2: Vocals / Audio B */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}><Mic size={24} className="text-purple" /></div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Track 2 (Audio)</label>
                    <select 
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      value={sessionTracks.vocal?.id || ''}
                      onChange={(e) => {
                        const asset = selectedProject.assets.find(a => a.id.toString() === e.target.value);
                        setSessionTracks(prev => ({ ...prev, vocal: asset || null }));
                      }}
                    >
                      <option value="">Select Audio Asset...</option>
                      {selectedProject?.assets.filter(a => a.audioUrl).map(a => (
                        <option key={a.id} value={a.id}>{a.title} ({a.agent})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '100px' }}>
                     <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Volume</label>
                     <input type="range" min="0" max="1" step="0.1" defaultValue="1.0" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Track 3: Visual */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}><Video size={24} className="text-pink" /></div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Visual Layer</label>
                    <select 
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      value={sessionTracks.visual?.id || ''}
                      onChange={(e) => {
                        const asset = selectedProject.assets.find(a => a.id.toString() === e.target.value);
                        setSessionTracks(prev => ({ ...prev, visual: asset || null }));
                      }}
                    >
                      <option value="">Select Visual...</option>
                      {selectedProject?.assets.filter(a => a.imageUrl || a.videoUrl).map(a => (
                        <option key={a.id} value={a.id}>{a.title} ({a.agent})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button className="btn-dashed" style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}>+ Add Track</button>

              </div>
            </div>

            {/* Footer Controls */}
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: '16px' }}>
                 <button 
                   className="btn-circle" 
                   style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-purple)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                   onClick={() => setSessionPlaying(!sessionPlaying)}
                 >
                   {sessionPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                 </button>
               </div>
               
               <button 
                 className="btn-pill primary"
                 onClick={() => {
                   // Render Logic
                   if (!sessionTracks.audio && !sessionTracks.visual) {
                     alert("Select at least one asset to render.");
                     return;
                   }
                   
                   const masterAsset = {
                     id: Date.now(),
                     title: "Studio Master - " + selectedProject.name,
                     type: "Master",
                     agent: "Studio Session",
                     date: "Just now",
                     color: "agent-purple",
                     snippet: "Orchestrated Master Composition",
                     audioUrl: sessionTracks.audio?.audioUrl, // Primary audio
                     imageUrl: sessionTracks.visual?.imageUrl,
                     videoUrl: sessionTracks.visual?.videoUrl
                   };
                   
                   const updated = { ...selectedProject, assets: [masterAsset, ...selectedProject.assets] };
                   setSelectedProject(updated);
                   setProjects(projects.map(p => p.id === updated.id ? updated : p));
                   
                   setShowStudioSession(false);
                   setSessionPlaying(false);
                   alert("Master rendered and saved to project!");
                 }}
               >
                 <Zap size={18} /> Render Master
               </button>
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
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" width="24" />
                    <span>Google Drive</span>
                  </button>
                  <button className="storage-btn" onClick={() => { 
                    // Simulate connection
                    alert('OneDrive integration coming soon!'); 
                    setShowExternalSaveModal(false); 
                  }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg" alt="OneDrive" width="24" />
                    <span>OneDrive</span>
                  </button>
                  <button className="storage-btn" onClick={() => { 
                    // Simulate connection
                    alert('Dropbox integration coming soon!'); 
                    setShowExternalSaveModal(false); 
                  }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" alt="Dropbox" width="24" />
                    <span>Dropbox</span>
                  </button>
                  <button className="storage-btn" onClick={() => { 
                    // Simulate connection
                    alert('iCloud integration coming soon!'); 
                    setShowExternalSaveModal(false); 
                  }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/1c/ICloud_logo.svg" alt="iCloud" width="24" />
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

        {/* Login Modal */}
        {showLoginModal && (
          <div className="modal-overlay" onClick={() => { setShowLoginModal(false); setSelectedPlan(null); }} onTouchEnd={() => { setShowLoginModal(false); setSelectedPlan(null); }}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => { setShowLoginModal(false); setSelectedPlan(null); }} onTouchEnd={(e) => { e.preventDefault(); setShowLoginModal(false); setSelectedPlan(null); }}><X size={20} /></button>
              <div className="modal-header">
                <div className="logo-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
                  <Sparkles size={24} color="white" />
                </div>
                <h2>{selectedPlan ? 'Complete Your Subscription' : 'Join Studio Agents'}</h2>
                <p>
                  {selectedPlan 
                    ? `Sign in to activate your ${selectedPlan.name} (${selectedPlan.price}${selectedPlan.period ? selectedPlan.period : ''}).` 
                    : 'Sign in to save your projects and access all 8 AI agents.'}
                </p>
              </div>
              <div className="modal-body">
                <button 
                  className="cta-button-premium" 
                  style={{ width: '100%', marginBottom: '1rem' }}
                  onClick={handleLogin}
                >
                  {selectedPlan ? 'Sign In & Subscribe with Google' : 'Sign In with Google'}
                </button>
                <button 
                  className="cta-button-secondary" 
                  style={{ width: '100%' }}
                  onClick={handleLogin}
                >
                  {selectedPlan ? 'Sign In & Subscribe with Email' : 'Continue with Email'}
                </button>
              </div>
              <div className="modal-footer">
                <p>By continuing, you agree to our Terms of Service.</p>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Payment Method Modal */}
        {showAddPaymentModal && (
          <div className="modal-overlay" onClick={() => { setShowAddPaymentModal(false); setEditingPayment(null); }} onTouchEnd={() => { setShowAddPaymentModal(false); setEditingPayment(null); }}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => { setShowAddPaymentModal(false); setEditingPayment(null); }} onTouchEnd={(e) => { e.preventDefault(); setShowAddPaymentModal(false); setEditingPayment(null); }}><X size={20} /></button>
              <div className="modal-header">
                <div className="logo-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
                  <CreditCard size={24} color="white" />
                </div>
                <h2>{editingPayment ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
                <p>Securely {editingPayment ? 'update' : 'add'} a card or bank account.</p>
              </div>
              
              <div className="modal-tabs">
                <button 
                  className={`modal-tab ${paymentType === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentType('card')}
                  disabled={!!editingPayment}
                >
                  Credit/Debit Card
                </button>
                <button 
                  className={`modal-tab ${paymentType === 'bank' ? 'active' : ''}`}
                  onClick={() => setPaymentType('bank')}
                  disabled={!!editingPayment}
                >
                  Bank Account
                </button>
              </div>

              <div className="modal-body">
                {paymentType === 'card' ? (
                  <form className="payment-form" onSubmit={handleSavePayment}>
                    <div className="form-group">
                      <label>Cardholder Name</label>
                      <input 
                        type="text" 
                        name="cardName" 
                        placeholder="Name on card" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Card Number</label>
                      <div className="input-with-icon">
                        <CreditCard size={18} className="input-icon" />
                        <input 
                          type="text" 
                          name="cardNumber" 
                          placeholder="0000 0000 0000 0000" 
                          defaultValue={editingPayment ? `**** **** **** ${editingPayment.item.last4}` : ''}
                          required 
                        />
                      </div>
                    </div>
                    <div className="form-row three-col">
                      <div className="form-group">
                        <label>Expiry</label>
                        <input 
                          type="text" 
                          name="expiry" 
                          placeholder="MM/YY" 
                          defaultValue={editingPayment ? editingPayment.item.expiry : ''}
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label>CVC</label>
                        <input type="text" name="cvc" placeholder="123" required />
                      </div>
                      <div className="form-group">
                        <label>Zip Code</label>
                        <input type="text" name="zip" placeholder="10001" required />
                      </div>
                    </div>
                    <button type="submit" className="cta-button-premium" style={{ width: '100%', marginTop: '1rem' }}>
                      {editingPayment ? 'Update Card' : 'Save Card'}
                    </button>
                  </form>
                ) : (
                  <form className="payment-form" onSubmit={handleSavePayment}>
                    <div className="form-group">
                      <label>Account Holder Name</label>
                      <input 
                        type="text" 
                        name="accountName" 
                        placeholder="Full Name" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Bank Name</label>
                      <div className="input-with-icon">
                        <Landmark size={18} className="input-icon" />
                        <input 
                          type="text" 
                          name="bankName" 
                          placeholder="e.g. Chase, Wells Fargo" 
                          defaultValue={editingPayment ? editingPayment.item.bankName : ''}
                          required 
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Routing Number</label>
                        <input type="text" name="routingNumber" placeholder="9 digits" required />
                      </div>
                      <div className="form-group">
                        <label>Account Number</label>
                        <input 
                          type="text" 
                          name="accountNumber" 
                          placeholder="Account Number" 
                          defaultValue={editingPayment ? `****${editingPayment.item.last4}` : ''}
                          required 
                        />
                      </div>
                    </div>
                    <button type="submit" className="cta-button-premium" style={{ width: '100%', marginTop: '1rem' }}>
                      {editingPayment ? 'Update Bank Account' : 'Link Bank Account'}
                    </button>
                  </form>
                )}
              </div>
              <div className="modal-footer">
                <div className="secure-badge">
                  <Lock size={12} />
                  <span>Encrypted & Secure via Stripe</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="bottom-nav">
          <div className={`bottom-nav-item haptic-press ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => { setActiveTab('agents'); setSelectedAgent(null); }}>
            <LayoutGrid size={24} />
            <span>Agents</span>
          </div>
          <div className={`bottom-nav-item haptic-press ${activeTab === 'mystudio' ? 'active' : ''}`} onClick={() => { setActiveTab('mystudio'); setSelectedAgent(null); }}>
            <Home size={24} />
            <span>Studio</span>
          </div>
          <div className={`bottom-nav-item haptic-press ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => { setActiveTab('activity'); setSelectedAgent(null); }}>
            <Rocket size={24} />
            <span>Wall</span>
          </div>
          <div className={`bottom-nav-item haptic-press ${activeTab === 'news' ? 'active' : ''}`} onClick={() => { setActiveTab('news'); setSelectedAgent(null); }}>
            <Globe size={24} />
            <span>News</span>
          </div>
          <div className={`bottom-nav-item haptic-press ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => { setActiveTab('resources'); setSelectedAgent(null); }}>
            <Book size={24} />
            <span>Resources</span>
          </div>
        </nav>
      </main>

      {/* Welcome / Onboarding Modal */}
      {showWelcomeModal && (
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 2000 }}>
          <div className="modal-content welcome-modal">
            <button 
              className="modal-close"
              onClick={() => setShowWelcomeModal(false)}
            >
              <X size={24} />
            </button>
            <div className="welcome-header">
              <div className="welcome-icon-glow">
                <Sparkles size={48} className="text-purple" />
              </div>
              <h2>Welcome to Studio Agents</h2>
              <p>Your elite team of AI specialists is ready.</p>
            </div>

            <div className="welcome-features">
              {[
                {
                  id: 'speed',
                  icon: Zap,
                  color: 'cyan',
                  title: '10x Faster Workflow',
                  shortDesc: 'Generate lyrics, beats, and visuals in seconds, not hours.',
                  fullDesc: 'Stop wrestling with writer\'s block. Our AI agents handle the heavy lifting—generating chord progressions, drafting lyrics, and creating cover art instantly—so you can focus on the creative decisions that matter. It\'s like having a studio session that never ends.',
                  stats: ['90% less time on admin', 'Instant inspiration', 'Zero setup time']
                },
                {
                  id: 'quality',
                  icon: Crown,
                  color: 'purple',
                  title: 'Industry Standard Quality',
                  shortDesc: 'Tools tuned by professional producers and engineers.',
                  fullDesc: 'We don\'t just use generic AI. Our models are fine-tuned on hit records and professional mixing standards. Whether it\'s a mastering chain or a marketing strategy, you get output that stands up to major label releases.',
                  stats: ['Radio-ready audio', '4K visual assets', 'Pro-grade mixing']
                },
                {
                  id: 'team',
                  icon: Users,
                  color: 'orange',
                  title: 'Your Personal Team',
                  shortDesc: '16 specialized agents working 24/7 for your career.',
                  fullDesc: 'Imagine hiring a manager, a PR agent, a mixing engineer, and a session musician for the price of a lunch. Your Studio Agents team is always available, never tired, and constantly learning new tricks to help you win.',
                  stats: ['16 Specialists', '24/7 Availability', 'Infinite Patience']
                },
                {
                  id: 'credits',
                  icon: CreditCard,
                  color: 'emerald',
                  title: 'Smart Credit System',
                  shortDesc: 'Pay as you go. Clear pricing for every action.',
                  fullDesc: 'Every agent action uses credits. You start with 500 FREE credits. Complex tasks cost more than simple ones. Always know exactly what you\'re spending before you click generate.',
                  stats: ['Lyrics: 5 Credits', 'Beat Gen: 25 Credits', 'Mastering: 50 Credits']
                }
              ].map((feature) => (
                <div 
                  key={feature.id} 
                  className={`welcome-feature-item ${expandedWelcomeFeature === feature.id ? 'expanded' : ''}`}
                  onClick={() => setExpandedWelcomeFeature(expandedWelcomeFeature === feature.id ? null : feature.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="feature-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <div className={`feature-icon-box ${feature.color}`}>
                      <feature.icon size={24} />
                    </div>
                    <div className="feature-text" style={{ flex: 1 }}>
                      <h3>{feature.title}</h3>
                      <p>{feature.shortDesc}</p>
                    </div>
                    <div className="feature-expand-icon">
                      <ChevronDown size={20} className={`transition-transform ${expandedWelcomeFeature === feature.id ? 'rotate-180' : ''}`} style={{ transition: 'transform 0.3s ease' }} />
                    </div>
                  </div>
                  
                  {expandedWelcomeFeature === feature.id && (
                    <div className="feature-details animate-fadeIn" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <p className="feature-full-desc" style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '12px' }}>{feature.fullDesc}</p>
                      <div className="feature-stats" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {feature.stats.map((stat, i) => (
                          <div key={i} className="feature-stat-pill" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            fontSize: '0.8rem', 
                            background: 'rgba(255,255,255,0.05)', 
                            padding: '4px 10px', 
                            borderRadius: '12px',
                            color: 'var(--text-primary)'
                          }}>
                            <CheckCircle size={12} className={`text-${feature.color}`} /> {stat}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button 
              className="cta-button-premium haptic-press"
              style={{ width: '100%', marginTop: '24px', display: 'none' }}
              onClick={() => {
                localStorage.setItem('studio_welcome_seen', 'true');
                setShowWelcomeModal(false);
                setShowProjectWizard(true);
                handleTextToVoice("Welcome to the studio. Let's set up your first project.");
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Credits Info Modal */}
      {showCreditsModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowCreditsModal(false)}>
          <div className="modal-content credits-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="agent-mini-icon" style={{ background: 'rgba(250, 204, 21, 0.1)', color: '#facc15' }}>
                  <Zap size={20} fill="currentColor" />
                </div>
                <h2>Studio Credits</h2>
              </div>
              <button className="modal-close" onClick={() => setShowCreditsModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body help-modal-body">
              <div className="help-section">
                <h3><CreditCard size={16} className="text-cyan" /> What are Credits?</h3>
                <p>Credits are the currency of Studio Agents. Every time you ask an agent to generate content—whether it's lyrics, a beat, or a marketing plan—it costs a specific amount of credits.</p>
              </div>

              <div className="help-section">
                <h3><BarChart3 size={16} className="text-purple" /> Cost Breakdown</h3>
                <div className="onboarding-steps-list">
                  <div className="onboarding-step-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Text Generation (Lyrics, Ideas)</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-cyan)' }}>5 Credits</span>
                  </div>
                  <div className="onboarding-step-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Image Generation (Cover Art)</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-cyan)' }}>15 Credits</span>
                  </div>
                  <div className="onboarding-step-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Audio Processing (Beats, Mixing)</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-cyan)' }}>25 Credits</span>
                  </div>
                  <div className="onboarding-step-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Full Project Analysis</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-cyan)' }}>50 Credits</span>
                  </div>
                </div>
              </div>

              <div className="help-section pro-tip-box">
                <h3><Rocket size={16} className="text-orange" /> Get Started</h3>
                <p>You have <strong>100 FREE credits</strong> to start your journey. That's enough to write an entire album or generate 20+ high-res cover arts.</p>
                <p style={{ marginTop: '8px' }}>Need more? You can top up anytime in the <strong>Billing</strong> tab.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cta-button-premium" onClick={() => {
                setShowCreditsModal(false);
                setShowProjectWizard(true);
              }}>
                Start Creating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Wizard Modal */}
      {showProjectWizard && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowProjectWizard(false)}>
          <div className="modal-content project-wizard-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="agent-mini-icon bg-purple">
                  <Rocket size={20} />
                </div>
                <h2>Create New Project</h2>
              </div>
              <button className="modal-close" onClick={() => setShowProjectWizard(false)}>
                <X size={20} />
              </button>
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
                      const isSelected = newProjectData.selectedAgents?.includes(agent.name);
                      return (
                        <div 
                          key={agent.name}
                          className={`agent-select-card haptic-press ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            const current = newProjectData.selectedAgents || [];
                            const updated = current.includes(agent.name)
                              ? current.filter(n => n !== agent.name)
                              : [...current, agent.name];
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
                      {(newProjectData.selectedAgents || []).map(agentName => {
                        const agent = AGENTS.find(a => a.name === agentName);
                        return agent ? (
                          <div key={agentName} title={agentName} style={{ 
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
                    (projectWizardStep === 2 && (!newProjectData.selectedAgents || newProjectData.selectedAgents.length === 0))
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
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 2000 }}>
          <div className="modal-content onboarding-modal" style={{ maxWidth: '700px', padding: 0, overflow: 'hidden' }}>
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
              <button 
                className="modal-close" 
                onClick={() => setShowOnboarding(false)}
                style={{ top: '20px', right: '20px' }}
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

              {/* Step 2: Path Selection */}
              {onboardingStep === 2 && (
                <div className="path-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '24px' }}>
                  {pathOptions.map(path => (
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
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {onboardingStep < onboardingSteps.length - 1 ? (
                    <button 
                      className="cta-button-premium"
                      onClick={() => setOnboardingStep(prev => prev + 1)}
                      disabled={onboardingStep === 2 && !selectedPath}
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
          <div className="modal-content whitepaper-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '12px', 
                  background: 'var(--color-bg-secondary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-primary)'
                }}>
                  <showAgentWhitePaper.icon size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{showAgentWhitePaper.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{showAgentWhitePaper.subtitle}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowAgentWhitePaper(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px 0' }}>
              <div className="whitepaper-section" style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--color-purple)' }}>The Vision</h3>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                  {showAgentWhitePaper.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div className="whitepaper-box" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Users size={18} className="text-cyan" /> Who It's For
                  </h4>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                    {showAgentWhitePaper.whoFor}
                  </p>
                </div>
                <div className="whitepaper-box" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Zap size={18} className="text-orange" /> How It Works
                  </h4>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                    {showAgentWhitePaper.howTo}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
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
    </div>
  );
}

export default StudioView;
