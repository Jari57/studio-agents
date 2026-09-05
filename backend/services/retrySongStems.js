// Resolve only server-saved masters owned by this account. Never send an
// arbitrary client URL to the separation provider.
async function resolveMaster(bucket, uid, rawUrl) {
  if (!bucket || !uid) throw Object.assign(new Error('Private storage unavailable'), { status: 503 });
  let url, path;
  try {
    url = new URL(rawUrl);
    const prefix = `/v0/b/${bucket.name}/o/`;
    if (url.origin !== 'https://firebasestorage.googleapis.com' || !url.pathname.startsWith(prefix)) throw new Error();
    path = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!path.startsWith(`users/${uid}/assets/`) || !path.includes('song_master_') || /\.\.|\\/.test(path)) throw new Error();
  } catch { throw Object.assign(new Error('Choose your own saved song master'), { status: 403 }); }
  const [metadata] = await bucket.file(path).getMetadata();
  if (metadata.metadata?.userId !== uid || !metadata.metadata?.firebaseStorageDownloadTokens) {
    throw Object.assign(new Error('Song master ownership could not be verified'), { status: 403 });
  }
  // Reconstruct from trusted metadata; ignore caller-supplied tokens.
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${encodeURIComponent(metadata.metadata.firebaseStorageDownloadTokens.split(',')[0])}`;
}

function createStemRetry({ getBucket, separate, upload }) {
  const pending = new Map();
  return async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Sign in to recover stems' });
    if (pending.has(uid)) return res.status(409).json({ error: 'Stem recovery is already running. Please wait.' });
    pending.set(uid, true);
    try {
      const master = await resolveMaster(getBucket(), uid, req.body?.masterUrl);
      const stems = await separate(master);
      const vocal = await upload(stems.vocalUrl, uid, 'recovered_vocal.mp3', 'audio/mpeg');
      const instrumental = await upload(stems.instrumentalUrl, uid, 'recovered_instrumental.mp3', 'audio/mpeg');
      return res.json({ audioUrl: vocal.url, instrumentalUrl: instrumental.url, mixedAudioUrl: master, isDurable: true });
    } catch (error) {
      return res.status(error.status === 403 ? 403 : 503).json({ error: 'Stem recovery did not complete. Your saved song is unchanged.' });
    } finally { pending.delete(uid); }
  };
}
module.exports = { resolveMaster, createStemRetry };
