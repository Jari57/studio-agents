const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { personalVoiceCatalog } = require('../services/personalVoiceCatalog');

test('personal catalog is private and attaches only server-recorded consent evidence', () => {
  const catalog = personalVoiceCatalog([
    { voice_id: 'mine', category: 'cloned' },
    { voice_id: 'legacy', category: 'cloned' },
    { voice_id: 'other', category: 'cloned' },
    { voice_id: 'curated', category: 'premade', studioPersonalVoice: { owned: true, consentConfirmed: true } },
  ], [
    { voiceId: 'mine', consent: { confirmed: true }, sampleCount: 2, sourceAssetIds: ['private-source'] },
    { voiceId: 'legacy' },
  ]);
  assert.deepEqual(catalog.map(voice => voice.voice_id), ['mine', 'legacy', 'curated']);
  assert.deepEqual(catalog[0].studioPersonalVoice, { owned: true, consentConfirmed: true, sampleCount: 2 });
  assert.equal(catalog[1].studioPersonalVoice.consentConfirmed, false);
  assert.equal(catalog[2].studioPersonalVoice, null);
  assert.ok(!JSON.stringify(catalog).includes('private-source'));
});

test('professional, generated, private and unknown categories require a Studio ownership record', () => {
  const categories = ['cloned', 'professional', 'generated', 'famous', 'high_quality', 'custom', 'future-type', undefined, null];
  const providerVoices = categories.flatMap((category, index) => [
    { voice_id: `unowned-${index}`, category, is_owner: true },
    { voice_id: `owned-${index}`, category },
  ]);
  const records = categories.map((_, index) => ({ voiceId: `owned-${index}`, consent: { confirmed: true } }));
  const catalog = personalVoiceCatalog(providerVoices, records);
  assert.deepEqual(catalog.map(voice => voice.voice_id), records.map(record => record.voiceId));
  assert.ok(catalog.every(voice => voice.studioPersonalVoice.owned));
});

test('sharing flags, provider account ownership and public preview URLs cannot authorize another users voice', () => {
  const catalog = personalVoiceCatalog([
    { voice_id: 'shared-private', category: 'professional', is_owner: false,
      sharing: { status: 'enabled', public_owner_id: 'provider-account', whitelisted_emails: ['other@example.test'] } },
    { voice_id: 'unverified-public', category: 'professional', is_owner: false,
      sharing: { status: 'enabled', public_owner_id: 'provider-account', whitelisted_emails: [] } },
    { voice_id: 'preview-private', category: 'generated', preview_url: 'https://public.example/voice.mp3' },
    { voice_id: 'stock', category: 'premade' },
  ], []);
  assert.deepEqual(catalog.map(voice => voice.voice_id), ['stock']);
  assert.equal(catalog[0].studioPersonalVoice, null);
});

test('missing IDs and null entries cannot match malformed owned records', () => {
  assert.deepEqual(personalVoiceCatalog([null, {}, { category: 'premade' }, { voice_id: '', category: 'premade' }], [null, {}, { voiceId: '' }]), []);
});

function voiceRoute({ providerStatus = 200, dbAvailable = true } = {}) {
  const source = fs.readFileSync(path.resolve(__dirname, '../server.js'), 'utf8');
  const start = source.indexOf("app.get('/api/v2/voices',");
  const end = source.indexOf('\n});', start) + 4;
  const paths = [];
  let handler;
  const verifyFirebaseToken = () => {};
  const requireAuth = () => {};
  vm.runInNewContext(source.slice(start, end), {
    app: { get(route, ...handlers) {
      assert.equal(handlers[0], verifyFirebaseToken);
      assert.equal(handlers[1], requireAuth);
      handler = handlers.at(-1);
    } }, verifyFirebaseToken, requireAuth, personalVoiceCatalog,
    process: { env: { ELEVENLABS_API_KEY: 'isolated-test-key' } },
    fetch: async () => ({ ok: providerStatus === 200, status: providerStatus,
      json: async () => ({ voices: [
        { voice_id: 'mine', category: 'cloned' }, { voice_id: 'other', category: 'cloned' },
        { voice_id: 'other-pro', category: 'professional' }, { voice_id: 'other-unknown', category: 'unknown' },
      ] }) }),
    getFirestoreDb: () => dbAvailable ? { collection(name) {
      assert.equal(name, 'users');
      return { doc(uid) { paths.push(uid); return { collection(child) {
        assert.equal(child, 'voiceOwnership');
        return { get: async () => ({ forEach: fn => fn({ data: () => ({ voiceId: 'mine', consent: { confirmed: true } }) }) }) };
      } }; } };
    } } : null,
    safeErrorDetail: error => error.message,
  });
  return { handler, paths };
}

test('authenticated actual route reads only caller library and preserves array contract', async () => {
  const { handler, paths } = voiceRoute();
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ user: { uid: 'owner-a' }, query: { userId: 'owner-b' } }, res);
  assert.deepEqual(paths, ['owner-a']);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].studioPersonalVoice.consentConfirmed, true);
});

test('provider errors do not produce a success catalog; missing DB cannot mark a clone owned', async () => {
  for (const options of [{ providerStatus: 403 }, { dbAvailable: false }]) {
    const { handler } = voiceRoute(options);
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ user: { uid: 'owner-a' } }, res);
    if (options.providerStatus) assert.equal(res.statusCode, 403);
    else assert.deepEqual(res.body, []);
  }
});
