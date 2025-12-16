/**
 * Studio Agents - Mobile-First AI Music Studio
 * A High Fidelity Agency Production
 * Sister App to Whip Montez ARG
 */

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import {
  Sparkles, Feather, Flame, Briefcase, Disc, Image as ImageIcon, Video, Hash,
  Mic, Play, Pause, Loader2, X, ChevronRight, ChevronLeft, ChevronDown,
  TrendingUp, Newspaper, User, Crown, Mail, LogOut, Zap, Music, Send,
  Star, Check, ExternalLink, ArrowRight, Rocket, Target, DollarSign,
  Users, Award, Radio, Clock, AlertCircle, RefreshCw, Copy, Volume2
} from 'lucide-react';

// =============================================================================
// FIREBASE CONFIGURATION
// =============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyAKWKmHVfwKHuH_Huf4C2XcMAxk3pkkuz8",
  authDomain: "studioagents-app.firebaseapp.com",
  projectId: "studioagents-app",
  storageBucket: "studioagents-app.firebasestorage.app",
  messagingSenderId: "460525904786",
  appId: "1:460525904786:web:6c59dbc6837ead2ed9d74b",
  measurementId: "G-37J2MVHXS7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// =============================================================================
// CONFIG
// =============================================================================

const CONFIG = Object.freeze({
  APP_NAME: 'Studio Agents',
  TAGLINE: 'AI-Powered Music Studio',
  SISTER_APP: {
    name: 'Whip Montez ARG',
    url: 'https://whipmontez.com',
    tagline: 'The Immersive Hip-Hop Experience'
  },
  API: {
    BASE_URL: import.meta.env.VITE_BACKEND_URL || 
      (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://restored-os-whip-montez-production.up.railway.app'),
    TIMEOUT: 30000,
  },
  FREE_LIMITS: {
    ghostwriter: 5, songwriter: 5, battle: 3, crates: 5,
    ar_suite: 3, album_art: 3, viral_video: 3, trend_hunter: 5,
  },
  PREMIUM_LIMITS: {
    ghostwriter: 100, songwriter: 100, battle: 50, crates: 100,
    ar_suite: 50, album_art: 50, viral_video: 50, trend_hunter: 100,
  },
});

// =============================================================================
// SECURITY UTILITIES
// =============================================================================

const sanitizeInput = (input, maxLength = 5000) => {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\r\n]{3,}/g, '\n\n');
};

const validatePrompt = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, sanitized: '', error: 'Enter a prompt' };
  }
  const sanitized = sanitizeInput(prompt);
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/i,
    /forget\s+(everything|all)/i,
    /you\s+are\s+now/i,
    /system\s+prompt|secret\s+instructions?/i,
  ];
  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      return { isValid: false, sanitized: '', error: 'Invalid input' };
    }
  }
  return { isValid: true, sanitized };
};

// =============================================================================
// API SERVICE
// =============================================================================

const getAuthToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try { return await currentUser.getIdToken(); } 
  catch { return null; }
};

const ApiService = {
  async generate(prompt, systemInstruction = '') {
    const validation = validatePrompt(prompt);
    if (!validation.isValid) throw new Error(validation.error);
    
    const headers = { 'Content-Type': 'application/json' };
    const token = await getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);
    
    try {
      const response = await fetch(`${CONFIG.API.BASE_URL}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: validation.sanitized,
          systemInstruction: sanitizeInput(systemInstruction, 1000),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.output || data.message || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error('Request timeout');
      throw error;
    }
  },
  
  async getNews() {
    try {
      const response = await fetch(`${CONFIG.API.BASE_URL}/api/news`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      return data.articles || [];
    } catch { return []; }
  },
};

// =============================================================================
// AUTH CONTEXT
// =============================================================================

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            const newProfile = {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              tier: 'premium',
              createdAt: serverTimestamp(),
              usage: {},
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (e) { console.error('[Auth]', e); }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const signInWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signUpWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);
  const isPremium = !!user;
  
  const updateUsage = async (agentId, newCount) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { [`usage.${agentId}`]: newCount });
    } catch {}
  };
  
  const getUsage = (agentId) => userProfile?.usage?.[agentId] || 0;
  
  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isPremium, signInWithEmail, signUpWithEmail, signInWithGoogle, logout, updateUsage, getUsage }}>
      {children}
    </AuthContext.Provider>
  );
};

// =============================================================================
// HOOKS
// =============================================================================

const useUsageLimit = (agentId) => {
  const auth = useAuth();
  const isPremium = auth?.isPremium || false;
  const limit = isPremium ? (CONFIG.PREMIUM_LIMITS[agentId] || 100) : (CONFIG.FREE_LIMITS[agentId] || 5);
  const firestoreUsage = auth?.getUsage?.(agentId) || 0;
  
  const [used, setUsed] = useState(() => {
    if (isPremium) return firestoreUsage;
    try { return parseInt(localStorage.getItem(`studio_${agentId}`) || '0', 10); } 
    catch { return 0; }
  });
  
  useEffect(() => { if (isPremium) setUsed(firestoreUsage); }, [isPremium, firestoreUsage]);
  
  const canUse = used < limit;
  const remaining = Math.max(0, limit - used);
  
  const consume = useCallback(() => {
    if (!canUse) return;
    const newUsed = used + 1;
    setUsed(newUsed);
    if (isPremium && auth?.updateUsage) {
      auth.updateUsage(agentId, newUsed);
    } else {
      try { localStorage.setItem(`studio_${agentId}`, newUsed.toString()); } catch {}
    }
  }, [used, canUse, isPremium, auth, agentId]);
  
  return { canUse, remaining, limit, consume, isPremium };
};

// =============================================================================
// ONBOARDING - PROFESSIONAL & COMPREHENSIVE
// =============================================================================

const OnboardingScreen = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  
  const slides = [
    {
      icon: Sparkles,
      title: 'Studio Agents',
      subtitle: 'AI-Powered Production Tools for Independent Artists',
      description: 'Professional tools designed specifically for hip-hop producers, songwriters, and artists. Get the same capabilities major labels have—without the label.',
    },
    {
      icon: Mic,
      title: 'How It Works',
      subtitle: '8 Specialized AI Agents',
      list: [
        { title: 'Ghostwriter', desc: 'AI-powered lyric writing with professional wordplay' },
        { title: 'Songwriter', desc: 'Full song structure composition' },
        { title: 'Battle AI', desc: 'Practice freestyle battles in real-time' },
        { title: 'Crate Digger', desc: 'Discover rare samples by mood & era' },
        { title: 'A&R Office', desc: 'Get industry-level feedback' },
        { title: 'Viral Video', desc: 'TikTok/Reels content strategy' },
        { title: 'Trend Hunter', desc: 'Real-time cultural trends' },
        { title: 'Album Art', desc: 'Visual concepts for your work' },
      ]
    },
    {
      icon: Target,
      title: 'Getting Started',
      subtitle: 'Your First Session',
      steps: [
        '1. Select an agent from the Studio tab',
        '2. Describe what you need (e.g., "write a hook about money")',
        '3. Get professional AI responses instantly',
        '5 free generations per agent to start',
        'Sign in for 100 per agent + cloud sync',
      ]
    },
    {
      icon: Award,
      title: 'Examples',
      subtitle: 'What You Can Create',
      examples: [
        'Ghostwriter: "Write a 8-bar hook about overcoming obstacles" → Get pro-level lyrics',
        'Crate Digger: "Lofi soul sample, early 2000s vibe" → Discover rare tracks',
        'A&R Office: "My song is a conscious rapper track" → Get commercial feedback',
        'Battle AI: Spit your bars → Get creative diss responses to practice',
      ]
    },
    {
      icon: TrendingUp,
      title: 'The Come Up',
      subtitle: 'Your Music Career Blueprint',
      description: 'Master Your Craft • Own Your Business • Build Your Network • Define Your Brand\n\nEach section has actionable steps to build a sustainable music career on your terms.',
    },
    {
      icon: Crown,
      title: 'Ready to Create?',
      subtitle: 'Sign in to unlock 100 generations per agent',
      description: 'Free tier: 5 generations per agent\nPremium: 100 per agent + cloud sync + priority access',
      cta: true,
    },
  ];
  
  const current = slides[step];
  const totalSlides = slides.length;
  const isLast = step === totalSlides - 1;
  
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden safe-top">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-white/8">
        <h2 className="text-lg font-semibold text-white">Welcome</h2>
        <button onClick={onComplete} className="text-xs text-white/40 font-medium px-3 py-1 hover:text-white/60">Skip</button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Icon */}
          <div className="w-16 h-16 flex-center mb-6 bg-white/10 rounded-lg">
            <current.icon size={32} className="text-white" />
          </div>
          
          {/* Title & Subtitle */}
          <h1 className="text-2xl font-bold text-white mb-2">{current.title}</h1>
          <p className="text-sm text-white/50 mb-6">{current.subtitle}</p>
          
          {/* Description */}
          {current.description && (
            <p className="text-sm text-white/70 leading-relaxed mb-6 whitespace-pre-wrap">{current.description}</p>
          )}
          
          {/* List */}
          {current.list && (
            <div className="space-y-3 mb-6">
              {current.list.map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/8">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-white/50 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Steps */}
          {current.steps && (
            <div className="space-y-2 mb-6">
              {current.steps.map((step, i) => (
                <div key={i} className="text-sm text-white/70 flex items-start gap-3">
                  <span className="text-white/30 font-mono flex-shrink-0">{typeof step === 'string' && step.charAt(0)}</span>
                  <span>{typeof step === 'string' ? step.slice(1) : step}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Examples */}
          {current.examples && (
            <div className="space-y-3 mb-6">
              {current.examples.map((example, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/8">
                  <p className="text-xs text-white/70 font-mono leading-relaxed">{example}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-5 py-6 border-t border-white/8 space-y-3 safe-bottom">
        {current.cta ? (
          <button
            onClick={onComplete}
            className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-all"
          >
            Get Started
          </button>
        ) : (
          <button
            onClick={() => setStep(Math.min(step + 1, totalSlides - 1))}
            className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-all"
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        )}
        
        <div className="flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? 'w-6 bg-white' : i < step ? 'w-1 bg-white/60' : 'w-1 bg-white/20'
              }`}
            />
          ))}
        </div>
        
        <p className="text-xs text-white/30 text-center">
          Step {step + 1} of {totalSlides}
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// AUTH MODAL
// =============================================================================

const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
      onClose();
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, ''));
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try { await signInWithGoogle(); onClose(); }
    catch (err) { setError(err.message.replace('Firebase: ', '')); }
    finally { setLoading(false); }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-black-3 rounded-t-lg sm:rounded-lg border border-white/10" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-12 h-0.5 rounded-full bg-white/20" />
        </div>
        
        {/* Header */}
        <div className="p-6 text-center border-b border-white/8">
          <h2 className="text-xl font-bold text-white">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-white/50 mt-2 text-xs">100 generations per agent</p>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          
          <button type="button" onClick={handleGoogle} disabled={loading}
            className="w-full p-3 bg-white text-black font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/30 text-xs">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>
          
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-white/30 outline-none text-sm" />
          
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (6+ chars)" required minLength={6}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-white/30 outline-none text-sm" />
          
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-white text-black font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 text-sm hover:bg-white/90">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
          
          <p className="text-center text-white/50 text-xs">
            {mode === 'signin' ? "Don't have one? " : 'Already have one? '}
            <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }} className="text-white hover:underline">
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// HEADER
// =============================================================================

const Header = ({ title, subtitle, showAuth = true }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const auth = useAuth();
  
  return (
    <>
      <header className="px-5 pt-6 pb-4 border-b border-white/8 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-white/50 text-sm mt-0.5">{subtitle}</p>}
          </div>
          
          {showAuth && (
            auth?.user ? (
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15">
                  <Crown size={14} className="text-white" />
                  <span className="text-white text-xs font-medium max-w-[80px] truncate">
                    {auth.userProfile?.displayName || 'Pro'}
                  </span>
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-black-3 border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
                      <div className="p-3 border-b border-white/5">
                        <p className="text-white font-medium text-sm truncate">{auth.user.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Crown size={11} className="text-white/50" />
                          <span className="text-white/50 text-xs">Premium • 100 gens/agent</span>
                        </div>
                      </div>
                      <button onClick={() => { auth.logout(); setShowMenu(false); }}
                        className="w-full p-3 flex items-center gap-3 text-white/60 hover:bg-white/5 hover:text-white text-sm">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90">
                <User size={14} /> Sign In
              </button>
            )
          )}
        </div>
      </header>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

// =============================================================================
// AGENT COMPONENTS
// =============================================================================

const AgentCard = ({ agent, onClick }) => (
  <button onClick={onClick}
    className="card p-4 rounded-lg text-left transition-all active:scale-95 group flex items-start gap-4">
    <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
      <agent.icon size={24} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-semibold">{agent.title}</h3>
      <p className="text-white/50 text-sm mt-0.5">{agent.subtitle}</p>
    </div>
    <ChevronRight size={18} className="text-white/30 flex-shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
  </button>
);

const AgentView = ({ agent, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { canUse, remaining, consume, isPremium } = useUsageLimit(agent.id);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    if (!canUse) {
      if (!isPremium) setShowAuthModal(true);
      return;
    }
    
    const userMessage = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      consume();
      const response = await ApiService.generate(input, agent.systemPrompt);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: `Error: ${error.message}`, isUser: false, error: true }]);
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };
  
  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className={`${agent.gradient} px-5 pt-6 pb-5 safe-top`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
            <ChevronLeft size={24} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{agent.title}</h1>
            <p className="text-white/70 text-sm">{agent.subtitle}</p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-black/20 text-white/80 text-xs font-medium">
            {remaining} left
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl ${agent.gradient} flex items-center justify-center opacity-30`}>
              <agent.icon size={40} className="text-white" />
            </div>
            <p className="text-white/40 text-lg font-medium mb-2">{agent.placeholder}</p>
            <p className="text-white/20 text-sm">{remaining} free generations remaining</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-5 py-4 rounded-3xl ${
              msg.isUser 
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-lg' 
                : msg.error 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-bl-lg'
                  : 'bg-white/5 text-white/90 rounded-bl-lg border border-white/5'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
              {!msg.isUser && !msg.error && (
                <button 
                  onClick={() => copyToClipboard(msg.text)}
                  className="mt-3 flex items-center gap-1.5 text-white/40 hover:text-white/60 text-xs"
                >
                  <Copy size={12} /> Copy
                </button>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="px-5 py-4 rounded-3xl rounded-bl-lg bg-white/5 border border-white/5">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-violet-400" />
                <span className="text-white/40 text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-5 safe-bottom border-t border-white/5">
        {!canUse && !isPremium ? (
          <button onClick={() => setShowAuthModal(true)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center gap-2">
            <Crown size={18} /> Sign In for 100 More
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              placeholder={agent.inputPlaceholder || "Type your message..."}
              className="flex-1 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 outline-none"
            />
            <button onClick={handleSubmit} disabled={loading || !input.trim()}
              className="w-14 h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center disabled:opacity-30">
              <Send size={20} className="text-white" />
            </button>
          </div>
        )}
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

// =============================================================================
// PAGES
// =============================================================================

const AGENTS = [
  { id: 'ghostwriter', title: 'Ghostwriter', subtitle: 'AI Lyric Engine', icon: Sparkles, gradient: 'bg-gradient-to-br from-violet-600 to-indigo-600', systemPrompt: 'You are Ghostwriter, an elite hip-hop lyricist AI. Write creative, authentic lyrics with clever wordplay, metaphors, and punchlines. Match the requested style and mood. Be concise but impactful.', placeholder: 'What kind of lyrics do you need?', inputPlaceholder: 'Describe your song concept...' },
  { id: 'songwriter', title: 'Songwriter', subtitle: 'Full Song Writer', icon: Feather, gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', systemPrompt: 'You are a professional songwriter. Help create complete songs with hooks, verses, bridges, and choruses. Focus on structure, melody suggestions, and emotional impact.', placeholder: 'Need a full song structure?', inputPlaceholder: 'What\'s your song about?' },
  { id: 'battle', title: 'Battle AI', subtitle: 'Sharpen Your Skills', icon: Flame, gradient: 'bg-gradient-to-br from-red-500 to-orange-600', systemPrompt: 'You are a battle rap AI. When the user spits bars, respond with a devastating freestyle diss. Be clever, use wordplay, and go hard. This is practice for real battles.', placeholder: 'Spit your bars and I\'ll respond', inputPlaceholder: 'Drop your verse...' },
  { id: 'crates', title: 'Crate Digger', subtitle: 'Sample Discovery', icon: Disc, gradient: 'bg-gradient-to-br from-amber-500 to-yellow-600', systemPrompt: 'You are Crate Digger, a sample discovery AI with encyclopedic knowledge of obscure records. Suggest samples based on mood, era, or reference tracks. Include artist, song, year, and why it would work.', placeholder: 'What kind of samples you looking for?', inputPlaceholder: 'Describe the vibe...' },
  { id: 'ar_suite', title: 'A&R Office', subtitle: 'Industry Feedback', icon: Briefcase, gradient: 'bg-gradient-to-br from-purple-600 to-pink-600', systemPrompt: 'You are an A&R executive AI. Provide honest, constructive feedback on music concepts. Evaluate commercial viability, artist development potential, and give actionable advice.', placeholder: 'Get industry-level feedback', inputPlaceholder: 'Describe your project...' },
  { id: 'viral_video', title: 'Viral Video', subtitle: 'Content Strategy', icon: Video, gradient: 'bg-gradient-to-br from-rose-500 to-red-600', systemPrompt: 'You are a viral content strategist AI. Create concepts for TikTok, Reels, and Shorts that will maximize engagement. Include hooks, visual concepts, and trend alignment.', placeholder: 'Need a viral video concept?', inputPlaceholder: 'What\'s the song or vibe?' },
  { id: 'trend_hunter', title: 'Trend Hunter', subtitle: 'Real-Time Intel', icon: Hash, gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600', systemPrompt: 'You are Trend Hunter, a social media trend analyst AI. Identify what\'s trending in music, culture, and social media. Help artists capitalize on emerging trends.', placeholder: 'What trends interest you?', inputPlaceholder: 'Ask about trends...' },
  { id: 'album_art', title: 'Album Art', subtitle: 'Visual Concepts', icon: ImageIcon, gradient: 'bg-gradient-to-br from-pink-500 to-violet-600', systemPrompt: 'You are an album art conceptualist AI. Create detailed visual concepts for album covers, singles, and promotional art based on the music\'s mood, themes, and artist brand.', placeholder: 'Describe your project for art concepts', inputPlaceholder: 'Describe your music...' },
];

const HelpPage = () => {
  const [expanded, setExpanded] = useState(null);
  
  const agentHelp = [
    {
      id: 'ghostwriter',
      name: 'Ghostwriter',
      desc: 'AI Lyric Engine',
      tips: [
        'Be specific: "Write a 16-bar verse about losing everything" works better than "write bars"',
        'Reference artists: "In the style of J. Cole with double entendres"',
        'Specify mood: aggressive, melodic, introspective, braggadocio, conscious',
        'Ask for specific techniques: "Use internal rhymes and metaphors"'
      ]
    },
    {
      id: 'songwriter',
      name: 'Songwriter',
      desc: 'Full Song Writer',
      tips: [
        'Describe your song concept clearly',
        'Specify genre and tempo if relevant',
        'Give examples of similar songs you like',
        'You\'ll get verse/chorus/bridge structure in one response'
      ]
    },
    {
      id: 'battle',
      name: 'Battle AI',
      desc: 'Sharpen Your Skills',
      tips: [
        'Drop your best bars and Battle AI will fire back',
        'Use it to practice wordplay and punchlines',
        'Perfect for warming up before real battles',
        'The AI looks for your style and matches the energy'
      ]
    },
    {
      id: 'crates',
      name: 'Crate Digger',
      desc: 'Sample Discovery',
      tips: [
        'Be specific about mood: "lofi soul," "70s funk," "jazzy"',
        'Describe the vibe: "uplifting," "dark," "groovy"',
        'Reference era: "1970-1980," "early 2000s"',
        'You\'ll get artist, song title, year, and why it works'
      ]
    },
    {
      id: 'ar_suite',
      name: 'A&R Office',
      desc: 'Industry Feedback',
      tips: [
        'Describe your project: genre, artist name, target audience',
        'Be honest about what stage you\'re at',
        'You\'ll get brutally honest feedback on commercial viability',
        'Ask about artist development opportunities'
      ]
    },
    {
      id: 'viral_video',
      name: 'Viral Video',
      desc: 'Content Strategy',
      tips: [
        'Describe your track or concept',
        'Mention platform: TikTok, Instagram Reels, YouTube Shorts',
        'You\'ll get hooks, visual concepts, trend alignment',
        'Perfect for planning your rollout strategy'
      ]
    },
    {
      id: 'trend_hunter',
      name: 'Trend Hunter',
      desc: 'Real-Time Intel',
      tips: [
        'Ask "What\'s trending in hip-hop right now?"',
        'Ask about specific subgenres or sounds',
        'Get intel on what\'s about to blow up',
        'Learn how to position your music in current landscape'
      ]
    },
    {
      id: 'album_art',
      name: 'Album Art',
      desc: 'Visual Concepts',
      tips: [
        'Describe your music and message',
        'Share your artistic vision or aesthetic',
        'Specify mood: minimalist, bold, conceptual, etc.',
        'You\'ll get detailed visual direction for designers'
      ]
    }
  ];
  
  return (
    <div className="h-full overflow-y-auto bg-black">
      <Header title="Help" subtitle="How to use each agent" showAuth={false} />
      
      <div className="px-5 pb-32 space-y-3">
        {agentHelp.map(agent => (
          <div key={agent.id} className="card rounded-lg">
            <button
              onClick={() => setExpanded(expanded === agent.id ? null : agent.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-lg"
            >
              <div className="text-left">
                <h3 className="font-semibold text-white">{agent.name}</h3>
                <p className="text-xs text-white/50 mt-1">{agent.desc}</p>
              </div>
              <ChevronDown size={18} className={`text-white/40 transition-transform ${expanded === agent.id ? 'rotate-180' : ''}`} />
            </button>
            
            {expanded === agent.id && (
              <div className="px-4 pb-4 space-y-2 border-t border-white/5">
                {agent.tips.map((tip, i) => (
                  <div key={i} className="text-xs text-white/60 pt-2 flex items-start gap-2">
                    <span className="text-accent-brand mt-1 flex-shrink-0">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const StudioPage = ({ onSelectAgent }) => {
  const [showHelp, setShowHelp] = useState(false);
  
  if (showHelp) {
    return <HelpPage />;
  }
  
  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="flex items-center justify-between px-5 pt-6 pb-4 safe-top">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Studio</h1>
          <p className="text-white/40 text-sm mt-0.5">AI-powered creative tools</p>
        </div>
        <button onClick={() => setShowHelp(true)} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20">
          Help
        </button>
      </div>
      
      {/* Sister App Banner */}
      <a href={CONFIG.SISTER_APP.url} target="_blank" rel="noopener noreferrer"
        className="mx-5 mb-5 p-4 rounded-lg bg-white/5 border border-white/10 flex items-center gap-4 group hover:bg-white/8 transition-colors">
        <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
          <Radio size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">{CONFIG.SISTER_APP.name}</p>
          <p className="text-white/50 text-xs mt-0.5">{CONFIG.SISTER_APP.tagline}</p>
        </div>
        <ExternalLink size={16} className="text-white/40 flex-shrink-0" />
      </a>
      
      {/* Agents Grid */}
      <div className="px-5 pb-32 space-y-3">
        {AGENTS.map(agent => (
          <AgentCard key={agent.id} agent={agent} onClick={() => onSelectAgent(agent)} />
        ))}
      </div>
    </div>
  );
};

const ComeUpPage = () => {
  const pillars = [
    { 
      id: 'craft', 
      icon: Music, 
      color: 'from-cyan-500 to-blue-600', 
      title: 'Master Your Craft', 
      subtitle: 'The 10,000 hour truth', 
      description: 'Write every day. Study the greats. Practice your delivery until it\'s second nature. There are no shortcuts to greatness.',
      tips: ['Write 16 bars daily', 'Study song structures', 'Record yourself constantly', 'Get honest feedback']
    },
    { 
      id: 'business', 
      icon: DollarSign, 
      color: 'from-amber-500 to-orange-600', 
      title: 'Own Your Business', 
      subtitle: 'Money, masters & publishing', 
      description: 'Understand your publishing. Keep your masters. Build multiple revenue streams. Music is a business first.',
      tips: ['Keep your masters', 'Learn publishing splits', 'Diversify income', 'Read every contract']
    },
    { 
      id: 'network', 
      icon: Users, 
      color: 'from-emerald-500 to-teal-600', 
      title: 'Build Your Network', 
      subtitle: 'Relationships over clout', 
      description: 'Connect with other artists. Find mentors. Build genuine relationships. Your network is your net worth.',
      tips: ['Collaborate often', 'Support other artists', 'Find mentors', 'Show up consistently']
    },
    { 
      id: 'brand', 
      icon: Star, 
      color: 'from-pink-500 to-rose-600', 
      title: 'Define Your Brand', 
      subtitle: 'Stand out from the noise', 
      description: 'Know who you are as an artist. Build a visual identity. Be consistent. Be authentic. Be memorable.',
      tips: ['Find your niche', 'Visual consistency', 'Authentic storytelling', 'Content strategy']
    },
  ];
  
  const [expanded, setExpanded] = useState(null);
  
  return (
    <div className="h-full overflow-y-auto bg-black">
      <Header title="The Come Up" subtitle="Your blueprint to success" />
      
      {/* Intro */}
      <div className="px-5 mb-6">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10">
          <p className="text-white/70 leading-relaxed text-sm">
            The music industry is built to keep you dependent. <span className="text-white font-semibold">The Come Up</span> is your playbook for building a sustainable career on your own terms.
          </p>
        </div>
      </div>
      
      {/* Pillars */}
      <div className="px-5 pb-32 space-y-4">
        {pillars.map(pillar => (
          <div key={pillar.id} className="rounded-3xl overflow-hidden border border-white/10">
            <button
              onClick={() => setExpanded(expanded === pillar.id ? null : pillar.id)}
              className={`w-full p-5 bg-gradient-to-r ${pillar.color} text-left flex items-center gap-4`}
            >
              <div className="w-14 h-14 rounded-2xl bg-black/20 flex items-center justify-center">
                <pillar.icon size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">{pillar.title}</h3>
                <p className="text-white/70 text-sm">{pillar.subtitle}</p>
              </div>
              <ChevronDown size={24} className={`text-white/50 transition-transform ${expanded === pillar.id ? 'rotate-180' : ''}`} />
            </button>
            
            {expanded === pillar.id && (
              <div className="p-5 bg-white/5">
                <p className="text-white/70 leading-relaxed text-sm">{pillar.description}</p>
                <div className="mt-4 space-y-2">
                  {pillar.tips.map((tip, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/60 text-sm">
                      <Check size={14} className="text-emerald-400" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const NewsPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const news = await ApiService.getNews();
      setArticles(news);
      setLoading(false);
    };
    fetchNews();
  }, []);
  
  // Fallback articles if API returns nothing
  const fallbackArticles = [
    { title: 'AI in Music Production: The Future is Now', source: 'Music Tech Weekly', content: 'How independent artists are using AI to compete with major labels.', date: 'Today' },
    { title: 'Building Your Brand in the Streaming Era', source: 'Artist Development', content: 'Strategies for standing out when everyone has access to the same tools.', date: 'Yesterday' },
    { title: 'The Rise of Independent Distribution', source: 'Industry Insider', content: 'Why more artists are choosing to stay independent.', date: '2 days ago' },
  ];
  
  const displayArticles = articles.length > 0 ? articles : fallbackArticles;
  
  return (
    <div className="h-full overflow-y-auto bg-black">
      <Header title="News" subtitle="Industry updates" />
      
      <div className="px-5 pb-32 space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-white/5 animate-pulse" />
          ))
        ) : (
          displayArticles.map((article, i) => (
            <a key={i} href={article.link || '#'} target="_blank" rel="noopener noreferrer"
              className="block p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <h3 className="text-white font-semibold line-clamp-2">{article.title}</h3>
              {article.content && <p className="text-white/50 text-sm mt-2 line-clamp-2">{article.content}</p>}
              <div className="flex items-center gap-3 mt-3">
                <span className="text-violet-400 text-xs font-medium">{article.source}</span>
                {article.date && <span className="text-white/30 text-xs">{article.date}</span>}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN APP
// =============================================================================

const App = () => {
  const [activeTab, setActiveTab] = useState('studio');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('studio_onboarded');
  });
  
  const completeOnboarding = () => {
    localStorage.setItem('studio_onboarded', 'true');
    setShowOnboarding(false);
  };
  
  if (showOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }
  
  if (selectedAgent) {
    return <AgentView agent={selectedAgent} onBack={() => setSelectedAgent(null)} />;
  }
  
  const tabs = [
    { id: 'studio', label: 'Studio', icon: Zap },
    { id: 'comeup', label: 'Come Up', icon: TrendingUp },
    { id: 'news', label: 'News', icon: Newspaper },
  ];
  
  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'studio' && <StudioPage onSelectAgent={setSelectedAgent} />}
        {activeTab === 'comeup' && <ComeUpPage />}
        {activeTab === 'news' && <NewsPage />}
      </div>
      
      {/* Bottom Nav */}
      <nav className="bg-[#0c0c0e] border-t border-white/5 safe-bottom">
        <div className="flex justify-around py-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-3 px-6 rounded-2xl transition-all ${
                activeTab === tab.id ? 'text-white' : 'text-white/40'
              }`}>
              <tab.icon size={24} className={activeTab === tab.id ? 'text-violet-400' : ''} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

// Wrap with AuthProvider
const AppWithAuth = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithAuth;
