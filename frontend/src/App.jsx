import React, { useState, useEffect, lazy, Suspense, Component } from 'react';
import LandingPage from './components/LandingPage';
import './App.css';
import './mobile-fixes.css';
import { suppressExtensionErrors } from './utils/suppressExtensionErrors';

// Lazy load the heavy StudioView component
const StudioView = lazy(() => import('./components/StudioView'));

// Error Boundary Component for graceful crash recovery
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
          color: 'white',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', marginBottom: '24px', maxWidth: '400px' }}>
            The studio encountered an unexpected error. Don't worry, your work is safe.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Reload Studio
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '24px', textAlign: 'left', maxWidth: '600px', width: '100%' }}>
              <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                Technical Details (Dev Only)
              </summary>
              <pre style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: 'rgba(0,0,0,0.5)', 
                borderRadius: '8px',
                fontSize: '0.75rem',
                overflow: 'auto',
                color: '#ef4444'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

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

  const [initialTab, setInitialTab] = useState(null);

  const handleEnterStudio = (shouldStartWizard = false, startOrchestrator = false, targetTab = null) => {
    console.log('[App] handleEnterStudio called, shouldStartWizard:', shouldStartWizard, 'startOrchestrator:', startOrchestrator, 'targetTab:', targetTab);
    setStartWizard(shouldStartWizard);
    setStartOrchestrator(startOrchestrator);
    setStartTour(false);
    setInitialPlan(null);
    setInitialTab(targetTab);
    console.log('[App] Setting hash to #/studio');
    window.location.hash = '#/studio';
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

  return (
    <ErrorBoundary>
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
              startOrchestrator={startOrchestrator}
              startTour={startTour}
              initialPlan={initialPlan}
              initialTab={initialTab}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
