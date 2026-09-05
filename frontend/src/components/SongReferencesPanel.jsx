import React, { useCallback, useEffect, useRef, useState } from 'react';

export default function SongReferencesPanel({ backendUrl, getHeaders, currentUid, accountId, references, onReferencesChange,
  voiceSource, onVoiceSourceChange, personalReferenceId, onPersonalReferenceChange, onLibraryChange, lyricsExcerpt, onLyricsExcerptChange }) {
  const [library, setLibrary] = useState([]);
  const [file, setFile] = useState(null);
  const [sourceKind, setSourceKind] = useState('song');
  const [start, setStart] = useState(0);
  const [length, setLength] = useState(30);
  const [consent, setConsent] = useState(false);
  const [prepared, setPrepared] = useState(null);
  const [listened, setListened] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const lifecycle = useRef(0);
  const callbackRef = useRef(onLibraryChange);
  callbackRef.current = onLibraryChange;
  const authRef = useRef({ getHeaders, currentUid });
  authRef.current = { getHeaders, currentUid };

  const request = useCallback(async (path, body, owner = accountId) => {
    if (!owner || authRef.current.currentUid() !== owner) throw new Error('Sign in to manage your private references.');
    const headers = await authRef.current.getHeaders();
    if (!headers.Authorization || authRef.current.currentUid() !== owner) throw new Error('Your account changed. Open the reference library again.');
    const response = await fetch(`${backendUrl}${path}`, {
      method: body === undefined ? 'GET' : 'POST', headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(300000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The reference could not be saved. Retry.');
    if (authRef.current.currentUid() !== owner) throw new Error('Your account changed; the previous account’s result was not opened.');
    return result;
  }, [accountId, backendUrl]);

  useEffect(() => {
    const generations = lifecycle;
    const generation = ++generations.current;
    setLibrary([]); setPrepared(null); setFile(null); setConsent(false); setListened(false); setError(''); setBusy('');
    callbackRef.current({ references: [], ownerUid: accountId, status: accountId ? 'checking' : 'idle' });
    if (accountId) request('/api/v2/singing-references').then(result => {
      if (lifecycle.current !== generation) return;
      const items = Array.isArray(result.references) ? result.references : [];
      setLibrary(items); callbackRef.current({ references: items, ownerUid: accountId, status: 'loaded' });
    }).catch(e => {
      if (lifecycle.current !== generation) return;
      setError(e.message); callbackRef.current({ references: [], ownerUid: accountId, status: 'error' });
    });
    return () => { generations.current++; };
  }, [accountId, request]); // Authentication changes invalidate every pending result.

  async function work(label, action) {
    if (pending.current?.generation === lifecycle.current) return;
    const generation = lifecycle.current;
    const operation = { generation };
    pending.current = operation; setBusy(label); setError('');
    try { await action(() => lifecycle.current === generation && currentUid() === accountId); }
    catch (e) { if (lifecycle.current === generation) setError(e.message); }
    finally { if (pending.current === operation) pending.current = null; if (lifecycle.current === generation) setBusy(''); }
  }

  async function upload(audioFile) {
    if (!audioFile || audioFile.size > 15 * 1024 * 1024 || !/\.(mp3|wav|m4a|ogg|webm|flac)$/i.test(audioFile.name)) throw new Error('Choose an audio file no larger than 15MB.');
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('The file could not be read')); reader.readAsDataURL(audioFile);
    });
    const result = await request('/api/upload-asset', { data, fileName: audioFile.name, mimeType: audioFile.type || 'audio/mpeg', assetType: 'audio' });
    if (!result.url || !result.assetId) throw new Error('The server did not confirm a stored audio asset. Retry upload.');
    return { assetId: result.assetId, url: result.url, name: audioFile.name };
  }

  function addReference(event) {
    const audioFile = event.target.files?.[0]; event.target.value = '';
    if (!audioFile) return;
    work('Uploading style reference…', async isCurrent => {
      if (references.length >= 3) throw new Error('Remove a reference before adding another. Three references is the limit.');
      const result = await upload(audioFile);
      if (isCurrent()) onReferencesChange([...references, result]);
    });
  }

  function prepare() {
    work('Preparing your vocal audition…', async isCurrent => {
      if (!consent) throw new Error('Confirm ownership or the singer’s explicit permission first.');
      if (!file) throw new Error('Choose a singing recording.');
      if (!Number.isFinite(Number(start)) || Number(start) < 0 || Number(length) < 16 || Number(length) > 45) throw new Error('Choose a valid start and a 16–45 second excerpt.');
      const asset = await upload(file);
      if (!isCurrent()) return;
      const result = await request('/api/v2/singing-references/prepare', { assetId: asset.assetId, sourceKind, startSeconds: Number(start), durationSeconds: Number(length), consentConfirmed: true, name: file.name });
      if (isCurrent()) { setPrepared(result.reference); setListened(false); }
    });
  }

  function approve() {
    work('Saving your approved singing reference…', async isCurrent => {
      const result = await request(`/api/v2/singing-references/${prepared.id}/approve`, { listenedAndApproved: listened });
      if (!isCurrent()) return;
      const items = [result.reference, ...library.filter(item => item.id !== result.reference.id)];
      setLibrary(items); callbackRef.current({ references: items, ownerUid: accountId, status: 'loaded' });
      onPersonalReferenceChange(result.reference); setPrepared(null);
    });
  }

  return <details className="song-references-panel">
    <summary>Voice &amp; optional references <span>{voiceSource === 'personal' ? 'Your singing reference' : 'Original MiniMax performer'} · {references.length} style references</span></summary>
    <div className="song-references-content">
      <label>Vocal identity<select value={voiceSource} disabled={!!busy} onChange={e => onVoiceSourceChange(e.target.value)}>
        <option value="studio">Original studio performer — no sample needed</option><option value="personal">My permitted singing voice</option>
      </select></label>
      <p>Style references guide musical qualities, not voice identity. Remove them at any time; original uploads stay in your private library.</p>
      <ul>{references.map((item, i) => <li key={item.assetId || item.url}><span>{item.name || `Reference ${i + 1}`}</span><button type="button" disabled={!!busy} aria-label={`Remove ${item.name || `reference ${i + 1}`}`} onClick={() => onReferencesChange(references.filter((_, index) => index !== i))}>Remove</button></li>)}</ul>
      <label>Add style reference (up to 3)<input type="file" accept="audio/*" disabled={!!busy || references.length >= 3} onChange={addReference} /></label>
      {voiceSource === 'personal' && <section aria-label="Personal singing reference">
        <p>Personal voice is a short musical audition, not a guaranteed clone or a full-length song. Your original file is preserved. For a song sample, we isolate its vocal excerpt first.</p>
        <label>Approved singing reference<select value={personalReferenceId || ''} disabled={!!busy} onChange={e => onPersonalReferenceChange(library.find(item => item.id === e.target.value) || null)}>
          <option value="">Choose or prepare a reference</option>{library.filter(item => item.status === 'ready').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label>Lyrics for this audition (1–400 characters)<textarea value={lyricsExcerpt} onChange={e => onLyricsExcerptChange(e.target.value)} rows={4} aria-describedby="personal-lyrics-capacity" /></label>
        <p id="personal-lyrics-capacity">{lyricsExcerpt.length}/400 characters. Choose the exact verse or hook to perform. We will not truncate or repeat it.</p>
        <details><summary>Prepare a new singing reference</summary>
          <label>Recording<input type="file" accept="audio/*" disabled={!!busy} onChange={e => { setFile(e.target.files?.[0] || null); setPrepared(null); setListened(false); setConsent(false); }} /></label>
          <label>Recording contains<select value={sourceKind} onChange={e => { setSourceKind(e.target.value); setPrepared(null); setListened(false); }} disabled={!!busy}><option value="song">Song with one singer and instruments</option><option value="isolated-vocal">Only the singer’s vocal</option></select></label>
          <div className="song-reference-excerpt"><label>Start (seconds)<input type="number" min="0" max="1200" value={start} onChange={e => { setStart(e.target.value); setPrepared(null); setListened(false); }} disabled={!!busy} /></label><label>Length (seconds)<input type="number" min="16" max="45" value={length} onChange={e => { setLength(e.target.value); setPrepared(null); setListened(false); }} disabled={!!busy} /></label></div>
          <label className="song-reference-confirm"><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); if (!e.target.checked) { setPrepared(null); setListened(false); } }} disabled={!!busy} />I own this singing voice or have the singer’s explicit permission to clone it.</label>
          <button type="button" onClick={prepare} disabled={!!busy || !file || !consent}>Prepare audition</button>
        </details>
        {prepared && <div className="song-reference-audition"><strong>Listen before using this voice</strong><audio controls src={prepared.url} preload="metadata" /><p>Check for one clear singer, correct excerpt, noise and separation artifacts. Audio checks do not verify identity or artistic quality.</p>
          <label className="song-reference-confirm"><input type="checkbox" checked={listened} onChange={e => setListened(e.target.checked)} />I listened: this excerpt contains only the permitted singer and is suitable for my audition.</label>
          <button type="button" disabled={!listened || !!busy} onClick={approve}>Approve &amp; use this singing reference</button>
        </div>}
      </section>}
      {busy && <p role="status">{busy} Keep this panel open; the original is safe.</p>}{error && <p role="alert">{error}</p>}
    </div>
  </details>;
}
