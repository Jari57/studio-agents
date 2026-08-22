'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  normalizeIdempotencyKey,
  requestFingerprint,
  reservationDocumentId,
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

test('fingerprints are stable across object key order and ignore transport key', () => {
  const left = requestFingerprint({
    userId: 'user-1',
    feature: 'music',
    amount: 5,
    body: { prompt: 'warm piano', duration: 60, idempotencyKey: 'client-key-a' },
  });
  const right = requestFingerprint({
    userId: 'user-1',
    feature: 'music',
    amount: 5,
    body: { duration: 60, idempotencyKey: 'client-key-b', prompt: 'warm piano' },
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

test('only successful HTTP responses consume a reservation', () => {
  assert.equal(settlementOutcomeForStatus(200), 'consume');
  assert.equal(settlementOutcomeForStatus(202), 'consume');
  assert.equal(settlementOutcomeForStatus(299), 'consume');
  assert.equal(settlementOutcomeForStatus(400), 'refund');
  assert.equal(settlementOutcomeForStatus(500), 'refund');
  assert.equal(settlementOutcomeForStatus(302), 'refund');
});

test('stable serialization is deterministic for nested generation inputs', () => {
  assert.equal(
    stableSerialize({ b: [2, { y: true, x: false }], a: 'one' }),
    stableSerialize({ a: 'one', b: [2, { x: false, y: true }] }),
  );
});

test('server entrypoint uses the durable service and removes immediate deduction', () => {
  const server = fs.readFileSync(path.resolve(__dirname, '..', 'server.js'), 'utf8');
  assert.match(server, /createCreditReservationService/);
  assert.doesNotMatch(server, /const checkCreditsFor = \(feature, amount\) => \{/);
  assert.match(server, /refundCredits/);
});
