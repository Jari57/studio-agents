const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { requestsPersonalVoice } = require('../services/voiceRequestPolicy');
const { generateMusicalVocal, separateSongStems, separateVocal, SONG_MODEL } = require('../services/musicalVocalService');
const source = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
const route = source.slice(source.indexOf("app.post('/api/generate-speech'"), source.indexOf("app.post('/api/generate-audio'"));

async function request(body, failStem = false) {
  let handler, result, status = 200, refunds = 0;
  const models = [];
  const inputs = [];
  vm.runInNewContext(route, {
    app: { post: (...args) => { handler = args.at(-1); } },
    verifyFirebaseToken() {}, requireAuthForPersonalVoice() {}, requireAuthOrFreeLimit() {}, generationLimiter() {}, checkCreditsFor: () => () => {},
    process: { env: { REPLICATE_API_KEY: 'test-only' } },
    logger: { info() {}, warn() {}, error() {} },
    requestsPersonalVoice, generateMusicalVocal, separateSongStems, separateVocal, Buffer,
    Replicate: class {},
    getOwnedVoiceRecord: async () => null,
    refundCredits: async () => { refunds++; },
    safeErrorDetail: error => error.message,
    runReplicateWithRateLimitRetry: async (_client, model, options) => {
      models.push(model);
      inputs.push(options.input);
      if (model === SONG_MODEL) return 'https://example.test/song.mp3';
      return failStem
        ? { other: 'https://example.test/instrumental.mp3' }
        : {
            vocals: 'https://example.test/vocal.mp3',
            other: 'https://example.test/instrumental.mp3',
          };
    },
    fetchWithRetry: async () => ({ ok: true, arrayBuffer: async () => Buffer.alloc(2000) }),
  });
  await handler({ body: { prompt: 'This original lyric is long enough to sing.', style: 'singer', quality: 'premium', saveToCloud: false, ...body }, headers: {}, user: { uid: 'test-owner' } }, {
    status(value) { status = value; return this; }, json(payload) { result = payload; return this; },
  });
  return { status, result, refunds, models, inputs };
}

test('production vocal handler returns one coherent master and its matched stems', async () => {
  const response = await request({ backingTrackUrl: 'https://example.test/beat.mp3' });
  assert.equal(response.status, 200, JSON.stringify(response.result));
  assert.equal(response.result.wasMixed, true);
  assert.equal(response.result.performanceType, 'coherent-song-stems');
  assert.equal(response.result.audioUrl, 'https://example.test/vocal.mp3');
  assert.equal(response.result.instrumentalUrl, 'https://example.test/instrumental.mp3');
  assert.equal(response.result.mixedAudioUrl, 'https://example.test/song.mp3');
  assert.equal(response.result.requiresHumanReview, true);
  assert.equal(response.models.length, 2);
  assert.equal(response.refunds, 0);
});
test('production vocal handler refunds a missing stem and never returns a full song', async () => {
  const response = await request({}, true);
  assert.equal(response.status, 503, JSON.stringify(response.result));
  assert.equal(response.refunds, 1);
  assert.equal(response.result.audioUrl, undefined);
  assert.equal(response.result.failureStage, 'separation');
  assert.match(response.result.details, /performance was generated/);
});
test('false personal flag cannot bypass private voice ownership inside the handler', async () => {
  const response = await request({ isPersonalVoice: false, speakerUrl: 'https://example.test/unowned.wav', elevenLabsVoiceId: 'unowned' });
  assert.equal(response.status, 403);
  assert.equal(response.result.code, 'PERSONAL_VOICE_UNAVAILABLE');
  assert.equal(response.models.length, 0);
  assert.equal(response.refunds, 1);
});
test('musical lyrics preserve ordinary opening lines and arrangement tags', async () => {
  const prompt = "I'm walking through the light\nThis is our night\n\n[Verse 1]\nHere we stand together\n\n[Chorus]\nKeep the rhythm alive";
  const response = await request({ prompt });
  assert.equal(response.status, 200, JSON.stringify(response.result));
  assert.match(response.inputs[0].lyrics, /^I'm walking/);
  assert.match(response.inputs[0].lyrics, /This is our night/);
  assert.match(response.inputs[0].lyrics, /Here we stand together/);
  assert.match(response.inputs[0].lyrics, /\[Chorus\]/);
});
