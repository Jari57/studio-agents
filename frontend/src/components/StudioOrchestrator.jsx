import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, Sparkles, Mic2, FileText, Video, Hash, RefreshCw, Zap, 
  Music, Image as ImageIcon, Download, Save, FolderPlus, Volume2, X,
  Check, Loader2, Maximize2, Users, Eye
} from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { Plyr } from 'plyr-react';
import 'plyr-react/plyr.css';
import { BACKEND_URL, AGENTS } from '../constants';
import { useLazyLoadImages } from '../hooks/useLazyLoadImages';
import toast from 'react-hot-toast';
import PreviewModal from './PreviewModal';

// Professional Waveform Player Component
const WaveformPlayer = ({ url, color }) => {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: `${color}44`,
      progressColor: color,
      cursorColor: color,
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 40,
      normalize: true,
      partialRender: true
    });

    ws.load(url);

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      wavesurferRef.current = ws;
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    return () => ws.destroy();
  }, [url, color]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button
        onClick={togglePlay}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: color,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: `0 4px 12px ${color}44`
        }}
      >
        {isPlaying ? <Pause size={16} color="white" /> : <Play size={16} color="white" />}
      </button>
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.65rem', 
          color: 'rgba(255,255,255,0.4)',
          marginTop: '2px'
        }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

// Streaming text effect hook
function useTypewriter(text, speed = 15, trigger = false) {
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    if (!trigger || !text) {
      setDisplayed('');
      return;
    }
    
    setIsTyping(true);
    setDisplayed('');
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, trigger, speed]);
  
  return { displayed, isTyping };
}

// Agent Output Card with Generate Real Asset button
function AgentOutputCard({ 
  icon: Icon, 
  title, 
  color, 
  output, 
  isLoading, 
  delay = 0,
  mediaType = null, // 'audio' | 'image' | 'video'
  mediaUrl = null,
  onGenerateMedia = null,
  isGeneratingMedia = false
}) {
  const [showContent, setShowContent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { displayed, isTyping } = useTypewriter(output, 12, showContent);
  
  useEffect(() => {
    if (output && !isLoading) {
      const timer = setTimeout(() => setShowContent(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [output, isLoading, delay]);
  
  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: '16px',
      padding: '16px',
      border: `1px solid ${color}33`,
      position: 'relative',
      overflow: 'hidden',
      minHeight: '160px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle at center, ${color}08 0%, transparent 50%)`,
        pointerEvents: 'none'
      }} />
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '12px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: `${color}20`,
          border: `1px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ 
          fontSize: '0.85rem', 
          fontWeight: '600',
          color: color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {title}
        </span>
        {(isLoading || isTyping) && (
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: color,
            marginLeft: 'auto',
            animation: 'pulse 1s infinite'
          }} />
        )}
      </div>
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
        {isLoading ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div className="loading-dots">
              <span style={{ background: color }} />
              <span style={{ background: color }} />
              <span style={{ background: color }} />
            </div>
          </div>
        ) : output ? (
          <p style={{ 
            fontSize: '0.9rem', 
            lineHeight: '1.5', 
            color: 'rgba(255,255,255,0.9)',
            margin: 0,
            whiteSpace: 'pre-wrap',
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            {displayed}
            {isTyping && <span className="cursor-blink">|</span>}
          </p>
        ) : (
          <p style={{ 
            fontSize: '0.85rem', 
            color: 'rgba(255,255,255,0.3)',
            fontStyle: 'italic',
            margin: 0
          }}>
            Waiting for input...
          </p>
        )}
      </div>
      
      {/* Media Section */}
      {output && mediaType && (
        <div style={{ marginTop: '12px', position: 'relative', zIndex: 1 }}>
          {mediaUrl ? (
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '8px', 
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {mediaType === 'audio' && (
                <WaveformPlayer url={mediaUrl} color={color} />
              )}
              {mediaType === 'image' && (
                <div style={{ position: 'relative', cursor: 'pointer' }}>
                  <img 
                    data-src={mediaUrl.startsWith('data:') ? mediaUrl : `data:image/png;base64,${mediaUrl}`}
                    alt="Generated" 
                    onClick={() => setShowPreview(true)}
                    style={{ 
                      width: '100%', 
                      borderRadius: '6px', 
                      maxHeight: '160px', 
                      objectFit: 'cover',
                      transition: 'all 0.2s',
                      filter: 'brightness(0.9)'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.filter = 'brightness(1)';
                      e.target.style.transform = 'scale(1.02)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.filter = 'brightness(0.9)';
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                  <button
                    onClick={() => setShowPreview(true)}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(59, 130, 246, 0.9)',
                      border: 'none',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      zIndex: 2,
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.opacity = '1';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.opacity = '0';
                    }}
                  >
                    <Eye size={14} />
                    Expand
                  </button>
                </div>
              )}
              {mediaType === 'video' && (
                <div style={{ borderRadius: '6px', overflow: 'hidden', width: '100%', position: 'relative' }}>
                  <Plyr
                    source={{
                      type: 'video',
                      sources: [{ src: mediaUrl, type: 'video/mp4' }]
                    }}
                    options={{
                      controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
                      settings: ['quality', 'speed']
                    }}
                  />
                  <button
                    onClick={() => setShowPreview(true)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(59, 130, 246, 0.9)',
                      border: 'none',
                      color: 'white',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      zIndex: 10
                    }}
                  >
                    <Maximize2 size={12} />
                    Fullscreen
                  </button>
                </div>
              )}
            </div>
          ) : onGenerateMedia ? (
            <button
              onClick={onGenerateMedia}
              disabled={isGeneratingMedia}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: isGeneratingMedia ? 'rgba(255,255,255,0.1)' : `${color}20`,
                border: `1px dashed ${color}60`,
                color: color,
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: isGeneratingMedia ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              {isGeneratingMedia ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  Generating {mediaType}...
                </>
              ) : (
                <>
                  {mediaType === 'audio' && <Music size={14} />}
                  {mediaType === 'image' && <ImageIcon size={14} />}
                  {mediaType === 'video' && <Video size={14} />}
                  Generate Real {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
                </>
              )}
            </button>
          ) : null}
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        mediaUrl={mediaUrl}
        mediaType={mediaType}
        title={title}
      />
    </div>
  );
}

export default function StudioOrchestrator({ 
  isOpen, 
  onClose, 
  onCreateProject,
  authToken = null,
  existingProject = null 
}) {
  const containerRef = useRef(null);
  useLazyLoadImages(containerRef);
  
  const [songIdea, setSongIdea] = useState(existingProject?.name || '');
  const [language, setLanguage] = useState('English');
  const [style, setStyle] = useState('Modern Hip-Hop');
  const [model, setModel] = useState('Gemini 2.0 Flash');
  const [selectedAgents, setSelectedAgents] = useState({
    hook: 'ghost',
    beat: 'beat-arch',
    visual: 'album',
    pitch: 'release'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [outputs, setOutputs] = useState({
    hook: null,
    beat: null,
    visual: null,
    pitch: null
  });
  const [mediaUrls, setMediaUrls] = useState({
    audio: null,
    image: null,
    video: null
  });
  const [generatingMedia, setGeneratingMedia] = useState({
    audio: false,
    image: false,
    video: false
  });
  const [masterOutput, setMasterOutput] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  
  const inputRef = useRef(null);
  
  const EXAMPLE_IDEAS = [
    "Summer love in Brooklyn",
    "Trap anthem about success",
    "Lo-fi study beats",
    "Emotional R&B ballad"
  ];
  
  // Get auth headers
  const getHeaders = async () => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };
  
  const handleGenerate = async () => {
    if (!songIdea.trim()) return;
    
    if (!authToken) {
      toast.error('Please log in to use the Studio Orchestrator');
      return;
    }
    
    setIsGenerating(true);
    setMasterOutput(null);
    setOutputs({ hook: null, beat: null, visual: null, pitch: null });
    setMediaUrls({ audio: null, image: null, video: null });
    
    const headers = await getHeaders();
    
    // Map display model name to API model ID
    const modelMapping = {
      'Gemini 2.0 Flash': 'gemini-2.0-flash',
      'Gemini 2.0 Pro (Exp)': 'gemini-2.0-flash-exp',
      'Gemini 1.5 Flash': 'gemini-1.5-flash',
      'Gemini 1.5 Pro': 'gemini-1.5-pro'
    };
    const apiModel = modelMapping[model] || 'gemini-2.0-flash';
    
    // Get selected agent objects
    const agentHook = AGENTS.find(a => a.id === selectedAgents.hook) || AGENTS[0];
    const agentBeat = AGENTS.find(a => a.id === selectedAgents.beat) || AGENTS[1];
    const agentVisual = AGENTS.find(a => a.id === selectedAgents.visual) || AGENTS[2];
    const agentPitch = AGENTS.find(a => a.id === selectedAgents.pitch) || AGENTS[3];

    // Generate all text outputs in parallel
    const prompts = {
      hook: {
        prompt: `Write a 4-line song hook for: "${songIdea}". Language: ${language}. Style: ${style}. Make it catchy, memorable. Just the lyrics, no explanation.`,
        systemInstruction: `${agentHook.systemPrompt || `You are ${agentHook.name}, a ${agentHook.role || agentHook.description}.`} Write only the hook lyrics in ${language}.`
      },
      beat: {
        prompt: `Describe the perfect beat/instrumental for a song about: "${songIdea}". Style: ${style}. Include BPM, key, instruments, vibe. 50 words max.`,
        systemInstruction: `${agentBeat.systemPrompt || `You are ${agentBeat.name}, a ${agentBeat.role || agentBeat.description}.`} Describe the beat production only.`
      },
      visual: {
        prompt: `Describe the music video or album cover visual concept for: "${songIdea}". Style: ${style}. Include colors, mood, setting. 50 words max.`,
        systemInstruction: `${agentVisual.systemPrompt || `You are ${agentVisual.name}, a ${agentVisual.role || agentVisual.description}.`} Describe the visual concept only.`
      },
      pitch: {
        prompt: `Write a one-paragraph elevator pitch for a song about: "${songIdea}". Language: ${language}. Style: ${style}. Make it compelling for a record label. Under 60 words.`,
        systemInstruction: `${agentPitch.systemPrompt || `You are ${agentPitch.name}, a ${agentPitch.role || agentPitch.description}.`} Write in ${language}.`
      }
    };
    
    try {
      const requests = Object.entries(prompts).map(async ([key, { prompt, systemInstruction }]) => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ prompt, systemInstruction, model: apiModel })
          });
          const data = await res.json();
          return [key, data.output?.trim() || 'Generation failed'];
        } catch {
          return [key, `[Demo] ${key} content would appear here...`];
        }
      });
      
      const results = await Promise.all(requests);
      const newOutputs = Object.fromEntries(results);
      setOutputs(newOutputs);
      setIsGenerating(false);
      
      // Orchestrate with AMO
      setIsOrchestrating(true);
      try {
        const agentOutputs = [
          { agent: 'Ghostwriter', type: 'hook', content: newOutputs.hook },
          { agent: 'Beat Architect', type: 'beat', content: newOutputs.beat },
          { agent: 'Visual Director', type: 'visual', content: newOutputs.visual },
          { agent: 'Pitch Writer', type: 'pitch', content: newOutputs.pitch }
        ];
        
        const orchestrateRes = await fetch(`${BACKEND_URL}/api/orchestrate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            agentOutputs,
            projectName: songIdea,
            projectDescription: `Studio Orchestrator project: ${songIdea}`
          })
        });
        
        const orchestrateData = await orchestrateRes.json();
        if (orchestrateRes.ok && orchestrateData.output) {
          setMasterOutput(orchestrateData.output);
        }
      } catch (err) {
        console.log('AMO orchestration error:', err);
      } finally {
        setIsOrchestrating(false);
      }
      
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Generation failed. Please try again.');
      setIsGenerating(false);
    }
  };
  
  // Generate real audio with MusicGen
  const handleGenerateAudio = async () => {
    if (!outputs.beat) return;
    
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }
    
    setGeneratingMedia(prev => ({ ...prev, audio: true }));
    toast.loading('Generating audio with MusicGen...', { id: 'gen-audio' });
    
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BACKEND_URL}/api/generate-audio`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `${outputs.beat} for a song about ${songIdea}`,
          durationSeconds: 15,
          genre: 'hip-hop',
          mood: 'energetic'
        })
      });
      
      const data = await res.json();
      if (data.audioUrl) {
        setMediaUrls(prev => ({ ...prev, audio: data.audioUrl }));
        toast.success('Audio generated!', { id: 'gen-audio' });
      } else {
        throw new Error(data.error || 'No audio returned');
      }
    } catch (err) {
      console.error('Audio generation error:', err);
      toast.error(`Audio: ${err.message}`, { id: 'gen-audio' });
    } finally {
      setGeneratingMedia(prev => ({ ...prev, audio: false }));
    }
  };
  
  // Generate real image with Gemini Nano Banana
  const handleGenerateImage = async () => {
    if (!outputs.visual) return;
    
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }
    
    setGeneratingMedia(prev => ({ ...prev, image: true }));
    toast.loading('Generating image with Gemini Nano Banana...', { id: 'gen-image' });
    
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BACKEND_URL}/api/generate-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `${outputs.visual}. Album cover art style, vibrant, professional.`,
          aspectRatio: '1:1'
        })
      });
      
      const data = await res.json();
      if (data.images && data.images[0]) {
        setMediaUrls(prev => ({ ...prev, image: data.images[0] }));
        toast.success('Image generated!', { id: 'gen-image' });
      } else {
        throw new Error(data.error || 'No image returned');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      toast.error(`Image: ${err.message}`, { id: 'gen-image' });
    } finally {
      setGeneratingMedia(prev => ({ ...prev, image: false }));
    }
  };
  
  // Generate real video with Veo 3.1
  const handleGenerateVideo = async () => {
    if (!outputs.visual) return;
    
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }
    
    setGeneratingMedia(prev => ({ ...prev, video: true }));
    toast.loading('Generating video with Veo 3.1 Preview (takes ~2-3 min)...', { id: 'gen-video', duration: 300000 });
    
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BACKEND_URL}/api/generate-video`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `Music video scene: ${outputs.visual}. Cinematic, high quality, smooth motion.`
        })
      });
      
      const data = await res.json();
      if (data.output) {
        setMediaUrls(prev => ({ ...prev, video: data.output }));
        toast.success('Video generated!', { id: 'gen-video' });
      } else {
        throw new Error(data.error || 'No video returned');
      }
    } catch (err) {
      console.error('Video generation error:', err);
      toast.error(`Video: ${err.message}`, { id: 'gen-video' });
    } finally {
      setGeneratingMedia(prev => ({ ...prev, video: false }));
    }
  };
  
  // Create project from orchestrator outputs
  const handleCreateProject = () => {
    const assets = [];
    
    // Add text outputs as assets
    if (outputs.hook) {
      assets.push({
        id: String(Date.now()),
        title: 'Song Hook',
        type: 'lyrics',
        agent: 'Ghostwriter',
        content: outputs.hook,
        snippet: outputs.hook.substring(0, 100),
        date: 'Just now',
        color: 'agent-purple'
      });
    }
    
    if (outputs.beat) {
      assets.push({
        id: String(Date.now() + 1),
        title: 'Beat Description',
        type: 'beat',
        agent: 'Beat Architect',
        content: outputs.beat,
        snippet: outputs.beat.substring(0, 100),
        audioUrl: mediaUrls.audio,
        date: 'Just now',
        color: 'agent-cyan'
      });
    }
    
    if (outputs.visual) {
      assets.push({
        id: String(Date.now() + 2),
        title: 'Visual Concept',
        type: 'visual',
        agent: 'Visual Director',
        content: outputs.visual,
        snippet: outputs.visual.substring(0, 100),
        imageUrl: mediaUrls.image ? `data:image/png;base64,${mediaUrls.image}` : null,
        videoUrl: mediaUrls.video,
        date: 'Just now',
        color: 'agent-pink'
      });
    }
    
    if (outputs.pitch) {
      assets.push({
        id: String(Date.now() + 3),
        title: 'Industry Pitch',
        type: 'pitch',
        agent: 'Pitch Writer',
        content: outputs.pitch,
        snippet: outputs.pitch.substring(0, 100),
        date: 'Just now',
        color: 'agent-orange'
      });
    }
    
    // Add master output
    if (masterOutput) {
      assets.push({
        id: String(Date.now() + 4),
        title: 'AMO Master Production',
        type: 'master',
        agent: 'AMO Orchestrator',
        content: masterOutput,
        snippet: masterOutput.substring(0, 100),
        date: 'Just now',
        color: 'agent-purple'
      });
    }
    
    const project = {
      id: String(Date.now() + 5),
      name: projectName || songIdea || 'Untitled Project',
      description: `Created with Studio Orchestrator from: "${songIdea}"`,
      category: 'Music',
      language,
      style,
      model,
      date: new Date().toLocaleDateString(),
      agents: ['Ghostwriter', 'Beat Architect', 'Visual Director', 'Pitch Writer', 'AMO Orchestrator'],
      assets,
      coverImage: mediaUrls.image ? `data:image/png;base64,${mediaUrls.image}` : null
    };
    
    if (onCreateProject) {
      onCreateProject(project);
    }
    
    toast.success(`Project "${project.name}" created!`);
    setShowCreateProject(false);
    onClose?.();
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="studio-orchestrator-overlay animate-fadeIn"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.95)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: '20px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={24} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>Studio Orchestrator</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              One idea → Full production pipeline
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none', 
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer' 
          }}
        >
          <X size={20} color="white" />
        </button>
      </div>
      
      {/* Main Content */}
      <div ref={containerRef} style={{ flex: 1, padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        
        {/* Configuration Bar */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Language</label>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Portuguese', 'Italian', 'Chinese'].map(lang => (
                <option key={lang} value={lang} style={{ background: '#1a1a1a' }}>{lang}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Style / Genre</label>
            <select 
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {['Modern Hip-Hop', '90s Boom Bap', 'Trap', 'R&B / Soul', 'Pop', 'Rock', 'Electronic / Dance', 'Cinematic', 'Jazz', 'Lo-Fi'].map(s => (
                <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>AI Model</label>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {['Gemini 2.0 Flash', 'Gemini 2.0 Pro (Exp)', 'Gemini 1.5 Flash', 'Gemini 1.5 Pro'].map(m => (
                <option key={m} value={m} style={{ background: '#1a1a1a' }}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Team Selection */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)',
          flexWrap: 'wrap'
        }}>
          <div style={{ width: '100%', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={14} color="var(--text-secondary)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Production Team</span>
          </div>
          
          {[
            { key: 'hook', label: 'Lyrics', color: '#8b5cf6' },
            { key: 'beat', label: 'Production', color: '#06b6d4' },
            { key: 'visual', label: 'Visuals', color: '#ec4899' },
            { key: 'pitch', label: 'Business', color: '#f59e0b' }
          ].map(slot => (
            <div key={slot.key} style={{ flex: 1, minWidth: '140px' }}>
              <select 
                value={selectedAgents[slot.key]}
                onChange={(e) => setSelectedAgents(prev => ({ ...prev, [slot.key]: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${slot.color}44`,
                  color: 'white',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {AGENTS.map(agent => (
                  <option key={agent.id} value={agent.id} style={{ background: '#1a1a1a' }}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Input Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            marginBottom: '12px'
          }}>
            <input
              ref={inputRef}
              type="text"
              value={songIdea}
              onChange={(e) => setSongIdea(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Describe your song idea, vibe, or concept..."
              style={{
                flex: 1,
                padding: '16px 20px',
                borderRadius: '14px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white',
                fontSize: '1.1rem',
                outline: 'none'
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !songIdea.trim()}
              style={{
                padding: '16px 28px',
                borderRadius: '14px',
                background: isGenerating ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                border: 'none',
                color: 'white',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: isGenerating || !songIdea.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: !songIdea.trim() ? 0.5 : 1
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={20} className="spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate All
                </>
              )}
            </button>
          </div>
          
          {/* Quick Examples */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '4px' }}>Try:</span>
            {EXAMPLE_IDEAS.map((idea, i) => (
              <button
                key={i}
                onClick={() => setSongIdea(idea)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {idea}
              </button>
            ))}
          </div>
        </div>
        
        {/* Agent Outputs Grid - 2x2 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <AgentOutputCard
            icon={AGENTS.find(a => a.id === selectedAgents.hook)?.icon || Mic2}
            title={AGENTS.find(a => a.id === selectedAgents.hook)?.name || "Ghostwriter"}
            color="#8b5cf6"
            output={outputs.hook}
            isLoading={isGenerating}
            delay={0}
          />
          <AgentOutputCard
            icon={AGENTS.find(a => a.id === selectedAgents.beat)?.icon || Music}
            title={AGENTS.find(a => a.id === selectedAgents.beat)?.name || "Beat Architect"}
            color="#06b6d4"
            output={outputs.beat}
            isLoading={isGenerating}
            delay={200}
            mediaType="audio"
            mediaUrl={mediaUrls.audio}
            onGenerateMedia={handleGenerateAudio}
            isGeneratingMedia={generatingMedia.audio}
          />
          <AgentOutputCard
            icon={AGENTS.find(a => a.id === selectedAgents.visual)?.icon || ImageIcon}
            title={AGENTS.find(a => a.id === selectedAgents.visual)?.name || "Visual Director"}
            color="#ec4899"
            output={outputs.visual}
            isLoading={isGenerating}
            delay={400}
            mediaType="image"
            mediaUrl={mediaUrls.image}
            onGenerateMedia={handleGenerateImage}
            isGeneratingMedia={generatingMedia.image}
          />
          <AgentOutputCard
            icon={AGENTS.find(a => a.id === selectedAgents.pitch)?.icon || FileText}
            title={AGENTS.find(a => a.id === selectedAgents.pitch)?.name || "Pitch Writer"}
            color="#f59e0b"
            output={outputs.pitch}
            isLoading={isGenerating}
            delay={600}
          />
        </div>
        
        {/* Video Generation (Separate because it's slow) */}
        {outputs.visual && (
          <div style={{
            padding: '16px',
            background: 'rgba(236, 72, 153, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Video size={24} color="#ec4899" />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Generate Music Video Clip</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Uses Veo 3.1 Preview • Takes ~2-3 minutes • 8 second clip
                  </div>
                </div>
              </div>
              
              {mediaUrls.video ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                  <CheckCircle2 size={16} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Video Ready</span>
                </div>
              ) : (
                <button
                  onClick={handleGenerateVideo}
                  disabled={generatingMedia.video}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: generatingMedia.video ? 'rgba(255,255,255,0.1)' : '#ec4899',
                    border: 'none',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: generatingMedia.video ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {generatingMedia.video ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Video size={14} />
                      Generate Video
                    </>
                  )}
                </button>
              )}
            </div>

            {mediaUrls.video && (
              <div style={{ 
                borderRadius: '12px', 
                overflow: 'hidden', 
                width: '100%',
                background: 'black',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <Plyr
                  source={{
                    type: 'video',
                    sources: [{ src: mediaUrls.video, type: 'video/mp4' }]
                  }}
                  options={{
                    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
                    settings: ['quality', 'speed']
                  }}
                />
              </div>
            )}
          </div>
        )}
        
        {/* AMO Master Output */}
        {(isOrchestrating || masterOutput) && (
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={22} color="white" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>AMO Master Output</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  All agents combined into one cohesive production plan
                </p>
              </div>
              {isOrchestrating && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={16} className="spin" color="#8b5cf6" />
                  <span style={{ fontSize: '0.85rem', color: '#8b5cf6' }}>Orchestrating...</span>
                </div>
              )}
            </div>
            
            {masterOutput && (
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                padding: '16px',
                maxHeight: '250px',
                overflowY: 'auto'
              }}>
                <p style={{ 
                  fontSize: '0.9rem', 
                  lineHeight: '1.6', 
                  color: 'rgba(255,255,255,0.9)',
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {masterOutput}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer Actions */}
      {(outputs.hook || outputs.beat || outputs.visual || outputs.pitch) && (
        <div style={{
          padding: '20px 24px',
          background: 'rgba(0,0,0,0.7)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          bottom: 0
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {Object.values(outputs).filter(Boolean).length} agent outputs • 
            {Object.values(mediaUrls).filter(Boolean).length} media assets
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowCreateProject(true)}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                border: 'none',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FolderPlus size={18} />
              Create Project
            </button>
          </div>
        </div>
      )}
      
      {/* Create Project Modal */}
      {showCreateProject && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000
          }}
          onClick={() => setShowCreateProject(false)}
        >
          <div 
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem' }}>Create Project</h3>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={songIdea || "Project name..."}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem',
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCreateProject(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS */}
      <style>{`
        .loading-dots {
          display: flex;
          gap: 4px;
        }
        .loading-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
        .loading-dots span:nth-child(3) { animation-delay: 0s; }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        
        .cursor-blink {
          animation: blink 0.8s infinite;
          color: #06b6d4;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
