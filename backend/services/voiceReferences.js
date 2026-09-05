const { execFile } = require('node:child_process');
const { createHash } = require('node:crypto');
const ffmpeg = require('ffmpeg-static');
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

function referenceError(message, status = 422) { return Object.assign(new Error(message), { status }); }

async function ownedAudioAsset(db, bucket, uid, selector = {}) {
  if (!db || !bucket) throw referenceError('Private audio storage is unavailable', 503);
  if (!uid) throw referenceError('Sign in to use a personal audio asset', 401);
  const assets = db.collection('users').doc(uid).collection('assets');
  let doc;
  if (typeof selector.assetId === 'string' && /^[\w-]{1,200}$/.test(selector.assetId)) doc = await assets.doc(selector.assetId).get();
  else if (typeof selector.url === 'string' && /^https:\/\//.test(selector.url) && selector.url.length <= 4096) doc = (await assets.where('url', '==', selector.url).limit(1).get()).docs[0];
  const data = doc?.exists === false ? null : doc?.data();
  const prefix = `users/${uid}/assets/`;
  if (!data || data.assetType !== 'audio' || typeof data.storagePath !== 'string' || !data.storagePath.startsWith(prefix)
    || data.storagePath.includes('..') || data.storagePath.includes('\\')) throw referenceError('Audio must belong to your private uploaded asset library', 403);
  return { ...data, id: doc.id, storagePath: data.storagePath };
}

async function readOwnedAudio(db, bucket, uid, selector) {
  const asset = await ownedAudioAsset(db, bucket, uid, selector);
  const file = bucket.file(asset.storagePath);
  const [metadata] = await file.getMetadata();
  if (!Number(metadata.size) || Number(metadata.size) > MAX_SOURCE_BYTES) throw referenceError('Use an audio file no larger than 15MB');
  const bytes = await new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    const stream = file.createReadStream();
    const timeout = setTimeout(() => stream.destroy(referenceError('Reading the audio timed out. Retry preparation', 503)), 60000);
    stream.once('close', () => clearTimeout(timeout));
    stream.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_SOURCE_BYTES) stream.destroy(referenceError('Audio exceeds the 15MB limit'));
      else chunks.push(chunk);
    });
    stream.on('error', reject);
    stream.on('end', () => size ? resolve(Buffer.concat(chunks)) : reject(referenceError('The stored audio is empty')));
  });
  return { asset, bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
}

function pcmQuality(pcm) {
  const samples = Math.floor(pcm.length / 2);
  if (!samples) throw referenceError('No decodable audio was found');
  let energy = 0; let clipped = 0; let audible = 0;
  for (let i = 0; i < samples; i++) {
    const value = pcm.readInt16LE(i * 2) / 32768;
    energy += value * value;
    if (Math.abs(value) >= 0.999) clipped++;
    if (Math.abs(value) > 0.003) audible++;
  }
  const duration = samples / 44100;
  const rmsDb = 20 * Math.log10(Math.sqrt(energy / samples) || 1e-12);
  const clippedFraction = clipped / samples;
  const audibleFraction = audible / samples;
  if (duration <= 15) throw referenceError('The chosen excerpt needs more than 15 seconds of decodable audio');
  if (rmsDb < -45 || audibleFraction < 0.03) throw referenceError('This excerpt is mostly silent or too quiet. Choose clear, audible singing');
  if (clippedFraction > 0.02) throw referenceError('This excerpt is heavily clipped. Choose a cleaner recording');
  return { duration, rmsDb, clippedFraction, audibleFraction,
    singerCount: 'unverified', identity: 'requires artist listening approval' };
}

async function prepareReferenceAudio(bytes, { startSeconds = 0, durationSeconds = 30 } = {}) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_SOURCE_BYTES) throw referenceError('Use a valid audio file no larger than 15MB');
  const start = Number(startSeconds); const duration = Number(durationSeconds);
  if (!Number.isFinite(start) || start < 0 || start > 1200 || !Number.isFinite(duration) || duration < 16 || duration > 45) throw referenceError('Choose a 16–45 second excerpt with a valid start time');
  const args = ['-hide_banner', '-loglevel', 'error', '-protocol_whitelist', 'pipe', '-i', 'pipe:0', '-ss', String(start), '-t', String(duration), '-vn', '-ac', '1', '-ar', '44100', '-f', 's16le', 'pipe:1'];
  const pcm = await new Promise((resolve, reject) => {
    const child = execFile(ffmpeg, args, { encoding: 'buffer', timeout: 60000, maxBuffer: 6 * 1024 * 1024, windowsHide: true }, (error, stdout) => {
      if (error) reject(referenceError('Audio could not be decoded. Try an MP3 or WAV with a clear vocal excerpt'));
      else resolve(stdout);
    });
    child.stdin.on('error', () => {});
    child.stdin.end(bytes);
  });
  const quality = pcmQuality(pcm);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(pcm.length + 36, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(44100, 24); header.writeUInt32LE(88200, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  return { wav: Buffer.concat([header, pcm]), quality, excerpt: { startSeconds: start, durationSeconds: quality.duration } };
}

function personalLyricsError(lyrics) {
  const length = typeof lyrics === 'string' ? lyrics.trim().length : 0;
  return length < 1 || length > 400 ? 'Personal-voice auditions support 1–400 characters of lyrics and up to about one minute. Choose an excerpt; no verses will be cut or repeated automatically.' : null;
}

async function approvedSingingReference(db, bucket, uid, id) {
  if (!uid || typeof id !== 'string' || !/^[\w-]{1,200}$/.test(id)) throw referenceError('Prepare and approve a singing reference for this account', 403);
  if (!db || !bucket) throw referenceError('Private voice library is unavailable', 503);
  // This collection has no client write rule. Never trust the legacy, client-editable voices/profile records as consent.
  const doc = await db.collection('users').doc(uid).collection('singingReferences').doc(id).get();
  const value = doc.exists ? doc.data() : null;
  if (!value || value.ownerUid !== uid || value.status !== 'ready' || value.consent?.version !== 1
    || value.consent?.confirmed !== true || value.review?.approved !== true) throw referenceError('This singing reference has not been approved for this account', 403);
  const asset = await ownedAudioAsset(db, bucket, uid, { assetId: value.preparedAssetId });
  if (asset.sha256 !== value.preparedSha256) throw referenceError('The prepared voice reference changed. Prepare it again', 409);
  return { ...value, id: doc.id, url: asset.url };
}

module.exports = { ownedAudioAsset, readOwnedAudio, prepareReferenceAudio, pcmQuality, personalLyricsError, referenceError, approvedSingingReference };
