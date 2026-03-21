import React from 'react';
import { 
  Music, Sliders, Sparkles, Gauge
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// VOCAL SYNTHESIS CONTROLS — Advanced Pitch, Vibrato, Expression, Speed
// Controls for shaping AI vocal performances before generation
// ═══════════════════════════════════════════════════════════════════════════════

const EXPRESSION_PRESETS = [
  { id: 'neutral', label: 'Neutral', desc: 'Clean, natural delivery', icon: '🎯' },
  { id: 'passionate', label: 'Passionate', desc: 'Emotional intensity', icon: '🔥' },
  { id: 'aggressive', label: 'Aggressive', desc: 'Hard-hitting energy', icon: '💥' },
  { id: 'gentle', label: 'Gentle', desc: 'Soft, intimate tone', icon: '🌙' },
  { id: 'melancholic', label: 'Melancholic', desc: 'Soulful, reflective mood', icon: '💫' },
  { id: 'hype', label: 'Hype', desc: 'High-energy, ad-lib heavy', icon: '⚡' },
];

const VOCAL_POLISH_PRESETS = [
  { id: 'trap-hard', label: '🔥 Trap Hard', desc: 'Aggressive, deep, punchy delivery', voice: 'rapper', rap: 'aggressive', pitch: -2, speed: 1.0, vibrato: 0, expr: 'aggressive' },
  { id: 'melodic-rap', label: '🎶 Melodic Rap', desc: 'Sing-rap hybrid, smooth autotune feel', voice: 'rapper-melodic', rap: 'melodic', pitch: 2, speed: 0.9, vibrato: 30, expr: 'passionate' },
  { id: 'drill-energy', label: '💀 Drill', desc: 'Sliding hi-hats, dark energy', voice: 'rapper-young', rap: 'aggressive', pitch: -1, speed: 1.1, vibrato: 0, expr: 'hype' },
  { id: 'rnb-smooth', label: '💜 R&B Smooth', desc: 'Warm, soulful vocal tone', voice: 'singer', rap: 'melodic', pitch: 0, speed: 0.9, vibrato: 40, expr: 'gentle' },
  { id: 'pop-clean', label: '✨ Pop Clean', desc: 'Bright, radio-ready clarity', voice: 'singer-pop', rap: 'melodic', pitch: 1, speed: 1.0, vibrato: 20, expr: 'neutral' },
  { id: 'hype-anthem', label: '⚡ Hype Anthem', desc: 'Festival energy, big crowd feel', voice: 'rapper', rap: 'aggressive', pitch: 0, speed: 1.2, vibrato: 10, expr: 'hype' },
  { id: 'lo-fi-chill', label: '🌊 Lo-Fi Chill', desc: 'Relaxed, warm, nostalgic', voice: 'singer', rap: 'laid-back', pitch: -1, speed: 0.8, vibrato: 25, expr: 'melancholic' },
  { id: 'spoken-word', label: '🎙️ Spoken Word', desc: 'Poetic, intimate narration', voice: 'narrator', rap: 'storytelling', pitch: 0, speed: 0.9, vibrato: 5, expr: 'passionate' },
];

export default function VocalSynthControls({
  pitchShift = 0,        // semitones (-12 to +12)
  speed = 1.0,           // playback speed (0.5 to 2.0)
  vibrato = 0,           // vibrato depth (0-100)
  expression = 'neutral', // expression preset
  onPitchShiftChange,
  onSpeedChange,
  onVibratoChange,
  onExpressionChange,
  voiceStyle,            // current voiceStyle (optional)
  rapStyle,              // current rapStyle (optional)
  onVoiceStyleChange,    // setter for voiceStyle (optional)
  onRapStyleChange,      // setter for rapStyle (optional)
  isMobile = false
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(139, 92, 246, 0.08))',
      borderRadius: '14px',
      padding: isMobile ? '14px' : '18px',
      border: '1px solid rgba(236, 72, 153, 0.2)',
      marginTop: '16px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '14px'
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: 'rgba(236, 72, 153, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(236, 72, 153, 0.25)'
        }}>
          <Sliders size={14} color="#ec4899" />
        </div>
        <div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '700',
            color: '#ec4899'
          }}>
            Advanced Vocal Synthesis
          </span>
          <p style={{
            margin: 0,
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.4)'
          }}>
            Shape pitch, speed, vibrato, and expression
          </p>
        </div>
      </div>

      {/* Vocal Polish Presets — one-click genre presets */}
      {onVoiceStyleChange && onRapStyleChange && (
        <div style={{ marginBottom: '14px' }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: '700',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
            display: 'block'
          }}>
            Vocal Polish Presets
          </span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '6px'
          }}>
            {VOCAL_POLISH_PRESETS.map(preset => {
              const isActive = voiceStyle === preset.voice && rapStyle === preset.rap
                && pitchShift === preset.pitch && speed === preset.speed;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    onVoiceStyleChange(preset.voice);
                    onRapStyleChange(preset.rap);
                    onPitchShiftChange(preset.pitch);
                    onSpeedChange(preset.speed);
                    onVibratoChange(preset.vibrato);
                    onExpressionChange(preset.expr);
                  }}
                  title={preset.desc}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                    color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                    fontSize: '0.7rem',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', marginBottom: '2px' }}>{preset.label}</div>
                  <div style={{ fontSize: '0.55rem', opacity: 0.6, lineHeight: '1.3' }}>{preset.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '12px',
        marginBottom: '14px'
      }}>
        {/* Pitch Shift */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '10px',
          padding: '12px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Music size={12} color="#a78bfa" />
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#a78bfa',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Pitch Shift</span>
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              color: pitchShift === 0
                ? 'rgba(255,255,255,0.5)'
                : (pitchShift > 0 ? '#22c55e' : '#ef4444'),
              fontFamily: 'monospace',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(0,0,0,0.3)'
            }}>
              {pitchShift > 0 ? '+' : ''}{pitchShift} st
            </span>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={pitchShift}
            onChange={(e) => onPitchShiftChange(parseInt(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#a78bfa',
              height: '4px'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.25)',
            marginTop: '4px'
          }}>
            <span>-12 (Low)</span>
            <span>0</span>
            <span>+12 (High)</span>
          </div>
        </div>

        {/* Speed Control */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '10px',
          padding: '12px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gauge size={12} color="#22d3ee" />
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#22d3ee',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Speed</span>
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              color: speed === 1.0
                ? 'rgba(255,255,255,0.5)'
                : '#22d3ee',
              fontFamily: 'monospace',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(0,0,0,0.3)'
            }}>
              {speed.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#22d3ee',
              height: '4px'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.25)',
            marginTop: '4px'
          }}>
            <span>0.5x (Slow)</span>
            <span>1.0x</span>
            <span>2.0x (Fast)</span>
          </div>
        </div>

        {/* Vibrato Depth */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '10px',
          padding: '12px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={12} color="#f59e0b" />
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#f59e0b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Vibrato</span>
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              color: vibrato === 0
                ? 'rgba(255,255,255,0.5)'
                : '#f59e0b',
              fontFamily: 'monospace',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(0,0,0,0.3)'
            }}>
              {vibrato}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={vibrato}
            onChange={(e) => onVibratoChange(parseInt(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#f59e0b',
              height: '4px'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.25)',
            marginTop: '4px'
          }}>
            <span>None</span>
            <span>Subtle</span>
            <span>Heavy</span>
          </div>
        </div>

        {/* Speed Quick Presets */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '10px',
          padding: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: '700',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px'
          }}>Quick Settings</span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { label: 'Chipmunk', pitch: 6, speed: 1.2, vibrato: 10 },
              { label: 'Deep', pitch: -4, speed: 0.9, vibrato: 5 },
              { label: 'Robot', pitch: 0, speed: 1.0, vibrato: 0 },
              { label: 'Soulful', pitch: 0, speed: 0.9, vibrato: 50 },
              { label: 'Reset', pitch: 0, speed: 1.0, vibrato: 0 },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => {
                  onPitchShiftChange(preset.pitch);
                  onSpeedChange(preset.speed);
                  onVibratoChange(preset.vibrato);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: (pitchShift === preset.pitch && speed === preset.speed && vibrato === preset.vibrato)
                    ? 'rgba(139, 92, 246, 0.2)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${(pitchShift === preset.pitch && speed === preset.speed && vibrato === preset.vibrato)
                    ? 'rgba(139, 92, 246, 0.4)'
                    : 'rgba(255,255,255,0.08)'}`,
                  color: (pitchShift === preset.pitch && speed === preset.speed && vibrato === preset.vibrato)
                    ? '#a78bfa'
                    : 'rgba(255,255,255,0.4)',
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expression Presets */}
      <div>
        <span style={{
          fontSize: '0.65rem',
          fontWeight: '700',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '8px',
          display: 'block'
        }}>
          Expression Style
        </span>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
          gap: '6px'
        }}>
          {EXPRESSION_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => onExpressionChange(preset.id)}
              title={preset.desc}
              style={{
                padding: '8px 6px',
                borderRadius: '8px',
                background: expression === preset.id
                  ? 'rgba(236, 72, 153, 0.15)'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${expression === preset.id
                  ? 'rgba(236, 72, 153, 0.3)'
                  : 'rgba(255,255,255,0.06)'}`,
                color: expression === preset.id ? '#ec4899' : 'rgba(255,255,255,0.5)',
                fontSize: '0.7rem',
                fontWeight: expression === preset.id ? '700' : '500',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: '1rem' }}>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
