const slots = ['lyrics', 'audio', 'visual', 'video'];
const defaults = { lyrics: 'ghost', audio: 'beat', visual: 'album', video: 'video-creator' };

export function serializeProductionConfig(config = {}) {
  return {
    version: 1,
    selectedAgents: Object.fromEntries(slots.map(slot => [slot,
      typeof config.selectedAgents?.[slot] === 'string' && config.selectedAgents[slot].trim()
        ? config.selectedAgents[slot] : null])),
    quickMode: config.quickMode === true,
    quickOutcome: ['song', 'song-draft', 'full-package'].includes(config.quickOutcome) ? config.quickOutcome : 'full-package',
    quickGenre: typeof config.quickGenre === 'string' && config.quickGenre ? config.quickGenre : 'Modern Hip-Hop'
  };
}

export function restoreProductionConfig(project) {
  if (project?.productionConfig?.version === 1) return serializeProductionConfig(project.productionConfig);
  if (!project?.id) return serializeProductionConfig({ selectedAgents: { ...defaults, visual: null, video: null }, quickMode: true, quickOutcome: 'song' });

  // Legacy projects did not record generation scope. Infer only the outputs
  // already present, and open Advanced mode so a full package is never silently
  // purchased on reopening an artwork-only (or otherwise partial) project.
  const selectedAgents = Object.fromEntries(slots.map(slot => [slot, null]));
  for (const asset of project.assets || []) {
    if (['lyrics', 'vocal'].includes(asset?.type)) selectedAgents.lyrics = defaults.lyrics;
    if (['audio', 'beat'].includes(asset?.type)) selectedAgents.audio = defaults.audio;
    if (['visual', 'image', 'cover'].includes(asset?.type)) selectedAgents.visual = defaults.visual;
    if (asset?.type === 'video') selectedAgents.video = defaults.video;
  }
  if (project.mediaUrls?.image) selectedAgents.visual = defaults.visual;
  if (project.mediaUrls?.audio) selectedAgents.audio = defaults.audio;
  if (project.mediaUrls?.video) selectedAgents.video = defaults.video;
  if (project.mediaUrls?.vocals || project.mediaUrls?.lyricsVocal) selectedAgents.lyrics = defaults.lyrics;
  return serializeProductionConfig({ selectedAgents, quickMode: false, quickGenre: project.style });
}

export function withProductionConfig(project, config) {
  return { ...project, productionConfig: serializeProductionConfig(config) };
}

function assetIdentity(asset) {
  const kind = ['visual', 'image', 'cover'].includes(asset?.type) ? 'image'
    : ['audio', 'beat'].includes(asset?.type) ? 'audio' : asset?.type;
  const media = kind === 'image' ? asset.imageUrl || asset.url
    : kind === 'audio' || kind === 'vocal' ? asset.audioUrl || asset.url
      : kind === 'video' ? asset.videoUrl || asset.url
        : kind === 'pro' || kind === 'mix' || kind === 'master' ? [asset.audioUrl, asset.videoUrl].filter(Boolean).join('|') : null;
  const content = typeof asset?.content === 'string' ? asset.content : JSON.stringify(asset?.content ?? null);
  return JSON.stringify([kind, media || null, media ? null : content]);
}

// A save action is not a new generation. Reuse the identity of the same output
// across autosave/manual retry/reopen; a different media URL or complete text
// remains a distinct revision. Never use only a short text prefix to dedupe.
export function mergeProductionAssets(existing = [], candidates = [], identityCache = new Map()) {
  const merged = existing.filter(asset => asset && typeof asset === 'object');
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const fingerprint = assetIdentity(candidate);
    const cachedId = identityCache.get(fingerprint);
    const index = merged.findIndex(asset => (cachedId && asset.id === cachedId) || assetIdentity(asset) === fingerprint);
    if (index >= 0) {
      const prior = merged[index];
      merged[index] = {
        ...prior,
        ...candidate,
        id: prior.id,
        type: prior.type,
        title: prior.title || candidate.title,
        createdAt: prior.createdAt || candidate.createdAt,
        ...(prior.version != null ? { version: prior.version } : {}),
        // The same inline payload may already have been uploaded by autosave.
        ...Object.fromEntries(['imageUrl', 'audioUrl', 'videoUrl'].filter(key =>
          /^(data:|blob:)/i.test(candidate[key] || '') && /^https?:/i.test(prior[key] || '')
        ).map(key => [key, prior[key]]))
      };
      identityCache.set(fingerprint, prior.id);
    } else {
      const id = cachedId || candidate.id;
      merged.push({ ...candidate, id });
      identityCache.set(fingerprint, id);
    }
  }
  return merged;
}
