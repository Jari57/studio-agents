import test from 'node:test';
import assert from 'node:assert/strict';
import { collectProjectExport, downloadVerifiedMedia, exportExtension } from '../src/utils/projectExport.mjs';

test('individual download uses the actual MIME extension and never opens a substitute page after failure', async t => {
  const originalDocument = globalThis.document;
  const anchors = [];
  globalThis.document = { createElement: () => ({ click() { anchors.push(this.download); }, remove() {} }), body: { appendChild() {} } };
  t.after(() => { if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument; });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', async () => new Response(new Blob(['synthetic fixture'], { type: 'audio/wav' })));
  const fileName = await downloadVerifiedMedia('https://media.test/wrong.mp3', 'My/song:master');
  assert.equal(fileName, 'My_song_master.wav'); assert.deepEqual(anchors, [fileName]);
  globalThis.fetch.mock.mockImplementation(async () => new Response('expired', { status: 403 }));
  await assert.rejects(downloadVerifiedMedia('https://media.test/expired', 'Master'), /403/);
  assert.equal(anchors.length, 1); t.mock.timers.tick(1000);
});

test('export preserves actual formats and includes an honest per-file manifest', async () => {
  const exported = await collectProjectExport({ Beat: 'https://example.com/wrong.mp3', Master: 'https://example.com/master' }, 'Song', async url =>
    new Response(new Blob(['audio fixture'], { type: url.endsWith('mp3') ? 'audio/wav' : 'audio/mpeg' })));
  assert.deepEqual(exported.assets.map(a => a.name), ['Song - Beat.wav', 'Song - Master.mp3']);
  assert.ok(exported.manifest.files.every(f => f.bytes > 0 && f.status === 'exported'));
  assert.match(exported.manifest.fidelity, /not lossless/); assert.match(exported.manifest.timing, /must be auditioned/);
  assert.equal(exportExtension(new Blob(['x'], { type: 'application/octet-stream' }), 'https://example.com/file.flac?token=x'), 'flac');
});

test('a missing, empty, expired or interrupted requested asset stops the whole ZIP', async () => {
  for (const bad of [() => new Response('missing', { status: 404 }), () => new Response(null),
    () => new Response('<html>sign in</html>', { headers: { 'content-type': 'text/html' } }),
    () => new Response('{}', { headers: { 'content-type': 'application/json' } }), () => { throw new Error('Network interrupted'); }]) {
    await assert.rejects(collectProjectExport({ Beat: 'good', Vocals: 'bad' }, 'Song', async url => url === 'good' ? new Response(new Blob(['fixture'], { type: 'audio/mpeg' })) : bad()), error => {
      assert.match(error.message, /No partial ZIP/); assert.equal(error.failedFiles.length, 1); assert.equal(error.failedFiles[0].role, 'Vocals'); return true;
    });
  }
});
