const fs = require('node:fs');
const https = require('node:https');
const dns = require('node:dns').promises;
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const MAX_BYTES = 150 * 1024 * 1024;

function isUnsafeAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && [0, 168].includes(b)) || (a === 198 && [18, 19, 51].includes(b)) || (a === 203 && b === 0);
  }
  // Allow only globally routed IPv6. This also excludes IPv4-mapped, loopback,
  // link-local, unique-local and multicast destinations.
  const value = address.toLowerCase();
  return !net.isIPv6(address) || !/^[23]/.test(value) || value.startsWith('2001:db8:')
    || value.startsWith('2001:0:') || value.startsWith('2002:');
}

async function resolvePublicMediaUrl(raw, lookup = dns.lookup.bind(dns)) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Media must use a public HTTPS URL');
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.localhost')) throw new Error('Local media URLs are not accepted');
  const addresses = net.isIP(hostname) ? [{ address: hostname, family: net.isIP(hostname) }] : await lookup(hostname, { all: true });
  if (!addresses.length || addresses.some(item => isUnsafeAddress(item.address))) throw new Error('Media URL resolved to a private or reserved address');
  return { url, addresses };
}

async function downloadAudio(raw, destPath, maxRedirects = 3) {
  if (typeof raw !== 'string' || raw.length > MAX_BYTES * 1.4) throw new Error('Invalid or oversized media URL');
  const part = `${destPath}.${randomUUID()}.part`;
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error('Media download timed out')); }, 60000);
  });
  try {
    if (raw.startsWith('data:')) {
      const match = raw.match(/^data:(?:audio|video|image)\/[\w.+-]+;base64,([a-zA-Z0-9+/=\r\n]+)$/);
      if (!match) throw new Error('Invalid media data URI');
      const bytes = Buffer.from(match[1], 'base64');
      if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('Media exceeds the 150MB session limit');
      await Promise.race([fs.promises.writeFile(part, bytes, { signal: controller.signal }), deadline]);
    } else {
      let url = raw;
      for (let redirect = 0; ; redirect++) {
        const resolved = await Promise.race([resolvePublicMediaUrl(url), deadline]);
        const response = await Promise.race([new Promise((resolve, reject) => {
          const request = https.get(resolved.url, {
            signal: controller.signal,
            // Pin the validated result to prevent DNS rebinding between validation and connect.
            lookup: (_host, options, callback) => options.all
              ? callback(null, resolved.addresses)
              : callback(null, resolved.addresses[0].address, resolved.addresses[0].family),
          }, resolve);
          request.on('error', reject);
        }), deadline]);
        if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
          response.destroy();
          if (redirect >= maxRedirects) throw new Error('Too many media redirects');
          url = new URL(response.headers.location, resolved.url).href;
          continue;
        }
        if (response.statusCode !== 200 || Number(response.headers['content-length']) > MAX_BYTES) {
          response.destroy(); throw new Error(`Media download rejected (HTTP ${response.statusCode} or oversized file)`);
        }
        let size = 0;
        const bounded = new Transform({ transform(chunk, _encoding, callback) {
          size += chunk.length;
          callback(size > MAX_BYTES ? new Error('Media exceeded the 150MB session limit') : null, chunk);
        } });
        await Promise.race([pipeline(response, bounded, fs.createWriteStream(part), { signal: controller.signal }), deadline]);
        if (!size) throw new Error('The downloaded media is empty');
        break;
      }
    }
    await fs.promises.rename(part, destPath);
    return destPath;
  } finally {
    clearTimeout(timer);
    controller.abort();
    await fs.promises.unlink(part).catch(() => {});
  }
}

async function readRemoteMedia(url, maxBytes = MAX_BYTES) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'studio-media-'));
  const file = path.join(dir, 'source');
  try {
    await downloadAudio(url, file);
    if ((await fs.promises.stat(file)).size > maxBytes) throw new Error('Media exceeds the supported size');
    return await fs.promises.readFile(file);
  } finally {
    await fs.promises.unlink(file).catch(() => {});
    await fs.promises.rmdir(dir).catch(() => {});
  }
}
module.exports = { downloadAudio, readRemoteMedia, resolvePublicMediaUrl, isUnsafeAddress };
