'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isTransientProviderError,
  runWithProviderRetry,
} = require('../services/providerReliability');

test('provider retries honor Retry-After and recover from HTTP 429', async () => {
  let calls = 0;
  const delays = [];
  const result = await runWithProviderRetry(async () => {
    calls += 1;
    if (calls < 3) {
      const error = new Error('Gemini returned 429 resource exhausted');
      error.status = 429;
      error.response = { headers: { get: () => '2' } };
      throw error;
    }
    return 'generated asset';
  }, {
    sleep: async (delayMs) => delays.push(delayMs),
  });

  assert.equal(result, 'generated asset');
  assert.equal(calls, 3);
  assert.deepEqual(delays, [2000, 2000]);
});

test('provider retries transient network failures with exponential backoff', async () => {
  let calls = 0;
  const delays = [];
  await runWithProviderRetry(async () => {
    calls += 1;
    if (calls === 1) {
      const error = new Error('fetch failed');
      error.code = 'ECONNRESET';
      throw error;
    }
    return true;
  }, {
    baseDelayMs: 500,
    random: () => 0.5,
    sleep: async (delayMs) => delays.push(delayMs),
  });

  assert.equal(calls, 2);
  assert.deepEqual(delays, [500]);
});

test('provider retries overloaded and timeout responses', () => {
  assert.equal(isTransientProviderError({ status: 503 }), true);
  assert.equal(isTransientProviderError(new Error('Model is temporarily overloaded, try again')), true);
  assert.equal(isTransientProviderError({ code: 'ETIMEDOUT' }), true);
});

test('provider fails fast for permanent request errors', async () => {
  let calls = 0;
  await assert.rejects(
    runWithProviderRetry(async () => {
      calls += 1;
      const error = new Error('Invalid prompt');
      error.status = 400;
      throw error;
    }, { sleep: async () => assert.fail('should not sleep') }),
    /Invalid prompt/
  );
  assert.equal(calls, 1);
});