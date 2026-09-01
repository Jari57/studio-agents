import React, { Suspense } from 'react';
import {
  Sparkles, Zap, Users as UsersIcon, Rocket,
  Folder, Plus, Share2, CreditCard,
  RefreshCw, Trash2, Eye, EyeOff, Landmark, ArrowRight, ChevronRight, User, LayoutGrid,
  Disc, Activity, Settings, CheckCircle, Clock,
  Image as ImageIcon, Mail, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AGENTS, BACKEND_URL } from '../../constants';
import { auth } from '../../firebase';
import { shouldUseNativeIAP } from '../../utils/nativePlatform';
import SectionErrorBoundary from './SectionErrorBoundary';

const WEB_CHECKOUT_ENABLED = import.meta.env.VITE_STRIPE_CHECKOUT_ENABLED === 'true';

// Lazy load AdminAnalytics
const AdminAnalytics = React.lazy(() => import('../AdminAnalytics'));

const DashboardView = ({
  // State
  dashboardTab,
  setDashboardTab,
  managedAgents,
  appSettings,
  storageConnections: _storageConnections,
  setStorageConnections: _setStorageConnections,
  socialConnections: _socialConnections,
  creationStats,
  systemStatus,
  // User/Auth
  user,
  isLoggedIn,
  isAdmin,
  userCredits,
  userPlan,
  userProfile,
  // Projects
  projects,
  selectedProject,
  setSelectedProject,
  // UI/Navigation
  setActiveTab,
  setShowCreditsModal,
  setShowOrchestrator,
  setShowProjectTypeChoice,
  setShowOnboarding,
  setOnboardingStep,
  setPendingProjectNav,
  setSelectedAgent,
  setShowLoginModal,
  // Data
  freeGenerationsUsed: _freeGenerationsUsed,
  FREE_GENERATION_LIMIT: _FREE_GENERATION_LIMIT,
  twitterUsername: _twitterUsername,
  metaName: _metaName,
  activeProjectSteps,
  // Functions
  toggleAppSetting,
  handleDeleteAccount,
  toggleAgentVisibility,
  handleConnectSocial: _handleConnectSocial,
  buyCreditPack,
  handleSubscribe,
  handleTextToVoice
}) => {
  const creditDisplay = isAdmin ? 'Unlimited' : userCredits;
  return (
    <div className="studio-dashboard animate-fadeInUp" style={{ color: 'var(--studio-ink)', background: 'var(--studio-bg)' }}>
      <div className="dashboard-sidebar-layout">
        {/* Dashboard Sidebar */}
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2>Studio</h2>
                <span className="pro-badge">PRO</span>
              </div>
              <div
                className="status-indicator"
                title={systemStatus.message}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: systemStatus.status === 'configured'
                    ? 'var(--color-amber, #876238)'
                    : systemStatus.status === 'checking'
                      ? 'var(--color-slate, #64748b)'
                      : 'var(--color-red)',
                  boxShadow: systemStatus.status === 'configured'
                    ? '0 0 8px var(--color-amber, #876238)'
                    : systemStatus.status === 'checking'
                      ? 'none'
                      : '0 0 8px var(--color-red)'
                }}
              />
            </div>
          </div>
          <nav className="sidebar-nav" aria-label="Dashboard navigation">
            <button
              className={`sidebar-link ${dashboardTab === 'overview' ? 'active' : ''}`}
              onClick={() => setDashboardTab('overview')}
            >
              <LayoutGrid size={18} /> Overview
            </button>
            <button
              className={`sidebar-link ${dashboardTab === 'agents' ? 'active' : ''}`}
              onClick={() => setDashboardTab('agents')}
            >
              <UsersIcon size={18} /> Manage Agents
            </button>
            <button
              className={`sidebar-link ${dashboardTab === 'billing' ? 'active' : ''}`}
              onClick={() => setDashboardTab('billing')}
            >
              <CreditCard size={18} /> Billing & Wallet
            </button>
            <button
              className={`sidebar-link ${dashboardTab === 'settings' ? 'active' : ''}`}
              onClick={() => setDashboardTab('settings')}
            >
              <Settings size={18} /> App Settings
            </button>

            {isAdmin && (
              <button
                className={`sidebar-link ${dashboardTab === 'admin' ? 'active' : ''}`}
                onClick={() => setDashboardTab('admin')}
                style={{ color: 'var(--studio-sage)' }}
              >
                <Activity size={18} /> Admin Analytics
              </button>
            )}
          </nav>

          {isLoggedIn && (
            <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--glass-border)' }}>
              <div style={{
                background: 'rgba(135, 98, 56, 0.05)',
                border: '1px solid rgba(135, 98, 56, 0.1)',
                borderRadius: '12px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--studio-muted)' }}>Credits</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--studio-warning)', fontWeight: '800' }}>{creditDisplay}</span>
                </div>
                <button
                  disabled={isAdmin || !WEB_CHECKOUT_ENABLED}
                  onClick={() => setShowCreditsModal(true)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--studio-warning)',
                    color: 'var(--studio-on-accent)',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: (!isAdmin && WEB_CHECKOUT_ENABLED) ? 'pointer' : 'not-allowed',
                    opacity: (!isAdmin && WEB_CHECKOUT_ENABLED) ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Zap size={14} fill="currentColor" /> Top Up
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Content Area */}
        <div className="dashboard-main-content">
          {dashboardTab === 'overview' && (
            <div className="dashboard-view-overview animate-fadeIn" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Artist Profile & Command Center */}
              <div className="artist-profile-header animate-fadeIn" style={{
                order: 1,
                background: 'linear-gradient(135deg, var(--studio-surface) 0%, var(--studio-surface-alt) 100%)',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid var(--studio-border)',
                boxShadow: 'var(--studio-shadow)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div className="profile-avatar-wrapper" style={{ position: 'relative' }}>
                      <div className="profile-avatar" style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--studio-accent), var(--studio-sage))',
                        padding: '3px',
                        boxShadow: 'var(--studio-shadow)'
                      }}>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background: 'var(--studio-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" loading="lazy" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                          ) : (
                            <User size={48} color="var(--studio-muted)" />
                          )}
                        </div>
                      </div>
                      {isLoggedIn && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          background: 'var(--studio-sage)',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '4px solid var(--studio-surface)',
                          boxShadow: '0 0 10px var(--studio-sage)'
                        }} title="Online" />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: '800', letterSpacing: '-0.5px' }}>{user?.displayName || 'Guest Creator'}</h1>
                        <span className="pro-badge" style={{
                          background: 'var(--studio-warning)',
                          color: 'var(--studio-on-accent)',
                          fontWeight: '800',
                          fontSize: '0.7rem',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          textTransform: 'uppercase'
                        }}>
                          {userPlan || 'Artist'} Tier
                        </span>
                      </div>
                      <p style={{ color: 'var(--studio-muted)', margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={16} /> {user?.email || 'studio.access@whip.ai'}
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-pill glass" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => setActiveTab('profile')}>
                          <Settings size={14} /> Account Settings
                        </button>
                        <button className="btn-pill glass" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => setDashboardTab('billing')}>
                          <Landmark size={14} /> Wallet
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="studio-vital-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', minWidth: '320px' }}>
                    <div className="vital-card" style={{ background: 'rgba(var(--studio-ink-rgb),0.02)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(var(--studio-ink-rgb),0.05)', textAlign: 'center' }}>
                      <Folder size={18} color="var(--studio-sage)" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--studio-ink)' }}>{creationStats.projectCount}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--studio-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Projects</div>
                      <div style={{ marginTop: '6px', fontSize: '0.7rem', color: 'var(--studio-muted)' }}>{creationStats.assetCount} project assets</div>
                    </div>
                    <div className="vital-card" style={{ background: 'rgba(var(--studio-ink-rgb),0.02)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(var(--studio-ink-rgb),0.05)', textAlign: 'center' }}>
                      <Zap size={18} color="var(--studio-warning)" fill="var(--studio-warning)" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--studio-warning)' }}>{creditDisplay}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--studio-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Avail. Credits</div>
                    </div>
                    <div className="vital-card" style={{ background: 'rgba(var(--studio-ink-rgb),0.02)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(var(--studio-ink-rgb),0.05)', textAlign: 'center' }}>
                      <UsersIcon size={18} color="var(--studio-accent)" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--studio-accent)' }}>{(managedAgents || []).filter(a => a.visible).length}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--studio-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Agents</div>
                    </div>
                  </div>
                </div>

                <p style={{ margin: '16px 0 0', fontSize: '0.75rem', color: 'var(--studio-muted)' }}>
                  Creation counts reflect this project list. Streaming and audience analytics are not connected here.
                </p>

                {/* Quick Session Indicator */}
                {selectedProject && (
                  <div style={{
                    marginTop: '24px',
                    background: 'rgba(86, 105, 84, 0.05)',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px dashed rgba(86, 105, 84, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--studio-sage)', fontSize: '0.9rem' }}>
                      <div className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--studio-sage)' }} />
                      <span>Active Session: <strong>{selectedProject.name}</strong></span>
                    </div>
                    <button className="text-button" onClick={() => setActiveTab('hub')} style={{ fontSize: '0.8rem', color: 'var(--studio-sage)', fontWeight: '600' }}>
                      Switch Project <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions Grid */}
              <div className="dashboard-card animate-fadeInUp" style={{
                order: 3,
                marginBottom: '24px',
                background: 'var(--studio-surface)',
                borderRadius: '24px',
                padding: '24px',
                border: '1px solid var(--studio-border)'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap size={20} className="text-purple" /> Quick Actions
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'New Project', icon: Plus, color: 'var(--studio-accent)', action: () => setShowProjectTypeChoice(true) },
                    { label: 'AI Pipeline', icon: Sparkles, color: 'var(--studio-sage)', action: () => setShowOrchestrator(true) },
                    { label: 'Browse Agents', icon: UsersIcon, color: 'var(--studio-accent)', action: () => setActiveTab('agents') },
                    { label: 'Project Hub', icon: Folder, color: 'var(--studio-sage)', action: () => setActiveTab('hub') }
                  ].map((item, i) => (
                    <button key={i} onClick={item.action} className="haptic-press" style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                      padding: '20px 12px', background: 'rgba(var(--studio-ink-rgb),0.03)', borderRadius: '16px',
                      border: '1px solid rgba(var(--studio-ink-rgb),0.06)', cursor: 'pointer', color: 'inherit',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--studio-ink-rgb),0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <item.icon size={22} style={{ color: item.color }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Completion Pulse (Optional) */}
              {!userProfile.stageName && (
                <div className="profile-nudge-card animate-fadeInUp" style={{
                  order: 2,
                  background: 'linear-gradient(135deg, rgba(163, 66, 41, 0.1) 0%, rgba(154, 89, 63, 0.1) 100%)',
                  border: '1px solid rgba(163, 66, 41, 0.3)',
                  borderRadius: '24px',
                  padding: '24px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'var(--studio-accent)', padding: '10px', borderRadius: '50%', color: 'var(--studio-on-accent)' }}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Complete Your Creator Profile</h3>
                      <p style={{ margin: 0, color: 'var(--studio-muted)', fontSize: '0.9rem' }}>Set your stage name and genre to get personalized AI results.</p>
                    </div>
                  </div>
                  <button
                    className="cta-button-premium"
                    onClick={() => setActiveTab('profile')}
                  >
                    Setup Profile
                  </button>
                </div>
              )}

              {/* AI Production Pipeline Card - NEW PRIMARY ACTION */}
              <div className="dashboard-card orchestrator-promo-card animate-fadeInUp" style={{
                order: 4,
                marginBottom: '24px',
                background: 'linear-gradient(135deg, rgba(163, 66, 41, 0.1) 0%, rgba(86, 105, 84, 0.1) 100%)',
                border: '1px solid rgba(163, 66, 41, 0.3)',
                borderRadius: '24px',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                  <Zap size={120} color="var(--studio-accent)" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ background: 'linear-gradient(135deg, var(--studio-accent), var(--studio-sage))', padding: '10px', borderRadius: '12px', color: 'var(--studio-on-accent)' }}>
                        <Zap size={24} />
                      </div>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>AI Production Pipeline</h2>
                    </div>
                    <p style={{ color: 'var(--studio-muted)', fontSize: '1rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                      Transform a single idea into a complete release package. Our multi-agent orchestrator handles lyrics, beats, visuals, and marketing in one automated flow.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        className="cta-button-premium"
                        onClick={() => setShowOrchestrator(true)}
                        style={{ padding: '12px 24px' }}
                      >
                        Start AI Production
                      </button>
                      <button
                        className="btn-pill glass"
                        onClick={() => setActiveTab('resources')}
                      >
                        Watch Demo
                      </button>
                    </div>
                  </div>
                  <div className="orchestrator-stats" style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(var(--studio-ink-rgb),0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(var(--studio-ink-rgb),0.05)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--studio-accent)' }}>4</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--studio-muted)', textTransform: 'uppercase' }}>Agents</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(var(--studio-ink-rgb),0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(var(--studio-ink-rgb),0.05)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--studio-sage)' }}>1-Click</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--studio-muted)', textTransform: 'uppercase' }}>Workflow</div>
                    </div>
                  </div>
                </div>
              </div>



              {/* Recent Projects Section */}
              <section className="dashboard-card recent-projects-card" style={{ order: 5, marginBottom: '24px' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Folder size={18} className="text-cyan" /> Your Projects
                  </h3>
                  <button
                    className="btn-pill glass"
                    onClick={() => setActiveTab('hub')}
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="empty-projects-state" style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    background: 'rgba(var(--studio-ink-rgb),0.02)',
                    borderRadius: '12px',
                    marginTop: '16px'
                  }}>
                    <Folder size={40} style={{ color: 'var(--studio-muted)', marginBottom: '12px' }} />
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--studio-ink)' }}>No Projects Yet</h4>
                    <p style={{ margin: '0 0 16px 0', color: 'var(--studio-muted)', fontSize: '0.9rem' }}>
                      Start your first project and track your creative journey.
                    </p>
                    <button className="btn-pill primary" onClick={() => setShowProjectTypeChoice(true)}>
                      <Plus size={14} /> Create First Project
                    </button>
                  </div>
                ) : (
                  <div className="projects-list-view" style={{ marginTop: '16px' }}>
                    {(projects || []).slice(0, 5).map((project, idx) => {
                      const createdDate = project.createdAt ? new Date(project.createdAt) : (project.date ? new Date(project.date) : new Date());
                      const formattedDate = createdDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: createdDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      });

                      return (
                        <div
                          key={project.id || idx}
                          className="project-list-item touch-feedback"
                          onClick={() => {
                            setSelectedProject(project);
                            setPendingProjectNav(true);
                          }}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '48px 1fr auto',
                            gap: '16px',
                            alignItems: 'center',
                            padding: '16px',
                            background: selectedProject?.id === project.id ? 'rgba(163, 66, 41, 0.1)' : 'rgba(var(--studio-ink-rgb),0.02)',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            border: selectedProject?.id === project.id ? '1px solid var(--studio-accent)' : '1px solid rgba(var(--studio-ink-rgb),0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--studio-accent)'}
                          onMouseLeave={(e) => { if (selectedProject?.id !== project.id) e.currentTarget.style.borderColor = 'rgba(var(--studio-ink-rgb),0.05)'; }}
                        >
                          {/* Project Thumbnail/Icon */}
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '10px',
                            background: project.category === 'music' ? 'linear-gradient(135deg, var(--studio-accent) 0%, var(--studio-accent) 100%)' :
                                        project.category === 'visual' ? 'linear-gradient(135deg, var(--studio-sage) 0%, var(--studio-sage) 100%)' :
                                        project.category === 'marketing' ? 'linear-gradient(135deg, var(--studio-accent) 0%, var(--color-red) 100%)' :
                                        'linear-gradient(135deg, var(--studio-sage) 0%, var(--studio-sage) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--studio-on-accent)',
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            flexShrink: 0
                          }}>
                            {project.category === 'music' ? <Disc size={22} /> :
                             project.category === 'visual' ? <ImageIcon size={22} /> :
                             project.category === 'marketing' ? <Share2 size={22} /> :
                             <Folder size={22} />}
                          </div>

                          {/* Project Details */}
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '4px'
                            }}>
                              <h4 style={{
                                margin: 0,
                                fontSize: '1rem',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {project.name}
                              </h4>
                              <span style={{
                                padding: '2px 8px',
                                background: project.status === 'completed' ? 'rgba(86, 105, 84, 0.2)' :
                                           project.status === 'archived' ? 'rgba(100, 116, 139, 0.2)' :
                                           'rgba(163, 66, 41, 0.2)',
                                color: project.status === 'completed' ? 'var(--studio-sage)' :
                                       project.status === 'archived' ? 'var(--studio-muted)' :
                                       'var(--studio-accent)',
                                borderRadius: '20px',
                                fontSize: '0.65rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                flexShrink: 0
                              }}>
                                {project.status || 'Active'}
                              </span>
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              color: 'var(--studio-muted)',
                              fontSize: '0.8rem'
                            }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <User size={12} />
                                {user?.displayName || 'You'}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} />
                                {formattedDate}
                              </span>
                              {project.agents?.length > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <UsersIcon size={12} />
                                  {project.agents.length} agent{project.agents.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {project.description && (
                              <p style={{
                                margin: '6px 0 0 0',
                                fontSize: '0.8rem',
                                color: 'var(--studio-muted)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {project.description}
                              </p>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              className="btn-icon-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProject(project);
                                setPendingProjectNav(true);
                              }}
                              title="Open Project Summary"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'var(--studio-accent)',
                                border: 'none',
                                color: 'var(--studio-on-accent)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <LayoutGrid size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {projects.length > 5 && (
                      <button
                        className="btn-pill glass"
                        onClick={() => setActiveTab('hub')}
                        style={{ width: '100%', marginTop: '8px' }}
                      >
                        View All {projects.length} Projects <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* Project Insights */}
              <div className="dashboard-card animate-fadeInUp" style={{
                order: 6,
                marginBottom: '24px',
                background: 'var(--studio-surface)',
                borderRadius: '24px',
                padding: '24px',
                border: '1px solid var(--studio-border)'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Activity size={20} className="text-cyan" /> Project Insights
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  {(() => {
                    const active = (projects || []).filter(p => !p.status || p.status === 'active').length;
                    const completed = (projects || []).filter(p => p.status === 'completed').length;
                    const archived = (projects || []).filter(p => p.status === 'archived').length;
                    const withAgents = (projects || []).filter(p => p.agents && p.agents.length > 0).length;
                    return [
                      { label: 'Active', value: active, color: 'var(--studio-accent)', icon: Folder },
                      { label: 'Completed', value: completed, color: 'var(--studio-sage)', icon: CheckCircle },
                      { label: 'Archived', value: archived, color: 'var(--studio-muted)', icon: Clock },
                      { label: 'Multi-Agent', value: withAgents, color: 'var(--studio-sage)', icon: UsersIcon }
                    ];
                  })().map((stat, i) => (
                    <div key={i} style={{
                      padding: '16px', background: 'rgba(var(--studio-ink-rgb),0.03)', borderRadius: '16px',
                      border: '1px solid rgba(var(--studio-ink-rgb),0.06)', textAlign: 'center'
                    }}>
                      <stat.icon size={18} style={{ color: stat.color, marginBottom: '8px' }} />
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--studio-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dashboard-grid" style={{ order: 7 }}>
                {/* Dynamic Project Checklist */}
                <div className="dashboard-card onboarding-card" style={{ border: '1px solid rgba(163, 66, 41, 0.3)', background: 'linear-gradient(145deg, rgba(163, 66, 41, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
                  <div className="card-header">
                    <h3>
                      <Rocket size={18} className="text-purple" />
                      {selectedProject ? `Project Roadmap: ${selectedProject.name}` : 'Studio Setup Checklist'}
                    </h3>
                    <span className="status-badge" style={{ background: 'var(--studio-accent)', color: 'var(--studio-on-accent)' }}>
                      {selectedProject ? 'In Progress' : 'Ready to create'}
                    </span>
                  </div>

                  <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>

                    {selectedProject && activeProjectSteps ? (
                      activeProjectSteps.map((step, i) => (
                        <div key={i} className="checklist-item" style={{
                          padding: '16px',
                          background: 'rgba(var(--studio-ink-rgb),0.03)',
                          borderRadius: '12px',
                          border: '1px solid rgba(var(--studio-ink-rgb),0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => {
                          const agent = (typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.find(a => a.id === step.agentId) : null;
                          if (agent) {
                              if (agent.isPro && !isLoggedIn) {
                                  setShowLoginModal(true);
                                  handleTextToVoice(`Unlock ${agent.name} with a Pro account.`);
                              } else {
                                  setSelectedAgent(agent);
                                  setActiveTab('agents');
                                  handleTextToVoice(`Opening ${agent.name} for project ${selectedProject.name}.`);
                              }
                          }
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--studio-accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(var(--studio-ink-rgb),0.05)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: 'var(--studio-ink)' }}>{i+1}. {step.label}</span>
                            {typeof step.icon === 'function' ? <step.icon size={16} className="text-purple" /> : <Sparkles size={16} className="text-purple" />}
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--studio-muted)' }}>{step.desc}</p>
                          <button className="btn-pill glass" style={{ fontSize: '0.75rem', padding: '4px 12px', marginTop: 'auto' }}>Launch</button>
                        </div>
                      ))
                    ) : (
                      /* Default first-project step */
                      <div className="checklist-item" style={{
                        padding: '16px',
                        background: 'rgba(var(--studio-ink-rgb),0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(var(--studio-ink-rgb),0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: 'var(--studio-ink)' }}>Create your first project</span>
                          <Rocket size={16} className="text-purple" />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--studio-muted)' }}>Start with an idea, a reference, or a release goal.</p>
                        <button className="btn-pill glass" style={{ fontSize: '0.75rem', padding: '4px 12px', marginTop: 'auto' }} onClick={() => setShowProjectTypeChoice(true)}>Create Project</button>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>
          )}

          {dashboardTab === 'agents' && (
            <div className="dashboard-view-agents animate-fadeIn">
              <div className="section-header-simple">
                <h2>Agent Management</h2>
                <p>Show or hide agents from your main grid. Hidden agents are still accessible via search.</p>
              </div>
              <div className="agent-management-list">
                {managedAgents.map((agent, idx) => (
                  <div key={idx} className={`agent-manage-row ${!agent.visible ? 'hidden-agent' : ''}`}>
                    <div className="agent-manage-info">
                      <div className={`agent-mini-icon ${agent.colorClass}`}>
                        {(typeof agent.icon === 'function') ? <agent.icon size={18} /> : <Sparkles size={18} />}
                      </div>
                      <span>{agent.name}</span>
                    </div>
                    <div className="agent-manage-actions">
                      <button
                        className={`toggle-btn ${agent.visible ? 'active' : ''}`}
                        onClick={() => toggleAgentVisibility(agent.name)}
                      >
                        {agent.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        {agent.visible ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboardTab === 'admin' && isAdmin && (
            <Suspense fallback={<div className="loading-spinner">Loading Analytics...</div>}>
              <SectionErrorBoundary name="AdminAnalytics">
                <AdminAnalytics BACKEND_URL={BACKEND_URL} auth={auth} />
              </SectionErrorBoundary>
            </Suspense>
          )}

          {dashboardTab === 'billing' && (
            <div className="dashboard-view-billing animate-fadeIn">
              <div className="section-header-simple">
                <h2>Billing & Wallet</h2>
                <p>Manage your payment methods and subscription plan.</p>
              </div>
              {!WEB_CHECKOUT_ENABLED && (
                <div role="status" style={{ padding: '14px 16px', marginBottom: '1rem', borderRadius: '12px', border: '1px solid rgba(135,98,56,.35)', background: 'rgba(135,98,56,.08)', color: 'var(--studio-warning)' }}>
                  Web billing is not active. Plan and credit-pack checkout remain disabled, and no card will be requested.
                </div>
              )}

              {/* Wallet Balance Card */}
              <div className="wallet-balance-card" style={{
                background: 'linear-gradient(135deg, rgba(135, 98, 56, 0.15), rgba(0, 0, 0, 0.4))',
                border: '1px solid rgba(135, 98, 56, 0.3)',
                padding: '24px',
                borderRadius: '20px',
                marginBottom: '2rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                  <Zap size={120} color="var(--studio-warning)" fill="var(--studio-warning)" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div className="balance-info">
                    <div className="balance-label" style={{ color: 'var(--studio-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Studio Balance</div>
                    <div className="balance-amount" style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--studio-warning)', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      {creditDisplay} {!isAdmin && <span className="currency" style={{ fontSize: '1rem', color: 'var(--studio-muted)', fontWeight: 'normal' }}>Credits</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-pill primary" disabled={isAdmin || !WEB_CHECKOUT_ENABLED} onClick={() => setShowCreditsModal(true)} style={{ boxShadow: 'var(--studio-shadow)', opacity: (!isAdmin && WEB_CHECKOUT_ENABLED) ? 1 : 0.5, cursor: (!isAdmin && WEB_CHECKOUT_ENABLED) ? 'pointer' : 'not-allowed' }}>
                      <Plus size={16} /> Purchase Packs
                    </button>
                  </div>
                </div>
              </div>

              {/* Top-up Packs Direct Access */}
              <div className="topup-packs-section" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={20} color="var(--studio-warning)" /> Buy Credit Packs
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--studio-sage)', background: 'rgba(86, 105, 84, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>Instant Delivery</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  {[
                    { amount: 10, price: '$0.99', desc: 'Single session' },
                    { amount: 50, price: '$3.99', desc: 'Project creator', popular: true },
                    { amount: 150, price: '$9.99', desc: 'Album starter' },
                    { amount: 500, price: '$24.99', desc: 'Label power' }
                  ].map((pack) => (
                    <div
                      key={pack.amount}
                      className={`pricing-mini-card ${pack.popular ? 'popular' : ''}`}
                      onClick={() => WEB_CHECKOUT_ENABLED && buyCreditPack(pack.amount, pack.price)}
                      style={{
                        background: 'var(--glass-bg)',
                        border: pack.popular ? '1px solid #876238' : '1px solid var(--glass-border)',
                        padding: '20px',
                        borderRadius: '16px',
                        textAlign: 'center',
                        cursor: WEB_CHECKOUT_ENABLED ? 'pointer' : 'not-allowed',
                        opacity: WEB_CHECKOUT_ENABLED ? 1 : 0.5,
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}
                    >
                      {pack.popular && (
                        <div style={{
                          position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                          background: 'var(--studio-warning)', color: 'var(--studio-on-accent)', fontSize: '0.65rem', fontWeight: 'bold',
                          padding: '2px 8px', borderRadius: '40px', textTransform: 'uppercase'
                        }}>Best Value</div>
                      )}
                      <div style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--studio-warning)', marginBottom: '4px' }}>{pack.amount}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '4px' }}>{pack.price}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--studio-muted)' }}>{pack.desc}</div>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--studio-muted)', textAlign: 'center' }}>
                  Note: Purchased credits never expire and are used after your monthly plan credits.
                </p>
              </div>

              <div className="payment-methods-container">
                <div className="payment-header">
                  <h3>Secure Billing</h3>
                </div>
                <div className="empty-payments">
                  <CreditCard size={32} />
                  <p>Studio Agents does not collect or store card or bank details in this app.</p>
                  <p className="pm-sub">When billing is available, subscriptions and credits use the secure checkout below.</p>
                </div>
              </div>

              {/* Subscription Plans Section */}
              {/* When running inside a native app (Capacitor), Apple/Google require IAP */}
              {shouldUseNativeIAP() ? (
                <div className="plans-section" style={{ marginTop: '2rem' }}>
                  <div className="payment-header">
                    <h3>Manage Subscription</h3>
                  </div>
                  <div style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: 'rgba(86, 105, 84, 0.05)',
                    border: '1px solid rgba(86, 105, 84, 0.15)',
                    textAlign: 'center',
                    marginTop: '1rem'
                  }}>
                    <p style={{ marginBottom: '16px', opacity: 0.8 }}>
                      Subscriptions are managed through your device&apos;s app store.
                    </p>
                    <button
                      className="plan-button-native primary"
                      onClick={() => {
                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                        if (isIOS) {
                          window.open('https://apps.apple.com/account/subscriptions', '_blank');
                        } else {
                          window.open('https://play.google.com/store/account/subscriptions', '_blank');
                        }
                      }}
                      style={{ padding: '12px 32px' }}
                    >
                      Manage in App Store
                    </button>
                  </div>
                </div>
              ) : (
              <div className="plans-section" style={{ marginTop: '2rem' }}>
                <div className="payment-header">
                  <h3>Available Plans</h3>
                </div>

                <div className="plans-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  {/* Free Plan */}
                  <div className="pricing-card-native">
                    <div className="plan-header-native">
                      <h3 className="plan-name-native">Free</h3>
                      <div className="plan-price-box-native">
                        <span className="plan-price-native">$0</span>
                      </div>
                    </div>
                    <ul className="plan-features-native">
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>Up to 3 agents</span></li>
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>3 uses per agent</span></li>
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>10s audio output</span></li>
                    </ul>
                    <button
                      className="plan-button-native secondary"
                      disabled={true}
                      style={{ opacity: 0.5, cursor: 'default' }}
                    >
                      Current Plan
                    </button>
                  </div>

                  {/* Creator Plan */}
                  <div className="pricing-card-native popular">
                    <div className="popular-badge-native">Most Popular</div>
                    <div className="plan-header-native">
                      <h3 className="plan-name-native">Creator</h3>
                      <div className="plan-price-box-native">
                        <span className="plan-price-native">$4.99</span>
                        <span className="plan-period-native">/mo</span>
                      </div>
                    </div>
                    <ul className="plan-features-native">
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>Up to 5 agents</span></li>
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>100 uses/month</span></li>
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>30s audio output</span></li>
                    </ul>
                    <button
                      className="plan-button-native primary"
                      disabled={!WEB_CHECKOUT_ENABLED}
                      onClick={() => handleSubscribe({ name: 'Creator', price: '$4.99', period: '/month' })}
                    >
                      {WEB_CHECKOUT_ENABLED ? 'Subscribe' : 'Billing Not Active'}
                    </button>
                  </div>

                  {/* Studio Pro Plan */}
                  <div className="pricing-card-native">
                    <div className="plan-header-native">
                      <h3 className="plan-name-native">Studio Pro</h3>
                      <div className="plan-price-box-native">
                        <span className="plan-price-native">$14.99</span>
                        <span className="plan-period-native">/mo</span>
                      </div>
                    </div>
                    <ul className="plan-features-native">
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>All 16 agents</span></li>
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>Unlimited uses</span></li>
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>60s audio output</span></li>
                    </ul>
                    <button
                      className="plan-button-native primary"
                      disabled={!WEB_CHECKOUT_ENABLED}
                      onClick={() => handleSubscribe({ name: 'Studio Pro', price: '$14.99', period: '/month' })}
                    >
                      {WEB_CHECKOUT_ENABLED ? 'Subscribe' : 'Billing Not Active'}
                    </button>
                  </div>

                  {/* LTD Plan */}
                  <div className="pricing-card-native ltd-card">
                    <div className="ltd-badge-native">Limited Time Offer</div>
                    <div className="plan-header-native">
                      <h3 className="plan-name-native">Lifetime</h3>
                      <div className="plan-price-box-native">
                        <span className="plan-price-native">$99</span>
                        <span className="plan-period-native">one-time</span>
                      </div>
                    </div>
                    <ul className="plan-features-native">
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>500 Credits / Month</span></li>
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>All 16 Agents</span></li>
                      <li className="plan-feature-item-native"><div className="feature-check-native"><Zap size={12} /></div><span>Commercial License</span></li>
                    </ul>
                    <button
                      className="plan-button-native primary"
                      disabled={!WEB_CHECKOUT_ENABLED}
                      onClick={() => handleSubscribe({ name: 'Lifetime Access', price: '$99', period: 'one-time' })}
                    >
                      {WEB_CHECKOUT_ENABLED ? 'Get Lifetime' : 'Billing Not Active'}
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {dashboardTab === 'settings' && (
            <div className="dashboard-view-settings animate-fadeIn">
              <div className="section-header-simple">
                <h2>Application Settings</h2>
                <p>Customize your Studio Agents experience.</p>
              </div>

              <div className="settings-list">
                <div className="setting-row">
                  <div className="setting-info">
                    <h4>Show Industry Pulse</h4>
                    <p>Display the latest music industry news in your dashboard.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={appSettings.showNews}
                      onChange={() => toggleAppSetting('showNews')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <h4>Public Activity Wall</h4>
                    <p>Allow your shared creations to be seen by the community.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={appSettings.publicActivity}
                      onChange={() => toggleAppSetting('publicActivity')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <h4>Auto-Save Projects</h4>
                    <p>Automatically save your work to local storage every 5 minutes.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={appSettings.autoSave}
                      onChange={() => toggleAppSetting('autoSave')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <h4>High Quality Previews</h4>
                    <p>Generate higher fidelity audio previews (may take longer).</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={appSettings.highQualityPreviews}
                      onChange={() => toggleAppSetting('highQualityPreviews')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <h4>Streamer Mode</h4>
                    <p>Hide sensitive personal information like email and billing details.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={appSettings.streamerMode}
                      onChange={() => toggleAppSetting('streamerMode')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <h4>Reset Onboarding</h4>
                    <p>View the "Welcome to The Studio" introduction again.</p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      localStorage.removeItem('studio_onboarding_v2');
                      setOnboardingStep(0);
                      setShowOnboarding(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <RefreshCw size={16} />
                     Reset Tour
                  </button>
                </div>

                {/* DATA EXPORT: GDPR/CCPA Requirement */}
                {isLoggedIn && (
                  <div className="setting-row" style={{
                    marginTop: '32px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(86, 105, 84, 0.2)',
                    background: 'rgba(86, 105, 84, 0.03)',
                    padding: '24px',
                    borderRadius: '16px'
                  }}>
                    <div className="setting-info">
                      <h4 style={{ color: 'var(--studio-accent)' }}>Export My Data</h4>
                      <p>Download a copy of all your personal data (profile, projects, generations).</p>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={async () => {
                        try {
                          const token = await auth.currentUser?.getIdToken();
                          if (!token) return;
                          const res = await fetch(`${BACKEND_URL}/api/user/export-data`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (!res.ok) throw new Error('Export failed');
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `studio-agents-data-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (err) {
                          console.error('Data export failed:', err);
                          toast.error('Failed to export data. Please try again.');
                        }
                      }}
                      style={{
                        background: 'rgba(86, 105, 84, 0.1)',
                        border: '1px solid var(--studio-accent)',
                        color: 'var(--studio-accent)',
                        fontWeight: '700',
                        padding: '10px 20px'
                      }}
                    >
                      <Download size={16} />
                       Export Data
                    </button>
                  </div>
                )}

                {/* DANGER ZONE: Account Deletion (App Store Requirement) */}
                {isLoggedIn && (
                  <div className="setting-row danger-zone" style={{
                    marginTop: '32px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(163, 56, 45, 0.2)',
                    background: 'rgba(163, 56, 45, 0.03)',
                    padding: '24px',
                    borderRadius: '16px'
                  }}>
                    <div className="setting-info">
                      <h4 style={{ color: 'var(--color-red)' }}>Delete Account</h4>
                      <p>Permanently remove your profile and all associated data.</p>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={handleDeleteAccount}
                      style={{
                        background: 'rgba(163, 56, 45, 0.1)',
                        border: '1px solid var(--color-red)',
                        color: 'var(--color-red)',
                        fontWeight: '700',
                        padding: '10px 20px'
                      }}
                    >
                      <Trash2 size={16} />
                       Wipe Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DashboardView;
