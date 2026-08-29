import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ChevronDown, ChevronUp, Disc3, Download, FileText, Headphones,
  Loader2, Mic2, Music2, Pause, Play, Plus, Save, SlidersHorizontal, Sparkles,
  Trash2, Upload, Volume2, VolumeX, WandSparkles,
} from 'lucide-react';

import './ProducerCanvas.css';

const ROLE_META = {
  beat: { label: 'Beat', color: '#31c6f4', icon: Disc3 },
  instrument: { label: 'Instrument', color: '#70d6a4', icon: Music2 },
  vocal: { label: 'Lead vocal', color: '#c99bff', icon: Mic2 },
  harmony: { label: 'Harmony', color: '#ff9ecf', icon: Mic2 },
  adlib: { label: 'Ad-lib', color: '#ffbd70', icon: Mic2 },
  fx: { label: 'FX', color: '#8da7ff', icon: Sparkles },
};

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function inferRole(asset) {
  const haystack = `${asset?.type || ''} ${asset?.agent || ''} ${asset?.title || ''}`.toLowerCase();
  if (haystack.includes('vocal') || haystack.includes('singer') || haystack.includes('rapper')) return 'vocal';
  if (haystack.includes('harmony')) return 'harmony';
  if (haystack.includes('adlib') || haystack.includes('ad-lib')) return 'adlib';
  if (haystack.includes('beat') || haystack.includes('drum')) return 'beat';
  return 'instrument';
}

function ProducerTrack({ track, index, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const meta = ROLE_META[track.role] || ROLE_META.instrument;
  const Icon = meta.icon;
  const patch = (changes) => onChange(track.id, changes);

  return (
    <article className={`producer-track${track.muted ? ' is-muted' : ''}${track.solo ? ' is-solo' : ''}`} style={{ '--track-color': meta.color }}>
      <div className="producer-track-main">
        <div className="producer-track-index">{String(index + 1).padStart(2, '0')}</div>
        <div className="producer-track-role"><Icon size={17} /></div>
        <div className="producer-track-copy">
          <strong>{track.name || meta.label}</strong>
          <span>{meta.label} · {track.source === 'upload' ? 'Uploaded' : 'Studio asset'}</span>
        </div>
        <div className="producer-level">
          <Volume2 size={15} />
          <input aria-label={`${track.name} volume`} type="range" min="0" max="1.5" step="0.01" value={track.volume ?? 0.8} onChange={(event) => patch({ volume: numberValue(event.target.value, 0.8) })} />
          <output>{Math.round((track.volume ?? 0.8) * 100)}%</output>
        </div>
        <button className={`producer-mini-button${track.solo ? ' active' : ''}`} onClick={() => patch({ solo: !track.solo })} title="Solo this track">S</button>
        <button className={`producer-mini-button${track.muted ? ' danger' : ''}`} onClick={() => patch({ muted: !track.muted })} title={track.muted ? 'Unmute track' : 'Mute track'}>
          {track.muted ? <VolumeX size={14} /> : 'M'}
        </button>
        <button className="producer-mini-button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} title="Detailed controls">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {expanded && (
        <div className="producer-track-detail">
          <label>Role
            <select value={track.role} onChange={(event) => patch({ role: event.target.value })}>
              {Object.entries(ROLE_META).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
            </select>
          </label>
          <label>Pan <span>{numberValue(track.pan).toFixed(2)}</span>
            <input type="range" min="-1" max="1" step="0.05" value={track.pan ?? 0} onChange={(event) => patch({ pan: numberValue(event.target.value) })} />
          </label>
          <label>Start delay <span>{numberValue(track.offset).toFixed(2)}s</span>
            <input type="range" min="0" max="30" step="0.1" value={track.offset ?? 0} onChange={(event) => patch({ offset: numberValue(event.target.value) })} />
          </label>
          <label>Trim in <span>{numberValue(track.trimStart).toFixed(2)}s</span>
            <input type="number" min="0" step="0.1" value={track.trimStart ?? 0} onChange={(event) => patch({ trimStart: Math.max(0, numberValue(event.target.value)) })} />
          </label>
          <label>Trim out <span>optional</span>
            <input type="number" min="0" step="0.1" value={track.trimEnd ?? ''} placeholder="Full track" onChange={(event) => patch({ trimEnd: event.target.value === '' ? null : Math.max(0, numberValue(event.target.value)) })} />
          </label>
          <label>Fade in <span>{numberValue(track.fadeIn).toFixed(1)}s</span>
            <input type="range" min="0" max="10" step="0.1" value={track.fadeIn ?? 0} onChange={(event) => patch({ fadeIn: numberValue(event.target.value) })} />
          </label>
          <label>Fade out <span>{numberValue(track.fadeOut).toFixed(1)}s</span>
            <input type="range" min="0" max="10" step="0.1" value={track.fadeOut ?? 0} onChange={(event) => patch({ fadeOut: numberValue(event.target.value) })} />
          </label>
          <button className="producer-remove-track" onClick={() => onRemove(track.id)}><Trash2 size={14} /> Remove lane</button>
        </div>
      )}
    </article>
  );
}

export default function ProducerCanvas({
  project,
  session,
  playing,
  rendering,
  uploading,
  onSessionChange,
  onPlayingChange,
  onAddAsset,
  onUploadAudio,
  onUploadLyrics,
  onSave,
  onRender,
  onClose,
}) {
  const audioRefs = useRef(new Map());
  const timers = useRef([]);
  const [assetRole, setAssetRole] = useState('beat');
  const [showLibrary, setShowLibrary] = useState(true);

  const tracks = useMemo(() => Array.isArray(session?.tracks) ? session.tracks : [], [session?.tracks]);
  const audibleTracks = useMemo(() => {
    const solos = tracks.filter((track) => track.solo && !track.muted);
    return solos.length ? solos : tracks.filter((track) => !track.muted);
  }, [tracks]);
  const audioAssets = useMemo(() => (project?.assets || []).filter((asset) => asset?.audioUrl), [project?.assets]);
  const unusedAssets = useMemo(() => {
    const urls = new Set(tracks.map((track) => track.url));
    return audioAssets.filter((asset) => !urls.has(asset.audioUrl));
  }, [audioAssets, tracks]);
  const latestMaster = useMemo(() => (project?.assets || []).find((asset) => asset?.type === 'Master' && asset?.audioUrl), [project?.assets]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!playing) {
      audioRefs.current.forEach((element) => element?.pause());
      return undefined;
    }

    const audibleIds = new Set(audibleTracks.map((track) => track.id));
    tracks.forEach((track) => {
      const element = audioRefs.current.get(track.id);
      if (!element) return;
      element.pause();
      element.volume = Math.max(0, Math.min(1, track.volume ?? 0.8));
      if (!audibleIds.has(track.id)) return;
      try { element.currentTime = Math.max(0, track.trimStart || 0); } catch { /* metadata may still be loading */ }
      const timer = setTimeout(() => element.play().catch(() => onPlayingChange(false)), Math.max(0, (track.offset || 0) * 1000));
      timers.current.push(timer);
    });
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      audioRefs.current.forEach((element) => element?.pause());
    };
  }, [playing, audibleTracks, tracks, onPlayingChange]);

  const setTracks = (nextTracks) => onSessionChange({ ...session, tracks: nextTracks });
  const updateTrack = (id, changes) => setTracks(tracks.map((track) => track.id === id ? { ...track, ...changes } : track));
  const removeTrack = (id) => setTracks(tracks.filter((track) => track.id !== id));
  const patchSession = (changes) => onSessionChange({ ...session, ...changes });

  return (
    <div className="producer-canvas" role="dialog" aria-modal="true" aria-label="Producer canvas">
      <header className="producer-topbar">
        <div className="producer-brand">
          <button className="producer-icon-button" onClick={onClose} title="Back to project"><ArrowLeft size={19} /></button>
          <div className="producer-brand-mark"><SlidersHorizontal size={19} /></div>
          <div><span>Producer Canvas</span><strong>{project?.name || project?.title || 'Untitled session'}</strong></div>
        </div>

        <div className="producer-transport">
          <button className="producer-play" onClick={() => onPlayingChange(!playing)} disabled={!tracks.length} aria-label={playing ? 'Pause session' : 'Play session'}>
            {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <div><strong>{session?.bpm || 120}</strong><span>BPM</span></div>
          <div><strong>{session?.key || 'C Major'}</strong><span>KEY</span></div>
          <div><strong>{session?.timeSignature || '4/4'}</strong><span>METER</span></div>
        </div>

        <div className="producer-actions">
          <button onClick={onSave} disabled={uploading || rendering}><Save size={16} /> Save</button>
          <button className="producer-render" onClick={onRender} disabled={rendering || uploading || !audibleTracks.length}>
            {rendering ? <Loader2 size={16} className="spin" /> : <WandSparkles size={16} />}
            {rendering ? 'Rendering…' : 'Render mix'}
          </button>
        </div>
      </header>

      <main className="producer-body">
        <section className="producer-arrangement">
          <div className="producer-section-heading">
            <div><span>ARRANGEMENT</span><h2>Build the record, lane by lane</h2></div>
            <div className="producer-format-controls">
              <label>BPM<input type="number" min="40" max="240" value={session?.bpm || 120} onChange={(event) => patchSession({ bpm: Math.max(40, Math.min(240, numberValue(event.target.value, 120))) })} /></label>
              <label>Key<input value={session?.key || 'C Major'} onChange={(event) => patchSession({ key: event.target.value.slice(0, 32) })} /></label>
              <label className="producer-toggle"><input type="checkbox" checked={session?.autoDuck !== false} onChange={(event) => patchSession({ autoDuck: event.target.checked })} /><span /> Vocal pocket</label>
            </div>
          </div>

          <div className="producer-track-stack">
            {tracks.length ? tracks.map((track, index) => (
              <React.Fragment key={track.id}>
                <audio ref={(element) => element ? audioRefs.current.set(track.id, element) : audioRefs.current.delete(track.id)} src={track.url} preload="metadata" />
                <ProducerTrack track={track} index={index} onChange={updateTrack} onRemove={removeTrack} />
              </React.Fragment>
            )) : (
              <div className="producer-empty">
                <Headphones size={34} />
                <h3>Your session is ready for its first layer</h3>
                <p>Add a generated Studio asset or upload your own beat, vocal, stem, or sound.</p>
              </div>
            )}
          </div>

          <div className="producer-dropbar">
            <label className="producer-upload-button">
              {uploading ? <Loader2 size={17} className="spin" /> : <Upload size={17} />}
              {uploading ? 'Uploading…' : 'Upload audio or stems'}
              <input type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.ogg" multiple disabled={uploading} onChange={(event) => {
                const files = Array.from(event.target.files || []);
                files.forEach((file) => onUploadAudio(file, assetRole));
                event.target.value = '';
              }} />
            </label>
            <select value={assetRole} onChange={(event) => setAssetRole(event.target.value)} aria-label="Role for uploaded tracks">
              {Object.entries(ROLE_META).map(([value, option]) => <option key={value} value={value}>Add as {option.label}</option>)}
            </select>
            <span>WAV, MP3, M4A, AAC, FLAC or OGG · up to 100MB each</span>
          </div>
        </section>

        <aside className="producer-sidebar">
          <section className="producer-panel">
            <button className="producer-panel-title" onClick={() => setShowLibrary((value) => !value)} aria-expanded={showLibrary}>
              <span><Music2 size={16} /> Studio asset library</span>{showLibrary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showLibrary && <div className="producer-asset-list">
              {unusedAssets.length ? unusedAssets.slice(0, 12).map((asset) => (
                <button key={asset.id || asset.audioUrl} onClick={() => onAddAsset(asset, inferRole(asset))}>
                  <span><Play size={13} fill="currentColor" /></span>
                  <div><strong>{asset.title || asset.agent || 'Audio asset'}</strong><small>{ROLE_META[inferRole(asset)].label} · add to session</small></div>
                  <Plus size={15} />
                </button>
              )) : <p className="producer-panel-empty">Every available audio asset is already in this session. Generate another or upload a stem.</p>}
            </div>}
          </section>

          <section className="producer-panel producer-lyrics-panel">
            <div className="producer-panel-title static"><span><FileText size={16} /> Lyrics & arrangement notes</span></div>
            <textarea value={session?.lyricsDraft || ''} onChange={(event) => patchSession({ lyricsDraft: event.target.value })} placeholder={'[Intro]\n\n[Verse 1]\nWrite or paste lyrics here…'} />
            <label className="producer-lyrics-upload"><Upload size={14} /> Import TXT, MD or LRC
              <input type="file" accept=".txt,.md,.lrc,text/plain" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUploadLyrics(file);
                event.target.value = '';
              }} />
            </label>
          </section>

          <section className="producer-panel producer-master-panel">
            <div className="producer-panel-title static"><span><SlidersHorizontal size={16} /> Master bus</span></div>
            <label>Target loudness <strong>{session?.lufsTarget ?? -14} LUFS</strong>
              <input type="range" min="-24" max="-10" step="1" value={session?.lufsTarget ?? -14} onChange={(event) => patchSession({ lufsTarget: numberValue(event.target.value, -14) })} />
            </label>
            <div className="producer-master-summary"><span>{audibleTracks.length} audible lanes</span><span>{tracks.filter((track) => ['vocal', 'harmony', 'adlib'].includes(track.role)).length} vocal layers</span></div>
            {latestMaster && <a href={latestMaster.audioUrl} target="_blank" rel="noreferrer"><Download size={14} /> Latest master</a>}
            <p>This render is a polished preview master. Final release decisions still belong to the artist and mix engineer.</p>
          </section>
        </aside>
      </main>
    </div>
  );
}
