import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { ESLint } from '../frontend/node_modules/eslint/lib/api.js';

// Compare the same installed lint rules against HEAD and the working copy.
// Diagnostic only: never rewrites sources or relaxes the repository baseline.
const eslint = new ESLint({ cwd: resolve('frontend') });
for (const file of process.argv.slice(2)) {
  const previous = spawnSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (previous.status !== 0) throw new Error(`Cannot read HEAD:${file}`);
  const [before] = await eslint.lintText(previous.stdout, { filePath: resolve(file) });
  const [after] = await eslint.lintFiles(resolve(file));
  const count = messages => messages.filter(message => message.severity === 2);
  const errorsBefore = count(before.messages);
  const errorsAfter = count(after.messages);
  const signature = message => `${message.ruleId}: ${message.message.split('\n')[0]}`;
  const remaining = errorsBefore.map(signature);
  const added = errorsAfter.filter(message => {
    const index = remaining.indexOf(signature(message));
    if (index < 0) return true;
    remaining.splice(index, 1);
    return false;
  });
  console.log(JSON.stringify({ file, before: errorsBefore.length, after: errorsAfter.length, added: added.map(message => ({ line: message.line, rule: message.ruleId, message: message.message.split('\n')[0] })) }));
}
