import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import StudioView from './components/StudioView';
import './App.css';
import './mobile-fixes.css';

function App() {
  console.log("App.jsx: Rendering component...");
  // Simple state-based routing
  // 'landing' | 'studio'
  const [currentView, setCurrentView] = useState('landing');

  // Check for saved session or deep links
  useEffect(() => {
    // If user was previously in studio, maybe restore?
    // For now, let's always start at landing unless we add auth persistence logic here
    /*
    const savedView = localStorage.getItem('studio_last_view');
    if (savedView === 'studio') {
      setCurrentView('studio');
    }
    */
  }, []);

  const [startWizard, setStartWizard] = useState(false);

  const handleEnterStudio = () => {
    setCurrentView('studio');
    setStartWizard(true);
    localStorage.setItem('studio_last_view', 'studio');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setStartWizard(false);
    localStorage.setItem('studio_last_view', 'landing');
  };

  return (
    <div className="app-container">
      {currentView === 'landing' ? (
        <LandingPage 
          onEnter={handleEnterStudio} 
          onSubscribe={() => console.log('Subscribe clicked')}
        />
      ) : (
        <StudioView onBack={handleBackToLanding} startWizard={startWizard} />
      )}
    </div>
  );
}

export default App;
