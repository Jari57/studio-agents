const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-routing-test-'));
test.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
for (const file of ['backend/server.js', 'backend/services/videoGenerationOrchestrator.js']) {
  fs.mkdirSync(path.dirname(path.join(fixture, file)), { recursive: true });
  fs.copyFileSync(path.join(root, file), path.join(fixture, file));
}
execFileSync(process.execPath, [path.join(root, 'scripts/patch-provider-routing.mjs'), fixture]);
const deployed = fs.readFileSync(path.join(fixture, 'backend/server.js'), 'utf8');
const start = deployed.indexOf("app.post('/api/generate-audio'");
const end = deployed.indexOf("app.post('/api/mix-audio'", start);

async function generate(body) {
  let handler;
  let result;
  let status = 200;
  let refunds = 0;
  const models = [];
  const modelInputs = [];
  const context = {
    app: { post: (...args) => { handler = args.at(-1); } },
    verifyFirebaseToken() {}, requireAuthOrFreeLimit() {}, generationLimiter() {},
    checkCreditsFor: () => () => {},
    process: { env: { STABILITY_API_KEY: 'test-only', REPLICATE_API_KEY: 'test-only' } },
    logger: { info() {}, warn() {}, error() {} },
    getStabilityAudioSettings: () => ({ model: 'test' }),
    buildBeatGenerationPrompt: () => 'Original test instrumental',
    Replicate: class {}, Buffer, AbortSignal,
    fetch: async () => ({ ok: true, status: 200, json: async () => ({ credits: -95 }) }),
    fetchWithRetry: async () => ({ ok: true, arrayBuffer: async () => Buffer.alloc(1000) }),
    runReplicateWithRateLimitRetry: async (_client, model, options) => {
      models.push(model);
      modelInputs.push(options?.input || {});
      return 'https://example.test/test-fixture.mp3';
    },
    refundCredits: async () => { refunds++; },
    safeErrorDetail: error => error.message,
  };
  vm.runInNewContext(deployed.slice(start, end), context);
  await handler({ body }, {
    status(code) { status = code; return this; },
    json(payload) { result = payload; return this; },
  });
  return { status, result, models, modelInputs, refunds };
}

for (const duration of [30, 60, 180]) {
  test(`deployed premium ${duration}s request has a real route with exhausted Stability`, async () => {
    const outcome = await generate({ prompt: 'Original instrumental', quality: 'premium', duration });
    assert.equal(outcome.status, 200, JSON.stringify(outcome.result));
    assert.deepEqual(outcome.models, ['minimax/music-2.6']);
    assert.equal(outcome.result.provider, 'minimax-music-2.6');
    assert.equal(outcome.result.requestedDuration, duration);
    assert.equal(outcome.result.actualDuration, null, 'Do not invent the generated duration');
    assert.equal(outcome.result.requiresHumanReview, true);
    assert.equal(outcome.refunds, 0);
  });
}

test('premium reference audio generates a melody-conditioned GPTMusic beat', async () => {
  const referenceAudio = 'https://example.test/reference.wav';
  const outcome = await generate({
    prompt: 'Keep the reference groove',
    engine: 'auto',
    quality: 'premium',
    referenceAudio,
  });
  assert.equal(outcome.status, 200, JSON.stringify(outcome.result));
  assert.equal(outcome.refunds, 0);
  assert.match(outcome.models[0], /^facebook\/musicgen:/);
  assert.equal(outcome.modelInputs[0].melody, referenceAudio);
  assert.equal(outcome.modelInputs[0].model_version, 'stereo-melody-large');
  assert.equal(outcome.result.provider, 'music-gpt');
});

function providerHarness(status = 'succeeded', configuredTimeout) {
  const calls = [];
  const context = {
    process: { env: { REPLICATE_API_TOKEN: 'fixture-only', REPLICATE_GENERATION_TIMEOUT_MS: configuredTimeout } },
    logger: { info() {}, warn() {} },
    setTimeout: callback => callback(), Date,
    fetchWithTimeout: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 200, text: async () => JSON.stringify({ id: 'fixture', status, output: status === 'succeeded' ? 'fixture-output' : null }) };
    },
  };
  const helperStart = deployed.indexOf('async function runReplicateWithRateLimitRetry(');
  vm.runInNewContext(deployed.slice(helperStart, deployed.indexOf('const app = express()', helperStart)), context);
  return { calls, run: context.runReplicateWithRateLimitRetry };
}

for (const [operation, seconds] of [['MiniMax vocal generation', '150s'], ['MiniMax beat generation', '150s'], ['Musical vocal stem separation', '180s']]) {
  test(`deployed ${operation} has an explicit ${seconds} total budget`, async () => {
    const { calls, run } = providerHarness();
    await run(null, 'owner/model', { input: {} }, operation);
    assert.equal(calls[0].options.headers['Cancel-After'], seconds);
    assert.equal(calls.length, 1);
  });
}

test('an explicitly configured smaller provider budget remains respected', async () => {
  const { calls, run } = providerHarness('succeeded', '60000');
  await run(null, 'owner/model', { input: {} }, 'Musical vocal stem separation');
  assert.equal(calls[0].options.headers['Cancel-After'], '60s');
});

test('aborted provider prediction is terminal without polling or duplicate creation', async () => {
  const { calls, run } = providerHarness('aborted');
  await assert.rejects(run(null, 'owner/model', { input: {} }, 'Musical vocal stem separation'), { code: 'PROVIDER_FAILED' });
  assert.equal(calls.length, 1);
});
