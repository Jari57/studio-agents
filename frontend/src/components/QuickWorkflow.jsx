import React, { useState } from 'react';
import { X, Sparkles, Save, FolderPlus, ChevronRight, Mic, Copy, Check, Loader, Volume2, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';
import { BACKEND_URL } from '../constants';
import { useVoice } from '../hooks/useVoice';

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
  user
}) {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [style, setStyle] = useState('Modern Hip-Hop');
  const [model, setModel] = useState('Gemini 2.0 Flash');
  const [output, setOutput] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [copied, setCopied] = useState(false);

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

    setIsGenerating(true);
    setOutput(null);

    try {
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
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div 
        className="modal-content quick-workflow-modal" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ 
          borderBottom: '1px solid var(--border-color)', 
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px',
              background: `${agent.color || 'var(--color-purple)'}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: agent.color || 'var(--color-purple)',
              flexShrink: 0
            }}>
              <agent.icon size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.role || agent.category}</p>
            </div>
          </div>
          <button 
            className="modal-close" 
            onClick={onClose}
            style={{ position: 'relative', top: 'auto', right: 'auto', flexShrink: 0 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* Configuration Bar */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '20px'
          }}>
            <div style={{ flex: 1 }}>
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

            <div style={{ flex: 1 }}>
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

            <div style={{ flex: 1 }}>
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

          {/* Quick Prompts */}
          {quickPrompts.length > 0 && !output && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Try:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {quickPrompts.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(ex)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {ex.length > 40 ? ex.substring(0, 40) + '...' : ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={agent.example || `What do you want ${agent.name} to create?`}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '16px',
                paddingRight: '48px',
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              autoFocus
            />
            <button
              onClick={handleVoiceInput}
              style={{
                position: 'absolute',
                right: '12px',
                top: '12px',
                background: isListening ? 'var(--color-purple)' : 'transparent',
                border: 'none',
                color: isListening ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px'
              }}
              title="Voice input"
            >
              <Mic size={18} />
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
              opacity: isGenerating || !prompt.trim() ? 0.6 : 1
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
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                maxHeight: '200px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem',
                lineHeight: '1.6'
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
                      padding: '12px',
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Save size={16} />
                    Save to Project
                  </button>
                ) : (
                  <div className="save-options animate-fadeIn" style={{ 
                    background: 'var(--color-bg-tertiary)', 
                    borderRadius: '12px', 
                    padding: '16px',
                    border: '1px solid var(--border-color)'
                  }}>
                    {/* Create New Project */}
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <FolderPlus size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                        Create new project
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="Project name..."
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            background: 'var(--color-bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem'
                          }}
                        />
                        <button
                          onClick={handleCreateAndSave}
                          disabled={!newProjectName.trim()}
                          className="cta-button-premium"
                          style={{ padding: '10px 16px' }}
                        >
                          Create
                        </button>
                      </div>
                    </div>

                    {/* Existing Projects */}
                    {projects.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          Or add to existing project
                        </p>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {projects.slice(0, 5).map(project => (
                            <button
                              key={project.id}
                              onClick={() => handleSaveToExistingProject(project)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'var(--color-bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '6px',
                                fontSize: '0.9rem'
                              }}
                            >
                              <span>{project.name}</span>
                              <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setShowSaveOptions(false)}
                      style={{
                        marginTop: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        width: '100%',
                        textAlign: 'center'
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
