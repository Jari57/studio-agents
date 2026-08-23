'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createAccountDeletionHandler,
  deleteStripeCustomer,
  registerAccountDeletionRoute,
} = require('../services/accountDeletion');

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
  };
}

function makeDb(userData = {}) {
  const userRef = {
    get: async () => ({ exists: true, data: () => userData }),
  };
  return {
    collection(name) {
      assert.equal(name, 'users');
      return {
        doc(userId) {
          assert.equal(userId, 'user-123');
          return userRef;
        },
      };
    },
    userRef,
  };
}

function makeHandler(overrides = {}) {
  const calls = [];
  const db = makeDb(overrides.userData || {});
  const operations = {
    deleteStripeCustomer: async () => calls.push('billing'),
    deleteUserStorage: async () => calls.push('storage'),
    deleteUserData: async () => calls.push('data'),
    deleteFirebaseIdentity: async () => calls.push('identity'),
    ...overrides.operations,
  };

  const handler = createAccountDeletionHandler({
    getFirestoreDb: () => db,
    getStorageBucket: () => ({}),
    getStripe: () => ({}),
    admin: {},
    logger: { error() {} },
    hasActiveUserWork: overrides.hasActiveUserWork || (() => false),
    operations,
  });
  return { handler, calls, db };
}

test('requires the customer to type DELETE exactly', async () => {
  const { handler, calls } = makeHandler();
  const res = makeResponse();
  await handler({ user: { uid: 'user-123' }, body: { confirmation: 'delete' } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.code, 'DELETE_CONFIRMATION_REQUIRED');
  assert.deepEqual(calls, []);
});

test('blocks deletion while a paid generation is still active', async () => {
  const { handler, calls } = makeHandler({ hasActiveUserWork: () => true });
  const res = makeResponse();
  await handler({ user: { uid: 'user-123' }, body: { confirmation: 'DELETE' } }, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, 'ACTIVE_GENERATION');
  assert.deepEqual(calls, []);
});

test('deletes billing before assets, data, and identity', async () => {
  const { handler, calls } = makeHandler();
  const res = makeResponse();
  await handler({ user: { uid: 'user-123' }, body: { confirmation: 'DELETE' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.deleted, true);
  assert.equal(res.headers['cache-control'], 'no-store, max-age=0');
  assert.deepEqual(calls, ['billing', 'storage', 'data', 'identity']);
});

test('preserves every local resource when billing deletion is unconfirmed', async () => {
  const billingError = Object.assign(new Error('Stripe unavailable'), {
    code: 'BILLING_DELETE_UNAVAILABLE',
  });
  const { handler, calls } = makeHandler({
    userData: { stripeCustomerId: 'cus_paid_customer' },
    operations: {
      deleteStripeCustomer: async () => {
        calls.push('billing');
        throw billingError;
      },
    },
  });
  const res = makeResponse();
  await handler({ user: { uid: 'user-123' }, body: { confirmation: 'DELETE' } }, res);

  assert.equal(res.statusCode, 502);
  assert.equal(res.body.code, 'BILLING_DELETE_UNAVAILABLE');
  assert.match(res.body.error, /account was left intact/i);
  assert.deepEqual(calls, ['billing']);
});

test('treats a missing Stripe customer as an idempotent deletion success', async () => {
  const result = await deleteStripeCustomer({
    userData: { stripeCustomerId: 'cus_already_deleted' },
    getStripe: () => ({
      customers: {
        del: async () => {
          throw Object.assign(new Error('No such customer'), { code: 'resource_missing', statusCode: 404 });
        },
      },
    }),
  });

  assert.deepEqual(result, {
    deleted: true,
    customerId: 'cus_already_deleted',
    alreadyDeleted: true,
  });
});

test('registers one authenticated DELETE endpoint', () => {
  const registrations = [];
  const app = {
    delete(...args) {
      registrations.push(args);
    },
  };
  const verifyFirebaseToken = () => {};

  registerAccountDeletionRoute(app, {
    verifyFirebaseToken,
    getFirestoreDb: () => null,
    getStorageBucket: () => null,
    getStripe: () => null,
    admin: {},
  });

  assert.equal(registrations.length, 1);
  assert.equal(registrations[0][0], '/api/user/account');
  assert.equal(registrations[0][1], verifyFirebaseToken);
  assert.equal(typeof registrations[0][2], 'function');
});

test('the production server includes the complete deletion route before its 404 handler', () => {
  const server = fs.readFileSync(path.resolve(__dirname, '..', 'server.js'), 'utf8');
  const registration = server.indexOf('registerAccountDeletionRoute(app');
  const api404 = server.indexOf("app.use('/api'");

  assert.ok(registration > -1);
  assert.ok(api404 > registration);
  assert.match(server, /getStripe: \(\) => stripe/);
  assert.match(server, /hasActiveUserWork/);
});
