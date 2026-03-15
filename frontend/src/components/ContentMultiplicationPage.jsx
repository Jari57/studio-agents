import React, { useState } from 'react';
import {
  ArrowLeft, Zap, Music, Image, Video, Mic2,
  ChevronRight, CheckCircle, Clock, Play, Eye,
  Layers, Share2, BarChart3, TrendingUp, Sparkles,
  Calendar, Megaphone, Smartphone, Globe, Users,
  FileText, Download, Target, Repeat, ArrowRight
} from 'lucide-react';

// ============================================================
// CONTENT MULTIPLICATION ENGINE
// Turn one .wav into a 7-day social media campaign
// ============================================================

const ACCENT = '#a855f7';
const CYAN = '#06b6d4';
const PINK = '#ec4899';
const ORANGE = '#f97316';
const EMERALD = '#10b981';
const GOLD = '#f59e0b';
const INDIGO = '#6366f1';
const RED = '#ef4444';

const PREP_STEPS = [
  {
    title: 'The Visual Anchor',
    subtitle: 'Cover Art → Multi-Format Expansion',
    icon: Image,
    color: PINK,
    tool: 'Album Designer Agent (Flux 1.1 Pro)',
    description: 'Generate official square cover art based on the track\'s vibe, then expand it into vertical (9:16) and widescreen (16:9) formats.',
    actions: [
      'Generate square cover art from your song concept + genre + mood',
      'Use the Orchestrator\'s artwork slot — it auto-generates a cinematic visual',
      'Export the image, then re-prompt with "vertical 9:16 phone format" for TikTok/Reels backgrounds',
      'Re-prompt again with "widescreen 16:9" for YouTube thumbnails and banners'
    ],
    output: '3 format-matched visuals: 1:1 (cover), 9:16 (stories/reels), 16:9 (YouTube)'
  },
  {
    title: 'The Motion Assets',
    subtitle: 'Static → Animated Loops',
    icon: Video,
    color: CYAN,
    tool: 'Video Creator Agent (Replicate / Luma)',
    description: 'Animate your static 9:16 image into an 8-second loop. This becomes your Spotify Canvas, Reels background, and visualizer base.',
    actions: [
      'Upload your 9:16 vertical art as reference to the Video Creator agent',
      'Prompt: "camera slowly pushes in, atmospheric smoke moving, cinematic lighting"',
      'Generate 5-8 second video — this is your Spotify Canvas and Reels loop',
      'Generate a second variation with different motion for variety across platforms'
    ],
    output: '2 animated loops: 8s Spotify Canvas + 8s alternate background'
  },
  {
    title: 'The Short-Form Cuts',
    subtitle: 'Hooks + Kinetic Typography',
    icon: Smartphone,
    color: ORANGE,
    tool: 'Orchestrator Pipeline → Export Clips',
    description: 'Overlay the catchiest 15s and 30s hooks from your track onto animated backgrounds with AI-generated kinetic lyrics on screen.',
    actions: [
      'Identify the strongest 15-second and 30-second hook sections from your mixed audio',
      'Use the Video Creator to generate visuals synced to those audio cuts',
      'Layer bold, kinetic AI-generated lyrics using the video\'s caption overlay feature',
      'Export 3-5 variations with different crops, speeds, and typography styles'
    ],
    output: '3-5 short-form video clips: 15s hooks + 30s teasers with kinetic text'
  },
  {
    title: 'The Digital Experience',
    subtitle: 'Custom Pre-Save Landing Page',
    icon: Globe,
    color: INDIGO,
    tool: 'Ghostwriter Agent → Custom Microsite Concept',
    description: 'Generate a stylized pre-save landing page concept. If the artist\'s aesthetic calls for something nostalgic, create a retro-themed experience.',
    actions: [
      'Use Ghostwriter to draft pre-save copy, bio blurbs, and press quotes',
      'Design a unique microsite concept — retro OS, neon portal, graffiti wall, etc.',
      'Include pre-save links (Spotify, Apple Music), merch links, and social handles',
      'The landing page becomes a shareable digital experience, not just a link'
    ],
    output: 'Pre-save page concept + copy + social media bio text'
  }
];

const CAMPAIGN_DAYS = [
  {
    day: 1,
    title: 'The Tease',
    strategy: 'Atmosphere Building',
    icon: Eye,
    color: INDIGO,
    post: 'The 8-second animated loop with the instrumental intro of the track. No vocals yet.',
    caption: '"Setting the tone. Drop your pre-saves." (Link to custom microsite)',
    platforms: ['Instagram Reels', 'TikTok', 'YouTube Shorts'],
    assets: ['8s animated loop', 'Instrumental clip', 'Pre-save link'],
    tip: 'Mystery drives engagement. Reveal the vibe, not the track. Let people feel it first.'
  },
  {
    day: 2,
    title: 'The Studio Glimpse',
    strategy: 'Authenticity',
    icon: Mic2,
    color: PINK,
    post: 'A 15-second raw clip from the studio session. Show the moment the artist hits the perfect take or reacts to the beat drop.',
    caption: '"When the mix finally hits right."',
    platforms: ['Instagram Stories', 'TikTok', 'X'],
    assets: ['15s studio clip', 'Behind-the-scenes photo'],
    tip: 'Authenticity > polish for Day 2. Raw energy resonates more than perfect production.'
  },
  {
    day: 3,
    title: 'The World-Building',
    strategy: 'Digital Experiential',
    icon: Globe,
    color: CYAN,
    post: 'A screen recording navigating the custom-coded landing page. Show the cursor clicking through to find the hidden track snippet.',
    caption: '"Built a new world for this release. Explore it via the link in bio."',
    platforms: ['Instagram Reels', 'TikTok', 'X'],
    assets: ['Screen recording', 'Microsite link', 'Hidden snippet'],
    tip: 'Interactive experiences drive 3x higher engagement than static posts. Make them explore.'
  },
  {
    day: 4,
    title: 'The Hook Reveal',
    strategy: 'High Engagement',
    icon: Zap,
    color: GOLD,
    post: 'The 15-second vertical video with heavy kinetic AI typography. Features the most viral, catchy part of the vocal performance.',
    caption: '"Tag who you\'re playing this for in the car."',
    platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
    assets: ['15s kinetic type video', 'Audio hook clip'],
    tip: 'Day 4 is your engagement peak. Use the hardest-hitting hook with the boldest typography.'
  },
  {
    day: 5,
    title: 'Release Day',
    strategy: 'The Official Drop',
    icon: Sparkles,
    color: ACCENT,
    post: 'Instagram carousel: high-res cover art → artist quote about the song\'s meaning → screenshot of the track live on Spotify/Apple Music.',
    caption: '"Out now everywhere. Link in bio."',
    platforms: ['Instagram (Carousel)', 'X', 'YouTube Community'],
    assets: ['Cover art (1:1)', 'Artist quote card', 'Streaming screenshot', 'All links'],
    tip: 'Release day is about accessibility. Make it dead simple to find and play the track.'
  },
  {
    day: 6,
    title: 'The Instrumental / Creator Push',
    strategy: 'Community Creation',
    icon: Music,
    color: EMERALD,
    post: 'The pure beat with a looping visualizer. Strip vocals to isolate the instrumental — invite creators to stitch/remix.',
    caption: '"Calling all creators/producers: what would you do with this beat? Stitch this."',
    platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
    assets: ['Instrumental audio', 'Visualizer loop', 'Open invitation copy'],
    tip: 'User-generated content extends your campaign for free. Give people tools to create with your music.'
  },
  {
    day: 7,
    title: 'Community Highlight',
    strategy: 'Social Proof & Gratitude',
    icon: Users,
    color: ORANGE,
    post: 'Montage of the best fan comments, or screen-record the analytics dashboard showing first-week performance.',
    caption: '"Week one in the books. The Studio Agents roster is just getting started."',
    platforms: ['Instagram Stories', 'X', 'TikTok'],
    assets: ['Fan comment screenshots', 'Analytics screenshot', 'Thank-you graphic'],
    tip: 'Close the loop. Show your audience they\'re part of the story — it seeds loyalty for the next release.'
  }
];

const ASSET_SUMMARY = [
  { asset: 'Square Cover Art (1:1)', agent: 'Album Designer', credits: 3 },
  { asset: 'Vertical Art (9:16)', agent: 'Album Designer', credits: 3 },
  { asset: 'Widescreen Art (16:9)', agent: 'Album Designer', credits: 3 },
  { asset: 'Animated Loop (8s Canvas)', agent: 'Video Creator', credits: 15 },
  { asset: 'Alternate Motion Loop', agent: 'Video Creator', credits: 15 },
  { asset: '15s Hook Clips (×3)', agent: 'Orchestrator', credits: 8 },
  { asset: '30s Teaser Clip', agent: 'Orchestrator', credits: 8 },
  { asset: 'Mixed Master Track', agent: 'Beat + Vocal + Mix', credits: 7 },
  { asset: 'Instrumental Version', agent: 'Beat Maker', credits: 0 },
  { asset: 'Pre-save Copy & Bio', agent: 'Ghostwriter', credits: 1 },
  { asset: 'Kinetic Type Video', agent: 'Video Creator', credits: 15 },
  { asset: 'Captions & Hashtags (×7)', agent: 'Ghostwriter', credits: 1 },
];

export default function ContentMultiplicationPage({ onBack }) {
  const [expandedPrep, setExpandedPrep] = useState(0);
  const [expandedDay, setExpandedDay] = useState(null);
  const [showAssets, setShowAssets] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d18 40%, #0a0a0f 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* ==================== HEADER ==================== */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '12px 20px',
        background: 'rgba(10, 10, 15, 0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px', borderRadius: '10px', border: 'none',
            background: 'rgba(255,255,255,0.06)', color: 'white',
            cursor: 'pointer', display: 'flex', alignItems: 'center'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
            Content Multiplication Engine
          </h1>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280', fontWeight: '500' }}>
            1 Track → 7-Day Campaign — Powered by Studio Agents AI
          </p>
        </div>
      </header>

      {/* ==================== HERO ==================== */}
      <section style={{
        padding: '60px 24px 50px', textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '500px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, rgba(236,72,153,0.06) 40%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: '100px', padding: '6px 18px', marginBottom: '20px',
            fontSize: '0.8rem', color: ACCENT, fontWeight: '700', letterSpacing: '0.1em'
          }}>
            <Repeat size={14} /> CONTENT MULTIPLICATION
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: '800',
            fontFamily: 'Georgia, "Times New Roman", serif',
            lineHeight: '1.15', marginBottom: '16px', maxWidth: '750px', margin: '0 auto 16px'
          }}>
            One .WAV File.<br />
            <span style={{ color: ACCENT }}>Seven Days</span> of Content.
          </h2>

          <p style={{
            color: '#9ca3af', fontSize: '1.1rem', maxWidth: '650px',
            margin: '0 auto 32px', lineHeight: '1.7'
          }}>
            The exact blueprint for turning a single finished track into a full week of high-converting
            social media collateral — minimizing manual labor and maximizing reach.
          </p>

          {/* Quick stats */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '32px',
            flexWrap: 'wrap', marginBottom: '32px'
          }}>
            {[
              { label: 'Input', value: '1 Track', color: ACCENT },
              { label: 'AI Prep', value: '~2 Hours', color: CYAN },
              { label: 'Assets Out', value: '20+', color: PINK },
              { label: 'Campaign', value: '7 Days', color: GOLD },
              { label: 'Platforms', value: '4+', color: EMERALD }
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: stat.color, fontFamily: 'Georgia, serif' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline visual */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', flexWrap: 'wrap', opacity: 0.7
          }}>
            {['🎵 .WAV', '→', '🎨 Art', '→', '🎬 Video', '→', '✍️ Copy', '→', '📱 7-Day Campaign'].map((item, i) => (
              <span key={i} style={{
                fontSize: item === '→' ? '1.2rem' : '0.85rem',
                color: item === '→' ? '#4b5563' : '#d1d5db',
                fontWeight: item === '→' ? '400' : '600',
                padding: item === '→' ? '0' : '6px 12px',
                background: item === '→' ? 'none' : 'rgba(255,255,255,0.04)',
                borderRadius: '8px',
                border: item === '→' ? 'none' : '1px solid rgba(255,255,255,0.06)'
              }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PHASE 1: AI PREP DAY ==================== */}
      <section style={{ padding: '0 24px 60px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: `${CYAN}15`, border: `1px solid ${CYAN}30`,
            borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
            fontSize: '0.75rem', color: CYAN, fontWeight: '700', letterSpacing: '0.1em'
          }}>
            <Layers size={14} /> PHASE 1
          </div>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '10px'
          }}>
            The AI Prep Day
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1rem', maxWidth: '550px', margin: '0 auto' }}>
            Before a single post goes live, spend a few hours feeding the track through your AI stack to build the full toolkit.
          </p>
        </div>

        {/* Prep Steps Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PREP_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isExpanded = expandedPrep === i;
            return (
              <div key={i} style={{
                background: isExpanded ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isExpanded ? `${step.color}30` : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s'
              }}>
                <button
                  onClick={() => setExpandedPrep(isExpanded ? null : i)}
                  style={{
                    width: '100%', padding: '18px 22px', border: 'none',
                    background: 'transparent', color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: `${step.color}15`, border: `1px solid ${step.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={20} style={{ color: step.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1rem', fontWeight: '700' }}>{step.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>{step.subtitle}</div>
                  </div>
                  <div style={{
                    fontSize: '0.7rem', color: step.color, fontWeight: '600',
                    padding: '4px 10px', borderRadius: '6px',
                    background: `${step.color}10`, whiteSpace: 'nowrap',
                    marginRight: '10px'
                  }}>
                    {step.tool}
                  </div>
                  <ChevronRight size={18} style={{
                    color: '#6b7280', transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)'
                  }} />
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 22px 22px' }}>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6', marginTop: 0, marginBottom: '16px' }}>
                      {step.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {step.actions.map((action, j) => (
                        <div key={j} style={{
                          display: 'flex', gap: '10px', alignItems: 'flex-start',
                          padding: '12px 14px', borderRadius: '10px',
                          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)'
                        }}>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '6px',
                            background: `${step.color}20`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            fontSize: '0.7rem', fontWeight: '800', color: step.color
                          }}>
                            {j + 1}
                          </div>
                          <span style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: '1.5' }}>
                            {action}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      padding: '12px 16px', borderRadius: '10px',
                      background: `${EMERALD}08`, border: `1px solid ${EMERALD}15`,
                      fontSize: '0.85rem', color: '#9ca3af', lineHeight: '1.5',
                      display: 'flex', alignItems: 'flex-start', gap: '8px'
                    }}>
                      <Download size={14} style={{ color: EMERALD, flexShrink: 0, marginTop: '2px' }} />
                      <span><strong style={{ color: EMERALD }}>Output:</strong> {step.output}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== PHASE 2: 7-DAY PLAYBOOK ==================== */}
      <section style={{ padding: '0 24px 60px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: `${GOLD}15`, border: `1px solid ${GOLD}30`,
            borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
            fontSize: '0.75rem', color: GOLD, fontWeight: '700', letterSpacing: '0.1em'
          }}>
            <Calendar size={14} /> PHASE 2 — 7-DAY PLAYBOOK
          </div>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '10px'
          }}>
            The Distribution Playbook
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            Assets generated. Now roll them out across Instagram, TikTok, X, and YouTube Shorts 
            with this day-by-day campaign blueprint.
          </p>
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative' }}>
          {/* Vertical timeline line */}
          <div style={{
            position: 'absolute', left: '23px', top: '20px', bottom: '20px',
            width: '2px', background: 'linear-gradient(180deg, rgba(168,85,247,0.3), rgba(245,158,11,0.3), rgba(16,185,129,0.3))',
            borderRadius: '1px'
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {CAMPAIGN_DAYS.map((day, i) => {
              const Icon = day.icon;
              const isExpanded = expandedDay === i;
              return (
                <div key={i} style={{ paddingLeft: '56px', position: 'relative' }}>
                  {/* Day circle on timeline */}
                  <div style={{
                    position: 'absolute', left: '12px', top: '18px',
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isExpanded ? day.color : 'rgba(255,255,255,0.1)',
                    border: `2px solid ${day.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: '800',
                    color: isExpanded ? 'white' : day.color,
                    transition: 'all 0.3s', zIndex: 1
                  }}>
                    {day.day}
                  </div>

                  <div style={{
                    background: isExpanded ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isExpanded ? `${day.color}30` : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s'
                  }}>
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : i)}
                      style={{
                        width: '100%', padding: '16px 20px', border: 'none',
                        background: 'transparent', color: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left'
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: `${day.color}15`, border: `1px solid ${day.color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Icon size={18} style={{ color: day.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>Day {day.day}: {day.title}</span>
                          <span style={{
                            fontSize: '0.65rem', color: day.color, fontWeight: '600',
                            padding: '2px 8px', borderRadius: '4px', background: `${day.color}12`
                          }}>
                            {day.strategy}
                          </span>
                        </div>
                        {!isExpanded && (
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {day.post}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={16} style={{
                        color: '#6b7280', transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)'
                      }} />
                    </button>

                    {isExpanded && (
                      <div style={{ padding: '0 20px 20px' }}>
                        {/* What to post */}
                        <div style={{
                          padding: '14px 16px', borderRadius: '12px',
                          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)',
                          marginBottom: '12px'
                        }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6b7280', letterSpacing: '0.06em', marginBottom: '6px', textTransform: 'uppercase' }}>
                            What to Post
                          </div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#d1d5db', lineHeight: '1.6' }}>
                            {day.post}
                          </p>
                        </div>

                        {/* Caption */}
                        <div style={{
                          padding: '12px 16px', borderRadius: '10px',
                          background: `${day.color}06`, border: `1px solid ${day.color}15`,
                          marginBottom: '12px',
                          fontStyle: 'italic', fontSize: '0.9rem', color: '#d1d5db'
                        }}>
                          <FileText size={14} style={{ color: day.color, marginRight: '8px', verticalAlign: 'middle' }} />
                          <strong style={{ color: day.color, fontStyle: 'normal' }}>Caption:</strong> {day.caption}
                        </div>

                        {/* Platform + Assets row */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          <div style={{ flex: '1 1 200px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6b7280', letterSpacing: '0.06em', marginBottom: '6px', textTransform: 'uppercase' }}>
                              Platforms
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {day.platforms.map((p, k) => (
                                <span key={k} style={{
                                  fontSize: '0.75rem', padding: '4px 10px',
                                  borderRadius: '6px', background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  color: '#9ca3af', fontWeight: '500'
                                }}>
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div style={{ flex: '1 1 200px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6b7280', letterSpacing: '0.06em', marginBottom: '6px', textTransform: 'uppercase' }}>
                              Assets Needed
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {day.assets.map((a, k) => (
                                <span key={k} style={{
                                  fontSize: '0.75rem', padding: '4px 10px',
                                  borderRadius: '6px', background: `${day.color}08`,
                                  border: `1px solid ${day.color}15`,
                                  color: day.color, fontWeight: '500'
                                }}>
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Pro tip */}
                        <div style={{
                          padding: '10px 14px', borderRadius: '10px',
                          background: `${GOLD}08`, border: `1px solid ${GOLD}15`,
                          fontSize: '0.8rem', color: '#9ca3af', lineHeight: '1.5',
                          display: 'flex', alignItems: 'flex-start', gap: '8px'
                        }}>
                          <Target size={14} style={{ color: GOLD, flexShrink: 0, marginTop: '2px' }} />
                          <span><strong style={{ color: GOLD }}>Pro Tip:</strong> {day.tip}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== ASSET MATRIX ==================== */}
      <section style={{ padding: '0 24px 60px', maxWidth: '1000px', margin: '0 auto' }}>
        <button
          onClick={() => setShowAssets(!showAssets)}
          style={{
            width: '100%', padding: '16px 24px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'white', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            fontSize: '1rem', fontWeight: '600'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={18} style={{ color: CYAN }} />
            Full Asset Matrix — What You Get
          </span>
          <ChevronRight size={18} style={{
            transform: showAssets ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 0.2s', color: '#6b7280'
          }} />
        </button>

        {showAssets && (
          <div style={{
            marginTop: '12px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.8fr',
              padding: '14px 20px', background: 'rgba(255,255,255,0.04)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.75rem', fontWeight: '700', color: '#6b7280',
              letterSpacing: '0.08em', textTransform: 'uppercase', gap: '12px'
            }}>
              <div>Asset</div>
              <div>Created By</div>
              <div style={{ textAlign: 'center' }}>Credits</div>
            </div>
            {ASSET_SUMMARY.map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.8fr',
                padding: '12px 20px', borderBottom: i < ASSET_SUMMARY.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                fontSize: '0.85rem', alignItems: 'center', gap: '12px'
              }}>
                <div style={{ fontWeight: '600', color: '#d1d5db' }}>{row.asset}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{row.agent}</div>
                <div style={{ textAlign: 'center', color: CYAN, fontFamily: 'monospace', fontWeight: '700' }}>
                  {row.credits}
                </div>
              </div>
            ))}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.8fr',
              padding: '14px 20px', background: 'rgba(168,85,247,0.06)',
              borderTop: '1px solid rgba(168,85,247,0.15)',
              fontSize: '0.9rem', fontWeight: '700', gap: '12px'
            }}>
              <div style={{ color: '#d1d5db' }}>Total Campaign Cost</div>
              <div style={{ color: '#6b7280' }}>12 assets</div>
              <div style={{ textAlign: 'center', color: ACCENT, fontFamily: 'monospace', fontSize: '1.1rem' }}>
                ~{ASSET_SUMMARY.reduce((sum, r) => sum + r.credits, 0)}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ==================== SCALABILITY CALLOUT ==================== */}
      <section style={{ padding: '0 24px 60px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(236,72,153,0.06))',
          borderRadius: '20px', padding: '40px 32px',
          border: '1px solid rgba(168,85,247,0.15)',
          textAlign: 'center'
        }}>
          <TrendingUp size={32} style={{ color: ACCENT, marginBottom: '16px' }} />
          <h3 style={{
            fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Georgia, serif',
            marginBottom: '12px'
          }}>
            Why This Scales
          </h3>
          <p style={{
            color: '#9ca3af', fontSize: '1rem', lineHeight: '1.8',
            maxWidth: '600px', margin: '0 auto 24px'
          }}>
            By templating this workflow, your production company becomes incredibly scalable.
            The artist focuses entirely on making the music, and your AI stack handles the
            heavy lifting of content scaling. One person can run campaigns for an entire roster.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px', marginTop: '24px'
          }}>
            {[
              { icon: Clock, label: '2 Hours Prep', detail: 'vs. 2 weeks manual', color: CYAN },
              { icon: Layers, label: '20+ Assets', detail: 'from 1 source file', color: PINK },
              { icon: Share2, label: '4 Platforms', detail: 'format-optimized', color: EMERALD },
              { icon: Megaphone, label: '7-Day Runway', detail: 'fully scripted', color: GOLD }
            ].map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <div key={i} style={{
                  padding: '20px 16px', borderRadius: '14px',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <ItemIcon size={22} style={{ color: item.color, marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.detail}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section style={{
        padding: '60px 24px 80px', textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', bottom: '-200px', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '400px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, rgba(6,182,212,0.04) 50%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Sparkles size={36} style={{ color: ACCENT, marginBottom: '16px' }} />
          <h2 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: '800',
            fontFamily: 'Georgia, serif', marginBottom: '12px'
          }}>
            Start Your Campaign Now
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1rem', marginBottom: '28px', lineHeight: '1.7' }}>
            Upload your track, generate every asset, and have a full 7-day social campaign
            ready before your next meeting.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { window.location.hash = '#/studio/agents'; }}
              style={{
                padding: '14px 36px', borderRadius: '100px', border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: 'white', fontSize: '1.05rem', fontWeight: '700',
                cursor: 'pointer', letterSpacing: '0.03em',
                boxShadow: '0 0 30px rgba(168,85,247,0.3)', transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              Open Studio →
            </button>
            <button
              onClick={() => { window.location.hash = '#/billboard'; }}
              style={{
                padding: '14px 28px', borderRadius: '100px',
                border: '1px solid rgba(245,158,11,0.3)',
                background: 'rgba(245,158,11,0.1)',
                color: GOLD, fontSize: '1.05rem', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              Billboard Blueprint
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
