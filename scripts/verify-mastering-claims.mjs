import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const backend = readFileSync(new URL('../backend/server.js', import.meta.url), 'utf8');
assert.doesNotMatch(backend, /quality:\s*mixResult\.quality\s*\|\|\s*['"]billboard-ready/i);
assert.doesNotMatch(backend, /message:\s*['"]Billboard-ready/i);
assert.match(backend, /Automated professional mix complete\. Review the render before release\./);
console.log('Verified automated mastering claims remain review-gated.');
