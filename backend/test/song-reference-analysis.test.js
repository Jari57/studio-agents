const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function analyzer() {
  const context = { module: { exports: {} }, AbortSignal, fetch,
    require: () => ({
      readOwnedAudio: async () => ({ bytes: Buffer.from('owned audio') }),
      prepareReferenceAudio: async () => ({ wav: Buffer.from('excerpt') }),
      referenceError: (message, status) => Object.assign(new Error(message), { status }),
    }),
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../services/songReferenceAnalysis.js'), 'utf8'), context);
  return context.module.exports.analyzeSongReferences;
}
const valid = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ tone: 'warm', mood: 'bright', vocal_direction: 'sung', key_characteristics: 'syncopated rhythm' }) }] } }] };

test('incomplete analysis retries before returning musical direction', async () => {
  const requests = [];
  const result = await analyzer()({ references: [{ assetId: 'owned' }], apiKey: 'test', fetcher: async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return { ok: true, json: async () => requests.length === 1 ? { candidates: [{ finishReason: 'MAX_TOKENS' }] } : valid };
  } });
  assert.equal(result.key_characteristics, 'syncopated rhythm');
  assert.equal(requests.length, 2);
  assert.equal(requests[0].generationConfig.thinkingConfig.thinkingBudget, 0);
  assert.equal(requests[0].generationConfig.responseSchema.required.length, 4);
});

test('persistent malformed analysis fails closed after two attempts', async () => {
  let calls = 0;
  await assert.rejects(analyzer()({ references: [{ assetId: 'owned' }], apiKey: 'test', fetcher: async () => {
    calls++; return { ok: true, json: async () => ({ candidates: [] }) };
  } }), /invalid result/);
  assert.equal(calls, 2);
});

test('no references require no analysis request', async () => {
  assert.equal(await analyzer()({ references: [], fetcher: () => { throw new Error('Unexpected call'); } }), null);
});
