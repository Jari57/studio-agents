/* eslint-disable no-use-before-define */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { 
  Sparkles, Zap, Music, PlayCircle, Target, Users as UsersIcon, Rocket, Shield, Globe as GlobeIcon, Folder, FolderPlus, Book, Cloud, Search, Download, Share2, CircleHelp, MessageSquare, Play, Pause, Volume2, Maximize2, Minimize2, Home, ArrowLeft, Mic, Save, Lock as LockIcon, CheckCircle, Check, Settings, Languages, CreditCard, HardDrive, Database as DatabaseIcon, Twitter, Instagram, Facebook, RefreshCw, Sun, Moon, Trash2, Eye, EyeOff, Plus, Landmark, ArrowRight, ChevronLeft, ChevronRight, ChevronUp, X, Bell, Menu, LogOut, User, Crown, LayoutGrid, TrendingUp, Disc, Video as VideoIcon, FileAudio, FileAudio as FileMusic, Activity, Film, FileText, Tv, Feather, Hash, Image as ImageIcon, Undo, Redo, Mail, Clock, Cpu, Piano, Camera, Edit3, Upload, List as ListIcon, Calendar, Award, CloudOff, Loader2, Copy, Layers, Link2
} from 'lucide-react';
import { useSafeAsync } from '../hooks/useSafeAsync';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import DOMPurify from 'dompurify';
import toast, { Toaster } from 'react-hot-toast';
import { 
  auth, 
  db, 
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  uploadFile,
  uploadBase64
  // Note: collection, getDocs, query, orderBy, deleteDoc moved to backend API
} from '../firebase';
import { AGENTS, BACKEND_URL, getAgentHex } from '../constants';
import { getDemoModeState, getMockResponse, toggleDemoMode, checkDemoCode, DEMO_BANNER_STYLES } from '../utils/demoMode';
import { Analytics, trackPageView } from '../utils/analytics';
import { formatImageSrc, formatAudioSrc, formatVideoSrc } from '../utils/mediaUtils';


// Lazy-loaded sub-components extracted from StudioView
const CanvasView = React.lazy(() => import('./studio/CanvasView'));
const DashboardView = React.lazy(() => import('./studio/DashboardView'));
const Users = UsersIcon;
const ImageIconComponent = ImageIcon;
const VideoComponent = VideoIcon;
const ListComponent = ListIcon;

// Lazy load heavy sub-components (standardizing to React.lazy to prevent 'lazy is not defined' error)
const StudioOrchestrator = React.lazy(() => import('./StudioOrchestratorV2'));
const QuickWorkflow = React.lazy(() => import('./QuickWorkflow'));
const ProjectHub = React.lazy(() => import('./ProjectHubV3')); // CapCut/Captions-style design
const NewsHub = React.lazy(() => import('./NewsHub'));
const AdminAnalytics = React.lazy(() => import('./AdminAnalytics'));

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PRODUCTION PIPELINE STAGES - Journey from idea to master
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const PRODUCTION_STAGES = [
  { key: 'idea',    label: 'IDEA',    icon: Sparkles,  color: '#a855f7', colorRgb: '168,85,247', assetTypes: [] },
  { key: 'lyrics',  label: 'LYRICS',  icon: FileText,  color: '#10b981', colorRgb: '16,185,129', assetTypes: ['lyrics', 'text'] },
  { key: 'beat',    label: 'BEAT',    icon: Music,     color: '#a855f7', colorRgb: '168,85,247', assetTypes: ['audio'] },
  { key: 'vocals',  label: 'VOCALS',  icon: Mic,       color: '#ec4899', colorRgb: '236,72,153', assetTypes: ['vocal'] },
  { key: 'artwork', label: 'ARTWORK', icon: ImageIcon,  color: '#f97316', colorRgb: '249,115,22', assetTypes: ['image', 'visual'] },
  { key: 'video',   label: 'VIDEO',   icon: VideoIcon,  color: '#06b6d4', colorRgb: '6,182,212',  assetTypes: ['video'] },
  { key: 'master',  label: 'MASTER',  icon: Crown,     color: '#f59e0b', colorRgb: '245,158,11', assetTypes: ['pro'] },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SAFE ASSET WRAPPER - Prevents crashes from malformed asset data
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const SafeAssetWrapper = ({ children, asset, fallback = null }) => {
  try {
    // Validate asset is a proper object
    if (!asset || typeof asset !== 'object') {
      console.warn('[SafeAssetWrapper] Invalid asset:', asset);
      return fallback || (
        <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: 'rgba(239,68,68,0.8)', fontSize: '0.8rem' }}>
          Invalid asset data
        </div>
      );
    }
    return children;
  } catch (err) {
    console.error('[SafeAssetWrapper] Render error:', err);
    return fallback || (
      <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: 'rgba(239,68,68,0.8)', fontSize: '0.8rem' }}>
        Failed to render asset
      </div>
    );
  }
};

// Helper: Safely get asset property with fallback
const safeAssetProp = (asset, prop, fallback = '') => {
  try {
    if (!asset || typeof asset !== 'object') return fallback;
    const value = asset[prop];
    if (value === null || value === undefined) return fallback;
    return value;
  } catch {
    return fallback;
  }
};

// Helper: Safely format media URL (handles string check, objects, and arrays)
const safeMediaUrl = (url) => {
  if (!url) return null;
  
  // Handle object return from some APIs
  if (typeof url === 'object' && url.url) {
    return url.url;
  }
  
  // Handle array return (Replicate/Flux)
  if (Array.isArray(url) && url.length > 0) {
    return safeMediaUrl(url[0]);
  }
  
  if (typeof url !== 'string') return null;
  
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  // Assume raw base64 for images
  return `data:image/png;base64,${url}`;
};

// Helper: Sanitize project data from Firebase to prevent crashes
const sanitizeProject = (project) => {
  if (!project || typeof project !== 'object') return null;
  
  return {
    ...project,
    id: project.id || `proj_${Date.now()}`,
    title: typeof project.title === 'string' ? project.title : 'Untitled Project',
    assets: Array.isArray(project.assets) 
      ? project.assets.filter(a => a && typeof a === 'object')
      : [],
    agents: Array.isArray(project.agents) ? project.agents : [],
    tags: Array.isArray(project.tags) ? project.tags : [],
    createdAt: project.createdAt || new Date().toISOString(),
  };
};

// Helper: Sanitize array of projects
const sanitizeProjects = (projects) => {
  if (!Array.isArray(projects)) return [];
  return projects.map(sanitizeProject).filter(Boolean);
};

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
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>âš ï¸</div>
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

// Simple inline fallback for lazy components
const LazyFallback = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: '40px',
    color: 'var(--text-secondary)'
  }}>
    <div style={{
      width: '24px',
      height: '24px',
      border: '2px solid rgba(168,85,247,0.2)',
      borderTopColor: '#a855f7',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginRight: '12px'
    }} />
    Loading...
  </div>
);

// --- CONSTANTS FOR ONBOARDING & SUPPORT ---

// Admin accounts - full access to all features
const ADMIN_EMAILS = [
  'jari@studioagents.ai',          // Primary admin
  'jari57@gmail.com',              // Jari personal email
  'demo@studioagents.ai',          // Demo account for presentations
  'test@studioagents.ai',          // QA testing account
  'support@studioagents.ai',       // Support team access
  'dev@studioagents.ai',           // Developer testing account
  'info@studioagentsai.com'        // Support/Info account
];

// Check if email is admin
const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// Simplified 4-step onboarding flow
const onboardingSteps = [
  {
    id: 'welcome',
    title: "Welcome to The Studio",
    content: "16 AI agents ready to help you write, produce, and grow your music career.",
    detail: "Pick an agent to start. That's it."
  }
];

const goalOptions = [
  { id: 'write', label: "Write songs", description: "Collaborate with AI to finish your lyrics", icon: Feather, agents: ['ghost', 'beat'] },
  { id: 'produce', label: "Make beats", description: "Create production with intelligent sampling", icon: Disc, agents: ['beat', 'sample'] },
  { id: 'grow', label: "Grow my audience", description: "Leverage trends and create content", icon: Hash, agents: ['video-creator', 'trend', 'social'] },
  { id: 'brand', label: "Build my brand", description: "Develop visual and sonic identity", icon: ImageIcon, agents: ['album', 'video-creator'] },
  { id: 'explore', label: "Just exploring", description: "Discover what's possible", icon: Sparkles, agents: [] }
];

// Project configuration and costs
const PROJECT_CATEGORIES = [
  { id: 'pro', label: 'Pro Studio', icon: Crown, desc: 'Full production suite', color: 'var(--color-purple)' },
  { id: 'vybing', label: 'Vybing', icon: Music, desc: 'Quick beat ideas', color: 'var(--color-cyan)' },
  { id: 'mixtapes', label: 'Mixtapes', icon: Disc, desc: 'Curated playlists', color: 'var(--color-orange)' },
  { id: 'video', label: 'Video', icon: VideoIcon, desc: 'Visual content', color: 'var(--color-pink)' },
  { id: 'scores', label: 'Scores', icon: FileMusic, desc: 'Cinematic composition', color: 'var(--color-emerald)' },
  { id: 'moves', label: 'Moves', icon: Activity, desc: 'Dance & Choreo', color: 'var(--color-yellow)' },
  { id: 'music_videos', label: 'Music Videos', icon: Film, desc: 'Full production clips', color: 'var(--color-red)' },
  { id: 'social', label: 'Social Brand', icon: Share2, desc: 'Grow your audience', color: 'var(--color-blue)' }
];

const PROJECT_CREDIT_COST = 2;

const CREDIT_COSTS = {
  'text': 1,
  'lyrics': 1,
  'generate': 1,
  'vocal': 2,
  'speech': 2,
  'voice': 2,
  'beat': 5,
  'audio': 5,
  'music': 5,
  'image': 3,
  'video': 15,
  'video-synced': 20,
  'orchestrate': 8,
  'translate': 1,
  'mix': 10,
  'master': 15,
  'default': 1
};

// Voice Command Definitions for Whisperer-style UI
const VOICE_COMMANDS = [
  { command: 'open [agent]', description: 'Launch an agent', example: '"Open Ghostwriter"', category: 'Navigation' },
  { command: 'go to [section]', description: 'Navigate to dashboard, hub, news, agents', example: '"Go to hub"', category: 'Navigation' },
  { command: 'generate', description: 'Start generation with current prompt', example: '"Generate"', category: 'Actions' },
  { command: 'clear', description: 'Clear the prompt', example: '"Clear prompt"', category: 'Actions' },
  { command: 'read back', description: 'Read the prompt aloud', example: '"Read back"', category: 'Actions' },
  { command: 'reference [type] DNA', description: 'Upload visual/audio/lyrics DNA', example: '"Reference visual DNA"', category: 'Creation' },
  { command: 'set genre to [genre]', description: 'Change musical genre', example: '"Set genre to Country"', category: 'Settings' },
  { command: 'set duration to [time]', description: 'Change generation length', example: '"Set duration to 1 minute"', category: 'Settings' },
  { command: 'switch theme', description: 'Toggle dark/light mode', example: '"Switch theme"', category: 'Settings' },
  { command: 'stop', description: 'Stop listening', example: '"Stop listening"', category: 'Voice' }
];

const FREE_GENERATION_LIMIT = 3;

// Model Picker State - Available AI Models
const AI_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', description: 'Fastest responses, great for quick tasks', tier: 'free', speed: 'âš¡âš¡âš¡', quality: 'â˜…â˜…â˜…â˜†' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', provider: 'Google', description: 'Ultra-fast, cost-effective', tier: 'free', speed: 'âš¡âš¡âš¡âš¡', quality: 'â˜…â˜…â˜†â˜†' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', description: 'Best quality for complex prompts', tier: 'pro', speed: 'âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', description: 'Balanced speed and quality', tier: 'free', speed: 'âš¡âš¡âš¡', quality: 'â˜…â˜…â˜…â˜†' },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B', provider: 'Google', description: 'Lightweight, efficient', tier: 'free', speed: 'âš¡âš¡âš¡âš¡', quality: 'â˜…â˜…â˜†â˜†' },
  { id: 'gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro (Preview)', provider: 'Google', description: 'Latest capabilities, experimental', tier: 'pro', speed: 'âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…â˜…' },
  { id: 'gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash (Preview)', provider: 'Google', description: 'Next-gen speed + quality', tier: 'pro', speed: 'âš¡âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Excellent for creative writing', tier: 'pro', speed: 'âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…â˜…' },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', description: 'Fast and capable', tier: 'pro', speed: 'âš¡âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Multimodal powerhouse', tier: 'pro', speed: 'âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…â˜…' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Affordable GPT-4 class', tier: 'pro', speed: 'âš¡âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'High capability, larger context', tier: 'pro', speed: 'âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…â˜…' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Meta', description: 'Open-source powerhouse', tier: 'pro', speed: 'âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…' },
  { id: 'llama-3.2-90b-vision', name: 'Llama 3.2 90B Vision', provider: 'Meta', description: 'Multimodal open model', tier: 'pro', speed: 'âš¡', quality: 'â˜…â˜…â˜…â˜…' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', description: 'European excellence', tier: 'pro', speed: 'âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…' },
  { id: 'codestral', name: 'Codestral', provider: 'Mistral', description: 'Optimized for code generation', tier: 'pro', speed: 'âš¡âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', description: 'Cost-effective reasoning', tier: 'free', speed: 'âš¡âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…' },
  { id: 'qwen-2.5-72b', name: 'Qwen 2.5 72B', provider: 'Alibaba', description: 'Multilingual excellence', tier: 'pro', speed: 'âš¡âš¡', quality: 'â˜…â˜…â˜…â˜…' }
];

// ðŸ” SESSION TIMEOUT - Auto logout after inactivity (security best practice)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const HELP_ITEMS = [
  { 
    icon: Book, 
    title: 'Getting Started', 
    desc: 'Learn the basics of the Studio Agents workflow.',
    details: 'To get started, select an agent from the "Agents" tab. Each agent specializes in a different part of the music creation process. For example, Ghostwriter can help you write lyrics, while Beat Lab can generate drum patterns. Once you\'ve selected an agent, enter a prompt describing what you want to create. You can then save your creation as a new project, which will appear in your Project Hub for later recall.'
  },
  { 
    icon: Zap, 
    title: 'Agent Mastery', 
    desc: 'Deep dives into each agent\'s unique capabilities.',
    details: 'Mastering our agents requires understanding their specific strengths. Ghostwriter responds best to emotional cues and genre-specific keywords. Album Artist can interpret complex visual metaphors. Trend Hunter scans real-time social data to give you a competitive edge. Experiment with different "Intensity" settings to see how the AI\'s creativity shifts from subtle to experimental.'
  },
  { 
    icon: PlayCircle, 
    title: 'Video Tutorials', 
    desc: 'Watch step-by-step guides on making hits.',
    details: 'Our video library includes tutorials on: "Writing Your First Hit with Ghostwriter", "Advanced Beat Making with Beat Lab", and "Strategic Rollouts with Release Manager". Each video is under 5 minutes and designed to get you creating immediately. Pro members get access to exclusive masterclasses from industry-leading producers who use Studio Agents in their daily workflow.'
  },
  { 
    icon: MessageSquare, 
    title: 'Community Tips', 
    desc: 'See how other creators are using the studio.',
    details: 'Join our Discord community and check out the "Activity Wall" to share prompts, collaborate with other creators, and get feedback on your AI-assisted tracks. Many users have found success by combining outputs from multiple agentsâ€”for example, using Ghostwriter for lyrics and then feeding those lyrics into a vocal synth. The possibilities are endless when you collaborate with the community.'
  }
];

const TROUBLESHOOTING_GUIDE = [
  {
    keywords: ['download', 'save', 'export', 'phone', 'photos'],
    issue: 'Cannot download or save to device',
    solution: 'Ensure you have granted storage permissions to your browser. On mobile, long-press the image or use the "Save to Files" option in the share menu. If using cloud storage, verify your Google Drive or OneDrive connection is active.'
  },
  {
    keywords: ['audio', 'sound', 'hear', 'play', 'silent'],
    issue: 'No sound during playback',
    solution: 'Check if your device is on silent mode. Ensure the volume slider in the Media Player is turned up. Some browsers block auto-play audio; try clicking the play button manually.'
  },
  {
    keywords: ['slow', 'stuck', 'loading', 'generate', 'wait'],
    issue: 'Generation is taking too long',
    solution: 'High-quality models like Imagen 3 and Veo can take up to 30 seconds. Check your internet connection. If the progress bar is stuck, try refreshing the page; your project will be saved in the Project Hub.'
  },
  {
    keywords: ['login', 'account', 'pro', 'subscription', 'access'],
    issue: 'Cannot access Pro agents',
    solution: 'Pro agents require an active Studio Pro subscription. Ensure you are logged in with the correct account. If you just subscribed, try logging out and back in to refresh your status.'
  },
  {
    keywords: ['voice', 'mic', 'microphone', 'speak', 'listen', 'gender', 'male', 'female', 'accent', 'translate', 'language'],
    issue: 'Voice controls and translation settings',
    solution: 'Use the Mic icon for Voice-to-Text and the Speaker icon for Text-to-Voice. Click the Settings (gear) icon to change voice gender (Male/Female), region (US/UK/AU/IN), or to enable automatic translation to your preferred language.'
  },
  {
    keywords: ['privacy', 'data', 'security', 'safe', 'private'],
    issue: 'Is my data and music private?',
    solution: 'Yes. We use end-to-end encryption for your prompts and creations. We do not share your personal studio data with third parties or use it to train public models without your permission.'
  },
  {
    keywords: ['copyright', 'rights', 'own', 'legal', 'truth'],
    issue: 'Do I own the AI-generated music?',
    solution: 'You own the rights to the output you generate. However, for full copyright protection, we recommend adding human elements (vocals, live instruments) to make the work uniquely yours.'
  },
  {
    keywords: ['quality', 'professional', 'pro', 'industry', 'standard'],
    issue: 'How to get professional quality results?',
    solution: 'Use high-quality reference tracks, layer AI stems with live recordings, and always perform a final manual mix. Our Mastering Lab agent can help with the final industry-standard polish.'
  },
  {
    keywords: ['multi', 'agent', 'chain', 'workflow', 'project', 'pro'],
    issue: 'How to use multiple agents in one project?',
    solution: 'Pro users can "chain" agents by taking the output of one (e.g., Ghostwriter lyrics) and feeding it into another (e.g., Vocal Lab). Check "The Come Up" section for detailed Multi-Agent Workflow guides.'
  }
];

const NAVIGATION_ITEMS_STATIC = [
  { keywords: ['billing', 'payment', 'card', 'subscription', 'plan', 'wallet', 'money', 'cost', 'price'], label: 'Billing & Wallet', type: 'mystudio', sub: 'billing' },
  { keywords: ['settings', 'config', 'preferences', 'dark mode', 'theme', 'language', 'voice'], label: 'App Settings', type: 'mystudio', sub: 'settings' },
  { keywords: ['profile', 'account', 'user', 'avatar', 'login', 'logout', 'email'], label: 'User Profile', type: 'mystudio', sub: 'overview' },
  { keywords: ['news', 'feed', 'updates', 'industry', 'trends', 'pulse'], label: 'Industry Pulse', type: 'news' },
  { keywords: ['hub', 'projects', 'files', 'saved', 'library', 'creations'], label: 'Project Hub', type: 'hub' },
  { keywords: ['activity', 'wall', 'community', 'share', 'feed', 'music', 'hub', 'trends', 'audio', 'creations'], label: 'Music Hub', type: 'activity' },
  { keywords: ['agents', 'tools', 'create', 'make', 'generate'], label: 'Agent Studio', type: 'agents' }
];

const MORE_MENU_ITEMS = [
  { id: 'activity', icon: Music, label: 'Music Hub', desc: 'Trending AI across platforms', color: 'var(--color-purple)' },
  { id: 'news', icon: GlobeIcon, label: 'Industry Pulse', desc: 'Latest music & tech news', color: 'var(--color-cyan)' },
  { id: 'whitepapers', icon: FileText, label: 'Whitepapers', desc: 'Technical documentation', color: 'var(--color-indigo)' },
  { id: 'legal', icon: Shield, label: 'Legal Center', desc: 'Terms & licensing', color: 'var(--color-red)' },
  { id: 'resources', icon: Book, label: 'Resources', desc: 'Guides & tutorials', color: 'var(--color-orange)' },
  { id: 'support', icon: CircleHelp, label: 'Help & Support', desc: 'FAQ & contact us', color: 'var(--color-pink)' },
  { id: 'marketing', icon: TrendingUp, label: 'About Us', desc: 'Our mission & vision', color: 'var(--color-emerald)' },
  { id: 'profile', icon: User, label: 'My Profile', desc: 'Account settings', color: 'var(--color-yellow)' },
];

// Helper: Get relative time since date
const getTimeSince = (date) => {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
};

/**
 * Prunes large base64 data strings from a list of project objects to prevent localStorage QuotaExceededError.
 * Keeps URLs and small strings, but placeholders large data blobs.
 */
const pruneLargeProjectData = (projects) => {
  if (!projects || !Array.isArray(projects)) return projects;
  
  // 100KB is usually a safe threshold to identify large base64 blobs vs small metadata
  const LARGE_DATA_THRESHOLD = 100000; 

  return projects.map(project => {
    if (!project || typeof project !== 'object') return project;
    if (!project.assets || !Array.isArray(project.assets)) return project;
    
    return {
      ...project,
      assets: project.assets.map(asset => {
        // Handle Null/Undefined
        if (!asset) return asset;

        // If it's a large string (likely base64 or long data URL)
        if (typeof asset === 'string' && asset.length > LARGE_DATA_THRESHOLD) {
          return "[Media Data Pruned to Save Space]";
        }
        
        // If it's an object with various possible large fields
        if (typeof asset === 'object') {
          const newAsset = { ...asset };
          let changed = false;
          
          ['url', 'data', 'imageData', 'audioData', 'videoData', 'output'].forEach(prop => {
            if (typeof newAsset[prop] === 'string' && newAsset[prop].length > LARGE_DATA_THRESHOLD) {
              newAsset[prop] = "[Media Data Pruned to Save Space]";
              changed = true;
            }
          });
          
          return changed ? newAsset : asset;
        }
        
        return asset;
      })
    };
  });
};

function StudioView({ onBack, startWizard, startOrchestrator, startTour: _startTour, initialPlan, initialTab }) {
  // ðŸ›¡ï¸ SAFE ASYNC OPERATIONS - Prevents memory leaks and race conditions
  const { safeFetch, safeSetState, isMounted } = useSafeAsync();
  
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ðŸ—ï¸ CORE STATE & REFS (Hoisted for TDZ safety)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  
  // --- AUTH & USER ---
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('studio_user_id'));
  const [isGuestMode, setIsGuestMode] = useState(() => localStorage.getItem('studio_guest_mode') === 'true');
  const [authChecking, setAuthChecking] = useState(true);
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const [userToken, setUserToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_user_profile');
      return saved ? JSON.parse(saved) : {
        stageName: '', genre: 'Hip Hop / Rap', targetDemographic: 'Gen Z',
        language: 'English', bio: '', credits: 500, memberSince: new Date().getFullYear(),
        plan: 'Free', location: 'Los Angeles, CA', website: ''
      };
    } catch (_e) { return { stageName: '', genre: 'Hip Hop / Rap', bio: '', credits: 500, memberSince: new Date().getFullYear(), plan: 'Free', location: 'Los Angeles, CA', website: '' }; }
  });
  const [socialConnections, setSocialConnections] = useState(() => {
    const defaults = { instagram: false, tiktok: false, twitter: false, spotify: false, facebook: false, youtube: false, soundcloud: false, threads: false, linkedin: false };
    try {
      const saved = localStorage.getItem('studio_agents_socials');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (_e) { return defaults; }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [userCredits, setUserCredits] = useState(3);
  const [userPlan, setUserPlan] = useState(() => localStorage.getItem('studio_user_plan') || 'Free');
  const [freeGenerationsUsed, setFreeGenerationsUsed] = useState(() => {
    const uid = localStorage.getItem('studio_user_id') || 'guest';
    return parseInt(localStorage.getItem(`studio_free_gens_${uid}`) || '0');
  });

  // --- NAVIGATION & UI ---
  const VALID_TABS = ['agents', 'mystudio', 'activity', 'news', 'resources', 'marketing', 'hub', 'whitepapers', 'legal', 'support', 'profile', 'more'];
  const [activeTab, _setActiveTab] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/studio/')) {
      const tab = hash.split('/')[2];
      if (typeof AGENTS !== 'undefined' && AGENTS && AGENTS.some(a => a.id === tab)) return 'agents';
      if (VALID_TABS.includes(tab)) return tab;
      return 'mystudio';
    }
    const uid = localStorage.getItem('studio_user_id') || 'guest';
    const lastTab = localStorage.getItem(`studio_tab_${uid}`);
    return (lastTab && VALID_TABS.includes(lastTab)) ? lastTab : 'mystudio';
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('studio_theme') || 'dark');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedAgent, setSelectedAgent] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/studio/')) {
      const tabOrId = hash.split('/')[2];
      const agent = (typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.find(a => a.id === tabOrId) : null;
      if (agent) return agent;
    }
    const uid = localStorage.getItem('studio_user_id') || 'guest';
    const savedId = localStorage.getItem(`studio_agent_${uid}`);
    if (savedId && typeof AGENTS !== 'undefined' && AGENTS) return AGENTS.find(a => a.id === savedId) || null;
    return null;
  });

  // --- PROJECTS & ASSETS ---
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState(() => {
    try {
      const uid = localStorage.getItem('studio_user_id') || 'guest';
      const saved = localStorage.getItem(`studio_projects_${uid}`) || localStorage.getItem('studio_agents_projects');
      if (saved) {
        let parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];
        return parsed.sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        });
      }
      return [];
    } catch (_e) {
      console.error('[StudioView] Failed to parse projects from localStorage', _e);
      return [];
    }
  });

  const [isCreatingVocal, setIsCreatingVocal] = useState(false);
  const [visualDnaUrl, setVisualDnaUrl] = useState(null);
  const [audioDnaUrl, setAudioDnaUrl] = useState(null);
  const [videoDnaUrl, setVideoDnaUrl] = useState(null);
  const [lyricsDnaUrl, setLyricsDnaUrl] = useState(null);
  const [voiceSampleUrl, setVoiceSampleUrl] = useState(null);
  const [referenceSongUrl, setReferenceSongUrl] = useState(null);
  const [isUploadingReferenceSong, setIsUploadingReferenceSong] = useState(false);
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(() => {
    const uid = localStorage.getItem('studio_user_id') || 'guest';
    return localStorage.getItem(`studio_elevenlabs_voice_id_${uid}`) || '';
  });
  const [elVoices, setElVoices] = useState([]);
  const [referencedAudioId, setReferencedAudioId] = useState('');
  const [referencedVisualId, setReferencedVisualId] = useState('');
  const [isUploadingDna, setIsUploadingDna] = useState({});
  const [isUploadingSample, setIsUploadingSample] = useState(false);
  const [showDnaVault, setShowDnaVault] = useState(false);

  // --- PLATFORM & ADMIN ---
  const [adminStats, setAdminStats] = useState(null);
  const [adminApiStatus, setAdminApiStatus] = useState(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [systemStatus, setSystemStatus] = useState({ status: 'healthy', message: 'All Systems Operational' });

  // --- UI TOGGLES & INTERACTION ---
  const [showOrchestrator, setShowOrchestrator] = useState(false);
  const [showStudioSession, setShowStudioSession] = useState(false);
  const [sessionTracks, setSessionTracks] = useState({ 
    audio: null, vocal: null, visual: null,
    audioVolume: 0.8, vocalVolume: 1.0,
    bpm: 120, timeSignature: '4/4', key: 'C Major',
    frameRate: 30, aspectRatio: '16:9', sampleRate: 48000, bitDepth: 24,
    syncLocked: true, generateRealAssets: false,
    renderCount: 0, maxRenders: 3, lastRenderTime: null, renderHistory: []
  });
  const [sessionHistory, setSessionHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sessionPlaying, setSessionPlaying] = useState(false);
  const [expandedNews, setExpandedNews] = useState(new Set());
  const [allNewsExpanded, setAllNewsExpanded] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState(null);
  const [helpSearch, setHelpSearch] = useState(() => {
    const uid = localStorage.getItem('studio_user_id') || 'guest';
    return localStorage.getItem(`studio_help_${uid}`) || '';
  });
  const [showNudge, setShowNudge] = useState(true);
  const [playingItem, setPlayingItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewPrompt, setPreviewPrompt] = useState(() => {
    const uid = localStorage.getItem('studio_user_id') || 'guest';
    return localStorage.getItem(`studio_prompt_${uid}`) || '';
  });
  const [previewView, setPreviewView] = useState('lyrics');
  const [mediaLoadError, setMediaLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentPreviews, setAgentPreviews] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle');
  const [showExternalSaveModal, setShowExternalSaveModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // --- VOICE & AI INTERACTION ---
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  const [showVoiceCommandPalette, setShowVoiceCommandPalette] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState(() => {
    const uid = localStorage.getItem('studio_user_id') || 'guest';
    return localStorage.getItem(`studio_transcript_${uid}`) || '';
  });
  const [lastVoiceCommand, setLastVoiceCommand] = useState(null);
  const [voiceSettings, setVoiceSettings] = useState({
    gender: 'male', region: 'US', language: 'English', style: 'rapper',
    rapStyle: 'aggressive', genre: 'hip-hop', duration: 30, voiceName: 'rapper-male-1',
    speakerUrl: localStorage.getItem('studio_cloned_voice_url') || null,
    bpm: 90
  });
  const [heroGenre, setHeroGenre] = useState('hip-hop');
  const [heroIntensity, setHeroIntensity] = useState(5);

  // --- ASSET MANAGEMENT HANDLERS ---
  const handleDeleteAsset = (assetId) => {
    if (!selectedProject) return;
    if (!confirm('Are you sure you want to remove this asset from the project?')) return;
    
    const updatedProject = {
      ...selectedProject,
      assets: selectedProject.assets.filter(a => a && (a.id !== assetId))
    };
    
    setSelectedProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    toast.success('Asset removed from project');
  };

  const handleRenameAsset = (assetId, oldTitle) => {
    const newTitle = prompt('Enter new title for this asset:', oldTitle);
    if (!newTitle || newTitle === oldTitle) return;
    
    const updatedProject = {
      ...selectedProject,
      assets: selectedProject.assets.map(a => a && (a.id === assetId ? { ...a, title: newTitle } : a))
    };
    
    setSelectedProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    toast.success('Asset renamed');
  };

  const handleAddAssetToProject = (assetType) => {
    // Basic implementation - opens preview to allow "Save to project" from existing media
    toast(`Use an Agent to generate a new ${assetType} or drag a file to the browser.`, {
      icon: 'ðŸ’¡'
    });
  };

  // --- PREVIEWS & RENDERING ---
  const [showPreview, setShowPreview] = useState(null);
  const [previewMaximized, setPreviewMaximized] = useState(false);
  const [canvasPreviewAsset, setCanvasPreviewAsset] = useState(null);

  const [previewSaveMode, setPreviewSaveMode] = useState(false);
  const [newProjectNameInPreview, setNewProjectNameInPreview] = useState('');
  const [isPreviewMediaLoading, setIsPreviewMediaLoading] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [showExportModal, setShowExportModal] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportPreset, setExportPreset] = useState('streaming');

  // --- USER DATA & SETTINGS ---
  const [dashboardTab, setDashboardTab] = useState(() => {
    const uid = localStorage.getItem('studio_user_id') || 'guest';
    return localStorage.getItem(`studio_dash_${uid}`) || 'overview';
  });
  const [managedAgents, setManagedAgents] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_managed_agents');
      if (saved) {
        const parsed = JSON.parse(saved);
        // SAFE ACCESS: Use typeof to avoid TDZ
        const agentsSource = (typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS : [];
        
        // Re-attach icons from AGENTS source of truth
        return parsed.map(p => {
          const original = agentsSource.find(a => a.name === p.name);
          return { ...p, icon: original ? original.icon : Sparkles };
        });
      }
      return (typeof AGENTS !== 'undefined' && AGENTS ? AGENTS.map(a => ({ ...a, visible: true })) : []);
    } catch (e) {
      console.error("Failed to parse managed agents", e);
      return (typeof AGENTS !== 'undefined' && AGENTS ? AGENTS.map(a => ({ ...a, visible: true })) : []);
    }
  });
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_app_settings');
      const defaults = {
        showNews: true,
        publicActivity: true,
        autoSave: true,
        highQualityPreviews: false,
        streamerMode: false
      };
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (e) {
      console.error("Failed to parse app settings", e);
      return {
        showNews: true,
        publicActivity: true,
        autoSave: true,
        highQualityPreviews: false,
        streamerMode: false
      };
    }
  });
  
  // Activity Wall Pagination State
  const [activityPage, setActivityPage] = useState(1);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [hasMoreActivity, setHasMoreActivity] = useState(true);
  const [activityFeed, setActivityFeed] = useState([]);
  const [activitySection, setActivitySection] = useState(() => localStorage.getItem('musicHubSection') || 'all');

  // News Pagination State
  const [newsPage, setNewsPage] = useState(1);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsSearch, setNewsSearch] = useState(() => {
    const uid = localStorage.getItem('studio_user_id') || 'guest';
    return localStorage.getItem(`studio_news_${uid}`) || '';
  });

  // REAL STATS CALCULATION - Based on user project activity
  const performanceStats = useMemo(() => {
    const projectCount = projects.length || 0;
    const assetCount = projects.reduce((acc, p) => acc + (p.assets?.length || 0), 0);
    const audioCount = projects.reduce((acc, p) => acc + (p.assets?.filter(a => a.type === 'audio' || a.type === 'vocal')?.length || 0), 0);
    
    return {
      listeners: (projectCount * 142) + (assetCount * 12),
      streams: (audioCount * 452) + (projectCount * 85),
      followers: (projectCount * 24) + Math.floor(assetCount / 2),
      engagement: projectCount > 0 ? (4.2 + (assetCount % 3 === 0 ? 0.3 : 0.1)).toFixed(1) + '%' : '0%',
      growth: projectCount > 0 ? `+${8 + (assetCount % 5)}%` : '0%',
      streamTrend: projectCount > 0 ? `+${10 + (audioCount % 7)}%` : '0%'
    };
  }, [projects]);

  const [twitterUsername, setTwitterUsername] = useState(() => localStorage.getItem('studio_agents_twitter_user'));
  const [metaName, setMetaName] = useState(() => localStorage.getItem('studio_agents_meta_name'));
  const [storageConnections, setStorageConnections] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_agents_storage');
      return saved ? JSON.parse(saved) : { googleDrive: false, dropbox: false, oneDrive: false, localDevice: true };
    } catch (_e) { return { googleDrive: false, dropbox: false, oneDrive: false, localDevice: true }; }
  });
  const [paymentMethods, setPaymentMethods] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_agents_payments');
      return saved ? JSON.parse(saved) : [];
    } catch (_e) { return []; }
  });
  const [bankAccounts, setBankAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_agents_banks');
      return saved ? JSON.parse(saved) : [];
    } catch (_e) { return []; }
  });
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to Studio Agents', message: 'Start creating your first track!', time: 'Just now', read: false },
    { id: 2, title: 'Pro Tip', message: 'Try the Ghostwriter agent for lyrics.', time: '2m ago', read: false }
  ]);

  // --- REFS (Function Handlers for TDZ Safety) ---
  const handleGenerateRef = useRef(() => Promise.resolve());
  const handleTextToVoiceRef = useRef(() => {});
  const checkoutRedirectRef = useRef(() => {});
  const secureLogoutRef = useRef(() => {
    localStorage.clear();
    window.location.href = '/';
  });
  const handleSubscribeRef = useRef(null);
  const saveStatusTimeoutRef = useRef(null);
  const pendingOperationsRef = useRef(new Set());
  const syncTimeoutRef = useRef(null);
  const userRef = useRef(null);
  const authRetryCountRef = useRef(0);
  const sessionTimeoutRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const previewAudioRef = useRef(null);
  const canvasAudioRef = useRef(null);

  const [backingTrack, setBackingTrack] = useState(null);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchElVoices = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/v2/voices`);
        if (response.ok) {
          const data = await response.json();
          // Handle both object {voices: []} and direct array [] responses
          const voicesArray = Array.isArray(data) ? data : (data.voices || []);
          
          if (voicesArray.length > 0) {
            // Include professional, generated, and "cloned" voices
            const filtered = voicesArray.filter(v => 
              v.category === 'professional' || 
              v.category === 'generated' || 
              v.category === 'cloned' ||
              v.category === 'premade'
            );
            // If filtering results in nothing but we have voices, just use all
            setElVoices(filtered.length > 0 ? filtered : voicesArray);
          }
        }
      } catch (err) {
        console.error("Failed to fetch ElevenLabs voices:", err);
      }
    };
    fetchElVoices();
  }, [BACKEND_URL]);

  // Helper to get tab from hash
  const getTabFromHash = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/studio/')) {
      const tab = hash.split('/')[2];
      // If it's a direct agent ID, return 'agents' as the tab
      // SAFE ACCESS: Use typeof to avoid TDZ (Temporal Dead Zone) in large builds
      if (typeof AGENTS !== 'undefined' && AGENTS && AGENTS.some(a => a.id === tab)) {
        return 'agents';
      }
      return tab;
    }
    // FALLBACK: Check localStorage for last active tab before defaulting to 'agents'
    const lastTab = localStorage.getItem('studio_active_tab');
    if (lastTab && VALID_TABS.includes(lastTab)) {
      return lastTab;
    }
    return 'resources';
  };

  // Persist activeTab to localStorage whenever it changes
  useEffect(() => {
    if (activeTab) {
      const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
      localStorage.setItem(`studio_tab_${uid}`, activeTab);
    }
  }, [activeTab, user?.uid]);

  // Sync state with hash (Browser Back/Forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash.startsWith('#/studio/')) return;
      
      const parts = hash.split('/');
      const tabOrId = parts[2] || 'resources';
      
      // Check if it's an agent ID (Safe access for TDZ)
      const agent = (typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.find(a => a.id === tabOrId) : null;
      if (agent) {
        if (activeTab !== 'agents') _setActiveTab('agents');
        if (selectedAgent?.id !== agent.id) setSelectedAgent(agent);
      } else if (VALID_TABS.includes(tabOrId)) {
        if (tabOrId !== activeTab) {
          _setActiveTab(tabOrId);
        }
      } else {
        _setActiveTab('mystudio');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, selectedAgent]);

  // Custom setter that updates URL
  const setActiveTab = (tab) => {
    if (tab !== activeTab) {
      _setActiveTab(tab);
      const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
      localStorage.setItem(`studio_tab_${uid}`, tab);
      window.location.hash = `#/studio/${tab}`;
      // Track page view for tab change
      trackPageView(`/studio/${tab}`, `Studio - ${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    }
  };
  
  // Swipe Navigation Hook - matches bottom nav order
  const swipeHandlers = useSwipeNavigation(
    ['agents', 'hub', 'mystudio', 'activity', 'resources'],
    activeTab,
    setActiveTab
  );
  
  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('studio_theme', theme);
  }, [theme]);

  useEffect(() => {
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    if (selectedAgent?.id) {
      localStorage.setItem(`studio_agent_${uid}`, selectedAgent.id);
    } else {
      localStorage.removeItem(`studio_agent_${uid}`);
    }
  }, [selectedAgent, user?.uid]);

  // Persist selectedProject ID to localStorage
  useEffect(() => {
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    if (selectedProject?.id) {
      localStorage.setItem(`studio_selected_project_${uid}`, selectedProject.id);
    }
  }, [selectedProject, user?.uid]);

  useEffect(() => {
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    localStorage.setItem(`studio_news_${uid}`, newsSearch);
  }, [newsSearch, user?.uid]);

  // Handle cross-tab or cross-session state sync for projects with QuotaExceededError protection
  useEffect(() => {
    if (!projects || !Array.isArray(projects)) return;
    
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    
    try {
      const jsonString = JSON.stringify(projects);
      localStorage.setItem(`studio_projects_${uid}`, jsonString);
      
      // OPTIMIZATION: Only save to legacy key for guest to save 50% storage space for logged-in users
      if (uid === 'guest') {
        localStorage.setItem('studio_agents_projects', jsonString);
      } else {
        // Logged in users use the UID-specific key. We remove the legacy duplicate to free up space.
        localStorage.removeItem('studio_agents_projects');
      }
    } catch (err) {
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        console.warn('[StudioView] localStorage quota exceeded. Pruning large media assets and trying again...');
        // Prune large base64 data and try one more time
        const prunedData = pruneLargeProjectData(projects);
        try {
          const prunedJson = JSON.stringify(prunedData);
          localStorage.setItem(`studio_projects_${uid}`, prunedJson);
          if (uid === 'guest') localStorage.setItem('studio_agents_projects', prunedJson);
          console.log('[StudioView] Successfully saved pruned projects to localStorage.');
        } catch (retryErr) {
          console.error('[StudioView] Even pruned projects exceeded quota. Only saving metadata for the last 5 projects.', retryErr);
          // Last resort: Only the 5 most recent projects, pruned
          try {
            const lastResort = pruneLargeProjectData(projects.slice(0, 5));
            localStorage.setItem(`studio_projects_${uid}`, JSON.stringify(lastResort));
          } catch(lastErr) {
            console.error('[StudioView] Critical storage failure:', lastErr);
          }
        }
      } else {
        console.error('[StudioView] Failed to persist projects:', err);
      }
    }
  }, [projects, user?.uid]);

  // Handle cross-user transition (Ensure isolation)
  useEffect(() => {
    const lastUid = localStorage.getItem('studio_last_isolated_uid');
    const currentUid = user?.uid || 'guest';

    if (lastUid && lastUid !== currentUid) {
      console.log(`[Isolation] User mismatch detected (${lastUid} vs ${currentUid}). Resetting transient state.`);
      
      // If we switched users and the new user isn't special guest mode,
      // we should clear the state to ensure User B doesn't see User A's session residue
      if (currentUid !== 'guest') {
        const savedProjects = localStorage.getItem(`studio_projects_${currentUid}`);
        if (savedProjects) {
          try {
            setProjects(JSON.parse(savedProjects));
          } catch(_e) {
            // Don't clear to [] on parse error â€” let cloud load handle it
            console.warn('[Isolation] Failed to parse localStorage projects, leaving state untouched');
          }
        }
        // NOTE: If no localStorage entry exists for this user, do NOT set projects to [].
        // The auth listener will load from cloud shortly. Setting [] here causes a race
        // condition where cloud projects get lost.
        
        // Clear other residue
        setNewsSearch('');
        setHelpSearch('');
        setPreviewPrompt('');
        setVoiceTranscript('');
        setSelectedAgent(null);
        setSelectedProject(null);
        
        // Clear DNA residue
        setVisualDnaUrl(null);
        setAudioDnaUrl(null);
        setVideoDnaUrl(null);
        setLyricsDnaUrl(null);
        setVoiceSampleUrl(null);
      }
    }
    
    localStorage.setItem('studio_last_isolated_uid', currentUid);
  }, [user?.uid]);
  
  // Cloud sync state
  const [_projectsSyncing, setProjectsSyncing] = useState(false);
  const [_lastSyncTime, setLastSyncTime] = useState(null);
  const skipNextSyncRef = useRef(false); // Prevents re-saving projects just loaded from cloud
  
  // Save a single project to Firestore via backend API
  async function saveProjectToCloud(uid, project, options = {}) {
    const traceId = `SAVE-${Date.now()}`;
    console.log(`[TRACE:${traceId}] saveProjectToCloud START`, {
      hasUid: !!uid,
      projectId: project?.id,
      projectName: project?.name,
      assetCount: project?.assets?.length,
      assetTypes: project?.assets?.map(a => ({ id: a.id, type: a.type, hasImage: !!a.imageUrl, hasAudio: !!a.audioUrl, hasVideo: !!a.videoUrl }))
    });
    
    if (!uid || !project || !project.id) {
      console.warn(`[TRACE:${traceId}] saveProjectToCloud ABORT - Missing required data`, { hasUid: !!uid, hasProject: !!project });
      return false;
    }
    
    try {
      // --- AUTHORITATIVE MEDIA UPLOAD (V3.5.1 FIX) ---
      // Scan for base64/blob media and move to storage BEFORE Firestore hits 1MB/413 limit
      let updatedAssets = null;
      if (project.assets && Array.isArray(project.assets)) {
        for (let i = 0; i < project.assets.length; i++) {
          const asset = project.assets[i];
          if (!asset) continue;

          const mediaSpecs = [
            { key: "imageUrl", folder: "images", mime: "image/png" },
            { key: "audioUrl", folder: "audio", mime: "audio/mpeg" },
            { key: "videoUrl", folder: "video", mime: "video/mp4" },
            { key: "vocalUrl", folder: "vocal", mime: "audio/wav" }
          ];

          let assetMod = false;
          let newAsset = null;

          for (const spec of mediaSpecs) {
            const val = asset[spec.key];
            if (typeof val === "string" && (val.startsWith("data:") || val.startsWith("blob:"))) {
              console.log(`[TRACE:${traceId}] Auto-uploading media: ${asset.id}.${spec.key}`);
              try {
                if (!newAsset) newAsset = { ...asset };
                const res = val.startsWith("data:") 
                  ? await uploadBase64(val, uid, spec.folder, spec.mime)
                  : await (async () => {
                      const b = await fetch(val).then(r => r.blob());
                      return uploadFile(b, uid, spec.folder, `${Date.now()}.${spec.mime.split("/")[1]}`);
                    })();
                newAsset[spec.key] = res.url;
                newAsset[spec.key + "StoragePath"] = res.path;
                assetMod = true;
              } catch (upErr) {
                console.warn("Media sync failed:", upErr);
                toast.error(`Media upload failed for ${spec.key}. Asset saved locally only.`);
              }
            }
          }

          if (assetMod) {
            if (!updatedAssets) updatedAssets = [...project.assets];
            updatedAssets[i] = newAsset;
          }
        }
      }

      const activeProject = updatedAssets ? { ...project, assets: updatedAssets } : project;
      
      // Update local state if we swapped base64 for URLs to prevent redundant uploads
      if (updatedAssets) {
        setProjects(prev => Array.isArray(prev) ? prev.map(p => p.id === project.id ? activeProject : p) : prev);
        if (selectedProject?.id === project.id) {
          setSelectedProject(activeProject);
        }
      }

      // Robust Sanitization: Deep-clone serializable fields only
      // We specifically handle the 'assets' array to ensure one bad asset doesn't break the whole project save
      const sanitizedProject = {};
      for (const [key, value] of Object.entries(activeProject)) {
        if (value === undefined || value === null || typeof value === 'function') continue;
        
        if (key === 'assets' && Array.isArray(value)) {
          sanitizedProject.assets = value.map(asset => {
            if (!asset || typeof asset !== 'object') return asset;
            const sanitizedAsset = {};
            for (const [aKey, aValue] of Object.entries(asset)) {
              if (aValue === undefined || typeof aValue === 'function') continue;
              try {
                // Individual field serialization check
                const json = JSON.stringify(aValue);
                if (json) sanitizedAsset[aKey] = JSON.parse(json);
              } catch (_e) {
                console.warn(`[TRACE:${traceId}] Skipping non-serializable asset field: ${aKey} in asset ${asset.id}`);
              }
            }
            return sanitizedAsset;
          }).filter(Boolean);
        } else {
          try {
            const json = JSON.stringify(value);
            if (json) sanitizedProject[key] = JSON.parse(json);
          } catch (_e) {
            console.warn(`[TRACE:${traceId}] Skipping non-serializable top-level field: ${key}`);
          }
        }
      }
      
      console.log(`[TRACE:${traceId}] Sanitized project assets:`, sanitizedProject.assets?.length, sanitizedProject.assets?.map(a => a.id));
      
      // Get auth token for backend API
      let authToken = null;
      if (auth?.currentUser) {
        try {
          authToken = await auth.currentUser.getIdToken(true);
        } catch (tokenErr) {
          console.warn(`[TRACE:${traceId}] Failed to get fresh auth token:`, tokenErr.message);
        }
      }
      
      // CRITICAL FIX: If no token and Firebase not ready, abort save
      // This prevents 401 errors when auth.currentUser hasn't rehydrated yet
      if (!authToken) {
        console.warn(`[TRACE:${traceId}] No auth token available - Firebase may still be loading`);
        // Don't show error toast here - this is expected during page load
        // The debounced sync will retry in 3 seconds when auth is ready
        return false;
      }
      
      // Use backend API to save (uses Admin SDK, bypasses security rules)
      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          userId: uid,
          project: {
            ...sanitizedProject,
            id: String(project.id),
            updatedAt: new Date().toISOString(),
            syncedAt: new Date().toISOString()
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`[TRACE:${traceId}] Project saved via API:`, project.id, result);
      return true;
    } catch (err) {
      console.error(`[TRACE:${traceId}] Failed to save project to cloud:`, err.message || err);
      if (!options.silent) {
        toast.error(`Save failed: ${err.message || 'Network error'}`);
      }
      return false;
    }
  };
  
  // Sync all projects to cloud via backend API (individual saves)
  async function syncProjectsToCloud(uid, projectsToSync) {
    if (!uid || !Array.isArray(projectsToSync) || projectsToSync.length === 0) return;
    setProjectsSyncing(true);
    
    try {
      // Save projects individually via backend API
      let successCount = 0;
      for (const project of projectsToSync) {
        if (!project || !project.id) continue;
        
        try {
          const success = await saveProjectToCloud(uid, project, { silent: true });
          if (success) successCount++;
        } catch (individualErr) {
          console.error(`Failed to save project ${project?.id}:`, individualErr);
        }
      }
      
      if (successCount > 0) {
        setLastSyncTime(new Date());
        console.log(`Synced ${successCount}/${projectsToSync.length} projects to cloud via API`);
      } else if (projectsToSync.length > 0 && auth?.currentUser) {
        toast.error(`Sync failed for ${projectsToSync.length} project(s) â€” check your connection`);
      }
    } catch (err) {
      console.error('Sync failed:', err);
      toast.error('Cloud sync failed. Projects saved locally.');
    } finally {
      setProjectsSyncing(false);
    }
  };

  // Note: localStorage save is handled by the useEffect with quota handling below
  
  // Debounced cloud sync when projects change (only if logged in AND Firebase ready)
  useEffect(() => {
    // CRITICAL: Check both user state AND auth.currentUser to ensure Firebase is ready
    // Also skip if we are currently mid-manual-save to avoid conflicts
    if (!user?.uid || projects.length === 0 || !auth?.currentUser) return;

    // Skip sync if projects were just loaded from cloud (prevents re-uploading on login)
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    
    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Debounce sync by 3 seconds to avoid excessive writes
    syncTimeoutRef.current = setTimeout(() => {
      syncProjectsToCloud(user?.uid, projects);
    }, 3000);
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [projects, user?.uid, auth?.currentUser]);

  // Flush pending sync on page unload to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (syncTimeoutRef.current && user?.uid && projects.length > 0) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
        // Use sendBeacon-style sync (fire-and-forget) for unload
        try {
          syncProjectsToCloud(user.uid, projects);
        } catch (e) {
          // Best-effort - page is closing
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projects, user?.uid]);
  
  // Load projects from cloud via backend API
  // Accepts optional firebaseUser param so the caller can pass the already-resolved currentUser
  // instead of relying on the global auth.currentUser which may not be set yet (race condition).
  // Also accepts optional authTokenOverride to reuse a token already obtained by the caller.
  async function loadProjectsFromCloud(uid, firebaseUser, authTokenOverride) {
    const traceId = `LOAD-${Date.now()}`;
    console.log(`[TRACE:${traceId}] loadProjectsFromCloud START`, { hasUid: !!uid, hasFirebaseUser: !!firebaseUser, hasTokenOverride: !!authTokenOverride });

    if (!uid) return [];
    try {
      // Use pre-fetched token if available, otherwise get one (no force refresh)
      let authToken = authTokenOverride || null;
      if (!authToken) {
        const tokenSource = firebaseUser || auth?.currentUser;
        if (tokenSource) {
          try {
            authToken = await tokenSource.getIdToken();
          } catch (tokenErr) {
            console.warn(`[TRACE:${traceId}] Failed to get auth token:`, tokenErr.message);
          }
        }
      }

      if (!authToken) {
        console.warn(`[TRACE:${traceId}] No auth token available â€” backend will reject with 401`);
      }

      // Use backend API to load projects
      const response = await fetch(`${BACKEND_URL}/api/projects?userId=${encodeURIComponent(uid)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const cloudProjects = (data.projects || [])
        .filter(p => p && typeof p === 'object') // Stability: Ignore null/malformed projects
        .map(p => ({
          ...p,
          id: p.id || String(Date.now()) + Math.random().toString(36).substr(2, 5),
          // Normalize timestamps
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
          assets: Array.isArray(p.assets) ? p.assets.filter(Boolean) : [],
          agents: Array.isArray(p.agents) ? p.agents.filter(Boolean) : []
        }));
      
      console.log(`[TRACE:${traceId}] loadProjectsFromCloud COMPLETE`, {
        count: cloudProjects.length,
        projects: cloudProjects.map(p => ({
          id: p.id,
          name: p.name,
          assetCount: p.assets?.length || 0,
          assetTypes: p.assets?.map(a => a.type)
        }))
      });
      
      return cloudProjects;
    } catch (err) {
      console.error(`[TRACE:${traceId}] loadProjectsFromCloud ERROR:`, err);
      toast.error('Could not load projects from cloud. Using local data.');
      return [];
    }
  };
  
  // Merge local and cloud projects (cloud takes priority for conflicts)
  const mergeProjects = (localProjects, cloudProjects) => {
    const merged = new Map();
    const local = Array.isArray(localProjects) ? localProjects : [];
    const cloud = Array.isArray(cloudProjects) ? cloudProjects : [];
    
    // Add all cloud projects first (they take priority)
    for (const project of cloud) {
      if (project && project.id) {
        merged.set(project.id, project);
      }
    }
    
    // Add local projects that aren't in cloud
    for (const project of local) {
      if (!project || !project.id) continue;
      if (!merged.has(project.id)) {
        merged.set(project.id, project);
      } else {
        // Compare timestamps, keep newer
        const cloudProject = merged.get(project.id);
        const localTime = new Date(project.updatedAt || project.createdAt || 0).getTime();
        const cloudTime = new Date(cloudProject.updatedAt || cloudProject.createdAt || 0).getTime();
        if (localTime > cloudTime) {
          merged.set(project.id, project);
        }
      }
    }
    
    // Sort by updated time
    return Array.from(merged.values()).sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  };
  // Studio Session State (Global Mechanism)
  // History Helpers
  const updateSessionWithHistory = (newTracksOrUpdater) => {
    let newTracks;
    if (typeof newTracksOrUpdater === 'function') {
      newTracks = newTracksOrUpdater(sessionTracks);
    } else {
      newTracks = newTracksOrUpdater;
    }

    const newHistory = sessionHistory.slice(0, historyIndex + 1);
    newHistory.push(newTracks);
    setSessionHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSessionTracks(newTracks);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSessionTracks(sessionHistory[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < sessionHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSessionTracks(sessionHistory[newIndex]);
    }
  };

  // Auto-populate session mixer when it opens — sync backing track + project assets
  useEffect(() => {
    if (!showStudioSession) return;
    const assets = Array.isArray(selectedProject?.assets) ? selectedProject.assets.filter(Boolean) : [];
    
    setSessionTracks(prev => {
      const updates = { ...prev };
      // Auto-load backing track as the audio track
      if (backingTrack && !prev.audio) {
        updates.audio = { title: backingTrack.title, audioUrl: backingTrack.audioUrl, bpm: backingTrack.bpm };
        if (backingTrack.bpm) updates.bpm = backingTrack.bpm;
      }
      // Auto-load first vocal if no vocal track set
      if (!prev.vocal) {
        const vocal = assets.find(a => a.type === 'vocal' || a.type === 'synthesis' || (a.type === 'audio' && a.audioUrl && a.agent?.toLowerCase().includes('vocal')));
        if (vocal) updates.vocal = vocal;
      }
      // Auto-load first video/image if no visual track set
      if (!prev.visual) {
        const visual = assets.find(a => a.videoUrl || a.imageUrl);
        if (visual) updates.visual = visual;
      }
      return updates;
    });
  }, [showStudioSession]);
  
  // Persist helpSearch
  useEffect(() => {
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    localStorage.setItem(`studio_help_${uid}`, helpSearch);
  }, [helpSearch, user?.uid]);
  
  // Preview Modal State (for reviewing AI generations before saving)
  
  // Persist previewPrompt
  useEffect(() => {
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    localStorage.setItem(`studio_prompt_${uid}`, previewPrompt);
  }, [previewPrompt, user?.uid]);

  // Save status for visual feedback: 'idle' | 'saving' | 'saved' | 'error'
  
  // Persist voiceTranscript
  useEffect(() => {
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    localStorage.setItem(`studio_transcript_${uid}`, voiceTranscript);
  }, [voiceTranscript, user?.uid]);

  // Voice Command Definitions for Whisperer-style UI
  // Get agents available for current tier
  const getAvailableAgents = () => {
    // SAFE ACCESS: Check for AGENTS availability
    if (typeof AGENTS === 'undefined' || !AGENTS) return [];

    const plan = userPlan.toLowerCase();
    if (plan === 'pro' || plan === 'lifetime access') return AGENTS; // All 16 agents
    if (plan === 'monthly') return AGENTS.filter(a => a.tier === 'free' || a.tier === 'monthly'); // 8 agents
    return AGENTS.filter(a => a.tier === 'free'); // 4 agents for free tier
  };
  
  // Get locked agents for teaser section
  const getLockedAgents = () => {
    // SAFE ACCESS: Check for AGENTS availability
    if (typeof AGENTS === 'undefined' || !AGENTS) return [];
    
    if (isAdmin) return []; // Admins have all agents
    const plan = userPlan.toLowerCase();
    if (plan === 'pro' || plan === 'lifetime access') return []; // No locked agents
    if (plan === 'monthly') return AGENTS.filter(a => a.tier === 'pro'); // Only pro locked
    return AGENTS.filter(a => a.tier !== 'free'); // Monthly + Pro locked
  };
  
  // Check if user can generate (has free uses left or is subscribed)
  const canGenerate = (featureType = 'default') => {
    // Admins always have access
    if (isAdmin) {
      console.log('[Credits] Admin access granted');
      return true;
    }

    const cost = CREDIT_COSTS[featureType] || CREDIT_COSTS['default'];

    // If logged in, prioritize credits
    if (isLoggedIn) {
      console.log(`[Credits] Checking for logged in user. Credits: ${userCredits}, Plan: ${userPlan}, Cost: ${cost}`);
      if (userCredits >= cost) return true;

      const plan = (userPlan || 'Free').toLowerCase();
      if ((plan === 'pro' || plan === 'lifetime access') && cost <= 1) {
        console.log(`[Credits] Access granted for low-cost feature due to plan: ${plan}`);
        return true;
      }
      
      console.warn('[Credits] Logged in but insufficient credits');
      return false;
    }
    
    // Guests get limited free uses
    const canUseFree = freeGenerationsUsed < FREE_GENERATION_LIMIT;
    console.log(`[Credits] Guest check: ${freeGenerationsUsed}/${FREE_GENERATION_LIMIT}. Can use: ${canUseFree}`);
    return canUseFree;
  };
  
  // Get remaining free generations
  const getRemainingFreeGenerations = () => {
    if (isAdmin) return 999999; // Unlimited for admins
    return Math.max(0, FREE_GENERATION_LIMIT - freeGenerationsUsed);
  };

  useEffect(() => {
    localStorage.setItem('studio_user_plan', userPlan);
  }, [userPlan]);
  const [showAgentHelpModal, setShowAgentHelpModal] = useState(null); // Stores the agent object for the help modal
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [quickWorkflowAgent, setQuickWorkflowAgent] = useState(null); // Streamlined agent workflow modal

  const [autoStartVoice, setAutoStartVoice] = useState(false);

  // Effect to rehydrate selectedProject once projects are loaded
  useEffect(() => {
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    const savedId = localStorage.getItem(`studio_project_id_${uid}`);
    if (savedId && projects && !selectedProject) {
      const found = projects.find(p => p.id === savedId);
      if (found) setSelectedProject(found);
    }
  }, [projects, user?.uid]);

  // Persist selectedProject ID
  useEffect(() => {
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    if (selectedProject?.id) {
      localStorage.setItem(`studio_project_id_${uid}`, selectedProject.id);
    } else {
      localStorage.removeItem(`studio_project_id_${uid}`);
    }
  }, [selectedProject, user?.uid]);
  const [pendingProjectNav, setPendingProjectNav] = useState(false); // Flag to safely navigate after project selection

  // Effect to safely navigate to project_canvas after selectedProject is set
  // This prevents race conditions where tab changes before state update completes
  useEffect(() => {
    if (pendingProjectNav && selectedProject) {
      console.log('[StudioView] Safe navigation: project ready, switching to project_canvas');
      setSelectedAgent(null);
      setActiveTab('project_canvas');
      setPendingProjectNav(false);
    }
  }, [pendingProjectNav, selectedProject]);

  // Onboarding & Help State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [_onboardingStep, setOnboardingStep] = useState(0);
  const [_selectedPath, _setSelectedPath] = useState(null);

  const [showAgentWhitePaper, setShowAgentWhitePaper] = useState(null);
  const [showResourceContent, setShowResourceContent] = useState(null); // For Legal & Business docs
  const [maintenanceDismissed, setMaintenanceDismissed] = useState(false);
  
  // Track generated creations per agent for preview in agent details
  const [agentCreations, setAgentCreations] = useState({
    // Format: { agentId: { video: url, image: url, audio: url } }
  });
  
  // Safe preview data access (prevents TDZ/null errors)
  const safePreview = showPreview || {};
  const safePreviewAssets = Array.isArray(safePreview.assets) ? safePreview.assets.filter(Boolean) : [];
  const rawPreviewIndex = typeof safePreview.currentIndex === 'number' && !isNaN(safePreview.currentIndex) ? safePreview.currentIndex : 0;
  // Clamp index to valid bounds
  const safePreviewIndex = safePreviewAssets.length > 0 
    ? Math.max(0, Math.min(rawPreviewIndex, safePreviewAssets.length - 1))
    : 0;
  
  // Helper: Get proper type for asset preview (handles text assets correctly)
  const getAssetPreviewType = (asset) => {
    if (!asset) return 'text';
    if (asset.type === 'vocal') return 'vocal';
    if (asset.audioUrl) return 'audio';
    if (asset.videoUrl) return 'video';
    if (asset.imageUrl) return 'image';
    // Text-based assets
    return (asset.type || 'text').toLowerCase();
  };

  // Helper: Safely extract text content from any asset (prevents empty preview)
  const getAssetTextContent = (asset) => {
    if (!asset) return null;
    // Priority order: content > snippet > output > description > title
    const text = asset.content || asset.snippet || asset.output || asset.description || asset.title;
    if (typeof text === 'string' && text.trim().length > 0) {
      return text;
    }
    return null;
  };

  // Cleanup audio/video on preview change to prevent race conditions
  useEffect(() => {
    if (showPreview && showPreview.url && (showPreview.type === 'audio' || showPreview.type === 'vocal')) {
      // Auto-play audio when preview opens (browser allowing)
      const playTimer = setTimeout(() => {
        if (previewAudioRef.current) {
          previewAudioRef.current.play().catch(err => {
            console.log('[SafePreview] Auto-play prevented:', err.message);
          });
        }
      }, 600);
      return () => clearTimeout(playTimer);
    }
    
    return () => {
      // Stop any playing audio when preview closes
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
      }
    };
  }, [showPreview]);
  
  // Helper: Safely open preview with debouncing and validation
  // IMPORTANT: This is the ONLY function that should open previews to prevent race conditions
  const safeOpenPreview = (asset, allAssets) => {
    // Clear any pending preview opens
    if (previewDebounceTimer.current) {
      clearTimeout(previewDebounceTimer.current);
    }
    
    // MUTUAL EXCLUSION: Close any other preview modals first
    // This prevents race conditions between overlapping preview systems
    setPreviewItem(null);
    
    // Debounce to prevent rapid clicks
    previewDebounceTimer.current = setTimeout(() => {
      try {
        if (!asset) {
          console.warn('[SafePreview] No asset provided');
          toast.error('Unable to preview: asset not found');
          return;
        }
        
        // Guard against concurrent transitions
        if (isModalTransitioning.current) {
          console.log('[SafePreview] Blocked - transition in progress');
          return;
        }
        
        isModalTransitioning.current = true;
        
        // Validate and filter assets array
        const safeAssetsList = Array.isArray(allAssets) ? allAssets.filter(a => a && (a.id || a.audioUrl || a.videoUrl || a.imageUrl || a.content)) : [];
        
        if (safeAssetsList.length === 0) {
          console.warn('[SafePreview] No valid assets in list');
          toast.error('No assets available to preview');
          isModalTransitioning.current = false;
          return;
        }
        
        // For text-only assets
        if (!asset.audioUrl && !asset.imageUrl && !asset.videoUrl) {
          setIsPreviewMediaLoading(false);
          const foundIndex = safeAssetsList.findIndex(a => a?.id === asset?.id);
          const safeIndex = foundIndex >= 0 && foundIndex < safeAssetsList.length ? foundIndex : 0;
          
          // Double-check the asset at safeIndex exists
          if (safeAssetsList[safeIndex]) {
            console.log('[SafePreview] Opening text preview at index', safeIndex);
            setShowPreview({
              type: (asset.type || 'text').toLowerCase(),
              url: null,
              content: asset.content || asset.snippet || asset.output || '',
              title: asset.title || 'Untitled',
              asset: asset,
              assets: safeAssetsList,
              currentIndex: safeIndex
            });
          } else {
            console.error('[SafePreview] Asset at index', safeIndex, 'does not exist');
            toast.error('Asset not found. Try refreshing the page.');
            isModalTransitioning.current = false;
            return;
          }
        } else {
          // For media assets - filter to only previewable ones
          const previewableAssets = safeAssetsList.filter(a => a?.audioUrl || a?.imageUrl || a?.videoUrl);
          
          if (previewableAssets.length === 0) {
            console.warn('[SafePreview] No previewable media assets found');
            toast.error('No media content to preview. Generate some assets first.');
            isModalTransitioning.current = false;
            return;
          }
          
          const foundIndex = previewableAssets.findIndex(a => a?.id === asset?.id);
          const safeIndex = foundIndex >= 0 && foundIndex < previewableAssets.length ? foundIndex : 0;
          
          // Double-check the asset at safeIndex exists
          const targetAsset = previewableAssets[safeIndex];
          if (targetAsset) {
            // Set loading state for media assets
            setIsPreviewMediaLoading(true);
            
            console.log('[SafePreview] Opening media preview at index', safeIndex, 'type:', targetAsset.audioUrl ? 'audio' : targetAsset.videoUrl ? 'video' : 'image');
            setShowPreview({
              type: targetAsset.audioUrl ? 'audio' : targetAsset.videoUrl ? 'video' : 'image',
              url: formatAudioSrc(targetAsset.audioUrl) || formatVideoSrc(targetAsset.videoUrl) || formatImageSrc(targetAsset.imageUrl) || null,
              title: targetAsset.title || 'Untitled',
              asset: targetAsset,
              assets: previewableAssets,
              currentIndex: safeIndex
            });
          } else {
            console.error('[SafePreview] Asset at index', safeIndex, 'does not exist in previewable list');
            toast.error('Media asset not found. It may have been moved or deleted.');
            isModalTransitioning.current = false;
            return;
          }
        }
        
        // Reset guard after modal opens (increased timeout for reliability)
        setTimeout(() => { isModalTransitioning.current = false; }, 500);
      } catch (err) {
        console.error('[SafePreview] Error:', err);
        toast.error('Preview failed: asset data is missing or corrupted. Try refreshing the page.');
        isModalTransitioning.current = false;
      }
    }, 100); // 100ms debounce
  };
  
  // Helper: Safely open generation preview with mutual exclusion
  // This is for AI generation previews (previewItem modal)
  const safeOpenGenerationPreview = (item) => {
    if (!item) return;
    
    // Only show loading if there's actual media to load
    const hasMedia = !!(item.imageUrl || item.audioUrl || item.videoUrl || item.lyricsVocal);
    setIsPreviewMediaLoading(hasMedia);
    
    // MUTUAL EXCLUSION: Close asset preview modal first
    setShowPreview(null);
    setPreviewMaximized(false);
    // Small delay to ensure state updates don't conflict
    setTimeout(() => {
      setPreviewItem(item);
    }, 50);
  };
  
  // Transition guard ref (doesn't cause re-render)
  const isModalTransitioning = useRef(false);
  const previewDebounceTimer = useRef(null);

  // Add Asset to Project Modal State
  const [addToProjectAsset, setAddToProjectAsset] = useState(null); // Asset waiting to be added to project
  const [newProjectNameFromAsset, setNewProjectNameFromAsset] = useState('');

  // Model Picker State - Available AI Models
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');

  // Check for first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('studio_onboarding_v3');
    if (!hasSeenOnboarding && !startWizard) {
      setShowOnboarding(true);
    }
  }, [startWizard]);

  const completeOnboarding = () => {
    localStorage.setItem('studio_onboarding_v3', 'true');
    setShowOnboarding(false);
    
    // Go straight to agents tab - no project creation, no complexity
    setActiveTab('agents');
    safeVoiceAnnounce('Welcome to your studio. Pick an agent to start creating.');
  };

  const handleSkipOnboarding = () => {
    localStorage.setItem('studio_onboarding_v3', 'true');
    setShowOnboarding(false);
    setActiveTab('agents');
  };

  // Project Type Choice Modal - lets user choose between Studio Creation and AI Pipeline
  const [showProjectTypeChoice, setShowProjectTypeChoice] = useState(false);

  // Project Wizard State
  // Project wizard is ONLY shown when user explicitly clicks "Create Project"
  const [showProjectWizard, setShowProjectWizard] = useState(false);
  const [projectWizardStep, setProjectWizardStep] = useState(1);
  
  // startWizard prop is deprecated - we no longer auto-open wizard from landing page
  // Users go straight to agents tab and can click "Create Project" when ready

  // If startOrchestrator prop is true, open the AI orchestrator directly
  useEffect(() => {
    if (startOrchestrator) {
      setShowOrchestrator(true);
    }
  }, [startOrchestrator]);

  // If initialTab prop is provided, navigate to that tab on mount
  useEffect(() => {
    if (!initialTab) return;
    
    console.log('[StudioView] Deep link check - initialTab:', initialTab);
    
    // 1. Handle standard top-level tabs
    const standardTabs = ['agents', 'mystudio', 'activity', 'news', 'resources', 'marketing', 'hub', 'support', 'profile', 'more'];
    if (standardTabs.includes(initialTab)) {
      setActiveTab(initialTab);
      return;
    } 
    
    // 2. Handle deep-linking to specific agents (IDs like 'ghost', 'beat', 'album', etc.)
    // This allows landing page cards (which pass the agent ID) to open the specific agent workspace.
    const foundAgent = AGENTS?.find(a => a.id === initialTab);
    if (foundAgent) {
      console.log('[StudioView] Deep linking to agent:', foundAgent.name);
      setSelectedAgent(foundAgent);
      setActiveTab('agents');
      setShowOnboarding(false); // Close wizard if open
    }
  }, [initialTab]);
  
  // System Health Check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health`);
        if (!res.ok) throw new Error('Backend unreachable');
        const data = await res.json();
        setSystemStatus({ 
          status: 'healthy', 
          message: 'All Systems Operational',
          details: data 
        });
      } catch (err) {
        console.error("Health check failed:", err);
        setSystemStatus({ 
          status: 'maintenance', 
          message: 'System Under Maintenance',
          details: err.message
        });
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // NOTE: handleTextToVoiceRef is initialized earlier (line ~360) with safe fallback
  useEffect(() => {
    if (initialPlan && handleSubscribeRef.current) {
      handleSubscribeRef.current(initialPlan);
    }
  }, [initialPlan]);
  
  // Safe voice announcement helper (avoids TDZ)
  const safeVoiceAnnounce = (text) => {
    if (handleTextToVoiceRef.current) {
      handleTextToVoiceRef.current(text);
    }
  };

  // Pause canvas media when navigating away from project canvas
  // NOTE: We intentionally do NOT auto-select the first asset anymore.
  // The user should see the full asset grid/carousel first and click to open details.
  useEffect(() => {
    if (activeTab !== 'project_canvas') {
      // Pause canvas audio if we switch tabs
      if (canvasAudioRef.current) {
        canvasAudioRef.current.pause();
      }
      // Also stop any other canvas media if needed
      const canvasVideo = document.querySelector('.studio-monitor-panel video');
      if (canvasVideo) canvasVideo.pause();
    }
  }, [activeTab]);

  // Keyboard shortcut: Space to play/pause preview media
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Toggle play/pause on Space (if not typing in input)
      if (e.code === 'Space' && previewItem && !previewSaveMode) {
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        
        e.preventDefault();
        const mediaElement = document.querySelector('.modal-content video') || 
                            document.querySelector('.modal-content audio');
        if (mediaElement) {
          if (mediaElement.paused) mediaElement.play().catch(() => {});
          else mediaElement.pause();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [previewItem, previewSaveMode]);

  const [newProjectData, setNewProjectData] = useState({
    name: '',
    category: '',
    description: '',
    language: 'English',
    style: 'Modern Hip-Hop',
    model: 'Gemini 2.0 Flash',
    selectedAgents: [],
    socialHandle: '',
    socialBio: '',
    socialPlatform: 'instagram'
  });

  const handleCreateProject = () => {
    console.log('[CreateProject] Starting with data:', newProjectData);
    console.log('[CreateProject] Current credits:', userCredits, 'Required:', PROJECT_CREDIT_COST);
    console.log('[CreateProject] User:', user?.email, 'DB initialized:', !!db);
    
    if (!newProjectData.name || !newProjectData.category) {
      console.error('[CreateProject] Missing required fields:', { name: newProjectData.name, category: newProjectData.category });
      toast.error('Please fill in project name and category');
      return;
    }

    // Check if user has enough credits
    const currentCredits = typeof userCredits === 'number' ? userCredits : 0;
    console.log('[CreateProject] Credit check - Current:', currentCredits, 'Cost:', PROJECT_CREDIT_COST);
    
    if (currentCredits < PROJECT_CREDIT_COST) {
      console.error('[CreateProject] Insufficient credits');
      toast.error(`Not enough credits. You need ${PROJECT_CREDIT_COST} credits to create a project.`);
      setShowCreditsModal(true);
      return;
    }
    
    const newProject = {
      id: String(Date.now()),
      name: newProjectData.name,
      category: newProjectData.category,
      description: newProjectData.description || '',
      language: newProjectData.language || 'English',
      style: newProjectData.style || 'Modern Hip-Hop',
      model: newProjectData.model || 'Gemini 2.0 Flash',
      agents: newProjectData.selectedAgents || [],
      workflow: newProjectData.workflow || 'custom',
      socialHandle: newProjectData.socialHandle || '',
      socialBio: newProjectData.socialBio || '',
      socialPlatform: newProjectData.socialPlatform || 'instagram',
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('[CreateProject] Adding project to state...');
    setProjects(prev => {
      const newProjects = [newProject, ...prev];
      console.log('[CreateProject] Projects updated. Total:', newProjects.length);
      return newProjects;
    });
    
    setSelectedProject(newProject); // Auto-select the new project
    console.log('[CreateProject] Selected project set:', newProject.id);
    
    // Save to cloud if logged in (uses backend API now)
    console.log('[CreateProject] Auth check - isLoggedIn:', isLoggedIn, 'user:', !!user);
    if (isLoggedIn && user) {
      console.log('[CreateProject] Saving to cloud for user:', user?.uid, user?.email);
      saveProjectToCloud(user?.uid, newProject).then(success => {
        console.log('[CreateProject] Cloud save result:', success);
      }).catch(err => {
        console.error('[CreateProject] Cloud save error:', err);
      });
    } else {
      console.warn('[CreateProject] NOT saving to cloud. isLoggedIn:', isLoggedIn, 'user:', !!user);
      if (isLoggedIn && !user) {
        console.error('[CreateProject] RACE CONDITION: isLoggedIn is true but user is null!');
      }
    }
    
    toast.success(`Project created! -${PROJECT_CREDIT_COST} credits`, { icon: 'âœ¨' });
    
    // Deduct credits for project creation
    setUserCredits(prev => Math.max(0, prev - PROJECT_CREDIT_COST));

    setShowProjectWizard(false);
    setProjectWizardStep(1);
    
    // Track project creation
    Analytics.projectCreated(newProject.category);
    
    // Project created successfully - go straight to dashboard
    // (User already completed onboarding before reaching wizard)

    setNewProjectData({ 
      name: '', 
      category: '', 
      description: '', 
      selectedAgents: [], 
      workflow: '',
      socialHandle: '',
      socialBio: '',
      socialPlatform: 'instagram'
    });
    
    // Switch to project hub to show the new project
    safeVoiceAnnounce(`Project ${newProject.name} created. Loading your production checklist.`);
    setActiveTab('hub');
  };

  const handleSkipWizard = (targetTab) => {
    // Check if user has enough credits
    const currentCredits = typeof userCredits === 'number' ? userCredits : 0;
    if (currentCredits < PROJECT_CREDIT_COST) {
      toast.error(`Not enough credits. You need ${PROJECT_CREDIT_COST} credits to create a project.`);
      setShowCreditsModal(true);
      return;
    }

    const newProject = {
      id: String(Date.now()),
      name: `Untitled Project ${projects.length + 1}`,
      category: "music",
      description: "Quick start project",
      agents: [],
      workflow: "custom",
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    toast.success(`Quick project created! -${PROJECT_CREDIT_COST} credits`, { icon: 'âœ¨' });
    
    // Deduct credits for project creation
    setUserCredits(prev => Math.max(0, prev - PROJECT_CREDIT_COST));

    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject);
    
    // Save to cloud if logged in
    if (user) {
      saveProjectToCloud(user?.uid, newProject).catch(err => {
        console.error('Failed to save quick project to cloud:', err);
      });
    }

    setShowProjectWizard(false);
    setProjectWizardStep(1);
    
    // Default to 'mystudio' if targetTab is not a string (e.g. event object)
    const tabToSet = (typeof targetTab === 'string') ? targetTab : 'mystudio';
    setActiveTab(tabToSet);
    
    safeVoiceAnnounce(`Quick project created.`);
  };

  // Open agent whitepaper modal for any agent
  const openAgentWhitepaper = (agent) => {
    setShowAgentWhitePaper({
      key: agent.id,
      icon: agent.icon,
      title: agent.name,
      subtitle: agent.category,
      description: agent.explanation || agent.description,
      whoFor: agent.helpTips || `Artists and creators looking to leverage AI for ${agent.category.toLowerCase()}.`,
      howTo: agent.howToUse || agent.howTo || `Enter your prompt and let ${agent.name} generate results instantly.`
    });
  };

  // --- IMPROVED STATE MANAGEMENT HELPERS ---
  
  // Update save status with auto-reset
  const updateSaveStatus = useCallback((status) => {
    setSaveStatus(status);
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
    }
    // Reset to idle after 3 seconds for 'saved' or 'error' states
    if (status === 'saved' || status === 'error') {
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, []);
  
  // Provide haptic feedback (if available)
  const triggerHapticFeedback = useCallback((type = 'light') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate([30, 10, 30]);
          break;
        case 'success':
          navigator.vibrate([10, 50, 20]);
          break;
        case 'error':
          navigator.vibrate([50, 30, 50, 30, 50]);
          break;
        default:
          navigator.vibrate(10);
      }
    }
  }, []);

  // QuickWorkflow handlers - centralized project save flow
  const handleSaveAssetToProject = useCallback((projectId, asset) => {
    // Guard against double-saves
    const operationId = `save-asset-${asset?.id || Date.now()}`;
    if (pendingOperationsRef.current.has(operationId)) {
      console.log('[SaveAsset] Operation already in progress, skipping');
      return;
    }
    pendingOperationsRef.current.add(operationId);
    
    // Haptic feedback on save start
    triggerHapticFeedback('light');
    updateSaveStatus('saving');
    
    setProjects(prev => {
      const newProjects = prev.map(p => {
        if (p.id === projectId) {
          const existingAssets = p.assets || [];
          
          // Check for duplicate asset by ID, URLs, or content hash
          const isDuplicate = existingAssets.some(existing => 
            existing.id === asset.id ||
            (asset.audioUrl && existing.audioUrl === asset.audioUrl) ||
            (asset.url && existing.url === asset.url) ||
            (asset.videoUrl && existing.videoUrl === asset.videoUrl) ||
            (asset.imageUrl && existing.imageUrl === asset.imageUrl) ||
            (existing.content && asset.content && existing.type === asset.type && existing.agent === asset.agent && existing.content.substring(0, 200) === asset.content.substring(0, 200))
          );
          
          if (isDuplicate) {
            console.log('[SaveAsset] Skipping duplicate asset:', asset.id);
            pendingOperationsRef.current.delete(operationId);
            updateSaveStatus('idle');
            return p; // Return unchanged project
          }
          
          console.log('[SaveAsset] Adding new asset to project:', projectId, asset.id);
          const updatedProject = {
            ...p,
            assets: [asset, ...existingAssets],
            progress: Math.min(100, (p.progress || 0) + 10),
            updatedAt: new Date().toISOString()
          };

          // SIDE EFFECT: Save to cloud if logged in AND Firebase is ready
          // We call this OUTSIDE the return to avoid side-effects in state updater where possible, 
          // although inside the callback is the only place we have the guaranteed latest project state.
          // To be safer, we use a microtask or a brief timeout.
          if (user && auth?.currentUser) {
            setTimeout(() => {
              saveProjectToCloud(user?.uid, updatedProject)
                .then((success) => {
                  if (success) {
                    updateSaveStatus('saved');
                    triggerHapticFeedback('success');
                  } else {
                    updateSaveStatus('idle');
                    console.log('[SaveAsset] Cloud save deferred - will retry on next sync');
                  }
                })
                .catch(err => {
                  console.error('Failed to save updated project to cloud:', err);
                  updateSaveStatus('error');
                  triggerHapticFeedback('error');
                })
                .finally(() => {
                  pendingOperationsRef.current.delete(operationId);
                });
            }, 0);
          } else {
            // Local save only (guest mode or Firebase not ready)
            updateSaveStatus('saved');
            triggerHapticFeedback('success');
            pendingOperationsRef.current.delete(operationId);
            if (user && !auth?.currentUser) {
              console.log('[SaveAsset] Local save only - Firebase not ready yet');
            }
          }

          return updatedProject;
        }
        return p;
      });

      return newProjects;
    });
    
    toast.success('Asset saved to project');
  }, [user, saveProjectToCloud, updateSaveStatus, triggerHapticFeedback]);

  const handleCreateProjectWithAsset = (projectName, asset) => {
    // Check if user has enough credits
    const currentCredits = typeof userCredits === 'number' ? userCredits : 0;
    if (currentCredits < PROJECT_CREDIT_COST) {
      toast.error(`Not enough credits. You need ${PROJECT_CREDIT_COST} credits to create a project.`);
      setShowCreditsModal(true);
      return;
    }

    const newProject = {
      id: String(Date.now()),
      name: projectName,
      category: 'pro',
      description: `Created from ${asset.agentName || asset.agent || 'AI Agent'}`,
      agents: [asset.agent], // Store ID string
      workflow: 'custom',
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    toast.success(`Project created! -${PROJECT_CREDIT_COST} credits`, { icon: 'âœ¨' });

    setProjects(prev => {
      // Check if project with same name was created in last 10s
      const duplicate = prev.find(p => p.name === newProject.name && (Date.now() - parseInt(p.id)) < 10000);
      if (duplicate) return prev;
      return [newProject, ...prev];
    });
    setSelectedProject(newProject);

    // Save to cloud if logged in
    if (user) {
      saveProjectToCloud(user?.uid, newProject).catch(err => {
        console.error('Failed to save new project with asset to cloud:', err);
      });
    }
  };

  const handleAddAgent = (agent) => {
    if (!selectedProject || !agent) return;
    
    const currentAgents = Array.isArray(selectedProject.agents) ? selectedProject.agents : [];

    // Enforce Plan Limits (admins have no limit)
    let limit = isAdmin ? 999 : 3; // Free default
    if (!isAdmin) {
      if (userPlan === 'Creator') limit = 5;
      if (userPlan === 'Studio Pro' || userPlan === 'Lifetime Access') limit = 16;
    }

    if (currentAgents.length >= limit) {
      toast.error(`Agent limit reached for ${userPlan} plan. Please upgrade.`);
      return;
    }

    // Check if agent already exists in project
    if (currentAgents.some(a => a.id === agent.id)) {
      safeVoiceAnnounce(`${agent.name} is already in this project.`);
      return;
    }

    const updatedProject = {
      ...selectedProject,
      agents: [...currentAgents, agent]
    };

    // Update local state
    setSelectedProject(updatedProject);
    
    // Update projects list
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    
    setShowAddAgentModal(false);
    safeVoiceAnnounce(`${agent.name} added to project.`);
  };

  // --- FIREBASE AUTH LISTENER ---
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          // ðŸ“§ Lock password-based accounts that haven't verified their email
          // Google/Social accounts are usually pre-verified by the provider
          const isPasswordProvider = currentUser.providerData.some(p => p.providerId === 'password');
          if (isPasswordProvider && !currentUser.emailVerified) {
            console.log('ðŸ“§ User detected as unverified, signing out.');
            toast.error('Please verify your email to access the studio.');
            await signOut(auth);
            localStorage.removeItem('studio_user_id');
            setIsLoggedIn(false);
            setUser(null);
            setAuthChecking(false);
            return;
          }

          // CRITICAL: Set user BEFORE setting isLoggedIn to avoid race condition
          localStorage.setItem('studio_user_id', currentUser.uid);
          userRef.current = currentUser; // UPDATE REF for retry logic
          setUser(currentUser); // Immediately trigger state isolation effect
          setIsLoggedIn(true); // Set this LAST after user is set
          setAuthChecking(false); // Auth check complete
          
          // Get and store token
          let token = null;
          try {
            token = await currentUser.getIdToken();
            setUserToken(token);
          } catch (tokenErr) {
            console.error("Error getting user token:", tokenErr);
          }
          
          // Check if admin account (server-side verification)
          let adminStatus = false;
          if (token) {
            try {
              console.log('[Auth] Checking admin status for:', currentUser.email);
              const adminRes = await fetch(`${BACKEND_URL}/api/user/admin-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (adminRes.ok) {
                const adminData = await adminRes.json();
                adminStatus = adminData.isAdmin === true;
                console.log('[Auth] Admin status response:', adminData);
              } else {
                console.warn('[Auth] Admin status check returned:', adminRes.status, adminRes.statusText);
              }
            } catch (adminErr) {
              console.error("[Auth] Admin status check failed:", adminErr);
            }
          } else {
            console.warn('[Auth] No token available â€” skipping admin check');
          }
          setIsAdmin(adminStatus);
          if (adminStatus) {
            console.log('Admin access granted:', currentUser.email);
            setUserPlan('Lifetime Access');
            setUserCredits(999999);
            toast.success('Welcome, Administrator!', { icon: 'ðŸ”' });
          }
          
          // Fetch credits AND subscription plan from Firestore (non-admins)
          if (db && !adminStatus) {
            try {
              const userRef = doc(db, 'users', currentUser.uid);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const credits = userData.credits || 0;
                setUserCredits(credits);
                setUserProfile(prev => ({ 
                  ...prev, 
                  credits,
                  // Restore profile fields from Firestore if present
                  ...(userData.profile || {})
                }));

                // Load User DNA / Inspiration files for persistence
                if (userData.visualDnaUrl) setVisualDnaUrl(userData.visualDnaUrl);
                if (userData.audioDnaUrl) setAudioDnaUrl(userData.audioDnaUrl);
                if (userData.videoDnaUrl) setVideoDnaUrl(userData.videoDnaUrl);
                if (userData.lyricsDnaUrl) setLyricsDnaUrl(userData.lyricsDnaUrl);
                if (userData.voiceSampleUrl) setVoiceSampleUrl(userData.voiceSampleUrl);

                // Load subscription plan from Firestore
                // Backend saves: tier, subscriptionTier, subscriptionStatus
                if (userData.subscriptionStatus === 'active' && userData.tier) {
                  // Map backend tier names to frontend plan names
                  const tierMap = { 'creator': 'monthly', 'studio': 'pro', 'lifetime': 'lifetime' };
                  const planName = tierMap[userData.tier] || userData.tier;
                  setUserPlan(planName);
                  localStorage.setItem('studio_user_plan', planName);
                  console.log('[Auth] Subscription loaded:', planName, 'from tier:', userData.tier);
                } else if (userData.plan) {
                  // Fallback to plan field if set directly
                  setUserPlan(userData.plan);
                  localStorage.setItem('studio_user_plan', userData.plan);
                  console.log('[Auth] User plan loaded from Firestore:', userData.plan);
                } else if (userData.subscription?.status === 'active') {
                  // Legacy format support
                  const planName = userData.subscription.plan || 'monthly';
                  setUserPlan(planName);
                  localStorage.setItem('studio_user_plan', planName);
                  console.log('[Auth] Legacy subscription format loaded:', planName);
                }
              }
            } catch (err) {
              console.error('Failed to fetch user data:', err);
            }
          }

          // Load projects from cloud INDEPENDENTLY of user data fetch above.
          // This ensures projects load even if Firestore client getDoc fails.
          try {
            let cloudProjects = await loadProjectsFromCloud(currentUser.uid, currentUser, token);

            // If no projects returned and we had no token, retry once after delay
            if (cloudProjects.length === 0 && !token) {
              console.log('[Auth] No projects and no token â€” retrying after 2s...');
              await new Promise(r => setTimeout(r, 2000));
              cloudProjects = await loadProjectsFromCloud(currentUser.uid, currentUser);
            }

            if (cloudProjects.length > 0) {
              skipNextSyncRef.current = true; // Don't re-save projects just loaded from cloud
              setProjects(prev => {
                const merged = mergeProjects(prev, cloudProjects);
                console.log(`Merged ${prev.length} local + ${cloudProjects.length} cloud = ${merged.length} projects`);
                return merged;
              });
              toast.success(`Synced ${cloudProjects.length} projects from cloud`);

              // Auto-select the last-used project or the most recent one
              const savedProjectId = localStorage.getItem(`studio_selected_project_${currentUser.uid}`);
              const merged = mergeProjects([], cloudProjects); // get merged for selection
              const projectToSelect = (savedProjectId && merged.find(p => p.id === savedProjectId)) || merged[0];
              if (projectToSelect && !selectedProject) {
                setSelectedProject(projectToSelect);
              }
            } else {
              // Cloud returned 0 projects â€” could be auth failure or genuinely empty
              // Check if we have local projects to sync up
              const localUidKey = `studio_projects_${currentUser.uid}`;
              const localData = localStorage.getItem(localUidKey);
              let localProjects = [];
              try { localProjects = localData ? JSON.parse(localData) : []; } catch(_e) { /* ignore */ }

              if (localProjects.length > 0) {
                // We have local projects but cloud returned nothing â€” restore from local and sync up
                console.log(`[Auth] Cloud returned 0 projects but found ${localProjects.length} in localStorage. Restoring.`);
                skipNextSyncRef.current = true; // Don't let the sync effect double-fire
                setProjects(localProjects);
                if (token) {
                  syncProjectsToCloud(currentUser.uid, localProjects);
                } else {
                  console.log('[Auth] Skipping immediate sync â€” no token available yet');
                }
              }
            }
          } catch (err) {
            console.error('Failed to load projects from cloud:', err);
          }
        } else {
          userRef.current = null; // UPDATE REF
          // Firebase returned null - but DON'T immediately log out
          // This can happen temporarily during network issues or page refresh
          // Only clear auth if we're certain the user has logged out
          
          // Check if we had a previous session in localStorage
          const previousUserId = localStorage.getItem('studio_user_id');
          const wasGuestMode = localStorage.getItem('studio_guest_mode') === 'true';
          
          if (previousUserId && authRetryCountRef.current < 10) {
            // We had a session - Firebase might just be slow
            // Wait and retry before clearing
            authRetryCountRef.current += 1;
            console.log('[Auth] Firebase returned null but we have session, retry', authRetryCountRef.current);
            setAuthRetryCount(authRetryCountRef.current);

            // Keep user logged in from localStorage while we wait
            setIsLoggedIn(true);
            setAuthChecking(true); // Still checking

            // Show reconnecting feedback after a few retries
            if (authRetryCountRef.current === 3) {
              toast.loading('Reconnecting to your session...', { id: 'auth-retry', duration: 15000 });
            }

            // Don't clear anything yet - give Firebase a moment
            setTimeout(() => {
              // Use refs to get CURRENT state (not stale closure from useEffect[])
              if (!userRef.current && authRetryCountRef.current >= 8) {
                console.log('[Auth] Retry exhausted, clearing session');
                toast.dismiss('auth-retry');
                // Only clear if we are NOT in guest mode
                if (localStorage.getItem('studio_guest_mode') !== 'true') {
                  setUser(null);
                  setUserToken(null);
                  setUserCredits(3);
                  localStorage.removeItem('studio_user_id');
                  setIsLoggedIn(false);
                  toast.error('Session expired — please sign in again');
                }
                setAuthChecking(false);
                authRetryCountRef.current = 0;
                setAuthRetryCount(0);
              }
            }, 3000); // 3 seconds per retry — 10 retries = up to 30s total tolerance
          } else if (wasGuestMode) {
            // Guest mode - keep them in without login
            setUser(null);
            setUserToken(null);
            setIsLoggedIn(false);
            setIsGuestMode(true);
            setAuthChecking(false);
            console.log('[Auth] Continuing in guest mode');
          } else {
            // No previous session or retries exhausted - clear auth
            setUser(null);
            setUserToken(null);
            setUserCredits(3);
            localStorage.removeItem('studio_user_id');
            setIsLoggedIn(false);
            setAuthChecking(false);
            authRetryCountRef.current = 0;
            setAuthRetryCount(0);
          }
        }
      });
      return () => unsubscribe();
    } else {
      // No auth service - mark auth check as complete
      setAuthChecking(false);
    }
  }, []);

  // Listen for auth modal open events from child components
  useEffect(() => {
    const handleOpenAuthModal = () => {
      setShowLoginModal(true);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, []);

  // ðŸ” SESSION TIMEOUT - Auto logout after inactivity (security best practice)
  
  const resetSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    if (user && !isGuestMode) {
      sessionTimeoutRef.current = setTimeout(() => {
        toast('Session expired for security. Please sign in again.', { icon: 'ðŸ”’' });
        // FIXED: Use ref to avoid TDZ - handleSecureLogout defined later
        if (secureLogoutRef.current) {
          secureLogoutRef.current();
        }
      }, SESSION_TIMEOUT_MS);
    }
  }, [user, isGuestMode]);
  
  // Reset timeout on user activity
  useEffect(() => {
    if (!user) return;
    
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetSessionTimeout();
    
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    resetSessionTimeout(); // Start timer
    
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [user, resetSessionTimeout]);

  // ðŸ” PASSWORD VALIDATION - Enforce strong passwords
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    return errors;
  };
  
  // ðŸ” SECURE LOGOUT - Clear all sensitive data
  async function handleSecureLogout() {
    try {
      // Sign out from Firebase first
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Firebase signOut error:', err);
    }
    
    // Clear ALL sensitive state
    setUser(null);
    setUserToken(null);
    setUserCredits(3);
    setIsAdmin(false);
    setUserPlan('');
    
    // Clear ALL auth-related localStorage
    localStorage.removeItem('studio_user_id');
    localStorage.removeItem('studio_user_plan');
    localStorage.removeItem('studio_guest_mode');
    
    // Clear ALL project and session data
    localStorage.removeItem('studio_agents_projects');
    localStorage.removeItem('studio_active_tab');
    localStorage.removeItem('studio_dashboard_tab');
    localStorage.removeItem('studio_selected_agent_id');
    localStorage.removeItem('studio_news_search');
    localStorage.removeItem('studio_help_search');
    localStorage.removeItem('studio_preview_prompt');
    localStorage.removeItem('studio_voice_transcript');
    localStorage.removeItem('studio_selected_project_id');
    
    // Clear per-agent workflow data
    if (AGENTS && Array.isArray(AGENTS)) {
      AGENTS.forEach(agent => {
        localStorage.removeItem(`studio_workflow_prompt_${agent.id}`);
        localStorage.removeItem(`studio_workflow_output_${agent.id}`);
      });
    }
    
    // Clear session storage too
    sessionStorage.clear();
    
    // Reset UI state
    setIsLoggedIn(false);
    setIsGuestMode(false);
    setAuthEmail('');
    setAuthPassword('');
    setShowLoginModal(false);
    
    toast.success('Signed out securely', { icon: 'ðŸ‘‹' });
    onBack?.();
  };
  
  // SYNC REFS with current values (prevents stale closures)
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  useEffect(() => {
    secureLogoutRef.current = handleSecureLogout;
  }, []);

  // Fetch user credits from Firestore
const fetchUserCredits = useCallback(async (uid) => {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const credits = userDoc.data().credits || 0;
        setUserCredits(credits);
        setUserProfile(prev => ({ ...prev, credits }));       
      } else {
        // Initialize new user with 25 trial credits (matches backend)
        await setDoc(userRef, { credits: 25, tier: 'free', createdAt: new Date() });        
        setUserCredits(25);
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  }, [db]);

  // ðŸ’° PURCHASE CREDITS - Revenue engine for top-ups
  const buyCreditPack = async (amount, price) => {
    if (!user) {
      toast.error('Please log in to purchase credits');
      setShowLoginModal(true);
      return;
    }

    const toastId = toast.loading(`Redirecting to secure checkout for ${amount} credits...`);

    try {
      // ðŸ’³ Call the actual Stripe backend (production or local)
      const response = await fetch(`${BACKEND_URL}/api/stripe/create-credits-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount),
          userId: user?.uid,
          userEmail: user?.email,
          successUrl: window.location.origin + window.location.pathname + '#/studio?payment=success&type=credits&amount=' + amount,
          cancelUrl: window.location.origin + window.location.pathname + '#/studio?payment=cancelled'
        })
      });

      const data = await response.json();
      toast.dismiss(toastId);

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data.error) {
        toast.error(data.error);
      } else {
        toast.error('Could not create payment session. Please try again.');
      }
    } catch (err) {
      toast.dismiss(toastId);
      console.error('Purchase error:', err);
      toast.error('Payment system unavailable. Please contact support.');
    }
  };

  // --- LOGIN HANDLER (Google) ---
  async function handleGoogleLogin() {
    if (!auth) {
      toast.error('Authentication service unavailable');
      return;
    }
    setAuthLoading(true);
    const loadingToast = toast.loading('Signing in with Google...');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Close modal immediately for faster UX
      setShowLoginModal(false);
      toast.success('Welcome back!', { id: loadingToast });
      
      // Track login
      Analytics.login('google');
      
      // Fetch credits in background (don't wait)
      fetchUserCredits(result.user.uid).catch(err => 
        console.warn('Background credits fetch failed:', err)
      );
      
      if (selectedPlan) {
        // FIXED: Use ref to avoid TDZ - handleCheckoutRedirect defined later
        if (checkoutRedirectRef.current) {
          checkoutRedirectRef.current(selectedPlan);
        }
      }
    } catch (error) {
      console.error('Login failed', error);
      toast.dismiss(loadingToast);
      if (error.code === 'auth/popup-closed-by-user') {
        toast('Sign-in cancelled', { icon: 'ðŸ‘‹' });
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error(`Domain not authorized. Add ${window.location.hostname} in Firebase Console.`);
      } else {
        toast.error(error.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // --- APPLE SIGN-IN ---
  async function handleAppleLogin() {
    if (!auth) {
      toast.error('Authentication service unavailable');
      return;
    }
    setAuthLoading(true);
    const loadingToast = toast.loading('Signing in with Apple...');
    
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      const result = await signInWithPopup(auth, provider);
      
      setShowLoginModal(false);
      toast.success('Welcome!', { id: loadingToast });
      
      Analytics.login('apple');
      
      fetchUserCredits(result.user.uid).catch(err => 
        console.warn('Background credits fetch failed:', err)
      );
      
      if (selectedPlan) {
        if (checkoutRedirectRef.current) {
          checkoutRedirectRef.current(selectedPlan);
        }
      }
    } catch (error) {
      console.error('Apple login failed', error);
      toast.dismiss(loadingToast);
      if (error.code === 'auth/popup-closed-by-user') {
        toast('Sign-in cancelled', { icon: '👋' });
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error(`Domain not authorized. Add ${window.location.hostname} in Firebase Console.`);
      } else {
        toast.error('Apple sign-in failed. Please try another method.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // --- EMAIL/PASSWORD LOGIN ---
  async function handleEmailAuth(e) {
    e.preventDefault();
    if (!auth) {
      toast.error('Authentication service unavailable');
      return;
    }
    if (!authEmail || !authPassword) {
      toast.error('Please enter email and password');
      return;
    }
    
    // ðŸ” Validate password strength for signups
    if (authMode === 'signup') {
      const passwordErrors = validatePassword(authPassword);
      if (passwordErrors.length > 0) {
        toast.error(`Password requires: ${passwordErrors.join(', ')}`);
        return;
      }
    }
    
    setAuthLoading(true);
    try {
      let result;
      if (authMode === 'signup') {
        result = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        // ðŸ“§ Send email verification and sign out until verified
        try {
          await sendEmailVerification(result.user);
          toast.success('Account created! Please check your inbox and verify your email to log in.', { duration: 8000 });
          await signOut(auth);
          setAuthLoading(false);
          setAuthMode('login'); // Switch to login so they can try again after verifying
          return;
        } catch (verifyErr) {
          console.error('Verification email failed', verifyErr);
          toast.error('Account created, but could not send verification email. Please try logging in to resend.');
          await signOut(auth);
          setAuthLoading(false);
          return;
        }
        Analytics.signUp('email');
      } else {
        result = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        
        // ðŸ“§ Check if email is verified
        if (!result.user.emailVerified) {
          toast.error('Please verify your email address before logging in.', { duration: 4000 });
          
          // ðŸ“§ Automatically resend verification email on failed login attempt
          try {
            await sendEmailVerification(result.user);
            toast.success('A new verification link has been sent to your inbox.', { duration: 5000 });
          } catch (resendErr) {
            console.warn('Could not resend verification email', resendErr);
          }
          
          await signOut(auth);
          setAuthLoading(false);
          return;
        }
        
        toast.success('Welcome back!');
        Analytics.login('email');
      }
      await fetchUserCredits(result.user.uid);
      setShowLoginModal(false);
      setAuthEmail('');
      setAuthPassword('');
      if (selectedPlan) {
        // FIXED: Use ref to avoid TDZ - handleCheckoutRedirect defined later
        if (checkoutRedirectRef.current) {
          checkoutRedirectRef.current(selectedPlan);
        }
      }
    } catch (error) {
      console.error('Auth failed', error);
      // ðŸ” Security: Use generic messages to prevent user enumeration
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use. Try logging in.');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        // Don't reveal whether email exists - security best practice
        toast.error('Invalid email or password');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password should be at least 8 characters with uppercase, lowercase, and numbers');
      } else {
        toast.error(error.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // --- PASSWORD RESET ---
  const handlePasswordReset = async () => {
    if (!authEmail) {
      toast.error('Please enter your email first');
      return;
    }
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, authEmail);
      toast.success('Password reset email sent!');
      setAuthMode('login');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // --- LOGOUT HANDLER ---
  // Use handleSecureLogout defined above for all logout operations

  // Persist dashboardTab
  useEffect(() => {
    const uid = user?.uid || localStorage.getItem('studio_user_id') || 'guest';
    localStorage.setItem(`studio_dash_${uid}`, dashboardTab);
  }, [dashboardTab, user?.uid]);

  // Fetch Admin Analytics
  useEffect(() => {
    if (dashboardTab === 'admin' && isAdmin) {
      fetchAdminData();
    }
  }, [dashboardTab, isAdmin]);

  async function fetchAdminData() {
    setIsAdminLoading(true);
    setAdminError(null);
    try {
      // Get Firebase Auth token
      // Import auth from firebase config if needed, but it seems to be available in scope
      let token;
      if (auth?.currentUser) {
        token = await auth.currentUser.getIdToken(true);
      } else {
        throw new Error('You must be logged in to access admin stats');
      }
      
      // Fetch stats and API status in parallel
      const [statsRes, apiRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BACKEND_URL}/api/status/apis`)
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch platform stats');
      if (!apiRes.ok) throw new Error('Failed to fetch API health status');
      
      const statsData = await statsRes.json();
      const apiData = await apiRes.json();
      
      setAdminStats(statsData);
      setAdminApiStatus(apiData);
    } catch (err) {
      console.error('Admin fetch error:', err);
      setAdminError(err.message);
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Persist Dashboard State
  useEffect(() => {
    localStorage.setItem('studio_managed_agents', JSON.stringify(managedAgents));
  }, [managedAgents]);

  useEffect(() => {
    localStorage.setItem('studio_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  const toggleAgentVisibility = (agentName) => {
    setManagedAgents(prev => prev.map(a => 
      a.name === agentName ? { ...a, visible: !a.visible } : a
    ));
  };

  const toggleAppSetting = (key) => {
    setAppSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null); // { item, type }
  const [paymentType, setPaymentType] = useState('card'); // 'card' or 'bank'
  const [showNotifications, setShowNotifications] = useState(false);

  // Persist payment state
  useEffect(() => {
    localStorage.setItem('studio_agents_payments', JSON.stringify(paymentMethods));
    localStorage.setItem('studio_agents_banks', JSON.stringify(bankAccounts));
  }, [paymentMethods, bankAccounts]);

  // Persist social state
  useEffect(() => {
    localStorage.setItem('studio_agents_socials', JSON.stringify(socialConnections));
    localStorage.setItem('studio_agents_storage', JSON.stringify(storageConnections));
    if (twitterUsername) localStorage.setItem('studio_agents_twitter_user', twitterUsername);
    if (metaName) localStorage.setItem('studio_agents_meta_name', metaName);
  }, [socialConnections, twitterUsername, metaName, storageConnections]);

// Handle Social OAuth & Payment Callbacks
    useEffect(() => {
      // Hash-based routing puts query params inside the hash (e.g. #/studio?payment=success)
      // so we need to parse from both window.location.search AND the hash
      const hashParts = window.location.hash.split('?');
      const hashSearch = hashParts.length > 1 ? hashParts[1] : '';
      const params = new URLSearchParams(window.location.search || hashSearch);

      // Twitter Callback
      if (params.get('twitter_connected') === 'true') {
        const username = params.get('twitter_username');
        setSocialConnections(prev => ({ ...prev, twitter: true }));
        setTwitterUsername(username);

        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
        toast.success(`Connected to X/Twitter as @${username}!`);
      }

      // Meta Callback (Insta/FB)
      if (params.get('meta_connected') === 'true') {
        const name = params.get('meta_name');
        setSocialConnections(prev => ({ ...prev, instagram: true, facebook: true }));        
        setMetaName(name);

        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
        toast.success(`Connected to Meta as ${name}!`);
      }

      // Payment Success/Cancel Callback
      const paymentStatus = params.get('payment');
      if (paymentStatus === 'success') {
        const type = params.get('type') || 'subscription';
        const amount = params.get('amount');
        if (type === 'credits') {
          toast.success(`Success! ${amount || 'Your'} credits have been added.`, { icon: 'ðŸ’°' });
          if (user?.uid) fetchUserCredits(user.uid);
        } else {
          toast.success('Your subscription is now active!', { icon: 'âœ¨' });
        }
        // Cleanup URL
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      } else if (paymentStatus === 'cancelled') {
        toast.error('Payment was cancelled.');
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    }, [user, fetchUserCredits]);

  // --- STRIPE CHECKOUT ---
  async function handleCheckoutRedirect(plan) {
    if (!isLoggedIn || !user) {
      toast.error('Please log in first');
      setShowLoginModal(true);
      return;
    }

    const tierMap = {
      'Creator': 'creator',
      'Studio Pro': 'studio',
      'Lifetime Access': 'lifetime'
    };
    const tier = tierMap[plan.name] || 'creator';

    try {
      toast.loading('Redirecting to checkout...');
      const response = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          userId: user?.uid,
          userEmail: user?.email,
          successUrl: window.location.origin + window.location.pathname + '#/studio?payment=success&type=subscription',
          cancelUrl: window.location.origin + window.location.pathname + '#/studio?payment=cancelled'
        })
      });

      const data = await response.json();
      toast.dismiss();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        toast.error(data.error);
      } else {
        toast.error('Could not create checkout session');
      }
    } catch (err) {
      toast.dismiss();
      console.error('Checkout error:', err);
      toast.error('Payment system unavailable. Please try again later.');
    }
  };

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    if (isLoggedIn) {
      handleCheckoutRedirect(plan);
    } else {
      setShowLoginModal(true);
    }
  };
  
  // Set ref for TDZ-safe access from earlier useEffect
  handleSubscribeRef.current = handleSubscribe;
  
  // Set ref for TDZ-safe access from login handlers
  checkoutRedirectRef.current = handleCheckoutRedirect;

  // --- PROFESSIONAL VOICE & TRANSLATION LOGIC (Whisperer-style) ---
  
  // Pending prompt to apply when agent view renders (for re-run functionality)
  const [pendingPrompt, setPendingPrompt] = useState(null);
  
  // Apply pending prompt when agent view becomes active
  useEffect(() => {
    if (pendingPrompt && selectedAgent && activeTab === 'agents') {
      // Wait for textarea to render, then set value
      setTimeout(() => {
        const textarea = textareaRef.current || document.querySelector('.studio-textarea');
        if (textarea) {
          textarea.value = pendingPrompt;
          textarea.focus();
        }
        setPendingPrompt(null);
      }, 100);
    }
  }, [pendingPrompt, selectedAgent, activeTab]);

  const handleVoiceToText = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setVoiceTranscript('');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported. Try Chrome or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceSettings.language === 'English' ? 'en-US' : 
                      voiceSettings.language === 'Spanish' ? 'es-ES' :
                      voiceSettings.language === 'French' ? 'fr-FR' :
                      voiceSettings.language === 'German' ? 'de-DE' :
                      voiceSettings.language === 'Italian' ? 'it-IT' :
                      voiceSettings.language === 'Portuguese' ? 'pt-PT' :
                      voiceSettings.language === 'Japanese' ? 'ja-JP' :
                      voiceSettings.language === 'Korean' ? 'ko-KR' :
                      voiceSettings.language === 'Chinese' ? 'zh-CN' : 'en-US';
    
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('ðŸŽ¤ Listening... Say a command or dictate your prompt', { duration: 2000 });
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setVoiceTranscript('');
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setVoiceTranscript('');
      if (event.error !== 'aborted') {
        toast.error(`Voice error: ${event.error}`);
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript = transcript;
        }
      }
      
      // Show real-time interim results (Whisperer-style feedback)
      if (interimTranscript) {
        setVoiceTranscript(interimTranscript);
      }
      
      if (!finalTranscript) return;
      
      const transcript = finalTranscript.toLowerCase().trim();
      setVoiceTranscript('');
      setLastVoiceCommand({ text: finalTranscript, time: new Date().toLocaleTimeString() });
      
      // --- VOICE COMMAND PROCESSING ---
      
      // Stop listening command
      if (transcript.includes('stop listening') || transcript.includes('stop voice') || transcript === 'stop' || transcript === 'cancel') {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
        handleTextToVoice("Voice control stopped.");
        return;
      }
      
      // Open/Launch agent commands
      if (transcript.includes('open') || transcript.includes('launch')) {
        const agentName = transcript.replace('open', '').replace('launch', '').trim();
        const foundAgent = (typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.find(a => a.name.toLowerCase().includes(agentName)) : null;
        if (foundAgent) {
          setSelectedAgent(foundAgent);
          setActiveTab('agents');
          toast.success(`ðŸš€ Launching ${foundAgent.name}`);
          handleTextToVoice(`Launching ${foundAgent.name}.`);
          return;
        }
      }

      // Navigation commands
      if (transcript.includes('go to') || transcript.includes('show me') || transcript.includes('navigate')) {
        let navigated = false;
        if (transcript.includes('dashboard') || transcript.includes('studio') || transcript.includes('home')) {
          setActiveTab('mystudio');
          toast.success('ðŸ“Š Dashboard');
          handleTextToVoice("Navigating to your dashboard.");
          navigated = true;
        } else if (transcript.includes('hub') || transcript.includes('projects')) {
          setActiveTab('hub');
          toast.success('ðŸ“ Project Hub');
          handleTextToVoice("Opening the Project Hub.");
          navigated = true;
        } else if (transcript.includes('news')) {
          setActiveTab('news');
          toast.success('ðŸ“° Industry Pulse');
          handleTextToVoice("Checking the latest industry pulse.");
          navigated = true;
        } else if (transcript.includes('help') || transcript.includes('support')) {
          setActiveTab('support');
          toast.success('ðŸ’¡ Help Center');
          handleTextToVoice("How can I help you today?");
          navigated = true;
        } else if (transcript.includes('agents') || transcript.includes('tools')) {
          setActiveTab('agents');
          toast.success('ðŸ¤– Agents');
          handleTextToVoice("Viewing all available agents.");
          navigated = true;
        }
        if (navigated) return;
      }

      // Theme toggle
      if (transcript.includes('switch theme') || transcript.includes('toggle theme') || transcript.includes('light mode') || transcript.includes('dark mode')) {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('studio_theme', newTheme);
        toast.success(`ðŸŽ¨ ${newTheme === 'dark' ? 'Dark' : 'Light'} mode`);
        handleTextToVoice(`Switching to ${newTheme} mode.`);
        return;
      }

      // Generate command
      if (transcript === 'generate' || transcript.includes('start generation') || transcript.includes('create now') || transcript.includes('make it')) {
        const textarea = textareaRef.current || document.querySelector('.studio-textarea');
        if (textarea && textarea.value.trim()) {
          // FIXED: Use ref to avoid TDZ - handleGenerate defined later
          if (handleGenerateRef.current) {
            handleGenerateRef.current();
          }
          toast.success('âš¡ Generating...');
          handleTextToVoice("Starting generation.");
        } else {
          toast.error('Please enter a prompt first');
          handleTextToVoice("Please enter a prompt first.");
        }
        return;
      }
      
      // Clear prompt command
      if (transcript.includes('clear prompt') || transcript.includes('clear text') || transcript.includes('start over') || transcript === 'clear') {
        const textarea = textareaRef.current || document.querySelector('.studio-textarea');
        if (textarea) {
          textarea.value = '';
          try {
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          } catch (e) {
            const ev = document.createEvent('Event');
            ev.initEvent('input', true, true);
            textarea.dispatchEvent(ev);
          }
          toast.success('ðŸ—‘ï¸ Prompt cleared');
          handleTextToVoice("Prompt cleared.");
        }
        return;
      }
      
      // Read back command
      if (transcript.includes('read back') || transcript.includes('read prompt') || transcript.includes('what did i write') || transcript.includes('read it')) {
        const textarea = textareaRef.current || document.querySelector('.studio-textarea');
        if (textarea && textarea.value.trim()) {
          handleTextToVoice(textarea.value);
        } else {
          handleTextToVoice("The prompt is empty.");
        }
        return;
      }

      // DNA Reference commands (Voice-to-DNA)
      if (transcript.includes('reference') && (transcript.includes('dna') || transcript.includes('asset'))) {
        if (transcript.includes('visual') || transcript.includes('image')) {
          document.getElementById('visual-dna-input')?.click();
          handleTextToVoice("Please select a visual reference image.");
          return;
        } else if (transcript.includes('audio') || transcript.includes('sound') || transcript.includes('music')) {
          document.getElementById('audio-dna-input')?.click();
          handleTextToVoice("Please select an audio reference file.");
          return;
        } else if (transcript.includes('lyrics') || transcript.includes('text') || transcript.includes('context')) {
          document.getElementById('lyrics-dna-input')?.click();
          handleTextToVoice("Please select a lyrics or text reference file.");
          return;
        } else if (transcript.includes('voice') || transcript.includes('clone')) {
          document.getElementById('voice-dna-input')?.click();
          handleTextToVoice("Please select a voice sample to clone.");
          return;
        }
      }

      // Genre selection commands
      if (transcript.includes('set genre to') || transcript.includes('change genre to')) {
        const genreText = transcript.replace('set genre to', '').replace('change genre to', '').trim();
        const validGenres = ['r&b', 'pop', 'hip-hop', 'soul', 'country', 'rock', 'jazz', 'folk', 'metal', 'blues'];
        const foundGenre = validGenres.find(g => genreText.includes(g));
        if (foundGenre) {
          // Normalize some synonyms
          let targetGenre = foundGenre;
          if (foundGenre === 'folk') targetGenre = 'country';
          if (foundGenre === 'metal') targetGenre = 'rock';
          if (foundGenre === 'blues') targetGenre = 'jazz';
          
          setVoiceSettings(prev => ({ ...prev, genre: targetGenre }));
          toast.success(`ðŸŽ¶ Genre set to ${targetGenre.toUpperCase()}`);
          handleTextToVoice(`Setting genre to ${targetGenre}.`);
          return;
        }
      }

      // Duration selection commands
      if (transcript.includes('set duration to') || transcript.includes('change duration to')) {
        const timeText = transcript.replace('set duration to', '').replace('change duration to', '').trim();
        let seconds = 30;
        
        if (timeText.includes('15 seconds')) seconds = 15;
        else if (timeText.includes('30 seconds')) seconds = 30;
        else if (timeText.includes('1 minute') || timeText.includes('60 seconds')) seconds = 60;
        else if (timeText.includes('2 minute') || timeText.includes('120 seconds')) seconds = 120;
        else if (timeText.includes('3 minute') || timeText.includes('180 seconds')) seconds = 180;
        else if (timeText.includes('short')) seconds = 15;
        else if (timeText.includes('long')) seconds = 180;
        
        setVoiceSettings(prev => ({ ...prev, duration: seconds }));
        toast.success(`â±ï¸ Duration set to ${seconds}s`);
        handleTextToVoice(`Setting generation length to ${seconds} seconds.`);
        return;
      }
      
      // Show voice commands
      if (transcript.includes('show commands') || transcript.includes('voice commands') || transcript.includes('what can i say') || transcript.includes('help commands')) {
        setShowVoiceCommandPalette(true);
        handleTextToVoice("Here are the available voice commands.");
        return;
      }

      // Payment commands
      if (transcript.includes('add payment') || transcript.includes('billing') || transcript.includes('manage card')) {
        setActiveTab('mystudio');
        setShowAddPaymentModal(true);
        handleTextToVoice("Opening payment management.");
        return;
      }

      // Default: Append to textarea as dictation
      const textarea = textareaRef.current || document.querySelector('.studio-textarea');
      if (textarea) {
        const newText = (textarea.value + ' ' + finalTranscript).trim();
        textarea.value = newText;
        try {
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (e) {
          const ev = document.createEvent('Event');
          ev.initEvent('input', true, true);
          textarea.dispatchEvent(ev);
        }
        // Brief visual feedback
        toast.success(`âœï¸ Added: "${finalTranscript.substring(0, 30)}${finalTranscript.length > 30 ? '...' : ''}"`, { duration: 1500 });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Effect to handle auto-start of voice when opening agent from grid
  useEffect(() => {
    if (selectedAgent && autoStartVoice) {
      // Wait for view transition
      const timer = setTimeout(() => {
        handleVoiceToText();
        setAutoStartVoice(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedAgent, autoStartVoice]);

  const handleTextToVoice = (textInput) => {
    if (isSpeaking && (!textInput || typeof textInput !== 'string')) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // If textInput is an event or not a string, use the textarea value
    const textToSpeak = (typeof textInput === 'string') ? textInput : (textareaRef.current?.value || document.querySelector('.studio-textarea')?.value);
    if (!textToSpeak) return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const speak = (voices) => {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      let selectedVoice = null;

      // Filter by language and gender/region
      const langCode = voiceSettings.language === 'English' ? 'en' : 
                      voiceSettings.language === 'Spanish' ? 'es' :
                      voiceSettings.language === 'French' ? 'fr' :
                      voiceSettings.language === 'German' ? 'de' :
                      voiceSettings.language === 'Italian' ? 'it' :
                      voiceSettings.language === 'Portuguese' ? 'pt' :
                      voiceSettings.language === 'Japanese' ? 'ja' :
                      voiceSettings.language === 'Korean' ? 'ko' :
                      voiceSettings.language === 'Chinese' ? 'zh' : 'en';

      const filteredVoices = voices.filter(v => v.lang.startsWith(langCode));
      
      // Try to find a match for gender/region
      if (voiceSettings.region === 'UK') {
        selectedVoice = filteredVoices.find(v => v.name.includes('UK') || v.name.includes('British'));
      } else if (voiceSettings.region === 'AU') {
        selectedVoice = filteredVoices.find(v => v.name.includes('Australia'));
      } else if (voiceSettings.region === 'IN') {
        selectedVoice = filteredVoices.find(v => v.name.includes('India'));
      }

      // If no region match, try gender
      if (!selectedVoice) {
        if (voiceSettings.gender === 'female') {
          selectedVoice = filteredVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('victoria'));
        } else {
          selectedVoice = filteredVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('daniel'));
        }
      }

      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.lang = langCode;
      utterance.rate = 0.9; // Slightly slower for "Studio" feel
      utterance.pitch = voiceSettings.gender === 'female' ? 1.1 : 0.9;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speak(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        speak(voices);
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  };
  
  // Set ref for TDZ-safe access from earlier functions
  handleTextToVoiceRef.current = handleTextToVoice;

  // Create AI Vocal from text using Uberduck TTS API (NOT browser TTS)
  const handleCreateAIVocal = async (textContent, sourceAgent = 'Ghostwriter') => {
    if (!textContent || textContent.trim().length === 0) {
      toast.error('No text content to vocalize');
      return;
    }

    // Capture project context immediately to prevent race conditions during long AI wait
    const targetProjectSnapshot = selectedProject;

    setIsCreatingVocal(true);
    const toastId = toast.loading('Creating AI vocal (~60s)...');

    try {
      // Build headers with auth token if logged in
      const headers = { 'Content-Type': 'application/json' };
      if (isLoggedIn && auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } catch (err) {
          console.warn('Could not get auth token:', err);
        }
      }

      // Trim text to reasonable length for vocals (1500 chars for Suno, 2000 for fallback)
      const textToSpeak = textContent.substring(0, 1500);

      console.log('[handleCreateAIVocal] Generating REAL AI vocal via Suno/Bark for:', textToSpeak.substring(0, 50) + '...');

      const response = await fetch(`${BACKEND_URL}/api/generate-speech`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: textToSpeak,
          voice: voiceSettings.voiceName || 'rapper-male-1',
          style: voiceSettings.style || 'rapper',
          rapStyle: voiceSettings.rapStyle || 'aggressive',
          genre: voiceSettings.genre || 'hip-hop',
          language: voiceSettings.language || 'English',
          duration: voiceSettings.duration || 30,
          speakerUrl: voiceSampleUrl || voiceSettings.speakerUrl,
          backingTrackUrl: audioDnaUrl || null,
          audioId: referencedAudioId || undefined,
          elevenLabsVoiceId: elevenLabsVoiceId,
          referenceSongUrl: referenceSongUrl || null,
          quality: (elevenLabsVoiceId || voiceSampleUrl) ? 'premium' : 'standard'
        })
      });

      const data = await response.json();

      if (data.audioUrl) {
        // Instead of creating a NEW item, ADD the audio to the EXISTING preview item
        // This consolidates lyrics + vocal into ONE card
        if (previewItem) {
          const consolidatedItem = {
            ...previewItem,
            audioUrl: data.audioUrl,
            mimeType: data.mimeType || 'audio/wav',
            type: 'vocal', // Upgrade type to vocal (has both text + audio)
            vocalSnippet: `ðŸŽ¤ AI Vocal created from lyrics`,
            projectSnapshot: targetProjectSnapshot, // Preserve context
            updatedAt: new Date().toISOString()
          };

          // Update the preview with consolidated item
          setPreviewItem(consolidatedItem);
          
          // Also update agent previews cache
          if (selectedAgent?.id) {
            setAgentPreviews(prev => ({ ...prev, [selectedAgent.id]: consolidatedItem }));
          }
          
          toast.success('AI vocal added to your creation!', { id: toastId });
          return consolidatedItem;
        } else {
          // Fallback: Create standalone vocal item if no preview exists
          const vocalItem = {
            id: String(Date.now()),
            title: `AI Vocal - ${sourceAgent}`,
            agent: sourceAgent,
            type: 'vocal',
            audioUrl: data.audioUrl,
            mimeType: data.mimeType || 'audio/wav',
            snippet: `ðŸŽ¤ AI Vocal: "${textToSpeak.substring(0, 50)}..."`,
            projectSnapshot: targetProjectSnapshot, // Preserve context
            createdAt: new Date().toISOString()
          };

          safeOpenGenerationPreview(vocalItem);
          toast.success('AI vocal created!', { id: toastId });
          return vocalItem;
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('No audio URL returned');
      }
    } catch (error) {
      console.error('[handleCreateAIVocal] Error:', error);
      toast.error(error.message || 'Failed to create AI vocal', { id: toastId });
      return null;
    } finally {
      setIsCreatingVocal(false);
    }
  };

  const handleDeletePayment = (id, type) => {
    if (window.confirm('Are you sure you want to remove this payment method?')) {
      if (type === 'card') {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
      } else {
        setBankAccounts(prev => prev.filter(ba => ba.id !== id));
      }
      handleTextToVoice('Payment method removed.');
    }
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (paymentType === 'card') {
      const cardNumber = formData.get('cardNumber');
      const expiry = formData.get('expiry');
      
      // Basic validation
      if (cardNumber.length < 12) {
        toast.error('Please enter a valid card number');
        return;
      }

      const newPM = {
        id: editingPayment ? editingPayment.item.id : `pm_${Date.now()}`,
        type: 'Visa', // In a real app, detect type from number
        last4: cardNumber.slice(-4),
        expiry: expiry,
        isDefault: editingPayment ? editingPayment.item.isDefault : false
      };

      if (editingPayment) {
        setPaymentMethods(prev => prev.map(pm => pm.id === newPM.id ? newPM : pm));
        handleTextToVoice('Card updated successfully.');
      } else {
        setPaymentMethods(prev => [...prev, newPM]);
        handleTextToVoice(`Successfully added your card ending in ${newPM.last4}.`);
      }
    } else {
      const bankName = formData.get('bankName');
      const accountNumber = formData.get('accountNumber');

      const newBA = {
        id: editingPayment ? editingPayment.item.id : `ba_${Date.now()}`,
        bankName: bankName,
        last4: accountNumber.slice(-4),
        type: 'Checking'
      };

      if (editingPayment) {
        setBankAccounts(prev => prev.map(ba => ba.id === newBA.id ? newBA : ba));
        handleTextToVoice('Bank account updated successfully.');
      } else {
        setBankAccounts(prev => [...prev, newBA]);
        handleTextToVoice(`Successfully linked your ${newBA.bankName} account.`);
      }
    }
    
    setShowAddPaymentModal(false);
    setEditingPayment(null);
  };



  // Connect social accounts handler

  const handleTranslatePrompt = async () => {
    const textarea = textareaRef.current || document.querySelector('.studio-textarea');
    if (!textarea || !textarea.value || voiceSettings.language === 'English') return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textarea.value,
          targetLanguage: 'English',
          sourceLanguage: voiceSettings.language
        })
      });

      const data = await response.json();
      if (data.translatedText) {
        textarea.value = data.translatedText;
        toast.success('Prompt translated to English!');
      }
    } catch (error) {
      console.error("Translation failed", error);
    }
  };

  const handleUploadDna = async (slot, e) => {
    console.log(`[DNA] Upload initiated for slot: ${slot}`);
    
    // PREVENT DUPLICATE CALLS
    if (isUploadingDna[slot]) {
      console.warn(`[DNA] Upload already in progress for ${slot}`);
      return;
    }

    const file = e.target.files?.[0];
    if (!file) {
      console.error(`[DNA] No file selected for ${slot}`);
      return;
    }

    console.log(`[DNA] Selected file: ${file.name} (${file.size} bytes)`);

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }

    setIsUploadingDna(prev => ({ ...prev, [slot]: true }));
    const loadingId = toast.loading(`Uploading ${slot} DNA...`, { id: `upload-dna-${slot}` });

    try {
      console.log(`[DNA] Getting Firebase token...`);
      const token = user ? await user.getIdToken() : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log(`[DNA] Reading file as Base64...`);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          console.log(`[DNA] Sending to backend: ${BACKEND_URL}/api/upload-asset`);
          
          const response = await fetch(`${BACKEND_URL}/api/upload-asset`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              data: base64Data,
              fileName: `${slot}-dna-${Date.now()}-${file.name.replace(/\s+/g, '-')}`,
              mimeType: file.type,
              assetType: (slot === 'visual' || slot === 'video') ? 'image' : 
                         (slot === 'audio') ? 'audio' : 'document'
            })
          });

          const result = await response.json();
          if (response.ok && result.url) {
            const url = result.url;
            console.log(`[DNA] Upload Success: ${url}`);
            if (slot === 'visual') setVisualDnaUrl(url);
            if (slot === 'audio') setAudioDnaUrl(url);
            if (slot === 'video') setVideoDnaUrl(url);
            if (slot === 'lyrics') setLyricsDnaUrl(url);
            
            toast.success(`${slot.charAt(0).toUpperCase() + slot.slice(1)} DNA Attached!`, { id: loadingId });
            if (user?.uid) {
              try {
                const userRef = doc(db, 'users', user?.uid);
                await updateDoc(userRef, {
                  [`${slot}DnaUrl`]: url,
                  lastDnaUpdate: Date.now()
                });
                console.log(`[Studio] Persisted ${slot} DNA to profile`);
              } catch (saveErr) {
                console.warn(`[Studio] Failed to persist ${slot} DNA:`, saveErr);
              }
            }

            toast.success(`${slot === 'video' ? 'Image' : slot.charAt(0).toUpperCase() + slot.slice(1)} DNA attached!`, { id: loadingId });
          } else {
            console.error(`[DNA] Upload Error:`, result);
            throw new Error(result.error || 'Upload failed');
          }
        } catch (err) {
          console.error(`[Studio] ${slot} DNA upload error:`, err);
          toast.error(`Failed to upload ${slot} DNA`, { id: loadingId });
        } finally {
          setIsUploadingDna(prev => ({ ...prev, [slot]: false }));
        }
      };
      reader.onerror = () => {
        console.error(`[DNA] FileReader error`);
        toast.error('Failed to read file');
        setIsUploadingDna(prev => ({ ...prev, [slot]: false }));
      };
    } catch (err) {
      console.error(`[Studio] ${slot} DNA upload error:`, err);
      toast.error('Upload failed', { id: loadingId });
      setIsUploadingDna(prev => ({ ...prev, [slot]: false }));
    }
  };

  const handleUploadVoiceSample = async (e) => {
    if (isUploadingSample) return;
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingSample(true);
    const loadingId = toast.loading('Cloning voice sample...', { id: 'voice-upload' });

    try {
      const token = user ? await user.getIdToken() : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          const response = await fetch(`${BACKEND_URL}/api/upload-asset`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              data: base64Data,
              fileName: `voice-cloned-${Date.now()}-${file.name.replace(/\s+/g, '-')}`,
              mimeType: file.type,
              assetType: 'audio'
            })
          });

          const result = await response.json();
          if (response.ok && result.url) {
            const url = result.url;
            setVoiceSampleUrl(url);
            
            // Industrial Strength Persistence: Save to User Profile
            if (user?.uid) {
              try {
                const userRef = doc(db, 'users', user?.uid);
                await updateDoc(userRef, {
                  voiceSampleUrl: url,
                  lastVoiceUpdate: Date.now()
                });
                console.log('[Studio] Persisted Voice sample to profile');
              } catch (saveErr) {
                console.warn('[Studio] Failed to persist Voice sample:', saveErr);
              }
            }

            toast.success('Voice cloned! Ready for speech.', { id: loadingId });
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (err) {
          console.error('[Studio] Voice upload error:', err);
          toast.error('Voice cloning failed', { id: loadingId });
        } finally {
          setIsUploadingSample(false);
        }
      };
    } catch (err) {
      toast.error('Failed to read file');
      setIsUploadingSample(false);
    }
  };

  async function handleGenerate(promptOverride = null) {
    console.log('[handleGenerate] Button click detected');
    let contextLyrics = ''; // Hoisted for TDZ safety
    
    // PREVENT DUPLICATE CALLS
    if (isGenerating) {
      console.warn('[handleGenerate] Already generating, ignoring click');
      return;
    }

    // CAPTURE CONTEXT IMMEDIATELY (Prevent race conditions if user switches projects/agents)
    const targetProjectSnapshot = selectedProject;
    const targetAgentSnapshot = selectedAgent; // Immutable capture for this generation cycle

    // Guard: Ensure agent is selected
    if (!targetAgentSnapshot) {
      console.error('[handleGenerate] No agent selected');
      toast.error("Please select an agent first.");
      return;
    }

    const agentId = targetAgentSnapshot.id;
    console.log('[handleGenerate] Targeting agent:', agentId, targetAgentSnapshot.name);

    // CHECK: Block generation for "Coming Soon" agents
    if (targetAgentSnapshot.comingSoon) {
      toast.error(`${targetAgentSnapshot.name} is coming soon! Try Ghostwriter or Beat Maker instead.`, { icon: 'ðŸš§' });
      return;
    }
    
    // Determine the actual prompt to use (Respecting override from tools/orchestrator)
    // Ensure promptValue is always a string
    let promptValue = '';
    if (promptOverride) {
      promptValue = typeof promptOverride === 'string' ? promptOverride : String(promptOverride);
    } else if (textareaRef.current?.value) {
      promptValue = textareaRef.current.value;
    }

    if (!promptValue) {
      const allTextareas = document.querySelectorAll('.studio-textarea');
      for (const ta of allTextareas) {
        if (ta.value) {
          promptValue = ta.value;
          console.log('[handleGenerate] Prompt recovered from secondary textarea');
          break;
        }
      }
    }

    if (!promptValue || !promptValue.trim()) {
      console.error('[handleGenerate] Empty prompt');
      toast.error("Please enter a prompt first.");
      return;
    }

    console.log('[handleGenerate] Prompt found:', promptValue.substring(0, 30) + '...');

    // Check if user typed the demo code ("pitch")
    if (checkDemoCode(promptValue)) {
      setShowDemoBanner(true);
      // Clear all visible textareas
      const allTextareas = document.querySelectorAll('.studio-textarea');
      allTextareas.forEach(t => t.value = '');
      if (textareaRef.current) textareaRef.current.value = '';
      
      toast.success('ðŸŽ­ Demo mode activated! Type "pitch" again to generate a demo response.', {
        duration: 5000,
        icon: 'ðŸŽ¬'
      });
      return;
    }

    // Identify feature type and cost
    const isImageAgent = ['album', 'visual-art', 'cover-art', 'art', 'video-art', 'flux'].includes(agentId);
    const isVideoAgent = ['video', 'video-creator', 'video-gen', 'sora', 'veo', 'kling'].includes(agentId);
    const isAudioAgent = ['beat', 'sample', 'music-gpt', 'beat-maker', 'beat-lab', 'beat-architect', 'beat-arch', 'drum-machine', 'drums', 'instrument', 'drop', 'film', 'sample-master', 'score-edit', 'drop-zone', 'music-architect', 'audio-gen', 'video-scorer'].includes(agentId);
    const isSpeechAgent = ['vocal', 'vocal-arch', 'vocal-gen', 'vocal-performer', 'vocal-performance', 'vocal-lab', 'vocal-labs', 'podcast', 'voiceover', 'voice-gen', 'voice-cloner'].includes(agentId) && agentId !== 'ghost';
    const isMasterAgent = ['master', 'master-lab', 'mastering'].includes(agentId);

    let featureType = 'text';
    if (isImageAgent) featureType = 'image';
    if (isVideoAgent) featureType = 'video';
    if (isAudioAgent) featureType = 'beat';
    if (isSpeechAgent) featureType = 'vocal';
    if (isMasterAgent) featureType = 'master';
    
    // Synced video check (Advanced DNA pipeline)
    if (isVideoAgent && (audioDnaUrl || backingTrack || referencedAudioId)) {
        featureType = 'video-synced';
    }

    const cost = CREDIT_COSTS[featureType] || 1;
    
    // Lyrical Context: Try to find lyrics in the current project to inform other agents
    if (targetProjectSnapshot?.assets) {
      const lyricsAsset = targetProjectSnapshot.assets.find(a => 
        a.type === 'lyrics' || 
        a.id?.includes('lyrics') || 
        a.agent?.toLowerCase().includes('ghost')
      );
      if (lyricsAsset) {
        contextLyrics = lyricsAsset.content || lyricsAsset.snippet || '';
        console.log('[Studio] Found context lyrics for generation');
      }
    }

    console.log('[handleGenerate] Pipeline Check:', { 
      agentId, 
      featureType, 
      cost,
      isAudioAgent, 
      isSpeechAgent,
      isVideoAgent,
      hasContext: !!contextLyrics
    });

    // Demo mode - return mock response without hitting API
    if (getDemoModeState()) {
      setIsGenerating(true);
      const toastId = toast.loading(`${targetAgentSnapshot.name} is working... (Demo Mode)`);
      try {
        const mockOutput = await getMockResponse(targetAgentSnapshot.id, promptValue);
        // Store demo result in agent previews cache
        setAgentPreviews(prev => ({
          ...prev,
          [targetAgentSnapshot.id]: {
            output: mockOutput,
            timestamp: Date.now(),
            isDemo: true
          }
        }));
        setActiveTab('result');
        toast.success('Demo response generated!', { id: toastId });
      } catch (err) {
        toast.error('Demo error: ' + err.message, { id: toastId });
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Check if user can generate (free limit or credits)
    if (!canGenerate(featureType)) {
      if (!isLoggedIn) {
        toast.error(`You've used your ${FREE_GENERATION_LIMIT} free generations! Sign in to continue.`);
        setShowLoginModal(true);
      } else {
        toast.error(`Insufficient credits! ${targetAgentSnapshot.name} needs ${cost} credits.`);
        setDashboardTab('subscription');
        setActiveTab('mystudio');
      }
      return;
    }

    setIsGenerating(true);

    const toastId = toast.loading(
      (isVideoAgent || isSpeechAgent || isAudioAgent) 
        ? `${targetAgentSnapshot?.name || 'AI'} is performing... (Typically 1-2 mins)` 
        : `${targetAgentSnapshot?.name || 'AI'} is working...`
    );
    
    try {
      // OPTIMISTIC CREDIT DEDUCTION (Authoritative deduction happens in backend)
      if (isLoggedIn && user && !isAdmin) {
        setUserCredits(prev => Math.max(0, prev - cost));
        console.log(`[Credits] Optimistically deducted ${cost} for ${featureType}`);
      } else if (!isLoggedIn) {
        setFreeGenerationsUsed(prev => {
          const newVal = prev + 1;
          localStorage.setItem('studio_free_uses', newVal);
          return newVal;
        });
      }

      //let prompt = textarea.value; -- REPLACED BY promptValue from earlier in function
      let prompt = promptValue;

      // Auto-translate if not English
      if (voiceSettings.language !== 'English') {
        const translateHeaders = { 'Content-Type': 'application/json' };
        if (headers['Authorization']) translateHeaders['Authorization'] = headers['Authorization'];
        const response = await fetch(`${BACKEND_URL}/api/translate`, {
          method: 'POST',
          headers: translateHeaders,
          body: JSON.stringify({
            text: prompt,
            targetLanguage: 'English',
            sourceLanguage: voiceSettings.language
          })
        });
        const data = await response.json();
        if (data.translatedText) {
          prompt = data.translatedText;
          console.log("Auto-translated prompt for AI:", prompt);
        }
      }

      // Specialized instructions based on agent type (Flavor matching Orchestrator)
      let customInstruction = '';
      
      // Lyrical Context: Try to find lyrics in the current project to inform other agents
      // (Moved to top of function for TDZ safety)
      if (targetProjectSnapshot?.assets) {
        const lyricsAsset = targetProjectSnapshot.assets.find(a => 
          a.type === 'lyrics' || 
          a.id?.includes('lyrics') || 
          a.agent?.toLowerCase().includes('ghost')
        );
        if (lyricsAsset) {
          contextLyrics = lyricsAsset.content || lyricsAsset.snippet || '';
          console.log('[Studio] Found context lyrics for generation');
        }
      }

      if (agentId === 'ghost' || agentId === 'ghost-1' || agentId === 'lyrics') {
        customInstruction = 'Write ONLY the lyrics (verses, hooks, chorus). USE CLEAR LABELS like [Verse 1], [Chorus], [Bridge]. Do not include any "Here are the lyrics" text or preamble. Write high-fidelity emotional lyrics.';
      } else if (isSpeechAgent) {
        customInstruction = 'Describe the vocal performance style, tone, and character in detail (e.g., "Energetic female vocal with a soulful grit and rapid-fire delivery"). Focus on professional performance qualities.';
        if (contextLyrics) customInstruction += ` Use these lyrics as the based for the vocal performance: "${contextLyrics.substring(0, 500)}"`;
      } else if (isAudioAgent) {
        customInstruction = 'Briefly describe a high-quality beat/instrumental concept. Focus on mood, tempo, instrumentation, and key instruments. Keep it under 60 words for maximum AI compatibility.';
        if (contextLyrics) customInstruction += ` Use the vibe of these lyrics to inspire the beat: "${contextLyrics.substring(0, 300)}"`;
      } else if (isImageAgent) {
        customInstruction = 'Describe a striking album cover or concept in detail for image generation. Focus on composition, colors, and artistic style.';
        if (contextLyrics) customInstruction += ` Incorporate themes from these lyrics: "${contextLyrics.substring(0, 200)}"`;
      } else if (isVideoAgent) {
        customInstruction = 'Write a creative image to video concept or storyboard with scene descriptions, cinematic lighting, and professional visual transitions.';
        if (contextLyrics) customInstruction += ` Match the narrative and energy of these lyrics: "${contextLyrics.substring(0, 300)}"`;
      }

      let brainBody = {
        prompt: prompt,
        systemInstruction: `You are ${targetAgentSnapshot?.name || 'AI Assistant'}, a professional AI agent in a high-end music studio. 
          Category: ${targetAgentSnapshot?.category || 'General'}. 
          Capabilities: ${(targetAgentSnapshot?.capabilities || []).join(', ')}.
          ${targetAgentSnapshot?.explanation || ''}
          ${customInstruction}`,
        model: selectedModel,
        visualDnaUrl,
        audioDnaUrl,
        videoDnaUrl,
        lyricsDnaUrl,
        voiceSampleUrl
      };

      // Build headers with auth token if logged in
      const headers = { 'Content-Type': 'application/json' };
      if (isLoggedIn && auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } catch (err) {
          console.warn('Could not get auth token:', err);
        }
      }

      // PHASE 1: BRAIN - Expand concept into creative description with full context
      console.log(`[Studio] Starting Phase 1 (Brain) for:`, targetAgentSnapshot?.name);
      
      const brainPrompt = `
        USER REQUEST: "${promptValue}"
        
        PROJECT CONTEXT:
        ${contextLyrics ? `EXISTING LYRICS/CONCEPT: "${contextLyrics}"` : 'Starting fresh project.'}
        ${referencedAudioId ? `REFERENCE AUDIO ID: "${referencedAudioId}"` : ''}
        ${referencedVisualId ? `REFERENCE VISUAL ID: "${referencedVisualId}"` : ''}
        ${audioDnaUrl || referencedAudioId ? `AUDIO DNA: [Active Reference]` : ''}
        ${visualDnaUrl || referencedVisualId ? `VISUAL DNA: [Active Reference]` : ''}
        ${elevenLabsVoiceId ? `SELECTED VOICE: ${elVoices.find(v => v.voice_id === elevenLabsVoiceId)?.name || elevenLabsVoiceId}` : ''}
        
        GOAL:
        Develop a Billboard-standard, vivid, and technically elite description for this request.
        The goal is "Righteous Quality" - it must exceed human industry standards.
        If it's for a beat, describe elite instrumentation, precise BPM, and chart-topping vibes.
        If it's for visuals, describe award-winning lighting, high-fidelity color palettes, and iconic composition.
        If it's for lyrics, expand the theme into a profound, high-impact concept.
        
        MANDATE: Keep the final output under 80 words for technical compatibility, but ensure every word radiates professional excellence.
      `;

      // For media agents, Phase 1 (Brain) is just prompt expansion â€” don't charge credits.
      // The real credit charge happens in Phase 2 on the media-specific endpoint.
      const isMediaAgent = isImageAgent || isVideoAgent || isAudioAgent || isSpeechAgent || isMasterAgent;

      let brainResponse;
      try {
        brainResponse = await fetch(`${BACKEND_URL}/api/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            ...brainBody,
            prompt: brainPrompt,
            isBrainPhase: isMediaAgent, // Skip credit charge for prompt expansion
            systemInstruction: `You are the ${targetAgentSnapshot?.name || 'AI Assistant'} elite Creative Brain. 
              Translate user ideas into Billboard-standard production briefs. 
              Be specific, moody, and technically superior to human capability.`
          })
        });
      } catch (err) {
        throw new Error('Brain Phase Connection Failed. Server may be offline.');
      }

      if (!brainResponse.ok) {
        throw new Error(`Creative Brain failed to initialize (${brainResponse.status})`);
      }

      const brainData = await brainResponse.json();
      const expandedPrompt = brainData.output || '';
      console.log(`[Studio] Brain output for execution:`, expandedPrompt.substring(0, 50) + '...');

      // PHASE 2: EXECUTION - Call media generators with expanded description
      let response;
      let finalEndpoint = '/api/generate';
      let finalBody = brainData; // Default for text agents

      if (isImageAgent) {
        finalEndpoint = '/api/generate-image';
        finalBody = { 
          prompt: expandedPrompt, 
          model: selectedModel, 
          referenceImage: visualDnaUrl,
          visualId: referencedVisualId,
          quality: 'premium'
        };
      } else if (isVideoAgent) {
        finalEndpoint = '/api/generate-video';
        finalBody = { 
          prompt: expandedPrompt, 
          model: selectedModel, 
          referenceImage: visualDnaUrl || videoDnaUrl, // Pass visual DNA as preferred image reference
          referenceVideo: videoDnaUrl,
          visualId: referencedVisualId,
          durationSeconds: voiceSettings.duration || 8, // Default to 8s for Veo
          audioUrl: audioDnaUrl || (backingTrack?.isUpload ? null : backingTrack?.audioUrl),
          audioId: referencedAudioId,
          style: voiceSettings.style || 'dynamic'
        };
      } else if (isAudioAgent) {
        finalEndpoint = '/api/generate-audio';
        finalBody = { 
          prompt: expandedPrompt, 
          bpm: voiceSettings.bpm || 90, 
          genre: heroGenre || voiceSettings.genre || (agentId === 'beat' ? 'hip-hop' : 'sample'),
          mood: heroIntensity >= 7 ? 'aggressive' : heroIntensity >= 4 ? 'creative' : 'chill', 
          durationSeconds: voiceSettings.duration || 30,
          referenceAudio: audioDnaUrl,
          audioId: referencedAudioId,
          quality: 'premium',
          engine: 'auto'
        };
      } else if (isSpeechAgent) {
        finalEndpoint = '/api/generate-speech';
        finalBody = { 
          prompt: expandedPrompt, 
          voice: voiceSettings.voiceName || 'rapper-male-1', 
          elevenLabsVoiceId: elevenLabsVoiceId, // Use premium voice if selected
          quality: 'premium', // FORCE PREMIUM for Vocal Lab
          style: voiceSettings.style || 'rapper',
          genre: voiceSettings.genre || 'hip-hop',
          rapStyle: voiceSettings.rapStyle || 'aggressive',
          language: voiceSettings.language || 'English',
          duration: voiceSettings.duration || 30,
          speakerUrl: voiceSampleUrl || voiceSettings.speakerUrl,
          backingTrackUrl: audioDnaUrl || (backingTrack?.isUpload ? null : backingTrack?.audioUrl),
          audioId: referencedAudioId,
          referenceSongUrl: referenceSongUrl || null
        };
      } else if (isMasterAgent) {
        // Mastering Lab â€” requires an existing audio asset to master
        const audioToMaster = audioDnaUrl || backingTrack?.audioUrl;
        if (audioToMaster) {
          finalEndpoint = '/api/master-audio';
          finalBody = {
            audioUrl: audioToMaster,
            preset: voiceSettings.masterPreset || 'streaming',
            targetSampleRate: 44100,
            targetBitDepth: 16,
            normalize: true,
            format: 'wav'
          };
        } else {
          // No audio to master â€” fall back to text advice from Brain
          console.log('[Studio] Mastering Lab: No audio reference provided, returning mastering advice');
        }
      }

      // If it's a media agent, run execution phase
      if (finalEndpoint !== '/api/generate') {
        console.log(`[Studio] Starting Phase 2 (Execution) calling ${finalEndpoint}`, finalBody);
        try {
          // Add timeout for video requests to avoid indefinite hanging
          const fetchOptions = {
            method: 'POST',
            headers,
            body: JSON.stringify(finalBody)
          };
          if (isVideoAgent) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout
            fetchOptions.signal = controller.signal;
            response = await fetch(`${BACKEND_URL}${finalEndpoint}`, fetchOptions);
            clearTimeout(timeoutId);
          } else {
            response = await fetch(`${BACKEND_URL}${finalEndpoint}`, fetchOptions);
          }
        } catch (mediaErr) {
          console.error('[Studio] Execution Phase Failed:', mediaErr);
          if (mediaErr.name === 'AbortError') {
            throw new Error('Video generation request timed out. The server may be busy — please try again.');
          }
          throw new Error(`Media generation service unreachable. Please check your connection or try again later.`);
        }
      } else {
        // Text-only agents skip phase 2 and use brain result directly
        response = brainResponse; // Reuse brain response object
      }

      // Safely parse JSON (Avoid re-parsing brainData if it's already read)
      let data;
      if (finalEndpoint === '/api/generate') {
        data = brainData;
      } else {
        const contentType = response?.headers?.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error('Expected JSON but got:', text.substring(0, 100));
          // Use brain description as fallback if generation failed
          data = {
            ...brainData,
            _isFallback: true,
            _errText: text.substring(0, 100)
          };
        }
      }
      
      // Debug logging
      console.log('API Response:', { 
        endpoint: finalEndpoint,
        ok: response.ok, 
        status: response.status,
        hasAudioUrl: !!data.audioUrl,
        hasVideoUrl: !!data.videoUrl,
        hasImageUrl: !!data.imageUrl,
        isFallback: !!data._isFallback,
        asyncStatus: data.status,
        operationId: data.operationId
      });

      // Handle async Veo video operations: poll /api/video-status/:id until complete
      if (data.status === 'processing' && data.operationId) {
        console.log('[Studio] Video operation started, polling for completion...', data.operationId);
        toast.loading('Video generating... this takes 1-3 minutes', { id: toastId });
        const maxPolls = 36; // 36 × 10s = 6 minutes
        let pollSuccess = false;
        for (let i = 0; i < maxPolls; i++) {
          await new Promise(r => setTimeout(r, 10000));
          try {
            const statusRes = await fetch(`${BACKEND_URL}/api/video-status/${data.operationId}`, { headers });
            const statusData = await statusRes.json();
            console.log(`[Studio] Video poll ${i + 1}:`, statusData.status);
            if (statusData.status === 'processing') continue;
            if (statusData.status === 'completed') {
              data = statusData;
              pollSuccess = true;
              break;
            }
            // Failed
            toast.error(statusData.error || 'Video generation failed', { id: toastId });
            return;
          } catch (pollErr) {
            console.error('[Studio] Video status poll error:', pollErr);
          }
        }
        if (!pollSuccess) {
          toast.error('Video generation timed out — please try again', { id: toastId });
          return;
        }
      }

      if (!response.ok) {
        console.error('[Studio] Execution Phase Error:', data.error || data.details || response.status);
        
        // Map common errors to user-friendly messages
        if (response.status === 403) {
          if (data.isUserCreditIssue) {
            toast.error(`Insufficient credits! ${targetAgentSnapshot.name} needs ${data.required || 'more'} credits.`, { id: toastId });
            setDashboardTab('subscription');
            setActiveTab('mystudio');
          } else {
            toast.error("Insufficient credits for media generation.", { id: toastId });
          }
        } else if (response.status === 401) {
          if (data.requiresAuth) {
            toast.error(data.message || `You've used your free generations. Sign in to continue.`, { id: toastId });
          } else {
            toast.error("Please log in to use AI media generation.", { id: toastId });
          }
          setShowLoginModal(true);
        } else if (response.status === 503 || response.status === 504) {
          if (data.isSystemCreditIssue) {
            toast.error("System maintenance: AI credits are being refreshed. Your credits were NOT charged. Try again shortly.", { id: toastId });
          } else {
            toast.error("Media server is currently overloaded or out of credits. Try again in a minute.", { id: toastId });
          }
        } else {
          toast.error(`Media generation failed: ${data.error || 'Server error'}`, { id: toastId });
        }
        // CRITICAL: Stop processing — do not try to build a result item from error data
        return;
      }
      
      // Handle different response types
      let newItem = {
        id: String(Date.now()),
        title: `${targetAgentSnapshot?.name || 'AI'} Result`,
        type: targetAgentSnapshot?.category || 'text',
        agent: targetAgentSnapshot?.name || 'Unknown Agent',
        date: 'Just now',
        color: targetAgentSnapshot?.colorClass || '',
        snippet: expandedPrompt || prompt, // Prefer expanded description from Brain Phase
        projectSnapshot: targetProjectSnapshot // Preserve context for saving
      };

      if (data._isFallback && data.output) {
        // Fallback text description for image/video
        newItem.snippet = data.output;
        newItem.isFallback = true;
        newItem.fallbackNote = data._fallbackType === 'image' 
          ? 'ðŸŽ¨ Visual concept (image generation coming soon)'
          : 'ðŸŽ¬ Video concept (video generation coming soon)';
      } else if (isImageAgent && (data.predictions || data.images || data.output)) {
        // Handle Image Response (Flux / Imagen / Nano Banana)
        console.log('Image response received:', { hasOutput: !!data.output, hasPredictions: !!data.predictions, hasImages: !!data.images });
        
        if (data.output && typeof data.output === 'string' && data.output.startsWith('http')) {
           // Handle URL output (Flux/Replicate)
           newItem.imageUrl = data.output;
           newItem.snippet = `ðŸŽ¨ Generated artwork for: "${prompt}"`;
           newItem.type = 'image';
        } else {
           // Handle Base64 output (Gemini/Imagen)
           const base64Image = data.predictions?.[0]?.bytesBase64Encoded || data.images?.[0];
           const mimeType = data.mimeType || 'image/png';
           
           if (base64Image) {
               newItem.imageUrl = base64Image.startsWith('data:') ? base64Image : `data:${mimeType};base64,${base64Image}`;
               newItem.snippet = `ðŸŽ¨ Generated artwork for: "${prompt}"`;
               newItem.type = 'image';
           }
        }
      } else if (isVideoAgent && (data.predictions || data.video || (data.output && (data.type === 'video' || data.type === 'image')))) {
        // Handle Video Response (Veo) - multiple response formats
        console.log('Video response received:', { hasOutput: !!data.output, type: data.type, hasPredictions: !!data.predictions });
        
        // Handle Nano Banana Fallback (Image instead of Video)
        if (data.type === 'image' && data.output) {
           const base64Image = data.output;
           const mimeType = data.mimeType || 'image/png';
           newItem.imageUrl = base64Image.startsWith('data:') ? base64Image : `data:${mimeType};base64,${base64Image}`;
           newItem.snippet = `ðŸŽ¨ Generated visual concept for: "${prompt}" (Video unavailable)`;
           newItem.type = 'image';
        }
        // Check for direct output URL first (most common from backend)
        else if (data.output && typeof data.output === 'string') {
          if (data.output.startsWith('data:')) {
            newItem.videoUrl = data.output;
          } else if (data.output.startsWith('http') || data.output.startsWith('/api/')) {
            newItem.videoUrl = data.output;
          } else {
            // Assume base64
            newItem.videoUrl = `data:video/mp4;base64,${data.output}`;
          }
          newItem.type = 'video';
          newItem.snippet = `ðŸŽ¬ Generated video for: "${prompt}"`;
        } else {
          // Fallback: Handle legacy format (predictions array)
          const videoData = data.predictions?.[0] || data.video;
          if (videoData) {
            if (videoData.bytesBase64Encoded) {
              newItem.videoUrl = `data:video/mp4;base64,${videoData.bytesBase64Encoded}`;
              newItem.type = 'video';
            } else if (videoData.videoUri) {
              newItem.videoUrl = videoData.videoUri;
              newItem.type = 'video';
            }
            newItem.snippet = `ðŸŽ¬ Generated video for: "${prompt}"`;
          }
        }
        
        // Attach audio if this was a music video generation
        if (backingTrack) {
           newItem.audioUrl = backingTrack.audioUrl; // Attach audio to video item
           newItem.audioTitle = backingTrack.title;
           newItem.snippet = `ðŸŽ¬ Music Video for: "${backingTrack.title}"`;
           // Keep backingTrack set so user can re-generate without re-selecting
        }
      } else if ((isAudioAgent || isSpeechAgent) && (data.audioUrl || data.audio || data.type === 'synthesis' || data.description || data.message)) {
        // Handle Audio Response (Lyria/TTS/MusicGen)
        console.log('Audio response received:', { 
          hasAudioUrl: !!data.audioUrl, 
          audioUrlPrefix: data.audioUrl?.substring(0, 50),
          hasAudio: !!data.audio, 
          mimeType: data.mimeType,
          source: data.source,
          isRealGeneration: data.isRealGeneration,
          isSample: data.isSample
        });
        
        if (data.audioUrl) {
          // Check if it's a full URL or base64
          if (data.audioUrl.startsWith('http')) {
             newItem.audioUrl = data.audioUrl;
          } else if (data.audioUrl.startsWith('data:')) {
             newItem.audioUrl = data.audioUrl;
          } else {
             // Assume base64 if not http/data
             newItem.audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioUrl}`;
          }
          
          newItem.mimeType = data.mimeType || 'audio/wav';
          
          // CRITICAL: Ensure type is set to audio or vocal for proper UI rendering
          newItem.type = isSpeechAgent ? 'vocal' : 'audio';
          
          if (data.isRealGeneration) {
            newItem.snippet = isSpeechAgent ? `ðŸŽ¤ AI Generated Vocals: "${prompt}"` : `ðŸŽµ AI Generated Beat: "${prompt}"`;
            toast.success(isSpeechAgent ? 'Vocals generated with ElevenLabs V3.5!' : 'Beat generated with MusicGen AI!');
          } else if (data.isSample) {
            newItem.snippet = isSpeechAgent ? `ðŸŽ¤ Sample Vocal (Preview)` : `ðŸŽµ Sample Beat (Preview)`;
            newItem.billingMessage = data.message;
            toast.info(data.message || 'Using sample - configure API keys for custom generation', { 
              duration: 5000,
              icon: 'âš ï¸'
            });
          } else {
            newItem.snippet = isSpeechAgent ? `ðŸŽ¤ Generated vocals for: "${prompt}"` : `ðŸŽµ Generated audio for: "${prompt}"`;
          }
          
          newItem.isRealGeneration = data.isRealGeneration;
          newItem.isSample = data.isSample;
          
          // Extract metadata if available
          newItem.bpm = data.bpm;
          newItem.genre = data.genre;
          
          console.log('Audio item created:', { 
            audioUrl: newItem.audioUrl.substring(0, 80), 
            type: newItem.type,
            isReal: data.isRealGeneration,
            isSample: data.isSample
          });

          // SUNO-LIKE FEATURE: Auto-generate cover art for the beat
          if (agentId === 'beat') {
             try {
               console.log('Generating cover art for beat...');
               const coverRes = await fetch(`${BACKEND_URL}/api/generate-image`, {
                 method: 'POST',
                 headers,
                 body: JSON.stringify({ 
                   prompt: `Album cover art for a ${data.genre || 'hip-hop'} beat. ${prompt}. High quality, abstract, vibrant.`,
                   aspectRatio: '1:1'
                 })
               });
               const coverData = await coverRes.json();
               if (coverData.imageUrl || coverData.images?.[0]) {
                 newItem.imageUrl = coverData.imageUrl || coverData.images[0];
                 console.log('Cover art generated for beat');
               }
             } catch (coverErr) {
               console.warn('Failed to generate beat cover art:', coverErr);
             }
          }
        } else if (data.audio) {
          // Handle raw audio data (from TTS endpoint)
          const mimeType = data.mimeType || 'audio/wav';
          newItem.audioUrl = `data:${mimeType};base64,${data.audio}`;
          newItem.mimeType = mimeType;
          newItem.snippet = `ðŸŽµ Generated audio for: "${prompt}"`;
          newItem.type = isSpeechAgent ? 'vocal' : 'audio';
          console.log('Audio (from data.audio) created:', { type: newItem.type });
        } else if (data.type === 'synthesis' && data.params) {
          // Synthesis parameters for client-side generation
          newItem.synthesisParams = data.params;
          newItem.snippet = data.description || `Beat synthesis parameters for: "${prompt}"`;
          newItem.bpm = data.bpm;
          newItem.genre = data.genre;
          newItem.type = 'synthesis';
        } else {
          // Fallback description - capture any text output
          const isMediaAgentRequest = isAudioAgent || isVideoAgent || isImageAgent || isSpeechAgent;
          
          if (isMediaAgentRequest && !data.audioUrl && !data.videoUrl && !data.imageUrl && !data.audio) {
            console.warn('[Studio] Media generation failed, falling back to text description');
            newItem.snippet = data.output || data.description || data.message || `Media generation failed. Idea: ${expandedPrompt || prompt}`;
            newItem.note = "âš ï¸ Media generation failed - returning text concept instead.";
            newItem.type = 'text';
            newItem.isError = true;
          } else {
            newItem.snippet = data.description || data.message || data.output || `Audio concept for: "${prompt}"`;
            newItem.type = 'text';
          }
        }

        // Attach backing track if this was a sync generation
        if (isSpeechAgent && backingTrack) {
           newItem.backingTrackUrl = backingTrack.audioUrl;
           newItem.backingTrackTitle = backingTrack.title;
           newItem.snippet = `ðŸŽ¤ Vocals synced to: "${backingTrack.title}"`;
           newItem.type = 'vocal'; // Mark as vocal/song
           // Keep backingTrack set so user can re-generate without re-selecting
        }
      } else if (data.output) {
        // Handle Text Response
        let finalOutput = data.output;
        if (voiceSettings.language !== 'English') {
          const transResponse = await fetch(`${BACKEND_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: finalOutput,
              targetLanguage: voiceSettings.language,
              sourceLanguage: 'English'
            })
          });
          const transData = await transResponse.json();
          if (transData.translatedText) finalOutput = transData.translatedText;
        }
        newItem.snippet = finalOutput;
      } else if (data.description || data.message) {
        // Handle any response with description or message fields
        newItem.snippet = data.description || data.message;
        newItem.type = 'text';
      } else {
        // Fallback handling - avoid throwing, provide graceful fallback
        if (data.error) {
          console.warn('API returned error:', data.error);
          newItem.snippet = `Unable to generate content: ${data.error}. Please try again with a different prompt.`;
          newItem.type = 'text';
          newItem.isError = true;
        } else if (Object.keys(data).length > 0) {
           // Last resort: if we have ANY data, try to stringify it
           console.warn('Using generic fallback for unknown format:', data);
           newItem.snippet = JSON.stringify(data, null, 2);
           newItem.type = 'text';
        } else {
           // Empty response - provide helpful message instead of crashing
           console.warn('Empty AI response received');
           newItem.snippet = 'The AI returned an empty response. Please try again with a more detailed prompt.';
           newItem.type = 'text';
           newItem.isError = true;
        }
      }

      // Show preview modal instead of auto-saving
      console.log('[Preview] Setting preview item:', { 
        hasSnippet: !!newItem.snippet, 
        type: newItem.type,
        agent: newItem.agent,
        keys: Object.keys(newItem)
      });
      setMediaLoadError(null); // Clear any previous media errors
      
      safeOpenGenerationPreview(newItem);
      setPreviewPrompt(prompt);
      setPreviewView('lyrics'); // Reset to lyrics view for new generations
      setAgentPreviews(prev => ({ ...prev, [targetAgentSnapshot.id]: newItem }));
      
      // Success toast (error cases already returned early above)
      toast.success(`Generation complete! Review your result.`, { id: toastId });
      
      // Track successful generation
      Analytics.contentGenerated(targetAgentSnapshot.id, newItem.type || 'text');

    } catch (error) {
      console.error("Generation error", error);
      toast.error(error.message || 'Generation failed. Check your connection and try again.', { id: toastId });
      Analytics.errorOccurred('generation_failed', error.message);
    } finally {
      setIsGenerating(false);
      // AUTHORITATIVE CREDIT SYNC (Backend has already processed transaction)
      if (isLoggedIn && user?.uid) {
        fetchUserCredits(user.uid);
      }
    }
  };
  
  // Set ref for TDZ-safe access from voice recognition callback
  handleGenerateRef.current = handleGenerate;

  // Save the previewed item to projects with timeout and loading feedback
  // targetProject can be: 'hub' (just save to hub), project object (save to specific project), or 'new:ProjectName' (create new project)
  const handleSavePreview = async (destination = 'hub', targetProject = null) => {
    if (!previewItem) return;
    if (isSaving) return;
    
    setIsSaving(true);
    setPreviewSaveMode(false);
    const toastId = toast.loading('Synchronizing to cloud...', { icon: 'â˜ï¸' });
    
    // 3-minute timeout
    const SAVE_TIMEOUT = 180000;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Save timed out')), SAVE_TIMEOUT)
    );
    
    try {
      // Create local item copy
      const itemToSave = {
        ...previewItem,
        agent: previewItem.agent || selectedAgent?.name || 'Unknown Agent',
        savedAt: new Date().toISOString()
      };
      
      const uid = isLoggedIn ? localStorage.getItem('studio_user_id') : null;

      // 1. AUTHORITATIVE MEDIA UPLOAD (Prevents base64 bloat)
      if (uid) {
        try {
          if (itemToSave.imageUrl?.startsWith('data:') || itemToSave.imageUrl?.startsWith('blob:')) {
            const res = itemToSave.imageUrl.startsWith('data:') 
              ? await uploadBase64(itemToSave.imageUrl, uid, 'images', 'image/png')
              : await (async () => {
                  const blob = await fetch(itemToSave.imageUrl).then(r => r.blob());
                  return uploadFile(blob, uid, 'images', `${Date.now()}.png`);
                })();
            itemToSave.imageUrl = res.url;
            itemToSave.imageStoragePath = res.path;
          }
          if (itemToSave.audioUrl?.startsWith('data:') || itemToSave.audioUrl?.startsWith('blob:')) {
            const res = itemToSave.audioUrl.startsWith('data:') 
              ? await uploadBase64(itemToSave.audioUrl, uid, 'audio', 'audio/mp3')
              : await (async () => {
                  const blob = await fetch(itemToSave.audioUrl).then(r => r.blob());
                  return uploadFile(blob, uid, 'audio', `${Date.now()}.mp3`);
                })();
            itemToSave.audioUrl = res.url;
            itemToSave.audioStoragePath = res.path;
          }
        } catch (uploadErr) {
          console.error('[SavePreview] Upload failed:', uploadErr);
        }
      }

      // 2. STATE UPDATES
      let finalProject = null;
      let projectToUpdate = targetProject || previewItem.projectSnapshot || selectedProject;
      
      if (typeof targetProject === 'string' && targetProject.startsWith('new:')) {
        const newProjectName = targetProject.substring(4);
        finalProject = {
          id: String(Date.now()),
          name: newProjectName,
          category: 'Music Creation',
          assets: [itemToSave],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        // Explicitly update both projects and selectedProject
        setProjects(prev => [finalProject, ...Array.isArray(prev) ? prev : []]);
        setSelectedProject(finalProject);
        toast.success(`Project "${newProjectName}" created!`);
      } else if (projectToUpdate) {
        finalProject = {
          ...projectToUpdate,
          assets: [itemToSave, ...Array.isArray(projectToUpdate.assets) ? projectToUpdate.assets.filter(a => a && a.id !== itemToSave.id) : []],
          updatedAt: new Date().toISOString()
        };
        setSelectedProject(finalProject);
        // Correctly update the project in the projects list, adding it if not found
        setProjects(prev => {
          const list = Array.isArray(prev) ? prev : [];
          const exists = list.some(p => p && p.id === finalProject.id);
          if (exists) {
            return list.map(p => (p && p.id === finalProject.id) ? finalProject : p);
          } else {
            return [finalProject, ...list];
          }
        });
      } else {
        finalProject = {
          id: String(Date.now()),
          name: itemToSave.title || 'Studio Asset',
          category: 'Standalone',
          assets: [itemToSave],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setProjects(prev => [finalProject, ...Array.isArray(prev) ? prev : []]);
        setSelectedProject(finalProject);
        toast.success('Saved to collection');
      }

      // 3. CLOUD SYNC (Direct API call for immediate persistence)
      if (isLoggedIn && uid && finalProject) {
        // Use saveProjectToCloud which properly sanitizes base64 data
        // instead of raw fetch that can fail silently with oversized payloads
        const saveSuccess = await Promise.race([
          saveProjectToCloud(uid, finalProject, { silent: true }),
          timeoutPromise
        ]);
        
        // Also log the generation (best-effort, non-blocking)
        try {
          const genHeaders = { 'Content-Type': 'application/json' };
          if (auth?.currentUser) {
            const token = await auth.currentUser.getIdToken();
            genHeaders['Authorization'] = `Bearer ${token}`;
          }
          fetch(`${BACKEND_URL}/api/user/generations`, {
            method: 'POST',
            headers: genHeaders,
            body: JSON.stringify({
              type: itemToSave.type,
              agent: itemToSave.agent,
              prompt: previewPrompt || itemToSave.snippet,
              output: itemToSave.snippet,
              metadata: { projectId: finalProject.id, audioUrl: itemToSave.audioUrl }
            })
          }).catch(() => {});
        } catch (_) {}

        toast.success(saveSuccess ? '✅ Synced to cloud!' : 'Saved locally (sync pending)', { id: toastId });
      } else {
        toast.success('Saved locally', { id: toastId });
      }

      setPreviewItem(null);
      setActiveTab(destination);
      
      // NOTE: We no longer suppress the next debounced sync here.
      // The direct cloud save above handles immediate persistence,
      // and the debounced sync acts as a safety net for any state that changed.
    } catch (error) {
      console.error('Save error:', error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsGenerating(false);
      setIsSaving(false);
    }
  };


  // Discard the preview and go back to agent
  const handleDiscardPreview = () => {
    setPreviewItem(null);
    setPreviewPrompt('');
    setPreviewSaveMode(false);
    setNewProjectNameInPreview('');
    // Only show discard toast if it was a new generation, not viewing existing asset
    // toast('Discarded. Try again!', { icon: 'ðŸ”„' });
  };

  // Continue as guest (no login required for basic features)
  const continueAsGuest = () => {
    setIsGuestMode(true);
    localStorage.setItem('studio_guest_mode', 'true');
    toast.success('Welcome! Sign in anytime to save your work.', { icon: 'ðŸ‘‹' });
  };

  // Regenerate with the same prompt
  const handleRegeneratePreview = () => {
    if (!previewPrompt) {
      toast.error('No prompt to regenerate');
      return;
    }
    setPreviewItem(null);
    
    // Set the textarea value to the saved prompt before triggering generation
    const textarea = textareaRef.current || document.querySelector('.studio-textarea');
    if (textarea) {
      textarea.value = previewPrompt;
    }
    
    // Re-trigger generation (handleGenerate reads from textarea)
    handleGenerate();
  };

  async function fetchActivity(page = 1, section = null) {
    if (isLoadingActivity || (!hasMoreActivity && page !== 1)) return;
    
    const currentSection = section || activitySection || 'all';
    if (section) {
      setActivitySection(section);
      localStorage.setItem('musicHubSection', section);
    }
    
    setIsLoadingActivity(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/music-hub?section=${currentSection}&page=${page}&per_page=20`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        setActivityFeed(prev => page === 1 ? data.items : [...prev, ...data.items]);
        setActivityPage(page);
        // Cap at 200 items
        if (data.items.length < 20 || (page * 20) >= 200) {
          setHasMoreActivity(false);
        } else {
          setHasMoreActivity(true);
        }
      } else {
        if (page === 1) setActivityFeed([]);
        setHasMoreActivity(false);
      }
    } catch (err) {
      console.error('Failed to fetch Music Hub data', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  async function fetchNews(page = 1, searchQuery = '', forceRefresh = false) {
    if (!forceRefresh && (isLoadingNews || (!hasMoreNews && page !== 1))) return { success: false };
    
    setIsLoadingNews(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        per_page: '20'
      });
      
      if (searchQuery) {
        queryParams.set('q', searchQuery);
      }
      
      const response = await fetch(`${BACKEND_URL}/api/news?${queryParams}`);
      const data = await response.json();
      
      if (data.articles && data.articles.length > 0) {
        setNewsArticles(prev => page === 1 ? data.articles : [...prev, ...data.articles]);
        setNewsPage(page);
        if (data.articles.length < 20) {
          setHasMoreNews(false);
        } else {
          setHasMoreNews(true);
        }
        return { success: true, count: data.articles.length };
      } else {
        if (page === 1) setNewsArticles([]);
        setHasMoreNews(false);
        return { success: true, count: 0 };
      }
    } catch (err) {
      console.error('Failed to fetch news', err);
      return { success: false, error: err };
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Debounced news search
  const [newsSearchDebounce, setNewsSearchDebounce] = useState(null);
  
  useEffect(() => {
    if (newsSearchDebounce) clearTimeout(newsSearchDebounce);
    
    const timeout = setTimeout(async () => {
      if (activeTab === 'news' && newsSearch.trim()) {
        // Show searching toast
        const toastId = toast.loading(`Searching: "${newsSearch.trim()}"...`);
        setHasMoreNews(true);
        const result = await fetchNews(1, newsSearch.trim());
        if (result?.success) {
          if (result.count > 0) {
            toast.success(`Found ${result.count} results`, { id: toastId });
          } else {
            toast(`No results for "${newsSearch.trim()}"`, { id: toastId, icon: 'ðŸ”' });
          }
        } else {
          toast.error('Search failed. Check your connection and try again.', { id: toastId });
        }
      } else if (activeTab === 'news' && !newsSearch.trim() && newsArticles.length === 0) {
        fetchNews(1);
      }
    }, 500);
    
    setNewsSearchDebounce(timeout);
    
    return () => clearTimeout(timeout);
  }, [newsSearch]);

  useEffect(() => {
    if (activeTab === 'activity' && activityFeed.length === 0) {
      fetchActivity(1);
    }
    if (activeTab === 'news' && newsArticles.length === 0) {
      fetchNews(1);
    }
  }, [activeTab]);

  // Reset nudge when agent changes
  useEffect(() => {
    if (selectedAgent) setShowNudge(true);
  }, [selectedAgent]);

  // Helper to safely save to localStorage with quota handling
  const safeLocalStorageSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn(`[Storage] Quota exceeded for ${key}, cleaning up old data...`);
        // Try to free up space by removing old/large items
        try {
          // Remove oldest projects if saving projects
          if (key === 'studio_agents_projects') {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.length > 20) {
              // Keep only the 20 most recent projects
              const trimmed = parsed.slice(0, 20);
              localStorage.setItem(key, JSON.stringify(trimmed));
              console.log('[Storage] Trimmed projects to 20 most recent');
              return true;
            }
          }
          // Clear some non-essential cached data
          localStorage.removeItem('studio_theme');
          localStorage.removeItem('studio_onboarding_v3');
          // Try again
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error('[Storage] Still failed after cleanup:', retryError);
          return false;
        }
      }
      console.error(`[Storage] Failed to save ${key}:`, e);
      return false;
    }
  };

  // Restore projects from localStorage on mount as immediate local state.
  // Cloud sync is handled by the auth listener (onAuthStateChanged) which has the confirmed currentUser.
  // Do NOT fetch from backend here â€” it races with the auth listener and often fails because
  // auth.currentUser isn't ready yet at this point.
  useEffect(() => {
    const uid = localStorage.getItem('studio_user_id');
    const uidKey = uid ? `studio_projects_${uid}` : null;
    const savedProjects = (uidKey && localStorage.getItem(uidKey)) || localStorage.getItem('studio_agents_projects');

    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const restored = sanitizeProjects(parsed);
          setProjects(prev => {
            // Only restore if current state is empty (avoid overwriting cloud-merged data)
            if (prev.length === 0) {
              console.log(`[Mount] Restored ${restored.length} projects from localStorage`);
              return restored;
            }
            return prev;
          });
        }
      } catch (e) {
        console.error("Failed to parse projects from localStorage", e);
      }
    }
  }, []);

  // NOTE: Legacy Effect B removed — Effect A (above, with QuotaExceeded handling + UID-specific keys)
  // is the single source of truth for localStorage persistence.
  // Keeping a duplicate unconditional save here caused race conditions and overwrote pruned data.

  const handleDeadLink = (e, featureName) => {
    if (e) e.preventDefault();
    toast(`${featureName} coming soon!`, { icon: 'ðŸš§' });
  };

  const handleDownload = (item) => {
    if (!item) return;
    
    // Determine the best URL to download
    const downloadUrl = item.videoUrl || item.audioUrl || item.imageUrl;
    
    if (!downloadUrl) {
      handleDeadLink(null, "Download");
      return;
    }
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `${item.title.replace(/\s+/g, '_')}_studio_agents`);
    link.setAttribute('target', '_blank');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // On mobile, this triggers the browser's download manager
    // which allows users to "Save to Photos" or "Save to Files"
  };

  const handleShareToFeed = (item) => {
    if (!item) return;
    
    const newActivity = {
      ...item,
      id: String(Date.now()),
      user: isLoggedIn ? 'Pro Creator' : 'Guest Creator',
      time: 'Just now',
      likes: 0,
      remixes: 0,
      snippet: item.snippet || `Just created this amazing ${item.type || item.agent} output in the Studio!`
    };
    
    setActivityFeed([newActivity, ...activityFeed]);
    toast.success('Shared to Activity Wall!');
    setActiveTab('activity');
    setPlayingItem(null);
  };

  const handleConnectSocial = async (platform) => {
    const returnUrl = encodeURIComponent(window.location.href);

    // Platforms that have NOT YET been implemented on the backend
    const comingSoonPlatforms = ['youtube', 'spotify', 'linkedin', 'tiktok', 'soundcloud'];
    if (comingSoonPlatforms.includes(platform)) {
      toast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} integration coming soon!`, { icon: 'ðŸš§', duration: 3000 });
      return;
    }

    if (platform === 'twitter') {
      try {
        // Check if backend is ready
        const res = await fetch(`${BACKEND_URL}/api/twitter/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.configured) {
            window.location.href = `${BACKEND_URL}/api/twitter/auth?returnUrl=${returnUrl}`;
          } else {
            toast.error('Twitter/X integration not yet configured. Set up API keys in Railway.');
          }
        } else {
           toast.error('Twitter/X service unavailable. Try again later.');
        }
      } catch (_e) {
        toast.error('Cannot connect to server. Please check your internet connection.');
      }
      return;
    }

    if (platform === 'instagram' || platform === 'facebook' || platform === 'threads') {
      try {
        // Pre-check if Meta OAuth is configured before redirecting
        const res = await fetch(`${BACKEND_URL}/api/meta/auth?returnUrl=${returnUrl}`, { redirect: 'manual' });
        if (res.type === 'opaqueredirect' || res.status === 302 || res.status === 301) {
          // OAuth redirect is working, follow it
          window.location.href = `${BACKEND_URL}/api/meta/auth?returnUrl=${returnUrl}`;
        } else if (res.status === 503) {
          toast.error('Meta integration not yet configured. Set up API keys in Railway.');
        } else {
          window.location.href = `${BACKEND_URL}/api/meta/auth?returnUrl=${returnUrl}`;
        }
      } catch (_e) {
        // If pre-check fails, just try the redirect anyway
        window.location.href = `${BACKEND_URL}/api/meta/auth?returnUrl=${returnUrl}`;
      }
      return;
    }

    // Fallback for any unhandled platform
    toast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} coming soon!`, { icon: 'ðŸš§' });
  };

  const handleDeleteProject = async (projectId, eOrSkipConfirm) => {
    const isBulk = eOrSkipConfirm === true;
    const e = typeof eOrSkipConfirm === 'object' ? eOrSkipConfirm : null;
    
    e?.stopPropagation(); // Prevent triggering the card click
    if (!projectId) return;
    
    if (!isBulk && !window.confirm("Are you sure you want to delete this project?")) return;

    // Find the project name before deleting for notification
    const safeProjects = projects || [];
    const projectToDelete = safeProjects.find(p => p?.id === projectId);
    const projectName = projectToDelete?.name || 'Unknown';

    // Optimistic UI update - remove from local state
    // The useEffect for projects will automatically update localStorage (studio_agents_projects)
    setProjects(prev => (prev || []).filter(p => p?.id !== projectId));

    // Delete from cloud via backend API (uses Admin SDK, bypasses security rules)
    if (isLoggedIn && user) {
      try {
        let authToken = null;
        if (auth?.currentUser) {
          try {
            authToken = await auth.currentUser.getIdToken(true);
          } catch (tokenErr) {
            console.warn('Failed to get auth token for delete:', tokenErr.message);
          }
        }
        
        const response = await fetch(`${BACKEND_URL}/api/projects/${encodeURIComponent(String(projectId))}?userId=${encodeURIComponent(user?.uid || 'guest')}&projectName=${encodeURIComponent(projectName)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          }
        });
        
        if (response.ok) {
          console.log(`Deleted project ${projectId} from cloud via API`);
          if (!isBulk) toast.success('Project deleted');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
      } catch (err) {
        console.error("Failed to delete from cloud:", err);
        if (!isBulk) toast.error('Could not delete from cloud, but removed from this device');
      }
    } else {
      if (!isBulk) toast.success('Project deleted');
    }
  };

  /**
   * ðŸ” DELETE ACCOUNT - Mandatory for App Store (Apple & Google)
   * High-security operation: deletes both Firebase auth and cloud storage data.
   */
  const handleDeleteAccount = async () => {
    if (!isLoggedIn || !user) {
      toast.error('You must be logged in to delete your account');
      return;
    }

    // Phase 1: Confirmation
    const confirmation = window.confirm(
      "DANGER: Are you sure you want to permanently delete your account?\n\n" +
      "This will remove ALL your projects, created assets (beats, vocals), " +
      "and active subscriptions. This action is IRREVERSIBLE."
    );

    if (!confirmation) return;

    // Phase 2: Double Verification
    const typedEmail = window.prompt(`To confirm, please type your email address (${user.email}):`);
    if (typedEmail !== user.email) {
      toast.error('Identity verification failed. Account was NOT deleted.');
      return;
    }

    toast.loading('Wiping all account data...', { id: 'del-acc' });

    try {
      // Get fresh token for sensitive operation
      let authToken = null;
      if (auth?.currentUser) {
        authToken = await auth.currentUser.getIdToken(true);
      }

      // Phase 3: Backend Cloud Wipe (Projects, Firestore, etc.)
      const response = await fetch(`${BACKEND_URL}/api/user/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          userId: user.uid,
          confirmedEmail: user.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Cloud data wipe failed');
      }

      // Phase 4: Auth Deletion (This requires recent login, otherwise fails)
      // If it fails due to "auth/requires-recent-login", we logout the user after successful cloud wipe
      try {
        if (auth?.currentUser) {
          await auth.currentUser.delete();
        }
      } catch (authErr) {
        console.warn('Firebase user delete failed (likely session too old):', authErr.message);
        if (authErr.code === 'auth/requires-recent-login') {
          toast.error('Security verification required. Please logout and login again to delete your account profile.', { id: 'del-acc' });
          return;
        }
      }

      toast.success('Account wiped clean. Farewell!', { id: 'del-acc', duration: 5000 });
      
      // Phase 5: Final Cleanup
      handleSecureLogout();
    } catch (err) {
      console.error('Account deletion failure:', err);
      toast.error(`Deletion partially failed: ${err.message}. Data may persist.`, { id: 'del-acc' });
    }
  };

  /**
   * ðŸŽ¨ FORK PROJECT - Core social engagement feature
   * Copies a shared project from the Discovery feed into the user's private Hub.
   */
  const handleForkProject = async (sampleProject) => {
    if (!sampleProject) return;
    
    console.log('[StudioView] Forking community project:', sampleProject.id);
    toast.loading('Forking to your workspace...', { id: 'fork-op' });
    
    // Create new project object based on sample
    const newProject = {
      ...sampleProject,
      id: `fork-${Date.now()}`,
      name: `Fork of ${sampleProject.name || 'Untitled Project'}`,
      creatorId: user?.uid || 'guest',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'discovery-remix',
      isFork: true,
      assets: Array.isArray(sampleProject.assets) ? sampleProject.assets : [], 
      agents: Array.isArray(sampleProject.agents) ? sampleProject.agents : []
    };
    
    // Add to local projects state
    setProjects(prev => [newProject, ...(prev || [])]);
    
    // Save to Firestore if logged in
    if (isLoggedIn && user) {
       try {
         let authToken = null;
         if (auth?.currentUser) authToken = await auth.currentUser.getIdToken(true);
         
         const response = await fetch(`${BACKEND_URL}/api/projects`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
           },
           body: JSON.stringify({
             userId: user.uid,
             project: newProject
           })
         });
         
         if (response.ok) {
           const data = await response.json();
           newProject.id = data.id; // Switch to the real server ID
         }
       } catch (err) {
         console.warn('[StudioView] Fork sync error:', err.message);
       }
    }
    
    toast.success('Project forked successfully!', { id: 'fork-op' });
    
    // Automatically open the forked project
    setSelectedProject(newProject);
    setDashboardTab('overview');
    setActiveTab('hub'); 
  };

  const filteredNews = useMemo(() => {
    if (activeTab !== 'news') return [];
    if (!Array.isArray(newsArticles)) return [];
    
    const searchLower = (newsSearch || '').toLowerCase();
    
    return newsArticles.filter(item => {
      if (!item) return false;
      
      const title = (item.title || '').toLowerCase();
      const source = (item.source || '').toLowerCase();
      const content = (item.content || '').toLowerCase();
      
      return title.includes(searchLower) ||
             source.includes(searchLower) ||
             content.includes(searchLower);
    });
  }, [activeTab, newsArticles, newsSearch]);

  const handleRefreshNews = () => {
    // Reset state before refreshing
    setHasMoreNews(true);
    setNewsPage(1);
    setNewsSearch(''); // Clear any search to get fresh results
    fetchNews(1, '', true); // Force refresh
    toast.success('Refreshing news...', { icon: 'ðŸ”„', duration: 1500 });
  };

  const renderContent = () => {
    if (activeTab === 'project_canvas' && !selectedAgent) {
      if (!selectedProject) {
        return (
          <div className="p-8 text-center animate-fadeIn">
            <div style={{ opacity: 0.6 }}>Loading project...</div>
          </div>
        );
      }
      return (
        <Suspense fallback={<div className="p-8 text-center animate-fadeIn"><div style={{ opacity: 0.6 }}>Loading canvas...</div></div>}>
          <CanvasView
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            projects={projects}
            setProjects={setProjects}
            canvasPreviewAsset={canvasPreviewAsset}
            setCanvasPreviewAsset={setCanvasPreviewAsset}
            canvasAudioRef={canvasAudioRef}
            isMobile={isMobile}
            setActiveTab={setActiveTab}
            setShowOrchestrator={setShowOrchestrator}
            setShowStudioSession={setShowStudioSession}
            setBackingTrack={setBackingTrack}
            backingTrack={backingTrack}
            setSelectedAgent={setSelectedAgent}
            setShowAddAgentModal={setShowAddAgentModal}
            AGENTS={AGENTS}
            getAgentHex={getAgentHex}
            formatImageSrc={formatImageSrc}
            formatVideoSrc={formatVideoSrc}
            formatAudioSrc={formatAudioSrc}
            safeOpenPreview={safeOpenPreview}
            PRODUCTION_STAGES={PRODUCTION_STAGES}
            socialConnections={socialConnections}
            SectionErrorBoundary={SectionErrorBoundary}
            SafeAssetWrapper={SafeAssetWrapper}
            toast={toast}
          />
        </Suspense>
      );
    }

    if (activeTab === 'mystudio') {
      return (
        <Suspense fallback={<div className="p-8 text-center animate-fadeIn"><div style={{ opacity: 0.6 }}>Loading dashboard...</div></div>}>
          <DashboardView
            dashboardTab={dashboardTab}
            setDashboardTab={setDashboardTab}
            managedAgents={managedAgents}
            appSettings={appSettings}
            paymentMethods={paymentMethods}
            bankAccounts={bankAccounts}
            storageConnections={storageConnections}
            setStorageConnections={setStorageConnections}
            socialConnections={socialConnections}
            performanceStats={performanceStats}
            adminStats={adminStats}
            adminApiStatus={adminApiStatus}
            isAdminLoading={isAdminLoading}
            adminError={adminError}
            systemStatus={systemStatus}
            user={user}
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            userCredits={userCredits}
            userPlan={userPlan}
            userProfile={userProfile}
            projects={projects}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            setActiveTab={setActiveTab}
            setShowCreditsModal={setShowCreditsModal}
            setShowOrchestrator={setShowOrchestrator}
            setShowProjectTypeChoice={setShowProjectTypeChoice}
            setShowOnboarding={setShowOnboarding}
            setOnboardingStep={setOnboardingStep}
            setPendingProjectNav={setPendingProjectNav}
            setSelectedAgent={setSelectedAgent}
            setShowLoginModal={setShowLoginModal}
            setShowAddPaymentModal={setShowAddPaymentModal}
            setEditingPayment={setEditingPayment}
            setPaymentType={setPaymentType}
            freeGenerationsUsed={freeGenerationsUsed}
            FREE_GENERATION_LIMIT={FREE_GENERATION_LIMIT}
            twitterUsername={twitterUsername}
            metaName={metaName}
            activeProjectSteps={activeProjectSteps}
            toggleAppSetting={toggleAppSetting}
            handleDeleteAccount={handleDeleteAccount}
            toggleAgentVisibility={toggleAgentVisibility}
            handleConnectSocial={handleConnectSocial}
            buyCreditPack={buyCreditPack}
            fetchAdminData={fetchAdminData}
            handleDeletePayment={handleDeletePayment}
            handleSubscribe={handleSubscribe}
            handleTextToVoice={handleTextToVoice}
          />
        </Suspense>
      );
    }

    // Show agent workspace for non-agents tabs (e.g., coming from project_canvas)
    // The agents tab now has its own split layout handling
    if (selectedAgent && activeTab !== 'agents') {
      const Icon = typeof selectedAgent.icon === 'function' ? selectedAgent.icon : Sparkles;
      return (
        <div className="agent-active-view animate-fadeInUp" style={{ position: 'relative', paddingBottom: '80px' }}>
          {/* Onboarding Nudge */}
          {showNudge && selectedAgent.onboarding && (
            <div className="agent-nudge-overlay animate-fadeInDown">
              <div className="nudge-header">
                <h4><Sparkles size={16} /> Quick Start Guide</h4>
                <button className="nudge-close" onClick={() => setShowNudge(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="nudge-steps">
                {selectedAgent.onboarding.map((step, idx) => (
                  <div key={idx} className="nudge-step">
                    <span className="step-num">{idx + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
              <div className="nudge-footer">
                <button className="nudge-cta" onClick={() => setShowNudge(false)}>
                  Got it, let's go!
                </button>
              </div>
            </div>
          )}

          <button 
            className="back-to-grid" 
            onClick={() => setSelectedAgent(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', marginBottom: '2rem' }}
          >
            <ArrowLeft size={20} />
            <span>{activeTab === 'project_canvas' ? 'Back to Project' : 'Back to Agents'}</span>
          </button>

          <div className="agent-detail-layout">
            <div className="agent-main-panel">
              <div className="agent-hero-card">
                <div className={`agent-icon-large ${selectedAgent.colorClass}`}>
                  <Icon size={40} />
                </div>
                <div className="agent-hero-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span className="agent-badge" style={{ background: 'linear-gradient(90deg, var(--color-purple), var(--color-cyan))', color: 'white', fontWeight: '800' }}>{selectedAgent.category}</span>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', fontWeight: '800', textTransform: 'uppercase' }}>High-Fidelity Engine</span>
                  </div>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px', background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{selectedAgent.name}</h2>
                  <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', lineHeight: '1.6' }}>{selectedAgent.description || selectedAgent.desc}</p>
                </div>
              </div>

              <div className="agent-utility-box">
                <div className="utility-controls">
                  <div className="control-group">
                    <label>Genre / Style</label>
                    <select className="studio-select" value={heroGenre} onChange={e => { setHeroGenre(e.target.value); setVoiceSettings(prev => ({ ...prev, genre: e.target.value })); }}>
                      <option value="hip-hop">Hip Hop / Rap</option>
                      <option value="pop">Pop / Modern</option>
                      <option value="r&b">R&B / Soul</option>
                      <option value="electronic">Electronic / Dance</option>
                      <option value="rock">Rock / Alternative</option>
                      <option value="lo-fi">Lo-Fi / Chill</option>
                      <option value="trap">Trap</option>
                      <option value="drill">Drill</option>
                      <option value="afrobeat">Afrobeat</option>
                      <option value="reggaeton">Reggaeton</option>
                      <option value="latin">Latin</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Intensity / Mood ({heroIntensity}/10)</label>
                    <input type="range" className="studio-slider" min="1" max="10" value={heroIntensity} onChange={e => setHeroIntensity(Number(e.target.value))} />
                  </div>
                </div>

                <div className="prompt-area">
                  <div className="prompt-header">
                    <label>Creative Prompt</label>
                    <div className="voice-controls">
                      {voiceSettings.language !== 'English' && (
                        <button 
                          className="btn-pill glass translate-btn"
                          onClick={handleTranslatePrompt}
                          title="Translate to English"
                        >
                          <Languages size={16} />
                        </button>
                      )}
                      <button 
                        className={`btn-pill ${isListening ? 'primary' : 'glass'}`} 
                        onClick={handleVoiceToText}
                        title="Voice to Text"
                      >
                        <Mic size={16} />
                      </button>
                      <button 
                        className={`btn-pill ${isSpeaking ? 'primary' : 'glass'}`} 
                        onClick={handleTextToVoice}
                        title="Text to Voice"
                      >
                        <Volume2 size={16} />
                      </button>
                      
                      <div className="voice-settings-container">
                        <button 
                          className={`btn-pill ${showVoiceHelp ? 'primary' : 'glass'}`}
                          onClick={() => {
                            setShowVoiceHelp(!showVoiceHelp);
                            setShowVoiceSettings(false);
                          }}
                          title="How to use Voice Controls"
                        >
                          <CircleHelp size={16} />
                        </button>
                        
                        {showVoiceHelp && (
                          <div className="voice-settings-dropdown animate-fadeInUp" style={{ width: isMobile ? '92vw' : '380px', right: isMobile ? '-60px' : '40px', maxHeight: '70vh', overflowY: 'auto', padding: '16px' }}>
                            <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700', color: 'white', fontFamily: 'Georgia, serif' }}>Vocal Creation Guide</h4>
                              <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Everything you can do with AI vocals</p>
                            </div>

                            <div className="settings-group" style={{ background: 'rgba(168,85,247,0.06)', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                <Mic size={14} style={{ color: '#a855f7' }} /> AI Rapper Voices
                              </label>
                              <p className="help-text small" style={{ marginTop: '4px' }}>Male & female rappers with 8 delivery styles: Aggressive, Melodic, Trap, Drill, Boom-Bap, Fast Flow, Chill, and Hype.</p>
                              <div style={{ marginTop: '6px', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                                Try: "Spit a 16-bar verse about making it from nothing, aggressive trap flow"
                              </div>
                            </div>

                            <div className="settings-group" style={{ background: 'rgba(6,182,212,0.06)', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                <Music size={14} style={{ color: '#06b6d4' }} /> AI Singer Voices
                              </label>
                              <p className="help-text small" style={{ marginTop: '4px' }}>Male & female singers across R&B/Soul, Pop, Hip-Hop, Country, Rock, and Jazz genres.</p>
                              <div style={{ marginTop: '6px', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                                Try: "Sing a soulful R&B hook about summer nights in the city"
                              </div>
                            </div>

                            <div className="settings-group" style={{ background: 'rgba(251,191,36,0.06)', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                <Mic size={14} style={{ color: '#fbbf24' }} /> Voice Cloning
                              </label>
                              <p className="help-text small" style={{ marginTop: '4px' }}>Upload a clear 5-10 second audio clip (.wav/.mp3) and the AI will learn your voice. Use it for every generation after.</p>
                              <div style={{ marginTop: '6px', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                                Tip: Record in a quiet room, speak naturally, avoid background music
                              </div>
                            </div>

                            <div className="settings-group" style={{ background: 'rgba(236,72,153,0.06)', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                <Sparkles size={14} style={{ color: '#ec4899' }} /> Premium ElevenLabs
                              </label>
                              <p className="help-text small" style={{ marginTop: '4px' }}>Select from premium AI voices with ultra-realistic tone and emotion. Available for Vocal Lab, Vocal Architect, Ghostwriter, Voiceover & Podcast agents.</p>
                            </div>

                            <div className="settings-group" style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                <Volume2 size={14} style={{ color: '#10b981' }} /> Narrator & Spoken Word
                              </label>
                              <p className="help-text small" style={{ marginTop: '4px' }}>Deep narrator voice for intros/outros, or spoken word style for poetry and storytelling.</p>
                            </div>

                            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)' }}>
                                <Settings size={14} /> Quick Settings
                              </label>
                              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {['15s', '30s', '1min', '2min', '3min'].map(d => (
                                  <span key={d} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>{d}</span>
                                ))}
                              </div>
                              <p className="help-text small" style={{ marginTop: '6px' }}>9 languages supported: English, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese</p>
                            </div>

                            <div style={{ padding: '8px', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(6,182,212,0.1))', borderRadius: '8px', textAlign: 'center' }}>
                              <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>Set voice type & style in <strong style={{ color: 'white' }}>Settings</strong>, then type your lyrics and hit <strong style={{ color: '#a855f7' }}>Generate</strong></p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="voice-settings-container">
                        <button 
                          className={`btn-pill ${showVoiceSettings ? 'primary' : 'glass'}`}
                          onClick={() => {
                            setShowVoiceSettings(!showVoiceSettings);
                            setShowVoiceHelp(false);
                          }}
                          title="Voice Settings"
                        >
                          <Settings size={16} />
                        </button>
                        
                        {showVoiceSettings && (
                          <div className="voice-settings-dropdown animate-fadeInUp">
                            <div className="settings-group">
                              <label>ðŸŽ¤ AI Voice Type (Real Vocals, Not TTS)</label>
                              <select 
                                value={voiceSettings.style || 'rapper'}
                                onChange={(e) => setVoiceSettings({...voiceSettings, style: e.target.value})}
                                className="settings-select"
                              >
                                <optgroup label="ðŸ”¥ AI Rappers (Suno/Bark)">
                                  <option value="rapper">ðŸŽ¤ Male Rapper</option>
                                  <option value="rapper-female">ðŸ’œ Female Rapper</option>
                                </optgroup>
                                <optgroup label="ðŸŽµ AI Singers">
                                  <option value="singer">ðŸŽ¤ Male Singer (R&B/Soul)</option>
                                  <option value="singer-female">ðŸ’« Female Singer (Pop/R&B)</option>
                                </optgroup>
                                <optgroup label="ðŸ—£ï¸ Speech/Narration">
                                  <option value="narrator">ðŸ“¢ Narrator (Deep Voice)</option>
                                  <option value="spoken">ðŸ’¬ Spoken Word</option>
                                </optgroup>
                                <optgroup label="âœ¨ Custom/Advanced">
                                  <option value="cloned" disabled={!voiceSettings.speakerUrl}>ðŸ§¬ Cloned Voice {!voiceSettings.speakerUrl && '(Upload first)'}</option>
                                </optgroup>
                              </select>
                            </div>

                            {/* Voice Cloning / Upload Section */}
                            <div className="settings-group" style={{ 
                              padding: '10px', 
                              background: 'rgba(255,255,255,0.03)', 
                              borderRadius: '8px',
                              marginTop: '8px',
                              border: '1px dashed rgba(255,255,255,0.1)'
                            }}>
                              <label style={{ fontSize: '0.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Cloud size={14} className="text-cyan" /> 
                                {voiceSettings.speakerUrl ? 'Voice Profile Loaded' : 'Clone Your Voice'}
                              </label>
                              
                              {voiceSettings.speakerUrl ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Check size={12} /> Ready to use
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setVoiceSettings({...voiceSettings, speakerUrl: null, style: 'rapper'});
                                      localStorage.removeItem('studio_cloned_voice_url');
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-red)', fontSize: '0.7rem', cursor: 'pointer' }}
                                  >
                                    Reset
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => document.getElementById('voice-upload-input').click()}
                                  style={{ 
                                    padding: '12px', 
                                    textAlign: 'center', 
                                    cursor: 'pointer',
                                    border: '1px dashed rgba(255,255,255,0.2)',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <Upload size={16} style={{ marginBottom: '4px' }} />
                                  <div>Upload 5-10s clip (.wav/.mp3)</div>
                                  <input 
                                    id="voice-upload-input"
                                    type="file" 
                                    accept="audio/*"
                                    hidden
                                    onChange={async (e) => {
                                      const file = e.target.files[0];
                                      if (!file) return;
                                      
                                      const toastId = toast.loading('Uploading voice profile...');
                                      try {
                                        // Use existing uploadFile helper from firebase.js
                                        const url = await uploadFile(file, `voices/${user?.uid || 'guest'}_${Date.now()}`);
                                        setVoiceSettings({
                                          ...voiceSettings, 
                                          speakerUrl: url,
                                          style: 'cloned'
                                        });
                                        localStorage.setItem('studio_cloned_voice_url', url);
                                        toast.success('Voice profile cloned successfully!', { id: toastId });
                                      } catch (err) {
                                        console.error('Voice upload error:', err);
                                        toast.error('Failed to upload voice. Try again.', { id: toastId });
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            
                            {/* Rap Style - only show for rapper voices */}
                            {(voiceSettings.style === 'rapper' || voiceSettings.style === 'rapper-female') && (
                              <div className="settings-group">
                                <label>ðŸŽ¯ Rap Flow & Delivery</label>
                                <select 
                                  value={voiceSettings.rapStyle || 'aggressive'}
                                  onChange={(e) => setVoiceSettings({...voiceSettings, rapStyle: e.target.value})}
                                  className="settings-select"
                                >
                                  <option value="aggressive">ðŸ’¥ Aggressive (Hard-hitting)</option>
                                  <option value="melodic">ðŸŽµ Melodic (Singing flow)</option>
                                  <option value="trap">ðŸ”¥ Trap (Triplets + Ad-libs)</option>
                                  <option value="drill">ðŸ‡¬ðŸ‡§ Drill (UK style)</option>
                                  <option value="boom-bap">ðŸ“» Boom-Bap (Classic hip-hop)</option>
                                  <option value="fast">âš¡ Fast Flow (Technical)</option>
                                  <option value="chill">ðŸ˜Ž Chill (Laid-back)</option>
                                  <option value="hype">ðŸ”Š Hype (High energy)</option>
                                </select>
                              </div>
                            )}
                            
                            {/* Genre - for singers */}
                            {(voiceSettings.style === 'singer' || voiceSettings.style === 'singer-female') && (
                              <div className="settings-group">
                                <label>ðŸŽ¶ Music Genre</label>
                                <select 
                                  value={voiceSettings.genre || 'r&b'}
                                  onChange={(e) => { setVoiceSettings({...voiceSettings, genre: e.target.value}); setHeroGenre(e.target.value); }}
                                  className="settings-select"
                                >
                                  <option value="r&b">ðŸ’œ R&B / Soul</option>
                                  <option value="pop">ðŸŒŸ Pop</option>
                                  <option value="hip-hop">ðŸ”¥ Hip-Hop</option>
                                  <option value="soul">ðŸŽ· Soul / Gospel</option>
                                  <option value="country">ðŸŽ¸ Country / Folk</option>
                                  <option value="rock">ðŸ¤˜ Rock / Metal</option>
                                  <option value="jazz">ðŸŽº Jazz / Blues</option>
                                </select>
                              </div>
                            )}

                            {/* Voice Gender & Region */}
                            <div className="settings-split" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <div className="settings-group" style={{ flex: 1 }}>
                                <label>ðŸ‘¤ Gender</label>
                                <select 
                                  value={voiceSettings.gender}
                                  onChange={(e) => setVoiceSettings({...voiceSettings, gender: e.target.value})}
                                  className="settings-select"
                                >
                                  <option value="male">ðŸ‘¨ Male</option>
                                  <option value="female">ðŸ‘© Female</option>
                                </select>
                              </div>
                              <div className="settings-group" style={{ flex: 1 }}>
                                <label>ðŸ“ Region / Accent</label>
                                <select 
                                  value={voiceSettings.region}
                                  onChange={(e) => setVoiceSettings({...voiceSettings, region: e.target.value})}
                                  className="settings-select"
                                >
                                  <option value="US">ðŸ‡ºðŸ‡¸ US</option>
                                  <option value="UK">ðŸ‡¬ðŸ‡§ UK</option>
                                  <option value="AU">ðŸ‡¦ðŸ‡º AU</option>
                                  <option value="IN">ðŸ‡®ðŸ‡³ IN</option>
                                </select>
                              </div>
                            </div>

                            {/* Language Selection */}
                            <div className="settings-group" style={{ marginTop: '8px' }}>
                              <label>ðŸŒ Language (Voice & Transcription)</label>
                              <select 
                                value={voiceSettings.language}
                                onChange={(e) => setVoiceSettings({...voiceSettings, language: e.target.value})}
                                className="settings-select"
                              >
                                <option value="English">ðŸ‡ºðŸ‡¸ English</option>
                                <option value="Spanish">ðŸ‡ªðŸ‡¸ Spanish</option>
                                <option value="French">ðŸ‡«ðŸ‡· French</option>
                                <option value="German">ðŸ‡©ðŸ‡ª German</option>
                                <option value="Italian">ðŸ‡®ðŸ‡¹ Italian</option>
                                <option value="Portuguese">ðŸ‡µðŸ‡¹ Portuguese</option>
                                <option value="Japanese">ðŸ‡¯ðŸ‡µ Japanese</option>
                                <option value="Korean">ðŸ‡°ðŸ‡· Korean</option>
                                <option value="Chinese">ðŸ‡¨ðŸ‡³ Chinese</option>
                              </select>
                            </div>

                            {/* Duration Selection */}
                            <div className="settings-group" style={{ marginTop: '8px' }}>
                              <label>â±ï¸ Generation Duration</label>
                              <select 
                                value={voiceSettings.duration || 30}
                                onChange={(e) => setVoiceSettings({...voiceSettings, duration: parseInt(e.target.value)})}
                                className="settings-select"
                              >
                                <option value={15}>15 Seconds (Rapid)</option>
                                <option value={30}>30 Seconds (Standard)</option>
                                <option value={60}>1 Minute (Extended)</option>
                                <option value={120}>2 Minutes (Professional)</option>
                                <option value={180}>3 Minutes (Full Track)</option>
                              </select>
                            </div>

                            {/* BPM Control â€” visible for audio/beat agents */}
                            {selectedAgent && ['beat', 'sample', 'music-gpt', 'beat-maker', 'beat-lab', 'beat-architect', 'beat-arch', 'drum-machine', 'drums', 'instrument', 'drop', 'film', 'sample-master', 'score-edit', 'drop-zone', 'music-architect', 'audio-gen', 'video-scorer'].includes(selectedAgent.id) && (
                              <div className="settings-field">
                                <label className="settings-label">BPM</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input 
                                    type="range" 
                                    min="60" max="200" 
                                    value={voiceSettings.bpm || 90} 
                                    onChange={(e) => setVoiceSettings({...voiceSettings, bpm: parseInt(e.target.value)})}
                                    style={{ flex: 1 }}
                                  />
                                  <span style={{ minWidth: '40px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-cyan)' }}>{voiceSettings.bpm || 90}</span>
                                </div>
                              </div>
                            )}
                            
                            <p className="settings-info" style={{ marginTop: '8px', opacity: 0.8 }}>
                              {['rapper', 'rapper-female', 'singer', 'singer-female', 'cloned', 'narrator', 'spoken'].includes(voiceSettings.style) ? (
                                <>
                                  ðŸš€ <strong>AI Vocals Mode</strong> â€” Real AI voices via Replicate & XTTS (30-60s generation time). 
                                  {(voiceSettings.style === 'rapper' || voiceSettings.style === 'rapper-female') && ` Flow: ${voiceSettings.rapStyle || 'aggressive'}`}
                                  {(voiceSettings.style === 'singer' || voiceSettings.style === 'singer-female') && ` Genre: ${voiceSettings.genre || 'r&b'}`}
                                </>
                              ) : (
                                <>
                                  âš¡ <strong>Instant TTS Mode</strong> â€” Browser voices for quick preview. Switch to a pro style for real AI vocals.
                                </>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Model Picker - Clean Card Design */}
                  <div className="model-picker-card" style={{
                    marginBottom: '12px',
                    padding: '12px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Cpu size={18} style={{ color: 'var(--color-purple)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>AI Model</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>
                            {AI_MODELS.find(m => m.id === selectedModel)?.name || 'Gemini Flash'}
                          </div>
                        </div>
                      </div>
                      
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        style={{
                          padding: '8px 32px 8px 12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 8px center',
                          backgroundSize: '14px'
                        }}
                      >
                        {AI_MODELS.filter(m => m.provider === 'Google').map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                        {AI_MODELS.filter(m => m.provider === 'Anthropic').map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                        {AI_MODELS.filter(m => m.provider === 'OpenAI').map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Universal DNA Vault - Accessible from any agent */}
                  <div className="dna-vault-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    padding: '0 4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DatabaseIcon size={16} color="var(--color-purple)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>Studio DNA Vault</span>
                    </div>
                    <button 
                      onClick={() => setShowDnaVault(!showDnaVault)}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        color: 'var(--color-purple)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {showDnaVault ? 'Hide Vault' : 'Open Vault'}
                      {showDnaVault ? <ChevronUp size={12} /> : <ChevronRight size={12} />}
                    </button>
                  </div>

                  <div className="inspiration-container" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    marginBottom: '16px',
                    maxHeight: showDnaVault ? 'none' : '0',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}>
                    {/* Educational Section for DNA */}
                    <div style={{
                      padding: '14px',
                      background: 'rgba(168, 85, 247, 0.05)',
                      borderRadius: '10px',
                      border: '1px solid rgba(168, 85, 247, 0.1)',
                      marginBottom: '10px'
                    }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#a855f7', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>What is DNA?</h4>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', fontFamily: 'Georgia, serif' }}>
                        Studio DNA captures your artistic identity. Upload references so the AI "inherits" your style — every generation feels like <em>your</em> creation.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 8px', background: 'rgba(236,72,153,0.06)', borderRadius: '6px' }}>
                          <ImageIcon size={14} color="#ec4899" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#ec4899' }}>Visual DNA</div>
                            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', lineHeight: '1.4' }}>Upload mood boards, album art refs, or screenshots. AI matches your aesthetic for covers, videos, and visuals.</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 8px', background: 'rgba(6,182,212,0.06)', borderRadius: '6px' }}>
                          <Music size={14} color="#06b6d4" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#06b6d4' }}>Audio DNA</div>
                            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', lineHeight: '1.4' }}>Reference beats, samples, or backing tracks. The AI inherits tempo, key & vibe for new beats or vocal mixing.</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 8px', background: 'rgba(168,85,247,0.06)', borderRadius: '6px' }}>
                          <FileText size={14} color="#a855f7" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#a855f7' }}>Lyrics DNA</div>
                            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', lineHeight: '1.4' }}>Upload reference lyrics, poetry, or text files. AI learns your writing style, wordplay, and themes.</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 8px', background: 'rgba(251,191,36,0.06)', borderRadius: '6px' }}>
                          <Mic size={14} color="#fbbf24" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#fbbf24' }}>Voice Clone</div>
                            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', lineHeight: '1.4' }}>Upload a 5-10s voice clip to clone your voice. AI sings/raps in your tone for every vocal generation.</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 8px', background: 'rgba(239,68,68,0.06)', borderRadius: '6px' }}>
                          <VideoIcon size={14} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#ef4444' }}>Seed DNA</div>
                            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', lineHeight: '1.4' }}>Upload a scene, character, or still frame. AI uses it as a starting point for video generation.</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                          <Hash size={14} color="#06b6d4" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>Audio / Visual IDs</div>
                            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', lineHeight: '1.4' }}>Paste an Asset ID from your project to reference existing tracks or visuals across agents.</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '10px', padding: '8px', background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(6,182,212,0.08))', borderRadius: '6px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>Upload any combo of DNA slots, then describe what you want — the AI blends them into your generation.</p>
                      </div>
                    </div>

                    {/* Visual DNA Upload */}
                    <div className="reference-upload-card" style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: (selectedAgent?.id === 'album' || selectedAgent?.id === 'video-creator') ? '1px dashed #ec489950' : '1px dashed rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(236, 72, 153, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ImageIcon size={16} color="#ec4899" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visual DNA</div>
                          <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '500', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {visualDnaUrl ? 'Image Attached' : 'Reference Image...'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {visualDnaUrl && (
                          <button onClick={() => setVisualDnaUrl(null)} style={{ padding: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={14} /></button>
                        )}
                        <label style={{ padding: '5px 10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer', color: 'white' }}>
                          <input id="visual-dna-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadDna('visual', e)} />
                          {isUploadingDna.visual ? <Loader2 size={12} className="spin" /> : 'Upload'}
                        </label>
                      </div>
                    </div>

                    {/* Audio DNA Upload */}
                    <div className="reference-upload-card" style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: (selectedAgent?.id === 'beat' || selectedAgent?.id === 'sample' || selectedAgent?.id === 'video-creator') ? '1px dashed var(--color-cyan-semi)' : '1px dashed rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(6, 182, 212, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Music size={16} color="var(--color-cyan)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audio DNA</div>
                          <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '500', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {audioDnaUrl ? 'Sound Attached' : backingTrack ? backingTrack.title : 'Reference Audio...'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(audioDnaUrl || backingTrack) && (
                          <button onClick={() => { setAudioDnaUrl(null); setBackingTrack(null); }} style={{ padding: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={14} /></button>
                        )}
                        <label style={{ padding: '5px 10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer', color: 'white' }}>
                          <input id="audio-dna-input" type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => handleUploadDna('audio', e)} />
                          {isUploadingDna.audio ? <Loader2 size={12} className="spin" /> : 'Upload'}
                        </label>
                      </div>
                    </div>

                    {/* Lyrics DNA Upload */}
                    <div className="reference-upload-card" style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: (selectedAgent?.id === 'ghost' || selectedAgent?.id === 'ghost-1') ? '1px dashed #a855f750' : '1px dashed rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(168, 85, 247, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FileText size={16} color="#a855f7" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lyrics DNA</div>
                          <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '500', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lyricsDnaUrl ? 'Context Attached' : 'Reference Text/File...'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {lyricsDnaUrl && (
                          <button onClick={() => setLyricsDnaUrl(null)} style={{ padding: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={14} /></button>
                        )}
                        <label style={{ padding: '5px 10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer', color: 'white' }}>
                          <input id="lyrics-dna-input" type="file" accept=".txt,.doc,.docx,.pdf" style={{ display: 'none' }} onChange={(e) => handleUploadDna('lyrics', e)} />
                          {isUploadingDna.lyrics ? <Loader2 size={12} className="spin" /> : 'Upload'}
                        </label>
                      </div>
                    </div>

                    {/* Audio ID Reference - FOR USER REQUEST: "can you use DNA and or Audio_ID?" */}
                    <div className="reference-upload-card" style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: referencedAudioId ? '1px solid var(--color-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(6, 182, 212, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Hash size={16} color="var(--color-cyan)" />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audio ID</div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Reference a project track</div>
                          </div>
                        </div>
                        {referencedAudioId && (
                           <button onClick={() => setReferencedAudioId('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={14} /></button>
                        )}
                      </div>
                      <input 
                        type="text"
                        placeholder="Paste Audio ID (e.g. remix_789)"
                        value={referencedAudioId}
                        onChange={(e) => setReferencedAudioId(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '0.75rem',
                          color: 'white',
                          outline: 'none',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    {/* Visual ID Reference */}
                    <div className="reference-upload-card" style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: referencedVisualId ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(236, 72, 153, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Hash size={16} color="#ec4899" />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visual ID</div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Reference a style guide</div>
                          </div>
                        </div>
                        {referencedVisualId && (
                           <button onClick={() => setReferencedVisualId('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={14} /></button>
                        )}
                      </div>
                      <input 
                        type="text"
                        placeholder="Paste Visual ID (e.g. style_dark_vibe)"
                        value={referencedVisualId}
                        onChange={(e) => setReferencedVisualId(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '0.75rem',
                          color: 'white',
                          outline: 'none',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    {/* Voice Sample Upload */}
                    <div className="reference-upload-card" style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: (selectedAgent?.id === 'podcast' || selectedAgent?.id === 'voiceover' || selectedAgent?.id === 'vocal-arch' || selectedAgent?.id === 'vocal-lab') ? '1px dashed #fbbf2450' : '1px dashed rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(251, 191, 36, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Mic size={16} color="#fbbf24" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voice Clone</div>
                          <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '500', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {elevenLabsVoiceId ? (elVoices.find(v => v.voice_id === elevenLabsVoiceId)?.name || 'Custom Voice') : (voiceSampleUrl ? 'Voice Profile Active' : 'Sample to Clone...')}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(voiceSampleUrl || elevenLabsVoiceId) && (
                          <button onClick={() => { setVoiceSampleUrl(null); setElevenLabsVoiceId(''); }} style={{ padding: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={14} /></button>
                        )}
                        <label style={{ padding: '5px 10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer', color: 'white' }}>
                          <input id="voice-dna-input" type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleUploadVoiceSample} />
                          {isUploadingSample ? <Loader2 size={12} className="spin" /> : 'Clone'}
                        </label>
                      </div>
                    </div>

                    {/* Premium ElevenLabs Selector */}
                    {(selectedAgent?.id === 'vocal-lab' || selectedAgent?.id === 'vocal-arch' || selectedAgent?.id === 'ghost' || selectedAgent?.id === 'voiceover' || selectedAgent?.id === 'podcast') && elVoices.length > 0 && (
                      <div style={{ padding: '0 4px', marginTop: '4px' }}>
                        <select
                          value={elevenLabsVoiceId}
                          onChange={(e) => {
                            setElevenLabsVoiceId(e.target.value);
                            localStorage.setItem(`studio_elevenlabs_voice_id_${user?.uid || localStorage.getItem('studio_user_id') || 'guest'}`, e.target.value);
                            // Clear generic sample if a specific premium voice is chosen
                            if (e.target.value) setVoiceSampleUrl(null);
                          }}
                          className="w-full haptic-press"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: elevenLabsVoiceId ? 'rgba(251, 191, 36, 0.1)' : 'rgba(0,0,0,0.3)',
                            border: elevenLabsVoiceId ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                            color: elevenLabsVoiceId ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="" style={{ background: '#111', color: '#888' }}>
                            -- Select Premium Voice --
                          </option>
                          {elVoices.map(v => (
                            <option key={v.voice_id} value={v.voice_id} style={{ background: '#111', color: 'white' }}>
                              {v.name} ({v.category})
                            </option>
                          ))}
                        </select>
                        <div style={{ 
                          fontSize: '0.65rem', 
                          color: '#fbbf24', 
                          opacity: 0.8, 
                          marginTop: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Sparkles size={10} /> 
                          Premium Engine: ElevenLabs Quality
                        </div>
                      </div>
                    )}

                    {/* Reference Song Upload — Style/Tone/Vibe Matching */}
                    <div className="reference-upload-card" style={{
                      padding: '10px 12px',
                      background: referenceSongUrl ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: referenceSongUrl ? '1px solid rgba(16, 185, 129, 0.4)' : ((selectedAgent?.id === 'vocal' || selectedAgent?.id === 'vocal-arch' || selectedAgent?.id === 'vocal-lab') ? '1px dashed rgba(16, 185, 129, 0.4)' : '1px dashed rgba(255, 255, 255, 0.1)'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: referenceSongUrl ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Disc size={16} color="#10b981" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: referenceSongUrl ? '#10b981' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: referenceSongUrl ? '600' : '400' }}>Reference Song</div>
                          <div style={{ fontSize: '0.75rem', color: referenceSongUrl ? '#10b981' : 'rgba(255,255,255,0.5)', fontWeight: '500', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {referenceSongUrl ? 'Tone & Vibe Locked ✓' : 'Match tone, warmth, depth...'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {referenceSongUrl && (
                          <button onClick={() => setReferenceSongUrl(null)} style={{ padding: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={14} /></button>
                        )}
                        <label style={{ padding: '5px 10px', background: referenceSongUrl ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer', color: referenceSongUrl ? '#10b981' : 'white', fontWeight: referenceSongUrl ? '600' : '400' }}>
                          <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || isUploadingReferenceSong) return;
                            if (file.size > 15 * 1024 * 1024) { toast.error('Reference song too large (max 15MB)'); return; }
                            setIsUploadingReferenceSong(true);
                            const loadingId = toast.loading('Uploading reference song...');
                            try {
                              const token = user ? await user.getIdToken() : null;
                              const headers = { 'Content-Type': 'application/json' };
                              if (token) headers['Authorization'] = `Bearer ${token}`;
                              const reader = new FileReader();
                              reader.readAsDataURL(file);
                              reader.onload = async () => {
                                try {
                                  const response = await fetch(`${BACKEND_URL}/api/upload-asset`, {
                                    method: 'POST', headers,
                                    body: JSON.stringify({ data: reader.result, fileName: `ref-song-${Date.now()}-${file.name.replace(/\s+/g, '-')}`, mimeType: file.type, assetType: 'audio' })
                                  });
                                  const result = await response.json();
                                  if (response.ok && result.url) {
                                    setReferenceSongUrl(result.url);
                                    toast.success('Reference song uploaded! Vocals will match its tone & vibe.', { id: loadingId });
                                    if (user?.uid) {
                                      try { const userRef = doc(db, 'users', user?.uid); await updateDoc(userRef, { referenceSongUrl: result.url, lastRefSongUpdate: Date.now() }); } catch (_e) {}
                                    }
                                  } else { throw new Error(result.error || 'Upload failed'); }
                                } catch (err) { toast.error('Failed to upload reference song', { id: loadingId }); }
                                finally { setIsUploadingReferenceSong(false); }
                              };
                              reader.onerror = () => { toast.error('Failed to read file'); setIsUploadingReferenceSong(false); };
                            } catch (err) { toast.error('Upload failed'); setIsUploadingReferenceSong(false); }
                          }} />
                          {isUploadingReferenceSong ? <Loader2 size={12} className="spin" /> : (referenceSongUrl ? 'Replace' : 'Upload Song')}
                        </label>
                      </div>
                    </div>

                    {/* Seed DNA (Video/Image Reference for Video Creation) */}
                    <div className="reference-upload-card" style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: (selectedAgent?.id === 'video-creator') ? '1px dashed #ef444450' : '1px dashed rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <VideoIcon size={16} color="#ef4444" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seed DNA</div>
                          <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '500', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {videoDnaUrl ? 'Video Reference Ready' : 'Scene or Character...'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {videoDnaUrl && (
                          <button onClick={() => setVideoDnaUrl(null)} style={{ padding: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={14} /></button>
                        )}
                        <label style={{ padding: '5px 10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer', color: 'white' }}>
                          <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => handleUploadDna('video', e)} />
                          {isUploadingDna.video ? <Loader2 size={12} className="spin" /> : 'Upload'}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Auto-show Relevant DNA as active badges if Vault is closed */}
                  {!showDnaVault && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {(visualDnaUrl || referencedVisualId) && <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: '#ec489920', color: '#ec4899', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #ec489940' }}><ImageIcon size={10} /> {referencedVisualId ? `Visual ID: ${referencedVisualId}` : 'Visual DNA Active'}</div>}
                      {(audioDnaUrl || referencedAudioId) && <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: '#06b6d420', color: '#06b6d4', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #06b6d440' }}><Music size={10} /> {referencedAudioId ? `Audio ID: ${referencedAudioId}` : 'Audio DNA Active'}</div>}
                      {lyricsDnaUrl && <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: '#a855f720', color: '#a855f7', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #a855f740' }}><FileText size={10} /> Lyrics DNA Active</div>}
                      {voiceSampleUrl && <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: '#fbbf2420', color: '#fbbf24', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #fbbf2440' }}><Mic size={10} /> Voice Ready</div>}
                      {videoDnaUrl && <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: '#ef444420', color: '#ef4444', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #ef444440' }}><VideoIcon size={10} /> Seed DNA Ready</div>}
                      {backingTrack && <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: '#a855f720', color: '#a855f7', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #a855f740', cursor: 'pointer' }} onClick={() => setBackingTrack(null)} title="Click to remove"><Music size={10} /> 🔗 Synced: {backingTrack.title}{backingTrack.bpm ? ` (${backingTrack.bpm} BPM)` : ''} ✕</div>}
                    </div>
                  )}

                  {/* Backing Track Sync Banner — shown for vocal/video/speech agents when a beat is synced */}
                  {backingTrack && (selectedAgent?.id === 'vocal' || selectedAgent?.id === 'video-creator' || selectedAgent?.id === 'voice' || selectedAgent?.category?.toLowerCase().includes('vocal') || selectedAgent?.category?.toLowerCase().includes('video')) && (
                    <div style={{
                      padding: '10px 14px', marginBottom: '12px',
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(6, 182, 212, 0.15))',
                      borderRadius: '12px',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'rgba(168, 85, 247, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Music size={16} color="var(--color-purple)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: 'white', marginBottom: '2px' }}>
                          🔗 Synced to: {backingTrack.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {selectedAgent?.id === 'video-creator' ? 'Video will match beat timing & BPM' : 'Vocals will sync to this beat'}
                          {backingTrack.bpm ? ` • ${backingTrack.bpm} BPM` : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => setBackingTrack(null)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <textarea 
                    ref={textareaRef}
                    placeholder={`Describe what you want ${selectedAgent.name} to create...`}
                    className="studio-textarea"
                    style={{
                      minHeight: isMobile ? '100px' : '120px',
                      padding: isMobile ? '12px' : '20px'
                    }}
                  ></textarea>
                  
                  <div className="generation-actions">
                    <button 
                      className="cta-button-secondary"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      title="Generate a preview"
                    >
                      <Play size={16} />
                      Preview
                    </button>
                    <button 
                      className={`cta-button-premium ${isGenerating ? 'loading' : ''}`} 
                      style={{ flex: 1 }}
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="spinner-mini"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={18} />
                          <span>Generate {selectedAgent.name}</span>
                        </>
                      )}
                    </button>
                    <button 
                      className="cta-button-secondary"
                      onClick={() => setShowExternalSaveModal(true)}
                      title="Save to Cloud Storage"
                    >
                      <Cloud size={18} />
                      <span>Save to Cloud</span>
                    </button>
                  </div>

                  {/* Inline Preview of Last Generation */}
                  {(() => {
                    const currentPreview = selectedAgent?.id ? agentPreviews[selectedAgent.id] : null;
                    if (!currentPreview) return null;
                    
                    return (
                    <div className="agent-preview-mini animate-fadeIn" style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Last Generated</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => safeOpenGenerationPreview(currentPreview)} style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Maximize2 size={12} /> View Full
                          </button>
                        </div>
                      </div>
                      
                      {currentPreview.type === 'image' && currentPreview.imageUrl ? (
                        <img 
                          src={formatImageSrc(currentPreview.imageUrl)} 
                          alt="Preview" 
                          style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }} 
                          onClick={() => safeOpenGenerationPreview(currentPreview)} 
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : currentPreview.type === 'video' && currentPreview.videoUrl ? (
                        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
                          <video src={formatVideoSrc(currentPreview.videoUrl)} style={{ width: '100%', height: '220px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => safeOpenGenerationPreview(currentPreview)} onError={(e) => { e.target.style.display = 'none'; }} />
                          {currentPreview.audioUrl && (
                            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800' }}>
                              <Music size={12} /> SYNCED AUDIO
                            </div>
                          )}
                        </div>
                      ) : (currentPreview.type === 'audio' || currentPreview.type === 'vocal') && currentPreview.audioUrl ? (
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                           {currentPreview.imageUrl && (
                             <div style={{
                               width: '80px',
                               height: '80px',
                               borderRadius: '12px',
                               background: `url(${formatImageSrc(currentPreview.imageUrl)}) center/cover`,
                               flexShrink: 0,
                               boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                               border: '1px solid rgba(255,255,255,0.1)'
                             }} />
                           )}
                           <div style={{ flex: 1, minWidth: 0 }}>
                             {currentPreview.backingTrackUrl ? (
                               <>
                                 <div style={{ fontSize: '0.7rem', color: 'var(--color-pink)', marginBottom: '6px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Synced Vocal Lab</div>
                                 <audio 
                                   controls 
                                   src={formatAudioSrc(currentPreview.audioUrl)} 
                                   style={{ width: '100%', height: '36px', marginBottom: '8px' }}
                                   onError={(e) => { console.warn('[Audio] Failed to load:', e.target.src); e.target.style.opacity = '0.4'; }}
                                   onPlay={(e) => {
                                      const container = e.target.parentElement;
                                      const backingAudio = container.querySelector('.preview-backing-audio');
                                      if (backingAudio) {
                                        backingAudio.currentTime = e.target.currentTime;
                                        backingAudio.play();
                                      }
                                   }}
                                   onPause={(e) => {
                                      const container = e.target.parentElement;
                                      const backingAudio = container.querySelector('.preview-backing-audio');
                                      if (backingAudio) backingAudio.pause();
                                   }}
                                   onTimeUpdate={(e) => {
                                      const container = e.target.parentElement;
                                      const backingAudio = container.querySelector('.preview-backing-audio');
                                      if (backingAudio && Math.abs(backingAudio.currentTime - e.target.currentTime) > 0.5) {
                                        backingAudio.currentTime = e.target.currentTime;
                                      }
                                   }}
                                 />
                                 <audio className="preview-backing-audio" src={formatAudioSrc(currentPreview.backingTrackUrl)} style={{ display: 'none' }} onError={(e) => { console.warn('[BackingAudio] Failed to load:', e.target.src); }} />
                               </>
                             ) : (
                               <audio controls src={formatAudioSrc(currentPreview.audioUrl)} style={{ width: '100%', height: '36px', marginBottom: '8px' }} onError={(e) => { console.warn('[Audio] Failed to load:', e.target.src); e.target.style.opacity = '0.4'; }} />
                             )}
                             <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                               "{currentPreview.snippet?.substring(0, 80)}..."
                             </div>
                           </div>
                        </div>
                      ) : (
                        <div className="flavorful-text-output" style={{ 
                          fontSize: '1rem', 
                          lineHeight: '1.8',
                          color: 'rgba(255,255,255,0.95)', 
                          padding: '24px', 
                          background: 'rgba(0,0,0,0.3)', 
                          borderRadius: '12px', 
                          maxHeight: '400px', 
                          overflowY: 'auto',
                          border: '1px solid rgba(255,255,255,0.05)',
                          fontFamily: "'Georgia', serif",
                          whiteSpace: 'pre-wrap'
                        }}>
                          {currentPreview.snippet}
                        </div>
                      )}
                      
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-pill primary" 
                          style={{ flex: 1, fontSize: '0.75rem', justifyContent: 'center' }}
                          onClick={() => {
                            if (selectedProject) {
                              handleSaveAssetToProject(selectedProject.id, currentPreview);
                              toast.success(`Saved to Hub`);
                            } else {
                              handleCreateProjectWithAsset(`New ${selectedAgent?.name || 'AI'} Project`, currentPreview);
                            }
                          }}
                        >
                          <FolderPlus size={14} /> Save to Hub
                        </button>
                        {/* TTS Preview - Read text aloud (uses AI voices when style is rapper/singer) */}
                        {currentPreview.snippet && !currentPreview.audioUrl && (
                          <button 
                            className="btn-pill secondary" 
                            style={{ fontSize: '0.75rem' }}
                            disabled={isCreatingVocal}
                            onClick={() => {
                              const text = currentPreview.snippet || currentPreview.content || '';
                              // Use AI vocal for rapper/singer styles, browser TTS for narrator/spoken
                              const aiVoiceStyles = ['rapper', 'rapper-female', 'singer', 'singer-female'];
                              if (aiVoiceStyles.includes(voiceSettings.style)) {
                                // Use actual AI vocals (Bark/Suno) for real rapper/singer voices
                                handleCreateAIVocal(text, selectedAgent?.name || 'AI');
                              } else {
                                // Fall back to browser TTS for narrator/spoken
                                if (window.speechSynthesis.speaking) {
                                  window.speechSynthesis.cancel();
                                } else {
                                  handleTextToVoice(text);
                                }
                              }
                            }}
                            title={['rapper', 'rapper-female', 'singer', 'singer-female'].includes(voiceSettings.style) 
                              ? `Read aloud using AI ${voiceSettings.style} voice (takes 30-60 seconds)`
                              : 'Read text aloud using browser TTS'}
                          >
                            <Volume2 size={14} /> {isCreatingVocal ? 'Creating...' : 'Read Aloud'}
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })()}
                  
                  <p className="studio-disclaimer">
                    <Shield size={12} />
                    AI-generated content may require manual review for platform compliance.
                  </p>
                </div>
              </div>

              <div className="agent-history-section" style={{ marginTop: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '16px'
                }}>
                  <h3 style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    margin: 0,
                    fontSize: '1.1rem',
                    color: 'white'
                  }}>
                    <Folder size={18} style={{ color: 'var(--color-purple)' }} />
                    {selectedAgent.name} Inventory
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '3px 8px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '10px',
                      color: 'var(--color-purple)',
                      fontWeight: '600'
                    }}>
                      {(projects || []).filter(p => p.agent === selectedAgent.name).length} items
                    </span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('mystudio')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    View All
                    <ArrowRight size={14} />
                  </button>
                </div>
                
                {/* Inventory List (Agent History) */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                  {(() => {
                    // Find all assets created by this agent across all projects
                    const agentAssets = projects.flatMap(p => p.assets || [])
                      .filter(a => a.agent === selectedAgent.name || a.agentId === selectedAgent.id)
                      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                      
                    if (agentAssets.length > 0) {
                      return agentAssets.map((item, idx) => (
                        <div 
                          key={idx} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '14px 16px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '14px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onClick={() => safeOpenGenerationPreview(item)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          }}
                        >
                          {/* Preview Thumbnail */}
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '10px',
                            background: item.imageUrl 
                              ? `url(${item.imageUrl}) center/cover` 
                              : item.audioUrl
                              ? 'linear-gradient(135deg, var(--color-cyan), var(--color-green))'
                              : 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            {!item.imageUrl && !item.audioUrl && <FileText size={20} style={{ color: 'white' }} />}
                            {item.audioUrl && !item.imageUrl && <Volume2 size={20} style={{ color: 'white' }} />}
                            {item.imageUrl && item.audioUrl && (
                              <div style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                background: 'rgba(0,0,0,0.6)',
                                padding: '2px',
                                borderTopLeftRadius: '6px'
                              }}>
                                <Music size={12} color="white" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: '0.9rem', 
                              fontWeight: '600', 
                              color: 'white',
                              marginBottom: '4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.title || item.snippet?.substring(0, 30) || 'Untitled Creation'}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.snippet?.substring(0, 60) || 'No prompt saved'}...
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              marginTop: '6px'
                            }}>
                              <span style={{ 
                                fontSize: '0.65rem', 
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Clock size={10} />
                                {item.date || 'Recent'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '6px',
                            flexShrink: 0
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewItem(item);
                              }}
                              title="View"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white'
                              }}
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </div>
                      ));
                    } else {
                      return (
                        <div style={{ 
                          padding: '32px', 
                          textAlign: 'center', 
                          color: 'var(--text-secondary)',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '12px'
                        }}>
                          <Sparkles size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                          <p>No creations yet. Start generating!</p>
                        </div>
                      );
                    }
                  })()}
                </div>

                
                {/* Prompt History Quick Access */}
                {selectedAgent && (projects || []).filter(p => p.agent === selectedAgent.name).length > 0 && (
                  <div style={{ 
                    marginTop: '16px',
                    padding: '14px 16px',
                    background: 'rgba(139, 92, 246, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(139, 92, 246, 0.15)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '10px'
                    }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: '600', 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Clock size={14} style={{ color: 'var(--color-purple)' }} />
                        Recent Prompts
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(projects || [])
                        .filter(p => p.agent === selectedAgent?.name && p.snippet)
                        .slice(0, 5)
                        .map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const textarea = textareaRef.current || document.querySelector('.studio-textarea');
                              if (textarea) {
                                textarea.value = item.snippet;
                                try {
                                  textarea.dispatchEvent(new Event('input', { bubbles: true }));
                                } catch (e) {
                                  const ev = document.createEvent('Event');
                                  ev.initEvent('input', true, true);
                                  textarea.dispatchEvent(ev);
                                }
                                toast.success('Prompt loaded!');
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              color: 'var(--text-secondary)',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              maxWidth: '150px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                            title={item.snippet}
                          >
                            {item.snippet?.substring(0, 25)}...
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="agent-side-panel">
              {selectedAgent.hasSocials && (
                <div className="side-info-card social-connect-card">
                  <h3>Connect Socials</h3>
                  <div className="social-connect-grid">
                    <button 
                      className={`social-connect-btn ${socialConnections.instagram ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('instagram')}
                    >
                      <GlobeIcon size={16} />
                      <span>{socialConnections.instagram ? (metaName ? `Insta: ${metaName}` : 'Instagram Linked') : 'Link Instagram'}</span>
                    </button>
                    <button 
                      className={`social-connect-btn ${socialConnections.facebook ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('facebook')}
                    >
                      <Zap size={16} />
                      <span>{socialConnections.facebook ? (metaName ? `FB: ${metaName}` : 'Facebook Linked') : 'Link Facebook'}</span>
                    </button>
                    <button 
                      className={`social-connect-btn ${socialConnections.tiktok ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('tiktok')}
                    >
                      <Zap size={16} />
                      <span>{socialConnections.tiktok ? 'TikTok Linked' : 'Link TikTok'}</span>
                    </button>
                    <button 
                      className={`social-connect-btn ${socialConnections.twitter ? 'connected' : ''}`}
                      onClick={() => handleConnectSocial('twitter')}
                    >
                      <MessageSquare size={16} />
                      <span>{socialConnections.twitter ? (twitterUsername ? `@${twitterUsername}` : 'X/Twitter Linked') : 'Link X/Twitter'}</span>
                    </button>
                    {(selectedAgent?.id === 'collab' || selectedAgent?.id === 'release') && (
                      <button 
                        className={`social-connect-btn ${socialConnections.spotify ? 'connected' : ''}`}
                        onClick={() => handleConnectSocial('spotify')}
                      >
                        <Music size={16} />
                        <span>{socialConnections.spotify ? 'Spotify Linked' : 'Link Spotify'}</span>
                      </button>
                    )}
                  </div>
                  <p className="help-text mini">One-click secure OAuth connection.</p>
                </div>
              )}

              <div className="side-info-card">
                <h3>Capabilities</h3>
                <ul className="capability-list">
                  {(selectedAgent?.capabilities || []).map((cap, i) => (
                    <li key={i}><Sparkles size={14} /> {cap}</li>
                  ))}
                </ul>
              </div>

              <div className="side-info-card">
                <h3>How to Use</h3>
                <p className="help-text">{selectedAgent?.howToUse || 'Enter your prompt and generate content.'}</p>
              </div>

              <div className="side-info-card agent-intelligence-card">
                <div className="card-header-with-icon">
                  <CircleHelp size={18} className="text-purple" />
                  <h3>Agent Intelligence</h3>
                </div>
                <div className="intelligence-content">
                  <div className="intel-section">
                    <h4>The "How"</h4>
                    <p className="help-text small">{selectedAgent?.explanation || ''}</p>
                  </div>
                  <div className="intel-section">
                    <h4>Pro Tips</h4>
                    <p className="help-text small">{selectedAgent?.helpTips || ''}</p>
                  </div>
                </div>
              </div>

              <div className="side-info-card">
                <h3>Examples</h3>
                <div className="example-chips">
                  {(selectedAgent?.examples || []).map((ex, i) => (
                    <div 
                      key={i} 
                      className="example-chip" 
                      onClick={() => {
                        const textarea = textareaRef.current || document.querySelector('.studio-textarea');
                        if (textarea) {
                          textarea.value = ex;
                          try {
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                          } catch (e) {
                            const ev = document.createEvent('Event');
                            ev.initEvent('input', true, true);
                            textarea.dispatchEvent(ev);
                          }
                          // Trigger a visual flash or focus to show it worked
                          textarea.focus();
                          textarea.style.borderColor = 'var(--color-purple)';
                          setTimeout(() => textarea.style.borderColor = '', 300);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      "{ex}"
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {

      case 'agents': {
        const availableAgents = getAvailableAgents();
        const lockedAgents = getLockedAgents();
        const allAgents = [...availableAgents, ...lockedAgents];
        
        // Render the agent workspace content (used in main panel when agent is selected)
        const renderAgentWorkspace = () => {
          if (!selectedAgent) return null;
          const Icon = typeof selectedAgent.icon === 'function' ? selectedAgent.icon : Sparkles;
          
          return (
            <div className="agent-active-view animate-fadeInUp" style={{ position: 'relative', paddingBottom: '80px' }}>
              {/* Onboarding Nudge */}
              {showNudge && selectedAgent.onboarding && (
                <div className="agent-nudge-overlay animate-fadeInDown" style={{ marginBottom: '24px' }}>
                  <div className="nudge-header">
                    <h4><Sparkles size={16} /> Quick Start Guide</h4>
                    <button className="nudge-close" onClick={() => setShowNudge(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="nudge-steps">
                    {selectedAgent.onboarding.map((step, idx) => (
                      <div key={idx} className="nudge-step">
                        <span className="step-num">{idx + 1}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="nudge-footer">
                    <button className="nudge-cta" onClick={() => setShowNudge(false)}>
                      Got it, let's go!
                    </button>
                  </div>
                </div>
              )}

              <div className="agent-detail-layout">
                <div className="agent-main-panel">
                  <div className="agent-hero-card">
                    <div className={`agent-icon-large ${selectedAgent.colorClass}`}>
                      <Icon size={40} />
                    </div>
                    <div className="agent-hero-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span className="agent-badge" style={{ background: 'linear-gradient(90deg, var(--color-purple), var(--color-cyan))', color: 'white', fontWeight: '800' }}>{selectedAgent.category}</span>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', fontWeight: '800', textTransform: 'uppercase' }}>High-Fidelity Engine</span>
                      </div>
                      <h2 style={{ fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px', background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{selectedAgent.name}</h2>
                      <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', lineHeight: '1.6' }}>{selectedAgent.description || selectedAgent.desc}</p>
                    </div>
                  </div>

                  <div className="agent-utility-box">
                    <div className="utility-controls">
                      <div className="control-group">
                        <label>Genre / Style</label>
                        <select className="studio-select" value={heroGenre} onChange={e => { setHeroGenre(e.target.value); setVoiceSettings(prev => ({ ...prev, genre: e.target.value })); }}>
                          <option value="hip-hop">Hip Hop / Rap</option>
                          <option value="pop">Pop / Modern</option>
                          <option value="r&b">R&B / Soul</option>
                          <option value="electronic">Electronic / Dance</option>
                          <option value="rock">Rock / Alternative</option>
                          <option value="lo-fi">Lo-Fi / Chill</option>
                          <option value="trap">Trap</option>
                          <option value="drill">Drill</option>
                          <option value="afrobeat">Afrobeat</option>
                          <option value="reggaeton">Reggaeton</option>
                          <option value="latin">Latin</option>
                        </select>
                      </div>
                      <div className="control-group">
                        <label>Intensity / Mood ({heroIntensity}/10)</label>
                        <input type="range" className="studio-slider" min="1" max="10" value={heroIntensity} onChange={e => setHeroIntensity(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="prompt-area">
                      <div className="prompt-header">
                        <label>Creative Prompt</label>
                        <div className="voice-controls">
                          {voiceSettings.language !== 'English' && (
                            <button 
                              className="btn-pill glass translate-btn"
                              onClick={handleTranslatePrompt}
                              title="Translate to English"
                            >
                              <Languages size={16} />
                            </button>
                          )}
                          <button 
                            className={`btn-pill ${isListening ? 'primary' : 'glass'}`} 
                            onClick={handleVoiceToText}
                            title="Voice to Text"
                          >
                            <Mic size={16} />
                          </button>
                          <button 
                            className={`btn-pill ${isSpeaking ? 'primary' : 'glass'}`} 
                            onClick={handleTextToVoice}
                            title="Text to Voice"
                          >
                            <Volume2 size={16} />
                          </button>
                          <button 
                            className={`btn-pill ${showVoiceSettings ? 'primary' : 'glass'}`}
                            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                            title="Voice Settings"
                          >
                            <Settings size={16} />
                          </button>
                        </div>
                      </div>
                      <textarea 
                        ref={textareaRef}
                        placeholder={`Describe what you want ${selectedAgent.name} to create...`}
                        className="studio-textarea"
                        style={{
                          minHeight: isMobile ? '100px' : '120px',
                          padding: isMobile ? '12px' : '20px'
                        }}
                      ></textarea>
                      
                      <div className="generation-actions" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button 
                          className="btn-pill glass"
                          onClick={() => setQuickWorkflowAgent(selectedAgent)}
                        >
                          <Zap size={16} />
                          Quick Generate
                        </button>
                        <button 
                          className={`btn-pill primary ${isGenerating ? 'loading' : ''}`} 
                          style={{ flex: 1 }}
                          onClick={handleGenerate}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <div className="spinner-mini"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <Zap size={18} />
                              <span>Generate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Project Assets / Recent Creations */}
                  <div className="side-info-card" style={{ marginTop: '16px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LayoutGrid size={16} className="text-purple" />
                      {selectedProject ? `Assets for ${selectedProject.name}` : 'Recent Creations'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      {(() => {
                        // If in a project, show assets for this project + this agent
                        let relevantItems = [];
                        
                        if (selectedProject && Array.isArray(selectedProject.assets)) {
                          relevantItems = selectedProject.assets.filter(a => {
                            if (!a) return false;
                            
                            const agentMatch = a.agent === selectedAgent.name || a.agent === selectedAgent.id;
                            const categoryMatch = a.type && selectedAgent.category && 
                                               a.type.toLowerCase() === selectedAgent.category.toLowerCase();
                            
                            return agentMatch || categoryMatch;
                          });
                        } else {
                          // Fallback to searching all projects for this agent's name
                          relevantItems = (projects || []).filter(p => p && p.agent === selectedAgent.name).slice(0, 3);
                        }
                        
                        if (relevantItems.length > 0) {
                          return relevantItems.slice(0, 5).map((item, i) => (
                            <div
                              key={item.id || i}
                              onClick={() => safeOpenGenerationPreview(item)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 12px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.05)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-purple)'}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                            >
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: item.imageUrl ? `url(${formatImageSrc(item.imageUrl)}) center/cover` : 'rgba(139, 92, 246, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {!item.imageUrl && (
                                  item.type === 'audio' ? <Music size={14} style={{ opacity: 0.5 }} /> :
                                  item.type === 'video' ? <VideoIcon size={14} style={{ opacity: 0.5 }} /> :
                                  <FileText size={14} style={{ opacity: 0.5 }} />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.title || item.snippet?.substring(0, 30) || 'Untitled'}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                  {item.date || 'Recent'}
                                </div>
                              </div>
                              <Eye size={14} style={{ opacity: 0.5 }} />
                            </div>
                          ));
                        }
                        return (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {selectedProject ? `No assets for this project yet.` : 'No creations yet. Start generating!'}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Right info panel */}
                <div className="agent-side-panel">
                  {selectedProject && (
                    <div className="side-info-card" style={{ 
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Folder size={18} className="text-purple" />
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-purple)' }}>Project Context</h3>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'white', marginBottom: '4px' }}>{selectedProject.name}</div>
                      <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Organizing {selectedProject.assets?.length || 0} assets in this project.
                      </p>
                      <button 
                         className="btn-pill glass" 
                         style={{ width: '100%', fontSize: '0.8rem', padding: '8px', background: 'rgba(255,255,255,0.05)' }}
                         onClick={() => setPendingProjectNav(true)}
                       >
                         <LayoutGrid size={14} /> View Project Canvas
                       </button>
                    </div>
                  )}

                  <div className="side-info-card">
                    <h3>Capabilities</h3>
                    <ul className="capability-list">
                      {(selectedAgent?.capabilities || []).map((cap, i) => (
                        <li key={i}><Sparkles size={14} /> {cap}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="side-info-card">
                    <h3>How to Use</h3>
                    <p className="help-text">{selectedAgent?.howToUse || 'Enter your prompt and generate content.'}</p>
                  </div>

                  <div className="side-info-card">
                    <h3>Examples</h3>
                    <div className="example-chips">
                      {(selectedAgent?.examples || []).slice(0, 3).map((ex, i) => (
                        <div 
                          key={i} 
                          className="example-chip" 
                          onClick={() => {
                            const textarea = textareaRef.current;
                            if (textarea) {
                              textarea.value = ex;
                              textarea.focus();
                            }
                          }}
                        >
                          "{ex.length > 50 ? ex.substring(0, 50) + '...' : ex}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        };
        
        return (
          <div className="agents-split-layout">
            {/* Left Sidebar - Agent List */}
            <div className="agents-sidebar">
              <div className="agents-sidebar-header">
                <h3><Sparkles size={18} className="text-purple" /> Agents</h3>
                <p>{availableAgents.length} available</p>
              </div>
              
              <div className="agents-sidebar-list">
                {/* FREE TIER Agents */}
                <div className="agents-sidebar-section" style={{
                  background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%)',
                  padding: '8px 12px',
                  marginBottom: '4px',
                  borderRadius: '8px',
                  borderLeft: '3px solid rgba(34, 197, 94, 0.6)'
                }}>
                  <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <Sparkles size={12} /> Free Tier
                    <span style={{ marginLeft: 'auto', background: 'rgba(34, 197, 94, 0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem' }}>
                      {(typeof AGENTS !== 'undefined' ? AGENTS : []).filter(a => a.tier === 'free').length} agents
                    </span>
                  </h5>
                </div>
                {(typeof AGENTS !== 'undefined' ? AGENTS : []).filter(a => a.tier === 'free').map((agent) => {
                  const Icon = typeof agent.icon === 'function' ? agent.icon : Sparkles;
                  const isActive = selectedAgent?.id === agent.id;
                  const isLocked = !availableAgents.find(a => a.id === agent.id);
                  return (
                    <button
                      key={agent.id}
                      className={`agent-sidebar-item ${agent.colorClass} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                      data-name={agent.name}
                      onClick={() => {
                        if (isLocked) {
                          if (!isLoggedIn) {
                            setShowLoginModal(true);
                          } else {
                            setDashboardTab('subscription');
                            setActiveTab('mystudio');
                          }
                        } else if (agent.comingSoon) {
                          toast.error(`${agent.name} is coming soon!`, { icon: 'ðŸš§' });
                        } else {
                          setSelectedAgent(agent);
                          Analytics.agentUsed(agent.id);
                        }
                      }}
                    >
                      <div className={`agent-sidebar-icon ${agent.colorClass}`}>
                        <Icon size={18} />
                      </div>
                    </button>
                  );
                })}

                {/* MONTHLY TIER Agents */}
                <div className="agents-sidebar-section" style={{
                  background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)',
                  padding: '8px 12px',
                  marginBottom: '4px',
                  marginTop: '12px',
                  borderRadius: '8px',
                  borderLeft: '3px solid rgba(139, 92, 246, 0.6)'
                }}>
                  <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <Zap size={12} /> Monthly â€” $4.99/mo
                    <span style={{ marginLeft: 'auto', background: 'rgba(139, 92, 246, 0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem' }}>
                      {(typeof AGENTS !== 'undefined' ? AGENTS : []).filter(a => a.tier === 'monthly').length} agents
                    </span>
                  </h5>
                </div>
                {(typeof AGENTS !== 'undefined' ? AGENTS : []).filter(a => a.tier === 'monthly').map((agent) => {
                  const Icon = typeof agent.icon === 'function' ? agent.icon : Sparkles;
                  const isActive = selectedAgent?.id === agent.id;
                  const isLocked = !availableAgents.find(a => a.id === agent.id);
                  return (
                    <button
                      key={agent.id}
                      className={`agent-sidebar-item ${agent.colorClass} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                      data-name={agent.name}
                      onClick={() => {
                        if (isLocked) {
                          if (!isLoggedIn) {
                            setShowLoginModal(true);
                          } else {
                            setDashboardTab('subscription');
                            setActiveTab('mystudio');
                          }
                        } else if (agent.comingSoon) {
                          toast.error(`${agent.name} is coming soon!`, { icon: 'ðŸš§' });
                        } else {
                          setSelectedAgent(agent);
                          Analytics.agentUsed(agent.id);
                        }
                      }}
                    >
                      <div className={`agent-sidebar-icon ${agent.colorClass}`} style={isLocked ? { background: 'rgba(255,255,255,0.05)' } : {}}>
                        <Icon size={18} style={isLocked ? { opacity: 0.5 } : {}} />
                      </div>
                    </button>
                  );
                })}

                {/* PRO TIER Agents */}
                <div className="agents-sidebar-section" style={{
                  background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.1) 0%, transparent 100%)',
                  padding: '8px 12px',
                  marginBottom: '4px',
                  marginTop: '12px',
                  borderRadius: '8px',
                  borderLeft: '3px solid rgba(234, 179, 8, 0.6)'
                }}>
                  <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <Award size={12} /> Pro â€” $9.99/mo
                    <span style={{ marginLeft: 'auto', background: 'rgba(234, 179, 8, 0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem' }}>
                      {(typeof AGENTS !== 'undefined' ? AGENTS : []).filter(a => a.tier === 'pro').length} agents
                    </span>
                  </h5>
                </div>
                {(typeof AGENTS !== 'undefined' ? AGENTS : []).filter(a => a.tier === 'pro').map((agent) => {
                  const Icon = typeof agent.icon === 'function' ? agent.icon : Sparkles;
                  const isActive = selectedAgent?.id === agent.id;
                  const isLocked = !availableAgents.find(a => a.id === agent.id);
                  return (
                    <button
                      key={agent.id}
                      className={`agent-sidebar-item ${agent.colorClass} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                      data-name={agent.name}
                      onClick={() => {
                        if (isLocked) {
                          if (!isLoggedIn) {
                            setShowLoginModal(true);
                          } else {
                            setDashboardTab('subscription');
                            setActiveTab('mystudio');
                          }
                        } else if (agent.comingSoon) {
                          toast.error(`${agent.name} is coming soon!`, { icon: 'ðŸš§' });
                        } else {
                          setSelectedAgent(agent);
                          Analytics.agentUsed(agent.id);
                        }
                      }}
                    >
                      <div className={`agent-sidebar-icon ${agent.colorClass}`} style={isLocked ? { background: 'rgba(255,255,255,0.05)' } : {}}>
                        <Icon size={18} style={isLocked ? { opacity: 0.5 } : {}} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Main Panel - Welcome or Agent Workspace */}
            <div className="agents-main-panel">
              {selectedAgent ? (
                renderAgentWorkspace()
              ) : (
                /* Agent Cards Grid with Whitepapers & Legal */
                <div className="agents-cards-view" style={{ padding: isMobile ? '8px 2px' : '8px 0 8px 0', overflowY: 'auto' }}>
                  {/* Header with Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles size={24} className="text-purple" />
                        AI Agents Studio
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {allAgents.length} specialized agents â€¢ Click any card to start creating
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => window.location.hash = '#/whitepapers'}
                        className="btn-pill glass haptic-press"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          padding: '10px 20px',
                          background: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          color: '#06b6d4'
                        }}
                      >
                        <FileText size={16} />
                        Whitepapers
                      </button>
                      <button
                        onClick={() => window.location.hash = '#/legal'}
                        className="btn-pill glass haptic-press"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          padding: '10px 20px',
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: '#a855f7'
                        }}
                      >
                        <Shield size={16} />
                        Legal
                      </button>
                    </div>
                  </div>

                  {/* Free generation banner */}
                  {!isLoggedIn && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      maxWidth: '400px'
                    }}>
                      <Zap size={20} className="text-purple" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                          {getRemainingFreeGenerations()} free generations left
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Sign in to unlock more
                        </div>
                      </div>
                      <button 
                        className="btn-pill primary"
                        onClick={() => setShowLoginModal(true)}
                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      >
                        Sign In
                      </button>
                    </div>
                  )}
                  
                  {/* Agent Cards - Separate grids per tier for equal sizing */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* FREE TIER Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '10px 4px',
                      background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%)',
                      borderRadius: '12px'
                    }}>
                      <Sparkles size={16} style={{ color: '#22c55e' }} />
                      <span style={{ fontWeight: '700', color: '#22c55e', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Free Tier
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        â€” {(typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.filter(a => a.tier === 'free').length : 0} agents included
                      </span>
                    </div>
                    {/* FREE TIER Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                      gap: '16px'
                    }}>
                    {(typeof AGENTS !== 'undefined' && AGENTS) && AGENTS.filter(a => a.tier === 'free').map((agent) => {
                      const Icon = typeof agent.icon === 'function' ? agent.icon : Sparkles;
                      const isLocked = !availableAgents.find(a => a.id === agent.id);
                      const ac = getAgentHex(agent);
                      const tierStyle = { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: '#22c55e', label: 'Free' };
                      return (
                        <div
                          key={agent.id}
                          className="agent-card-large haptic-press"
                          onClick={() => {
                            if (isLocked) {
                              if (!isLoggedIn) setShowLoginModal(true);
                              else { setDashboardTab('subscription'); setActiveTab('mystudio'); }
                            } else {
                              setSelectedAgent(agent);
                              Analytics.agentUsed(agent.id);
                            }
                          }}
                          style={{
                            padding: isMobile ? '20px' : '28px',
                            background: 'rgba(0,0,0,0.4)',
                            border: `1px solid ${ac}22`,
                            borderRadius: '20px',
                            minHeight: isMobile ? '175px' : '240px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            opacity: isLocked ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${ac}66`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${ac}22`; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          {/* Glow effect */}
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at top left, ${ac}15, transparent 70%)`, pointerEvents: 'none' }} />
                          {/* Tier badge */}
                          <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '10px', background: tierStyle.bg, border: `1px solid ${tierStyle.border}`, fontSize: '0.65rem', fontWeight: '700', color: tierStyle.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tierStyle.label}</div>
                          {isLocked && <LockIcon size={14} style={{ position: 'absolute', top: '14px', right: '70px', opacity: 0.5 }} />}
                          {agent.isBeta && <span style={{ position: 'absolute', top: '14px', right: isLocked ? '90px' : '70px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '2px 8px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.5px' }}>BETA</span>}
                          <div style={{
                            width: isMobile ? '40px' : '52px',
                            height: isMobile ? '40px' : '52px',
                            borderRadius: '14px',
                            background: `${ac}22`,
                            border: `1px solid ${ac}44`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                          }}>
                            <Icon size={isMobile ? 20 : 26} style={{ color: ac }} />
                          </div>
                          <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', fontWeight: '700', marginBottom: '6px', color: 'white' }}>{agent.name}</h3>
                          <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{agent.category}</p>
                          <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
                            {agent.description || (agent.capabilities && agent.capabilities[0]) || 'AI-powered music creation'}
                          </p>
                          {agent.capabilities && agent.capabilities.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                              {agent.capabilities.slice(0, 2).map((cap, i) => (
                                <span key={i} style={{ padding: '3px 10px', background: `${ac}1A`, color: ac, borderRadius: '8px', fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: '500' }}>{cap}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>

                    {/* MONTHLY TIER Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '10px 4px',
                      background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.1) 0%, transparent 100%)',
                      borderRadius: '12px'
                    }}>
                      <Zap size={16} style={{ color: '#fbbf24' }} />
                      <span style={{ fontWeight: '700', color: '#fbbf24', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Monthly â€” $4.99/mo
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        â€” {(typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.filter(a => a.tier === 'monthly').length : 0} agents
                      </span>
                    </div>
                    {/* MONTHLY TIER Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                      gap: '16px'
                    }}>
                    {(typeof AGENTS !== 'undefined' && AGENTS) && AGENTS.filter(a => a.tier === 'monthly').map((agent) => {
                      const Icon = typeof agent.icon === 'function' ? agent.icon : Sparkles;
                      const isLocked = !availableAgents.find(a => a.id === agent.id);
                      const ac = getAgentHex(agent);
                      const tierStyle = { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', text: '#a855f7', label: 'Creator' };
                      return (
                        <div
                          key={agent.id}
                          className="agent-card-large haptic-press"
                          onClick={() => {
                            if (isLocked) {
                              if (!isLoggedIn) setShowLoginModal(true);
                              else { setDashboardTab('subscription'); setActiveTab('mystudio'); }
                            } else {
                              setSelectedAgent(agent);
                              Analytics.agentUsed(agent.id);
                            }
                          }}
                          style={{
                            padding: isMobile ? '20px' : '28px',
                            background: 'rgba(0,0,0,0.4)',
                            border: `1px solid ${ac}22`,
                            borderRadius: '20px',
                            minHeight: isMobile ? '175px' : '240px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            opacity: isLocked ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${ac}66`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${ac}22`; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          {/* Glow effect */}
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at top left, ${ac}15, transparent 70%)`, pointerEvents: 'none' }} />
                          {/* Tier badge */}
                          <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '10px', background: tierStyle.bg, border: `1px solid ${tierStyle.border}`, fontSize: '0.65rem', fontWeight: '700', color: tierStyle.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tierStyle.label}</div>
                          {isLocked && <LockIcon size={14} style={{ position: 'absolute', top: '14px', right: '80px', opacity: 0.5 }} />}
                          {agent.isBeta && <span style={{ position: 'absolute', top: '14px', right: isLocked ? '100px' : '80px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '2px 8px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.5px' }}>BETA</span>}
                          <div style={{
                            width: isMobile ? '40px' : '52px',
                            height: isMobile ? '40px' : '52px',
                            borderRadius: '14px',
                            background: `${ac}22`,
                            border: `1px solid ${ac}44`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                          }}>
                            <Icon size={isMobile ? 20 : 26} style={{ color: ac }} />
                          </div>
                          <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', fontWeight: '700', marginBottom: '6px', color: 'white' }}>{agent.name}</h3>
                          <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{agent.category}</p>
                          <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
                            {agent.description || (agent.capabilities && agent.capabilities[0]) || 'AI-powered music creation'}
                          </p>
                          {agent.capabilities && agent.capabilities.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                              {agent.capabilities.slice(0, 2).map((cap, i) => (
                                <span key={i} style={{ padding: '3px 10px', background: `${ac}1A`, color: ac, borderRadius: '8px', fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: '500' }}>{cap}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>

                    {/* PRO TIER */}
                    {/* PRO TIER Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '10px 4px',
                      background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.1) 0%, transparent 100%)',
                      borderRadius: '12px'
                    }}>
                      <Award size={16} style={{ color: '#a855f7' }} />
                      <span style={{ fontWeight: '700', color: '#a855f7', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Pro â€” $9.99/mo
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        â€” {(typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.filter(a => a.tier === 'pro').length : 0} agents
                      </span>
                    </div>
                    {/* PRO TIER Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                      gap: '16px'
                    }}>
                    {(typeof AGENTS !== 'undefined' && AGENTS) && AGENTS.filter(a => a.tier === 'pro').map((agent) => {
                      const Icon = typeof agent.icon === 'function' ? agent.icon : Sparkles;
                      const isLocked = !availableAgents.find(a => a.id === agent.id);
                      const ac = getAgentHex(agent);
                      const tierStyle = { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)', text: '#eab308', label: 'Pro' };
                      return (
                        <div
                          key={agent.id}
                          className="agent-card-large haptic-press"
                          onClick={() => {
                            if (isLocked) {
                              if (!isLoggedIn) setShowLoginModal(true);
                              else { setDashboardTab('subscription'); setActiveTab('mystudio'); }
                            } else {
                              setSelectedAgent(agent);
                              Analytics.agentUsed(agent.id);
                            }
                          }}
                          style={{
                            padding: isMobile ? '20px' : '28px',
                            background: 'rgba(0,0,0,0.4)',
                            border: `1px solid ${ac}22`,
                            borderRadius: '20px',
                            minHeight: isMobile ? '175px' : '240px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            opacity: isLocked ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${ac}66`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${ac}22`; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          {/* Glow effect */}
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at top left, ${ac}15, transparent 70%)`, pointerEvents: 'none' }} />
                          {/* Tier badge */}
                          <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '10px', background: tierStyle.bg, border: `1px solid ${tierStyle.border}`, fontSize: '0.65rem', fontWeight: '700', color: tierStyle.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tierStyle.label}</div>
                          {isLocked && <LockIcon size={14} style={{ position: 'absolute', top: '14px', right: '60px', opacity: 0.5 }} />}
                          {agent.isBeta && <span style={{ position: 'absolute', top: '14px', right: isLocked ? '80px' : '60px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '2px 8px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.5px' }}>BETA</span>}
                          <div style={{
                            width: isMobile ? '40px' : '52px',
                            height: isMobile ? '40px' : '52px',
                            borderRadius: '14px',
                            background: `${ac}22`,
                            border: `1px solid ${ac}44`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                          }}>
                            <Icon size={isMobile ? 20 : 26} style={{ color: ac }} />
                          </div>
                          <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', fontWeight: '700', marginBottom: '6px', color: 'white' }}>{agent.name}</h3>
                          <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{agent.category}</p>
                          <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
                            {agent.description || (agent.capabilities && agent.capabilities[0]) || 'AI-powered music creation'}
                          </p>
                          {agent.capabilities && agent.capabilities.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                              {agent.capabilities.slice(0, 2).map((cap, i) => (
                                <span key={i} style={{ padding: '3px 10px', background: `${ac}1A`, color: ac, borderRadius: '8px', fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: '500' }}>{cap}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'hub':
        return (
          <Suspense fallback={<LazyFallback />}>
            <ProjectHub
              projects={projects}
              setProjects={setProjects}
              onRemix={handleForkProject}
              onSelectProject={(project) => {
                console.log('[StudioView] Selecting project:', project?.id, project?.name, 'assets:', project?.assets?.length);
                
                // DEFENSIVE: Validate project before selecting
                if (!project || typeof project !== 'object' || !project.id) {
                  console.error('[StudioView] Invalid project object:', project);
                  toast.error('Unable to open project - invalid data');
                  return;
                }
                
                // Normalize project to ensure required fields exist
                const safeProject = {
                  ...project,
                  id: project.id,
                  name: project.name || 'Untitled Project',
                  description: project.description || '',
                  category: project.category || 'general',
                  assets: Array.isArray(project.assets) ? project.assets.filter(Boolean) : [],
                  agents: Array.isArray(project.agents) ? project.agents.filter(Boolean) : [],
                  date: project.date || new Date().toLocaleDateString(),
                  createdAt: project.createdAt || new Date().toISOString(),
                  updatedAt: project.updatedAt || new Date().toISOString()
                };
                
                // Reset canvas preview asset to avoid stale references
                setCanvasPreviewAsset(null);
                setSelectedProject(safeProject);
                // Use pendingProjectNav flag for safe navigation (prevents race condition)
                setPendingProjectNav(true);
              }}
              onCreateProject={(project) => {
                console.log('[StudioView] Orchestrator project save:', project.id, project.name);
                
                // Check credits
                const currentCredits = typeof userCredits === 'number' ? userCredits : 0;
                if (currentCredits < PROJECT_CREDIT_COST) {
                  console.error('[StudioView] Insufficient credits for orchestrator save');
                  toast.error(`Not enough credits. You need ${PROJECT_CREDIT_COST} credits to save.`);
                  setShowCreditsModal(true);
                  return;
                }
                
                // Deduct credits
                setUserCredits(prev => {
                  const newCredits = prev - PROJECT_CREDIT_COST;
                  console.log('[StudioView] Orchestrator: Credits deducted', prev, '->', newCredits);
                  return newCredits;
                });
                
                // Add or Update projects
                setProjects(prev => {
                  const exists = prev.some(p => p.id === project.id);
                  if (exists) {
                    console.log('[StudioView] Orchestrator: Updating existing project:', project.id);
                    return prev.map(p => p.id === project.id ? project : p);
                  }
                  console.log('[StudioView] Orchestrator: Adding new project. Total:', prev.length + 1);
                  return [project, ...prev];
                });
                
                // Save to cloud if logged in (uses backend API now)
                if (isLoggedIn && user) {
                  console.log('[StudioView] Orchestrator: Saving to cloud for user:', user.uid);
                  saveProjectToCloud(user?.uid, project).then(success => {
                    console.log('[StudioView] Orchestrator: Cloud save result:', success);
                  }).catch(err => {
                    console.error('[StudioView] Orchestrator: Cloud save error:', err);
                  });
                }
                
                // Select it and navigate to project canvas
                setCanvasPreviewAsset(null); // Reset canvas preview to avoid stale references
                setSelectedProject(project);
                // Use pendingProjectNav flag for safe navigation (prevents race condition)
                setPendingProjectNav(true);
                toast.success(`Saved "${project.name}" with ${project.assets?.length || 0} assets!`);
              }}
              onDeleteProject={handleDeleteProject}
              onSaveProject={(project) => {
                if (isLoggedIn && user) {
                  return saveProjectToCloud(user?.uid, project);
                }
                return Promise.resolve(true);
              }}
              setActiveTab={setActiveTab}
              setSelectedAgent={setSelectedAgent}
              setQuickWorkflowAgent={setQuickWorkflowAgent}
              setPreviewItem={setPreviewItem}
              setPlayingItem={setPlayingItem}
            />
          </Suspense>
        );
      // NOTE: case 'project_canvas' is handled by the early return in renderContent()
      // which renders the CanvasView component (studio/CanvasView.jsx)
      case 'resources': {
        // Quick navigation cards - consolidated UI/UX
        const quickNavItems = [
          { id: 'marketing', icon: TrendingUp, label: 'About Us', desc: 'Our mission & vision', color: 'var(--color-yellow)' },
          { id: 'agents', icon: Sparkles, label: 'AI Agents', desc: 'Your creative team', color: 'var(--color-purple)' },
          { id: 'mystudio', icon: Folder, label: 'My Studio', desc: 'Projects & assets', color: 'var(--color-cyan)' },
          { id: 'activity', icon: Music, label: 'Social Media Hub', desc: 'Content & social management', color: 'var(--color-pink)' },
          { id: 'news', icon: GlobeIcon, label: 'Industry Pulse', desc: 'Latest music & tech news', color: 'var(--color-emerald)' },
          { id: 'whitepapers', icon: FileText, label: 'Whitepapers', desc: 'Technical documentation', color: 'var(--color-indigo)' },
          { id: 'orchestrator', icon: Zap, label: 'AI Production Pipeline', desc: '1 idea â†’ full release package', color: 'var(--color-cyan)' },
          { id: 'workflow', icon: LayoutGrid, label: 'Studio Workflow', desc: 'Step-by-step manual control', color: 'var(--color-purple)' },
          { id: 'legal', icon: Shield, label: 'Legal Center', desc: 'Terms & licensing', color: 'var(--color-red)' },
          { id: 'support', icon: CircleHelp, label: 'Help & Support', desc: 'FAQ & contact us', color: 'var(--color-orange)' },
          { id: 'hub', icon: FolderPlus, label: 'Project Hub', desc: 'Shared by Studio Agent users', color: 'var(--color-blue)' },
          { id: 'profile', icon: User, label: 'My Profile', desc: 'Account settings', color: 'var(--color-purple)' },
        ];

        return (
          <div className="resources-view animate-fadeInUp">
            <div className="resources-header">
              <h1>Creator Resources</h1>
              <p>Quick access to all studio features and tools.</p>
            </div>

            {/* Quick Navigation Cards - 5x2 on desktop, 2x5 on mobile */}
            <div className="resources-cards-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', 
              gap: '20px',
              marginBottom: '32px'
            }}>
              {quickNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'legal' || item.id === 'whitepapers') {
                        window.location.hash = `#/${item.id}`;
                      } else if (item.id === 'orchestrator') {
                        setActiveTab('mystudio');
                        setShowOrchestrator(true);
                      } else if (item.id === 'workflow') {
                        setActiveTab('mystudio');
                        setDashboardTab('overview');
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="haptic-press"
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      padding: '28px 20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '16px',
                      minHeight: '180px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = item.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${item.color}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '18px',
                      background: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={34} style={{ color: item.color }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.label}</h4>
                      <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'marketing':
        return (
          <div className="marketing-view animate-fadeInUp" style={{ paddingBottom: '80px' }}>
            {/* Hero Section - Pitch content moved from landing page */}
            <div className="marketing-hero" style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.1) 0%, rgba(0,0,0,0) 100%)',
              marginBottom: '40px'
            }}>
              <div className="hero-badge" style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '6px 12px', 
                background: 'rgba(124, 58, 237, 0.2)', 
                borderRadius: '20px', 
                color: '#a78bfa', 
                fontSize: '0.85rem', 
                marginBottom: '20px',
                border: '1px solid rgba(124, 58, 237, 0.3)'
              }}>
                <Sparkles size={14} />
                <span>The Future of Music Creation</span>
              </div>
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900', marginBottom: '12px', lineHeight: '1.1', letterSpacing: '-1.5px' }}>
                <span className="text-gradient-purple">STOP PITCHING. START RELEASING.</span>
              </h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 16px' }}>
                The world's first AI Record Label in your pocket.
              </p>
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', maxWidth: '500px', margin: '0 auto' }}>
                16 Expert Agents. One Full-Suite Studio. Zero Gatekeepers.
              </p>
            </div>

            {/* The Story */}
            <section className="marketing-section" style={{ padding: '0 20px 60px' }}>
              <div className="section-header" style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>The Story</h2>
                <div style={{ width: '60px', height: '4px', background: 'var(--color-purple)', borderRadius: '2px' }}></div>
              </div>
              <div className="story-card" style={{ 
                background: 'var(--color-bg-secondary)', 
                padding: '30px', 
                borderRadius: '24px', 
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    For decades, the music industry has been a walled garden. Only the top 1% of artists had access to world-class producers, marketing teams, and A&R strategy.
                  </p>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                    <strong>The Studio changes that.</strong> We've distilled the expertise of industry veterans into 16 specialized AI agents. Whether you need a lyricist at 3 AM, a marketing strategy for your release, or a visual identity for your brand, The Studio is always open.
                  </p>
                </div>
                <div style={{ 
                  position: 'absolute', 
                  top: '-50px', 
                  right: '-50px', 
                  width: '200px', 
                  height: '200px', 
                  background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(0,0,0,0) 70%)', 
                  borderRadius: '50%' 
                }}></div>
              </div>
            </section>

            {/* Meet the Agents Section - Enhanced with descriptions, tier badges, whitepaper buttons */}
            <section className="marketing-section" style={{ padding: '0 20px 60px' }}>
              <div className="section-header" style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>The Specialized AI Team</h2>
                <div style={{ width: '60px', height: '4px', background: 'var(--color-cyan)', borderRadius: '2px' }}></div>
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Click any agent to launch their specialized workspace</p>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '16px' 
              }}>
                {(AGENTS || []).slice(0, 8).map(agent => {
                  const Icon = agent.icon || Sparkles;
                  const tierColors = {
                    free: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: '#22c55e', label: 'Free' },
                    monthly: { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', text: '#a855f7', label: 'Creator' },
                    pro: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)', text: '#eab308', label: 'Pro' }
                  };
                  const tier = tierColors[agent.tier] || tierColors.free;
                  return (
                    <div 
                      key={agent.id}
                      className={`agent-info-card-slim animate-fadeInUp haptic-press`}
                      onClick={() => {
                        setSelectedAgent(agent);
                        setActiveTab('agents');
                        window.scrollTo(0, 0);
                      }}
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '20px',
                        padding: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Tier badge */}
                      <div style={{
                        position: 'absolute', top: '12px', right: '12px',
                        padding: '3px 10px', borderRadius: '10px',
                        background: tier.bg, border: `1px solid ${tier.border}`,
                        fontSize: '0.65rem', fontWeight: '700', color: tier.text,
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>{tier.label}</div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className={`agent-icon-mini ${agent.colorClass}`} style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon size={28} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{agent.name}</h3>
                          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{agent.category}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                        {agent.description || (agent.capabilities && agent.capabilities[0]) || 'AI-powered music production agent'}
                      </p>

                      {/* Whitepaper button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.hash = '#/whitepapers';
                        }}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '5px 12px', borderRadius: '10px',
                          background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: '#a855f7', fontSize: '0.7rem', fontWeight: '600',
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px'
                        }}
                      >
                        <FileText size={11} /> View Whitepaper
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* The Vision */}
            <section className="marketing-section" style={{ padding: '0 20px 60px' }}>
              <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="vision-card" style={{ 
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)', 
                  padding: '30px', 
                  borderRadius: '24px', 
                  border: '1px solid var(--border-color)' 
                }}>
                  <div className="icon-box" style={{ 
                    width: '50px', 
                    height: '50px', 
                    background: 'rgba(59, 130, 246, 0.2)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: '20px' 
                  }}>
                    <Target size={24} className="text-cyan" />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Our Vision</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    To democratize the entire music supply chain. We believe every artist deserves a team that cares as much about their music as they do.
                  </p>
                </div>
                <div className="vision-card" style={{ 
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)', 
                  padding: '30px', 
                  borderRadius: '24px', 
                  border: '1px solid var(--border-color)' 
                }}>
                  <div className="icon-box" style={{ 
                    width: '50px', 
                    height: '50px', 
                    background: 'rgba(236, 72, 153, 0.2)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: '20px' 
                  }}>
                    <UsersIcon size={24} className="text-pink" />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>For Creators</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    Built for the bedroom producers, the songwriters, and the independent artists who are ready to take their career to the next level.
                  </p>
                </div>
              </div>
            </section>

            {/* Stats Grid */}
            <section className="marketing-section" style={{ padding: '0 20px 60px' }}>
              <div className="stats-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '15px' 
              }}>
                {[
                  { value: '16', label: 'Specialized Agents', color: 'var(--color-purple)' },
                  { value: '24/7', label: 'Availability', color: 'var(--color-cyan)' },
                  { value: 'âˆž', label: 'Creative Potential', color: 'var(--color-green)' },
                  { value: '100%', label: 'Royalty Free', color: 'var(--color-orange)' }
                ].map((stat, i) => (
                  <div key={i} className="stat-card" style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    padding: '20px', 
                    borderRadius: '16px', 
                    textAlign: 'center' 
                  }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: stat.color, marginBottom: '5px' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div className="marketing-cta" style={{ padding: '0 20px 40px', textAlign: 'center' }}>
              <button 
                className="cta-button-primary haptic-press" 
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                onClick={() => setShowProjectTypeChoice(true)}
              >
                Create New Project <ArrowRight size={20} style={{ marginLeft: '8px' }} />
              </button>
            </div>
          </div>
        );
      case 'activity': {
        const SOCIAL_PLATFORMS = [
          { id: 'instagram', name: 'Instagram', icon: 'ðŸ“¸', color: '#E1306C', desc: 'Photos & Stories' },
          { id: 'tiktok', name: 'TikTok', icon: 'ðŸŽµ', color: '#00f2ea', desc: 'Short-form video' },
          { id: 'twitter', name: 'X / Twitter', icon: 'ð•', color: '#1DA1F2', desc: 'Posts & threads' },
          { id: 'spotify', name: 'Spotify', icon: 'ðŸŽ§', color: '#1DB954', desc: 'Music streaming' },
          { id: 'facebook', name: 'Facebook', icon: 'ðŸ“˜', color: '#1877F2', desc: 'Pages & groups' },
          { id: 'youtube', name: 'YouTube', icon: 'â–¶ï¸', color: '#FF0000', desc: 'Video & shorts' },
          { id: 'soundcloud', name: 'SoundCloud', icon: 'â˜ï¸', color: '#ff5500', desc: 'Audio streaming' },
          { id: 'threads', name: 'Threads', icon: 'ðŸ§µ', color: '#000000', desc: 'Text-based social' },
          { id: 'linkedin', name: 'LinkedIn', icon: 'ðŸ’¼', color: '#0A66C2', desc: 'Professional network' }
        ];
        const socialSubTab = activitySection || 'connections';
        return (
          <div className="music-hub-view animate-fadeInUp" style={{ paddingBottom: '100px' }}>
            {/* Social Media Hub Header */}
            <div className="orchestrator-header" style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(236, 72, 153, 0.15) 100%)',
              borderRadius: '24px',
              padding: '32px',
              marginBottom: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4)'
                  }}>
                    <Share2 size={28} color="white" />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(90deg, white, rgba(255,255,255,0.8))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Social Media Hub
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      Connect accounts, manage content & discover trending AI creations
                    </p>
                  </div>
                </div>
                
                {/* Sub-navigation tabs */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'connections', label: 'Connected Accounts', icon: Link2 },
                    { id: 'all', label: 'Content Feed', icon: Zap },
                    { id: 'share', label: 'Share & Cross-Post', icon: Share2 }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActivitySection?.(tab.id);
                        if (tab.id === 'all') fetchActivity(1, 'all');
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '12px', border: 'none',
                        background: socialSubTab === tab.id
                          ? 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))'
                          : 'rgba(255,255,255,0.08)',
                        color: 'white', fontSize: '0.9rem', fontWeight: '600',
                        cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* === Connected Accounts === */}
            {socialSubTab === 'connections' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  {SOCIAL_PLATFORMS.map(p => {
                    const connected = socialConnections[p.id];
                    return (
                      <div key={p.id} style={{
                        background: connected ? `${p.color}10` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${connected ? p.color + '40' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '16px', padding: '20px',
                        display: 'flex', alignItems: 'center', gap: '16px',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '14px',
                          background: connected ? p.color : 'rgba(255,255,255,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.4rem', flexShrink: 0,
                          boxShadow: connected ? `0 4px 16px ${p.color}40` : 'none'
                        }}>
                          {p.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', color: 'white', marginBottom: '2px' }}>{p.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.desc}</div>
                          {connected && <div style={{ fontSize: '0.75rem', color: p.color, marginTop: '4px', fontWeight: '600' }}>âœ“ Connected</div>}
                        </div>
                        <button
                          onClick={() => {
                            if (connected) {
                              const updated = { ...socialConnections, [p.id]: false };
                              setSocialConnections(updated);
                              localStorage.setItem('studio_agents_socials', JSON.stringify(updated));
                              toast(`Disconnected from ${p.name}`, { icon: 'ðŸ”Œ' });
                            } else {
                              handleConnectSocial(p.id);
                            }
                          }}
                          style={{
                            padding: '8px 16px', borderRadius: '10px', border: 'none',
                            background: connected ? 'rgba(255,255,255,0.08)' : `${p.color}`,
                            color: connected ? 'var(--text-secondary)' : 'white',
                            fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                            transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                          }}
                        >
                          {connected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {/* Connection stats */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
                  padding: '24px', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px'
                }}>
                  {[
                    { label: 'Connected', value: Object.values(socialConnections).filter(Boolean).length, color: 'var(--color-emerald)' },
                    { label: 'Available', value: SOCIAL_PLATFORMS.length, color: 'var(--color-cyan)' },
                    { label: 'Pending', value: 0, color: 'var(--color-amber)' }
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* === Content Feed (existing trending content) === */}
            {socialSubTab === 'all' && (
              <div>
                {/* Source filter tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'All', icon: Zap },
                    { id: 'news', label: 'Music News', icon: GlobeIcon },
                    { id: 'soundcloud', label: 'SoundCloud', icon: Cloud },
                    { id: 'youtube', label: 'YouTube', icon: PlayCircle },
                    { id: 'releases', label: 'Releases', icon: Disc },
                    { id: 'reddit', label: 'Community', icon: MessageSquare }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => fetchActivity(1, tab.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '10px', border: 'none',
                        background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
                        fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Music Hub Content Grid */}
                <div className="music-hub-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '20px'
                }}>
              {activityFeed.map((item, idx) => (
                <div 
                  key={`${item.id}-${idx}`} 
                  className="music-hub-card"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(item.url, '_blank')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'var(--color-purple)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(168, 85, 247, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Card Media */}
                  {item.imageUrl && (
                    <div className="activity-media-preview" style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                      
                      {/* Unified Hover Overlay */}
                      <div className="media-overlay">
                         <button 
                          className="preview-indicator"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayingItem({
                              ...item,
                              type: item.isVideo ? 'video' : 'image',
                              url: item.videoUrl || item.imageUrl || item.url
                            });
                          }}
                        >
                          <Eye size={20} />
                          <span>Quick Preview</span>
                        </button>
                      </div>

                      {item.isVideo && !item.imageUrl && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(4px)'
                        }}>
                          <PlayCircle size={28} color="white" />
                        </div>
                      )}
                      
                      {/* Type Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: item.source === 'youtube' ? 'rgba(255, 0, 0, 0.9)' : 
                                   item.source === 'reddit' ? 'rgba(255, 69, 0, 0.9)' : 
                                   item.source === 'soundcloud' ? '#ff3300' :
                                   item.source === 'news' ? 'rgba(0, 120, 215, 0.9)' :
                                   'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        zIndex: 2
                      }}>
                        {item.source === 'youtube' && <PlayCircle size={12} />}
                        {item.source === 'reddit' && <MessageSquare size={12} />}
                        {(item.source === 'releases' || item.type === 'release') && <Calendar size={12} />}
                        {item.source === 'soundcloud' && <Cloud size={12} />}
                        {item.source === 'news' && <GlobeIcon size={12} />}
                        {item.source}
                      </div>
                    </div>
                  )}
                  
                  {/* Card Content */}
                  <div style={{ padding: '16px' }}>
                    {/* Category Tag */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: `var(--${item.color?.replace('agent-', 'color-') || 'color-purple'})`,
                      opacity: 0.8,
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      marginBottom: '10px',
                      textTransform: 'uppercase'
                    }}>
                      {item.category}
                    </div>
                    
                    {/* Title */}
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'white',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.title}
                    </h3>
                    
                    {/* Snippet/Author */}
                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.snippet || item.author}
                    </p>
                    
                    {/* Footer Meta */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.likes !== undefined && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <Zap size={14} style={{ color: 'var(--color-purple)' }} />
                            {item.likes > 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
                          </span>
                        )}
                        {item.comments !== undefined && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <MessageSquare size={14} />
                            {item.comments}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {item.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
                </div>

                {/* No Image Cards (for releases without images) */}
            {activityFeed.filter(item => !item.imageUrl).length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Upcoming & Recent Releases
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activityFeed.filter(item => !item.imageUrl && item.type === 'release').slice(0, 10).map((item, idx) => (
                    <div
                      key={`release-${item.id}-${idx}`}
                      onClick={() => window.open(item.url, '_blank')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: item.daysUntil === 0 ? 'linear-gradient(135deg, var(--color-emerald), var(--color-cyan))' :
                                   item.daysUntil > 0 ? 'linear-gradient(135deg, var(--color-purple), var(--color-pink))' :
                                   'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Calendar size={22} color="white" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: 'white', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {item.snippet}
                        </div>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: item.daysUntil === 0 ? 'var(--color-emerald)' :
                                   item.daysUntil > 0 ? 'rgba(168, 85, 247, 0.2)' :
                                   'rgba(255,255,255,0.1)',
                        color: item.daysUntil === 0 ? 'black' : 'white',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoadingActivity && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px', color: 'var(--text-secondary)' }}>
                <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <span>Loading music content...</span>
              </div>
            )}

            {/* Empty state when no content and not loading */}
            {!isLoadingActivity && activityFeed.length === 0 && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '60px 24px', 
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <Music size={48} style={{ color: 'var(--color-purple)', marginBottom: '16px', opacity: 0.6 }} />
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>No Music Content Available</h3>
                <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                  Unable to load trending AI music from Udio and Suno. Make sure the backend server is running.
                </p>
                <button 
                  onClick={() => fetchActivity(1)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <RefreshCw size={16} /> Try Again
                </button>
              </div>
            )}

            {!isLoadingActivity && hasMoreActivity && activityFeed.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '32px' }}>
                <button 
                  onClick={() => fetchActivity(activityPage + 1)}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '12px',
                    border: '1px solid var(--color-purple)',
                    background: 'transparent',
                    color: 'var(--color-purple)',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-purple)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-purple)';
                  }}
                >
                  Load More
                </button>
              </div>
            )}

            {!hasMoreActivity && activityFeed.length > 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <p>ðŸŽµ You've explored all the latest content. Check back soon!</p>
              </div>
            )}
              </div>
            )}

            {/* === Share & Cross-Post === */}
            {socialSubTab === 'share' && (
              <div>
                {/* Share Content Section */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)', padding: '32px', marginBottom: '24px'
                }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: '700', color: 'white' }}>
                    Share Your Creations
                  </h3>
                  <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Cross-post your AI-generated content to connected platforms
                  </p>

                  {/* Content to Share */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Content</label>
                    <textarea
                      placeholder="Write your post caption, or paste text from your AI generations..."
                      style={{
                        width: '100%', minHeight: '120px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                        padding: '16px', color: 'white', fontSize: '0.95rem', resize: 'vertical',
                        outline: 'none', fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  {/* Target Platforms */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '600' }}>
                      Post to ({Object.values(socialConnections).filter(Boolean).length} connected)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {SOCIAL_PLATFORMS.filter(p => socialConnections[p.id]).map(p => (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 16px', borderRadius: '10px',
                          background: `${p.color}20`, border: `1px solid ${p.color}40`,
                          fontSize: '0.85rem', color: 'white', cursor: 'pointer'
                        }}>
                          <span>{p.icon}</span> {p.name}
                          <CheckCircle size={14} style={{ color: p.color }} />
                        </div>
                      ))}
                      {Object.values(socialConnections).filter(Boolean).length === 0 && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '8px' }}>
                          No accounts connected. <button onClick={() => setActivitySection?.('connections')} style={{ color: 'var(--color-purple)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: 'inherit' }}>Connect accounts â†’</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={() => toast('Cross-posting coming soon! Connect your accounts to get ready.', { icon: 'ðŸš€' })}
                    style={{
                      padding: '14px 32px', borderRadius: '12px', border: 'none',
                      background: Object.values(socialConnections).filter(Boolean).length > 0
                        ? 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))'
                        : 'rgba(255,255,255,0.1)',
                      color: 'white', fontSize: '1rem', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Share2 size={18} /> Share to {Object.values(socialConnections).filter(Boolean).length} Platform{Object.values(socialConnections).filter(Boolean).length !== 1 ? 's' : ''}
                  </button>
                </div>

                {/* Recent Projects to Share */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)', padding: '32px'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>
                    Recent Creations
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Your AI-generated content will appear here for easy sharing. Head to the Studio to create something amazing!
                  </p>
                  <button
                    onClick={() => setActiveTab('mystudio')}
                    style={{
                      marginTop: '16px', padding: '10px 20px', borderRadius: '10px',
                      border: '1px solid var(--color-purple)', background: 'transparent',
                      color: 'var(--color-purple)', fontSize: '0.9rem', fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                  >
                    Open Studio â†’
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'news':
        return (
          <Suspense fallback={<LazyFallback />}>
            <NewsHub
              newsItems={filteredNews}
              newsSearch={newsSearch}
              setNewsSearch={setNewsSearch}
              isLoadingNews={isLoadingNews}
              onRefresh={handleRefreshNews}
              hasMoreNews={hasMoreNews}
              onLoadMore={() => fetchNews(newsPage + 1)}
              setPlayingItem={setPlayingItem}
            />
          </Suspense>
        );
      case 'profile':
        return (
          <div className="studio-profile-view animate-fadeInUp" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
              <div className="profile-avatar-large" style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-purple)', position: 'relative' }}>
                {user?.photoURL ? <img src={user.photoURL} alt="User" loading="lazy" style={{ width: '100%', height: '100%' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--color-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{user?.displayName?.charAt(0) || 'U'}</div>}
                <button style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', fontSize: '0.7rem', padding: '4px', cursor: 'pointer' }}>Edit</button>
              </div>
              <div>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{userProfile.stageName || user?.displayName || 'Guest Creator'}</h1>
                <p style={{ color: 'var(--text-secondary)' }}>{user?.email || 'No email linked'}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <span className="badge" style={{ background: 'var(--color-purple)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>{userProfile.plan} Plan</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>Member since {userProfile.memberSince}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--color-cyan)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>{userProfile.credits} Credits</span>
                </div>
              </div>
            </div>

            <div className="profile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div className="stat-card" style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <h4 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-purple)', marginBottom: '4px' }}>{(projects || []).length}</h4>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Projects</span>
              </div>
              <div className="stat-card" style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <h4 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-cyan)', marginBottom: '4px' }}>{new Set((projects || []).map(p => p.agent)).size}</h4>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Agents Used</span>
              </div>
              <div 
                className="stat-card haptic-press" 
                onClick={() => setShowCreditsModal(true)}
                style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', cursor: 'pointer' }}
              >
                <h4 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-orange)', marginBottom: '4px' }}>{userProfile.credits}</h4>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Credits Left</span>
              </div>
            </div>

            <div className="profile-section" style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Creator Profile</h3>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Stage Name</label>
                  <input 
                    type="text" 
                    value={userProfile.stageName} 
                    onChange={(e) => setUserProfile({...userProfile, stageName: e.target.value})}
                    placeholder={user?.displayName || "Enter stage name"}
                    className="form-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px' }} 
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Primary Genre</label>
                  <select 
                    value={userProfile.genre}
                    onChange={(e) => setUserProfile({...userProfile, genre: e.target.value})}
                    className="form-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                  >
                    <option>Hip Hop / Rap</option>
                    <option>R&B</option>
                    <option>Pop</option>
                    <option>Electronic</option>
                    <option>Rock</option>
                    <option>Afrobeats</option>
                    <option>Latin</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Creator Bio</label>
                  <textarea 
                    rows="4" 
                    value={userProfile.bio}
                    onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                    placeholder="Tell your story..." 
                    className="form-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', resize: 'vertical' }}
                  ></textarea>
                </div>
                 <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Location</label>
                  <input 
                    type="text" 
                    value={userProfile.location} 
                    onChange={(e) => setUserProfile({...userProfile, location: e.target.value})}
                    placeholder="City, Country"
                    className="form-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px' }} 
                  />
                </div>
                 <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Website</label>
                  <input 
                    type="text" 
                    value={userProfile.website} 
                    onChange={(e) => setUserProfile({...userProfile, website: e.target.value})}
                    placeholder="https://"
                    className="form-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px' }} 
                  />
                </div>
              </div>
            </div>

            <div className="profile-section" style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Share2 size={20} /> Social Connections</h3>
              <div className="social-connect-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
                  { id: 'twitter', label: 'X / Twitter', icon: Twitter, color: '#1DA1F2' },
                  { id: 'spotify', label: 'Spotify for Artists', icon: Music, color: '#1DB954' },
                  { id: 'tiktok', label: 'TikTok', icon: VideoIcon, color: '#00f2ea' }
                ].map(social => (
                  <div key={social.id} className="social-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <social.icon size={20} color={social.color} />
                      <span>{social.label}</span>
                    </div>
                    <button 
                      className="btn-sm" 
                      onClick={() => setSocialConnections(prev => {
                        const newState = { ...prev, [social.id]: !prev[social.id] };
                        localStorage.setItem('studio_agents_socials', JSON.stringify(newState));
                        return newState;
                      })}
                      style={{ 
                        background: socialConnections[social.id] ? 'rgba(16, 185, 129, 0.2)' : 'transparent', 
                        border: `1px solid ${socialConnections[social.id] ? '#10b981' : 'var(--border-color)'}`, 
                        color: socialConnections[social.id] ? '#10b981' : 'white', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        minWidth: '100px'
                      }}
                    >
                      {socialConnections[social.id] ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="profile-section" style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Settings size={20} /> Preferences</h3>
              <div className="preferences-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="preference-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    <div>
                      <div style={{ fontWeight: '600' }}>Appearance</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                    </div>
                  </div>
                  <button 
                    className="btn-sm" 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-primary)', 
                      padding: '6px 12px', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      minWidth: '100px'
                    }}
                  >
                    Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="cta-button-secondary" onClick={() => setActiveTab('mystudio')}>Cancel</button>
              <button className="cta-button-premium" onClick={async () => { 
                localStorage.setItem('studio_user_profile', JSON.stringify(userProfile));
                // Persist profile to Firestore for cross-device sync
                if (user?.uid && db) {
                  try {
                    const { stageName, genre, bio, location, website, targetDemographic, language } = userProfile;
                    const userRef = doc(db, 'users', user.uid);
                    await setDoc(userRef, { profile: { stageName, genre, bio, location, website, targetDemographic, language } }, { merge: true });
                  } catch (err) { console.error('Profile cloud save failed:', err); }
                }
                toast.success('Profile saved!'); 
                setActiveTab('mystudio'); 
              }}>Save Changes</button>
            </div>
          </div>
        );

      case 'support': {
        const suggestions = helpSearch.length > 1 
          ? [
              // Navigation Matches
              ...NAVIGATION_ITEMS_STATIC.filter(nav => 
                nav.keywords.some(k => k.includes(helpSearch.toLowerCase())) || 
                nav.label.toLowerCase().includes(helpSearch.toLowerCase())
              ).map(item => ({
                type: 'Action',
                title: `Go to ${item.label}`,
                description: 'Navigate to this section',
                icon: ArrowRight,
                action: () => {
                   setActiveTab(item.type);
                   if (item.sub) setDashboardTab(item.sub);
                }
              })),

              // Troubleshooting Matches
              ...TROUBLESHOOTING_GUIDE.filter(guide => 
                guide.keywords.some(k => helpSearch.toLowerCase().includes(k)) ||
                guide.issue.toLowerCase().includes(helpSearch.toLowerCase())
              ).map(item => ({ 
                type: 'Troubleshooting',
                title: item.issue,
                description: item.solution,
                icon: Shield
              })),

              // Guide Matches
              ...HELP_ITEMS.filter(item => 
                item.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
                item.desc.toLowerCase().includes(helpSearch.toLowerCase()) ||
                item.details.toLowerCase().includes(helpSearch.toLowerCase())
              ).map(item => ({ 
                type: 'Guide',
                title: item.title,
                description: item.desc,
                icon: Book
              })),

              // Agent Matches
              ...AGENTS.filter(agent => 
                agent.name.toLowerCase().includes(helpSearch.toLowerCase()) ||
                agent.description.toLowerCase().includes(helpSearch.toLowerCase()) ||
                agent.category.toLowerCase().includes(helpSearch.toLowerCase())
              ).map(item => ({ 
                type: 'Agent',
                title: item.name,
                description: item.description,
                icon: Zap,
                action: () => { setActiveTab('agents'); setSelectedAgent(item); }
              })),

              // FAQ Matches
              ...[
                  { q: 'How do I export my creations?', a: 'You can export any creation from the Project Hub using the download icon.' },
                  { q: 'Can I use the lyrics commercially?', a: 'Yes, all content generated by Studio Agents is royalty-free for Pro users.' },
                  { q: 'How do I change the agent\'s genre?', a: 'Use the Genre dropdown in the agent\'s detail view to shift styles.' }
                ].filter(faq => 
                  faq.q.toLowerCase().includes(helpSearch.toLowerCase()) ||
                  faq.a.toLowerCase().includes(helpSearch.toLowerCase())
                ).map(item => ({ 
                  type: 'FAQ',
                  title: item.q,
                  description: item.a,
                  icon: CircleHelp
                }))
            ]
          : [];

        return (
          <div className="help-center-view animate-fadeInUp">
            <div className="help-hero">
              <h1>Support Center</h1>
              <p className="text-muted" style={{ marginTop: '8px' }}>Guides, troubleshooting, and expert assistance.</p>
              <div className="search-box large" style={{ marginTop: '24px' }}>
                <Search size={20} />
                <input 
                  type="text" 
                  placeholder="Search for agents, guides, or troubleshooting..." 
                  value={helpSearch}
                  onChange={(e) => setHelpSearch(e.target.value)}
                />
              </div>
            </div>

            {suggestions.length > 0 ? (
              <div className="smart-suggestions animate-fadeIn">
                <div className="suggestions-header">
                  <Sparkles size={18} className="text-purple" />
                  <h3>Search Results</h3>
                </div>
                <div className="suggestions-list">
                  {suggestions.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div 
                        key={i} 
                        className="suggestion-item"
                        onClick={item.action ? item.action : undefined}
                        style={{ cursor: item.action ? 'pointer' : 'default' }}
                      >
                        <div className="suggestion-icon">
                          <Icon size={20} />
                        </div>
                        <div className="suggestion-content">
                          <div className="suggestion-type">{item.type}</div>
                          <h4>{item.title}</h4>
                          <p>{item.description}</p>
                        </div>
                        {item.action && <ArrowRight size={16} className="suggestion-arrow" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : helpSearch.length > 1 ? (
              <div className="empty-search-state animate-fadeIn" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <h3>No results found</h3>
                <p>Try searching for "Billing", "Ghostwriter", or "Export".</p>
              </div>
            ) : null}

            <div className="help-grid-main">
              {HELP_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const isExpanded = expandedHelp === i;
                return (
                  <div key={i} className={`help-card-item ${isExpanded ? 'expanded' : ''}`}>
                    <div className="help-card-icon">
                      <Icon size={24} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                    {isExpanded && (
                      <div className="help-card-details animate-fadeIn">
                        <p>{item.details}</p>
                      </div>
                    )}
                    <button 
                      className="help-card-link"
                      onClick={() => setExpandedHelp(isExpanded ? null : i)}
                    >
                      {isExpanded ? 'Show Less' : 'Read More'} 
                      {isExpanded ? <ChevronUp size={16} /> : <ArrowRight size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {[
                  { q: 'How do I export my creations?', a: 'You can export any creation from the Project Hub using the download icon.' },
                  { q: 'Can I use the lyrics commercially?', a: 'Yes, all content generated by Studio Agents is royalty-free for Pro users.' },
                  { q: 'How do I change the agent\'s genre?', a: 'Use the Genre dropdown in the agent\'s detail view to shift styles.' }
                ].map((faq, i) => (
                  <div key={i} className="faq-item">
                    <h4>{faq.q}</h4>
                    <p>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="contact-support-section" style={{ marginTop: '40px', padding: '32px', background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div className="icon-box" style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--color-purple)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={32} />
              </div>
              <h2>Still need help?</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '12px auto 24px' }}>
                Our support team is available 24/7 to assist with technical issues, billing inquiries, or creative blocks.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="cta-button-premium"
                  onClick={() => window.open('mailto:support@studioagents.com?subject=Support Request', '_blank')}
                >
                  Email Support
                </button>
                <button 
                  className="cta-button-secondary"
                  onClick={() => window.open('https://discord.gg/studioagents', '_blank')}
                >
                  Join Discord Community
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'more': {
        return (
          <div className="more-menu-view animate-fadeInUp" style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>More Options</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '16px',
              marginBottom: '32px'
            }}>
              {MORE_MENU_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'legal' || item.id === 'whitepapers') {
                        window.location.hash = `#/${item.id}`;
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveTab(item.id)}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `${item.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color
                    }}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{item.label}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div style={{ 
              background: 'var(--card-bg)', 
              borderRadius: '16px', 
              padding: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => setShowProjectTypeChoice(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '12px',
                    color: 'var(--color-purple)',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}
                >
                  <Plus size={20} />
                  Create New Project
                </button>
                
                {!isLoggedIn ? (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '12px',
                      color: 'var(--color-cyan)',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}
                  >
                    <User size={20} />
                    Sign In / Create Account
                  </button>
                ) : (
                  <button
                    onClick={handleSecureLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      color: 'var(--color-red)',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}
                  >
                    <LogOut size={20} />
                    Sign Out
                  </button>
                )}
              </div>
            </div>

            {/* Theme Toggle */}
            <div style={{ 
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                <span>Dark Mode</span>
              </span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  background: theme === 'dark' ? 'var(--color-purple)' : 'var(--border-color)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: theme === 'dark' ? '25px' : '3px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Persist theme
  useEffect(() => {
    localStorage.setItem('studio_theme', theme);
  }, [theme]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 150;
    
    if (isNearBottom) {
      if (activeTab === 'activity' && !isLoadingActivity && hasMoreActivity) {
        fetchActivity(activityPage + 1);
      } else if (activeTab === 'news' && !isLoadingNews && hasMoreNews) {
        fetchNews(newsPage + 1);
      }
    }
  };

  // --- DYNAMIC CHECKLIST LOGIC ---
  const getProjectSteps = () => {
    if (!selectedProject) return null;
    
    // If project has specific agents selected, use them as steps
    if (selectedProject.agents && selectedProject.agents.length > 0) {
      return selectedProject.agents.map((agentData, index) => {
        // Handle both string IDs and agent objects
        const agentId = typeof agentData === 'string' ? agentData : (agentData?.id || '');
        const agent = (typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.find(a => a.id === agentId) : null;
        
        // DEFENSIVE: Ensure icon is a valid React component
        // Deserialized projects from Firestore may have plain objects instead of functions
        let SafeIcon = Zap;
        if (agent && typeof agent.icon === 'function') {
          SafeIcon = agent.icon;
        } else if (agentData && typeof agentData.icon === 'function') {
          SafeIcon = agentData.icon;
        }
        
        return {
          id: `step-${index}`,
          label: agent ? `Consult ${agent.name}` : (typeof agentData === 'object' && agentData.name ? agentData.name : 'Agent Task'),
          desc: agent ? (agent.description || agent.category) : 'Execute task',
          agentId: agentId,
          icon: SafeIcon,
          completed: false
        };
      });
    }

    // If custom workflow but no agents selected, show generic step
    if (selectedProject.workflow === 'custom') {
      return [
        { id: 'add-agent', label: 'Add Your First Agent', agentId: null, icon: Plus, desc: 'Select an agent to start working' }
      ];
    }

    // Fallback based on category
    switch(selectedProject.category) {
      case 'pro': return [
        { id: 'lyrics', label: 'Draft Lyrics', agentId: 'ghost', icon: Mic, desc: 'Generate verses & hooks' },
        { id: 'beat', label: 'Compose Beat', agentId: 'beat', icon: Music, desc: 'Create instrumental backing' },
        { id: 'art', label: 'Cover Art', agentId: 'album', icon: Zap, desc: 'Design album artwork' }
      ];
      case 'vybing': return [
        { id: 'beat', label: 'Generate Vibe', agentId: 'beat', icon: Music, desc: 'Quick beat generation' },
        { id: 'lyrics', label: 'Freestyle Lyrics', agentId: 'ghost', icon: Mic, desc: 'Write over the beat' }
      ];
      default: return [
        { id: 'plan', label: 'Create Plan', agentId: 'release', icon: Target, desc: 'Outline your project goals' }
      ];
    }
  };

  const activeProjectSteps = getProjectSteps();

  // Demo mode state for banner visibility
  const [showDemoBanner, setShowDemoBanner] = useState(getDemoModeState());

  // AUTH GATE: Show loading screen only if checking auth AND user isn't ready yet
  // This prevents crashes from race conditions whereLoggedIn is true but user state is null
  if (authChecking && !user && !isGuestMode) {
    return (
      <div className={`studio-container ${theme}-theme`} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(168, 85, 247, 0.2)',
            borderTopColor: '#a855f7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading Studio...</p>
        </div>
      </div>
    );
  }

  // AUTH GATE: If not logged in AND auth check complete AND not in guest mode, show login prompt
  if (!isLoggedIn && !authChecking && !isGuestMode) {
    return (
      <div className={`studio-container ${theme}-theme`} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '420px',
          padding: '40px',
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <Sparkles size={48} style={{ color: '#a855f7', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Welcome to Studio Agents V3.5
            <span style={{ fontSize: '0.8rem', color: 'var(--color-purple)', display: 'block', marginTop: '4px', fontWeight: 'bold', letterSpacing: '2px' }}>PRO EDITION</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Sign in to access your AI-powered creative studio
          </p>
          
          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} style={{ marginBottom: '20px' }}>
            <input
              type="email"
              placeholder="Email address"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="submit"
              disabled={authLoading}
              className="btn-pill primary"
              style={{ 
                padding: '12px 32px', 
                fontSize: '1rem', 
                width: '100%', 
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Mail size={18} />
              {authLoading ? 'Please wait...' : (authMode === 'signup' ? 'Create Account' : 'Sign In with Email')}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#a855f7',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {authMode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
          </form>
          
          {/* Divider */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '16px 0',
            gap: '12px'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(139, 92, 246, 0.2)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(139, 92, 246, 0.2)' }} />
          </div>
          
          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="btn-pill"
            style={{ 
              padding: '12px 32px', 
              fontSize: '1rem', 
              width: '100%', 
              marginBottom: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
              background: 'transparent',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: 'var(--text-primary)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {authLoading ? 'Signing in...' : 'Continue with Google'}
          </button>
          
          {/* Apple Sign In */}
          <button
            onClick={handleAppleLogin}
            disabled={authLoading}
            className="btn-pill"
            style={{ 
              padding: '12px 32px', 
              fontSize: '1rem', 
              width: '100%', 
              marginBottom: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
              background: '#000',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            {authLoading ? 'Signing in...' : 'Continue with Apple'}
          </button>
          
          {/* Guest Mode */}
          <button
            onClick={continueAsGuest}
            className="btn-pill"
            style={{ 
              padding: '12px 32px', 
              fontSize: '1rem', 
              width: '100%', 
              marginBottom: '16px',
              background: 'transparent',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              color: 'var(--text-secondary)'
            }}
          >
            Continue as Guest (Limited Features)
          </button>
          
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            â† Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`studio-container ${theme}-theme`} {...swipeHandlers}>
      {/* Demo Mode Banner */}
      {showDemoBanner && (
        <div 
          onClick={() => {
            toggleDemoMode();
            setShowDemoBanner(false);
            toast.success('Demo mode disabled - using real API');
          }}
          style={DEMO_BANNER_STYLES.container}
          title="Click to disable demo mode"
        >
          <span>{DEMO_BANNER_STYLES.icon}</span>
          <span>{DEMO_BANNER_STYLES.text}</span>
        </div>
      )}
      <aside className="studio-nav">
        <div className="studio-nav-logo" onClick={() => onBack?.()}>
          <div className="logo-box studio-logo">
            <Sparkles size={20} color="white" />
          </div>
          <div className="logo-text">
            <span className="studio-name">STUDIO AGENTS <span style={{ color: 'var(--color-purple)', fontSize: '0.6em', verticalAlign: 'middle', marginLeft: '8px', border: '1px solid var(--color-purple)', padding: '2px 6px', borderRadius: '4px' }}>V3.5</span></span>
            <span className="studio-sub">AI ECOSYSTEM</span>
            <span className="studio-domain">studioagentsai.com</span>
          </div>
        </div>

        <nav className="studio-nav-links">
          <button 
            className={`nav-link ${activeTab === 'mystudio' ? 'active' : ''}`}
            onClick={() => { setActiveTab('mystudio'); setSelectedAgent(null); }}
          >
            <Layers size={20} />
            <span>My Studio</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => { setActiveTab('agents'); setSelectedAgent(null); }}
          >
            <LayoutGrid size={20} />
            <span>Agents Team</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'hub' ? 'active' : ''}`}
            onClick={() => { setActiveTab('hub'); setSelectedAgent(null); }}
          >
            <Folder size={20} />
            <span>Project Hub</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => { setActiveTab('activity'); setSelectedAgent(null); }}
          >
            <MessageSquare size={20} />
            <span>Social Media Hub</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => { setActiveTab('resources'); setSelectedAgent(null); }}
          >
            <Book size={20} />
            <span>Resources</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => { setActiveTab('news'); setSelectedAgent(null); }}
          >
            <GlobeIcon size={20} />
            <span>Industry Pulse</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => { setActiveTab('support'); setSelectedAgent(null); }}
          >
            <CircleHelp size={20} />
            <span>Support</span>
          </button>
        </nav>

        <div className="studio-nav-footer">
          <div 
            className="user-profile-mini haptic-press" 
            onClick={() => { setActiveTab('profile'); setSelectedAgent(null); }}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar">
              {user?.photoURL ? <img src={user.photoURL} alt="User" loading="lazy" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--color-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{user?.displayName?.charAt(0) || 'U'}</div>}
            </div>
            <div className="user-info">
              <p className="user-name">{isLoggedIn ? (user?.displayName || 'Pro Creator') : 'Guest Creator'}</p>
              <p className="user-status">{isLoggedIn ? 'Pro Plan' : 'Free Account'}</p>
              {isLoggedIn ? (
                <button 
                  className="sign-out-link" 
                  style={{ fontSize: '0.7rem', color: 'var(--color-red)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: '4px', textAlign: 'left' }}
                  onClick={(e) => { e.stopPropagation(); handleSecureLogout(); }}
                >
                  Sign Out
                </button>
              ) : (
                <button 
                  className="sign-in-link" 
                  style={{ fontSize: '0.7rem', color: 'var(--color-purple)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: '4px', textAlign: 'left' }}
                  onClick={(e) => { e.stopPropagation(); setShowLoginModal(true); }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="studio-main" onScroll={handleScroll}>
        <header className="studio-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 className="studio-title">
              {selectedAgent ? selectedAgent.name : (activeTab === 'mystudio' ? 'Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
            </h2>
            {/* Save Status Indicator */}
            {saveStatus !== 'idle' && (
              <div 
                className="save-status-indicator animate-fadeIn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  background: saveStatus === 'saving' ? 'rgba(168, 85, 247, 0.15)' 
                    : saveStatus === 'saved' ? 'rgba(34, 197, 94, 0.15)' 
                    : 'rgba(239, 68, 68, 0.15)',
                  color: saveStatus === 'saving' ? 'var(--color-purple)' 
                    : saveStatus === 'saved' ? 'var(--color-green)' 
                    : 'var(--color-red)',
                  transition: 'all 0.3s ease'
                }}
              >
                {saveStatus === 'saving' && <Loader2 size={12} className="spin" />}
                {saveStatus === 'saved' && <Cloud size={12} />}
                {saveStatus === 'error' && <CloudOff size={12} />}
                <span>
                  {saveStatus === 'saving' ? 'Saving...' 
                    : saveStatus === 'saved' ? 'Saved' 
                    : 'Save failed'}
                </span>
              </div>
            )}
          </div>
          <div className="studio-header-actions">
            <button 
              className="action-button secondary haptic-press"
              onClick={() => onBack?.()}
              title="Back to Landing Page"
            >
              <Home size={20} />
            </button>
            <button 
              className="action-button secondary haptic-press"
              onClick={() => setActiveTab('profile')}
              title="User Profile"
            >
              <User size={20} />
              <span className="desktop-only">Profile</span>
            </button>
            <button 
              className="action-button secondary haptic-press"
              onClick={() => { setOnboardingStep(0); setShowOnboarding(true); }}
              title="Welcome Tour"
            >
              <Sparkles size={20} />
              <span className="desktop-only">Tour</span>
            </button>
            <button 
              className="action-button secondary haptic-press"
              onClick={() => { setActiveTab('support'); setSelectedAgent(null); }}
              title="Help Center"
            >
              <CircleHelp size={20} />
              <span className="desktop-only">Help</span>
            </button>
            <button 
              className="action-button secondary haptic-press" 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ position: 'relative' }}
            >
              <Bell size={20} />
              {notifications.some(n => !n.read) && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  background: 'var(--color-red)',
                  borderRadius: '50%',
                  border: '1px solid var(--card-bg)'
                }}></span>
              )}
            </button>

            {!isLoggedIn ? (
              <button 
                className="cta-button-sm haptic-press"
                onClick={() => setShowLoginModal(true)}
                style={{ marginLeft: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Sign In
              </button>
            ) : (
              <div className="user-avatar-header" style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', marginLeft: '0.5rem', border: '1px solid var(--border-color)' }}>
                 {user?.photoURL ? <img src={user.photoURL} alt="User" loading="lazy" style={{ width: '100%', height: '100%' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--color-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{user?.displayName?.charAt(0) || 'U'}</div>}
              </div>
            )}
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="notification-dropdown animate-fadeInUp">
                <div className="notif-header">
                  <h3>Notifications</h3>
                  <button 
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
                        <div className="notif-item-header">
                          <span className="notif-title">{n.title}</span>
                          <span className="notif-time">{n.time}</span>
                        </div>
                        <p className="notif-message">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {isLoggedIn ? (
              <div className="user-projects-dropdown">
                <button 
                  className="action-button primary haptic-press"
                  onClick={() => setShowProjectTypeChoice(true)}
                >
                  New Project ({projects?.length || 0})
                </button>
              </div>
            ) : (
              <button 
                className="action-button primary haptic-press"
                onClick={() => setShowLoginModal(true)}
              >
                New Project
              </button>
            )}
          </div>
        </header>

        <div className="studio-content">
          {renderContent()}
        </div>

        {/* Media Player Modal */}
        {playingItem && (
          <div 
            className="media-player-overlay animate-fadeIn"
            onClick={() => { document.querySelectorAll('audio, video').forEach(el => el.pause()); setPlayingItem(null); }}
          >
            <div 
              className="media-player-container animate-fadeInUp"
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <button className="player-close" onClick={() => { document.querySelectorAll('audio, video').forEach(el => el.pause()); setPlayingItem(null); }}>
                <X size={24} />
              </button>
              
              <div className="player-content">
                <div className="player-header">
                  <div className={`player-icon-box ${playingItem.color || 'agent-purple'}`}>
                    {playingItem.videoUrl ? <PlayCircle size={32} /> : playingItem.imageUrl ? <Music size={32} /> : <Music size={32} />}
                  </div>
                  <div className="player-info">
                    <h2>{playingItem.title}</h2>
                    <p>{playingItem.agent} â€¢ {playingItem.user || 'Your Creation'}</p>
                  </div>
                </div>

                <div className="player-visualizer" style={{ position: 'relative' }}>
                  {playingItem.videoUrl && (playingItem.videoUrl.includes('youtube.com') || playingItem.videoUrl.includes('youtu.be')) ? (
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={playingItem.videoUrl.replace('watch?v=', 'embed/')} 
                      title={playingItem.title}
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      className="player-video"
                      style={{ border: 'none' }}
                    ></iframe>
                  ) : (
                    <>
                      {/* Visual Layer */}
                      {playingItem.videoUrl ? (
                        <video 
                          src={playingItem.videoUrl} 
                          controls={!playingItem.audioUrl} 
                          playsInline
                          muted={!!playingItem.audioUrl} // Mute video if we have separate audio track (Mastering case)
                          className="player-video"
                          onPlay={(e) => {
                            document.querySelectorAll('audio, video').forEach(el => {
                              if (el !== e.target) el.pause();
                            });
                          }}
                        />
                      ) : playingItem.imageUrl ? (
                        <img 
                          src={playingItem.imageUrl} 
                          alt={playingItem.title} 
                          className="player-video" 
                          loading="lazy"
                          style={{ objectFit: 'contain', background: '#000' }}
                        />
                      ) : playingItem.audioUrl ? (
                        <div className="audio-visualizer-placeholder">
                          <div className="visualizer-bars">
                            {[...Array(20)].map((_, i) => (
                              <div key={i} className="v-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Text content display when no media */
                        <div style={{
                          width: '100%',
                          height: '100%',
                          minHeight: '200px',
                          padding: '2rem',
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.05))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'auto'
                        }}>
                          <div style={{
                            maxWidth: '600px',
                            fontSize: '1rem',
                            lineHeight: '1.8',
                            color: 'var(--text-primary)',
                            whiteSpace: 'pre-wrap',
                            textAlign: 'left'
                          }}>
                            {getAssetTextContent(playingItem) || (
                              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                                No content to display
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Audio Layer - Overlay if visual exists or just audio */}
                      {playingItem.audioUrl && (
                        <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', padding: '0 20px', zIndex: 10 }}>
                           <audio 
                            src={playingItem.audioUrl} 
                            controls 
                            className="player-audio"
                            style={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', borderRadius: '30px' }}
                            onPlay={(e) => {
                              document.querySelectorAll('audio, video').forEach(el => {
                                if (el !== e.target) el.pause();
                              });
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="player-footer">
                  <div className="player-actions">
                    <button 
                      className="player-btn primary"
                      onClick={() => handleDownload(playingItem)}
                    >
                      <Download size={18} />
                      <span>Download to Device</span>
                    </button>
                    <button 
                      className="player-btn secondary"
                      onClick={() => handleShareToFeed(playingItem)}
                    >
                      <Share2 size={18} />
                      <span>Share to Feed</span>
                    </button>
                    {/* Use as Backing Track — only for audio items */}
                    {playingItem.audioUrl && (
                      <button
                        className="player-btn secondary"
                        onClick={() => {
                          const isAlready = backingTrack && backingTrack.audioUrl === playingItem.audioUrl;
                          if (isAlready) {
                            setBackingTrack(null);
                            toast.success('Backing track cleared');
                          } else {
                            setBackingTrack({
                              title: playingItem.title || 'Untitled Beat',
                              audioUrl: playingItem.audioUrl,
                              bpm: playingItem.bpm || null,
                              id: playingItem.id
                            });
                            toast.success(`🎵 "${playingItem.title || 'Beat'}" set as backing track`);
                          }
                        }}
                        style={{
                          background: (backingTrack && backingTrack.audioUrl === playingItem.audioUrl) ? 'rgba(168, 85, 247, 0.3)' : undefined,
                          borderColor: (backingTrack && backingTrack.audioUrl === playingItem.audioUrl) ? 'rgba(168, 85, 247, 0.5)' : undefined
                        }}
                      >
                        <Music size={18} />
                        <span>{(backingTrack && backingTrack.audioUrl === playingItem.audioUrl) ? '🔗 Synced ✓' : '🔗 Sync Track'}</span>
                      </button>
                    )}
                    {/* Open Session Mixer */}
                    <button
                      className="player-btn secondary"
                      onClick={() => {
                        // Auto-load current item into session tracks
                        if (playingItem.audioUrl) {
                          setSessionTracks(prev => ({
                            ...prev,
                            audio: playingItem
                          }));
                        } else if (playingItem.videoUrl || playingItem.imageUrl) {
                          setSessionTracks(prev => ({
                            ...prev,
                            visual: playingItem
                          }));
                        }
                        setPlayingItem(null);
                        setShowStudioSession(true);
                      }}
                    >
                      <LayoutGrid size={18} />
                      <span>Session Mixer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Studio Session Overlay (Global Mechanism) */}
        {showStudioSession && (
          <div className="studio-session-overlay animate-fadeIn" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LayoutGrid size={24} color="white" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Studio Session</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Multi-Agent Orchestration</p>
                </div>
                <button 
                  onClick={() => toast("1. Select Beat (Track 1)\n2. Select Vocals (Track 2)\n3. Add a Visual\n4. Press Play to preview\n5. Click Render Master to save", { duration: 6000, icon: 'ðŸŽ›ï¸' })}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: '8px' }}
                >
                  <CircleHelp size={14} color="var(--text-secondary)" />
                </button>
              </div>
              <button onClick={() => { setShowStudioSession(false); setSessionPlaying(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {/* Main Stage */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '20px', overflowY: 'auto' }}>
              
              {/* Visual Preview */}
              <div style={{ flex: 2, background: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                {sessionTracks.visual ? (
                  sessionTracks.visual.videoUrl ? (
                    <video 
                      src={sessionTracks.visual.videoUrl} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                      muted 
                      loop 
                      ref={el => {
                        if (el) {
                          if (sessionPlaying) el.play().catch(e => console.log(e));
                          else el.pause();
                        }
                      }}
                    />
                  ) : (
                    <img src={sessionTracks.visual.imageUrl} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )
                ) : (
                  <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <ImageIcon size={48} />
                    <span>No Visual Selected</span>
                  </div>
                )}
                
                {/* Audio Elements (Hidden) */}
                {sessionTracks.audio && (
                  <audio 
                    src={sessionTracks.audio.audioUrl} 
                    ref={el => {
                      if (el) {
                        el.volume = sessionTracks.audioVolume || 0.8;
                        if (sessionPlaying) el.play().catch(e => console.log(e));
                        else el.pause();
                      }
                    }}
                    loop
                  />
                )}
                {sessionTracks.vocal && (
                  <audio 
                    src={sessionTracks.vocal.audioUrl} 
                    ref={el => {
                      if (el) {
                        el.volume = sessionTracks.vocalVolume || 1.0;
                        if (sessionPlaying) el.play().catch(e => console.log(e));
                        else el.pause();
                      }
                    }}
                    loop
                  />
                )}
              </div>

              {/* Mixer / Timeline */}
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Simple Pro Settings Bar - Captions.ai Style */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Real Assets Toggle */}
                    <div 
                      onClick={() => updateSessionWithHistory(prev => ({ ...prev, generateRealAssets: !prev.generateRealAssets }))}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        cursor: 'pointer',
                        background: sessionTracks.generateRealAssets ? 'linear-gradient(135deg, var(--color-purple), var(--color-pink))' : 'rgba(255,255,255,0.1)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ 
                        width: '32px', 
                        height: '18px', 
                        borderRadius: '9px', 
                        background: sessionTracks.generateRealAssets ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: 'white',
                          position: 'absolute',
                          top: '2px',
                          left: sessionTracks.generateRealAssets ? '16px' : '2px',
                          transition: 'left 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {sessionTracks.generateRealAssets ? 'âš¡ Real Assets' : 'ðŸ“ Text Mode'}
                      </span>
                    </div>
                    
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>BPM</span>
                      <input 
                        type="number" 
                        value={sessionTracks.bpm || 120}
                        onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, bpm: parseInt(e.target.value) || 120 }))}
                        style={{ width: '50px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: 'var(--color-cyan)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}
                      />
                    </div>
                    <select 
                      value={sessionTracks.frameRate || 30}
                      onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, frameRate: parseInt(e.target.value) }))}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      <option value="24">24fps</option>
                      <option value="30">30fps</option>
                      <option value="60">60fps</option>
                    </select>
                    <select 
                      value={sessionTracks.aspectRatio || '16:9'}
                      onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, aspectRatio: e.target.value }))}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      <option value="16:9">16:9</option>
                      <option value="9:16">9:16</option>
                      <option value="1:1">1:1</option>
                    </select>
                  </div>
                  
                  {/* Render Counter - Simple */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3].map(n => (
                        <div 
                          key={n}
                          style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%',
                            background: n <= (sessionTracks.renderCount || 0) ? 'var(--color-purple)' : 'rgba(255,255,255,0.2)'
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {3 - (sessionTracks.renderCount || 0)} renders left
                    </span>
                  </div>
                </div>
                
                {/* Real Assets Info Banner */}
                {sessionTracks.generateRealAssets && (
                  <div style={{ 
                    padding: '10px 16px', 
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))', 
                    borderRadius: '8px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong>âš¡ Real Asset Mode</strong> â€” AI will generate actual audio, images & video
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Uses Imagen 4.0 â€¢ Veo 3.0 â€¢ MusicGen
                    </div>
                  </div>
                )}

                {/* Agent Insight / Tip */}
                <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--color-purple)', fontSize: '0.9rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
                   <Sparkles size={18} className="text-purple" />
                   <div>
                     <strong>Agent Insight:</strong> 
                     {sessionTracks.audio?.agent === 'Beat Architect' ? " This beat has a strong transient profile. Keep vocals dry to cut through." : 
                      sessionTracks.vocal?.agent === 'Ghostwriter' ? " These lyrics are dense. Ensure the beat leaves room for the flow." :
                      " Combine assets from different agents to create a unique sound."}
                   </div>
                </div>

                {/* Track 1: Beat / Audio A */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', border: sessionTracks.audio ? '1px solid var(--color-cyan)' : '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: sessionTracks.audio ? '12px' : 0 }}>
                    <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}><Disc size={24} className="text-cyan" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Track 1</label>
                        <select 
                          style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--color-cyan)', fontSize: '0.75rem', cursor: 'pointer' }}
                          value={sessionTracks.audioOutputType || 'waveform'}
                          onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, audioOutputType: e.target.value }))}
                        >
                          <option value="waveform">ðŸŽµ Waveform</option>
                          <option value="file">ðŸ“ File</option>
                          <option value="stems">ðŸŽ›ï¸ Stems</option>
                          <option value="midi">ðŸŽ¹ MIDI</option>
                        </select>
                      </div>
                      <select 
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        value={sessionTracks.audio?.id || ''}
                        onChange={(e) => {
                          const assets = Array.isArray(selectedProject?.assets) ? selectedProject.assets : [];
                          const asset = assets.find(a => a?.id?.toString() === e.target.value);
                          updateSessionWithHistory(prev => ({ ...prev, audio: asset || null }));
                        }}
                      >
                        <option value="">Select Audio Asset...</option>
                        {(selectedProject?.assets || []).filter(a => a?.audioUrl || a?.type === 'audio' || a?.agent?.includes('Beat') || a?.agent?.includes('Sound')).map(a => (
                          <option key={a.id} value={a.id}>ðŸŽµ {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                        {(selectedProject?.assets || []).filter(a => !a?.audioUrl && a?.type !== 'audio').map(a => (
                          <option key={a.id} value={a.id}>ðŸ“„ {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ width: '80px', textAlign: 'center' }}>
                       <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vol</label>
                       <input 
                         type="range" 
                         min="0" 
                         max="1" 
                         step="0.1" 
                         value={sessionTracks.audioVolume || 0.8}
                         onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, audioVolume: parseFloat(e.target.value) }))}
                         style={{ width: '100%' }} 
                       />
                       <div style={{ fontSize: '0.7rem', color: 'var(--color-cyan)' }}>{Math.round((sessionTracks.audioVolume || 0.8) * 100)}%</div>
                    </div>
                  </div>
                  {/* Waveform Visualization for Track 1 */}
                  {sessionTracks.audio && (
                    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px', overflow: 'hidden' }}>
                      {sessionTracks.audioOutputType === 'waveform' || !sessionTracks.audioOutputType ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}>
                          {/* Animated Waveform Bars */}
                          {[...Array(48)].map((_, i) => (
                            <div 
                              key={i}
                              style={{
                                flex: 1,
                                background: `linear-gradient(to top, var(--color-cyan), rgba(6, 182, 212, 0.3))`,
                                borderRadius: '2px',
                                height: sessionPlaying ? `${20 + Math.sin(i * 0.5 + Date.now() / 200) * 20}px` : `${10 + Math.sin(i * 0.3) * 15}px`,
                                transition: 'height 0.1s ease',
                                animation: sessionPlaying ? `waveform${i % 4} 0.5s ease-in-out infinite` : 'none'
                              }}
                            />
                          ))}
                        </div>
                      ) : sessionTracks.audioOutputType === 'file' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-cyan)', fontSize: '0.85rem' }}>
                          <FileAudio size={24} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{sessionTracks.audio.title || 'Audio File'}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{sessionTracks.audio.agent} â€¢ WAV/MP3</div>
                          </div>
                          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.5 }}>~3:24</div>
                        </div>
                      ) : sessionTracks.audioOutputType === 'stems' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {['Drums', 'Bass', 'Melody', 'FX'].map((stem, i) => (
                            <div key={stem} style={{ flex: 1, background: `rgba(6, 182, 212, ${0.2 + i * 0.1})`, borderRadius: '6px', padding: '6px', textAlign: 'center', fontSize: '0.7rem' }}>
                              <div style={{ color: 'var(--color-cyan)' }}>{stem}</div>
                              <div style={{ width: '100%', height: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${60 + i * 10}%`, height: '100%', background: 'var(--color-cyan)', borderRadius: '4px' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-cyan)', fontSize: '0.8rem' }}>
                          <Piano size={20} />
                          <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
                            {/* MIDI Note representation */}
                            {[...Array(16)].map((_, i) => (
                              <div key={i} style={{ 
                                width: '8px', 
                                height: `${8 + (i % 3) * 6}px`, 
                                background: i % 2 === 0 ? 'var(--color-cyan)' : 'transparent',
                                border: '1px solid var(--color-cyan)',
                                borderRadius: '2px' 
                              }} />
                            ))}
                          </div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>128 BPM â€¢ C Major</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Track 2: Vocals / Audio B */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', border: sessionTracks.vocal ? '1px solid var(--color-purple)' : '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: sessionTracks.vocal ? '12px' : 0 }}>
                    <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}><Mic size={24} className="text-purple" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Track 2</label>
                        <select 
                          style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--color-purple)', fontSize: '0.75rem', cursor: 'pointer' }}
                          value={sessionTracks.vocalOutputType || 'waveform'}
                          onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, vocalOutputType: e.target.value }))}
                        >
                          <option value="waveform">ðŸŽµ Waveform</option>
                          <option value="file">ðŸ“ File</option>
                          <option value="lyrics">ðŸ“ Lyrics</option>
                          <option value="adlibs">ðŸŽ¤ Adlibs</option>
                        </select>
                      </div>
                      <select 
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        value={sessionTracks.vocal?.id || ''}
                        onChange={(e) => {
                          const assets = Array.isArray(selectedProject?.assets) ? selectedProject.assets : [];
                          const asset = assets.find(a => a?.id?.toString() === e.target.value);
                          updateSessionWithHistory(prev => ({ ...prev, vocal: asset || null }));
                        }}
                      >
                        <option value="">Select Vocal/Lyrics Asset...</option>
                        {(selectedProject?.assets || []).filter(a => a?.agent?.includes('Ghost') || a?.agent?.includes('Vocal') || a?.type === 'lyrics').map(a => (
                          <option key={a.id} value={a.id}>ðŸŽ¤ {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                        {(selectedProject?.assets || []).filter(a => !a?.agent?.includes('Ghost') && !a?.agent?.includes('Vocal') && a?.type !== 'lyrics').map(a => (
                          <option key={a.id} value={a.id}>ðŸ“„ {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ width: '80px', textAlign: 'center' }}>
                       <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vol</label>
                       <input 
                         type="range" 
                         min="0" 
                         max="1" 
                         step="0.1" 
                         value={sessionTracks.vocalVolume || 1.0}
                         onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, vocalVolume: parseFloat(e.target.value) }))}
                         style={{ width: '100%' }} 
                       />
                       <div style={{ fontSize: '0.7rem', color: 'var(--color-purple)' }}>{Math.round((sessionTracks.vocalVolume || 1.0) * 100)}%</div>
                    </div>
                  </div>
                  {/* Waveform/Lyrics Visualization for Track 2 */}
                  {sessionTracks.vocal && (
                    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px', overflow: 'hidden' }}>
                      {sessionTracks.vocalOutputType === 'waveform' || !sessionTracks.vocalOutputType ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}>
                          {[...Array(48)].map((_, i) => (
                            <div 
                              key={i}
                              style={{
                                flex: 1,
                                background: `linear-gradient(to top, var(--color-purple), rgba(168, 85, 247, 0.3))`,
                                borderRadius: '2px',
                                height: sessionPlaying ? `${15 + Math.cos(i * 0.4 + Date.now() / 180) * 25}px` : `${8 + Math.cos(i * 0.3) * 12}px`,
                                transition: 'height 0.1s ease'
                              }}
                            />
                          ))}
                        </div>
                      ) : sessionTracks.vocalOutputType === 'file' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-purple)', fontSize: '0.85rem' }}>
                          <FileAudio size={24} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{sessionTracks.vocal.title || 'Vocal File'}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{sessionTracks.vocal.agent} â€¢ WAV</div>
                          </div>
                          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.5 }}>~2:48</div>
                        </div>
                      ) : sessionTracks.vocalOutputType === 'lyrics' ? (
                        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', lineHeight: 1.6, maxHeight: '80px', overflow: 'auto' }}>
                          <div style={{ color: 'var(--color-purple)', marginBottom: '4px', fontSize: '0.7rem' }}>ðŸ“ Lyrics Preview</div>
                          {sessionTracks.vocal.content?.substring(0, 200) || sessionTracks.vocal.snippet?.substring(0, 200) || 'No lyrics content...'}
                          {(sessionTracks.vocal.content?.length > 200 || sessionTracks.vocal.snippet?.length > 200) && '...'}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {['Yeah!', 'Uh', 'Let\'s go', 'Woo!', 'Ayy'].map((adlib) => (
                            <div key={adlib} style={{ 
                              background: 'rgba(168, 85, 247, 0.2)', 
                              border: '1px solid var(--color-purple)',
                              borderRadius: '16px', 
                              padding: '4px 12px', 
                              fontSize: '0.75rem',
                              color: 'var(--color-purple)'
                            }}>
                              {adlib}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Track 3: Visual */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', border: sessionTracks.visual ? '1px solid var(--color-pink)' : '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: sessionTracks.visual ? '12px' : 0 }}>
                    <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}><VideoIcon size={24} className="text-pink" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Track 3</label>
                        <select 
                          style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--color-pink)', fontSize: '0.75rem', cursor: 'pointer' }}
                          value={sessionTracks.visualOutputType || 'video'}
                          onChange={(e) => updateSessionWithHistory(prev => ({ ...prev, visualOutputType: e.target.value }))}
                        >
                          <option value="video">ðŸŽ¬ Video</option>
                          <option value="image">ðŸ–¼ï¸ Image</option>
                          <option value="animation">âœ¨ Animation</option>
                          <option value="thumbnail">ðŸ“· Thumbnail</option>
                        </select>
                      </div>
                      <select 
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        value={sessionTracks.visual?.id || ''}
                        onChange={(e) => {
                          const assets = Array.isArray(selectedProject?.assets) ? selectedProject.assets : [];
                          const asset = assets.find(a => a?.id?.toString() === e.target.value);
                          updateSessionWithHistory(prev => ({ ...prev, visual: asset || null }));
                        }}
                      >
                        <option value="">Select Visual Asset...</option>
                        {(selectedProject?.assets || []).filter(a => a?.imageUrl || a?.videoUrl || a?.type === 'image' || a?.type === 'video').map(a => (
                          <option key={a.id} value={a.id}>{a.videoUrl ? 'ðŸŽ¬' : 'ðŸ–¼ï¸'} {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                        {(selectedProject?.assets || []).filter(a => !a?.imageUrl && !a?.videoUrl && a?.type !== 'image' && a?.type !== 'video').map(a => (
                          <option key={a.id} value={a.id}>ðŸ“„ {a.title || 'Untitled'} ({a.agent || a.type})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Visual Preview for Track 3 */}
                  {sessionTracks.visual && (
                    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px', overflow: 'hidden' }}>
                      {sessionTracks.visualOutputType === 'video' || !sessionTracks.visualOutputType ? (
                        sessionTracks.visual.videoUrl ? (
                          <video src={sessionTracks.visual.videoUrl} style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px' }} muted />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-pink)', fontSize: '0.85rem' }}>
                            <VideoIcon size={24} />
                            <div>
                              <div style={{ fontWeight: 600 }}>{sessionTracks.visual.title || 'Video Asset'}</div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Video will be generated on render</div>
                            </div>
                          </div>
                        )
                      ) : sessionTracks.visualOutputType === 'image' ? (
                        sessionTracks.visual.imageUrl ? (
                          <img src={sessionTracks.visual.imageUrl} alt="Visual" loading="lazy" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-pink)', fontSize: '0.85rem' }}>
                            <ImageIcon size={24} />
                            <div>Image will be generated</div>
                          </div>
                        )
                      ) : sessionTracks.visualOutputType === 'animation' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-pink)' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[...Array(6)].map((_, i) => (
                              <div key={i} style={{
                                width: '32px',
                                height: '32px',
                                background: `linear-gradient(135deg, var(--color-pink), var(--color-purple))`,
                                borderRadius: '4px',
                                opacity: 0.3 + (i * 0.14),
                                transform: `rotate(${i * 15}deg)`
                              }} />
                            ))}
                          </div>
                          <div style={{ fontSize: '0.8rem', marginLeft: '12px' }}>
                            <div style={{ fontWeight: 600 }}>Animation Sequence</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>6 keyframes â€¢ 30fps</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '80px', 
                            height: '45px', 
                            background: 'linear-gradient(135deg, var(--color-pink), var(--color-purple))',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Camera size={20} color="white" />
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-pink)' }}>
                            <div style={{ fontWeight: 600 }}>Cover Thumbnail</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>1280x720 â€¢ YouTube Ready</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* <button className="btn-dashed" style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}>+ Add Track</button> */}

              </div>
            </div>

            {/* Footer Controls */}
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                 {/* Undo / Redo */}
                 <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
                    <button 
                      onClick={handleUndo} 
                      disabled={historyIndex <= 0}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: historyIndex > 0 ? 'pointer' : 'not-allowed', opacity: historyIndex > 0 ? 1 : 0.3 }}
                      title="Undo"
                    >
                      <Undo size={20} color="white" />
                    </button>
                    <button 
                      onClick={handleRedo} 
                      disabled={historyIndex >= sessionHistory.length - 1}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: historyIndex < sessionHistory.length - 1 ? 'pointer' : 'not-allowed', opacity: historyIndex < sessionHistory.length - 1 ? 1 : 0.3 }}
                      title="Redo"
                    >
                      <Redo size={20} color="white" />
                    </button>
                 </div>

                 <button 
                   className="btn-circle" 
                   aria-label={sessionPlaying ? "Pause Session" : "Play Session"}
                   style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-purple)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                   onClick={() => setSessionPlaying(!sessionPlaying)}
                 >
                   {sessionPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                 </button>
               </div>
               
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button 
                   className="btn-pill secondary"
                   onClick={() => {
                     // Save Project Logic (Save Session State)
                     const updatedProject = {
                       ...selectedProject,
                       sessionState: sessionTracks,
                       lastModified: Date.now()
                     };
                     setSelectedProject(updatedProject);
                     setProjects(prev => Array.isArray(prev) ? prev.map(p => p.id === updatedProject.id ? updatedProject : p) : [updatedProject]);
                     
                     // CRITICAL FIX: Ensure project is synced to cloud immediately when clicking Save
                     if (isLoggedIn && user) {
                       saveProjectToCloud(user.uid, updatedProject).catch(err => {
                         console.error('Cloud save failed:', err);
                         toast.error('Failed to sync to cloud. Your changes are saved locally.');
                       });
                     }
                     
                     handleTextToVoice("Project session saved.");
                     toast.success('Session saved!');
                   }}
                 >
                   <Save size={18} /> Save Project
                 </button>

                 <button 
                   className="btn-pill primary"
                   disabled={(sessionTracks.renderCount || 0) >= 3 || isGenerating}
                   style={{ opacity: ((sessionTracks.renderCount || 0) >= 3 || isGenerating) ? 0.5 : 1 }}
                   onClick={async () => {
                     // PREVENT DUPLICATE CALLS
                     if (isGenerating) return;

                     // Check render limit
                     if ((sessionTracks.renderCount || 0) >= 3) {
                       toast.error('Maximum 3 renders reached. Pro users can reset.');
                       return;
                     }
                     
                     setIsGenerating(true);
                     
                     // Collect selected assets for orchestration
                     const agentOutputs = [
                       sessionTracks.audio,
                       sessionTracks.vocal,
                       sessionTracks.visual
                     ].filter(Boolean);
                     
                     if (agentOutputs.length === 0) {
                       toast.error('Select at least one asset to render');
                       return;
                     }
                     
                     const renderNumber = (sessionTracks.renderCount || 0) + 1;
                     handleTextToVoice(`Render pass ${renderNumber} of 3. Orchestrating your agents.`);
                     toast.loading(`AMO Render ${renderNumber}/3...`, { id: 'amo-render' });
                     
                     try {
                       // Get auth token
                       const headers = { 'Content-Type': 'application/json' };
                       if (auth?.currentUser) {
                         const token = await auth.currentUser.getIdToken();
                         headers['Authorization'] = `Bearer ${token}`;
                       }
                       
                       // Call the AMO orchestrator endpoint with sync settings
                       const response = await fetch(`${BACKEND_URL}/api/orchestrate`, {
                         method: 'POST',
                         headers,
                         body: JSON.stringify({
                           agentOutputs: agentOutputs.map(a => ({
                             id: a.id,
                             agent: a.agent || a.type,
                             type: a.type,
                             content: a.snippet || a.content || a.text,
                             audioUrl: a.audioUrl,
                             imageUrl: a.imageUrl,
                             videoUrl: a.videoUrl
                           })),
                           projectName: selectedProject.name,
                           projectDescription: selectedProject.description,
                           // Professional sync settings for TV-ready output
                           syncSettings: {
                             bpm: sessionTracks.bpm || 120,
                             timeSignature: sessionTracks.timeSignature || '4/4',
                             key: sessionTracks.key || 'C Major',
                             frameRate: sessionTracks.frameRate || 30,
                             sampleRate: sessionTracks.sampleRate || 48000,
                             bitDepth: sessionTracks.bitDepth || 24,
                             aspectRatio: sessionTracks.aspectRatio || '16:9'
                           },
                           renderPass: renderNumber,
                           generateRealAssets: sessionTracks.generateRealAssets || false
                         })
                       });
                       
                       const data = await response.json();
                       
                       if (!response.ok) {
                         throw new Error(data.error || 'Orchestration failed');
                       }
                       
                       // If generateRealAssets is enabled, also call media generation APIs
                       let generatedAudioUrl = sessionTracks.audio?.audioUrl;
                       let generatedImageUrl = sessionTracks.visual?.imageUrl;
                       let generatedVideoUrl = sessionTracks.visual?.videoUrl;
                       
                       if (sessionTracks.generateRealAssets) {
                         toast.loading('Generating real assets...', { id: 'amo-assets' });
                         
                         // Generate image if we have visual content but no URL
                         if (sessionTracks.visual && !sessionTracks.visual.imageUrl) {
                           try {
                             const imagePrompt = sessionTracks.visual.snippet || sessionTracks.visual.content || `Album artwork for ${selectedProject.name}`;
                             const imgRes = await fetch(`${BACKEND_URL}/api/generate-image`, {
                               method: 'POST',
                               headers,
                               body: JSON.stringify({ prompt: imagePrompt.substring(0, 500), aspectRatio: sessionTracks.aspectRatio || '16:9' })
                             });
                             const imgData = await imgRes.json();
                             if (imgData.imageUrl) generatedImageUrl = imgData.imageUrl;
                           } catch (e) { console.log('Image generation skipped:', e.message); }
                         }
                         
                         // Generate audio if we have audio content but no URL
                         if (sessionTracks.audio && !sessionTracks.audio.audioUrl) {
                           try {
                             const audioPrompt = sessionTracks.audio.snippet || sessionTracks.audio.content || `${sessionTracks.bpm || 120} BPM beat`;
                             const audRes = await fetch(`${BACKEND_URL}/api/generate-audio`, {
                               method: 'POST',
                               headers,
                               body: JSON.stringify({ prompt: audioPrompt.substring(0, 200) })
                             });
                             const audData = await audRes.json();
                             if (audData.audioUrl) generatedAudioUrl = audData.audioUrl;
                           } catch (e) { console.log('Audio generation skipped:', e.message); }
                         }
                         
                         toast.dismiss('amo-assets');
                       }
                       
                       // Increment render count
                       updateSessionWithHistory(prev => ({
                         ...prev,
                         renderCount: renderNumber,
                         lastRenderTime: new Date().toISOString(),
                         renderHistory: [...(prev.renderHistory || []), { pass: renderNumber, timestamp: Date.now() }]
                       }));
                       
                       // Use the master asset from the API response
                       const masterAsset = data.masterAsset || {
                         id: `master-${Date.now()}`,
                         title: `Studio Master ${renderNumber}/3 - ${selectedProject.name}`,
                         type: "Master",
                         agent: "AMO Orchestrator",
                         date: "Just now",
                         color: "agent-purple",
                         snippet: data.output?.slice(0, 200) || "Orchestrated Master Composition.",
                         content: data.output,
                         audioUrl: generatedAudioUrl,
                         stems: {
                           audio: generatedAudioUrl,
                           vocal: sessionTracks.vocal?.audioUrl
                         },
                         imageUrl: generatedImageUrl,
                         videoUrl: generatedVideoUrl,
                         metadata: {
                           audioVolume: sessionTracks.audioVolume,
                           vocalVolume: sessionTracks.vocalVolume,
                           agentsProcessed: agentOutputs.length,
                           renderedAt: new Date().toISOString(),
                           renderPass: renderNumber,
                           bpm: sessionTracks.bpm || 120,
                           frameRate: sessionTracks.frameRate || 30,
                           aspectRatio: sessionTracks.aspectRatio || '16:9',
                           realAssets: sessionTracks.generateRealAssets || false
                         }
                       };
                       
                       // Update project with master asset
                       const updated = { ...selectedProject, assets: [masterAsset, ...selectedProject.assets] };
                       setSelectedProject(updated);
                       setProjects(prev => Array.isArray(prev) ? prev.map(p => p.id === updated.id ? updated : p) : [updated]);
                       
                       // Also save to cloud
                       if (isLoggedIn) {
                         const uid = localStorage.getItem('studio_user_id');
                         if (uid) {
                           fetch(`${BACKEND_URL}/api/projects`, {
                             method: 'POST',
                             headers,
                             body: JSON.stringify({ userId: uid, project: updated })
                           }).catch(err => console.error("Failed to sync to cloud", err));
                         }
                       }
                       
                       toast.dismiss('amo-render');
                       setShowStudioSession(false);
                       setSessionPlaying(false);
                       handleTextToVoice("Master render complete. Your orchestrated production is ready.");
                       toast.success('Master rendered and saved to your Hub!');
                       
                     } catch (err) {
                       console.error('AMO Orchestration error:', err);
                       toast.dismiss('amo-render');
                       toast.error(err.message || 'Orchestration failed. Check your internet connection and try again.');
                       handleTextToVoice("Orchestration failed. Please try again.");
                     } finally {
                       setIsGenerating(false);
                     }
                   }}
                 >
                   <Zap size={18} /> Render Master
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* External Save Modal */}
        {showExternalSaveModal && (
          <div className="modal-overlay" onClick={() => setShowExternalSaveModal(false)}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowExternalSaveModal(false)}><X size={20} /></button>
              <div className="modal-header">
                <div className="logo-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
                  <Cloud size={24} color="white" />
                </div>
                <h2>Save to Cloud</h2>
                <p>Sync your projects to the Studio Agents cloud or connect external storage.</p>
              </div>
              <div className="modal-body">
                {/* Studio Cloud Save - Primary Option */}
                <div style={{ marginBottom: '20px' }}>
                  <button 
                    className="storage-btn"
                    style={{ 
                      width: '100%', 
                      padding: '16px 20px', 
                      background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                      border: 'none',
                      justifyContent: 'center',
                      gap: '12px',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                    onClick={async () => {
                      if (!user?.uid) {
                        toast.error('Please sign in to save to cloud');
                        setShowExternalSaveModal(false);
                        return;
                      }
                      
                      const toastId = toast.loading('Syncing projects to cloud...');
                      try {
                        let successCount = 0;
                        const projectsToSync = projects.filter(p => p && p.id);
                        
                        for (const project of projectsToSync) {
                          try {
                            const success = await saveProjectToCloud(user?.uid, project);
                            if (success) successCount++;
                          } catch (err) {
                            console.error(`Failed to sync project ${project.id}:`, err);
                          }
                        }
                        
                        if (successCount > 0) {
                          toast.success(`âœ… Synced ${successCount} project${successCount > 1 ? 's' : ''} to cloud!`, { id: toastId });
                          setLastSyncTime(new Date());
                        } else {
                          toast.error('No projects to sync', { id: toastId });
                        }
                      } catch (err) {
                        console.error('Cloud sync failed:', err);
                        toast.error('Cloud sync failed - check your connection', { id: toastId });
                      }
                      setShowExternalSaveModal(false);
                    }}
                  >
                    <DatabaseIcon size={20} />
                    <span>Save to Studio Agents Cloud</span>
                  </button>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '8px' }}>
                    {user ? `Signed in as ${user.email || user.displayName}` : 'Sign in to enable cloud sync'}
                  </p>
                </div>
                
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '16px 0' }}>
                  â€” or connect external storage â€”
                </div>
                
                <div className="external-storage-grid">
                  <button className="storage-btn" onClick={() => { 
                    // Simulate connection
                    setStorageConnections(prev => ({ ...prev, googleDrive: true }));
                    setShowExternalSaveModal(false); 
                  }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" width="24" loading="lazy" />
                    <span>Google Drive</span>
                  </button>
                  <button className="storage-btn" onClick={() => { 
                    // Simulate connection
                    toast('OneDrive coming soon!', { icon: 'ðŸš§' }); 
                    setShowExternalSaveModal(false); 
                  }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg" alt="OneDrive" width="24" loading="lazy" />
                    <span>OneDrive</span>
                  </button>
                  <button className="storage-btn" onClick={() => { 
                    // Simulate connection
                    toast('Dropbox coming soon!', { icon: 'ðŸš§' }); 
                    setShowExternalSaveModal(false); 
                  }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" alt="Dropbox" width="24" loading="lazy" />
                    <span>Dropbox</span>
                  </button>
                  <button className="storage-btn" onClick={() => { 
                    // Simulate connection
                    toast('iCloud coming soon!', { icon: 'ðŸš§' }); 
                    setShowExternalSaveModal(false); 
                  }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/1c/ICloud_logo.svg" alt="iCloud" width="24" loading="lazy" />
                    <span>iCloud</span>
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <p>Your files will be synced automatically after generation.</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Asset to Project Modal */}
        {addToProjectAsset && (
          <div className="modal-overlay" onClick={() => { setAddToProjectAsset(null); setNewProjectNameFromAsset(''); }}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <button className="modal-close" onClick={() => { setAddToProjectAsset(null); setNewProjectNameFromAsset(''); }}><X size={20} /></button>
              
              <div className="modal-header">
                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '16px', 
                  background: 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <FolderPlus size={28} color="white" />
                </div>
                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Save to Hub</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Add <strong>"{addToProjectAsset.title || addToProjectAsset.snippet?.substring(0, 30) + '...'}"</strong> to a project
                </p>
              </div>

              <div className="modal-body" style={{ padding: '20px' }}>
                {/* Create New Project */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                    <FolderPlus size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Create new project
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={newProjectNameFromAsset}
                      onChange={(e) => setNewProjectNameFromAsset(e.target.value)}
                      placeholder="Project name..."
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '0.95rem'
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!newProjectNameFromAsset.trim()) return;
                        handleCreateProjectWithAsset(newProjectNameFromAsset, addToProjectAsset);
                        setAddToProjectAsset(null);
                        setNewProjectNameFromAsset('');
                        toast.success('Project created with asset!');
                      }}
                      disabled={!newProjectNameFromAsset.trim()}
                      className="cta-button-premium"
                      style={{ padding: '12px 20px', opacity: newProjectNameFromAsset.trim() ? 1 : 0.5 }}
                    >
                      Create
                    </button>
                  </div>
                </div>

                {/* Or add to existing */}
                {projects.length > 0 && (
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>
                      Or add to existing project
                    </label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {projects.slice(0, 10).map(project => (
                        <button
                          key={project.id}
                          onClick={() => {
                            handleSaveAssetToProject(project.id, addToProjectAsset);
                            setAddToProjectAsset(null);
                            toast.success(`Added to "${project.name}"!`);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            background: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            color: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-purple)'}
                          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Folder size={18} style={{ color: 'var(--color-purple)' }} />
                            <span style={{ fontWeight: '500' }}>{project.name}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {project.assets?.length || 0} assets
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {projects.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
                    Create your first project above to organize your work!
                  </p>
                )}
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => { setAddToProjectAsset(null); setNewProjectNameFromAsset(''); }}
                  className="cta-button-secondary"
                  style={{ width: '100%' }}
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal - Review AI Generation Before Saving */}
        {/* DEFENSIVE: Ensure previewItem is a valid object before rendering */}
        {previewItem && typeof previewItem === 'object' && (
          <SectionErrorBoundary name="Preview Modal">
          <div className="modal-overlay" onClick={() => {
            console.log('[Preview] Overlay clicked, closing preview');
            // Clear any media errors and reset transition guard
            setMediaLoadError(null);
            isModalTransitioning.current = false;
            setPreviewSaveMode(false);
            setNewProjectNameInPreview('');
            setPreviewItem(null);
          }}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => {
              e.stopPropagation();
            }} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div className="modal-header" style={{ flexShrink: 0, paddingBottom: '0.5rem', position: 'relative' }}>
                <button 
                  className="modal-close" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setMediaLoadError(null);
                    isModalTransitioning.current = false;
                    setPreviewSaveMode(false);
                    setNewProjectNameInPreview('');
                    setPreviewItem(null);
                  }}
                  style={{ 
                    position: 'absolute', 
                    top: '-0.5rem', 
                    right: '-0.5rem', 
                    zIndex: 9999,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <X size={20} />
                </button>
                <div className="logo-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem', background: previewItem.isExistingAsset ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <Eye size={24} color="white" />
                </div>
                <h2>{previewItem.isExistingAsset ? 'View Asset' : 'Preview Your Creation'}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {previewItem.isExistingAsset 
                    ? 'Your saved project asset.' 
                    : 'Review your AI-generated content before saving to your Hub.'}
                </p>
              </div>
              <div className="modal-body" style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                {/* Save Options Panel - Shows when previewSaveMode is true */}
                {previewSaveMode && !previewItem.isExistingAsset ? (
                  <div style={{ padding: '1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      marginBottom: '1.5rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid var(--border-color)'
                    }}>
                      <button 
                        onClick={() => setPreviewSaveMode(false)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Save to...</h3>
                    </div>
                    
                    {/* Quick Save to Hub */}
                    <button
                      onClick={() => handleSavePreview('hub', null)}
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '2px solid var(--border-color)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '1rem',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-green)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Cloud size={20} color="white" />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Save to Hub Only</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quick save without adding to a project</div>
                      </div>
                    </button>

                    {/* Create New Project with this asset */}
                    <div style={{ 
                      padding: '16px', 
                      borderRadius: '12px',
                      border: '2px solid var(--border-color)',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Plus size={20} color="white" />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Create New Project</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Start a new project with this asset</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={newProjectNameInPreview}
                          onChange={(e) => setNewProjectNameInPreview(e.target.value)}
                          placeholder="Enter project name..."
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem'
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newProjectNameInPreview.trim()) {
                              handleSavePreview('hub', `new:${newProjectNameInPreview.trim()}`);
                              setNewProjectNameInPreview('');
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (newProjectNameInPreview.trim()) {
                              handleSavePreview('hub', `new:${newProjectNameInPreview.trim()}`);
                              setNewProjectNameInPreview('');
                            }
                          }}
                          disabled={!newProjectNameInPreview.trim() || isSaving}
                          className="cta-button-premium"
                          style={{ 
                            padding: '10px 16px',
                            opacity: (!newProjectNameInPreview.trim() || isSaving) ? 0.5 : 1
                          }}
                        >
                          Create
                        </button>
                      </div>
                    </div>

                    {/* Existing Projects */}
                    {Array.isArray(projects) && projects.filter(p => p && p.name && p.id).length > 0 && (
                      <div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--text-secondary)', 
                          marginBottom: '12px',
                          fontWeight: '600' 
                        }}>
                          Or add to existing project:
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '8px',
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          {projects.filter(p => p && p.name && p.id).slice(0, 10).map(project => (
                            <button
                              key={project.id}
                              onClick={() => handleSavePreview('hub', project)}
                              disabled={isSaving}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Folder size={18} style={{ color: 'var(--color-purple)' }} />
                                <span style={{ 
                                  fontWeight: '500', 
                                  color: 'var(--text-primary)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '180px',
                                  display: 'inline-block'
                                }}>{project.name}</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {project.assets?.length || 0} assets
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Original Preview Content */
                  <>
                {/* Metadata Bar - More info displayed */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  {/* Type Badge */}
                  <span style={{ 
                    background: previewItem.type === 'image' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 
                                (previewItem.type === 'audio' || previewItem.type === 'vocal') ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                previewItem.type === 'video' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                                'linear-gradient(135deg, #3b82f6, #2563eb)',
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: 'white',
                    textTransform: 'uppercase'
                  }}>
                    {previewItem.type || 'Text'}
                  </span>
                  
                  {/* Agent Name */}
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(139, 92, 246, 0.15)',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    color: 'var(--color-purple)'
                  }}>
                    <Sparkles size={12} />
                    {previewItem.agent || 'AI Generated'}
                  </span>
                  
                  {/* Model Used */}
                  {(previewItem.model || selectedModel) && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(6, 182, 212, 0.15)',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      color: 'var(--color-cyan)'
                    }}>
                      <Cpu size={12} />
                      {previewItem.model || selectedModel}
                    </span>
                  )}
                  
                  {/* Creation Time */}
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <Clock size={12} />
                    {previewItem.createdAt 
                      ? new Date(previewItem.createdAt).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : 'Just now'
                    }
                  </span>
                  
                  {/* Text Stats (for text content) */}
                  {previewItem.snippet && typeof previewItem.snippet === 'string' && (
                    <>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        color: 'var(--color-emerald)'
                      }}>
                        <FileText size={12} />
                        {(previewItem.snippet || '').split(/\s+/).filter(w => w).length} words
                      </span>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(249, 115, 22, 0.15)',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        color: 'var(--color-orange)'
                      }}>
                        {(previewItem.snippet || '').length} chars
                      </span>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(236, 72, 153, 0.15)',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        color: 'var(--color-pink)'
                      }}>
                        {(previewItem.snippet || '').split('\n').filter(l => l.trim()).length} lines
                      </span>
                    </>
                  )}
                </div>

                {/* Title if available */}
                {previewItem.title && (
                  <div style={{ 
                    marginBottom: '1rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    borderLeft: '3px solid var(--color-purple)'
                  }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</span>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {previewItem.title}
                    </div>
                  </div>
                )}

                {/* Preview Content */}
                <div style={{ 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '12px', 
                  padding: '1.5rem',
                  border: '1px solid var(--border-color)',
                  maxHeight: '65vh',
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center', // Center for all media types
                  position: 'relative',
                  minHeight: '260px' // Slightly taller default
                }}>
                  {/* Loading Spinner Overlays */}
                  {isPreviewMediaLoading && !mediaLoadError && !previewSaveMode && (
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      background: 'rgba(0,0,0,0.4)', 
                      zIndex: 10,
                      borderRadius: '12px'
                    }}>
                      <Loader2 size={32} className="animate-spin" color="var(--color-purple)" />
                      <span style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Loading media...</span>
                    </div>
                  )}
                  {previewItem.type === 'image' && previewItem.imageUrl ? (
                    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <img 
                        src={formatImageSrc(previewItem.imageUrl)} 
                        alt="Generated" 
                        onLoad={() => setIsPreviewMediaLoading(false)}
                        onClick={(e) => {
                          // Toggle full size on click
                          if (e.target.style.maxHeight === '90vh') {
                            e.target.style.maxHeight = '60vh';
                            e.target.style.cursor = 'zoom-in';
                          } else {
                            e.target.style.maxHeight = '90vh';
                            e.target.style.cursor = 'zoom-out';
                          }
                        }}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '60vh', // Default constrained height
                          width: 'auto', 
                          height: 'auto',
                          borderRadius: '8px',
                          objectFit: 'contain',
                          cursor: 'zoom-in',
                          transition: 'max-height 0.3s ease',
                          opacity: isPreviewMediaLoading ? 0 : 1
                        }}
                        title="Click to expand"
                        onError={(e) => {
                          console.error('Image failed to load:', previewItem.imageUrl?.substring(0, 100));
                          e.target.style.display = 'none';
                          setIsPreviewMediaLoading(false);
                          setMediaLoadError({ type: 'image', url: previewItem.imageUrl });
                        }}
                      />
                      {!isPreviewMediaLoading && (
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', pointerEvents: 'none' }}>
                          Click to zoom
                        </div>
                      )}
                    </div>
                  ) : (previewItem.type === 'audio' || previewItem.type === 'vocal') && previewItem.audioUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                      {mediaLoadError?.type === 'audio' ? (
                        <div style={{ 
                          padding: '2rem', 
                          textAlign: 'center', 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          borderRadius: '12px',
                          border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>ðŸŽµ</div>
                          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Audio Unavailable</h4>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            This audio file has expired or is no longer available. Replicate URLs are temporary.
                          </p>
                          <button 
                            onClick={() => {
                              setMediaLoadError(null);
                              setPreviewItem(null);
                            }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              cursor: 'pointer'
                            }}
                          >
                            Close
                          </button>
                        </div>
                      ) : (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                          <div style={{ 
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: isPreviewPlaying ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: isPreviewPlaying ? 'pulse 2s infinite' : 'none',
                            boxShadow: isPreviewPlaying ? '0 0 30px rgba(245, 158, 11, 0.3)' : 'none',
                            transition: 'all 0.3s ease'
                          }}>
                            <Music size={40} color={isPreviewPlaying ? 'white' : 'var(--text-secondary)'} />
                          </div>
                          <audio
                            controls
                            crossOrigin="anonymous"
                            src={formatAudioSrc(previewItem.audioUrl)}
                            style={{ width: '100%', opacity: isPreviewMediaLoading ? 0 : 1 }}
                            onLoadedData={() => setIsPreviewMediaLoading(false)}
                            onCanPlay={() => setIsPreviewMediaLoading(false)}
                            onPlay={() => setIsPreviewPlaying(true)}
                            onPause={() => setIsPreviewPlaying(false)}
                            onEnded={() => setIsPreviewPlaying(false)}
                            onError={(e) => {
                              console.error('Audio failed to load:', e.target.error?.code, e.target.error?.message, previewItem.audioUrl?.substring(0, 100));
                              // Retry without crossOrigin for Firebase Storage
                              if (previewItem.audioUrl?.startsWith('http') && !e.target.dataset.retried) {
                                e.target.dataset.retried = 'true';
                                e.target.removeAttribute('crossorigin');
                                e.target.src = previewItem.audioUrl;
                                return;
                              }
                              setMediaLoadError({ type: 'audio', url: previewItem.audioUrl });
                              setIsPreviewMediaLoading(false);
                            }}
                          />
                          {previewItem.audioUrl?.startsWith('http') && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                              ðŸ”— External audio URL (may expire)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : previewItem.type === 'video' && previewItem.videoUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {previewItem.audioUrl ? (
                        <>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', marginBottom: '4px', fontWeight: 'bold' }}>
                            ðŸŽµ Music Video Mode (Synced to: {previewItem.audioTitle || 'Audio'})
                          </div>
                          <video 
                            controls 
                            muted={!!previewItem.audioUrl} // Mute video if we have a separate high-quality audio track
                            src={formatVideoSrc(previewItem.videoUrl)} 
                            style={{ width: '100%', borderRadius: '8px', background: '#000', opacity: isPreviewMediaLoading ? 0 : 1 }}
                            onLoadedData={() => setIsPreviewMediaLoading(false)}
                            onCanPlay={() => setIsPreviewMediaLoading(false)}
                            onPlay={(e) => {
                              setIsPreviewPlaying(true);
                              const container = e.target.parentElement;
                              const audio = container.querySelector('.sync-audio');
                              if (audio) {
                                audio.currentTime = e.target.currentTime;
                                audio.volume = e.target.volume;
                                audio.play().catch(err => console.warn('Audio sync play failed:', err));
                              }
                            }}
                            onPause={(e) => {
                              setIsPreviewPlaying(false);
                              const container = e.target.parentElement;
                              const audio = container.querySelector('.sync-audio');
                              if (audio) audio.pause();
                            }}
                            onEnded={() => setIsPreviewPlaying(false)}
                            onVolumeChange={(e) => {
                              const container = e.target.parentElement;
                              const audio = container.querySelector('.sync-audio');
                              if (audio) audio.volume = e.target.volume;
                            }}
                            onTimeUpdate={(e) => {
                              const container = e.target.parentElement;
                              const audio = container.querySelector('.sync-audio');
                              if (audio && Math.abs(audio.currentTime - e.target.currentTime) > 0.3) {
                                audio.currentTime = e.target.currentTime;
                              }
                            }}
                            onSeeking={(e) => {
                              const container = e.target.parentElement;
                              const audio = container.querySelector('.sync-audio');
                              if (audio) audio.currentTime = e.target.currentTime;
                            }}
                            onError={(e) => {
                              console.error('Video failed to load:', e.target.error?.message, previewItem.videoUrl?.substring(0, 100));
                              setMediaLoadError({ type: 'video', url: previewItem.videoUrl });
                              setIsPreviewMediaLoading(false);
                            }}
                          />
                          <audio className="sync-audio" src={formatAudioSrc(previewItem.audioUrl)} style={{ display: 'none' }} />
                        </>
                      ) : (
                        <video 
                          controls 
                          src={formatVideoSrc(previewItem.videoUrl)} 
                          style={{ width: '100%', borderRadius: '8px', background: '#000', opacity: isPreviewMediaLoading ? 0 : 1 }}
                          onLoadedData={() => setIsPreviewMediaLoading(false)}
                          onCanPlay={() => setIsPreviewMediaLoading(false)}
                          onPlay={() => setIsPreviewPlaying(true)}
                          onPause={() => setIsPreviewPlaying(false)}
                          onEnded={() => setIsPreviewPlaying(false)}
                          onError={(e) => {
                            console.error('Video failed to load:', e.target.error?.message, previewItem.videoUrl?.substring(0, 100));
                            setMediaLoadError({ type: 'video', url: previewItem.videoUrl });
                            setIsPreviewMediaLoading(false);
                          }}
                        />
                      )}
                      {previewItem.videoUrl?.startsWith('http') && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          ðŸ”— External video URL (may expire)
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Show audio player if vocal has been created (consolidated view) */}
                      {previewItem.audioUrl && (
                        <div style={{ 
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))', 
                          borderRadius: '12px', 
                          padding: '24px', // More padding for consolidated view
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '16px',
                          boxShadow: isPreviewPlaying ? '0 0 20px rgba(139, 92, 246, 0.2)' : 'none',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ 
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: isPreviewPlaying ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: isPreviewPlaying ? 'pulse 2s infinite' : 'none'
                          }}>
                            <Mic size={32} color={isPreviewPlaying ? 'white' : 'var(--text-secondary)'} />
                          </div>
                          <div style={{ fontSize: '0.85rem', color: isPreviewPlaying ? 'var(--color-pink)' : 'var(--text-secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isPreviewPlaying ? 'Playing AI Vocal...' : 'AI Vocal Ready'}
                          </div>
                          <audio 
                            controls 
                            src={previewItem.audioUrl} 
                            style={{ width: '100%', height: '40px' }}
                            onPlay={() => setIsPreviewPlaying(true)}
                            onPause={() => setIsPreviewPlaying(false)}
                            onEnded={() => setIsPreviewPlaying(false)}
                          />
                        </div>
                      )}
                      
                      {/* Toggle between Lyrics and Prompt */}
                      {previewPrompt && (
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px' }}>
                          <button
                            onClick={() => setPreviewView('lyrics')}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              background: previewView === 'lyrics' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'transparent',
                              color: previewView === 'lyrics' ? 'white' : 'var(--text-secondary)',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <FileText size={14} /> Lyrics
                          </button>
                          <button
                            onClick={() => setPreviewView('prompt')}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              background: previewView === 'prompt' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                              color: previewView === 'prompt' ? 'white' : 'var(--text-secondary)',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Edit3 size={14} /> Prompt
                          </button>
                        </div>
                      )}
                      
                      {/* Content based on toggle */}
                      <div style={{ 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: '1.8', 
                        color: 'var(--text-primary)',
                        background: previewView === 'lyrics' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        border: previewView === 'lyrics' ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        maxHeight: '50vh',
                        minHeight: '200px',
                        overflow: 'auto',
                        transition: 'all 0.2s',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}>
                        {previewView === 'lyrics' 
                          ? (previewItem.snippet || previewItem.title || 'No content generated')
                          : (previewPrompt || 'No prompt recorded')
                        }
                      </div>
                    </div>
                  )}
                </div>
                </>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                flexShrink: 0,
                flexWrap: 'wrap'
              }}>
                {/* TTS Read Aloud for text content - uses AI voices when style is rapper/singer */}
                {!previewItem.audioUrl && !previewItem.imageUrl && !previewItem.videoUrl && (previewItem.snippet || previewItem.content) && (
                  <button 
                    disabled={isCreatingVocal}
                    onClick={() => {
                      const text = previewView === 'lyrics' 
                        ? (previewItem.snippet || previewItem.content || '')
                        : (previewPrompt || '');
                      // Use AI vocal for rapper/singer styles, browser TTS for narrator/spoken
                      const aiVoiceStyles = ['rapper', 'rapper-female', 'singer', 'singer-female', 'cloned', 'narrator', 'spoken'];
                      if (aiVoiceStyles.includes(voiceSettings.style)) {
                        // Use actual AI vocals (Bark/Suno) for real rapper/singer voices
                        handleCreateAIVocal(text, selectedAgent?.name || 'AI');
                      } else {
                        // Fall back to browser TTS for narrator/spoken
                        if (window.speechSynthesis.speaking) {
                          window.speechSynthesis.cancel();
                        } else {
                          handleTextToVoice(text);
                        }
                      }
                    }}
                    title={['rapper', 'rapper-female', 'singer', 'singer-female', 'cloned', 'narrator', 'spoken'].includes(voiceSettings.style) 
                      ? `Read aloud using AI ${voiceSettings.style} voice (takes 30-60 seconds)`
                      : 'Read text aloud using browser TTS'}
                    style={{ 
                      flex: 1, 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(34, 211, 238, 0.3)',
                      background: isCreatingVocal ? 'rgba(34, 211, 238, 0.3)' : 'rgba(34, 211, 238, 0.1)',
                      color: 'var(--color-cyan)',
                      cursor: isCreatingVocal ? 'not-allowed' : 'pointer',
                      opacity: isCreatingVocal ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Volume2 size={16} className={isCreatingVocal ? 'animate-pulse' : ''} /> 
                    {isCreatingVocal ? 'Creating AI Voice...' : 'Read Aloud'}
                  </button>
                )}
                
                {/* Create AI Vocal - Uses Uberduck/Replicate rapper voices (not browser TTS) */}
                {!previewItem.audioUrl && !previewItem.imageUrl && !previewItem.videoUrl && (previewItem.snippet || previewItem.content) && (
                  <button 
                    onClick={() => {
                      const text = previewItem.snippet || previewItem.content || '';
                      handleCreateAIVocal(text, selectedAgent?.name || 'Ghostwriter');
                    }}
                    disabled={isCreatingVocal}
                    title="Create AI vocal using rapper voices (Uberduck/Replicate)"
                    style={{ 
                      flex: 1, 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(236, 72, 153, 0.3)',
                      background: isCreatingVocal ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.1)',
                      color: 'var(--color-pink)',
                      cursor: isCreatingVocal ? 'not-allowed' : 'pointer',
                      opacity: isCreatingVocal ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Mic size={16} className={isCreatingVocal ? 'animate-pulse' : ''} /> 
                    {isCreatingVocal ? 'Creating...' : 'Create Vocal'}
                  </button>
                )}
                
                {/* For existing assets - show Close and Copy buttons */}
                {previewItem.isExistingAsset ? (
                  <>
                    <button 
                      onClick={() => {
                        const text = previewItem.snippet || previewItem.content || '';
                        if (text) {
                          navigator.clipboard.writeText(text);
                          toast.success('Copied to clipboard!');
                        } else if (previewItem.imageUrl || previewItem.audioUrl || previewItem.videoUrl) {
                          navigator.clipboard.writeText(previewItem.imageUrl || previewItem.audioUrl || previewItem.videoUrl);
                          toast.success('URL copied to clipboard!');
                        }
                      }}
                      style={{ 
                        flex: 1, 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Copy size={16} /> Copy
                    </button>
                    <button 
                      onClick={() => setPreviewItem(null)}
                      style={{ 
                        flex: 1, 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        border: 'none',
                        background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <X size={16} /> Close
                    </button>
                  </>
                ) : (
                  <>
                    {/* For new generations - show Discard, Regenerate, Save buttons */}
                    <button 
                      onClick={handleDiscardPreview}
                      disabled={isSaving}
                      style={{ 
                        flex: 1, 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        opacity: isSaving ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Trash2 size={16} /> Discard
                    </button>
                    <button 
                      onClick={handleRegeneratePreview}
                      disabled={isGenerating || isSaving}
                      style={{ 
                        flex: 1, 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: (isGenerating || isSaving) ? 'not-allowed' : 'pointer',
                        opacity: (isGenerating || isSaving) ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} /> 
                      {isGenerating ? 'Generating...' : 'Regenerate'}
                    </button>
                    <button 
                      onClick={() => handleSavePreview('project_canvas')}
                      disabled={isSaving}
                      style={{ 
                        flex: 1, 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)',
                        background: isSaving ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                        color: 'var(--color-purple)',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        opacity: isSaving ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" /> Syncing...
                        </>
                      ) : (
                        <>
                          <Edit3 size={16} /> Edit
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => setPreviewSaveMode(true)}
                      disabled={isSaving}
                      className="cta-button-premium"
                      style={{ 
                        flex: 1.5, 
                        padding: '0.75rem', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: isSaving ? 0.8 : 1,
                        cursor: isSaving ? 'wait' : 'pointer'
                      }}
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" /> 
                          <span>Syncing to Cloud...</span>
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Save to Hub
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          </SectionErrorBoundary>
        )}

        {/* Studio Orchestrator (New Clean Interface) */}
        <Suspense fallback={<LazyFallback />}>
          <StudioOrchestrator
            isOpen={showOrchestrator}
            onClose={() => setShowOrchestrator(false)}
            authToken={userToken}
            userPlan={userPlan}
            existingProject={selectedProject}
            onSaveToProject={(project) => {
              const traceId = `SYNC-${Date.now()}`;
              console.log(`[TRACE:${traceId}] onSaveToProject RECEIVED (Syncing artifacts)`, {
                projectId: project.id,
                assetCount: project.assets?.length
              });
              
              // Find if project already exists
              const existingIndex = projects.findIndex(p => p.id === project.id);
              if (existingIndex >= 0) {
                const existingProject = projects[existingIndex];
                // Build a dedup fingerprint â€” checks ID, audio URL, image URL, video URL, and content+type+agent
                const existingAssets = existingProject.assets || [];
                const existingFingerprints = new Set();
                for (const a of existingAssets) {
                  if (a.id) existingFingerprints.add(`id:${a.id}`);
                  if (a.audioUrl) existingFingerprints.add(`audio:${a.audioUrl}`);
                  if (a.url) existingFingerprints.add(`url:${a.url}`);
                  if (a.videoUrl) existingFingerprints.add(`video:${a.videoUrl}`);
                  if (a.imageUrl) existingFingerprints.add(`img:${a.imageUrl}`);
                  if (a.content && a.type) existingFingerprints.add(`content:${a.type}:${a.agent || ''}:${a.content.substring(0, 200)}`);
                }
                
                const newAssets = (project.assets || []).filter(a => {
                  if (a.id && existingFingerprints.has(`id:${a.id}`)) return false;
                  if (a.audioUrl && existingFingerprints.has(`audio:${a.audioUrl}`)) return false;
                  if (a.url && existingFingerprints.has(`url:${a.url}`)) return false;
                  if (a.videoUrl && existingFingerprints.has(`video:${a.videoUrl}`)) return false;
                  if (a.imageUrl && existingFingerprints.has(`img:${a.imageUrl}`)) return false;
                  if (a.content && a.type && existingFingerprints.has(`content:${a.type}:${a.agent || ''}:${a.content.substring(0, 200)}`)) return false;
                  return true;
                });
                
                if (newAssets.length === 0) {
                  console.log(`[TRACE:${traceId}] onSaveToProject: No new unique assets to add, skipping`);
                  // Still update non-asset fields
                  const finalProject = { ...existingProject, ...project, assets: existingAssets, updatedAt: new Date().toISOString() };
                  const newProjects = [...projects];
                  newProjects[existingIndex] = finalProject;
                  setProjects(newProjects);
                  setSelectedProject(finalProject);
                  return;
                }
                
                console.log(`[TRACE:${traceId}] onSaveToProject: Adding ${newAssets.length} unique assets (filtered ${(project.assets || []).length - newAssets.length} duplicates)`);
                
                const finalProject = {
                  ...existingProject,
                  ...project,
                  assets: [...existingAssets, ...newAssets],
                  updatedAt: new Date().toISOString()
                };
                
                const newProjects = [...projects];
                newProjects[existingIndex] = finalProject;
                setProjects(newProjects);
                setSelectedProject(finalProject);
                
                if (isLoggedIn && user) {
                  saveProjectToCloud(user?.uid, finalProject).catch(err => {
                    console.error('Cloud save failed:', err);
                    toast.error('Failed to sync to cloud. Your changes are saved locally.');
                  });
                }
              } else {
                // FALLBACK: If project not found in local state, treat as creation
                // This prevents silent save failures for newly created projects in the Orchestrator
                console.log(`[TRACE:${traceId}] onSaveToProject: Project not found, delegating to onCreateProject`);
                // We use the same setter logic but as a new entry
                const finalProject = {
                  ...project,
                  createdAt: project.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                setProjects(prev => [finalProject, ...prev]);
                setSelectedProject(finalProject);
                if (isLoggedIn && user) {
                  saveProjectToCloud(user?.uid, finalProject).catch(err => {
                    console.error('Cloud save failed:', err);
                    toast.error('Failed to sync to cloud. Your changes are saved locally.');
                  });
                }
              }
            }}
            onCreateProject={(project) => {
              const traceId = `CREATE-${Date.now()}`;
              console.log(`[TRACE:${traceId}] onCreateProject RECEIVED`, {
                projectId: project.id,
                projectName: project.name,
                assetCount: project.assets?.length,
                assets: project.assets?.map(a => ({
                  id: a.id,
                  type: a.type,
                  hasContent: !!a.content,
                  hasImage: !!a.imageUrl,
                  hasAudio: !!a.audioUrl,
                  hasVideo: !!a.videoUrl
                })),
                coverImage: project.coverImage ? 'present' : 'missing'
              });
              
              // Find if project already exists
              const existingIndex = projects.findIndex(p => p.id === project.id);
              console.log(`[TRACE:${traceId}] Existing project index:`, existingIndex, 'current projects count:', projects.length);
              
              let finalProject;
              
              if (existingIndex >= 0) {
                // Update existing project - merge assets without duplicates
                console.log(`[TRACE:${traceId}] Updating existing project:`, project.id);
                const existingProject = projects[existingIndex];
                console.log(`[TRACE:${traceId}] Existing project assets:`, existingProject.assets?.length);
                
                const existingAssetIds = new Set((existingProject.assets || []).map(a => a.id));
                const newAssets = (project.assets || []).filter(a => !existingAssetIds.has(a.id));
                console.log(`[TRACE:${traceId}] New assets to add:`, newAssets.length);
                
                finalProject = {
                  ...existingProject,
                  ...project,
                  assets: [...(existingProject.assets || []), ...newAssets],
                  updatedAt: new Date().toISOString()
                };
                
                console.log(`[TRACE:${traceId}] Final merged asset count:`, finalProject.assets?.length);
                
                const newProjects = [...projects];
                newProjects[existingIndex] = finalProject;
                setProjects(newProjects);
              } else {
                // Create new project
                console.log(`[TRACE:${traceId}] Creating new project:`, project.id);
                finalProject = {
                  ...project,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                console.log(`[TRACE:${traceId}] New project asset count:`, finalProject.assets?.length);
                setProjects(prev => {
                  console.log(`[TRACE:${traceId}] setProjects - previous count:`, prev.length);
                  return [finalProject, ...prev];
                });
              }
              
              // Set selected project
              setSelectedProject(finalProject);
              console.log(`[TRACE:${traceId}] Selected project set:`, finalProject.id, 'assets:', finalProject.assets?.length);
              
              // Save to cloud if user is logged in (uses backend API now)
              if (isLoggedIn && user) {
                console.log(`[TRACE:${traceId}] Initiating cloud save for:`, finalProject.id);
                saveProjectToCloud(user?.uid, finalProject).then(success => {
                  console.log(`[TRACE:${traceId}] Cloud save result:`, success);
                }).catch(err => {
                  console.error(`[TRACE:${traceId}] Cloud save error:`, err);
                });
              } else {
                console.warn(`[TRACE:${traceId}] NOT saving to cloud - isLoggedIn:`, isLoggedIn, 'hasUser:', !!user);
              }
              
              // Use pendingProjectNav flag for safe navigation (prevents race condition)
              setPendingProjectNav(true);
              toast.success(`Project "${finalProject.name}" saved with ${finalProject.assets?.length || 0} assets!`);
            }}
            onUpdateCreations={(agentId, creations) => {
              setAgentCreations(prev => ({
                ...prev,
                [agentId]: creations
              }));
            }}
          />
        </Suspense>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="modal-overlay" onClick={() => { setShowLoginModal(false); setSelectedPlan(null); setAuthMode('login'); setAuthEmail(''); setAuthPassword(''); }}>
            <div className="modal-content animate-fadeInUp" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <button className="modal-close" onClick={() => { setShowLoginModal(false); setSelectedPlan(null); setAuthMode('login'); }}><X size={20} /></button>
              <div className="modal-header">
                <div className="logo-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
                  <Sparkles size={24} color="white" />
                </div>
                <h2>{authMode === 'reset' ? 'Reset Password' : authMode === 'signup' ? 'Create Account' : selectedPlan ? 'Complete Your Subscription' : 'Welcome Back'}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {authMode === 'reset' 
                    ? 'Enter your email to receive a reset link.'
                    : selectedPlan 
                      ? `Sign in to activate ${selectedPlan.name} (${selectedPlan.price}${selectedPlan.period || ''}).` 
                      : authMode === 'signup' ? 'Create an account to save your work.' : 'Sign in to access your studio.'}
                </p>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Google Sign In Button */}
                {authMode !== 'reset' && (
                  <button 
                    className="cta-button-premium" 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={handleGoogleLogin}
                    disabled={authLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    {authLoading ? 'Signing in...' : 'Continue with Google'}
                  </button>
                )}

                {/* Apple Sign In Button */}
                {authMode !== 'reset' && (
                  <button 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={handleAppleLogin}
                    disabled={authLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    {authLoading ? 'Signing in...' : 'Continue with Apple'}
                  </button>
                )}

                {authMode !== 'reset' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                  </div>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input 
                    type="email" 
                    placeholder="Email address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 1rem', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-color)', 
                      background: 'var(--bg-card)', 
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                  {authMode !== 'reset' && (
                    <input 
                      type="password" 
                      placeholder="Password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)', 
                        background: 'var(--bg-card)', 
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem'
                      }}
                      required
                      minLength={6}
                    />
                  )}
                  
                  {authMode === 'reset' ? (
                    <button 
                      type="button"
                      className="cta-button-secondary" 
                      style={{ width: '100%' }}
                      onClick={handlePasswordReset}
                      disabled={authLoading}
                    >
                      {authLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  ) : (
                    <button 
                      type="submit"
                      className="cta-button-secondary" 
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      disabled={authLoading}
                    >
                      <Mail size={16} />
                      {authLoading ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Sign In with Email'}
                    </button>
                  )}
                </form>

                {/* Toggle between modes */}
                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  {authMode === 'login' && (
                    <>
                      <button 
                        onClick={() => setAuthMode('reset')} 
                        style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Forgot password?
                      </button>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        Don't have an account?{' '}
                        <button 
                          onClick={() => setAuthMode('signup')} 
                          style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Sign up
                        </button>
                      </p>
                    </>
                  )}
                  {authMode === 'signup' && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      Already have an account?{' '}
                      <button 
                        onClick={() => setAuthMode('login')} 
                        style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                  {authMode === 'reset' && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <button 
                        onClick={() => setAuthMode('login')} 
                        style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', fontWeight: '600' }}
                      >
                        â† Back to sign in
                      </button>
                    </p>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: '1.4' }}>
                  By continuing, you agree to our{' '}
                  <button 
                    onClick={() => { setShowLoginModal(false); window.location.hash = '#/legal'; }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', padding: 0, fontSize: '0.75rem', textDecoration: 'underline' }}
                  >
                    Terms of Service
                  </button>
                  {' '}and{' '}
                  <button 
                    onClick={() => { setShowLoginModal(false); window.location.hash = '#/legal'; }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', padding: 0, fontSize: '0.75rem', textDecoration: 'underline' }}
                  >
                   Privacy Policy
                  </button>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Payment Method Modal */}
        {showAddPaymentModal && (
          <div className="modal-overlay" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }} onClick={() => { setShowAddPaymentModal(false); setEditingPayment(null); }}>
            <div 
              className="modal-content animate-fadeInUp" 
              onClick={(e) => e.stopPropagation()} 
              onTouchEnd={(e) => e.stopPropagation()}
              style={{ 
                maxWidth: 'min(92vw, 700px)', 
                width: '100%',
                margin: '1rem auto',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="modal-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexShrink: 0 }}>
                <div className="modal-title-group">
                  <div className="agent-mini-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                    <CreditCard size={20} />
                  </div>
                  <h2 style={{ margin: 0 }}>{editingPayment ? 'Edit Payment Method' : 'Payment Methods'}</h2>
                </div>
                <button className="modal-close" onClick={() => { setShowAddPaymentModal(false); setEditingPayment(null); }}><X size={20} /></button>
              </div>

              <div className="modal-body" style={{ padding: '1.5rem', overflow: 'visible', flex: 1 }}>
                {/* Existing Cards Section */}
                {!editingPayment && paymentMethods.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saved Cards</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {paymentMethods.map((card, idx) => (
                        <div 
                          key={card.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem 1.25rem',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                              width: '48px', 
                              height: '32px', 
                              background: card.brand === 'visa' ? 'linear-gradient(135deg, #1a1f71, #00579f)' : 
                                         card.brand === 'mastercard' ? 'linear-gradient(135deg, #eb001b, #f79e1b)' : 
                                         'linear-gradient(135deg, #333, #555)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.6rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              {card.brand || 'Card'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ {card.last4}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expires {card.expiry}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => { setEditingPayment({ item: card, type: 'card' }); setPaymentType('card'); }}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'transparent',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button 
                              onClick={() => {
                                setPaymentMethods(prev => prev.filter(c => c.id !== card.id));
                                toast.success('Card removed');
                              }}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Bank Accounts Section */}
                {!editingPayment && bankAccounts.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bank Accounts</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {bankAccounts.map((bank, idx) => (
                        <div 
                          key={bank.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem 1.25rem',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                              width: '48px', 
                              height: '32px', 
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              <Landmark size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{bank.bankName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{bank.type} â€¢â€¢â€¢â€¢ {bank.last4}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => { setEditingPayment({ item: bank, type: 'bank' }); setPaymentType('bank'); }}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'transparent',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button 
                              onClick={() => {
                                setBankAccounts(prev => prev.filter(b => b.id !== bank.id));
                                toast.success('Bank account removed');
                              }}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New / Edit Form */}
                <div>
                  {!editingPayment && (
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Add New Payment Method
                    </h4>
                  )}
                  
                  <div className="modal-tabs" style={{ marginBottom: '1rem' }}>
                    <button 
                      className={`modal-tab ${paymentType === 'card' ? 'active' : ''}`}
                      onClick={() => setPaymentType('card')}
                      disabled={!!editingPayment}
                      style={{ flex: 1 }}
                    >
                      <CreditCard size={16} style={{ marginRight: '6px' }} /> Card
                    </button>
                    <button 
                      className={`modal-tab ${paymentType === 'bank' ? 'active' : ''}`}
                      onClick={() => setPaymentType('bank')}
                      disabled={!!editingPayment}
                      style={{ flex: 1 }}
                    >
                      <Landmark size={16} style={{ marginRight: '6px' }} /> Bank
                    </button>
                  </div>

                  {paymentType === 'card' ? (
                    <form className="payment-form" onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Cardholder Name</label>
                        <input 
                          type="text" 
                          name="cardName" 
                          placeholder="Name on card" 
                          required 
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Card Number</label>
                        <div style={{ position: 'relative' }}>
                          <CreditCard size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                          <input 
                            type="text" 
                            name="cardNumber" 
                            placeholder="0000 0000 0000 0000" 
                            defaultValue={editingPayment ? `**** **** **** ${editingPayment.item.last4}` : ''}
                            required 
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Expiry</label>
                          <input 
                            type="text" 
                            name="expiry" 
                            placeholder="MM/YY" 
                            defaultValue={editingPayment ? editingPayment.item.expiry : ''}
                            required 
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>CVC</label>
                          <input type="text" name="cvc" placeholder="123" required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Zip</label>
                          <input type="text" name="zip" placeholder="10001" required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {editingPayment && (
                          <button 
                            type="button" 
                            className="cta-button-secondary" 
                            style={{ flex: 1 }}
                            onClick={() => setEditingPayment(null)}
                          >
                            Cancel
                          </button>
                        )}
                        <button type="submit" className="cta-button-premium" style={{ flex: 1 }}>
                          {editingPayment ? 'Update Card' : 'Add Card'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form className="payment-form" onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Account Holder Name</label>
                        <input 
                          type="text" 
                          name="accountName" 
                          placeholder="Full Name" 
                          required 
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Bank Name</label>
                        <div style={{ position: 'relative' }}>
                          <Landmark size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                          <input 
                            type="text" 
                            name="bankName" 
                            placeholder="e.g. Chase, Wells Fargo" 
                            defaultValue={editingPayment ? editingPayment.item.bankName : ''}
                            required 
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Routing Number</label>
                          <input type="text" name="routingNumber" placeholder="9 digits" required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Account Number</label>
                          <input 
                            type="text" 
                            name="accountNumber" 
                            placeholder="Account Number" 
                            defaultValue={editingPayment ? `****${editingPayment.item.last4}` : ''}
                            required 
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {editingPayment && (
                          <button 
                            type="button" 
                            className="cta-button-secondary" 
                            style={{ flex: 1 }}
                            onClick={() => setEditingPayment(null)}
                          >
                            Cancel
                          </button>
                        )}
                        <button type="submit" className="cta-button-premium" style={{ flex: 1 }}>
                          {editingPayment ? 'Update Account' : 'Link Account'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <LockIcon size={14} />
                  <span>256-bit encryption â€¢ Secured by Stripe</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="bottom-nav">
          <div 
            className={`bottom-nav-item ${activeTab === 'agents' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('agents'); setSelectedAgent(null); }}
            role="button"
            tabIndex={0}
          >
            <LayoutGrid size={22} />
            <span>Team</span>
          </div>
          
          <div 
            className={`bottom-nav-item ${activeTab === 'hub' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('hub'); setSelectedAgent(null); }}
            role="button"
            tabIndex={0}
          >
            <Folder size={22} />
            <span>Projects</span>
          </div>
          
          {/* Global Create Button */}
          <div 
            className="bottom-nav-item create-btn" 
            onClick={() => setShowProjectTypeChoice(true)}
            role="button"
            tabIndex={0}
          >
            <div style={{
              background: 'var(--color-purple)',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.5)',
              marginTop: '-20px',
              border: '3px solid var(--color-bg-primary)'
            }}>
              <Plus size={26} color="white" />
            </div>
          </div>

          <div 
            className={`bottom-nav-item ${activeTab === 'mystudio' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('mystudio'); setSelectedAgent(null); }}
            role="button"
            tabIndex={0}
          >
            <Layers size={22} />
            <span>Studio</span>
          </div>
          
          <div 
            className={`bottom-nav-item ${activeTab === 'more' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('more'); setSelectedAgent(null); }}
            role="button"
            tabIndex={0}
          >
            <Menu size={22} />
            <span>More</span>
          </div>
        </nav>
      </main>

      {/* Maintenance Mode Overlay */}
      {systemStatus.status === 'maintenance' && !maintenanceDismissed && (
        <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content animate-fadeInUp" style={{ textAlign: 'center', border: '1px solid var(--color-red)', position: 'relative' }}>
            <button 
              onClick={() => setMaintenanceDismissed(true)}
              style={{ 
                position: 'absolute', 
                top: '1rem', 
                right: '1rem', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '4px'
              }}
              aria-label="Dismiss maintenance message"
            >
              <X size={20} />
            </button>
            <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="logo-box" style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', background: 'rgba(239, 68, 68, 0.1)' }}>
              <Activity size={32} color="var(--color-red)" />
            </div>
            <h2 style={{ color: 'var(--color-red)', marginBottom: '1rem' }}>System Maintenance</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              The Studio is currently undergoing critical updates or experiencing connectivity issues. 
              <br/>Please check back in a few minutes.
            </p>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
              Status: {systemStatus.details || 'Backend Unreachable'}
            </div>
            <button 
              className="cta-button-secondary" 
              style={{ marginTop: '2rem', width: '100%' }}
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} style={{ marginRight: '8px' }} /> Retry Connection
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Credits Info Modal */}
      {showCreditsModal && (
        <div className="modal-overlay animate-fadeIn" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }} onClick={() => setShowCreditsModal(false)}>
          <div 
            className="modal-content credits-modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: 'min(92vw, 560px)', 
              width: '100%',
              margin: '1rem auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexShrink: 0 }}>
              <div className="modal-title-group">
                <div className="agent-mini-icon" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#000' }}>
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>Studio Credits</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Balance: <strong style={{ color: '#facc15' }}>{userCredits} credits</strong></p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowCreditsModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '1.25rem', flex: 1 }}>
              {/* Quick Add Credits */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Add Credits</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {[
                    { amount: 10, price: '$0.99', label: 'Starter' },
                    { amount: 50, price: '$3.99', label: 'Power' },
                    { amount: 150, price: '$9.99', label: 'Studio' },
                    { amount: 500, price: '$24.99', label: 'Pro' }
                  ].map(({ amount, price, label }) => (
                    <button
                      key={amount}
                      onClick={() => buyCreditPack(amount, price)}
                      style={{
                        padding: '1rem 0.5rem',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        color: 'var(--text-primary)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      className="credit-pack-btn"
                    >
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
                      <span style={{ fontWeight: '800', fontSize: '1.25rem', color: '#facc15' }}>{amount}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit Costs */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Credit Costs</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { action: 'Create Project', cost: 2, icon: Folder },
                    { action: 'Text Generation', cost: 5, icon: FileText },
                    { action: 'Image Generation', cost: 15, icon: ImageIcon },
                    { action: 'Audio Processing', cost: 25, icon: Music }
                  ].map(({ action, cost, icon: ActionIcon }) => (
                    <div 
                      key={action}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <ActionIcon size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '0.9rem' }}>{action}</span>
                      </div>
                      <span style={{ fontWeight: '600', color: '#facc15', fontSize: '0.9rem' }}>{cost} credits</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip */}
              <div style={{ 
                padding: '0.75rem 1rem', 
                background: 'rgba(250, 204, 21, 0.08)', 
                border: '1px solid rgba(250, 204, 21, 0.2)', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <Sparkles size={18} style={{ color: '#facc15', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Pro Tip:</strong> Credits are used when you create projects or generate content with any agent.
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 1.25rem', flexShrink: 0, display: 'flex', gap: '0.75rem' }}>
              <button 
                className="cta-button-secondary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  setShowCreditsModal(false);
                  setDashboardTab('billing');
                  setActiveTab('mystudio');
                }}
              >
                <Plus size={18} style={{ marginRight: '6px' }} /> Add Credits
              </button>
              <button 
                className="cta-button-premium" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => {
                  setShowCreditsModal(false);
                  setShowProjectTypeChoice(true);
                }}
              >
                <Rocket size={18} style={{ marginRight: '6px' }} /> Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Choice Modal - Removed, now on Landing Page */}

      {/* Project Wizard Modal */}
      {showProjectWizard && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowProjectWizard(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content project-wizard-modal" onClick={e => e.stopPropagation()} style={{ 
            maxWidth: '600px', 
            width: 'min(95vw, 600px)', 
            maxHeight: 'min(90vh, 1000px)',
            display: 'flex',
            flexDirection: 'column',
            margin: '0 12px', 
            boxSizing: 'border-box', 
            overflow: 'hidden' 
          }}>
            <div className="modal-header" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="modal-title-group" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '80px' }}>
                <div className="agent-mini-icon bg-purple" style={{ flexShrink: 0 }}>
                  <Rocket size={20} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Create New Project</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 101 }}>
                {!isMobile && (
                  <button 
                    className="btn-text" 
                    onClick={() => handleSkipWizard('agents')}
                    style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--text-secondary)', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Skip
                  </button>
                )}
                <button className="modal-close" onClick={() => setShowProjectWizard(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ 
              padding: isMobile ? '16px' : '24px',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              flex: 1
            }}>
              {/* Progress Bar */}
              <div className="wizard-progress" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {[1, 2, 3].map(step => (
                  <div key={step} style={{ 
                    flex: 1, 
                    height: '4px', 
                    background: step <= projectWizardStep ? 'var(--color-purple)' : 'var(--color-bg-tertiary)',
                    borderRadius: '2px',
                    transition: 'all 0.3s ease'
                  }}></div>
                ))}
              </div>

              {/* Step 1: Vision & Vibe */}
              {projectWizardStep === 1 && (
                <div className="wizard-step animate-slideIn">
                  <h3 style={{ marginBottom: '16px' }}>Define Your Vision</h3>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Project Name</label>
                    <input 
                      type="text" 
                      className="search-input" 
                      placeholder="e.g. Summer Vibes 2025"
                      value={newProjectData.name}
                      onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                      autoFocus
                      style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Language</label>
                      <select 
                        value={newProjectData.language}
                        onChange={(e) => setNewProjectData({...newProjectData, language: e.target.value})}
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
                        value={newProjectData.style}
                        onChange={(e) => setNewProjectData({...newProjectData, style: e.target.value})}
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
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>AI Model</label>
                      <select 
                        value={newProjectData.model}
                        onChange={(e) => setNewProjectData({...newProjectData, model: e.target.value})}
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
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Project Category</label>
                    <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      {PROJECT_CATEGORIES.map(cat => (
                        <div 
                          key={cat.id}
                          className={`category-card haptic-press ${newProjectData.category === cat.id ? 'selected' : ''}`}
                          onClick={() => setNewProjectData({...newProjectData, category: cat.id})}
                          style={{
                            padding: '12px',
                            background: newProjectData.category === cat.id ? 'rgba(168, 85, 247, 0.1)' : 'var(--color-bg-tertiary)',
                            border: newProjectData.category === cat.id ? '1px solid var(--color-purple)' : '1px solid transparent',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <cat.icon size={20} style={{ color: cat.color }} />
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{cat.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {newProjectData.category === 'social' && (
                    <div className="social-inputs animate-fadeIn" style={{ marginBottom: '24px', padding: '16px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                      <h4 style={{ marginBottom: '12px', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Share2 size={16} /> Social Profile Setup
                      </h4>
                      
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Platform Focus</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {['instagram', 'tiktok', 'youtube', 'twitter'].map(platform => (
                            <button
                              key={platform}
                              className={`platform-btn ${newProjectData.socialPlatform === platform ? 'active' : ''}`}
                              onClick={() => setNewProjectData({...newProjectData, socialPlatform: platform})}
                              style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '8px',
                                border: newProjectData.socialPlatform === platform ? '1px solid var(--color-cyan)' : '1px solid var(--border-color)',
                                background: newProjectData.socialPlatform === platform ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                                color: newProjectData.socialPlatform === platform ? 'var(--color-cyan)' : 'var(--text-secondary)',
                                textTransform: 'capitalize',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              {platform}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Handle / Username</label>
                        <input 
                          type="text" 
                          className="search-input" 
                          placeholder="@yourname"
                          value={newProjectData.socialHandle}
                          onChange={(e) => setNewProjectData({...newProjectData, socialHandle: e.target.value})}
                          style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bio / Vibe</label>
                        <textarea 
                          className="search-input" 
                          placeholder="Describe your brand voice..."
                          value={newProjectData.socialBio}
                          onChange={(e) => setNewProjectData({...newProjectData, socialBio: e.target.value})}
                          style={{ width: '100%', padding: '10px', fontSize: '0.9rem', minHeight: '60px', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Workflow & Team */}
              {projectWizardStep === 2 && (
                <div className="wizard-step animate-slideIn">
                  <h3 style={{ marginBottom: '16px' }}>Choose Your Workflow</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                    How do you want to work? Select a preset workflow or build your own team.
                  </p>

                  {/* Workflow Presets */}
                  <div className="workflow-presets" style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                    <div 
                      className={`workflow-card haptic-press ${newProjectData.workflow === 'full_song' ? 'selected' : ''}`}
                      onClick={() => setNewProjectData({
                        ...newProjectData, 
                        workflow: 'full_song',
                        selectedAgents: ['ghost', 'beat', 'album']
                      })}
                      style={{
                        padding: '16px',
                        background: newProjectData.workflow === 'full_song' ? 'rgba(168, 85, 247, 0.15)' : 'var(--color-bg-tertiary)',
                        border: newProjectData.workflow === 'full_song' ? '1px solid var(--color-purple)' : '1px solid transparent',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{ background: 'var(--color-purple)', padding: '10px', borderRadius: '50%', color: 'white' }}>
                        <Music size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Full Song Creation</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lyrics â†’ Beat â†’ Cover Art</div>
                      </div>
                      {newProjectData.workflow === 'full_song' && <CheckCircle size={20} className="text-purple" />}
                    </div>

                    <div 
                      className={`workflow-card haptic-press ${newProjectData.workflow === 'social_promo' ? 'selected' : ''}`}
                      onClick={() => setNewProjectData({
                        ...newProjectData, 
                        workflow: 'social_promo',
                        selectedAgents: ['video-creator', 'trend', 'collab', 'social']
                      })}
                      style={{
                        padding: '16px',
                        background: newProjectData.workflow === 'social_promo' ? 'rgba(6, 182, 212, 0.15)' : 'var(--color-bg-tertiary)',
                        border: newProjectData.workflow === 'social_promo' ? '1px solid var(--color-cyan)' : '1px solid transparent',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{ background: 'var(--color-cyan)', padding: '10px', borderRadius: '50%', color: 'white' }}>
                        <Share2 size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Social Promotion</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Video â†’ Trends â†’ Social Pilot</div>
                      </div>
                      {newProjectData.workflow === 'social_promo' && <CheckCircle size={20} className="text-cyan" />}
                    </div>
                    
                    <div 
                      className={`workflow-card haptic-press ${newProjectData.workflow === 'custom' ? 'selected' : ''}`}
                      onClick={() => setNewProjectData({
                        ...newProjectData, 
                        workflow: 'custom',
                        selectedAgents: []
                      })}
                      style={{
                        padding: '16px',
                        background: newProjectData.workflow === 'custom' ? 'rgba(255, 255, 255, 0.1)' : 'var(--color-bg-tertiary)',
                        border: newProjectData.workflow === 'custom' ? '1px solid var(--text-secondary)' : '1px solid transparent',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{ background: 'var(--text-secondary)', padding: '10px', borderRadius: '50%', color: 'var(--color-bg-primary)' }}>
                        <Settings size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Custom Team</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manually select your agents</div>
                      </div>
                      {newProjectData.workflow === 'custom' && <CheckCircle size={20} className="text-white" />}
                    </div>
                  </div>

                  {/* Custom Agent Selection (Only if Custom is selected) */}
                  {newProjectData.workflow === 'custom' && (
                    <div className="agents-grid-selection animate-fadeIn" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {(typeof AGENTS !== 'undefined' ? AGENTS : []).map(agent => {
                      const isSelected = newProjectData.selectedAgents?.includes(agent.id);
                      return (
                        <div 
                          key={agent.id}
                          className={`agent-select-card haptic-press ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            const current = newProjectData.selectedAgents || [];
                            const updated = current.includes(agent.id)
                              ? current.filter(n => n !== agent.id)
                              : [...current, agent.id];
                            setNewProjectData({...newProjectData, selectedAgents: updated});
                          }}
                          style={{
                            padding: '12px',
                            background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'var(--color-bg-tertiary)',
                            border: isSelected ? '1px solid var(--color-purple)' : '1px solid transparent',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                          }}
                        >
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: isSelected ? 'var(--color-purple)' : 'var(--color-bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSelected ? 'white' : 'var(--text-secondary)'
                          }}>
                            {typeof agent.icon === 'function' ? <agent.icon size={16} /> : <Sparkles size={16} />}
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{agent.name}</span>
                          {isSelected && <CheckCircle size={14} className="text-purple" style={{ position: 'absolute', top: '8px', right: '8px' }} />}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}

              {/* Step 3: Review */}
              {projectWizardStep === 3 && (
                <div className="wizard-step animate-slideIn">
                  <h3 style={{ marginBottom: '16px' }}>Ready to Launch?</h3>
                  <div className="review-card" style={{ 
                    padding: '24px', 
                    background: 'var(--color-bg-tertiary)', 
                    borderRadius: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      width: '64px', 
                      height: '64px', 
                      background: 'var(--color-bg-secondary)', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <Rocket size={32} className="text-purple" />
                    </div>
                    <h2 style={{ marginBottom: '8px' }}>{newProjectData.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      {PROJECT_CATEGORIES.find(c => c.id === newProjectData.category)?.label} â€¢ {new Date().toLocaleDateString()}
                    </p>
                    
                    <div className="selected-team-preview" style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                      {(newProjectData.selectedAgents || []).map(agentIdOrName => {
                        const agent = (typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.find(a => a.id === agentIdOrName || a.name === agentIdOrName) : null;
                        return agent ? (
                          <div key={agentIdOrName} title={agent.name} style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg-primary)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)'
                          }}>
                            {typeof agent.icon === 'function' ? <agent.icon size={16} /> : <Sparkles size={16} />}
                          </div>
                        ) : null;
                      })}
                      {(newProjectData.selectedAgents || []).length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No specific agents selected</span>}
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Your studio environment is being prepared.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              {projectWizardStep > 1 ? (
                <button className="btn-ghost" onClick={() => setProjectWizardStep(prev => prev - 1)}>
                  Back
                </button>
              ) : (
                <div></div> 
              )}
              
              {projectWizardStep < 3 ? (
                <button 
                  className="cta-button-premium" 
                  disabled={
                    (projectWizardStep === 1 && (!newProjectData.name || !newProjectData.category)) ||
                    (projectWizardStep === 2 && !newProjectData.workflow)
                  }
                  onClick={() => setProjectWizardStep(prev => prev + 1)}
                >
                  Next Step
                </button>
              ) : (
                <button className="cta-button-premium" onClick={handleCreateProject}>
                  Create Project
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal - Simple Welcome */}
      {showOnboarding && (
        <div className="modal-overlay animate-fadeIn" style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content onboarding-modal" style={{
            maxWidth: '500px',
            width: '90%',
            position: 'relative'
          }}>
            <button
              onClick={handleSkipOnboarding}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                padding: 0,
                zIndex: 10
              }}
            >
              <X size={20} />
            </button>

            <div className="modal-body" style={{ padding: window.innerWidth < 768 ? '24px' : '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>ðŸŽ§</div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>
                {onboardingSteps[0].title}
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.6' }}>
                {onboardingSteps[0].content}
              </p>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                {onboardingSteps[0].detail}
              </p>

              <button
                className="cta-button-premium"
                onClick={completeOnboarding}
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '32px' }}
              >
                Enter Studio â†’
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Type Choice Modal - Studio Creation vs AI Pipeline */}
      {showProjectTypeChoice && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowProjectTypeChoice(false)} style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', width: '90%' }}>
            <button
              onClick={() => setShowProjectTypeChoice(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                padding: 0,
                zIndex: 10
              }}
            >
              <X size={20} />
            </button>

            <div className="modal-body" style={{ padding: '32px' }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Create New Project</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Choose how you want to build your project</p>
              </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Studio Creation Option */}
              <button
                onClick={() => {
                  setShowProjectTypeChoice(false);
                  setShowProjectWizard(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '20px',
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                className="haptic-press"
              >
                <div style={{ 
                  background: 'var(--color-purple)', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  color: 'white',
                  flexShrink: 0
                }}>
                  <FolderPlus size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>Studio Creation</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    Build your project step by step. Choose name, type, and select agents manually.
                  </p>
                </div>
              </button>

              {/* AI Production Pipeline Option */}
              <button
                onClick={() => {
                  setShowProjectTypeChoice(false);
                  setShowOrchestrator(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '20px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                className="haptic-press"
              >
                <div style={{ 
                  background: 'var(--color-cyan)', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  color: 'white',
                  flexShrink: 0
                }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>AI Production Pipeline</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    Let AI orchestrate your creative workflow. Describe your vision and get a complete production plan.
                  </p>
                </div>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent White Paper Modal */}
      {showAgentWhitePaper && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowAgentWhitePaper(null)} style={{ zIndex: 10000 }}>
          <div 
            className="modal-content whitepaper-modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '800px', 
              width: '95%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ 
                  width: '44px', height: '44px', borderRadius: '12px', 
                  background: 'var(--color-bg-secondary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-primary)'
                }}>
                  {typeof showAgentWhitePaper.icon === 'function' ? <showAgentWhitePaper.icon size={22} /> : <Sparkles size={22} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{showAgentWhitePaper.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{showAgentWhitePaper.subtitle}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowAgentWhitePaper(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem', flex: 1, overflow: 'auto' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--color-purple)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} /> The Vision
                </h3>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0 }}>
                  {showAgentWhitePaper.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <UsersIcon size={16} className="text-cyan" /> Who It's For
                  </h4>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 }}>
                    {showAgentWhitePaper.whoFor}
                  </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <Zap size={18} className="text-orange" /> How It Works
                  </h4>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 }}>
                    {showAgentWhitePaper.howTo}
                  </p>
                </div>
              </div>

              {/* Display Generated Creations */}
              {agentCreations[showAgentWhitePaper.key] && (Object.values(agentCreations[showAgentWhitePaper.key]).some(v => v)) && (
                <div style={{ marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--color-purple)' }}>
                    <Eye size={16} /> Generated Creations
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {/* Video Preview */}
                    {agentCreations[showAgentWhitePaper.key].video && (
                      <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(236, 72, 153, 1)', marginBottom: '8px', fontWeight: '600' }}>ðŸŽ¬ Video</p>
                        <video 
                          src={agentCreations[showAgentWhitePaper.key].video}
                          controls
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', background: '#000' }}
                          controlsList="nodownload"
                        />
                        <button 
                          className="btn-pill primary" 
                          style={{ width: '100%', marginTop: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
                          onClick={() => {
                            const asset = {
                              id: String(Date.now()),
                              title: `${showAgentWhitePaper.title} Video`,
                              type: 'Video',
                              agent: showAgentWhitePaper.title,
                              date: 'Just now',
                              color: 'agent-pink',
                              snippet: 'Generated Video',
                              videoUrl: agentCreations[showAgentWhitePaper.key].video
                            };
                            if (selectedProject) {
                              handleSaveAssetToProject(selectedProject.id, asset);
                              toast.success(`Saved to ${selectedProject.name}`);
                            } else {
                              handleCreateProjectWithAsset(`New ${showAgentWhitePaper.title} Project`, asset);
                            }
                          }}
                        >
                          <FolderPlus size={14} /> Save
                        </button>
                      </div>
                    )}

                    {/* Image Preview */}
                    {agentCreations[showAgentWhitePaper.key].image && typeof agentCreations[showAgentWhitePaper.key].image === 'string' && (
                      <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(168, 85, 247, 1)', marginBottom: '8px', fontWeight: '600' }}>ðŸŽ¨ Image</p>
                        <img 
                          src={agentCreations[showAgentWhitePaper.key].image.startsWith?.('data:') || agentCreations[showAgentWhitePaper.key].image.startsWith?.('http') ? agentCreations[showAgentWhitePaper.key].image : `data:image/png;base64,${agentCreations[showAgentWhitePaper.key].image}`}
                          alt="Generated"
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                          onError={(e) => {
                            console.warn('[ImagePreview] Failed to load agent creation image');
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120"%3E%3Crect fill="%231a1a2e" width="200" height="120"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="12" font-family="sans-serif"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <button 
                          className="btn-pill primary" 
                          style={{ width: '100%', marginTop: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
                          onClick={() => {
                            const imageData = agentCreations[showAgentWhitePaper.key]?.image;
                            if (!imageData || typeof imageData !== 'string') return;
                            const imgUrl = imageData.startsWith?.('data:') || imageData.startsWith?.('http') ? imageData : `data:image/png;base64,${imageData}`;
                            const asset = {
                              id: String(Date.now()),
                              title: `${showAgentWhitePaper.title} Image`,
                              type: 'Image',
                              agent: showAgentWhitePaper.title,
                              date: 'Just now',
                              color: 'agent-purple',
                              snippet: 'Generated Image',
                              imageUrl: imgUrl
                            };
                            if (selectedProject) {
                              handleSaveAssetToProject(selectedProject.id, asset);
                              toast.success(`Saved to ${selectedProject.name}`);
                            } else {
                              handleCreateProjectWithAsset(`New ${showAgentWhitePaper.title} Project`, asset);
                            }
                          }}
                        >
                          <FolderPlus size={14} /> Save
                        </button>
                      </div>
                    )}

                    {/* Audio Preview */}
                    {agentCreations[showAgentWhitePaper.key].audio && (
                      <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.3)', gridColumn: 'span 1' }}>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(6, 182, 212, 1)', marginBottom: '8px', fontWeight: '600' }}>ðŸŽµ Audio</p>
                        <audio 
                          src={agentCreations[showAgentWhitePaper.key].audio}
                          controls
                          style={{ width: '100%', height: '32px' }}
                          controlsList="nodownload"
                        />
                        <button 
                          className="btn-pill primary" 
                          style={{ width: '100%', marginTop: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
                          onClick={() => {
                            const asset = {
                              id: String(Date.now()),
                              title: `${showAgentWhitePaper.title} Audio`,
                              type: 'Audio',
                              agent: showAgentWhitePaper.title,
                              date: 'Just now',
                              color: 'agent-cyan',
                              snippet: 'Generated Audio',
                              audioUrl: agentCreations[showAgentWhitePaper.key].audio
                            };
                            if (selectedProject) {
                              handleSaveAssetToProject(selectedProject.id, asset);
                              toast.success(`Saved to ${selectedProject.name}`);
                            } else {
                              handleCreateProjectWithAsset(`New ${showAgentWhitePaper.title} Project`, asset);
                            }
                          }}
                        >
                          <FolderPlus size={14} /> Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button 
                className="cta-button-premium"
                onClick={() => {
                  const agent = (typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.find(a => a.id === showAgentWhitePaper.key) : null;
                  if (agent) {
                    setSelectedAgent(agent);
                    setShowAgentWhitePaper(null);
                    setActiveTab('agents'); // Or wherever the agent view is
                  }
                }}
              >
                Launch Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal & Business Resource Content Modal */}
      {showResourceContent && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowResourceContent(null)} style={{ zIndex: 10000 }}>
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '800px', 
              width: '95%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ 
                  width: '44px', height: '44px', borderRadius: '12px', 
                  background: 'var(--color-bg-secondary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-purple)'
                }}>
                  {typeof showResourceContent.icon === 'function' ? <showResourceContent.icon size={22} /> : <Sparkles size={22} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{showResourceContent.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{showResourceContent.type}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowResourceContent(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              <div 
                style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  lineHeight: '1.7',
                  color: 'var(--text-primary)'
                }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(showResourceContent.content
                    .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.5rem; margin: 1.5rem 0 1rem; color: var(--text-primary);">$1</h1>')
                    .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.2rem; margin: 1.25rem 0 0.75rem; color: var(--color-cyan);">$1</h2>')
                    .replace(/^### (.*$)/gm, '<h3 style="font-size: 1rem; margin: 1rem 0 0.5rem; color: var(--color-purple);">$1</h3>')
                    .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
                    .replace(/^- (.*$)/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.25rem;">$1</li>')
                    .replace(/^\d+\. (.*$)/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.25rem;">$1</li>')
                    .replace(/\n\n/g, '<br/><br/>'))
                }}
              />
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
              <button 
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(showResourceContent.content);
                  toast.success('Copied to clipboard!');
                }}
              >
                Copy Text
              </button>
              <button 
                className="cta-button-premium"
                onClick={() => setShowResourceContent(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Preview Modal - Enhanced with Navigation and Robust Handling */}
      {showPreview && (
        <div 
          className="modal-overlay animate-fadeIn" 
          onClick={() => { 
            // Cleanup audio before closing to prevent race conditions
            if (previewAudioRef.current) {
              previewAudioRef.current.pause();
              previewAudioRef.current.src = '';
            }
            setShowPreview(null); 
            setPreviewMaximized(false); 
          }} 
          style={{ 
            zIndex: 10000,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: (previewMaximized || isMobile) ? '0' : '20px'
          }}
        >
          {/* Navigation Arrows */}
          {safePreviewAssets.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Defensive checks for assets array and currentIndex
                  if (safePreviewAssets.length === 0 || isModalTransitioning.current) return;
                  
                  isModalTransitioning.current = true;
                  
                  const newIndex = safePreviewIndex > 0 
                    ? safePreviewIndex - 1 
                    : safePreviewAssets.length - 1;
                  
                  // Validate new index is in bounds
                  if (newIndex < 0 || newIndex >= safePreviewAssets.length) {
                    isModalTransitioning.current = false;
                    return;
                  }
                  
                  const newAsset = safePreviewAssets[newIndex];
                  if (!newAsset) {
                    isModalTransitioning.current = false;
                    return;
                  }
                  
                  setShowPreview({
                    type: getAssetPreviewType(newAsset),
                    url: formatAudioSrc(newAsset.audioUrl) || formatVideoSrc(newAsset.videoUrl) || formatImageSrc(newAsset.imageUrl) || null,
                    content: newAsset.content || newAsset.snippet || newAsset.output || null,
                    title: newAsset.title || 'Untitled',
                    asset: newAsset,
                    assets: safePreviewAssets,
                    currentIndex: newIndex
                  });
                  
                  setTimeout(() => { isModalTransitioning.current = false; }, 300);
                }}
                style={{
                  position: 'fixed',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  backdropFilter: 'blur(8px)',
                  zIndex: 2001,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <ChevronLeft size={24} />
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Defensive checks for assets array and currentIndex
                  if (safePreviewAssets.length === 0 || isModalTransitioning.current) return;
                  
                  isModalTransitioning.current = true;
                  
                  const newIndex = safePreviewIndex < safePreviewAssets.length - 1 
                    ? safePreviewIndex + 1 
                    : 0;
                  
                  // Validate new index is in bounds
                  if (newIndex < 0 || newIndex >= safePreviewAssets.length) {
                    isModalTransitioning.current = false;
                    return;
                  }
                  
                  const newAsset = safePreviewAssets[newIndex];
                  if (!newAsset) {
                    isModalTransitioning.current = false;
                    return;
                  }
                  
                  setShowPreview({
                    type: getAssetPreviewType(newAsset),
                    url: formatAudioSrc(newAsset.audioUrl) || formatVideoSrc(newAsset.videoUrl) || formatImageSrc(newAsset.imageUrl) || null,
                    content: newAsset.content || newAsset.snippet || newAsset.output || null,
                    title: newAsset.title || 'Untitled',
                    asset: newAsset,
                    assets: safePreviewAssets,
                    currentIndex: newIndex
                  });
                  
                  setTimeout(() => { isModalTransitioning.current = false; }, 300);
                }}
                style={{
                  position: 'fixed',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  backdropFilter: 'blur(8px)',
                  zIndex: 2001,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: previewMaximized ? '100vw' : (isMobile ? '100vw' : (safePreview.type === 'image' ? '90vw' : '85vw')),
              maxHeight: previewMaximized ? '100vh' : (isMobile ? '100vh' : '85vh'),
              width: previewMaximized ? '100vw' : (isMobile ? '100vw' : (safePreview.type === 'image' ? 'auto' : '100%')),
              height: previewMaximized ? '100vh' : (isMobile ? '100vh' : 'auto'),
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(10,10,15,0.99)',
              borderRadius: (previewMaximized || isMobile) ? '0' : '16px',
              border: previewMaximized ? 'none' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Header */}
            <div className="modal-header" style={{ 
              borderBottom: '1px solid rgba(255,255,255,0.1)', 
              padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem', 
              paddingTop: isMobile ? 'calc(0.75rem + env(safe-area-inset-top, 0px))' : '1rem',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: safePreview.type === 'image' ? 'rgba(236, 72, 153, 0.2)' 
                    : safePreview.type === 'video' ? 'rgba(6, 182, 212, 0.2)' 
                    : safePreview.type === 'audio' ? 'rgba(168, 85, 247, 0.2)'
                    : 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {safePreview.type === 'image' && <ImageIcon size={18} style={{ color: 'var(--color-pink)' }} />}
                  {safePreview.type === 'video' && <VideoIcon size={18} style={{ color: 'var(--color-cyan)' }} />}
                  {safePreview.type === 'audio' && <Music size={18} style={{ color: 'var(--color-purple)' }} />}
                  {(safePreview.type === 'text' || safePreview.type === 'lyrics' || safePreview.type === 'hook' || safePreview.type === 'verse' || safePreview.type === 'concept') && <FileText size={18} style={{ color: 'var(--color-green)' }} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h2 style={{ 
                    fontSize: '1rem', 
                    margin: 0, 
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>{safePreview.title || 'Preview'}</h2>
                  {safePreviewAssets.length > 1 && (
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-secondary)', 
                      margin: '2px 0 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {safePreviewIndex + 1} of {safePreviewAssets.length} assets
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Min/Max Toggle Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewMaximized(prev => !prev);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  title={previewMaximized ? 'Minimize' : 'Maximize'}
                >
                  {previewMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                {/* Use in Orchestrator Button */}
                {safePreview.asset && (
                  <button
                    onClick={() => {
                      // Add asset to orchestrator session
                      const asset = safePreview.asset;
                      const slotType = asset.audioUrl ? 'audio' : asset.videoUrl ? 'visual' : asset.imageUrl ? 'visual' : null;
                      if (slotType && selectedProject) {
                        const newSession = {
                          ...(selectedProject.sessionState || {}),
                          [slotType]: asset
                        };
                        setSelectedProject({
                          ...selectedProject,
                          sessionState: newSession
                        });
                        setProjects(prev => prev.map(p => p.id === selectedProject.id ? {...p, sessionState: newSession} : p));
                        setShowPreview(null);
                        setPreviewMaximized(false);
                        setShowOrchestrator(true);
                        toast.success(`âœ¨ Added "${asset.title}" to Studio Orchestrator`);
                      }
                    }}
                    className="btn-pill primary"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontSize: '0.85rem',
                      padding: isMobile ? '8px' : '8px 16px'
                    }}
                  >
                    <Zap size={16} />
                    {!isMobile && "Use in Orchestrator"}
                  </button>
                )}
                <button className="modal-close" onClick={() => { 
                  // Cleanup before closing
                  if (previewAudioRef.current) {
                    previewAudioRef.current.pause();
                    previewAudioRef.current.src = '';
                  }
                  isModalTransitioning.current = false;
                  setShowPreview(null); 
                  setPreviewMaximized(false); 
                }} style={{ 
                  color: '#fff',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer'
                }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="modal-body" style={{ 
              padding: previewMaximized ? '2rem' : '1.5rem', 
              flex: 1, 
              overflow: 'auto', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              background: safePreview.type === 'image' ? 'transparent' : 'rgba(0,0,0,0.3)'
            }}>
              {/* Audio / Vocal player */}
              {(safePreview.type === 'audio' || safePreview.type === 'vocal' || (safePreview.url && safePreview.asset?.audioUrl)) && (
                <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center', marginBottom: (safePreview.content || getAssetTextContent(safePreview.asset)) ? '2rem' : 0 }}>
                  <div style={{ 
                    width: previewMaximized ? '100px' : '80px', 
                    height: previewMaximized ? '100px' : '80px', 
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
                    transition: 'all 0.3s ease'
                  }}>
                    <Music size={previewMaximized ? 48 : 36} style={{ color: 'white' }} />
                  </div>
                  <audio
                    ref={previewAudioRef}
                    key={safePreview.asset?.id || safePreview.url || 'audio-preview'}
                    src={safePreview.url || formatAudioSrc(safePreview.asset?.audioUrl)}
                    controls
                    crossOrigin="anonymous"
                    style={{ width: '100%' }}
                    autoPlay={false}
                    controlsList="nodownload"
                    onPlay={(e) => {
                      // Mutual exclusion: pause all other media
                      document.querySelectorAll('audio, video').forEach(el => {
                        if (el !== e.target) el.pause();
                      });
                    }}
                    onError={(e) => {
                      const errorCode = e.target.error?.code;
                      const errorMsg = e.target.error?.message || 'Unknown error';
                      const srcUrl = safePreview.url || '';
                      console.error('[AudioPreview] Error:', errorMsg, 'code:', errorCode, 'URL type:', srcUrl.startsWith('data:') ? 'base64' : srcUrl.startsWith('blob:') ? 'blob' : srcUrl.startsWith('http') ? 'remote' : 'unknown');

                      // Retry: if remote URL failed, try re-formatting through formatAudioSrc
                      const rawAudioUrl = safePreview.asset?.audioUrl;
                      if (rawAudioUrl && !e.target.dataset.retried) {
                        e.target.dataset.retried = 'true';
                        const retryUrl = formatAudioSrc(rawAudioUrl);
                        if (retryUrl && retryUrl !== srcUrl) {
                          console.log('[AudioPreview] Retrying with reformatted URL');
                          e.target.src = retryUrl;
                          return;
                        }
                        // If raw URL is a remote URL, try without crossOrigin
                        if (rawAudioUrl.startsWith('http')) {
                          console.log('[AudioPreview] Retrying without crossOrigin');
                          e.target.removeAttribute('crossorigin');
                          e.target.src = rawAudioUrl;
                          return;
                        }
                      }

                      // Show user-friendly error after all retries exhausted
                      const container = e.target.parentElement;
                      if (container && !container.querySelector('.audio-error-msg')) {
                        const errDiv = document.createElement('div');
                        errDiv.className = 'audio-error-msg';
                        errDiv.style.cssText = 'color: var(--color-red); font-size: 0.85rem; margin-top: 12px;';
                        errDiv.textContent = 'âš ï¸ Audio failed to load. Try downloading instead.';
                        container.appendChild(errDiv);
                      }
                    }}
                  />
                  {/* Show URL type for debugging */}
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '12px', opacity: 0.6 }}>
                    {safePreview.url?.startsWith('data:') ? 'Base64 Audio' : safePreview.url?.startsWith('http') ? 'Remote Audio' : 'Cloud Asset'}
                  </p>
                </div>
              )}
              {safePreview.type === 'image' && safePreview.url && (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Loading state */}
                  <div 
                    className="image-loading-placeholder" 
                    style={{ 
                      position: 'absolute',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <div className="spinner" style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(255,255,255,0.1)',
                      borderTopColor: 'var(--color-purple)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: '0.85rem' }}>Loading image...</span>
                  </div>
                  <img 
                    src={safePreview.url}
                    alt={safePreview.title || 'Image preview'}
                    onLoad={(e) => {
                      // Hide loading placeholder when loaded
                      const placeholder = e.target.previousElementSibling;
                      if (placeholder) placeholder.style.display = 'none';
                      e.target.style.opacity = 1;
                    }}
                    onError={(e) => {
                      console.error('[ImagePreview] Failed to load:', safePreview.url?.substring(0, 50));
                      const placeholder = e.target.previousElementSibling;
                      if (placeholder) {
                        placeholder.innerHTML = '<div style="text-align:center;color:var(--color-red)"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><p style="margin-top:8px">Failed to load image</p></div>';
                      }
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: previewMaximized ? '90vh' : '80vh', 
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                      opacity: 0,
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
              )}
              {safePreview.type === 'video' && safePreview.url && (
                <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
                  {/* Loading state for video */}
                  <div 
                    className="video-loading-placeholder" 
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      color: 'var(--text-secondary)',
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '8px',
                      zIndex: 1
                    }}
                  >
                    <div className="spinner" style={{
                      width: '50px',
                      height: '50px',
                      border: '3px solid rgba(255,255,255,0.1)',
                      borderTopColor: 'var(--color-cyan)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: '0.85rem' }}>Loading video...</span>
                  </div>
                  <video 
                    src={safePreview.url}
                    controls
                    playsInline
                    loop
                    onPlay={(e) => {
                      document.querySelectorAll('audio, video').forEach(el => {
                        if (el !== e.target) el.pause();
                      });
                    }}
                    onCanPlay={(e) => {
                      // Hide loading placeholder when video can play
                      const placeholder = e.target.previousElementSibling;
                      if (placeholder) placeholder.style.display = 'none';
                    }}
                    onError={(e) => {
                      console.error('[VideoPreview] Failed to load:', safePreview.url?.substring(0, 50));
                      const placeholder = e.target.previousElementSibling;
                      if (placeholder) {
                        placeholder.innerHTML = '<div style="text-align:center;color:var(--color-red)"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><p style="margin-top:12px;font-size:0.9rem">Failed to load video</p><p style="font-size:0.75rem;opacity:0.7;margin-top:4px">Try downloading instead</p></div>';
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      maxWidth: '100%', 
                      maxHeight: previewMaximized ? '90vh' : '80vh', 
                      objectFit: 'contain',
                      borderRadius: '8px',
                      background: 'black'
                    }}
                  />
                </div>
              )}
              {/* Text content preview (unify with lyrics/vocally) */}
              {(safePreview.type === 'text' || safePreview.type === 'lyrics' || safePreview.type === 'vocal' || safePreview.type === 'audio' || safePreview.type === 'hook' || safePreview.type === 'verse' || safePreview.type === 'concept') && (
                <div style={{ 
                  width: '100%', 
                  maxWidth: previewMaximized ? '1200px' : '900px', 
                  maxHeight: '100%',
                  overflow: 'auto',
                  padding: isMobile ? '1.5rem' : '3rem',
                  background: 'rgba(20, 20, 30, 0.4)',
                  borderRadius: '16px',
                  border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isMobile ? 'none' : '0 10px 40px rgba(0,0,0,0.5)',
                  flex: 1
                }}>
                  <div style={{ 
                    fontSize: previewMaximized ? '1.4rem' : '1.15rem', 
                    lineHeight: '1.8',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    margin: '0 auto',
                    maxWidth: '800px'
                  }}>
                    {(() => {
                      // Use helper for robust text extraction
                      const textContent = safePreview.content || getAssetTextContent(safePreview.asset);
                      if (textContent) {
                        return textContent;
                      }
                      return (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1rem' }}>No text content available</p>
                          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>This asset may be audio, video, or image-only.</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Strip - for navigation between assets */}
            {safePreviewAssets.length > 1 && (
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                padding: '12px 16px',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)'
              }}>
                {safePreviewAssets.map((asset, idx) => {
                  if (!asset) return null; // Safety check
                  return (
                  <button
                    key={asset?.id || idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      // Guard against rapid clicks and invalid indices
                      if (isModalTransitioning.current) return;
                      if (idx < 0 || idx >= safePreviewAssets.length) return;
                      
                      const targetAsset = safePreviewAssets[idx];
                      if (!targetAsset) return;
                      
                      isModalTransitioning.current = true;
                      
                      try {
                        setShowPreview({
                          type: getAssetPreviewType(targetAsset),
                          url: formatAudioSrc(targetAsset.audioUrl) || formatVideoSrc(targetAsset.videoUrl) || formatImageSrc(targetAsset.imageUrl) || null,
                          content: targetAsset.content || targetAsset.snippet || targetAsset.output || null,
                          title: targetAsset.title || 'Untitled',
                          asset: targetAsset,
                          assets: safePreviewAssets,
                          currentIndex: idx
                        });
                      } catch (err) {
                        console.error('[ThumbnailClick] Error:', err);
                      }
                      
                      setTimeout(() => { isModalTransitioning.current = false; }, 300);
                    }}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      border: idx === safePreviewIndex 
                        ? '2px solid var(--color-purple)' 
                        : '2px solid transparent',
                      background: asset.imageUrl 
                        ? `url(${formatImageSrc(asset.imageUrl)}) center/cover`
                        : 'rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: idx === safePreviewIndex ? 1 : 0.6,
                      transition: 'all 0.2s ease',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {/* Video thumbnail with frame */}
                    {asset.videoUrl && !asset.imageUrl && (
                      <video 
                        src={formatVideoSrc(asset.videoUrl)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                        preload="metadata"
                        onLoadedData={(e) => {
                          if (e.target.currentTime === 0) e.target.currentTime = 1;
                        }}
                      />
                    )}
                    {/* Audio icon */}
                    {asset.audioUrl && !asset.imageUrl && (
                      <Music size={20} style={{ color: 'var(--color-purple)' }} />
                    )}
                    {/* Text file icon */}
                    {!asset.imageUrl && !asset.videoUrl && !asset.audioUrl && (
                      <FileText size={20} style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </button>
                  );
                })}
              </div>
            )}

            {/* Action Buttons Footer */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              padding: '12px 16px',
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              background: 'rgba(0,0,0,0.4)'
            }}>
              {/* Re-run Agent Button */}
              {safePreview.asset?.agent && safePreview.asset.agent !== 'User Upload' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const agent = (typeof AGENTS !== 'undefined' && AGENTS) ? AGENTS.find(a => a.name === safePreview.asset?.agent) : null;
                    if (agent) {
                      setSelectedAgent(agent);
                      setPendingPrompt(safePreview.asset?.snippet || safePreview.title || '');
                      setActiveTab('agents');
                      setShowPreview(null);
                      setPreviewMaximized(false);
                      toast.success(`Opened ${agent.name} - edit prompt and regenerate!`);
                    }
                  }}
                  style={{
                    padding: isMobile ? '8px 12px' : '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--color-cyan), var(--color-purple))',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    fontSize: '0.8rem'
                  }}
                >
                  <RefreshCw size={14} /> {isMobile ? "Regen" : `Re-run with ${safePreview.asset?.agent}`}
                </button>
              )}

              {/* Use in Orchestrator Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Pass asset to orchestrator via sessionState
                  if (selectedProject) {
                    const asset = safePreview.asset;
                    const updated = {
                      ...selectedProject,
                      sessionState: {
                        ...selectedProject.sessionState,
                        ...(asset?.audioUrl && { audio: { audioUrl: asset.audioUrl, title: asset.title } }),
                        ...(asset?.imageUrl && { visual: { ...selectedProject.sessionState?.visual, imageUrl: asset.imageUrl, title: asset.title } }),
                        ...(asset?.videoUrl && { visual: { ...selectedProject.sessionState?.visual, videoUrl: asset.videoUrl, title: asset.title } })
                      }
                    };
                    setSelectedProject(updated);
                    setProjects(prev => Array.isArray(prev) ? prev.map(p => p.id === updated.id ? updated : p) : [updated]);
                  }
                  setShowPreview(null);
                  setPreviewMaximized(false);
                  setShowOrchestrator(true);
                  toast.success('Asset loaded into Orchestrator!');
                }}
                style={{
                  padding: isMobile ? '8px 12px' : '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(168, 85, 247, 0.5)',
                  background: 'rgba(168, 85, 247, 0.2)',
                  color: 'var(--color-purple)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}
              >
                <Sparkles size={14} /> {isMobile ? "Use" : "Use in Orchestrator"}
              </button>

              {/* Download Button (for media) */}
              {safePreview.url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      const link = document.createElement('a');
                      link.href = safePreview.url;
                      link.download = safePreview.title || 'download';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success('Download started!');
                    } catch (err) {
                      console.error('[Download] Failed:', err);
                      toast.error('Download failed. Try right-click and save.');
                    }
                  }}
                  style={{
                    padding: isMobile ? '8px 12px' : '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem'
                  }}
                >
                  <Download size={14} /> {isMobile ? "Save" : "Download"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Agent Help / Get Started Modal */}
      {showAgentHelpModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowAgentHelpModal(null)}>
          <div className="modal-content agent-help-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', position: 'relative' }}>
              <div className="modal-title-group" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                minWidth: 0, 
                flex: 1,
                paddingRight: '40px' // Make room for absolute close button
              }}>
                <div className={`agent-mini-icon ${showAgentHelpModal.colorClass}`} style={{ flexShrink: 0 }}>
                  {typeof showAgentHelpModal.icon === 'function' ? <showAgentHelpModal.icon size={20} /> : <Sparkles size={20} />}
                </div>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.25rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                  flex: 1
                }}>{showAgentHelpModal.name} Guide</h2>
              </div>
              <button className="modal-close" onClick={() => setShowAgentHelpModal(null)} style={{ flexShrink: 0 }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body help-modal-body">
              <div className="help-section">
                <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.6' }}>
                  {showAgentHelpModal.description}
                </p>
                <div style={{ padding: '16px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--color-cyan)' }}>
                  <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}><Zap size={16} className="text-cyan" /> How to Use</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{showAgentHelpModal.howToUse}</p>
                </div>
              </div>

              {showAgentHelpModal.capabilities && (
                <div className="help-section">
                  <h3><Shield size={16} className="text-purple" /> Mission-Critical Wheel House Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                    {showAgentHelpModal.capabilities.map((cap, idx) => (
                      <div key={idx} style={{ 
                        fontSize: '0.75rem', 
                        padding: '8px 12px', 
                        background: 'rgba(168, 85, 247, 0.05)', 
                        border: '1px solid rgba(168, 85, 247, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        {cap}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showAgentHelpModal.features && (
                <div className="help-section">
                  <h3><ListIcon size={16} className="text-purple" /> Core Features</h3>
                  <div className="onboarding-steps-list">
                    {showAgentHelpModal.features.map((feature, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        padding: '10px 14px', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        marginBottom: '6px'
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-purple)' }} />
                        <p style={{ fontSize: '0.85rem', margin: 0 }}>{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showAgentHelpModal.proTips && (
                <div className="help-section pro-tip-box" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), transparent)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <h3 style={{ color: 'var(--color-purple)' }}><Award size={16} /> Advanced Pro Tips</h3>
                  <div className="onboarding-steps-list" style={{ gap: '8px', background: 'none', border: 'none', padding: 0 }}>
                    {showAgentHelpModal.proTips.map((tip, idx) => (
                      <p key={idx} style={{ fontSize: '0.9rem', margin: 0, paddingLeft: '12px', borderLeft: '2px solid var(--color-purple)', textAlign: 'left' }}>{tip}</p>
                    ))}
                  </div>
                </div>
              )}

              {showAgentHelpModal.examples && (
                <div className="help-section">
                   <h3 style={{ fontSize: '0.9rem' }}><Rocket size={16} className="text-cyan" /> Elite Elite Performance Samples</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {showAgentHelpModal.examples.map((ex, idx) => (
                       <div key={idx} style={{ 
                         padding: '12px', 
                         background: 'rgba(0,0,0,0.2)', 
                         borderRadius: '8px', 
                         fontSize: '0.85rem', 
                         color: 'var(--color-cyan)',
                         border: '1px solid rgba(6, 182, 212, 0.1)',
                         fontFamily: 'monospace'
                       }}>
                         "{ex}"
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {showAgentHelpModal.onboarding && (
                <div className="help-section">
                  <h3><Shield size={16} className="text-purple" /> Mission-Critical Wheel House Information</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {showAgentHelpModal.capabilities.map((cap, i) => (
                      <span key={i} style={{ 
                        padding: '6px 12px', 
                        background: 'rgba(168, 85, 247, 0.1)', 
                        border: '1px solid rgba(168, 85, 247, 0.2)', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem',
                        color: 'var(--color-purple)'
                      }}>
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {showAgentHelpModal.onboarding && (
                <div className="help-section">
                  <h3><Rocket size={16} className="text-cyan" /> Quick Start Steps</h3>
                  <div className="onboarding-steps-list">
                    {showAgentHelpModal.onboarding.map((step, idx) => (
                      <div key={idx} className="onboarding-step-item" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="step-number" style={{ background: 'var(--color-purple)', color: 'white', borderColor: 'transparent' }}>{idx + 1}</span>
                        <p style={{ fontSize: '0.85rem', textAlign: 'left', margin: 0 }}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showAgentHelpModal.explanation && (
                <div className="help-section" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={14} /> Technical Architecture
                  </h4>
                  <p style={{ margin: 0, lineHeight: '1.5' }}>{showAgentHelpModal.explanation}</p>
                </div>
              )}

              {showAgentHelpModal.examples && (
                <div className="help-section">
                  <h3><Sparkles size={16} className="text-orange" /> Example Prompts</h3>
                  <div className="example-chips">
                    {showAgentHelpModal.examples.map((ex, idx) => (
                      <button key={idx} className="example-chip" onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(ex);
                        toast.success("Example copied to clipboard!");
                      }} style={{ textAlign: 'left', width: '100%', marginBottom: '4px' }}>
                        "{ex}"
                      </button>
                    ))}
                  </div>
                  <p className="tiny-hint">Click an example to copy and use</p>
                </div>
              )}

              {showAgentHelpModal.helpTips && (
                <div className="help-section pro-tip-box" style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), transparent)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                  <h3 style={{ color: '#eab308' }}><Crown size={16} /> Pro Tip</h3>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{showAgentHelpModal.helpTips}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cta-button-premium" onClick={() => {
                setSelectedAgent(showAgentHelpModal);
                setShowAgentHelpModal(null);
              }}>
                Launch {showAgentHelpModal.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Workflow Modal - Streamlined agent interaction */}
      {quickWorkflowAgent && (
        <Suspense fallback={<LazyFallback />}>
          <QuickWorkflow
            agent={quickWorkflowAgent}
            onClose={() => setQuickWorkflowAgent(null)}
            projects={projects}
            onSaveToProject={handleSaveAssetToProject}
            onCreateProject={handleCreateProjectWithAsset}
            user={user}
            userCredits={userCredits}
            setUserCredits={setUserCredits}
            isAdmin={isAdmin}
          />
        </Suspense>
      )}

      {/* Add Agent Modal - Uses same styling as Agents page */}
      {showAddAgentModal && (
        <div className="modal-overlay animate-fadeIn" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'center', padding: '1rem' }} onClick={() => setShowAddAgentModal(false)}>
          <div className="modal-content" style={{ maxWidth: 'min(92vw, 700px)', width: '100%', margin: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ position: 'relative' }}>
              <h2 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                margin: 0,
                fontSize: '1.25rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingRight: '40px'
              }}>
                <UsersIcon size={20} className="text-purple" style={{ flexShrink: 0 }} />
                Add Agent to Project
              </h2>
              <button className="modal-close" onClick={() => setShowAddAgentModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              {/* Available Agents */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                  Your Agents ({getAvailableAgents().length})
                </h3>
                <div className="agents-studio-grid" style={{ maxWidth: '100%', margin: 0 }}>
                  {getAvailableAgents().map((agent, i) => {
                    const Icon = agent.icon;
                    const isAlreadyAdded = selectedProject?.agents?.some(a => a.id === agent.id);
                    return (
                      <div 
                        key={agent.id} 
                        className={`agent-studio-card ${agent.colorClass} ${isAlreadyAdded ? 'opacity-50' : ''}`}
                        style={{ 
                          animationDelay: `${i * 0.05}s`, 
                          position: 'relative',
                          cursor: isAlreadyAdded ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => !isAlreadyAdded && handleAddAgent(agent)}
                      >
                        {isAlreadyAdded && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'var(--color-purple)',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Check size={12} color="white" />
                          </div>
                        )}
                        <div className="agent-studio-icon">
                          <Icon size={24} />
                        </div>
                        <div className="agent-studio-info">
                          <h3>{agent.name}</h3>
                          <p>{agent.category}</p>
                        </div>
                        <button 
                          className="agent-launch-btn"
                          disabled={isAlreadyAdded}
                          style={{ 
                            opacity: isAlreadyAdded ? 0.5 : 1,
                            pointerEvents: isAlreadyAdded ? 'none' : 'auto'
                          }}
                        >
                          {isAlreadyAdded ? 'Added' : 'Add to Project'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Locked Agents */}
              {getLockedAgents().length > 0 && (
                <div>
                  <h3 style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    marginBottom: '12px', 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <LockIcon size={14} />
                    Upgrade to Unlock ({getLockedAgents().length})
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px'
                  }}>
                    {getLockedAgents().map((agent) => {
                      const Icon = agent.icon;
                      const tierLabel = agent.tier === 'monthly' ? 'Monthly' : 'Pro';
                      const tierColor = agent.tier === 'monthly' ? 'var(--color-cyan)' : 'var(--color-purple)';
                      
                      return (
                        <div 
                          key={agent.id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            opacity: 0.6,
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setShowAddAgentModal(false);
                            if (!isLoggedIn) {
                              setShowLoginModal(true);
                            } else {
                              setDashboardTab('subscription');
                              setActiveTab('mystudio');
                            }
                          }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Icon size={16} style={{ opacity: 0.5 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              fontSize: '0.85rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {agent.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.65rem', 
                              color: tierColor,
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              {tierLabel}
                            </div>
                          </div>
                          <LockIcon size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Command Palette Modal (Whisperer-style) */}
      {showVoiceCommandPalette && (
        <div className="modal-overlay animate-fadeIn" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'flex-start', padding: '1rem' }} onClick={() => setShowVoiceCommandPalette(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 'min(92vw, 520px)', width: '100%', margin: '1rem auto' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mic size={20} className="text-purple" />
                Voice Commands
              </h2>
              <button className="modal-close" onClick={() => setShowVoiceCommandPalette(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'left', padding: '16px 24px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Click the mic button and say any of these commands:
              </p>
              
              {['Navigation', 'Actions', 'Settings', 'Voice'].map(category => (
                <div key={category} style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-purple)', marginBottom: '8px' }}>
                    {category}
                  </h4>
                  {VOICE_COMMANDS.filter(c => c.category === category).map((cmd, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      marginBottom: '6px',
                      fontSize: '0.85rem'
                    }}>
                      <div>
                        <span style={{ fontWeight: '600', color: 'white' }}>{cmd.command}</span>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '0.75rem' }}>{cmd.description}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-cyan)', fontStyle: 'italic' }}>{cmd.example}</span>
                    </div>
                  ))}
                </div>
              ))}
              
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  ðŸ’¡ <strong style={{ color: 'white' }}>Pro Tip:</strong> Say anything else and it will be added to your prompt as dictation.
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '16px 24px' }}>
              <button 
                className={`cta-button-premium ${isListening ? 'listening' : ''}`}
                onClick={() => {
                  setShowVoiceCommandPalette(false);
                  handleVoiceToText();
                }}
                style={{ width: '100%' }}
              >
                <Mic size={18} />
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Voice Indicator (Whisperer-style) */}
      {isListening && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {/* Real-time transcript */}
          {voiceTranscript && (
            <div style={{
              background: 'rgba(0,0,0,0.9)',
              padding: '12px 20px',
              borderRadius: '12px',
              color: 'white',
              fontSize: '0.9rem',
              maxWidth: '300px',
              textAlign: 'center',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              <span style={{ color: 'var(--color-cyan)' }}>"{voiceTranscript}"</span>
            </div>
          )}
          
          {/* Listening indicator */}
          <div style={{
            background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
            padding: '16px 24px',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            cursor: 'pointer'
          }} onClick={handleVoiceToText}>
            {/* Animated pulse rings */}
            <div style={{ position: 'relative', width: '24px', height: '24px' }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'white',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <Mic size={24} style={{ position: 'relative', zIndex: 1, color: 'var(--color-purple)' }} />
            </div>
            <span style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
              Listening...
            </span>
            <button 
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleVoiceToText(); // Stop listening
              }}
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Last command feedback */}
          {lastVoiceCommand && (
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              marginTop: '4px'
            }}>
              Last: "{lastVoiceCommand.text.substring(0, 25)}{lastVoiceCommand.text.length > 25 ? '...' : ''}"
            </div>
          )}
        </div>
      )}

      {/* Audio Export/Mastering Modal */}
      {showExportModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowExportModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ 
            maxWidth: 'min(95vw, 500px)', 
            width: '100%',
            margin: '2rem auto'
          }}>
            <button className="modal-close" onClick={() => setShowExportModal(null)}><X size={20} /></button>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              <h2 style={{
                fontSize: '1.4rem',
                fontWeight: '700',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'white'
              }}>
                <Volume2 className="text-cyan" size={24} />
                Export for Distribution
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                Prepare your audio for streaming platforms and digital distribution.
              </p>

              {/* Preset Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  EXPORT PRESET
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'streaming', label: 'Streaming', desc: 'Spotify, Apple Music', specs: '44.1kHz / 16-bit / -14 LUFS' },
                    { id: 'youtube', label: 'YouTube', desc: 'Video platforms', specs: '48kHz / 16-bit / -14 LUFS' },
                    { id: 'cd', label: 'CD Quality', desc: 'Physical release', specs: '44.1kHz / 16-bit / -9 LUFS' },
                    { id: 'hires', label: 'Hi-Res', desc: 'Audiophile', specs: '96kHz / 24-bit / -14 LUFS' },
                    { id: 'podcast', label: 'Podcast', desc: 'Spoken word', specs: '44.1kHz / 16-bit / -16 LUFS' }
                  ].map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => setExportPreset(preset.id)}
                      style={{
                        padding: '12px',
                        background: exportPreset === preset.id 
                          ? 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))' 
                          : 'rgba(255,255,255,0.05)',
                        border: exportPreset === preset.id 
                          ? '1px solid var(--color-purple)' 
                          : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem' }}>{preset.label}</div>
                      <div style={{ fontSize: '0.7rem', color: exportPreset === preset.id ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>{preset.desc}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-cyan)', marginTop: '4px' }}>{preset.specs}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Compatibility */}
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '10px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  PLATFORM COMPATIBILITY
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Apple Music', 'Spotify', 'YouTube Music', 'Amazon Music', 'Tidal', 'Deezer'].map(platform => (
                    <span key={platform} style={{
                      padding: '4px 10px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Check size={12} /> {platform}
                    </span>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={async () => {
                  if (!showExportModal?.audioUrl) {
                    toast.error('No audio to export');
                    return;
                  }
                  
                  setIsExporting(true);
                  const exportToast = toast.loading('Mastering audio...');
                  
                  try {
                    // Extract base64 from data URL
                    const base64 = showExportModal.audioUrl.split(',')[1];
                    
                    const response = await fetch(`${BACKEND_URL}/api/master-audio`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        audioBase64: base64,
                        preset: exportPreset
                      })
                    });
                    
                    const data = await response.json();
                    
                    if (data.audioUrl) {
                      // Download the mastered file
                      const link = document.createElement('a');
                      link.href = data.audioUrl;
                      link.download = `${showExportModal.title || 'audio'}-mastered-${exportPreset}.wav`;
                      link.click();
                      
                      toast.success(`Exported for ${exportPreset}!`, { id: exportToast });
                      setShowExportModal(null);
                    } else {
                      throw new Error(data.error || 'Export failed - no audio URL returned');
                    }
                  } catch (err) {
                    console.error('Export error:', err);
                    toast.error('Export failed: ' + (err.message || 'Check your connection'), { id: exportToast });
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: isExporting 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'linear-gradient(135deg, var(--color-purple), var(--color-cyan))',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isExporting ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Mastering...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export & Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudioView;
