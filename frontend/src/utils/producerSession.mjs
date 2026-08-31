// Identifies the audio-affecting settings of a saved render. This is not an
// authorization token; the server still validates every track and setting.
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
