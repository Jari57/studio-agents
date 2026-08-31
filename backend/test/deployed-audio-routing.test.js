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
    runReplicateWithRateLimitRetry: async (_client, model) => {
      models.push(model);
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
  return { status, result, models, refunds };
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

test('unsupported premium reference conditioning is explicit, refunded and never generated', async () => {
  const outcome = await generate({ prompt: 'Keep my reference', quality: 'premium', referenceAudio: 'https://example.test/reference.wav' });
  assert.equal(outcome.status, 422);
  assert.equal(outcome.refunds, 1);
  assert.equal(outcome.models.length, 0);
  assert.match(outcome.result.details, /does not accept reference audio/);
});
