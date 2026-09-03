import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchBackendFeatures, normalizeBackendFeatures, resetBackendFeaturesCache } from '../src/utils/backendFeatures.mjs';

test('features default to off and only trust an explicit true', () => {
  assert.deepEqual(normalizeBackendFeatures(null), { soundcloud: false });
  assert.deepEqual(normalizeBackendFeatures({ features: { soundcloud: 'yes' } }), { soundcloud: false });
  assert.deepEqual(normalizeBackendFeatures({ features: { soundcloud: true } }), { soundcloud: true });
});

test('fetchBackendFeatures caches and fails closed', async () => {
  resetBackendFeaturesCache();
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return { json: async () => ({ features: { soundcloud: true } }) }; };
  const [a, b] = await Promise.all([fetchBackendFeatures('https://api.test', fetchImpl), fetchBackendFeatures('https://api.test', fetchImpl)]);
  assert.equal(calls, 1);
  assert.equal(a.soundcloud, true);
  assert.equal(b, a);

  resetBackendFeaturesCache();
  const failed = await fetchBackendFeatures('https://api.test', async () => { throw new Error('offline'); });
  assert.deepEqual(failed, { soundcloud: false });
});
