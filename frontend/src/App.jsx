import React, { useState, useEffect, lazy, Suspense } from 'react';
import LandingPage from './components/LandingPage';
import './App.css';
import './mobile-fixes.css';
import { suppressExtensionErrors } from './utils/suppressExtensionErrors';

// Lazy load the heavy StudioView component
const StudioView = lazy(() => import('./components/StudioView'));

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
    <p style={{ fontSize: '1rem', opacity: 0.8 }}>Loading Studio...</p>
  </div>
);

// Suppress harmless browser extension errors (MetaMask, etc.)
suppressExtensionErrors();

function App() {
  console.log("App.jsx: Rendering component (v2)...");
  
  // Hash-based routing state
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [startWizard, setStartWizard] = useState(false);
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

  const handleEnterStudio = (shouldStartWizard = false) => {
    setStartWizard(shouldStartWizard);
    setStartTour(false);
    setInitialPlan(null);
    window.location.hash = '#/studio';
  };

  const handleStartTour = () => {
    setStartWizard(false);
    setStartTour(true);
    setInitialPlan(null);
    window.location.hash = '#/studio';
  };

  const handleSubscribe = (plan) => {
    setInitialPlan(plan);
    setStartWizard(false);
    setStartTour(false);
    window.location.hash = '#/studio';
  };

  const handleBackToLanding = () => {
    setStartWizard(false);
    setStartTour(false);
    setInitialPlan(null);
    window.location.hash = '#/';
  };

  // Determine view based on hash
  const isStudio = currentHash.startsWith('#/studio');

  return (
    <div className="app-container">
      {!isStudio ? (
        <LandingPage 
          onEnter={handleEnterStudio} 
          onStartTour={handleStartTour}
          onSubscribe={handleSubscribe}
        />
      ) : (
        <Suspense fallback={<StudioLoadingFallback />}>
          <StudioView 
            onBack={handleBackToLanding} 
            startWizard={startWizard} 
            startTour={startTour}
            initialPlan={initialPlan}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
