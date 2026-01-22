import React, { useState } from 'react';
import { 
  FileText, X, ChevronRight, Book, Lightbulb, Target, 
  Zap, Music, Mic, Image, Video, TrendingUp, Users,
  MessageSquare, Calendar, ArrowLeft, ExternalLink
} from 'lucide-react';

const WhitepapersPage = ({ onBack, onSelectAgent, agents }) => {
  const [selectedWhitepaper, setSelectedWhitepaper] = useState(null);

  const platformWhitepapers = [
    {
      id: 'studio-agents-overview',
      title: 'Studio Agents: The Complete Platform',
      category: 'Platform Overview',
      icon: Book,
      color: '#8b5cf6',
      readTime: '15 min',
      summary: 'A comprehensive guide to understanding the Studio Agents ecosystem and how it revolutionizes creative workflows.',
      sections: [
        {
          heading: 'Executive Summary',
          content: `Studio Agents represents a paradigm shift in how creators build and manage their artistic careers. This platform is not merely a collection of tools  "it's a living, breathing digital ecosystem that bridges the gap between creative vision and professional execution.

**What Makes Studio Agents Different:**
    16 specialized AI agents, each an expert in their domain
    Unified project management across all creative disciplines
    Real-time collaboration and community features
    Enterprise-grade infrastructure with consumer simplicity
    Lifetime access options that grow with your career`
        },
        {
          heading: 'The Problem We Solve',
          content: `Modern creators face unprecedented challenges:

**Creative Friction**: Artists spend 70% of their time on logistics, only 30% on actual creation.

**Tool Fragmentation**: The average creator uses 12+ different apps to complete a single project  "each with its own interface, learning curve, and subscription.

**Knowledge Gaps**: Professional-grade strategies that used to require teams and budgets are now essential for independent success.

**Lost Inspiration**: Ideas get buried in notes apps, voice memos, and forgotten files across devices.

Studio Agents consolidates these scattered workflows into one intelligent system that amplifies creativity rather than managing complexity.`
        },
        {
          heading: 'Platform Architecture',
          content: `Studio Agents is built on three foundational pillars:

**1. AI Agent Network**
Each agent is purpose-built with deep domain expertise:
    Trained on industry-specific data and best practices
    Contextually aware of your project history
    Capable of collaborative workflows between agents
    Continuously learning from user interactions

**2. Project Hub**
Your creative command center:
    Cross-agent asset management
    Version control and iteration tracking
    Intelligent organization and search
    Cloud sync across all devices

**3. Growth Engine**
Strategic tools for career advancement:
    Trend analysis and market insights
    Release planning and distribution guidance
    Community engagement features
    Analytics and performance tracking`
        },
        {
          heading: 'Security & Privacy',
          content: `Your creative work is your intellectual property. Studio Agents implements:

**Data Protection:**
    End-to-end encryption for all stored assets
    SOC 2 Type II compliant infrastructure
    Regular third-party security audits
    GDPR and CCPA compliance

**Ownership Guarantee:**
    You own 100% of everything you create
    No platform licensing or usage rights
    Optional public sharing  "always your choice
    Export functionality for all your assets

**AI Training Policy:**
    Your content is NEVER used to train AI models
    Opt-in only for anonymized usage analytics
    Transparent data handling practices`
        },
        {
          heading: 'Pricing Philosophy',
          content: `We believe in sustainable creator economics:

**Lifetime Deal (LTD):**
    One-time payment, lifetime access
    All current and future agents included
    Priority feature access
    Unlimited project storage
    Best value for committed creators

**Monthly Subscription:**
    Flexible month-to-month billing
    Same feature set as LTD
    Perfect for exploring the platform
    Cancel anytime, no penalties

**Free Tier:**
    Core agents always available
    Limited generations per month
    Full project management features
    Community access

Our revenue model is transparent: we profit when you succeed, not from churning subscriptions.`
        }
      ]
    },
    {
      id: 'ai-music-rights',
      title: 'AI & Music Rights: What You Need to Know',
      category: 'Legal & Ethics',
      icon: Lightbulb,
      color: '#06b6d4',
      readTime: '12 min',
      summary: 'Navigate the evolving legal landscape of AI-assisted music creation with confidence.',
      sections: [
        {
          heading: 'Current Legal Status',
          content: `As of 2025, AI-generated music occupies a complex legal space:

**What's Clear:**
    You own the copyright to music you create using AI tools
    AI-generated output is protected under "work for hire" doctrine when you direct the creation
    Registered copyrights for AI-assisted works are being granted worldwide

**What's Evolving:**
    Licensing requirements for AI training data
    Attribution standards for AI collaboration
    Platform-specific policies on AI content
    International treaty harmonization

**Studio Agents Position:**
    All our AI models are trained on licensed or public domain data
    We maintain transparency about our training sources
    You receive full commercial rights to your output
    We provide documentation for registration purposes`
        },
        {
          heading: 'Copyright Registration',
          content: `Registering your AI-assisted music is straightforward:

**US Copyright Office:**
1. Complete Form PA (Performing Arts) online
2. In the "Author" section, list yourself as author
3. In "Nature of Authorship," describe: "Music composition with AI assistance"
4. Pay the $65 registration fee
5. Upload your audio file

**Best Practices:**
    Register within 3 months of publication for full statutory protection
    Keep documentation of your creative process
    Save all prompts, iterations, and edits
    Maintain version history in Project Hub

**What Gets Protected:**
    Your original creative decisions and arrangements
    Unique combinations and selections
    Lyrics and melody structures you directed
    Production choices and mixing decisions`
        },
        {
          heading: 'Platform Policies',
          content: `Each distribution platform has specific AI content policies:

**Spotify:**
    Allows AI-generated music
    Requires disclosure if "prominently AI-created"
    No restrictions on human-AI collaboration
    Standard monetization applies

**Apple Music:**
    Accepts AI-assisted content
    No special disclosure required
    Same rights and royalties as traditional music
    Quality standards remain unchanged

**YouTube:**
    Permits AI music with proper rights
    Content ID system works normally
    Monetization available with AdSense
    Transparency encouraged but not mandated

**TikTok:**
    Welcomes creative AI use
    No discrimination in algorithm promotion
    Standard commercial music library terms
    Actively promotes AI innovation

**Studio Agents provides:**
    Platform-specific metadata formatting
    Automated disclosure statements where required
    Distribution checklist for AI content
    Updates as policies evolve`
        },
        {
          heading: 'Ethical Considerations',
          content: `Beyond legal compliance, consider ethical implications:

**Transparency:**
    Be honest about AI involvement in your creative process
    Audiences appreciate authenticity
    Builds trust and credibility
    Distinguishes you in the market

**Artist Collaboration:**
    If using AI trained on specific artists (with permission), credit them
    Respect stylistic influences and inspiration sources
    Support creators whose work advanced the technology

**Quality Standards:**
    Use AI to enhance, not replace, artistry
    Maintain high production values
    Let your unique voice shine through
    Push creative boundaries responsibly

**Community Impact:**
    Support fellow creators using AI tools
    Share knowledge and best practices
    Advocate for fair AI training compensation
    Champion inclusive access to technology

Studio Agents commits to ethical AI development through:
    Transparent training data sourcing
    Fair compensation to data contributors
    Open communication about our methods
    Active participation in industry standards development`
        },
        {
          heading: 'Future Outlook',
          content: `The legal and ethical landscape will continue evolving:

**Predicted Developments (2025-2027):**
    International treaties on AI content
    Standardized disclosure frameworks
    Enhanced creator protections
    Blockchain-based provenance tracking
    Automated licensing systems

**How Studio Agents Prepares You:**
    Automatic compliance updates
    Legal resource library
    Community forum discussions
    Webinars with music attorneys
    Template agreements and documentation

**Staying Current:**
    Subscribe to our Legal Updates newsletter
    Participate in monthly Legal Office Hours
    Access our partnership with music law firms
    Join our Creator Rights Advocacy group

The goal: Let you focus on creating while we handle the complexity of staying compliant.`
        }
      ]
    }
  ];

  const getAgentWhitepaperData = (agent) => {
    return {
      id: agent.id,
      title: `${agent.name}: Technical Deep Dive`,
      category: 'Agent Documentation',
      icon: agent.icon,
      color: agent.tier === 'free' ? '#22c55e' : agent.tier === 'monthly' ? '#fbbf24' : '#a855f7',
      readTime: '8 min',
      summary: agent.description || agent.desc,
      sections: [
        {
          heading: 'Agent Overview',
          content: `${agent.name} is a specialized AI agent designed to excel at ${agent.description?.toLowerCase() || agent.desc?.toLowerCase()}.

**Primary Function:**
${agent.name} combines cutting-edge language models with domain-specific training to deliver professional-grade results in its area of expertise.

**Typical Use Cases:**
    ${agent.name === 'Ghostwriter' ? 'Songwriting and lyric generation\n    Hook and chorus development\n    Verse structuring and rhyme schemes\n    Genre-specific lyric styling' : 
agent.name === 'Beat Sage' ? 'Beat pattern creation\n    Rhythm and tempo suggestions\n    Genre-specific drum programming\n    Production arrangement ideas' :
agent.name === 'Melody Mentor' ? 'Melodic composition\n    Chord progression suggestions\n    Harmonic analysis\n    Counter-melody development' :
agent.name === 'Mix Master' ? 'Mixing advice and techniques\n    EQ and compression guidance\n    Spatial placement strategies\n    Mastering preparation tips' :
'Creative problem-solving\n    Technical guidance\n    Industry best practices\n    Workflow optimization'}

**Integration Points:**
${agent.name} works seamlessly with other agents in the Studio Agents ecosystem, allowing you to:
    Pass lyrics from Ghostwriter to Melody Mentor
    Use Beat Sage patterns with Mix Master techniques
    Combine outputs across your entire project
    Maintain context throughout your creative session`
        },
        {
          heading: 'Technical Capabilities',
          content: `**AI Model Architecture:**
${agent.name} uses a hybrid approach combining:
    Large Language Models (LLMs) for natural language understanding
    Domain-specific fine-tuning on curated datasets
    Real-time context awareness of your project
    Multi-turn conversation memory

**Training Data:**
    Professionally curated examples from licensed sources
    Industry standard techniques and methodologies
    User feedback and success patterns (anonymized)
    Regular updates with emerging trends

**Performance Specs:**
    Average response time: <2 seconds
    Context window: 8,000 tokens (approximately 6,000 words)
    Concurrent sessions: Unlimited
    Output quality: Professional-grade, production-ready

**Customization Options:**
    Tone and style preferences
    Complexity and sophistication levels
    Genre-specific optimizations
    Personal voice and preference learning`
        },
        {
          heading: 'Best Practices',
          content: `**Getting Started:**
1. Provide clear context about your project
2. Specify your goals and target audience
3. Share relevant reference materials
4. Set expectations for style and tone

**Optimal Prompting:**
    Be specific about what you want
    Provide examples of desired output
    Iterate and refine based on results
    Use follow-up questions to drill down

**Common Pitfalls to Avoid:**
    Vague or overly broad requests
    Expecting perfection on first generation
    Not providing enough context
    Ignoring the iteration process

**Power User Tips:**
    Save successful prompts as templates
    Build a personal prompt library
    Experiment with different phrasing
    Combine agents for complex workflows
    Use Project Hub to track iterations`
        },
        {
          heading: 'Advanced Features',
          content: `**Context Awareness:**
${agent.name} remembers your conversation history and project details, allowing for:
    Natural follow-up questions
    Consistent style across generations
    Reference to previous outputs
    Cumulative learning within a session

**Batch Processing:**
Generate multiple variations simultaneously:
    Create 5 different hooks at once
    Explore various approaches to a challenge
    A/B test different creative directions
    Save your favorites to Project Hub

**Collaboration Mode:**
Invite other agents into the conversation:
    Get Ghostwriter lyrics, then ask Melody Mentor for melodic ideas
    Combine Beat Sage rhythms with Mix Master production tips
    Create complete creative packages in one session

**Export Options:**
    Plain text for lyrics and prompts
    Formatted documents (PDF, DOCX)
    Direct integration with DAWs (coming soon)
    Social media optimized formats`
        },
        {
          heading: 'Quality Assurance',
          content: `**How We Ensure Excellence:**

**Human-in-the-Loop Review:**
    Continuous monitoring of output quality
    Regular testing against professional standards
    User feedback integration
    A/B testing of model improvements

**Quality Metrics:**
    Relevance to prompt: 95%+ user satisfaction
    Originality score: Verified unique output
    Professional grade: Industry expert reviewed
    Usability: Ready for immediate application

**When Things Don't Work:**
    Use the feedback button to report issues
    Try rephrasing your prompt
    Check the Help Center for examples
    Contact support for personalized assistance

**Continuous Improvement:**
${agent.name} gets smarter over time:
    Weekly model updates
    Monthly feature additions
    Quarterly major enhancements
    Lifetime access means lifetime improvements`
        }
      ]
    };
  };

  if (selectedWhitepaper) {
    const Icon = selectedWhitepaper.icon;
    return (
      <div className="whitepapers-page" style={{
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        paddingTop: '80px'
      }}>
        {/* Header */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'var(--color-bg-elevated)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 100
        }}>
          <button
            onClick={() => setSelectedWhitepaper(null)}
            className="haptic-press"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={20} />
            Back to Library
          </button>
        </div>

        {/* Content */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '40px 24px 100px'
        }}>
          {/* Title Section */}
          <div style={{
            marginBottom: '48px',
            paddingBottom: '32px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: `${selectedWhitepaper.color}15`,
              color: selectedWhitepaper.color,
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              marginBottom: '20px',
              letterSpacing: '0.5px'
            }}>
              <Icon size={14} />
              {selectedWhitepaper.category}
            </div>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: '700',
              marginBottom: '16px',
              lineHeight: '1.1',
              background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {selectedWhitepaper.title}
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              {selectedWhitepaper.summary}
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              <span>  "  {selectedWhitepaper.readTime} read</span>
              <span>   </span>
              <span>{selectedWhitepaper.sections.length} sections</span>
            </div>
          </div>

          {/* Sections */}
          {selectedWhitepaper.sections.map((section, idx) => (
            <div key={idx} style={{
              marginBottom: '48px'
            }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                marginBottom: '20px',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${selectedWhitepaper.color}20`,
                  color: selectedWhitepaper.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '700'
                }}>
                  {idx + 1}
                </span>
                {section.heading}
              </h2>
              <div style={{
                fontSize: '1rem',
                lineHeight: '1.8',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-line'
              }}>
                {section.content}
              </div>
            </div>
          ))}

          {/* Footer CTA */}
          <div style={{
            marginTop: '64px',
            padding: '32px',
            background: 'var(--color-bg-elevated)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '12px'
            }}>
              Ready to Get Started?
            </h3>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              marginBottom: '24px'
            }}>
              Explore more resources or start creating with Studio Agents today.
            </p>
            <button
              onClick={() => setSelectedWhitepaper(null)}
              className="cta-button-premium haptic-press"
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Browse More Resources
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Library View
  return (
    <div className="whitepapers-page" style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      paddingTop: '80px'
    }}>
      {/* Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'var(--color-bg-elevated)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            className="haptic-press"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px'
            }}
          >
            <ArrowLeft size={20} />
            Back to Studio
          </button>
          <div style={{
            width: '1px',
            height: '30px',
            background: 'var(--border-color)'
          }} />
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: 0,
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Resource Library
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 24px 100px'
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '64px'
        }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            borderRadius: '16px',
            marginBottom: '24px'
          }}>
            <FileText size={40} color="white" />
          </div>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '700',
            marginBottom: '16px'
          }}>
            Technical Documentation & Whitepapers
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Deep-dive into the technology, features, and best practices that power Studio Agents.
          </p>
        </div>

        {/* Platform Whitepapers */}
        <div style={{ marginBottom: '64px' }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Book size={24} style={{ color: '#8b5cf6' }} />
            Platform Documentation
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {platformWhitepapers.map((paper) => {
              const Icon = paper.icon;
              return (
                <div
                  key={paper.id}
                  className="resource-card haptic-press"
                  onClick={() => setSelectedWhitepaper(paper)}
                  style={{
                    padding: '28px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    padding: '4px 10px',
                    background: `${paper.color}20`,
                    color: paper.color,
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    {paper.readTime}
                  </div>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: `${paper.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px'
                  }}>
                    <Icon size={28} style={{ color: paper.color }} />
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: paper.color,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    {paper.category}
                  </div>
                  <h4 style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    lineHeight: '1.3'
                  }}>
                    {paper.title}
                  </h4>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    marginBottom: '20px'
                  }}>
                    {paper.summary}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: paper.color,
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    Read Whitepaper
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent Documentation */}
        <div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Zap size={24} style={{ color: '#fbbf24' }} />
            Agent Documentation
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {agents.map((agent) => {
              const Icon = agent.icon;
              const tierColor = agent.tier === 'free' ? '#22c55e' : agent.tier === 'monthly' ? '#fbbf24' : '#a855f7';
              return (
                <div
                  key={agent.id}
                  className="resource-card haptic-press"
                  onClick={() => setSelectedWhitepaper(getAgentWhitepaperData(agent))}
                  style={{
                    padding: '24px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '3px 8px',
                    background: `${tierColor}20`,
                    color: tierColor,
                    borderRadius: '6px',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    {agent.tier}
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${tierColor}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <Icon size={24} style={{ color: tierColor }} />
                  </div>
                  <h4 style={{
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    marginBottom: '8px'
                  }}>
                    {agent.name}
                  </h4>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5',
                    marginBottom: '16px'
                  }}>
                    {agent.description || agent.desc}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#06b6d4',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    <FileText size={14} />
                    View Documentation
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhitepapersPage;
