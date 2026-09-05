const test = require('node:test');
const assert = require('node:assert/strict');
const { createStemRetry, resolveMaster } = require('../services/retrySongStems');
const path = 'users/owner/assets/123_song_master_test.mp3';
const url = `https://firebasestorage.googleapis.com/v0/b/test/o/${encodeURIComponent(path)}?alt=media&token=caller`;
const bucket = { name: 'test', file: () => ({ getMetadata: async () => [{ metadata: { userId: 'owner', firebaseStorageDownloadTokens: 'trusted' } }] }) };
test('master must belong to the signed-in owner', async () => {
  await assert.rejects(resolveMaster(bucket, 'other', url), { status: 403 });
  await assert.rejects(resolveMaster(bucket, 'owner', 'https://example.com/song.mp3'), { status: 403 });
  assert.match(await resolveMaster(bucket, 'owner', url), /token=trusted$/);
});
test('retry separates and saves both stems without generating a song', async () => {
  let calls = 0, payload;
  const handler = createStemRetry({ getBucket: () => bucket,
    separate: async master => { calls++; assert.match(master, /token=trusted$/); return { vocalUrl: 'vocal', instrumentalUrl: 'beat' }; },
    upload: async value => ({ url: 'saved-' + value }) });
  await handler({ user: { uid: 'owner' }, body: { masterUrl: url } }, { json: value => { payload = value; }, status() { return this; } });
  assert.equal(calls, 1);
  assert.equal(payload.audioUrl, 'saved-vocal');
  assert.equal(payload.instrumentalUrl, 'saved-beat');
});
test('failure releases the retry lock and never claims success', async () => {
  let calls = 0, status;
  const handler = createStemRetry({ getBucket: () => bucket, separate: async () => { calls++; throw new Error('timeout'); } });
  const res = { status: value => { status = value; return res; }, json() {} };
  for (let i=0;i<2;i++) await handler({ user: { uid: 'owner' }, body: { masterUrl: url } }, res);
  assert.equal(status, 503); assert.equal(calls, 2);
});
