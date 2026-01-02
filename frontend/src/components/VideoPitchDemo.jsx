import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Sparkles, Video, Share2, Music, FolderPlus, Languages, Settings, Cpu } from 'lucide-react';
import { BACKEND_URL } from '../constants';

export default function VideoPitchDemo({ initialTopic = "My new summer anthem", onCreateProject = null }) {
  const [topic, setTopic] = useState(initialTopic);
  const [language, setLanguage] = useState('English');
  const [style, setStyle] = useState('Modern Hip-Hop');
  const [model, setModel] = useState('Gemini 2.0 Flash');
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const handleCreateProject = () => {
    if (!onCreateProject || !topic) return;

    const newProject = {
      id: String(Date.now()),
      name: topic,
      category: 'social',
      description: `Video pitch project: ${topic}`,
      language,
      style,
      model,
      date: new Date().toLocaleDateString(),
      status: 'active',
      progress: 20,
      assets: [
        { id: 'script-1', type: 'text', title: 'Video Script', content: script?.join('\n'), agent: 'Viral Strategist' }
      ].filter(a => a.content)
    };

    onCreateProject(newProject);
  };

  // Simulated "Video" playback
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + 1; // 7 seconds approx duration logic
        });
      }, 70); // 70ms * 100 = 7000ms = 7s
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setScript(null);
    setProgress(0);
    
    try {
      // Map display model name to API model ID
      const modelMapping = {
        'Gemini 2.0 Flash': 'gemini-2.0-flash',
        'Gemini 2.0 Pro (Exp)': 'gemini-2.0-flash-exp',
        'Gemini 1.5 Flash': 'gemini-1.5-flash',
        'Gemini 1.5 Pro': 'gemini-1.5-pro'
      };
      const apiModel = modelMapping[model] || 'gemini-2.0-flash';

      // Call Backend for Script
      const res = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a 7-second viral TikTok video script for a song about: "${topic}". 
          Language: ${language}. Style: ${style}.
          Format: 
          [SCENE 1]: text
          [SCENE 2]: text
          [SCENE 3]: text
          Keep it under 15 words total. Punchy.`,
          systemInstruction: "You are a viral content strategist.",
          model: apiModel
        })
      });
      
      const data = await res.json();
      
      // Parse the output (simple heuristic)
      const lines = data.output.split('\n').filter(l => l.trim().length > 0).slice(0, 3);
      setScript(lines);
      setIsPlaying(true);
      
    } catch (e) {
      console.error("Generation failed", e);
      // Fallback
      setScript([
        "POV: You found the song of the summer ☀️",
        "Wait for the drop... 🎵",
        "Stream 'Heatwave' now! 🔥"
      ]);
      setIsPlaying(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-2xl max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          <Video className="w-6 h-6 text-blue-500" />
          Instant Pitch Generator
        </h3>
        <p className="text-zinc-400 text-sm">Create a 7-second viral hook in one click.</p>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Japanese</option>
              </select>
            </div>
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select 
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option>Modern Hip-Hop</option>
                <option>Cinematic Pop</option>
                <option>Lo-Fi Chill</option>
                <option>Aggressive Phonk</option>
                <option>Acoustic Indie</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option>Gemini 2.0 Flash</option>
              <option>Gemini 2.0 Pro (Exp)</option>
              <option>Gemini 1.5 Flash</option>
              <option>Gemini 1.5 Pro</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <input 
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What's your song about?"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all text-sm"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? '...' : 'Go'}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="relative aspect-[9/16] max-w-[240px] mx-auto bg-black rounded-3xl overflow-hidden border-4 border-zinc-800 shadow-2xl group">
        {/* Video Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          {script ? (
            <div className="space-y-6 z-10">
              {script.map((line, i) => (
                <div 
                  key={i}
                  className={`transition-all duration-500 transform ${
                    progress > (i * 33) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-bold text-white border border-white/10">
                    {line.replace(/\[SCENE \d\]: /, '')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-500 flex flex-col items-center gap-4">
              <Video className="w-10 h-10 opacity-20" />
              <p className="text-xs">Your viral pitch will appear here</p>
            </div>
          )}

          {/* Background "Visualizer" */}
          <div className="absolute inset-0 opacity-30">
            <div className={`absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
            {isPlaying && (
              <div className="absolute inset-0 flex items-end justify-around p-4 gap-1">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 bg-white/40 rounded-full animate-pulse"
                    style={{ 
                      height: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
          <div 
            className="h-full bg-blue-500 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          >
            {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs transition-colors">
            <Share2 className="w-3 h-3" />
            Share
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs transition-colors">
            <Music className="w-3 h-3" />
            Audio
          </button>
        </div>
        {script && onCreateProject && (
          <button 
            onClick={handleCreateProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            Create Project from Pitch
          </button>
        )}
      </div>
    </div>
  );
}
