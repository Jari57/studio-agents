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
                        src={mediaUrl.startsWith('http') || mediaUrl.startsWith('data:') ? mediaUrl : `data:image/png;base64,${mediaUrl}`}
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

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL MIX SECTION - Pinned to bottom of orchestrator
// ═══════════════════════════════════════════════════════════════════════════════
function FinalMixSection({
  outputs,
  mediaUrls,
  selectedAgents,
  songIdea,
  projectName,
  language,
  style,
  model,
  finalMixPreview,
  setFinalMixPreview,
  creatingFinalMix,
  setCreatingFinalMix,
  musicVideoUrl,
  setMusicVideoUrl,
  generatingMusicVideo,
  handleGenerateProfessionalMusicVideo,
  handleCreateFinalMix,
  handleCreateProject,
  setShowPreviewModal,
  authToken
}) {
  // Check completion status
  const completedCount = Object.values(outputs).filter(Boolean).length;
  const totalSlots = 4;
  const allComplete = completedCount === totalSlots;
  const hasAnyOutput = completedCount > 0;
  const progressPercent = (completedCount / totalSlots) * 100;
  
  // Check media availability
  const hasLyrics = !!outputs.lyrics;
  const hasAudio = !!outputs.audio;
  const hasVisual = !!outputs.visual;
  const hasVideo = !!outputs.video;
  const hasBeatAudio = !!mediaUrls.audio;
  const hasImage = !!mediaUrls.image;
  const hasVideoMedia = !!mediaUrls.video;

  return (
    <div style={{
      background: allComplete 
        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.1) 50%, rgba(34, 197, 94, 0.05) 100%)'
        : 'linear-gradient(135deg, rgba(100, 100, 120, 0.15) 0%, rgba(80, 80, 100, 0.08) 100%)',
      borderRadius: '20px',
      padding: '28px',
      border: allComplete 
        ? '2px solid rgba(34, 197, 94, 0.5)' 
        : '2px dashed rgba(150, 150, 170, 0.3)',
      marginTop: '32px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s ease'
    }}>
      {/* Background glow when complete */}
      {allComplete && (
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
          animation: 'pulse 3s ease-in-out infinite'
        }} />
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        position: 'relative',
        zIndex: 1
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: allComplete 
                ? 'linear-gradient(135deg, #22c55e, #10b981)' 
                : 'linear-gradient(135deg, #6b7280, #4b5563)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: allComplete ? '0 8px 32px rgba(34, 197, 94, 0.4)' : 'none'
            }}>
              {allComplete ? '✨' : '🎛️'}
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '1.4rem',
                fontWeight: '800',
                color: allComplete ? '#22c55e' : 'rgba(255,255,255,0.6)',
                letterSpacing: '-0.02em'
              }}>
                Final Mix
              </h3>
              <p style={{
                margin: '2px 0 0',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                {allComplete 
                  ? 'All components ready • Create your complete product'
                  : `${completedCount}/${totalSlots} components complete`}
              </p>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div style={{
          textAlign: 'right',
          minWidth: '100px'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: allComplete ? '#22c55e' : 'rgba(255,255,255,0.4)',
            lineHeight: 1
          }}>
            {completedCount}/{totalSlots}
          </div>
          <div style={{
            width: '100px',
            height: '6px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '3px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: allComplete 
                ? 'linear-gradient(90deg, #22c55e, #10b981)' 
                : 'linear-gradient(90deg, #f59e0b, #d97706)',
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Component checklist */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '24px',
        position: 'relative',
        zIndex: 1
      }}>
        {[
          { key: 'lyrics', label: 'Lyrics', icon: '📝', done: hasLyrics, color: '#a855f7' },
          { key: 'audio', label: 'Beat', icon: '🎵', done: hasAudio, hasMedia: hasBeatAudio, color: '#3b82f6' },
          { key: 'visual', label: 'Cover Art', icon: '🎨', done: hasVisual, hasMedia: hasImage, color: '#f59e0b' },
          { key: 'video', label: 'Video', icon: '🎬', done: hasVideo, hasMedia: hasVideoMedia, color: '#ef4444' }
        ].map(item => (
          <div key={item.key} style={{
            background: item.done 
              ? `linear-gradient(135deg, ${item.color}20, ${item.color}10)` 
              : 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            padding: '14px',
            border: item.done 
              ? `1px solid ${item.color}50` 
              : '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>
              {item.done ? '✓' : item.icon}
            </div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: item.done ? item.color : 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {item.label}
            </div>
            {item.hasMedia && (
              <div style={{
                fontSize: '0.65rem',
                color: '#22c55e',
                marginTop: '4px'
              }}>
                + Media
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Final Mix Preview (when created) */}
      {finalMixPreview && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{
                fontSize: '0.7rem',
                color: '#22c55e',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '6px'
              }}>
                📦 Complete Product
              </div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                {finalMixPreview.title}
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {finalMixPreview.description}
              </p>
            </div>
            <div style={{
              background: 'rgba(34, 197, 94, 0.2)',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#22c55e'
            }}>
              Ready to Export
            </div>
          </div>

          {/* Music Video Section */}
          {hasBeatAudio && hasVideo && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#f59e0b',
                    fontWeight: '700',
                    marginBottom: '4px'
                  }}>
                    🎬 PROFESSIONAL MUSIC VIDEO
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Sync beat with video for a beat-matched music video
                  </p>
                </div>
                {finalMixPreview?.bpm && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#f59e0b'
                  }}>
                    ♪ {finalMixPreview.bpm} BPM
                  </div>
                )}
              </div>

              {musicVideoUrl && (
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '12px'
                }}>
                  <video
                    src={musicVideoUrl}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: '280px',
                      borderRadius: '8px'
                    }}
                  />
                  <div style={{
                    marginTop: '10px',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    ✓ Beat-synced music video ready
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleGenerateProfessionalMusicVideo}
                  disabled={generatingMusicVideo}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    background: generatingMusicVideo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.4)',
                    border: '1px solid rgba(245, 158, 11, 0.6)',
                    color: '#f59e0b',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: generatingMusicVideo ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {generatingMusicVideo ? (
                    <>⏳ Syncing...</>
                  ) : musicVideoUrl ? (
                    <>🔄 Regenerate Video</>
                  ) : (
                    <>🎬 Generate Music Video</>
                  )}
                </button>

                {musicVideoUrl && (
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = musicVideoUrl;
                      a.download = `${songIdea || 'music-video'}.mp4`;
                      a.click();
                    }}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '10px',
                      background: 'rgba(59, 130, 246, 0.3)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      color: '#3b82f6',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ⬇️ Download
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Preview All Button */}
        <button
          onClick={() => setShowPreviewModal(true)}
          disabled={!hasAnyOutput}
          style={{
            padding: '14px 24px',
            borderRadius: '12px',
            background: hasAnyOutput ? 'rgba(59, 130, 246, 0.2)' : 'rgba(100,100,100,0.1)',
            border: `1px solid ${hasAnyOutput ? 'rgba(59, 130, 246, 0.5)' : 'rgba(100,100,100,0.2)'}`,
            color: hasAnyOutput ? '#3b82f6' : 'rgba(255,255,255,0.3)',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: hasAnyOutput ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          👁️ Preview All
        </button>

        {/* Create Final Mix Button */}
        <button
          onClick={handleCreateFinalMix}
          disabled={!allComplete || creatingFinalMix}
          style={{
            padding: '14px 28px',
            borderRadius: '12px',
            background: allComplete 
              ? creatingFinalMix 
                ? 'rgba(34, 197, 94, 0.3)' 
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.5))'
              : 'rgba(100,100,100,0.1)',
            border: `1px solid ${allComplete ? 'rgba(34, 197, 94, 0.6)' : 'rgba(100,100,100,0.2)'}`,
            color: allComplete ? '#22c55e' : 'rgba(255,255,255,0.3)',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: allComplete && !creatingFinalMix ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: allComplete && !creatingFinalMix ? '0 4px 20px rgba(34, 197, 94, 0.3)' : 'none'
          }}
        >
          {creatingFinalMix ? (
            <>⏳ Creating Mix...</>
          ) : (
            <>⚡ Create Final Mix</>
          )}
        </button>

        {/* Save to Project Button */}
        <button
          onClick={handleCreateProject}
          disabled={!hasAnyOutput}
          style={{
            padding: '14px 28px',
            borderRadius: '12px',
            background: hasAnyOutput 
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(139, 92, 246, 0.4))' 
              : 'rgba(100,100,100,0.1)',
            border: `1px solid ${hasAnyOutput ? 'rgba(168, 85, 247, 0.6)' : 'rgba(100,100,100,0.2)'}`,
            color: hasAnyOutput ? '#a855f7' : 'rgba(255,255,255,0.3)',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: hasAnyOutput ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: hasAnyOutput ? '0 4px 20px rgba(168, 85, 247, 0.2)' : 'none'
          }}
        >
          💾 Save to Project
        </button>

        {/* Export Mix (when final mix exists) */}
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
              padding: '14px 24px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📥 Export JSON
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DOWNLOAD MEDIA FILES SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      {(hasBeatAudio || hasImage || hasVideoMedia) && (
        <div style={{
          marginTop: '24px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{
                fontSize: '0.7rem',
                color: '#3b82f6',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '4px'
              }}>
                📁 DOWNLOAD MEDIA FILES
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Save your media files locally for social media, streaming platforms, or backup
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px'
          }}>
            {/* Download Beat Audio */}
            {hasBeatAudio && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = mediaUrls.audio;
                  a.download = `${songIdea || 'beat'}-audio.mp3`;
                  a.click();
                  toast.success('Beat audio downloading...');
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#06b6d4',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🎵</span>
                <span>Beat Audio</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>MP3 / WAV</span>
              </button>
            )}

            {/* Download Cover Art */}
            {hasImage && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = mediaUrls.image;
                  a.download = `${songIdea || 'cover'}-art.png`;
                  a.click();
                  toast.success('Cover art downloading...');
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(236, 72, 153, 0.2)',
                  border: '1px solid rgba(236, 72, 153, 0.4)',
                  color: '#ec4899',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🖼️</span>
                <span>Cover Art</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>PNG / WebP</span>
              </button>
            )}

            {/* Download Video */}
            {hasVideoMedia && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = mediaUrls.video;
                  a.download = `${songIdea || 'video'}-clip.mp4`;
                  a.click();
                  toast.success('Video downloading...');
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#f59e0b',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🎬</span>
                <span>Video Clip</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>MP4</span>
              </button>
            )}

            {/* Download Music Video (if synced) */}
            {musicVideoUrl && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = musicVideoUrl;
                  a.download = `${songIdea || 'music-video'}-synced.mp4`;
                  a.click();
                  toast.success('Music video downloading...');
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.15))',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: '#22c55e',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🎥</span>
                <span>Music Video</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Beat-Synced MP4</span>
              </button>
            )}

            {/* Download All Button */}
            <button
              onClick={() => {
                // Download all available media
                if (hasBeatAudio) {
                  const a = document.createElement('a');
                  a.href = mediaUrls.audio;
                  a.download = `${songIdea || 'beat'}-audio.mp3`;
                  a.click();
                }
                setTimeout(() => {
                  if (hasImage) {
                    const a = document.createElement('a');
                    a.href = mediaUrls.image;
                    a.download = `${songIdea || 'cover'}-art.png`;
                    a.click();
                  }
                }, 500);
                setTimeout(() => {
                  if (hasVideoMedia) {
                    const a = document.createElement('a');
                    a.href = mediaUrls.video;
                    a.download = `${songIdea || 'video'}-clip.mp4`;
                    a.click();
                  }
                }, 1000);
                if (musicVideoUrl) {
                  setTimeout(() => {
                    const a = document.createElement('a');
                    a.href = musicVideoUrl;
                    a.download = `${songIdea || 'music-video'}-synced.mp4`;
                    a.click();
                  }, 1500);
                }
                toast.success('Downloading all media files...');
              }}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.2))',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                color: '#a855f7',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>📦</span>
              <span>Download All</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>All Media Files</span>
            </button>
          </div>

          {/* Info about streaming platforms */}
          <div style={{
            marginTop: '16px',
            padding: '12px 14px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)',
              lineHeight: '1.5'
            }}>
              <strong style={{ color: '#3b82f6' }}>💡 For Streaming Platforms:</strong> Download your beat audio (MP3) and cover art (PNG) to upload to:
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Spotify', 'Apple Music', 'SoundCloud', 'YouTube', 'TikTok', 'Instagram'].map(platform => (
                  <span key={platform} style={{
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Locked state message */}
      {!allComplete && (
        <div style={{
          marginTop: '20px',
          padding: '14px 18px',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          zIndex: 1
        }}>
          <span style={{ fontSize: '1.2rem' }}>🔒</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f59e0b' }}>
              Complete all 4 generators to unlock Final Mix
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Missing: {[
                !hasLyrics && 'Lyrics',
                !hasAudio && 'Beat',
                !hasVisual && 'Cover Art',
                !hasVideo && 'Video'
              ].filter(Boolean).join(', ')}
            </div>
          </div>
        </div>
      )}
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
  const [generatingMusicVideo, setGeneratingMusicVideo] = useState(false);
  const [musicVideoUrl, setMusicVideoUrl] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false); // Preview all creations before final mix
  
  const speechSynthRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // Helper to format image data for display
  // Handles: URLs (http/https), data URLs, and raw base64
  const formatImageSrc = (imageData) => {
    if (!imageData) return null;
    // Already a URL or data URL
    if (imageData.startsWith('http') || imageData.startsWith('data:')) {
      return imageData;
    }
    // Raw base64 - add data URL prefix
    return `data:image/png;base64,${imageData}`;
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
    toast.loading('Generating audio beat...', { id: 'gen-audio' });
    
    try {
      const headers = await getHeaders();
      const response = await fetch(`${BACKEND_URL}/api/generate-audio`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `${style} instrumental beat: ${outputs.audio.substring(0, 200)}`,
          genre: style || 'hip-hop',
          mood: 'energetic',
          bpm: 90,
          durationSeconds: 15
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Orchestrator] Audio generation response:', { 
          hasUrl: !!data.audioUrl, 
          isReal: data.isRealGeneration,
          source: data.source 
        });
        
        if (data.audioUrl) {
          setMediaUrls(prev => ({ ...prev, audio: data.audioUrl }));
          
          // Show different message if it's a sample vs real generation
          if (data.isSample) {
            toast.success('Sample beat loaded! (Add Replicate credits for custom AI beats)', { id: 'gen-audio', duration: 5000 });
          } else {
            toast.success('AI beat generated!', { id: 'gen-audio' });
          }
        } else {
          toast.error('No audio returned', { id: 'gen-audio' });
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[Orchestrator] Audio generation failed:', errData);
        toast.error(errData.details || errData.error || 'Audio generation failed', { id: 'gen-audio' });
      }
    } catch (err) {
      console.error('[Orchestrator] Audio generation error:', err);
      toast.error('Audio generation failed', { id: 'gen-audio' });
    } finally {
      setGeneratingMedia(prev => ({ ...prev, audio: false }));
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
        
        video.onerror = (e) => {
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
        console.log('[Orchestrator] Image generation response:', Object.keys(data));
        
        // Handle different response formats from backend:
        // 1. Replicate/Flux returns: { output: "https://..." } (URL)
        // 2. Gemini/Imagen returns: { images: ["base64data..."] } (base64 array)
        // 3. Legacy format: { imageData: "base64data..." }
        let imageData = null;
        
        if (data.output && typeof data.output === 'string') {
          // URL from Replicate - use directly
          imageData = data.output;
          console.log('[Orchestrator] Got image URL from Replicate');
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
          return;
        }
        
        if (data.output || data.imageData) {
          const imageData = data.output || `data:${data.mimeType || 'image/jpeg'};base64,${data.imageData}`;
          setMediaUrls(prev => ({ ...prev, image: imageData }));
          toast.success('Frame extracted from video!', { id: 'gen-image' });
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
        console.log('[Orchestrator] Video generation response:', Object.keys(data));
        
        // Handle different response formats
        const videoUrl = data.videoUrl || data.output || data.video;
        
        if (videoUrl) {
          setMediaUrls(prev => ({ ...prev, video: videoUrl }));
          toast.success('Video created!', { id: 'gen-video' });
          
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
          console.error('[Orchestrator] No video URL in response:', data);
          toast.error(data.message || 'No video returned', { id: 'gen-video' });
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[Orchestrator] Video generation failed:', response.status, errData);
        toast.error(errData.details || errData.error || 'Video generation failed', { id: 'gen-video' });
      }
    } catch (err) {
      console.error('[Orchestrator] Video generation error:', err);
      toast.error('Video generation failed', { id: 'gen-video' });
    } finally {
      setGeneratingMedia(prev => ({ ...prev, video: false }));
    }
  };

  // Ghostwriter vocal generation - Generate audio of lyrics being recited/sung via Gemini TTS
  const handleGenerateLyricsVocal = async () => {
    if (!outputs.lyrics) {
      toast.error('Generate lyrics first');
      return;
    }
    
    setGeneratingVocal(true);
    toast.loading('Creating vocal performance...', { id: 'gen-vocal' });
    
    try {
      const headers = await getHeaders();
      
      // Map voice style to Gemini TTS voice names
      // Available voices: Aoede, Charon, Fenrir, Kore, Puck, Zephyr (English)
      const voiceMapping = {
        singer: 'Kore',     // Warm, melodic voice good for singing
        rapper: 'Fenrir',   // Energetic, rhythmic voice
        narrator: 'Charon', // Deep, clear voice for spoken word
        whisper: 'Zephyr',  // Soft, breathy voice
        spoken: 'Puck'      // Natural conversational voice
      };
      
      const selectedVoice = voiceMapping[voiceStyle] || 'Kore';
      
      // Prepare lyrics text with performance direction
      const performanceText = `[${voiceStyle} style] ${outputs.lyrics.substring(0, 500)}`;
      
      const response = await fetch(`${BACKEND_URL}/api/generate-speech`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: performanceText,
          voice: selectedVoice,
          style: voiceStyle
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

  // Generate professional music video by syncing audio with video content
  const handleGenerateProfessionalMusicVideo = async () => {
    if (!mediaUrls.audio || !outputs.video) {
      toast.error('Need beat audio and video concept to sync');
      return;
    }

    setGeneratingMusicVideo(true);
    toast.loading('🎬 Syncing audio with video beats...', { id: 'prof-video' });

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
          videoPrompt: outputs.video,
          songTitle: songIdea || 'Untitled',
          style: style || 'cinematic',
          duration: 30 // Start with 30 seconds
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
          toast.success(`🎬 Music video created! (${data.duration}s, ${data.bpm} BPM)`, { id: 'prof-video' });
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
      toast.error('❌ Music video generation failed', { id: 'prof-video' });
    } finally {
      setGeneratingMusicVideo(false);
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
      console.log('[Orchestrator] Processing slot:', slot.key, 'output:', outputs[slot.key]?.substring?.(0, 50) || outputs[slot.key]);
      if (outputs[slot.key]) {
        const agent = AGENTS.find(a => a.id === selectedAgents[slot.key]);
        const asset = {
          id: `${slot.key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: slot.title,
          type: slot.key,
          agent: agent?.name || slot.subtitle,
          content: outputs[slot.key],
          snippet: outputs[slot.key].substring(0, 100),
          audioUrl: slot.key === 'audio' ? mediaUrls.audio : null,
          imageUrl: slot.key === 'visual' ? formatImageSrc(mediaUrls.image) : null,
          videoUrl: slot.key === 'video' ? mediaUrls.video : null,
          date: new Date().toLocaleDateString(),
          createdAt: new Date().toISOString(),
          color: `agent-${slot.color.replace('#', '')}`
        };
        console.log('[Orchestrator] Created asset:', asset.id, asset.title);
        assets.push(asset);
      }
    });
    
    console.log('[Orchestrator] Total assets created:', assets.length);
    
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
      date: existingProject?.date || new Date().toLocaleDateString(),
      updatedAt: new Date().toISOString(),
      agents: Object.values(selectedAgents).filter(Boolean).map(id => {
        const agent = AGENTS.find(a => a.id === id);
        return agent?.name || id;
      }),
      assets,
      coverImage: formatImageSrc(mediaUrls.image) || existingProject?.coverImage || null
    };
    
    console.log('[Orchestrator] Project object:', JSON.stringify({
      id: project.id,
      name: project.name,
      assetCount: project.assets.length,
      assetTypes: project.assets.map(a => a.type)
    }, null, 2));
    
    if (onCreateProject) {
      console.log('[Orchestrator] Calling onCreateProject callback with project');
      try {
        onCreateProject(project);
        toast.success(`Saved ${project.assets.length} assets to "${project.name}"!`);
      } catch (err) {
        console.error('[Orchestrator] onCreateProject callback error:', err);
        toast.error('Save failed - callback error');
      }
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

        {/* ═══════════════════════════════════════════════════════════════════
            FINAL MIX SECTION - Always visible at bottom
            ═══════════════════════════════════════════════════════════════════ */}
        <FinalMixSection
          outputs={outputs}
          mediaUrls={mediaUrls}
          selectedAgents={selectedAgents}
          songIdea={songIdea}
          projectName={projectName}
          language={language}
          style={style}
          model={model}
          finalMixPreview={finalMixPreview}
          setFinalMixPreview={setFinalMixPreview}
          creatingFinalMix={creatingFinalMix}
          setCreatingFinalMix={setCreatingFinalMix}
          musicVideoUrl={musicVideoUrl}
          setMusicVideoUrl={setMusicVideoUrl}
          generatingMusicVideo={generatingMusicVideo}
          handleGenerateProfessionalMusicVideo={handleGenerateProfessionalMusicVideo}
          handleCreateFinalMix={handleCreateFinalMix}
          handleCreateProject={handleCreateProject}
          setShowPreviewModal={setShowPreviewModal}
          authToken={authToken}
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

      {/* Preview All Creations Modal */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            width: '100%',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowPreviewModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{
              margin: '0 0 24px',
              fontSize: '1.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              👁️ Preview All Creations
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Lyrics Preview */}
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                <h3 style={{ margin: '0 0 12px', color: '#a78bfa', fontSize: '0.95rem', fontWeight: '600' }}>
                  📝 Lyrics
                </h3>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  color: 'rgba(255,255,255,0.9)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {outputs.lyrics || 'No lyrics generated yet'}
                </div>
              </div>

              {/* Beat Audio Preview */}
              <div style={{
                background: 'rgba(6, 182, 212, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                <h3 style={{ margin: '0 0 12px', color: '#22d3ee', fontSize: '0.95rem', fontWeight: '600' }}>
                  🎵 Beat Audio
                </h3>
                {mediaUrls.audio ? (
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                  }}>
                    <audio
                      controls
                      style={{ width: '100%', marginBottom: '8px' }}
                      src={mediaUrls.audio}
                    />
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                      ✓ Audio ready to play
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.9rem'
                  }}>
                    No audio generated yet
                  </div>
                )}
              </div>

              {/* Visual Image Preview */}
              <div style={{
                background: 'rgba(236, 72, 153, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(236, 72, 153, 0.3)'
              }}>
                <h3 style={{ margin: '0 0 12px', color: '#f472b6', fontSize: '0.95rem', fontWeight: '600' }}>
                  🖼️ Cover Visual
                </h3>
                {mediaUrls.image ? (
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    padding: '8px',
                    aspectRatio: '1'
                  }}>
                    <img
                      src={formatImageSrc(mediaUrls.image)}
                      alt="Cover Art"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '6px',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.9rem',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    No image generated yet
                  </div>
                )}
              </div>

              {/* Video Preview */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <h3 style={{ margin: '0 0 12px', color: '#fbbf24', fontSize: '0.95rem', fontWeight: '600' }}>
                  🎬 Video Storyboard
                </h3>
                {mediaUrls.video ? (
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    padding: '8px',
                    aspectRatio: '16/9'
                  }}>
                    <video
                      src={mediaUrls.video}
                      controls
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        backgroundColor: '#000'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.9rem',
                    aspectRatio: '16/9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    No video generated yet
                  </div>
                )}
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
                gap: '12px',
                fontSize: '0.85rem'
              }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Lyrics</div>
                  <div style={{ fontWeight: '600', color: '#a78bfa' }}>{outputs.lyrics.length} chars</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Audio</div>
                  <div style={{ fontWeight: '600', color: '#22d3ee' }}>{mediaUrls.audio ? '✓ Ready' : 'Pending'}</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Visual</div>
                  <div style={{ fontWeight: '600', color: '#f472b6' }}>{mediaUrls.image ? '✓ Ready' : 'Pending'}</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Video</div>
                  <div style={{ fontWeight: '600', color: '#fbbf24' }}>{mediaUrls.video ? '✓ Ready' : 'Pending'}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowPreviewModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  handleCreateFinalMix();
                }}
                disabled={creatingFinalMix}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: creatingFinalMix ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.5)',
                  border: '1px solid rgba(34, 197, 94, 0.6)',
                  color: '#22c55e',
                  fontWeight: '600',
                  cursor: creatingFinalMix ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {creatingFinalMix ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Creating Final Mix...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Create Final Mix
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
