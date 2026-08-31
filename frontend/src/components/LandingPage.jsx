import React, { useState, useEffect } from 'react';
import StudioHomeIntro from './StudioHomeIntro';
import { useStudioTheme } from '../hooks/useStudioTheme';
import toast from 'react-hot-toast';
import { Sparkles, ArrowRight, Zap, Music, Users, Globe as GlobeIcon, Target, Rocket, Shield, X, Play, TrendingUp, Headphones, ChevronRight, Layers, BarChart3, Briefcase, Settings, Code, Cpu, Lightbulb, CheckCircle, AlertCircle, FileText, Lock as LockIcon, LogIn, LogOut, Sun, Moon } from 'lucide-react';
import { AGENTS, BACKEND_URL } from '../constants';
import { auth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signOut } from '../firebase';

// Firebase error codes that indicate the popup flow itself failed (blocked, closed
// early, or unsupported by the browser environment - e.g. third-party cookie / COOP
// restrictions in modern Chrome). In these cases we fall back to a full-page redirect.
const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
  'auth/internal-error',
]);
import { AGENT_WHITEPAPER, DEFAULT_WHITEPAPER } from '../data/agentWhitepapers';

// Web checkout is fail-closed. It must be enabled only after Stripe products,
// webhook delivery, and a production checkout have been verified together.
const WEB_CHECKOUT_ENABLED = import.meta.env.VITE_STRIPE_CHECKOUT_ENABLED === 'true';

export default function LandingPage({ onEnter, onSubscribe, onStartTour }) {
  const [theme, setTheme] = useStudioTheme();
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  const [scrolled, setScrolled] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const [showInvestorPitch, setShowInvestorPitch] = useState(false);

  //  Check if already logged in via Firebase OR localStorage
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

  // Complete any pending redirect-based sign-in (Google/Apple fallback).
  // When signInWithPopup is blocked (COOP / third-party cookies), we fall back
  // to signInWithRedirect; on return, getRedirectResult resolves the session
  // and we navigate the user into the studio.
  useEffect(() => {
    if (!auth) return;
    let cancelled = false;
    getRedirectResult(auth)
      .then((result) => {
        if (cancelled || !result?.user) return;
        const pAction = sessionStorage.getItem('studio_pending_action') || null;
        const pTab = sessionStorage.getItem('studio_pending_tab') || null;
        sessionStorage.removeItem('studio_pending_action');
        sessionStorage.removeItem('studio_pending_tab');
        setShowAuthModal(false);
        setIsTransitioning(true);
        setTimeout(() => {
          navigateToStudio(pAction === 'start', pTab);
          setIsTransitioning(false);
        }, 100);
      })
      .catch((err) => {
        console.error('Redirect sign-in result error:', err);
        if (!cancelled) toast.error(err.message || 'Sign-in failed. Please try again.');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Helper: detect orchestrator tab and pass startOrchestrator=true to onEnter
  const navigateToStudio = (shouldStartWizard, targetTab) => {
    const isOrchestrator = targetTab === 'orchestrator';
    onEnter(shouldStartWizard, isOrchestrator, isOrchestrator ? 'mystudio' : targetTab);
  };
  
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
        navigateToStudio(pendingAction === 'start', pendingTargetTab);
        setPendingTargetTab(null);
        setIsTransitioning(false);
      }, 100);
    } catch (error) {
      // Popup was blocked/closed by the browser (COOP or third-party cookie
      // restrictions) - fall back to a full-page redirect, which always works.
      if (POPUP_FALLBACK_CODES.has(error.code)) {
        console.info('Google popup unavailable, using redirect sign-in:', error.code);
        try {
          sessionStorage.setItem('studio_pending_action', pendingAction || '');
          sessionStorage.setItem('studio_pending_tab', pendingTargetTab || '');
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithRedirect(auth, provider);
          return; // Page navigates away; result handled on return via getRedirectResult
        } catch (redirectErr) {
          console.error('Google redirect sign in error:', redirectErr);
          const rmsg = redirectErr.message || 'Failed to sign in.';
          setAuthError(rmsg);
          toast.error(rmsg);
          setAuthLoading(false);
          return;
        }
      }

      console.error('Google sign in error:', error);

      const msg = error.code === 'auth/account-exists-with-different-credential'
        ? 'An account already exists with this email. Try a different sign-in method.'
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
        navigateToStudio(pendingAction === 'start', pendingTargetTab);
        setPendingTargetTab(null);
        setIsTransitioning(false);
      }, 100);
    } catch (error) {
      // Fall back to redirect if the popup was blocked/closed by the browser.
      if (POPUP_FALLBACK_CODES.has(error.code)) {
        console.info('Apple popup unavailable, using redirect sign-in:', error.code);
        try {
          sessionStorage.setItem('studio_pending_action', pendingAction || '');
          sessionStorage.setItem('studio_pending_tab', pendingTargetTab || '');
          const provider = new OAuthProvider('apple.com');
          provider.addScope('email');
          provider.addScope('name');
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          console.error('Apple redirect sign in error:', redirectErr);
          const rmsg = redirectErr.message || 'Failed to sign in with Apple.';
          setAuthError(rmsg);
          toast.error(rmsg);
          setAuthLoading(false);
          return;
        }
      }

      console.error('Apple sign in error:', error);

      let msg;
      if (error.code === 'auth/account-exists-with-different-credential') {
        msg = 'An account already exists with this email. Try signing in with Google or email/password first.';
      } else if (error.code === 'auth/operation-not-allowed') {
        msg = 'Apple Sign-In is not enabled. Please use Google or email/password instead.';
      } else {
        msg = error.message || 'Failed to sign in with Apple.';
      }

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
        // Send email verification and sign out until verified
        try {
          await sendEmailVerification(result.user);
          setAuthError('Account created! Please verify your email to log in. Check your inbox (and spam folder).');
          await signOut(auth);
          setAuthLoading(false);
          setAuthMode('login');
          return;
        } catch (verifyErr) {
          console.error('Verification email failed', verifyErr);
          const verifyMsg = verifyErr.code === 'auth/too-many-requests'
            ? 'Account created, but too many emails were sent. Wait a few minutes, then log in to resend verification.'
            : 'Account created, but could not send verification email. Try logging in to resend it.';
          setAuthError(verifyMsg);
          await signOut(auth);
          setAuthLoading(false);
          return;
        }
      } else {
        const result = await signInWithEmailAndPassword(auth, authEmail, authPassword);

        // Refresh the user so emailVerified reflects the latest server state.
        // Without reload(), a user who just verified in another tab/device
        // still sees a stale emailVerified=false and gets locked out forever.
        try {
          await result.user.reload();
        } catch (reloadErr) {
          console.warn('Could not reload user before verification check', reloadErr);
        }
        const verifiedUser = auth.currentUser || result.user;

        // Check if email is verified
        if (!verifiedUser.emailVerified) {
          try {
            await sendEmailVerification(verifiedUser);
            setAuthError('Email not verified. A new verification link has been sent to your inbox (check spam too).');
          } catch (resendErr) {
            console.warn('Could not resend verification email', resendErr);
            setAuthError(resendErr.code === 'auth/too-many-requests'
              ? 'Email not verified yet. Please check your inbox for the existing link (too many emails sent to resend right now).'
              : 'Email not verified. Please check your inbox for the verification link.');
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
        navigateToStudio(pendingAction === 'start', pendingTargetTab);
        setPendingTargetTab(null);
        setIsTransitioning(false);
      }, 100);
    } catch (error) {
      console.error('Email auth error:', error);
      let msg = error.message || 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        msg = 'This email is already linked to an Apple or Google account. Try signing in with Apple or Google instead.';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. If you signed up with Apple or Google, use that method instead.';
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
  const handleCtaClick = (action = 'start', targetTab = 'mystudio') => {
    if (isTransitioning) return; // Prevent clicks during transition
    
    //  Check if already logged in via Firebase OR localStorage
    const hasUserId = localStorage.getItem('studio_user_id');
    const isGuest = localStorage.getItem('studio_guest_mode') === 'true';
    const isActuallyLogged = !!(auth?.currentUser || hasUserId || isGuest);
    
    // Override 'start' action for returning members to avoid re-triggering wizard
    const finalAction = isActuallyLogged && action === 'start' ? 'return' : action;
    
    // Allow 'login' action to bypass 'isActuallyLogged' check if only logged as guest or not at all
    const isExplicitLogin = action === 'login' && !auth?.currentUser;

    if (isActuallyLogged && !isExplicitLogin) {
      // devLog('[LandingPage] User already recognized, entering studio directly');
      setIsTransitioning(true);
      setTimeout(() => {
        navigateToStudio(finalAction === 'start', targetTab);
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
      // devLog('[LandingPage] Blocked - already transitioning');
      return;
    }
    
    // devLog('[LandingPage] Continue as guest clicked, pendingAction:', pendingAction);
    setIsTransitioning(true);
    setShowAuthModal(false);
    
    // Set guest mode in localStorage for persistence
    localStorage.setItem('studio_guest_mode', 'true');
    setIsLoggedMember(true);
    
    // Small delay to let modal close animation complete before navigation
    setTimeout(() => {
      // devLog('[LandingPage] Guest entering studio with targetTab:', pendingTargetTab);
      navigateToStudio(pendingAction === 'start', pendingTargetTab);
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
  
  // Backend API for investor access validation
  const INVESTOR_API_URL = `${BACKEND_URL}/api/investor-access`;
  
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
    <div className={`landing-container studio-home ${theme}-theme`}>
      {/* Native-style Mobile Header */}
      <header className={`native-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <div className="header-logo">
            <Sparkles size={24} className="text-purple" aria-hidden="true" />
            <span className="header-title">Studio Agents</span>
          </div>
          <nav className="studio-home-nav" aria-label="Homepage navigation">
            <button type="button" onClick={() => document.getElementById('studio-home-start')?.scrollIntoView({ block: 'start' })}>Create</button>
            <button type="button" onClick={() => document.getElementById('studio-home-agents')?.scrollIntoView({ block: 'start' })}>Agents</button>
            <button type="button" onClick={() => document.getElementById('studio-home-pricing')?.scrollIntoView({ block: 'start' })}>Pricing</button>
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="studio-home-theme-toggle"
              onClick={toggleTheme}
              aria-label="Dark theme"
              aria-pressed={theme === 'dark'}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
            </button>
            {isLoggedMember ? (
              <button type="button" onClick={handleLogout} className="header-login-btn">
                <LogOut size={16} aria-hidden="true" /> Sign Out
              </button>
            ) : (
              <button type="button" onClick={() => handleCtaClick('login')} className="header-login-btn">
                <LogIn size={16} aria-hidden="true" /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <StudioHomeIntro
        isLoggedMember={isLoggedMember}
        agents={AGENTS}
        onNavigate={(tab) => handleCtaClick('return', tab)}
        onAgent={(agentId) => handleCtaClick('agent', agentId)}
        onWhitepaper={openAgentWhitepaper}
        onTour={() => onStartTour?.()}
      />

      <div className="studio-home-existing">

      {/* Pricing Section */}
      <section className="pricing-section" id="studio-home-pricing">
        <div className="section-header">
          <div className="section-tag">Pricing</div>
          <h2 className="section-title">
            {WEB_CHECKOUT_ENABLED ? 'Simple, ' : 'Planned, '}<span className="gradient-text-cyan-purple">Transparent Pricing</span>
          </h2>
          {!WEB_CHECKOUT_ENABLED && (
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
              Paid checkout is not active. You can create a free beta account without entering payment details.
            </p>
          )}
        </div>

        <div className="pricing-grid-native">
          {[
            {
              name: 'Free Trial',
              price: '$0',
              features: ['25 trial credits on signup', '4 core agents', 'Costs vary by generation type', 'Review costs before generating']
            },
            {
              name: 'Creator',
              price: '$4.99',
              period: '/month',
              features: ['500 credits/month — planned', '8 agents — planned access', 'Provider-dependent output duration', 'Save & export projects']
            },
            {
              name: 'Studio',
              price: '$14.99',
              period: '/month',
              features: ['1,000 credits/month — planned', 'All 16 agents — planned access', 'Provider-dependent output duration', 'Priority processing — planned', 'Public API — not yet verified']
            },
            {
              name: 'Lifetime Access',
              price: '$99',
              period: 'one-time',
              features: ['Lifetime plan proposal', 'Recurring allowance under review', 'Final terms before checkout', 'Output rights depend on provider terms'],
              popular: false,
              ltd: true,
              urgency: null
            }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`pricing-card-native ${plan.popular ? 'popular' : ''} ${plan.ltd ? 'ltd-card' : ''} haptic-press`}
            >
              {plan.popular && (
                <div className="popular-badge-native">
                  Featured Plan
                </div>
              )}
              {plan.ltd && (
                <div className="ltd-badge-native">
                  Plan Proposal
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
                disabled={plan.price !== '$0' && !WEB_CHECKOUT_ENABLED}
                onClick={() => {
                  if (plan.price === '$0') {
                    handleCtaClick('start', 'mystudio');
                  } else if (WEB_CHECKOUT_ENABLED) {
                    onSubscribe?.(plan);
                  }
                }}
                style={plan.price !== '$0' && !WEB_CHECKOUT_ENABLED ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
              >
                {plan.price === '$0' ? 'Create Free Beta Account' : WEB_CHECKOUT_ENABLED ? (plan.ltd ? 'Get Lifetime Access' : 'Subscribe') : 'Billing Not Active'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Whip Montez Case Study */}
      <section className="studio-home-archive" style={{ padding: '40px 20px', maxWidth: '700px', margin: '0 auto' }}>
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
              (music) Case Study
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px', color: "var(--studio-ink)" }}>
              The Lost Tapes of <a href="https://whipmontez.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff41', textDecoration: 'underline' }}>Whip Montez</a>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
              Explore the Whip Montez creative archive and its alternative-reality storytelling. This is creative context, not a verified performance case study.
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
        <h2 className="section-title" style={{ color: "var(--studio-ink)", fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '16px' }}>
          Stop Waiting for <span className="gradient-text-purple-pink">Permission.</span>
        </h2>
        <p style={{ color: "var(--studio-muted)", fontSize: '1.2rem', marginBottom: '32px', fontWeight: '500' }}>
          Your next project starts here. Generate, iterate, and export — keep your own creative direction.
        </p>
        <button
          onClick={() => handleCtaClick('return', 'project_canvas')}
          className="cta-button-premium haptic-press"
          style={{
            padding: '24px 48px',
            borderRadius: '28px',
            fontSize: '1.4rem',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: "0 25px 50px rgba(163,66,41, 0.4)",
            border: 'none',
            background: "linear-gradient(135deg, var(--studio-accent) 0%, #d946ef 100%)",
            color: "var(--studio-inverse)",
            cursor: 'pointer'
          }}
        >
          <span>Launch Studio Suite</span>
          <ArrowRight size={28} />
        </button>
      </section>

      {/* Investor Pitch Button - Moved to bottom */}
      <div className="studio-home-investor-entry" style={{
        display: 'flex', 
        justifyContent: 'center', 
        padding: '24px 20px',
        background: "var(--studio-surface-alt)"
      }}>
        <button
          onClick={() => setShowInvestorPitch(true)}
          className="glass-button haptic-press"
          style={{ 
            maxWidth: '400px',
            width: '100%', 
            justifyContent: 'center', 
            padding: '14px 24px',
            background: "linear-gradient(135deg, rgba(163,66,41, 0.15) 0%, rgba(61,100,114, 0.15) 100%)",
            border: "1px solid rgba(163,66,41, 0.4)",
            borderRadius: '16px',
            color: "var(--studio-ink)",
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
            <span className="footer-divider">*</span>
            <button className="footer-link" onClick={() => window.location.hash = '#/dna'}>DNA System</button>
            <span className="footer-divider">*</span>
            <button className="footer-link" onClick={() => window.location.hash = '#/vocals'}>Vocal Lab</button>
            <span className="footer-divider">*</span>
            <button className="footer-link" onClick={() => window.location.hash = '#/billboard'}>Billboard Blueprint</button>
            <span className="footer-divider">*</span>
            <button className="footer-link" onClick={() => window.location.hash = '#/campaign'}>Content Engine</button>
            <span className="footer-divider">*</span>
            <button className="footer-link" onClick={() => window.location.hash = '#/legal'}>Legal & Copyright</button>
            <span className="footer-divider">*</span>
            <button className="footer-link" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
            <span className="footer-divider">*</span>
            <button className="footer-link" onClick={() => setShowTerms(true)}>Terms of Service</button>
            <span className="footer-divider">*</span>
            <a className="footer-link" href="/support.html">Support</a>
            <span className="footer-divider">*</span>
            <a className="footer-link" href="/account-deletion.html">Delete Account</a>
          </div>
          <p>&copy; 2026 studioagentsai.com * Built for the next generation of creators.</p>
        </div>
      </footer>
      </div>




      {/* Auth Modal - Sign In with Google or Email */}
      {showAuthModal && (
        <div className="modal-overlay landing-modal-overlay animate-fadeIn" onClick={() => { setShowAuthModal(false); setAuthMode('login'); setAuthError(''); setAuthEmail(''); setAuthPassword(''); }}>
          <div 
            className="auth-modal landing-modal-panel animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(180deg, var(--studio-surface) 0%, var(--studio-surface) 100%)",
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: "1px solid rgba(163,66,41, 0.3)",
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
                background: "rgba(var(--studio-ink-rgb), 0.1)",
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: "var(--studio-ink)"
              }}
            >
              <X size={18} />
            </button>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: "linear-gradient(135deg, var(--studio-accent) 0%, var(--studio-blue) 100%)",
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Zap size={32} style={{ color: "var(--studio-ink)" }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', color: "var(--studio-ink)" }}>
                {authMode === 'reset' ? 'Reset Password' : authMode === 'signup' ? 'Create Account' : 'Welcome to Studio Agents'}
              </h2>
              <p style={{ color: "var(--studio-muted)", fontSize: '0.95rem' }}>
                {authMode === 'reset' 
                  ? 'Enter your email to receive a reset link'
                  : authMode === 'signup' 
                    ? 'Create an account to save your work' 
                    : 'Sign in to unlock your AI music studio'}
              </p>
            </div>

            {authError && (
              <div style={{
                background: authError.includes('sent') ? "rgba(86,105,84, 0.1)" : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${authError.includes('sent') ? "rgba(86,105,84, 0.3)" : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '20px',
                color: authError.includes('sent') ? "var(--studio-sage)" : "var(--studio-danger)",
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
                    border: "1px solid rgba(var(--studio-ink-rgb), 0.16)",
                    background: "var(--studio-surface)",
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
                    border: "1px solid rgba(var(--studio-ink-rgb), 0.16)",
                    background: "var(--studio-surface-alt)",
                    color: "var(--studio-ink)",
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--studio-ink)">
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
                  <div style={{ flex: 1, height: '1px', background: "rgba(var(--studio-ink-rgb), 0.1)" }} />
                  <span style={{ color: "var(--studio-muted)", fontSize: '0.85rem' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: "rgba(var(--studio-ink-rgb), 0.1)" }} />
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
                    border: "1px solid rgba(var(--studio-ink-rgb), 0.15)",
                    background: "rgba(var(--studio-ink-rgb), 0.05)",
                    color: "var(--studio-ink)",
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
                      border: "1px solid rgba(var(--studio-ink-rgb), 0.15)",
                      background: "rgba(var(--studio-ink-rgb), 0.05)",
                      color: "var(--studio-ink)",
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
                      background: "linear-gradient(135deg, var(--studio-accent), var(--studio-blue))",
                      color: "var(--studio-inverse)",
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
                      border: "1px solid rgba(163,66,41, 0.5)",
                      background: "rgba(163,66,41, 0.1)",
                      color: "var(--studio-ink)",
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
                        color: "var(--studio-muted)",
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        marginBottom: '8px'
                      }}
                    >
                      Forgot password?
                    </button>
                    <p style={{ color: "var(--studio-muted)", fontSize: '0.85rem', margin: 0 }}>
                      Don't have an account?{' '}
                      <button
                        onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                        style={{ background: 'none', border: 'none', color: "var(--studio-accent)", cursor: 'pointer', fontWeight: '600' }}
                      >
                        Sign up
                      </button>
                    </p>
                  </>
                )}
                {authMode === 'signup' && (
                  <p style={{ color: "var(--studio-muted)", fontSize: '0.85rem', margin: 0 }}>
                    Already have an account?{' '}
                    <button
                      onClick={() => { setAuthMode('login'); setAuthError(''); }}
                      style={{ background: 'none', border: 'none', color: "var(--studio-accent)", cursor: 'pointer', fontWeight: '600' }}
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {authMode === 'reset' && (
                  <button
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    style={{ background: 'none', border: 'none', color: "var(--studio-accent)", cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    ← Back to sign in
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
                  <div style={{ flex: 1, height: '1px', background: "rgba(var(--studio-ink-rgb), 0.1)" }} />
                  <span style={{ color: "var(--studio-muted)", fontSize: '0.85rem' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: "rgba(var(--studio-ink-rgb), 0.1)" }} />
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
                    border: "1px solid rgba(var(--studio-ink-rgb), 0.15)",
                    background: "rgba(var(--studio-ink-rgb), 0.05)",
                    color: "var(--studio-ink)",
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
              color: "var(--studio-muted)",
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
        <div className="modal-overlay landing-modal-overlay animate-fadeIn">
          <div className="legal-modal landing-modal-panel animate-scaleIn">
            <div className="modal-header">
              <h2>Privacy Policy</h2>
              <button className="modal-close" onClick={() => setShowPrivacy(false)}><X size={20} /></button>
            </div>
            <div className="modal-body legal-text">
              <h3>1. Information We Collect</h3>
              <p>We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or request customer support. This may include your name, email address, and payment information.</p>
              
              <h3>2. How We Use Your Information</h3>
              <p>We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect our company and our users. We also use this information to offer you tailored content -like giving you more relevant search results and ads.</p>
              
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
        <div className="modal-overlay landing-modal-overlay animate-fadeIn">
          <div className="legal-modal landing-modal-panel animate-scaleIn">
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
          className="modal-overlay landing-modal-overlay animate-fadeIn"
          style={{ zIndex: 10000, overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }}
          onClick={() => setShowShowcase(false)}
        >
          <div 
            className="legal-modal landing-modal-panel animate-scaleIn"
            style={{ 
              maxWidth: 'min(92vw, 700px)',
              width: '100%',
              margin: '1rem auto',
              background: "linear-gradient(180deg, var(--studio-bg) 0%, var(--studio-surface-alt) 100%)",
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
                  <Headphones size={48} color="var(--studio-ink)" />
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
                  Brooklyn, NY * 1999-2003
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
                  The <strong style={{ color: '#00ff41' }}>Whip Montez</strong> archive explores music, memory and alternative-reality storytelling. Visit the linked archive for its own creative context.
                </p>
                
                <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '16px' }}>
                  Earlier versions of this page presented an imagined discovery narrative as biography. That narrative is not verified and is not presented as a factual account here.
                </p>
                
                <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7' }}>
                  An <strong style={{ color: '#00ff41' }}>Alternative Reality Experience (ARE)</strong> explores a creative direction. A concept demonstration does not establish restoration accuracy, audience growth or commercial success.
                </p>
              </div>

              {/* What We Proved */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  color: "var(--studio-ink)",
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  marginBottom: '16px'
                }}>
                  Creative directions to explore
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { icon: Music, title: 'Music development', desc: 'Explore lyric and production ideas; generated material requires listening, editing and rights review.' },
                    { icon: Target, title: 'Visual identity', desc: 'Develop cover concepts and a consistent visual direction around a project.' },
                    { icon: TrendingUp, title: 'Release planning', desc: 'Explore a hypothetical rollout without representing it as a completed release or a career guarantee.' },
                    { icon: GlobeIcon, title: 'Creative storytelling', desc: 'The archive explores a creative world. No verified view count or commercial outcome is claimed.' }
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '14px',
                      background: "rgba(var(--studio-ink-rgb), 0.03)",
                      borderRadius: '12px',
                      border: "1px solid rgba(var(--studio-ink-rgb), 0.08)"
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
                        <div style={{ fontWeight: '600', color: "var(--studio-ink)", fontSize: '0.95rem', marginBottom: '4px' }}>
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
                background: "linear-gradient(135deg, rgba(163,66,41, 0.15) 0%, rgba(61,100,114, 0.15) 100%)",
                borderRadius: '16px',
                border: "1px solid rgba(163,66,41, 0.3)",
                textAlign: 'center'
              }}>
                <p style={{ 
                  color: "var(--studio-ink)",
                  fontSize: '1.1rem', 
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Explore what your creative archive could become.
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Keep the distinction between imaginative storytelling and documented history clear.
                </p>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid rgba(0, 255, 65, 0.2)' }}>
              <button 
                className="cta-button-primary"
                onClick={() => { setShowShowcase(false); handleCtaClick('return', 'project_canvas'); }}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
                  color: "var(--studio-ink)"
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
          className="modal-overlay landing-modal-overlay animate-fadeIn"
          style={{ zIndex: 10001, overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }}
          onClick={() => setShowInvestorPitch(false)}
        >
          <div 
            className="legal-modal landing-modal-panel animate-scaleIn"
            style={{ 
              maxWidth: 'min(95vw, 950px)',
              width: '100%',
              margin: '1rem auto',
              display: 'flex',
              flexDirection: 'column',
              background: "linear-gradient(180deg, var(--studio-surface) 0%, var(--studio-surface) 100%)",
              border: "1px solid rgba(163,66,41, 0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header" style={{ 
              borderBottom: "1px solid rgba(163,66,41, 0.2)",
              padding: '20px 24px'
            }}>
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <Briefcase size={24} style={{ color: 'var(--color-purple)' }} />
                  Studio Agents -Investor Pitch
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  An independent creative workspace — product direction and evidence
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowInvestorPitch(false)}><X size={20} /></button>
            </div>
            
            {/* Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: '4px', 
              padding: '16px 24px',
              borderBottom: "1px solid rgba(var(--studio-ink-rgb), 0.05)",
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
                        : isLocked ? "rgba(var(--studio-ink-rgb), 0.02)" : "rgba(var(--studio-ink-rgb), 0.05)",
                      color: pitchTab === tab.id ? "var(--studio-ink)" : isLocked ? "var(--studio-muted)" : 'var(--text-secondary)',
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
                    {isLocked && <span style={{ fontSize: '0.6rem', marginLeft: '2px' }}>(key)</span>}
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
                    background: "linear-gradient(135deg, rgba(163,66,41, 0.2) 0%, rgba(61,100,114, 0.2) 100%)",
                    border: "2px solid rgba(163,66,41, 0.3)",
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
                        color: "var(--studio-ink)",
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
                          background: "rgba(var(--studio-ink-rgb), 0.1)",
                          border: "1px solid rgba(var(--studio-ink-rgb), 0.16)",
                          color: "var(--studio-ink)",
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
                        color: "var(--studio-ink)",
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
                            background: "rgba(var(--studio-ink-rgb), 0.05)",
                            border: accessError && !investorName.trim() ? "1px solid var(--studio-danger)" : "1px solid rgba(var(--studio-ink-rgb), 0.1)",
                            color: "var(--studio-ink)",
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
                            background: "rgba(var(--studio-ink-rgb), 0.05)",
                            border: accessError && !investorEmail.trim() ? "1px solid var(--studio-danger)" : "1px solid rgba(var(--studio-ink-rgb), 0.1)",
                            color: "var(--studio-ink)",
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
                            background: "rgba(var(--studio-ink-rgb), 0.05)",
                            border: "1px solid rgba(var(--studio-ink-rgb), 0.1)",
                            color: "var(--studio-ink)",
                            fontSize: '1rem'
                          }}
                        />
                        
                        {accessError && (
                          <div style={{ 
                            color: "var(--studio-danger)",
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
                              ? "rgba(163,66,41, 0.5)"
                              : 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-cyan) 100%)',
                            border: 'none',
                            color: "var(--studio-ink)",
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
                                border: "2px solid rgba(var(--studio-ink-rgb), 0.16)",
                                borderTopColor: "var(--studio-ink)",
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
                        background: "rgba(var(--studio-ink-rgb), 0.03)",
                        borderRadius: '12px',
                        border: "1px solid rgba(var(--studio-ink-rgb), 0.08)"
                      }}>
                        <p style={{ 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.85rem',
                          margin: 0
                        }}>
                          Approved requests can access the additional sections. New requests require team review; no response time is guaranteed.
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
                      background: "linear-gradient(135deg, var(--studio-surface) 0%, var(--studio-accent) 50%, var(--studio-blue) 100%)",
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: '1.3',
                      marginBottom: '16px'
                    }}>
                      Accelerate Your Music with AI Agents
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                      We're building an <strong style={{ color: "var(--studio-ink)" }}>AI-assisted creative workspace</strong> —
                      a place to develop ideas with specialized tools and review the outputs,
                      with generation time, availability and quality dependent on the provider and prompt.
                    </p>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '16px',
                    marginBottom: '28px'
                  }}>
                    {[
                      { title: 'The Problem', desc: 'Starting from scratch is slow. Artists waste hours on first drafts instead of perfecting their sound', color: "var(--studio-danger)" },
                      { title: 'Our Solution', desc: 'Specialized tools for lyrics, audio, visuals and release planning, connected to a project you can refine.', color: "var(--studio-sage)" },
                      { title: 'The Vision', desc: 'Help independent artists develop and finish work while keeping creative judgment in human hands.', color: "var(--studio-accent)" }
                    ].map((item, i) => (
                      <div key={i} style={{
                        padding: '20px',
                        background: `rgba(${item.color === "var(--studio-danger)" ? '239, 68, 68' : item.color === "var(--studio-sage)" ? '34, 197, 94' : '139, 92, 246'}, 0.1)`,
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
                    background: "linear-gradient(135deg, rgba(163,66,41, 0.1) 0%, rgba(61,100,114, 0.1) 100%)",
                    borderRadius: '16px',
                    border: "1px solid rgba(163,66,41, 0.2)",
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '1px' }}>
                      ELEVATOR PITCH
                    </div>
                    <p style={{ 
                      fontSize: '1.1rem', 
                      color: "var(--studio-ink)",
                      fontWeight: '500',
                      lineHeight: '1.6',
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      "We're building <span style={{ color: 'var(--color-cyan)' }}>a connected creative workspace</span> —
                      from an initial idea to saved drafts you can shape into your own work.
                      Rights, costs and capabilities depend on your inputs and the providers used."
                    </p>
                  </div>
                </div>
              )}

              {pitchTab === 'market' && (
                <section className="studio-home-evidence-panel">
                  <h3>The market we are building for</h3>
                  <p>Our focus is independent artists who need connected creative tools. Market sizing and comparative claims require dated, attributable research before publication.</p>
                  <div className="studio-home-evidence-grid">
                    <article><h4>Creative development</h4><p>Lyrics, audio, artwork and video are different jobs. The product brings those workflows together without claiming that AI replaces an entire creative team.</p></article>
                    <article><h4>Audience</h4><p>Bedroom producers, independent musicians and visual creators are the intended audience. No verified audience-size estimate is published here.</p></article>
                    <article><h4>Research standard</h4><p>Revenue, growth rates, market share and label-contract comparisons will be added only with sources and a clear measurement period.</p></article>
                  </div>

                </section>
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
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: "var(--studio-ink)", marginBottom: '8px' }}>
                      {AGENTS.length} creative agents, connected workflows
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                      Each agent guides a creative task. A visible tool is not a guarantee of provider availability or release-ready output.
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
                          background: "rgba(var(--studio-ink-rgb), 0.03)",
                          borderRadius: '14px',
                          border: "1px solid rgba(var(--studio-ink-rgb), 0.08)"
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
                                color: agent.tier === 'free' ? "var(--studio-ink)" : 'var(--text-secondary)',
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
                    background: "linear-gradient(135deg, rgba(86,105,84, 0.1) 0%, rgba(61,100,114, 0.1) 100%)",
                    borderRadius: '16px',
                    border: "1px solid rgba(86,105,84, 0.2)",
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ color: "var(--studio-ink)", fontSize: '1rem', fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>
                      Competitive Moat
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      {[
                        { title: 'Multi-Agent Workflow', desc: 'One project can move through writing, audio, visuals, and release planning' },
                        { title: 'Provider Transparency', desc: 'Generation routes and provider failures are surfaced instead of hidden' },
                        { title: 'Unified Project Record', desc: 'Prompts, assets, and saved versions stay attached to the project' },
                        { title: 'Consent Boundaries', desc: 'Personal voice activation requires explicit consent and a provider voice ID' }
                      ].map((item, i) => (
                        <div key={i}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: "var(--studio-sage)", marginBottom: '4px' }}>
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

              {pitchTab === 'traction' && (
                <section className="studio-home-evidence-panel">
                  <h3>Evidence before traction claims</h3>
                  <p>This is a pre-revenue platform under validation. Historical user counts, ratings, retention, revenue and testimonials are not published without verified records.</p>
                  <div className="studio-home-evidence-grid">
                    <article><h4>Usage</h4><p>Active-user and completed-generation figures require an audited reporting window. No placeholder counts are shown.</p></article>
                    <article><h4>Retention</h4><p>Return usage and paid-customer retention remain to be measured. A successful demo is not a retention metric.</p></article>
                    <article><h4>Customer feedback</h4><p>Publish only permissioned, attributable feedback. No invented quotes or ratings.</p></article>
                    <article><h4>Release progress</h4><p>Production checks measure generation, saving, reopening and failure recovery. A feature is not certified just because it appears in the interface.</p></article>
                  </div>

                </section>
              )}

              {pitchTab === 'roadmap' && (
                <section className="studio-home-evidence-panel">
                  <h3>Roadmap — archived proposals, current priorities</h3>
                  <p>Previous 2025–2026 target dates were planning concepts, not proof that an integration shipped. Treat the items below as proposals unless the product explicitly shows a working connection.</p>
                  <div className="studio-home-evidence-grid">
                    <article><h4>Current priority: dependable creation</h4><p>Complete live acceptance of generation, project storage, producer controls and usable error recovery before expanding promises.</p></article>
                    <article><h4>Proposed distribution integrations</h4><p>Spotify, Apple Music, TikTok, YouTube Music, SoundCloud, Bandcamp and Instagram distribution concepts remain proposals—not available publishing connections.</p></article>
                    <article><h4>Longer-term ideas</h4><p>Sync licensing, royalty collection, booking and merchandise are archived planning ideas. No delivery date or availability is promised here.</p></article>
                  </div>

                </section>
              )}

              {pitchTab === 'financials' && (
                <section className="studio-home-evidence-panel">
                  <h3>Business model & operating evidence</h3>
                  <p>Configured plan prices are shown on the homepage. Paid checkout remains unavailable unless it has been enabled and verified; these pages are not evidence of paying-customer revenue.</p>
                  <div className="studio-home-evidence-grid">
                    <article><h4>Revenue history</h4><p>Pre-revenue. No historical ARR, lifetime value, acquisition-cost or valuation claim is published.</p></article>
                    <article><h4>Provider costs</h4><p>Costs vary by media type, model and usage. Gross margin must be calculated from real provider charges and billing records.</p></article>
                    <article><h4>Planned subscriptions</h4><p>Creator: $4.99/month with 500 credits. Studio: $14.99/month with 1,000 credits. Entitlements and billing require end-to-end verification before launch.</p></article>
                    <article><h4>Lifetime proposal</h4><p>The configured $99 one-time plan requires a separate sustainability and entitlement review. It is not a promise of unlimited generation or verified perpetual service.</p></article>
                  </div>
                  <p>For business questions, <a href="/support.html">contact the team through Support</a>. No active fundraising amount, minimum investment or valuation is asserted here.</p>
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ 
              borderTop: "1px solid rgba(163,66,41, 0.2)",
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
            className="modal-overlay landing-modal-overlay animate-fadeIn"
            style={{ zIndex: 10002, overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }}
            onClick={() => { setShowAgentWhitepaper(false); setSelectedWhitepaperAgent(null); }}
          >
            <div 
              className="legal-modal landing-modal-panel animate-scaleIn"
              style={{ 
                maxWidth: 'min(95vw, 1000px)',
                width: '100%',
                margin: '1rem auto',
                display: 'flex',
                flexDirection: 'column',
                background: "linear-gradient(180deg, var(--studio-surface) 0%, var(--studio-surface) 100%)",
                border: "1px solid rgba(163,66,41, 0.3)"
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="modal-header" style={{ 
                borderBottom: "1px solid rgba(163,66,41, 0.2)",
                padding: '20px 24px',
                background: "linear-gradient(135deg, rgba(163,66,41, 0.1) 0%, rgba(61,100,114, 0.1) 100%)"
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
                    <Icon size={24} style={{ color: "var(--studio-ink)" }} />
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
                        background: "rgba(163,66,41, 0.3)",
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
                          color: "var(--studio-danger)",
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
                borderBottom: "1px solid rgba(var(--studio-ink-rgb), 0.05)",
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
                        : "rgba(var(--studio-ink-rgb), 0.05)",
                      color: whitepaperTab === tab.id ? "var(--studio-ink)" : 'var(--text-secondary)',
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
                          <AlertCircle size={18} style={{ color: "var(--studio-danger)" }} />
                          <h4 style={{ color: "var(--studio-danger)", fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>
                            The Problem
                          </h4>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                          {wp.problemSolved}
                        </p>
                      </div>

                      <div style={{
                        padding: '20px',
                        background: "rgba(86,105,84, 0.08)",
                        borderRadius: '16px',
                        border: "1px solid rgba(86,105,84, 0.2)"
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <CheckCircle size={18} style={{ color: "var(--studio-sage)" }} />
                          <h4 style={{ color: "var(--studio-sage)", fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>
                            The Solution
                          </h4>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                          {agent.name} accelerates this workflow with AI, generating creative drafts in minutes instead of days — ready for you to iterate and refine.
                        </p>
                      </div>
                    </div>

                    {/* Success Metrics */}
                    <div style={{
                      padding: '20px',
                      background: "linear-gradient(135deg, rgba(163,66,41, 0.1) 0%, rgba(61,100,114, 0.1) 100%)",
                      borderRadius: '16px',
                      border: "1px solid rgba(163,66,41, 0.2)",
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '1px' }}>
                        PERFORMANCE METRICS
                      </div>
                      <p style={{ 
                        fontSize: '1rem', 
                        color: "var(--studio-ink)",
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
                          background: "rgba(var(--studio-ink-rgb), 0.03)",
                          borderRadius: '12px',
                          border: "1px solid rgba(var(--studio-ink-rgb), 0.08)",
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
                            <Cpu size={16} style={{ color: "var(--studio-ink)" }} />
                          </div>
                          <span style={{ fontSize: '0.85rem', color: "var(--studio-ink)", fontWeight: '500' }}>{tech}</span>
                        </div>
                      ))}
                    </div>

                    {/* Integration */}
                    <div style={{
                      padding: '20px',
                      background: "rgba(163,66,41, 0.08)",
                      borderRadius: '16px',
                      border: "1px solid rgba(163,66,41, 0.2)"
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
                          background: "rgba(var(--studio-ink-rgb), 0.03)",
                          borderRadius: '14px',
                          border: "1px solid rgba(var(--studio-ink-rgb), 0.08)",
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '14px'
                        }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: "rgba(163,66,41, 0.2)",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}>
                            <CheckCircle size={14} style={{ color: 'var(--color-purple)' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.95rem', color: "var(--studio-ink)", fontWeight: '600', marginBottom: '4px' }}>
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
                          <CheckCircle size={18} style={{ color: "var(--studio-sage)" }} />
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: "var(--studio-sage)",
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
                              background: "rgba(86,105,84, 0.08)",
                              borderRadius: '10px',
                              border: "1px solid rgba(86,105,84, 0.15)",
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: "var(--studio-sage)", flexShrink: 0 }} />
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
                          <AlertCircle size={18} style={{ color: "var(--studio-danger)" }} />
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: "var(--studio-danger)",
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
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: "var(--studio-danger)", flexShrink: 0 }} />
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
                          background: "rgba(var(--studio-ink-rgb), 0.02)",
                          borderRadius: '14px',
                          border: "1px solid rgba(163,66,41, 0.2)",
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
                            color: "var(--studio-ink)",
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
                          background: "rgba(163,66,41, 0.15)",
                          borderRadius: '8px',
                          border: "1px solid rgba(163,66,41, 0.3)",
                          fontSize: '0.8rem',
                          color: "var(--studio-ink)",
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
                          background: "rgba(var(--studio-ink-rgb), 0.03)",
                          borderRadius: '12px',
                          border: "1px solid rgba(var(--studio-ink-rgb), 0.08)",
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            {spec.label}
                          </div>
                          <div style={{ fontSize: '0.95rem', color: "var(--studio-ink)", fontWeight: '600' }}>
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
                        color: "var(--studio-danger)",
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
                borderTop: "1px solid rgba(163,66,41, 0.2)",
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
