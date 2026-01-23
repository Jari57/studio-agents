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
          content: `Studio Agents represents a paradigm shift in how creators build and manage their artistic careers. This platform is not merely a collection of toolsâ€"it's a living, breathing digital ecosystem that bridges the gap between creative vision and professional execution.

**What Makes Studio Agents Different:**
â€¢ 16 specialized AI agents, each an expert in their domain
â€¢ Unified project management across all creative disciplines
â€¢ Real-time collaboration and community features
â€¢ Enterprise-grade infrastructure with consumer simplicity
â€¢ Lifetime access options that grow with your career`
        },
        {
          heading: 'The Problem We Solve',
          content: `Modern creators face unprecedented challenges:

**Creative Friction**: Artists spend 70% of their time on logistics, only 30% on actual creation.

**Tool Fragmentation**: The average creator uses 12+ different apps to complete a single projectâ€"each with its own interface, learning curve, and subscription.

**Knowledge Gaps**: Professional-grade strategies that used to require teams and budgets are now essential for independent success.

**Lost Inspiration**: Ideas get buried in notes apps, voice memos, and forgotten files across devices.

Studio Agents consolidates these scattered workflows into one intelligent system that amplifies creativity rather than managing complexity.`
        },
        {
          heading: 'Platform Architecture',
          content: `Studio Agents is built on three foundational pillars:

**1. AI Agent Network**
Each agent is purpose-built with deep domain expertise:
â€¢ Trained on industry-specific data and best practices
â€¢ Contextually aware of your project history
â€¢ Capable of collaborative workflows between agents
â€¢ Continuously learning from user interactions

**2. Project Hub**
Your creative command center:
â€¢ Cross-agent asset management
â€¢ Version control and iteration tracking
â€¢ Intelligent organization and search
â€¢ Cloud sync across all devices

**3. Growth Engine**
Strategic tools for career advancement:
â€¢ Trend analysis and market insights
â€¢ Release planning and distribution guidance
â€¢ Community engagement features
â€¢ Analytics and performance tracking`
        },
        {
          heading: 'Security & Privacy',
          content: `Your creative work is your intellectual property. Studio Agents implements:

**Data Protection:**
â€¢ End-to-end encryption for all stored assets
â€¢ SOC 2 Type II compliant infrastructure
â€¢ Regular third-party security audits
â€¢ GDPR and CCPA compliance

**Ownership Guarantee:**
â€¢ You own 100% of everything you create
â€¢ No platform licensing or usage rights
â€¢ Optional public sharingâ€"always your choice
â€¢ Export functionality for all your assets

**AI Training Policy:**
â€¢ Your content is NEVER used to train AI models
â€¢ Opt-in only for anonymized usage analytics
â€¢ Transparent data handling practices`
        },
        {
          heading: 'Pricing Philosophy',
          content: `We believe in sustainable creator economics:

**Lifetime Deal (LTD):**
â€¢ One-time payment, lifetime access
â€¢ All current and future agents included
â€¢ Priority feature access
â€¢ Unlimited project storage
â€¢ Best value for committed creators

**Monthly Subscription:**
â€¢ Flexible month-to-month billing
â€¢ Same feature set as LTD
â€¢ Perfect for exploring the platform
â€¢ Cancel anytime, no penalties

**Free Tier:**
â€¢ Core agents always available
â€¢ Limited generations per month
â€¢ Full project management features
â€¢ Community access

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
â€¢ You own the copyright to music you create using AI tools
â€¢ AI-generated output is protected under "work for hire" doctrine when you direct the creation
â€¢ Registered copyrights for AI-assisted works are being granted worldwide

**What's Evolving:**
â€¢ Licensing requirements for AI training data
â€¢ Attribution standards for AI collaboration
â€¢ Platform-specific policies on AI content
â€¢ International treaty harmonization

**Studio Agents Position:**
â€¢ All our AI models are trained on licensed or public domain data
â€¢ We maintain transparency about our training sources
â€¢ You receive full commercial rights to your output
â€¢ We provide documentation for registration purposes`
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
â€¢ Register within 3 months of publication for full statutory protection
â€¢ Keep documentation of your creative process
â€¢ Save all prompts, iterations, and edits
â€¢ Maintain version history in Project Hub

**What Gets Protected:**
â€¢ Your original creative decisions and arrangements
â€¢ Unique combinations and selections
â€¢ Lyrics and melody structures you directed
â€¢ Production choices and mixing decisions`
        },
        {
          heading: 'Platform Policies',
          content: `Each distribution platform has specific AI content policies:

**Spotify:**
â€¢ Allows AI-generated music
â€¢ Requires disclosure if "prominently AI-created"
â€¢ No restrictions on human-AI collaboration
â€¢ Standard monetization applies

**Apple Music:**
â€¢ Accepts AI-assisted content
â€¢ No special disclosure required
â€¢ Same rights and royalties as traditional music
â€¢ Quality standards remain unchanged

**YouTube:**
â€¢ Permits AI music with proper rights
â€¢ Content ID system works normally
â€¢ Monetization available with AdSense
â€¢ Transparency encouraged but not mandated

**TikTok:**
â€¢ Welcomes creative AI use
â€¢ No discrimination in algorithm promotion
â€¢ Standard commercial music library terms
â€¢ Actively promotes AI innovation

**Studio Agents provides:**
â€¢ Platform-specific metadata formatting
â€¢ Automated disclosure statements where required
â€¢ Distribution checklist for AI content
â€¢ Updates as policies evolve`
        },
        {
          heading: 'Ethical Considerations',
          content: `Beyond legal compliance, consider ethical implications:

**Transparency:**
â€¢ Be honest about AI involvement in your creative process
â€¢ Audiences appreciate authenticity
â€¢ Builds trust and credibility
â€¢ Distinguishes you in the market

**Artist Collaboration:**
â€¢ If using AI trained on specific artists (with permission), credit them
â€¢ Respect stylistic influences and inspiration sources
â€¢ Support creators whose work advanced the technology

**Quality Standards:**
â€¢ Use AI to enhance, not replace, artistry
â€¢ Maintain high production values
â€¢ Let your unique voice shine through
â€¢ Push creative boundaries responsibly

**Community Impact:**
â€¢ Support fellow creators using AI tools
â€¢ Share knowledge and best practices
â€¢ Advocate for fair AI training compensation
â€¢ Champion inclusive access to technology

Studio Agents commits to ethical AI development through:
â€¢ Transparent training data sourcing
â€¢ Fair compensation to data contributors
â€¢ Open communication about our methods
â€¢ Active participation in industry standards development`
        },
        {
          heading: 'Future Outlook',
          content: `The legal and ethical landscape will continue evolving:

**Predicted Developments (2025-2027):**
â€¢ International treaties on AI content
â€¢ Standardized disclosure frameworks
â€¢ Enhanced creator protections
â€¢ Blockchain-based provenance tracking
â€¢ Automated licensing systems

**How Studio Agents Prepares You:**
â€¢ Automatic compliance updates
â€¢ Legal resource library
â€¢ Community forum discussions
â€¢ Webinars with music attorneys
â€¢ Template agreements and documentation

**Staying Current:**
â€¢ Subscribe to our Legal Updates newsletter
â€¢ Participate in monthly Legal Office Hours
â€¢ Access our partnership with music law firms
â€¢ Join our Creator Rights Advocacy group

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
â€¢ ${agent.name === 'Ghostwriter' ? 'Songwriting and lyric generation\nâ€¢ Hook and chorus development\nâ€¢ Verse structuring and rhyme schemes\nâ€¢ Genre-specific lyric styling' : 
agent.name === 'Beat Sage' ? 'Beat pattern creation\nâ€¢ Rhythm and tempo suggestions\nâ€¢ Genre-specific drum programming\nâ€¢ Production arrangement ideas' :
agent.name === 'Melody Mentor' ? 'Melodic composition\nâ€¢ Chord progression suggestions\nâ€¢ Harmonic analysis\nâ€¢ Counter-melody development' :
agent.name === 'Mix Master' ? 'Mixing advice and techniques\nâ€¢ EQ and compression guidance\nâ€¢ Spatial placement strategies\nâ€¢ Mastering preparation tips' :
'Creative problem-solving\nâ€¢ Technical guidance\nâ€¢ Industry best practices\nâ€¢ Workflow optimization'}

**Integration Points:**
${agent.name} works seamlessly with other agents in the Studio Agents ecosystem, allowing you to:
â€¢ Pass lyrics from Ghostwriter to Melody Mentor
â€¢ Use Beat Sage patterns with Mix Master techniques
â€¢ Combine outputs across your entire project
â€¢ Maintain context throughout your creative session`
        },
        {
          heading: 'Technical Capabilities',
          content: `**AI Model Architecture:**
${agent.name} uses a hybrid approach combining:
â€¢ Large Language Models (LLMs) for natural language understanding
â€¢ Domain-specific fine-tuning on curated datasets
â€¢ Real-time context awareness of your project
â€¢ Multi-turn conversation memory

**Training Data:**
â€¢ Professionally curated examples from licensed sources
â€¢ Industry standard techniques and methodologies
â€¢ User feedback and success patterns (anonymized)
â€¢ Regular updates with emerging trends

**Performance Specs:**
â€¢ Average response time: <2 seconds
â€¢ Context window: 8,000 tokens (approximately 6,000 words)
â€¢ Concurrent sessions: Unlimited
â€¢ Output quality: Professional-grade, production-ready

**Customization Options:**
â€¢ Tone and style preferences
â€¢ Complexity and sophistication levels
â€¢ Genre-specific optimizations
â€¢ Personal voice and preference learning`
        },
        {
          heading: 'Best Practices',
          content: `**Getting Started:**
1. Provide clear context about your project
2. Specify your goals and target audience
3. Share relevant reference materials
4. Set expectations for style and tone

**Optimal Prompting:**
â€¢ Be specific about what you want
â€¢ Provide examples of desired output
â€¢ Iterate and refine based on results
â€¢ Use follow-up questions to drill down

**Common Pitfalls to Avoid:**
â€¢ Vague or overly broad requests
â€¢ Expecting perfection on first generation
â€¢ Not providing enough context
â€¢ Ignoring the iteration process

**Power User Tips:**
â€¢ Save successful prompts as templates
â€¢ Build a personal prompt library
â€¢ Experiment with different phrasing
â€¢ Combine agents for complex workflows
â€¢ Use Project Hub to track iterations`
        },
        {
          heading: 'Advanced Features',
          content: `**Context Awareness:**
${agent.name} remembers your conversation history and project details, allowing for:
â€¢ Natural follow-up questions
â€¢ Consistent style across generations
â€¢ Reference to previous outputs
â€¢ Cumulative learning within a session

**Batch Processing:**
Generate multiple variations simultaneously:
â€¢ Create 5 different hooks at once
â€¢ Explore various approaches to a challenge
â€¢ A/B test different creative directions
â€¢ Save your favorites to Project Hub

**Collaboration Mode:**
Invite other agents into the conversation:
â€¢ Get Ghostwriter lyrics, then ask Melody Mentor for melodic ideas
â€¢ Combine Beat Sage rhythms with Mix Master production tips
â€¢ Create complete creative packages in one session

**Export Options:**
â€¢ Plain text for lyrics and prompts
â€¢ Formatted documents (PDF, DOCX)
â€¢ Direct integration with DAWs (coming soon)
â€¢ Social media optimized formats`
        },
        {
          heading: 'Quality Assurance',
          content: `**How We Ensure Excellence:**

**Human-in-the-Loop Review:**
â€¢ Continuous monitoring of output quality
â€¢ Regular testing against professional standards
â€¢ User feedback integration
â€¢ A/B testing of model improvements

**Quality Metrics:**
â€¢ Relevance to prompt: 95%+ user satisfaction
â€¢ Originality score: Verified unique output
â€¢ Professional grade: Industry expert reviewed
â€¢ Usability: Ready for immediate application

**When Things Don't Work:**
â€¢ Use the feedback button to report issues
â€¢ Try rephrasing your prompt
â€¢ Check the Help Center for examples
â€¢ Contact support for personalized assistance

**Continuous Improvement:**
${agent.name} gets smarter over time:
â€¢ Weekly model updates
â€¢ Monthly feature additions
â€¢ Quarterly major enhancements
â€¢ Lifetime access means lifetime improvements`
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
              <span>ðŸ"– {selectedWhitepaper.readTime} read</span>
              <span>â€¢</span>
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
