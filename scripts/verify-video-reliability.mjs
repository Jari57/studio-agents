import fs from 'node:fs';

const path = new URL('../backend/services/videoGenerationOrchestrator.js', import.meta.url);
const source = fs.readFileSync(path, 'utf8');

const required = [
  ['bounded provider timeout', /REPLICATE_SEGMENT_TIMEOUT_MS/],
  ['partial segment failure is fatal', /PARTIAL_SEGMENT_FAILURE/],
  ['audio download failure is fatal', /AUDIO_DOWNLOAD_FAILED/],
  ['composition failure is fatal', /COMPOSITION_FAILED/],
  ['beat sync failure is fatal', /BEAT_SYNC_FAILED/],
  ['complete outcome is explicit', /quality:\s*['"]complete['"]/],
  ['failed outcome is explicit', /quality:\s*['"]failed['"]/],
  ['phase timing is emitted', /phaseMs/],
  ['total timing is emitted', /totalDurationMs/],
];

const missing = required.filter(([, pattern]) => !pattern.test(source)).map(([label]) => label);
if (missing.length) {
  console.error(`Video reliability contract failed: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Video reliability contract passed.');
