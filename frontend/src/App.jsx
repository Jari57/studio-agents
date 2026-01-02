import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import StudioView from './components/StudioView';
import './App.css';
import './mobile-fixes.css';

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
        <StudioView 
          onBack={handleBackToLanding} 
          startWizard={startWizard} 
          startTour={startTour}
          initialPlan={initialPlan}
        />
      )}
    </div>
  );
}

export default App;
