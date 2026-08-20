'use strict';

const crypto = require('crypto');

const CANARY_KEY = 'studio-finalize-20260820-f4b931';
const JOB_TTL_MS = 45 * 60 * 1000;
const jobs = new Map();
const successfulMedia = new Map();

function now() {
  return Date.now();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function compactError(error) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown error');
  return message.replace(/(?:sk|rk|xi|AIza)[-_A-Za-z0-9]{12,}/g, '[redacted]').slice(0, 900);
}

function mediaCandidate(payload, kind) {
  const candidates = kind === 'image'
    ? [payload?.output, payload?.permanentUrl, payload?.imageUrl, payload?.images?.[0], payload?.predictions?.[0]?.bytesBase64Encoded]
    : kind === 'video'
      ? [payload?.videoUrl, payload?.result?.videoUrl, payload?.output, payload?.url]
      : [payload?.audioUrl, payload?.mixedAudioUrl, payload?.output, payload?.url, payload?.audio, payload?.data];
  return candidates.find(value => typeof value === 'string' && value.length > 20) || '';
}

async function inspectMedia(reference, kind) {
  if (!reference) throw new Error(`${kind} response did not contain a media reference`);

  if (reference.startsWith('data:')) {
    const match = reference.match(/^data:([^;,]+)(?:;[^,]*)?,(.+)$/s);
    if (!match) throw new Error(`${kind} returned an invalid data URI`);
    const encoded = reference.includes(';base64,');
    const bytes = encoded ? Buffer.from(match[2], 'base64') : Buffer.from(decodeURIComponent(match[2]));
    if (bytes.length < 1000) throw new Error(`${kind} media was too small (${bytes.length} bytes)`);
    return {
      transport: 'data-uri',
      contentType: match[1],
      bytes: bytes.length,
    };
  }

  if (!/^https?:\/\//i.test(reference)) {
    // Some image fallbacks return bare base64. Validate without echoing it.
    const bytes = Buffer.from(reference, 'base64');
    if (bytes.length < 1000) throw new Error(`${kind} media was too small (${bytes.length} bytes)`);
    return {
      transport: 'base64',
      contentType: kind === 'image' ? 'image/unknown' : `${kind}/unknown`,
      bytes: bytes.length,
    };
  }

  const response = await fetch(reference, {
    headers: { Range: 'bytes=0-65535', 'User-Agent': 'StudioAgentsFinalCanary/1.0' },
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
      'User-Agent': 'StudioAgentsFinalCanary/1.0',
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
    throw new Error(`${path} returned HTTP ${response.status}: ${compactError(payload?.details || payload?.error || text)}`);
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
  successfulMedia.set('beat', { reference, createdAt: now() });
  return {
    asset: 'beat',
    provider: payload?.provider || payload?.source || payload?.model || 'unknown',
    durationMs: now() - startedAt,
    inspection,
    realGeneration: payload?.isRealGeneration !== false,
  };
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
  successfulMedia.set('image', { reference, createdAt: now() });
  return {
    asset: 'image',
    provider: payload?.provider || payload?.source || payload?.model || 'unknown',
    durationMs: now() - startedAt,
    inspection,
  };
}

async function runVocal() {
  const startedAt = now();
  const { payload } = await callLocal('/api/generate-speech', {
    prompt: '[Verse]\nBuilt from the ground, now the sound is alive.\nEvery clean take makes the whole vision rise.',
    style: 'narrator',
    voice: 'narrator',
    rapStyle: 'chill',
    genre: 'hip-hop',
    language: 'en',
    duration: 8,
    outputFormat: 'music',
    preferredProvider: 'elevenlabs-premium',
    isPersonalVoice: false,
  }, 120000);
  const reference = mediaCandidate(payload, 'audio');
  const inspection = await inspectMedia(reference, 'audio');
  successfulMedia.set('vocal', { reference, createdAt: now() });
  return {
    asset: 'vocal',
    provider: payload?.provider || payload?.source || payload?.model || 'unknown',
    durationMs: now() - startedAt,
    inspection,
  };
}

async function waitForVideoJob(jobId) {
  const port = Number(process.env.PORT || 3000);
  const deadline = now() + 7 * 60 * 1000;
  while (now() < deadline) {
    const response = await fetch(`http://127.0.0.1:${port}/api/video-job-status-test/${encodeURIComponent(jobId)}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'StudioAgentsFinalCanary/1.0' },
      signal: AbortSignal.timeout(20000),
    });
    const payload = await response.json().catch(() => ({}));
    if (payload?.status === 'completed') return payload;
    if (payload?.status === 'failed' || payload?.status === 'error') {
      throw new Error(`video job failed: ${compactError(payload?.error || payload?.message)}`);
    }
    await sleep(5000);
  }
  throw new Error('video job exceeded the seven-minute final certification budget');
}

async function runVideo() {
  const startedAt = now();
  let beat = successfulMedia.get('beat');
  if (!beat || now() - beat.createdAt > JOB_TTL_MS) {
    await runBeat();
    beat = successfulMedia.get('beat');
  }
  if (!beat?.reference) throw new Error('video certification could not obtain a valid beat');

  const image = successfulMedia.get('image');
  const body = {
    audioUrl: beat.reference,
    videoPrompt: 'Cinematic night recording studio, slow camera push toward a glowing microphone, subtle blue and gold lighting, polished music video shot.',
    songTitle: 'Studio Agents Final Certification',
    duration: 6,
    ...(image?.reference && /^https?:\/\//.test(image.reference) ? { imageUrl: image.reference } : {}),
  };
  const { status, payload } = await callLocal('/api/generate-synced-video-test', body, 210000);
  const completed = status === 202 && payload?.jobId ? await waitForVideoJob(payload.jobId) : payload;
  const reference = mediaCandidate(completed, 'video');
  const inspection = await inspectMedia(reference, 'video');
  return {
    asset: 'video',
    provider: completed?.provider || completed?.source || completed?.model || 'replicate-orchestrator',
    durationMs: now() - startedAt,
    requestedDuration: 6,
    deliveredDuration: completed?.duration || completed?.result?.duration || null,
    quality: completed?.quality || completed?.result?.quality || null,
    inspection,
    phaseMs: completed?.phaseMs || completed?.result?.phaseMs || null,
  };
}

async function runAsset(asset) {
  if (asset === 'beat') return runBeat();
  if (asset === 'image') return runImage();
  if (asset === 'vocal') return runVocal();
  if (asset === 'video') return runVideo();
  throw new Error('asset must be beat, image, vocal, or video');
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

module.exports = function registerFinalizationCanary(app, logger) {
  prune();
  app.get('/api/finalize-provider-canary', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (String(req.query?.key || '') !== CANARY_KEY) {
      return res.status(404).json({ error: 'Not found' });
    }

    prune();
    const action = String(req.query?.action || 'status');
    if (action === 'start') {
      const asset = String(req.query?.asset || '');
      if (!['beat', 'image', 'vocal', 'video'].includes(asset)) {
        return res.status(400).json({ error: 'asset must be beat, image, vocal, or video' });
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
