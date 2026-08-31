import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectedVoiceInputs, generationFailureMessage } from '../src/utils/generationErrors.mjs';

test('AI vocal selection never transmits a stored personal sample or clone ID', () => {
  const settings = { elevenLabsVoiceId: 'private-id', voiceSampleUrl: 'https://example.test/private.wav' };
  assert.deepEqual(selectedVoiceInputs({ ...settings, personalVoiceSelected: false }), {
    isPersonalVoice: false, elevenLabsVoiceId: null, speakerUrl: null, preferredProvider: null,
  });
  assert.equal(selectedVoiceInputs({ ...settings, personalVoiceSelected: true }).speakerUrl, settings.voiceSampleUrl);
});
test('permissions and consent errors are not mislabeled as credit failures', () => {
  assert.equal(generationFailureMessage(403, { error: 'Personal voice not found in your library' }), 'Personal voice not found in your library');
  assert.equal(generationFailureMessage(403, { details: 'Activate your own voice.', error: 'Unavailable' }), 'Activate your own voice.');
  assert.match(generationFailureMessage(403, { isUserCreditIssue: true, required: 2 }, 'Vocal Lab'), /needs 2 credits/);
  assert.doesNotMatch(generationFailureMessage(403), /credits/i);
});
test('saved canvas playback requests metadata without unnecessary CORS mode', () => {
  const source = readFileSync(new URL('../src/components/studio/CanvasView.jsx', import.meta.url), 'utf8');
  const player = source.slice(source.indexOf('<audio'), source.indexOf('/>', source.indexOf('<audio')));
  assert.match(player, /preload="metadata"/);
  assert.doesNotMatch(player, /crossOrigin/);
  assert.match(player, /aria-label/);
});
