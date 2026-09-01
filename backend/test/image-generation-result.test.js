'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const { normalizeImageReference, requireImageGenerationResult } = require('../services/imageGenerationResult');
const { createCreditReservationService } = require('../services/creditReservation');

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlS8AAAAASUVORK5CYII=';

test('image results normalize supported provider URL, array and encoded-image envelopes', () => {
  const url = 'https://media.example/artwork.jpg';
  assert.equal(requireImageGenerationResult({ output: [url], source: 'flux' }).output, url);
  assert.equal(requireImageGenerationResult({ images: [PNG] }).output, `data:image/png;base64,${PNG}`);
  assert.equal(requireImageGenerationResult({ imageData: `data:image/png;base64,${PNG}` }).output, `data:image/png;base64,${PNG}`);
  assert.equal(requireImageGenerationResult({ output: {}, images: [url] }).output, url);
});

test('empty, text, malformed, unsafe and mislabeled image references are rejected', () => {
  for (const value of [null, '', '  ', {}, [], 'not an image', 'javascript:alert(1)', 'blob:expired',
    'https://', 'https://name:secret@media.example/a.png', Buffer.from('provider returned text').toString('base64'),
    `data:text/html;base64,${PNG}`, `data:image/jpeg;base64,${PNG}`]) {
    assert.equal(normalizeImageReference(value), null);
  }
  for (const payload of [{}, { predictions: [] }, { images: [] }, { output: {} }, { images: [''] }, { imageData: 'invalid' }]) {
    assert.throws(() => requireImageGenerationResult(payload), { code: 'IMAGE_GENERATION_EMPTY_RESULT', statusCode: 502 });
  }
});

// An in-memory transaction double exercises the real reservation middleware.
// No Firebase connection, provider request, or production account is used.
function memoryLedger() {
  const docs = new Map([['users/qa-user', { credits: 25, tier: 'free' }]]);
  let sequence = 0;
  const collection = (prefix) => ({
    doc(id = `auto-${++sequence}`) {
      const key = `${prefix}/${id}`;
      return { key, collection: (name) => collection(`${key}/${name}`) };
    },
  });
  const db = {
    collection,
    async runTransaction(callback) {
      return callback({
        async get(ref) { return { exists: docs.has(ref.key), data: () => docs.get(ref.key) }; },
        set(ref, data, options = {}) {
          const before = docs.get(ref.key) || {};
          const next = options.merge ? { ...before } : {};
          for (const [key, value] of Object.entries(data)) {
            next[key] = value && typeof value === 'object' && 'incrementBy' in value
              ? Number(before[key] || 0) + value.incrementBy : value;
          }
          docs.set(ref.key, next);
        },
      });
    },
  };
  return { docs, db };
}

async function invokeImageRoute(providerPayload, providerOk = true) {
  const ledger = memoryLedger();
  const credits = createCreditReservationService({
    getDb: () => ledger.db,
    admin: { firestore: { FieldValue: { increment: (incrementBy) => ({ incrementBy }) } } },
    getUserId: (req) => req.user.uid,
    getCreditCost: () => 3,
    logger: { error() {} },
  });
  let handler;
  const server = fs.readFileSync(path.resolve(__dirname, '..', 'server.js'), 'utf8');
  const start = server.indexOf("app.post('/api/generate-image',");
  const end = server.indexOf('\n});', start) + 4;
  assert.ok(start >= 0 && end > start);
  vm.runInNewContext(server.slice(start, end), {
    app: { post(_route, ...handlers) { handler = handlers.at(-1); } },
    verifyFirebaseToken() {}, requireAuthOrFreeLimit() {}, generationLimiter() {},
    checkCreditsFor: credits.checkCreditsFor,
    refundCredits: credits.refundCredits,
    requireImageGenerationResult,
    process: { env: { GEMINI_API_KEY: 'unit-test-only' } },
    logger: { info() {}, warn() {}, error() {} },
    genAI: { getGenerativeModel: () => ({ generateContent: async () => ({ response: { candidates: [] } }) }) },
    runWithProviderRetry: async (operation) => operation(),
    getConfiguredGenerativeModel: () => 'unit-test-model',
    GEMINI_SAFETY_SETTINGS: [],
    getStorageBucket: () => null,
    fetch: async () => ({ ok: providerOk, status: providerOk ? 200 : 503, json: async () => providerPayload, text: async () => 'provider unavailable' }),
    fetchWithRetry: async () => ({ ok: providerOk, status: providerOk ? 200 : 503, json: async () => providerPayload, text: async () => 'provider unavailable' }),
    safeErrorDetail: (error) => error.message,
  });
  const req = { user: { uid: 'qa-user' }, body: { prompt: 'original abstract artwork' }, headers: { 'idempotency-key': 'image-qa-attempt-1' } };
  const res = new EventEmitter();
  res.statusCode = 200;
  res.setHeader = () => {};
  res.status = (status) => { res.statusCode = status; return res; };
  res.json = (body) => { res.body = body; res.writableEnded = true; res.emit('finish'); return res; };
  let nextCalled = false;
  await credits.checkCreditsFor('image')(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  await handler(req, res);
  await req.creditReservationSettlementPromise;
  return { res, req, ledger };
}

test('real image route rejects empty provider output and refunds its reservation exactly once', async () => {
  for (const payload of [{}, { predictions: [] }, { predictions: [{ bytesBase64Encoded: '' }] }, { predictions: [{ bytesBase64Encoded: 'not-image' }] }]) {
    const { res, req, ledger } = await invokeImageRoute(payload);
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.code, 'IMAGE_GENERATION_EMPTY_RESULT');
    assert.equal(ledger.docs.get('users/qa-user').credits, 25);
    assert.equal(ledger.docs.get(req.creditReservationRef.key).status, 'refunded');
    assert.equal([...ledger.docs.values()].filter((doc) => doc.type === 'refund').length, 1);
  }
});

test('provider failures retain a failed response and refund rather than inventing artwork', async () => {
  const { res, req, ledger } = await invokeImageRoute(null, false);
  assert.equal(res.statusCode, 500);
  assert.match(res.body.details, /Imagen API Error: 503/);
  assert.equal(res.body.output, undefined);
  assert.equal(ledger.docs.get('users/qa-user').credits, 25);
  assert.equal(ledger.docs.get(req.creditReservationRef.key).status, 'refunded');
});

test('a genuine encoded image remains renderable and consumes exactly one reservation', async () => {
  const { res, req, ledger } = await invokeImageRoute({ predictions: [{ bytesBase64Encoded: PNG }] });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.output, `data:image/png;base64,${PNG}`);
  assert.equal(ledger.docs.get('users/qa-user').credits, 22);
  assert.equal(ledger.docs.get(req.creditReservationRef.key).status, 'consumed');
  assert.equal([...ledger.docs.values()].filter((doc) => doc.type === 'refund').length, 0);
});
