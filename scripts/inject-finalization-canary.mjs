import fs from 'node:fs';
import path from 'node:path';

const serverPath = path.resolve('/app/backend/server.js');
const source = fs.readFileSync(serverPath, 'utf8');
const marker = '// GLOBAL ERROR HANDLER (PRODUCTION HARDENED)';
const registration = "require('./finalizationCanary')(app, logger, { getFirestoreDb, getStorageBucket });";
const injection = `\n// Disposable production provider certification route. Removed after the final\n// end-to-end asset canary completes. It must be registered before the API 404\n// handler below or Express will never reach it. Firestore/Storage make its\n// status durable across Railway replicas.\n${registration}\n\n`;

if (source.includes(registration)) {
  console.log('Finalization canary already injected.');
  process.exit(0);
}
if (!source.includes(marker)) {
  console.error('Could not find Studio Agents pre-404 injection marker.');
  process.exit(1);
}

fs.writeFileSync(serverPath, source.replace(marker, `${injection}${marker}`));
console.log('Durable finalization canary injected before the API 404 handler.');
