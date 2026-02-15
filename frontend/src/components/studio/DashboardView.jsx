/* eslint-disable no-use-before-define */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { Suspense } from 'react';
import {
  Sparkles, Zap, Music, PlayCircle, Target, Users as UsersIcon, Rocket, Shield, Globe as GlobeIcon,
  Folder, Plus, Share2, CreditCard, HardDrive, Database as DatabaseIcon, Twitter, Instagram,
  RefreshCw, Trash2, Eye, EyeOff, Landmark, ArrowRight, ChevronRight, X, User, Crown, LayoutGrid,
  TrendingUp, Disc, Activity, Settings, CheckCircle, Check, Lock as LockIcon, Tv, Clock, Cpu,
  Layers, Image as ImageIcon, Mail
} from 'lucide-react';
import { AGENTS, BACKEND_URL } from '../../constants';
import { auth } from '../../firebase';

// Lazy load AdminAnalytics
const AdminAnalytics = React.lazy(() => import('../AdminAnalytics'));

// Section-level Error Boundary for isolating crashes
class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[SectionErrorBoundary] ${this.props.name || 'Section'} crashed:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>Warning</div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>
            {this.props.name || 'Section'} temporarily unavailable
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            This section encountered an issue. Click below to reload it.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DashboardView = ({
  // State
  dashboardTab,
  setDashboardTab,
  managedAgents,
  appSettings,
  paymentMethods,
  bankAccounts,
  storageConnections,
  setStorageConnections,
  socialConnections,
  performanceStats,
  adminStats,
  adminApiStatus,
  isAdminLoading,
  adminError,
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
  setShowAddPaymentModal,
  setEditingPayment,
  setPaymentType,
  // Data
  freeGenerationsUsed,
  FREE_GENERATION_LIMIT,
  twitterUsername,
  metaName,
  activeProjectSteps,
  // Functions
  toggleAppSetting,
  handleDeleteAccount,
  toggleAgentVisibility,
  handleConnectSocial,
  buyCreditPack,
  fetchAdminData,
  handleDeletePayment,
  handleSubscribe,
  handleTextToVoice
}) => {
  return (
    <div className="studio-dashboard animate-fadeInUp">
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
                  backgroundColor: systemStatus.status === 'healthy' ? 'var(--color-emerald)' : 'var(--color-red)',
                  boxShadow: systemStatus.status === 'healthy' ? '0 0 8px var(--color-emerald)' : '0 0 8px var(--color-red)'
                }}
              />
            </div>
          </div>
          <nav className="sidebar-nav">
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
                style={{ color: 'var(--color-emerald)' }}
              >
                <Activity size={18} /> Admin Analytics
              </button>
            )}
          </nav>

          {isLoggedIn && (
            <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--glass-border)' }}>
              <div style={{
                background: 'rgba(250, 204, 21, 0.05)',
                border: '1px solid rgba(250, 204, 21, 0.1)',
                borderRadius: '12px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Credits</span>
                  <span style={{ fontSize: '0.875rem', color: '#facc15', fontWeight: '800' }}>{userCredits}</span>
                </div>
                <button
                  onClick={() => setShowCreditsModal(true)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    background: '#eab308',
                    color: '#000',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
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
            <div className="dashboard-view-overview animate-fadeIn">
              {/* AI Production Pipeline — Launch Orchestrator CTA */}
              <div 
                onClick={() => setShowOrchestrator(true)}
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(236, 72, 153, 0.08) 100%)',
                  borderRadius: '20px',
                  padding: '28px 32px',
                  marginBottom: '24px',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                  e.currentTarget.style.boxShadow = '0 8px 40px rgba(168, 85, 247, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.25)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '14px',
                      background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(168, 85, 247, 0.4)'
                    }}>
                      <Zap size={26} color="white" />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>
                        AI Production Pipeline
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        1 idea → lyrics, beats, vocals, artwork & video — all AI-generated
                      </p>
                    </div>
                  </div>
                  <div style={{
                    padding: '10px 24px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                    color: 'white', fontSize: '0.9rem', fontWeight: '700',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)'
                  }}>
                    <Rocket size={16} /> Launch Orchestrator
                  </div>
                </div>
              </div>

              {/* Artist Profile & Command Center */}
              <div className="artist-profile-header animate-fadeIn" style={{
                background: 'linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%)',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div className="profile-avatar-wrapper" style={{ position: 'relative' }}>
                      <div className="profile-avatar" style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                        padding: '3px',
                        boxShadow: '0 8px 16px rgba(168, 85, 247, 0.4)'
                      }}>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background: 'var(--color-bg-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" loading="lazy" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                          ) : (
                            <User size={48} color="var(--text-secondary)" />
                          )}
                        </div>
                      </div>
                      {isLoggedIn && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          background: 'var(--color-emerald)',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '4px solid var(--color-bg-secondary)',
                          boxShadow: '0 0 10px var(--color-emerald)'
                        }} title="Online" />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: '800', letterSpacing: '-0.5px' }}>{user?.displayName || 'Guest Creator'}</h1>
                        <span className="pro-badge" style={{
                          background: 'linear-gradient(90deg, #facc15, #f59e0b)',
                          color: '#000',
                          fontWeight: '800',
                          fontSize: '0.7rem',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          textTransform: 'uppercase'
                        }}>
                          {userPlan || 'Artist'} Tier
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    <div className="vital-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                      <Folder size={18} color="var(--color-cyan)" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>{(projects || []).length}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Projects</div>
                    </div>
                    <div className="vital-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                      <Zap size={18} color="#facc15" fill="#facc15" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#facc15' }}>{userCredits}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Avail. Credits</div>
                    </div>
                    <div className="vital-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                      <UsersIcon size={18} color="var(--color-purple)" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-purple)' }}>{(managedAgents || []).filter(a => a.visible).length}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Agents</div>
                    </div>
                  </div>
                </div>

                {/* Quick Session Indicator */}
                {selectedProject && (
                  <div style={{
                    marginTop: '24px',
                    background: 'rgba(6, 182, 212, 0.05)',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px dashed rgba(6, 182, 212, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-cyan)', fontSize: '0.9rem' }}>
                      <div className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-cyan)' }} />
                      <span>Active Session: <strong>{selectedProject.name}</strong></span>
                    </div>
                    <button className="text-button" onClick={() => setActiveTab('hub')} style={{ fontSize: '0.8rem', color: 'var(--color-cyan)', fontWeight: '600' }}>
                      Switch Project <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Feature Utilization & Smart Insights */}
              <div className="dashboard-grid-two-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <div className="dashboard-card usage-insights-card" style={{ background: 'var(--color-bg-secondary)', borderRadius: '24px', padding: '20px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Activity size={20} className="text-purple" /> Studio Utilization
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>This Month</span>
                  </div>

                  <div className="usage-stat-group" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="usage-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>AI Generations</span>
                        <span>{isLoggedIn ? 'Unlimited' : `${freeGenerationsUsed}/${FREE_GENERATION_LIMIT}`}</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: isLoggedIn ? '85%' : `${(freeGenerationsUsed/FREE_GENERATION_LIMIT)*100}%`,
                          height: '100%',
                          background: 'var(--color-purple)',
                          boxShadow: '0 0 10px var(--color-purple)'
                        }} />
                      </div>
                    </div>

                    <div className="usage-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Cloud Storage</span>
                        <span>{Math.round(projects.length * 1.2)}MB / 500MB</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${(projects.length * 1.2 / 500) * 100}%`,
                          height: '100%',
                          background: 'var(--color-cyan)',
                          boxShadow: '0 0 10px var(--color-cyan)'
                        }} />
                      </div>
                    </div>

                    <div className="usage-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Agent Slots</span>
                        <span>{(managedAgents || []).filter(a => a.visible).length} / 16 Used</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${((managedAgents || []).filter(a => a.visible).length / 16) * 100}%`,
                          height: '100%',
                          background: 'var(--color-pink)',
                          boxShadow: '0 0 10px var(--color-pink)'
                        }} />
                      </div>
                    </div>

                    {/* Plan Features Checklist */}
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px'
                    }}>
                      {[
                        { name: '4K Rendering', active: (userPlan || '').toLowerCase() !== 'free' },
                        { name: 'Stem Export', active: (userPlan || '').toLowerCase() !== 'free' },
                        { name: 'Commercial Rights', active: (userPlan || '').toLowerCase() === 'pro' || (userPlan || '').toLowerCase() === 'lifetime' },
                        { name: 'Priority API', active: (userPlan || '').toLowerCase() === 'pro' || (userPlan || '').toLowerCase() === 'lifetime' }
                      ].map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: feat.active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {feat.active ? <Check size={10} color="var(--color-emerald)" /> : <LockIcon size={10} />}
                          <span>{feat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="dashboard-card platform-integration-card" style={{ background: 'var(--color-bg-secondary)', borderRadius: '24px', padding: '20px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <GlobeIcon size={20} className="text-cyan" /> Cloud Integrations
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                      {Object.values(socialConnections || {}).filter(Boolean).length} Linked
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { name: 'X / Twitter', icon: Twitter, connected: socialConnections.twitter },
                      { name: 'Instagram', icon: Instagram, connected: socialConnections.instagram },
                      { name: 'Spotify', icon: Music, connected: false },
                      { name: 'YouTube', icon: Tv, connected: false }
                    ].map((platform, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.02)',
                        padding: '12px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <platform.icon size={18} color={platform.connected ? 'var(--text-primary)' : 'var(--text-secondary)'} />
                          <span style={{ fontSize: '0.85rem', color: platform.connected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{platform.name}</span>
                        </div>
                        {platform.connected ? (
                          <CheckCircle size={14} color="var(--color-emerald)" />
                        ) : (
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setDashboardTab('settings')}
                    style={{ width: '100%', marginTop: '16px', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--color-purple)' }}
                  >
                    Manage All Connections <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Audience Insights (Advanced) */}
              <div className="audience-overview" style={{ marginBottom: '24px' }}>
                {[
                  { label: 'Monthly Listeners', value: (performanceStats?.listeners || 0).toLocaleString(), icon: UsersIcon, color: 'var(--color-blue)', trend: performanceStats?.growth },
                  { label: 'Total Streams', value: (performanceStats?.streams || 0).toLocaleString(), icon: PlayCircle, color: 'var(--color-emerald)', trend: performanceStats?.streamTrend },
                  { label: 'Followers', value: (performanceStats?.followers || 0).toLocaleString(), icon: Crown, color: 'var(--color-purple)', trend: '+2.3%' },
                  { label: 'Engagement Rate', value: performanceStats?.engagement || '0%', icon: TrendingUp, color: 'var(--color-cyan)', trend: '+0.8%' }
                ].map((stat, i) => (
                  <div key={i} className="audience-stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="audience-stat-icon" style={{
                        background: `${stat.color}15`,
                        color: stat.color,
                        minWidth: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <stat.icon size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'monospace' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '0.7rem', color: 'var(--color-emerald)', fontWeight: 'bold' }}>
                      {stat.trend}
                    </div>
                  </div>
                ))}
              </div>

              {/* Profile Completion Pulse (Optional) */}
              {!userProfile.stageName && (
                <div className="profile-nudge-card animate-fadeInUp" style={{
                  background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.05) 100%)',
                  border: '1px solid var(--color-purple)',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'var(--color-purple)', padding: '10px', borderRadius: '50%', color: 'white' }}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Complete Your Creator Profile</h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Set your stage name and genre to get personalized AI results.</p>
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
                marginBottom: '24px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '24px',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                  <Zap size={120} color="var(--color-purple)" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', padding: '10px', borderRadius: '12px', color: 'white' }}>
                        <Zap size={24} />
                      </div>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>AI Production Pipeline</h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>
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
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-purple)' }}>4</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Agents</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-cyan)' }}>1-Click</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Workflow</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow Onboarding Card */}
              <div className="dashboard-card workflow-card" style={{ marginBottom: '24px', background: 'var(--color-bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div className="card-header">
                  <h3><Sparkles size={18} className="text-cyan" /> Studio Workflow</h3>
                </div>
                <div className="workflow-steps-mini" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  {[
                    {
                      step: 1,
                      title: "Define Your Vision",
                      desc: "Use the Project Wizard to name your masterpiece and select your studio vibe.",
                      icon: Sparkles,
                      color: "var(--color-cyan)"
                    },
                    {
                      step: 2,
                      title: "Assemble Your Team",
                      desc: "Choose from 16 specialized AI agents for lyrics, beats, and production.",
                      icon: UsersIcon,
                      color: "var(--color-purple)"
                    },
                    {
                      step: 3,
                      title: "Launch & Amplify",
                      desc: "Use Marketing agents to build your rollout plan and sync socials.",
                      icon: Rocket,
                      color: "var(--color-pink)"
                    }
                  ].map((item, i) => (
                    <div key={i} className="workflow-step-item" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div className="step-number" style={{
                        minWidth: '24px', height: '24px', borderRadius: '50%',
                        background: item.color, color: 'black', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem'
                      }}>
                        {item.step}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>{item.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="workflow-actions" style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                  <button className="btn-pill primary" onClick={() => setShowProjectTypeChoice(true)}>
                    <Plus size={14} /> New Project
                  </button>
                  <button className="btn-pill glass" onClick={() => setActiveTab('hub')}>
                    <Folder size={14} /> Open Existing
                  </button>
                </div>
              </div>

              {/* Recent Projects Section */}
              <section className="dashboard-card recent-projects-card" style={{ marginBottom: '24px' }}>
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
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    marginTop: '16px'
                  }}>
                    <Folder size={40} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Projects Yet</h4>
                    <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
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
                            background: selectedProject?.id === project.id ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.02)',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            border: selectedProject?.id === project.id ? '1px solid var(--color-purple)' : '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-purple)'}
                          onMouseLeave={(e) => { if (selectedProject?.id !== project.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                        >
                          {/* Project Thumbnail/Icon */}
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '10px',
                            background: project.category === 'music' ? 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-pink) 100%)' :
                                        project.category === 'visual' ? 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-blue) 100%)' :
                                        project.category === 'marketing' ? 'linear-gradient(135deg, var(--color-orange) 0%, var(--color-red) 100%)' :
                                        'linear-gradient(135deg, var(--color-emerald) 0%, var(--color-cyan) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
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
                                background: project.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' :
                                           project.status === 'archived' ? 'rgba(100, 116, 139, 0.2)' :
                                           'rgba(168, 85, 247, 0.2)',
                                color: project.status === 'completed' ? 'var(--color-emerald)' :
                                       project.status === 'archived' ? 'var(--text-secondary)' :
                                       'var(--color-purple)',
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
                              color: 'var(--text-secondary)',
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
                                color: 'var(--text-secondary)',
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
                                background: 'var(--color-purple)',
                                border: 'none',
                                color: 'white',
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

              {/* Brand Strategy Section */}
              <section className="dashboard-card brand-strategy-card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                  <h3><Target size={18} /> Build Your Legacy</h3>
                  <Zap size={18} className="text-yellow-400" />
                </div>
                <div className="strategy-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div className="strategy-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--color-purple)' }}>Output</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Don't just make music, build a brand.</p>
                  </div>
                  <div className="strategy-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--color-cyan)' }}>Hit Ready</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Production quality that stands out.</p>
                  </div>
                  <div className="strategy-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--color-pink)' }}>Viral Videos</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Visuals designed for social impact.</p>
                  </div>
                  <div className="strategy-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--color-orange)' }}>Marketing</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Content strategy that converts.</p>
                  </div>
                </div>
              </section>

              <div className="dashboard-grid">
                {/* Dynamic Project Checklist */}
                <div className="dashboard-card onboarding-card" style={{ border: '1px solid rgba(168, 85, 247, 0.3)', background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
                  <div className="card-header">
                    <h3>
                      <Rocket size={18} className="text-purple" />
                      {selectedProject ? `Project Roadmap: ${selectedProject.name}` : 'Studio Setup Checklist'}
                    </h3>
                    <span className="status-badge" style={{ background: 'var(--color-purple)', color: 'white' }}>
                      {selectedProject ? 'In Progress' : `${(paymentMethods.length > 0) ? 1 : 0} / 1 Complete`}
                    </span>
                  </div>

                  <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>

                    {selectedProject && activeProjectSteps ? (
                      activeProjectSteps.map((step, i) => (
                        <div key={i} className="checklist-item" style={{
                          padding: '16px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.05)',
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
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-purple)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{i+1}. {step.label}</span>
                            {typeof step.icon === 'function' ? <step.icon size={16} className="text-purple" /> : <Sparkles size={16} className="text-purple" />}
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{step.desc}</p>
                          <button className="btn-pill glass" style={{ fontSize: '0.75rem', padding: '4px 12px', marginTop: 'auto' }}>Launch</button>
                        </div>
                      ))
                    ) : (
                      /* Default Wallet Setup Step */
                      <div className={`checklist-item ${paymentMethods.length > 0 ? 'completed' : ''}`} style={{
                        padding: '16px',
                        background: paymentMethods.length > 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: paymentMethods.length > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: paymentMethods.length > 0 ? 'var(--color-emerald)' : 'var(--text-primary)' }}>Setup Wallet</span>
                          {paymentMethods.length > 0 ? <CheckCircle size={16} className="text-emerald" /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--text-secondary)' }}></div>}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Add payment method.</p>
                        {!paymentMethods.length && <button className="btn-pill glass" style={{ fontSize: '0.75rem', padding: '4px 12px', marginTop: 'auto' }} onClick={() => setDashboardTab('billing')}>Add Card</button>}
                      </div>
                    )}

                  </div>
                </div>

                {/* Social Connections */}
                <section className="dashboard-card">
                  <div className="card-header">
                    <h3><Share2 size={18} /> Social Ecosystem</h3>
                    <span className="status-badge online">Live</span>
                  </div>
                  <div className="connection-list">
                    <div className="connection-item">
                      <div className="connection-info">
                        <div className="icon-box twitter-bg">
                          <Twitter size={20} />
                        </div>
                        <div>
                          <p className="connection-name">X (Twitter)</p>
                          <p className="connection-status">{socialConnections.twitter ? `@${twitterUsername || 'Connected'}` : 'Not Connected'}</p>
                        </div>
                      </div>
                      <button
                        className={`btn-connect ${socialConnections.twitter ? 'connected' : ''}`}
                        onClick={() => handleConnectSocial('twitter')}
                      >
                        {socialConnections.twitter ? 'Manage' : 'Connect'}
                      </button>
                    </div>
                    <div className="connection-item">
                      <div className="connection-info">
                        <div className="icon-box instagram-bg">
                          <Instagram size={20} />
                        </div>
                        <div>
                          <p className="connection-name">Instagram</p>
                          <p className="connection-status">{socialConnections.instagram ? (metaName || 'Connected') : 'Not Connected'}</p>
                        </div>
                      </div>
                      <button
                        className={`btn-connect ${socialConnections.instagram ? 'connected' : ''}`}
                        onClick={() => handleConnectSocial('instagram')}
                      >
                        {socialConnections.instagram ? 'Manage' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Storage Connections */}
                <section className="dashboard-card">
                  <div className="card-header">
                    <h3><DatabaseIcon size={18} /> Cloud Storage</h3>
                    <span className="storage-usage">72% Full</span>
                  </div>
                  <div className="connection-list">
                    <div className="connection-item">
                      <div className="connection-info">
                        <div className="icon-box storage-bg">
                          <HardDrive size={20} />
                        </div>
                        <div>
                          <p className="connection-name">Google Drive</p>
                          <p className="connection-status">{storageConnections.googleDrive ? 'Connected' : 'Disconnected'}</p>
                        </div>
                      </div>
                      <button
                        className={`btn-connect ${storageConnections.googleDrive ? 'connected' : ''}`}
                        onClick={() => setStorageConnections(prev => ({ ...prev, googleDrive: !prev.googleDrive }))}
                      >
                        {storageConnections.googleDrive ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </section>
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

              {/* Wallet Balance Card */}
              <div className="wallet-balance-card" style={{
                background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.15), rgba(0, 0, 0, 0.4))',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                padding: '24px',
                borderRadius: '20px',
                marginBottom: '2rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                  <Zap size={120} color="#facc15" fill="#facc15" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div className="balance-info">
                    <div className="balance-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Studio Balance</div>
                    <div className="balance-amount" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#facc15', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      {userCredits} <span className="currency" style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Credits</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-pill primary" onClick={() => setShowCreditsModal(true)} style={{ boxShadow: '0 4px 15px rgba(250, 204, 21, 0.3)' }}>
                      <Plus size={16} /> Purchase Packs
                    </button>
                  </div>
                </div>
              </div>

              {/* Top-up Packs Direct Access */}
              <div className="topup-packs-section" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={20} color="#facc15" /> Buy Credit Packs
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>Instant Delivery</span>
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
                      onClick={() => buyCreditPack(pack.amount, pack.price)}
                      style={{
                        background: 'var(--glass-bg)',
                        border: pack.popular ? '1px solid #facc15' : '1px solid var(--glass-border)',
                        padding: '20px',
                        borderRadius: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}
                    >
                      {pack.popular && (
                        <div style={{
                          position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                          background: '#facc15', color: '#000', fontSize: '0.65rem', fontWeight: 'bold',
                          padding: '2px 8px', borderRadius: '40px', textTransform: 'uppercase'
                        }}>Best Value</div>
                      )}
                      <div style={{ fontWeight: '800', fontSize: '1.5rem', color: '#facc15', marginBottom: '4px' }}>{pack.amount}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '4px' }}>{pack.price}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{pack.desc}</div>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Note: Purchased credits never expire and are used after your monthly plan credits.
                </p>
              </div>

              <div className="payment-methods-container">
                <div className="payment-header">
                  <h3>Saved Payment Methods</h3>
                  <button className="add-payment-btn" onClick={() => setShowAddPaymentModal(true)}>
                    <Plus size={16} /> Add New
                  </button>
                </div>

                {paymentMethods.length === 0 && bankAccounts.length === 0 ? (
                  <div className="empty-payments">
                    <CreditCard size={32} />
                    <p>No payment methods saved yet.</p>
                  </div>
                ) : (
                  <div className="payment-list">
                    {paymentMethods.map(method => (
                      <div key={method.id} className="payment-method-card">
                        <div className="pm-icon">
                          <CreditCard size={20} />
                        </div>
                        <div className="pm-details">
                          <p className="pm-name">{method.type} ending in {method.last4}</p>
                          <p className="pm-sub">Expires {method.expiry}</p>
                        </div>
                        <div className="pm-actions">
                          <button onClick={() => { setEditingPayment(method); setPaymentType('card'); setShowAddPaymentModal(true); }}>Edit</button>
                          <button className="delete" onClick={() => handleDeletePayment(method.id, 'card')}>Remove</button>
                        </div>
                      </div>
                    ))}
                    {bankAccounts.map(bank => (
                      <div key={bank.id} className="payment-method-card">
                        <div className="pm-icon">
                          <Landmark size={20} />
                        </div>
                        <div className="pm-details">
                          <p className="pm-name">{bank.bankName}</p>
                          <p className="pm-sub">****{bank.last4}</p>
                        </div>
                        <div className="pm-actions">
                          <button onClick={() => { setEditingPayment(bank); setPaymentType('bank'); setShowAddPaymentModal(true); }}>Edit</button>
                          <button className="delete" onClick={() => handleDeletePayment(bank.id, 'bank')}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subscription Plans Section */}
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
                      onClick={() => handleSubscribe({ name: 'Creator', price: '$4.99', period: '/month' })}
                    >
                      Subscribe
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
                      onClick={() => handleSubscribe({ name: 'Studio Pro', price: '$14.99', period: '/month' })}
                    >
                      Subscribe
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
                      onClick={() => handleSubscribe({ name: 'Lifetime Access', price: '$99', period: 'one-time' })}
                    >
                      Get Lifetime
                    </button>
                  </div>
                </div>
              </div>
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

                {/* DANGER ZONE: Account Deletion (App Store Requirement) */}
                {isLoggedIn && (
                  <div className="setting-row danger-zone" style={{
                    marginTop: '32px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                    background: 'rgba(239, 68, 68, 0.03)',
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
                        background: 'rgba(239, 68, 68, 0.1)',
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

          {dashboardTab === 'admin' && isAdmin && (
            <div className="dashboard-view-admin animate-fadeIn">
              <div className="section-header-simple" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Activity size={24} className="text-emerald" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Platform Analytics</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time monitoring of users, revenue, and system health.</p>
                  </div>
                </div>
                <button
                  className="btn-pill glass"
                  onClick={fetchAdminData}
                  disabled={isAdminLoading}
                  style={{ padding: '10px 20px' }}
                >
                  <RefreshCw size={14} className={isAdminLoading ? 'spin' : ''} />
                  {isAdminLoading ? 'Refreshing Intelligence...' : 'Refresh Snapshot'}
                </button>
              </div>

              {adminError && (
                <div className="admin-error-alert" style={{
                  padding: '16px', background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-red)', borderRadius: '12px', color: 'var(--color-red)',
                  marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <X size={20} />
                  <p>{adminError}</p>
                </div>
              )}

              {!adminStats && isAdminLoading ? (
                <div className="admin-loading-state" style={{
                  padding: '80px 40px', textAlign: 'center', background: 'var(--color-bg-secondary)',
                  borderRadius: '32px', border: '1px solid var(--border-color)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <div className="spinner-large" style={{
                    width: '40px', height: '40px', border: '3px solid rgba(16, 185, 129, 0.1)',
                    borderTopColor: 'var(--color-emerald)', borderRadius: '50%',
                    animation: 'spin 1s linear infinite', marginBottom: '24px'
                  }}></div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Decrypting Platform State...</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '300px' }}>Fetching latest user distribution, API health, and credit circulation metrics.</p>
                </div>
              ) : adminStats ? (
                <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                  {/* KPI Overview Cards */}
                  <div className="admin-card stats-overview" style={{
                    gridColumn: '1 / -1', display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px'
                  }}>
                    <div className="kpi-card" style={{
                      background: 'linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%)',
                      padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Platform Creators</span>
                      <div style={{ fontSize: '2.8rem', fontWeight: '900', marginTop: '12px', letterSpacing: '-1px' }}>{adminStats.users?.total || 0}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-emerald)', fontSize: '0.85rem', marginTop: '8px', fontWeight: '600' }}>
                        <UsersIcon size={14} /> Registered Accounts
                      </div>
                    </div>

                    <div className="kpi-card" style={{
                      background: 'linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%)',
                      padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Conversion Rate</span>
                      <div style={{ fontSize: '2.8rem', fontWeight: '900', marginTop: '12px', color: 'var(--color-purple)', letterSpacing: '-1px' }}>
                        {adminStats.users?.total > 0 ? Math.round(((adminStats.users?.paid || 0) / adminStats.users.total) * 100) : 0}%
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-purple)', fontSize: '0.85rem', marginTop: '8px', fontWeight: '600' }}>
                        <TrendingUp size={14} /> {adminStats.users?.paid || 0} Paid Producers
                      </div>
                    </div>

                    <div className="kpi-card" style={{
                      background: 'linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%)',
                      padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Token Circulation</span>
                      <div style={{ fontSize: '2.8rem', fontWeight: '900', marginTop: '12px', color: '#facc15', letterSpacing: '-1px' }}>
                        {(adminStats.credits?.totalInCirculation || 0).toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontSize: '0.85rem', marginTop: '8px', fontWeight: '600' }}>
                        <Zap size={14} fill="#facc15" /> Ecosystem Volume
                      </div>
                    </div>
                  </div>

                  {/* Tier Distribution */}
                  <div className="admin-card" style={{
                    background: 'var(--color-bg-secondary)', padding: '28px', borderRadius: '28px',
                    border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                  }}>
                    <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Layers size={20} className="text-cyan" /> User Segment Distribution
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {Object.entries(adminStats.users?.byTier || {}).map(([tier, count]) => (
                        <div key={tier}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                            <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', opacity: 0.8 }}>{tier}</span>
                            <span style={{ fontWeight: '800' }}>{count} <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>({Math.round((count / (adminStats.users?.total || 1)) * 100)}%)</span></span>
                          </div>
                          <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${(count / (adminStats.users?.total || 1)) * 100}%`,
                              height: '100%',
                              borderRadius: '5px',
                              background: tier === 'free' ? 'rgba(255,255,255,0.2)' :
                                         tier === 'creator' ? 'var(--color-cyan)' :
                                         tier === 'pro' ? 'var(--color-purple)' : '#facc15',
                              boxShadow: tier !== 'free' ? '0 0 10px currentColor' : 'none'
                            }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* API Health monitoring */}
                  <div className="admin-card" style={{
                    background: 'var(--color-bg-secondary)', padding: '28px', borderRadius: '28px',
                    border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Cpu size={20} className="text-emerald" /> API Health Monitor
                      </h3>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '12px', fontWeight: '700' }}>
                        LIVE STATUS
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {adminApiStatus && Object.entries(adminApiStatus).map(([key, value]) => {
                        if (typeof value !== 'boolean' && key !== 'uberduckKeyLength' && key !== 'replicateKeyLength') return null;
                        if (key.includes('Length')) return null; // Skip lengths in main grid

                        return (
                          <div key={key} style={{
                            padding: '14px', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px',
                            display: 'flex', flexDirection: 'column', gap: '8px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', opacity: 0.6 }}>{key}</span>
                              <div style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                background: value ? 'var(--color-emerald)' : 'var(--color-red)',
                                boxShadow: value ? '0 0 10px var(--color-emerald)' : '0 0 10px var(--color-red)'
                              }}></div>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{value ? 'Operational' : 'Missing Key'}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Shield size={12} /> Auto-pinging endpoints every 60s.
                    </p>
                  </div>

                  {/* System Log / Security Snapshot */}
                  <div className="admin-card" style={{
                    background: 'var(--color-bg-secondary)', padding: '28px', borderRadius: '28px',
                    border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                  }}>
                    <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Shield size={20} className="text-purple" /> System & Governance
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered Admins</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{adminStats.admins?.length || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Demo/Press Accounts</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{adminStats.demoAccounts?.length || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avg Credits / User</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{adminStats.credits?.averagePerUser || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Report Generated</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-cyan)' }}>{adminStats.timestamp ? new Date(adminStats.timestamp).toLocaleTimeString() : 'N/A'}</span>
                      </div>
                    </div>

                    <div style={{
                      marginTop: '20px', padding: '14px', background: 'rgba(168, 85, 247, 0.08)',
                      borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.2)',
                      display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                      <div style={{ width: '8px', height: '8px', background: 'var(--color-purple)', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-purple)', fontWeight: '600' }}>
                        Security Patch v2.4 Active. All data encrypted at rest.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                   <Activity size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                   <h3 style={{ margin: '0 0 8px 0' }}>No Data Available</h3>
                   <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>Click the refresh button to initialize platform monitoring.</p>
                   <button className="btn-pill primary" onClick={fetchAdminData}>Initialize Analytics</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
