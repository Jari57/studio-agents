'use strict';

const crypto = require('crypto');
const fs = require('fs');
const { generateSyncedMusicVideo } = require('./services/videoGenerationOrchestrator');

const CANARY_KEY = 'studio-finalize-20260820-f4b931';
const JOB_TTL_MS = 45 * 60 * 1000;
const JOBS_COLLECTION = '_system_finalization_canary_jobs';
const MEDIA_COLLECTION = '_system_finalization_canary_media';
const STORAGE_PREFIX = '_system/finalization-canary';
let canaryLogger = console;
let access = {};

function now() { return Date.now(); }

function compactError(error) {
  let message;
  if (error instanceof Error) message = error.message;
  else if (error && typeof error === 'object') message = error.error || error.message || error.details || JSON.stringify(error);
  else message = String(error || 'Unknown error');
  return String(message)
    .replace(/(?:sk|rk|xi|AIza)[-_A-Za-z0-9]{12,}/g, '[redacted]')
    .slice(0, 1400);
}

function safeProviderErrors(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map(item => ({
    provider: String(item?.provider || 'unknown').slice(0, 80),
    error: compactError(item?.error || item?.message || 'unknown provider failure').slice(0, 500),
  }));
}

function serializable(value) {
  return JSON.parse(JSON.stringify(value));
}

function firestore() {
  const db = access.getFirestoreDb?.();
  if (!db) throw new Error('Firestore is unavailable for durable provider certification');
  return db;
}

function storageBucket() {
  const bucket = access.getStorageBucket?.();
  if (!bucket) throw new Error('Firebase Storage is unavailable for durable provider certification');
  return bucket;
}

async function saveJob(job) {
  await firestore().collection(JOBS_COLLECTION).doc(job.id).set(serializable(job), { merge: true });
}

async function loadJob(id) {
  const snap = await firestore().collection(JOBS_COLLECTION).doc(id).get();
  return snap.exists ? snap.data() : null;
}

function publicJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    asset: job.asset,
    status: job.status,
    createdAt: new Date(job.createdAt).toISOString(),
    startedAt: job.startedAt ? new Date(job.startedAt).toISOString() : null,
    completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : null,
    result: job.result || null,
    error: job.error || null,
  };
}

function mediaCandidate(payload, kind) {
  const candidates = kind === 'image'
    ? [payload?.output, payload?.permanentUrl, payload?.imageUrl, payload?.images?.[0], payload?.predictions?.[0]?.bytesBase64Encoded]
    : kind === 'video'
      ? [payload?.videoUrl, payload?.result?.videoUrl, payload?.permanentUrl, payload?.output, payload?.url]
      : [payload?.audioUrl, payload?.mixedAudioUrl, payload?.output, payload?.url, payload?.audio, payload?.data];
  return candidates.find(value => typeof value === 'string' && value.length > 20) || '';
}

function dataUriBuffer(reference) {
  const match = String(reference || '').match(/^data:([^;,]+)(?:;[^,]*)?,(.+)$/s);
  if (!match) return null;
  const encoded = reference.includes(';base64,');
  return {
    contentType: match[1],
    bytes: encoded ? Buffer.from(match[2], 'base64') : Buffer.from(decodeURIComponent(match[2])),
  };
}

async function materializeMedia(reference, kind) {
  if (!reference) throw new Error(`${kind} response did not contain a media reference`);
  if (fs.existsSync(reference)) {
    return {
      bytes: fs.readFileSync(reference),
      contentType: kind === 'video' ? 'video/mp4' : 'application/octet-stream',
      transport: 'local-file',
    };
  }
  const decoded = dataUriBuffer(reference);
  if (decoded) return { ...decoded, transport: 'data-uri' };
  if (!/^https?:\/\//i.test(reference)) {
    return {
      bytes: Buffer.from(reference, 'base64'),
      contentType: kind === 'image' ? 'image/unknown' : `${kind}/unknown`,
      transport: 'base64',
    };
  }
  const response = await fetch(reference, {
    headers: { 'User-Agent': 'StudioAgentsFinalCanary/3.0' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${kind} media URL returned HTTP ${response.status}`);
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || `${kind}/unknown`,
    transport: 'url',
    host: new URL(reference).host,
  };
}

async function inspectMedia(reference, kind, cleanupLocal = false) {
  const materialized = await materializeMedia(reference, kind);
  if (materialized.bytes.length < 1000) throw new Error(`${kind} media was too small (${materialized.bytes.length} bytes)`);
  if (cleanupLocal && fs.existsSync(reference)) {
    try { fs.unlinkSync(reference); } catch {}
  }
  return {
    transport: materialized.transport,
    ...(materialized.host ? { host: materialized.host } : {}),
    contentType: materialized.contentType,
    bytes: materialized.bytes.length,
  };
}

async function persistCanaryMedia(kind, reference, summary) {
  const materialized = await materializeMedia(reference, kind);
  if (materialized.bytes.length < 1000) throw new Error(`${kind} media was too small to persist`);
  const db = firestore();
  const previous = await db.collection(MEDIA_COLLECTION).doc(kind).get();
  const oldPath = previous.exists ? previous.data()?.path : null;
  const extension = /mpeg|mp3/i.test(materialized.contentType) ? 'mp3'
    : /wav/i.test(materialized.contentType) ? 'wav'
      : /png/i.test(materialized.contentType) ? 'png'
        : /jpe?g/i.test(materialized.contentType) ? 'jpg'
          : kind === 'video' ? 'mp4' : 'bin';
  const objectPath = `${STORAGE_PREFIX}/${kind}-${now()}.${extension}`;
  const token = crypto.randomUUID();
  const file = storageBucket().file(objectPath);
  await file.save(materialized.bytes, {
    resumable: false,
    metadata: {
      contentType: materialized.contentType,
      cacheControl: 'private, no-store, max-age=0',
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(storageBucket().name)}/o/${encodeURIComponent(objectPath)}?alt=media&token=${encodeURIComponent(token)}`;
  await db.collection(MEDIA_COLLECTION).doc(kind).set({
    kind,
    path: objectPath,
    url,
    createdAt: now(),
    summary: serializable(summary),
  });
  if (oldPath && oldPath !== objectPath) {
    storageBucket().file(oldPath).delete({ ignoreNotFound: true }).catch(() => undefined);
  }
  return { url, path: objectPath };
}

async function loadCanaryMedia(kind) {
  const snap = await firestore().collection(MEDIA_COLLECTION).doc(kind).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data?.url || now() - Number(data.createdAt || 0) > JOB_TTL_MS) return null;
  return data;
}

async function callLocal(path, body, timeoutMs) {
  const port = Number(process.env.PORT || 3000);
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'StudioAgentsFinalCanary/3.0',
      'X-Studio-Final-Canary': 'true',
      'X-Forwarded-For': `198.51.100.${Math.floor(Math.random() * 180) + 20}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { payload = { raw: text.slice(0, 1000) }; }
  if (!response.ok) {
    const failure = {
      error: payload?.error || null,
      details: payload?.details || null,
      providerErrors: safeProviderErrors(payload?.providerErrors),
      responseKeys: payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 20) : [],
    };
    throw new Error(`${path} returned HTTP ${response.status}: ${compactError(failure)}`);
  }
  return { status: response.status, payload };
}

async function runBeat() {
  const startedAt = now();
  const { payload } = await callLocal('/api/generate-audio', {
    prompt: 'Final certification instrumental: warm soulful hip-hop groove, clean drums, controlled bass, no vocals, no test tones.',
    bpm: 92,
    duration: 30,
    genre: 'hip-hop',
    mood: 'focused',
    quality: 'premium',
    outputFormat: 'music',
    engine: 'auto',
  }, 210000);
  const reference = mediaCandidate(payload, 'audio');
  const inspection = await inspectMedia(reference, 'audio');
  const summary = {
    asset: 'beat',
    provider: payload?.provider || payload?.source || payload?.model || 'unknown',
    durationMs: now() - startedAt,
    inspection,
    realGeneration: payload?.isRealGeneration !== false,
    providerErrors: safeProviderErrors(payload?.providerErrors),
  };
  await persistCanaryMedia('beat', reference, summary);
  return summary;
}

async function runImage() {
  const startedAt = now();
  const { payload } = await callLocal('/api/generate-image', {
    prompt: 'Professional square album cover, midnight blue recording studio, a single glowing microphone, cinematic light, no text, original composition.',
    aspectRatio: '1:1',
    agentId: 'visual',
  }, 150000);
  const reference = mediaCandidate(payload, 'image');
  const inspection = await inspectMedia(reference, 'image');
  const summary = {
    asset: 'image',
    provider: payload?.provider || payload?.source || payload?.model || 'unknown',
    durationMs: now() - startedAt,
    inspection,
  };
  await persistCanaryMedia('image', reference, summary);
  return summary;
}

async function runVocal() {
  const startedAt = now();
  const { payload } = await callLocal('/api/generate-speech', {
    prompt: '[Verse]\nBuilt from the ground, now the sound is alive.\nEvery clean take makes the whole vision rise.',
    style: 'rapper',
    voice: 'rapper-male-1',
    rapStyle: 'chill',
    genre: 'hip-hop',
    language: 'en',
    duration: 10,
    outputFormat: 'music',
    quality: 'premium',
    isPersonalVoice: false,
  }, 210000);
  const reference = mediaCandidate(payload, 'audio');
  return {
    asset: 'vocal',
    provider: payload?.provider || payload?.source || payload?.model || 'unknown',
    durationMs: now() - startedAt,
    inspection: await inspectMedia(reference, 'audio'),
    providerErrors: safeProviderErrors(payload?.providerErrors),
  };
}

async function probeJson(url, options = {}) {
  const startedAt = now();
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
    return {
      ok: response.ok,
      status: response.status,
      durationMs: now() - startedAt,
      payload: await response.json().catch(() => ({})),
    };
  } catch (error) {
    return { ok: false, status: 0, durationMs: now() - startedAt, error: compactError(error), payload: {} };
  }
}

async function runProviderDiagnostics() {
  const startedAt = now();
  const checks = {};
  const stabilityKey = process.env.STABILITY_API_KEY;
  if (stabilityKey) {
    const r = await probeJson('https://api.stability.ai/v1/user/balance', { headers: { Authorization: `Bearer ${stabilityKey}` } });
    checks.stability = { configured: true, ok: r.ok, status: r.status, durationMs: r.durationMs, creditsPositive: Number(r.payload?.credits) > 0, error: compactError(r.payload?.message || r.payload?.name || r.error || '') };
  } else checks.stability = { configured: false, ok: false };

  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (elevenKey) {
    const r = await probeJson('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': elevenKey } });
    checks.elevenlabs = { configured: true, ok: r.ok, status: r.status, durationMs: r.durationMs, error: compactError(r.payload?.detail?.message || r.payload?.detail || r.error || '') };
  } else checks.elevenlabs = { configured: false, ok: false };

  const replicateKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
  if (replicateKey) {
    const r = await probeJson('https://api.replicate.com/v1/account', { headers: { Authorization: `Bearer ${replicateKey}` } });
    checks.replicate = { configured: true, ok: r.ok, status: r.status, durationMs: r.durationMs, accountResolved: Boolean(r.payload?.username || r.payload?.name || r.payload?.type), error: compactError(r.payload?.detail || r.payload?.error || r.error || '') };
  } else checks.replicate = { configured: false, ok: false };

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const r = await probeJson(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiKey)}`);
    const models = Array.isArray(r.payload?.models) ? r.payload.models.map(model => String(model?.name || '')) : [];
    checks.gemini = { configured: true, ok: r.ok, status: r.status, durationMs: r.durationMs, textModelVisible: models.some(name => /gemini-2\.5-(flash|pro)/.test(name)), veoModelVisible: models.some(name => /veo/i.test(name)), error: compactError(r.payload?.error?.message || r.error || '') };
  } else checks.gemini = { configured: false, ok: false };

  return { asset: 'providers', durationMs: now() - startedAt, checks };
}

async function runVideo() {
  const startedAt = now();
  let beat = await loadCanaryMedia('beat');
  if (!beat) {
    await runBeat();
    beat = await loadCanaryMedia('beat');
  }
  if (!beat?.url) throw new Error('video certification could not obtain a durable beat URL');

  let image = await loadCanaryMedia('image');
  if (!image) {
    await runImage();
    image = await loadCanaryMedia('image');
  }
  if (!image?.url) throw new Error('video certification could not obtain a durable first-frame image URL');

  const replicateKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
  if (!replicateKey) throw new Error('Replicate video provider is not configured');

  const result = await generateSyncedMusicVideo(
    beat.url,
    'Cinematic night recording studio, slow camera push toward a glowing microphone, subtle blue and gold lighting, polished music video shot.',
    'Studio Agents Final Certification',
    6,
    replicateKey,
    canaryLogger,
    image.url,
    null,
  );
  if (!result?.success || result?.quality !== 'complete') throw new Error(`video orchestrator returned a non-complete result: ${compactError(result)}`);
  const inspection = await inspectMedia(result.videoUrl, 'video', true);
  return {
    asset: 'video',
    provider: 'replicate-hailuo-2.3-fast-orchestrator',
    durationMs: now() - startedAt,
    requestedDuration: 6,
    deliveredDuration: result.duration || null,
    quality: result.quality,
    inspection,
    phaseMs: result.phaseMs || null,
    beatProvider: beat.summary?.provider || null,
    beatProviderErrors: beat.summary?.providerErrors || [],
    imageProvider: image.summary?.provider || null,
  };
}

async function runAsset(asset) {
  if (asset === 'providers') return runProviderDiagnostics();
  if (asset === 'beat') return runBeat();
  if (asset === 'image') return runImage();
  if (asset === 'vocal') return runVocal();
  if (asset === 'video') return runVideo();
  throw new Error('asset must be providers, beat, image, vocal, or video');
}

async function cleanup() {
  const db = firestore();
  for (const collection of [JOBS_COLLECTION, MEDIA_COLLECTION]) {
    const snapshot = await db.collection(collection).limit(100).get();
    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  }
  const [files] = await storageBucket().getFiles({ prefix: `${STORAGE_PREFIX}/` });
  await Promise.allSettled(files.map(file => file.delete({ ignoreNotFound: true })));
  return { jobsDeleted: true, mediaFilesDeleted: files.length };
}

module.exports = function registerFinalizationCanary(app, logger, serviceAccess = {}) {
  canaryLogger = logger || console;
  access = serviceAccess;

  app.get('/api/finalize-provider-canary', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (String(req.query?.key || '') !== CANARY_KEY) return res.status(404).json({ error: 'Not found' });
    const action = String(req.query?.action || 'status');

    try {
      if (action === 'start') {
        const asset = String(req.query?.asset || '');
        if (!['providers', 'beat', 'image', 'vocal', 'video'].includes(asset)) return res.status(400).json({ error: 'asset must be providers, beat, image, vocal, or video' });
        const id = `${asset}-${crypto.randomUUID()}`;
        const job = { id, asset, status: 'queued', createdAt: now(), startedAt: null, completedAt: null, result: null, error: null };
        await saveJob(job);
        setImmediate(async () => {
          job.status = 'running';
          job.startedAt = now();
          await saveJob(job).catch(() => undefined);
          try {
            job.result = serializable(await runAsset(asset));
            job.status = 'completed';
          } catch (error) {
            job.error = compactError(error);
            job.status = 'failed';
            logger?.error?.('[finalization-canary] asset failed', { asset, jobId: id, error: job.error });
          } finally {
            job.completedAt = now();
            await saveJob(job).catch(saveError => logger?.error?.('[finalization-canary] job persistence failed', { jobId: id, error: compactError(saveError) }));
          }
        });
        return res.status(202).json({ job: publicJob(job) });
      }

      if (action === 'status') {
        const id = String(req.query?.jobId || '');
        if (id) {
          const job = await loadJob(id);
          if (!job) return res.status(404).json({ error: 'Canary job not found' });
          return res.status(200).json({ job: publicJob(job) });
        }
        const snapshot = await firestore().collection(JOBS_COLLECTION).limit(30).get();
        return res.status(200).json({ jobs: snapshot.docs.map(doc => publicJob(doc.data())) });
      }

      if (action === 'cleanup') return res.status(200).json({ ok: true, cleaned: true, ...(await cleanup()) });
      return res.status(400).json({ error: 'Unknown action' });
    } catch (error) {
      logger?.error?.('[finalization-canary] route failed', { action, error: compactError(error) });
      return res.status(500).json({ error: compactError(error) });
    }
  });
};
