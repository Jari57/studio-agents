const { createHash } = require('node:crypto');
const { readOwnedAudio, prepareReferenceAudio, ownedAudioAsset, referenceError } = require('./voiceReferences');

function mountSingingReferenceRoutes(app, { auth, requireAuth, limiter, getDb, getBucket, upload, isolate, readProviderAudio }) {
  const library = (db, uid) => db.collection('users').doc(uid).collection('singingReferences');
  const replyError = (res, error) => res.status(error.status || 503).json({ error: error.status ? error.message : 'Voice preparation did not finish. Your original recording is unchanged; retry preparation.' });
  app.get('/api/v2/singing-references', auth, requireAuth, async (req, res) => {
    try {
      const db = getDb();
      if (!db) throw referenceError('Voice library unavailable', 503);
      const result = await library(db, req.user.uid).orderBy('createdAt', 'desc').limit(50).get();
      res.json({ references: result.docs.map(doc => ({ ...doc.data(), id: doc.id })) });
    } catch (error) { replyError(res, error); }
  });

  app.post('/api/v2/singing-references/prepare', auth, requireAuth, limiter, async (req, res) => {
    try {
      const { assetId, sourceKind, consentConfirmed, startSeconds, durationSeconds, name } = req.body || {};
      if (consentConfirmed !== true) throw referenceError('Confirm that you own this voice or have the singer’s explicit permission to clone it', 400);
      if (!['isolated-vocal', 'song'].includes(sourceKind)) throw referenceError('Select a vocal-only recording or a song containing one singer', 400);
      const db = getDb(); const bucket = getBucket(); const uid = req.user.uid;
      const source = await readOwnedAudio(db, bucket, uid, { assetId });
      let prepared = await prepareReferenceAudio(source.bytes, { startSeconds, durationSeconds });
      let processing = 'decoded-vocal-excerpt';
      if (sourceKind === 'song') {
        // Isolate only the explicitly selected excerpt, never a whole song on every retry.
        const excerpt = await upload(prepared.wav, uid, 'reference-excerpt.wav', 'audio/wav');
        const isolated = await isolate(excerpt.url);
        prepared = { ...await prepareReferenceAudio(await readProviderAudio(isolated), { durationSeconds: prepared.quality.duration }), excerpt: prepared.excerpt };
        processing = 'separated-vocal-excerpt';
      }
      const stored = await upload(prepared.wav, uid, 'singing-reference.wav', 'audio/wav');
      const hash = createHash('sha256').update(prepared.wav).digest('hex');
      const createdAt = new Date().toISOString();
      const asset = await db.collection('users').doc(uid).collection('assets').add({
        assetType: 'audio', mimeType: 'audio/wav', url: stored.url, storagePath: stored.path,
        size: stored.size, name: 'Prepared singing reference', sha256: hash, createdAt,
      });
      const record = {
        ownerUid: uid, name: typeof name === 'string' ? name.trim().slice(0, 120) || 'My singing reference' : 'My singing reference',
        sourceAssetId: source.asset.id, sourceSha256: source.sha256, sourceKind,
        preparedAssetId: asset.id, preparedSha256: hash, url: stored.url,
        excerpt: prepared.excerpt, quality: prepared.quality, processing,
        consent: { confirmed: true, version: 1, recordedAt: createdAt },
        status: 'needs-listening-review', review: { approved: false }, createdAt,
      };
      const doc = await library(db, uid).add(record);
      res.json({ reference: { ...record, id: doc.id } });
    } catch (error) { replyError(res, error); }
  });

  app.post('/api/v2/singing-references/:id/approve', auth, requireAuth, async (req, res) => {
    try {
      if (req.body?.listenedAndApproved !== true) throw referenceError('Listen to the prepared excerpt and confirm that it contains only the permitted singer', 400);
      if (!/^[\w-]{1,200}$/.test(req.params.id)) throw referenceError('Invalid reference', 400);
      const db = getDb();
      if (!db) throw referenceError('Voice library unavailable', 503);
      const doc = library(db, req.user.uid).doc(req.params.id); const snapshot = await doc.get();
      const data = snapshot.exists && snapshot.data();
      if (!data || data.ownerUid !== req.user.uid || data.consent?.confirmed !== true) throw referenceError('Reference not found in your account', 404);
      const asset = await ownedAudioAsset(db, getBucket(), req.user.uid, { assetId: data.preparedAssetId });
      if (asset.sha256 !== data.preparedSha256) throw referenceError('This reference changed; prepare it again', 409);
      const review = { approved: true, reviewedAt: new Date().toISOString(), reviewerUid: req.user.uid };
      await doc.update({ status: 'ready', review });
      res.json({ reference: { ...data, id: doc.id, status: 'ready', review } });
    } catch (error) { replyError(res, error); }
  });
}

module.exports = { mountSingingReferenceRoutes };
