const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  QUALITY_PRESETS,
  cleanupFiles,
  downloadSource,
  ensureTempDir,
} = require('../services/formatConversionService');

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-agents-format-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('quality presets keep customer-facing WAV output deterministic', () => {
  assert.deepEqual(QUALITY_PRESETS.standard, {
    codec: 'pcm_s16le',
    sampleRate: 44_100,
    channels: 2,
  });
  assert.deepEqual(QUALITY_PRESETS.cd, QUALITY_PRESETS.standard);
  assert.deepEqual(QUALITY_PRESETS.hires, {
    codec: 'pcm_s24le',
    sampleRate: 96_000,
    channels: 2,
  });
});

test('downloadSource decodes a data URI into the requested file', async (t) => {
  const directory = temporaryDirectory(t);
  const outputPath = path.join(directory, 'source.bin');
  const expected = Buffer.from('studio-agents-audio-fixture');
  const dataUri = `data:application/octet-stream;base64,${expected.toString('base64')}`;

  const resolvedPath = await downloadSource(dataUri, outputPath);

  assert.equal(resolvedPath, outputPath);
  assert.deepEqual(fs.readFileSync(outputPath), expected);
});

test('downloadSource rejects malformed data URIs without creating a false success', async (t) => {
  const directory = temporaryDirectory(t);
  const outputPath = path.join(directory, 'invalid.bin');

  await assert.rejects(downloadSource('data:application/octet-stream;base64', outputPath), {
    message: 'Invalid data URL',
  });
  assert.equal(fs.existsSync(outputPath), false);
});

test('cleanupFiles removes completed temp artifacts and ignores missing paths', (t) => {
  const directory = temporaryDirectory(t);
  const outputPath = path.join(directory, 'temporary.bin');
  fs.writeFileSync(outputPath, 'temporary');

  assert.doesNotThrow(() => cleanupFiles(outputPath, path.join(directory, 'missing.bin'), null));
  assert.equal(fs.existsSync(outputPath), false);
});

test('ensureTempDir returns a writable backend temp directory', (t) => {
  const directory = ensureTempDir();
  const probePath = path.join(directory, `test-${process.pid}-${Date.now()}.tmp`);
  t.after(() => cleanupFiles(probePath));

  fs.writeFileSync(probePath, 'probe');

  assert.equal(fs.statSync(directory).isDirectory(), true);
  assert.equal(fs.readFileSync(probePath, 'utf8'), 'probe');
});
