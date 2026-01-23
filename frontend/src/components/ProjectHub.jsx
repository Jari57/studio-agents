import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Plus, LayoutGrid, List, MoreVertical,
  Eye, Share2, Trash2, Edit3, Copy, Twitter, Instagram,
  Clock, CheckCircle, Circle, Archive, Sparkles, Folder,
  Music, Video, Image, Disc, Film, Palette, X, ChevronRight,
  Save, Play, Pause, Volume2, Maximize2, Download, FileText,
  ChevronLeft, RotateCcw, Heart, Bookmark, Layers, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PROJECT_TEMPLATES, PROJECT_STATUSES, createProjectFromTemplate } from '../data/projectTemplates';
// import { AGENTS } from '../constants'; - unused

/**
 * ProjectHub - Comprehensive project management view
 * Features: Grid/List view, filters, templates, full CRUD, share to social
 */
function ProjectHub({ 
  projects = [], 
  setProjects,
  onSelectProject,
  // onCreateProject, - reserved for future use
  onDeleteProject,
  setActiveTab
  // setSelectedAgent, - reserved for future use
  // setQuickWorkflowAgent - reserved for future use
}) {
  // TRACE: Log what ProjectHub receives
  React.useEffect(() => {
    console.log('[TRACE:ProjectHub] Projects received:', {
      count: projects.length,
      projectSummary: projects.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        assetCount: p.assets?.length || 0,
        hasAssets: Array.isArray(p.assets) && p.assets.length > 0
      }))
    });
  }, [projects]);

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [language, setLanguage] = useState('English');
  const [style, setStyle] = useState('Modern Hip-Hop');
  const [model, setModel] = useState('Gemini 2.0 Flash');
  const [showProjectMenu, setShowProjectMenu] = useState(null);
  
  // NEW: Editor-like features
  const [previewProject, setPreviewProject] = useState(null); // Quick preview panel
  const [previewAsset, setPreviewAsset] = useState(null); // Full asset preview
  const [editingProjectId, setEditingProjectId] = useState(null); // Inline editing
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [favoriteProjects, setFavoriteProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studio_favorite_projects') || '[]');
    } catch { return []; }
  });
  const [recentProjects, setRecentProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studio_recent_projects') || '[]');
    } catch { return []; }
  });
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('studio_favorite_projects', JSON.stringify(favoriteProjects));
  }, [favoriteProjects]);

  // Save recents to localStorage
  useEffect(() => {
    localStorage.setItem('studio_recent_projects', JSON.stringify(recentProjects));
  }, [recentProjects]);

  // Track project access (add to recents)
  const trackRecentProject = (projectId) => {
    setRecentProjects(prev => {
      const filtered = prev.filter(id => id !== projectId);
      return [projectId, ...filtered].slice(0, 10); // Keep last 10
    });
  };

  const toggleFavorite = (projectId, e) => {
    e?.stopPropagation();
    setFavoriteProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  // Handle inline save
  const handleSaveEdit = (project) => {
    if (!project || !editName.trim()) return;
    setIsSaving(true);
    const updated = { 
      ...project, 
      name: editName.trim(), 
      description: editDescription.trim(),
      updatedAt: new Date().toISOString() 
    };
    setProjects?.(prev => (prev || []).map(p => p?.id === project.id ? updated : p));
    setTimeout(() => {
      setIsSaving(false);
      setSavedRecently(true);
      setEditingProjectId(null);
      toast.success('Project saved');
      setTimeout(() => setSavedRecently(false), 2000);
    }, 300);
  };

  // Start inline edit
  const startEdit = (project, e) => {
    e?.stopPropagation();
    setEditingProjectId(project.id);
    setEditName(project.name);
    setEditDescription(project.description || '');
    setShowProjectMenu(null);
  };

  // Play/pause audio
  const toggleAudio = (audioUrl, e) => {
    e?.stopPropagation();
    if (currentAudioUrl === audioUrl && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setCurrentAudioUrl(audioUrl);
        setIsPlaying(true);
      }
    }
  };

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    let filtered = projects.filter(p => {
      if (!p) return false; // Skip null/undefined entries
      // Favorites filter
      if (statusFilter === 'favorites') {
        if (!favoriteProjects.includes(p.id)) return false;
      }
      // Recents filter
      else if (statusFilter === 'recents') {
        if (!recentProjects.includes(p.id)) return false;
      }
      // Status filter (skip for 'all', 'favorites', 'recents')
      else if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
        );
      }
      return true;
    });

    // Sort recents by access order
    if (statusFilter === 'recents') {
      filtered.sort((a, b) => recentProjects.indexOf(a.id) - recentProjects.indexOf(b.id));
    }

    return filtered;
  }, [projects, statusFilter, searchQuery, favoriteProjects, recentProjects]);

  // Count projects by status
  const statusCounts = useMemo(() => {
    const safeProjects = projects || [];
    return {
      all: safeProjects.length,
      active: safeProjects.filter(p => p?.status === 'active').length,
      completed: safeProjects.filter(p => p?.status === 'completed').length,
      paused: safeProjects.filter(p => p?.status === 'paused').length,
      archived: safeProjects.filter(p => p?.status === 'archived').length,
    };
  }, [projects]);

  // Handle template selection
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setNewProjectName(template.name);
  };

  // Create project from template
  const handleCreateFromTemplate = () => {
    if (!selectedTemplate) return;
    
    const newProject = createProjectFromTemplate(selectedTemplate, newProjectName);
    // Add language, style and model to the new project
    newProject.language = language;
    newProject.style = style;
    newProject.model = model;
    
    setProjects?.(prev => [newProject, ...prev]);
    setShowTemplateModal(false);
    setSelectedTemplate(null);
    setNewProjectName('');
    toast.success(`Created "${newProject.name}"`);
    onSelectProject?.(newProject);
  };

  // Project actions
  const handleDeleteProject = (projectId, e) => {
    e?.stopPropagation();
    
    // Clean up any UI state referencing the deleted project
    if (previewProject?.id === projectId) {
      setPreviewProject(null);
    }
    if (previewAsset?.projectId === projectId) {
      setPreviewAsset(null);
    }
    if (editingProjectId === projectId) {
      setEditingProjectId(null);
    }
    
    // Remove from recents and favorites
    setRecentProjects(prev => prev.filter(id => id !== projectId));
    setFavoriteProjects(prev => prev.filter(id => id !== projectId));
    
    // Use the callback from StudioView which handles both local state and cloud deletion
    if (onDeleteProject) {
      onDeleteProject(projectId, e);
    } else {
      // Fallback: local-only delete if no callback provided
      if (window.confirm('Delete this project? This cannot be undone.')) {
        setProjects?.(prev => (prev || []).filter(p => p?.id !== projectId));
        toast.success('Project deleted');
      }
    }
    setShowProjectMenu(null);
  };

  const handleDuplicateProject = (project, e) => {
    e?.stopPropagation();
    if (!project) return;
    const duplicate = {
      ...project,
      id: Date.now(),
      name: `${project.name || 'Untitled'} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects?.(prev => [duplicate, ...(prev || [])]);
    toast.success('Project duplicated');
    setShowProjectMenu(null);
  };

  const handleArchiveProject = (project, e) => {
    e?.stopPropagation();
    if (!project) return;
    const updated = { ...project, status: project.status === 'archived' ? 'active' : 'archived' };
    setProjects?.(prev => (prev || []).map(p => p?.id === project.id ? updated : p));
    toast.success(updated.status === 'archived' ? 'Project archived' : 'Project restored');
    setShowProjectMenu(null);
  };

  const handleStatusChange = (project, newStatus, e) => {
    e?.stopPropagation();
    if (!project) return;
    const updated = { ...project, status: newStatus, updatedAt: new Date().toISOString() };
    setProjects?.(prev => (prev || []).map(p => p?.id === project.id ? updated : p));
    toast.success(`Status: ${newStatus}`);
    setShowProjectMenu(null);
  };

  const handleShareToTwitter = (project, e) => {
    e?.stopPropagation();
    const text = `Check out my new project: ${project.name} 🎵 Made with @StudioAgentsAI`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    setShowProjectMenu(null);
  };

  const handleShareToInstagram = (project, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(`${project.name} - Made with Studio Agents AI 🎵`);
    toast.success('Caption copied! Open Instagram to share.');
    setShowProjectMenu(null);
  };

  // Get icon for category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'music': return Disc;
      case 'visual': return Image;
      case 'video': return Video;
      case 'marketing': return Share2;
      case 'branding': return Palette;
      case 'business': return Film;
      default: return Folder;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusObj = PROJECT_STATUSES.find(s => s.id === status);
    return statusObj?.color || 'var(--text-secondary)';
  };

  return (
    <div className="project-hub-v2 animate-fadeInUp">
      {/* Header Section */}
      <div className="hub-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px' }}>Project Hub</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Manage all your creative projects in one place
            </p>
          </div>
          <button 
            className="cta-button-premium touch-feedback"
            onClick={() => setShowTemplateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            New Project
          </button>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div className="search-bar-v2" style={{ flex: '1', minWidth: '200px' }}>
            <Search size={18} style={{ color: 'var(--text-secondary)' }} />
            <input 
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="filter-chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All', icon: null },
              { id: 'recents', label: 'Recent', icon: Clock },
              { id: 'favorites', label: 'Favorites', icon: Heart },
              { id: 'active', label: 'Active', icon: null },
              { id: 'completed', label: 'Completed', icon: null },
              { id: 'archived', label: 'Archived', icon: null },
            ].map(filter => {
              const count = filter.id === 'favorites' 
                ? favoriteProjects.length 
                : filter.id === 'recents'
                  ? recentProjects.filter(id => projects.some(p => p.id === id)).length
                  : statusCounts[filter.id];
              return (
                <button
                  key={filter.id}
                  className={`filter-chip ${statusFilter === filter.id ? 'active' : ''}`}
                  onClick={() => setStatusFilter(filter.id)}
                  style={filter.id === 'favorites' && favoriteProjects.length > 0 ? { 
                    borderColor: 'var(--color-pink)',
                    background: statusFilter === 'favorites' ? 'rgba(236, 72, 153, 0.2)' : 'transparent'
                  } : {}}
                >
                  {filter.icon && <filter.icon size={14} style={{ marginRight: '4px' }} />}
                  {filter.label}
                  <span style={{ 
                    marginLeft: '6px', 
                    fontSize: '0.75rem', 
                    opacity: 0.7,
                    background: 'rgba(255,255,255,0.1)',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Toggle */}
          <div className="view-toggle">
            <button 
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="empty-state-v2">
          <div className="empty-state-icon">
            <Folder size={36} />
          </div>
          <h3 className="empty-state-title">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="empty-state-desc">
            {searchQuery 
              ? `No projects match "${searchQuery}"`
              : 'Create your first project to get started with your creative journey.'
            }
          </p>
          {!searchQuery && (
            <div className="empty-state-actions">
              <button 
                className="cta-button-premium"
                onClick={() => setShowTemplateModal(true)}
              >
                <Plus size={18} />
                Create Project
              </button>
              <button 
                className="cta-button-secondary"
                onClick={() => setActiveTab('agents')}
              >
                Browse Agents
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="stagger-children" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredProjects.map((project) => {
            const CategoryIcon = getCategoryIcon(project.category);
            return (
              <div 
                key={project.id}
                className="project-card-v2 touch-feedback"
                onClick={() => {
                  console.log('[ProjectHub] Card clicked for project:', project.id, project.name);
                  trackRecentProject(project.id);
                  onSelectProject?.(project);
                }}
                onTouchEnd={(e) => {
                  // Only handle touch on card itself, not on child elements
                  if (e.target === e.currentTarget) {
                    console.log('[ProjectHub] Card touched for project:', project.id, project.name);
                    trackRecentProject(project.id);
                    onSelectProject?.(project);
                  }
                }}
              >
                {/* Card Header */}
                <div className="project-card-thumb" style={{
                  background: project.coverImage 
                    ? `url(${project.coverImage}) center/cover`
                    : `linear-gradient(135deg, ${getStatusColor(project.status)}30 0%, var(--color-bg-tertiary) 100%)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  {/* Cover Overlay */}
                  {project.coverImage && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)'
                    }} />
                  )}
                  
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    gap: '8px',
                    zIndex: 2
                  }}>
                    <span style={{
                      padding: '4px 10px',
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: getStatusColor(project.status),
                      textTransform: 'uppercase',
                      backdropFilter: 'blur(8px)'
                    }}>
                      {project.status || 'active'}
                    </span>
                  </div>
                  
                  {/* Menu Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowProjectMenu(showProjectMenu === project.id ? null : project.id); }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(0,0,0,0.5)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      color: 'white',
                      cursor: 'pointer',
                      backdropFilter: 'blur(8px)',
                      zIndex: 2
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Dropdown Menu */}
                  {showProjectMenu === project.id && (
                    <div 
                      className="animate-fadeScale"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: '48px',
                        right: '12px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '8px',
                        minWidth: '180px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                        zIndex: 100
                      }}
                    >
                      <button onClick={() => { onSelectProject?.(project); setShowProjectMenu(null); }} className="dropdown-item">
                        <Eye size={16} /> View Project
                      </button>
                      <button onClick={(e) => startEdit(project, e)} className="dropdown-item">
                        <Edit3 size={16} /> Edit Details
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setPreviewProject(project); setShowProjectMenu(null); }} className="dropdown-item">
                        <Layers size={16} /> Quick Preview
                      </button>
                      <button onClick={(e) => handleDuplicateProject(project, e)} className="dropdown-item">
                        <Copy size={16} /> Duplicate
                      </button>
                      <button onClick={(e) => toggleFavorite(project.id, e)} className="dropdown-item">
                        <Heart size={16} style={{ fill: favoriteProjects.includes(project.id) ? 'var(--color-pink)' : 'none' }} /> 
                        {favoriteProjects.includes(project.id) ? 'Unfavorite' : 'Favorite'}
                      </button>
                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
                      <button onClick={(e) => handleShareToTwitter(project, e)} className="dropdown-item">
                        <Twitter size={16} /> Share to X
                      </button>
                      <button onClick={(e) => handleShareToInstagram(project, e)} className="dropdown-item">
                        <Instagram size={16} /> Share to Instagram
                      </button>
                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
                      <button onClick={(e) => handleStatusChange(project, 'completed', e)} className="dropdown-item" style={{ color: 'var(--color-emerald)' }}>
                        <CheckCircle size={16} /> Mark Complete
                      </button>
                      <button onClick={(e) => handleArchiveProject(project, e)} className="dropdown-item">
                        <Archive size={16} /> {project.status === 'archived' ? 'Restore' : 'Archive'}
                      </button>
                      <button onClick={(e) => handleDeleteProject(project.id, e)} className="dropdown-item" style={{ color: 'var(--color-red)' }}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}

                  {/* Center Icon (if no cover image) */}
                  {!project.coverImage && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <CategoryIcon size={48} style={{ opacity: 0.3 }} />
                    </div>
                  )}

                  {/* Audio Player Overlay (appears on hover) */}
                  {(() => {
                    // Find the beat audio asset
                    const beatAsset = project.assets?.find(a => a.audioUrl);
                    return beatAsset ? (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          zIndex: 2
                        }}
                      >
                        <audio 
                          controls
                          style={{ 
                            width: '100%', 
                            height: '24px',
                            accentColor: 'var(--color-purple)'
                          }}
                          controlsList="nodownload"
                        >
                          <source src={beatAsset.audioUrl} type="audio/mpeg" />
                          <source src={beatAsset.audioUrl} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ) : null;
                  })()}

                  {/* Progress Bar */}
                  {project.progress > 0 && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                      <div className="progress-bar-v2" style={{ borderRadius: 0 }}>
                        <div className="progress-bar-v2-fill" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Body - With Inline Editing */}
                <div className="project-card-body">
                  {editingProjectId === project.id ? (
                    /* Inline Edit Mode */
                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Project name..."
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          marginBottom: '8px',
                          background: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--color-purple)',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(project);
                          if (e.key === 'Escape') setEditingProjectId(null);
                        }}
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Add description..."
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          marginBottom: '8px',
                          background: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '0.85rem',
                          resize: 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleSaveEdit(project)}
                          disabled={isSaving}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: 'var(--color-purple)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontWeight: '600',
                            fontSize: '0.85rem'
                          }}
                        >
                          <Save size={14} />
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingProjectId(null)}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal View */
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <h3 style={{ 
                          fontSize: '1.05rem', 
                          fontWeight: '600', 
                          flex: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          margin: 0
                        }}>
                          {project.name}
                        </h3>
                        {favoriteProjects.includes(project.id) && (
                          <Heart size={14} style={{ color: 'var(--color-pink)', fill: 'var(--color-pink)', flexShrink: 0 }} />
                        )}
                        {savedRecently && editingProjectId === project.id && (
                          <CheckCircle size={14} style={{ color: 'var(--color-emerald)', flexShrink: 0 }} />
                        )}
                      </div>
                      <p style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-secondary)',
                        marginBottom: '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {project.description || 'No description'}
                      </p>

                      {/* Asset Preview Strip */}
                      {project.assets && project.assets.length > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          gap: '6px', 
                          marginBottom: '12px', 
                          overflowX: 'auto',
                          paddingBottom: '4px'
                        }}>
                          {project.assets.slice(0, 5).map((asset, idx) => (
                            <div
                              key={asset.id || idx}
                              onClick={(e) => { e.stopPropagation(); setPreviewAsset({ ...asset, projectName: project.name }); }}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: asset.imageUrl 
                                  ? `url(${asset.imageUrl}) center/cover`
                                  : asset.audioUrl 
                                    ? 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-cyan) 100%)'
                                    : asset.videoUrl
                                      ? 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-emerald) 100%)'
                                      : 'linear-gradient(135deg, var(--color-orange) 0%, var(--color-pink) 100%)',
                                flexShrink: 0,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid transparent',
                                transition: 'all 0.2s ease'
                              }}
                              className="asset-thumb-hover"
                              title={asset.title || 'Asset'}
                            >
                              {!asset.imageUrl && (
                                asset.audioUrl ? <Music size={16} style={{ color: 'white' }} /> :
                                asset.videoUrl ? <Video size={16} style={{ color: 'white' }} /> :
                                <FileText size={16} style={{ color: 'white' }} />
                              )}
                            </div>
                          ))}
                          {project.assets.length > 5 && (
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              fontWeight: '600',
                              flexShrink: 0
                            }}>
                              +{project.assets.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} />
                          {project.date || 'Today'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Sparkles size={14} />
                          {project.assets?.length || 0} assets
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Card Actions - Editor Style */}
                <div 
                  className="project-card-actions" 
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'relative', zIndex: 50, pointerEvents: 'auto' }}
                >
                  <button 
                    className="project-card-action-btn primary"
                    style={{ pointerEvents: 'auto', zIndex: 51, minHeight: '44px', flex: 1 }}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      e.preventDefault();
                      trackRecentProject(project.id);
                      onSelectProject?.(project); 
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      trackRecentProject(project.id);
                      onSelectProject?.(project);
                    }}
                  >
                    <Zap size={16} /> Open
                  </button>
                  <button 
                    className="project-card-action-btn"
                    style={{ pointerEvents: 'auto', zIndex: 51, minHeight: '44px' }}
                    onClick={(e) => { e.stopPropagation(); trackRecentProject(project.id); setPreviewProject(project); }}
                    onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); trackRecentProject(project.id); setPreviewProject(project); }}
                    title="Quick Preview"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    className="project-card-action-btn"
                    style={{ pointerEvents: 'auto', zIndex: 51, minHeight: '44px' }}
                    onClick={(e) => startEdit(project, e)}
                    onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); startEdit(project, e); }}
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    className="project-card-action-btn"
                    style={{ pointerEvents: 'auto', zIndex: 51, minHeight: '44px' }}
                    onClick={(e) => toggleFavorite(project.id, e)}
                    onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); toggleFavorite(project.id, e); }}
                    title="Favorite"
                  >
                    <Heart size={16} style={{ fill: favoriteProjects.includes(project.id) ? 'var(--color-pink)' : 'none', color: favoriteProjects.includes(project.id) ? 'var(--color-pink)' : 'inherit' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {filteredProjects.map((project, idx) => {
            const CategoryIcon = getCategoryIcon(project.category);
            return (
              <div
                key={project.id}
                className="project-list-item touch-feedback"
                onClick={() => {
                  console.log('[ProjectHub] List item clicked for project:', project.id, project.name);
                  trackRecentProject(project.id);
                  onSelectProject?.(project);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  console.log('[ProjectHub] List item touched for project:', project.id, project.name);
                  trackRecentProject(project.id);
                  onSelectProject?.(project);
                }}
                style={{ borderBottom: idx < filteredProjects.length - 1 ? '1px solid var(--border-color)' : 'none', cursor: 'pointer' }}
              >
                <div className="project-list-thumb" style={{
                  background: `linear-gradient(135deg, ${getStatusColor(project.status)}30 0%, var(--color-bg-tertiary) 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CategoryIcon size={24} style={{ opacity: 0.5 }} />
                </div>
                
                <div className="project-list-info">
                  <div className="project-list-title">{project.name}</div>
                  <div className="project-list-meta">
                    <span style={{ color: getStatusColor(project.status), fontWeight: '500' }}>
                      {project.status || 'active'}
                    </span>
                    <span>•</span>
                    <span>{project.date || 'Today'}</span>
                    <span>•</span>
                    <span>{project.assets?.length || 0} assets</span>
                  </div>
                </div>
                
                <ChevronRight size={20} className="project-list-arrow" />
              </div>
            );
          })}
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowTemplateModal(false)}>
          <div 
            className="modal-content animate-slideUp" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '20px 24px' }}>
              <h2>Create New Project</h2>
              <button className="modal-close" onClick={() => setShowTemplateModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {!selectedTemplate ? (
                <>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Choose a template to get started with pre-configured agents and milestones.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {PROJECT_TEMPLATES.map(template => {
                      const Icon = template.icon === 'Disc' ? Disc :
                                   template.icon === 'Music' ? Music :
                                   template.icon === 'Share2' ? Share2 :
                                   template.icon === 'Video' ? Video :
                                   template.icon === 'Palette' ? Palette :
                                   template.icon === 'Film' ? Film :
                                   Sparkles;
                      return (
                        <div
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className="touch-feedback"
                          style={{
                            padding: '20px',
                            background: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: `${template.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '12px'
                          }}>
                            <Icon size={24} style={{ color: template.color }} />
                          </div>
                          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>
                            {template.name}
                          </h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            {template.description}
                          </p>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              background: 'rgba(255,255,255,0.1)', 
                              borderRadius: '10px' 
                            }}>
                              {template.estimatedTime}
                            </span>
                            <span style={{ 
                              padding: '2px 8px', 
                              background: 'rgba(255,255,255,0.1)', 
                              borderRadius: '10px' 
                            }}>
                              {template.difficulty}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Template Selected - Configure */
                <div>
                  <button 
                    onClick={() => setSelectedTemplate(null)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--text-secondary)', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '20px'
                    }}
                  >
                    ← Back to templates
                  </button>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Enter project name..."
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem'
                      }}
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Language</label>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      >
                        {['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Portuguese', 'Italian', 'Chinese'].map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Style / Genre</label>
                      <select 
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      >
                        {['Modern Hip-Hop', '90s Boom Bap', 'Trap', 'R&B / Soul', 'Pop', 'Rock', 'Electronic', 'Cinematic', 'Jazz', 'Lo-Fi'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Model</label>
                      <select 
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      >
                        {['Gemini 2.0 Flash', 'Gemini 2.0 Pro (Exp)', 'Gemini 1.5 Flash', 'Gemini 1.5 Pro'].map(m => (
                          <option key={m} value={m} style={{ background: '#1a1a1a' }}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ 
                    padding: '20px', 
                    background: 'rgba(139, 92, 246, 0.1)', 
                    borderRadius: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    marginBottom: '24px'
                  }}>
                    <h4 style={{ marginBottom: '12px' }}>Template: {selectedTemplate.name}</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      {selectedTemplate.description}
                    </p>
                    
                    {selectedTemplate.milestones.length > 0 && (
                      <div>
                        <h5 style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          Milestones ({selectedTemplate.milestones.length})
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {selectedTemplate.milestones.map((m, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                              <Circle size={14} style={{ color: 'var(--text-secondary)' }} />
                              {m.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="cta-button-premium"
                    onClick={handleCreateFromTemplate}
                    disabled={!newProjectName.trim()}
                    style={{ width: '100%', justifyContent: 'center', opacity: newProjectName.trim() ? 1 : 0.5 }}
                  >
                    <Sparkles size={18} />
                    Create Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Preview Side Panel */}
      {previewProject && (
        <div 
          className="animate-fadeIn"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '480px',
            background: 'var(--color-bg-primary)',
            borderLeft: '1px solid var(--border-color)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.4)'
          }}
        >
          {/* Panel Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--card-bg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setPreviewProject(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{previewProject.name}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Quick Preview • {previewProject.assets?.length || 0} assets
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { onSelectProject?.(previewProject); setPreviewProject(null); }}
                className="cta-button-premium"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <Zap size={16} /> Open
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Description */}
            {previewProject.description && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {previewProject.description}
                </p>
              </div>
            )}

            {/* Project Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ 
                padding: '16px', 
                background: 'var(--card-bg)', 
                borderRadius: '12px', 
                textAlign: 'center',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-purple)' }}>
                  {previewProject.assets?.length || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assets</div>
              </div>
              <div style={{ 
                padding: '16px', 
                background: 'var(--card-bg)', 
                borderRadius: '12px', 
                textAlign: 'center',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-cyan)' }}>
                  {previewProject.assets?.filter(a => a.audioUrl).length || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Audio</div>
              </div>
              <div style={{ 
                padding: '16px', 
                background: 'var(--card-bg)', 
                borderRadius: '12px', 
                textAlign: 'center',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-pink)' }}>
                  {previewProject.assets?.filter(a => a.imageUrl).length || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Images</div>
              </div>
            </div>

            {/* Assets Grid */}
            <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', fontWeight: '600' }}>Project Assets</h4>
            {previewProject.assets && previewProject.assets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {previewProject.assets.map((asset, idx) => (
                  <div
                    key={asset.id || idx}
                    onClick={() => setPreviewAsset({ ...asset, projectName: previewProject.name })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--card-bg)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    className="touch-feedback"
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '10px',
                      background: asset.imageUrl 
                        ? `url(${asset.imageUrl}) center/cover`
                        : asset.audioUrl 
                          ? 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-cyan) 100%)'
                          : asset.videoUrl
                            ? 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-emerald) 100%)'
                            : 'linear-gradient(135deg, var(--color-orange) 0%, var(--color-pink) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {!asset.imageUrl && (
                        asset.audioUrl ? <Music size={24} style={{ color: 'white' }} /> :
                        asset.videoUrl ? <Video size={24} style={{ color: 'white' }} /> :
                        <FileText size={24} style={{ color: 'white' }} />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {asset.title || 'Untitled'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {asset.type || (asset.audioUrl ? 'Audio' : asset.videoUrl ? 'Video' : asset.imageUrl ? 'Image' : 'Text')}
                        {asset.agent && ` • ${asset.agent}`}
                      </div>
                    </div>

                    {/* Quick Play for Audio */}
                    {asset.audioUrl && (
                      <button
                        onClick={(e) => toggleAudio(asset.audioUrl, e)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: currentAudioUrl === asset.audioUrl && isPlaying 
                            ? 'var(--color-purple)' 
                            : 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {currentAudioUrl === asset.audioUrl && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                    )}

                    <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                background: 'var(--card-bg)',
                borderRadius: '12px'
              }}>
                <Folder size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No assets yet</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.7 }}>Open the project to start creating</p>
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '12px',
            background: 'var(--card-bg)'
          }}>
            <button
              onClick={() => startEdit(previewProject)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '500'
              }}
            >
              <Edit3 size={16} /> Edit
            </button>
            <button
              onClick={(e) => handleShareToTwitter(previewProject, e)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '500'
              }}
            >
              <Share2 size={16} /> Share
            </button>
            <button
              onClick={(e) => { handleDeleteProject(previewProject.id, e); setPreviewProject(null); }}
              style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                borderRadius: '10px',
                color: 'var(--color-red)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for preview panel */}
      {previewProject && (
        <div 
          className="animate-fadeIn"
          onClick={() => setPreviewProject(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
        />
      )}

      {/* Full Asset Preview Modal */}
      {previewAsset && (
        <div 
          className="modal-overlay animate-fadeIn"
          onClick={() => setPreviewAsset(null)}
          style={{ zIndex: 2000 }}
        >
          <div 
            className="modal-content animate-slideUp"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '800px', 
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 style={{ margin: 0 }}>{previewAsset.title || 'Asset Preview'}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  From: {previewAsset.projectName}
                </p>
              </div>
              <button className="modal-close" onClick={() => setPreviewAsset(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
              {/* Image Preview */}
              {previewAsset.imageUrl && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <img 
                    src={previewAsset.imageUrl}
                    alt={previewAsset.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      borderRadius: '12px',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              )}

              {/* Video Preview */}
              {previewAsset.videoUrl && (
                <div style={{ marginBottom: '20px' }}>
                  <video 
                    src={previewAsset.videoUrl}
                    controls
                    autoPlay
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      borderRadius: '12px',
                      background: 'black'
                    }}
                  />
                </div>
              )}

              {/* Audio Preview */}
              {previewAsset.audioUrl && (
                <div style={{ 
                  padding: '32px', 
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.1))',
                  borderRadius: '16px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 8px 32px rgba(139,92,246,0.3)'
                  }}>
                    <Music size={48} style={{ color: 'white' }} />
                  </div>
                  <audio 
                    src={previewAsset.audioUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', maxWidth: '500px' }}
                  />
                </div>
              )}

              {/* Text Content */}
              {previewAsset.content || previewAsset.snippet || previewAsset.output ? (
                <div style={{
                  padding: '20px',
                  background: 'var(--card-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  <pre style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.95rem',
                    lineHeight: 1.7,
                    fontFamily: 'inherit'
                  }}>
                    {previewAsset.content || previewAsset.snippet || previewAsset.output}
                  </pre>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              {(previewAsset.audioUrl || previewAsset.imageUrl || previewAsset.videoUrl) && (
                <button
                  onClick={() => {
                    const url = previewAsset.audioUrl || previewAsset.imageUrl || previewAsset.videoUrl;
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = previewAsset.title || 'download';
                    link.click();
                    toast.success('Download started');
                  }}
                  className="cta-button-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} /> Download
                </button>
              )}
              <button
                onClick={() => setPreviewAsset(null)}
                className="cta-button-premium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element for Quick Play */}
      <audio 
        ref={audioRef} 
        onEnded={() => { setIsPlaying(false); setCurrentAudioUrl(null); }}
        onPause={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />

      <style>{`
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          background: none;
          border: none;
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.15s ease;
          text-align: left;
        }
        .dropdown-item:hover {
          background: rgba(255,255,255,0.05);
        }
        .asset-thumb-hover:hover {
          border-color: var(--color-purple) !important;
          transform: scale(1.05);
        }
        .project-card-action-btn.primary {
          background: var(--color-purple) !important;
          color: white !important;
        }
        .project-card-action-btn.primary:hover {
          background: var(--color-purple-light) !important;
        }
      `}</style>
    </div>
  );
}

export default ProjectHub;
