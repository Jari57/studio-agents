import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { accountStorage, accountRequestHeaders } from '../src/utils/accountStorage.mjs';

test('profiles, prompts, projects, voices and plan caches cannot cross accounts or inherit legacy data', () => {
  const values = new Map([['studio_agents_projects', 'legacy private projects']]);
  const raw = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  let uid = 'owner';
  const owner = accountStorage(raw, 'owner', () => uid);
  const other = accountStorage(raw, 'customer', () => uid);
  const keys = ['studio_agents_projects', 'studio_user_profile', 'studio_user_plan', 'studio_cloned_voice_url', 'studio_elevenlabs_voice_id', 'studio_workflow_prompt_ghost'];
  assert.equal(owner.getItem('studio_agents_projects'), null);
  for (const key of keys) owner.setItem(key, 'private');
  uid = 'customer';
  for (const key of keys) {
    assert.equal(other.getItem(key), null);
    assert.equal(owner.getItem(key), null);
    owner.setItem(key, 'late old request');
    other.setItem(key, 'customer data');
  }
  uid = 'owner';
  for (const key of keys) assert.equal(owner.getItem(key), 'private');
  assert.equal(values.get('studio_agents_projects'), 'legacy private projects');
});

test('orchestrator never borrows another account token before or during refresh', async () => {
  let release;
  const auth = { currentUser: { uid: 'owner', getIdToken: () => new Promise(resolve => { release = resolve; }) } };
  await assert.rejects(accountRequestHeaders(auth, 'customer'), /account changed/);
  const headers = accountRequestHeaders(auth, 'owner');
  auth.currentUser = { uid: 'customer' };
  release('old-token');
  await assert.rejects(headers, /account changed/);
  auth.currentUser = { uid: 'owner', getIdToken: async () => 'test-token' };
  assert.equal((await accountRequestHeaders(auth, 'owner')).Authorization, 'Bearer test-token');
});

for (const file of ['frontend/public/sw.js', 'backend/public/sw.js']) {
  test(`${file} caches only public app-shell resources`, async () => {
    const handlers = {};
    const source = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
    runInNewContext(source, { URL, Response, console, self: { location: { origin: 'https://studio.test' }, addEventListener: (name, handler) => { handlers[name] = handler; } },
      fetch: async () => new Response('ok'), caches: { open: async () => ({ put: async () => {} }) } });
    for (const [path, cacheable] of [['/assets/app.js', true], ['/icons/icon.png', true], ['/', true], ['/api/projects', false], ['/uploads/recording.mp3', false], ['/assets/app.js?token=secret', false], ['https://media.test/private.wav', false]]) {
      let response;
      handlers.fetch({ request: new Request(new URL(path, 'https://studio.test')), respondWith: promise => { response = promise; }, waitUntil() {} });
      assert.equal(Boolean(response), cacheable, path);
      if (response) await response;
    }
  });
}

test('identity changes remount the entire studio and request completions are guarded', () => {
  const view = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  const boundary = readFileSync(new URL('../src/components/AccountBoundary.jsx', import.meta.url), 'utf8');
  assert.match(view, /<StudioView key=\{uid \|\| 'guest'\}/);
  assert.match(view, /if \(!isCurrentAccount\(\)\) return;/);
  assert.match(boundary, /if \(!identity.ready\) return/);
  assert.match(view, /useState\('Free'\)/);
});

test('native restoration binds the current account before reading purchases and reports failure honestly', async () => {
  const source = readFileSync(new URL('../src/utils/storeKit.js', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('export async function restorePurchases'), source.indexOf('export { PRODUCT_IDS }')).replace('export ', '');
  const calls = [];
  const purchases = { logIn: async ({ appUserID }) => calls.push(appUserID), restorePurchases: async () => {
    calls.push('restore'); return { customerInfo: { entitlements: { active: { studio: {} } } } };
  } };
  const restore = runInNewContext(`${body}\nrestorePurchases`, { initStoreKit: async () => true, _purchases: purchases, console });
  await assert.rejects(restore(), /Sign in/);
  assert.deepEqual(calls, []);
  assert.equal((await restore('customer'))[0], 'studio');
  assert.deepEqual(calls, ['customer', 'restore']);
  purchases.restorePurchases = async () => { throw new Error('Provider unavailable'); };
  await assert.rejects(restore('customer'), /could not be restored/);
});
