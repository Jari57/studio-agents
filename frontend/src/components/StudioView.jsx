import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, Zap, Music, PlayCircle, Target, Users, Rocket, Shield, Globe, Folder, Book, Cloud, Search, Filter, Download, Share2, CircleHelp, MessageSquare, Play, Pause, Volume2, Maximize, Home, ArrowLeft, Mic, Save, Lock, CheckCircle, Award, Settings, Languages, CreditCard, HardDrive, Database, BarChart3, PieChart, Twitter, Instagram, Facebook, RefreshCw, Sun, Moon, Trash2, Eye, EyeOff, Plus, Landmark, ArrowRight, ChevronRight, ChevronDown, ChevronUp, X, Bell, Menu, LogOut, User, Crown, LayoutGrid, TrendingUp, Disc, Video, FileAudio as FileMusic, Activity, Film, Scale, FileText, Tv, Image, Layout, Briefcase, FileCode, Cpu, Wrench, Map, ExternalLink
} from 'lucide-react';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { auth, db, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from '../firebase';
import { AGENTS, BACKEND_URL } from '../constants';

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
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persist projects
  useEffect(() => {
    localStorage.setItem('studio_projects', JSON.stringify(projects));
  }, [projects]);
  const [expandedNews, setExpandedNews] = useState(new Set());
  const [allNewsExpanded, setAllNewsExpanded] = useState(false);
  const [selectedHelpItem, setSelectedHelpItem] = useState(null);
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
  
  // New state for Manual Mode settings (Model, Language, etc.)
  const [manualSettings, setManualSettings] = useState(() => {
    const saved = localStorage.getItem('studio_manual_settings');
    return saved ? JSON.parse(saved) : {
      genre: 'Hip Hop / Rap',
      model: 'gemini',
      language: 'en',
      intensity: 5
    };
  });

  // Persist manual settings
  useEffect(() => {
    localStorage.setItem('studio_manual_settings', JSON.stringify(manualSettings));
  }, [manualSettings]);

  const [showExternalSaveModal, setShowExternalSaveModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [user, setUser] = useState(null);
  const [showAgentHelpModal, setShowAgentHelpModal] = useState(null); // Stores the agent object for the help modal
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => startTour || (!startWizard && !localStorage.getItem('studio_welcome_seen')));
  const [expandedWelcomeFeature, setExpandedWelcomeFeature] = useState(null);
  const [autoStartVoice, setAutoStartVoice] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Project Wizard State
  const [showProjectWizard, setShowProjectWizard] = useState(startWizard || false);
  const [projectWizardStep, setProjectWizardStep] = useState(1);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    category: '',
    description: '',
    selectedAgents: []
  });

  // Profile & Stats State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState('details');
  // artistProfile moved to later declaration with persistence
  
  // Mock Stats for Profile
  const studioStats = {
    credits: 85,
    creations: 124,
    inProgress: 3,
    storage: { used: 4.2, total: 10, unit: 'GB' },
    lastLogin: new Date().toLocaleString(),
    mostUsedAgent: 'Beat Architect',
    agentVersions: {
      gemini: '1.5 Pro (Active)',
      claude: '3.5 Sonnet (Available)'
    }
  };

  const PROJECT_CATEGORIES = [
    { id: 'pro', label: 'Pro Studio', icon: Crown, desc: 'Full production suite', color: 'var(--color-purple)' },
    { id: 'vybing', label: 'Vybing', icon: Music, desc: 'Quick beat ideas', color: 'var(--color-cyan)' },
    { id: 'mixtapes', label: 'Mixtapes', icon: Disc, desc: 'Curated playlists', color: 'var(--color-orange)' },
    { id: 'video', label: 'Video', icon: Video, desc: 'Visual content', color: 'var(--color-pink)' },
    { id: 'scores', label: 'Scores', icon: FileMusic, desc: 'Cinematic composition', color: 'var(--color-emerald)' },
    { id: 'moves', label: 'Moves', icon: Activity, desc: 'Dance & Choreo', color: 'var(--color-yellow)' },
    { id: 'music_videos', label: 'Music Videos', icon: Film, desc: 'Full production clips', color: 'var(--color-red)' },
    { id: 'social', label: 'Social', icon: Share2, desc: 'Profile & Reach', color: 'var(--color-pink)' }
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
      date: new Date().toLocaleDateString(),
      status: 'Active',
      progress: 0,
      assets: [], // Store generated content here
      context: {}, // Shared context for MAS
      socialProfile: newProjectData.socialProfile || null
    };

    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject); // Auto-select the new project
    setShowProjectWizard(false);
    setProjectWizardStep(1);
    setNewProjectData({ name: '', category: '', description: '', selectedAgents: [], workflow: '' });
    
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

  const [artistProfile, setArtistProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_artist_profile');
      return saved ? JSON.parse(saved) : {
        name: 'Pro Creator',
        bio: 'Building the future of sound.',
        genre: 'Multi-Genre',
        location: 'Global',
        avatar: null
      };
    } catch (e) {
      return {
        name: 'Pro Creator',
        bio: 'Building the future of sound.',
        genre: 'Multi-Genre',
        location: 'Global',
        avatar: null
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('studio_artist_profile', JSON.stringify(artistProfile));
  }, [artistProfile]);

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
              <div className="marketing-card" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Social Status</h4>
                
                {selectedProject.socialProfile && (
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', color: 'white' }}>{selectedProject.socialProfile.handle}</span>
                      <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)' }}>{selectedProject.socialProfile.platform}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{selectedProject.socialProfile.bio}</p>
                  </div>
                )}

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
                 <button className="btn-text" style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--color-purple)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Generate Assets</button>
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
                          className="cta-button-premium haptic-press"
                          onClick={() => setShowProfileModal(true)}
                          style={{ minWidth: '220px', display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                          <User size={20} />
                          <span>Artist Profile & Stats</span>
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

                  {/* Artist Banner */}
                  <div className="artist-banner-section animate-fadeInUp" style={{ marginBottom: '2rem' }}>
                    <div className="artist-banner-card" style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(6, 182, 212, 0.1))',
                      border: '1px solid var(--border-color)',
                      borderRadius: '24px',
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Background Glow */}
                      <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-10%',
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
                        pointerEvents: 'none'
                      }}></div>

                      <div className="artist-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div className="artist-identity" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                          <div className="artist-avatar-large" style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '20px',
                            background: 'var(--gradient-vibrant)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            fontWeight: '800',
                            color: 'white',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                          }}>
                            {artistProfile.avatar ? <img src={artistProfile.avatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '20px', objectFit: 'cover' }} /> : artistProfile.name.charAt(0)}
                          </div>
                          <div>
                            <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, background: 'var(--gradient-vibrant)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                              {artistProfile.name}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>{artistProfile.bio}</p>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                              <span className="section-tag" style={{ fontSize: '0.7rem' }}>{artistProfile.genre}</span>
                              <span className="section-tag" style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>{artistProfile.location}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          className="btn-pill glass" 
                          onClick={() => setDashboardTab('settings')}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <Settings size={16} /> Edit Profile
                        </button>
                      </div>

                      <div className="artist-stats-row" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                        gap: '1rem',
                        marginTop: '1rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div className="stat-box">
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Active Agents</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>{managedAgents.filter(a => a.visible).length}</div>
                        </div>
                        <div className="stat-box">
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Projects</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>{projects.length}</div>
                        </div>
                        <div className="stat-box">
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Ecosystem</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>Live</div>
                        </div>
                        <div className="stat-box">
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Plan</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-purple)' }}>Pro</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-grid">

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
                          <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>100 Credits / Month</span></li>
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
                  <div className="section-header-simple" style={{ marginBottom: '2rem' }}>
                    <h2>Profile Settings</h2>
                    <p>Manage your artist identity.</p>
                  </div>

                  <div className="settings-list" style={{ marginBottom: '3rem' }}>
                    <div className="setting-row" style={{ display: 'block' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Artist Name</label>
                      <input 
                        type="text" 
                        className="studio-input" 
                        value={artistProfile.name}
                        onChange={(e) => setArtistProfile({...artistProfile, name: e.target.value})}
                        style={{ width: '100%', padding: '0.75rem', background: 'var(--color-bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'white' }}
                      />
                    </div>
                    <div className="setting-row" style={{ display: 'block' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Bio / Tagline</label>
                      <input 
                        type="text" 
                        className="studio-input" 
                        value={artistProfile.bio}
                        onChange={(e) => setArtistProfile({...artistProfile, bio: e.target.value})}
                        style={{ width: '100%', padding: '0.75rem', background: 'var(--color-bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'white' }}
                      />
                    </div>
                    <div className="setting-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: 'none', padding: 0 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Genre</label>
                        <input 
                          type="text" 
                          className="studio-input" 
                          value={artistProfile.genre}
                          onChange={(e) => setArtistProfile({...artistProfile, genre: e.target.value})}
                          style={{ width: '100%', padding: '0.75rem', background: 'var(--color-bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'white' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Location</label>
                        <input 
                          type="text" 
                          className="studio-input" 
                          value={artistProfile.location}
                          onChange={(e) => setArtistProfile({...artistProfile, location: e.target.value})}
                          style={{ width: '100%', padding: '0.75rem', background: 'var(--color-bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'white' }}
                        />
                      </div>
                    </div>
                  </div>

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
                <div className="utility-controls" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="control-group">
                    <label>Genre / Style</label>
                    <select 
                      className="studio-select"
                      value={manualSettings.genre}
                      onChange={(e) => setManualSettings({...manualSettings, genre: e.target.value})}
                    >
                      <option>Hip Hop / Rap</option>
                      <option>Pop / Modern</option>
                      <option>R&B / Soul</option>
                      <option>Electronic / Dance</option>
                      <option>Rock / Alternative</option>
                      <option>Lo-Fi / Chill</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>AI Model</label>
                    <select 
                      className="studio-select"
                      value={manualSettings.model}
                      onChange={(e) => setManualSettings({...manualSettings, model: e.target.value})}
                    >
                      <option value="gemini">Gemini 1.5 Pro</option>
                      <option value="claude">Claude 3.5 Sonnet</option>
                      <option value="stable">Stable Audio 2.0</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Language</label>
                    <select 
                      className="studio-select"
                      value={manualSettings.language}
                      onChange={(e) => setManualSettings({...manualSettings, language: e.target.value})}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="ja">Japanese</option>
                      <option value="zh">Chinese (Mandarin)</option>
                      <option value="ko">Korean</option>
                      <option value="ru">Russian</option>
                      <option value="ar">Arabic</option>
                      <option value="hi">Hindi</option>
                      <option value="bn">Bengali</option>
                      <option value="pa">Punjabi</option>
                      <option value="jv">Javanese</option>
                      <option value="tr">Turkish</option>
                      <option value="vi">Vietnamese</option>
                      <option value="th">Thai</option>
                      <option value="nl">Dutch</option>
                      <option value="pl">Polish</option>
                      <option value="sv">Swedish</option>
                      <option value="da">Danish</option>
                      <option value="fi">Finnish</option>
                      <option value="no">Norwegian</option>
                      <option value="el">Greek</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Intensity / Mood</label>
                    <input 
                      type="range" 
                      className="studio-slider" 
                      min="1" 
                      max="10" 
                      value={manualSettings.intensity}
                      onChange={(e) => setManualSettings({...manualSettings, intensity: parseInt(e.target.value)})}
                      style={{ marginTop: '12px' }} 
                    />
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
              <div className="filter-group">
                {['All', 'Music Creation', 'Visual Identity', 'Career Growth'].map(filter => (
                  <button 
                    key={filter}
                    className={`filter-btn ${hubFilter === filter ? 'active' : ''}`}
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
          {
            title: 'Music Copyright 101',
            desc: 'Understanding the difference between Composition and Master Recording rights.',
            icon: Scale,
            type: 'Guide',
            details: 'There are two copyrights in every song: 1. The Composition (lyrics & melody), usually owned by songwriters/publishers. 2. The Master Recording (the audio file), usually owned by the label or performing artist. To get paid fully, you must register both. Use a PRO (Performance Rights Organization) like ASCAP or BMI for composition, and SoundExchange for digital performance royalties.'
          },
          {
            title: 'Split Sheet Template',
            desc: 'Standard agreement for documenting ownership percentages with collaborators.',
            icon: FileText,
            type: 'Template',
            details: 'A split sheet is a simple document that lists every person who contributed to a song and what percentage of the publishing they own. NEVER leave the studio without signing one. If you don\'t have a written agreement, copyright law often assumes equal ownership by default, which can lead to disputes later. Key fields: Song Title, Date, Writer Names, Publisher Names, PRO Affiliation, and Ownership %.'
          },
          {
            title: 'Sync Licensing Basics',
            desc: 'How to get your music placed in TV, Film, and Video Games.',
            icon: Tv,
            type: 'Guide',
            details: 'Sync (Synchronization) licensing is when your music is used in visual media. It requires approval from both the Master owner and the Composition owner. "One-stop" tracks (where you own both) are preferred by music supervisors for quick clearance. To pitch for sync: 1. Have instrumental versions ready. 2. Ensure metadata is clean. 3. Avoid uncleared samples. 4. Register with a sync agency or library.'
          },
          {
            title: 'AI & IP Rights',
            desc: 'Current legal landscape regarding AI-generated content and ownership.',
            icon: Shield,
            type: 'Whitepaper',
            details: 'As of 2025, the US Copyright Office has stated that purely AI-generated works without "sufficient human authorship" are not copyrightable. However, works that use AI as a tool but have significant human creative input (lyrics, arrangement, post-production) CAN be protected. We recommend documenting your human contribution to every track to ensure your IP is defensible.'
          }
        ];

        const AGENT_WHITEPAPERS = [
          {
            agent: 'Ghostwriter',
            model: 'Gemini 1.5 Pro',
            focus: 'Lyrical structure, rhyme schemes, and thematic consistency.',
            version: 'v2.4',
            icon: FileCode,
            title: 'Ghostwriter Technical Spec',
            desc: 'Architecture and fine-tuning details for the lyric generation engine.',
            details: 'Ghostwriter utilizes a fine-tuned version of Gemini 1.5 Pro, optimized on a dataset of 50,000+ hit songs across 12 genres. Key architectural features include: 1. Rhyme Density Analysis: Ensures complex multi-syllabic rhyme schemes. 2. Sentiment Mapping: Aligns lyrical tone with the user\'s specified mood. 3. Structure Enforcement: Strictly adheres to Verse-Chorus-Bridge formats unless instructed otherwise. Latency: <1.2s per stanza.'
          },
          {
            agent: 'Beat Architect',
            model: 'AudioLDM-2 / MusicGen',
            focus: 'Rhythmic patterns, drum synthesis, and genre-specific grooves.',
            version: 'v3.1',
            icon: Music,
            title: 'Beat Architect Technical Spec',
            desc: 'Deep learning model for drum synthesis and rhythmic pattern generation.',
            details: 'Beat Architect combines AudioLDM-2 for high-fidelity texture generation with a custom MusicGen transformer for rhythmic precision. It features a "Groove Quantization" layer that can inject "human" swing (0-100%) into generated MIDI patterns. The model is trained on individual drum hits (kicks, snares, hats) to allow for stem separation and individual kit piece replacement.'
          },
          {
            agent: 'Vocal Architect',
            model: 'Diff-SVC',
            focus: 'Vocal synthesis, harmony layering, and timbre transfer.',
            version: 'v1.8',
            icon: Mic,
            title: 'Vocal Architect Technical Spec',
            desc: 'Voice conversion and synthesis pipeline for realistic vocal performances.',
            details: 'Vocal Architect uses a Diffusion-based Singing Voice Conversion (Diff-SVC) model. It takes a reference audio input (or MIDI melody) and a target voice profile (e.g., "Soulful Female") to generate realistic vocals. The pipeline includes a "Breath Insertion" module to add natural breathing sounds between phrases, significantly reducing the "robotic" artifacting common in older TTS models.'
          },
          {
            agent: 'Mastering Lab',
            model: 'Ozone AI Core',
            focus: 'Dynamic range compression, EQ balancing, and loudness normalization.',
            version: 'v4.0',
            icon: Zap,
            title: 'Mastering Lab Technical Spec',
            desc: 'Automated mastering chain using predictive audio analysis.',
            details: 'Mastering Lab is not a generative model but an analytical one. It uses a spectral analysis engine to compare the user\'s mix against a database of 10,000 commercial releases. It then dynamically adjusts a chain of DSP plugins (EQ, Multiband Compressor, Limiter, Saturation) to match the target genre\'s frequency balance and integrated LUFS (Loudness Units Full Scale) standards.'
          }
        ];

        const PRODUCTION_TOOLS = [
          {
            name: 'Canva',
            desc: 'Design album art and social assets.',
            url: 'https://www.canva.com',
            icon: Image
          },
          {
            name: 'Figma',
            desc: 'Prototyping and layout for visual projects.',
            url: 'https://www.figma.com',
            icon: Layout
          },
          {
            name: 'Splice',
            desc: 'Royalty-free samples and loops.',
            url: 'https://splice.com',
            icon: Music
          },
          {
            name: 'DistroKid',
            desc: 'Music distribution to Spotify & Apple Music.',
            url: 'https://distrokid.com',
            icon: Globe
          }
        ];

        const SITE_MAP = [
          { section: 'Studio', items: ['Create Project', 'My Projects', 'Agent Grid'] },
          { section: 'Agents', items: ['Ghostwriter', 'Beat Architect', 'Vocal Architect', 'Social Pilot'] },
          { section: 'Hub', items: ['Project Dashboard', 'Marketing Plan', 'Distribution'] },
          { section: 'Wall', items: ['Community Feed', 'Trending', 'Collaboration'] }
        ];

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
          }
        ];

        return (
          <div className="resources-view animate-fadeInUp">
            <div className="resources-hero">
              <div className="resources-badge">Professional Suite</div>
              <h1>Creator Resources</h1>
              <p>Legal frameworks, technical whitepapers, and industry tools for the modern studio.</p>
            </div>

            <div className="resources-grid">
              {/* Legal & Business Section */}
              <section className="resource-section full-width">
                <div className="section-header">
                  <Briefcase size={24} className="text-gold" />
                  <h2>Legal & Business</h2>
                </div>
                <div className="resource-cards-grid">
                  {LEGAL_RESOURCES.map((item, i) => (
                    <div 
                      key={i} 
                      className="resource-card haptic-press"
                      onClick={() => setSelectedHelpItem(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="resource-icon-wrapper">
                        <item.icon size={24} />
                      </div>
                      <div className="resource-info">
                        <span className="resource-type">{item.type}</span>
                        <h3>{item.title}</h3>
                        <p>{item.desc}</p>
                        <button className="resource-action">
                          Read Guide <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Agent Whitepapers */}
              <section className="resource-section">
                <div className="section-header">
                  <FileCode size={24} className="text-cyan" />
                  <h2>Agent Whitepapers</h2>
                </div>
                <div className="whitepaper-list">
                  {AGENT_WHITEPAPERS.map((paper, i) => (
                    <div 
                      key={i} 
                      className="whitepaper-item haptic-press"
                      onClick={() => setSelectedHelpItem(paper)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="whitepaper-header">
                        <h3>{paper.agent}</h3>
                        <span className="version-badge">{paper.version}</span>
                      </div>
                      <div className="whitepaper-details">
                        <div className="detail-row">
                          <Cpu size={14} />
                          <span>Model: {paper.model}</span>
                        </div>
                        <p>{paper.focus}</p>
                      </div>
                      <button className="download-btn">
                        <Download size={14} /> Technical Spec
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* External Tools */}
              <section className="resource-section">
                <div className="section-header">
                  <Wrench size={24} className="text-purple" />
                  <h2>Production Tools</h2>
                </div>
                <div className="tools-list">
                  {PRODUCTION_TOOLS.map((tool, i) => (
                    <a key={i} href={tool.url} target="_blank" rel="noopener noreferrer" className="tool-item">
                      <div className="tool-icon">
                        <tool.icon size={20} />
                      </div>
                      <div className="tool-info">
                        <h4>{tool.name}</h4>
                        <p>{tool.desc}</p>
                      </div>
                      <ExternalLink size={16} className="external-icon" />
                    </a>
                  ))}
                </div>
              </section>

              {/* Help & Support */}
              <section className="resource-section full-width">
                <div className="section-header">
                  <CircleHelp size={24} className="text-pink" />
                  <h2>Help & Support</h2>
                </div>
                <div className="help-grid">
                  {HELP_ITEMS.map((item, i) => (
                    <div key={i} className="help-card" onClick={() => setSelectedHelpItem(item)}>
                      <div className="help-icon-wrapper">
                        <item.icon size={24} />
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>
                
                <div className="troubleshooting-accordion">
                  <h3>Common Issues</h3>
                  {TROUBLESHOOTING_GUIDE.slice(0, 4).map((guide, i) => (
                    <div key={i} className="troubleshoot-item">
                      <div className="troubleshoot-header">
                        <span className="troubleshoot-question">{guide.issue}</span>
                        <ChevronDown size={16} />
                      </div>
                      <p className="troubleshoot-answer">{guide.solution}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Site Map */}
              <section className="resource-section full-width">
                <div className="section-header">
                  <Map size={24} className="text-green" />
                  <h2>Application Site Map</h2>
                </div>
                <div className="sitemap-grid">
                  {SITE_MAP.map((area, i) => (
                    <div key={i} className="sitemap-column">
                      <h3>{area.section}</h3>
                      <ul>
                        {area.items.map((link, j) => (
                          <li key={j}>{link}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
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
        </nav>

        <div className="studio-nav-footer">
          <div className="user-profile-mini">
            <div className="user-avatar">
              {user?.photoURL && <img src={user.photoURL} alt="User" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />}
            </div>
            <div className="user-info">
              <p className="user-name">{isLoggedIn ? (user?.displayName || 'Pro Creator') : 'Guest Artist'}</p>
              <p className="user-status">{isLoggedIn ? 'Pro Plan' : 'Free Account'}</p>
              {isLoggedIn ? (
                <button 
                  className="sign-out-link" 
                  style={{ fontSize: '0.7rem', color: 'var(--color-red)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: '4px', textAlign: 'left' }}
                  onClick={() => auth && signOut(auth)}
                >
                  Sign Out
                </button>
              ) : (
                <button 
                  className="sign-in-link" 
                  style={{ fontSize: '0.7rem', color: 'var(--color-purple)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: '4px', textAlign: 'left' }}
                  onClick={() => setShowLoginModal(true)}
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
              <span>100 Credits</span>
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
              onClick={() => { setActiveTab('resources'); setSelectedAgent(null); }}
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

                <div className="player-visualizer">
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
                  ) : playingItem.videoUrl ? (
                    <video 
                      src={playingItem.videoUrl} 
                      controls 
                      autoPlay 
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
                      <audio 
                        src={playingItem.audioUrl} 
                        controls 
                        autoPlay 
                        className="player-audio"
                      />
                    </div>
                  )}
                </div>

                <div className="player-footer">
                  <div className="player-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button 
                      className="player-btn primary"
                      onClick={() => handleDownload(playingItem)}
                      title="Download"
                    >
                      <Download size={18} />
                      <span>Download</span>
                    </button>
                    <button 
                      className="player-btn secondary"
                      onClick={() => handleShareToFeed(playingItem)}
                      title="Share"
                    >
                      <Share2 size={18} />
                      <span>Share</span>
                    </button>
                    <button 
                      className="player-btn secondary"
                      onClick={() => {
                        const container = document.querySelector('.media-player-container');
                        if (container) {
                          container.classList.toggle('large-view');
                        }
                      }}
                      title="Toggle View Size"
                    >
                      <Maximize size={18} />
                      <span>View Size</span>
                    </button>
                  </div>
                </div>
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

      {/* Help Item Modal */}
      {selectedHelpItem && (
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 2100 }}>
          <div className="modal-content help-modal" style={{ maxWidth: '600px' }}>
            <button 
              className="modal-close"
              onClick={() => setSelectedHelpItem(null)}
            >
              <X size={24} />
            </button>
            <div className="help-modal-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div className="help-icon-large" style={{ 
                width: '80px', height: '80px', 
                background: 'rgba(168, 85, 247, 0.1)', 
                color: 'var(--color-purple)', 
                borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <selectedHelpItem.icon size={40} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>{selectedHelpItem.title}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{selectedHelpItem.desc}</p>
            </div>
            
            <div className="help-modal-body" style={{ 
              background: 'rgba(255,255,255,0.03)', 
              padding: '2rem', 
              borderRadius: '16px',
              lineHeight: '1.7',
              color: '#d1d5db'
            }}>
              {selectedHelpItem.details}
            </div>

            <div className="help-modal-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                className="cta-button-primary"
                onClick={() => setSelectedHelpItem(null)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

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
                  id: 'system',
                  icon: Database,
                  color: 'pink',
                  title: 'Powered by Elite Models',
                  shortDesc: 'Access the world\'s most advanced AI engines.',
                  fullDesc: 'Your studio is built on a multi-model architecture. We route your requests to the best-in-class engine for the job—whether it\'s Google Gemini 1.5 Pro for creative reasoning or Anthropic Claude 3.5 Sonnet for complex analysis. You always get the smartest response.',
                  stats: ['Gemini 1.5 Pro', 'Claude 3.5 Sonnet', 'Stable Audio 2.0']
                },
                {
                  id: 'credits',
                  icon: CreditCard,
                  color: 'emerald',
                  title: 'Smart Credit System',
                  shortDesc: 'Pay as you go. Clear pricing for every action.',
                  fullDesc: 'Every agent action uses credits. You start with 100 FREE credits. Complex tasks cost more than simple ones. Always know exactly what you\'re spending before you click generate.',
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
          <div className="modal-content credits-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', margin: '0 auto' }}>
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

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Primary Language</label>
                    <select 
                      className="studio-select" 
                      style={{ width: '100%' }}
                      value={newProjectData.language || 'en'}
                      onChange={(e) => setNewProjectData({...newProjectData, language: e.target.value})}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="ja">Japanese</option>
                      <option value="zh">Chinese (Mandarin)</option>
                      <option value="ko">Korean</option>
                      <option value="ru">Russian</option>
                      <option value="ar">Arabic</option>
                      <option value="hi">Hindi</option>
                      <option value="bn">Bengali</option>
                      <option value="pa">Punjabi</option>
                      <option value="jv">Javanese</option>
                      <option value="tr">Turkish</option>
                      <option value="vi">Vietnamese</option>
                      <option value="th">Thai</option>
                      <option value="nl">Dutch</option>
                      <option value="pl">Polish</option>
                      <option value="sv">Swedish</option>
                      <option value="da">Danish</option>
                      <option value="fi">Finnish</option>
                      <option value="no">Norwegian</option>
                      <option value="el">Greek</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Preferred AI Model</label>
                    <select 
                      className="studio-select" 
                      style={{ width: '100%' }}
                      value={newProjectData.model || 'gemini'}
                      onChange={(e) => setNewProjectData({...newProjectData, model: e.target.value})}
                    >
                      <option value="gemini">Gemini 1.5 Pro (Creative)</option>
                      <option value="claude">Claude 3.5 Sonnet (Analytical)</option>
                      <option value="stable">Stable Audio 2.0 (Sound)</option>
                    </select>
                  </div>

                  {newProjectData.category === 'social' && (
                    <div className="form-group animate-fadeIn" style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '12px', color: 'var(--color-pink)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Share2 size={16} /> Social Profile Setup
                      </label>
                      
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Handle / Username</label>
                          <input 
                            type="text" 
                            className="studio-input" 
                            placeholder="@username"
                            value={newProjectData.socialProfile?.handle || ''}
                            onChange={(e) => setNewProjectData({
                              ...newProjectData, 
                              socialProfile: { ...newProjectData.socialProfile, handle: e.target.value }
                            })}
                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bio / Description</label>
                          <textarea 
                            className="studio-input" 
                            placeholder="Short bio for your profile..."
                            value={newProjectData.socialProfile?.bio || ''}
                            onChange={(e) => setNewProjectData({
                              ...newProjectData, 
                              socialProfile: { ...newProjectData.socialProfile, bio: e.target.value }
                            })}
                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', minHeight: '60px', resize: 'vertical' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Platform Focus</label>
                          <select 
                            className="studio-select"
                            value={newProjectData.socialProfile?.platform || 'instagram'}
                            onChange={(e) => setNewProjectData({
                              ...newProjectData, 
                              socialProfile: { ...newProjectData.socialProfile, platform: e.target.value }
                            })}
                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                          >
                            <option value="instagram">Instagram</option>
                            <option value="tiktok">TikTok</option>
                            <option value="twitter">X (Twitter)</option>
                            <option value="youtube">YouTube</option>
                            <option value="linkedin">LinkedIn</option>
                          </select>
                        </div>
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
                        selectedAgents: ['video-creator', 'trend', 'collab']
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
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Video → Trends → Networking</div>
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

      {/* Artist Profile & Stats Modal */}
      {showProfileModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <div className="header-title">
                <User size={24} className="text-purple" />
                <h2>Artist Profile & Studio Stats</h2>
              </div>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-tabs">
              <button 
                className={`tab-btn ${profileTab === 'details' ? 'active' : ''}`}
                onClick={() => setProfileTab('details')}
              >
                Profile Details
              </button>
              <button 
                className={`tab-btn ${profileTab === 'stats' ? 'active' : ''}`}
                onClick={() => setProfileTab('stats')}
              >
                Studio Statistics
              </button>
              <button 
                className={`tab-btn ${profileTab === 'system' ? 'active' : ''}`}
                onClick={() => setProfileTab('system')}
              >
                System & Agents
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              {profileTab === 'details' && (
                <div className="profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      className="studio-input" 
                      value={artistProfile.name}
                      onChange={(e) => setArtistProfile({...artistProfile, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Artist Name</label>
                    <input 
                      type="text" 
                      className="studio-input" 
                      value={artistProfile.artistName}
                      onChange={(e) => setArtistProfile({...artistProfile, artistName: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Genre</label>
                    <input 
                      type="text" 
                      className="studio-input" 
                      value={artistProfile.genre}
                      onChange={(e) => setArtistProfile({...artistProfile, genre: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Specialty</label>
                    <input 
                      type="text" 
                      className="studio-input" 
                      value={artistProfile.specialty}
                      onChange={(e) => setArtistProfile({...artistProfile, specialty: e.target.value})}
                    />
                  </div>
                  <div className="form-group full-width" style={{ gridColumn: 'span 2' }}>
                    <label>Creative Preferences</label>
                    <textarea 
                      className="studio-input" 
                      rows="3"
                      value={artistProfile.preferences}
                      onChange={(e) => setArtistProfile({...artistProfile, preferences: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-section-title full-width" style={{ gridColumn: 'span 2', marginTop: '10px', marginBottom: '10px' }}>
                    <h4>Social Integrations</h4>
                  </div>
                  
                  <div className="form-group">
                    <label><Twitter size={14} style={{ display: 'inline', marginRight: '5px' }}/> Twitter / X</label>
                    <input 
                      type="text" 
                      className="studio-input" 
                      value={artistProfile.socials.twitter}
                      onChange={(e) => setArtistProfile({...artistProfile, socials: {...artistProfile.socials, twitter: e.target.value}})}
                    />
                  </div>
                  <div className="form-group">
                    <label><Instagram size={14} style={{ display: 'inline', marginRight: '5px' }}/> Instagram</label>
                    <input 
                      type="text" 
                      className="studio-input" 
                      value={artistProfile.socials.instagram}
                      onChange={(e) => setArtistProfile({...artistProfile, socials: {...artistProfile.socials, instagram: e.target.value}})}
                    />
                  </div>
                </div>
              )}

              {profileTab === 'stats' && (
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div className="stat-card-v2" style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div className="stat-icon" style={{ color: 'var(--color-purple)', marginBottom: '10px' }}><CreditCard size={24} /></div>
                    <h3>Credits</h3>
                    <div className="progress-bar-container" style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', margin: '10px 0' }}>
                      <div className="progress-fill" style={{ width: `${studioStats.credits}%`, background: 'var(--color-purple)', height: '100%', borderRadius: '4px' }}></div>
                    </div>
                    <p>{studioStats.credits} / 100 Available</p>
                  </div>

                  <div className="stat-card-v2" style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div className="stat-icon" style={{ color: 'var(--color-cyan)', marginBottom: '10px' }}><HardDrive size={24} /></div>
                    <h3>Storage</h3>
                    <div className="progress-bar-container" style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', margin: '10px 0' }}>
                      <div className="progress-fill" style={{ width: `${(studioStats.storage.used / studioStats.storage.total) * 100}%`, background: 'var(--color-cyan)', height: '100%', borderRadius: '4px' }}></div>
                    </div>
                    <p>{studioStats.storage.used}GB / {studioStats.storage.total}GB Used</p>
                  </div>

                  <div className="stat-card-v2" style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div className="stat-icon" style={{ color: 'var(--color-pink)', marginBottom: '10px' }}><Music size={24} /></div>
                    <h3>Creations</h3>
                    <h2 style={{ fontSize: '2rem', margin: '10px 0' }}>{studioStats.creations}</h2>
                    <p>Total Projects</p>
                  </div>

                  <div className="stat-card-v2" style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div className="stat-icon" style={{ color: 'var(--color-orange)', marginBottom: '10px' }}><Activity size={24} /></div>
                    <h3>In Progress</h3>
                    <h2 style={{ fontSize: '2rem', margin: '10px 0' }}>{studioStats.inProgress}</h2>
                    <p>Active Sessions</p>
                  </div>

                  <div className="stat-card-full" style={{ gridColumn: '1 / -1', background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: 'var(--text-secondary)' }}>Most Used Agent</h4>
                      <h3 style={{ color: 'var(--color-purple)' }}>{studioStats.mostUsedAgent}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h4 style={{ color: 'var(--text-secondary)' }}>Last Login</h4>
                      <p>{studioStats.lastLogin}</p>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'system' && (
                <div className="system-info-view">
                  <div className="info-banner" style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid var(--color-purple)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                    <h3 style={{ color: 'var(--color-purple)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Zap size={20} /> High-Performance Models Active
                    </h3>
                    <p style={{ marginTop: '8px', opacity: 0.9 }}>
                      Your studio is powered by the latest LLM technology to ensure top-tier creative output.
                    </p>
                  </div>

                  <div className="models-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="model-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div className="model-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="model-icon" style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" alt="Gemini" style={{ width: '24px' }} />
                        </div>
                        <div>
                          <h4>Google Gemini</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Primary Creative Engine</p>
                        </div>
                      </div>
                      <div className="model-status">
                        <span className="status-badge active" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '600' }}>
                          {studioStats.agentVersions.gemini}
                        </span>
                      </div>
                    </div>

                    <div className="model-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div className="model-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="model-icon" style={{ width: '40px', height: '40px', background: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '20px' }}>🤖</span>
                        </div>
                        <div>
                          <h4>Anthropic Claude</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Analytical & Coding Engine</p>
                        </div>
                      </div>
                      <div className="model-status">
                        <span className="status-badge available" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '600' }}>
                          {studioStats.agentVersions.claude}
                        </span>
                      </div>
                    </div>

                    <div className="model-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div className="model-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="model-icon" style={{ width: '40px', height: '40px', background: '#111', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '20px' }}>🎵</span>
                        </div>
                        <div>
                          <h4>Stable Audio</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>High-Fidelity Sound Generation</p>
                        </div>
                      </div>
                      <div className="model-status">
                        <span className="status-badge available" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '600' }}>
                          2.0 (Available)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cta-button-secondary" onClick={() => setShowProfileModal(false)}>
                Close
              </button>
              {profileTab === 'details' && (
                <button className="cta-button-premium" onClick={() => {
                  // Save logic would go here
                  setShowProfileModal(false);
                  alert("Profile updated successfully!");
                }}>
                  Save Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudioView;
