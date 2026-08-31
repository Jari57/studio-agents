import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';

const resources = [
  'DnaResourcePage', 'VocalsResourcePage', 'ContentMultiplicationPage',
  'BillboardBlueprintPage', 'LegalResourcesPage', 'WhitepapersPage',
];

for (const name of resources) {
  test(`${name} uses the shared indie palette without malformed variable tints`, () => {
    const source = readFileSync(new URL(`../src/components/${name}.jsx`, import.meta.url), 'utf8');
    assert.doesNotThrow(() => parse(source, { sourceType: 'module', plugins: ['jsx'] }));
    for (const token of ['--studio-bg', '--studio-ink', '--studio-muted', '--studio-border']) {
      assert.ok(source.includes(`var(${token})`), `${name} must use ${token}`);
    }
    assert.doesNotMatch(source, /#[0-9a-f]{6,8}\b|rgba?\([\d., ]+\)/i, 'resource chrome must not reintroduce a separate dark/neon palette');
    assert.doesNotMatch(source, /\$\{[\w.]+\}[0-9a-f]{2}\b|var\(--studio-[\w-]+\)[0-9a-f]{2}\b/i, 'CSS variables cannot be concatenated with hex alpha suffixes');
    assert.doesNotMatch(source, /background:\s*'var\(--studio-muted\)'/, 'muted text colors are not light surfaces');
    assert.doesNotMatch(source, /minmax\(\d+px, 1fr\)/, 'resource cards must be able to shrink inside a mobile viewport');
    assert.match(source, /onClick=\{onBack\}/, 'existing navigation must remain reachable');
  });
}

test('solid resource CTAs and numbered badges use theme-aware contrast text', () => {
  for (const name of resources.slice(0, 3)) {
    const source = readFileSync(new URL(`../src/components/${name}.jsx`, import.meta.url), 'utf8');
    assert.match(source, /background: 'var\(--studio-accent\)',\s*color: 'var\(--studio-on-accent\)'/);
  }
  const whitepapers = readFileSync(new URL('../src/components/WhitepapersPage.jsx', import.meta.url), 'utf8');
  assert.match(whitepapers, /background: selectedWhitepaper.color,\s*color: 'var\(--studio-on-accent\)'/);
});

test('approved resource palette has readable body, secondary and button text', () => {
  const luminance = hex => {
    const rgb = hex.match(/[0-9a-f]{2}/gi).map(pair => parseInt(pair, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const css = readFileSync(new URL('../src/studio-theme.css', import.meta.url), 'utf8');
  for (const theme of ['light', 'dark']) {
    const block = css.match(new RegExp(`\\.${theme}-theme\\s*\\{([\\s\\S]*?)\\}`))?.[1];
    assert.ok(block, `${theme} theme must exist`);
    const colors = Object.fromEntries([...block.matchAll(/--studio-([\w-]+):\s*#([0-9a-f]{6});/gi)].map(match => [match[1], match[2]]));
    for (const [foreground, background] of [
      ['ink', 'bg'], ['muted', 'surface'], ['muted', 'surface-alt'],
      ['on-accent', 'accent'], ['on-accent', 'sage'], ['accent', 'accent-soft'],
    ]) {
      const levels = [luminance(colors[foreground]), luminance(colors[background])].sort((a, b) => b - a);
      assert.ok((levels[0] + 0.05) / (levels[1] + 0.05) >= 4.5, `${theme}: ${foreground} on ${background} should meet normal-text AA contrast`);
    }
  }
});
