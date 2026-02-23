import React, { useState } from 'react';
import {
  ArrowLeft, Trophy, Music, Mic2, Image, Video, Zap,
  ChevronRight, CheckCircle, Star, Lightbulb, Clock,
  Target, Layers, Brain, Play, Eye, Sparkles, Award,
  Settings, Sliders, Radio, Wand2, Heart, Waves,
  Download, Share2, BarChart3, Disc3, TrendingUp,
  Volume2, Headphones, Palette, FileText, RefreshCw,
  ArrowRight, AlertCircle, Crown
} from 'lucide-react';

// ============================================================
// BILLBOARD BLUEPRINT — How to Make a Chart-Ready Record
// Step-by-step production guide using Studio Agents AI
// ============================================================

const ACCENT = '#a855f7';
const ACCENT_LIGHT = 'rgba(168, 85, 247, 0.15)';
const CYAN = '#06b6d4';
const PINK = '#ec4899';
const ORANGE = '#f97316';
const EMERALD = '#10b981';
const GOLD = '#f59e0b';
const INDIGO = '#6366f1';

const PRODUCTION_PHASES = [
  {
    phase: 1,
    title: 'The Concept',
    subtitle: 'Define Your Vision',
    duration: '2 minutes',
    color: ACCENT,
    icon: Brain,
    description: 'Every hit starts with a clear concept. Define your song idea, genre, mood, and target audience before touching a single control.',
    steps: [
      {
        action: 'Write Your Song Concept',
        detail: 'Enter a detailed prompt like: "A trap anthem about a rap battle in Brooklyn, aggressive 808s, dark energy, competitive bars with NYC references"',
        tip: 'Be specific — the more detail, the better every agent performs. Mention: mood, location, theme, energy level, reference artists.'
      },
      {
        action: 'Choose Your Genre & Style',
        detail: 'Select from 32 genres including Trap, Drill, Boom-Bap, R&B, Pop, Afrobeats, Reggaeton, and more. Each genre auto-sets BPM, structure, and instrument profiles.',
        tip: 'Genre presets set duration to 180s (3 min) by default — perfect for a full record.'
      },
      {
        action: 'Set Duration to 150s (2:30)',
        detail: 'Use the duration slider or select "Radio Edit" structure (150s). For bar-based control: set 64 bars at 140 BPM = 110s, or manually set 150s.',
        tip: 'Pro move: Use 180s (Full Song) and trim in post. Stability AI generates up to 3 full minutes in one pass.'
      },
      {
        action: 'Select Output Preset',
        detail: 'Choose "Spotify Single" or "Full Song Release" — both target 180s with full song structure (intro → verse → chorus → verse → chorus → bridge → outro).',
        tip: 'The "YouTube Music Video" preset sets the same 180s duration but flags the output for video pairing.'
      }
    ]
  },
  {
    phase: 2,
    title: 'The Beat',
    subtitle: 'Generate Your Instrumental',
    duration: '30 seconds',
    color: CYAN,
    icon: Music,
    description: 'The AI Orchestrator generates your instrumental via Stability AI\'s stable-audio-2.5 — up to 3 minutes in a single generation. No stitching, no loops.',
    steps: [
      {
        action: 'Upload Audio DNA (Optional)',
        detail: 'Drop a reference beat or sample into the Audio DNA slot. The AI inherits tempo, key, timbre, and sonic character from your reference.',
        tip: 'A 10-30s reference loop is enough — the AI extracts BPM and key signature for the full 2:30 output.'
      },
      {
        action: 'Set BPM & Key',
        detail: 'Default BPM auto-sets from genre (Trap=140, Drill=145, Boom-Bap=90, R&B=75). Override manually for specific tempos.',
        tip: 'Billboard trap hits typically run 130-145 BPM. Drill = 140-155. Pop = 100-120.'
      },
      {
        action: 'Hit Generate on the Audio Slot',
        detail: 'The Orchestrator sends your concept + genre + BPM + Audio DNA to Stability AI. In ~30 seconds, you get a full 2:30+ instrumental.',
        tip: 'If you don\'t love it — hit regenerate. Every generation is unique. You get unlimited variations.'
      },
      {
        action: 'Preview & Evaluate',
        detail: 'The built-in player lets you scrub through the full track. Listen for: intro quality, verse-chorus transitions, bridge energy, outro feel.',
        tip: 'A chart-ready beat needs dynamic contrast — quiet verses, loud choruses. If it\'s too flat, add "dynamic contrast" to your prompt.'
      }
    ]
  },
  {
    phase: 3,
    title: 'The Lyrics',
    subtitle: 'Write Chart-Worthy Bars',
    duration: '15 seconds',
    color: ACCENT,
    icon: FileText,
    description: 'Ghostwriter generates professionally structured lyrics with Udio/Suno structural tags — verse, chorus, bridge, ad-libs — all formatted for vocal generation.',
    steps: [
      {
        action: 'Upload Lyrics DNA (Optional)',
        detail: 'Drop your previous lyrics or a reference text into the Lyrics DNA slot. The Ghostwriter learns your vocabulary, flow patterns, and thematic style.',
        tip: 'Upload 3+ pages of your own writing for maximum style matching. The AI learns your voice, not just generic bars.'
      },
      {
        action: 'Generate Lyrics with Structure Tags',
        detail: 'The AI produces lyrics with [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro] tags. These tags are critical — Suno and ElevenLabs use them for delivery pacing.',
        tip: 'Add specific instructions like "include NYC borough references" or "use internal rhyme schemes" for more authentic writing.'
      },
      {
        action: 'Edit & Refine',
        detail: 'The lyrics appear in the Lyrics slot. Edit directly — change bars, swap punchlines, adjust structure. The text editor preserves all structural tags.',
        tip: 'Billboard hits average 60-80 words per verse and 20-40 words per chorus. Keep it tight.'
      },
      {
        action: 'Set Language',
        detail: 'Choose from 29+ languages including English, Spanish, French, Portuguese, Japanese, Korean, Chinese. The vocal engine supports multilingual delivery.',
        tip: 'Bilingual tracks (English/Spanish, English/French) are trending. Use Lyrics DNA with bilingual reference text.'
      }
    ]
  },
  {
    phase: 4,
    title: 'The Vocals',
    subtitle: 'Record Your Performance',
    duration: '45 seconds',
    color: PINK,
    icon: Mic2,
    description: 'Vocal Lab 2.0 delivers AI vocal performances via ElevenLabs\' eleven_multilingual_v2 model — 27+ curated voices with style-specific tuning. Or clone YOUR voice.',
    steps: [
      {
        action: 'Choose Your Voice',
        detail: 'Select from 8 male rap styles (Aggressive, Melodic, Trap, Drill, Boom-Bap, Fast, Chill, Hype), 3 female rap styles, 4 male/female singer styles, or use your cloned voice.',
        tip: 'For Billboard rap: "Aggressive" (Arnold voice) for hard tracks, "Melodic" (Antoni voice) for Drake-style, "Trap" (Josh voice) for modern energy.'
      },
      {
        action: 'Clone Your Voice (Optional)',
        detail: 'Upload 2-3 voice samples (5-10 seconds each). Hit "Clone Voice" — ElevenLabs IVC creates a permanent voice_id. Every future generation uses YOUR voice.',
        tip: 'Record yourself speaking naturally, not performing. The AI captures timbre and tone — it adds performance on top.'
      },
      {
        action: 'Generate Vocal Track',
        detail: 'The lyrics + voice selection + rap style are sent to ElevenLabs. Output: broadcast-quality MP3 at 44.1kHz/192kbps. Full lyrics = full-length vocal track.',
        tip: 'ElevenLabs has no hard duration cap — output length matches your lyrics length. 800+ words = 2:30+ of vocals.'
      },
      {
        action: 'Add Reference Song Analysis',
        detail: 'Provide a reference song URL — Gemini 2.0 Flash analyzes warmth, depth, energy, tempo, and vocal direction. These parameters dynamically tune your voice settings.',
        tip: 'Reference the vibe you want, not the lyrics. The AI captures the sonic DNA of the reference and applies it to your voice output.'
      }
    ]
  },
  {
    phase: 5,
    title: 'The Artwork',
    subtitle: 'Design Your Cover',
    duration: '20 seconds',
    color: ORANGE,
    icon: Image,
    description: 'Album Artist 2.0 generates vibe-aligned artwork via Flux 1.1 Pro — the same Replicate model used by professional design studios.',
    steps: [
      {
        action: 'Upload Visual DNA (Optional)',
        detail: 'Drop your mood board, color palette, or brand reference into the Visual DNA slot. Every generated image inherits your visual identity.',
        tip: 'High-contrast, bold imagery with your target color scheme produces the most distinctive AI outputs.'
      },
      {
        action: 'Generate Cover Art',
        detail: 'The AI generates a 1024×1024 album cover based on your song concept, genre, mood, and Visual DNA. Dark tones for trap, warm tones for R&B, neon for EDM.',
        tip: 'Spotify and Apple Music display covers at 3000×3000 — use the AI output as a concept and upscale for distribution.'
      },
      {
        action: 'Iterate & Refine',
        detail: 'Regenerate for variations. Each generation is unique — save multiple options and pick the strongest.',
        tip: 'Billboard covers share a secret: one dominant color, one focal point, readable at thumbnail size. Add "single focal point, minimal text" to your prompt.'
      }
    ]
  },
  {
    phase: 6,
    title: 'The Video',
    subtitle: 'Create Your Visual',
    duration: '2-5 minutes',
    color: INDIGO,
    icon: Video,
    description: 'The Synced Video engine generates beat-matched music videos up to 4 minutes long — stitching multiple AI-generated clips into one coherent visual experience.',
    steps: [
      {
        action: 'Upload Seed DNA',
        detail: 'Provide a character portrait or scene reference as Seed DNA. The video generator uses this as a visual anchor — every frame inherits your character/scene.',
        tip: 'Use your album cover as Seed DNA for perfectly matched music videos. The character and color palette carry through every frame.'
      },
      {
        action: 'Generate Synced Video',
        detail: 'Select duration: 30s, 60s, 90s, 120s, 180s, or 240s (4 min). Videos > 30s are processed as background jobs — you\'ll get notified when complete.',
        tip: 'For a 2:30 record, select the 180s bucket. The engine stitches multiple 8-second Veo 3.0 clips into one continuous video.'
      },
      {
        action: 'Mux Audio + Video',
        detail: 'The platform automatically combines your final mix audio with the generated video via FFmpeg. Codec matching and format optimization happen automatically.',
        tip: 'The mux engine handles up to 200MB output. For social media, the auto-compression produces platform-ready files.'
      }
    ]
  },
  {
    phase: 7,
    title: 'The Mix',
    subtitle: 'Render Your Master',
    duration: '30 seconds',
    color: EMERALD,
    icon: Sliders,
    description: 'Render Master combines your vocal track with your instrumental via FFmpeg — professional mixing with preset profiles for different release formats.',
    steps: [
      {
        action: 'Select Mix Preset',
        detail: 'Choose from: Rapper Over Beat (hip-hop mix), Singer Over Beat (vocal-forward), Social Viral (compressed for social), Podcast Intro, TV Commercial.',
        tip: '"Rapper Over Beat" uses beat ducking — the instrumental automatically drops when vocals hit. This is the Billboard standard.'
      },
      {
        action: 'Render Final Mix',
        detail: 'Hit "Render Master" — FFmpeg processes your vocal + beat into a mastered output. Volume leveling, EQ balance, and format matching happen automatically.',
        tip: 'The output is mixing-ready, not mastering-ready. For distribution, run through the Mastering endpoint (44.1kHz/16-bit WAV or FLAC).'
      },
      {
        action: 'Master for Distribution',
        detail: 'Use the mastering API for distribution-ready output: streaming preset (Spotify/Apple Music LUFS targets), CD preset, or hi-res preset.',
        tip: 'Spotify targets -14 LUFS, Apple Music -16 LUFS. The streaming preset handles this automatically.'
      }
    ]
  },
  {
    phase: 8,
    title: 'The Release',
    subtitle: 'Export & Distribute',
    duration: '1 minute',
    color: GOLD,
    icon: Share2,
    description: 'Download your complete package — audio master, artwork, video, and lyrics — ready for distribution to all major platforms.',
    steps: [
      {
        action: 'Download All Assets',
        detail: 'Each generated asset (beat, vocals, mix, artwork, video) has a download button. Audio exports as MP3 (192kbps), images as PNG, video as MP4.',
        tip: 'Download BOTH the individual stems (vocal + beat separately) and the final mix. Distributors and sync licensors want stems.'
      },
      {
        action: 'Save to Project',
        detail: 'Hit "Save Project" — all assets, DNA references, settings, and metadata are persisted to your cloud profile. Resume any project anytime.',
        tip: 'Projects sync across devices via Firestore. Start on desktop, review on mobile.'
      },
      {
        action: 'Export for Distribution',
        detail: 'Use the Export JSON feature for complete project metadata — every setting, URL, and parameter is captured for reproducibility.',
        tip: 'Submit to DistroKid, TuneCore, or CD Baby. You own 100% of the output — no royalty splits, no label required.'
      }
    ]
  }
];

const CAPABILITY_MATRIX = [
  { component: 'Instrumental', provider: 'Stability AI (stable-audio-2.5)', maxDuration: '180s (3 min)', perGeneration: 'Single pass', canHit150: true },
  { component: 'Vocals (Rap)', provider: 'ElevenLabs (eleven_multilingual_v2)', maxDuration: 'No hard cap', perGeneration: 'Text-length dependent', canHit150: true },
  { component: 'Vocals (Singing)', provider: 'Suno API (v4)', maxDuration: '30-120s typical', perGeneration: 'Single generation', canHit150: true },
  { component: 'Cover Art', provider: 'Replicate (Flux 1.1 Pro)', maxDuration: 'N/A', perGeneration: '1024×1024 per gen', canHit150: true },
  { component: 'Music Video', provider: 'Veo 3.0 Fast (stitched)', maxDuration: '240s (4 min)', perGeneration: 'Background job', canHit150: true },
  { component: 'Final Mix', provider: 'FFmpeg (audioMixingService)', maxDuration: 'No limit', perGeneration: 'Instant', canHit150: true },
  { component: 'Mastering', provider: 'FFmpeg (distribution-ready)', maxDuration: 'No limit', perGeneration: 'Instant', canHit150: true }
];

const BILLBOARD_TIPS = [
  {
    title: 'Structure is King',
    description: 'Billboard hits follow a proven structure: Intro (4 bars) → Verse 1 (16 bars) → Chorus (8 bars) → Verse 2 (16 bars) → Chorus (8 bars) → Bridge (8 bars) → Outro (4 bars). Use 64 bars total.',
    icon: Target, color: ACCENT
  },
  {
    title: 'The 30-Second Rule',
    description: 'Spotify counts a "stream" after 30 seconds. Your intro + first verse MUST hook the listener in the first 30 seconds. Front-load your best bars.',
    icon: Clock, color: PINK
  },
  {
    title: 'Frequency Separation',
    description: 'Pro mixes separate: 808s in sub-bass (20-80Hz), kick in low-mid (80-200Hz), vocals in mid (200Hz-3kHz), hi-hats in presence (3-8kHz). The AI handles this via mix presets.',
    icon: Waves, color: CYAN
  },
  {
    title: 'Dynamic Contrast',
    description: 'Chart records BREATHE — quiet verses build tension, loud choruses release it. Mention "dynamic contrast" in your generation prompt for automatic energy mapping.',
    icon: BarChart3, color: ORANGE
  },
  {
    title: 'Hook Repetition',
    description: 'The chorus should appear 2-3 times. Billboard data shows the most-streamed songs repeat their hook 6-10 times across the track. Repetition breeds recognition.',
    icon: RefreshCw, color: EMERALD
  },
  {
    title: 'Cover Art Psychology',
    description: 'The top 100 Spotify covers share: one dominant color (60%), one focal point, high contrast, and readability at 40×40px thumbnail size. Design for the grid.',
    icon: Palette, color: GOLD
  }
];

export default function BillboardBlueprintPage({ onBack }) {
  const [expandedPhase, setExpandedPhase] = useState(0);
  const [showMatrix, setShowMatrix] = useState(false);

  const totalTime = '5-10 minutes';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 30%, #0a0a0f 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* ==================== HEADER ==================== */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10, 10, 15, 0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <button onClick={onBack} style={{
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
          <Trophy size={20} style={{ color: GOLD }} />
          <span style={{ fontSize: '1rem', fontWeight: '600', letterSpacing: '0.05em' }}>
            BILLBOARD BLUEPRINT
          </span>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      {/* ==================== HERO ==================== */}
      <section style={{
        padding: '80px 24px 60px', textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '700px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, rgba(168,85,247,0.05) 50%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '100px', padding: '6px 18px', marginBottom: '24px',
          fontSize: '0.85rem', color: GOLD, fontWeight: '600', letterSpacing: '0.08em'
        }}>
          <Crown size={14} /> PRODUCTION MASTERCLASS
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '800',
          fontFamily: 'Georgia, serif', lineHeight: '1.1', marginBottom: '20px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f59e0b 50%, #ec4899 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          How to Make a Billboard-Ranked Record
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', color: '#9ca3af',
          maxWidth: '760px', margin: '0 auto 24px', lineHeight: '1.7'
        }}>
          A complete 2:30 song — <strong style={{ color: 'white' }}>instrumental, vocals, artwork, and music video</strong> — produced
          entirely with AI in under 10 minutes. No studio. No label. No limits.
        </p>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 20px', borderRadius: '100px',
          background: `${EMERALD}15`, border: `1px solid ${EMERALD}30`,
          fontSize: '0.9rem', color: EMERALD, fontWeight: '600', marginBottom: '40px'
        }}>
          <CheckCircle size={16} /> Yes — 2:30 is fully supported. Up to 3 minutes in one pass.
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Production Time', value: '~10 min' },
            { label: 'Max Song Length', value: '3:00' },
            { label: 'Max Video Length', value: '4:00' },
            { label: 'Audio Quality', value: '192kbps' }
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: GOLD }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== CAPABILITY MATRIX ==================== */}
      <section style={{ padding: '0 24px 60px', maxWidth: '1100px', margin: '0 auto' }}>
        <button
          onClick={() => setShowMatrix(!showMatrix)}
          style={{
            width: '100%', padding: '16px 24px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'white', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            fontSize: '1rem', fontWeight: '600'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={18} style={{ color: CYAN }} />
            Technical Capability Matrix
          </span>
          <ChevronRight size={18} style={{
            transform: showMatrix ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 0.2s', color: '#6b7280'
          }} />
        </button>

        {showMatrix && (
          <div style={{
            marginTop: '12px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1.5fr 0.5fr',
              padding: '14px 20px', background: 'rgba(255,255,255,0.04)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.75rem', fontWeight: '700', color: '#6b7280',
              letterSpacing: '0.08em', textTransform: 'uppercase', gap: '12px'
            }}>
              <div>Component</div>
              <div>Provider</div>
              <div>Max Duration</div>
              <div>Per Generation</div>
              <div style={{ textAlign: 'center' }}>2:30?</div>
            </div>
            {CAPABILITY_MATRIX.map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1.5fr 0.5fr',
                padding: '12px 20px', borderBottom: i < CAPABILITY_MATRIX.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                fontSize: '0.85rem', alignItems: 'center', gap: '12px'
              }}>
                <div style={{ fontWeight: '600', color: '#d1d5db' }}>{row.component}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{row.provider}</div>
                <div style={{ color: CYAN, fontFamily: 'monospace', fontWeight: '600' }}>{row.maxDuration}</div>
                <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{row.perGeneration}</div>
                <div style={{ textAlign: 'center' }}>
                  {row.canHit150 ? (
                    <CheckCircle size={16} style={{ color: EMERALD }} />
                  ) : (
                    <AlertCircle size={16} style={{ color: '#ef4444' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==================== 8-PHASE PRODUCTION WALKTHROUGH ==================== */}
      <section style={{ padding: '0 24px 80px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: `${GOLD}15`, border: `1px solid ${GOLD}30`,
            borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
            fontSize: '0.8rem', color: GOLD, fontWeight: '700', letterSpacing: '0.1em'
          }}>
            <Play size={14} /> 8-PHASE WORKFLOW
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '12px'
          }}>
            From Idea to Release
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Eight phases. One session. Every asset you need for a complete release — beat, lyrics, vocals, artwork, video, mix, master, and export.
          </p>
        </div>

        {/* Phase Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PRODUCTION_PHASES.map((phase, i) => {
            const Icon = phase.icon;
            const isExpanded = expandedPhase === i;
            return (
              <div key={i} style={{
                background: isExpanded ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isExpanded ? `${phase.color}30` : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s'
              }}>
                {/* Phase Header */}
                <button
                  onClick={() => setExpandedPhase(isExpanded ? null : i)}
                  style={{
                    width: '100%', padding: '20px 24px', background: 'none', border: 'none',
                    color: 'white', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: '16px', textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `${phase.color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={22} style={{ color: phase.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px',
                        borderRadius: '100px', background: `${phase.color}20`, color: phase.color,
                        letterSpacing: '0.08em'
                      }}>
                        PHASE {phase.phase}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {phase.duration}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '700' }}>{phase.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{phase.subtitle}</div>
                  </div>
                  <ChevronRight size={18} style={{
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 0.2s', color: '#6b7280', flexShrink: 0
                  }} />
                </button>

                {/* Phase Content */}
                {isExpanded && (
                  <div style={{
                    padding: '0 24px 28px',
                    borderTop: `1px solid ${phase.color}15`
                  }}>
                    <p style={{
                      fontSize: '0.95rem', color: '#9ca3af', lineHeight: '1.6',
                      padding: '16px 0', margin: 0
                    }}>
                      {phase.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {phase.steps.map((step, j) => (
                        <div key={j} style={{
                          padding: '18px 20px', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '50%',
                              background: `${phase.color}20`, display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: '800', color: phase.color, flexShrink: 0
                            }}>
                              {j + 1}
                            </div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>{step.action}</h4>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: '1.6', margin: '0 0 10px', paddingLeft: '34px' }}>
                            {step.detail}
                          </p>
                          <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                            padding: '8px 12px', marginLeft: '34px', borderRadius: '8px',
                            background: 'rgba(245, 158, 11, 0.05)',
                            border: '1px solid rgba(245, 158, 11, 0.1)',
                            fontSize: '0.82rem', color: '#d1d5db'
                          }}>
                            <Lightbulb size={13} style={{ color: GOLD, flexShrink: 0, marginTop: '2px' }} />
                            {step.tip}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== BILLBOARD PRODUCTION TIPS ==================== */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(180deg, rgba(245,158,11,0.04) 0%, transparent 100%)',
        borderTop: '1px solid rgba(245,158,11,0.1)',
        borderBottom: '1px solid rgba(245,158,11,0.1)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: `${GOLD}15`, border: `1px solid ${GOLD}30`,
              borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
              fontSize: '0.8rem', color: GOLD, fontWeight: '700', letterSpacing: '0.1em'
            }}>
              <Star size={14} /> PRO SECRETS
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
              fontFamily: 'Georgia, serif', marginBottom: '12px'
            }}>
              What Makes a Billboard Hit
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              Six production principles that separate chart records from bedroom demos.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px'
          }}>
            {BILLBOARD_TIPS.map((tip, i) => {
              const Icon = tip.icon;
              return (
                <div key={i} style={{
                  padding: '28px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', transition: 'all 0.3s'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${tip.color}30`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `${tip.color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
                  }}>
                    <Icon size={22} style={{ color: tip.color }} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>{tip.title}</h3>
                  <p style={{ fontSize: '0.95rem', color: '#9ca3af', lineHeight: '1.6', margin: 0 }}>{tip.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== SAMPLE PROMPT ==================== */}
      <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '12px'
          }}>
            Try This Exact Prompt
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1.05rem' }}>
            Copy-paste this into the Studio Orchestrator for a complete 2:30 trap record.
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${ACCENT}25`,
          borderRadius: '16px', overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 24px', background: `${ACCENT}10`,
            borderBottom: `1px solid ${ACCENT}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: ACCENT, letterSpacing: '0.05em' }}>
              SAMPLE CONFIGURATION
            </span>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Trap • 140 BPM • 2:30</span>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {[
                { label: 'Genre', value: 'Trap', color: ACCENT },
                { label: 'BPM', value: '140', color: CYAN },
                { label: 'Duration', value: '150s (2:30)', color: PINK },
                { label: 'Bars', value: '64', color: ORANGE },
                { label: 'Structure', value: 'Full Song', color: EMERALD },
                { label: 'Voice', value: 'Rapper - Aggressive', color: GOLD },
                { label: 'Rap Style', value: 'Trap', color: INDIGO },
                { label: 'Output', value: 'Spotify Single', color: ACCENT }
              ].map(item => (
                <div key={item.label} style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    {item.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{
              padding: '18px 20px', borderRadius: '12px',
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
              fontFamily: '"Fira Code", "Cascadia Code", monospace',
              fontSize: '0.95rem', color: '#d1d5db', lineHeight: '1.8'
            }}>
              <span style={{ color: '#6b7280' }}>// Song concept prompt:</span><br />
              <span style={{ color: GOLD }}>"Make a trap anthem about a rap battle in NYC Brooklyn,</span><br />
              <span style={{ color: GOLD }}>aggressive 808s, dark energy, competitive bars with borough</span><br />
              <span style={{ color: GOLD }}>references, cinematic build, viral chorus hook, 64 bars,</span><br />
              <span style={{ color: GOLD }}>dynamic contrast between verses and chorus"</span>
            </div>

            <div style={{
              marginTop: '16px', padding: '12px 16px', borderRadius: '10px',
              background: `${EMERALD}08`, border: `1px solid ${EMERALD}15`,
              fontSize: '0.85rem', color: '#9ca3af', lineHeight: '1.5'
            }}>
              <CheckCircle size={14} style={{ color: EMERALD, marginRight: '8px', verticalAlign: 'middle' }} />
              Hit <strong style={{ color: 'white' }}>"Generate All"</strong> — the Orchestrator runs all 4 slots in parallel:
              lyrics, beat, vocals, and artwork. Total time: ~45 seconds.
              Then render the final mix, generate the video, and export.
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section style={{
        padding: '80px 24px', textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', bottom: '-200px', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '400px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, rgba(168,85,247,0.04) 50%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Trophy size={40} style={{ color: GOLD, marginBottom: '20px' }} />
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '16px'
          }}>
            Your Billboard Moment Starts Now
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1.05rem', marginBottom: '32px', lineHeight: '1.7' }}>
            A complete record — beat, lyrics, vocals, artwork, video, mix, and master — in under 10 minutes.
            No studio booking. No label deal. No permission needed.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { window.location.hash = '#/studio/agents'; }}
              style={{
                padding: '14px 36px', borderRadius: '100px', border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                color: 'white', fontSize: '1.05rem', fontWeight: '700',
                cursor: 'pointer', letterSpacing: '0.03em',
                boxShadow: '0 0 30px rgba(245,158,11,0.3)', transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              Start Your Record →
            </button>
            <button
              onClick={() => { window.location.hash = '#/dna'; }}
              style={{
                padding: '14px 28px', borderRadius: '100px',
                border: '1px solid rgba(168,85,247,0.3)',
                background: 'rgba(168,85,247,0.1)',
                color: ACCENT, fontSize: '1.05rem', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              DNA System
            </button>
            <button
              onClick={() => { window.location.hash = '#/vocals'; }}
              style={{
                padding: '14px 28px', borderRadius: '100px',
                border: '1px solid rgba(236,72,153,0.3)',
                background: 'rgba(236,72,153,0.1)',
                color: PINK, fontSize: '1.05rem', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              Vocal Lab
            </button>
          </div>
        </div>

        <div style={{
          marginTop: '48px', paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.8rem', color: '#4b5563'
        }}>
          © 2026 studioagentsai.com — Studio Agents DAI. All rights reserved.
        </div>
      </section>
    </div>
  );
}
