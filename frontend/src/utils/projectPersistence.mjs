// Keep cloud writes out of React state updaters. A rejected/failed save must not
// prevent a later retry, and each account/project has its own serial queue.
export function createProjectSaveQueue() {
  const pending = new Map();
  return (key, task) => {
    const result = (pending.get(key) || Promise.resolve()).catch(() => {}).then(task);
    pending.set(key, result);
    const cleanup = () => { if (pending.get(key) === result) pending.delete(key); };
    result.then(cleanup, cleanup);
    return result;
  };
}

const equal = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);

// Generated callbacks often contain an old full-project snapshot. Apply only
// changes from that snapshot, preserving edits made since generation started.
function mergeFields(current = {}, incoming = {}, baseline = {}) {
  const result = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (isRecord(current[key]) && isRecord(value)) {
      result[key] = mergeFields(current[key], value, isRecord(baseline[key]) ? baseline[key] : {});
    } else if (!(key in current) || (equal(current[key], baseline[key]) && !equal(value, baseline[key]))) {
      result[key] = value;
    }
  }
  return result;
}

export function mergeGeneratedProject(current, incoming, baseline = {}) {
  if (!current) return { ...incoming, assets: [...(incoming.assets || [])] };
  const merged = mergeFields(current, incoming, baseline || {});
  const assets = [...(current.assets || [])];
  const baselineAssets = new Map((baseline?.assets || []).filter(a => a?.id).map(a => [a.id, a]));
  for (const asset of incoming.assets || []) {
    if (!asset || typeof asset !== 'object') continue;
    const index = asset.id ? assets.findIndex(a => a?.id === asset.id) : -1;
    if (index < 0) assets.push(asset);
    else assets[index] = mergeFields(assets[index], asset, baselineAssets.get(asset.id));
  }
  // Assets are append/merge here, never a destructive snapshot replacement.
  // Text sharing a prefix or alternate versions of the same media remain intact.
  return { ...merged, id: current.id, assets, syncedAt: current.syncedAt };
}

// Only replace fields still equal to what was submitted. An upload or response
// that arrives after another local edit cannot roll that newer edit back.
export function applySavedProjectRevision(current, submitted, persisted, acknowledgedAt) {
  if (!current || current.id !== submitted.id) return current;
  const result = mergeFields(current, persisted, submitted);
  const submittedAssets = new Map((submitted.assets || []).filter(a => a?.id).map(a => [a.id, a]));
  const persistedAssets = new Map((persisted.assets || []).filter(a => a?.id).map(a => [a.id, a]));
  result.assets = (current.assets || []).map(asset => persistedAssets.has(asset?.id)
    ? mergeFields(asset, persistedAssets.get(asset.id), submittedAssets.get(asset.id))
    : asset);
  if (acknowledgedAt && (!current.syncedAt || acknowledgedAt > current.syncedAt)) result.syncedAt = acknowledgedAt;
  return result;
}

export function replaceUploadedMedia(value, replacements) {
  if (typeof value === 'string') return replacements.get(value) || value;
  if (Array.isArray(value)) return value.map(item => replaceUploadedMedia(item, replacements));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceUploadedMedia(child, replacements)]));
}

export function hasUnpersistedMedia(value) {
  if (typeof value === 'string') return /^(data:|blob:)/i.test(value) || value === '[Media Data Pruned to Save Space]';
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some(hasUnpersistedMedia);
}

export function requireDurableSaveResult(result) {
  if (result?.success !== true || result.warning || !result.updatedAt) {
    throw new Error('Cloud storage did not confirm this save. Keep this project open and retry.');
  }
  return result.updatedAt;
}

// An acknowledgement updates the concurrency token, not the creator's work.
// Excluding that token prevents acknowledgement -> autosave -> acknowledgement
// loops while edits made during an outstanding save still schedule a new save.
export function projectSyncSignature(uid, projects) {
  try {
    return JSON.stringify({ uid, projects }, (key, value) => key === 'syncedAt' ? undefined : value);
  } catch {
    return null;
  }
}
