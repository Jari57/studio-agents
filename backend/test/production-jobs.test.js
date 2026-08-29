'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  sanitizeSteps,
  sanitizeOutputs,
  sanitizeMediaUrls,
  jobIdFor
} = require('../services/productionJobService');

test('production job IDs are stable per user and idempotency key', () => {
  const first = jobIdFor('artist-a', 'run-123');
  assert.equal(first, jobIdFor('artist-a', 'run-123'));
  assert.notEqual(first, jobIdFor('artist-b', 'run-123'));
  assert.match(first, /^prod_[a-f0-9]{32}$/);
});

test('pipeline steps reject unknown and duplicate step IDs', () => {
  const steps = sanitizeSteps([
    { id: 'lyrics', label: 'Writing lyrics', status: 'done', startTime: 10, endTime: 20 },
    { id: 'lyrics', label: 'Duplicate', status: 'error' },
    { id: 'shell', label: 'Malicious', status: 'done' },
    { id: 'beat-audio', label: 'Generating beat', status: 'not-real' }
  ]);
  assert.deepEqual(steps.map((step) => step.id), ['lyrics', 'beat-audio']);
  assert.equal(steps[1].status, 'pending');
});

test('snapshots are bounded and never persist base64 media payloads', () => {
  const outputs = sanitizeOutputs({ lyrics: 'x'.repeat(130000), injected: 'nope' });
  assert.equal(outputs.lyrics.length, 120000);
  assert.equal(outputs.injected, undefined);

  const media = sanitizeMediaUrls({
    audio: 'https://cdn.example.com/song.mp3',
    image: 'data:image/png;base64,abc',
    video: 'javascript:alert(1)',
    injected: 'https://example.com/nope'
  });
  assert.equal(media.audio, 'https://cdn.example.com/song.mp3');
  assert.equal(media.image, null);
  assert.equal(media.video, null);
  assert.equal(media.injected, undefined);
});
