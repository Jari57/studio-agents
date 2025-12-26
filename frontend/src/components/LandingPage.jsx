import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Zap, Music, Crown, Users, Globe, PlayCircle, Target, Rocket, Shield, Folder, Book, X, Play } from 'lucide-react';
import { AGENTS } from '../constants';

export default function LandingPage({ onEnter, onSubscribe }) {
  console.log("LandingPage: Rendering...");
  const [hoveredAgent, setHoveredAgent] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);

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

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <div className="hero-cta-container">
            <button
              onClick={onEnter}
              className="cta-button-premium haptic-press hero-cta-button"
            >
              <span>Start Creating for Free</span>
              <ArrowRight size={24} />
            </button>
            <span className="hero-cta-subtext">
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

      {/* Agent Showcase Section - Grouped by Category */}
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
          {/* Group Agents by Category */}
          {Object.entries(AGENTS.reduce((acc, agent) => {
            const category = agent.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(agent);
            return acc;
          }, {})).map(([category, categoryAgents]) => (
            <div key={category} className="agent-category-group" style={{ marginBottom: '60px' }}>
              <h3 className="category-header" style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                marginBottom: '24px',
                paddingLeft: '20px',
                borderLeft: '4px solid var(--color-accent-primary)',
                marginLeft: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {category} Agents
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: '500', 
                  color: 'var(--text-secondary)', 
                  background: 'rgba(255,255,255,0.1)', 
                  padding: '4px 10px', 
                  borderRadius: '20px' 
                }}>
                  {categoryAgents.length}
                </span>
              </h3>
              <div className="agents-grid">
                {categoryAgents.map((agent) => {
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
                      {/* Background glow */}
                      <div className="agent-card-glow"></div>

                      {/* Content */}
                      <div className={`agent-card-content ${isHovered ? 'blurred' : ''}`}>
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

                      {/* Hover Overlay */}
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
                            <div className="overlay-section">
                                <h4><Play size={12} /> Get Started</h4>
                                <p>{agent.getStarted || "Click to open."}</p>
                            </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
              name: 'Lifetime Access',
              price: '$199',
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

      {/* Showcase Modal */}
      {showShowcase && (
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 10000 }}>
          <div className="legal-modal animate-scaleIn" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Restored OS: The Whip Montez Project</h2>
              <button className="modal-close" onClick={() => setShowShowcase(false)}><X size={20} /></button>
            </div>
            <div className="modal-body legal-text">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  background: '#00ff41', 
                  borderRadius: '50%', 
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)'
                }}>
                  <Sparkles size={40} color="black" />
                </div>
                <h3 style={{ color: '#00ff41' }}>An Alternative Reality Experience</h3>
              </div>
              
              <p><strong>Studio Agents</strong> began as a digital preservation project known as "Restored OS."</p>
              
              <p>We reconstructed the lost digital archives of <strong>Whip Montez</strong>, a Brooklyn MC from the early 2000s whose career vanished before the digital age took over.</p>
              
              <p>This project served as the "Proof of Concept" for the AI tools you see today. By using AI to reconstruct her lyrics, beats, and visual identity, we proved that these agents could empower any artist to build a career from scratch.</p>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
                <h4 style={{ marginTop: 0 }}>Case Study Highlights:</h4>
                <ul style={{ paddingLeft: '20px', margin: '10px 0 0' }}>
                  <li>Reconstructed 3 "Lost Tapes" using <strong>Beat Lab</strong> & <strong>Ghostwriter</strong>.</li>
                  <li>Generated Y2K-era visuals using <strong>Album Artist</strong>.</li>
                  <li>Built a "what if" career trajectory using <strong>Release Manager</strong>.</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowShowcase(false)}>Close Showcase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
