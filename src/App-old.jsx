/**
 * Studio Agents - Reimagined
 * Premium AI Music Studio for Creative People
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Zap, Music, Crown, Users, Target, Rocket } from 'lucide-react';
import './App.css';

// ═════════════════════════════════════════════════════════════════════════
// LANDING PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════════

const LandingPage = ({ onEnter }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="stars-bg"></div>
        
        <div className="hero-content">
          <div className="logo-zone">
            <div className="logo-glow">
              <Sparkles size={48} />
            </div>
          </div>

          <h1 className="hero-title gradient-text-hero">
            Studio Agents
          </h1>

          <p className="hero-subtitle">
            AI-powered music studio reimagined for creative people
          </p>

          <button className="cta-button" onClick={onEnter}>
            Enter Studio
            <ArrowRight size={20} />
          </button>

          <div className="hero-features">
            <div className="feature-item">
              <Zap size={24} />
              <span>Instant Creation</span>
            </div>
            <div className="feature-item">
              <Music size={24} />
              <span>AI Powered</span>
            </div>
            <div className="feature-item">
              <Crown size={24} />
              <span>Premium Tools</span>
            </div>
          </div>
        </div>

        {/* Agent Showcase */}
        <div className="agent-showcase">
          <h2 className="showcase-title">Your Creative Studio Agents</h2>
          
          <div className="agents-grid">
            {AGENTS.map((agent, idx) => (
              <div key={idx} className="agent-card">
                <div className="agent-icon">
                  {React.cloneElement(agent.icon, { size: 32 })}
                </div>
                <h3>{agent.name}</h3>
                <p>{agent.description}</p>
                <div className="agent-badge">{agent.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="benefits-section">
          <h2>Why Studio Agents?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-number">1</div>
              <h4>Create Instantly</h4>
              <p>AI-powered generation from simple prompts</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-number">2</div>
              <h4>Professional Quality</h4>
              <p>Studio-grade output powered by Gemini AI</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-number">3</div>
              <h4>Stay Creative</h4>
              <p>Focus on vision, let AI handle the work</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═════════════════════════════════════════════════════════════════════════

const AGENTS = [
  {
    name: 'Ghostwriter',
    description: 'AI lyricist creating bars on demand',
    category: 'Writing',
    icon: <Music size={32} />
  },
  {
    name: 'Beat Lab',
    description: 'Generate production ideas instantly',
    category: 'Production',
    icon: <Zap size={32} />
  },
  {
    name: 'Album Artist',
    description: 'Create stunning album artwork with AI',
    category: 'Visual',
    icon: <Sparkles size={32} />
  },
  {
    name: 'Trend Hunter',
    description: 'Discover what\'s hot right now',
    category: 'Research',
    icon: <Target size={32} />
  },
  {
    name: 'Collab Connect',
    description: 'Find the perfect collaborators',
    category: 'Networking',
    icon: <Users size={32} />
  },
  {
    name: 'Release Manager',
    description: 'Strategic release planning AI',
    category: 'Strategy',
    icon: <Rocket size={32} />
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState('landing');

  return (
    <div className="app-container">
      {currentView === 'landing' && (
        <LandingPage onEnter={() => setCurrentView('studio')} />
      )}
      {currentView === 'studio' && (
        <div className="studio-view">
          <h1>Coming Soon: Full Studio Interface</h1>
          <button onClick={() => setCurrentView('landing')}>Back to Landing</button>
        </div>
      )}
    </div>
  );
}
