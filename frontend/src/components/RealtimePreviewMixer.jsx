import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Square, Volume2, SkipBack, Headphones
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// REALTIME PREVIEW MIXER — Web Audio API Live Mix Preview
// Plays beat + vocal tracks simultaneously with real-time volume control
// No server round-trip needed — browser-native Web Audio API
// ═══════════════════════════════════════════════════════════════════════════════

export default function RealtimePreviewMixer({
  beatUrl,
  vocalUrl,
  beatVolume = 0.60,
  vocalVolume = 0.85,
  onBeatVolumeChange,
  onVocalVolumeChange,
  isMobile = false
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [beatLoaded, setBeatLoaded] = useState(false);
  const [vocalLoaded, setVocalLoaded] = useState(false);
  const [initError, setInitError] = useState(null);

  // Audio refs
  const audioContextRef = useRef(null);
  const beatAudioRef = useRef(null);
  const vocalAudioRef = useRef(null);
  const beatGainRef = useRef(null);
  const vocalGainRef = useRef(null);
  const beatSourceRef = useRef(null);
  const vocalSourceRef = useRef(null);
  const animFrameRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Format media URL (handle base64, objects, arrays)
  const formatSrc = useCallback((url) => {
    if (!url) return null;
    if (typeof url === 'object' && url.url) return url.url;
    if (Array.isArray(url) && url.length > 0) return url[0];
    if (typeof url !== 'string') return null;
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.length > 100 && !url.includes(' ')) return `data:audio/wav;base64,${url}`;
    return url;
  }, []);

  const beatSrc = formatSrc(beatUrl);
  const vocalSrc = formatSrc(vocalUrl);

  // Initialize Web Audio API
  const initAudio = useCallback(() => {
    if (isInitializedRef.current) return;
    
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        setInitError('Web Audio API not supported in this browser');
        return;
      }

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Create gain nodes
      beatGainRef.current = ctx.createGain();
      vocalGainRef.current = ctx.createGain();
      
      beatGainRef.current.gain.value = beatVolume;
      vocalGainRef.current.gain.value = vocalVolume;
      
      beatGainRef.current.connect(ctx.destination);
      vocalGainRef.current.connect(ctx.destination);

      // Create audio elements and connect
      if (beatSrc) {
        const beatAudio = new Audio();
        beatAudio.crossOrigin = 'anonymous';
        beatAudio.preload = 'auto';
        beatAudio.src = beatSrc;
        beatAudioRef.current = beatAudio;

        beatAudio.addEventListener('canplaythrough', () => {
          if (!beatSourceRef.current && audioContextRef.current) {
            try {
              const source = audioContextRef.current.createMediaElementSource(beatAudio);
              source.connect(beatGainRef.current);
              beatSourceRef.current = source;
            } catch (e) {
              // Source may already be connected
              console.warn('[PreviewMixer] Beat source already connected:', e.message);
            }
          }
          setBeatLoaded(true);
        }, { once: true });

        beatAudio.addEventListener('loadedmetadata', () => {
          setDuration(prev => Math.max(prev, beatAudio.duration));
        });

        beatAudio.addEventListener('error', (e) => {
          console.warn('[PreviewMixer] Beat audio load error:', e);
          setBeatLoaded(false);
        });

        beatAudio.load();
      }

      if (vocalSrc) {
        const vocalAudio = new Audio();
        vocalAudio.crossOrigin = 'anonymous';
        vocalAudio.preload = 'auto';
        vocalAudio.src = vocalSrc;
        vocalAudioRef.current = vocalAudio;

        vocalAudio.addEventListener('canplaythrough', () => {
          if (!vocalSourceRef.current && audioContextRef.current) {
            try {
              const source = audioContextRef.current.createMediaElementSource(vocalAudio);
              source.connect(vocalGainRef.current);
              vocalSourceRef.current = source;
            } catch (e) {
              console.warn('[PreviewMixer] Vocal source already connected:', e.message);
            }
          }
          setVocalLoaded(true);
        }, { once: true });

        vocalAudio.addEventListener('loadedmetadata', () => {
          setDuration(prev => Math.max(prev, vocalAudio.duration));
        });

        vocalAudio.addEventListener('error', (e) => {
          console.warn('[PreviewMixer] Vocal audio load error:', e);
          setVocalLoaded(false);
        });

        vocalAudio.load();
      }

      isInitializedRef.current = true;
    } catch (err) {
      console.error('[PreviewMixer] Init error:', err);
      setInitError(err.message);
    }
  }, [beatSrc, vocalSrc, beatVolume, vocalVolume]);

  // Initialize on mount or when URLs change
  useEffect(() => {
    if (beatSrc || vocalSrc) {
      // Reset if sources change
      cleanup();
      isInitializedRef.current = false;
      initAudio();
    }

    return () => cleanup();
  }, [beatSrc, vocalSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update gain nodes when volume changes (real-time)
  useEffect(() => {
    if (beatGainRef.current) {
      beatGainRef.current.gain.setValueAtTime(
        beatVolume,
        audioContextRef.current?.currentTime || 0
      );
    }
  }, [beatVolume]);

  useEffect(() => {
    if (vocalGainRef.current) {
      vocalGainRef.current.gain.setValueAtTime(
        vocalVolume,
        audioContextRef.current?.currentTime || 0
      );
    }
  }, [vocalVolume]);

  // Playback time tracking
  const updateTime = useCallback(() => {
    const beatTime = beatAudioRef.current?.currentTime || 0;
    const vocalTime = vocalAudioRef.current?.currentTime || 0;
    setCurrentTime(Math.max(beatTime, vocalTime));

    // Check if playback ended
    const beatEnded = beatAudioRef.current ? beatAudioRef.current.ended : true;
    const vocalEnded = vocalAudioRef.current ? vocalAudioRef.current.ended : true;
    
    if (beatEnded && vocalEnded && isPlaying) {
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, updateTime]);

  const play = async () => {
    try {
      // Resume AudioContext if suspended (browsers require user interaction)
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const promises = [];
      if (beatAudioRef.current && beatLoaded) {
        promises.push(beatAudioRef.current.play().catch(e => console.warn('[PreviewMixer] Beat play error:', e)));
      }
      if (vocalAudioRef.current && vocalLoaded) {
        promises.push(vocalAudioRef.current.play().catch(e => console.warn('[PreviewMixer] Vocal play error:', e)));
      }
      
      await Promise.all(promises);
      setIsPlaying(true);
    } catch (err) {
      console.error('[PreviewMixer] Play error:', err);
    }
  };

  const pause = () => {
    if (beatAudioRef.current) beatAudioRef.current.pause();
    if (vocalAudioRef.current) vocalAudioRef.current.pause();
    setIsPlaying(false);
  };

  const stop = () => {
    if (beatAudioRef.current) {
      beatAudioRef.current.pause();
      beatAudioRef.current.currentTime = 0;
    }
    if (vocalAudioRef.current) {
      vocalAudioRef.current.pause();
      vocalAudioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const restart = () => {
    stop();
    setTimeout(() => play(), 50);
  };

  const seekTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = ratio * duration;
    if (beatAudioRef.current) beatAudioRef.current.currentTime = time;
    if (vocalAudioRef.current) vocalAudioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const cleanup = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (beatAudioRef.current) {
      beatAudioRef.current.pause();
      beatAudioRef.current.src = '';
    }
    if (vocalAudioRef.current) {
      vocalAudioRef.current.pause();
      vocalAudioRef.current.src = '';
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    beatSourceRef.current = null;
    vocalSourceRef.current = null;
    beatAudioRef.current = null;
    vocalAudioRef.current = null;
    audioContextRef.current = null;
    beatGainRef.current = null;
    vocalGainRef.current = null;
    isInitializedRef.current = false;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBeatLoaded(false);
    setVocalLoaded(false);
    setInitError(null);
  };

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasAnySrc = !!(beatSrc || vocalSrc);
  const isReady = (beatSrc ? beatLoaded : true) && (vocalSrc ? vocalLoaded : true) && hasAnySrc;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!hasAnySrc) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(139, 92, 246, 0.08))',
      borderRadius: '12px',
      padding: isMobile ? '12px' : '14px',
      border: '1px solid rgba(6, 182, 212, 0.2)',
      marginTop: '8px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px'
      }}>
        <Headphones size={14} color="#22d3ee" />
        <span style={{
          fontSize: '0.7rem',
          fontWeight: '700',
          color: '#22d3ee',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Live Preview — Hear Changes In Real-Time
        </span>
        {!isReady && hasAnySrc && (
          <span style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.4)',
            fontStyle: 'italic'
          }}>
            Loading audio...
          </span>
        )}
      </div>

      {initError && (
        <div style={{
          fontSize: '0.75rem',
          color: '#ef4444',
          padding: '8px',
          background: 'rgba(239,68,68,0.1)',
          borderRadius: '8px',
          marginBottom: '8px'
        }}>
          {initError}
        </div>
      )}

      {/* Playback Controls + Waveform */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={restart}
            disabled={!isReady}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: isReady ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
              cursor: isReady ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Restart"
          >
            <SkipBack size={14} />
          </button>

          <button
            onClick={isPlaying ? pause : play}
            disabled={!isReady}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isReady
                ? (isPlaying
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3))')
                : 'rgba(255,255,255,0.03)',
              border: isReady
                ? (isPlaying
                    ? '1.5px solid rgba(239, 68, 68, 0.4)'
                    : '1.5px solid rgba(6, 182, 212, 0.4)')
                : '1px solid rgba(255,255,255,0.08)',
              color: isReady ? (isPlaying ? '#ef4444' : '#22d3ee') : 'rgba(255,255,255,0.15)',
              cursor: isReady ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title={isPlaying ? 'Pause' : 'Play preview'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
          </button>

          <button
            onClick={stop}
            disabled={!isReady || !isPlaying}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: isReady && isPlaying ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
              cursor: isReady && isPlaying ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Stop"
          >
            <Square size={12} />
          </button>
        </div>

        {/* Progress Bar / Waveform */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            onClick={isReady ? seekTo : undefined}
            style={{
              height: '24px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              position: 'relative',
              overflow: 'hidden',
              cursor: isReady ? 'pointer' : 'default',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            {/* Progress fill */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3))',
              transition: isPlaying ? 'none' : 'width 0.1s ease',
              borderRight: progress > 0 ? '2px solid #22d3ee' : 'none'
            }} />
            
            {/* Decorative waveform */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '1px',
              paddingLeft: '4px',
              opacity: 0.3
            }}>
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '2px',
                    height: `${20 + Math.sin(i * 0.5) * 40 + Math.random() * 30}%`,
                    background: i / 40 * 100 < progress ? '#22d3ee' : 'rgba(255,255,255,0.15)',
                    borderRadius: '1px',
                    transition: 'background 0.1s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Time Display */}
        <span style={{
          fontSize: '0.7rem',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'monospace',
          flexShrink: 0,
          minWidth: '65px',
          textAlign: 'right'
        }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Track Status Indicators */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '8px',
        fontSize: '0.65rem'
      }}>
        {beatSrc && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: beatLoaded ? '#22d3ee' : 'rgba(255,255,255,0.3)'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: beatLoaded ? '#22d3ee' : 'rgba(255,255,255,0.2)'
            }} />
            <Volume2 size={10} />
            Beat {beatLoaded ? `${Math.round(beatVolume * 100)}%` : '...'}
          </div>
        )}
        {vocalSrc && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: vocalLoaded ? '#a78bfa' : 'rgba(255,255,255,0.3)'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: vocalLoaded ? '#a78bfa' : 'rgba(255,255,255,0.2)'
            }} />
            <Volume2 size={10} />
            Vocal {vocalLoaded ? `${Math.round(vocalVolume * 100)}%` : '...'}
          </div>
        )}
        {isPlaying && (
          <span style={{
            color: '#22c55e',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#22c55e',
              animation: 'pulse 1s infinite'
            }} />
            LIVE
          </span>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
