/**
 * Studio Agents - Premium AI Music Studio Landing Page
 * Modern, vibrant design for creative people
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Zap, Music, Crown, Users, Target, Rocket, Menu, X, LayoutGrid, Globe, Bell, ChevronRight, ChevronDown, ChevronUp, Shield, TrendingUp, Folder, Search, Filter, Download, Share2, HelpCircle, Book, MessageSquare, PlayCircle, Play, Pause, Volume2, Maximize, Home, ArrowLeft, Mic, Save, Cloud, Lock, CheckCircle, Award, Settings, Languages, CreditCard, HardDrive, Database, BarChart3, PieChart, Twitter, Instagram, Facebook, RefreshCw, Sun, Moon, Trash2 } from 'lucide-react';
import './App.css';

// Backend URL configuration
const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://studio-agents-backend-production.up.railway.app';

// Agent showcase data
const AGENTS = [
  {
    name: 'Ghostwriter',
    description: 'AI lyricist creating bars on demand',
    category: 'Writing',
    icon: Sparkles,
    colorClass: 'agent-purple'
  },
  {
    name: 'Beat Lab',
    description: 'Generate production ideas instantly',
    category: 'Production',
    icon: Zap,
    colorClass: 'agent-cyan'
  },
  {
    name: 'Album Artist',
    description: 'Create stunning album artwork with AI',
    category: 'Visual',
    icon: Music,
    colorClass: 'agent-orange'
  },
  {
    name: 'Video Creator',
    description: 'Generate cinematic videos with Veo 3',
    category: 'Video',
    icon: PlayCircle,
    colorClass: 'agent-red'
  },
  {
    name: 'Trend Hunter',
    description: 'Discover what\'s hot right now',
    category: 'Research',
    icon: Target,
    colorClass: 'agent-emerald'
  },
  {
    name: 'Collab Connect',
    description: 'Find the perfect collaborators',
    category: 'Networking',
    icon: Users,
    colorClass: 'agent-indigo'
  },
  {
    name: 'Release Manager',
    description: 'Strategic release planning AI',
    category: 'Strategy',
    icon: Rocket,
    colorClass: 'agent-pink'
  },
  {
    name: 'Mastering Lab',
    description: 'Professional AI audio engineering',
    category: 'Engineering',
    icon: Shield,
    colorClass: 'agent-purple'
  },
  {
    name: 'Social Pilot',
    description: 'Automated social media growth',
    category: 'Marketing',
    icon: Globe,
    colorClass: 'agent-cyan'
  },
  {
    name: 'Instrumentalist',
    description: 'AI-driven virtual session players',
    category: 'Performance',
    icon: Music,
    colorClass: 'agent-indigo',
    isPro: true
  },
  {
    name: 'Beat Architect',
    description: 'Advanced drum machine and rhythm generator',
    category: 'Production',
    icon: Zap,
    colorClass: 'agent-pink',
    isPro: true
  },
  {
    name: 'Sample Master',
    description: 'Intelligent sampling and loop manipulation',
    category: 'Sampling',
    icon: Folder,
    colorClass: 'agent-orange',
    isPro: true
  },
  {
    name: 'Drop Zone',
    description: 'High-energy EDM and Trap drop generator',
    category: 'Production',
    icon: Rocket,
    colorClass: 'agent-red',
    isPro: true
  },
  {
    name: 'Score Editor',
    description: 'Precision scoring for film and media',
    category: 'Scoring',
    icon: Book,
    colorClass: 'agent-emerald',
    isPro: true
  },
  {
    name: 'Video Scorer',
    description: 'Upload video and AI generates the soundtrack',
    category: 'Video',
    icon: PlayCircle,
    colorClass: 'agent-cyan',
    isPro: true
  },
  {
    name: 'Vocal Architect',
    description: 'AI vocal synthesis and harmony generation',
    category: 'Vocals',
    icon: Users,
    colorClass: 'agent-purple',
    isPro: true
  },
  {
    name: 'Sound Designer',
    description: 'Custom synth patch and texture creation',
    category: 'Engineering',
    icon: Shield,
    colorClass: 'agent-blue',
    isPro: true
  }
];

// Landing Page Component
function LandingPage({ onEnter }) {
  const [hoveredAgent, setHoveredAgent] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-container">
      {/* Native-style Mobile Header */}
      <header className={`native-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <div className="header-logo">
            <Sparkles size={24} className="text-purple" />
            <span className="header-title">Studio Agents</span>
          </div>
          <button onClick={onEnter} className="header-cta">
            Launch
          </button>
        </div>
      </header>

      {/* Stars background */}
      <div className="stars-overlay"></div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>

        <div className="hero-content-wrapper">
          {/* Logo/Icon */}
          <div className="logo-container">
            <div className="logo-box studio-logo-large animate-float">
              <Sparkles size={64} color="white" />
            </div>
          </div>

          {/* Main Title */}
          <h1 className="hero-title">
            <span className="gradient-text-vibrant">
              DOMINATE THE CHARTS
            </span>
            <br />
            <span style={{ fontSize: '0.5em', fontWeight: '400', color: 'var(--text-secondary)', display: 'block', marginTop: '10px' }}>
              WITH YOUR OWN AI TEAM
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Stop struggling with writer's block. 
            <br />
            <strong>Studio Agents</strong> gives you an elite team of 16 AI specialists to write, produce, and market your music 24/7.
          </p>

          {/* Social Proof Badge */}
          <div className="social-proof-badge" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(255,255,255,0.05)', 
            padding: '8px 16px', 
            borderRadius: '20px', 
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: `var(--gradient-vibrant)`, 
                  marginLeft: i > 1 ? '-8px' : 0,
                  border: '2px solid var(--color-bg-primary)'
                }}></div>
              ))}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Trusted by <strong>10,000+</strong> Artists
            </span>
          </div>

          {/* CTA Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
            <button
              onClick={onEnter}
              className="cta-button-premium haptic-press"
              style={{ width: '100%', maxWidth: '350px', height: '60px', fontSize: '1.2rem' }}
            >
              <span>Start Creating for Free</span>
              <ArrowRight size={24} />
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
              No credit card required • Cancel anytime
            </span>
          </div>

          {/* Features Grid */}
          <div className="hero-features-list" style={{ marginTop: '40px' }}>
            <div className="feature-pill haptic-press">
              <Zap size={20} className="text-cyan" />
              <span>10x Faster Workflow</span>
            </div>
            <div className="feature-pill haptic-press">
              <Crown size={20} className="text-purple" />
              <span>Industry Standard Quality</span>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="scroll-indicator">
            <div className="scroll-text">See what's possible</div>
            <div className="scroll-dot"></div>
          </div>
        </div>
      </section>

      {/* Results / "What You Get" Section (New) */}
      <section className="results-section" style={{ padding: '4rem 2rem', background: 'var(--color-bg-secondary)' }}>
        <div className="section-header">
          <div className="section-tag">The Output</div>
          <h2 className="section-title">
            Build Your <span className="gradient-text-purple-pink">Legacy</span>
          </h2>
          <p className="section-subtitle">
            Don't just make music. Build a brand.
          </p>
        </div>
        
        <div className="results-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px',
          marginTop: '30px'
        }}>
          {[
            { icon: Music, title: "Hit-Ready Lyrics", desc: "Generate hooks, verses, and bridges that stick.", color: "var(--color-purple)" },
            { icon: Zap, title: "Viral Video Content", desc: "Create music videos and visualizers instantly.", color: "var(--color-cyan)" },
            { icon: Globe, title: "Marketing Strategy", desc: "Data-driven rollout plans to break the algorithm.", color: "var(--color-pink)" }
          ].map((item, i) => (
            <div key={i} className="result-card" style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              padding: '24px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <div style={{ 
                background: item.color, 
                padding: '12px', 
                borderRadius: '12px', 
                color: 'white',
                boxShadow: `0 4px 15px ${item.color}40`
              }}>
                <item.icon size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>{item.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Agent Showcase Section - Mobile Horizontal Scroll */}
      <section className="agents-section">
        <div className="section-header">
          <div className="section-tag">Featured Agents</div>
          <h2 className="section-title">
            Your <span className="gradient-text-cyan-purple">Creative Studio Agents</span>
          </h2>
          <p className="section-subtitle">
            Sixteen powerful AI agents ready to elevate every aspect of your music production
          </p>
        </div>

        <div className="agents-scroll-container">
          <div className="scroll-hint">
            <ArrowRight size={16} />
            <span>Swipe to explore</span>
          </div>
          <div className="agents-grid">
            {AGENTS.map((agent, idx) => {
              const Icon = agent.icon;
              const isHovered = hoveredAgent === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredAgent(idx)}
                  onMouseLeave={() => setHoveredAgent(null)}
                  className={`agent-card-premium ${agent.colorClass} haptic-press`}
                  onClick={onEnter}
                >
                  {/* Background glow */}
                  <div className="agent-card-glow"></div>

                  {/* Content */}
                  <div className="agent-card-content">
                    {/* Icon */}
                    <div className="agent-icon-box">
                      <Icon size={24} className="text-white" />
                    </div>

                    <div className="agent-card-header-info">
                      <h3 className="agent-name">
                        {agent.name}
                      </h3>
                      <div className="agent-category-badge">
                        {agent.category}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="agent-description">
                      {agent.description}
                    </p>

                    {/* Action Button (Native Style) */}
                    <div className="agent-card-action">
                      <span className="action-label">Open</span>
                      <div className="action-icon">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-wrapper">
          <div className="section-header">
            <div className="section-tag">Why Us</div>
            <h2 className="section-title">
              Why Choose <span className="gradient-text-purple-pink">Studio Agents?</span>
            </h2>
          </div>

          <div className="benefits-grid-native">
            {[
              { icon: Zap, title: 'Create Instantly', desc: 'AI-powered generation from simple prompts in seconds' },
              { icon: Crown, title: 'Professional Quality', desc: 'Studio-grade output powered by advanced AI models' },
              { icon: Users, title: 'Stay Creative', desc: 'Focus on your vision, let AI handle the work' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="benefit-card-native haptic-press">
                  <div className="benefit-icon-wrapper">
                    <Icon size={28} className="text-white" />
                  </div>
                  <div className="benefit-content-native">
                    <h3 className="benefit-title-native">{item.title}</h3>
                    <p className="benefit-desc-native">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
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
              price: '$4.99',
              period: '/month',
              features: ['100 uses/month', '30s audio output', 'Save creations', 'Priority processing'],
              popular: true
            },
            {
              name: 'Studio Pro',
              price: '$14.99',
              period: '/month',
              features: ['Unlimited uses', '60s audio output', 'All Creator features', 'API access', 'Team collab']
            },
            {
              name: 'Lifetime Deal',
              price: '$199',
              period: 'one-time',
              features: ['Lifetime access', 'All future agents', 'Highest priority', 'White-label options', 'Dedicated support'],
              ltd: true
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

              <div className="plan-header-native">
                <h3 className="plan-name-native">{plan.name}</h3>
                <div className="plan-price-box-native">
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
              >
                {plan.ltd ? 'Get Lifetime Access' : 'Start Free Trial'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="footer-cta">
        <h2 className="footer-cta-title">
          Ready to create something <span className="gradient-text-purple-pink">amazing?</span>
        </h2>
        <button
          onClick={onEnter}
          className="cta-button-premium haptic-press"
        >
          <span>Launch Studio Now</span>
          <ArrowRight size={24} />
        </button>
      </section>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <Sparkles size={24} color="var(--color-purple)" />
            <span>STUDIO AGENTS AI</span>
          </div>
          <p>&copy; 2025 studioagentsai.com • Built for the next generation of creators.</p>
        </div>
      </footer>

      {/* Mobile Sticky Bottom CTA */}
      <div className="mobile-sticky-cta">
        <button onClick={onEnter} className="sticky-cta-btn haptic-press">
          <span>Launch Studio</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

// Studio View Component
function StudioView({ onBack }) {
  const [activeTab, setActiveTab] = useState('mystudio');
  const [theme, setTheme] = useState(() => localStorage.getItem('studio_theme') || 'dark');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newsSearch, setNewsSearch] = useState('');
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [projects, setProjects] = useState([]);
  const [expandedNews, setExpandedNews] = useState(new Set());
  const [allNewsExpanded, setAllNewsExpanded] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState(null);
  const [helpSearch, setHelpSearch] = useState('');
  const [showNudge, setShowNudge] = useState(true);
  const [hubFilter, setHubFilter] = useState('All');
  const [playingItem, setPlayingItem] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    gender: 'female',
    region: 'US',
    language: 'English'
  });
  const [showExternalSaveModal, setShowExternalSaveModal] = useState(false);
  
  // Activity Wall Pagination State
  const [activityPage, setActivityPage] = useState(1);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [hasMoreActivity, setHasMoreActivity] = useState(true);
  const [activityFeed, setActivityFeed] = useState([]);

  // News Pagination State
  const [newsPage, setNewsPage] = useState(1);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [newsArticles, setNewsArticles] = useState([]);

  const [socialConnections, setSocialConnections] = useState(() => {
    const saved = localStorage.getItem('studio_agents_socials');
    return saved ? JSON.parse(saved) : {
      instagram: false,
      tiktok: false,
      twitter: false,
      spotify: false
    };
  });
  const [twitterUsername, setTwitterUsername] = useState(() => localStorage.getItem('studio_agents_twitter_user'));
  const [metaName, setMetaName] = useState(() => localStorage.getItem('studio_agents_meta_name'));
  const [storageConnections, setStorageConnections] = useState(() => {
    const saved = localStorage.getItem('studio_agents_storage');
    return saved ? JSON.parse(saved) : {
      googleDrive: false,
      dropbox: false,
      oneDrive: false,
      localDevice: true
    };
  });

  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'pm_1', type: 'Visa', last4: '4242', expiry: '12/26', isDefault: true },
    { id: 'pm_2', type: 'Mastercard', last4: '8888', expiry: '09/25', isDefault: false }
  ]);

  const [bankAccounts, setBankAccounts] = useState([
    { id: 'ba_1', bankName: 'Chase Bank', last4: '1234', type: 'Checking' }
  ]);

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('card'); // 'card' or 'bank'

  // Persist social state
  useEffect(() => {
    localStorage.setItem('studio_agents_socials', JSON.stringify(socialConnections));
    localStorage.setItem('studio_agents_storage', JSON.stringify(storageConnections));
    if (twitterUsername) localStorage.setItem('studio_agents_twitter_user', twitterUsername);
    if (metaName) localStorage.setItem('studio_agents_meta_name', metaName);
  }, [socialConnections, twitterUsername, metaName, storageConnections]);

  // Handle Social OAuth Callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Twitter Callback
    if (params.get('twitter_connected') === 'true') {
      const username = params.get('twitter_username');
      setSocialConnections(prev => ({ ...prev, twitter: true }));
      setTwitterUsername(username);
      
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      alert(`Successfully connected to X/Twitter as @${username}!`);
    }

    // Meta Callback (Insta/FB)
    if (params.get('meta_connected') === 'true') {
      const name = params.get('meta_name');
      setSocialConnections(prev => ({ ...prev, instagram: true, facebook: true }));
      setMetaName(name);
      
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      alert(`Successfully connected to Meta (Instagram & Facebook) as ${name}!`);
    }
  }, []);

  // --- PROFESSIONAL VOICE & TRANSLATION LOGIC ---
  
  const recognitionRef = useRef(null);

  const handleVoiceToText = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceSettings.language === 'English' ? 'en-US' : 
                      voiceSettings.language === 'Spanish' ? 'es-ES' :
                      voiceSettings.language === 'French' ? 'fr-FR' :
                      voiceSettings.language === 'German' ? 'de-DE' :
                      voiceSettings.language === 'Japanese' ? 'ja-JP' : 'en-US';
    
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      
      // --- GLOBAL VOICE COMMANDS ---
      if (transcript.includes('open') || transcript.includes('launch')) {
        const agentName = transcript.replace('open', '').replace('launch', '').trim();
        const foundAgent = STUDIO_AGENTS.find(a => a.name.toLowerCase().includes(agentName));
        if (foundAgent) {
          setSelectedAgent(foundAgent);
          setActiveTab('agents');
          handleTextToVoice(`Launching ${foundAgent.name} for you.`);
          return;
        }
      }

      if (transcript.includes('go to') || transcript.includes('show me')) {
        if (transcript.includes('dashboard') || transcript.includes('studio')) {
          setActiveTab('mystudio');
          handleTextToVoice("Navigating to your dashboard.");
        }
        if (transcript.includes('hub')) {
          setActiveTab('hub');
          handleTextToVoice("Opening the Project Hub.");
        }
        if (transcript.includes('news')) {
          setActiveTab('news');
          handleTextToVoice("Checking the latest industry news.");
        }
        if (transcript.includes('help')) {
          setActiveTab('help');
          handleTextToVoice("How can I help you today?");
        }
        if (transcript.includes('agents')) {
          setActiveTab('agents');
          handleTextToVoice("Viewing all available agents.");
        }
        return;
      }

      if (transcript.includes('switch theme') || transcript.includes('toggle theme') || transcript.includes('light mode') || transcript.includes('dark mode')) {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('studio_theme', newTheme);
        handleTextToVoice(`Switching to ${newTheme} mode.`);
        return;
      }

      if (transcript.includes('add payment') || transcript.includes('billing') || transcript.includes('manage card')) {
        setActiveTab('mystudio');
        setShowAddPaymentModal(true);
        handleTextToVoice("Opening the payment management portal.");
        return;
      }

      // Default: Append to textarea
      const textarea = document.querySelector('.studio-textarea');
      if (textarea) {
        textarea.value = (textarea.value + ' ' + transcript).trim();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleTextToVoice = (textInput) => {
    if (isSpeaking && (!textInput || typeof textInput !== 'string')) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // If textInput is an event or not a string, use the textarea value
    const textToSpeak = (typeof textInput === 'string') ? textInput : document.querySelector('.studio-textarea')?.value;
    if (!textToSpeak) return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const speak = (voices) => {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      let selectedVoice = null;

      // Filter by language and gender/region
      const langCode = voiceSettings.language === 'English' ? 'en' : 
                      voiceSettings.language === 'Spanish' ? 'es' :
                      voiceSettings.language === 'French' ? 'fr' :
                      voiceSettings.language === 'German' ? 'de' :
                      voiceSettings.language === 'Japanese' ? 'ja' : 'en';

      const filteredVoices = voices.filter(v => v.lang.startsWith(langCode));
      
      // Try to find a match for gender/region
      if (voiceSettings.region === 'UK') {
        selectedVoice = filteredVoices.find(v => v.name.includes('UK') || v.name.includes('British'));
      } else if (voiceSettings.region === 'AU') {
        selectedVoice = filteredVoices.find(v => v.name.includes('Australia'));
      } else if (voiceSettings.region === 'IN') {
        selectedVoice = filteredVoices.find(v => v.name.includes('India'));
      }

      // If no region match, try gender
      if (!selectedVoice) {
        if (voiceSettings.gender === 'female') {
          selectedVoice = filteredVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('victoria'));
        } else {
          selectedVoice = filteredVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('daniel'));
        }
      }

      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.lang = langCode;
      utterance.rate = 0.9; // Slightly slower for "Studio" feel
      utterance.pitch = voiceSettings.gender === 'female' ? 1.1 : 0.9;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speak(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        speak(voices);
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  };

  const handleTranslatePrompt = async () => {
    const textarea = document.querySelector('.studio-textarea');
    if (!textarea || !textarea.value || voiceSettings.language === 'English') return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textarea.value,
          targetLanguage: 'English',
          sourceLanguage: voiceSettings.language
        })
      });

      const data = await response.json();
      if (data.translatedText) {
        textarea.value = data.translatedText;
        alert(`Prompt translated to English for better AI results!`);
      }
    } catch (error) {
      console.error("Translation failed", error);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    const textarea = document.querySelector('.studio-textarea');
    if (!textarea || !textarea.value) {
      alert("Please enter a prompt first.");
      return;
    }

    setIsGenerating(true);
    
    try {
      let prompt = textarea.value;

      // Auto-translate if not English
      if (voiceSettings.language !== 'English') {
        const response = await fetch(`${BACKEND_URL}/api/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: prompt,
            targetLanguage: 'English',
            sourceLanguage: voiceSettings.language
          })
        });
        const data = await response.json();
        if (data.translatedText) {
          prompt = data.translatedText;
          console.log("Auto-translated prompt for AI:", prompt);
        }
      }

      let endpoint = '/api/generate';
      let body = {
        prompt: prompt,
        systemInstruction: `You are ${selectedAgent.name}, a professional AI agent in a high-end music studio. 
          Category: ${selectedAgent.category}. 
          Capabilities: ${selectedAgent.capabilities.join(', ')}.
          ${selectedAgent.explanation}`
      };

      // Route to specific endpoints for Image/Video agents
      if (selectedAgent.id === 'album') {
        endpoint = '/api/generate-image';
        body = { prompt };
      } else if (selectedAgent.id === 'video-creator') {
        endpoint = '/api/generate-video';
        body = { prompt };
      }

      // Call Backend
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      // Handle different response types
      let newItem = {
        id: Date.now(),
        title: `${selectedAgent.name} Result`,
        type: selectedAgent.category,
        agent: selectedAgent.name,
        date: 'Just now',
        color: selectedAgent.colorClass,
        snippet: prompt // Default snippet is the prompt
      };

      if (selectedAgent.id === 'album' && (data.predictions || data.images)) {
        // Handle Image Response (Imagen)
        // API might return predictions[0].bytesBase64Encoded OR images[0]
        const base64Image = data.predictions?.[0]?.bytesBase64Encoded || data.images?.[0];
        if (base64Image) {
            newItem.imageUrl = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
            newItem.snippet = `Generated artwork for: "${prompt}"`;
        }
      } else if (selectedAgent.id === 'video-creator' && (data.predictions || data.video)) {
        // Handle Video Response (Veo)
        const videoData = data.predictions?.[0] || data.video;
        if (videoData) {
            if (videoData.bytesBase64Encoded) {
                 newItem.videoUrl = `data:video/mp4;base64,${videoData.bytesBase64Encoded}`;
            } else if (videoData.videoUri) {
                 newItem.videoUrl = videoData.videoUri;
            }
            newItem.snippet = `Generated video for: "${prompt}"`;
        }
      } else if (data.output) {
        // Handle Text Response
        let finalOutput = data.output;
        if (voiceSettings.language !== 'English') {
          const transResponse = await fetch(`${BACKEND_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: finalOutput,
              targetLanguage: voiceSettings.language,
              sourceLanguage: 'English'
            })
          });
          const transData = await transResponse.json();
          if (transData.translatedText) finalOutput = transData.translatedText;
        }
        newItem.snippet = finalOutput;
      } else {
        // Fallback or Error
        if (data.error) throw new Error(data.error);
        // If we got here but no specific data, maybe it's a raw text response?
        // But we expect JSON.
        throw new Error("Unknown response format from AI");
      }

      setProjects([newItem, ...projects]);

      // Save to Backend if logged in
      if (isLoggedIn) {
        const uid = localStorage.getItem('studio_user_id');
        if (uid) {
           fetch(`${BACKEND_URL}/api/projects`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ userId: uid, project: newItem })
           }).catch(err => console.error("Failed to save to cloud", err));
        }
      }

      alert(`${selectedAgent.name} generation complete! Check your Hub.`);
      setActiveTab('hub');
      setSelectedAgent(null);

    } catch (error) {
      console.error("Generation error", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchActivity = async (page = 1) => {
    if (isLoadingActivity || (!hasMoreActivity && page !== 1)) return;
    
    setIsLoadingActivity(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/trending-ai?page=${page}&per_page=20`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        setActivityFeed(prev => page === 1 ? data.items : [...prev, ...data.items]);
        setActivityPage(page);
        // Cap at 202 items as requested
        if (data.items.length < 20 || (page * 20) >= 202) {
          setHasMoreActivity(false);
        }
      } else {
        setHasMoreActivity(false);
      }
    } catch (err) {
      console.error('Failed to fetch activity', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const fetchNews = async (page = 1) => {
    if (isLoadingNews || (!hasMoreNews && page !== 1)) return;
    
    setIsLoadingNews(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/news?page=${page}&per_page=20`);
      const data = await response.json();
      
      if (data.articles && data.articles.length > 0) {
        setNewsArticles(prev => page === 1 ? data.articles : [...prev, ...data.articles]);
        setNewsPage(page);
        if (data.articles.length < 20) {
          setHasMoreNews(false);
        }
      } else {
        setHasMoreNews(false);
      }
    } catch (err) {
      console.error('Failed to fetch news', err);
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'activity' && activityFeed.length === 0) {
      fetchActivity(1);
    }
    if (activeTab === 'news' && newsArticles.length === 0) {
      fetchNews(1);
    }
  }, [activeTab]);

  // Reset nudge when agent changes
  useEffect(() => {
    if (selectedAgent) setShowNudge(true);
  }, [selectedAgent]);

  // Load projects from localStorage on mount
  useEffect(() => {
    const uid = localStorage.getItem('studio_user_id');
    const savedProjects = localStorage.getItem('studio_agents_projects');
    let localProjects = [];
    
    if (savedProjects) {
      try {
        localProjects = JSON.parse(savedProjects);
      } catch (e) {
        console.error("Failed to parse projects", e);
      }
    }

    if (isLoggedIn && uid) {
      // Fetch from backend if logged in
      fetch(`${BACKEND_URL}/api/projects?userId=${uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.projects) {
            // Merge local and remote
            const allProjects = [...data.projects, ...localProjects];
            const uniqueProjects = Array.from(new Map(allProjects.map(item => [item.id, item])).values());
            uniqueProjects.sort((a, b) => b.id - a.id);
            setProjects(uniqueProjects);
          } else {
            setProjects(localProjects);
          }
        })
        .catch(err => {
          console.error("Failed to fetch remote projects", err);
          setProjects(localProjects);
        });
    } else {
      setProjects(localProjects);
    }
  }, [isLoggedIn]);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('studio_agents_projects', JSON.stringify(projects));
  }, [projects]);

  const handleDownload = (item) => {
    if (!item) return;
    
    // Determine the best URL to download
    const downloadUrl = item.videoUrl || item.audioUrl || item.imageUrl || 'https://via.placeholder.com/1000';
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `${item.title.replace(/\s+/g, '_')}_studio_agents`);
    link.setAttribute('target', '_blank');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // On mobile, this triggers the browser's download manager
    // which allows users to "Save to Photos" or "Save to Files"
  };

  const handleShareToFeed = (item) => {
    if (!item) return;
    
    const newActivity = {
      ...item,
      id: Date.now(),
      user: isLoggedIn ? 'Pro Creator' : 'Guest Artist',
      time: 'Just now',
      likes: 0,
      remixes: 0,
      snippet: item.snippet || `Just created this amazing ${item.type || item.agent} output in the Studio!`
    };
    
    setActivityFeed([newActivity, ...activityFeed]);
    alert('Shared to Activity Wall!');
    setActiveTab('activity');
    setPlayingItem(null);
  };

  const handleConnectSocial = (platform) => {
    const returnUrl = encodeURIComponent(window.location.href);

    if (platform === 'twitter') {
      window.location.href = `${BACKEND_URL}/api/twitter/auth?returnUrl=${returnUrl}`;
      return;
    }

    if (platform === 'instagram' || platform === 'facebook') {
      window.location.href = `${BACKEND_URL}/api/meta/auth?returnUrl=${returnUrl}`;
      return;
    }

    // Mock one-click connection for others
    setSocialConnections(prev => ({ ...prev, [platform]: true }));
    alert(`Successfully connected to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);
  };

  const handleCreateProject = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    
    const newProject = {
      id: Date.now(),
      name: `New Project ${projects.length + 1}`,
      createdAt: new Date().toISOString(),
      agent: selectedAgent ? selectedAgent.name : 'General',
      type: 'Draft',
      title: `New Project ${projects.length + 1}`,
      date: 'Just now',
      color: 'agent-purple',
      snippet: ''
    };
    
    setProjects([newProject, ...projects]);

    // Save to Backend
    const uid = localStorage.getItem('studio_user_id');
    if (uid) {
        fetch(`${BACKEND_URL}/api/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, project: newProject })
        }).catch(err => console.error("Failed to save new project to cloud", err));
    }

    alert(`Project "${newProject.name}" created and saved!`);
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    // Optimistic UI update
    setProjects(projects.filter(p => p.id !== projectId));

    if (isLoggedIn) {
      const uid = localStorage.getItem('studio_user_id');
      if (uid) {
        try {
          await fetch(`${BACKEND_URL}/api/projects/${projectId}?userId=${uid}`, {
            method: 'DELETE'
          });
        } catch (err) {
          console.error("Failed to delete from cloud", err);
          alert("Failed to delete from cloud storage, but removed locally.");
        }
      }
    }
  };

  const STUDIO_AGENTS = [
    { 
      id: 'ghost', 
      name: 'Ghostwriter', 
      category: 'Writing', 
      icon: Sparkles, 
      colorClass: 'agent-purple', 
      desc: 'AI lyricist creating bars on demand',
      capabilities: ['Full Song Structure', 'Rhyme Scheme Analysis', 'Metaphor Generator', 'Flow Mapping'],
      examples: ['Write a 16-bar verse about Brooklyn in the style of 90s boom bap', 'Create a catchy hook for a summer pop anthem'],
      howToUse: 'Enter your topic, mood, and preferred style. Use the "Genre" toggle to shift the vocabulary and rhythm. You can also provide a "Reference Artist" to mimic specific flow patterns.',
      explanation: 'Ghostwriter uses a Large Language Model (LLM) fine-tuned on millions of song lyrics across all genres. It understands rhyme schemes, syllable counts, and emotional resonance to provide lyrics that feel authentic to your chosen style.',
      helpTips: 'Pro Tip: Use the Voice-to-Text (Mic) button to dictate your ideas naturally—the AI captures the rhythm of your speech. If the lyrics feel too generic, try adding specific sensory details to your prompt.',
      onboarding: [
        "Select a genre and mood to set the creative direction and vocabulary set.",
        "Provide a 'Seed Phrase' or topic for the AI to expand upon into full verses.",
        "Use the 'Refine' button to iterate on specific lines, adjusting for rhyme density and metaphor complexity.",
        "Export your lyrics with a 'Flow Map' that suggests rhythmic placement for each syllable."
      ]
    },
    { 
      id: 'beat', 
      name: 'Beat Lab', 
      category: 'Production', 
      icon: Zap, 
      colorClass: 'agent-cyan', 
      desc: 'Generate production ideas instantly',
      capabilities: ['Drum Pattern MIDI', 'Chord Progression Logic', 'Sample Sourcing', 'BPM Matching'],
      examples: ['Generate a dark trap drum pattern at 140 BPM', 'Suggest a jazz-infused chord progression for a lo-fi beat'],
      howToUse: 'Select your target BPM and genre. The AI will provide MIDI patterns, instrument suggestions, and even source royalty-free samples that match your vibe.',
      explanation: 'Beat Lab combines algorithmic composition with a massive library of curated samples. It doesn\'t just "guess" what sounds good; it follows music theory principles to ensure your drums and chords are harmonically and rhythmically locked.',
      helpTips: 'Use the "BPM Matching" feature to ensure your generated patterns fit perfectly into your existing project. If a pattern is too busy, lower the "Intensity" slider to simplify the rhythm.',
      onboarding: [
        "Select your target BPM and genre to initialize the rhythmic engine.",
        "Generate a 'Foundation' (Drums & Bass) and then layer 'Atmospherics' (Pads & Leads).",
        "Use the 'Variation' slider to create bridge and chorus transitions automatically.",
        "Export the MIDI and Sample pack directly to your DAW for final arrangement."
      ]
    },
    { 
      id: 'album', 
      name: 'Album Artist', 
      category: 'Visual', 
      icon: Music, 
      colorClass: 'agent-orange', 
      desc: 'Create stunning album artwork with AI',
      capabilities: ['Cover Art Generation', 'Social Media Kits', 'Typography Design', 'Brand Palette Creator'],
      examples: ['Create a psychedelic cover for a synth-wave album', 'Design a minimalist logo for an indie folk artist'],
      howToUse: 'Describe the visual mood of your music. Specify colors, textures, and artistic styles (e.g., "Oil Painting", "3D Render", "Vector Art") for more accurate results.',
      explanation: 'Album Artist is powered by Imagen 3, Google\'s most advanced image generation model. It translates your musical descriptions into high-fidelity visual art, optimized for digital streaming platforms and physical printing.',
      helpTips: 'Be specific about the "Lighting" and "Composition" in your prompt (e.g., "cinematic lighting", "top-down view"). Use the "Remix" button to iterate on a specific version you like.',
      onboarding: [
        "Describe the visual mood and core themes of your music project.",
        "Specify a color palette and texture (e.g., 'Grainy', 'Glossy', 'Distressed').",
        "Generate 4 variations and use the 'Remix' tool to combine elements from different versions.",
        "Download the 'Social Kit' which includes pre-sized assets for Instagram, Spotify, and YouTube."
      ]
    },
    { 
      id: 'video-creator', 
      name: 'Video Creator', 
      category: 'Video', 
      icon: PlayCircle, 
      colorClass: 'agent-red', 
      desc: 'Generate cinematic videos with Veo 3',
      capabilities: ['Music Video Generation', 'Visualizer Creation', 'Cinematic Scenes', 'Style Transfer'],
      examples: ['Create a cyberpunk city flyover for a synthwave track', 'Generate a slow-motion rain scene for a lo-fi beat'],
      howToUse: 'Describe the scene, camera movement, and lighting. The AI will generate a high-quality video clip.',
      explanation: 'Video Creator is powered by Veo 3, Google\'s state-of-the-art video generation model. It understands cinematic language and physics to create realistic or stylized video content.',
      helpTips: 'Be specific about camera angles (e.g., "drone shot", "close-up") and lighting. Mention the mood and color palette.',
      onboarding: [
        "Describe the scene and action.",
        "Specify the camera movement and lighting.",
        "Generate a video clip.",
        "Download and use in your music video."
      ]
    },
    { 
      id: 'trend', 
      name: 'Trend Hunter', 
      category: 'Research', 
      icon: Target, 
      colorClass: 'agent-emerald', 
      hasSocials: true,
      desc: 'Discover what\'s hot right now',
      capabilities: ['Viral Sound Analysis', 'Hashtag Strategy', 'Competitor Tracking', 'Niche Discovery'],
      examples: ['What are the trending sounds on TikTok for R&B right now?', 'Find emerging micro-genres in the UK underground scene'],
      howToUse: 'Ask about specific platforms, regions, or genres to get tailored market intelligence. The AI scans real-time social data to find "Early Signal" trends.',
      explanation: 'Trend Hunter uses real-time API hooks into major social platforms and streaming services. It analyzes velocity, sentiment, and engagement patterns to predict which sounds and aesthetics are about to break through.',
      helpTips: 'Check the "Niche Discovery" section for low-competition, high-growth opportunities. Use the "Viral Trigger" analysis to see exactly which part of a song is driving its success.',
      onboarding: [
        "Define your niche or target audience (e.g., 'Hyperpop fans in Berlin').",
        "Analyze 'Viral Triggers'—specific sounds or themes currently gaining traction.",
        "Generate a 'Trend Report' with actionable steps to incorporate these elements into your next track.",
        "Set up 'Alerts' to be notified when a new sound in your genre starts to trend."
      ]
    },
    { 
      id: 'collab', 
      name: 'Collab Connect', 
      category: 'Networking', 
      icon: Users, 
      colorClass: 'agent-indigo', 
      hasSocials: true,
      desc: 'Find the perfect collaborators',
      capabilities: ['Artist Matching', 'Producer Outreach', 'Session Musician Search', 'Contract Templates'],
      examples: ['Find a female vocalist with a raspy voice for a rock track', 'Connect with mixing engineers specializing in Dolby Atmos'],
      howToUse: 'Define your project needs, budget, and "Vibe Match." The AI will scan global databases and social platforms for the best creative matches.',
      explanation: 'Collab Connect uses a proprietary "Creative DNA" matching algorithm. It looks beyond just "genre" and analyzes the sonic characteristics of an artist\'s previous work to find the most compatible partners for your specific project.',
      helpTips: 'Upload a "Reference Track" that represents the sound you are going for; this significantly improves the accuracy of the artist matches. Use the "Budget" filter to find collaborators within your range.',
      onboarding: [
        "Upload a demo or snippet of your project to help the AI understand the 'Vibe'.",
        "Specify the type of collaborator you need (Vocalist, Producer, Engineer, etc.).",
        "Review the 'Match Score' for each candidate based on their previous work and style.",
        "Use the 'Contract Generator' to create a simple split-sheet or work-for-hire agreement."
      ]
    },
    { 
      id: 'release', 
      name: 'Release Manager', 
      category: 'Strategy', 
      icon: Rocket, 
      colorClass: 'agent-pink', 
      hasSocials: true,
      desc: 'Strategic release planning AI',
      capabilities: ['Rollout Timelines', 'Pitching Guides', 'Budget Allocation', 'Distribution Checklist'],
      examples: ['Create a 4-week rollout plan for a debut single', 'How should I allocate a $500 marketing budget?'],
      howToUse: 'Input your release date and goals. The AI generates a day-by-day checklist, including pitching templates for Spotify Editorial and press outlets.',
      explanation: 'Release Manager is a strategic engine built on data from thousands of successful independent releases. It optimizes your timeline based on platform algorithms and industry "best practices" for maximum visibility.',
      helpTips: 'Start your rollout at least 6 weeks in advance to give the Spotify editorial team enough time to review your pitch. Use the "Pitching Guide" to avoid common mistakes in your curator messages.',
      onboarding: [
        "Input your release date and primary goal (e.g., 'Maximize Streams' or 'Build Mailing List').",
        "Generate a 'Rollout Calendar' starting 6 weeks before the release date.",
        "Use the 'Pitching Assistant' to draft personalized messages for playlist curators and blogs.",
        "Follow the 'Launch Day' checklist to ensure all links and assets are live and working."
      ]
    },
    { 
      id: 'master', 
      name: 'Mastering Lab', 
      category: 'Engineering', 
      icon: Shield, 
      colorClass: 'agent-purple', 
      desc: 'Professional AI audio engineering',
      capabilities: ['LUFS Normalization', 'Stereo Widening', 'EQ Balancing', 'Multi-format Export'],
      examples: ['Master this track for Spotify standards (-14 LUFS)', 'Add warmth and analog saturation to the master chain'],
      howToUse: 'Upload your final mix (WAV or AIFF). Select your target platform and the AI will apply professional-grade processing tailored to that platform\'s specs.',
      explanation: 'Mastering Lab uses a neural network trained by world-class mastering engineers. It analyzes the frequency spectrum, dynamic range, and stereo image of your mix, applying precise adjustments to ensure it sounds professional on any system.',
      helpTips: 'Ensure your mix has at least -6dB of headroom (no clipping) before uploading. If the master sounds too "squashed," try lowering the "Intensity" slider to preserve more dynamic range.',
      onboarding: [
        "Upload your final mix, ensuring you have at least -6dB of headroom.",
        "Select a 'Reference Track' to give the AI a target sonic profile.",
        "Choose your 'Mastering Style' (e.g., 'Transparent', 'Warm', 'Aggressive').",
        "A/B test the master against your original mix before downloading the final high-res files."
      ]
    },
    { 
      id: 'social', 
      name: 'Social Pilot', 
      category: 'Marketing', 
      icon: Globe, 
      colorClass: 'agent-cyan', 
      hasSocials: true,
      desc: 'Automated social media growth',
      capabilities: ['Caption Generation', 'Post Scheduling', 'Engagement Automation', 'Analytics Reporting'],
      examples: ['Write 5 engaging captions for my upcoming music video teaser', 'When is the best time to post on Instagram for my audience?'],
      howToUse: 'Connect your accounts and let the AI handle the heavy lifting of content creation, hashtag optimization, and optimal posting times.',
      explanation: 'Social Pilot is a marketing automation engine that uses sentiment analysis and engagement data to craft content that resonates. It understands the specific "culture" of each platform (TikTok vs. Instagram vs. X) and adapts your voice accordingly.',
      helpTips: 'Use the "Caption Generator" to create multiple variations of a post and A/B test them to see which one performs better. Connect your Spotify account to automatically generate "New Release" alerts.',
      onboarding: [
        "Connect your social media accounts and define your 'Brand Voice'.",
        "Generate a week's worth of content (captions, hashtags, and story ideas) in seconds.",
        "Schedule posts for 'Peak Engagement' times based on your specific audience data.",
        "Review the 'Growth Report' to see which types of content are driving the most new followers."
      ]
    },
    { 
      id: 'instrument', 
      name: 'Instrumentalist', 
      category: 'Performance', 
      icon: Music, 
      colorClass: 'agent-indigo', 
      isPro: true,
      desc: 'AI-driven virtual session players',
      capabilities: ['Solo Generation', 'Rhythm Section AI', 'Style Mimicry', 'Multi-instrumental'],
      examples: ['Generate a bluesy guitar solo over an A minor backing track', 'Create a funky bassline for a disco beat'],
      howToUse: 'Select your instrument and style. The AI will generate a performance that fits your track\'s key and tempo.',
      explanation: 'Instrumentalist uses physical modeling and performance capture data to simulate real session players. It doesn\'t just play notes; it understands the nuances of "touch," "vibrato," and "swing" that make a performance feel human.',
      helpTips: 'Use the "Style Mimicry" feature to have the AI play in the style of a specific legendary musician. If the performance is too complex, use the "Intensity" slider to dial it back.',
      onboarding: ["Select your instrument.", "Choose a playing style.", "Generate and refine."]
    },
    { 
      id: 'beat-arch', 
      name: 'Beat Architect', 
      category: 'Production', 
      icon: Zap, 
      colorClass: 'agent-pink', 
      isPro: true,
      desc: 'Advanced drum machine and rhythm generator',
      capabilities: ['Custom Kit Design', 'Polyrhythmic Patterns', 'Velocity Humanization', 'Stem Export'],
      examples: ['Create a complex polyrhythmic drum pattern for a techno track', 'Design a custom drum kit using industrial sounds'],
      howToUse: 'Build your kit and sequence your patterns. Use the humanization tools to add a natural feel to your beats.',
      explanation: 'Beat Architect is a generative rhythm engine that uses "Evolutionary Algorithms" to create unique patterns. It analyzes the relationship between different drum elements (kick, snare, hat) to ensure a cohesive and driving groove.',
      helpTips: 'Use the "Velocity Humanization" tool to add subtle variations to each hit, making the beat feel less "robotic." Export your stems to have full control over the mix in your DAW.',
      onboarding: ["Build your kit.", "Sequence patterns.", "Humanize and export."]
    },
    { 
      id: 'sample-master', 
      name: 'Sample Master', 
      category: 'Sampling', 
      icon: Folder, 
      colorClass: 'agent-orange', 
      isPro: true,
      desc: 'Intelligent sampling and loop manipulation',
      capabilities: ['Auto-chopping', 'Time-stretching', 'Pitch-shifting', 'Loop Discovery'],
      examples: ['Chop this soul sample into 16 pads', 'Time-stretch this loop to 120 BPM without changing pitch'],
      howToUse: 'Upload your sample and let the AI analyze it. Use the chopping and manipulation tools to create something new.',
      explanation: 'Sample Master uses "Source Separation" and "Transient Detection" to intelligently identify the best parts of a sample. It can isolate vocals, drums, or instruments from a full track, giving you unprecedented sampling freedom.',
      helpTips: 'Use the "Auto-chopping" feature to quickly find the most rhythmic slices of a sample. If you are getting artifacts during time-stretching, try the "High Fidelity" mode for a cleaner sound.',
      onboarding: ["Upload sample.", "Analyze and chop.", "Manipulate and loop."]
    },
    { 
      id: 'drop-zone', 
      name: 'Drop Zone', 
      category: 'Production', 
      icon: Rocket, 
      colorClass: 'agent-red', 
      isPro: true,
      desc: 'High-energy EDM and Trap drop generator',
      capabilities: ['Build-up Logic', 'Drop Synthesis', 'FX Layering', 'Energy Mapping'],
      examples: ['Generate a high-energy dubstep drop', 'Create a tension-filled build-up for a house track'],
      howToUse: 'Define your energy levels and style. The AI will generate a complete build-up and drop sequence.',
      explanation: 'Drop Zone is a specialized synthesis engine designed for high-impact transitions. It uses "Energy Mapping" to ensure that the tension of the build-up perfectly resolves into the power of the drop.',
      helpTips: 'Use the "FX Layering" tool to add white noise, risers, and impacts that glue the transition together. Experiment with the "Drop Synthesis" to create unique, never-before-heard lead sounds.',
      onboarding: ["Define energy.", "Generate build-up.", "Create the drop."]
    },
    { 
      id: 'score-edit', 
      name: 'Score Editor', 
      category: 'Scoring', 
      icon: Book, 
      colorClass: 'agent-emerald', 
      isPro: true,
      desc: 'Precision scoring for film and media',
      capabilities: ['Sheet Music Export', 'Orchestral Layering', 'Tempo Mapping', 'Dynamic Marking'],
      examples: ['Score a dramatic orchestral piece for a short film', 'Export this melody as a lead sheet'],
      howToUse: 'Compose your score using the AI assistant. Export as MIDI or sheet music for live performance or further editing.',
      explanation: 'Score Editor is a notation-aware AI that understands the rules of counterpoint, harmony, and orchestration. It can take a simple melody and expand it into a full orchestral arrangement while maintaining musical logic.',
      helpTips: 'Use the "Dynamic Marking" tool to add expression and emotion to your score. If you are writing for live players, use the "Sheet Music Export" to generate professional-grade parts.',
      onboarding: ["Compose melody.", "Layer orchestration.", "Export sheet music."]
    },
    { 
      id: 'video-scorer', 
      name: 'Video Scorer', 
      category: 'Video', 
      icon: PlayCircle, 
      colorClass: 'agent-cyan', 
      isPro: true,
      desc: 'Upload video and AI generates the soundtrack',
      capabilities: ['Scene Detection', 'Emotional Mapping', 'Sync-point Logic', 'Multi-genre Scoring'],
      examples: ['Score this 30-second commercial with upbeat pop', 'Create a haunting soundscape for this horror movie clip'],
      howToUse: 'Upload your video file. The AI will analyze the scenes and generate a soundtrack that perfectly matches the visuals.',
      explanation: 'Video Scorer uses "Computer Vision" to identify key emotional beats and scene changes in your video. It then uses "Sync-point Logic" to ensure that musical transitions happen exactly when the visual action does.',
      helpTips: 'Upload a video with clear "Cuts" to help the AI identify scene changes more accurately. Use the "Emotional Mapping" tool to shift the mood of the music from "Tense" to "Triumphant" in real-time.',
      onboarding: ["Upload video.", "Analyze scenes.", "Generate score."]
    },
    { 
      id: 'vocal-arch', 
      name: 'Vocal Architect', 
      category: 'Vocals', 
      icon: Users, 
      colorClass: 'agent-purple', 
      isPro: true,
      desc: 'AI vocal synthesis and harmony generation',
      capabilities: ['Vocal Synthesis', 'Harmony Logic', 'Ad-lib Generation', 'Tuning & Correction'],
      examples: ['Generate a 3-part harmony for this vocal line', 'Create a soulful vocal ad-lib for the chorus'],
      howToUse: 'Input your lyrics and melody. The AI will generate a vocal performance with customizable tone and expression.',
      explanation: 'Vocal Architect is a state-of-the-art "Neural Vocoder" that can synthesize human-like singing from text and MIDI. It understands the nuances of "Breath," "Diction," and "Vibrato," allowing for incredibly realistic vocal performances.',
      helpTips: 'Use the "Harmony Logic" tool to automatically generate backing vocals that follow your lead melody. If the vocal sounds too "clean," use the "Tuning & Correction" tool to add subtle human imperfections.',
      onboarding: ["Input lyrics.", "Define melody.", "Synthesize vocals."]
    },
    { 
      id: 'sound-design', 
      name: 'Sound Designer', 
      category: 'Engineering', 
      icon: Shield, 
      colorClass: 'agent-blue', 
      isPro: true,
      desc: 'Custom synth patch and texture creation',
      capabilities: ['Wavetable Synthesis', 'Texture Layering', 'Modulation Mapping', 'Preset Export'],
      examples: ['Design a gritty bass patch for a dark techno track', 'Create an ethereal pad texture with granular synthesis'],
      howToUse: 'Use the AI to explore new sonic territories. Generate custom patches and textures for your favorite synths.',
      explanation: 'Sound Designer is a "Cross-Modal" synthesis engine that can translate descriptive words into complex synth parameters. It understands the relationship between "Timbre" and "Emotion," allowing you to "describe" the sound you want.',
      helpTips: 'Use specific descriptive words like "Gritty," "Ethereal," or "Metallic" to get more accurate synth patches. Export your presets in "Wavetable" format to use them in popular synths like Serum or Vital.',
      onboarding: ["Select synthesis type.", "Generate texture.", "Export preset."]
    }
  ];

  const renderContent = () => {
    if (activeTab === 'mystudio') {
      return (
        <div className="studio-dashboard animate-fadeInUp">
          <div className="dashboard-welcome-banner">
            <div className="banner-content">
              <div className="banner-text">
                <h1>Welcome back, {isLoggedIn ? 'Pro Creator' : 'Artist'}</h1>
                <p>Your AI studio is synchronized and ready for your next hit.</p>
              </div>
              <div className="banner-actions">
                <button 
                  className={`voice-command-btn haptic-press ${isListening ? 'active' : ''}`}
                  onClick={handleVoiceToText}
                >
                  <Mic size={20} />
                  <span>{isListening ? 'Listening...' : 'Voice Command'}</span>
                </button>
                <button 
                  className="btn-refresh-glow haptic-press"
                  onClick={() => {
                    handleTextToVoice("Synchronizing your AI ecosystem...");
                    alert("Ecosystem synchronized successfully!");
                  }}
                >
                  <RefreshCw size={18} /> 
                  <span>Sync Ecosystem</span>
                </button>
              </div>
            </div>
            <div className="banner-stats-mini">
              <div className="mini-stat">
                <Zap size={14} className="text-cyan" />
                <span>8.4k Credits</span>
              </div>
              <div className="mini-stat">
                <Shield size={14} className="text-purple" />
                <span>Pro Verified</span>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Stats Section */}
            <section className="dashboard-card stats-card">
              <div className="card-header">
                <h3><BarChart3 size={18} /> Performance Overview</h3>
                <PieChart size={18} className="text-muted" />
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">16</span>
                  <span className="stat-label">Active Agents</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">124</span>
                  <span className="stat-label">Creations</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">42</span>
                  <span className="stat-label">Social Posts</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">8.2k</span>
                  <span className="stat-label">Total Reach</span>
                </div>
              </div>
            </section>

            {/* Social Connections */}
            <section className="dashboard-card">
              <div className="card-header">
                <h3><Share2 size={18} /> Social Ecosystem</h3>
                <span className="status-badge online">Live</span>
              </div>
              <div className="connection-list">
                <div className="connection-item">
                  <div className="connection-info">
                    <div className="icon-box twitter-bg">
                      <Twitter size={20} />
                    </div>
                    <div>
                      <p className="connection-name">X (Twitter)</p>
                      <p className="connection-status">{socialConnections.twitter ? `@${twitterUsername || 'Connected'}` : 'Not Connected'}</p>
                    </div>
                  </div>
                  <button 
                    className={`btn-connect ${socialConnections.twitter ? 'connected' : ''}`}
                    onClick={() => handleConnectSocial('twitter')}
                  >
                    {socialConnections.twitter ? 'Manage' : 'Connect'}
                  </button>
                </div>
                <div className="connection-item">
                  <div className="connection-info">
                    <div className="icon-box instagram-bg">
                      <Instagram size={20} />
                    </div>
                    <div>
                      <p className="connection-name">Instagram</p>
                      <p className="connection-status">{socialConnections.instagram ? (metaName || 'Connected') : 'Not Connected'}</p>
                    </div>
                  </div>
                  <button 
                    className={`btn-connect ${socialConnections.instagram ? 'connected' : ''}`}
                    onClick={() => handleConnectSocial('instagram')}
                  >
                    {socialConnections.instagram ? 'Manage' : 'Connect'}
                  </button>
                </div>
                <div className="connection-item">
                  <div className="connection-info">
                    <div className="icon-box facebook-bg">
                      <Facebook size={20} />
                    </div>
                    <div>
                      <p className="connection-name">Facebook</p>
                      <p className="connection-status">{socialConnections.facebook ? (metaName || 'Connected') : 'Not Connected'}</p>
                    </div>
                  </div>
                  <button 
                    className={`btn-connect ${socialConnections.facebook ? 'connected' : ''}`}
                    onClick={() => handleConnectSocial('facebook')}
                  >
                    {socialConnections.facebook ? 'Manage' : 'Connect'}
                  </button>
                </div>
              </div>
            </section>

            {/* Storage Connections */}
            <section className="dashboard-card">
              <div className="card-header">
                <h3><Database size={18} /> Cloud Storage</h3>
                <span className="storage-usage">72% Full</span>
              </div>
              <div className="connection-list">
                <div className="connection-item">
                  <div className="connection-info">
                    <div className="icon-box storage-bg">
                      <HardDrive size={20} />
                    </div>
                    <div>
                      <p className="connection-name">Google Drive</p>
                      <p className="connection-status">{storageConnections.googleDrive ? 'Connected' : 'Disconnected'}</p>
                    </div>
                  </div>
                  <button 
                    className={`btn-connect ${storageConnections.googleDrive ? 'connected' : ''}`}
                    onClick={() => setStorageConnections(prev => ({ ...prev, googleDrive: !prev.googleDrive }))}
                  >
                    {storageConnections.googleDrive ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
                <div className="connection-item">
                  <div className="connection-info">
                    <div className="icon-box storage-bg">
                      <HardDrive size={20} />
                    </div>
                    <div>
                      <p className="connection-name">Dropbox</p>
                      <p className="connection-status">{storageConnections.dropbox ? 'Connected' : 'Disconnected'}</p>
                    </div>
                  </div>
                  <button 
                    className={`btn-connect ${storageConnections.dropbox ? 'connected' : ''}`}
                    onClick={() => setStorageConnections(prev => ({ ...prev, dropbox: !prev.dropbox }))}
                  >
                    {storageConnections.dropbox ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </section>

            {/* Agents Widget */}
            <section className="dashboard-card agents-widget">
              <div className="card-header">
                <h3><LayoutGrid size={18} /> Quick Launch Agents</h3>
                <button className="text-link" onClick={() => setActiveTab('agents')}>View All</button>
              </div>
              <div className="agents-mini-list">
                {STUDIO_AGENTS.slice(0, 3).map(agent => {
                  const Icon = agent.icon;
                  return (
                    <div key={agent.id} className="agent-mini-item" onClick={() => setSelectedAgent(agent)}>
                      <div className={`agent-mini-icon ${agent.colorClass}`}>
                        <Icon size={18} />
                      </div>
                      <div className="agent-mini-info">
                        <p className="agent-mini-name">{agent.name}</p>
                        <p className="agent-mini-cat">{agent.category}</p>
                      </div>
                      <ArrowRight size={14} className="mini-arrow" />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Billing & Payments Section */}
            <section className="dashboard-card billing-card full-width-card">
              <div className="card-header">
                <h3><CreditCard size={18} /> Billing & Payments</h3>
                <div className="plan-badge">PRO PLAN</div>
              </div>
              
              <div className="billing-dashboard-layout">
                <div className="billing-main-info">
                  <div className="billing-row">
                    <span>Next billing date</span>
                    <strong>Oct 24, 2024</strong>
                  </div>
                  <div className="billing-row">
                    <span>Monthly Amount</span>
                    <strong>$49.00</strong>
                  </div>
                  <div className="billing-actions">
                    <button className="btn-primary-glow">Manage Subscription</button>
                    <button className="btn-outline">View Invoices</button>
                  </div>
                </div>

                <div className="payment-methods-section">
                  <h4>Saved Payment Methods</h4>
                  <div className="payment-methods-list">
                    {paymentMethods.map(pm => (
                      <div key={pm.id} className="payment-method-item">
                        <div className="pm-info">
                          <CreditCard size={16} />
                          <span>{pm.type} ending in {pm.last4}</span>
                          {pm.isDefault && <span className="default-badge">Default</span>}
                        </div>
                        <button className="btn-text-sm">Edit</button>
                      </div>
                    ))}
                    {bankAccounts.map(ba => (
                      <div key={ba.id} className="payment-method-item">
                        <div className="pm-info">
                          <Database size={16} />
                          <span>{ba.bankName} (****{ba.last4})</span>
                        </div>
                        <button className="btn-text-sm">Edit</button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="add-payment-options">
                    <button className="btn-add-pm" onClick={() => setShowAddPaymentModal(true)}>
                      <Zap size={14} /> Add Card / Bank
                    </button>
                  </div>

                  <div className="external-payments-grid">
                    <p className="small-label">Supported Providers</p>
                    <div className="provider-icons">
                      <div className="provider-chip stripe">Stripe</div>
                      <div className="provider-chip venmo">Venmo</div>
                      <div className="provider-chip affirm">Affirm</div>
                      <div className="provider-chip shoppay">Shop Pay</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      );
    }

    if (selectedAgent) {
      const Icon = selectedAgent.icon;
      return (
        <div className="agent-active-view animate-fadeInUp" style={{ position: 'relative' }}>
          {/* Onboarding Nudge */}
          {showNudge && selectedAgent.onboarding && (
            <div className="agent-nudge-overlay animate-fadeInRight">
              <div className="nudge-header">
                <h4><Sparkles size={16} /> Quick Start Guide</h4>
                <button className="nudge-close" onClick={() => setShowNudge(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="nudge-steps">
                {selectedAgent.onboarding.map((step, idx) => (
                  <div key={idx} className="nudge-step">
                    <span className="step-num">{idx + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
              <div className="nudge-footer">
                <button className="nudge-cta" onClick={() => setShowNudge(false)}>
                  Got it, let's go!
                </button>
              </div>
            </div>
          )}

          <button 
            className="back-to-grid" 
            onClick={() => setSelectedAgent(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', marginBottom: '2rem' }}
          >
            <ArrowLeft size={20} />
            <span>Back to Agents</span>
          </button>

          <div className="agent-detail-layout">
            <div className="agent-main-panel">
              <div className="agent-hero-card">
                <div className={`agent-icon-large ${selectedAgent.colorClass}`}>
                  <Icon size={40} />
                </div>
                <div className="agent-hero-info">
                  <span className="agent-badge">{selectedAgent.category}</span>
                  <h2>{selectedAgent.name}</h2>
                  <p>{selectedAgent.desc}</p>
                </div>
              </div>

              <div className="agent-utility-box">
                <div className="utility-controls">
                  <div className="control-group">
                    <label>Genre / Style</label>
                    <select className="studio-select">
                      <option>Hip Hop / Rap</option>
                      <option>Pop / Modern</option>
                      <option>R&B / Soul</option>
                      <option>Electronic / Dance</option>
                      <option>Rock / Alternative</option>
                      <option>Lo-Fi / Chill</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Intensity / Mood</label>
                    <input type="range" className="studio-slider" min="1" max="10" defaultValue="5" />
                  </div>
                </div>

                <div className="prompt-area">
                  <div className="prompt-header">
                    <label>Creative Prompt</label>
                    <div className="voice-controls">
                      {voiceSettings.language !== 'English' && (
                        <button 
                          className="voice-btn translate-btn"
                          onClick={handleTranslatePrompt}
                          title="Translate to English"
                        >
                          <Languages size={16} />
                        </button>
                      )}
                      <button 
                        className={`voice-btn ${isListening ? 'active' : ''}`} 
                        onClick={handleVoiceToText}
                        title="Voice to Text"
                      >
                        <Mic size={16} />
                      </button>
                      <button 
                        className={`voice-btn ${isSpeaking ? 'active' : ''}`} 
                        onClick={handleTextToVoice}
                        title="Text to Voice"
                      >
                        <Volume2 size={16} />
                      </button>
                      
                      <div className="voice-settings-container">
                        <button 
                          className={`voice-btn ${showVoiceHelp ? 'active' : ''}`}
                          onClick={() => {
                            setShowVoiceHelp(!showVoiceHelp);
                            setShowVoiceSettings(false);
                          }}
                          title="How to use Voice Controls"
                        >
                          <HelpCircle size={16} />
                        </button>
                        
                        {showVoiceHelp && (
                          <div className="voice-settings-dropdown animate-fadeInUp" style={{ width: '280px', right: '40px' }}>
                            <div className="settings-group">
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mic size={14} className="text-purple" /> Voice to Text
                              </label>
                              <p className="help-text small" style={{ marginTop: '4px' }}>
                                Click the microphone to dictate your prompt. Speak clearly. Click again to stop.
                              </p>
                            </div>
                            <div className="settings-group">
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Volume2 size={14} className="text-cyan" /> Text to Voice
                              </label>
                              <p className="help-text small" style={{ marginTop: '4px' }}>
                                Click the speaker to hear the AI read the current text. Useful for reviewing lyrics.
                              </p>
                            </div>
                            <div className="settings-group">
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={14} /> Settings
                              </label>
                              <p className="help-text small" style={{ marginTop: '4px' }}>
                                Customize the AI voice gender, accent (US/UK/AU), and language.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="voice-settings-container">
                        <button 
                          className={`voice-btn ${showVoiceSettings ? 'active' : ''}`}
                          onClick={() => {
                            setShowVoiceSettings(!showVoiceSettings);
                            setShowVoiceHelp(false);
                          }}
                          title="Voice Settings"
                        >
                          <Settings size={16} />
                        </button>
                        
                        {showVoiceSettings && (
                          <div className="voice-settings-dropdown animate-fadeInUp">
                            <div className="settings-group">
                              <label>Voice Gender</label>
                              <div className="settings-toggle">
                                <button 
                                  className={voiceSettings.gender === 'male' ? 'active' : ''}
                                  onClick={() => setVoiceSettings({...voiceSettings, gender: 'male'})}
                                >
                                  Male
                                </button>
                                <button 
                                  className={voiceSettings.gender === 'female' ? 'active' : ''}
                                  onClick={() => setVoiceSettings({...voiceSettings, gender: 'female'})}
                                >
                                  Female
                                </button>
                              </div>
                            </div>
                            <div className="settings-group">
                              <label>Region / Accent</label>
                              <select 
                                value={voiceSettings.region}
                                onChange={(e) => setVoiceSettings({...voiceSettings, region: e.target.value})}
                                className="settings-select"
                              >
                                <option value="US">United States</option>
                                <option value="UK">United Kingdom</option>
                                <option value="AU">Australia</option>
                                <option value="IN">India</option>
                              </select>
                            </div>
                            <div className="settings-group">
                              <label>Preferred Language</label>
                              <div className="language-search">
                                <Languages size={14} />
                                <select 
                                  value={voiceSettings.language}
                                  onChange={(e) => setVoiceSettings({...voiceSettings, language: e.target.value})}
                                  className="settings-select"
                                >
                                  <option value="English">English</option>
                                  <option value="Spanish">Spanish</option>
                                  <option value="French">French</option>
                                  <option value="German">German</option>
                                  <option value="Japanese">Japanese</option>
                                  <option value="Chinese">Chinese</option>
                                </select>
                              </div>
                            </div>
                            <p className="settings-info">AI will automatically translate prompts to {voiceSettings.language}.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <textarea 
                    placeholder={`Describe what you want ${selectedAgent.name} to create...`}
                    className="studio-textarea"
                  ></textarea>
                  
                  <div className="generation-actions">
                    <button 
                      className="cta-button-secondary"
                      onClick={() => alert('Generating real-time preview...')}
                    >
                      <Play size={16} />
                      Preview
                    </button>
                    <button 
                      className={`cta-button-premium ${isGenerating ? 'loading' : ''}`} 
                      style={{ flex: 1 }}
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="spinner-mini"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={18} />
                          <span>Generate {selectedAgent.name}</span>
                        </>
                      )}
                    </button>
                    <button 
                      className="cta-button-secondary"
                      onClick={() => setShowExternalSaveModal(true)}
                      title="Save to Cloud Storage"
                    >
                      <Cloud size={18} />
                    </button>
                  </div>
                  
                  <p className="studio-disclaimer">
                    <Shield size={12} />
                    AI-generated content may require manual review for platform compliance.
                  </p>
                </div>
              </div>

              <div className="agent-history-section">
                <h3>Recent Creations</h3>
                <div className="history-grid">
                  {projects.filter(p => p.agent === selectedAgent.name).length > 0 ? (
                    projects.filter(p => p.agent === selectedAgent.name).slice(0, 2).map((item) => (
                      <div 
                        key={item.id} 
                        className="history-item"
                        onClick={() => {
                          if (item.imageUrl || item.videoUrl) {
                            setActiveTab('hub');
                          } else {
                            const textarea = document.querySelector('.studio-textarea');
                            if (textarea) textarea.value = item.snippet;
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                        title={item.imageUrl || item.videoUrl ? "View in Hub" : "Load text to editor"}
                      >
                        <div className="history-preview" style={{ 
                          backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                          backgroundColor: item.imageUrl ? 'transparent' : 'var(--card-bg)'
                        }}>
                          {!item.imageUrl && <div style={{ padding: '5px', fontSize: '8px', overflow: 'hidden' }}>{item.snippet?.substring(0, 50)}</div>}
                        </div>
                        <div className="history-meta">
                          <p className="history-title">{item.title}</p>
                          <p className="history-date">{new Date(item.id).toLocaleDateString()}</p>
                        </div>
                        <button 
                          className="history-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('hub');
                          }}
                          title="Go to Hub"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="history-item empty">
                      <div className="history-meta">
                        <p className="history-title">No recent history</p>
                        <p className="history-date">Create something new!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="agent-side-panel">
              {selectedAgent.hasSocials && (
                <div className="side-info-card social-connect-card">
                  <h3>Connect Socials</h3>
                  <div className="social-connect-grid">
                    <button 
                      className={`social-connect-btn ${socialConnections.instagram ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('instagram')}
                    >
                      <Globe size={16} />
                      <span>{socialConnections.instagram ? (metaName ? `Insta: ${metaName}` : 'Instagram Linked') : 'Link Instagram'}</span>
                    </button>
                    <button 
                      className={`social-connect-btn ${socialConnections.facebook ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('facebook')}
                    >
                      <Zap size={16} />
                      <span>{socialConnections.facebook ? (metaName ? `FB: ${metaName}` : 'Facebook Linked') : 'Link Facebook'}</span>
                    </button>
                    <button 
                      className={`social-connect-btn ${socialConnections.tiktok ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('tiktok')}
                    >
                      <Zap size={16} />
                      <span>{socialConnections.tiktok ? 'TikTok Linked' : 'Link TikTok'}</span>
                    </button>
                    <button 
                      className={`social-connect-btn ${socialConnections.twitter ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('twitter')}
                    >
                      <MessageSquare size={16} />
                      <span>{socialConnections.twitter ? (twitterUsername ? `@${twitterUsername}` : 'X/Twitter Linked') : 'Link X/Twitter'}</span>
                    </button>
                    {(selectedAgent.id === 'collab' || selectedAgent.id === 'release') && (
                      <button 
                        className={`social-connect-btn ${socialConnections.spotify ? 'connected' : ''}`}
                        onClick={() => handleConnectSocial('spotify')}
                      >
                        <Music size={16} />
                        <span>{socialConnections.spotify ? 'Spotify Linked' : 'Link Spotify'}</span>
                      </button>
                    )}
                  </div>
                  <p className="help-text mini">One-click secure OAuth connection.</p>
                </div>
              )}

              <div className="side-info-card">
                <h3>Capabilities</h3>
                <ul className="capability-list">
                  {selectedAgent.capabilities.map((cap, i) => (
                    <li key={i}><Sparkles size={14} /> {cap}</li>
                  ))}
                </ul>
              </div>

              <div className="side-info-card">
                <h3>How to Use</h3>
                <p className="help-text">{selectedAgent.howToUse}</p>
              </div>

              <div className="side-info-card agent-intelligence-card">
                <div className="card-header-with-icon">
                  <HelpCircle size={18} className="text-purple" />
                  <h3>Agent Intelligence</h3>
                </div>
                <div className="intelligence-content">
                  <div className="intel-section">
                    <h4>The "How"</h4>
                    <p className="help-text small">{selectedAgent.explanation}</p>
                  </div>
                  <div className="intel-section">
                    <h4>Pro Tips</h4>
                    <p className="help-text small">{selectedAgent.helpTips}</p>
                  </div>
                </div>
              </div>

              <div className="side-info-card">
                <h3>Examples</h3>
                <div className="example-chips">
                  {selectedAgent.examples.map((ex, i) => (
                    <div 
                      key={i} 
                      className="example-chip" 
                      onClick={() => {
                        const textarea = document.querySelector('.studio-textarea');
                        if (textarea) {
                          textarea.value = ex;
                          // Trigger a visual flash or focus to show it worked
                          textarea.focus();
                          textarea.style.borderColor = 'var(--color-purple)';
                          setTimeout(() => textarea.style.borderColor = '', 300);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      "{ex}"
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'agents':
        return (
          <div className="agents-studio-grid">
            {STUDIO_AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <div 
                  key={agent.id} 
                  className={`agent-studio-card ${agent.colorClass} ${agent.isPro ? 'pro-card' : ''} animate-fadeInUp`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {agent.isPro && (
                    <div className="pro-badge-mini">
                      <Crown size={12} />
                      <span>PRO</span>
                    </div>
                  )}
                  <div className="agent-studio-icon">
                    <Icon size={24} />
                  </div>
                  <div className="agent-studio-info">
                    <h3>{agent.name}</h3>
                    <p>{agent.category}</p>
                  </div>
                  <button 
                    className={`agent-launch-btn ${agent.isPro ? 'pro-btn' : ''}`}
                    onClick={() => {
                      if (agent.isPro && !isLoggedIn) {
                        setShowLoginModal(true);
                      } else {
                        setSelectedAgent(agent);
                      }
                    }}
                  >
                    {agent.isPro && !isLoggedIn ? 'Unlock with Pro' : 'Launch Agent'}
                  </button>
                </div>
              );
            })}
          </div>
        );
      case 'hub':
        // Use the dynamic 'projects' state instead of static HUB_ITEMS
        const filteredHubItems = projects.filter(item => {
          if (hubFilter === 'All') return true;
          if (hubFilter === 'Audio') return ['Lyrics', 'MIDI', 'Production', 'Vocals', 'Sampling'].includes(item.type);
          if (hubFilter === 'Visual') return ['Image', 'Visual'].includes(item.type);
          if (hubFilter === 'Video') return ['Video'].includes(item.type);
          if (hubFilter === 'Strategy') return ['Strategy', 'Plan', 'Network', 'Research', 'Marketing'].includes(item.type);
          return true;
        });

        return (
          <div className="studio-hub-view animate-fadeInUp">
            <div className="hub-header-actions">
              <div className="search-box">
                <Search size={18} />
                <input type="text" placeholder="Search your creations..." />
              </div>
              <div className="filter-group">
                {['All', 'Audio', 'Visual', 'Video', 'Strategy'].map(filter => (
                  <button 
                    key={filter}
                    className={`filter-btn ${hubFilter === filter ? 'active' : ''}`}
                    onClick={() => setHubFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredHubItems.length === 0 ? (
              <div className="empty-hub-state">
                <Folder size={48} className="text-muted" />
                <h3>No projects yet</h3>
                <p>Launch an agent to start creating your first masterpiece.</p>
                <button className="cta-button-secondary" onClick={() => setActiveTab('agents')}>
                  Launch Agent
                </button>
              </div>
            ) : (
              <div className="hub-grid">
                {filteredHubItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="hub-card"
                    onClick={() => {
                      // If it's a text project, load it into the editor
                      if (!item.imageUrl && !item.videoUrl && item.snippet) {
                        // Find the agent that created this, or default to Ghostwriter
                        const agent = STUDIO_AGENTS.find(a => a.name === item.agent) || STUDIO_AGENTS[0];
                        setSelectedAgent(agent);
                        setActiveTab('agents');
                        // Use setTimeout to ensure the DOM has updated and textarea exists
                        setTimeout(() => {
                          const textarea = document.querySelector('.studio-textarea');
                          if (textarea) {
                            textarea.value = item.snippet;
                            textarea.focus();
                          }
                        }, 100);
                      }
                    }}
                    style={{ cursor: (!item.imageUrl && !item.videoUrl) ? 'pointer' : 'default' }}
                    title={(!item.imageUrl && !item.videoUrl) ? "Click to edit in Studio" : ""}
                  >
                    <div className={`hub-card-preview ${item.color}`}>
                      {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="hub-preview-image" />}
                      {item.videoUrl && <video src={item.videoUrl} className="hub-preview-video" muted />}
                      {!item.imageUrl && !item.videoUrl && (
                        <div className="hub-text-preview">
                          {item.snippet ? item.snippet.substring(0, 100) + '...' : 'Text Content'}
                        </div>
                      )}
                      <div className="preview-overlay">
                        {(item.audioUrl || item.videoUrl) && (
                          <button 
                            className="preview-btn play"
                            onClick={(e) => { e.stopPropagation(); setPlayingItem(item); }}
                          >
                            <Play size={24} fill="currentColor" />
                          </button>
                        )}
                        <button 
                          className="preview-btn"
                          onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                          title="Download to device"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          className="preview-btn" 
                          onClick={(e) => { e.stopPropagation(); handleShareToFeed(item); }}
                          title="Share to Activity Wall"
                        >
                          <Share2 size={18} />
                        </button>
                        <button 
                          className="preview-btn delete-btn" 
                          onClick={(e) => handleDeleteProject(item.id, e)}
                          title="Delete Project"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="hub-card-info">
                      <div className="hub-card-meta">
                        <span className="hub-type-tag">{item.type}</span>
                        <span className="hub-date">{item.date}</span>
                      </div>
                      <h3 className="hub-card-title">{item.title}</h3>
                      <p className="hub-card-agent">via {item.agent}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'comeup':
        return (
          <div className="comeup-view animate-fadeInUp">
            <div className="comeup-hero">
              <div className="comeup-badge">Artist Growth Suite</div>
              <h1>The Come Up</h1>
              <p>Tracking your journey from local talent to global influence.</p>
            </div>

            <div className="comeup-grid">
              <div className="comeup-main">
                <section className="comeup-section">
                  <div className="section-header">
                    <Users size={20} />
                    <h2>Your Artist Profile</h2>
                  </div>
                  <div className="artist-profile-card">
                    <div className="artist-image-stub"></div>
                    <div className="artist-info">
                      <h3>{isLoggedIn ? 'Pro Creator' : 'Guest Artist'}</h3>
                      <p className="location">Global Artist • Studio Agents Pro</p>
                      <p className="bio-text">
                        You are currently on the path to breaking through. Use our AI agents to collaborate with virtual legends, 
                        optimize your production, and reach audiences across all major streaming platforms.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="comeup-section">
                  <div className="section-header">
                    <Book size={20} />
                    <h2>The Roadmap</h2>
                  </div>
                  <div className="story-content">
                    <div className="story-block">
                      <h3>Phase 1: Foundation & Identity</h3>
                      <p>
                        Establish your core sonic signature using Ghostwriter and Beat Lab. This phase is about experimentation—finding the intersection between what you love and what resonates. Build a consistent visual identity 
                        with Album Artist to ensure your brand is recognizable from day one. Your first 1,000 true fans are born here.
                      </p>
                    </div>
                    <div className="story-block">
                      <h3>Phase 2: Momentum & Market Fit</h3>
                      <p>
                        Leverage Trend Hunter and Social Pilot to grow your audience through data-informed storytelling. Use Collab Connect 
                        to find the right partners to expand your reach into new territories. This is where you transition from a "creator" to an "artist" with a measurable market presence.
                      </p>
                    </div>
                    <div className="story-block">
                      <h3>Phase 3: Scaling & Legacy</h3>
                      <p>
                        Once you've achieved consistent growth, the focus shifts to infrastructure. Reinvest in your craft, build a specialized team (management, legal, PR), and diversify your revenue streams. Success is not a destination, 
                        but a platform to scale your creative influence and build a lasting legacy in the industry.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="comeup-section">
                  <div className="section-header">
                    <Shield size={20} />
                    <h2>Best Practices & Lessons</h2>
                  </div>
                  <div className="insights-grid">
                    <div className="insight-card">
                      <div className="insight-icon"><Zap size={18} /></div>
                      <h4>Consistency over Intensity</h4>
                      <p>The algorithm rewards steady output. It's better to release one quality track a month than five in one week and then go silent. Build a "content calendar" that you can actually sustain without burnout.</p>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Target size={18} /></div>
                      <h4>Own Your Audience Data</h4>
                      <p>Social media platforms are "rented land." Always prioritize building an email list or Discord community. If an algorithm changes tomorrow, you need a direct line to the people who support your art.</p>
                    </div>
                    <div className="insight-card warning">
                      <div className="insight-icon"><Shield size={18} /></div>
                      <h4>The Contract Trap</h4>
                      <p>Lesson Learned: Never sign a "Standard" contract without independent legal review. The "360 Deal" can often limit your long-term freedom. Understand your "Recoupables" before you spend a dime of an advance.</p>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Users size={18} /></div>
                      <h4>Networking vs. Connecting</h4>
                      <p>Don't just "network" for favors. Build genuine relationships with peers at your level. The "class" you come up with will be your strongest support system as you all rise together.</p>
                    </div>
                  </div>
                </section>

                <section className="comeup-section">
                  <div className="section-header">
                    <Globe size={20} />
                    <h2>The Business of Music</h2>
                  </div>
                  <div className="business-insights">
                    <div className="biz-block">
                      <h3>Publishing vs. Masters</h3>
                      <p>Understanding the difference is key to long-term wealth. Masters are the recording (the "audio file"); Publishing is the song itself (the "composition"). Both are vital revenue streams, but publishing often has a longer "tail" of value.</p>
                    </div>
                    <div className="biz-block">
                      <h3>Sync Licensing: The Quiet Giant</h3>
                      <p>Getting your music in TV, film, and games is one of the most effective ways to fund a career. It provides both a lump-sum "sync fee" and ongoing performance royalties. Optimize your metadata to be "sync-ready."</p>
                    </div>
                    <div className="biz-block">
                      <h3>How Goals are Achieved</h3>
                      <p>In the past, labels were the only gatekeepers. Today, goals are achieved through "Micro-Viral" moments, sustained community engagement, and strategic algorithmic triggers. You are the CEO of your own startup.</p>
                    </div>
                  </div>
                </section>

                <section className="comeup-section">
                  <div className="section-header">
                    <LayoutGrid size={20} />
                    <h2>Pro Workflows: Multi-Agent Projects</h2>
                  </div>
                  <div className="workflow-content">
                    <p className="workflow-intro">
                      The true power of Studio Agents Pro lies in <strong>Multi-Agent Orchestration</strong>. Instead of using agents in isolation, Pro creators chain them together to build entire musical ecosystems.
                    </p>
                    <div className="workflow-steps-v2">
                      <div className="workflow-step-v2">
                        <div className="step-v2-icon"><Music size={20} /></div>
                        <div className="step-v2-text">
                          <h4>1. The Foundation (Beat Architect + Instrumentalist)</h4>
                          <p>Start by generating a complex rhythmic skeleton with <strong>Beat Architect</strong>. Then, use <strong>Instrumentalist</strong> to layer a bassline or guitar riff that follows the same MIDI timing. This ensures your "pocket" is tight from the start.</p>
                        </div>
                      </div>
                      <div className="workflow-step-v2">
                        <div className="step-v2-icon"><Sparkles size={20} /></div>
                        <div className="step-v2-text">
                          <h4>2. The Soul (Ghostwriter + Vocal Architect)</h4>
                          <p>Feed your track's mood into <strong>Ghostwriter</strong> to generate lyrics. Take those lyrics directly into <strong>Vocal Architect</strong> to synthesize lead vocals and 3-part harmonies. Pro Tip: Use the same "Intensity" setting for both to maintain emotional consistency.</p>
                        </div>
                      </div>
                      <div className="workflow-step-v2">
                        <div className="step-v2-icon"><Shield size={20} /></div>
                        <div className="step-v2-text">
                          <h4>3. The Polish (Mastering Lab + Album Artist)</h4>
                          <p>Once your mix is balanced, run it through <strong>Mastering Lab</strong> for industry-standard loudness. Simultaneously, use <strong>Album Artist</strong> to generate a visual identity that matches the sonic frequency of your master.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="comeup-section">
                  <div className="section-header">
                    <Lock size={20} />
                    <h2>AI Ethics & Privacy</h2>
                  </div>
                  <div className="ethics-content">
                    <div className="ethics-grid">
                      <div className="ethics-card">
                        <Shield size={24} className="ethics-icon" />
                        <h3>Data Privacy</h3>
                        <p>Your prompts and creations are yours. We use industry-standard encryption to ensure your creative IP remains private. We do not train our base models on your personal studio sessions without explicit consent.</p>
                      </div>
                      <div className="ethics-card">
                        <Lock size={24} className="ethics-icon" />
                        <h3>Ownership & Rights</h3>
                        <p>The "Truth" about AI: You own the output you generate here. However, copyright laws are evolving. We recommend using AI as a "Co-Pilot"—always add your unique human touch to ensure full legal protection of your works.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="comeup-section">
                  <div className="section-header">
                    <Award size={20} />
                    <h2>Professional Quality Mastery</h2>
                  </div>
                  <div className="mastery-content">
                    <div className="mastery-grid">
                      <div className="mastery-item">
                        <div className="mastery-header">
                          <CheckCircle size={18} className="do-icon" />
                          <h3>The "Do's" of AI Production</h3>
                        </div>
                        <ul>
                          <li><strong>Iterate:</strong> Use AI to generate 10 ideas, then pick the best 1 to refine manually.</li>
                          <li><strong>Layering:</strong> Combine AI-generated stems with live-recorded instruments for "Organic Depth."</li>
                          <li><strong>Reference Tracks:</strong> Always provide the AI with clear stylistic references to maintain professional consistency.</li>
                        </ul>
                      </div>
                      <div className="mastery-item">
                        <div className="mastery-header">
                          <X size={18} className="dont-icon" />
                          <h3>The "Don'ts" of AI Production</h3>
                        </div>
                        <ul>
                          <li><strong>Don't Over-Rely:</strong> Avoid using "Raw" AI output without any human editing; it often lacks the emotional nuance listeners crave.</li>
                          <li><strong>Don't Ignore Metadata:</strong> Professional quality includes proper tagging and credits. Always document your AI tools in your production logs.</li>
                          <li><strong>Don't Chase Perfection:</strong> AI can generate "perfect" timing, but "human" swing is what makes people dance. Keep the soul in the music.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="comeup-sidebar">
                <div className="sidebar-card">
                  <h3>Executive Insights</h3>
                  <div className="testimonial-list">
                    <div className="testimonial-item">
                      <p>"We don't just sign songs anymore; we sign ecosystems. We look for artists who have already built a world around their music. If you have the community, we provide the fuel."</p>
                      <span>— VP of A&R, Global Music Group</span>
                    </div>
                    <div className="testimonial-item">
                      <p>"Data gets you in the room, but your unique 'Sonic Thumbprint' is what keeps you there. Don't chase trends; start them. The most successful artists are the ones who are 'un-copyable'."</p>
                      <span>— Head of Digital, Indie Powerhouse</span>
                    </div>
                    <div className="testimonial-item">
                      <p>"The best artists I work with understand their business as well as their craft. They know their splits, they know their rights, and they know their worth."</p>
                      <span>— Senior Sync Agent, Hollywood Music House</span>
                    </div>
                  </div>
                </div>
                <div className="sidebar-card stats">
                  <h3>Career Milestones</h3>
                  <div className="stat-row">
                    <span>Current Status</span>
                    <strong>Rising Talent</strong>
                  </div>
                  <div className="stat-row">
                    <span>Next Goal</span>
                    <strong>100k Monthly Listeners</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'activity':
        return (
          <div className="activity-wall-view animate-fadeInUp">
            <div className="activity-header">
              <div className="header-left">
                <h1>Activity Wall</h1>
                <p>Trending AI projects and community creations for inspiration.</p>
              </div>
              <div className="header-right-actions">
                <button className="cta-button-premium haptic-press" onClick={() => fetchActivity(1)}>
                  <Zap size={18} />
                  Refresh Feed
                </button>
              </div>
            </div>

            <div className="activity-feed">
              {activityFeed.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="activity-card">
                  <div className="activity-card-header">
                    <div className="user-meta">
                      <div className="user-avatar-small"></div>
                      <div className="user-details">
                        <span className="user-handle">@{item.user}</span>
                        <span className="activity-time">{item.time}</span>
                      </div>
                    </div>
                    <div className={`agent-tag ${item.color}`}>
                      {item.agent}
                    </div>
                  </div>
                  
                  <div className="activity-card-body">
                    <h3>{item.title}</h3>
                    <p className="activity-snippet">"{item.snippet}"</p>
                    
                    {item.type === 'video' && item.videoUrl && (
                      <div className="activity-media-preview video">
                        <video src={item.videoUrl} muted loop onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} />
                        <div className="media-overlay"><PlayCircle size={32} /></div>
                      </div>
                    )}

                    {item.type === 'image' && item.imageUrl && (
                      <div className="activity-media-preview image">
                        <img src={item.imageUrl} alt={item.title} />
                      </div>
                    )}

                    {(item.audioUrl || item.videoUrl) && (
                      <button 
                        className="play-preview-btn"
                        onClick={() => setPlayingItem(item)}
                      >
                        <PlayCircle size={20} />
                        <span>Play Preview</span>
                      </button>
                    )}
                  </div>

                  <div className="activity-card-footer">
                    <div className="activity-actions">
                      <button className="activity-btn">
                        <Zap size={16} />
                        <span>{item.likes}</span>
                      </button>
                      <button className="activity-btn">
                        <Rocket size={16} />
                        <span>{item.remixes}</span>
                      </button>
                      <button className="activity-btn" onClick={() => window.open(item.url, '_blank')}>
                        <Share2 size={16} />
                      </button>
                    </div>
                    <button className="remix-cta" onClick={() => window.open(item.url, '_blank')}>
                      View Project
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {isLoadingActivity && (
              <div className="loading-trigger">
                <div className="spinner"></div>
                <span>Loading more inspiration...</span>
              </div>
            )}

            {!isLoadingActivity && hasMoreActivity && (
              <div className="load-more-trigger">
                <button className="cta-button-secondary haptic-press" onClick={() => fetchActivity(activityPage + 1)}>
                  Load More Projects
                </button>
              </div>
            )}

            {!hasMoreActivity && activityFeed.length > 0 && (
              <div className="end-of-feed">
                <p>You've reached the end of the inspiration wall. Check back later!</p>
              </div>
            )}
          </div>
        );
      case 'news':
        const filteredNews = newsArticles.filter(item => 
          item.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
          item.source.toLowerCase().includes(newsSearch.toLowerCase()) ||
          item.content.toLowerCase().includes(newsSearch.toLowerCase())
        );

        const handleRefreshNews = () => {
          fetchNews(1);
        };

        const toggleNewsExpansion = (id) => {
          const newExpanded = new Set(expandedNews);
          if (newExpanded.has(id)) {
            newExpanded.delete(id);
          } else {
            newExpanded.add(id);
          }
          setExpandedNews(newExpanded);
        };

        const toggleAllNews = () => {
          if (allNewsExpanded) {
            setExpandedNews(new Set());
          } else {
            setExpandedNews(new Set(filteredNews.map(n => n.id)));
          }
          setAllNewsExpanded(!allNewsExpanded);
        };

        return (
          <div className="news-view animate-fadeInUp">
            <div className="news-header-controls">
              <div className="search-box">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Search live news, tabloids, or sources..." 
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                />
              </div>
              <div className="news-actions">
                <button 
                  className="action-button secondary haptic-press"
                  onClick={toggleAllNews}
                >
                  {allNewsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  {allNewsExpanded ? 'Collapse All' : 'Expand All'}
                </button>
                <button 
                  className={`refresh-btn haptic-press ${isLoadingNews ? 'spinning' : ''}`}
                  onClick={handleRefreshNews}
                >
                  <Zap size={18} />
                  Refresh Feed
                </button>
              </div>
            </div>

            <div className="news-grid-v2">
              {filteredNews.map((item) => {
                const isExpanded = expandedNews.has(item.id);
                return (
                  <div key={item.id} className={`news-card-v2 ${isExpanded ? 'expanded' : ''} source-${item.source.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className={`news-card-accent ${item.color || 'agent-purple'}`}></div>
                    <div className="news-card-content">
                      <div className="news-card-meta">
                        <div className="meta-left">
                          <span className="news-source-badge">{item.source}</span>
                          {item.tags && item.tags.map(tag => (
                            <span key={tag} className="news-category-tag">{tag}</span>
                          ))}
                          {item.time === 'Just now' && <span className="live-indicator-pulse">LIVE</span>}
                        </div>
                        <span className="news-date">{item.time}</span>
                      </div>
                      
                      {item.type === 'video' && (
                        <div className="news-media-preview video">
                          <video src={item.videoUrl} muted loop onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} />
                          <div className="media-overlay"><PlayCircle size={24} /></div>
                        </div>
                      )}

                      {item.type === 'image' && (
                        <div className="news-media-preview image">
                          <img src={item.imageUrl} alt={item.title} />
                        </div>
                      )}

                      <h3 className="news-card-title">{item.title}</h3>
                      <p className={`news-card-text ${isExpanded ? 'full' : 'preview'}`}>
                        {item.content}
                      </p>
                      <div className="news-card-footer">
                        <button 
                          className="news-read-btn"
                          onClick={() => toggleNewsExpansion(item.id)}
                        >
                          {isExpanded ? 'Show Less' : 'Read Article'} 
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {isExpanded && (
                          <div className="news-social-actions">
                            <button className="social-btn" onClick={() => window.open(item.url, '_blank')}><Share2 size={14} /></button>
                            <button className="social-btn"><Download size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isLoadingNews && (
              <div className="loading-trigger">
                <div className="spinner"></div>
                <span>Loading more news...</span>
              </div>
            )}

            {!isLoadingNews && hasMoreNews && (
              <div className="load-more-trigger">
                <button className="cta-button-secondary" onClick={() => fetchNews(newsPage + 1)}>
                  Load More News
                </button>
              </div>
            )}
          </div>
        );
      case 'help':
        const HELP_ITEMS = [
          { 
            icon: Book, 
            title: 'Getting Started', 
            desc: 'Learn the basics of the Studio Agents workflow.',
            details: 'To get started, select an agent from the "Agents" tab. Each agent specializes in a different part of the music creation process. For example, Ghostwriter can help you write lyrics, while Beat Lab can generate drum patterns. Once you\'ve selected an agent, enter a prompt describing what you want to create. You can then save your creation as a new project, which will appear in your Project Hub for later recall.'
          },
          { 
            icon: Zap, 
            title: 'Agent Mastery', 
            desc: 'Deep dives into each agent\'s unique capabilities.',
            details: 'Mastering our agents requires understanding their specific strengths. Ghostwriter responds best to emotional cues and genre-specific keywords. Album Artist can interpret complex visual metaphors. Trend Hunter scans real-time social data to give you a competitive edge. Experiment with different "Intensity" settings to see how the AI\'s creativity shifts from subtle to experimental.'
          },
          { 
            icon: PlayCircle, 
            title: 'Video Tutorials', 
            desc: 'Watch step-by-step guides on making hits.',
            details: 'Our video library includes tutorials on: "Writing Your First Hit with Ghostwriter", "Advanced Beat Making with Beat Lab", and "Strategic Rollouts with Release Manager". Each video is under 5 minutes and designed to get you creating immediately. Pro members get access to exclusive masterclasses from industry-leading producers who use Studio Agents in their daily workflow.'
          },
          { 
            icon: MessageSquare, 
            title: 'Community Tips', 
            desc: 'See how other artists are using the studio.',
            details: 'Join our Discord community and check out the "Activity Wall" to share prompts, collaborate with other artists, and get feedback on your AI-assisted tracks. Many users have found success by combining outputs from multiple agents—for example, using Ghostwriter for lyrics and then feeding those lyrics into a vocal synth. The possibilities are endless when you collaborate with the community.'
          }
        ];

        const TROUBLESHOOTING_GUIDE = [
          {
            keywords: ['download', 'save', 'export', 'phone', 'photos'],
            issue: 'Cannot download or save to device',
            solution: 'Ensure you have granted storage permissions to your browser. On mobile, long-press the image or use the "Save to Files" option in the share menu. If using cloud storage, verify your Google Drive or OneDrive connection is active.'
          },
          {
            keywords: ['audio', 'sound', 'hear', 'play', 'silent'],
            issue: 'No sound during playback',
            solution: 'Check if your device is on silent mode. Ensure the volume slider in the Media Player is turned up. Some browsers block auto-play audio; try clicking the play button manually.'
          },
          {
            keywords: ['slow', 'stuck', 'loading', 'generate', 'wait'],
            issue: 'Generation is taking too long',
            solution: 'High-quality models like Imagen 3 and Veo can take up to 30 seconds. Check your internet connection. If the progress bar is stuck, try refreshing the page; your project will be saved in the Project Hub.'
          },
          {
            keywords: ['login', 'account', 'pro', 'subscription', 'access'],
            issue: 'Cannot access Pro agents',
            solution: 'Pro agents require an active Studio Pro subscription. Ensure you are logged in with the correct account. If you just subscribed, try logging out and back in to refresh your status.'
          },
          {
            keywords: ['voice', 'mic', 'microphone', 'speak', 'listen', 'gender', 'male', 'female', 'accent', 'translate', 'language'],
            issue: 'Voice controls and translation settings',
            solution: 'Use the Mic icon for Voice-to-Text and the Speaker icon for Text-to-Voice. Click the Settings (gear) icon to change voice gender (Male/Female), region (US/UK/AU/IN), or to enable automatic translation to your preferred language.'
          },
          {
            keywords: ['privacy', 'data', 'security', 'safe', 'private'],
            issue: 'Is my data and music private?',
            solution: 'Yes. We use end-to-end encryption for your prompts and creations. We do not share your personal studio data with third parties or use it to train public models without your permission.'
          },
          {
            keywords: ['copyright', 'rights', 'own', 'legal', 'truth'],
            issue: 'Do I own the AI-generated music?',
            solution: 'You own the rights to the output you generate. However, for full copyright protection, we recommend adding human elements (vocals, live instruments) to make the work uniquely yours.'
          },
          {
            keywords: ['quality', 'professional', 'pro', 'industry', 'standard'],
            issue: 'How to get professional quality results?',
            solution: 'Use high-quality reference tracks, layer AI stems with live recordings, and always perform a final manual mix. Our Mastering Lab agent can help with the final industry-standard polish.'
          },
          {
            keywords: ['multi', 'agent', 'chain', 'workflow', 'project', 'pro'],
            issue: 'How to use multiple agents in one project?',
            solution: 'Pro users can "chain" agents by taking the output of one (e.g., Ghostwriter lyrics) and feeding it into another (e.g., Vocal Architect). Check "The Come Up" section for detailed Multi-Agent Workflow guides.'
          }
        ];

        const suggestions = helpSearch.length > 2 
          ? TROUBLESHOOTING_GUIDE.filter(guide => 
              guide.keywords.some(k => helpSearch.toLowerCase().includes(k)) ||
              guide.issue.toLowerCase().includes(helpSearch.toLowerCase())
            )
          : [];

        return (
          <div className="help-center-view animate-fadeInUp">
            <div className="help-hero">
              <h1>How can we help you create?</h1>
              <div className="search-box large">
                <Search size={20} />
                <input 
                  type="text" 
                  placeholder="Describe your issue (e.g., 'cannot download' or 'no sound')..." 
                  value={helpSearch}
                  onChange={(e) => setHelpSearch(e.target.value)}
                />
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="smart-suggestions animate-fadeIn">
                <div className="suggestions-header">
                  <Sparkles size={18} className="text-purple" />
                  <h3>Smart Suggestions</h3>
                </div>
                <div className="suggestions-list">
                  {suggestions.map((s, i) => (
                    <div key={i} className="suggestion-item">
                      <h4>{s.issue}</h4>
                      <p>{s.solution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="help-grid-main">
              {HELP_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const isExpanded = expandedHelp === i;
                return (
                  <div key={i} className={`help-card-item ${isExpanded ? 'expanded' : ''}`}>
                    <div className="help-card-icon">
                      <Icon size={24} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                    {isExpanded && (
                      <div className="help-card-details animate-fadeIn">
                        <p>{item.details}</p>
                      </div>
                    )}
                    <button 
                      className="help-card-link"
                      onClick={() => setExpandedHelp(isExpanded ? null : i)}
                    >
                      {isExpanded ? 'Show Less' : 'Read More'} 
                      {isExpanded ? <ChevronUp size={16} /> : <ArrowRight size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {[
                  { q: 'How do I export my creations?', a: 'You can export any creation from the Project Hub using the download icon.' },
                  { q: 'Can I use the lyrics commercially?', a: 'Yes, all content generated by Studio Agents is royalty-free for Pro users.' },
                  { q: 'How do I change the agent\'s genre?', a: 'Use the Genre dropdown in the agent\'s detail view to shift styles.' }
                ].map((faq, i) => (
                  <div key={i} className="faq-item">
                    <h4>{faq.q}</h4>
                    <p>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Persist theme
  useEffect(() => {
    localStorage.setItem('studio_theme', theme);
  }, [theme]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 150;
    
    if (isNearBottom) {
      if (activeTab === 'activity' && !isLoadingActivity && hasMoreActivity) {
        fetchActivity(activityPage + 1);
      } else if (activeTab === 'news' && !isLoadingNews && hasMoreNews) {
        fetchNews(newsPage + 1);
      }
    }
  };

  return (
    <div className={`studio-container ${theme}-theme`}>
      <aside className="studio-nav">
        <div className="studio-nav-logo" onClick={onBack}>
          <div className="logo-box studio-logo">
            <Sparkles size={20} color="white" />
          </div>
          <div className="logo-text">
            <span className="studio-name">STUDIO AGENTS</span>
            <span className="studio-sub">AI ECOSYSTEM</span>
            <span className="studio-domain">studioagentsai.com</span>
          </div>
        </div>

        <nav className="studio-nav-links">
          <button 
            className={`nav-link ${activeTab === 'mystudio' ? 'active' : ''}`}
            onClick={() => { setActiveTab('mystudio'); setSelectedAgent(null); }}
          >
            <Home size={20} />
            <span>My Studio</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => { setActiveTab('agents'); setSelectedAgent(null); }}
          >
            <LayoutGrid size={20} />
            <span>Agents</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'hub' ? 'active' : ''}`}
            onClick={() => { setActiveTab('hub'); setSelectedAgent(null); }}
          >
            <Folder size={20} />
            <span>Project Hub</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => { setActiveTab('activity'); setSelectedAgent(null); }}
          >
            <MessageSquare size={20} />
            <span>Activity Wall</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'comeup' ? 'active' : ''}`}
            onClick={() => { setActiveTab('comeup'); setSelectedAgent(null); }}
          >
            <TrendingUp size={20} />
            <span>Come Up</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => { setActiveTab('news'); setSelectedAgent(null); }}
          >
            <Globe size={20} />
            <span>News</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => { setActiveTab('help'); setSelectedAgent(null); }}
          >
            <HelpCircle size={20} />
            <span>Help Center</span>
          </button>
        </nav>

        <div className="studio-nav-footer">
          <div className="user-profile-mini">
            <div className="user-avatar"></div>
            <div className="user-info">
              <p className="user-name">{isLoggedIn ? 'Pro Creator' : 'Guest Artist'}</p>
              <p className="user-status">{isLoggedIn ? 'Pro Plan' : 'Free Account'}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="studio-main" onScroll={handleScroll}>
        <header className="studio-header">
          <h2 className="studio-title">
            {selectedAgent ? selectedAgent.name : (activeTab === 'mystudio' ? 'Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
          </h2>
          <div className="studio-header-actions">
            <button 
              className="action-button secondary theme-toggle haptic-press"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              className="action-button secondary haptic-press"
              onClick={onBack}
              title="Back to Landing Page"
            >
              <Home size={18} />
            </button>
            <button 
              className="action-button secondary haptic-press"
              onClick={() => { setActiveTab('help'); setSelectedAgent(null); }}
              title="Help Center"
            >
              <HelpCircle size={18} />
            </button>
            <button className="action-button secondary haptic-press">
              <Bell size={18} />
            </button>
            {isLoggedIn ? (
              <div className="user-projects-dropdown">
                <button 
                  className="action-button primary haptic-press"
                  onClick={handleCreateProject}
                >
                  New Project ({projects.length})
                </button>
              </div>
            ) : (
              <button 
                className="action-button primary haptic-press"
                onClick={() => setShowLoginModal(true)}
              >
                New Project
              </button>
            )}
          </div>
        </header>

        <div className="studio-content">
          {renderContent()}
        </div>

        {/* Media Player Modal */}
        {playingItem && (
          <div 
            className="media-player-overlay animate-fadeIn"
            onClick={() => setPlayingItem(null)}
          >
            <div 
              className="media-player-container animate-fadeInUp"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="player-close" onClick={() => setPlayingItem(null)}>
                <X size={24} />
              </button>
              
              <div className="player-content">
                <div className="player-header">
                  <div className={`player-icon-box ${playingItem.color || 'agent-purple'}`}>
                    {playingItem.videoUrl ? <PlayCircle size={32} /> : playingItem.imageUrl ? <Music size={32} /> : <Music size={32} />}
                  </div>
                  <div className="player-info">
                    <h2>{playingItem.title}</h2>
                    <p>{playingItem.agent} • {playingItem.user || 'Your Creation'}</p>
                  </div>
                </div>

                <div className="player-visualizer">
                  {playingItem.videoUrl ? (
                    <video 
                      src={playingItem.videoUrl} 
                      controls 
                      autoPlay 
                      className="player-video"
                    />
                  ) : playingItem.imageUrl ? (
                    <img 
                      src={playingItem.imageUrl} 
                      alt={playingItem.title} 
                      className="player-video" 
                      style={{ objectFit: 'contain', background: '#000' }}
                    />
                  ) : (
                    <div className="audio-visualizer-placeholder">
                      <div className="visualizer-bars">
                        {[...Array(20)].map((_, i) => (
                          <div key={i} className="v-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
                        ))}
                      </div>
                      <audio 
                        src={playingItem.audioUrl} 
                        controls 
                        autoPlay 
                        className="player-audio"
                      />
                    </div>
                  )}
                </div>

                <div className="player-footer">
                  <div className="player-actions">
                    <button 
                      className="player-btn primary"
                      onClick={() => handleDownload(playingItem)}
                    >
                      <Download size={18} />
                      <span>Download to Device</span>
                    </button>
                    <button 
                      className="player-btn secondary"
                      onClick={() => handleShareToFeed(playingItem)}
                    >
                      <Share2 size={18} />
                      <span>Share to Feed</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* External Save Modal */}
        {showExternalSaveModal && (
          <div className="modal-overlay" onClick={() => setShowExternalSaveModal(false)}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowExternalSaveModal(false)}><X size={20} /></button>
              <div className="modal-header">
                <div className="logo-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
                  <Cloud size={24} color="white" />
                </div>
                <h2>Save to Personal Storage</h2>
                <p>Connect your cloud storage to save your creations permanently.</p>
              </div>
              <div className="modal-body">
                <div className="external-storage-grid">
                  <button className="storage-btn" onClick={() => { alert('Connecting to Google Drive...'); setShowExternalSaveModal(false); }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" width="24" />
                    <span>Google Drive</span>
                  </button>
                  <button className="storage-btn" onClick={() => { alert('Connecting to OneDrive...'); setShowExternalSaveModal(false); }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg" alt="OneDrive" width="24" />
                    <span>OneDrive</span>
                  </button>
                  <button className="storage-btn" onClick={() => { alert('Connecting to Dropbox...'); setShowExternalSaveModal(false); }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" alt="Dropbox" width="24" />
                    <span>Dropbox</span>
                  </button>
                  <button className="storage-btn" onClick={() => { alert('Connecting to iCloud...'); setShowExternalSaveModal(false); }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/1c/ICloud_logo.svg" alt="iCloud" width="24" />
                    <span>iCloud</span>
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <p>Your files will be synced automatically after generation.</p>
              </div>
            </div>
          </div>
        )}

        {/* Login Modal */}
        {showLoginModal && (
          <div className="modal-overlay">
            <div className="modal-content animate-fadeInUp">
              <button className="modal-close" onClick={() => setShowLoginModal(false)}><X size={20} /></button>
              <div className="modal-header">
                <div className="logo-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
                  <Sparkles size={24} color="white" />
                </div>
                <h2>Join Studio Agents</h2>
                <p>Sign in to save your projects and access all 8 AI agents.</p>
              </div>
              <div className="modal-body">
                <button 
                  className="cta-button-premium" 
                  style={{ width: '100%', marginBottom: '1rem' }}
                  onClick={() => { 
                    setIsLoggedIn(true); 
                    setShowLoginModal(false);
                    let uid = localStorage.getItem('studio_user_id');
                    if (!uid) {
                      uid = 'user_' + Math.random().toString(36).substr(2, 9);
                      localStorage.setItem('studio_user_id', uid);
                    }
                  }}
                >
                  Sign In with Google
                </button>
                <button 
                  className="cta-button-secondary" 
                  style={{ width: '100%' }}
                  onClick={() => { 
                    setIsLoggedIn(true); 
                    setShowLoginModal(false);
                    let uid = localStorage.getItem('studio_user_id');
                    if (!uid) {
                      uid = 'user_' + Math.random().toString(36).substr(2, 9);
                      localStorage.setItem('studio_user_id', uid);
                    }
                  }}
                >
                  Continue with Email
                </button>
              </div>
              <div className="modal-footer">
                <p>By continuing, you agree to our Terms of Service.</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Payment Method Modal */}
        {showAddPaymentModal && (
          <div className="modal-overlay" onClick={() => setShowAddPaymentModal(false)}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowAddPaymentModal(false)}><X size={20} /></button>
              <div className="modal-header">
                <div className="logo-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
                  <CreditCard size={24} color="white" />
                </div>
                <h2>Add Payment Method</h2>
                <p>Securely add a new card or bank account to your studio.</p>
              </div>
              
              <div className="modal-tabs">
                <button 
                  className={`modal-tab ${paymentType === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentType('card')}
                >
                  Credit/Debit Card
                </button>
                <button 
                  className={`modal-tab ${paymentType === 'bank' ? 'active' : ''}`}
                  onClick={() => setPaymentType('bank')}
                >
                  Bank Account
                </button>
              </div>

              <div className="modal-body">
                {paymentType === 'card' ? (
                  <form className="payment-form" onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const newPM = {
                      id: `pm_${Date.now()}`,
                      type: 'Visa',
                      last4: formData.get('cardNumber').slice(-4),
                      expiry: formData.get('expiry'),
                      isDefault: false
                    };
                    setPaymentMethods([...paymentMethods, newPM]);
                    setShowAddPaymentModal(false);
                    handleTextToVoice(`Successfully added your card ending in ${newPM.last4}.`);
                  }}>
                    <div className="form-group">
                      <label>Card Number</label>
                      <input type="text" name="cardNumber" placeholder="0000 0000 0000 0000" required />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input type="text" name="expiry" placeholder="MM/YY" required />
                      </div>
                      <div className="form-group">
                        <label>CVC</label>
                        <input type="text" name="cvc" placeholder="123" required />
                      </div>
                    </div>
                    <button type="submit" className="cta-button-premium" style={{ width: '100%', marginTop: '1rem' }}>
                      Save Card
                    </button>
                  </form>
                ) : (
                  <form className="payment-form" onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const newBA = {
                      id: `ba_${Date.now()}`,
                      bankName: formData.get('bankName'),
                      last4: formData.get('accountNumber').slice(-4),
                      type: 'Checking'
                    };
                    setBankAccounts([...bankAccounts, newBA]);
                    setShowAddPaymentModal(false);
                    handleTextToVoice(`Successfully linked your ${newBA.bankName} account.`);
                  }}>
                    <div className="form-group">
                      <label>Bank Name</label>
                      <input type="text" name="bankName" placeholder="e.g. Chase, Wells Fargo" required />
                    </div>
                    <div className="form-group">
                      <label>Routing Number</label>
                      <input type="text" name="routingNumber" placeholder="9 digits" required />
                    </div>
                    <div className="form-group">
                      <label>Account Number</label>
                      <input type="text" name="accountNumber" placeholder="Account Number" required />
                    </div>
                    <button type="submit" className="cta-button-premium" style={{ width: '100%', marginTop: '1rem' }}>
                      Link Bank Account
                    </button>
                  </form>
                )}
              </div>
              <div className="modal-footer">
                <div className="secure-badge">
                  <Lock size={12} />
                  <span>Encrypted & Secure via Stripe</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="bottom-nav">
          <div className={`bottom-nav-item haptic-press ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => { setActiveTab('agents'); setSelectedAgent(null); }}>
            <LayoutGrid size={24} />
            <span>Agents</span>
          </div>
          <div className={`bottom-nav-item haptic-press ${activeTab === 'mystudio' ? 'active' : ''}`} onClick={() => { setActiveTab('mystudio'); setSelectedAgent(null); }}>
            <Home size={24} />
            <span>Studio</span>
          </div>
          <div className={`bottom-nav-item haptic-press ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => { setActiveTab('activity'); setSelectedAgent(null); }}>
            <Rocket size={24} />
            <span>Wall</span>
          </div>
          <div className={`bottom-nav-item haptic-press ${activeTab === 'news' ? 'active' : ''}`} onClick={() => { setActiveTab('news'); setSelectedAgent(null); }}>
            <Globe size={24} />
            <span>News</span>
          </div>
          <div className={`bottom-nav-item haptic-press ${activeTab === 'comeup' ? 'active' : ''}`} onClick={() => { setActiveTab('comeup'); setSelectedAgent(null); }}>
            <Zap size={24} />
            <span>Pro</span>
          </div>
        </nav>
      </main>
    </div>
  );
}

// Main App Component
export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNavigate = (view) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView(view);
      setIsTransitioning(false);
      window.scrollTo(0, 0);
    }, 300);
  };

  return (
    <div className={`app-viewport ${isTransitioning ? 'transitioning' : ''}`}>
      {currentView === 'landing' ? (
        <LandingPage onEnter={() => handleNavigate('studio')} />
      ) : (
        <StudioView onBack={() => handleNavigate('landing')} />
      )}
      
      {/* Global Transition Overlay */}
      <div className="view-transition-overlay"></div>
    </div>
  );
}
