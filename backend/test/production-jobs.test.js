'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createProductionJobService,
  sanitizeSteps,
  sanitizeOutputs,
  sanitizeMediaUrls,
  jobIdFor
} = require('../services/productionJobService');

function fakeDb(docs) {
  const writes = [];
  const snapshot = {
    forEach(fn) {
      docs.forEach((data) => fn({
        id: data.id,
        data: () => data,
        ref: { id: data.id, set: async (patch) => { writes.push({ id: data.id, patch }); } }
      }));
    }
  };
  const collection = { limit: () => ({ get: async () => snapshot }) };
  const db = { collection: () => ({ doc: () => ({ collection: () => collection }) }) };
  return { db, writes };
}

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

test('getActive expires abandoned runs instead of re-offering them forever', async () => {
  const now = Date.parse('2026-09-03T12:00:00.000Z');
  const { db, writes } = fakeDb([
    { id: 'stale', status: 'needs_attention', updatedAt: '2026-08-30T12:00:00.000Z' },
    { id: 'fresh', status: 'running', updatedAt: '2026-09-03T11:00:00.000Z' },
    { id: 'done', status: 'completed', updatedAt: '2026-09-03T11:30:00.000Z' }
  ]);
  const service = createProductionJobService({ getDb: () => db, admin: {}, logger: { warn() {} } });

  const active = await service.getActive('artist-a', { now });
  assert.equal(active.id, 'fresh');
  assert.deepEqual(writes.map((w) => w.id), ['stale']);
  assert.equal(writes[0].patch.status, 'cancelled');

  const { db: onlyStale } = fakeDb([
    { id: 'stale', status: 'queued', createdAt: '2026-08-01T00:00:00.000Z' }
  ]);
  const none = await createProductionJobService({ getDb: () => onlyStale, admin: {} }).getActive('artist-a', { now });
  assert.equal(none, null);
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
