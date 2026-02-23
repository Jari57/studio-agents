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

const ACCENT = '#a855f7';
const ACCENT_LIGHT = 'rgba(168, 85, 247, 0.15)';
const CYAN = '#06b6d4';
const PINK = '#ec4899';
const ORANGE = '#f97316';
const EMERALD = '#10b981';
const INDIGO = '#6366f1';

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
    description: 'Record a clear 5-10 second clip of your natural speaking or rapping voice. Minimal background noise, consistent volume. Multiple samples (up to 3) improve clone quality.',
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
    title: 'Clone via ElevenLabs IVC',
    description: 'Hit "Clone Voice" — your samples are sent to ElevenLabs\' Instant Voice Cloning API. A unique voice_id is created and linked to your account. This takes 10-30 seconds.',
    icon: Zap,
    tip: 'Upload 2-3 diverse samples (different sentences) for the most natural-sounding clone.'
  },
  {
    step: 4,
    title: 'Generate with Your Voice',
    description: 'Select "Cloned" as your voice style. Every vocal generation now uses YOUR voice. The system automatically routes to your custom voice_id with optimized ElevenLabs settings.',
    icon: Sparkles,
    tip: 'Your cloned voice persists across sessions — clone once, use forever.'
  }
];

const EMOTIONAL_TAGS = [
  { tag: '[Raspy]', description: 'Adds grit and texture to the vocal delivery, perfect for rock, blues, or raw hip-hop', color: ORANGE },
  { tag: '[Soulful]', description: 'Warm, emotional delivery with natural vibrato and depth', color: CYAN },
  { tag: '[Aggressive]', description: 'Hard-hitting, high-energy delivery for battle rap and diss tracks', color: '#ef4444' },
  { tag: '[Breathy]', description: 'Intimate, close-mic feel for R&B, lo-fi, and atmospheric tracks', color: PINK },
  { tag: '[Operatic]', description: 'Dramatic, powerful vocals with classical influence', color: ACCENT },
  { tag: '[Ad-lib]', description: 'Background flair — ad-libs, shouts, harmonics between verses', color: EMERALD },
  { tag: '[Harmony]', description: 'Generates backing harmony vocals to layer with lead', color: INDIGO },
  { tag: '[Whispering]', description: 'Ultra-soft delivery for ASMR, intros, and atmospheric moments', color: '#6b7280' },
  { tag: '[Electronic]', description: 'Robotic, processed sound — Daft Punk, vocoder, autotune effects', color: CYAN },
  { tag: '[Grit]', description: 'Raw, unpolished texture for punk, grunge, and underground hip-hop', color: ORANGE }
];

const VOICE_SETTINGS_TABLE = [
  { setting: 'Stability', rapper: '0.50', singer: '0.60', tv: '0.70', podcast: '0.75', music: '0.45', description: 'Lower = more expressive variation' },
  { setting: 'Similarity Boost', rapper: '0.92', singer: '0.92', tv: '0.92', podcast: '0.95', music: '0.88', description: 'How closely output matches the source voice' },
  { setting: 'Style', rapper: '0.75', singer: '0.50', tv: '0.35', podcast: '0.25', music: '0.85', description: 'Higher = more stylistic interpretation' },
  { setting: 'Speaker Boost', rapper: '✓', singer: '✓', tv: '✓', podcast: '✓', music: '✓', description: 'Always enabled for maximum clarity' }
];

const PROVIDER_CHAIN = [
  {
    name: 'Suno API',
    priority: 1,
    color: PINK,
    description: 'Primary provider for singing styles. Builds Suno-compatible tags from genre, style, and emotion parameters. Uses optional Gemini reference song analysis for intelligent tag generation.',
    bestFor: 'Singing vocals, musical tracks, full song generation',
    model: 'Suno v4',
    icon: Music
  },
  {
    name: 'ElevenLabs',
    priority: 2,
    color: ACCENT,
    description: 'Primary provider for rap, narration, and speaking voices. 27+ curated voices mapped by style × rapStyle × genre. Multilingual support in 29+ languages. Used for all voice cloning via IVC.',
    bestFor: 'Rap vocals, narration, voice cloning, multilingual output',
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
    a: 'When you provide a referenceSongUrl, the system sends it to Google Gemini 2.0 Flash for analysis. It extracts tone, warmth (1-10), depth (1-10), energy (1-10), tempo, vocal style, mood, and production characteristics. These parameters dynamically tune your voice settings — higher warmth increases stability, higher energy lowers it for more expression.'
  },
  {
    q: 'What audio quality does the system output?',
    a: 'MP3 at 44.1kHz, 192kbps via ElevenLabs. This is broadcast-quality audio suitable for streaming, social media, and professional production. For maximum quality, use "premium" quality mode which routes to priority processing.'
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
    a: 'Basic TTS reads text. Studio Agents\' Vocal Lab uses style-aware routing, genre-specific voice tuning, emotional tags, reference song analysis via Gemini AI, and ElevenLabs\' most expressive model (eleven_multilingual_v2). It\'s not text-to-speech — it\'s text-to-performance.'
  }
];

const OUTPUT_FORMATS = [
  { format: 'Social', description: 'Optimized for TikTok, Reels, Stories — punchy, compressed, attention-grabbing', icon: TrendingUp, color: PINK },
  { format: 'Podcast', description: 'Clean, natural delivery with high clarity and minimal processing', icon: Headphones, color: EMERALD },
  { format: 'TV', description: 'Broadcast-ready narration with professional tone and pacing', icon: Eye, color: CYAN },
  { format: 'Music', description: 'Full dynamic range, maximum expression — designed for mixing into tracks', icon: Music, color: ACCENT }
];

export default function VocalsResourcePage({ onBack }) {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeVoiceStyle, setActiveVoiceStyle] = useState(0);
  const [activeProvider, setActiveProvider] = useState(null);

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
          background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(236,72,153,0.06) 50%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: ACCENT_LIGHT, border: `1px solid rgba(168,85,247,0.3)`,
          borderRadius: '100px', padding: '6px 18px', marginBottom: '24px',
          fontSize: '0.85rem', color: ACCENT, fontWeight: '600', letterSpacing: '0.08em'
        }}>
          <Waves size={14} /> NEURAL EMOTION MAPPING
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
          Vocal Lab 2.0
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
          color: '#9ca3af',
          maxWidth: '740px',
          margin: '0 auto 32px',
          lineHeight: '1.7'
        }}>
          Not text-to-speech — <strong style={{ color: 'white' }}>text-to-performance</strong>.
          27+ curated voices, 8 rap delivery styles, voice cloning via ElevenLabs IVC,
          and AI-powered reference song analysis. <em>Your voice. Your rules.</em>
        </p>

        {/* Stats Bar */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap'
        }}>
          {[
            { label: 'Curated Voices', value: '27+' },
            { label: 'Rap Styles', value: '8' },
            { label: 'Languages', value: '29+' },
            { label: 'Output Quality', value: '192kbps' }
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: ACCENT }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== VOICE ROSTER ==================== */}
      <section style={{ padding: '0 24px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: `${CYAN}15`, border: `1px solid ${CYAN}30`,
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
          <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
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
                  background: activeVoiceStyle === i ? `${vs.color}20` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeVoiceStyle === i ? vs.color : 'rgba(255,255,255,0.1)'}`,
                  color: activeVoiceStyle === i ? vs.color : '#9ca3af',
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
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${vs.color}25`,
              borderRadius: '20px', overflow: 'hidden'
            }}>
              <div style={{
                padding: '32px 36px 24px',
                background: `linear-gradient(135deg, ${vs.color}08, transparent)`,
                borderBottom: `1px solid ${vs.color}15`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: `${vs.color}20`, display: 'flex',
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
                <p style={{ fontSize: '1rem', color: '#9ca3af', lineHeight: '1.6' }}>{vs.description}</p>
              </div>

              {/* Sub-styles Grid */}
              <div style={{ padding: '24px 36px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {vs.subStyles.map((sub, i) => (
                    <div key={i} style={{
                      padding: '16px 18px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px', transition: 'border-color 0.3s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = `${vs.color}40`}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: vs.color }}>{sub.name}</span>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '100px',
                          background: 'rgba(255,255,255,0.05)', color: '#6b7280', fontWeight: '600'
                        }}>
                          {sub.voice.split('—')[0].trim()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 6px', fontStyle: 'italic' }}>
                        {sub.voice}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>
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
        background: 'linear-gradient(180deg, rgba(236,72,153,0.04) 0%, transparent 100%)',
        borderTop: '1px solid rgba(236,72,153,0.1)',
        borderBottom: '1px solid rgba(236,72,153,0.1)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: `${PINK}15`, border: `1px solid ${PINK}30`,
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
            <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
              Use <code style={{ color: ACCENT, background: ACCENT_LIGHT, padding: '2px 6px', borderRadius: '4px' }}>[Brackets]</code> to
              define vocal character, emotion, and texture. Stack multiple tags for complex vocal performances.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px'
          }}>
            {EMOTIONAL_TAGS.map((tag, i) => (
              <div key={i} style={{
                padding: '18px 20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                transition: 'border-color 0.3s'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${tag.color}40`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              >
                <code style={{
                  fontSize: '0.85rem', fontWeight: '800', color: tag.color,
                  background: `${tag.color}15`, padding: '4px 10px',
                  borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  {tag.tag}
                </code>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: '1.5', margin: 0 }}>
                  {tag.description}
                </p>
              </div>
            ))}
          </div>

          {/* Example prompt */}
          <div style={{
            marginTop: '32px', padding: '24px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(168,85,247,0.15)',
            borderRadius: '14px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#6b7280', letterSpacing: '0.08em', marginBottom: '12px' }}>
              EXAMPLE PROMPT
            </h4>
            <code style={{
              fontSize: '1rem', color: '#d1d5db', lineHeight: '1.8', display: 'block',
              fontFamily: '"Fira Code", "Cascadia Code", monospace'
            }}>
              <span style={{ color: PINK }}>[Soulful Grit]</span> I found my way through the dark,
              <span style={{ color: ACCENT }}> [Ad-lib]</span> yeah yeah,
              <span style={{ color: CYAN }}> [Harmony]</span> every scar tells a story,
              <span style={{ color: ORANGE }}> [Raspy]</span> and I wear mine like armor
            </code>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '12px', marginBottom: 0 }}>
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
            background: `${EMERALD}15`, border: `1px solid ${EMERALD}30`,
            borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
            fontSize: '0.8rem', color: EMERALD, fontWeight: '700', letterSpacing: '0.1em'
          }}>
            <Wand2 size={14} /> VOICE CLONING
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '12px'
          }}>
            Clone Your Voice in 60 Seconds
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            ElevenLabs Instant Voice Cloning (IVC) captures your unique vocal identity.
            Upload samples, clone, and generate — <em>your voice</em>, infinite content.
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
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: '800', flexShrink: 0,
                    boxShadow: `0 0 20px rgba(16,185,129,0.3)`
                  }}>
                    {step.step}
                  </div>
                  {i < VOICE_CLONING_STEPS.length - 1 && (
                    <div style={{
                      width: '2px', flex: 1, minHeight: '40px',
                      background: 'linear-gradient(to bottom, rgba(16,185,129,0.3), rgba(16,185,129,0.05))'
                    }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingBottom: '32px', paddingTop: '6px', flex: 1 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={16} style={{ color: EMERALD }} /> {step.title}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#9ca3af', lineHeight: '1.6', marginBottom: '10px' }}>
                    {step.description}
                  </p>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.1)',
                    fontSize: '0.85rem', color: '#d1d5db'
                  }}>
                    <Lightbulb size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
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
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: `${INDIGO}15`, border: `1px solid ${INDIGO}30`,
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
            <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              Three AI providers in a priority chain ensure your vocals are always generated at the highest possible quality.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {PROVIDER_CHAIN.map((provider, i) => {
              const Icon = provider.icon;
              return (
                <div key={i}
                  style={{
                    background: activeProvider === i ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${activeProvider === i ? provider.color : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '16px', padding: '28px',
                    cursor: 'pointer', transition: 'all 0.3s',
                    position: 'relative'
                  }}
                  onClick={() => setActiveProvider(activeProvider === i ? null : i)}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${provider.color}40`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = activeProvider === i ? provider.color : 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '16px', right: '16px',
                    fontSize: '0.7rem', fontWeight: '800', padding: '3px 10px',
                    borderRadius: '100px', background: `${provider.color}15`, color: provider.color,
                    letterSpacing: '0.08em'
                  }}>
                    PRIORITY {provider.priority}
                  </div>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: `${provider.color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
                  }}>
                    <Icon size={24} style={{ color: provider.color }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>{provider.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: '1.6', marginBottom: '16px' }}>
                    {provider.description}
                  </p>
                  <div style={{
                    padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '0.8rem', marginBottom: '8px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Model:</span>{' '}
                    <code style={{ color: provider.color }}>{provider.model}</code>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    <strong style={{ color: '#9ca3af' }}>Best for:</strong> {provider.bestFor}
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
            background: `${ORANGE}15`, border: `1px solid ${ORANGE}30`,
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
          <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Every voice style uses custom-tuned ElevenLabs parameters. These aren't defaults — they're the product of extensive testing for each use case.
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontSize: '0.75rem', fontWeight: '700', color: '#6b7280',
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
              borderBottom: i < VOICE_SETTINGS_TABLE.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              fontSize: '0.9rem', alignItems: 'center', gap: '8px'
            }}>
              <div>
                <div style={{ fontWeight: '600', color: '#d1d5db' }}>{row.setting}</div>
                <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '2px' }}>{row.description}</div>
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
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${ACCENT}20`,
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
              <p style={{ fontSize: '0.85rem', color: ACCENT, margin: 0 }}>Powered by Google Gemini 2.0 Flash</p>
            </div>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#9ca3af', lineHeight: '1.6', marginBottom: '16px' }}>
            Provide a reference song URL and the system analyzes it through Gemini AI with a professional producer perspective. It extracts:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            {[
              'Warmth (1-10)', 'Depth (1-10)', 'Energy (1-10)',
              'Tone & Timbre', 'Tempo Feel', 'Vocal Style',
              'Mood & Atmosphere', 'Genre Tags', 'Production Style',
              'Suno Tags', 'Vocal Direction', 'Key Characteristics'
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.85rem', color: '#9ca3af'
              }}>
                <CheckCircle size={12} style={{ color: ACCENT, flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '12px', marginBottom: 0 }}>
            These parameters dynamically override voice settings — higher warmth increases stability, higher energy lowers it for more expression.
          </p>
        </div>
      </section>

      {/* ==================== OUTPUT FORMATS ==================== */}
      <section style={{
        padding: '80px 24px',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: '800',
              fontFamily: 'Georgia, serif', marginBottom: '12px'
            }}>
              Output Formats
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
              Every format tunes voice parameters for its target medium.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {OUTPUT_FORMATS.map((fmt, i) => {
              const Icon = fmt.icon;
              return (
                <div key={i} style={{
                  padding: '24px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  textAlign: 'center', transition: 'border-color 0.3s'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${fmt.color}40`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `${fmt.color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <Icon size={22} style={{ color: fmt.color }} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '6px' }}>{fmt.format}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#9ca3af', lineHeight: '1.5', margin: 0 }}>
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
          background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, rgba(236,72,153,0.04) 50%, transparent 70%)',
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
          <p style={{ color: '#9ca3af', fontSize: '1.05rem', marginBottom: '32px', lineHeight: '1.7' }}>
            27 curated voices. 8 rap styles. Voice cloning in 60 seconds. Reference song analysis via Gemini AI.
            This isn't text-to-speech — it's <em>text-to-performance</em>.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
              Launch Vocal Lab →
            </button>
            <button
              onClick={() => { window.location.hash = '#/dna'; }}
              style={{
                padding: '14px 36px', borderRadius: '100px',
                border: '1px solid rgba(168,85,247,0.3)',
                background: 'rgba(168,85,247,0.1)',
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
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.8rem', color: '#4b5563'
        }}>
          © 2026 studioagentsai.com — Vocal Lab is proprietary technology of Studio Agents DAI.
        </div>
      </section>
    </div>
  );
}
