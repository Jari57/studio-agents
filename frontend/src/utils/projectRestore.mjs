const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const timestamp = asset => {
  const value = asset.createdAt || asset.timestamp || asset.updatedAt;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'number') return value;
  return Date.parse(value) || 0;
};

export function newestProjectAssets(assets = []) {
  // Current saves prepend takes. Explicit timestamps also support legacy append-only projects.
  return [...assets].filter(Boolean).sort((a, b) => timestamp(b) - timestamp(a));
}

export function restoreProjectOutputs(project = {}) {
  const media = { ...(project.mediaUrls || {}) };
  const outputs = { ...(project.outputs || {}) };
  const put = (target, key, value) => { if (!owns(target, key) && value) target[key] = value; };
  for (const asset of newestProjectAssets(project.assets)) {
    if (['beat', 'audio'].includes(asset.type)) {
      put(media, 'audio', asset.audioUrl); put(outputs, 'audio', asset.content);
    }
    if (asset.type === 'vocal' || (asset.type === 'lyrics' && asset.audioUrl)) {
      // Clearing either canonical vocal slot must not resurrect an older take through its alias.
      if (!owns(media, 'vocals') && !owns(media, 'lyricsVocal')) {
        put(media, 'vocals', asset.audioUrl); put(media, 'lyricsVocal', asset.audioUrl);
      }
    }
    if (['master', 'mix'].includes(asset.type)) put(media, 'mixedAudio', asset.audioUrl);
    if (['image', 'cover', 'visual'].includes(asset.type)) {
      put(media, 'image', asset.imageUrl || asset.url); put(outputs, 'visual', asset.content);
    }
    if (asset.type === 'video') { put(media, 'video', asset.videoUrl); put(outputs, 'video', asset.content); }
    if (asset.type === 'lyrics') put(outputs, 'lyrics', asset.content);
  }
  return { media, outputs };
}
