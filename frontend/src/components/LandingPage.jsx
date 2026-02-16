import React, { useState, useEffect, Suspense } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, ArrowRight, Zap, Music, Users, Globe as GlobeIcon, Target, Rocket, Shield, X, Play, TrendingUp, Clock, DollarSign, Headphones, Star, ChevronRight, Layers, BarChart3, Briefcase, Award, ExternalLink, Settings, Code, Cpu, Lightbulb, CheckCircle, AlertCircle, FileText, Lock as LockIcon, LogIn, LogOut } from 'lucide-react';
import { AGENTS } from '../constants';
import { auth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signOut } from '../firebase';
import { AGENT_WHITEPAPER, DEFAULT_WHITEPAPER } from '../data/agentWhitepapers';

// Lazy loaded complex components (standardizing to React.lazy to prevent 'lazy is not defined' error)
const MultiAgentDemo = React.lazy(() => import('./MultiAgentDemo'));
const SingleAgentDemo = React.lazy(() => import('./SingleAgentDemo'));

export default function LandingPage({ onEnter, onSubscribe, onStartTour: _onStartTour }) {
  console.log("LandingPage: Rendering...");
  const [scrolled, setScrolled] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const [showInvestorPitch, setShowInvestorPitch] = useState(false);

  // ðŸš€ Check if already logged in via Firebase OR localStorage
  const [isLoggedMember, setIsLoggedMember] = useState(false);
  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth not initialized in LandingPage!");
      return;
    }
    // 1. Initial check via local storage
    const hasUserId = localStorage.getItem('studio_user_id');
    const isGuest = localStorage.getItem('studio_guest_mode') === 'true';
    setIsLoggedMember(!!(auth.currentUser || hasUserId || isGuest));

    // 2. Firebase Auth listener for more accuracy
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoggedMember(true);
      } else {
        const stillGuest = localStorage.getItem('studio_guest_mode') === 'true';
        setIsLoggedMember(stillGuest);
      }
    });

    return () => unsubscribe();
  }, []);
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // Store what to do after auth
  const [pendingTargetTab, setPendingTargetTab] = useState(null); // Store which tab to navigate to
  const [isTransitioning, setIsTransitioning] = useState(false); // Guard against race conditions
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  
  // Handle Google Sign In - with transition guard
  const handleGoogleSignIn = async () => {
    if (isTransitioning || authLoading) return;
    
    setAuthLoading(true);
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      
      setIsTransitioning(true);
      setShowAuthModal(false);
      
      // Small delay to let modal close
      setTimeout(() => {
        if (pendingAction === 'start') {
          onEnter(true, false, pendingTargetTab);
        } else {
          onEnter(false, false, pendingTargetTab);
        }
        setPendingTargetTab(null);
        setIsTransitioning(false);
      }, 100);
    } catch (error) {
      console.error('Google sign in error:', error);
      const msg = error.code === 'auth/popup-closed-by-user' 
        ? 'Sign-in cancelled.' 
        : error.code === 'auth/popup-blocked'
          ? 'Popup blocked by browser.'
          : error.message || 'Failed to sign in.';
      
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Apple Sign In (required by Apple App Store)
  const handleAppleSignIn = async () => {
    if (isTransitioning || authLoading) return;

    setAuthLoading(true);
    setAuthError('');
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithPopup(auth, provider);

      setIsTransitioning(true);
      setShowAuthModal(false);

      setTimeout(() => {
        if (pendingAction === 'start') {
          onEnter(true, false, pendingTargetTab);
        } else {
          onEnter(false, false, pendingTargetTab);
        }
        setPendingTargetTab(null);
        setIsTransitioning(false);
      }, 100);
    } catch (error) {
      console.error('Apple sign in error:', error);
      const msg = error.code === 'auth/popup-closed-by-user'
        ? 'Sign-in cancelled.'
        : error.code === 'auth/popup-blocked'
          ? 'Popup blocked by browser.'
          : error.message || 'Failed to sign in with Apple.';

      setAuthError(msg);
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Email/Password Auth
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (isTransitioning || authLoading) return;
    if (!authEmail || !authPassword) {
      setAuthError('Please enter email and password');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      if (authMode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        // ðŸ“§ Send email verification and sign out until verified
        try {
          await sendEmailVerification(result.user);
          setAuthError('Account created! Please verify your email to log in. Check your inbox.');
          await signOut(auth);
          setAuthLoading(false);
          setAuthMode('login');
          return;
        } catch (verifyErr) {
          console.error('Verification email failed', verifyErr);
          setAuthError('Account created, but could not send verification email. Try logging in.');
          await signOut(auth);
          setAuthLoading(false);
          return;
        }
      } else {
        const result = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        
        // ðŸ“§ Check if email is verified
        if (!result.user.emailVerified) {
          setAuthError('Email not verified. A new verification link has been sent to your inbox.');
          try {
            await sendEmailVerification(result.user);
          } catch (resendErr) {
            console.warn('Could not resend verification email', resendErr);
          }
          await signOut(auth);
          setAuthLoading(false);
          return;
        }
      }

      setIsTransitioning(true);
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');

      setTimeout(() => {
        if (pendingAction === 'start') {
          onEnter(true, false, pendingTargetTab);
        } else {
          onEnter(false, false, pendingTargetTab);
        }
        setPendingTargetTab(null);
        setIsTransitioning(false);
      }, 100);
    } catch (error) {
      console.error('Email auth error:', error);
      let msg = error.message || 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        msg = 'Email already in use. Try signing in instead.';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password';
      } else if (error.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters';
      }
      
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async () => {
    if (!authEmail) {
      setAuthError('Please enter your email first');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, authEmail);
      setAuthError(''); // Clear any previous errors
      setAuthMode('login');
      // Show success message using authError field temporarily
      setAuthError('Password reset email sent! Check your inbox.');
    } catch (error) {
      setAuthError(error.message || 'Failed to send reset email');
    } finally {
      setAuthLoading(false);
    }
  };
  
  // Handle CTA button clicks - show auth modal (with guard)
  const handleCtaClick = (action = 'start', targetTab = 'resources') => {
    if (isTransitioning) return; // Prevent clicks during transition
    
    // ðŸš€ Check if already logged in via Firebase OR localStorage
    const hasUserId = localStorage.getItem('studio_user_id');
    const isGuest = localStorage.getItem('studio_guest_mode') === 'true';
    const isActuallyLogged = !!(auth?.currentUser || hasUserId || isGuest);
    
    // Override 'start' action for returning members to avoid re-triggering wizard
    const finalAction = isActuallyLogged && action === 'start' ? 'return' : action;
    
    // Allow 'login' action to bypass 'isActuallyLogged' check if only logged as guest or not at all
    const isExplicitLogin = action === 'login' && !auth?.currentUser;

    if (isActuallyLogged && !isExplicitLogin) {
      console.log('[LandingPage] User already recognized, entering studio directly');
      setIsTransitioning(true);
      setTimeout(() => {
        onEnter(finalAction === 'start', false, targetTab);
        setIsTransitioning(false);
      }, 100);
      return;
    }
    
    setPendingAction(finalAction);
    setPendingTargetTab(targetTab);
    setShowAuthModal(true);
    setAuthError('');
  };
  
  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('studio_user_id');
      localStorage.removeItem('studio_guest_mode');
      setIsLoggedMember(false);
      window.location.hash = '#/';
    } catch (error) {
      console.error('Logout error:', error);
    }
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
    
    // Set guest mode in localStorage for persistence
    localStorage.setItem('studio_guest_mode', 'true');
    setIsLoggedMember(true);
    
    // Small delay to let modal close animation complete before navigation
    setTimeout(() => {
      if (pendingAction === 'start') {
        console.log('[LandingPage] Calling onEnter(true) with targetTab:', pendingTargetTab);
        onEnter(true, false, pendingTargetTab);
      } else {
        console.log('[LandingPage] Calling onEnter(false) with targetTab:', pendingTargetTab);
        onEnter(false, false, pendingTargetTab);
      }
      // Reset after navigation (in case user comes back)
      setPendingTargetTab(null);
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
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '5173');
  
  // Backend API for investor access validation
  const INVESTOR_API_URL = isLocal 
    ? 'http://localhost:3001/api/investor-access'
    : '/api/investor-access';
  
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
          <div className="header-actions">
            {isLoggedMember ? (
              <button 
                onClick={handleLogout}
                className="header-login-btn haptic-press"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  color: 'var(--color-red, #ef4444)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            ) : (
              <button 
                onClick={() => handleCtaClick('login')}
                className="header-login-btn haptic-press"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <LogIn size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ABOUT US SECTION - Story, Agent Grid, Vision, Stats
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section style={{ padding: '80px 20px 40px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Studio Agents Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '56px', height: '56px',
              background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={32} color="white" />
            </div>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: '1.1', marginBottom: '12px' }}>
            <span className="gradient-text-vibrant">The Studio Agents</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            The world's first AI Record Label in your pocket.
          </p>
        </div>

        {/* The Story */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
            <span className="gradient-text-cyan-purple">The Story</span>
          </h2>
          <div style={{ maxWidth: '700px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '12px' }}>
              Studio Agents was born from a simple frustration: making music is easyâ€”releasing it professionally shouldn't require a record label. We built the platform that independent artists deserveâ€”16 specialized AI agents that handle everything from lyrics and beats to mastering, video, and marketing.
            </p>
            <p>
              Every agent is trained on professional workflows, not just generic AI. Whether you're a bedroom producer or a touring artist, Studio Agents gives you the same production pipeline that major labels useâ€”at a fraction of the cost, available 24/7.
            </p>
          </div>
        </div>

        {/* The Vision - Two Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          <div style={{
            padding: '24px', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.2)'
          }}>
            <Target size={24} style={{ color: '#a855f7', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>Our Mission</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Democratize professional music production. Every artist deserves a full production teamâ€”AI makes it possible for everyone.
            </p>
          </div>
          <div style={{
            padding: '24px', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.2)'
          }}>
            <Rocket size={24} style={{ color: '#06b6d4', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>The Future</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              We're building toward a world where talent is the only barrier to entry. AI handles the restâ€”production, distribution, marketing, analytics.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '48px'
        }}>
          {[
            { value: '16', label: 'AI Agents' },
            { value: '24/7', label: 'Available' },
            { value: 'âˆž', label: 'Creations' },
            { value: '100%', label: 'Independent' }
          ].map((stat, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '16px 20px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)', minWidth: '80px'
            }}>
              <div style={{
                fontSize: '1.5rem', fontWeight: '900',
                background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>{stat.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          DEMO SECTIONS - Single Agent Demo + Multi-Agent Demo
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section style={{ padding: '0 20px 60px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Single Agent Demo */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
              Try an <span className="gradient-text-vibrant">Agent</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Pick one agent, give it an idea, and see what it creates.
            </p>
          </div>
          <Suspense fallback={<div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '24px' }}>Loading demo...</div>}>
            <SingleAgentDemo />
          </Suspense>
        </div>

        {/* Multi-Agent Demo */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
              Experience <span className="gradient-text-cyan-blue">Parallel Intelligence</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
              Watch our specialized agents work in sync to build your entire release package in seconds.
            </p>
          </div>
          <Suspense fallback={<div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '24px' }}>Loading demo...</div>}>
            <MultiAgentDemo />
          </Suspense>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          NAVIGATION BUTTONS - Quick access to studio sections
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section style={{ padding: '0 20px 60px', maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Jump Into the Studio
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[
            { label: 'AI Orchestrator', icon: Zap, tab: 'mystudio', color: '#06b6d4', desc: 'Full auto pipeline' },
            { label: 'Agents', icon: Sparkles, tab: 'agents', color: '#a855f7', desc: '16 AI specialists' },
            { label: 'Resources', icon: GlobeIcon, tab: 'resources', color: '#22c55e', desc: 'Guides & tools' },
            { label: 'Social Media Hub', icon: TrendingUp, tab: 'activity', color: '#ec4899', desc: 'Content & socials' }
          ].map((item, i) => {
            const BtnIcon = item.icon;
            return (
              <button
                key={i}
                onClick={() => handleCtaClick(isLoggedMember ? 'return' : 'start', item.tab)}
                className="haptic-press"
                style={{
                  padding: '20px 16px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', gap: '8px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <BtnIcon size={22} style={{ color: item.color }} />
                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{item.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                <ArrowRight size={16} style={{ color: item.color, alignSelf: 'flex-end' }} />
              </button>
            );
          })}
        </div>
      </section>

      {/* Meet the Agents - Full agent grid */}
      <section style={{ padding: '0 20px 60px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>
          <span className="gradient-text-vibrant">Meet the Agents</span>
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          maxWidth: '860px',
          margin: '0 auto'
        }}>
          {AGENTS.slice(0, 8).map((agent, i) => {
            const Icon = typeof agent.icon === 'function' ? agent.icon : Sparkles;
            const tierColors = {
              free: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: '#22c55e', label: 'Free' },
              monthly: { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', text: '#a855f7', label: 'Creator' },
              pro: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)', text: '#eab308', label: 'Pro' }
            };
            const tier = tierColors[agent.tier] || tierColors.free;

            return (
              <div
                key={agent.id}
                className="haptic-press"
                style={{
                  padding: '20px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onClick={() => handleCtaClick('agent', 'agents')}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Tier badge */}
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  padding: '3px 8px', borderRadius: '8px',
                  background: tier.bg, border: `1px solid ${tier.border}`,
                  fontSize: '0.6rem', fontWeight: '700', color: tier.text,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>{tier.label}</div>

                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  <Icon size={20} style={{ color: '#a855f7' }} />
                </div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '4px', color: 'white' }}>{agent.name}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{agent.category}</p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.4' }}>
                  {agent.description || (agent.capabilities && agent.capabilities[0]) || 'AI-powered music creation'}
                </p>

                {/* Whitepaper button */}
                <button
                  onClick={(e) => { e.stopPropagation(); openAgentWhitepaper(agent); }}
                  style={{
                    marginTop: '10px', padding: '4px 10px', borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: '#a855f7', fontSize: '0.65rem', fontWeight: '600',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <FileText size={10} /> Whitepaper
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
              name: 'ðŸ”¥ Early Bird Lifetime',
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

      {/* Whip Montez Case Study */}
      <section style={{ padding: '40px 20px', maxWidth: '700px', margin: '0 auto' }}>
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
              ðŸŽµ Case Study
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
        <h2 className="section-title" style={{ color: 'white', fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '16px' }}>
          Stop Waiting for <span className="gradient-text-purple-pink">Permission.</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', marginBottom: '32px', fontWeight: '500' }}>
          Your global rollout starts here. No major label required.
        </p>
        <button
          onClick={() => handleCtaClick('start', 'mystudio')}
          className="cta-button-premium haptic-press"
          style={{
            padding: '24px 48px',
            borderRadius: '28px',
            fontSize: '1.4rem',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 25px 50px rgba(168, 85, 247, 0.4)',
            border: 'none',
            background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <span>Launch Studio Suite</span>
          <ArrowRight size={28} />
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
            <button className="footer-link" onClick={() => window.location.hash = '#/whitepapers'}>Whitepapers</button>
            <span className="footer-divider">â€¢</span>
            <button className="footer-link" onClick={() => window.location.hash = '#/legal'}>Legal & Copyright</button>
            <span className="footer-divider">â€¢</span>
            <button className="footer-link" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
            <span className="footer-divider">â€¢</span>
            <button className="footer-link" onClick={() => setShowTerms(true)}>Terms of Service</button>
          </div>
          <p>&copy; 2026 studioagentsai.com â€¢ Built for the next generation of creators.</p>
        </div>
      </footer>



      {/* Auth Modal - Sign In with Google or Email */}
      {showAuthModal && (
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 10001 }} onClick={() => { setShowAuthModal(false); setAuthMode('login'); setAuthError(''); setAuthEmail(''); setAuthPassword(''); }}>
          <div 
            className="auth-modal animate-scaleIn" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.98) 0%, rgba(10, 10, 20, 0.99) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              padding: window.innerWidth < 768 ? '24px' : '40px',
              maxWidth: '420px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => { setShowAuthModal(false); setAuthMode('login'); setAuthError(''); setAuthEmail(''); setAuthPassword(''); }} 
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
                {authMode === 'reset' ? 'Reset Password' : authMode === 'signup' ? 'Create Account' : 'Welcome to Studio Agents'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
                {authMode === 'reset' 
                  ? 'Enter your email to receive a reset link'
                  : authMode === 'signup' 
                    ? 'Create an account to save your work' 
                    : 'Sign in to unlock your AI music studio'}
              </p>
            </div>

            {authError && (
              <div style={{
                background: authError.includes('sent') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${authError.includes('sent') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '20px',
                color: authError.includes('sent') ? '#4ade80' : '#f87171',
                fontSize: '0.9rem'
              }}>
                {authError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Google Sign In - only show for login/signup modes */}
              {authMode !== 'reset' && (
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
              )}

              {/* Apple Sign In - required by Apple App Store */}
              {authMode !== 'reset' && (
                <button
                  onClick={handleAppleSignIn}
                  disabled={authLoading}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: '#000',
                    color: '#fff',
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  {authLoading ? 'Signing in...' : 'Continue with Apple'}
                </button>
              )}

              {/* Divider - only show for login/signup modes */}
              {authMode !== 'reset' && (
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
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {authMode !== 'reset' && (
                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                )}

                {authMode === 'reset' ? (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={authLoading}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: authLoading ? 'wait' : 'pointer',
                      opacity: authLoading ? 0.7 : 1
                    }}
                  >
                    {authLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={authLoading}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      borderRadius: '12px',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      background: 'rgba(168, 85, 247, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: authLoading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: authLoading ? 0.7 : 1
                    }}
                  >
                    {authLoading ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Sign In with Email'}
                  </button>
                )}
              </form>

              {/* Auth Mode Toggle */}
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                {authMode === 'login' && (
                  <>
                    <button
                      onClick={() => { setAuthMode('reset'); setAuthError(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        marginBottom: '8px'
                      }}
                    >
                      Forgot password?
                    </button>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
                      Don't have an account?{' '}
                      <button
                        onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                        style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Sign up
                      </button>
                    </p>
                  </>
                )}
                {authMode === 'signup' && (
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
                    Already have an account?{' '}
                    <button
                      onClick={() => { setAuthMode('login'); setAuthError(''); }}
                      style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {authMode === 'reset' && (
                  <button
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    â† Back to sign in
                  </button>
                )}
              </div>

              {/* Divider before guest */}
              {authMode !== 'reset' && (
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
              )}

              {/* Continue as Guest - only show for login/signup modes */}
              {authMode !== 'reset' && (
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
              )}
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
              <p>We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect our company and our users. We also use this information to offer you tailored content â€“ like giving you more relevant search results and ads.</p>
              
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
              <button className="modal-close" onClick={() => setShowShowcase(false)}><X size={20} /></button>
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
                  Brooklyn, NY â€¢ 1999-2003
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
                  So we built an <strong style={{ color: '#00ff41' }}>Alternative Reality Experience (ARE)</strong>â€”using AI to reconstruct what could have been. What if Whip had modern tools? What if she had Studio Agents?
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
                    { icon: GlobeIcon, title: 'Viral Documentary', desc: 'The ARE project generated 2.4M views and proved independent artists can build legacies with AI tools.' }
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
                <ChevronRight size={18} />
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
                  Studio Agents â€” Investor Pitch
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  The AI-Native Label Disrupting a $30B Industry
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowInvestorPitch(false)}><X size={20} /></button>
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
                { id: 'market', label: 'Market', icon: GlobeIcon },
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
                    {isLocked ? <LockIcon size={12} /> : <tab.icon size={14} />}
                    {tab.label}
                    {isLocked && <span style={{ fontSize: '0.6rem', marginLeft: '2px' }}>ðŸ”’</span>}
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
                    <LockIcon size={36} style={{ color: 'var(--color-purple)' }} />
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
                        âœ… Request Submitted
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
                      We're building the world's first <strong style={{ color: 'white' }}>AI-native record label</strong> â€” 
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
                      { title: 'Our Solution', desc: '16 AI agents replace the entire label infrastructure â€” A&R, production, marketing, distribution â€” at $60/year', color: '#22c55e' },
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
                      "We're building the <span style={{ color: 'var(--color-cyan)' }}>Shopify for music creation</span> â€” 
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
                                {agent.tier !== 'free' && <LockIcon size={10} style={{ opacity: 0.5 }} />}
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
                      { value: '4.9â˜…', label: 'App Rating', growth: '12K+ reviews' }
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
                        { date: 'Q1 2024', milestone: 'Public Beta Launch â€” 5K signups in first week' },
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
                      User Love â¤ï¸
                    </h4>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '12px' 
                    }}>
                      {[
                        '"This replaced my entire creative team. I released an EP in 2 weeks." â€” @IndieRapper',
                        '"The Ghostwriter agent writes hooks better than most writers I\'ve paid." â€” Producer, ATL'
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
                      independent music â€” replacing the need for labels, distributors, and traditional production companies entirely.
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
                      TARGET VALUATION â€” SERIES A
                    </div>
                    <div style={{ 
                      fontSize: '2.5rem', 
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #22c55e, #06b6d4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: '8px'
                    }}>
                      $50M â€” $75M
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
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Whitepaper Modal - Technical Documentation */}
      {showAgentWhitepaper && selectedWhitepaperAgent && (() => {
        const agent = selectedWhitepaperAgent;
        const wp = getWhitepaperData(agent.id);
        const Icon = typeof agent.icon === 'function' ? agent.icon : Sparkles;
        
        return (
          <div 
            className="modal-overlay animate-fadeIn" 
            style={{ zIndex: 10002, overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }}
            onClick={() => { setShowAgentWhitepaper(false); setSelectedWhitepaperAgent(null); }}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px', minWidth: 0 }}>
                      <h2 style={{ 
                        margin: 0, 
                        fontSize: '1.4rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                        flex: 1
                      }}>{wp.fullName || agent.name}</h2>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '3px 8px', 
                        background: 'rgba(139, 92, 246, 0.3)',
                        borderRadius: '6px',
                        color: 'var(--color-purple)',
                        fontWeight: '600',
                        flexShrink: 0
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
                          fontWeight: '600',
                          flexShrink: 0
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
                <button className="modal-close" onClick={() => { setShowAgentWhitepaper(false); setSelectedWhitepaperAgent(null); }}><X size={20} /></button>
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
              <div className="modal-body" style={{ 
                padding: '24px', 
                overflowY: 'auto', 
                WebkitOverflowScrolling: 'touch',
                flex: 1 
              }}>
                
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
                  onClick={() => { setShowAgentWhitepaper(false); handleCtaClick('agent', 'agents'); }}
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  <Zap size={18} />
                  Try {agent.name}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
