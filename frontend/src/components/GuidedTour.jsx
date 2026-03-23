import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// GUIDED TOUR — Interactive tooltip walkthrough for new users
// ═══════════════════════════════════════════════════════════════════════════════

const TOUR_STEPS = [
  {
    target: '[data-tour="nav-team"]',
    title: 'Your AI Team',
    content: 'Browse 16 specialized AI agents — writers, producers, vocalists, video creators, and more. Tap any agent to start collaborating.',
    position: 'top',
    tab: 'agents',
  },
  {
    target: '[data-tour="nav-projects"]',
    title: 'Projects Hub',
    content: 'All your saved projects live here. Create new projects, organize by category, and pick up right where you left off.',
    position: 'top',
    tab: 'hub',
  },
  {
    target: '[data-tour="nav-create"]',
    title: 'Quick Create',
    content: 'The fastest way to start. Tap this button to launch a new project — choose a template or start from scratch.',
    position: 'top',
  },
  {
    target: '[data-tour="nav-studio"]',
    title: 'Your Dashboard',
    content: 'Your personal studio dashboard. See recent work, credit balance, quick stats, and jump back into any project.',
    position: 'top',
    tab: 'mystudio',
  },
  {
    target: '[data-tour="nav-more"]',
    title: 'More Options',
    content: 'Access news, resources, marketing tools, whitepapers, legal info, support, and admin settings.',
    position: 'top',
    tab: 'more',
  },
  {
    target: '[data-tour="header-home"]',
    title: 'Home',
    content: 'Go back to the landing page at any time to see pricing, features, or sign out.',
    position: 'bottom',
  },
  {
    target: '[data-tour="header-profile"]',
    title: 'Your Profile',
    content: 'Manage your account, subscription plan, credits, and notification preferences.',
    position: 'bottom',
  },
  {
    target: '[data-tour="header-tour"]',
    title: 'Relaunch This Tour',
    content: 'You can restart this guided tour anytime by tapping here. Handy if you want a refresher!',
    position: 'bottom',
  },
  {
    target: '[data-tour="header-help"]',
    title: 'Help & Support',
    content: 'Need help? Find FAQs, contact support, report bugs, or request features here.',
    position: 'bottom',
  },
];

function GuidedTour({ active, onClose, onNavigate }) {
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [spotlightStyle, setSpotlightStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef(null);
  const rafRef = useRef(null);

  const currentStep = TOUR_STEPS[step];
  const total = TOUR_STEPS.length;

  const positionTooltip = useCallback(() => {
    if (!currentStep) return;
    // Find the first visible matching element (handles mobile+desktop duplicates)
    const allEls = document.querySelectorAll(currentStep.target);
    const el = Array.from(allEls).find(e => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }) || null;
    if (!el) {
      // Element not found — try navigating to correct tab
      if (currentStep.tab && onNavigate) {
        onNavigate(currentStep.tab);
      }
      // Fallback: center tooltip
      setSpotlightStyle({ display: 'none' });
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100002,
      });
      setArrowStyle({ display: 'none' });
      setVisible(true);
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = 8;

    // Spotlight
    setSpotlightStyle({
      position: 'fixed',
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: '12px',
      zIndex: 100001,
      pointerEvents: 'none',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    });

    // Tooltip position
    const pos = currentStep.position || 'bottom';
    const tooltipWidth = Math.min(340, window.innerWidth - 32);
    let top, left;
    const arrowPos = {};

    if (pos === 'top') {
      top = rect.top - pad - 16;
      left = rect.left + rect.width / 2;
      arrowPos.bottom = '-8px';
      arrowPos.left = '50%';
      arrowPos.transform = 'translateX(-50%) rotate(45deg)';
    } else if (pos === 'bottom') {
      top = rect.bottom + pad + 16;
      left = rect.left + rect.width / 2;
      arrowPos.top = '-8px';
      arrowPos.left = '50%';
      arrowPos.transform = 'translateX(-50%) rotate(45deg)';
    } else if (pos === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - pad - 16;
      arrowPos.right = '-8px';
      arrowPos.top = '50%';
      arrowPos.transform = 'translateY(-50%) rotate(45deg)';
    } else {
      top = rect.top + rect.height / 2;
      left = rect.right + pad + 16;
      arrowPos.left = '-8px';
      arrowPos.top = '50%';
      arrowPos.transform = 'translateY(-50%) rotate(45deg)';
    }

    // Clamp tooltip so it doesn't overflow viewport
    let tooltipLeft = left - tooltipWidth / 2;
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));

    let tooltipTop = pos === 'top' ? undefined : top;
    let tooltipBottom = pos === 'top' ? (window.innerHeight - top) : undefined;

    // Recalculate arrow horizontal position relative to tooltip
    const arrowLeft = Math.max(24, Math.min(left - tooltipLeft, tooltipWidth - 24));

    setTooltipStyle({
      position: 'fixed',
      top: tooltipTop,
      bottom: tooltipBottom,
      left: tooltipLeft,
      width: tooltipWidth,
      zIndex: 100002,
      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    });

    setArrowStyle({
      ...arrowPos,
      left: `${arrowLeft}px`,
      transform: arrowPos.transform,
    });

    setVisible(true);
  }, [currentStep, onNavigate]);

  // Navigate to correct tab for current step
  useEffect(() => {
    if (!active || !currentStep) return;
    if (currentStep.tab && onNavigate) {
      onNavigate(currentStep.tab);
    }
    // Small delay to let DOM update after tab change
    const timer = setTimeout(() => positionTooltip(), 120);
    return () => clearTimeout(timer);
  }, [active, step, currentStep, onNavigate, positionTooltip]);

  // Reposition on resize/scroll
  useEffect(() => {
    if (!active) return;
    const handler = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(positionTooltip);
    };
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, positionTooltip]);

  // Reset on open
  useEffect(() => {
    if (active) {
      setStep(0);
      setVisible(false);
    }
  }, [active]);

  const handleNext = () => {
    if (step < total - 1) {
      setVisible(false);
      setStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setVisible(false);
      setStep(s => s - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('studio_tour_completed', 'true');
    setVisible(false);
    onClose();
  };

  if (!active) return null;

  return (
    <>
      {/* Overlay — click to dismiss */}
      <div
        onClick={handleFinish}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100000,
          cursor: 'pointer',
        }}
      />

      {/* Spotlight cutout */}
      <div style={spotlightStyle} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          ...tooltipStyle,
          opacity: visible ? 1 : 0,
          transform: tooltipStyle.transform || undefined,
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.98), rgba(20, 15, 40, 0.98))',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(168, 85, 247, 0.15)',
          backdropFilter: 'blur(20px)',
          color: 'white',
          position: 'relative',
        }}>
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            width: '16px',
            height: '16px',
            background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.98), rgba(20, 15, 40, 0.98))',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            ...arrowStyle,
            display: arrowStyle.display,
            clipPath: arrowStyle.top === '-8px'
              ? 'polygon(0 0, 100% 0, 100% 100%)'
              : arrowStyle.bottom === '-8px'
                ? 'polygon(0 0, 0 100%, 100% 100%)'
                : undefined,
          }} />

          {/* Close button */}
          <button
            onClick={handleFinish}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              padding: 0,
            }}
          >
            <X size={14} />
          </button>

          {/* Step counter */}
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(168, 85, 247, 0.9)',
            marginBottom: '8px',
          }}>
            Step {step + 1} of {total}
          </div>

          {/* Title */}
          <h3 style={{
            margin: '0 0 8px',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'white',
            paddingRight: '24px',
          }}>
            {currentStep?.title}
          </h3>

          {/* Body */}
          <p style={{
            margin: '0 0 16px',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.75)',
          }}>
            {currentStep?.content}
          </p>

          {/* Progress dots + nav */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: '5px' }}>
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === step ? '20px' : '7px',
                    height: '7px',
                    borderRadius: '4px',
                    background: i === step
                      ? 'var(--color-purple, #a855f7)'
                      : i < step
                        ? 'rgba(168,85,247,0.5)'
                        : 'rgba(255,255,255,0.15)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              <button
                onClick={handleNext}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--color-purple, #a855f7)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(168,85,247,0.4)',
                }}
              >
                {step === total - 1 ? (
                  <><Check size={14} /> Finish</>
                ) : (
                  <>Next <ChevronRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default GuidedTour;
