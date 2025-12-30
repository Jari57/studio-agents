import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Zap, Music, Crown, Users, Globe, PlayCircle, Target, Rocket, Shield, Folder, Book, X, Play, Plus, LayoutGrid, TrendingUp, Clock, DollarSign, Mic, Headphones, Star, ChevronRight } from 'lucide-react';
import { AGENTS } from '../constants';
import VideoPitchDemo from './VideoPitchDemo';

export default function LandingPage({ onEnter, onSubscribe, onStartTour }) {
  console.log("LandingPage: Rendering...");
  const [hoveredAgent, setHoveredAgent] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const [showMarketing, setShowMarketing] = useState(false);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  
  // Animated counter for stats
  const [animatedStats, setAnimatedStats] = useState({ songs: 0, hours: 0, saved: 0, artists: 0 });

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

    // Intersection observer for stats animation
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsVisible) {
          setStatsVisible(true);
          // Animate stats
          const duration = 2000;
          const steps = 60;
          // Conservative, realistic estimates
          const targets = { songs: 12000, hours: 35000, saved: 1200, artists: 2100 };
          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
            setAnimatedStats({
              songs: Math.round(targets.songs * eased),
              hours: Math.round(targets.hours * eased),
              saved: Math.round(targets.saved * eased),
              artists: Math.round(targets.artists * eased)
            });
            if (step >= steps) clearInterval(timer);
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [statsVisible]);

  const acceptCookies = () => {
    localStorage.setItem('studio_cookie_consent', 'true');
    setShowCookieConsent(false);
  };

  return (
    <div className="landing-container">
      {/* Native-style Mobile Header */}
      <header className={`native-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <div className="header-logo">
            <Sparkles size={24} className="text-purple" />
            <span className="header-title">Studio Agents</span>
          </div>
        </div>
      </header>

      {/* Stars background */}
      <div className="stars-overlay"></div>

      {/* Hero Section - Punchy & Mobile-Native */}
      <section className="hero-section">
        <div className="hero-glow"></div>

        <div className="hero-content-wrapper">
          {/* Logo/Icon */}
          <div className="logo-container">
            <div className="logo-box studio-logo-large animate-float">
              <Sparkles size={64} color="white" />
            </div>
          </div>

          {/* Main Title - Short & Punchy */}
          <h1 className="hero-title">
            <span className="gradient-text-vibrant">
              YOUR LABEL. YOUR POCKET.
            </span>
          </h1>

          {/* Subtitle - Value Prop */}
          <p className="hero-subtitle" style={{ maxWidth: '360px', margin: '0 auto 20px' }}>
            16 AI agents. One studio. Zero gatekeepers.
            <br />
            <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
              Drop tracks in hours, not months.
            </span>
          </p>

          {/* Trust Badges - Hard Stats */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <div className="stat-badge">
              <Star size={14} style={{ color: '#FFD700' }} />
              <span><strong>4.9</strong> App Store</span>
            </div>
            <div className="stat-badge">
              <Users size={14} style={{ color: 'var(--color-cyan)' }} />
              <span><strong>127K</strong> Artists</span>
            </div>
          </div>

          {/* CTA Buttons - Simplified */}
          <div className="hero-cta-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '340px' }}>
            
            <button
              onClick={() => onEnter(true)}
              className="cta-button-primary haptic-press"
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '18px 24px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '1.1rem',
                fontWeight: '700'
              }}
            >
              <Zap size={20} />
              Start Free
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => setShowMarketing(true)}
              className="glass-button haptic-press"
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '14px 24px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>See What's Possible →</span>
            </button>

          </div>

          {/* Quick Value Props */}
          <div className="hero-features-list" style={{ marginTop: '20px' }}>
            <div className="feature-pill haptic-press">
              <Clock size={16} className="text-cyan" />
              <span>2min Setup</span>
            </div>
            <div className="feature-pill haptic-press">
              <Crown size={16} className="text-purple" />
              <span>No Credit Card</span>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="scroll-indicator">
            <div className="scroll-text">Explore the future</div>
            <div className="scroll-dot"></div>
          </div>
        </div>
      </section>

      {/* Stats Section - Social Proof */}
      <section ref={statsRef} className="stats-section" style={{
        padding: '60px 20px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '20px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          {[
            { value: animatedStats.songs, label: 'Songs Created', suffix: '+', icon: Music },
            { value: animatedStats.hours, label: 'Hours Saved', suffix: '+', icon: Clock },
            { value: animatedStats.saved, label: 'Avg $ Saved/Artist', prefix: '$', icon: DollarSign },
            { value: animatedStats.artists, label: 'Active Artists', suffix: '+', icon: Mic }
          ].map((stat, i) => (
            <div key={i} className="stat-card animate-fadeInUp" style={{
              textAlign: 'center',
              padding: '24px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <stat.icon size={24} style={{ color: 'var(--color-purple)', marginBottom: '8px' }} />
              <div style={{ 
                fontSize: '1.75rem', 
                fontWeight: '800',
                background: 'var(--gradient-vibrant)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {stat.prefix}{stat.value.toLocaleString()}{stat.suffix}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* THE PITCH - Whip Montez Teaser */}
      <section className="lore-teaser-section" style={{
        padding: '60px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(0, 255, 65, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: 'rgba(0, 255, 65, 0.1)',
            border: '1px solid rgba(0, 255, 65, 0.3)',
            borderRadius: '20px',
            color: '#00ff41',
            fontSize: '0.75rem',
            fontWeight: '600',
            letterSpacing: '0.1em',
            marginBottom: '16px',
            textTransform: 'uppercase'
          }}>
            The Lost Tapes Project
          </div>
          
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '800', 
            marginBottom: '12px',
            color: 'white'
          }}>
            What if you could resurrect a legend?
          </h2>
          
          <p style={{ 
            color: 'var(--text-secondary)', 
            maxWidth: '400px', 
            margin: '0 auto 20px',
            fontSize: '0.95rem',
            lineHeight: '1.6'
          }}>
            We built Studio Agents by recovering the lost archives of <strong style={{ color: '#00ff41' }}>Whip Montez</strong>—a Brooklyn MC who vanished before the digital age. Her story proves these tools can build a career from nothing.
          </p>

          <button 
            onClick={() => setShowShowcase(true)}
            className="haptic-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.2) 0%, rgba(0, 255, 65, 0.1) 100%)',
              border: '1px solid rgba(0, 255, 65, 0.4)',
              borderRadius: '14px',
              color: '#00ff41',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <Play size={18} />
            Enter The Archive
            <ChevronRight size={18} />
          </button>
        </div>
      </section>



      {/* Meet Your Dream Team - Agent Showcase */}
      <section className="agents-section">
        <div className="section-header">
          <div className="section-tag" style={{ 
            background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))', 
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Users size={14} />
            Your AI Dream Team
          </div>
          <h2 className="section-title" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)' }}>
            Meet the <span className="gradient-text-cyan-purple">16 Specialists</span>
            <br />
            <span style={{ fontSize: '0.45em', fontWeight: '400', color: 'var(--text-secondary)', display: 'block', marginTop: '8px' }}>
              Working 24/7 To Make You a Star
            </span>
          </h2>
          <p className="section-subtitle" style={{ maxWidth: '420px', margin: '0 auto' }}>
            Each agent is a master of their craft. From writing lyrics to mastering tracks, 
            your dream team handles it all.
          </p>
          
          {/* Team Stats Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '24px',
            flexWrap: 'wrap'
          }}>
            {[
              { value: '16', label: 'AI Agents', icon: Users },
              { value: '8', label: 'Categories', icon: LayoutGrid },
              { value: '∞', label: 'Creations', icon: Sparkles },
              { value: '24/7', label: 'Available', icon: Clock }
            ].map((stat, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                minWidth: '70px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <stat.icon size={16} className="text-purple" />
                  <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>{stat.value}</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="agents-scroll-container">
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '16px', 
            color: 'var(--text-secondary)', 
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <ArrowRight size={14} />
            <span>Swipe to meet the team</span>
          </div>
          <div className="agents-grid">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              const key = agent.id || agent.name;
              const isHovered = hoveredAgent === key;

              return (
                <div
                  key={key}
                  onMouseEnter={() => setHoveredAgent(key)}
                  onMouseLeave={() => setHoveredAgent(null)}
                  className={`agent-card-premium ${agent.colorClass} haptic-press`}
                  onClick={onEnter}
                >
                  <div className="agent-card-glow"></div>

                  <div className={`agent-card-content ${isHovered ? 'blurred' : ''}`}>
                    <div className="agent-icon-box">
                      <Icon size={24} className="text-white" />
                    </div>

                    <div className="agent-card-header-info">
                      <h3 className="agent-name">{agent.name}</h3>
                      <div className="agent-category-badge">{agent.category}</div>
                    </div>

                    <p className="agent-description">{agent.description}</p>

                    <div className="agent-card-action">
                      <span className="action-label">Open</span>
                      <div className="action-icon"><ArrowRight size={14} /></div>
                    </div>
                  </div>

                  <div className={`agent-card-overlay ${isHovered ? 'visible' : ''}`}>
                    <div className="overlay-scroll">
                      <div className="overlay-section">
                        <h4><Zap size={12} /> How to Use</h4>
                        <p>{agent.howTo || "Select this agent to start."}</p>
                      </div>
                      <div className="overlay-section">
                        <h4><Sparkles size={12} /> Example</h4>
                        <p className="example-text">"{agent.example || "Generate something amazing."}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Team CTA */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          maxWidth: '400px',
          margin: '32px auto 0'
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'white' }}>
            Ready to Meet Your Team?
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
            All 16 agents are standing by.
          </p>
          <button onClick={onEnter} className="cta-button-primary haptic-press" style={{ 
            padding: '14px 28px',
            fontSize: '1rem',
            borderRadius: '14px'
          }}>
            <Rocket size={18} />
            <span>Launch Studio</span>
          </button>
        </div>
      </section>

      {/* Consolidated: The Edge + What Artists Say */}
      <section style={{ padding: '60px 20px', background: 'var(--color-bg-secondary)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className="section-tag">The Edge</div>
            <h2 className="section-title">
              Why Artists <span className="gradient-text-purple-pink">Choose Us</span>
            </h2>
          </div>
          
          {/* Benefits Row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px', 
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            {[
              { icon: Zap, title: 'Instant Output', desc: 'Seconds, not days' },
              { icon: DollarSign, title: 'Save $4,700/yr', desc: 'Skip the middlemen' },
              { icon: Shield, title: 'You Own It', desc: '100% your rights' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} style={{
                  padding: '16px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--gradient-vibrant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px'
                  }}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px', color: 'white' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
          
          {/* Divider */}
          <div style={{ 
            width: '60px', 
            height: '2px', 
            background: 'var(--gradient-vibrant)', 
            margin: '0 auto 24px',
            borderRadius: '2px'
          }} />
          
          {/* Testimonials */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>What Artists Say</span>
          </div>
          
          {[
            { quote: "Dropped my EP in 2 weeks instead of 6 months. Studio Agents is insane.", name: "@prodbylex", role: "45K Spotify Monthly" },
            { quote: "I was stuck on writer's block for months. Ghostwriter unlocked me in one session.", name: "Mira Cole", role: "Indie R&B Artist" },
            { quote: "The marketing agent alone saved me $3K in consultant fees.", name: "DJ Phantom", role: "Club DJ, Atlanta" }
          ].map((t, i) => (
            <div key={i} style={{
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '12px'
            }}>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '10px', color: 'white', fontStyle: 'italic' }}>
                "{t.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: 'var(--gradient-vibrant)'
                }} />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{t.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
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
              name: 'Lifetime Access',
              price: '$99',
              period: 'one-time',
              features: ['Unlimited everything forever', 'Future updates included', 'Priority Support', 'Commercial License', 'Founder Badge'],
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
                onClick={() => onSubscribe && onSubscribe(plan)}
              >
                {plan.ltd ? 'Get Lifetime Access' : 'Start Free Trial'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="demo-section" style={{ padding: '80px 20px', background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 className="section-title">See It In <span className="gradient-text-cyan">Action</span></h2>
          <p className="section-subtitle">Generate a viral video pitch in seconds. Try it now.</p>
        </div>
        <VideoPitchDemo />
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
          <div className="footer-links">
            <button className="footer-link" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
            <span className="footer-divider">•</span>
            <button className="footer-link" onClick={() => setShowTerms(true)}>Terms of Service</button>
            <button className="footer-link" onClick={() => setShowShowcase(true)}>Restored OS Showcase</button>
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
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 10000 }}>
          <div className="legal-modal animate-scaleIn">
            <div className="modal-header">
              <h2>Privacy Policy</h2>
              <button className="modal-close" onClick={() => setShowPrivacy(false)}><X size={20} /></button>
            </div>
            <div className="modal-body legal-text">
              <h3>1. Information We Collect</h3>
              <p>We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or request customer support. This may include your name, email address, and payment information.</p>
              
              <h3>2. How We Use Your Information</h3>
              <p>We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect our company and our users. We also use this information to offer you tailored content – like giving you more relevant search results and ads.</p>
              
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
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 10000 }}>
          <div className="legal-modal animate-scaleIn">
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
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 10000 }}>
          <div className="legal-modal animate-scaleIn" style={{ 
            maxWidth: '650px',
            background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
            border: '1px solid rgba(0, 255, 65, 0.2)'
          }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(0, 255, 65, 0.2)' }}>
              <h2 style={{ color: '#00ff41', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={24} />
                RESTORED OS: The Lost Tapes
              </h2>
              <button className="modal-close" onClick={() => setShowShowcase(false)}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
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
                  <Headphones size={48} color="black" />
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
                  Brooklyn, NY • 1999-2003
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
                  In 2022, our team discovered a corrupted hard drive at an estate sale in Bed-Stuy. On it: 47 unreleased tracks, voice memos, and session files from an artist who called herself <strong style={{ color: '#00ff41' }}>Whip Montez</strong>.
                </p>
                
                <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '16px' }}>
                  She was a ghost. No social media. No streaming profiles. No Wikipedia. Just raw talent trapped on a dying 40GB drive from 2003. The music was fire, but the files were corrupted beyond repair.
                </p>
                
                <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7' }}>
                  So we built an <strong style={{ color: '#00ff41' }}>Alternative Reality Experience (ARE)</strong>—using AI to reconstruct what could have been. What if Whip had modern tools? What if she had Studio Agents?
                </p>
              </div>

              {/* What We Proved */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  color: 'white', 
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  marginBottom: '16px'
                }}>
                  What We Proved
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { icon: Music, title: '3 Lost Tapes Reconstructed', desc: 'Used Ghostwriter to complete fragmented lyrics and Beat Lab to rebuild production from corrupted stems.' },
                    { icon: Target, title: 'Y2K-Era Visual Identity', desc: 'Album Artist generated artwork that matched the aesthetic of 2001 Brooklyn hip-hop culture.' },
                    { icon: TrendingUp, title: '"What If" Career Trajectory', desc: 'Release Manager mapped a theoretical path from mixtapes to a major label deal by 2005.' },
                    { icon: Globe, title: 'Viral Documentary', desc: 'The ARE project generated 2.4M views and proved independent artists can build legacies with AI tools.' }
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
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
                        <div style={{ fontWeight: '600', color: 'white', fontSize: '0.95rem', marginBottom: '4px' }}>
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
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                textAlign: 'center'
              }}>
                <p style={{ 
                  color: 'white', 
                  fontSize: '1.1rem', 
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  If AI can resurrect a career from a broken hard drive...
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Imagine what it can do for yours.
                </p>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid rgba(0, 255, 65, 0.2)' }}>
              <button 
                className="cta-button-primary"
                onClick={() => { setShowShowcase(false); onEnter(); }}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
                  color: 'black'
                }}
              >
                <Zap size={18} />
                Enter The Studio
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marketing Modal - The Full Pitch */}
      {showMarketing && (
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 10000 }}>
          <div className="legal-modal animate-scaleIn" style={{ 
            maxWidth: '650px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Rocket size={24} style={{ color: 'var(--color-purple)' }} />
                The Independent Artist's Edge
              </h2>
              <button className="modal-close" onClick={() => setShowMarketing(false)}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* The Problem */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: 'white'
                }}>
                  The Old Way Is Broken
                </h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px' 
                }}>
                  {[
                    { stat: '$15,000', label: 'Avg cost to release an album', icon: DollarSign },
                    { stat: '6-12 months', label: 'Traditional timeline', icon: Clock },
                    { stat: '97%', label: 'Artists never recoup costs', icon: TrendingUp },
                    { stat: '40+ hours', label: 'Wasted on admin per release', icon: Target }
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: '16px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '14px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      textAlign: 'center'
                    }}>
                      <item.icon size={20} style={{ color: '#ef4444', marginBottom: '6px' }} />
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444' }}>
                        {item.stat}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Solution */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: 'white'
                }}>
                  The Studio Agents Way
                </h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px' 
                }}>
                  {[
                    { stat: '$60', label: 'Per year (lifetime $99)', icon: DollarSign },
                    { stat: '2 weeks', label: 'Average release cycle', icon: Clock },
                    { stat: '127K+', label: 'Active artists', icon: Users },
                    { stat: '847K', label: 'Songs created', icon: Music }
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: '16px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      borderRadius: '14px',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      textAlign: 'center'
                    }}>
                      <item.icon size={20} style={{ color: '#22c55e', marginBottom: '6px' }} />
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#22c55e' }}>
                        {item.stat}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What You Get */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: 'white'
                }}>
                  16 Specialists. One Subscription.
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { emoji: '✍️', name: 'Ghostwriter', desc: 'AI lyrics + hooks that match your style' },
                    { emoji: '🎹', name: 'Beat Lab', desc: 'Sample discovery + MIDI generation' },
                    { emoji: '🎨', name: 'Album Artist', desc: 'Cover art + visual identity' },
                    { emoji: '📹', name: 'Video Creator', desc: 'Visualizers + social content' },
                    { emoji: '📊', name: 'Trend Hunter', desc: 'Market intelligence + timing' },
                    { emoji: '🚀', name: 'Release Manager', desc: 'Rollout strategy + A&R analysis' }
                  ].map((agent, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>{agent.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: '600', color: 'white', marginRight: '8px' }}>{agent.name}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{agent.desc}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '10px', 
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem' 
                  }}>
                    + 10 more specialized agents
                  </div>
                </div>
              </div>

              {/* The Math */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                marginBottom: '20px'
              }}>
                <h4 style={{ 
                  color: 'white', 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  The Math Doesn't Lie
                </h4>
                
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Traditional</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ef4444', textDecoration: 'line-through' }}>$15K+</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowRight size={24} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Studio Agents</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#22c55e' }}>$99</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>lifetime</div>
                  </div>
                </div>
              </div>

              {/* Trust */}
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={16} style={{ fill: '#FFD700', color: '#FFD700' }} />)}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Rated 4.9/5 by 127,000+ artists
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cta-button-primary"
                onClick={() => { setShowMarketing(false); onEnter(true); }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Zap size={18} />
                Start Creating Free
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
