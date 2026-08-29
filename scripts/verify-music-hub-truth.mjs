import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('backend/server.js'), 'utf8');
const soundCloudBlock = source.slice(
  source.indexOf('const fetchSoundCloudTrending'),
  source.indexOf('// Main Music Hub endpoint'),
);

if (!soundCloudBlock.includes('https://api.soundcloud.com/tracks')) {
  throw new Error('Music Hub must use the official SoundCloud API.');
}
if (!soundCloudBlock.includes('SOUNDCLOUD_ACCESS_TOKEN')) {
  throw new Error('SoundCloud discovery must require an account-scoped token.');
}
if (!soundCloudBlock.includes('return []')) {
  throw new Error('SoundCloud discovery must fail closed when unavailable.');
}
for (const forbidden of ['Moonlight Echoes', 'Brooklyn Nightcore', 'Gravel Pit AI Remix', 'curated high-quality mock data']) {
  if (soundCloudBlock.includes(forbidden)) throw new Error(`Mock SoundCloud fixture is forbidden: ${forbidden}`);
}

console.log('[music-hub-truth] passed: SoundCloud discovery is provider-backed and fail closed.');
