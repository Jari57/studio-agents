import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BEAT_GENERATION_ENDPOINT,
  BEAT_MAX_DURATION_SECONDS,
  BEAT_MIN_DURATION_SECONDS,
  beatGenerationRequest,
  clampBeatDuration,
} from '../src/utils/beatGenerationRequest.mjs';

test('individual and orchestrated beats share one premium auto-selected provider contract', () => {
  assert.equal(BEAT_GENERATION_ENDPOINT, '/api/generate-audio');
  assert.deepEqual(beatGenerationRequest({
    prompt: '  Warm soul drums  ',
    bpm: '94',
    genre: 'R&B',
    mood: 'Creative',
    durationSeconds: '120',
    referenceAudio: 'https://example.test/reference.wav',
  }), {
    prompt: 'Warm soul drums',
    bpm: 94,
    genre: 'r&b',
    mood: 'creative',
    durationSeconds: 120,
    referenceAudio: 'https://example.test/reference.wav',
    audioId: null,
    quality: 'premium',
    engine: 'auto',
    outputFormat: 'music',
    songStructure: 'full',
    arrangement: null,
    highMusicality: true,
    seed: -1,
    stem: 'Full Mix',
    agentId: 'beat-arch',
  });
});

test('beats are always full-length tracks between 1:30 and 2:30', () => {
  assert.equal(BEAT_MIN_DURATION_SECONDS, 90);
  assert.equal(BEAT_MAX_DURATION_SECONDS, 150);
  // Bar-based loops and legacy short presets are raised to the floor.
  assert.equal(clampBeatDuration(32), 90);
  assert.equal(clampBeatDuration('45'), 90);
  assert.equal(clampBeatDuration(0), 90);
  assert.equal(clampBeatDuration(undefined), 90);
  // Requests inside the window pass through unchanged.
  assert.equal(clampBeatDuration(90), 90);
  assert.equal(clampBeatDuration(135), 135);
  assert.equal(clampBeatDuration(150), 150);
  // Anything longer is capped so Stability renders in a single pass.
  assert.equal(clampBeatDuration(180), 150);
  assert.equal(clampBeatDuration(240), 150);
  assert.equal(beatGenerationRequest({ prompt: 'x' }).durationSeconds, 90);
  assert.equal(beatGenerationRequest({ prompt: 'x', durationSeconds: 30 }).durationSeconds, 90);
  assert.equal(beatGenerationRequest({ prompt: 'x', durationSeconds: 180 }).durationSeconds, 150);
});

test('every beat entry point uses the shared request builder', () => {
  for (const component of ['StudioView.jsx', 'StudioOrchestratorV2.jsx', 'studio/CanvasView.jsx']) {
    const source = readFileSync(new URL(`../src/components/${component}`, import.meta.url), 'utf8');
    assert.match(source, /beatGenerationRequest\(/, component);
    assert.match(source, /BEAT_GENERATION_ENDPOINT/, component);
    assert.doesNotMatch(source, /BACKEND_URL\}\/api\/generate-audio/, `${component} bypasses the shared Beat Agent contract`);
  }

  const orchestrator = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(orchestrator, /setMusicEngine|label: 'Music Engine'|beat\/instrumental concept/);

  const studio = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  assert.match(studio, /agentId: finalBody\.agentId \|\| agentId/);
});
