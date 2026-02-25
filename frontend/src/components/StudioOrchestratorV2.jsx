/* eslint-disable no-use-before-define */
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { 
  Sparkles, Mic, MicOff, FileText, Video as VideoIcon, RefreshCw, Zap, 
  Music, Image as ImageIcon, Download, FolderPlus, Volume2, VolumeX, X,
  Loader2, Maximize2, Users, Eye, Edit3, Trash2, Copy, Lightbulb,
  Settings, CheckCircle2, Lock as LockIcon, User, CircleHelp,
  ChevronUp, ChevronDown, Upload
} from 'lucide-react';
import { BACKEND_URL, AGENTS, getAgentHex } from '../constants';
import toast from 'react-hot-toast';
import { db, auth, doc, setDoc, updateDoc, increment, getDoc } from '../firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
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

// ═══════════════════════════════════════════════════════════════════════════════
// GENRE PRESETS - Smart defaults per genre
// ═══════════════════════════════════════════════════════════════════════════════
const GENRE_PRESETS = {
  'Trap':             { bpm: 140, mood: 'Dark',      structure: 'Full Song', duration: 180 },
  'Drill':            { bpm: 140, mood: 'Dark',      structure: 'Full Song', duration: 180 },
  'Modern Hip-Hop':   { bpm: 130, mood: 'Energetic', structure: 'Full Song', duration: 180 },
  '90s Boom Bap':     { bpm: 90,  mood: 'Chill',     structure: 'Full Song', duration: 180 },
  'R&B / Soul':       { bpm: 100, mood: 'Dreamy',    structure: 'Full Song', duration: 180 },
  'Pop':              { bpm: 120, mood: 'Happy',     structure: 'Full Song', duration: 180 },
  'Rock':             { bpm: 130, mood: 'Energetic', structure: 'Full Song', duration: 180 },
  'Electronic / EDM': { bpm: 128, mood: 'Energetic', structure: 'Full Song', duration: 180 },
  'Lo-Fi':            { bpm: 80,  mood: 'Chill',     structure: 'Loop',      duration: 120 },
  'Afrobeat':         { bpm: 110, mood: 'Energetic', structure: 'Full Song', duration: 180 },
  'Reggaeton':        { bpm: 95,  mood: 'Energetic', structure: 'Full Song', duration: 180 },
  'K-Pop':            { bpm: 125, mood: 'Happy',     structure: 'Full Song', duration: 180 },
  'J-Pop':            { bpm: 130, mood: 'Happy',     structure: 'Full Song', duration: 180 },
  'Amapiano':         { bpm: 113, mood: 'Chill',     structure: 'Full Song', duration: 180 },
  'Phonk':            { bpm: 140, mood: 'Dark',      structure: 'Full Song', duration: 180 },
  'Dancehall':        { bpm: 100, mood: 'Energetic', structure: 'Full Song', duration: 180 },
  'Latin Trap':       { bpm: 140, mood: 'Dark',      structure: 'Full Song', duration: 180 },
  'Country':          { bpm: 110, mood: 'Happy',     structure: 'Full Song', duration: 180 },
  'Jazz':             { bpm: 120, mood: 'Chill',     structure: 'Full Song', duration: 180 },
  'Classical':        { bpm: 100, mood: 'Epic',      structure: 'Full Song', duration: 240 },
  'Gospel':           { bpm: 110, mood: 'Epic',      structure: 'Full Song', duration: 180 },
  'Reggae':           { bpm: 80,  mood: 'Chill',     structure: 'Full Song', duration: 180 },
  'Metal':            { bpm: 160, mood: 'Dark',      structure: 'Full Song', duration: 180 },
  'Punk':             { bpm: 170, mood: 'Energetic', structure: 'Full Song', duration: 120 },
  'Funk':             { bpm: 110, mood: 'Energetic', structure: 'Full Song', duration: 180 },
  'Disco':            { bpm: 120, mood: 'Happy',     structure: 'Full Song', duration: 180 },
  'Synthwave':        { bpm: 118, mood: 'Dreamy',    structure: 'Full Song', duration: 180 },
  'Indie':            { bpm: 115, mood: 'Dreamy',    structure: 'Full Song', duration: 180 },
  'Acoustic':         { bpm: 100, mood: 'Chill',     structure: 'Full Song', duration: 180 },
  'Bollywood':        { bpm: 130, mood: 'Energetic', structure: 'Full Song', duration: 180 },
  'Afro-Pop':         { bpm: 105, mood: 'Happy',     structure: 'Full Song', duration: 180 },
  'Cumbia':           { bpm: 95,  mood: 'Happy',     structure: 'Full Song', duration: 180 },
};

const ALL_GENRES = Object.keys(GENRE_PRESETS);

// ═══════════════════════════════════════════════════════════════════════════════
// ALL LANGUAGES - Global coverage
// ═══════════════════════════════════════════════════════════════════════════════
const ALL_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Portuguese',
  'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Hindi', 'Arabic', 'Turkish', 'Russian',
  'Italian', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech',
  'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Filipino/Tagalog',
  'Swahili', 'Yoruba', 'Zulu', 'Amharic', 'Persian/Farsi', 'Urdu', 'Bengali',
  'Tamil', 'Telugu', 'Punjabi', 'Ukrainian', 'Romanian', 'Hungarian', 'Croatian', 'Serbian'
];

// ═══════════════════════════════════════════════════════════════════════════════
// OUTPUT FORMAT PRESETS - Platform-optimized profiles
// ═══════════════════════════════════════════════════════════════════════════════
const OUTPUT_PRESETS = {
  'Full Song Release':  { duration: 180, structure: 'Full Song',  outputFormat: 'music',   useBars: false, icon: '💿' },
  'TikTok / Reels':     { duration: 30,  structure: 'Chorus',     outputFormat: 'social',  useBars: false, icon: '📱' },
  'YouTube Music Video': { duration: 180, structure: 'Full Song',  outputFormat: 'music',   useBars: false, icon: '🎬' },
  'Spotify Single':     { duration: 180, structure: 'Radio Edit', outputFormat: 'music',   useBars: false, icon: '🎧' },
  'Ad / Commercial':    { duration: 30,  structure: 'Loop',       outputFormat: 'tv',      useBars: false, icon: '📺' },
  'Podcast Intro':      { duration: 15,  structure: 'Intro',      outputFormat: 'podcast', useBars: false, icon: '🎙️' },
  'Instagram Story':    { duration: 15,  structure: 'Chorus',     outputFormat: 'social',  useBars: false, icon: '📷' },
  'DJ Loop':            { duration: 60,  structure: 'Loop',       outputFormat: 'music',   useBars: true,  icon: '🎛️' },
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
  isUploadingDna = false,
  provider = null
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
        padding: isMobile ? '8px' : '1.25rem',
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
              {/* DNA Reference Active Badge */}
              {dnaUrl && (
                <span style={{ padding: '1px 6px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', borderRadius: '4px', fontSize: '0.55rem', fontWeight: '700', border: '1px solid rgba(34, 197, 94, 0.3)' }}>DNA REF</span>
              )}
              {/* Provider Quality Badge */}
              {provider && !isLoading && (output || mediaUrl) && (() => {
                const providerLabels = {
                  'elevenlabs-premium': { label: 'ElevenLabs', tier: 'Premium', color: '#818cf8' },
                  'elevenlabs': { label: 'ElevenLabs', tier: 'Premium', color: '#818cf8' },
                  'gemini-tts': { label: 'Gemini TTS', tier: 'Standard', color: '#60a5fa' },
                  'bark': { label: 'Bark', tier: 'Standard', color: '#60a5fa' },
                  'suno': { label: 'Suno', tier: 'Premium', color: '#818cf8' },
                  'udio': { label: 'Udio', tier: 'Premium', color: '#818cf8' },
                  'replicate-flux': { label: 'Flux', tier: 'Premium', color: '#818cf8' },
                  'flux-1.1-pro': { label: 'Flux Pro', tier: 'Premium', color: '#818cf8' },
                  'nano-banana': { label: 'Gemini', tier: 'Standard', color: '#60a5fa' },
                  'imagen-4': { label: 'Imagen 4', tier: 'Premium', color: '#818cf8' },
                  'veo-3.0-fast': { label: 'Veo 3.0', tier: 'Premium', color: '#818cf8' },
                  'veo-2.0': { label: 'Veo 2.0', tier: 'Standard', color: '#60a5fa' },
                  'replicate-minimax': { label: 'Minimax', tier: 'Standard', color: '#60a5fa' },
                };
                const info = providerLabels[provider] || { label: provider, tier: '', color: '#94a3b8' };
                return (
                  <span style={{ padding: '1px 6px', background: `${info.color}1A`, color: info.color, borderRadius: '4px', fontSize: '0.55rem', fontWeight: '600', border: `1px solid ${info.color}33` }}>
                    {info.label}{info.tier ? ` (${info.tier})` : ''}
                  </span>
                );
              })()}
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
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
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
                className={!isGeneratingMedia ? 'pulse-next-btn' : ''}
                onClick={onGenerateMedia}
                disabled={isGeneratingMedia}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: `rgba(255,255,255,${isGeneratingMedia ? '0.03' : '0.07'})`,
                  border: `1px solid ${color}60`,
                  color: color,
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: isGeneratingMedia ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {isGeneratingMedia ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <>
                    {slot === 'lyrics' && <Mic size={16} />}
                    {mediaType === 'audio' && <Music size={16} />}
                    {mediaType === 'image' && <ImageIcon size={16} />}
                    {mediaType === 'video' && <VideoIcon size={16} />}
                  </>
                )}
                {isGeneratingMedia ? 'Creating...' :
                 slot === 'lyrics' ? 'Next: Create Vocals' :
                 slot === 'audio' ? 'Next: Create Beat Audio' :
                 slot === 'visual' ? 'Next: Create Artwork' :
                 'Next: Create Video'}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Action Bar */}
      {output && !isEditing && (
        <div style={{
          padding: isMobile ? '6px 8px 8px' : '12px 20px 16px',
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
  setMaximizedSlot,
  visualType,
  setVisualType,
  isMobile,
  orchestratorBpm = 120,
  mixVocalVolume,
  mixBeatVolume,
  setMixVocalVolume,
  setMixBeatVolume
}) {
  // Check completion status
  const completedCount = Object.values(outputs).filter(Boolean).length;
  const totalSlots = 4;
  const allComplete = completedCount === totalSlots;
  const hasAnyOutput = completedCount > 0;
  const progressPercent = (completedCount / totalSlots) * 100;

  // Media presence
  const hasBeat = !!mediaUrls.audio;
  const hasVocalMedia = !!mediaUrls.vocals || !!mediaUrls.lyricsVocal;
  const hasVocals = hasVocalMedia || !!outputs.lyrics;
  const hasVideo = !!mediaUrls.video;
  const hasVisual = !!mediaUrls.image;
  const isSyncAvailable = hasBeat && (hasVideo || hasVocals || hasVisual);
  const isSyncComplete = !!musicVideoUrl;

  return (
    <div style={{
      background: allComplete 
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))'
        : 'rgba(15, 23, 42, 0.4)',
      borderRadius: isMobile ? '16px' : '24px',
      padding: isMobile ? '14px' : '28px',
      border: '1px solid rgba(255,255,255,0.1)',
      marginTop: '32px',
      position: 'relative',
      overflow: 'visible',
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

          {/* Sync Picker — select which assets to include in mix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {/* Toggle Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { key: 'beat', label: 'Beat', available: hasBeat, color: '#22d3ee' },
                { key: 'vocals', label: 'Vocals', available: hasVocalMedia, color: '#a78bfa' },
                { key: 'artwork', label: 'Artwork', available: hasVisual, color: '#fb923c' },
                { key: 'video', label: 'Video', available: hasVideo || isSyncComplete, color: '#f87171' }
              ].map(chip => {
                const isAvail = chip.available;
                return (
                  <div
                    key={chip.key}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      background: isAvail ? `${chip.color}18` : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isAvail ? `${chip.color}50` : 'rgba(255,255,255,0.08)'}`,
                      color: isAvail ? chip.color : 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: isAvail ? 1 : 0.5
                    }}
                  >
                    {isAvail ? <CheckCircle2 size={13} /> : <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)' }} />}
                    {chip.label}
                  </div>
                );
              })}
            </div>

            {/* Volume Controls — visible when both beat and vocals present */}
            {hasBeat && hasVocalMedia && setMixVocalVolume && setMixBeatVolume && (
              <div style={{
                display: 'flex',
                gap: isMobile ? '12px' : '20px',
                flexWrap: 'wrap',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '120px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#22d3ee', width: '40px' }}>Beat</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={mixBeatVolume}
                    onChange={(e) => setMixBeatVolume(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#22d3ee', height: '4px' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', width: '30px', textAlign: 'right' }}>{Math.round(mixBeatVolume * 100)}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '120px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#a78bfa', width: '40px' }}>Vocal</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={mixVocalVolume}
                    onChange={(e) => setMixVocalVolume(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#a78bfa', height: '4px' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', width: '30px', textAlign: 'right' }}>{Math.round(mixVocalVolume * 100)}%</span>
                </div>
              </div>
            )}

            {/* Create Mix + Preview buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  if (hasBeat || hasVocalMedia) {
                    handleCreateFinalMix();
                  } else {
                    toast('Generate beat or vocals first to create a mix', { icon: 'ℹ️' });
                  }
                }}
                disabled={(!hasBeat && !hasVocalMedia) || creatingFinalMix}
                style={{
                  padding: '12px 24px',
                  borderRadius: '14px',
                  background: (hasBeat || hasVocalMedia)
                    ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                    : 'rgba(255,255,255,0.05)',
                  border: (hasBeat || hasVocalMedia) ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  color: (hasBeat || hasVocalMedia) ? 'white' : 'rgba(255,255,255,0.3)',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: (hasBeat || hasVocalMedia) && !creatingFinalMix ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: (hasBeat || hasVocalMedia) ? '0 6px 20px rgba(79, 70, 229, 0.35)' : 'none',
                  transition: 'all 0.3s ease',
                  flex: 1,
                  justifyContent: 'center',
                  minHeight: '44px'
                }}
              >
                {creatingFinalMix ? (
                  <><Loader2 size={16} className="spin" /> Mixing...</>
                ) : (
                  <><Zap size={16} /> Create Mix</>
                )}
              </button>

              {finalMixPreview && (
                <button
                  onClick={() => { setMaximizedSlot(null); setShowPreviewModal(true); }}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '14px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#4ade80',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: '44px'
                  }}
                >
                  <Eye size={16} /> Preview
                </button>
              )}
            </div>
          </div>

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
  onGoToHub = null,
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
  const [generatingSlots, setGeneratingSlots] = useState({
    lyrics: false, audio: false, visual: false, video: false
  });
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
    lyricsVocal: null, // Unified key for lyrics+vocal
    mixedAudio: null   // Vocal + beat mixed master
  });
  // Track which AI provider generated each asset (for quality indicators)
  const [generationProviders, setGenerationProviders] = useState({});
  // Ref mirror so async pipeline code can read latest values
  const mediaUrlsRef = useRef(mediaUrls);
  mediaUrlsRef.current = mediaUrls;
  const skipRegenerateGuard = useRef(false); // Skip the save/clear prompt when called from dialog buttons
  const handleGenerateRef = useRef(null); // Stable ref to handleGenerate for callbacks
  const handleCreateProjectRef = useRef(null); // Stable ref to handleCreateProject for callbacks
  
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
  const [songStructure, setSongStructure] = useState('full'); // Song structure: single, full, extended
  const [maximizedSlot, setMaximizedSlot] = useState(null); // Track which card is maximized
  const [showVocalFullscreen, setShowVocalFullscreen] = useState(false); // Vocal audio fullscreen modal
  const [deleteVoiceTarget, setDeleteVoiceTarget] = useState(null); // Voice to confirm deletion
  const [creatingFinalMix, setCreatingFinalMix] = useState(false);
  const [finalMixPreview, setFinalMixPreview] = useState(null);
  const [mixVocalVolume, setMixVocalVolume] = useState(0.85); // Vocal volume for final mix (0-1)
  const [mixBeatVolume, setMixBeatVolume] = useState(0.60); // Beat volume for final mix (0-1)
  const [generatingMusicVideo, setGeneratingMusicVideo] = useState(false);
  const [musicVideoUrl, setMusicVideoUrl] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false); // Preview all creations before final mix
  const [previewMaximized, setPreviewMaximized] = useState(false); // Min/max view toggle for preview
  const [showSaveConfirm, setShowSaveConfirm] = useState(false); // Save confirmation dialog
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false); // Exit confirmation for unsaved work
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false); // Save/clear before re-generating
  const [isSaved, setIsSaved] = useState(!!existingProject); // Existing projects start as saved
  const [visualType, setVisualType] = useState('image'); // 'image' or 'video' for final mix output
  const [quickMode, setQuickMode] = useState(true); // Quick Create vs Advanced Mode
  const [quickGenre, setQuickGenre] = useState('Modern Hip-Hop'); // Genre for Quick Create
  const [selectedOutputPreset, setSelectedOutputPreset] = useState('Full Song Release'); // Output format preset
  const [pipelineSteps, setPipelineSteps] = useState([]); // Live progress feed
  const [voiceSampleUrl, setVoiceSampleUrl] = useState(null); // URL of uploaded voice sample for cloning
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(localStorage.getItem('studio_elevenlabs_voice_id') || '');
  const [isUploadingSample, setIsUploadingSample] = useState(false);
  const [savedVoices, setSavedVoices] = useState([]); // List of voices saved in Firestore
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [elVoices, setElVoices] = useState([]); // ElevenLabs professional voices
  const [loadingElVoices, setLoadingElVoices] = useState(false);

  // ElevenLabs IVC (Instant Voice Cloning) state
  const [voiceSamples, setVoiceSamples] = useState([]); // [{name, url, base64}, ...]
  const [isCloningVoice, setIsCloningVoice] = useState(false);
  const [clonedVoiceId, setClonedVoiceId] = useState(null); // ElevenLabs voice_id from IVC
  const [showAssets, setShowAssets] = useState(true); // Your Assets section visibility

  // New DNA States for other agents
  const [visualDnaUrl, setVisualDnaUrl] = useState(null);
  const [audioDnaUrl, setAudioDnaUrl] = useState(null);
  const [videoDnaUrl, setVideoDnaUrl] = useState(null); // Image used for image-to-video
  const [lyricsDnaUrl, setLyricsDnaUrl] = useState(null); // Text file or PDF as reference
  const [isUploadingDna, setIsUploadingDna] = useState({ visual: false, audio: false, video: false, lyrics: false });

  
  // Industrial Strength State Preservation (Fixes closure issues in auto-triggering)
  const outputsRef = useRef(outputs);
  const recognitionRef = useRef(null);
  const vocalAudioRef = useRef(null);

  // Safe getters for outputs and mediaUrls to prevent TDZ/null errors
  const safeOutputs = outputs || { lyrics: null, audio: null, visual: null, video: null };
  const safeMediaUrls = mediaUrls || { audio: null, image: null, video: null };

  // ESC key handler — closes topmost modal (highest z-index first)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== 'Escape') return;
      if (showRegenerateConfirm) { setShowRegenerateConfirm(false); return; }
      if (showExitConfirm) { setShowExitConfirm(false); return; }
      if (showSaveConfirm) { setShowSaveConfirm(false); return; }
      if (showCreateProject) { setShowCreateProject(false); return; }
      if (showPreviewModal) { setShowPreviewModal(false); return; }
      if (maximizedSlot) { setMaximizedSlot(null); return; }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showRegenerateConfirm, showExitConfirm, showSaveConfirm, showCreateProject, showPreviewModal, maximizedSlot]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS: Genre & Output Presets
  // ═══════════════════════════════════════════════════════════════════════════════
  const applyGenrePreset = useCallback((genreName) => {
    const preset = GENRE_PRESETS[genreName];
    if (!preset) return;
    setStyle(genreName);
    setProjectBpm(preset.bpm);
    setMood(preset.mood);
    setStructure(preset.structure);
    setDuration(preset.duration);
  }, []);

  const applyOutputPreset = useCallback((presetName) => {
    const preset = OUTPUT_PRESETS[presetName];
    if (!preset) return;
    setSelectedOutputPreset(presetName);
    setDuration(preset.duration);
    setStructure(preset.structure);
    setOutputFormat(preset.outputFormat);
    setUseBars(preset.useBars);
  }, []);

  // Pipeline progress helper
  const updatePipelineStep = useCallback((stepId, status) => {
    setPipelineSteps(prev => prev.map(step =>
      step.id === stepId
        ? { ...step, status, ...(status === 'active' ? { startTime: Date.now() } : {}), ...(status === 'done' || status === 'error' ? { endTime: Date.now() } : {}) }
        : step
    ));
  }, []);

  // Reusable helper: mux audio into silent video, with 1 retry and toast feedback
  const autoMuxVideoWithAudio = useCallback(async (videoUrl, audioUrl, headers) => {
    const attemptMux = async () => {
      const resp = await fetch(`${BACKEND_URL}/api/mux-audio-video`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          audioUrl,
          videoUrl,
          title: (songIdea || 'song').substring(0, 50)
        })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Mux failed (${resp.status})`);
      }
      return resp.json();
    };

    try {
      console.log('[Mux] Starting audio+video mux');
      let muxData;
      try {
        muxData = await attemptMux();
      } catch (firstErr) {
        console.warn('[Mux] First attempt failed, retrying in 3s...', firstErr.message);
        await new Promise(r => setTimeout(r, 3000));
        muxData = await attemptMux();
      }

      if (muxData?.muxedVideoUrl) {
        setMediaUrls(prev => ({ ...prev, video: muxData.muxedVideoUrl }));
        mediaUrlsRef.current = { ...mediaUrlsRef.current, video: muxData.muxedVideoUrl }; // Sync ref for pipeline reads
        console.log('[Mux] Video muxed with audio successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Mux] All attempts failed:', err.message);
      toast.error('Video created but audio sync failed — video may be silent', { duration: 6000 });
      return false;
    }
  }, [songIdea]);

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

  // Reset and restore state when switching between projects
  useEffect(() => {
    // Reset all generation state on project switch
    setOutputs({ lyrics: null, audio: null, visual: null, video: null });
    setMediaUrls({ audio: null, image: null, video: null, vocals: null, lyricsVocal: null, mixedAudio: null });
    setGenerationProviders({});
    setMusicVideoUrl(null);
    setFinalMixPreview(null);
    setPipelineSteps([]);
    setGeneratingMedia({ audio: false, image: false, video: false, vocals: false });
    setVisualDnaUrl(null);
    setAudioDnaUrl(null);
    setVideoDnaUrl(null);
    setLyricsDnaUrl(null);
    setIsSaved(!!existingProject);

    // Restore project settings (useState initializers only run on first mount)
    setSongIdea(existingProject?.name || '');
    setLanguage(existingProject?.language || 'English');
    setStyle(existingProject?.style || 'Modern Hip-Hop');
    setDuration(existingProject?.duration || 90);
    setBars(existingProject?.musicalBars || 16);
    setUseBars(existingProject?.useBars ?? true);
    setProjectBpm(existingProject?.bpm || existingProject?.settings?.bpm || 120);
    setMood(existingProject?.mood || 'Energetic');
    setStructure(existingProject?.structure || 'Full Song');

    // Then restore from new project's assets
    if (!existingProject?.assets?.length) return;

    const restoredUrls = {};
    const restoredOutputs = {};

    for (const asset of existingProject.assets) {
      if (asset.type === 'beat' || asset.type === 'audio') {
        if (asset.audioUrl && !restoredUrls.audio) restoredUrls.audio = asset.audioUrl;
        if (asset.content && !restoredOutputs.audio) restoredOutputs.audio = asset.content;
      }
      if (asset.type === 'vocal') {
        if (asset.audioUrl && !restoredUrls.vocals) {
          restoredUrls.vocals = asset.audioUrl;
          restoredUrls.lyricsVocal = asset.audioUrl;
        }
      }
      if (asset.type === 'image' || asset.type === 'cover' || asset.type === 'visual') {
        if ((asset.imageUrl || asset.url) && !restoredUrls.image) restoredUrls.image = asset.imageUrl || asset.url;
        if (asset.content && !restoredOutputs.visual) restoredOutputs.visual = asset.content;
      }
      if (asset.type === 'video') {
        if (asset.videoUrl && !restoredUrls.video) restoredUrls.video = asset.videoUrl;
        if (asset.isPremium && asset.videoUrl) setMusicVideoUrl(asset.videoUrl);
        if (asset.content && !restoredOutputs.video) restoredOutputs.video = asset.content;
      }
      if (asset.type === 'lyrics') {
        if (asset.content && !restoredOutputs.lyrics) restoredOutputs.lyrics = asset.content;
      }
    }

    if (Object.keys(restoredUrls).length > 0) {
      setMediaUrls(prev => ({ ...prev, ...restoredUrls }));
      console.log('[Orchestrator] Restored mediaUrls from project assets', Object.keys(restoredUrls));
    }
    if (Object.keys(restoredOutputs).length > 0) {
      setOutputs(prev => ({ ...prev, ...restoredOutputs }));
      console.log('[Orchestrator] Restored outputs from project assets', Object.keys(restoredOutputs));
    }

    // Restore voice/generation settings from vocal asset metadata
    for (const asset of existingProject.assets) {
      if ((asset.type === 'vocal' || asset.type === 'mix') && asset.settings) {
        if (asset.settings.voiceStyle) setVoiceStyle(asset.settings.voiceStyle);
        if (asset.settings.elevenLabsVoiceId) setElevenLabsVoiceId(asset.settings.elevenLabsVoiceId);
        if (asset.settings.voiceSampleUrl) setVoiceSampleUrl(asset.settings.voiceSampleUrl);
        if (asset.settings.vocalQuality) setVocalQuality(asset.settings.vocalQuality);
        if (asset.settings.outputFormat) setOutputFormat(asset.settings.outputFormat);
        console.log('[Orchestrator] Restored voice settings from asset', asset.id);
        break; // Use most recent vocal/mix asset
      }
    }
  }, [existingProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const headers = await getHeaders();
        const response = await fetch(`${BACKEND_URL}/api/v2/voices`, { headers });
        if (response.ok) {
          const voices = await response.json();
          setElVoices(voices);
        } else {
          console.warn('[Orchestrator] ElevenLabs voices unavailable (status:', response.status, ')— using manual voice ID input');
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
          if (userData.clonedVoiceId) {
            setClonedVoiceId(userData.clonedVoiceId);
            setElevenLabsVoiceId(userData.clonedVoiceId);
            setVoiceStyle('cloned');
          }
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
      mediaType: null
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

  // Clear all outputs and generate fresh
  const clearAndGenerate = useCallback(() => {
    setOutputs({ lyrics: null, audio: null, visual: null, video: null });
    setMediaUrls({ audio: null, image: null, video: null, vocals: null, lyricsVocal: null, mixedAudio: null });
    setGenerationProviders({});
    setMusicVideoUrl(null);
    setFinalMixPreview(null);
    setVisualDnaUrl(null);
    setAudioDnaUrl(null);
    setVideoDnaUrl(null);
    setLyricsDnaUrl(null);
    setIsSaved(false);
    setPipelineSteps([]);
    setShowRegenerateConfirm(false);
    skipRegenerateGuard.current = true;
    // Let state flush, then trigger generation via ref (always latest)
    setTimeout(() => handleGenerateRef.current?.(), 0);
  }, []);

  // Save current project then clear and generate
  const saveAndGenerate = useCallback(() => {
    setShowRegenerateConfirm(false);
    handleCreateProjectRef.current?.(); // saves and sets isSaved=true
    // After saving, clear outputs for fresh generation
    setOutputs({ lyrics: null, audio: null, visual: null, video: null });
    setMediaUrls({ audio: null, image: null, video: null, vocals: null, lyricsVocal: null, mixedAudio: null });
    setGenerationProviders({});
    setMusicVideoUrl(null);
    setFinalMixPreview(null);
    setVisualDnaUrl(null);
    setAudioDnaUrl(null);
    setVideoDnaUrl(null);
    setLyricsDnaUrl(null);
    setPipelineSteps([]);
    skipRegenerateGuard.current = true;
    setTimeout(() => handleGenerateRef.current?.(), 0);
  }, []);

  // Main generation function
  const handleGenerate = async () => {
    // PREVENT DUPLICATE CALLS
    if (isGenerating) return;

    // Track whether we're starting fresh (state was cleared)
    let freshGeneration = false;

    // If there's existing unsaved content, prompt user to save or clear first
    if (!skipRegenerateGuard.current) {
      const hasContent = Object.values(outputs).some(Boolean) ||
                         Object.values(mediaUrls).some(v => v);
      if (hasContent && !isSaved) {
        setShowRegenerateConfirm(true);
        return;
      }
      // If already saved, silently clear old outputs before generating new
      if (hasContent && isSaved) {
        setOutputs({ lyrics: null, audio: null, visual: null, video: null });
        setMediaUrls({ audio: null, image: null, video: null, vocals: null, lyricsVocal: null, mixedAudio: null });
        setMusicVideoUrl(null);
        setFinalMixPreview(null);
        setVisualDnaUrl(null);
        setAudioDnaUrl(null);
        setVideoDnaUrl(null);
        setLyricsDnaUrl(null);
        setIsSaved(false);
        setPipelineSteps([]);
        freshGeneration = true;
      }
    } else {
      // Called from clearAndGenerate/saveAndGenerate — state was already cleared
      freshGeneration = true;
    }
    skipRegenerateGuard.current = false;

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

    // Build pipeline steps based on active slots
    const steps = [];
    if (selectedAgents.lyrics) steps.push({ id: 'lyrics', label: 'Writing lyrics', status: 'pending', startTime: null, endTime: null });
    if (selectedAgents.audio) steps.push({ id: 'beat-desc', label: 'Composing beat description', status: 'pending', startTime: null, endTime: null });
    if (selectedAgents.visual) steps.push({ id: 'visual-desc', label: 'Designing album art concept', status: 'pending', startTime: null, endTime: null });
    if (selectedAgents.audio) steps.push({ id: 'beat-audio', label: 'Generating beat audio', status: 'pending', startTime: null, endTime: null });
    if (selectedAgents.visual) steps.push({ id: 'image', label: 'Creating album artwork', status: 'pending', startTime: null, endTime: null });
    if (selectedAgents.lyrics) steps.push({ id: 'vocals', label: 'Recording AI vocals', status: 'pending', startTime: null, endTime: null });
    if (selectedAgents.video) steps.push({ id: 'video', label: 'Producing music video', status: 'pending', startTime: null, endTime: null });
    if (selectedAgents.video && selectedAgents.audio) steps.push({ id: 'mux', label: 'Syncing audio to video', status: 'pending', startTime: null, endTime: null });
    steps.push({ id: 'final', label: 'Creating final mix', status: 'pending', startTime: null, endTime: null });
    setPipelineSteps(steps);
    
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

        setGeneratingSlots(prev => ({ ...prev, [slot]: true }));
        const slotConfig = GENERATOR_SLOTS.find(s => s.key === slot);
        // Update pipeline step
        const stepId = slot === 'audio' ? 'beat-desc' : slot === 'visual' ? 'visual-desc' : slot;
        updatePipelineStep(stepId, 'active');
        
        const systemPrompt = `You are ${agent.name}, an elite Billboard-standard ${agent.category} specialist with multiple Grammy and Billboard #1 credits.
        Your mission: create content for a ${style} track about "${songIdea}" in ${language} that is indistinguishable from a major-label release.
        Output Format: ${outputFormat || 'music'} — tailor all output to match ${outputFormat} broadcast/distribution standards.
        ${contextLyrics ? `LYRICS CONTEXT — use these to match the emotional arc, tempo, and vibe:\n"${String(contextLyrics).substring(0, 1500)}"` : ''}
        ${slot === 'lyrics' ? `LYRICS AGENT INSTRUCTIONS:
Write ONLY the lyrics with clear section labels: [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Outro].
SONG STRUCTURE: ${songStructure === 'single' ? 'SHORT FORMAT — 1 Verse + 1 Chorus + 1 Verse (radio single, ~2 minutes)' : songStructure === 'extended' ? 'EXTENDED FORMAT — 3 Verses + 2 Choruses + Bridge + Outro (full album track, ~4 minutes)' : 'FULL TRACK — 2 Verses + Chorus + Bridge + Final Chorus (standard release, ~3 minutes)'}
REQUIREMENTS:
- The CHORUS/HOOK must be catchy enough to get stuck in someone's head after one listen
- Use multi-syllable rhyme schemes (AABB or ABAB), internal rhymes, and wordplay
- Include Suno-style performance/vocal tags: [Hard Hitting Rap], [Soulful Vocals], [Building Intensity], [Ad-lib: yeah!], [Whispered]
- Every line must have rhythmic cadence that locks to the beat's groove
- Use vivid metaphors, emotional specificity, and cultural references — zero generic filler
- Match the flow and delivery style of current chart-topping ${style} artists
- NO intro text, NO commentary, NO explanations — ONLY lyrics with section labels` : ''}
        ${slot === 'audio' ? `BEAT DNA AGENT INSTRUCTIONS:
Describe a Billboard-ready instrumental concept (${useBars ? bars + ' bars' : duration + ' seconds'}, BPM: ${projectBpm}).
REQUIREMENTS:
- Reference specific production techniques: drum patterns, bass type, synth textures, FX
- Name the sonic palette: what instruments, what key, what mood progression
- Describe the arrangement arc: how the beat builds from intro through drops
- Use producer-level terminology (808 glides, sidechain, hi-hat rolls, vocal chops, etc.)
- Keep under 60 words for maximum AI audio model compatibility
- Think: what would Metro Boomin, Pharrell, or Max Martin describe for this track?` : ''}
        ${slot === 'visual' ? 'Describe a striking, iconic album cover concept with specific visual direction: color palette, composition, typography style, mood lighting, and cultural aesthetic. Think major-label art direction.' : ''}
        ${slot === 'video' ? 'Write a cinematic music video storyboard with precise scene descriptions, camera movements, lighting, wardrobe, locations, and narrative arc. Think Hype Williams or Dave Meyers visual storytelling.' : ''}`;
        
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
            setGeneratingSlots(prev => ({ ...prev, [slot]: false }));
            console.log(`[handleGenerate] ${slot} generated successfully`);
            updatePipelineStep(stepId, 'done');
            
            // Track media generation promises so we can sequence the pipeline
            if (slot === 'audio') {
              // Beat description ready → queue beat audio generation (starts immediately)
              updatePipelineStep('beat-audio', 'active');
              pipelinePromises.beatAudio = handleGenerateAudio(data.output).then(() => updatePipelineStep('beat-audio', 'done')).catch(() => updatePipelineStep('beat-audio', 'error'));
            } else if (slot === 'visual') {
              updatePipelineStep('image', 'active');
              pipelinePromises.image = handleGenerateImage(data.output).then(() => updatePipelineStep('image', 'done')).catch(() => updatePipelineStep('image', 'error'));
            } else if (slot === 'video') {
              // Save video description for later — video gen needs mixed audio first
              pipelinePromises.videoDescription = data.output;
            }
            // NOTE: lyrics→vocals is handled AFTER beat completes (see pipeline sequencing below)
            return data.output;
          } else {
            const errorText = await response.text();
            console.error(`[handleGenerate] ${slot} failed:`, response.status, errorText);
            setGeneratingSlots(prev => ({ ...prev, [slot]: false }));
            updatePipelineStep(stepId, 'error');
            toast.error(`Agent ${agent.name} failed: ${response.status}`, { icon: '❌' });
            return null;
          }
        } catch (err) {
          console.error(`Error generating ${slot}:`, err);
          setGeneratingSlots(prev => ({ ...prev, [slot]: false }));
          updatePipelineStep(stepId, 'error');
          toast.error(`Connection Error: ${slot} generation failed.`, { icon: '📡' });
          return null;
        }
      };

      // RUN SEQUENTIALLY: Lyrics first to provide context for other agents
      const lyricsSlot = activeSlots.find(([s]) => s === 'lyrics');
      let lyricsResult = '';
      
      if (lyricsSlot) {
        // Skip lyrics generation only if NOT a fresh generation and already have vocals
        if (!freshGeneration && outputs.lyrics && (mediaUrls.vocals || mediaUrls.lyricsVocal)) {
          lyricsResult = outputs.lyrics;
          console.log('[Orchestrator] Skipping lyrics — already generated');
        } else {
          lyricsResult = await generateForSlot(lyricsSlot[0], lyricsSlot[1]);
        }
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
      
      // Track promises for pipeline sequencing
      const pipelinePromises = { beatAudio: null, image: null, videoDescription: null };

      // Skip slots that already have generated output + media (only for incremental runs, not fresh)
      const hasMedia = (slot) => {
        if (freshGeneration) return false; // Always regenerate on fresh generation
        if (slot === 'audio') return mediaUrls.audio;
        if (slot === 'visual') return mediaUrls.image;
        if (slot === 'video') return mediaUrls.video;
        if (slot === 'lyrics') return mediaUrls.vocals || mediaUrls.lyricsVocal;
        return false;
      };

      // All other slots run in parallel using the (optional) lyrics context
      const otherSlots = activeSlots.filter(([s]) => s !== 'lyrics');
      const slotsToGenerate = otherSlots.filter(([slot]) => {
        if (outputs[slot] && hasMedia(slot)) {
          console.log(`[Orchestrator] Skipping ${slot} — already generated`);
          return false;
        }
        return true;
      });
      await Promise.all(slotsToGenerate.map(([slot, agentId]) => generateForSlot(slot, agentId, lyricsResult)));

      // ═══════════════════════════════════════════════════════════
      // PIPELINE SEQUENCING: vocals wait for beat, video waits for mix
      // ═══════════════════════════════════════════════════════════

      // Wait for beat audio to finish (if it was queued)
      if (pipelinePromises.beatAudio) {
        await pipelinePromises.beatAudio;
        console.log('[Pipeline] Beat audio ready, proceeding to vocals');
      }

      // Generate vocals AFTER beat is ready (so backingTrackUrl works and backend mixes them)
      if (lyricsResult && activeSlots.find(([s]) => s === 'lyrics') && (freshGeneration || !(mediaUrls.vocals || mediaUrls.lyricsVocal))) {
        console.log('[Pipeline] Starting vocal generation with beat URL for mixing');
        updatePipelineStep('vocals', 'active');
        await handleGenerateVocals(lyricsResult);
        updatePipelineStep('vocals', 'done');
        console.log('[Pipeline] Vocals (mixed with beat) complete');
      }

      // Wait for image to finish
      if (pipelinePromises.image) {
        await pipelinePromises.image;
      }

      // Generate video LAST — it now gets mixed audio (vocal+beat) instead of just beat
      // Use ref for latest state (closure mediaUrls may be stale after async ops)
      if (pipelinePromises.videoDescription && !mediaUrlsRef.current.video) {
        console.log('[Pipeline] Starting video generation with mixed audio');
        updatePipelineStep('video', 'active');
        await handleGenerateVideo(pipelinePromises.videoDescription);
        updatePipelineStep('video', 'done');
      }

      // AUTO-MUX: Combine silent video with mixed audio to produce final video with sound
      // Read from ref to get latest state (closure mediaUrls may be stale after async ops)
      const muxVideoUrl = mediaUrlsRef.current.video;
      const muxAudioUrl = mediaUrlsRef.current.mixedAudio || mediaUrlsRef.current.audio;
      if (muxVideoUrl && muxAudioUrl) {
        updatePipelineStep('mux', 'active');
        const muxSuccess = await autoMuxVideoWithAudio(muxVideoUrl, muxAudioUrl, headers);
        updatePipelineStep('mux', muxSuccess ? 'done' : 'error');
      } else if (muxVideoUrl) {
        // Video exists but no audio to mux — skip
        updatePipelineStep('mux', 'done');
      }

      // Auto-create final mix preview (properly awaited)
      updatePipelineStep('final', 'active');
      try {
        await handleCreateFinalMix();
        updatePipelineStep('final', 'done');
      } catch (mixErr) {
        console.warn('[Pipeline] Final mix auto-create failed:', mixErr);
        updatePipelineStep('final', 'error');
      }
      
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
      setGeneratingSlots({ lyrics: false, audio: false, visual: false, video: false });
      // Clear pipeline steps after a short delay to let user see the completed state
      setTimeout(() => setPipelineSteps([]), 3000);
    }
  };

  // Regenerate single slot
  const handleRegenerate = async (slot) => {
    // PREVENT DUPLICATE CALLS
    if (isGenerating || generatingSlots[slot]) return;

    if (!selectedAgents[slot]) return;

    const agent = AGENTS.find(a => a.id === selectedAgents[slot]);
    if (!agent) return;

    setGeneratingSlots(prev => ({ ...prev, [slot]: true }));
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
        outputsRef.current[slot] = data.output;
        toast.success(`${slotConfig.title} regenerated!`);

        // For media slots: also regenerate the actual media file, not just the text description
        if (slot === 'lyrics' && data.output) {
          // Re-generate vocals with updated lyrics (if beat audio available)
          try {
            toast.loading('Re-generating vocals with new lyrics...', { id: 'regen-lyrics' });
            await handleGenerateVocals(data.output);
            toast.success('Vocals regenerated with new lyrics!', { id: 'regen-lyrics' });
          } catch (vocalErr) {
            console.error('[Regenerate] Vocal regen after lyrics update failed:', vocalErr);
            toast.error('Lyrics updated but vocal generation failed. Try generating vocals manually.', { id: 'regen-lyrics' });
          }
        } else if (slot === 'video' && data.output) {
          toast.loading('Regenerating video...', { id: 'regen-video' });
          try {
            await handleGenerateVideo(data.output);
            // Auto-mux with audio if available
            const latestAudio = mediaUrlsRef.current.mixedAudio || mediaUrlsRef.current.audio;
            const latestVideo = mediaUrlsRef.current.video;
            if (latestVideo && latestAudio) {
              toast.loading('Syncing audio to video...', { id: 'regen-video' });
              await autoMuxVideoWithAudio(latestVideo, latestAudio, headers);
            }
            toast.success('Video regenerated with audio!', { id: 'regen-video' });
          } catch (vidErr) {
            console.error('[Regenerate] Video media regen failed:', vidErr);
            toast.error('Video description updated but media generation failed', { id: 'regen-video' });
          }
        } else if (slot === 'audio' && data.output) {
          try {
            await handleGenerateAudio(data.output);
            toast.success('Beat regenerated!', { id: 'regen-audio' });
          } catch (audioErr) {
            console.error('[Regenerate] Audio media regen failed:', audioErr);
          }
        } else if (slot === 'visual' && data.output) {
          try {
            await handleGenerateImage(data.output);
            toast.success('Image regenerated!', { id: 'regen-image' });
          } catch (imgErr) {
            console.error('[Regenerate] Image media regen failed:', imgErr);
          }
        }
      } else {
        toast.error(data.error || `Failed to regenerate ${slotConfig.title}`);
      }
    } catch (regenErr) {
      console.error('[Orchestrator] Regeneration error:', regenErr);
      toast.error('Regeneration failed');
    } finally {
      setGeneratingSlots(prev => ({ ...prev, [slot]: false }));
    }
  };

  // Keep ref in sync so clearAndGenerate/saveAndGenerate always call latest version
  handleGenerateRef.current = handleGenerate;

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

      const response = await fetch(`${BACKEND_URL}/api/generate-audio`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          // Simplified prompt: Backend already wraps with genre/mood/BPM/quality tags
          // Sending the raw description from the agent is more effective
          prompt: typeof cleanAudioPromptText === 'string' ? cleanAudioPromptText.substring(0, 1000) : 'Professional music production',
          genre: (style || 'hip-hop').toLowerCase().split('/')[0].trim(),
          mood: mood.toLowerCase() || 'energetic',
          bpm: parseInt(projectBpm) || 90,
          durationSeconds: parseInt(duration) || (structure === 'Full Song' ? 90 :
                          structure === 'Radio Edit' ? 150 :
                          structure === 'Extended' ? 180 :
                          structure === 'Loop' ? 15 : 30),
          referenceAudio: audioDnaUrl || null,
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
          mediaUrlsRef.current = { ...mediaUrlsRef.current, audio: finalUrl }; // Sync ref for pipeline reads
          setGenerationProviders(prev => ({ ...prev, audio: data.source || data.provider || 'ai' }));
          
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
              id: `audio-${crypto.randomUUID()}`,
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
                referencedAudioId: audioDnaUrl ? 'dna-ref' : null
              },
              createdAt: new Date().toISOString()
            };

            saveFunc({
              ...existingProject,
              assets: [audioAsset, ...(existingProject.assets || [])],
              updatedAt: new Date().toISOString()
            });
            setIsSaved(true);
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

    // AUTH GUARD: Require sign-in before generating vocals
    if (!authToken) {
      toast.error('Please sign in to generate vocals');
      return;
    }

    // Use directInput (only if string), outputsRef, or current outputs (fallback)
    const lyricsText = (typeof directInput === 'string' ? directInput : null) || outputsRef.current.lyrics || outputs.lyrics;

    console.log('[handleGenerateVocals] Called, hasLyrics:', !!lyricsText);
    if (!lyricsText) {
      toast.error('Generate Lyrics & Hook DNA first');
      return;
    }
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
        'rapper-melodic': 'rapper-male-1',
        'rapper-young': 'rapper-male-1',
        'rapper-female': 'rapper-female-1',
        'rapper-female-melodic': 'rapper-female-1',
        'singer': 'singer-male',
        'singer-pop': 'singer-male',
        'singer-female': 'singer-female',
        'singer-female-pop': 'singer-female',
        'narrator': 'narrator',
        'whisper': 'whisper',
        'spoken': 'spoken'
      };

      const selectedVoice = voiceMapping[voiceStyle] || 'rapper-male-1';

      // Map expanded voice styles to backend style + rapStyle/genre params
      let backendStyle = voiceStyle;
      let backendRapStyle = rapStyle;
      if (voiceStyle === 'rapper-melodic') {
        backendStyle = 'rapper';
        backendRapStyle = 'melodic';
      } else if (voiceStyle === 'rapper-young') {
        backendStyle = 'rapper';
        backendRapStyle = 'trap';
      } else if (voiceStyle === 'rapper-female-melodic') {
        backendStyle = 'rapper-female';
        backendRapStyle = 'melodic';
      } else if (voiceStyle === 'singer-pop') {
        backendStyle = 'singer';
      } else if (voiceStyle === 'singer-female-pop') {
        backendStyle = 'singer-female';
      }

      const response = await fetch(`${BACKEND_URL}/api/generate-speech`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: cleanLyrics.substring(0, 1500),
          voice: selectedVoice,
          style: backendStyle,
          rapStyle: backendRapStyle,
          genre: voiceStyle === 'singer-pop' ? 'pop' : (voiceStyle === 'singer-female-pop' ? 'pop' : genre),
          language: language || 'English',
          duration: duration || 30,
          quality: vocalQuality, // Pass 'premium' for ElevenLabs priority
          outputFormat: outputFormat, // TV, Podcast, Social, Music (Righteous Quality)
          speakerUrl: voiceStyle === 'cloned' && !clonedVoiceId ? voiceSampleUrl : null,
          elevenLabsVoiceId: voiceStyle === 'cloned' && clonedVoiceId
            ? clonedVoiceId
            : ((vocalQuality === 'premium' || voiceStyle === 'cloned') ? elevenLabsVoiceId : null),
          backingTrackUrl: (() => {
            // Use ref for latest value; only pass persistent URLs (not base64/blob)
            const audioUrl = mediaUrlsRef.current?.audio || mediaUrls.audio;
            if (audioUrl && typeof audioUrl === 'string' && audioUrl.startsWith('http')) return audioUrl;
            return null; // Skip mixing if URL isn't persistent yet
          })()
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
        // If backend mixed vocals with beat (backingTrackUrl was provided), store as mixedAudio too
        const wasMixed = !!(mediaUrls.audio); // beat was available → backend mixed
        const vocalUpdate = {
          vocals: data.audioUrl,
          lyricsVocal: data.audioUrl,
          ...(wasMixed ? { mixedAudio: data.audioUrl } : {})
        };
        setMediaUrls(prev => ({ ...prev, ...vocalUpdate }));
        mediaUrlsRef.current = { ...mediaUrlsRef.current, ...vocalUpdate }; // Sync ref for pipeline reads
        setGenerationProviders(prev => ({ ...prev, lyrics: data.provider || 'ai' }));
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
            id: `vocal-${crypto.randomUUID()}`,
            title: `Vocal Performance${versionLabel}`,
            type: 'vocal',
            agent: 'Ghostwriter',
            content: cleanLyrics.substring(0, 500),
            audioUrl: data.audioUrl,
            mimeType: data.mimeType || 'audio/wav',
            version: vocalVersions + 1,
            settings: {
              voice: selectedVoice,
              voiceStyle: voiceStyle,
              vocalQuality: vocalQuality,
              outputFormat: outputFormat,
              elevenLabsVoiceId: elevenLabsVoiceId || null,
              voiceSampleUrl: voiceStyle === 'cloned' ? voiceSampleUrl : null,
              provider: data.provider || 'unknown',
              referencedAudioId: voiceStyle === 'cloned' ? voiceSampleUrl : null
            },
            createdAt: new Date().toISOString()
          };
          
          saveFunc({
            ...existingProject,
            assets: [vocalAsset, ...(existingProject.assets || [])],
            updatedAt: new Date().toISOString()
          });
          setIsSaved(true);
        }

        const engineLabels = {
          'suno': 'Suno AI Singing',
          'bark-singing': 'Bark Singing Engine',
          'elevenlabs-premium': 'ElevenLabs Premium',
          'bark': 'Bark Speech',
          'xtts-v2-clone': 'XTTS Voice Clone',
          'gemini-tts': 'Gemini TTS',
          'uberduck-tts': 'Uberduck TTS'
        };
        const engineName = engineLabels[data.provider] || data.provider || 'AI';
        toast.success(`Vocals generated via ${engineName}`, { id: 'gen-vocals' });
      } else {
        const errData = data || {};
        toast.error(errData.details || errData.error || 'Vocal generation failed', { id: 'gen-vocals' });
      }
    } catch (err) {
      console.error('[Orchestrator] Vocal generation error:', err);
      toast.error('Vocal generation failed', { id: 'gen-vocals' });
    } finally {
      setGeneratingMedia(prev => ({ ...prev, vocals: false }));
    }
  };

  const handleUploadVoiceSample = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // AUTH GUARD: Require sign-in before uploading voice sample
    if (!authToken) {
      toast.error('Please sign in to upload a voice sample');
      e.target.value = '';
      return;
    }

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

  // Multi-sample voice upload for ElevenLabs IVC cloning
  const handleUploadVoiceSamples = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // AUTH GUARD: Require sign-in before uploading voice samples
    if (!authToken) {
      toast.error('Please sign in to upload voice samples');
      e.target.value = '';
      return;
    }

    // Limit to 3 total samples
    const remaining = 3 - voiceSamples.length;
    if (remaining <= 0) {
      toast.error('Maximum 3 voice samples allowed');
      return;
    }
    const filesToUpload = files.slice(0, remaining);

    for (const file of filesToUpload) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }

      const loadingId = toast.loading(`Uploading ${file.name}...`);

      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload to Firebase Storage for permanent URL
        const headers = await getHeaders();
        const response = await fetch(`${BACKEND_URL}/api/upload-asset`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            data: base64,
            fileName: `voice-sample-${Date.now()}-${file.name.replace(/\s+/g, '-')}`,
            mimeType: file.type || 'audio/wav',
            assetType: 'audio'
          })
        });

        const result = await response.json();
        if (response.ok && result.url) {
          setVoiceSamples(prev => [...prev, { name: file.name, url: result.url, base64 }]);
          toast.success(`${file.name} uploaded`, { id: loadingId });
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (err) {
        console.error('[Orchestrator] Voice sample upload error:', err);
        toast.error(`Failed to upload ${file.name}`, { id: loadingId });
      }
    }

    // Reset the file input
    e.target.value = '';
  };

  // Clone voice using ElevenLabs Instant Voice Cloning
  const handleCloneVoice = async () => {
    // AUTH GUARD: Require sign-in before cloning voice
    if (!authToken) {
      toast.error('Please sign in to clone your voice');
      return;
    }

    if (voiceSamples.length < 2) {
      toast.error('Upload at least 2 voice samples for best results');
      return;
    }

    setIsCloningVoice(true);
    toast.loading('Cloning your voice...', { id: 'voice-clone' });

    try {
      const headers = await getHeaders();
      const response = await fetch(`${BACKEND_URL}/api/voice-clone`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          samples: voiceSamples.map(s => s.base64),
          voiceName: songIdea ? `${songIdea} Voice` : 'My Voice'
        })
      });

      const result = await response.json();
      if (response.ok && result.voiceId) {
        setClonedVoiceId(result.voiceId);
        setElevenLabsVoiceId(result.voiceId);
        setVoiceStyle('cloned');
        toast.success('Voice cloned! Your voice is now active.', { id: 'voice-clone' });

        // Add to saved voices
        const voiceEntry = {
          id: result.voiceId,
          voiceId: result.voiceId,
          name: result.name,
          provider: 'elevenlabs-ivc',
          type: 'cloned'
        };
        setSavedVoices(prev => [voiceEntry, ...prev]);
      } else {
        throw new Error(result.error || result.details || 'Voice cloning failed');
      }
    } catch (err) {
      console.error('[Orchestrator] Voice cloning error:', err);
      toast.error(err.message || 'Voice cloning failed', { id: 'voice-clone' });
    } finally {
      setIsCloningVoice(false);
    }
  };

  // Upload artist image for video generation
  const handleUploadArtistImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }

    const loadingId = toast.loading('Uploading artist image...');

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const headers = await getHeaders();
      const response = await fetch(`${BACKEND_URL}/api/upload-asset`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: base64,
          fileName: `artist-image-${Date.now()}-${file.name.replace(/\s+/g, '-')}`,
          mimeType: file.type || 'image/png',
          assetType: 'image'
        })
      });

      const result = await response.json();
      if (response.ok && result.url) {
        setVisualDnaUrl(result.url);
        setVideoDnaUrl(result.url);
        toast.success('Artist image uploaded!', { id: loadingId });

        // Persist to Firestore
        if (auth.currentUser?.uid && db) {
          try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
              visualDnaUrl: result.url,
              videoDnaUrl: result.url,
              lastDnaUpdate: Date.now()
            });
          } catch (saveErr) {
            console.warn('[Orchestrator] Failed to persist artist image:', saveErr);
          }
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('[Orchestrator] Artist image upload error:', err);
      toast.error('Failed to upload image', { id: loadingId });
    }
  };

  // Upload reference audio for style matching
  const handleUploadReferenceAudio = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }

    const loadingId = toast.loading('Uploading reference audio...');

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const headers = await getHeaders();
      const response = await fetch(`${BACKEND_URL}/api/upload-asset`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: base64,
          fileName: `ref-audio-${Date.now()}-${file.name.replace(/\s+/g, '-')}`,
          mimeType: file.type || 'audio/mpeg',
          assetType: 'audio'
        })
      });

      const result = await response.json();
      if (response.ok && result.url) {
        setAudioDnaUrl(result.url);
        toast.success('Reference audio uploaded!', { id: loadingId });

        // Persist to Firestore
        if (auth.currentUser?.uid && db) {
          try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
              audioDnaUrl: result.url,
              lastDnaUpdate: Date.now()
            });
          } catch (saveErr) {
            console.warn('[Orchestrator] Failed to persist reference audio:', saveErr);
          }
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('[Orchestrator] Reference audio upload error:', err);
      toast.error('Failed to upload audio', { id: loadingId });
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
            if (auth.currentUser?.uid && db) {
              try {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await updateDoc(userRef, {
                  [`${slot}DnaUrl`]: url,
                  lastDnaUpdate: Date.now()
                });

                console.log(`[Orchestrator] Persisted ${slot} DNA to profile`);
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
          mediaUrlsRef.current = { ...mediaUrlsRef.current, image: imageData }; // Sync ref for pipeline reads
          setGenerationProviders(prev => ({ ...prev, visual: data.model || data.source || 'ai' }));
          toast.success('Image created!', { id: 'gen-image' });

          // AUTO-SYNC TO PROJECT
          if (existingProject) {
            const imageAsset = {
              id: `img-${crypto.randomUUID()}`,
              title: `Album Art - ${new Date().toLocaleTimeString()}`,
              type: 'image',
              agent: 'Visual Artist',
              imageUrl: imageData,
              date: new Date().toLocaleDateString(),
              createdAt: new Date().toISOString()
            };
            
            const updatedAssets = [...(existingProject.assets || []), imageAsset];
            onSaveToProject?.({
              ...existingProject,
              assets: updatedAssets,
              updatedAt: new Date().toISOString()
            });
            setIsSaved(true);
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
              id: `img-${crypto.randomUUID()}`,
              type: 'image',
              url: frameDataUrl,
              name: `Video Frame Cover - ${new Date().toLocaleTimeString()}`,
              createdAt: new Date().toISOString()
            };

            const updatedAssets = [...(existingProject.assets || []), imageAsset];
            onSaveToProject?.({
              ...existingProject,
              assets: updatedAssets,
              updatedAt: new Date().toISOString()
            });
            setIsSaved(true);
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
              id: `img-${crypto.randomUUID()}`,
              type: 'image',
              url: imageData,
              name: `Video Frame Cover - ${new Date().toLocaleTimeString()}`,
              createdAt: new Date().toISOString()
            };

            const updatedAssets = [...(existingProject.assets || []), imageAsset];
            onSaveToProject?.({
              ...existingProject,
              assets: updatedAssets,
              updatedAt: new Date().toISOString()
            });
            setIsSaved(true);
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

    // Use directInput (if string), outputsRef, current outputs, or auto-synthesize from session context
    const videoPromptText = (typeof directInput === 'string' ? directInput : null)
      || outputsRef.current.video
      || outputs.video
      || `${style || 'cinematic'} music video for "${songIdea || 'original song'}", ${mood || 'energetic'} mood, professional quality`;

    setGeneratingMedia(prev => ({ ...prev, video: true }));

    try {
      const headers = await getHeaders();

      // Clean prompt of AI fluff
      const { content: cleanVideoPrompt } = splitCreativeContent(videoPromptText);
      const videoPrompt = cleanVideoPrompt || videoPromptText;

      // Check for audio — if available, use synced pipeline for 60-240s videos
      const audioSource = mediaUrls.mixedAudio || mediaUrls.audio;

      if (audioSource) {
        // ═══ SYNCED PIPELINE: Beat-synced music video (60-240s) ═══
        const videoDuration = Math.max(duration || 60, 60); // At least 60 seconds
        toast.loading(`Creating ${videoDuration}s music video (3-10 min)...`, { id: 'gen-video', duration: 600000 });

        const endpoint = headers['Authorization']
          ? '/api/generate-synced-video'
          : '/api/generate-synced-video-test';

        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({
            audioUrl: audioSource,
            videoPrompt: `${visualDnaUrl || videoDnaUrl ? 'Feature the artist from the reference image. ' : ''}Elite cinematic music video, professional motion design, high-fidelity quality: ${videoPrompt.substring(0, 700)}`,
            imageUrl: mediaUrls.image,
            videoUrl: mediaUrls.video,
            referenceImage: visualDnaUrl || videoDnaUrl,
            songTitle: songIdea || 'Untitled',
            style: style || 'cinematic',
            duration: videoDuration
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (response.status === 503) {
            toast.error('Video API not configured', { id: 'gen-video' });
          } else {
            toast.error(errData.error || 'Video generation failed', { id: 'gen-video' });
          }
          return;
        }

        const data = await response.json();

        if (data.jobId) {
          // Long-form video queued — poll for completion
          console.log('[Orchestrator] Video job started:', data.jobId);
          toast.loading(`Music video rendering... 0%`, { id: 'gen-video', duration: 1200000 });
          const maxPolls = 120; // 120 × 10s = 20 min max
          let jobSuccess = false;
          for (let i = 0; i < maxPolls; i++) {
            await new Promise(r => setTimeout(r, 10000)); // Poll every 10s
            try {
              const statusRes = await fetch(`${BACKEND_URL}/api/video-job-status/${data.jobId}`, { headers });
              const statusData = await statusRes.json();
              console.log(`[Orchestrator] Video job poll ${i + 1}:`, statusData.status, statusData.progress);
              if (statusData.status === 'completed' && statusData.videoUrl) {
                setMediaUrls(prev => ({ ...prev, video: statusData.videoUrl }));
                mediaUrlsRef.current = { ...mediaUrlsRef.current, video: statusData.videoUrl }; // Sync ref for pipeline reads
                setGenerationProviders(prev => ({ ...prev, video: 'synced-music-video' }));
                toast.success(`Music video created! (${statusData.duration || videoDuration}s)`, { id: 'gen-video' });
                jobSuccess = true;

                // Auto-sync to project
                if (existingProject) {
                  const videoAsset = {
                    id: `vid-${crypto.randomUUID()}`,
                    title: `Music Video - ${new Date().toLocaleTimeString()}`,
                    type: 'video',
                    agent: 'Video Director',
                    videoUrl: statusData.videoUrl,
                    duration: statusData.duration,
                    bpm: statusData.bpm,
                    date: new Date().toLocaleDateString(),
                    createdAt: new Date().toISOString()
                  };
                  const updatedAssets = [...(existingProject.assets || []), videoAsset];
                  onSaveToProject?.({ ...existingProject, assets: updatedAssets, updatedAt: new Date().toISOString() });
                  setIsSaved(true);
                }
                break;
              }
              if (statusData.status === 'failed') {
                toast.error(statusData.error || 'Video generation failed', { id: 'gen-video' });
                break;
              }
              // Still processing — update progress
              toast.loading(`Music video rendering... ${statusData.progress || 0}%`, { id: 'gen-video' });
            } catch (pollErr) {
              console.error('[Orchestrator] Video job poll error:', pollErr);
            }
          }
          if (!jobSuccess) {
            toast.error('Video generation timed out — check back later', { id: 'gen-video' });
          }
          return;
        }

        if (data.videoUrl) {
          // Inline result (30s videos return immediately)
          setMediaUrls(prev => ({ ...prev, video: data.videoUrl }));
          mediaUrlsRef.current = { ...mediaUrlsRef.current, video: data.videoUrl }; // Sync ref for pipeline reads
          setGenerationProviders(prev => ({ ...prev, video: 'synced-music-video' }));
          toast.success(`Music video created! (${data.duration || videoDuration}s, ${data.bpm || '?'} BPM)`, { id: 'gen-video' });

          if (existingProject) {
            const videoAsset = {
              id: `vid-${crypto.randomUUID()}`,
              title: `Music Video - ${new Date().toLocaleTimeString()}`,
              type: 'video',
              agent: 'Video Director',
              videoUrl: data.videoUrl,
              duration: data.duration,
              bpm: data.bpm,
              date: new Date().toLocaleDateString(),
              createdAt: new Date().toISOString()
            };
            const updatedAssets = [...(existingProject.assets || []), videoAsset];
            onSaveToProject?.({ ...existingProject, assets: updatedAssets, updatedAt: new Date().toISOString() });
            setIsSaved(true);
          }

          // Auto-extract frame if no image
          if (!mediaUrls.image) {
            try {
              const frameDataUrl = await extractFrameFromVideo(data.videoUrl);
              setMediaUrls(prev => ({ ...prev, image: frameDataUrl }));
            } catch (e) {
              console.log('[Orchestrator] Auto frame extraction failed:', e);
            }
          }
          return;
        }

        toast.error('Unexpected video response', { id: 'gen-video' });
        return;
      }

      // ═══ FALLBACK: Short clip via Veo/Minimax (no audio available) ═══
      toast.loading('Generating video clip (this takes ~2 min)...', { id: 'gen-video' });

      const response = await fetch(`${BACKEND_URL}/api/generate-video`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `Elite cinematic music video visual, professional motion design, high-fidelity righteous quality, award-winning storyboard: ${videoPrompt.substring(0, 700)}`,
          referenceImage: visualDnaUrl || videoDnaUrl,
          referenceVideo: videoDnaUrl,
          duration: duration,
          audioDuration: duration, // Pass audio duration for video sync
          audioUrl: mediaUrls.mixedAudio || mediaUrls.audio, // Prefer mixed vocal+beat
          vocalUrl: mediaUrls.mixedAudio ? null : (mediaUrls.vocals || mediaUrls.lyricsVocal) // Skip if already in mix
        })
      });
      
      if (response.ok) {
        let data = await response.json();
        console.log('[Orchestrator] Video generation response:', { 
          type: data.type, 
          hasOutput: !!data.output,
          hasVideoUrl: !!data.videoUrl,
          mimeType: data.mimeType,
          status: data.status,
          operationId: data.operationId
        });
        
        // Handle async Veo operations: poll /api/video-status/:id until complete
        if (data.status === 'processing' && data.operationId) {
          console.log('[Orchestrator] Video operation started, polling for completion...', data.operationId);
          toast.loading('Video rendering in progress...', { id: 'gen-video', duration: 300000 });
          const maxPolls = 60; // 60 × 5s = 5 minutes
          let pollSuccess = false;
          for (let i = 0; i < maxPolls; i++) {
            await new Promise(r => setTimeout(r, 5000)); // Poll every 5s
            try {
              const statusRes = await fetch(`${BACKEND_URL}/api/video-status/${data.operationId}`, { headers });
              const statusData = await statusRes.json();
              console.log(`[Orchestrator] Video poll ${i + 1}:`, statusData.status);
              if (statusData.status === 'processing') continue;
              if (statusData.status === 'completed') {
                data = statusData; // Replace data with completed result
                pollSuccess = true;
                break;
              }
              // Failed
              toast.error(statusData.error || 'Video generation failed', { id: 'gen-video' });
              return;
            } catch (pollErr) {
              console.error('[Orchestrator] Video status poll error:', pollErr);
              // Continue polling on network errors
            }
          }
          if (!pollSuccess) {
            toast.error('Video generation timed out — please try again', { id: 'gen-video' });
            return;
          }
        }
        
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
          
          if (videoUrl && typeof videoUrl === 'string' && (videoUrl.startsWith('http') || videoUrl.startsWith('blob:') || videoUrl.startsWith('/api/'))) {
            setMediaUrls(prev => ({ ...prev, video: videoUrl }));
            mediaUrlsRef.current = { ...mediaUrlsRef.current, video: videoUrl }; // Sync ref for pipeline reads
            setGenerationProviders(prev => ({ ...prev, video: data.source || data.provider || 'ai' }));
            toast.success(data.isDemo ? 'Demo video loaded!' : 'Video created!', { id: 'gen-video' });

            // AUTO-SYNC VIDEO TO PROJECT
            if (existingProject) {
              const videoAsset = {
                id: `vid-${crypto.randomUUID()}`,
                title: `Music Video - ${new Date().toLocaleTimeString()}`,
                type: 'video',
                agent: 'Video Director',
                videoUrl: videoUrl,
                date: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString()
              };
              
              const updatedAssets = [...(existingProject.assets || []), videoAsset];
              onSaveToProject?.({
                ...existingProject,
                assets: updatedAssets,
                updatedAt: new Date().toISOString()
              });
              setIsSaved(true);
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

  // Create final mix - combines vocals + beat + mixes into mastered audio
  const handleCreateFinalMix = async () => {
    // PREVENT DUPLICATE CALLS
    if (creatingFinalMix) return;

    // Auth required for mixing endpoint
    if (!authToken) {
      toast.error('Sign in to create a final mix', { icon: '🔒' });
      return;
    }

    // Need at least vocals or beat
    const hasVocals = !!(mediaUrls.vocals || mediaUrls.lyricsVocal);
    const hasBeat = !!mediaUrls.audio;

    if (!hasVocals && !hasBeat) {
      toast.error('Generate vocals and/or beat first');
      return;
    }

    setCreatingFinalMix(true);

    try {
      let finalAudioUrl = mediaUrls.mixedAudio; // May already exist from pipeline
      let mixedViaApi = !!finalAudioUrl; // Track if we got a real mix

      // If we have both vocals and beat but no mixed version, call the mixing endpoint
      if (!finalAudioUrl && hasVocals && hasBeat) {
        toast.loading('Mixing vocals + beat into master (~15s)...', { id: 'final-mix' });

        const headers = await getHeaders();
        const response = await fetch(`${BACKEND_URL}/api/create-final-mix`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            vocalUrl: mediaUrls.vocals || mediaUrls.lyricsVocal,
            beatUrl: mediaUrls.audio,
            style: voiceStyle || 'rapper',
            outputFormat: outputFormat || 'music',
            genre: genre || style,
            vocalVolume: mixVocalVolume,
            beatVolume: mixBeatVolume
          })
        });

        if (response.ok) {
          const data = await response.json();
          finalAudioUrl = data.mixedAudioUrl;
          mixedViaApi = true;
          setMediaUrls(prev => ({ ...prev, mixedAudio: finalAudioUrl }));
          mediaUrlsRef.current = { ...mediaUrlsRef.current, mixedAudio: finalAudioUrl }; // Sync ref
          console.log('[FinalMix] Mixed audio created via /api/create-final-mix', data.preset);
        } else {
          const err = await response.json().catch(() => ({}));
          console.warn('[FinalMix] Mixing failed, using individual tracks', err);
          toast.error(`Mix failed: ${err.error || 'Server error'} — using individual tracks`, { id: 'final-mix' });
        }
      }

      // If only one track available, use it as the "mix"
      if (!finalAudioUrl) {
        finalAudioUrl = mediaUrls.vocals || mediaUrls.lyricsVocal || mediaUrls.audio;
      }

      // Compile all outputs into the final product
      const finalMix = {
        id: `mix-${crypto.randomUUID()}`,
        title: `${songIdea} - Complete Mix`,
        description: `Full production of "${songIdea}" with lyrics, beat, visual, and video`,
        created: new Date().toISOString(),
        mixedAudioUrl: finalAudioUrl,
        components: {
          lyrics: {
            content: outputs.lyrics,
            agent: AGENTS.find(a => a.id === selectedAgents.lyrics)?.name || 'Ghostwriter',
            vocalUrl: mediaUrls.lyricsVocal || null
          },
          audio: {
            content: outputs.audio,
            agent: AGENTS.find(a => a.id === selectedAgents.audio)?.name || 'Beat Maker',
            audioUrl: mediaUrls.audio || null,
            mixedAudioUrl: finalAudioUrl || null
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

      // Auto-save final mix to project
      const saveFunc = onSaveToProject || (() => console.warn('[FinalMix] No save callback'));
      if (existingProject && finalAudioUrl) {
        const mixAsset = {
          id: `mix-${crypto.randomUUID()}`,
          title: `${songIdea || 'Untitled'} - Master Mix`,
          type: 'mix',
          agent: 'Final Mix',
          content: `Master mix: vocals + beat${musicVideoUrl ? ' + music video' : ''}`,
          audioUrl: finalAudioUrl,
          mimeType: 'audio/mpeg',
          version: 1,
          settings: {
            voiceStyle: voiceStyle || 'rapper',
            outputFormat: outputFormat || 'music',
            genre: genre || style,
            hasMusicVideo: !!musicVideoUrl
          },
          createdAt: new Date().toISOString()
        };

        // Replace any existing mix asset (keep only latest master)
        const existingAssets = (existingProject.assets || []).filter(a => a.type !== 'mix');
        saveFunc({
          ...existingProject,
          assets: [mixAsset, ...existingAssets],
          updatedAt: new Date().toISOString()
        });
        setIsSaved(true);
        console.log('[FinalMix] Auto-saved master mix to project');
      }

      toast.success(
        mixedViaApi ? 'Master mix ready!' : 'Project compiled (generate both vocals & beat for full mix)',
        { id: 'final-mix' }
      );
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

    // Auth required for synced video endpoint
    if (!authToken) {
      toast.error('Sign in to create synced music videos', { icon: '🔒' });
      return;
    }

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
          audioUrl: mediaUrls.mixedAudio || mediaUrls.audio, // Prefer mixed vocal+beat
          videoPrompt: `${visualDnaUrl || videoDnaUrl ? 'Feature the artist from the reference image. ' : ''}${outputs.video || `A high-fidelity cinematic music video for a ${style} song`}`,
          imageUrl: mediaUrls.image,
          videoUrl: mediaUrls.video,
          referenceImage: visualDnaUrl || videoDnaUrl,
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
  const handleDownload = async (slot) => {
    const output = outputs[slot];
    if (!output && !mediaUrls[slot === 'visual' ? 'image' : slot === 'lyrics' ? 'vocals' : slot]) return;

    const slotConfig = GENERATOR_SLOTS.find(s => s.key === slot);
    const baseName = songIdea || 'media';

    // Download text description
    if (output) {
      const textToDownload = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
      const blob = new Blob([textToDownload], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}-${slotConfig?.title || slot}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Download media file if available
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

      const extMap = { audio: '.mp3', visual: '.png', video: '.mp4', lyrics: '.wav' };
      const fileName = `${baseName}-${slot}${extMap[slot] || ''}`;

      // Use fetch→blob for cross-origin URLs (a.download is ignored cross-origin)
      try {
        if (formattedUrl.startsWith('data:') || formattedUrl.startsWith('blob:')) {
          const a = document.createElement('a');
          a.href = formattedUrl;
          a.download = fileName;
          a.click();
        } else {
          const resp = await fetch(formattedUrl);
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(blobUrl);
        }
      } catch (dlErr) {
        console.warn('[Orchestrator] Fetch download failed, opening in new tab:', dlErr);
        window.open(formattedUrl, '_blank', 'noopener');
      }
    }

    // For video: also download a JSON metadata file with all project info
    if (slot === 'video' && mediaUrl) {
      const metadata = {
        title: songIdea || 'Untitled',
        createdAt: new Date().toISOString(),
        genre: style || genre || 'Unknown',
        bpm: projectBpm || null,
        duration: duration || null,
        language: language || 'English',
        mood: mood || null,
        structure: structure || null,
        voiceStyle: voiceStyle || null,
        videoUrl: mediaUrl,
        audioUrl: mediaUrls.mixedAudio || mediaUrls.audio || null,
        imageUrl: mediaUrls.image || null,
        vocalsUrl: mediaUrls.vocals || mediaUrls.lyricsVocal || null,
        musicVideoUrl: musicVideoUrl || null,
        lyrics: outputs.lyrics || null,
        beatDescription: outputs.audio || null,
        visualConcept: outputs.visual || null,
        videoDescription: outputs.video || null,
        agents: {
          lyrics: selectedAgents.lyrics || null,
          audio: selectedAgents.audio || null,
          visual: selectedAgents.visual || null,
          video: selectedAgents.video || null
        }
      };
      const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `${baseName}-project-metadata.json`;
      // Small delay so browser doesn't block multiple downloads
      setTimeout(() => { jsonLink.click(); URL.revokeObjectURL(jsonUrl); }, 500);
    }
  };

  // Download the final mixed master (vocal + beat combined)
  const handleDownloadMasterMix = () => {
    const mixUrl = mediaUrls.mixedAudio || finalMixPreview?.mixedAudioUrl;
    if (!mixUrl) {
      toast.error('No master mix available — create a final mix first');
      return;
    }
    const a = document.createElement('a');
    a.href = mixUrl.startsWith('data:') ? mixUrl : mixUrl;
    a.download = `${songIdea || 'master'}-final-mix.mp3`;
    a.click();
    toast.success('Downloading master mix');
  };

  // Delete handler
  const handleDelete = (slot) => {
    setOutputs(prev => ({ ...prev, [slot]: null }));
    // Update ref too
    outputsRef.current[slot] = null;

    if (slot === 'audio') setMediaUrls(prev => ({ ...prev, audio: null }));
    if (slot === 'visual') setMediaUrls(prev => ({ ...prev, image: null }));
    if (slot === 'video') {
      setMediaUrls(prev => ({ ...prev, video: null }));
      setMusicVideoUrl(null);
    }
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
          id: `${slot.key}-${crypto.randomUUID()}`,
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
        id: `mvideo-${crypto.randomUUID()}`,
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
        id: `fmix-${crypto.randomUUID()}`,
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
    const projectId = existingProject?.id || crypto.randomUUID();
    
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

  // Keep ref in sync so saveAndGenerate always calls latest version
  handleCreateProjectRef.current = handleCreateProject;

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
          padding: isMobile ? '6px 2px' : '10px 12px',
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
          borderRadius: isMobile ? '10px' : '14px',
          padding: isMobile ? '6px' : '12px',
          marginBottom: isMobile ? '8px' : '14px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Mode Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '8px'
          }}>
            <button
              onClick={() => setQuickMode(!quickMode)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(139, 92, 246, 0.8)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Settings size={12} />
              {quickMode ? 'Advanced Mode' : 'Quick Mode'}
            </button>
          </div>

          {quickMode ? (
            /* ═══════ QUICK CREATE MODE ═══════ */
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '10px',
              alignItems: isMobile ? 'stretch' : 'center'
            }}>
              <input
                value={songIdea}
                onChange={(e) => setSongIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // Auto-select all agents and go
                    setSelectedAgents({ lyrics: 'ghost', audio: 'beat', visual: 'album', video: 'video-creator' });
                    applyGenrePreset(quickGenre);
                    handleGenerate();
                  }
                }}
                placeholder="Describe your song in one line..."
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  outline: 'none',
                  minHeight: '52px',
                  fontFamily: 'inherit'
                }}
              />
              <select
                value={quickGenre}
                onChange={(e) => {
                  setQuickGenre(e.target.value);
                  applyGenrePreset(e.target.value);
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#a78bfa',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  outline: 'none',
                  minHeight: '52px',
                  minWidth: isMobile ? 'auto' : '160px',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238b5cf6' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center'
                }}
              >
                {ALL_GENRES.map(g => (
                  <option key={g} value={g} style={{ background: '#1a1a1a' }}>{g}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSelectedAgents({ lyrics: 'ghost', audio: 'beat', visual: 'album', video: 'video-creator' });
                  applyGenrePreset(quickGenre);
                  handleGenerate();
                }}
                disabled={isGenerating || !songIdea.trim()}
                style={{
                  padding: '14px 28px',
                  borderRadius: '12px',
                  background: isGenerating ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: isGenerating || !songIdea.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: !songIdea.trim() ? 0.5 : 1,
                  boxShadow: isGenerating ? 'none' : '0 4px 20px rgba(139, 92, 246, 0.4)',
                  minHeight: '52px',
                  whiteSpace: 'nowrap',
                  minWidth: isMobile ? 'auto' : '160px'
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Create Song
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ═══════ ADVANCED MODE ═══════ */
            <>
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

            {/* Song Structure Selector */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'single', label: 'Single', desc: '1V + Chorus' },
                { id: 'full', label: 'Full Track', desc: '2V + Chorus + Bridge' },
                { id: 'extended', label: 'Extended', desc: '3V + 2C + Bridge + Outro' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSongStructure(opt.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: songStructure === opt.id ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${songStructure === opt.id ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                    color: songStructure === opt.id ? '#a78bfa' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: songStructure === opt.id ? '600' : '400',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {opt.label}
                  <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{opt.desc}</span>
                </button>
              ))}
            </div>

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
            </>
          )}
        </div>

        {/* Activity Status Panel — shows during ANY individual generation */}
        {(() => {
          const mediaLabels = { audio: 'Beat Audio', vocals: 'Vocals', image: 'Artwork', video: 'Video' };
          const mediaColors = { audio: '#22d3ee', vocals: '#a78bfa', image: '#fb923c', video: '#f87171' };
          const activeItems = Object.entries(generatingMedia).filter(([, v]) => v);
          const slotItems = Object.entries(generatingSlots).filter(([, v]) => v);
          // Combine: generatingMedia tracks media synthesis, generatingSlots tracks text generation
          const allActive = [
            ...activeItems.map(([k]) => ({ key: k, label: `Creating ${mediaLabels[k] || k}...`, color: mediaColors[k] || '#8b5cf6' })),
            ...slotItems.filter(([k]) => !activeItems.some(([mk]) => mk === k)).map(([k]) => ({ key: `slot-${k}`, label: `Generating ${k} concept...`, color: '#8b5cf6' }))
          ];
          if (allActive.length === 0 || (isGenerating && pipelineSteps.length > 0)) return null;
          return (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '16px',
              padding: '12px 16px',
              background: 'rgba(139, 92, 246, 0.06)',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              alignItems: 'center'
            }}>
              <Loader2 size={14} className="spin" style={{ color: '#8b5cf6', flexShrink: 0 }} />
              {allActive.map(item => (
                <span key={item.key} style={{
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: item.color,
                  background: `${item.color}15`,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${item.color}30`
                }}>
                  {item.label}
                </span>
              ))}
            </div>
          );
        })()}

        {/* Pipeline Progress Feed */}
        {isGenerating && pipelineSteps.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            padding: isMobile ? '12px' : '16px',
            marginBottom: '16px',
            border: '1px solid rgba(139, 92, 246, 0.15)'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Loader2 size={14} className="spin" style={{ color: '#8b5cf6' }} />
              Pipeline Progress
            </div>
            {pipelineSteps.map((step) => (
              <div key={step.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 0',
                opacity: step.status === 'pending' ? 0.4 : 1,
                transition: 'opacity 0.3s'
              }}>
                {step.status === 'done' ? (
                  <CheckCircle2 size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                ) : step.status === 'active' ? (
                  <Loader2 size={16} className="spin" style={{ color: '#8b5cf6', flexShrink: 0 }} />
                ) : step.status === 'error' ? (
                  <X size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                )}
                <span style={{
                  fontSize: '0.8rem',
                  color: step.status === 'active' ? '#a78bfa' : step.status === 'done' ? '#22c55e' : step.status === 'error' ? '#ef4444' : 'rgba(255,255,255,0.5)',
                  fontWeight: step.status === 'active' ? '600' : '400',
                  flex: 1
                }}>
                  {step.label}
                </span>
                {step.status === 'done' && step.startTime && step.endTime && (
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                    {((step.endTime - step.startTime) / 1000).toFixed(1)}s
                  </span>
                )}
                {step.status === 'error' && (
                  <button
                    onClick={async () => {
                      updatePipelineStep(step.id, 'active');
                      try {
                        const headers = await getHeaders();
                        if (step.id === 'beat-audio') {
                          await handleGenerateAudio(outputs.audio);
                        } else if (step.id === 'vocals') {
                          await handleGenerateVocals(outputs.lyrics);
                        } else if (step.id === 'image') {
                          await handleGenerateImage(outputs.visual);
                        } else if (step.id === 'video') {
                          await handleGenerateVideo(outputs.video);
                        } else if (step.id === 'mux') {
                          const muxVideo = mediaUrlsRef.current.video;
                          const muxAudio = mediaUrlsRef.current.mixedAudio || mediaUrlsRef.current.audio;
                          if (muxVideo && muxAudio) await autoMuxVideoWithAudio(muxVideo, muxAudio, headers);
                        } else if (step.id === 'final') {
                          await handleCreateFinalMix();
                        }
                        updatePipelineStep(step.id, 'done');
                      } catch (retryErr) {
                        console.error('[Orchestrator] Pipeline retry error:', retryErr);
                        updatePipelineStep(step.id, 'error');
                        toast.error(`Retry failed for: ${step.label}`);
                      }
                    }}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Retry
                  </button>
                )}
                {step.status === 'active' && step.startTime && (
                  <span style={{ fontSize: '0.7rem', color: 'rgba(139, 92, 246, 0.6)' }}>
                    ...
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Advanced-only sections hidden in Quick Mode */}
        {!quickMode && (
          <>
        {/* Configuration Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {[
            { label: 'Language', value: language, setter: setLanguage, options: ALL_LANGUAGES },
            { label: 'Genre', value: style, setter: (val) => applyGenrePreset(val), options: ALL_GENRES },
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

        {/* Output Format Preset Selector */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '20px',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginRight: '4px'
          }}>
            Output For:
          </span>
          {Object.entries(OUTPUT_PRESETS).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => applyOutputPreset(name)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: selectedOutputPreset === name ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedOutputPreset === name ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: selectedOutputPreset === name ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                fontSize: '0.75rem',
                fontWeight: selectedOutputPreset === name ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{preset.icon}</span> {name}
            </button>
          ))}
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
                      onClick={() => setShowVocalFullscreen(true)}
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
                      aria-label="Open vocal audio fullscreen"
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
                <optgroup label="🔥 Male Rappers">
                  <option value="rapper">🎤 Rapper (Deep / Aggressive)</option>
                  <option value="rapper-melodic">🎵 Rapper (Melodic / Smooth)</option>
                  <option value="rapper-young">⚡ Rapper (Young / Trap)</option>
                </optgroup>
                <optgroup label="💜 Female Rappers">
                  <option value="rapper-female">💜 Female Rapper (Powerful)</option>
                  <option value="rapper-female-melodic">🎵 Female Rapper (Melodic)</option>
                </optgroup>
                <optgroup label="🎵 Male Singers">
                  <option value="singer">🎤 Male Singer (R&B/Soul)</option>
                  <option value="singer-pop">🌟 Male Singer (Pop)</option>
                </optgroup>
                <optgroup label="💫 Female Singers">
                  <option value="singer-female">💫 Female Singer (R&B/Soul)</option>
                  <option value="singer-female-pop">🌟 Female Singer (Pop)</option>
                </optgroup>
                <optgroup label="🗣️ Narration">
                  <option value="narrator">📢 Narrator (Deep Voice)</option>
                  <option value="spoken">💬 Spoken Word</option>
                </optgroup>
                <optgroup label="🧬 Voice Cloning">
                  <option value="cloned" disabled={!voiceSampleUrl && !clonedVoiceId}>✨ Cloned Voice {(!voiceSampleUrl && !clonedVoiceId) && '(Upload sample first)'}</option>
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
                {voiceStyle === 'cloned' && clonedVoiceId ? (
                  <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', fontSize: '0.85rem' }}>
                    Using: Your Cloned Voice
                  </div>
                ) : (vocalQuality === 'premium' || voiceStyle === 'cloned' || voiceStyle.startsWith('saved-')) && (
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
                        <option value="">Auto (Best match for style)</option>
                        {(() => {
                          const males = elVoices.filter(v => v.labels?.gender === 'male');
                          const females = elVoices.filter(v => v.labels?.gender === 'female');
                          const other = elVoices.filter(v => !v.labels?.gender || (v.labels.gender !== 'male' && v.labels.gender !== 'female'));
                          return (
                            <>
                              {males.length > 0 && (
                                <optgroup label="Male Voices">
                                  {males.map(voice => (
                                    <option key={voice.voice_id} value={voice.voice_id}>
                                      {voice.name} ({voice.labels?.accent || voice.labels?.use_case || 'Pro'})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {females.length > 0 && (
                                <optgroup label="Female Voices">
                                  {females.map(voice => (
                                    <option key={voice.voice_id} value={voice.voice_id}>
                                      {voice.name} ({voice.labels?.accent || voice.labels?.use_case || 'Pro'})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {other.length > 0 && (
                                <optgroup label="Other Voices">
                                  {other.map(voice => (
                                    <option key={voice.voice_id} value={voice.voice_id}>
                                      {voice.name} ({voice.labels?.accent || voice.labels?.use_case || 'Pro'})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </>
                          );
                        })()}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteVoiceTarget(voice);
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
                          style={{ marginLeft: '4px', opacity: 0.5, cursor: 'pointer' }}
                          aria-label={`Delete voice ${voice.name || 'Voice'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Rap Style Selector - only show for rap voices */}
              {(voiceStyle === 'rapper' || voiceStyle === 'rapper-female' || voiceStyle === 'rapper-melodic' || voiceStyle === 'rapper-young' || voiceStyle === 'rapper-female-melodic') && (
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
              {(voiceStyle === 'singer' || voiceStyle === 'singer-female' || voiceStyle === 'singer-pop' || voiceStyle === 'singer-female-pop') && (
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
                disabled={generatingMedia.vocals}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: generatingMedia.vocals ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.6)',
                  color: '#8b5cf6',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: generatingMedia.vocals ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: generatingMedia.vocals ? 0.7 : 1
                }}
              >
                {generatingMedia.vocals ? (
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

              {mediaUrls.lyricsVocal && (
                <button
                  onClick={async () => {
                    const url = mediaUrls.lyricsVocal;
                    const ext = url.includes('audio/wav') ? 'wav' : 'mp3';
                    const fileName = `${songIdea || 'lyrics'}-${voiceStyle}.${ext}`;
                    try {
                      if (url.startsWith('data:')) {
                        // Base64 data URL — direct download
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        a.click();
                      } else {
                        // HTTP URL — fetch as blob then download
                        toast.loading('Preparing download...', { id: 'dl-vocal' });
                        const resp = await fetch(url);
                        if (!resp.ok) throw new Error('Download failed');
                        const blob = await resp.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = fileName;
                        a.click();
                        URL.revokeObjectURL(blobUrl);
                        toast.success('Download started', { id: 'dl-vocal' });
                      }
                    } catch (err) {
                      console.error('[Download Audio] Error:', err);
                      // Fallback: open in new tab
                      window.open(url, '_blank');
                      toast.dismiss('dl-vocal');
                    }
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

        {/* End of advanced-only sections */}
        </>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* YOUR ASSETS — Voice Samples, Artist Image, Reference Audio */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div style={{
          marginBottom: '1.2rem',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '16px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          overflow: 'hidden'
        }}>
          {/* Header with collapse toggle */}
          <button
            onClick={() => setShowAssets(!showAssets)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'rgba(139, 92, 246, 0.08)',
              border: 'none',
              borderBottom: showAssets ? '1px solid rgba(139, 92, 246, 0.15)' : 'none',
              color: 'white',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Upload size={18} color="#a855f7" />
              <span style={{ fontSize: '0.95rem', fontWeight: '700', fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}>
                YOUR ASSETS
              </span>
              {(voiceSamples.length > 0 || visualDnaUrl || audioDnaUrl) && (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  fontWeight: '600'
                }}>
                  {[voiceSamples.length > 0 && 'Voice', visualDnaUrl && 'Image', audioDnaUrl && 'Audio'].filter(Boolean).join(' + ')}
                </span>
              )}
            </div>
            {showAssets ? <ChevronUp size={16} color="rgba(255,255,255,0.5)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.5)" />}
          </button>

          {showAssets && (
            <div style={{
              padding: '16px 18px',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '14px'
            }}>

              {/* Column 1: Voice Samples */}
              <div style={{
                padding: '16px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Mic size={16} color="#a855f7" />
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voice Samples</span>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>{voiceSamples.length}/3</span>
                </div>

                {/* Uploaded sample list */}
                {voiceSamples.map((sample, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'rgba(139, 92, 246, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 92, 246, 0.1)'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                      {sample.name}
                    </span>
                    <button
                      onClick={() => setVoiceSamples(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '2px' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* Add samples button */}
                {voiceSamples.length < 3 && (
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    border: '1px dashed rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'transparent'
                  }}>
                    <input
                      type="file"
                      accept="audio/*"
                      multiple
                      onChange={handleUploadVoiceSamples}
                      style={{ display: 'none' }}
                    />
                    <Upload size={14} />
                    {voiceSamples.length === 0 ? 'Upload 2-3 voice samples' : 'Add more samples'}
                  </label>
                )}

                {/* Clone voice button */}
                <button
                  onClick={handleCloneVoice}
                  disabled={voiceSamples.length < 2 || isCloningVoice}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: clonedVoiceId ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(139, 92, 246, 0.4)',
                    background: clonedVoiceId ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.15)',
                    color: clonedVoiceId ? '#22c55e' : (voiceSamples.length < 2 ? 'rgba(255,255,255,0.3)' : '#a855f7'),
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: voiceSamples.length < 2 || isCloningVoice ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    opacity: voiceSamples.length < 2 ? 0.5 : 1
                  }}
                >
                  {isCloningVoice ? <Loader2 size={14} className="spin" /> : clonedVoiceId ? <CheckCircle2 size={14} /> : <Sparkles size={14} />}
                  {isCloningVoice ? 'Cloning...' : clonedVoiceId ? 'Voice Cloned' : 'Clone My Voice'}
                </button>

                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.4 }}>
                  Upload vocal recordings so the AI learns your voice. Minimum 2 samples for best quality.
                </p>
              </div>

              {/* Column 2: Artist Image */}
              <div style={{
                padding: '16px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(236, 72, 153, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ImageIcon size={16} color="#ec4899" />
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Artist Image</span>
                </div>

                {visualDnaUrl ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={visualDnaUrl}
                      alt="Artist"
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid rgba(236, 72, 153, 0.2)'
                      }}
                    />
                    <button
                      onClick={() => { setVisualDnaUrl(null); setVideoDnaUrl(null); }}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        borderRadius: '50%',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '24px 10px',
                    border: '1px dashed rgba(236, 72, 153, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'transparent',
                    flex: 1
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadArtistImage}
                      style={{ display: 'none' }}
                    />
                    <ImageIcon size={24} color="rgba(236, 72, 153, 0.5)" />
                    Upload your photo
                  </label>
                )}

                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.4 }}>
                  Your photo or image for music videos. Videos will feature you instead of AI-generated visuals.
                </p>
              </div>

              {/* Column 3: Reference Audio */}
              <div style={{
                padding: '16px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(6, 182, 212, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Music size={16} color="#06b6d4" />
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference Audio</span>
                </div>

                {audioDnaUrl ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'rgba(6, 182, 212, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(6, 182, 212, 0.15)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Music size={14} color="#06b6d4" />
                      <span style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: '600' }}>Reference Active</span>
                    </div>
                    <button
                      onClick={() => setAudioDnaUrl(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '2px' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '24px 10px',
                    border: '1px dashed rgba(6, 182, 212, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'transparent',
                    flex: 1
                  }}>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleUploadReferenceAudio}
                      style={{ display: 'none' }}
                    />
                    <Music size={24} color="rgba(6, 182, 212, 0.5)" />
                    Upload song or vocals
                  </label>
                )}

                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.4 }}>
                  Upload a reference song or vocals. The AI matches your style, tone, and energy.
                </p>
              </div>

            </div>
          )}
        </div>

        {/* 4 Generator Cards Grid - 2x2 layout */}
      {/* 4 Generator Cards Grid - 2x2 layout - uses unified CSS */}
      <div className="generator-grid-unified" style={{
        gap: isMobile ? '0.6rem' : '1rem',
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
            isLoading={generatingSlots[slot.key] && selectedAgents[slot.key]}
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
            onMaximize={() => { setShowPreviewModal(false); setMaximizedSlot(slot.key); }}
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
            provider={generationProviders[slot.key] || null}
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
        setMaximizedSlot={setMaximizedSlot}
        visualType={visualType}
        setVisualType={setVisualType}
        isMobile={isMobile}
        orchestratorBpm={projectBpm}
        mixVocalVolume={mixVocalVolume}
        mixBeatVolume={mixBeatVolume}
        setMixVocalVolume={setMixVocalVolume}
        setMixBeatVolume={setMixBeatVolume}
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
            zIndex: 10001,
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
                    isLoading={generatingSlots[slot.key] && selectedAgents[slot.key]}
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
                    provider={generationProviders[slot.key] || null}
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
              onClick={() => { setMaximizedSlot(null); setShowPreviewModal(false); setShowCreateProject(true); }}
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
          role="dialog"
          aria-modal="true"
          aria-label="Save to project"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10004
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
        <div role="dialog" aria-modal="true" aria-label="Save confirmation" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10005,
          padding: '20px'
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowSaveConfirm(false); }}>
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
                  if (onGoToHub) {
                    onGoToHub();
                  } else {
                    onClose?.();
                  }
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
                  setMaximizedSlot(null);
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

      {/* Vocal Fullscreen Modal (React-managed, replaces innerHTML injection) */}
      {showVocalFullscreen && mediaUrls.lyricsVocal && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Vocal Audio Player"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 10002,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowVocalFullscreen(false)}
        >
          <div 
            style={{
              background: 'rgba(0,0,0,0.8)', borderRadius: '20px',
              padding: '24px', maxWidth: '500px', width: '100%',
              border: '1px solid rgba(139, 92, 246, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, color: '#8b5cf6' }}>🎧 Vocal Audio Player</div>
              <button onClick={() => setShowVocalFullscreen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} aria-label="Close vocal player">
                <X size={20} />
              </button>
            </div>
            <audio 
              src={formatAudioSrc(mediaUrls.lyricsVocal)}
              controls
              autoPlay
              style={{ width: '100%', height: '50px', borderRadius: '10px' }}
            />
            <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Voice Style: <strong>{voiceStyle}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Delete Voice Confirmation Dialog (replaces window.confirm) */}
      {deleteVoiceTarget && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Confirm voice deletion"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 10003,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setDeleteVoiceTarget(null)}
        >
          <div 
            style={{
              background: '#1a1a2e', borderRadius: '16px',
              padding: '24px', maxWidth: '380px', width: '100%',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Delete Voice</h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Remove <strong>{deleteVoiceTarget.name || 'this voice'}</strong> from your library? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteVoiceTarget(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: 'white', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteDoc(doc(db, 'users', auth.currentUser?.uid, 'voices', deleteVoiceTarget.id));
                    setSavedVoices(prev => prev.filter(v => v.id !== deleteVoiceTarget.id));
                    if (voiceSampleUrl === deleteVoiceTarget.url) {
                      setVoiceSampleUrl(null);
                      setVoiceStyle('rapper');
                    }
                    toast.success('Voice deleted');
                  } catch (err) {
                    console.error('[DeleteVoice] Error:', err);
                    toast.error('Failed to delete voice');
                  }
                  setDeleteVoiceTarget(null);
                }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog - Save Before Leaving */}
      {showExitConfirm && (
        <div role="dialog" aria-modal="true" aria-label="Exit confirmation" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10006,
          padding: '20px'
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowExitConfirm(false); }}>
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
                  setMaximizedSlot(null);
                  setShowPreviewModal(false);
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

      {/* Save/Clear Before Re-Generating Confirmation */}
      {showRegenerateConfirm && (
        <div role="dialog" aria-modal="true" aria-label="Regeneration confirmation" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10006,
          padding: '20px'
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowRegenerateConfirm(false); }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <FolderPlus size={32} color="#8b5cf6" />
            </div>
            <h2 style={{ margin: '0 0 12px', fontSize: '1.4rem', fontWeight: '700', color: 'white' }}>
              Unsaved Content
            </h2>
            <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              You have unsaved content. Save your project before generating new content?
            </p>
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={saveAndGenerate}
                className="btn-pill primary"
                style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <FolderPlus size={18} />
                Save & Generate New
              </button>
              <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
                <button
                  onClick={() => setShowRegenerateConfirm(false)}
                  className="btn-pill glass"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={clearAndGenerate}
                  className="btn-pill secondary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Clear & Generate New
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
            zIndex: 10003,
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
                  setMaximizedSlot(null);
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

              {(mediaUrls.mixedAudio || finalMixPreview?.mixedAudioUrl) && (
                <button
                  onClick={handleDownloadMasterMix}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(249, 115, 22, 0.5)',
                    border: '1px solid rgba(249, 115, 22, 0.6)',
                    color: '#f97316',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Download size={16} />
                  Download Master
                </button>
              )}
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

        .pulse-next-btn {
          animation: pulseNext 2s ease-in-out infinite;
        }

        @keyframes pulseNext {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(139, 92, 246, 0); }
        }
      `}</style>
    </div>
  );
}
