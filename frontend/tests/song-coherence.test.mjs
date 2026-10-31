import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replacedSongSource } from '../src/utils/songSession.mjs';
import { vocalGenerationRequest } from '../src/utils/vocalGeneration.mjs';

const orchestrator = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
const studio = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');

test('full studio-voice songs render one performance instead of unrelated beat and vocal jobs', () => {
  assert.match(orchestrator, /const coherentSongRun = requestedScope\.finalMix/);
  assert.match(orchestrator, /currentSelectedAgents\.audio && !coherentSongRun/);
  assert.match(orchestrator, /replacedSongSource\('vocals', data/);
  const replacement = replacedSongSource('vocals', { audioUrl: 'vocal', instrumentalUrl: 'matched-beat', mixedAudioUrl: 'song' }, 'take');
  assert.equal(replacement.media.audio, 'matched-beat');
  assert.equal(replacement.media.mixedAudio, 'song');
});

test('the frontend never selects a speech provider for personal singing', () => {
  const payload = vocalGenerationRequest({ prompt: 'full song', style: 'cloned', isPersonalVoice: true,
    personalLyricsExcerpt: 'Approved lyrics', personalReferenceId: 'approved', elevenLabsVoiceId: 'speech-only' });
  assert.equal(payload.preferredProvider, 'minimax-music');
  assert.equal(payload.elevenLabsVoiceId, null);
});

test('a stale ElevenLabs catalog selection cannot leak into a musical take', () => {
  for (const style of ['singer', 'singer-female', 'rapper-melodic']) {
    const payload = vocalGenerationRequest({ prompt: 'Sing this lyric', style,
      elevenLabsVoiceId: 'old-catalog-voice', preferredProvider: 'elevenlabs-premium' });
    assert.equal(payload.elevenLabsVoiceId, null);
    assert.equal(payload.preferredProvider, null);
  }
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
