const test = require('node:test');
const assert = require('node:assert/strict');
const { configuredAdminEmails, isVerifiedAdmin } = require('../services/adminIdentity');
const { assertPrivateMediaOwnership } = require('../services/privateMediaBoundary');

test('administrator exemption requires explicit configuration and a verified identity', () => {
  const emails = configuredAdminEmails(' Owner@Example.test, ');
  assert.deepEqual(emails, ['owner@example.test']);
  assert.equal(isVerifiedAdmin({ uid: 'owner', email: 'owner@example.test', emailVerified: true }, emails), true);
  for (const user of [null, { email: 'owner@example.test', emailVerified: true }, { uid: 'owner', email: 'owner@example.test' }, { uid: 'owner', email: 'owner@example.test', emailVerified: false }, { uid: 'customer', email: 'customer@example.test', emailVerified: true }]) {
    assert.equal(isVerifiedAdmin(user, emails), false);
  }
  assert.equal(isVerifiedAdmin({ uid: 'owner', email: 'owner@example.test', emailVerified: true }, configuredAdminEmails()), false);
});

test('copied private media cannot be used by a customer, guest or another administrator', () => {
  const urls = [
    'https://firebasestorage.googleapis.com/v0/b/app.test/o/users%2Fowner%2Fassets%2Fvoice.wav?alt=media&token=example',
    'https://storage.googleapis.com/app.test/users/owner/assets/song.mp3',
    'https://app.test.storage.googleapis.com/users/owner/assets/song.mp3',
  ];
  for (const url of urls) {
    assert.doesNotThrow(() => assertPrivateMediaOwnership({ tracks: [{ url }] }, 'owner', ['app.test']));
    for (const uid of ['customer', 'other-admin', null]) assert.throws(() => assertPrivateMediaOwnership({ tracks: [{ url }] }, uid, ['app.test']), { status: uid ? 403 : 401 });
  }
});

test('public references and raw webhook bodies are unaffected by private media guard', () => {
  assert.doesNotThrow(() => assertPrivateMediaOwnership({ url: 'https://example.test/public-song.mp3' }, 'customer', ['app.test']));
  assert.doesNotThrow(() => assertPrivateMediaOwnership(Buffer.alloc(200000), null, ['app.test']));
  assert.throws(() => assertPrivateMediaOwnership({ url: 'https://firebasestorage.googleapis.com/%ZZ' }, 'customer', ['app.test']), { status: 400 });
});
