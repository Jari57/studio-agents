import React, { useState, useMemo, useRef, useEffect, useCallback as _useCallback } from 'react';
import { 
  Search, Plus, LayoutGrid, List as ListIcon, MoreHorizontal,
  Play, Trash2, Edit3, Copy, Heart, Clock, Folder,
  Music, Video as VideoIcon, Image as ImageIcon, Mic, FileText, X, Sparkles,
  ChevronRight, Download, Share2, CheckCircle, Archive,
  Pause, Upload, Wand2, Zap, TrendingUp, Star, Eye,
  Globe as GlobeIcon, Lock as LockIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PROJECT_TEMPLATES, createProjectFromTemplate } from '../data/projectTemplates';
import { formatImageSrc, formatAudioSrc, formatVideoSrc } from '../utils/mediaUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// WAVEFORM COMPONENT (Decorative)
// ═══════════════════════════════════════════════════════════════════════════════
function WaveformOverlay({ color = 'var(--color-purple)' }) {
  // Use useMemo to generate random heights once per mount to avoid "impure function" warnings
  const heights = useMemo(() => {
    return [...Array(20)].map(() => 20 + Math.random() * 80);
  }, []);

  return (
    <div className="waveform-container">
      {heights.map((height, i) => (
        <div 
          key={i} 
          className="waveform-bar" 
          style={{ 
            height: `${height}%`,
            background: color,
            animationDelay: `${i * 0.05}s`
          }} 
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISCOVER FEED COMPONENT (BandLab style)
// ═══════════════════════════════════════════════════════════════════════════════
function DiscoverFeed({ onRemix, onPlay, playingAudio }) {
  const trendingCreators = [
    { id: 1, name: 'NeonVibe', avatar: 'https://i.pravatar.cc/150?u=1', followers: '12k' },
    { id: 2, name: 'HyperPop_AI', avatar: 'https://i.pravatar.cc/150?u=2', followers: '8.4k' },
    { id: 3, name: 'Metro_Boomin_Bot', avatar: 'https://i.pravatar.cc/150?u=3', followers: '45k' },
    { id: 4, name: 'LoFi_Girl_X', avatar: 'https://i.pravatar.cc/150?u=4', followers: '1.2M' },
    { id: 5, name: 'DrillMaster', avatar: 'https://i.pravatar.cc/150?u=5', followers: '3k' },
  ];

  const discoveryTracks = [
    { 
      id: 'd1', 
      name: 'Cybernetic Dreams', 
      creator: 'NeonVibe', 
      likes: 1240, 
      remixes: 45, 
      tags: ['Cyberpunk', 'Synthwave'],
      source: 'Mureaka',
      audioUrl: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a165b4.mp3',
      thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300'
    },
    { 
      id: 'd2', 
      name: 'Midnight In Tokyo', 
      creator: 'HyperPop_AI', 
      likes: 890, 
      remixes: 12, 
      tags: ['Lo-Fi', 'Study'],
      source: 'BandLab',
      audioUrl: 'https://cdn.pixabay.com/audio/2022/01/21/audio_168f86067b.mp3',
      thumbnail: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&q=80&w=300'
    },
    { 
      id: 'd3', 
      name: 'Trap Soul Sessions', 
      creator: 'DrillMaster', 
      likes: 3400, 
      remixes: 156, 
      tags: ['Trap', 'Dark'],
      source: 'Beat Lab',
      audioUrl: 'https://cdn.pixabay.com/audio/2021/11/23/audio_0ed20b0c20.mp3',
      thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=300'
    },
    { 
      id: 'd4', 
      name: 'Ethereal Vocals', 
      creator: 'LoFi_Girl_X', 
      likes: 15400, 
      remixes: 890, 
      tags: ['Ambient', 'Vocal'],
      source: 'Mureaka',
      audioUrl: 'https://cdn.pixabay.com/audio/2022/10/21/audio_a16f217730.mp3',
      thumbnail: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=300'
    }
  ];

  return (
    <div className="discover-feed-container animate-fadeIn">
      {/* Featured Banner (Social Style) */}
      <div className="discovery-hero-banner" style={{
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.4), rgba(147, 51, 234, 0.4))',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '32px',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ 
            background: '#ef4444', 
            color: 'white', 
            padding: '4px 10px', 
            borderRadius: '6px', 
            fontSize: '0.7rem', 
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>Community</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '10px' }}>Studio Agents Collaboration</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '500px' }}>
            Fork projects shared by other Studio Agent users to collaborate, remix ideas, and learn from fellow creators.
          </p>
          <button 
            className="btn-create-new" 
            style={{ width: 'fit-content', marginTop: '10px' }}
            onClick={() => onRemix(discoveryTracks[0])}
          >
            <Copy size={18} /> Fork Project
          </button>
        </div>
        <div style={{
          position: 'absolute',
          right: '-50px',
          top: '-20px',
          opacity: 0.2,
          transform: 'rotate(15deg)'
        }}>
          <Music size={240} />
        </div>
      </div>

      {/* Trending Creators Bar */}
      <section className="trending-creators">
        <div className="section-header">
          <h3>@Studio Agents</h3>
          <button className="btn-text">View All <ChevronRight size={14} /></button>
        </div>
        <div className="creator-scroll">
          {trendingCreators.map(creator => (
            <div key={creator.id} className="creator-card">
              <div className="avatar-wrapper">
                <img src={creator.avatar} alt={creator.name} />
                <div className="online-indicator" />
              </div>
              <span className="creator-name">{creator.name}</span>
              <span className="creator-stat">Studio User</span>
              <button className="btn-follow">View Workspace</button>
            </div>
          ))}
        </div>
      </section>

      {/* Discovery Feed Grid */}
      <section className="feed-tracks">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={20} color="var(--color-purple)" />
            <h3>Shared Studio Projects</h3>
          </div>
          <div className="feed-filters">
            <button className="active">Trending</button>
            <button>Top Remixes</button>
            <button>Most Forked</button>
            <button>All Shared</button>
          </div>
        </div>
        <div className="feed-grid">
          {discoveryTracks.map(track => (
            <div key={track.id} className="feed-item-card">
              <div 
                className="track-thumb"
                style={{ backgroundImage: `url(${track.thumbnail})` }}
              >
                <div className="track-overlay">
                  <button 
                    className={`play-circle ${playingAudio === track.audioUrl ? 'playing' : ''}`}
                    onClick={(e) => onPlay(track.audioUrl, e)}
                  >
                    {playingAudio === track.audioUrl ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                </div>
                <div className="remix-badge">
                   <Copy size={10} /> Fork
                </div>
                {track.source && (
                  <div className="source-badge">
                    {track.source}
                  </div>
                )}
              </div>
              <div className="track-info">
                <div className="track-primary" style={{ width: '100%', overflow: 'hidden' }}>
                  <h4 className="track-name" style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    margin: 0
                  }}>{track.name}</h4>
                  <p className="track-creator" style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    margin: '4px 0 0 0',
                    opacity: 0.7,
                    fontSize: '0.85rem'
                  }}>@ {track.creator.toLowerCase().replace(/_|\s/g, '')}</p>
                </div>
                <div className="track-tags">
                  {track.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
                </div>
                <div className="track-actions">
                  <div className="stats" style={{ display: 'flex', gap: '12px' }}>
                    <span title="Likes" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={14} /> {track.likes}</span>
                    <span title="Forks" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Copy size={13} /> {track.remixes}</span>
                  </div>
                  <button 
                    className="btn-remix-action"
                    onClick={() => onRemix(track)}
                    style={{ gap: '6px', padding: '8px 12px' }}
                  >
                    <Plus size={14} /> FORK & EDIT
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * ProjectHubV3 - CapCut/Captions-inspired modern project management
 * Ultra-fluid UX with smooth animations, drag-drop, and micro-interactions
 */
function ProjectHubV3({ 
  projects = [], 
  setProjects,
  onSelectProject,
  onDeleteProject,
  onSaveProject,
  setActiveTab: _setActiveTab,
  setPreviewItem,
  setPlayingItem
}) {
  const [activeHubTab, setActiveHubTab] = useState('my-projects'); // 'my-projects' or 'discover'
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
  const [isLoading, setIsLoading] = useState(true);
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverProject, setDragOverProject] = useState(null);
  const audioRef = useRef(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const searchInputRef = useRef(null);
  const containerRef = useRef(null);

  // Simulate loading for skeleton effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K = Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Cmd/Ctrl + N = New project
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        setShowNewProjectModal(true);
      }
      // Escape = Close modals
      if (e.key === 'Escape') {
        setShowNewProjectModal(false);
        setShowContextMenu(null);
        setEditingId(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setShowContextMenu(null);
    if (showContextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);

  // Favorites from localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studio_favorite_projects') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('studio_favorite_projects', JSON.stringify(favorites));
  }, [favorites]);

  // Filter and Sort projects
  const filteredProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    
    // 1. Filter
    let result = projects.filter(p => {
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

    // 2. Sort by creation date (newest first)
    return result.sort((a, b) => {
      // Helper to get time value
      const getTime = (p) => {
        if (!p) return 0;
        if (p.createdAt) return new Date(p.createdAt).getTime();
        if (p.date) return new Date(p.date).getTime();
        if (typeof p.id === 'string' && p.id.startsWith('proj-')) {
          const ts = parseInt(p.id.split('-')[1]);
          if (!isNaN(ts)) return ts;
        }
        return 0;
      };
      
      return getTime(b) - getTime(a);
    });
  }, [projects, filter, searchQuery, favorites]);

  // Bulk delete empty projects
  const handlePurgeEmptyProjects = _useCallback(() => {
    const emptyProjects = projects.filter(p => !p.assets || p.assets.length === 0);
    if (emptyProjects.length === 0) {
      toast.success("No empty projects found.");
      return;
    }
    
    const count = emptyProjects.length;
    if (confirm(`Destroy ${count} project(s) with zero assets? This cannot be undone.`)) {
      emptyProjects.forEach(p => onDeleteProject?.(p.id, true));
      toast.success(`Atmospheric Cleanup: ${count} dead projects purged!`, {
        icon: '🔥',
        style: { background: '#ef4444', color: 'white' }
      });
    }
  }, [projects, onDeleteProject]);

  // Get project thumbnail
  const getProjectThumbnail = (project) => {
    if (!project.assets?.length) return null;
    const imageAsset = project.assets.find(a => a.imageUrl);
    if (imageAsset) return formatImageSrc(imageAsset.imageUrl);
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
    
    // Handle Firebase Timestamps
    let date;
    if (typeof dateStr === 'object' && dateStr.seconds) {
      date = new Date(dateStr.seconds * 1000);
    } else if (typeof dateStr === 'object' && dateStr._seconds) {
      date = new Date(dateStr._seconds * 1000);
    } else {
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) return 'Recently';
    
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

  // Drag and drop reordering
  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', project.id);
    // Add dragging class after a frame
    requestAnimationFrame(() => {
      e.target.classList.add('dragging');
    });
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedProject(null);
    setDragOverProject(null);
  };

  const handleDragOver = (e, project) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (project.id !== draggedProject?.id) {
      setDragOverProject(project.id);
    }
  };

  const handleDragLeave = () => {
    setDragOverProject(null);
  };

  const handleDrop = (e, targetProject) => {
    e.preventDefault();
    if (!draggedProject || draggedProject.id === targetProject.id) return;
    
    setProjects?.(prev => {
      const newProjects = [...prev];
      const dragIndex = newProjects.findIndex(p => p.id === draggedProject.id);
      const dropIndex = newProjects.findIndex(p => p.id === targetProject.id);
      
      if (dragIndex === -1 || dropIndex === -1) return prev;
      
      // Remove dragged item and insert at new position
      const [removed] = newProjects.splice(dragIndex, 1);
      newProjects.splice(dropIndex, 0, removed);
      
      return newProjects;
    });
    
    setDraggedProject(null);
    setDragOverProject(null);
    toast.success('Projects reordered', { icon: '✨' });
  };

  // Quick actions
  const handleQuickOpen = (project, e) => {
    e?.stopPropagation();
    onSelectProject?.(project);
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

  // Quick Preview for the latest asset
  const handlePreviewLatest = (project, e) => {
    e?.stopPropagation();
    if (!project.assets || project.assets.length === 0) {
      toast.error("No assets in this project to preview");
      return;
    }
    
    // Find latest asset with media or content
    const assets = [...project.assets].filter(Boolean);
    if (assets.length === 0) return;
    
    const asset = assets[assets.length - 1];
    
    // Explicitly format sources to ensure playback compatibility
    const vUrl = asset.videoUrl ? formatVideoSrc(asset.videoUrl) : null;
    const aUrl = asset.audioUrl ? formatAudioSrc(asset.audioUrl) : null;
    const iUrl = asset.imageUrl ? formatImageSrc(asset.imageUrl) : null;
    const finalUrl = vUrl || aUrl || iUrl;

    if (setPlayingItem && finalUrl) {
      setPlayingItem?.({
        ...asset,
        url: finalUrl,
        videoUrl: vUrl,
        audioUrl: aUrl,
        imageUrl: iUrl,
        type: vUrl ? 'video' : aUrl ? 'audio' : 'image'
      });
    } else {
      setPreviewItem?.({
        ...asset,
        isExistingAsset: true
      });
    }
  };

  // Get first audio asset
  const getAudioUrl = (project) => {
    const asset = project.assets?.find(a => a.audioUrl);
    return asset ? formatAudioSrc(asset.audioUrl) : null;
  };

  const handlePreviewAssetType = (project, type, e) => {
    e?.stopPropagation();
    if (!project.assets) return;
    const asset = project.assets.find(a => {
      if (type === 'audio') return a.audioUrl;
      if (type === 'video') return a.videoUrl;
      if (type === 'image') return a.imageUrl;
      if (type === 'text') return a.content || a.lyrics;
      return false;
    });
    
    if (asset) {
      const vUrl = asset.videoUrl ? formatVideoSrc(asset.videoUrl) : null;
      const aUrl = asset.audioUrl ? formatAudioSrc(asset.audioUrl) : null;
      const iUrl = asset.imageUrl ? formatImageSrc(asset.imageUrl) : null;
      const finalUrl = vUrl || aUrl || iUrl;

      if (setPlayingItem && finalUrl) {
        setPlayingItem?.({
          ...asset,
          url: finalUrl,
          videoUrl: vUrl,
          audioUrl: aUrl,
          imageUrl: iUrl,
          type: vUrl ? 'video' : aUrl ? 'audio' : 'image'
        });
      } else {
        setPreviewItem?.({
          ...asset,
          isExistingAsset: true
        });
      }
    } else {
      toast.error(`No ${type} assets found in this project`);
    }
  };

  // Skeleton card for loading state
  const SkeletonCard = () => (
    <div className="project-card skeleton">
      <div className="card-thumbnail skeleton-pulse" />
      <div className="card-info">
        <div className="skeleton-text skeleton-pulse" style={{ width: '70%', height: '16px', marginBottom: '8px' }} />
        <div className="skeleton-text skeleton-pulse" style={{ width: '50%', height: '12px' }} />
      </div>
    </div>
  );

  // Get progress color
  const getProgressColor = (progress) => {
    if (progress >= 80) return 'var(--color-green)';
    if (progress >= 50) return 'var(--color-cyan)';
    if (progress >= 20) return 'var(--color-purple)';
    return 'var(--color-pink)';
  };

  return (
    <div className="project-hub-v3" ref={containerRef}>
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
      
      {/* Header */}
      <header className="hub-header-v3">
        <div className="hub-tabs-modern">
          <button 
            className={`hub-tab-item ${activeHubTab === 'my-projects' ? 'active' : ''}`}
            onClick={() => setActiveHubTab('my-projects')}
          >
            <Folder size={18} />
            <span>My Projects</span>
          </button>
          <button 
            className={`hub-tab-item ${activeHubTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveHubTab('discover')}
          >
            <TrendingUp size={18} />
            <span>Studio Community</span>
            <span className="live-dot" />
          </button>
        </div>

        <div className="hub-title-row">
          <div className="title-section">
            <h1>{activeHubTab === 'my-projects' ? 'Your Projects' : 'Shared Projects'}</h1>
            <p className="hub-subtitle">
              {activeHubTab === 'my-projects' ? (
                <>
                  {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                  {filter !== 'all' && <span className="filter-badge">{filter}</span>}
                </>
              ) : (
                'Projects shared by Studio Agent users'
              )}
            </p>
          </div>
          <div className="header-actions">
            {activeHubTab === 'my-projects' && projects.some(p => !p.assets || p.assets.length === 0) && (
              <button 
                className="btn-secondary" 
                onClick={handlePurgeEmptyProjects}
                style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
              >
                <Trash2 size={16} />
                <span>Purge Empty</span>
              </button>
            )}
            <button className="btn-create-new" onClick={() => setShowNewProjectModal(true)}>
              <Plus size={20} />
              <span>New Project</span>
              <kbd className="shortcut-hint">⌘N</kbd>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="hub-controls">
          <div className="hub-search">
            <Search size={18} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search projects... ⌘K" 
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
            {[
              { key: 'all', icon: null, label: 'All' },
              { key: 'favorites', icon: Heart, label: 'Favorites' },
              { key: 'completed', icon: CheckCircle, label: 'Completed' },
              { key: 'archived', icon: Archive, label: 'Archived' }
            ].map(({ key, icon: Icon, label }) => (
              <button 
                key={key} 
                className={`filter-pill ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {Icon && <Icon size={14} />}
                {label}
                {key === 'favorites' && favorites.length > 0 && (
                  <span className="count-badge">{favorites.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="view-switch">
            <button 
              className={viewMode === 'grid' ? 'active' : ''} 
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''} 
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Loading State */}
      {isLoading ? (
        <div className={`projects-grid ${viewMode}`}>
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : activeHubTab === 'discover' ? (
        <DiscoverFeed 
          onRemix={(track) => {
            const newProject = {
              id: `remix-${Date.now()}`,
              name: `Remix: ${track.name}`,
              idea: track.name,
              style: track.tags[0] || 'Modern Hip-Hop',
              assets: [
                {
                  id: 'ref-audio',
                  title: `Reference: ${track.name} by ${track.creator}`,
                  type: 'Audio',
                  audioUrl: track.audioUrl,
                  imageUrl: track.thumbnail,
                  date: 'Just now'
                }
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              progress: 25
            };
            setProjects?.(prev => [newProject, ...prev]);
            toast.success(`Remixing ${track.name} - Forked to Studio!`, {
              icon: '🍴',
              style: { background: '#22c55e', color: 'white' }
            });
            onSelectProject?.(newProject);
            setActiveHubTab('my-projects');
          }}
          onPlay={playAudio}
          playingAudio={playingAudio}
        />
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state-v3">
          {searchQuery ? (
            <>
              <div className="empty-icon search-empty">
                <Search size={48} />
              </div>
              <h3>No matches found</h3>
              <p>Nothing matches "{searchQuery}"</p>
              <button className="btn-secondary" onClick={() => setSearchQuery('')}>
                <X size={16} /> Clear Search
              </button>
            </>
          ) : (
            <>
              <div className="empty-illustration">
                <div className="floating-elements">
                  <div className="float-item item-1"><Music size={24} /></div>
                  <div className="float-item item-2"><ImageIcon size={24} /></div>
                  <div className="float-item item-3"><VideoIcon size={24} /></div>
                  <div className="float-item item-4"><FileText size={24} /></div>
                </div>
                <div className="empty-icon main-icon">
                  <Sparkles size={48} />
                </div>
              </div>
              <h3>Ready to create something amazing?</h3>
              <p>Start your first project and bring your ideas to life with AI-powered tools</p>
              
              <div className="quick-start-options">
                <button className="btn-create-new primary-cta" onClick={() => setShowNewProjectModal(true)}>
                  <Plus size={18} /> Create Project
                  <span className="shortcut-hint">⌘N</span>
                </button>
              </div>
              
              <div className="template-suggestions">
                <p className="template-label">Quick start with templates:</p>
                <div className="template-chips">
                  <button className="template-chip" onClick={() => {
                    setShowNewProjectModal(true);
                  }}>
                    <Wand2 size={14} /> Music Video
                  </button>
                  <button className="template-chip" onClick={() => {
                    setShowNewProjectModal(true);
                  }}>
                    <TrendingUp size={14} /> Social Clip
                  </button>
                  <button className="template-chip" onClick={() => {
                    setShowNewProjectModal(true);
                  }}>
                    <Star size={14} /> Podcast
                  </button>
                </div>
              </div>
            </>
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
              <p className="new-project-hint">or press ⌘N</p>
            </div>
          </div>

          {/* Project Cards */}
          {filteredProjects.map((project, index) => {
            const thumbnail = getProjectThumbnail(project);
            const assetIcons = getAssetIcons(project);
            const audioUrl = getAudioUrl(project);
            const isHovered = hoveredProject === project.id;
            const isEditing = editingId === project.id;
            const isDragOver = dragOverProject === project.id;
            const progress = project.progress || 0;

            return (
              <div
                key={project.id}
                className={`project-card ${isHovered ? 'hovered' : ''} ${isDragOver ? 'drag-over' : ''}`}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, project)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, project)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, project)}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                onClick={() => !isEditing && onSelectProject?.(project)}
                style={{ '--card-index': index }}
              >
                {/* Thumbnail */}
                <div 
                  className="card-thumbnail"
                  style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : {}}
                >
                  {!thumbnail && (
                    <div className="placeholder-thumb">
                      {assetIcons.includes('audio') ? (
                        <WaveformOverlay color={index % 2 === 0 ? 'var(--color-purple)' : 'var(--color-cyan)'} />
                      ) : (
                        <Sparkles size={32} />
                      )}
                    </div>
                  )}
                  
                  {/* Progress bar */}
                  {progress > 0 && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${progress}%`,
                          background: getProgressColor(progress)
                        }} 
                      />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className={`media-overlay ${isHovered ? 'visible' : ''}`}>
                    <div className="overlay-actions">
                      <button 
                        className="action-btn"
                        onClick={e => handlePreviewLatest(project, e)}
                        title="Quick Preview"
                      >
                        <Eye size={20} />
                      </button>
                      {audioUrl && (
                        <button 
                          className={`action-btn ${playingAudio === audioUrl ? 'playing' : ''}`}
                          onClick={e => playAudio(audioUrl, e)}
                          title={playingAudio === audioUrl ? 'Pause' : 'Play audio'}
                        >
                          {playingAudio === audioUrl ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                      )}
                      <button 
                        className="action-btn primary"
                        onClick={e => handleQuickOpen(project, e)}
                        title="Open project"
                      >
                        <Zap size={20} />
                      </button>
                    </div>
                    <p className="overlay-hint">Click to open • Drag to reorder</p>
                  </div>

                  {/* Favorite Badge */}
                  <button 
                    className={`fav-btn ${favorites.includes(project.id) ? 'active' : ''}`}
                    onClick={e => toggleFavorite(project.id, e)}
                    title={favorites.includes(project.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={16} fill={favorites.includes(project.id) ? 'currentColor' : 'none'} />
                  </button>

                  {/* Asset Type Badges */}
                  {assetIcons.length > 0 && (
                    <div className="asset-badges">
                      {assetIcons.includes('audio') && <span className="badge audio" title="Preview Audio" onClick={e => handlePreviewAssetType(project, 'audio', e)}><Music size={12} /></span>}
                      {assetIcons.includes('image') && <span className="badge image" title="Preview Image" onClick={e => handlePreviewAssetType(project, 'image', e)}><ImageIcon size={12} /></span>}
                      {assetIcons.includes('video') && <span className="badge video" title="Preview Video" onClick={e => handlePreviewAssetType(project, 'video', e)}><VideoIcon size={12} /></span>}
                      {assetIcons.includes('text') && <span className="badge text" title="Preview Text" onClick={e => handlePreviewAssetType(project, 'text', e)}><FileText size={12} /></span>}
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
                        <span className="meta-visibility">
                          {project.isPublic ? (
                            <GlobeIcon size={12} color="var(--color-cyan)" />
                          ) : (
                            <LockIcon size={12} />
                          )}
                          {project.isPublic ? 'Public' : 'Private'}
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
                      <button onClick={e => handlePreviewLatest(project, e)}>
                        <Eye size={16} /> Quick Preview
                      </button>
                      <button onClick={e => startRename(project, e)}>
                        <Edit3 size={16} /> Rename
                      </button>
                      <button onClick={e => handleDuplicate(project, e)}>
                        <Copy size={16} /> Duplicate
                      </button>
                      <button onClick={e => {
                        e.stopPropagation();
                        const updated = { ...project, isPublic: !project.isPublic };
                        setProjects?.(prev => prev.map(p => p.id === project.id ? updated : p));
                        onSaveProject?.(updated);
                        setShowContextMenu(null);
                        toast.success(updated.isPublic ? 'Project is now Public' : 'Project is now Private');
                      }}>
                        {project.isPublic ? <LockIcon size={16} /> : <GlobeIcon size={16} />}
                        {project.isPublic ? 'Make Private' : 'Make Public'}
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
          animation: fadeIn 0.4s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
        
        .title-section h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hub-subtitle {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin: 4px 0 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .filter-badge {
          padding: 2px 8px;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 4px;
          font-size: 0.75rem;
          color: var(--color-purple);
          text-transform: capitalize;
        }
        
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .btn-create-new::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .btn-create-new:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 32px rgba(139, 92, 246, 0.5);
        }
        
        .btn-create-new:hover::before {
          opacity: 1;
        }
        
        .btn-create-new:active {
          transform: translateY(-1px) scale(0.98);
        }
        
        .shortcut-hint {
          padding: 2px 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
          font-size: 0.7rem;
          font-family: monospace;
          margin-left: 4px;
        }
        
        .count-badge {
          padding: 0 6px;
          background: var(--color-purple);
          border-radius: 10px;
          font-size: 0.7rem;
          min-width: 18px;
          text-align: center;
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
        
        /* Drag & Drop States */
        .project-card.dragging {
          opacity: 0.5;
          transform: scale(0.95);
          border: 2px dashed var(--color-purple);
        }
        
        .project-card.drag-over {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);
          border-color: var(--color-cyan);
          background: rgba(139, 92, 246, 0.1);
        }
        
        /* Staggered Animation for Cards */
        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .project-card {
          animation: cardEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        }
        
        .project-card:nth-child(1) { animation-delay: 0.05s; }
        .project-card:nth-child(2) { animation-delay: 0.1s; }
        .project-card:nth-child(3) { animation-delay: 0.15s; }
        .project-card:nth-child(4) { animation-delay: 0.2s; }
        .project-card:nth-child(5) { animation-delay: 0.25s; }
        .project-card:nth-child(6) { animation-delay: 0.3s; }
        .project-card:nth-child(7) { animation-delay: 0.35s; }
        .project-card:nth-child(8) { animation-delay: 0.4s; }
        
        /* Skeleton Loading */
        .skeleton-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
          min-height: 280px;
        }
        
        .skeleton-thumb {
          height: 180px;
          background: linear-gradient(90deg, 
            var(--bg-tertiary) 0%, 
            rgba(255,255,255,0.1) 50%, 
            var(--bg-tertiary) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        .skeleton-info {
          padding: 16px;
        }
        
        .skeleton-line {
          height: 16px;
          background: linear-gradient(90deg, 
            var(--bg-tertiary) 0%, 
            rgba(255,255,255,0.1) 50%, 
            var(--bg-tertiary) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
          margin-bottom: 12px;
        }
        
        .skeleton-line.short {
          width: 60%;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        /* Progress Bar */
        .progress-bar-container {
          margin-top: 12px;
        }
        
        .progress-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        
        .progress-bar {
          height: 4px;
          background: var(--bg-tertiary);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        
        .progress-fill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
          animation: progressShine 2s infinite;
        }
        
        @keyframes progressShine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        /* Overlay Hint */
        .overlay-hint {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.75rem;
          color: rgba(255,255,255,0.7);
          background: rgba(0,0,0,0.5);
          padding: 4px 12px;
          border-radius: 12px;
          white-space: nowrap;
        }
        
        /* New Project Hint */
        .new-project-hint {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        
        .new-project-hint kbd {
          display: inline-block;
          padding: 2px 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.7rem;
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

        .media-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .media-overlay.visible {
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
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
        }

        .badge:hover {
          transform: scale(1.1) translateY(-2px);
          filter: brightness(1.2);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10;
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

        .meta-visibility {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary);
        }
        
        .meta-visibility svg {
          opacity: 0.7;
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
          animation: fadeIn 0.5s ease;
        }
        
        .empty-illustration {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto 32px;
        }
        
        .floating-elements {
          position: absolute;
          inset: 0;
        }
        
        .float-item {
          position: absolute;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: float 3s ease-in-out infinite;
        }
        
        .float-item.item-1 {
          top: 10px;
          left: 20px;
          background: linear-gradient(135deg, var(--color-purple) 0%, #a855f7 100%);
          animation-delay: 0s;
        }
        
        .float-item.item-2 {
          top: 20px;
          right: 10px;
          background: linear-gradient(135deg, var(--color-pink) 0%, #f472b6 100%);
          animation-delay: 0.5s;
        }
        
        .float-item.item-3 {
          bottom: 30px;
          left: 10px;
          background: linear-gradient(135deg, var(--color-cyan) 0%, #22d3ee 100%);
          animation-delay: 1s;
        }
        
        .float-item.item-4 {
          bottom: 10px;
          right: 30px;
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          animation-delay: 1.5s;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        .empty-icon.main-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);
        }
        
        .empty-icon.search-empty {
          width: 100px;
          height: 100px;
          margin: 0 auto 24px;
          background: rgba(255,255,255,0.05);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        .empty-state-v3 h3 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 12px;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .empty-state-v3 p {
          color: var(--text-secondary);
          margin: 0 0 32px;
          font-size: 1rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .quick-start-options {
          margin-bottom: 40px;
        }
        
        .primary-cta {
          font-size: 1.1rem;
          padding: 16px 32px;
        }
        
        .template-suggestions {
          max-width: 400px;
          margin: 0 auto;
        }
        
        .template-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 16px !important;
        }
        
        .template-chips {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .template-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .template-chip:hover {
          border-color: var(--color-purple);
          color: white;
          background: rgba(139, 92, 246, 0.1);
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-secondary:hover {
          border-color: var(--color-purple);
          background: rgba(139, 92, 246, 0.1);
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

        /* Waveform Animation */
        .waveform-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 48px;
          width: 100%;
          padding: 0 20px;
        }

        .waveform-bar {
          width: 3px;
          border-radius: 2px;
          animation: waveform 1.2s ease-in-out infinite;
          opacity: 0.6;
        }

        @keyframes waveform {
          0%, 100% { height: 20%; transform: scaleY(1); }
          50% { height: 100%; transform: scaleY(1.2); }
        }

        /* Tablet */
        @media (max-width: 1024px) {
          .projects-grid.grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
          
          .hub-filters {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .hub-filters::-webkit-scrollbar {
            display: none;
          }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .project-hub-v3 {
            padding: 16px;
          }

          .hub-title-row {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          
          .hub-title-row h1 {
            font-size: 1.5rem;
          }

          .btn-create-new {
            width: 100%;
            justify-content: center;
            padding: 14px 24px;
          }

          .hub-controls {
            flex-direction: column;
            gap: 12px;
          }

          .hub-search {
            width: 100%;
          }

          .hub-filters {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
            flex-wrap: nowrap;
          }
          
          .filter-pill {
            flex-shrink: 0;
            padding: 8px 14px;
          }
          
          .view-switch {
            display: none;
          }

          .projects-grid.grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          .project-card.new-project-card {
            min-height: 200px;
          }
          
          .plus-circle {
            width: 56px;
            height: 56px;
          }
          
          .plus-circle svg {
            width: 24px;
            height: 24px;
          }
          
          .new-project-inner span {
            font-size: 0.85rem;
          }

          .card-thumbnail {
            height: 120px;
          }
          
          .fav-btn {
            width: 32px;
            height: 32px;
            top: 8px;
            right: 8px;
          }
          
          .asset-badges {
            bottom: 8px;
            left: 8px;
            gap: 4px;
          }
          
          .badge {
            width: 24px;
            height: 24px;
          }
          
          .card-info {
            padding: 12px;
          }
          
          .card-title {
            font-size: 0.9rem;
          }
          
          .card-meta {
            font-size: 0.75rem;
            gap: 8px;
          }
          
          .context-btn {
            width: 28px;
            height: 28px;
            top: 12px;
            right: 8px;
          }
          
          /* Make overlay always visible on touch devices */
          .media-overlay {
            opacity: 0;
          }
          
          .project-card:active .media-overlay {
            opacity: 1;
          }
          
          .action-btn {
            width: 40px;
            height: 40px;
          }
          
          .action-btn.play-btn {
            width: 48px;
            height: 48px;
          }

          .template-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .modal-v3 {
            padding: 24px;
            margin: 16px;
            max-height: 90vh;
            overflow-y: auto;
          }
          
          .modal-v3 h2 {
            font-size: 1.25rem;
          }
          
          .modal-actions {
            flex-direction: column;
          }
          
          .btn-secondary, .btn-primary {
            width: 100%;
            justify-content: center;
          }
          
          .empty-state-v3 {
            padding: 48px 24px;
          }
          
          .empty-icon {
            width: 80px;
            height: 80px;
          }
          
          .empty-state-v3 h3 {
            font-size: 1.25rem;
          }
        }

        /* ══════════════════════════════
           BANDLAB STYLE ENHANCEMENTS 
           ══════════════════════════════ */
        
        .hub-tabs-modern {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          background: var(--bg-secondary);
          padding: 6px;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          width: fit-content;
        }

        .hub-tab-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s ease;
          position: relative;
        }

        .hub-tab-item:hover {
          color: white;
          background: rgba(255,255,255,0.05);
        }

        .hub-tab-item.active {
          color: white;
          background: var(--bg-tertiary);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          position: absolute;
          top: 8px;
          right: 8px;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.7; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }

        /* Discover Feed */
        .discover-feed-container {
          display: flex;
          flex-direction: column;
          gap: 40px;
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .btn-text {
          background: none;
          border: none;
          color: var(--color-purple);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Trending Creators */
        .creator-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 8px 0 24px;
          scrollbar-width: thin;
          scrollbar-color: var(--border-color) transparent;
        }

        .creator-scroll::-webkit-scrollbar {
          height: 4px;
        }
        
        .creator-scroll::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 10px;
        }

        .creator-card {
          flex: 0 0 160px;
          background: var(--bg-secondary);
          padding: 24px 16px;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .creator-card:hover {
          transform: translateY(-5px);
          border-color: var(--color-purple);
          background: var(--bg-tertiary);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .avatar-wrapper {
          position: relative;
          width: 64px;
          height: 64px;
          margin-bottom: 4px;
        }

        .avatar-wrapper img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid var(--color-purple);
          object-fit: cover;
        }

        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          background: #22c55e;
          border: 2px solid var(--bg-secondary);
          border-radius: 50%;
        }

        .creator-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: white;
        }

        .creator-stat {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .btn-follow {
          margin-top: 8px;
          width: 100%;
          padding: 8px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-follow:hover {
          background: var(--color-purple);
          border-color: var(--color-purple);
        }

        /* Feed Tracks */
        .feed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .feed-item-card {
          background: var(--bg-secondary);
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid var(--border-color);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feed-item-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          border-color: rgba(255,255,255,0.2);
        }

        .track-thumb {
          height: 180px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .track-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .feed-item-card:hover .track-overlay {
          opacity: 1;
        }

        .play-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--color-purple);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transform: scale(0.9);
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .play-circle:hover {
          transform: scale(1.1);
          background: var(--color-pink);
        }

        .remix-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 6px 12px;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,0.2);
          z-index: 2;
        }

        .source-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          padding: 6px 12px;
          background: var(--color-purple);
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 800;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4);
          z-index: 2;
          border: 1px solid rgba(255,255,255,0.3);
        }

        .track-info {
          padding: 20px;
        }

        .track-name {
          font-size: 1.125rem;
          font-weight: 700;
          margin: 0;
          color: white;
        }

        .track-creator {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 4px 0 16px;
        }

        .track-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .tag {
          font-size: 0.7rem;
          color: var(--color-cyan);
          background: rgba(6, 182, 212, 0.1);
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 600;
        }

        .track-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .stats {
          display: flex;
          gap: 16px;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .stats span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-remix-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          color: var(--color-purple);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-remix-action:hover {
          background: var(--color-purple);
          color: white;
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        }

        .feed-filters {
          display: flex;
          gap: 16px;
        }

        .feed-filters button {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 0;
          position: relative;
          transition: color 0.2s;
        }

        .feed-filters button:hover {
          color: white;
        }

        .feed-filters button.active {
          color: white;
        }

        .feed-filters button.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-purple);
          border-radius: 2px;
        }

        /* Small phones */
        @media (max-width: 400px) {
          .project-hub-v3 {
            padding: 12px;
          }
          
          .projects-grid.grid {
            grid-template-columns: 1fr;
          }
          
          .card-thumbnail {
            height: 160px;
          }
          
          .template-grid {
            grid-template-columns: 1fr;
          }
        }
        
        /* Desktop large screens */
        @media (min-width: 1400px) {
          .project-hub-v3 {
            max-width: 1600px;
          }
          
          .projects-grid.grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 24px;
          }
          
          .card-thumbnail {
            height: 200px;
          }
        }
        
        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
          .project-card:hover {
            transform: none;
            box-shadow: none;
          }
          
          .project-card:active {
            transform: scale(0.98);
          }
          
          .media-overlay {
            display: none;
          }
          
          .fav-btn {
            opacity: 1;
          }
          
          .context-btn {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default ProjectHubV3;
