import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const baselinePath = resolve('scripts/lint-baseline.json');
if (!existsSync(baselinePath)) {
  throw new Error('Lint baseline is missing. Regenerate it intentionally when legacy lint debt is reduced.');
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const targets = [
  { name: 'frontend', cwd: 'frontend', files: ['src'] },
  { name: 'backend', cwd: 'backend', files: ['.'] },
];

const regressions = [];
for (const target of targets) {
  const eslint = resolve(target.cwd, 'node_modules/eslint/bin/eslint.js');
  if (!existsSync(eslint)) {
    throw new Error(`${target.name} dependencies are missing; run npm ci before the lint gate.`);
  }

  const result = spawnSync(process.execPath, [eslint, ...target.files, '--format', 'json'], {
    cwd: resolve(target.cwd),
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  });
  const reports = JSON.parse(result.stdout || '[]');
  const current = Object.fromEntries(reports
    .map((report) => [relative(process.cwd(), report.filePath).replaceAll('\\', '/'), report.errorCount])
    .filter(([, count]) => count > 0));
  const allowed = baseline[target.name] ?? {};

  for (const [file, count] of Object.entries(current)) {
    const allowedCount = allowed[file] ?? 0;
    if (count > allowedCount) regressions.push(`${file}: ${count} errors (baseline ${allowedCount})`);
  }
}

if (regressions.length) {
  throw new Error(`Lint regressions detected:\n${regressions.join('\n')}`);
}

console.log('Lint baseline respected; existing debt did not increase.');
