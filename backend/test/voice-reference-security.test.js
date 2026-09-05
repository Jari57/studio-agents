const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { createHash } = require('node:crypto');
const { ownedAudioAsset, readOwnedAudio, prepareReferenceAudio, pcmQuality, approvedSingingReference, personalLyricsError } = require('../services/voiceReferences');
const { mountSingingReferenceRoutes } = require('../services/singingReferenceRoutes');

function fixture() {
  const documents = new Map(); let counter = 0;
  const ref = key => ({
    id: key.split('/').at(-1), collection: name => collection(`${key}/${name}`),
    get: async () => ({ id: key.split('/').at(-1), exists: documents.has(key), data: () => documents.get(key) }),
    set: async data => documents.set(key, data), update: async data => documents.set(key, { ...documents.get(key), ...data }),
  });
  const collection = key => ({ doc: id => ref(`${key}/${id}`),
    add: async data => { const created = ref(`${key}/new-${++counter}`); await created.set(data); return created; },
    where: (field, _op, value) => ({ limit: () => ({ get: async () => ({ docs: [...documents.keys()].filter(k => k.startsWith(`${key}/`) && documents.get(k)[field] === value).map(k => ({ id: k.split('/').at(-1), data: () => documents.get(k) })) }) }) }),
    orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [...documents.keys()].filter(k => k.startsWith(`${key}/`)).map(k => ({ id: k.split('/').at(-1), data: () => documents.get(k) })) }) }) }),
  });
  const pcm = Buffer.alloc(44100 * 20 * 2);
  for (let i = 0; i < pcm.length / 2; i++) pcm.writeInt16LE(Math.round(8000 * Math.sin(i * 440 * 2 * Math.PI / 44100)), i * 2);
  const header = Buffer.alloc(44); header.write('RIFF'); header.writeUInt32LE(pcm.length + 36, 4); header.write('WAVEfmt ', 8); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(44100, 24); header.writeUInt32LE(88200, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  const wav = Buffer.concat([header, pcm]);
  documents.set('users/alice/assets/source', { assetType: 'audio', storagePath: 'users/alice/assets/recording.wav', url: 'https://example.test/owned.wav', mimeType: 'audio/wav' });
  const bucket = { file: () => ({ getMetadata: async () => [{ size: wav.length }], createReadStream: () => Readable.from([wav]) }) };
  return { documents, db: { collection }, bucket, wav, pcm };
}

test('source reads use the exact owner storage path and hash its actual bytes', async () => {
  const f = fixture(); const result = await readOwnedAudio(f.db, f.bucket, 'alice', { assetId: 'source' });
  assert.equal(result.sha256, createHash('sha256').update(f.wav).digest('hex'));
  await assert.rejects(readOwnedAudio(f.db, f.bucket, 'bob', { assetId: 'source' }), { status: 403 });
  await assert.rejects(ownedAudioAsset(f.db, f.bucket, 'alice', { url: 'https://example.test/unowned.wav' }), { status: 403 });
  f.documents.set('users/alice/assets/source', { assetType: 'audio', storagePath: 'users/bob/assets/secret.wav' });
  await assert.rejects(readOwnedAudio(f.db, f.bucket, 'alice', { assetId: 'source' }), { status: 403 });
});

test('real FFmpeg decodes an explicit excerpt; rejects short, silent, clipped and malformed audio', async () => {
  const f = fixture(); const result = await prepareReferenceAudio(f.wav, { startSeconds: 1, durationSeconds: 16 });
  assert.equal(result.wav.toString('ascii', 0, 4), 'RIFF'); assert.equal(result.quality.duration, 16); assert.equal(result.excerpt.startSeconds, 1);
  assert.equal(result.quality.identity, 'requires artist listening approval');
  assert.throws(() => pcmQuality(Buffer.alloc(f.pcm.length)), /silent|quiet/);
  const clipped = Buffer.alloc(f.pcm.length); for (let i = 0; i < clipped.length; i += 2) clipped.writeInt16LE(32767, i);
  assert.throws(() => pcmQuality(clipped), /clipped/);
  await assert.rejects(prepareReferenceAudio(f.wav, { startSeconds: 19, durationSeconds: 16 }), /more than 15/);
  await assert.rejects(prepareReferenceAudio(Buffer.from('not audio')), /decoded/);
  await assert.rejects(prepareReferenceAudio(Buffer.from('[playlist]\nFile1=file:///etc/passwd')), /decoded/);
});

test('legacy profile or voice record cannot approve a singing identity; cross-account and altered assets fail closed', async () => {
  const f = fixture(); f.documents.set('users/alice/voices/ref', { consent: { confirmed: true }, url: 'https://example.test/owned.wav' });
  await assert.rejects(approvedSingingReference(f.db, f.bucket, 'alice', 'ref'), { status: 403 });
  const reference = { ownerUid: 'alice', status: 'ready', consent: { version: 1, confirmed: true }, review: { approved: true }, preparedAssetId: 'source', preparedSha256: 'correct' };
  f.documents.set('users/alice/singingReferences/ref', reference);
  await assert.rejects(approvedSingingReference(f.db, f.bucket, 'alice', 'ref'), { status: 409 });
  f.documents.get('users/alice/assets/source').sha256 = 'correct';
  assert.equal((await approvedSingingReference(f.db, f.bucket, 'alice', 'ref')).id, 'ref');
  await assert.rejects(approvedSingingReference(f.db, f.bucket, 'bob', 'ref'), { status: 403 });
});

test('personal lyric limits never silently cut or repeat text', () => {
  assert.equal(personalLyricsError('My original hook'), null); assert.equal(personalLyricsError('a'.repeat(400)), null);
  assert.match(personalLyricsError('a'.repeat(401)), /no verses will be cut or repeated/); assert.ok(personalLyricsError(''));
});

test('actual prepare/approve routes preserve source, separate song vocals and require listening approval', async () => {
  const f = fixture(); const routes = {}; let isolated = 0;
  mountSingingReferenceRoutes({ get: (path, ...args) => routes[path] = args.at(-1), post: (path, ...args) => routes[path] = args.at(-1) }, {
    auth() {}, requireAuth() {}, limiter() {}, getDb: () => f.db, getBucket: () => f.bucket,
    upload: async bytes => ({ url: 'https://example.test/prepared.wav', path: 'users/alice/assets/prepared.wav', size: bytes.length }),
    isolate: async () => { isolated++; return 'https://example.test/isolated.wav'; }, readProviderAudio: async () => f.wav,
  });
  async function invoke(path, body, params = {}) { let status = 200; let value; await routes[path]({ user: { uid: 'alice' }, body, params }, { status: n => { status = n; return { json: result => value = result }; }, json: result => value = result }); return { status, value }; }
  assert.equal((await invoke('/api/v2/singing-references/prepare', { assetId: 'source', sourceKind: 'song', consentConfirmed: false })).status, 400);
  const prepared = await invoke('/api/v2/singing-references/prepare', { assetId: 'source', sourceKind: 'song', consentConfirmed: true, durationSeconds: 16 });
  assert.equal(prepared.status, 200, JSON.stringify(prepared.value)); assert.equal(isolated, 1); assert.equal(prepared.value.reference.status, 'needs-listening-review');
  const id = prepared.value.reference.id;
  assert.equal((await invoke('/api/v2/singing-references/:id/approve', { listenedAndApproved: false }, { id })).status, 400);
  assert.equal((await invoke('/api/v2/singing-references/:id/approve', { listenedAndApproved: true }, { id })).value.reference.status, 'ready');
  assert.ok(f.documents.has('users/alice/assets/source'));
});
