import React, { useState, useEffect, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import './App.css';
import { AGENTS } from './constants';

// Retry wrapper for lazy imports — handles chunk load failures (stale cache, deploy mid-session)
const lazyWithRetry = (importFn) => React.lazy(() =>
  importFn().catch(() => {
    // First retry after 1s (cache might be stale)
    return new Promise(resolve => setTimeout(resolve, 1000))
      .then(() => importFn())
      .catch(() => {
        // Final retry — force reload if chunks are truly broken
        if (!sessionStorage.getItem('chunk_reload')) {
          sessionStorage.setItem('chunk_reload', '1');
          window.location.reload();
        }
        // If we already reloaded once, surface the error
        return { default: () => (
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: 'white', flexDirection: 'column', gap: '16px' }}>
            <p>Failed to load. Please refresh the page.</p>
            <button onClick={() => { sessionStorage.removeItem('chunk_reload'); window.location.reload(); }} style={{ padding: '8px 24px', borderRadius: '8px', background: '#a855f7', color: 'white', border: 'none', cursor: 'pointer' }}>Refresh</button>
          </div>
        )};
      });
  })
);

// Clear chunk reload flag on successful load
if (sessionStorage.getItem('chunk_reload')) sessionStorage.removeItem('chunk_reload');

const LandingPage = lazyWithRetry(() => import('./components/LandingPage'));
const StudioView = lazyWithRetry(() => import('./components/StudioView'));
const WhitepapersPage = lazyWithRetry(() => import('./components/WhitepapersPage'));
const LegalResourcesPage = lazyWithRetry(() => import('./components/LegalResourcesPage'));
const DnaResourcePage = lazyWithRetry(() => import('./components/DnaResourcePage'));
const VocalsResourcePage = lazyWithRetry(() => import('./components/VocalsResourcePage'));
const BillboardBlueprintPage = lazyWithRetry(() => import('./components/BillboardBlueprintPage'));
const ContentMultiplicationPage = lazyWithRetry(() => import('./components/ContentMultiplicationPage'));

// Loading fallback component with skeleton shimmer
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
    {/* Skeleton header bar */}
    <div style={{ width: '90%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ height: '48px', borderRadius: '12px', background: 'linear-gradient(90deg, rgba(168,85,247,0.08) 25%, rgba(168,85,247,0.15) 50%, rgba(168,85,247,0.08) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ display: 'flex', gap: '12px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: '120px', borderRadius: '12px', background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <div style={{ height: '200px', borderRadius: '12px', background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', animationDelay: '0.6s' }} />
    </div>
    <div style={{
      width: '60px',
      height: '60px',
      border: '3px solid rgba(168, 85, 247, 0.2)',
      borderTopColor: '#a855f7',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ fontSize: '1rem', opacity: 0.8 }}>Loading Studio...</p>
    <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
  </div>
);

function App() {
  
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
      // [App] Session detected on mount, skipping landing page');
      setCurrentHash('#/studio/resources');
      window.location.hash = '#/studio/resources';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONLY on mount to allow explicit navigation to #/ via handleBackToLanding

  const [initialTab, setInitialTab] = useState(null);

  const handleEnterStudio = (shouldStartWizard = false, startOrchestrator = false, targetTab = 'resources') => {
    // [App] handleEnterStudio called, shouldStartWizard:', shouldStartWizard, 'startOrchestrator:', startOrchestrator, 'targetTab:', targetTab);
    setStartWizard(shouldStartWizard);
    setStartOrchestrator(startOrchestrator);
    setStartTour(false);
    setInitialPlan(null);
    setInitialTab(targetTab || 'resources');
    
    // Redirect to top-level pages if requested, else studio sub-tabs
    if (targetTab === 'whitepapers') {
      // [App] Navigating to top-level whitepapers');
      window.location.hash = '#/whitepapers';
    } else if (targetTab === 'legal') {
      // [App] Navigating to top-level legal');
      window.location.hash = '#/legal';
    } else if (targetTab === 'dna') {
      // [App] Navigating to DNA resource page');
      window.location.hash = '#/dna';
    } else if (targetTab === 'vocals') {
      // [App] Navigating to Vocals resource page');
      window.location.hash = '#/vocals';
    } else if (targetTab === 'billboard') {
      // [App] Navigating to Billboard Blueprint page');
      window.location.hash = '#/billboard';
    } else {
      // [App] Navigating to studio tab:', targetTab);
      window.location.hash = targetTab ? `#/studio/${targetTab}` : '#/studio/resources';
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
  const isDna = currentHash === '#/dna';
  const isVocals = currentHash === '#/vocals';
  const isBillboard = currentHash === '#/billboard';
  const isCampaign = currentHash === '#/campaign';

  return (
    <div className="app-container">
      <Toaster 
        position="bottom-center"
        containerStyle={{ bottom: 80 }}
        toastOptions={{
          duration: 3000,
          style: {
            maxWidth: '420px',
            fontSize: '0.9rem',
            borderRadius: '12px',
            padding: '10px 16px',
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          },
          success: { duration: 2500 },
          error: { duration: 4000 },
          loading: { duration: 15000 }
        }}
      />
      {isWhitepapers ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <WhitepapersPage onBack={handleBackToLanding} agents={AGENTS} />
        </Suspense>
      ) : isLegal ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <LegalResourcesPage onBack={handleBackToLanding} />
        </Suspense>
      ) : isDna ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <DnaResourcePage onBack={handleBackToLanding} />
        </Suspense>
      ) : isVocals ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <VocalsResourcePage onBack={handleBackToLanding} />
        </Suspense>
      ) : isBillboard ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <BillboardBlueprintPage onBack={handleBackToLanding} />
        </Suspense>
      ) : isCampaign ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <ContentMultiplicationPage onBack={handleBackToLanding} />
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
