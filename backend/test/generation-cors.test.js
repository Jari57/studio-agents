'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const cors = require('cors');
const { createCorsPolicy } = require('../services/corsPolicy');

async function preflight(origin, method = 'POST') {
  const middleware = cors(createCorsPolicy(['https://studioagentsai.com'], { warn() {} }));
  const server = http.createServer((req, res) => middleware(req, res, (error) => {
    res.statusCode = error ? 403 : 200;
    res.end();
  }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await fetch(`http://127.0.0.1:${server.address().port}/api/generate`, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': method,
        'Access-Control-Request-Headers': 'authorization,content-type,idempotency-key,x-pipeline-session',
      },
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('production preflight permits authenticated idempotent generation and pipeline progress', async () => {
  const response = await preflight('https://studioagentsai.com');
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://studioagentsai.com');
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  const headers = response.headers.get('access-control-allow-headers').toLowerCase().split(',');
  for (const required of ['authorization', 'content-type', 'idempotency-key', 'x-pipeline-session']) {
    assert.ok(headers.includes(required), `Missing browser generation header: ${required}`);
  }
});

test('saved generation and production checkpoints permit PUT and PATCH', async () => {
  for (const method of ['PUT', 'PATCH']) {
    const response = await preflight('https://studioagentsai.com', method);
    assert.equal(response.status, 204);
    assert.ok(response.headers.get('access-control-allow-methods').split(',').includes(method));
  }
});

test('generation header support does not grant untrusted origins access', async () => {
  const response = await preflight('https://untrusted.example');
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});
