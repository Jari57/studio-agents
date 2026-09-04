import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const orchestrator = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
const studio = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');

test('full studio-voice songs render one performance instead of unrelated beat and vocal jobs', () => {
  assert.match(orchestrator, /const coherentSongRun = requestedScope\.finalMix/);
  assert.match(orchestrator, /currentSelectedAgents\.audio && !coherentSongRun/);
  assert.match(orchestrator, /data\.instrumentalUrl \? \{ audio: data\.instrumentalUrl \}/);
  assert.match(orchestrator, /data\.mixedAudioUrl/);
});

test('the frontend never selects a speech provider for personal singing', () => {
  assert.doesNotMatch(studio, /preferredProvider: personalVoiceSelected \? 'elevenlabs-clone'/);
  assert.match(studio, /preferredProvider: personalVoiceSelected \? 'minimax-music'/);
});

test('a stale ElevenLabs catalog selection cannot leak into a musical take', () => {
  assert.match(orchestrator, /const requiresSungPerformance = \['singer', 'singer-female', 'rapper', 'rapper-female'\]/);
  assert.match(orchestrator, /requiresSungPerformance \? null : \(activeElevenLabsVoiceId \|\| null\)/);
  assert.match(orchestrator, /requiresSungPerformance\s*\? \(activeVoiceSource === 'personal' \? 'minimax-music' : null\)/);
});

test('personal singing sends the selected instrumental through the frontend contract', () => {
  assert.match(studio, /backingTrackUrl: audioDnaUrl \|\| backingTrack\?\.audioUrl \|\| null/);
});

test('music mode presents musical performers instead of speech-provider controls', () => {
  assert.match(orchestrator, /Sung vocals, melody, harmony, and a matched arrangement/);
  assert.match(orchestrator, /enableSpeechPreview=\{outputFormat !== 'music'\}/);
  assert.match(orchestrator, /outputFormat !== 'music' && \(vocalQuality === 'premium'/);
  assert.doesNotMatch(orchestrator, /Arnold — Deep &amp; Commanding/);
});

test('the default song mix keeps the lead vocal primary and the beat tucked', () => {
  assert.match(orchestrator, /useState\(0\.95\); \/\/ Vocal-first default/);
  assert.match(orchestrator, /useState\(0\.48\); \/\/ Leave room for a clear lead vocal/);
  assert.match(orchestrator, /useState\('vocal-focus'\); \/\/ Clear vocals are the primary default/);
  assert.match(orchestrator, /Vocal clarity is primary by default/);
});
