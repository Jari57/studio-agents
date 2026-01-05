import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Sparkles, Mic, MicOff, FileText, Video, RefreshCw, Zap, 
  Music, Image as ImageIcon, Download, Save, FolderPlus, Volume2, VolumeX, X,
  Check, Loader2, Maximize2, Users, Eye, Edit3, Trash2, Copy, ChevronDown,
  Speaker, Hash
} from 'lucide-react';
import { BACKEND_URL, AGENTS } from '../constants';
import toast from 'react-hot-toast';
import PreviewModal from './PreviewModal';

// Generator Card Component - Agent-page style with full actions
function GeneratorCard({ 
  slot,
  agentId,
  icon: Icon, 
  title, 
  subtitle,
  color, 
  output, 
  isLoading,
  mediaType = null,
  mediaUrl = null,
  onGenerateMedia = null,
  isGeneratingMedia = false,
  onRegenerate = null,
  onEdit = null,
  onDelete = null,
  onSaveToProject = null,
  onDownload = null,
  onSpeak = null,
  isSpeaking = false,
  onMaximize = null
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(output || '');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setEditText(output || '');
  }, [output]);

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast.success('Copied to clipboard');
    }
  };

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(editText);
    }
    setIsEditing(false);
  };

  const agent = AGENTS.find(a => a.id === agentId);
  
  // Check if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="generator-card" style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: isMobile ? '14px' : '20px',
      border: `1px solid ${color}33`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      transition: 'all 0.3s ease',
      minHeight: isMobile ? '200px' : '380px'
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

      {/* Header - Agent style */}
      <div style={{
        padding: isMobile ? '10px 12px' : '16px 20px',
        borderBottom: `1px solid ${color}22`,
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '8px' : '12px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          width: isMobile ? '36px' : '48px',
          height: isMobile ? '36px' : '48px',
          borderRadius: isMobile ? '10px' : '14px',
          background: `linear-gradient(135deg, ${color}30, ${color}10)`,
          border: `2px solid ${color}60`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 20px ${color}20`
        }}>
          <Icon size={isMobile ? 18 : 24} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: isMobile ? '0.9rem' : '1.1rem', 
            fontWeight: '700',
            color: 'white'
          }}>
            {title}
          </h3>
          <p style={{ 
            margin: '2px 0 0', 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary)' 
          }}>
            {agent?.name || subtitle}
          </p>
        </div>
        {(isLoading || isGeneratingMedia) && (
          <div style={{
            padding: '6px 12px',
            borderRadius: '20px',
            background: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Loader2 size={14} color={color} className="spin" />
            <span style={{ fontSize: '0.7rem', color, fontWeight: '600' }}>
              {isLoading ? 'Generating...' : 'Creating Media...'}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div style={{ 
        flex: 1, 
        padding: isMobile ? '10px 12px' : '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '8px' : '12px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Text Output */}
        {!isLoading && output ? (
          <>
            {isEditing ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: isMobile ? '8px' : '12px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${color}40`,
                    color: 'white',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    lineHeight: '1.5',
                    resize: 'none',
                    outline: 'none',
                    minHeight: '120px'
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      background: color,
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.8rem'
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: isMobile ? '8px' : '12px',
                  padding: isMobile ? '10px' : '14px',
                  flex: 1,
                  overflow: 'auto',
                  cursor: 'pointer',
                  maxHeight: isExpanded ? (isMobile ? '150px' : '200px') : (isMobile ? '60px' : '100px'),
                  transition: 'max-height 0.3s ease'
                }}
              >
                <p style={{ 
                  fontSize: isMobile ? '0.8rem' : '0.9rem', 
                  lineHeight: isMobile ? '1.4' : '1.6', 
                  color: 'rgba(255,255,255,0.9)',
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {output}
                </p>
              </div>
            )}
          </>
        ) : isLoading ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div className="loading-dots">
              <span style={{ background: color }} />
              <span style={{ background: color }} />
              <span style={{ background: color }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              AI is thinking...
            </span>
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '8px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '20px'
          }}>
            <Icon size={32} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>
              Click "Generate All" to create content
            </span>
          </div>
        )}

        {/* Media Preview Section */}
        {output && mediaType && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '12px',
            border: `1px solid ${color}22`
          }}>
            {mediaUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Preview Area */}
                <div 
                  onClick={() => setShowPreview(true)}
                  style={{ 
                    cursor: 'pointer',
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  {mediaType === 'audio' && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '8px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${color}, ${color}88)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 12px ${color}44`
                      }}>
                        <Music size={18} color="white" />
                      </div>
                      <audio 
                        src={mediaUrl}
                        controls
                        style={{ flex: 1, height: '32px' }}
                      />
                    </div>
                  )}
                  {mediaType === 'image' && (
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={mediaUrl.startsWith('data:') ? mediaUrl : `data:image/png;base64,${mediaUrl}`}
                        alt="Generated"
                        style={{ 
                          width: '100%', 
                          maxHeight: '120px', 
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        borderRadius: '8px'
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                      >
                        <Eye size={24} color="white" />
                      </div>
                    </div>
                  )}
                  {mediaType === 'video' && (
                    <video 
                      src={mediaUrl}
                      style={{ 
                        width: '100%', 
                        maxHeight: '120px', 
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                      controls
                    />
                  )}
                </div>
              </div>
            ) : onGenerateMedia ? (
              <button
                onClick={onGenerateMedia}
                disabled={isGeneratingMedia}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: isGeneratingMedia ? 'rgba(255,255,255,0.05)' : `${color}15`,
                  border: `1px dashed ${color}50`,
                  color: color,
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: isGeneratingMedia ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {isGeneratingMedia ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Creating {mediaType}...
                  </>
                ) : (
                  <>
                    {mediaType === 'audio' && <Music size={16} />}
                    {mediaType === 'image' && <ImageIcon size={16} />}
                    {mediaType === 'video' && <Video size={16} />}
                    Generate {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
                  </>
                )}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Action Bar */}
      {output && !isEditing && (
        <div style={{
          padding: isMobile ? '8px 12px 10px' : '12px 20px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          gap: isMobile ? '4px' : '8px',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1
        }}>
          {/* TTS Button */}
          <button
            onClick={onSpeak}
            title={isSpeaking ? "Stop Speaking" : "Text to Speech"}
            style={{
              padding: isMobile ? '6px 8px' : '8px 12px',
              borderRadius: isMobile ? '6px' : '8px',
              background: isSpeaking ? `${color}30` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isSpeaking ? color : 'rgba(255,255,255,0.1)'}`,
              color: isSpeaking ? color : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '4px' : '6px',
              fontSize: isMobile ? '0.65rem' : '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {isSpeaking ? <VolumeX size={isMobile ? 12 : 14} /> : <Volume2 size={isMobile ? 12 : 14} />}
            {isSpeaking ? 'Stop' : 'TTS'}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            title="Copy to Clipboard"
            style={{
              padding: isMobile ? '6px 8px' : '8px 12px',
              borderRadius: isMobile ? '6px' : '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '4px' : '6px',
              fontSize: isMobile ? '0.65rem' : '0.75rem',
              fontWeight: '500'
            }}
          >
            <Copy size={14} />
            Copy
          </button>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            title="Edit Output"
            style={{
              padding: isMobile ? '6px 8px' : '8px 12px',
              borderRadius: isMobile ? '6px' : '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '4px' : '6px',
              fontSize: isMobile ? '0.65rem' : '0.75rem',
              fontWeight: '500'
            }}
          >
            <Edit3 size={isMobile ? 12 : 14} />
            Edit
          </button>

          {/* Preview Button - now next to Edit */}
          {(mediaUrl || (output && !mediaType)) && (
            <button
              onClick={() => setShowPreview(true)}
              title="Preview"
              style={{
                padding: isMobile ? '6px 8px' : '8px 12px',
                borderRadius: isMobile ? '6px' : '8px',
                background: `${color}20`,
                border: `1px solid ${color}40`,
                color: color,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '6px',
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                fontWeight: '600'
              }}
            >
              <Eye size={isMobile ? 12 : 14} />
              Preview
            </button>
          )}

          {/* Regenerate Button */}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              title="Regenerate"
              style={{
                padding: isMobile ? '6px 8px' : '8px 12px',
                borderRadius: isMobile ? '6px' : '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '6px',
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                fontWeight: '500'
              }}
            >
              <RefreshCw size={isMobile ? 12 : 14} />
              Redo
            </button>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Maximize Button */}
          {output && onMaximize && (
            <button
              onClick={onMaximize}
              title="Expand to Fullscreen"
              style={{
                padding: isMobile ? '6px 8px' : '8px 12px',
                borderRadius: isMobile ? '6px' : '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '6px',
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                fontWeight: '500'
              }}
            >
              <Maximize2 size={isMobile ? 12 : 14} />
            </button>
          )}

          {/* Download Button */}
          {(output || mediaUrl) && (
            <button
              onClick={onDownload}
              title="Download"
              style={{
                padding: isMobile ? '6px 8px' : '8px 12px',
                borderRadius: isMobile ? '6px' : '8px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22c55e',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '6px',
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                fontWeight: '600'
              }}
            >
              <Download size={isMobile ? 12 : 14} />
            </button>
          )}

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Delete"
              style={{
                padding: isMobile ? '6px 8px' : '8px 12px',
                borderRadius: isMobile ? '6px' : '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '6px',
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                fontWeight: '500'
              }}
            >
              <Trash2 size={isMobile ? 12 : 14} />
            </button>
          )}
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        mediaUrl={mediaUrl}
        mediaType={mediaType || 'text'}
        title={title}
        textContent={!mediaType ? output : null}
      />

      <style>{`
        .generator-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

// Main Orchestrator Component
export default function StudioOrchestratorV2({ 
  isOpen, 
  onClose, 
  onCreateProject,
  authToken = null,
  existingProject = null,
  onUpdateCreations = null
}) {
  const [songIdea, setSongIdea] = useState(existingProject?.name || '');
  const [language, setLanguage] = useState('English');
  const [style, setStyle] = useState('Modern Hip-Hop');
  const [model, setModel] = useState('Gemini 2.0 Flash');
  
  // 4 Generator Slots - default to free tier agents
  const [selectedAgents, setSelectedAgents] = useState({
    lyrics: 'ghost',
    audio: 'beat',
    visual: 'album',
    video: 'video-creator'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState({
    lyrics: null,
    audio: null,
    visual: null,
    video: null
  });
  
  const [mediaUrls, setMediaUrls] = useState({
    audio: null,
    image: null,
    video: null
  });
  
  const [generatingMedia, setGeneratingMedia] = useState({
    audio: false,
    image: false,
    video: false
  });
  
  const [speakingSlot, setSpeakingSlot] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState('singer'); // For Ghostwriter vocal generation
  const [generatingVocal, setGeneratingVocal] = useState(false);
  const [maximizedSlot, setMaximizedSlot] = useState(null); // Track which card is maximized
  const [creatingFinalMix, setCreatingFinalMix] = useState(false);
  const [finalMixPreview, setFinalMixPreview] = useState(null);
  
  const speechSynthRef = useRef(null);
  const recognitionRef = useRef(null);
  
  const EXAMPLE_IDEAS = [
    "Summer love in Brooklyn",
    "Trap anthem about success", 
    "Lo-fi study beats",
    "Emotional R&B ballad"
  ];

  // Generator slot configuration
  const GENERATOR_SLOTS = [
    { 
      key: 'lyrics', 
      title: 'Lyrics & Hook', 
      subtitle: 'Song writing', 
      icon: FileText, 
      color: '#8b5cf6',
      mediaType: null 
    },
    { 
      key: 'audio', 
      title: 'Beat & Audio', 
      subtitle: 'Music production', 
      icon: Music, 
      color: '#06b6d4',
      mediaType: 'audio' 
    },
    { 
      key: 'visual', 
      title: 'Cover Art', 
      subtitle: 'Visual design', 
      icon: ImageIcon, 
      color: '#ec4899',
      mediaType: 'image' 
    },
    { 
      key: 'video', 
      title: 'Music Video', 
      subtitle: 'Video creation', 
      icon: Video, 
      color: '#f59e0b',
      mediaType: 'video' 
    }
  ];

  // Speech-to-Text
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setSongIdea(transcript);
      };
      
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
      
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('Listening...');
    } else {
      toast.error('Speech recognition not supported');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Text-to-Speech
  const speakText = (text, slot) => {
    if (speakingSlot === slot) {
      window.speechSynthesis.cancel();
      setSpeakingSlot(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeakingSlot(null);
    utterance.onerror = () => setSpeakingSlot(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingSlot(slot);
  };

  // Get auth headers
  const getHeaders = async () => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  // Main generation function
  const handleGenerate = async () => {
    if (!songIdea.trim()) {
      toast.error('Please enter a song idea');
      return;
    }
    
    const activeSlots = Object.entries(selectedAgents).filter(([_, v]) => v);
    if (activeSlots.length === 0) {
      toast.error('Please select at least one agent');
      return;
    }
    
    setIsGenerating(true);
    const newOutputs = { lyrics: null, audio: null, visual: null, video: null };
    
    try {
      const headers = await getHeaders();
      
      // Generate for each active slot
      for (const [slot, agentId] of activeSlots) {
        const agent = AGENTS.find(a => a.id === agentId);
        if (!agent) continue;
        
        const slotConfig = GENERATOR_SLOTS.find(s => s.key === slot);
        
        const systemPrompt = `You are ${agent.name}, a professional ${agent.role}. 
        Create content for a ${style} song about: "${songIdea}" in ${language}.
        Be creative, professional, and match the genre's style.
        ${slot === 'lyrics' ? 'Write a catchy hook and verse lyrics.' : ''}
        ${slot === 'audio' ? 'Describe a detailed beat/instrumental concept with BPM, key, and production elements.' : ''}
        ${slot === 'visual' ? 'Describe a striking album cover or visual concept in detail for image generation.' : ''}
        ${slot === 'video' ? 'Write a creative music video concept/storyboard with scene descriptions.' : ''}`;
        
        try {
          const response = await fetch(`${BACKEND_URL}/api/generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              prompt: `Create ${slotConfig.title.toLowerCase()} content for: "${songIdea}"`,
              systemInstruction: systemPrompt
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            newOutputs[slot] = data.output;
          }
        } catch (err) {
          console.error(`Error generating ${slot}:`, err);
        }
      }
      
      setOutputs(newOutputs);
      toast.success('Generation complete!');
      
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate single slot
  const handleRegenerate = async (slot) => {
    if (!selectedAgents[slot]) return;
    
    const agent = AGENTS.find(a => a.id === selectedAgents[slot]);
    if (!agent) return;
    
    setOutputs(prev => ({ ...prev, [slot]: null }));
    
    try {
      const headers = await getHeaders();
      const slotConfig = GENERATOR_SLOTS.find(s => s.key === slot);
      
      const response = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `Create fresh ${slotConfig.title.toLowerCase()} content for: "${songIdea}"`,
          systemInstruction: `You are ${agent.name}. Create NEW and DIFFERENT content for a ${style} song about: "${songIdea}". Be creative and fresh.`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setOutputs(prev => ({ ...prev, [slot]: data.output }));
        toast.success(`${slotConfig.title} regenerated!`);
      }
    } catch (err) {
      toast.error('Regeneration failed');
    }
  };

  // Media generation functions
  const handleGenerateAudio = async () => {
    if (!outputs.audio) return;
    setGeneratingMedia(prev => ({ ...prev, audio: true }));
    toast.loading('Generating audio...', { id: 'gen-audio' });
    
    try {
      const headers = await getHeaders();
      const response = await fetch(`${BACKEND_URL}/api/generate-audio`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `${style} instrumental beat: ${outputs.audio.substring(0, 200)}`,
          duration: 8
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.audioUrl) {
          setMediaUrls(prev => ({ ...prev, audio: data.audioUrl }));
          toast.success('Audio created!', { id: 'gen-audio' });
        }
      }
    } catch (err) {
      toast.error('Audio generation failed', { id: 'gen-audio' });
    } finally {
      setGeneratingMedia(prev => ({ ...prev, audio: false }));
    }
  };

  const handleGenerateImage = async () => {
    if (!outputs.visual) return;
    setGeneratingMedia(prev => ({ ...prev, image: true }));
    toast.loading('Generating image...', { id: 'gen-image' });
    
    try {
      const headers = await getHeaders();
      const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `Album cover art: ${outputs.visual.substring(0, 300)}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.imageData) {
          setMediaUrls(prev => ({ ...prev, image: data.imageData }));
          toast.success('Image created!', { id: 'gen-image' });
        }
      }
    } catch (err) {
      toast.error('Image generation failed', { id: 'gen-image' });
    } finally {
      setGeneratingMedia(prev => ({ ...prev, image: false }));
    }
  };

  const handleGenerateVideo = async () => {
    if (!outputs.video) return;
    setGeneratingMedia(prev => ({ ...prev, video: true }));
    toast.loading('Generating video (this takes ~2 min)...', { id: 'gen-video' });
    
    try {
      const headers = await getHeaders();
      const response = await fetch(`${BACKEND_URL}/api/generate-video`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `Music video: ${outputs.video.substring(0, 200)}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.videoUrl) {
          setMediaUrls(prev => ({ ...prev, video: data.videoUrl }));
          toast.success('Video created!', { id: 'gen-video' });
        }
      }
    } catch (err) {
      toast.error('Video generation failed', { id: 'gen-video' });
    } finally {
      setGeneratingMedia(prev => ({ ...prev, video: false }));
    }
  };

  // Ghostwriter vocal generation - Generate audio of lyrics being recited/sung
  const handleGenerateLyricsVocal = async () => {
    if (!outputs.lyrics) {
      toast.error('Generate lyrics first');
      return;
    }
    
    setGeneratingVocal(true);
    toast.loading('Creating vocal performance...', { id: 'gen-vocal' });
    
    try {
      const headers = await getHeaders();
      
      // Use TTS with different voice styles
      const voiceDescriptions = {
        singer: 'smooth vocal delivery with musical phrasing, like a professional singer',
        rapper: 'fast-paced rhythmic delivery with attitude and swagger, like a hip-hop artist',
        narrator: 'clear spoken word delivery with good enunciation and presence',
        whisper: 'intimate whispered vocal delivery',
        spoken: 'natural conversational tone'
      };
      
      const response = await fetch(`${BACKEND_URL}/api/generate-audio`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `${voiceDescriptions[voiceStyle] || 'singing'}: "${outputs.lyrics.substring(0, 300)}"`,
          voiceStyle: voiceStyle,
          duration: 15,
          type: 'vocal'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.audioUrl) {
          // Store as a separate vocal version under the lyrics
          setMediaUrls(prev => ({ 
            ...prev, 
            lyricsVocal: data.audioUrl 
          }));
          toast.success(`${voiceStyle} vocal created!`, { id: 'gen-vocal' });
        }
      } else {
        toast.error('Failed to generate vocal', { id: 'gen-vocal' });
      }
    } catch (err) {
      console.error('Vocal generation error:', err);
      toast.error('Vocal generation failed', { id: 'gen-vocal' });
    } finally {
      setGeneratingVocal(false);
    }
  };

  // Create final mix - combines all outputs into a single product
  const handleCreateFinalMix = async () => {
    const hasAllOutputs = outputs.lyrics && outputs.audio && outputs.visual && outputs.video;
    if (!hasAllOutputs) {
      toast.error('Generate all 4 outputs first');
      return;
    }

    setCreatingFinalMix(true);
    toast.loading('Creating final mix...', { id: 'final-mix' });

    try {
      // Compile all outputs into a final product summary
      const finalMix = {
        id: `mix-${Date.now()}`,
        title: `${songIdea} - Complete Mix`,
        description: `Full production of "${songIdea}" with lyrics, beat, visual, and video`,
        created: new Date().toISOString(),
        components: {
          lyrics: {
            content: outputs.lyrics,
            agent: AGENTS.find(a => a.id === selectedAgents.lyrics)?.name || 'Ghostwriter',
            vocalUrl: mediaUrls.lyricsVocal || null
          },
          audio: {
            content: outputs.audio,
            agent: AGENTS.find(a => a.id === selectedAgents.audio)?.name || 'Beat Maker',
            audioUrl: mediaUrls.audio || null
          },
          visual: {
            content: outputs.visual,
            agent: AGENTS.find(a => a.id === selectedAgents.visual)?.name || 'Designer',
            imageUrl: mediaUrls.image || null
          },
          video: {
            content: outputs.video,
            agent: AGENTS.find(a => a.id === selectedAgents.video)?.name || 'Video Creator',
            videoUrl: mediaUrls.video || null
          }
        },
        settings: { language, style, model }
      };

      setFinalMixPreview(finalMix);
      toast.success('Final mix ready!', { id: 'final-mix' });
    } catch (err) {
      console.error('Final mix error:', err);
      toast.error('Failed to create final mix', { id: 'final-mix' });
    } finally {
      setCreatingFinalMix(false);
    }
  };

  // Download handler
  const handleDownload = (slot) => {
    const output = outputs[slot];
    const slotConfig = GENERATOR_SLOTS.find(s => s.key === slot);
    
    if (output) {
      const blob = new Blob([output], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${songIdea || 'output'}-${slotConfig.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    // Also download media if available
    const mediaMap = { audio: mediaUrls.audio, visual: mediaUrls.image, video: mediaUrls.video };
    if (mediaMap[slot]) {
      const a = document.createElement('a');
      a.href = mediaMap[slot];
      a.download = `${songIdea || 'media'}-${slot}`;
      a.click();
    }
  };

  // Delete handler
  const handleDelete = (slot) => {
    setOutputs(prev => ({ ...prev, [slot]: null }));
    if (slot === 'audio') setMediaUrls(prev => ({ ...prev, audio: null }));
    if (slot === 'visual') setMediaUrls(prev => ({ ...prev, image: null }));
    if (slot === 'video') setMediaUrls(prev => ({ ...prev, video: null }));
    toast.success('Deleted');
  };

  // Edit handler
  const handleEdit = (slot, newText) => {
    setOutputs(prev => ({ ...prev, [slot]: newText }));
    toast.success('Saved');
  };

  // Create project
  const handleCreateProject = () => {
    console.log('[Orchestrator] handleCreateProject called');
    console.log('[Orchestrator] outputs:', outputs);
    console.log('[Orchestrator] mediaUrls:', mediaUrls);
    
    const assets = [];
    
    GENERATOR_SLOTS.forEach(slot => {
      if (outputs[slot.key]) {
        const agent = AGENTS.find(a => a.id === selectedAgents[slot.key]);
        assets.push({
          id: String(Date.now() + Math.random()),
          title: slot.title,
          type: slot.key,
          agent: agent?.name || slot.subtitle,
          content: outputs[slot.key],
          snippet: outputs[slot.key].substring(0, 100),
          audioUrl: slot.key === 'audio' ? mediaUrls.audio : null,
          imageUrl: slot.key === 'visual' ? (mediaUrls.image ? `data:image/png;base64,${mediaUrls.image}` : null) : null,
          videoUrl: slot.key === 'video' ? mediaUrls.video : null,
          date: 'Just now',
          color: `agent-${slot.color.replace('#', '')}`
        });
      }
    });
    
    console.log('[Orchestrator] assets created:', assets.length);
    
    const project = {
      id: String(Date.now()),
      name: projectName || songIdea || 'Untitled Project',
      description: `Created with Studio Orchestrator: "${songIdea}"`,
      category: 'Music',
      language,
      style,
      model,
      date: new Date().toLocaleDateString(),
      agents: Object.values(selectedAgents).filter(Boolean).map(id => {
        const agent = AGENTS.find(a => a.id === id);
        return agent?.name || id;
      }),
      assets,
      coverImage: mediaUrls.image ? `data:image/png;base64,${mediaUrls.image}` : null
    };
    
    console.log('[Orchestrator] project created:', project.id, project.name);
    
    if (onCreateProject) {
      console.log('[Orchestrator] calling onCreateProject callback');
      onCreateProject(project);
      toast.success(`Saved "${project.name}" with ${assets.length} assets!`);
    } else {
      console.warn('[Orchestrator] No onCreateProject callback provided!');
      toast.error('Save failed - no handler');
    }
    
    setShowCreateProject(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="studio-orchestrator-overlay animate-fadeIn"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(10,10,20,0.98) 100%)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: '16px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
          }}>
            <Zap size={26} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>Studio Orchestrator</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              4 AI Generators • One Unified Pipeline
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none', 
            borderRadius: '12px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <X size={22} color="white" />
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Input Section */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              value={songIdea}
              onChange={(e) => setSongIdea(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Describe your song idea, vibe, or concept..."
              style={{
                flex: 1,
                padding: '18px 24px',
                borderRadius: '16px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white',
                fontSize: '1.1rem',
                outline: 'none'
              }}
            />
            
            {/* STT Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              style={{
                padding: '18px',
                borderRadius: '16px',
                background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isListening ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                color: isListening ? '#ef4444' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isListening ? "Stop Listening" : "Voice Input"}
            >
              {isListening ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !songIdea.trim()}
              style={{
                padding: '18px 32px',
                borderRadius: '16px',
                background: isGenerating ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                border: 'none',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.05rem',
                cursor: isGenerating || !songIdea.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                opacity: !songIdea.trim() ? 0.5 : 1,
                boxShadow: isGenerating ? 'none' : '0 4px 20px rgba(139, 92, 246, 0.4)'
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={22} className="spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={22} />
                  Generate All
                </>
              )}
            </button>
          </div>
          
          {/* Quick Examples */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Try:</span>
            {EXAMPLE_IDEAS.map((idea, i) => (
              <button
                key={i}
                onClick={() => setSongIdea(idea)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {[
            { label: 'Language', value: language, setter: setLanguage, options: ['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Portuguese'] },
            { label: 'Genre', value: style, setter: setStyle, options: ['Modern Hip-Hop', '90s Boom Bap', 'Trap', 'R&B / Soul', 'Pop', 'Rock', 'Electronic', 'Lo-Fi'] },
            { label: 'AI Model', value: model, setter: setModel, options: ['Gemini 2.0 Flash', 'Gemini 2.0 Pro (Exp)', 'Gemini 1.5 Pro'] }
          ].map(config => (
            <div key={config.label}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.7rem', 
                color: 'var(--text-secondary)', 
                marginBottom: '6px',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.05em'
              }}>
                {config.label}
              </label>
              <select
                value={config.value}
                onChange={(e) => config.setter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {config.options.map(opt => (
                  <option key={opt} value={opt} style={{ background: '#1a1a1a' }}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Agent Selection */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '16px' 
          }}>
            <Users size={16} color="var(--text-secondary)" />
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-secondary)', 
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Assign Agents to Each Generator
            </span>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            {GENERATOR_SLOTS.map(slot => (
              <div key={slot.key}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.7rem', 
                  color: slot.color, 
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  {slot.title}
                </label>
                <select
                  value={selectedAgents[slot.key] || ''}
                  onChange={(e) => setSelectedAgents(prev => ({ 
                    ...prev, 
                    [slot.key]: e.target.value || null 
                  }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: selectedAgents[slot.key] ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${selectedAgents[slot.key] ? slot.color + '60' : 'rgba(255,255,255,0.1)'}`,
                    color: selectedAgents[slot.key] ? 'white' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="" style={{ background: '#1a1a1a' }}>— None —</option>
                  {AGENTS.filter(a => a.tier === 'free').map(agent => (
                    <option key={agent.id} value={agent.id} style={{ background: '#1a1a1a' }}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Ghostwriter Vocal Generation - appears when lyrics are ready */}
        {outputs.lyrics && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            marginBottom: '24px'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <h4 style={{ 
                  margin: '0 0 6px', 
                  fontSize: '1rem', 
                  fontWeight: '700',
                  color: '#8b5cf6'
                }}>
                  🎤 Ghostwriter Vocal Performance
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.85rem', 
                  color: 'var(--text-secondary)' 
                }}>
                  Generate audio of the lyrics being recited or sung by different voice types
                </p>
              </div>
            </div>

            {/* Preview Section with Tabs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              {/* Text Preview */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#8b5cf6',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '12px'
                }}>
                  📝 Lyrics Text
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  color: 'rgba(255,255,255,0.85)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {outputs.lyrics}
                </div>
              </div>

              {/* Audio Preview */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#8b5cf6',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '12px'
                }}>
                  🎵 Vocal Audio
                </div>
                {mediaUrls.lyricsVocal ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    flex: 1
                  }}>
                    <audio 
                      src={mediaUrls.lyricsVocal}
                      controls
                      style={{ 
                        width: '100%',
                        height: '38px',
                        borderRadius: '8px'
                      }}
                    />
                    <button
                      onClick={() => {
                        const modal = document.createElement('div');
                        modal.innerHTML = `
                          <div style="
                            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                            background: rgba(0,0,0,0.9); z-index: 9999;
                            display: flex; align-items: center; justify-content: center;
                            padding: 20px;
                          " onclick="if(event.target === this) this.remove();">
                            <div style="
                              background: rgba(0,0,0,0.8); border-radius: 20px;
                              padding: 24px; max-width: 500px; width: 100%;
                              border: 1px solid rgba(139, 92, 246, 0.4);
                            " onclick="event.stopPropagation();">
                              <div style="
                                font-weight: 700; margin-bottom: 16px; color: #8b5cf6;
                              ">
                                🎧 Vocal Audio Player
                              </div>
                              <audio 
                                src="${mediaUrls.lyricsVocal}"
                                controls
                                autoplay
                                style="width: 100%; height: 50px; border-radius: 10px;"
                              />
                              <div style="
                                margin-top: 16px; font-size: 0.85rem;
                                color: var(--text-secondary);
                              ">
                                Voice Style: <strong>${voiceStyle}</strong>
                              </div>
                            </div>
                          </div>
                        `;
                        document.body.appendChild(modal);
                        modal.onclick = (e) => e.target === modal && modal.remove();
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        background: 'rgba(139, 92, 246, 0.3)',
                        border: '1px solid rgba(139, 92, 246, 0.5)',
                        color: '#8b5cf6',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Eye size={14} />
                      Fullscreen
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                  }}>
                    No audio yet • Click "Create Vocal" below
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={voiceStyle}
                onChange={(e) => setVoiceStyle(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  color: 'white',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="singer">🎤 Singer</option>
                <option value="rapper">🎙️ Rapper</option>
                <option value="narrator">📢 Narrator</option>
                <option value="whisper">🤫 Whisper</option>
                <option value="spoken">🗣️ Spoken Word</option>
              </select>
              
              <button
                onClick={handleGenerateLyricsVocal}
                disabled={generatingVocal}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: generatingVocal ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.6)',
                  color: '#8b5cf6',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: generatingVocal ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: generatingVocal ? 0.7 : 1
                }}
              >
                {generatingVocal ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Speaker size={16} />
                    Create Vocal
                  </>
                )}
              </button>

              {/* Copy Lyrics Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(outputs.lyrics);
                  toast.success('Lyrics copied!');
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)',
                  fontWeight: '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Copy size={14} />
                Copy Lyrics
              </button>

              {mediaUrls.lyricsVocal && (
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = mediaUrls.lyricsVocal;
                    a.download = `${songIdea || 'lyrics'}-${voiceStyle}.mp3`;
                    a.click();
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#22c55e',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} />
                  Download Audio
                </button>
              )}
            </div>
          </div>
        )}

        {/* Final Mix Section - appears when all 4 generators complete */}
        {Object.values(outputs).every(Boolean) && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <h4 style={{ 
                  margin: '0 0 6px', 
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  color: '#22c55e'
                }}>
                  ✨ Final Mix - Complete Product
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.85rem', 
                  color: 'var(--text-secondary)' 
                }}>
                  All 4 generators complete • Combine into a single integrated product
                </p>
              </div>
            </div>

            {/* Components Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: '600', marginBottom: '4px' }}>📝 Lyrics</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  {outputs.lyrics.length} chars
                </div>
              </div>
              
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: '600', marginBottom: '4px' }}>🎵 Beat</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  {mediaUrls.audio ? '✓ Audio' : 'Ready'}
                </div>
              </div>
              
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#ec4899', fontWeight: '600', marginBottom: '4px' }}>🖼️ Visual</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  {mediaUrls.image ? '✓ Image' : 'Ready'}
                </div>
              </div>
              
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: '600', marginBottom: '4px' }}>🎬 Video</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  {mediaUrls.video ? '✓ Video' : 'Ready'}
                </div>
              </div>
            </div>

            {/* Final Mix Preview */}
            {finalMixPreview && (
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#22c55e',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '12px'
                }}>
                  📦 Final Product Preview
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: '1.6'
                }}>
                  <strong>{finalMixPreview.title}</strong>
                  <div style={{ fontSize: '0.8rem', marginTop: '8px', color: 'var(--text-secondary)' }}>
                    {finalMixPreview.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '12px', color: 'var(--text-secondary)' }}>
                    Created: {new Date(finalMixPreview.created).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleCreateFinalMix}
                disabled={creatingFinalMix}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: creatingFinalMix ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.5)',
                  border: '1px solid rgba(34, 197, 94, 0.6)',
                  color: '#22c55e',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: creatingFinalMix ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {creatingFinalMix ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Mixing...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Create Final Mix
                  </>
                )}
              </button>

              {finalMixPreview && (
                <button
                  onClick={() => {
                    const exportData = JSON.stringify(finalMixPreview, null, 2);
                    const blob = new Blob([exportData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${songIdea || 'mix'}-final.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Final mix exported!');
                  }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Download size={16} />
                  Export Mix
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4 Generator Cards Grid - 2x2 layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {GENERATOR_SLOTS.map(slot => (
            <GeneratorCard
              key={slot.key}
              slot={slot.key}
              agentId={selectedAgents[slot.key]}
              icon={slot.icon}
              title={slot.title}
              subtitle={slot.subtitle}
              color={slot.color}
              output={outputs[slot.key]}
              isLoading={isGenerating && selectedAgents[slot.key]}
              mediaType={slot.mediaType}
              mediaUrl={
                slot.key === 'audio' ? mediaUrls.audio :
                slot.key === 'visual' ? mediaUrls.image :
                slot.key === 'video' ? mediaUrls.video : null
              }
              onGenerateMedia={
                slot.key === 'audio' ? handleGenerateAudio :
                slot.key === 'visual' ? handleGenerateImage :
                slot.key === 'video' ? handleGenerateVideo : null
              }
              isGeneratingMedia={
                slot.key === 'audio' ? generatingMedia.audio :
                slot.key === 'visual' ? generatingMedia.image :
                slot.key === 'video' ? generatingMedia.video : false
              }
              onRegenerate={() => handleRegenerate(slot.key)}
              onEdit={(text) => handleEdit(slot.key, text)}
              onDelete={() => handleDelete(slot.key)}
              onDownload={() => handleDownload(slot.key)}
              onSpeak={() => speakText(outputs[slot.key], slot.key)}
              isSpeaking={speakingSlot === slot.key}
              onMaximize={() => setMaximizedSlot(slot.key)}
            />
          ))}
        </div>
      </div>

      {/* Maximized Card Modal */}
      {maximizedSlot && GENERATOR_SLOTS.find(s => s.key === maximizedSlot) && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(10,10,20,0.98) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => setMaximizedSlot(null)}
        >
          <div 
            style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
              zIndex: 10
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
                {GENERATOR_SLOTS.find(s => s.key === maximizedSlot)?.title}
              </h3>
              <button
                onClick={() => setMaximizedSlot(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.2s'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Maximized Card Content */}
            <div style={{
              padding: '24px',
              flex: 1,
              overflowY: 'auto'
            }}>
              {(() => {
                const slot = GENERATOR_SLOTS.find(s => s.key === maximizedSlot);
                return (
                  <GeneratorCard
                    key={`max-${slot.key}`}
                    slot={slot.key}
                    agentId={selectedAgents[slot.key]}
                    icon={slot.icon}
                    title={slot.title}
                    subtitle={slot.subtitle}
                    color={slot.color}
                    output={outputs[slot.key]}
                    isLoading={isGenerating && selectedAgents[slot.key]}
                    mediaType={slot.mediaType}
                    mediaUrl={
                      slot.key === 'audio' ? mediaUrls.audio :
                      slot.key === 'visual' ? mediaUrls.image :
                      slot.key === 'video' ? mediaUrls.video : null
                    }
                    onGenerateMedia={
                      slot.key === 'audio' ? handleGenerateAudio :
                      slot.key === 'visual' ? handleGenerateImage :
                      slot.key === 'video' ? handleGenerateVideo : null
                    }
                    isGeneratingMedia={
                      slot.key === 'audio' ? generatingMedia.audio :
                      slot.key === 'visual' ? generatingMedia.image :
                      slot.key === 'video' ? generatingMedia.video : false
                    }
                    onRegenerate={() => handleRegenerate(slot.key)}
                    onEdit={(text) => handleEdit(slot.key, text)}
                    onDelete={() => handleDelete(slot.key)}
                    onDownload={() => handleDownload(slot.key)}
                    onSpeak={() => speakText(outputs[slot.key], slot.key)}
                    isSpeaking={speakingSlot === slot.key}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      {Object.values(outputs).some(Boolean) && (
        <div style={{
          padding: '16px 24px',
          background: 'rgba(0,0,0,0.8)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          bottom: 0,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {Object.values(outputs).filter(Boolean).length}/4 generators complete • 
            {Object.values(mediaUrls).filter(Boolean).length} media assets
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                const exportData = {
                  project: songIdea,
                  timestamp: new Date().toISOString(),
                  outputs,
                  settings: { language, style, model }
                };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${songIdea || 'project'}-export.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Exported!');
              }}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              Export
            </button>
            
            <button
              onClick={() => setShowCreateProject(true)}
              style={{
                padding: '12px 28px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                border: 'none',
                color: 'white',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
              }}
            >
              <FolderPlus size={18} />
              Save to Project
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateProject && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000
          }}
          onClick={() => setShowCreateProject(false)}
        >
          <div 
            style={{
              background: 'var(--bg-card)',
              borderRadius: '24px',
              padding: '28px',
              maxWidth: '420px',
              width: '90%',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: '1.3rem', fontWeight: '700' }}>
              Save to Project
            </h3>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={songIdea || "Project name..."}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem',
                marginBottom: '20px',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCreateProject(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        .loading-dots {
          display: flex;
          gap: 4px;
        }
        .loading-dots span {
          width: 8px;
          height: 8px;
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
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
