import React from 'react';
import { ArrowLeft, Music, Mic2, Image, Video, Sliders, Download, ShieldCheck, ArrowRight } from 'lucide-react';

const phases = [
  { title: '1. Write the brief', icon: Music, color: 'var(--studio-accent)', body: 'Choose a tempo, mood, instrumentation and structure. Keep your own lyrics and exclusions explicit. Generate an instrumental, listen to the entire return, then save a version.' },
  { title: '2. Build the performance', icon: Mic2, color: 'var(--studio-accent)', body: 'Upload a vocal you own or use a supported musical-generation provider. Spoken narration is not singing. Voice identity requires permission and a compatible reference workflow; it is not guaranteed by a voice preset.' },
  { title: '3. Arrange and mix', icon: Sliders, color: 'var(--studio-sage)', body: 'Use the producer canvas to align clips, set levels, trim timing and export a mix. Review transitions, intelligibility and headroom. A mixed song is not an isolated vocal stem.' },
  { title: '4. Create the visual package', icon: Image, color: 'var(--studio-accent)', body: 'Generate artwork and inspect faces, lettering, composition and usage rights. Test the cover at thumbnail size. Keep every useful version in the same project.' },
  { title: '5. Review motion', icon: Video, color: 'var(--studio-sage)', body: 'Generate short video clips before committing to a longer sequence. Check continuity, synchronization, artifacts and export playback. Provider access and rendering time vary.' },
  { title: '6. Prepare delivery', icon: Download, color: 'var(--studio-sage)', body: 'Download the actual returned files, reopen them outside the studio, and review on headphones and speakers. Check your distributor’s current specifications and retain rights documentation.' },
];

const checks = [
  'The entire song plays without silence gaps, glitches, clipping or a cut-off ending.',
  'Lyrics, pronunciation, timing and arrangement match the approved creative brief.',
  'The mix is balanced across headphones, speakers and a phone; loudness and true peak are measured on the final export.',
  'Exports reopen correctly, and the saved project restores its assets and settings.',
  'You have permission for reference recordings, voice identity, samples, artwork and distribution.',
  'A human reviewer has approved the final files. AI feedback is an opinion, not chart certification.',
];

export default function BillboardBlueprintPage({ onBack }) {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--studio-bg)', color: 'var(--studio-ink)', padding: '28px 20px 64px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <button onClick={onBack} className="btn-pill glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to Studio Agents
        </button>
        <header style={{ maxWidth: 800, marginBottom: 40 }}>
          <p style={{ color: 'var(--studio-accent)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>Release blueprint</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', lineHeight: 1.12, margin: '12px 0 20px' }}>Make a record worth releasing.</h1>
          <p style={{ color: 'var(--studio-muted)', fontSize: '1.15rem', lineHeight: 1.75 }}>
            Develop original music with provider-backed generation, your recordings and hands-on production controls.
            Save versions, listen critically and finish deliberately.
          </p>
          <div role="note" style={{ padding: 20, borderRadius: 16, border: '1px solid color-mix(in srgb, var(--studio-accent) 40%, transparent)', background: 'color-mix(in srgb, var(--studio-accent) 7%, transparent)', lineHeight: 1.7 }}>
            <strong>Premium tools, not a chart guarantee.</strong> No model, prompt or automatic master certifies a Billboard hit,
            commercial rights or release quality. Output duration, format, availability and rendering time depend on the provider.
            Review every asset before publishing.
          </div>
        </header>
        <section aria-label="Production workflow" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
          {phases.map(({ title, icon: Icon, color, body }) => (
            <article key={title} style={{ padding: 24, borderRadius: 20, background: 'var(--studio-surface-alt)', border: '1px solid var(--studio-border)', borderTop: `3px solid ${color}` }}>
              <Icon size={25} color={color} aria-hidden="true" />
              <h2 style={{ fontSize: '1.2rem', margin: '16px 0 10px' }}>{title}</h2>
              <p style={{ color: 'var(--studio-muted)', lineHeight: 1.75, margin: 0 }}>{body}</p>
            </article>
          ))}
        </section>
        <section aria-labelledby="release-checks" style={{ marginTop: 36, padding: '28px clamp(16px, 4vw, 36px)', borderRadius: 20, border: '1px solid var(--studio-border)', background: 'var(--studio-surface-alt)' }}>
          <h2 id="release-checks" style={{ display: 'flex', alignItems: 'center', gap: 12 }}><ShieldCheck aria-hidden="true" /> Before you call it finished</h2>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8, color: 'var(--studio-muted)' }}>
            {checks.map(check => <li key={check} style={{ marginBottom: 10 }}>{check}</li>)}
          </ul>
          <p style={{ lineHeight: 1.7 }}>If a provider fails, keep your project and inspect the error. Account or billing limits require provider attention; repeatedly clicking Generate will not repair them.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
            <a className="btn-pill primary" href="#/studio/project_canvas" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Open producer canvas <ArrowRight size={16} aria-hidden="true" /></a>
            <a className="btn-pill glass" href="#/studio/agents">Explore generation tools</a>
          </div>
        </section>
      </div>
    </main>
  );
}
