const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { EventEmitter } = require('node:events');
const vm = require('node:vm');
const path = require('node:path');

const source = readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
function harness() {
  let handler, cleared = 0;
  const context = { app: { get(_path, fn) { handler = fn; } }, setInterval: () => 1, clearInterval: () => { cleared++; }, Date };
  const start = source.indexOf('const sseClients = new Map();');
  const end = source.indexOf('// ==================== END VOICES API', start);
  vm.runInNewContext(`${source.slice(start, end)}\nthis.send = emitPipelineEvent; this.clients = sseClients;`, context);
  const open = (id = '11111111-1111-4111-8111-111111111111') => {
    const req = new EventEmitter(); req.params = { sessionId: id };
    const res = new EventEmitter(); Object.assign(res, { frames: [], writableEnded: false,
      status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; },
      writeHead(code, headers) { this.statusCode = code; this.headers = headers; },
      flushHeaders() { this.flushed = true; }, write(frame) { this.frames.push(frame); },
      end() { this.writableEnded = true; this.emit('close'); },
    });
    handler(req, res);
    return { req, res, id };
  };
  return { ...context, open, cleared: () => cleared };
}

test('progress is uncompressed and flushed; completion of the GET request does not remove its live response', () => {
  const h = harness(); const { req, res, id } = h.open();
  assert.equal(res.flushed, true);
  assert.match(res.frames[0], /event: connected/);
  req.emit('close');
  h.send(id, 'step', { step: 'vocals', status: 'separating-vocal' });
  assert.match(res.frames.at(-1), /separating-vocal/);
  assert.equal(h.clients.size, 1);
  assert.match(source, /req\.path\.startsWith\('\/api\/pipeline-events\/'\)\) return false/);
  res.emit('close');
  assert.equal(h.clients.size, 0);
  assert.equal(h.cleared(), 1);
});

test('reconnection cannot be removed by the old response and invalid session IDs never allocate a stream', () => {
  const h = harness(); const first = h.open(); const second = h.open(first.id);
  assert.equal(first.res.writableEnded, true);
  first.res.emit('close');
  h.send(first.id, 'step', { step: 'vocals', status: 'generating-musical-performance' });
  assert.match(second.res.frames.at(-1), /generating-musical-performance/);
  assert.equal(h.open('not-a-session').res.statusCode, 400);
  assert.equal(h.clients.size, 1);
  second.res.end();
});
