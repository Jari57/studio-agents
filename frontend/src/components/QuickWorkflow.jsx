import React, { useState, useEffect } from 'react';
import { X, Sparkles, Save, FolderPlus, ChevronRight, Mic, Copy, Check, Loader, Volume2, VolumeX, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import { BACKEND_URL } from '../constants';
import { useVoice } from '../hooks/useVoice';
import { db, doc, updateDoc, increment } from '../firebase';

/**
 * QuickWorkflow - Streamlined agent interaction modal
 * 
 * Flow:
 * 1. User taps agent → this modal opens
 * 2. User enters prompt → generates output
 * 3. User can save to existing project or create new one
 */
function QuickWorkflow({ 
  agent, 
  onClose, 
  projects = [], 
  onSaveToProject, 
  onCreateProject,
  user,
  userCredits = 0,
  setUserCredits,
  isAdmin = false
}) {
  const [prompt, setPrompt] = useState(() => {
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    return localStorage.getItem(`studio_${uid}_workflow_prompt_${agent?.id}`) || '';
  });

  // Persist prompt
  useEffect(() => {
    if (agent?.id) {
      const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
      localStorage.setItem(`studio_${uid}_workflow_prompt_${agent.id}`, prompt);
    }
  }, [prompt, agent?.id, user?.uid]);

  const [language, setLanguage] = useState('English');
  const [style, setStyle] = useState('Modern Hip-Hop');
  const [model, setModel] = useState('Gemini 2.0 Flash');
  const [output, setOutput] = useState(() => {
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    const saved = localStorage.getItem(`studio_${uid}_workflow_output_${agent?.id}`);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (_e) {
      return null;
    }
  });

  // Persist output
  useEffect(() => {
    if (agent?.id && output) {
      const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
      localStorage.setItem(`studio_${uid}_workflow_output_${agent.id}`, JSON.stringify(output));
    } else if (agent?.id) {
      const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
      localStorage.removeItem(`studio_${uid}_workflow_output_${agent.id}`);
    }
  }, [output, agent?.id, user?.uid]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Global voice hook for VTT and TTV
  const { 
    isListening, 
    isSpeaking, 
    toggleListening, 
    speak, 
    stopSpeaking,
    // isVoiceSupported - reserved for future voice feature toggle
    isSpeechSupported 
  } = useVoice({ language: 'en-US' });

  // Get auth token for API calls
  const getAuthToken = async () => {
    if (user) {
      try {
        return await user.getIdToken();
      } catch {
        console.error('Failed to get auth token');
      }
    }
    return null;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    // CHECK CREDITS IF LOGGED IN
    if (user && !isAdmin && userCredits <= 0) {
      toast.error("Out of credits! Please purchase more in your Studio.");
      return;
    }

    setIsGenerating(true);
    setOutput(null);

    try {
      // DEDUCT CREDIT IF LOGGED IN
      if (user && !isAdmin) {
        try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            credits: increment(-1)
          });
          if (setUserCredits) setUserCredits(prev => Math.max(0, prev - 1));
        } catch (err) {
          console.error("Credit deduction failed:", err);
        }
      }

      const token = await getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Map display model name to API model ID
      const modelMapping = {
        'Gemini 2.0 Flash': 'gemini-2.0-flash',
        'Gemini 2.0 Pro (Exp)': 'gemini-2.0-flash-exp',
        'Gemini 1.5 Flash': 'gemini-1.5-flash',
        'Gemini 1.5 Pro': 'gemini-1.5-pro'
      };
      const apiModel = modelMapping[model] || 'gemini-2.0-flash';

      const res = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `[Language: ${language}] [Style: ${style}] ${prompt}`,
          systemInstruction: agent.systemPrompt || `You are ${agent.name}, a ${agent.role || agent.description}. ${agent.howToUse || ''} Please respond in ${language}.`,
          model: apiModel
        })
      });

      const data = await res.json();
      
      if (data.output) {
        setOutput(data.output);
        toast.success('Generated!');
        // Auto-speak the first 200 chars of output for accessibility
        if (isSpeechSupported) {
          const preview = data.output.substring(0, 200) + (data.output.length > 200 ? '...' : '');
          speak(preview);
        }
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to generate. Check connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToExistingProject = (project) => {
    const asset = {
      id: Date.now(),
      type: 'text',
      agent: agent.id,
      agentName: agent.name,
      prompt: prompt,
      output: output,
      createdAt: new Date().toISOString()
    };
    onSaveToProject(project.id, asset);
    setShowSaveOptions(false);
    toast.success(`Saved to ${project.name}`);
  };

  const handleCreateAndSave = () => {
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    
    const asset = {
      id: Date.now(),
      type: 'text',
      agent: agent.id,
      agentName: agent.name,
      prompt: prompt,
      output: output,
      createdAt: new Date().toISOString()
    };
    
    onCreateProject(newProjectName.trim(), asset);
    setShowSaveOptions(false);
    setNewProjectName('');
    toast.success(`Created project "${newProjectName}"`);
  };

  // Voice input handler using the global hook
  const handleVoiceInput = () => {
    toggleListening((transcript) => {
      setPrompt(prev => prev + (prev ? ' ' : '') + transcript);
    });
  };

  // Speak the full output
  const handleSpeakOutput = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (output) {
      speak(output);
    }
  };

  // Quick prompts for this agent
  const quickPrompts = agent.examples?.slice(0, 3) || [];

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose} style={{ zIndex: 10001 }}>
      <div 
        className="modal-content quick-workflow-modal" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '560px', 
          width: 'min(95vw, 560px)',
          maxHeight: 'min(90vh, 850px)', 
          height: 'auto',
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          margin: 'auto',
          padding: 0,
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.12)',
          background: '#0f0f12'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ 
          borderBottom: '1px solid rgba(255,255,255,0.08)', 
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexShrink: 0,
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px',
              background: `${agent.color || 'var(--color-purple)'}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: agent.color || 'var(--color-purple)',
              flexShrink: 0
            }}>
              <agent.icon size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'white' }}>{agent.name}</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.role || agent.category}</p>
            </div>
          </div>
          <button 
            className="modal-close" 
            onClick={onClose}
            style={{ position: 'relative', top: 'auto', right: 'auto', flexShrink: 0, width: '32px', height: '32px', minWidth: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          {/* Configuration Bar */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Portuguese', 'Italian', 'Chinese'].map(lang => (
                  <option key={lang} value={lang} style={{ background: '#1a1a1a' }}>{lang}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '100px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Style</label>
              <select 
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {['Modern Hip-Hop', '90s Boom Bap', 'Trap', 'R&B / Soul', 'Pop', 'Rock', 'Electronic', 'Cinematic', 'Jazz', 'Lo-Fi'].map(s => (
                  <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '100px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Model</label>
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '0.8rem',
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

          {/* Quick Prompts - Collapsible */}
          {quickPrompts.length > 0 && !output && (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: showSuggestions ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: showSuggestions ? '#a855f7' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Lightbulb size={14} />
                {showSuggestions ? 'Close Suggestions' : 'Inspire Me'}
              </button>
              {showSuggestions && quickPrompts.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setPrompt(ex); setShowSuggestions(false); }}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.75rem',
                    background: 'rgba(139, 92, 246, 0.12)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: '20px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(139, 92, 246, 0.2)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(139, 92, 246, 0.12)'}
                >
                  {ex.length > 35 ? ex.substring(0, 35) + '...' : ex}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={agent.example || `Describe what you want ${agent.name} to create...`}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '16px',
                paddingRight: '50px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}
              autoFocus
            />
            <button
              onClick={handleVoiceInput}
              style={{
                position: 'absolute',
                right: '12px',
                top: '12px',
                background: isListening ? '#a855f7' : 'rgba(255,255,255,0.05)',
                border: 'none',
                color: isListening ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '10px',
                borderRadius: '10px',
                transition: 'all 0.2s'
              }}
              title="Voice input"
            >
              <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
            </button>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="cta-button-premium"
            style={{ 
              width: '100%', 
              justifyContent: 'center',
              padding: '16px',
              fontSize: '1rem',
              borderRadius: '12px',
              background: isGenerating || !prompt.trim() ? 'rgba(139, 92, 246, 0.3)' : 'var(--color-purple)',
              boxShadow: isGenerating || !prompt.trim() ? 'none' : '0 10px 20px rgba(139, 92, 246, 0.3)'
            }}
          >
            {isGenerating ? (
              <>
                <Loader size={18} className="spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                {agent.getStarted || 'Generate'}
              </>
            )}
          </button>

          {/* Output Area */}
          {output && (
            <div style={{ marginTop: '24px' }} className="animate-fadeInUp">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Output</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* Text-to-Voice button */}
                  {isSpeechSupported && (
                    <button
                      onClick={handleSpeakOutput}
                      style={{
                        background: isSpeaking ? 'rgba(168, 85, 247, 0.2)' : 'none',
                        border: 'none',
                        color: isSpeaking ? 'var(--color-purple)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                      title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                    >
                      {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      {isSpeaking ? 'Stop' : 'Listen'}
                    </button>
                  )}
                  {/* Copy button */}
                  <button
                    onClick={handleCopy}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copied ? 'var(--color-green)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem'
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                maxHeight: '200px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: '#e2e8f0',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {output}
              </div>

              {/* Save Options */}
              <div style={{ marginTop: '16px' }}>
                {!showSaveOptions ? (
                  <button
                    onClick={() => setShowSaveOptions(true)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <Save size={18} />
                    Save to Project
                  </button>
                ) : (
                  <div className="save-options animate-fadeIn" style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '16px', 
                    padding: '20px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {/* Create New Project */}
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                        <FolderPlus size={14} style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--color-purple)' }} />
                        Create new project
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="My Awesome Track..."
                          style={{
                            flex: 1,
                            padding: '12px 14px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: 'white',
                            fontSize: '0.95rem',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={handleCreateAndSave}
                          disabled={!newProjectName.trim()}
                          className="cta-button-premium"
                          style={{ padding: '0 20px', borderRadius: '10px' }}
                        >
                          Create
                        </button>
                      </div>
                    </div>

                    {/* Existing Projects */}
                    {projects.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                          Add to existing project
                        </p>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {projects.slice(0, 5).map(project => (
                            <button
                              key={project.id}
                              onClick={() => handleSaveToExistingProject(project)}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '10px',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            >
                              <span style={{ fontWeight: '500' }}>{project.name}</span>
                              <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setShowSaveOptions(false)}
                      style={{
                        marginTop: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        width: '100%',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickWorkflow;
