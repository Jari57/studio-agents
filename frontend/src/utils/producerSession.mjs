// Identifies the audio-affecting settings of a saved render. This is not an
// authorization token; the server still validates every track and setting.
export function producerRenderSignature(session = {}) {
  const fields = ['id', 'url', 'role', 'volume', 'pan', 'offset', 'trimStart', 'trimEnd', 'fadeIn', 'fadeOut', 'muted', 'solo'];
  return JSON.stringify({
    version: 1,
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
