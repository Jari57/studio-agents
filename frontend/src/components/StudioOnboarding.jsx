import React, { useState } from 'react';
import { 
  Sparkles, Music, Mic, Video, Image, FileText, Zap, Star, 
  ChevronRight, ChevronLeft, Trophy, Headphones, Disc, Globe,
  Rocket, ArrowRight, Play, BookOpen, HelpCircle, Award, X
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// STUDIO ONBOARDING — Multi-step welcome & A&R Suite walkthrough
// Shows how the platform works, examples, help, saving, and badge intro
// ═══════════════════════════════════════════════════════════════════════════════

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Studio Agents',
    subtitle: 'Your AI-powered A&R Suite',
    emoji: '🎧',
    content: 'Think of this as your personal A&R team — 16 AI agents that write, produce, mix, master, and market your music. From lyrics to release, it\'s all here.',
    visual: 'hero',
  },
  {
    id: 'how-it-works',
    title: 'How It Works',
    subtitle: '3 simple steps to a finished track',
    emoji: '⚡',
    content: null, // Custom render
    visual: 'steps',
  },
  {
    id: 'examples',
    title: 'What You Can Create',
    subtitle: 'Real examples from the studio',
    emoji: '🎵',
    content: null,
    visual: 'examples',
  },
  {
    id: 'saving',
    title: 'Save & Organize',
    subtitle: 'Your work is always safe',
    emoji: '💾',
    content: 'Every creation auto-saves to your project. You can organize by category (Pro Studio, Mixtapes, Videos, Scores), favorite projects, and pick up where you left off.',
    visual: 'saving',
  },
  {
    id: 'badges',
    title: 'Earn Badges',
    subtitle: 'Unlock achievements as you create',
    emoji: '🏆',
    content: null,
    visual: 'badges',
  },
  {
    id: 'help',
    title: 'Need Help?',
    subtitle: 'We\'ve got you covered',
    emoji: '💡',
    content: null,
    visual: 'help',
  },
];

// Badge previews for the onboarding
const BADGE_PREVIEWS = [
  { name: 'Wordsmith', desc: 'Write your first lyrics', icon: FileText, color: '#a855f7' },
  { name: 'Beat Maker', desc: 'Generate your first beat', icon: Music, color: '#22d3ee' },
  { name: 'Voice Activated', desc: 'Create your first vocal', icon: Mic, color: '#f472b6' },
  { name: 'Full Song', desc: 'Lyrics + beat + vocals', icon: Rocket, color: '#10b981' },
  { name: 'Multi-Talented', desc: 'Use 4 different agents', icon: Star, color: '#8b5cf6' },
  { name: 'Century Club', desc: '100 generations', icon: Trophy, color: '#f59e0b' },
];

// Example creations
const EXAMPLE_CREATIONS = [
  {
    title: 'Summer Anthem',
    agents: ['Ghostwriter → Music GPT → Vocal Lab'],
    desc: '"Write me a summer banger about LA nights" → Full lyrics → Beat production → Vocal recording',
    icon: Music,
    color: '#22d3ee',
  },
  {
    title: 'Album Cover Art',
    agents: ['Album Artist'],
    desc: '"Dark gothic aesthetic with neon accents" → AI-generated artwork matching your sonic DNA',
    icon: Image,
    color: '#fb923c',
  },
  {
    title: 'Music Video',
    agents: ['Video Agent → Album Artist'],
    desc: '"Cinematic visuals synced to my beat" → Beat-synchronized frames → Full video export',
    icon: Video,
    color: '#ef4444',
  },
  {
    title: 'Release Strategy',
    agents: ['Trend Hunter → Release Manager'],
    desc: '"Plan my single drop for maximum impact" → Platform analysis → Rollout checklist',
    icon: Globe,
    color: '#22c55e',
  },
];

// How it works steps
const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Pick an Agent',
    desc: 'Choose from 16 agents — lyrics, beats, vocals, video, mastering, marketing, and more.',
    icon: Sparkles,
    color: '#a855f7',
  },
  {
    step: 2,
    title: 'Describe What You Want',
    desc: 'Type a prompt or use voice input. Be as creative or specific as you want.',
    icon: Zap,
    color: '#22d3ee',
  },
  {
    step: 3,
    title: 'Refine & Build',
    desc: 'Iterate, mix, chain agents together. Save to your project when it sounds right.',
    icon: Headphones,
    color: '#10b981',
  },
];

export default function StudioOnboarding({ 
  userName, 
  onComplete, 
  onSkip, 
  onStartTour,
  isMobile = false 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = ONBOARDING_STEPS[currentStep];
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirst = currentStep === 0;

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(p => p + 1);
    }
  };

  const back = () => {
    if (!isFirst) setCurrentStep(p => p - 1);
  };

  const renderStepContent = () => {
    switch (step.visual) {
      case 'hero':
        return (
          <div style={{ textAlign: 'center', padding: '0 8px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>{step.emoji}</div>
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              {userName ? `Welcome, ${userName.split(' ')[0]}!` : step.title}
            </h2>
            <div style={{ fontSize: '0.9rem', color: 'rgba(168,85,247,0.8)', fontWeight: 600, marginBottom: '16px' }}>
              {step.subtitle}
            </div>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', maxWidth: '420px', margin: '0 auto' }}>
              {step.content}
            </p>
            {/* Agent count pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '20px', padding: '8px 16px', marginTop: '20px',
              fontSize: '0.82rem', color: 'rgba(168,85,247,0.8)', fontWeight: 600,
            }}>
              <Sparkles size={14} /> 16 AI Agents • 4 Free Forever
            </div>
          </div>
        );

      case 'steps':
        return (
          <div style={{ padding: '0 8px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{step.emoji}</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{step.title}</h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{step.subtitle}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {HOW_IT_WORKS.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: '14px',
                  padding: '16px', border: `1px solid ${item.color}22`,
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    background: `${item.color}15`, border: `1px solid ${item.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <item.icon size={20} color={item.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                      <span style={{ color: item.color, marginRight: '6px' }}>{item.step}.</span>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                      {item.desc}
                    </div>
                  </div>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <ArrowRight size={14} color="rgba(255,255,255,0.15)" style={{ flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'examples':
        return (
          <div style={{ padding: '0 8px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{step.emoji}</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{step.title}</h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{step.subtitle}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
              {EXAMPLE_CREATIONS.map((ex, i) => (
                <div key={i} style={{
                  background: `linear-gradient(135deg, ${ex.color}08, transparent)`,
                  border: `1px solid ${ex.color}22`,
                  borderRadius: '12px', padding: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <ex.icon size={16} color={ex.color} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{ex.title}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: ex.color, fontWeight: 600, marginBottom: '6px' }}>
                    {ex.agents[0]}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.4' }}>
                    {ex.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'saving':
        return (
          <div style={{ textAlign: 'center', padding: '0 8px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{step.emoji}</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>{step.title}</h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>{step.subtitle}</p>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', maxWidth: '420px', margin: '0 auto 20px' }}>
              {step.content}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
              {[
                { label: 'Auto-Save', emoji: '✨', desc: 'Every generation saved instantly' },
                { label: 'Projects Hub', emoji: '📁', desc: 'Organize by category' },
                { label: 'Favorites', emoji: '⭐', desc: 'Star your best work' },
                { label: 'Export', emoji: '📤', desc: 'Download anytime' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                  padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)',
                  width: isMobile ? '45%' : '140px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{item.emoji}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{item.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'badges':
        return (
          <div style={{ padding: '0 8px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{step.emoji}</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{step.title}</h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{step.subtitle}</p>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '18px', lineHeight: '1.5' }}>
              Earn badges for your first lyrics, first beat, first vocal, using multiple agents, completing full songs, and more. Track your progress in the Achievements panel.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {BADGE_PREVIEWS.map((badge, i) => (
                <div key={i} style={{
                  background: `${badge.color}08`, borderRadius: '12px',
                  padding: '14px 8px', textAlign: 'center',
                  border: `1px solid ${badge.color}22`,
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', margin: '0 auto 8px',
                    background: `${badge.color}18`, border: `1px solid ${badge.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <badge.icon size={18} color={badge.color} />
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{badge.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{badge.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'help':
        return (
          <div style={{ textAlign: 'center', padding: '0 8px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{step.emoji}</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>{step.title}</h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>{step.subtitle}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              {[
                { icon: Play, color: '#22d3ee', label: 'Guided Tour', desc: 'Step-by-step walkthrough of every feature' },
                { icon: BookOpen, color: '#a855f7', label: 'Agent Info Cards', desc: 'Tap any agent for examples, tips, and how-to guides' },
                { icon: HelpCircle, color: '#f472b6', label: 'Help & FAQ', desc: 'Search answers, contact support, report issues' },
                { icon: Award, color: '#f59e0b', label: 'Achievements', desc: 'Track your progress and unlock badges' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                  padding: '14px', border: `1px solid ${item.color}18`,
                }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                    background: `${item.color}15`, border: `1px solid ${item.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <item.icon size={18} color={item.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay animate-fadeIn" role="dialog" aria-modal="true" aria-label="Studio Onboarding" style={{
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="modal-content" style={{
        maxWidth: isMobile ? '95%' : '540px', width: '90%',
        position: 'relative', maxHeight: '90vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        borderRadius: '20px',
      }}>
        {/* Close/Skip button */}
        <button onClick={onSkip} aria-label="Close onboarding" style={{
          position: 'absolute', top: '14px', right: '14px', zIndex: 10,
          background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
          width: '34px', height: '34px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
        }}>
          <X size={18} />
        </button>

        {/* Step indicator dots */}
        <div role="tablist" aria-label="Onboarding steps" style={{
          display: 'flex', justifyContent: 'center', gap: '6px',
          padding: '16px 16px 0',
        }}>
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} role="tab" aria-selected={i === currentStep} aria-label={`Step ${i + 1} of ${ONBOARDING_STEPS.length}`} onClick={() => setCurrentStep(i)} style={{
              width: i === currentStep ? '24px' : '8px', height: '8px',
              borderRadius: '4px', cursor: 'pointer',
              background: i === currentStep ? 'linear-gradient(90deg, #a855f7, #22d3ee)' 
                : i < currentStep ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.12)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Content area */}
        <div style={{
          flex: 1, overflow: 'auto', padding: isMobile ? '20px 16px' : '24px 28px',
        }}>
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          gap: '12px',
        }}>
          {!isFirst ? (
            <button onClick={back} aria-label="Previous step" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', borderRadius: '12px', border: 'none',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            }}>
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <button onClick={onSkip} style={{
              padding: '10px 16px', borderRadius: '12px', border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
            }}>
              Skip
            </button>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            {isLast && onStartTour && (
              <button onClick={() => { onComplete(); setTimeout(onStartTour, 300); }} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', borderRadius: '12px',
                border: '1px solid rgba(168,85,247,0.3)',
                background: 'rgba(168,85,247,0.1)',
                color: 'rgba(168,85,247,0.9)',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              }}>
                <Sparkles size={14} /> Take Tour
              </button>
            )}
            <button onClick={next} className="cta-button-premium" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', fontSize: '0.9rem',
            }}>
              {isLast ? 'Enter Studio' : 'Next'}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
