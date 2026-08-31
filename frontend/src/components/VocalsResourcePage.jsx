import React, { useState } from 'react';
import {
  ArrowLeft, Mic, Mic2, Upload, Volume2, Headphones,
  Zap, Shield, Sparkles, Target, ChevronRight, CheckCircle,
  Layers, Brain, Globe, Music, Play, Star, HelpCircle,
  Lightbulb, Eye, RefreshCw, Lock, Award, TrendingUp,
  Settings, Sliders, Radio, Wand2, Users, Heart, Waves
} from 'lucide-react';

// ============================================================
// VOCALS RESOURCE PAGE — Complete Guide to Voice & Vocal System
// Premium styling with marketing focus on vocal IP
// ============================================================

const ACCENT = 'var(--studio-accent)';
const ACCENT_LIGHT = 'var(--studio-accent-soft)';
const CYAN = 'var(--studio-sage)';
const PINK = 'var(--studio-accent)';
const ORANGE = 'var(--studio-accent)';
const EMERALD = 'var(--studio-sage)';
const INDIGO = 'var(--studio-sage)';

const VOICE_STYLES = [
  {
    id: 'rapper',
    name: 'Rapper (Male)',
    icon: Mic2,
    color: ACCENT,
    tagline: 'From Aggressive to Chill',
    description: 'Eight distinct rap delivery styles powered by curated ElevenLabs voices. Each rapStyle maps to a hand-picked voice with matching energy, tone, and cadence.',
    subStyles: [
      { name: 'Aggressive', voice: 'Arnold — deep, commanding', use: 'Diss tracks, battle rap, hard-hitting verses' },
      { name: 'Melodic', voice: 'Antoni — warm, smooth', use: 'Melodic rap, Drake/Juice WRLD style' },
      { name: 'Trap', voice: 'Josh — young energy', use: 'Modern trap, ad-lib heavy, Young Thug flow' },
      { name: 'Drill', voice: 'Patrick — dark, serious', use: 'UK/NY drill, menacing delivery' },
      { name: 'Boom-Bap', voice: 'Adam — mature, classic', use: '90s hip-hop, storytelling, conscious rap' },
      { name: 'Fast', voice: 'Sam — quick, articulate', use: 'Fast flows, Eminem/Tech N9ne style' },
      { name: 'Chill', voice: 'Eric — relaxed, casual', use: 'Lo-fi, laid-back vibes, conversational' },
      { name: 'Hype', voice: 'Callum — energetic', use: 'Club bangers, energy records, festival drops' }
    ]
  },
  {
    id: 'rapper-female',
    name: 'Rapper (Female)',
    icon: Mic,
    color: PINK,
    tagline: 'Powerful to Bold',
    description: 'Three curated female rap voices with style-specific mapping. From aggressive Nicki energy to bold Megan Thee Stallion delivery.',
    subStyles: [
      { name: 'Aggressive', voice: 'Freya — powerful', use: 'Hard bars, commanding presence' },
      { name: 'Melodic', voice: 'Jessica — expressive', use: 'Melodic rap, emotional delivery' },
      { name: 'Trap/Hype', voice: 'Domi — bold energy', use: 'Trap, hype, high-energy verses' }
    ]
  },
  {
    id: 'singer',
    name: 'Singer (Male)',
    icon: Music,
    color: CYAN,
    tagline: 'Soulful to Bright',
    description: 'Genre-mapped male singing voices. The AI selects the optimal voice based on your chosen genre — R&B gets warmth, pop gets clarity, soul gets richness.',
    subStyles: [
      { name: 'R&B', voice: 'Antoni — soulful', use: 'Smooth R&B, neo-soul, slow jams' },
      { name: 'Pop', voice: 'Liam — clean, bright', use: 'Pop hooks, catchy melodies' },
      { name: 'Hip-Hop', voice: 'Josh — versatile', use: 'Melodic hip-hop hooks, singing rap' },
      { name: 'Soul', voice: 'George — rich, warm', use: 'Classic soul, gospel-influenced' }
    ]
  },
  {
    id: 'singer-female',
    name: 'Singer (Female)',
    icon: Heart,
    color: ORANGE,
    tagline: 'Warm to Powerful',
    description: 'Four genre-optimized female singing voices. Each voice is tuned with specific ElevenLabs settings for maximum emotional impact.',
    subStyles: [
      { name: 'R&B', voice: 'Rachel — warm, emotional', use: 'R&B ballads, emotional delivery' },
      { name: 'Pop', voice: 'Bella — sweet, clear', use: 'Pop anthems, radio-ready hooks' },
      { name: 'Soul', voice: 'Laura — powerful, warm', use: 'Soul, gospel, powerhouse vocals' },
      { name: 'Hip-Hop', voice: 'Jessica — expressive', use: 'Hip-hop hooks, versatile singing' }
    ]
  },
  {
    id: 'special',
    name: 'Special Voices',
    icon: Radio,
    color: INDIGO,
    tagline: 'Narration & Spoken Word',
    description: 'Purpose-built voices for non-musical content. Documentary narration, podcast voice-overs, spoken word poetry, and more.',
    subStyles: [
      { name: 'Narrator', voice: 'Daniel — deep documentary', use: 'Intros, outros, documentary narration' },
      { name: 'Spoken Word', voice: 'Eric — natural', use: 'Poetry, spoken word, natural delivery' },
      { name: 'Whisper', voice: 'Custom — atmospheric', use: 'ASMR, atmospheric, intimate content' }
    ]
  }
];

const VOICE_CLONING_STEPS = [
  {
    step: 1,
    title: 'Record Your Voice Sample',
    description: 'Record a clear clip of at least 15 seconds of your natural singing, speaking, or rapping voice. Minimal background noise, consistent volume. A longer, cleaner sample produces a better sung clone.',
    icon: Mic,
    tip: 'Speak naturally — don\'t perform. The AI captures your vocal timbre, not your performance style.'
  },
  {
    step: 2,
    title: 'Upload to Voice Vault',
    description: 'Click "Upload Voice Sample" in the Studio Orchestrator\'s asset panel. Files are stored securely in Firebase Storage and associated with your user profile.',
    icon: Upload,
    tip: 'Supported formats: WAV, MP3, M4A, OGG, WEBM. Best quality at 44.1kHz or higher.'
  },
  {
    step: 3,
    title: 'Activate Your Personal Voice',
    description: 'After you upload and confirm ownership, choose Create My Voice. The app calls ElevenLabs Instant Voice Cloning and marks the voice active only after a provider voice_id is returned. If activation fails, personal-voice generation stays blocked instead of silently switching voices.',
    icon: Zap,
    tip: 'A saved raw sample is not an activated personal voice. Wait for the explicit Personal Voice Ready confirmation.'
  },
  {
    step: 4,
    title: 'Generate with Your Voice',
    description: 'Select your activated personal voice. Personal-voice requests carry the saved provider voice_id and are locked to the clone provider; the request fails explicitly if that provider is unavailable.',
    icon: Sparkles,
    tip: 'The saved voice can persist across sessions while your Studio Agents account and the provider voice remain available. You can reset or delete it.'
  }
];

const EMOTIONAL_TAGS = [
  { tag: '[Raspy]', description: 'Adds grit and texture to the vocal delivery, perfect for rock, blues, or raw hip-hop', color: ORANGE },
  { tag: '[Soulful]', description: 'Warm, emotional delivery with natural vibrato and depth', color: CYAN },
  { tag: '[Aggressive]', description: 'Hard-hitting, high-energy delivery for battle rap and diss tracks', color: 'var(--studio-accent)' },
  { tag: '[Breathy]', description: 'Intimate, close-mic feel for R&B, lo-fi, and atmospheric tracks', color: PINK },
  { tag: '[Operatic]', description: 'Dramatic, powerful vocals with classical influence', color: ACCENT },
  { tag: '[Ad-lib]', description: 'Background flair — ad-libs, shouts, harmonics between verses', color: EMERALD },
  { tag: '[Harmony]', description: 'Generates backing harmony vocals to layer with lead', color: INDIGO },
  { tag: '[Whispering]', description: 'Ultra-soft delivery for ASMR, intros, and atmospheric moments', color: 'var(--studio-muted)' },
  { tag: '[Electronic]', description: 'Robotic, processed sound — Daft Punk, vocoder, autotune effects', color: CYAN },
  { tag: '[Grit]', description: 'Raw, unpolished texture for punk, grunge, and underground hip-hop', color: ORANGE }
];

const VOICE_SETTINGS_TABLE = [
  { setting: 'Stability', rapper: '0.60', singer: '0.65', tv: '0.70', podcast: '0.75', music: '0.55', description: 'Lower = more expressive variation' },
  { setting: 'Similarity Boost', rapper: '0.92', singer: '0.92', tv: '0.92', podcast: '0.95', music: '0.88', description: 'How closely output matches the source voice' },
  { setting: 'Style', rapper: '0.70', singer: '0.50', tv: '0.35', podcast: '0.25', music: '0.85', description: 'Higher = more stylistic interpretation' },
  { setting: 'Speaker Boost', rapper: '✓', singer: '✓', tv: '✓', podcast: '✓', music: '✓', description: 'Always enabled for maximum clarity' }
];

const PROVIDER_CHAIN = [
  {
    name: 'Suno API',
    priority: 1,
    color: PINK,
    description: 'Optional provider for musical singing when a working Suno integration is configured. Availability is checked at runtime; Studio Agents must not imply this route is available when the provider rejects a request.',
    bestFor: 'Musical singing when configured and healthy',
    model: 'Provider-selected model',
    icon: Music
  },
  {
    name: 'ElevenLabs',
    priority: 2,
    color: ACCENT,
    description: 'Provider for speech, narration, curated voices, and consent-gated personal voice cloning. A personal voice is considered active only when ElevenLabs returns a durable voice ID.',
    bestFor: 'Speech, narration, and activated personal voices',
    model: 'eleven_multilingual_v2 @ mp3_44100_192',
    icon: Mic2
  },
  {
    name: 'Bark (Replicate)',
    priority: 3,
    color: CYAN,
    description: 'Expressive spoken word fallback. Used when primary providers are unavailable or for specific bark-style spoken word with heavy emotion markers.',
    bestFor: 'Expressive spoken word, emotional narration, fallback',
    model: 'Bark v2',
    icon: Radio
  }
];

const FAQ_ITEMS = [
  {
    q: 'How many voice clones can I create?',
    a: 'There\'s no hard limit — each clone is stored as a unique ElevenLabs voice_id linked to your profile. In practice, most users create 1-3 clones for different vocal characters or moods.'
  },
  {
    q: 'What\'s the difference between voice style and rapStyle?',
    a: 'Voice style (rapper, singer, narrator, cloned) selects the voice family. RapStyle (aggressive, melodic, trap, drill, etc.) selects the specific voice WITHIN that family. Think of it as: style = who speaks, rapStyle = how they speak.'
  },
  {
    q: 'Can I use emotional tags [Raspy] with cloned voices?',
    a: 'Emotional tags influence the lyric content and generation prompt, not the voice itself. Your cloned voice maintains its natural characteristics. For different tones, record separate voice samples — one aggressive, one melodic — and save them as different clones.'
  },
  {
    q: 'What\'s the Reference Song Analysis feature?',
    a: 'When you provide a referenceSongUrl, the system sends it to Google Gemini 2.5 Flash for analysis. It extracts tone, warmth (1-10), depth (1-10), energy (1-10), tempo, vocal style, mood, and production characteristics. These parameters dynamically tune your voice settings — higher warmth increases stability, higher energy lowers it for more expression.'
  },
  {
    q: 'What audio quality does the system output?',
    a: 'Provider output format and quality vary by route. ElevenLabs requests may return MP3 at the configured encoding, but every result should be reviewed and mastered before release; Studio Agents does not label unreviewed AI output broadcast-ready.'
  },
  {
    q: 'How does multilingual support work?',
    a: 'The eleven_multilingual_v2 model natively supports 29+ languages including English, Spanish, French, German, Italian, Portuguese, Japanese, Korean, and Chinese. Select your target language in the Studio Orchestrator — the same voice maintains its character across languages.'
  },
  {
    q: 'Can I mix vocals with instrumentals in the platform?',
    a: 'Yes! The "Render Master" (Final Mix) feature lets you combine generated vocals with generated beats. You can also provide a backingTrackUrl to mix vocals with any instrumental. The FFmpeg mixing engine handles level balancing and format matching.'
  },
  {
    q: 'What makes this different from basic TTS?',
    a: 'Vocal Lab combines text generation, provider routing, voice selection, and optional reference analysis. Some routes are speech synthesis and some configured providers can produce musical vocals; the result and active provider are shown so you can judge it honestly.'
  }
];

const OUTPUT_FORMATS = [
  { format: 'Social', description: 'Optimized for TikTok, Reels, Stories — punchy, compressed, attention-grabbing', icon: TrendingUp, color: PINK },
  { format: 'Podcast', description: 'Clean, natural delivery with high clarity and minimal processing', icon: Headphones, color: EMERALD },
  { format: 'TV', description: 'Narration preset for review and post-production', icon: Eye, color: CYAN },
  { format: 'Music', description: 'Full dynamic range, maximum expression — designed for mixing into tracks', icon: Music, color: ACCENT }
];

export default function VocalsResourcePage({ onBack }) {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeVoiceStyle, setActiveVoiceStyle] = useState(0);
  const [activeProvider, setActiveProvider] = useState(null);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, var(--studio-bg) 0%, var(--studio-surface-alt) 30%, var(--studio-bg) 100%)',
      color: 'var(--studio-ink)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* ==================== HEADER ==================== */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--studio-surface)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid color-mix(in srgb, var(--studio-accent) 15%, transparent)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', color: 'var(--studio-muted)',
            cursor: 'pointer', fontSize: '0.95rem', padding: '8px 12px',
            borderRadius: '8px', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.target.style.color = 'var(--studio-ink)'}
          onMouseLeave={e => e.target.style.color = 'var(--studio-muted)'}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Mic2 size={20} style={{ color: ACCENT }} />
          <span style={{ fontSize: '1rem', fontWeight: '600', letterSpacing: '0.05em' }}>
            VOCAL LAB
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
          background: 'radial-gradient(circle, color-mix(in srgb, var(--studio-accent) 12%, transparent) 0%, color-mix(in srgb, var(--studio-accent) 6%, transparent) 50%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: ACCENT_LIGHT, border: `1px solid color-mix(in srgb, var(--studio-accent) 30%, transparent)`,
          borderRadius: '100px', padding: '6px 18px', marginBottom: '24px',
          fontSize: '0.85rem', color: ACCENT, fontWeight: '600', letterSpacing: '0.08em'
        }}>
          <Waves size={14} /> AI-POWERED VOICE ENGINE
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: '800',
          fontFamily: 'Georgia, serif',
          lineHeight: '1.1',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, var(--studio-ink) 0%, var(--studio-accent) 50%, var(--studio-accent) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Vocal Lab 2.0
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
          color: 'var(--studio-muted)',
          maxWidth: '740px',
          margin: '0 auto 32px',
          lineHeight: '1.7'
        }}>
          Provider-backed vocal creation with explicit routing and honest failure states.
          Personal voices activate only after consent-gated ElevenLabs IVC succeeds, and future runs stay locked to that provider identity.
        </p>

        {/* Stats Bar */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap'
        }}>
          {[
            { label: 'Voice Styles', value: '20+' },
            { label: 'Rap Styles', value: '8' },
            { label: 'Languages', value: '29+' },
            { label: 'Output Quality', value: '192kbps' }
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: ACCENT }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--studio-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== VOICE ROSTER ==================== */}
      <section style={{ padding: '0 24px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: `color-mix(in srgb, ${CYAN} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${CYAN} 19%, transparent)`,
            borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
            fontSize: '0.8rem', color: CYAN, fontWeight: '700', letterSpacing: '0.1em'
          }}>
            <Users size={14} /> VOICE ROSTER
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '12px'
          }}>
            Every Voice, Every Style
          </h2>
          <p style={{ color: 'var(--studio-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Hand-curated ElevenLabs voices mapped by style, delivery, and genre. Each voice is tuned with custom stability, similarity, and style parameters.
          </p>
        </div>

        {/* Voice Style Tabs */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px',
          marginBottom: '32px'
        }}>
          {VOICE_STYLES.map((vs, i) => {
            const Icon = vs.icon;
            return (
              <button
                key={vs.id}
                onClick={() => setActiveVoiceStyle(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 18px', borderRadius: '100px',
                  background: activeVoiceStyle === i ? `color-mix(in srgb, ${vs.color} 13%, transparent)` : 'var(--studio-surface)',
                  border: `1px solid ${activeVoiceStyle === i ? vs.color : 'var(--studio-border)'}`,
                  color: activeVoiceStyle === i ? vs.color : 'var(--studio-muted)',
                  cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
                  transition: 'all 0.3s'
                }}
              >
                <Icon size={15} /> {vs.name}
              </button>
            );
          })}
        </div>

        {/* Active Voice Style Detail */}
        {(() => {
          const vs = VOICE_STYLES[activeVoiceStyle];
          const Icon = vs.icon;
          return (
            <div style={{
              background: 'var(--studio-surface)',
              border: `1px solid color-mix(in srgb, ${vs.color} 15%, transparent)`,
              borderRadius: '20px', overflow: 'hidden'
            }}>
              <div style={{
                padding: '32px 36px 24px',
                background: `linear-gradient(135deg, color-mix(in srgb, ${vs.color} 3%, transparent), transparent)`,
                borderBottom: `1px solid color-mix(in srgb, ${vs.color} 8%, transparent)`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: `color-mix(in srgb, ${vs.color} 13%, transparent)`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={24} style={{ color: vs.color }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Georgia, serif', margin: 0 }}>
                      {vs.name}
                    </h3>
                    <p style={{ color: vs.color, fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>{vs.tagline}</p>
                  </div>
                </div>
                <p style={{ fontSize: '1rem', color: 'var(--studio-muted)', lineHeight: '1.6' }}>{vs.description}</p>
              </div>

              {/* Sub-styles Grid */}
              <div style={{ padding: '24px 36px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
                  {vs.subStyles.map((sub, i) => (
                    <div key={i} style={{
                      padding: '16px 18px',
                      background: 'var(--studio-surface)',
                      border: '1px solid var(--studio-border)',
                      borderRadius: '12px', transition: 'border-color 0.3s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = `color-mix(in srgb, ${vs.color} 25%, transparent)`}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--studio-border)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: vs.color }}>{sub.name}</span>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '100px',
                          background: 'var(--studio-surface-alt)', color: 'var(--studio-muted)', fontWeight: '600'
                        }}>
                          {sub.voice.split('—')[0].trim()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--studio-muted)', margin: '0 0 6px', fontStyle: 'italic' }}>
                        {sub.voice}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--studio-muted)', margin: 0 }}>
                        {sub.use}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ==================== EMOTIONAL TAGS ==================== */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(180deg, color-mix(in srgb, var(--studio-accent) 4%, transparent) 0%, transparent 100%)',
        borderTop: '1px solid color-mix(in srgb, var(--studio-accent) 10%, transparent)',
        borderBottom: '1px solid color-mix(in srgb, var(--studio-accent) 10%, transparent)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: `color-mix(in srgb, ${PINK} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${PINK} 19%, transparent)`,
              borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
              fontSize: '0.8rem', color: PINK, fontWeight: '700', letterSpacing: '0.1em'
            }}>
              <Heart size={14} /> SUNO-STYLE TAGS
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
              fontFamily: 'Georgia, serif', marginBottom: '12px'
            }}>
              Emotional Tagging System
            </h2>
            <p style={{ color: 'var(--studio-muted)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
              Use <code style={{ color: ACCENT, background: ACCENT_LIGHT, padding: '2px 6px', borderRadius: '4px' }}>[Brackets]</code> to
              define vocal character, emotion, and texture. Stack multiple tags for complex vocal performances.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '12px'
          }}>
            {EMOTIONAL_TAGS.map((tag, i) => (
              <div key={i} style={{
                padding: '18px 20px',
                background: 'var(--studio-surface)',
                border: '1px solid var(--studio-border)',
                borderRadius: '14px',
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                transition: 'border-color 0.3s'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `color-mix(in srgb, ${tag.color} 25%, transparent)`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--studio-border)'}
              >
                <code style={{
                  fontSize: '0.85rem', fontWeight: '800', color: tag.color,
                  background: `color-mix(in srgb, ${tag.color} 8%, transparent)`, padding: '4px 10px',
                  borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  {tag.tag}
                </code>
                <p style={{ fontSize: '0.9rem', color: 'var(--studio-muted)', lineHeight: '1.5', margin: 0 }}>
                  {tag.description}
                </p>
              </div>
            ))}
          </div>

          {/* Example prompt */}
          <div style={{
            marginTop: '32px', padding: '24px',
            background: 'var(--studio-surface)',
            border: '1px solid color-mix(in srgb, var(--studio-accent) 15%, transparent)',
            borderRadius: '14px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--studio-muted)', letterSpacing: '0.08em', marginBottom: '12px' }}>
              EXAMPLE PROMPT
            </h4>
            <code style={{
              fontSize: '1rem', color: 'var(--studio-ink)', lineHeight: '1.8', display: 'block',
              fontFamily: '"Fira Code", "Cascadia Code", monospace'
            }}>
              <span style={{ color: PINK }}>[Soulful Grit]</span> I found my way through the dark,
              <span style={{ color: ACCENT }}> [Ad-lib]</span> yeah yeah,
              <span style={{ color: CYAN }}> [Harmony]</span> every scar tells a story,
              <span style={{ color: ORANGE }}> [Raspy]</span> and I wear mine like armor
            </code>
            <p style={{ fontSize: '0.85rem', color: 'var(--studio-muted)', marginTop: '12px', marginBottom: 0 }}>
              → Generates a soulful lead vocal with raw texture, background ad-libs, harmonic backing, and a gritty bridge delivery.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== VOICE CLONING ==================== */}
      <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: `color-mix(in srgb, ${EMERALD} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${EMERALD} 19%, transparent)`,
            borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
            fontSize: '0.8rem', color: EMERALD, fontWeight: '700', letterSpacing: '0.1em'
          }}>
            <Wand2 size={14} /> VOICE CLONING
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '12px'
          }}>
            Activate Your Personal Voice
          </h2>
          <p style={{ color: 'var(--studio-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            ElevenLabs Instant Voice Cloning (IVC) captures your unique vocal identity.
            Upload samples, confirm ownership, and wait for provider activation before personal-voice generation is enabled.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {VOICE_CLONING_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} style={{ display: 'flex', gap: '24px', position: 'relative' }}>
                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${EMERALD}, ${CYAN})`,
                    color: 'var(--studio-on-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: '800', flexShrink: 0,
                    boxShadow: `0 0 20px color-mix(in srgb, var(--studio-sage) 30%, transparent)`
                  }}>
                    {step.step}
                  </div>
                  {i < VOICE_CLONING_STEPS.length - 1 && (
                    <div style={{
                      width: '2px', flex: 1, minHeight: '40px',
                      background: 'linear-gradient(to bottom, color-mix(in srgb, var(--studio-sage) 30%, transparent), color-mix(in srgb, var(--studio-sage) 5%, transparent))'
                    }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingBottom: '32px', paddingTop: '6px', flex: 1 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={16} style={{ color: EMERALD }} /> {step.title}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--studio-muted)', lineHeight: '1.6', marginBottom: '10px' }}>
                    {step.description}
                  </p>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', borderRadius: '8px',
                    background: 'color-mix(in srgb, var(--studio-accent) 5%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--studio-accent) 10%, transparent)',
                    fontSize: '0.85rem', color: 'var(--studio-ink)'
                  }}>
                    <Lightbulb size={14} style={{ color: 'var(--studio-accent)', flexShrink: 0 }} />
                    {step.tip}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== PROVIDER CHAIN ==================== */}
      <section style={{
        padding: '80px 24px',
        background: 'var(--studio-surface)',
        borderTop: '1px solid var(--studio-border)',
        borderBottom: '1px solid var(--studio-border)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: `color-mix(in srgb, ${INDIGO} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${INDIGO} 19%, transparent)`,
              borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
              fontSize: '0.8rem', color: INDIGO, fontWeight: '700', letterSpacing: '0.1em'
            }}>
              <Layers size={14} /> PROVIDER ARCHITECTURE
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
              fontFamily: 'Georgia, serif', marginBottom: '12px'
            }}>
              Multi-Provider Voice Engine
            </h2>
            <p style={{ color: 'var(--studio-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              Three AI providers in a priority chain ensure your vocals are always generated at the highest possible quality.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
            {PROVIDER_CHAIN.map((provider, i) => {
              const Icon = provider.icon;
              return (
                <div key={i}
                  style={{
                    background: activeProvider === i ? 'var(--studio-surface)' : 'var(--studio-surface)',
                    border: `1px solid ${activeProvider === i ? provider.color : 'var(--studio-border)'}`,
                    borderRadius: '16px', padding: '28px',
                    cursor: 'pointer', transition: 'all 0.3s',
                    position: 'relative'
                  }}
                  onClick={() => setActiveProvider(activeProvider === i ? null : i)}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `color-mix(in srgb, ${provider.color} 25%, transparent)`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = activeProvider === i ? provider.color : 'var(--studio-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '16px', right: '16px',
                    fontSize: '0.7rem', fontWeight: '800', padding: '3px 10px',
                    borderRadius: '100px', background: `color-mix(in srgb, ${provider.color} 8%, transparent)`, color: provider.color,
                    letterSpacing: '0.08em'
                  }}>
                    PRIORITY {provider.priority}
                  </div>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: `color-mix(in srgb, ${provider.color} 8%, transparent)`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
                  }}>
                    <Icon size={24} style={{ color: provider.color }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>{provider.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--studio-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
                    {provider.description}
                  </p>
                  <div style={{
                    padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--studio-surface-alt)', border: '1px solid var(--studio-border)',
                    fontSize: '0.8rem', marginBottom: '8px'
                  }}>
                    <span style={{ color: 'var(--studio-muted)' }}>Model:</span>{' '}
                    <code style={{ color: provider.color }}>{provider.model}</code>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--studio-muted)' }}>
                    <strong style={{ color: 'var(--studio-muted)' }}>Best for:</strong> {provider.bestFor}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== VOICE SETTINGS MATRIX ==================== */}
      <section style={{ padding: '80px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: `color-mix(in srgb, ${ORANGE} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${ORANGE} 19%, transparent)`,
            borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
            fontSize: '0.8rem', color: ORANGE, fontWeight: '700', letterSpacing: '0.1em'
          }}>
            <Sliders size={14} /> VOICE TUNING
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '12px'
          }}>
            Per-Style Voice Parameters
          </h2>
          <p style={{ color: 'var(--studio-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Every voice style uses custom-tuned ElevenLabs parameters. These aren't defaults — they're the product of extensive testing for each use case.
          </p>
        </div>

        <div style={{
          background: 'var(--studio-surface)',
          border: '1px solid var(--studio-border)',
          borderRadius: '16px', overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
            padding: '16px 20px',
            background: 'var(--studio-surface)',
            borderBottom: '1px solid var(--studio-border)',
            fontSize: '0.75rem', fontWeight: '700', color: 'var(--studio-muted)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            gap: '8px'
          }}>
            <div>Setting</div>
            <div style={{ textAlign: 'center' }}>Rapper</div>
            <div style={{ textAlign: 'center' }}>Singer</div>
            <div style={{ textAlign: 'center' }}>TV</div>
            <div style={{ textAlign: 'center' }}>Podcast</div>
            <div style={{ textAlign: 'center' }}>Music</div>
          </div>

          {/* Table Rows */}
          {VOICE_SETTINGS_TABLE.map((row, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
              padding: '14px 20px',
              borderBottom: i < VOICE_SETTINGS_TABLE.length - 1 ? '1px solid var(--studio-border)' : 'none',
              fontSize: '0.9rem', alignItems: 'center', gap: '8px'
            }}>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--studio-ink)' }}>{row.setting}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--studio-muted)', marginTop: '2px' }}>{row.description}</div>
              </div>
              <div style={{ textAlign: 'center', color: ACCENT, fontWeight: '600', fontFamily: 'monospace' }}>{row.rapper}</div>
              <div style={{ textAlign: 'center', color: CYAN, fontWeight: '600', fontFamily: 'monospace' }}>{row.singer}</div>
              <div style={{ textAlign: 'center', color: ORANGE, fontWeight: '600', fontFamily: 'monospace' }}>{row.tv}</div>
              <div style={{ textAlign: 'center', color: EMERALD, fontWeight: '600', fontFamily: 'monospace' }}>{row.podcast}</div>
              <div style={{ textAlign: 'center', color: PINK, fontWeight: '600', fontFamily: 'monospace' }}>{row.music}</div>
            </div>
          ))}
        </div>

        {/* Reference Song Analysis */}
        <div style={{
          marginTop: '24px', padding: '28px',
          background: 'var(--studio-surface)',
          border: `1px solid color-mix(in srgb, ${ACCENT} 13%, transparent)`,
          borderRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: ACCENT_LIGHT, display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Brain size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Reference Song Analysis</h3>
              <p style={{ fontSize: '0.85rem', color: ACCENT, margin: 0 }}>Powered by Google Gemini 2.5 Flash</p>
            </div>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--studio-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
            Provide a reference song URL and the system analyzes it through Gemini AI with a professional producer perspective. It extracts:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '8px' }}>
            {[
              'Warmth (1-10)', 'Depth (1-10)', 'Energy (1-10)',
              'Tone & Timbre', 'Tempo Feel', 'Vocal Style',
              'Mood & Atmosphere', 'Genre Tags', 'Production Style',
              'Suno Tags', 'Vocal Direction', 'Key Characteristics'
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.85rem', color: 'var(--studio-muted)'
              }}>
                <CheckCircle size={12} style={{ color: ACCENT, flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--studio-muted)', marginTop: '12px', marginBottom: 0 }}>
            These parameters dynamically override voice settings — higher warmth increases stability, higher energy lowers it for more expression.
          </p>
        </div>
      </section>

      {/* ==================== OUTPUT FORMATS ==================== */}
      <section style={{
        padding: '80px 24px',
        background: 'var(--studio-surface)',
        borderTop: '1px solid var(--studio-border)',
        borderBottom: '1px solid var(--studio-border)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: '800',
              fontFamily: 'Georgia, serif', marginBottom: '12px'
            }}>
              Output Formats
            </h2>
            <p style={{ color: 'var(--studio-muted)', fontSize: '1rem' }}>
              Every format tunes voice parameters for its target medium.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            {OUTPUT_FORMATS.map((fmt, i) => {
              const Icon = fmt.icon;
              return (
                <div key={i} style={{
                  padding: '24px',
                  background: 'var(--studio-surface)',
                  border: '1px solid var(--studio-border)',
                  borderRadius: '14px',
                  textAlign: 'center', transition: 'border-color 0.3s'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `color-mix(in srgb, ${fmt.color} 25%, transparent)`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--studio-border)'}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `color-mix(in srgb, ${fmt.color} 8%, transparent)`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <Icon size={22} style={{ color: fmt.color }} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '6px' }}>{fmt.format}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--studio-muted)', lineHeight: '1.5', margin: 0 }}>
                    {fmt.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'color-mix(in srgb, var(--studio-sage) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--studio-sage) 20%, transparent)',
              borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
              fontSize: '0.8rem', color: 'var(--studio-sage)', fontWeight: '700', letterSpacing: '0.1em'
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
                background: expandedFaq === i ? 'var(--studio-surface)' : 'var(--studio-surface)',
                border: `1px solid ${expandedFaq === i ? 'color-mix(in srgb, var(--studio-accent) 20%, transparent)' : 'var(--studio-border)'}`,
                borderRadius: '12px', overflow: 'hidden',
                transition: 'all 0.3s'
              }}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '18px 24px', background: 'none', border: 'none',
                    color: 'var(--studio-ink)', fontSize: '1rem', fontWeight: '600', textAlign: 'left',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  {faq.q}
                  <ChevronRight size={18} style={{
                    transform: expandedFaq === i ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 0.2s', color: 'var(--studio-muted)', flexShrink: 0
                  }} />
                </button>
                {expandedFaq === i && (
                  <div style={{
                    padding: '0 24px 20px',
                    fontSize: '0.95rem', color: 'var(--studio-muted)', lineHeight: '1.7'
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
          background: 'radial-gradient(circle, color-mix(in srgb, var(--studio-accent) 8%, transparent) 0%, color-mix(in srgb, var(--studio-accent) 4%, transparent) 50%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1
        }}>
          <Mic2 size={40} style={{ color: ACCENT, marginBottom: '20px' }} />
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '16px'
          }}>
            Your Voice. Your Rules.
          </h2>
          <p style={{ color: 'var(--studio-muted)', fontSize: '1.05rem', marginBottom: '32px', lineHeight: '1.7' }}>
            Curated studio voices, personal-voice activation, and optional reference analysis are provider-dependent.
            Provider-backed vocals show their source and fail explicitly when unavailable.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { window.location.hash = '#/studio/agents'; }}
              style={{
                padding: '14px 36px', borderRadius: '100px', border: 'none',
                background: 'var(--studio-accent)',
                color: 'var(--studio-on-accent)', fontSize: '1.05rem', fontWeight: '700',
                cursor: 'pointer', letterSpacing: '0.03em',
                boxShadow: '0 6px 16px color-mix(in srgb, var(--studio-ink) 12%, transparent)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              Launch Vocal Lab →
            </button>
            <button
              onClick={() => { window.location.hash = '#/dna'; }}
              style={{
                padding: '14px 36px', borderRadius: '100px',
                border: '1px solid color-mix(in srgb, var(--studio-accent) 30%, transparent)',
                background: 'color-mix(in srgb, var(--studio-accent) 10%, transparent)',
                color: ACCENT, fontSize: '1.05rem', fontWeight: '700',
                cursor: 'pointer', letterSpacing: '0.03em',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              Explore DNA System
            </button>
          </div>
        </div>

        <div style={{
          marginTop: '48px', paddingTop: '32px',
          borderTop: '1px solid var(--studio-border)',
          fontSize: '0.8rem', color: 'var(--studio-muted)'
        }}>
          © 2026 studioagentsai.com — Vocal Lab is proprietary technology of Studio Agents DAI.
        </div>
      </section>
    </div>
  );
}
