const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { requestsPersonalVoice } = require('../services/voiceRequestPolicy');
const { approvedSingingReference, personalLyricsError } = require('../services/voiceReferences');
const { generateMusicalVocal, separateSongStems, separateVocal, SONG_MODEL } = require('../services/musicalVocalService');
const source = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
const route = source.slice(source.indexOf("app.post('/api/generate-speech'"), source.indexOf("app.post('/api/generate-audio'"));

async function request(body, failStem = false, options = {}) {
  let handler, result, status = 200, refunds = 0;
  const models = [];
  const inputs = [];
  const events = [];
  vm.runInNewContext(route, {
    app: { post: (...args) => { handler = args.at(-1); } },
    verifyFirebaseToken() {}, requireAuthForPersonalVoice() {}, requireAuthOrFreeLimit() {}, generationLimiter() {}, checkCreditsFor: () => () => {},
    process: { env: { REPLICATE_API_KEY: 'test-only' } },
    logger: { info() {}, warn() {}, error() {} },
    requestsPersonalVoice, generateMusicalVocal, separateSongStems, separateVocal, Buffer,
    crypto: require('node:crypto'), URL, AbortSignal,
    approvedSingingReference: options.personal ? async () => ({ id: 'approved', url: 'https://example.test/approved.wav' }) : approvedSingingReference,
    personalLyricsError, getFirestoreDb: () => null, getStorageBucket: () => null,
    analyzeSongReferences: async () => { events.push('reference-analysis'); return { key_characteristics: 'warm guitar' }; },
    fetch: async (url, init) => {
      if (String(url).includes('/music-01/')) { events.push('personal-performance'); inputs.push(JSON.parse(init.body).input); return { ok: true, json: async () => ({ status: 'succeeded', output: 'https://example.test/new-personal-song.mp3' }) }; }
      return { ok: true };
    },
    Replicate: class {},
    getOwnedVoiceRecord: async () => null,
    refundCredits: async () => { refunds++; },
    safeErrorDetail: error => error.message,
    runReplicateWithRateLimitRetry: async (_client, model, options) => {
      models.push(model);
      events.push(model === SONG_MODEL ? 'performance' : 'separation');
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
  return { status, result, refunds, models, inputs, events };
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

test('personal singing is conditioned on music and cannot select a speech provider', () => {
  assert.match(source, /const strictMusicalQuality = requiresMusicalPerformance/);
  assert.match(source, /mmInput\.instrumental_file = backingTrackUrl/);
  assert.match(source, /PERSONAL_VOICE_NEEDS_MUSIC/);
  assert.match(source, /strictMusicalQuality \? 'minimax-music' : 'elevenlabs-clone'/);
});

test('reference analysis precedes song generation, but over-capacity lyrics are rejected before either call', async () => {
  const normal = await request({ songReferences: [{ assetId: 'own' }] });
  assert.equal(normal.status, 200); assert.deepEqual(normal.events, ['reference-analysis', 'performance', 'separation']);
  assert.match(normal.inputs[0].prompt, /warm guitar/);
  const invalid = await request({ prompt: 'x'.repeat(3501), songReferences: [{ assetId: 'own' }] });
  assert.equal(invalid.status, 422); assert.deepEqual(invalid.events, []); assert.equal(invalid.refunds, 1);
});

test('approved personal singing uses the selected excerpt verbatim and returns the new matching accompaniment, not the conditioning beat', async () => {
  const response = await request({ personalReferenceId: 'approved', isPersonalVoice: true, backingTrackUrl: 'https://example.test/old-beat.mp3', prompt: 'My own sung hook', preferredProvider: 'elevenlabs' }, false, { personal: true });
  assert.equal(response.status, 200, JSON.stringify(response.result));
  assert.equal(response.inputs[0].lyrics, 'My own sung hook'); assert.equal(response.inputs[0].voice_file, 'https://example.test/approved.wav');
  assert.equal(response.inputs[0].instrumental_file, 'https://example.test/old-beat.mp3');
  assert.equal(response.result.instrumentalUrl, 'https://example.test/instrumental.mp3'); assert.notEqual(response.result.instrumentalUrl, response.inputs[0].instrumental_file);
  assert.equal(response.result.mixedAudioUrl, 'https://example.test/new-personal-song.mp3'); assert.equal(response.result.personalReferenceId, 'approved');
});
