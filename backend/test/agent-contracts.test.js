'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..', '..');
const backend = fs.readFileSync(path.join(root, 'backend', 'server.js'), 'utf8');
const frontend = fs.readFileSync(path.join(root, 'frontend', 'src', 'components', 'StudioView.jsx'), 'utf8');
const canvas = fs.readFileSync(path.join(root, 'frontend', 'src', 'components', 'studio', 'CanvasView.jsx'), 'utf8');
const orchestrator = fs.readFileSync(path.join(root, 'frontend', 'src', 'components', 'StudioOrchestratorV2.jsx'), 'utf8');
const beatRequest = fs.readFileSync(path.join(root, 'frontend', 'src', 'utils', 'beatGenerationRequest.mjs'), 'utf8');

test('Collab Connect and Release Manager are server-bound text packages', () => {
  assert.match(backend, /const TEXT_AGENT_SYSTEM_INSTRUCTIONS = Object\.freeze/);
  assert.match(backend, /collab: 'You are Collab Connect/);
  assert.match(backend, /release: 'You are Release Manager/);
  assert.match(backend, /serverAgentInstruction \|\| systemInstruction/);
  assert.doesNotMatch(frontend, /'trends', 'social', 'collab', 'release'/);
  assert.match(frontend, /TEXT_AGENT_OUTPUT_CONTRACTS\[agentId\]/);
});

test('Mastering accepts playable audio and every execution identifies its agent', () => {
  assert.match(frontend, /\(isAudioAgent \|\| isSpeechAgent \|\| isMasterAgent\)/);
  assert.match(frontend, /finalBody = \{ \.\.\.finalBody, agentId: finalBody\.agentId \|\| agentId \}/);
  assert.match(frontend, /metadata: \{ projectId: targetProjectSnapshot\?\.id \|\| null, featureType, agentId \}/);
  // Beats have one flat price (full-length tracks); no duration-based doubling on the client.
  assert.doesNotMatch(frontend, /requestedDuration > 30/);
  assert.match(frontend, /'beat': 10/);
});

test('paid media requests are durable, idempotent, and retain storage provenance', () => {
  assert.match(frontend, /headers\['Idempotency-Key'\] = `studio-generation-\$\{generationRecordId\}`/);
  assert.match(frontend, /newItem\.storagePath = data\.storagePath \|\| data\.audioStoragePath \|\| null/);
  assert.match(frontend, /auth\?\.currentUser\?\.uid === user\?\.uid \? user\.uid : null/);
  assert.match(frontend, /projectId: finalProject\.id/);
});

test('canvas media regeneration uses provider contracts and fails closed', () => {
  assert.match(canvas, /durationSeconds: asset\.settings\?\.duration \|\| 90/);
  assert.match(canvas, /isBrainPhase: true/);
  assert.match(canvas, /agentId: 'beat-arch'/);
  assert.match(canvas, /agentId: 'vocal-arch'/);
  assert.match(canvas, /Idempotency-Key/);
  assert.match(canvas, /without returning playable audio/);
  assert.match(canvas, /without returning a usable image/);
});

test('a failed vocal and beat mix never becomes a false master', () => {
  assert.match(frontend, /The vocal and beat mix did not complete\. No master was saved\./);
  assert.match(frontend, /A Studio Master requires both a playable beat and playable vocals/);
  assert.doesNotMatch(frontend, /Mix failed, using beat track/);
  assert.match(orchestrator, /A final master requires both a playable beat and playable vocals/);
  assert.match(orchestrator, /Mixing failed; no master will be saved/);
  assert.doesNotMatch(orchestrator, /Mixing failed, using individual tracks/);
});

test('recoverable production steps identify and retain their real media', () => {
  assert.match(orchestrator, /getPaidStepHeaders\('beat-audio'\)/);
  assert.match(orchestrator, /getPaidStepHeaders\('vocals'\)/);
  assert.match(orchestrator, /getPaidStepHeaders\('final-mix'\)/);
  assert.match(orchestrator, /beatGenerationRequest\(/);
  assert.match(beatRequest, /agentId: 'beat-arch'/);
  assert.match(orchestrator, /agentId: 'vocal-arch'/);
  assert.match(orchestrator, /storagePath: data\.storagePath \|\| data\.audioStoragePath \|\| null/);
});

test('Gemini generation retries remain inside the customer request deadline', () => {
  assert.match(backend, /generateContent\(sanitizedPrompt, \{ timeout: 20_000 \}\)/);
  assert.match(backend, /maxAttempts: modelIndex === 0 \? 2 : 1/);
  assert.match(backend, /responseModalities: \['IMAGE'\][\s\S]*timeout: 60_000/);
});

test('stem export uses the hardened media downloader', () => {
  const exportStart = backend.indexOf("app.post('/api/export-stems-zip'");
  const exportEnd = backend.indexOf("app.post('/api/", exportStart + 30);
  const exportRoute = backend.slice(exportStart, exportEnd > exportStart ? exportEnd : undefined);
  assert.match(exportRoute, /await downloadAudio\(stem\.url, inPath\)/);
  assert.doesNotMatch(exportRoute, /fetchWithTimeout\(stem\.url/);
});
