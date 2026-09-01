import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8');
const finalBannerStyles = css.slice(css.indexOf('/* --- Cookie Banner Re-engineering'));

test('cookie banner uses readable shared-theme foregrounds', () => {
  assert.match(finalBannerStyles, /\.cookie-content p\s*\{[^}]*color: var\(--studio-ink\) !important;/);
  assert.match(finalBannerStyles, /\.cookie-actions button\s*\{[^}]*background: var\(--studio-accent\) !important;[^}]*color: var\(--studio-on-accent\) !important;/);
  assert.doesNotMatch(finalBannerStyles, /color: #e2e8f0/);
});