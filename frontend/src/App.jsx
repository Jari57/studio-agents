import React, { useState, useEffect, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import './App.css';
import './mobile-fixes.css';
import { suppressExtensionErrors } from './utils/suppressExtensionErrors';
import { AGENTS } from './constants';

// Lazy load heavy components (standardizing to React.lazy to prevent 'lazy is not defined' error)
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const StudioView = React.lazy(() => import('./components/StudioView'));
const WhitepapersPage = React.lazy(() => import('./components/WhitepapersPage'));
const LegalResourcesPage = React.lazy(() => import('./components/LegalResourcesPage'));

// Loading fallback component
const StudioLoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg-primary, #0a0a0f)',
    color: 'white',
    gap: '20px'
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      border: '3px solid rgba(168, 85, 247, 0.2)',
      borderTopColor: '#a855f7',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ fontSize: '1rem', opacity: 0.8 }}>Loading...</p>
  </div>
);

// Suppress harmless browser extension errors (MetaMask, etc.)
suppressExtensionErrors();

function App() {
  console.log("App.jsx: Rendering component (v2)...");
  
  // Hash-based routing state
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [startWizard, setStartWizard] = useState(false);
  const [startOrchestrator, setStartOrchestrator] = useState(false);
  const [startTour, setStartTour] = useState(false);
  const [initialPlan, setInitialPlan] = useState(null);

  // Listen for hash changes (Browser Back/Forward)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };
    
    // Set initial hash if empty
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/');
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // AUTO-REDIRECT: If already logged in or in guest mode, skip landing page on refresh
  // Only runs on mount to allow explicit navigation back to landing page later
  useEffect(() => {
    const hasUserId = localStorage.getItem('studio_user_id');
    const isGuest = localStorage.getItem('studio_guest_mode') === 'true';
    if ((hasUserId || isGuest) && currentHash === '#/') {
      console.log('[App] Session detected on mount, skipping landing page');
      setCurrentHash('#/studio/resources');
      window.location.hash = '#/studio/resources';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONLY on mount to allow explicit navigation to #/ via handleBackToLanding

  const [initialTab, setInitialTab] = useState(null);

  const handleEnterStudio = (shouldStartWizard = false, startOrchestrator = false, targetTab = 'resources') => {
    console.log('[App] handleEnterStudio called, shouldStartWizard:', shouldStartWizard, 'startOrchestrator:', startOrchestrator, 'targetTab:', targetTab);
    setStartWizard(shouldStartWizard);
    setStartOrchestrator(startOrchestrator);
    setStartTour(false);
    setInitialPlan(null);
    setInitialTab(targetTab || 'resources');
    
    // Redirect to top-level pages if requested, else studio sub-tabs
    if (targetTab === 'whitepapers') {
      console.log('[App] Navigating to top-level whitepapers');
      window.location.hash = '#/whitepapers';
    } else if (targetTab === 'legal') {
      console.log('[App] Navigating to top-level legal');
      window.location.hash = '#/legal';
    } else {
      console.log('[App] Navigating to studio tab:', targetTab);
      window.location.hash = targetTab && targetTab !== 'agents' ? `#/studio/${targetTab}` : '#/studio/resources';
    }
  };

  const handleStartTour = () => {
    setStartWizard(false);
    setStartOrchestrator(false);
    setStartTour(true);
    setInitialPlan(null);
    window.location.hash = '#/studio';
  };

  const handleSubscribe = (plan) => {
    setInitialPlan(plan);
    setStartWizard(false);
    setStartOrchestrator(false);
    setStartTour(false);
    window.location.hash = '#/studio';
  };

  const handleBackToLanding = () => {
    setStartWizard(false);
    setStartOrchestrator(false);
    setStartTour(false);
    setInitialPlan(null);
    window.location.hash = '#/';
  };

  // Determine view based on hash
  const isStudio = currentHash.startsWith('#/studio');
  const isWhitepapers = currentHash === '#/whitepapers';
  const isLegal = currentHash === '#/legal';

  return (
    <div className="app-container">
      <Toaster position="top-right" />
      {isWhitepapers ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <WhitepapersPage onBack={handleBackToLanding} agents={AGENTS} />
        </Suspense>
      ) : isLegal ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <LegalResourcesPage onBack={handleBackToLanding} />
        </Suspense>
      ) : isStudio ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <StudioView 
            onBack={handleBackToLanding} 
            startWizard={startWizard} 
            startOrchestrator={startOrchestrator}
            startTour={startTour}
            initialPlan={initialPlan}
            initialTab={initialTab}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<StudioLoadingFallback />}>
          <LandingPage 
            onEnter={handleEnterStudio} 
            onStartTour={handleStartTour}
            onSubscribe={handleSubscribe}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
