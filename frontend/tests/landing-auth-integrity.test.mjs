import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('landing identity follows Firebase or explicit guest mode, not a stale cached uid', () => {
  const source = readFileSync(new URL('../src/components/LandingPage.jsx', import.meta.url), 'utf8');
  const initial = source.slice(source.indexOf('const [isLoggedMember'), source.indexOf('// Scroll listener'));
  assert.doesNotMatch(initial, /hasUserId/);
  assert.match(initial, /auth\.currentUser \|\| isGuest/);
  const cta = source.slice(source.indexOf('const handleCtaClick'), source.indexOf('const handleLogout'));
  assert.doesNotMatch(cta, /hasUserId/);
  assert.match(cta, /auth\?\.currentUser \|\| isGuest/);
});
