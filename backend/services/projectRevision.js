'use strict';

function timestampIso(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function projectRevision(data = {}) {
  return timestampIso(data.updatedAt) || timestampIso(data.savedAt) || timestampIso(data.createdAt) || 'unversioned';
}

function canonicalProjectSnapshot(id, data = {}) {
  const revision = projectRevision(data);
  return {
    ...data,
    id,
    savedAt: timestampIso(data.savedAt),
    updatedAt: revision === 'unversioned' ? null : revision,
    createdAt: timestampIso(data.createdAt),
    syncedAt: revision === 'unversioned' ? null : revision,
    serverRevision: revision,
  };
}

function nextProjectTimestampMs(data, now = Date.now()) {
  const priorMs = Date.parse(projectRevision(data));
  return Math.max(now, Number.isFinite(priorMs) ? priorMs + 1 : now);
}

module.exports = { projectRevision, canonicalProjectSnapshot, nextProjectTimestampMs };
