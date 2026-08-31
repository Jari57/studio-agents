import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useStudioTheme } from './hooks/useStudioTheme';
import { Toaster } from 'react-hot-toast';
import './App.css';
import { AGENTS } from './constants';
import { resourceNavigationContext, safeResourceReturnHash } from './utils/resourceNavigation.mjs';

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
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: "var(--studio-bg)", color: "var(--studio-ink)", flexDirection: 'column', gap: '16px' }}>
            <p>Failed to load. Please refresh the page.</p>
            <button onClick={() => { sessionStorage.removeItem('chunk_reload'); window.location.reload(); }} style={{ padding: '8px 24px', borderRadius: '8px', background: "var(--studio-accent)", color: "var(--studio-on-accent)", border: 'none', cursor: 'pointer' }}>Refresh</button>
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
const PublicSharePage = lazyWithRetry(() => import('./components/PublicSharePage'));

// Loading fallback component with skeleton shimmer
const StudioLoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: "var(--color-bg-primary, var(--studio-bg))",
    color: "var(--studio-ink)",
    gap: '20px'
  }}>
    {/* Skeleton header bar */}
    <div style={{ width: '90%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ height: '48px', borderRadius: '12px', background: "linear-gradient(90deg, rgba(163,66,41, 0.08) 25%, rgba(163,66,41, 0.15) 50%, rgba(163,66,41, 0.08) 75%)", backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ display: 'flex', gap: '12px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: '120px', borderRadius: '12px', background: "linear-gradient(90deg, rgba(var(--studio-ink-rgb), 0.03) 25%, rgba(var(--studio-ink-rgb), 0.06) 50%, rgba(var(--studio-ink-rgb), 0.03) 75%)", backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <div style={{ height: '200px', borderRadius: '12px', background: "linear-gradient(90deg, rgba(var(--studio-ink-rgb), 0.03) 25%, rgba(var(--studio-ink-rgb), 0.06) 50%, rgba(var(--studio-ink-rgb), 0.03) 75%)", backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', animationDelay: '0.6s' }} />
    </div>
    <div style={{
      width: '60px',
      height: '60px',
      border: "3px solid rgba(163,66,41, 0.2)",
      borderTopColor: "var(--studio-accent)",
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ fontSize: '1rem', opacity: 0.8 }}>Loading Studio...</p>
    <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
  </div>
);

function App() {
  const [theme] = useStudioTheme();
  
  // Hash-based routing state
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const previousHashRef = useRef(window.location.hash || '#/');
  const resourceReturnRef = useRef(resourceNavigationContext('#/', window.location.hash || '#/', '#/', window.history.state).returnHash);
  const [startWizard, setStartWizard] = useState(false);
  const [startOrchestrator, setStartOrchestrator] = useState(false);
  const [startTour, setStartTour] = useState(false);
  const [initialPlan, setInitialPlan] = useState(null);

  // Listen for hash changes (Browser Back/Forward)
  useEffect(() => {
    const handleHashChange = () => {
      const nextHash = window.location.hash || '#/';
      const context = resourceNavigationContext(previousHashRef.current, nextHash, resourceReturnRef.current, window.history.state);
      previousHashRef.current = nextHash;
      resourceReturnRef.current = context.returnHash;
      window.history.replaceState(context.historyState, '', window.location.href);
      setCurrentHash(nextHash);
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
      // Auto-trigger guided tour on the first ever studio visit (returning user, fresh browser)
      if (!localStorage.getItem('studio_tour_shown')) {
        localStorage.setItem('studio_tour_shown', '1');
        setStartTour(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONLY on mount to allow explicit navigation to #/ via handleBackToLanding

  const [initialTab, setInitialTab] = useState(null);

  const handleEnterStudio = (shouldStartWizard = false, startOrchestrator = false, targetTab = 'resources') => {
    // [App] handleEnterStudio called, shouldStartWizard:', shouldStartWizard, 'startOrchestrator:', startOrchestrator, 'targetTab:', targetTab);
    setStartWizard(shouldStartWizard);
    setStartOrchestrator(startOrchestrator);
    // Auto-trigger guided tour the very first time entering the studio from the landing page
    const isFirstStudioVisit = !shouldStartWizard && !startOrchestrator && !localStorage.getItem('studio_tour_shown');
    if (isFirstStudioVisit) {
      localStorage.setItem('studio_tour_shown', '1');
      setStartTour(true);
    } else {
      setStartTour(false);
    }
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

  const handleBackFromResource = () => {
    setStartWizard(false);
    setStartOrchestrator(false);
    setStartTour(false);
    setInitialPlan(null);
    setInitialTab(null);
    window.location.hash = safeResourceReturnHash(resourceReturnRef.current);
  };

  // Determine view based on hash
  const isStudio = currentHash.startsWith('#/studio');
  const isWhitepapers = currentHash === '#/whitepapers';
  const isLegal = currentHash === '#/legal';
  const isDna = currentHash === '#/dna';
  const isVocals = currentHash === '#/vocals';
  const isBillboard = currentHash === '#/billboard';
  const isCampaign = currentHash === '#/campaign';
  const shareMatch = currentHash.match(/^#\/(share|embed)\/([a-f0-9-]{12})$/i);

  return (
    <div className={`app-container ${theme}-theme`}>
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
            background: "var(--studio-surface)",
            color: "var(--studio-ink)",
            border: "1px solid rgba(var(--studio-ink-rgb), 0.1)",
            boxShadow: 'var(--studio-shadow)'
          },
          success: { duration: 2500 },
          error: { duration: 4000 },
          loading: { duration: 15000 }
        }}
      />
      {shareMatch ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <PublicSharePage shareId={shareMatch[2]} embed={shareMatch[1] === 'embed'} />
        </Suspense>
      ) : isWhitepapers ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <main>
          <WhitepapersPage onBack={handleBackFromResource} agents={AGENTS} />
          </main>
        </Suspense>
      ) : isLegal ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <main>
          <LegalResourcesPage onBack={handleBackFromResource} />
          </main>
        </Suspense>
      ) : isDna ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <main>
          <DnaResourcePage onBack={handleBackFromResource} />
          </main>
        </Suspense>
      ) : isVocals ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <main>
          <VocalsResourcePage onBack={handleBackFromResource} />
          </main>
        </Suspense>
      ) : isBillboard ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <main>
          <BillboardBlueprintPage onBack={handleBackFromResource} />
          </main>
        </Suspense>
      ) : isCampaign ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <main>
          <ContentMultiplicationPage onBack={handleBackFromResource} />
          </main>
        </Suspense>
      ) : isStudio ? (
        <Suspense fallback={<StudioLoadingFallback />}>
          <main>
          <StudioView 
            onBack={handleBackToLanding} 
            startWizard={startWizard} 
            startOrchestrator={startOrchestrator}
            startTour={startTour}
            initialPlan={initialPlan}
            initialTab={initialTab}
          />
          </main>
        </Suspense>
      ) : (
        <Suspense fallback={<StudioLoadingFallback />}>
          <main>
          <LandingPage 
            onEnter={handleEnterStudio} 
            onStartTour={handleStartTour}
            onSubscribe={handleSubscribe}
          />
          </main>
        </Suspense>
      )}
    </div>
  );
}

export default App;
