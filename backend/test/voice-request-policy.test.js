const test = require('node:test');
const assert = require('node:assert/strict');
const { requestsPersonalVoice } = require('../services/voiceRequestPolicy');

test('personal identity cannot bypass authentication/ownership using false flag', () => {
  for (const body of [{ style: 'cloned', isPersonalVoice: false }, { speakerUrl: 'https://example.test/private.wav', isPersonalVoice: false }, { isPersonalVoice: true }]) {
    assert.equal(requestsPersonalVoice(body), true);
  }
});
test('a curated voice ID alone is not a cloned identity', () => {
  assert.equal(requestsPersonalVoice({ style: 'narrator', elevenLabsVoiceId: 'curated-id' }), false);
  assert.equal(requestsPersonalVoice({ style: 'singer', isPersonalVoice: false }), false);
});
