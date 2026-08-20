import fs from 'node:fs';
import path from 'node:path';

const serverPath = path.resolve('/app/backend/server.js');
const source = fs.readFileSync(serverPath, 'utf8');
const marker = '// Increase timeout for long-running video generation (10 minutes)';
const injection = `\n// Disposable production provider certification route. Removed after the final\n// end-to-end asset canary completes.\nrequire('./finalizationCanary')(app, logger);\n\n`;

if (source.includes("require('./finalizationCanary')(app, logger)")) {
  console.log('Finalization canary already injected.');
  process.exit(0);
}
if (!source.includes(marker)) {
  console.error('Could not find Studio Agents server injection marker.');
  process.exit(1);
}

fs.writeFileSync(serverPath, source.replace(marker, `${injection}${marker}`));
console.log('Finalization canary injected into Railway backend build.');
