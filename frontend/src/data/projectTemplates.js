/**
 * PROJECT TEMPLATES - Pre-configured workflows for common creative goals
 * Each template includes recommended agents, milestones, and deliverables
 */

export const PROJECT_TEMPLATES = [
  {
    id: 'single-release',
    name: 'Single Release',
    description: 'Full workflow from writing to release for a single track',
    icon: 'Disc',
    color: 'var(--color-purple)',
    category: 'music',
    estimatedTime: '2-4 weeks',
    difficulty: 'Beginner',
    agents: ['ghost', 'beat', 'album', 'release', 'social'],
    milestones: [
      { id: 1, title: 'Write Lyrics', agent: 'ghost', status: 'pending', deliverable: 'lyrics' },
      { id: 2, title: 'Create Beat/Production', agent: 'beat', status: 'pending', deliverable: 'audio' },
      { id: 3, title: 'Design Cover Art', agent: 'album', status: 'pending', deliverable: 'image' },
      { id: 4, title: 'Plan Release Strategy', agent: 'release', status: 'pending', deliverable: 'plan' },
      { id: 5, title: 'Create Promo Content', agent: 'social', status: 'pending', deliverable: 'content' },
    ],
    deliverables: ['Finished lyrics', 'Beat/instrumental', 'Album artwork', 'Release plan', 'Social media assets'],
  },
  {
    id: 'album-project',
    name: 'Album/EP Project',
    description: 'Complete album production from concept to release',
    icon: 'Music',
    color: 'var(--color-cyan)',
    category: 'music',
    estimatedTime: '2-3 months',
    difficulty: 'Advanced',
    agents: ['ghost', 'beat', 'album', 'release', 'video-creator', 'social', 'network'],
    milestones: [
      { id: 1, title: 'Define Album Concept', agent: null, status: 'pending', deliverable: 'concept' },
      { id: 2, title: 'Write All Tracks', agent: 'ghost', status: 'pending', deliverable: 'lyrics' },
      { id: 3, title: 'Produce Instrumentals', agent: 'beat', status: 'pending', deliverable: 'audio' },
      { id: 4, title: 'Create Visual Identity', agent: 'album', status: 'pending', deliverable: 'image' },
      { id: 5, title: 'Create Music Video', agent: 'video-creator', status: 'pending', deliverable: 'video' },
      { id: 6, title: 'Build Rollout Strategy', agent: 'release', status: 'pending', deliverable: 'plan' },
      { id: 7, title: 'Execute Social Campaign', agent: 'social', status: 'pending', deliverable: 'content' },
    ],
    deliverables: ['Album concept doc', 'All track lyrics', 'Full instrumentals', 'Cover + visuals', 'Music video', 'Rollout plan'],
  },
  {
    id: 'social-campaign',
    name: 'Social Media Campaign',
    description: 'Build your brand and grow your audience',
    icon: 'Share2',
    color: 'var(--color-pink)',
    category: 'marketing',
    estimatedTime: '1-2 weeks',
    difficulty: 'Beginner',
    agents: ['social', 'video-creator', 'trend', 'album'],
    milestones: [
      { id: 1, title: 'Analyze Trends', agent: 'trend', status: 'pending', deliverable: 'research' },
      { id: 2, title: 'Create Content Calendar', agent: 'social', status: 'pending', deliverable: 'plan' },
      { id: 3, title: 'Design Visual Assets', agent: 'album', status: 'pending', deliverable: 'image' },
      { id: 4, title: 'Create Video Content', agent: 'video-creator', status: 'pending', deliverable: 'video' },
    ],
    deliverables: ['Trend analysis', 'Content calendar', 'Visual assets', 'Video clips'],
  },
  {
    id: 'music-video',
    name: 'Music Video Production',
    description: 'Concept to final cut for your visual story',
    icon: 'Video',
    color: 'var(--color-orange)',
    category: 'visual',
    estimatedTime: '2-3 weeks',
    difficulty: 'Intermediate',
    agents: ['video-creator', 'album', 'social'],
    milestones: [
      { id: 1, title: 'Develop Concept/Treatment', agent: null, status: 'pending', deliverable: 'concept' },
      { id: 2, title: 'Create Storyboard', agent: 'album', status: 'pending', deliverable: 'image' },
      { id: 3, title: 'Generate Video Content', agent: 'video-creator', status: 'pending', deliverable: 'video' },
      { id: 4, title: 'Create Promo Clips', agent: 'social', status: 'pending', deliverable: 'content' },
    ],
    deliverables: ['Video treatment', 'Storyboard', 'Full music video', 'Social clips'],
  },
  {
    id: 'brand-identity',
    name: 'Artist Brand Identity',
    description: 'Define your visual identity and artist persona',
    icon: 'Palette',
    color: 'var(--color-emerald)',
    category: 'branding',
    estimatedTime: '1-2 weeks',
    difficulty: 'Beginner',
    agents: ['album', 'social', 'release'],
    milestones: [
      { id: 1, title: 'Define Brand Voice', agent: 'release', status: 'pending', deliverable: 'concept' },
      { id: 2, title: 'Create Logo/Visual Identity', agent: 'album', status: 'pending', deliverable: 'image' },
      { id: 3, title: 'Design Social Templates', agent: 'album', status: 'pending', deliverable: 'image' },
      { id: 4, title: 'Write Bio & Press Kit', agent: 'social', status: 'pending', deliverable: 'content' },
    ],
    deliverables: ['Brand guidelines', 'Logo/visuals', 'Social templates', 'Press kit'],
  },
  {
    id: 'sync-pitch',
    name: 'Sync Licensing Pitch',
    description: 'Prepare tracks for film, TV, and advertising',
    icon: 'Film',
    color: 'var(--color-yellow)',
    category: 'business',
    estimatedTime: '1-2 weeks',
    difficulty: 'Intermediate',
    agents: ['release', 'sample', 'network'],
    milestones: [
      { id: 1, title: 'Audit Catalog for Sync', agent: 'release', status: 'pending', deliverable: 'research' },
      { id: 2, title: 'Create Instrumental Versions', agent: 'sample', status: 'pending', deliverable: 'audio' },
      { id: 3, title: 'Build Pitch Deck', agent: 'release', status: 'pending', deliverable: 'plan' },
      { id: 4, title: 'Research Supervisors', agent: 'network', status: 'pending', deliverable: 'research' },
    ],
    deliverables: ['Catalog audit', 'Instrumentals', 'Pitch deck', 'Contact list'],
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with full creative freedom',
    icon: 'Sparkles',
    color: 'var(--text-secondary)',
    category: 'custom',
    estimatedTime: 'Flexible',
    difficulty: 'Any',
    agents: [],
    milestones: [],
    deliverables: [],
  },
];

/**
 * PROJECT STATUS OPTIONS
 */
export const PROJECT_STATUSES = [
  { id: 'active', label: 'Active', color: 'var(--color-emerald)' },
  { id: 'paused', label: 'Paused', color: 'var(--color-yellow)' },
  { id: 'completed', label: 'Completed', color: 'var(--color-purple)' },
  { id: 'archived', label: 'Archived', color: 'var(--text-secondary)' },
];

/**
 * Get template by ID
 */
export const getTemplate = (templateId) => {
  return PROJECT_TEMPLATES.find(t => t.id === templateId) || PROJECT_TEMPLATES.find(t => t.id === 'blank');
};

/**
 * Create a new project from a template
 */
export const createProjectFromTemplate = (template, customName = null) => {
  const now = new Date();
  return {
    id: Date.now(),
    name: customName || `${template.name} - ${now.toLocaleDateString()}`,
    templateId: template.id,
    category: template.category,
    description: template.description,
    status: 'active',
    progress: 0,
    agents: template.agents,
    milestones: template.milestones.map(m => ({ ...m, status: 'pending' })),
    deliverables: template.deliverables,
    assets: [],
    context: {},
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    date: now.toLocaleDateString(),
  };
};

export default PROJECT_TEMPLATES;
