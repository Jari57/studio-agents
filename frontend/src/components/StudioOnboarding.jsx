import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, Music, Video, Image, FileText, ArrowRight, X } from 'lucide-react';

// =============================================================================
// STUDIO ONBOARDING - Single-screen, idea-first design
// Type your idea -> one click -> you're in the studio
// =============================================================================

const PROMPTS = [
  'trap anthem about making it from nothing',
  'dreamy R&B song about late nights in the city',
  'hard-hitting drill beat, 140 BPM, dark strings',
  'indie pop song about moving on',
  'cinematic hip-hop instrumental with brass',
  'afrobeats banger about celebration',
  'lo-fi chill track for late night studying',
];

const FEATURES = [
  { icon: FileText, label: 'Lyrics', color: "var(--studio-accent)", desc: 'Verses, hooks & hooks' },
  { icon: Music,    label: 'Beats',  color: "var(--studio-blue)", desc: 'Full instrumentals' },
  { icon: Mic,      label: 'Vocals', color: "var(--studio-accent)", desc: 'AI singing & rap' },
  { icon: Video,    label: 'Video',  color: "var(--studio-danger)", desc: 'Music videos' },
  { icon: Image,    label: 'Art',    color: '#fb923c', desc: 'Album covers' },
];

export default function StudioOnboarding({ userName, onComplete, onSkip, isMobile = false }) {
  const [idea, setIdea] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isEntering, setIsEntering] = useState(false);
  const inputRef = useRef(null);

  // Cycle placeholder prompts every 3.5s
  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % PROMPTS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Auto-focus input on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    if (isEntering) return;
    setIsEntering(true);
    onComplete(idea.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleEnter();
  };

  const firstName = userName ? userName.split(' ')[0] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Studio Agents"
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        animation: 'onboarding-fade-in 0.4s ease both',
      }}
    >
      <style>{`
        @keyframes onboarding-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes onboarding-card-in {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes onboarding-orb-a {
          0%,100% { transform: translate(0,0)    scale(1);   }
          50%      { transform: translate(30px,-20px) scale(1.1); }
        }
        @keyframes onboarding-orb-b {
          0%,100% { transform: translate(0,0)     scale(1);   }
          50%      { transform: translate(-25px,18px) scale(1.08); }
        }
        @keyframes onboarding-bar {
          0%,100% { transform: scaleY(0.4); }
          50%      { transform: scaleY(1);   }
        }
        @keyframes onboarding-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.4); }
          50%      { box-shadow: 0 0 0 8px rgba(168,85,247,0); }
        }
      `}</style>

      {/* Card */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
        maxHeight: 'min(680px, calc(100svh - 32px))',
        display: 'flex',
        flexDirection: 'column',
        background: "linear-gradient(160deg, var(--studio-surface) 0%, var(--studio-surface) 60%, var(--studio-surface) 100%)",
        borderRadius: '24px',
        border: "1px solid rgba(163,66,41, 0.25)",
        boxShadow: "0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(163,66,41, 0.08) inset",
        overflow: 'hidden',
        animation: 'onboarding-card-in 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both',
      }}>

        {/* Ambient orbs */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '-80px', left: '-60px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: "radial-gradient(circle, rgba(163,66,41, 0.18) 0%, transparent 70%)",
          animation: 'onboarding-orb-a 7s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: '-60px', right: '-40px',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)',
          animation: 'onboarding-orb-b 9s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Skip */}
        <button
          onClick={onSkip}
          aria-label="Skip onboarding"
          style={{
            position: 'absolute', top: '14px', right: '14px', zIndex: 10,
            background: "rgba(var(--studio-ink-rgb), 0.06)", border: "1px solid rgba(var(--studio-ink-rgb), 0.08)",
            borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: "var(--studio-muted)",
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(var(--studio-ink-rgb), 0.1)"; e.currentTarget.style.color = "var(--studio-ink)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(var(--studio-ink-rgb), 0.06)"; e.currentTarget.style.color = "var(--studio-muted)"; }}
        >
          <X size={15} />
        </button>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '36px 20px 24px' : '44px 32px 28px' }}>

          {/* Waveform decoration */}
          <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginBottom: '20px' }}>
            {[0.5,0.8,1,0.6,1,0.8,0.5,0.7,1,0.6,0.9,0.4,1,0.7,0.5].map((h, i) => (
              <div key={i} style={{
                width: '3px', borderRadius: '2px',
                height: `${h * 28}px`,
                background: `linear-gradient(180deg, var(--studio-accent), var(--studio-blue))`,
                opacity: 0.6,
                animation: `onboarding-bar ${1.2 + (i % 5) * 0.3}s ${i * 0.07}s ease-in-out infinite`,
                transformOrigin: 'center',
              }} />
            ))}
          </div>

          {/* Headline */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: "rgba(163,66,41, 0.12)", border: "1px solid rgba(163,66,41, 0.22)",
              borderRadius: '20px', padding: '4px 12px', marginBottom: '14px',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
              color: "rgba(163,66,41, 0.9)", textTransform: 'uppercase',
            }}>
              <Sparkles size={11} /> 16 AI Agents
            </div>
            <h1 style={{
              fontSize: isMobile ? 'clamp(1.5rem,6vw,1.9rem)' : '2rem',
              fontWeight: 900, lineHeight: 1.15, color: "var(--studio-ink)", margin: '0 0 10px',
              letterSpacing: '-0.02em',
            }}>
              {firstName ? `Hey ${firstName}, let's make\nsomething legendary.` : 'Make something\nlegendary.'}
            </h1>
            <p style={{ fontSize: '0.9rem', color: "var(--studio-muted)", lineHeight: 1.5, margin: 0 }}>
              Type your idea below - lyrics, beat, vocals, video & art in one shot.
            </p>
          </div>

          {/* Feature pills */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px',
            justifyContent: 'center', marginBottom: '24px',
          }}>
            {FEATURES.map(({ icon: Icon, label, color, desc }) => (
              <div key={label} title={desc} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: `color-mix(in srgb, ${color} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 18%, transparent)`,
                borderRadius: '20px', padding: '6px 12px',
                fontSize: '0.78rem', fontWeight: 600, color,
                cursor: 'default',
              }}>
                <Icon size={13} /> {label}
              </div>
            ))}
          </div>

          {/* Idea input */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <textarea
              ref={inputRef}
              value={idea}
              onChange={e => setIdea(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PROMPTS[placeholderIdx]}
              rows={2}
              aria-label="Describe what you want to create"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '14px 16px', borderRadius: '14px', resize: 'none',
                background: "rgba(var(--studio-ink-rgb), 0.05)",
                border: "1.5px solid rgba(163,66,41, 0.3)",
                color: "var(--studio-ink)", fontSize: '0.93rem', lineHeight: 1.5,
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                caretColor: '#a855f7',
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(163,66,41, 0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(163,66,41, 0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(163,66,41, 0.3)"; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* CTA */}
          <button
            onClick={handleEnter}
            disabled={isEntering}
            style={{
              width: '100%', padding: '15px 24px',
              borderRadius: '14px', border: 'none', cursor: isEntering ? 'default' : 'pointer',
              background: 'var(--studio-accent)',
              backgroundSize: '200% 200%',
              color: "var(--studio-on-accent)", fontSize: '1rem', fontWeight: 800,
              letterSpacing: '0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: isEntering ? 'none' : "0 4px 24px rgba(163,66,41, 0.4)",
              transition: 'all 0.2s ease',
              animation: isEntering ? 'none' : 'onboarding-pulse 2.5s 1.5s ease-in-out infinite',
            }}
            onMouseEnter={e => { if (!isEntering) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = "0 8px 32px rgba(163,66,41, 0.55)"; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isEntering ? 'none' : "0 4px 24px rgba(163,66,41, 0.4)"; }}
          >
            {isEntering ? (
              <>Entering Studio...</>
            ) : (
              <>Enter Studio <ArrowRight size={18} strokeWidth={2.5} /></>
            )}
          </button>

        </div>

        {/* Footer note */}
        <div style={{
          textAlign: 'center', padding: '10px 24px 18px',
          fontSize: '0.72rem', color: "var(--studio-muted)",
          borderTop: "1px solid rgba(var(--studio-ink-rgb), 0.05)",
        }}>
          4 agents free forever &middot; No credit card needed
        </div>
      </div>
    </div>
  );
}
