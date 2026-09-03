import fs from 'node:fs';
import path from 'node:path';

// Historically this script rewrote backend/server.js and the video orchestrator
// at Docker build time to bound provider waits and route around an exhausted
// Stability account. That behaviour now lives in source, so the deployed code is
// exactly what is committed. The script is kept as a fail-closed verifier for
// the Railway build and for tests that run it against an isolated fixture root.
const appRoot = path.resolve(process.argv[2] || '/app');
const serverPath = path.join(appRoot, 'backend/server.js');
const videoOrchestratorPath = path.join(appRoot, 'backend/services/videoGenerationOrchestrator.js');
const source = fs.readFileSync(serverPath, 'utf8').replace(/\r\n/g, '\n');
const videoSource = fs.readFileSync(videoOrchestratorPath, 'utf8').replace(/\r\n/g, '\n');

const audioStart = source.indexOf("app.post('/api/generate-audio'");
const audioEnd = source.indexOf("app.post('/api/mix-audio'", audioStart);
if (audioStart === -1 || audioEnd === -1) {
  console.error('Could not isolate the Studio audio-generation route.');
  process.exit(1);
}
const audioRoute = source.slice(audioStart, audioEnd);

const requiredServer = [
  // Stability is the sole music engine; legacy providers are emergency opt-in.
  'Stability AI Stable Audio 2.5 (SOLE MUSIC ENGINE)',
  "const finalEngine = stabilityKey ? 'stability' : 'music-gpt'",
  'const useLegacyBeatProviders = hasFallbackBeatProvider && !stabilityKey',
  // Fast, cached balance probe so an exhausted account fails fast with a refund.
  '__studioStabilityAudioAvailability',
  'https://api.stability.ai/v1/user/balance',
  // Audio DNA goes through Stability audio-to-audio, not a different engine.
  "callStability('audio-to-audio'",
  "callStability('text-to-audio'",
  // Requested duration honoured from either request field.
  'req.body?.duration ?? 60',
  // Bounded provider waits: one attempt, no silent multi-minute retries.
  '{ timeoutMs: 90000, maxRetries: 0 }',
];
for (const required of requiredServer) {
  if (!audioRoute.includes(required)) {
    console.error('Audio provider routing contract is missing: ' + required);
    process.exit(1);
  }
}
if (/\{ timeoutMs: 60000 \}/.test(audioRoute)) {
  console.error('Audio route still contains an unbounded retrying provider wait.');
  process.exit(1);
}

const helperStart = source.indexOf('async function runReplicateWithRateLimitRetry(');
const helperEnd = source.indexOf('\nconst app = express()', helperStart);
if (helperStart === -1 || helperEnd === -1) {
  console.error('Could not find the Replicate helper.');
  process.exit(1);
}
const helper = source.slice(helperStart, helperEnd);
for (const required of ['__studioReplicateBoundedPrediction', "'Cancel-After'", '/cancel', 'PROVIDER_TIMEOUT', 'PROVIDER_FAILED']) {
  if (!helper.includes(required)) {
    console.error('Replicate bounded-prediction contract is missing: ' + required);
    process.exit(1);
  }
}

for (const required of [
  'minimax/hailuo-2.3-fast',
  "model = 'minimax/hailuo-2.3'",
  "resolution: '768p'",
  'duration: 6,'
]) {
  if (!videoSource.includes(required)) {
    console.error('Video provider contract is missing: ' + required);
    process.exit(1);
  }
}
if (videoSource.includes('minimax/video-01')) {
  console.error('Video orchestrator still references the legacy minimax/video-01 model.');
  process.exit(1);
}

console.log('Provider routing verified: Stability-only beats with bounded waits, bounded Replicate predictions, current Hailuo video models.');
