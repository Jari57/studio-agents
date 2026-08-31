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

test('saved producer mixes are previewed as existing assets with accurate attribution', () => {
  const source = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  assert.match(source, /setPreviewItem\(\{ \.\.\.masterAsset, isExistingAsset: true \}\)/);
  assert.match(source, /previewItem\.provider \|\| previewItem\.metadata\?\.provider \|\| previewItem\.model/);
  assert.doesNotMatch(source, /previewItem\.model \|\| selectedModel/);
  assert.match(source, /className="modal-overlay" style=\{\{ zIndex: 11000 \}\}/);
  assert.match(source, /aria-label="Close creation preview"/);
});

test('frontend preserves vocal opening stanzas for the backend lyric policy', () => {
  const source = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  const start = source.indexOf('// VOCALS FIX:');
  const lyricsSection = source.slice(start, source.indexOf("finalEndpoint = '/api/generate-speech'", start));
  assert.doesNotMatch(lyricsSection, /\.replace\(/);
  assert.match(lyricsSection, /const vocalLyrics = \(contextLyrics \|\| expandedPrompt \|\| prompt\)\.trim\(\)/);
});
