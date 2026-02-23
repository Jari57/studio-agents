import React, { useState } from 'react';
import {
  ArrowLeft, Dna, Upload, Image, Music, FileText, Video,
  Zap, Shield, Sparkles, Target, ChevronRight, CheckCircle,
  Layers, Fingerprint, Brain, Palette, Mic, Globe,
  Play, Star, BookOpen, HelpCircle, Lightbulb, Eye,
  RefreshCw, Lock, Award, TrendingUp
} from 'lucide-react';

// ============================================================
// DNA RESOURCE PAGE — Comprehensive Guide to the DNA System
// Premium styling with marketing pizzazz for IP showcase
// ============================================================

const ACCENT = '#a855f7';
const ACCENT_LIGHT = 'rgba(168, 85, 247, 0.15)';
const CYAN = '#06b6d4';
const PINK = '#ec4899';
const ORANGE = '#f97316';
const EMERALD = '#10b981';

const DNA_TYPES = [
  {
    id: 'visual',
    name: 'Visual DNA',
    icon: Image,
    color: ORANGE,
    tagline: 'Your Aesthetic Fingerprint',
    description: 'Upload mood boards, album art references, screenshots, or any visual that defines your artistic identity. Every AI-generated cover, thumbnail, and visual asset inherits your aesthetic DNA.',
    accepts: 'image/*',
    examples: [
      'Album cover mood boards',
      'Color palette references',
      'Photography style references',
      'Brand identity assets',
      'Stage/performance screenshots'
    ],
    howItWorks: 'Visual DNA is embedded into every image and video generation prompt. The AI models analyze color palettes, composition, mood, and stylistic elements from your reference — then reproduce that visual language across all outputs.',
    proTips: [
      'Upload 2-3 references with consistent color schemes for strongest DNA inheritance',
      'High-contrast, bold imagery produces the most distinctive AI outputs',
      'Include text-free references — the AI focuses on visual composition, not overlaid text',
      'Swap Visual DNA between projects for radically different aesthetics from the same lyrics'
    ]
  },
  {
    id: 'audio',
    name: 'Audio DNA',
    icon: Music,
    color: CYAN,
    tagline: 'Your Sonic Blueprint',
    description: 'Feed the AI your reference beats, samples, or backing tracks. It inherits tempo, key signature, timbre, and vibe — making every generated beat feel like an extension of your sound.',
    accepts: 'audio/*',
    examples: [
      'Reference beats or instrumentals',
      'Melodic loops or samples',
      'Full tracks for vibe matching',
      'Drum patterns or rhythmic references',
      'Ambient textures or pads'
    ],
    howItWorks: 'Audio DNA is analyzed for BPM, key, spectral characteristics, and mood. These parameters are injected into MusicGen and Riffusion prompts, ensuring generated audio shares the same sonic fingerprint as your reference.',
    proTips: [
      'Short 10-30s loops work best — the AI extracts key/tempo more accurately from focused clips',
      'Use Audio DNA + specific BPM settings together for maximum control',
      'Layer Audio DNA with complementary Visual DNA for cohesive album packages',
      'Export stems from your DAW and use individual elements as targeted DNA references'
    ]
  },
  {
    id: 'lyrics',
    name: 'Lyrics DNA',
    icon: FileText,
    color: ACCENT,
    tagline: 'Your Writing Signature',
    description: 'Upload reference lyrics, poetry, prose, or any text that captures your voice. The Ghostwriter agent learns your vocabulary, flow patterns, thematic tendencies, and writing style.',
    accepts: '.txt, .doc, .docx, .pdf',
    examples: [
      'Previous lyrics or song drafts',
      'Poetry or spoken word pieces',
      'Journal entries or creative writing',
      'Favorite artist lyrics (for style reference)',
      'Brand messaging or manifesto text'
    ],
    howItWorks: 'Lyrics DNA is prepended to every text generation prompt with a directive to match writing style, thematic patterns, vocabulary level, and emotional tone. The AI doesn\'t copy — it learns the essence of how you write.',
    proTips: [
      'Upload 3+ pages of your own writing for the strongest style match',
      'Include lyrics from different moods — the AI picks up your range, not just one tone',
      'PDF and DOCX files are extracted server-side — formatting is preserved',
      'Combine Lyrics DNA with specific genre/mood settings for genre-bending results'
    ]
  },
  {
    id: 'video',
    name: 'Seed DNA',
    icon: Video,
    color: PINK,
    tagline: 'Your Visual Starting Point',
    description: 'Provide a still frame, character design, or scene reference. The video generation pipeline uses this as a persistent seed — every frame inherits the visual anchor you define.',
    accepts: 'image/*',
    examples: [
      'Character portrait or avatar',
      'Scene establishing shot',
      'Album cover for animated video',
      'Storyboard frame',
      'Location or environment reference'
    ],
    howItWorks: 'Seed DNA is passed directly to the video generation model as the init_image parameter. This creates visual continuity — the AI builds motion and narrative around your provided anchor, ensuring the character or scene persists across all generated frames.',
    proTips: [
      'High-contrast images with clear subjects produce the most coherent video output',
      'Use your Visual DNA album cover as Seed DNA for perfectly matched music videos',
      'Square or 16:9 images work best — the AI adapts composition to the target aspect ratio',
      'Provide close-up portraits for character-driven narratives, wide shots for environmental pieces'
    ]
  }
];

const QUICK_START_STEPS = [
  {
    step: 1,
    title: 'Open the Studio Orchestrator',
    description: 'Navigate to the Studio tab and launch the AI Orchestrator. Your DNA Vault appears in the assets panel on the right.',
    icon: Zap
  },
  {
    step: 2,
    title: 'Upload Your DNA References',
    description: 'Click the DNA upload button on any slot — Visual, Audio, Lyrics, or Seed. Select your reference file. It uploads to secure cloud storage instantly.',
    icon: Upload
  },
  {
    step: 3,
    title: 'Watch the Green Badge',
    description: 'When DNA is active, a green "DNA REF" badge appears on the slot. This confirms every generation from that slot now inherits your creative identity.',
    icon: Shield
  },
  {
    step: 4,
    title: 'Generate with DNA',
    description: 'Hit Generate on any AI agent. Your DNA is automatically injected into the prompt pipeline — no extra steps. The output reflects your unique creative fingerprint.',
    icon: Sparkles
  },
  {
    step: 5,
    title: 'Persist Across Sessions',
    description: 'DNA references are saved to your profile in Firestore. Close the browser, come back tomorrow — your DNA is still loaded and active.',
    icon: RefreshCw
  }
];

const FAQ_ITEMS = [
  {
    q: 'How is DNA different from a regular prompt?',
    a: 'A prompt tells the AI what to create. DNA tells it who you are. Prompts change per generation — DNA persists across every output, creating a coherent artistic identity that makes all your content instantly recognizable.'
  },
  {
    q: 'Can I use multiple DNA types simultaneously?',
    a: 'Absolutely. In fact, stacking DNA types is the power move. Visual DNA + Audio DNA + Lyrics DNA together creates a multi-dimensional creative fingerprint. Every agent inherits all active DNA slots.'
  },
  {
    q: 'Does DNA affect voice/vocal generation?',
    a: 'Audio DNA influences the backing track and sonic environment. For vocal identity, use the Voice Clone system (separate from DNA) — upload 5-10 seconds of your voice and the AI creates a persistent vocal clone via ElevenLabs IVC.'
  },
  {
    q: 'How do I clear or swap DNA?',
    a: 'Click the DNA badge on any slot to reveal the clear button. DNA is also automatically cleared when you switch projects, giving each project its own creative identity.'
  },
  {
    q: 'Is my DNA data private and secure?',
    a: 'Yes. DNA files are stored in Firebase Storage with per-user authentication. Only you can access your DNA references. Files are encrypted in transit and at rest. We never use your DNA to train models or share with third parties.'
  },
  {
    q: 'What file sizes are supported?',
    a: 'Images up to 10MB, audio files up to 25MB, text documents up to 5MB. For best results, keep audio clips between 10-30 seconds and images under 4K resolution.'
  },
  {
    q: 'Can I use DNA with free-tier agents?',
    a: 'Yes! DNA upload and persistence works across all tiers. Free-tier agents (Ghostwriter, Music GPT, Album Artist, Viral Video) all support DNA inheritance.'
  },
  {
    q: 'What makes this different from other AI tools?',
    a: 'Most AI tools are stateless — every prompt starts from zero. Studio Agents\' DNA system creates persistent creative memory. Your artistic identity compounds over time, making outputs more "you" with every session. This is patented technology.'
  }
];

const IP_HIGHLIGHTS = [
  {
    title: 'Persistent Creative Memory',
    description: 'Unlike stateless AI tools, DNA references persist across sessions, projects, and agents — creating compounding creative identity.',
    icon: Brain
  },
  {
    title: 'Cross-Agent Inheritance',
    description: 'One DNA profile influences 16 specialized agents simultaneously. Lyrics, beats, visuals, and video all share your creative fingerprint.',
    icon: Layers
  },
  {
    title: 'Multi-Modal Fusion',
    description: 'Visual + Audio + Textual + Seed DNA creates a 4-dimensional creative identity that no single-modality tool can replicate.',
    icon: Fingerprint
  },
  {
    title: 'Seed-Persistent Video',
    description: 'Video DNA (Seed) acts as a visual anchor — ensuring character and scene consistency across every generated frame. No other platform offers this.',
    icon: Eye
  },
  {
    title: 'Mathematical DNA',
    description: 'Beat and visual generators use deterministic seed parameters derived from your DNA, enabling reproducible outputs with consistent artistic DNA.',
    icon: Target
  },
  {
    title: 'Neural Emotion Mapping',
    description: 'Lyrics DNA is analyzed for emotional sentiment. The AI aligns vocal delivery, musical mood, and visual tone to match your writing\'s emotional signature.',
    icon: Sparkles
  }
];

export default function DnaResourcePage({ onBack }) {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeDnaType, setActiveDnaType] = useState(0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 30%, #0a0a0f 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* ==================== HEADER ==================== */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 15, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', color: '#9ca3af',
            cursor: 'pointer', fontSize: '0.95rem', padding: '8px 12px',
            borderRadius: '8px', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.target.style.color = 'white'}
          onMouseLeave={e => e.target.style.color = '#9ca3af'}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Dna size={20} style={{ color: ACCENT }} />
          <span style={{ fontSize: '1rem', fontWeight: '600', letterSpacing: '0.05em' }}>
            DNA SYSTEM
          </span>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      {/* ==================== HERO SECTION ==================== */}
      <section style={{
        padding: '80px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: ACCENT_LIGHT, border: `1px solid rgba(168,85,247,0.3)`,
          borderRadius: '100px', padding: '6px 18px', marginBottom: '24px',
          fontSize: '0.85rem', color: ACCENT, fontWeight: '600', letterSpacing: '0.08em'
        }}>
          <Fingerprint size={14} /> PATENTED TECHNOLOGY
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: '800',
          fontFamily: 'Georgia, serif',
          lineHeight: '1.1',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #ffffff 0%, #a855f7 50%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Creative DNA System
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
          color: '#9ca3af',
          maxWidth: '720px',
          margin: '0 auto 32px',
          lineHeight: '1.7'
        }}>
          The world's first <strong style={{ color: 'white' }}>persistent AI creative identity</strong> system.
          Upload your references once — every AI agent inherits your artistic fingerprint across
          lyrics, beats, visuals, and video. <em>Your DNA. Your sound. Every time.</em>
        </p>

        {/* DNA Type Pills */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px',
          marginBottom: '40px'
        }}>
          {DNA_TYPES.map((dna, i) => {
            const Icon = dna.icon;
            return (
              <button
                key={dna.id}
                onClick={() => setActiveDnaType(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '100px',
                  background: activeDnaType === i ? `${dna.color}20` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeDnaType === i ? dna.color : 'rgba(255,255,255,0.1)'}`,
                  color: activeDnaType === i ? dna.color : '#9ca3af',
                  cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600',
                  transition: 'all 0.3s'
                }}
              >
                <Icon size={16} /> {dna.name}
              </button>
            );
          })}
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap'
        }}>
          {[
            { label: 'DNA Types', value: '4' },
            { label: 'AI Agents Supported', value: '16' },
            { label: 'Cross-Modal Fusion', value: '∞' },
            { label: 'Persistence', value: '24/7' }
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: ACCENT }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== DNA TYPE DEEP DIVE ==================== */}
      <section style={{ padding: '0 24px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        {(() => {
          const dna = DNA_TYPES[activeDnaType];
          const Icon = dna.icon;
          return (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${dna.color}30`,
              borderRadius: '24px',
              overflow: 'hidden'
            }}>
              {/* DNA Type Header */}
              <div style={{
                padding: '40px',
                background: `linear-gradient(135deg, ${dna.color}10, transparent)`,
                borderBottom: `1px solid ${dna.color}20`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: `${dna.color}20`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={28} style={{ color: dna.color }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', fontFamily: 'Georgia, serif', margin: 0 }}>
                      {dna.name}
                    </h2>
                    <p style={{ color: dna.color, fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>{dna.tagline}</p>
                  </div>
                </div>
                <p style={{ fontSize: '1.1rem', color: '#9ca3af', lineHeight: '1.7', maxWidth: '700px' }}>
                  {dna.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0' }}>
                {/* How It Works */}
                <div style={{ padding: '32px 40px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain size={18} style={{ color: dna.color }} /> How It Works
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#9ca3af', lineHeight: '1.7' }}>{dna.howItWorks}</p>
                </div>

                {/* What to Upload */}
                <div style={{ padding: '32px 40px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Upload size={18} style={{ color: dna.color }} /> What to Upload
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {dna.examples.map((ex, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#9ca3af', fontSize: '0.95rem' }}>
                        <CheckCircle size={14} style={{ color: EMERALD, flexShrink: 0 }} />
                        {ex}
                      </div>
                    ))}
                  </div>
                  <div style={{
                    marginTop: '16px', padding: '8px 14px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '0.85rem', color: '#6b7280'
                  }}>
                    Accepts: <code style={{ color: dna.color }}>{dna.accepts}</code>
                  </div>
                </div>
              </div>

              {/* Pro Tips */}
              <div style={{
                padding: '32px 40px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={18} style={{ color: '#f59e0b' }} /> Pro Tips
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {dna.proTips.map((tip, i) => (
                    <div key={i} style={{
                      padding: '14px 16px', borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.1)',
                      fontSize: '0.9rem', color: '#d1d5db', lineHeight: '1.5'
                    }}>
                      <Lightbulb size={14} style={{ color: '#f59e0b', marginRight: '8px', verticalAlign: 'middle' }} />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ==================== INTELLECTUAL PROPERTY SHOWCASE ==================== */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(180deg, rgba(168,85,247,0.04) 0%, transparent 100%)',
        borderTop: '1px solid rgba(168,85,247,0.1)',
        borderBottom: '1px solid rgba(168,85,247,0.1)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
              fontSize: '0.8rem', color: ACCENT, fontWeight: '700', letterSpacing: '0.1em'
            }}>
              <Award size={14} /> PROPRIETARY IP
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
              fontFamily: 'Georgia, serif', marginBottom: '12px'
            }}>
              What Makes DNA Different
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Six proprietary innovations that no other AI platform can replicate.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {IP_HIGHLIGHTS.map((ip, i) => {
              const Icon = ip.icon;
              return (
                <div key={i} style={{
                  padding: '28px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  transition: 'all 0.3s',
                  cursor: 'default'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: ACCENT_LIGHT, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
                  }}>
                    <Icon size={22} style={{ color: ACCENT }} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>{ip.title}</h3>
                  <p style={{ fontSize: '0.95rem', color: '#9ca3af', lineHeight: '1.6', margin: 0 }}>{ip.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== QUICK START GUIDE ==================== */}
      <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: `${EMERALD}15`, border: `1px solid ${EMERALD}30`,
            borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
            fontSize: '0.8rem', color: EMERALD, fontWeight: '700', letterSpacing: '0.1em'
          }}>
            <Play size={14} /> QUICK START
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '12px'
          }}>
            Get Started in 5 Steps
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1.05rem' }}>
            From zero to DNA-powered creation in under 60 seconds.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {QUICK_START_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} style={{ display: 'flex', gap: '24px', position: 'relative' }}>
                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${ACCENT}, ${PINK})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: '800', flexShrink: 0,
                    boxShadow: `0 0 20px rgba(168,85,247,0.3)`
                  }}>
                    {step.step}
                  </div>
                  {i < QUICK_START_STEPS.length - 1 && (
                    <div style={{
                      width: '2px', flex: 1, minHeight: '40px',
                      background: 'linear-gradient(to bottom, rgba(168,85,247,0.3), rgba(168,85,247,0.05))'
                    }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingBottom: '32px', paddingTop: '6px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={16} style={{ color: ACCENT }} /> {step.title}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#9ca3af', lineHeight: '1.6', margin: 0 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== DNA PIPELINE ARCHITECTURE ==================== */}
      <section style={{
        padding: '80px 24px',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: `${CYAN}15`, border: `1px solid ${CYAN}30`,
              borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
              fontSize: '0.8rem', color: CYAN, fontWeight: '700', letterSpacing: '0.1em'
            }}>
              <Layers size={14} /> ARCHITECTURE
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
              fontFamily: 'Georgia, serif', marginBottom: '12px'
            }}>
              The DNA Pipeline
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              How your creative identity flows through every AI agent.
            </p>
          </div>

          {/* Pipeline Visualization */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '40px'
          }}>
            {[
              { label: 'Upload', sublabel: 'Reference files', icon: Upload, color: '#6366f1' },
              { label: 'Extract', sublabel: 'Features & metadata', icon: Brain, color: ACCENT },
              { label: 'Inject', sublabel: 'Into AI prompts', icon: Zap, color: PINK },
              { label: 'Generate', sublabel: 'DNA-aware output', icon: Sparkles, color: ORANGE },
              { label: 'Persist', sublabel: 'Cloud storage', icon: Lock, color: EMERALD }
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '24px', textAlign: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: `${step.color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <Icon size={20} style={{ color: step.color }} />
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>{step.label}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{step.sublabel}</div>
                  {i < 4 && (
                    <div style={{
                      position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.15)', fontSize: '1.2rem', zIndex: 1,
                      display: 'none' // Hidden on mobile, shown conceptually
                    }}>→</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Technical Details */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '32px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px'
          }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: CYAN }}>
                Storage & Persistence
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Firebase Storage for binary assets (images, audio)',
                  'Firestore document for DNA URL references',
                  'Per-user authentication (only you access your DNA)',
                  'Automatic restoration on session reconnect',
                  'Cross-device sync via cloud persistence'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>
                    <CheckCircle size={14} style={{ color: CYAN, flexShrink: 0, marginTop: '3px' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: ACCENT }}>
                Prompt Injection Pipeline
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Visual DNA → aesthetic/color/composition directives',
                  'Audio DNA → tempo/key/timbre reference parameters',
                  'Lyrics DNA → writing style/vocabulary/theme inheritance',
                  'Seed DNA → init_image for video frame anchoring',
                  'All DNA types injected simultaneously per generation'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>
                    <CheckCircle size={14} style={{ color: ACCENT, flexShrink: 0, marginTop: '3px' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== DEMO / EXAMPLES ==================== */}
      <section style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: `${PINK}15`, border: `1px solid ${PINK}30`,
            borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
            fontSize: '0.8rem', color: PINK, fontWeight: '700', letterSpacing: '0.1em'
          }}>
            <Eye size={14} /> EXAMPLES
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '12px'
          }}>
            DNA in Action
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Real-world examples of how DNA transforms AI output.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {[
            {
              title: 'Dark Trap Album Package',
              dnaUsed: ['Visual DNA', 'Audio DNA', 'Lyrics DNA'],
              description: 'Uploaded a dark, moody cityscape as Visual DNA, a 808-heavy trap beat as Audio DNA, and aggressive street poetry as Lyrics DNA. Every output — cover art, instrumentals, and lyrics — shared the same cold, nocturnal energy.',
              result: 'Cohesive 5-track EP with matching artwork, all produced in one session.',
              color: ACCENT
            },
            {
              title: 'R&B Music Video',
              dnaUsed: ['Seed DNA', 'Visual DNA', 'Audio DNA'],
              description: 'Used a close-up portrait as Seed DNA and warm, golden-hour photography as Visual DNA. The video generator created smooth, character-consistent motion with ambient lighting that matched the Visual DNA palette.',
              result: '30-second music video with consistent character and mood across all frames.',
              color: PINK
            },
            {
              title: 'Bilingual Hip-Hop Release',
              dnaUsed: ['Lyrics DNA', 'Audio DNA'],
              description: 'Uploaded Spanglish lyrics as Lyrics DNA and a reggaeton-influenced beat as Audio DNA. Ghostwriter produced new verses that naturally code-switched between English and Spanish, matching the reference flow patterns.',
              result: 'Authentic bilingual track that maintained consistent linguistic style.',
              color: CYAN
            }
          ].map((example, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${example.color}20`,
              borderRadius: '16px', overflow: 'hidden'
            }}>
              <div style={{
                padding: '24px 24px 16px',
                background: `linear-gradient(135deg, ${example.color}08, transparent)`
              }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {example.dnaUsed.map(dna => (
                    <span key={dna} style={{
                      fontSize: '0.7rem', fontWeight: '700', padding: '3px 10px',
                      borderRadius: '100px', background: `${example.color}15`,
                      color: example.color, letterSpacing: '0.05em'
                    }}>
                      {dna.toUpperCase()}
                    </span>
                  ))}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>{example.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: '1.6', margin: 0 }}>{example.description}</p>
              </div>
              <div style={{
                padding: '16px 24px',
                borderTop: `1px solid ${example.color}15`,
                background: 'rgba(255,255,255,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <TrendingUp size={14} style={{ color: EMERALD }} />
                  <span style={{ color: EMERALD, fontWeight: '600' }}>Result:</span>
                  <span style={{ color: '#d1d5db' }}>{example.result}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== FAQ / HELP ==================== */}
      <section style={{
        padding: '80px 24px',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
              fontSize: '0.8rem', color: '#6366f1', fontWeight: '700', letterSpacing: '0.1em'
            }}>
              <HelpCircle size={14} /> FAQ & HELP
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
              fontFamily: 'Georgia, serif', marginBottom: '12px'
            }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FAQ_ITEMS.map((faq, i) => (
              <div key={i} style={{
                background: expandedFaq === i ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${expandedFaq === i ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '12px', overflow: 'hidden',
                transition: 'all 0.3s'
              }}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '18px 24px', background: 'none', border: 'none',
                    color: 'white', fontSize: '1rem', fontWeight: '600', textAlign: 'left',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  {faq.q}
                  <ChevronRight size={18} style={{
                    transform: expandedFaq === i ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 0.2s', color: '#6b7280', flexShrink: 0
                  }} />
                </button>
                {expandedFaq === i && (
                  <div style={{
                    padding: '0 24px 20px',
                    fontSize: '0.95rem', color: '#9ca3af', lineHeight: '1.7'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA FOOTER ==================== */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', bottom: '-200px', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '400px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1
        }}>
          <Dna size={40} style={{ color: ACCENT, marginBottom: '20px' }} />
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '16px'
          }}>
            Your DNA. Your Sound. Every Time.
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1.05rem', marginBottom: '32px', lineHeight: '1.7' }}>
            Stop creating from scratch. Upload your creative identity once and let 16 AI agents
            produce content that's unmistakably <em>you</em>.
          </p>
          <button
            onClick={() => { window.location.hash = '#/studio/agents'; }}
            style={{
              padding: '14px 36px', borderRadius: '100px', border: 'none',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', fontSize: '1.05rem', fontWeight: '700',
              cursor: 'pointer', letterSpacing: '0.03em',
              boxShadow: '0 0 30px rgba(168,85,247,0.3)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            Launch Studio →
          </button>
        </div>

        <div style={{
          marginTop: '48px', paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.8rem', color: '#4b5563'
        }}>
          © 2026 studioagentsai.com — DNA System is proprietary technology of Studio Agents DAI.
        </div>
      </section>
    </div>
  );
}
