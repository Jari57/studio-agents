import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, LayoutGrid, List, MoreVertical,
  Eye, Share2, Trash2, Edit3, Copy, Twitter, Instagram,
  Clock, CheckCircle, Circle, Archive, Sparkles, Folder,
  Music, Video, Image, Disc, Film, Palette, X, ChevronRight
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
  // const [editingProject, setEditingProject] = useState(null); - reserved for future edit feature

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      
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
  }, [projects, statusFilter, searchQuery]);

  // Count projects by status
  const statusCounts = useMemo(() => {
    return {
      all: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      paused: projects.filter(p => p.status === 'paused').length,
      archived: projects.filter(p => p.status === 'archived').length,
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
    // Use the callback from StudioView which handles both local state and cloud deletion
    if (onDeleteProject) {
      onDeleteProject(projectId, e);
    } else {
      // Fallback: local-only delete if no callback provided
      if (window.confirm('Delete this project? This cannot be undone.')) {
        setProjects?.(prev => prev.filter(p => p.id !== projectId));
        toast.success('Project deleted');
      }
    }
    setShowProjectMenu(null);
  };

  const handleDuplicateProject = (project, e) => {
    e?.stopPropagation();
    const duplicate = {
      ...project,
      id: Date.now(),
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects?.(prev => [duplicate, ...prev]);
    toast.success('Project duplicated');
    setShowProjectMenu(null);
  };

  const handleArchiveProject = (project, e) => {
    e?.stopPropagation();
    const updated = { ...project, status: project.status === 'archived' ? 'active' : 'archived' };
    setProjects?.(prev => prev.map(p => p.id === project.id ? updated : p));
    toast.success(updated.status === 'archived' ? 'Project archived' : 'Project restored');
    setShowProjectMenu(null);
  };

  const handleStatusChange = (project, newStatus, e) => {
    e?.stopPropagation();
    const updated = { ...project, status: newStatus, updatedAt: new Date().toISOString() };
    setProjects?.(prev => prev.map(p => p.id === project.id ? updated : p));
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
          <div className="filter-chips" style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
              { id: 'archived', label: 'Archived' },
            ].map(filter => (
              <button
                key={filter.id}
                className={`filter-chip ${statusFilter === filter.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(filter.id)}
              >
                {filter.label}
                <span style={{ 
                  marginLeft: '6px', 
                  fontSize: '0.75rem', 
                  opacity: 0.7,
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}>
                  {statusCounts[filter.id]}
                </span>
              </button>
            ))}
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
                onClick={() => onSelectProject?.(project)}
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
                      <button onClick={() => console.log('Edit project:', project.id)} className="dropdown-item">
                        <Edit3 size={16} /> Edit Details
                      </button>
                      <button onClick={(e) => handleDuplicateProject(project, e)} className="dropdown-item">
                        <Copy size={16} /> Duplicate
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

                {/* Card Body */}
                <div className="project-card-body">
                  <h3 style={{ 
                    fontSize: '1.05rem', 
                    fontWeight: '600', 
                    marginBottom: '6px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {project.name}
                  </h3>
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
                </div>

                {/* Card Actions */}
                <div className="project-card-actions">
                  <button 
                    className="project-card-action-btn"
                    onClick={(e) => { e.stopPropagation(); onSelectProject?.(project); }}
                  >
                    <Eye size={16} /> View
                  </button>
                  <button 
                    className="project-card-action-btn"
                    onClick={(e) => { e.stopPropagation(); handleShareToTwitter(project, e); }}
                  >
                    <Share2 size={16} /> Share
                  </button>
                  <button 
                    className="project-card-action-btn danger"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                  >
                    <Trash2 size={16} />
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
                onClick={() => onSelectProject?.(project)}
                style={{ borderBottom: idx < filteredProjects.length - 1 ? '1px solid var(--border-color)' : 'none' }}
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
      `}</style>
    </div>
  );
}

export default ProjectHub;
