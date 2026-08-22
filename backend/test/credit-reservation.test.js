'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  DEFAULT_IMPLICIT_DEDUPE_WINDOW_MS,
  implicitIdempotencyKey,
  normalizeIdempotencyKey,
  requestFingerprint,
  reservationDocumentId,
  resolveCreditAmount,
  resolveExistingReservation,
  settlementOutcomeForStatus,
  stableSerialize,
} = require('../services/creditReservation');

test('normalizes only bounded safe idempotency keys', () => {
  assert.equal(normalizeIdempotencyKey(' request-1234 '), 'request-1234');
  assert.equal(normalizeIdempotencyKey('short'), null);
  assert.equal(normalizeIdempotencyKey('bad key with spaces'), null);
  assert.equal(normalizeIdempotencyKey('x'.repeat(201)), null);
});

test('fingerprints are stable across object key order and ignore transport keys', () => {
  const left = requestFingerprint({
    userId: 'user-1',
    feature: 'music',
    amount: 5,
    body: {
      prompt: 'warm piano',
      duration: 60,
      idempotencyKey: 'client-key-a',
      requestId: 'transport-a',
    },
  });
  const right = requestFingerprint({
    userId: 'user-1',
    feature: 'music',
    amount: 5,
    body: {
      generationId: 'transport-b',
      duration: 60,
      idempotencyKey: 'client-key-b',
      prompt: 'warm piano',
    },
  });
  assert.equal(left, right);
  assert.equal(left.length, 64);
  assert.notEqual(
    left,
    requestFingerprint({
      userId: 'user-1',
      feature: 'music',
      amount: 5,
      body: { prompt: 'different prompt', duration: 60 },
    }),
  );
});

test('legacy callers without a key receive short-window duplicate protection', () => {
  const common = {
    userId: 'user-1',
    feature: 'beat',
    amount: 10,
    body: { prompt: 'warm keys', durationSeconds: 60 },
    windowMs: DEFAULT_IMPLICIT_DEDUPE_WINDOW_MS,
  };
  const first = implicitIdempotencyKey({ ...common, nowMs: 45_000 });
  const duplicate = implicitIdempotencyKey({ ...common, nowMs: 59_999 });
  const laterIntent = implicitIdempotencyKey({ ...common, nowMs: 60_000 });

  assert.equal(first, duplicate);
  assert.notEqual(first, laterIntent);
  assert.match(first, /^auto-[a-f0-9]{48}$/);
});

test('reservation IDs do not expose the user or client key', () => {
  const id = reservationDocumentId('user-secret', 'request-secret-123');
  assert.equal(id.length, 64);
  assert.equal(id.includes('user-secret'), false);
  assert.equal(id.includes('request-secret'), false);
});

test('existing reservations fail closed instead of charging or running twice', () => {
  const hash = 'same-request';
  assert.deepEqual(resolveExistingReservation(null, hash, 1000), { kind: 'reserve' });
  assert.deepEqual(
    resolveExistingReservation({ requestHash: hash, status: 'reserved', expiresAt: new Date(5000) }, hash, 1000),
    { kind: 'in-progress' },
  );
  assert.deepEqual(
    resolveExistingReservation({ requestHash: hash, status: 'consumed' }, hash, 1000),
    { kind: 'completed' },
  );
  assert.deepEqual(
    resolveExistingReservation({ requestHash: hash, status: 'refunded' }, hash, 1000),
    { kind: 'failed' },
  );
  assert.deepEqual(
    resolveExistingReservation({ requestHash: 'another-request', status: 'reserved' }, hash, 1000),
    { kind: 'conflict' },
  );
});

test('expired reservations are explicitly recovered before a retry', () => {
  assert.deepEqual(
    resolveExistingReservation(
      { requestHash: 'same-request', status: 'reserved', expiresAt: new Date(500) },
      'same-request',
      1000,
    ),
    { kind: 'expire-and-refund' },
  );
});

test('only successful HTTP responses consume a synchronous reservation', () => {
  assert.equal(settlementOutcomeForStatus(200), 'consume');
  assert.equal(settlementOutcomeForStatus(202), 'consume');
  assert.equal(settlementOutcomeForStatus(299), 'consume');
  assert.equal(settlementOutcomeForStatus(400), 'refund');
  assert.equal(settlementOutcomeForStatus(500), 'refund');
  assert.equal(settlementOutcomeForStatus(302), 'refund');
});

test('the reservation uses Studio Agents pricing, including extended duration', () => {
  const getCreditCost = (feature, options) => {
    if (feature === 'beat' && options.duration > 30) return 10;
    if (feature === 'beat') return 5;
    return 1;
  };

  assert.equal(
    resolveCreditAmount(getCreditCost, 'beat', { body: { durationSeconds: 30 } }),
    5,
  );
  assert.equal(
    resolveCreditAmount(getCreditCost, 'beat', { body: { durationSeconds: 60 } }),
    10,
  );
  assert.throws(
    () => resolveCreditAmount(() => Number.NaN, 'beat', { body: {} }),
    /Invalid credit price/,
  );
});

test('stable serialization is deterministic for nested generation inputs', () => {
  assert.equal(
    stableSerialize({ b: [2, { y: true, x: false }], a: 'one' }),
    stableSerialize({ a: 'one', b: [2, { x: false, y: true }] }),
  );
});

test('server entrypoint uses durable reservations and removes immediate deduction', () => {
  const server = fs.readFileSync(path.resolve(__dirname, '..', 'server.js'), 'utf8');
  assert.match(server, /createCreditReservationService\(\{/);
  assert.match(server, /getDb: getFirestoreDb/);
  assert.match(server, /getCreditCost,/);
  assert.match(server, /anonymous-free-limit/);
  assert.doesNotMatch(server, /const checkCreditsFor = \(featureType\) => \{/);
  assert.match(server, /refundCredits/);
});

test('async video jobs keep the reservation until provider completion', () => {
  const server = fs.readFileSync(path.resolve(__dirname, '..', 'server.js'), 'utf8');
  const service = fs.readFileSync(path.resolve(__dirname, '..', 'services', 'creditReservation.js'), 'utf8');

  assert.match(service, /body\.status === 'processing' && \(body\.operationId \|\| body\.jobId\)/);
  assert.match(server, /\.\.\.reservationMetadataFor\(req\)/);
  assert.match(server, /settleDetachedReservation\(op, 'consume', 'asynchronous video generation completed'\)/);
  assert.match(server, /settleDetachedReservation\(completedJob, 'consume', 'synced video generation completed'\)/);
  assert.match(server, /settleDetachedReservation\(op, 'refund'/);
  assert.match(server, /settleDetachedReservation\(job, 'refund'/);
  assert.match(server, /refundPendingVideoOp\(op, 'video polling failed repeatedly'\)/);
});
