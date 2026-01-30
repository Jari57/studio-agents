/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic2, FileText, Video, Hash, RefreshCw, Zap, FolderPlus, Lightbulb } from 'lucide-react';
import { BACKEND_URL } from '../constants';
import { useLazyLoadImages } from '../hooks/useLazyLoadImages';
import { auth, getIdToken } from '../firebase';

// Streaming text effect hook
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

// Individual Agent Output Card
function AgentOutputCard({ icon: Icon, title, color, output, isLoading, delay = 0 }) {
  const [showContent, setShowContent] = useState(false);
  const { displayed, isTyping } = useTypewriter(output, 15, showContent);
  
  useEffect(() => {
    if (output && !isLoading) {
      const timer = setTimeout(() => setShowContent(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [output, isLoading, delay]);
  
  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: '16px',
      padding: '16px',
      border: `1px solid ${color}22`,
      position: 'relative',
      overflow: 'hidden',
      minHeight: '140px'
    }}>
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle at center, ${color}08 0%, transparent 50%)`,
        pointerEvents: 'none'
      }} />
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '12px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: `${color}20`,
          border: `1px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {Icon ? <Icon size={16} color={color} /> : <Sparkles size={16} color={color} />}
        </div>
        <span style={{ 
          fontSize: '0.8rem', 
          fontWeight: '600',
          color: color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {title}
        </span>
        {(isLoading || isTyping) && (
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: color,
            marginLeft: 'auto',
            animation: 'pulse 1s infinite'
          }} />
        )}
      </div>
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {isLoading ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div className="loading-dots">
              <span style={{ background: color }} />
              <span style={{ background: color }} />
              <span style={{ background: color }} />
            </div>
          </div>
        ) : output ? (
          <p style={{ 
            fontSize: '0.9rem', 
            lineHeight: '1.5', 
            color: 'rgba(255,255,255,0.9)',
            margin: 0,
            whiteSpace: 'pre-wrap'
          }}>
            {displayed}
            {isTyping && <span className="cursor-blink">|</span>}
          </p>
        ) : (
          <p style={{ 
            fontSize: '0.85rem', 
            color: 'rgba(255,255,255,0.3)',
            fontStyle: 'italic',
            margin: 0
          }}>
            Waiting for input...
          </p>
        )}
      </div>
    </div>
  );
}

export default function MultiAgentDemo({ onCreateProject = null }) {
  const containerRef = useRef(null);
  useLazyLoadImages(containerRef);
  
  const [songIdea, setSongIdea] = useState('');
  const [language, setLanguage] = useState('English');
  const [style, setStyle] = useState('Modern Hip-Hop');
  const [model, setModel] = useState('Gemini 2.0 Flash');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [outputs, setOutputs] = useState({
    hook: null,
    caption: null,
    hashtags: null,
    pitch: null
  });
  const [masterOutput, setMasterOutput] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // const [showSaveOptions, setShowSaveOptions] = useState(false); - reserved for future save feature
  
  const inputRef = useRef(null);

  const handleCreateProject = () => {
    if (!onCreateProject || !songIdea) return;

    const newProject = {
      id: String(Date.now()),
      name: songIdea,
      category: 'music',
      description: `Multi-agent demo project: ${songIdea}`,
      language,
      style,
      model,
      date: new Date().toLocaleDateString(),
      status: 'active',
      progress: 25,
      assets: [
        { id: 'hook-1', type: 'text', title: 'Song Hook', content: outputs.hook, agent: 'Ghostwriter' },
        { id: 'social-1', type: 'text', title: 'Social Copy', content: outputs.caption, agent: 'Social Copy' },
        { id: 'tags-1', type: 'text', title: 'Hashtags', content: outputs.hashtags, agent: 'Hashtag Engine' },
        { id: 'pitch-1', type: 'text', title: 'Elevator Pitch', content: outputs.pitch, agent: 'Pitch Writer' },
        { id: 'master-1', type: 'text', title: 'Master Orchestration', content: masterOutput, agent: 'AMO' }
      ].filter(a => a.content)
    };

    onCreateProject(newProject);
  };
  
  const EXAMPLE_IDEAS = [
    "Summer love in Brooklyn",
    "Chasing dreams at midnight",
    "Heartbreak on the highway",
    "Rise from the struggle"
  ];
  
  const handleGenerate = async () => {
    if (!songIdea.trim()) return;
    
    setIsGenerating(true);
    setMasterOutput(null);
    setOutputs({ hook: null, caption: null, hashtags: null, pitch: null });
    
    // Get Firebase token for authentication
    let authToken = '';
    try {
      if (auth.currentUser) {
        authToken = await getIdToken(auth.currentUser);
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    
    // Generate all outputs in parallel
    const prompts = {
      hook: {
        prompt: `Write a 2-line viral song hook for: "${songIdea}". Language: ${language}. Style: ${style}. Make it catchy, memorable, under 20 words total. Just the hook, no explanation.`,
        systemInstruction: `You are a hit songwriter. Write only the hook lyrics in ${language}, nothing else.`
      },
      caption: {
        prompt: `Write a short Instagram caption (max 15 words) for a new song about: "${songIdea}". Style: ${style}. Include 1 emoji. Just the caption.`,
        systemInstruction: `You are a social media expert for musicians. Write in ${language}.`
      },
      hashtags: {
        prompt: `Generate 5 trending hashtags for a song about: "${songIdea}". Style: ${style}. Format: #tag1 #tag2 #tag3 #tag4 #tag5`,
        systemInstruction: "You are a music marketing specialist."
      },
      pitch: {
        prompt: `Write a one-sentence elevator pitch for a song about: "${songIdea}". Language: ${language}. Style: ${style}. Make it compelling for a record label. Under 25 words.`,
        systemInstruction: `You are a music industry A&R. Write in ${language}.`
      }
    };
    
    try {
      // Map display model name to API model ID
      const modelMapping = {
        'Gemini 2.0 Flash': 'gemini-2.0-flash',
        'Gemini 2.0 Pro (Exp)': 'gemini-2.0-flash-exp',
        'Gemini 1.5 Flash': 'gemini-1.5-flash',
        'Gemini 1.5 Pro': 'gemini-1.5-pro'
      };
      const apiModel = modelMapping[model] || 'gemini-2.0-flash';

      // Fire all requests simultaneously
      const requests = Object.entries(prompts).map(async ([key, { prompt, systemInstruction }]) => {
        try {
          const headers = { 'Content-Type': 'application/json' };
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
          }
          
          const res = await fetch(`${BACKEND_URL}/api/generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ prompt, systemInstruction, model: apiModel })
          });
          const data = await res.json();
          return [key, data.output?.trim() || 'Generation failed'];
        } catch {
          // Fallback responses
          const fallbacks = {
            hook: "Feel the rhythm in your soul tonight\nWe're burning bright, we own the light",
            caption: "New heat dropping soon 🔥 Stay tuned",
            hashtags: "#NewMusic #ComingSoon #Vibes #HitSong #MusicLife",
            pitch: "A genre-defying anthem that captures the raw energy of chasing your dreams."
          };
          return [key, fallbacks[key]];
        }
      });
      
      // Process results as they come in
      const results = await Promise.all(requests);
      const newOutputs = Object.fromEntries(results);
      setOutputs(newOutputs);
      setIsGenerating(false);
      
      // Now orchestrate all 4 outputs with AMO
      setIsOrchestrating(true);
      try {
        const agentOutputs = [
          { agent: 'Ghostwriter', type: 'hook', content: newOutputs.hook },
          { agent: 'Social Copy', type: 'caption', content: newOutputs.caption },
          { agent: 'Hashtag Engine', type: 'hashtags', content: newOutputs.hashtags },
          { agent: 'Pitch Writer', type: 'pitch', content: newOutputs.pitch }
        ];
        
        const orchestrateRes = await fetch(`${BACKEND_URL}/api/orchestrate`, {
          method: 'POST',
          headers: authToken ? {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          } : { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentOutputs,
            projectName: songIdea,
            projectDescription: `Multi-agent demo for song concept: ${songIdea}`
          })
        });
        
        const orchestrateData = await orchestrateRes.json();
        if (orchestrateRes.ok && orchestrateData.output) {
          setMasterOutput(orchestrateData.output);
        }
      } catch (err) {
        console.log('AMO orchestration skipped (demo mode):', err);
      } finally {
        setIsOrchestrating(false);
      }
      
    } catch (err) {
      console.error('Generation error:', err);
      setIsGenerating(false);
    }
  };
  
  const handleExampleClick = (idea) => {
    setSongIdea(idea);
    inputRef.current?.focus();
  };
  
  return (
    <div ref={containerRef} className="multi-agent-demo" style={{
      background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
      borderRadius: '24px',
      padding: '32px 24px',
      border: '1px solid rgba(139, 92, 246, 0.2)',
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
          background: 'rgba(139, 92, 246, 0.15)',
          borderRadius: '20px',
          marginBottom: '12px'
        }}>
          <Zap size={14} color="#8b5cf6" />
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Demo
          </span>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
          One Idea → <span style={{ color: '#06b6d4' }}>Four Agents</span>
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Enter a song concept and watch our AI agents work in parallel.
        </p>
      </div>
      
      {/* Input Section */}
      <div style={{ marginBottom: '24px' }}>
        {/* Configuration Bar */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Language</label>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Portuguese', 'Italian', 'Chinese'].map(lang => (
                <option key={lang} value={lang} style={{ background: '#1a1a1a' }}>{lang}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Style</label>
            <select 
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {['Modern Hip-Hop', '90s Boom Bap', 'Trap', 'R&B / Soul', 'Pop', 'Rock', 'Electronic', 'Cinematic', 'Jazz', 'Lo-Fi'].map(s => (
                <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Model</label>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {['Gemini 2.0 Flash', 'Gemini 2.0 Pro (Exp)', 'Gemini 1.5 Flash', 'Gemini 1.5 Pro'].map(m => (
                <option key={m} value={m} style={{ background: '#1a1a1a' }}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '12px',
          marginBottom: '12px'
        }}>
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
              background: isGenerating ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
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
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate
              </>
            )}
          </button>
        </div>
        
        {/* Suggestions Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: showSuggestions ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: showSuggestions ? '#a855f7' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Lightbulb size={14} />
            {showSuggestions ? 'Hide Ideas' : 'Need Ideas?'}
          </button>
          
          {/* Collapsible Quick Examples */}
          {showSuggestions && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', animation: 'fadeIn 0.2s ease' }}>
              {EXAMPLE_IDEAS.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => { handleExampleClick(idea); setShowSuggestions(false); }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {idea}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Agent Outputs Grid */}
      <div className="agent-outputs-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        <AgentOutputCard
          icon={Mic2}
          title="Ghostwriter"
          color="#8b5cf6"
          output={outputs.hook}
          isLoading={isGenerating}
          delay={0}
        />
        <AgentOutputCard
          icon={FileText}
          title="Social Copy"
          color="#06b6d4"
          output={outputs.caption}
          isLoading={isGenerating}
          delay={200}
        />
        <AgentOutputCard
          icon={Hash}
          title="Hashtag Engine"
          color="#f59e0b"
          output={outputs.hashtags}
          isLoading={isGenerating}
          delay={400}
        />
        <AgentOutputCard
          icon={Video}
          title="Pitch Writer"
          color="#ec4899"
          output={outputs.pitch}
          isLoading={isGenerating}
          delay={600}
        />
      </div>
      
      {/* AMO Master Output Section */}
      {(isOrchestrating || masterOutput) && (
        <div style={{
          marginTop: '24px',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated border glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #8b5cf6, #06b6d4, #ec4899, #8b5cf6)',
            backgroundSize: '200% 100%',
            animation: isOrchestrating ? 'shimmer 2s linear infinite' : 'none'
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={20} color="white" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'white' }}>
                AMO Master Output
              </h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Agent Model Orchestrator • Combined Production
              </p>
            </div>
            {isOrchestrating && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} className="spin" color="#8b5cf6" />
                <span style={{ fontSize: '0.8rem', color: '#8b5cf6' }}>Orchestrating...</span>
              </div>
            )}
          </div>
          
          {isOrchestrating ? (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <p style={{ margin: 0 }}>Combining agent outputs into a cohesive master...</p>
            </div>
          ) : masterOutput ? (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: '16px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <p style={{ 
                fontSize: '0.9rem', 
                lineHeight: '1.6', 
                color: 'rgba(255,255,255,0.9)',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {masterOutput}
              </p>
            </div>
          ) : null}

          {masterOutput && onCreateProject && (
            <button
              onClick={handleCreateProject}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'white',
                color: 'black',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <FolderPlus size={18} />
              Create Project from these Results
            </button>
          )}
        </div>
      )}
      
      {/* CSS for animations */}
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
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        
        .cursor-blink {
          animation: blink 0.8s infinite;
          color: #06b6d4;
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
