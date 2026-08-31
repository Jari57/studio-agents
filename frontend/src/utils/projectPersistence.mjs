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
  return { ...merged, id: current.id, assets, syncedAt: current.syncedAt, serverRevision: current.serverRevision };
}

// Only replace fields still equal to what was submitted. An upload or response
// that arrives after another local edit cannot roll that newer edit back.
export function applySavedProjectRevision(current, submitted, persisted, acknowledgedAt, revision) {
  if (!current || current.id !== submitted.id) return current;
  const result = mergeFields(current, persisted, submitted);
  const submittedAssets = new Map((submitted.assets || []).filter(a => a?.id).map(a => [a.id, a]));
  const persistedAssets = new Map((persisted.assets || []).filter(a => a?.id).map(a => [a.id, a]));
  result.assets = (current.assets || []).map(asset => persistedAssets.has(asset?.id)
    ? mergeFields(asset, persistedAssets.get(asset.id), submittedAssets.get(asset.id))
    : asset);
  if (acknowledgedAt && (!current.syncedAt || acknowledgedAt > current.syncedAt)) result.syncedAt = acknowledgedAt;
  if (revision && (!current.syncedAt || acknowledgedAt >= current.syncedAt)) result.serverRevision = revision;
  return result;
}

// `syncedAt` written inside a document is a client timestamp from before its
// server commit. Only the timestamp/revision returned by the read is a valid
// baseline. Preferring the old embedded syncedAt caused conflicts on reopen.
export function cloudProjectSnapshot(project, revision = project?.serverRevision || project?.revision) {
  if (!project || typeof project !== 'object') return project;
  return {
    ...project,
    syncedAt: project.updatedAt || project.savedAt || null,
    serverRevision: revision || null
  };
}

const revisionFields = new Set(['id', 'updatedAt', 'savedAt', 'syncedAt', 'serverRevision', 'revision']);

export function prepareProjectConflictRebase(remote, local, baseline) {
  if (!baseline?.id || remote?.id !== local?.id || remote.id !== baseline.id) {
    return { project: null, conflicts: ['missing original project version'] };
  }
  const conflicts = [];
  const merge = (server = {}, client = {}, original = {}, prefix = '') => {
    const result = { ...server };
    for (const [key, value] of Object.entries(client)) {
      if (!prefix && (revisionFields.has(key) || key === 'assets')) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (equal(value, original[key]) || equal(value, server[key])) continue;
      if (equal(server[key], original[key])) result[key] = value;
      else if (isRecord(server[key]) && isRecord(value) && (isRecord(original[key]) || original[key] === undefined)) {
        result[key] = merge(server[key], value, original[key] || {}, path);
      } else conflicts.push(path);
    }
    return result;
  };
  const project = merge(remote, local, baseline);
  project.assets = [...(remote.assets || [])];
  const originals = new Map((baseline.assets || []).filter(a => a?.id).map(a => [a.id, a]));
  for (const asset of local.assets || []) {
    if (!asset || typeof asset !== 'object') continue;
    const index = asset.id ? project.assets.findIndex(a => a?.id === asset.id) : project.assets.findIndex(a => equal(a, asset));
    const original = asset.id ? originals.get(asset.id) : (baseline.assets || []).find(a => equal(a, asset));
    if (index >= 0) project.assets[index] = merge(project.assets[index], asset, original || {}, `assets.${asset.id || index}`);
    else if (!original) project.assets.push(asset);
    else if (!equal(original, asset)) conflicts.push(`assets.${asset.id || 'unidentified'} was removed in another session`);
    // An unchanged old asset removed remotely stays removed.
  }
  return { project: conflicts.length ? null : project, conflicts };
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
    return JSON.stringify({ uid, projects }, (key, value) => key === 'syncedAt' || key === 'serverRevision' || key === 'revision' ? undefined : value);
  } catch {
    return null;
  }
}
