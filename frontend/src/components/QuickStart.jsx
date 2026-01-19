import React, { useState } from 'react';
import { 
  Sparkles, Music, Zap, Play, ArrowRight, X, 
  Feather, Disc, Hash, ImageIcon, ChevronRight,
  Flame, TrendingUp, Volume2, Camera
} from 'lucide-react';

/**
 * QuickStart Component
 * One-screen entry point mimicking Ahrefs' simplicity pattern
 * - Pick one goal
 * - Pick one agent
 * - Generate immediately
 * - See result preview
 * No modal stacking, no wizard complexity
 */

const QUICK_GOALS = [
  { 
    id: 'lyrics', 
    label: 'Write Lyrics', 
    hint: 'AI co-writer for your verse',
    icon: Feather, 
    color: '#a78bfa',
    agent: 'ghost',
    placeholder: 'A song about...'
  },
  { 
    id: 'beats', 
    label: 'Discover Samples', 
    hint: 'Find sounds you\'ve never heard',
    icon: Disc, 
    color: '#60a5fa',
    agent: 'beat',
    placeholder: 'I\'m looking for a... vibe'
  },
  { 
    id: 'video', 
    label: 'Create Video', 
    hint: 'Visualizer or lyric video',
    icon: Camera, 
    color: '#f87171',
    agent: 'video-creator',
    placeholder: 'Show me a video of...'
  },
  { 
    id: 'trend', 
    label: 'Check Trends', 
    hint: 'What\'s working right now',
    icon: TrendingUp, 
    color: '#34d399',
    agent: 'trend',
    placeholder: 'What\'s trending in... genre?'
  }
];

function QuickStart({ onSelect, onClose }) {
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGoalSelect = (goal) => {
    setSelectedGoal(goal);
    setPromptText('');
  };

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      alert('Tell me what you want to create!');
      return;
    }

    setIsGenerating(true);
    
    // Call the agent with the prompt
    if (onSelect) {
      onSelect({
        agent: selectedGoal.agent,
        prompt: promptText,
        goal: selectedGoal.id
      });
    }
    
    // Close modal after a short delay to show loading feedback
    setTimeout(() => {
      setIsGenerating(false);
      if (onClose) onClose();
    }, 300);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && promptText.trim()) {
      handleGenerate();
    }
  };

  return (
    <div className="quickstart-overlay">
      <div className="quickstart-container">
        {/* Header */}
        <div className="quickstart-header">
          <div>
            <h2 className="quickstart-title">
              <Sparkles size={24} style={{ display: 'inline', marginRight: '8px' }} />
              Create in Seconds
            </h2>
            <p className="quickstart-subtitle">Pick what you want. We'll handle the rest.</p>
          </div>
          <button className="quickstart-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {!selectedGoal ? (
          /* Goal Selection Grid */
          <div className="quickstart-goals">
            {QUICK_GOALS.map((goal) => {
              const Icon = goal.icon;
              return (
                <button
                  key={goal.id}
                  className="quickstart-goal-card"
                  onClick={() => handleGoalSelect(goal)}
                  style={{
                    '--accent-color': goal.color
                  }}
                >
                  <div className="goal-icon-wrapper" style={{ background: goal.color + '20', borderColor: goal.color }}>
                    <Icon size={28} style={{ color: goal.color }} />
                  </div>
                  <div className="goal-label">{goal.label}</div>
                  <div className="goal-hint">{goal.hint}</div>
                  <ChevronRight size={16} className="goal-chevron" />
                </button>
              );
            })}
          </div>
        ) : (
          /* Generation Form */
          <div className="quickstart-form">
            {/* Back Button */}
            <button 
              className="form-back-button"
              onClick={() => setSelectedGoal(null)}
            >
              ← Back to options
            </button>

            {/* Selected Goal Display */}
            <div className="form-selected-goal">
              {(() => {
                const Icon = selectedGoal.icon;
                return (
                  <>
                    <Icon size={32} style={{ color: selectedGoal.color }} />
                    <div>
                      <div className="goal-selected-label">{selectedGoal.label}</div>
                      <div className="goal-selected-hint">{selectedGoal.hint}</div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Input Area */}
            <div className="form-input-group">
              <label className="form-label">Tell us what you want:</label>
              <textarea
                className="form-textarea"
                placeholder={selectedGoal.placeholder}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={3}
              />
              <div className="form-char-count">
                {promptText.length} / 500
              </div>
            </div>

            {/* Generate Button */}
            <button
              className={`form-generate-button ${isGenerating ? 'generating' : ''}`}
              onClick={handleGenerate}
              disabled={!promptText.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Generate Now
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Tips */}
            <div className="form-tips">
              <div className="tip-item">
                <Flame size={14} />
                <span>The more specific, the better the result</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .quickstart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .quickstart-container {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 20px;
          padding: 32px;
          max-width: 600px;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .quickstart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          gap: 16px;
        }

        .quickstart-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: white;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          line-height: 1.2;
        }

        .quickstart-subtitle {
          font-size: 0.95rem;
          color: #9ca3af;
          margin: 0;
          line-height: 1.4;
        }

        .quickstart-close {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
          min-height: 40px;
          flex-shrink: 0;
        }

        .quickstart-close:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
        }

        .quickstart-close:active {
          transform: scale(0.95);
        }

        /* Goal Selection Grid - Desktop */
        .quickstart-goals {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 8px;
        }

        .quickstart-goal-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
          min-height: 140px;
          justify-content: center;
        }

        .quickstart-goal-card:hover {
          background: rgba(var(--accent-color), 0.1);
          border-color: var(--accent-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .quickstart-goal-card:active {
          transform: translateY(0px);
        }

        .goal-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid;
          transition: all 0.2s;
        }

        .quickstart-goal-card:hover .goal-icon-wrapper {
          transform: scale(1.1);
        }

        .goal-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: white;
          line-height: 1.3;
        }

        .goal-hint {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 4px;
          line-height: 1.3;
        }

        .goal-chevron {
          opacity: 0;
          transition: opacity 0.2s;
          color: #9ca3af;
          margin-top: 4px;
        }

        .quickstart-goal-card:hover .goal-chevron {
          opacity: 1;
        }

        /* Form */
        .quickstart-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-back-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 8px 0;
          text-align: left;
          transition: color 0.2s;
          font-weight: 600;
        }

        .form-back-button:hover {
          color: white;
        }

        .form-selected-goal {
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .goal-selected-label {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          line-height: 1.2;
        }

        .goal-selected-hint {
          font-size: 0.85rem;
          color: #9ca3af;
          margin-top: 4px;
          line-height: 1.3;
        }

        .form-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
        }

        .form-textarea {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px;
          color: white;
          font-family: inherit;
          font-size: 0.95rem;
          resize: none;
          transition: all 0.2s;
          line-height: 1.5;
          min-height: 100px;
        }

        .form-textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .form-textarea:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(168, 85, 247, 0.4);
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
        }

        .form-char-count {
          font-size: 0.8rem;
          color: #6b7280;
          text-align: right;
        }

        .form-generate-button {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          border-radius: 12px;
          padding: 16px 24px;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 48px;
        }

        .form-generate-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(168, 85, 247, 0.3);
        }

        .form-generate-button:active:not(:disabled) {
          transform: translateY(0px);
        }

        .form-generate-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-generate-button.generating {
          background: rgba(168, 85, 247, 0.5);
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-tips {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.15);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tip-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #6ee7b7;
          line-height: 1.3;
        }

        /* ===== TABLET (768px - 1024px) ===== */
        @media (min-width: 768px) and (max-width: 1024px) {
          .quickstart-container {
            max-width: 90vw;
            padding: 28px;
          }

          .quickstart-title {
            font-size: 1.375rem;
          }

          .quickstart-goals {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }

          .quickstart-goal-card {
            min-height: 130px;
            padding: 18px;
          }

          .goal-icon-wrapper {
            width: 52px;
            height: 52px;
          }
        }

        /* ===== MOBILE (< 768px) ===== */
        @media (max-width: 767px) {
          .quickstart-overlay {
            padding: 0;
            padding-bottom: env(safe-area-inset-bottom, 0);
            align-items: flex-end;
          }

          .quickstart-container {
            max-width: 100%;
            width: 100%;
            max-height: calc(85vh - env(safe-area-inset-bottom, 0));
            padding: 20px;
            padding-bottom: calc(20px + env(safe-area-inset-bottom, 0));
            border-radius: 24px 24px 0 0;
            margin-bottom: 0;
          }

          .quickstart-title {
            font-size: 1.25rem;
            gap: 8px;
          }

          .quickstart-title svg {
            width: 20px;
            height: 20px;
          }

          .quickstart-subtitle {
            font-size: 0.85rem;
          }

          .quickstart-header {
            margin-bottom: 24px;
          }

          .quickstart-close {
            width: 36px;
            height: 36px;
            padding: 6px;
          }

          /* Full-width grid on mobile */
          .quickstart-goals {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .quickstart-goal-card {
            min-height: 110px;
            padding: 16px;
            flex-direction: row;
            text-align: left;
            justify-content: flex-start;
            gap: 16px;
          }

          .goal-icon-wrapper {
            width: 48px;
            height: 48px;
            flex-shrink: 0;
          }

          .goal-label {
            font-size: 0.9rem;
          }

          .goal-hint {
            font-size: 0.7rem;
          }

          .goal-chevron {
            margin-left: auto;
            margin-top: 0;
            opacity: 0.3;
          }

          /* Form adjustments for mobile */
          .form-selected-goal {
            padding: 12px;
            flex-direction: column;
            align-items: flex-start;
          }

          .form-label {
            font-size: 0.85rem;
          }

          .form-textarea {
            min-height: 80px;
            padding: 12px;
            font-size: 16px; /* Prevents zoom on iOS */
          }

          .form-generate-button {
            padding: 14px 20px;
            font-size: 0.95rem;
            min-height: 48px;
          }

          .form-back-button {
            font-size: 0.85rem;
            padding: 6px 0;
          }

          .quickstart-form {
            gap: 20px;
          }

          .form-tips {
            padding: 10px;
          }

          .tip-item {
            font-size: 0.8rem;
            gap: 6px;
          }
        }

        /* ===== SMALL MOBILE (< 480px) ===== */
        @media (max-width: 479px) {
          .quickstart-container {
            padding: 16px;
            padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
            max-height: calc(80vh - env(safe-area-inset-bottom, 0));
          }

          .quickstart-title {
            font-size: 1.1rem;
          }

          .quickstart-goal-card {
            min-height: 100px;
            padding: 12px;
          }

          .goal-icon-wrapper {
            width: 44px;
            height: 44px;
          }

          .goal-label {
            font-size: 0.85rem;
          }

          .goal-hint {
            display: none;
          }

          .form-input-group {
            gap: 6px;
          }

          .form-textarea {
            min-height: 70px;
            font-size: 16px;
          }
        }

        /* ===== LANDSCAPE MODE ===== */
        @media (max-height: 600px) {
          .quickstart-overlay {
            align-items: center;
            padding: 8px;
          }

          .quickstart-container {
            max-height: 90vh;
            border-radius: 16px;
          }

          .quickstart-header {
            margin-bottom: 16px;
          }

          .quickstart-goals {
            gap: 8px;
            grid-template-columns: repeat(2, 1fr);
          }

          .quickstart-goal-card {
            min-height: 80px;
            padding: 12px;
          }

          .goal-hint {
            display: none;
          }

          .form-textarea {
            min-height: 50px;
          }

          .form-tips {
            display: none;
          }
        }

        /* ===== DESKTOP HOVER STATES ===== */
        @media (hover: hover) and (pointer: fine) {
          .quickstart-goal-card {
            cursor: pointer;
          }

          .quickstart-close:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .form-back-button:hover {
            padding-left: -4px;
          }
        }

        /* ===== TOUCH OPTIMIZATION ===== */
        @media (hover: none) and (pointer: coarse) {
          .quickstart-goal-card {
            min-height: 120px;
            padding: 18px;
          }

          .goal-icon-wrapper {
            width: 52px;
            height: 52px;
          }

          .form-generate-button {
            min-height: 52px;
            font-size: 1.05rem;
          }

          .quickstart-goal-card:active {
            background: rgba(var(--accent-color), 0.15);
            border-color: var(--accent-color);
          }
        }
      `}</style>
    </div>
  );
}

export default QuickStart;
