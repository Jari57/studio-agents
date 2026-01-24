import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Plus, LayoutGrid, List, MoreHorizontal,
  Play, Trash2, Edit3, Copy, Heart, Clock, Folder,
  Music, Video, Image, Mic, FileText, X, Sparkles,
  ChevronRight, Download, Share2, CheckCircle, Archive
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PROJECT_TEMPLATES, createProjectFromTemplate } from '../data/projectTemplates';

/**
 * ProjectHubV3 - CapCut/Captions-inspired modern project management
 * Clean, minimal design with large thumbnails and hover actions
 */
function ProjectHubV3({ 
  projects = [], 
  setProjects,
  onSelectProject,
  onDeleteProject,
  onSaveProject,
  setActiveTab
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [hoveredProject, setHoveredProject] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showContextMenu, setShowContextMenu] = useState(null);
  const audioRef = useRef(null);
  const [playingAudio, setPlayingAudio] = useState(null);

  // Favorites from localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studio_favorite_projects') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('studio_favorite_projects', JSON.stringify(favorites));
  }, [favorites]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    return projects.filter(p => {
      if (!p) return false;
      if (filter === 'favorites' && !favorites.includes(p.id)) return false;
      if (filter === 'completed' && p.status !== 'completed') return false;
      if (filter === 'archived' && p.status !== 'archived') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [projects, filter, searchQuery, favorites]);

  // Get project thumbnail
  const getProjectThumbnail = (project) => {
    if (!project.assets?.length) return null;
    const imageAsset = project.assets.find(a => a.imageUrl);
    if (imageAsset) return imageAsset.imageUrl;
    const videoAsset = project.assets.find(a => a.videoUrl);
    if (videoAsset) return videoAsset.thumbnailUrl || null;
    return null;
  };

  // Get asset type icons
  const getAssetIcons = (project) => {
    if (!project.assets?.length) return [];
    const types = new Set();
    project.assets.forEach(a => {
      if (a.imageUrl) types.add('image');
      if (a.audioUrl) types.add('audio');
      if (a.videoUrl) types.add('video');
      if (a.content || a.lyrics) types.add('text');
    });
    return Array.from(types);
  };

  // Format relative time
  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Toggle favorite
  const toggleFavorite = (id, e) => {
    e?.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Handle delete
  const handleDelete = (id, e) => {
    e?.stopPropagation();
    setShowContextMenu(null);
    if (onDeleteProject) {
      onDeleteProject(id, e);
    }
  };

  // Handle duplicate
  const handleDuplicate = (project, e) => {
    e?.stopPropagation();
    const dup = {
      ...project,
      id: String(Date.now()),
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProjects?.(prev => [dup, ...prev]);
    toast.success('Project duplicated');
    setShowContextMenu(null);
  };

  // Handle rename
  const startRename = (project, e) => {
    e?.stopPropagation();
    setEditingId(project.id);
    setEditName(project.name);
    setShowContextMenu(null);
  };

  const saveRename = (project) => {
    if (!editName.trim()) return;
    const updated = { ...project, name: editName.trim(), updatedAt: new Date().toISOString() };
    setProjects?.(prev => prev.map(p => p.id === project.id ? updated : p));
    onSaveProject?.(updated);
    setEditingId(null);
    toast.success('Renamed');
  };

  // Create from template
  const handleCreate = () => {
    if (!newProjectName.trim()) {
      toast.error('Enter a project name');
      return;
    }
    const template = selectedTemplate || PROJECT_TEMPLATES[0];
    const newProject = createProjectFromTemplate(template, newProjectName.trim());
    setProjects?.(prev => [newProject, ...prev]);
    onSaveProject?.(newProject);
    setShowNewProjectModal(false);
    setNewProjectName('');
    setSelectedTemplate(null);
    toast.success('Project created!');
    onSelectProject?.(newProject);
  };

  // Play audio preview
  const playAudio = (url, e) => {
    e?.stopPropagation();
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingAudio(url);
      }
    }
  };

  // Get first audio asset
  const getAudioUrl = (project) => project.assets?.find(a => a.audioUrl)?.audioUrl;

  return (
    <div className="project-hub-v3">
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
      
      {/* Header */}
      <header className="hub-header-v3">
        <div className="hub-title-row">
          <div>
            <h1>Your Projects</h1>
            <p className="hub-subtitle">{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn-create-new" onClick={() => setShowNewProjectModal(true)}>
            <Plus size={20} />
            <span>New Project</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="hub-controls">
          <div className="hub-search">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="clear-search">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="hub-filters">
            {['all', 'favorites', 'completed', 'archived'].map(f => (
              <button 
                key={f} 
                className={`filter-pill ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'favorites' && <Heart size={14} />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="view-switch">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
              <LayoutGrid size={18} />
            </button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
              <List size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="empty-state-v3">
          <div className="empty-icon"><Folder size={48} /></div>
          <h3>{searchQuery ? 'No matches found' : 'No projects yet'}</h3>
          <p>{searchQuery ? `Nothing matches "${searchQuery}"` : 'Start creating your first project'}</p>
          {!searchQuery && (
            <button className="btn-create-new" onClick={() => setShowNewProjectModal(true)}>
              <Plus size={18} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className={`projects-grid ${viewMode}`}>
          {/* New Project Card (first item) */}
          <div 
            className="project-card new-project-card"
            onClick={() => setShowNewProjectModal(true)}
          >
            <div className="new-project-inner">
              <div className="plus-circle">
                <Plus size={32} />
              </div>
              <span>Create New Project</span>
            </div>
          </div>

          {/* Project Cards */}
          {filteredProjects.map(project => {
            const thumbnail = getProjectThumbnail(project);
            const assetIcons = getAssetIcons(project);
            const audioUrl = getAudioUrl(project);
            const isHovered = hoveredProject === project.id;
            const isEditing = editingId === project.id;

            return (
              <div
                key={project.id}
                className={`project-card ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                onClick={() => !isEditing && onSelectProject?.(project)}
              >
                {/* Thumbnail */}
                <div 
                  className="card-thumbnail"
                  style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : {}}
                >
                  {!thumbnail && (
                    <div className="placeholder-thumb">
                      <Sparkles size={32} />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className={`card-overlay ${isHovered ? 'visible' : ''}`}>
                    <div className="overlay-actions">
                      {audioUrl && (
                        <button 
                          className="action-btn play-btn"
                          onClick={e => playAudio(audioUrl, e)}
                        >
                          <Play size={20} fill={playingAudio === audioUrl ? '#fff' : 'none'} />
                        </button>
                      )}
                      <button 
                        className="action-btn"
                        onClick={e => { e.stopPropagation(); onSelectProject?.(project); }}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Favorite Badge */}
                  <button 
                    className={`fav-btn ${favorites.includes(project.id) ? 'active' : ''}`}
                    onClick={e => toggleFavorite(project.id, e)}
                  >
                    <Heart size={16} fill={favorites.includes(project.id) ? 'currentColor' : 'none'} />
                  </button>

                  {/* Asset Type Badges */}
                  {assetIcons.length > 0 && (
                    <div className="asset-badges">
                      {assetIcons.includes('audio') && <span className="badge audio"><Music size={12} /></span>}
                      {assetIcons.includes('image') && <span className="badge image"><Image size={12} /></span>}
                      {assetIcons.includes('video') && <span className="badge video"><Video size={12} /></span>}
                      {assetIcons.includes('text') && <span className="badge text"><FileText size={12} /></span>}
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="card-info">
                  {isEditing ? (
                    <div className="edit-name-row" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveRename(project);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                      />
                      <button onClick={() => saveRename(project)}>
                        <CheckCircle size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="card-title">{project.name}</h3>
                      <div className="card-meta">
                        <span className="meta-time">
                          <Clock size={12} />
                          {formatRelativeTime(project.updatedAt || project.createdAt)}
                        </span>
                        <span className="meta-count">
                          {project.assets?.length || 0} asset{(project.assets?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Context Menu Button */}
                  <button 
                    className="context-btn"
                    onClick={e => {
                      e.stopPropagation();
                      setShowContextMenu(showContextMenu === project.id ? null : project.id);
                    }}
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {/* Context Menu */}
                  {showContextMenu === project.id && (
                    <div className="context-menu" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { onSelectProject?.(project); setShowContextMenu(null); }}>
                        <ChevronRight size={16} /> Open
                      </button>
                      <button onClick={e => startRename(project, e)}>
                        <Edit3 size={16} /> Rename
                      </button>
                      <button onClick={e => handleDuplicate(project, e)}>
                        <Copy size={16} /> Duplicate
                      </button>
                      <button onClick={e => toggleFavorite(project.id, e)}>
                        <Heart size={16} /> {favorites.includes(project.id) ? 'Unfavorite' : 'Favorite'}
                      </button>
                      <div className="menu-divider" />
                      <button className="delete" onClick={e => handleDelete(project.id, e)}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="modal-overlay" onClick={() => setShowNewProjectModal(false)}>
          <div className="modal-v3" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowNewProjectModal(false)}>
              <X size={24} />
            </button>
            
            <h2>Create New Project</h2>
            <p className="modal-subtitle">Start with a template or create from scratch</p>

            <div className="modal-form">
              <input
                type="text"
                placeholder="Project name..."
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />

              <div className="template-grid">
                {PROJECT_TEMPLATES.slice(0, 6).map(t => (
                  <div 
                    key={t.id}
                    className={`template-card ${selectedTemplate?.id === t.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(t)}
                  >
                    <Sparkles size={24} />
                    <span>{t.name}</span>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowNewProjectModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleCreate}>
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .project-hub-v3 {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .hub-header-v3 {
          margin-bottom: 32px;
        }

        .hub-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .hub-title-row h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
        }

        .hub-subtitle {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin: 4px 0 0;
        }

        .btn-create-new {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--color-purple) 0%, var(--color-pink) 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-create-new:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
        }

        .hub-controls {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }

        .hub-search {
          flex: 1;
          min-width: 240px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          transition: border-color 0.2s;
        }

        .hub-search:focus-within {
          border-color: var(--color-purple);
        }

        .hub-search input {
          flex: 1;
          background: none;
          border: none;
          color: white;
          font-size: 0.95rem;
          outline: none;
        }

        .hub-search input::placeholder {
          color: var(--text-secondary);
        }

        .clear-search {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
        }

        .hub-filters {
          display: flex;
          gap: 8px;
        }

        .filter-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-pill:hover {
          border-color: var(--color-purple);
          color: white;
        }

        .filter-pill.active {
          background: var(--color-purple);
          border-color: var(--color-purple);
          color: white;
        }

        .view-switch {
          display: flex;
          background: var(--bg-secondary);
          border-radius: 10px;
          padding: 4px;
          border: 1px solid var(--border-color);
        }

        .view-switch button {
          padding: 8px 12px;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .view-switch button.active {
          background: var(--color-purple);
          color: white;
        }

        /* Projects Grid */
        .projects-grid {
          display: grid;
          gap: 20px;
        }

        .projects-grid.grid {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        .projects-grid.list {
          grid-template-columns: 1fr;
        }

        .projects-grid.list .project-card {
          flex-direction: row;
          height: 100px;
        }

        .projects-grid.list .card-thumbnail {
          width: 160px;
          height: 100%;
          flex-shrink: 0;
        }

        .projects-grid.list .card-info {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Project Card */
        .project-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          border-color: var(--color-purple);
        }

        .project-card.new-project-card {
          border: 2px dashed var(--border-color);
          background: transparent;
          min-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .project-card.new-project-card:hover {
          border-color: var(--color-purple);
          background: rgba(139, 92, 246, 0.05);
        }

        .new-project-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: var(--text-secondary);
        }

        .plus-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-purple) 0%, var(--color-pink) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: transform 0.3s;
        }

        .project-card.new-project-card:hover .plus-circle {
          transform: scale(1.1);
        }

        .card-thumbnail {
          height: 180px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }

        .placeholder-thumb {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          opacity: 0.5;
        }

        .card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .card-overlay.visible {
          opacity: 1;
        }

        .overlay-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: var(--color-purple);
          transform: scale(1.1);
        }

        .action-btn.play-btn {
          width: 56px;
          height: 56px;
          background: var(--color-purple);
        }

        .fav-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 5;
        }

        .fav-btn:hover, .fav-btn.active {
          color: var(--color-pink);
        }

        .asset-badges {
          position: absolute;
          bottom: 12px;
          left: 12px;
          display: flex;
          gap: 6px;
        }

        .badge {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
        }

        .badge.audio { background: rgba(139, 92, 246, 0.8); }
        .badge.image { background: rgba(236, 72, 153, 0.8); }
        .badge.video { background: rgba(6, 182, 212, 0.8); }
        .badge.text { background: rgba(16, 185, 129, 0.8); }

        .card-info {
          padding: 16px;
          position: relative;
        }

        .card-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-right: 32px;
        }

        .card-meta {
          display: flex;
          gap: 16px;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .meta-time {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .context-btn {
          position: absolute;
          top: 16px;
          right: 12px;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .context-btn:hover {
          background: var(--bg-tertiary);
          color: white;
        }

        .context-menu {
          position: absolute;
          top: 48px;
          right: 12px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 8px;
          min-width: 160px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          z-index: 100;
        }

        .context-menu button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: none;
          border: none;
          color: white;
          font-size: 0.9rem;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .context-menu button:hover {
          background: var(--bg-secondary);
        }

        .context-menu button.delete {
          color: var(--color-red);
        }

        .menu-divider {
          height: 1px;
          background: var(--border-color);
          margin: 8px 0;
        }

        .edit-name-row {
          display: flex;
          gap: 8px;
        }

        .edit-name-row input {
          flex: 1;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--color-purple);
          border-radius: 8px;
          color: white;
          font-size: 0.95rem;
        }

        .edit-name-row button {
          padding: 8px;
          background: var(--color-purple);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
        }

        /* Empty State */
        .empty-state-v3 {
          text-align: center;
          padding: 80px 24px;
        }

        .empty-icon {
          width: 100px;
          height: 100px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        .empty-state-v3 h3 {
          font-size: 1.5rem;
          margin: 0 0 8px;
        }

        .empty-state-v3 p {
          color: var(--text-secondary);
          margin: 0 0 24px;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
        }

        .modal-v3 {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 32px;
          max-width: 520px;
          width: 100%;
          position: relative;
          animation: modalSlide 0.3s ease;
        }

        @keyframes modalSlide {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--bg-secondary);
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: white;
        }

        .modal-v3 h2 {
          font-size: 1.5rem;
          margin: 0 0 8px;
        }

        .modal-subtitle {
          color: var(--text-secondary);
          margin: 0 0 24px;
        }

        .modal-form input {
          width: 100%;
          padding: 14px 18px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          margin-bottom: 20px;
        }

        .modal-form input:focus {
          outline: none;
          border-color: var(--color-purple);
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .template-card {
          padding: 20px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-card:hover {
          border-color: var(--color-purple);
        }

        .template-card.selected {
          background: rgba(139, 92, 246, 0.2);
          border-color: var(--color-purple);
        }

        .template-card span {
          display: block;
          margin-top: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .template-card.selected span {
          color: white;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-secondary {
          padding: 12px 24px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: white;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-primary {
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--color-purple) 0%, var(--color-pink) 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-primary:hover {
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
        }

        /* Mobile */
        @media (max-width: 768px) {
          .project-hub-v3 {
            padding: 16px;
          }

          .hub-title-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .btn-create-new {
            width: 100%;
            justify-content: center;
          }

          .hub-controls {
            flex-direction: column;
          }

          .hub-search {
            width: 100%;
          }

          .hub-filters {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 8px;
          }

          .projects-grid.grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          }

          .card-thumbnail {
            height: 140px;
          }

          .template-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default ProjectHubV3;
