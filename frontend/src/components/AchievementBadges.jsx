import React, { useState, useEffect, useCallback } from 'react';
import { 
  Award, Music, Mic, Video, Image, FileText, Zap, Star, Crown, 
  Trophy, Flame, Sparkles, Target, Heart, Disc, Film, Globe, 
  TrendingUp, Users, Rocket, Lock, Check, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT BADGES — Gamification system for Studio Agents
// Tracks user milestones, awards badges, persists to Firestore
// ═══════════════════════════════════════════════════════════════════════════════

// Badge definitions organized by category
export const BADGE_DEFINITIONS = {
  // === FIRST CREATION BADGES ===
  first_lyrics: {
    id: 'first_lyrics',
    name: 'Wordsmith',
    description: 'Write your first lyrics',
    icon: FileText,
    color: '#a855f7',
    category: 'First Steps',
    trigger: 'generation',
    agentId: 'ghost',
    threshold: 1,
  },
  first_beat: {
    id: 'first_beat',
    name: 'Beat Maker',
    description: 'Generate your first beat',
    icon: Music,
    color: '#22d3ee',
    category: 'First Steps',
    trigger: 'generation',
    agentId: 'beat',
    threshold: 1,
  },
  first_vocal: {
    id: 'first_vocal',
    name: 'Voice Activated',
    description: 'Create your first vocal track',
    icon: Mic,
    color: '#f472b6',
    category: 'First Steps',
    trigger: 'generation',
    agentId: 'vocal-arch',
    threshold: 1,
  },
  first_image: {
    id: 'first_image',
    name: 'Visual Artist',
    description: 'Generate your first album art',
    icon: Image,
    color: '#fb923c',
    category: 'First Steps',
    trigger: 'generation',
    agentId: 'album',
    threshold: 1,
  },
  first_video: {
    id: 'first_video',
    name: 'Director\'s Cut',
    description: 'Create your first video',
    icon: Video,
    color: '#ef4444',
    category: 'First Steps',
    trigger: 'generation',
    agentId: 'video-creator',
    threshold: 1,
  },
  first_mix: {
    id: 'first_mix',
    name: 'Mix Master',
    description: 'Create your first final mix',
    icon: Disc,
    color: '#34d399',
    category: 'First Steps',
    trigger: 'mix',
    threshold: 1,
  },

  // === MILESTONE BADGES ===
  ten_generations: {
    id: 'ten_generations',
    name: 'Getting Warmed Up',
    description: 'Complete 10 generations',
    icon: Flame,
    color: '#f97316',
    category: 'Milestones',
    trigger: 'total_generations',
    threshold: 10,
  },
  fifty_generations: {
    id: 'fifty_generations',
    name: 'On a Roll',
    description: 'Complete 50 generations',
    icon: Zap,
    color: '#eab308',
    category: 'Milestones',
    trigger: 'total_generations',
    threshold: 50,
  },
  hundred_generations: {
    id: 'hundred_generations',
    name: 'Century Club',
    description: 'Complete 100 generations',
    icon: Trophy,
    color: '#f59e0b',
    category: 'Milestones',
    trigger: 'total_generations',
    threshold: 100,
  },

  // === VERSATILITY BADGES ===
  multi_agent: {
    id: 'multi_agent',
    name: 'Multi-Talented',
    description: 'Use 4 different agents',
    icon: Star,
    color: '#8b5cf6',
    category: 'Versatility',
    trigger: 'unique_agents',
    threshold: 4,
  },
  agent_explorer: {
    id: 'agent_explorer',
    name: 'Agent Explorer',
    description: 'Use 8 different agents',
    icon: Target,
    color: '#06b6d4',
    category: 'Versatility',
    trigger: 'unique_agents',
    threshold: 8,
  },
  master_of_all: {
    id: 'master_of_all',
    name: 'Master of All',
    description: 'Use all 16 agents',
    icon: Crown,
    color: '#f59e0b',
    category: 'Versatility',
    trigger: 'unique_agents',
    threshold: 16,
  },

  // === FULL PIPELINE BADGES ===
  full_song: {
    id: 'full_song',
    name: 'Full Song',
    description: 'Create lyrics + beat + vocals in one session',
    icon: Rocket,
    color: '#10b981',
    category: 'Pipeline',
    trigger: 'pipeline',
    requires: ['ghost', 'beat', 'vocal-arch'],
  },
  music_video: {
    id: 'music_video',
    name: 'Music Video',
    description: 'Create a complete music video with custom art',
    icon: Film,
    color: '#ec4899',
    category: 'Pipeline',
    trigger: 'pipeline',
    requires: ['beat', 'album', 'video-creator'],
  },
  hit_maker: {
    id: 'hit_maker',
    name: 'Hit Maker',
    description: 'Use lyrics + beat + vocals + mix + master',
    icon: TrendingUp,
    color: '#f43f5e',
    category: 'Pipeline',
    trigger: 'pipeline',
    requires: ['ghost', 'beat', 'vocal-arch', 'master'],
  },

  // === SPECIAL BADGES ===
  first_project: {
    id: 'first_project',
    name: 'Project Started',
    description: 'Save your first project',
    icon: Heart,
    color: '#ef4444',
    category: 'Special',
    trigger: 'project_save',
    threshold: 1,
  },
  tour_complete: {
    id: 'tour_complete',
    name: 'Tour Graduate',
    description: 'Complete the guided tour',
    icon: Globe,
    color: '#22c55e',
    category: 'Special',
    trigger: 'tour_complete',
    threshold: 1,
  },
  social_connector: {
    id: 'social_connector',
    name: 'Connected',
    description: 'Use a social/collab agent',
    icon: Users,
    color: '#6366f1',
    category: 'Special',
    trigger: 'generation',
    agentId: 'collab',
    threshold: 1,
  },
};

// Helper: get all badges as array
export const getAllBadges = () => Object.values(BADGE_DEFINITIONS);

// Helper: get badges by category
export const getBadgesByCategory = () => {
  const categories = {};
  getAllBadges().forEach(badge => {
    if (!categories[badge.category]) categories[badge.category] = [];
    categories[badge.category].push(badge);
  });
  return categories;
};

// ─── Badge Tracker Hook ───────────────────────────────────────────────────────
// Tracks user progress and awards badges. Persists to localStorage + Firestore.

export function useBadgeTracker(userId) {
  const [earnedBadges, setEarnedBadges] = useState(() => {
    try {
      const stored = localStorage.getItem(`studio_badges_${userId || 'guest'}`);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const [stats, setStats] = useState(() => {
    try {
      const stored = localStorage.getItem(`studio_badge_stats_${userId || 'guest'}`);
      return stored ? JSON.parse(stored) : { 
        totalGenerations: 0, 
        uniqueAgents: [], 
        agentCounts: {},
        pipelineAgents: [],
        projectsSaved: 0,
        tourCompleted: false,
        mixesCreated: 0,
      };
    } catch { 
      return { totalGenerations: 0, uniqueAgents: [], agentCounts: {}, pipelineAgents: [], projectsSaved: 0, tourCompleted: false, mixesCreated: 0 }; 
    }
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    const key = userId || 'guest';
    localStorage.setItem(`studio_badges_${key}`, JSON.stringify(earnedBadges));
    localStorage.setItem(`studio_badge_stats_${key}`, JSON.stringify(stats));
  }, [earnedBadges, stats, userId]);

  const awardBadge = useCallback((badgeId) => {
    const badge = BADGE_DEFINITIONS[badgeId];
    if (!badge || earnedBadges[badgeId]) return;
    
    const newEarned = { ...earnedBadges, [badgeId]: { earnedAt: new Date().toISOString() } };
    setEarnedBadges(newEarned);
    
    // Show toast notification
    toast.custom((t) => (
      <div 
        onClick={() => toast.dismiss(t.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'linear-gradient(135deg, rgba(15,15,25,0.98), rgba(30,20,50,0.98))',
          border: `1px solid ${badge.color}44`,
          borderRadius: '14px', padding: '14px 18px',
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${badge.color}22`,
          cursor: 'pointer', maxWidth: '360px',
          animation: t.visible ? 'slideIn 0.3s ease' : 'slideOut 0.3s ease',
        }}
      >
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: `${badge.color}22`, border: `2px solid ${badge.color}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <badge.icon size={22} color={badge.color} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: badge.color, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Badge Earned!
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
            {badge.name}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>
            {badge.description}
          </div>
        </div>
      </div>
    ), { duration: 4000 });
  }, [earnedBadges]);

  // Check and award badges based on current stats
  const checkBadges = useCallback((currentStats) => {
    const allBadges = getAllBadges();
    
    allBadges.forEach(badge => {
      if (earnedBadges[badge.id]) return; // Already earned
      
      switch (badge.trigger) {
        case 'generation':
          if (badge.agentId && (currentStats.agentCounts[badge.agentId] || 0) >= badge.threshold) {
            awardBadge(badge.id);
          }
          break;
        case 'total_generations':
          if (currentStats.totalGenerations >= badge.threshold) {
            awardBadge(badge.id);
          }
          break;
        case 'unique_agents':
          if (currentStats.uniqueAgents.length >= badge.threshold) {
            awardBadge(badge.id);
          }
          break;
        case 'pipeline':
          if (badge.requires && badge.requires.every(a => currentStats.pipelineAgents.includes(a))) {
            awardBadge(badge.id);
          }
          break;
        case 'project_save':
          if (currentStats.projectsSaved >= badge.threshold) {
            awardBadge(badge.id);
          }
          break;
        case 'tour_complete':
          if (currentStats.tourCompleted) {
            awardBadge(badge.id);
          }
          break;
        case 'mix':
          if (currentStats.mixesCreated >= badge.threshold) {
            awardBadge(badge.id);
          }
          break;
        default:
          break;
      }
    });
  }, [earnedBadges, awardBadge]);

  // Track a generation event
  const trackGeneration = useCallback((agentId) => {
    setStats(prev => {
      const newStats = {
        ...prev,
        totalGenerations: prev.totalGenerations + 1,
        uniqueAgents: prev.uniqueAgents.includes(agentId) ? prev.uniqueAgents : [...prev.uniqueAgents, agentId],
        agentCounts: { ...prev.agentCounts, [agentId]: (prev.agentCounts[agentId] || 0) + 1 },
        pipelineAgents: prev.pipelineAgents.includes(agentId) ? prev.pipelineAgents : [...prev.pipelineAgents, agentId],
      };
      // Check after state update
      setTimeout(() => checkBadges(newStats), 100);
      return newStats;
    });
  }, [checkBadges]);

  const trackProjectSave = useCallback(() => {
    setStats(prev => {
      const newStats = { ...prev, projectsSaved: prev.projectsSaved + 1 };
      setTimeout(() => checkBadges(newStats), 100);
      return newStats;
    });
  }, [checkBadges]);

  const trackTourComplete = useCallback(() => {
    setStats(prev => {
      const newStats = { ...prev, tourCompleted: true };
      setTimeout(() => checkBadges(newStats), 100);
      return newStats;
    });
  }, [checkBadges]);

  const trackMix = useCallback(() => {
    setStats(prev => {
      const newStats = { ...prev, mixesCreated: prev.mixesCreated + 1 };
      setTimeout(() => checkBadges(newStats), 100);
      return newStats;
    });
  }, [checkBadges]);

  // Reset pipeline tracking for new session
  const resetPipeline = useCallback(() => {
    setStats(prev => ({ ...prev, pipelineAgents: [] }));
  }, []);

  return {
    earnedBadges,
    stats,
    trackGeneration,
    trackProjectSave,
    trackTourComplete,
    trackMix,
    resetPipeline,
    totalEarned: Object.keys(earnedBadges).length,
    totalAvailable: getAllBadges().length,
  };
}


// ─── Badge Display Component ──────────────────────────────────────────────────

export default function AchievementBadges({ earnedBadges = {}, onClose, isMobile = false }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const categories = getBadgesByCategory();
  const categoryNames = ['all', ...Object.keys(categories)];

  const filteredBadges = selectedCategory === 'all' 
    ? getAllBadges() 
    : (categories[selectedCategory] || []);

  const earned = Object.keys(earnedBadges).length;
  const total = getAllBadges().length;
  const progress = total > 0 ? (earned / total) * 100 : 0;

  return (
    <div role="dialog" aria-modal="true" aria-label="Achievement Badges" style={{
      position: 'fixed', inset: 0, zIndex: 10001,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: isMobile ? '95%' : '600px', maxHeight: '85vh',
        background: 'linear-gradient(180deg, #12121f, #0a0a14)',
        borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(168,85,247,0.08))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Trophy size={24} color="#f59e0b" />
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>Achievements</h2>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  {earned} / {total} badges earned
                </p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close achievements" style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>

          {/* Progress bar */}
          <div role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`${earned} of ${total} badges earned`} style={{ marginTop: '16px', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`, borderRadius: '4px',
              background: 'linear-gradient(90deg, #f59e0b, #a855f7)',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{
          display: 'flex', gap: '6px', padding: '12px 16px', overflowX: 'auto',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {categoryNames.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap',
              background: selectedCategory === cat ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.05)',
              color: selectedCategory === cat ? '#a855f7' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.2s',
            }}>
              {cat === 'all' ? `All (${earned}/${total})` : cat}
            </button>
          ))}
        </div>

        {/* Badge Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', alignContent: 'start' }}>
          {filteredBadges.map(badge => {
            const isEarned = !!earnedBadges[badge.id];
            const Icon = badge.icon;
            return (
              <div key={badge.id} style={{
                background: isEarned 
                  ? `linear-gradient(135deg, ${badge.color}12, ${badge.color}08)` 
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isEarned ? badge.color + '33' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '14px', padding: '16px', textAlign: 'center',
                opacity: isEarned ? 1 : 0.5,
                transition: 'all 0.2s',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px', margin: '0 auto 10px',
                  background: isEarned ? `${badge.color}22` : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${isEarned ? badge.color + '55' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isEarned ? <Icon size={22} color={badge.color} /> : <Lock size={18} color="rgba(255,255,255,0.2)" />}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isEarned ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                  {badge.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px', lineHeight: '1.3' }}>
                  {badge.description}
                </div>
                {isEarned && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
                    <Check size={12} color={badge.color} />
                    <span style={{ fontSize: '0.65rem', color: badge.color, fontWeight: 700 }}>Earned</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
