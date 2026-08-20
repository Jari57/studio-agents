'use strict';

const crypto = require('crypto');
const fs = require('fs');
const { generateSyncedMusicVideo } = require('./services/videoGenerationOrchestrator');

const CANARY_KEY = 'studio-finalize-20260820-f4b931';
const JOB_TTL_MS = 45 * 60 * 1000;
const jobs = new Map();
const successfulMedia = new Map();
let canaryLogger = console;

function now() {
  return Date.now();
}

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

async function inspectMedia(reference, kind, cleanupLocal = false) {
  if (!reference) throw new Error(`${kind} response did not contain a media reference`);

  if (fs.existsSync(reference)) {
    const bytes = fs.readFileSync(reference);
    if (bytes.length < 1000) throw new Error(`${kind} local media was too small (${bytes.length} bytes)`);
    const result = {
      transport: 'local-file',
      contentType: kind === 'video' ? 'video/mp4' : `${kind}/unknown`,
      bytes: bytes.length,
    };
    if (cleanupLocal) {
      try { fs.unlinkSync(reference); } catch {}
    }
    return result;
  }

  if (reference.startsWith('data:')) {
    const decoded = dataUriBuffer(reference);
    if (!decoded) throw new Error(`${kind} returned an invalid data URI`);
    if (decoded.bytes.length < 1000) throw new Error(`${kind} media was too small (${decoded.bytes.length} bytes)`);
    return {
      transport: 'data-uri',
      contentType: decoded.contentType,
      bytes: decoded.bytes.length,
    };
  }

  if (!/^https?:\/\//i.test(reference)) {
    const bytes = Buffer.from(reference, 'base64');
    if (bytes.length < 1000) throw new Error(`${kind} media was too small (${bytes.length} bytes)`);
    return {
      transport: 'base64',
      contentType: kind === 'image' ? 'image/unknown' : `${kind}/unknown`,
      bytes: bytes.length,
    };
  }

  const response = await fetch(reference, {
    headers: { Range: 'bytes=0-65535', 'User-Agent': 'StudioAgentsFinalCanary/2.0' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok && response.status !== 206) {
    throw new Error(`${kind} media URL returned HTTP ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error(`${kind} media URL returned too little data (${bytes.length} bytes)`);
  return {
    transport: 'url',
    host: new URL(reference).host,
    contentType: response.headers.get('content-type') || `${kind}/unknown`,
    bytes: bytes.length,
  };
}

async function callLocal(path, body, timeoutMs) {
  const port = Number(process.env.PORT || 3000);
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'StudioAgentsFinalCanary/2.0',
      'X-Studio-Final-Canary': 'true',
      'X-Forwarded-For': `198.51.100.${Math.floor(Math.random() * 180) + 20}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text.slice(0, 1000) };
  }
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
    engine: 'stability',
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
  successfulMedia.set('beat', { reference, createdAt: now(), summary });
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
  successfulMedia.set('image', { reference, createdAt: now(), summary });
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
  const inspection = await inspectMedia(reference, 'audio');
  const summary = {
    asset: 'vocal',
    provider: payload?.provider || payload?.source || payload?.model || 'unknown',
    durationMs: now() - startedAt,
    inspection,
    providerErrors: safeProviderErrors(payload?.providerErrors),
  };
  successfulMedia.set('vocal', { reference, createdAt: now(), summary });
  return summary;
}

async function probeJson(name, url, options = {}) {
  const startedAt = now();
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
    const payload = await response.json().catch(() => ({}));
    return {
      name,
      configured: true,
      ok: response.ok,
      status: response.status,
      durationMs: now() - startedAt,
      payload,
    };
  } catch (error) {
    return {
      name,
      configured: true,
      ok: false,
      status: 0,
      durationMs: now() - startedAt,
      error: compactError(error),
      payload: {},
    };
  }
}

async function runProviderDiagnostics() {
  const startedAt = now();
  const checks = {};

  const stabilityKey = process.env.STABILITY_API_KEY;
  if (stabilityKey) {
    const result = await probeJson('stability', 'https://api.stability.ai/v1/user/balance', {
      headers: { Authorization: `Bearer ${stabilityKey}`, Accept: 'application/json' },
    });
    checks.stability = {
      configured: true,
      ok: result.ok,
      status: result.status,
      durationMs: result.durationMs,
      creditsPositive: Number(result.payload?.credits) > 0,
      error: compactError(result.payload?.message || result.payload?.name || result.error || ''),
    };
  } else checks.stability = { configured: false, ok: false };

  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (elevenKey) {
    const result = await probeJson('elevenlabs', 'https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': elevenKey, Accept: 'application/json' },
    });
    const remaining = Number(result.payload?.character_limit || 0) - Number(result.payload?.character_count || 0);
    checks.elevenlabs = {
      configured: true,
      ok: result.ok,
      status: result.status,
      durationMs: result.durationMs,
      tier: String(result.payload?.tier || result.payload?.status || 'unknown').slice(0, 80),
      charactersRemainingPositive: Number.isFinite(remaining) ? remaining > 0 : null,
      error: compactError(result.payload?.detail?.message || result.payload?.detail || result.error || ''),
    };
  } else checks.elevenlabs = { configured: false, ok: false };

  const replicateKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
  if (replicateKey) {
    const result = await probeJson('replicate', 'https://api.replicate.com/v1/account', {
      headers: { Authorization: `Bearer ${replicateKey}`, Accept: 'application/json' },
    });
    checks.replicate = {
      configured: true,
      ok: result.ok,
      status: result.status,
      durationMs: result.durationMs,
      accountResolved: Boolean(result.payload?.username || result.payload?.name || result.payload?.type),
      error: compactError(result.payload?.detail || result.payload?.error || result.error || ''),
    };
  } else checks.replicate = { configured: false, ok: false };

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const result = await probeJson('gemini', `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiKey)}`, {
      headers: { Accept: 'application/json' },
    });
    const models = Array.isArray(result.payload?.models) ? result.payload.models.map(model => String(model?.name || '')) : [];
    checks.gemini = {
      configured: true,
      ok: result.ok,
      status: result.status,
      durationMs: result.durationMs,
      textModelVisible: models.some(name => /gemini-2\.5-(flash|pro)/.test(name)),
      veoModelVisible: models.some(name => /veo/i.test(name)),
      error: compactError(result.payload?.error?.message || result.error || ''),
    };
  } else checks.gemini = { configured: false, ok: false };

  return {
    asset: 'providers',
    durationMs: now() - startedAt,
    checks,
  };
}

async function runVideo() {
  const startedAt = now();
  let beat = successfulMedia.get('beat');
  if (!beat || now() - beat.createdAt > JOB_TTL_MS) {
    const summary = await runBeat();
    beat = successfulMedia.get('beat');
    if (beat) beat.summary = summary;
  }
  if (!beat?.reference) throw new Error('video certification could not obtain a valid beat');

  const port = Number(process.env.PORT || 3000);
  const localBeatUrl = `http://127.0.0.1:${port}/api/finalize-provider-canary-media/beat?key=${encodeURIComponent(CANARY_KEY)}`;
  const replicateKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
  if (!replicateKey) throw new Error('Replicate video provider is not configured');

  const result = await generateSyncedMusicVideo(
    localBeatUrl,
    'Cinematic night recording studio, slow camera push toward a glowing microphone, subtle blue and gold lighting, polished music video shot.',
    'Studio Agents Final Certification',
    6,
    replicateKey,
    canaryLogger,
    null,
    null,
  );
  if (!result?.success || result?.quality !== 'complete') {
    throw new Error(`video orchestrator returned a non-complete result: ${compactError(result)}`);
  }
  const inspection = await inspectMedia(result.videoUrl, 'video', true);
  return {
    asset: 'video',
    provider: 'replicate-minimax-orchestrator',
    durationMs: now() - startedAt,
    requestedDuration: 6,
    deliveredDuration: result.duration || null,
    quality: result.quality,
    inspection,
    phaseMs: result.phaseMs || null,
    beatProvider: beat.summary?.provider || null,
    beatProviderErrors: beat.summary?.providerErrors || [],
  };
}

async function runAsset(asset) {
  if (asset === 'beat') return runBeat();
  if (asset === 'image') return runImage();
  if (asset === 'vocal') return runVocal();
  if (asset === 'video') return runVideo();
  if (asset === 'providers') return runProviderDiagnostics();
  throw new Error('asset must be providers, beat, image, vocal, or video');
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

function prune() {
  const cutoff = now() - JOB_TTL_MS;
  for (const [id, job] of jobs) if (job.createdAt < cutoff) jobs.delete(id);
  for (const [key, media] of successfulMedia) if (media.createdAt < cutoff) successfulMedia.delete(key);
}

async function serveCanaryMedia(req, res) {
  if (String(req.query?.key || '') !== CANARY_KEY) return res.status(404).end();
  const kind = String(req.params?.kind || '');
  const media = successfulMedia.get(kind);
  if (!media?.reference) return res.status(404).json({ error: 'Canary media unavailable' });

  const decoded = dataUriBuffer(media.reference);
  if (decoded) {
    res.setHeader('Content-Type', decoded.contentType);
    res.setHeader('Content-Length', String(decoded.bytes.length));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(decoded.bytes);
  }

  if (/^https?:\/\//.test(media.reference)) {
    const upstream = await fetch(media.reference, { signal: AbortSignal.timeout(30000) });
    if (!upstream.ok) return res.status(502).json({ error: `Upstream media returned ${upstream.status}` });
    const bytes = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(bytes);
  }

  return res.status(500).json({ error: 'Unsupported canary media reference' });
}

module.exports = function registerFinalizationCanary(app, logger) {
  canaryLogger = logger || console;
  prune();

  app.get('/api/finalize-provider-canary-media/:kind', (req, res) => {
    serveCanaryMedia(req, res).catch(error => {
      logger?.error?.('[finalization-canary] media serve failed', { error: compactError(error) });
      if (!res.headersSent) res.status(500).json({ error: 'Canary media serve failed' });
    });
  });

  app.get('/api/finalize-provider-canary', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (String(req.query?.key || '') !== CANARY_KEY) {
      return res.status(404).json({ error: 'Not found' });
    }

    prune();
    const action = String(req.query?.action || 'status');
    if (action === 'start') {
      const asset = String(req.query?.asset || '');
      if (!['providers', 'beat', 'image', 'vocal', 'video'].includes(asset)) {
        return res.status(400).json({ error: 'asset must be providers, beat, image, vocal, or video' });
      }
      const existing = [...jobs.values()].find(job => job.asset === asset && (job.status === 'queued' || job.status === 'running'));
      if (existing) return res.status(202).json({ job: publicJob(existing), reused: true });

      const id = `${asset}-${crypto.randomUUID()}`;
      const job = { id, asset, status: 'queued', createdAt: now(), result: null, error: null };
      jobs.set(id, job);
      setImmediate(async () => {
        job.status = 'running';
        job.startedAt = now();
        try {
          job.result = await runAsset(asset);
          job.status = 'completed';
        } catch (error) {
          job.error = compactError(error);
          job.status = 'failed';
          logger?.error?.('[finalization-canary] asset failed', { asset, jobId: id, error: job.error });
        } finally {
          job.completedAt = now();
        }
      });
      return res.status(202).json({ job: publicJob(job) });
    }

    if (action === 'status') {
      const id = String(req.query?.jobId || '');
      if (id) {
        const job = jobs.get(id);
        if (!job) return res.status(404).json({ error: 'Canary job not found' });
        return res.status(200).json({ job: publicJob(job) });
      }
      return res.status(200).json({ jobs: [...jobs.values()].map(publicJob) });
    }

    if (action === 'cleanup') {
      jobs.clear();
      successfulMedia.clear();
      return res.status(200).json({ ok: true, cleaned: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  });
};
