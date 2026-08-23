'use strict';

const fs = require('node:fs');
const path = require('node:path');

const serverPath = path.resolve(__dirname, '..', 'server.js');
const source = fs.readFileSync(serverPath, 'utf8');
const appliedMarker = 'registerAccountDeletionRoute(app';
const insertionMarker = '// GLOBAL ERROR HANDLER (PRODUCTION HARDENED)';

const registration = `const { registerAccountDeletionRoute } = require('./services/accountDeletion');
registerAccountDeletionRoute(app, {
  verifyFirebaseToken,
  getFirestoreDb,
  getStorageBucket,
  getStripe: () => stripe,
  admin,
  logger,
  hasActiveUserWork: (userId) => {
    const activeStatuses = new Set(['queued', 'processing', 'pending', 'starting']);
    for (const job of videoJobs.values()) {
      if (job?.userId === userId && activeStatuses.has(String(job.status || '').toLowerCase())) return true;
    }
    for (const operation of pendingVideoOps.values()) {
      if (operation?.userId === userId && activeStatuses.has(String(operation.status || '').toLowerCase())) return true;
    }
    return false;
  },
});

`;

if (source.includes(appliedMarker)) {
  if (!source.includes("require('./services/accountDeletion')")) {
    throw new Error('Account deletion route is partially registered.');
  }
  console.log('[account-deletion] complete deletion route already registered');
  process.exit(0);
}

const markerIndex = source.indexOf(insertionMarker);
if (markerIndex === -1 || source.indexOf(insertionMarker, markerIndex + insertionMarker.length) !== -1) {
  throw new Error('Could not find one global error-handler marker; refusing an unsafe patch.');
}

const separatorStart = source.lastIndexOf('// ═', markerIndex);
if (separatorStart === -1) {
  throw new Error('Could not locate the section boundary before the global error handler.');
}

const updated = `${source.slice(0, separatorStart)}${registration}${source.slice(separatorStart)}`;
if (!updated.includes(appliedMarker) || !updated.includes("getStripe: () => stripe")) {
  throw new Error('Account deletion registration postcondition failed.');
}

fs.writeFileSync(serverPath, updated, 'utf8');
console.log('[account-deletion] registered fail-closed complete account deletion');
