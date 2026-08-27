import fs from 'node:fs';

const frontend = fs.readFileSync(new URL('../frontend/src/components/StudioView.jsx', import.meta.url), 'utf8');
const demoMode = fs.readFileSync(new URL('../frontend/src/utils/demoMode.js', import.meta.url), 'utf8');
const backend = fs.readFileSync(new URL('../backend/server.js', import.meta.url), 'utf8');

const required = [
  ['production demo mode is disabled', /const DEMO_MODE_ALLOWED = import\.meta\.env\.DEV/],
  ['generation intent is persisted before providers', /status:\s*'pending'/],
  ['generation history can be settled', /app\.put\('\/api\/user\/generations\/:id'/],
  ['video requires a playable URL', /video provider did not return a playable video/],
  ['audio requires playable audio', /provider did not return playable audio/],
  ['provider samples are rejected', /provider returned a sample instead of your requested audio/],
  ['unknown async video payloads refund', /video provider returned no playable asset/],
];

const combined = `${frontend}\n${demoMode}\n${backend}`;
const missing = required.filter(([, pattern]) => !pattern.test(combined)).map(([label]) => label);
if (missing.length) {
  console.error(`Generation truth contract failed: ${missing.join(', ')}`);
  process.exit(1);
}

const forbidden = [
  ['raw Veo objects reported as videos', /output:\s*operationData,\s*type:\s*'video'/],
  ['unknown completed video payloads', /status:\s*'completed',\s*output:\s*result,\s*type:\s*'video'/],
];
const present = forbidden.filter(([, pattern]) => pattern.test(combined)).map(([label]) => label);
if (present.length) {
  console.error(`Generation truth contract failed: ${present.join(', ')}`);
  process.exit(1);
}

console.log('Generation truth contract passed.');
