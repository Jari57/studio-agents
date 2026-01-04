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
    <div className="viral-pitch-card">
      <div className="viral-pitch-header">
        <div className="viral-pitch-icon">
          <Video className="w-5 h-5" />
        </div>
        <div>
          <h3 className="viral-pitch-title">Instant Pitch Generator</h3>
          <p className="viral-pitch-subtitle">Create a 7-second viral hook in one click</p>
        </div>
      </div>

      {/* Controls */}
      <div className="viral-pitch-controls">
          <div className="grid grid-cols-2 gap-3">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="viral-pitch-select"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Japanese</option>
            </select>
            <select 
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="viral-pitch-select"
            >
              <option>Modern Hip-Hop</option>
              <option>Cinematic Pop</option>
              <option>Lo-Fi Chill</option>
              <option>Aggressive Phonk</option>
              <option>Acoustic Indie</option>
            </select>
          </div>
          <select 
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="viral-pitch-select"
          >
            <option>Gemini 2.0 Flash</option>
            <option>Gemini 2.0 Pro (Exp)</option>
            <option>Gemini 1.5 Flash</option>
            <option>Gemini 1.5 Pro</option>
          </select>

        <input 
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What's your song about?"
          className="viral-pitch-input"
        />
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="viral-pitch-generate-btn"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isGenerating ? 'Generating...' : 'Generate Pitch'}
        </button>
      </div>

      {/* Preview Area */}
      <div className="viral-pitch-preview group">
        {/* Video Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          {script ? (
            <div className="viral-pitch-script">
              {script.map((line, i) => (
                <div 
                  key={i}
                  className={`viral-pitch-line ${progress > (i * 33) ? '' : 'hidden'}`}
                >
                  {line.replace(/\[SCENE \d\]: /, '')}
                </div>
              ))}
            </div>
          ) : (
            <div className="viral-pitch-empty">
              <Video className="w-8 h-8" />
              <p>Your viral pitch will appear here</p>
            </div>
          )}

          {/* Background "Visualizer" */}
          <div className={`viral-pitch-visualizer ${isPlaying ? 'active' : ''}`}>
            {isPlaying && (
              <div className="viral-pitch-bars">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i}
                    className="viral-pitch-bar"
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
        <div className="viral-pitch-progress">
          <div 
            className="viral-pitch-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Overlay Controls */}
        <div className="viral-pitch-overlay">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="viral-pitch-play-btn"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="viral-pitch-actions">
        <div className="viral-pitch-actions-row">
          <button className="viral-pitch-action-btn">
            <Share2 />
            Share
          </button>
          <button className="viral-pitch-action-btn">
            <Music />
            Audio
          </button>
        </div>
        {script && onCreateProject && (
          <button 
            onClick={handleCreateProject}
            className="viral-pitch-create-btn"
          >
            <FolderPlus />
            Create Project from Pitch
          </button>
        )}
      </div>
    </div>
  );
}
