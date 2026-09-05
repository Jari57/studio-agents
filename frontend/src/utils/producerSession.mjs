// Identifies the audio-affecting settings of a saved render. This is not an
// authorization token; the server still validates every track and setting.
import { restoreProjectOutputs } from './projectRestore.mjs';
export function producerRenderSignature(session = {}) {
  const fields = ['id', 'url', 'role', 'volume', 'pan', 'offset', 'trimStart', 'trimEnd', 'fadeIn', 'fadeOut', 'muted', 'solo'];
  return JSON.stringify({
    version: 2,
    tracks: (session.tracks || []).map(track => Object.fromEntries(fields.map(key => [key, track[key] ?? null]))),
    autoDuck: session.autoDuck !== false,
    lufsTarget: session.lufsTarget ?? -14,
  });
}

export function producerAudioLibrary(project, projects = [], search = '') {
  const query = search.trim().toLowerCase();
  const seen = new Set();
  return [project, ...projects.filter(item => item?.id !== project?.id)]
    .filter(Boolean)
    .flatMap(item => (item.assets || []).filter(asset => asset?.audioUrl).map(asset => ({
      ...asset, projectName: item.name || item.title || 'Untitled project',
    })))
    .filter(asset => {
      if (seen.has(asset.audioUrl)) return false;
      seen.add(asset.audioUrl);
      return !query || `${asset.title || asset.agent || ''} ${asset.projectName}`.toLowerCase().includes(query);
    });
}

export function inferProducerRole(asset) {
  // A completed mix may mention vocals in its project/title but is not a dry
  // vocal stem. Keep it out of the vocal sidechain unless explicitly reassigned.
  if (/^(master|mix)$/i.test(asset?.type || '')) return 'instrument';
  if (['beat', 'instrument', 'vocal', 'harmony', 'adlib', 'fx'].includes(asset?.metadata?.role)) return asset.metadata.role;
  const text = `${asset?.metadata?.role || ''} ${asset?.type || ''} ${asset?.agent || ''} ${asset?.title || ''}`.toLowerCase();
  if (/harmon(?:y|ies)/.test(text)) return 'harmony';
  if (/ad-?lib/.test(text)) return 'adlib';
  if (/vocal|singer|rapper/.test(text)) return 'vocal';
  if (/beat|drum|music gpt/.test(text)) return 'beat';
  return 'instrument';
}

export function boundedProducerValue(value, min, max, fallback) {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export function producerSessionIssues(session = {}) {
  const active = (session.tracks || []).filter(track => !track.muted);
  const hasSolo = active.some(track => track.solo);
  return active.filter(track => !hasSolo || track.solo).flatMap(track => {
    if (track.trimEnd !== null && track.trimEnd !== undefined && track.trimEnd !== '' && Number(track.trimEnd) <= Number(track.trimStart || 0)) {
      return [`${track.name || 'Track'}: trim out must be later than trim in.`];
    }
    return [];
  });
}

// Restore a deliberate session, or begin with only the selected performance.
// Historical masters remain in the library rather than becoming extra layers.
export function initialProducerSession(project = {}, previous = {}) {
  if (previous.projectId === project.id && Array.isArray(previous.tracks)) return previous;
  if (Array.isArray(project.sessionState?.tracks)) return { ...project.sessionState, projectId: project.id };
  const assets = (project.assets || []).filter(Boolean);
  const { media, outputs } = restoreProjectOutputs(project);
  const vocalUrl = media.vocals || media.lyricsVocal;
  const beatUrl = media.audio;
  const tracks = [];
  const add = (url, role) => {
    if (!url || tracks.some(track => track.url === url)) return;
    const asset = assets.find(asset => asset.audioUrl === url);
    tracks.push({ id: `lane-${role}-${asset?.id || 'current'}`, assetId: asset?.id || null, url, role,
      name: role === 'vocal' ? 'Current vocal' : 'Current accompaniment', source: 'studio',
      volume: role === 'vocal' ? 0.95 : 0.48, pan: 0, offset: 0, trimStart: 0, trimEnd: null,
      fadeIn: 0, fadeOut: 0, muted: false, solo: false });
  };
  add(beatUrl, 'beat'); add(vocalUrl, 'vocal');
  return { projectId: project.id, tracks, bpm: Number(project.bpm || project.settings?.bpm) || null,
    key: project.key || project.settings?.key || '',
    lyrics: outputs.lyrics || '',
    autoDuck: true, lufsTarget: -14 };
}
