import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync } from 'fs';

const url = 'https://studioagentsai.com';

const chrome = await chromeLauncher.launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
  logLevel: 'silent',
  connectionPollInterval: 500,
  maxConnectionRetries: 10,
});

let result;
try {
  result = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    logLevel: 'silent',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    screenEmulation: { disabled: true },
  });
} finally {
  // Kill chrome first, ignore any cleanup errors
  try { await chrome.kill(); } catch {}
}

const report = JSON.parse(result.report);
const cats = report.categories;

const scores = {
  Performance:     Math.round((cats.performance?.score ?? 0) * 100),
  Accessibility:   Math.round((cats.accessibility?.score ?? 0) * 100),
  'Best Practices':Math.round((cats['best-practices']?.score ?? 0) * 100),
  SEO:             Math.round((cats.seo?.score ?? 0) * 100),
  PWA:             'See manifest/SW audits below',
};

console.log('\n=== Lighthouse Scores for', url, '===');
for (const [k, v] of Object.entries(scores)) {
  const bar = typeof v === 'number' ? (v >= 90 ? '🟢' : v >= 50 ? '🟡' : '🔴') : '⚪';
  console.log(`  ${bar}  ${k.padEnd(16)} ${v}${typeof v === 'number' ? '/100' : ''}`);
}

// Save full report for detailed inspection
writeFileSync('lighthouse-report.json', result.report);
console.log('\n  Full report saved to lighthouse-report.json\n');

// Key diagnostics
const audits = report.audits;
const fails = Object.entries(audits)
  .filter(([, a]) => a.score !== null && a.score < 0.9 && a.details?.type !== 'table' && a.displayValue)
  .sort((a, b) => (a[1].score ?? 1) - (b[1].score ?? 1))
  .slice(0, 12);

console.log('=== Top Issues ===');
for (const [id, audit] of fails) {
  console.log(`  [${Math.round((audit.score ?? 0) * 100)}] ${audit.title} — ${audit.displayValue}`);
}
