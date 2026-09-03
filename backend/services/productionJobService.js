'use strict';

const crypto = require('crypto');

const JOB_STATUSES = new Set(['queued', 'running', 'needs_attention', 'completed', 'cancelled']);
const ACTIVE_JOB_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const STEP_STATUSES = new Set(['pending', 'active', 'done', 'error']);
const STEP_IDS = new Set([
  'lyrics', 'beat-desc', 'visual-desc', 'beat-audio', 'image',
  'vocals', 'video', 'mux', 'final'
]);
const VALID_TRANSITIONS = Object.freeze({
  queued: new Set(['queued', 'running', 'needs_attention', 'completed', 'cancelled']),
  running: new Set(['running', 'needs_attention', 'completed', 'cancelled']),
  needs_attention: new Set(['needs_attention', 'running', 'completed', 'cancelled']),
  completed: new Set(['completed']),
  cancelled: new Set(['cancelled'])
});

function boundedString(value, maxLength, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, maxLength);
}

function safeTimestamp(value) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
}

function safeHttpsUrl(value) {
  const url = boundedString(value, 4096);
  if (!url || !/^https:\/\//i.test(url)) return null;
  return url;
}

function sanitizeSteps(steps) {
  if (!Array.isArray(steps)) return [];
  const seen = new Set();
  return steps.slice(0, 12).flatMap((step) => {
    const id = boundedString(step?.id, 40);
    if (!STEP_IDS.has(id) || seen.has(id)) return [];
    seen.add(id);
    const status = STEP_STATUSES.has(step?.status) ? step.status : 'pending';
    return [{
      id,
      label: boundedString(step?.label, 100, id),
      status,
      errorMessage: status === 'error' ? boundedString(step?.errorMessage, 500) : '',
      startTime: safeTimestamp(step?.startTime),
      endTime: safeTimestamp(step?.endTime)
    }];
  });
}

function sanitizeOutputs(outputs) {
  const allowed = ['lyrics', 'audio', 'visual', 'video'];
  return Object.fromEntries(allowed.map((key) => [
    key,
    typeof outputs?.[key] === 'string' ? outputs[key].slice(0, 120000) : null
  ]));
}

function sanitizeMediaUrls(mediaUrls) {
  const allowed = ['audio', 'image', 'video', 'vocals', 'lyricsVocal', 'mixedAudio'];
  return Object.fromEntries(allowed.map((key) => [key, safeHttpsUrl(mediaUrls?.[key])]));
}

function sanitizeAgentSelection(selection) {
  const allowed = ['lyrics', 'audio', 'visual', 'video'];
  return Object.fromEntries(allowed.map((key) => [key, boundedString(selection?.[key], 60) || null]));
}

function sanitizeSettings(settings) {
  return {
    style: boundedString(settings?.style, 100),
    language: boundedString(settings?.language, 60, 'English'),
    duration: Math.max(15, Math.min(600, Number(settings?.duration) || 90)),
    bpm: Math.max(40, Math.min(240, Number(settings?.bpm) || 120)),
    mood: boundedString(settings?.mood, 80),
    structure: boundedString(settings?.structure, 80),
    outputFormat: boundedString(settings?.outputFormat, 40, 'music'),
    includeVocals: settings?.includeVocals !== false
  };
}

function serializeJob(id, data) {
  const convert = (value) => value && typeof value.toDate === 'function'
    ? value.toDate().toISOString()
    : value || null;
  return {
    id,
    ...data,
    createdAt: convert(data.createdAt),
    updatedAt: convert(data.updatedAt),
    completedAt: convert(data.completedAt)
  };
}

function jobIdFor(userId, idempotencyKey) {
  return `prod_${crypto.createHash('sha256').update(`${userId}:${idempotencyKey}`).digest('hex').slice(0, 32)}`;
}

function createProductionJobService({ getDb, admin, logger = console }) {
  if (typeof getDb !== 'function') throw new TypeError('getDb is required');

  async function create(userId, input = {}) {
    const db = getDb();
    if (!db) throw new Error('Firestore unavailable');
    const idempotencyKey = boundedString(input.idempotencyKey, 128);
    const prompt = boundedString(input.prompt, 2000);
    const steps = sanitizeSteps(input.steps);
    if (!userId || !idempotencyKey || !prompt || steps.length === 0) {
      const error = new Error('idempotencyKey, prompt, and pipeline steps are required');
      error.statusCode = 400;
      throw error;
    }

    const id = jobIdFor(userId, idempotencyKey);
    const ref = db.collection('users').doc(userId).collection('productionJobs').doc(id);
    let deduplicated = false;
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists) {
        deduplicated = true;
        return;
      }
      transaction.create(ref, {
        id,
        schemaVersion: 1,
        idempotencyKey,
        prompt,
        projectId: boundedString(input.projectId, 128) || null,
        creatorMode: input.creatorMode === 'creator' ? 'creator' : 'artist',
        agentSelection: sanitizeAgentSelection(input.agentSelection),
        settings: sanitizeSettings(input.settings),
        status: 'running',
        currentStep: steps[0]?.id || null,
        steps,
        snapshot: {
          outputs: sanitizeOutputs(input.snapshot?.outputs),
          mediaUrls: sanitizeMediaUrls(input.snapshot?.mediaUrls)
        },
        revision: 0,
        attempt: 1,
        lastError: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: null
      });
    });

    const snapshot = await ref.get();
    logger.info('🎚️ Production job ready', { userId, jobId: id, deduplicated });
    return { job: serializeJob(id, snapshot.data()), deduplicated };
  }

  async function update(userId, jobId, input = {}) {
    const db = getDb();
    if (!db) throw new Error('Firestore unavailable');
    const ref = db.collection('users').doc(userId).collection('productionJobs').doc(String(jobId));

    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (!existing.exists) {
        const error = new Error('Production job not found');
        error.statusCode = 404;
        throw error;
      }
      const current = existing.data();
      const requestedRevision = Number(input.revision);
      if (!Number.isInteger(requestedRevision) || requestedRevision <= (Number(current.revision) || 0)) {
        return;
      }
      const requestedStatus = JOB_STATUSES.has(input.status) ? input.status : current.status;
      if (!VALID_TRANSITIONS[current.status]?.has(requestedStatus)) {
        const error = new Error(`Invalid production job transition: ${current.status} → ${requestedStatus}`);
        error.statusCode = 409;
        throw error;
      }
      const steps = input.steps ? sanitizeSteps(input.steps) : current.steps;
      if (!steps?.length) {
        const error = new Error('At least one valid pipeline step is required');
        error.statusCode = 400;
        throw error;
      }
      if (requestedStatus === 'completed' && steps.some((step) => step.status !== 'done')) {
        const error = new Error('A production cannot complete while pipeline steps remain unfinished');
        error.statusCode = 409;
        throw error;
      }
      transaction.update(ref, {
        status: requestedStatus,
        currentStep: STEP_IDS.has(input.currentStep) ? input.currentStep : current.currentStep,
        steps,
        snapshot: input.snapshot ? {
          outputs: sanitizeOutputs(input.snapshot.outputs),
          mediaUrls: sanitizeMediaUrls(input.snapshot.mediaUrls)
        } : current.snapshot,
        lastError: boundedString(input.lastError, 1000),
        revision: requestedRevision,
        attempt: input.incrementAttempt === true
          ? Math.min(25, (Number(current.attempt) || 1) + 1)
          : Number(current.attempt) || 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: requestedStatus === 'completed'
          ? admin.firestore.FieldValue.serverTimestamp()
          : current.completedAt || null
      });
    });

    const snapshot = await ref.get();
    return serializeJob(snapshot.id, snapshot.data());
  }

  async function getActive(userId, { now = Date.now(), maxAgeMs = ACTIVE_JOB_MAX_AGE_MS } = {}) {
    const db = getDb();
    if (!db) throw new Error('Firestore unavailable');
    const collection = db.collection('users').doc(userId).collection('productionJobs');
    const snapshot = await collection.limit(50).get();
    const jobs = [];
    const expired = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!['queued', 'running', 'needs_attention'].includes(data.status)) return;
      const job = serializeJob(doc.id, data);
      const lastTouched = Date.parse(job.updatedAt || job.createdAt || '');
      // An unfinished run that nobody touched for a day is abandoned, not
      // "active". Re-offering it forever made every fresh orchestrator open
      // with a stale "Production ready to resume" banner.
      if (Number.isFinite(lastTouched) && now - lastTouched > maxAgeMs) {
        expired.push(doc.ref);
        return;
      }
      jobs.push(job);
    });
    if (expired.length > 0) {
      const timestamp = admin?.firestore?.FieldValue?.serverTimestamp?.() ?? new Date().toISOString();
      await Promise.all(expired.map((ref) => ref.set({
        status: 'cancelled',
        lastError: 'Expired: production was not resumed within 24 hours.',
        updatedAt: timestamp,
        completedAt: timestamp
      }, { merge: true }).catch((error) => {
        logger.warn?.(`[ProductionJobs] Could not expire stale job ${ref.id}: ${error.message}`);
      })));
    }
    jobs.sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
    return jobs[0] || null;
  }

  return { create, update, getActive };
}

module.exports = {
  JOB_STATUSES,
  STEP_IDS,
  createProductionJobService,
  sanitizeSteps,
  sanitizeOutputs,
  sanitizeMediaUrls,
  jobIdFor
};
