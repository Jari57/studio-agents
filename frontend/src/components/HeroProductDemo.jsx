import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Music, Image, Film, Mic, Zap, Play, Volume2, CheckCircle } from 'lucide-react';

/**
 * HeroProductDemo — Cinematic auto-playing product showcase
 * Shows Studio Agents creating a full song from a single prompt.
 * Acts as a "video" but is pure React + CSS — loads instantly, always current.
 */

const DEMO_PROMPT = 'Make a trap anthem about rising from nothing in Brooklyn, 32 bars, cinematic video';

const PIPELINE_STEPS = [
  {
    id: 'lyrics',
    agent: 'Ghostwriter',
    icon: Sparkles,
    color: '#a855f7',
    label: 'Writing Lyrics',
    output: [
      '[Verse 1]',
      'Started from the concrete, dreams in my pocket,',
      'Brooklyn nights, city lights, nobody could stop it,',
      'Every bar I spit is a piece of the pavement,',
      'From the basement to the stages, this is my statement.',
      '',
      '[Chorus]',
      'We rise, we rise, from nothing to the sky,',
      'No label, no deal, just fire in my eyes...'
    ],
    duration: 3500,
  },
  {
    id: 'beat',
    agent: 'Music GPT',
    icon: Music,
    color: '#06b6d4',
    label: 'Producing Beat',
    output: null, // waveform animation
    duration: 3000,
  },
  {
    id: 'art',
    agent: 'Album Artist',
    icon: Image,
    color: '#22c55e',
    label: 'Generating Cover Art',
    output: null, // image reveal
    duration: 2500,
  },
  {
    id: 'video',
    agent: 'Video Agent',
    icon: Film,
    color: '#ec4899',
    label: 'Creating Music Video',
    output: null, // video frame
    duration: 3000,
  },
];

// Typing animation hook
function useTypingAnimation(text, isActive, speed = 30) {
  const [displayText, setDisplayText] = useState('');
  const indexRef = useRef(0);
  
  useEffect(() => {
    if (!isActive) {
      setDisplayText('');
      indexRef.current = 0;
      return;
    }
    
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayText(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, isActive, speed]);
  
  return displayText;
}

// Waveform animation component
function WaveformVisualizer({ isActive, color }) {
  const bars = 40;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '2px', height: '80px', padding: '0 20px'
    }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '4px',
            borderRadius: '2px',
            background: `linear-gradient(180deg, ${color}, ${color}44)`,
            height: isActive ? `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 25}px` : '4px',
            transition: `height ${0.15 + Math.random() * 0.2}s ease`,
            animation: isActive ? `waveBar ${0.4 + Math.random() * 0.6}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.03}s`,
            opacity: isActive ? 0.9 : 0.2,
          }}
        />
      ))}
    </div>
  );
}

// Cover art reveal component  
function CoverArtReveal({ isActive }) {
  return (
    <div style={{
      width: '160px', height: '160px', margin: '0 auto',
      borderRadius: '16px', overflow: 'hidden',
      position: 'relative',
      transform: isActive ? 'scale(1) rotateY(0deg)' : 'scale(0.6) rotateY(90deg)',
      opacity: isActive ? 1 : 0,
      transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      boxShadow: isActive ? '0 20px 60px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.1)' : 'none',
    }}>
      {/* Generated art simulation — gradient + typography */}
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 30%, #0f3460 60%, #533483 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {/* City skyline silhouette */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
          clipPath: 'polygon(0% 100%, 5% 40%, 8% 45%, 12% 20%, 15% 25%, 18% 15%, 22% 30%, 25% 10%, 30% 35%, 35% 25%, 40% 40%, 45% 20%, 50% 30%, 55% 15%, 60% 35%, 65% 25%, 70% 40%, 75% 20%, 80% 35%, 85% 45%, 90% 30%, 95% 40%, 100% 100%)',
        }} />
        <div style={{
          fontSize: '0.65rem', fontWeight: '900', color: '#a855f7',
          letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px',
          textShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
        }}>RISING</div>
        <div style={{
          fontSize: '1.4rem', fontWeight: '900', color: 'white',
          letterSpacing: '-0.5px',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}>FROM</div>
        <div style={{
          fontSize: '1.4rem', fontWeight: '900',
          background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>NOTHING</div>
      </div>
    </div>
  );
}

// Video frame component
function VideoFrame({ isActive }) {
  return (
    <div style={{
      width: '220px', height: '124px', margin: '0 auto',
      borderRadius: '12px', overflow: 'hidden',
      position: 'relative',
      border: '2px solid rgba(236, 72, 153, 0.3)',
      transform: isActive ? 'scale(1)' : 'scale(0.8)',
      opacity: isActive ? 1 : 0,
      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      boxShadow: isActive ? '0 15px 40px rgba(236, 72, 153, 0.2)' : 'none',
    }}>
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #2d1b69 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {/* Animated bars / equalizer in video */}
        <div style={{
          display: 'flex', gap: '3px', alignItems: 'flex-end', height: '50px',
        }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              width: '6px', borderRadius: '3px',
              background: `linear-gradient(180deg, #ec4899, #a855f7)`,
              height: isActive ? `${15 + Math.sin(i * 0.8) * 20 + Math.random() * 15}px` : '3px',
              animation: isActive ? `waveBar ${0.3 + Math.random() * 0.5}s ease-in-out infinite alternate` : 'none',
              animationDelay: `${i * 0.05}s`,
            }} />
          ))}
        </div>
        {/* Play overlay */}
        <div style={{
          position: 'absolute', bottom: '8px', left: '8px',
          display: 'flex', alignItems: 'center', gap: '6px',
          color: 'rgba(255,255,255,0.7)', fontSize: '0.6rem',
        }}>
          <Play size={10} fill="currentColor" /> 0:30
        </div>
        {/* HD badge */}
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          padding: '2px 6px', borderRadius: '4px',
          background: 'rgba(236, 72, 153, 0.2)',
          border: '1px solid rgba(236, 72, 153, 0.4)',
          color: '#ec4899', fontSize: '0.5rem', fontWeight: '700',
        }}>4K</div>
      </div>
    </div>
  );
}

export default function HeroProductDemo({ onTryIt }) {
  const [phase, setPhase] = useState('idle'); // idle | typing | generating | done
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const timeoutRef = useRef(null);
  
  const promptText = useTypingAnimation(DEMO_PROMPT, phase === 'typing', 35);

  // Auto-start the demo after mount
  useEffect(() => {
    const startTimer = setTimeout(() => startDemo(), 1500);
    return () => clearTimeout(startTimer);
  }, []);

  const startDemo = () => {
    setPhase('typing');
    setActiveStep(-1);
    setCompletedSteps([]);
    setIsPlaying(true);

    // After typing completes, start pipeline
    timeoutRef.current = setTimeout(() => {
      setPhase('generating');
      runPipeline(0);
    }, DEMO_PROMPT.length * 35 + 800);
  };

  const runPipeline = (stepIndex) => {
    if (stepIndex >= PIPELINE_STEPS.length) {
      setPhase('done');
      setActiveStep(-1);
      // Loop after showing final state
      timeoutRef.current = setTimeout(() => {
        setCycleCount(c => c + 1);
        startDemo();
      }, 5000);
      return;
    }

    setActiveStep(stepIndex);
    timeoutRef.current = setTimeout(() => {
      setCompletedSteps(prev => [...prev, stepIndex]);
      runPipeline(stepIndex + 1);
    }, PIPELINE_STEPS[stepIndex].duration);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div style={{
      position: 'relative',
      maxWidth: '680px',
      margin: '0 auto',
    }}>
      {/* Cinematic glow background */}
      <div style={{
        position: 'absolute',
        top: '-40px', left: '-40px', right: '-40px', bottom: '-40px',
        background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Main demo container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(180deg, rgba(10, 10, 30, 0.95) 0%, rgba(15, 15, 35, 0.98) 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(168, 85, 247, 0.15)',
        overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0, 0, 0, 0.5), 0 0 80px rgba(168, 85, 247, 0.05)',
      }}>
        {/* Window chrome */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '14px 20px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }} />
          </div>
          <div style={{
            flex: 1, textAlign: 'center',
            fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)',
            fontFamily: 'monospace',
          }}>
            studioagents.ai — AI Orchestrator
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {isPlaying && (
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#22c55e',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            )}
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)' }}>
              {isPlaying ? 'LIVE' : 'READY'}
            </span>
          </div>
        </div>

        {/* Prompt input area */}
        <div style={{ padding: '20px 24px 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Zap size={18} color="white" />
            </div>
            <div style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '14px',
              padding: '12px 16px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              minHeight: '48px',
            }}>
              <div style={{
                fontSize: '0.85rem',
                color: phase === 'idle' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.85)',
                lineHeight: '1.5',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}>
                {phase === 'idle' ? 'Describe your song...' : promptText}
                {phase === 'typing' && (
                  <span style={{
                    display: 'inline-block',
                    width: '2px', height: '14px',
                    background: '#a855f7',
                    marginLeft: '2px',
                    verticalAlign: 'middle',
                    animation: 'blink 0.8s step-end infinite',
                  }} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline agents */}
        {(phase === 'generating' || phase === 'done') && (
          <div style={{
            padding: '0 24px 20px',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {/* Agent status bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              marginBottom: '4px',
            }}>
              {PIPELINE_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = activeStep === i;
                const isCompleted = completedSteps.includes(i);

                return (
                  <div key={step.id} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    padding: '10px 6px',
                    borderRadius: '12px',
                    background: isActive
                      ? `${step.color}12`
                      : isCompleted
                        ? `${step.color}08`
                        : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${
                      isActive ? `${step.color}40` : isCompleted ? `${step.color}20` : 'rgba(255,255,255,0.04)'
                    }`,
                    transition: 'all 0.4s ease',
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: isActive || isCompleted ? `${step.color}20` : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                    }}>
                      {isCompleted ? (
                        <CheckCircle size={14} style={{ color: step.color }} />
                      ) : (
                        <StepIcon size={14} style={{
                          color: isActive ? step.color : 'rgba(255,255,255,0.2)',
                        }} />
                      )}
                      {isActive && (
                        <div style={{
                          position: 'absolute', inset: '-3px',
                          borderRadius: '11px',
                          border: `2px solid ${step.color}40`,
                          animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.55rem', fontWeight: '600',
                      color: isActive ? step.color : isCompleted ? `${step.color}aa` : 'rgba(255,255,255,0.2)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}>
                      {step.agent}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Active generation display */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
              padding: '16px',
              minHeight: '130px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Shimmer loading effect when active */}
              {activeStep >= 0 && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: `linear-gradient(90deg, transparent, ${PIPELINE_STEPS[activeStep]?.color || '#a855f7'}, transparent)`,
                  animation: 'shimmer 1.5s ease-in-out infinite',
                }} />
              )}

              {/* Lyrics output */}
              {(activeStep === 0 || (completedSteps.includes(0) && activeStep <= 0)) && (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
                    color: '#a855f7', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    <Sparkles size={10} /> Ghostwriter Output
                  </div>
                  <div style={{
                    fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)',
                    lineHeight: '1.6', whiteSpace: 'pre-line',
                  }}>
                    {PIPELINE_STEPS[0].output.slice(0, activeStep === 0 ? 
                      Math.floor((Date.now() % 3500) / 400) + 1 : undefined
                    ).join('\n')}
                  </div>
                </div>
              )}

              {/* Beat output */}
              {(activeStep === 1 || (completedSteps.includes(1) && !completedSteps.includes(2))) && (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
                    color: '#06b6d4', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    <Music size={10} /> Music GPT — 140 BPM Trap
                  </div>
                  <WaveformVisualizer isActive={activeStep === 1} color="#06b6d4" />
                  {completedSteps.includes(1) && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px',
                      justifyContent: 'center',
                    }}>
                      <Volume2 size={12} style={{ color: '#06b6d4' }} />
                      <div style={{
                        flex: 1, maxWidth: '200px', height: '3px',
                        background: 'rgba(6, 182, 212, 0.2)', borderRadius: '2px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: '60%', height: '100%',
                          background: '#06b6d4', borderRadius: '2px',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>0:30</span>
                    </div>
                  )}
                </div>
              )}

              {/* Cover art output */}
              {(activeStep === 2 || (completedSteps.includes(2) && !completedSteps.includes(3))) && (
                <div style={{ animation: 'fadeIn 0.5s ease', textAlign: 'center' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px',
                    justifyContent: 'center',
                    color: '#22c55e', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    <Image size={10} /> Album Artist — Cover Art
                  </div>
                  <CoverArtReveal isActive={activeStep === 2 || completedSteps.includes(2)} />
                </div>
              )}

              {/* Video output */}
              {(activeStep === 3 || completedSteps.includes(3)) && (
                <div style={{ animation: 'fadeIn 0.5s ease', textAlign: 'center' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px',
                    justifyContent: 'center',
                    color: '#ec4899', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    <Film size={10} /> Video Agent — Music Video
                  </div>
                  <VideoFrame isActive={activeStep === 3 || completedSteps.includes(3)} />
                </div>
              )}

              {/* Final state — all done */}
              {phase === 'done' && (
                <div style={{
                  animation: 'fadeIn 0.8s ease',
                  textAlign: 'center',
                  padding: '8px 0',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    marginBottom: '12px',
                  }}>
                    <CheckCircle size={20} style={{ color: '#22c55e' }} />
                    <span style={{
                      fontSize: '1rem', fontWeight: '700', color: 'white',
                    }}>Release Package Ready</span>
                  </div>
                  <div style={{
                    display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap',
                  }}>
                    {[
                      { label: 'Lyrics', color: '#a855f7', icon: Sparkles },
                      { label: '30s Beat', color: '#06b6d4', icon: Music },
                      { label: 'Cover Art', color: '#22c55e', icon: Image },
                      { label: 'Video', color: '#ec4899', icon: Film },
                    ].map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <div key={item.label} style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px', borderRadius: '8px',
                          background: `${item.color}15`,
                          border: `1px solid ${item.color}30`,
                        }}>
                          <ItemIcon size={10} style={{ color: item.color }} />
                          <span style={{
                            fontSize: '0.6rem', fontWeight: '600', color: item.color,
                          }}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom bar — timing */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Zap size={10} />
            {phase === 'done' ? '4 agents completed in ~12 seconds' : 
             phase === 'generating' ? `${completedSteps.length}/4 agents working...` :
             phase === 'typing' ? 'Describe your vision...' : 'Ready to create'}
          </div>
          {phase === 'done' && onTryIt && (
            <button
              onClick={onTryIt}
              style={{
                padding: '6px 14px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                border: 'none', color: 'white',
                fontSize: '0.7rem', fontWeight: '700',
                cursor: 'pointer',
                animation: 'fadeIn 0.5s ease',
              }}
            >
              Try It Free →
            </button>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes waveBar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}