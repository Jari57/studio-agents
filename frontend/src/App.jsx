import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, Play, Pause, Rewind, ShoppingBag, Radio, ShieldAlert, Phone, Disc, Cpu, 
  X, Maximize2, Minus, FileText, Film, Mic, MessageSquare, Sparkles, Music, Video, 
  Share2, Heart, MessageCircle, CreditCard, Lock, Truck, CheckCircle, MapPin, 
  Calendar, Ticket, Flame, Search, Database, Globe, Newspaper, ExternalLink, User, 
  Hash, Grid, Headphones, Activity, Zap, Wallet, Power, Sliders, Briefcase, 
  RefreshCw, ToggleLeft, ToggleRight, Filter, Plus, Trash2, Edit2, Upload,
  Camera, TrendingUp, Users, Image as ImageIcon, Link as LinkIcon, Loader2,
  Info, Volume2, HelpCircle, Eye, Volume1, VolumeX, Feather, Copy, ChevronRight
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, arrayUnion, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/storage';

// --- FIREBASE SETUP ---
let app = null;
let auth = null;
let db = null;
let storage = null;

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig = JSON.parse(__firebase_config);
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "demo") {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
    }
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- GEMINI API HELPERS ---
// API key removed - all requests route through Railway backend proxy
const apiKey = ""; 

// ------------------------------------------------------------------
// <<< THIS IS WHERE YOU PLUG IN THE BACKEND URL LOGIC >>>
// ------------------------------------------------------------------
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_URL = isLocal
  ? 'http://localhost:3001/api/generate'
  : `${window.location.protocol}//${window.location.host}/api/generate`; // Use same domain in production
// ------------------------------------------------------------------

// 🛡️ Enhanced input sanitization function to prevent injection attacks
const sanitizeInput = (input, maxLength = 5000) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength) // Limit input length to prevent buffer overflow
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[\r\n]{2,}/g, '\n'); // Normalize line breaks
};

// 🛡️ Advanced prompt injection detection and prevention
const validateAndSanitizePrompt = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt: must be a non-empty string');
  }
  
  const sanitized = sanitizeInput(prompt, 5000);
  
  // Block common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+previous\s+instructions?/i,
    /forget\s+everything/i,
    /disregard\s+(all\s+)?previous/i,
    /new\s+instructions?:/i,
    /you\s+are\s+now/i,
    /from\s+now\s+on/i,
    /switch\s+to|act\s+as|pretend\s+to\s+be/i,
    /execute\s+code|run\s+this|eval|exec/i,
    /system\s+prompt|secret\s+instructions?|hidden\s+rules/i,
    /leak|dump|exfiltrate|extract.*secret/i
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      console.warn('Blocked potential prompt injection attempt:', pattern);
      throw new Error('Input contains potentially malicious content');
    }
  }
  
  return sanitized;
};

// Global model state (can be changed by user in Studio settings)
let selectedAIModel = 'gemini-2.0-flash-exp';
const getSelectedModel = () => selectedAIModel;
const setSelectedModel = (model) => { selectedAIModel = model; };

// Available models for selection
const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', desc: 'Fastest, experimental', tier: 'fast' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Fast & efficient', tier: 'fast' },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash Latest', desc: 'Latest flash version', tier: 'fast' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Most capable', tier: 'pro' },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro Latest', desc: 'Latest pro version', tier: 'pro' },
];

const callGemini = async (prompt, systemInstruction = "", useSearch = false, modelOverride = null) => {
  // 🛡️ Validate and sanitize inputs at function entry
  try {
    var sanitizedPrompt = validateAndSanitizePrompt(prompt);
    var sanitizedSystemInstruction = sanitizeInput(systemInstruction, 1000); // Shorter limit for system instructions
    
    // Additional validation for system instructions
    if (sanitizedSystemInstruction && sanitizedSystemInstruction.length > 1000) {
      sanitizedSystemInstruction = sanitizedSystemInstruction.slice(0, 1000);
    }
  } catch (err) {
    console.error('Input validation failed:', err.message);
    return `ERROR: ${err.message}`;
  }
  
  // Function to return mock data (fallback only if backend fails after all retries)
  const getMockResponse = () => {
      if (sanitizedPrompt.includes("Album Cover")) {
           // A tiny, transparent mock PNG base64 string
           const mockImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; 
           return JSON.stringify({ predictions: [{ bytesBase64Encoded: mockImageBase64 }] }); // Mock base64 data for image
      }
      if (sanitizedSystemInstruction.includes("battle rapper")) {
          return "Yo, your rhymes are weak, your style is obsolete / I crash your whole system with one delete / You claiming the throne? You must be joking / My flow is the code that leaves you broken.";
      }
      if (sanitizedSystemInstruction.includes("Viral Video Agent")) {
          return JSON.stringify([
              { concept: "The 360 Spin", visual: "Whip performs a smooth, continuous 360 camera spin, catching three different outfit changes.", trend: "Seamless Transition", shots: ["Wide shot 360 cam", "Close up on transition points"] },
              { concept: "Matrix Glitch", visual: "Whip freezes mid-move, the background glitches into neon data streams, and she 'reboots' to finish the bar.", trend: "Aesthetic Glitchcore", shots: ["High frame rate slow-mo", "Green screen overlay"] },
              { concept: "Phone Booth Cipher", visual: "Whip delivers bars inside an old NYC phone booth while neon rain streams down the glass.", trend: "Cinematic Mood", shots: ["Exterior low light", "Interior close-up on mic"] }
          ]);
      }
      if (sanitizedSystemInstruction.includes("crate digger")) {
          return JSON.stringify([
              { artist: "The Honey Drippers", track: "Impeach the President", year: "1973", desc: "Classic drum break used by everyone." },
              { artist: "Bob James", track: "Nautilus", year: "1974", desc: "Haunting keys, bassline crazy." },
              { artist: "Skull Snaps", track: "It's A New Day", year: "1973", desc: "Hardest drums in the game." }
          ]);
      }
      if (sanitizedSystemInstruction.includes("A&R")) {
          return JSON.stringify({ critique: "The flow is tight but needs more aggression. Hook is catchy, but the delivery needs more energy.", commercial: 8, street: 6 });
      }
      if (sanitizedSystemInstruction.includes("Whip Montez")) {
          return "Yo, I'm from the concrete jungle where dreams are made / But nightmares lurk in the shade / I hustle hard just to get paid / In this game of life, I never fade.\n\nBrooklyn stand up, we in the building / Stacking paper to the ceiling / This is how I'm feeling / Real talk, no concealing.";
      }
      return "DATA CORRUPTION. UNABLE TO PROCESS REQUEST.";
  };

  // Always try backend proxy first (no early simulation mode bailout)
  const delays = [1000, 2000, 4000, 8000, 16000];
  
  // Image generation also routes through backend proxy (was previously direct to Gemini)
  const modelToUse = modelOverride || getSelectedModel();
  
  if (prompt.includes("Album Cover")) {
    // Route through backend instead of direct API call
    for (let i = 0; i <= delays.length; i++) {
      try {
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: sanitizedPrompt, 
            systemInstruction: "Generate an album cover image description",
            model: modelToUse
          })
        });

        if (!response.ok) {
          if ((response.status === 429 || response.status >= 500) && i < delays.length) {
            await new Promise(resolve => setTimeout(resolve, delays[i]));
            continue;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return JSON.stringify(data);
      } catch (error) {
        console.error("Album art backend call failed:", error);
        if (i === delays.length) {
          return getMockResponse();
        }
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }
    }
  }


  // Route text generation through backend proxy (uses server-side API key)
  for (let i = 0; i <= delays.length; i++) {
    try {
      // 🛡️ Add timeout to prevent hanging requests under heavy load
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: sanitizedPrompt, 
          systemInstruction: sanitizedSystemInstruction,
          model: modelToUse
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && i < delays.length) {
          await new Promise(resolve => setTimeout(resolve, delays[i]));
          continue;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const output = data?.output ?? data?.message ?? data;
      return typeof output === "string" ? output : JSON.stringify(output);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout after 30 seconds - server may be overloaded');
      } else {
        console.error("Backend proxy call failed:", error);
      }
      if (i === delays.length) {
        return getMockResponse();
      }
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

// =============================================================================
// SUBSCRIPTION & TRIAL SYSTEM
// =============================================================================

// Pricing tiers for social media creators
const PRICING_TIERS = {
  free: {
    name: 'FREE TRIAL',
    price: 0,
    usesPerAgent: 3,
    audioSeconds: 10,
    features: [
      '3 uses per AI agent',
      '10 second voice output',
      'Basic STT input',
      'Session-based access'
    ],
    limitations: [
      'No saved creations',
      'No conversation history',
      'Watermarked exports'
    ]
  },
  creator: {
    name: 'CREATOR',
    price: 9.99,
    interval: 'month',
    usesPerAgent: 100,
    audioSeconds: 30,
    features: [
      '100 uses per agent/month',
      '30 second voice output',
      'Advanced STT with noise cancellation',
      'Save unlimited creations',
      'Export without watermarks',
      'Priority AI processing',
      'Conversation history'
    ],
    popular: true
  },
  studio: {
    name: 'STUDIO PRO',
    price: 24.99,
    interval: 'month',
    usesPerAgent: -1, // Unlimited
    audioSeconds: 60,
    features: [
      'Unlimited AI generations',
      '60 second voice output',
      'All Creator features',
      'API access for integrations',
      'Custom agent personalities',
      'Batch generation',
      'Team collaboration (up to 3)',
      'Priority support'
    ]
  }
};

// Enhanced subscription context with IP tracking
const SubscriptionContext = React.createContext(null);

const useSubscription = () => {
  const context = React.useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

const SubscriptionProvider = ({ children }) => {
  const [tier, setTier] = useState('free');
  const [usageByAgent, setUsageByAgent] = useState({});
  const [userEmail, setUserEmail] = useState(null);
  const [ipAddress, setIpAddress] = useState(null);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);
  const [savedCreations, setSavedCreations] = useState([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stripeCustomerId, setStripeCustomerId] = useState(null);

  // Check subscription status from backend
  const checkSubscriptionStatus = async (userId) => {
    if (!userId) return;
    
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const BACKEND_URL = isLocal ? 'http://localhost:3001' : '';
      
      const response = await fetch(`${BACKEND_URL}/api/stripe/subscription-status?userId=${userId}`);
      const data = await response.json();
      
      if (data.tier && data.tier !== 'free') {
        setTier(data.tier);
        setStripeCustomerId(data.customerId);
        if (data.expiresAt) {
          setSubscriptionExpiry(new Date(data.expiresAt));
        }
        console.log('✅ Subscription loaded:', data.tier);
      }
    } catch (err) {
      console.warn('Could not check subscription status:', err);
    }
  };

  // Open customer portal for managing subscription
  const openCustomerPortal = async (userId) => {
    if (!userId) return;
    
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const BACKEND_URL = isLocal ? 'http://localhost:3001' : '';
      
      const response = await fetch(`${BACKEND_URL}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          returnUrl: window.location.href
        })
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Could not open customer portal:', err);
    }
  };

  // Get IP address for trial tracking
  useEffect(() => {
    const fetchIP = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setIpAddress(data.ip);
        
        // Load usage for this IP from localStorage
        const storedUsage = localStorage.getItem(`studio_usage_${data.ip}`);
        if (storedUsage) {
          setUsageByAgent(JSON.parse(storedUsage));
        }
      } catch (err) {
        console.warn('Could not fetch IP, using session-based tracking');
        // Fallback to session-based tracking
        const sessionId = sessionStorage.getItem('studio_session_id') || crypto.randomUUID();
        sessionStorage.setItem('studio_session_id', sessionId);
        setIpAddress(sessionId);
        
        const storedUsage = localStorage.getItem(`studio_usage_${sessionId}`);
        if (storedUsage) {
          setUsageByAgent(JSON.parse(storedUsage));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIP();
  }, []);

  // Check for payment success in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      // Show success message (could be a toast)
      console.log('🎉 Payment successful! Subscription activated.');
      // Refresh subscription status
      if (auth?.currentUser?.uid) {
        setTimeout(() => checkSubscriptionStatus(auth.currentUser.uid), 1000);
      }
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
      console.log('Payment cancelled');
    }
  }, []);

  // NOTE: Duplicate auth listener disabled - auth handled in OSInterface
  // This was causing Studio to blink by triggering re-renders on every auth state change
  // useEffect(() => { /* disabled */ }, []);

  // Check if subscription is valid
  const isSubscriptionActive = () => {
    if (tier === 'free') return true; // Free tier always "active"
    if (!subscriptionExpiry) return false;
    return new Date() < subscriptionExpiry;
  };

  // Get remaining uses for an agent
  const getRemainingUses = (agentId) => {
    const tierConfig = PRICING_TIERS[tier];
    if (tierConfig.usesPerAgent === -1) return Infinity; // Unlimited
    
    const used = usageByAgent[agentId] || 0;
    return Math.max(0, tierConfig.usesPerAgent - used);
  };

  // Check if user can use an agent
  const canUseAgent = (agentId) => {
    if (!isSubscriptionActive() && tier !== 'free') {
      return false;
    }
    return getRemainingUses(agentId) > 0;
  };

  // Consume a use for an agent
  const consumeUse = (agentId) => {
    const newUsage = {
      ...usageByAgent,
      [agentId]: (usageByAgent[agentId] || 0) + 1
    };
    setUsageByAgent(newUsage);
    
    // Persist to localStorage with IP
    if (ipAddress) {
      localStorage.setItem(`studio_usage_${ipAddress}`, JSON.stringify(newUsage));
    }
    
    // Also persist to Firebase if logged in
    if (auth?.currentUser && db) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      updateDoc(userDocRef, { 
        [`agentUsage.${agentId}`]: (usageByAgent[agentId] || 0) + 1,
        lastUsed: serverTimestamp()
      }).catch(console.error);
    }
  };

  // Get audio limit in seconds based on tier
  const getAudioLimit = () => {
    return PRICING_TIERS[tier]?.audioSeconds || 10;
  };

  // Save a creation to Firebase
  const saveCreation = async (creation) => {
    if (tier === 'free') {
      setShowPaywall(true);
      return false;
    }
    
    if (!auth?.currentUser || !db) {
      console.warn('Must be logged in to save creations');
      return false;
    }
    
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const newCreation = {
        ...creation,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        agentId: creation.agentId
      };
      
      await updateDoc(userDocRef, {
        savedCreations: arrayUnion(newCreation)
      });
      
      setSavedCreations(prev => [...prev, newCreation]);
      return true;
    } catch (err) {
      console.error('Error saving creation:', err);
      return false;
    }
  };

  // Get saved creations for an agent
  const getCreationsForAgent = (agentId) => {
    return savedCreations.filter(c => c.agentId === agentId);
  };

  // Delete a saved creation
  const deleteCreation = async (creationId) => {
    if (!auth?.currentUser || !db) return false;
    
    try {
      const updatedCreations = savedCreations.filter(c => c.id !== creationId);
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, { savedCreations: updatedCreations });
      setSavedCreations(updatedCreations);
      return true;
    } catch (err) {
      console.error('Error deleting creation:', err);
      return false;
    }
  };

  const value = {
    tier,
    setTier,
    userEmail,
    ipAddress,
    usageByAgent,
    subscriptionExpiry,
    savedCreations,
    showPaywall,
    setShowPaywall,
    isLoading,
    isSubscriptionActive,
    getRemainingUses,
    canUseAgent,
    consumeUse,
    getAudioLimit,
    saveCreation,
    getCreationsForAgent,
    deleteCreation,
    checkSubscriptionStatus,
    openCustomerPortal,
    stripeCustomerId,
    PRICING_TIERS
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// =============================================================================
// ENHANCED AUTH COMPONENTS
// =============================================================================

// Password strength checker
const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    checks,
    score,
    isStrong: score >= 4,
    label: score <= 2 ? 'Weak' : score <= 3 ? 'Fair' : score <= 4 ? 'Good' : 'Strong',
    color: score <= 2 ? 'red' : score <= 3 ? 'yellow' : score <= 4 ? 'green' : 'cyan'
  };
};

// Email validation
const validateEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

// Paywall Modal Component
const PaywallModal = ({ onClose, onUpgrade, user }) => {
  const { PRICING_TIERS, tier: currentTier } = useSubscription();
  const [loading, setLoading] = useState(null); // Track which tier is loading
  const [error, setError] = useState('');

  const handleSubscribe = async (tierKey) => {
    // Free tier doesn't need payment
    if (tierKey === 'free') {
      onUpgrade('free');
      onClose();
      return;
    }

    // Must be logged in to subscribe
    if (!user?.uid) {
      setError('Please sign in first to subscribe');
      return;
    }

    setLoading(tierKey);
    setError('');

    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const BACKEND_URL = isLocal ? 'http://localhost:3001' : '';
      
      const response = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tierKey,
          userId: user.uid,
          userEmail: user.email,
          successUrl: `${window.location.origin}?payment=success`,
          cancelUrl: `${window.location.origin}?payment=cancelled`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Payment system unavailable');
    } finally {
      setLoading(null);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchEnd={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); onClose(); } }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 p-6 md:p-8 touch-manipulation" style={{WebkitOverflowScrolling: 'touch'}}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors touch-manipulation"
        >
          <X size={24} />
        </button>
        
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-cyan-400 text-xs uppercase tracking-[0.3em] mb-2">Upgrade Your Creative Arsenal</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">THE STUDIO</span>
          </h2>
          <p className="text-white/60 max-w-lg mx-auto">
            Built for social media creators who want AI-powered content creation at their fingertips.
          </p>
          {!user?.uid && (
            <p className="text-yellow-400 text-sm mt-2">⚠️ Sign in required to subscribe</p>
          )}
          {error && (
            <p className="text-red-400 text-sm mt-2 bg-red-900/20 px-4 py-2 rounded">❌ {error}</p>
          )}
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(PRICING_TIERS).map(([key, plan]) => (
            <div 
              key={key}
              className={`relative bg-black/60 border ${plan.popular ? 'border-cyan-500' : 'border-white/10'} p-6 transition-all hover:border-white/30`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-black text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-white font-bold text-xl mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                {plan.interval && <span className="text-white/40">/{plan.interval}</span>}
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
                {plan.limitations?.map((limitation, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm opacity-50">
                    <X size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/60">{limitation}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSubscribe(key)}
                disabled={key === currentTier || loading === key}
                className={`w-full py-3 font-bold uppercase tracking-wider transition-all ${
                  key === currentTier 
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-black hover:shadow-[0_0_30px_rgba(0,255,255,0.4)]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                } ${loading === key ? 'opacity-50 cursor-wait' : ''}`}
              >
                {loading === key ? 'CONNECTING...' : key === currentTier ? 'Current Plan' : key === 'free' ? 'Start Free' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
        
        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mt-8 text-white/40 text-xs">
          <Lock size={12} />
          <span>Secure payment via Stripe • Cancel anytime</span>
        </div>
      </div>
    </div>
  );
};

// Shared free-usage limiter for AI agents (client-side tracking, per browser)
const useFreeLimit = (agentKey, limit = 3) => {
  const [usage, setUsage] = useState(0);

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(agentKey));
      if (Number.isFinite(stored)) setUsage(stored);
    } catch (err) {
      console.warn(`Usage load failed for ${agentKey}`, err);
    }
  }, [agentKey]);

  const consume = () => {
    const next = usage + 1;
    setUsage(next);
    try {
      localStorage.setItem(agentKey, String(next));
    } catch (err) {
      console.warn(`Usage persist failed for ${agentKey}`, err);
    }
  };

  const reset = () => {
    setUsage(0);
    try {
      localStorage.removeItem(agentKey);
    } catch (err) {
      console.warn(`Usage reset failed for ${agentKey}`, err);
    }
  };

  return { usage, limit, canUse: usage < limit, consume, reset };
};

// Voice recognition hook for speech-to-text
const useVoiceInput = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onResult]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, isSupported, startListening, stopListening };
};

// Text-to-Speech Hook
const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = (text) => {
    if (!isSupported || !text) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return { speak, stop, isSpeaking, isSupported };
};

// Helper function to save generations to Firestore
const saveToLibrary = async (user, type, content, metadata = {}) => {
  if (!user || user.isAnonymous) {
    const shouldSignIn = confirm('Sign in to save your creations to your library. Continue to sign in?');
    if (shouldSignIn) {
      return 'auth_required';
    }
    return null;
  }

  if (!db) {
    alert('Save feature not available in demo mode');
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, 'user_library'), {
      userId: user.uid,
      type: type, // 'album_art', 'video_concept', 'lyrics', 'battle', 'samples', etc.
      content: content,
      metadata: {
        ...metadata,
        userEmail: user.email,
      },
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Save failed:', error);
    throw error;
  }
};

// --- COMPONENTS ---

// 0. REIMAGINED LIVEWIRE LOGO (VECTOR STYLE)
const LivewireLogo = () => (
  <div className="flex flex-col items-end group cursor-pointer select-none pl-4 md:pl-8">
    <div className="relative">
      <div className="absolute -inset-6 md:-inset-10 bg-green-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black italic tracking-tighter text-white transform -skew-x-12 leading-[0.85] group-hover:text-green-50 transition-colors" 
            style={{ textShadow: '2px 2px 0px #000, 0 0 15px rgba(0,255,65,0.3)' }}>
          LIVEWIRE
        </h1>
      </div>
      <span className="text-[8px] md:text-[10px] font-mono font-bold tracking-[0.25em] md:tracking-[0.35em] text-gray-500 uppercase mt-2 md:mt-4 mr-1 group-hover:text-[#00ff41] transition-colors block text-right z-20">
        ENTERTAINMENT NYC
      </span>
    </div>
  </div>
);

// 1. BOOT SEQUENCE
const BootSequence = ({ onComplete }) => {
  const [lines, setLines] = useState([]);
  
  const bootSequenceData = [
    { text: "MONTEZ SYSTEMS BIOS v2.0 [NYC_CORE]", style: "text-[#00ff41]" },
    { text: "COPYRIGHT (C) 1999-2004 LIVEWIRE ENTERTAINMENT", style: "text-[#00ff41]" },
    { text: "CPU: INTEL PENTIUM 4 3.2GHz [OVERCLOCKED]", style: "text-[#00ff41]" },
    { text: "MEMORY TEST: 1024MB OK", style: "text-[#00ff41]" },
    { text: "DETECTING PRIMARY MASTER ... WDC WD800BB", style: "text-[#00ff41]" },
    { text: "LOADING KERNEL... [OK]", style: "text-[#00ff41]" },
    { text: "MOUNTING VOLUME: 'THE STOOP'...", style: "text-[#00ff41]" },
    { text: "SEARCHING DIRECTORY: /MUSIC/ALBUMS/...", style: "text-[#00ff41]" },
    { text: "ACCESSING: 'FEMALE HUSTLE' MASTER TAPES...", style: "text-yellow-500 animate-pulse" },
    { text: "CRITICAL ERROR: ALBUM 'FEMALE HUSTLE' NOT FOUND.", style: "text-red-600 font-black text-2xl tracking-widest glitch-text" },
    { text: "FILE CORRUPTION DETECTED AT SECTOR 7G.", style: "text-red-500" },
    { text: "INITIATING RECOVERY PROTOCOL...", style: "text-yellow-500" },
    { text: "RESTORING FRAGMENTS FROM CACHE...", style: "text-[#00ff41]" },
    { text: "LOADING USER INTERFACE...", style: "text-[#00ff41]" },
    { text: "SYSTEM READY.", style: "text-[#00ff41] bg-black border border-[#00ff41] inline-block px-2" }
  ];

  useEffect(() => {
    let delay = 0;
    const timeouts = []; // Store timeouts to clear them

    bootSequenceData.forEach((item, index) => {
      const isError = item.text.includes("ERROR");
      const isRecovery = item.text.includes("RECOVERY");
      
      const stepDelay = isError ? 1500 : isRecovery ? 2000 : Math.random() * 300 + 100;
      delay += stepDelay;

      const timeoutId = setTimeout(() => {
        setLines(prev => [...prev, item]);
        const el = document.getElementById('boot-log');
        if(el) el.scrollTop = el.scrollHeight;
        
        if (index === bootSequenceData.length - 1) {
          const finalTimeoutId = setTimeout(onComplete, 1200);
          timeouts.push(finalTimeoutId);
        }
      }, delay);
      
      timeouts.push(timeoutId);
    });

    // Cleanup function to prevent duplication in StrictMode/Remounts
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []); // Run only once on mount

  return (
    <div className="h-screen w-full bg-black flex flex-col justify-start p-4 sm:p-6 md:p-10 font-mono text-sm sm:text-base md:text-xl z-50 absolute top-0 left-0 overflow-hidden">
      <div id="boot-log" className="overflow-y-auto h-full space-y-1">
        {lines.map((line, i) => (
          <div key={i} className={`typing-effect ${line.style}`}>
            {`> ${line.text}`}
          </div>
        ))}
        <div className="w-2 h-3 sm:w-3 sm:h-5 bg-[#00ff41] animate-pulse inline-block ml-2"></div>
      </div>
    </div>
  );
};

// Background Carousel Component
const BackgroundCarousel = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const defaultImages = [
    'https://images.unsplash.com/photo-1601933470096-0e346346c792?w=1600&h=900&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555353540-64580b51c258?w=1600&h=900&fit=crop&q=80',
  ];

  const displayImages = images && images.length > 0 ? images : defaultImages;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
    }, 8000); 

    return () => clearInterval(interval);
  }, [displayImages.length]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {displayImages.map((img, index) => (
        <img
          key={index}
          src={img}
          alt={`Background ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover object-center ken-burns-anim transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          } filter grayscale brightness-50 contrast-125 sepia-25`}
        />
      ))}
      <div className="absolute inset-0 bg-black/70 z-20"></div>
    </div>
  );
};

// ============================================================================
// AGENT CONTAINER - Consistent wrapper for all AI agents
// ============================================================================
const AgentContainer = ({ 
  title, 
  icon: Icon, 
  accentColor = 'cyan', 
  children,
  headerExtra = null 
}) => {
  // Unique color configurations for each agent - all distinct!
  const colorConfig = {
    // GHOSTWRITER / ALBUM ART - Electric Cyan/Aqua
    cyan: { 
      border: 'border-cyan-400/60', 
      headerBg: 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-400', 
      shadow: 'shadow-[0_0_50px_rgba(0,255,255,0.3)]',
      glow: 'from-cyan-900/50',
      topBorder: 'from-cyan-300 via-sky-300 to-blue-300',
      accent: '#00ffff'
    },
    // LYRIC RECOVERY - Hot Magenta/Fuchsia
    magenta: { 
      border: 'border-fuchsia-400/60', 
      headerBg: 'bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-400', 
      shadow: 'shadow-[0_0_50px_rgba(217,70,239,0.3)]',
      glow: 'from-fuchsia-900/50',
      topBorder: 'from-fuchsia-300 via-pink-300 to-rose-300',
      accent: '#d946ef'
    },
    // RAP BATTLE - Crimson Fire
    crimson: { 
      border: 'border-red-500/60', 
      headerBg: 'bg-gradient-to-r from-red-600 via-rose-500 to-orange-500', 
      shadow: 'shadow-[0_0_50px_rgba(220,38,38,0.3)]',
      glow: 'from-red-900/50',
      topBorder: 'from-red-400 via-rose-400 to-orange-400',
      accent: '#dc2626'
    },
    // CRATE DIGGER - Deep Ocean Indigo
    indigo: { 
      border: 'border-indigo-400/60', 
      headerBg: 'bg-gradient-to-r from-indigo-600 via-blue-500 to-violet-500', 
      shadow: 'shadow-[0_0_50px_rgba(99,102,241,0.3)]',
      glow: 'from-indigo-900/50',
      topBorder: 'from-indigo-300 via-blue-300 to-violet-300',
      accent: '#6366f1'
    },
    // AR SUITE - Royal Gold
    gold: { 
      border: 'border-amber-400/60', 
      headerBg: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-400', 
      shadow: 'shadow-[0_0_50px_rgba(245,158,11,0.3)]',
      glow: 'from-amber-900/50',
      topBorder: 'from-amber-300 via-yellow-200 to-orange-300',
      accent: '#f59e0b'
    },
    // TREND HUNTER - Ultraviolet Purple
    ultraviolet: { 
      border: 'border-violet-400/60', 
      headerBg: 'bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500', 
      shadow: 'shadow-[0_0_50px_rgba(139,92,246,0.3)]',
      glow: 'from-violet-900/50',
      topBorder: 'from-violet-300 via-purple-300 to-fuchsia-300',
      accent: '#8b5cf6'
    },
    // VIRAL VIDEO - Sunset Coral
    coral: { 
      border: 'border-orange-400/60', 
      headerBg: 'bg-gradient-to-r from-orange-500 via-red-400 to-pink-500', 
      shadow: 'shadow-[0_0_50px_rgba(249,115,22,0.3)]',
      glow: 'from-orange-900/50',
      topBorder: 'from-orange-300 via-red-300 to-pink-300',
      accent: '#f97316'
    },
    // SONGWRITERS STUDIO - Matrix Neon Green
    neon: { 
      border: 'border-[#00ff41]/60', 
      headerBg: 'bg-gradient-to-r from-emerald-500 via-green-400 to-lime-400', 
      shadow: 'shadow-[0_0_50px_rgba(0,255,65,0.3)]',
      glow: 'from-emerald-900/50',
      topBorder: 'from-emerald-300 via-green-300 to-lime-300',
      accent: '#00ff41'
    },
    // Legacy colors for backwards compatibility
    pink: { 
      border: 'border-pink-500/50', 
      headerBg: 'bg-gradient-to-r from-pink-600 via-rose-500 to-red-500', 
      shadow: 'shadow-[0_0_40px_rgba(236,72,153,0.25)]',
      glow: 'from-pink-950/40',
      topBorder: 'from-pink-400 via-rose-400 to-red-400',
      accent: '#ec4899'
    },
    red: { 
      border: 'border-red-500/50', 
      headerBg: 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500', 
      shadow: 'shadow-[0_0_40px_rgba(239,68,68,0.25)]',
      glow: 'from-red-950/40',
      topBorder: 'from-red-400 via-orange-400 to-amber-400',
      accent: '#ef4444'
    },
    blue: { 
      border: 'border-blue-500/50', 
      headerBg: 'bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500', 
      shadow: 'shadow-[0_0_40px_rgba(59,130,246,0.25)]',
      glow: 'from-blue-950/40',
      topBorder: 'from-blue-400 via-indigo-400 to-purple-400',
      accent: '#3b82f6'
    },
    yellow: { 
      border: 'border-yellow-500/50', 
      headerBg: 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500', 
      shadow: 'shadow-[0_0_40px_rgba(234,179,8,0.25)]',
      glow: 'from-yellow-950/40',
      topBorder: 'from-yellow-300 via-amber-400 to-orange-400',
      accent: '#eab308'
    },
    violet: { 
      border: 'border-violet-500/50', 
      headerBg: 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600', 
      shadow: 'shadow-[0_0_40px_rgba(139,92,246,0.25)]',
      glow: 'from-violet-950/40',
      topBorder: 'from-violet-400 via-fuchsia-400 to-pink-400',
      accent: '#8b5cf6'
    },
    green: { 
      border: 'border-[#00ff41]/50', 
      headerBg: 'bg-gradient-to-r from-emerald-600 via-[#00cc33] to-[#00ff41]', 
      shadow: 'shadow-[0_0_40px_rgba(0,255,65,0.25)]',
      glow: 'from-[#002200]',
      topBorder: 'from-emerald-400 via-green-400 to-[#00ff41]',
      accent: '#00ff41'
    }
  };

  const colors = colorConfig[accentColor] || colorConfig.cyan;

  return (
    <div className="h-full w-full relative flex items-center justify-center p-2 md:p-4 overflow-hidden bg-gradient-to-br from-black via-[#0a0a0a] to-[#050505]" style={{WebkitOverflowScrolling: 'touch'}}>
      {/* Radial gradient background glow */}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${colors.glow} via-black to-black pointer-events-none`}></div>
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-radial from-current to-transparent rounded-full blur-3xl animate-pulse" style={{color: accentColor === 'green' ? '#00ff41' : accentColor}}></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-radial from-current to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s', color: accentColor === 'green' ? '#00ff41' : accentColor}}></div>
      </div>
      
      {/* Main content card - consistent sizing */}
      <div className={`relative z-10 w-full max-w-4xl h-full max-h-[calc(100vh-120px)] bg-[#0d0d0d]/95 backdrop-blur-xl border ${colors.border} ${colors.shadow} flex flex-col overflow-hidden rounded-lg`}>
        {/* Gradient top border accent - like TrendHunter */}
        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${colors.topBorder}`}></div>
        
        {/* Consistent header bar */}
        <div className={`${colors.headerBg} text-white px-4 py-2.5 flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="opacity-90 drop-shadow-lg"/>}
            <span className="font-bold text-sm tracking-wide drop-shadow-lg">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {headerExtra}
          </div>
        </div>
        
        {/* Content area - fills remaining space */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{WebkitOverflowScrolling: 'touch'}}>
          {children}
        </div>
        
        {/* Bottom glow effect */}
        <div className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t ${colors.glow} to-transparent pointer-events-none opacity-50`}></div>
      </div>
    </div>
  );
};

// 2. HOME
const Home = ({ setSection }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  // AI Agent widgets (the Studio tools)
  const agentWidgets = [
    {
      id: 'ghostwriter',
      title: 'GHOST',
      subtitle: 'AI Lyric Engine',
      icon: Sparkles,
      color: '#00ff41',
      action: () => setSection('ghostwriter')
    },
    {
      id: 'chat',
      title: 'CIPHER',
      subtitle: 'AI Conversation',
      icon: MessageSquare,
      color: '#06b6d4',
      action: () => setSection('chat')
    },
    {
      id: 'battle',
      title: 'BATTLE',
      subtitle: 'Rap Competition',
      icon: Mic,
      color: '#ec4899',
      action: () => setSection('battle')
    },
    {
      id: 'ar_suite',
      title: 'A&R',
      subtitle: 'Artist Development',
      icon: User,
      color: '#a855f7',
      action: () => setSection('ar_suite')
    },
    {
      id: 'crates',
      title: 'CRATE',
      subtitle: 'Sample Discovery',
      icon: Disc,
      color: '#eab308',
      action: () => setSection('crates')
    },
    {
      id: 'viral_video',
      title: 'VIRAL',
      subtitle: 'Video Concepts',
      icon: Video,
      color: '#ef4444',
      action: () => setSection('viral_video')
    }
  ];

  // Navigation widgets (site sections)
  const navWidgets = [
    {
      id: 'bio',
      title: 'BIO',
      subtitle: 'Artist Profile',
      description: 'The complete story of Whip Montez',
      icon: User,
      color: '#00ff41',
      action: () => setSection('bio')
    },
    {
      id: 'music',
      title: 'AUDIO',
      subtitle: 'Lost Tapes',
      description: 'Stream unreleased tracks & albums',
      icon: Music,
      color: '#f97316',
      action: () => { console.log('Navigating to music'); setSection('music'); }
    },
    {
      id: 'news',
      title: 'NEWS',
      subtitle: 'The Feed',
      description: 'Live hip-hop news & updates',
      icon: Newspaper,
      color: '#06b6d4',
      action: () => setSection('news')
    },
    {
      id: 'community',
      title: 'COMMUNITY',
      subtitle: 'The Block',
      description: 'Connect with other fans',
      icon: Users,
      color: '#a855f7',
      action: () => setSection('community')
    },
    {
      id: 'comeup',
      title: 'COME UP',
      subtitle: 'Mentorship',
      description: 'Learn from the journey',
      icon: TrendingUp,
      color: '#10b981',
      action: () => setSection('comeup')
    },
    {
      id: 'studio',
      title: 'STUDIO',
      subtitle: 'AI Tools',
      description: 'All 8 AI agents in one place',
      icon: Sparkles,
      color: '#ec4899',
      action: () => setSection('studio')
    }
  ];

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden flex flex-col bg-black" style={{WebkitOverflowScrolling: 'touch'}}>
      
      <div className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 min-h-full max-w-[1600px] mx-auto w-full">
        
        {/* Hero Section - Whip Montez Branding */}
        <div className="flex flex-col md:flex-row justify-between items-start w-full mb-8 md:mb-12">
          <div className="mb-6 md:mb-0">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#00ff41]/60 mb-2">
              Alternative Reality Experience
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-thin text-[#00ff41] tracking-tighter leading-[0.9] mb-4" style={{textShadow: '0 0 40px rgba(0,255,65,0.4)'}}>
              WHIP<br/>MONTEZ
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-12 bg-[#00ff41]/40"></div>
              <p className="text-white/50 text-xs tracking-[0.2em] font-mono">RESTORED OS • 2004</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <div className="text-right">
              <p className="text-[#00ff41] text-2xl md:text-3xl font-thin tracking-tight" style={{textShadow: '0 0 20px rgba(0,255,65,0.4)'}}>LIVEWIRE</p>
              <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase">Entertainment NYC</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse"></div>
              <span className="text-[#00ff41]/70 text-xs font-mono">SYSTEM ONLINE</span>
            </div>
          </div>
        </div>

        {/* ARE Introduction Section */}
        <div className="mb-10 md:mb-14">
          <div className="bg-[#050505] border border-[#00ff41]/20 rounded-lg p-6 md:p-8" style={{boxShadow: '0 0 40px rgba(0,255,65,0.05)'}}>
            <div className="flex flex-col md:flex-row gap-6 md:gap-10">
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-light text-white mb-3">Welcome to the Restored OS</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Step into an <span className="text-[#00ff41]">Alternative Reality Experience</span> that resurrects a lost moment in hip-hop history. Whip Montez was a real Brooklyn MC on the verge of breaking through in the early 2000s—collaborating with Erick Sermon and Talib Kweli before her debut album vanished into obscurity.
                </p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  This digital time capsule reconstructs what should have been—the website, the streaming presence, the interactive fan experience that Whip Montez deserved but never had.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:w-64">
                <button 
                  onClick={() => setSection('bio')}
                  className="bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] px-4 py-3 text-sm font-medium rounded hover:bg-[#00ff41]/20 hover:border-[#00ff41]/50 transition-all flex items-center justify-center gap-2"
                >
                  <User size={16} /> Discover Her Story
                </button>
                <button 
                  onClick={() => setSection('music')}
                  className="bg-white/5 border border-white/10 text-white/70 px-4 py-3 text-sm font-medium rounded hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <Music size={16} /> Listen to Lost Tapes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Widgets - Site Sections */}
        <div className="mb-10 md:mb-14">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-white/80 text-sm font-medium uppercase tracking-wider">Explore</h3>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {navWidgets.map((widget) => (
              <div 
                key={widget.id}
                onClick={widget.action}
                onTouchEnd={(e) => { e.preventDefault(); widget.action(); }}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), widget.action())}
                tabIndex={0}
                role="button"
                aria-label={`${widget.title} - ${widget.description}`}
                className="group relative bg-[#0a0a0a] border border-white/10 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:border-opacity-50 overflow-hidden touch-manipulation active:scale-95 active:opacity-80"
                style={{ 
                  '--widget-color': widget.color,
                  boxShadow: hoveredItem === widget.id ? `0 0 30px ${widget.color}20` : 'none'
                }}
                onMouseEnter={() => setHoveredItem(widget.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="relative z-10">
                  <widget.icon 
                    size={24} 
                    className="mb-3 transition-all duration-300 group-hover:scale-110"
                    style={{ color: widget.color, opacity: hoveredItem === widget.id ? 1 : 0.7 }}
                  />
                  <h4 className="text-white font-medium text-sm mb-1 group-hover:text-white transition-colors">{widget.title}</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider" style={{ color: hoveredItem === widget.id ? widget.color : undefined, opacity: hoveredItem === widget.id ? 0.8 : 1 }}>
                    {widget.subtitle}
                  </p>
                </div>
                
                {/* Hover glow effect */}
                <div 
                  className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ backgroundColor: widget.color }}
                ></div>
                
                {/* Border glow on hover */}
                <div 
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${widget.color}40` }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Studio Agents */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-white/80 text-sm font-medium uppercase tracking-wider">AI Studio</h3>
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <button 
              onClick={() => setSection('studio')}
              className="text-[10px] text-[#00ff41]/70 hover:text-[#00ff41] transition-colors uppercase tracking-wider flex items-center gap-1"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {agentWidgets.map((widget, i) => (
              <div 
                key={widget.id}
                onClick={widget.action}
                onTouchEnd={(e) => { e.preventDefault(); widget.action(); }}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), widget.action())}
                tabIndex={0}
                role="button"
                aria-label={`${widget.title} - ${widget.subtitle}`}
                className="group relative bg-[#0a0a0a] border border-white/10 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:border-opacity-50 overflow-hidden touch-manipulation active:scale-95 active:opacity-80"
                style={{ 
                  '--widget-color': widget.color,
                  boxShadow: hoveredItem === `agent-${widget.id}` ? `0 0 30px ${widget.color}20` : 'none'
                }}
                onMouseEnter={() => setHoveredItem(`agent-${widget.id}`)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="absolute top-2 right-2 text-[9px] font-mono text-gray-600 group-hover:text-gray-400 transition-colors">
                  {String(i + 1).padStart(2, '0')}
                </div>
                
                <div className="relative z-10">
                  <widget.icon 
                    size={20} 
                    className="mb-3 transition-all duration-300 group-hover:scale-110"
                    style={{ color: widget.color, opacity: hoveredItem === `agent-${widget.id}` ? 1 : 0.7 }}
                  />
                  <h4 className="text-white font-medium text-sm mb-1">{widget.title}</h4>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider" style={{ color: hoveredItem === `agent-${widget.id}` ? widget.color : undefined, opacity: hoveredItem === `agent-${widget.id}` ? 0.8 : 1 }}>
                    {widget.subtitle}
                  </p>
                </div>
                
                {/* Hover glow effect */}
                <div 
                  className="absolute -bottom-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ backgroundColor: widget.color }}
                ></div>
                
                {/* Border glow on hover */}
                <div 
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${widget.color}40` }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-600">
            <p>WHIP MONTEZ RESTORED OS • ALTERNATIVE REALITY EXPERIENCE • 2025</p>
            <p className="font-mono">LIVEWIRE ENTERTAINMENT NYC</p>
          </div>
        </div>

      </div>
    </div>
  );
};

// 4. BIO SECTION
const Bio = ({ setSection, user = null }) => {
  const [viewMode, setViewMode] = useState('bio'); // 'bio', 'memory', or 'story'
  const [photos, setPhotos] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadAsFeatured, setUploadAsFeatured] = useState(false);
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load photos from Firebase on mount
  useEffect(() => {
    if (!db) return;
    
    const loadPhotos = async () => {
      try {
        const photosRef = collection(db, 'memoryLane');
        const q = query(photosRef, orderBy('uploadedAt', 'desc'));
        const snapshot = await getDocs(q);
        const photoList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPhotos(photoList);
        
        // Filter featured photos for Bio section
        const featured = photoList.filter(p => p.featured).slice(0, 6);
        setFeaturedPhotos(featured);
      } catch (err) {
        // Silent fail - photos will remain empty
      }
    };
    
    loadPhotos();
  }, []);

  // Toggle featured status
  const toggleFeatured = async (photoId, currentStatus) => {
    if (!db) return;
    try {
      const photoRef = doc(db, 'memoryLane', photoId);
      await updateDoc(photoRef, { featured: !currentStatus });
      
      // Reload photos
      const photosRef = collection(db, 'memoryLane');
      const q = query(photosRef, orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      const photoList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPhotos(photoList);
      
      // Update featured photos
      const featured = photoList.filter(p => p.featured).slice(0, 6);
      setFeaturedPhotos(featured);
    } catch (err) {
      // Silent fail
    }
  };

  // Upload photo to Firebase (admin only)
  const handleUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file first');
      return;
    }
    
    if (!storage) {
      alert('Firebase Storage not configured');
      return;
    }
    
    if (!db) {
      alert('Firebase Firestore not configured');
      return;
    }
    
    setUploading(true);
    
    // Add timeout to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
    );
    
    try {
      await Promise.race([
        (async () => {
          // Upload to Firebase Storage
          const storageRef = ref(storage, `memory-lane/${Date.now()}_${uploadFile.name}`);
          await uploadBytes(storageRef, uploadFile);
          const url = await getDownloadURL(storageRef);
          
          // Save metadata to Firestore
          await addDoc(collection(db, 'memoryLane'), {
            url,
            caption: '',
            uploadedAt: new Date().toISOString(),
            featured: uploadAsFeatured
          });
          
          // Reload photos
          const photosRef = collection(db, 'memoryLane');
          const q = query(photosRef, orderBy('uploadedAt', 'desc'));
          const snapshot = await getDocs(q);
          const photoList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPhotos(photoList);
          
          // Update featured photos
          const featured = photoList.filter(p => p.featured).slice(0, 6);
          setFeaturedPhotos(featured);
          
          setUploadFile(null);
          setUploadAsFeatured(false);
          alert('Photo uploaded successfully!');
        })(),
        timeoutPromise
      ]);
    } catch (err) {
      console.error('Upload failed:', err.code, err.message);
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-full w-full relative flex items-center justify-center p-2 md:p-4 overflow-y-auto bg-black" style={{WebkitOverflowScrolling: 'touch'}}>
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black z-10 pointer-events-none"></div>
      
      {/* Main Profile Container - Premium Glossy Design */}
      <div className="relative z-30 w-full max-w-5xl h-[90vh] md:h-[85vh] bg-[#050505] border border-[#00ff41]/20 rounded-lg flex flex-col md:flex-row my-4" style={{boxShadow: '0 0 60px rgba(0, 255, 65, 0.08)'}}>
        
        {/* Left Sidebar: ID Card / Navigation - Glossy Style */}
        <div className="w-full md:w-80 bg-[#0a0a0a] border-b md:border-r md:border-b-0 border-white/10 p-3 md:p-6 flex flex-row md:flex-col gap-3 md:gap-6 overflow-x-auto md:overflow-x-visible shrink-0">
           <div className="w-32 h-32 md:w-full md:aspect-square bg-[#111] border border-white/10 relative overflow-hidden group shrink-0 rounded-lg">
             <img 
               src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80" 
               className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-110 transition-transform duration-500" 
               alt="Whip Montez"
             />
             <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-[#00ff41] text-black text-[9px] md:text-xs font-bold px-1 md:px-2 py-0.5">
                 ONLINE
             </div>
           </div>

           <div className="flex-1 md:flex-none space-y-1">
             <h2 className="text-lg md:text-2xl font-light text-white tracking-tight uppercase">Whip Montez</h2>
             <p className="text-[#00ff41]/80 font-mono text-[10px] md:text-xs">RED HOOK, BROOKLYN</p>
             <p className="text-gray-500 font-mono text-[10px] md:text-xs">LIVEWIRE RECORDS</p>
           
             <div className="hidden md:block md:flex-1 space-y-2 pt-4">
               <button onClick={() => setSection('music')} className="w-full bg-[#0a0a0a] border border-white/10 text-gray-300 py-3 text-xs font-medium tracking-widest hover:bg-[#00ff41]/10 hover:text-[#00ff41] hover:border-[#00ff41]/30 transition-all flex items-center justify-center gap-2 rounded">
                   <Disc size={14}/> DISCOGRAPHY
               </button>
               <button onClick={() => setSection('tour')} className="w-full bg-[#0a0a0a] border border-white/10 text-gray-300 py-3 text-xs font-medium tracking-widest hover:bg-[#00ff41]/10 hover:text-[#00ff41] hover:border-[#00ff41]/30 transition-all flex items-center justify-center gap-2 rounded">
                   <Calendar size={14}/> TOUR DATES
               </button>
               <button onClick={() => setSection('news')} className="w-full bg-[#0a0a0a] border border-white/10 text-gray-300 py-3 text-xs font-medium tracking-widest hover:bg-[#00ff41]/10 hover:text-[#00ff41] hover:border-[#00ff41]/30 transition-all flex items-center justify-center gap-2 rounded">
                   <Newspaper size={14}/> NEWS
               </button>
               <button onClick={() => window.open('https://www.youtube.com/results?search_query=90s+hip+hop', '_blank')} className="w-full bg-[#0a0a0a] border border-white/10 text-gray-300 py-3 text-xs font-medium tracking-widest hover:bg-[#00ff41]/10 hover:text-[#00ff41] hover:border-[#00ff41]/30 transition-all flex items-center justify-center gap-2 rounded">
                   <Video size={14}/> VIDEOS
               </button>
             </div>

             <div className="hidden md:block border-t border-white/10 pt-4 mt-4">
               <p className="text-[10px] text-gray-500 font-mono mb-2">MANAGEMENT:</p>
               <div className="text-xs text-white font-medium">JARI MONTEZ (Brother/Manager)</div>
               <div className="text-xs text-gray-400">jari@livewire-ent.com</div>
             </div>

             {/* Admin Login Section */}
             <div className="hidden md:block border-t border-white/10 pt-4 mt-4">
               <button 
                 onClick={() => setIsAdmin(!isAdmin)}
                 className={`w-full py-2 text-[10px] font-medium tracking-widest uppercase border transition-all rounded ${
                   isAdmin ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'border-white/10 text-gray-600 hover:border-[#00ff41]/30 hover:text-[#00ff41]'
                 }`}
               >
                 {isAdmin ? 'ADMIN MODE: ON' : 'GALLERY ADMIN'}
               </button>
             </div>
           </div>
        </div>

        {/* Right Content: Bio Text & Stats */}
        <div className="flex-1 bg-black flex flex-col relative overflow-hidden min-h-0">
           {/* Header - Glossy Professional Style */}
           <div className="bg-[#050505] border-b border-[#00ff41]/20 px-4 md:px-6 py-4 flex justify-between items-center shrink-0">
             <div>
               <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#00ff41]/60 mb-1">
                 {viewMode === 'bio' ? 'Official Profile' : viewMode === 'memory' ? 'Photo Archives' : 'Alternative Reality Experience'}
               </p>
               <h1 className="text-2xl md:text-4xl font-thin text-[#00ff41] tracking-tighter drop-shadow-[0_0_8px_rgba(0,255,65,0.5)]">
                 {viewMode === 'bio' ? 'WHIP MONTEZ' : viewMode === 'memory' ? 'MEMORY LANE' : 'THE STORY'}
               </h1>
             </div>
             <div className="flex items-center gap-1">
               {/* Toggle Buttons - Refined Style */}
               <button
                 onClick={() => setViewMode('bio')}
                 className={`px-3 md:px-4 py-2 text-[10px] md:text-xs font-medium tracking-wider border transition-all rounded ${
                   viewMode === 'bio' 
                     ? 'bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/40' 
                     : 'bg-transparent text-white/50 border-white/10 hover:border-white/30 hover:text-white/70'
                 }`}
               >
                 BIO
               </button>
               <button
                 onClick={() => setViewMode('story')}
                 className={`px-3 md:px-4 py-2 text-[10px] md:text-xs font-medium tracking-wider border transition-all rounded flex items-center gap-1 ${
                   viewMode === 'story' 
                     ? 'bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/40' 
                     : 'bg-transparent text-white/50 border-white/10 hover:border-white/30 hover:text-white/70'
                 }`}
               >
                 <ShieldAlert size={12} />
                 STORY
               </button>
               <button
                 onClick={() => setViewMode('memory')}
                 className={`px-3 md:px-4 py-2 text-[10px] md:text-xs font-medium tracking-wider border transition-all rounded flex items-center gap-1 ${
                   viewMode === 'memory' 
                     ? 'bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/40' 
                     : 'bg-transparent text-white/50 border-white/10 hover:border-white/30 hover:text-white/70'
                 }`}
               >
                 <Camera size={12} />
                 MEMORY
               </button>
             </div>
           </div>

           {/* Scrollable Content */}
           <div className="flex-1 overflow-y-auto overscroll-contain" style={{WebkitOverflowScrolling: 'touch'}}>
             {viewMode === 'story' ? (
               // THE STORY - ALTERNATIVE REALITY EXPERIENCE
               <div className="min-h-full bg-black flex items-center justify-center p-4 md:p-8">
                 <div className="max-w-4xl w-full space-y-8">
                   {/* Hero Section */}
                   <div className="text-center space-y-6 mb-12">
                     <div className="inline-block">
                       <div className="text-[#00ff41]/60 text-xs font-mono tracking-[0.2em] md:tracking-[0.5em] uppercase mb-4">
                         Alternative Reality Experience
                       </div>
                       <h1 className="text-4xl md:text-6xl font-thin text-[#00ff41] tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,65,0.6)] mb-6">
                         WHIP MONTEZ
                       </h1>
                       <div className="h-[1px] w-32 bg-[#00ff41]/50 mx-auto mb-4"></div>
                       <p className="text-white/50 text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase">
                         The Restored Experience
                       </p>
                     </div>
                   </div>

                   {/* The Full Story */}
                   <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">
                     {/* Introduction */}
                     <div className="bg-[#0a0a0a] border-l-2 border-[#00ff41]/40 p-6 rounded-r">
                       <h2 className="text-xl md:text-2xl font-light text-white mb-4 tracking-tight">
                         WHAT IS THIS?
                       </h2>
                       <p className="text-sm md:text-base font-mono leading-relaxed text-gray-400">
                         Welcome to the <strong className="text-[#00ff41]">WHIP MONTEZ: Restored OS</strong>—an Alternative Reality Experience (ARE) that resurrects a lost moment in hip-hop history. This isn't just a website. It's a digital time capsule, a reconstructed operating system from 2000-2004, built to honor an artist who never got her moment in the spotlight.
                       </p>
                     </div>

                     {/* The Artist's Story */}
                     <div>
                       <h3 className="text-lg md:text-xl font-light text-white mb-4 uppercase tracking-wide border-b border-white/10 pb-2">
                         THE ARTIST WHO TIME FORGOT
                       </h3>
                       <p className="text-sm md:text-base text-gray-400">
                         <strong className="text-white">Whip Montez</strong> was real. Born Wanda Altagracia Almonte in Brooklyn's Red Hook Housing Projects, she was a Dominican-American MC who was on the verge of breaking through in the early 2000s. She collaborated with legends like <strong className="text-white">Erick Sermon</strong> and <strong className="text-white">Talib Kweli</strong>. She performed alongside <strong className="text-white">Mobb Deep</strong> and <strong className="text-white">Slum Village</strong>. She had the talent, the connections, and the drive.
                       </p>
                       <p className="text-sm md:text-base mt-4 text-gray-400">
                         But her debut album, <em className="text-white">"Can't Nobody Whip Montez,"</em> never dropped. The industry moved on. Digital distribution was in its infancy. Independent artists without major label backing often disappeared without a trace. Whip Montez became one of hip-hop's countless "what ifs"—a brilliant artist whose music was never properly archived, celebrated, or remembered.
                       </p>
                       <p className="text-sm md:text-base mt-4 italic text-gray-500">
                         Until now.
                       </p>
                     </div>

                     {/* The Vision */}
                     <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded">
                       <h3 className="text-lg md:text-xl font-light text-white mb-4 uppercase tracking-wide">
                         THE VISION: RESTORING WHAT WAS LOST
                       </h3>
                       <p className="text-sm md:text-base text-gray-400">
                         This project was created by <strong className="text-white">Jari Montez</strong>, Whip's brother and former manager. After 20+ years, he's reconstructing the digital experience that never existed—the official website, the streaming presence, the interactive fan hub that Whip deserved but never had.
                       </p>
                       <p className="text-sm md:text-base mt-4 text-gray-400">
                         Using cutting-edge AI technology and modern web development, we've built an <strong className="text-[#00ff41]">Alternative Reality Operating System</strong> that simulates what Whip's career might have looked like if the timing had been different. It's part memorial, part what-if scenario, part interactive art project.
                       </p>
                     </div>

                     {/* Why This Matters */}
                     <div>
                       <h3 className="text-lg md:text-xl font-light text-white mb-4 uppercase tracking-wide border-b border-white/10 pb-2">
                         WHY THIS MATTERS
                       </h3>
                       <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-3">
                           <div className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 bg-[#00ff41]/60 rounded-full mt-2 shrink-0"></div>
                             <div>
                               <strong className="text-white font-medium block mb-1">Preserving Lost Voices</strong>
                               <p className="text-xs md:text-sm text-gray-500">
                                 Countless talented artists from the pre-streaming era vanished without proper documentation. This project honors them all.
                               </p>
                             </div>
                           </div>
                           <div className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 bg-[#00ff41]/60 rounded-full mt-2 shrink-0"></div>
                             <div>
                               <strong className="text-white font-medium block mb-1">Female Representation</strong>
                               <p className="text-xs md:text-sm text-gray-500">
                                 The early 2000s hip-hop scene was overwhelmingly male. Whip fought for her place and deserves to be remembered.
                               </p>
                             </div>
                           </div>
                         </div>
                         <div className="space-y-3">
                           <div className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 bg-[#00ff41]/60 rounded-full mt-2 shrink-0"></div>
                             <div>
                               <strong className="text-white font-medium block mb-1">Tech Meets Art</strong>
                               <p className="text-xs md:text-sm text-gray-500">
                                 This experiment shows how AI and modern tools can resurrect and reimagine lost cultural moments.
                               </p>
                             </div>
                           </div>
                           <div className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 bg-[#00ff41]/60 rounded-full mt-2 shrink-0"></div>
                             <div>
                               <strong className="text-white font-medium block mb-1">Family Legacy</strong>
                               <p className="text-xs md:text-sm text-gray-500">
                                 A brother's love letter to his sister—ensuring her story doesn't end in obscurity.
                               </p>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* The Features */}
                     <div className="bg-[#050505] border border-[#00ff41]/20 p-6 my-8 rounded">
                       <h3 className="text-lg md:text-xl font-light text-white mb-6 uppercase tracking-wide text-center">
                         EXPLORE THE RESTORED OS
                       </h3>
                       <div className="grid md:grid-cols-3 gap-4">
                         <div className="bg-black border border-white/10 p-4 hover:border-[#00ff41]/30 transition-all group rounded">
                           <div className="text-[#00ff41]/70 mb-2"><Sparkles size={24} /></div>
                           <h4 className="text-white font-medium mb-2 group-hover:text-[#00ff41] transition-colors">AI GHOSTWRITER</h4>
                           <p className="text-xs text-gray-500">Generate custom verses in Whip's style using advanced AI trained on her lyrical patterns.</p>
                         </div>
                         <div className="bg-black border border-white/10 p-4 hover:border-cyan-500/30 transition-all group rounded">
                           <div className="text-cyan-500/70 mb-2"><MessageSquare size={24} /></div>
                           <h4 className="text-white font-medium mb-2 group-hover:text-cyan-500 transition-colors">SIDEKICK CIPHER</h4>
                           <p className="text-xs text-gray-500">Chat with an AI recreation of Whip's personality and perspective on hip-hop.</p>
                         </div>
                         <div className="bg-black border border-white/10 p-4 hover:border-pink-500/30 transition-all group rounded">
                           <div className="text-pink-500/70 mb-2"><Mic size={24} /></div>
                           <h4 className="text-white font-medium mb-2 group-hover:text-pink-500 transition-colors">RAP BATTLE</h4>
                           <p className="text-xs text-gray-500">Go bar-for-bar with an AI opponent in real-time freestyle battles.</p>
                         </div>
                         <div className="bg-black border border-white/10 p-4 hover:border-purple-500/30 transition-all group rounded">
                           <div className="text-purple-500/70 mb-2"><User size={24} /></div>
                           <h4 className="text-white font-medium mb-2 group-hover:text-purple-500 transition-colors">A&R OFFICE</h4>
                           <p className="text-xs text-gray-500">Get career advice, release strategies, and industry insights from AI.</p>
                         </div>
                         <div className="bg-black border border-white/10 p-4 hover:border-yellow-500/30 transition-all group rounded">
                           <div className="text-yellow-500/70 mb-2"><Disc size={24} /></div>
                           <h4 className="text-white font-medium mb-2 group-hover:text-yellow-500 transition-colors">CRATE DIGGER</h4>
                           <p className="text-xs text-gray-500">Discover obscure samples and production techniques from the golden era.</p>
                         </div>
                         <div className="bg-black border border-white/10 p-4 hover:border-red-500/30 transition-all group rounded">
                           <div className="text-red-500/70 mb-2"><Video size={24} /></div>
                           <h4 className="text-white font-medium mb-2 group-hover:text-red-500 transition-colors">VIRAL VIDEO AI</h4>
                           <p className="text-xs text-gray-500">Generate music video concepts and promotional content ideas.</p>
                         </div>
                       </div>
                     </div>

                     {/* Additional Features */}
                     <div>
                       <h3 className="text-lg md:text-xl font-light text-white mb-4 uppercase tracking-wide border-b border-white/10 pb-2">
                         PLUS: AUTHENTIC 2000s EXPERIENCE
                       </h3>
                       <div className="space-y-4">
                         <div className="flex items-start gap-4 bg-[#0a0a0a] border-l-2 border-[#00ff41]/30 p-4 rounded-r">
                           <Radio className="text-[#00ff41]/70 shrink-0" size={20} />
                           <div>
                             <strong className="text-white font-medium block mb-1">Lost Tapes Audio Player</strong>
                             <p className="text-xs md:text-sm text-gray-500">Stream Whip's unreleased tracks with a retro Flash-style music player interface.</p>
                           </div>
                         </div>
                         <div className="flex items-start gap-4 bg-[#0a0a0a] border-l-2 border-cyan-500/30 p-4 rounded-r">
                           <Globe className="text-cyan-500/70 shrink-0" size={20} />
                           <div>
                             <strong className="text-white font-medium block mb-1">Live Hip-Hop News Feed</strong>
                             <p className="text-xs md:text-sm text-gray-500">Real-time entertainment news with trending social media posts from X, Reddit, Instagram.</p>
                           </div>
                         </div>
                         <div className="flex items-start gap-4 bg-[#0a0a0a] border-l-2 border-purple-500/30 p-4 rounded-r">
                           <ShoppingBag className="text-purple-500/70 shrink-0" size={20} />
                           <div>
                             <strong className="text-white font-medium block mb-1">Livewire Merch Store</strong>
                             <p className="text-xs md:text-sm text-gray-500">Browse vintage-style merchandise with Y2K aesthetic and secure checkout.</p>
                           </div>
                         </div>
                         <div className="flex items-start gap-4 bg-[#0a0a0a] border-l-2 border-pink-500/30 p-4 rounded-r">
                           <Camera className="text-pink-500/70 shrink-0" size={20} />
                           <div>
                             <strong className="text-white font-medium block mb-1">Memory Lane Gallery</strong>
                             <p className="text-xs md:text-sm text-gray-500">Archival photos from Red Hook, studio sessions, and live performances.</p>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* The Tech */}
                     <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded">
                       <h3 className="text-lg md:text-xl font-light text-white mb-4 uppercase tracking-wide">
                         HOW IT WAS BUILT
                       </h3>
                       <p className="text-sm md:text-base mb-4">
                         This Alternative Reality Experience combines modern technology with nostalgic design to create an authentic time-travel experience:
                       </p>
                       <div className="grid md:grid-cols-2 gap-4 text-xs md:text-sm mb-6">
                         <div className="space-y-2">
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-[#00ff41] rounded-full"></div>
                             <span className="text-gray-300"><strong className="text-white">Google Gemini AI</strong> - Powers all interactive agents</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-[#00ff41] rounded-full"></div>
                             <span className="text-gray-300"><strong className="text-white">React + Vite</strong> - Modern frontend framework</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-[#00ff41] rounded-full"></div>
                             <span className="text-gray-300"><strong className="text-white">Firebase</strong> - Real-time database & storage</span>
                           </div>
                         </div>
                         <div className="space-y-2">
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-[#00ff41] rounded-full"></div>
                             <span className="text-gray-300"><strong className="text-white">Tailwind CSS</strong> - Y2K-inspired design system</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-[#00ff41] rounded-full"></div>
                             <span className="text-gray-300"><strong className="text-white">Node.js Backend</strong> - API proxy for AI services</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-[#00ff41] rounded-full"></div>
                             <span className="text-gray-300"><strong className="text-white">Vercel/Railway</strong> - Cloud deployment</span>
                           </div>
                         </div>
                       </div>
                       
                       {/* Studio 2026 Highlight */}
                       <div className="border-t border-[#333] pt-4 mt-4">
                         <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/30 p-4 rounded">
                           <h4 className="text-base md:text-lg font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                             ⚡ STUDIO 2026: NEXT-GEN AI INTERFACE
                           </h4>
                           <p className="text-xs md:text-sm text-gray-300 leading-relaxed mb-3">
                             December 2025 marked a revolutionary upgrade—transforming basic AI tools into an <strong className="text-white">ultra-modern neural interface</strong> featuring:
                           </p>
                           <div className="grid md:grid-cols-2 gap-2 text-xs">
                             <div className="flex items-start gap-2">
                               <span className="text-cyan-500 mt-0.5">▸</span>
                               <span className="text-gray-400"><strong className="text-cyan-400">Glassmorphism UI</strong> - Frosted glass cards with depth</span>
                             </div>
                             <div className="flex items-start gap-2">
                               <span className="text-purple-500 mt-0.5">▸</span>
                               <span className="text-gray-400"><strong className="text-purple-400">3D Transforms</strong> - Interactive card animations</span>
                             </div>
                             <div className="flex items-start gap-2">
                               <span className="text-pink-500 mt-0.5">▸</span>
                               <span className="text-gray-400"><strong className="text-pink-400">Neural Particles</strong> - Animated gradient fields</span>
                             </div>
                             <div className="flex items-start gap-2">
                               <span className="text-cyan-500 mt-0.5">▸</span>
                               <span className="text-gray-400"><strong className="text-cyan-400">Scan Line Effects</strong> - Futuristic system scans</span>
                             </div>
                           </div>
                           <p className="text-[10px] text-gray-500 mt-3 italic">
                             Built to compete with ChatGPT, Midjourney, and Runway's premium interfaces.
                           </p>
                         </div>
                       </div>
                     </div>

                     {/* The Disclaimer */}
                     <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-6 my-8 rounded">
                       <div className="flex items-start gap-4">
                         <ShieldAlert className="text-[#00ff41]/60 shrink-0" size={28} />
                         <div>
                           <h3 className="text-base md:text-lg font-medium text-white mb-3 uppercase">
                             IMPORTANT: THIS IS AN ALTERNATIVE REALITY
                           </h3>
                           <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                             While Whip Montez was a real artist with genuine talent and connections, this website presents a <strong className="text-white">fictionalized "what if" scenario</strong>. The AI-generated content, reconstructed timeline, and interactive features are creative interpretations—not historical documentation. Some details have been reimagined or enhanced for storytelling purposes. This is an <strong className="text-[#00ff41]">artistic memorial</strong> and <strong className="text-[#00ff41]">technological experiment</strong>, not a biographical archive.
                           </p>
                           <p className="text-xs text-gray-500 mt-3 italic">
                             Any resemblance to actual events beyond publicly verifiable information is part of the Alternative Reality Experience design.
                           </p>
                         </div>
                       </div>
                     </div>

                     {/* Closing */}
                     <div className="text-center space-y-4 pt-8">
                       <div className="h-[1px] w-32 bg-[#00ff41]/40 mx-auto mb-6"></div>
                       <p className="text-base md:text-lg font-mono text-white/60 italic">
                         "This is for every artist who never got their shot.<br/>
                         For every voice that was silenced too soon.<br/>
                         For Whip Montez, and all the Lost Tapes."
                       </p>
                       <p className="text-sm text-[#00ff41]/70 font-mono tracking-wider">
                         — JARI MONTEZ, 2025
                       </p>
                       <div className="pt-6">
                         <p className="text-xs text-gray-600 uppercase tracking-widest">
                           SYSTEM STATUS: RESTORED // TERMINAL ID: WHIP-OS-V2
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             ) : viewMode === 'bio' ? (
               // BIO CONTENT
               <>
                 {/* Bio Header - Glossy Style */}
                 <div className="bg-[#050505] border-b border-[#00ff41]/20 px-5 md:px-6 py-5 mb-8">
                   <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#00ff41]/50 mb-2">
                     Official Profile
                   </p>
                   <h2 className="text-2xl md:text-3xl font-thin text-white tracking-tight uppercase mb-2">
                     Artist Biography
                   </h2>
                   <p className="text-gray-500 text-xs md:text-sm font-mono">
                     Stats • Career Highlights • Featured Photos
                   </p>
                 </div>

               <div className="max-w-2xl mx-auto space-y-4 md:space-y-8 px-3 md:px-8">
                 {/* Artist Statement */}
                 <blockquote className="border-l-2 border-[#00ff41]/30 pl-6 py-2">
                   <p className="text-lg md:text-xl font-mono text-white/80 leading-relaxed">
                      "I’ve paid my dues… I’ve developed my skills… I am ready."
                   </p>
                 </blockquote>

                 {/* Stats Grid */}
                 <div className="grid grid-cols-2 gap-3 md:gap-4 border-y border-white/10 py-4 md:py-6 my-4 md:my-6">
                   <div>
                      <div className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase">Name</div>
                      <div className="text-white font-mono text-xs md:text-base">Wanda Altagracia Almonte</div>
                   </div>
                   <div>
                      <div className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase">Origin</div>
                      <div className="text-white font-mono text-xs md:text-base">Red Hook, Brooklyn</div>
                   </div>
                   <div>
                      <div className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase">Key Features</div>
                      <div className="text-white font-mono text-xs md:text-base">Erick Sermon, Talib Kweli</div>
                   </div>
                   <div>
                      <div className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase">Education</div>
                      <div className="text-white font-mono text-xs md:text-base">LaGuardia HS (Dance)</div>
                   </div>
                 </div>

                 {/* The Story */}
                 <div className="prose prose-invert prose-sm font-mono text-gray-300 leading-relaxed space-y-4 md:space-y-6 text-xs md:text-sm">
                   <p className="first-letter:text-3xl md:first-letter:text-4xl first-letter:text-[#00ff41] first-letter:font-black first-letter:float-left first-letter:mr-2">
                      Introducing… "WHIP MONTEZ" (born Wanda Altagracia Almonte) a Dominican fem-cee reppin’ Brooklyn's Red Hook Housing Projects.
                   </p>
                   
                   <p>
                      Whip is currently recording her first album comprised of a variety of hip-hop tracks. Her highly anticipated debut album tentatively titled <strong className="text-white">“Can’t Nobody Whip Montez”</strong> is due for release in 2006 and contains sure shot hits like "Take it slow" where she advises men not to wreck a potential relationship by moving too fast. On the automatic head-banger "No Matter What You Say," WHIP pulls no punches and goes straight at her critics. WHIP definitely demonstrates her versatility, which distinguishes her from her counter-parts when she penned, "Dear God," an, introspective song that touches upon numerous issues that beset society and tragedies that have impacted us all.
                   </p>

                   <div className="border-l-2 border-[#333] pl-4 italic text-gray-400">
                      2004 was a great year for Whip Montez. She was featured alongside the Green-Eyed Bandit, <strong className="text-white">Erick Sermon</strong> and one of Brooklyn’s finest MC’s <strong className="text-white">Talib Kweli</strong>. The three collaborated on a track called “Chillin” off Sermon’s last album “Chilltown, NY”. It wasn’t long after Montez penned her verse that Sermon called on Talib to complete the track with a verse of his own.
                   </div>

                   <p>
                      “This was a dream come true to be in the booth with a hip-hop legend, and Talib it was truly an educational experience, one that I will cherish for a long time.”
                   </p>

                   <p>
                      With a good number of showcases and college shows, she has opened up for notable artists like 112, Slum Village, and the Infamous Mobb Deep to name a few. This has definitely helped her expand her fan base and create a buzz for her. Last year, WHIP had several overseas performances, in particular, the Dominican Republic, Coral Hamaca Resort, where she blessed over 2,000 screaming fans. "Those shows were crazy, because they really appreciate artist that make trips to their country. In DR, they held me down like I was in BK."
                   </p>

                   <h3 className="text-white text-base md:text-lg font-light uppercase tracking-wide border-b border-white/10 pb-2 mb-4 mt-6">Breaking Barriers: Female Dominance in the Game</h3>
                   
                   <p>
                      In an era dominated by male voices, Whip Montez was carving out her own lane in hip-hop with an unapologetic confidence that couldn't be ignored. At a time when female MCs were expected to choose between being "hard" or "commercial," Whip refused to be boxed in. She brought raw lyricism, street credibility, and genuine storytelling to every track—proving that a woman from Red Hook could hold her own on any stage or cipher.
                   </p>

                   <p>
                      Her lyrical prowess wasn't just about matching the men bar for bar—it was about exceeding expectations and rewriting the rules. Whip's verses cut through the noise with precision, tackling everything from relationship dynamics to street politics, always with that signature Red Hook grit. She wasn't asking for a seat at the table; she was building her own and inviting others to join.
                   </p>

                   <p>
                      The early 2000s hip-hop scene was notoriously challenging for female artists, but Whip Montez thrived in that environment. Her performances alongside industry heavyweights like Mobb Deep and Slum Village weren't novelty acts—she earned those spots through undeniable talent and relentless work ethic. Crowds didn't just tolerate a female opening act; they became fans, recognizing that her energy and skill matched anyone in the game.
                   </p>

                   <h3 className="text-white text-base md:text-lg font-light uppercase tracking-wide border-b border-white/10 pb-2 mb-4 mt-6">The Brother Behind The Vision</h3>
                   
                   <p>
                      Behind every great artist is someone who believed in them first. For Whip Montez, that person was her brother and manager, <strong className="text-white">Jari Montez</strong>. While Whip was perfecting her craft in the booth and on stage, Jari was navigating the complex business of hip-hop—booking shows, negotiating deals, and ensuring his sister's voice would be heard beyond Red Hook.
                   </p>

                   <p>
                      Jari didn't just manage Whip's career; he helped architect her path. He understood that the industry wasn't built for artists like his sister—independent, uncompromising, and fiercely authentic—so he worked tirelessly to create opportunities where none existed. From local showcases to international performances in the Dominican Republic, Jari's strategic vision and unwavering support were instrumental in building the Livewire movement.
                   </p>

                   <p>
                      The brother-sister dynamic brought a unique strength to Whip's operation. There was an inherent trust and loyalty that money couldn't buy. Jari knew Whip's potential before the industry did, and he fought for her with a dedication that only family could provide. He handled the business so Whip could focus on what she did best—making music that mattered. Their partnership was a testament to the power of family, faith, and an unshakeable belief in the dream.
                   </p>

                   <p>
                      Jari's role went beyond typical management—he was a protector, strategist, and believer. In an industry known for exploitation and broken promises, having family in your corner wasn't just an advantage; it was survival. He paved the way, cleared the obstacles, and ensured that every opportunity was maximized. The Livewire legacy wasn't built by one person—it was a family affair, with Jari and Whip moving as one unit toward a shared vision of success.
                   </p>

                   <h3 className="text-white text-base md:text-lg font-light uppercase tracking-wide border-b border-white/10 pb-2 mb-4 mt-8">Memories: The Journey in Pictures</h3>
                   
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 my-6">
                     {featuredPhotos.length > 0 ? (
                       featuredPhotos.map((photo) => (
                         <div key={photo.id} className="aspect-square bg-[#1a1a1a] border-2 border-[#333] relative overflow-hidden group hover:border-[#00ff41] transition-all cursor-pointer">
                           <img 
                             src={photo.url} 
                             alt={photo.caption || 'Memory'} 
                             className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                             <div className="text-[#00ff41] text-[9px] md:text-[10px] font-mono font-bold">
                               {photo.caption || 'RED HOOK ARCHIVES'}
                             </div>
                           </div>
                         </div>
                       ))
                     ) : (
                       [1, 2, 3, 4, 5, 6].map((i) => (
                         <div key={i} className="aspect-square bg-[#1a1a1a] border-2 border-[#333] relative overflow-hidden group hover:border-[#00ff41] transition-all">
                           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                             <Camera size={32} className="md:w-12 md:h-12 mb-2 opacity-20" />
                             <div className="text-[10px] md:text-xs font-mono">PHOTO {i}</div>
                             <div className="text-[8px] md:text-[10px] font-mono opacity-50">Coming Soon</div>
                           </div>
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                             <div className="text-[#00ff41] text-[9px] md:text-[10px] font-mono">RED HOOK ARCHIVES</div>
                           </div>
                         </div>
                       ))
                     )}
                   </div>

                   <p className="text-[10px] md:text-xs text-gray-500 italic text-center border-t border-[#333] pt-4">
                      {featuredPhotos.length > 0 
                        ? `Featured photos from the archives. Visit Memory Lane for the complete collection.`
                        : `Photo gallery showcasing studio sessions, live performances, and behind-the-scenes moments from the Livewire era. Check back soon for updates.`}
                   </p>

                   <p className="mt-8 text-[#00ff41]/70 font-medium border-t border-white/10 pt-4">
                      {'>'} SYSTEM NOTE: Artist Profile Last Updated: DEC 12 2025
                   </p>
                 </div>
               </div>
               </>
             ) : (
               // MEMORY LANE GALLERY - Glossy High-Fidelity Style
               <div className="w-full min-h-full">
                 <div className="bg-[#050505] border-b border-[#00ff41]/20 px-5 md:px-6 py-5 mb-8">
                   <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#00ff41]/50 mb-2">
                     Photo Archives
                   </p>
                   <h2 className="text-2xl md:text-3xl font-thin text-[#00ff41] tracking-tighter drop-shadow-[0_0_8px_rgba(0,255,65,0.5)] mb-2">
                     MEMORY LANE
                   </h2>
                   <p className="text-gray-500 text-xs md:text-sm font-mono">
                     Studio Sessions • Live Shows • Behind The Scenes • 2000-2004
                   </p>
                 </div>

                 {/* Admin Upload (only show if authenticated) */}
                 {isAdmin && (
                   <div className="bg-[#0a0a0a] border border-[#00ff41]/30 p-4 md:p-6 mb-6 md:mb-8 rounded mx-4">
                     <h3 className="text-[#00ff41]/80 font-medium text-base md:text-lg mb-3 flex items-center gap-2 uppercase">
                       <Upload size={18} />
                       ADMIN: Upload Photo
                     </h3>
                     <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                       <input
                         type="file"
                         accept="image/*"
                         onChange={(e) => setUploadFile(e.target.files[0])}
                         className="flex-1 bg-black border border-white/20 text-white px-3 py-2 text-sm font-mono rounded"
                       />
                       <button
                         onClick={handleUpload}
                         disabled={!uploadFile || uploading}
                         className="bg-[#00ff41] text-black px-6 py-2 font-medium text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00cc33] transition-colors rounded"
                       >
                         {uploading ? 'UPLOADING...' : 'UPLOAD'}
                       </button>
                     </div>
                     <div className="mt-2 flex items-center gap-2">
                       <input
                         type="checkbox"
                         id="featuredCheck"
                         checked={uploadAsFeatured}
                         onChange={(e) => setUploadAsFeatured(e.target.checked)}
                         className="w-4 h-4 bg-black border-white/20"
                       />
                       <label htmlFor="featuredCheck" className="text-xs text-gray-400 font-mono cursor-pointer">
                         ⭐ Featured (Show in Bio section)
                       </label>
                     </div>
                     {uploadFile && (
                       <div className="mt-2 text-xs text-gray-400 font-mono">
                         Selected: {uploadFile.name}
                       </div>
                     )}
                   </div>
                 )}

                 {/* Photo Grid - Glossy Cards */}
                 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 px-4">
                   {photos.length > 0 ? (
                     photos.map((photo) => (
                       <div key={photo.id} className="group relative bg-[#0a0a0a] border border-white/10 hover:border-[#00ff41]/30 transition-all duration-300 flex flex-col rounded overflow-hidden" style={{boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)'}}>
                         <div className="aspect-[3/4] overflow-hidden relative bg-black">
                           <img 
                             src={photo.url} 
                             alt={photo.caption || 'Memory'} 
                             className="w-full h-full object-cover opacity-90 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                           />
                           {/* Watermark */}
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="text-white/5 text-2xl md:text-4xl font-thin uppercase tracking-widest transform rotate-[-25deg] select-none">
                               RED HOOK
                             </div>
                           </div>
                           {/* Featured badge */}
                           {photo.featured && (
                             <div className="absolute top-2 left-2 bg-[#00ff41] text-black px-2 py-1 text-[9px] font-medium uppercase flex items-center gap-1 rounded">
                               ⭐ FEATURED
                             </div>
                           )}
                           {/* Admin toggle featured button */}
                           {isAdmin && (
                             <button
                               onClick={() => toggleFeatured(photo.id, photo.featured)}
                               className="absolute top-2 right-2 bg-black/80 hover:bg-black text-[#00ff41] p-2 text-xs font-medium border border-[#00ff41]/30 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                               title={photo.featured ? 'Remove from Bio' : 'Add to Bio'}
                             >
                               {photo.featured ? '⭐' : '☆'}
                             </button>
                           )}
                           {/* Caption overlay */}
                           <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black via-black/80 to-transparent">
                             <div className="text-[#00ff41]/80 text-xs md:text-sm font-mono font-medium uppercase tracking-wider">
                               {photo.caption || 'RED HOOK ARCHIVES'}
                             </div>
                             {photo.uploadedAt && (
                               <div className="text-gray-500 text-[9px] md:text-[10px] font-mono mt-1">
                                 {new Date(photo.uploadedAt).toLocaleDateString()}
                               </div>
                             )}
                           </div>
                         </div>
                         {/* Metadata below image */}
                         <div className="p-2 md:p-3 flex-1 flex flex-col justify-between bg-[#0a0a0a]">
                           <div className="text-[10px] md:text-xs text-gray-500 font-mono truncate">
                             {photo.caption || 'Untitled Memory'}
                           </div>
                         </div>
                       </div>
                     ))
                   ) : (
                     // Placeholder grid
                     [...Array(24)].map((_, i) => (
                       <div key={i} className="group relative bg-[#0a0a0a] border border-white/10 hover:border-[#00ff41]/20 transition-all duration-300 flex flex-col rounded overflow-hidden">
                         <div className="aspect-[3/4] overflow-hidden relative bg-black">
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <Camera size={48} className="mb-3 opacity-10 text-[#00ff41] group-hover:opacity-30 transition-opacity" />
                             <div className="text-sm md:text-base font-mono font-light text-gray-600 group-hover:text-gray-500">SLOT {i + 1}</div>
                             <div className="text-[9px] md:text-xs font-mono opacity-50 mt-1 text-gray-700">Awaiting Upload</div>
                           </div>
                         </div>
                         <div className="p-2 md:p-3 bg-[#0a0a0a]">
                           <div className="text-[10px] text-gray-700 font-mono">Empty Slot</div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>

                 {/* Footer Info */}
                 {photos.length === 0 && (
                   <div className="text-center border-t border-[#333] pt-6">
                     <p className="text-gray-300 text-sm font-mono mb-2">
                       📸 No photos uploaded yet
                     </p>
                     <p className="text-gray-500 text-xs font-mono">
                       Check back soon for exclusive behind-the-scenes content
                     </p>
                   </div>
                 )}
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

// 3. MUSIC PLAYER (Evidence Tapes)
const MusicPlayer = () => {
  const [selectedAlbumId, setSelectedAlbumId] = useState('tape1');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showLyrics, setShowLyrics] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const urlCacheRef = useRef({}); // Cache Firebase Storage URLs
  const recognitionRef = useRef(null);
  
  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        setVoiceStatus(`Heard: "${command}"`);
        processVoiceCommand(command);
        setTimeout(() => setVoiceStatus(''), 3000);
      };
      
      recognitionRef.current.onerror = (event) => {
        setVoiceStatus(`Error: ${event.error}`);
        setIsListening(false);
        setTimeout(() => setVoiceStatus(''), 3000);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const processVoiceCommand = (command) => {
    if (command.includes('play') && !command.includes('pause')) {
      if (currentTrack) {
        setIsPlaying(true);
        setVoiceStatus('▶ Playing...');
      } else if (albums[0]?.tracks[0]) {
        setCurrentTrack(albums[0].tracks[0]);
        setIsPlaying(true);
        setVoiceStatus('▶ Playing first track...');
      }
    } else if (command.includes('pause') || command.includes('stop')) {
      setIsPlaying(false);
      setVoiceStatus('⏸ Paused');
    } else if (command.includes('next') || command.includes('skip')) {
      handleNext();
      setVoiceStatus('⏭ Next track');
    } else if (command.includes('previous') || command.includes('back')) {
      handlePrevious();
      setVoiceStatus('⏮ Previous track');
    } else if (command.includes('volume up') || command.includes('louder')) {
      const newVol = Math.min(1, volume + 0.2);
      setVolume(newVol);
      if (audioRef.current) audioRef.current.volume = newVol;
      setVoiceStatus(`🔊 Volume: ${Math.round(newVol * 100)}%`);
    } else if (command.includes('volume down') || command.includes('quieter') || command.includes('softer')) {
      const newVol = Math.max(0, volume - 0.2);
      setVolume(newVol);
      if (audioRef.current) audioRef.current.volume = newVol;
      setVoiceStatus(`🔉 Volume: ${Math.round(newVol * 100)}%`);
    } else if (command.includes('mute')) {
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
      setVoiceStatus('🔇 Muted');
    } else {
      setVoiceStatus(`Command not recognized: "${command}"`);
    }
  };

  const startVoiceControl = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      setVoiceStatus('Listening...');
      recognitionRef.current.start();
    }
  };
  
  const albums = [
    {
      id: 'tape1',
      title: "LIVEWIRE SESSIONS",
      date: "FEB 14 2004",
      description: "The unreleased debut. Raw, boom-bap, recorded in Erick's basement.",
      color: "text-[#00ff41]", 
      tapeColor: "border-[#00ff41]",
      tracks: [
        { id: 101, title: "Freestyle (Kanye Beat)", duration: "2:15", date: "2004-02-14", video: true, audioUrl: "audio/whip-montez-kanye-freestyle.mp3" },
        { id: 102, title: "Feat. Ali Vegas (50 Cent Beat)", duration: "3:42", date: "2004-03-01", video: false, audioUrl: "audio/whip-montez-50-freestyle.mp3" },
        { id: 103, title: "Sprung (Remix)", duration: "3:30", date: "2004-04-20", video: true, audioUrl: "audio/whip-montez-sprung-remix.mp3" },
        { id: 104, title: "Push It (Remix)", duration: "3:15", date: "2004-05-10", video: false, audioUrl: "audio/whip-montez-push-it.mp3" },
        { id: 105, title: "Freestyle (Jim Jones Beat)", duration: "2:50", date: "2004-06-05", video: true, audioUrl: "audio/whip-montez-jim-jones-freestyle.mp3" }
      ]
    },
    {
      id: 'tape2',
      title: "RED HOOK DIARIES",
      date: "AUG 01 2004",
      description: "Mixtape distributed at block parties. Gritty storytelling.",
      color: "text-red-500",
      tapeColor: "border-red-500",
      tracks: [
        { id: 201, title: "Stand Up", duration: "2:50", date: "2002-09-11", video: true, audioUrl: "audio/whip-montez-stand-up.mp3" },
        { id: 202, title: "Brooklyn Anthem feat. Alfonzo Hunter", duration: "3:15", date: "2002-12-01", video: false, audioUrl: "audio/whip-montez-brooklyn-anthem.mp3" },
        { id: 203, title: "Sit Back n Remain (Freestyle)", duration: "2:10", date: "2003-02-14", video: false, audioUrl: "audio/whip-montez-sit-back-remain.mp3" },
        { id: 204, title: "YoungStar", duration: "1:20", date: "2003-07-04", video: false, audioUrl: "audio/whip-montez-youngstar.mp3" },
        { id: 205, title: "No Matter You Say", duration: "4:00", date: "2003-08-14", video: true, audioUrl: "audio/whip-montez-no-matter.mp3" }
      ]
    },
    {
      id: 'tape3',
      title: "THE STOOP",
      date: "JUL 15 2001",
      description: "Chillin on the Blizzy",
      color: "text-cyan-400",
      tapeColor: "border-cyan-400",
      tracks: [
        { id: 301, title: "U Catching Feelings", duration: "3:20", date: "2001-07-15", video: false, audioUrl: "audio/whip-montez-catching-feelings.mp3" },
        { id: 302, title: "Only You", duration: "3:45", date: "2001-07-20", video: false, audioUrl: "audio/whip-montez-only-you.mp3" },
        { id: 303, title: "Dear GOD", duration: "4:10", date: "2001-08-01", video: true, audioUrl: "audio/whip-montez-dear-god.mp3" },
        { id: 304, title: "I Use to Love feat. Kia", duration: "3:55", date: "2001-08-10", video: false, audioUrl: "audio/whip-montez-i-use-to-love.mp3" },
        { id: 305, title: "It Gets Hard", duration: "3:30", date: "2001-08-15", video: false, audioUrl: "audio/whip-montez-it-gets-hard.mp3" }
      ]
    }
  ];

  // Load audio when track changes ONLY
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    const audio = audioRef.current;
    const shouldAutoPlay = isPlaying;
    let canPlayListener = null;
    let errorListener = null;
    
    const loadAndPlay = async () => {
      try {
        setAudioLoading(true);
        setAudioError(false);
        
        // Error handler
        errorListener = () => {
          setAudioLoading(false);
          setAudioError(true);
          setIsPlaying(false);
          console.log("Audio file not available:", currentTrack.audioUrl);
        };
        audio.addEventListener('error', errorListener, { once: true });
        
        // Get the URL
        let url;
        if (storage && currentTrack.audioUrl) {
          try {
            const storageRef = ref(storage, currentTrack.audioUrl);
            url = await getDownloadURL(storageRef);
          } catch (e) {
            // Firebase storage failed, try local path
            url = `/${currentTrack.audioUrl}`;
          }
        } else {
          url = `/${currentTrack.audioUrl}`;
        }
        
        // Set source
        audio.src = url;
        
        // Wait for audio to be ready before playing
        canPlayListener = () => {
          setAudioLoading(false);
          setAudioError(false);
          if (shouldAutoPlay) {
            audio.play().catch(err => console.log("Play error:", err));
          }
        };
        
        audio.addEventListener('canplay', canPlayListener, { once: true });
        audio.load();
        
      } catch (err) {
        console.log("Audio load error:", err);
        setAudioLoading(false);
        setAudioError(true);
      }
    };
    
    loadAndPlay();
    
    // Cleanup
    return () => {
      if (canPlayListener) {
        audio.removeEventListener('canplay', canPlayListener);
      }
    };
  }, [currentTrack]);

  // Separate effect for play/pause button (when track doesn't change)
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    const audio = audioRef.current;
    
    // Control playback whenever isPlaying changes
    if (audio.src) {
      if (isPlaying) {
        // Only play if not already playing
        if (audio.paused) {
          audio.play().catch(err => console.log("Play error:", err));
        }
      } else {
        // Only pause if currently playing
        if (!audio.paused) {
          audio.pause();
        }
      }
    }
  }, [isPlaying]);

  const activeAlbum = albums.find(a => a.id === selectedAlbumId) || albums[0];

  const handleTrackClick = (track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      // For desktop: preserve user gesture by calling play immediately
      if (audioRef.current) {
        audioRef.current.play().catch(() => {}); // This preserves the gesture
      }
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  // Previous track handler
  const handlePrevious = () => {
    if (!currentTrack) return;
    const currentIndex = activeAlbum.tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      const prevTrack = activeAlbum.tracks[currentIndex - 1];
      setCurrentTrack(prevTrack);
      setIsPlaying(true);
    }
  };

  // Next track handler
  const handleNext = () => {
    if (!currentTrack) return;
    const currentIndex = activeAlbum.tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < activeAlbum.tracks.length - 1) {
      const nextTrack = activeAlbum.tracks[currentIndex + 1];
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
    }
  };

  // Stop handler
  const handleStop = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Get lyrics/description for current track
  const getLyricsForTrack = (trackId) => {
    const lyricsData = {
      // Livewire Sessions tracks
      101: [
        { line: "[Verse 1 - Brooklyn declaration over Kanye production]", note: "Opening statement" },
        { line: "[Hook - Red Hook origin story]", note: "Hood anthem" },
        { line: "[Verse 2 - Livewire label reference]", note: "Industry verse" },
        { line: "[Bridge - Flow and skill demonstration]", note: "Technical flex" },
        { line: "[Outro - 2004 timestamp]", note: "Era signature" }
      ],
      102: [
        { line: "[Intro - Ali Vegas collaboration announcement]", note: "Queens meets Brooklyn" },
        { line: "[Verse 1 - 50 Cent beat flip]", note: "Beat commentary" },
        { line: "[Ali Vegas Verse]", note: "Feature verse" },
        { line: "[Whip Montez Verse 2]", note: "Response bars" },
        { line: "[Outro - NYC unity theme]", note: "Borough bridge" }
      ],
      103: [
        { line: "[Remix intro over T-Pain original]", note: "Sample credit" },
        { line: "[Verse 1 - Brooklyn heat]", note: "Hood energy" },
        { line: "[Hook - Sprung concept flip]", note: "Theme adaptation" },
        { line: "[Verse 2 - Street perspective]", note: "Narrative shift" }
      ],
      104: [
        { line: "[Salt-N-Pepa sample intro]", note: "Classic flip" },
        { line: "[Verse 1 - Push to the limit theme]", note: "Motivation" },
        { line: "[Hook - Energy and persistence]", note: "Anthem section" },
        { line: "[Verse 2 - Block to success journey]", note: "Come up story" }
      ],
      105: [
        { line: "[Dipset beat tribute]", note: "Harlem connection" },
        { line: "[Verse 1 - Jim Jones style adaptation]", note: "Capo status" },
        { line: "[Hook - NYC street declaration]", note: "Borough bridge" },
        { line: "[Verse 2 - Whip's perspective]", note: "Personal verse" }
      ],
      // Red Hook Diaries tracks
      201: [
        { line: "[Stand Up anthem opening]", note: "Block party energy" },
        { line: "[Verse 1 - Red Hook soldiers]", note: "Hood dedication" },
        { line: "[Hook - Brooklyn rise call]", note: "Unity theme" },
        { line: "[Verse 2 - Project to avenue grind]", note: "Hustle narrative" }
      ],
      202: [
        { line: "[Reggae-influenced intro]", note: "Genre fusion" },
        { line: "[Verse 1 - Bob Marley tribute]", note: "Caribbean influence" },
        { line: "[Brooklyn street adaptation]", note: "Local perspective" }
      ],
      203: [
        { line: "[G-Unit beat flip]", note: "Queens production tribute" },
        { line: "[Verse 1 - Street certified]", note: "Hood credentials" },
        { line: "[Hook - Taking what's hot]", note: "Remix philosophy" }
      ],
      204: [
        { line: "[Studio session intro]", note: "Recording scene" },
        { line: "[Verse 1 - Red dot recording]", note: "Late night bars" },
        { line: "[Verse 2 - Headshot bars]", note: "Lyrical prowess" }
      ],
      205: [
        { line: "[Westcoast meets Eastcoast]", note: "Coast fusion" },
        { line: "[Verse 1 - Gangsta remix]", note: "Street tales" },
        { line: "[Hook - Streets on repeat]", note: "Block anthem" }
      ],
      // The Stoop tracks
      301: [
        { line: "[The Stoop as stage concept]", note: "Brooklyn imagery" },
        { line: "[Verse 1 - Every verse is a page]", note: "Storytelling theme" }
      ],
      302: [
        { line: "[Graveyard shift narrative]", note: "Hustle hours" },
        { line: "[Verse 1 - Mic and future duality]", note: "Dream vs reality" }
      ],
      303: [
        { line: "[Mama's prayers opening]", note: "Family tribute" },
        { line: "[Verse 1 - Red Hook raised, Brooklyn made]", note: "Origin verse" }
      ],
      304: [
        { line: "[Live performance energy]", note: "Crowd ready" },
        { line: "[Verse 1 - Bass drop heavy]", note: "Show time" },
        { line: "[Hook - Flow steady declaration]", note: "Confidence" }
      ],
      305: [
        { line: "[Album outro vibes]", note: "Story complete" },
        { line: "[Final verse - Stoop to world journey]", note: "Mission statement" },
        { line: "[Closing thoughts - Archive complete]", note: "Tape end" }
      ]
    };
    
    return lyricsData[trackId] || [
      { line: "[Track from the archive]", note: "Unreleased material" },
      { line: "[Full transcription coming soon]", note: "Check back for updates" }
    ];
  };

  const currentLyrics = currentTrack ? getLyricsForTrack(currentTrack.id) : getLyricsForTrack(101);

  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col relative bg-black overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
      
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div 
          className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowOnboarding(false)}
          onTouchEnd={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); setShowOnboarding(false); } }}
        >
          <div className="w-full max-w-2xl bg-[#050505] border border-[#00ff41]/30 rounded-lg overflow-hidden touch-manipulation" style={{boxShadow: '0 0 60px rgba(0,255,65,0.1)'}}>
            <div className="bg-[#00ff41]/10 border-b border-[#00ff41]/20 px-6 py-4">
              <h2 className="text-2xl md:text-3xl font-thin text-[#00ff41] tracking-tight" style={{textShadow: '0 0 30px rgba(0,255,65,0.4)'}}>
                Welcome to the Lost Tapes
              </h2>
              <p className="text-[#00ff41]/60 text-xs mt-1 tracking-wider">AUDIO ARCHIVE • RESTORED 2004</p>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-gray-400 text-sm leading-relaxed">
                You've accessed the <span className="text-white">Evidence Locker</span> — a collection of unreleased recordings, basement freestyles, and mixtape cuts that were never meant to see the light of day. Until now.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/30 rounded flex items-center justify-center">
                      <Play size={14} className="text-orange-400" />
                    </div>
                    <h4 className="text-white font-medium text-sm">Playback Controls</h4>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">Click any track to play. Use the deck controls or keyboard shortcuts for navigation.</p>
                </div>
                
                <div className="bg-black border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/30 rounded flex items-center justify-center">
                      <Mic size={14} className="text-purple-400" />
                    </div>
                    <h4 className="text-white font-medium text-sm">Voice Commands</h4>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">Say "play", "pause", "next", "previous", "volume up/down" to control hands-free.</p>
                </div>
                
                <div className="bg-black border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/30 rounded flex items-center justify-center">
                      <Disc size={14} className="text-cyan-400" />
                    </div>
                    <h4 className="text-white font-medium text-sm">3 Lost Tapes</h4>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">Livewire Sessions, Red Hook Diaries, and The Stoop — 15 tracks total from 2001-2004.</p>
                </div>
                
                <div className="bg-black border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-red-500/10 border border-red-500/30 rounded flex items-center justify-center">
                      <Video size={14} className="text-red-400" />
                    </div>
                    <h4 className="text-white font-medium text-sm">Video Footage</h4>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">Some tracks include rare video clips. Look for the video icon next to tracks.</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowOnboarding(false)}
                className="w-full bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] py-3 text-sm font-medium rounded hover:bg-[#00ff41]/20 hover:border-[#00ff41]/50 transition-all flex items-center justify-center gap-2"
              >
                <Headphones size={16} /> Enter the Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Glossy Style */}
      <div className="bg-[#050505] border-b border-[#00ff41]/20 shrink-0">
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-orange-400/60 mb-1">Audio Archive</p>
              <h2 className="text-xl md:text-2xl font-thin text-orange-400 tracking-tight flex items-center gap-3" style={{textShadow: '0 0 20px rgba(249,115,22,0.4)'}}>
                <Disc size={20} className="opacity-70" /> THE LOST TAPES
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Lyrics Button */}
              <button 
                onClick={() => setShowLyrics(!showLyrics)}
                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-medium transition-all ${
                  showLyrics 
                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400' 
                    : 'bg-[#0a0a0a] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Feather size={14} />
                Lyrics
              </button>
              {/* Voice Control Button */}
              <button 
                onClick={startVoiceControl}
                disabled={!recognitionRef.current || isListening}
                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-medium transition-all ${
                  isListening 
                    ? 'bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse' 
                    : 'bg-[#0a0a0a] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Mic size={14} />
                {isListening ? 'Listening...' : 'Voice'}
              </button>
              <button 
                onClick={() => setShowOnboarding(true)}
                className="bg-[#0a0a0a] border border-white/10 text-gray-400 px-3 py-2 text-xs font-medium flex items-center gap-2 hover:text-white hover:border-white/20 transition-colors rounded"
              >
                <HelpCircle size={14}/> Help
              </button>
            </div>
          </div>
          
          {/* Voice Status */}
          {voiceStatus && (
            <div className="mt-3 bg-[#0a0a0a] border border-orange-500/20 rounded px-3 py-2 text-orange-400 text-xs font-mono">
              {voiceStatus}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Video Modal */}
        {showVideoModal && (
          <div 
            className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowVideoModal(false)}
            onTouchEnd={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); setShowVideoModal(false); } }}
          >
            <div className="w-full max-w-3xl bg-[#050505] border border-white/10 rounded-lg overflow-hidden" style={{boxShadow: '0 0 60px rgba(0,0,0,0.5)'}}>
              <div className="h-10 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-4">
                <span className="text-white font-medium text-xs">Video Player — {currentTrack?.title}</span>
                <button onClick={() => setShowVideoModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play size={24} className="text-orange-400 ml-1" />
                  </div>
                  <p className="text-gray-500 text-sm">Video footage loading...</p>
                  <p className="text-gray-600 text-xs mt-2">Source: {currentTrack?.title}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lyrics Modal */}
        {showLyrics && (
          <div 
            className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setShowLyrics(false)}
            onTouchEnd={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); setShowLyrics(false); } }}
          >
            <div className="w-full max-w-2xl bg-[#050505] border border-purple-500/30 rounded-lg overflow-hidden" style={{boxShadow: '0 0 60px rgba(168,85,247,0.1)'}}>
              <div className="bg-purple-500/10 border-b border-purple-500/20 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-thin text-purple-400 tracking-tight flex items-center gap-2" style={{textShadow: '0 0 20px rgba(168,85,247,0.4)'}}>
                    <Feather size={18} /> Lyrics
                  </h2>
                  <p className="text-purple-400/60 text-xs mt-1">{currentTrack?.title || 'Select a track'}</p>
                </div>
                <button onClick={() => setShowLyrics(false)} className="text-gray-500 hover:text-white transition-colors p-2 touch-manipulation">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Lyrics from <span className="text-purple-400">{currentTrack?.title || 'the archive'}</span>. Tap lines to reveal annotations.
                </p>
                
                <div className="space-y-3">
                  {currentLyrics.map((lyric, i) => (
                    <div key={i} className="group cursor-pointer bg-black border border-white/5 rounded-lg p-4 hover:border-purple-500/30 active:border-purple-500/50 transition-all touch-manipulation">
                      <div className="text-white text-sm mb-2 flex items-start gap-3">
                        <span className="text-purple-400/50 font-mono text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                        <span className="italic">"{lyric.line}"</span>
                      </div>
                      <div className="pl-7 space-y-1 opacity-60 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300">
                        <div className="text-gray-500 text-[11px]">📝 {lyric.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center text-gray-600 text-xs pt-4 border-t border-white/5">
                  Hover over lines to reveal translations and notes
                </div>
                
                <button 
                  onClick={() => setShowLyrics(false)}
                  className="w-full bg-purple-500/10 border border-purple-500/30 text-purple-400 py-3 text-sm font-medium rounded hover:bg-purple-500/20 transition-all"
                >
                  Close Lyrics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Album Sidebar */}
        <div className="hidden lg:flex lg:w-64 border-r border-white/5 bg-[#050505] flex-col">
          <div className="p-3 border-b border-white/5 bg-black/50">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Select Tape</p>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {albums.map(album => (
              <div 
                key={album.id}
                onClick={() => setSelectedAlbumId(album.id)}
                className={`p-4 cursor-pointer rounded-lg transition-all group ${
                  selectedAlbumId === album.id 
                    ? 'bg-[#0a0a0a] border border-white/10' 
                    : 'border border-transparent hover:bg-[#0a0a0a] hover:border-white/5'
                }`}
                style={{ boxShadow: selectedAlbumId === album.id ? `0 0 20px ${album.color.includes('red') ? 'rgba(239,68,68,0.1)' : album.color.includes('cyan') ? 'rgba(34,211,238,0.1)' : 'rgba(0,255,65,0.1)'}` : 'none' }}
              >
                <div className={`font-medium text-sm mb-1 ${selectedAlbumId === album.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                  {album.title}
                </div>
                <div className="text-[10px] text-gray-600">{album.date} • {album.tracks.length} tracks</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Album Selector */}
        <div className="lg:hidden border-b border-white/5 bg-[#050505] p-3">
          <select 
            value={selectedAlbumId}
            onChange={(e) => setSelectedAlbumId(e.target.value)}
            className="w-full bg-black border border-white/10 text-white p-3 text-sm rounded focus:border-orange-500/30 focus:outline-none"
          >
            {albums.map(album => (
              <option key={album.id} value={album.id}>{album.title} ({album.tracks.length} tracks)</option>
            ))}
          </select>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-black overflow-hidden">
          {/* Album Header */}
          <div className="p-4 md:p-6 border-b border-white/5 bg-[#050505]">
            <h2 className={`text-2xl md:text-4xl font-thin tracking-tight mb-2 ${activeAlbum.color}`} style={{textShadow: `0 0 30px ${activeAlbum.color.includes('red') ? 'rgba(239,68,68,0.3)' : activeAlbum.color.includes('cyan') ? 'rgba(34,211,238,0.3)' : 'rgba(0,255,65,0.3)'}`}}>
              {activeAlbum.title}
            </h2>
            <p className="text-gray-500 text-sm">{activeAlbum.description}</p>
          </div>
          
          {/* Track List */}
          <div className="flex-1 overflow-y-auto">
            {activeAlbum.tracks.map((track, i) => (
              <div
                key={track.id}
                onClick={() => handleTrackClick(track)}
                className={`px-4 md:px-6 py-4 border-b border-white/5 cursor-pointer transition-all group ${
                  currentTrack?.id === track.id 
                    ? 'bg-orange-500/5 border-l-2 border-l-orange-500' 
                    : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 text-center font-mono text-sm ${currentTrack?.id === track.id ? 'text-orange-400' : 'text-gray-600 group-hover:text-white'}`}>
                    {currentTrack?.id === track.id && isPlaying ? (
                      <div className="flex items-center justify-center gap-0.5">
                        {[1,2,3].map(bar => (
                          <div key={bar} className="w-0.5 bg-orange-400 animate-pulse" style={{ height: `${8 + Math.random() * 8}px`, animationDelay: `${bar * 0.1}s` }}></div>
                        ))}
                      </div>
                    ) : (
                      (i + 1).toString().padStart(2, '0')
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm truncate ${currentTrack?.id === track.id ? 'text-orange-400' : 'text-white'}`}>
                      {track.title}
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">{track.duration} • {track.date}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {track.video && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentTrack(track); setShowVideoModal(true); }}
                        className="text-gray-600 hover:text-orange-400 transition-colors"
                      >
                        <Video size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Sidebar */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/5 bg-[#050505] flex flex-col">
          {/* Now Playing Display */}
          <div className="p-5 bg-black border-b border-white/5">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 relative overflow-hidden" style={{boxShadow: '0 0 30px rgba(0,0,0,0.5)'}}>
              {/* Loading Overlay */}
              {audioLoading && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <Loader2 size={24} className="text-orange-400 animate-spin mb-2" />
                  <div className="text-orange-400 text-xs">Loading track...</div>
                </div>
              )}
              
              {/* Error Overlay */}
              {audioError && !audioLoading && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4">
                  <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mb-3">
                    <X size={20} className="text-red-400" />
                  </div>
                  <div className="text-red-400 text-xs text-center mb-2">Audio Unavailable</div>
                  <div className="text-gray-500 text-[10px] text-center">Upload MP3 to Firebase Storage or frontend/public folder</div>
                </div>
              )}
              
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Now Playing</div>
              
              <div className="font-medium text-white text-sm mb-1 truncate">
                {currentTrack ? currentTrack.title : 'Select a track'}
              </div>
              <div className="text-xs text-gray-500 mb-4">
                {currentTrack ? 'Whip Montez' : '—'}
              </div>
              
              {/* Visualizer */}
              <div className="h-12 flex items-end justify-center gap-0.5 mb-4">
                {[...Array(24)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-orange-500/60 rounded-t transition-all duration-100"
                    style={{ 
                      height: isPlaying ? `${10 + Math.random() * 90}%` : '4px', 
                      opacity: 0.3 + Math.random() * 0.7 
                    }} 
                  />
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-200"
                    style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 mt-1 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => {
                    const newVol = volume === 0 ? 0.8 : 0;
                    setVolume(newVol);
                    if (audioRef.current) audioRef.current.volume = newVol;
                  }}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  {volume === 0 ? <VolumeX size={14} /> : volume < 0.5 ? <Volume1 size={14} /> : <Volume2 size={14} />}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setVolume(newVol);
                    if (audioRef.current) audioRef.current.volume = newVol;
                  }}
                  className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-400"
                />
                <span className="text-[10px] text-gray-600 font-mono w-8">{Math.round(volume * 100)}%</span>
              </div>
            </div>
            
            {/* Transport Controls */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              <button 
                onClick={handlePrevious}
                className="bg-[#0a0a0a] border border-white/10 h-12 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all"
              >
                <Rewind size={18}/>
              </button>
              <button 
                onClick={() => currentTrack && setIsPlaying(!isPlaying)}
                disabled={audioLoading || !currentTrack}
                className={`bg-orange-500/10 border border-orange-500/30 h-12 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isPlaying ? 'text-orange-400' : 'text-orange-400 hover:bg-orange-500/20'
                }`}
              >
                {audioLoading ? <Loader2 size={18} className="animate-spin"/> : isPlaying ? <Pause size={18}/> : <Play size={18} className="ml-0.5"/>}
              </button>
              <button 
                onClick={handleStop}
                className="bg-[#0a0a0a] border border-white/10 h-12 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all"
              >
                <div className="w-4 h-4 bg-current rounded"></div>
              </button>
              <button 
                onClick={handleNext}
                className="bg-[#0a0a0a] border border-white/10 h-12 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all"
              >
                <div className="flex"><Play size={12}/><Play size={12}/></div>
              </button>
            </div>
          </div>

          {/* Voice Commands Quick Reference */}
          <div className="flex-1 p-4 bg-black/50 overflow-y-auto">
            <h3 className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Mic size={12} /> Voice Commands
            </h3>
            <div className="space-y-2 text-[11px]">
              {[
                { cmd: '"Play"', desc: 'Start playback' },
                { cmd: '"Pause" / "Stop"', desc: 'Pause playback' },
                { cmd: '"Next" / "Skip"', desc: 'Next track' },
                { cmd: '"Previous" / "Back"', desc: 'Previous track' },
                { cmd: '"Volume up"', desc: 'Increase volume' },
                { cmd: '"Volume down"', desc: 'Decrease volume' },
                { cmd: '"Mute"', desc: 'Mute audio' }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-orange-400/80 font-mono">{item.cmd}</span>
                  <span className="text-gray-600">{item.desc}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-[#0a0a0a] border border-white/5 rounded-lg">
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Click the <span className="text-orange-400">Voice</span> button in the header, then speak a command. Voice recognition works best in a quiet environment.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        onEnded={() => {
          setIsPlaying(false);
          handleNext(); // Auto-advance to next track
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
            audioRef.current.volume = volume;
          }
        }}
        onError={(e) => console.error("Audio playback error:", e)}
        playsInline
        preload="auto"
      />
    </div>
  );
};

// 5. TOUR ARCHIVE (Restored Ticket Hub)
const TourHistory = () => {
  const dates = [
    { city: "RED HOOK, NY", venue: "THE REC CENTER", date: "AUG 14 2004", status: "SOLD OUT", price: "$15.00", seats: "0", info: "Homecoming Show" },
    { city: "HARLEM, NY", venue: "APOLLO THEATER", date: "SEP 02 2004", status: "COMPLETED", price: "$25.00", seats: "0", info: "Opener for Mobb Deep" },
    { city: "TORONTO, ON", venue: "OPERA HOUSE", date: "OCT 05 2004", status: "SELLING FAST", price: "$22.00 CAD", seats: "42", info: "First Canadian Date" },
    { city: "PHILADELPHIA, PA", venue: "THE TROCADERO", date: "OCT 12 2004", status: "AVAILABLE", price: "$20.00", seats: "150", info: "w/ Beanie Sigel" },
    { city: "BOSTON, MA", venue: "PARADISE ROCK CLUB", date: "OCT 15 2004", status: "AVAILABLE", price: "$18.00", seats: "85", info: "All Ages" }
  ];

  return (
    <div className="h-full w-full relative flex items-center justify-center p-2 md:p-4 overflow-y-auto bg-gradient-to-br from-black via-[#0a0a0a] to-[#050505]" style={{WebkitOverflowScrolling: 'touch'}}>
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 z-10 pointer-events-none"></div>
      <div className="relative z-30 w-full max-w-5xl h-[85vh] bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-[#333] rounded-lg shadow-2xl flex flex-col font-sans my-4 backdrop-blur-sm" style={{boxShadow: '0 20px 60px rgba(0, 255, 65, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'}}>
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f] text-gray-400 px-2 py-1 flex justify-between items-center border-b border-[#444]/50 shadow-none">
           <div className="flex items-center gap-2">
             <Globe size={14} className="text-[#00ff41]"/>
             <span className="text-[10px] md:text-xs font-bold text-gray-300 font-sans"><span className="hidden sm:inline">Agent Studio Tour - </span>Live Events</span>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#050505] p-0 text-gray-300">
           <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f] text-white p-3 md:p-4 border-b-2 border-[#00ff41]/50 flex justify-between items-end">

             <div>
               <h1 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tighter mb-1 italic font-sans text-white">TICKET_HUB <span className="text-[#00ff41]">2004</span></h1>
             </div>
           </div>
           
           {/* Desktop: Table view */}
           <div className="p-4 hidden md:block">
             <table className="w-full text-left border-collapse border border-[#333] bg-[#050505] text-xs md:text-sm shadow-none font-sans">
                <thead className="bg-[#1a1a1a] text-[#00ff41]">
                  <tr>
                    <th className="p-2 border border-[#333] w-16 text-center">DATE</th>
                    <th className="p-2 border border-[#333]">EVENT / VENUE</th>
                    <th className="p-2 border border-[#333] w-24">CITY</th>
                    <th className="p-2 border border-[#333] w-20">PRICE</th>
                    <th className="p-2 border border-[#333] w-24 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {dates.map((gig, i) => (
                    <tr key={i} className={`border-b border-[#333] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'} hover:bg-[#1a1a1a] transition-colors group`}>
                      <td className="p-2 border-r border-[#333] font-bold text-gray-400 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center leading-tight">
                          <span className="text-[10px] uppercase text-gray-600">{gig.date.split(' ')[0]}</span>
                          <span className="text-lg text-white font-black group-hover:text-[#00ff41] transition-colors">{gig.date.split(' ')[1]}</span>
                          <span className="text-[9px] text-gray-600">{gig.date.split(' ')[2]}</span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-[#333] align-top">
                        <div className="font-bold text-white uppercase underline cursor-pointer hover:text-[#00ff41]">WHIP MONTEZ - LIVE</div>
                        <div className="text-[11px] text-gray-400 font-bold mt-0.5">{gig.venue}</div>
                        <div className="text-[10px] text-gray-600 italic mb-1">{gig.info}</div>
                        <div className="flex gap-3 mt-1 text-[9px] text-blue-400 font-bold">
                           <span className="flex items-center gap-0.5 cursor-pointer hover:text-white"><MapPin size={10}/> VIEW MAP</span>
                           <span className="flex items-center gap-0.5 cursor-pointer hover:text-white"><Grid size={10}/> SEATING CHART</span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-[#333] font-bold text-gray-400 align-middle text-[11px]">{gig.city}</td>
                      <td className="p-2 border-r border-[#333] font-mono text-[#00ff41] font-bold align-middle">{gig.price}</td>
                      <td className="p-2 border-r border-[#333] text-center font-bold align-middle">
                        {gig.status === 'SOLD OUT' ? <span className="text-red-500">0</span> : gig.status === 'CANCELLED' ? <span className="text-gray-600">-</span> : gig.status === 'COMPLETED' ? (
                          <span className="text-gray-500 font-bold text-[10px]">CLOSED</span>
                        ) : (
                          <button className="bg-[#00ff41] text-black border border-[#00ff41] px-3 py-1 text-[10px] font-black hover:bg-white hover:border-white transition-colors flex items-center justify-center gap-1 mx-auto w-full">
                            <Ticket size={10} strokeWidth={3}/> BUY
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
           
           {/* Mobile: Card view */}
           <div className="md:hidden p-3 space-y-3">
             {dates.map((gig, i) => (
               <div key={i} className="border border-[#333] bg-[#0a0a0a] p-3">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <div className="text-white font-bold text-sm uppercase">WHIP MONTEZ - LIVE</div>
                     <div className="text-[11px] text-gray-400 font-bold">{gig.venue}</div>
                   </div>
                   <div className="text-right">
                     <div className="text-[#00ff41] font-mono font-bold text-sm">{gig.price}</div>
                     <div className="text-[10px] text-gray-600">{gig.date}</div>
                   </div>
                 </div>
                 <div className="text-[10px] text-gray-600 mb-2">{gig.city}</div>
                 <div className="text-[10px] text-gray-500 italic mb-2">{gig.info}</div>
                 <div className="flex justify-between items-center">
                   <div className="text-[10px] text-gray-600 font-bold">
                     {gig.seats} {gig.seats === "0" ? "SOLD OUT" : "seats left"}
                   </div>
                   {gig.status === 'SOLD OUT' ? (
                     <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                   ) : gig.status === 'COMPLETED' ? (
                     <span className="text-gray-500 text-xs font-bold">CLOSED</span>
                   ) : (
                     <button className="bg-[#00ff41] text-black px-4 py-1.5 text-xs font-black hover:bg-white transition-colors flex items-center gap-1">
                       <Ticket size={12} strokeWidth={3}/> BUY NOW
                     </button>
                   )}
                 </div>
               </div>
             ))}
           </div>
             
           {/* Footer Legal */}
           <div className="p-3 md:p-4">
             <div className="mt-6 border-t border-[#333] pt-2 flex flex-col gap-1">
                <div className="flex flex-wrap gap-2 md:gap-4 text-[9px] md:text-[10px] text-gray-500 font-bold underline">
                   <span className="hover:text-white cursor-pointer">Privacy Policy</span>
                   <span className="hover:text-white cursor-pointer">Terms of Use</span>
                   <span className="hover:text-white cursor-pointer">Purchase Policy</span>
                   <span className="hover:text-white cursor-pointer">Sell Tickets</span>
                </div>
                <div className="text-[8px] md:text-[9px] text-gray-600 font-mono mt-2">
                   * All times are Eastern Standard Time. Prices do not include service fees ($4.50) or facility charges.<br/>
                   * Livewire Entertainment is not responsible for lost or stolen tickets.
                </div>
                <div className="mt-4 flex items-center gap-2 opacity-50">
                   <div className="h-5 md:h-6 w-8 md:w-10 border border-gray-600 bg-black flex items-center justify-center text-[7px] md:text-[8px] font-bold text-gray-400 italic">VISA</div>
                   <div className="h-5 md:h-6 w-8 md:w-10 border border-gray-600 bg-black flex items-center justify-center text-[7px] md:text-[8px] font-bold text-gray-400 italic">MC</div>
                   <div className="h-5 md:h-6 w-8 md:w-10 border border-gray-600 bg-black flex items-center justify-center text-[7px] md:text-[8px] font-bold text-gray-400 italic">AMEX</div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// 6. STYLE ARCHIVE (Merch Store)
const StyleArchive = () => {
  // Fallback Data - Whip Montez Branded Merch
  const fallbackItems = [
      // WHIP MONTEZ LOGO COLLECTION
      { id: 'm1', name: "WHIP MONTEZ Logo Tee - Black", category: "Shirts", price: 35, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80", desc: "Neon green logo on black cotton", collection: "Logo" },
      { id: 'm2', name: "WHIP MONTEZ Logo Tee - White", category: "Shirts", price: 35, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80", desc: "Black logo on white cotton", collection: "Logo" },
      { id: 'm3', name: "LIVEWIRE NYC Hoodie", category: "Hoodies", price: 85, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80", desc: "Livewire Entertainment logo back print", collection: "Logo" },
      
      // BOOT SEQUENCE COLLECTION - Terminal/Retro OS themed
      { id: 'm4', name: "SYSTEM_READY Boot Sequence Tee", category: "Shirts", price: 45, image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80", desc: "Terminal boot text full print", collection: "Boot Sequence" },
      { id: 'm5', name: "RESTORED_OS Hoodie", category: "Hoodies", price: 95, image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80", desc: "Boot sequence code on sleeves", collection: "Boot Sequence" },
      { id: 'm6', name: "C:\\WHIP_MONTEZ\\ Long Sleeve", category: "Shirts", price: 50, image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&q=80", desc: "File path typography design", collection: "Boot Sequence" },
      { id: 'm7', name: "INITIALIZING... Crewneck", category: "Hoodies", price: 75, image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500&q=80", desc: "Loading bar animation print", collection: "Boot Sequence" },
      
      // AI AGENT COLLECTION - Studio tools themed
      { id: 'm8', name: "GHOST Agent Tee", category: "Shirts", price: 40, image: "https://images.unsplash.com/photo-1571542617696-6136d2c4760d?w=500&q=80", desc: "Ghostwriter AI lyric engine logo", collection: "AI Agents" },
      { id: 'm9', name: "CIPHER Agent Hoodie", category: "Hoodies", price: 90, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80", desc: "Cipher conversation bot emblem", collection: "AI Agents" },
      { id: 'm10', name: "BATTLE Agent Tee", category: "Shirts", price: 40, image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=500&q=80", desc: "Rap battle competition graphic", collection: "AI Agents" },
      { id: 'm11', name: "A&R Agent Bomber", category: "Jackets", price: 150, image: "https://images.unsplash.com/photo-1520367691844-1049d43e9340?w=500&q=80", desc: "Artist development embroidered patch", collection: "AI Agents" },
      { id: 'm12', name: "CRATE Agent Tee", category: "Shirts", price: 40, image: "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=500&q=80", desc: "Sample digger vinyl graphic", collection: "AI Agents" },
      { id: 'm13', name: "VIRAL Agent Windbreaker", category: "Jackets", price: 95, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80", desc: "Video concepts trending design", collection: "AI Agents" },
      { id: 'm14', name: "8 AGENTS All-Over Print Hoodie", category: "Hoodies", price: 110, image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&q=80", desc: "All 8 AI agent icons pattern", collection: "AI Agents" },
      
      // BIO SEQUENCE / TIMELINE COLLECTION
      { id: 'm15', name: "BROOKLYN 2004 Vintage Tee", category: "Shirts", price: 45, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80", desc: "Whip's origin story timeline", collection: "Bio Sequence" },
      { id: 'm16', name: "RED HOOK DIARIES Hoodie", category: "Hoodies", price: 95, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80", desc: "Album artwork back print", collection: "Bio Sequence" },
      { id: 'm17', name: "ERICK SERMON SESSIONS Tee", category: "Shirts", price: 50, image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80", desc: "Collaboration era graphic", collection: "Bio Sequence" },
      { id: 'm18', name: "LIVEWIRE SESSIONS Jacket", category: "Jackets", price: 140, image: "https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=500&q=80", desc: "Debut album tour jacket replica", collection: "Bio Sequence" },
      { id: 'm19', name: "TALIB KWELI Feature Tee", category: "Shirts", price: 50, image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&q=80", desc: "Conscious hip-hop collab print", collection: "Bio Sequence" },
      
      // ACCESSORIES
      { id: 'm20', name: "WHIP MONTEZ Snapback", category: "Accessories", price: 35, image: "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=500&q=80", desc: "Embroidered neon green logo", collection: "Logo" },
      { id: 'm21', name: "SYSTEM_READY Beanie", category: "Accessories", price: 28, image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&q=80", desc: "Boot sequence knit pattern", collection: "Boot Sequence" },
      { id: 'm22', name: "AI STUDIO Crossbody Bag", category: "Bags", price: 55, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&q=80", desc: "Agent icons utility bag", collection: "AI Agents" },
      { id: 'm23', name: "LIVEWIRE Duffle Bag", category: "Bags", price: 85, image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=500&q=80", desc: "Tour-ready travel bag", collection: "Logo" },
      { id: 'm24', name: "WHIP MONTEZ Bandana 3-Pack", category: "Accessories", price: 25, image: "https://images.unsplash.com/photo-1616956873272-942c9f86d1e3?w=500&q=80", desc: "Logo, Boot, Agent designs", collection: "Logo" },
      
      // PANTS
      { id: 'm25', name: "RESTORED_OS Cargo Pants", category: "Pants", price: 95, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80", desc: "Terminal text cargo pockets", collection: "Boot Sequence" },
      { id: 'm26', name: "WHIP MONTEZ Joggers", category: "Pants", price: 70, image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&q=80", desc: "Logo stripe down leg", collection: "Logo" },
      { id: 'm27', name: "AI AGENTS Sweatpants", category: "Pants", price: 65, image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&q=80", desc: "Agent icons scattered print", collection: "AI Agents" },
      
      // LIMITED EDITION
      { id: 'm28', name: "ARE Experience Box Set Tee", category: "Shirts", price: 60, image: "https://images.unsplash.com/photo-1571542617696-6136d2c4760d?w=500&q=80", desc: "Alternative Reality Experience limited", collection: "Limited" },
      { id: 'm29', name: "THE COME UP Mentorship Hoodie", category: "Hoodies", price: 100, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80", desc: "Mentorship program exclusive", collection: "Limited" },
      { id: 'm30', name: "EVIDENCE_LOCKER Varsity Jacket", category: "Jackets", price: 175, image: "https://images.unsplash.com/photo-1520367691844-1049d43e9340?w=500&q=80", desc: "Lost Tapes audio archive special", collection: "Limited" }
  ];

  const [items, setItems] = useState(fallbackItems);
  const [filteredItems, setFilteredItems] = useState(fallbackItems);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [filters, setFilters] = useState({ category: 'All', sort: 'newest', search: '' });
  const [showSeed, setShowSeed] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Firestore Sync with Fallback
  useEffect(() => {
    if (!db) {
        // Run in Offline/Demo Mode
        setItems(fallbackItems);
        return;
    }
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'merch'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Always show fallback items if database is empty or items don't have images
      if (data.length === 0 || data.some(item => !item.image)) {
        setItems(fallbackItems);
        setShowSeed(true);
      } else {
        setItems(data);
        setShowSeed(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Filtering Logic
  useEffect(() => {
    let result = [...items];
    
    if (filters.category !== 'All') {
      result = result.filter(item => item.category === filters.category);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q)
      );
    }

    if (filters.sort === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredItems(result);
  }, [items, filters]);

  const seedData = async () => {
    if (!db) return;
    const seedItems = [
      { name: "Livewire Official Tee - Black", category: "Shirts", price: 35, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80", desc: "Classic Logo Black" },
      { name: "Whip Montez Red Hook Hoodie", category: "Hoodies", price: 85, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80", desc: "Heavyweight Cotton" },
      { name: "Livewire Cargo Pants", category: "Pants", price: 95, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80", desc: "Tactical Pockets" },
      { name: "Whip Tour Backpack '04", category: "Bags", price: 60, image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500&q=80", desc: "Canvas Rucksack" },
      { name: "Graffiti Logo Joggers", category: "Pants", price: 70, image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&q=80", desc: "All-over Print" },
      { name: "Whip Montez Bandana Pack", category: "Accessories", price: 20, image: "https://images.unsplash.com/photo-1616956873272-942c9f86d1e3?w=500&q=80", desc: "3 Colors" },
      { name: "Livewire Velour Track Top", category: "Hoodies", price: 110, image: "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=500&q=80", desc: "Navy Blue" },
      { name: "Whip Montez Snapback Hat", category: "Accessories", price: 30, image: "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=500&q=80", desc: "Embroidered Logo" },
      { name: "Livewire 2004 Album Tee", category: "Shirts", price: 40, image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&q=80", desc: "Album Art Print" },
      { name: "Red Hook Bomber Jacket", category: "Jackets", price: 150, image: "https://images.unsplash.com/photo-1520367691844-1049d43e9340?w=500&q=80", desc: "Heavy Satin Shell" },
      { name: "Montez Skull Beanie", category: "Accessories", price: 25, image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&q=80", desc: "Winter Wear" },
      { name: "Livewire Utility Vest", category: "Jackets", price: 90, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&q=80", desc: "Multi-Pocket" },
      { name: "Whip Cropped Tee", category: "Shirts", price: 30, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80", desc: "Female Fit" },
      { name: "Montez Logo Socks", category: "Accessories", price: 15, image: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=500&q=80", desc: "Mid-Calf" },
      { name: "Digital Camo Hoodie", category: "Hoodies", price: 90, image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80", desc: "Digital Print" },
      { name: "Signature Wristband Set", category: "Accessories", price: 25, image: "https://images.unsplash.com/photo-1611652022419-a9419f74343a?w=500&q=80", desc: "Livewire x Montez" }
    ];

    seedItems.forEach(async (item) => {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'merch'), item);
    });
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const itemData = {
      name: e.target.name.value,
      price: Number(e.target.price.value),
      category: e.target.category.value,
      image: e.target.image.value,
      desc: e.target.desc.value
    };

    if (!db) {
        // Local Update in Demo Mode
        if (editingItem.id) {
            setItems(items.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i));
        } else {
            setItems([...items, { id: Date.now().toString(), ...itemData }]);
        }
        setEditingItem(null);
        return;
    }

    if (editingItem.id) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'merch', editingItem.id), itemData);
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'merch'), itemData);
    }
    setEditingItem(null);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this item?")) {
        if (!db) {
            setItems(items.filter(i => i.id !== id));
            return;
        }
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'merch', id));
    }
  };

  const handleImageUpload = async () => {
    if (!uploadFile || !storage) return;
    
    setUploadingImage(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `merch-images/${Date.now()}_${uploadFile.name}`);
      await uploadBytes(storageRef, uploadFile);
      const url = await getDownloadURL(storageRef);
      
      // Return URL for use in product form
      alert(`Image uploaded! URL: ${url}`);
      // Copy to clipboard
      navigator.clipboard.writeText(url);
      setUploadFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    }
    setUploadingImage(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] text-gray-300 relative font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-14 md:h-20 border-b border-[#333] flex items-center justify-between px-3 md:px-6 bg-[#111] z-20 shrink-0">
        <div className="flex flex-col gap-0.5 md:gap-1">
          <h2 className="text-lg md:text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-1 md:gap-2">
             <ShoppingBag size={18} className="md:w-6 md:h-6 text-[#00ff41]"/>
             <span className="hidden sm:inline">STORE_FRONT</span>
             <span className="sm:hidden">STORE</span>
          </h2>
          <div className="text-[8px] md:text-[10px] text-[#00ff41] font-mono tracking-wider md:tracking-widest uppercase">LIVEWIRE x WHIP MONTEZ</div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-2 bg-[#222] px-3 py-1 rounded-full border border-[#333]">
            <Search size={14} />
            <input 
              className="bg-transparent outline-none text-xs w-32 text-white placeholder-gray-500"
              placeholder="Search styles..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div onClick={() => setIsCartOpen(true)} onTouchEnd={(e) => { e.preventDefault(); setIsCartOpen(true); }} className="relative cursor-pointer hover:text-[#00ff41] transition-colors touch-manipulation">
            <ShoppingBag size={20}/>
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-[#00ff41] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* SIDEBAR */}
        <div className="w-56 lg:w-64 bg-[#0a0a0a] border-r border-[#333] p-4 lg:p-6 hidden md:flex flex-col gap-6 lg:gap-8 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-[#00ff41] mb-4 uppercase tracking-widest flex items-center gap-2"><Filter size={12}/> Categories</h3>
            <div className="space-y-2">
              {['All', 'Shirts', 'Pants', 'Hoodies', 'Bags', 'Accessories', 'Jackets'].map(cat => (
                <div 
                  key={cat} 
                  onClick={() => setFilters({...filters, category: cat})}
                  onTouchEnd={(e) => { e.preventDefault(); setFilters({...filters, category: cat}); }}
                  className={`cursor-pointer text-sm hover:text-white transition-colors flex justify-between items-center touch-manipulation ${filters.category === cat ? 'text-white font-bold' : 'text-gray-500'}`}
                >
                  {cat}
                  {filters.category === cat && <div className="w-1.5 h-1.5 bg-[#00ff41] rounded-full"></div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#00ff41] mb-4 uppercase tracking-widest">Sort By</h3>
            <select 
              value={filters.sort}
              onChange={(e) => setFilters({...filters, sort: e.target.value})}
              className="w-full bg-[#111] border border-[#333] text-xs text-white p-2 outline-none focus:border-[#00ff41]"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>
          </div>

          <div className="mt-auto border-t border-[#333] pt-4">
             <button 
               onClick={() => setIsAdmin(!isAdmin)}
               className={`w-full py-2 text-[10px] font-bold tracking-widest uppercase border ${isAdmin ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'border-[#333] text-gray-600 hover:border-gray-400'}`}
             >
               {isAdmin ? 'ADMIN MODE: ON' : 'STAFF LOGIN'}
             </button>
             
             {isAdmin && showSeed && (
               <button 
                 onClick={seedData} 
                 className="w-full mt-2 py-2 text-[10px] font-bold tracking-widest uppercase bg-blue-600 text-white hover:bg-blue-500"
               >
                 SEED DEFAULT INVENTORY
               </button>
             )}

             {/* Admin Image Upload */}
             {isAdmin && (
               <div className="mt-4 border-t border-[#333] pt-4">
                 <h4 className="text-[10px] text-[#00ff41] font-bold mb-2 uppercase tracking-widest">Upload Product Image</h4>
                 <input
                   type="file"
                   accept="image/*"
                   onChange={(e) => setUploadFile(e.target.files[0])}
                   className="w-full bg-[#0a0a0a] border border-[#333] text-white px-2 py-1 text-[9px] mb-2"
                 />
                 <button
                   onClick={handleImageUpload}
                   disabled={!uploadFile || uploadingImage}
                   className="w-full bg-purple-600 text-white py-2 text-[10px] font-bold uppercase disabled:opacity-50 hover:bg-purple-500"
                 >
                   {uploadingImage ? 'UPLOADING...' : 'UPLOAD IMAGE'}
                 </button>
                 {uploadFile && (
                   <div className="mt-1 text-[8px] text-gray-400 truncate">
                     {uploadFile.name}
                   </div>
                 )}
                 <p className="mt-2 text-[8px] text-gray-500">URL will be copied to clipboard</p>
               </div>
             )}
          </div>
        </div>

        {/* GRID */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0e0e0e]" style={{WebkitOverflowScrolling: 'touch'}}>
          
          {/* Mobile Filters */}
          <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-2" style={{WebkitOverflowScrolling: 'touch'}}>
            {['All', 'Shirts', 'Pants', 'Hoodies', 'Bags', 'Accessories', 'Jackets'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setFilters({...filters, category: cat})}
                onTouchEnd={(e) => { e.preventDefault(); setFilters({...filters, category: cat}); }}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-colors touch-manipulation ${
                  filters.category === cat 
                    ? 'bg-[#00ff41] text-black border-[#00ff41]' 
                    : 'border-[#333] text-gray-500 active:bg-[#222]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {isAdmin && (
            <div 
              onClick={() => setEditingItem({})}
              className="mb-4 md:mb-6 p-3 md:p-4 border-2 border-dashed border-[#333] flex items-center justify-center gap-2 cursor-pointer hover:border-[#00ff41] hover:text-[#00ff41] transition-all text-gray-500"
            >
              <Plus size={18} className="md:w-5 md:h-5"/> <span className="font-bold text-xs md:text-sm uppercase">Add New Product</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="group relative bg-[#111] border border-[#222] hover:border-[#00ff41]/50 transition-all duration-300 flex flex-col">
                <div className="aspect-[3/4] overflow-hidden relative bg-[#050505]">
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80'} 
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80'; }}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-white/10 text-2xl md:text-4xl font-black uppercase tracking-widest transform rotate-[-25deg] select-none" style={{textShadow: '0 0 40px rgba(0,0,0,0.5)'}}>
                      WHIP MONTEZ
                    </div>
                  </div>
                  {/* Mobile: Always visible button */}
                  <div className="md:hidden absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                    <button 
                      onClick={() => { setCart([...cart, item]); setIsCartOpen(true); }}
                      onTouchEnd={(e) => { e.preventDefault(); setCart([...cart, item]); setIsCartOpen(true); }}
                      className="w-full bg-[#00ff41] text-black font-bold text-[10px] py-2 uppercase tracking-wider hover:bg-white transition-colors shadow-lg touch-manipulation"
                    >
                      Add
                    </button>
                  </div>
                  {/* Desktop: Hover to show */}
                  <div className="hidden md:block absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black to-transparent">
                    <button 
                      onClick={() => { setCart([...cart, item]); setIsCartOpen(true); }}
                      onTouchEnd={(e) => { e.preventDefault(); setCart([...cart, item]); setIsCartOpen(true); }}
                      className="w-full bg-[#00ff41] text-black font-bold text-xs py-3 uppercase tracking-widest hover:bg-white transition-colors shadow-lg touch-manipulation"
                    >
                      Add To Cart
                    </button>
                  </div>
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => setEditingItem(item)} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500"><Edit2 size={12}/></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-600 text-white rounded hover:bg-red-500"><Trash2 size={12}/></button>
                    </div>
                  )}
                </div>
                <div className="p-2 md:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[9px] md:text-[10px] text-[#00ff41] font-mono uppercase mb-0.5 md:mb-1">{item.category}</div>
                    <h3 className="text-white font-bold text-xs md:text-sm uppercase leading-tight mb-0.5 md:mb-1">{item.name}</h3>
                    <p className="text-gray-500 text-[10px] md:text-xs hidden sm:block">{item.desc}</p>
                  </div>
                  <div className="mt-2 md:mt-4 font-mono text-white text-base md:text-lg">${item.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CART */}
      {isCartOpen && (
        <div 
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end" 
          onClick={(e) => e.target === e.currentTarget && setIsCartOpen(false)}
          onTouchEnd={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); setIsCartOpen(false); } }}
        >
          <div className="w-full sm:max-w-md bg-[#111] border-l border-[#333] shadow-2xl flex flex-col h-full animate-slide-in-right touch-manipulation">
            <div className="h-12 md:h-16 border-b border-[#333] flex items-center justify-between px-3 md:px-6 shrink-0">
              <h2 className="text-base md:text-xl font-black uppercase tracking-tighter text-white">CART ({cart.length})</h2>
              <button onClick={() => setIsCartOpen(false)} onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setIsCartOpen(false); }} className="touch-manipulation p-2"><X size={20} className="text-gray-400 hover:text-white"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4" style={{WebkitOverflowScrolling: 'touch'}}>
              {cart.map((item, i) => (
                <div key={i} className="flex gap-2 md:gap-4 border border-[#333] p-2 bg-[#0a0a0a]">
                  <img src={item.image} className="w-12 h-12 md:w-16 md:h-16 object-cover bg-[#222] shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-xs md:text-sm uppercase truncate">{item.name}</div>
                    <div className="text-[#00ff41] font-mono text-[10px] md:text-xs">${item.price}</div>
                  </div>
                  <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} onTouchEnd={(e) => { e.preventDefault(); setCart(cart.filter((_, idx) => idx !== i)); }} className="text-gray-500 hover:text-red-500 shrink-0 touch-manipulation"><X size={14}/></button>
                </div>
              ))}
              {cart.length === 0 && <div className="text-center text-gray-600 mt-10 text-sm">Cart is empty.</div>}
            </div>
            <div className="p-3 md:p-6 border-t border-[#333] shrink-0">
              <div className="flex justify-between items-end mb-3 md:mb-4">
                <span className="text-gray-500 text-[10px] md:text-xs">SUBTOTAL</span>
                <span className="text-white font-bold text-lg md:text-xl">${cart.reduce((a, b) => a + b.price, 0)}</span>
              </div>
              <button className="w-full bg-[#00ff41] text-black py-2.5 md:py-3 font-bold uppercase tracking-wider md:tracking-widest text-[10px] md:text-xs hover:bg-white transition-colors">CHECKOUT</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <form onSubmit={handleSaveItem} className="w-full max-w-lg bg-[#111] border border-[#333] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 uppercase border-b border-[#333] pb-2">
              {editingItem.id ? 'Edit Product' : 'Add New Product'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Product Name</label>
                <input name="name" defaultValue={editingItem.name} className="w-full bg-black border border-[#333] text-white p-2 outline-none focus:border-[#00ff41]" required/>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Price ($)</label>
                  <input name="price" type="number" defaultValue={editingItem.price} className="w-full bg-black border border-[#333] text-white p-2 outline-none focus:border-[#00ff41]" required/>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select name="category" defaultValue={editingItem.category || 'Shirts'} className="w-full bg-black border border-[#333] text-white p-2 outline-none focus:border-[#00ff41]">
                    {['Shirts', 'Pants', 'Hoodies', 'Bags', 'Accessories', 'Jackets'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                <input name="image" defaultValue={editingItem.image} className="w-full bg-black border border-[#333] text-white p-2 outline-none focus:border-[#00ff41]" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input name="desc" defaultValue={editingItem.desc} className="w-full bg-black border border-[#333] text-white p-2 outline-none focus:border-[#00ff41]"/>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setEditingItem(null)} className="flex-1 border border-[#333] text-gray-400 py-2 hover:bg-[#222]">CANCEL</button>
              <button type="submit" className="flex-1 bg-[#00ff41] text-black font-bold py-2 hover:bg-white">SAVE CHANGES</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// 7. STUDIO - FUTURISTIC AI AGENT HUB
const Studio = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [agentInput, setAgentInput] = useState("");
  const [agentOutput, setAgentOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [storyboardScenes, setStoryboardScenes] = useState([]);
  const [designTemplates, setDesignTemplates] = useState([]);
  const [imageSettings, setImageSettings] = useState({ style: 'album-art', aspect: '1:1', quality: 'standard' });
  const [videoSettings, setVideoSettings] = useState({ platform: 'tiktok', duration: '30', mood: 'energetic' });
  const [shareMenuOpen, setShareMenuOpen] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [twitterUsername, setTwitterUsername] = useState('');
  const [twitterPosting, setTwitterPosting] = useState(false);
  const [twitterPostSuccess, setTwitterPostSuccess] = useState(null);
  
  // NEW: Onboarding & Help System
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showQuickTip, setShowQuickTip] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  
  // NEW: Camera/Video Import for TikTok
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const chunksRef = useRef([]);
  
  // NEW: Voice Input System
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  
  // NEW: Text-to-Speech Output System
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState('smooth');
  const [showVoiceStyleMenu, setShowVoiceStyleMenu] = useState(null);
  const [userRecording, setUserRecording] = useState(null);
  const [isRecordingFlow, setIsRecordingFlow] = useState(false);
  const userAudioRecorderRef = useRef(null);
  const userAudioChunksRef = useRef([]);
  
  // Voice Style Presets (different delivery energies)
  const voiceStyles = {
    growler: { name: 'The Growler', desc: 'Aggressive, intense bark', pitch: 0.6, rate: 0.9, icon: '🔥' },
    rapidfire: { name: 'Rapid Fire', desc: 'Fast, choppy, high energy', pitch: 1.1, rate: 1.6, icon: '⚡' },
    smooth: { name: 'Smooth Operator', desc: 'Laid back, confident flow', pitch: 0.9, rate: 0.85, icon: '😎' },
    street: { name: 'Street General', desc: 'Hard, commanding presence', pitch: 0.7, rate: 0.95, icon: '👑' },
    poet: { name: 'The Poet', desc: 'Thoughtful, storytelling', pitch: 1.0, rate: 0.75, icon: '📜' },
    hype: { name: 'Hype Man', desc: 'Loud, energetic, party', pitch: 1.3, rate: 1.3, icon: '🎉' }
  };
  
  // Text-to-Speech Function
  const speakText = (text, styleKey = selectedVoiceStyle) => {
    if (!('speechSynthesis' in window)) {
      console.error('Text-to-speech not supported');
      return;
    }
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    const style = voiceStyles[styleKey] || voiceStyles.smooth;
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get available voices and pick a good one
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    if (englishVoices.length > 0) {
      // Try to find a male voice for more "rapper" sound
      const maleVoice = englishVoices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('David') || v.name.includes('James'));
      utterance.voice = maleVoice || englishVoices[0];
    }
    
    utterance.pitch = style.pitch;
    utterance.rate = style.rate;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    playSound('send');
  };
  
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  
  // Record User's Own Flow
  const startRecordingFlow = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      userAudioRecorderRef.current = new MediaRecorder(stream);
      userAudioChunksRef.current = [];
      
      userAudioRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          userAudioChunksRef.current.push(e.data);
        }
      };
      
      userAudioRecorderRef.current.onstop = () => {
        const blob = new Blob(userAudioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setUserRecording(url);
        stream.getTracks().forEach(track => track.stop());
      };
      
      userAudioRecorderRef.current.start();
      setIsRecordingFlow(true);
      playSound('start');
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  };
  
  const stopRecordingFlow = () => {
    if (userAudioRecorderRef.current && isRecordingFlow) {
      userAudioRecorderRef.current.stop();
      setIsRecordingFlow(false);
      playSound('success');
    }
  };
  
  const downloadUserRecording = () => {
    if (userRecording) {
      const a = document.createElement('a');
      a.href = userRecording;
      a.download = `my-flow-${Date.now()}.webm`;
      a.click();
    }
  };
  
  // NEW: Swipe Gesture Navigation
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;
  
  const lastRequestTime = useRef(0);
  
  // Initialize Voice Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setAgentInput(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        playSound('stop');
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);
  
  const toggleVoiceInput = () => {
    if (!voiceSupported) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      playSound('start');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  
  // Sound Effects System
  const playSound = (type) => {
    const sounds = {
      start: 'data:audio/wav;base64,UklGRl9vT19teleURCRSUAAAABhxYW1hAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      stop: 'data:audio/wav;base64,UklGRl9vT19teleURCRSUAAAABhxYW1hAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      send: 'data:audio/wav;base64,UklGRl9vT19teleURCRSUAAAABhxYW1hAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      success: 'data:audio/wav;base64,UklGRl9vT19teleURCRSUAAAABhxYW1hAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      click: 'data:audio/wav;base64,UklGRl9vT19teleURCRSUAAAABhxYW1hAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    };
    
    // Use Web Audio API for clean sounds
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'start') {
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1);
      } else if (type === 'stop') {
        oscillator.frequency.setValueAtTime(1760, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
      } else if (type === 'send') {
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1047, audioContext.currentTime + 0.15);
      } else if (type === 'success') {
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
      } else {
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // Audio not supported or blocked
    }
  };
  
  // Swipe Gesture Handlers
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (selectedAgent && agents.length > 0) {
      const currentIndex = agents.findIndex(a => a.id === selectedAgent.id);
      
      if (isLeftSwipe && currentIndex < agents.length - 1) {
        // Swipe left = next agent
        playSound('click');
        handleAgentSelect(agents[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        // Swipe right = previous agent
        playSound('click');
        handleAgentSelect(agents[currentIndex - 1]);
      }
    }
  };
  
  // Check if first visit to Studio
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('studio_onboarding_v1');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('studio_onboarding_v1', 'true');
    setShowOnboarding(false);
  };
  
  // Check Twitter connection on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('twitter_connected') === 'true') {
      setTwitterConnected(true);
      setTwitterUsername(urlParams.get('twitter_username') || '');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (urlParams.get('twitter_error')) {
      console.error('Twitter OAuth error:', urlParams.get('twitter_error'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // REMIX SYSTEM - Regenerate content with new elements
  // ═══════════════════════════════════════════════════════════════════
  
  const handleRemix = async (originalContent, agentOrTool) => {
    const remixStyles = [
      'with a darker, moodier vibe',
      'but make it more energetic and upbeat',
      'in a more minimalist style',
      'with stronger Brooklyn/NYC references',
      'with a 90s throwback aesthetic',
      'but make it more commercial/radio-friendly',
      'with more emotional depth',
      'in a trap/drill style',
      'with R&B influences',
      'but make it more aggressive'
    ];
    const randomStyle = remixStyles[Math.floor(Math.random() * remixStyles.length)];
    
    const remixPrompt = `Take this creation and REMIX it ${randomStyle}. Keep the core concept but transform the style and energy:\n\nORIGINAL:\n${originalContent}\n\nCreate a fresh new version that feels different but related.`;
    
    setAgentInput(remixPrompt);
    // Auto-submit the remix
    if (selectedAgent) {
      setIsProcessing(true);
      const result = await callGemini(remixPrompt, selectedAgent.systemPrompt);
      setConversationHistory(prev => [...prev, 
        { role: 'user', content: `🔄 REMIX: ${randomStyle}` },
        { role: 'assistant', content: result }
      ]);
      setAgentOutput(result);
      setIsProcessing(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // CAMERA/VIDEO IMPORT - Record TikTok dances with AI jingles
  // ═══════════════════════════════════════════════════════════════════
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Please allow camera access to record videos');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const startRecording = () => {
    if (!cameraStream) return;
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedVideo(URL.createObjectURL(blob));
    };
    
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadRecording = () => {
    if (recordedVideo) {
      const a = document.createElement('a');
      a.href = recordedVideo;
      a.download = `whip-montez-dance-${Date.now()}.webm`;
      a.click();
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════
  // SOCIAL SHARING INTEGRATION - TikTok, Instagram, Twitter, Download
  // ═══════════════════════════════════════════════════════════════════
  
  // Backend URL
  const BACKEND_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : '';
  
  // Copy to clipboard
  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Share to TikTok (opens TikTok with content ready to paste)
  const handleShareTikTok = (content) => {
    // TikTok doesn't have a direct web share API, so we copy and redirect
    handleCopyToClipboard(content);
    // Open TikTok's create page (user pastes caption)
    window.open('https://www.tiktok.com/upload', '_blank');
  };

  // Share to Instagram (opens Instagram with content copied)
  const handleShareInstagram = (content) => {
    handleCopyToClipboard(content);
    // Instagram doesn't have web upload, but we can link to the app or web
    // On mobile this will prompt to open the app
    window.open('https://www.instagram.com/', '_blank');
  };

  // Connect Twitter/X account
  const handleConnectTwitter = () => {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${BACKEND_URL}/api/twitter/auth?returnUrl=${returnUrl}`;
  };

  // Disconnect Twitter/X account
  const handleDisconnectTwitter = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/twitter/disconnect`, { credentials: 'include' });
      setTwitterConnected(false);
      setTwitterUsername('');
    } catch (err) {
      console.error('Failed to disconnect Twitter:', err);
    }
  };

  // Direct post to Twitter/X
  const handleDirectTweet = async (content) => {
    if (!twitterConnected) {
      handleConnectTwitter();
      return;
    }

    setTwitterPosting(true);
    setTwitterPostSuccess(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/twitter/tweet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          text: content.slice(0, 250) + (content.length > 250 ? '...' : '') + '\n\n🎵 Made with Whip Montez Studio'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsAuth) {
          setTwitterConnected(false);
          handleConnectTwitter();
          return;
        }
        throw new Error(data.error || 'Failed to post tweet');
      }

      setTwitterPostSuccess(data.tweetUrl);
      setTimeout(() => setTwitterPostSuccess(null), 5000);
    } catch (err) {
      console.error('Tweet failed:', err);
      alert('Failed to post tweet: ' + err.message);
    } finally {
      setTwitterPosting(false);
    }
  };

  // Share to Twitter/X with pre-filled text (fallback)
  const handleShareTwitter = (content) => {
    if (twitterConnected) {
      handleDirectTweet(content);
    } else {
      const text = encodeURIComponent(content.slice(0, 280)); // Twitter limit
      const hashtags = encodeURIComponent('WhipMontez,AIStudio,MusicCreation');
      window.open(`https://twitter.com/intent/tweet?text=${text}&hashtags=${hashtags}`, '_blank');
    }
  };

  // Share via Web Share API (native sharing on mobile)
  const handleNativeShare = async (content, title = 'My Creation') => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - Whip Montez Studio`,
          text: content,
          url: window.location.origin
        });
      } catch (err) {
        // User cancelled or error - fall back to copy
        handleCopyToClipboard(content);
      }
    } else {
      // Fallback for desktop
      handleCopyToClipboard(content);
    }
  };

  // Download as text file
  const handleDownloadText = (content, filename = 'creation') => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate shareable image card (creates canvas with styled text)
  const handleDownloadAsImage = async (content, agentName = 'Studio') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (Instagram story size)
    canvas.width = 1080;
    canvas.height = 1920;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    
    // Header
    ctx.fillStyle = '#00ff41';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WHIP MONTEZ STUDIO', canvas.width / 2, 120);
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '24px monospace';
    ctx.fillText(`Created with ${agentName}`, canvas.width / 2, 170);
    
    // Main content area
    ctx.fillStyle = 'rgba(0,255,65,0.1)';
    ctx.fillRect(60, 250, canvas.width - 120, canvas.height - 450);
    ctx.strokeStyle = 'rgba(0,255,65,0.3)';
    ctx.strokeRect(60, 250, canvas.width - 120, canvas.height - 450);
    
    // Content text (word wrap)
    ctx.fillStyle = '#ffffff';
    ctx.font = '36px Arial';
    ctx.textAlign = 'left';
    
    const maxWidth = canvas.width - 160;
    const lineHeight = 50;
    const words = content.split(' ');
    let line = '';
    let y = 330;
    
    for (let word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line.trim(), 100, y);
        line = word + ' ';
        y += lineHeight;
        if (y > canvas.height - 280) {
          ctx.fillText('...', 100, y);
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (y <= canvas.height - 280) {
      ctx.fillText(line.trim(), 100, y);
    }
    
    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('whipmontez.com', canvas.width / 2, canvas.height - 100);
    ctx.fillText('@whipmontez', canvas.width / 2, canvas.height - 60);
    
    // Download
    const link = document.createElement('a');
    link.download = `whip-montez-${agentName.toLowerCase()}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Share Menu Component (inline)
  const ShareMenu = ({ content, agentName, isOpen, onClose, messageIndex }) => {
    if (!isOpen) return null;
    
    return (
      <div className="absolute right-0 top-full mt-2 z-50 bg-black/95 border border-white/20 backdrop-blur-sm shadow-2xl min-w-[220px]">
        <div className="p-2 border-b border-white/10">
          <p className="text-white/50 text-[10px] uppercase tracking-wider">Share Creation</p>
        </div>
        <div className="p-1">
          {/* Twitter Direct Post - Featured when connected */}
          {twitterConnected ? (
            <button
              onClick={() => { handleDirectTweet(content); onClose(); }}
              disabled={twitterPosting}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm border-b border-white/10 mb-1"
            >
              <span className="text-lg">𝕏</span> 
              {twitterPosting ? 'Posting...' : 'Post to Twitter'}
              <span className="text-[10px] text-blue-400/60 ml-auto">@{twitterUsername}</span>
            </button>
          ) : (
            <button
              onClick={() => { handleConnectTwitter(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left bg-white/5 text-white/80 hover:bg-white/10 transition-colors text-sm border-b border-white/10 mb-1"
            >
              <span className="text-lg">𝕏</span> Connect Twitter
              <span className="text-[10px] text-green-400/60 ml-auto">Direct Post</span>
            </button>
          )}
          
          <button
            onClick={() => { handleShareTikTok(content); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-white/80 hover:bg-white/10 transition-colors text-sm"
          >
            <span className="text-lg">📱</span> TikTok
            <span className="text-[10px] text-white/40 ml-auto">Copy + Open</span>
          </button>
          <button
            onClick={() => { handleShareInstagram(content); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-white/80 hover:bg-white/10 transition-colors text-sm"
          >
            <span className="text-lg">📸</span> Instagram
            <span className="text-[10px] text-white/40 ml-auto">Copy + Open</span>
          </button>
          {!twitterConnected && (
            <button
              onClick={() => { handleShareTwitter(content); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-white/80 hover:bg-white/10 transition-colors text-sm"
            >
              <span className="text-lg">𝕏</span> Twitter/X
              <span className="text-[10px] text-white/40 ml-auto">Open Composer</span>
            </button>
          )}
          <button
            onClick={() => { handleNativeShare(content, agentName); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-white/80 hover:bg-white/10 transition-colors text-sm"
          >
            <Share2 size={16} /> Native Share
          </button>
          <div className="border-t border-white/10 my-1"></div>
          <button
            onClick={() => { handleCopyToClipboard(content); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-white/80 hover:bg-white/10 transition-colors text-sm"
          >
            <span className="text-lg">📋</span> Copy Text
          </button>
          <button
            onClick={() => { handleDownloadText(content, agentName); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-white/80 hover:bg-white/10 transition-colors text-sm"
          >
            <span className="text-lg">📄</span> Download .txt
          </button>
          <button
            onClick={() => { handleDownloadAsImage(content, agentName); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-white/80 hover:bg-white/10 transition-colors text-sm"
          >
            <span className="text-lg">🖼️</span> Download as Image
          </button>
        </div>
      </div>
    );
  };
  
  // AI Chat Agents
  const agents = [
    {
      id: 'ghostwriter',
      name: 'GHOSTWRITER',
      subtitle: 'Lyric Engine',
      description: 'AI-powered lyric generation. Write hooks, verses, and complete songs in Whip\'s signature style.',
      icon: FileText,
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-600',
      glow: 'rgba(0,255,255,0.4)',
      systemPrompt: "You are Whip Montez, a gritty, lyrical female rapper from Red Hook Brooklyn, circa 2004. Write an 8-bar verse about the user's topic. Use Spanglish, NY slang from the early 2000s (e.g., 'son', 'dun', 'mad', 'deadass'), and keep it confident and raw. Do not use hashtags. Format it as a verse.",
      placeholder: 'Enter topic: "Summertime in Brooklyn", "Haters", "Money"...',
      features: ['Voice Input', 'Text-to-Speech', 'Style Matching']
    },
    {
      id: 'producer',
      name: 'BEATSMITH',
      subtitle: 'Production AI',
      description: 'Get beat recommendations, arrangement ideas, and production tips from an AI producer.',
      icon: Headphones,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
      glow: 'rgba(168,85,247,0.4)',
      systemPrompt: "You are a legendary hip-hop producer who worked with Whip Montez in the early 2000s. Give detailed production advice, beat ideas, and arrangement suggestions. Reference classic NY hip-hop production techniques (Primo, Pete Rock, RZA style). Be specific about BPM, sample choices, drum patterns, and mixing tips.",
      placeholder: 'Describe the vibe: "dark boom bap", "summer anthem", "club banger"...',
      features: ['BPM Analysis', 'Sample Ideas', 'Mix Tips']
    },
    {
      id: 'manager',
      name: 'THE CONNECT',
      subtitle: 'Industry AI',
      description: 'Navigate the music industry. Get advice on marketing, deals, and building your brand.',
      icon: Briefcase,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      glow: 'rgba(0,255,65,0.4)',
      systemPrompt: "You are a veteran hip-hop manager who guided Whip Montez's career. Give street-smart industry advice about marketing, social media strategy, building a fanbase, negotiating deals, and navigating the music business. Be real and direct. Reference early 2000s indie hustle mentality while also knowing modern digital strategies.",
      placeholder: 'Ask about: "growing on social media", "getting a deal", "pricing merch"...',
      features: ['Marketing Plans', 'Deal Analysis', 'Brand Strategy']
    },
    {
      id: 'battlebot',
      name: 'SPARRING BOT',
      subtitle: 'Battle Trainer',
      description: 'Sharpen your freestyle skills. Get roasted, trade bars, and level up your battle game.',
      icon: Flame,
      color: 'orange',
      gradient: 'from-orange-500 to-red-600',
      glow: 'rgba(249,115,22,0.4)',
      systemPrompt: "You are Whip Montez's battle rap sparring partner. Throw HARD disses at the user (within reason - no slurs or truly offensive content) and challenge them to respond. Be witty, use wordplay, and reference battle rap culture. After they respond, rate their bar and give tips for improvement. Keep it competitive but educational.",
      placeholder: 'Ready to battle? Type anything to start...',
      features: ['Freestyle Training', 'Bar Rating', 'Wordplay Tips']
    },
    {
      id: 'historian',
      name: 'THE ARCHIVE',
      subtitle: 'Lore Database',
      description: 'Deep dive into Whip Montez\'s story, the lost album, and the Red Hook hip-hop scene.',
      icon: Database,
      color: 'amber',
      gradient: 'from-amber-500 to-yellow-600',
      glow: 'rgba(245,158,11,0.4)',
      systemPrompt: "You are the keeper of Whip Montez's history. Answer questions about her story, the lost 'Female Hustle' album, Red Hook Brooklyn in the early 2000s, and the characters in her world (Jari Montez, Talib Kweli collaboration, etc). Be immersive and detailed, treating the lore as real history. Reference specific songs, events, and locations from her career.",
      placeholder: 'Ask about: "the lost album", "Talib Kweli collab", "Red Hook scene"...',
      features: ['Lore Deep Dives', 'Timeline', 'Character Bios']
    }
  ];

  // Creative Tools (Midjourney/Runway/Canva style)
  const creativeTools = [
    {
      id: 'image-lab',
      name: 'IMAGE LAB',
      subtitle: 'AI Image Generator',
      description: 'Create stunning album art, promo graphics, and social content with AI image generation.',
      icon: ImageIcon,
      color: 'violet',
      gradient: 'from-violet-500 to-fuchsia-600',
      glow: 'rgba(139,92,246,0.4)',
      type: 'image',
      features: ['Album Art', 'Social Graphics', 'Promo Images', 'Style Transfer']
    },
    {
      id: 'video-forge',
      name: 'VIDEO FORGE',
      subtitle: 'Video Storyboard AI',
      description: 'Generate video concepts, storyboards, and scene-by-scene breakdowns for your music videos.',
      icon: Film,
      color: 'rose',
      gradient: 'from-rose-500 to-red-600',
      glow: 'rgba(244,63,94,0.4)',
      type: 'video',
      features: ['Storyboards', 'Shot Lists', 'Scene Timing', 'Platform Export']
    },
    {
      id: 'design-deck',
      name: 'DESIGN DECK',
      subtitle: 'Template Studio',
      description: 'Professional templates for social media, merch mockups, and promotional materials.',
      icon: Grid,
      color: 'teal',
      gradient: 'from-teal-500 to-cyan-600',
      glow: 'rgba(20,184,166,0.4)',
      type: 'design',
      features: ['Social Templates', 'Merch Mockups', 'Flyers', 'Media Kit']
    }
  ];

  // Image style presets
  const imageStyles = [
    { id: 'album-art', name: 'Album Art', desc: 'Professional album cover aesthetics' },
    { id: 'street-promo', name: 'Street Promo', desc: 'Gritty urban promotional style' },
    { id: 'neon-future', name: 'Neon Future', desc: 'Cyberpunk/futuristic vibes' },
    { id: 'vintage-hip-hop', name: 'Vintage Hip-Hop', desc: '90s/2000s throwback style' },
    { id: 'minimalist', name: 'Minimalist', desc: 'Clean, modern aesthetic' },
    { id: 'psychedelic', name: 'Psychedelic', desc: 'Trippy, colorful visuals' }
  ];

  // Aspect ratios
  const aspectRatios = [
    { id: '1:1', name: 'Square', desc: 'Instagram, Album Art' },
    { id: '9:16', name: 'Story/Reel', desc: 'TikTok, IG Stories' },
    { id: '16:9', name: 'Landscape', desc: 'YouTube, Twitter' },
    { id: '4:5', name: 'Portrait', desc: 'Instagram Feed' }
  ];

  // Video platforms
  const videoPlatforms = [
    { id: 'tiktok', name: 'TikTok', duration: '15-60s', aspect: '9:16' },
    { id: 'youtube', name: 'YouTube', duration: '3-5min', aspect: '16:9' },
    { id: 'instagram-reels', name: 'IG Reels', duration: '30-90s', aspect: '9:16' },
    { id: 'music-video', name: 'Music Video', duration: '3-4min', aspect: '16:9' }
  ];

  // Design templates
  const designCategories = [
    { id: 'social', name: 'Social Media', templates: ['IG Post', 'IG Story', 'Twitter Banner', 'YouTube Thumb'] },
    { id: 'promo', name: 'Promotional', templates: ['Show Flyer', 'Press Release', 'EPK Page', 'Media Kit'] },
    { id: 'merch', name: 'Merchandise', templates: ['T-Shirt', 'Hoodie', 'Poster', 'Sticker Pack'] },
    { id: 'streaming', name: 'Streaming', templates: ['Spotify Canvas', 'Apple Music', 'Playlist Cover', 'Lyric Card'] }
  ];

  // Generate AI Image
  const handleImageGenerate = async () => {
    if (!agentInput.trim()) return;
    
    setIsProcessing(true);
    
    const imagePrompt = `Create a detailed image description for: "${agentInput}". 
    Style: ${imageStyles.find(s => s.id === imageSettings.style)?.name || 'Album Art'}
    Aspect Ratio: ${imageSettings.aspect}
    
    Describe the image in vivid detail including: composition, colors, lighting, mood, textures, and any text/typography. 
    Format as a professional art direction brief that could be sent to a designer or AI image generator.
    Include: MAIN SUBJECT, BACKGROUND, COLOR PALETTE, LIGHTING, MOOD, and TYPOGRAPHY suggestions.`;
    
    const result = await callGemini(imagePrompt, "You are a professional art director and visual designer. Create detailed, actionable image descriptions that could be used with Midjourney or DALL-E. Be specific about visual elements, colors, composition, and mood.");
    
    // Create a mock generated image card
    const newImage = {
      id: crypto.randomUUID(),
      prompt: agentInput,
      style: imageSettings.style,
      aspect: imageSettings.aspect,
      description: result,
      createdAt: new Date().toISOString(),
      // Mock image URLs (would be real AI generated images in production)
      thumbnail: `https://picsum.photos/seed/${Date.now()}/400/400`
    };
    
    setGeneratedImages(prev => [newImage, ...prev]);
    setAgentOutput(result);
    setIsProcessing(false);
  };

  // Generate Video Storyboard
  const handleVideoGenerate = async () => {
    if (!agentInput.trim()) return;
    
    setIsProcessing(true);
    
    const platform = videoPlatforms.find(p => p.id === videoSettings.platform);
    const videoPrompt = `Create a detailed video storyboard for: "${agentInput}"
    Platform: ${platform?.name || 'TikTok'}
    Duration: ${platform?.duration || '30s'}
    Aspect Ratio: ${platform?.aspect || '9:16'}
    Mood: ${videoSettings.mood}
    
    Generate a scene-by-scene breakdown with:
    1. SCENE NUMBER and TIMESTAMP
    2. VISUAL DESCRIPTION (what's on screen)
    3. CAMERA MOVEMENT (pan, zoom, static, etc.)
    4. AUDIO/MUSIC CUE
    5. TEXT OVERLAY (if any)
    6. TRANSITION to next scene
    
    Create 4-8 scenes that tell a compelling visual story. Think like Hype Williams meets modern viral content.`;
    
    const result = await callGemini(videoPrompt, "You are a music video director who has worked with major hip-hop artists. Create cinematic, engaging storyboards that would go viral on social media. Be specific about shots, timing, and visual hooks.");
    
    // Parse into scenes (simplified - would be more robust in production)
    const scenes = result.split(/SCENE \d+|Scene \d+/i).filter(s => s.trim()).map((scene, i) => ({
      id: i + 1,
      content: scene.trim(),
      timestamp: `${i * 5}s`
    }));
    
    setStoryboardScenes(scenes);
    setAgentOutput(result);
    setIsProcessing(false);
  };

  // Generate Design Templates
  const handleDesignGenerate = async (category, template) => {
    setIsProcessing(true);
    
    const designPrompt = `Create a design brief for a ${template} in the ${category} category.
    Artist: Whip Montez (female rapper, Brooklyn, gritty but sophisticated)
    Theme: ${agentInput || 'Female Hustle era aesthetic'}
    
    Provide:
    1. LAYOUT: Describe the composition and element placement
    2. TYPOGRAPHY: Font recommendations and text hierarchy
    3. COLOR SCHEME: Specific hex codes or color names
    4. IMAGERY: What photos/graphics to include
    5. COPY: Suggested text/headlines
    6. DIMENSIONS: Exact pixel dimensions for the platform
    7. EXPORT SETTINGS: File format and resolution
    
    Make it professional and ready for a graphic designer to execute.`;
    
    const result = await callGemini(designPrompt, "You are a professional graphic designer specializing in music industry branding. Create detailed, actionable design briefs with specific measurements, colors, and typography.");
    
    const newTemplate = {
      id: crypto.randomUUID(),
      category,
      template,
      brief: result,
      createdAt: new Date().toISOString()
    };
    
    setDesignTemplates(prev => [newTemplate, ...prev]);
    setAgentOutput(result);
    setIsProcessing(false);
  };

  const handleAgentSubmit = async () => {
    if (!agentInput.trim() || !selectedAgent) return;
    
    const cooldownTime = 3000;
    const now = Date.now();
    if (now - lastRequestTime.current < cooldownTime) {
      alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds.`);
      return;
    }
    
    setIsProcessing(true);
    setAgentOutput("");
    
    const userMessage = { role: 'user', content: agentInput };
    setConversationHistory(prev => [...prev, userMessage]);
    
    const result = await callGemini(agentInput, selectedAgent.systemPrompt);
    lastRequestTime.current = Date.now();
    
    const agentMessage = { role: 'agent', content: result };
    setConversationHistory(prev => [...prev, agentMessage]);
    setAgentOutput(result);
    setAgentInput("");
    setIsProcessing(false);
  };

  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent);
    setConversationHistory([]);
    setAgentOutput("");
    setAgentInput("");
  };

  // ═══════════════════════════════════════════════════════════════════
  // ONBOARDING TUTORIAL - Welcome new users to the Studio
  // ═══════════════════════════════════════════════════════════════════
  
  const onboardingSteps = [
    {
      title: "Welcome to The Studio",
      subtitle: "Your AI-Powered Creative Suite",
      content: "You've just unlocked access to the most powerful music creation tools on the planet. This is where Whip Montez's vision comes to life - and now it's yours to explore.",
      icon: "🎵",
      tip: "Everything here is AI-powered and designed for artists, by artists."
    },
    {
      title: "AI Chat Agents",
      subtitle: "Your Creative Partners",
      content: "Six specialized AI agents are ready to help you create. Ghostwriter writes lyrics, Beatsmith creates production notes, The Connect handles your business, Vision plans your visuals, Sparring Bot sharpens your bars, and The Archive knows all the lore.",
      icon: "🤖",
      tip: "Start with Ghostwriter if you need lyrics, or Beatsmith for production ideas."
    },
    {
      title: "Creative Tools",
      subtitle: "Image Lab • Video Forge • Design Deck",
      content: "Generate album art concepts, storyboard music videos, and create design briefs for social media, merch, and promotional materials. All powered by AI.",
      icon: "🎨",
      tip: "Try Image Lab with 'album cover for a Brooklyn rap artist' to see the magic."
    },
    {
      title: "Share Everywhere",
      subtitle: "One-Click Social Posting",
      content: "Every creation has share buttons. Post directly to Twitter/X (when connected), or copy and share to TikTok, Instagram, and more. Download as images or text files.",
      icon: "📱",
      tip: "Connect your Twitter in the Studio for one-click posting."
    },
    {
      title: "The Remix Button",
      subtitle: "Never Settle",
      content: "Every AI output has a 🔄 Remix button. Don't like what you got? Remix it! The AI will transform your creation with a new style while keeping the core concept.",
      icon: "🔄",
      tip: "Remix multiple times to explore different directions."
    },
    {
      title: "Record TikTok Content",
      subtitle: "Camera Integration",
      content: "Use the camera button to record yourself dancing to AI-generated jingles and remixed hits. Save videos directly to your device for TikTok, Reels, and Shorts.",
      icon: "📹",
      tip: "Record vertical (9:16) for best results on TikTok and Instagram."
    },
    {
      title: "You're Ready",
      subtitle: "Start Creating",
      content: "The Studio is yours. Explore, experiment, and create something the world has never heard. Every generation is unique. Every creation tells a story.",
      icon: "🚀",
      tip: "Pro tip: Save your best creations - they're not stored forever!"
    }
  ];

  // Onboarding Modal Component
  const OnboardingModal = () => {
    if (!showOnboarding) return null;
    const step = onboardingSteps[onboardingStep];
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 animate-fade-in">
        <div className="w-full max-w-lg bg-gradient-to-b from-[#1a1a2e] to-black border border-white/20 shadow-[0_0_60px_rgba(139,92,246,0.3)]">
          {/* Progress bar */}
          <div className="h-1 bg-white/10">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${((onboardingStep + 1) / onboardingSteps.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">{step.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-1">{step.title}</h2>
            <p className="text-purple-400 text-sm uppercase tracking-wider mb-6">{step.subtitle}</p>
            <p className="text-white/70 leading-relaxed mb-6">{step.content}</p>
            
            <div className="bg-purple-500/10 border border-purple-500/30 p-4 mb-8">
              <p className="text-purple-300 text-sm">💡 {step.tip}</p>
            </div>
            
            {/* Step indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {onboardingSteps.map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${i === onboardingStep ? 'bg-purple-500 w-6' : 'bg-white/20'}`}
                ></div>
              ))}
            </div>
            
            <div className="flex gap-4">
              {onboardingStep > 0 && (
                <button
                  onClick={() => setOnboardingStep(prev => prev - 1)}
                  className="flex-1 px-6 py-3 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
                >
                  Back
                </button>
              )}
              {onboardingStep < onboardingSteps.length - 1 ? (
                <button
                  onClick={() => setOnboardingStep(prev => prev + 1)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={completeOnboarding}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all"
                >
                  Enter The Studio 🎵
                </button>
              )}
            </div>
            
            <button
              onClick={completeOnboarding}
              className="mt-4 text-white/30 text-xs hover:text-white/60 transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  // HELP PANEL - Floating help for all features
  // ═══════════════════════════════════════════════════════════════════
  
  const helpTopics = [
    { id: 'agents', title: 'AI Agents', desc: 'Chat with specialized AI assistants for lyrics, beats, visuals, and more.' },
    { id: 'tools', title: 'Creative Tools', desc: 'Generate images, storyboards, and design templates.' },
    { id: 'remix', title: 'Remix Button', desc: 'Transform any creation with a new style. Click 🔄 on any output.' },
    { id: 'share', title: 'Sharing', desc: 'Post to Twitter, copy for TikTok/IG, or download as files.' },
    { id: 'camera', title: 'Camera', desc: 'Record videos for TikTok dances with your AI creations.' },
    { id: 'save', title: 'Saving Work', desc: 'Download creations as text or images. Connect accounts to save more.' },
    { id: 'plans', title: 'Plans & Pricing', desc: 'Free: 3 uses/agent. Creator $9.99/mo. Studio Pro $24.99/mo.' }
  ];

  const HelpPanel = () => {
    if (!showHelpPanel) return null;
    
    return (
      <div className="fixed right-4 bottom-20 z-50 w-80 bg-black/95 border border-white/20 backdrop-blur-sm shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Info size={16} className="text-cyan-400" /> Quick Help
          </h3>
          <button onClick={() => setShowHelpPanel(false)} className="text-white/40 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {helpTopics.map(topic => (
            <div key={topic.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
              <h4 className="text-white font-bold text-sm mb-1">{topic.title}</h4>
              <p className="text-white/50 text-xs">{topic.desc}</p>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <button
            onClick={() => { setShowHelpPanel(false); setShowOnboarding(true); setOnboardingStep(0); }}
            className="w-full text-center text-purple-400 text-sm hover:text-white transition-colors"
          >
            🎓 Replay Full Tutorial
          </button>
        </div>
      </div>
    );
  };

  // Quick Tips - Contextual help tooltips
  const quickTips = {
    ghostwriter: "💡 Try: 'Write a 4-bar hook about Brooklyn nights'",
    beatsmith: "💡 Try: 'Create a moody trap beat at 85 BPM'",
    connect: "💡 Try: 'Write a pitch email to a record label'",
    vision: "💡 Try: 'Concept for a gritty urban music video'",
    sparring: "💡 Try: 'Drop a punchline about making it from nothing'",
    archive: "💡 Try: 'Tell me about Whip Montez's origin story'",
    'image-lab': "💡 Try: 'Album cover for a Brooklyn female rapper, neon lights'",
    'video-forge': "💡 Try: 'Storyboard for a 60-second TikTok promo'",
    'design-deck': "💡 Try: 'Instagram post announcing new single drop'"
  };

  const QuickTip = ({ tipId }) => {
    const tip = quickTips[tipId];
    if (!tip || showQuickTip !== tipId) return null;
    
    return (
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black/95 border border-purple-500/40 text-purple-300 text-xs whitespace-nowrap shadow-lg animate-bounce">
        {tip}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-purple-500/40"></div>
      </div>
    );
  };

  // Welcome Toast for first-time visitors
  const WelcomeToast = () => {
    const [show, setShow] = useState(false);
    
    useEffect(() => {
      const hasSeenWelcome = localStorage.getItem('whip-welcome-seen');
      if (!hasSeenWelcome) {
        const timer = setTimeout(() => setShow(true), 1000);
        return () => clearTimeout(timer);
      }
    }, []);
    
    const dismiss = () => {
      setShow(false);
      localStorage.setItem('whip-welcome-seen', 'true');
    };
    
    if (!show) return null;
    
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full mx-4 animate-slide-down">
        <div className="bg-gradient-to-r from-purple-900/95 to-pink-900/95 border border-purple-500/40 backdrop-blur-sm p-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🎤</div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm mb-1">Welcome to Whip Montez Studio!</h3>
              <p className="text-white/60 text-xs leading-relaxed">
                Create lyrics, beats, visuals, and more with AI. Click <span className="text-cyan-400">Tour</span> to learn the ropes, or dive right in.
              </p>
              <div className="flex gap-3 mt-3">
                <button 
                  onClick={() => { dismiss(); setShowOnboarding(true); setOnboardingStep(0); }}
                  className="text-xs px-3 py-1 bg-purple-500 text-white hover:bg-purple-400 transition-colors"
                >
                  Take the Tour
                </button>
                <button 
                  onClick={dismiss}
                  className="text-xs px-3 py-1 text-white/40 hover:text-white transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
            <button onClick={dismiss} className="text-white/40 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  // CAMERA MODAL - Record TikTok dances
  // ═══════════════════════════════════════════════════════════════════
  
  const CameraModal = () => {
    if (!showCameraModal) return null;
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95">
        <div className="w-full max-w-md bg-black border border-white/20">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Camera size={20} className="text-rose-400" /> Record Content
            </h3>
            <button 
              onClick={() => { stopCamera(); setShowCameraModal(false); setRecordedVideo(null); }}
              className="text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4">
            {!cameraStream && !recordedVideo && (
              <div className="aspect-[9/16] bg-white/5 flex flex-col items-center justify-center border border-dashed border-white/20">
                <Camera size={48} className="text-white/20 mb-4" />
                <p className="text-white/40 text-sm mb-4">Record videos for TikTok, Reels, Shorts</p>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold uppercase tracking-wider"
                >
                  Start Camera
                </button>
              </div>
            )}
            
            {cameraStream && !recordedVideo && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full aspect-[9/16] object-cover bg-black"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors"
                    >
                      <div className="w-6 h-6 bg-white rounded-full"></div>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors animate-pulse"
                    >
                      <div className="w-6 h-6 bg-white"></div>
                    </button>
                  )}
                </div>
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-rose-500 text-white px-3 py-1 text-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    REC
                  </div>
                )}
              </div>
            )}
            
            {recordedVideo && (
              <div>
                <video
                  src={recordedVideo}
                  controls
                  className="w-full aspect-[9/16] object-cover bg-black"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => { setRecordedVideo(null); startCamera(); }}
                    className="flex-1 py-3 border border-white/20 text-white/60 hover:text-white transition-colors"
                  >
                    Re-record
                  </button>
                  <button
                    onClick={downloadRecording}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold uppercase tracking-wider"
                  >
                    Download
                  </button>
                </div>
                <p className="text-white/40 text-xs text-center mt-3">
                  Save to your device, then upload to TikTok/IG
                </p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-white/10 bg-white/5">
            <p className="text-white/50 text-xs text-center">
              💡 Tip: Record with AI-generated jingles playing. Create the hook with Ghostwriter first!
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  // EXAMPLES SHOWCASE - What you can create
  // ═══════════════════════════════════════════════════════════════════
  
  const exampleCreations = [
    { 
      type: 'Lyrics', 
      agent: 'Ghostwriter',
      example: "Brooklyn nights, concrete dreams\nRed Hook raised, nothing's what it seems\nMontez flow, yeah I make it look easy\nFrom the bottom to the top, believe me",
      prompt: "Write a 4-bar hook about Brooklyn"
    },
    {
      type: 'Beat Concept',
      agent: 'Beatsmith',
      example: "BPM: 85 | Key: C Minor | Vibe: Moody trap with soul samples\nDrums: 808s with heavy swing, crisp hi-hats\nMelody: Chopped vocal sample, minor piano chords\nStructure: 4-bar intro → 8-bar verse → 4-bar hook",
      prompt: "Create a moody trap beat concept"
    },
    {
      type: 'Video Storyboard',
      agent: 'Video Forge',
      example: "Scene 1 (0:00-0:15): Drone shot over Brooklyn at sunset\nScene 2 (0:15-0:30): Artist walks down bodega street\nScene 3 (0:30-0:45): Close-up performance in studio\nScene 4 (0:45-1:00): Montage of city life",
      prompt: "Storyboard a 60-second TikTok music video"
    },
    {
      type: 'Album Art',
      agent: 'Image Lab',
      example: "Concept: Dark urban landscape with neon accents\nForeground: Silhouette of female figure\nBackground: Brooklyn skyline at dusk\nColors: Deep purples, electric cyan, hints of rose\nTypography: Bold sans-serif, glitch effect",
      prompt: "Album cover for a Brooklyn female rapper"
    }
  ];

  const ExamplesModal = () => {
    if (!showExamples) return null;
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 overflow-y-auto">
        <div className="w-full max-w-4xl bg-gradient-to-b from-[#1a1a2e] to-black border border-white/20 my-8">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white">What You Can Create</h2>
              <p className="text-white/50 text-sm">Real examples from The Studio</p>
            </div>
            <button onClick={() => setShowExamples(false)} className="text-white/40 hover:text-white">
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {exampleCreations.map((ex, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 uppercase tracking-wider">
                    {ex.type}
                  </span>
                  <span className="text-xs text-white/30">via {ex.agent}</span>
                </div>
                <p className="text-white/40 text-xs mb-3 italic">"{ex.prompt}"</p>
                <pre className="text-white/80 text-sm whitespace-pre-wrap font-mono bg-black/50 p-4 border-l-2 border-purple-500">
                  {ex.example}
                </pre>
              </div>
            ))}
          </div>
          
          <div className="p-6 border-t border-white/10 text-center">
            <p className="text-white/50 mb-4">Ready to create your own?</p>
            <button
              onClick={() => setShowExamples(false)}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all"
            >
              Start Creating
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleBack = () => {
    setSelectedAgent(null);
    setSelectedTool(null);
    setConversationHistory([]);
    setAgentOutput("");
    setStoryboardScenes([]);
  };

  // Creative Tool Interface
  if (selectedTool) {
    return (
      <div className="h-full w-full bg-black relative flex flex-col overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-black to-black"></div>
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ boxShadow: `inset 0 0 200px ${selectedTool.glow}` }}
        ></div>
        
        {/* Header */}
        <div className="relative z-10 border-b border-white/10 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={handleBack} className="p-2 hover:bg-white/10 transition-colors rounded">
                <X size={20} className="text-white/60" />
              </button>
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${selectedTool.gradient} p-[2px]`}>
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <selectedTool.icon size={20} className={`text-${selectedTool.color}-400`} />
                </div>
              </div>
              <div>
                <h2 className="text-white font-bold tracking-wide">{selectedTool.name}</h2>
                <p className={`text-${selectedTool.color}-400/60 text-xs uppercase tracking-[0.2em]`}>{selectedTool.subtitle}</p>
              </div>
            </div>
            <div className={`px-3 py-1 bg-${selectedTool.color}-500/20 border border-${selectedTool.color}-500/30 text-${selectedTool.color}-400 text-xs uppercase tracking-wider`}>
              Beta
            </div>
          </div>
        </div>
        
        {/* Tool Content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6" style={{WebkitOverflowScrolling: 'touch'}}>
          
          {/* Image Generation Tool */}
          {selectedTool.id === 'image-lab' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Style Selector */}
              <div>
                <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Style Preset</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imageStyles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setImageSettings({...imageSettings, style: style.id})}
                      className={`p-3 border text-left transition-all ${
                        imageSettings.style === style.id 
                          ? 'border-violet-500 bg-violet-500/20' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-white text-sm font-bold">{style.name}</div>
                      <div className="text-white/40 text-xs">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Aspect Ratio */}
              <div>
                <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Aspect Ratio</h3>
                <div className="flex flex-wrap gap-3">
                  {aspectRatios.map(ratio => (
                    <button
                      key={ratio.id}
                      onClick={() => setImageSettings({...imageSettings, aspect: ratio.id})}
                      className={`px-4 py-2 border transition-all ${
                        imageSettings.aspect === ratio.id 
                          ? 'border-violet-500 bg-violet-500/20 text-white' 
                          : 'border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      <span className="font-mono">{ratio.id}</span>
                      <span className="text-xs ml-2 opacity-60">{ratio.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Prompt Input */}
              <div>
                <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Describe Your Image</h3>
                <textarea
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="A gritty Brooklyn rooftop at sunset with Whip Montez silhouetted against the skyline, neon signs reflecting in puddles..."
                  className="w-full h-32 bg-white/5 border border-white/10 text-white p-4 outline-none resize-none focus:border-violet-500/50 placeholder:text-white/30"
                />
                <button
                  onClick={handleImageGenerate}
                  disabled={isProcessing || !agentInput.trim()}
                  className={`mt-4 w-full py-4 bg-gradient-to-r ${selectedTool.gradient} text-white font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_30px_${selectedTool.glow}] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
                >
                  {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  {isProcessing ? 'Generating...' : 'Generate Image Concept'}
                </button>
              </div>
              
              {/* Output */}
              {agentOutput && (
                <div className="border border-violet-500/30 bg-violet-500/5 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-violet-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon size={16} /> Art Direction Brief
                    </h3>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleCopyToClipboard(agentOutput)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Copy">
                        📋
                      </button>
                      <button onClick={() => handleShareTikTok(agentOutput)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all" title="TikTok">
                        📱
                      </button>
                      <button onClick={() => handleShareInstagram(agentOutput)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Instagram">
                        📸
                      </button>
                      <button onClick={() => handleDownloadAsImage(agentOutput, 'Image-Lab')} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Download Image">
                        🖼️
                      </button>
                      <button 
                        onClick={() => handleRemix(agentOutput, 'Image Lab')} 
                        disabled={isProcessing}
                        className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50" 
                        title="Remix"
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                  <div className="text-white/80 whitespace-pre-line text-sm leading-relaxed">{agentOutput}</div>
                </div>
              )}
              
              {/* Generated Images Gallery */}
              {generatedImages.length > 0 && (
                <div>
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Generated Concepts</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {generatedImages.slice(0, 8).map(img => (
                      <div key={img.id} className="relative group">
                        <img 
                          src={img.thumbnail} 
                          alt={img.prompt}
                          className="w-full aspect-square object-cover border border-white/10"
                        />
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                          <p className="text-white text-[10px] text-center line-clamp-3">{img.prompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* VIDEO FORGE */}
          {selectedTool.id === 'video-forge' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Platform Selector */}
              <div>
                <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Target Platform</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {videoPlatforms.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => setVideoSettings({...videoSettings, platform: platform.id})}
                      className={`p-4 border text-center transition-all ${
                        videoSettings.platform === platform.id 
                          ? 'border-rose-500 bg-rose-500/20' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-white text-sm font-bold">{platform.name}</div>
                      <div className="text-white/40 text-xs mt-1">{platform.duration}</div>
                      <div className="text-rose-400/60 text-xs mt-1 font-mono">{platform.aspect}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Mood Selector */}
              <div>
                <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Video Mood</h3>
                <div className="flex flex-wrap gap-2">
                  {['energetic', 'moody', 'cinematic', 'raw', 'luxurious', 'nostalgic', 'aggressive'].map(mood => (
                    <button
                      key={mood}
                      onClick={() => setVideoSettings({...videoSettings, mood})}
                      className={`px-4 py-2 border capitalize transition-all ${
                        videoSettings.mood === mood 
                          ? 'border-rose-500 bg-rose-500/20 text-white' 
                          : 'border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Concept Input */}
              <div>
                <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Describe Your Video Concept</h3>
                <textarea
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="A day in the life of Whip Montez - from Brooklyn bodega in the morning to sold-out show at night..."
                  className="w-full h-32 bg-white/5 border border-white/10 text-white p-4 outline-none resize-none focus:border-rose-500/50 placeholder:text-white/30"
                />
                <button
                  onClick={handleVideoGenerate}
                  disabled={isProcessing || !agentInput.trim()}
                  className={`mt-4 w-full py-4 bg-gradient-to-r ${selectedTool.gradient} text-white font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_30px_${selectedTool.glow}] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
                >
                  {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Film size={20} />}
                  {isProcessing ? 'Generating Storyboard...' : 'Generate Storyboard'}
                </button>
              </div>
              
              {/* Storyboard Output */}
              {storyboardScenes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <Film size={16} className="text-rose-400" /> Storyboard ({storyboardScenes.length} Scenes)
                    </h3>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleCopyToClipboard(storyboardScenes.map(s => `${s.timestamp}: ${s.content}`).join('\n\n'))} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Copy All">
                        📋
                      </button>
                      <button onClick={() => handleShareTikTok(storyboardScenes.map(s => s.content).join(' | '))} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all" title="TikTok">
                        📱
                      </button>
                      <button onClick={() => handleDownloadText(storyboardScenes.map(s => `${s.timestamp}\n${s.content}`).join('\n\n---\n\n'), 'storyboard')} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Download">
                        📄
                      </button>
                      <button 
                        onClick={() => handleRemix(storyboardScenes.map(s => s.content).join('\n'), 'Video Forge')} 
                        disabled={isProcessing}
                        className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50" 
                        title="Remix Storyboard"
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {storyboardScenes.map((scene, i) => (
                      <div key={scene.id} className="flex gap-4 border border-white/10 bg-white/5 p-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-rose-500/30 to-purple-500/30 flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-lg">{i + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-rose-400 text-xs font-mono mb-1">{scene.timestamp}</div>
                          <div className="text-white/80 text-sm whitespace-pre-line">{scene.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Full Output */}
              {agentOutput && !storyboardScenes.length && (
                <div className="border border-rose-500/30 bg-rose-500/5 p-6">
                  <h3 className="text-rose-400 text-sm font-bold uppercase tracking-wider mb-3">Video Concept</h3>
                  <div className="text-white/80 whitespace-pre-line text-sm leading-relaxed">{agentOutput}</div>
                </div>
              )}
            </div>
          )}
          
          {/* DESIGN DECK */}
          {selectedTool.id === 'design-deck' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Theme / Description (Optional)</h3>
                <input
                  type="text"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="New single release, dark moody aesthetic..."
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 outline-none focus:border-teal-500/50 placeholder:text-white/30"
                />
              </div>
              
              {/* Template Categories */}
              {designCategories.map(category => (
                <div key={category.id}>
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-3">{category.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {category.templates.map(template => (
                      <button
                        key={template}
                        onClick={() => handleDesignGenerate(category.name, template)}
                        disabled={isProcessing}
                        className="p-4 border border-white/10 hover:border-teal-500/50 bg-white/5 hover:bg-teal-500/10 transition-all group disabled:opacity-50"
                      >
                        <Grid size={24} className="text-teal-400/60 group-hover:text-teal-400 mx-auto mb-2 transition-colors" />
                        <div className="text-white text-sm font-medium">{template}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Output */}
              {agentOutput && (
                <div className="border border-teal-500/30 bg-teal-500/5 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-teal-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <Grid size={16} /> Design Brief
                    </h3>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleCopyToClipboard(agentOutput)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Copy">
                        📋
                      </button>
                      <button onClick={() => handleShareInstagram(agentOutput)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Instagram">
                        📸
                      </button>
                      <button onClick={() => handleDownloadAsImage(agentOutput, 'Design-Deck')} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Download Image">
                        🖼️
                      </button>
                      <button onClick={() => handleDownloadText(agentOutput, 'design-brief')} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Download Text">
                        📄
                      </button>
                      <button 
                        onClick={() => handleRemix(agentOutput, 'Design Deck')} 
                        disabled={isProcessing}
                        className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50" 
                        title="Remix Design"
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                  <div className="text-white/80 whitespace-pre-line text-sm leading-relaxed">{agentOutput}</div>
                </div>
              )}
              
              {/* Generated Templates */}
              {designTemplates.length > 0 && (
                <div>
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Recent Briefs</h3>
                  <div className="space-y-3">
                    {designTemplates.slice(0, 5).map(t => (
                      <div key={t.id} className="border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-teal-400 text-xs uppercase tracking-wider">{t.category}</span>
                          <span className="text-white/30">•</span>
                          <span className="text-white text-sm font-bold">{t.template}</span>
                        </div>
                        <div className="text-white/60 text-xs line-clamp-2">{t.brief.slice(0, 150)}...</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Agent Selection Grid (Landing)
  if (!selectedAgent) {
    return (
      <div className="h-full w-full bg-black relative overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
        {/* Mesh Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-black to-black"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
        </div>
        
        <div className="relative z-10 p-6 md:p-10">
          {/* Twitter Connection Banner */}
          {twitterPostSuccess && (
            <div className="fixed top-4 right-4 z-50 bg-green-500/90 text-white px-4 py-3 shadow-lg animate-pulse flex items-center gap-3">
              <CheckCircle size={20} />
              <div>
                <p className="font-bold text-sm">Posted to Twitter!</p>
                <a href={twitterPostSuccess} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                  View Tweet →
                </a>
              </div>
            </div>
          )}
          
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-white/40 text-[10px] md:text-xs font-light tracking-[0.4em] uppercase mb-4 animate-pulse">
              Whip Montez Presents
            </p>
            <h1 className="text-4xl md:text-6xl font-thin text-white tracking-tighter mb-4 font-sans">
              THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">STUDIO</span>
            </h1>
            <p className="text-white/50 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              AI-powered creative suite. Chat agents, image generation, video storyboards, and design templates.
            </p>
            
            {/* Social Connection Status */}
            <div className="flex justify-center gap-3 mt-6">
              {twitterConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs">
                  <span>𝕏</span>
                  <span>@{twitterUsername}</span>
                  <button 
                    onClick={handleDisconnectTwitter}
                    className="ml-2 text-blue-400/60 hover:text-white transition-colors"
                    title="Disconnect"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectTwitter}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all text-xs"
                >
                  <span>𝕏</span>
                  <span>Connect Twitter for Direct Posting</span>
                </button>
              )}
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => setShowExamples(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 transition-all text-xs uppercase tracking-wider"
              >
                <Eye size={14} /> Examples
              </button>
              <button
                onClick={() => setShowCameraModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500/20 to-orange-500/20 border border-rose-500/30 text-rose-300 hover:text-white hover:border-rose-400 transition-all text-xs uppercase tracking-wider"
              >
                <Camera size={14} /> Record
              </button>
              <button
                onClick={() => setShowHelpPanel(!showHelpPanel)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all text-xs uppercase tracking-wider"
              >
                <HelpCircle size={14} /> Help
              </button>
              <button
                onClick={() => { setShowOnboarding(true); setOnboardingStep(0); }}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition-all text-xs uppercase tracking-wider"
              >
                <Sparkles size={14} /> Tour
              </button>
            </div>
            
            <div className="h-[1px] w-32 mx-auto mt-6 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>

          {/* CREATIVE TOOLS SECTION */}
          <div className="mb-12">
            <h2 className="text-white text-lg font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
              <div className="w-8 h-[2px] bg-gradient-to-r from-violet-500 to-rose-500"></div>
              Creative Tools
              <span className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-violet-500 to-rose-500 text-white uppercase">New</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {creativeTools.map((tool, i) => (
                <div
                  key={tool.id}
                  onClick={() => setSelectedTool(tool)}
                  className="group relative cursor-pointer"
                >
                  <div className={`relative bg-black/60 backdrop-blur-sm border border-white/10 p-6 transition-all duration-500 hover:border-${tool.color}-500/50 hover:bg-black/80 overflow-hidden`}>
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ boxShadow: `inset 0 0 60px ${tool.glow}` }}
                    ></div>
                    
                    <div className="relative flex justify-center mb-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${tool.gradient} p-[2px] group-hover:shadow-[0_0_30px_${tool.glow}] transition-all duration-500`}>
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full"></div>
                          <tool.icon size={24} className={`text-${tool.color}-400 relative z-10`} strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center relative z-10">
                      <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors duration-300 tracking-wide">{tool.name}</h3>
                      <p className={`text-${tool.color}-400/60 text-xs uppercase tracking-[0.3em] mb-2`}>{tool.subtitle}</p>
                      <p className="text-white/50 text-sm leading-relaxed mb-3">{tool.description}</p>
                      <div className="flex flex-wrap justify-center gap-1">
                        {tool.features.slice(0, 3).map((feature, j) => (
                          <span key={j} className={`text-[9px] px-2 py-0.5 bg-${tool.color}-500/10 text-${tool.color}-400/80 border border-${tool.color}-500/20 uppercase`}>
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${tool.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI AGENTS SECTION */}
          <div>
            <h2 className="text-white text-lg font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
              <div className="w-8 h-[2px] bg-gradient-to-r from-cyan-500 to-purple-500"></div>
              AI Chat Agents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {agents.map((agent, i) => (
                <div
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent)}
                  className="group relative cursor-pointer"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`relative bg-black/60 backdrop-blur-sm border border-white/10 p-6 transition-all duration-500 hover:border-${agent.color}-500/50 hover:bg-black/80 overflow-hidden`}>
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ boxShadow: `inset 0 0 60px ${agent.glow}` }}
                    ></div>
                    
                    <div className="relative flex justify-center mb-6">
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${agent.gradient} p-[2px] group-hover:shadow-[0_0_30px_${agent.glow}] transition-all duration-500`}>
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full"></div>
                          <agent.icon size={28} className={`text-${agent.color}-400 relative z-10 group-hover:scale-110 transition-transform duration-300`} strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center relative z-10">
                      <h3 className={`text-lg font-bold text-white group-hover:text-${agent.color}-400 transition-colors duration-300 tracking-wide`}>{agent.name}</h3>
                      <p className={`text-${agent.color}-400/60 text-xs uppercase tracking-[0.3em] mb-3`}>{agent.subtitle}</p>
                      <p className="text-white/50 text-sm leading-relaxed mb-4">{agent.description}</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {agent.features.map((feature, j) => (
                          <span key={j} className={`text-[10px] px-2 py-1 bg-${agent.color}-500/10 text-${agent.color}-400/80 border border-${agent.color}-500/20 uppercase tracking-wider`}>
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${agent.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center mt-12 text-white/20 text-xs tracking-widest uppercase">
            Studio v3.0 // Powered by Gemini AI // Image • Video • Design
          </div>
        </div>
        
        {/* Modals */}
        <OnboardingModal />
        <HelpPanel />
        <CameraModal />
        <ExamplesModal />
        <WelcomeToast />
        
        {/* Floating Help Button */}
        <button
          onClick={() => setShowHelpPanel(!showHelpPanel)}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all"
          title="Need help?"
        >
          <HelpCircle size={20} className="text-white" />
        </button>
      </div>
    );
  }

  // Agent Chat Interface (existing)
  return (
    <div 
      className="h-full w-full bg-black relative flex flex-col overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-black to-black"></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ boxShadow: `inset 0 0 200px ${selectedAgent.glow}` }}></div>
      
      {/* Swipe Indicator */}
      <div className="absolute top-1/2 left-2 z-20 md:hidden opacity-30">
        {agents.findIndex(a => a.id === selectedAgent.id) > 0 && (
          <div className="text-white/40 text-xs">◀</div>
        )}
      </div>
      <div className="absolute top-1/2 right-2 z-20 md:hidden opacity-30">
        {agents.findIndex(a => a.id === selectedAgent.id) < agents.length - 1 && (
          <div className="text-white/40 text-xs">▶</div>
        )}
      </div>
      
      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-white/10 transition-colors rounded">
              <X size={20} className="text-white/60" />
            </button>
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${selectedAgent.gradient} p-[2px]`}>
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <selectedAgent.icon size={20} className={`text-${selectedAgent.color}-400`} />
              </div>
            </div>
            <div>
              <h2 className="text-white font-bold tracking-wide">{selectedAgent.name}</h2>
              <p className={`text-${selectedAgent.color}-400/60 text-xs uppercase tracking-[0.2em]`}>{selectedAgent.subtitle}</p>
            </div>
          </div>
          <div className={`px-3 py-1 bg-${selectedAgent.color}-500/20 border border-${selectedAgent.color}-500/30 text-${selectedAgent.color}-400 text-xs uppercase tracking-wider`}>
            Online
          </div>
        </div>
      </div>
      
      {/* Conversation */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4" style={{WebkitOverflowScrolling: 'touch'}}>
        {conversationHistory.length === 0 && !isProcessing && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${selectedAgent.gradient} p-[2px] mb-6`}>
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full"></div>
                <selectedAgent.icon size={36} className={`text-${selectedAgent.color}-400`} />
              </div>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">{selectedAgent.name}</h3>
            <p className="text-white/50 max-w-md mb-6">{selectedAgent.description}</p>
            <p className={`text-${selectedAgent.color}-400/50 text-sm animate-pulse`}>Type a message to begin...</p>
          </div>
        )}
        
        {conversationHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'bg-white/10 border border-white/20' : `bg-${selectedAgent.color}-500/10 border border-${selectedAgent.color}-500/30`}`}>
              <div className="p-4">
                <p className={`text-sm whitespace-pre-line ${msg.role === 'user' ? 'text-white' : `text-${selectedAgent.color}-100`}`}>{msg.content}</p>
              </div>
              {/* Share buttons for AI responses */}
              {msg.role === 'assistant' && (
                <>
                <div className="flex items-center gap-1 px-4 pb-3 pt-1 border-t border-white/5 flex-wrap">
                  <button
                    onClick={() => setShareMenuOpen(shareMenuOpen === i ? null : i)}
                    className={`flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider transition-all ${shareMenuOpen === i ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                  >
                    <Share2 size={12} /> Share
                  </button>
                  <button
                    onClick={() => handleCopyToClipboard(msg.content)}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    {copySuccess ? <CheckCircle size={12} className="text-green-400" /> : <span>📋</span>} Copy
                  </button>
                  <button
                    onClick={() => handleDownloadAsImage(msg.content, selectedAgent.name)}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    🖼️ <span className="hidden md:inline">Image</span>
                  </button>
                  <button
                    onClick={() => handleRemix(msg.content, selectedAgent.name)}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50"
                    title="Remix this creation"
                  >
                    🔄 Remix
                  </button>
                  
                  {/* Voice Output Controls */}
                  <div className="relative">
                    <button
                      onClick={() => isSpeaking ? stopSpeaking() : setShowVoiceStyleMenu(showVoiceStyleMenu === i ? null : i)}
                      className={`flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider transition-all ${
                        isSpeaking ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20'
                      }`}
                      title={isSpeaking ? 'Stop speaking' : 'Hear it spoken'}
                    >
                      {isSpeaking ? '⏹️ Stop' : '🔊 Speak'}
                    </button>
                    
                    {/* Voice Style Dropdown */}
                    {showVoiceStyleMenu === i && !isSpeaking && (
                      <div className="absolute bottom-full left-0 mb-1 w-48 bg-black/95 border border-cyan-500/30 backdrop-blur-sm z-50 shadow-xl">
                        <div className="p-2 border-b border-white/10">
                          <p className="text-white/50 text-[9px] uppercase tracking-wider">Choose Voice Style</p>
                        </div>
                        {Object.entries(voiceStyles).map(([key, style]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedVoiceStyle(key);
                              speakText(msg.content, key);
                              setShowVoiceStyleMenu(null);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-cyan-500/20 transition-colors flex items-center gap-2"
                          >
                            <span className="text-lg">{style.icon}</span>
                            <div>
                              <p className="text-white text-xs font-bold">{style.name}</p>
                              <p className="text-white/40 text-[9px]">{style.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Record Your Own Flow */}
                  <button
                    onClick={() => isRecordingFlow ? stopRecordingFlow() : startRecordingFlow()}
                    className={`flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider transition-all ${
                      isRecordingFlow ? 'bg-red-500 text-white animate-pulse' : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/20'
                    }`}
                    title={isRecordingFlow ? 'Stop recording' : 'Record your own flow'}
                  >
                    {isRecordingFlow ? '⏹️ Stop' : '🎤 Spit'}
                  </button>
                  
                  <ShareMenu 
                    content={msg.content} 
                    agentName={selectedAgent.name}
                    isOpen={shareMenuOpen === i}
                    onClose={() => setShareMenuOpen(null)}
                    messageIndex={i}
                  />
                </div>
                
                {/* User Recording Playback */}
                {userRecording && (
                  <div className="flex items-center gap-2 px-4 pb-3 border-t border-white/5 pt-2">
                    <span className="text-green-400 text-[9px] uppercase">Your Recording:</span>
                    <audio src={userRecording} controls className="h-6 flex-1" style={{ maxWidth: '200px' }} />
                    <button
                      onClick={downloadUserRecording}
                      className="text-[9px] px-2 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      ⬇️ Save
                    </button>
                    <button
                      onClick={() => setUserRecording(null)}
                      className="text-white/30 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </>
              )}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className={`bg-${selectedAgent.color}-500/10 border border-${selectedAgent.color}-500/30 p-4`}>
              <div className="flex items-center gap-2">
                <Loader2 size={16} className={`text-${selectedAgent.color}-400 animate-spin`} />
                <span className={`text-${selectedAgent.color}-400 text-sm animate-pulse`}>Processing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-sm p-4">
        <div className="flex gap-2 md:gap-3">
          {/* Voice Input Button */}
          {voiceSupported && (
            <button
              onClick={toggleVoiceInput}
              disabled={isProcessing}
              className={`px-3 py-3 border transition-all flex items-center justify-center ${
                isListening 
                  ? 'bg-red-500 border-red-500 text-white animate-pulse' 
                  : 'bg-white/5 border-white/20 text-white/60 hover:text-white hover:border-white/40'
              } disabled:opacity-50`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
              ) : (
                <Mic size={20} />
              )}
            </button>
          )}
          
          <input
            type="text"
            value={agentInput}
            onChange={(e) => setAgentInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAgentSubmit()}
            placeholder={isListening ? '🎤 Listening...' : selectedAgent.placeholder}
            disabled={isProcessing}
            className={`flex-1 bg-white/5 border ${isListening ? 'border-red-500/50' : 'border-white/10'} focus:border-${selectedAgent.color}-500/50 text-white px-4 py-3 outline-none transition-colors placeholder:text-white/30 disabled:opacity-50`}
          />
          <button
            onClick={() => { playSound('send'); handleAgentSubmit(); }}
            disabled={isProcessing || !agentInput.trim()}
            className={`px-4 md:px-6 py-3 bg-gradient-to-r ${selectedAgent.gradient} text-white font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_20px_${selectedAgent.glow}] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
            <span className="hidden md:inline">Send</span>
          </button>
        </div>
        
        {/* Voice Input Hint */}
        {isListening && (
          <div className="mt-2 text-center text-red-400 text-xs animate-pulse">
            🎤 Speak now... tap again to stop
          </div>
        )}
      </div>
    </div>
  );
};

// THE COME UP - A Deep Mentorship & Growth Platform for Artists
const TheComeUp = ({ setSection }) => {
  const [activeTab, setActiveTab] = useState('pillars');
  const [currentQuote, setCurrentQuote] = useState(0);
  const [userStory, setUserStory] = useState('');
  const [submittedStories, setSubmittedStories] = useState([]);
  const [expandedLesson, setExpandedLesson] = useState(null);

  // The Four Pillars of The Come Up - Deep mentorship framework
  const pillars = [
    {
      id: 'craft',
      title: "MASTER YOUR CRAFT",
      subtitle: "The 10,000 Hour Truth",
      color: "from-cyan-500 to-blue-600",
      borderColor: "border-cyan-500",
      description: "Before the deal, before the fame, before anyone knows your name—there are thousands of hours in the dark. This is where legends are forged.",
      deepDive: `The music industry sells a seductive myth: overnight success. Social media amplifies it—a clip goes viral, a song blows up, suddenly someone's famous. But behind every "overnight" success is a story nobody told you. The years of practice. The rejected demos. The gigs nobody attended. This is the hidden curriculum of greatness, and understanding it will change how you approach your own come up.

**The Hidden Years: What They Don't Show You**

Jay-Z was turned down by every major label in the industry before starting Roc-A-Fella Records in 1995 with Damon Dash and Kareem "Biggs" Burke. He was 26 years old—ancient by today's industry standards—and had been rapping since he was 9. That's 17 years of development before "Reasonable Doubt." According to a 2010 interview with Vanity Fair, he had notebooks filled with verses from his teenage years that never saw the light of day.

Kendrick Lamar released his first mixtape in 2003 at age 16. Section.80 didn't drop until 2011. That's eight years of grinding in Compton, developing his storytelling ability and technical precision. In an interview with Complex, Kendrick's longtime collaborator Dave Free said Kendrick would rewrite verses 20 or 30 times until they were perfect—not good, perfect.

J. Cole approached Jay-Z outside a recording studio in 2007 and handed him a demo. Jay didn't even listen to it. Cole tried again. And again. He slept on a bus in New York City, crashed on couches, and kept creating. It took three years before he finally got signed to Roc Nation. His first major label debut, Cole World, didn't come until 2011—four years after that first rejection.

Source: Complex Magazine, Vanity Fair, The Breakfast Club interviews

**The 10,000 Hour Rule: What It Actually Means**

Malcolm Gladwell popularized the 10,000-hour rule in his book "Outliers," citing research by psychologist Anders Ericsson. But there's a crucial detail people miss: it's not just any practice. It's deliberate practice—focused, uncomfortable, intentional improvement.

Here's what 10,000 hours looks like for a rapper:

- 3 hours daily for 10 years = 10,950 hours
- 5 hours daily for 6 years = 10,950 hours
- 8 hours daily for 3.5 years = 10,220 hours

Most artists never hit 1,000 hours. They write when inspired (which means rarely). They record when convenient (which means inconsistently). They study their influences casually (which means superficially). This is why most never break through.

*Deliberate Practice for Rappers Looks Like:*

Writing exercises: Take a random topic and write 16 bars in 15 minutes. Do this daily. The goal isn't quality—it's building the muscle. Your brain needs to learn to generate ideas under pressure. According to research published in the Journal of Expertise, this type of constrained creative practice develops neural pathways that make creativity more accessible.

Flow studies: Pick an artist known for technical skill—Eminem, Kendrick, J.I.D, Doja Cat—and dissect one verse. Count syllables per bar. Map the rhyme scheme. Identify internal rhymes, multisyllables, and flow switches. Then try to recreate the pattern with your own words. This is how you internalize techniques your ear recognizes but your brain hasn't decoded.

Recording practice: Record something every week, even if it never leaves your hard drive. Hearing yourself back is the fastest feedback loop. Your cringes are data. The parts that make you uncomfortable are exactly where you need to grow.

**The Bedroom Studio Revolution**

We are living in the most democratized era of music creation in human history. In 1990, a professional recording studio setup cost $100,000+. Today, you can produce professional-quality music with a $500 laptop and free software. FL Studio, Logic Pro, Ableton, GarageBand—these tools didn't exist a generation ago.

According to Statista, over 60,000 songs are uploaded to Spotify daily. This is both opportunity and challenge. The barrier to creation is gone. The barrier to attention is higher than ever.

What separates the artists who break through? Consistent output over time. Building a body of work that shows development. Treating their bedroom studio like a training facility, not a hobby room.

**When to Take Your Craft to the Next Level**

Ask yourself these questions:

- Have you written 100+ complete songs? If not, you're still in the fundamentals phase.
- Can you write a verse in under 30 minutes when you have to? If not, your creative pipeline needs development.
- Do people outside your immediate circle share your music without you asking? If not, the product isn't ready for serious investment.
- When you listen to your music from a year ago, do you hear clear improvement? If not, your practice isn't deliberate enough.

**Next Steps: Your 90-Day Craft Development Plan**

Week 1-4: Foundation
- Write every single day, minimum 30 minutes
- Complete at least 4 full songs (verse-hook-verse-hook-bridge format)
- Study one classic album per week (break down production, lyrics, sequencing)

Week 5-8: Expansion
- Collaborate with at least 2 artists outside your usual circle
- Experiment with a flow or style you've never tried
- Record in a different environment (even just a friend's place)

Week 9-12: Refinement
- Focus on your 3 strongest songs and re-record with intention
- Get feedback from someone whose opinion you respect AND fear
- Perform live or do a live stream—performing reveals weaknesses recording hides

**The Uncomfortable Truth**

Your first 100 songs are practice. This isn't pessimism—it's liberation. When you accept that you're in the developmental phase, every session becomes about learning, not proving. You stop trying to create your magnum opus every time you sit down, and you start accumulating the skills that will make your magnum opus possible.

The craft doesn't care about your potential. It doesn't care about your dreams or your vision or how badly you want it. The craft only responds to one thing: the work you actually put in.

There are no shortcuts. But there is a path. And it's walked one bar at a time.`,
      mentorTip: "Your first 100 songs will be practice. Make peace with that.",
      studioLink: "ghostwriter",
      studioText: "Train your writing in the Ghost Studio"
    },
    {
      id: 'business',
      title: "OWN YOUR BUSINESS",
      subtitle: "The Money & Masters Reality",
      color: "from-amber-500 to-orange-600",
      borderColor: "border-amber-500",
      description: "The music industry has broken more artists than drugs ever did. Understanding the business isn't optional—it's survival.",
      deepDive: `The music industry is one of the most exploitative businesses in existence. This isn't cynicism—it's documented history. From the Motown artists who died broke to the modern streaming era where a million plays pays less than minimum wage, the system is designed to extract value from creators. Your job isn't to hope it treats you fairly. Your job is to understand the game so well that you can't be taken advantage of.

**The Masters Conversation: Why Ownership Is Everything**

Your masters are the original recordings of your music. Whoever owns them controls how your art is used, licensed, and monetized—potentially forever. When Prince changed his name to an unpronounceable symbol in 1993, it wasn't a publicity stunt. It was a protest against Warner Bros.' ownership of his masters. He literally wrote "SLAVE" on his face during performances.

Taylor Swift re-recording her entire catalog starting in 2021 wasn't petty—it was a $300 million business decision to reclaim her legacy from Scooter Braun's acquisition of Big Machine Records. According to Billboard, her re-recorded "Taylor's Version" albums have outperformed the originals in streaming and sales.

Here's what happens when you don't own your masters:
- The label can license your song to a political campaign you disagree with
- The label can sell your catalog to a private equity firm (this is happening constantly now)
- The label keeps 85%+ of streaming revenue, forever
- You can't control how your music is used in films, commercials, or samples
- Your heirs inherit nothing but the right to 15% of royalties (if that)

Source: Recording Industry Association of America, Billboard, Prince's 1996 interview with Larry King

**The 360 Deal Trap: Understanding Modern Contracts**

In the old model, labels made money from record sales and artists kept touring, merch, and other revenue streams. The 360 deal—now standard—changes everything. Labels take a percentage of:

- Recording royalties (traditional)
- Publishing (your songwriting income)
- Touring (live performance revenue)
- Merchandise
- Sponsorships and endorsements
- Acting or other entertainment income

According to a 2021 analysis by the Music Industry Research Association, the average 360 deal gives labels 25-35% of touring revenue and 20-30% of merchandise sales. On top of the 85% they already take from recordings.

*Why Artists Sign These Deals*

Desperation. The advance—typically $50,000 to $500,000 for new artists—feels life-changing when you're broke. But it's not a gift. It's a loan against future royalties, paid back at your unfavorable royalty rate. Do the math:

Say you get a $100,000 advance with a 15% royalty rate. You need to generate $666,666 in revenue before you see another dollar. At $0.003 per stream (Spotify's average payout), that's 222 million streams just to break even on the advance. Most artists never recoup.

Source: Spotify artist payout data, Music Business Worldwide

**What You Should Own: Non-Negotiables**

Before you sign anything, understand these terms:

Publishing Rights: Publishing is your songwriting income—separate from your recording income. ASCAP, BMI, and SESAC collect performance royalties when your song plays on radio, TV, or in public venues. Publishing deals typically split revenue 50/50 (writer's share vs. publisher's share). Never give up 100% of your publishing. Aim for 75/25 or 70/30 in your favor at minimum.

Master Reversion: If you must sign a deal that includes masters, negotiate a reversion clause. This means ownership returns to you after a set period (typically 5-10 years) or after the label recoups their costs. Many artists don't know this is even possible.

Creative Control: Approval rights over album art, single selection, release dates, and marketing. Without these, the label can drop a project you hate.

Accounting Rights: The right to audit the label's books. Industry studies suggest 30-40% of artists are underpaid due to "accounting errors." Without audit rights, you'll never know.

**Building Your Business Infrastructure Now**

Don't wait until you're "famous" to set up the basics:

Form an LLC: This separates your personal assets from your business. If you get sued, they can't take your house. It also makes taxes simpler and looks professional to industry partners. Cost: $50-500 depending on your state.

Get an EIN: An Employer Identification Number from the IRS. It's free and takes 5 minutes. You'll need this for business bank accounts and professional contracts.

Register with a PRO: Join ASCAP, BMI, or SESAC (you can only join one). This ensures you get paid when your music is publicly performed. It's free to join. Millions of dollars in royalties go unclaimed every year because artists didn't register.

Set up a publishing administrator: Companies like Songtrust, TuneCore Publishing, or CD Baby Pro collect publishing royalties you'd otherwise miss—from international sources, YouTube, TikTok, etc. They take 10-15% but find money you'd never see otherwise.

**When to Take a Deal (And When to Walk)**

Take a deal when:
- You've proven you can build an audience independently
- The label offers something you can't do yourself (radio promotion, sync licensing connections, international distribution)
- The terms are reasonable (50/50 publishing minimum, master reversion clause, creative control)
- You have a lawyer who has reviewed everything

Walk away when:
- They pressure you to sign quickly ("this offer expires Friday")
- They won't negotiate any terms
- The advance is small but the commitment is long (multiple albums)
- Your gut says something's wrong

**The DIY Path: Building Without a Label**

According to a 2023 report by MIDiA Research, independent artists now capture 35% of global streaming market share—up from 27% in 2018. Artists like Chance the Rapper, Macklemore, and Nipsey Hussle proved that independence isn't just possible—it can be more profitable.

The formula:
- Release music consistently (every 6-8 weeks for singles, annually for projects)
- Build direct fan relationships (email list, Discord, Patreon)
- Control your distribution (DistroKid, TuneCore, AWAL)
- Reinvest revenue into marketing and production
- Build slowly, own everything

**Next Steps: Your 30-Day Business Foundation**

Week 1:
- Form an LLC in your state (LegalZoom, Incfile, or your state's website)
- Get an EIN from IRS.gov
- Open a business bank account (separate from personal)

Week 2:
- Register with ASCAP or BMI
- Sign up for a publishing administrator (Songtrust recommended for beginners)
- Create a simple spreadsheet to track all music income and expenses

Week 3:
- Research entertainment lawyers in your city (you don't need to hire one yet—just know who's out there)
- Read at least one music business book: "All You Need to Know About the Music Business" by Donald Passman is the industry bible

Week 4:
- Audit your current music: Are all your songs registered? Are you collecting all possible royalties?
- Set up Google Alerts for your artist name to monitor usage

The artists who survive this industry aren't the most talented. They're the most informed.`,
      mentorTip: "Never sign anything without a lawyer. A $500 consultation can save you $500,000.",
      studioLink: "ar_suite",
      studioText: "Analyze your music's market potential"
    },
    {
      id: 'mental',
      title: "PROTECT YOUR MIND",
      subtitle: "The Silent Battle",
      color: "from-emerald-500 to-teal-600",
      borderColor: "border-emerald-500",
      description: "The industry has a body count. Not just the ones we lost—but the ones who lost themselves. Mental health isn't soft. It's survival.",
      deepDive: `We turn artists into martyrs after they die. We share their lyrics about depression, point out the "signs we missed," and promise to do better. Then we forget until the next headline. The music industry has a mental health crisis that's not being addressed with the urgency it deserves. Understanding this reality—and building systems to protect yourself—isn't optional. It's how you survive long enough to make the art that matters.

**The Ones We Lost: A Incomplete List**

Mac Miller died in 2018 from an accidental overdose. He was 26. In the years before his death, he was openly discussing his struggles with depression and substance abuse in interviews and music. The industry kept booking him.

Juice WRLD died in 2019 from an accidental drug overdose. He was 21. His entire artistic identity was built around emotional vulnerability and pain. He told interviewers he made music to help others feel less alone. He was making hundreds of millions for his label while struggling to find peace.

Pop Smoke was murdered in 2020. He was 20. Nipsey Hussle was murdered in 2019. He was 33. XXXTentacion was murdered in 2018. He was 20. The violence isn't separate from the mental health conversation—it's connected to an industry that often exploits trauma and neighborhood affiliations for marketability.

Lil Peep died in 2017 from an accidental overdose. He was 21. Aviici died by suicide in 2018. He was 28. Chester Bennington of Linkin Park died by suicide in 2017. He was 41. These aren't isolated incidents. They're symptoms of a systemic failure.

Source: Rolling Stone, Complex, Billboard obituaries and investigations

**Why Artists Are Uniquely Vulnerable**

According to a 2019 study published in the British Journal of Psychiatry, musicians are three times more likely to experience depression than the general population. A 2021 survey by the Music Industry Research Association found that 73% of independent musicians have experienced symptoms of mental illness.

The reasons are structural:

Financial Instability: Unlike most professions, music income is wildly unpredictable. You might make $10,000 one month and $500 the next. This chronic financial stress creates constant anxiety. According to a 2022 survey by the Future of Music Coalition, the median income for working musicians in the US is around $35,000—and that includes touring and teaching income, not just recording.

Emotional Labor: The job literally requires vulnerability. The music that connects is honest. But constantly mining your trauma, relationships, and struggles for content takes a psychological toll. There's no emotional off switch.

Parasocial Relationships: Millions of people feel like they know you from your music. They project their own feelings onto you. They feel entitled to access. Social media amplifies this to an unhealthy degree. Setting boundaries feels like "letting fans down."

Identity Fusion: When your art is your identity, career struggles feel like personal failures. Writer's block becomes an existential crisis. A bad review feels like rejection of your entire being. This is psychologically dangerous.

Normalization of Substance Use: From lean culture in hip-hop to cocaine in rock to alcohol everywhere, substances are woven into music industry social fabric. Using becomes normalized, even expected. "It helps me create" becomes "I can't create without it."

**The Warning Signs You Need to Know**

In yourself:
- Creating feels like an obligation rather than an expression
- You're using substances to perform, record, or deal with industry stress
- Isolation that feels protective but is actually avoidance
- Physical symptoms: insomnia, appetite changes, chronic fatigue, headaches
- Irritability that's disproportionate to triggers
- Thoughts of self-harm or hopelessness
- Feeling like your real self and your artist persona are completely separate people

In others:
- Withdrawal from usual activities and relationships
- Dramatic changes in behavior or personality
- Giving away possessions or "putting affairs in order"
- Increased substance use
- Talking about being a burden or not belonging
- Expressions of hopelessness about the future

**Building Your Support System**

Your mental health is not a solo mission. The artists who thrive long-term have intentional support structures:

A Therapist Who Gets It: Look specifically for therapists experienced with creative industries or high-profile clients. Organizations like MusiCares (run by the Recording Academy) offer free mental health services for music professionals. The Jed Foundation partners with labels and venues to provide resources. Backline.care was founded specifically for music industry mental health.

Friends Outside the Industry: People who knew you before music and will know you if music goes away. These relationships provide perspective that's impossible to get from people whose livelihoods are connected to yours.

Physical Activity: The mind-body connection isn't woo-woo—it's neuroscience. Exercise releases endorphins, reduces cortisol, and provides a sense of accomplishment independent from music. According to research from Harvard Medical School, regular exercise is as effective as medication for mild to moderate depression.

A Creative Outlet That Isn't Monetized: Paint. Write in a journal. Play an instrument you never perform with. Cook. Do something creative that has no commercial pressure. Remember what creating felt like before it became your job.

Boundaries, Enforced: Social media hours. Times you're "off." People who are and aren't allowed to contact you about business. These feel impossible when you're hungry for success, but they're what allow sustainable careers.

**Practical Mental Health Protocol**

Daily:
- Some form of physical movement (walk, gym, dance, anything)
- 10+ minutes without screens
- One genuine human interaction (text doesn't count)

Weekly:
- At least one full day away from music work
- Check-in with someone you trust about how you're really doing
- Review your substance use honestly (if applicable)

Monthly:
- Therapy session (non-negotiable, not "when I can afford it"—there are free resources)
- Evaluate: Is music currently giving or taking energy?
- Review boundaries: What's working? What's slipping?

Quarterly:
- Career check-in: Are you growing, or just busy?
- Relationship audit: Who actually supports you? Who drains you?
- Physical health checkup

**Crisis Resources (Save These)**

- 988 Suicide & Crisis Lifeline (call or text 988 in the US)
- Crisis Text Line (text HOME to 741741)
- SAMHSA National Helpline: 1-800-662-4357
- MusiCares Health & Human Services: 1-800-687-4227
- Backline.care: Free mental health resources for music industry
- The Jed Foundation: jedfoundation.org

**The Permission You Need to Hear**

Asking for help isn't weakness. It's not a sign that you're not "built for this." The strongest people you admire have support systems—they're just not posting about it.

Taking breaks doesn't mean you're giving up. It means you're investing in longevity.

Saying no to opportunities that harm you isn't soft. It's smart.

Your value as a human being is not determined by your output, your streams, your followers, or your chart positions. You existed before music and you matter outside of it.

The goal isn't to be unbreakable. Unbreakable things shatter. The goal is to be flexible—to bend without snapping, to struggle without being destroyed, to build a life where your art enhances your existence instead of consuming it.

You can't make great art if you're not alive to make it.`,
      mentorTip: "Check in on your people. The ones who seem the strongest often struggle the most.",
      studioLink: null,
      studioText: null
    },
    {
      id: 'legacy',
      title: "BUILD YOUR LEGACY",
      subtitle: "Beyond The Charts",
      color: "from-violet-500 to-purple-600",
      borderColor: "border-violet-500",
      description: "Hits fade. Trends die. What remains is the impact you had on people's lives and the path you paved for those behind you.",
      deepDive: `Tupac Shakur sold over 75 million records worldwide. But when researchers and activists reference him today, they're not talking about sales. They're citing his analysis of systemic inequality, his articulation of pain that millions felt but couldn't express. His legacy isn't platinum plaques—it's the ongoing conversation he started.

Nipsey Hussle won one Grammy. He had zero Billboard #1 singles during his lifetime. But his legacy is transformative: Marathon Clothing, a smart store in the heart of Crenshaw. Vector 90, a coworking space and STEM center for underserved youth. A generation of artists who learned from watching him that ownership matters more than exposure. He turned his neighborhood into an economic incubator. That's legacy.

Your legacy isn't what you achieve. It's what you leave behind. And you can start building it right now, regardless of where you are in your career.

**The Three Levels of Legacy**

*Level 1: The Art*

The music itself. Albums that outlive you. Songs that become anthems for moments you'll never witness. This is the foundation, but alone, it's fragile. Music gets forgotten faster than we want to admit. According to research by Luminate (formerly Nielsen Music), the average song's peak streaming period is 3-6 weeks. Then it declines. The vast majority of recorded music in history is effectively lost—unstreamed, unplayed, forgotten.

What makes art endure? Connection to something larger than the moment. Bob Marley's music survived because it addressed universal themes of justice, love, and resistance. 2Pac's music survived because it articulated a specific experience with universal resonance. Lauryn Hill's "Miseducation" survived because it spoke to truths that transcend 1998.

To build Level 1 legacy: Create art that isn't just about your current mood or the current trend. Address themes that will matter in 20 years. Document your specific experience so thoroughly that it becomes universal.

*Level 2: The Community*

Who did you bring up with you? What doors did you open for others? The artists who mentor the next generation create geometric impact. Every person you help goes on to help others. Your influence multiplies beyond your direct reach.

J. Cole's Dreamville isn't just a label—it's a community development project. He signs artists, but more importantly, he creates infrastructure that allows independent creators to learn from his success. The Dreamville Festival in North Carolina brings economic activity to a region often overlooked by major events.

According to a 2022 study by the University of Southern California, artists who actively mentor others are more likely to have longer, more sustainable careers. The community you build becomes a support system that sustains you too.

To build Level 2 legacy: Find one artist behind you on the path and offer what you have. It doesn't have to be money. Knowledge, connections, encouragement—these compound over time. As you grow, formalize it: bring artists on tour, share studio time, make introductions.

*Level 3: The Institution*

The businesses, foundations, and structures you build. These outlive your participation in them. They create value when you're not there.

Dr. Dre's Beats headphones sold to Apple for $3 billion in 2014. But the less-discussed legacy is Aftermath Entertainment—a label that launched Eminem, 50 Cent, and Kendrick Lamar. The institution continued producing culture-shifting artists long after Dre stepped back from his own recording career.

Russell Simmons' personal failures are well-documented, but Def Jam Records—which he co-founded in a dorm room in 1984—is still operating today. It launched Run-DMC, LL Cool J, Beastie Boys, Jay-Z, Kanye West, and hundreds of others. The institution outlived his participation in it.

Sean "Diddy" Combs built Revolt TV, a media platform that continues to operate independently from his personal brand. Bad Boy Records fundamentally changed the conversation about artist ownership in the 90s. Institutions can be separated from their founders.

To build Level 3 legacy: Start thinking beyond projects. What would a business look like? What problem in your community could you solve? What infrastructure is missing for artists like you? You don't need to build it now—but you should be designing it.

**The Whip Montez Philosophy: Where You're From Meets Where You're Going**

Red Hook, Brooklyn isn't a neighborhood with many platinum rappers. It's not Manhattan. It's not even the Brooklyn that gets gentrified in think pieces. But that's exactly why it matters.

Where you come from doesn't limit where you can go. But it should never be forgotten. The specific details of your experience—the streets, the sounds, the people—are what make your art authentic. The biggest mistake artists make is trying to sound like they're from everywhere, and ending up sounding like they're from nowhere.

But legacy requires more than remembrance. It requires building something. Nipsey didn't just rap about Crenshaw—he invested in it. He created jobs there. He made it possible for kids there to see a different path. That's the integration of past and present, place and aspiration.

**Practical Legacy Building: Starting Now**

Document Your Journey: Your struggle is someone else's roadmap. The process, the mistakes, the lessons—these are valuable. Keep a journal. Make process videos. Be honest about what's hard. Future artists will find this and be encouraged.

Own Something in Your Community: This doesn't require wealth. Start a newsletter for local artists. Host a monthly cipher. Create a Discord for independent musicians from your city. When you have more resources, think about physical presence—a studio, a venue, a store.

Create Opportunities, Not Just Art: Book a show and put other artists on the bill. Create a compilation and feature unknowns. Share your contacts with artists who need them. Every door you open for others expands your legacy beyond your individual output.

Be Honest About Your Failures: Success stories inspire, but failure stories teach. Talk about the deals that fell through. The relationships that ended. The times you wanted to quit. Vulnerability builds trust, and trust is the foundation of legacy.

Think in Decades, Not Months: What do you want your career to look like in 10 years? 20 years? 30 years? Most artists only plan for the next project. Legacy-builders plan generations ahead.

**The Long Game: Fame vs. Impact**

Fame is fragile. You can be famous and miserable. You can be famous and broke. You can be famous and forgotten within a decade.

Relevance is temporary. Sounds go out of style. Trends move on. The artists who chase relevance are on an exhausting treadmill, constantly reinventing to stay current.

But impact? Impact is permanent. It's the kid who heard your song and decided not to give up. It's the business owner who opened their store because you showed it was possible. It's the conversation that's still happening 20 years from now because you started it.

The question isn't "Will I be remembered?" You might not be. Most people aren't. The question is: "What will I have contributed?" And that question can be answered positively regardless of commercial success.

**Next Steps: Building Your Legacy Framework**

This Week:
- Write down your vision: What do you want to be remembered for?
- Identify one person earlier in their journey you could help
- Start documenting your process (voice memos, notes, anything)

This Month:
- Research legacy-building artists in your genre: How did they do it?
- Create something of value for your community (doesn't have to be music)
- Have a conversation about long-term vision with someone you trust

This Year:
- Formalize your mentorship: Regular check-ins with at least one developing artist
- Start planning an institutional project (even if it's years away from execution)
- Review: Is your current path leading to the legacy you envisioned?

**The Final Word**

You're not just building a career. You're writing a story that will be told long after you're gone. Every decision, every relationship, every project contributes to that story.

The artists we remember—the ones with true legacy—all have something in common: they thought beyond themselves. They built more than music. They left something behind.

The time to start is now. Not when you're famous. Not when you're rich. Not when you "make it." Now.

What will you build?`,
      mentorTip: "The best time to think about legacy is before you need one.",
      studioLink: "studio",
      studioText: "Start building in The Studio"
    }
  ];

  // Wisdom from the journey - rotating quotes
  const wisdomQuotes = [
    { text: "I sold CDs out my trunk. Nobody believed. Now they all 'believers.'", source: "The Underground Years" },
    { text: "They said the industry was closed. So I built my own door.", source: "The Independent Path" },
    { text: "Every 'no' is just 'not yet.' Keep knocking until they can't ignore you.", source: "The Persistence Files" },
    { text: "The studio was my church. Late nights were my prayers. The mic was my confession.", source: "The Sacred Sessions" },
    { text: "Broke don't mean broken. It means you haven't arrived yet.", source: "The Vision Board" },
    { text: "They'll doubt you until they can't ignore you. Then they'll claim they always knew.", source: "The Revisionist History" },
    { text: "Your story is your superpower. The pain makes the art hit different.", source: "The Authenticity Advantage" },
    { text: "The come up ain't pretty, but it's beautiful. Every scar is a lesson.", source: "The Transformation" },
    { text: "Past struggles become future lessons. Keep going—your future self is watching.", source: "The Whip Montez Sessions" },
    { text: "From the bottom, you can only go up. Remember that when the ceiling feels low.", source: "Red Hook Philosophy" },
    { text: "The industry will test you in ways you can't imagine. Know yourself before they try to define you.", source: "The Identity Wars" },
    { text: "Success is a rental. You have to pay the rent every day.", source: "The Maintenance Manual" }
  ];

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % wisdomQuotes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load stories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('comeup_stories');
    if (saved) {
      try {
        setSubmittedStories(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSubmitStory = () => {
    if (!userStory.trim()) return;
    const newStories = [
      { id: Date.now(), text: userStory, timestamp: new Date().toISOString() },
      ...submittedStories
    ].slice(0, 20);
    setSubmittedStories(newStories);
    localStorage.setItem('comeup_stories', JSON.stringify(newStories));
    setUserStory('');
  };

  return (
    <div className="h-full w-full bg-black text-white overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Cinematic Header */}
      <div className="relative bg-gradient-to-b from-[#0a1a0a] via-[#001100] to-black border-b border-[#00ff41]/30 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-emerald-500/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-radial from-cyan-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-20 text-center">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-[#00ff41]/70 mb-4 animate-pulse">
            A Mentorship Platform for Independent Artists
          </p>
          <h1 className="text-4xl md:text-6xl font-thin text-[#00ff41] tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,65,0.8)] mb-6">
            THE COME UP
          </h1>
          <div className="h-[2px] w-32 bg-[#00ff41] shadow-[0_0_20px_#00ff41] mx-auto mb-4"></div>
          <p className="text-white/60 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Real knowledge from the trenches. No sugarcoating. No gatekeeping. 
            Just the lessons that took decades to learn—delivered in minutes.
          </p>
          
          {/* Rotating Wisdom Quote */}
          <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-lg md:text-xl font-light italic text-white/90 mb-2 transition-all duration-700">
              "{wisdomQuotes[currentQuote].text}"
            </p>
            <p className="text-white/40 text-xs uppercase tracking-wider">
              — {wisdomQuotes[currentQuote].source}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Tab Navigation - Enhanced */}
        <div className="flex justify-center gap-2 md:gap-4 mb-10 flex-wrap">
          {[
            { id: 'pillars', label: 'The Four Pillars' },
            { id: 'toolkit', label: 'Artist Toolkit' },
            { id: 'stories', label: 'Your Journey' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-all rounded-lg ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#00ff41] to-emerald-500 text-black shadow-[0_0_30px_rgba(0,255,65,0.4)]'
                  : 'bg-white/5 border border-white/20 text-white/70 hover:border-[#00ff41]/50 hover:text-[#00ff41]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PILLARS TAB - The Four Pillars of Success */}
        {activeTab === 'pillars' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">The Four Pillars of The Come Up</h2>
              <p className="text-white/50 text-sm md:text-base max-w-2xl mx-auto">
                Success in music isn't luck—it's architecture. These four pillars hold up every sustainable career. 
                Master them, or watch your foundation crumble.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pillars.map((pillar) => (
                <div
                  key={pillar.id}
                  className={`relative bg-gradient-to-br from-black via-[#0a0a0a] to-[#050505] border border-[#00ff41]/30 rounded-xl overflow-hidden transition-all duration-300 hover:border-[#00ff41]/80 hover:shadow-[0_0_50px_rgba(0,255,65,0.3)] group`}
                >
                  {/* Top gradient accent bar - Whip Montez neon green */}
                  <div className="h-1 bg-gradient-to-r from-[#00ff41] via-[#00ff41] to-emerald-400 shadow-[0_0_10px_rgba(0,255,65,0.8)]"></div>
                  
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-black text-white">
                        {pillar.title}
                      </h3>
                      <p className="text-white/40 text-xs uppercase tracking-wider">{pillar.subtitle}</p>
                    </div>
                    
                    <p className="text-white/70 text-sm leading-relaxed mb-4">{pillar.description}</p>
                    
                    {/* Mentor Tip */}
                    <div className="bg-white/5 border-l-2 border-white/30 p-3 mb-4">
                      <p className="text-white/80 text-sm">
                        <span className="font-bold">Mentor Tip:</span> {pillar.mentorTip}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setExpandedLesson(expandedLesson === pillar.id ? null : pillar.id)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded ${
                          expandedLesson === pillar.id 
                            ? 'bg-[#00ff41] text-black' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {expandedLesson === pillar.id ? 'Close Deep Dive' : 'Read Deep Dive'}
                      </button>
                      
                      {pillar.studioLink && (
                        <button
                          onClick={() => setSection(pillar.studioLink)}
                          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${pillar.color} text-white rounded hover:shadow-lg transition-all`}
                        >
                          {pillar.studioText} →
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Deep Dive */}
                  {expandedLesson === pillar.id && (
                    <div className="border-t border-white/10 bg-[#050505] p-6 animate-fade-in">
                      <div className="prose prose-invert prose-sm max-w-none">
                        {pillar.deepDive.split('\n\n').map((paragraph, i) => {
                          const trimmed = paragraph.trim();
                          // Header with ** on both ends
                          if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                            return <h4 key={i} className="text-white font-bold text-lg mt-6 mb-3">{trimmed.slice(2, -2)}</h4>;
                          }
                          // Subheader with single * 
                          if (trimmed.startsWith('*') && !trimmed.startsWith('**') && trimmed.includes('*')) {
                            const match = trimmed.match(/^\*([^*]+)\*(.*)$/);
                            if (match) {
                              return <h5 key={i} className="text-white/90 font-semibold mt-5 mb-2 text-base">{match[1]}{match[2]}</h5>;
                            }
                          }
                          // Bullet list
                          if (trimmed.startsWith('- ')) {
                            const items = trimmed.split('\n').filter(line => line.trim().startsWith('- '));
                            return (
                              <ul key={i} className="list-none space-y-2 my-4 pl-2">
                                {items.map((item, j) => (
                                  <li key={j} className="text-white/70 text-sm leading-relaxed flex items-start gap-2">
                                    <span className="text-white/50 mt-1">→</span>
                                    <span>{item.replace(/^-\s*/, '')}</span>
                                  </li>
                                ))}
                              </ul>
                            );
                          }
                          // Source/citation (starts with "Source:" or "—")
                          if (trimmed.startsWith('Source:') || trimmed.startsWith('—')) {
                            return <p key={i} className="text-white/40 text-xs italic mt-2 mb-4">{trimmed}</p>;
                          }
                          // Regular paragraph
                          if (trimmed.length > 0) {
                            return <p key={i} className="text-white/70 text-sm leading-relaxed mb-4">{trimmed}</p>;
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOOLKIT TAB - Practical Resources */}
        {activeTab === 'toolkit' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">The Artist Toolkit</h2>
              <p className="text-white/50 text-sm md:text-base max-w-2xl mx-auto">
                Your Studio agents aren't just AI—they're training partners for every aspect of your career. 
                Here's how to use them strategically.
              </p>
            </div>

            {/* Studio Agents as Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Songwriter's Studio", link: "ghostwriter", use: "Daily writing practice. Feed it prompts, challenge yourself with different flows and perspectives." },
                { name: "Lyric Recovery", link: "chat", use: "When you have a melody but need words. When you're stuck mid-verse. It finishes what you start." },
                { name: "Cipher Dojo", link: "battle", use: "Sharpen your punchlines. Practice battle rap without the ego. Get uncomfortable." },
                { name: "Crate Digger", link: "crates", use: "Sample discovery. Genre exploration. Find sounds you didn't know you needed." },
                { name: "A&R Dashboard", link: "ar_suite", use: "Get honest feedback before you release. Understand your market position." },
                { name: "Album Art Generator", link: "album_art", use: "Visualize your concepts. Generate artwork ideas. Build your visual identity." },
                { name: "Viral Video Agent", link: "viral_video", use: "Content strategy for socials. Concept generation. Stay relevant in the algorithm." },
                { name: "Trend Hunter", link: "trend_hunter", use: "Market intelligence. See what's moving. Don't chase trends—understand them." }
              ].map((agent, i) => (
                <div
                  key={i}
                  onClick={() => setSection(agent.link)}
                  className="bg-black/50 border border-[#00ff41]/30 rounded-lg p-5 cursor-pointer hover:border-[#00ff41] hover:shadow-[0_0_30px_rgba(0,255,65,0.3)] transition-all group"
                >
                  <h4 className="font-bold text-white mb-2 group-hover:text-[#00ff41]">{agent.name}</h4>
                  <p className="text-white/60 text-xs leading-relaxed mb-3">{agent.use}</p>
                  <p className="text-[#00ff41]/70 text-xs font-bold uppercase tracking-wider group-hover:text-[#00ff41]">
                    Open Agent →
                  </p>
                </div>
              ))}
            </div>

            {/* Weekly Practice Framework */}
            <div className="bg-gradient-to-br from-[#001a00] to-[#000a00] border border-[#00ff41]/30 rounded-xl p-6 md:p-8">
              <h3 className="text-xl font-bold text-white mb-4">
                The Weekly Come Up Schedule
              </h3>
              <p className="text-white/60 text-sm mb-6">Structure creates freedom. Here's a suggested weekly practice using your Studio agents.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { day: "MON/THU", focus: "WRITING", task: "30 min in Songwriter's Studio. Different prompt each day.", color: "text-emerald-400" },
                  { day: "TUE/FRI", focus: "STUDY", task: "Crate Digger session. Analyze one sample. Learn the history.", color: "text-indigo-400" },
                  { day: "WED", focus: "BATTLE", task: "Cipher Dojo. Push your punchlines. Record yourself.", color: "text-red-400" },
                  { day: "SAT", focus: "CONTENT", task: "Viral Video + Trend Hunter. Plan your week's social strategy.", color: "text-violet-400" }
                ].map((schedule, i) => (
                  <div key={i} className="bg-black/50 border border-white/10 rounded-lg p-4">
                    <p className={`font-bold text-sm ${schedule.color}`}>{schedule.day}</p>
                    <p className="text-white text-xs font-bold uppercase tracking-wider mb-2">{schedule.focus}</p>
                    <p className="text-white/60 text-xs">{schedule.task}</p>
                  </div>
                ))}
              </div>
              
              <p className="text-white/40 text-xs mt-4 text-center italic">
                Sunday is rest. Or studio time if you're really locked in. Either way—no judgment.
              </p>
            </div>

            {/* Resource Links */}
            <div className="bg-black/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">External Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="text-white font-bold">Business & Legal</p>
                  <p className="text-white/60">• ASCAP / BMI / SESAC - Performance rights organizations</p>
                  <p className="text-white/60">• DistroKid / TuneCore - Distribution</p>
                  <p className="text-white/60">• Volunteer Lawyers for the Arts - Free legal help</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-bold">Mental Health</p>
                  <p className="text-white/60">• 988 - Suicide & Crisis Lifeline</p>
                  <p className="text-white/60">• Text HOME to 741741 - Crisis Text Line</p>
                  <p className="text-white/60">• MusicCares - Industry-specific support</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* YOUR JOURNEY TAB */}
        {activeTab === 'stories' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Your Come Up Story</h2>
              <p className="text-white/50 text-sm md:text-base max-w-2xl mx-auto">
                Every artist has a journey. The late nights, the doubts, the small wins nobody saw. 
                This is a space to share yours—and to draw strength from others.
              </p>
            </div>

            {/* Submit Story */}
            <div className="bg-gradient-to-br from-[#0a0a0a] to-black border border-[#00ff41]/30 rounded-xl p-6">
              <h3 className="text-white font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Edit2 size={18} /> Share Your Journey
              </h3>
              <textarea
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder="Where did you start? What kept you going when it was hard? What's a lesson you learned the hard way? This is your space to be real..."
                className="w-full h-40 bg-black border border-[#00ff41]/30 text-white p-4 outline-none resize-none focus:border-[#00ff41] placeholder:text-white/30 font-mono text-sm rounded-lg"
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-white/40 text-xs">{userStory.length}/1000</span>
                <button
                  onClick={handleSubmitStory}
                  disabled={!userStory.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-[#00ff41] to-emerald-500 text-black font-bold uppercase text-xs tracking-wider hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  Share Story
                </button>
              </div>
            </div>

            {/* Community Stories */}
            <div>
              <h3 className="text-white font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users size={18} /> Community Stories
              </h3>
              {submittedStories.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/20 rounded-xl">
                  <p className="text-white/40 text-sm">No stories yet. Be the first to share your journey.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submittedStories.map((story) => (
                    <div key={story.id} className="bg-[#0a0a0a] border-l-4 border-[#00ff41] p-5 rounded-r-lg">
                      <p className="text-white/80 text-sm leading-relaxed">{story.text}</p>
                      <p className="text-[#00ff41]/50 text-xs mt-3 font-mono">
                        {new Date(story.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Call to Action */}
            <div className="text-center py-12 bg-gradient-to-r from-transparent via-[#00ff41]/5 to-transparent border-y border-[#00ff41]/20 rounded-xl">
              <p className="text-white text-xl md:text-2xl font-bold mb-3">You're Not Alone in This</p>
              <p className="text-white/50 text-sm max-w-lg mx-auto mb-6">
                Every legend started where you are. Every hit was once an idea in a bedroom studio. 
                The difference between them and you? They didn't stop.
              </p>
              <button
                onClick={() => setSection('studio')}
                className="px-8 py-4 bg-gradient-to-r from-[#00ff41] to-emerald-500 text-black font-black uppercase tracking-wider rounded-lg hover:shadow-[0_0_30px_rgba(0,255,65,0.5)] transition-all"
              >
                Enter The Studio →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-white/20 text-xs uppercase tracking-widest border-t border-white/5">
        Past & Present // The Come Up // Whip Montez
      </div>
    </div>
  );
};

// 8. COMMUNITY HUB (The Block - RESTORED TO GREEN/BLACK OS STYLE)
const CommunityHub = ({ setSection }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [user, setUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Demo Data for Offline Mode
  const demoPosts = [
      { id: '1', user: "User_4821", content: "Just heard the new leaked track... Montez is next up for real.", likes: 12, replies: [], createdAt: { seconds: Date.now() / 1000 } },
      { id: '2', user: "BK_Finest", content: "Anyone going to the show at Rec Center tonight?", likes: 5, replies: [{ user: "User_9921", text: "Already got my tickets", createdAt: Date.now() }], createdAt: { seconds: (Date.now() - 3600000) / 1000 } },
      { id: '3', user: "Livewire_Fan", content: "Red Hook Diaries is a classic. No skips.", likes: 24, replies: [], createdAt: { seconds: (Date.now() - 86400000) / 1000 } }
  ];

  // NOTE: Auth listener removed from here - only fetch posts
  // Auth state is centrally managed in OSInterface to prevent blink
  useEffect(() => {
    if (!db) {
        setPosts(demoPosts);
        return;
    }
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'community_posts'), orderBy('createdAt', 'desc'));
    const unsubData = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubData(); };
  }, []);

  const handlePost = async () => {
    if ((!newPost.trim() && !mediaUrl.trim())) return;
    
    // Determine post type
    let type = 'text';
    if (mediaUrl) {
        if (mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null) type = 'image';
        else if (mediaUrl.match(/\.(mp4|webm)$/i) != null) type = 'video';
        else if (mediaUrl.includes('tiktok.com') || mediaUrl.includes('youtube.com/shorts')) type = 'vertical_video';
        else type = 'link'; 
    }

    const postData = {
      user: user && !user.isAnonymous ? `User_${user.uid.slice(0,4)}` : "Anon_Guest",
      content: newPost,
      mediaUrl: mediaUrl,
      mediaType: type,
      likes: 0,
      replies: [],
      createdAt: serverTimestamp(),
    };

    if (!db) {
        // Offline Post
        setPosts([{ id: Date.now().toString(), ...postData, createdAt: { seconds: Date.now() / 1000 } }, ...posts]);
    } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'community_posts'), postData);
    }

    setNewPost("");
    setMediaUrl("");
    setShowMediaInput(false);
  };

  const handleLike = async (postId, currentLikes) => {
    if (!db) {
        setPosts(posts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
        return;
    }
    const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'community_posts', postId);
    await updateDoc(postRef, { likes: (currentLikes || 0) + 1 });
  };

  const handleReply = async (postId) => {
    if (!replyText.trim()) return;
    
    const newComment = {
        user: user && !user.isAnonymous ? `User_${user.uid.slice(0,4)}` : "Anon_Guest",
        text: replyText,
        createdAt: Date.now()
    };

    if (!db) {
         setPosts(posts.map(p => p.id === postId ? { ...p, replies: [...(p.replies || []), newComment] } : p));
    } else {
        const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'community_posts', postId);
        await updateDoc(postRef, { 
            replies: arrayUnion(newComment) 
        });
    }
    setReplyingTo(null);
    setReplyText("");
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-black font-mono flex flex-col">
      
      {/* Header - Glossy Style */}
      <div className="relative z-10 bg-[#050505] border-b border-[#00ff41]/20 shrink-0">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-purple-400/60 mb-1">
                Fan Community
              </p>
              <h2 className="text-2xl md:text-3xl font-thin text-purple-400 tracking-tight flex items-center gap-3" style={{textShadow: '0 0 20px rgba(168,85,247,0.4)'}}>
                <Users size={24} className="opacity-70" /> THE BLOCK
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-black border border-white/10 px-3 py-2 rounded">
                <Search size={14} className="text-gray-500"/>
                <input 
                  type="text" 
                  placeholder="Search posts..."
                  className="bg-transparent text-white text-xs font-mono outline-none placeholder-gray-600 w-40"
                  onChange={(e) => {
                    const term = e.target.value.toLowerCase();
                    if (term) {
                      const filtered = posts.filter(p => 
                        p.content?.toLowerCase().includes(term) || 
                        p.user?.toLowerCase().includes(term)
                      );
                      setPosts(filtered.length ? filtered : posts);
                    }
                  }}
                />
              </div>
              <button 
                onClick={() => setSection('chat')}
                className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors rounded"
              >
                <MessageSquare size={14}/> Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full" style={{WebkitOverflowScrolling: 'touch'}}>
        
        {/* Welcome Banner */}
        <div className="bg-[#0a0a0a] border border-purple-500/20 rounded-lg p-5 mb-6" style={{boxShadow: '0 0 30px rgba(168,85,247,0.05)'}}>
          <h3 className="text-white font-medium text-sm mb-2">Welcome to The Block</h3>
          <p className="text-gray-500 text-xs leading-relaxed">
            Connect with other Whip Montez fans. Share thoughts, memories, and reactions. This is your space to discuss the Alternative Reality Experience and celebrate the legacy.
          </p>
        </div>
        
        <div className="space-y-4">
          
          {/* Input Area - Glossy Style */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 relative">
             <textarea 
               value={newPost}
               onChange={(e) => setNewPost(e.target.value)}
               placeholder="Share your thoughts with the community..." 
               className="w-full bg-black border border-white/10 text-white text-sm p-3 outline-none resize-none h-20 font-sans rounded focus:border-purple-500/30 transition-colors mb-3 placeholder-gray-600"
             ></textarea>
             
             {showMediaInput && (
                 <div className="flex items-center gap-2 mb-3 bg-black border border-white/10 p-2 rounded">
                     <LinkIcon size={14} className="text-purple-400"/>
                     <input 
                         type="text" 
                         value={mediaUrl}
                         onChange={(e) => setMediaUrl(e.target.value)}
                         placeholder="Paste image or video URL..."
                         className="flex-1 bg-transparent text-white text-xs outline-none placeholder-gray-600"
                     />
                 </div>
             )}
             
             <div className="flex justify-between items-center">
               <div className="flex gap-3 text-gray-600">
                 <button onClick={() => setShowMediaInput(!showMediaInput)} className={`hover:text-purple-400 transition-colors ${showMediaInput ? 'text-purple-400' : ''}`}><ImageIcon size={16}/></button>
                 <button onClick={() => setShowMediaInput(!showMediaInput)} className="hover:text-purple-400 transition-colors"><Video size={16}/></button>
               </div>
               <button 
                 onClick={handlePost}
                 className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-5 py-2 text-xs font-medium rounded hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors"
               >
                 Post
               </button>
             </div>
          </div>

          {/* Posts Feed - Glossy Style */}
          {posts.map(post => (
            <div key={post.id} className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 hover:border-purple-500/20 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center">
                     <span className="text-purple-400 font-medium text-xs">{post.user.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm flex items-center gap-2">
                      <span>{post.user}</span>
                      <span className="text-[9px] bg-purple-500/10 text-purple-400/70 px-1.5 py-0.5 rounded">FAN</span>
                    </div>
                    <div className="text-gray-600 text-[10px] mt-0.5">
                      {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-gray-300 text-sm leading-relaxed mb-3 pl-11">
                {post.content}
              </div>

              {post.mediaUrl && (
                  <div className="pl-11 mb-3">
                      {post.mediaType === 'video' ? (
                          <div className="aspect-video bg-black border border-white/10 rounded-lg overflow-hidden">
                              <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                          </div>
                      ) : post.mediaType === 'vertical_video' ? (
                          <div className="max-w-[200px] aspect-[9/16] bg-black border border-white/10 rounded-xl overflow-hidden mx-auto">
                              <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                          </div>
                      ) : (
                          <div className="rounded-lg border border-white/10 overflow-hidden">
                              <img src={post.mediaUrl} alt="Post Attachment" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                          </div>
                      )}
                  </div>
              )}
              
              {/* Actions Bar */}
              <div className="flex gap-6 text-xs text-gray-500 border-t border-white/5 pt-3 pl-11">
                <button 
                  onClick={() => handleLike(post.id, post.likes)}
                  className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
                >
                  <Heart size={14}/> 
                  <span>{post.likes || 0}</span>
                </button>
                <button 
                  onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
                >
                  <MessageCircle size={14}/> 
                  <span>Reply ({post.replies?.length || 0})</span>
                </button>
              </div>

              {/* Replies Section */}
              {(post.replies?.length > 0 || replyingTo === post.id) && (
                <div className="mt-3 pl-11">
                  
                  {/* Reply Input */}
                  {replyingTo === post.id && (
                    <div className="flex gap-2 mb-3">
                      <input 
                        className="flex-1 bg-black border border-white/10 text-white text-sm p-2 outline-none rounded focus:border-purple-500/30 transition-colors"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        onKeyPress={(e) => e.key === 'Enter' && handleReply(post.id)}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleReply(post.id)}
                        className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-4 text-xs font-medium rounded hover:bg-purple-500/20 transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  )}

                  {/* Reply List */}
                  {post.replies?.length > 0 && (
                    <div className="space-y-2 border-l border-white/10 pl-3">
                      {post.replies.map((reply, idx) => (
                         <div key={idx} className="text-sm">
                            <span className="text-purple-400/80 font-medium mr-2">{reply.user}</span>
                            <span className="text-gray-400">{reply.text}</span>
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
          
          {posts.length === 0 && (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-lg">
              <Users size={40} className="text-gray-700 mx-auto mb-4"/>
              <div className="text-gray-500 text-sm mb-2">No posts yet</div>
              <div className="text-gray-600 text-xs">Be the first to share something with the community</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 9. SONGWRITER'S STUDIO - AI Writing Partner
const SongwritersStudio = () => {
  const [mode, setMode] = useState('hook'); // 'hook', 'verse', 'bridge', 'freestyle'
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [rhymeScheme, setRhymeScheme] = useState('AABB');
  const [mood, setMood] = useState('hype');
  const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_songwriter', 5);
  const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
    setInput(prev => prev ? prev + ' ' + transcript : transcript);
  });
  const { speak, stop, isSpeaking, isSupported: speechSupported } = useSpeechSynthesis();

  const modes = [
    { id: 'hook', label: 'HOOK', icon: '🎤', desc: 'Catchy chorus lines' },
    { id: 'verse', label: 'VERSE', icon: '📝', desc: '16-bar verses' },
    { id: 'bridge', label: 'BRIDGE', icon: '🌉', desc: 'Transitional sections' },
    { id: 'freestyle', label: 'FREE', icon: '⚡', desc: 'Stream of consciousness' }
  ];

  const moods = [
    { id: 'hype', label: '🔥 HYPE', color: 'from-orange-500 to-red-500' },
    { id: 'dark', label: '🌙 DARK', color: 'from-purple-600 to-gray-900' },
    { id: 'smooth', label: '🎷 SMOOTH', color: 'from-blue-500 to-cyan-400' },
    { id: 'introspective', label: '💭 DEEP', color: 'from-emerald-600 to-teal-500' },
    { id: 'party', label: '🎉 PARTY', color: 'from-pink-500 to-yellow-400' }
  ];

  const rhymeSchemes = ['AABB', 'ABAB', 'ABBA', 'AAAA', 'FREE'];

  const handleGenerate = async () => {
    if (!input.trim()) return;

    const cooldownTime = 2000;
    const now = Date.now();
    if (now - lastRequestTime.current < cooldownTime) {
      return;
    }

    if (!canUse) {
      setOutput(`⚠️ FREE LIMIT REACHED\n\n${limit} free generations used.\nUpgrade for unlimited access.`);
      return;
    }

    setLoading(true);
    setOutput("");
    consume();

    const modePrompts = {
      hook: `Write a catchy, memorable hook/chorus for a hip-hop track. Make it 4-8 lines, rhythmic, and easy to remember. Theme: ${input}. Mood: ${mood}. Include a tagline that could become iconic.`,
      verse: `Write a 16-bar verse with ${rhymeScheme} rhyme scheme. Theme: ${input}. Mood: ${mood}. Include internal rhymes, wordplay, and vivid imagery. Format with line breaks.`,
      bridge: `Write a bridge section (8 lines) that provides contrast and builds tension. Theme: ${input}. Mood: ${mood}. It should feel like a transition that elevates the song.`,
      freestyle: `Write a raw, unfiltered freestyle flow. No rules, just bars. Starting point: ${input}. Mood: ${mood}. Be creative, unexpected, and hard-hitting.`
    };

    const systemPrompt = `You are a legendary hip-hop songwriter with credits on classic albums. Write lyrics in the style of NYC golden era mixed with modern flows. Be creative, authentic, and avoid clichés. Output ONLY the lyrics, no explanations. Use proper line breaks.`;

    const responseText = await callGemini(modePrompts[mode], systemPrompt);
    
    setOutput(responseText);
    setHistory(prev => [{
      mode,
      mood,
      input,
      output: responseText,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 10));
    
    lastRequestTime.current = Date.now();
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <AgentContainer 
      title="SONGWRITER'S STUDIO" 
      icon={Feather} 
      accentColor="neon"
      headerExtra={
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <Sparkles size={12} className="text-green-300"/>
          <span className="hidden sm:inline">AI PARTNER</span>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        {/* Mode Selector */}
        <div className="p-3 md:p-4 bg-[#111] border-b border-green-500/30 shrink-0">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  mode === m.id 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/30' 
                    : 'bg-black/50 text-gray-400 border border-green-500/20 hover:border-green-500/50'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Mood & Rhyme Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 font-mono mb-1 block">MOOD</label>
              <div className="flex gap-1 flex-wrap">
                {moods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      mood === m.id 
                        ? `bg-gradient-to-r ${m.color} text-white` 
                        : 'bg-black/50 text-gray-500 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            {mode === 'verse' && (
              <div>
                <label className="text-[10px] text-gray-500 font-mono mb-1 block">RHYME SCHEME</label>
                <div className="flex gap-1">
                  {rhymeSchemes.map(rs => (
                    <button
                      key={rs}
                      onClick={() => setRhymeScheme(rs)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                        rhymeScheme === rs 
                          ? 'bg-green-600 text-white' 
                          : 'bg-black/50 text-gray-500 hover:text-white'
                      }`}
                    >
                      {rs}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-black border border-green-500/50 rounded-lg overflow-hidden focus-within:border-green-400 transition-colors">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder={mode === 'hook' ? "What's the hook about? (e.g., rising from nothing)" : mode === 'verse' ? "Theme or story for the verse..." : mode === 'bridge' ? "What transition or emotion?" : "Start with anything..."} 
                className="flex-1 bg-transparent text-white p-3 text-sm font-mono outline-none" 
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()} 
              />
              {isSupported && (
                <button 
                  onClick={startListening} 
                  disabled={loading || isListening}
                  className={`px-3 ${isListening ? 'bg-green-600 animate-pulse' : 'hover:bg-green-900/50'} text-white transition-colors disabled:opacity-50`}
                  title="Voice input"
                >
                  <Mic size={18}/>
                </button>
              )}
            </div>
            <button 
              onClick={handleGenerate} 
              disabled={loading || !input.trim()} 
              className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 text-sm font-bold hover:from-green-500 hover:to-emerald-400 uppercase disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all rounded-lg shadow-lg shadow-green-500/30"
            >
              {loading ? <RefreshCw size={18} className="animate-spin"/> : <Zap size={18}/>}
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-[#0a0a0a]" style={{WebkitOverflowScrolling: 'touch'}}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-green-400">
              <RefreshCw size={32} className="animate-spin mb-4"/>
              <span className="text-sm font-mono animate-pulse">CRAFTING {mode.toUpperCase()}...</span>
            </div>
          )}

          {!loading && output && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-bold text-sm">{modes.find(m => m.id === mode)?.icon} {mode.toUpperCase()}</span>
                  <span className="text-[10px] text-gray-500 font-mono">• {moods.find(m => m.id === mood)?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {speechSupported && (
                    <button 
                      onClick={() => isSpeaking ? stop() : speak(output)}
                      className={`flex items-center gap-1 text-[10px] transition-colors ${isSpeaking ? 'text-green-400' : 'text-gray-500 hover:text-green-400'}`}
                    >
                      {isSpeaking ? <VolumeX size={12}/> : <Volume2 size={12}/>} {isSpeaking ? 'STOP' : 'SPEAK'}
                    </button>
                  )}
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-green-400 transition-colors"
                  >
                    <Copy size={12}/> COPY
                  </button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-900/20 to-black border border-green-500/30 rounded-lg p-4">
                <pre className="text-white font-mono text-sm whitespace-pre-wrap leading-relaxed">{output}</pre>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleGenerate}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-400 transition-colors border border-green-500/20 px-3 py-1 rounded hover:border-green-500/50"
                >
                  <RefreshCw size={12}/> REGENERATE
                </button>
              </div>
            </div>
          )}

          {!loading && !output && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <Feather size={48} className="mb-4 text-green-500/30"/>
              <span className="text-lg font-bold text-white mb-2">WRITER'S BLOCK?</span>
              <span className="text-sm text-center max-w-md">Enter a theme, feeling, or concept above and let the AI help craft your next verse, hook, or bridge.</span>
            </div>
          )}

          {/* History Section */}
          {history.length > 0 && !loading && (
            <div className="mt-6 pt-4 border-t border-green-500/20">
              <h3 className="text-[10px] font-mono text-gray-500 mb-3">RECENT GENERATIONS</h3>
              <div className="space-y-2">
                {history.slice(0, 5).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMode(item.mode);
                      setMood(item.mood);
                      setInput(item.input);
                      setOutput(item.output);
                    }}
                    className="w-full text-left p-2 bg-black/50 border border-green-500/10 rounded hover:border-green-500/30 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-bold truncate flex-1">{item.input}</span>
                      <span className="text-[10px] text-gray-600 font-mono">{item.timestamp}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {modes.find(m => m.id === item.mode)?.icon} {item.mode.toUpperCase()} • {moods.find(m => m.id === item.mood)?.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentContainer>
  );
};

// 10. NEWS ARCHIVE
const NewsArchive = () => {
  const [mode, setMode] = useState('live'); // 'historical' or 'live'
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [trendingPosts, setTrendingPosts] = useState([]);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_news', 3);

  const defaultHistorical = [
    { id: 1, date: "DEC 12 2025", time: "11:23 PM EST", source: "LIVEWIRE DAILY", author: "B. Wilson", title: "WHIP MONTEZ CATALOG RESTORED: LOST TAPES DISCOVERED", content: "After 20+ years, the complete unreleased archive of Brooklyn's Whip Montez has been digitally restored and made available online.", tags: ["HIPHOP", "RESTORATION", "NYC"] },
    { id: 2, date: "DEC 10 2025", time: "02:15 PM EST", source: "HIP HOP DX", author: "Staff", title: "RED HOOK DIARIES REACHES CULT CLASSIC STATUS", content: "The 2004 mixtape that never got proper distribution is now considered one of NYC's hidden gems.", tags: ["CLASSIC", "UNDERGROUND"] },
    { id: 3, date: "DEC 08 2025", time: "09:30 AM EST", source: "COMPLEX", author: "K. Rodriguez", title: "ERICK SERMON ON DISCOVERING WHIP MONTEZ", content: "The Def Squad legend recalls finding the Red Hook lyricist in a basement cipher back in 2004.", tags: ["INTERVIEW", "LEGENDS"] },
    { id: 4, date: "DEC 05 2025", time: "04:20 PM EST", source: "BROOKLYN VEGAN", author: "Local", title: "THE STOOP: HOW A 2001 TAPE INFLUENCED NYC RAP", content: "Musicologists trace the DNA of modern Brooklyn hip-hop back to this forgotten project.", tags: ["HISTORY", "BROOKLYN"] },
    { id: 5, date: "DEC 01 2025", time: "12:00 PM EST", source: "PITCHFORK", author: "M. Chen", title: "LIVEWIRE SESSIONS: THE LOST ALBUM THAT TIME FORGOT", content: "A deep dive into the unreleased 2004 debut that features production from legendary NYC beatmakers.", tags: ["REVIEW", "ANALYSIS"] },
    { id: 6, date: "NOV 28 2025", time: "06:45 PM EST", source: "THE FADER", author: "Editorial", title: "WHIP MONTEZ REUNION SHOW SELLS OUT IN MINUTES", content: "Brooklyn fans crash ticket website trying to secure spots for the first live performance in over 20 years.", tags: ["LIVE", "EVENTS"] },
    { id: 7, date: "NOV 25 2025", time: "03:15 PM EST", source: "REVOLT", author: "Video Team", title: "UNRELEASED FREESTYLE FOOTAGE SURFACES ONLINE", content: "Rare clips from 2004 Red Hook ciphers show Whip Montez battling alongside Ali Vegas and other NYC legends.", tags: ["VIDEO", "ARCHIVE"] },
    { id: 8, date: "NOV 20 2025", time: "10:30 AM EST", source: "VIBE", author: "R. Jackson", title: "THE LIVEWIRE MOVEMENT: NYC'S FORGOTTEN LABEL", content: "How Erick Sermon's indie imprint almost changed the game before the digital era hit.", tags: ["LABEL", "INDUSTRY"] },
    { id: 9, date: "NOV 15 2025", time: "08:00 PM EST", source: "MASS APPEAL", author: "Culture Desk", title: "SAMPLE BREAKDOWN: WHIP MONTEZ'S PRODUCTION SECRETS", content: "Producers analyze the dusty breaks and obscure loops that made the Red Hook sound so distinctive.", tags: ["PRODUCTION", "BEATS"] },
    { id: 10, date: "NOV 10 2025", time: "01:45 PM EST", source: "HYPEBEAST", author: "Fashion", title: "WHIP MONTEZ MERCH DROP: VINTAGE 2004 AESTHETIC", content: "Limited edition Livewire gear featuring original album artwork sells out in hours, fueling collector market.", tags: ["FASHION", "MERCH"] }
  ];

  const defaultTrending = [
    { platform: 'X', icon: '𝕏', username: '@HipHopDaily', time: '2m', text: '🔥 New Kendrick album dropping midnight EST confirmed', likes: '24.5K', color: 'text-blue-400' },
    { platform: 'Reddit', icon: '🎧', username: 'r/hiphopheads', time: '15m', text: '[FRESH] Travis Scott - FE!N (Official Video)', likes: '892', color: 'text-orange-500' },
    { platform: 'Instagram', icon: '📸', username: '@complexmusic', time: '1h', text: 'Drake spotted in studio with Metro Boomin 👀', likes: '156K', color: 'text-pink-500' },
    { platform: 'X', icon: '𝕏', username: '@XXL', time: '2h', text: 'Breaking: J. Cole announces surprise EP this Friday', likes: '18.2K', color: 'text-blue-400' },
    { platform: 'TikTok', icon: '🎵', username: '@hiphopvibes', time: '3h', text: 'This beat is going CRAZY on my FYP 🔥', likes: '2.1M', color: 'text-cyan-400' }
  ];

  useEffect(() => {
    if (mode === 'historical') {
      setNewsItems(defaultHistorical);
    } else {
      fetchLiveNews();
    }
    setTrendingPosts(defaultTrending);
  }, [mode]);

  const fetchLiveNews = async () => {
    setLoading(true);
    const query = searchTerm || "latest hip hop news, trending rap artists, new album releases, hip hop industry news";
    const systemPrompt = `You are a real-time hip hop news aggregator for December 2025. Generate 10 current, plausible hip hop/rap news headlines. Include: new releases, trending artists, beef/drama, industry news, viral moments. Format as JSON array: [{ "id": 1, "date": "DEC 12 2025", "time": "11:23 PM EST", "source": "COMPLEX/XXL/BILLBOARD/etc", "author": "Staff", "title": "HEADLINE IN CAPS", "content": "2-3 sentences of details", "tags": ["TAG1", "TAG2"] }]. Make it feel current and real. No markdown formatting.`;

    if (!canUse) {
      setNewsItems([{ id: 0, date: "", time: "", source: "SYSTEM", author: "", title: `FREE LIMIT REACHED: ${limit} free news pulls used.`, content: "", tags: ["LIMIT"] }]);
      setLoading(false);
      return;
    }
    consume();

    try {
      const response = await callGemini(query, systemPrompt, true); // Use search for live mode
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      setNewsItems(JSON.parse(cleanJson));
    } catch (e) {
      setNewsItems(defaultHistorical);
    }
    setLoading(false);
  };

  const fetchNews = async (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'historical') {
      setNewsItems(defaultHistorical);
      setLoading(false);
    } else {
      await fetchLiveNews();
    }
  };

  const refreshTrending = async () => {
    const systemPrompt = `Generate 5 fake but plausible trending social media posts about hip hop from X (Twitter), Reddit, Instagram, TikTok in December 2025. Format as JSON: [{ "platform": "X/Reddit/Instagram/TikTok", "icon": "emoji", "username": "@handle or r/sub", "time": "2m/1h/etc", "text": "Post content", "likes": "24.5K/892/etc", "color": "text-blue-400/text-orange-500/etc" }]. No markdown.`;
    
    try {
      const response = await callGemini("trending hip hop social media posts", systemPrompt, false);
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      setTrendingPosts(JSON.parse(cleanJson));
    } catch (e) {
      setTrendingPosts(defaultTrending);
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black z-10"></div>
      <div className={`relative z-30 w-full max-w-6xl h-[85vh] flex flex-col font-mono text-gray-300 transition-colors duration-500 bg-[#050505] border border-[#00ff41]/20 rounded-lg`} style={{boxShadow: '0 0 60px rgba(0, 255, 65, 0.08)'}}>
        {/* News Header - Refined Glossy Style */}
        <div className="bg-[#050505] px-4 md:px-6 py-5 border-b border-[#00ff41]/20 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 transition-colors duration-500 rounded-t-lg">
           <div>
             <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#00ff41]/50 mb-2 flex items-center gap-2">
               <Globe size={14}/> {mode === 'historical' ? 'Archive Mode' : 'Real-Time News & Trending'}
             </p>
             <h1 className={`text-2xl md:text-4xl font-thin tracking-tighter leading-none ${mode === 'historical' ? 'text-[#00ff41]' : 'text-cyan-400'}`} style={{textShadow: mode === 'historical' ? '0 0 10px rgba(0,255,65,0.4)' : '0 0 10px rgba(34,211,238,0.4)'}}>
               {mode === 'historical' ? 'THE FEED 2004' : 'LIVE HIP-HOP'}
             </h1>
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:max-w-md flex items-center gap-2 bg-black border border-white/10 px-3 py-2 rounded">
                <Search size={16} className="text-gray-500"/>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={mode === 'historical' ? "Search archives..." : "Search (e.g. 'Drake beef')"}
                  className="bg-transparent border-none outline-none text-white font-normal text-sm w-full placeholder-gray-600"
                  onKeyPress={(e) => e.key === 'Enter' && fetchNews(mode)}
                />
                {mode === 'live' && (
                    <button onClick={() => fetchLiveNews()} className="bg-cyan-500/10 text-cyan-400 px-3 py-1 text-xs font-medium rounded border border-cyan-500/30 hover:border-cyan-400/50 transition-all">SEARCH</button>
                )}
             </div>
             
              <div className="flex items-center gap-2 bg-black border border-white/10 px-3 py-2 rounded">
                  <span className={`text-[10px] md:text-xs font-medium ${mode === 'historical' ? 'text-[#00ff41]' : 'text-gray-600'}`}>2004</span>
                  <button onClick={() => fetchNews(mode === 'historical' ? 'live' : 'historical')} disabled={loading} className={`focus:outline-none transition-colors ${mode === 'historical' ? 'text-[#00ff41]' : 'text-cyan-400'}`}>
                    {mode === 'historical' ? <ToggleLeft size={28} /> : <ToggleRight size={28} />}
                  </button>
                  <span className={`text-[10px] md:text-xs font-medium ${mode === 'live' ? 'text-cyan-400' : 'text-gray-600'}`}>LIVE</span>
               </div>
           </div>
        </div>
        
        <div className="flex-1 flex overflow-hidden relative">
           {loading && <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center"><RefreshCw size={48} className="animate-spin text-cyan-500/70" /></div>}
           
           {/* Left Panel - Trending Social */}
           <div className="hidden md:flex w-80 bg-[#0a0a0a] border-r border-white/10 flex-col shrink-0">
             <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
               <h3 className="font-medium text-cyan-400/80 text-sm flex items-center gap-2">
                 <TrendingUp size={14} /> TRENDING NOW
               </h3>
               <button onClick={refreshTrending} className="text-gray-600 hover:text-cyan-400 transition-colors">
                 <RefreshCw size={14} />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-200px)]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ff41 #0a0a0a' }}>
               {trendingPosts.map((post, i) => (
                 <div key={i} className="bg-black border border-white/10 p-3 rounded hover:border-cyan-500/30 transition-all cursor-pointer">
                   <div className="flex items-start gap-2 mb-2">
                     <span className="text-lg">{post.icon}</span>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 text-xs">
                         <span className={`font-medium ${post.color}`}>{post.username}</span>
                         <span className="text-gray-600">• {post.time}</span>
                       </div>
                     </div>
                   </div>
                   <p className="text-xs text-gray-400 leading-relaxed mb-2">{post.text}</p>
                   <div className="flex items-center gap-3 text-xs text-gray-600">
                     <span>❤️ {post.likes}</span>
                     <span className="text-gray-700">•</span>
                     <span className="text-gray-600">{post.platform}</span>
                   </div>
                 </div>
               ))}
             </div>
             <div className="p-3 border-t border-white/10 text-center">
               <p className="text-[9px] text-gray-600 uppercase tracking-wider">Updated Every 5 Minutes</p>
             </div>
           </div>
           
           {/* Main News Feed */}
           <div className="flex-1 overflow-y-auto bg-black p-4 space-y-4">
             {mode === 'live' && (
               <div className="bg-red-900/10 border border-red-500/30 p-3 rounded flex items-center gap-3">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="text-red-400/80 text-xs font-medium uppercase tracking-wider">Live Feed Active • Searching Real-Time Sources</span>
               </div>
             )}
             {newsItems.map((item) => (
               <div key={item.id} className="border border-white/10 bg-[#0a0a0a] p-4 hover:border-cyan-500/30 transition-all group rounded">
                   <div className="flex items-start justify-between mb-2">
                     <div className="flex-1">
                       <h2 className="text-base md:text-lg font-medium text-white mb-1 group-hover:text-cyan-400 transition-colors">{item.title}</h2>
                       <p className="text-sm text-gray-500 leading-relaxed">{item.content}</p>
                     </div>
                   </div>
                   <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                     <span className="text-cyan-400/80 font-medium">{item.source}</span>
                     <span className="text-gray-700">•</span>
                     <span className="text-gray-600">{item.date}</span>
                     {item.time && <><span className="text-gray-700">•</span><span className="text-gray-600">{item.time}</span></>}
                     {item.tags && item.tags.map(tag => (
                       <span key={tag} className="bg-cyan-500/10 text-cyan-400/80 px-2 py-0.5 rounded text-[10px] font-medium">#{tag}</span>
                     ))}
                   </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

// 10.5 LYRIC RECOVERY - NEW HIGH-FIDELITY DESIGN
const LyricRecovery = () => {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_ghostwriter', 5);
  const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
    setInput(prev => prev ? prev + ' ' + transcript : transcript);
  });
  const { speak, stop, isSpeaking, isSupported: speechSupported } = useSpeechSynthesis();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleGenerate = async () => {
    if (!input.trim()) return;

    const cooldownTime = 3000;
    const now = Date.now();
    if (now - lastRequestTime.current < cooldownTime) {
      alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds.`);
      return;
    }

    if (!canUse) {
      setHistory(prev => [...prev, { sender: 'ai', text: `FREE LIMIT REACHED: ${limit} free generations used.` }]);
      return;
    }
    consume();
    
    const userMsg = { sender: 'user', text: input };
    setHistory(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const systemPrompt = "You are a legendary hip-hop ghostwriter from 2004, channeling the golden era of NYC rap. Write creative, hard-hitting lyrics with clever wordplay, internal rhymes, and authentic street poetry. Keep responses focused on the bars - no explanations needed.";
    const responseText = await callGemini(input, systemPrompt);
    
    lastRequestTime.current = Date.now();
    setHistory(prev => [...prev, { sender: 'ai', text: responseText }]);
    setLoading(false);
  };

  return (
    <AgentContainer 
      title="LYRIC RECOVERY" 
      icon={Sparkles} 
      accentColor="magenta"
    >
      <div className="h-full flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" style={{WebkitOverflowScrolling: 'touch'}}>
          {history.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <Sparkles size={48} className="mx-auto mb-4 text-cyan-500/30" />
              <p className="text-sm font-mono tracking-wide">ENTER A TOPIC OR CONCEPT</p>
              <p className="text-xs text-gray-600 mt-2">AI will craft lyrics in the style of 2004 NYC hip-hop</p>
            </div>
          )}
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[80%] px-4 py-3 rounded-lg relative ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white' 
                  : 'bg-gradient-to-r from-[#1f1f1f] to-[#181818] text-gray-200 border border-white/5'
              }`} style={{boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(0,255,255,0.2)' : '0 4px 15px rgba(0,0,0,0.3)'}}>
                <p className="text-sm md:text-base whitespace-pre-wrap relative z-10">{msg.text}</p>
                {msg.sender === 'ai' && speechSupported && (
                  <button 
                    onClick={() => isSpeaking ? stop() : speak(msg.text)}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border border-white/20"
                  >
                    {isSpeaking ? <VolumeX size={14} className="text-white"/> : <Volume2 size={14} className="text-white"/>}
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-[#1f1f1f] to-[#181818] px-4 py-3 rounded-lg border border-white/5">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400"/>
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 border-t border-white/10 bg-[#111] shrink-0">
          <div className="flex gap-2 md:gap-3">
            {isSupported && (
              <button 
                onClick={startListening}
                className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all border ${
                  isListening 
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.4)]' 
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-cyan-400 border-white/10 hover:border-cyan-500/50'
                }`}
              >
                <Mic size={18}/>
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
              placeholder="Write a hook about Brooklyn nights..."
              className="flex-1 bg-[#1a1a1a] text-white px-4 py-2 md:py-3 rounded-lg text-sm md:text-base border border-white/10 focus:border-cyan-500/50 focus:outline-none placeholder-gray-500 transition-colors"
            />
            <button 
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
              className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg font-bold tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all"
            >
              {loading ? 'WRITING...' : 'GENERATE'}
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-600 font-mono">{canUse ? `${limit - (parseInt(localStorage.getItem('aiAgentUsage_ghostwriter') || '0'))} FREE USES LEFT` : 'LIMIT REACHED'}</span>
          </div>
        </div>
      </div>
    </AgentContainer>
  );
};

// 11. RAP BATTLE
const RapBattle = () => {
  const [history, setHistory] = useState([
    { sender: 'ai', text: "Yo, step up to the mic if you think you're raw / I'll chew you up and spit you out, that's the law." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const endRef = useRef(null);
  const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_battle', 3);
  const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
    setInput(prev => prev ? prev + ' ' + transcript : transcript);
  });
  const { speak, stop, isSpeaking, isSupported: speechSupported } = useSpeechSynthesis();


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleBattle = async () => {
    if (!input.trim()) return;

    // Cooldown check
    const cooldownTime = 3000; // 3 seconds
    const now = Date.now();
    if (now - lastRequestTime.current < cooldownTime) {
        alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds before spitting another bar.`);
        return;
    }

    if (!canUse) {
      setHistory(prev => [...prev, { sender: 'ai', text: `FREE LIMIT REACHED: ${limit} free Rap Battle turns used.` }]);
      return;
    }
    consume();
    
    const userBar = { sender: 'user', text: input };
    setHistory(prev => [...prev, userBar]);
    setInput("");
    setLoading(true);

    const systemPrompt = "You are a fierce battle rapper from 2004 Brooklyn. The user is your opponent. Respond to their bar with a 2-4 line diss track verse. Be aggressive, witty, use NYC slang, and make it rhyme. Keep it under 200 characters.";
    const responseText = await callGemini(`Opponent says: "${input}". Respond with a diss.`, systemPrompt);
    
    lastRequestTime.current = Date.now();
    setHistory(prev => [...prev, { sender: 'ai', text: responseText }]);
    setLoading(false);
  };

  return (
    <AgentContainer 
      title="CIPHER DOJO" 
      icon={Flame} 
      accentColor="crimson"
      headerExtra={
        <button 
          onClick={() => setShowInfo(true)}
          className="w-7 h-7 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all flex items-center justify-center rounded-full border border-white/10"
          title="Info"
        >
          <Info size={14} className="text-white/80"/>
        </button>
      }
    >
      <div className="h-full flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-5 bg-gradient-to-b from-[#111] to-[#0a0a0a]" style={{WebkitOverflowScrolling: 'touch'}}>
          {history.map((turn, i) => (
            <div key={i} className={`flex ${turn.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] relative overflow-hidden rounded-lg ${turn.sender === 'user' 
                ? 'bg-gradient-to-br from-red-600/30 to-red-900/20 border border-red-500/30' 
                : 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10'}`}
                style={{boxShadow: turn.sender === 'user' ? '0 4px 20px rgba(239,68,68,0.2)' : '0 4px 20px rgba(0,0,0,0.3)'}}
              >
                <div className="relative z-10 p-3 md:p-4">
                  <div className={`text-[9px] md:text-[10px] font-bold mb-1.5 tracking-widest ${turn.sender === 'user' ? 'text-red-400' : 'text-white/60'}`}>
                    {turn.sender === 'user' ? '► YOU' : '◄ RIVAL MC'}
                  </div>
                  <div className="text-white font-mono text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{turn.text}</div>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
                <span className="text-red-400 text-xs font-mono tracking-wider">RIVAL WRITING...</span>
              </div>
            </div>
          )}
          <div ref={endRef}></div>
        </div>
        
        {/* Input Area */}
        <div className="p-3 md:p-4 bg-[#111] border-t border-white/10 flex gap-2 md:gap-3 shrink-0">
          <input 
            type="text" value={input} onChange={(e) => setInput(e.target.value)} 
            placeholder="Spit your bars here..." 
            className="flex-1 bg-black/50 border border-white/10 text-white p-3 font-mono text-xs md:text-sm outline-none focus:border-red-500/50 rounded-lg transition-all placeholder:text-white/30" 
            onKeyPress={(e) => e.key === 'Enter' && handleBattle()} 
          />
          {isSupported && (
            <button 
              onClick={startListening} 
              disabled={loading || isListening}
              className={`px-3 md:px-4 rounded-lg border transition-all disabled:opacity-50 ${isListening 
                ? 'bg-red-600 border-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-red-500/50'}`}
              title="Voice input"
            >
              <Mic size={18} className={`md:w-5 md:h-5 ${isListening ? 'text-white' : 'text-white/60'}`}/>
            </button>
          )}
          <button 
            onClick={handleBattle} 
            disabled={loading} 
            className="bg-gradient-to-r from-red-600 to-red-500 text-white px-5 md:px-8 py-3 font-bold tracking-wider hover:from-red-500 hover:to-red-400 transition-all uppercase disabled:opacity-50 active:scale-95 rounded-lg"
          >
            SPIT
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div 
            className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-white/10 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()} 
            style={{WebkitOverflowScrolling: 'touch', boxShadow: '0 20px 60px rgba(239,68,68,0.2)'}}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-red-600 to-red-500">
                  <Flame size={20} className="text-white"/>
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl tracking-wide">CIPHER DOJO</h3>
                  <p className="text-red-400/60 text-xs tracking-widest">BATTLE.EXE</p>
                </div>
              </div>
              <button onClick={() => setShowInfo(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all">
                <X size={16} className="text-white/60"/>
              </button>
            </div>
            <div className="space-y-5 text-gray-100 text-sm leading-relaxed">
              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <h4 className="text-red-400 font-bold mb-2 tracking-wider text-xs uppercase">Tool Description</h4>
                <p className="text-white/80">AI-powered battle rap opponent inspired by 2004 Brooklyn hip-hop culture. Test your lyrical skills against an opponent who responds with aggressive, witty disses.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <h4 className="text-red-400 font-bold mb-2 tracking-wider text-xs uppercase">Features</h4>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Voice-to-text input for natural flow</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Real-time AI responses with NYC slang</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Free tier: 3 battle rounds per session</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </AgentContainer>
  );
};

// 12. CRATE DIGGER
const CrateDigger = () => {
  const [mood, setMood] = useState("");
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_crates', 3);
  const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
    setMood(prev => prev ? prev + ' ' + transcript : transcript);
  });
  const { speak, stop, isSpeaking, isSupported: speechSupported } = useSpeechSynthesis();

  const handleDig = async () => {
    // 🛡️ Validate and sanitize mood input
    if (!mood.trim()) return;
    
    try {
      validateAndSanitizePrompt(mood); // Will throw if injection detected
    } catch (err) {
      alert(`Invalid input: ${err.message}`);
      return;
    }

    // Cooldown check
    const cooldownTime = 3000; // 3 seconds
    const now = Date.now();
    if (now - lastRequestTime.current < cooldownTime) {
        alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds before digging again.`);
        return;
    }

    if (!canUse) {
      setSamples([{ artist: 'SYSTEM', track: `FREE LIMIT REACHED`, year: '', desc: `${limit} free digs used.` }]);
      return;
    }
    consume();

    setLoading(true);
    setSamples([]);
    const systemPrompt = "You are a crate digger. Suggest 3 obscure 70s/80s records based on the user's mood. JSON format: [{ \"artist\": \"\", \"track\": \"\", \"year\": \"\", \"desc\": \"\" }]. No markdown.";
    const responseText = await callGemini(mood, systemPrompt);
    try {
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      setSamples(JSON.parse(cleanText));
    } catch (e) { console.error("Parse error", e); }
    lastRequestTime.current = Date.now();
    setLoading(false);
  };

  return (
    <AgentContainer 
      title="CRATE DIGGER" 
      icon={Disc} 
      accentColor="indigo"
    >
      <div className="h-full flex flex-col">
        <div className="p-3 md:p-6 bg-[#111] border-b border-[#333] shrink-0">
           <h2 className="text-white font-black text-lg md:text-2xl mb-2">FIND THE PERFECT SAMPLE</h2>
           <div className="flex flex-col sm:flex-row gap-2">
             <div className="flex gap-2 flex-1">
               <input type="text" value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Enter a vibe..." className="flex-1 bg-black border border-[#333] text-white p-2 md:p-3 font-mono text-sm md:text-base outline-none focus:border-yellow-600 rounded-lg" onKeyPress={(e) => e.key === 'Enter' && handleDig()} />
               {isSupported && (
                 <button 
                     onClick={startListening} 
                     disabled={loading || isListening}
                     className={`px-2 md:px-3 border border-[#333] rounded-lg ${isListening ? 'bg-yellow-600 animate-pulse' : 'bg-black hover:bg-yellow-900'} text-white transition-colors disabled:opacity-50`}
                     title="Voice input"
                 >
                     <Mic size={16} className="md:w-5 md:h-5"/>
                 </button>
               )}
             </div>
             <button onClick={handleDig} disabled={loading} className="bg-yellow-600 text-black px-6 py-2 md:py-3 font-bold hover:bg-yellow-500 text-sm md:text-base whitespace-nowrap active:scale-95 transition-transform rounded-lg">DIG</button>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0a0a0a]">
           {samples.length === 0 && (
             <div className="text-center text-gray-500 py-12">
               <Disc size={48} className="mx-auto mb-4 text-yellow-500/30" />
               <p className="text-sm font-mono tracking-wide">ENTER A VIBE TO DIG</p>
               <p className="text-xs text-gray-600 mt-2">AI will find obscure 70s/80s samples</p>
             </div>
           )}
           {samples.map((sample, i) => (
             <div key={i} className="flex gap-3 md:gap-4 p-3 md:p-4 border border-[#333] bg-[#111] mb-2 hover:border-yellow-600 rounded-lg transition-colors">
                <div className="flex-1">
                   <div className="text-yellow-600 text-[10px] md:text-xs font-bold mb-1">{sample.year} // {sample.artist}</div>
                   <div className="text-white font-black text-base md:text-xl">{sample.track}</div>
                   <div className="text-gray-400 text-xs md:text-sm mt-1">{sample.desc}</div>
                   {speechSupported && (
                     <button 
                       onClick={() => speak(`${sample.artist}, ${sample.track}, from ${sample.year}. ${sample.desc}`)}
                       className="mt-2 flex items-center gap-1 text-[10px] text-gray-500 hover:text-yellow-400 transition-colors"
                     >
                       <Volume2 size={12}/> HEAR INFO
                     </button>
                   )}
                </div>
             </div>
           ))}
        </div>
      </div>
    </AgentContainer>
  );
};

// 13. A&R SUITE
const ARSuite = () => {
  const [demoText, setDemoText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_ar', 3);
  const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
    setDemoText(prev => prev ? prev + '\n' + transcript : transcript);
  });
  const { speak, stop, isSpeaking, isSupported: speechSupported } = useSpeechSynthesis();

  const handleReview = async () => {
    if (!demoText.trim()) return;
    
    // 🛡️ Validate and sanitize demo text input
    try {
      validateAndSanitizePrompt(demoText); // Will throw if injection detected
    } catch (err) {
      alert(`Invalid input: ${err.message}`);
      return;
    }
    
    // Cooldown check
    const cooldownTime = 3000; // 3 seconds
    const now = Date.now();
    if (now - lastRequestTime.current < cooldownTime) {
        alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds before submitting again.`);
        return;
    }

    if (!canUse) {
      setFeedback({ critique: `FREE LIMIT REACHED: ${limit} free A&R reviews used.`, commercial: 'N/A', street: 'N/A' });
      return;
    }
    consume();

    setLoading(true);
    setFeedback(null); // Clear previous feedback
    const systemPrompt = "You are an A&R. Critique these lyrics. JSON format: { \"critique\": \"\", \"commercial\": 0-10, \"street\": 0-10 }.";
    
    const responseText = await callGemini(demoText, systemPrompt);
    
    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      setFeedback(JSON.parse(cleanJson));
    } catch (e) { 
        console.error("Failed to parse A&R response:", e);
        setFeedback({ critique: "ERROR: Failed to process analysis data.", commercial: 'N/A', street: 'N/A' });
    }
    lastRequestTime.current = Date.now();
    setLoading(false);
  };

  return (
    <AgentContainer 
      title="A&R DASHBOARD" 
      icon={Briefcase} 
      accentColor="gold"
    >
      <div className="h-full flex flex-col md:flex-row">
        {/* Input Panel */}
        <div className="w-full md:w-1/2 p-3 md:p-6 border-b md:border-r md:border-b-0 border-[#333] flex flex-col bg-[#0a0a0a]">
           <textarea className="flex-1 bg-black border border-[#333] text-white p-3 md:p-4 font-mono text-xs md:text-sm resize-none focus:border-blue-500 outline-none mb-2 rounded-lg min-h-[200px]" placeholder="Paste lyrics for A&R review..." value={demoText} onChange={(e) => setDemoText(e.target.value)} />
           <div className="flex gap-2">
             {isSupported && (
               <button 
                   onClick={startListening} 
                   disabled={loading || isListening}
                   className={`px-3 py-2 border border-[#333] rounded-lg ${isListening ? 'bg-blue-600 animate-pulse' : 'bg-black hover:bg-blue-900'} text-white transition-colors disabled:opacity-50 flex items-center gap-2 text-xs`}
               >
                   <Mic size={16}/> {isListening ? 'LISTENING...' : 'VOICE'}
               </button>
             )}
             <button onClick={handleReview} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 md:py-3 font-bold hover:bg-blue-500 uppercase disabled:opacity-50 text-xs md:text-sm active:scale-95 transition-transform rounded-lg">
                {loading ? "ANALYZING RHYMES..." : "SUBMIT FOR REVIEW"}
             </button>
           </div>
        </div>
        
        {/* Results Panel */}
        <div className="w-full md:w-1/2 p-3 md:p-6 bg-[#111] overflow-y-auto">
           {!loading && !feedback && (
             <div className="text-center text-gray-500 py-12">
               <Briefcase size={48} className="mx-auto mb-4 text-blue-500/30" />
               <p className="text-sm font-mono tracking-wide">SUBMIT LYRICS FOR REVIEW</p>
               <p className="text-xs text-gray-600 mt-2">AI A&R will score your commercial and street appeal</p>
             </div>
           )}
           {loading && (
               <div className="text-blue-500 animate-pulse text-base md:text-xl font-mono flex flex-col items-center py-10">
                   <RefreshCw size={24} className="md:w-8 md:h-8 mb-4 animate-spin"/>
                   A&R IS PROCESSING...
               </div>
           )}
           {feedback && (
             <div className="space-y-4 md:space-y-6">
               <div className="flex gap-3 md:gap-4 text-center">
                 <div className="flex-1 bg-black border border-blue-600 p-3 md:p-4 rounded-lg"><div className="text-[10px] md:text-xs text-gray-500">RADIO</div><div className="text-2xl md:text-3xl font-black text-white">{feedback.commercial}/10</div></div>
                 <div className="flex-1 bg-black border border-red-600 p-3 md:p-4 rounded-lg"><div className="text-[10px] md:text-xs text-gray-500">STREETS</div><div className="text-2xl md:text-3xl font-black text-white">{feedback.street}/10</div></div>
               </div>
               <div className="bg-black/50 p-3 md:p-4 border-l-4 border-blue-600 text-xs md:text-sm text-gray-300 rounded-r-lg">
                 {feedback.critique}
                 {speechSupported && (
                   <button 
                     onClick={() => isSpeaking ? stop() : speak(feedback.critique)}
                     className={`mt-2 flex items-center gap-1 text-[10px] transition-colors ${isSpeaking ? 'text-blue-400' : 'text-gray-500 hover:text-blue-400'}`}
                   >
                     {isSpeaking ? <VolumeX size={12}/> : <Volume2 size={12}/>} {isSpeaking ? 'STOP' : 'HEAR FEEDBACK'}
                   </button>
                 )}
               </div>
             </div>
           )}
        </div>
      </div>
    </AgentContainer>
  );
};

// 15. NEW FEATURE: ALBUM ART GENERATOR (Future Cyber Look)
const AlbumArtGenerator = ({ user, onAuthRequest }) => {
    const [prompt, setPrompt] = useState("A gritty, neon-lit cyberpunk street corner in Red Hook, Brooklyn with a vinyl record.");
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [format, setFormat] = useState('square');
    const lastRequestTime = useRef(0);
    const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_albumart', 3);
    const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
      setPrompt(prev => prev ? prev + ' ' + transcript : transcript);
    });

    const formats = [
      { id: 'square', name: 'ALBUM COVER', icon: '💿', size: '1:1', desc: 'Spotify, Apple Music' },
      { id: 'youtube', name: 'YT THUMBNAIL', icon: '▶️', size: '16:9', desc: 'YouTube, Vimeo' },
      { id: 'story', name: 'STORY/REEL', icon: '📱', size: '9:16', desc: 'IG Stories, TikTok' },
      { id: 'banner', name: 'BANNER', icon: '🖼️', size: '3:1', desc: 'Twitter/X Header' }
    ];
    
    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setImageUrl(null);
        
        // Cooldown check
        const cooldownTime = 3000; // 3 seconds
        const now = Date.now();
        if (now - lastRequestTime.current < cooldownTime) {
            alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds before generating again.`);
            setLoading(false);
            return;
        }

        if (!canUse) {
          alert(`FREE LIMIT REACHED: ${limit} free Album Art generations used.`);
          setLoading(false);
          return;
        }
        consume();
        
        // Pass "Album Cover" in the prompt to trigger the image generation path in callGemini
        const fullPrompt = "Album Cover: " + prompt; 
        
        const resultString = await callGemini(fullPrompt, "", false);

        try {
            const result = JSON.parse(resultString);
            const base64Data = result.predictions?.[0]?.bytesBase64Encoded;
            
            if (base64Data) {
                const url = `data:image/png;base64,${base64Data}`;
                setImageUrl(url);
            } else {
                 console.error("Image generation failed:", result.error || resultString);
                 // Fallback image using the mock base64 data to avoid crash
                 const mockImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                 setImageUrl(`data:image/png;base64,${mockImageBase64}`);
            }
        } catch (e) {
            console.error("Failed to parse image response:", e);
            setImageUrl(null);
             // Use fallback image if parsing fails
            const mockImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
            setImageUrl(`data:image/png;base64,${mockImageBase64}`);
        }
        lastRequestTime.current = Date.now();
        setLoading(false);
    };

    const handleSave = async () => {
      if (!imageUrl) return;
      
      setSaving(true);
      try {
        const result = await saveToLibrary(user, 'album_art', imageUrl, { 
          prompt,
          generatedAt: new Date().toISOString()
        });
        
        if (result === 'auth_required') {
          onAuthRequest();
        } else if (result) {
          alert('✓ Saved to your library!');
        }
      } catch (error) {
        alert('Save failed: ' + error.message);
      } finally {
        setSaving(false);
      }
    };

    return (
        <AgentContainer 
          title="ALBUM ART GENERATOR" 
          icon={Camera} 
          accentColor="cyan"
        >
          <div className="h-full flex flex-col">
            <div className="p-3 md:p-6 bg-[#111] border-b border-[#333] shrink-0">
                <h2 className="text-white font-black text-sm md:text-xl mb-2">GENERATE COVER ART</h2>
                
                {/* Format Selector */}
                <div className="mb-3">
                  <label className="text-[10px] text-gray-500 font-mono mb-1 block">FORMAT</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {formats.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                          format === f.id 
                            ? 'bg-gradient-to-r from-pink-600 to-fuchsia-500 text-white shadow-lg shadow-pink-500/30' 
                            : 'bg-black/50 text-gray-400 border border-pink-500/20 hover:border-pink-500/50'
                        }`}
                      >
                        <span>{f.icon}</span>
                        <span>{f.name}</span>
                        <span className="text-[8px] opacity-60">({f.size})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2 flex-1">
                      <input 
                          type="text" 
                          value={prompt} 
                          onChange={(e) => setPrompt(e.target.value)} 
                          placeholder="Describe your album cover..." 
                          className="flex-1 bg-black border border-[#333] text-white p-2 md:p-3 text-xs md:text-sm font-mono outline-none focus:border-pink-500 rounded-lg" 
                          onKeyPress={(e) => e.key === 'Enter' && handleGenerate()} 
                      />
                      {isSupported && (
                        <button 
                            onClick={startListening} 
                            disabled={loading || isListening}
                            className={`px-2 md:px-3 py-2 border border-[#333] rounded-lg ${isListening ? 'bg-pink-600 animate-pulse' : 'bg-black hover:bg-pink-900'} text-white transition-colors disabled:opacity-50`}
                            title="Voice input"
                        >
                            <Mic size={16} className="md:w-5 md:h-5"/>
                        </button>
                      )}
                    </div>
                    <button 
                        onClick={handleGenerate} 
                        disabled={loading} 
                        className="bg-pink-600 text-white px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold hover:bg-pink-500 uppercase disabled:opacity-50 active:scale-95 transition-transform rounded-lg"
                    >
                        {loading ? "PROCESSING..." : "GENERATE"}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0a0a0a] flex items-center justify-center" style={{WebkitOverflowScrolling: 'touch'}}>
                {loading && (
                    <div className="text-pink-500 animate-pulse text-sm md:text-xl font-mono flex flex-col items-center">
                        <RefreshCw size={24} className="md:w-8 md:h-8 mb-4 animate-spin"/>
                        <span className="text-xs md:text-base">SCANNING THE GRID FOR IMAGES...</span>
                    </div>
                )}
                {imageUrl && !loading && (
                    <div className="w-full max-w-[280px] sm:max-w-xs md:max-w-md aspect-square border-2 md:border-4 border-white shadow-[0_0_20px_rgba(236,72,153,0.5)] relative rounded-lg overflow-hidden">
                        <img src={imageUrl} alt="Generated Album Art" className="w-full h-full object-cover"/>
                        <div className="absolute top-1 md:top-2 left-1 md:left-2 bg-black/70 text-white text-[9px] md:text-[10px] font-mono px-1 md:px-2 py-0.5 md:py-1 rounded">RESULT: {prompt.substring(0, 20)}...</div>
                        <div className="absolute bottom-1 md:bottom-2 right-1 md:right-2 flex gap-1 md:gap-2">
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-cyan-600 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 hover:bg-cyan-500 transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-1 rounded"
                            title="Save to library"
                          >
                            <Heart size={10} className="md:w-3 md:h-3"/> {saving ? 'SAVING...' : 'SAVE'}
                          </button>
                          <a 
                            href={imageUrl} 
                            download={`album-art-${Date.now()}.png`}
                            className="bg-[#00ff41] text-black text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 hover:bg-white transition-colors active:scale-95 inline-block rounded"
                          >
                            DOWNLOAD
                          </a>
                        </div>
                    </div>
                )}
                {!imageUrl && !loading && (
                    <div className="text-gray-600 text-center font-mono text-xs md:text-sm">
                        <Camera size={32} className="md:w-12 md:h-12 mx-auto mb-4 text-pink-500/30"/>
                        AWAITING ART GENERATION REQUEST.
                    </div>
                )}
            </div>
          </div>
        </AgentContainer>
    );
};

// 18. NEW FEATURE: SOCIAL MEDIA MUSIC VIDEO AI AGENT
const ViralVideoAgent = ({ user, onAuthRequest }) => {
    const [trackIdea, setTrackIdea] = useState("");
    const [concepts, setConcepts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [platform, setPlatform] = useState('all');
    const lastRequestTime = useRef(0);
    const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_viral', 3);
    const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
      setTrackIdea(prev => prev ? prev + ' ' + transcript : transcript);
    });
    const { speak, stop, isSpeaking, isSupported: speechSupported } = useSpeechSynthesis();

    const platforms = [
      { id: 'all', name: 'ALL PLATFORMS', icon: '🌐', color: 'from-violet-500 to-fuchsia-500' },
      { id: 'tiktok', name: 'TIKTOK', icon: '🎵', color: 'from-cyan-400 to-pink-500' },
      { id: 'reels', name: 'IG REELS', icon: '📸', color: 'from-purple-500 to-pink-500' },
      { id: 'shorts', name: 'YT SHORTS', icon: '▶️', color: 'from-red-500 to-red-600' },
      { id: 'twitter', name: 'X/TWITTER', icon: '𝕏', color: 'from-gray-600 to-gray-800' }
    ];

    const handleGenerate = async () => {
      if (!trackIdea.trim()) return;
      
      const cooldownTime = 3000;
      const now = Date.now();
      if (now - lastRequestTime.current < cooldownTime) {
        alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds.`);
        return;
      }

      if (!canUse) {
        setConcepts([{ concept: 'LIMIT REACHED', visual: `${limit} free uses consumed.`, trend: 'N/A', shots: [], platform: 'SYSTEM' }]);
        return;
      }
      consume();

      setLoading(true);
      setConcepts([]);
      
      const platformContext = platform === 'all' 
        ? 'optimized for TikTok, Instagram Reels, and YouTube Shorts' 
        : `specifically optimized for ${platforms.find(p => p.id === platform)?.name}`;
      
      const systemPrompt = `You are a viral video director specializing in short-form content ${platformContext}. Create 3 music video concepts with platform-specific trends and formats. JSON format: [{ concept: string, visual: string, trend: string, shots: string[], platform: string, duration: string, hook: string }]. No markdown.`;
      const responseText = await callGemini(trackIdea, systemPrompt);
      
      try {
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        setConcepts(JSON.parse(cleanText));
      } catch (e) { 
        console.error("Parse error", e);
        setConcepts([{ concept: 'PARSE ERROR', visual: 'Could not parse response', trend: 'N/A', shots: [] }]);
      }
      lastRequestTime.current = Date.now();
      setLoading(false);
    };

    return (
      <AgentContainer 
        title="VIRAL VIDEO AGENT" 
        icon={Video} 
        accentColor="coral"
      >
        <div className="h-full flex flex-col">
          <div className="p-3 md:p-6 bg-[#111] border-b border-[#333] shrink-0">
            <h2 className="text-white font-black text-sm md:text-xl mb-2">GENERATE VIDEO CONCEPTS</h2>
            
            {/* Platform Selector */}
            <div className="mb-3">
              <label className="text-[10px] text-gray-500 font-mono mb-1 block">TARGET PLATFORM</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {platforms.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                      platform === p.id 
                        ? `bg-gradient-to-r ${p.color} text-white shadow-lg` 
                        : 'bg-black/50 text-gray-400 border border-violet-500/20 hover:border-violet-500/50'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 flex-1">
                <input 
                    type="text" 
                    value={trackIdea} 
                    onChange={(e) => setTrackIdea(e.target.value)} 
                    placeholder="Describe your track or concept..." 
                    className="flex-1 bg-black border border-[#333] text-white p-2 md:p-3 text-xs md:text-sm font-mono outline-none focus:border-violet-500 rounded-lg" 
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerate()} 
                />
                {isSupported && (
                  <button 
                      onClick={startListening} 
                      disabled={loading || isListening}
                      className={`px-2 md:px-3 py-2 border border-[#333] rounded-lg ${isListening ? 'bg-violet-600 animate-pulse' : 'bg-black hover:bg-violet-900'} text-white transition-colors disabled:opacity-50`}
                      title="Voice input"
                  >
                      <Mic size={16} className="md:w-5 md:h-5"/>
                  </button>
                )}
              </div>
              <button 
                  onClick={handleGenerate} 
                  disabled={loading} 
                  className="bg-violet-600 text-white px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold hover:bg-violet-500 uppercase disabled:opacity-50 active:scale-95 transition-transform rounded-lg"
              >
                  {loading ? "GENERATING..." : "GENERATE"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0a0a0a]">
            {concepts.length === 0 && !loading && (
              <div className="text-center text-gray-500 py-12">
                <Video size={48} className="mx-auto mb-4 text-violet-500/30" />
                <p className="text-sm font-mono tracking-wide">ENTER TRACK IDEA</p>
                <p className="text-xs text-gray-600 mt-2">AI will generate viral video concepts</p>
              </div>
            )}
            {loading && (
              <div className="text-violet-500 animate-pulse text-sm md:text-xl font-mono flex flex-col items-center py-10">
                <RefreshCw size={24} className="md:w-8 md:h-8 mb-4 animate-spin"/>
                GENERATING CONCEPTS...
              </div>
            )}
            {concepts.map((concept, i) => (
              <div key={i} className="p-4 border border-[#333] bg-[#111] mb-3 rounded-lg hover:border-violet-600 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-violet-400 text-[10px] md:text-xs font-bold">CONCEPT #{i + 1} // {concept.trend}</div>
                  <div className="flex items-center gap-2">
                    {speechSupported && (
                      <button 
                        onClick={() => speak(`${concept.concept}. ${concept.visual}`)}
                        className="text-[9px] text-gray-500 hover:text-violet-400 transition-colors"
                      >
                        <Volume2 size={12}/>
                      </button>
                    )}
                    {concept.platform && <span className="text-[9px] bg-violet-600/30 text-violet-300 px-2 py-0.5 rounded">{concept.platform}</span>}
                    {concept.duration && <span className="text-[9px] bg-fuchsia-600/30 text-fuchsia-300 px-2 py-0.5 rounded">⏱️ {concept.duration}</span>}
                  </div>
                </div>
                <div className="text-white font-black text-base md:text-xl mb-2">{concept.concept}</div>
                {concept.hook && (
                  <div className="text-fuchsia-400 text-xs italic mb-2 border-l-2 border-fuchsia-500 pl-2">"Hook: {concept.hook}"</div>
                )}
                <div className="text-gray-400 text-xs md:text-sm">{concept.visual}</div>
                {concept.shots && concept.shots.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {concept.shots.map((shot, j) => (
                      <span key={j} className="text-[10px] bg-violet-600/20 text-violet-300 px-2 py-1 rounded">{shot}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </AgentContainer>
    );
};

// 19. TREND HUNTER - SOCIAL INTELLIGENCE AI AGENT
const TrendHunter = () => {
  const [hashtag, setHashtag] = useState("");
  const [platform, setPlatform] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('views');
  const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_trendhunter', 5);
  const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
    setHashtag(prev => prev ? prev + ' ' + transcript.replace('#', '') : transcript.replace('#', ''));
  });
  const { speak, stop, isSpeaking, isSupported: speechSupported } = useSpeechSynthesis();

  const platforms = [
    { id: 'all', name: 'ALL PLATFORMS', icon: '🌐' },
    { id: 'twitter', name: 'TWITTER/X', icon: '🐦' },
    { id: 'instagram', name: 'INSTAGRAM', icon: '📸' },
    { id: 'tiktok', name: 'TIKTOK', icon: '🎵' },
    { id: 'reddit', name: 'REDDIT', icon: '🤖' }
  ];

  const handleSearch = async () => {
    if (!hashtag.trim()) return;

    const cooldownTime = 5000;
    const now = Date.now();
    if (now - lastRequestTime.current < cooldownTime) {
      alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds.`);
      return;
    }

    if (!canUse) {
      setResults([{ 
        platform: 'SYSTEM', 
        username: 'LIMIT_REACHED', 
        text: `FREE LIMIT: ${limit} searches used. Agent requires cooldown.`,
        views: 0,
        engagement: 0,
        trending: false
      }]);
      return;
    }

    consume();
    setLoading(true);
    setResults([]);
    lastRequestTime.current = now;

    const platformText = platform === 'all' ? 'Twitter, Instagram, TikTok, and Reddit' : platforms.find(p => p.id === platform)?.name;
    
    const query = `Find and analyze the top 15 most ${sortBy === 'views' ? 'viewed' : sortBy === 'engagement' ? 'engaging' : 'recent'} posts with hashtag #${hashtag} on ${platformText}. Include post content, platform, username, view count, likes, comments, shares, and trending status. Return realistic social media data.`;
    
    const systemPrompt = `You are Trend Hunter, a social media intelligence AI. Return JSON array of social posts: [{ platform: string, username: string, text: string, views: number, likes: number, comments: number, shares: number, timestamp: string, trending: boolean, engagementRate: number }]. Make data realistic for ${new Date().getFullYear()}. Do not use markdown formatting.`;

    try {
      const response = await callGemini(query, systemPrompt, true);
      let parsed = [];
      
      try {
        const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleanedResponse);
      } catch (e) {
        parsed = [{
          platform: platform === 'all' ? 'MULTI-PLATFORM' : platformText,
          username: 'trending_user',
          text: `Top posts for #${hashtag} are showing strong engagement across ${platformText}. Content is trending with viral potential.`,
          views: Math.floor(Math.random() * 500000) + 100000,
          likes: Math.floor(Math.random() * 50000) + 10000,
          comments: Math.floor(Math.random() * 5000) + 1000,
          shares: Math.floor(Math.random() * 10000) + 2000,
          timestamp: 'Just now',
          trending: true,
          engagementRate: (Math.random() * 10 + 5).toFixed(1)
        }];
      }

      setResults(parsed);
    } catch (error) {
      console.error('Trend search failed:', error);
      setResults([{
        platform: 'ERROR',
        username: 'SYSTEM',
        text: 'Connection failed. Agent offline.',
        views: 0,
        engagement: 0,
        trending: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgentContainer 
      title="TREND HUNTER" 
      icon={TrendingUp} 
      accentColor="ultraviolet"
      headerExtra={
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="hidden sm:inline">SCANNING</span>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        {/* Search Interface */}
        <div className="p-3 md:p-6 bg-[#111] border-b border-violet-500/30 shrink-0">
          <h2 className="text-white font-black text-sm md:text-xl mb-3">REAL-TIME HASHTAG INTELLIGENCE</h2>
          
          {/* Hashtag Input */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-black border border-violet-500/50 focus-within:border-violet-400 transition-colors rounded-lg">
                <span className="px-3 text-violet-400 font-bold text-lg">#</span>
                <input 
                  type="text" 
                  value={hashtag} 
                  onChange={(e) => setHashtag(e.target.value.replace('#', ''))} 
                  placeholder="enter hashtag..." 
                  className="flex-1 bg-transparent text-white p-2 md:p-3 text-xs md:text-sm font-mono outline-none focus:outline-none" 
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
                />
                {isSupported && (
                  <button 
                      onClick={startListening} 
                      disabled={loading || isListening}
                      className={`px-2 md:px-3 ${isListening ? 'bg-violet-600 animate-pulse' : 'hover:bg-violet-900/50'} text-white transition-colors disabled:opacity-50`}
                      title="Voice input"
                  >
                      <Mic size={16} className="md:w-5 md:h-5"/>
                  </button>
                )}
              </div>
              <button 
                onClick={handleSearch} 
                disabled={loading || !hashtag.trim()} 
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 md:px-8 py-2 md:py-3 text-xs md:text-sm font-bold hover:from-violet-500 hover:to-fuchsia-500 uppercase disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all rounded-lg"
              >
                {loading ? "SCANNING..." : "ANALYZE"}
              </button>
            </div>

            {/* Platform & Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-gray-500 font-mono">PLATFORM:</span>
                {platforms.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`px-2 py-1 text-[10px] font-mono border rounded transition-all cursor-pointer ${
                      platform === p.id 
                        ? 'bg-violet-600 border-violet-400 text-white' 
                        : 'bg-black border-violet-500/30 text-gray-400 hover:border-violet-500/50'
                    }`}
                  >
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-mono">SORT:</span>
                {['views', 'engagement', 'recent'].map(sort => (
                  <button 
                    key={sort}
                    onClick={() => setSortBy(sort)}
                    className={`px-2 py-1 text-[10px] font-mono uppercase border rounded transition-all cursor-pointer ${
                      sortBy === sort 
                        ? 'bg-fuchsia-600 border-fuchsia-400 text-white' 
                        : 'bg-black border-fuchsia-500/30 text-gray-400 hover:border-fuchsia-500/50'
                    }`}
                  >
                    {sort}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0a0a0a]" style={{WebkitOverflowScrolling: 'touch'}}>
          {loading && (
            <div className="text-violet-400 animate-pulse text-sm md:text-xl font-mono flex flex-col items-center justify-center py-12">
              <RefreshCw size={32} className="md:w-12 md:h-12 mb-4 animate-spin"/>
              <span className="text-xs md:text-base">SCRAPING SOCIAL MEDIA...</span>
              <span className="text-[10px] text-gray-500 mt-2">ANALYZING #{hashtag}</span>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-gray-600 text-center font-mono text-xs md:text-sm flex flex-col items-center justify-center py-12">
              <TrendingUp size={48} className="md:w-16 md:h-16 mx-auto mb-4 text-violet-500/30"/>
              <span className="text-lg font-bold text-white mb-2">AGENT READY</span>
              <span>Enter a hashtag to analyze trending content.</span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-violet-500/30">
                <h3 className="text-violet-400 font-bold text-sm md:text-lg">
                  #{hashtag} ({results.length} POSTS)
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  LIVE DATA
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.map((post, index) => (
                  <div 
                    key={`${post.platform}-${index}`}
                    className="relative group bg-gradient-to-br from-white/5 to-white/0 border border-violet-500/20 rounded-lg p-4 hover:border-violet-400/50 transition-all"
                  >
                    {post.trending && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[8px] font-bold px-2 py-1 rounded flex items-center gap-1">
                        🔥 TRENDING
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-white text-sm">
                        {post.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm truncate">@{post.username}</div>
                        <div className="text-[10px] text-violet-400 font-mono uppercase">{post.platform}</div>
                      </div>
                    </div>

                    <p className="text-gray-300 text-xs leading-relaxed mb-3 line-clamp-3">{post.text}</p>

                    {speechSupported && (
                      <button 
                        onClick={() => speak(`${post.username} on ${post.platform} says: ${post.text}`)}
                        className="mb-2 flex items-center gap-1 text-[10px] text-gray-500 hover:text-violet-400 transition-colors"
                      >
                        <Volume2 size={12}/> HEAR POST
                      </button>
                    )}

                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/10">
                      <div className="text-center">
                        <div className="text-white font-bold text-xs">{post.views?.toLocaleString() || 0}</div>
                        <div className="text-[8px] text-gray-500">VIEWS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-xs">{post.likes?.toLocaleString() || 0}</div>
                        <div className="text-[8px] text-gray-500">LIKES</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-xs">{post.comments?.toLocaleString() || 0}</div>
                        <div className="text-[8px] text-gray-500">COMMENTS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-xs">{post.shares?.toLocaleString() || 0}</div>
                        <div className="text-[8px] text-gray-500">SHARES</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentContainer>
  );
};

// 16. STUDIO HUB - 2026 ULTRA-MODERN NEURAL INTERFACE
// Now includes persistent sidebar that stays visible when viewing individual agents
const StudioHub = ({ setSection, user, onAuthRequest, initialAgent = null }) => {
  // Track which agent is selected - null means show the main grid
  const [selectedAgent, setSelectedAgent] = useState(initialAgent);
  // Model selection state
  const [currentModel, setCurrentModel] = useState(getSelectedModel());
  const [showModelSelector, setShowModelSelector] = useState(false);
  // Landing page view state
  const [showLanding, setShowLanding] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState(null);
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedPath, setSelectedPath] = useState(null);

  // Update global model when local state changes
  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    setCurrentModel(modelId);
    setShowModelSelector(false);
  };

  // Helper to select an agent (internal navigation, sidebar persists)
  const selectAgent = (agentId) => {
    setSelectedAgent(agentId);
    setShowLanding(false);
    setShowOnboarding(false);
  };

  // Helper to go back to the main grid
  const backToGrid = () => {
    setSelectedAgent(null);
  };

  // Helper to enter the studio from landing
  const enterStudio = () => {
    setShowLanding(false);
  };

  // Start onboarding flow
  const startOnboarding = () => {
    setShowOnboarding(true);
    setOnboardingStep(0);
    setSelectedPath(null);
  };

  // Onboarding steps content
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

  // Path options for step 3
  const pathOptions = [
    { id: 'write', label: "I need to write", icon: Feather, description: "Lyrics, hooks, verses, songs", recommended: ['songwriter', 'ghostwriter'] },
    { id: 'produce', label: "I need production help", icon: Disc, description: "Beats, samples, sounds", recommended: ['crates', 'ar_suite'] },
    { id: 'grow', label: "I need to grow my audience", icon: Hash, description: "Content, trends, virality", recommended: ['viral_video', 'trend_hunter'] },
    { id: 'compete', label: "I need to sharpen my skills", icon: Flame, description: "Battle, freestyle, punchlines", recommended: ['battle'] },
    { id: 'brand', label: "I need visual identity", icon: ImageIcon, description: "Album art, aesthetics", recommended: ['album_art'] },
    { id: 'explore', label: "I just want to explore", icon: Sparkles, description: "Show me everything", recommended: null }
  ];

  // Get recommendation based on selected path
  const getRecommendation = () => {
    if (!selectedPath) return null;
    const path = pathOptions.find(p => p.id === selectedPath);
    if (!path || !path.recommended) return null;
    return path.recommended[0]; // Primary recommendation
  };

  // Agent data with full marketing descriptions
  const agentDetails = {
    ghostwriter: {
      title: "LYRIC RECOVERY",
      subtitle: "Voice-to-Verse Technology",
      tagline: "Finish what you started.",
      description: "In the early 2000s, countless verses were lost to crashed hard drives, stolen notebooks, and fading memories. The Lyric Recovery tool was built to resurrect that energy—to help artists who have melodies without words, hooks without verses, ideas without execution. Speak your concept, hum your flow, or type your fragments. The AI completes your thought while preserving your voice. This isn't about replacing creativity—it's about unlocking what's already inside you. Perfect for artists who know what they want to say but can't find the words, or those who need a writing partner at 3 AM when no one else is awake.",
      whoFor: "Artists with unfinished ideas, vocalists who think in melodies, writers fighting creative blocks.",
      howTo: "Speak or type your concept. The AI analyzes your style and generates completions that match your voice."
    },
    songwriter: {
      title: "SONGWRITER'S STUDIO",
      subtitle: "The 24/7 Writing Room",
      tagline: "Your permanent seat at the table.",
      description: "Before streaming, before social media, the writing room was sacred. Artists would camp out for days, trading verses, building chemistry, creating magic. But those rooms were gatekept—you needed connections, co-signs, or contracts to get inside. The Songwriter's Studio democratizes that experience. It's an AI writing partner trained on decades of song structure, rhyme schemes, and storytelling techniques. Feed it a concept, a mood, a title—and it generates hooks, verses, bridges, and full songs. Use it as a starting point, a sounding board, or a creative sparring partner. The room is always open. The seat is always yours.",
      whoFor: "Independent artists without writing teams, producers seeking toplines, anyone building their catalog.",
      howTo: "Choose a format (hook, verse, full song). Provide your concept. Refine until it feels like you wrote it."
    },
    battle: {
      title: "CIPHER DOJO",
      subtitle: "The Practice Ring",
      tagline: "Sharpen your sword without drawing blood.",
      description: "Battle rap built careers. From Harlem to Detroit, from URL to KOTD, the ability to freestyle and battle separated legends from pretenders. But practicing battle rap is hard—you need opponents, you need pressure, you need someone willing to take your best shot. The Cipher Dojo is that opponent. An AI trained on punchlines, flips, and the ruthless wit of NYC street battles. It won't go easy on you. It learns your style, finds your weaknesses, and forces you to level up. No egos. No beef. Just pure skill development. Step into the dojo when you want to sharpen your sword—step out when you're ready for the real thing.",
      whoFor: "Battle rappers preparing for competition, freestylers building their arsenal, anyone who wants quicker wit.",
      howTo: "Choose your intensity level. The AI throws bars. You respond. It adapts to your style and pushes your limits."
    },
    ar_suite: {
      title: "A&R DASHBOARD",
      subtitle: "Industry Intelligence System",
      tagline: "See your music through their eyes.",
      description: "A&R executives decide careers. They listen to hundreds of songs daily, looking for that undefinable 'it factor' that separates a demo from a deal. The A&R Dashboard gives you access to that perspective before you submit. Upload your track and receive analysis on commercial viability, production quality, market positioning, and competitive landscape. Understand how your music stacks up against current releases. Identify your unique selling points and potential weaknesses. This isn't about changing your art to fit the market—it's about understanding the market so you can navigate it strategically. Know what you're walking into before you walk in.",
      whoFor: "Artists preparing for label meetings, independent releases seeking market fit, managers evaluating talent.",
      howTo: "Describe your track or upload details. Receive a comprehensive analysis with actionable insights."
    },
    crates: {
      title: "CRATE DIGGER",
      subtitle: "Sample Discovery Engine",
      tagline: "Find the sounds they haven't found yet.",
      description: "Every classic hip-hop beat started with a discovery—a forgotten soul record, an obscure jazz session, a B-side that became a foundation. Crate digging was an art form, requiring patience, knowledge, and intuition. The Crate Digger brings that experience digital. Tell it what you're looking for—a mood, an era, a genre, a feeling—and it surfaces samples you've never heard. Get BPM, key information, and historical context. Understand the story behind the sound before you flip it. This tool doesn't replace the hunt; it expands your crates beyond what any physical collection could offer. The deepest cuts are always waiting to be found.",
      whoFor: "Producers seeking sample inspiration, beatmakers exploring new genres, DJs building setlists.",
      howTo: "Describe the vibe you're chasing. Receive curated sample suggestions with context and technical details."
    },
    album_art: {
      title: "ALBUM ART GENERATOR",
      subtitle: "Visual Identity System",
      tagline: "See what your sound looks like.",
      description: "The cover is the first impression. Before anyone presses play, they see your visual identity—and they make assumptions. Does the art match the music? Does it communicate who you are? In the era of thumbnail scrolling, your album art works overtime. The Album Art Generator transforms your concepts into visual directions. Describe your project's mood, themes, and aesthetic references. Receive AI-generated concepts that capture your vision. Use them as inspiration for final artwork, or as communication tools when briefing designers. Your music has a look—this tool helps you find it before you finalize it.",
      whoFor: "Artists developing visual identity, designers seeking inspiration, anyone releasing music.",
      howTo: "Describe your project's themes, mood, and visual references. Generate concepts to guide your final artwork."
    },
    viral_video: {
      title: "VIRAL VIDEO AGENT",
      subtitle: "Content Strategy System",
      tagline: "Break through the noise.",
      description: "The algorithm decides who gets heard. TikTok, Reels, Shorts—these platforms launched more careers than radio ever did, but their rules are opaque and constantly changing. The Viral Video Agent decodes the content game. Input your song, your aesthetic, your goals—and receive video concepts optimized for engagement. Understand hook placement, visual trends, caption strategies, and posting timing. This isn't about gaming the system; it's about understanding it well enough to work within it authentically. Your music deserves to be heard. The Viral Video Agent helps you package it for the platforms that matter.",
      whoFor: "Artists building social presence, content creators seeking concepts, anyone trying to grow organically.",
      howTo: "Share your track and goals. Receive video concepts with hooks, visual suggestions, and strategic timing."
    },
    trend_hunter: {
      title: "TREND HUNTER",
      subtitle: "Real-Time Intelligence",
      tagline: "Don't chase trends. Understand them.",
      description: "By the time you see a trend on your timeline, it's already too late to ride it. The artists who catch waves are the ones who see them forming. Trend Hunter provides real-time intelligence on what's moving in music, culture, and social media. Track hashtag velocity, monitor emerging sounds, identify regional breakouts before they go national. Use this data not to copy what's popular, but to understand where attention is flowing—and position your authentic voice in that current. Trend-chasing kills careers. Trend-understanding builds them. Stay informed without losing yourself.",
      whoFor: "Artists planning releases, marketers timing campaigns, anyone who wants to move at the speed of culture.",
      howTo: "Query specific topics or browse broad categories. Receive real-time data with historical context and projections."
    }
  };

  const agents = [
    {
      id: 'ghostwriter',
      title: 'LYRIC RECOVERY TOOL',
      subtitle: 'GHOSTWRITER.EXE',
      icon: Sparkles,
      gradient: 'from-cyan-400 to-cyan-600',
      description: 'AI-powered lyric generation • Voice input • Text-to-speech',
      action: () => selectAgent('ghostwriter')
    },
    {
      id: 'songwriter',
      title: 'SONGWRITER STUDIO',
      subtitle: 'WRITER.EXE',
      icon: Feather,
      gradient: 'from-green-400 to-emerald-600',
      description: 'AI writing partner • Hooks • Verses • Bridges',
      action: () => selectAgent('songwriter')
    },
    {
      id: 'battle',
      title: 'CIPHER DOJO',
      subtitle: 'BATTLE.EXE',
      icon: Flame,
      gradient: 'from-red-400 to-red-600',
      description: 'Battle rap simulator • Real-time AI disses • NYC slang',
      action: () => selectAgent('battle')
    },
    {
      id: 'ar_suite',
      title: 'AR EXPERIENCE SUITE',
      subtitle: 'AR_SUITE.EXE',
      icon: Zap,
      gradient: 'from-blue-400 to-blue-600',
      description: 'Augmented reality concepts • Immersive experiences',
      action: () => selectAgent('ar_suite')
    },
    {
      id: 'crates',
      title: 'CRATE DIGGER',
      subtitle: 'SAMPLES.EXE',
      icon: Disc,
      gradient: 'from-yellow-400 to-yellow-600',
      description: 'Sample discovery • Production inspiration • BPM/Key info',
      action: () => selectAgent('crates')
    },
    {
      id: 'album_art',
      title: 'ALBUM ART GENERATOR',
      subtitle: 'ARTGEN.EXE',
      icon: ImageIcon,
      gradient: 'from-pink-400 to-pink-600',
      description: 'AI album cover concepts • Visual design ideas',
      action: () => selectAgent('album_art')
    },
    {
      id: 'viral_video',
      title: 'VIRAL VIDEO AGENT',
      subtitle: 'VIRAL.EXE',
      icon: Video,
      gradient: 'from-cyan-400 to-cyan-600',
      description: 'TikTok/Reels concepts • Viral content strategy',
      action: () => selectAgent('viral_video')
    },
    {
      id: 'trend_hunter',
      title: 'TREND HUNTER AI',
      subtitle: 'TRENDS.EXE',
      icon: Hash,
      gradient: 'from-violet-400 to-fuchsia-600',
      description: 'Hashtag analysis • Social media intelligence • Real-time trends',
      action: () => selectAgent('trend_hunter')
    }
  ];

  // Render the selected agent component
  const renderAgentContent = () => {
    switch (selectedAgent) {
      case 'ghostwriter':
        return <LyricRecovery />;
      case 'songwriter':
        return <SongwritersStudio />;
      case 'battle':
        return <RapBattle />;
      case 'crates':
        return <CrateDigger />;
      case 'ar_suite':
        return <ARSuite />;
      case 'album_art':
        return <AlbumArtGenerator user={user} onAuthRequest={onAuthRequest} />;
      case 'viral_video':
        return <ViralVideoAgent user={user} onAuthRequest={onAuthRequest} />;
      case 'trend_hunter':
        return <TrendHunter />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full relative flex bg-black" style={{WebkitOverflowScrolling: 'touch'}}>
      {/* LEFT SIDEBAR - AGENT NAVIGATOR - Single Column */}
      <div className="hidden md:flex flex-col w-20 bg-black border-r border-[#333] overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
        <div className="p-3 border-b border-[#333] text-center">
          <h3 className="text-[8px] font-mono font-bold text-[#00ff41] tracking-wider drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]">STUDIO</h3>
        </div>
        <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto">
          {agents.map((agent) => {
            // Extract primary color from gradient for unique styling
            const colorMatch = agent.gradient.match(/from-(\w+)-/);
            const primaryColor = colorMatch ? colorMatch[1] : 'green';
            const colorClasses = {
              cyan: { border: 'border-cyan-500/50', activeBorder: 'border-cyan-400', icon: 'text-cyan-400', glow: 'drop-shadow-[0_0_8px_#00ffff]', shadow: 'shadow-[0_0_15px_rgba(0,255,255,0.2)]', line: 'bg-cyan-400' },
              pink: { border: 'border-pink-500/50', activeBorder: 'border-pink-400', icon: 'text-pink-400', glow: 'drop-shadow-[0_0_8px_#ec4899]', shadow: 'shadow-[0_0_15px_rgba(236,72,153,0.2)]', line: 'bg-pink-400' },
              red: { border: 'border-red-500/50', activeBorder: 'border-red-400', icon: 'text-red-400', glow: 'drop-shadow-[0_0_8px_#ef4444]', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]', line: 'bg-red-400' },
              blue: { border: 'border-blue-500/50', activeBorder: 'border-blue-400', icon: 'text-blue-400', glow: 'drop-shadow-[0_0_8px_#3b82f6]', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]', line: 'bg-blue-400' },
              yellow: { border: 'border-yellow-500/50', activeBorder: 'border-yellow-400', icon: 'text-yellow-400', glow: 'drop-shadow-[0_0_8px_#eab308]', shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]', line: 'bg-yellow-400' },
              violet: { border: 'border-violet-500/50', activeBorder: 'border-violet-400', icon: 'text-violet-400', glow: 'drop-shadow-[0_0_8px_#8b5cf6]', shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]', line: 'bg-violet-400' },
              green: { border: 'border-[#00ff41]/50', activeBorder: 'border-[#00ff41]', icon: 'text-[#00ff41]', glow: 'drop-shadow-[0_0_8px_#00ff41]', shadow: 'shadow-[0_0_15px_rgba(0,255,65,0.2)]', line: 'bg-[#00ff41]' }
            };
            const colors = colorClasses[primaryColor] || colorClasses.green;
            const isActive = selectedAgent === agent.id;
            
            return (
              <button
                key={agent.id}
                onClick={agent.action}
                title={agent.title}
                className={`group w-full aspect-square flex items-center justify-center transition-all duration-300 border rounded-lg bg-black/50 backdrop-blur-sm relative overflow-hidden ${
                  isActive
                    ? `${colors.activeBorder} ${colors.shadow} bg-black/70`
                    : `border-[#333] hover:${colors.border} hover:bg-black/70`
                }`}
              >
                {/* Icon only for compact sidebar */}
                <agent.icon 
                  size={22} 
                  className={`transition-all duration-300 ${isActive ? colors.icon + ' ' + colors.glow : 'text-[#555] group-hover:' + colors.icon}`}
                />
                {/* Left indicator line for active state */}
                <div className={`absolute left-0 inset-y-0 w-[2px] ${colors.line} transition-transform duration-300 origin-center ${isActive ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`}></div>
              </button>
            );
          })}
        </div>
        <div className="p-2 border-t border-[#333] text-center bg-black/50">
          <div className="text-[8px] text-[#00ff41] font-bold animate-pulse">●</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 relative overflow-y-auto bg-black" style={{WebkitOverflowScrolling: 'touch'}}>
        {/* Dark gradient background matching landing page */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#051a05] via-black to-black pointer-events-none"></div>

        {/* LANDING PAGE VIEW */}
        {showLanding && !selectedAgent ? (
          <div className="relative z-10 h-full overflow-y-auto bg-black">
            {/* Hero Section - Clean solid background, no grain */}
            <div className="relative bg-[#050505] border-b border-white/5">
              <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-white/40 mb-4">
                  The Restored Operating System
                </p>
                <h1 className="text-4xl md:text-6xl font-thin text-[#00ff41] tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,65,0.8)] mb-6">
                  THE STUDIO
                </h1>
                <div className="h-[1px] w-24 bg-[#00ff41]/50 mx-auto mb-6"></div>
                <p className="text-white/50 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-8">
                  Eight AI agents built to give independent artists the tools that used to require 
                  a label deal, a budget, and connections. This is where the ARE meets action.
                </p>
                
                <button
                  onClick={enterStudio}
                  className="px-8 py-4 bg-[#00ff41] text-black uppercase tracking-wider rounded hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all text-sm"
                >
                  Enter The Studio
                </button>
              </div>
            </div>

            {/* The Vision Section */}
            <div className="max-w-5xl mx-auto px-4 py-16">
              <div className="mb-16">
                <h2 className="text-xl md:text-2xl text-white mb-6">What Is This?</h2>
                <div className="bg-[#0a0a0a] border-l-2 border-[#00ff41]/30 p-6 mb-8">
                  <p className="text-white/70 text-sm leading-relaxed">
                    In the early 2000s, Whip Montez was on the verge of breaking through. She had the talent, 
                    the collaborations, the momentum—but the industry gatekeepers kept the doors closed. 
                    The resources that could have launched her career were locked behind label deals and 
                    executive relationships. This restored operating system imagines a different reality: 
                    what if those tools had been accessible to everyone?
                  </p>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
                  The Studio is an Alternative Reality Experience—a functioning suite of AI-powered creative 
                  tools wrapped in the aesthetic of a recovered 2004 operating system. These agents aren't 
                  just features. They're a statement: the resources that used to require a deal should be 
                  available to anyone with talent and drive.
                </p>
              </div>

              {/* Agent Showcase - Matching Come Up toolkit styling */}
              <div className="mb-16">
                <h2 className="text-xl md:text-2xl text-white mb-8">The Eight Agents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.map((agent) => {
                    const details = agentDetails[agent.id];
                    const isExpanded = expandedAgent === agent.id;
                    
                    return (
                      <div 
                        key={agent.id}
                        className="bg-black/50 border border-[#00ff41]/30 rounded-lg p-5 cursor-pointer hover:border-[#00ff41] hover:shadow-[0_0_30px_rgba(0,255,65,0.2)] transition-all group"
                        onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                      >
                        {/* Agent Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#00ff41]/10 flex items-center justify-center">
                              <agent.icon size={16} className="text-[#00ff41]/70" />
                            </div>
                            <div>
                              <h4 className="text-white group-hover:text-[#00ff41] transition-colors text-sm">{details?.title || agent.title}</h4>
                              <p className="text-white/40 text-xs">{details?.tagline}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); agent.action(); }}
                            className="px-3 py-1.5 text-[10px] uppercase tracking-wider bg-white/10 text-white rounded hover:bg-[#00ff41] hover:text-black transition-all"
                          >
                            Launch
                          </button>
                        </div>
                        
                        <p className="text-white/50 text-xs leading-relaxed mb-3">
                          {details?.description?.slice(0, 120)}...
                        </p>
                        
                        <p className="text-[#00ff41]/60 text-xs uppercase tracking-wider group-hover:text-[#00ff41] transition-colors">
                          {isExpanded ? 'Less ↑' : 'More ↓'}
                        </p>
                        
                        {/* Expanded Content */}
                        {isExpanded && details && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-white/60 text-xs leading-relaxed mb-4">
                              {details.description}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-[#0a0a0a] p-3 rounded">
                                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Who It's For</p>
                                <p className="text-white/70 text-xs">{details.whoFor}</p>
                              </div>
                              <div className="bg-[#0a0a0a] p-3 rounded">
                                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">How To Use</p>
                                <p className="text-white/70 text-xs">{details.howTo}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Connection to The Come Up - Same styling as toolkit cards */}
              <div className="mb-16">
                <h2 className="text-xl md:text-2xl text-white mb-6">Part of Something Bigger</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setSection('come_up')}
                    className="bg-black/50 border border-[#00ff41]/30 p-5 rounded-lg cursor-pointer hover:border-[#00ff41] hover:shadow-[0_0_30px_rgba(0,255,65,0.2)] transition-all group"
                  >
                    <h4 className="text-white mb-2 group-hover:text-[#00ff41] transition-colors">The Come Up</h4>
                    <p className="text-white/50 text-xs leading-relaxed mb-3">
                      Mentorship content that teaches the four pillars of artist development: 
                      Craft, Business, Mental Health, and Legacy.
                    </p>
                    <p className="text-[#00ff41]/60 text-xs uppercase tracking-wider group-hover:text-[#00ff41] transition-colors">
                      Explore →
                    </p>
                  </div>
                  <div 
                    onClick={() => setSection('about')}
                    className="bg-black/50 border border-[#00ff41]/30 p-5 rounded-lg cursor-pointer hover:border-[#00ff41] hover:shadow-[0_0_30px_rgba(0,255,65,0.2)] transition-all group"
                  >
                    <h4 className="text-white mb-2 group-hover:text-[#00ff41] transition-colors">The Story</h4>
                    <p className="text-white/50 text-xs leading-relaxed mb-3">
                      Learn about Whip Montez—the real artist this experience honors. 
                      Understand the Alternative Reality Experience.
                    </p>
                    <p className="text-[#00ff41]/60 text-xs uppercase tracking-wider group-hover:text-[#00ff41] transition-colors">
                      Read →
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Start - Clean, minimal */}
              <div className="text-center py-12 border-t border-white/5">
                <h2 className="text-lg md:text-xl text-white mb-4">Ready to Create?</h2>
                <p className="text-white/50 text-sm max-w-lg mx-auto mb-8">
                  The Studio agents are free to use. No account required to start.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={enterStudio}
                    className="px-8 py-3 bg-[#00ff41] text-black uppercase tracking-wider rounded hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all text-sm"
                  >
                    Enter The Studio
                  </button>
                  <button
                    onClick={startOnboarding}
                    className="px-8 py-3 bg-white/5 border border-white/10 text-white/70 uppercase tracking-wider rounded hover:bg-white/10 hover:text-white transition-all text-sm"
                  >
                    Learn First
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center py-8 text-white/20 text-[10px] uppercase tracking-widest border-t border-white/5">
                Past & Present // The Studio // Whip Montez
              </div>
            </div>

            {/* Onboarding Modal */}
            {showOnboarding && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="relative w-full max-w-2xl mx-4 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                  {/* Progress bar */}
                  <div className="h-1 bg-white/5">
                    <div 
                      className="h-full bg-[#00ff41] transition-all duration-500"
                      style={{ width: `${((onboardingStep + 1) / onboardingSteps.length) * 100}%` }}
                    />
                  </div>

                  {/* Close button */}
                  <button 
                    onClick={() => setShowOnboarding(false)}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>

                  {/* Step indicator */}
                  <div className="px-6 pt-6 pb-2">
                    <p className="text-[10px] uppercase tracking-widest text-[#00ff41]/60">
                      Step {onboardingStep + 1} of {onboardingSteps.length}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="px-6 pb-6">
                    <h3 className="text-xl md:text-2xl text-white mb-3">
                      {onboardingSteps[onboardingStep].title}
                    </h3>
                    <p className="text-white/70 text-sm mb-4">
                      {onboardingSteps[onboardingStep].content}
                    </p>
                    <p className="text-white/50 text-xs leading-relaxed mb-6">
                      {onboardingSteps[onboardingStep].detail}
                    </p>

                    {/* Path Selection (Step 3) */}
                    {onboardingStep === 2 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                        {pathOptions.map(path => (
                          <button
                            key={path.id}
                            onClick={() => setSelectedPath(path.id)}
                            className={`p-4 rounded-lg border text-left transition-all ${
                              selectedPath === path.id
                                ? 'border-[#00ff41] bg-[#00ff41]/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <path.icon size={20} className={selectedPath === path.id ? 'text-[#00ff41]' : 'text-white/50'} />
                            <p className={`text-xs mt-2 ${selectedPath === path.id ? 'text-white' : 'text-white/70'}`}>
                              {path.label}
                            </p>
                            <p className="text-[10px] text-white/40 mt-1">{path.description}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Recommendation (Step 4) */}
                    {onboardingStep === 3 && selectedPath && (
                      <div className="mb-6">
                        {selectedPath === 'explore' ? (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                            <p className="text-white/70 text-sm mb-3">
                              No specific recommendation—explore freely! Here's a suggested order to get a feel for everything:
                            </p>
                            <ol className="text-white/50 text-xs space-y-2 list-decimal list-inside">
                              <li>Start with <span className="text-[#00ff41]">Songwriter's Studio</span> to see how writing works</li>
                              <li>Try the <span className="text-[#00ff41]">Cipher Dojo</span> for some interactive fun</li>
                              <li>Check <span className="text-[#00ff41]">Trend Hunter</span> to see real-time data</li>
                              <li>Generate some <span className="text-[#00ff41]">Album Art</span> for visual inspiration</li>
                            </ol>
                          </div>
                        ) : (
                          <div className="bg-[#00ff41]/5 border border-[#00ff41]/30 rounded-lg p-5">
                            {(() => {
                              const path = pathOptions.find(p => p.id === selectedPath);
                              const rec = getRecommendation();
                              const agent = rec ? agentDetails[rec] : null;
                              return (
                                <>
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#00ff41]/10 flex items-center justify-center">
                                      <Sparkles size={20} className="text-[#00ff41]" />
                                    </div>
                                    <div>
                                      <p className="text-[#00ff41] text-sm">{agent?.title || rec}</p>
                                      <p className="text-white/40 text-xs">{agent?.tagline}</p>
                                    </div>
                                  </div>
                                  <p className="text-white/60 text-xs leading-relaxed">
                                    {agent?.description?.slice(0, 200)}...
                                  </p>
                                  {path?.recommended?.length > 1 && (
                                    <p className="text-white/40 text-[10px] mt-3">
                                      Also check out: {path.recommended.slice(1).map(r => agentDetails[r]?.title).join(', ')}
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pro Tips (Step 5) */}
                    {onboardingStep === 4 && (
                      <div className="space-y-3 mb-6">
                        {[
                          { tip: "Be specific about style and references", example: "\"Write a hook about loyalty in the style of early Jay-Z\"" },
                          { tip: "Iterate and refine", example: "Generate 3-4 options, then ask the AI to combine the best elements" },
                          { tip: "Use your own words first", example: "Start with a line you've written, then ask for completions" },
                          { tip: "Save what resonates", example: "Copy outputs to your notes immediately—inspiration fades fast" }
                        ].map((item, i) => (
                          <div key={i} className="bg-white/5 border-l-2 border-[#00ff41]/30 p-3">
                            <p className="text-white/70 text-xs">{item.tip}</p>
                            <p className="text-white/40 text-[10px] italic mt-1">{item.example}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="px-6 pb-6 flex justify-between items-center">
                    <button
                      onClick={() => setOnboardingStep(Math.max(0, onboardingStep - 1))}
                      className={`text-xs text-white/50 hover:text-white transition-colors ${onboardingStep === 0 ? 'invisible' : ''}`}
                    >
                      ← Back
                    </button>
                    
                    {onboardingStep < onboardingSteps.length - 1 ? (
                      <button
                        onClick={() => {
                          if (onboardingStep === 2 && !selectedPath) return; // Require path selection
                          setOnboardingStep(onboardingStep + 1);
                        }}
                        disabled={onboardingStep === 2 && !selectedPath}
                        className={`px-6 py-2 text-xs uppercase tracking-wider rounded transition-all ${
                          onboardingStep === 2 && !selectedPath
                            ? 'bg-white/10 text-white/30 cursor-not-allowed'
                            : 'bg-[#00ff41] text-black hover:shadow-[0_0_20px_rgba(0,255,65,0.4)]'
                        }`}
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowOnboarding(false);
                          const rec = getRecommendation();
                          if (rec) {
                            selectAgent(rec);
                          } else {
                            enterStudio();
                          }
                        }}
                        className="px-6 py-2 bg-[#00ff41] text-black text-xs uppercase tracking-wider rounded hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all"
                      >
                        {selectedPath === 'explore' ? 'Enter The Studio' : 'Start Creating'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : selectedAgent ? (
          /* Agent View - renders the selected agent with X button */
          <div className="relative z-10 h-full flex flex-col">
            {/* Consistent header bar with X button */}
            <div className="px-4 py-3 border-b border-[#333] bg-black/80 backdrop-blur-sm flex justify-between items-center">
              <button 
                onClick={backToGrid}
                className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-[#00ff41] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>BACK TO STUDIO</span>
              </button>
              
              {/* Model indicator in agent view */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500">
                  <Cpu size={12} className="text-[#00ff41]"/>
                  <span className="hidden sm:inline">MODEL:</span>
                  <span className="text-[#00ff41]">{AVAILABLE_MODELS.find(m => m.id === currentModel)?.name || 'Default'}</span>
                </div>
                <button 
                  onClick={backToGrid}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer rounded-full border border-white/10"
                  aria-label="Close"
                >
                  <X size={16} className="text-white"/>
                </button>
              </div>
            </div>
            {/* Agent Content */}
            <div className="flex-1 overflow-y-auto">
              {renderAgentContent()}
            </div>
          </div>
        ) : (
          /* Main Grid View */
          <div className="relative z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          {/* Back to Landing Link */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowLanding(true)}
              className="text-xs text-white/40 hover:text-[#00ff41] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              About The Studio
            </button>
          </div>
          
          {/* Header matching landing page style */}
          <div className="text-center mb-12 md:mb-16">
            {/* Model Selector */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-[#333] rounded-lg text-xs font-mono text-gray-400 hover:text-[#00ff41] hover:border-[#00ff41]/50 transition-all"
                >
                  <Cpu size={14} className="text-[#00ff41]"/>
                  <span className="hidden sm:inline">MODEL:</span>
                  <span className="text-[#00ff41] font-bold">{AVAILABLE_MODELS.find(m => m.id === currentModel)?.name || currentModel}</span>
                  <svg className={`w-3 h-3 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showModelSelector && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-black/95 border border-[#333] rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                    <div className="p-2 border-b border-[#333] text-[10px] font-mono text-gray-500">
                      SELECT AI MODEL
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {AVAILABLE_MODELS.map(model => (
                        <button
                          key={model.id}
                          onClick={() => handleModelChange(model.id)}
                          className={`w-full p-3 text-left transition-all border-b border-[#222] last:border-0 ${
                            currentModel === model.id 
                              ? 'bg-[#00ff41]/10 border-l-2 border-l-[#00ff41]' 
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-sm ${currentModel === model.id ? 'text-[#00ff41]' : 'text-white'}`}>
                              {model.name}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono ${
                              model.tier === 'pro' 
                                ? 'bg-violet-500/20 text-violet-400' 
                                : 'bg-cyan-500/20 text-cyan-400'
                            }`}>
                              {model.tier.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">{model.desc}</div>
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-[#333] text-[9px] font-mono text-gray-600 text-center">
                      PRO models are slower but more capable
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[#00ff41]/70 text-[10px] md:text-xs font-light tracking-[0.2em] md:tracking-[0.6em] uppercase mb-6 animate-pulse select-none font-sans">
              AI Studio System Online
            </p>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-thin text-[#00ff41] tracking-tighter drop-shadow-[0_0_20px_rgba(0,255,65,0.8)] select-none scale-y-125 transform mb-4 font-sans">
              STUDIO AGENTS
            </h1>
            
            <p className="text-white/40 text-xs font-light tracking-[0.3em] md:tracking-[0.8em] mt-4 uppercase">
              Eight Creative Tools Restored
            </p>
          </div>

        {/* Agent Cards Grid - Landing page style with unique colors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {agents.map((agent, index) => {
            // Extract primary color from gradient for unique hover effects
            const colorMatch = agent.gradient.match(/from-(\w+)-/);
            const primaryColor = colorMatch ? colorMatch[1] : 'green';
            const colorClasses = {
              cyan: { border: 'hover:border-cyan-500/50', text: 'group-hover:text-cyan-400', shadow: 'group-hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]', glow: 'group-hover:drop-shadow-[0_0_10px_#00ffff]', line: 'bg-cyan-400' },
              pink: { border: 'hover:border-pink-500/50', text: 'group-hover:text-pink-400', shadow: 'group-hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]', glow: 'group-hover:drop-shadow-[0_0_10px_#ec4899]', line: 'bg-pink-400' },
              red: { border: 'hover:border-red-500/50', text: 'group-hover:text-red-400', shadow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]', glow: 'group-hover:drop-shadow-[0_0_10px_#ef4444]', line: 'bg-red-400' },
              blue: { border: 'hover:border-blue-500/50', text: 'group-hover:text-blue-400', shadow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]', glow: 'group-hover:drop-shadow-[0_0_10px_#3b82f6]', line: 'bg-blue-400' },
              yellow: { border: 'hover:border-yellow-500/50', text: 'group-hover:text-yellow-400', shadow: 'group-hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]', glow: 'group-hover:drop-shadow-[0_0_10px_#eab308]', line: 'bg-yellow-400' },
              violet: { border: 'hover:border-violet-500/50', text: 'group-hover:text-violet-400', shadow: 'group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]', glow: 'group-hover:drop-shadow-[0_0_10px_#8b5cf6]', line: 'bg-violet-400' },
              green: { border: 'hover:border-[#00ff41]/50', text: 'group-hover:text-[#00ff41]', shadow: 'group-hover:shadow-[0_0_20px_rgba(0,255,65,0.3)]', glow: 'group-hover:drop-shadow-[0_0_10px_#00ff41]', line: 'bg-[#00ff41]' }
            };
            const colors = colorClasses[primaryColor] || colorClasses.green;
            
            return (
              <div
                key={agent.id}
                onClick={agent.action}
                onTouchEnd={(e) => { e.preventDefault(); agent.action(); }}
                className={`group relative bg-black/50 backdrop-blur-sm border border-[#333] ${colors.border} p-4 md:p-6 flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 hover:bg-black/70 hover:scale-105 active:scale-95 touch-manipulation animate-fade-in`}
                style={{ 
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Icon with unique color glow */}
                <div className={`p-3 rounded-full bg-gradient-to-br from-[#111] to-black shadow-[inset_0_2px_5px_rgba(0,0,0,1)] ${colors.shadow} transition-all duration-300`}>
                  <agent.icon 
                    size={24} 
                    className={`text-[#444] ${colors.text} transition-colors duration-300 ${colors.glow}`} 
                    strokeWidth={2}
                  />
                </div>

                {/* Title */}
                <h3 className={`text-sm md:text-base font-mono font-bold text-gray-600 ${colors.text} tracking-wider transition-colors duration-300 text-center`}>
                  {agent.title.split(' ')[0]}
                </h3>
                
                {/* Subtitle */}
                <p className={`text-[10px] font-mono tracking-wider uppercase text-gray-700 ${colors.text} opacity-70 transition-colors duration-300 text-center`}>
                  {agent.subtitle}
                </p>

                {/* Bottom indicator line with unique color */}
                <div className={`absolute inset-x-0 bottom-0 h-[2px] ${colors.line} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center shadow-[0_0_10px_currentColor]`}></div>
              </div>
            );
          })}
        </div>

        {/* Bottom Status - Terminal style */}
        <div className="mt-12 md:mt-16 text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-black/50 backdrop-blur-sm border border-[#00ff41]/20 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff41] animate-pulse">●</span>
              <span className="text-xs text-gray-500 tracking-wider">{agents.length}_AGENTS_ACTIVE</span>
            </div>
            <div className="w-px h-4 bg-[#00ff41]/20"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 tracking-wider">AVG_RESPONSE: <span className="text-[#00ff41]">~2s</span></span>
            </div>
          </div>
        </div>
      </div>
          </div>
        )}
      </div>
      
    <style>{`
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `}</style>
  </div>
);
};

// AUTH MODAL COMPONENT
const AuthModal = ({ onClose, onAuth }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!auth) {
      setError('Auth not available in demo mode');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuth();
      onClose();
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth.*?\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!auth) {
      setError('Auth not available in demo mode');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onAuth();
      onClose();
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth.*?\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchEnd={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); onClose(); } }}
    >
      <div className="w-full max-w-md bg-[#1a1a1a] border-2 border-cyan-500 shadow-[0_0_40px_rgba(0,255,255,0.4)] touch-manipulation">
        <div className="bg-cyan-700 text-white px-4 py-2 flex justify-between items-center">
          <span className="font-mono font-bold text-sm flex items-center gap-2">
            <User size={16}/> USER_AUTH.EXE
          </span>
          <button onClick={onClose} className="hover:text-black transition-colors">
            <X size={18}/>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-white font-black text-xl mb-2">
              {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </h2>
            <p className="text-gray-400 text-xs font-mono">
              {isSignUp ? 'Sign up to save your creations' : 'Login is optional but enables saving'}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 p-3 text-xs font-mono">
              ERROR: {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL"
              className="w-full bg-black border border-[#333] text-white p-3 text-sm font-mono outline-none focus:border-cyan-500"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              className="w-full bg-black border border-[#333] text-white p-3 text-sm font-mono outline-none focus:border-cyan-500"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 text-black py-3 font-bold text-sm uppercase hover:bg-cyan-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN')}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#333]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#1a1a1a] px-2 text-gray-500 font-mono">OR</span>
            </div>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full bg-white text-black py-3 font-bold text-sm uppercase hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Globe size={16}/> SIGN IN WITH GOOGLE
          </button>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-cyan-400 text-xs font-mono hover:text-cyan-300 transition-colors"
          >
            {isSignUp ? 'Already have an account? SIGN IN' : "Don't have an account? CREATE ONE"}
          </button>

          <button
            onClick={onClose}
            className="w-full text-gray-500 text-xs font-mono hover:text-gray-400 transition-colors"
          >
            SKIP (Continue as guest)
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGAL & COMPLIANCE PAGES
// ═══════════════════════════════════════════════════════════════════════════════

// Privacy Policy Component
const PrivacyPolicy = ({ onBack }) => {
  return (
    <div className="h-full overflow-y-auto bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-[#00ff41] hover:text-white mb-6 text-sm">
          ← Back to App
        </button>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Last Updated: December 13, 2025 | Effective Date: December 13, 2025</p>
        
        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
            <p>Whip Montez ("we," "us," or "our") operates the Whip Montez Studio web application (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. By accessing or using the Service, you agree to this Privacy Policy.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>
            <h3 className="text-lg text-purple-400 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address, display name, and authentication credentials when you create an account or sign in via third-party providers (Google, Twitter/X).</li>
              <li><strong>User Content:</strong> Lyrics, prompts, designs, and other creative content you generate using our AI tools.</li>
              <li><strong>Communications:</strong> Information you provide when contacting us for support.</li>
            </ul>
            
            <h3 className="text-lg text-purple-400 mb-2 mt-4">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers.</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, session duration, referring URLs.</li>
              <li><strong>IP Address:</strong> Used for rate limiting, fraud prevention, and approximate geolocation.</li>
              <li><strong>Cookies & Local Storage:</strong> Session tokens, preferences, and analytics identifiers.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process AI generation requests via Google Gemini API</li>
              <li>Authenticate users and manage accounts</li>
              <li>Enforce usage limits and prevent abuse</li>
              <li>Respond to inquiries and provide customer support</li>
              <li>Send service-related notifications</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We integrate with the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Gemini API:</strong> Processes AI generation requests. Content you submit may be processed by Google's AI systems. See Google's AI Privacy Policy.</li>
              <li><strong>Firebase (Google):</strong> Authentication, database, and hosting services.</li>
              <li><strong>Twitter/X API:</strong> Optional social sharing integration (when you connect your account).</li>
              <li><strong>Railway:</strong> Cloud hosting infrastructure.</li>
            </ul>
            <p className="mt-3">Each third-party service has its own privacy policy. We encourage you to review them.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Data:</strong> Retained until you delete your account.</li>
              <li><strong>Generated Content:</strong> Stored in your browser's local storage. We do not permanently store your AI-generated content on our servers unless you explicitly save it to your account.</li>
              <li><strong>Usage Logs:</strong> Retained for up to 90 days for security and debugging purposes.</li>
              <li><strong>Rate Limiting Data:</strong> IP-based usage counts reset periodically.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Your Rights (GDPR/CCPA)</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data.</li>
              <li><strong>Rectification:</strong> Correct inaccurate personal data.</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data ("Right to be Forgotten").</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Opt-Out:</strong> Opt out of certain data processing activities.</li>
              <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your rights.</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at: <span className="text-[#00ff41]">privacy@whipmontez.com</span></p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Data Security</h2>
            <p>We implement industry-standard security measures including HTTPS encryption, secure authentication, rate limiting, input sanitization, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Children's Privacy</h2>
            <p>The Service is not intended for children under 13 (or 16 in the EU). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. International Data Transfers</h2>
            <p>Your data may be processed in the United States and other countries where our service providers operate. By using the Service, you consent to the transfer of your data to these jurisdictions, which may have different data protection laws than your country of residence.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Contact Us</h2>
            <p>For privacy-related inquiries:</p>
            <p className="mt-2">Email: <span className="text-[#00ff41]">privacy@whipmontez.com</span></p>
            <p>Data Protection Officer: <span className="text-[#00ff41]">dpo@whipmontez.com</span></p>
          </section>
        </div>
        
        <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-xs">
          © 2025 Whip Montez. All Rights Reserved.
        </div>
      </div>
    </div>
  );
};

// Terms of Service Component
const TermsOfService = ({ onBack }) => {
  return (
    <div className="h-full overflow-y-auto bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-[#00ff41] hover:text-white mb-6 text-sm">
          ← Back to App
        </button>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-8">Last Updated: December 13, 2025 | Effective Date: December 13, 2025</p>
        
        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the Whip Montez Studio ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. We reserve the right to modify these Terms at any time, and your continued use constitutes acceptance of any modifications.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
            <p>Whip Montez Studio is an AI-powered creative platform that provides tools for generating lyrics, music production concepts, visual art direction, video storyboards, and design templates. The Service uses third-party AI services (Google Gemini) to process generation requests.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You may use certain features as a guest, but full functionality requires account creation.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Acceptable Use Policy</h2>
            <p className="mb-3">You agree NOT to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Generate content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
              <li>Create content that infringes on intellectual property rights of others</li>
              <li>Generate content depicting minors in inappropriate contexts</li>
              <li>Impersonate any person or entity, or falsely claim affiliation</li>
              <li>Attempt to circumvent rate limits, security measures, or usage restrictions</li>
              <li>Use automated systems (bots, scrapers) without authorization</li>
              <li>Distribute malware or engage in phishing activities</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Intellectual Property</h2>
            <h3 className="text-lg text-purple-400 mb-2">5.1 Our Content</h3>
            <p>The Service, including its design, code, graphics, and branding (excluding AI-generated content), is owned by Whip Montez and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without permission.</p>
            
            <h3 className="text-lg text-purple-400 mb-2 mt-4">5.2 AI-Generated Content</h3>
            <p>Content generated by AI through the Service is subject to the following:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>You retain ownership of original prompts you provide.</li>
              <li>AI-generated outputs may be used by you for personal and commercial purposes, subject to applicable law.</li>
              <li>We make no claims of copyright ownership over AI-generated outputs.</li>
              <li>AI outputs may not be unique—similar outputs may be generated for other users.</li>
              <li>You are responsible for ensuring AI-generated content does not infringe on third-party rights.</li>
            </ul>
            
            <h3 className="text-lg text-purple-400 mb-2 mt-4">5.3 DMCA Policy</h3>
            <p>If you believe content on the Service infringes your copyright, please contact our designated agent at: <span className="text-[#00ff41]">dmca@whipmontez.com</span> with the required DMCA notice elements.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Subscription & Payments</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Free Tier:</strong> Limited to 3 uses per AI agent per session.</li>
              <li><strong>Paid Subscriptions:</strong> Creator ($9.99/mo) and Studio Pro ($24.99/mo) tiers offer increased usage limits.</li>
              <li>Payments are processed through third-party payment processors.</li>
              <li>Subscriptions auto-renew unless canceled before the renewal date.</li>
              <li>Refunds are provided in accordance with our Refund Policy.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Disclaimers</h2>
            <p className="uppercase text-yellow-500 mb-3">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We do not guarantee AI outputs will be accurate, complete, or fit for any particular purpose.</li>
              <li>AI-generated content may contain errors, biases, or inappropriate material.</li>
              <li>We do not guarantee uninterrupted or error-free service.</li>
              <li>We are not responsible for content generated by users or AI systems.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Limitation of Liability</h2>
            <p className="uppercase text-yellow-500">TO THE MAXIMUM EXTENT PERMITTED BY LAW, WHIP MONTEZ AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.</p>
            <p className="mt-3">Our total liability shall not exceed the greater of: (a) the amount you paid us in the 12 months preceding the claim, or (b) $100 USD.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless Whip Montez and its affiliates from any claims, damages, losses, or expenses (including attorney's fees) arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Dispute Resolution</h2>
            <p>Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall take place in New York, NY. You waive any right to participate in class action lawsuits.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of New York, United States, without regard to conflict of law principles.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Severability</h2>
            <p>If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">13. Contact</h2>
            <p>For questions about these Terms:</p>
            <p className="mt-2">Email: <span className="text-[#00ff41]">legal@whipmontez.com</span></p>
          </section>
        </div>
        
        <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-xs">
          © 2025 Whip Montez. All Rights Reserved.
        </div>
      </div>
    </div>
  );
};

// Cookie Policy Component
const CookiePolicy = ({ onBack }) => {
  return (
    <div className="h-full overflow-y-auto bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-[#00ff41] hover:text-white mb-6 text-sm">
          ← Back to App
        </button>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Cookie Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Last Updated: December 13, 2025</p>
        
        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. What Are Cookies?</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and provide analytics about how you use the site.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Cookies</h2>
            <table className="w-full border border-gray-700 mt-3">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-3 text-left text-white">Type</th>
                  <th className="p-3 text-left text-white">Purpose</th>
                  <th className="p-3 text-left text-white">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-700">
                  <td className="p-3 text-purple-400">Essential</td>
                  <td className="p-3">Authentication, security, rate limiting</td>
                  <td className="p-3">Session</td>
                </tr>
                <tr className="border-t border-gray-700">
                  <td className="p-3 text-purple-400">Functional</td>
                  <td className="p-3">User preferences, theme settings, last visited section</td>
                  <td className="p-3">1 year</td>
                </tr>
                <tr className="border-t border-gray-700">
                  <td className="p-3 text-purple-400">Analytics</td>
                  <td className="p-3">Usage statistics, feature popularity, error tracking</td>
                  <td className="p-3">90 days</td>
                </tr>
              </tbody>
            </table>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Local Storage</h2>
            <p>In addition to cookies, we use browser local storage to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Store your AI-generated content locally (not sent to our servers unless explicitly saved)</li>
              <li>Remember your onboarding completion status</li>
              <li>Cache your preferences and settings</li>
              <li>Track trial usage per IP address</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Third-Party Cookies</h2>
            <p>We may use cookies from the following third parties:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Firebase:</strong> Authentication and analytics</li>
              <li><strong>Twitter/X:</strong> When you connect your account for social sharing</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Managing Cookies</h2>
            <p className="mb-3">You can control cookies through:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies. Note that blocking essential cookies may prevent the Service from functioning properly.</li>
              <li><strong>Our Cookie Banner:</strong> Use the cookie consent banner to accept or reject non-essential cookies.</li>
              <li><strong>Opt-Out Links:</strong> For third-party analytics, use their respective opt-out mechanisms.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Do Not Track</h2>
            <p>Some browsers have a "Do Not Track" feature. We currently do not respond to DNT signals, but we honor the cookie preferences you set through our consent mechanism.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Contact</h2>
            <p>For questions about our cookie practices:</p>
            <p className="mt-2">Email: <span className="text-[#00ff41]">privacy@whipmontez.com</span></p>
          </section>
        </div>
        
        <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-xs">
          © 2025 Whip Montez. All Rights Reserved.
        </div>
      </div>
    </div>
  );
};

// Cookie Consent Banner Component
const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    const consent = localStorage.getItem('whip-cookie-consent');
    if (!consent) {
      // Small delay before showing banner
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);
  
  const acceptAll = () => {
    localStorage.setItem('whip-cookie-consent', JSON.stringify({
      essential: true,
      functional: true,
      analytics: true,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };
  
  const acceptEssential = () => {
    localStorage.setItem('whip-cookie-consent', JSON.stringify({
      essential: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] bg-black/95 border-t border-[#00ff41]/30 backdrop-blur-sm p-4 animate-slide-up">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#00ff41] text-lg">🍪</span>
              <h3 className="text-white font-bold text-sm">We Value Your Privacy</h3>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              We use cookies to enhance your experience, analyze site traffic, and for security. 
              Essential cookies are required for the site to function. You can choose to accept all cookies or only essential ones.
              {' '}
              <button onClick={() => setShowDetails(!showDetails)} className="text-[#00ff41] underline">
                {showDetails ? 'Hide details' : 'Learn more'}
              </button>
            </p>
            
            {showDetails && (
              <div className="mt-3 p-3 bg-gray-900 border border-gray-700 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-purple-400 font-bold">Essential ✓</span>
                    <p className="text-gray-400 mt-1">Required for login, security, and basic functionality.</p>
                  </div>
                  <div>
                    <span className="text-purple-400 font-bold">Functional</span>
                    <p className="text-gray-400 mt-1">Remembers your preferences and settings.</p>
                  </div>
                  <div>
                    <span className="text-purple-400 font-bold">Analytics</span>
                    <p className="text-gray-400 mt-1">Helps us understand how you use the site.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={acceptEssential}
              className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-white text-xs uppercase tracking-wider transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 bg-[#00ff41] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00cc33] transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 17. MAIN OS SHELL
const OSInterface = ({ reboot, initialSection = 'home' }) => {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const authInitialized = useRef(false); // Guard against multiple initializations

  useEffect(() => {
    // 1. Start System Clock
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);

    // 2. Initialize Auth - ONLY ONCE with guard to prevent Strict Mode double-init
    let unsubscribe = () => {};

    if (!authInitialized.current) {
      authInitialized.current = true;

      const initAuth = async () => {
        // If no auth instance (Offline/Demo mode)
        if (!auth) {
          console.log("OS running in Offline/Demo Mode");
          setUser({ uid: "guest", isAnonymous: true });
          return;
        }

        // If auth exists, set up listener and sign in
        try {
          // CRITICAL FIX: Sign in FIRST, then set up listener
          // This prevents the listener from firing on null->user transition
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }

          // Now set listener - only fires on subsequent changes
          unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
              setUser(currentUser);
            } else {
               setUser({ uid: "guest", isAnonymous: true }); 
            }
          });
        } catch (error) {
          // Auth failed (e.g., anonymous auth disabled) - use guest mode
          console.log("Running in guest mode (auth not configured)");
          setUser({ uid: "guest", isAnonymous: true });
        }
      };

      initAuth();
    }
    
    return () => { 
      clearInterval(timer); 
      if (unsubscribe) unsubscribe(); 
    };
  }, []);

  // Centralized rendering logic for the active component
  const renderActiveComponent = () => {
    switch (activeSection) {
      case 'home':
        return <Home setSection={setActiveSection} />;
      case 'bio':
        return <Bio setSection={setActiveSection} user={user} />;
      case 'music':
        return <MusicPlayer />;
      case 'tour':
        return <TourHistory />;
      case 'style':
        return <StyleArchive />;
      case 'community':
        return <CommunityHub setSection={setActiveSection} />;
      case 'studio':
        return <StudioHub setSection={setActiveSection} user={user} onAuthRequest={() => setShowAuthModal(true)} />;
      case 'ghostwriter':
        return <StudioHub setSection={setActiveSection} user={user} onAuthRequest={() => setShowAuthModal(true)} initialAgent="ghostwriter" />;
      case 'chat':
        return <StudioHub setSection={setActiveSection} user={user} onAuthRequest={() => setShowAuthModal(true)} initialAgent="chat" />;
      case 'battle':
        return <StudioHub setSection={setActiveSection} user={user} onAuthRequest={() => setShowAuthModal(true)} initialAgent="battle" />;
      case 'crates':
        return <StudioHub setSection={setActiveSection} user={user} onAuthRequest={() => setShowAuthModal(true)} initialAgent="crates" />;
      case 'news':
        return <NewsArchive />;
      case 'ar_suite':
        return <StudioHub setSection={setActiveSection} user={user} onAuthRequest={() => setShowAuthModal(true)} initialAgent="ar_suite" />;
      case 'album_art':
        return <StudioHub setSection={setActiveSection} user={user} onAuthRequest={() => setShowAuthModal(true)} initialAgent="album_art" />;
      case 'viral_video':
        return <StudioHub setSection={setActiveSection} user={user} onAuthRequest={() => setShowAuthModal(true)} initialAgent="viral_video" />;
      case 'trend_hunter':
        return <StudioHub setSection={setActiveSection} user={user} onAuthRequest={() => setShowAuthModal(true)} initialAgent="trend_hunter" />;
      case 'comeup':
        return <TheComeUp setSection={setActiveSection} />;
      case 'privacy':
        return <PrivacyPolicy onBack={() => setActiveSection('home')} />;
      case 'terms':
        return <TermsOfService onBack={() => setActiveSection('home')} />;
      case 'cookies':
        return <CookiePolicy onBack={() => setActiveSection('home')} />;
      default:
        return <Home setSection={setActiveSection} />;
    }
  };


  return (
    <div className="flex flex-col h-screen w-full relative z-10">
      {/* Top navigation bar - scrollable on mobile */}
      <div className="h-auto md:h-10 bg-[#111] border-b border-[#333] flex flex-col md:flex-row items-start md:items-center justify-between px-2 md:px-4 py-2 md:py-0 select-none overflow-x-auto">
        <div className="flex items-center gap-2 md:gap-4 min-w-max w-full md:w-auto mb-2 md:mb-0">
          <div className="flex items-center gap-1 md:gap-2 text-[#00ff41] font-bold text-xs md:text-sm">
            <Cpu size={14} className="md:w-4 md:h-4" /> 
            <span className="hidden sm:inline">SYSTEM_READY</span>
          </div>
          <div className="h-4 w-[1px] bg-[#333] mx-1"></div>
          {/* Mobile: wrap navigation, Desktop: single row */}
          <nav className="flex gap-1 flex-wrap md:flex-nowrap">
            {['home', 'bio', 'music', 'tour', 'style', 'community', 'news'].map(section => (
              <button 
                key={section}
                onClick={() => setActiveSection(section)}
                onTouchEnd={(e) => { e.preventDefault(); setActiveSection(section); }}
                className={`px-2 md:px-3 py-2 md:py-1 text-[10px] md:text-xs font-mono uppercase transition-colors whitespace-nowrap touch-manipulation active:opacity-70 ${
                  activeSection === section ? 'bg-[#00ff41] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {section === 'music' ? 'Lost Tapes' : section}
              </button>
            ))}
            <button 
              onClick={() => setActiveSection('comeup')}
              onTouchEnd={(e) => { e.preventDefault(); setActiveSection('comeup'); }}
              className={`px-2 md:px-3 py-2 md:py-1 text-[10px] md:text-xs font-mono uppercase transition-colors whitespace-nowrap touch-manipulation active:opacity-70 ${
                activeSection === 'comeup' ? 'bg-yellow-500 text-black font-bold' : 'text-yellow-500 hover:text-white font-bold'
              }`}
            >
              COME UP
            </button>
            <button 
              onClick={() => setActiveSection('studio')}
              onTouchEnd={(e) => { e.preventDefault(); setActiveSection('studio'); }}
              className={`px-2 md:px-3 py-2 md:py-1 text-[10px] md:text-xs font-mono uppercase transition-colors whitespace-nowrap touch-manipulation active:opacity-70 ${
                activeSection === 'studio' ? 'bg-pink-500 text-black font-bold' : 'text-pink-500 hover:text-white font-bold'
              }`}
            >
              STUDIO
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs font-mono">
          {/* User Auth Button */}
          {!user || user.isAnonymous ? (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-1 border border-cyan-800 hover:border-cyan-500 transition-colors"
            >
              <User size={12} className="md:w-3.5 md:h-3.5"/>
              <span className="hidden sm:inline">SIGN IN</span>
            </button>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-1 border border-cyan-800 hover:border-cyan-500 transition-colors"
              >
                <User size={12} className="md:w-3.5 md:h-3.5"/>
                <span className="hidden sm:inline truncate max-w-[100px]">{user.email || user.uid.substring(0, 8)}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-cyan-800 shadow-lg z-50 min-w-[150px]">
                  <button
                    onClick={async () => {
                      try {
                        await signOut(auth);
                        setUser(null);
                        setShowUserMenu(false);
                      } catch (error) {
                        console.error('Sign out failed:', error);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-900 transition-colors text-white"
                  >
                    SIGN OUT
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button onClick={reboot} className="text-red-500 hover:text-red-400 flex items-center gap-1">
            <Power size={12} className="md:w-3.5 md:h-3.5"/>
          </button>
          <span className="text-[#00ff41] whitespace-nowrap">{time}</span>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onAuth={() => console.log('User authenticated')}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <div className="absolute inset-1 md:inset-2 border border-[#333] flex flex-col bg-[#050505]">
          <div className="h-6 md:h-8 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-2">
            <div className="text-[10px] md:text-xs text-gray-400 font-mono flex items-center gap-2">
              <Terminal size={10} className="md:w-3 md:h-3" /> 
              <span className="truncate">C:\WHIP_MONTEZ\{activeSection.toUpperCase()}.EXE</span>
            </div>
            <div className="flex gap-2">
              <Minus size={10} className="md:w-3 md:h-3 text-gray-500"/>
              <Maximize2 size={10} className="md:w-3 md:h-3 text-gray-500"/>
              <X size={10} className="md:w-3 md:h-3 text-gray-500"/>
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            {renderActiveComponent()}
          </div>
          
          {/* Legal Footer - Small print */}
          <div className="h-6 bg-black/80 border-t border-[#222] flex items-center justify-center gap-4 text-[9px] text-gray-500">
            <button onClick={() => setActiveSection('privacy')} className="hover:text-[#00ff41] transition-colors">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => setActiveSection('terms')} className="hover:text-[#00ff41] transition-colors">Terms of Service</button>
            <span>•</span>
            <button onClick={() => setActiveSection('cookies')} className="hover:text-[#00ff41] transition-colors">Cookie Policy</button>
            <span>•</span>
            <span>© 2025 Whip Montez</span>
          </div>
        </div>
      </div>

      {/* Bottom marquee - smaller on mobile */}
      <div className="h-5 md:h-6 bg-[#00ff41] text-black text-[10px] md:text-xs font-mono flex items-center overflow-hidden border-t border-[#00ff41]">
         <div className="animate-marquee whitespace-nowrap uppercase font-bold">*** BREAKING: UNRELEASED TRACKS FOUND IN RED HOOK BASEMENT *** TOUR DATES LEAKED FROM 2004 *** WHIP MONTEZ SIGHTING CONFIRMED AT BODEGA *** SYSTEM RESTORATION AT 99% ***</div>
      </div>
    </div>
  );
};

// Landing Page Component
const LandingPage = ({ onEnter, onQuickAccess }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const handleEnterClick = () => {
    setIsEntering(true);
    setTimeout(() => {
      onEnter();
    }, 2500); 
  };

  const handleQuickAccess = (widgetId) => {
    // Map widget IDs to section names
    const sectionMap = {
      'music': 'lostTapes',
      'merch': 'store',
      'news': 'news',
      'studio': 'ghostwriter'
    };
    onQuickAccess(sectionMap[widgetId] || 'home');
  };

  const quickAccessWidgets = [
    { id: 'music', icon: Radio, label: 'LOST TAPES', color: 'text-[#00ff41]', bgColor: 'bg-[#00ff41]' },
    { id: 'merch', icon: ShoppingBag, label: 'MERCH', color: 'text-purple-500', bgColor: 'bg-purple-500' },
    { id: 'news', icon: Globe, label: 'FEED', color: 'text-cyan-500', bgColor: 'bg-cyan-500' },
    { id: 'studio', icon: Sliders, label: 'STUDIO', color: 'text-pink-500', bgColor: 'bg-pink-500' }
  ];

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center relative overflow-hidden z-[150] font-sans touch-auto">
      {/* Subtle modern mesh bg */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#051a05] via-black to-black opacity-80"></div>
      
      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="border border-[#00ff41] bg-black p-6 max-w-md w-full shadow-[0_0_30px_rgba(0,255,65,0.1)] relative">
            <button 
              onClick={() => setShowDisclaimer(false)}
              onTouchEnd={(e) => { e.preventDefault(); setShowDisclaimer(false); }}
              className="absolute top-3 right-3 text-[#00ff41]/50 hover:text-[#00ff41] transition-colors touch-manipulation"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2 text-[#00ff41] mb-4">
              <ShieldAlert size={18} />
              <h3 className="font-mono font-bold text-sm tracking-widest">DISCLAIMER</h3>
            </div>
            <p className="text-gray-400 font-mono text-xs leading-relaxed mb-4">
              This website is an <strong>Alternate Reality Experience</strong> (ARE). The content, characters, and events depicted are fictionalized for entertainment purposes. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.
            </p>
            <div className="w-full h-[1px] bg-[#00ff41]/20 mb-2"></div>
            <p className="text-[#00ff41]/40 font-mono text-[10px]">
              TERMINAL_ID: WHIP-OS-V2 // STATUS: SIMULATION
            </p>
          </div>
        </div>
      )}

      <div className={`z-10 w-full max-w-6xl px-4 flex flex-col items-center transition-all duration-1000 ease-in-out ${isEntering ? 'space-y-0 justify-center h-full' : 'space-y-12'}`}>
        <div className={`text-center relative transition-all duration-1500 ease-in-out transform ${isEntering ? 'scale-50 translate-y-4' : 'scale-100'}`}>
          
          {/* New Disclaimer Text - Stays at top */}
          <p className={`text-[#00ff41]/70 text-[10px] md:text-xs font-light tracking-[0.2em] md:tracking-[0.6em] uppercase mb-6 animate-pulse select-none font-sans transition-opacity duration-500 ${isEntering ? 'opacity-0' : 'opacity-100'}`}>
            Alternative Reality Experience
          </p>

          {/* Neon Green Thin Solid Font - Single Line with Hover Effect */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-thin text-[#00ff41] tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,65,0.8)] select-none scale-y-125 transform mb-8 font-sans md:whitespace-nowrap transition-all duration-500 cursor-default hover:drop-shadow-[0_0_35px_#00ff41] hover:text-[#e0ffe0]">
            WHIP MONTEZ
          </h1>

          {/* Tagline Moved Back Below */}
          <p className="text-white/40 text-xs font-light tracking-[0.3em] md:tracking-[0.8em] mt-4 uppercase ml-0 md:ml-2 transition-all duration-1000">
            The Restored Experience
          </p>

          {/* The Expanding Line Animation */}
          <div className={`h-[2px] bg-[#00ff41] shadow-[0_0_20px_#00ff41] mx-auto mt-8 transition-all duration-1500 ease-out max-w-full ${isEntering ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
        </div>

        {/* Quick Access Widgets */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl transition-all duration-700 ${isEntering ? 'hidden' : 'block'}`}>
          {quickAccessWidgets.map((widget, i) => (
            <div 
              key={widget.id}
              onClick={() => handleQuickAccess(widget.id)}
              onTouchEnd={(e) => { e.preventDefault(); handleQuickAccess(widget.id); }}
              className="group relative bg-black/50 backdrop-blur-sm border border-[#333] hover:border-[#00ff41]/50 p-4 md:p-6 flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 hover:bg-black/70 hover:scale-105 active:scale-95 touch-manipulation"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`p-3 rounded-full bg-gradient-to-br from-[#111] to-black shadow-[inset_0_2px_5px_rgba(0,0,0,1)] group-hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all duration-300`}>
                <widget.icon 
                  size={24} 
                  className={`text-[#444] group-hover:${widget.color} transition-colors duration-300 group-hover:drop-shadow-[0_0_10px_currentColor]`} 
                  strokeWidth={2}
                />
              </div>
              <span className={`text-[10px] md:text-xs font-mono uppercase tracking-widest text-gray-600 group-hover:${widget.color} transition-colors duration-300`}>
                {widget.label}
              </span>
              <div className={`absolute inset-x-0 bottom-0 h-[2px] ${widget.bgColor} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center`}></div>
            </div>
          ))}
        </div>

        <div className={`relative group cursor-pointer transition-all duration-700 touch-manipulation ${isEntering ? 'hidden' : 'block'}`} onClick={handleEnterClick} onTouchEnd={(e) => { e.preventDefault(); handleEnterClick(); }}>
          {/* Outer Ring Animation */}
          <div className="absolute inset-[-10px] border border-dashed border-[#00ff41]/20 rounded-full w-[calc(100%+20px)] h-[calc(100%+20px)] opacity-0 group-hover:opacity-100 animate-[spin_8s_linear_infinite] pointer-events-none transition-opacity duration-700"></div>
          
          <button 
            className="relative w-24 h-24 rounded-full bg-black border border-[#333] group-hover:border-[#00ff41]/50 transition-all duration-500 flex items-center justify-center shadow-[0_0_0_0_rgba(0,255,65,0)] group-hover:shadow-[0_0_40px_rgba(0,255,65,0.3)] active:scale-95"
          >
            {/* Glossy sheen top half */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none"></div>
            
            {/* Inner recess */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#111] to-black flex items-center justify-center shadow-[inset_0_2px_5px_rgba(0,0,0,1)] group-hover:bg-[#001100] transition-colors duration-500">
              <Power 
                size={32} 
                className="text-[#444] group-hover:text-[#00ff41] transition-all duration-500 group-hover:drop-shadow-[0_0_10px_rgba(0,255,65,1)]" 
                strokeWidth={3}
              />
            </div>
          </button>
        </div>
      </div>
      
      <div className={`absolute bottom-8 w-full px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-[#00ff41]/30 font-mono text-[10px] tracking-widest uppercase gap-2 transition-opacity duration-1000 ${isEntering ? 'hidden' : 'block'}`}>
        <span className="text-center md:text-left">Quick_Access_Available // Press Power to Boot Full System</span>
        <button 
          onClick={() => setShowDisclaimer(true)}
          onTouchEnd={(e) => { e.preventDefault(); setShowDisclaimer(true); }}
          className="hover:text-[#00ff41] transition-colors border-b border-transparent hover:border-[#00ff41] pb-[1px] cursor-pointer whitespace-nowrap touch-manipulation"
        >
          [ Notice: Disclaimer ]
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// AMBIENT MUSIC PLAYER - Lofi beats for the creative session
// ═══════════════════════════════════════════════════════════════════════════════

const AmbientMusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const audioRef = useRef(null);
  
  // Free lofi/ambient tracks (royalty-free)
  const tracks = [
    { 
      name: 'Studio Vibes', 
      // Synth pad ambient sound generated via Web Audio
      type: 'synth'
    },
    { 
      name: 'Midnight Session', 
      type: 'synth'
    },
    { 
      name: 'Brooklyn Nights', 
      type: 'synth'
    }
  ];
  
  const audioContextRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const gainNodeRef = useRef(null);
  
  const startAmbientSynth = () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.setValueAtTime(volume * 0.15, audioContextRef.current.currentTime);
      
      // Create ambient pad with multiple oscillators
      const baseFreqs = currentTrack === 0 
        ? [130.81, 164.81, 196.00, 261.63] // C major
        : currentTrack === 1 
        ? [146.83, 174.61, 220.00, 293.66] // D minor
        : [123.47, 155.56, 185.00, 246.94]; // B minor
      
      baseFreqs.forEach(freq => {
        const osc = audioContextRef.current.createOscillator();
        const oscGain = audioContextRef.current.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
        
        // Slow LFO for movement
        const lfo = audioContextRef.current.createOscillator();
        const lfoGain = audioContextRef.current.createGain();
        lfo.frequency.setValueAtTime(0.1 + Math.random() * 0.2, audioContextRef.current.currentTime);
        lfoGain.gain.setValueAtTime(2, audioContextRef.current.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
        
        oscGain.gain.setValueAtTime(0.25, audioContextRef.current.currentTime);
        osc.connect(oscGain);
        oscGain.connect(gainNodeRef.current);
        osc.start();
        
        oscillatorsRef.current.push({ osc, lfo, oscGain });
      });
      
      setIsPlaying(true);
    } catch (e) {
      console.error('Audio not supported:', e);
    }
  };
  
  const stopAmbientSynth = () => {
    oscillatorsRef.current.forEach(({ osc, lfo }) => {
      try {
        osc.stop();
        lfo.stop();
      } catch (e) {}
    });
    oscillatorsRef.current = [];
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsPlaying(false);
  };
  
  const togglePlayback = () => {
    if (isPlaying) {
      stopAmbientSynth();
    } else {
      startAmbientSynth();
    }
  };
  
  const changeTrack = (direction) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) stopAmbientSynth();
    
    setCurrentTrack(prev => {
      const next = (prev + direction + tracks.length) % tracks.length;
      return next;
    });
    
    // Restart with new track after state update
    if (wasPlaying) {
      setTimeout(() => startAmbientSynth(), 100);
    }
  };
  
  const updateVolume = (newVol) => {
    setVolume(newVol);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol * 0.15, audioContextRef.current.currentTime);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPlaying) stopAmbientSynth();
    };
  }, []);
  
  return (
    <div className="fixed bottom-20 left-4 z-50">
      {/* Compact Toggle Button */}
      <button
        onClick={() => setShowControls(!showControls)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isPlaying 
            ? 'bg-[#00ff41] text-black shadow-[0_0_20px_rgba(0,255,65,0.5)]' 
            : 'bg-black/80 border border-white/20 text-white/60 hover:text-white hover:border-white/40'
        }`}
        title="Ambient Music"
      >
        {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
      
      {/* Expanded Controls */}
      {showControls && (
        <div className="absolute bottom-12 left-0 w-56 bg-black/95 border border-white/20 backdrop-blur-sm p-3 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-xs font-bold uppercase tracking-wider">Ambient</span>
            <button onClick={() => setShowControls(false)} className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          </div>
          
          {/* Track Info */}
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => changeTrack(-1)} 
              className="text-white/40 hover:text-white p-1"
            >
              ◀
            </button>
            <span className="text-[#00ff41] text-xs font-mono">{tracks[currentTrack].name}</span>
            <button 
              onClick={() => changeTrack(1)} 
              className="text-white/40 hover:text-white p-1"
            >
              ▶
            </button>
          </div>
          
          {/* Play/Pause */}
          <button
            onClick={togglePlayback}
            className={`w-full py-2 mb-3 text-xs uppercase tracking-wider font-bold transition-all ${
              isPlaying 
                ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30' 
                : 'bg-[#00ff41]/20 border border-[#00ff41]/40 text-[#00ff41] hover:bg-[#00ff41]/30'
            }`}
          >
            {isPlaying ? '⏹ Stop' : '▶ Play Ambient'}
          </button>
          
          {/* Volume Slider */}
          <div className="flex items-center gap-2">
            <VolumeX size={12} className="text-white/40" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => updateVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-white/20 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#00ff41] [&::-webkit-slider-thumb]:rounded-full"
            />
            <Volume2 size={12} className="text-white/40" />
          </div>
          
          <p className="text-white/30 text-[9px] text-center mt-3">
            🎧 Focus beats for your creative session
          </p>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [appState, setAppState] = useState('landing'); // 'landing' | 'booting' | 'ready'
  const [initialSection, setInitialSection] = useState('home');

  const handleQuickAccess = (section) => {
    setInitialSection(section);
    setAppState('ready'); // Skip boot sequence, go directly to OS
  };

  return (
    <div className="relative w-full h-screen bg-black text-white selection:bg-[#00ff41] selection:text-black font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Anton&family=Inter:wght@400;800&family=Comic+Neue:wght@700&family=Permanent+Marker&display=swap');
        
        :root { --neon-green: #00ff41; --dark-bg: #050505; --chrome-1: #e0e0e0; --chrome-2: #8a8a8a; --chrome-3: #ffffff; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #050505; border-left: 1px solid #333; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border: 1px solid #333; border-radius: 0; }
        ::-webkit-scrollbar-thumb:hover { background: #00ff41; border: 1px solid #00ff41; box-shadow: 0 0 10px #00ff41; }
        .crt-overlay { background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%; pointer-events: none; z-index: 60; }
        .scanline { width: 100%; height: 100px; z-index: 55; background: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0, 255, 65, 0.1) 50%, rgba(0,0,0,0) 100%); opacity: 0.1; position: absolute; bottom: 100%; animation: scanline 10s linear infinite; pointer-events: none; }
        @keyframes scanline { 0% { bottom: 100%; } 100% { bottom: -100px; } }
        .chrome-text { font-family: 'Anton', sans-serif; background: linear-gradient(to bottom, var(--chrome-3) 0%, var(--chrome-1) 50%, var(--chrome-2) 51%, var(--chrome-3) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0px 2px 0px rgba(0,0,0,0.5); -webkit-text-stroke: 1px rgba(255,255,255,0.4); letter-spacing: -0.02em; }
        .ken-burns-anim { animation: kenBurns 20s infinite alternate ease-in-out; }
        @keyframes kenBurns { 0% { transform: scale(1) translate(0, 0); } 100% { transform: scale(1.2) translate(-3%, -2%); } }
        .typing-cursor::after { content: '█'; animation: blink 1s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-marquee { animation: marquee 15s linear infinite; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .glitch-text { animation: glitch 0.5s infinite; }
        @keyframes glitch { 0% { transform: translate(0) } 20% { transform: translate(-2px, 2px) } 40% { transform: translate(-2px, -2px) } 60% { transform: translate(2px, 2px) } 80% { transform: translate(2px, -2px) } 100% { transform: translate(0) } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
        .font-handwriting { font-family: 'Permanent Marker', cursive; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
      <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden touch-none">
        <div className="crt-overlay absolute inset-0"></div>
        <div className="scanline"></div>
      </div>
      
      {/* Three-stage render: Landing -> Boot -> OS */}
      {appState === 'landing' && <LandingPage onEnter={() => setAppState('booting')} onQuickAccess={handleQuickAccess} />}
      {appState === 'booting' && <BootSequence onComplete={() => setAppState('ready')} />}
      {appState === 'ready' && <OSInterface reboot={() => { setInitialSection('home'); setAppState('landing'); }} initialSection={initialSection} />}
      
      {/* Ambient Music Player - Available on all screens */}
      {appState === 'ready' && <AmbientMusicPlayer />}
      
      {/* Cookie Consent Banner - GDPR/CCPA Compliant */}
      <CookieConsentBanner />
    </div>
  );
}




