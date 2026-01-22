import React, { useMemo } from 'react';
import { 
  Sparkles, Zap, Music, ArrowRight,
  TrendingUp, Activity,
  Plus, LayoutGrid, Film, Edit3,
  Settings, CreditCard, Folder // added back relevant used icons
} from 'lucide-react';
import './StudioDashboard.css';

/**
 * StudioDashboard - Main Overview Page
 * Features: Analytics, Recent Projects, What's New, Quick Actions
 */
function StudioDashboard({ 
  user, 
  projects = [],
  credits = 0,
  onNavigate,
  onCreateProject,
  onOpenProject
}) {
  // Calculate real stats from projects
  const stats = useMemo(() => {
    if (!projects) return { totalProjects: 0, hoursSaved: 0, assetsGenerated: 0, creditsUsed: 0 };
    
    const assetCount = projects.reduce((acc, p) => acc + (p.assets ? p.assets.length : 0), 0);
    return {
      totalProjects: projects.length,
      hoursSaved: Math.round(assetCount * 0.5), // Approx 30 mins saved per asset
      assetsGenerated: assetCount,
      creditsUsed: 500 - (credits || 0) // Assuming 500 start
    };
  }, [projects, credits]);

  const RECENTLY_ADDED = [
    {
      id: 'veo-3',
      title: 'Google Veo 3.0',
      desc: 'Cinematic 1080p video generation with motion control.',
      icon: Film,
      color: 'var(--color-pink)',
      badge: 'NEW'
    },
    {
      id: 'flux-pro',
      title: 'Flux 1.1 Pro',
      desc: 'Ultra-realistic image generation with coherent text.',
      icon: LayoutGrid,
      color: 'var(--color-purple)',
      badge: 'HOT'
    },
    {
      id: 'captions',
      title: 'Smart Captions',
      desc: 'AI-powered auto-captions with trending styles.',
      icon: Edit3,
      color: 'var(--color-cyan)',
      badge: 'BETA'
    }
  ];

  return (
    <div className="studio-dashboard animate-fadeIn">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="welcome-text">
          <h1>Welcome back, {user?.displayName || 'Creator'}</h1>
          <p>Ready to create something amazing today?</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
             <button 
               className="haptic-press" 
               onClick={() => onNavigate('billing')}
               title="Billing & Credits"
               style={{
                 background: 'rgba(255,255,255,0.05)',
                 border: '1px solid rgba(255,255,255,0.1)',
                 borderRadius: '12px',
                 padding: '12px',
                 color: 'white',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center'
               }}
             >
               <CreditCard size={20} />
             </button>
             <button 
               className="haptic-press" 
               onClick={() => onNavigate('settings')}
               title="Settings"
               style={{
                 background: 'rgba(255,255,255,0.05)',
                 border: '1px solid rgba(255,255,255,0.1)',
                 borderRadius: '12px',
                 padding: '12px',
                 color: 'white',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center'
               }}
             >
               <Settings size={20} />
             </button>
            <button className="create-new-btn haptic-press" onClick={onCreateProject}>
              <Plus size={20} />
              <span>New Project</span>
            </button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="analytics-grid">
        <div className="stat-card">
          <div className="stat-icon purple">
            <Folder size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalProjects}</span>
            <span className="stat-label">Active Projects</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pink">
            <Zap size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.assetsGenerated}</span>
            <span className="stat-label">Assets Created</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.hoursSaved}h</span>
            <span className="stat-label">Hours Saved</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <Activity size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{credits}</span>
            <span className="stat-label">Credits Left</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        
        {/* Left Column: Recent Work & Editor */}
        <div className="main-column">
          
          {/* Recent Projects */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2><Clock size={18} /> Recent Projects</h2>
              <button className="view-all-btn" onClick={() => onNavigate('hub')}>View All</button>
            </div>
            
            <div className="recent-projects-rail">
              {projects.length > 0 ? (
                projects.slice(0, 4).map(project => (
                  <div key={project.id} className="recent-project-card haptic-press" onClick={() => onOpenProject(project)}>
                    <div className="project-thumbnail" style={{
                       backgroundImage: project.imageUrl || project.coverImage ? `url(${project.imageUrl || project.coverImage})` : 'none',
                       backgroundSize: 'cover'
                    }}>
                      {(!project.imageUrl && !project.coverImage) && <Folder size={24} color="var(--text-secondary)" />}
                      <div className="project-type-badge">{project.category || 'Music'}</div>
                    </div>
                    <div className="project-details">
                      <h3>{project.name}</h3>
                      <p>{new Date(project.updatedAt || project.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-projects-state">
                  <p>No projects yet. Start creating!</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick Editing Tools (CapCut Style) */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2><Edit3 size={18} /> Studio Editing Suite</h2>
              <span className="beta-tag">NEW</span>
            </div>
            
            <div className="editing-tools-grid">
              <div className="tool-card haptic-press" onClick={() => onNavigate('orchestrator')}>
                <div className="tool-icon-large pink">
                  <Film size={28} />
                </div>
                <div className="tool-info">
                  <h3>Video Editor</h3>
                  <p>Timeline, transitions & effects</p>
                </div>
                <ArrowRight size={18} className="arrow-icon" />
              </div>

              <div className="tool-card haptic-press" onClick={() => onNavigate('quick-captions')}>
                <div className="tool-icon-large cyan">
                  <Activity size={28} />
                </div>
                <div className="tool-info">
                  <h3>Auto Captions</h3>
                  <p>Generate & style subtitles</p>
                </div>
                <ArrowRight size={18} className="arrow-icon" />
              </div>

              <div className="tool-card haptic-press" onClick={() => onNavigate('mastering')}>
                <div className="tool-icon-large purple">
                  <Music size={28} />
                </div>
                <div className="tool-info">
                  <h3>Audio Mastering</h3>
                  <p>Enhance mix quality instantly</p>
                </div>
                <ArrowRight size={18} className="arrow-icon" />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Recent Added & Trending */}
        <div className="side-column">
          
          {/* Recently Added Features */}
          <section className="dashboard-section compact">
            <div className="section-header">
              <h2><Sparkles size={18} /> Recently Added</h2>
            </div>
            <div className="features-list">
              {RECENTLY_ADDED.map(feature => (
                <div key={feature.id} className="feature-item">
                  <div className="feature-icon" style={{ color: feature.color, background: `${feature.color}15` }}>
                    <feature.icon size={18} />
                  </div>
                  <div className="feature-content">
                    <div className="feature-title-row">
                      <h4>{feature.title}</h4>
                      {feature.badge && <span className="feature-badge">{feature.badge}</span>}
                    </div>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Trending Agents */}
          <section className="dashboard-section compact">
             <div className="section-header">
              <h2><TrendingUp size={18} /> Trending Agents</h2>
            </div>
            <div className="trending-list">
               <div className="trending-item haptic-press" onClick={() => onNavigate('agents')}>
                 <span className="trend-rank">1</span>
                 <div className="trend-info">
                   <h4>Ghostwriter</h4>
                   <p>Lyrics & Topline</p>
                 </div>
                 <div className="trend-stat">+24%</div>
               </div>
               <div className="trending-item haptic-press" onClick={() => onNavigate('agents')}>
                 <span className="trend-rank">2</span>
                 <div className="trend-info">
                   <h4>Beat Architect</h4>
                   <p>lo-fi & trap beats</p>
                 </div>
                 <div className="trend-stat">+18%</div>
               </div>
               <div className="trending-item haptic-press" onClick={() => onNavigate('agents')}>
                 <span className="trend-rank">3</span>
                 <div className="trend-info">
                   <h4>Visual Vibe</h4>
                   <p>Cover Art</p>
                 </div>
                 <div className="trend-stat">+12%</div>
               </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default StudioDashboard;
