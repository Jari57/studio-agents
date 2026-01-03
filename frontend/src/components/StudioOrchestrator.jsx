import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, Sparkles, Mic2, FileText, Video, Hash, RefreshCw, Zap, 
  Music, Image as ImageIcon, Download, Save, FolderPlus, Volume2, X,
  Check, Loader2, Maximize2, Users, Eye
} from 'lucide-react';
import { Plyr } from 'plyr-react';
import 'plyr-react/plyr.css';
import { BACKEND_URL, AGENTS } from '../constants';
import { useLazyLoadImages } from '../hooks/useLazyLoadImages';
import toast from 'react-hot-toast';
import PreviewModal from './PreviewModal';

// Professional Audio Player Component (using native HTML5)
const AudioPlayer = ({ url, color }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
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
      <audio 
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        style={{ flex: 1 }}
        controlsList="nodownload"
      >
        <source src={url} type="audio/mpeg" />
        <source src={url} type="audio/wav" />
        Your browser does not support the audio element.
      </audio>
      <div style={{ 
        display: 'flex', 
        gap: '4px',
        fontSize: '0.65rem', 
        color: 'rgba(255,255,255,0.4)',
        minWidth: '60px',
        justifyContent: 'flex-end'
      }}>
        <span>{formatTime(currentTime)}</span>
        <span>/</span>
        <span>{formatTime(duration)}</span>
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
                <AudioPlayer url={mediaUrl} color={color} />
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
  existingProject = null,
  onUpdateCreations = null // Callback to update agent creations in parent
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
  
  // Unified canvas state
  const [activeTrack, setActiveTrack] = useState('hook'); // which track is in focus
  const [playbackTime, setPlaybackTime] = useState(0); // timeline position
  const [canvasMode, setCanvasMode] = useState('timeline'); // 'timeline', 'composition', or 'gallery'
  
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
        console.log('🎛️ Orchestrate response:', { status: orchestrateRes.status, ok: orchestrateRes.ok, data: orchestrateData }); // DEBUG
        
        if (!orchestrateRes.ok) {
          console.error('❌ Orchestrate failed:', orchestrateData.error || orchestrateData); // DEBUG
          console.log('Continuing with individual assets (AMO orchestration unavailable)');
        } else if (orchestrateData.output) {
          console.log('✅ Setting master output:', orchestrateData.output.substring(0, 100)); // DEBUG
          setMasterOutput(orchestrateData.output);
          toast.success('Master output generated!');
        } else {
          console.warn('⚠️ No output in orchestrate response:', orchestrateData); // DEBUG
        }
      } catch (err) {
        console.error('🔴 AMO orchestration error:', err); // DEBUG
        console.log('Orchestration unavailable, continuing with individual assets');
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
      console.log('Audio response:', data); // DEBUG
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      
      // Handle both real audio and text fallback
      if (data.audioUrl) {
        console.log('Setting audio URL:', data.audioUrl); // DEBUG
        setMediaUrls(prev => ({ ...prev, audio: data.audioUrl }));
        // Update agent creations in parent
        if (onUpdateCreations) {
          onUpdateCreations('beat', { audio: data.audioUrl });
        }
        toast.success('Audio generated!', { id: 'gen-audio' });
      } else if (data.description || data.output) {
        // Fallback: Show text description if real audio failed
        console.log('Audio fallback (text description):', data.description || data.output);
        toast.info(`Audio fallback: ${data.message || 'Real audio unavailable'}`, { id: 'gen-audio', duration: 4 });
        // Still update beat description
        toast.info('See beat description above', { id: 'gen-audio-2' });
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
      console.log('Image response:', data); // DEBUG
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (data.images && data.images[0]) {
        console.log('Setting image:', data.images[0].substring(0, 50)); // DEBUG
        setMediaUrls(prev => ({ ...prev, image: data.images[0] }));
        // Update agent creations in parent
        if (onUpdateCreations) {
          onUpdateCreations('album', { image: data.images[0] });
        }
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
    if (!outputs.visual) {
      toast.error('Generate visual concept first');
      return;
    }
    
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }
    
    setGeneratingMedia(prev => ({ ...prev, video: true }));
    toast.loading('Generating video with Veo (takes ~2-3 min)...', { id: 'gen-video', duration: 300000 });
    
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
      console.log('Video response:', data); // DEBUG
      
      if (res.status === 503) {
        toast.error('Video generation currently unavailable. Veo API not configured.', { id: 'gen-video', duration: 5 });
        throw new Error('Video API unavailable (Veo models not accessible)');
      }
      
      if (!res.ok) {
        throw new Error(data.details || data.error || `HTTP ${res.status}`);
      }
      if (data.output) {
        console.log('Setting video:', data.output.substring(0, 50)); // DEBUG
        setMediaUrls(prev => ({ ...prev, video: data.output }));
        // Update agent creations in parent
        if (onUpdateCreations) {
          onUpdateCreations('video-creator', { video: data.output });
        }
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
        
        {/* UNIFIED CANVAS - Timeline View (Like CapCut/Captions.com) */}
        {Object.values(outputs).some(o => o) && (
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '20px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Canvas Mode Toggle */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setCanvasMode('timeline')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: canvasMode === 'timeline' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${canvasMode === 'timeline' ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                  color: canvasMode === 'timeline' ? '#8b5cf6' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Music size={14} />
                Timeline View
              </button>
              <button
                onClick={() => setCanvasMode('composition')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: canvasMode === 'composition' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${canvasMode === 'composition' ? '#ec4899' : 'rgba(255,255,255,0.1)'}`,
                  color: canvasMode === 'composition' ? '#ec4899' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Maximize2 size={14} />
                Final Mix
              </button>
              <button
                onClick={() => setCanvasMode('gallery')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: canvasMode === 'gallery' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${canvasMode === 'gallery' ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                  color: canvasMode === 'gallery' ? '#22c55e' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Eye size={14} />
                Assets Gallery
              </button>
            </div>

            {/* Timeline View */}
            {canvasMode === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Production Pipeline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: outputs.hook ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }} />
                    Hook
                  </span>
                  <span style={{ color: outputs.hook ? '#8b5cf6' : 'rgba(255,255,255,0.2)' }}>→</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: outputs.beat ? '#06b6d4' : 'rgba(255,255,255,0.1)' }} />
                    Beat
                  </span>
                  <span style={{ color: outputs.beat ? '#06b6d4' : 'rgba(255,255,255,0.2)' }}>→</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: outputs.visual ? '#ec4899' : 'rgba(255,255,255,0.1)' }} />
                    Visual
                  </span>
                  <span style={{ color: outputs.visual ? '#ec4899' : 'rgba(255,255,255,0.2)' }}>→</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: outputs.pitch ? '#f59e0b' : 'rgba(255,255,255,0.1)' }} />
                    Pitch
                  </span>
                </div>

                {/* Track Strips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Lyrics Track */}
                  {outputs.hook && (
                    <div 
                      onClick={() => setActiveTrack('hook')}
                      style={{
                        background: activeTrack === 'hook' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0,0,0,0.4)',
                        border: `1px solid ${activeTrack === 'hook' ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Mic2 size={16} color="#8b5cf6" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#8b5cf6' }}>Song Hook</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Ghostwriter Output</div>
                        </div>
                        {isGenerating && <Loader2 size={14} className="spin" color="#8b5cf6" />}
                      </div>
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'auto' }}>
                        {outputs.hook}
                      </div>
                    </div>
                  )}

                  {/* Audio Track */}
                  {outputs.beat && (
                    <div 
                      onClick={() => setActiveTrack('beat')}
                      style={{
                        background: activeTrack === 'beat' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(0,0,0,0.4)',
                        border: `1px solid ${activeTrack === 'beat' ? '#06b6d4' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid #06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Music size={16} color="#06b6d4" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#06b6d4' }}>Beat & Audio</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{mediaUrls.audio ? 'Audio Generated' : 'Beat Description'}</div>
                        </div>
                        {generatingMedia.audio && <Loader2 size={14} className="spin" color="#06b6d4" />}
                      </div>
                      {mediaUrls.audio ? (
                        <AudioPlayer url={mediaUrls.audio} color="#06b6d4" />
                      ) : (
                        <>
                          <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                            {outputs.beat}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleGenerateAudio(); }}
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '6px',
                              background: 'rgba(6, 182, 212, 0.2)',
                              border: '1px solid #06b6d4',
                              color: '#06b6d4',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Generate Audio
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Visual Track */}
                  {outputs.visual && (
                    <div 
                      onClick={() => setActiveTrack('visual')}
                      style={{
                        background: activeTrack === 'visual' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(0,0,0,0.4)',
                        border: `1px solid ${activeTrack === 'visual' ? '#ec4899' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.2)', border: '1px solid #ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ImageIcon size={16} color="#ec4899" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#ec4899' }}>Visuals</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{mediaUrls.image || mediaUrls.video ? 'Assets Generated' : 'Visual Description'}</div>
                        </div>
                        {(generatingMedia.image || generatingMedia.video) && <Loader2 size={14} className="spin" color="#ec4899" />}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {mediaUrls.image && (
                          <img 
                            src={mediaUrls.image.startsWith('data:') ? mediaUrls.image : `data:image/png;base64,${mediaUrls.image}`}
                            alt="Generated"
                            style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                        )}
                        {!mediaUrls.image && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleGenerateImage(); }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: 'rgba(236, 72, 153, 0.2)',
                              border: '1px solid #ec4899',
                              color: '#ec4899',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Gen Image
                          </button>
                        )}
                        {!mediaUrls.video && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleGenerateVideo(); }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: 'rgba(236, 72, 153, 0.2)',
                              border: '1px solid #ec4899',
                              color: '#ec4899',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Gen Video
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pitch Track */}
                  {outputs.pitch && (
                    <div 
                      onClick={() => setActiveTrack('pitch')}
                      style={{
                        background: activeTrack === 'pitch' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0,0,0,0.4)',
                        border: `1px solid ${activeTrack === 'pitch' ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={16} color="#f59e0b" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f59e0b' }}>Industry Pitch</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>For Record Labels</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'auto' }}>
                        {outputs.pitch}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Final Mix View */}
            {canvasMode === 'composition' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '400px' }}>
                {/* Top: Audio + Visuals Synced */}
                <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '200px' }}>
                  {/* Left: Audio Waveform */}
                  {(mediaUrls.audio || outputs.beat) && (
                    <div style={{
                      flex: '0 0 150px',
                      background: 'rgba(6, 182, 212, 0.1)',
                      borderRadius: '10px',
                      padding: '12px',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      overflow: 'auto'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#06b6d4', textTransform: 'uppercase' }}>Beat</div>
                      {mediaUrls.audio ? (
                        <AudioPlayer url={mediaUrls.audio} color="#06b6d4" />
                      ) : (
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-wrap' }}>
                          {outputs.beat}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Center: Visual Preview */}
                  <div style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {mediaUrls.video && (
                      <Plyr
                        source={{
                          type: 'video',
                          sources: [{ src: mediaUrls.video, type: 'video/mp4' }]
                        }}
                        options={{
                          controls: ['play', 'progress', 'fullscreen'],
                          settings: []
                        }}
                      />
                    )}
                    {!mediaUrls.video && mediaUrls.image && (
                      <img 
                        src={mediaUrls.image.startsWith('data:') ? mediaUrls.image : `data:image/png;base64,${mediaUrls.image}`}
                        alt="Visual"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    {!mediaUrls.image && !mediaUrls.video && outputs.visual && (
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>
                        <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Visual Concept</div>
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.5)' }}>
                          {outputs.visual}
                        </div>
                      </div>
                    )}
                    {!mediaUrls.image && !mediaUrls.video && !outputs.visual && (
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                        <div style={{ fontSize: '0.9rem' }}>Visual assets will appear here</div>
                      </div>
                    )}
                  </div>

                  {/* Right: Pitch */}
                  {outputs.pitch && (
                    <div style={{
                      flex: '0 0 150px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '10px',
                      padding: '12px',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      overflow: 'auto'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#f59e0b', textTransform: 'uppercase' }}>Pitch</div>
                      <div style={{ fontSize: '0.8rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap', flex: 1 }}>
                        {outputs.pitch}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom: Hook Lyrics (Full width) */}
                {outputs.hook && (
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '10px',
                    padding: '12px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#8b5cf6', textTransform: 'uppercase' }}>Song Hook (Lyrics)</div>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                      {outputs.hook}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gallery View - All Assets Preview */}
            {canvasMode === 'gallery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ 
                  padding: '16px', 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  borderRadius: '10px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={16} style={{ color: '#22c55e' }} />
                    <span style={{ fontSize: '0.9rem', color: 'rgba(34, 197, 94, 0.9)' }}>
                      All Outputs & Assets
                    </span>
                  </div>
                  {(outputs.hook || outputs.beat || outputs.visual || outputs.pitch) && (
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      style={{
                        padding: '6px 12px',
                        background: isGenerating ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.3)',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                        color: '#3b82f6',
                        borderRadius: '6px',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      {isGenerating ? '⚙️ Regenerating...' : '🔄 Regenerate All'}
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '16px' }}>
                  {/* Hook Output Card */}
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#8b5cf6', margin: 0 }}>🎤 Hook</h3>
                      {outputs.hook && <span style={{ fontSize: '0.7rem', color: '#8b5cf6' }}>✓</span>}
                    </div>
                    {outputs.hook ? (
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                        {outputs.hook}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '30px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                        Click Generate to create
                      </div>
                    )}
                  </div>

                  {/* Beat Output Card */}
                  <div style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#06b6d4', margin: 0 }}>🎵 Beat</h3>
                      {outputs.beat && <span style={{ fontSize: '0.7rem', color: '#06b6d4' }}>✓</span>}
                    </div>
                    {outputs.beat ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap', maxHeight: '80px', overflow: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                          {outputs.beat}
                        </div>
                        {mediaUrls.audio ? (
                          <AudioPlayer url={mediaUrls.audio} color="#06b6d4" />
                        ) : (
                          <button
                            onClick={handleGenerateAudio}
                            disabled={generatingMedia.audio}
                            style={{
                              padding: '6px 10px',
                              background: generatingMedia.audio ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.25)',
                              border: '1px solid rgba(6, 182, 212, 0.4)',
                              color: '#06b6d4',
                              borderRadius: '6px',
                              cursor: generatingMedia.audio ? 'not-allowed' : 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            {generatingMedia.audio ? '⚙️ Generating...' : '🎧 Generate Audio'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '30px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                        Click Generate to create
                      </div>
                    )}
                  </div>

                  {/* Visual Output Card */}
                  <div style={{
                    background: 'rgba(168, 85, 247, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#a855f7', margin: 0 }}>🎨 Visual</h3>
                      {outputs.visual && <span style={{ fontSize: '0.7rem', color: '#a855f7' }}>✓</span>}
                    </div>
                    {outputs.visual ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap', maxHeight: '80px', overflow: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                          {outputs.visual}
                        </div>
                        {mediaUrls.image ? (
                          <img 
                            src={mediaUrls.image.startsWith('data:') ? mediaUrls.image : `data:image/png;base64,${mediaUrls.image}`}
                            alt="Visual"
                            style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                        ) : (
                          <button
                            onClick={handleGenerateImage}
                            disabled={generatingMedia.image}
                            style={{
                              padding: '6px 10px',
                              background: generatingMedia.image ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.25)',
                              border: '1px solid rgba(168, 85, 247, 0.4)',
                              color: '#a855f7',
                              borderRadius: '6px',
                              cursor: generatingMedia.image ? 'not-allowed' : 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            {generatingMedia.image ? '⚙️ Generating...' : '🖼️ Generate Image'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '30px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                        Click Generate to create
                      </div>
                    )}
                  </div>

                  {/* Pitch Output Card */}
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#f59e0b', margin: 0 }}>📊 Pitch</h3>
                      {outputs.pitch && <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>✓</span>}
                    </div>
                    {outputs.pitch ? (
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                        {outputs.pitch}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '30px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                        Click Generate to create
                      </div>
                    )}
                  </div>

                  {/* Video Card */}
                  <div style={{
                    background: 'rgba(236, 72, 153, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#ec4899', margin: 0 }}>🎬 Video</h3>
                      {mediaUrls.video && <span style={{ fontSize: '0.7rem', color: '#ec4899' }}>✓</span>}
                    </div>
                    {mediaUrls.video ? (
                      <video 
                        src={mediaUrls.video}
                        controls
                        autoPlay
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', background: 'rgba(0,0,0,0.3)' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '30px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                          {outputs.visual ? 'Ready' : 'Generate visual first'}
                        </div>
                        {outputs.visual && (
                          <button
                            onClick={handleGenerateVideo}
                            disabled={generatingMedia.video}
                            style={{
                              padding: '6px 10px',
                              background: generatingMedia.video ? 'rgba(236, 72, 153, 0.2)' : 'rgba(236, 72, 153, 0.25)',
                              border: '1px solid rgba(236, 72, 153, 0.4)',
                              color: '#ec4899',
                              borderRadius: '6px',
                              cursor: generatingMedia.video ? 'not-allowed' : 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            {generatingMedia.video ? '⚙️ Generating...' : '🎞️ Generate Video'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
              onClick={() => {
                // One-click export: bundle everything as JSON
                const exportData = {
                  project: songIdea,
                  timestamp: new Date().toISOString(),
                  language, style, model,
                  outputs: {
                    hook: outputs.hook,
                    beat: outputs.beat,
                    visual: outputs.visual,
                    pitch: outputs.pitch,
                    master: masterOutput
                  },
                  mediaAssets: {
                    audioUrl: mediaUrls.audio ? '[Audio File]' : null,
                    imageUrl: mediaUrls.image ? '[Image File]' : null,
                    videoUrl: mediaUrls.video ? '[Video File]' : null
                  }
                };
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${songIdea || 'project'}-${Date.now()}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success('Project exported!');
              }}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem'
              }}
            >
              <Download size={14} />
              Export
            </button>
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
