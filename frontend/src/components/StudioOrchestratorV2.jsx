/* eslint-disable no-use-before-define */
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { 
  Sparkles, Mic, MicOff, FileText, Video as VideoIcon, RefreshCw, Zap, 
  Music, Image as ImageIcon, Download, FolderPlus, Volume2, VolumeX, X,
  Loader2, Maximize2, Users, Eye, Edit3, Trash2, Copy, Lightbulb,
  Settings, CheckCircle2, Lock as LockIcon, User, Database as DatabaseIcon, CircleHelp,
  ChevronRight, ChevronUp
} from 'lucide-react';
import { BACKEND_URL, AGENTS, getAgentHex } from '../constants';
import toast from 'react-hot-toast';
import { db, auth, doc, setDoc, updateDoc, increment, getDoc, arrayUnion } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { formatImageSrc, formatAudioSrc, formatVideoSrc } from '../utils/mediaUtils';

// Lazy load modals and heavy sub-sections (standardizing to React.lazy to prevent 'lazy is not defined' error)
const PreviewModal = React.lazy(() => import('./PreviewModal'));

// Helper to split intro/narrative from creative content
const splitCreativeContent = (text) => {
  if (!text) return { intro: '', content: '' };
  
  // Handle objects/arrays by stringifying
  if (typeof text !== 'string') {
    return { intro: '', content: JSON.stringify(text, null, 2) };
  }
  
  // Look for common content markers indicating the start of the "creative" part
  const markers = [
    /\[Verse/i,
    /\[Chorus/i,
    /\[Hook/i,
    /\[Bridge/i,
    /\[Intro/i,
    /\[Lyrics/i,
    /\[Style/i,
    /\[Hard/i,
    /\[Soft/i,
    /\[Fast/i,
    /\[Slow/i,
    /\(Verse/i,
    /\(Chorus/i,
    /Verse \d+:/i,
    /Chorus:/i,
    /Hook:/i,
    /^\s*Lyrics:\s*$/im,
    /Visual:/i,
    /Concept:/i,
    /Description:/i,
    /Beat Description:/i,
    /BPM:/i,
    /Storyboard:/i,
    /^\[[A-Z]/  // Any uppercase tag at start of line
  ];
  
  let firstMarkerIndex = -1;
  for (const marker of markers) {
    const match = text.match(marker);
    if (match && (firstMarkerIndex === -1 || match.index < firstMarkerIndex)) {
      firstMarkerIndex = match.index;
    }
  }
  
  if (firstMarkerIndex !== -1) {
    return {
      intro: text.substring(0, firstMarkerIndex).trim(),
      content: text.substring(firstMarkerIndex).trim()
    };
  }
  
  // If no markers found, check if it starts with "Here is", "Sure!", etc and try to strip it
  const fluffPrefixes = [
    /^Sure! Here (is|are) some (lyrics|content|a song).*:/i,
    /^Here (is|are) (the|your) (lyrics|song).*:/i,
    /^Okay, here's a concept.*:/i
  ];
  
  for (const prefix of fluffPrefixes) {
    if (prefix.test(text)) {
      const match = text.match(prefix);
      return {
        intro: match[0].trim(),
        content: text.substring(match[0].length).trim()
      };
    }
  }

  // Check for "Summary:" or similar as well
  if (text.includes('Summary:')) {
    const parts = text.split('Summary:');
    return { 
      intro: parts[0].trim(), 
      content: ('Summary: ' + parts[1]).trim() 
    };
  }

  return { intro: '', content: text };
};

// Skeleton Loader for AI generation
const SkeletonItem = ({ height = '14px', width = '100%', marginBottom = '8px', opacity = 0.1 }) => (
  <div style={{
    height,
    width,
    marginBottom,
    borderRadius: '4px',
    background: `linear-gradient(90deg, rgba(255,255,255,${opacity}) 25%, rgba(255,255,255,${opacity * 2}) 50%, rgba(255,255,255,${opacity}) 75%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite linear'
  }} />
);

// Generator Card Component - Agent-page style with full actions
function GeneratorCard({ 
  slot,
  agentId,
  icon, 
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
  // onSaveToProject = null, - unused
  onDownload = null,
  onSpeak = null,
  isSpeaking = false,
  onMaximize = null,
  onUploadDna = null,
  onClearDna = null,
  dnaUrl = null,
  isUploadingDna = false
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(output || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const { intro, content } = splitCreativeContent(output);
  const displayContent = showIntro ? intro : content;

  // 📱 Device responsiveness
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync editText when output prop changes - intentional setState in effect for prop sync
  const prevOutputRef = useRef(output);
  useEffect(() => {
    // Only update if output actually changed (avoid loops)
    if (prevOutputRef.current !== output) {
      prevOutputRef.current = output;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditText(output || '');
    }
  }, [output]);

  const handleCopy = () => {
    if (output) {
      // If lyrics slot, copy just the content/lyrics by default unless intro is showing
      const textToCopy = (slot === 'lyrics' && !showIntro) ? content : output;
      navigator.clipboard.writeText(textToCopy);
      toast.success(slot === 'lyrics' && !showIntro ? 'Lyrics copied' : 'Copied to clipboard');
    }
  };

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(editText);
    }
    setIsEditing(false);
  };

  const agent = AGENTS.find(a => a.id === agentId);
  const agentColor = agent ? getAgentHex(agent) : color;

  return (
    <div className={`generator-card-unified ${agent?.colorClass || ''}`} style={{
      minHeight: isMobile ? 'auto' : '380px',
      padding: 0,
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      borderTop: `3px solid ${agentColor}`
    }}>
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle at center, ${agentColor}08 0%, transparent 50%)`,
        pointerEvents: 'none'
      }} />

      {/* Header - Agent style */}
      <div className="generator-card-header" style={{
        padding: isMobile ? '10px' : '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '10px' : '12px',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="generator-icon-box">
          {/* Render icon component */}
          {React.createElement(icon, { size: isMobile ? 20 : 24 })}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: isMobile ? '0.95rem' : '1.125rem', 
            fontWeight: '700',
            color: 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {title}
          </h3>
          <p style={{ 
            margin: '2px 0 0', 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {agent?.name || subtitle}
            {agent?.isBeta && (
              <span style={{
                fontSize: '0.6rem',
                padding: '1px 5px',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                borderRadius: '4px',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                fontWeight: '800',
                letterSpacing: '0.05em'
              }}>BETA</span>
            )}
          </p>
          {agent?.capabilities && agent.capabilities.length > 0 && (
            <div className="agent-cap-pills" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
              {agent.category && (
                <span style={{ padding: '1px 5px', background: `${agentColor}1A`, color: agentColor, borderRadius: '4px', fontSize: '0.55rem', fontWeight: '600' }}>{agent.category}</span>
              )}
              {agent.capabilities.slice(0, 2).map((cap, i) => (
                <span key={i} style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', borderRadius: '4px', fontSize: '0.55rem' }}>{cap}</span>
              ))}
            </div>
          )}
        </div>

        {/* DNA DNA DNA - Upload Reference Button */}
        {onUploadDna && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="file"
              id={`dna-upload-${slot}`}
              accept={
                slot === 'audio' ? 'audio/*' : 
                slot === 'lyrics' ? '.txt,.doc,.docx,.pdf' : 
                'image/*'
              }
              onChange={onUploadDna}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => document.getElementById(`dna-upload-${slot}`).click()}
              disabled={isUploadingDna}
              title={`${slot === 'video' ? 'Image' : slot.charAt(0).toUpperCase() + slot.slice(1)} DNA (Reference)`}
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: dnaUrl ? `${color}20` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${dnaUrl ? color + '80' : 'rgba(255,255,255,0.1)'}`,
                color: dnaUrl ? color : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
                fontSize: '0.7rem',
                fontWeight: '600'
              }}
            >
              {isUploadingDna ? <Loader2 size={14} className="spin" /> : <Zap size={14} />}
              {dnaUrl && !isMobile && 'DNA✓'}
            </button>
            
            {dnaUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClearDna) onClearDna();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

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
                className="lyrics-stanza-view"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: isMobile ? '8px' : '12px',
                  padding: isMobile ? '10px' : '16px',
                  flex: 1,
                  overflow: 'auto',
                  cursor: 'pointer',
                  maxHeight: isExpanded ? (isMobile ? '50vh' : '400px') : (isMobile ? '200px' : '280px'),
                  transition: 'max-height 0.3s ease',
                  position: 'relative'
                }}
              >
                {/* Intro/Summary Toggle */}
                {intro && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowIntro(!showIntro);
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: showIntro ? color : 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      color: 'white',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: showIntro ? `0 2px 8px ${color}44` : 'none'
                    }}
                  >
                    {showIntro ? <FileText size={10} /> : <Lightbulb size={10} />}
                    {showIntro ? 'SHOW LYRICS' : 'SHOW PROMPT'}
                  </button>
                )}

                <p style={{ 
                  fontSize: isMobile ? '0.85rem' : '1rem', 
                  lineHeight: isMobile ? '1.5' : '1.8', 
                  color: 'rgba(255,255,255,0.95)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  letterSpacing: '0.01em'
                }}>
                  {/* Format output as stanzas - add extra line breaks between sections */}
                  {displayContent?.split(/\n\n+/).map((stanza, i) => (
                    <span key={i} style={{ display: 'block', marginBottom: i < displayContent.split(/\n\n+/).length - 1 ? '1em' : 0 }}>
                      {stanza}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </>
        ) : isLoading ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '4px'
          }}>
            <SkeletonItem width="40%" height="20px" marginBottom="12px" opacity={0.15} />
            <SkeletonItem width="100%" height="14px" />
            <SkeletonItem width="90%" height="14px" />
            <SkeletonItem width="95%" height="14px" />
            <SkeletonItem width="70%" height="14px" marginBottom="20px" />
            
            <SkeletonItem width="100%" height="14px" />
            <SkeletonItem width="85%" height="14px" />
            <SkeletonItem width="40%" height="14px" />

            <div style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px'
            }}>
              <Loader2 size={16} className="spin" color={color} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                {agent?.name ? `${agent.name} is writing...` : 'AI is thinking...'}
              </span>
            </div>
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
            {React.createElement(icon, { size: 32, style: { opacity: 0.3 } })}
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
                  {mediaType === 'audio' && mediaUrl && (
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
                        src={formatAudioSrc(mediaUrl)}
                        controls
                        style={{ flex: 1, height: '32px' }}
                        onPlay={(e) => {
                          // Stop all other audio and video elements to ensure only one plays
                          document.querySelectorAll('audio, video').forEach(el => {
                            if (el !== e.target) el.pause();
                          });
                        }}
                      />
                    </div>
                  )}
                  {mediaType === 'image' && mediaUrl && (
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={formatImageSrc(mediaUrl)}
                        alt="Generated"
                        style={{ 
                          width: '100%', 
                          maxHeight: '120px', 
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        onError={(e) => {
                          console.warn('[GeneratorCard] Image failed to load');
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120"%3E%3Crect fill="%231a1a2e" width="200" height="120"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="12" font-family="sans-serif"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      {/* Hover overlay - CSS only, no JS mouse events for mobile stability */}
                      <div className="image-hover-overlay" style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        borderRadius: '8px',
                        pointerEvents: 'none'
                      }}>
                        <Eye size={24} color="white" />
                      </div>
                    </div>
                  )}
                  {mediaType === 'video' && mediaUrl && (
                    <video 
                      src={formatVideoSrc(mediaUrl)}
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
            ) : isGeneratingMedia ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SkeletonItem height={mediaType === 'image' || mediaType === 'video' ? '120px' : '44px'} width="100%" opacity={0.2} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}>
                  <Loader2 size={14} className="spin" color={color} />
                  <span style={{ fontSize: '0.75rem', color, fontWeight: '600' }}>
                    {slot === 'lyrics' ? 'Cloning vocals...' : `Synthesizing ${mediaType}...`}
                  </span>
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
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px dashed ${color}50`,
                  color: color,
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {mediaType === 'audio' && <Music size={16} />}
                {mediaType === 'image' && <ImageIcon size={16} />}
                {mediaType === 'video' && <VideoIcon size={16} />}
                {slot === 'lyrics' ? 'Create AI Vocals' : 
                 slot === 'audio' ? 'Synthesize AI Beat' :
                 `Generate ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Action Bar */}
      {output && !isEditing && (
        <div style={{
          padding: isMobile ? '8px 10px 10px' : '12px 20px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          gap: isMobile ? '6px' : '8px',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1,
          touchAction: 'manipulation'
        }}>
          {/* TTS Button */}
          <button
            onClick={onSpeak}
            title={isSpeaking ? "Stop" : (slot === 'lyrics' && mediaUrl) ? "Play AI Vocals" : "Text to Speech"}
            style={{
              padding: isMobile ? '8px 10px' : '8px 12px',
              borderRadius: isMobile ? '8px' : '8px',
              background: isSpeaking ? `${color}30` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isSpeaking ? color : 'rgba(255,255,255,0.1)'}`,
              color: isSpeaking ? color : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '500',
              minHeight: isMobile ? '36px' : 'auto',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {!isMobile && (isSpeaking ? 'Stop' : (slot === 'lyrics' && mediaUrl) ? 'Hear Vocals' : 'TTS')}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            title="Copy to Clipboard"
            style={{
              padding: isMobile ? '8px 10px' : '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '500',
              minHeight: isMobile ? '36px' : 'auto',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Copy size={14} />
            {!isMobile && 'Copy'}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            title="Edit Output"
            style={{
              padding: isMobile ? '8px 10px' : '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '500',
              minHeight: isMobile ? '36px' : 'auto',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Edit3 size={14} />
            {!isMobile && 'Edit'}
          </button>

          {/* Preview Button - now next to Edit */}
          {(mediaUrl || (output && !mediaType)) && (
            <button
              onClick={() => setShowPreview(true)}
              title="Preview"
              style={{
                padding: isMobile ? '8px 10px' : '8px 12px',
                borderRadius: '8px',
                background: `${color}20`,
                border: `1px solid ${color}40`,
                color: color,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600',
                minHeight: isMobile ? '36px' : 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Eye size={14} />
              {!isMobile && 'Preview'}
            </button>
          )}

          {/* Regenerate Button */}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              title="Regenerate"
              style={{
                padding: isMobile ? '8px 10px' : '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '500',
                minHeight: isMobile ? '36px' : 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <RefreshCw size={14} />
              {!isMobile && 'Redo'}
            </button>
          )}

          {/* Spacer - hide on mobile to allow wrap */}
          {!isMobile && <div style={{ flex: 1 }} />}

          {/* Maximize Button */}
          {output && onMaximize && (
            <button
              onClick={onMaximize}
              title="Expand to Fullscreen"
              style={{
                padding: isMobile ? '8px 10px' : '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '500',
                minHeight: isMobile ? '36px' : 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Maximize2 size={14} />
            </button>
          )}

          {/* Download Button */}
          {(output || mediaUrl) && (
            <button
              onClick={onDownload}
              title="Download"
              style={{
                padding: isMobile ? '8px 10px' : '8px 12px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22c55e',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600',
                minHeight: isMobile ? '36px' : 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Download size={14} />
            </button>
          )}

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Delete"
              style={{
                padding: isMobile ? '8px 10px' : '8px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '500',
                minHeight: isMobile ? '36px' : 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      {/* Preview Modal */}
      <Suspense fallback={null}>
        <PreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          mediaUrl={mediaUrl}
          mediaType={mediaType || 'text'}
          title={title}
          textContent={!mediaType ? output : null}
        />
      </Suspense>

      <style>{`
        /* Desktop-only hover effects */
        @media (hover: hover) and (pointer: fine) {
          .generator-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          }
          .image-hover-overlay {
            transition: opacity 0.2s ease;
          }
          .generator-card:hover .image-hover-overlay {
            opacity: 1 !important;
          }
        }
        /* Mobile touch optimization */
        @media (hover: none) {
          .generator-card {
            transform: none !important;
          }
          .generator-card:active {
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL MIX SECTION - Pinned to bottom of orchestrator
// ═══════════════════════════════════════════════════════════════════════════════
function ProductionControlHub({
  outputs,
  mediaUrls,
  songIdea,
  finalMixPreview,
  creatingFinalMix,
  musicVideoUrl,
  generatingMusicVideo,
  handleGenerateProfessionalMusicVideo,
  handleCreateFinalMix,
  handleCreateProject,
  setShowPreviewModal,
  visualType,
  setVisualType,
  isMobile,
  orchestratorBpm = 120
}) {
  // Check completion status
  const completedCount = Object.values(outputs).filter(Boolean).length;
  const totalSlots = 4;
  const allComplete = completedCount === totalSlots;
  const hasAnyOutput = completedCount > 0;
  const progressPercent = (completedCount / totalSlots) * 100;
  
  // Media presence
  const hasBeat = !!mediaUrls.audio;
  const hasVocals = !!mediaUrls.vocals || !!outputs.lyrics;
  const hasVideo = !!mediaUrls.video;
  const hasVisual = !!mediaUrls.image;
  const isSyncAvailable = hasBeat && (hasVideo || hasVocals || hasVisual);
  const isSyncComplete = !!musicVideoUrl;

  return (
    <div style={{
      background: allComplete 
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))'
        : 'rgba(15, 23, 42, 0.4)',
      borderRadius: '24px',
      padding: isMobile ? '20px' : '28px',
      border: '1px solid rgba(255,255,255,0.1)',
      marginTop: '32px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: allComplete ? '0 10px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(79, 70, 229, 0.3)' : 'none',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Visual background indicator for completion */}
      {allComplete && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #4f46e5, #9333ea, #ec4899)',
          boxShadow: '0 0 15px rgba(79, 70, 229, 0.5)'
        }} />
      )}

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '24px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Readiness Section */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: allComplete ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: allComplete ? '#818cf8' : 'rgba(255,255,255,0.3)',
              border: `1px solid ${allComplete ? 'rgba(79, 70, 229, 0.4)' : 'rgba(255,255,255,0.1)'}`
            }}>
              {allComplete ? <Zap size={20} /> : <Settings size={20} />}
            </div>
            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: allComplete ? 'white' : 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {allComplete ? 'Production Complete' : 'Production Status'}
                {allComplete && <CheckCircle2 size={18} color="#22c55e" />}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                {allComplete 
                  ? 'All assets are master-ready' 
                  : `${completedCount}/${totalSlots} assets finalized • ${totalSlots - completedCount} remaining`}
              </p>
            </div>
          </div>

          {/* Asset Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['lyrics', 'audio', 'visual', 'video'].map(type => {
              const label = type.charAt(0).toUpperCase() + type.slice(1);
              const ready = !!outputs[type];
              const mediaReady = !!mediaUrls[type === 'lyrics' ? 'vocals' : type];
              return (
                <div key={type} style={{
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: ready ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                  color: ready ? '#4ade80' : 'rgba(255,255,255,0.2)',
                  border: `1px solid ${ready ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {ready ? '●' : '○'} {label}
                  {mediaReady && <span title="Media Created">💎</span>}
                </div>
              );
            })}
          </div>

          {/* DAW Timeline View (Billboard Production Timeline) */}
          <div style={{
            marginTop: '24px',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.5), rgba(30,30,40,0.5))',
            borderRadius: '16px',
            padding: '20px',
            border: '2px solid rgba(34, 211, 238, 0.3)',
            boxShadow: '0 8px 32px rgba(34, 211, 238, 0.1)',
            display: 'block' // ALWAYS visible - removed mobile hide
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#22d3ee', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🎚️ Production Timeline</span>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Billboard-Quality Multi-Track Sync</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '700', background: 'rgba(129, 140, 248, 0.1)', padding: '6px 12px', borderRadius: '8px' }}>{orchestratorBpm} BPM • STEREO</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'BEAT', type: 'audio', color: '#22d3ee' },
                { label: 'VOCALS', type: 'lyrics', color: '#a78bfa' },
                { label: 'VISUALS', type: 'visual', color: '#fb923c' },
                { label: 'IMG TO VIDEO', type: 'video', color: '#f87171' }
              ].map(track => (
                <div key={track.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '70px', 
                    fontSize: '0.65rem', 
                    fontWeight: '800', 
                    color: outputs[track.type] ? track.color : 'rgba(255,255,255,0.2)',
                    letterSpacing: '0.05em'
                  }}>
                    {track.label}
                  </div>
                  <div style={{ 
                    flex: 1, 
                    height: '24px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '4px', 
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {outputs[track.type] && (
                      <div style={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: 0, 
                        bottom: 0, 
                        width: mediaUrls[track.type === 'lyrics' ? 'vocals' : (track.type === 'visual' ? 'image' : track.type)] ? '100%' : '30%',
                        background: `linear-gradient(90deg, ${track.color}40, ${track.color}80)`,
                        borderRight: `2px solid ${track.color}`,
                        transition: 'width 1s ease-in-out'
                      }}>
                        {/* Waveform deco for audio tracks */}
                        {(track.type === 'audio' || track.type === 'lyrics') && (
                           <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '100%', paddingLeft: '8px', opacity: 0.5 }}>
                              {[...Array(20)].map((_, i) => (
                                <div key={i} style={{ width: '2px', height: `${Math.random() * 80}%`, background: track.color, borderRadius: '2px' }} />
                              ))}
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: outputs[track.type] ? '#22c55e' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {outputs[track.type] && <CheckCircle2 size={10} color="white" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px',
          alignItems: 'stretch'
        }}>
          {/* Audio/Video Sync - Most important sync feature */}
          {isSyncAvailable && !isSyncComplete && (
            <button
              onClick={handleGenerateProfessionalMusicVideo}
              disabled={generatingMusicVideo}
              style={{
                padding: '14px 24px',
                borderRadius: '16px',
                background: 'rgba(236, 72, 153, 0.1)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                color: '#f472b6',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: generatingMusicVideo ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {generatingMusicVideo ? (
                <RefreshCw size={18} className="spin" />
              ) : musicVideoUrl ? (
                <Zap size={18} fill="#22c55e" />
              ) : (
                <VideoIcon size={18} />
              )}
              {generatingMusicVideo ? 'Syncing...' : musicVideoUrl ? 'Image to Video Sync ✓' : 'Image to Video Sync'}
            </button>
          )}

          {/* Primary Action Button (Unified) */}
          <button
            onClick={() => {
              if (allComplete) {
                setShowPreviewModal(true);
              } else {
                toast.info('Finish all generators to enable Master Preview');
              }
            }}
            style={{
              padding: '14px 32px',
              borderRadius: '16px',
              background: allComplete 
                ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' 
                : 'rgba(255,255,255,0.05)',
              border: allComplete ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: allComplete ? 'white' : 'rgba(255,255,255,0.3)',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: allComplete ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: allComplete ? '0 8px 25px rgba(79, 70, 229, 0.4)' : 'none',
              transition: 'all 0.3s ease',
              minWidth: isMobile ? '100%' : '220px'
            }}
          >
            {allComplete ? (
              <>
                <Eye size={20} />
                Master & Preview Mix
              </>
            ) : (
              <>
                <LockIcon size={18} />
                Master Preview Locked
              </>
            )}
          </button>

          {/* Quick Publish (Save) Action */}
          {hasAnyOutput && (
            <button
              onClick={handleCreateProject}
              style={{
                padding: '14px 24px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: allComplete ? 1 : 0.7
              }}
            >
              <FolderPlus size={18} />
              {!isMobile && 'Publish to Hub'}
            </button>
          )}
        </div>
      </div>

      {/* Mini Progress Bar in footer */}
      {!allComplete && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255,255,255,0.05)'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function StudioOrchestratorV2({ 
  isOpen, 
  onClose, 
  onCreateProject,
  onSaveToProject,
  authToken = null,
  existingProject = null,
  userPlan = 'Free'
}) {
  // 📱 Device responsiveness
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════
  const [songIdea, setSongIdea] = useState(existingProject?.name || '');
  const [language, setLanguage] = useState(existingProject?.language || 'English');
  const [style, setStyle] = useState(existingProject?.style || 'Modern Hip-Hop');
  const [duration, setDuration] = useState(existingProject?.duration || 90);
  const [bars, setBars] = useState(existingProject?.musicalBars || 16); // musical bars
  const [useBars, setUseBars] = useState(existingProject?.useBars ?? true); // Toggle for bar-based timing
  const [model, setModel] = useState(existingProject?.model || 'Gemini 2.0 Flash');
  const [musicEngine, setMusicEngine] = useState(existingProject?.musicEngine || 'music-gpt'); // Default to Beat Lab (MusicGen)
  const [mood, setMood] = useState(existingProject?.mood || 'Energetic'); // Beatoven-inspired
  const [structure, setStructure] = useState(existingProject?.structure || 'Full Song'); // Structure control

  const [highMusicality, setHighMusicality] = useState(true); // Udio-style musicality
  const [seed, setSeed] = useState(-1); // Riffusion/Suno-style seed (-1 for random)
  const [stemType, setStemType] = useState('Full Mix'); // Stem/Instrument isolation
  const [projectBpm, setProjectBpm] = useState(existingProject?.bpm || existingProject?.settings?.bpm || 120); // Tempo for production
  
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
    video: null,
    vocals: null,
    lyricsVocal: null // Unified key for lyrics+vocal
  });
  
  const [generatingMedia, setGeneratingMedia] = useState({
    audio: false,
    image: false,
    video: false,
    vocals: false
  });
  
  const [speakingSlot, setSpeakingSlot] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState('rapper'); // For AI vocal generation (rapper, singer, etc)
  const [vocalQuality, setVocalQuality] = useState('premium'); // 'standard' or 'premium'
  const [outputFormat, setOutputFormat] = useState('music'); // music, social, podcast, tv (Righteous Quality)
  const [rapStyle, setRapStyle] = useState('aggressive'); // Rap delivery style
  const [genre, setGenre] = useState('hip-hop'); // Music genre for vocals
  const [generatingVocal, setGeneratingVocal] = useState(false);
  const [maximizedSlot, setMaximizedSlot] = useState(null); // Track which card is maximized
  const [creatingFinalMix, setCreatingFinalMix] = useState(false);
  const [finalMixPreview, setFinalMixPreview] = useState(null);
  const [generatingMusicVideo, setGeneratingMusicVideo] = useState(false);
  const [musicVideoUrl, setMusicVideoUrl] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false); // Preview all creations before final mix
  const [previewMaximized, setPreviewMaximized] = useState(false); // Min/max view toggle for preview
  const [showSaveConfirm, setShowSaveConfirm] = useState(false); // Save confirmation dialog
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false); // Exit confirmation for unsaved work
  const [isSaved, setIsSaved] = useState(false); // Track if current work has been saved
  const [visualType, setVisualType] = useState('image'); // 'image' or 'video' for final mix output
  const [voiceSampleUrl, setVoiceSampleUrl] = useState(null); // URL of uploaded voice sample for cloning
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(localStorage.getItem('studio_elevenlabs_voice_id') || '');
  const [isUploadingSample, setIsUploadingSample] = useState(false);
  const [savedVoices, setSavedVoices] = useState([]); // List of voices saved in Firestore
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [elVoices, setElVoices] = useState([]); // ElevenLabs professional voices
  const [loadingElVoices, setLoadingElVoices] = useState(false);

  // New DNA States for other agents
  const [visualDnaUrl, setVisualDnaUrl] = useState(null);
  const [audioDnaUrl, setAudioDnaUrl] = useState(null);
  const [videoDnaUrl, setVideoDnaUrl] = useState(null); // Image used for image-to-video
  const [lyricsDnaUrl, setLyricsDnaUrl] = useState(null); // Text file or PDF as reference
  const [dnaArtifacts, setDnaArtifacts] = useState([]); // List of all stored DNA artifacts
  const [referencedAudioId, setReferencedAudioId] = useState('');
  const [referencedVisualId, setReferencedVisualId] = useState('');
  const [isUploadingDna, setIsUploadingDna] = useState({ visual: false, audio: false, video: false, lyrics: false });
  const [showDnaVault, setShowDnaVault] = useState(false);
  
  // Industrial Strength State Preservation (Fixes closure issues in auto-triggering)
  const outputsRef = useRef(outputs);
  const recognitionRef = useRef(null);
  const vocalAudioRef = useRef(null);

  // Safe getters for outputs and mediaUrls to prevent TDZ/null errors
  const safeOutputs = outputs || { lyrics: null, audio: null, visual: null, video: null };
  const safeMediaUrls = mediaUrls || { audio: null, image: null, video: null };

  // ═══════════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    outputsRef.current = outputs;
  }, [outputs]);

  // Fetch saved voices from Firestore
  useEffect(() => {
    const fetchSavedVoices = async () => {
      if (!auth.currentUser) return;
      setLoadingVoices(true);
      try {
        const q = query(
          collection(db, 'users', auth.currentUser?.uid, 'voices')
        );
        const querySnapshot = await getDocs(q);
        const voices = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSavedVoices(voices);
      } catch (err) {
        console.error('[Orchestrator] Error fetching saved voices:', err);
      } finally {
        setLoadingVoices(false);
      }
    };

    if (isOpen) {
      fetchSavedVoices();
    }
  }, [isOpen]);

  // Fetch ElevenLabs voices
  useEffect(() => {
    const fetchElVoices = async () => {
      setLoadingElVoices(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/v2/voices`);
        if (response.ok) {
          const voices = await response.json();
          setElVoices(voices);
        }
      } catch (err) {
        console.error('[Orchestrator] Error fetching ElevenLabs voices:', err);
      } finally {
        setLoadingElVoices(false);
      }
    };

    if (isOpen) {
      fetchElVoices();
    }
  }, [isOpen]);

  // Load User DNA / Inspiration files for persistence
  useEffect(() => {
    const fetchUserDna = async () => {
      if (!auth.currentUser || !isOpen) return;
      try {
        const userRef = doc(db, 'users', auth.currentUser?.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.visualDnaUrl) setVisualDnaUrl(userData.visualDnaUrl);
          if (userData.audioDnaUrl) setAudioDnaUrl(userData.audioDnaUrl);
          if (userData.videoDnaUrl) setVideoDnaUrl(userData.videoDnaUrl);
          if (userData.lyricsDnaUrl) setLyricsDnaUrl(userData.lyricsDnaUrl);
          if (userData.voiceSampleUrl) setVoiceSampleUrl(userData.voiceSampleUrl);
          if (userData.dnaArtifacts) setDnaArtifacts(userData.dnaArtifacts);
          console.log('[Orchestrator] User DNA profile loaded');
        }
      } catch (err) {
        console.warn('[Orchestrator] Failed to fetch user DNA:', err);
      }
    };

    fetchUserDna();
  }, [isOpen]);

  // Lock body scroll when orchestrator is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Calculate duration from bars and BPM
  useEffect(() => {
    if (useBars) {
      // 4 beats per bar, 60 seconds per minute
      const calculatedDuration = Math.round((bars * 4 * 60) / projectBpm);
      setDuration(calculatedDuration);
    }
  }, [bars, projectBpm, useBars]);

  // Sync structure with bars if needed, or vice-versa
  useEffect(() => {
    if (!useBars) {
      if (structure === 'Full Song') setDuration(90);
      else if (structure === 'Radio Edit') setDuration(150);
      else if (structure === 'Extended') setDuration(180);
      else if (structure === 'Loop') setDuration(30);
      else setDuration(15); 
    }
  }, [structure, useBars]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  // Check if there's any generated content that hasn't been saved
  const hasUnsavedContent = () => {
    const hasContent = Object.values(safeOutputs).some(Boolean) || Object.values(safeMediaUrls).some(Boolean);
    return hasContent && !isSaved;
  };
  
  // Handle close with unsaved work check
  const handleCloseWithCheck = () => {
    if (hasUnsavedContent()) {
      setShowExitConfirm(true);
    } else {
      onClose?.();
    }
  };
  
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
      title: 'Ghostwriter', 
      subtitle: 'Lyrics & Hook', 
      icon: Sparkles, 
      color: '#8b5cf6',
      mediaType: 'audio' 
    },
    { 
      key: 'audio', 
      title: 'Beat Lab', 
      subtitle: 'Music Production', 
      icon: Zap, 
      color: '#06b6d4',
      mediaType: 'audio' 
    },
    { 
      key: 'visual', 
      title: 'Album Artist', 
      subtitle: 'Cover Identity', 
      icon: ImageIcon, 
      color: '#ec4899',
      mediaType: 'image' 
    },
    { 
      key: 'video', 
      title: 'Video Creator', 
      subtitle: 'Motion & Sync', 
      icon: VideoIcon, 
      color: '#f59e0b',
      mediaType: 'video' 
    }
  ];

  // Speech-to-Text
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechReg = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechReg || typeof SpeechReg !== 'function') {
        toast.error('Voice recognition not supported');
        return;
      }
      
      try {
        recognitionRef.current = new SpeechReg();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          setSongIdea(transcript);
        };
        
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = (err) => {
          console.error('[Speech] Error:', err);
          setIsListening(false);
        };
        
        recognitionRef.current.start();
        setIsListening(true);
        toast.success('Listening...');
      } catch (err) {
        console.error('[Speech] Constructor error:', err);
        toast.error('Voice input failed');
      }
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

  // Text-to-Speech (Browser TTS with voice style adjustments)
  const speakText = (text, slot) => {
    // 🛡️ Ensure we only speak lyrics, not the AI preamble
    let textToSpeak = text;
    if (slot === 'lyrics' || slot === 'content') {
      const { content: cleanLyrics } = splitCreativeContent(text);
      if (cleanLyrics) textToSpeak = cleanLyrics;
    }

    if (speakingSlot === slot) {
      window.speechSynthesis.cancel();
      if (vocalAudioRef.current) {
        vocalAudioRef.current.pause();
        vocalAudioRef.current.currentTime = 0;
      }
      setSpeakingSlot(null);
      return;
    }
    
    // Check if we have AI vocals generated for this slot
    if (slot === 'lyrics' && mediaUrls.vocals) {
      try {
        if (vocalAudioRef.current) {
          vocalAudioRef.current.pause();
        }
        window.speechSynthesis.cancel();
        
        // Safe creation of Audio element
        const vocalAudio = document.createElement('audio');
        vocalAudio.src = formatAudioSrc(mediaUrls.vocals);
        vocalAudioRef.current = vocalAudio;
        vocalAudio.play().catch(err => {
          console.error("Audio playback failed:", err);
          // Fallback to TTS if audio fails
          speakRoboticText(textToSpeak, slot);
        });
        vocalAudio.onended = () => setSpeakingSlot(null);
        setSpeakingSlot(slot);
        return;
      } catch (err) {
        console.error("Vocal playback error:", err);
      }
    }
    
    speakRoboticText(textToSpeak, slot);
  };

  // Original TTS as fallback
  const speakRoboticText = (text, slot) => {
    try {
      window.speechSynthesis.cancel();
      
      if (typeof SpeechSynthesisUtterance === 'undefined') {
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get available voices and try to match style
      const voices = window.speechSynthesis.getVoices();
      
      // Adjust pitch and rate based on voice style
      if (voiceStyle === 'rapper' || voiceStyle === 'rapper-female') {
        utterance.rate = rapStyle === 'fast' ? 1.3 : rapStyle === 'chill' ? 0.85 : 1.0;
        utterance.pitch = voiceStyle === 'rapper-female' ? 1.2 : 0.9;
        // Try to find a matching voice
        const preferredVoice = voices.find(v => 
          voiceStyle === 'rapper-female' 
            ? (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha'))
            : (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('alex'))
        );
        if (preferredVoice) utterance.voice = preferredVoice;
      } else if (voiceStyle === 'singer' || voiceStyle === 'singer-female') {
        utterance.rate = 0.85;
        utterance.pitch = voiceStyle === 'singer-female' ? 1.3 : 1.0;
        const preferredVoice = voices.find(v => 
          voiceStyle === 'singer-female'
            ? (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'))
            : (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david'))
        );
        if (preferredVoice) utterance.voice = preferredVoice;
      } else if (voiceStyle === 'narrator') {
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        const preferredVoice = voices.find(v => v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('male'));
        if (preferredVoice) utterance.voice = preferredVoice;
      } else {
        utterance.rate = 0.9;
      }
      
      utterance.onend = () => setSpeakingSlot(null);
      utterance.onerror = () => setSpeakingSlot(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingSlot(slot);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setSpeakingSlot(null);
    }
  };

  // Get auth headers - wrapped in useCallback to avoid stale closure on authToken prop
  const getHeaders = useCallback(async () => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  }, [authToken]);

  // Main generation function
  const handleGenerate = async () => {
    // PREVENT DUPLICATE CALLS
    if (isGenerating) return;

    console.log('[handleGenerate] Button clicked, songIdea:', songIdea);
    console.log('[handleGenerate] selectedAgents:', selectedAgents);
    console.log('[handleGenerate] BACKEND_URL:', BACKEND_URL);
    
    if (!songIdea.trim()) {
      toast.error('Please enter a song idea');
      return;
    }
    
    const activeSlots = Object.entries(selectedAgents).filter(([, v]) => v);
    console.log('[handleGenerate] activeSlots:', activeSlots);
    
    if (activeSlots.length === 0) {
      toast.error('Please select at least one agent');
      return;
    }
    
    setIsGenerating(true);
    toast.loading('Generating content...', { id: 'gen-all' });
    
    try {
      const headers = await getHeaders();
      console.log('[handleGenerate] headers:', headers);
      
      const modelId = model === 'Gemini 2.0 Flash' ? 'gemini-2.0-flash' : 
                    model === 'Gemini 2.0 Pro (Exp)' ? 'gemini-2.0-flash-exp' : 
                    model === 'Gemini 1.5 Pro' ? 'gemini-1.5-pro' : 'gemini-2.0-flash';

      // Helper to generate a single slot (used for sequencing or parallel)
      const generateForSlot = async (slot, agentId, contextLyrics = '') => {
        const agent = AGENTS.find(a => a.id === agentId);
        if (!agent) return null;
        
        const slotConfig = GENERATOR_SLOTS.find(s => s.key === slot);
        
        const systemPrompt = `You are ${agent.name}, an elite Billboard-standard ${agent.category} specialist. 
        Your mission is to create a track that will dominate the Top 100 charts. 
        Create righteous quality content for a ${style} song about: "${songIdea}" in ${language}.
        The focus is on professional excellence that exceeds human artist capabilities.
        Output Format: ${outputFormat || 'music'} (Ensure the style matches ${outputFormat}).
        ${contextLyrics ? `HERE ARE THE LYRICS FOR THE SONG - USE THEM TO INSPIRE THE VIBE: "${String(contextLyrics).substring(0, 1000)}"` : ''}
        ${slot === 'lyrics' ? 'Write ONLY the lyrics (verses, hooks, chorus) with clear labels like [Verse 1], [Chorus], [Bridge]. Use high-impact, chart-topping wordplay. ALSO INCLUDE precise Suno-style vocal/style tags in brackets like [Hard Hitting Rap] or [Soulful Vocals] to guide the performance. Do not include any intro/preamble.' : ''}
        ${slot === 'audio' ? `Briefly describe a high-fidelity Billboard-ready beat/instrumental concept (${useBars ? bars + ' bars' : duration + ' seconds'}) with BPM: ${projectBpm}. Use evocative genre descriptors. Your goal is a sonic masterpiece. Keep it under 60 words for maximum AI compatibility.` : ''}
        ${slot === 'visual' ? 'Describe a striking, iconic album cover identity in detail for high-resolution image generation.' : ''}
        ${slot === 'video' ? 'Write a cinematic storyboard with precise scene descriptions for a professional music video or motion visual.' : ''}`;
        
        console.log(`[handleGenerate] Starting generation for ${slot} with agent:`, agent.name);
        
        try {
          const response = await fetch(`${BACKEND_URL}/api/generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              prompt: `Create ${slotConfig.title.toLowerCase()} content for: "${songIdea}"`,
              systemInstruction: systemPrompt,
              model: modelId,
              duration: duration,
              language: language,
              referenceUrl: slot === 'lyrics' ? lyricsDnaUrl : 
                            slot === 'audio' ? audioDnaUrl :
                            slot === 'visual' ? visualDnaUrl :
                            slot === 'video' ? videoDnaUrl : null
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            setOutputs(prev => {
              const NEW_OUTPUTS = { ...prev, [slot]: data.output };
              outputsRef.current = NEW_OUTPUTS;
              return NEW_OUTPUTS;
            });
            console.log(`[handleGenerate] ${slot} generated successfully`);
            
            // Auto-triggering of media generators
            if (slot === 'audio') {
              setTimeout(() => handleGenerateAudio(data.output), 500);
            } else if (slot === 'lyrics') {
              setTimeout(() => handleGenerateVocals(data.output), 800);
            } else if (slot === 'visual') {
              setTimeout(() => handleGenerateImage(data.output), 1100);
            } else if (slot === 'video') {
              setTimeout(() => handleGenerateVideo(data.output), 1400);
            }
            return data.output;
          } else {
            const errorText = await response.text();
            console.error(`[handleGenerate] ${slot} failed:`, response.status, errorText);
            toast.error(`Agent ${agent.name} failed: ${response.status}`, { icon: '❌' });
            return null;
          }
        } catch (err) {
          console.error(`Error generating ${slot}:`, err);
          toast.error(`Connection Error: ${slot} generation failed.`, { icon: '📡' });
          return null;
        }
      };

      // RUN SEQUENTIALLY: Lyrics first to provide context for other agents
      const lyricsSlot = activeSlots.find(([s]) => s === 'lyrics');
      let lyricsResult = '';
      
      if (lyricsSlot) {
        lyricsResult = await generateForSlot(lyricsSlot[0], lyricsSlot[1]);
      } else if (existingProject?.assets) {
        // Look for existing lyrics in the project to provide context for other agents
        const lyricsAsset = existingProject.assets.find(a => 
          a.type === 'lyrics' || 
          a.id?.includes('lyrics') || 
          a.agent?.toLowerCase().includes('ghost')
        );
        if (lyricsAsset) {
          lyricsResult = lyricsAsset.content || lyricsAsset.snippet || '';
          console.log('[Orchestrator] Found existing project lyrics for context');
        }
      }
      
      // All other slots run in parallel using the (optional) lyrics context
      const otherSlots = activeSlots.filter(([s]) => s !== 'lyrics');
      await Promise.all(otherSlots.map(([slot, agentId]) => generateForSlot(slot, agentId, lyricsResult)));
      
      toast.dismiss('gen-all');
      toast.success('Generation complete!');
      
    } catch (err) {
      console.error('Generation error:', err);
      toast.error(
        <div>
          <strong>Generation failed</strong>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>
            {err.message || 'Check your connection and try again'}
          </p>
        </div>,
        { duration: 5000 }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate single slot
  const handleRegenerate = async (slot) => {
    // PREVENT DUPLICATE CALLS
    if (isGenerating) return;

    if (!selectedAgents[slot]) return;
    
    const agent = AGENTS.find(a => a.id === selectedAgents[slot]);
    if (!agent) return;
    
    setIsGenerating(true);
    setOutputs(prev => ({ ...prev, [slot]: null }));
    
    try {
      const headers = await getHeaders();
      const slotConfig = GENERATOR_SLOTS.find(s => s.key === slot);
      
      const modelId = model === 'Gemini 2.0 Flash' ? 'gemini-2.0-flash' : 
                     model === 'Gemini 2.0 Pro (Exp)' ? 'gemini-2.0-flash-exp' : 
                     model === 'Gemini 1.5 Pro' ? 'gemini-1.5-pro' : 'gemini-2.0-flash';

      const response = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `Create fresh ${slotConfig.title.toLowerCase()} content for: "${songIdea}"`,
          systemInstruction: `You are ${agent.name}. Create NEW and DIFFERENT content for a ${style} song about: "${songIdea}". Be creative and fresh.
          ${(slot !== 'lyrics' && outputs.lyrics) ? `HERE ARE THE CURRENT LYRICS - USE THEM FOR CONTEXT: "${outputs.lyrics.substring(0, 500)}"` : ''}
          ${slot === 'lyrics' ? 'Write ONLY the lyrics (verses, hooks, chorus) with clear labels like [Verse] or [Chorus]. No intro fluff.' : ''}
          ${slot === 'audio' ? `Briefly describe a high-quality beat/instrumental concept (${useBars ? bars + ' bars' : duration + ' seconds'}) with BPM: ${projectBpm}. Focus on mood, instrumentation, and energy. Keep it under 80 words for an AI music generator.` : ''}`,
          model: modelId,
          duration: duration,
          language: language
        })
      });
      
      let data;
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error(`Invalid server response (${response.status})`);
      }

      if (response.ok) {
        setOutputs(prev => ({ ...prev, [slot]: data.output }));
        toast.success(`${slotConfig.title} regenerated!`);
      } else {
        toast.error(data.error || `Failed to regenerate ${slotConfig.title}`);
      }
    } catch {
      toast.error('Regeneration failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Media generation functions
  const handleGenerateAudio = async (directInput = null) => {
    // PREVENT DUPLICATE CALLS
    if (generatingMedia.audio) {
      console.warn('[handleGenerateAudio] Already generating audio, skipping');
      return;
    }

    // Use directInput (only if string), outputsRef, or current outputs (fallback)
    const audioPrompt = (typeof directInput === 'string' ? directInput : null) || outputsRef.current.audio || outputs.audio;

    console.log('[handleGenerateAudio] Starting generation:', { 
      hasDirectInput: !!directInput, 
      promptLength: audioPrompt?.length || 0,
      engine: musicEngine
    });

    if (!audioPrompt) {
      console.error('[handleGenerateAudio] No audio prompt found');
      toast.error('Generate Beat DNA first');
      return;
    }
    
    setGeneratingMedia(prev => ({ ...prev, audio: true }));
    const waitTime = duration > 120 ? '3 minutes' : (duration > 60 ? '2 minutes' : '60 seconds');
    toast.loading(`Synthesizing AI beat (${waitTime})...`, { id: 'gen-audio' });
    
    try {
      const headers = await getHeaders();

      // Clean prompt of AI fluff
      const { content: cleanAudioPrompt } = splitCreativeContent(audioPrompt);
      const cleanAudioPromptText = cleanAudioPrompt || audioPrompt;
      
      console.log('[handleGenerateAudio] Making API call to:', `${BACKEND_URL}/api/generate-audio`);

      // DNA reference audio (using audioDnaUrl from state)
      const activeReferencedAudio = null; // TODO: Implement asset lookup if needed

      const response = await fetch(`${BACKEND_URL}/api/generate-audio`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          // Simplified prompt: Backend already wraps with genre/mood/BPM/quality tags
          // Sending the raw description from the agent is more effective
          prompt: typeof cleanAudioPromptText === 'string' ? cleanAudioPromptText.substring(0, 1000) : 'Professional music production',
          genre: style || 'hip-hop',
          mood: mood.toLowerCase() || 'energetic',
          bpm: parseInt(projectBpm) || 90,
          durationSeconds: parseInt(duration) || (structure === 'Full Song' ? 90 : 
                          structure === 'Radio Edit' ? 150 :
                          structure === 'Extended' ? 180 :
                          structure === 'Loop' ? 15 : 30),
          referenceAudio: activeReferencedAudio?.audioUrl || audioDnaUrl,
          engine: musicEngine || 'music-gpt',
          quality: 'premium', // Ensure high-fidelity selection in backend
          outputFormat: outputFormat, // music, social, podcast, tv
          highMusicality: highMusicality, // Send Udio-style musicality flag
          seed: seed,
          stem: stemType
        })
      });
      
      console.log('[handleGenerateAudio] Response status:', response.status);
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('[handleGenerateAudio] Non-JSON response:', text);
        throw new Error(`Invalid audio response (${response.status})`);
      }

      if (response.ok) {
        console.log('[Orchestrator] Audio generation response success:', { 
          hasUrl: !!(data.audioUrl || data.output), 
          isReal: data.isRealGeneration,
          source: data.source 
        });
        
        const finalUrl = data.audioUrl || data.output;
        if (finalUrl) {
          setMediaUrls(prev => ({ ...prev, audio: finalUrl }));
          
          // Ensure outputs.audio is set so the asset is included in the project save
          setOutputs(prev => ({ 
            ...prev, 
            audio: prev.audio || `Professional ${style} beat generated at ${projectBpm} BPM`
          }));

          // AUTO-SYNC TO EXISTING PROJECT: Add the audio asset to the project library immediately
          if (existingProject && (onSaveToProject || onCreateProject)) {
            const saveFunc = onSaveToProject || onCreateProject;
            
            // Count existing versions
            const audioVersions = (existingProject.assets || []).filter(a => a.type === 'audio').length;
            const versionLabel = audioVersions > 0 ? ` (Take ${audioVersions + 1})` : '';

            console.log(`[handleGenerateAudio] Auto-syncing audio to project: ${existingProject.id} as version ${audioVersions + 1}`);
            
            const audioAsset = {
              id: `audio-${Date.now()}`,
              title: `Beat Lab Production${versionLabel}`,
              type: 'audio',
              agent: 'Beat Lab',
              content: cleanAudioPromptText.substring(0, 500),
              audioUrl: finalUrl,
              mimeType: data.mimeType || 'audio/mpeg',
              version: audioVersions + 1,
              settings: {
                genre: style,
                mood: mood,
                bpm: projectBpm,
                engine: musicEngine,
                referencedAudioId: activeReferencedAudio?.id
              },
              createdAt: new Date().toISOString()
            };
            
            saveFunc({
              ...existingProject,
              assets: [audioAsset, ...(existingProject.assets || [])],
              updatedAt: new Date().toISOString()
            });
          }

          toast.success('AI beat generated!', { id: 'gen-audio' });
        } else {
          console.error('[handleGenerateAudio] No URL in successful response:', data);
          toast.error('No audio returned from server', { id: 'gen-audio' });
        }
      } else {
        // Use already-parsed data
        const errData = data || {};
        console.error('[Orchestrator] Audio generation failed:', errData);
        
        // DISTINGUISH BETWEEN USER AND SYSTEM CREDIT ISSUES
        if (errData.isSystemCreditIssue || response.status === 503) {
          toast.error(
            <div style={{ padding: '4px' }}>
              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={14} color="#fbbf24" fill="#fbbf24" />
                System Maintenance
              </div>
              <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                The AI engine is currently being refilled with credits. Your personal balance was not affected.
              </p>
            </div>, 
            { id: 'gen-audio', duration: 8000, style: { borderLeft: '4px solid #fbbf24' } }
          );
        } else if (errData.isUserCreditIssue || response.status === 403) {
          toast.error(
            <div style={{ padding: '4px' }}>
              <div style={{ fontWeight: 'bold' }}>Insufficient Credits</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                You have run out of generation credits. Please buy more to continue creating.
              </p>
            </div>, 
            { id: 'gen-audio', duration: 6000 }
          );
        } else {
          toast.error(errData.details || errData.error || `Audio generation failed (${response.status})`, { id: 'gen-audio' });
        }
      }
    } catch (err) {
      console.error('[Orchestrator] Audio generation catch block:', err);
      toast.error(`Generation failed: ${err.message}`, { id: 'gen-audio' });
    } finally {
      setGeneratingMedia(prev => ({ ...prev, audio: false }));
    }
  };

  const handleGenerateVocals = async (directInput = null) => {
    // PREVENT DUPLICATE CALLS
    if (generatingMedia.vocals) return;

    // Use directInput (only if string), outputsRef, or current outputs (fallback)
    const lyricsText = (typeof directInput === 'string' ? directInput : null) || outputsRef.current.lyrics || outputs.lyrics;

    console.log('[handleGenerateVocals] Called, hasLyrics:', !!lyricsText);
    if (!lyricsText) {
      toast.error('Generate Lyrics & Hook DNA first');
      return;
    }
    setGeneratingVocal(true);
    setGeneratingMedia(prev => ({ ...prev, vocals: true }));
    toast.loading('Generating AI Vocals (up to 2 mins)...', { id: 'gen-vocals' });
    
    try {
      const headers = await getHeaders();

      // Ensure we only send the actual lyrics content, not the intro/prompt fluff
      const { content: lyricsOnly } = splitCreativeContent(lyricsText);
      const cleanLyrics = lyricsOnly || lyricsText;

      // Use the same voice mapping as handleGenerateLyricsVocal
      const voiceMapping = {
        'rapper': 'rapper-male-1',
        'rapper-female': 'rapper-female-1',
        'singer': 'singer-male',
        'singer-female': 'singer-female',
        'narrator': 'narrator',
        'whisper': 'whisper',
        'spoken': 'spoken'
      };
      
      const selectedVoice = voiceMapping[voiceStyle] || 'rapper-male-1';

      // DNA reference audio (using voiceSampleUrl from state)
      const activeReferencedAudio = null; // TODO: Implement asset lookup if needed

      const response = await fetch(`${BACKEND_URL}/api/generate-speech`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: cleanLyrics.substring(0, 1500), 
          voice: selectedVoice,
          style: voiceStyle,
          rapStyle: rapStyle,
          genre: genre,
          language: language || 'English',
          duration: duration || 30,
          quality: vocalQuality, // Pass 'premium' for ElevenLabs priority
          outputFormat: outputFormat, // TV, Podcast, Social, Music (Righteous Quality)
          speakerUrl: voiceStyle === 'cloned' ? voiceSampleUrl : (activeReferencedAudio?.audioUrl || null),
          elevenLabsVoiceId: (vocalQuality === 'premium' || voiceStyle === 'cloned') ? elevenLabsVoiceId : null,
          backingTrackUrl: mediaUrls.audio 
        })
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error(`Invalid vocal response (${response.status})`);
      }

      if (response.ok && data.audioUrl) {
        setMediaUrls(prev => ({ 
          ...prev, 
          vocals: data.audioUrl,
          lyricsVocal: data.audioUrl 
        }));
        // Ensure outputs.vocals is set so the asset is included in the project save
        setOutputs(prev => ({ 
          ...prev, 
          vocals: prev.vocals || `AI Vocal Performance generated for "${songIdea || 'song'}"`
        }));

        // AUTO-SYNC TO EXISTING PROJECT: Add the vocal asset to the project library immediately
        if (existingProject && (onSaveToProject || onCreateProject)) {
          const saveFunc = onSaveToProject || onCreateProject;
          
          // Count existing versions to label this one
          const vocalVersions = (existingProject.assets || []).filter(a => a.type === 'vocal').length;
          const versionLabel = vocalVersions > 0 ? ` (Take ${vocalVersions + 1})` : '';

          console.log(`[handleGenerateVocals] Auto-syncing vocals to project: ${existingProject.id} as version ${vocalVersions + 1}`);
          
          const vocalAsset = {
            id: `vocal-${Date.now()}`,
            title: `Vocal Performance${versionLabel}`,
            type: 'vocal',
            agent: 'Ghostwriter',
            content: cleanLyrics.substring(0, 500),
            audioUrl: data.audioUrl,
            mimeType: data.mimeType || 'audio/wav',
            version: vocalVersions + 1,
            settings: {
              voice: selectedVoice,
              style: voiceStyle,
              quality: vocalQuality,
              referencedAudioId: activeReferencedAudio?.id
            },
            createdAt: new Date().toISOString()
          };
          
          saveFunc({
            ...existingProject,
            assets: [vocalAsset, ...(existingProject.assets || [])],
            updatedAt: new Date().toISOString()
          });
        }

        toast.success('AI Vocals generated!', { id: 'gen-vocals' });
      } else {
        const errData = data || {};
        toast.error(errData.details || errData.error || 'Vocal generation failed', { id: 'gen-vocals' });
      }
    } catch (err) {
      console.error('[Orchestrator] Vocal generation error:', err);
      toast.error('Vocal generation failed', { id: 'gen-vocals' });
    } finally {
      setGeneratingVocal(false);
      setGeneratingMedia(prev => ({ ...prev, vocals: false }));
    }
  };

  const handleUploadVoiceSample = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }

    setIsUploadingSample(true);
    toast.loading('Uploading voice sample...', { id: 'voice-upload' });

    try {
      const headers = await getHeaders();
      
      // Convert file to base64 for /api/upload-asset
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          
          const response = await fetch(`${BACKEND_URL}/api/upload-asset`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              data: base64Data,
              fileName: `voice-sample-${Date.now()}-${file.name.replace(/\s+/g, '-')}`,
              mimeType: file.type || 'audio/wav',
              assetType: 'audio'
            })
          });

          const result = await response.json();
          if (response.ok && result.url) {
            setVoiceSampleUrl(result.url);
            setVoiceStyle('cloned'); // Automatically switch to cloned mode
            toast.success('Voice sample uploaded! Model set to "Cloned Voice"', { id: 'voice-upload' });
            
            // Industrial Strength Persistence: Save to User Profile
            if (auth.currentUser) {
              try {
                // Primary Voice Field
                const userRef = doc(db, 'users', auth.currentUser?.uid);
                await updateDoc(userRef, {
                  voiceSampleUrl: result.url,
                  lastVoiceUpdate: Date.now()
                });

                // Archive to Voices Sub-collection
                const voiceData = {
                  url: result.url,
                  name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                  createdAt: serverTimestamp(),
                  type: 'cloned'
                };
                const docRef = await addDoc(collection(db, 'users', auth.currentUser?.uid, 'voices'), voiceData);
                setSavedVoices(prev => [{ id: docRef.id, ...voiceData }, ...prev]);
                toast.success('Voice saved to library');
              } catch (saveErr) {
                console.error('Failed to save voice to profile:', saveErr);
              }
            }
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (err) {
          console.error('[Orchestrator] Voice upload error:', err);
          toast.error('Failed to upload sample', { id: 'voice-upload' });
        } finally {
          setIsUploadingSample(false);
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsUploadingSample(false);
      };
    } catch (err) {
      console.error('[Orchestrator] Voice upload error:', err);
      toast.error('Upload failed', { id: 'voice-upload' });
      setIsUploadingSample(false);
    }
  };

  const handleUploadDna = async (slot, e) => {
    // PREVENT DUPLICATE CALLS
    if (isUploadingDna[slot]) return;

    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }

    setIsUploadingDna(prev => ({ ...prev, [slot]: true }));
    const loadingId = toast.loading(`Uploading ${slot} DNA...`, { id: `upload-dna-${slot}` });

    try {
      const headers = await getHeaders();
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          const response = await fetch(`${BACKEND_URL}/api/upload-asset`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              data: base64Data,
              fileName: `${slot}-dna-${Date.now()}-${file.name.replace(/\s+/g, '-')}`,
              mimeType: file.type,
              assetType: (slot === 'visual' || slot === 'video') ? 'image' : 
                         (slot === 'audio') ? 'audio' : 'document'
            })
          });

          const result = await response.json();
          if (response.ok && result.url) {
            const url = result.url;
            if (slot === 'visual') setVisualDnaUrl(url);
            if (slot === 'audio') setAudioDnaUrl(url);
            if (slot === 'video') setVideoDnaUrl(url);
            if (slot === 'lyrics') setLyricsDnaUrl(url);

            // Industrial Strength Persistence: Save to User Profile
            if (auth.currentUser?.uid) {
              try {
                const userRef = doc(db, 'users', auth.currentUser?.uid);
                const newArtifact = {
                  id: `dna-${Date.now()}`,
                  type: slot,
                  url: url,
                  name: file.name,
                  timestamp: Date.now()
                };
                
                await updateDoc(userRef, {
                  [`${slot}DnaUrl`]: url,
                  dnaArtifacts: arrayUnion(newArtifact),
                  lastDnaUpdate: Date.now()
                });
                
                setDnaArtifacts(prev => [newArtifact, ...(prev || [])]);
                console.log(`[Orchestrator] Persisted ${slot} DNA to profile and vault`);
              } catch (saveErr) {
                console.warn(`[Orchestrator] Failed to persist ${slot} DNA:`, saveErr);
              }
            }

            toast.success(`${slot === 'video' ? 'Image' : slot.charAt(0).toUpperCase() + slot.slice(1)} DNA attached!`, { id: loadingId });
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (err) {
          console.error(`[Orchestrator] ${slot} DNA upload error:`, err);
          toast.error(`Failed to upload ${slot} DNA`, { id: loadingId });
        } finally {
          setIsUploadingDna(prev => ({ ...prev, [slot]: false }));
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsUploadingDna(prev => ({ ...prev, [slot]: false }));
      };
    } catch (err) {
      console.error(`[Orchestrator] ${slot} DNA upload error:`, err);
      toast.error('Upload failed', { id: loadingId });
      setIsUploadingDna(prev => ({ ...prev, [slot]: false }));
    }
  };

  // Extract frame from video as fallback for image
  const extractFrameFromVideo = (videoUrl) => {
    return new Promise((resolve, reject) => {
      try {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        
        video.onloadeddata = () => {
          // Seek to 1 second or 10% of duration
          video.currentTime = Math.min(1, video.duration * 0.1);
        };
        
        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Get as data URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            video.remove();
            resolve(dataUrl);
          } catch (e) {
            reject(e);
          }
        };
        
        video.onerror = () => {
          reject(new Error('Video load failed'));
        };
        
        // Set source and load
        video.src = videoUrl;
        video.load();
        
        // Timeout after 10 seconds
        setTimeout(() => {
          video.remove();
          reject(new Error('Frame extraction timeout'));
        }, 10000);
        
      } catch (e) {
        reject(e);
      }
    });
  };

  const handleGenerateImage = async (directInput = null) => {
    // PREVENT DUPLICATE CALLS
    if (generatingMedia.image) return;

    // Use directInput (only if string), outputsRef, or current outputs (fallback)
    const visualPromptText = (typeof directInput === 'string' ? directInput : null) || outputsRef.current.visual || outputs.visual;

    if (!visualPromptText) {
      toast.error('Generate Visual DNA first');
      return;
    }
    setGeneratingMedia(prev => ({ ...prev, image: true }));
    toast.loading('Generating image (~10 seconds)...', { id: 'gen-image' });
    
    try {
      const headers = await getHeaders();

      // Clean prompt of AI fluff
      const { content: cleanVisualPrompt } = splitCreativeContent(visualPromptText);
      const visualPrompt = cleanVisualPrompt || visualPromptText;

      const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `Iconic Billboard-standard album cover art, hyper-detailed, professional photography or elite digital art, righteous quality, award-winning composition: ${visualPrompt.substring(0, 800)}`,
          referenceImage: visualDnaUrl
        })
      });
      
      let data;
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error(`Invalid image response (${response.status})`);
      }

      if (response.ok) {
        console.log('[Orchestrator] Image generation response:', Object.keys(data));
        
        // Handle different response formats from backend:
        // 1. Replicate/Flux returns: { output: "https://..." } (URL)
        // 2. Gemini/Imagen returns: { images: ["base64data..."] } (base64 array)
        // 3. Legacy format: { imageData: "base64data..." }
        let imageData = null;
        
        if (data.output) {
          // URL from Replicate or other provider (can be string, array, or object)
          imageData = data.output;
          console.log('[Orchestrator] Got image from .output field');
        } else if (data.images && data.images.length > 0) {
          // Base64 from Gemini/Imagen - store raw base64
          imageData = data.images[0];
          console.log('[Orchestrator] Got base64 image from Gemini/Imagen');
        } else if (data.imageData) {
          // Legacy format
          imageData = data.imageData;
          console.log('[Orchestrator] Got image from legacy format');
        }
        
        if (imageData) {
          setMediaUrls(prev => ({ ...prev, image: imageData }));
          toast.success('Image created!', { id: 'gen-image' });

          // AUTO-SYNC TO PROJECT
          if (existingProject) {
            const imageAsset = {
              id: `img-${Date.now()}`,
              type: 'image',
              url: imageData,
              name: `Album Art - ${new Date().toLocaleTimeString()}`,
              createdAt: new Date().toISOString()
            };
            
            const updatedAssets = [...(existingProject.assets || []), imageAsset];
            onSaveToProject({
              ...existingProject,
              assets: updatedAssets,
              updatedAt: new Date().toISOString()
            });
            console.log('[Orchestrator] Auto-synced image to project library');
          }
        } else {
          console.error('[Orchestrator] No image data in response:', data);
          // Try video frame fallback
          await tryVideoFrameFallback();
        }
      } else {
        const errText = await response.text();
        console.error('[Orchestrator] Image generation failed:', response.status, errText);
        // Try video frame fallback
        await tryVideoFrameFallback();
      }
    } catch (err) {
      console.error('[Orchestrator] Image generation error:', err);
      // Try video frame fallback
      await tryVideoFrameFallback();
    } finally {
      setGeneratingMedia(prev => ({ ...prev, image: false }));
    }
  };

  // Fallback: Extract frame from existing video if image generation fails
  const tryVideoFrameFallback = async () => {
    const videoUrl = mediaUrls.video || musicVideoUrl;
    if (!videoUrl) {
      toast.error('No image or video available', { id: 'gen-image' });
      return;
    }
    
    toast.loading('Extracting frame from video...', { id: 'gen-image' });
    
    try {
      // Try server-side extraction first
      const headers = await getHeaders();
      const response = await fetch(`${BACKEND_URL}/api/extract-video-frame`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ videoUrl, timestamp: 1 })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.extractClientSide) {
          // Server says use client-side extraction
          console.log('[Orchestrator] Using client-side frame extraction');
          const frameDataUrl = await extractFrameFromVideo(videoUrl);
          setMediaUrls(prev => ({ ...prev, image: frameDataUrl }));
          toast.success('Frame extracted from video!', { id: 'gen-image' });

          // AUTO-SYNC TO PROJECT
          if (existingProject) {
            const imageAsset = {
              id: `img-${Date.now()}`,
              type: 'image',
              url: frameDataUrl,
              name: `Video Frame Cover - ${new Date().toLocaleTimeString()}`,
              createdAt: new Date().toISOString()
            };
            
            const updatedAssets = [...(existingProject.assets || []), imageAsset];
            onSaveToProject({
              ...existingProject,
              assets: updatedAssets,
              updatedAt: new Date().toISOString()
            });
          }
          return;
        }
        
        if (data.output || data.imageData) {
          const imageData = data.output || `data:${data.mimeType || 'image/jpeg'};base64,${data.imageData}`;
          setMediaUrls(prev => ({ ...prev, image: imageData }));
          toast.success('Frame extracted from video!', { id: 'gen-image' });

          // AUTO-SYNC TO PROJECT
          if (existingProject) {
            const imageAsset = {
              id: `img-${Date.now()}`,
              type: 'image',
              url: imageData,
              name: `Video Frame Cover - ${new Date().toLocaleTimeString()}`,
              createdAt: new Date().toISOString()
            };
            
            const updatedAssets = [...(existingProject.assets || []), imageAsset];
            onSaveToProject({
              ...existingProject,
              assets: updatedAssets,
              updatedAt: new Date().toISOString()
            });
          }
          return;
        }
      }
      
      // Fallback to client-side extraction
      console.log('[Orchestrator] Server extraction failed, trying client-side');
      const frameDataUrl = await extractFrameFromVideo(videoUrl);
      setMediaUrls(prev => ({ ...prev, image: frameDataUrl }));
      toast.success('Frame extracted from video!', { id: 'gen-image' });
      
    } catch (err) {
      console.error('[Orchestrator] Frame extraction failed:', err);
      toast.error('Could not extract frame from video', { id: 'gen-image' });
    }
  };

  const handleGenerateVideo = async (directInput = null) => {
    // PREVENT DUPLICATE CALLS
    if (generatingMedia.video) return;

    // Use directInput (if string), outputsRef, or current outputs (fallback)
    const videoPromptText = (typeof directInput === 'string' ? directInput : null) || outputsRef.current.video || outputs.video;

    if (!videoPromptText) {
      toast.error('Generate Music Video DNA first');
      return;
    }
    setGeneratingMedia(prev => ({ ...prev, video: true }));
    toast.loading('Generating video (this takes ~2 min)...', { id: 'gen-video' });
    
    try {
      const headers = await getHeaders();

      // Clean prompt of AI fluff
      const { content: cleanVideoPrompt } = splitCreativeContent(videoPromptText);
      const videoPrompt = cleanVideoPrompt || videoPromptText;

      const response = await fetch(`${BACKEND_URL}/api/generate-video`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `Elite cinematic music video visual, professional motion design, high-fidelity righteous quality, award-winning storyboard: ${videoPrompt.substring(0, 700)}`,
          referenceImage: visualDnaUrl || videoDnaUrl,
          referenceVideo: videoDnaUrl,
          visualId: referencedVisualId,
          duration: duration,
          audioDuration: duration, // Pass audio duration for video sync
          audioUrl: mediaUrls.audio,
          vocalUrl: mediaUrls.vocals || mediaUrls.lyricsVocal
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Orchestrator] Video generation response:', { 
          type: data.type, 
          hasOutput: !!data.output,
          hasVideoUrl: !!data.videoUrl,
          mimeType: data.mimeType 
        });
        
        // Check if backend returned an image instead of video (fallback case)
        if (data.type === 'image' || (data.mimeType && data.mimeType.startsWith('image/'))) {
          // Handle image response - use as cover art instead
          const imageData = data.output || data.imageUrl;
          if (imageData && typeof imageData === 'string') {
            const imageSrc = imageData.startsWith('data:') || imageData.startsWith('http') 
              ? imageData 
              : `data:${data.mimeType || 'image/png'};base64,${imageData}`;
            setMediaUrls(prev => ({ ...prev, image: imageSrc }));
            toast.success('Cover image generated! (Video generation unavailable)', { id: 'gen-video', duration: 5000 });
          } else {
            toast.error('Video generation unavailable', { id: 'gen-video' });
          }
        } else {
          // Handle video response
          const videoUrl = data.videoUrl || data.output || data.video;
          
          if (videoUrl && typeof videoUrl === 'string' && (videoUrl.startsWith('http') || videoUrl.startsWith('blob:'))) {
            setMediaUrls(prev => ({ ...prev, video: videoUrl }));
            toast.success(data.isDemo ? 'Demo video loaded!' : 'Video created!', { id: 'gen-video' });

            // AUTO-SYNC VIDEO TO PROJECT
            if (existingProject) {
              const videoAsset = {
                id: `vid-${Date.now()}`,
                type: 'video',
                url: videoUrl,
                name: `Music Video - ${new Date().toLocaleTimeString()}`,
                createdAt: new Date().toISOString()
              };
              
              const updatedAssets = [...(existingProject.assets || []), videoAsset];
              onSaveToProject({
                ...existingProject,
                assets: updatedAssets,
                updatedAt: new Date().toISOString()
              });
              console.log('[Orchestrator] Auto-synced video to project library');
            }
            
            // Auto-extract frame if we don't have an image yet
            if (!mediaUrls.image) {
              toast.loading('Extracting cover frame...', { id: 'extract-frame' });
              try {
                const frameDataUrl = await extractFrameFromVideo(videoUrl);
                setMediaUrls(prev => ({ ...prev, image: frameDataUrl }));
                toast.success('Cover image extracted!', { id: 'extract-frame' });
              } catch (e) {
                console.log('[Orchestrator] Auto frame extraction failed (non-critical):', e);
                toast.dismiss('extract-frame');
              }
            }
          } else {
            console.error('[Orchestrator] Invalid video URL in response:', data);
            toast.error(data.message || 'Video generation unavailable', { id: 'gen-video' });
          }
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[Orchestrator] Video generation failed:', response.status, errData);
        
        // Show helpful setup message for 503 errors
        if (response.status === 503 && errData.setup) {
          toast.error(
            <div>
              <strong>Video API Not Ready</strong>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>{errData.details}</p>
            </div>, 
            { id: 'gen-video', duration: 8000 }
          );
        } else {
          toast.error(errData.details || errData.error || 'Video generation failed', { id: 'gen-video' });
        }
      }
    } catch (err) {
      console.error('[Orchestrator] Video generation error:', err);
      toast.error('Video generation failed', { id: 'gen-video' });
    } finally {
      setGeneratingMedia(prev => ({ ...prev, video: false }));
    }
  };

  // Create final mix - combines all outputs into a single product
  const handleCreateFinalMix = async () => {
    // PREVENT DUPLICATE CALLS
    if (creatingFinalMix) return;

    // Check if at least one output exists
    const activeOutputs = Object.entries(selectedAgents)
      .filter(([, agent]) => agent !== null)
      .map(([key]) => key);
    
    const hasActiveOutputs = activeOutputs.some(key => outputs[key]);
    if (!hasActiveOutputs) {
      toast.error('Generate at least one output first');
      return;
    }

    setCreatingFinalMix(true);
    toast.loading('Creating final mix (~15 seconds)...', { id: 'final-mix' });

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
            videoUrl: musicVideoUrl || mediaUrls.video || null,
            musicVideoUrl: musicVideoUrl || null,
            isSynced: !!musicVideoUrl
          }
        },
        settings: { language, style, model, bpm: projectBpm, musicVideoUrl: musicVideoUrl || null }
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

  // Generate professional image to video sync by syncing audio with video content
  const handleGenerateProfessionalMusicVideo = async () => {
    // PREVENT DUPLICATE CALLS
    if (generatingMusicVideo) return;

    if (!mediaUrls.audio || (!outputs.video && !mediaUrls.image)) {
      toast.error('Need beat audio and video concept to sync');
      return;
    }

    setGeneratingMusicVideo(true);
    toast.loading('🎬 Syncing audio with video beats (~2-3 min)...', { id: 'prof-video' });

    try {
      const headers = await getHeaders();
      
      // Use test endpoint if not authenticated, production if authenticated
      const endpoint = headers['Authorization'] 
        ? '/api/generate-synced-video' 
        : '/api/generate-synced-video-test';
      
      // Send request to generate synced music video
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          audioUrl: mediaUrls.audio,
          videoPrompt: outputs.video || `A high-fidelity cinematic music video for a ${style} song`,
          imageUrl: mediaUrls.image,
          videoUrl: mediaUrls.video,
          songTitle: songIdea || 'Untitled',
          style: style || 'cinematic',
          duration: structure === 'Extended' ? 180 : (structure === 'Radio Edit' ? 150 : (structure === 'Full Song' ? 90 : 60)) // Sync video duration to structure
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.videoUrl) {
          setMusicVideoUrl(data.videoUrl);
          // Update final mix with music video
          if (finalMixPreview) {
            setFinalMixPreview(prev => ({
              ...prev,
              musicVideoUrl: data.videoUrl,
              musicVideoGenerated: true,
              bpm: data.bpm,
              beatCount: data.beats
            }));
          }
          toast.success(`🎬 Image to video created! (${data.duration}s, ${data.bpm} BPM)`, { id: 'prof-video' });
        } else if (data.jobId) {
          // Long-form video queued
          toast.success(`🎬 Video queued for processing (Job: ${data.jobId.substring(0, 8)}...)`, { id: 'prof-video' });
          console.log('Video job started:', data);
        }
      } else if (response.status === 503) {
        toast.error('❌ Video API not configured', { id: 'prof-video' });
      } else {
        toast.error(`❌ ${data.error || 'Video sync failed'}`, { id: 'prof-video' });
      }
    } catch (err) {
      console.error('Music video sync error:', err);
      toast.error('❌ Image to video generation failed', { id: 'prof-video' });
    } finally {
      setGeneratingMusicVideo(false);
    }
  };

  // Download handler
  const handleDownload = (slot) => {
    const output = outputs[slot];
    if (!output) return;

    const slotConfig = GENERATOR_SLOTS.find(s => s.key === slot);
    const textToDownload = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songIdea || 'output'}-${slotConfig?.title || slot}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Also download media if available
    const mediaMap = { 
      audio: mediaUrls.audio, 
      visual: mediaUrls.image, 
      video: mediaUrls.video,
      lyrics: mediaUrls.vocals
    };
    const mediaUrl = mediaMap[slot];
    
    if (mediaUrl) {
      let formattedUrl = mediaUrl;
      if (slot === 'visual') formattedUrl = formatImageSrc(mediaUrl);
      if (slot === 'audio') formattedUrl = formatAudioSrc(mediaUrl);
      if (slot === 'video') formattedUrl = formatVideoSrc(mediaUrl);
      if (slot === 'lyrics') formattedUrl = formatAudioSrc(mediaUrl); // Vocals are audio
      
      const a = document.createElement('a');
      a.href = formattedUrl;
      a.download = `${songIdea || 'media'}-${slot}`;
      a.click();
    }
  };

  // Delete handler
  const handleDelete = (slot) => {
    setOutputs(prev => ({ ...prev, [slot]: null }));
    // Update ref too
    outputsRef.current[slot] = null;

    if (slot === 'audio') setMediaUrls(prev => ({ ...prev, audio: null }));
    if (slot === 'visual') setMediaUrls(prev => ({ ...prev, image: null }));
    if (slot === 'video') setMediaUrls(prev => ({ ...prev, video: null }));
    if (slot === 'lyrics') setMediaUrls(prev => ({ ...prev, vocals: null }));
    toast.success('Deleted');
  };

  // Edit handler
  const handleEdit = (slot, newText) => {
    setOutputs(prev => ({ ...prev, [slot]: newText }));
    // Update ref immediately so media generation uses the edited text
    outputsRef.current[slot] = newText;
    toast.success('Saved');
  };

  // Create project
  const handleCreateProject = () => {
    console.log('[Orchestrator] handleCreateProject called');
    console.log('[Orchestrator] existingProject:', existingProject?.id);
    console.log('[Orchestrator] outputs:', JSON.stringify(outputs, null, 2));
    console.log('[Orchestrator] mediaUrls:', JSON.stringify(mediaUrls, null, 2));
    console.log('[Orchestrator] selectedAgents:', JSON.stringify(selectedAgents, null, 2));
    console.log('[Orchestrator] songIdea:', songIdea);
    console.log('[Orchestrator] projectName:', projectName);
    
    // Check if there's any content to save
    const hasContent = Object.values(outputs).some(o => o !== null);
    const hasMedia = Object.values(mediaUrls).some(m => m !== null);
    console.log('[Orchestrator] hasContent:', hasContent, 'hasMedia:', hasMedia);
    
    if (!hasContent && !hasMedia) {
      toast.error('No content to save! Generate some content first.');
      return;
    }
    
    const assets = [];
    
    GENERATOR_SLOTS.forEach(slot => {
      const outputContent = outputs[slot.key];
      console.log('[Orchestrator] Processing slot:', slot.key, 'output:', typeof outputContent === 'string' ? outputContent.substring(0, 50) : outputContent);
      if (outputContent) {
        const agent = AGENTS.find(a => a.id === selectedAgents[slot.key]);
        // Safely get content as string
        let contentStr = typeof outputContent === 'string' ? outputContent : JSON.stringify(outputContent);
        
        // Clean lyrics before saving to project library
        if (slot.key === 'lyrics') {
          const { content: cleanLyrics } = splitCreativeContent(contentStr);
          if (cleanLyrics) contentStr = cleanLyrics;
        }

        const asset = {
          id: `${slot.key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: slot.title,
          type: slot.key,
          agent: agent?.name || slot.subtitle,
          content: contentStr,
          snippet: contentStr.substring(0, 100),
          audioUrl: slot.key === 'audio' ? (mediaUrls.audio || null) : (slot.key === 'lyrics' ? (mediaUrls.vocals || null) : null),
          imageUrl: slot.key === 'visual' ? (formatImageSrc(mediaUrls.image) || null) : null,
          videoUrl: slot.key === 'video' ? (mediaUrls.video || null) : null,
          date: new Date().toLocaleDateString(),
          createdAt: new Date().toISOString(),
          color: `agent-${(slot.color || '').replace('#', '')}`
        };
        console.log('[Orchestrator] Created asset:', asset.id, asset.title);
        assets.push(asset);
      }
    });
    
    console.log('[Orchestrator] Total assets created:', assets.length);

    // ADDED: Add Music Video (High Fidelity Sync) if exists
    if (musicVideoUrl) {
      const videoAsset = {
        id: `mvideo-${Date.now()}`,
        title: 'Professional Music Video',
        type: 'video', // StudioView recognizes 'video'
        agent: 'Orchestrator Sync',
        content: `Professional synced production for "${songIdea}"`,
        videoUrl: formatVideoSrc(musicVideoUrl),
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString(),
        isPremium: true,
        color: 'agent-ec4899' // Pinkish
      };
      console.log('[Orchestrator] Adding high-fidelity music video asset');
      assets.push(videoAsset);
    }

    // ADDED: Add Final Mix if exists
    if (finalMixPreview) {
      const mixAsset = {
        id: `fmix-${Date.now()}`,
        title: 'Full Production Master',
        type: 'pro', // StudioView uses 'pro' for full production
        agent: 'Studio Orchestrator',
        content: typeof finalMixPreview === 'string' ? finalMixPreview : JSON.stringify(finalMixPreview),
        audioUrl: formatAudioSrc(mediaUrls.audio),
        videoUrl: formatVideoSrc(musicVideoUrl || mediaUrls.video),
        imageUrl: formatImageSrc(mediaUrls.image),
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString(),
        color: 'agent-4f46e5' // Indigo
      };
      console.log('[Orchestrator] Adding final mix master asset');
      assets.push(mixAsset);
    }
    
    // Use existing project ID if updating, otherwise create new
    const projectId = existingProject?.id || String(Date.now());
    
    const project = {
      id: projectId,
      name: projectName || songIdea || existingProject?.name || 'Untitled Project',
      description: `Created with Studio Orchestrator: "${songIdea}"`,
      category: existingProject?.category || 'Music',
      language,
      style,
      model,
      bpm: projectBpm,
      structure,
      duration,
      musicalBars: bars,
      useBars,
      date: existingProject?.date || new Date().toLocaleDateString(),
      createdAt: existingProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agents: Object.values(selectedAgents).filter(Boolean).map(id => {
        const agent = AGENTS.find(a => a.id === id);
        return agent?.name || id;
      }),
      assets: [...(existingProject?.assets || []), ...assets],
      coverImage: formatImageSrc(mediaUrls.image) || existingProject?.coverImage || null
    };
    
    console.log('[Orchestrator] Project object:', JSON.stringify({
      id: project.id,
      name: project.name,
      assetCount: project.assets.length,
      assetTypes: project.assets.map(a => a.type)
    }, null, 2));
    
    // Choose the callback: StudioView usually passes onSaveToProject for updates
    // and onCreateProject for initial creation.
    const isUpdate = !!existingProject?.id;
    const saveCallback = isUpdate ? (onSaveToProject || onCreateProject) : (onCreateProject || onSaveToProject);
    
    if (saveCallback) {
      console.log('[Orchestrator] Calling save callback with project');
      try {
        saveCallback(project);
        toast.success(`Saved ${project.assets.length} assets to "${project.name}"!`);
        // Mark as saved so exit check won't prompt
        setIsSaved(true);
        // Show save confirmation with option to preview
        setShowCreateProject(false);
        setShowSaveConfirm(true);
        return; // Don't close immediately - let user choose to preview or close
      } catch (err) {
        console.error('[Orchestrator] save callback error:', err);
        toast.error('Save failed - callback error');
      }
    } else {
      console.warn('[Orchestrator] No save callback (onSaveToProject/onCreateProject) provided!');
      toast.error('Save failed - no backend connection');
    }
    
    setShowCreateProject(false);
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
        height: '100dvh',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(10,10,20,0.98) 100%)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: isMobile ? '12px 16px' : '16px 24px', 
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
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
          }}>
            <Zap size={isMobile ? 22 : 26} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: '700' }}>Studio Orchestrator <span style={{ color: 'var(--color-purple)', fontSize: '0.6em', border: '1px solid var(--color-purple)', padding: '1px 4px', borderRadius: '4px', marginLeft: '6px' }}>V3.5</span></h2>
            <p style={{ margin: 0, fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'var(--text-secondary)' }}>
              4 AI Generators • One Unified Pipeline
            </p>
          </div>
        </div>
        <button 
          onClick={handleCloseWithCheck}
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none', 
            borderRadius: '12px',
            width: isMobile ? '38px' : '44px',
            height: isMobile ? '38px' : '44px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <X size={20} color="white" />
        </button>
      </div>

      {/* Main Content - Scrollable area */}
      <div 
        className="orchestrator-scroll-container"
        style={{ 
          flex: 1, 
          padding: isMobile ? '8px 6px' : '16px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        
        {/* Input Section */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          padding: isMobile ? '10px' : '16px',
          marginBottom: isMobile ? '12px' : '20px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Song Idea Input - Stacks on mobile */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: isMobile ? '8px' : '12px', 
            marginBottom: isMobile ? '12px' : '16px' 
          }}>
            <textarea
              value={songIdea}
              onChange={(e) => setSongIdea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Describe your song idea, vibe, or concept..."
              rows={isMobile ? 3 : 2}
              style={{
                width: '100%',
                padding: isMobile ? '10px 12px' : '16px 20px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white',
                fontSize: isMobile ? '0.9rem' : '1rem',
                outline: 'none',
                minHeight: isMobile ? '100px' : '56px',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.5'
              }}
            />
            
            {/* Action Buttons Row */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* STT Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isListening ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                  color: isListening ? '#ef4444' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '52px',
                  minHeight: '52px'
                }}
                title={isListening ? "Stop Listening" : "Voice Input"}
              >
                {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !songIdea.trim() || Object.values(selectedAgents).filter(Boolean).length === 0}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  borderRadius: '12px',
                  background: isGenerating ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: isGenerating || !songIdea.trim() || Object.values(selectedAgents).filter(Boolean).length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: !songIdea.trim() || Object.values(selectedAgents).filter(Boolean).length === 0 ? 0.5 : 1,
                  boxShadow: isGenerating ? 'none' : '0 4px 20px rgba(139, 92, 246, 0.4)',
                  minHeight: '52px'
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate {Object.values(selectedAgents).filter(Boolean).length === 4 
                      ? 'All' 
                      : `${Object.values(selectedAgents).filter(Boolean).length} Output${Object.values(selectedAgents).filter(Boolean).length !== 1 ? 's' : ''}`}
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Quick Examples - scrollable on mobile */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            flexWrap: 'wrap', 
            alignItems: 'center',
            paddingBottom: '4px'
          }}>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: showSuggestions ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: showSuggestions ? '#a855f7' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '40px',
                whiteSpace: 'nowrap'
              }}
            >
              <Lightbulb size={14} />
              {showSuggestions ? 'Hide Ideas' : 'Need Ideas?'}
            </button>
            {showSuggestions && EXAMPLE_IDEAS.map((idea, i) => (
              <button
                key={i}
                onClick={() => { setSongIdea(idea); setShowSuggestions(false); }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '20px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: '40px'
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {[
            { label: 'Language', value: language, setter: setLanguage, options: ['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Portuguese'] },
            { label: 'Genre', value: style, setter: setStyle, options: ['Modern Hip-Hop', '90s Boom Bap', 'Trap', 'R&B / Soul', 'Pop', 'Rock', 'Electronic', 'Lo-Fi'] },
            { label: 'Project BPM', value: projectBpm, setter: setProjectBpm, options: [70, 80, 90, 100, 110, 120, 130, 140, 150, 160] },
            { label: 'Timing Mode', value: useBars ? 'Bars' : 'Seconds', setter: (val) => setUseBars(val === 'Bars'), options: ['Bars', 'Seconds'] },
            { label: 'Musical Bars', value: bars, setter: setBars, options: [4, 8, 16, 32, 64], hidden: !useBars },
            { label: 'Target Duration', value: duration, setter: setDuration, options: [15, 30, 60, 90, 120, 180, 240, 300], hidden: useBars },
            { label: 'Structure', value: structure, setter: setStructure, options: ['Full Song', 'Radio Edit', 'Extended', 'Loop', 'Intro', 'Verse', 'Chorus', 'Outro'] },
            { label: 'AI Model', value: model, setter: setModel, options: ['Gemini 2.0 Flash', 'Gemini 2.0 Pro (Exp)', 'Gemini 1.5 Pro'] },
            { label: 'Mood', value: mood, setter: setMood, options: ['Chill', 'Energetic', 'Dark', 'Happy', 'Epic', 'Mysterious', 'Dreamy'] },
            { label: 'Music Engine', value: musicEngine, setter: setMusicEngine, options: ['Beat Lab (MusicGen)', 'Mureaka', 'Riffusion (Visual)', 'Stability Pro', 'Uberduck', 'Auto-Selection'] },
            { label: 'Stem Mode', value: stemType, setter: setStemType, options: ['Full Mix', 'Drums Only', 'No Drums', 'Melody Only', 'Bass Only'] }
          ].filter(c => !c.hidden).map(config => (
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
                value={config.label === 'Music Engine' ? (
                  musicEngine === 'music-gpt' ? 'Beat Lab (MusicGen)' :
                  musicEngine === 'mureka' ? 'Mureaka' :
                  musicEngine === 'riffusion' ? 'Riffusion (Visual)' :
                  musicEngine === 'stability' ? 'Stability Pro' :
                  musicEngine === 'uberduck' ? 'Uberduck' : 'Auto-Selection'
                ) : config.value}
                onChange={(e) => {
                  const val = e.target.value;
                  if (config.label === 'Music Engine') {
                    if (val === 'Beat Lab (MusicGen)') setMusicEngine('music-gpt');
                    else if (val === 'Mureaka') setMusicEngine('mureka');
                    else if (val === 'Riffusion (Visual)') setMusicEngine('riffusion');
                    else if (val === 'Stability Pro') setMusicEngine('stability');
                    else if (val === 'Uberduck') setMusicEngine('uberduck');
                    else setMusicEngine('auto');
                  } else if (['Musical Bars', 'Project BPM', 'Target Duration'].includes(config.label)) {
                    config.setter(parseInt(val));
                  } else {
                    config.setter(val);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  outline: 'none',
                  minHeight: '48px',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center'
                }}
              >
                {config.options.map(opt => (
                  <option key={opt} value={opt} style={{ background: '#1a1a1a' }}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
          
          {/* Udio-style Musicality Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '600' }}>
               High Musicality (Udio)
             </label>
             <button 
               onClick={() => setHighMusicality(!highMusicality)}
               style={{
                 height: '48px',
                 borderRadius: '10px',
                 background: highMusicality ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0,0,0,0.4)',
                 border: `1px solid ${highMusicality ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                 color: highMusicality ? '#a78bfa' : 'var(--text-secondary)',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px',
                 justifyContent: 'center',
                 cursor: 'pointer',
                 transition: 'all 0.2s'
               }}
             >
               <Music size={14} />
               {highMusicality ? 'Enabled' : 'Disabled'}
             </button>
          </div>

          {/* Seed Control (Riffusion/Suno) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '600' }}>
               Generation Seed
             </label>
             <div style={{ display: 'flex', gap: '4px' }}>
                <input 
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value))}
                  style={{
                    flex: 1,
                    height: '48px',
                    padding: '0 12px',
                    borderRadius: '10px 0 0 10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                  placeholder="Random"
                />
                <button 
                  onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
                  style={{
                    padding: '0 12px',
                    borderRadius: '0 10px 10px 0',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderLeft: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                  title="Randomize Seed"
                >
                  <RefreshCw size={14} />
                </button>
             </div>
          </div>
        </div>

        {/* Agent Selection */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '20px',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            justifyContent: 'space-between',
            gap: '8px', 
            marginBottom: '16px',
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={isMobile ? 14 : 16} color="var(--text-secondary)" />
              <span style={{ 
                fontSize: isMobile ? '0.75rem' : '0.8rem', 
                color: 'var(--text-secondary)', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Choose Your Generators
              </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.3)',
                color: '#a78bfa',
                fontSize: '0.7rem',
                fontWeight: '600'
              }}>
                {Object.values(selectedAgents).filter(Boolean).length} / 4 active
              </span>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            {GENERATOR_SLOTS.map(slot => (
              <div key={slot.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ 
                    fontSize: '0.7rem', 
                    color: slot.color, 
                    fontWeight: '500'
                  }}>
                    {slot.title}
                  </label>
                  {selectedAgents[slot.key] && (
                    <div 
                      title={`${AGENTS.find(a => a.id === selectedAgents[slot.key])?.name} Capabilities:\n• ${AGENTS.find(a => a.id === selectedAgents[slot.key])?.capabilities?.join('\n• ')}`}
                      style={{ color: 'rgba(255,255,255,0.3)', cursor: 'help' }}
                    >
                      <CircleHelp size={12} />
                    </div>
                  )}
                </div>
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
                  {AGENTS.filter(a => {
                    // Filter based on user tier
                    if (userPlan === 'Pro') return true; // Pro sees all
                    if (userPlan === 'Monthly') return a.tier === 'free' || a.tier === 'monthly';
                    return a.tier === 'free'; // Default/Free tier
                  }).filter(a => {
                    // Additional filter for logic pairing
                    if (slot.key === 'lyrics') return a.category === 'Music Creation' || a.category === 'Pro Performer' || a.id === 'ghost' || a.id === 'vocal-arch';
                    if (slot.key === 'audio') return a.category === 'Pro Producer' || a.category === 'Music Creation' || a.id === 'beat' || a.id === 'beat-arch';
                    if (slot.key === 'visual') return a.category === 'Visual Identity' || a.id === 'album';
                    if (slot.key === 'video') return a.category === 'Visual Identity' || a.id === 'video-creator';
                    return true;
                  }).map(agent => (
                    <option 
                      key={agent.id} 
                      value={agent.id} 
                      style={{ background: '#1a1a1a' }}
                      disabled={agent.comingSoon}
                    >
                      {agent.name} {agent.comingSoon ? '(Coming Soon)' : (agent.isBeta ? '(Beta)' : '')}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Studio DNA Vault Segment */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          padding: isMobile ? '12px' : '16px',
          marginBottom: '24px',
          border: '1px solid rgba(168, 85, 247, 0.15)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: showDnaVault ? '16px' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DatabaseIcon size={18} color="#a855f7" />
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'white' }}>Studio DNA Vault</h3>
                {!showDnaVault && (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                    {visualDnaUrl || audioDnaUrl || lyricsDnaUrl || videoDnaUrl ? 'Persistent references active' : 'No reference files attached'}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={() => setShowDnaVault(!showDnaVault)}
              style={{
                padding: '6px 12px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#a855f7',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              {showDnaVault ? 'Close Vault' : 'Manage DNA'}
              {showDnaVault ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>

          {showDnaVault && (
            <div style={{ marginTop: '16px', animation: 'fadeIn 0.3s ease' }}>
              {/* DNA Explanation Section */}
              <div style={{ 
                padding: '16px', 
                background: 'rgba(168, 85, 247, 0.05)', 
                borderRadius: '12px', 
                border: '1px solid rgba(168, 85, 247, 0.15)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <CircleHelp size={20} color="#a855f7" style={{ marginTop: '2px' }} />
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#a855f7', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>What is DNA?</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', fontFamily: 'Georgia, serif' }}>
                      DNA (Digital Narrative Artifacts) allows you to "seed" the AI with specific creative references. 
                      By uploading visual moodboards, audio references, or lyrical contexts, the agents can better understand 
                      and mirror your unique artistic direction. Select an artifact below to set it as the active DNA reference 
                      for your creative session.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                gap: '10px',
                marginBottom: '20px'
              }}>
                {/* Visual DNA */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ImageIcon size={18} color="#ec4899" />
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Visual DNA</div>
                      <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '500', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {visualDnaUrl ? 'Reference Active' : 'No Image'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {visualDnaUrl && <button onClick={() => setVisualDnaUrl(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={14} /></button>}
                    <label style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', color: 'white' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadDna('visual', e)} />
                      {isUploadingDna.visual ? <Loader2 size={12} className="spin" /> : 'Upload'}
                    </label>
                  </div>
                </div>

                {/* Audio DNA */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Music size={18} color="#06b6d4" />
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Audio DNA</div>
                      <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '500', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {audioDnaUrl ? 'Ref Active' : 'No Beat'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {audioDnaUrl && <button onClick={() => setAudioDnaUrl(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={14} /></button>}
                    <label style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', color: 'white' }}>
                      <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => handleUploadDna('audio', e)} />
                      {isUploadingDna.audio ? <Loader2 size={12} className="spin" /> : 'Upload'}
                    </label>
                  </div>
                </div>

                {/* Lyrics DNA */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={18} color="#a855f7" />
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Lyrics DNA</div>
                      <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '500', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lyricsDnaUrl ? 'Text Ready' : 'No Context'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {lyricsDnaUrl && <button onClick={() => setLyricsDnaUrl(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={14} /></button>}
                    <label style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', color: 'white' }}>
                      <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadDna('lyrics', e)} />
                      {isUploadingDna.lyrics ? <Loader2 size={12} className="spin" /> : 'Upload'}
                    </label>
                  </div>
                </div>

                {/* Video/Profile DNA */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <VideoIcon size={18} color="#f59e0b" />
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Seed DNA</div>
                      <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '500', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {videoDnaUrl ? 'Profile Active' : 'No Seed'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {videoDnaUrl && <button onClick={() => setVideoDnaUrl(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={14} /></button>}
                    <label style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', color: 'white' }}>
                      <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadDna('video', e)} />
                      {isUploadingDna.video ? <Loader2 size={12} className="spin" /> : 'Upload'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Stored Artifacts Repository */}
              {dnaArtifacts && dnaArtifacts.length > 0 && (
                <div style={{ 
                  marginTop: '12px',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>Stored Vault Artifacts</h4>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    maxHeight: '240px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    {dnaArtifacts.slice().reverse().map((artifact) => (
                      <div key={artifact.id} style={{
                        padding: '10px 12px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '8px', 
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {artifact.type === 'visual' && <ImageIcon size={16} color="#ec4899" />}
                            {artifact.type === 'audio' && <Music size={16} color="#06b6d4" />}
                            {artifact.type === 'lyrics' && <FileText size={16} color="#a855f7" />}
                            {artifact.type === 'video' && <VideoIcon size={16} color="#f59e0b" />}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {artifact.name}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                              {artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1)} • {new Date(artifact.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              if (artifact.type === 'visual') setVisualDnaUrl(artifact.url);
                              if (artifact.type === 'audio') setAudioDnaUrl(artifact.url);
                              if (artifact.type === 'video') setVideoDnaUrl(artifact.url);
                              if (artifact.type === 'lyrics') setLyricsDnaUrl(artifact.url);
                              toast.success(`${artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1)} activated!`);
                            }}
                            style={{
                              padding: '5px 10px',
                              background: 'rgba(168, 85, 247, 0.15)',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              borderRadius: '6px',
                              color: '#a855f7',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            Activate
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Remove this DNA artifact?')) return;
                              try {
                                const newArtifacts = dnaArtifacts.filter(a => a.id !== artifact.id);
                                setDnaArtifacts(newArtifacts);
                                const userRef = doc(db, 'users', auth.currentUser?.uid);
                                await updateDoc(userRef, { dnaArtifacts: newArtifacts });
                                toast.success('Artifact removed');
                              } catch (err) {
                                console.error('Failed to remove artifact:', err);
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio ID Reference - New for Audio_ID support */}
              <div style={{
                padding: '12px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                border: referencedAudioId ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.05)',
                gridColumn: isMobile ? 'span 1' : 'span 2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Hash size={16} color="#06b6d4" />
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Project Audio ID Reference</div>
                  </div>
                  {referencedAudioId && <button onClick={() => setReferencedAudioId('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={14} /></button>}
                </div>
                <input 
                  type="text" 
                  placeholder="Link an existing Audio ID (e.g. project_vocal_01)..."
                  value={referencedAudioId}
                  onChange={(e) => setReferencedAudioId(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: 'white',
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* ElevenLabs Premium Toggle */}
              <div style={{
                gridColumn: isMobile ? 'auto' : '1 / span 2',
                padding: '12px 16px',
                background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: vocalQuality === 'premium' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: vocalQuality === 'premium' ? '#a855f7' : 'rgba(255,255,255,0.4)'
                  }}>
                    <Zap size={18} fill={vocalQuality === 'premium' ? '#a855f7' : 'none'} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '700', letterSpacing: '0.02em' }}>
                      ELEVENLABS PREMIUM ENGINE
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                      {vocalQuality === 'premium' ? 'Using HD neural voices & cloned mastery' : 'Using standard generation engines'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setVocalQuality(vocalQuality === 'premium' ? 'standard' : 'premium')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: vocalQuality === 'premium' ? '#a855f7' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: vocalQuality === 'premium' ? '0 0 15px rgba(168, 85, 247, 0.4)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {vocalQuality === 'premium' ? 'ACTIVATED' : 'ACTIVATE'}
                </button>
              </div>
            </div>
          )}

          {/* Inline Active Badges when vault is closed */}
          {!showDnaVault && (visualDnaUrl || audioDnaUrl || lyricsDnaUrl || videoDnaUrl) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {visualDnaUrl && <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', borderRadius: '6px', border: '1px solid rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}><ImageIcon size={10} /> Visual DNA</div>}
              {audioDnaUrl && <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}><Music size={10} /> Audio DNA</div>}
              {lyricsDnaUrl && <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={10} /> Lyrics DNA</div>}
              {videoDnaUrl && <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}><VideoIcon size={10} /> Seed DNA</div>}
            </div>
          )}
        </div>

        {/* DEBUG: Show lyrics status */}
        <div style={{ 
          padding: '8px', 
          background: outputs.lyrics ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
          borderRadius: '8px', 
          marginBottom: '12px',
          fontSize: '0.75rem',
          color: outputs.lyrics ? '#10b981' : '#ef4444'
        }}>
          {outputs.lyrics ? '✅ Lyrics ready - Create Vocal button should appear below' : '⚠️ No lyrics yet - Click Generate above first'}
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
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  color: 'rgba(255,255,255,0.85)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: "'Georgia', 'Times New Roman', serif"
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
                      src={formatAudioSrc(mediaUrls.lyricsVocal)}
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
                value={
                  (voiceStyle === 'cloned' && voiceSampleUrl) 
                    ? (savedVoices.find(v => v.url === voiceSampleUrl) ? `saved-${savedVoices.find(v => v.url === voiceSampleUrl).id}` : 'cloned')
                    : voiceStyle
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('saved-')) {
                    const voiceId = val.replace('saved-', '');
                    const voice = savedVoices.find(v => v.id === voiceId);
                    if (voice) {
                      setVoiceSampleUrl(voice.url);
                      setVoiceStyle('cloned');
                    }
                  } else {
                    setVoiceStyle(val);
                  }
                }}
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
                <optgroup label="🔥 AI Rappers (Suno/Bark)">
                  <option value="rapper">🎤 Male Rapper</option>
                  <option value="rapper-female">💜 Female Rapper</option>
                </optgroup>
                <optgroup label="🎵 AI Singers">
                  <option value="singer">🎤 Male Singer (R&B/Soul)</option>
                  <option value="singer-female">💫 Female Singer (Pop/R&B)</option>
                </optgroup>
                <optgroup label="🗣️ Narration">
                  <option value="narrator">📢 Narrator (Deep Voice)</option>
                  <option value="spoken">💬 Spoken Word</option>
                </optgroup>
                <optgroup label="🧬 Voice Cloning">
                  <option value="cloned" disabled={!voiceSampleUrl}>✨ Cloned Voice {!voiceSampleUrl && '(Upload sample first)'}</option>
                  {savedVoices.length > 0 && (
                    <optgroup label="🗄️ Saved Voices">
                      {savedVoices.map(voice => (
                        <option key={voice.id} value={`saved-${voice.id}`}>👤 {voice.name || 'Unnamed Voice'}</option>
                      ))}
                    </optgroup>
                  )}
                </optgroup>
              </select>

              {/* Righteous Quality / Output Format Selector */}
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #fbbf24',
                  color: 'white',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
                title="Select Righteous Quality Output Format"
              >
                <option value="music">🎵 Billboard Music Mix</option>
                <option value="social">📱 Social Media Ready</option>
                <option value="podcast">🎙️ Broadcast Podcast</option>
                <option value="tv">📺 TV/Commercial Ready</option>
              </select>

              {/* Voice Sample Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="file"
                    id="voice-sample-upload"
                    accept="audio/*"
                    onChange={handleUploadVoiceSample}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => document.getElementById('voice-sample-upload').click()}
                    disabled={isUploadingSample}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: voiceSampleUrl ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: voiceSampleUrl ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: voiceSampleUrl ? '#22c55e' : 'white',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isUploadingSample ? <Loader2 size={16} className="spin" /> : <Mic size={16} />}
                    {voiceSampleUrl ? 'Voice Sample Attached ✓' : 'Upload Voice Sample'}
                  </button>
                  {voiceSampleUrl && (
                    <button
                      onClick={() => {
                        setVoiceSampleUrl(null);
                        if (voiceStyle === 'cloned') setVoiceStyle('rapper');
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '10px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '10px'
                      }}
                      title="Remove sample"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Premium ElevenLabs Input / Voice Selector */}
                {(vocalQuality === 'premium' || voiceStyle === 'cloned' || voiceStyle.startsWith('saved-')) && (
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {elVoices.length > 0 ? (
                      <select
                        value={elevenLabsVoiceId}
                        onChange={(e) => {
                          setElevenLabsVoiceId(e.target.value);
                          localStorage.setItem('studio_elevenlabs_voice_id', e.target.value);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(0,0,0,0.3)',
                          border: elevenLabsVoiceId ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                          color: 'white',
                          fontSize: '0.85rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Select ElevenLabs Voice (Premium)</option>
                        <optgroup label="Professional Models">
                          {elVoices.map(voice => (
                            <option key={voice.voice_id} value={voice.voice_id}>
                              {voice.name} ({voice.labels?.accent || voice.labels?.gender || 'Pro'})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="ElevenLabs Voice ID (Optional for Premium)"
                        value={elevenLabsVoiceId}
                        onChange={(e) => {
                          setElevenLabsVoiceId(e.target.value);
                          localStorage.setItem('studio_elevenlabs_voice_id', e.target.value);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(0,0,0,0.3)',
                          border: elevenLabsVoiceId ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                          color: 'white',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      />
                    )}
                    {elevenLabsVoiceId && (
                      <div style={{ 
                        position: 'absolute', 
                        right: elVoices.length > 0 ? '30px' : '10px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        pointerEvents: 'none' 
                      }}>
                        <Zap size={10} color="#fbbf24" fill="#fbbf24" />
                        <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 'bold' }}>PREMIUM</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Saved Voices Library Mini-List */}
              {savedVoices.length > 0 && (
                <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    My Voice Library
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {savedVoices.map(voice => (
                      <div 
                        key={voice.id}
                        onClick={() => {
                          setVoiceSampleUrl(voice.url);
                          setVoiceStyle('cloned');
                          toast.success(`Voice "${voice.name}" loaded`);
                        }}
                        style={{
                          background: voiceSampleUrl === voice.url ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                          border: voiceSampleUrl === voice.url ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '16px',
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <User size={10} />
                        {voice.name || 'Voice'}
                        <X 
                          size={12} 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this voice from your library?')) {
                              try {
                                await deleteDoc(doc(db, 'users', auth.currentUser?.uid, 'voices', voice.id));
                                setSavedVoices(prev => prev.filter(v => v.id !== voice.id));
                                if (voiceSampleUrl === voice.url) {
                                  setVoiceSampleUrl(null);
                                  setVoiceStyle('rapper');
                                }
                                toast.success('Voice deleted');
                              } catch (err) {
                                toast.error('Failed to delete voice');
                              }
                            }
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
                          style={{ marginLeft: '4px', opacity: 0.5, cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Rap Style Selector - only show for rap voices */}
              {(voiceStyle === 'rapper' || voiceStyle === 'rapper-female') && (
                <select
                  value={rapStyle}
                  onChange={(e) => setRapStyle(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(236, 72, 153, 0.5)',
                    color: 'white',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <optgroup label="🔥 Rap Flow">
                    <option value="aggressive">💥 Aggressive</option>
                    <option value="melodic">🎵 Melodic</option>
                    <option value="trap">🔥 Trap (Triplets)</option>
                    <option value="drill">🇬🇧 Drill (UK)</option>
                    <option value="boom-bap">📻 Boom-Bap</option>
                    <option value="fast">⚡ Fast Flow</option>
                    <option value="chill">😎 Chill</option>
                    <option value="hype">🔊 Hype</option>
                  </optgroup>
                </select>
              )}
              
              {/* Genre Selector - only show for singers */}
              {(voiceStyle === 'singer' || voiceStyle === 'singer-female') && (
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
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
                  <optgroup label="🎶 Genre">
                    <option value="r&b">💜 R&B / Soul</option>
                    <option value="pop">🌟 Pop</option>
                    <option value="hip-hop">🔥 Hip-Hop</option>
                    <option value="soul">🎷 Gospel/Soul</option>
                  </optgroup>
                </select>
              )}
              
              <button
                onClick={() => {
                  console.log('[Create Vocal Button] CLICKED!');
                  handleGenerateVocals();
                }}
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
                    <Volume2 size={16} />
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

              {mediaUrls.lyricsVocal && mediaUrls.lyricsVocal.startsWith('data:audio') && (
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = mediaUrls.lyricsVocal;
                    // Determine extension from mime type
                    const ext = mediaUrls.lyricsVocal.includes('audio/wav') ? 'wav' : 'mp3';
                    a.download = `${songIdea || 'lyrics'}-${voiceStyle}.${ext}`;
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

        {/* 4 Generator Cards Grid - 2x2 layout */}
      {/* 4 Generator Cards Grid - 2x2 layout - uses unified CSS */}
      <div className="generator-grid-unified" style={{
        gap: isMobile ? '0.75rem' : '1rem',
        touchAction: 'pan-y'
      }}>
        {GENERATOR_SLOTS.map(slot => (
          <GeneratorCard
            key={slot.key}
            slot={slot.key}
            agentId={selectedAgents[slot.key]}
            icon={slot.icon}
            title={selectedAgents[slot.key] ? AGENTS.find(a => a.id === selectedAgents[slot.key])?.name : slot.title}
            subtitle={slot.subtitle}
            color={slot.color}
            output={outputs[slot.key]}
            isLoading={isGenerating && selectedAgents[slot.key]}
            mediaType={slot.mediaType}
            mediaUrl={
              slot.key === 'audio' ? mediaUrls.audio :
              slot.key === 'lyrics' ? (mediaUrls.vocals || mediaUrls.lyricsVocal) :
              slot.key === 'visual' ? mediaUrls.image :
              slot.key === 'video' ? mediaUrls.video : null
            }
            onGenerateMedia={
              slot.key === 'audio' ? handleGenerateAudio :
              slot.key === 'lyrics' ? handleGenerateVocals :
              slot.key === 'visual' ? handleGenerateImage :
              slot.key === 'video' ? handleGenerateVideo : null
            }
            isGeneratingMedia={
              slot.key === 'audio' ? generatingMedia.audio :
              slot.key === 'lyrics' ? (generatingMedia.vocals) :
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
            onUploadDna={
              slot.key === 'visual' ? (e) => handleUploadDna('visual', e) :
              slot.key === 'audio' ? (e) => handleUploadDna('audio', e) :
              slot.key === 'video' ? (e) => handleUploadDna('video', e) :
              slot.key === 'lyrics' ? (e) => handleUploadDna('lyrics', e) : null
            }
            dnaUrl={
              slot.key === 'visual' ? visualDnaUrl :
              slot.key === 'audio' ? audioDnaUrl :
              slot.key === 'video' ? videoDnaUrl :
              slot.key === 'lyrics' ? lyricsDnaUrl : null
            }
            isUploadingDna={isUploadingDna[slot.key]}
            onClearDna={() => {
              if (slot.key === 'visual') setVisualDnaUrl(null);
              if (slot.key === 'audio') setAudioDnaUrl(null);
              if (slot.key === 'video') setVideoDnaUrl(null);
              if (slot.key === 'lyrics') setLyricsDnaUrl(null);
            }}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PRODUCTION CONTROL HUB (Consolidated Final Mix & Save)
          ═══════════════════════════════════════════════════════════════════ */}
      <ProductionControlHub
        outputs={outputs}
        mediaUrls={mediaUrls}
        songIdea={songIdea}
        finalMixPreview={finalMixPreview}
        creatingFinalMix={creatingFinalMix}
        musicVideoUrl={musicVideoUrl}
        generatingMusicVideo={generatingMusicVideo}
        handleGenerateProfessionalMusicVideo={handleGenerateProfessionalMusicVideo}
        handleCreateFinalMix={handleCreateFinalMix}
        handleCreateProject={handleCreateProject}
        setShowPreviewModal={setShowPreviewModal}
        visualType={visualType}
        setVisualType={setVisualType}
        isMobile={isMobile}
        orchestratorBpm={projectBpm}
      />
    </div>

      {/* Maximized Card Modal */}
      {maximizedSlot && GENERATOR_SLOTS.find(s => s.key === maximizedSlot) && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(10,10,20,0.98) 100%)',
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'center',
            zIndex: 2500,
            padding: isMobile ? '10px' : '20px',
            overflowY: 'auto'
          }}
          onClick={() => setMaximizedSlot(null)}
        >
          <div 
            style={{
              background: 'rgba(10, 10, 20, 0.95)',
              borderRadius: isMobile ? '16px' : '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              width: '100%',
              maxWidth: '800px',
              maxHeight: isMobile ? '95vh' : '90vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              marginTop: isMobile ? '10px' : '0'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <div style={{
              padding: isMobile ? '12px 16px' : '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 10
            }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: '700' }}>
                {GENERATOR_SLOTS.find(s => s.key === maximizedSlot)?.title}
              </h3>
              <button
                onClick={() => setMaximizedSlot(null)}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  padding: isMobile ? '6px 10px' : '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontWeight: '600',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  transition: 'all 0.2s',
                  minWidth: '36px',
                  minHeight: '36px'
                }}
              >
                <X size={16} />
                {!isMobile && 'Close'}
              </button>
            </div>

            {/* Maximized Card Content */}
            <div style={{
              padding: isMobile ? '12px' : '24px',
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
                      slot.key === 'lyrics' ? mediaUrls.vocals :
                      slot.key === 'visual' ? mediaUrls.image :
                      slot.key === 'video' ? mediaUrls.video : null
                    }
                    onGenerateMedia={
                      slot.key === 'audio' ? handleGenerateAudio :
                      slot.key === 'lyrics' ? handleGenerateVocals :
                      slot.key === 'visual' ? handleGenerateImage :
                      slot.key === 'video' ? handleGenerateVideo : null
                    }
                    isGeneratingMedia={
                      slot.key === 'audio' ? generatingMedia.audio :
                      slot.key === 'lyrics' ? generatingMedia.vocals :
                      slot.key === 'visual' ? generatingMedia.image :
                      slot.key === 'video' ? generatingMedia.video : false
                    }
                    onRegenerate={() => handleRegenerate(slot.key)}
                    onEdit={(text) => handleEdit(slot.key, text)}
                    onDelete={() => handleDelete(slot.key)}
                    onDownload={() => handleDownload(slot.key)}
                    onSpeak={() => speakText(outputs[slot.key], slot.key)}
                    isSpeaking={speakingSlot === slot.key}
                    onUploadDna={
                      slot.key === 'visual' ? (e) => handleUploadDna('visual', e) :
                      slot.key === 'audio' ? (e) => handleUploadDna('audio', e) :
                      slot.key === 'video' ? (e) => handleUploadDna('video', e) :
                      slot.key === 'lyrics' ? (e) => handleUploadDna('lyrics', e) : null
                    }
                    dnaUrl={
                      slot.key === 'visual' ? visualDnaUrl :
                      slot.key === 'audio' ? audioDnaUrl :
                      slot.key === 'video' ? videoDnaUrl :
                      slot.key === 'lyrics' ? lyricsDnaUrl : null
                    }
                    isUploadingDna={isUploadingDna[slot.key]}
                    onClearDna={() => {
                      if (slot.key === 'visual') setVisualDnaUrl(null);
                      if (slot.key === 'audio') setAudioDnaUrl(null);
                      if (slot.key === 'video') setVideoDnaUrl(null);
                      if (slot.key === 'lyrics') setLyricsDnaUrl(null);
                    }}
                  />
                );
              })()}
            </div>

            {/* Bottom Close Button - More Visible */}
            <div style={{
              padding: isMobile ? '12px' : '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)'
            }}>
              <button
                onClick={() => setMaximizedSlot(null)}
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2))',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '12px',
                  padding: isMobile ? '10px 20px' : '14px 32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontWeight: '700',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.2)'
                }}
              >
                <X size={20} />
                {isMobile ? 'Close' : 'Close Preview'}
              </button>
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
                className="btn-pill glass"
                style={{ flex: 1, padding: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="btn-pill primary"
                style={{ flex: 1, padding: '14px', fontWeight: '700' }}
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Dialog */}
      {showSaveConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <FolderPlus size={32} color="#22c55e" />
            </div>
            <h2 style={{
              margin: '0 0 12px',
              fontSize: '1.4rem',
              fontWeight: '700',
              color: 'white'
            }}>
              Project Saved! 🎉
            </h2>
            <p style={{
              margin: '0 0 24px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              Your project "{projectName || songIdea || 'Untitled'}" has been saved with {Object.values(outputs).filter(Boolean).length} assets.
            </p>
            
            {/* Asset quick list */}
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '12px', 
              padding: '12px', 
              marginBottom: '24px',
              textAlign: 'left'
            }}>
               <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Generated Content</div>
               {Object.entries(outputs).filter(([_, val]) => val !== null).map(([key, _]) => {
                 const slot = GENERATOR_SLOTS.find(s => s.key === key);
                 return (
                   <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: slot?.color || '#8b5cf6' }} />
                     {slot?.title || key}
                   </div>
                 );
               })}
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowSaveConfirm(false);
                  onClose?.();
                }}
                className="btn-pill glass"
                style={{
                  flex: 1,
                  padding: '14px',
                  fontWeight: '600'
                }}
              >
                Go to Hub
              </button>
              <button
                onClick={() => {
                  setShowSaveConfirm(false);
                  setShowPreviewModal(true);
                }}
                className="btn-pill primary"
                style={{
                  flex: 1,
                  padding: '14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Eye size={18} />
                Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog - Save Before Leaving */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10002,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <FolderPlus size={32} color="#f59e0b" />
            </div>
            <h2 style={{
              margin: '0 0 12px',
              fontSize: '1.4rem',
              fontWeight: '700',
              color: 'white'
            }}>
              Save Your Work?
            </h2>
            <p style={{
              margin: '0 0 24px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              You have {Object.values(safeOutputs).filter(Boolean).length + Object.values(safeMediaUrls).filter(Boolean).length} unsaved creations. Would you like to save before leaving?
            </p>
            
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  setShowCreateProject(true);
                }}
                className="btn-pill primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FolderPlus size={18} />
                Save Project
              </button>
              <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                  }}
                  className="btn-pill glass"
                  style={{
                    flex: 1,
                    padding: '12px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    onClose?.();
                  }}
                  className="btn-pill secondary"
                  style={{
                    flex: 1,
                    padding: '12px'
                  }}
                >
                  Discard & Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview All Creations Modal - Robust Version */}
      {showPreviewModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: previewMaximized ? '0' : '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPreviewModal(false);
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
            borderRadius: previewMaximized ? '0' : '20px',
            padding: previewMaximized ? '16px' : (isMobile ? '16px' : '24px'),
            border: previewMaximized ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
            width: previewMaximized ? '100%' : '100%',
            maxWidth: previewMaximized ? '100%' : '900px',
            height: previewMaximized ? '100%' : 'auto',
            maxHeight: previewMaximized ? '100%' : '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: previewMaximized ? 'none' : '0 25px 80px rgba(0,0,0,0.5)'
          }}>
            {/* Header with controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              position: 'sticky',
              top: 0,
              background: previewMaximized ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
              padding: previewMaximized ? '8px 0 16px' : '0',
              zIndex: 5
            }}>
              <h2 style={{
                margin: 0,
                fontSize: previewMaximized ? '1.75rem' : '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Eye size={previewMaximized ? 28 : 24} color="#8b5cf6" />
                Preview All Creations
              </h2>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Min/Max Toggle */}
                <button
                  onClick={() => setPreviewMaximized(!previewMaximized)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'pointer',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem'
                  }}
                  title={previewMaximized ? 'Minimize' : 'Maximize'}
                >
                  <Maximize2 size={18} />
                  {previewMaximized ? 'Minimize' : 'Maximize'}
                </button>
                
                {/* Close Button */}
                <button
                  onClick={() => setShowPreviewModal(false)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'pointer',
                    color: '#ef4444'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : (previewMaximized ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)'), 
              gap: isMobile ? '16px' : (previewMaximized ? '32px' : '24px'), 
              marginBottom: '24px' 
            }}>
              {/* Lyrics Preview - Always safe */}
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '16px',
                padding: isMobile ? '12px' : '16px',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: '#a78bfa', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} />
                    Lyrics
                  </h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: safeOutputs.lyrics ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100,100,100,0.2)',
                    color: safeOutputs.lyrics ? '#22c55e' : 'rgba(255,255,255,0.5)'
                  }}>
                    {safeOutputs.lyrics ? '✓ Ready' : 'Pending'}
                  </span>
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  minHeight: previewMaximized ? '300px' : '180px',
                  maxHeight: previewMaximized ? '400px' : '200px',
                  overflowY: 'auto',
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  color: safeOutputs.lyrics ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontStyle: safeOutputs.lyrics ? 'normal' : 'italic',
                  fontFamily: "'Georgia', 'Times New Roman', serif"
                }}>
                  {safeOutputs.lyrics || 'No lyrics generated yet. Use the Lyrics generator to create lyrics.'}
                </div>
              </div>

              {/* Beat Audio Preview - Safe audio handling */}
              <div style={{
                background: 'rgba(6, 182, 212, 0.1)',
                borderRadius: '16px',
                padding: isMobile ? '12px' : '16px',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: '#22d3ee', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Music size={18} />
                    Beat Audio
                  </h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: safeMediaUrls.audio ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100,100,100,0.2)',
                    color: safeMediaUrls.audio ? '#22c55e' : 'rgba(255,255,255,0.5)'
                  }}>
                    {safeMediaUrls.audio ? '✓ Ready' : 'Pending'}
                  </span>
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  minHeight: '100px'
                }}>
                  {safeMediaUrls.audio ? (
                    <>
                      <audio
                        controls
                        style={{ width: '100%', marginBottom: '12px' }}
                        src={formatAudioSrc(safeMediaUrls.audio)}
                        onError={(e) => console.warn('[Preview] Audio load error:', e)}
                      />
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Volume2 size={14} />
                        Audio ready to play
                      </div>
                    </>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.9rem',
                      padding: '24px',
                      fontStyle: 'italic'
                    }}>
                      No audio generated yet. Generate a beat to preview audio.
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Image Preview - Safe image handling */}
              <div style={{
                background: 'rgba(236, 72, 153, 0.1)',
                borderRadius: '16px',
                padding: isMobile ? '12px' : '16px',
                border: '1px solid rgba(236, 72, 153, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: '#f472b6', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={18} />
                    Cover Visual
                  </h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: safeMediaUrls.image ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100,100,100,0.2)',
                    color: safeMediaUrls.image ? '#22c55e' : 'rgba(255,255,255,0.5)'
                  }}>
                    {safeMediaUrls.image ? '✓ Ready' : 'Pending'}
                  </span>
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '12px',
                  padding: '8px',
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {safeMediaUrls.image ? (
                    <img
                      src={formatImageSrc(safeMediaUrls.image)}
                      alt="Cover Art"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        console.warn('[Preview] Image load error');
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.9rem',
                      fontStyle: 'italic'
                    }}>
                      No image generated yet
                    </div>
                  )}
                </div>
              </div>

              {/* Video Preview - Safe video handling */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '16px',
                padding: isMobile ? '12px' : '16px',
                border: musicVideoUrl ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(245, 158, 11, 0.3)',
                boxShadow: musicVideoUrl ? '0 0 15px rgba(34, 197, 94, 0.2)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: musicVideoUrl ? '#22c55e' : '#fbbf24', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {musicVideoUrl ? <Zap size={18} /> : <VideoIcon size={18} />}
                    {musicVideoUrl ? 'Professional Sync' : 'Concept Video'}
                  </h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: (musicVideoUrl || safeMediaUrls.video) ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100,100,100,0.2)',
                    color: (musicVideoUrl || safeMediaUrls.video) ? '#22c55e' : 'rgba(255,255,255,0.5)'
                  }}>
                    {musicVideoUrl ? '✓ Synced' : (safeMediaUrls.video ? '✓ Concept' : 'Pending')}
                  </span>
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '12px',
                  padding: '8px',
                  aspectRatio: '16/9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {(musicVideoUrl || safeMediaUrls.video) ? (
                    <video
                      src={formatVideoSrc(musicVideoUrl || safeMediaUrls.video)}
                      controls
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                        objectFit: 'contain',
                        backgroundColor: '#000'
                      }}
                      onError={(e) => console.warn('[Preview] Video load error:', e)}
                    />
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.9rem',
                      fontStyle: 'italic'
                    }}>
                      No video generated yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                fontSize: '0.9rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '6px', fontSize: '0.8rem' }}>Lyrics</div>
                  <div style={{ fontWeight: '700', color: '#a78bfa', fontSize: '1.1rem' }}>
                    {safeOutputs.lyrics ? `${safeOutputs.lyrics.length} chars` : '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '6px', fontSize: '0.8rem' }}>Audio</div>
                  <div style={{ fontWeight: '700', color: '#22d3ee', fontSize: '1.1rem' }}>
                    {safeMediaUrls.audio ? '✓ Ready' : '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '6px', fontSize: '0.8rem' }}>Visual</div>
                  <div style={{ fontWeight: '700', color: '#f472b6', fontSize: '1.1rem' }}>
                    {safeMediaUrls.image ? '✓ Ready' : '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '6px', fontSize: '0.8rem' }}>Video</div>
                  <div style={{ fontWeight: '700', color: '#fbbf24', fontSize: '1.1rem' }}>
                    {safeMediaUrls.video ? '✓ Ready' : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowPreviewModal(false)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Close Preview
              </button>
              
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setShowCreateProject(true);
                }}
                style={{
                  flex: 1,
                  minWidth: '140px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FolderPlus size={18} />
                Save Project
              </button>
              
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  handleCreateFinalMix();
                }}
                disabled={creatingFinalMix || !Object.values(safeOutputs).some(Boolean)}
                style={{
                  flex: 1,
                  minWidth: '140px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: (creatingFinalMix || !Object.values(safeOutputs).some(Boolean)) 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : 'rgba(34, 197, 94, 0.5)',
                  border: '1px solid rgba(34, 197, 94, 0.6)',
                  color: '#22c55e',
                  fontWeight: '600',
                  cursor: (creatingFinalMix || !Object.values(safeOutputs).some(Boolean)) ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: !Object.values(safeOutputs).some(Boolean) ? 0.5 : 1
                }}
              >
                {creatingFinalMix ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Final Mix
                  </>
                )}
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
