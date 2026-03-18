import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Square, Volume2, VolumeX, SkipBack, Headphones, Mic, Music
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// REALTIME PREVIEW MIXER — DAW-Style Dual-Channel Mixer
// Beat + Vocal channels with solo/mute, real-time faders, transport bar
// Web Audio API — no server round-trip needed
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
  const [beatMuted, setBeatMuted] = useState(false);
  const [vocalMuted, setVocalMuted] = useState(false);
  const [beatSolo, setBeatSolo] = useState(false);
  const [vocalSolo, setVocalSolo] = useState(false);

  const beatAudioRef = useRef(null);
  const vocalAudioRef = useRef(null);
  const animFrameRef = useRef(null);
  const isInitializedRef = useRef(false);

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

  // Apply volume/mute/solo to an audio element using HTMLAudioElement.volume (no CORS needed)
  const applyVolume = useCallback((audioEl, volume, muted, solo, otherSolo) => {
    if (!audioEl) return;
    const anySolo = solo || otherSolo;
    const shouldPlay = anySolo ? solo : !muted;
    audioEl.volume = shouldPlay ? Math.max(0, Math.min(1, volume)) : 0;
  }, []);

  const initAudio = useCallback(() => {
    if (isInitializedRef.current) return;
    try {
      if (beatSrc) {
        const beatAudio = new Audio();
        beatAudio.preload = 'auto';
        beatAudio.src = beatSrc;
        beatAudio.volume = beatVolume;
        beatAudioRef.current = beatAudio;
        beatAudio.addEventListener('canplaythrough', () => setBeatLoaded(true), { once: true });
        beatAudio.addEventListener('loadedmetadata', () => setDuration(prev => Math.max(prev, beatAudio.duration)));
        beatAudio.addEventListener('error', (e) => {
          console.warn('[Mixer] Beat audio load error:', e);
          setBeatLoaded(false);
          setInitError('Beat audio failed to load');
        });
        beatAudio.load();
      }

      if (vocalSrc) {
        const vocalAudio = new Audio();
        vocalAudio.preload = 'auto';
        vocalAudio.src = vocalSrc;
        vocalAudio.volume = vocalVolume;
        vocalAudioRef.current = vocalAudio;
        vocalAudio.addEventListener('canplaythrough', () => setVocalLoaded(true), { once: true });
        vocalAudio.addEventListener('loadedmetadata', () => setDuration(prev => Math.max(prev, vocalAudio.duration)));
        vocalAudio.addEventListener('error', (e) => {
          console.warn('[Mixer] Vocal audio load error:', e);
          setVocalLoaded(false);
          setInitError('Vocal audio failed to load');
        });
        vocalAudio.load();
      }
      isInitializedRef.current = true;
    } catch (err) { console.error('[Mixer] Init error:', err); setInitError(err.message); }
  }, [beatSrc, vocalSrc, beatVolume, vocalVolume]);

  useEffect(() => {
    if (beatSrc || vocalSrc) { cleanup(); isInitializedRef.current = false; initAudio(); }
    return () => cleanup();
  }, [beatSrc, vocalSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Solo/mute logic via HTMLAudioElement.volume
  useEffect(() => {
    applyVolume(beatAudioRef.current, beatVolume, beatMuted, beatSolo, vocalSolo);
  }, [beatVolume, beatMuted, beatSolo, vocalSolo, applyVolume]);

  useEffect(() => {
    applyVolume(vocalAudioRef.current, vocalVolume, vocalMuted, vocalSolo, beatSolo);
  }, [vocalVolume, vocalMuted, beatSolo, vocalSolo, applyVolume]);

  const updateTime = useCallback(() => {
    const beatTime = beatAudioRef.current?.currentTime || 0;
    const vocalTime = vocalAudioRef.current?.currentTime || 0;
    setCurrentTime(Math.max(beatTime, vocalTime));
    const beatEnded = beatAudioRef.current ? beatAudioRef.current.ended : true;
    const vocalEnded = vocalAudioRef.current ? vocalAudioRef.current.ended : true;
    if (beatEnded && vocalEnded && isPlaying) { setIsPlaying(false); setCurrentTime(0); return; }
    if (isPlaying) animFrameRef.current = requestAnimationFrame(updateTime);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) animFrameRef.current = requestAnimationFrame(updateTime);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying, updateTime]);

  const play = async () => {
    try {
      const promises = [];
      if (beatAudioRef.current && beatLoaded) promises.push(beatAudioRef.current.play().catch(() => {}));
      if (vocalAudioRef.current && vocalLoaded) promises.push(vocalAudioRef.current.play().catch(() => {}));
      await Promise.all(promises);
      setIsPlaying(true);
    } catch (err) { console.error('[Mixer] Play error:', err); }
  };

  const pause = () => {
    if (beatAudioRef.current) beatAudioRef.current.pause();
    if (vocalAudioRef.current) vocalAudioRef.current.pause();
    setIsPlaying(false);
  };

  const stop = () => {
    if (beatAudioRef.current) { beatAudioRef.current.pause(); beatAudioRef.current.currentTime = 0; }
    if (vocalAudioRef.current) { vocalAudioRef.current.pause(); vocalAudioRef.current.currentTime = 0; }
    setIsPlaying(false); setCurrentTime(0);
  };

  const restart = () => { stop(); setTimeout(() => play(), 50); };

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
    if (beatAudioRef.current) { beatAudioRef.current.pause(); beatAudioRef.current.src = ''; }
    if (vocalAudioRef.current) { vocalAudioRef.current.pause(); vocalAudioRef.current.src = ''; }
    beatAudioRef.current = null; vocalAudioRef.current = null;
    isInitializedRef.current = false;
    setIsPlaying(false); setCurrentTime(0); setDuration(0); setBeatLoaded(false); setVocalLoaded(false); setInitError(null);
  };

  const fmt = (s) => { if (!s || !isFinite(s)) return '0:00'; return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; };

  const hasAnySrc = !!(beatSrc || vocalSrc);
  const isReady = (beatSrc ? beatLoaded : true) && (vocalSrc ? vocalLoaded : true) && hasAnySrc;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!hasAnySrc) return null;

  if (initError) return (
    <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginTop: '8px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
      ⚠️ Preview mixer unavailable — {initError}. Your final mix will still be created server-side.
    </div>
  );

  // Channel strip sub-component
  const ChannelStrip = ({ label, icon: Icon, color, loaded, volume, onVolumeChange, muted, onMute, solo, onSolo, hasSrc }) => {
    if (!hasSrc) return null;
    const anySolo = beatSolo || vocalSolo;
    const isAudible = anySolo ? solo : !muted;
    return (
      <div style={{
        flex: 1,
        background: 'rgba(0,0,0,0.25)',
        borderRadius: '10px',
        padding: isMobile ? '10px' : '12px',
        border: `1px solid ${isAudible && loaded ? color + '33' : 'rgba(255,255,255,0.06)'}`,
        opacity: loaded ? 1 : 0.5,
        minWidth: 0
      }}>
        {/* Channel Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: isAudible ? color + '22' : 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${isAudible ? color + '44' : 'rgba(255,255,255,0.08)'}`
          }}>
            <Icon size={12} color={isAudible ? color : 'rgba(255,255,255,0.2)'} />
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isAudible ? color : 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </span>
          {!loaded && <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>loading...</span>}
        </div>

        {/* Volume Fader */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range" min="0" max="1" step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: color, height: '6px', cursor: 'pointer' }}
              aria-label={`${label} volume`}
            />
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace',
              color: isAudible ? color : 'rgba(255,255,255,0.2)',
              minWidth: '32px', textAlign: 'right'
            }}>
              {Math.round(volume * 100)}
            </span>
          </div>
        </div>

        {/* S / M Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onSolo}
            style={{
              flex: 1, height: isMobile ? '36px' : '30px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: solo ? '#eab308' : 'rgba(255,255,255,0.06)',
              color: solo ? '#000' : 'rgba(255,255,255,0.4)',
              fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em',
              transition: 'all 0.15s'
            }}
            title={`Solo ${label}`}
          >S</button>
          <button
            onClick={onMute}
            style={{
              flex: 1, height: isMobile ? '36px' : '30px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: muted ? '#ef4444' : 'rgba(255,255,255,0.06)',
              color: muted ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em',
              transition: 'all 0.15s'
            }}
            title={`Mute ${label}`}
          >M</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(15,15,20,0.95), rgba(10,10,15,0.95))',
      borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.08)',
      marginTop: '8px',
      overflow: 'hidden'
    }}>
      {/* Transport Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px',
        padding: isMobile ? '10px 12px' : '10px 14px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        {/* Controls */}
        <button onClick={restart} disabled={!isReady}
          style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'transparent', border: 'none', color: isReady ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)', cursor: isReady ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title="Restart">
          <SkipBack size={14} />
        </button>

        <button onClick={isPlaying ? pause : play} disabled={!isReady}
          style={{
            width: isMobile ? '40px' : '38px', height: isMobile ? '40px' : '38px',
            borderRadius: '50%', flexShrink: 0,
            background: isReady ? (isPlaying ? 'rgba(239,68,68,0.25)' : 'linear-gradient(135deg, #22d3ee, #8b5cf6)') : 'rgba(255,255,255,0.04)',
            border: isReady ? (isPlaying ? '2px solid rgba(239,68,68,0.5)' : '2px solid rgba(34,211,238,0.4)') : '1px solid rgba(255,255,255,0.08)',
            color: isReady ? '#fff' : 'rgba(255,255,255,0.15)',
            cursor: isReady ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
        </button>

        <button onClick={stop} disabled={!isReady || !isPlaying}
          style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'transparent', border: 'none', color: isReady && isPlaying ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)', cursor: isReady && isPlaying ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title="Stop">
          <Square size={11} />
        </button>

        {/* Progress / Scrubber */}
        <div style={{ flex: 1, minWidth: 0, cursor: isReady ? 'pointer' : 'default' }} onClick={isReady ? seekTo : undefined}>
          <div style={{
            height: '28px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px',
            position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(34,211,238,0.25), rgba(139,92,246,0.25))',
              transition: isPlaying ? 'none' : 'width 0.1s'
            }} />
            {/* Playhead */}
            {progress > 0 && <div style={{ position: 'absolute', left: `${progress}%`, top: 0, bottom: 0, width: '2px', background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.5)' }} />}
            {/* Mini waveform */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: '1px', padding: '0 4px', opacity: 0.25 }}>
              {[...Array(isMobile ? 30 : 50)].map((_, i) => {
                const total = isMobile ? 30 : 50;
                const h = 20 + Math.sin(i * 0.5) * 40 + ((i * 7 + 13) % 30);
                return <div key={i} style={{ width: '2px', height: `${h}%`, background: (i / total * 100) < progress ? '#22d3ee' : 'rgba(255,255,255,0.2)', borderRadius: '1px' }} />;
              })}
            </div>
          </div>
        </div>

        {/* Time */}
        <div style={{ flexShrink: 0, textAlign: 'right', minWidth: isMobile ? '55px' : '65px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', color: isPlaying ? '#22d3ee' : 'rgba(255,255,255,0.4)' }}>
            {fmt(currentTime)}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
            {' / '}{fmt(duration)}
          </span>
        </div>

        {/* Live indicator */}
        {isPlaying && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'mixerPulse 1s infinite' }} />
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#22c55e', letterSpacing: '0.08em' }}>LIVE</span>
          </div>
        )}
      </div>

      {initError && (
        <div style={{ fontSize: '0.75rem', color: '#ef4444', padding: '8px 14px', background: 'rgba(239,68,68,0.08)' }}>
          {initError}
        </div>
      )}

      {/* Channel Strips */}
      <div style={{
        display: 'flex', gap: '8px',
        padding: isMobile ? '10px' : '12px',
        flexDirection: isMobile && !vocalSrc ? 'column' : 'row'
      }}>
        <ChannelStrip
          label="Beat" icon={Music} color="#22d3ee"
          loaded={beatLoaded} hasSrc={!!beatSrc}
          volume={beatVolume} onVolumeChange={onBeatVolumeChange}
          muted={beatMuted} onMute={() => setBeatMuted(!beatMuted)}
          solo={beatSolo} onSolo={() => setBeatSolo(!beatSolo)}
        />
        <ChannelStrip
          label="Vocal" icon={Mic} color="#a78bfa"
          loaded={vocalLoaded} hasSrc={!!vocalSrc}
          volume={vocalVolume} onVolumeChange={onVocalVolumeChange}
          muted={vocalMuted} onMute={() => setVocalMuted(!vocalMuted)}
          solo={vocalSolo} onSolo={() => setVocalSolo(!vocalSolo)}
        />
      </div>

      <style>{`
        @keyframes mixerPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
