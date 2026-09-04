import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const orchestrator = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
const studio = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
const backend = readFileSync(new URL('../../backend/server.js', import.meta.url), 'utf8');

test('full studio-voice songs render one performance instead of unrelated beat and vocal jobs', () => {
  assert.match(orchestrator, /const coherentSongRun = requestedScope\.finalMix/);
  assert.match(orchestrator, /currentSelectedAgents\.audio && !coherentSongRun/);
  assert.match(orchestrator, /data\.instrumentalUrl \? \{ audio: data\.instrumentalUrl \}/);
  assert.match(orchestrator, /data\.mixedAudioUrl/);
});

test('every musical request stays out of speech-provider fallbacks', () => {
  assert.match(backend, /const strictMusicalQuality = requiresMusicalPerformance/);
  assert.doesNotMatch(studio, /preferredProvider: personalVoiceSelected \? 'elevenlabs-clone'/);
  assert.match(studio, /preferredProvider: personalVoiceSelected \? 'minimax-music'/);
});

test('personal singing sends the selected instrumental to the music model', () => {
  assert.match(backend, /mmInput\.instrumental_file = backingTrackUrl/);
  assert.match(backend, /PERSONAL_VOICE_NEEDS_MUSIC/);
  assert.match(studio, /backingTrackUrl: audioDnaUrl \|\| backingTrack\?\.audioUrl \|\| null/);
});
