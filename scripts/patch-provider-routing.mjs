import fs from 'node:fs';
import path from 'node:path';

// Accept an isolated fixture root so tests exercise exactly what Docker deploys.
const appRoot = path.resolve(process.argv[2] || '/app');
const serverPath = path.join(appRoot, 'backend/server.js');
const videoOrchestratorPath = path.join(appRoot, 'backend/services/videoGenerationOrchestrator.js');
let source = fs.readFileSync(serverPath, 'utf8').replace(/\r\n/g, '\n');
let videoSource = fs.readFileSync(videoOrchestratorPath, 'utf8').replace(/\r\n/g, '\n');

const previousEngineSelection = `    // Engine Selection Logic - Always prefer Stability AI for highest quality
    let finalEngine = engine;
    if (engine === 'auto' || !engine || engine === 'music-gpt') {
      if (stabilityKey) {
        finalEngine = 'stability';
      } else {
        finalEngine = 'music-gpt';
      }
    }
`;

const providerAwareEngineSelection = `    // Provider-aware engine selection. A configured Stability key is not enough:
    // an account with zero balance used to hold every customer request for a full
    // provider timeout before falling back. Cache a fast balance probe and skip
    // the unavailable provider before starting paid generation work.
    let stabilityUsable = false;
    if (stabilityKey) {
      const cached = globalThis.__studioStabilityAudioAvailability;
      if (cached && Date.now() - cached.checkedAt < 5 * 60 * 1000) {
        stabilityUsable = cached.usable;
      } else {
        try {
          const balanceResponse = await fetch('https://api.stability.ai/v1/user/balance', {
            headers: { Authorization: 'Bearer ' + stabilityKey, Accept: 'application/json' },
            signal: AbortSignal.timeout(3000)
          });
          const balancePayload = await balanceResponse.json().catch(() => ({}));
          stabilityUsable = balanceResponse.ok && Number(balancePayload.credits) > 0;
          globalThis.__studioStabilityAudioAvailability = {
            checkedAt: Date.now(),
            usable: stabilityUsable,
            status: balanceResponse.status
          };
          if (!stabilityUsable) {
            logger.warn('Stability audio skipped before generation', {
              status: balanceResponse.status,
              reason: balanceResponse.ok ? 'no-positive-credit-balance' : 'balance-check-failed'
            });
          }
        } catch (availabilityError) {
          globalThis.__studioStabilityAudioAvailability = {
            checkedAt: Date.now(),
            usable: false,
            status: 0
          };
          logger.warn('Stability audio availability check failed; using another provider', {
            error: availabilityError.message
          });
        }
      }
    }

    let finalEngine = engine;
    if (engine === 'auto' || !engine || engine === 'music-gpt') {
      finalEngine = stabilityUsable ? 'stability' : 'music-gpt';
    } else if (engine === 'stability' && !stabilityUsable) {
      finalEngine = 'music-gpt';
    }
`;

const engineOccurrences = source.split(previousEngineSelection).length - 1;
if (engineOccurrences < 1) {
  console.error('Could not find the Studio audio engine-selection contract.');
  process.exit(1);
}
source = source.split(previousEngineSelection).join(providerAwareEngineSelection);

const previousReplicateHelper = `async function runReplicateWithRateLimitRetry(replicate, model, options, operationName) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await replicate.run(model, options);
    } catch (error) {
      const message = String(error?.message || '');
      const rateLimited = error?.status === 429 || error?.response?.status === 429 || /\\b429\\b|rate.?limit/i.test(message);
      if (!rateLimited || attempt === maxAttempts) throw error;

      const retryMatch = message.match(/retry[_ -]?after[^0-9]*(\\d+)/i);
      const retrySeconds = Math.max(Number(retryMatch?.[1]) || 10, 1);
      logger.warn(\`Replicate rate-limited \${operationName}; retrying\`, { attempt, retrySeconds });
      await new Promise(resolve => setTimeout(resolve, retrySeconds * 1000));
    }
  }
  throw new Error(\`\${operationName} exhausted Replicate retries\`);
}
`;

const boundedReplicateHelper = `async function runReplicateWithRateLimitRetry(_replicate, model, options, operationName) {
  // __studioReplicateBoundedPrediction
  // The SDK's replicate.run() can wait indefinitely and previously let one beat
  // request cascade through several multi-minute fallbacks. Use the prediction
  // REST API so the server owns the deadline and can cancel unfinished paid work.
  const token = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('Replicate provider is not configured');

  const configuredTimeoutMs = Number(process.env.REPLICATE_GENERATION_TIMEOUT_MS);
  const defaultTimeoutMs = /MiniMax beat generation/i.test(operationName) ? 150000 : 90000;
  const timeoutMs = Math.max(
    30000,
    Math.min(configuredTimeoutMs || defaultTimeoutMs, 150000)
  );
  const maxCreateAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxCreateAttempts; attempt++) {
    let predictionId = '';
    let predictionStarted = false;
    const startedAt = Date.now();
    try {
      const colon = model.indexOf(':');
      const modelName = colon === -1 ? model : model.slice(0, colon);
      const version = colon === -1 ? '' : model.slice(colon + 1);
      const createUrl = version
        ? 'https://api.replicate.com/v1/predictions'
        : 'https://api.replicate.com/v1/models/' + modelName + '/predictions';
      const createBody = version
        ? { version, input: options?.input || {} }
        : { input: options?.input || {} };

      const createResponse = await fetchWithTimeout(createUrl, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
          Prefer: 'wait=10',
          'Cancel-After': Math.round(timeoutMs / 1000) + 's'
        },
        body: JSON.stringify(createBody)
      }, 20000);

      if (createResponse.status === 429) {
        const retrySeconds = Math.max(Number(createResponse.headers.get('retry-after')) || 8, 1);
        lastError = new Error('Replicate rate limit reached');
        if (attempt < maxCreateAttempts) {
          logger.warn(\`Replicate rate-limited \${operationName}; retrying\`, { attempt, retrySeconds });
          await new Promise(resolve => setTimeout(resolve, Math.min(retrySeconds, 15) * 1000));
          continue;
        }
        throw lastError;
      }

      const createText = await createResponse.text();
      let prediction;
      try { prediction = JSON.parse(createText); } catch { prediction = {}; }
      if (!createResponse.ok) {
        const detail = String(prediction?.detail || prediction?.error || createText || '').slice(0, 500);
        const error = new Error(\`Replicate could not start \${operationName} (HTTP \${createResponse.status}): \${detail}\`);
        error.status = createResponse.status;
        throw error;
      }

      predictionId = String(prediction?.id || '');
      if (!predictionId) throw new Error(\`Replicate did not return a prediction ID for \${operationName}\`);
      predictionStarted = true;

      while (!['succeeded', 'failed', 'canceled'].includes(String(prediction?.status || ''))) {
        if (Date.now() - startedAt >= timeoutMs) {
          await fetchWithTimeout(
            'https://api.replicate.com/v1/predictions/' + encodeURIComponent(predictionId) + '/cancel',
            { method: 'POST', headers: { Authorization: 'Bearer ' + token } },
            10000
          ).catch(() => undefined);
          const timeoutError = new Error(\`\${operationName} exceeded the \${Math.round(timeoutMs / 1000)}-second provider budget and was canceled\`);
          timeoutError.code = 'PROVIDER_TIMEOUT';
          throw timeoutError;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusResponse = await fetchWithTimeout(
          'https://api.replicate.com/v1/predictions/' + encodeURIComponent(predictionId),
          { headers: { Authorization: 'Bearer ' + token } },
          15000
        );
        if (!statusResponse.ok) {
          if (statusResponse.status >= 500) continue;
          throw new Error(\`Replicate status check failed for \${operationName} (HTTP \${statusResponse.status})\`);
        }
        prediction = await statusResponse.json();
      }

      if (prediction.status === 'succeeded' && prediction.output) {
        logger.info('Replicate prediction completed within budget', {
          operationName,
          predictionId,
          durationMs: Date.now() - startedAt
        });
        return prediction.output;
      }

      const providerError = String(prediction?.error || prediction?.logs || prediction?.status || 'unknown failure').slice(0, 700);
      const failed = new Error(\`Replicate \${operationName} failed: \${providerError}\`);
      failed.code = 'PROVIDER_FAILED';
      throw failed;
    } catch (error) {
      lastError = error;
      const message = String(error?.message || '');
      logger.warn('Replicate prediction attempt failed', {
        operationName,
        attempt,
        predictionId: predictionId || null,
        durationMs: Date.now() - startedAt,
        code: error?.code || null,
        error: message.slice(0, 500)
      });

      // Once a paid prediction started, do not silently create a duplicate. A
      // provider failure or our deadline is final for this provider attempt.
      if (predictionStarted || error?.code === 'PROVIDER_TIMEOUT' || error?.code === 'PROVIDER_FAILED') throw error;
      const retryable = error?.status === 429 || error?.status >= 500 || /network|fetch|timeout|rate.?limit/i.test(message);
      if (!retryable || attempt === maxCreateAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
    }
  }

  throw lastError || new Error(\`\${operationName} could not start\`);
}
`;

if (!source.includes(previousReplicateHelper)) {
  console.error('Could not find the unbounded Replicate helper.');
  process.exit(1);
}
source = source.replace(previousReplicateHelper, boundedReplicateHelper);

const audioStart = source.indexOf("app.post('/api/generate-audio'");
const audioEnd = source.indexOf("app.post('/api/mix-audio'", audioStart);
if (audioStart === -1 || audioEnd === -1) {
  console.error('Could not isolate the Studio audio-generation route.');
  process.exit(1);
}

let audioRoute = source.slice(audioStart, audioEnd);

// Existing frontend clients send `duration`, while the backend only read
// `durationSeconds`. That silently turned every request into the 60-second
// default and made provider work slower than the UI promised.
const durationBinding = 'durationSeconds: rawDuration = 60';
if (!audioRoute.includes(durationBinding)) {
  console.error('Could not find the audio duration request contract.');
  process.exit(1);
}
audioRoute = audioRoute.replace(
  durationBinding,
  'durationSeconds: rawDuration = req.body?.duration ?? 60'
);

// Stability, FAL, and generated-file downloads get one bounded attempt. Provider
// selection—not repeated waiting—is the fallback strategy.
audioRoute = audioRoute.replaceAll('{ timeoutMs: 60000 }', '{ timeoutMs: 45000, maxRetries: 0 }');

// MiniMax creates variable-length instrumentals. Do not disable it for short
// premium briefs: MusicGen is deliberately excluded by the quality guard, so
// doing both leaves zero providers when Stability has no credits. The response
// must distinguish requested duration from measured duration instead.
const miniMaxDefaultPath = `    if (replicateKey && !audioUrl && !referenceAudio) {
      try {
        logger.info('Using Replicate MiniMax Music 2.6 (instrumental)');`;
const miniMaxLongFormPath = `    if (replicateKey && !audioUrl && !referenceAudio) {
      try {
        logger.info('Using Replicate MiniMax Music 2.6 for premium instrumental generation');`;
if (!audioRoute.includes(miniMaxDefaultPath)) {
  console.error('Could not find the MiniMax full-length beat path.');
  process.exit(1);
}
audioRoute = audioRoute.replace(miniMaxDefaultPath, miniMaxLongFormPath);

const legacyFallback = `    if (replicateKey && !audioUrl) {
      try {
        logger.info('Using Replicate Music GPT (stereo-large)');`;
const qualityGuardedFallback = `    if (replicateKey && !audioUrl && !strictPremiumBeat) {
      try {
        logger.info('Using Replicate Music GPT (stereo-large)');`;
const boundedInteractiveFallback = `    if (replicateKey && !audioUrl && (referenceAudio || durationSeconds <= 65)) {
      try {
        logger.info(referenceAudio
          ? 'Using bounded Replicate MusicGen for reference-audio conditioning'
          : 'Using bounded Replicate MusicGen for interactive beat generation');`;
const qualityGuardedInteractiveFallback = `    if (replicateKey && !audioUrl && !strictPremiumBeat && (referenceAudio || durationSeconds <= 65)) {
      try {
        logger.info(referenceAudio
          ? 'Using bounded Replicate MusicGen for reference-audio conditioning'
          : 'Using bounded Replicate MusicGen for interactive beat generation');`;
if (audioRoute.includes(qualityGuardedFallback)) {
  // Keep the release-quality boundary: premium/ultra requests must not quietly
  // downgrade to the legacy draft provider when their premium provider fails.
  audioRoute = audioRoute.replace(qualityGuardedFallback, qualityGuardedInteractiveFallback);
} else if (audioRoute.includes(legacyFallback)) {
  audioRoute = audioRoute.replace(legacyFallback, boundedInteractiveFallback);
} else {
  console.error('Could not find the MusicGen fallback contract.');
  process.exit(1);
}
source = source.slice(0, audioStart) + audioRoute + source.slice(audioEnd);

// The old video-01 model routinely takes 2.5–5 minutes for a six-second clip.
// Use Hailuo 2.3 Fast when the pipeline has album art (the normal full-package
// path), and current Hailuo 2.3 for text-only generation. Both accept explicit
// six-second duration and 768p resolution.
const oldSegmentInput = `          const inputPayload = {
            prompt,
            prompt_optimizer: true
          };`;
const newSegmentInput = `          const inputPayload = {
            prompt,
            prompt_optimizer: true,
            duration: 6,
            resolution: '768p'
          };`;
if (!videoSource.includes(oldSegmentInput)) {
  console.error('Could not find the video segment input contract.');
  process.exit(1);
}
videoSource = videoSource.replace(oldSegmentInput, newSegmentInput);

const oldSegmentModelCall = `          return runReplicateWithRateLimitRetry(replicate, 'minimax/video-01', inputPayload, logger, globalIdx + 1)`;
const newSegmentModelCall = `          const segmentModel = imageUrl ? 'minimax/hailuo-2.3-fast' : 'minimax/hailuo-2.3';
          return runReplicateWithRateLimitRetry(replicate, segmentModel, inputPayload, logger, globalIdx + 1)`;
if (!videoSource.includes(oldSegmentModelCall)) {
  console.error('Could not find the legacy video segment model call.');
  process.exit(1);
}
videoSource = videoSource.replace(oldSegmentModelCall, newSegmentModelCall);

const oldSingleDefault = "  model = 'minimax/video-01',";
if (!videoSource.includes(oldSingleDefault)) {
  console.error('Could not find the legacy single-video model default.');
  process.exit(1);
}
videoSource = videoSource.replace(oldSingleDefault, "  model = 'minimax/hailuo-2.3',");

const oldSingleInput = `        input: {
          prompt,
          prompt_optimizer: true
        }`;
const newSingleInput = `        input: {
          prompt,
          prompt_optimizer: true,
          duration: 6,
          resolution: '768p'
        }`;
if (!videoSource.includes(oldSingleInput)) {
  console.error('Could not find the single-video input contract.');
  process.exit(1);
}
videoSource = videoSource.replace(oldSingleInput, newSingleInput);

for (const required of [
  '__studioStabilityAudioAvailability',
  '__studioReplicateBoundedPrediction',
  'req.body?.duration ?? 60',
  'premium instrumental generation',
  'interactive beat generation',
  'maxRetries: 0'
]) {
  if (!source.includes(required)) {
    console.error('Provider reliability patch is incomplete: ' + required);
    process.exit(1);
  }
}
for (const required of [
  'minimax/hailuo-2.3-fast',
  "model = 'minimax/hailuo-2.3'",
  "resolution: '768p'"
]) {
  if (!videoSource.includes(required)) {
    console.error('Video provider patch is incomplete: ' + required);
    process.exit(1);
  }
}

fs.writeFileSync(serverPath, source);
fs.writeFileSync(videoOrchestratorPath, videoSource);
console.log(`Provider routing applied to ${engineOccurrences} audio route occurrence(s); interactive beats and current Hailuo video models are bounded and explicit.`);
