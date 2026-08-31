import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = name => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const theme = read('studio-theme.css');
const view = read('components/StudioView.jsx');

test('shared studio theme is loaded after legacy styles', () => {
  const main = read('main.jsx');
  assert.ok(main.indexOf("'./studio-theme.css'") > main.indexOf("'./design-system.css'"));
  for (const name of ['bg','surface','ink','muted','border','accent','sage','on-accent']) {
    assert.ok(theme.match(new RegExp(`--studio-${name}:`, 'g')).length >= 2, name);
  }
});

test('mobile toolbar begins at the first action and preserves access to every tool', () => {
  assert.match(theme, /\.studio-header-actions\s*\{[^}]*justify-content: flex-start;[^}]*overflow-x: auto/s);
  assert.match(theme, /\.studio-header-actions button\s*\{[^}]*min-width: 44px;[^}]*min-height: 44px/s);
  assert.match(theme, /\.studio-main \{ padding-top: 0 !important; \}/);
  assert.match(view, /Use paper theme/);
  assert.match(view, /Use charcoal theme/);
});

test('workspace typography and filled controls remain legible in either palette', () => {
  assert.match(theme, /\.resources-header h1,[^{]*\.gradient-text\s*\{[^}]*color: var\(--studio-accent\);[^}]*-webkit-text-fill-color: currentColor/s);
  assert.match(theme, /\.studio-header-actions \.action-button.secondary\s*\{[^}]*color: var\(--studio-ink\) !important/s);
  assert.doesNotMatch(read('App.css'), /\.light-theme button:not\(\.btn-pill\)/);
  assert.doesNotMatch(read('components/AdminAnalytics.jsx'), /\$\{color\}(?:10|15)/);
  assert.doesNotMatch(view, /var\(--studio-accent\), #6d28d9/);
});
