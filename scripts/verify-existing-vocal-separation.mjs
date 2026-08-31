// Explicit, billable QA: separate one already-generated Studio QA performance.
// No new song, no identity sample, no automatic retry after a prediction starts.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { separateVocal } = require('../backend/services/musicalVocalService.js');
const [predictionId, outputFile] = process.argv.slice(2);
if (!/^[a-z0-9]+$/.test(predictionId || '') || !outputFile) throw new Error('Provide the existing QA prediction ID and an output file.');
const token = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
if (!token) throw new Error('Replicate is not configured.');
const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
  headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw new Error(`Existing prediction unavailable: HTTP ${response.status}`);
const prediction = await response.json();
if (prediction.status !== 'succeeded' || prediction.model !== 'minimax/music-2.6') throw new Error('Expected a completed MiniMax Studio QA song.');
const songUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
if (typeof songUrl !== 'string' || !songUrl.startsWith('https://')) throw new Error('Existing song output has expired or is unavailable.');

// Exercise the same bounded implementation that Docker injects in production.
const patchSource = fs.readFileSync(new URL('./patch-provider-routing.mjs', import.meta.url), 'utf8');
const definition = patchSource.slice(patchSource.indexOf('const boundedReplicateHelper ='), patchSource.indexOf('if (!source.includes(previousReplicateHelper))'));
const definitionContext = {};
vm.runInNewContext(`${definition}\nthis.helper = boundedReplicateHelper;`, definitionContext);
const context = {
  process, Date, setTimeout,
  logger: { info(message, detail) { console.log(JSON.stringify({ message, operation: detail?.operationName, durationMs: detail?.durationMs })); }, warn(message, detail) { console.log(JSON.stringify({ message, operation: detail?.operationName, code: detail?.code, durationMs: detail?.durationMs })); } },
  fetchWithTimeout: (url, options, timeoutMs) => fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) }),
};
vm.runInNewContext(definitionContext.helper, context);
const vocalUrl = await separateVocal(songUrl, (model, input, operation) => context.runReplicateWithRateLimitRetry(null, model, { input }, operation));
const audioResponse = await fetch(vocalUrl, { signal: AbortSignal.timeout(30000) });
if (!audioResponse.ok) throw new Error(`Vocal download returned HTTP ${audioResponse.status}`);
const bytes = Buffer.from(await audioResponse.arrayBuffer());
if (bytes.length < 1000 || bytes.length > 30 * 1024 * 1024) throw new Error('Vocal file size outside QA limits.');
const target = path.resolve(outputFile);
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, bytes, { flag: 'wx' });
console.log(JSON.stringify({ success: true, outputFile: target, bytes: bytes.length, performanceType: 'isolated-musical-vocal' }));
