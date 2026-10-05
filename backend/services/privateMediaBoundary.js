'use strict';

// Capability URLs are not proof of ownership. Do not process another user's
// private Studio storage object merely because its URL was copied or cached.
function privateMediaOwner(value, bucketNames) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return null;
  let url;
  try { url = new URL(value); } catch { return null; }
  const path = decodeURIComponent(url.pathname);
  let bucket, object;
  if (url.hostname === 'firebasestorage.googleapis.com') {
    const match = path.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
    if (match) [, bucket, object] = match;
  } else if (url.hostname === 'storage.googleapis.com') {
    const match = path.match(/^\/([^/]+)\/(.+)$/);
    if (match) [, bucket, object] = match;
  } else if (url.hostname.endsWith('.storage.googleapis.com')) {
    bucket = url.hostname.slice(0, -'.storage.googleapis.com'.length);
    object = path.slice(1);
  }
  if (!bucketNames.includes(bucket)) return null;
  return object?.match(/^users\/([^/]+)\//)?.[1] || null;
}

function assertPrivateMediaOwnership(body, uid, bucketNames) {
  const queue = [body];
  while (queue.length) {
    const value = queue.pop();
    if (ArrayBuffer.isView(value)) continue; // Raw webhook bodies are not JSON media requests.
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) queue.push(child);
    }
    else {
      let owner;
      try { owner = privateMediaOwner(value, bucketNames); }
      catch { throw Object.assign(new Error('Invalid media URL'), { status: 400 }); }
      if (owner && owner !== uid) throw Object.assign(new Error('Private media must belong to your signed-in account.'), { status: uid ? 403 : 401 });
    }
  }
}

module.exports = { privateMediaOwner, assertPrivateMediaOwnership };
