import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Sparkles, Video, Share2, Music } from 'lucide-react';
import { BACKEND_URL } from '../constants';

export default function VideoPitchDemo({ initialTopic = "My new summer anthem" }) {
  const [topic, setTopic] = useState(initialTopic);
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

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
      // Call Backend for Script
      const res = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a 7-second viral TikTok video script for a song about: "${topic}". 
          Format: 
          [SCENE 1]: text
          [SCENE 2]: text
          [SCENE 3]: text
          Keep it under 15 words total. Punchy.`,
          systemInstruction: "You are a viral content strategist."
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
    <div className="video-pitch-demo" style={{
      background: 'var(--card-bg)',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid var(--border-color)',
      maxWidth: '400px',
      margin: '0 auto',
      boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
    }}>
      <div className="demo-header" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Video size={20} className="text-cyan" /> 
          Instant Pitch Generator
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Create a 7-second viral hook in one click.
        </p>
      </div>

      {/* Phone Preview Frame */}
      <div className="phone-frame" style={{
        width: '100%',
        aspectRatio: '9/16',
        background: '#000',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '20px',
        border: '4px solid #333'
      }}>
        {/* Video Content Layer */}
        <div className="video-content" style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(45deg, #4f46e5, #ec4899)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Animated Background Elements */}
          <div className="floating-notes" style={{ position: 'absolute', opacity: 0.3 }}>
            <Music size={100} />
          </div>

          {/* Text Overlay */}
          {script ? (
            <div className="script-display animate-fadeInUp">
              {progress < 33 && <h2 style={{ fontSize: '2rem', fontWeight: '900', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>{script[0]?.replace(/\[.*?\]:?/g, '')}</h2>}
              {progress >= 33 && progress < 66 && <h2 style={{ fontSize: '2rem', fontWeight: '900', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>{script[1]?.replace(/\[.*?\]:?/g, '')}</h2>}
              {progress >= 66 && <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-cyan)', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>{script[2]?.replace(/\[.*?\]:?/g, '')}</h2>}
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.5)' }}>
              <Sparkles size={48} style={{ marginBottom: '16px' }} />
              <p>Your viral video starts here</p>
            </div>
          )}

          {/* Progress Bar */}
          {isPlaying && (
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              height: '4px',
              background: 'white',
              width: `${progress}%`,
              transition: 'width 0.1s linear'
            }} />
          )}
        </div>

        {/* UI Overlays (TikTok style) */}
        <div style={{ position: 'absolute', right: '10px', bottom: '100px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={20} /></div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={20} /></div>
        </div>
      </div>

      {/* Controls */}
      <div className="demo-controls" style={{ display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Song topic (e.g. Heartbreak)"
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            color: 'white'
          }}
        />
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            background: 'var(--gradient-primary)',
            border: 'none',
            borderRadius: '8px',
            padding: '0 20px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isGenerating ? <RefreshCw className="spin" size={18} /> : <Play size={18} fill="currentColor" />}
          {isGenerating ? '...' : 'Go'}
        </button>
      </div>
    </div>
  );
}
