import React, { useEffect, useState } from 'react';
import { Music2, Play, AlertCircle, ExternalLink } from 'lucide-react';
import { BACKEND_URL } from '../constants';

const pageStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: '24px',
  background: "radial-gradient(circle at top, #30205b 0%, var(--studio-surface) 48%, var(--studio-surface) 100%)",
  color: "var(--studio-inverse)",
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
};

export default function PublicSharePage({ shareId, embed = false }) {
  const [state, setState] = useState({ loading: true, track: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/distribute/share-link/${encodeURIComponent(shareId)}`, {
          signal: controller.signal,
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'This share link is no longer available.');
        setState({ loading: false, track: body.track, error: null });
      } catch (error) {
        if (error.name !== 'AbortError') setState({ loading: false, track: null, error: error.message });
      }
    };
    load();
    return () => controller.abort();
  }, [shareId]);

  if (state.loading) return <main style={pageStyle}><p>Loading shared track…</p></main>;
  if (state.error) return (
    <main style={pageStyle}>
      <section style={{ maxWidth: 520, textAlign: 'center' }}>
        <AlertCircle size={32} aria-hidden="true" />
        <h1>Share unavailable</h1>
        <p>{state.error}</p>
      </section>
    </main>
  );

  const { track } = state;
  const content = (
    <section style={{ width: 'min(100%, 580px)', display: 'grid', gap: 18, padding: embed ? 20 : 32, border: "1px solid rgba(var(--studio-ink-rgb), 0.14)", borderRadius: 24, background: "var(--studio-surface)", boxShadow: '0 24px 80px rgba(0,0,0,.38)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {track.coverArtUrl ? <img src={track.coverArtUrl} alt="" style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover' }} /> : <div style={{ width: 64, height: 64, display: 'grid', placeItems: 'center', borderRadius: 14, background: "linear-gradient(135deg,var(--studio-accent),#4f46e5)" }}><Music2 /></div>}
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, color: '#c4b5fd', fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Studio Agents AI</p>
          <h1 style={{ margin: '4px 0', fontSize: embed ? 20 : 28, overflowWrap: 'anywhere' }}>{track.title}</h1>
          <p style={{ margin: 0, color: "var(--studio-muted)" }}>{track.artist}</p>
        </div>
      </div>
      <audio controls preload="metadata" src={track.audioUrl} style={{ width: '100%' }}>Your browser does not support audio playback.</audio>
      {!embed && <a href="#/" style={{ color: '#ddd6fe', display: 'inline-flex', width: 'fit-content', gap: 8, alignItems: 'center' }}><Play size={16} /> Create with Studio Agents <ExternalLink size={14} /></a>}
    </section>
  );

  return <main style={pageStyle}>{content}</main>;
}
