const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os'); const path = require('node:path');
const { isUnsafeAddress, resolvePublicMediaUrl, downloadAudio } = require('../services/safeMediaDownload');
const vm = require('node:vm');
const { Readable, PassThrough } = require('node:stream');
const { EventEmitter } = require('node:events');

async function controlledDownload(get, lookup, timeout = 1000) {
  const code = await fs.readFile(path.join(__dirname, '../services/safeMediaDownload.js'), 'utf8');
  const module = { exports: {} };
  vm.runInNewContext(code, { module, Buffer, URL, AbortController,
    setTimeout: (fn, delay) => setTimeout(fn, Math.min(delay, timeout)), clearTimeout,
    require: name => name === 'node:https' ? { get } : name === 'node:dns' ? { promises: { lookup } } : require(name),
  });
  return module.exports.downloadAudio;
}

function response(status, body, headers = {}) {
  const result = Readable.from(body ? [Buffer.from(body)] : []);
  result.statusCode = status; result.headers = headers; return result;
}

async function withOriginal(action) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-network-test-')); const file = path.join(dir, 'original.wav');
  try { await fs.writeFile(file, 'original'); await action(file); assert.deepEqual(await fs.readdir(dir), ['original.wav']); }
  finally { for (const name of await fs.readdir(dir)) await fs.unlink(path.join(dir, name)); await fs.rmdir(dir); }
}

test('HTTPS uses pinned DNS answers and revalidates every redirected hostname', async () => {
  let lookups = 0, connections = 0;
  const download = await controlledDownload((_url, options, callback) => {
    connections++;
    options.lookup('media.test', { all: true }, (error, addresses) => { assert.equal(error, null); assert.equal(addresses[0].address, '8.8.8.8'); });
    options.lookup('media.test', {}, (error, address) => { assert.equal(error, null); assert.equal(address, '8.8.8.8'); });
    queueMicrotask(() => callback(response(302, null, { location: 'https://private.test/secret' })));
    return new EventEmitter();
  }, async () => [{ address: ++lookups === 1 ? '8.8.8.8' : '127.0.0.1', family: 4 }]);
  await withOriginal(async file => {
    await assert.rejects(download('https://media.test/audio', file), /private|reserved/);
    assert.equal(await fs.readFile(file, 'utf8'), 'original'); assert.equal(connections, 1); assert.equal(lookups, 2);
  });
});

test('interrupted streams, oversized responses and redirect loops never replace a saved file', async () => {
  for (const kind of ['interrupted', 'oversized', 'redirect']) {
    const download = await controlledDownload((_url, _options, callback) => {
      queueMicrotask(() => {
        if (kind === 'interrupted') {
          const stream = new PassThrough(); stream.statusCode = 200; stream.headers = {}; callback(stream);
          setTimeout(() => { stream.write('partial'); stream.destroy(new Error('Stream interrupted')); }, 10);
        } else callback(kind === 'oversized' ? response(200, null, { 'content-length': String(151 * 1024 * 1024) }) : response(302, null, { location: '/loop' }));
      });
      return new EventEmitter();
    }, async () => [{ address: '8.8.8.8', family: 4 }]);
    await withOriginal(async file => { await assert.rejects(download('https://media.test/audio', file), /interrupted|oversized|redirects/); assert.equal(await fs.readFile(file, 'utf8'), 'original'); });
  }
});

test('a hung network request is aborted at the total deadline without leaving partial files', async () => {
  let aborted = false;
  const download = await controlledDownload((_url, options) => {
    const request = new EventEmitter();
    options.signal.addEventListener('abort', () => { aborted = true; request.emit('error', new Error('Aborted')); }); return request;
  }, async () => [{ address: '8.8.8.8', family: 4 }], 30);
  await withOriginal(async file => { await assert.rejects(download('https://media.test/audio', file), /timed out|Aborted/); assert.equal(aborted, true); assert.equal(await fs.readFile(file, 'utf8'), 'original'); });
});
test('private, mapped, reserved and mixed DNS answers cannot become remote audio sources', async () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '100.64.0.1', '224.0.0.1', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', '2001:db8::1']) assert.equal(isUnsafeAddress(address), true, address);
  assert.equal(isUnsafeAddress('8.8.8.8'), false); assert.equal(isUnsafeAddress('2606:4700::1111'), false);
  await assert.rejects(resolvePublicMediaUrl('https://example.test/audio', async () => [{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }]), /private|reserved/);
  for (const url of ['http://example.test/audio', 'https://user:pass@example.test/audio', 'https://localhost/audio', 'https://example.test:8443/audio']) await assert.rejects(resolvePublicMediaUrl(url));
  const result = await resolvePublicMediaUrl('https://example.test/audio', async () => [{ address: '8.8.8.8', family: 4 }]);
  assert.deepEqual(result.addresses, [{ address: '8.8.8.8', family: 4 }]);
});
test('failed media download preserves an existing file and success writes the exact payload', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-download-test-')); const file = path.join(dir, 'sample.wav');
  try {
    await fs.writeFile(file, 'existing');
    await assert.rejects(downloadAudio('data:audio/wav;base64,??', file)); assert.equal(await fs.readFile(file, 'utf8'), 'existing');
    await downloadAudio('data:audio/wav;base64,bmV3', file); assert.equal(await fs.readFile(file, 'utf8'), 'new');
    assert.deepEqual(await fs.readdir(dir), ['sample.wav']);
  } finally { await fs.unlink(file); await fs.rmdir(dir); }
});
