'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { positiveArtworkDirection, buildFluxArtworkInput } = require('../services/fluxArtworkInput');
const { requireImageGenerationResult } = require('../services/imageGenerationResult');

test('Flux receives a positive specification while the original brief remains unchanged', () => {
  const original = 'An empty gallery in moss green and cream. No chairs, people or lettering.';
  const positive = 'An empty moss-green gallery with cream walls, clear floor space and unmarked surfaces.';
  const request = { prompt: original, positivePrompt: positive };
  const input = buildFluxArtworkInput(request);
  assert.equal(input.prompt, positive);
  assert.equal(request.prompt, original);
  assert.doesNotMatch(input.prompt, /chairs|people|lettering/);
  assert.equal(input.prompt_upsampling, false);
  assert.equal(input.aspect_ratio, '1:1');
});

test('invalid directions are rejected, never regex-stripped into a different instruction', () => {
  for (const direction of [null, '', '   ', 'x'.repeat(3501), 'A gallery without chairs.',
    'A graphic. No lettering.', 'Avoid people.', 'The letters are absent.', 'A logo-free surface.',
    "The shape can't touch the line.", 'Shapes cannot overlap.', 'People won’t appear.']) {
    assert.throws(() => positiveArtworkDirection(direction), { code: 'ARTWORK_DIRECTION_NOT_POSITIVE', statusCode: 422 });
  }
  assert.equal(positiveArtworkDirection('A noir notebook on an unmarked surface.'), 'A noir notebook on an unmarked surface.');
});

test('legacy callers retain their entire prompt instead of silently losing exclusions', () => {
  const original = 'A portrait without a hat.';
  assert.equal(buildFluxArtworkInput({ prompt: original }).prompt, original);
});

test('reference images use the documented Redux input without forced cloning', () => {
  const input = buildFluxArtworkInput({
    prompt: 'Original stored brief',
    positivePrompt: 'An ivory paper composition with a single folded green ribbon.',
    referenceImage: 'https://media.example/reference.png', aspectRatio: '3:4'
  });
  assert.equal(input.image_prompt, 'https://media.example/reference.png');
  assert.equal(input.aspect_ratio, '3:4');
  assert.equal(Object.hasOwn(input, 'image'), false);
  assert.equal(Object.hasOwn(input, 'image_prompt_strength'), false);
  assert.doesNotMatch(input.prompt, /EXACT|clone|pixel-perfect/);
});

async function invokeRoute(body) {
  const server = fs.readFileSync(path.resolve(__dirname, '..', 'server.js'), 'utf8');
  const start = server.indexOf("app.post('/api/generate-image',");
  const end = server.indexOf('\n});', start) + 4;
  let handler;
  let refunds = 0;
  let providers = 0;
  let captured;
  vm.runInNewContext(server.slice(start, end), {
    app: { post(_path, ...handlers) { handler = handlers.at(-1); } },
    verifyFirebaseToken() {}, requireAuthOrFreeLimit() {}, checkCreditsFor() {}, generationLimiter() {},
    buildFluxArtworkInput, requireImageGenerationResult,
    process: { env: { REPLICATE_API_TOKEN: 'unit-test-only' } },
    logger: { info() {}, warn() {}, error() {} },
    fetchWithRetry: async (_url, options) => {
      providers++;
      captured = JSON.parse(options.body).input;
      return { ok: true, json: async () => ({ output: 'https://media.example/art.png' }) };
    },
    getStorageBucket: () => null,
    refundCredits: async () => { refunds++; },
    safeErrorDetail: (error) => error.message
  });
  const req = { user: { uid: 'unit-test-user' }, body };
  const res = { statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
  await handler(req, res);
  return { res, refunds, providers, captured };
}

test('real route purchases only the positive input and preserves provider attribution', async () => {
  const body = { prompt: 'Stored brief. No crowds or writing.', positivePrompt: 'A solitary folded paper sculpture on a plain cream background.' };
  const before = JSON.stringify(body);
  const { res, refunds, providers, captured } = await invokeRoute(body);
  assert.equal(res.statusCode, 200);
  assert.equal(providers, 1);
  assert.equal(refunds, 0);
  assert.equal(captured.prompt, body.positivePrompt);
  assert.equal(res.body.model, 'flux-1.1-pro');
  assert.equal(JSON.stringify(body), before);
});

test('real route rejects echoed exclusions before provider spend and refunds', async () => {
  const { res, refunds, providers } = await invokeRoute({ prompt: 'Stored brief', positivePrompt: 'No chairs or people are present.' });
  assert.equal(res.statusCode, 422);
  assert.equal(res.body.code, 'ARTWORK_DIRECTION_NOT_POSITIVE');
  assert.equal(providers, 0);
  assert.equal(refunds, 1);
  assert.match(res.body.details, /unchanged brief/);
});
