import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles, Zap, Music, ArrowLeft, Edit3, Upload, Layers,
  ChevronLeft, ChevronRight, X, User, Crown, FileText, Download, Maximize2,
  Copy, Trash2, Share2, Book, Play, LayoutGrid, Link2
} from 'lucide-react';
import { UsersIcon, Twitter, Instagram, VideoIcon, ImageIcon } from 'lucide-react';

/**
 * CanvasView - Project Canvas component extracted from StudioView.jsx
 * Displays the production journey view for a selected project with asset grid/carousel,
 * pipeline stages, filter bar, detail panel, and sidebar.
 */
export default function CanvasView({
  // Core project data
  selectedProject,
  setSelectedProject,
  projects,
  setProjects,
  // Preview/detail state (from parent since used by effects outside canvas)
  canvasPreviewAsset,
  setCanvasPreviewAsset,
  canvasAudioRef,
  // Navigation & UI
  isMobile,
  setActiveTab,
  setShowOrchestrator,
  setShowStudioSession,
  setBackingTrack,
  backingTrack,
  setSelectedAgent,
  setShowAddAgentModal,
  // External utilities
  AGENTS,
  getAgentHex,
  formatImageSrc,
  formatVideoSrc,
  formatAudioSrc,
  safeOpenPreview,
  // Constants
  PRODUCTION_STAGES,
  // Social
  socialConnections,
  // Components
  SectionErrorBoundary,
  SafeAssetWrapper,
  // Toast (for notifications)
  toast
}) {
  // ═══════════════════════════════════════════════════════════════════════════════
  // CANVAS-SPECIFIC STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [assetFilter, setAssetFilter] = useState('all');
  const [showCanvasSidebar, setShowCanvasSidebar] = useState(false);
  const [pipelineFilter, setPipelineFilter] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [projectNameDraft, setProjectNameDraft] = useState('');
  const [canvasCarouselIndex, setCanvasCarouselIndex] = useState(0);
  const carouselTouchStartX = useRef(null);

  // Alias for clarity
  const detailPanelAsset = canvasPreviewAsset;
  const setDetailPanelAsset = setCanvasPreviewAsset;

  // ═══════════════════════════════════════════════════════════════════════════════
  // CANVAS COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Normalize assets: resolve legacy `asset.url` field into proper videoUrl/imageUrl 
  // and `asset.name` into `asset.title` for backward compat with old project data
  const normalizeAsset = (a) => {
    if (!a || typeof a !== 'object') return a;
    const normalized = { ...a };
    // Resolve .name → .title
    if (!normalized.title && normalized.name) normalized.title = normalized.name;
    // Resolve generic .url → typed field based on asset type
    if (normalized.url && !normalized.videoUrl && !normalized.imageUrl && !normalized.audioUrl) {
      const t = (normalized.type || '').toLowerCase();
      if (t === 'video') normalized.videoUrl = normalized.url;
      else if (t === 'image' || t === 'visual') normalized.imageUrl = normalized.url;
      else if (t === 'audio' || t === 'vocal') normalized.audioUrl = normalized.url;
    }
    return normalized;
  };

  const filteredCanvasAssets = useMemo(() => {
    const safeAssets = Array.isArray(selectedProject?.assets) ? selectedProject.assets.filter(Boolean).map(normalizeAsset) : [];
    let filtered = safeAssets;
    if (pipelineFilter) {
      const stage = PRODUCTION_STAGES.find(s => s.key === pipelineFilter);
      if (stage && stage.assetTypes.length > 0) {
        filtered = filtered.filter(a => stage.assetTypes.includes((a.type || '').toLowerCase()));
      }
    }
    if (assetFilter !== 'all' && !pipelineFilter) {
      const filterMap = { audio: ['audio'], vocal: ['vocal'], visual: ['image', 'visual'], video: ['video'], text: ['text', 'lyrics', 'script'], pro: ['pro'] };
      const allowed = filterMap[assetFilter] || [];
      filtered = filtered.filter(a => allowed.includes((a.type || '').toLowerCase()));
    }
    return filtered;
  }, [selectedProject?.assets, assetFilter, pipelineFilter, PRODUCTION_STAGES]);

  const pipelineStatus = useMemo(() => {
    const safeAssets = Array.isArray(selectedProject?.assets) ? selectedProject.assets.filter(Boolean) : [];
    return PRODUCTION_STAGES.map(stage => {
      if (stage.key === 'idea') return { ...stage, status: 'complete', count: 1 };
      const matching = safeAssets.filter(a => stage.assetTypes.includes((a.type || '').toLowerCase()));
      return { ...stage, status: matching.length > 0 ? 'complete' : 'empty', count: matching.length };
    });
  }, [selectedProject?.assets, PRODUCTION_STAGES]);

  const canvasCompletionPercent = useMemo(() => {
    const completed = pipelineStatus.filter(s => s.status === 'complete').length;
    return Math.round((completed / PRODUCTION_STAGES.length) * 100);
  }, [pipelineStatus, PRODUCTION_STAGES.length]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════════
  // Reset carousel when filter changes
  useEffect(() => { setCanvasCarouselIndex(0); }, [assetFilter, pipelineFilter]);

  // Clamp carousel index when filtered list shrinks
  useEffect(() => {
    if (canvasCarouselIndex >= filteredCanvasAssets.length && filteredCanvasAssets.length > 0) {
      setCanvasCarouselIndex(filteredCanvasAssets.length - 1);
    }
  }, [filteredCanvasAssets.length, canvasCarouselIndex]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleCarouselTouchStart = (e) => { carouselTouchStartX.current = e.touches[0].clientX; };
  const handleCarouselTouchEnd = (e) => {
    if (carouselTouchStartX.current === null) return;
    const diff = carouselTouchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && canvasCarouselIndex < filteredCanvasAssets.length - 1) setCanvasCarouselIndex(i => i + 1);
      else if (diff < 0 && canvasCarouselIndex > 0) setCanvasCarouselIndex(i => i - 1);
    }
    carouselTouchStartX.current = null;
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  if (!selectedProject) {
    return (
      <div className="p-8 text-center animate-fadeIn">
        <div style={{ opacity: 0.6 }}>Loading project...</div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <SectionErrorBoundary name="Project Canvas">
    <div className="project-canvas-view animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ═══════════ SECTION A: COMPACT PROJECT HEADER ═══════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px', padding: isMobile ? '16px' : '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
        flexWrap: 'wrap'
      }}>
        <button onClick={() => setActiveTab('hub')} className="btn-icon-circle back-btn" style={{ flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </button>

        {/* Inline-editable project name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingProjectName ? (
            <input
              autoFocus
              value={projectNameDraft}
              onChange={(e) => setProjectNameDraft(e.target.value)}
              onBlur={() => {
                if (projectNameDraft.trim()) {
                  const updated = { ...selectedProject, name: projectNameDraft.trim() };
                  setSelectedProject(updated);
                  setProjects(prev => Array.isArray(prev) ? prev.map(p => p?.id === updated.id ? updated : p) : []);
                }
                setEditingProjectName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur();
                if (e.key === 'Escape') { setEditingProjectName(false); }
              }}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid var(--color-purple)',
                borderRadius: '8px', padding: '6px 12px', color: 'white', fontSize: '1.3rem',
                fontWeight: '700', width: '100%', outline: 'none'
              }}
            />
          ) : (
            <h1
              onClick={() => { setProjectNameDraft(selectedProject.name || ''); setEditingProjectName(true); }}
              style={{
                margin: 0, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '700', cursor: 'pointer',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
              title="Click to rename"
            >
              {selectedProject.name || 'Untitled Project'}
              <Edit3 size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
            </h1>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span className="badge" style={{ fontSize: '0.7rem' }}>{selectedProject.category || 'General'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedProject.date || 'Just now'}</span>
            <span style={{
              fontSize: '0.7rem', padding: '2px 10px', borderRadius: '20px',
              background: canvasCompletionPercent === 100
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(168, 85, 247, 0.15)',
              color: canvasCompletionPercent === 100 ? '#10b981' : 'var(--color-purple)',
              fontWeight: '600'
            }}>
              {canvasCompletionPercent}% complete
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => setShowCanvasSidebar(true)}
            className="btn-icon-circle glass"
            title="Project Details"
            style={{ background: showCanvasSidebar ? 'rgba(168,85,247,0.3)' : undefined }}
          >
            <Layers size={18} />
          </button>
          <button
            className="btn-pill primary"
            onClick={() => setShowStudioSession(true)}
            style={{ fontSize: '0.8rem' }}
            title="Open multi-track session mixer"
          >
            <LayoutGrid size={14} /> {isMobile ? 'Mix' : 'Session Mixer'}
          </button>
          <button
            className="btn-pill primary"
            onClick={() => setShowOrchestrator(true)}
            style={{ fontSize: '0.8rem' }}
          >
            <Sparkles size={14} /> {isMobile ? 'Create' : 'Open Orchestrator'}
          </button>
        </div>
      </div>

      {/* ═══════════ SECTION B: PRODUCTION JOURNEY PIPELINE ═══════════ */}
      <div style={{
        padding: isMobile ? '16px 12px' : '20px 24px',
        overflowX: 'auto', overflowY: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.15)',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0',
          minWidth: 'max-content', justifyContent: isMobile ? 'flex-start' : 'center'
        }}>
          {pipelineStatus.map((stage, idx) => {
            const StageIcon = stage.icon;
            const isActive = pipelineFilter === stage.key;
            const isComplete = stage.status === 'complete';
            return (
              <React.Fragment key={stage.key}>
                {idx > 0 && (
                  <div style={{
                    width: isMobile ? '24px' : '48px', height: '2px',
                    background: pipelineStatus[idx - 1].status === 'complete' && isComplete
                      ? `linear-gradient(90deg, ${pipelineStatus[idx - 1].color}, ${stage.color})`
                      : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.4s ease',
                    flexShrink: 0
                  }} />
                )}
                <button
                  onClick={() => setPipelineFilter(isActive ? null : stage.key)}
                  title={`${stage.label}${stage.count ? ` (${stage.count})` : ''}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
                    position: 'relative', flexShrink: 0, transition: 'transform 0.2s ease',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  <div style={{
                    width: isMobile ? '36px' : '44px', height: isMobile ? '36px' : '44px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isComplete
                      ? `rgba(${stage.colorRgb}, 0.2)`
                      : 'rgba(255,255,255,0.05)',
                    border: isActive
                      ? `2px solid ${stage.color}`
                      : isComplete
                        ? `1.5px solid rgba(${stage.colorRgb}, 0.5)`
                        : '1.5px solid rgba(255,255,255,0.1)',
                    boxShadow: isComplete ? `0 0 16px rgba(${stage.colorRgb}, 0.3)` : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <StageIcon size={isMobile ? 16 : 20} style={{ color: isComplete ? stage.color : 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.05em',
                    color: isActive ? stage.color : isComplete ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                    transition: 'color 0.3s ease'
                  }}>
                    {stage.label}
                  </span>
                  {stage.count > 0 && stage.key !== 'idea' && (
                    <span style={{
                      position: 'absolute', top: '-4px', right: '-2px',
                      background: stage.color, color: 'white', fontSize: '0.55rem',
                      fontWeight: '700', width: '16px', height: '16px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 8px rgba(${stage.colorRgb}, 0.5)`
                    }}>
                      {stage.count}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        {pipelineFilter && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button
              onClick={() => setPipelineFilter(null)}
              style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline'
              }}
            >
              Clear filter — show all
            </button>
          </div>
        )}
      </div>

      {/* ═══════════ SECTION C: FULL-VIEW CAROUSEL ═══════════ */}
      <div style={{
        display: 'flex', flexDirection: 'column', flex: 1, minHeight: isMobile ? 'auto' : '320px',
        position: 'relative', overflow: 'hidden'
      }}>

        {/* Filter Tabs + Actions Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: isMobile ? '10px 12px' : '14px 24px',
          overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.02)',
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          {[
            { key: 'all', label: 'ALL' },
              { key: 'audio', label: 'Audio' },
              { key: 'vocal', label: 'Vocals' },
              { key: 'visual', label: 'Visual' },
              { key: 'video', label: 'Video' },
              { key: 'text', label: 'Text' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setAssetFilter(tab.key); setPipelineFilter(null); }}
                style={{
                  padding: isMobile ? '6px 12px' : '6px 16px', borderRadius: '20px', fontSize: '0.78rem',
                  fontWeight: assetFilter === tab.key && !pipelineFilter ? '600' : '500',
                  background: assetFilter === tab.key && !pipelineFilter
                    ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: assetFilter === tab.key && !pipelineFilter
                    ? 'var(--color-purple)' : 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  minHeight: '36px'
                }}
              >
                {tab.label}
              </button>
            ))}
            <div style={{ marginLeft: isMobile ? '0' : 'auto', display: 'flex', gap: '8px', flexShrink: 0, width: isMobile ? '100%' : 'auto', marginTop: isMobile ? '4px' : '0' }}>
              <button
                className="btn-pill"
                onClick={() => setShowOrchestrator(true)}
                style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              >
                <Sparkles size={13} /> Generate
              </button>
              <label style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem',
                background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                fontWeight: '500'
              }}>
                <input
                  type="file"
                  accept="audio/*,image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      const type = file.type.startsWith('audio') ? 'Audio' : file.type.startsWith('video') ? 'Video' : 'Image';
                      const newAsset = {
                        id: String(Date.now()),
                        title: file.name,
                        type: type,
                        agent: 'User Upload',
                        date: 'Just now',
                        color: 'agent-cyan',
                        snippet: `Uploaded ${type} file`,
                        audioUrl: file.type.startsWith('audio') ? url : null,
                        videoUrl: file.type.startsWith('video') ? url : null,
                        imageUrl: file.type.startsWith('image') ? url : null
                      };
                      const updated = { ...selectedProject, assets: [newAsset, ...(selectedProject.assets || [])] };
                      setSelectedProject(updated);
                      setProjects(prev => Array.isArray(prev) ? prev.map(p => p.id === updated.id ? updated : p) : [updated]);
                    }
                  }}
                />
                <Upload size={13} /> Upload
              </label>
            </div>
          </div>

          {/* ═══ FULL-VIEW CAROUSEL (default) ═══ */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {filteredCanvasAssets.length > 0 ? (() => {
              const currentAsset = filteredCanvasAssets[canvasCarouselIndex] || filteredCanvasAssets[0];
              if (!currentAsset) return null;
              const agentObj = (typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.find(a => a.name === currentAsset.agent || a.id === currentAsset.agent) : null;
              const agentColor = agentObj?.color || 'var(--color-purple)';
              const isTextAsset = ['text', 'lyrics', 'script'].includes((currentAsset.type || '').toLowerCase());

              return (
                <>
                  {/* Carousel navigation bar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: isMobile ? '8px 12px' : '10px 24px',
                    background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <button
                      onClick={() => setCanvasCarouselIndex(i => Math.max(0, i - 1))}
                      disabled={canvasCarouselIndex === 0}
                      className="btn-icon-circle glass"
                      style={{ opacity: canvasCarouselIndex === 0 ? 0.3 : 1, width: '36px', height: '36px' }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div style={{ textAlign: 'center', minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentAsset.title || 'Untitled'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: agentColor }} />
                        {currentAsset.agent} &bull; {canvasCarouselIndex + 1} / {filteredCanvasAssets.length}
                      </div>
                    </div>
                    <button
                      onClick={() => setCanvasCarouselIndex(i => Math.min(filteredCanvasAssets.length - 1, i + 1))}
                      disabled={canvasCarouselIndex >= filteredCanvasAssets.length - 1}
                      className="btn-icon-circle glass"
                      style={{ opacity: canvasCarouselIndex >= filteredCanvasAssets.length - 1 ? 0.3 : 1, width: '36px', height: '36px' }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Carousel main content area — swipeable */}
                  <div
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
                    onTouchStart={handleCarouselTouchStart}
                    onTouchEnd={handleCarouselTouchEnd}
                  >
                    {/* Media Display */}
                    <div style={{
                      minHeight: isMobile ? '200px' : '340px',
                      maxHeight: isTextAsset ? (isMobile ? '55vh' : '60vh') : (isMobile ? '50vh' : '60vh'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#000', position: 'relative', overflow: 'hidden'
                    }}>
                      {/* Video */}
                      {currentAsset.videoUrl && (
                        <video
                          key={currentAsset.id || canvasCarouselIndex}
                          src={formatVideoSrc(currentAsset.videoUrl)}
                          controls playsInline
                          style={{ width: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      {/* Image */}
                      {!currentAsset.videoUrl && currentAsset.imageUrl && (
                        <img
                          key={currentAsset.id || canvasCarouselIndex}
                          src={formatImageSrc(currentAsset.imageUrl)}
                          alt={currentAsset.title || 'Asset'}
                          style={{ width: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%231a1a2e" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-family="sans-serif"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      )}
                      {/* Audio + Text (lyrics/scripts) */}
                      {!currentAsset.videoUrl && !currentAsset.imageUrl && (
                        <div style={{
                          width: '100%', padding: isMobile ? '16px' : '32px', display: 'flex', flexDirection: 'column',
                          background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
                          minHeight: '200px', maxHeight: isMobile ? '55vh' : '60vh', overflow: 'hidden'
                        }}>
                          {currentAsset.audioUrl && (
                            <div style={{
                              marginBottom: '16px', background: 'rgba(0,0,0,0.4)', padding: '14px',
                              borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)',
                              display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0
                            }}>
                              <div className="pulse-icon" style={{ flexShrink: 0 }}>
                                <Music size={22} className="text-purple" />
                              </div>
                              <audio
                                ref={canvasAudioRef}
                                key={currentAsset.id || currentAsset.audioUrl}
                                src={formatAudioSrc(currentAsset.audioUrl)}
                                controls crossOrigin="anonymous"
                                style={{ flex: 1, height: '36px' }}
                                onPlay={(e) => {
                                  document.querySelectorAll('audio, video').forEach(el => {
                                    if (el !== e.target) el.pause();
                                  });
                                }}
                                onError={(e) => {
                                  const rawUrl = currentAsset.audioUrl;
                                  if (rawUrl && !e.target.dataset.retried) {
                                    e.target.dataset.retried = 'true';
                                    if (rawUrl.startsWith('http')) {
                                      e.target.removeAttribute('crossorigin');
                                      e.target.src = rawUrl;
                                      return;
                                    }
                                  }
                                  toast.error('Could not load audio file');
                                }}
                              />
                            </div>
                          )}
                          {/* Lyrics / Text content — properly styled */}
                          {(currentAsset.content || currentAsset.snippet) && (
                            <div style={{
                              flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px',
                              background: 'rgba(0,0,0,0.3)', borderRadius: '12px',
                              border: '1px solid rgba(255,255,255,0.05)',
                              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                            }}>
                              <div style={{
                                fontFamily: isTextAsset ? "'Georgia', 'Times New Roman', serif" : "'Inter', sans-serif",
                                fontSize: isMobile ? '1rem' : '1.15rem',
                                lineHeight: '2',
                                color: 'rgba(255,255,255,0.92)',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                letterSpacing: '0.01em'
                              }}>
                                {(currentAsset.content || currentAsset.snippet)
                                  .split('\n')
                                  .map((line, i) => {
                                    // Style section headers like [Verse 1], [Chorus], etc.
                                    if (/^\[.*\]$/.test(line.trim())) {
                                      return (
                                        <div key={i} style={{
                                          color: 'var(--color-purple)',
                                          fontWeight: '700',
                                          fontSize: isMobile ? '0.85rem' : '0.95rem',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.1em',
                                          marginTop: i > 0 ? '20px' : '0',
                                          marginBottom: '8px',
                                          fontFamily: "'Inter', sans-serif"
                                        }}>
                                          {line.trim()}
                                        </div>
                                      );
                                    }
                                    // Empty lines = stanza break
                                    if (line.trim() === '') {
                                      return <div key={i} style={{ height: '12px' }} />;
                                    }
                                    return <div key={i}>{line}</div>;
                                  })}
                              </div>
                            </div>
                          )}
                          {!currentAsset.audioUrl && !(currentAsset.content || currentAsset.snippet) && (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              No preview content available.
                            </div>
                          )}
                        </div>
                      )}
                      {/* Type Badge overlay */}
                      <div style={{
                        position: 'absolute', top: '10px', left: '10px',
                        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                        padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem',
                        color: 'white', display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        {(currentAsset.type?.toLowerCase() === 'video') && <VideoIcon size={10} />}
                        {(currentAsset.type?.toLowerCase() === 'audio' || currentAsset.type?.toLowerCase() === 'vocal') && <Music size={10} />}
                        {(currentAsset.type?.toLowerCase() === 'image' || currentAsset.type?.toLowerCase() === 'visual') && <ImageIcon size={10} />}
                        {(currentAsset.type?.toLowerCase() === 'text' || currentAsset.type?.toLowerCase() === 'lyrics' || currentAsset.type?.toLowerCase() === 'script') && <FileText size={10} />}
                        {currentAsset.type}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', flexShrink: 0 }}>
                      {[
                        { label: 'Type', value: currentAsset.type || 'Unknown' },
                        { label: 'Agent', value: currentAsset.agent || 'System' },
                        { label: 'Created', value: currentAsset.date || 'Unknown' }
                      ].map(meta => (
                        <div key={meta.label} style={{
                          background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '10px', textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{meta.label}</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white' }}>{meta.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Dot indicators with type icons for carousel position */}
                    {filteredCanvasAssets.length > 1 && (
                      <div style={{
                        display: 'flex', justifyContent: 'center', gap: '6px', padding: '8px 0', flexShrink: 0,
                        alignItems: 'center'
                      }}>
                        {filteredCanvasAssets.slice(0, 20).map((asset, i) => {
                          const isActive = canvasCarouselIndex === i;
                          const assetType = (asset?.type || '').toLowerCase();
                          const TypeIcon = assetType === 'video' ? VideoIcon
                            : (assetType === 'audio' || assetType === 'vocal') ? Music
                            : (assetType === 'image' || assetType === 'visual') ? ImageIcon
                            : FileText;
                          return (
                            <button
                              key={i}
                              onClick={() => setCanvasCarouselIndex(i)}
                              title={asset?.title || `Asset ${i + 1}`}
                              style={{
                                width: isActive ? '24px' : '10px',
                                height: isActive ? '24px' : '10px',
                                borderRadius: isActive ? '12px' : '5px',
                                background: isActive ? 'var(--color-purple)' : 'rgba(255,255,255,0.15)',
                                border: 'none', cursor: 'pointer',
                                transition: 'all 0.2s ease', padding: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              {isActive && <TypeIcon size={12} style={{ color: 'white' }} />}
                            </button>
                          );
                        })}
                        {filteredCanvasAssets.length > 20 && (
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>+{filteredCanvasAssets.length - 20}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons — sticky at bottom */}
                  <div style={{
                    padding: '12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap',
                    borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
                    background: 'rgba(0,0,0,0.15)',
                    ...(isMobile ? { paddingBottom: 'max(12px, env(safe-area-inset-bottom))' } : {})
                  }}>
                    <button
                      onClick={() => {
                        try {
                          const mediaUrl = currentAsset.audioUrl || currentAsset.videoUrl || currentAsset.imageUrl;
                          if (!mediaUrl) {
                            if (currentAsset.content || currentAsset.snippet) {
                              const blob = new Blob([currentAsset.content || currentAsset.snippet], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `${currentAsset.title || 'asset'}.txt`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                              toast.success('Text file downloaded');
                            } else {
                              toast.error('No downloadable content');
                            }
                            return;
                          }
                          const link = document.createElement('a');
                          link.href = mediaUrl;
                          link.download = currentAsset.title || 'download';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.success('Download started');
                        } catch (err) {
                          toast.error('Download failed');
                        }
                      }}
                      className="btn-pill"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                    >
                      <Download size={14} /> Download
                    </button>
                    <button
                      onClick={() => {
                        const assetsList = Array.isArray(selectedProject?.assets) ? selectedProject.assets.filter(Boolean) : [];
                        safeOpenPreview(currentAsset, assetsList);
                      }}
                      className="btn-pill"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                    >
                      <Maximize2 size={14} /> Fullscreen
                    </button>
                    {/* Use as Backing Track — shown for audio/vocal assets */}
                    {currentAsset.audioUrl && (
                      <button
                        onClick={() => {
                          const isAlready = backingTrack && backingTrack.audioUrl === currentAsset.audioUrl;
                          if (isAlready) {
                            setBackingTrack(null);
                            toast.success('Backing track cleared');
                          } else {
                            setBackingTrack({
                              title: currentAsset.title || 'Untitled Beat',
                              audioUrl: currentAsset.audioUrl,
                              bpm: currentAsset.bpm || null,
                              id: currentAsset.id
                            });
                            toast.success(`🎵 "${currentAsset.title || 'Beat'}" set as backing track — vocals & video will sync to it`);
                          }
                        }}
                        className={`btn-pill ${(backingTrack && backingTrack.audioUrl === currentAsset.audioUrl) ? 'primary' : ''}`}
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                      >
                        <Link2 size={14} /> {(backingTrack && backingTrack.audioUrl === currentAsset.audioUrl) ? 'Synced ✓' : 'Sync Track'}
                      </button>
                    )}
                    {(currentAsset.content || currentAsset.snippet) && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentAsset.content || currentAsset.snippet || '');
                          toast.success('Text copied');
                        }}
                        className="btn-pill"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                      >
                        <Copy size={14} /> Copy
                      </button>
                    )}
                    <button
                      onClick={() => {
                        toast((t) => (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontWeight: 600 }}>Delete "{currentAsset.title || 'this asset'}"?</span>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button
                                onClick={() => {
                                  toast.dismiss(t.id);
                                  const currentAssets = Array.isArray(selectedProject?.assets) ? selectedProject.assets : [];
                                  const updatedAssets = currentAssets.filter(a => a?.id !== currentAsset.id);
                                  const updated = { ...selectedProject, assets: updatedAssets, updatedAt: new Date().toISOString() };
                                  setSelectedProject(updated);
                                  setProjects(prev => Array.isArray(prev) ? prev.map(p => p.id === updated.id ? updated : p) : [updated]);
                                  // Navigate to next asset or wrap
                                  if (canvasCarouselIndex >= updatedAssets.length) {
                                    setCanvasCarouselIndex(Math.max(0, updatedAssets.length - 1));
                                  }
                                  toast.success('Asset deleted');
                                }}
                                style={{ padding: '6px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                              >Delete</button>
                              <button
                                onClick={() => toast.dismiss(t.id)}
                                style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer' }}
                              >Cancel</button>
                            </div>
                          </div>
                        ), { duration: 10000, style: { background: '#1a1a2e', color: 'white', borderRadius: '12px' } });
                      }}
                      className="btn-pill"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', color: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              );
            })() : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: isMobile ? '24px 16px' : '32px', textAlign: 'center'
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.02)', borderRadius: '16px',
                  border: '2px dashed rgba(255,255,255,0.05)', padding: isMobile ? '32px 16px' : '40px',
                  maxWidth: '500px'
                }}>
                  <Layers size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {pipelineFilter || assetFilter !== 'all' ? 'No matching assets' : 'No generations yet'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', opacity: 0.7, maxWidth: '400px', margin: '0 auto 24px auto' }}>
                    {pipelineFilter || assetFilter !== 'all'
                      ? 'Try a different filter or generate new assets with the Orchestrator.'
                      : 'Start by opening the Studio Orchestrator or uploading your own files.'}
                  </p>
                  <button className="btn-pill primary" onClick={() => setShowOrchestrator(true)}>
                    <Sparkles size={16} /> Start Creating
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* ═══════════ SECTION D: COLLAPSIBLE SIDEBAR (OVERLAY) ═══════════ */}
      {showCanvasSidebar && (
        <>
          <div
            onClick={() => setShowCanvasSidebar(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 90, backdropFilter: 'blur(4px)'
            }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: isMobile ? '85vw' : '380px', maxWidth: '420px',
            background: 'var(--color-bg-secondary, #12121a)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            zIndex: 91, overflowY: 'auto', padding: '24px',
            animation: 'slideInFromRight 0.3s ease',
            display: 'flex', flexDirection: 'column', gap: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Project Details</h2>
              <button onClick={() => setShowCanvasSidebar(false)} className="btn-icon-circle glass">
                <X size={18} />
              </button>
            </div>

            {/* Team */}
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.95rem' }}>
                <UsersIcon size={16} className="text-purple" /> The Team
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedProject.agents && selectedProject.agents.length > 0 ? (
                  selectedProject.agents.filter(Boolean).map((agentItem, idx) => {
                    const agentId = typeof agentItem === 'object' ? (agentItem.id || agentItem.name) : agentItem;
                    const agent = (typeof AGENTS !== 'undefined' && AGENTS)
                      ? (AGENTS.find(a => a.id === agentId || a.name === agentId) || (typeof agentItem === 'object' ? agentItem : AGENTS[0] || null))
                      : (typeof agentItem === 'object' ? agentItem : null);
                    if (!agent) return null;
                    const ac = getAgentHex(agent);
                    return (
                      <div
                        key={agent.id || idx}
                        className="haptic-press"
                        onClick={() => setSelectedAgent(agent)}
                        style={{
                          padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
                          display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                          border: '1px solid transparent', borderLeft: `3px solid ${ac}`,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = ac; e.currentTarget.style.borderLeftWidth = '3px'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.borderLeft = `3px solid ${ac}`; }}
                      >
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: `${ac}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {(typeof agent.icon === 'function') ? <agent.icon size={18} color={ac} /> : <User size={18} color={ac} />}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{agent.name}</span>
                            {agent.category && (
                              <span style={{ padding: '1px 5px', background: `${ac}1A`, color: ac, borderRadius: '5px', fontSize: '0.55rem', fontWeight: '600' }}>{agent.category}</span>
                            )}
                          </div>
                          {agent.capabilities && agent.capabilities.length > 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {agent.capabilities.slice(0, 2).join(' · ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No agents selected</div>
                )}
                <button
                  onClick={() => setShowAddAgentModal(true)}
                  style={{
                    width: '100%', padding: '10px', border: '1px dashed var(--text-secondary)',
                    borderRadius: '10px', color: 'var(--text-secondary)', background: 'transparent',
                    cursor: 'pointer', fontSize: '0.85rem'
                  }}
                >
                  + Add Agent
                </button>
              </div>
            </div>

            {/* Vision */}
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.95rem' }}>
                <Book size={16} className="text-cyan" /> Narrative & Vision
              </h3>
              <textarea
                value={selectedProject?.description || ''}
                onChange={(e) => {
                  if (!selectedProject) return;
                  const updated = { ...selectedProject, description: e.target.value };
                  setSelectedProject(updated);
                  setProjects(prev => Array.isArray(prev) ? prev.map(p => p?.id === updated.id ? updated : p) : []);
                }}
                className="narrative-textarea"
                placeholder="Describe your project vision here..."
                style={{
                  width: '100%', minHeight: '120px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                  padding: '12px', color: 'white', fontSize: '0.85rem', resize: 'vertical'
                }}
              />
            </div>

            {/* Marketing */}
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.95rem' }}>
                <Share2 size={16} className="text-pink" /> Marketing
              </h3>

              {selectedProject.socialHandle && (
                <div style={{
                  background: 'rgba(6, 182, 212, 0.1)', borderRadius: '10px', padding: '14px',
                  marginBottom: '12px', border: '1px solid rgba(6, 182, 212, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Share2 size={16} className="text-cyan" />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedProject.socialHandle}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {selectedProject.socialPlatform} &bull; {selectedProject.category}
                      </div>
                    </div>
                  </div>
                  {selectedProject.socialBio && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      &ldquo;{selectedProject.socialBio}&rdquo;
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{
                  padding: '6px 12px', borderRadius: '20px', fontSize: '0.78rem',
                  background: socialConnections.twitter ? 'rgba(29, 161, 242, 0.2)' : 'rgba(255,255,255,0.1)',
                  color: socialConnections.twitter ? '#1DA1F2' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Twitter size={13} /> {socialConnections.twitter ? 'Connected' : 'Link X'}
                </div>
                <div style={{
                  padding: '6px 12px', borderRadius: '20px', fontSize: '0.78rem',
                  background: socialConnections.instagram ? 'rgba(225, 48, 108, 0.2)' : 'rgba(255,255,255,0.1)',
                  color: socialConnections.instagram ? '#E1306C' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Instagram size={13} /> {socialConnections.instagram ? 'Connected' : 'Link IG'}
                </div>
              </div>
            </div>

            {/* Orchestrator Quick-Launch */}
            <div style={{
              padding: '16px', background: 'rgba(168, 85, 247, 0.05)',
              borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', marginTop: 'auto'
            }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.95rem', color: 'var(--color-purple)' }}>
                <Zap size={16} /> Studio Orchestrator
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Generate lyrics, beats, visuals & more with one click.
              </p>
              <button
                className="btn-pill primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setShowOrchestrator(true);
                  setShowCanvasSidebar(false);
                }}
              >
                <Sparkles size={16} /> Open Orchestrator
              </button>
            </div>
          </div>
        </>
      )}
    </div>
    </SectionErrorBoundary>
  );
}
