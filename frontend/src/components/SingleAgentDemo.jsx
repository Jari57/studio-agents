import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Play, RefreshCw, Lightbulb, ChevronDown } from 'lucide-react';
import { AGENTS, BACKEND_URL } from '../constants';
import { auth, getIdToken } from '../firebase';

// Streaming text effect hook (same as MultiAgentDemo)
function useTypewriter(text, speed = 20, trigger = false) {
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    if (!trigger || !text) {
      setDisplayed('');
      return;
    }
    
    setIsTyping(true);
    setDisplayed('');
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, trigger, speed]);
  
  return { displayed, isTyping };
}

const AGENT_PROMPTS = {
  ghost: {
    prompt: (idea, style) => `Write a short 4-line verse for a song about: "${idea}". Style: ${style}. Make it catchy and memorable. Just the lyrics, no explanation.`,
    systemInstruction: 'You are a hit songwriter. Write only the lyrics, nothing else.'
  },
  beat: {
    prompt: (idea, style) => `Describe a beat concept for a song about: "${idea}". Style: ${style}. Include BPM, key, drum pattern description, and vibe in 3-4 sentences. Be specific and creative.`,
    systemInstruction: 'You are a professional music producer. Describe the beat concept clearly and concisely.'
  },
  album: {
    prompt: (idea, style) => `Describe album cover art for a song about: "${idea}". Style: ${style}. Include visual elements, color palette, mood, and composition in 3-4 sentences.`,
    systemInstruction: 'You are a professional visual artist and art director. Describe the cover art vividly.'
  },
  'video-creator': {
    prompt: (idea, style) => `Describe a 30-second music video concept for a song about: "${idea}". Style: ${style}. Include 2-3 scenes with camera angles, lighting, and visual effects.`,
    systemInstruction: 'You are a music video director. Describe the visual concept cinematically.'
  }
};

const EXAMPLE_IDEAS = [
  "Midnight in the city",
  "Coming back stronger",
  "Neon lights and broken hearts",
  "Summer vibes on the rooftop"
];

export default function SingleAgentDemo() {
  const [selectedAgentId, setSelectedAgentId] = useState('ghost');
  const [songIdea, setSongIdea] = useState('');
  const [style, setStyle] = useState('Modern Hip-Hop');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const { displayed, isTyping } = useTypewriter(output, 15, showOutput);
  const inputRef = useRef(null);
  
  const freeAgents = AGENTS.filter(a => a.tier === 'free');
  const selectedAgent = freeAgents.find(a => a.id === selectedAgentId) || freeAgents[0];
  const Icon = typeof selectedAgent?.icon === 'function' ? selectedAgent.icon : Sparkles;

  useEffect(() => {
    if (output && !isGenerating) {
      const timer = setTimeout(() => setShowOutput(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowOutput(false);
    }
  }, [output, isGenerating]);

  const handleGenerate = async () => {
    if (!songIdea.trim()) return;
    
    setHasStarted(true);
    setIsGenerating(true);
    setOutput(null);
    setShowOutput(false);
    
    let authToken = '';
    try {
      if (auth?.currentUser) {
        authToken = await getIdToken(auth.currentUser);
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    
    const agentConfig = AGENT_PROMPTS[selectedAgentId] || AGENT_PROMPTS.ghost;
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      
      const res = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: agentConfig.prompt(songIdea, style),
          systemInstruction: agentConfig.systemInstruction,
          model: 'gemini-2.0-flash'
        })
      });
      
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      if (!data.output) throw new Error('No output in response');
      
      setOutput(data.output.trim());
    } catch (err) {
      console.error('SingleAgentDemo generation failed:', err);
      const fallbacks = {
        ghost: "Under the neon glow we ride tonight\nChasing dreams through the city lights\nEvery beat dropping hits me right\nWe own the dark, we own the night",
        beat: "140 BPM, Key of C minor. Heavy 808 kick with a rolling hi-hat pattern. Dark synth pad layered with a chopped vocal sample. The vibe is moody and cinematic — perfect for a late-night drive.",
        album: "A shadowy figure standing in the rain under a single streetlight. Deep purple and cyan color palette with film grain texture. The composition is centered with negative space above, creating a sense of isolation and determination.",
        'video-creator': "Scene 1: Slow-motion tracking shot through a rain-soaked alley, neon signs reflecting in puddles. Scene 2: Close-up on hands playing piano keys, intercut with city skyline at dusk. Scene 3: Drone pull-back revealing the full cityscape as the chorus hits."
      };
      setOutput(fallbacks[selectedAgentId] || fallbacks.ghost);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)',
      borderRadius: '24px',
      padding: '32px 24px',
      border: '1px solid rgba(168, 85, 247, 0.2)',
      maxWidth: '800px',
      margin: '0 auto',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(168, 85, 247, 0.15)',
          borderRadius: '20px',
          marginBottom: '12px'
        }}>
          <Sparkles size={14} color="#a855f7" />
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Single Agent Demo
          </span>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
          Try <span style={{ color: '#a855f7' }}>One Agent</span>
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Pick an agent, enter an idea, and see what it creates.
        </p>
      </div>

      {/* Agent Selector + Style */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Agent</label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedAgentId}
              onChange={(e) => { setSelectedAgentId(e.target.value); setOutput(null); setHasStarted(false); }}
              style={{
                width: '100%',
                padding: '10px 32px 10px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none'
              }}
            >
              {freeAgents.map(agent => (
                <option key={agent.id} value={agent.id} style={{ background: '#1a1a1a' }}>
                  {agent.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {['Modern Hip-Hop', '90s Boom Bap', 'Trap', 'R&B / Soul', 'Pop', 'Rock', 'Electronic', 'Cinematic', 'Jazz', 'Lo-Fi'].map(s => (
              <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Input + Generate */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <input
          ref={inputRef}
          type="text"
          value={songIdea}
          onChange={(e) => setSongIdea(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="Describe your song idea..."
          style={{
            flex: 1,
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !songIdea.trim()}
          style={{
            padding: '14px 24px',
            borderRadius: '12px',
            background: isGenerating ? 'rgba(168, 85, 247, 0.3)' : 'linear-gradient(135deg, #a855f7, #ec4899)',
            border: 'none',
            color: 'white',
            fontWeight: '600',
            cursor: isGenerating || !songIdea.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            opacity: !songIdea.trim() ? 0.5 : 1
          }}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={18} className="spin" />
              Creating...
            </>
          ) : (
            <>
              <Play size={18} />
              Generate
            </>
          )}
        </button>
      </div>

      {/* Quick Ideas */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <Lightbulb size={14} style={{ color: 'var(--text-secondary)', marginTop: '3px' }} />
        {EXAMPLE_IDEAS.map((idea, i) => (
          <button
            key={i}
            onClick={() => { setSongIdea(idea); inputRef.current?.focus(); }}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {idea}
          </button>
        ))}
      </div>

      {/* Output */}
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        borderRadius: '16px',
        padding: '20px',
        border: `1px solid rgba(168, 85, 247, ${hasStarted ? '0.3' : '0.1'})`,
        minHeight: '120px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Agent badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={16} color="#a855f7" />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {selectedAgent?.name || 'Agent'}
          </span>
          {(isGenerating || isTyping) && (
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#a855f7',
              marginLeft: 'auto',
              animation: 'pulse 1s infinite'
            }} />
          )}
        </div>

        {/* Content */}
        {isGenerating ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '20px 0' }}>
            <div className="loading-dots">
              <span style={{ background: '#a855f7' }} />
              <span style={{ background: '#a855f7' }} />
              <span style={{ background: '#a855f7' }} />
            </div>
          </div>
        ) : output ? (
          <p style={{
            fontSize: '0.95rem',
            lineHeight: '1.6',
            color: 'rgba(255,255,255,0.9)',
            margin: 0,
            whiteSpace: 'pre-wrap'
          }}>
            {displayed}
            {isTyping && <span style={{ animation: 'blink 0.8s infinite', color: '#a855f7' }}>|</span>}
          </p>
        ) : (
          <p style={{
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.3)',
            fontStyle: 'italic',
            margin: 0,
            textAlign: 'center',
            padding: '20px 0'
          }}>
            {hasStarted ? 'Processing...' : 'Select an agent, enter an idea, and hit Generate'}
          </p>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        .loading-dots {
          display: flex;
          gap: 4px;
        }
        .loading-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
        .loading-dots span:nth-child(3) { animation-delay: 0s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
