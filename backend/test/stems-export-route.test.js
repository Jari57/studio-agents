const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { downloadAudio } = require('../services/safeMediaDownload');
const source = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

function wavFixture() {
  // Explicit synthetic DSP fixture, not generated music or an artist voice.
  const pcm = Buffer.alloc(44100 * 2);
  for (let n = 11025; n < 33075; n++) pcm.writeInt16LE(Math.round(Math.sin(n * 2 * Math.PI * 440 / 44100) * 6000), n * 2);
  const h = Buffer.alloc(44); h.write('RIFF'); h.writeUInt32LE(pcm.length + 36, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(44100, 24); h.writeUInt32LE(88200, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return `data:audio/wav;base64,${Buffer.concat([h, pcm]).toString('base64')}`;
}

function entries(zip) {
  const files = {}; let offset = 0;
  while (zip.readUInt32LE(offset) === 0x04034b50) {
    assert.equal(zip.readUInt16LE(offset + 8), 0);
    const size = zip.readUInt32LE(offset + 18), nameLength = zip.readUInt16LE(offset + 26), extra = zip.readUInt16LE(offset + 28);
    const name = zip.toString('utf8', offset + 30, offset + 30 + nameLength); const start = offset + 30 + nameLength + extra;
    files[name] = zip.subarray(start, start + size); offset = start + size;
  }
  return files;
}

async function invoke(body) {
  let handler; const tempPaths = [];
  const code = source.slice(source.indexOf('function _crc32('), source.indexOf("app.post('/api/translate'"));
  const guardedFs = Object.create(fs);
  guardedFs.mkdtempSync = prefix => { const result = fs.mkdtempSync(prefix); tempPaths.push(result); return result; };
  const auth = () => {}, requireAuth = () => {};
  vm.runInNewContext(code, { require: require('node:module').createRequire(path.join(__dirname, '../server.js')), path, fs: guardedFs, Buffer, downloadAudio,
    verifyFirebaseToken: auth, requireAuth, generationLimiter() {}, safeErrorDetail: err => err.message,
    logger: { info() {}, warn() {}, error() {} },
    app: { post(url, ...handlers) { assert.equal(handlers[0], auth); assert.equal(handlers[1], requireAuth); handler = handlers.at(-1); } },
  });
  const res = { code: 200, headers: {}, status(n) { this.code = n; return this; }, json(value) { this.body = value; return this; },
    setHeader(k, v) { this.headers[k] = v; }, send(value) { this.body = value; } };
  await handler({ body, user: { uid: 'fixture-owner' } }, res);
  assert.ok(tempPaths.every(dir => path.dirname(dir) === os.tmpdir() && !fs.existsSync(dir)), 'request-owned temporary files cleaned');
  return res;
}

test('actual ZIP route converts all stems with real FFmpeg and preserves source timing', async () => {
  const audio = wavFixture();
  const res = await invoke({ beatUrl: audio, vocalsUrl: audio, masterUrl: audio, projectName: 'Audition', bpm: null });
  assert.equal(res.code, 200, JSON.stringify(res.body)); assert.equal(res.headers['Content-Type'], 'application/zip');
  const files = entries(res.body); assert.equal(Object.keys(files).length, 5);
  const manifest = JSON.parse(files['manifest.json']); assert.equal(manifest.files.length, 3); assert.equal(manifest.bpm, null);
  assert.match(manifest.fidelity, /does not restore/); assert.match(manifest.timing, /not independently certified/);
  for (const [name, bytes] of Object.entries(files).filter(([name]) => name.endsWith('.wav'))) {
    assert.match(name, /Master Mix|Beat \(Instrumental\)|Vocals \(Separated\)/);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF'); let at = 12, pcm;
    while (at + 8 <= bytes.length) {
      const type = bytes.toString('ascii', at, at + 4), size = bytes.readUInt32LE(at + 4);
      if (type === 'fmt ') { assert.equal(bytes.readUInt16LE(at + 10), 2); assert.equal(bytes.readUInt32LE(at + 12), 44100); assert.equal(bytes.readUInt16LE(at + 22), 24); }
      if (type === 'data') { pcm = bytes.subarray(at + 8, at + 8 + size); break; }
      at += 8 + size + (size % 2);
    }
    assert.equal(pcm.length, 44100 * 6); assert.ok(pcm.subarray(0, 11025 * 6).every(b => b === 0), 'leading quarter-second is unchanged');
    assert.ok(pcm.subarray(11026 * 6, 11030 * 6).some(b => b !== 0));
  }
});

test('one failed stem never returns a partial ZIP or a success count', async () => {
  const res = await invoke({ beatUrl: wavFixture(), vocalsUrl: 'data:audio/wav;base64,bm90LWF1ZGlv', projectName: 'Failure' });
  assert.equal(res.code, 422); assert.equal(res.body.code, 'INCOMPLETE_EXPORT');
  assert.deepEqual(Array.from(res.body.failedFiles), ['Vocals (Separated)']); assert.equal(res.headers['Content-Type'], undefined);
});
