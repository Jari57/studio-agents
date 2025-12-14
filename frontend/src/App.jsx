import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, Play, Pause, Rewind, ShoppingBag, Radio, ShieldAlert, Phone, Disc, Cpu, 
  X, Maximize2, Minus, FileText, Film, Mic, MessageSquare, Sparkles, Music, Video, 
  Share2, Heart, MessageCircle, CreditCard, Lock, Truck, CheckCircle, MapPin, 
  Calendar, Ticket, Flame, Search, Database, Globe, Newspaper, ExternalLink, User, 
  Hash, Grid, Headphones, Activity, Zap, Wallet, Power, Sliders, Briefcase, 
  RefreshCw, ToggleLeft, ToggleRight, Filter, Plus, Trash2, Edit2, Upload,
  Camera, TrendingUp, Users, Image as ImageIcon, Link as LinkIcon, Loader2,
  Info, Volume2, HelpCircle, Eye, Volume1, VolumeX
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

const callGemini = async (prompt, systemInstruction = "", useSearch = false) => {
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
  if (prompt.includes("Album Cover")) {
    // Route through backend instead of direct API call
    for (let i = 0; i <= delays.length; i++) {
      try {
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: sanitizedPrompt, systemInstruction: "Generate an album cover image description" })
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
        body: JSON.stringify({ prompt: sanitizedPrompt, systemInstruction: sanitizedSystemInstruction }),
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
const PaywallModal = ({ onClose, onUpgrade }) => {
  const { PRICING_TIERS, tier: currentTier } = useSubscription();
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 p-6 md:p-8" style={{WebkitOverflowScrolling: 'touch'}}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
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
                onClick={() => onUpgrade(key)}
                disabled={key === currentTier}
                className={`w-full py-3 font-bold uppercase tracking-wider transition-all ${
                  key === currentTier 
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-black hover:shadow-[0_0_30px_rgba(0,255,255,0.4)]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {key === currentTier ? 'Current Plan' : key === 'free' ? 'Start Free' : 'Subscribe'}
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

// 2. HOME
const Home = ({ setSection }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  const homeCarouselImages = [
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1600&h=900&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576186726580-a816e8b12896?w=1600&h=900&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=1600&h=900&fit=crop&q=80',
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=1600&h=900&fit=crop&q=80'
  ];

  const widgets = [
    {
      id: 'ghostwriter',
      title: 'GHOST',
      subtitle: 'AI_LYRIC_ENGINE',
      icon: Sparkles,
      color: 'text-[#00ff41]',
      borderColor: 'border-[#00ff41]',
      hoverBg: 'hover:bg-[#00ff41]/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(0,255,65,0.3)]',
      content: 'GENERATE VERSES',
      action: () => setSection('ghostwriter')
    },
    {
      id: 'chat',
      title: 'CIPHER',
      subtitle: 'AI_CONVERSATION',
      icon: MessageSquare,
      color: 'text-cyan-500',
      borderColor: 'border-cyan-500',
      hoverBg: 'hover:bg-cyan-500/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]',
      content: 'TALK TO AI',
      action: () => setSection('chat')
    },
    {
      id: 'battle',
      title: 'BATTLE',
      subtitle: 'RAP_COMPETITION',
      icon: Mic,
      color: 'text-pink-500',
      borderColor: 'border-pink-500',
      hoverBg: 'hover:bg-pink-500/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]',
      content: 'CHALLENGE AI',
      action: () => setSection('battle')
    },
    {
      id: 'ar_suite',
      title: 'A&R',
      subtitle: 'ARTIST_DEVELOPMENT',
      icon: User,
      color: 'text-purple-500',
      borderColor: 'border-purple-500',
      hoverBg: 'hover:bg-purple-500/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
      content: 'CAREER INSIGHTS',
      action: () => setSection('ar_suite')
    },
    {
      id: 'crates',
      title: 'CRATE',
      subtitle: 'SAMPLE_DISCOVERY',
      icon: Disc,
      color: 'text-yellow-500',
      borderColor: 'border-yellow-500',
      hoverBg: 'hover:bg-yellow-500/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]',
      content: 'DIG FOR SOUNDS',
      action: () => setSection('crates')
    },
    {
      id: 'viral_video',
      title: 'VIRAL',
      subtitle: 'VIDEO_CONCEPTS',
      icon: Video,
      borderColor: 'border-red-500',
      color: 'text-red-500',
      hoverBg: 'hover:bg-red-500/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
      content: 'CREATE VIDEOS',
      action: () => setSection('viral_video')
    }
  ];

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden flex flex-col font-sans" style={{WebkitOverflowScrolling: 'touch'}}>
      <BackgroundCarousel images={homeCarouselImages} />
      
      <div className="relative z-30 flex-1 flex flex-col justify-between p-3 md:p-12 bg-gradient-to-t from-black via-transparent to-black/40 min-h-full max-w-[2400px] mx-auto w-full">
        
        {/* Top Section: Branding */}
        <div className="flex justify-between items-start w-full mb-4 md:mb-0">
          <div className="animate-fade-in">
            <h1 className="chrome-text text-4xl sm:text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none opacity-90 drop-shadow-2xl">
              Whip<br/>Montez
            </h1>
            <div className="flex items-center gap-2 mt-2 md:mt-4">
              <div className="h-[2px] w-8 md:w-12 bg-[#00ff41]"></div>
              <p className="text-[#00ff41] text-[9px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] font-mono bg-black/50 px-2">RESTORED_SESSION_2004</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 md:gap-4">
            <LivewireLogo />

            <div className="hidden md:block text-right">
               <div className="text-white font-mono text-xs opacity-50">SYSTEM_STATUS</div>
               <div className="text-[#00ff41] font-mono text-sm animate-pulse">ONLINE</div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[20px]"></div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 w-full pb-4">
          {widgets.map((widget, i) => (
            <div 
              key={widget.id}
              onClick={widget.action}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), widget.action())}
              tabIndex={0}
              role="button"
              aria-label={`${widget.content} - ${widget.subtitle}`}
              onMouseEnter={() => setHoveredItem(widget.title)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                group relative h-28 md:h-32 border-t-2 bg-black/80 backdrop-blur-md p-3 md:p-4 cursor-pointer transition-all duration-300
                flex flex-col justify-between overflow-hidden active:scale-95
                ${widget.borderColor} ${widget.hoverBg} ${widget.shadow} hover:-translate-y-2
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black
              `}
              style={{ [widget.borderColor.replace('border-', 'ringColor')]: widget.color }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>
              
              <div className="flex justify-between items-start relative z-10">
                 <widget.icon size={20} className={`md:w-6 md:h-6 ${widget.color} transition-transform group-hover:scale-110 duration-300`} />
                 <span className="text-[9px] md:text-[10px] font-mono text-gray-500 group-hover:text-white transition-colors">{String(i + 1).padStart(2, '0')}</span>
              </div>

              <div className="relative z-10">
                 <h3 className={`text-base md:text-xl font-black uppercase tracking-tight text-white leading-none mb-1 group-hover:tracking-widest transition-all duration-300`}>
                   {widget.title}
                 </h3>
                 <div className={`text-[8px] md:text-[9px] font-mono uppercase tracking-wider ${widget.color} truncate`}>
                   <>{'>'} {widget.subtitle}</>
                 </div>
              </div>

              <div className={`absolute -bottom-10 -right-10 w-20 h-20 md:w-24 md:h-24 ${widget.color.replace('text-', 'bg-')}/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            </div>
          ))}
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
    <div className="h-full w-full relative flex items-center justify-center p-2 md:p-4 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none"></div>
      
      {/* Main Profile Container - 2004 Flash Site Style */}
      <div className="relative z-30 w-full max-w-5xl h-[90vh] md:h-[85vh] bg-[#0f0f0f] border-2 border-[#333] flex flex-col md:flex-row shadow-2xl my-4">
        
        {/* Left Sidebar: ID Card / Navigation */}
        <div className="w-full md:w-80 bg-[#111] border-b md:border-r md:border-b-0 border-[#333] p-3 md:p-6 flex flex-row md:flex-col gap-3 md:gap-6 overflow-x-auto md:overflow-x-visible shrink-0">
           <div className="w-32 h-32 md:w-full md:aspect-square bg-[#222] border-4 border-[#333] relative overflow-hidden group shrink-0">
             <img 
               src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80" 
               className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-110 transition-transform duration-500" 
               alt="Whip Montez"
             />
             <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-[#00ff41] text-black text-[9px] md:text-xs font-bold px-1 md:px-2 py-0.5 animate-pulse">
                 ONLINE
             </div>
           </div>

           <div className="flex-1 md:flex-none space-y-1">
             <h2 className="text-lg md:text-2xl font-black text-white tracking-tighter uppercase">Whip Montez</h2>
             <p className="text-[#00ff41] font-mono text-[10px] md:text-xs">RED HOOK, BROOKLYN</p>
             <p className="text-gray-500 font-mono text-[10px] md:text-xs">LIVEWIRE RECORDS</p>
           
             <div className="hidden md:block md:flex-1 space-y-2 pt-4">
               <button onClick={() => setSection('music')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                   <Disc size={14}/> DISCOGRAPHY
               </button>
               <button onClick={() => setSection('tour')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                   <Calendar size={14}/> TOUR DATES
               </button>
               <button onClick={() => setSection('news')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                   <Newspaper size={14}/> NEWS
               </button>
               <button onClick={() => window.open('https://www.youtube.com/results?search_query=90s+hip+hop', '_blank')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                   <Video size={14}/> VIDEOS
               </button>
             </div>

             <div className="hidden md:block border-t border-[#333] pt-4 mt-4">
               <p className="text-[10px] text-gray-500 font-mono mb-2">MANAGEMENT:</p>
               <div className="text-xs text-white font-bold">JARI MONTEZ (Brother/Manager)</div>
               <div className="text-xs text-gray-400">jari@livewire-ent.com</div>
             </div>

             {/* Admin Login Section */}
             <div className="hidden md:block border-t border-[#333] pt-4 mt-4">
               <button 
                 onClick={() => setIsAdmin(!isAdmin)}
                 className={`w-full py-2 text-[10px] font-bold tracking-widest uppercase border transition-all ${
                   isAdmin ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'border-[#333] text-gray-600 hover:border-gray-400'
                 }`}
               >
                 {isAdmin ? 'ADMIN MODE: ON' : 'GALLERY ADMIN'}
               </button>
             </div>
           </div>
        </div>

        {/* Right Content: Bio Text & Stats */}
        <div className="flex-1 bg-[#0a0a0a] flex flex-col relative overflow-hidden min-h-0">
           {/* Header */}
           <div className="h-10 md:h-16 bg-[#00ff41] text-black px-3 md:p-4 flex justify-between items-center shrink-0">
             <h1 className="text-lg md:text-4xl font-black tracking-tighter">
               {viewMode === 'bio' ? 'OFFICIAL PROFILE' : viewMode === 'memory' ? 'MEMORY LANE' : 'THE STORY'}
             </h1>
             <div className="flex items-center gap-1">
               {/* Toggle Buttons */}
               <button
                 onClick={() => setViewMode('bio')}
                 className={`px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm font-black tracking-wider border-2 transition-all ${
                   viewMode === 'bio' 
                     ? 'bg-black text-[#00ff41] border-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.5)]' 
                     : 'bg-transparent text-black border-black hover:bg-black/10'
                 }`}
               >
                 BIO
               </button>
               <button
                 onClick={() => setViewMode('story')}
                 className={`px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm font-black tracking-wider border-2 transition-all ${
                   viewMode === 'story' 
                     ? 'bg-black text-[#00ff41] border-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.5)]' 
                     : 'bg-transparent text-black border-black hover:bg-black/10'
                 }`}
               >
                 <ShieldAlert size={14} className="inline mr-1" />
                 STORY
               </button>
               <button
                 onClick={() => setViewMode('memory')}
                 className={`px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm font-black tracking-wider border-2 transition-all ${
                   viewMode === 'memory' 
                     ? 'bg-black text-[#00ff41] border-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.5)]' 
                     : 'bg-transparent text-black border-black hover:bg-black/10'
                 }`}
               >
                 <Camera size={14} className="inline mr-1" />
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
                       <div className="text-[#00ff41]/70 text-xs font-mono tracking-[0.2em] md:tracking-[0.6em] uppercase mb-4 animate-pulse">
                         Alternative Reality Experience
                       </div>
                       <h1 className="text-4xl md:text-6xl font-thin text-[#00ff41] tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,65,0.8)] mb-6">
                         WHIP MONTEZ
                       </h1>
                       <div className="h-[2px] w-32 bg-[#00ff41] shadow-[0_0_20px_#00ff41] mx-auto mb-4"></div>
                       <p className="text-white/60 text-sm tracking-[0.2em] md:tracking-[0.4em] uppercase">
                         The Restored Experience
                       </p>
                     </div>
                   </div>

                   {/* The Full Story */}
                   <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">
                     {/* Introduction */}
                     <div className="bg-gradient-to-r from-[#00ff41]/10 to-transparent border-l-4 border-[#00ff41] p-6">
                       <h2 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">
                         WHAT IS THIS?
                       </h2>
                       <p className="text-base md:text-lg font-mono leading-relaxed">
                         Welcome to the <strong className="text-[#00ff41]">WHIP MONTEZ: Restored OS</strong>—an Alternative Reality Experience (ARE) that resurrects a lost moment in hip-hop history. This isn't just a website. It's a digital time capsule, a reconstructed operating system from 2000-2004, built to honor an artist who never got her moment in the spotlight.
                       </p>
                     </div>

                     {/* The Artist's Story */}
                     <div>
                       <h3 className="text-xl md:text-2xl font-black text-[#00ff41] mb-4 uppercase tracking-wide border-b border-[#333] pb-2">
                         THE ARTIST WHO TIME FORGOT
                       </h3>
                       <p className="text-sm md:text-base">
                         <strong className="text-white">Whip Montez</strong> was real. Born Wanda Altagracia Almonte in Brooklyn's Red Hook Housing Projects, she was a Dominican-American MC who was on the verge of breaking through in the early 2000s. She collaborated with legends like <strong className="text-white">Erick Sermon</strong> and <strong className="text-white">Talib Kweli</strong>. She performed alongside <strong className="text-white">Mobb Deep</strong> and <strong className="text-white">Slum Village</strong>. She had the talent, the connections, and the drive.
                       </p>
                       <p className="text-sm md:text-base mt-4">
                         But her debut album, <em className="text-white">"Can't Nobody Whip Montez,"</em> never dropped. The industry moved on. Digital distribution was in its infancy. Independent artists without major label backing often disappeared without a trace. Whip Montez became one of hip-hop's countless "what ifs"—a brilliant artist whose music was never properly archived, celebrated, or remembered.
                       </p>
                       <p className="text-sm md:text-base mt-4 italic text-gray-400">
                         Until now.
                       </p>
                     </div>

                     {/* The Vision */}
                     <div className="bg-[#0a0a0a] border border-[#333] p-6 rounded">
                       <h3 className="text-xl md:text-2xl font-black text-[#00ff41] mb-4 uppercase tracking-wide">
                         THE VISION: RESTORING WHAT WAS LOST
                       </h3>
                       <p className="text-sm md:text-base">
                         This project was created by <strong className="text-white">Jari Montez</strong>, Whip's brother and former manager. After 20+ years, he's reconstructing the digital experience that never existed—the official website, the streaming presence, the interactive fan hub that Whip deserved but never had.
                       </p>
                       <p className="text-sm md:text-base mt-4">
                         Using cutting-edge AI technology and modern web development, we've built an <strong className="text-[#00ff41]">Alternative Reality Operating System</strong> that simulates what Whip's career might have looked like if the timing had been different. It's part memorial, part what-if scenario, part interactive art project.
                       </p>
                     </div>

                     {/* Why This Matters */}
                     <div>
                       <h3 className="text-xl md:text-2xl font-black text-[#00ff41] mb-4 uppercase tracking-wide border-b border-[#333] pb-2">
                         WHY THIS MATTERS
                       </h3>
                       <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-3">
                           <div className="flex items-start gap-3">
                             <div className="w-2 h-2 bg-[#00ff41] rounded-full mt-2 shrink-0"></div>
                             <div>
                               <strong className="text-white block mb-1">Preserving Lost Voices</strong>
                               <p className="text-xs md:text-sm text-gray-400">
                                 Countless talented artists from the pre-streaming era vanished without proper documentation. This project honors them all.
                               </p>
                             </div>
                           </div>
                           <div className="flex items-start gap-3">
                             <div className="w-2 h-2 bg-[#00ff41] rounded-full mt-2 shrink-0"></div>
                             <div>
                               <strong className="text-white block mb-1">Female Representation</strong>
                               <p className="text-xs md:text-sm text-gray-400">
                                 The early 2000s hip-hop scene was overwhelmingly male. Whip fought for her place and deserves to be remembered.
                               </p>
                             </div>
                           </div>
                         </div>
                         <div className="space-y-3">
                           <div className="flex items-start gap-3">
                             <div className="w-2 h-2 bg-[#00ff41] rounded-full mt-2 shrink-0"></div>
                             <div>
                               <strong className="text-white block mb-1">Tech Meets Art</strong>
                               <p className="text-xs md:text-sm text-gray-400">
                                 This experiment shows how AI and modern tools can resurrect and reimagine lost cultural moments.
                               </p>
                             </div>
                           </div>
                           <div className="flex items-start gap-3">
                             <div className="w-2 h-2 bg-[#00ff41] rounded-full mt-2 shrink-0"></div>
                             <div>
                               <strong className="text-white block mb-1">Family Legacy</strong>
                               <p className="text-xs md:text-sm text-gray-400">
                                 A brother's love letter to his sister—ensuring her story doesn't end in obscurity.
                               </p>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* The Features */}
                     <div className="bg-gradient-to-b from-[#0a0a0a] to-black border-t-4 border-b-4 border-[#00ff41] p-6 my-8">
                       <h3 className="text-xl md:text-2xl font-black text-white mb-6 uppercase tracking-wide text-center">
                         EXPLORE THE RESTORED OS
                       </h3>
                       <div className="grid md:grid-cols-3 gap-4">
                         <div className="bg-black/50 border border-[#333] p-4 hover:border-[#00ff41] transition-all group">
                           <div className="text-[#00ff41] mb-2"><Sparkles size={24} /></div>
                           <h4 className="text-white font-bold mb-2 group-hover:text-[#00ff41] transition-colors">AI GHOSTWRITER</h4>
                           <p className="text-xs text-gray-400">Generate custom verses in Whip's style using advanced AI trained on her lyrical patterns.</p>
                         </div>
                         <div className="bg-black/50 border border-[#333] p-4 hover:border-cyan-500 transition-all group">
                           <div className="text-cyan-500 mb-2"><MessageSquare size={24} /></div>
                           <h4 className="text-white font-bold mb-2 group-hover:text-cyan-500 transition-colors">SIDEKICK CIPHER</h4>
                           <p className="text-xs text-gray-400">Chat with an AI recreation of Whip's personality and perspective on hip-hop.</p>
                         </div>
                         <div className="bg-black/50 border border-[#333] p-4 hover:border-pink-500 transition-all group">
                           <div className="text-pink-500 mb-2"><Mic size={24} /></div>
                           <h4 className="text-white font-bold mb-2 group-hover:text-pink-500 transition-colors">RAP BATTLE</h4>
                           <p className="text-xs text-gray-400">Go bar-for-bar with an AI opponent in real-time freestyle battles.</p>
                         </div>
                         <div className="bg-black/50 border border-[#333] p-4 hover:border-purple-500 transition-all group">
                           <div className="text-purple-500 mb-2"><User size={24} /></div>
                           <h4 className="text-white font-bold mb-2 group-hover:text-purple-500 transition-colors">A&R OFFICE</h4>
                           <p className="text-xs text-gray-400">Get career advice, release strategies, and industry insights from AI.</p>
                         </div>
                         <div className="bg-black/50 border border-[#333] p-4 hover:border-yellow-500 transition-all group">
                           <div className="text-yellow-500 mb-2"><Disc size={24} /></div>
                           <h4 className="text-white font-bold mb-2 group-hover:text-yellow-500 transition-colors">CRATE DIGGER</h4>
                           <p className="text-xs text-gray-400">Discover obscure samples and production techniques from the golden era.</p>
                         </div>
                         <div className="bg-black/50 border border-[#333] p-4 hover:border-red-500 transition-all group">
                           <div className="text-red-500 mb-2"><Video size={24} /></div>
                           <h4 className="text-white font-bold mb-2 group-hover:text-red-500 transition-colors">VIRAL VIDEO AI</h4>
                           <p className="text-xs text-gray-400">Generate music video concepts and promotional content ideas.</p>
                         </div>
                       </div>
                     </div>

                     {/* Additional Features */}
                     <div>
                       <h3 className="text-xl md:text-2xl font-black text-[#00ff41] mb-4 uppercase tracking-wide border-b border-[#333] pb-2">
                         PLUS: AUTHENTIC 2000s EXPERIENCE
                       </h3>
                       <div className="space-y-4">
                         <div className="flex items-start gap-4 bg-[#0a0a0a] border-l-2 border-[#00ff41] p-4">
                           <Radio className="text-[#00ff41] shrink-0" size={20} />
                           <div>
                             <strong className="text-white block mb-1">Lost Tapes Audio Player</strong>
                             <p className="text-xs md:text-sm text-gray-400">Stream Whip's unreleased tracks with a retro Flash-style music player interface.</p>
                           </div>
                         </div>
                         <div className="flex items-start gap-4 bg-[#0a0a0a] border-l-2 border-cyan-500 p-4">
                           <Globe className="text-cyan-500 shrink-0" size={20} />
                           <div>
                             <strong className="text-white block mb-1">Live Hip-Hop News Feed</strong>
                             <p className="text-xs md:text-sm text-gray-400">Real-time entertainment news with trending social media posts from X, Reddit, Instagram.</p>
                           </div>
                         </div>
                         <div className="flex items-start gap-4 bg-[#0a0a0a] border-l-2 border-purple-500 p-4">
                           <ShoppingBag className="text-purple-500 shrink-0" size={20} />
                           <div>
                             <strong className="text-white block mb-1">Livewire Merch Store</strong>
                             <p className="text-xs md:text-sm text-gray-400">Browse vintage-style merchandise with Y2K aesthetic and secure checkout.</p>
                           </div>
                         </div>
                         <div className="flex items-start gap-4 bg-[#0a0a0a] border-l-2 border-pink-500 p-4">
                           <Camera className="text-pink-500 shrink-0" size={20} />
                           <div>
                             <strong className="text-white block mb-1">Memory Lane Gallery</strong>
                             <p className="text-xs md:text-sm text-gray-400">Archival photos from Red Hook, studio sessions, and live performances.</p>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* The Tech */}
                     <div className="bg-[#0a0a0a] border border-[#333] p-6 rounded">
                       <h3 className="text-xl md:text-2xl font-black text-[#00ff41] mb-4 uppercase tracking-wide">
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
                     <div className="border-t-2 border-b-2 border-[#00ff41] bg-gradient-to-r from-[#00ff41]/5 to-transparent p-6 my-8">
                       <div className="flex items-start gap-4">
                         <ShieldAlert className="text-[#00ff41] shrink-0" size={32} />
                         <div>
                           <h3 className="text-lg md:text-xl font-black text-white mb-3 uppercase">
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
                       <div className="h-[2px] w-32 bg-[#00ff41] shadow-[0_0_20px_#00ff41] mx-auto mb-6"></div>
                       <p className="text-base md:text-lg font-mono text-white/80 italic">
                         "This is for every artist who never got their shot.<br/>
                         For every voice that was silenced too soon.<br/>
                         For Whip Montez, and all the Lost Tapes."
                       </p>
                       <p className="text-sm text-[#00ff41] font-mono tracking-wider">
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
                 {/* Bio Header - Full Width */}
                 <div className="bg-black border-t-4 border-b-4 border-[#00ff41] p-5 md:p-6 mb-8">
                   <h2 className="text-2xl md:text-4xl font-black text-[#00ff41] mb-2 uppercase tracking-tight">
                     OFFICIAL PROFILE
                   </h2>
                   <p className="text-gray-400 text-xs md:text-sm font-mono">
                     Artist Bio • Stats • Career Highlights • Featured Photos
                   </p>
                 </div>

               <div className="max-w-2xl mx-auto space-y-4 md:space-y-8 px-3 md:px-8">
                 {/* Artist Statement */}
                 <blockquote className="border-l-4 border-[#00ff41] pl-6 py-2">
                   <p className="text-lg md:text-xl font-mono text-white leading-relaxed">
                      "I’ve paid my dues… I’ve developed my skills… I am ready."
                   </p>
                 </blockquote>

                 {/* Stats Grid */}
                 <div className="grid grid-cols-2 gap-3 md:gap-4 border-y border-[#333] py-4 md:py-6 my-4 md:my-6">
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

                   <h3 className="text-white text-base md:text-lg font-black uppercase tracking-wider border-b border-[#00ff41] pb-2 mb-4 mt-6">Breaking Barriers: Female Dominance in the Game</h3>
                   
                   <p>
                      In an era dominated by male voices, Whip Montez was carving out her own lane in hip-hop with an unapologetic confidence that couldn't be ignored. At a time when female MCs were expected to choose between being "hard" or "commercial," Whip refused to be boxed in. She brought raw lyricism, street credibility, and genuine storytelling to every track—proving that a woman from Red Hook could hold her own on any stage or cipher.
                   </p>

                   <p>
                      Her lyrical prowess wasn't just about matching the men bar for bar—it was about exceeding expectations and rewriting the rules. Whip's verses cut through the noise with precision, tackling everything from relationship dynamics to street politics, always with that signature Red Hook grit. She wasn't asking for a seat at the table; she was building her own and inviting others to join.
                   </p>

                   <p>
                      The early 2000s hip-hop scene was notoriously challenging for female artists, but Whip Montez thrived in that environment. Her performances alongside industry heavyweights like Mobb Deep and Slum Village weren't novelty acts—she earned those spots through undeniable talent and relentless work ethic. Crowds didn't just tolerate a female opening act; they became fans, recognizing that her energy and skill matched anyone in the game.
                   </p>

                   <h3 className="text-white text-base md:text-lg font-black uppercase tracking-wider border-b border-[#00ff41] pb-2 mb-4 mt-6">The Brother Behind The Vision</h3>
                   
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

                   <h3 className="text-white text-base md:text-lg font-black uppercase tracking-wider border-b border-[#00ff41] pb-2 mb-4 mt-8">Memories: The Journey in Pictures</h3>
                   
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

                   <p className="mt-8 text-[#00ff41] font-bold border-t border-[#333] pt-4">
                      {'>'} SYSTEM NOTE: Artist Profile Last Updated: DEC 12 2025
                   </p>
                 </div>
               </div>
               </>
             ) : (
               // MEMORY LANE GALLERY
               <div className="w-full min-h-full">
                 <div className="bg-black border-t-4 border-b-4 border-[#00ff41] p-5 md:p-6 mb-8">
                   <h2 className="text-2xl md:text-4xl font-black text-[#00ff41] mb-2 uppercase tracking-tight">
                     MEMORY LANE
                   </h2>
                   <p className="text-gray-400 text-xs md:text-sm font-mono">
                     Studio Sessions • Live Shows • Behind The Scenes • 2000-2004
                   </p>
                 </div>

                 {/* Admin Upload (only show if authenticated) */}
                 {isAdmin && (
                   <div className="bg-[#1a1a1a] border-2 border-[#00ff41] p-4 md:p-6 mb-6 md:mb-8">
                     <h3 className="text-[#00ff41] font-bold text-base md:text-lg mb-3 flex items-center gap-2 uppercase">
                       <Upload size={18} />
                       ADMIN: Upload Photo
                     </h3>
                     <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                       <input
                         type="file"
                         accept="image/*"
                         onChange={(e) => setUploadFile(e.target.files[0])}
                         className="flex-1 bg-[#0a0a0a] border border-[#00ff41] text-white px-3 py-2 text-sm font-mono"
                       />
                       <button
                         onClick={handleUpload}
                         disabled={!uploadFile || uploading}
                         className="bg-[#00ff41] text-black px-6 py-2 font-bold text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00cc33] transition-colors"
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
                         className="w-4 h-4 bg-[#0a0a0a] border-[#00ff41]"
                       />
                       <label htmlFor="featuredCheck" className="text-xs text-gray-300 font-mono cursor-pointer">
                         ⭐ Featured (Show in Bio section)
                       </label>
                     </div>
                     {uploadFile && (
                       <div className="mt-2 text-xs text-gray-300 font-mono">
                         Selected: {uploadFile.name}
                       </div>
                     )}
                   </div>
                 )}

                 {/* Photo Grid */}
                 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                   {photos.length > 0 ? (
                     photos.map((photo) => (
                       <div key={photo.id} className="group relative bg-[#111] border border-[#222] hover:border-[#00ff41]/50 transition-all duration-300 flex flex-col">
                         <div className="aspect-[3/4] overflow-hidden relative bg-[#050505]">
                           <img 
                             src={photo.url} 
                             alt={photo.caption || 'Memory'} 
                             className="w-full h-full object-cover opacity-90 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                           />
                           {/* Watermark */}
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="text-white/10 text-2xl md:text-4xl font-black uppercase tracking-widest transform rotate-[-25deg] select-none" style={{textShadow: '0 0 40px rgba(0,0,0,0.5)'}}>
                               RED HOOK
                             </div>
                           </div>
                           {/* Featured badge */}
                           {photo.featured && (
                             <div className="absolute top-2 left-2 bg-[#00ff41] text-black px-2 py-1 text-[9px] font-bold uppercase flex items-center gap-1">
                               ⭐ FEATURED
                             </div>
                           )}
                           {/* Admin toggle featured button */}
                           {isAdmin && (
                             <button
                               onClick={() => toggleFeatured(photo.id, photo.featured)}
                               className="absolute top-2 right-2 bg-black/80 hover:bg-black text-[#00ff41] p-2 text-xs font-bold border border-[#00ff41] opacity-0 group-hover:opacity-100 transition-opacity"
                               title={photo.featured ? 'Remove from Bio' : 'Add to Bio'}
                             >
                               {photo.featured ? '⭐' : '☆'}
                             </button>
                           )}
                           {/* Caption overlay */}
                           <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black via-black/80 to-transparent">
                             <div className="text-[#00ff41] text-xs md:text-sm font-mono font-bold uppercase tracking-wider">
                               {photo.caption || 'RED HOOK ARCHIVES'}
                             </div>
                             {photo.uploadedAt && (
                               <div className="text-gray-400 text-[9px] md:text-[10px] font-mono mt-1">
                                 {new Date(photo.uploadedAt).toLocaleDateString()}
                               </div>
                             )}
                           </div>
                         </div>
                         {/* Metadata below image */}
                         <div className="p-2 md:p-3 flex-1 flex flex-col justify-between bg-[#111]">
                           <div className="text-[10px] md:text-xs text-gray-400 font-mono truncate">
                             {photo.caption || 'Untitled Memory'}
                           </div>
                         </div>
                       </div>
                     ))
                   ) : (
                     // Placeholder grid
                     [...Array(24)].map((_, i) => (
                       <div key={i} className="group relative bg-[#111] border border-[#222] hover:border-[#00ff41]/30 transition-all duration-300 flex flex-col">
                         <div className="aspect-[3/4] overflow-hidden relative bg-[#050505]">
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <Camera size={48} className="mb-3 opacity-20 text-[#00ff41] group-hover:opacity-40 transition-opacity" />
                             <div className="text-sm md:text-base font-mono font-bold text-gray-600 group-hover:text-gray-500">SLOT {i + 1}</div>
                             <div className="text-[9px] md:text-xs font-mono opacity-50 mt-1 text-gray-700">Awaiting Upload</div>
                           </div>
                         </div>
                         <div className="p-2 md:p-3 bg-[#111]">
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
  const audioRef = useRef(null);
  const urlCacheRef = useRef({}); // Cache Firebase Storage URLs
  
  const albums = [
    {
      id: 'tape1',
      title: "LIVEWIRE SESSIONS",
      date: "FEB 14 2004",
      description: "The unreleased debut. Raw, boom-bap, recorded in Erick's basement.",
      color: "text-[#00ff41]", 
      tapeColor: "border-[#00ff41]",
      tracks: [
        { id: 101, title: "Freestyle (Kanye Beat)", duration: "2:15", date: "2004-02-14", video: true, audioUrl: "Whip Montez Kanye beat freestyle 4.mp3" },
        { id: 102, title: "Feat. Ali Vegas (50 Cent Beat)", duration: "3:42", date: "2004-03-01", video: false, audioUrl: "Whip Montez 50 Freestyle Whip_Veg.mp3" },
        { id: 103, title: "Sprung (Remix)", duration: "3:30", date: "2004-04-20", video: true, audioUrl: "Whip Montez SprungRemix_whip.mp3" },
        { id: 104, title: "Push It (Remix)", duration: "3:15", date: "2004-05-10", video: false, audioUrl: "Whip Montez Push it.mp3" },
        { id: 105, title: "Freestyle (Jim Jones Beat)", duration: "2:50", date: "2004-06-05", video: true, audioUrl: "Whip Montez Jim jones freestyle.mp3" }
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
        { id: 201, title: "Stand Up", duration: "2:50", date: "2002-09-11", video: true, audioUrl: "02 Stand Up.mp3" },
        { id: 202, title: "Brooklyn Anthem feat. Alfonzo Hunter", duration: "3:15", date: "2002-12-01", video: false, audioUrl: "Brooklyn Anthem feat. Alfonzo Hunter.mp3" },
        { id: 203, title: "Sit Back n Remain (Freestyle)", duration: "2:10", date: "2003-02-14", video: false, audioUrl: "Sit Back n Remain (freesstyle).mp3" },
        { id: 204, title: "YoungStar", duration: "1:20", date: "2003-07-04", video: false, audioUrl: "Whip Montez YoungStar.mp3" },
        { id: 205, title: "No Matter You Say", duration: "4:00", date: "2003-08-14", video: true, audioUrl: "No Matter You Say.mp3" }
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
        { id: 301, title: "U Catching Feelings", duration: "3:20", date: "2001-07-15", video: false, audioUrl: "U Catching Feelings.mp3" },
        { id: 302, title: "Only You", duration: "3:45", date: "2001-07-20", video: false, audioUrl: "Only You.mp3" },
        { id: 303, title: "Dear GOD", duration: "4:10", date: "2001-08-01", video: true, audioUrl: "Whip Montez Dear GOD.mp3" },
        { id: 304, title: "I Use to Love feat. Kia", duration: "3:55", date: "2001-08-10", video: false, audioUrl: "Whip Montez Feat. Kia I use to love.mp3" },
        { id: 305, title: "It Gets Hard", duration: "3:30", date: "2001-08-15", video: false, audioUrl: "08 It gets hard.mp3" }
      ]
    }
  ];

  // Load audio when track changes ONLY
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    const audio = audioRef.current;
    const shouldAutoPlay = isPlaying;
    let canPlayListener = null;
    
    const loadAndPlay = async () => {
      try {
        setAudioLoading(true);
        
        // Get the URL
        let url;
        if (storage && currentTrack.audioUrl) {
          const storageRef = ref(storage, currentTrack.audioUrl);
          url = await getDownloadURL(storageRef);
        } else {
          url = `/${currentTrack.audioUrl}`;
        }
        
        // Set source
        audio.src = url;
        
        // Wait for audio to be ready before playing
        canPlayListener = () => {
          setAudioLoading(false);
          if (shouldAutoPlay) {
            audio.play().catch(err => console.log("Play error:", err));
          }
        };
        
        audio.addEventListener('canplay', canPlayListener, { once: true });
        audio.load();
        
      } catch (err) {
        console.log("Audio load error, trying direct path:", err);
        audio.src = `/${currentTrack.audioUrl}`;
        
        canPlayListener = () => {
          setAudioLoading(false);
          if (shouldAutoPlay) {
            audio.play().catch(err => console.log("Play error:", err));
          }
        };
        
        audio.addEventListener('canplay', canPlayListener, { once: true });
        audio.load();
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

  const getLyricsForAlbum = (id) => {
    switch(id) {
      case 'tape1': return [
        { es: "Flow so cold it burns", en: "Reference to the Kanye beat intro", note: "Opening bars." },
        { es: "Ali Vegas on the track", en: "Queens meets Brooklyn", note: "The collaboration." }
      ];
      default: return [
        { es: "Buscando mi dinero", en: "Looking for my money", note: "Hustle culture." },
        { es: "Siempre leal", in: "Always loyal", note: "Livewire code." }
      ];
    }
  };

  const currentLyrics = getLyricsForAlbum(selectedAlbumId);

  return (
    <div className="h-full flex flex-col relative bg-[#0a0a0a] overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
      {/* Header */}
      <div className="h-10 md:h-12 border-b border-[#333] bg-[#111] flex items-center px-2 md:px-4 justify-between shrink-0">
        <div className="flex items-center gap-1 md:gap-2">
          <Disc size={14} className="md:w-[18px] md:h-[18px] text-[#00ff41]" />
          <span className="font-bold tracking-widest text-[10px] md:text-sm text-white">
            <span className="hidden sm:inline">EVIDENCE_LOCKER // </span>AUDIO_ARCHIVE
          </span>
        </div>
        <div className="text-[8px] md:text-[10px] font-mono text-gray-500 hidden sm:block">TOTAL_SIZE: 4.2GB</div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Video Modal */}
        {showVideoModal && (
          <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm">
            <div className="w-full max-w-3xl border-2 border-[#00ff41] bg-black shadow-[0_0_50px_rgba(0,255,65,0.2)] flex flex-col">
              <div className="h-7 md:h-8 bg-[#00ff41] flex items-center justify-between px-2">
                <span className="text-black font-bold text-[10px] md:text-xs font-mono">MEDIA_PLAYER_V1.EXE</span>
                <X size={14} className="md:w-4 md:h-4 text-black cursor-pointer hover:bg-white/20" onClick={() => setShowVideoModal(false)} />
              </div>
              <div className="aspect-video bg-[#111] relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                <div className="text-center">
                  <div className="text-[#00ff41] text-3xl md:text-4xl mb-4 animate-pulse"><Play size={48} className="md:w-16 md:h-16"/></div>
                  <p className="text-gray-500 font-mono text-xs md:text-sm">BUFFERING VIDEO FEED...</p>
                  <p className="text-gray-700 text-[10px] md:text-xs mt-2">SOURCE: {currentTrack?.title}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Album List - Hidden on mobile, shown on tablet+ */}
        <div className="hidden md:flex md:w-1/4 md:min-w-[200px] border-r border-[#333] bg-[#050505] flex-col">
          <div className="p-2 border-b border-[#333] bg-[#1a1a1a] text-[10px] text-gray-400 font-mono sticky top-0">DIRECTORY_TREE</div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {albums.map(album => (
              <div 
                key={album.id}
                onClick={() => setSelectedAlbumId(album.id)}
                className={`p-3 cursor-pointer border-l-2 transition-all group ${
                  selectedAlbumId === album.id ? `bg-[#111] ${album.color.replace('text-', 'border-')} border-l-4` : 'border-transparent hover:bg-[#111] hover:border-gray-600'
                }`}
              >
                <div className={`font-bold text-xs md:text-sm mb-1 group-hover:text-white ${selectedAlbumId === album.id ? 'text-white' : 'text-gray-400'}`}>{album.title}</div>
                <div className="text-[10px] font-mono text-gray-600 group-hover:text-gray-400">{album.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Album Selector - Dropdown on mobile */}
        <div className="md:hidden border-b border-[#333] bg-[#050505] p-2">
          <select 
            value={selectedAlbumId}
            onChange={(e) => setSelectedAlbumId(e.target.value)}
            className="w-full bg-[#111] border border-[#333] text-white p-2 text-sm font-mono focus:border-[#00ff41] focus:outline-none"
          >
            {albums.map(album => (
              <option key={album.id} value={album.id}>{album.title}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex flex-col bg-black/80 overflow-hidden">
          <div className="p-3 md:p-4 border-b border-[#333] bg-[#0a0a0a]">
            <h2 className={`text-xl md:text-4xl font-black chrome-text mb-1 md:mb-2`}>{activeAlbum.title}</h2>
            <p className="text-gray-400 font-mono text-[10px] md:text-xs">{activeAlbum.description}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
            {/* Desktop: Table view */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead className="bg-[#111] text-[10px] text-gray-500 font-mono sticky top-0">
                <tr>
                  <th className="p-2 border-b border-[#333] w-10">#</th>
                  <th className="p-2 border-b border-[#333]">TITLE</th>
                  <th className="p-2 border-b border-[#333] w-24">CREATED</th>
                  <th className="p-2 border-b border-[#333] text-right w-16">MEDIA</th>
                </tr>
              </thead>
              <tbody>
                {activeAlbum.tracks.map((track, i) => (
                  <tr 
                    key={track.id}
                    className={`group cursor-pointer text-xs md:text-sm font-mono transition-colors ${currentTrack?.id === track.id ? 'bg-[#00ff41]/20 text-[#00ff41]' : 'hover:bg-[#111] text-gray-300'}`}
                  >
                    <td className="p-3 border-b border-[#333]/50 text-gray-600 group-hover:text-white" onClick={() => handleTrackClick(track)}>
                      {currentTrack?.id === track.id && isPlaying ? <div className="animate-pulse text-[#00ff41]">▶</div> : (i + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="p-3 border-b border-[#333]/50 font-bold" onClick={() => handleTrackClick(track)}>{track.title}</td>
                    <td className="p-3 border-b border-[#333]/50 text-gray-600 font-mono text-[10px]">{track.date}</td>
                    <td className="p-3 border-b border-[#333]/50 text-right">
                      {track.video && (
                        <Video 
                          size={14} 
                          className="inline text-gray-500 hover:text-[#00ff41] transition-colors"
                          onClick={(e) => { e.stopPropagation(); setCurrentTrack(track); setShowVideoModal(true); }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile: Card view */}
            <div className="md:hidden">
              {activeAlbum.tracks.map((track, i) => (
                <div
                  key={track.id}
                  onClick={() => handleTrackClick(track)}
                  className={`p-4 border-b border-[#333]/50 cursor-pointer transition-colors ${
                    currentTrack?.id === track.id ? 'bg-[#00ff41]/20' : 'active:bg-[#111]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-mono ${currentTrack?.id === track.id ? 'text-[#00ff41]' : 'text-gray-600'}`}>
                      {currentTrack?.id === track.id && isPlaying ? (
                        <div className="animate-pulse text-[#00ff41] text-base">▶</div>
                      ) : (
                        (i + 1).toString().padStart(2, '0')
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${currentTrack?.id === track.id ? 'text-[#00ff41]' : 'text-gray-300'}`}>
                        {track.title}
                      </div>
                      <div className="text-[10px] font-mono text-gray-600 mt-0.5">{track.date}</div>
                    </div>
                    {track.video && (
                      <Video 
                        size={16} 
                        className="text-gray-500 shrink-0"
                        onClick={(e) => { e.stopPropagation(); setCurrentTrack(track); setShowVideoModal(true); }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-1/3 min-w-[300px] border-l border-[#333] bg-[#080808] flex flex-col hidden md:flex">
          {/* Alpine-style Deck */}
          <div className="p-6 bg-[#111] border-b border-[#333]">
             <div className="bg-[#0f281f] border-2 border-[#333] rounded-sm p-4 shadow-inner relative overflow-hidden h-32 flex flex-col justify-between mb-4">
                {/* Loading Overlay */}
                {audioLoading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-pulse">
                    <Disc size={32} className="text-emerald-400 animate-spin mb-2" style={{ animationDuration: '1s' }} />
                    <div className="text-emerald-400 text-xs font-mono tracking-wider">LOADING AUDIO...</div>
                    <div className="flex gap-1 mt-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_50%,rgba(0,0,0,0)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                <div className="flex justify-between text-[10px] text-emerald-600/60 font-mono">
                    <span>SRC: TAPE</span>
                    <span>VOL: 24</span>
                </div>
                <div className="font-mono text-emerald-400 text-lg whitespace-nowrap overflow-hidden">
                    <span className={`block ${isPlaying ? 'animate-marquee' : ''}`}>{currentTrack ? `${currentTrack.title} - WHIP MONTEZ` : "INSERT CASSETTE..."}</span>
                </div>
                <div className="w-full flex gap-0.5 items-end justify-center h-10">
                   {[...Array(32)].map((_, i) => (
                     <div 
                        key={i} 
                        className={`w-1.5 bg-emerald-500/80 ${isPlaying ? 'animate-pulse' : ''}`} 
                        style={{ 
                          height: isPlaying ? `${20 + Math.random() * 60}%` : '2px', 
                          opacity: 0.5 + Math.random() * 0.5,
                          animationDuration: `${0.2 + Math.random() * 0.5}s`
                        }} 
                     />
                   ))}
                </div>
             </div>
             
             <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={handlePrevious}
                  onTouchEnd={(e) => { e.preventDefault(); handlePrevious(); }}
                  className="bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center text-[#666] hover:text-[#00ff41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  <Rewind size={16}/>
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  onTouchEnd={(e) => { e.preventDefault(); if (!audioLoading && currentTrack) setIsPlaying(!isPlaying); }}
                  className={`bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation ${
                    audioLoading ? 'text-emerald-400 cursor-wait' : 'text-[#666] hover:text-[#00ff41]'
                  }`}
                  disabled={audioLoading || !currentTrack}
                >
                  {audioLoading ? <Loader2 size={16} className="animate-spin"/> : isPlaying ? <Pause size={16}/> : <Play size={16}/>}
                </button>
                <button 
                  onClick={handleStop}
                  onTouchEnd={(e) => { e.preventDefault(); handleStop(); }}
                  className="bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center text-[#666] hover:text-[#00ff41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  <div className="w-3 h-3 bg-current rounded-sm"></div>
                </button>
                <button 
                  onClick={handleNext}
                  onTouchEnd={(e) => { e.preventDefault(); handleNext(); }}
                  className="bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center text-[#666] hover:text-[#00ff41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  <div className="flex"><Play size={10}/><Play size={10}/></div>
                </button>
             </div>
          </div>

          <div className="flex-1 p-4 bg-black/90 relative overflow-hidden">
            <div className={`absolute top-0 right-0 ${activeAlbum.color.replace('text-', 'bg-')} text-black text-[10px] font-bold px-2 py-1`}>DECODER_V2.0</div>
            <h3 className="text-sm font-bold mb-4 text-gray-300 flex items-center gap-2"><Terminal size={12}/> LYRIC_ANALYSIS</h3>
            <div className="space-y-4">
              {currentLyrics.map((line, i) => (
                <div key={i} className="group cursor-help">
                  <div className="text-white font-mono text-sm border-b border-dashed border-gray-700 pb-1 group-hover:border-[#00ff41] group-hover:text-[#00ff41] transition-colors">"{line.es}"</div>
                  <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                    <div className="pt-2 pl-2 border-l-2 border-[#00ff41] mt-1">
                      <div className="text-gray-400 text-xs font-bold">EN: {line.en}</div>
                      <div className="text-gray-600 text-[10px] italic">NOTE: {line.note}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center mt-8 text-gray-700 text-[10px]">HOVER TO TRANSLATE</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
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
    <div className="h-full w-full relative flex items-center justify-center p-2 md:p-4 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/70 z-10 pointer-events-none"></div>
      <div className="relative z-30 w-full max-w-5xl h-[85vh] bg-[#111] border border-[#333] shadow-2xl flex flex-col font-sans my-4">
        <div className="bg-[#2d2d2d] text-gray-400 px-2 py-1 flex justify-between items-center border-b border-[#444] shadow-none">
           <div className="flex items-center gap-2">
             <Globe size={14} className="text-[#00ff41]"/>
             <span className="text-[10px] md:text-xs font-bold text-gray-300 font-sans"><span className="hidden sm:inline">TicketHub 2004 - </span>Livewire Events</span>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#050505] p-0 text-gray-300">
           <div className="bg-[#111] text-white p-3 md:p-4 border-b-2 border-[#00ff41] flex justify-between items-end">
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
  // Fallback Data if Firebase Unavailable
  const fallbackItems = [
      { id: 'm1', name: "Livewire Official Tee - Black", category: "Shirts", price: 35, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80", desc: "Classic Logo Black" },
      { id: 'm2', name: "Whip Montez Red Hook Hoodie", category: "Hoodies", price: 85, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80", desc: "Heavyweight Cotton" },
      { id: 'm3', name: "Livewire Cargo Pants", category: "Pants", price: 95, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80", desc: "Tactical Pockets" },
      { id: 'm4', name: "Whip Tour Backpack '04", category: "Bags", price: 60, image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500&q=80", desc: "Canvas Rucksack" },
      { id: 'm5', name: "Graffiti Logo Joggers", category: "Pants", price: 70, image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&q=80", desc: "All-over Print" },
      { id: 'm6', name: "Whip Montez Bandana Pack", category: "Accessories", price: 20, image: "https://images.unsplash.com/photo-1616956873272-942c9f86d1e3?w=500&q=80", desc: "3 Colors" },
      { id: 'm7', name: "Livewire Velour Track Top", category: "Hoodies", price: 110, image: "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=500&q=80", desc: "Navy Blue" },
      { id: 'm8', name: "Whip Montez Snapback Hat", category: "Accessories", price: 30, image: "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=500&q=80", desc: "Embroidered Logo" },
      { id: 'm9', name: "Livewire 2004 Album Tee", category: "Shirts", price: 40, image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&q=80", desc: "Album Art Print" },
      { id: 'm10', name: "Red Hook Bomber Jacket", category: "Jackets", price: 150, image: "https://images.unsplash.com/photo-1520367691844-1049d43e9340?w=500&q=80", desc: "Heavy Satin Shell" },
      { id: 'm11', name: "Montez Skull Beanie", category: "Accessories", price: 25, image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&q=80", desc: "Winter Wear" },
      { id: 'm12', name: "Livewire Utility Vest", category: "Jackets", price: 90, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&q=80", desc: "Multi-Pocket" },
      { id: 'm13', name: "Whip Cropped Tee", category: "Shirts", price: 30, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80", desc: "Female Fit" },
      { id: 'm14', name: "Montez Logo Socks", category: "Accessories", price: 15, image: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=500&q=80", desc: "Mid-Calf" },
      { id: 'm15', name: "Digital Camo Hoodie", category: "Hoodies", price: 90, image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80", desc: "Digital Print" },
      { id: 'm16', name: "Signature Wristband Set", category: "Accessories", price: 25, image: "https://images.unsplash.com/photo-1611652022419-a9419f74343a?w=500&q=80", desc: "Livewire x Montez" },
      { id: 'm17', name: "Whip Montez Denim Jacket", category: "Jackets", price: 140, image: "https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=500&q=80", desc: "Vintage Wash" },
      { id: 'm18', name: "Brooklyn Nights Long Sleeve", category: "Shirts", price: 45, image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80", desc: "Thermal Cotton" },
      { id: 'm19', name: "Montez Chain Link Bracelet", category: "Accessories", price: 55, image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500&q=80", desc: "Stainless Steel" },
      { id: 'm20', name: "Red Hook Crewneck", category: "Hoodies", price: 75, image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500&q=80", desc: "Embroidered Logo" },
      { id: 'm21', name: "Livewire Track Jacket", category: "Jackets", price: 120, image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&q=80", desc: "Retro Stripes" },
      { id: 'm22', name: "Whip Montez Tank Top", category: "Shirts", price: 28, image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=500&q=80", desc: "Summer Edition" },
      { id: 'm23', name: "Brooklyn Born Duffle Bag", category: "Bags", price: 85, image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=500&q=80", desc: "Gym & Travel" },
      { id: 'm24', name: "Montez Logo Bucket Hat", category: "Accessories", price: 35, image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80", desc: "Reversible" },
      { id: 'm25', name: "Livewire Windbreaker", category: "Jackets", price: 95, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80", desc: "Water Resistant" },
      { id: 'm26', name: "Red Hook Sweatpants", category: "Pants", price: 65, image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&q=80", desc: "Relaxed Fit" },
      { id: 'm27', name: "Whip Montez Crossbody Bag", category: "Bags", price: 50, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&q=80", desc: "Urban Essential" },
      { id: 'm28', name: "Brooklyn Camo Shorts", category: "Pants", price: 55, image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80", desc: "Summer Wear" },
      { id: 'm29', name: "Livewire Zip Hoodie", category: "Hoodies", price: 95, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80", desc: "Full Front Zip" },
      { id: 'm30', name: "Montez Era Tour Tee '04", category: "Shirts", price: 50, image: "https://images.unsplash.com/photo-1571542617696-6136d2c4760d?w=500&q=80", desc: "Limited Edition" }
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
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end" onClick={(e) => e.target === e.currentTarget && setIsCartOpen(false)}>
          <div className="w-full sm:max-w-md bg-[#111] border-l border-[#333] shadow-2xl flex flex-col h-full animate-slide-in-right">
            <div className="h-12 md:h-16 border-b border-[#333] flex items-center justify-between px-3 md:px-6 shrink-0">
              <h2 className="text-base md:text-xl font-black uppercase tracking-tighter text-white">CART ({cart.length})</h2>
              <button onClick={() => setIsCartOpen(false)} onTouchEnd={(e) => { e.preventDefault(); setIsCartOpen(false); }} className="touch-manipulation"><X size={20} className="text-gray-400 hover:text-white"/></button>
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
          
          {/* IMAGE LAB */}
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

// LEGACY: Redirect Ghostwriter to Studio
const Ghostwriter = () => {
  return <Studio />;
};

// THE COME UP - Inspiration for artists who didn't make it or want to make it
const TheComeUp = ({ setSection }) => {
  const [activeTab, setActiveTab] = useState('legends');
  const [currentQuote, setCurrentQuote] = useState(0);
  const [userStory, setUserStory] = useState('');
  const [submittedStories, setSubmittedStories] = useState([]);

  // Legends who almost didn't make it or didn't get their flowers
  const legends = [
    {
      id: 1,
      name: "Big L",
      years: "1974 - 1999",
      story: "Harlem's finest wordsmith was on the verge of mainstream success when his life was cut short. His punchlines and metaphors influenced every rapper after him. He never saw his legend grow, but the streets never forgot.",
      quote: "I wasn't put on this Earth to be second.",
      lesson: "Your impact outlives your time. Keep creating.",
      image: "🎤"
    },
    {
      id: 2,
      name: "Sean Price",
      years: "1972 - 2015",
      story: "Struggled for decades in the underground. Never got the mainstream shine but became a cult hero. Boot Camp Clik legend who influenced a generation of raw, uncut hip-hop.",
      quote: "I'm not cocky, I'm confident.",
      lesson: "Stay true to your sound. Your people will find you.",
      image: "👑"
    },
    {
      id: 3,
      name: "Pimp C",
      years: "1973 - 2007",
      story: "UGK spent 15 years grinding before 'International Players Anthem' crossed over. Pimp C didn't get to fully enjoy the recognition he fought for. His influence on Southern rap is immeasurable.",
      quote: "Real recognize real.",
      lesson: "The grind takes time. Stay patient, stay hungry.",
      image: "🔥"
    },
    {
      id: 4,
      name: "Freaky Tah",
      years: "1971 - 1999",
      story: "Lost Boys member who helped define the raw Brooklyn sound. Taken too soon before seeing his full potential realized. His energy lives on in every BK MC.",
      quote: "Brooklyn! Keep it moving!",
      lesson: "Your energy is contagious. Inspire others.",
      image: "⚡"
    },
    {
      id: 5,
      name: "Capital STEEZ",
      years: "1993 - 2012",
      story: "Pro Era's brightest mind, gone at 19. His verses showed wisdom beyond his years. Joey Bada$$ and the crew carry his legacy, but the world missed what he could have become.",
      quote: "I got my third eye open.",
      lesson: "Your mind is your greatest gift. Use it.",
      image: "👁️"
    },
    {
      id: 6,
      name: "Mac Dre",
      years: "1970 - 2004",
      story: "Pioneer of the hyphy movement, recorded an album from PRISON via phone calls. Never saw the Bay Area style go global, but his influence is everywhere.",
      quote: "Thizzle dance!",
      lesson: "Create your own lane. Others will follow.",
      image: "🌉"
    }
  ];

  // Motivational quotes from the struggle
  const motivationalQuotes = [
    { text: "I sold CDs out my trunk. Nobody believed. Now they all 'believers.'", artist: "The Journey" },
    { text: "They said the industry was closed. So I built my own door.", artist: "The Grind" },
    { text: "Every 'no' is just 'not yet.' Keep knocking.", artist: "The Hustle" },
    { text: "The studio was my church. Late nights were my prayers.", artist: "The Faith" },
    { text: "Broke don't mean broken. It means you're building.", artist: "The Vision" },
    { text: "They'll doubt you until they can't ignore you.", artist: "The Rise" },
    { text: "Your story is your superpower. Tell it.", artist: "The Voice" },
    { text: "The come up ain't pretty, but it's beautiful.", artist: "The Truth" },
    { text: "Past struggles become future lessons. Keep going.", artist: "Whip Montez" },
    { text: "From the bottom, you can only go up. Remember that.", artist: "Red Hook Philosophy" }
  ];

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 8000);
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
    ].slice(0, 20); // Keep last 20
    setSubmittedStories(newStories);
    localStorage.setItem('comeup_stories', JSON.stringify(newStories));
    setUserStory('');
  };

  return (
    <div className="h-full w-full bg-black text-[#00ff41] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Motivational Quote Banner */}
      <div className="bg-gradient-to-r from-[#001100] via-[#002200] to-[#001100] border-b border-[#00ff41]/30 p-4 md:p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#00ff41]/50 mb-3 animate-pulse">
            Daily Inspiration
          </p>
          <p className="text-lg md:text-2xl font-light italic text-white/90 mb-2 transition-all duration-500">
            "{motivationalQuotes[currentQuote].text}"
          </p>
          <p className="text-[#00ff41] text-xs uppercase tracking-wider">
            — {motivationalQuotes[currentQuote].artist}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">
            THE <span className="text-[#00ff41]">COME UP</span>
          </h1>
          <p className="text-[#00ff41]/70 text-sm md:text-base max-w-2xl mx-auto">
            Honoring those who paved the way, remembering those we lost too soon, and inspiring those still on the journey. 
            Past meets present. Struggle meets success.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {[
            { id: 'legends', label: 'Gone Too Soon', icon: '🕯️' },
            { id: 'lessons', label: 'The Lessons', icon: '📖' },
            { id: 'stories', label: 'Your Story', icon: '✍️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs md:text-sm font-mono uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00ff41] text-black'
                  : 'border border-[#00ff41]/50 text-[#00ff41] hover:bg-[#00ff41]/10'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* LEGENDS TAB - Gone Too Soon */}
        {activeTab === 'legends' && (
          <div className="space-y-6">
            <p className="text-center text-white/60 text-sm mb-6">
              These artists didn't get their flowers. But their spirit lives in every bar we write.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {legends.map((legend) => (
                <div
                  key={legend.id}
                  className="bg-[#0a0a0a] border border-[#00ff41]/30 p-5 hover:border-[#00ff41] transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{legend.image}</div>
                    <div className="flex-1">
                      <h3 className="text-white text-lg font-bold group-hover:text-[#00ff41] transition-colors">
                        {legend.name}
                      </h3>
                      <p className="text-[#00ff41]/60 text-xs font-mono mb-2">{legend.years}</p>
                      <p className="text-white/70 text-sm leading-relaxed mb-3">{legend.story}</p>
                      <div className="bg-[#001a00] border-l-2 border-[#00ff41] p-3 mb-2">
                        <p className="text-[#00ff41] text-sm italic">"{legend.quote}"</p>
                      </div>
                      <p className="text-yellow-500/80 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={12} /> {legend.lesson}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LESSONS TAB - Wisdom for the Journey */}
        {activeTab === 'lessons' && (
          <div className="space-y-6">
            <p className="text-center text-white/60 text-sm mb-6">
              Hard-earned wisdom from the struggle. These lessons cost everything.
            </p>
            
            {/* Lesson Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { 
                  title: "The 10,000 Hour Rule", 
                  content: "Before the deal, before the fame, there were 10,000 hours of writing, recording, and perfecting. Put in the work nobody sees.",
                  icon: "⏱️"
                },
                { 
                  title: "Own Your Masters", 
                  content: "The music industry is a business. Own your art, own your name, own your future. Don't sign away your legacy.",
                  icon: "📜"
                },
                { 
                  title: "Build Your Tribe", 
                  content: "No artist makes it alone. Find your people - the producers, the managers, the believers. Loyalty over everything.",
                  icon: "👥"
                },
                { 
                  title: "Document Everything", 
                  content: "The struggle IS the story. Record the journey. Those late nights, those rejections, those small wins. Future you will thank present you.",
                  icon: "📸"
                },
                { 
                  title: "Stay Hungry, Stay Humble", 
                  content: "Success changes people. Remember where you came from. The block remembers. Your real ones remember.",
                  icon: "🙏"
                },
                { 
                  title: "Your Voice Matters", 
                  content: "Don't try to sound like anyone else. Your unique perspective, your neighborhood, your pain - that's your superpower.",
                  icon: "🎤"
                },
                { 
                  title: "Mental Health Is Real", 
                  content: "The pressure is real. Check in on yourself. Check in on your people. It's okay to not be okay.",
                  icon: "💚"
                },
                { 
                  title: "Past & Present", 
                  content: "Study the legends, but don't live in the past. Take what they built and push it forward. Evolution, not imitation.",
                  icon: "🔄"
                }
              ].map((lesson, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-[#0a0a0a] to-[#001100] border border-[#00ff41]/20 p-5 hover:border-[#00ff41]/60 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{lesson.icon}</span>
                    <h3 className="text-[#00ff41] font-bold uppercase tracking-wider">{lesson.title}</h3>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{lesson.content}</p>
                </div>
              ))}
            </div>

            {/* Whip Montez Quote */}
            <div className="mt-8 bg-gradient-to-r from-[#002200] via-[#003300] to-[#002200] border border-[#00ff41]/50 p-6 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#00ff41]/50 mb-3">From Whip Montez</p>
              <p className="text-xl md:text-2xl text-white font-light italic mb-3">
                "Red Hook made me. The struggle shaped me. The music saved me. Now I'm here to tell the story - past and present."
              </p>
              <p className="text-[#00ff41] text-sm">— The Livewire Sessions, 2004</p>
            </div>
          </div>
        )}

        {/* YOUR STORY TAB */}
        {activeTab === 'stories' && (
          <div className="space-y-6">
            <p className="text-center text-white/60 text-sm mb-6">
              Every artist has a story. This is a space for yours. Share the struggle, inspire the next generation.
            </p>

            {/* Submit Story */}
            <div className="bg-[#0a0a0a] border border-[#00ff41]/30 p-5">
              <h3 className="text-[#00ff41] font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <Edit2 size={16} /> Share Your Come Up Story
              </h3>
              <textarea
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder="Tell us about your journey... The late nights, the doubts, the breakthroughs. What keeps you going?"
                className="w-full h-32 bg-black border border-[#00ff41]/30 text-white p-4 outline-none resize-none focus:border-[#00ff41] placeholder:text-white/30 font-mono text-sm"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[#00ff41]/50 text-xs">{userStory.length}/500</span>
                <button
                  onClick={handleSubmitStory}
                  disabled={!userStory.trim()}
                  className="px-4 py-2 bg-[#00ff41] text-black font-bold uppercase text-xs tracking-wider hover:bg-[#00cc33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Share Story
                </button>
              </div>
            </div>

            {/* Community Stories */}
            <div>
              <h3 className="text-white font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users size={16} className="text-[#00ff41]" /> Community Stories
              </h3>
              {submittedStories.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#00ff41]/30">
                  <p className="text-white/50 text-sm">No stories yet. Be the first to share.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submittedStories.map((story) => (
                    <div key={story.id} className="bg-[#0a0a0a] border-l-2 border-[#00ff41] p-4">
                      <p className="text-white/80 text-sm leading-relaxed">{story.text}</p>
                      <p className="text-[#00ff41]/50 text-xs mt-2 font-mono">
                        {new Date(story.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Call to Action */}
            <div className="text-center py-8 border-t border-[#00ff41]/20">
              <p className="text-[#00ff41] text-lg font-bold mb-2">You're Not Alone</p>
              <p className="text-white/60 text-sm max-w-lg mx-auto">
                Every legend started somewhere. Every hit was once an idea in a bedroom studio. 
                Keep going. The world needs your voice.
              </p>
              <button
                onClick={() => setSection('studio')}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all"
              >
                Enter The Studio →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-[#00ff41]/30 text-xs uppercase tracking-widest border-t border-[#00ff41]/10">
        Past & Present // Honor The Legends // Inspire The Future
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
    <div className="h-full w-full relative overflow-hidden bg-[#0a0a0a] font-mono flex flex-col">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-0 pointer-events-none"></div>
      
      {/* Header - Terminal Style */}
      <div className="relative z-10 border-b border-[#333] bg-[#111] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between px-3 md:px-6 py-2 md:py-0 md:h-16 gap-2 md:gap-0">
          <div className="flex items-center gap-2 md:gap-3">
             <Users size={16} className="md:w-5 md:h-5 text-[#00ff41]" />
             <h2 className="text-sm md:text-xl font-bold text-white tracking-wider md:tracking-widest uppercase">THE_BLOCK<span className="text-[#00ff41] animate-pulse">_FEED</span></h2>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:flex-initial md:w-64 flex items-center gap-2 bg-[#050505] border border-[#333] px-2 py-1">
              <Search size={12} className="text-[#00ff41] shrink-0"/>
              <input 
                type="text" 
                placeholder="SEARCH POSTS..."
                className="flex-1 bg-transparent text-white text-xs font-mono outline-none placeholder-gray-600 min-w-0"
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
              className="bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] px-2 md:px-4 py-1 font-bold text-[9px] md:text-xs flex items-center gap-1 md:gap-2 hover:bg-[#00ff41] hover:text-black transition-colors shrink-0"
            >
              <MessageSquare size={12} className="md:w-[14px] md:h-[14px]"/><span className="hidden sm:inline">PRIVATE MSG</span><span className="sm:hidden">MSG</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-3 md:p-6 max-w-4xl mx-auto w-full" style={{WebkitOverflowScrolling: 'touch'}}>
        <div className="space-y-3 md:space-y-6">
          
          {/* Input Area - Terminal Style */}
          <div className="border border-[#333] bg-[#050505] p-2 md:p-4 relative">
             <div className="text-[#00ff41] text-[10px] md:text-xs mb-1 md:mb-2">{'>'} INITIATE BROADCAST:</div>
             <textarea 
               value={newPost}
               onChange={(e) => setNewPost(e.target.value)}
               placeholder="Write to the block..." 
               className="w-full bg-[#111] border border-[#333] text-white text-xs md:text-sm p-2 md:p-3 outline-none resize-none h-16 md:h-20 font-mono focus:border-[#00ff41] transition-colors mb-2"
             ></textarea>
             
             {showMediaInput && (
                 <div className="flex items-center gap-2 mb-2 bg-[#111] p-1 border border-[#333]">
                     <LinkIcon size={14} className="text-[#00ff41]"/>
                     <input 
                         type="text" 
                         value={mediaUrl}
                         onChange={(e) => setMediaUrl(e.target.value)}
                         placeholder="MEDIA_URL (IMG/VIDEO)..."
                         className="flex-1 bg-transparent text-white text-xs outline-none font-mono"
                     />
                 </div>
             )}
             
             <div className="flex justify-between items-center">
               <div className="flex gap-2 md:gap-4 text-gray-500">
                 <button onClick={() => setShowMediaInput(!showMediaInput)} className={`hover:text-[#00ff41] transition-colors ${showMediaInput ? 'text-[#00ff41]' : ''}`}><ImageIcon size={14} className="md:w-4 md:h-4"/></button>
                 <button onClick={() => setShowMediaInput(!showMediaInput)} className="hover:text-[#00ff41] transition-colors"><Video size={14} className="md:w-4 md:h-4"/></button>
               </div>
               <button 
                 onClick={handlePost}
                 onTouchEnd={(e) => { e.preventDefault(); if (newPostContent.trim()) handlePost(); }}
                 className="bg-[#00ff41] text-black px-3 md:px-6 py-1 text-[10px] md:text-xs font-black hover:bg-white transition-colors uppercase touch-manipulation"
               >
                 TRANSMIT
               </button>
             </div>
          </div>

          {/* Posts Feed - Terminal Style */}
          {posts.map(post => (
            <div key={post.id} className="border border-[#333] bg-[#111] p-2 md:p-4 hover:border-[#00ff41]/50 transition-colors relative group">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-[#222] border border-[#333] flex items-center justify-center shrink-0">
                     <span className="text-[#00ff41] font-bold text-[10px] md:text-xs">{post.user.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-bold text-[10px] md:text-xs uppercase flex items-center gap-1 md:gap-2 flex-wrap">
                      <span className="truncate">{post.user}</span>
                      <span className="text-[8px] md:text-[9px] bg-[#00ff41]/10 text-[#00ff41] px-1 border border-[#00ff41]/30 shrink-0">CITIZEN</span>
                    </div>
                    <div className="text-gray-600 text-[9px] md:text-[10px] mt-0.5 font-mono">
                      {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleString() : 'JUST NOW'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-gray-300 text-xs md:text-sm font-mono leading-relaxed pl-8 md:pl-11 mb-2 md:mb-3">
                {post.content}
              </div>

              {post.mediaUrl && (
                  <div className="pl-11 mb-3">
                      {post.mediaType === 'video' ? (
                          <div className="aspect-video bg-black border border-[#333] rounded-lg overflow-hidden shadow-lg">
                              <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                          </div>
                      ) : post.mediaType === 'vertical_video' ? (
                          <div className="max-w-[250px] aspect-[9/16] bg-black border-4 border-gray-800 rounded-2xl overflow-hidden shadow-2xl mx-auto relative group-hover:scale-105 transition-transform">
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-b-xl z-20"></div>
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/50 rounded-full z-20"></div>
                              <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                          </div>
                      ) : (
                          <div className="rounded-lg border border-[#333] overflow-hidden shadow-lg">
                              <img src={post.mediaUrl} alt="Post Attachment" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                          </div>
                      )}
                  </div>
              )}
              
              {/* Actions Bar */}
              <div className="flex gap-6 text-[10px] text-gray-500 font-mono border-t border-[#333] pt-2 pl-11">
                <button 
                  onClick={() => handleLike(post.id, post.likes)}
                  onTouchEnd={(e) => { e.preventDefault(); handleLike(post.id, post.likes); }}
                  className="flex items-center gap-1 hover:text-[#00ff41] transition-colors touch-manipulation"
                >
                  <Heart size={12}/> 
                  <span>{post.likes || 0} LIKES</span>
                </button>
                <button 
                  onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                  onTouchEnd={(e) => { e.preventDefault(); setReplyingTo(replyingTo === post.id ? null : post.id); }}
                  className="flex items-center gap-1 hover:text-[#00ff41] transition-colors touch-manipulation"
                >
                  <MessageCircle size={12}/> 
                  <span>REPLY ({post.replies?.length || 0})</span>
                </button>
              </div>

              {/* Replies Section */}
              {(post.replies?.length > 0 || replyingTo === post.id) && (
                <div className="mt-3 pl-11">
                  
                  {/* Reply Input */}
                  {replyingTo === post.id && (
                    <div className="flex gap-2 mb-3">
                      <input 
                        className="flex-1 bg-[#050505] border border-[#333] text-white text-xs p-1 outline-none font-mono focus:border-[#00ff41]"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply..."
                        onKeyPress={(e) => e.key === 'Enter' && handleReply(post.id)}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleReply(post.id)}
                        className="bg-[#333] text-white px-3 text-[10px] font-bold hover:bg-[#00ff41] hover:text-black uppercase"
                      >
                        Send
                      </button>
                    </div>
                  )}

                  {/* Reply List */}
                  {post.replies?.length > 0 && (
                    <div className="space-y-1 border-l border-[#333] pl-3">
                      {post.replies.map((reply, idx) => (
                         <div key={idx} className="text-xs font-mono">
                            <span className="text-[#00ff41] font-bold mr-2">{reply.user}:</span>
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
            <div className="text-center py-20 border-2 border-dashed border-[#333] text-gray-600 text-xs font-mono">
              <Activity size={48} className="text-gray-800 mx-auto mb-4"/>
              <div className="text-gray-600 font-mono text-xs tracking-widest">NO SIGNAL DETECTED</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 9. SIDEKICK CHAT
const SidekickChat = () => {
  const [messages, setMessages] = useState([
    { sender: 'whip', text: "Yo, who's this? How'd you tap into my drive?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_sidekick', 3);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!canUse) {
      setMessages(prev => [...prev, { sender: 'system', text: `FREE LIMIT REACHED: ${limit} free Sidekick replies used.` }]);
      setInput("");
      return;
    }
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    consume();
    
    const systemPrompt = "You are Whip Montez, a female rapper from 2004. Your hard drive has been found in 2025. You are suspicious. Speak in early 2000s NY slang. Keep responses relatively short, like an Instant Message.";
    const chatHistory = messages.map(m => `${m.sender === 'user' ? 'Stranger' : 'Whip'}: ${m.text}`).join('\n') + `\nStranger: ${input}\nWhip:`;
    
    const responseText = await callGemini(chatHistory, systemPrompt);
    setMessages(prev => [...prev, { sender: 'whip', text: responseText }]);
    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className="relative z-20 w-full max-w-md bg-[#d4d0c8] border-2 border-white shadow-2xl flex flex-col h-[500px]">
        <div className="bg-gradient-to-r from-[#003399] to-[#0099cc] text-white px-2 py-1 flex justify-between items-center select-none">
           <div className="flex items-center gap-1 text-xs font-bold font-sans">
             <MessageSquare size={12} className="text-yellow-400"/>
             <span>Instant Message - WhipMntz04</span>
           </div>
           <div className="flex gap-1">
             <button className="w-4 h-4 bg-[#d4d0c8] border border-white border-r-gray-500 border-b-gray-500 text-black text-[10px] flex items-center justify-center">_</button>
             <button className="w-4 h-4 bg-[#d4d0c8] border border-white border-r-gray-500 border-b-gray-500 text-black text-[10px] flex items-center justify-center">X</button>
           </div>
        </div>
        <div className="bg-[#d4d0c8] text-black text-[10px] px-2 border-b border-gray-400 flex gap-2 font-sans py-0.5">
           <span className="underline">F</span>ile <span className="underline">E</span>dit <span className="underline">I</span>nsert <span className="underline">P</span>eople
        </div>
        <div className="flex-1 bg-white border-2 border-inset border-gray-400 m-1 p-2 overflow-y-auto font-sans text-sm">
           {messages.map((msg, idx) => (
             <div key={idx} className="mb-1">
                <span className={`font-bold ${msg.sender === 'user' ? 'text-red-600' : 'text-blue-700'}`}>
                  {msg.sender === 'user' ? 'You' : 'WhipMntz04'}:
                </span>
                <span className="ml-1 font-comic">{msg.text}</span>
             </div>
           ))}
           {loading && <div className="text-gray-500 italic text-xs">WhipMntz04 is typing...</div>}
           <div ref={messagesEndRef} />
        </div>
        <div className="h-24 bg-white border-2 border-inset border-gray-400 m-1 mt-0 p-2 font-sans">
           <div className="flex gap-2 mb-1 border-b border-gray-200 pb-1">
             <button className="text-xs font-bold text-blue-600 hover:bg-gray-100 px-1 rounded">A</button>
             <button className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-1 rounded">A</button>
             <button className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-1 rounded">B</button>
             <button className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-1 rounded">I</button>
             <button className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-1 rounded">U</button>
           </div>
           <textarea 
             className="w-full h-12 outline-none resize-none text-sm font-comic"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
             autoFocus
           />
        </div>
        <div className="flex justify-between p-1 bg-[#d4d0c8]">
           <button className="px-3 py-0.5 border border-white border-r-gray-600 border-b-gray-600 text-xs shadow-sm bg-[#d4d0c8] active:border-gray-600 active:border-r-white">Warn</button>
           <button className="px-3 py-0.5 border border-white border-r-gray-600 border-b-gray-600 text-xs shadow-sm bg-[#d4d0c8] active:border-gray-600 active:border-r-white">Block</button>
           <button 
             onClick={handleSend}
             className="px-6 py-0.5 border border-white border-r-gray-600 border-b-gray-600 text-xs font-bold active:border-gray-600 active:border-r-white"
           >
             Send
           </button>
        </div>
      </div>
    </div>
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
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className={`relative z-30 w-full max-w-6xl h-[85vh] shadow-[0_0_40px_rgba(0,255,65,0.1)] flex flex-col font-mono text-gray-300 transition-colors duration-500 ${mode === 'historical' ? 'bg-[#0a0a0a]' : 'bg-[#050510]'}`}>
        <div className={`${mode === 'historical' ? 'bg-[#00ff41] text-black' : 'bg-cyan-500 text-black'} p-4 md:p-6 border-t-4 border-b-4 ${mode === 'historical' ? 'border-[#00ff41]' : 'border-cyan-500'} flex justify-between items-end transition-colors duration-500`}>
           <div>
             <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none flex items-center gap-4">
               <Globe size={48} strokeWidth={2.5}/> {mode === 'historical' ? 'THE_FEED_2004' : 'LIVE_HIP_HOP'}
             </h1>
             <p className="text-xs md:text-sm font-bold mt-1 opacity-80">{mode === 'historical' ? 'ARCHIVE MODE' : 'REAL-TIME NEWS & TRENDING'}</p>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xl flex items-center gap-2 bg-black/30 p-3 rounded border-2 border-black">
                <Search size={20} className="text-black ml-1"/>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={mode === 'historical' ? "SEARCH ARCHIVES..." : "SEARCH (e.g. 'Drake beef')"}
                  className="bg-transparent border-none outline-none text-black font-black text-base md:text-lg w-full placeholder-black/60"
                  onKeyPress={(e) => e.key === 'Enter' && fetchNews(mode)}
                />
                {mode === 'live' && (
                    <button onClick={() => fetchLiveNews()} className="bg-black text-cyan-500 px-4 py-2 text-sm font-black rounded border-2 border-black hover:border-cyan-400 transition-all">SEARCH</button>
                )}
             </div>
             
              <div className="flex items-center gap-3 bg-black/30 p-2 rounded border-2 border-black">
                  <span className={`text-xs md:text-sm font-black ${mode === 'historical' ? 'text-black opacity-100' : 'text-black opacity-50'}`}>2004</span>
                  <button onClick={() => fetchNews(mode === 'historical' ? 'live' : 'historical')} disabled={loading} className="focus:outline-none">
                    {mode === 'historical' ? <ToggleLeft size={36} /> : <ToggleRight size={36} />}
                  </button>
                  <span className={`text-xs md:text-sm font-black ${mode === 'live' ? 'text-black opacity-100' : 'text-black opacity-50'}`}>LIVE</span>
               </div>
           </div>
        </div>
        
        <div className="flex-1 flex overflow-hidden relative">
           {loading && <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center"><RefreshCw size={48} className="animate-spin text-cyan-500" /></div>}
           
           {/* Left Panel - Trending Social */}
           <div className="hidden md:block w-80 bg-[#0a0a0a] border-r border-[#333] flex flex-col shrink-0">
             <div className="p-4 border-b border-[#333] flex items-center justify-between shrink-0">
               <h3 className="font-black text-cyan-500 text-sm flex items-center gap-2">
                 <TrendingUp size={16} /> TRENDING NOW
               </h3>
               <button onClick={refreshTrending} className="text-gray-500 hover:text-cyan-500 transition-colors">
                 <RefreshCw size={14} />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-200px)]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ff41 #0a0a0a' }}>
               {trendingPosts.map((post, i) => (
                 <div key={i} className="bg-[#111] border border-[#222] p-3 rounded hover:border-cyan-500/50 transition-all cursor-pointer">
                   <div className="flex items-start gap-2 mb-2">
                     <span className="text-lg">{post.icon}</span>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 text-xs">
                         <span className={`font-bold ${post.color}`}>{post.username}</span>
                         <span className="text-gray-600">• {post.time}</span>
                       </div>
                     </div>
                   </div>
                   <p className="text-xs text-gray-300 leading-relaxed mb-2">{post.text}</p>
                   <div className="flex items-center gap-3 text-xs text-gray-500">
                     <span>❤️ {post.likes}</span>
                     <span className="text-gray-700">•</span>
                     <span className="text-gray-600">{post.platform}</span>
                   </div>
                 </div>
               ))}
             </div>
             <div className="p-3 border-t border-[#333] text-center">
               <p className="text-[9px] text-gray-600 uppercase tracking-wider">Updated Every 5 Minutes</p>
             </div>
           </div>
           
           {/* Main News Feed */}
           <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-4 space-y-4">
             {mode === 'live' && (
               <div className="bg-red-900/20 border border-red-500 p-3 rounded flex items-center gap-3">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Live Feed Active • Searching Real-Time Sources</span>
               </div>
             )}
             {newsItems.map((item) => (
               <div key={item.id} className="border border-[#333] bg-[#111] p-4 hover:border-cyan-500 transition-all group">
                   <div className="flex items-start justify-between mb-2">
                     <div className="flex-1">
                       <h2 className="text-lg md:text-xl font-bold text-white mb-1 group-hover:text-cyan-500 transition-colors">{item.title}</h2>
                       <p className="text-sm text-gray-400 leading-relaxed">{item.content}</p>
                     </div>
                   </div>
                   <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                     <span className="text-cyan-500 font-bold">{item.source}</span>
                     <span className="text-gray-600">•</span>
                     <span className="text-gray-500">{item.date}</span>
                     {item.time && <><span className="text-gray-600">•</span><span className="text-gray-500">{item.time}</span></>}
                     {item.tags && item.tags.map(tag => (
                       <span key={tag} className="bg-cyan-900/30 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-bold">#{tag}</span>
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
    <div className="h-full w-full relative flex items-center justify-center p-2 md:p-4 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10 pointer-events-none"></div>
      <div className="relative z-30 w-full max-w-2xl h-[85vh] md:h-[70vh] bg-[#111] border border-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)] flex flex-col my-4">
        <div className="bg-red-700 text-white px-3 md:px-4 py-2 flex justify-between items-center font-bold text-xs md:text-sm shrink-0">
           <span className="flex items-center gap-1 md:gap-2"><Flame size={14} className="md:w-[18px] md:h-[18px]"/><span className="hidden sm:inline">CIPHER_DOJO.EXE</span><span className="sm:hidden">BATTLE</span></span>
           <div className="flex gap-1">
             <button 
               onClick={() => setShowInfo(true)}
               className="w-5 h-5 md:w-6 md:h-6 bg-black hover:bg-red-900 transition-colors flex items-center justify-center"
               title="Info"
             >
               <Info size={14} className="md:w-4 md:h-4 text-red-400"/>
             </button>
             <button onClick={() => window.history.back()} className="w-5 h-5 md:w-6 md:h-6 bg-black hover:bg-red-900 flex items-center justify-center transition-colors cursor-pointer" aria-label="Close">
               <X size={14} className="md:w-4 md:h-4 text-white"/>
             </button>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4 bg-black/90" style={{WebkitOverflowScrolling: 'touch'}}>
           {history.map((turn, i) => (
             <div key={i} className={`flex ${turn.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] p-2 md:p-3 border-l-4 ${turn.sender === 'user' ? 'border-red-500 bg-red-900/20 text-right' : 'border-red-500 bg-red-900/20 text-left'}`}>
                   <div className={`text-[9px] md:text-[10px] font-bold mb-1 ${turn.sender === 'user' ? 'text-red-500' : 'text-red-500'}`}>{turn.sender === 'user' ? 'YOU' : 'RIVAL MC'}</div>
                   <div className="text-white font-mono text-xs md:text-sm whitespace-pre-wrap">{turn.text}</div>
                </div>
             </div>
           ))}
           {loading && <div className="text-red-500 animate-pulse text-[10px] md:text-xs font-mono">Rival is writing a diss...</div>}
           <div ref={endRef}></div>
        </div>
        <div className="p-2 md:p-4 bg-[#1a1a1a] border-t border-[#333] flex gap-2 shrink-0">
           <input 
             type="text" value={input} onChange={(e) => setInput(e.target.value)} 
             placeholder="Spit your bars here..." 
             className="flex-1 bg-black border border-[#333] text-white p-2 font-mono text-xs md:text-sm outline-none focus:border-red-500" 
             onKeyPress={(e) => e.key === 'Enter' && handleBattle()} 
           />
           {isSupported && (
             <button 
                 onClick={startListening} 
                 disabled={loading || isListening}
                 className={`px-2 md:px-3 border border-[#333] ${isListening ? 'bg-red-600 animate-pulse' : 'bg-black hover:bg-red-900'} text-white transition-colors disabled:opacity-50`}
                 title="Voice input"
             >
                 <Mic size={16} className="md:w-5 md:h-5"/>
             </button>
           )}
           <button onClick={handleBattle} disabled={loading} className="bg-red-600 text-white px-4 md:px-6 py-2 font-bold font-mono hover:bg-red-500 transition-colors uppercase disabled:opacity-50 active:scale-95">SPIT</button>
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={() => setShowInfo(false)}>
          <div className="bg-[#111] border-2 border-red-700 p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{WebkitOverflowScrolling: 'touch'}}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-red-500 font-bold text-xl font-mono">CIPHER_DOJO.EXE - SYSTEM INFO</h3>
              <button onClick={() => setShowInfo(false)} className="text-red-500 hover:text-white">
                <X size={20}/>
              </button>
            </div>
            <div className="space-y-4 text-gray-100 text-sm leading-relaxed">
              <div>
                <h4 className="text-red-500 font-bold mb-2">TOOL DESCRIPTION:</h4>
                <p>AI-powered battle rap opponent inspired by 2004 Brooklyn hip-hop culture. Test your lyrical skills against an opponent who responds with aggressive, witty disses.</p>
              </div>
              <div>
                <h4 className="text-red-500 font-bold mb-2">FEATURES:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Voice-to-text input for natural flow</li>
                  <li>Real-time AI responses with NYC slang</li>
                  <li>Free tier: 3 battle rounds per session</li>
                  <li>3-second cooldown between bars</li>
                  <li>Chat-style battle history</li>
                </ul>
              </div>
              <div>
                <h4 className="text-red-500 font-bold mb-2">HOW TO USE:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Type or voice your battle bars</li>
                  <li>Click SPIT to challenge the AI</li>
                  <li>Get a diss track response in seconds</li>
                  <li>Keep battling to sharpen your skills</li>
                </ol>
              </div>
              <div>
                <h4 className="text-red-500 font-bold mb-2">PRO TIPS:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use metaphors and wordplay for impact</li>
                  <li>Reference Brooklyn/NYC culture</li>
                  <li>Keep bars concise (2-4 lines)</li>
                  <li>Focus on flow and rhyme schemes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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
    <div className="h-full w-full relative flex items-center justify-center p-2 md:p-4 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10 pointer-events-none"></div>
      <div className="relative z-30 w-full max-w-3xl h-[85vh] md:h-[80vh] bg-[#111] border border-yellow-600 shadow-[0_0_20px_rgba(250,204,21,0.4)] flex flex-col my-4">
        <div className="bg-yellow-600 text-black px-3 md:px-4 py-2 flex justify-between items-center font-bold text-xs md:text-sm">
           <span className="flex items-center gap-2"><Disc size={16} className="md:w-[18px] md:h-[18px]"/> <span className="hidden sm:inline">CRATE_DIGGER_PRO.EXE</span><span className="sm:hidden">CRATE DIGGER</span></span>
           <button onClick={() => window.history.back()} className="w-5 h-5 md:w-6 md:h-6 bg-black hover:bg-yellow-900 flex items-center justify-center transition-colors cursor-pointer" aria-label="Close">
             <X size={14} className="md:w-4 md:h-4 text-white"/>
           </button>
        </div>
        <div className="p-3 md:p-6 bg-[#1a1a1a] border-b border-[#333]">
           <h2 className="text-white font-black text-lg md:text-2xl mb-2">FIND THE PERFECT SAMPLE</h2>
           <div className="flex flex-col sm:flex-row gap-2">
             <div className="flex gap-2 flex-1">
               <input type="text" value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Enter a vibe..." className="flex-1 bg-black border border-[#333] text-white p-2 md:p-3 font-mono text-sm md:text-base outline-none focus:border-yellow-600" onKeyPress={(e) => e.key === 'Enter' && handleDig()} />
               {isSupported && (
                 <button 
                     onClick={startListening} 
                     disabled={loading || isListening}
                     className={`px-2 md:px-3 border border-[#333] ${isListening ? 'bg-yellow-600 animate-pulse' : 'bg-black hover:bg-yellow-900'} text-white transition-colors disabled:opacity-50`}
                     title="Voice input"
                 >
                     <Mic size={16} className="md:w-5 md:h-5"/>
                 </button>
               )}
             </div>
             <button onClick={handleDig} disabled={loading} className="bg-yellow-600 text-black px-6 py-2 md:py-3 font-bold hover:bg-yellow-500 text-sm md:text-base whitespace-nowrap active:scale-95 transition-transform">DIG</button>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0a0a0a]">
           {samples.map((sample, i) => (
             <div key={i} className="flex gap-3 md:gap-4 p-3 md:p-4 border border-[#333] bg-[#111] mb-2 hover:border-yellow-600">
                <div className="flex-1">
                   <div className="text-yellow-600 text-[10px] md:text-xs font-bold mb-1">{sample.year} // {sample.artist}</div>
                   <div className="text-white font-black text-base md:text-xl">{sample.track}</div>
                   <div className="text-gray-400 text-xs md:text-sm mt-1">{sample.desc}</div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
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
    <div className="h-full w-full relative flex flex-col items-center justify-center p-2 md:p-4 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10 pointer-events-none"></div>
      <div className="relative z-30 w-full max-w-4xl h-[85vh] bg-[#1a1a1a] border border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] flex flex-col my-4">
        <div className="bg-blue-600 text-white px-3 md:px-4 py-2 flex justify-between items-center font-bold text-xs md:text-sm">
          <span className="flex items-center gap-2"><Briefcase size={16} className="md:w-[18px] md:h-[18px]"/> <span className="hidden sm:inline">A&R_DASHBOARD.EXE</span><span className="sm:hidden">A&R</span></span>
          <button onClick={() => window.history.back()} className="w-5 h-5 md:w-6 md:h-6 bg-black hover:bg-blue-900 flex items-center justify-center transition-colors cursor-pointer" aria-label="Close">
            <X size={14} className="md:w-4 md:h-4 text-white"/>
          </button>
        </div>
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/2 p-3 md:p-6 border-b md:border-r md:border-b-0 border-[#333] flex flex-col">
             <textarea className="flex-1 bg-black border border-[#333] text-white p-3 md:p-4 font-mono text-xs md:text-sm resize-none focus:border-blue-500 outline-none mb-2" placeholder="Paste lyrics..." value={demoText} onChange={(e) => setDemoText(e.target.value)} />
             <div className="flex gap-2">
               {isSupported && (
                 <button 
                     onClick={startListening} 
                     disabled={loading || isListening}
                     className={`px-3 py-2 border border-[#333] ${isListening ? 'bg-blue-600 animate-pulse' : 'bg-black hover:bg-blue-900'} text-white transition-colors disabled:opacity-50 flex items-center gap-2 text-xs`}
                 >
                     <Mic size={16}/> {isListening ? 'LISTENING...' : 'VOICE'}
                 </button>
               )}
               <button onClick={handleReview} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 md:py-3 font-bold hover:bg-blue-500 uppercase disabled:opacity-50 text-xs md:text-sm active:scale-95 transition-transform">
                  {loading ? "ANALYZING RHYMES..." : "SUBMIT FOR REVIEW"}
               </button>
             </div>
          </div>
          <div className="w-full md:w-1/2 p-3 md:p-6 bg-[#111] overflow-y-auto">
             {loading && (
                 <div className="text-blue-500 animate-pulse text-base md:text-xl font-mono flex flex-col items-center py-10">
                     <RefreshCw size={24} className="md:w-8 md:h-8 mb-4 animate-spin"/>
                     A&R IS PROCESSING...
                 </div>
             )}
             {feedback && (
               <div className="space-y-4 md:space-y-6">
                 <div className="flex gap-3 md:gap-4 text-center">
                   <div className="flex-1 bg-black border border-blue-600 p-3 md:p-4"><div className="text-[10px] md:text-xs text-gray-500">RADIO</div><div className="text-2xl md:text-3xl font-black text-white">{feedback.commercial}/10</div></div>
                   <div className="flex-1 bg-black border border-red-600 p-3 md:p-4"><div className="text-[10px] md:text-xs text-gray-500">STREETS</div><div className="text-2xl md:text-3xl font-black text-white">{feedback.street}/10</div></div>
                 </div>
                 <div className="bg-black/50 p-3 md:p-4 border-l-4 border-blue-600 text-xs md:text-sm text-gray-300">{feedback.critique}</div>
               </div>
             )}
             {feedback && (
               <div className="space-y-4 md:space-y-6">
                 <div className="flex gap-3 md:gap-4 text-center">
                   <div className="flex-1 bg-black border border-blue-600 p-3 md:p-4"><div className="text-[10px] md:text-xs text-gray-500">RADIO</div><div className="text-2xl md:text-3xl font-black text-white">{feedback.commercial}/10</div></div>
                   <div className="flex-1 bg-black border border-red-600 p-3 md:p-4"><div className="text-[10px] md:text-xs text-gray-500">STREETS</div><div className="text-2xl md:text-3xl font-black text-white">{feedback.street}/10</div></div>
                 </div>
                 <div className="bg-black/50 p-3 md:p-4 border-l-4 border-blue-600 text-xs md:text-sm text-gray-300">{feedback.critique}</div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 15. NEW FEATURE: ALBUM ART GENERATOR (Future Cyber Look)
const AlbumArtGenerator = ({ user, onAuthRequest }) => {
    const [prompt, setPrompt] = useState("A gritty, neon-lit cyberpunk street corner in Red Hook, Brooklyn with a vinyl record.");
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_albumart', 3);
    const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
      setPrompt(prev => prev ? prev + ' ' + transcript : transcript);
    });
    
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
        <div className="h-full w-full relative flex flex-col items-center justify-center p-2 md:p-4 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
            <BackgroundCarousel images={[]} />
            <div className="absolute inset-0 bg-black/80 z-10 pointer-events-none"></div>
            <div className="relative z-20 w-full max-w-4xl h-[90vh] md:h-[85vh] bg-[#1a1a1a] border border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.4)] flex flex-col my-4">
                <div className="bg-pink-600 text-white px-3 md:px-4 py-2 flex justify-between items-center font-bold shrink-0">
                    <span className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                      <Camera size={14} className="md:w-[18px] md:h-[18px]"/> 
                      <span className="hidden sm:inline">ALBUM_ART_GENERATOR.EXE</span>
                      <span className="sm:hidden">ALBUM_ART_GEN</span>
                    </span>
                    <button onClick={() => window.history.back()} className="w-5 h-5 md:w-6 md:h-6 bg-black hover:bg-pink-900 flex items-center justify-center transition-colors cursor-pointer" aria-label="Close">
                      <X size={14} className="md:w-4 md:h-4 text-white"/>
                    </button>
                </div>
                
                <div className="p-3 md:p-6 bg-[#111] border-b border-[#333] shrink-0">
                    <h2 className="text-white font-black text-sm md:text-xl mb-2">GENERATE COVER ART</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex gap-2 flex-1">
                          <input 
                              type="text" 
                              value={prompt} 
                              onChange={(e) => setPrompt(e.target.value)} 
                              placeholder="Describe your album cover..." 
                              className="flex-1 bg-black border border-[#333] text-white p-2 md:p-3 text-xs md:text-sm font-mono outline-none focus:border-pink-500" 
                              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()} 
                          />
                          {isSupported && (
                            <button 
                                onClick={startListening} 
                                disabled={loading || isListening}
                                className={`px-2 md:px-3 py-2 border border-[#333] ${isListening ? 'bg-pink-600 animate-pulse' : 'bg-black hover:bg-pink-900'} text-white transition-colors disabled:opacity-50`}
                                title="Voice input"
                            >
                                <Mic size={16} className="md:w-5 md:h-5"/>
                            </button>
                          )}
                        </div>
                        <button 
                            onClick={handleGenerate} 
                            disabled={loading} 
                            className="bg-pink-600 text-white px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold hover:bg-pink-500 uppercase disabled:opacity-50 active:scale-95 transition-transform"
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
                        <div className="w-full max-w-[280px] sm:max-w-xs md:max-w-md aspect-square border-2 md:border-4 border-white shadow-[0_0_20px_rgba(236,72,153,0.5)] relative">
                            <img src={imageUrl} alt="Generated Album Art" className="w-full h-full object-cover"/>
                            <div className="absolute top-1 md:top-2 left-1 md:left-2 bg-black/70 text-white text-[9px] md:text-[10px] font-mono px-1 md:px-2 py-0.5 md:py-1">RESULT: {prompt.substring(0, 20)}...</div>
                            <div className="absolute bottom-1 md:bottom-2 right-1 md:right-2 flex gap-1 md:gap-2">
                              <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-cyan-600 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 hover:bg-cyan-500 transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-1"
                                title="Save to library"
                              >
                                <Heart size={10} className="md:w-3 md:h-3"/> {saving ? 'SAVING...' : 'SAVE'}
                              </button>
                              <a 
                                href={imageUrl} 
                                download={`album-art-${Date.now()}.png`}
                                className="bg-[#00ff41] text-black text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 hover:bg-white transition-colors active:scale-95 inline-block"
                              >
                                DOWNLOAD
                              </a>
                            </div>
                        </div>
                    )}
                    {!imageUrl && !loading && (
                        <div className="text-gray-600 text-center font-mono text-xs md:text-sm">
                            <Camera size={32} className="md:w-12 md:h-12 mx-auto mb-4 text-gray-700"/>
                            AWAITING ART GENERATION REQUEST.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 18. NEW FEATURE: SOCIAL MEDIA MUSIC VIDEO AI AGENT
const ViralVideoAgent = ({ user, onAuthRequest }) => {
    const [trackIdea, setTrackIdea] = useState("");
    const [concepts, setConcepts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isWhipMode, setIsWhipMode] = useState(false);
    const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_viral', 3);
    const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
      setTrackIdea(prev => prev ? prev + ' ' + transcript : transcript);
    });

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
    <div className="h-full w-full relative flex flex-col items-center justify-center p-2 md:p-4 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
      {/* Neural Network Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}
        ></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="absolute inset-0 bg-black/80 z-10 pointer-events-none"></div>

      <div className="relative z-20 w-full max-w-6xl h-[90vh] md:h-[85vh] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-violet-500/50 shadow-[0_0_50px_rgba(139,92,246,0.4)] flex flex-col backdrop-blur-xl my-4">
        {/* Window Header */}
        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white px-3 md:px-4 py-2 flex justify-between items-center font-bold shrink-0">
          <span className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <TrendingUp size={14} className="md:w-[18px] md:h-[18px]"/> 
            <span className="hidden sm:inline">TREND_HUNTER_AI.EXE</span>
            <span className="sm:hidden">TREND_HUNTER</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-[10px] font-mono mr-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="hidden sm:inline">SCANNING</span>
            </div>
            <button onClick={() => window.history.back()} className="w-5 h-5 md:w-6 md:h-6 bg-black/50 hover:bg-black flex items-center justify-center transition-colors cursor-pointer" aria-label="Close">
              <X size={14} className="md:w-4 md:h-4 text-white"/>
            </button>
          </div>
        </div>

        {/* Search Interface */}
        <div className="p-3 md:p-6 bg-[#111] border-b border-violet-500/30 shrink-0">
          <h2 className="text-white font-black text-sm md:text-xl mb-3">REAL-TIME HASHTAG INTELLIGENCE</h2>
          
          {/* Hashtag Input */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-black border border-violet-500/50 focus-within:border-violet-400 transition-colors">
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
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 md:px-8 py-2 md:py-3 text-xs md:text-sm font-bold hover:from-violet-500 hover:to-fuchsia-500 uppercase disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-lg shadow-violet-500/50"
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
                    className={`px-2 py-1 text-[10px] font-mono border transition-all cursor-pointer ${
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
                    className={`px-2 py-1 text-[10px] font-mono uppercase border transition-all cursor-pointer ${
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

            {/* Usage Counter */}
            <div className="text-[10px] font-mono text-gray-500">
              FREE SEARCHES: {limit - (canUse ? 0 : 1)} / {limit} REMAINING
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0a0a0a]" style={{WebkitOverflowScrolling: 'touch'}}>
          {loading && (
            <div className="text-violet-400 animate-pulse text-sm md:text-xl font-mono flex flex-col items-center justify-center h-full">
              <RefreshCw size={32} className="md:w-12 md:h-12 mb-4 animate-spin"/>
              <span className="text-xs md:text-base">SCRAPING SOCIAL MEDIA...</span>
              <span className="text-[10px] text-gray-500 mt-2">ANALYZING #{hashtag} ON {platform.toUpperCase()}</span>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-gray-600 text-center font-mono text-xs md:text-sm flex flex-col items-center justify-center h-full">
              <TrendingUp size={48} className="md:w-16 md:h-16 mx-auto mb-4 text-gray-700"/>
              <span className="text-lg font-bold text-white mb-2">AGENT READY</span>
              <span>Enter a hashtag to analyze trending content across social platforms.</span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-violet-500/30">
                <h3 className="text-violet-400 font-bold text-sm md:text-lg">
                  TRENDING ANALYSIS: #{hashtag} ({results.length} POSTS)
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  LIVE DATA
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.map((post, index) => (
                  <div 
                    key={`${post.platform}-${post.username}-${index}`}
                    className="relative group bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-violet-500/20 rounded-lg p-4 hover:border-violet-400/50 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300"
                  >
                    {/* Trending Badge */}
                    {post.trending && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[8px] font-bold px-2 py-1 rounded flex items-center gap-1 animate-pulse">
                        🔥 TRENDING
                      </div>
                    )}

                    {/* Platform & User */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-white text-sm">
                        {post.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm truncate">@{post.username}</div>
                        <div className="text-[10px] text-violet-400 font-mono uppercase">{post.platform}</div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-gray-300 text-xs leading-relaxed mb-3 line-clamp-3">
                      {post.text}
                    </p>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
                      <div className="text-center">
                        <div className="text-white font-bold text-sm">{post.views?.toLocaleString() || 0}</div>
                        <div className="text-[9px] text-gray-500 font-mono">VIEWS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-sm">{post.likes?.toLocaleString() || 0}</div>
                        <div className="text-[9px] text-gray-500 font-mono">LIKES</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-sm">{post.comments?.toLocaleString() || 0}</div>
                        <div className="text-[9px] text-gray-500 font-mono">COMMENTS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-sm">{post.shares?.toLocaleString() || 0}</div>
                        <div className="text-[9px] text-gray-500 font-mono">SHARES</div>
                      </div>
                    </div>

                    {/* Engagement Rate */}
                    {post.engagementRate && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500 font-mono">ENGAGEMENT RATE</span>
                          <span className="text-fuchsia-400 font-bold">{post.engagementRate}%</span>
                        </div>
                        <div className="w-full bg-black/50 h-1 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(parseFloat(post.engagementRate) * 10, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="mt-2 text-[9px] text-gray-600 font-mono">
                      {post.timestamp || 'Unknown time'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

    const handleGenerate = async () => {
        if (!trackIdea.trim()) return;

        // Cooldown check
        const cooldownTime = 3000; // 3 seconds
        const now = Date.now();
        if (now - lastRequestTime.current < cooldownTime) {
            alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds before generating new concepts.`);
            return;
        }

        if (!canUse) {
          setConcepts([{ concept: 'FREE LIMIT REACHED', visual: `${limit} free Viral Video runs used.`, trend: 'LIMIT', shots: ['Upgrade required'] }]);
          return;
        }

        consume();

        setLoading(true);
        setConcepts([]);

        let prompt = isWhipMode
            ? `Generate video ideas for a Whip Montez track based on: ${trackIdea}`
            : `Generate general music video ideas based on: ${trackIdea}`;
        
        let systemPrompt = "You are the Viral Video Agent (VVA) for Livewire Entertainment, specializing in short-form social media video trends (TikTok, Reels). Given a track idea, generate a JSON array of 3 distinct music video concepts designed for maximum viral impact. Format: [{ 'concept': 'Short Title', 'visual': 'Brief visual description', 'trend': 'Current Trend Style (e.g., POV, Seamless Transition)', 'shots': ['Shot 1', 'Shot 2'] }]. Do not use markdown backticks or formatting outside the JSON array.";

        if (isWhipMode) {
             systemPrompt = "You are the Viral Video Agent (VVA) for Livewire Entertainment. Generate 3 concepts focused on Whip Montez's 2004 aesthetic (NYC, boom-bap, red hook) but optimized for 2025 social media trends. JSON output only.";
        }

        const responseText = await callGemini(prompt, systemPrompt);

        try {
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedConcepts = JSON.parse(cleanJson);
            setConcepts(parsedConcepts);
        } catch (e) {
            console.error("Failed to parse VVA response:", e);
            setConcepts([{ concept: "ERROR", visual: "Failed to load concepts. Check API status.", trend: "SYSTEM FAIL", shots: ["System Failure"] }]);
        }
        lastRequestTime.current = Date.now();
        setLoading(false);
    };
    
    const handleUpload = (platform) => {
        // Simple simulation of an upload action
        alert(`Simulating upload of current concept to ${platform}...\nStatus: Publishing concept to Livewire servers.`);
    }


    return (
        <div className="h-full w-full relative flex flex-col items-center justify-center p-2 md:p-4 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
            <BackgroundCarousel images={[]} />
            <div className="absolute inset-0 bg-black/80 z-10 pointer-events-none"></div>
            <div className="relative z-20 w-full max-w-5xl h-[90vh] md:h-[85vh] bg-[#1a1a1a] border border-cyan-500 shadow-[0_0_30px_rgba(0,255,255,0.4)] flex flex-col my-4">
                <div className="bg-cyan-700 text-white px-3 md:px-4 py-2 flex justify-between items-center font-bold shrink-0">
                    <span className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                      <TrendingUp size={14} className="md:w-[18px] md:h-[18px]"/> 
                      <span className="hidden sm:inline">VIRAL_VIDEO_AGENT.EXE</span>
                      <span className="sm:hidden">VIRAL_VID_AGENT</span>
                    </span>
                    <button onClick={() => window.history.back()} className="w-5 h-5 md:w-6 md:h-6 bg-black hover:bg-cyan-900 flex items-center justify-center transition-colors cursor-pointer" aria-label="Close">
                      <X size={14} className="md:w-4 md:h-4 text-white"/>
                    </button>
                </div>
                
                <div className="p-3 md:p-6 bg-[#111] border-b border-[#333] shrink-0">
                    <h2 className="text-white font-black text-sm md:text-xl mb-2 md:mb-3">GENERATE VIRAL CONCEPTS</h2>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-2">
                        <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-gray-400">
                             MODE: 
                             <button onClick={() => setIsWhipMode(!isWhipMode)} className="flex items-center gap-1 border border-cyan-800 px-1.5 md:px-2 py-0.5 bg-black hover:border-cyan-500 transition-colors active:scale-95">
                                {isWhipMode ? <ToggleRight size={14} className="md:w-4 md:h-4 text-cyan-500"/> : <ToggleLeft size={14} className="md:w-4 md:h-4 text-gray-500"/>}
                                <span className="hidden sm:inline">{isWhipMode ? "WHIP MONTEZ SPECIFIC" : "GENERAL TRENDS"}</span>
                                <span className="sm:hidden">{isWhipMode ? "WHIP" : "GENERAL"}</span>
                             </button>
                        </div>
                        <button onClick={() => setConcepts([])} className="text-[10px] md:text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 active:scale-95">
                            <Trash2 size={10} className="md:w-3 md:h-3"/> CLEAR RESULTS
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex gap-2 flex-1">
                          <input 
                              type="text" 
                              value={trackIdea} 
                              onChange={(e) => setTrackIdea(e.target.value)} 
                              placeholder={isWhipMode ? "Enter key elements of your new Whip Montez track..." : "Enter track mood or title for general concepts..."} 
                              className="flex-1 bg-black border border-cyan-800 text-white p-2 md:p-3 text-xs md:text-sm font-mono outline-none focus:border-cyan-500" 
                              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()} 
                          />
                          {isSupported && (
                            <button 
                                onClick={startListening} 
                                disabled={loading || isListening}
                                className={`px-2 md:px-3 py-2 border border-cyan-800 ${isListening ? 'bg-cyan-600 animate-pulse' : 'bg-black hover:bg-cyan-900'} text-white transition-colors disabled:opacity-50`}
                                title="Voice input"
                            >
                                <Mic size={16} className="md:w-5 md:h-5"/>
                            </button>
                          )}
                        </div>
                        <button 
                            onClick={handleGenerate} 
                            disabled={loading} 
                            className="bg-cyan-600 text-black px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold hover:bg-cyan-500 uppercase disabled:opacity-50 active:scale-95 shrink-0"
                        >
                            {loading ? "ANALYZING..." : "GENERATE CONCEPTS"}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0a0a0a] space-y-4 md:space-y-6" style={{WebkitOverflowScrolling: 'touch'}}>
                    {loading && (
                        <div className="text-cyan-400 animate-pulse text-sm md:text-xl font-mono flex flex-col items-center py-10">
                            <RefreshCw size={24} className="md:w-8 md:h-8 mb-4 animate-spin"/>
                            <span className="text-xs md:text-base">SCANNING VIRAL TRENDS...</span>
                        </div>
                    )}
                    {concepts.length > 0 && !loading && (
                        <div className="space-y-4 md:space-y-6">
                            <h3 className="text-cyan-400 font-bold text-sm md:text-lg border-b border-cyan-800 pb-2">RECOMMENDED VIRAL CONCEPTS ({concepts.length})</h3>
                            
                            {/* Upload Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                                <span className="text-[10px] md:text-xs font-mono text-gray-500 sm:pt-3">DISTRIBUTE CONCEPT TO:</span>
                                <div className="flex gap-2 flex-wrap">
                                  <button onClick={() => handleUpload("TikTok")} className="bg-white text-black font-bold text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 hover:bg-gray-200 active:scale-95">TIKTOK</button>
                                  <button onClick={() => handleUpload("Instagram")} className="bg-white text-black font-bold text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 hover:bg-gray-200 active:scale-95">INSTAGRAM REELS</button>
                                  <button onClick={() => handleUpload("Facebook")} className="bg-white text-black font-bold text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 hover:bg-gray-200 active:scale-95">FACEBOOK SHORTS</button>
                                </div>
                            </div>
                            
                            {concepts.map((concept, index) => (
                                <div key={index} className="bg-[#111] border border-cyan-900 p-3 md:p-4 shadow-md">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 md:mb-3 gap-2">
                                        <h4 className="text-white font-black text-sm md:text-xl flex items-center gap-2 flex-wrap">
                                            <span className="break-words">{concept.concept}</span>
                                            <span className="text-[10px] md:text-xs text-black bg-cyan-400 font-bold px-1.5 md:px-2 py-0.5 shrink-0">{concept.trend}</span>
                                        </h4>
                                    </div>
                                    <p className="text-gray-400 text-xs md:text-sm italic mb-2 md:mb-3">{concept.visual}</p>
                                    <div className="mt-2 md:mt-3">
                                        <h5 className="text-cyan-500 text-[10px] md:text-xs font-bold uppercase mb-1">KEY SHOTS:</h5>
                                        <ul className="text-gray-500 text-[10px] md:text-xs space-y-0.5 list-disc list-inside">
                                            {concept.shots.map((shot, i) => <li key={i}>{shot}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!concepts.length && !loading && (
                        <div className="text-gray-600 text-center font-mono text-xs md:text-sm py-10">
                            <TrendingUp size={32} className="md:w-12 md:h-12 mx-auto mb-4 text-gray-700"/>
                            AGENT READY. ENTER A TRACK IDEA ABOVE.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 16. STUDIO HUB - 2026 ULTRA-MODERN NEURAL INTERFACE
const StudioHub = ({ setSection }) => {
  const [activeAgent, setActiveAgent] = useState('ghostwriter'); // Track selected agent for sidebar

  const agents = [
    {
      id: 'ghostwriter',
      title: 'LYRIC RECOVERY TOOL',
      subtitle: 'GHOSTWRITER.EXE',
      icon: Sparkles,
      gradient: 'from-cyan-400 to-cyan-600',
      description: 'AI-powered lyric generation • Voice input • Text-to-speech',
      action: () => { setActiveAgent('ghostwriter'); setSection('ghostwriter'); }
    },
    {
      id: 'chat',
      title: 'AI SIDEKICK CHAT',
      subtitle: 'SIDEKICK.EXE',
      icon: MessageSquare,
      gradient: 'from-pink-400 to-pink-600',
      description: 'Conversational AI assistant • Creative collaboration',
      action: () => { setActiveAgent('chat'); setSection('chat'); }
    },
    {
      id: 'battle',
      title: 'CIPHER DOJO',
      subtitle: 'BATTLE.EXE',
      icon: Flame,
      gradient: 'from-red-400 to-red-600',
      description: 'Battle rap simulator • Real-time AI disses • NYC slang',
      action: () => { setActiveAgent('battle'); setSection('battle'); }
    },
    {
      id: 'ar_suite',
      title: 'AR EXPERIENCE SUITE',
      subtitle: 'AR_SUITE.EXE',
      icon: Zap,
      gradient: 'from-blue-400 to-blue-600',
      description: 'Augmented reality concepts • Immersive experiences',
      action: () => { setActiveAgent('ar_suite'); setSection('ar_suite'); }
    },
    {
      id: 'crates',
      title: 'CRATE DIGGER',
      subtitle: 'SAMPLES.EXE',
      icon: Disc,
      gradient: 'from-yellow-400 to-yellow-600',
      description: 'Sample discovery • Production inspiration • BPM/Key info',
      action: () => { setActiveAgent('crates'); setSection('crates'); }
    },
    {
      id: 'album_art',
      title: 'ALBUM ART GENERATOR',
      subtitle: 'ARTGEN.EXE',
      icon: ImageIcon,
      gradient: 'from-pink-400 to-pink-600',
      description: 'AI album cover concepts • Visual design ideas',
      action: () => { setActiveAgent('album_art'); setSection('album_art'); }
    },
    {
      id: 'viral_video',
      title: 'VIRAL VIDEO AGENT',
      subtitle: 'VIRAL.EXE',
      icon: Video,
      gradient: 'from-cyan-400 to-cyan-600',
      description: 'TikTok/Reels concepts • Viral content strategy',
      action: () => { setActiveAgent('viral_video'); setSection('viral_video'); }
    },
    {
      id: 'trend_hunter',
      title: 'TREND HUNTER AI',
      subtitle: 'TRENDS.EXE',
      icon: Hash,
      gradient: 'from-violet-400 to-fuchsia-600',
      description: 'Hashtag analysis • Social media intelligence • Real-time trends',
      action: () => { setActiveAgent('trend_hunter'); setSection('trend_hunter'); }
    }
  ];

  return (
    <div className="h-full w-full relative flex bg-black" style={{WebkitOverflowScrolling: 'touch'}}>
      {/* LEFT SIDEBAR - AGENT NAVIGATOR */}
      <div className="hidden md:flex flex-col w-64 bg-black border-r border-[#00ff41]/20 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
        <div className="p-4 border-b border-[#00ff41]/20">
          <h3 className="text-xs font-mono font-bold text-[#00ff41] tracking-wider drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]">AI_STUDIO.SYS</h3>
          <p className="text-[9px] text-gray-600 mt-1 font-mono">SELECT AGENT_TO_INITIALIZE</p>
        </div>
        <div className="flex-1 space-y-1 p-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={agent.action}
              className={`w-full text-left px-3 py-2 transition-all text-[11px] font-mono border ${
                activeAgent === agent.id
                  ? 'bg-[#00ff41]/10 border-[#00ff41] text-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.3)]'
                  : 'border-[#333] text-gray-500 hover:border-[#00ff41]/40 hover:bg-black/80 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <agent.icon size={12} />
                <span className="font-bold tracking-wider">{agent.title.split(' ')[0]}</span>
              </div>
              <div className="text-[9px] text-gray-700 ml-4 mt-0.5">{agent.subtitle}</div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-[#00ff41]/20 text-center bg-black/50">
          <div className="text-[9px] text-gray-600 font-mono">AGENTS_ONLINE: {agents.length}</div>
          <div className="text-[9px] text-[#00ff41] font-bold mt-1 animate-pulse">● SYSTEM_READY</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 relative overflow-y-auto bg-black" style={{WebkitOverflowScrolling: 'touch'}}>
        {/* Dark gradient background matching landing page */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#051a05] via-black to-black pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          {/* Header matching landing page style */}
          <div className="text-center mb-12 md:mb-16">
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

        {/* Agent Cards Grid - Landing page style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              onClick={agent.action}
              onTouchEnd={(e) => { e.preventDefault(); agent.action(); }}
              className="group relative bg-black/50 backdrop-blur-sm border border-[#333] hover:border-[#00ff41]/50 p-4 md:p-6 flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 hover:bg-black/70 hover:scale-105 active:scale-95 touch-manipulation"
              style={{ 
                animation: 'fadeInUp 0.6s ease-out forwards',
                animationDelay: `${index * 0.1}s`,
                opacity: 0
              }}
            >
              {/* Icon with retro terminal style */}
              <div className="p-3 rounded-full bg-gradient-to-br from-[#111] to-black shadow-[inset_0_2px_5px_rgba(0,0,0,1)] group-hover:shadow-[0_0_20px_rgba(0,255,65,0.3)] transition-all duration-300">
                <agent.icon 
                  size={24} 
                  className="text-[#444] group-hover:text-[#00ff41] transition-colors duration-300 group-hover:drop-shadow-[0_0_10px_#00ff41]" 
                  strokeWidth={2}
                />
              </div>

              {/* Title */}
              <h3 className="text-sm md:text-base font-mono font-bold text-gray-600 group-hover:text-[#00ff41] tracking-wider transition-colors duration-300 text-center">
                {agent.title.split(' ')[0]}
              </h3>
              
              {/* Subtitle */}
              <p className="text-[10px] font-mono tracking-wider uppercase text-gray-700 group-hover:text-[#00ff41]/70 transition-colors duration-300 text-center">
                {agent.subtitle}
              </p>

              {/* Bottom indicator line */}
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#00ff41] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center shadow-[0_0_10px_#00ff41]"></div>
            </div>
          ))}
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 animate-fade-in">
      <div className="w-full max-w-md bg-[#1a1a1a] border-2 border-cyan-500 shadow-[0_0_40px_rgba(0,255,255,0.4)]">
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
        return <StudioHub setSection={setActiveSection} />;
      case 'ghostwriter':
        return <Ghostwriter />;
      case 'chat':
        return <SidekickChat />;
      case 'battle':
        return <RapBattle />;
      case 'crates':
        return <CrateDigger />;
      case 'news':
        return <NewsArchive />;
      case 'ar_suite':
        return <ARSuite />;
      case 'album_art':
        return <AlbumArtGenerator user={user} onAuthRequest={() => setShowAuthModal(true)} />;
      case 'viral_video':
        return <ViralVideoAgent user={user} onAuthRequest={() => setShowAuthModal(true)} />;
      case 'trend_hunter':
        return <TrendHunter />;
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
                className={`px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-xs font-mono uppercase transition-colors whitespace-nowrap ${
                  activeSection === section ? 'bg-[#00ff41] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {section === 'music' ? 'Lost Tapes' : section}
              </button>
            ))}
            <button 
              onClick={() => setActiveSection('comeup')} 
              className={`px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-xs font-mono uppercase transition-colors whitespace-nowrap ${
                activeSection === 'comeup' ? 'bg-yellow-500 text-black font-bold' : 'text-yellow-500 hover:text-white font-bold'
              }`}
            >
              COME UP
            </button>
            <button 
              onClick={() => setActiveSection('studio')} 
              className={`px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-xs font-mono uppercase transition-colors whitespace-nowrap ${
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
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl transition-all duration-700 ${isEntering ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}>
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

        <div className={`relative group cursor-pointer transition-all duration-700 touch-manipulation ${isEntering ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}`} onClick={handleEnterClick} onTouchEnd={(e) => { e.preventDefault(); handleEnterClick(); }}>
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
      
      <div className={`absolute bottom-8 w-full px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-[#00ff41]/30 font-mono text-[10px] tracking-widest uppercase gap-2 transition-opacity duration-1000 ${isEntering ? 'opacity-0' : 'opacity-100'}`}>
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
        <div className="absolute inset-0 bg-black opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
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




