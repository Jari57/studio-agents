'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { projectRevision, canonicalProjectSnapshot, nextProjectTimestampMs } = require('../services/projectRevision');

const stamp = (ms) => ({ toDate: () => new Date(ms), toJSON: () => ({ seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1000000 }) });
const initialMs = Date.parse('2026-08-31T12:00:00.000Z');

function memoryDatabase(initial = {}) {
  const docs = new Map(Object.entries(initial));
  let queue = Promise.resolve();
  const snapshot = (key) => ({ id: key.split('/').at(-1), exists: docs.has(key), data: () => docs.get(key) });
  const collection = (prefix) => ({
    doc(id) {
      const key = `${prefix}/${id}`;
      return { key, get: async () => snapshot(key), collection: (name) => collection(`${key}/${name}`) };
    },
    limit() { return this; },
    async get() {
      const values = [...docs.keys()].filter(key => key.startsWith(`${prefix}/`) && key.split('/').length === prefix.split('/').length + 1).map(snapshot);
      return { forEach: callback => values.forEach(callback) };
    },
  });
  return {
    docs,
    collection,
    runTransaction(callback) {
      const work = queue.then(async () => {
        const writes = [];
        const result = await callback({
          get: async (ref) => snapshot(ref.key),
          set: (ref, data, options) => writes.push({ ref, data, options }),
        });
        for (const { ref, data, options } of writes) docs.set(ref.key, options?.merge ? { ...(docs.get(ref.key) || {}), ...data } : data);
        return result;
      });
      queue = work.catch(() => {});
      return work;
    },
  };
}

function routes(db) {
  const result = {};
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'server.js'), 'utf8');
  const verifyFirebaseToken = () => {};
  const requireAuth = () => {};
  const register = (method) => (route, ...handlers) => {
    assert.equal(handlers[0], verifyFirebaseToken);
    assert.equal(handlers[1], requireAuth);
    result[`${method} ${route}`] = handlers.at(-1);
  };
  for (const marker of ["app.put('/api/projects/:id',", "app.get('/api/projects/:id',", "app.get('/api/projects',"]) {
    const start = source.indexOf(marker);
    assert.ok(start >= 0, `${marker} is registered`);
    const end = source.indexOf('\n});', start) + 4;
    vm.runInNewContext(source.slice(start, end), {
      app: { put: register('PUT'), get: register('GET') },
      verifyFirebaseToken, requireAuth,
      getFirestoreDb: () => db,
      projectRevision, canonicalProjectSnapshot, nextProjectTimestampMs,
      admin: { firestore: { Timestamp: { fromMillis: stamp } } },
      logger: { info() {}, warn() {}, error() {} },
      Buffer,
    });
  }
  return result;
}

async function invoke(handler, { user = { uid: 'artist-a' }, id = 'p', body = {}, query = {} } = {}) {
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  await handler({ user, params: { id }, body, query }, res);
  return res;
}

test('revision reads replace stale client syncedAt and same-millisecond writes are monotonic', () => {
  const raw = { updatedAt: stamp(initialMs), syncedAt: 'old-client-time' };
  const project = canonicalProjectSnapshot('p', raw);
  assert.equal(project.syncedAt, '2026-08-31T12:00:00.000Z');
  assert.equal(project.serverRevision, project.updatedAt);
  assert.equal(nextProjectTimestampMs(raw, initialMs), initialMs + 1);
  assert.equal(nextProjectTimestampMs(raw, initialMs - 1000), initialMs + 1);
});

test('actual PUT handler atomically allows only one writer for the same revision', async () => {
  const db = memoryDatabase({ 'users/artist-a/projects/p': { id: 'p', assets: [], updatedAt: stamp(initialMs) } });
  const handler = routes(db)['PUT /api/projects/:id'];
  const expectedRevision = projectRevision(db.docs.get('users/artist-a/projects/p'));
  const results = await Promise.all(['first', 'second'].map(id => invoke(handler, { body: { project: { assets: [{ id }] }, expectedRevision } })));
  assert.deepEqual(results.map(result => result.statusCode).sort(), [200, 409]);
  const winner = results.find(result => result.statusCode === 200);
  const stored = db.docs.get('users/artist-a/projects/p');
  assert.equal(stored.assets.length, 1);
  assert.equal(winner.body.updatedAt, projectRevision(stored));
  assert.equal(winner.body.revision, projectRevision(stored));
  assert.equal(results.find(result => result.statusCode === 409).body.revision, winner.body.revision);
});

test('GET then PUT succeeds with the exact stored revision and preserves unmentioned fields', async () => {
  const db = memoryDatabase({ 'users/artist-a/projects/p': { id: 'p', name: 'Keep me', assets: [], updatedAt: stamp(initialMs), syncedAt: 'old' } });
  const registered = routes(db);
  const read = await invoke(registered['GET /api/projects/:id']);
  assert.equal(read.body.project.syncedAt, read.body.revision);
  const saved = await invoke(registered['PUT /api/projects/:id'], { body: { project: { assets: [{ id: 'new' }], serverRevision: 'client-metadata' }, expectedRevision: read.body.revision } });
  assert.equal(saved.statusCode, 200);
  assert.equal(db.docs.get('users/artist-a/projects/p').name, 'Keep me');
  assert.equal(db.docs.get('users/artist-a/projects/p').serverRevision, undefined);
  const reread = await invoke(registered['GET /api/projects/:id']);
  assert.equal(reread.body.revision, saved.body.revision);
  const list = await invoke(registered['GET /api/projects']);
  assert.equal(list.body.projects[0].serverRevision, saved.body.revision);
  assert.equal(list.body.projects[0].syncedAt, saved.body.updatedAt);
});

test('missing/stale/future revision cannot overwrite an existing project; legacy exact timestamp works', async () => {
  const db = memoryDatabase({ 'users/artist-a/projects/p': { name: 'Protected', updatedAt: stamp(initialMs) } });
  const handler = routes(db)['PUT /api/projects/:id'];
  for (const token of [undefined, '2026-08-30T12:00:00.000Z', '2099-01-01T00:00:00.000Z']) {
    const result = await invoke(handler, { body: { project: { name: 'Overwrite' }, lastUpdatedAt: token } });
    assert.equal(result.statusCode, 409);
    assert.equal(db.docs.get('users/artist-a/projects/p').name, 'Protected');
  }
  const saved = await invoke(handler, { body: { project: { name: 'Explicit save' }, lastUpdatedAt: projectRevision(db.docs.get('users/artist-a/projects/p')) } });
  assert.equal(saved.statusCode, 200);
});

test('authenticated handlers isolate identical project IDs and reject missing identity', async () => {
  const db = memoryDatabase({ 'users/artist-b/projects/p': { name: 'Private B', updatedAt: stamp(initialMs) } });
  const registered = routes(db);
  assert.equal((await invoke(registered['GET /api/projects/:id'])).statusCode, 404);
  assert.equal((await invoke(registered['GET /api/projects/:id'], { query: { userId: 'artist-b' } })).statusCode, 403);
  for (const handler of Object.values(registered)) assert.equal((await invoke(handler, { user: null })).statusCode, 401);
  const saved = await invoke(registered['PUT /api/projects/:id'], { body: { project: { id: 'p', name: 'Own A', userId: 'artist-b' } } });
  assert.equal(saved.statusCode, 200);
  assert.equal(db.docs.get('users/artist-b/projects/p').name, 'Private B');
  assert.equal(db.docs.get('users/artist-a/projects/p').name, 'Own A');
});

test('cloud outage, oversized payload and stale deleted project fail without a write', async () => {
  for (const handler of Object.values(routes(null))) {
    const result = await invoke(handler, { body: { project: { name: 'No database' } } });
    assert.equal(result.statusCode, 503);
    assert.notEqual(result.body.success, true);
  }
  const db = memoryDatabase();
  const handler = routes(db)['PUT /api/projects/:id'];
  assert.equal((await invoke(handler, { body: { project: { content: 'x'.repeat(910000) } } })).statusCode, 413);
  assert.equal((await invoke(handler, { body: { project: { name: 'Gone' }, expectedRevision: '2026-08-31T12:00:00.000Z' } })).statusCode, 404);
  assert.equal(db.docs.size, 0);
});
